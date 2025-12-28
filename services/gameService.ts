
// services/gameService.ts
import {
    Player, Team, GameResult, GameState, GameStatus, Recruit, RecruitMotivation, RecruitArchetype,
    DraftPick, DraftProspect, DraftProspectSource, DraftProspectCategory,
    InternationalProspect, NBASimulationResult, NBATeamSimulation,
    Staff, StaffRole, StaffGrade, Sponsor, SponsorOffer, SponsorData,
    SponsorRevenue, Prices, Finances, ProgramWealth, NilNegotiationCandidate,
    Coach, CoachContract, HeadCoachProfile, CoachStyle, CoachSeasonRecord,
    ContractGoal, PendingStaffRenewal, RosterPositions, TrainingFocuses,
    GamePlayerStats, PlayerGameStatsData, // Added PlayerGameStatsData
    NBADraftHistoryEntry, PlayByPlayEvent, League,
    Tournament, TeamHistory, CoachCareerStop, CoachDraftPick, SponsorTier,
    TournamentMatchup, TournamentRegionName, UserSeasonRecord, GameAttendanceRecord,
    ChampionRecord, GameBoxScore, JobOffer, ArenaFacility, MedicalFacility, SeatMix, SeatSegmentKey,
    NilCollectiveProfile, NilCollectiveTier, SponsorQuest, EventPlaybookEntry, ScheduledEvent,
    BroadcastDeal, BroadcastOffer, AttendanceForecast, FanArchetype, PlayerRole, PlayerStreak, PlayerInjury, InjurySeverity, InjuryType, ProspectPersonality, ProgramPreference, RecruitNilPriority, StreakType,
	    BudgetAllocations, BoardExpectations, BoardProfile, BoardMetricKey, BoardMetricResult, FinancialWeekRecord, ConcessionTier, MerchStrategy, MerchPricingSettings, ParkingPricingSettings, LicensingContract, VisitStatus, RelationshipLink, Transfer, StaffSpecialty, GameAdjustment, Dealbreaker,
    CardioData, // Added CardioData
    TeamWealth, NBAContractProfile, // Added TeamWealth import
    SponsorName, // Added SponsorName import
    NBAFreeAgent, NBATransaction, DraftPickRule, DraftPickAsset, // Added NBA types
    NBA_MINIMUM_SALARY, NBA_SALARY_CAP_2025, NBA_LUXURY_TAX_THRESHOLD_2025, // Added constant
    GameEvent, EventType, GameDate // Added Event Types
} from '../types';
import { SCHOOL_INSTITUTIONAL_PROFILES } from '../data/institutional_harvester/school_profiles.nokey.generated';
import {
  SCHOOLS, FIRST_NAMES, LAST_NAMES, SCHOOL_PRESTIGE_RANGES, SCHOOL_CONFERENCES,
  SCHOOL_SPONSORS, INITIAL_SPONSORS, CONFERENCE_STRENGTH, ARENA_CAPACITIES as LEGACY_ARENA_CAPACITIES, SPONSOR_SLOGANS, SCHOOL_ENDOWMENT_OVERRIDES, NBA_TEAMS, INTERNATIONAL_PROGRAMS,
  US_STATES, SCHOOL_STATES
} from '../constants';
import { SCHOOL_LOCATIONS } from '../constants/schoolCoordinates';
import { pickHometownAnchor } from '../constants/hometownAnchors';
import { ARENA_CAPACITIES as AUTHORITATIVE_ARENA_CAPACITIES } from '../new_arena_capacities';
import { NCAA_TOURNAMENT_CHAMPIONS } from '../realWorldData';
import { REAL_NBA_PLAYERS } from '../data/realNbaPlayers';
import { NBA_SALARIES } from '../data/nbaSalaries';
import { REAL_NBA_RATINGS } from '../data/realNbaRatings';
import { ALL_HISTORICAL_DRAFTS } from '../data/allHistoricalDrafts';
import { NBA_DRAFT_PICK_RULES } from '../data/nbaDraftPickSwaps';
import { computeDraftPickOwnership, DraftSlotAssignment } from './draftUtils';
import { ensurePlayerNilProfile, calculateTeamNilBudget, updateNILCollective } from './nilService';
import { generateAlumni, updateAlumniRegistry, generateBaselineAlumniRegistry, recalculateAlumniInfluence, processAlumniWealthGrowth } from './alumniService';
import { generateSponsorQuests } from './questService';
import { getNBASalaryProfileForName, getRealNbaRatingForName } from './nbaData';
import {
    advanceDate,
    getWeekNumber,
    SEASON_START_DATE,
    addDays,
    addDaysISO,
    compareDates,
    isSameDate,
    isSameISO,
    formatDate,
    MONTH_ORDER,
    gameDateToJsDate,
    jsDateToGameDate
} from './dateService';
import { buildSeasonAnchors, generateSeasonSchedule, validateSeasonSchedule } from './seasonScheduleService';
export { buildSeasonAnchors, generateSeasonSchedule, validateSeasonSchedule } from './seasonScheduleService';
import collegeSrsCsv from '../data/College SRS.csv?raw';

// Dev note: Updated services/gameService.ts (calculateRecruitInterestScore, processRecruitingWeek, package-deal helpers),
// types.ts (Recruit.packageDealActive), and src/App.scenario.test.ts (package-deal scenario test).

export const randomBetween = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
export const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
export const normalizeInterest = (value: number): number => clamp(Math.round(value), 0, 100);

type CollegeSrsEntry = { school: string; srs: number };

const normalizeCollegeSchoolKey = (name: string): string => {
    return (name || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/&/g, 'and')
        .replace(/\bst[.\s]/gi, 'saint ')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
};

const parseCollegeSrsCsv = (raw: string): CollegeSrsEntry[] => {
    const lines = (raw || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const headerIdx = lines.findIndex(line => line.startsWith('Rk,School,'));
    if (headerIdx < 0) return [];
    const entries: CollegeSrsEntry[] = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
        const line = lines[i]!;
        if (line.startsWith('Rk,School,')) continue;
        const cols = line.split(',');
        if (cols.length < 8) continue;
        const school = (cols[1] || '').trim();
        // Header: Rk,School,G,W,L,W-L%,SRS,SOS,...
        const srs = Number((cols[6] || '').trim());
        if (!school || !Number.isFinite(srs)) continue;
        entries.push({ school, srs });
    }
    return entries;
};

const COLLEGE_SRS_ENTRIES = parseCollegeSrsCsv(collegeSrsCsv);
const COLLEGE_SRS_SORTED = [...COLLEGE_SRS_ENTRIES].sort((a, b) => b.srs - a.srs);
const COLLEGE_SRS_COUNT = COLLEGE_SRS_SORTED.length;
const COLLEGE_SRS_RANK_BY_KEY: Record<string, number> = {};
COLLEGE_SRS_SORTED.forEach((entry, idx) => {
    const key = normalizeCollegeSchoolKey(entry.school);
    if (!COLLEGE_SRS_RANK_BY_KEY[key]) COLLEGE_SRS_RANK_BY_KEY[key] = idx + 1;
});

const prestigeFromSrsRank = (rank: number): number => {
    const minPrestige = 25;
    const maxPrestige = 99;
    const denom = Math.max(1, COLLEGE_SRS_COUNT - 1);
    const p = clamp((COLLEGE_SRS_COUNT - rank) / denom, 0, 1);
    const gamma = 2.0;
    return clamp(Math.round(minPrestige + Math.pow(p, gamma) * (maxPrestige - minPrestige)), 20, 99);
};

const getBaselinePrestigeForTeam = (teamName: string): number | null => {
    const key = normalizeCollegeSchoolKey(teamName);
    const rank = COLLEGE_SRS_RANK_BY_KEY[key];
    if (!Number.isFinite(rank)) return null;
    return prestigeFromSrsRank(rank);
};

const DEFAULT_TEAM_PRICES: Prices = {
    ticketPrice: 15,
    jerseyPrice: 75,
    merchandisePrice: 25,
    concessionFoodPrice: 10,
    concessionDrinkPrice: 5,
    parkingPrice: 10,
};

const normalizeNonNegativeNumber = (value: number, fallback = 0): number => {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(0, value);
};

const isLikelyDrinkItem = (name: string): boolean => {
    const normalized = (name || '').toLowerCase();
    return /(beer|soda|drink|water|cola|juice|lemonade|tea|coffee)/i.test(normalized);
};

const deriveMaxPriceFromCost = (costPerUnit: number, referenceMarkup: number, referenceMultipleCap: number, absoluteCap: number): number => {
    const cost = normalizeNonNegativeNumber(costPerUnit, 1);
    const reference = Math.max(0.25, cost * referenceMarkup);
    return clamp(reference * referenceMultipleCap, 0.5, absoluteCap);
};

const priceDemandFactor = (price: number, willingness: number, elasticity: number, maxBoost: number): number => {
    const safePrice = Math.max(0.01, normalizeNonNegativeNumber(price, 0.01));
    const safeWillingness = Math.max(0.01, normalizeNonNegativeNumber(willingness, 0.01));
    const ratio = safeWillingness / safePrice;
    const bounded = clamp(ratio, 0, maxBoost);
    return Math.pow(bounded, elasticity);
};

const adjustRookieForNBA = (player: Player): Player => {
    const currentOverall = typeof player.overall === 'number' ? player.overall : calculateOverall(player.stats);
    const drop = randomBetween(10, 22);
    const potentialBoost = randomBetween(5, 20);
    const targetOverall = clamp(currentOverall - drop, 1, 99);
    const targetPotential = clamp(Math.max(targetOverall, (player.potential ?? currentOverall) + potentialBoost), 1, 99);

    const adjusted = { ...player };
    tunePlayerToOverall(adjusted, targetOverall);
    adjusted.overall = clamp(calculateOverall(adjusted.stats), 1, 99);
    adjusted.startOfSeasonOverall = adjusted.overall;
    adjusted.potential = targetPotential;
    return adjusted;
};
export const clampTo40 = (value: number): number => clamp(value, 0, 40);
const DEFAULT_HISTORY_SEASONS = 31;
const BASE_CALENDAR_YEAR = 2024;
const REAL_WORLD_REFERENCE_YEAR = 2025;
const ARENA_CAPACITY_MAP: Record<string, number> = {
    ...LEGACY_ARENA_CAPACITIES,
    ...AUTHORITATIVE_ARENA_CAPACITIES,
};

const normalizeSchoolKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const syncNBAContractForSeason = (player: Player, season: number) => {
    if (!player.contract) return;

    const contract = player.contract;
    if (Array.isArray(contract.yearlySalaries) && contract.yearlySalaries.length > 0) {
        contract.salary = contract.yearlySalaries[0];
        contract.yearsLeft = contract.yearlySalaries.length;
        return;
    }

    const profile = getNBASalaryProfileForName(player.name);
    if (!profile?.yearlySalaries?.length) return;

    // Game `season` 1 corresponds to the 2025-26 salary column in `data/nbaSalaries.ts`.
    const salaryOffset = Math.max(0, season - 1);
    const remaining = profile.yearlySalaries.slice(salaryOffset);
    if (!remaining.length) return;

    contract.yearlySalaries = [...remaining];
    contract.salary = remaining[0];
    contract.yearsLeft = remaining.length;
};

const canonicalSchoolMap = new Map<string, string>();
SCHOOLS.forEach(name => canonicalSchoolMap.set(normalizeSchoolKey(name), name));

const SCHOOL_NAME_ALIASES: Record<string, string> = {
    connecticut: 'UConn',
    brighamyoung: 'BYU',
    louisianastate: 'LSU',
    texaschristian: 'TCU',
    centralflorida: 'UCF',
    virginiacommonwealth: 'VCU',
    saintmarysca: "Saint Mary's",
    saintmarys: "Saint Mary's",
    saintpeters: "Saint Peter's",
    saintjosephs: "Saint Joseph's",
    stjohnsny: "St. John's",
    saintbonaventure: "St. Bonaventure",
    southerncalifornia: 'USC',
    alabamabirmingham: 'UAB',
    northcarolinaasheville: 'UNC Asheville',
    northcarolinagreensboro: 'UNC Greensboro',
    northcarolinawilmington: 'UNC Wilmington',
    southcarolinaupstate: 'USC Upstate',
    texasarlington: 'UT Arlington',
    texasmartin: 'UT Martin',
};

const stripParentheticals = (value: string) => value.replace(/\([^)]*\)/g, '').trim();

const resolveSchoolName = (name: string): string | null => {
    const attempt = (key: string) => {
        if (canonicalSchoolMap.has(key)) return canonicalSchoolMap.get(key)!;
        if (SCHOOL_NAME_ALIASES[key]) return SCHOOL_NAME_ALIASES[key];
        return null;
    };
    const normalized = normalizeSchoolKey(name);
    let resolved = attempt(normalized);
    if (resolved) return resolved;
    const noParens = normalizeSchoolKey(stripParentheticals(name));
    resolved = attempt(noParens);
    if (resolved) return resolved;
    const saintVariant = normalized.replace(/saint/g, 'st');
    resolved = attempt(saintVariant);
    if (resolved) return resolved;
    const saintToSaint = normalized.replace(/st/g, 'saint');
    resolved = attempt(saintToSaint);
    return resolved;
};

const SEAT_SEGMENT_ALLOCATION: Record<SeatSegmentKey, number> = {
    lowerBowl: 0.4,
    studentSection: 0.2,
    upperBowl: 0.3,
    suites: 0.1,
};

const DEFAULT_SEAT_PRICE_MODIFIERS: Record<SeatSegmentKey, number> = {
    lowerBowl: 1,
    studentSection: 0.85,
    upperBowl: 0.95,
    suites: 1.6,
};

const SEGMENT_ARCHETYPE_WEIGHTS: Record<SeatSegmentKey, Partial<Record<FanArchetype, number>>> = {
    lowerBowl: { diehard: 0.35, casual: 0.25, status: 0.2, booster: 0.2 },
    studentSection: { diehard: 0.55, value: 0.45 },
    upperBowl: { value: 0.5, casual: 0.35, diehard: 0.15 },
    suites: { booster: 0.65, status: 0.35 },
};

const SEGMENT_PRICE_TARGET_MULTIPLIER: Record<SeatSegmentKey, number> = {
    lowerBowl: 1.25,
    studentSection: 0.65,
    upperBowl: 0.85,
    suites: 4.2,
};

const SEGMENT_PRICE_SENSITIVITY: Record<SeatSegmentKey, number> = {
    lowerBowl: 0.55,
    studentSection: 0.75,
    upperBowl: 0.65,
    suites: 0.35,
};

const NIL_TIER_DEMAND_BONUS: Record<NilCollectiveTier, number> = {
    local: 0,
    regional: 0.08,
    national: 0.15,
    elite: 0.25,
};

const ZONE_PRICE_LIMITS: Record<SeatSegmentKey, { minPrice: number; maxPrice: number }> = {
    lowerBowl: { minPrice: 25, maxPrice: 180 },
    upperBowl: { minPrice: 12, maxPrice: 120 },
    studentSection: { minPrice: 4, maxPrice: 40 },
    suites: { minPrice: 90, maxPrice: 500 },
};

const normalizeTicketPrice = (ticketPrice: number) => Math.max(1, ticketPrice || 1);

export const getZonePriceBounds = (ticketPrice: number): Record<SeatSegmentKey, { min: number; max: number }> => {
    const base = normalizeTicketPrice(ticketPrice);
    return (Object.keys(ZONE_PRICE_LIMITS) as SeatSegmentKey[]).reduce((acc, key) => {
        const limits = ZONE_PRICE_LIMITS[key];
        acc[key] = {
            min: Number((limits.minPrice / base).toFixed(2)),
            max: Number((limits.maxPrice / base).toFixed(2)),
        };
        return acc;
    }, {} as Record<SeatSegmentKey, { min: number; max: number }>);
};

export const clampZonePriceModifier = (key: SeatSegmentKey, modifier: number, ticketPrice: number): number => {
    const limits = ZONE_PRICE_LIMITS[key];
    const base = normalizeTicketPrice(ticketPrice);
    const desiredPrice = base * (isFinite(modifier) ? modifier : 1);
    const clampedPrice = clamp(desiredPrice, limits.minPrice, limits.maxPrice);
    return Number((clampedPrice / base).toFixed(2));
};

export const resolveZoneTicketPrice = (key: SeatSegmentKey, modifier: number, ticketPrice: number): number => {
    const boundedModifier = clampZonePriceModifier(key, modifier, ticketPrice);
    return Math.max(1, Math.round(normalizeTicketPrice(ticketPrice) * boundedModifier));
};

const buildSeatMix = (capacity: number, base?: SeatMix): SeatMix => {
    const mix: Partial<SeatMix> = { ...base };
    let allocated = 0;
    (Object.keys(SEAT_SEGMENT_ALLOCATION) as SeatSegmentKey[]).forEach((key, index, arr) => {
        const defaultCapacity =
            index === arr.length - 1
                ? Math.max(0, capacity - allocated)
                : Math.round(capacity * SEAT_SEGMENT_ALLOCATION[key]);
        if (!mix[key]) {
            mix[key] = {
                capacity: defaultCapacity,
                priceModifier: DEFAULT_SEAT_PRICE_MODIFIERS[key],
            };
        } else {
            mix[key] = {
                capacity: mix[key]!.capacity || defaultCapacity,
                priceModifier: mix[key]!.priceModifier ?? DEFAULT_SEAT_PRICE_MODIFIERS[key],
            };
        }
        allocated += mix[key]!.capacity;
    });
    return mix as SeatMix;
};

export const ensureArenaFacility = (team: Team): ArenaFacility => {
    const inferredCapacity = team.facilities?.arena?.capacity ?? ARENA_CAPACITY_MAP[team.name] ?? 6000;
    const arenaName = team.facilities?.arena?.name || `${team.name} Arena`;
    const quality = team.facilities?.arena?.quality ?? clamp(team.prestige + randomBetween(-10, 5), 40, 95);
    const suites = team.facilities?.arena?.luxurySuites ?? Math.max(2, Math.round(inferredCapacity * 0.01));
    const seatMix = buildSeatMix(inferredCapacity, team.facilities?.arena?.seatMix);
    const attendanceLog = team.facilities?.arena?.attendanceLog ?? [];
    return {
        name: arenaName,
        capacity: inferredCapacity,
        quality,
        luxurySuites: suites,
        seatMix,
        attendanceLog,
        level: team.facilities?.arena?.level || 1,
        maintenanceCost: 50000,
    };
};

export const ensureMedicalFacility = (team: Team): MedicalFacility => {
    const existing = team.facilities?.medical;
    const baseQuality = existing?.quality ?? clamp(team.prestige + randomBetween(-8, 8), 40, 95);
    const level = existing?.level ?? Math.max(1, Math.min(5, Math.floor(baseQuality / 20)));
    return {
        quality: Math.max(20, Math.min(100, baseQuality)),
        level,
        maintenanceCost: 25000,
    };
};

const NIL_TIERS: { threshold: number; tier: NilCollectiveTier; sponsorFactor: number }[] = [
    { threshold: 80, tier: 'elite', sponsorFactor: 0.35 },
    { threshold: 65, tier: 'national', sponsorFactor: 0.28 },
    { threshold: 45, tier: 'regional', sponsorFactor: 0.22 },
    { threshold: 0, tier: 'local', sponsorFactor: 0.12 },
];

export const createNilCollectiveProfile = (team: Team): NilCollectiveProfile => {
    const prestige = team.prestige || 50;
    const tierConfig = NIL_TIERS.find(entry => prestige >= entry.threshold) ?? NIL_TIERS[NIL_TIERS.length - 1];
    const donorEnergy = team.wealth?.donorMomentum ?? 10;
    const base = Math.round(400000 + prestige * 8000 + donorEnergy * 5000);
    const sponsorMatch = Math.round(base * tierConfig.sponsorFactor * 0.4);
    const alumniContribution = Math.round(base * 0.25 + (team.wealth?.boosterPool ?? 0) * 15000);
    return {
        id: `${team.name}-collective`,
        tier: tierConfig.tier,
        reputation: clamp(prestige + randomBetween(-5, 5), 25, 99),
        baseBudget: base,
        sponsorMatch,
        alumniContribution,
        updatedWeek: 1,
    };
};

const DEFAULT_EVENT_PLAYBOOK: EventPlaybookEntry[] = [
    { id: 'rivalry-rally', label: 'Rivalry Rally', cost: 75000, effect: 'attendance', modifier: 0.08, description: 'City takeover leading into rivalry week. Boosts attendance by ~8%.', requirements: { prestige: 60 }, suiteImpact: 0.1 },
    { id: 'donor-gala', label: 'Donor Gala', cost: 120000, effect: 'nil', modifier: 0.12, description: 'Formal affair that juices collective donations.', requirements: { prestige: 70 }, suiteImpact: 0.2 },
    { id: 'student-stampede', label: 'Student Stampede', cost: 30000, effect: 'sentiment', modifier: 0.15, description: 'Giveaways plus midnight madness lifts student sentiment.' },
    { id: 'alumni-gala', label: 'Alumni Gala', cost: 100000, effect: 'nil', modifier: 0.1, description: 'Reconnect with alumni and boost NIL funds.', requirements: { professionCount: 10 }, professionBoost: 'all', suiteImpact: 0.15 },
    { id: 'pro-networking-night', label: 'Professional Networking Night', cost: 50000, effect: 'recruiting', modifier: 5, description: 'Boosts recruiting prestige by showcasing professional connections.', requirements: { professionCount: 20, prestige: 75 }, professionBoost: 'business' },
    { id: 'startup-pitch-showcase', label: 'Startup Pitch Showcase', cost: 60000, effect: 'nil', modifier: 0.05, description: 'Attracts tech-savvy donors and boosts NIL.', requirements: { professionCount: 5 }, professionBoost: 'tech' },
    { id: 'nba-legends-night', label: 'NBA Legends Night', cost: 150000, effect: 'attendance', modifier: 0.1, description: 'Invite back former NBA players to boost attendance and prestige.', requirements: { prestige: 85 }, suiteImpact: 0.25 },
    { id: 'blueblood-weekend', label: 'Blueblood Weekend', cost: 200000, effect: 'attendance', modifier: 0.15, description: 'Host a premier non-conference opponent for a weekend of events, boosting gate revenue significantly.', requirements: { prestige: 80 }, suiteImpact: 0.3 },
];

const BASE_SPONSOR_QUESTS: SponsorQuest[] = [
    {
        id: 'quest-attendance-1',
        sponsor: 'Nike',
        title: 'Pack the Bowl',
        description: 'Hit 95% capacity in back-to-back home games.',
        type: 'attendance',
        target: 2,
        progress: 0,
        rewardCash: 125000,
        status: 'available',
        expiresWeek: 24,
    },
    {
        id: 'quest-media-1',
        sponsor: 'Adidas',
        title: 'Prime Time Ready',
        description: 'Secure a national broadcast partner before Week 20.',
        type: 'media',
        target: 1,
        progress: 0,
        rewardCash: 90000,
        status: 'available',
        expiresWeek: 20,
    },
    {
        id: 'quest-nil-1',
        sponsor: 'Under Armour',
        title: 'Collective Momentum',
        description: 'Invest at least $500k into the collective this season.',
        type: 'nil',
        target: 500000,
        progress: 0,
        rewardCash: 110000,
        status: 'available',
        expiresWeek: 31,
    },
];

export const buildEventPlaybookCatalog = (): EventPlaybookEntry[] => DEFAULT_EVENT_PLAYBOOK.map(entry => ({ ...entry }));

export const buildSponsorQuestDeck = (week?: number, alumniRegistry?: any): SponsorQuest[] =>
    BASE_SPONSOR_QUESTS.map(quest => ({
        ...quest,
        id: `${quest.id}-${Math.random().toString(36).slice(2, 7)}`,
    }));

export const buildInitialDraftPickAssets = (): DraftPickAsset[] => {
    return NBA_DRAFT_PICK_RULES.flatMap((rule, ruleIndex) => {
        if (rule.type === 'assignment') {
            const id = `${rule.year}-${rule.round}-assignment-${ruleIndex}`;
            const roundLabel = rule.round === 1 ? '1st' : '2nd';
            return [{
                id,
                year: rule.year,
                round: rule.round,
                owner: rule.from,
                note: rule.note,
                description: `${rule.year} ${roundLabel} pick (owed from ${rule.from} to ${rule.to})`,
                sourceTeams: [rule.from],
                ruleId: id
            }];
        }

        const poolLabel = rule.pool.join(' / ');
        return rule.recipients.map((recipient, recipientIndex) => {
            const id = `${rule.year}-${rule.round}-multi-${ruleIndex}-${recipientIndex}`;
            const roundLabel = rule.round === 1 ? '1st' : '2nd';
            const preferenceLabel = recipient.preference ? recipient.preference.replace(/_/g, ' ') : 'designated';
            return {
                id,
                year: rule.year,
                round: rule.round,
                owner: recipient.team,
                note: recipient.note || rule.note,
                description: `${rule.year} ${roundLabel} pick (${recipient.team} controls ${preferenceLabel} of ${poolLabel})`,
                sourceTeams: [...rule.pool],
                ruleId: id
            };
        });
    });
};

// `season` is an ordinal (Season 1 == 2025–26); this converts to the season start year.
export const seasonToCalendarYear = (season: number) => BASE_CALENDAR_YEAR + season;

const INITIAL_NBA_SALARY_YEAR_OFFSET = Math.max(0, seasonToCalendarYear(1) - 1 - REAL_WORLD_REFERENCE_YEAR);
const calendarYearToSeason = (year: number) => year - BASE_CALENDAR_YEAR;

const CHAMPION_BY_YEAR = new Map<number, string>();
const RUNNER_UP_BY_YEAR = new Map<number, string>();
NCAA_TOURNAMENT_CHAMPIONS.forEach(row => {
    const champion = resolveSchoolName(row.champion);
    if (champion) {
        CHAMPION_BY_YEAR.set(row.year, champion);
    }
    if (row.runnerUp) {
        const runnerUp = resolveSchoolName(row.runnerUp);
        if (runnerUp) {
            RUNNER_UP_BY_YEAR.set(row.year, runnerUp);
        }
    }
});

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(value);
};

const getConferenceWealthBonus = (conference: string): number => {
    const tier = (CONFERENCE_STRENGTH[conference] as 'Power' | 'Mid' | 'Low' | undefined) || 'Low';
    if (tier === 'Power') return 8;
    if (tier === 'Mid') return 3;
    return conference === 'Independent' ? 1 : -2;
};

const computeEndowmentScore = (teamName: string, prestige: number, conference: string): number => {
    const override = SCHOOL_ENDOWMENT_OVERRIDES[teamName];
    const conferenceBonus = getConferenceWealthBonus(conference);
    if (override) {
        return clamp(override + randomBetween(-2, 2), 25, 99);
    }
    return clamp(prestige + conferenceBonus + randomBetween(-6, 6), 20, 90);
};

const getTournamentMomentum = (teamName: string, tournament: Tournament | null): number => {
    if (!tournament) return 0;
    const allMatchups = [
        ...tournament.firstFour,
        ...Object.values(tournament.regions).flat(2),
        ...tournament.finalFour,
        ...(tournament.championship ? [tournament.championship] : []),
    ];
    const wins = allMatchups.filter(matchup => {
        if (!matchup.played) return false;
        if (matchup.homeTeam === teamName) return matchup.homeScore > matchup.awayScore;
        if (matchup.awayTeam === teamName) return matchup.awayScore > matchup.homeScore;
        return false;
    }).length;
    let bonus = wins * 1.5;
    if (tournament.finalFour.some(m => m.homeTeam === teamName || m.awayTeam === teamName)) {
        bonus += 2;
    }
    if (tournament.champion === teamName) {
        bonus += 6;
    }
    return bonus;
};

const REGULAR_SEASON_GAMES = 31;
const NATURAL_PROGRESS_TARGET_PER_SEASON = 0.25;
const NATURAL_PER_GAME_RATE = NATURAL_PROGRESS_TARGET_PER_SEASON / REGULAR_SEASON_GAMES;

const getEffectivePotential = (player: Player): number => {
    const reach = clamp(player.potentialReach ?? 1, 0.8, 1);
    const overall = player.overall ?? 0;
    const potential = player.potential ?? overall;
    const effective = overall + (potential - overall) * reach;
    return clamp(effective, 0, potential);
};

const getDevelopmentRateForPlayer = (player: Player): number => {
    const base = clamp(player.developmentRate ?? 1, 0.6, 1.4);
    const dna: PlayerDevelopmentDNA = player.developmentDNA || 'Steady';
    const personalityMultiplier = (() => {
        const traits = player.nilPersonalityTraits ?? [];
        return traits.reduce((multiplier, trait) => {
            if (trait === 'GymRat') return multiplier * 1.08;
            if (trait === 'FilmJunkie') return multiplier * 1.04;
            if (trait === 'BrandExpansionist') return multiplier * 0.97;
            return multiplier;
        }, 1);
    })();

    const year = player.year;
    const dnaMultiplier = (() => {
        if (dna === 'Coaster') return 0.88;
        if (dna === 'LateBloomer') {
            if (year === 'Fr') return 0.75;
            if (year === 'So') return 0.9;
            if (year === 'Jr') return 1.12;
            return 1.25;
        }
        if (dna === 'FastDeveloper') {
            if (year === 'Fr') return 1.22;
            if (year === 'So') return 1.08;
            if (year === 'Jr') return 0.95;
            return 0.88;
        }
        return 1.0;
    })();

    return clamp(base * dnaMultiplier * personalityMultiplier, 0.6, 1.4);
};

const applyGameProgressionToPlayer = (player: Player): Player => {
    const effectivePotential = getEffectivePotential(player);
    const gap = effectivePotential - player.overall;
    if (Math.abs(gap) < 0.05) {
        return { ...player, naturalProgressAccumulator: player.naturalProgressAccumulator ?? 0 };
    }
    const direction = Math.sign(gap);
    const devRate = getDevelopmentRateForPlayer(player);
    const delta = Math.abs(gap) * NATURAL_PER_GAME_RATE * devRate;
    let accumulator = (player.naturalProgressAccumulator ?? 0) + (delta * direction);
    let step = 0;
    if (accumulator >= 1) {
        step = Math.floor(accumulator);
    } else if (accumulator <= -1) {
        step = Math.ceil(accumulator);
    }
    accumulator -= step;

    const updatedPlayer: Player = {
        ...player,
        stats: { ...player.stats },
        naturalProgressAccumulator: accumulator,
    };

    if (step === 0) return updatedPlayer;
    const magnitude = Math.abs(step);
    for (let i = 0; i < magnitude; i++) {
        const sortedKeys = [...OFFSEASON_STAT_KEYS].sort((a, b) =>
            direction > 0
                ? updatedPlayer.stats[a] - updatedPlayer.stats[b]
                : updatedPlayer.stats[b] - updatedPlayer.stats[a]
        );
        const statKey = sortedKeys[0];
        updatedPlayer.stats[statKey] = clamp(updatedPlayer.stats[statKey] + direction, 40, 99);
    }

    updatedPlayer.overall = calculateOverall(updatedPlayer.stats);
    return updatedPlayer;
};

export const seedProgramWealth = (teamName: string, prestige: number, conference: string, fanInterest: number): ProgramWealth => {
    const endowmentScore = computeEndowmentScore(teamName, prestige, conference);
    const demandSignal = (fanInterest || prestige);
    const donationLevel = clamp((endowmentScore * 0.6) + (demandSignal * 0.35) + randomBetween(-8, 8), 12, 110);
    const boosterPool = Math.max(0, Math.round(donationLevel / 12));
    const boosterSentiment = clamp(50 + (donationLevel - 50) * 0.75, 0, 100);
    const boosterLiquidity = Math.max(0, Math.round((boosterPool * 60000) + (donationLevel * 12000)));
    return {
        endowmentScore,
        donationLevel,
        boosterPool,
        donorMomentum: 0,
        boosterSentiment,
        boosterLiquidity,
        alumniNetwork: {
            strength: clamp(15 + donationLevel * 0.35 + boosterPool * 2, 0, 100),
            lastDonation: 0,
            lastDonationSeason: 0,
            lastDonationBreakdown: { nil: 0, facilities: 0, endowment: 0 },
        },
        boosterReasons: [],
    };
};

export const recalculateProgramWealth = (team: Team, tournament: Tournament | null): ProgramWealth => {
    const previous = team.wealth || seedProgramWealth(team.name, team.prestige, team.conference, team.fanInterest);
    const winInfluence = (team.record.wins - 15) * 0.9;
    const prestigeInfluence = (team.prestige - 50) * 0.45;
    const fanInfluence = (team.fanInterest - 50) * 0.35;
    const postseasonInfluence = getTournamentMomentum(team.name, tournament);
    const alumniMomentum = team.alumniRegistry?.summaryStats?.donationMomentum || 0;
    
    const donationLevel = clamp(
        (previous.endowmentScore * 0.55) + winInfluence + prestigeInfluence + fanInfluence + postseasonInfluence + (alumniMomentum * 0.5) + randomBetween(-6, 6),
        10,
        115
    );
    const boosterPool = Math.max(0, Math.round(donationLevel / 12));
    const donorMomentum = clamp(donationLevel - previous.donationLevel, -25, 25);
    const baseSentiment = typeof previous.boosterSentiment === 'number'
        ? previous.boosterSentiment
        : clamp(50 + (previous.donationLevel - 50) * 0.75, 0, 100);
    const boosterSentiment = clamp(
        baseSentiment + donorMomentum * 0.35 + postseasonInfluence * 0.2 + alumniMomentum * 0.15 + randomBetween(-2, 2),
        0,
        100
    );
    const boosterLiquidity = Math.max(0, Math.round((previous.boosterLiquidity ?? 0) * 0.85 + donationLevel * 9000 + boosterPool * 45000));
    const alumniNetwork = previous.alumniNetwork
        ? {
            ...previous.alumniNetwork,
            strength: clamp(previous.alumniNetwork.strength + alumniMomentum * 0.25 + donorMomentum * 0.2, 0, 100),
          }
        : {
            strength: clamp(15 + donationLevel * 0.35 + boosterPool * 2, 0, 100),
            lastDonation: 0,
            lastDonationSeason: 0,
            lastDonationBreakdown: { nil: 0, facilities: 0, endowment: 0 },
          };
    return { ...previous, donationLevel, boosterPool, donorMomentum, boosterSentiment, boosterLiquidity, alumniNetwork };
};

const lerpClamped = (from: number, to: number, t: number) => from + (to - from) * clamp(t, 0, 1);

const ensureBudgetForTeam = (team: Team): Team => {
    const cash = typeof team.budget?.cash === 'number' && Number.isFinite(team.budget.cash) ? team.budget.cash : 0;
    const allocations = team.budget?.allocations
        ? {
            marketing: team.budget.allocations.marketing || 0,
            recruiting: team.budget.allocations.recruiting || 0,
            facilities: team.budget.allocations.facilities || 0,
            staffDevelopment: team.budget.allocations.staffDevelopment || 0,
        }
        : { marketing: 0, recruiting: 0, facilities: 0, staffDevelopment: 0 };
    return { ...team, budget: { cash, allocations } };
};

const ensureWarChestForTeam = (team: Team): Team => {
    if (team.warChest) return team;
    return { ...team, warChest: { discretionaryBudget: 0, requests: [] } };
};

const computeAlumniDonationPass = (team: Team): { total: number; nil: number; facilities: number; endowment: number; reasons: string[] } => {
    const alumni = team.alumniRegistry?.allAlumni || [];
    const boosterSentiment = clamp(team.wealth?.boosterSentiment ?? 50, 0, 100);
    const sentimentMultiplier = lerpClamped(0.85, 1.25, boosterSentiment / 100);
    const alumniMomentum = team.alumniRegistry?.summaryStats?.donationMomentum ?? 0;

    const tierBase: Record<'none' | 'low' | 'medium' | 'high', number> = {
        none: 0,
        low: 25000,
        medium: 150000,
        high: 600000,
    };

    let tierDonations = 0;
    let earningsDonations = 0;
    let bigChecks = 0;

    for (const alum of alumni) {
        const base = tierBase[alum.donationTier] || 0;
        if (!base) continue;
        const alumSentiment = typeof alum.sentiment === 'number' ? clamp(alum.sentiment, 0, 100) : 50;
        const alumMultiplier = lerpClamped(0.7, 1.15, alumSentiment / 100);
        const check = Math.round(base * alumMultiplier);
        tierDonations += check;
        if (check >= 250000) bigChecks += 1;

        const earnings = typeof alum.careerEarnings === 'number' && Number.isFinite(alum.careerEarnings) ? alum.careerEarnings : 0;
        if (earnings > 0 && (alum.proStatus === 'drafted' || alum.proStatus === 'pro_success' || alum.proStatus === 'retired_pro')) {
            const earningsRate = alum.proStatus === 'pro_success' ? 0.0018 : 0.0012;
            const earningsContribution = Math.min(650000, Math.round(earnings * earningsRate));
            earningsDonations += Math.round(earningsContribution * lerpClamped(0.75, 1.2, alumSentiment / 100));
        }
    }

    const successSignal = (team.record.wins - team.record.losses) / 2;
    const successBonus = Math.max(0, Math.round(successSignal * 55000));
    const momentumBonus = Math.round(alumniMomentum * 75000);
    const baseline = Math.round(((team.wealth?.donationLevel ?? 50) * 12000 + (team.wealth?.boosterPool ?? 0) * 65000) * sentimentMultiplier);

    const jitter = randomBetween(-90000, 90000);
    const totalRaw = baseline + tierDonations + earningsDonations + successBonus + momentumBonus + jitter;
    const total = clamp(Math.round(totalRaw), 0, 10000000);

    const nil = Math.round(total * 0.45);
    const facilities = Math.round(total * 0.25);
    const endowment = Math.max(0, total - nil - facilities);

    const components = [
        { label: 'Alumni pro earnings boosted giving.', value: earningsDonations },
        { label: 'Donor tiers produced big checks.', value: tierDonations },
        { label: 'On-court success energized boosters.', value: successBonus },
        { label: 'Alumni momentum shifted donations.', value: momentumBonus },
    ].filter(entry => entry.value > 0).sort((a, b) => b.value - a.value);

    const reasons = components.slice(0, 3).map(entry => entry.label);
    if (!reasons.length && total > 0) reasons.push('Steady booster giving supported the program.');
    if (bigChecks >= 3) reasons.unshift('Multiple major donors wrote seven-figure checks.');

    return { total, nil, facilities, endowment, reasons };
};

const applyOffseasonAlumniBoosterPass = (team: Team, season: number): Team => {
    const withBudget = ensureBudgetForTeam(team);
    const withWarChest = ensureWarChestForTeam(withBudget);
    
    // Process Annual Wealth Growth for Alumni
    if (withWarChest.alumniRegistry) {
        withWarChest.alumniRegistry = processAlumniWealthGrowth(withWarChest.alumniRegistry);
    }
    
    const { total, nil, facilities, endowment, reasons } = computeAlumniDonationPass(withWarChest);

    const calendarYear = seasonToCalendarYear(season + 1);
    const baseNetwork = withWarChest.wealth.alumniNetwork ?? {
        strength: clamp(15 + (withWarChest.wealth.donationLevel - 50) * 0.5, 0, 100),
        lastDonation: 0,
        lastDonationSeason: calendarYear,
        lastDonationBreakdown: { nil: 0, facilities: 0, endowment: 0 },
    };

    if (total <= 0) {
        return {
            ...withWarChest,
            wealth: {
                ...withWarChest.wealth,
                alumniNetwork: {
                    ...baseNetwork,
                    lastDonation: 0,
                    lastDonationSeason: calendarYear,
                    lastDonationBreakdown: { nil: 0, facilities: 0, endowment: 0 },
                },
                boosterReasons: [],
            },
        };
    }

    const baseCollective = withWarChest.nilCollective || createNilCollectiveProfile(withWarChest);
    const updatedCollective: NilCollectiveProfile = {
        ...baseCollective,
        alumniContribution: (baseCollective.alumniContribution || 0) + nil,
    };

    let remainingFacilities = facilities;
    let activeCapitalProjects = withWarChest.activeCapitalProjects ? withWarChest.activeCapitalProjects.map(p => ({ ...p })) : undefined;
    if (activeCapitalProjects?.length && remainingFacilities > 0) {
        for (const project of activeCapitalProjects) {
            if (remainingFacilities <= 0) break;
            if (project.status !== 'Planning' && project.status !== 'Construction') continue;
            const needed = Math.max(0, project.totalCost - project.fundsAllocated);
            if (needed <= 0) continue;
            const contribution = Math.min(needed, remainingFacilities);
            project.fundsAllocated += contribution;
            remainingFacilities -= contribution;
            if (project.fundsAllocated >= project.totalCost) {
                project.fundsAllocated = project.totalCost;
            }
        }
    }

    const updatedWarChest = {
        ...withWarChest.warChest!,
        discretionaryBudget: (withWarChest.warChest!.discretionaryBudget || 0) + remainingFacilities,
    };

    const updatedBudget = {
        ...withWarChest.budget!,
        cash: (withWarChest.budget!.cash || 0) + endowment,
    };

    return {
        ...withWarChest,
        budget: updatedBudget,
        warChest: updatedWarChest,
        nilCollective: updatedCollective,
        activeCapitalProjects,
        wealth: {
            ...withWarChest.wealth,
            boosterLiquidity: updatedWarChest.discretionaryBudget,
            boosterReasons: reasons,
            alumniNetwork: {
                ...baseNetwork,
                lastDonation: total,
                lastDonationSeason: calendarYear,
                lastDonationBreakdown: { nil, facilities, endowment },
                lastPitchResult: reasons[0],
            },
        },
    };
};

export const getWealthRecruitingBonus = (team: Team | null): number => {
    if (!team || !team.wealth) return 0;
    const endowmentBonus = Math.floor(team.wealth.endowmentScore / 18);
    const donationBonus = Math.floor(team.wealth.donationLevel / 20);
    const boosterBonus = Math.round(team.wealth.boosterPool * 0.8);
    return endowmentBonus + donationBonus + boosterBonus;
};

export const getWealthTrainingBonus = (team: Team | null): number => {
    if (!team || !team.wealth) return 0;
    const endowmentBonus = Math.floor(team.wealth.endowmentScore / 20);
    const donationBonus = Math.floor(team.wealth.donationLevel / 24);
    const boosterBonus = Math.round(team.wealth.boosterPool * 0.5);
    return endowmentBonus + donationBonus + boosterBonus;
};

export const calculateRetentionProbability = (player: Player, team: Team, coach?: any): number => 50;

export const calculateOverall = (stats: Player['stats']): number => {
  const weights: Record<keyof Player['stats'], number> = {
    insideScoring: 0.18,
    outsideScoring: 0.18,
    playmaking: 0.14,
    perimeterDefense: 0.14,
    insideDefense: 0.14,
    rebounding: 0.14,
    stamina: 0.08,
  };
  const score = (Object.keys(stats) as (keyof Player['stats'])[])
    .reduce((acc, key) => acc + stats[key] * (weights[key] || 0), 0);
  return Math.round(score);
};

const POSITION_HIERARCHY: RosterPositions[] = ['PG', 'SG', 'SF', 'PF', 'C'];

const SECONDARY_POSITION_PROBABILITY: Record<RosterPositions, { pos: RosterPositions, weight: number }[]> = {
    PG: [{ pos: 'SG', weight: 9 }], 
    SG: [{ pos: 'PG', weight: 8 }, { pos: 'SF', weight: 4 }],
    SF: [{ pos: 'SG', weight: 6 }, { pos: 'PF', weight: 5 }],
    PF: [{ pos: 'SF', weight: 4 }, { pos: 'C', weight: 6 }],
    C:  [{ pos: 'PF', weight: 8 }],
};

const deriveSecondaryFromPrimary = (position: RosterPositions): RosterPositions => {
    if (Math.random() < UNICORN_PROBABILITY) {
        const primaryIndex = POSITION_HIERARCHY.indexOf(position);
        let secondaryIndex: number;
        do {
            secondaryIndex = randomBetween(0, POSITION_HIERARCHY.length - 1);
        } while (Math.abs(primaryIndex - secondaryIndex) <= 1);
        return POSITION_HIERARCHY[secondaryIndex];
    }
    const possibleSecondaries = SECONDARY_POSITION_PROBABILITY[position];
    const totalWeight = possibleSecondaries.reduce((sum, current) => sum + current.weight, 0);
    let random = Math.random() * totalWeight;
    for (const sec of possibleSecondaries) {
        random -= sec.weight;
        if (random <= 0) {
            return sec.pos;
        }
    }
    return possibleSecondaries[0].pos;
};


const UNICORN_PROBABILITY = 0.01;

const POSITION_HEIGHT_RANGES: Record<RosterPositions, { min: number, max: number }> = {
    PG: { min: 72, max: 77 }, // 6'0" - 6'5"
    SG: { min: 75, max: 79 }, // 6'3" - 6'7"
    SF: { min: 77, max: 81 }, // 6'5" - 6'9"
    PF: { min: 79, max: 83 }, // 6'7" - 6'11"
    C:  { min: 81, max: 85 }, // 6'9" - 7'1"
};

const PLAYER_PLAYSTYLE_WEIGHTS_BY_POSITION: Record<RosterPositions, { style: PlayerPlayStyleIdentity; weight: number }[]> = {
    PG: [
        { style: 'FloorGeneral', weight: 5 },
        { style: 'PacePusher', weight: 4 },
        { style: 'ShotCreator', weight: 3 },
        { style: '3PointBomber', weight: 2 },
        { style: '3AndD', weight: 2 },
        { style: 'Connector', weight: 2 },
    ],
    SG: [
        { style: '3PointBomber', weight: 5 },
        { style: 'ShotCreator', weight: 4 },
        { style: '3AndD', weight: 4 },
        { style: 'RimPressure', weight: 3 },
        { style: 'Connector', weight: 2 },
    ],
    SF: [
        { style: '3AndD', weight: 5 },
        { style: 'ShotCreator', weight: 4 },
        { style: 'RimPressure', weight: 3 },
        { style: 'Connector', weight: 3 },
        { style: '3PointBomber', weight: 3 },
        { style: 'DefensiveAnchor', weight: 1 },
    ],
    PF: [
        { style: 'StretchBig', weight: 4 },
        { style: 'GlassCleaner', weight: 4 },
        { style: 'DefensiveAnchor', weight: 3 },
        { style: 'PostHub', weight: 2 },
        { style: 'RimPressure', weight: 2 },
        { style: 'Connector', weight: 2 },
    ],
    C: [
        { style: 'DefensiveAnchor', weight: 5 },
        { style: 'GlassCleaner', weight: 4 },
        { style: 'PostHub', weight: 3 },
        { style: 'StretchBig', weight: 2 },
        { style: 'RimPressure', weight: 2 },
        { style: 'Connector', weight: 1 },
    ],
};

const PLAYSTYLE_STAT_DELTAS: Record<PlayerPlayStyleIdentity, Partial<Player['stats']>> = {
    PacePusher: { stamina: 6, playmaking: 4, perimeterDefense: 2 },
    FloorGeneral: { playmaking: 7, perimeterDefense: 2, stamina: 2 },
    '3PointBomber': { outsideScoring: 8, stamina: 2 },
    RimPressure: { insideScoring: 8, stamina: 2 },
    ShotCreator: { outsideScoring: 5, insideScoring: 3, playmaking: 2 },
    '3AndD': { outsideScoring: 4, perimeterDefense: 6, stamina: 2 },
    DefensiveAnchor: { insideDefense: 8, rebounding: 4 },
    GlassCleaner: { rebounding: 8, insideDefense: 3, stamina: 1 },
    PostHub: { insideScoring: 6, playmaking: 3, rebounding: 2 },
    StretchBig: { outsideScoring: 7, insideDefense: 2 },
    Connector: { playmaking: 4, perimeterDefense: 3, stamina: 2 },
};

const pickWeighted = <T,>(items: { value: T; weight: number }[]): T => {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.value;
    }
    return items[0]!.value;
};

const pickPlayerPlayStyleIdentity = (position: RosterPositions): PlayerPlayStyleIdentity => {
    const pool = PLAYER_PLAYSTYLE_WEIGHTS_BY_POSITION[position] || [{ style: 'Connector', weight: 1 }];
    return pickWeighted(pool.map(p => ({ value: p.style, weight: p.weight })));
};

const pickPlayerDevelopmentDNA = (): PlayerDevelopmentDNA => {
    return pickWeighted([
        { value: 'FastDeveloper', weight: 18 },
        { value: 'Steady', weight: 52 },
        { value: 'LateBloomer', weight: 20 },
        { value: 'Coaster', weight: 10 },
    ]);
};

export const createPlayer = (year: Player['year'], forcedPosition?: RosterPositions): Player => {
  const positionWeights: Record<RosterPositions, number> = { PG: 6, SG: 5, SF: 5, PF: 4, C: 4 };
  const weightedPositions = Object.entries(positionWeights).flatMap(([pos, weight]) => Array(weight).fill(pos as RosterPositions));
  const position = forcedPosition || pickRandom(weightedPositions);
    let secondaryPosition: RosterPositions | undefined = undefined;

    if (Math.random() < 0.7) {
        secondaryPosition = deriveSecondaryFromPrimary(position);
    }
  
    const heightRange = POSITION_HEIGHT_RANGES[position];
    const height = randomBetween(heightRange.min, heightRange.max);

  const stats = {
    insideScoring: randomBetween(40, 75),
    outsideScoring: randomBetween(40, 75),
    playmaking: randomBetween(40, 75),
    perimeterDefense: randomBetween(40, 75),
    insideDefense: randomBetween(40, 75),
    rebounding: randomBetween(40, 75),
    stamina: randomBetween(55, 95),
  };

    const playStyleIdentity = pickPlayerPlayStyleIdentity(position);
    const deltas = PLAYSTYLE_STAT_DELTAS[playStyleIdentity] || {};
    (Object.keys(deltas) as (keyof Player['stats'])[]).forEach(key => {
        const delta = deltas[key] ?? 0;
        stats[key] = clamp(stats[key] + delta, 35, 99);
    });

  const overall = calculateOverall(stats);

    let potential = randomBetween(overall, 95);
    const idealHeight = (POSITION_HEIGHT_RANGES[position].min + POSITION_HEIGHT_RANGES[position].max) / 2;
    const heightDifference = Math.abs(height - idealHeight);
    if (heightDifference <= 1) {
        potential = clamp(potential + randomBetween(1, 3), overall, 99);
    }

    const developmentDNA = pickPlayerDevelopmentDNA();
    const developmentRateBase =
        developmentDNA === 'FastDeveloper' ? 1.18 :
        developmentDNA === 'LateBloomer' ? 0.92 :
        developmentDNA === 'Coaster' ? 0.90 :
        1.0;
    const developmentRate = clamp(developmentRateBase + randomBetween(-6, 6) / 100, 0.75, 1.25);
    const potentialReachBase =
        developmentDNA === 'Coaster' ? 0.86 :
        developmentDNA === 'Steady' ? 0.93 :
        0.97;
    const potentialReach = clamp(potentialReachBase + randomBetween(-5, 3) / 100, 0.8, 1.0);

  const player: Player = {
    id: crypto.randomUUID(),
    name: `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`,
    position,
    secondaryPosition,
    height,
    year,
    overall,
    potential,
    stats,
    homeState: pickRandom(US_STATES),
    starterPosition: null,
    startOfSeasonOverall: overall,
    xFactor: randomBetween(1, 10),
    seasonStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 },
    isTargeted: false,
    naturalProgressAccumulator: 0,
    minutesLocked: false,
    role: 'Role Player',
    streak: { type: 'Neutral', duration: 0, impact: {} },
    morale: 80,
        playStyleIdentity,
        developmentDNA,
        developmentRate,
        potentialReach,
  };
  return ensurePlayerNilProfile(player);
};

const generateRecruitMotivations = (archetype: RecruitArchetype): RecruitMotivation => {
    const m = { proximity: 50, playingTime: 50, nil: 50, exposure: 50, relationship: 50, development: 50, academics: 50 };
    switch(archetype) {
        case 'Mercenary': 
            m.nil = randomBetween(80, 100); 
            m.playingTime = randomBetween(70, 100); 
            m.relationship = randomBetween(10, 40);
            break;
        case 'HometownHero':
            m.proximity = randomBetween(85, 100);
            m.relationship = randomBetween(70, 95);
            m.exposure = randomBetween(20, 60);
            break;
        case 'ProcessTrustor':
            m.development = randomBetween(80, 100);
            m.playingTime = randomBetween(10, 50);
            m.academics = randomBetween(40, 80);
            break;
        case 'FameSeeker':
            m.exposure = randomBetween(85, 100);
            m.nil = randomBetween(60, 90);
            m.proximity = randomBetween(0, 50);
            break;
    }
    (Object.keys(m) as (keyof RecruitMotivation)[]).forEach(key => {
        m[key] = clamp(m[key] + randomBetween(-10, 10), 0, 100);
    });
	    return m;
	};

const HOMETOWN_CITY_POOL = [
    'Springfield', 'Riverside', 'Franklin', 'Greenville', 'Bristol', 'Clinton', 'Fairview', 'Salem', 'Madison',
    'Georgetown', 'Arlington', 'Ashland', 'Oxford', 'Milton', 'Newport', 'Lebanon', 'Centerville', 'Clayton',
    'Cedar Grove', 'Lakeview', 'Maplewood', 'Pinehurst', 'Kingston', 'Canton', 'Auburn', 'Bloomington', 'Dover',
    'Carrollton', 'Farmington', 'Westfield', 'Hillsboro', 'Oak Ridge', 'Somerset', 'Highland', 'Rocky Mount',
    'Chester', 'Montgomery', 'Burlington', 'Hampton', 'Concord', 'Mansfield', 'Jackson', 'Cleveland', 'Dayton',
    'Aurora', 'Hamilton', 'Cambridge', 'Wilmington', 'York', 'Hudson', 'Lancaster', 'Marion', 'Monroe',
    'Bartlett', 'Fayetteville', 'Glenwood', 'Norwood', 'Bridgeport', 'Shelby', 'Portland', 'Smyrna',
];

const HIGH_SCHOOL_SUFFIXES = ['High', 'Central', 'North', 'South', 'East', 'West', 'Prep', 'Academy', 'Catholic', 'Charter'];
const HIGH_SCHOOL_PREFIXES = ['St.', 'Bishop', 'Mount', 'Lake', 'North', 'South', 'East', 'West'];

const PLAY_STYLE_TAGS_BY_POSITION: Record<string, string[]> = {
    PG: ['primary creator', 'pick-and-roll maestro', 'pace pusher', 'floor general', 'point-of-attack defender'],
    SG: ['3PT sniper', 'shot creator', 'two-way wing', 'movement shooter', 'off-ball pest'],
    SF: ['two-way wing', 'slasher', 'connector passer', 'switchable defender', 'secondary creator'],
    PF: ['stretch 4', 'rim runner', 'rebounding machine', 'switchable defender', 'short-roll playmaker'],
    C: ['rim protector', 'paint anchor', 'glass cleaner', 'lob threat', 'post scorer'],
};

const ATHLETICISM_TIERS: Recruit['athleticismTier'][] = ['A', 'B', 'C', 'D'];

const buildHighSchoolName = (city: string): { name: string; type: Recruit['highSchoolType'] } => {
    const roll = Math.random();
    const type: Recruit['highSchoolType'] =
        roll < 0.72 ? 'Public' : roll < 0.9 ? 'Private' : 'Prep';

    const suffix = pickRandom(HIGH_SCHOOL_SUFFIXES);
    const first = pickRandom(FIRST_NAMES);
    const last = pickRandom(LAST_NAMES);
    if (type === 'Public') {
        const patternRoll = Math.random();
        if (patternRoll < 0.45) return { name: `${city} ${suffix}`, type };
        if (patternRoll < 0.75) return { name: `${city} ${last} ${suffix}`, type };
        return { name: `${city} ${first} ${last} ${suffix}`, type };
    }
    const prefix = pickRandom(HIGH_SCHOOL_PREFIXES);
    const patternRoll = Math.random();
    if (patternRoll < 0.55) return { name: `${prefix} ${last} ${suffix}`, type };
    return { name: `${prefix} ${first} ${last} ${suffix}`, type };
};

const generateApproxRecruitRanks = (stars: number, position: string): { nationalRank: number; positionalRank: number } => {
    // Lightweight "247-ish" ranges: keeps it believable without needing global sorting.
    const nationalRange: Record<number, [number, number]> = {
        5: [1, 35],
        4: [20, 115],
        3: [80, 235],
        2: [200, 320],
        1: [285, 450],
    };
    const [minN, maxN] = nationalRange[stars] || [150, 350];
    const nationalRank = randomBetween(minN, maxN);

    const posCap =
        position === 'C' ? 35 :
        position === 'PF' ? 55 :
        position === 'SF' ? 70 :
        position === 'SG' ? 85 :
        95; // PG and combo guards are deeper
    const positionalRank = clamp(Math.round((nationalRank / maxN) * posCap + randomBetween(-6, 8)), 1, posCap);

    return { nationalRank, positionalRank };
};

const scoreRecruitForBoard = (r: Recruit): number => {
    // Keep ranks aligned with the in-game "board" sorting (overall + potential), then stars.
    const stars = r.stars ?? 0;
    const overall = r.overall ?? 0;
    const potential = r.potential ?? 0;
    const hype = r.hypeLevel ?? 0;
    return (overall + potential) * 10_000 + stars * 100 + hype;
};

export const recomputeRecruitBoardRanks = (recruits: Recruit[]): Recruit[] => {
    const scored = recruits.map(r => ({ id: r.id, pos: r.position, score: scoreRecruitForBoard(r) }));
    scored.sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));
    const nationalById = new Map<string, number>();
    scored.forEach((s, idx) => nationalById.set(s.id, idx + 1));

    const posGroups = new Map<string, { id: string; score: number }[]>();
    scored.forEach(s => {
        const key = s.pos || 'UNK';
        const bucket = posGroups.get(key) || [];
        bucket.push({ id: s.id, score: s.score });
        posGroups.set(key, bucket);
    });

    const posRankById = new Map<string, number>();
    for (const [, bucket] of posGroups.entries()) {
        bucket.sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));
        bucket.forEach((b, idx) => posRankById.set(b.id, idx + 1));
    }

    return recruits.map(r => ({
        ...r,
        nationalRank: nationalById.get(r.id) ?? r.nationalRank,
        positionalRank: posRankById.get(r.id) ?? r.positionalRank,
        rankSource: 'S16 Board',
    }));
};

export const createRecruit = (): Recruit => {
	    const basePlayer = createPlayer('Fr');
	    const playerPart: Player = {
	        ...basePlayer,
        stats: { ...basePlayer.stats },
        seasonStats: { ...basePlayer.seasonStats },
    };
    if (!playerPart.secondaryPosition && Math.random() < 0.5) {
        playerPart.secondaryPosition = deriveSecondaryFromPrimary(playerPart.position);
    }

    const starRoll = Math.random();
    let stars: 1 | 2 | 3 | 4 | 5 = 3;
    if (starRoll > 0.985) stars = 5;
    else if (starRoll > 0.94) stars = 4;
    else if (starRoll > 0.55) stars = 3;
    else if (starRoll > 0.2) stars = 2;
    else stars = 1;

    const starBands: Record<number, { overall: [number, number]; potential: [number, number]; interest: [number, number] }> = {
        5: { overall: [84, 92], potential: [90, 97], interest: [60, 80] },
        4: { overall: [76, 86], potential: [86, 94], interest: [45, 65] },
        3: { overall: [68, 78], potential: [78, 88], interest: [32, 50] },
        2: { overall: [60, 72], potential: [70, 84], interest: [20, 35] },
        1: { overall: [52, 64], potential: [62, 76], interest: [10, 24] },
    };

    const targetOverall = randomBetween(starBands[stars].overall[0], starBands[stars].overall[1]);
    if (playerPart.overall < targetOverall) {
        const delta = targetOverall - playerPart.overall;
        const statKeys = Object.keys(playerPart.stats) as (keyof Player['stats'])[];
        statKeys.forEach(statKey => {
            playerPart.stats[statKey] = clamp(playerPart.stats[statKey] + Math.max(1, Math.round(delta * (0.35 + Math.random() * 0.25))), 40, 95);
        });
        playerPart.overall = calculateOverall(playerPart.stats);
    }

    const potentialFloor = Math.max(playerPart.overall + 1, starBands[stars].potential[0]);
    const targetPotential = randomBetween(potentialFloor, starBands[stars].potential[1]);
    playerPart.potential = clamp(Math.max(playerPart.potential, targetPotential), playerPart.overall, 99);
    playerPart.startOfSeasonOverall = playerPart.overall;

	    const interestRange = starBands[stars].interest;
	    const baseInterest = randomBetween(interestRange[0], interestRange[1]);
		    const hometownState = playerPart.homeState || pickRandom(US_STATES);
            const hometownStateCode = normalizeStateCode(hometownState);
            const anchor = pickHometownAnchor(hometownStateCode, `${playerPart.id}:${hometownStateCode}`) || null;
		    const hometownCity = anchor?.city || pickRandom(HOMETOWN_CITY_POOL);
		    const highSchool = buildHighSchoolName(hometownCity);
		    const { nationalRank, positionalRank } = generateApproxRecruitRanks(stars, playerPart.position);
	
	    const archetype: RecruitArchetype = pickRandom(['Mercenary', 'HometownHero', 'ProcessTrustor', 'FameSeeker']);
	    const motivations = generateRecruitMotivations(archetype);
		    const region = getRegionForState(hometownState);
		    const metroArea = Math.random() < 0.25 ? hometownCity : undefined;
		    const hypeLevel = clamp(Math.round((stars * 18) + randomBetween(-8, 10) + (nationalRank <= 50 ? 10 : 0)), 0, 100);
		    const favoredCoachStyle = pickRandom(['Offense', 'Defense', 'Player Development', 'Recruiting', 'Tempo', 'Balanced'] as HeadCoachProfile['style'][]);
	
	    const height = playerPart.height || 78;
	    const baseWingspan = height + (playerPart.position === 'C' ? 6 : playerPart.position === 'PF' ? 5 : playerPart.position === 'SF' ? 4 : playerPart.position === 'SG' ? 3 : 2);
	    const wingspan = clamp(baseWingspan + randomBetween(-2, 3), height - 1, height + 10);
	
	    const weightBaseline =
	        playerPart.position === 'C' ? 235 :
	        playerPart.position === 'PF' ? 220 :
	        playerPart.position === 'SF' ? 205 :
	        playerPart.position === 'SG' ? 190 :
	        180;
	    const weight = clamp(Math.round(weightBaseline + (height - 75) * 4 + randomBetween(-12, 14)), 155, 290);
	
	    const athleticismTier =
	        stars >= 5 ? pickRandom(['A', 'A', 'B']) :
	        stars === 4 ? pickRandom(['A', 'B', 'B', 'C']) :
	        stars === 3 ? pickRandom(['B', 'B', 'C', 'C']) :
	        pickRandom(ATHLETICISM_TIERS);
	
	    const coachability = clamp(Math.round(randomBetween(35, 95) + (athleticismTier === 'A' ? -5 : 0) + (archetype === 'ProcessTrustor' ? 10 : 0)), 0, 100);
	    const durability = clamp(Math.round(randomBetween(45, 95) + (coachability * 0.1)), 0, 100);
	    const injuryRisk = clamp(100 - durability + randomBetween(-6, 12), 0, 100);
	
	    const baseTagPool = PLAY_STYLE_TAGS_BY_POSITION[playerPart.position] || ['high motor', 'tough shot making', 'connector'];
	    const tagCount = clamp(2 + (stars >= 4 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0), 2, 4);
        const playStyleHint = (() => {
            const style = playerPart.playStyleIdentity;
            if (style === 'PacePusher') return 'pace pusher';
            if (style === 'FloorGeneral') return 'floor general';
            if (style === '3PointBomber') return '3PT sniper';
            if (style === 'RimPressure') return playerPart.position === 'C' ? 'lob threat' : 'slasher';
            if (style === 'ShotCreator') return 'shot creator';
            if (style === '3AndD') return 'two-way wing';
            if (style === 'DefensiveAnchor') return playerPart.position === 'C' ? 'paint anchor' : 'switchable defender';
            if (style === 'GlassCleaner') return 'glass cleaner';
            if (style === 'PostHub') return 'post scorer';
            if (style === 'StretchBig') return playerPart.position === 'PF' ? 'stretch 4' : '3PT sniper';
            if (style === 'Connector') return 'connector passer';
            return null;
        })();

		    let playStyleTags = [...baseTagPool]
		        .map(value => ({ value, sort: Math.random() }))
		        .sort((a, b) => a.sort - b.sort)
		        .slice(0, tagCount)
		        .map(({ value }) => value);
        if (playStyleHint && !playStyleTags.includes(playStyleHint)) {
            if (playStyleTags.length) playStyleTags[0] = playStyleHint;
            else playStyleTags = [playStyleHint];
        }
	
	    const familyInfluenceNote =
	        motivations.proximity >= 75 ? 'Family-driven; proximity matters.' :
	        motivations.proximity <= 25 ? 'Independent; open to moving away.' :
	        undefined;
	
	    const { year, starterPosition, seasonStats, ...recruitData } = playerPart;
	    const personalityTrait = pickRandom(PROSPECT_PERSONALITIES);
	    const nilPriority = pickRandom(NIL_PRIORITY_OPTIONS);
    const preferredProgramAttributes: ProgramPreference = {
        academics: randomBetween(25, 95),
        marketExposure: randomBetween(15, 90),
        communityEngagement: randomBetween(20, 85),
    };

        if (personalityTrait === 'Homebody') {
            motivations.proximity = clamp(motivations.proximity + randomBetween(12, 24), 0, 100);
        } else if (personalityTrait === 'Wanderlust') {
            motivations.proximity = clamp(motivations.proximity - randomBetween(15, 28), 0, 100);
        } else if (personalityTrait === 'Family Feud') {
            motivations.relationship = clamp(motivations.relationship - randomBetween(18, 32), 0, 100);
        } else if (personalityTrait === 'Gym Rat') {
            motivations.development = clamp(motivations.development + randomBetween(15, 30), 0, 100);
        }

	    // Hard dealbreakers can now be more logical
	    let dealbreaker: Dealbreaker = pickRandom(['None', 'None', 'None', 'None']);
    if (motivations.proximity > 90) dealbreaker = pickRandom(['Proximity', 'Proximity', 'None']);
    if (motivations.nil > 90) dealbreaker = pickRandom(['NIL', 'NIL', 'None']);
    if (motivations.playingTime > 90) dealbreaker = pickRandom(['PlayingTime', 'None']);
    if (motivations.academics > 90) dealbreaker = pickRandom(['Academics', 'None']);

        const resilience = randomBetween(30, 80);

        const decisionStyle: RecruitDecisionStyle = (() => {
            const base =
                (baseInterest >= 65 || coachability >= 75) ? 'Decisive' :
                (baseInterest <= 25 || coachability <= 45) ? 'Indecisive' :
                'Balanced';
            if (resilience >= 70 && base !== 'Indecisive') return 'Decisive';
            if (resilience <= 38 && base !== 'Decisive') return 'Indecisive';
            return base;
        })();

        const commitmentStyle: RecruitCommitmentStyle = (() => {
            if (archetype === 'FameSeeker' || motivations.exposure >= 85) return 'FrontRunner';
            if (archetype === 'HometownHero' && motivations.proximity >= 80) return 'Underdog';
            if (motivations.playingTime >= 85 && motivations.exposure <= 55) return 'Underdog';
            return 'Balanced';
        })();

        const fitStrictness = clamp(
            Math.round(
                40 +
                Math.max(motivations.proximity, motivations.playingTime, motivations.nil, motivations.exposure, motivations.academics) * 0.45 -
                Math.min(motivations.proximity, motivations.playingTime, motivations.nil, motivations.exposure, motivations.academics) * 0.15 +
                (dealbreaker !== 'None' ? 12 : 0) +
                (decisionStyle === 'Decisive' ? 6 : decisionStyle === 'Indecisive' ? -6 : 0) +
                randomBetween(-10, 10)
            ),
            0,
            100
        );

	    return {
	        ...recruitData,
	        verbalCommitment: null,
	        userHasOffered: false,
	        cpuOffers: [],
	        interest: baseInterest,
	        stars,
	        declinedOffers: [],
	        isTargeted: false,
	        personalityTrait,
	        nilPriority,
	        preferredProgramAttributes,
	        archetype,
	        hometownCity,
	        hometownState,
            hometownLat: anchor?.lat,
            hometownLon: anchor?.lon,
	        highSchoolName: highSchool.name,
	        highSchoolType: highSchool.type,
	        region,
	        metroArea,
	        nationalRank,
	        positionalRank,
	        rankSource: pickRandom(['247Sports', 'Rivals', 'ESPN', 'On3']),
	        playStyleTags,
	        wingspan,
	        weight,
	        athleticismTier,
	        injuryRisk,
	        durability,
	        coachability,
	        hypeLevel,
	        favoredCoachStyle,
	        familyInfluenceNote,
	        offerHistory: [],
	        visitHistory: [],
	        motivations,
	        teamMomentum: {},
	        recruitmentStage: 'Open',
	        relationships: [],
	        dealbreaker,
	        visitStatus: 'None',
	        homeState: hometownState,
	        state: hometownState,
	        softCommitment: false,
	        resilience,
            decisionStyle,
            commitmentStyle,
            fitStrictness,
	    };
	};

const INTERNATIONAL_TRAITS = [
    'crafty shot creation', 'NBA range', 'plus positional size', 'elite feel for the game',
    'switchable defense', 'above-the-rim finishing', 'ambidextrous passing', 'tough shot making',
    'soft touch in the paint', 'high motor rebounding', 'late clock composure'
];

const PROSPECT_PERSONALITIES: ProspectPersonality[] = [
    'Loyal',
    'NBA Bound',
    'Academically Focused',
    'Local Hero',
    'Spotlight Seeker',
    'Homebody',
    'Wanderlust',
    'Family Feud',
    'Gym Rat',
];

const NIL_PRIORITY_OPTIONS: RecruitNilPriority[] = [
    'LongTermStability',
    'DraftStock',
    'AcademicSupport',
    'BrandExposure',
];

const buildProgramPreference = (): ProgramPreference => ({
    academics: randomBetween(25, 95),
    marketExposure: randomBetween(15, 90),
    communityEngagement: randomBetween(20, 85),
});

const COACH_STYLES: HeadCoachProfile['style'][] = ['Offense', 'Defense', 'Player Development', 'Recruiting', 'Tempo'];

type CoachProfileGenerationOptions = {
    historyMap?: Record<string, TeamHistory[]>;
    teamPrestigeMap?: Record<string, number>;
    currentSeason?: number;
    seedCurrentTeamHistory?: boolean;
    earliestSeason?: number;
};

const pickCoachAge = () => {
    const roll = Math.random();
    if (roll < 0.65) return randomBetween(35, 44);
    if (roll < 0.85) return randomBetween(45, 54);
    if (roll < 0.95) return randomBetween(55, 64);
    return randomBetween(29, 70);
};

const resolveEarliestSeason = (options?: CoachProfileGenerationOptions): number => {
    if (options?.earliestSeason !== undefined) return options.earliestSeason;
    if (!options?.historyMap) return 1 - DEFAULT_HISTORY_SEASONS;
    let minSeason = Infinity;
    Object.values(options.historyMap).forEach(entries => {
        entries?.forEach(entry => {
            if (entry.season < minSeason) minSeason = entry.season;
        });
    });
    return Number.isFinite(minSeason) ? minSeason : 1 - DEFAULT_HISTORY_SEASONS;
};

const pickSchoolExcluding = (exclude: Set<string>): string => {
    let school = pickRandom(SCHOOLS);
    let guard = 0;
    while (exclude.has(school) && guard < 20) {
        school = pickRandom(SCHOOLS);
        guard++;
    }
    return school;
};

const prestigeForTeam = (teamName: string, fallback: number, map?: Record<string, number>): number => {
    if (map && map[teamName]) return map[teamName];
    const baseline = getBaselinePrestigeForTeam(teamName);
    if (baseline != null) return baseline;
    const range = SCHOOL_PRESTIGE_RANGES[teamName];
    if (range) return Math.round((range.min + range.max) / 2);
    return fallback;
};

const simulateCareerTotals = (
    stops: CoachCareerStop[],
    finalHistoricalSeason: number,
    currentTeamName: string,
    currentPrestige: number,
    prestigeMap?: Record<string, number>,
): { wins: number; losses: number; draftedPlayers: CoachDraftPick[] } => {
    let wins = 0;
    let losses = 0;
    const draftedPlayers: CoachDraftPick[] = [];
    stops.forEach(stop => {
        const stopPrestige = stop.teamName === currentTeamName
            ? currentPrestige
            : prestigeForTeam(stop.teamName, currentPrestige, prestigeMap);
        const stopEnd = stop.endSeason ?? finalHistoricalSeason;
        const stopLastSeason = Math.min(stopEnd, finalHistoricalSeason);
        if (stop.startSeason > stopLastSeason) return;
        for (let season = stop.startSeason; season <= stopLastSeason; season++) {
            if (season > stopLastSeason) break;
            const regularWins = clamp(randomBetween(Math.round(stopPrestige / 4) - 2, Math.round(stopPrestige / 4) + 3), 6, 27);
            const postseasonWins = Math.random() < (stopPrestige / 130) ? randomBetween(1, 4) : 0;
            const seasonWins = regularWins + postseasonWins;
            const seasonLosses = (31 - regularWins) + (postseasonWins > 0 ? 1 : 0);
            wins += seasonWins;
            losses += seasonLosses;
            const pickChance = Math.max(0.04, stopPrestige / 220);
            if (Math.random() < pickChance) {
                draftedPlayers.push({
                    player: `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`,
                    team: stop.teamName,
                    nbaTeam: pickRandom(NBA_TEAMS).name,
                    round: randomBetween(1, 2),
                    pick: randomBetween(1, 30),
                    season,
                });
            }
        }
    });
    draftedPlayers.sort((a, b) => b.season - a.season);
    return { wins, losses, draftedPlayers: draftedPlayers.slice(0, 8) };
};

export const createHeadCoachProfile = (
    teamName: string,
    prestige: number,
    startSeason: number = 1,
    options: CoachProfileGenerationOptions = {},
): HeadCoachProfile => {
    const currentSeason = options.currentSeason ?? startSeason ?? 1;
    const finalHistoricalSeason = currentSeason - 1;
    const earliestSeason = resolveEarliestSeason(options);
    const availableSeasonWindow = Math.max(1, finalHistoricalSeason - earliestSeason + 1);
    const totalSeasonsTarget = clamp(randomBetween(3, 9), 1, availableSeasonWindow);
    const desiredCurrentTeamSeasons = options.seedCurrentTeamHistory
        ? Math.max(1, Math.min(totalSeasonsTarget, randomBetween(2, Math.max(2, totalSeasonsTarget))))
        : 0;
    const tentativeStart = options.seedCurrentTeamHistory
        ? finalHistoricalSeason - desiredCurrentTeamSeasons + 1
        : startSeason;
    const currentTeamStartSeason = options.seedCurrentTeamHistory
        ? Math.max(tentativeStart, earliestSeason)
        : startSeason;
    const actualCurrentTeamSeasons = options.seedCurrentTeamHistory
        ? Math.max(0, Math.min(totalSeasonsTarget, finalHistoricalSeason - currentTeamStartSeason + 1))
        : 0;
    let remainingSeasons = Math.max(0, totalSeasonsTarget - actualCurrentTeamSeasons);
    let cursorEnd = currentTeamStartSeason - 1;
    const usedTeams = new Set<string>([teamName]);
    const previousStops: CoachCareerStop[] = [];

    while (remainingSeasons > 0 && cursorEnd >= earliestSeason) {
        const availableSpan = cursorEnd - earliestSeason + 1;
        if (availableSpan <= 0) break;
        const maxDuration = Math.min(remainingSeasons, availableSpan, 4);
        if (maxDuration <= 0) break;
        const duration = Math.max(1, Math.min(maxDuration, randomBetween(1, maxDuration)));
        const stopStart = cursorEnd - duration + 1;
        const program = pickSchoolExcluding(usedTeams);
        previousStops.unshift({ teamName: program, startSeason: stopStart, endSeason: cursorEnd });
        usedTeams.add(program);
        remainingSeasons -= duration;
        cursorEnd = stopStart - 1;
    }

    const careerStops: CoachCareerStop[] = [...previousStops, { teamName, startSeason: currentTeamStartSeason }];
    const seasonsTracked = totalSeasonsTarget - remainingSeasons;
    const { wins: careerWins, losses: careerLosses, draftedPlayers } = simulateCareerTotals(
        careerStops,
        finalHistoricalSeason,
        teamName,
        prestige,
        options.teamPrestigeMap,
    );

    const profile: HeadCoachProfile = {
        name: `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`,
        age: pickCoachAge(),
        almaMater: pickRandom(SCHOOLS),
        style: pickRandom(COACH_STYLES),
        reputation: clamp(Math.round(prestige + randomBetween(-12, 12)), 30, 95),
        seasons: Math.max(1, seasonsTracked),
        careerWins,
        careerLosses,
        seasonWins: 0,
        seasonLosses: 0,
        startSeason: currentTeamStartSeason,
        draftedPlayers,
        lastTeam: teamName,
        careerStops,
        contract: {
            salary: Math.round(500000 + prestige * 15000 + clamp(Math.round(prestige + randomBetween(-12, 12)), 30, 95) * 10000),
            yearsRemaining: randomBetween(1, 5),
        },
    };

    return profile;
};

export const generateInternationalProspects = (): InternationalProspect[] => {
    const count = randomBetween(14, 20);
    return Array.from({ length: count }, () => {
        const club = pickRandom(INTERNATIONAL_PROGRAMS);
        const prestigeBand = randomBetween(75, 95);
        const player = applyOffseasonProgression(createPlayer('Intl'), prestigeBand, true);
        player.year = 'Intl';
        player.overall = clamp(player.overall + randomBetween(5, 12), 55, 97);
        player.potential = clamp(player.potential + randomBetween(6, 10), player.overall, 99);
        player.startOfSeasonOverall = player.overall;
        player.originCountry = club.country;
        player.internationalClub = club.club;
        const games = randomBetween(28, 36);
        const pointsPer = randomBetween(12, 22);
        const reboundsPer = randomBetween(5, 11);
        const assistsPer = randomBetween(2, 8);
        const minutesPer = randomBetween(24, 35);
        player.seasonStats = {
            gamesPlayed: games,
            points: Math.round(pointsPer * games),
            rebounds: Math.round(reboundsPer * games),
            assists: Math.round(assistsPer * games),
            minutes: Math.round(minutesPer * games),
        };

        return {
            id: player.id,
            player,
            country: club.country,
            club: club.club,
            scoutingReport: `Polished ${player.position} with ${pickRandom(INTERNATIONAL_TRAITS)} from ${club.club}.`,
        };
    });
};

const DRAFT_YEAR_TO_CATEGORY: Record<Player['year'], DraftProspectCategory | null> = {
    Fr: 'freshman',
    So: 'sophomore',
    Jr: 'junior',
    Sr: 'senior',
    Intl: 'international',
    Pro: null,
};

const getPerGameLine = (player: Player) => {
    const games = Math.max(1, player.seasonStats.gamesPlayed || 1);
    return {
        ppg: player.seasonStats.points / games,
        rpg: player.seasonStats.rebounds / games,
        apg: player.seasonStats.assists / games,
    };
};

const calculateDraftReadinessScore = (player: Player): number => {
    const { ppg, rpg, apg } = getPerGameLine(player);
    const production = ppg * 4 + rpg * 1.5 + apg * 2;
    const defensiveFloor = (player.stats.insideDefense + player.stats.perimeterDefense) / 2;
    return Math.round(player.overall * 0.85 + player.potential * 0.55 + production + defensiveFloor * 0.2);
};

const shouldUnderclassDeclare = (player: Player, readinessScore: number): boolean => {
    if ((player.nilContractYearsRemaining || 0) > 0) return false;
    if (player.year === 'Sr') return true;
    const thresholds: Record<Player['year'], number> = {
        Fr: 185,
        So: 176,
        Jr: 170,
        Sr: 0,
        Intl: 0,
        Pro: 999,
    };
    const threshold = thresholds[player.year];
    if (threshold === undefined) return false;
    const volatility = randomBetween(-12, 12);
    return readinessScore + volatility >= threshold;
};

const initializeProspectPools = (): Record<DraftProspectCategory, DraftProspect[]> => ({
    freshman: [],
    sophomore: [],
    junior: [],
    senior: [],
    international: [],
});

const buildProspectPools = (teams: Team[], internationalProspects: InternationalProspect[]): Record<DraftProspectCategory, DraftProspect[]> => {
    const pools = initializeProspectPools();

    teams.forEach(team => {
        team.roster.forEach(player => {
            const category = DRAFT_YEAR_TO_CATEGORY[player.year];
            if (!category) return;
            if ((player.nilContractYearsRemaining || 0) > 0) return;
            if (category === 'international') {
                pools.international.push({
                    player,
                    originalTeam: team.name,
                    source: 'International',
                    originDescription: `${team.name} (Intl Transfer)`,
                    category,
                    score: calculateDraftReadinessScore(player) + 4,
                });
                return;
            }
            const readiness = calculateDraftReadinessScore(player);
            const gamesPlayed = Math.max(1, team.record.wins + team.record.losses || 1);
            const winPct = gamesPlayed > 0 ? team.record.wins / gamesPlayed : 0;
            const recordBoost = Math.max(0, (winPct - 0.55) * 25); // reward winning teams
            const prestigeBoost = Math.max(0, (team.prestige - 60) / 6);
            const userBonus = team.isUserTeam ? 8 : 0;
            if (!shouldUnderclassDeclare(player, readiness)) return;
            const categoryBias = category === 'freshman' ? 8 : category === 'sophomore' ? 6 : category === 'junior' ? 4 : 3;
            pools[category].push({
                player,
                originalTeam: team.name,
                source: 'NCAA',
                originDescription: `${team.name} (${player.year})`,
                category,
                score: readiness + categoryBias + recordBoost + prestigeBoost + userBonus,
            });
        });
    });

    internationalProspects.forEach(prospect => {
        const player = prospect.player;
        const readiness = calculateDraftReadinessScore(player);
        pools.international.push({
            player,
            originalTeam: prospect.club,
            source: 'International',
            originDescription: `${prospect.club} (${prospect.country})`,
            category: 'international',
            score: readiness + 6,
        });
    });

    (Object.keys(pools) as DraftProspectCategory[]).forEach(category => {
        pools[category].sort((a, b) => b.score - a.score);
    });

    return pools;
};

type DraftWeightProfile = {
    range: [number, number];
    weights: Record<DraftProspectCategory, number>;
};

const DRAFT_WEIGHT_PROFILES: DraftWeightProfile[] = [
    { range: [1, 5], weights: { freshman: 0.4, international: 0.35, sophomore: 0.15, junior: 0.08, senior: 0.02 } },
    { range: [6, 14], weights: { freshman: 0.25, international: 0.25, sophomore: 0.3, junior: 0.15, senior: 0.05 } },
    { range: [15, 30], weights: { freshman: 0.1, international: 0.05, sophomore: 0.35, junior: 0.3, senior: 0.2 } },
    { range: [31, 60], weights: { freshman: 0.1, international: 0.1, sophomore: 0.2, junior: 0.25, senior: 0.35 } },
];

const getPickWeights = (pickNumber: number): Record<DraftProspectCategory, number> => {
    const profile = DRAFT_WEIGHT_PROFILES.find(p => pickNumber >= p.range[0] && pickNumber <= p.range[1]);
    return profile
        ? profile.weights
        : { freshman: 0.25, international: 0.25, sophomore: 0.2, junior: 0.15, senior: 0.15 };
};

const pullBestFromPools = (pools: Record<DraftProspectCategory, DraftProspect[]>): DraftProspect | null => {
    let best: { prospect: DraftProspect; category: DraftProspectCategory } | null = null;
    (Object.keys(pools) as DraftProspectCategory[]).forEach(category => {
        const candidate = pools[category][0];
        if (!candidate) return;
        if (!best || candidate.score > best.prospect.score) {
            best = { prospect: candidate, category };
        }
    });
    if (!best) return null;
    pools[best.category].shift();
    return best.prospect;
};

const createSeededRng = (seed?: number) => {
    if (typeof seed !== 'number') {
        return () => Math.random();
    }
    let state = seed >>> 0;
    return () => {
        state += 0x6D2B79F5;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const selectProspectForPick = (
    pickNumber: number,
    pools: Record<DraftProspectCategory, DraftProspect[]>,
    rng: () => number
): DraftProspect | null => {
    const weights = getPickWeights(pickNumber);
    const availableCategories = (Object.keys(pools) as DraftProspectCategory[]).filter(category => pools[category].length > 0);
    if (availableCategories.length === 0) {
        return null;
    }

    const adjustedWeights = availableCategories.map(category => ({
        category,
        weight: Math.max(0.05, weights[category] ?? 0.05),
    }));
    const totalWeight = adjustedWeights.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng() * totalWeight;
    for (const entry of adjustedWeights) {
        roll -= entry.weight;
        if (roll <= 0) {
            return pools[entry.category].shift()!;
        }
    }
    return pullBestFromPools(pools);
};

export const buildDraftProspectBoard = (
    teams: Team[],
    internationalProspects: InternationalProspect[],
    pickCount = 60,
    seed?: number
): DraftProspect[] => {
    const pools = buildProspectPools(teams, internationalProspects);
    const board: DraftProspect[] = [];
    const rng = createSeededRng(seed);
    for (let pick = 1; pick <= pickCount; pick++) {
        const selection = selectProspectForPick(pick, pools, rng);
        if (!selection) break;
        board.push(selection);
    }
    return board;
};

const simulateSeries = <T extends { rating: number; name: string }>(teamA: T, teamB: T) => {
    const advantage = clamp(0.5 + (teamA.rating - teamB.rating) / 18, 0.2, 0.8);
    const winnerIsA = Math.random() < advantage;
    return {
        winner: winnerIsA ? teamA : teamB,
        loser: winnerIsA ? teamB : teamA,
    };
};

export const simulateNBASeason = (season: number): NBASimulationResult => {
    const teams: NBATeamSimulation[] = NBA_TEAMS.map(info => ({
        name: info.name,
        conference: info.conference,
        rating: clamp(72 + randomBetween(-8, 12), 65, 98),
        wins: 0,
        losses: 0,
        playoffFinish: 5,
    }));

    teams.forEach(team => {
        const baseWinPct = clamp(0.32 + (team.rating - 75) * 0.008, 0.2, 0.8);
        const wins = clamp(Math.round(baseWinPct * 81) + randomBetween(-4, 4), 18, 64);
        team.wins = wins;
        team.losses = 81 - wins;
    });

    const runConferencePlayoffs = (conference: 'East' | 'West') => {
        const standings = teams
            .filter(t => t.conference === conference)
            .sort((a, b) => (b.wins - a.wins) || (b.rating - a.rating));
        const seeds = standings.slice(0, 8);
        const quarterMatchups = [
            simulateSeries(seeds[0], seeds[7]),
            simulateSeries(seeds[3], seeds[4]),
            simulateSeries(seeds[1], seeds[6]),
            simulateSeries(seeds[2], seeds[5]),
        ];
        quarterMatchups.forEach(result => result.loser.playoffFinish = 4);

        const semifinals = [
            simulateSeries(quarterMatchups[0].winner, quarterMatchups[1].winner),
            simulateSeries(quarterMatchups[2].winner, quarterMatchups[3].winner),
        ];
        semifinals.forEach(result => result.loser.playoffFinish = 3);

        const finals = simulateSeries(semifinals[0].winner, semifinals[1].winner);
        finals.loser.playoffFinish = 2;
        return finals;
    };

    const eastWinner = runConferencePlayoffs('East');
    const westWinner = runConferencePlayoffs('West');

const finals = simulateSeries(eastWinner.winner, westWinner.winner);
finals.loser.playoffFinish = 1;
finals.winner.playoffFinish = 0;

const champion = finals.winner.name;

const draftOrder = [...teams].sort((a, b) => {
        if (a.playoffFinish !== b.playoffFinish) return b.playoffFinish - a.playoffFinish;
        if (a.wins !== b.wins) return a.wins - b.wins;
        return a.rating - b.rating;
    }).map(t => t.name);

    return {
        season,
        teams,
    draftOrder,
    champion,
  };
};

// Lightweight prestige heuristic for NBA teams for salary/offer logic
const getNBATeamPrestige = (teamName: string): number => {
    const elite = new Set(['Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors']);
    const high = new Set(['Miami Heat', 'Philadelphia 76ers', 'Milwaukee Bucks', 'New York Knicks']);
    const solid = new Set(['Phoenix Suns', 'Dallas Mavericks', 'Denver Nuggets', 'San Antonio Spurs', 'Chicago Bulls']);
    if (elite.has(teamName)) return 92;
    if (high.has(teamName)) return 88;
    if (solid.has(teamName)) return 82;
    return 75;
};

export const calculateNBACoachSalary = (teamName: string, coach: Coach): number => {
    const prestige = getNBATeamPrestige(teamName);
    const base = 3000000; // $3M base
    const prestigeBonus = prestige * 40000; // up to ~$3.6M
    const repBonus = coach.reputation * 25000; // up to ~$2.5M
    const marketAdj = teamName.includes('Los Angeles') || teamName.includes('New York') ? 1.2 : 1.0;
    const salary = Math.round((base + prestigeBonus + repBonus) * marketAdj);
    return salary;
};

export const generateNBAJobOffers = (coach: Coach, simulation: NBASimulationResult | null, userTeamPrestige?: number): string[] => {
    if (!simulation) return [];
    const threshold = Math.max(70, (userTeamPrestige || 0) > 0 ? Math.min(90, (userTeamPrestige || 0) - 5) : 75);
    if ((coach.reputation || 0) < threshold) return [];
    // Target bottom teams by playoffFinish and wins
    const teamsSorted = [...simulation.teams].sort((a, b) => (b.playoffFinish - a.playoffFinish) || (a.wins - b.wins));
    const candidates = teamsSorted.slice(0, 8); // worst 8 situations
    const offers: string[] = [];
    candidates.forEach(t => {
        const prestige = getNBATeamPrestige(t.name);
        const needFactor = 0.4 + (t.playoffFinish / 10) + Math.max(0, (38 - t.wins)) / 100; // more if they struggled
        const fit = (coach.reputation / 100) * (prestige / 100);
        const chance = Math.min(0.85, 0.15 + needFactor * 0.5 + fit * 0.35);
        if (Math.random() < chance) offers.push(t.name);
    });
    return Array.from(new Set(offers)).slice(0, 5);
};

const OFFSEASON_STAT_KEYS: (keyof Player['stats'])[] = ['insideScoring', 'outsideScoring', 'playmaking', 'perimeterDefense', 'insideDefense', 'rebounding', 'stamina'];

const applyOffseasonProgression = (player: Player, programPrestige: number, isInternational = false): Player => {
    const updatedPlayer: Player = {
        ...player,
        stats: { ...player.stats },
    };
    const effectivePotential = getEffectivePotential(updatedPlayer);
    const growthWindow = Math.max(0, effectivePotential - updatedPlayer.overall);
    if (growthWindow <= 0) {
        return updatedPlayer;
    }
    const classMultiplier = updatedPlayer.year === 'Fr' ? 4 : updatedPlayer.year === 'So' ? 3 : updatedPlayer.year === 'Jr' ? 2 : 1;
    const prestigeBonus = Math.max(0, Math.floor(programPrestige / 25));
    const internationalBonus = isInternational ? 1 : 0;
    const baseSteps = classMultiplier + Math.floor(growthWindow / 7) + prestigeBonus + internationalBonus;
    const growthStepsRaw = Math.min(14, Math.max(1, randomBetween(1, baseSteps)));
    const growthSteps = clamp(Math.round(growthStepsRaw * getDevelopmentRateForPlayer(updatedPlayer)), 1, 18);

    const boostStat = (increment: number) => {
        const sortedKeys = [...OFFSEASON_STAT_KEYS].sort((a, b) => updatedPlayer.stats[a] - updatedPlayer.stats[b]);
        const statKey = sortedKeys[0];
        updatedPlayer.stats[statKey] = clamp(updatedPlayer.stats[statKey] + increment, 40, 99);
    };

    for (let i = 0; i < growthSteps; i++) {
        const increment = programPrestige >= 80 && Math.random() < 0.35 ? 2 : 1;
        boostStat(increment);
    }

    if (programPrestige >= 88 && updatedPlayer.overall >= 78) {
        const eliteBoosts = randomBetween(1, 3);
        for (let i = 0; i < eliteBoosts; i++) {
            boostStat(1);
        }
    }

    updatedPlayer.overall = calculateOverall(updatedPlayer.stats);
    updatedPlayer.startOfSeasonOverall = updatedPlayer.overall;
    updatedPlayer.naturalProgressAccumulator = 0;
    return updatedPlayer;
};

const bumpYear = (year: Player['year']): Player['year'] => {
    if (year === 'Fr') return 'So';
    if (year === 'So') return 'Jr';
    if (year === 'Jr') return 'Sr';
    return 'Sr';
};

const resetSeasonStats = (): Player['seasonStats'] => ({ gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 });

const decrementNilContract = (player: Player): Player => {
    const remaining = Math.max(0, (player.nilContractYearsRemaining ?? 0) - 1);
    return {
        ...player,
        nilContractYearsRemaining: remaining,
        nilContractAmount: remaining > 0 ? player.nilContractAmount : 0,
    };
};

const rollOverTeamRoster = (team: Team): Player[] => {
    const nextYearPlayers = team.roster
        .filter(p => p.year !== 'Sr')
        .map(p => {
            const progressed = ensurePlayerNilProfile(applyOffseasonProgression({ ...p }, team.prestige, false));
            const nilAdjusted = decrementNilContract(progressed);
            return {
                ...nilAdjusted,
                year: bumpYear(p.year),
                starterPosition: null,
                seasonStats: resetSeasonStats(),
                startOfSeasonOverall: nilAdjusted.overall,
                naturalProgressAccumulator: 0,
                streak: { type: 'Neutral' as StreakType, duration: 0, impact: {} },
                morale: 80,
            };
        });
    return nextYearPlayers;
};

const resetSeasonFinances = (team: Team): Team => {
    const existing = team.finances;
    if (!existing) return team;
    const cashOnHand = team.budget?.cash ?? existing.cashOnHand ?? 0;
    return {
        ...team,
        finances: {
            ...existing,
            baseRevenue: 0,
            gateRevenue: 0,
            merchandiseRevenue: 0,
            concessionsRevenue: 0,
            parkingRevenue: 0,
            donationRevenue: 0,
            endowmentSupport: 0,
            tournamentShare: 0,
            sponsorPayout: 0,
            totalRevenue: 0,
            operationalExpenses: 0,
            facilitiesExpenses: 0,
            travelExpenses: 0,
            recruitingExpenses: 0,
            marketingExpenses: 0,
            administrativeExpenses: 0,
            staffPayrollExpenses: 0,
            loanPayments: 0,
            broadcastRevenue: 0,
            licensingRevenue: 0,
            nilExpenses: 0,
            netIncome: 0,
            cashOnHand,
        },
        financialHistory: [],
    };
};

export const rollOverTeamsForNextSeason = (teams: Team[], season: number): Team[] => {
    return teams.map(team => {
        const graduatingPlayers = team.roster.filter(p => p.year === 'Sr');
        let alumniRegistry = team.alumniRegistry;

        graduatingPlayers.forEach(player => {
            const alumni = generateAlumni(player, team, season);
            alumniRegistry = updateAlumniRegistry(alumniRegistry, alumni);
        });

        const rolledTeam = {
            ...team,
            roster: rollOverTeamRoster(team),
            record: { wins: 0, losses: 0 },
            headCoach: team.headCoach
                ? { ...team.headCoach, seasons: team.headCoach.seasons + 1, seasonWins: 0, seasonLosses: 0 }
                : createHeadCoachProfile(team.name, team.prestige),
            alumniRegistry,
        };

        const withBoosterPass = applyOffseasonAlumniBoosterPass(rolledTeam, season);
        return resetSeasonFinances(withBoosterPass);
    });
};

const getTierFromMarketShare = (marketShare: number): Sponsor['tier'] => {
    if (marketShare >= 0.30) return 'Elite';
    if (marketShare >= 0.15) return 'High';
    if (marketShare >= 0.06) return 'Mid';
    return 'Low';
};

export const createSponsorFromName = (sponsorName: SponsorName, sponsorsData: { [key in SponsorName]?: SponsorData }): Sponsor => {
    if (sponsorName === 'Jordan') {
        return { name: sponsorName, tier: 'Elite', slogan: SPONSOR_SLOGANS[sponsorName], type: 'Apparel' };
    }
    const tier = sponsorsData[sponsorName]?.tier || 'Low';
    const slogan = SPONSOR_SLOGANS[sponsorName] || '';
    return { name: sponsorName, tier, slogan, type: 'OfficialPartner' };
};

export const calculateSponsorRevenueSnapshot = (team: Team): SponsorRevenue => {
    if (!team.sponsor) return { jersey: 0, shoe: 0, merch: 0, total: 0 };
    const tierMultipliers: Record<SponsorTier, number> = { 'Elite': 1.5, 'High': 1.3, 'Mid': 1.0, 'Low': 0.7 };
    const tierMultiplier = tierMultipliers[team.sponsor.tier];

    const baseRevenue = 500000;
    const prestigeBonus = team.prestige * 20000;
    const winsBonus = team.record.wins * 10000;

    const total = Math.round((baseRevenue + prestigeBonus + winsBonus) * tierMultiplier);

    return {
        jersey: Math.round(total * 0.4),
        shoe: Math.round(total * 0.35),
        merch: Math.round(total * 0.25),
        total,
    };
};

export const autoSetStarters = (roster: Player[]): Player[] => {
    if (roster.length < 5) return roster.map(p => ({ ...p, starterPosition: null }));

    const positions: RosterPositions[] = ['PG', 'SG', 'SF', 'PF', 'C'];
    const sortedRoster = [...roster].sort((a, b) => b.overall - a.overall);
    const secondaryPenalty = 0.25;
    const fallbackPenalty = 3;

    let bestScore = -Infinity;
    let bestAssignment: Map<RosterPositions, Player> | null = null;

    const dfs = (index: number, used: Set<string>, currentScore: number, currentMap: Map<RosterPositions, Player>) => {
        if (index === positions.length) {
            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestAssignment = new Map(currentMap);
            }
            return;
        }

        const pos = positions[index];
        const naturalCandidates = sortedRoster.filter(p => !used.has(p.id) && (p.position === pos || p.secondaryPosition === pos));
        const candidates = naturalCandidates.length > 0 ? naturalCandidates : sortedRoster.filter(p => !used.has(p.id));

        for (const player of candidates) {
            const nextUsed = new Set(used);
            nextUsed.add(player.id);

            let addedScore = player.overall;
            if (player.position === pos) {
                // no penalty
            } else if (player.secondaryPosition === pos) {
                addedScore -= secondaryPenalty;
            } else {
                addedScore -= fallbackPenalty;
            }

            const nextMap = new Map(currentMap);
            nextMap.set(pos, player);
            dfs(index + 1, nextUsed, currentScore + addedScore, nextMap);
        }
    };

    dfs(0, new Set(), 0, new Map());

    if (!bestAssignment || bestAssignment.size < positions.length) {
        return roster.map(p => ({ ...p, starterPosition: null }));
    }

    const finalAssignments = new Map<string, RosterPositions>();
    bestAssignment.forEach((player, pos) => {
        if (player) {
            finalAssignments.set(player.id, pos);
        }
    });

    return roster.map(p => ({ ...p, starterPosition: finalAssignments.get(p.id) || null }));
};

export const getTournamentPayout = (teamName: string, tournament: Tournament | null): number => {
    if (!tournament) return 0;

    let payout = 0;
    const inFirstFour = tournament.firstFour.some(m => m.homeTeam === teamName || m.awayTeam === teamName);
    if (inFirstFour) payout += 250000;

    const normalizeRegionRounds = (regionRounds?: TournamentMatchup[][] | TournamentMatchup[]): TournamentMatchup[][] => {
        if (!regionRounds || regionRounds.length === 0) return [];
        if (Array.isArray(regionRounds[0])) {
            return regionRounds as TournamentMatchup[][];
        }
        return (regionRounds as TournamentMatchup[]).map(match => [match]);
    };

    const normalizedRegions = (Object.keys(tournament.regions) as TournamentRegionName[]).reduce((acc, regionName) => {
        acc[regionName] = normalizeRegionRounds(tournament.regions[regionName]);
        return acc;
    }, {} as Record<TournamentRegionName, TournamentMatchup[][]>);

    const allRounds = Object.values(normalizedRegions).flat();
    const inMainBracket = allRounds.some(round => round.some(m => m.homeTeam === teamName || m.awayTeam === teamName));
    if (inMainBracket) payout += 250000;
    else return payout;

    const flattenRoundMatches = (roundIndex: number): TournamentMatchup[] =>
        Object.values(normalizedRegions)
            .map(regionRounds => regionRounds[roundIndex] ?? [])
            .flat();

    const didWinRound = (matches: TournamentMatchup[] | undefined, name: string) => {
        if (!matches || matches.length === 0) return false;
        return matches.some(m => (m.homeTeam === name && m.homeScore > m.awayScore) || (m.awayTeam === name && m.awayScore > m.homeScore));
    };

    if (didWinRound(flattenRoundMatches(0), teamName)) {
        payout += 75000;
        if (didWinRound(flattenRoundMatches(1), teamName)) {
            payout += 200000;
            if (didWinRound(flattenRoundMatches(2), teamName)) {
                if (didWinRound(flattenRoundMatches(3), teamName)) {
                    payout += 500000;
                    if (didWinRound(tournament.finalFour, teamName) && tournament.champion === teamName) {
                        payout += 1000000;
                    }
                }
            }
        }
    }
    return payout;
};

export const calculateFanWillingness = (team: Team): { ticket: number, jersey: number, merchandise: number, concessionFood: number, concessionDrink: number, parking: number } => {
    const wins = team.record?.wins ?? 0;
    const losses = team.record?.losses ?? 0;
    const prestige = team.prestige ?? 50;
    const fanInterest = team.fanInterest ?? 50;
    const winLossDifferential = wins - losses;
    const recordFactor = winLossDifferential * 0.5;
    
    // Exponential prestige curve for tickets to allow top teams (99 prestige) to charge premium prices
    // 99 prestige -> ~52 base from prestige
    // 50 prestige -> ~20 base from prestige
    const prestigeFactor = Math.pow(prestige, 1.4) / 12;
    const interestFactor = (fanInterest / 10);

    const ticket = 12 + prestigeFactor + interestFactor + recordFactor;
    
    const jersey = 60 + (prestige * 0.6) + (fanInterest * 0.2);
    const merchandise = 20 + (prestige * 0.3) + (fanInterest * 0.1);
    const concessionFood = 6 + (prestige / 15);
    const concessionDrink = 4 + (prestige / 20);
    const parking = 8 + (prestige / 6);

    return {
        ticket: Math.round(ticket),
        jersey: Math.round(jersey),
        merchandise: Math.round(merchandise),
        concessionFood: Math.round(concessionFood),
        concessionDrink: Math.round(concessionDrink),
        parking: Math.round(parking),
    };
};

const calculateFanArchetypeDemand = (
    homeTeam: Team,
    opponent: Team,
    fanMorale: number, // Use fanMorale here
    rivalryBoost: number,
    hotStreak: number,
    willingnessTicket: number,
): Record<FanArchetype, number> => {
    const fanInterest = homeTeam.fanInterest ?? homeTeam.prestige;
    const interestSwing = clamp((fanInterest - 50) / 60, -0.6, 1.1);
    const sentimentSwing = clamp((fanMorale - 50) / 55, -1.1, 1.4);
    const prestigeSwing = clamp((homeTeam.prestige - 55) / 55, -0.8, 1.1);
    const successMomentum = clamp((homeTeam.record.wins - homeTeam.record.losses) / 12, -1, 1);
    const ticketSignal = clamp(
        (willingnessTicket - homeTeam.prices.ticketPrice) / Math.max(8, willingnessTicket),
        -0.6,
        0.6,
    );
    const arenaQualitySwing = clamp(((homeTeam.facilities?.arena?.quality ?? 60) - 60) / 55, -0.5, 0.9);
    
    const activeQuestBonus = (homeTeam.sponsorQuests?.filter(q => q.status === 'active' && (q.type === 'nil' || q.type === 'attendance')).length ?? 0) * 0.05;
    const alumniEventBonus = (homeTeam.eventCalendar?.filter(e => e.status === 'pending').length ?? 0) * 0.1;

    const boosterSignal =
        clamp(((homeTeam.wealth?.donationLevel ?? 45) - 35) / 70, -0.2, 0.9) +
        clamp((homeTeam.wealth?.boosterPool ?? 6) / 60, 0, 0.4) +
        (homeTeam.nilCollective ? NIL_TIER_DEMAND_BONUS[homeTeam.nilCollective.tier] : 0) +
        activeQuestBonus + 
        alumniEventBonus;

    const opponentPrestigeSignal = clamp(opponent.prestige / 120, 0, 0.9);

    const diehard = clamp(
        0.55 + interestSwing * 0.9 + sentimentSwing * 0.45 + successMomentum * 0.3 + rivalryBoost * 0.5 + hotStreak * 6,
        0.25,
        1.45,
    );
    const casual = clamp(
        0.35 + prestigeSwing * 0.35 + sentimentSwing * 0.2 + successMomentum * 0.35 + opponentPrestigeSignal * 0.25,
        0.1,
        1.2,
    );
    const value = clamp(0.3 + ticketSignal * 0.9 + interestSwing * 0.35 - sentimentSwing * 0.1, 0.05, 1.05);
    const status = clamp(
        0.25 + prestigeSwing * 0.5 + arenaQualitySwing * 0.45 + opponentPrestigeSignal * 0.3 + rivalryBoost * 0.2,
        0.05,
        1.25,
    );
    const booster = clamp(0.25 + boosterSignal + prestigeSwing * 0.25 + successMomentum * 0.25, 0.05, 1.55);

    return { diehard, casual, value, status, booster };
};

const assignDefaultMinutes = (roster: Player[]): Player[] => {
    if (!roster.length) return roster;
    const staminaCap = (player: Player) => clampTo40(Math.round(20 + Math.max(0, (player.stats.stamina ?? 70) - 50) * 0.3));
    const computeWeight = (player: Player) => {
        const staminaFactor = 0.6 + (player.stats.stamina ?? 70) / 200;
        return Math.max(1, Math.pow(player.overall, 1.2) * (player.starterPosition ? 1.2 : 0.95) * staminaFactor);
    };
    const allocations = roster.map(() => 0);
    let remaining = 200;
    const prioritized = roster
        .map((player, idx) => ({ idx, score: computeWeight(player) }))
        .sort((a, b) => b.score - a.score);
    const ensured = Math.min(8, prioritized.length);
    for (let i = 0; i < ensured; i++) {
        allocations[prioritized[i].idx] = 2;
        remaining -= 2;
    }

    while (remaining > 0) {
        const candidates = roster
            .map((player, index) => ({ index, value: allocations[index], score: computeWeight(player), cap: staminaCap(player) }))
            .filter(item => item.value < item.cap);
        if (!candidates.length) break;
        candidates.sort((a, b) => (b.score - a.score) || (roster[b.index].overall - roster[a.index].overall));
        const target = candidates[0].index;
        allocations[target] = Math.min(staminaCap(roster[target]), allocations[target] + 1);
        remaining--;
    }

    return roster.map((player, idx) => ({
        ...player,
        rotationMinutes: allocations[idx],
        minutesLocked: false,
    }));
};

export const calculateTeamRevenue = (team: Team, tournament: Tournament | null, lastSeasonRecord?: UserSeasonRecord): Finances => {
    const prices = team.prices ?? DEFAULT_TEAM_PRICES;
    const confStrength = CONFERENCE_STRENGTH[team.conference] || 'Low';
    const confBase = { 'Power': 3000000, 'Mid': 1400000, 'Low': 800000 }[confStrength];
    const prestigeBonus = team.prestige * 15000;
    const baseRevenue = clamp(confBase + prestigeBonus, 500000, 4000000);

    const capacity = ARENA_CAPACITY_MAP[team.name] || 5000;
    const homeGames = 15;
    const willingness = calculateFanWillingness(team);
    const priceSentimentPenalty = Math.max(0, (prices.ticketPrice - willingness.ticket) / willingness.ticket);
    const lastTournamentResult = lastSeasonRecord?.tournamentResult ?? lastSeasonRecord?.postseasonResult ?? '';
    let hypeBonus = 1.0;
    if (lastTournamentResult.includes('Final Four')) hypeBonus = 1.15;
    else if (lastTournamentResult.includes('Elite 8')) hypeBonus = 1.1;
    else if (lastTournamentResult.includes('Sweet 16')) hypeBonus = 1.05;

    const baseAttendance = capacity * (team.fanInterest / 100) * hypeBonus;
    const finalAttendance = clamp(baseAttendance * (1 - priceSentimentPenalty * 0.5), 0, capacity);
    const gateRevenue = homeGames * finalAttendance * prices.ticketPrice;
    
    const concessionFoodFactor = priceDemandFactor(prices.concessionFoodPrice, willingness.concessionFood, 1.65, 1.6);
    const concessionDrinkFactor = priceDemandFactor(prices.concessionDrinkPrice, willingness.concessionDrink, 1.55, 1.6);
    const concessionsRevenue = homeGames * finalAttendance *
        (prices.concessionFoodPrice * concessionFoodFactor +
            prices.concessionDrinkPrice * concessionDrinkFactor);

    const baseMerchDemand = (team.fanInterest * 200) + (team.prestige * 1500);
    const jerseyDemandFactor = priceDemandFactor(prices.jerseyPrice, willingness.jersey, 1.35, 2.0);
    const merchDemandFactor = priceDemandFactor(prices.merchandisePrice, willingness.merchandise, 1.25, 2.0);
    const jerseyRevenue = (baseMerchDemand * 0.08 * jerseyDemandFactor * prices.jerseyPrice) * hypeBonus;
    const generalMerchRevenue = (baseMerchDemand * 0.15 * merchDemandFactor * prices.merchandisePrice) * hypeBonus;
    const merchandiseRevenue = jerseyRevenue + generalMerchRevenue;

    const parkingDemandFactor = priceDemandFactor(prices.parkingPrice, willingness.parking, 1.5, 1.4);
    const parkingRevenue = homeGames * finalAttendance * prices.parkingPrice * parkingDemandFactor;

    const tournamentShare = getTournamentPayout(team.name, tournament);
    const sponsorSnapshot = calculateSponsorRevenueSnapshot(team);
    const sponsorPayout = sponsorSnapshot.total;
    const donationRevenue = team.wealth ? (team.wealth.donationLevel * 15000) + (team.wealth.boosterPool * 40000) : 0;
    const endowmentSupport = team.wealth ? team.wealth.endowmentScore * 20000 : 0;
    const totalRevenue = baseRevenue + gateRevenue + merchandiseRevenue + concessionsRevenue + tournamentShare + sponsorPayout + parkingRevenue + donationRevenue + endowmentSupport;
    const coachSalary = team.headCoach?.contract ? team.headCoach.contract.salary : 0;
    const staffSalaries = [...(team.staff?.assistants || []), ...(team.staff?.trainers || []), ...(team.staff?.scouts || [])]
        .reduce((sum, member) => sum + member.salary, 0) + coachSalary;
    const firedStaffSalaries = team.finances?.firedStaffSalaries || 0;
    const staffPayrollExpenses = staffSalaries + firedStaffSalaries;

    const expenseMultiplier = team.conference === 'Power' ? 1.05 : team.conference === 'Mid' ? 1.02 : 1;
    const baseOperationalBucket = Math.round((1200000 + (team.prestige * 60000)) * expenseMultiplier);
    const travelWeight = team.conference === 'Power' ? 1.1 : team.conference === 'Mid' ? 1.0 : 0.85;
    
    let facilitiesExpenses = 0;
    let travelExpenses = 0;
    let recruitingExpenses = 0;
    let marketingExpenses = 0;
    let administrativeExpenses = 0;
    let staffDevelopmentExpenses = 0;

    if (team.budget?.allocations) {
        // Use user allocations (Weekly * 30 weeks)
        const weeks = 30;
        marketingExpenses = team.budget.allocations.marketing * weeks;
        recruitingExpenses = team.budget.allocations.recruiting * weeks;
        facilitiesExpenses = team.budget.allocations.facilities * weeks;
        staffDevelopmentExpenses = team.budget.allocations.staffDevelopment * weeks;
        
        // Travel is derived from conference/prestige
        travelExpenses = Math.round(baseOperationalBucket * 0.18 * travelWeight);
        // Admin is a base cost
        administrativeExpenses = Math.round(baseOperationalBucket * 0.10);
    } else {
        // Fallback / Initialization Logic
        facilitiesExpenses = Math.round(baseOperationalBucket * 0.32);
        travelExpenses = Math.round(baseOperationalBucket * 0.18 * travelWeight);
        recruitingExpenses = Math.round(baseOperationalBucket * 0.20 + (team.wealth?.boosterPool || 0) * 15000);
        marketingExpenses = Math.round(baseOperationalBucket * 0.12 + team.fanInterest * 1200);
        const plannedBaseExpenses = facilitiesExpenses + travelExpenses + recruitingExpenses + marketingExpenses;
        administrativeExpenses = Math.max(0, baseOperationalBucket - plannedBaseExpenses);
    }

    const operationalExpenses = facilitiesExpenses + travelExpenses + recruitingExpenses + marketingExpenses + administrativeExpenses + staffPayrollExpenses + staffDevelopmentExpenses;

    return {
        baseRevenue,
        gateRevenue,
        merchandiseRevenue,
        concessionsRevenue,
        parkingRevenue,
        donationRevenue,
        endowmentSupport,
        tournamentShare,
        sponsorPayout,
        totalRevenue,
        operationalExpenses,
        firedStaffSalaries,
        facilitiesExpenses,
        travelExpenses,
        recruitingExpenses,
        marketingExpenses,
        administrativeExpenses,
        staffPayrollExpenses,
        broadcastRevenue: 0,
        licensingRevenue: 0,
        loanPayments: 0,
        nilExpenses: 0,
        ledger: [],
        netIncome: totalRevenue - operationalExpenses,
        cashOnHand: 0,
    };
};

const ensureBudgetAllocations = (team: Team) => {
    if (!team.budget) {
        team.budget = {
            cash: 0,
            allocations: { marketing: 0, recruiting: 0, facilities: 0, staffDevelopment: 0 },
        };
        return;
    }
    if (!team.budget.allocations) {
        team.budget.allocations = { marketing: 0, recruiting: 0, facilities: 0, staffDevelopment: 0 };
    } else {
        team.budget.allocations = {
            marketing: team.budget.allocations.marketing || 0,
            recruiting: team.budget.allocations.recruiting || 0,
            facilities: team.budget.allocations.facilities || 0,
            staffDevelopment: team.budget.allocations.staffDevelopment || 0,
        };
    }
    if (typeof team.budget.cash !== 'number') team.budget.cash = 0;
};

const ensureTeamFinances = (team: Team) => {
    if (!team.finances) {
        team.finances = {
            baseRevenue: 0,
            gateRevenue: 0,
            merchandiseRevenue: 0,
            concessionsRevenue: 0,
            parkingRevenue: 0,
            donationRevenue: 0,
            endowmentSupport: 0,
            tournamentShare: 0,
            sponsorPayout: 0,
            broadcastRevenue: 0,
            licensingRevenue: 0,
            totalRevenue: 0,
            operationalExpenses: 0,
            firedStaffSalaries: 0,
            facilitiesExpenses: 0,
            travelExpenses: 0,
            recruitingExpenses: 0,
            marketingExpenses: 0,
            administrativeExpenses: 0,
            staffPayrollExpenses: 0,
            loanPayments: 0,
            nilExpenses: 0,
            ledger: [],
            netIncome: 0,
            cashOnHand: 0,
        };
    }
    if (!Array.isArray(team.finances.ledger)) team.finances.ledger = [];
};

const recordFinancialTransaction = (team: Team, season: number, week: number, entry: { description: string; category: string; amount: number; revenueKey?: keyof Finances; expenseKey?: keyof Finances, date?: GameDate }) => {
    ensureBudgetAllocations(team);
    ensureTeamFinances(team);

    const amount = entry.amount;
    team.budget!.cash = (team.budget!.cash || 0) + amount;

    if (entry.revenueKey) {
        (team.finances as any)[entry.revenueKey] = ((team.finances as any)[entry.revenueKey] || 0) + amount;
        team.finances!.totalRevenue += amount;
    }

    if (entry.expenseKey) {
        const cost = Math.abs(amount);
        (team.finances as any)[entry.expenseKey] = ((team.finances as any)[entry.expenseKey] || 0) + cost;
        team.finances!.operationalExpenses += cost;
    }

    team.finances!.netIncome = team.finances!.totalRevenue - team.finances!.operationalExpenses;
    team.finances!.cashOnHand = team.budget!.cash;

    team.finances!.ledger.push({
        id: crypto.randomUUID(),
        date: entry.date ? (typeof entry.date === 'string' ? entry.date : formatDate(entry.date as GameDate)) : new Date().toISOString(),
        week,
        season,
        description: entry.description,
        category: entry.category,
        amount,
        runningBalance: team.budget!.cash,
    });
};

export const calculateAttendance = (homeTeam: Team, opponent: Team, week: number, eventPlaybook: EventPlaybookEntry[]): AttendanceForecast => {
    const arena = ensureArenaFacility(homeTeam);
    const willingness = calculateFanWillingness(homeTeam);
    const fanMorale = homeTeam.fanMorale ?? 50; // Use fanMorale instead of fanSentiment
    const rivalryBoost = opponent.conference === homeTeam.conference ? 0.08 : 0;
    const recordDelta = homeTeam.record.wins - homeTeam.record.losses;
    const hotStreak = recordDelta > 3 ? 0.05 : recordDelta < -2 ? -0.04 : 0;
    const fanInterest = homeTeam.fanInterest ?? homeTeam.prestige;
    const arenaQualityBonus = clamp(((arena.quality ?? 60) - 60) / 380, -0.08, 0.15);

    const activeEvent = homeTeam.eventCalendar?.find(e => e.week === week && e.status === 'pending');
    let eventBonus = 0;
    if (activeEvent) {
        const playbookEntry = eventPlaybook.find(p => p.id === activeEvent.playbookId);
        if (playbookEntry && playbookEntry.effect === 'attendance') {
            eventBonus = playbookEntry.modifier;
        }
    }

    const baseDemandFoundation = 0.2 + (fanMorale / 220) + (fanInterest / 260) + arenaQualityBonus;
    const baseDemandCore = clamp(baseDemandFoundation, 0.25, 0.95);
    
    const tailgateInvestment = homeTeam.parking?.tailgateCulture || 0;
    const tailgateBoost = Math.min(0.05, tailgateInvestment / 100000); // Up to 5% boost for $5k investment

    const modifierBonus = 0.12 * rivalryBoost + 0.18 * hotStreak + 0.15 * eventBonus + tailgateBoost;
    const baseDemand = clamp(baseDemandCore + modifierBonus, 0.25, 1.25);
    const archetypeDemand = calculateFanArchetypeDemand(
        homeTeam,
        opponent,
        fanMorale,
        rivalryBoost,
        hotStreak,
        willingness.ticket,
    );

    const attendanceLog = arena.attendanceLog ?? [];
    const recentHomeGames = attendanceLog
        .filter(g => !g.simulated && g.segmentData)
        .slice(-3);
    
    const rollingAverage = recentHomeGames.length > 0
        ? Math.round(recentHomeGames.reduce((sum, g) => sum + g.attendance, 0) / recentHomeGames.length)
        : undefined;

    const rollingAverageFillRates: Partial<Record<SeatSegmentKey, number>> = {};
    if (recentHomeGames.length > 0) {
        const segmentTotals: Partial<Record<SeatSegmentKey, { totalFill: number, count: number }>> = {};
        recentHomeGames.forEach(game => {
            game.segmentData?.forEach(segment => {
                if (!segmentTotals[segment.key]) {
                    segmentTotals[segment.key] = { totalFill: 0, count: 0 };
                }
                const fillRate = segment.attendance / (arena.seatMix[segment.key]?.capacity || 1);
                segmentTotals[segment.key]!.totalFill += fillRate;
                segmentTotals[segment.key]!.count += 1;
            });
        });
        (Object.keys(segmentTotals) as SeatSegmentKey[]).forEach(key => {
            const totals = segmentTotals[key];
            if (totals && totals.count > 0) {
                rollingAverageFillRates[key] = totals.totalFill / totals.count;
            }
        });
    }

    const segments = (Object.keys(arena.seatMix) as SeatSegmentKey[]).map(key => {
        const segment = arena.seatMix[key];
        const seatPrice = resolveZoneTicketPrice(key, segment.priceModifier ?? 1, homeTeam.prices.ticketPrice);
        const archetypeWeights = SEGMENT_ARCHETYPE_WEIGHTS[key];
        const mixRaw = Object.entries(archetypeWeights).map(([archetype, weight]) => {
            const demand = archetypeDemand[archetype as FanArchetype] ?? 0.3;
            return { archetype: archetype as FanArchetype, value: weight * demand };
        });
        const demographicPull = mixRaw.reduce((sum, entry) => sum + entry.value, 0);
        const seatAppeal = clamp(baseDemand * demographicPull, 0.05, 1.4);
        const priceAnchor = Math.max(6, willingness.ticket * SEGMENT_PRICE_TARGET_MULTIPLIER[key]);
        const pricePressure = (seatPrice - priceAnchor) / priceAnchor;
        
        // High prestige teams have less price sensitive fans (inelastic demand)
        const prestigeSensitivityDiscount = Math.max(0, (homeTeam.prestige - 60) / 100); // Up to 0.4 reduction
        const baseSensitivity = SEGMENT_PRICE_SENSITIVITY[key] ?? 0.6;
        const priceSensitivity = baseSensitivity * (1 - prestigeSensitivityDiscount);

        const priceFactor =
            pricePressure >= 0
                ? 1 - pricePressure * priceSensitivity
                : 1 - pricePressure * priceSensitivity * 0.35;
        const fillRate = clamp(seatAppeal * Math.max(0, priceFactor), 0, 1.2);
        const filled = Math.round(segment.capacity * fillRate);
        const mixTotal = mixRaw.reduce((sum, entry) => sum + entry.value, 0) || 1;
        const normalizedMix: Partial<Record<FanArchetype, number>> = {};
        mixRaw.forEach(entry => {
            normalizedMix[entry.archetype] = Number(((entry.value / mixTotal) * 100).toFixed(1));
        });

        const confidenceScore = clamp(1 - Math.abs(pricePressure) * 0.3, 0.6, 0.98);

        return {
            key,
            capacity: segment.capacity,
            filled: clamp(filled, 0, segment.capacity),
            price: seatPrice,
            fairPrice: Math.round(priceAnchor),
            fillRate: Number((fillRate * 100).toFixed(1)),
            rollingAverageFillRate: rollingAverageFillRates[key] ? Number((rollingAverageFillRates[key]! * 100).toFixed(1)) : undefined,
            demandScore: Number(seatAppeal.toFixed(2)),
            confidenceScore: Number(confidenceScore.toFixed(2)),
            mix: normalizedMix,
        };
    });
    const attendance = segments.reduce((sum, seg) => sum + seg.filled, 0);
    const capacity = arena.capacity;
    const revenue = segments.reduce((sum, seg) => {
        const zone = arena.seatMix[seg.key];
        const price = resolveZoneTicketPrice(seg.key, zone?.priceModifier ?? 1, homeTeam.prices.ticketPrice);
        return sum + price * seg.filled;
    }, 0);
    const tags: string[] = [];
    if (rivalryBoost > 0) tags.push('Rivalry');
    if (hotStreak > 0.04) tags.push('Hot Streak');
    if (segments.some(seg => seg.key === 'suites' && seg.filled / seg.capacity > 0.65)) tags.push('Suite Buzz');
    if (segments.some(seg => seg.filled / seg.capacity > 0.95)) tags.push('Near Sellout');

    const signals: string[] = [];
    if (rivalryBoost > 0) signals.push("Rivalry game intensity is driving demand.");
    if (hotStreak > 0.04) signals.push("Fans are buzzing about the winning streak.");
    else if (hotStreak < -0.03) signals.push("Recent losses have cooled off casual interest.");
    
    if (fanMorale < 45) signals.push("Low fan morale is dampening turnout.");
    else if (fanMorale > 75) signals.push("High fan morale is boosting ticket sales.");

    if (rollingAverage && attendance > rollingAverage * 1.15) signals.push("Projected attendance is significantly higher than recent average.");
    else if (rollingAverage && attendance < rollingAverage * 0.85) signals.push("Projected attendance is lagging behind recent average.");

    return {
        attendance,
        capacity,
        revenue,
        segments,
        tags,
        rollingAverage,
        signals,
    };
};

export const calculateCurrentSeasonEarnedRevenue = (team: Team, gameInSeason: number, attendanceRecords: GameAttendanceRecord[], tournament: Tournament | null): Finances => {
    const prices = team.prices ?? DEFAULT_TEAM_PRICES;
    const REGULAR_SEASON_GAMES = 31;
    const gamesPlayed = Math.min(gameInSeason > 31 ? REGULAR_SEASON_GAMES : gameInSeason - 1, REGULAR_SEASON_GAMES);
    const seasonProgress = gamesPlayed / REGULAR_SEASON_GAMES;

    const projected = calculateTeamRevenue(team, tournament);
    
    const baseRevenue = projected.baseRevenue * seasonProgress;
    // Calculate gate revenue directly from the attendance records for games played so far
    const gateRevenue = attendanceRecords.reduce((sum, record) => sum + (record.revenue || 0), 0);
    const willingness = calculateFanWillingness(team);
    const foodDemandFactor = priceDemandFactor(prices.concessionFoodPrice, willingness.concessionFood, 1.65, 1.5);
    const drinkDemandFactor = priceDemandFactor(prices.concessionDrinkPrice, willingness.concessionDrink, 1.55, 1.5);
    const concessionsRevenue = attendanceRecords.reduce((sum, record) => {
        const attendance = record.attendance || 0;
        return sum + attendance * (prices.concessionFoodPrice * foodDemandFactor + prices.concessionDrinkPrice * drinkDemandFactor);
    }, 0);
    const merchandiseRevenue = projected.merchandiseRevenue * seasonProgress;
    const tournamentShare = getTournamentPayout(team.name, tournament);
    const sponsorPayout = projected.sponsorPayout * seasonProgress;
    const parkingRevenue = projected.parkingRevenue * seasonProgress;
    const donationRevenue = projected.donationRevenue * seasonProgress;
    const endowmentSupport = projected.endowmentSupport * seasonProgress;
    const scaleExpense = (value: number) => Math.round(value * seasonProgress);
    const facilitiesExpenses = scaleExpense(projected.facilitiesExpenses);
    const travelExpenses = scaleExpense(projected.travelExpenses);
    const recruitingExpenses = scaleExpense(projected.recruitingExpenses);
    const marketingExpenses = scaleExpense(projected.marketingExpenses);
    const administrativeExpenses = scaleExpense(projected.administrativeExpenses);
    const staffPayrollExpenses = scaleExpense(projected.staffPayrollExpenses);
    const operationalExpenses = facilitiesExpenses + travelExpenses + recruitingExpenses + marketingExpenses + administrativeExpenses + staffPayrollExpenses;
    const totalRevenue = baseRevenue + gateRevenue + merchandiseRevenue + concessionsRevenue + tournamentShare + sponsorPayout + parkingRevenue + donationRevenue + endowmentSupport;

    return {
        baseRevenue,
        gateRevenue,
        merchandiseRevenue,
        concessionsRevenue,
        parkingRevenue,
        donationRevenue,
        endowmentSupport,
        tournamentShare,
        sponsorPayout,
        totalRevenue,
        operationalExpenses,
        firedStaffSalaries: team.finances.firedStaffSalaries || 0,
        facilitiesExpenses,
        travelExpenses,
        recruitingExpenses,
        marketingExpenses,
        administrativeExpenses,
        staffPayrollExpenses,
        broadcastRevenue: 0,
        licensingRevenue: 0,
        loanPayments: 0,
        nilExpenses: 0,
        ledger: [],
        netIncome: totalRevenue - operationalExpenses,
        cashOnHand: 0,
    };
};

export const recalculateSponsorLandscape = (teams: Team[], currentSponsors: { [key in SponsorName]?: SponsorData }, tournament: Tournament | null): { sponsors: { [key in SponsorName]?: SponsorData }, updatedTeams: Team[] } => {
    const sponsors = JSON.parse(JSON.stringify(currentSponsors));
    for (const key in sponsors) { sponsors[key as SponsorName]!.sponsoredTeamCount = 0; }

    const teamsWithUpdatedSponsorRevenue = teams.map(team => ({ ...team, sponsorRevenue: calculateSponsorRevenueSnapshot(team) }));
    let totalLeagueSponsorRevenue = teamsWithUpdatedSponsorRevenue.reduce((sum, team) => sum + team.sponsorRevenue.total, 0);
    const sponsorRevenueTotals: { [key in SponsorName]?: number } = {};
    
    teamsWithUpdatedSponsorRevenue.forEach(team => {
        if (!sponsorRevenueTotals[team.sponsor.name]) sponsorRevenueTotals[team.sponsor.name] = 0;
        sponsorRevenueTotals[team.sponsor.name]! += team.sponsorRevenue.total;
        sponsors[team.sponsor.name]!.sponsoredTeamCount += 1;
    });

    for (const key in sponsors) {
        const name = key as SponsorName;
        const totalForSponsor = sponsorRevenueTotals[name] || 0;
        const marketShare = totalLeagueSponsorRevenue > 0 ? totalForSponsor / totalLeagueSponsorRevenue : 0;
        sponsors[name]!.marketShare = marketShare;
        const computedTier = name === 'Jordan' ? 'Elite' : getTierFromMarketShare(marketShare);
        sponsors[name]!.tier = computedTier;
    }
    
    return { sponsors, updatedTeams: teamsWithUpdatedSponsorRevenue };
};

export const runInitialRecruitingOffers = (teams: Team[], recruits: Recruit[]): Recruit[] => {
    const modifiableRecruits: Recruit[] = JSON.parse(JSON.stringify(recruits));
    const sortedRecruits = [...modifiableRecruits].sort((a, b) => (b.overall * 0.7 + b.potential * 0.3) - (a.overall * 0.7 + a.potential * 0.3));
    const recruitsById = new Map(modifiableRecruits.map(r => [r.id, r]));
    const teamsByName = new Map(teams.map(t => [t.name, t]));

    const recordCpuOffer = (recruit: Recruit, teamName: string, week: number) => {
        if (!recruit.cpuOffers) recruit.cpuOffers = [];
        if (recruit.cpuOffers.includes(teamName)) return;
        recruit.cpuOffers.push(teamName);
        if (!recruit.teamMomentum) recruit.teamMomentum = {};
        recruit.teamMomentum[teamName] = clamp((recruit.teamMomentum[teamName] ?? 0) + 6, -20, 20);
        const t = teamsByName.get(teamName);
        if (!recruit.offerHistory) recruit.offerHistory = [];
        recruit.offerHistory.push({
            teamName,
            week,
            pitchType: t ? pickOfferPitchTypeForTeam(recruit, t) : 'Standard',
            source: 'CPU',
        });
    };

    const pickWeightedTeamNames = (pool: Team[], count: number, exclude: Set<string>): string[] => {
        const picked: string[] = [];
        if (count <= 0 || pool.length === 0) return picked;
        const localExclude = new Set(exclude);

        const weights = pool.map(t => Math.max(1, Math.round((t.prestige ?? 50) * (t.prestige ?? 50) / 100)));
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        let safety = 0;
        while (picked.length < count && safety < 5000) {
            safety++;
            const roll = Math.random() * totalWeight;
            let running = 0;
            let selectedIdx = 0;
            for (let i = 0; i < pool.length; i++) {
                running += weights[i]!;
                if (roll <= running) {
                    selectedIdx = i;
                    break;
                }
            }
            const selected = pool[selectedIdx];
            if (!selected) continue;
            if (localExclude.has(selected.name)) continue;
            localExclude.add(selected.name);
            picked.push(selected.name);
        }
        return picked;
    };

    const ensureTopRecruitsHaveOffers = () => {
        const topTierTeams = teams
            .filter(t => !t.isUserTeam && (t.prestige ?? 0) >= 70)
            .sort((a, b) => (b.prestige ?? 0) - (a.prestige ?? 0));
        if (topTierTeams.length === 0) return;

        const top100 = sortedRecruits.slice(0, 100);
        top100.forEach((recruit, index) => {
            const recruitToUpdate = recruitsById.get(recruit.id);
            if (!recruitToUpdate) return;

            let desiredOffers: number;
            if (index < 10) desiredOffers = randomBetween(12, 20);
            else if (index < 25) desiredOffers = randomBetween(9, 17);
            else if (index < 50) desiredOffers = randomBetween(6, 14);
            else desiredOffers = randomBetween(3, 10);

            desiredOffers = clamp(desiredOffers, 3, 20);

            const existing = new Set(recruitToUpdate.cpuOffers);
            const missing = desiredOffers - existing.size;
            if (missing <= 0) return;

            const toAdd = pickWeightedTeamNames(topTierTeams, missing, existing);
            toAdd.forEach(name => recordCpuOffer(recruitToUpdate, name, 0));
        });
    };

    teams.forEach(team => {
        if (team.isUserTeam) return;
        const returning = team.roster.filter(p => p.year !== 'Sr').length;
        const availableScholarships = Math.max(0, 13 - returning);
        if (availableScholarships <= 0) return;
        const offersToMake = Math.ceil(availableScholarships * (0.9 + (team.prestige / 400)));
        let offersMade = 0;
        
        let targetPool: Recruit[];
        if (team.prestige > 85) targetPool = sortedRecruits.slice(0, 75);
        else if (team.prestige > 70) targetPool = sortedRecruits.slice(10, 150);
        else if (team.prestige > 55) targetPool = sortedRecruits.slice(50, 250);
        else targetPool = sortedRecruits.slice(100);
        
        const shuffledTargets = targetPool.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value);

        for (const recruit of shuffledTargets) {
            if (offersMade >= offersToMake) break;
            const recruitToUpdate = recruitsById.get(recruit.id);
            if (recruitToUpdate && !recruitToUpdate.cpuOffers.includes(team.name)) {
                const rankInPool = shuffledTargets.findIndex(r => r.id === recruit.id);
                const offerChance = 1.0 - (rankInPool / (shuffledTargets.length * 1.5));
                if (Math.random() < offerChance) {
                    recordCpuOffer(recruitToUpdate, team.name, 0);
                    offersMade++;
                }
            }
        }
    });

    // Realism pass: top recruits should already have lots of high-major offers.
    ensureTopRecruitsHaveOffers();
    return modifiableRecruits;
};

const generatePreseasonHistory = (teams: Team[]): { history: { userTeamRecords: UserSeasonRecord[], champions: ChampionRecord[], teamHistory: { [key: string]: TeamHistory[] }, nbaDrafts: NBADraftHistoryEntry[] }, teamsWithBoost: Team[] } => {
    const teamHistory: { [key: string]: TeamHistory[] } = {};
    const champions: ChampionRecord[] = [];
    const NUM_HISTORY_SEASONS = DEFAULT_HISTORY_SEASONS;

    teams.forEach(team => { teamHistory[team.name] = []; });

    const postseasonLabels = ['Missed Tournament', 'NIT Bid', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Champions'];

    for (let season = -NUM_HISTORY_SEASONS + 1; season <= 0; season++) {
        const calendarYear = seasonToCalendarYear(season);
        const rawChampionName = CHAMPION_BY_YEAR.get(calendarYear);
        const hasRealChampion = rawChampionName && !['no champion', 'tournament canceled', 'none'].includes(rawChampionName.toLowerCase());
        const championName = hasRealChampion ? rawChampionName : null;
        const runnerUpName = hasRealChampion ? RUNNER_UP_BY_YEAR.get(calendarYear) : undefined;
        const postseasonOverrides = new Map<string, string>();
        const teamsWithFictionalRecords = teams.map(team => {
            const wins = randomBetween(Math.max(5, Math.floor(team.prestige / 4)), Math.min(30, Math.floor(team.prestige / 2.2)));
            const losses = 31 - wins;
            return { ...team, record: { wins, losses } };
        });
        if (championName) {
            const match = teamsWithFictionalRecords.find(t => t.name === championName);
            if (match) {
                postseasonOverrides.set(match.name, 'Champions');
                match.record.wins = Math.max(match.record.wins, 32);
                match.record.losses = Math.min(match.record.losses, 5);
            }
        }
        const sortedTeams = [...teamsWithFictionalRecords].sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10));
        const prioritizedNames = championName ? [championName] : [];
        let prioritizedTeams = sortedTeams;
        if (prioritizedNames.length) {
            const priorityList = prioritizedNames
                .map(name => sortedTeams.find(team => team.name === name))
                .filter((team): team is Team => Boolean(team));
            const remainder = sortedTeams.filter(team => !prioritizedNames.includes(team.name));
            prioritizedTeams = [...priorityList, ...remainder];
        }
        prioritizedTeams.forEach((team, index) => {
            const prestigeInfluence = team.prestige * 75000;
            const winInfluence = team.record.wins * 45000;
            const baseRevenue = 1_250_000 + prestigeInfluence + winInfluence + randomBetween(-250_000, 250_000);
            const totalRevenue = Math.max(500_000, Math.round(baseRevenue / 1000) * 1000);
            const projectedRevenue = Math.max(400_000, Math.round(totalRevenue * randomBetween(90, 110) / 100));
            const postseasonIndex = clamp(
                Math.floor((team.record.wins / 31) * postseasonLabels.length) + (team.prestige > 75 ? 1 : 0),
                0,
                postseasonLabels.length - 1,
            );
            let postseasonResult = postseasonOverrides.get(team.name) || postseasonLabels[postseasonIndex];
            if (postseasonResult === 'Champions' && championName && team.name !== championName) {
                postseasonResult = 'Final Four';
            }
            teamHistory[team.name].push({
                season,
                prestige: team.prestige,
                rank: index + 1,
                totalRevenue,
                projectedRevenue,
                wins: team.record.wins,
                losses: team.record.losses,
                postseasonResult,
            });
        });
        if (championName) {
            const championTeam =
                teamsWithFictionalRecords.find(t => t.name === championName) || prioritizedTeams[0];
            const runnerUpTeam =
                (runnerUpName && teamsWithFictionalRecords.find(t => t.name === runnerUpName)) || null;
            champions.push({
                season,
                teamName: championTeam.name,
                wins: championTeam.record.wins,
                losses: championTeam.record.losses,
                runnerUpTeamName: runnerUpTeam?.name || runnerUpName || undefined,
            });
        } else {
            champions.push({
                season,
                teamName: 'No Champion',
                wins: 0,
                losses: 0,
                runnerUpTeamName: undefined,
            });
        }
    }
    
    const finalChampionName = champions[champions.length - 1].teamName;
    const teamsWithBoost = [...teams];
    const finalChampIndex = teamsWithBoost.findIndex(t => t.name === finalChampionName);
    if (finalChampIndex !== -1) {
        teamsWithBoost[finalChampIndex].prestige = clamp(teamsWithBoost[finalChampIndex].prestige + 5, 20, 99);
    }

    // Load Real NBA Draft History
    const nbaDrafts: NBADraftHistoryEntry[] = Object.values(ALL_HISTORICAL_DRAFTS).sort((a, b) => a.season - b.season);

    return { history: { userTeamRecords: [], champions, teamHistory, nbaDrafts }, teamsWithBoost };
	};

const STARTING_TEAM_CASH = 16000;

const lastNameOf = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    return parts.length ? parts[parts.length - 1]! : fullName;
};

const setLastName = (fullName: string, newLast: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (!parts.length) return fullName;
    parts[parts.length - 1] = newLast;
    return parts.join(' ');
};

export const generateRecruitRelationships = (
    recruits: Recruit[],
    teams: Team[] = [],
    options?: { forceRosterSiblingSeeds?: boolean; rosterSiblingTargetOverride?: number }
): Recruit[] => {
    const updated = recruits.map(r => ({
        ...r,
        relationships: r.relationships || [],
    }));
    const byId = new Map(updated.map(r => [r.id, r]));

    const used = new Set<string>();
    const candidates = [...updated].filter(r => !r.relationships?.length);

    const pickEligible = (predicate: (r: Recruit) => boolean): Recruit | null => {
        const pool = candidates.filter(r => !used.has(r.id) && predicate(r));
        if (!pool.length) return null;
        return pool[Math.floor(Math.random() * pool.length)]!;
    };

    const twinPairsTarget = clamp(Math.round(updated.length * 0.02), 0, 8); // ~6-7 per 350
    let createdTwinPairs = 0;
    while (createdTwinPairs < twinPairsTarget) {
        const a =
            pickEligible(r => r.stars >= 4) ||
            pickEligible(r => r.stars >= 3) ||
            null;
        if (!a) break;

        used.add(a.id);
        const b = pickEligible(r => Math.abs(r.stars - a.stars) <= 1 && r.position === a.position) ||
            pickEligible(r => Math.abs(r.stars - a.stars) <= 1) ||
            null;
        if (!b) break;
        used.add(b.id);

        const sharedLast = lastNameOf(a.name);
        const familyId = `fam-${sharedLast}-${a.id}`;

        b.name = setLastName(b.name, sharedLast);
        b.hometownCity = a.hometownCity;
        b.hometownState = a.hometownState;
        b.homeState = a.homeState;
        b.state = a.state;
        b.region = a.region;
        b.metroArea = a.metroArea;
        b.highSchoolName = a.highSchoolName;
        b.highSchoolType = a.highSchoolType;
        b.height = clamp((a.height || 78) + stableIntBetween(`${a.id}:${b.id}:twinH`, -1, 1), 68, 92);
        b.wingspan = a.wingspan ? clamp(a.wingspan + stableIntBetween(`${a.id}:${b.id}:twinWS`, -1, 2), b.height - 1, b.height + 10) : b.wingspan;
        b.weight = a.weight ? clamp(a.weight + stableIntBetween(`${a.id}:${b.id}:twinW`, -10, 12), 155, 290) : b.weight;

        // Similar (but not identical) motivations.
        const tweak = (v: number, k: string) => clamp(v + stableIntBetween(`${a.id}:${b.id}:${k}`, -8, 8), 0, 100);
        b.motivations = {
            proximity: tweak(a.motivations.proximity, 'prox'),
            playingTime: tweak(a.motivations.playingTime, 'pt'),
            nil: tweak(a.motivations.nil, 'nil'),
            exposure: tweak(a.motivations.exposure, 'exp'),
            relationship: tweak(a.motivations.relationship, 'rel'),
            development: tweak(a.motivations.development, 'dev'),
            academics: tweak(a.motivations.academics, 'acad'),
        };

        const linkA: RelationshipLink = {
            type: 'Twin',
            personId: b.id,
            displayName: b.name,
            sportLevel: 'HS',
            notes: 'Package deal',
        };
        const linkB: RelationshipLink = {
            type: 'Twin',
            personId: a.id,
            displayName: a.name,
            sportLevel: 'HS',
            notes: 'Package deal',
        };

        a.relationships = [...(a.relationships || []), linkA];
        b.relationships = [...(b.relationships || []), linkB];
        a.familyLastNameGroupId = familyId;
        b.familyLastNameGroupId = familyId;

        createdTwinPairs++;
    }

    // Cousins: light touch, mostly higher-tier.
    const cousinLinksTarget = clamp(Math.round(updated.length * 0.012), 0, 6);
    let createdCousinLinks = 0;
    while (createdCousinLinks < cousinLinksTarget) {
        const a = pickEligible(r => r.stars >= 4) || null;
        if (!a) break;
        used.add(a.id);
        const b = pickEligible(r => r.id !== a.id && (r.region === a.region || Math.random() < 0.35)) || null;
        if (!b) break;
        used.add(b.id);

        const sharedLast = lastNameOf(a.name);
        b.name = setLastName(b.name, sharedLast);
        const familyId = `fam-${sharedLast}-${a.id}`;

        const linkA: RelationshipLink = {
            type: 'Cousin',
            personId: b.id,
            displayName: b.name,
            sportLevel: 'HS',
            notes: Math.random() < 0.35 ? 'Package deal' : undefined,
        };
        const linkB: RelationshipLink = {
            type: 'Cousin',
            personId: a.id,
            displayName: a.name,
            sportLevel: 'HS',
            notes: linkA.notes,
        };

        a.relationships = [...(a.relationships || []), linkA];
        b.relationships = [...(b.relationships || []), linkB];
        a.familyLastNameGroupId = familyId;
        b.familyLastNameGroupId = familyId;

        createdCousinLinks++;
    }

    // Roster siblings: only show "Sibling" if the recruit matches someone on a current college roster.
    // This avoids the immersion-breaking effect of many same-class "siblings" who are also top prospects.
    const rosterSiblingTarget = clamp(options?.rosterSiblingTargetOverride ?? Math.round(updated.length * 0.01), 0, 10);
    if (teams.length && rosterSiblingTarget > 0) {
        const rosterCandidates: { teamName: string; playerId: string; playerName: string; lastName: string; stateCode: string }[] = [];
        teams.forEach(t => {
            (t.roster || []).forEach(p => {
                const playerStateCode = normalizeStateCode((p as any).homeState || t.state || '');
                if (!playerStateCode) return;
                const isSeed = options?.forceRosterSiblingSeeds
                    ? true
                    : (stableHash32(`${t.name}:${p.id}:${p.name}:sibSeed`) % 1000) < 3; // ~0.3% of roster players
                if (!isSeed) return;
                rosterCandidates.push({
                    teamName: t.name,
                    playerId: p.id,
                    playerName: p.name,
                    lastName: lastNameOf(p.name),
                    stateCode: playerStateCode,
                });
            });
        });

        const usedRosterPlayers = new Set<string>();
        let created = 0;
        const shuffled = [...updated].sort((a, b) => stableHash32(`${a.id}:sibOrder`) - stableHash32(`${b.id}:sibOrder`));
        for (const r of shuffled) {
            if (created >= rosterSiblingTarget) break;
            if ((r.relationships || []).some(l => l.type === 'Sibling' && l.sportLevel === 'College')) continue;
            const recruitStateCode = normalizeStateCode(r.homeState || r.hometownState || r.state || '');
            if (!recruitStateCode) continue;
            const recruitLast = lastNameOf(r.name);
            const matches = rosterCandidates.filter(c =>
                !usedRosterPlayers.has(c.playerId) &&
                c.stateCode === recruitStateCode &&
                c.lastName === recruitLast
            );
            if (!matches.length) continue;
            const picked = matches[stableHash32(`${r.id}:${recruitLast}:${recruitStateCode}:sibPick`) % matches.length]!;
            usedRosterPlayers.add(picked.playerId);
            r.relationships = [
                ...(r.relationships || []),
                {
                    type: 'Sibling',
                    personId: picked.playerId,
                    displayName: picked.playerName,
                    sportLevel: 'College',
                    teamName: picked.teamName,
                    notes: 'On current roster',
                } satisfies RelationshipLink,
            ];
            created++;
        }
    }

    // Re-map back to array order (objects are mutated in place above).
    return updated.map(r => byId.get(r.id) || r);
};

const isPackageDealLink = (link: RelationshipLink): boolean => {
    return link.sportLevel === 'HS' && !!link.notes && link.notes.toLowerCase().includes('package deal');
};

const RECRUITING_DEBUG_PACKAGES = false;

const getDecisionPressure = (week: number, isSigningPeriod: boolean): number => {
    if (isSigningPeriod) return 1;
    return clamp((week - 5) / 10, 0, 1);
};

const getRecruitTalentScore = (recruit: Recruit): number => {
    const starScore = clamp(((recruit.stars ?? 1) - 1) / 4, 0, 1);
    const rankScore = typeof recruit.nationalRank === 'number'
        ? clamp(1 - (recruit.nationalRank - 1) / 200, 0, 1)
        : starScore;
    const overallScore = clamp(((recruit.overall ?? 60) - 60) / 30, 0, 1);
    return clamp(starScore * 0.5 + rankScore * 0.3 + overallScore * 0.2, 0, 1);
};

const getRosterCongestionForRecruit = (team: Team, recruit: Recruit): number => {
    const depthPlayers = team.roster.filter(p =>
        p.position === recruit.position ||
        (recruit.secondaryPosition && p.position === recruit.secondaryPosition) ||
        p.secondaryPosition === recruit.position
    );
    if (!depthPlayers.length) return 0;
    const depthFactor = clamp((depthPlayers.length - 1) / 4, 0, 1);
    const topOverall = depthPlayers.reduce((max, p) => Math.max(max, p.overall ?? 50), 50);
    const qualityFactor = clamp((topOverall - 70) / 20, 0, 1);
    return clamp(depthFactor * 0.6 + qualityFactor * 0.4, 0, 1);
};

export const applyPackageDealOfferMirroring = (recruits: Recruit[], teams: Team[], userTeamName: string, week: number): Recruit[] => {
    const updatedRecruits = JSON.parse(JSON.stringify(recruits)) as Recruit[];
    const teamsByName = new Map(teams.map(t => [t.name, t]));
    const byId = new Map(updatedRecruits.map(r => [r.id, r]));

    updatedRecruits.forEach(r => {
        if (!r.relationships?.length) return;
        r.relationships.forEach(link => {
            if (!isPackageDealLink(link)) return;
            if (link.personId === r.id) return;
            const other = byId.get(link.personId);
            if (!other) return;
            if (other.verbalCommitment) return;

            const mirrorSchools = [
                ...(r.cpuOffers || []),
                ...(r.userHasOffered ? [userTeamName] : []),
            ];

            for (const schoolName of mirrorSchools) {
                if (schoolName === userTeamName) continue; // user-side package boosts happen at offer time in UI reducer
                if (other.cpuOffers?.includes(schoolName)) continue;
                if (other.declinedOffers?.includes(schoolName)) continue;

                other.cpuOffers = [...(other.cpuOffers || []), schoolName];
                if (!other.teamMomentum) other.teamMomentum = {};
                // Package-deal offers should meaningfully increase this school's standing.
                other.teamMomentum[schoolName] = clamp((other.teamMomentum[schoolName] ?? 0) + 9, -20, 20);
                const t = teamsByName.get(schoolName);
                if (!other.offerHistory) other.offerHistory = [];
                other.offerHistory.push({
                    teamName: schoolName,
                    week,
                    pitchType: t ? pickOfferPitchTypeForTeam(other, t) : 'Standard',
                    source: 'CPU',
                });

                if (!other.lastRecruitingNews) {
                    other.lastRecruitingNews = `${other.name} is considering a package deal with ${r.name}.`;
                }
            }
        });
    });

    return updatedRecruits;
};

const pickOfferPitchTypeForTeam = (recruit: Recruit, team: Team): OfferPitchType => {
    const motivations = recruit.motivations || {
        proximity: 50,
        playingTime: 50,
        nil: 50,
        exposure: 50,
        relationship: 50,
        development: 50,
        academics: 50,
    };
    const top = (Object.keys(motivations) as (keyof typeof motivations)[])
        .sort((a, b) => motivations[b] - motivations[a])[0];

    if (top === 'nil') return 'NILHeavy';
    if (top === 'playingTime') return 'PlayingTimePromise';
    if (top === 'academics') return 'AcademicPitch';
    if (top === 'proximity' || recruit.archetype === 'HometownHero') {
        return recruit.homeState === team.state ? 'LocalAngle' : 'Standard';
    }
    if (top === 'exposure' && (team.prestige ?? 50) >= 75) return 'EarlyPush';
    return 'Standard';
};

const getActiveOfferPitchType = (recruit: Recruit, teamName: string): OfferPitchType | null => {
    const history = recruit.offerHistory || [];
    for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i]!;
        if (entry.teamName !== teamName) continue;
        if (entry.revoked) return null;
        return entry.pitchType;
    }
    return null;
};

export const initializeGameWorld = (userTeamName: string) => {
  const initialSponsors: { [key in SponsorName]?: SponsorData } = {};
  for (const key in INITIAL_SPONSORS) {
      const name = key as SponsorName;
      initialSponsors[name] = { marketShare: INITIAL_SPONSORS[name].marketShare, tier: getTierFromMarketShare(INITIAL_SPONSORS[name].marketShare), sponsoredTeamCount: 0 };
  }
  if (initialSponsors['Jordan']) {
      initialSponsors['Jordan']!.tier = 'Elite';
  }

  let allTeams: Team[] = SCHOOLS.map(name => {
      const institutional = SCHOOL_INSTITUTIONAL_PROFILES[name];
      const prestigeRange = SCHOOL_PRESTIGE_RANGES[name] || { min: 40, max: 65 };
      const prestigeSeed = getBaselinePrestigeForTeam(name) ?? randomBetween(prestigeRange.min, prestigeRange.max);
      const prestige = clamp(Math.round(prestigeSeed + randomBetween(-1, 1)), 20, 99);
      const roster = [...Array.from({ length: 3 }, () => createPlayer('Sr')), ...Array.from({ length: 3 }, () => createPlayer('Jr')), ...Array.from({ length: 4 }, () => createPlayer('So')), ...Array.from({ length: 4 }, () => createPlayer('Fr'))];
      const sponsorName = SCHOOL_SPONSORS[name] || 'Nike';
      const sponsor = createSponsorFromName(sponsorName, initialSponsors);

    const conference = SCHOOL_CONFERENCES[name] || 'Independent';
    const fanInterestSeed = institutional?.marketSizeScore != null
        ? Math.round(0.72 * prestige + 0.28 * clamp(institutional.marketSizeScore, 0, 100))
        : prestige;
    const fanInterest = clamp(fanInterestSeed, 5, 99);
    const wealthBase = seedProgramWealth(name, prestige, conference, fanInterest);
    const affluenceAdj = institutional?.affluenceScore != null ? (institutional.affluenceScore - 50) * 0.25 : 0;
    const pellAdj = institutional?.pctPell != null ? (((1 - clamp(institutional.pctPell, 0, 1)) * 100) - 50) * 0.15 : 0;
    const earningsAdj = institutional?.medianEarnings10yr != null
        ? (clamp((institutional.medianEarnings10yr - 30000) / 50000, 0, 1) * 20 - 10)
        : 0;
    const endowmentBump = Math.round(affluenceAdj + pellAdj + earningsAdj);
    const wealth: ProgramWealth = institutional
        ? {
            ...wealthBase,
            endowmentScore: clamp(Math.round(wealthBase.endowmentScore + endowmentBump), 20, 99),
            donationLevel: clamp(Math.round(wealthBase.donationLevel + endowmentBump * 0.8), 10, 115),
        }
        : wealthBase;
    const headCoach = createHeadCoachProfile(name, prestige, 1);
    const alumniRegistry = generateBaselineAlumniRegistry({ name, prestige, conference } as Team);
	    return {
	        name,
	        conference,
	        state: SCHOOL_STATES[name] || 'Unknown',
            location: SCHOOL_LOCATIONS[name],
        prestige,
        recruitingPrestige: prestige,
        roster: assignDefaultMinutes(autoSetStarters(roster)),
        staff: { assistants: [], trainers: [], scouts: [] },
        record: { wins: 0, losses: 0 },
        isUserTeam: name === userTeamName,
        sponsor,
        sponsorRevenue: { jersey: 0, shoe: 0, merch: 0, total: 0 },
        sponsorContractYearsRemaining: 1,
        sponsorContractLength: 1,
        sponsorOffers: [],
        fanInterest,
        fanMorale: clamp(prestige + randomBetween(-10, 10), 5, 99),
        playbookFamiliarity: 50,
        pipelineStates: [],
        nbaAffiliate: null,
        prices: { ticketPrice: 15, jerseyPrice: 75, merchandisePrice: 25, concessionFoodPrice: 10, concessionDrinkPrice: 5, parkingPrice: 10 },
        concessions: { tier: 'Standard', alcoholPolicy: false, items: [] },
        merchandising: { inventoryStrategy: 'Conservative', jerseySales: {}, items: [] },
        parking: { generalPrice: 10, vipPrice: 25, tailgateCulture: 0 },
	        finances: {
            baseRevenue: 0,
            gateRevenue: 0,
            merchandiseRevenue: 0,
            concessionsRevenue: 0,
            parkingRevenue: 0,
            donationRevenue: 0,
            endowmentSupport: 0,
            tournamentShare: 0,
            sponsorPayout: 0,
            totalRevenue: 0,
            operationalExpenses: 0,
            firedStaffSalaries: 0,
            facilitiesExpenses: 0,
            travelExpenses: 0,
            recruitingExpenses: 0,
            marketingExpenses: 0,
            administrativeExpenses: 0,
            staffPayrollExpenses: 0,
            broadcastRevenue: 0,
            licensingRevenue: 0,
            loanPayments: 0,
	            nilExpenses: 0,
	            ledger: [
	                {
	                    id: `init-budget-${name}`,
	                    date: 'Week 0',
	                    week: 0,
	                    season: 1,
	                    description: 'Starting Budget Allocation',
	                    category: 'Income',
	                    amount: STARTING_TEAM_CASH,
	                    runningBalance: STARTING_TEAM_CASH,
	                },
	            ],
	            netIncome: 0,
	            cashOnHand: STARTING_TEAM_CASH
	        },
	        budget: {
	            cash: STARTING_TEAM_CASH,
	            allocations: { marketing: 0, recruiting: 0, facilities: 0, staffDevelopment: 0 },
	        },
	        wealth,
	        institutionalProfile: institutional ?? undefined,
	        headCoach,
        playerFocusId: null,
        teamCaptainId: null,
        nilBudget: 0,
        nilBudgetUsed: 0,
        nilBoostFromSponsor: 0,
        alumniRegistry,
        chemistry: 50,
    };
  });
  
  allTeams.forEach(team => {
      if (!team.isUserTeam) {
          team.staff = {
              assistants: Array.from({ length: 3 }, () => createStaff('Assistant Coach')),
              trainers: Array.from({ length: 2 }, () => createStaff('Trainer')),
              scouts: Array.from({ length: 2 }, () => createStaff('Scout'))
          };
      }
      team.sponsorRevenue = calculateSponsorRevenueSnapshot(team);
      const projectedFinances = calculateTeamRevenue(team, null);
      team.initialProjectedRevenue = projectedFinances;
      
      const weeks = 30;
      const allocations: BudgetAllocations = {
          marketing: Math.round(projectedFinances.marketingExpenses / weeks),
          recruiting: Math.round(projectedFinances.recruitingExpenses / weeks),
          facilities: Math.round(projectedFinances.facilitiesExpenses / weeks),
          staffDevelopment: 0,
      };

      team.budget = { 
          cash: 16000,
          allocations
      };
      
      team.boardExpectations = generateBoardExpectations(team);
      
      team.financialHistory = [];
      const nilBudget = calculateTeamNilBudget(team, {
          fanSentiment: team.fanMorale || team.fanInterest,
          sponsorTier: team.sponsor?.tier || 'Low',
          tournamentBonus: 0,
      });
      team.nilBudget = nilBudget;
      team.nilBudgetUsed = 0;
      team.nilBoostFromSponsor = Math.round(nilBudget * 0.15);
  });

  const { history: initialHistory, teamsWithBoost } = generatePreseasonHistory(allTeams);
  const prestigeMap = Object.fromEntries(teamsWithBoost.map(team => [team.name, team.prestige]));
  const earliestSeason = resolveEarliestSeason({ historyMap: initialHistory.teamHistory });
  allTeams = teamsWithBoost.map(team => ({
      ...team,
      headCoach: createHeadCoachProfile(team.name, team.prestige, 1, {
          historyMap: initialHistory.teamHistory,
          teamPrestigeMap: prestigeMap,
          currentSeason: 1,
          seedCurrentTeamHistory: true,
          earliestSeason,
      }),
  }));

  const season = 1;
  const seasonYear = seasonToCalendarYear(season);
  const seasonAnchors = buildSeasonAnchors(seasonYear);

  const scheduleSettings = {
      regularSeasonGamesPerTeam: 31,
      // Override here for per-conference targets; otherwise defaults by tier (Power/Mid/Low) apply.
      conferenceGamesByConference: {
          SEC: 20,
          'Big Ten': 20,
          'Big 12': 20,
          ACC: 20,
          'Big East': 20,
          'Mountain West': 18,
          AAC: 18,
          'A-10': 18,
          WCC: 18,
          'Missouri Valley': 18,
      } as Record<string, number>,
  };

  const generatedSchedule = generateSeasonSchedule(seasonYear, allTeams, scheduleSettings, seasonAnchors);
  const schedule = generatedSchedule.legacySchedule;

  const validationIssues = validateSeasonSchedule(generatedSchedule, allTeams, scheduleSettings);
  if (validationIssues.length) {
      // Non-fatal: surface issues in console for now to avoid bricking saved games.
      console.warn('Schedule validation issues:', validationIssues);
  }

  const eventQueue: GameEvent[] = [];
  generatedSchedule.regularSeasonDates.forEach((dateISO, idx) => {
      const week = idx + 1;
      const ids = generatedSchedule.scheduledEventIdsByDate[dateISO] || [];
      for (const id of ids) {
          const ev = generatedSchedule.scheduledGamesById[id];
          eventQueue.push({
              id,
              date: dateISO,
              type: EventType.GAME,
              label: `${ev.awayTeamId} @ ${ev.homeTeamId}`,
              processed: false,
              payload: {
                  scheduledGameEventId: id,
                  homeTeam: ev.homeTeamId,
                  awayTeam: ev.awayTeamId,
                  isConference: !!ev.conferenceId,
                  week,
              },
          });
      }
  });
	  let recruits: Recruit[] = Array.from({ length: 350 }, createRecruit);
	  recruits = generateRecruitRelationships(recruits, allTeams);
	  recruits = recomputeRecruitBoardRanks(recruits);
	  // Recruiting offers are generated over time (daily), not pre-seeded at world init.
  const { sponsors: finalSponsors, updatedTeams } = recalculateSponsorLandscape(allTeams, initialSponsors, null);
  allTeams = updatedTeams;

  allTeams.sort((a, b) => a.name.localeCompare(b.name));

  const internationalProspects = generateInternationalProspects();
  const nbaSimulation = simulateNBASeason(1);

  // Initialize NBA Mode Data
  const nbaTeams = initializeNBATeams();
  const nbaSchedule = generateNBASchedule(nbaTeams);

  const eventPlaybookCatalog = buildEventPlaybookCatalog();
  // Pass allTeams to buildSponsorQuestDeck so we can match quests to current sponsors
  const sponsorQuestDeck = allTeams.flatMap(team => generateSponsorQuests(team, 1));
  return {
      allTeams,
      schedule,
      eventQueue,
      seasonYear,
      seasonAnchors,
      recruitingCadence: 'daily',
      scheduledGamesById: generatedSchedule.scheduledGamesById,
      teamSchedulesById: generatedSchedule.teamSchedulesById,
      scheduledEventIdsByDate: generatedSchedule.scheduledEventIdsByDate,
      recruits,
      sponsors: finalSponsors,
      initialHistory,
      internationalProspects,
      nbaSimulation,
      nbaTeams,
      nbaSchedule,
      eventPlaybookCatalog,
      sponsorQuestDeck,
      nbaFreeAgents: generateInitialNBAFreeAgents(),
      nbaTransactions: [],
      nbaDraftPickAssets: buildInitialDraftPickAssets()
  };
};

const SCHEDULING_CONFIG = {
  NUM_GAMES: 31,
  conferenceGames: {
    Power: 18,
    Mid: 18,
    Low: 16,
    Independent: 8,
  },
  weights: {
    conferenceBothNeed: 80,
    sameConference: 40,
    prestigeSimilarityBase: 30,
    prestigeSimilarityMultiplier: 1.0,
    powerVsPowerBonus: 10,
    powerVsLowPenalty: -10,
    midVsPowerBonus: 5,
  },
  maxNonConfMeetingsSamePair: 1,
  maxConfMeetingsSamePair: 2,
  topScoreRandomVariance: 5,
};

type ConferenceTier = "Power" | "Mid" | "Low" | "Independent";

const getConferenceTier = (conference: string): ConferenceTier => {
  return (CONFERENCE_STRENGTH[conference] as ConferenceTier) || 'Independent';
};

export const generateSchedule = (teams: Team[]): GameResult[][] => {
  const { NUM_GAMES } = SCHEDULING_CONFIG;

  const conferenceMap: Record<string, string[]> = {};
  teams.forEach(team => {
    const conf = team.conference || 'Independent';
    if (!conferenceMap[conf]) {
      conferenceMap[conf] = [];
    }
    conferenceMap[conf].push(team.name);
  });

  const teamInfoByName: Record<string, {
    conference: string;
    tier: ConferenceTier;
    prestige: number;
    confTarget: number;
  }> = {};

  teams.forEach(team => {
    const conference = team.conference || 'Independent';
    const tier = getConferenceTier(conference);
    const confSize = conferenceMap[conference]?.length || 0;
    const baseTarget = SCHEDULING_CONFIG.conferenceGames[tier];
    const maxConfGames = confSize > 1 ? Math.min(2 * (confSize - 1), NUM_GAMES - 4) : 0;
    teamInfoByName[team.name] = {
      conference,
      tier,
      prestige: team.prestige,
      confTarget: Math.min(baseTarget, maxConfGames),
    };
  });

  const gamesPerTeam: Record<string, number> = {};
  const confGamesPerTeam: Record<string, number> = {};
  const pairCounts: Record<string, number> = {};
  teams.forEach(team => {
    gamesPerTeam[team.name] = 0;
    confGamesPerTeam[team.name] = 0;
  });

  const getPairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  const chooseOpponent = (teamName: string, usedToday: Set<string>): string | null => {
    const teamData = teamInfoByName[teamName];
    let bestScore = -Infinity;
    let candidates: string[] = [];

    const eligibleOpponents = teams.filter(opp => {
      if (opp.name === teamName) return false;
      if (usedToday.has(opp.name)) return false;
      if (gamesPerTeam[opp.name] >= NUM_GAMES) return false;

      const pairKey = getPairKey(teamName, opp.name);
      const sameConf = teamInfoByName[teamName].conference === teamInfoByName[opp.name].conference;
      const maxMeetings = sameConf
        ? SCHEDULING_CONFIG.maxConfMeetingsSamePair
        : SCHEDULING_CONFIG.maxNonConfMeetingsSamePair;
      
      return (pairCounts[pairKey] || 0) < maxMeetings;
    });

    if (eligibleOpponents.length === 0) return null;

    const scoredOpponents = eligibleOpponents.map(opp => {
      const oppData = teamInfoByName[opp.name];
      let score = 0;

      const prestigeDiff = Math.abs(teamData.prestige - oppData.prestige);
      const sameConf = teamData.conference === oppData.conference;
      const needConf = confGamesPerTeam[teamName] < teamData.confTarget;
      const oppNeedConf = confGamesPerTeam[opp.name] < oppData.confTarget;

      if (sameConf) {
        score += SCHEDULING_CONFIG.weights.sameConference;
        if (needConf && oppNeedConf) {
          score += SCHEDULING_CONFIG.weights.conferenceBothNeed;
        }
      }

      const { prestigeSimilarityBase, prestigeSimilarityMultiplier } = SCHEDULING_CONFIG.weights;
      score += (prestigeSimilarityBase - Math.min(prestigeDiff, prestigeSimilarityBase)) * prestigeSimilarityMultiplier;

      if (teamData.tier === 'Power' && oppData.tier === 'Power') {
        score += SCHEDULING_CONFIG.weights.powerVsPowerBonus;
      } else if (!sameConf && ((teamData.tier === 'Power' && oppData.tier === 'Low') || (teamData.tier === 'Low' && oppData.tier === 'Power'))) {
        score += SCHEDULING_CONFIG.weights.powerVsLowPenalty;
      }

      if ((teamData.tier === 'Mid' && (oppData.tier === 'Power' || oppData.tier === 'Mid')) || (oppData.tier === 'Mid' && (teamData.tier === 'Power' || teamData.tier === 'Mid'))) {
          score += SCHEDULING_CONFIG.weights.midVsPowerBonus;
      }

      return { name: opp.name, score };
    });

    if (scoredOpponents.length === 0) return null;

    bestScore = Math.max(...scoredOpponents.map(o => o.score));
    
    const topGroup = scoredOpponents.filter(
      o => o.score >= bestScore - SCHEDULING_CONFIG.topScoreRandomVariance
    );

    return topGroup.length > 0 ? pickRandom(topGroup).name : null;
  };

  const schedule: GameResult[][] = Array.from({ length: NUM_GAMES }, () => []);

  for (let day = 0; day < NUM_GAMES; day++) {
    const usedToday = new Set<string>();
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    for (const team of shuffledTeams) {
      if (usedToday.has(team.name) || gamesPerTeam[team.name] >= NUM_GAMES) {
        continue;
      }

      const opponentName = chooseOpponent(team.name, usedToday);
      if (!opponentName) {
        continue;
      }

      const homeTeam = Math.random() > 0.5 ? team.name : opponentName;
      const awayTeam = homeTeam === team.name ? opponentName : team.name;

      schedule[day].push({ homeTeam, awayTeam, homeScore: 0, awayScore: 0, played: false });

      const pairKey = getPairKey(team.name, opponentName);
      pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
      gamesPerTeam[team.name]++;
      gamesPerTeam[opponentName]++;

      if (teamInfoByName[team.name].conference === teamInfoByName[opponentName].conference) {
        confGamesPerTeam[team.name]++;
        confGamesPerTeam[opponentName]++;
      }

      usedToday.add(team.name);
      usedToday.add(opponentName);
    }
  }

  // Safety pass
  const teamsNeedingGames = teams.filter(t => gamesPerTeam[t.name] < NUM_GAMES);
  for (const team of teamsNeedingGames) {
    while (gamesPerTeam[team.name] < NUM_GAMES) {
      const opponent = teams.find(
        opp => opp.name !== team.name && gamesPerTeam[opp.name] < NUM_GAMES
      );

      if (!opponent) {
        break; 
      }

      let dayFound = false;
      for (let day = 0; day < NUM_GAMES; day++) {
        const isTeamBusy = schedule[day].some(g => g.homeTeam === team.name || g.awayTeam === team.name);
        const isOpponentBusy = schedule[day].some(g => g.homeTeam === opponent.name || g.awayTeam === opponent.name);

        if (!isTeamBusy && !isOpponentBusy) {
          const homeTeam = Math.random() > 0.5 ? team.name : opponent.name;
          const awayTeam = homeTeam === team.name ? opponent.name : team.name;
          schedule[day].push({ homeTeam, awayTeam, homeScore: 0, awayScore: 0, played: false });
          
          gamesPerTeam[team.name]++;
          gamesPerTeam[opponent.name]++;
          const pairKey = getPairKey(team.name, opponent.name);
          pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
           if (teamInfoByName[team.name].conference === teamInfoByName[opponent.name].conference) {
            confGamesPerTeam[team.name]++;
            confGamesPerTeam[opponent.name]++;
          }
          dayFound = true;
          break;
        }
      }
       if (!dayFound) {
         //This can happen if a team has a full schedule but their opponent doesn't.
         //In a real scenario, might need a more robust way to handle this, but for now, we'll just break.
         break;
       }
    }
  }

  return schedule;
};

export const getContactPoints = (team: Team | null): number => {
    if (!team) return 10;
    const gradeBonuses: Record<StaffGrade, number> = { 'A': 10, 'B': 6, 'C': 3, 'D': 0 };
    const scoutBonus = team.staff.scouts.reduce((total, scout) => total + gradeBonuses[scout.grade], 0);
    const prestigeBoost = Math.floor(team.prestige / 6); // high prestige should meaningfully lift contact reach
    const elitePrestigeBonus = team.prestige >= 90 ? 5 : team.prestige >= 80 ? 3 : 0;
    return 10 + scoutBonus + getWealthRecruitingBonus(team) + prestigeBoost + elitePrestigeBonus;
};

const INJURY_TYPES: InjuryType[] = ['Sprained Ankle', 'Torn ACL', 'Concussion'];
const INJURY_SEVERITY_DURATIONS: Record<InjurySeverity, [number, number]> = {
    Minor: [1, 2],
    Moderate: [3, 6],
    Severe: [20, 26],
};
const INJURY_REINJURY_BASE: Record<InjurySeverity, number> = {
    Minor: 0.12,
    Moderate: 0.22,
    Severe: 0.35,
};
const TRAINER_PROTECTION: Record<StaffGrade, number> = {
    A: 0.04,
    B: 0.025,
    C: 0.01,
    D: 0.005,
};
const TRAINER_RECOVERY_BONUS: Record<StaffGrade, number> = {
    A: 1.1,
    B: 0.8,
    C: 0.5,
    D: 0.25,
};

const determineInjurySeverity = (): InjurySeverity => {
    const roll = Math.random();
    if (roll < 0.65) return 'Minor';
    if (roll < 0.9) return 'Moderate';
    return 'Severe';
};

const createPlayerInjury = (severity: InjurySeverity): PlayerInjury => {
    const [minWeeks, maxWeeks] = INJURY_SEVERITY_DURATIONS[severity];
    const baseWeeks = severity === 'Severe' ? 999 : randomBetween(minWeeks, maxWeeks);
    return {
        type: pickRandom(INJURY_TYPES),
        severity,
        weeksRemaining: baseWeeks,
        isSeasonEnding: severity === 'Severe',
        reinjuryRisk: INJURY_REINJURY_BASE[severity],
    };
};

const getTrainerInjuryProtection = (team: Team): number => {
    return team.staff.trainers.reduce((total, trainer) => total + TRAINER_PROTECTION[trainer.grade], 0);
};

const getTrainerRecoveryBoost = (team: Team): number => {
    return team.staff.trainers.reduce((total, trainer) => total + TRAINER_RECOVERY_BONUS[trainer.grade], 0);
};

const getMedicalProtection = (team: Team): number => {
    return (team.facilities?.medical?.quality ?? 60) / 150;
};

const progressPlayerInjury = (player: Player, team: Team) => {
    if (!player.injury) return;
    const recoveryBoost = 1 + getTrainerRecoveryBoost(team) * 0.25 + (team.facilities?.medical?.quality ?? 60) / 80;
    player.injury.weeksRemaining = Math.max(0, player.injury.weeksRemaining - Math.max(1, Math.round(recoveryBoost)));
    if (player.injury.weeksRemaining <= 0) {
        player.injury.reinjuryRisk = Math.max(
            0,
            player.injury.reinjuryRisk - (0.06 + getTrainerRecoveryBoost(team) * 0.02 + getMedicalProtection(team) * 0.02)
        );
        if (player.injury.reinjuryRisk <= 0) {
            player.injury = undefined;
        }
    }
};

const maybeApplyInjury = (team: Team, player: Player, stats: PlayerGameStatsData) => {
    if (!stats || stats.minutes <= 8) return;
    const isOut = player.injury?.weeksRemaining ?? 0 > 0;
    if (isOut) return;

    const returningFromInjury = player.injury && player.injury.weeksRemaining <= 0 && player.injury.reinjuryRisk > 0;
    const staminaPenalty = Math.max(0, 75 - (player.stats.stamina ?? 70)) / 100;
    const minutesFactor = stats.minutes / 40;
    const baseChance = 0.02 + minutesFactor * 0.035 + staminaPenalty * 0.02;
    const trainerProtection = getTrainerInjuryProtection(team);
    const medicalProtection = getMedicalProtection(team);

    if (returningFromInjury) {
        const reinjuryChance = clamp(player.injury!.reinjuryRisk - trainerProtection - medicalProtection * 0.5, 0.01, 0.4);
        if (Math.random() < reinjuryChance) {
            const severity = player.injury!.severity === 'Severe' ? 'Severe' : 'Moderate';
            player.injury = createPlayerInjury(severity);
            player.rotationMinutes = 0;
            team.chemistry = clamp((team.chemistry || 50) - 0.75, 0, 100);
        }
        return;
    }

    const injuryChance = clamp(baseChance - trainerProtection - medicalProtection, 0.005, 0.28);
    if (Math.random() < injuryChance) {
        const severity = determineInjurySeverity();
        player.injury = createPlayerInjury(severity);
        player.rotationMinutes = 0;
        team.chemistry = clamp((team.chemistry || 50) - 0.5, 0, 100);
        player.morale = clamp((player.morale ?? 80) - (severity === 'Minor' ? 3 : severity === 'Moderate' ? 6 : 10), 0, 100);
    }
};

const updatePlayerMoraleAndStreaks = (team: Team, gameStats: GamePlayerStats[], won: boolean) => {
    const teamMoraleChange = won ? 2 : -2;
    
    // Chemistry update
    team.chemistry = clamp((team.chemistry || 50) + (won ? 1 : -1), 0, 100);

    team.roster.forEach(player => {
        const stats = gameStats.find(s => s.playerId === player.id)?.stats;
        if (!stats) return;

        // Morale update
        let moraleChange = teamMoraleChange;
        if (stats.minutes > (player.rotationMinutes || 0)) moraleChange += 1;
        else if (stats.minutes < (player.rotationMinutes || 0) / 2) moraleChange -= 1;
        
        player.morale = clamp((player.morale || 80) + moraleChange, 0, 100);

        // Streak update
        const ppg = (player.seasonStats.points / Math.max(1, player.seasonStats.gamesPlayed)) || 10;
        if (stats.points > Math.max(10, ppg * 1.5)) {
            player.streak = { type: 'Hot', duration: 3, impact: { outsideScoring: 5, insideScoring: 5 } };
        } else if (stats.points < ppg * 0.5 && stats.minutes > 15) {
            player.streak = { type: 'Cold', duration: 3, impact: { outsideScoring: -5, insideScoring: -5 } };
        } else {
            // Decrement duration
            if (player.streak && player.streak.duration > 0) {
                player.streak.duration--;
                if (player.streak.duration <= 0) {
                    player.streak = { type: 'Neutral', duration: 0, impact: {} };
                }
            } else if (!player.streak) {
                 player.streak = { type: 'Neutral', duration: 0, impact: {} };
            }
        }

        maybeApplyInjury(team, player, stats);

        // Role-based chemistry impact
        if (player.role === 'Glue Guy' && stats.minutes > 10) {
            team.chemistry = clamp((team.chemistry || 50) + 0.5, 0, 100);
        }
        if (player.role === 'Volume Scorer') {
            const efficiency = (stats.points + stats.rebounds + stats.assists) / (stats.fieldGoalsAttempted || 1);
            if (efficiency < 0.8 && stats.fieldGoalsAttempted > 10) {
                team.chemistry = clamp((team.chemistry || 50) - 1, 0, 100);
            }
        }
        if (player.role === 'Locker Room Leader') {
            team.chemistry = clamp((team.chemistry || 50) + 0.5, 0, 100);
        }
    });
};

const getEffectiveStats = (player: Player): Player['stats'] => {
    const stats = { ...player.stats };
    
    // Apply streak impact
    if (player.streak && player.streak.impact) {
        (Object.keys(player.streak.impact) as (keyof Player['stats'])[]).forEach(key => {
            if (player.streak!.impact[key]) {
                stats[key] = clamp(stats[key] + player.streak!.impact[key]!, 0, 99);
            }
        });
    }

    // Apply morale impact
    if (player.morale !== undefined) {
        if (player.morale > 90) {
            stats.insideScoring += 2;
            stats.outsideScoring += 2;
            stats.perimeterDefense += 2;
            stats.insideDefense += 2;
        } else if (player.morale < 60) {
            stats.insideScoring -= 2;
            stats.outsideScoring -= 2;
            stats.perimeterDefense -= 2;
            stats.insideDefense -= 2;
        }
    }

    return stats;
};

const isPlayerAvailableForGame = (player: Player): boolean => {
    return !player.injury || player.injury.weeksRemaining <= 0;
};

export const simulateGame = (homeTeam: Team, awayTeam: Team, gameId: string, adjustment?: GameAdjustment, userCoachSkills?: string[]): GameBoxScore => {
  const isNBA = homeTeam.league === 'NBA';
  const MINUTES_PER_GAME = isNBA ? 48 : 40;
  const TOTAL_TEAM_MINUTES = MINUTES_PER_GAME * 5;


  const homeAdvantage = 5;
  let gameTimeRemaining = MINUTES_PER_GAME * 60; // total seconds (40 min game * 60 sec/min)
  const gradeBoosts: Record<StaffGrade, number> = { 'A': 4, 'B': 2.5, 'C': 1, 'D': 0 };
  const getAssistantBoost = (team: Team): number => team.staff.assistants.reduce((total, coach) => total + gradeBoosts[coach.grade], 0);

  const MIN_ROTATION_PLAYERS = 9;
  const MIN_ROTATION_MINUTES = isNBA ? 8 : 6;
  const getPlayerFocusMultiplier = (team: Team, player: Player) => team.playerFocusId === player.id ? 1.35 : 1;
  const isTeamCaptain = (team: Team, player: Player) => team.teamCaptainId === player.id;

  const staminaMinuteCap = (player: Player) => {
    const stamina = player.stats.stamina ?? 70;
    // Scale: 60 stamina ~23 min cap, 80 ~29, 99 ~35
    const cap = Math.round(20 + Math.max(0, stamina - 50) * 0.3);
    return Math.max(0, Math.min(MINUTES_PER_GAME, cap));
  };

  const getRotationMinuteCap = (player: Player, rotationRank: number) => {
    const overall = player.overall;
    let cap = 35;
    if (overall >= 95) cap = isNBA ? 38 : 29;
    else if (overall >= 93) cap = isNBA ? 36 : 30;
    else if (overall >= 90) cap = isNBA ? 35 : 31;
    else if (overall >= 85) cap = isNBA ? 34 : 32;
    else if (overall >= 80) cap = isNBA ? 32 : 33;
    else if (overall >= 75) cap = isNBA ? 30 : 34;
    if (!player.starterPosition || rotationRank >= 5) {
      const benchPenalty = Math.min(4, Math.max(0, rotationRank - 4));
      cap = Math.max(isNBA ? 15 : 22, cap - benchPenalty);
    }
    // Scale stamina cap for NBA
    const staminaCap = isNBA ? Math.round(staminaMinuteCap(player) * 1.2) : staminaMinuteCap(player);
    return Math.min(isNBA ? 48 : 40, Math.min(cap, staminaCap));
  };

  const assignRotationMinutes = (team: Team) => {
    const roster = team.roster;
    const hasMinutes = roster.some(p => (p.rotationMinutes ?? 0) > 0);
    const totalAssigned = roster.reduce((sum, p) => sum + Math.max(0, Math.round(p.rotationMinutes ?? 0)), 0);
    const isUserTeam = !!team.isUserTeam;
    const needsAutoAllocation = isUserTeam ? (!hasMinutes || totalAssigned !== TOTAL_TEAM_MINUTES) : true;
    if (!needsAutoAllocation) return;

    roster.forEach(player => {
      if (!isPlayerAvailableForGame(player)) {
        player.rotationMinutes = 0;
      }
    });
    const eligibleEntries = roster
      .map((player, idx) => ({ player, idx }))
      .filter(entry => isPlayerAvailableForGame(entry.player));
    const rotationEntries = eligibleEntries.length > 0 ? eligibleEntries : roster.map((player, idx) => ({ player, idx }));
    const rotationCount = Math.min(
      Math.max(MIN_ROTATION_PLAYERS, Math.ceil(rotationEntries.length * 0.7)),
      rotationEntries.length
    );
    const rotationOrder = rotationEntries
      .map((entry, idx) => ({ idx: entry.idx, weight: (entry.player.starterPosition ? 1.6 : 1.0) * (entry.player.overall / 100 + 0.5) * getPlayerFocusMultiplier(team, entry.player) }))
      .sort((a, b) => b.weight - a.weight);
    const weights = new Array(roster.length).fill(0);
    rotationOrder.forEach(entry => {
      weights[entry.idx] = entry.weight;
    });
    const rotationIndices = rotationOrder.slice(0, rotationCount).map(entry => entry.idx);
    const allocations = new Array(roster.length).fill(0);
    const rotationCaps = new Map<number, number>();
    rotationIndices.forEach((idx, order) => {
      rotationCaps.set(idx, getRotationMinuteCap(roster[idx], order));
    });

    let baselineMinutes = MIN_ROTATION_MINUTES;
    if (rotationCount * baselineMinutes > TOTAL_TEAM_MINUTES) {
      baselineMinutes = Math.max(1, Math.floor(TOTAL_TEAM_MINUTES / rotationCount));
    }
    const baseTotal = baselineMinutes * rotationCount;
    let remaining = TOTAL_TEAM_MINUTES - baseTotal;

    const weightSum = rotationIndices.reduce((sum, idx) => sum + weights[idx], 0) || rotationCount;
    const bonuses: Record<number, number> = {};
    let distributed = 0;
    rotationIndices.forEach(idx => {
      const bonus = remaining > 0 ? Math.floor((weights[idx] / weightSum) * remaining) : 0;
      bonuses[idx] = bonus;
      distributed += bonus;
    });
    rotationIndices.forEach(idx => {
      const target = Math.round(baselineMinutes + (bonuses[idx] || 0));
      allocations[idx] = Math.min(rotationCaps.get(idx) ?? (isNBA ? 48 : 35), Math.max(0, Math.min(MINUTES_PER_GAME, target)));
    });

    let total = allocations.reduce((sum, val) => sum + val, 0);
    let diff = TOTAL_TEAM_MINUTES - total;
    while (diff !== 0) {
      const eligible = rotationIndices
        .map(idx => ({ idx, minutes: allocations[idx], weight: weights[idx], cap: rotationCaps.get(idx) ?? 40 }));
      const filtered = eligible.filter(entry => diff > 0 ? entry.minutes < entry.cap : entry.minutes > baselineMinutes);
      if (!filtered.length) break;
      const entry = filtered.sort((a, b) => diff > 0 ? b.weight - a.weight : a.weight - b.weight)[0];
      allocations[entry.idx] += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
    }

    roster.forEach((p, idx) => {
      p.rotationMinutes = allocations[idx];
    });
  };

  const hasAssignedMinutes = (player: Player) => (player.rotationMinutes ?? 0) > 0;
  const getPlayableRoster = (team: Team) => {
    const eligible = team.roster.filter(p => hasAssignedMinutes(p) && isPlayerAvailableForGame(p));
    const fallback = eligible.length > 0
      ? eligible
      : team.roster.filter(p => isPlayerAvailableForGame(p));
    const active = fallback.length > 0 ? fallback : team.roster;
    return active.map(p => ({ ...p, stats: getEffectiveStats(p) }));
  };

  assignRotationMinutes(homeTeam);
  assignRotationMinutes(awayTeam);
  const minutesShare = (player: Player) => Math.max(0.05, (player.rotationMinutes ?? 0) / MINUTES_PER_GAME);
  const getRatings = (team: Team) => {
    let offense = 0, defense = 0, tempo = 0;
    team.roster.forEach(p => {
        const captainMultiplier = isTeamCaptain(team, p) ? 1.1 : 1;
        const weight = minutesShare(p) * (p.starterPosition ? 1.4 : 0.8) * captainMultiplier;
        offense += (p.stats.insideScoring + p.stats.outsideScoring + p.stats.playmaking) * weight;
        defense += (p.stats.perimeterDefense + p.stats.insideDefense + p.stats.rebounding) * weight;
        tempo += p.stats.playmaking * weight;
        if (isTeamCaptain(team, p)) {
            offense += 2.5;
            defense += 2.5;
        }
    });
    const divisor = team.roster.reduce((sum, p) => sum + minutesShare(p) * (p.starterPosition ? 1.4 : 0.8), 1);
    return { offense: offense / divisor, defense: defense / divisor, tempo: tempo / divisor };
  };

  const homeRatings = getRatings(homeTeam);
  const awayRatings = getRatings(awayTeam);

  let homeOffensivePower = homeRatings.offense + getAssistantBoost(homeTeam) + homeAdvantage;
  let awayOffensivePower = awayRatings.offense + getAssistantBoost(awayTeam);
  let homeDefensivePower = homeRatings.defense;
  let awayDefensivePower = awayRatings.defense;

  // Apply Playbook Familiarity
  const homeFamiliarityBonus = homeTeam.playbookFamiliarity / 40; // 2.5 at max familiarity
  const awayFamiliarityBonus = awayTeam.playbookFamiliarity / 40;

  homeOffensivePower += homeFamiliarityBonus;
  homeDefensivePower -= awayFamiliarityBonus * 0.5; // Opponent's familiarity makes your defense worse
  awayOffensivePower += awayFamiliarityBonus;
  awayDefensivePower -= homeFamiliarityBonus * 0.5;

  // Apply Coach Skills (Clipboard Wizard)
  if (userCoachSkills && userCoachSkills.includes('clipboard_wizard')) {
      // Find skill level - assuming max level 3, we need to know the level.
      // But we only passed the list of skill IDs.
      // The skill ID in the list might just be 'clipboard_wizard'.
      // Wait, the skills array in Coach is just a list of unlocked skill IDs.
      // It doesn't store the level directly in the ID string usually.
      // However, the `Coach` interface has `skills: string[]`.
      // If the skill system allows multiple levels, how are they stored?
      // Looking at `COACH_SKILL_TREE` in constants, they have `maxLevel`.
      // If I buy level 2, do I get 'clipboard_wizard_2'? Or just 'clipboard_wizard'?
      // Let's assume for now it's just presence of the skill ID implies at least level 1.
      // To handle levels properly, I might need to change how skills are stored or passed.
      // For now, I'll apply a flat bonus if the skill is present, or check for 'clipboard_wizard_1', 'clipboard_wizard_2', etc. if that's how it works.
      // Checking `PURCHASE_SKILL` reducer in App.tsx might clarify.
      // It pushes `action.payload.skillId` to `state.coach.skills`.
      // The skill IDs in `COACH_SKILL_TREE` are just 'silver_tongue', etc.
      // So currently, it seems like binary: you have it or you don't.
      // But `COACH_SKILL_TREE` has `level` and `maxLevel`.
      // If I buy it again, does it add it again?
      // The reducer logic needs to be checked.
      // If the system is simple, maybe it just adds the ID.
      // If I want levels, I should probably check how many times the ID appears or if there are distinct IDs.
      // Let's assume for this step that presence = Level 1 effect (+2).
      // If the user has upgraded it, maybe we need to pass the level.
      // I'll stick to a simple check for now: +2 if present.
      
      const skillBonus = 2; 
      if (homeTeam.isUserTeam) {
          homeOffensivePower += skillBonus;
          homeDefensivePower += skillBonus;
      }
      if (awayTeam.isUserTeam) {
          awayOffensivePower += skillBonus;
          awayDefensivePower += skillBonus;
      }
  }

  // Apply Coach Skills (Clipboard Wizard)
  if (userCoachSkills && userCoachSkills.includes('clipboard_wizard')) {
      if (homeTeam.isUserTeam) {
          homeOffensivePower += 2;
          homeDefensivePower += 2;
      }
      if (awayTeam.isUserTeam) {
          awayOffensivePower += 2;
          awayDefensivePower += 2;
      }
  }

  // Apply Adjustments
  if (adjustment) {
      if (homeTeam.isUserTeam) {
          if (adjustment === 'focus_inside') homeOffensivePower += 3;
          if (adjustment === 'focus_outside') homeOffensivePower += 3;
          if (adjustment === 'aggressive_defense') homeDefensivePower += 3;
          if (adjustment === 'conservative_defense') homeDefensivePower += 2;
      }
      if (awayTeam.isUserTeam) {
          if (adjustment === 'focus_inside') awayOffensivePower += 3;
          if (adjustment === 'focus_outside') awayOffensivePower += 3;
          if (adjustment === 'aggressive_defense') awayDefensivePower += 3;
          if (adjustment === 'conservative_defense') awayDefensivePower += 2;
      }
  }

  const basePossessions = isNBA ? 200 : 136; // NBA ~100 possessions per team, NCAA ~68
  let tempoAdjustment = clamp(Math.round((homeRatings.tempo + awayRatings.tempo - 140) / 6), -10, 14);
  
  if (adjustment) {
      if ((homeTeam.isUserTeam && adjustment === 'tempo_push') || (awayTeam.isUserTeam && adjustment === 'tempo_push')) tempoAdjustment += 8;
      if ((homeTeam.isUserTeam && adjustment === 'tempo_slow') || (awayTeam.isUserTeam && adjustment === 'tempo_slow')) tempoAdjustment -= 8;
  }

  const possessions = clamp(basePossessions + tempoAdjustment, isNBA ? 180 : 108, isNBA ? 220 : 150);
  const secondsPerPossession = (MINUTES_PER_GAME * 60) / possessions;
  
  const possessionsToSim = possessions;

  let homeScore = 0;
  let awayScore = 0;
  const playByPlay: PlayByPlayEvent[] = [];

  const homePlayable = getPlayableRoster(homeTeam);
  const awayPlayable = getPlayableRoster(awayTeam);
  
  // Initialize stats or use existing
  const homeStats: GamePlayerStats[] =
    homePlayable.map(p => ({ playerId: p.id, name: p.name, pos: p.position, stats: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0, freeThrowsMade: 0, freeThrowsAttempted: 0, minutes: Math.round(p.rotationMinutes ?? 0) } }));
  
  const awayStats: GamePlayerStats[] =
    awayPlayable.map(p => ({ playerId: p.id, name: p.name, pos: p.position, stats: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0, freeThrowsMade: 0, freeThrowsAttempted: 0, minutes: Math.round(p.rotationMinutes ?? 0) } }));

  let possessionTeam: 'home' | 'away' = 'home';

  for (let i = 0; i < possessionsToSim; i++) {
    gameTimeRemaining = Math.max(0, gameTimeRemaining - secondsPerPossession);

    const offensiveTeam = possessionTeam === 'home' ? homeTeam : awayTeam;
    const defensiveTeam = possessionTeam === 'home' ? awayTeam : homeTeam;
    const offensivePower = possessionTeam === 'home' ? homeOffensivePower : awayOffensivePower;
    const defensivePower = possessionTeam === 'home' ? awayDefensivePower : homeDefensivePower;
    const offensiveStats = possessionTeam === 'home' ? homeStats : awayStats;
    const offensiveRoster = getPlayableRoster(offensiveTeam);
    const defensiveRoster = getPlayableRoster(defensiveTeam);

    const weightedPlayers = offensiveRoster.map(p => ({
      player: p,
      weight: (minutesShare(p) * 8) * (p.starterPosition ? 1.2 : 0.8) * getPlayerFocusMultiplier(offensiveTeam, p),
    }));
    const totalWeight = weightedPlayers.reduce((sum, p) => sum + p.weight, 0);
    const randomWeight = Math.random() * totalWeight;
    let weightSum = 0;
    const shotTaker = weightedPlayers.find(p => {
        weightSum += p.weight;
        return randomWeight < weightSum;
    })!.player;

    const shotTakerStats = offensiveStats.find(s => s.playerId === shotTaker.id)!;

    const outsideTilt = clamp((shotTaker.stats.outsideScoring - shotTaker.stats.insideScoring) / 160, -0.12, 0.12);
    let threeRate = clamp(0.32 + outsideTilt, 0.18, 0.48);
    
    // Adjustment impact on shot selection
    if (offensiveTeam.isUserTeam && adjustment === 'focus_outside') threeRate += 0.15;
    if (offensiveTeam.isUserTeam && adjustment === 'focus_inside') threeRate -= 0.15;

    const shotType = Math.random() < threeRate ? 'three' : 'two';
    const shotDifficulty = Math.random() * 100;

    const baseShotChance = shotType === 'three' ? shotTaker.stats.outsideScoring : shotTaker.stats.insideScoring;
    const rotationBoost = minutesShare(shotTaker);
    const overallBoost = shotTaker.overall / 100;
    const contestFactor = (defensivePower / Math.max(10, offensivePower)) * 18;
    const shotChance = clamp(
      baseShotChance * 0.68 + overallBoost * 13 + rotationBoost * 11 - contestFactor * 0.5 + (offensiveTeam.playerFocusId === shotTaker.id ? 4 : 0),
      14,
      84
    );
    const effectiveDifficulty = shotDifficulty + contestFactor * 0.55;

    if (shotChance > effectiveDifficulty) {
      const points = shotType === 'three' ? 3 : 2;
      if (possessionTeam === 'home') homeScore += points; else awayScore += points;
      shotTakerStats.stats.points += points;
      shotTakerStats.stats.fieldGoalsMade++;
      shotTakerStats.stats.fieldGoalsAttempted++;
      if (shotType === 'three') {
        shotTakerStats.stats.threePointersMade++;
        shotTakerStats.stats.threePointersAttempted++;
      }
      const ftSkill = clamp(0.65 + ((shotTaker.stats.outsideScoring + shotTaker.stats.playmaking) / 200) * 0.25, 0.6, 0.9);
      const makeFoulProbability = clamp(contestFactor / 110, 0.04, 0.16);
      if (Math.random() < makeFoulProbability) {
        const ftMade = Math.random() < ftSkill ? 1 : 0;
        shotTakerStats.stats.freeThrowsAttempted += 1;
        shotTakerStats.stats.freeThrowsMade += ftMade;
        shotTakerStats.stats.points += ftMade;
        if (possessionTeam === 'home') homeScore += ftMade; else awayScore += ftMade;
        playByPlay.push({ type: 'foulFT', text: `${shotTaker.name} draws and-1 and ${ftMade ? 'makes' : 'misses'} the free throw.`, player: shotTaker.name, team: offensiveTeam.name, timeRemaining: Math.floor(gameTimeRemaining / 60) });
      }
      playByPlay.push({ type: 'score', text: `${shotTaker.name} scores a ${points}-point shot.`, player: shotTaker.name, team: offensiveTeam.name, timeRemaining: Math.floor(gameTimeRemaining / 60) });

      const assistMakerCandidates = offensiveRoster.filter(p => p.id !== shotTaker.id);
      if (assistMakerCandidates.length > 0) {
        const assistMaker = pickRandom(assistMakerCandidates);
        const assistChance = Math.min(0.95, 0.25 + Math.min(0.6, minutesShare(assistMaker)) + assistMaker.stats.playmaking / 150);
        if (Math.random() < assistChance) {
            const assistMakerStats = offensiveStats.find(s => s.playerId === assistMaker.id)!;
            assistMakerStats.stats.assists++;
            playByPlay.push({ type: 'assist', text: `Assist by ${assistMaker.name}.`, player: assistMaker.name, team: offensiveTeam.name, timeRemaining: Math.floor(gameTimeRemaining / 60) });
        }
      }

      possessionTeam = possessionTeam === 'home' ? 'away' : 'home';
    } else {
      shotTakerStats.stats.fieldGoalsAttempted++;
      if (shotType === 'three') {
        shotTakerStats.stats.threePointersAttempted++;
      }
      const foulProbability = clamp(contestFactor / 105, 0.05, 0.2);
      if (Math.random() < foulProbability) {
        const attempts = shotType === 'three' ? 3 : 2;
        const ftSkill = clamp(0.65 + ((shotTaker.stats.outsideScoring + shotTaker.stats.playmaking) / 200) * 0.25, 0.6, 0.9);
        const made = Math.min(attempts, Math.round(attempts * ftSkill));
        shotTakerStats.stats.freeThrowsAttempted += attempts;
        shotTakerStats.stats.freeThrowsMade += made;
        shotTakerStats.stats.points += made;
        if (possessionTeam === 'home') homeScore += made; else awayScore += made;
        playByPlay.push({ type: 'foulFT', text: `${shotTaker.name} is fouled on the miss and shoots ${attempts} freebies (makes ${made}).`, player: shotTaker.name, team: offensiveTeam.name, timeRemaining: Math.floor(gameTimeRemaining / 60) });
      }

      const reboundCandidates = [...offensiveRoster, ...defensiveRoster];
      const fallbackRebounders = [...offensiveTeam.roster, ...defensiveTeam.roster];
      const rebounder = pickRandom(reboundCandidates.length > 0 ? reboundCandidates : fallbackRebounders);
      const rebounderTeam = homeTeam.roster.some(p => p.id === rebounder.id) ? 'home' : 'away';
      const rebounderStats = (rebounderTeam === 'home' ? homeStats : awayStats).find(s => s.playerId === rebounder.id)!;
      rebounderStats.stats.rebounds++;
      playByPlay.push({ type: 'rebound', text: `Rebound by ${rebounder.name}.`, player: rebounder.name, team: rebounderTeam === 'home' ? homeTeam.name : awayTeam.name, timeRemaining: Math.floor(gameTimeRemaining / 60) });

      possessionTeam = rebounderTeam;
    }

    let turnoverChance = 10 - (offensivePower / 20);
    // Playbook Familiarity: Reduce turnovers
    turnoverChance = Math.max(2, turnoverChance - (offensiveTeam.playbookFamiliarity / 15));
    if (offensiveTeam.teamCaptainId && offensiveRoster.some(p => p.id === offensiveTeam.teamCaptainId)) {
      turnoverChance -= 1.25;
    }
    
    // Adjustment impact on turnovers
    if (defensiveTeam.isUserTeam && adjustment === 'aggressive_defense') turnoverChance += 2.5;
    if (defensiveTeam.isUserTeam && adjustment === 'conservative_defense') turnoverChance -= 1.5;

    turnoverChance = Math.max(2, turnoverChance);
    if (Math.random() * 100 < turnoverChance) {
      const turnoverPlayerCandidates = offensiveRoster.length > 0 ? offensiveRoster : offensiveTeam.roster;
      const turnoverWeights = turnoverPlayerCandidates.map(p => ({
        player: p,
        weight: 1 - Math.min(0.9, minutesShare(p)),
      }));
      const sumTurnoverWeight = turnoverWeights.reduce((sum, entry) => sum + entry.weight, 0);
      let rnd = Math.random() * sumTurnoverWeight;
      let selected = turnoverWeights[0].player;
      for (const entry of turnoverWeights) {
        rnd -= entry.weight;
        if (rnd <= 0) {
          selected = entry.player;
          break;
        }
      }
      const turnoverPlayer = selected;
      const turnoverPlayerStats = offensiveStats.find(s => s.playerId === turnoverPlayer.id)!;
      turnoverPlayerStats.stats.turnovers++;
      playByPlay.push({ type: 'turnover', text: `Turnover by ${turnoverPlayer.name}.`, player: turnoverPlayer.name, team: offensiveTeam.name, timeRemaining: Math.floor(gameTimeRemaining / 60) });
      possessionTeam = possessionTeam === 'home' ? 'away' : 'home';
    }
  }

  const sumTeamPoints = (stats: GamePlayerStats[]) => stats.reduce((sum, ps) => sum + ps.stats.points, 0);
  homeScore = sumTeamPoints(homeStats);
  awayScore = sumTeamPoints(awayStats);

  // Overtime / Tie-breaking logic
  if (homeScore === awayScore) {
    const targetStats = Math.random() > 0.5 ? homeStats : awayStats;
    if (targetStats.length > 0) {
      const scorer = targetStats[Math.floor(Math.random() * targetStats.length)];
      scorer.stats.points += 1;
      scorer.stats.freeThrowsAttempted += 1;
      scorer.stats.freeThrowsMade += 1;
      if (targetStats === homeStats) {
        homeScore += 1;
      } else {
        awayScore += 1;
      }
    }
  }
  
  const applyGameProgressionToTeam = (team: Team) => {
      team.roster = team.roster.map(applyGameProgressionToPlayer);
  };
  applyGameProgressionToTeam(homeTeam);
  applyGameProgressionToTeam(awayTeam);

  updatePlayerMoraleAndStreaks(homeTeam, homeStats, homeScore > awayScore);
  updatePlayerMoraleAndStreaks(awayTeam, awayStats, awayScore > homeScore);

  return { gameId, homeTeam: homeTeam.name, awayTeam: awayTeam.name, homeScore, awayScore, homeTeamStats: homeStats, awayTeamStats: awayStats, playByPlay };
};

export const getTrainingPoints = (team: Team): number => {
    const gradeBonuses: Record<StaffGrade, number> = { 'A': 10, 'B': 6, 'C': 3, 'D': 0 };
    const trainerBonus = team.staff.trainers.reduce((total, trainer) => total + gradeBonuses[trainer.grade], 0);
    const prestigeBoost = Math.floor(team.prestige / 7);
    const elitePrestigeBonus = team.prestige >= 90 ? 4 : team.prestige >= 80 ? 2 : 0;
    return 10 + trainerBonus + getWealthTrainingBonus(team) + prestigeBoost + elitePrestigeBonus;
};

export const processInSeasonDevelopment = (teams: Team[], userCoachSkills?: string[]): Team[] => {
    return teams.map(team => {
        const prestigeBoost = Math.floor(team.prestige / 6);
        const elitePrestigeBonus = team.prestige >= 90 ? 3 : team.prestige >= 80 ? 2 : 0;
        let trainingPoints = 12 + Math.floor(team.prestige / 8) + prestigeBoost + elitePrestigeBonus + getWealthTrainingBonus(team);
        
        // Apply Coach Skills (Developer)
        if (team.isUserTeam && userCoachSkills && userCoachSkills.includes('developer')) {
            trainingPoints = Math.round(trainingPoints * 1.1); // +10% effectiveness
        }

        if (team.isUserTeam) {
            trainingPoints += 4; // give the user program a small boost so progress is noticeable
        }
        const trainingCost = 3;
        const newRoster = team.roster.map(p => ({ ...p, stats: { ...p.stats } }));

        const boostStat = (player: Player, stat: keyof Player['stats'], prestigeIncrement: number) => {
            const increment = prestigeIncrement > 1 && Math.random() < 0.5 ? prestigeIncrement : 1;
            player.stats[stat] = clamp(player.stats[stat] + increment, 0, 99);
            player.overall = calculateOverall(player.stats);
        };

        while (trainingPoints >= trainingCost) {
            const trainablePlayers = newRoster
                .filter(p => p.overall < getEffectivePotential(p) && p.overall < 99)
                .sort((a, b) => (getEffectivePotential(b) - b.overall) - (getEffectivePotential(a) - a.overall));
            if (trainablePlayers.length === 0) break;

            const randomPlayer = pickRandom(trainablePlayers.slice(0, Math.min(trainablePlayers.length, 6)));

            const statKeys: (keyof Player['stats'])[] = ['insideScoring', 'outsideScoring', 'playmaking', 'perimeterDefense', 'insideDefense', 'rebounding', 'stamina'];
            const sortedStats = statKeys.sort((a, b) => randomPlayer.stats[a] - randomPlayer.stats[b]);
            const statToImprove = sortedStats[0];

            const prestigeIncrement = team.prestige >= 85 ? 2 : team.prestige >= 70 ? (Math.random() < 0.4 ? 2 : 1) : 1;

            const applyStatIncrease = (stat: keyof Player['stats']) => {
                boostStat(randomPlayer, stat, prestigeIncrement);
                trainingPoints -= trainingCost;
            };

            if (randomPlayer.stats[statToImprove] < 99) {
                applyStatIncrease(statToImprove);
            } else {
                const otherTrainableStats = statKeys.filter(s => randomPlayer.stats[s] < 99);
                if (otherTrainableStats.length > 0) {
                    const randomStat = pickRandom(otherTrainableStats);
                    applyStatIncrease(randomStat);
                } else {
                    break;
                }
            }
        }

        // Natural progression influenced by potential + prestige
        newRoster.forEach(player => {
            const effectivePotential = getEffectivePotential(player);
            const gap = Math.max(0, effectivePotential - player.overall);
            if (gap < 4) return;
            const prestigeBonus = team.prestige / 35;
            const potentialBonus = gap / 8;
            const highPotentialBoost = player.potential >= 95 ? 1.75 : player.potential >= 88 ? 1.25 : 1;
            const naturalSteps = Math.floor((potentialBonus + prestigeBonus) * highPotentialBoost * getDevelopmentRateForPlayer(player));
            if (naturalSteps <= 0) return;
            for (let i = 0; i < naturalSteps; i++) {
                const sortedStats = [...OFFSEASON_STAT_KEYS].sort((a, b) => player.stats[a] - player.stats[b]);
                const stat = sortedStats[0];
                boostStat(player, stat, player.potential >= 90 ? 2 : 1);
                if (player.stats[stat] >= 99) break;
            }
        });

        newRoster.forEach(player => progressPlayerInjury(player, team));
        return { ...team, roster: newRoster };
    });
};
export const calculateTeamNeedsData = (team: Team): { [key in RosterPositions]: number } => {
    const returningPlayers = team.roster.filter(p => p.year !== 'Sr');
    const needs: { [key in RosterPositions]: number } = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 };
    const positions: RosterPositions[] = ['PG', 'SG', 'SF', 'PF', 'C'];
    positions.forEach(pos => {
        const playersInPos = returningPlayers.filter(p => p.position === pos || p.secondaryPosition === pos);
        needs[pos] = playersInPos.length;
    });
    return needs;
};

export const calculateTeamNeeds = (team: Team): string => {
    const returningPlayers = team.roster.filter(p => p.year !== 'Sr');
    const needs: string[] = [];
    const positions: RosterPositions[] = ['PG', 'SG', 'SF', 'PF', 'C'];
    positions.forEach(pos => {
      const playersInPos = returningPlayers.filter(p => p.position === pos || p.secondaryPosition === pos).sort((a,b) => b.overall - a.overall);
      if (playersInPos.length < 2) {
        needs.push(pos);
      } else {
        const avgOverall = (playersInPos[0].overall + (playersInPos[1]?.overall || 60)) / 2;
        if (avgOverall < 70) {
          needs.push(pos);
        }
      }
    });
    if (needs.length === 0) return "Team Needs: Best Player Available";
    return `Team Needs: ${needs.join(', ')}`;
};

const getTeamAcademicScore = (team: Team): number => {
    const endowment = team.wealth?.endowmentScore ?? 50;
    const supportBoost = (team.finances?.endowmentSupport ?? 0) / 5000;
    return clamp(endowment + supportBoost, 0, 100);
};

const getTeamDevelopmentScore = (team: Team): number => {
    const trainingFacility = team.facilities?.training;
    const quality = trainingFacility?.quality ?? 50;
    const equipment = trainingFacility?.equipmentLevel ?? 5;
    const staffDevSpend = team.budget?.allocations?.staffDevelopment ?? 0;
    const staffDevBoost = clamp(staffDevSpend / 50000, 0, 1) * 18;
    const facilityBoost = (equipment * 4) + (trainingFacility?.level ?? 3) * 3;
    return clamp(quality * 0.6 + facilityBoost + staffDevBoost, 0, 100);
};

const getTeamMarketScore = (team: Team): number => {
    const base = team.prestige ?? 50;
    const donorBonus = team.wealth?.donorMomentum ?? 0;
    const capacityBoost = (team.facilities?.arena?.capacity ?? 10000) / 160;
    return clamp(base + donorBonus + capacityBoost, 0, 100);
};

const getTeamCommunityScore = (team: Team): number => {
    const interest = team.fanInterest ?? 50;
    const capacityBoost = (team.facilities?.arena?.capacity ?? 10000) / 200;
    return clamp(interest * 0.7 + capacityBoost, 0, 100);
};

const attributeAlignment = (teamScore: number, desired: number): number => {
    return Math.max(0, 1 - Math.abs(teamScore - desired) / 100);
};

const stableHash32 = (input: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

const stableIntBetween = (key: string, min: number, max: number): number => {
    if (max < min) [min, max] = [max, min];
    const range = max - min + 1;
    if (range <= 1) return min;
    return min + (stableHash32(key) % range);
};

const stableFloatBetween = (key: string, min: number, max: number): number => {
    const u = stableHash32(key) / 0xffffffff; // 0..1
    return min + (max - min) * u;
};

const STATE_CODE_BY_NAME: Record<string, string> = {
    ALABAMA: 'AL',
    ALASKA: 'AK',
    ARIZONA: 'AZ',
    ARKANSAS: 'AR',
    CALIFORNIA: 'CA',
    COLORADO: 'CO',
    CONNECTICUT: 'CT',
    DELAWARE: 'DE',
    'DISTRICT OF COLUMBIA': 'DC',
    'WASHINGTON D.C.': 'DC',
    'WASHINGTON DC': 'DC',
    'D.C.': 'DC',
    FLORIDA: 'FL',
    GEORGIA: 'GA',
    HAWAII: 'HI',
    IDAHO: 'ID',
    ILLINOIS: 'IL',
    INDIANA: 'IN',
    IOWA: 'IA',
    KANSAS: 'KS',
    KENTUCKY: 'KY',
    LOUISIANA: 'LA',
    MAINE: 'ME',
    MARYLAND: 'MD',
    MASSACHUSETTS: 'MA',
    MICHIGAN: 'MI',
    MINNESOTA: 'MN',
    MISSISSIPPI: 'MS',
    MISSOURI: 'MO',
    MONTANA: 'MT',
    NEBRASKA: 'NE',
    NEVADA: 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    OHIO: 'OH',
    OKLAHOMA: 'OK',
    OREGON: 'OR',
    PENNSYLVANIA: 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    TENNESSEE: 'TN',
    TEXAS: 'TX',
    UTAH: 'UT',
    VERMONT: 'VT',
    VIRGINIA: 'VA',
    WASHINGTON: 'WA',
    'WEST VIRGINIA': 'WV',
    WISCONSIN: 'WI',
    WYOMING: 'WY',
};

const normalizeStateCode = (value: string): string => {
    const t = (value || '').trim().toUpperCase();
    const paren = t.match(/\(([A-Z]{2})\)/)?.[1];
    if (paren) return paren;
    const tail = t.match(/\b([A-Z]{2})\b$/)?.[1];
    if (tail && STATE_CAPITAL_COORDS[tail]) return tail;
    if (t.length === 2) return t;
    return STATE_CODE_BY_NAME[t] || t;
};

const REGION_BY_STATE: Record<string, 'Northeast' | 'Midwest' | 'South' | 'West'> = (() => {
    const northeast = new Set(['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA']);
    const midwest = new Set(['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD']);
    const south = new Set(['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'DC', 'WV', 'AL', 'KY', 'MS', 'TN', 'AR', 'LA', 'OK', 'TX']);
    const west = new Set(['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA']);
    const map: Record<string, 'Northeast' | 'Midwest' | 'South' | 'West'> = {};
    northeast.forEach(s => (map[s] = 'Northeast'));
    midwest.forEach(s => (map[s] = 'Midwest'));
    south.forEach(s => (map[s] = 'South'));
    west.forEach(s => (map[s] = 'West'));
    return map;
})();

const getRegionForState = (state: string | undefined | null): string | undefined => {
    if (!state) return undefined;
    const code = normalizeStateCode(state);
    return REGION_BY_STATE[code] || undefined;
};

const STATE_CAPITAL_COORDS: Record<string, { lat: number; lon: number }> = {
    'AK': { lat: 58.3020694, lon: -134.4104388 }, // Alaska
    'AL': { lat: 32.3777298, lon: -86.3005639 }, // Alabama
    'AR': { lat: 34.7467450, lon: -92.2892284 }, // Arkansas
    'AZ': { lat: 33.4482497, lon: -112.0970650 }, // Arizona
    'CA': { lat: 38.5765854, lon: -121.4935591 }, // California
    'CO': { lat: 39.7392198, lon: -104.9849779 }, // Colorado
    'CT': { lat: 41.7642752, lon: -72.6823164 }, // Connecticut
    'DE': { lat: 39.1572815, lon: -75.5195811 }, // Delaware
    'DC': { lat: 38.8951000, lon: -77.0364000 }, // District of Columbia
    'FL': { lat: 30.4381047, lon: -84.2821265 }, // Florida
    'GA': { lat: 33.7490287, lon: -84.3879614 }, // Georgia
    'HI': { lat: 21.3073439, lon: -157.8573111 }, // Hawaii
    'IA': { lat: 41.5911079, lon: -93.6038358 }, // Iowa
    'ID': { lat: 43.6177948, lon: -116.1998483 }, // Idaho
    'IL': { lat: 39.7983912, lon: -89.6547203 }, // Illinois
    'IN': { lat: 39.7683841, lon: -86.1627697 }, // Indiana
    'KS': { lat: 39.0482389, lon: -95.6780057 }, // Kansas
    'KY': { lat: 38.1866989, lon: -84.8753598 }, // Kentucky
    'LA': { lat: 30.4570240, lon: -91.1873935 }, // Louisiana
    'MA': { lat: 42.3587532, lon: -71.0640129 }, // Massachusetts
    'MD': { lat: 38.9788927, lon: -76.4910370 }, // Maryland
    'ME': { lat: 44.3072130, lon: -69.7816228 }, // Maine
    'MI': { lat: 42.7336193, lon: -84.5555605 }, // Michigan
    'MN': { lat: 44.9551063, lon: -93.1021034 }, // Minnesota
    'MO': { lat: 38.5791852, lon: -92.1728432 }, // Missouri
    'MS': { lat: 32.3037630, lon: -90.1820382 }, // Mississippi
    'MT': { lat: 46.5857742, lon: -112.0183427 }, // Montana
    'NC': { lat: 35.7803724, lon: -78.6391225 }, // North Carolina
    'ND': { lat: 46.8207637, lon: -100.7827194 }, // North Dakota
    'NE': { lat: 40.8080641, lon: -96.6997467 }, // Nebraska
    'NH': { lat: 43.2069054, lon: -71.5382718 }, // New Hampshire
    'NJ': { lat: 40.2203572, lon: -74.7699552 }, // New Jersey
    'NM': { lat: 35.6823747, lon: -105.9396043 }, // New Mexico
    'NV': { lat: 39.1640815, lon: -119.7663053 }, // Nevada
    'NY': { lat: 42.6525086, lon: -73.7575015 }, // New York
    'OH': { lat: 39.9614610, lon: -82.9987984 }, // Ohio
    'OK': { lat: 35.4922882, lon: -97.5033801 }, // Oklahoma
    'OR': { lat: 44.9387430, lon: -123.0301147 }, // Oregon
    'PA': { lat: 40.2644747, lon: -76.8837835 }, // Pennsylvania
    'RI': { lat: 41.8308218, lon: -71.4148550 }, // Rhode Island
    'SC': { lat: 34.0004393, lon: -81.0331509 }, // South Carolina
    'SD': { lat: 44.3671094, lon: -100.3462286 }, // South Dakota
    'TN': { lat: 36.1658985, lon: -86.7841708 }, // Tennessee
    'TX': { lat: 30.2746658, lon: -97.7403271 }, // Texas
    'UT': { lat: 40.7773586, lon: -111.8881320 }, // Utah
    'VA': { lat: 37.5387651, lon: -77.4335963 }, // Virginia
    'VT': { lat: 44.2624522, lon: -72.5804725 }, // Vermont
    'WA': { lat: 47.0357595, lon: -122.9049162 }, // Washington
    'WI': { lat: 43.0746533, lon: -89.3841797 }, // Wisconsin
    'WV': { lat: 38.3364019, lon: -81.6120072 }, // West Virginia
    'WY': { lat: 41.1403010, lon: -104.8203092 }, // Wyoming
};

const haversineMiles = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): number => {
    const R = 3958.8; // miles
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
    return R * c;
};

const roadMultiplierFromCrowMiles = (crowMiles: number, sameState: boolean): number => {
    const d = Math.max(0, crowMiles);
    if (sameState) {
        // Short, local trips can be disproportionately "road-y" (indirect routes), but should not balloon.
        // Approaches ~1.10 for longer in-state drives; closer to ~1.20 for very short distances.
        return 1.10 + 0.10 * Math.exp(-d / 140);
    }
    // Longer out-of-state trips tend to be under-estimated by straight-line distance; add a bit more lift.
    // Approaches ~1.22 for cross-country; ~1.15 for nearby border states.
    return 1.14 + 0.08 * (1 - Math.exp(-d / 900));
};

const STATE_PSEUDO_HOME_RADIUS_MILES: Record<string, number> = {
    // A light heuristic so in-state distances don't routinely exceed real-world bounds.
    // (Used only when we don't have actual recruit coordinates.)
    AK: 420,
    CA: 260,
    TX: 280,
    MT: 220,
    NM: 200,
    NV: 200,
    AZ: 190,
    CO: 190,
    OR: 170,
    WA: 170,
    ID: 170,
    WY: 170,
    UT: 170,
    FL: 170,
    GA: 150,
    AL: 130,
    LA: 150,
    MS: 140,
    TN: 150,
    NC: 160,
    SC: 140,
    VA: 150,
    WV: 140,
    KY: 150,
    PA: 150,
    NY: 160,
    MI: 160,
    MN: 160,
    WI: 150,
    IL: 150,
    IN: 140,
    OH: 150,
    IA: 140,
    MO: 150,
    OK: 160,
    AR: 150,
    KS: 160,
    NE: 160,
    SD: 170,
    ND: 170,
    ME: 150,
    VT: 90,
    NH: 90,
    MA: 90,
    RI: 60,
    CT: 70,
    NJ: 80,
    DE: 70,
    MD: 80,
    DC: 10,
    HI: 60,
};

const pickPseudoHomeCoordsForState = (stateCode: string, seedKey: string): { lat: number; lon: number } | null => {
    const base = STATE_CAPITAL_COORDS[stateCode];
    if (!base) return null;

    const maxRadiusMiles = STATE_PSEUDO_HOME_RADIUS_MILES[stateCode] ?? 155;
    const theta = stableFloatBetween(`${seedKey}:theta`, 0, Math.PI * 2);
    const r = Math.sqrt(stableFloatBetween(`${seedKey}:r`, 0, 1)) * maxRadiusMiles;

    const milesPerDegreeLat = 69;
    const latRad = (base.lat * Math.PI) / 180;
    const milesPerDegreeLon = milesPerDegreeLat * Math.max(0.2, Math.cos(latRad));

    const dLat = (r * Math.cos(theta)) / milesPerDegreeLat;
    const dLon = (r * Math.sin(theta)) / milesPerDegreeLon;
    return { lat: base.lat + dLat, lon: base.lon + dLon };
};

const estimateDistanceMiles = (fromState: string, toState: string, seedKey: string): number => {
    const a = normalizeStateCode(fromState);
    const b = normalizeStateCode(toState);
    if (a === b) {
        // In-state travel: still non-zero, but keep within plausible bounds by state size.
        const radius = STATE_PSEUDO_HOME_RADIUS_MILES[a] ?? 155;
        const approxMax = clamp(Math.round(radius * 2.1), 60, 750);
        return stableIntBetween(`${seedKey}:same`, 18, approxMax);
    }

    const ca = STATE_CAPITAL_COORDS[a];
    const cb = STATE_CAPITAL_COORDS[b];
    if (ca && cb) {
        // Approximate road distance by inflating "as the crow flies" between state capitals.
        const crow = haversineMiles(ca, cb);
        const base = crow * roadMultiplierFromCrowMiles(crow, false);
        const jitter = stableIntBetween(`${seedKey}:jit`, -25, 25);
        return clamp(Math.round(base + jitter), 30, 3200);
    }

    const ra = getRegionForState(a);
    const rb = getRegionForState(b);
    if (!ra || !rb) return stableIntBetween(`${seedKey}:unknown`, 650, 2100);
    if (ra === rb) return stableIntBetween(`${seedKey}:region`, 240, 980);

    const pair = [ra, rb].sort().join('-');
    // Broad-but-plausible regional distance bands to avoid obviously wrong numbers (e.g. MN↔OR ≈ 1,500mi).
    if (pair === 'Midwest-West') return stableIntBetween(`${seedKey}:mw-w`, 1050, 1750);
    if (pair === 'South-West') return stableIntBetween(`${seedKey}:s-w`, 950, 1750);
    if (pair === 'Northeast-West') return stableIntBetween(`${seedKey}:ne-w`, 1850, 2650);
    if (pair === 'Midwest-South') return stableIntBetween(`${seedKey}:mw-s`, 650, 1250);
    if (pair === 'Northeast-South') return stableIntBetween(`${seedKey}:ne-s`, 450, 1050);
    if (pair === 'Midwest-Northeast') return stableIntBetween(`${seedKey}:mw-ne`, 500, 1100);

    return stableIntBetween(`${seedKey}:far`, 900, 2200);
};

const inferNearestStateCodeFromCoords = (coords: { lat: number; lon: number }): string | null => {
    let bestCode: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    Object.entries(STATE_CAPITAL_COORDS).forEach(([code, capital]) => {
        const d = haversineMiles(coords, capital);
        if (d < bestDist) {
            bestDist = d;
            bestCode = code;
        }
    });
    return bestCode;
};

const resolveTeamStateCode = (team: Team): string | null => {
    const direct = normalizeStateCode(team.state || '');
    if (STATE_CAPITAL_COORDS[direct]) return direct;

    const mapped = normalizeStateCode(SCHOOL_STATES[team.name] || '');
    if (STATE_CAPITAL_COORDS[mapped]) return mapped;

    const parsed = normalizeStateCode(team.name || '');
    if (STATE_CAPITAL_COORDS[parsed]) return parsed;

    if (team.location) {
        return inferNearestStateCodeFromCoords(team.location);
    }

    return null;
};

export const getRecruitRegionForState = (state: string | undefined | null): string | undefined => getRegionForState(state);

const getRecruitOriginStateCode = (recruit: Recruit): string => {
    return normalizeStateCode(recruit.homeState || recruit.hometownState || recruit.state || '');
};

export const estimateRecruitDistanceMilesToTeam = (recruit: Recruit, team: Team): number => {
    const originState = getRecruitOriginStateCode(recruit);
    const teamState = resolveTeamStateCode(team);
    const isSameState = !!teamState && originState === teamState;

    // If we have precise team location, use it for better accuracy.
    // When we don't have recruit coordinates, generate a stable "pseudo home" coordinate per recruit+state
    // so in-state distances are consistent across different schools.
    if (team.location) {
        const recruitCoords =
            (Number.isFinite(recruit.hometownLat) && Number.isFinite(recruit.hometownLon)
                ? { lat: recruit.hometownLat as number, lon: recruit.hometownLon as number }
                : null) ||
            pickPseudoHomeCoordsForState(originState, `${recruit.id}:${originState}`) ||
            STATE_CAPITAL_COORDS[originState] ||
            null;

        if (recruitCoords) {
            const crow = haversineMiles(recruitCoords, team.location);
            const base = crow * roadMultiplierFromCrowMiles(crow, isSameState);
            const jitter = stableIntBetween(`${recruit.id}:${team.name}:jit`, -12, 12);
            const min = isSameState ? 8 : 30;
            return clamp(Math.round(base + jitter), min, 3200);
        }
    }

    if (teamState) {
        return estimateDistanceMiles(originState, teamState, `${recruit.id}:${team.name}`);
    }

    return estimateDistanceMiles(originState, team.state, `${recruit.id}:${team.name}`);
};

const getPlayerHomeStateCode = (player: Player): string => {
    return normalizeStateCode(player.homeState || '');
};

const getTransferDistancePreferenceScore = (player: Player, team: Team): number => {
    if (!player.homeState) return 0;
    const distance = estimateDistanceMiles(getPlayerHomeStateCode(player), team.state, `${player.id}:${team.name}:xfer`);
    const closenessScore = clamp((900 - distance) / 900, -1, 1);
    const traits = player.nilPersonalityTraits ?? [];
    let bonus = 0;
    if (traits.includes('Homebody')) bonus += closenessScore * 6;
    if (traits.includes('HomegrownFavorite')) bonus += closenessScore * 4;
    if (traits.includes('Wanderlust')) bonus += -closenessScore * 6;
    return bonus;
};

const personalityInterestBonuses: Record<ProspectPersonality, (team: Team) => number> = {
    Loyal: team => getTeamCommunityScore(team) * 0.08,
    'NBA Bound': team => (team.prestige ?? 50) * 0.08 + getTeamMarketScore(team) * 0.03,
    'Academically Focused': team => getTeamAcademicScore(team) * 0.1,
    'Local Hero': team => getTeamCommunityScore(team) * 0.1,
    'Spotlight Seeker': team => getTeamMarketScore(team) * 0.08 + (team.prestige ?? 50) * 0.02,
    Homebody: team => getTeamCommunityScore(team) * 0.05,
    Wanderlust: team => getTeamMarketScore(team) * 0.06 + (team.prestige ?? 50) * 0.02,
    'Family Feud': () => 0,
    'Gym Rat': team => getTeamDevelopmentScore(team) * 0.08,
};

const nilPriorityInterestBonuses: Record<RecruitNilPriority, (team: Team) => number> = {
    LongTermStability: team => getTeamAcademicScore(team) * 0.05,
    DraftStock: team => (team.prestige ?? 50) * 0.07 + getTeamMarketScore(team) * 0.04,
    AcademicSupport: team => getTeamAcademicScore(team) * 0.08,
    BrandExposure: team => getTeamMarketScore(team) * 0.06 + getTeamCommunityScore(team) * 0.03,
};

export const calculateRecruitInterestScore = (recruit: Recruit, team: Team, context: { gameInSeason: number, isSigningPeriod?: boolean }, userCoachSkills?: string[]): number => {
	    // For CPU teams, establish a base interest that is NOT influenced by the user's interest level.
	    // This prevents the user's recruiting efforts from artificially inflating CPU interest.
	    const baseInterest = team.isUserTeam ? recruit.interest :
	        (recruit.stars * 8) +
	        (recruit.overall / 12) +
	        stableIntBetween(
	            `${recruit.id}:${team.name}:${context.gameInSeason}:${context.isSigningPeriod ? 'S' : 'R'}`,
	            -6,
	            6
	        );

	    const motivations = recruit.motivations || {
	        proximity: 50,
	        playingTime: 50,
	        nil: 50,
	        exposure: 50,
	        relationship: 50,
	        development: 50,
	        academics: 50,
	    };
	    const exposureWeight = clamp(motivations.exposure / 100, 0, 1);
	    const nilWeight = clamp(motivations.nil / 100, 0, 1);
	    const playingTimeWeight = clamp(motivations.playingTime / 100, 0, 1);
	    const academicsWeight = clamp(motivations.academics / 100, 0, 1);
	    const proximityWeight = clamp(motivations.proximity / 100, 0, 1);
	    const developmentWeight = clamp(motivations.development / 100, 0, 1);

	    const recruitState = recruit.homeState || recruit.hometownState || recruit.state || '';
	    const teamStateCode = resolveTeamStateCode(team) || normalizeStateCode(team.state || '');
	    const isHomeState = !!recruitState && !!teamStateCode && normalizeStateCode(recruitState) === teamStateCode;
	    const recruitRegion = recruit.region || getRegionForState(recruitState);
	    const teamRegion = getRegionForState(teamStateCode);
	    const estDistanceMiles = estimateRecruitDistanceMilesToTeam(recruit, team);
	    const proximityScore = clamp(100 - Math.round(estDistanceMiles / 25), 0, 100); // ~0 at 2500mi, ~100 at 0
        const strictness = clamp((recruit.fitStrictness ?? 50) / 100, 0, 1);
        const preferenceMultiplier = 0.9 + strictness * 0.35;
	    // Proximity needs to materially matter when recruits say it matters.
	    const proximityFactor = (proximityScore - 50) * (0.10 + proximityWeight * 0.85) * preferenceMultiplier;
        const personalityProximityBonus = (() => {
            if (recruit.personalityTrait === 'Homebody') {
                return (proximityScore - 50) * 0.25;
            }
            if (recruit.personalityTrait === 'Wanderlust') {
                return (50 - proximityScore) * 0.25;
            }
            return 0;
        })();

	    // Awareness: how plausible is it that the recruit is paying attention to this program?
	    const hype = clamp(recruit.hypeLevel ?? (recruit.stars >= 5 ? 90 : recruit.stars === 4 ? 70 : recruit.stars === 3 ? 55 : 40), 0, 100);
	    const brand = clamp(team.recruitingPrestige ?? team.prestige ?? 50, 0, 100);
	    const coachStyleMatch = recruit.favoredCoachStyle && team.headCoach?.style
	        ? (recruit.favoredCoachStyle === team.headCoach.style ? 1 : 0)
	        : 0;
	    const coachStyleAwareness = coachStyleMatch ? (4 + motivations.relationship * 0.04) : 0;
	    const regionAwareness = recruitRegion && teamRegion && recruitRegion === teamRegion ? 4 : 0;
	    const homeStateAwareness = isHomeState ? 10 : 0;
	    const awarenessScore = clamp(
	        0.65 * brand +
	        0.15 * hype +
	        regionAwareness +
	        homeStateAwareness +
	        coachStyleAwareness,
	        0,
	        100
	    );
	    const awarenessFactor = (awarenessScore - 50) * (0.12 + exposureWeight * 0.35) * (0.95 + strictness * 0.2);
	
	    let prestigeFactor = (team.recruitingPrestige - 50) * (0.25 + exposureWeight * 0.45);
        const marketScore = getTeamMarketScore(team);
        const prestigeNormalized = clamp((team.recruitingPrestige ?? team.prestige ?? 50) / 100, 0, 1);
        const exposureCurve = clamp(1 / (1 + Math.exp(-10 * (prestigeNormalized - 0.6))), 0, 1);
        const exposureSensitivity = clamp(0.55 + exposureWeight * 0.7 + (recruit.stars >= 4 ? 0.15 : 0), 0.45, 1.4);
        const nilSensitivity = clamp(0.55 + nilWeight * 0.8 + (recruit.stars >= 4 ? 0.1 : 0), 0.45, 1.4);
        const exposureBonus = (exposureCurve - 0.5) * 22 * exposureSensitivity;
        const expectedNilIndex = clamp(exposureCurve * 0.75 + (marketScore / 100) * 0.25, 0, 1);
        const expectedNilBonus = (expectedNilIndex - 0.4) * 18 * nilSensitivity;
    
    // Pipeline Bonus
    if (team.pipelines) {
        const pipeline = team.pipelines.find(p => p.state === recruit.homeState);
        if (pipeline) {
            if (pipeline.tier === 'Gold') prestigeFactor *= 1.5;
            else if (pipeline.tier === 'Silver') prestigeFactor *= 1.25;
            else if (pipeline.tier === 'Bronze') prestigeFactor *= 1.1;
        }
    }

        const commitmentStyle: RecruitCommitmentStyle = recruit.commitmentStyle || 'Balanced';
        const prestigeStyleMultiplier =
            commitmentStyle === 'FrontRunner' ? 1.18 :
            commitmentStyle === 'Underdog' ? 0.90 :
            1.0;
        prestigeFactor *= prestigeStyleMultiplier;

	    let recordFactor = (team.record.wins - team.record.losses) * 0.2;
        if (commitmentStyle === 'FrontRunner') recordFactor *= 1.1;
        else if (commitmentStyle === 'Underdog') recordFactor *= 0.95;

	    const needs = calculateTeamNeeds(team);
	    const positionNeedFactor = needs.includes(recruit.position) || (recruit.secondaryPosition && needs.includes(recruit.secondaryPosition)) ? 5 : 0;
        const playingTimeStyleMultiplier =
            commitmentStyle === 'FrontRunner' ? 0.90 :
            commitmentStyle === 'Underdog' ? 1.15 :
            1.0;
        const rosterCongestion = getRosterCongestionForRecruit(team, recruit);
        const talentScore = getRecruitTalentScore(recruit);
        const playingTimeConcern = clamp(0.9 - talentScore * 0.65, 0.2, 0.9);
        const playingTimePenalty = (6 + playingTimeWeight * 8) * playingTimeConcern * rosterCongestion * playingTimeStyleMultiplier;
    const inSeasonBonus = context.gameInSeason <= 31 ? context.gameInSeason * 0.1 : 0;
	    const wealthBonus = getWealthRecruitingBonus(team) * (0.4 + nilWeight * 1.6);
	    const alumniNilBonus = (team.wealth?.alumniNetwork?.strength ?? 0) * 0.08 * nilWeight;
    
    // Recruiting Budget Bonus
    let budgetBonus = 0;
    if (team.budget?.allocations) {
        const baseRecruiting = team.prestige * 150; // Baseline expectation
        const ratio = team.budget.allocations.recruiting / Math.max(1, baseRecruiting);
        if (ratio > 1.2) budgetBonus = 3;
        else if (ratio > 1.0) budgetBonus = 1;
        else if (ratio < 0.8) budgetBonus = -2;
    }
    
	    const signingBonus = context.isSigningPeriod ? 5 : 0;

	    const academicScore = getTeamAcademicScore(team);
	    const communityScore = getTeamCommunityScore(team);
    const attributeScores = [
        attributeAlignment(academicScore, recruit.preferredProgramAttributes.academics) * (0.5 + academicsWeight * 0.9),
        attributeAlignment(marketScore, recruit.preferredProgramAttributes.marketExposure) * (0.5 + exposureWeight * 0.9),
        attributeAlignment(communityScore, recruit.preferredProgramAttributes.communityEngagement) * (0.5 + proximityWeight * 0.7),
    ];
    const attributeBonus = attributeScores.reduce((sum, score) => sum + score, 0) * 4 * (0.9 + strictness * 0.4);
    const personalityBonus = personalityInterestBonuses[recruit.personalityTrait](team);
    const nilPriorityBonus = nilPriorityInterestBonuses[recruit.nilPriority](team);

    // New Recruiting Logic (Archetypes & Dealbreakers)
    let archetypeBonus = 0;
    
    if (team.pipelines) {
        const pipeline = team.pipelines.find(p => p.state === recruit.homeState);
        if (pipeline) {
            if (pipeline.tier === 'Gold') prestigeFactor *= 1.5;
            else if (pipeline.tier === 'Silver') prestigeFactor *= 1.25;
            else if (pipeline.tier === 'Bronze') prestigeFactor *= 1.1;
        }
    }

    switch (recruit.archetype) {
        case 'Mercenary':
            archetypeBonus += wealthBonus * 2; 
            break;
        case 'FameSeeker':
             archetypeBonus += prestigeFactor * 1.2;
            break;
        case 'HometownHero':
            // Hometown heroes strongly prefer staying in-state and are still biased toward nearby schools.
            // This should be strong enough to put home-state flagships on their shortlist.
            if (isHomeState) {
                archetypeBonus += (38 + proximityWeight * 42) * preferenceMultiplier;
            } else {
                const regionMatch = recruitRegion && teamRegion && recruitRegion === teamRegion;
                const distanceMultiplier =
                    estDistanceMiles <= 250 ? 0.25 :
                    estDistanceMiles <= 500 ? 0.6 :
                    estDistanceMiles <= 900 ? 1.0 :
                    1.35;
                const basePenalty = (12 + proximityWeight * 22) * preferenceMultiplier * distanceMultiplier;
                archetypeBonus -= regionMatch ? basePenalty * 0.7 : basePenalty;
            }
            break;
        case 'ProcessTrustor':
            archetypeBonus += (academicScore - 50) * (0.15 + academicsWeight * 0.35) + (developmentWeight * 4);
            break;
    }

    // Dealbreaker Logic (Penalties)
    let dealbreakerPenalty = 0;
    if (recruit.dealbreaker === 'Proximity' && !isHomeState) {
        dealbreakerPenalty = 50; // Effectively kills interest
    } else if (recruit.dealbreaker === 'Academics' && academicScore < 60) {
        dealbreakerPenalty = 30;
    } else if (recruit.dealbreaker === 'PlayingTime' && rosterCongestion > 0.6 && playingTimeConcern > 0.5) {
        dealbreakerPenalty = 25;
    } else if (recruit.dealbreaker === 'NIL' && wealthBonus < 0) {
        dealbreakerPenalty = 25;
    }

        dealbreakerPenalty = Math.round(dealbreakerPenalty * (0.85 + strictness * 0.55));

	    let rawScore =
	        baseInterest +
	        awarenessFactor +
	        prestigeFactor +
            exposureBonus +
            expectedNilBonus +
	        recordFactor +
	        positionNeedFactor +
	        -playingTimePenalty +
	        inSeasonBonus +
	        wealthBonus +
	        alumniNilBonus +
	        budgetBonus +
	        signingBonus +
	        attributeBonus +
	        personalityBonus +
	        nilPriorityBonus +
	        pipelineBonus +
	        archetypeBonus +
	        proximityFactor +
            personalityProximityBonus +
	        clamp(recruit.teamMomentum?.[team.name] ?? 0, -20, 20) -
	        dealbreakerPenalty;

	    const pitchType = getActiveOfferPitchType(recruit, team.name);
	    if (pitchType) {
	        const motivations = recruit.motivations || {
	            proximity: 50,
	            playingTime: 50,
	            nil: 50,
	            exposure: 50,
	            relationship: 50,
	            development: 50,
	            academics: 50,
	        };
	        const exposureWeight = clamp(motivations.exposure / 100, 0, 1);
	        const nilWeight = clamp(motivations.nil / 100, 0, 1);
	        const playingTimeWeight = clamp(motivations.playingTime / 100, 0, 1);
	        const academicsWeight = clamp(motivations.academics / 100, 0, 1);
	        const proximityWeight = clamp(motivations.proximity / 100, 0, 1);
	
	        let pitchBonus = 0;
	        switch (pitchType) {
	            case 'EarlyPush':
	                pitchBonus = 2 + exposureWeight * 2;
	                break;
	            case 'NILHeavy':
	                pitchBonus = 1 + nilWeight * 8 + (getWealthRecruitingBonus(team) * 0.15 * nilWeight);
	                break;
	            case 'PlayingTimePromise':
	                pitchBonus = 1 + playingTimeWeight * 7 + (positionNeedFactor > 0 ? 2 : -2);
	                break;
	            case 'LocalAngle':
	                pitchBonus = (recruit.homeState === team.state ? 2 + proximityWeight * 7 : -2);
	                break;
	            case 'AcademicPitch':
	                pitchBonus = 1 + academicsWeight * 7 + ((getTeamAcademicScore(team) - 50) * 0.05 * academicsWeight);
	                break;
	            case 'Standard':
	            default:
	                pitchBonus = 0;
	                break;
	        }
	        rawScore += clamp(pitchBonus, -4, 10);
	    }

    // Apply Coach Skills (Silver Tongue)
    if (team.isUserTeam && userCoachSkills && userCoachSkills.includes('silver_tongue')) {
        rawScore = rawScore * 1.05; // +5% interest
    }

	    return Math.round(clamp(rawScore, 1, 100));
};

export const getRecruitWhyBadges = (
    recruit: Recruit,
    team: Team,
    context: { gameInSeason: number; isSigningPeriod?: boolean },
): string[] => {
    const motivations = recruit.motivations || {
        proximity: 50,
        playingTime: 50,
        nil: 50,
        exposure: 50,
        relationship: 50,
        development: 50,
        academics: 50,
    };
    const exposureWeight = clamp(motivations.exposure / 100, 0, 1);
    const nilWeight = clamp(motivations.nil / 100, 0, 1);
    const playingTimeWeight = clamp(motivations.playingTime / 100, 0, 1);
    const academicsWeight = clamp(motivations.academics / 100, 0, 1);
    const proximityWeight = clamp(motivations.proximity / 100, 0, 1);
    const relationshipWeight = clamp(motivations.relationship / 100, 0, 1);

    const needs = calculateTeamNeeds(team);
    const positionNeedFactor = needs.includes(recruit.position) || (recruit.secondaryPosition && needs.includes(recruit.secondaryPosition)) ? 1 : 0;
    const academicScore = getTeamAcademicScore(team);
    const marketScore = getTeamMarketScore(team);
    const prestige = team.recruitingPrestige ?? team.prestige ?? 50;
    const wealth = getWealthRecruitingBonus(team);

    const estDistanceMiles = estimateDistanceMiles(getRecruitOriginStateCode(recruit), team.state, `${recruit.id}:${team.name}`);

    const candidates: { label: string; score: number }[] = [
        { label: 'Exposure ++', score: exposureWeight * (0.55 * (prestige / 100) + 0.45 * (marketScore / 100)) },
        { label: 'NIL $ +', score: nilWeight * clamp((wealth + 10) / 25, 0, 1) },
        { label: 'Proximity ++', score: proximityWeight * (estDistanceMiles <= 500 ? 1 : estDistanceMiles <= 900 ? 0.6 : 0.2) },
        { label: 'Playing Time +', score: playingTimeWeight * (positionNeedFactor ? 1 : 0.35) },
        { label: 'Academics ++', score: academicsWeight * clamp((academicScore - 55) / 25, 0, 1) },
        {
            label: 'Relationship +',
            score:
                relationshipWeight *
                (recruit.favoredCoachStyle && team.headCoach?.style && recruit.favoredCoachStyle === team.headCoach.style ? 1 : 0),
        },
        { label: 'Signing Push', score: context.isSigningPeriod ? 0.6 : 0 },
    ];

    return candidates
        .filter(c => c.score > 0.18)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(c => c.label);
};

export const calculateRecruitInterestBreakdown = (
    recruit: Recruit,
    team: Team,
    context: { gameInSeason: number; isSigningPeriod?: boolean },
    userCoachSkills?: string[],
) => {
    const recruitRegion = recruit.region || getRegionForState(recruit.homeState) || getRegionForState(recruit.hometownState);
    const teamRegion = getRegionForState(team.state);
    const estDistanceMiles = estimateDistanceMiles(getRecruitOriginStateCode(recruit), team.state, `${recruit.id}:${team.name}`);
    const proximityScore = clamp(100 - Math.round(estDistanceMiles / 25), 0, 100);

    const hype = clamp(recruit.hypeLevel ?? (recruit.stars >= 5 ? 90 : recruit.stars === 4 ? 70 : recruit.stars === 3 ? 55 : 40), 0, 100);
    const brand = clamp(team.recruitingPrestige ?? team.prestige ?? 50, 0, 100);
    const motivations = recruit.motivations || {
        proximity: 50,
        playingTime: 50,
        nil: 50,
        exposure: 50,
        relationship: 50,
        development: 50,
        academics: 50,
    };
    const coachStyleMatch = recruit.favoredCoachStyle && team.headCoach?.style
        ? (recruit.favoredCoachStyle === team.headCoach.style ? 1 : 0)
        : 0;
    const coachStyleAwareness = coachStyleMatch ? (4 + motivations.relationship * 0.04) : 0;
    const regionAwareness = recruitRegion && teamRegion && recruitRegion === teamRegion ? 4 : 0;
    const homeStateAwareness = recruit.homeState === team.state ? 6 : 0;
    const awarenessScore = clamp(
        0.65 * brand +
        0.15 * hype +
        regionAwareness +
        homeStateAwareness +
        coachStyleAwareness,
        0,
        100
    );

    const pitchType = getActiveOfferPitchType(recruit, team.name);
    const momentum = clamp(recruit.teamMomentum?.[team.name] ?? 0, -20, 20);
    const score = calculateRecruitInterestScore(recruit, team, context, userCoachSkills);
    const whyBadges = getRecruitWhyBadges(recruit, team, context);

    return { score, awarenessScore, proximityScore, estDistanceMiles, pitchType, momentum, whyBadges };
};

export const scheduleVisit = (recruit: Recruit, team: Team, week: number, allRecruits: Recruit[], currentWeek: number): { success: boolean; message: string; updatedRecruit?: Recruit } => {
    if (week < currentWeek) {
        return { success: false, message: 'Cannot schedule visits in the past.' };
    }
    if (recruit.visitStatus !== 'None') {
        return { success: false, message: 'Visit already scheduled or completed.' };
    }
    if (recruit.interest < 60) {
        return { success: false, message: 'Interest too low to schedule visit.' };
    }

    const visitsThisWeek = allRecruits.filter(r => r.visitWeek === week && r.visitStatus === 'Scheduled').length;
    if (visitsThisWeek >= 2) {
        return { success: false, message: `Already hosting 2 visits on week ${week}.` };
    }

    const updatedRecruit = { ...recruit, visitStatus: 'Scheduled' as VisitStatus, visitWeek: week };
    return { success: true, message: `Visit scheduled for week ${week}.`, updatedRecruit };
};

export const negativeRecruit = (recruit: Recruit, targetSchool: string, method: 'Rumors' | 'Violations' | 'Academics', coach: Coach): { success: boolean; message: string; interestPenalty: number, updatedCoach?: Coach } => {
    const successChance = method === 'Rumors' ? 0.6 : method === 'Violations' ? 0.3 : 0.8;
    const roll = Math.random();
    
    if (roll < successChance) {
        let penalty = 0;
        switch (method) {
            case 'Rumors': penalty = 15; break;
            case 'Violations': penalty = 40; break;
            case 'Academics': penalty = 10; break;
        }
        return { success: true, message: `Negative recruiting successful! ${targetSchool} took a hit.`, interestPenalty: penalty };
    } else {
        const updatedCoach = { ...coach, reputation: Math.max(0, coach.reputation - 5) };
        return { success: false, message: 'Negative recruiting backfired! Your reputation suffered.', interestPenalty: -10, updatedCoach }; // Penalty applies to YOU
    }
};

export const processTransferPortalOpen = (teams: Team[]): { teams: Team[], portalPlayers: Transfer[], userTeamHasAtRiskPlayers: boolean } => {
    const portalPlayers: Transfer[] = [];
    let userTeamHasAtRiskPlayers = false;

    const updatedTeams = teams.map(team => {
        const newRoster: Player[] = [];
        const leavingPlayers: Player[] = [];

        team.roster.forEach(player => {
            let chanceToLeave = 0.05; // Base chance

            // Factors influencing transfer
            if ((player.rotationMinutes ?? 0) < 10) chanceToLeave += 0.15;
            
            const winPct = team.record.wins / (team.record.wins + team.record.losses);
            if (winPct < 0.4) chanceToLeave += 0.1;

            if (player.potential > player.overall + 5) chanceToLeave += 0.05;
            const traits = player.nilPersonalityTraits ?? [];
            if (traits.includes('Homebody') || traits.includes('LegacyBuilder')) chanceToLeave -= 0.04;
            if (traits.includes('Wanderlust') || traits.includes('BrandExpansionist')) chanceToLeave += 0.05;
            if (traits.includes('GymRat') || traits.includes('FilmJunkie')) chanceToLeave -= 0.02;
            chanceToLeave = clamp(chanceToLeave, 0.01, 0.6);

            if (Math.random() < chanceToLeave && player.year !== 'Sr') {
                if (team.isUserTeam) {
                    player.atRiskOfTransfer = true;
                    userTeamHasAtRiskPlayers = true;
                    newRoster.push(player); // Keep player on roster for now
                } else {
                    leavingPlayers.push(player);
                }
            } else {
                newRoster.push(player);
            }
        });

        portalPlayers.push(...leavingPlayers.map(p => ({
            ...p,
            interest: 0,
            userHasOffered: false,
            cpuOffers: [],
            originTeamName: team.name,
            isTargeted: false
        } as Transfer)));

        return { ...team, roster: newRoster };
    });
    
    // To get to 30%, we need more players to enter. I will add a random factor.
    const allPlayers = teams.flatMap(t => t.roster);
    const totalPlayers = allPlayers.length;
    const targetPortalSize = Math.floor(totalPlayers * 0.3);
    
    while(portalPlayers.length < targetPortalSize) {
        const randomTeam = pickRandom(updatedTeams);
        if (randomTeam.roster.length > 5) { // don't decimate a team
             const randomPlayer = pickRandom(randomTeam.roster);
             if(!portalPlayers.some(p => p.id === randomPlayer.id) && randomPlayer.year !== 'Sr') {
                portalPlayers.push({
                    ...randomPlayer,
                    interest: 0,
                    userHasOffered: false,
                    cpuOffers: [],
                    originTeamName: randomTeam.name,
                    isTargeted: false
                } as Transfer);
                randomTeam.roster = randomTeam.roster.filter(p => p.id !== randomPlayer.id);
             }
        }
    }

    return { teams: updatedTeams, portalPlayers, userTeamHasAtRiskPlayers };
};

export const processTransferPortalDay = (teams: Team[], portalPlayers: Transfer[], userCoachSkills?: string[]): { updatedTeams: Team[], updatedPortalPlayers: Transfer[] } => {
    const updatedTeams = [...teams];
    const remainingPortalPlayers: Transfer[] = [];
    
    portalPlayers.forEach(player => {
        // 20% chance to commit each day (simplified logic)
        if (Math.random() < 0.2) {
            // Find eligible teams (not user team, has space)
            const eligibleTeams = updatedTeams.filter(t => !t.isUserTeam && t.roster.length < 13);
            if (eligibleTeams.length > 0) {
                const teamScores = eligibleTeams.map(team => {
                    const needs = calculateTeamNeedsData(team);
                    const numAtPos = needs[player.position] + (player.secondaryPosition ? needs[player.secondaryPosition] : 0);
                    const needScore = 1 / (1 + numAtPos);
                    const prestigeScore = team.prestige / 100;
                    let totalScore = needScore + prestigeScore;
                    totalScore += getTransferDistancePreferenceScore(player, team) / 10;

                    // Apply Coach Skills (Portal Whisperer)
                    if (team.isUserTeam && userCoachSkills && userCoachSkills.includes('portal_whisperer')) {
                        totalScore *= 1.1; // +10% interest from portal players
                    }

                    return { team, totalScore };
                });

                teamScores.sort((a, b) => b.totalScore - a.totalScore);
                
                const destination = teamScores[0].team;
                destination.roster.push(player);
                // Player removed from portal (not added to remainingPortalPlayers)
            } else {
                remainingPortalPlayers.push(player);
            }
        } else {
            remainingPortalPlayers.push(player);
        }
    });

    return { updatedTeams, updatedPortalPlayers: remainingPortalPlayers };
};

export const calculateVisitOutcome = (recruit: Recruit, team: Team, gameResult: { won: boolean, isRivalry: boolean }): number => {
    let boost = gameResult.won ? 15 : -5; 
    
    if (recruit.motivations) {
         if (recruit.motivations.relationship > 75) boost += 5; 
         if (recruit.motivations.nil > 80 && gameResult.won) boost += 5;
    }

    if (!gameResult.won) {
        const resilience = recruit.resilience ?? 50;
        if (resilience > 70) boost += 5; 
    }

    if (gameResult.isRivalry) boost += (gameResult.won ? 10 : -10);
    
    if (gameResult.won) boost += recruit.stars * 2;
    else boost -= recruit.stars;

    const coachabilityMultiplier = 0.9 + clamp((recruit.coachability ?? 60) / 250, 0, 0.6);
    return Math.round(boost * coachabilityMultiplier);
};

const getPackageRelationshipMultiplier = (linkType: RelationshipType): number => {
    switch (linkType) {
        case 'Twin':
            return 1.0;
        case 'Sibling':
            return 0.7;
        case 'Cousin':
            return 0.35;
        default:
            return 0.5;
    }
};

const getPackageBaseDisposition = (recruit: Recruit): number => {
    const relationshipWeight = clamp((recruit.motivations?.relationship ?? 50) / 100, 0, 1);
    const baseRandom = stableIntBetween(`${recruit.id}:pkgDisp`, -10, 10) / 100;
    const feudPenalty = recruit.personalityTrait === 'Family Feud' ? 0.18 : 0;
    return clamp(0.35 + relationshipWeight * 0.35 + baseRandom - feudPenalty, 0.1, 0.9);
};

const getPackageIndependencePenalty = (recruit: Recruit): number => {
    const talentScore = getRecruitTalentScore(recruit);
    const archetypePenalty = recruit.archetype === 'Mercenary' || recruit.archetype === 'FameSeeker' ? 0.12 : 0;
    const personalityPenalty = recruit.personalityTrait === 'Family Feud' ? 0.15 : 0;
    return clamp(talentScore * 0.45 + archetypePenalty + personalityPenalty, 0, 0.7);
};


export const processRecruitingWeek = (
    teams: Team[],
    recruits: Recruit[],
    userTeamName: string,
    week: number,
    schedule: GameResult[][],
    isSigningPeriod: boolean = false,
    contactsMadeThisWeek: number = 0,
    contactPoints?: number,
    userCoachSkills?: string[],
    options?: { skipCpuActions?: boolean; startDate?: string; useDailyCommitments?: boolean }
): { updatedRecruits: Recruit[], updatedContactsMadeThisWeek: number } => {
    let currentContactsMade = contactsMadeThisWeek;
    let updatedRecruits = JSON.parse(JSON.stringify(recruits));
    const teamsByName = new Map(teams.map(t => [t.name, t]));
    const userTeam = teams.find(t => t.isUserTeam);
    const recruitsByIdIndex = new Map(updatedRecruits.map((r: Recruit) => [r.id, r]));
    const decisionPressure = getDecisionPressure(week, isSigningPeriod);

    const teamCommitCounts = new Map<string, number>();
    updatedRecruits.forEach((r: Recruit) => {
        if (r.verbalCommitment) {
            teamCommitCounts.set(r.verbalCommitment, (teamCommitCounts.get(r.verbalCommitment) || 0) + 1);
        }
    });

	    // Apply Weekly Interest Volatility
	    updatedRecruits.forEach((r: Recruit) => {
	        if (!r.teamMomentum) r.teamMomentum = {};
	        Object.keys(r.teamMomentum).forEach(teamName => {
	            const v = r.teamMomentum![teamName] ?? 0;
	            if (v > 0) r.teamMomentum![teamName] = v - 1;
	            else if (v < 0) r.teamMomentum![teamName] = v + 1;
	            if (r.teamMomentum![teamName] === 0) delete r.teamMomentum![teamName];
	        });
	        if (!r.verbalCommitment) {
	            const resilience = r.resilience ?? 50; 
	            // Lower resilience = higher volatility
	            // Resilience 80 = 10% chance. Resilience 20 = 40% chance.
	            const volatilityChance = 0.5 - (resilience / 200); 
            if (Math.random() < volatilityChance) {
                const swing = Math.floor(Math.random() * 7) - 3; // -3 to +3
                r.interest = normalizeInterest(r.interest + swing);
            }
        }
    });

    if (userTeam) {
        const gamesThisWeek = schedule[week-1];
        if(gamesThisWeek) {
            const userGame = gamesThisWeek.find(g => g.homeTeam === userTeam.name || g.awayTeam === userTeam.name);

            if(userGame) {
                updatedRecruits.forEach((r: Recruit) => {
                    if (r.visitStatus === 'Scheduled' && r.visitWeek === week) {
                        // Assuming the visit is with the user's team
                        const won = (userGame.homeTeam === userTeam.name && userGame.homeScore > userGame.awayScore) || (userGame.awayTeam === userTeam.name && userGame.awayScore > userGame.homeScore);
                        const opponent = teams.find(t => t.name === (userGame.homeTeam === userTeam.name ? userGame.awayTeam : userGame.homeTeam));
                        const rivalry = opponent && opponent.conference === userTeam.conference;
                        const boost = calculateVisitOutcome(r, userTeam, { 
                            won, 
                            isRivalry: rivalry || false 
	                        });
	                        r.interest = normalizeInterest(r.interest + boost);
	                        r.teamMomentum![userTeam.name] = clamp((r.teamMomentum?.[userTeam.name] ?? 0) + 4, -20, 20);
	                        if (!r.visitHistory) r.visitHistory = [];
	                        const outcome = boost >= 10 ? 'Positive' : boost <= 0 ? 'Negative' : 'Neutral';
	                        r.visitHistory.push({ teamName: userTeam.name, week, kind: 'Official', outcome });
	                        r.visitStatus = 'Completed';
	                    }
	                });
	            }
	        }
	    }

    const actualContactPoints = typeof contactPoints === 'number'
        ? contactPoints
        : (userTeam ? getContactPoints(userTeam) : 10);
    
    // Sort recruits once to establish a "recruiting board"
    const sortedRecruits = [...updatedRecruits].sort((a, b) => (b.overall + b.potential) - (a.overall + a.potential));

	    // CPU recruiting AI: board + waves + resource limits + drop longshots
        if (!options?.skipCpuActions) teams.forEach(team => {
	        if (team.isUserTeam) return;

            const commits = teamCommitCounts.get(team.name) || 0;
	        const availableScholarships = Math.max(0, 13 - team.roster.filter(p => p.year !== 'Sr').length - commits);
	        if (availableScholarships <= 0) return;

	        const prestige = team.prestige ?? 50;
	        const actionPoints = clamp(8 + Math.floor(prestige / 9), 8, 20);
	        const offerActionCost = 6;
	        const contactActionCost = 1;

	        const early = week <= 4;
	        const mid = week > 4 && week <= 8;
	        const late = week > 8;

	        const maxWeeklyOffers = clamp(
	            (prestige >= 82 ? 4 : prestige >= 70 ? 3 : prestige >= 60 ? 2 : 1) + (mid ? 1 : 0),
	            1,
	            6
	        );
	        const maxWeeklyContacts = clamp(prestige >= 80 ? 4 : prestige >= 65 ? 3 : 2, 1, 5);

	        const needs = calculateTeamNeeds(team);
	        const teamRegion = getRegionForState(team.state);

	        const reachTier =
	            prestige >= 85 ? 5 :
	            prestige >= 75 ? 4 :
	            prestige >= 60 ? 3 :
	            2;

	        const boardSize = early ? 90 : mid ? 70 : 55;
	        const board = sortedRecruits
	            .filter(r => !r.verbalCommitment)
	            .map(r => {
	                const need = needs.includes(r.position) || (r.secondaryPosition && needs.includes(r.secondaryPosition)) ? 1 : 0;
	                const recruitRegion = r.region || getRegionForState(r.homeState);
	                const regionBonus = recruitRegion && teamRegion && recruitRegion === teamRegion ? 5 : 0;
	                const homeStateBonus = r.homeState === team.state ? 10 : 0;
	                const dogpilePenalty = (() => {
	                    const bluebloodOffers = (r.cpuOffers || []).reduce((count, schoolName) => {
	                        const p = teamsByName.get(schoolName)?.prestige ?? 0;
	                        return p >= 85 ? count + 1 : count;
	                    }, 0);
	                    if (prestige < 70 && bluebloodOffers >= 3) return 18;
	                    return 0;
	                })();
	                const reachPenalty = r.stars > reachTier ? (r.stars - reachTier) * 14 : 0;
	                const base = r.overall * 0.65 + r.potential * 0.35 + r.stars * 6;
	                const score = base + (need ? 14 : 0) + regionBonus + homeStateBonus - reachPenalty - dogpilePenalty;
	                return { r, score };
	            })
	            .sort((a, b) => b.score - a.score)
	            .slice(0, boardSize)
	            .map(x => x.r);

	        let pointsLeft = actionPoints;
	        let offersMade = 0;
	        let contactsMade = 0;

	        // Contacts: build momentum with top board targets (even before offers).
	        for (const r of board) {
	            if (contactsMade >= maxWeeklyContacts) break;
	            if (pointsLeft < contactActionCost) break;
	            if (r.verbalCommitment) continue;
	            if (r.cpuOffers?.includes(team.name)) continue;
	            if (!r.teamMomentum) r.teamMomentum = {};
	            r.teamMomentum[team.name] = clamp((r.teamMomentum[team.name] ?? 0) + 1, -20, 20);
	            pointsLeft -= contactActionCost;
	            contactsMade++;
	        }

	        // Offers: pacing by wave, prioritize needs and later-cycle focus.
	        const offerCandidates = board.filter(r => !r.cpuOffers.includes(team.name));
	        for (const target of offerCandidates) {
	            if (offersMade >= maxWeeklyOffers) break;
	            if (pointsLeft < offerActionCost) break;
	            if (target.cpuOffers.length >= 35) continue;
	            if (late && target.stars >= 5 && prestige < 70) continue;

	            target.cpuOffers.push(team.name);
	            if (!target.teamMomentum) target.teamMomentum = {};
	            target.teamMomentum[team.name] = clamp((target.teamMomentum[team.name] ?? 0) + (mid ? 4 : 3), -20, 20);
	            if (!target.offerHistory) target.offerHistory = [];
	            target.offerHistory.push({
	                teamName: team.name,
	                week,
	                pitchType: pickOfferPitchTypeForTeam(target, team),
	                source: 'CPU',
	            });

                // Package deal: if we offer one, offer the linked recruit(s) too (schools take the pair).
                const packageDealLinks = (target.relationships || []).filter(isPackageDealLink);
                for (const link of packageDealLinks) {
                    const otherId = link.personId;
                    if (!otherId || otherId === target.id) continue;
                    const other = recruitsByIdIndex.get(otherId);
                    if (!other) continue;
                    if (other.verbalCommitment) continue;
                    if ((other.declinedOffers || []).includes(team.name)) continue;
                    if ((other.cpuOffers || []).includes(team.name)) continue;
                    if ((other.cpuOffers || []).length >= 35) continue;

                    other.cpuOffers = [...(other.cpuOffers || []), team.name];
                    if (!other.teamMomentum) other.teamMomentum = {};
                    other.teamMomentum[team.name] = clamp((other.teamMomentum[team.name] ?? 0) + (mid ? 9 : 8), -20, 20);
                    if (!other.offerHistory) other.offerHistory = [];
                    other.offerHistory.push({
                        teamName: team.name,
                        week,
                        pitchType: pickOfferPitchTypeForTeam(other, team),
                        source: 'CPU',
                    });
                    if (!other.lastRecruitingNews) {
                        other.lastRecruitingNews = `${other.name} is considering a package deal with ${target.name}.`;
                    }
                }
                if (packageDealLinks.length) {
                    target.teamMomentum[team.name] = clamp((target.teamMomentum[team.name] ?? 0) + 4, -20, 20);
                }

	            pointsLeft -= offerActionCost;
	            offersMade++;
	        }

	        // Drop longshots: if far behind late, revoke to free attention.
	        if (week >= 7) {
	            updatedRecruits.forEach((r: Recruit) => {
	                if (!r.cpuOffers?.includes(team.name)) return;
	                if (r.verbalCommitment) return;

                    // Don't revoke if this offer is part of an active package deal (partner still has our offer).
                    const hasActivePackagePartnerOffer = (r.relationships || []).some(link => {
                        if (!isPackageDealLink(link)) return false;
                        const other = recruitsByIdIndex.get(link.personId);
                        if (!other) return false;
                        if (other.verbalCommitment) return false;
                        return (other.cpuOffers || []).includes(team.name);
                    });
                    if (hasActivePackagePartnerOffer) return;

	                const momentum = r.teamMomentum?.[team.name] ?? 0;
	                const offerCount = r.cpuOffers.length + (r.userHasOffered ? 1 : 0);
	                const shouldDrop =
	                    (offerCount >= 18 && prestige < 70 && momentum <= 0) ||
	                    (offerCount >= 26 && momentum <= 1) ||
	                    (late && momentum <= -3);
	                if (!shouldDrop) return;
	                r.cpuOffers = r.cpuOffers.filter(x => x !== team.name);
	                if (!r.offerHistory) r.offerHistory = [];
	                for (let i = r.offerHistory.length - 1; i >= 0; i--) {
	                    const entry = r.offerHistory[i]!;
	                    if (entry.teamName === team.name && !entry.revoked) {
	                        r.offerHistory[i] = { ...entry, revoked: true };
	                        break;
	                    }
	                }
	                if (!r.teamMomentum) r.teamMomentum = {};
	                r.teamMomentum[team.name] = clamp((r.teamMomentum[team.name] ?? 0) - 2, -20, 20);
	            });
	        }
	    });

	    // "Cooling off" for the user team: if you have an active offer but no momentum for a while, interest drifts down.
	    if (userTeam) {
	        updatedRecruits.forEach((r: Recruit) => {
	            if (!r.userHasOffered) return;
	            if (r.verbalCommitment) return;
	            const m = r.teamMomentum?.[userTeam.name] ?? 0;
	            const offerHistory = r.offerHistory || [];
	            const lastOffer = [...offerHistory].reverse().find(e => e.teamName === userTeam.name && !e.revoked) || null;
	            if (!lastOffer) return;
	            const weeksSinceOffer = week - lastOffer.week;
	            if (weeksSinceOffer >= 2 && m <= 0) {
	                r.interest = normalizeInterest(r.interest - stableIntBetween(`${r.id}:${userTeam.name}:${week}:cool`, 1, 3));
	            }
	        });
	    }

    // Auto-spend contacts on targeted recruits if user has contacts remaining
    if (userTeam && currentContactsMade < actualContactPoints) {
        const targetedRecruits = updatedRecruits.filter(r => 
            r.isTargeted && 
            !r.userHasOffered && 
            !r.verbalCommitment && 
            !r.declinedOffers.includes(userTeamName)
        ).sort((a, b) => b.interest - a.interest); // Prioritize higher interest

        for (const r of targetedRecruits) {
            if (currentContactsMade >= actualContactPoints) break;
            if (r.interest >= 90) continue; // Already high interest, will be offered scholarship next

            const contactCost = 1; // Assuming 1 contact point per auto-contact
            if (currentContactsMade + contactCost <= actualContactPoints) {
                currentContactsMade += contactCost;
                const baseline = calculateRecruitInterestScore(r, userTeam, { gameInSeason: week }, userCoachSkills);
                const difference = baseline - r.interest;
                let boost: number;
                if (difference > 0) {
                    boost = Math.min(10, Math.max(4, difference * 0.45));
                } else {
                    const aboveBaseline = Math.abs(difference);
                    boost = Math.max(1, 3 - aboveBaseline / 18);
	                }
	                r.interest = normalizeInterest(r.interest + boost);
	                if (!r.teamMomentum) r.teamMomentum = {};
	                r.teamMomentum[userTeamName] = clamp((r.teamMomentum[userTeamName] ?? 0) + 1, -20, 20);
	            }
	        }
	    }

    // Auto-offer scholarships to targeted recruits with high interest
    if (userTeam) {
        for (const r of updatedRecruits) {
            if (
                r.isTargeted && 
                r.interest >= 84 && 
                !r.userHasOffered && 
                !r.verbalCommitment && 
                !r.declinedOffers.includes(userTeamName)
            ) {
                const offerCost = 9; // Assuming 9 contact points for an offer
                if (currentContactsMade + offerCost <= actualContactPoints) {
	                    currentContactsMade += offerCost;
	                    r.userHasOffered = true;
	                    r.interest = normalizeInterest(r.interest + randomBetween(15, 25));
	                    if (!r.teamMomentum) r.teamMomentum = {};
	                    r.teamMomentum[userTeamName] = clamp((r.teamMomentum[userTeamName] ?? 0) + 4, -20, 20);
	                }
            }
        }
    }

    const getRecruitOfferDetails = (r: Recruit) => {
        const committedSchool = r.verbalCommitment;
        const allOffers = [...r.cpuOffers, ...(r.userHasOffered ? [userTeamName] : [])]
            .filter(offer => !r.declinedOffers.includes(offer));
        if (committedSchool && !allOffers.includes(committedSchool) && !r.declinedOffers.includes(committedSchool)) {
            allOffers.push(committedSchool);
        }
        const offerDetails = allOffers
            .map(teamName => {
                const team = teamsByName.get(teamName);
                if (!team) return null;
                return {
                    name: teamName,
                    score: calculateRecruitInterestScore(
                        r,
                        team,
                        { gameInSeason: week, isSigningPeriod },
                        teamName === userTeamName ? userCoachSkills : undefined
                    ),
                };
            })
            .filter(Boolean) as { name: string; score: number }[];
        offerDetails.sort((a, b) => b.score - a.score);
        return { allOffers, offerDetails };
    };

    const packageResolvedIds = new Set<string>();
    const processedPackagePairs = new Set<string>();

    updatedRecruits.forEach((r: Recruit) => {
        if (!r.relationships || !r.relationships.length) return;
        r.relationships.forEach(link => {
            if (!isPackageDealLink(link)) return;
            if (link.personId === r.id) return;
            const other = recruitsByIdIndex.get(link.personId);
            if (!other) return;

            const pairKey = [r.id, other.id].sort().join('|');
            if (processedPackagePairs.has(pairKey)) return;
            processedPackagePairs.add(pairKey);

            const linkType = link.type;
            const relationshipMultiplier = getPackageRelationshipMultiplier(linkType);
            const baseDisposition = (getPackageBaseDisposition(r) + getPackageBaseDisposition(other)) / 2;
            const independencePenalty = (getPackageIndependencePenalty(r) + getPackageIndependencePenalty(other)) / 2;
            const packageStrength = clamp(relationshipMultiplier * baseDisposition - independencePenalty, 0, 1);

            const offerDataA = getRecruitOfferDetails(r);
            const offerDataB = getRecruitOfferDetails(other);
            const bestSoloScoreA = offerDataA.offerDetails[0]?.score ?? 0;
            const bestSoloScoreB = offerDataB.offerDetails[0]?.score ?? 0;

            const offerSetA = new Set(offerDataA.allOffers);
            const offerSetB = new Set(offerDataB.allOffers);
            const candidateSchools = new Set<string>([...offerSetA, ...offerSetB]);

            let bestJointSchool: { name: string; jointScore: number; soloScoreA: number; soloScoreB: number } | null = null;
            const softThreshold = 58 - decisionPressure * 8;

            candidateSchools.forEach(teamName => {
                if (r.declinedOffers.includes(teamName) || other.declinedOffers.includes(teamName)) return;
                const team = teamsByName.get(teamName);
                if (!team) return;
                const hasOfferA = offerSetA.has(teamName);
                const hasOfferB = offerSetB.has(teamName);
                if (!hasOfferA && !hasOfferB) return;

                const soloScoreA = calculateRecruitInterestScore(
                    r,
                    team,
                    { gameInSeason: week, isSigningPeriod },
                    teamName === userTeamName ? userCoachSkills : undefined
                );
                const soloScoreB = calculateRecruitInterestScore(
                    other,
                    team,
                    { gameInSeason: week, isSigningPeriod },
                    teamName === userTeamName ? userCoachSkills : undefined
                );

                const hardEligible = hasOfferA && hasOfferB;
                const softEligible = (hasOfferA && soloScoreB >= softThreshold) || (hasOfferB && soloScoreA >= softThreshold);
                if (!hardEligible && !softEligible) return;

                const prestigeNormalized = clamp((team.recruitingPrestige ?? team.prestige ?? 50) / 100, 0, 1);
                const prestigeHalo = Math.pow(prestigeNormalized, 2.2) * 4;
                const imbalancePenalty = Math.max(0, Math.abs(soloScoreA - soloScoreB) - 6) * 0.45;
                const synergyBonus = packageStrength * (6 + decisionPressure * 4);
                const jointScore = soloScoreA + soloScoreB + synergyBonus + prestigeHalo - imbalancePenalty;

                if (!bestJointSchool || jointScore > bestJointSchool.jointScore) {
                    bestJointSchool = { name: teamName, jointScore, soloScoreA, soloScoreB };
                }
            });

            let packageActive = packageStrength >= 0.15 && !!bestJointSchool;
            if (bestJointSchool) {
                const gapThreshold = packageStrength * 12 + 6;
                const soloGapA = bestSoloScoreA - bestJointSchool.soloScoreA;
                const soloGapB = bestSoloScoreB - bestJointSchool.soloScoreB;
                if (soloGapA > gapThreshold || soloGapB > gapThreshold) {
                    packageActive = false;
                }
                if (RECRUITING_DEBUG_PACKAGES) {
                    const prevActive = r.packageDealActive ?? other.packageDealActive ?? false;
                    if (prevActive !== packageActive) {
                        console.log(`[pkg] ${r.name}+${other.name} active=${packageActive} strength=${packageStrength.toFixed(2)} soloGapA=${soloGapA.toFixed(1)} soloGapB=${soloGapB.toFixed(1)} bestJoint=${bestJointSchool.name}`);
                    } else {
                        console.log(`[pkg] ${r.name}+${other.name} active=${packageActive} strength=${packageStrength.toFixed(2)} bestSoloA=${bestSoloScoreA.toFixed(1)} bestSoloB=${bestSoloScoreB.toFixed(1)} bestJoint=${bestJointSchool.name}`);
                    }
                }
            } else if (RECRUITING_DEBUG_PACKAGES) {
                console.log(`[pkg] ${r.name}+${other.name} active=false strength=${packageStrength.toFixed(2)} reason=NoEligibleJointSchool`);
            }

            r.packageDealActive = packageActive;
            other.packageDealActive = packageActive;

            if (!packageActive) return;
            if (r.verbalCommitment || other.verbalCommitment) return;
            if (packageResolvedIds.has(r.id) || packageResolvedIds.has(other.id)) return;
            if (!bestJointSchool) return;

            const jointCommitThreshold = (135 - decisionPressure * 12) - (isSigningPeriod ? 8 : 0);
            const individualMinAcceptable = clamp(58 - decisionPressure * 6 - (isSigningPeriod ? 4 : 0), 45, 65);

            if (RECRUITING_DEBUG_PACKAGES) {
                console.log(`[pkg] ${r.name}+${other.name} jointScore=${bestJointSchool.jointScore.toFixed(1)} threshold=${jointCommitThreshold.toFixed(1)} minAccept=${individualMinAcceptable.toFixed(1)} @ ${bestJointSchool.name}`);
            }

            if (
                bestJointSchool.jointScore >= jointCommitThreshold &&
                bestJointSchool.soloScoreA >= individualMinAcceptable &&
                bestJointSchool.soloScoreB >= individualMinAcceptable
            ) {
                r.verbalCommitment = bestJointSchool.name;
                other.verbalCommitment = bestJointSchool.name;
                teamCommitCounts.set(bestJointSchool.name, (teamCommitCounts.get(bestJointSchool.name) || 0) + 2);
                r.isTargeted = false;
                other.isTargeted = false;
                r.commitWeek = r.commitWeek ?? week;
                other.commitWeek = other.commitWeek ?? week;
                r.softCommitment = !isSigningPeriod && week <= 8;
                other.softCommitment = r.softCommitment;

                if (isSigningPeriod) {
                    r.recruitmentStage = 'Signed';
                    other.recruitmentStage = 'Signed';
                    r.signWeek = r.signWeek ?? week;
                    other.signWeek = other.signWeek ?? week;
                    r.lastRecruitingNews = `${r.name} signed with ${bestJointSchool.name} as part of a package deal with ${other.name}.`;
                    other.lastRecruitingNews = `${other.name} signed with ${bestJointSchool.name} as part of a package deal with ${r.name}.`;
                } else {
                    r.recruitmentStage = r.softCommitment ? 'SoftCommit' : 'HardCommit';
                    other.recruitmentStage = other.softCommitment ? 'SoftCommit' : 'HardCommit';
                    r.lastRecruitingNews = `${r.name} committed to ${bestJointSchool.name} as part of a package deal with ${other.name}.`;
                    other.lastRecruitingNews = `${other.name} committed to ${bestJointSchool.name} as part of a package deal with ${r.name}.`;
                }

                if (bestJointSchool.name === userTeamName) {
                    r.userHasOffered = false;
                    other.userHasOffered = false;
                }

                packageResolvedIds.add(r.id);
                packageResolvedIds.add(other.id);
            }
        });
    });

	    updatedRecruits.forEach((r: Recruit) => {
	        const wasCommitted = Boolean(r.verbalCommitment);
	        const committedSchool = r.verbalCommitment;

        if (packageResolvedIds.has(r.id)) return;
        const { allOffers, offerDetails } = getRecruitOfferDetails(r);
        if (allOffers.length === 0) return;

	        const topOffer = offerDetails[0];
	        if (!topOffer) return;

            const packagePartners = (r.relationships || [])
                .filter(isPackageDealLink)
                .map(link => recruitsByIdIndex.get(link.personId))
                .filter(Boolean) as Recruit[];
            const hasPackageDeal = packagePartners.length > 0;
            const hasMutualPackageOffer = (() => {
                if (!hasPackageDeal) return false;
                const offerSet = new Set(allOffers);
                for (const partner of packagePartners) {
                    const partnerOffers = [...(partner.cpuOffers || []), ...(partner.userHasOffered ? [userTeamName] : [])]
                        .filter(offer => !(partner.declinedOffers || []).includes(offer));
                    for (const school of partnerOffers) {
                        if (offerSet.has(school)) return true;
                    }
                }
                return false;
            })();
	        
	        const interestDifference = offerDetails.length > 1 ? topOffer.score - offerDetails[1].score : 100;
	        const shortlistForceInclude = committedSchool
	            ? [committedSchool, offerDetails[1]?.name].filter(Boolean) as string[]
	            : [offerDetails[1]?.name].filter(Boolean) as string[];
		        const { shares: offerShares } = buildRecruitOfferShortlist(offerDetails, {
		            min: 3,
		            max: 6,
		            leaderWindow: 10,
		            forceInclude: shortlistForceInclude,
		            seedKey: `${r.id}:${week}`,
                    temperatureMultiplier: getRecruitOfferShareTemperatureMultiplier(r),
		        });
	        const topShare = offerShares.get(topOffer.name) ?? 0;

	        // Decommitments (pre-signing only): committed recruits can reopen if a new leader emerges.
	        if (wasCommitted && committedSchool && !isSigningPeriod) {
	            const committedTeamDetail = offerDetails.find(o => o.name === committedSchool);
	            const committedScore = committedTeamDetail?.score ?? 0;
	            const committedShare = offerShares.get(committedSchool) ?? 0;
	            const bestAlternative = offerDetails.find(o => o.name !== committedSchool) ?? null;
	            if (bestAlternative && week >= 4) {
	                const bestAltShare = offerShares.get(bestAlternative.name) ?? 0;
	                const shareGap = bestAltShare - committedShare;
	                const scoreGap = bestAlternative.score - committedScore;

                const resilience = clamp(r.resilience ?? 50, 0, 100);
                const softnessMultiplier = r.softCommitment ? 1.65 : 1.0;
                const resilienceMultiplier = clamp(1.15 - (resilience / 120), 0.25, 1.15);

                const baseChance =
                    shareGap <= 10 || scoreGap <= 4
                        ? 0
                        : clamp((shareGap - 10) / 25, 0, 1) * 0.22;

	                const chance = clamp(baseChance * softnessMultiplier * resilienceMultiplier, 0, 0.35);
	                if (Math.random() < chance) {
	                    r.lastRecruitingNews = `${r.name} reopened their recruitment after a late push from ${bestAlternative.name}.`;
	                    r.verbalCommitment = null;
	                    r.softCommitment = false;
	                    r.recruitmentStage = 'Narrowing';
	                    // Prevent an instant recommit in the same week; they'll re-evaluate next update.
	                    return;
	                }
	            }
	            // Soft commits naturally "harden" as time passes and the lead holds.
	            if (r.verbalCommitment && r.softCommitment) {
	                const lockWeek = 10;
	                const lockShare = offerShares.get(committedSchool) ?? 0;
	                const lockScore = committedScore;
	                if (week >= lockWeek && lockShare >= 58 && lockScore >= 72) {
	                    r.softCommitment = false;
	                    r.recruitmentStage = 'HardCommit';
	                }
	            }
	            // If still committed, do not re-run commitment logic.
	            if (r.verbalCommitment) return;
	        }
        
	        if (isSigningPeriod) {
            // During signing period, commitment threshold drops each day.
            // Day 1: 60, Day 2: 55, ..., Day 7: 30
            const signingDay = (week - 32); // signingPeriodDay is passed as week
            const signingCommitThreshold = 65 - (signingDay * 5);
	            if (topOffer.score > signingCommitThreshold) {
	                r.verbalCommitment = topOffer.name;
	                r.softCommitment = false;
	                r.isTargeted = false;
	                r.recruitmentStage = 'Signed';
	                r.signWeek = week;
	                if (!r.commitWeek) r.commitWeek = week;
	                r.lastRecruitingNews = `${r.name} signed with ${topOffer.name}.`;
	                if (r.userHasOffered) {
	                    r.userHasOffered = false;
	                }
	            }
	        } else {
            // Commitment pacing:
            // - Early season: commits are rare (especially for top recruits with many options).
            // - By late December: a solid chunk of top recruits should be committed.
            const minCommitWeek =
                r.stars >= 5 ? 3 :
                r.stars === 4 ? 2 :
                1;

            const earlySeason = week <= 4;
            const midSeason = week > 4 && week <= 8;

            const offerCount = offerDetails.length;
            const packageCommitAdj = hasPackageDeal && hasMutualPackageOffer ? 1 : 0;
            const pressureAdjustment = Math.round(decisionPressure * 8);

            const leaderTeam = teamsByName.get(topOffer.name);
            let scarcityMod = 0;
            if (leaderTeam) {
                 const returning = leaderTeam.roster.filter(p => p.year !== 'Sr').length;
                 const commits = teamCommitCounts.get(topOffer.name) || 0;
                 const slots = 13 - returning - commits;
                 if (slots <= 1) scarcityMod = 8;
                 else if (slots <= 2) scarcityMod = 4;
            }

            const scoreGate = clamp((earlySeason ? 90 : midSeason ? 84 : 78) - Math.floor(offerCount / 4) * 2 - (packageCommitAdj ? 7 : 0) - pressureAdjustment - scarcityMod, 62, 92);
            const shareGate = clamp(78 - offerCount * 4 - Math.round(week * 1.5) - (packageCommitAdj ? 12 : 0) - Math.round(decisionPressure * 10) - scarcityMod * 2, 15, 78);
            const leadGate = clamp((earlySeason ? 12 : midSeason ? 8 : 5) - Math.floor(offerCount / 6) - (packageCommitAdj ? 2 : 0) - Math.round(decisionPressure * 2) - Math.ceil(scarcityMod / 2), 1, 14);

            const canCommitThisWeek = week >= Math.max(1, minCommitWeek - (packageCommitAdj ? 1 : 0));
            const hasClearLead = offerDetails.length === 1 || interestDifference >= leadGate;
            const commitByShare = topOffer.score >= scoreGate && topShare >= shareGate && hasClearLead;

            // Some late-December commits happen with slightly less dominant shares (especially for high-end recruits).
            const softCommitChance =
                canCommitThisWeek && midSeason && r.stars >= 4 && topOffer.score >= (scoreGate - 4)
                    ? clamp((topShare - Math.max(28, shareGate - 6)) / 18, 0, 1) * (packageCommitAdj ? 0.32 : 0.18)
                    : 0;

	            if ((canCommitThisWeek && commitByShare) || Math.random() < softCommitChance) {
	                r.verbalCommitment = topOffer.name;
                    teamCommitCounts.set(topOffer.name, (teamCommitCounts.get(topOffer.name) || 0) + 1);
	                r.softCommitment = week <= 8;
	                r.isTargeted = false;
	                r.commitWeek = r.commitWeek ?? week;
	                r.recruitmentStage = r.softCommitment ? 'SoftCommit' : 'HardCommit';
	                r.lastRecruitingNews = r.softCommitment
	                    ? `${r.name} gave a soft commitment to ${topOffer.name}.`
	                    : `${r.name} committed to ${topOffer.name}.`;
	                if (r.userHasOffered) {
	                    r.userHasOffered = false;
	                }
	            } else if (week > 8 && r.stars <= 3 && allOffers.length <= 4) {
                // Late season "desperation" for lower-rated recruits with few offers
                const desperationCommitThreshold = 30 + (week - 8); // Starts at 30 and increases
                const adjustedDesperationThreshold = Math.max(20, desperationCommitThreshold - Math.round(decisionPressure * 6));
	                if (topOffer.score > adjustedDesperationThreshold) {
                        const targetSchoolName = topOffer.name;
                        // Delayed commitment logic
                        if (options?.useDailyCommitments && options.startDate && !r.verbalCommitment) {
                             const daysDelay = Math.floor(Math.random() * 6); // 0 to 5 days
                             const commitDate = addDaysISO(options.startDate, daysDelay);
                             r.pendingCommitment = {
                                 school: targetSchoolName,
                                 date: commitDate,
                                 isHard: true,
                                 news: `${r.name} committed to ${targetSchoolName} late in the cycle.`
                             };
                             // Don't set verbalCommitment yet
                        } else {
    	                    r.verbalCommitment = targetSchoolName;
                            teamCommitCounts.set(targetSchoolName, (teamCommitCounts.get(targetSchoolName) || 0) + 1);
    	                    r.softCommitment = false;
    	                    r.isTargeted = false;
    	                    r.commitWeek = r.commitWeek ?? week;
    	                    r.recruitmentStage = 'HardCommit';
    	                    r.lastRecruitingNews = `${r.name} committed to ${targetSchoolName} late in the cycle.`;
    	                    if (r.userHasOffered) {
    	                        r.userHasOffered = false;
    	                    }
                         }
	                }
	            }
	        }
	    });

        // Package deal synchronization: if one commits and the other has a real shot at the same school,
        // they tend to commit together (or quickly follow).
        updatedRecruits.forEach((r: Recruit) => {
            const committedTeam = r.verbalCommitment;
            if (!committedTeam) return;
            if (!r.relationships || !r.relationships.length) return;

            r.relationships.forEach(link => {
                if (!isPackageDealLink(link)) return;
                if (link.personId === r.id) return;
                const other = recruitsByIdIndex.get(link.personId);
                if (!other) return;
                if (other.verbalCommitment) return;
                if (other.declinedOffers?.includes(committedTeam)) return;

                const otherOffers = [...(other.cpuOffers || []), ...(other.userHasOffered ? [userTeamName] : [])]
                    .filter(offer => !(other.declinedOffers || []).includes(offer));
                if (!otherOffers.includes(committedTeam)) return;

                const otherOfferDetails = otherOffers.map(teamName => ({
                    name: teamName,
                    score: calculateRecruitInterestScore(
                        other,
                        teamsByName.get(teamName)!,
                        { gameInSeason: week, isSigningPeriod },
                        teamName === userTeamName ? userCoachSkills : undefined
                    ),
                })).sort((a, b) => b.score - a.score);
                if (!otherOfferDetails.length) return;

                const { shares } = buildRecruitOfferShortlist(otherOfferDetails, {
                    min: 3,
                    max: 6,
                    leaderWindow: 10,
                    seedKey: `${other.id}:${week}:pkgSync`,
                    temperatureMultiplier: getRecruitOfferShareTemperatureMultiplier(other),
                });
                const leader = otherOfferDetails[0]!;
                const committedScore = otherOfferDetails.find(o => o.name === committedTeam)?.score ?? 0;
                const committedShare = shares.get(committedTeam) ?? 0;
                const leaderShare = shares.get(leader.name) ?? 0;
                const scoreGap = leader.score - committedScore;

                // Only sync when the committed school is already a plausible top option.
                const qualifies =
                    (scoreGap <= 6 && committedScore >= 62) ||
                    (committedShare >= Math.max(16, leaderShare - 8) && committedScore >= 58);
                if (!qualifies) return;

                const syncChance = clamp(0.45 + committedShare / 220 - scoreGap * 0.035, 0.25, 0.9);
                if (Math.random() > syncChance) return;

                other.verbalCommitment = committedTeam;
                other.isTargeted = false;
                other.commitWeek = other.commitWeek ?? week;

                if (isSigningPeriod) {
                    other.softCommitment = false;
                    other.recruitmentStage = 'Signed';
                    other.signWeek = other.signWeek ?? week;
                    other.lastRecruitingNews = `${other.name} signed with ${committedTeam} as part of a package deal with ${r.name}.`;
                } else {
                    other.softCommitment = other.softCommitment || week <= 8 || r.softCommitment;
                    other.recruitmentStage = other.softCommitment ? 'SoftCommit' : 'HardCommit';
                    other.lastRecruitingNews = other.softCommitment
                        ? `${other.name} gave a soft commitment to ${committedTeam} as part of a package deal with ${r.name}.`
                        : `${other.name} committed to ${committedTeam} as part of a package deal with ${r.name}.`;
                }

                if (committedTeam === userTeamName && other.userHasOffered) {
                    other.userHasOffered = false;
                }
            });
        });

	    // Stage fallback for uncommitted recruits.
	    updatedRecruits.forEach((r: Recruit) => {
	        if (r.recruitmentStage === 'Signed') return;
	        if (isSigningPeriod && r.verbalCommitment) {
	            r.recruitmentStage = 'Signed';
	            r.signWeek = r.signWeek ?? week;
	            return;
	        }
	        if (r.verbalCommitment) {
	            r.recruitmentStage = r.softCommitment ? 'SoftCommit' : 'HardCommit';
	            return;
	        }
	        const offerCount = (r.cpuOffers?.length || 0) + (r.userHasOffered ? 1 : 0);
	        r.recruitmentStage = offerCount === 0 ? 'Open' : (offerCount >= 3 || week >= 4 ? 'Narrowing' : 'Open');
	    });

	    // Relationships: package deal behavior (twins/siblings/cousins w/ package deal note).
	    const recruitsById = new Map(updatedRecruits.map((r: Recruit) => [r.id, r]));
	    updatedRecruits.forEach((r: Recruit) => {
	        if (!r.relationships || !r.relationships.length) return;
	        const committedTeam = r.verbalCommitment;
	        if (!committedTeam) return;
	        r.relationships.forEach(link => {
	            if (!isPackageDealLink(link)) return;
	            if (link.personId === r.id) return;
	            const other = recruitsById.get(link.personId);
	            if (!other) return;
	            if (other.verbalCommitment) return;
	            if (!other.teamMomentum) other.teamMomentum = {};
	            other.teamMomentum[committedTeam] = clamp((other.teamMomentum[committedTeam] ?? 0) + 7, -20, 20);
	            if (committedTeam === userTeamName) {
	                other.interest = clamp(other.interest + 4, 0, 100);
	            } else {
	                if (!other.cpuOffers.includes(committedTeam) && !other.declinedOffers?.includes(committedTeam)) {
	                    other.cpuOffers.push(committedTeam);
	                    const t = teamsByName.get(committedTeam);
	                    if (!other.offerHistory) other.offerHistory = [];
	                    other.offerHistory.push({
	                        teamName: committedTeam,
	                        week,
	                        pitchType: t ? pickOfferPitchTypeForTeam(other, t) : 'Standard',
	                        source: 'CPU',
	                    });
	                }
	            }
	            if (!other.lastRecruitingNews) {
	                other.lastRecruitingNews = `${other.name} is considering a package deal with ${r.name}.`;
	            }
	        });
	    });

	    // Offer mirroring: if a school offers one package-deal recruit, it will offer the linked recruit too.
	    updatedRecruits = applyPackageDealOfferMirroring(updatedRecruits, teams, userTeamName, week);

    return { updatedRecruits, updatedContactsMadeThisWeek: currentContactsMade };
};

const trimCpuRoster = (roster: Player[]): Player[] => {
    const MAX_ROSTER_SIZE = 15;
    if (roster.length <= MAX_ROSTER_SIZE) {
        return roster;
    }

    const sortedRoster = [...roster].sort((a, b) => {
        return (a.overall + a.potential) - (b.overall + b.potential);
    });

    return sortedRoster.slice(roster.length - MAX_ROSTER_SIZE);
};

const calculateOfferInterestShares = (
    offerDetails: { name: string; score: number }[],
    options?: { seedKey?: string; temperature?: number; temperatureMultiplier?: number }
): Map<string, number> => {
    const shares = new Map<string, number>();
    if (offerDetails.length === 0) return shares;
    if (offerDetails.length === 1) {
        shares.set(offerDetails[0]!.name, 100);
        return shares;
    }
    // Softmax over scores to get relative "interest" across options.
    // Uses an adaptive temperature + deterministic tie-breaker jitter to avoid flat ties.
    const seedKey = options?.seedKey || 'share';
    const scores = offerDetails.map(o => o.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const spread = maxScore - minScore;
    const baseTemperature = options?.temperature ?? (7.5 - spread / 12);
    const temperatureMultiplier = options?.temperatureMultiplier ?? 1;
    const temperature = clamp(baseTemperature * temperatureMultiplier, 2.2, 10);

    const adjusted = offerDetails.map(o => ({
        name: o.name,
        score: o.score + stableFloatBetween(`${seedKey}:${o.name}`, -0.65, 0.65),
    }));
    const maxAdj = Math.max(...adjusted.map(o => o.score));
    const weights = adjusted.map(o => Math.exp((o.score - maxAdj) / temperature));
    const denom = weights.reduce((sum, w) => sum + w, 0);
    if (!Number.isFinite(denom) || denom <= 0) {
        offerDetails.forEach(o => shares.set(o.name, 100 / offerDetails.length));
        return shares;
    }
    offerDetails.forEach((o, idx) => {
        shares.set(o.name, (weights[idx]! / denom) * 100);
    });
    return shares;
		};

export type RecruitOfferScore = { name: string; score: number };

export const getRecruitOfferShareTemperatureMultiplier = (recruit: Recruit): number => {
    const decisionStyle: RecruitDecisionStyle = recruit.decisionStyle || 'Balanced';
    const strictness = clamp((recruit.fitStrictness ?? 50) / 100, 0, 1);

    const decisionMultiplier =
        decisionStyle === 'Decisive' ? 0.84 :
        decisionStyle === 'Indecisive' ? 1.18 :
        1.0;

    // Higher strictness -> sharper preference curve -> lower temperature.
    const strictnessMultiplier = 1.10 - strictness * 0.28;

    return clamp(decisionMultiplier * strictnessMultiplier, 0.7, 1.35);
};

export const buildRecruitOfferShortlist = (
    offers: RecruitOfferScore[],
    options?: { min?: number; max?: number; leaderWindow?: number; forceInclude?: string[]; seedKey?: string; temperature?: number; temperatureMultiplier?: number }
): { shortlist: RecruitOfferScore[]; longshots: RecruitOfferScore[]; shares: Map<string, number> } => {
    const min = clamp(options?.min ?? 3, 1, 12);
    const max = clamp(options?.max ?? 6, min, 20);
    const leaderWindow = clamp(options?.leaderWindow ?? 10, 0, 40);

    const sorted = [...offers].sort((a, b) => b.score - a.score);
    if (sorted.length === 0) {
        return { shortlist: [], longshots: [], shares: new Map() };
    }

    const leaderScore = sorted[0]!.score;
    let shortlist = sorted.filter(o => o.score >= leaderScore - leaderWindow).slice(0, max);
    if (shortlist.length < min) {
        shortlist = sorted.slice(0, Math.min(min, sorted.length));
    }

    const forcedNames = new Set((options?.forceInclude || []).filter(Boolean));
    forcedNames.forEach(name => {
        if (shortlist.some(o => o.name === name)) return;
        const match = sorted.find(o => o.name === name);
        if (match) shortlist.push(match);
    });

    if (shortlist.length > max && forcedNames.size > 0) {
        const keepForced = (o: RecruitOfferScore) => forcedNames.has(o.name);
        shortlist = [...shortlist].sort((a, b) => b.score - a.score);
        while (shortlist.length > max) {
            const idx = shortlist.slice().reverse().findIndex(o => !keepForced(o));
            if (idx === -1) break;
            const removeIndex = shortlist.length - 1 - idx;
            shortlist.splice(removeIndex, 1);
        }
    }

    const shortlistNames = new Set(shortlist.map(o => o.name));
    const longshots = sorted.filter(o => !shortlistNames.has(o.name));
    const shares = calculateOfferInterestShares(shortlist, {
        seedKey: options?.seedKey,
        temperature: options?.temperature,
        temperatureMultiplier: options?.temperatureMultiplier,
    });

    return { shortlist, longshots, shares };
};

const fillCpuRoster = (roster: Player[]): Player[] => {
    const MIN_ROSTER_SIZE = 13;
    const needed = MIN_ROSTER_SIZE - roster.length;
    if (needed <= 0) {
        return roster;
    }
    const walkOns = Array.from({ length: needed }, () => {
        const p = createPlayer('Fr');
        p.overall = randomBetween(35, 50);
        p.potential = randomBetween(p.overall, 65);
        p.stats = { insideScoring: p.overall, outsideScoring: p.overall, playmaking: p.overall, perimeterDefense: p.overall, insideDefense: p.overall, rebounding: p.overall, stamina: randomBetween(55, 80) };
        return p;
    });
    return [...roster, ...walkOns];
};

const updateTeamPipelines = (team: Team): Team => {
    const playersByState: { [state: string]: number } = {};
    team.roster.forEach(p => {
        if (p.homeState) {
             playersByState[p.homeState] = (playersByState[p.homeState] || 0) + 1;
        }
    });
    
    let pipelines = team.pipelines || [];

    // Decay existing pipelines that are no longer supported
    pipelines = pipelines.filter(p => {
        const count = playersByState[p.state] || 0;
        if (count < 2) {
            return false; // Remove pipeline if less than 2 players
        }
        return true;
    });

    pipelines.forEach(p => {
        const count = playersByState[p.state] || 0;
        if (count < 3) {
            p.tier = 'Bronze';
        } else if (count < 5) {
            if (p.tier === 'Gold') p.tier = 'Silver';
        }
    });

    for (const state in playersByState) {
        const count = playersByState[state];
        const existingPipeline = pipelines.find(p => p.state === state);

        if (existingPipeline) {
            if (count >= 5) { // 5 players from a state for a gold pipeline
                existingPipeline.tier = 'Gold';
            } else if (count >= 3) { // 3 for silver
                 if (existingPipeline.tier !== 'Gold') existingPipeline.tier = 'Silver';
            }
        } else {
            if (count >= 2) { // 2 to establish a bronze pipeline
                pipelines.push({ state, tier: 'Bronze' });
            }
        }
    }
    
    return { ...team, pipelines };
};

export const advanceToNewSeason = (teams: Team[], recruits: Recruit[], season: number, nbaTeams: any[] = []): { finalTeams: Team[] } => {
    const recruitsBySchool = new Map<string, Recruit[]>();
    recruits.forEach(r => {
        if (r.verbalCommitment) {
            if (!recruitsBySchool.has(r.verbalCommitment)) {
                recruitsBySchool.set(r.verbalCommitment, []);
            }
            recruitsBySchool.get(r.verbalCommitment)!.push(r);
        }
    });

    const finalTeams = teams.map(team => {
        const signedRecruits = recruitsBySchool.get(team.name) || [];
        const newRecruitPlayers = signedRecruits
            .filter(r => !team.roster.some(p => p.id === r.id))
            .map(r => {
                const { verbalCommitment, userHasOffered, cpuOffers, interest, stars, declinedOffers, isTargeted, decisionStyle, commitmentStyle, fitStrictness, ...playerData } = r;
                return {
                    ...playerData,
                    year: 'Fr' as 'Fr',
                    starterPosition: null,
                    seasonStats: resetSeasonStats(),
                    startOfSeasonOverall: r.overall,
                    isTargeted: false,
                    naturalProgressAccumulator: 0,
                };
            });

        // Progress returning players to the next class and apply offseason growth
        const progressedRoster = rollOverTeamRoster(team);

        const tentativeRoster: Player[] = [...progressedRoster, ...newRecruitPlayers];
        const uniqueRoster = Array.from(tentativeRoster.reduce((map, player) => {
            if (!map.has(player.id)) {
                map.set(player.id, player);
            }
            return map;
        }, new Map<string, Player>()).values());

        const newRoster: Player[] = uniqueRoster;
        let finalRoster = team.isUserTeam ? newRoster : trimCpuRoster(newRoster);
        if (!team.isUserTeam) finalRoster = fillCpuRoster(finalRoster);

        const headCoach = team.headCoach
            ? {
                ...team.headCoach,
                seasons: team.headCoach.seasons + 1,
                seasonWins: 0,
                seasonLosses: 0,
            }
            : createHeadCoachProfile(team.name, team.prestige);

        const teamWithUpdatedBoard = updateBoardExpectations(team);
        
        let teamWithFinalRoster = { ...teamWithUpdatedBoard, roster: assignDefaultMinutes(autoSetStarters(finalRoster)), record: { wins: 0, losses: 0 }, headCoach };
        
        if (newRecruitPlayers.length > 0) {
            const familiarityDecrease = Math.min(20, newRecruitPlayers.length * 5);
            teamWithFinalRoster.playbookFamiliarity = clamp(teamWithFinalRoster.playbookFamiliarity - familiarityDecrease, 0, 100);
        }

        const teamWithPipelines = updateTeamPipelines(teamWithFinalRoster);

        // Prestige Decay (and Legacy Builder mitigation)
        // Teams naturally regress slightly towards the mean (50) to prevent permanent dominance
        if (teamWithPipelines.prestige > 60) {
            let decay = 1;
            if (teamWithPipelines.prestige > 80) decay = 2;
            if (teamWithPipelines.prestige > 90) decay = 3;

            // Apply Coach Skills (Legacy Builder)
            if (teamWithPipelines.isUserTeam && userCoachSkills && userCoachSkills.includes('legacy_builder')) {
                decay = Math.max(0, decay - 1); // Reduce decay by 1 point
            }
            
            teamWithPipelines.prestige = Math.max(60, teamWithPipelines.prestige - decay);
        }

        return resetSeasonFinances(teamWithPipelines);
    });

    return { finalTeams };
};

export const createTournament = (teams: Team[]): Tournament => {
    const sortedTeams = [...teams].sort((a, b) => (b.record.wins + b.prestige / 5) - (a.record.wins + a.prestige / 5));
    if (sortedTeams.length < 68) {
        console.error("Not enough teams to create a tournament");
        return { firstFour: [], regions: { West: [], East: [], South: [], Midwest: [] }, finalFour: [], championship: null, champion: null };
    }
    const top68 = sortedTeams.slice(0, 68);

    const firstFourTeams = top68.slice(-8);
    const firstFour: TournamentMatchup[] = [];
    for (let i = 0; i < 8; i += 2) {
        firstFour.push({ 
            id: crypto.randomUUID(),
            homeTeam: firstFourTeams[i].name, 
            awayTeam: firstFourTeams[i+1].name, 
            homeScore: 0, 
            awayScore: 0, 
            played: false, 
            homeSeed: 16, 
            awaySeed: 16,
            round: 0,
            region: 'Midwest' // Default/Placeholder for First Four
        });
    }

    const mainBracketTeams = top68.slice(0, 60);
    const regions: Record<TournamentRegionName, TournamentMatchup[][]> = { West: [], East: [], South: [], Midwest: [] };
    
    const pairings = [
        { high: 1, low: 16 }, { high: 8, low: 9 }, { high: 5, low: 12 }, { high: 4, low: 13 },
        { high: 6, low: 11 }, { high: 3, low: 14 }, { high: 7, low: 10 }, { high: 2, low: 15 }
    ];

    Object.keys(regions).forEach((regionName, regionIndex) => {
        const regionTeams = mainBracketTeams.filter((_, i) => i % 4 === regionIndex);
        
        const round64: TournamentMatchup[] = pairings.map(p => {
            const homeTeam = regionTeams[p.high - 1];
            const awayTeam = p.low === 16 ? undefined : regionTeams[p.low - 1];

            return {
                id: crypto.randomUUID(),
                homeTeam: homeTeam?.name,
                homeSeed: p.high,
                awayTeam: awayTeam?.name,
                awaySeed: p.low,
                homeScore: 0,
                awayScore: 0,
                played: false,
                round: 1,
                region: regionName as TournamentRegionName
            };
        });

        const matchup1v16 = round64.find(m => m.awaySeed === 16);
        if (matchup1v16) {
            matchup1v16.awayTeam = `FF Winner ${regionIndex + 1}`;
        }

        regions[regionName as TournamentRegionName].push(round64);
    });

    return {
        firstFour,
        regions,
        finalFour: [],
        championship: null,
        champion: null,
    };
};

export const processDraft = (
    teams: Team[], 
    season: number, 
    internationalProspects: InternationalProspect[], 
    nbaSimulation: NBASimulationResult | undefined,
    nbaTeams: Team[] = [],
    customDraftPickRules: DraftPickRule[] = [],
    draftProspects?: DraftProspect[]
): { updatedTeams: Team[], draftResults: DraftPick[], nbaSimulation: NBASimulationResult, undraftedFreeAgents: Player[], updatedNBATeams: Team[] } => {
    const simulation = nbaSimulation ?? simulateNBASeason(season);
    
    // Generate enough prospects
    const prospectCount = Math.max(70, simulation.draftOrder.length * 2 + 10);
    // Construct Draft Order
    // Round 1: 1-30 from simulation.draftOrder
    // Round 2: 31-60 repeat simulation.draftOrder (Standard default if no traded picks logic for Rd 2 yet)
    let round1Order = simulation.draftOrder;
    if (round1Order.length < 30) {
        // Fallback or fill? Assuming 30 teams usually.
    }
    const fullDraftOrder = [...round1Order, ...round1Order].slice(0, 60);
    const prospectBoard = draftProspects && draftProspects.length >= fullDraftOrder.length
        ? draftProspects.slice(0, fullDraftOrder.length)
        : buildDraftProspectBoard(teams, internationalProspects, prospectCount, season);

    const draftYear = seasonToCalendarYear(season);
    const slotAssignments: DraftSlotAssignment[] = fullDraftOrder.map((slotTeam, index) => ({
        pick: index + 1,
        round: index < 30 ? 1 : 2,
        slotTeam,
    }));
    const ownershipRules = customDraftPickRules && customDraftPickRules.length > 0 ? customDraftPickRules : NBA_DRAFT_PICK_RULES;
    const pickOwnership = computeDraftPickOwnership(slotAssignments, ownershipRules, draftYear);

    const draftResults: DraftPick[] = slotAssignments.map((slotEntry, index) => {
        const prospect = prospectBoard[index];
        if (!prospect) return null;

        const ownerEntry = pickOwnership.get(slotEntry.pick);
        const nbaTeamName = ownerEntry?.owner || slotEntry.slotTeam;

        return {
            pick: slotEntry.pick,
            round: slotEntry.round,
            player: prospect.player,
            season,
            originalTeam: prospect.originalTeam,
            nbaTeam: nbaTeamName,
            slotTeam: slotEntry.slotTeam,
            source: prospect.source,
            originDescription: prospect.originDescription,
        } as DraftPick;
    }).filter((pick): pick is DraftPick => !!pick);

    const draftedPlayerIds = new Set(
        draftResults
            .filter(d => d.source === 'NCAA')
            .map(d => d.player.id)
    );
    
    // Remove drafted players from College Teams
    const updatedTeams = teams.map(team => ({
        ...team,
        roster: team.roster.filter(p => !draftedPlayerIds.has(p.id)),
    }));

    // Update NBA Teams with Drafted Players (Rookies)
    const updatedNBATeams = nbaTeams.map(team => {
        const teamPicks = draftResults.filter(d => d.nbaTeam === team.name);
        if (teamPicks.length === 0) return team;

        const newPlayers = teamPicks.map(pick => {
            const basePlayer = pick.player;
            // Use our new Contract Scale Logic
            // Pass a string like "2025 Rnd 1 Pick 1" to match helper expectation
            // We use 2025 as the base scale year for now as requested
            const draftStatusString = `2025 Rnd ${pick.round} Pick ${pick.pick}`;
            const contract = getEstimatedRookieContract(draftStatusString) || {
                salary: 1100000,
                yearsLeft: 2,
                type: 'Guaranteed'
            }; // Fallback

            const player = pick.source === 'NCAA'
                ? adjustRookieForNBA(basePlayer)
                : basePlayer;
            
            return {
                ...(player as any),
                originDescription: player.originDescription || pick.originDescription || pick.originalTeam || 'Unknown',
                contract: {
                    ...contract,
                    signingYear: season
                },
                nbaStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 },
                year: 'Pro', // Convert to Pro
                experience: 0,
                team: team.name // Ensure team name is set on player
            } as Player;
        });

        // Add rookies to roster
        // Note: Roster limit cuts happen in processNBAWeeklyMoves, so we can overflow here temporarily
        return {
            ...team,
            roster: [...team.roster, ...newPlayers]
        };
    });

    return { 
        updatedTeams, 
        draftResults, 
        nbaSimulation: simulation,
        undraftedFreeAgents: prospectBoard
            .filter(p => !draftResults.some(d => d.player.id === p.player.id))
            .map(p => ({
                ...p.player,
                originDescription: p.originDescription || p.originalTeam
            })),
        updatedNBATeams 
    };
};

export const generateSigningAndProgressionSummaries = (teams: Team[], recruits: Recruit[], userTeamName: string): { progressionSummary: string[], signingSummary: string[] } => {
    const userTeam = teams.find(t => t.isUserTeam);
    if (!userTeam) return { progressionSummary: [], signingSummary: [] };

    const progressionSummary = userTeam.roster
        .map(p => {
            const change = p.overall - p.startOfSeasonOverall;
            if (change > 0) return `${p.name} improved by ${change} points.`;
            if (change < 0) return `${p.name} regressed by ${-change} points.`;
            return null;
        })
        .filter(Boolean) as string[];

    const signingSummary = recruits
        .filter(r => r.verbalCommitment === userTeamName)
        .map(r => `${r.stars}â˜… ${r.position} ${r.name} (#${r.overall} OVR) signed with your team.`);

    return { progressionSummary, signingSummary };
};

export const processEndOfSeasonPrestigeUpdates = (teams: Team[], tournament: Tournament | null, recruits: Recruit[], draftResults: DraftPick[], userCoachSkills?: string[]): { updatedTeams: Team[], prestigeChanges: Map<string, number> } => {
    const prestigeChanges = new Map<string, number>();

    const updatedTeams = teams.map(team => {
        let change = 0;
        change += (team.record.wins - 15) * 0.2;
        if (tournament) {
            const tournamentWins = [
                ...tournament.firstFour,
                ...Object.values(tournament.regions).flat(2),
                ...tournament.finalFour,
                ...(tournament.championship ? [tournament.championship] : [])
            ].filter(m => (m.homeTeam === team.name && m.homeScore > m.awayScore) || (m.awayTeam === team.name && m.awayScore > m.homeScore)).length;
            change += tournamentWins * 2;
            if (tournament.champion === team.name) change += 10;
        }
        const signedRecruits = recruits.filter(r => r.verbalCommitment === team.name);
        const avgStars = signedRecruits.reduce((sum, r) => sum + r.stars, 0) / (signedRecruits.length || 1);
        change += (avgStars - 3) * 0.5;
        const draftedPlayers = draftResults.filter(d => d.originalTeam === team.name).length;
        change += draftedPlayers * 1.5;

        // Apply Coach Skills (Legacy Builder)
        if (team.isUserTeam && userCoachSkills && userCoachSkills.includes('legacy_builder')) {
            if (change < 0) {
                change = change * 0.5; // Reduce penalty by 50%
            }
        }

        const roundedChange = Math.round(change);
        prestigeChanges.set(team.name, roundedChange);
        const prestige = clamp(team.prestige + roundedChange, 10, 99);
        const updatedTeam = {
            ...team,
            prestige,
        };
        const updatedWealth = recalculateProgramWealth(updatedTeam, tournament);
        return { ...updatedTeam, wealth: updatedWealth };
    });

    return { updatedTeams, prestigeChanges };
};

export const processTraining = (teams: Team[], focuses: TrainingFocuses, userCoachSkills?: string[]): { trainedTeams: Team[], summary: string[] } => {
    const summary: string[] = [];
    const userTeam = teams.find(t => t.isUserTeam);

    const trainedTeams = teams.map(team => {
        const isUser = team.isUserTeam;
        const teamFocuses = isUser ? focuses : {
            pg: pickRandom(Object.keys(createPlayer('Fr').stats) as (keyof Player['stats'])[]),
            sg_sf: pickRandom(Object.keys(createPlayer('Fr').stats) as (keyof Player['stats'])[]),
            pf_c: pickRandom(Object.keys(createPlayer('Fr').stats) as (keyof Player['stats'])[]),
        };

        const newRoster = team.roster.map(player => {
            const effectivePotential = getEffectivePotential(player);
            if (player.overall >= effectivePotential) return player;
            const gap = Math.max(0, effectivePotential - player.overall);
            const improvement = (Math.random() * (gap / 10) + (player.xFactor / 20)) * getDevelopmentRateForPlayer(player);
            if (improvement < 0.1) return player;

            let focusStat: keyof Player['stats'] | null = null;
            if (player.position === 'PG') focusStat = teamFocuses.pg;
            else if (['SG', 'SF'].includes(player.position)) focusStat = teamFocuses.sg_sf;
            else if (['PF', 'C'].includes(player.position)) focusStat = teamFocuses.pf_c;

            const oldOverall = player.overall;
            
            // Apply Coach Skills (Developer)
            let improvementChance = 0.7;
            if (isUser && userCoachSkills && userCoachSkills.includes('developer')) {
                improvementChance = 0.85; // Increased chance of focused improvement
            }

            if (focusStat && Math.random() < improvementChance) {
                player.stats[focusStat] = clamp(player.stats[focusStat] + improvement * 2, 0, 99);
            } else {
                const randomStat = pickRandom(Object.keys(player.stats) as (keyof Player['stats'])[]);
                player.stats[randomStat] = clamp(player.stats[randomStat] + improvement * 2, 0, 99);
            }
            const newOverall = calculateOverall(player.stats);
            const overallChange = Math.round(newOverall - oldOverall);
            if (isUser && overallChange > 0) {
                summary.push(`${player.name} (${player.position}) improved by ${overallChange} to ${Math.round(newOverall)} OVR.`);
            }
            player.overall = newOverall;
            player.startOfSeasonOverall = newOverall;
            return player;
        });
        return { ...team, roster: newRoster };
    });
    return { trainedTeams, summary };
};

export const fillRosterWithWalkOns = (team: Team): Team => {
    const needed = 13 - team.roster.length;
    if (needed <= 0) return team;
    const walkOns = Array.from({ length: needed }, () => {
        const p = createPlayer('Fr');
        p.overall = randomBetween(35, 50);
        p.potential = randomBetween(p.overall, 65);
        p.stats = { insideScoring: p.overall, outsideScoring: p.overall, playmaking: p.overall, perimeterDefense: p.overall, insideDefense: p.overall, rebounding: p.overall, stamina: randomBetween(55, 80) };
        return p;
    });
    return { ...team, roster: [...team.roster, ...walkOns] };
};

export const updateSponsorContracts = (teams: Team[], sponsors: { [key in SponsorName]?: SponsorData }): { updatedTeams: Team[], summary: string[] } => {
    const summary: string[] = [];
    // Identify elite target programs (top-30 prestige) for Jordan/Nike targeting
    const top20Prestige = new Set(
        [...teams]
            .sort((a, b) => b.prestige - a.prestige)
            .slice(0, 30)
            .map(t => t.name)
    );
    // Blue-blood cohort (top ~12) for "blank check" behavior
    const blueBloodSet = new Set(
        [...teams]
            .sort((a, b) => b.prestige - a.prestige)
            .slice(0, 12)
            .map(t => t.name)
    );
    // Nike portfolio target: keep a large footprint to preserve market share
    const nikeTargetSchools = Math.max(70, Math.round(teams.length * 0.22));
    const getNikeBaseline = (team: Team) => {
        const nike = createSponsorFromName('Nike', sponsors);
        return calculateSponsorRevenueSnapshot({ ...team, sponsor: nike }).total;
    };
    const updatedTeams = teams.map(team => {
        const newTeam = { ...team, sponsorContractYearsRemaining: team.sponsorContractYearsRemaining - 1 };
        // newTeam.sponsorContractYearsRemaining -= 1; // This was incorrect

        if (newTeam.sponsorContractYearsRemaining <= 0) {
            const offers: SponsorOffer[] = [];
            (Object.keys(sponsors) as SponsorName[]).forEach(name => {
                const sponsorData = sponsors[name];
                if (!sponsorData) return;

                // Soft capacity for Jordan to keep it rare
                const canOffer = name !== 'Jordan' || sponsorData.sponsoredTeamCount < 20;
                if (!canOffer) return;

                const tempSponsor = createSponsorFromName(name, sponsors);
                const baseValue = calculateSponsorRevenueSnapshot({ ...team, sponsor: tempSponsor }).total;
                const nikeBaseline = getNikeBaseline(team);

                // Brand strategy: underdogs (low market share) are aggressive to win deals;
                // elites are selective and won't always offer to low prestige teams.
                const share = Math.max(0.001, sponsorData.marketShare || 0.001);
                const shareNorm = Math.min(1, share / 0.40); // 0.40 ~ top brand baseline
                const tier = sponsorData.tier || 'Low';
                const teamPrestige = team.prestige;
                const tierTargets: Record<SponsorTier, number> = { Elite: 88, High: 82, Mid: 72, Low: 60 };
                const tierFitWeights: Record<SponsorTier, number> = { Elite: 0.38, High: 0.41, Mid: 0.45, Low: 0.58 };
                const targetByTier = tierTargets[tier];
                const prestigeFitScore = clamp(1 - Math.abs(teamPrestige - targetByTier) / 40, 0, 1);
                // Aggression grows as market share drops; Nike remains aggressive despite large share
                let aggression = clamp(1 + (1 - shareNorm) * 0.6, 0.9, 1.6);
                if (name === 'Nike') {
                    // Nike invests to maintain market share
                    aggression = Math.max(aggression, teamPrestige >= 80 ? 1.25 : 1.05);
                }

                // Hard gating: Jordan only courts elite prestige; Nike avoids very low prestige
                if (name === 'Jordan') {
                    if (!top20Prestige.has(team.name) && teamPrestige < 88) return;
                }
                if (tier === 'Elite' && name !== 'Jordan') {
                    if (name === 'Nike') {
                        // Nike should actively consider offers down to 48 prestige
                        const prestigeGate = 48;
                        if (teamPrestige < prestigeGate) return;
                    } else {
                        if (teamPrestige < 65) return;
                    }
                } else if (tier === 'High') {
                    const prestigeGate = name === 'Nike' ? 65 : 72;
                    if (teamPrestige < prestigeGate) return;
                }

                // Offer chance combines fit + aggression, with biases by tier
                let offerChance = 0.08 + prestigeFitScore * (tierFitWeights[tier]) + (1 - shareNorm) * 0.30;
                if (tier === 'Low') offerChance += 0.10; // low-tier aggressively canvass
                if (tier === 'High') offerChance += 0.05;
                // Nike should actively chase top talent similar to Jordan
                if (name === 'Nike') {
                    const currentCount = sponsorData.sponsoredTeamCount || 0;
                    const shortage = Math.max(0, nikeTargetSchools - currentCount) / nikeTargetSchools; // 0..1
                    offerChance += 0.25 * shortage; // more shortage, more offers
                    if (top20Prestige.has(team.name) || teamPrestige >= 88) {
                        offerChance = Math.max(offerChance, 0.85);
                    } else if (teamPrestige >= 80) {
                        offerChance = Math.max(offerChance, 0.60);
                    } else if (shortage > 0.5 && teamPrestige >= 60) {
                        // When behind, Nike casts a wider net in the 60-79 band
                        offerChance = Math.max(offerChance, 0.55);
                    } else if (teamPrestige >= 48) {
                        // Always at least try for 48-59 band, scaled by shortage
                        const baseMin = shortage > 0.4 ? 0.45 : 0.30;
                        offerChance = Math.max(offerChance, baseMin);
                    }
                }
                // Any elite brand rolls out red carpet for blue bloods
                const isBlueBlood = blueBloodSet.has(team.name) || teamPrestige >= 92;
                if (tier === 'Elite' && isBlueBlood) {
                    offerChance = Math.max(offerChance, 0.98);
                }
                offerChance = clamp(offerChance, 0.05, 0.98);

                // Incumbent Bonus: If this is the current sponsor, they are highly likely to offer if the team is successful
                const isIncumbent = team.sponsor.name === name;
                if (isIncumbent) {
                    const successMetric = (team.record.wins / 31) + (team.prestige / 200); // Simple success metric
                    if (successMetric > 0.6) offerChance += 0.4; // Strong boost for winning teams
                    offerChance = Math.min(1.0, offerChance);
                }

                if (Math.random() > offerChance) return; // brand passes

                // Valuation: start from base value, then apply aggression multipliers
                // Underdogs may overpay to grow; elites rarely overpay.
                const baseJitter = 0.92 + Math.random() * 0.22; // 0.92 - 1.14
                let multiplier = baseJitter * aggression;
                // Sweeteners: pay extra for high-prestige targets, or for rebuilding low-prestige fits
                if (teamPrestige >= 88 && share < 0.20) multiplier *= 1.15; // chasing a blue blood to grow share
                if (teamPrestige <= 68 && (tier === 'Low' || share < 0.12)) multiplier *= 1.25; // help small programs switch brands
                if (tier === 'Elite' && teamPrestige < 70) multiplier *= 0.95;
                if (tier === 'High' && teamPrestige < 70) multiplier *= 1.05;

                // Success Multiplier for Incumbents: Reward consistent success regardless of prestige
                if (isIncumbent) {
                    // Calculate a success factor based on wins and tournament performance (heuristic)
                    const winPct = team.record.wins / Math.max(1, team.record.wins + team.record.losses);
                    let successBonus = 0;
                    if (winPct > 0.75) successBonus += 0.15; // +15% for great regular season
                    else if (winPct > 0.60) successBonus += 0.08;

                    // Check history for recent deep runs (last season) - heuristic since we don't have full history object here easily
                    // We can use prestige as a proxy for sustained success, or just rely on the win record of the *just completed* season
                    // which is what 'team.record' represents at this point in the offseason.
                    
                    multiplier *= (1 + successBonus);
                    
                    // "Invested in your success": If the team is overperforming their prestige, the sponsor pays a premium to keep them
                    const expectedWins = team.prestige * 0.3;
                    if (team.record.wins > expectedWins + 5) {
                        multiplier *= 1.12; // Another 12% boost for overperforming
                    }
                }

                let yearlyValue = Math.round(baseValue * multiplier);

                // Ensure low-tier can outbid Nike baseline for lower-prestige programs
                if (tier === 'Low') {
                    const floor = teamPrestige <= 68 ? 1.18 : 1.08;
                    const minVsNike = nikeBaseline * (floor + Math.random() * 0.22); // up to ~1.40x for low prestige
                    yearlyValue = Math.max(yearlyValue, Math.round(minVsNike));
                }
                // Mid-tier sometimes beat Nike as well for mid/low prestige
                if (tier === 'Mid' && teamPrestige <= 72) {
                    const minVsNike = nikeBaseline * (1.05 + Math.random() * 0.18);
                    yearlyValue = Math.max(yearlyValue, Math.round(minVsNike));
                }
                // Elite brands concentrate payout on elite programs
                if (tier === 'Elite' && (top20Prestige.has(team.name) || teamPrestige >= 88)) {
                    // Jordan or Nike: make a strong, competitive offer for elite programs
                    const eliteFloor = name === 'Nike' ? (1.25 + Math.random() * 0.25) : (1.15 + Math.random() * 0.20);
                    const minVsNike = nikeBaseline * eliteFloor;
                    yearlyValue = Math.max(yearlyValue, Math.round(minVsNike));
                }
                // Blank-check behavior for true blue bloods: elite brands go even higher
                if (tier === 'Elite' && (blueBloodSet.has(team.name) || teamPrestige >= 92)) {
                    const blankFloor = name === 'Nike' ? (1.60 + Math.random() * 0.30) : (1.45 + Math.random() * 0.30); // ~1.60-1.90 vs ~1.45-1.75
                    yearlyValue = Math.max(yearlyValue, Math.round(nikeBaseline * blankFloor));
                }
                // Nike also posts strong offers for high prestige just below elite
                if (name === 'Nike' && teamPrestige >= 80 && teamPrestige < 88) {
                    const highFloor = 1.15 + Math.random() * 0.20; // 1.15 - 1.35x
                    yearlyValue = Math.max(yearlyValue, Math.round(nikeBaseline * highFloor));
                }
                if (tier === 'High' && teamPrestige >= 80) {
                    const highFloor = name === 'Nike' ? (1.20 + Math.random() * 0.15) : (1.12 + Math.random() * 0.12);
                    const minVsNike = nikeBaseline * highFloor;
                    yearlyValue = Math.max(yearlyValue, Math.round(minVsNike));
                }
                // If Nike is behind its target school count, ensure competitive floors for mid-tier programs too
                if (name === 'Nike') {
                    const currentCount = sponsorData.sponsoredTeamCount || 0;
                    const shortage = Math.max(0, nikeTargetSchools - currentCount) / nikeTargetSchools; // 0..1
                    if (shortage > 0.3) {
                        if (teamPrestige >= 60 && teamPrestige < 80) {
                            // Defensive floor to beat underdog floors frequently when behind
                            const midFloor = 1.20 + (0.10 * shortage) + Math.random() * 0.10; // ~1.20 - 1.40+
                            yearlyValue = Math.max(yearlyValue, Math.round(nikeBaseline * midFloor));
                        } else if (teamPrestige >= 48 && teamPrestige < 60 && shortage > 0.5) {
                            const lowFloor = 1.12 + Math.random() * 0.14; // ~1.12 - 1.26x
                            yearlyValue = Math.max(yearlyValue, Math.round(nikeBaseline * lowFloor));
                        }
                    }
                }
                let contractLength = randomBetween(3, 5);
                // Nike prefers longer, secure deals to maintain portfolio
                if (name === 'Nike') {
                    const currentCount = sponsorData.sponsoredTeamCount || 0;
                    const shortage = Math.max(0, nikeTargetSchools - currentCount) / nikeTargetSchools; // 0..1
                    if (shortage > 0.5) contractLength = randomBetween(5, 7);
                    else contractLength = randomBetween(4, 6);
                }
                // For blue bloods, elite brands push longer terms
                if (tier === 'Elite' && (blueBloodSet.has(team.name) || teamPrestige >= 92)) {
                    contractLength = Math.max(contractLength, randomBetween(6, 8));
                }

                offers.push({ 
                    sponsorName: name, 
                    years: contractLength, 
                    annualPayout: yearlyValue,
                    tier: tier,
                    signingBonus: 0,
                    type: 'Apparel' 
                });
            });
            newTeam.sponsorOffers = offers;
            // User: prompt via UI; do not auto-accept or reset years here
            if (newTeam.isUserTeam) {
                if (offers.length > 0) {
                    summary.push("Your sponsorship deal has expired! You have new offers available.");
                }
            } else {
                // CPU: choose most financially beneficial path
                const currentValue = calculateSponsorRevenueSnapshot(newTeam).total;
                let best: SponsorOffer | null = null;
                let bestTotal = 0;
                for (const o of offers) {
                    const total = o.annualPayout * o.years;
                    if (!best || total > bestTotal || (total === bestTotal && o.annualPayout > (best?.annualPayout || 0))) {
                        best = o;
                        bestTotal = total;
                    }
                }
                if (best && (best.annualPayout >= currentValue || bestTotal >= currentValue * 3)) {
                    const accepted = createSponsorFromName(best.sponsorName, sponsors);
                    newTeam.sponsor = accepted;
                    newTeam.sponsorContractYearsRemaining = best.years;
                    newTeam.sponsorContractLength = best.years;
                    newTeam.sponsorOffers = [];
                    const recalced = calculateSponsorRevenueSnapshot({ ...newTeam, sponsor: accepted });
                    newTeam.sponsorRevenue = { ...recalced, total: best.annualPayout };
                } else {
                    // Renew with current sponsor short term
                    const jitter = 0.98 + Math.random() * 0.06; // ~ -2% to +4%
                    newTeam.sponsorContractYearsRemaining = 1;
                    newTeam.sponsorContractLength = 1;
                    newTeam.sponsorOffers = [];
                    newTeam.sponsorRevenue = { ...newTeam.sponsorRevenue, total: Math.round(currentValue * jitter) };
                }
            }
        }
        return newTeam;
    });
    return { updatedTeams, summary };
};

export const calculateCoachSalary = (team: Team, coach: Coach, isRenewal: boolean, performance?: number): number => {
    const base = 500000;
    const prestigeBonus = team.prestige * 15000;
    const repBonus = coach.reputation * 10000;
    const renewalBonus = isRenewal ? 1.1 : 1.0;
    const performanceBonus = performance ? Math.max(0.8, Math.min(1.5, performance)) : 1.0;

    return Math.round((base + prestigeBonus + repBonus) * renewalBonus * performanceBonus);
};

export const generateContractOptions = (team: Team, coach: Coach, isRenewal: boolean, performance?: number, enforcedLength?: number, enforcedSalary?: number): { length: number, options: ContractGoal[], salary: number } => {
    const length = enforcedLength ?? randomBetween(3, 5);
    const salary = enforcedSalary ?? calculateCoachSalary(team, coach, isRenewal, performance);
    const options: ContractGoal[] = [];

    const winPercentage = Math.min(0.85, (team.prestige / 100) * 0.7 + 0.2);
    const winsTarget = Math.floor(31 * winPercentage * length * (isRenewal ? 1.05 : 1.0));
    const totalGames = 31 * length;
    const winPercent = ((winsTarget / totalGames) * 100).toFixed(1);
    options.push({ type: 'wins', target: winsTarget, duration: length, description: `Win ${winsTarget} games\n(${winPercent}%) over ${length} years.` });

    const tournamentChance = Math.min(0.9, (team.prestige / 100) * 0.8 + 0.1);
    const tournamentTarget = Math.max(1, Math.ceil(tournamentChance * length * (isRenewal ? 1.05 : 1.0)));
    options.push({ type: 'tournament', target: tournamentTarget, duration: length, description: `Make the tournament ${tournamentTarget} time${tournamentTarget > 1 ? 's' : ''}\nin ${length} years.` });

    // Use initialProjectedRevenue for a more accurate base, or a more aggressive fallback
    const baseProjectedRevenue = team.initialProjectedRevenue?.totalRevenue || ((team.prestige * 150000) + 2000000);
    const baseProjectedExpenses = team.initialProjectedRevenue?.operationalExpenses || (1000000 + (team.prestige * 80000) + (salary * 1.5));
    
    const projectedNetIncomePerSeason = baseProjectedRevenue - baseProjectedExpenses;

    // Target a very high percentage of the projected net income.
    const targetPercentage = 0.97; // Aim for 97% of projected net income
    const absoluteMinimumGoalPerSeason = 500000; // Absolute minimum for any team
    const prestigeMinimumPerSeason = team.prestige * 50000; // Prestige-based minimum per season

    let netIncomeTargetPerSeason = projectedNetIncomePerSeason * targetPercentage;

    // Ensure the goal is at least the prestige-based minimum, or the absolute minimum
    netIncomeTargetPerSeason = Math.max(netIncomeTargetPerSeason, prestigeMinimumPerSeason, absoluteMinimumGoalPerSeason);

    const netIncomeTarget = Math.floor(netIncomeTargetPerSeason * length);
    options.push({ type: 'netIncome', target: netIncomeTarget, duration: length, description: `Achieve ${formatCurrency(netIncomeTarget)}\nin total net income over ${length} years.` });

    return { length, options, salary };
};

export const generateJobOffers = (currentTeam: Team, coach: Coach, allTeams: Team[], goalMet: boolean): JobOffer[] => {
    const offers: JobOffer[] = [];
    const availableTeams = allTeams.filter(t => !t.isUserTeam);
    const performanceBoost = goalMet ? 1.3 : 1.0;
    const reputationPremium = Math.max(0, coach.reputation - 70) * 800;

    if (goalMet) {
        const championshipBonus = 60000;
        offers.push({
            teamName: currentTeam.name,
            prestige: currentTeam.prestige,
            salary: Math.round((170000 + currentTeam.prestige * 11000 + championshipBonus + reputationPremium) * performanceBoost),
            length: randomBetween(4, 7),
        });
    }

    // Guarantee a few high-prestige suitors when the coach wins it all
    if (goalMet) {
        const eliteTargets = availableTeams
            .filter(t => t.prestige >= 80 && t.name !== currentTeam.name)
            .sort((a, b) => b.prestige - a.prestige)
            .slice(0, 4);
        eliteTargets.forEach(t => {
            if (offers.some(o => o.teamName === t.name)) return;
            offers.push({
                teamName: t.name,
                prestige: t.prestige,
                salary: Math.round((190000 + t.prestige * 13000 + 50000 + reputationPremium) * performanceBoost),
                length: randomBetween(5, 7),
            });
        });
    }

    const shuffled = availableTeams.sort(() => Math.random() - 0.5);
    const maxOffers = 12;
    for (const team of shuffled) {
        if (offers.length >= maxOffers) break;
        const prestigeDiff = coach.reputation - team.prestige;
        const baseChance = 0.25 + (prestigeDiff / 60) + (goalMet ? 0.1 : 0);
        const chance = clamp(baseChance, 0.15, goalMet ? 0.95 : 0.85);
        if (Math.random() < chance) {
            const salary = Math.round((150000 + team.prestige * 12000 + (goalMet ? 35000 : 0) + reputationPremium) * performanceBoost);
            const length = team.prestige >= 80 ? randomBetween(4, 7) : randomBetween(4, 6);
            offers.push({
                teamName: team.name,
                prestige: team.prestige,
                salary,
                length,
            });
        }
    }

    if (offers.length < 3) {
        for (const team of shuffled) {
            if (offers.length >= 3) break;
            if (offers.some(o => o.teamName === team.name)) continue;
            const salary = Math.round((130000 + team.prestige * 10500 + reputationPremium) * performanceBoost);
            const length = randomBetween(goalMet ? 4 : 3, goalMet ? 6 : 5);
            offers.push({
                teamName: team.name,
                prestige: team.prestige,
                salary,
                length,
            });
        }
    }

    return offers;
};

export const updateCoachReputation = (coach: Coach, seasonRecord: UserSeasonRecord, contract: CoachContract): number => {
    let change = 0;
    const expectedWins = contract.initialPrestige * 0.31;
    change += (seasonRecord.wins - expectedWins) * 0.5;
    if (seasonRecord.tournamentResult !== 'Did not qualify') change += 2;
    if (seasonRecord.tournamentResult.includes('Sweet 16')) change += 2;
    if (seasonRecord.tournamentResult.includes('Final Four')) change += 3;
    if (seasonRecord.tournamentResult.includes('Champion')) change += 5;
    
    return clamp(coach.reputation + Math.round(change), 10, 99);
};

const createStaff = (role: StaffRole): Staff => {
    const grade = pickRandom(['A', 'B', 'B', 'C', 'C', 'C', 'D'] as StaffGrade[]);
    const gradeMultipliers: Record<StaffGrade, number> = { 'A': 2.2, 'B': 1.7, 'C': 1.2, 'D': 0.9 };
    const salary = Math.round((60000 + randomBetween(0, 30000)) * gradeMultipliers[grade]);
    const contractLength = randomBetween(2, 4);
    
    const descriptions: Record<StaffRole, Record<StaffGrade, string>> = {
        'Assistant Coach': {
            'A': 'A brilliant tactician known for in-game adjustments.',
            'B': 'Excellent at developing players and building relationships.',
            'C': 'A solid, reliable coach who knows the fundamentals.',
            'D': 'An up-and-comer with potential but lacks experience.',
        },
        'Trainer': {
            'A': 'A top-tier trainer who maximizes player potential.',
            'B': 'Great at preventing injuries and improving conditioning.',
            'C': 'Standard trainer who keeps the team healthy.',
            'D': 'Focuses on basic conditioning and injury prevention.',
        },
        'Scout': {
            'A': 'Has an incredible eye for talent and a vast network.',
            'B': 'A hard worker who consistently finds hidden gems.',
            'C': 'Good at evaluating talent within a specific region.',
            'D': 'A young scout eager to make a name for himself.',
        },
        'Offensive Coordinator': {
            'A': 'An offensive mastermind.',
            'B': 'Solid offensive strategist.',
            'C': 'Decent play caller.',
            'D': 'Inexperienced play caller.',
        },
        'Defensive Coordinator': {
            'A': 'A defensive guru.',
            'B': 'Solid defensive strategist.',
            'C': 'Decent defensive schemes.',
            'D': 'Inexperienced defensive coach.',
        },
        'Recruiting Coordinator': {
            'A': 'A recruiting legend.',
            'B': 'Great recruiter.',
            'C': 'Solid recruiter.',
            'D': 'Average recruiter.',
        },
    };

    const specialties: Record<StaffRole, StaffSpecialty[]> = {
        'Assistant Coach': ['Offense: Motion', 'Offense: Run & Gun', 'Offense: Princeton', 'Defense: Pack Line', 'Defense: Full Court Press', 'Defense: 2-3 Zone'],
        'Trainer': ['Training: Strength', 'Training: Conditioning', 'Training: Recovery'],
        'Scout': ['Scouting: High School', 'Scouting: International', 'Scouting: Transfer Portal'],
        'Offensive Coordinator': ['Offense: Motion', 'Offense: Run & Gun', 'Offense: Princeton'],
        'Defensive Coordinator': ['Defense: Pack Line', 'Defense: Full Court Press', 'Defense: 2-3 Zone'],
        'Recruiting Coordinator': ['Recruiting: Pipelines', 'Recruiting: Closers', 'Recruiting: Talent ID'],
    };

    return {
        id: crypto.randomUUID(),
        name: `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`,
        role,
        grade,
        salary,
        description: descriptions[role][grade],
        contractLength,
        yearsRemaining: contractLength,
        specialty: pickRandom(specialties[role]),
    };
};

export const generateStaffCandidates = (): { assistants: Staff[], trainers: Staff[], scouts: Staff[] } => {
    return {
        assistants: Array.from({ length: 5 }, () => createStaff('Assistant Coach')),
        trainers: Array.from({ length: 5 }, () => createStaff('Trainer')),
        scouts: Array.from({ length: 5 }, () => createStaff('Scout')),
    };
};

export const generateFreeAgentStaff = (): { assistants: Staff[], trainers: Staff[], scouts: Staff[] } => {
    return {
        assistants: Array.from({ length: 5 }, () => createStaff('Assistant Coach')),
        trainers: Array.from({ length: 5 }, () => createStaff('Trainer')),
        scouts: Array.from({ length: 5 }, () => createStaff('Scout')),
    };
};

// --- NBA Mode Logic ---

const ROOKIE_SCALE_2025: number[] = [
    13825920, 12370320, 11108880, 10015680, 9069840,
    8237640, 7520040, 6889200, 6332520, 6016080,
    5715120, 5429520, 5157960, 4900320, 4655040,
    4422360, 4201080, 3991320, 3811560, 3658800,
    3512520, 3372240, 3237480, 3108120, 2983320,
    2884560, 2801280, 2783880, 2763960, 2743800
];

export const getEstimatedRookieContract = (draftStatus: string): NBAContractProfile | null => {
    if (!draftStatus) return null;

    // Helper: Determine if pick is Round 1 or Round 2
    let pick = 0;
    let isRound1 = false;
    let isRound2 = false;

    // Parse "2025 Rnd 1 Pick X" or similar
    if (draftStatus.includes('Rnd 1')) {
        isRound1 = true;
        const match = draftStatus.match(/Pick (\d+)/);
        if (match) pick = parseInt(match[1], 10);
    } else if (draftStatus.includes('Rnd 2')) {
        isRound2 = true;
        const match = draftStatus.match(/Pick (\d+)/);
        if (match) pick = parseInt(match[1], 10);
    }

    if (isRound1 && pick > 0 && pick <= 30) {
        const baseSalary = ROOKIE_SCALE_2025[pick - 1];
        // 4 Years: 2 Guaranteed + 2 Team Options
        return {
            salary: baseSalary,
            yearsLeft: 4,
            yearlySalaries: [
                baseSalary,
                Math.round(baseSalary * 1.05),
                Math.round(baseSalary * 1.10), // Team Option
                Math.round(baseSalary * 1.25)  // Team Option
            ]
        };
    } else if (isRound2) {
        // Round 2: 2 Years (1 Guaranteed + 1 Team Option), Min Salary
        const minSalary = NBA_MINIMUM_SALARY || 1100000;
        return {
            salary: minSalary,
            yearsLeft: 2,
            // type: 'Guaranteed', // First year guaranteed
            yearlySalaries: [
                minSalary,
                minSalary // Team Option technically, but handled as contract logic later
            ]
        };
    }
    
    // Fallback/Legacy logic if just a generic 2025 pick string
    if (draftStatus.includes('2025') && draftStatus.includes('Pick')) {
        // ... (Similar logic or just return null if we want to be strict)
    }

    return null; 
};

export const initializeNBATeams = (): Team[] => {
    // Flatten all real players into a single array for easier lookup by NBA team
    const allRealPlayers = Object.values(REAL_NBA_PLAYERS).flat();

    const normalizeTeamName = (name: string): string => {
        if (name === 'Los Angeles Clippers') return 'LA Clippers';
        if (name === 'Philadelphia Sixers') return 'Philadelphia 76ers';
        return name;
    };

    const normalizePlayerName = (name: string): string => {
        return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").replace(/,/g, "").replace(/'/g, "").replace(/Ñ‘/g, "e").replace(/Ðµ/g, "e").toLowerCase().trim();
    };

    const normalizePlayerKey = (name: string): string => {
        return (name || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    };

    // Create a normalized map of salaries for robust lookup
    const normalizedSalaries: Record<string, NBAContractProfile> = {};
    Object.entries(NBA_SALARIES).forEach(([name, profile]) => {
        normalizedSalaries[normalizePlayerKey(name)] = profile;
    });

    // Create a normalized map of ratings for robust lookup
    const normalizedRatings: Record<string, number> = {};
    Object.entries(REAL_NBA_RATINGS).forEach(([name, rating]) => {
        normalizedRatings[normalizePlayerKey(name)] = rating;
    });



    return NBA_TEAMS.map(info => {
        // Filter players for this NBA team
        const teamRealPlayers = allRealPlayers.filter(p => normalizeTeamName(p.team) === info.name);
        let roster: Player[] = [];
        const usedPlayerNames = new Set<string>();

        // Add real players
        teamRealPlayers.forEach(realPlayer => {
            if (usedPlayerNames.has(realPlayer.name)) return; // Avoid duplicates
            usedPlayerNames.add(realPlayer.name);

            // Parse height "6-8" -> inches
            const [feet, inches] = realPlayer.height.split('-').map(Number);
            const heightInches = (feet * 12) + (inches || 0);

            // Normalize position
            let position: RosterPositions = 'PG'; // Default
            if (['PG', 'SG', 'SF', 'PF', 'C'].includes(realPlayer.position)) {
                position = realPlayer.position as RosterPositions;
            } else if (realPlayer.position === 'G') position = 'SG';
            else if (realPlayer.position === 'F') position = 'SF';
            else if (realPlayer.position === 'GF') position = 'SG';
            else if (realPlayer.position === 'FC' || realPlayer.position === 'C-F') position = 'PF';
            
            // Robust Salary Lookup
            const playerName = (realPlayer.name || '').trim();
            const normalizedName = normalizePlayerKey(playerName);
            let contractProfile = getNBASalaryProfileForName(playerName) || normalizedSalaries[normalizedName];
            
            // Fallback for missing 2025 Rookies (like Egor Demin)
            if (!contractProfile && realPlayer.draftStatus && realPlayer.draftStatus.includes('2025')) {
                contractProfile = getEstimatedRookieContract(realPlayer.draftStatus) || undefined;
            }
            
            const fallbackSalary = randomBetween(NBA_MINIMUM_SALARY || 1100000, 5000000);
            let salaryValue = contractProfile ? contractProfile.salary : fallbackSalary;
            let contractYearsLeft = contractProfile ? contractProfile.yearsLeft : randomBetween(1, Math.max(1, 5 - realPlayer.yos));
            let contractYearlySalaries: number[] | undefined = contractProfile?.yearlySalaries;

            if (contractProfile?.yearlySalaries?.length) {
                const salaryOffset = Math.min(INITIAL_NBA_SALARY_YEAR_OFFSET, contractProfile.yearlySalaries.length);
                const upcomingSalaries = contractProfile.yearlySalaries.slice(salaryOffset);
                if (upcomingSalaries.length > 0) {
                    salaryValue = upcomingSalaries[0];
                    contractYearsLeft = Math.max(1, upcomingSalaries.length);
                    contractYearlySalaries = upcomingSalaries;
                } else {
                    salaryValue = contractProfile.yearlySalaries[contractProfile.yearlySalaries.length - 1] || contractProfile.salary;
                    contractYearsLeft = 1;
                    contractYearlySalaries = [salaryValue];
                }
            } else if (!contractProfile) {
                salaryValue = fallbackSalary;
            }

            const player: Player = {
                id: `nba-${realPlayer.name.replace(/\s+/g, '-').toLowerCase()}`,
                name: realPlayer.name,
                position,
                secondaryPosition: realPlayer.position === 'GF' ? 'SF' : realPlayer.position === 'FC' ? 'C' : undefined,
                height: heightInches,
                year: 'Pro', // NBA players are pro
                overall: clamp(realPlayer.age ? 95 - (realPlayer.age - 25) * 0.75 : 75, 60, 99), // Estimate overall based on age
                potential: clamp(realPlayer.age ? 95 - (realPlayer.age - 20) * 0.5 : 85, 70, 99), // Estimate potential
                stats: { // Placeholder stats, would need more sophisticated logic for real stats
                    insideScoring: randomBetween(60, 90),
                    outsideScoring: randomBetween(60, 90),
                    playmaking: randomBetween(60, 90),
                    perimeterDefense: randomBetween(60, 90),
                    insideDefense: randomBetween(60, 90),
                    rebounding: randomBetween(60, 90),
                    stamina: randomBetween(80, 99),
                },
                homeState: 'USA', // Real data doesn't have home state
                originDescription: realPlayer.preDraftTeam, // Set Origin correctly
                starterPosition: null,
                startOfSeasonOverall: 0, // Will be set later
                xFactor: randomBetween(1, 10),
                seasonStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 },
                isTargeted: false,
                naturalProgressAccumulator: 0,
                minutesLocked: false,
                role: 'Role Player',
                streak: { type: 'Neutral', duration: 0, impact: {} },
                morale: 80,
                age: realPlayer.age,
                experience: realPlayer.yos,
                contract: {
                    salary: salaryValue,
                    yearsLeft: contractYearsLeft,
                    type: 'Guaranteed',
                    yearlySalaries: contractYearlySalaries
                },
                nbaStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 },
                draftYear: parseInt(realPlayer.draftStatus.split(' ')[0]) || undefined,
            };
            player.overall = calculateOverall(player.stats); // Initial calculation
            
            // Override overall with REAL_NBA_RATINGS if available
            const realRating = getRealNbaRatingForName(playerName) || normalizedRatings[normalizedName];
            if (realRating) {
                player.overall = realRating;
                // Adjust stats slightly to match new overall, while keeping proportions
                const currentAvg = calculateOverall(player.stats);
                if (currentAvg !== player.overall) {
                    const diff = player.overall - currentAvg;
                    const factor = 1 + (diff / Math.max(1, currentAvg));
                    (Object.keys(player.stats) as (keyof Player['stats'])[]).forEach(statKey => {
                        player.stats[statKey] = clamp(Math.round(player.stats[statKey] * factor), 40, 99);
                    });
                    // Recalculate to ensure new stats result in the exact overall, or very close
                    player.overall = calculateOverall(player.stats);
                }
            }
            player.startOfSeasonOverall = player.overall;
            roster.push(ensurePlayerNilProfile(player));
        });

        // Pad roster to 15 players with generated players if needed
        while (roster.length < 15) {
            const pos = pickRandom(['PG', 'SG', 'SF', 'PF', 'C'] as RosterPositions[]);
            const generatedPlayer = createPlayer('Pro', pos);
            generatedPlayer.age = randomBetween(19, 25);
            generatedPlayer.overall = randomBetween(65, 75);
            generatedPlayer.potential = randomBetween(generatedPlayer.overall + 5, 80);
            generatedPlayer.contract = {
                salary: randomBetween(NBA_MINIMUM_SALARY || 1100000, 2000000),
                yearsLeft: randomBetween(1, 3),
                type: 'Guaranteed'
            };
            roster.push(ensurePlayerNilProfile(generatedPlayer));
        }

        // Trim roster if too large (shouldn't happen with real data, but as a safeguard)
        if (roster.length > 15) {
            roster.sort((a, b) => a.overall - b.overall); // Remove lowest overall players
            roster = roster.slice(roster.length - 15);
        }

        // Set starter positions using autoSetStarters
        roster = autoSetStarters(roster);

        const team: Team = {
            name: info.name,
            conference: info.conference,
            division: 'Central', // Placeholder, would need real divisions
            league: 'NBA',
            state: 'USA', // Default
            prestige: 80, // Placeholder - could be dynamic based on real roster quality
            recruitingPrestige: 80,
            pipelineStates: [],
            playbookFamiliarity: 0,
            roster,
            staff: generateStaffCandidates(), // Reuse staff gen for now
            record: { wins: 0, losses: 0 },
            sponsor: { name: 'Nike', tier: 'Elite', type: 'Apparel' }, // Default sponsor
            sponsorRevenue: { jersey: 0, shoe: 0, merch: 0, total: 0 },
            sponsorContractYearsRemaining: 5,
            sponsorContractLength: 5,
            sponsorOffers: [],
            fanInterest: 80,
            prices: { ticketPrice: 100, jerseyPrice: 120, merchandisePrice: 40, concessionFoodPrice: 15, concessionDrinkPrice: 10, parkingPrice: 50 },
            finances: {
                baseRevenue: 0, gateRevenue: 0, merchandiseRevenue: 0, concessionsRevenue: 0, parkingRevenue: 0, donationRevenue: 0, endowmentSupport: 0, tournamentShare: 0, sponsorPayout: 0, totalRevenue: 0,
                operationalExpenses: 0, firedStaffSalaries: 0, facilitiesExpenses: 0, travelExpenses: 0, recruitingExpenses: 0, marketingExpenses: 0, administrativeExpenses: 0, staffPayrollExpenses: 0,
                broadcastRevenue: 0, licensingRevenue: 0, loanPayments: 0, nilExpenses: 0, ledger: [], netIncome: 0, cashOnHand: 0
            },
            wealth: { endowmentScore: 0, donationLevel: 0, boosterPool: 0, donorMomentum: 0 },
            headCoach: createHeadCoachProfile(info.name, 80),
            salaryCapSpace: NBA_SALARY_CAP_2025 - roster.reduce((sum, p) => sum + (p.contract?.salary || 0), 0),
            luxuryTaxBill: 0,
            concessions: { tier: 'Standard', alcoholPolicy: true, items: [] },
            merchandising: { inventoryStrategy: 'Aggressive', jerseySales: {}, items: [] },
            parking: { generalPrice: 10, vipPrice: 25, tailgateCulture: 50 },
            nbaAffiliate: null,
        };
        return team;
    });
};

export const generateNBASchedule = (teams: { name: string }[]): GameResult[][] => {
    // Helper to find team info
    const getTeamInfo = (name: string) => NBA_TEAMS.find(t => t.name === name);

    // 1. Organize teams by Conference and Division
    const confTeams: Record<string, string[]> = { East: [], West: [] };
    const divTeams: Record<string, string[]> = {};
    const teamDivision: Record<string, string> = {};

    teams.forEach(t => {
        const info = getTeamInfo(t.name);
        if (info) {
            confTeams[info.conference].push(t.name);
            if (!divTeams[info.division]) divTeams[info.division] = [];
            divTeams[info.division].push(t.name);
            teamDivision[t.name] = info.division;
        }
    });

    const matchupPool: { home: string, away: string }[] = [];

    // Add series of games (balanced home/away)
    const addSeries = (t1: string, t2: string, count: number) => {
        let homeGames = Math.floor(count / 2);
        let roadGames = count - homeGames;
        // If odd number, randomize who gets extra home game
        if (homeGames !== roadGames && Math.random() > 0.5) {
             [homeGames, roadGames] = [roadGames, homeGames];
        }
        
        for (let i = 0; i < homeGames; i++) matchupPool.push({ home: t1, away: t2 });
        for (let i = 0; i < roadGames; i++) matchupPool.push({ home: t2, away: t1 });
    };

    const getPairId = (t1: string, t2: string) => [t1, t2].sort().join('::');

    // 2. Generate Matchups
    
    // A. Division Games (4 games vs 4 opponents = 16 games)
    for (const div in divTeams) {
        const dt = divTeams[div];
        for (let i = 0; i < dt.length; i++) {
            for (let j = i + 1; j < dt.length; j++) {
                addSeries(dt[i], dt[j], 4);
            }
        }
    }

    // B. Inter-Conference Games (2 games vs 15 opponents = 30 games)
    confTeams['East'].forEach(eTeam => {
        confTeams['West'].forEach(wTeam => {
            addSeries(eTeam, wTeam, 2);
        });
    });

    // C. Intra-Conference Non-Division (36 games split into 6x4 and 4x3)
    ['East', 'West'].forEach(conf => {
        const cTeams = confTeams[conf];
        // Identify non-div pairs
        const nonDivPairs: {t1: string, t2: string}[] = [];
        
        for (let i = 0; i < cTeams.length; i++) {
            for (let j = i + 1; j < cTeams.length; j++) {
                const t1 = cTeams[i];
                const t2 = cTeams[j];
                // Check if they are in different divisions
                if (teamDivision[t1] && teamDivision[t2] && teamDivision[t1] !== teamDivision[t2]) {
                    nonDivPairs.push({ t1, t2 });
                }
            }
        }

        // We need to select 45 pairs to have 4 games, rest 3.
        // Each team needs 6 opponents to be 4-game series.
        
        let success = false;
        let attempts = 0;
        let chosenFor4Games = new Set<string>();

        while (!success && attempts < 50) {
            attempts++;
            chosenFor4Games.clear();
            const needsUpgrade = new Map<string, number>();
            cTeams.forEach(t => needsUpgrade.set(t, 6));
            
            const shuffledPairs = [...nonDivPairs].sort(() => Math.random() - 0.5);
            
            for (const pair of shuffledPairs) {
                if ((needsUpgrade.get(pair.t1) || 0) > 0 && (needsUpgrade.get(pair.t2) || 0) > 0) {
                    chosenFor4Games.add(getPairId(pair.t1, pair.t2));
                    needsUpgrade.set(pair.t1, (needsUpgrade.get(pair.t1) || 0) - 1);
                    needsUpgrade.set(pair.t2, (needsUpgrade.get(pair.t2) || 0) - 1);
                }
            }
            
            // Validate
            // Check if all needed upgrades are consumed?
            // Actually, simply checking if we selected enough pairs is not enough, we need ideally 0 left.
            if (Array.from(needsUpgrade.values()).every(v => v === 0)) {
                success = true;
            }
        }
        
        for (const pair of nonDivPairs) {
            const is4Game = chosenFor4Games.has(getPairId(pair.t1, pair.t2));
            addSeries(pair.t1, pair.t2, is4Game ? 4 : 3);
        }
    });

    // 3. Shuffle and Distribute
    for (let i = matchupPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matchupPool[i], matchupPool[j]] = [matchupPool[j], matchupPool[i]];
    }

    const schedule: GameResult[][] = [];
    const weeks = 31;
    let poolIndex = 0;
    
    for (let w = 0; w < weeks; w++) {
        const weekGames: GameResult[] = [];
        const gamesForThisWeek = Math.ceil((matchupPool.length - poolIndex) / (weeks - w));
        
        for (let i = 0; i < gamesForThisWeek; i++) {
             if (poolIndex < matchupPool.length) {
                 const m = matchupPool[poolIndex++];
                 const dayOffset = Math.floor(Math.random() * 7);
                 weekGames.push({
                     homeTeam: m.home,
                     awayTeam: m.away,
                     homeScore: 0,
                     awayScore: 0,
                     played: false,
                     isPlayoffGame: false,
                     day: w * 7 + dayOffset
                 });
             }
        }
        schedule.push(weekGames);
    }
    
    return schedule;
};

export const generateBroadcastOffers = (team: Team, season: number, week: number): BroadcastOffer[] => {
    const keyMilestones = [1, 10, 20, 25];
    if (!keyMilestones.includes(week)) {
        return [];
    }

    const offers: BroadcastOffer[] = [];
    const baseValue = team.prestige * 10000;
    const partners = ["National Sports Net", "Regional Cable", "StreamPlus", "Local Network"];
    
    partners.forEach(partner => {
        const prestigeFactor = team.prestige / 100;
        const recordFactor = team.record.wins / 31;
        const marketFactor = 1.0; // Placeholder for market size

        const offerChance = 0.2 + (prestigeFactor * 0.3) + (recordFactor * 0.2);

        if (Math.random() < offerChance) {
            const variance = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
            const annualValue = Math.round(baseValue * variance * marketFactor);
            const exposureBonus = Math.floor(Math.random() * 5) + 1;
            const duration = Math.floor(Math.random() * 3) + 2; // 2-5 years
            
            offers.push({
                id: `BO-${season}-${partner}-${Date.now()}`,
                partner,
                annualValue,
                exposureBonus,
                startSeason: season + 1,
                endSeason: season + duration,
                expiresWeek: week + 4,
            });
        }
    });
    
    return offers;
};

export const negotiateBroadcastDeal = (offer: BroadcastOffer, counterAmount: number, team: Team): { success: boolean; newOffer?: BroadcastOffer; message: string } => {
    const leverage = team.prestige; 
    const askDiff = counterAmount - offer.annualValue;
    const percentDiff = askDiff / offer.annualValue;

    if (percentDiff <= 0) {
        return { success: true, newOffer: { ...offer, annualValue: counterAmount }, message: "Partner happily accepted the lower rate." };
    }

    const maxBump = (leverage / 100) * 0.25; 

    if (percentDiff <= maxBump) {
         return { success: true, newOffer: { ...offer, annualValue: counterAmount }, message: "Partner accepted your terms." };
    } else if (percentDiff <= maxBump * 1.5) {
        const middle = Math.round((offer.annualValue + counterAmount) / 2);
        return { success: false, newOffer: { ...offer, annualValue: middle }, message: "Partner countered with a compromise." };
    } else {
        return { success: false, message: "Partner rejected the counter-offer outright." };
    }
};

export const processWeeklyFinances = (team: Team, season: number, week: number, matches: any[] = [], date?: GameDate): Team => {
    if (!team.budget || !team.budget.allocations) return team;

    const { marketing, recruiting, facilities, staffDevelopment } = team.budget.allocations;
    const totalWeeklyExpenses = marketing + recruiting + facilities + staffDevelopment;

    const WEEKS_IN_SEASON = 31;
    const projected = team.initialProjectedRevenue || calculateTeamRevenue(team, null);
    const weeklyBaseRevenue = Math.round((projected.baseRevenue || 0) / WEEKS_IN_SEASON);
    const weeklySponsor = Math.round((projected.sponsorPayout || 0) / WEEKS_IN_SEASON);
    const weeklyDonations = Math.round((projected.donationRevenue || 0) / WEEKS_IN_SEASON);
    const weeklyEndowment = Math.round((projected.endowmentSupport || 0) / WEEKS_IN_SEASON);
    const weeklyAdmin = Math.round((projected.administrativeExpenses || 0) / WEEKS_IN_SEASON);
    const coachSalary = team.headCoach?.contract?.salary || 0;
    const staffSalaries = [...(team.staff?.assistants || []), ...(team.staff?.trainers || []), ...(team.staff?.scouts || [])]
        .reduce((sum, member) => sum + member.salary, 0) + coachSalary;
    const weeklyPayroll = Math.round(staffSalaries / WEEKS_IN_SEASON);

    // Calculate Weekly Merch Revenue
    const merchRevenue = calculateWeeklyMerchRevenue(team);
    const licensingRevenue = calculateLicensingRevenue(team);

    // Update Cash (Revenue - Expenses)
    const weekRevenue = weeklyBaseRevenue + weeklySponsor + weeklyDonations + weeklyEndowment + merchRevenue + licensingRevenue;
    const weekExpenses = totalWeeklyExpenses + weeklyAdmin + weeklyPayroll;
    const newCash = team.budget.cash + weekRevenue - weekExpenses;

    // Record history
    // Note: Revenue is typically calculated per game, so we might need to pass that in or handle it separately.
    // For now, we record the expense side and merch revenue.
    const historyEntry: FinancialWeekRecord = {
        week,
        revenue: weekRevenue, // Base weekly revenue (game revenue added elsewhere)
        expenses: weekExpenses,
        profit: weekRevenue - weekExpenses,
        cash: newCash
    };

    // Marketing Effect:
    // Base marketing needed to maintain interest depends on prestige.
    const baseMarketing = team.prestige * 150; 
    let interestChange = 0;
    if (marketing > baseMarketing * 1.2) interestChange = 0.5; // Slow growth
    else if (marketing < baseMarketing * 0.8) interestChange = -0.5; // Slow decay
    
    // Accumulate change (using a hidden accumulator or just probabilistic rounding)
    let newFanInterest = team.fanInterest;
    if (Math.random() < Math.abs(interestChange)) {
        newFanInterest = clamp(team.fanInterest + Math.sign(interestChange), 10, 100);
    }

    // Facilities Effect:
    // Arena quality decays naturally. Spending maintenance prevents it or improves it.
    let newArena = team.facilities?.arena ? { ...team.facilities.arena } : undefined;
    if (newArena) {
        const baseMaintenance = newArena.capacity * 2; // e.g. 10000 cap -> $20k/week
        let qualityChange = -0.1; // Natural decay
        
        if (facilities > baseMaintenance * 1.5) qualityChange = 0.1; // Improvement
        else if (facilities >= baseMaintenance) qualityChange = 0; // Maintenance
        
        // Apply change
        newArena.quality = clamp(newArena.quality + qualityChange, 0, 100);
    }

    const newFacilities = team.facilities ? { ...team.facilities, arena: newArena || team.facilities.arena } : team.facilities;

    // Update NIL Collective (Donation Momentum impact)
    const newNilCollective = updateNILCollective(team, week);

    const updatedTeam: Team = {
        ...team,
        budget: { ...team.budget, cash: newCash },
        fanInterest: newFanInterest,
        facilities: newFacilities,
        nilCollective: newNilCollective,
        financialHistory: [...(team.financialHistory || []), historyEntry],
    };

    // Ledger + YTD totals (non-game-day flows)
    recordFinancialTransaction(updatedTeam, season, week, { description: 'Conference/Media Base Revenue', category: 'Revenue', amount: weeklyBaseRevenue, revenueKey: 'baseRevenue', date });
    if (weeklySponsor) recordFinancialTransaction(updatedTeam, season, week, { description: 'Sponsorship Payout', category: 'Revenue', amount: weeklySponsor, revenueKey: 'sponsorPayout', date });
    if (weeklyDonations) recordFinancialTransaction(updatedTeam, season, week, { description: 'Booster/Donation Income', category: 'Revenue', amount: weeklyDonations, revenueKey: 'donationRevenue', date });
    if (weeklyEndowment) recordFinancialTransaction(updatedTeam, season, week, { description: 'Endowment Support', category: 'Revenue', amount: weeklyEndowment, revenueKey: 'endowmentSupport', date });
    if (merchRevenue) recordFinancialTransaction(updatedTeam, season, week, { description: 'Merchandise Sales', category: 'Revenue', amount: Math.round(merchRevenue), revenueKey: 'merchandiseRevenue', date });
    if (licensingRevenue) recordFinancialTransaction(updatedTeam, season, week, { description: 'Licensing Revenue', category: 'Revenue', amount: Math.round(licensingRevenue), revenueKey: 'licensingRevenue', date });

    if (marketing) recordFinancialTransaction(updatedTeam, season, week, { description: 'Marketing & Ops', category: 'Expense', amount: -marketing, expenseKey: 'marketingExpenses', date });
    if (recruiting) recordFinancialTransaction(updatedTeam, season, week, { description: 'Recruiting', category: 'Expense', amount: -recruiting, expenseKey: 'recruitingExpenses', date });
    if (facilities) recordFinancialTransaction(updatedTeam, season, week, { description: 'Facilities Maintenance', category: 'Expense', amount: -facilities, expenseKey: 'facilitiesExpenses', date });
    if (staffDevelopment) recordFinancialTransaction(updatedTeam, season, week, { description: 'Staff Development', category: 'Staff Expenses', amount: -staffDevelopment, expenseKey: 'administrativeExpenses', date });
    if (weeklyAdmin) recordFinancialTransaction(updatedTeam, season, week, { description: 'Administrative Overhead', category: 'Expense', amount: -weeklyAdmin, expenseKey: 'administrativeExpenses', date });
    if (weeklyPayroll) recordFinancialTransaction(updatedTeam, season, week, { description: 'Staff Payroll', category: 'Staff Expenses', amount: -weeklyPayroll, expenseKey: 'staffPayrollExpenses', date });

    return updatedTeam;
};

export const updateBoardExpectations = (team: Team): Team => {
    const previous = team.boardExpectations ?? generateBoardExpectations(team);

    const { targetRevenue } = previous;
    const actualRevenue = team.finances.totalRevenue;
    
    let pressureChange = 0;
    let discretionaryChange = 0;

    if (actualRevenue < targetRevenue * 0.9) {
        pressureChange = 15; // High pressure for missing targets
    } else if (actualRevenue < targetRevenue) {
        pressureChange = 5;
    } else if (actualRevenue > targetRevenue * 1.1) {
        pressureChange = -10;
        discretionaryChange = (actualRevenue - targetRevenue) * 0.5; // Keep 50% of surplus
    } else {
        pressureChange = -2;
    }

    const newPressure = clamp(previous.pressure + pressureChange, 0, 100);
    const newDiscretionary = previous.discretionaryFunds + discretionaryChange;

    // Set new targets for next year
    const newTargetRevenue = Math.round(actualRevenue * 1.03); // Expect 3% growth
    const newMaxBudget = Math.round(newTargetRevenue * 0.95);

    const base = generateBoardExpectations({ ...team, boardExpectations: previous });

    return {
        ...team,
        boardExpectations: {
            ...base,
            targetRevenue: newTargetRevenue,
            maxBudget: newMaxBudget,
            pressure: newPressure,
            discretionaryFunds: newDiscretionary,
            patience: previous.patience,
            jobSecurityStatus: previous.jobSecurityStatus,
            boardProfile: previous.boardProfile,
            weights: previous.weights,
        },
    };
};

export const calculateDetailedConcessionsRevenue = (team: Team, attendance: number, week: number): number => {
    const prices = team.prices ?? DEFAULT_TEAM_PRICES;
    const concessions = team.concessions || {
        tier: 'Standard' as ConcessionTier,
        alcoholPolicy: false,
        signatureItem: '',
        items: [],
        pricing: undefined,
    };
    const defaultPricing = {
        priceBands: { base: 1, premium: 1.25 },
        bundleDiscount: 0.1,
        dynamicPricing: { weekendMultiplier: 1.12, weekdayMultiplier: 0.92 },
    };
    const pricing = {
        ...defaultPricing,
        ...concessions.pricing,
        priceBands: {
            ...defaultPricing.priceBands,
            ...(concessions.pricing?.priceBands || {}),
        },
        dynamicPricing: {
            ...defaultPricing.dynamicPricing,
            ...(concessions.pricing?.dynamicPricing || {}),
        },
    };
    const tierMultiplier = concessions.tier === 'Premium' ? pricing.priceBands.premium : pricing.priceBands.base;
    const dynamicMultiplier = week % 2 === 1 ? pricing.dynamicPricing.weekendMultiplier : pricing.dynamicPricing.weekdayMultiplier;
    const effectiveFoodPrice = prices.concessionFoodPrice * tierMultiplier * dynamicMultiplier;
    const effectiveDrinkPrice = prices.concessionDrinkPrice * tierMultiplier * dynamicMultiplier;
    const willingness = calculateFanWillingness(team);
    const baseTierBuyRate = concessions.tier === 'Premium' ? 0.35 : concessions.tier === 'Basic' ? 0.6 : 0.45;
    
    const tailgateInvestment = team.parking?.tailgateCulture || 0;
    const tailgateBoost = Math.min(0.1, tailgateInvestment / 50000); // Up to 10% boost for $5k investment

    const foodDemandFactor = priceDemandFactor(effectiveFoodPrice, willingness.concessionFood, 1.65, 1.5);
    const drinkDemandFactor = priceDemandFactor(effectiveDrinkPrice, willingness.concessionDrink, 1.55, 1.5);
    const adjustedBuyRate = baseTierBuyRate * (0.55 * foodDemandFactor + 0.45 * drinkDemandFactor) * (1 + tailgateBoost);
    const alcoholFactor = concessions.alcoholPolicy ? 1.15 : 0.95;
    const basePrice = effectiveFoodPrice + effectiveDrinkPrice;
    const signatureBoost = concessions.signatureItem ? 0.04 : 0;
    const baseRevenue = attendance * adjustedBuyRate * basePrice * alcoholFactor * (1 + signatureBoost);
    const bundleRevenue = attendance * adjustedBuyRate * basePrice * pricing.bundleDiscount * 0.4;
    return baseRevenue + bundleRevenue;
};

const SERVICE_DEFAULT_MERCH_PRICING: MerchPricingSettings = {
    apparelMultiplier: 1,
    authenticMultiplier: 1.2,
    flashSaleActive: false,
    flashSaleDepth: 0.15,
    playerSegmentBoost: 0.05,
};

const SERVICE_DEFAULT_PARKING_SETTINGS: ParkingPricingSettings = {
    surgeMultiplier: 1,
    earlyAccessPremium: 15,
    amenityAddonPrice: 3,
};

export const calculateDetailedParkingRevenue = (team: Team, attendance: number): number => {
    const prices = team.prices ?? DEFAULT_TEAM_PRICES;
    const parking = team.parking ?? {
        generalPrice: prices.parkingPrice || 10,
        vipPrice: (prices.parkingPrice || 10) * 1.5,
        tailgateCulture: 0,
        revenueSettings: SERVICE_DEFAULT_PARKING_SETTINGS,
    };
    const settings = parking.revenueSettings ?? SERVICE_DEFAULT_PARKING_SETTINGS;
    const generalPrice = parking.generalPrice * settings.surgeMultiplier;
    const vipPrice = parking.vipPrice * settings.surgeMultiplier;
    const cars = Math.round(attendance / 2.5);
    const vipSpots = 500;
    const willingness = calculateFanWillingness(team);
    const generalDemandFactor = priceDemandFactor(generalPrice, willingness.parking, 1.45, 1.25);
    const vipDemandFactor = priceDemandFactor(vipPrice, willingness.parking * 1.5, 1.35, 1.25);
    const vipDemand = Math.min(vipSpots, Math.round(cars * 0.1 * vipDemandFactor));
    const generalCars = Math.max(0, Math.round((cars - vipDemand) * generalDemandFactor));
    const earlyAccessOrders = Math.min(150, Math.max(0, Math.round(attendance / 25)));
    const earlyAccessRevenue = earlyAccessOrders * settings.earlyAccessPremium;
    const amenityRevenue = attendance * 0.05 * settings.amenityAddonPrice;

    return (vipDemand * vipPrice) + (generalCars * generalPrice) + earlyAccessRevenue + amenityRevenue;
};

export const calculateWeeklyMerchRevenue = (team: Team): number => {
    const pricing = team.merchandising?.pricing ?? SERVICE_DEFAULT_MERCH_PRICING;
    const prices = team.prices ?? DEFAULT_TEAM_PRICES;
    const willingness = calculateFanWillingness(team);
    const baseMerchDemand = (team.fanInterest * 200) + (team.prestige * 1500);
    const jerseyPrice = prices.jerseyPrice * pricing.authenticMultiplier * (pricing.flashSaleActive ? 1 - pricing.flashSaleDepth : 1);
    const merchPrice = prices.merchandisePrice * pricing.apparelMultiplier * (pricing.flashSaleActive ? 1 - pricing.flashSaleDepth : 1);
    const starBoost = Math.min(0.6, (team.roster.filter(p => p.overall >= 90).length) * pricing.playerSegmentBoost);
    const playerBoost = 1 + starBoost;
    const jerseyDemandFactor = priceDemandFactor(jerseyPrice, willingness.jersey, 1.35, 2.0);
    const merchDemandFactor = priceDemandFactor(merchPrice, willingness.merchandise, 1.25, 2.0);
    const jerseyRevenue = (baseMerchDemand * 0.08 * jerseyDemandFactor * jerseyPrice) * playerBoost;
    const generalMerchRevenue = (baseMerchDemand * 0.15 * merchDemandFactor * merchPrice);
    return (jerseyRevenue + generalMerchRevenue) / 30; // Weekly approx
};

export const calculateLicensingRevenue = (team: Team): number => {
    if (!team.licensingDeals || team.licensingDeals.length === 0) return 0;
    
    // Weekly revenue = (Upfront / Duration / 30) + (Royalty * MerchRevenue)
    // Simplified: Just return a weekly portion of the upfront + estimated royalty
    // For simplicity, we'll assume royalty is applied to the base merch revenue calculated elsewhere, 
    // but to avoid circular dependency or double counting, we'll treat it as a separate bonus stream.
    
    let weeklyRevenue = 0;
    const merchRevenue = calculateWeeklyMerchRevenue(team);

    team.licensingDeals.forEach(deal => {
        const weeklyUpfront = deal.upfrontPayment / (deal.duration * 30); // Approx 30 weeks per season
        const weeklyRoyalty = merchRevenue * deal.royaltyRate;
        weeklyRevenue += weeklyUpfront + weeklyRoyalty;
    });

    return weeklyRevenue;
};

export const generateLicensingOffers = (team: Team): LicensingContract[] => {
    const offers: LicensingContract[] = [];
    const prestige = team.prestige;
    const starPower = team.roster.filter(p => p.overall > 85).length;
    
    // Video Game Deal
    if (prestige > 70 || starPower > 1) {
        const tier = prestige > 90 ? 'High' : prestige > 80 ? 'Mid' : 'Low';
        const upfront = tier === 'High' ? 500000 : tier === 'Mid' ? 250000 : 100000;
        offers.push({
            id: `lic-vg-${Math.random().toString(36).substr(2, 5)}`,
            partner: 'EA Sports',
            category: 'Video Game',
            upfrontPayment: upfront + randomBetween(-20000, 20000),
            royaltyRate: 0.05,
            duration: 3
        });
    }

    // Apparel Deal
    if (prestige > 60) {
        offers.push({
            id: `lic-app-${Math.random().toString(36).substr(2, 5)}`,
            partner: 'Nike',
            category: 'Apparel',
            upfrontPayment: prestige * 2000,
            royaltyRate: 0.10,
            duration: 4
        });
    }

    return offers;
};

export const applyHeadCoachResult = (team: Team, didWin: boolean) => {
    if (!team.headCoach) return;
    if (didWin) {
        team.headCoach.careerWins += 1;
        team.headCoach.seasonWins += 1;
    } else {
        team.headCoach.careerLosses += 1;
        team.headCoach.seasonLosses += 1;
    }
};

export const processNBAWeeklyMoves = (state: GameState): GameState => {
    let teams = state.nbaTeams || [];
    let freeAgents = [...(state.nbaFreeAgents || [])];
    let transactions = [...(state.nbaTransactions || [])];
    const CAP = NBA_SALARY_CAP_2025 || 154647000;
    const TAX = NBA_LUXURY_TAX_THRESHOLD_2025 || 187895000;
    const TWO_WAY_SLOTS = 2;
    const ROSTER_LIMIT = 15 + TWO_WAY_SLOTS;
    const MIN_SALARY = NBA_MINIMUM_SALARY || 1100000;
    const MAX_SALARY = 65000000;

    const refreshTeamFinances = (team: Team) => {
        const totalSalary = team.roster.reduce((sum, player) => sum + (player.contract?.salary || 0), 0);
        team.salaryCapSpace = CAP - totalSalary;
        team.luxuryTaxBill = Math.max(0, totalSalary - TAX);
        return team;
    };

    const lerp = (from: number, to: number, t: number) => from + (to - from) * clamp(t, 0, 1);

    const estimateNBAMarketSalary = (player: Player, ageOverride?: number): number => {
        const overall = clamp(player.overall ?? 70, 40, 99);
        const potential = clamp(player.potential ?? overall, 40, 99);
        const age = ageOverride ?? player.age ?? 25;

        const baseFromOverall = (() => {
            if (overall >= 95) return lerp(52000000, 60000000, (overall - 95) / 4);
            if (overall >= 90) return lerp(38000000, 52000000, (overall - 90) / 5);
            if (overall >= 85) return lerp(25000000, 38000000, (overall - 85) / 5);
            if (overall >= 80) return lerp(16000000, 25000000, (overall - 80) / 5);
            if (overall >= 75) return lerp(9000000, 16000000, (overall - 75) / 5);
            if (overall >= 72) return lerp(5000000, 9000000, (overall - 72) / 3);
            if (overall >= 68) return lerp(2500000, 5000000, (overall - 68) / 4);
            if (overall >= 65) return lerp(MIN_SALARY, 2500000, (overall - 65) / 3);
            return MIN_SALARY;
        })();

        const upside = clamp((potential - overall) / 15, -0.25, 0.5);
        const potentialMultiplier = 1 + upside;

        let ageMultiplier = 1.0;
        if (age < 24) {
            ageMultiplier = 1.05 + Math.max(0, potential - overall) * 0.015;
        } else if (age <= 30) {
            ageMultiplier = 1.0;
        } else if (age <= 34) {
            ageMultiplier = Math.max(0.75, 1.0 - (age - 30) * 0.06);
        } else {
            ageMultiplier = Math.max(0.35, 0.75 - (age - 34) * 0.07);
        }

        const salary = clamp(baseFromOverall * potentialMultiplier * ageMultiplier, MIN_SALARY, MAX_SALARY);
        return Math.round(salary / 10000) * 10000;
    };

    const getPlayerAskSalary = (player: Player): number => {
        const existing = player.contract?.salary;
        if (typeof existing === 'number' && existing > MIN_SALARY) return existing;
        return estimateNBAMarketSalary(player);
    };

    const chooseFreeAgentContractYears = (player: Player): number => {
        const overall = clamp(player.overall ?? 70, 40, 99);
        const potential = clamp(player.potential ?? overall, 40, 99);
        const age = player.age ?? 25;

        const upside = potential - overall;

        if (age >= 36) return 1;
        if (overall >= 92) return age <= 30 ? randomBetween(4, 5) : randomBetween(2, 4);
        if (overall >= 86) return age <= 30 ? randomBetween(3, 4) : randomBetween(2, 3);
        if (overall >= 80) return age <= 29 ? randomBetween(2, 4) : randomBetween(1, 3);
        if (overall >= 72) return age <= 27 ? randomBetween(2, 3) : age >= 33 ? 1 : 2;

        let years = age <= 27 ? randomBetween(1, 2) : 1;
        if (age <= 23 && upside >= 8) years += 1;
        return clamp(years, 1, 4);
    };

    const buildYearlySalaries = (startSalary: number, years: number, player: Player): number[] => {
        const age = player.age ?? 25;
        const salaries: number[] = [];
        let current = clamp(startSalary, MIN_SALARY, MAX_SALARY);
        salaries.push(Math.round(current / 10000) * 10000);

        for (let i = 1; i < years; i++) {
            const yearAge = age + i;
            let delta = 0.05;
            if (yearAge >= 31) delta = 0.03;
            if (yearAge >= 34) delta = 0.0;
            if (yearAge >= 36) delta = -0.04;

            const jitter = randomBetween(-10, 15) / 1000; // -1.0% to +1.5%
            const factor = clamp(1 + delta + jitter, 0.90, 1.08);
            current = clamp(current * factor, MIN_SALARY, MAX_SALARY);
            salaries.push(Math.round(current / 10000) * 10000);
        }

        return salaries;
    };

    const buildContract = (player: Player, type: 'Guaranteed' | 'Two-Way', budget: number) => {
        if (type === 'Two-Way') {
            return {
                salary: 500000,
                yearsLeft: 1,
                type,
            };
        }

        const startSalary = Math.min(budget, getPlayerAskSalary(player));
        const years = clamp(chooseFreeAgentContractYears(player), 1, 5);
        const yearlySalaries = buildYearlySalaries(startSalary, years, player);

        return {
            salary: yearlySalaries[0],
            yearsLeft: yearlySalaries.length,
            type,
            yearlySalaries,
        };
    };
    
    const getBudget = (team: Team) => Math.max(team.salaryCapSpace ?? 0, MIN_SALARY);
    const formatPlayerForLog = (player: Player) => {
        const overallLabel = typeof player.overall === 'number' ? player.overall : 'â€”';
        return `${player.name} (${overallLabel})`;
    };
    const ELITE_OVERALL_THRESHOLD = 90;

    // Rescue players that were incorrectly marked as expired (older saves) by reconstructing their remaining
    // contract from `data/nbaSalaries.ts` and returning them to their NBA team.
    if (freeAgents.length > 0) {
        const restoreMap = new Map<string, Player[]>();
        const remainingFreeAgents: NBAFreeAgent[] = [];

        freeAgents.forEach(entry => {
            const teamName = (entry.player as any)?.team;
            if (entry.reason !== 'Expired' || !teamName) {
                remainingFreeAgents.push(entry);
                return;
            }
            const profile = getNBASalaryProfileForName(entry.player.name);
            if (!profile?.yearlySalaries?.length) {
                remainingFreeAgents.push(entry);
                return;
            }
            const salaryOffset = Math.max(0, state.season - 1);
            const remaining = profile.yearlySalaries.slice(salaryOffset);
            if (!remaining.length) {
                remainingFreeAgents.push(entry);
                return;
            }

            const restoredPlayer: Player = {
                ...entry.player,
                contract: {
                    salary: remaining[0],
                    yearsLeft: remaining.length,
                    type: 'Guaranteed',
                    yearlySalaries: [...remaining],
                },
            };

            restoreMap.set(teamName, [...(restoreMap.get(teamName) || []), restoredPlayer]);
        });

        if (restoreMap.size > 0) {
            teams = teams.map(team => {
                const additions = restoreMap.get(team.name);
                if (!additions?.length) return team;
                const existingIds = new Set(team.roster.map(player => player.id));
                const updatedRoster = [...team.roster];
                additions.forEach(player => {
                    if (!existingIds.has(player.id)) updatedRoster.push(player);
                });
                return { ...team, roster: updatedRoster };
            });
        }

        freeAgents = remainingFreeAgents;
    }

    // Ensure contracts are aligned to the active season before any expiration/cut logic.
    teams = teams.map(team => ({
        ...team,
        roster: team.roster.map(player => {
            const updatedPlayer: Player = {
                ...player,
                contract: player.contract
                    ? {
                        ...player.contract,
                        yearlySalaries: Array.isArray(player.contract.yearlySalaries)
                            ? [...player.contract.yearlySalaries]
                            : undefined,
                    }
                    : undefined,
            };
            syncNBAContractForSeason(updatedPlayer, state.season);
            return updatedPlayer;
        }),
    }));

    // --- 1. Roster Management (Cuts & 2-Way) ---
    const updatedTeams = teams.map(team => {
        let roster = [...team.roster];
        
        // Sort by value to protect best players
        roster.sort((a, b) => (b.overall * 0.7 + b.potential * 0.3) - (a.overall * 0.7 + a.potential * 0.3));

        const twoWaySlots = TWO_WAY_SLOTS;
        const rosterLimit = ROSTER_LIMIT;
        let lastCutWeek = team.lastCutWeek ?? 0;
        const cutCooldown = 3;
        const canCutThisWeek = lastCutWeek === 0 || state.week - lastCutWeek >= cutCooldown;

        if (roster.length > rosterLimit && (canCutThisWeek || roster.length > rosterLimit + 1)) {
            const cuts = roster.slice(rosterLimit);
            roster = roster.slice(0, rosterLimit);
            lastCutWeek = state.week;

            cuts.forEach(player => {
                freeAgents.push({ 
                    player: { ...player, team: undefined, contract: undefined }, 
                    reason: 'Cut', 
                    seasonAdded: state.season, 
                    weekAdded: state.week,
                    previousTeam: team.name
                } as NBAFreeAgent);
                transactions.push({
                    id: crypto.randomUUID(),
                    week: state.week,
                    season: state.season,
                    type: 'Cut',
                    description: `${team.name} waived ${formatPlayerForLog(player)}`,
                    teamName: team.name,
                    playerIds: [player.id]
                });
            });
        }

        // Adjust Contracts for Two-Way (Simulated)
        roster.forEach((p, i) => {
            if (i >= 15) {
                if (p.contract) {
                    p.contract.type = 'Two-Way';
                    p.contract.salary = 500000; // Flat 2-way rate
                    if (Array.isArray(p.contract.yearlySalaries) && p.contract.yearlySalaries.length > 0) {
                        p.contract.yearlySalaries[0] = p.contract.salary;
                    }
                }
            } else if (p.contract?.type === 'Two-Way') {
                p.contract.type = 'Guaranteed';
                p.contract.salary = Math.max(p.contract.salary, NBA_MINIMUM_SALARY || 1100000);
                if (Array.isArray(p.contract.yearlySalaries) && p.contract.yearlySalaries.length > 0) {
                    p.contract.yearlySalaries[0] = p.contract.salary;
                }
            }
        });

        const updatedTeam: Team = { ...team, roster, lastCutWeek };
        return refreshTeamFinances(updatedTeam);
    });

    // --- 2. Trade Logic (Weekly Activity) ---
    const tradeChance = 0.8;
    const eligibleTeams = updatedTeams.filter(team => !team.isUserTeam);
    let draftPickAssets = (state.nbaDraftPickAssets && state.nbaDraftPickAssets.length > 0)
        ? state.nbaDraftPickAssets.map(asset => ({ ...asset }))
        : buildInitialDraftPickAssets();

    const pickRandomN = <T>(arr: T[], count: number): T[] => {
        const copy = [...arr];
        const picked: T[] = [];
        while (picked.length < count && copy.length) {
            const idx = Math.floor(Math.random() * copy.length);
            picked.push(copy.splice(idx, 1)[0]);
        }
        return picked;
    };

    const selectTradePlayers = (team: Team, maxPlayers: number): Player[] => {
        const candidates = team.roster
            .filter(player => (player.overall ?? 0) < ELITE_OVERALL_THRESHOLD && (player.contract?.salary ?? 0) > 0)
            .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
        return candidates.slice(0, Math.min(maxPlayers, candidates.length));
    };

    const formatTradeDescription = (participants: { team: Team; outgoing: Player[] }[]) => {
        return participants.map((participant, idx) => {
            const destTeam = participants[(idx + 1) % participants.length].team;
            const outgoing = participant.outgoing.map(formatPlayerForLog).join(', ') || 'no players';
            return `${participant.team.name} sent ${outgoing} to ${destTeam.name}`;
        }).join(' / ');
    };

    const canAffordSalary = (team: Team, incomingSalary: number, outgoingSalary: number): boolean => {
        const remainingCap = team.salaryCapSpace ?? 0;
        const netDelta = incomingSalary - outgoingSalary;
        if (netDelta <= 0) return true;
        return remainingCap >= netDelta;
    };

    const executeTrade = (): boolean => {
        if (eligibleTeams.length < 2) return false;
        const participantCount = eligibleTeams.length >= 3 && Math.random() < 0.35 ? 3 : 2;
        const tradeTeams = pickRandomN(eligibleTeams, participantCount);
        const participants = tradeTeams.map(team => ({
            team,
            outgoing: selectTradePlayers(team, Math.random() < 0.6 ? 2 : 1),
        }));
        if (participants.some(participant => participant.outgoing.length === 0)) return false;

        const valid = participants.every((participant, idx) => {
            const incomingPlayers = participants[(idx + 1) % participants.length].outgoing;
            const outgoingSalary = participant.outgoing.reduce((sum, player) => sum + (player.contract?.salary || 0), 0);
            const incomingSalary = incomingPlayers.reduce((sum, player) => sum + (player.contract?.salary || 0), 0);
            const incomingOverall = incomingPlayers.reduce((sum, player) => sum + (player.overall ?? 0), 0);
            const outgoingOverall = participant.outgoing.reduce((sum, player) => sum + (player.overall ?? 0), 0);
            if (!canAffordSalary(participant.team, incomingSalary, outgoingSalary)) return false;
            if (Math.abs(incomingOverall - outgoingOverall) > 8) return false;
            return true;
        });
        if (!valid) return false;

        participants.forEach(participant => {
            const outgoingIds = new Set(participant.outgoing.map(player => player.id));
            participant.team.roster = participant.team.roster.filter(player => !outgoingIds.has(player.id));
        });

        participants.forEach((participant, idx) => {
            const incomingSource = participants[(idx + 1) % participants.length].outgoing;
            const incomingPlayers = incomingSource.map(player => ({ ...player, team: participant.team.name }));
            participant.team.roster.push(...incomingPlayers);
        });

        const pickTransfers: { asset: DraftPickAsset; to: string }[] = [];
        const usedPickIds = new Set<string>();
        const currentDraftYear = seasonToCalendarYear(state.season);

        participants.forEach((participant, idx) => {
            if (Math.random() < 0.55) {
                const candidate = draftPickAssets.find(asset => 
                    asset.owner === participant.team.name && 
                    !usedPickIds.has(asset.id) &&
                    asset.year >= currentDraftYear
                );
                if (candidate) {
                    const destination = participants[(idx + 1) % participants.length].team.name;
                    candidate.owner = destination;
                    usedPickIds.add(candidate.id);
                    pickTransfers.push({ asset: candidate, to: destination });
                }
            }
        });

        if (!pickTransfers.length) {
            const fallbackParticipant = participants[0];
            const fallbackPick = draftPickAssets.find(asset => 
                asset.owner === fallbackParticipant.team.name && 
                !usedPickIds.has(asset.id) &&
                asset.year >= currentDraftYear
            );
            if (fallbackPick) {
                const destination = participants[1 % participants.length].team.name;
                fallbackPick.owner = destination;
                pickTransfers.push({ asset: fallbackPick, to: destination });
            }
        }

        const playerIds = participants.flatMap(participant => participant.outgoing.map(player => player.id));
        const description = `Multi-team trade: ${formatTradeDescription(participants)}${pickTransfers.length ? ' + Picks: ' + pickTransfers.map(t => `${t.asset.description} to ${t.to}`).join('; ') : ''}`;

        transactions.push({
            id: crypto.randomUUID(),
            week: state.week,
            season: state.season,
            type: 'Trade',
            description,
            teamName: participants[0].team.name,
            relatedTeamName: participants.slice(1).map(participant => participant.team.name).join(', '),
            playerIds,
        });

        participants.forEach(participant => refreshTeamFinances(participant.team));
        return true;
    };

    const tradeAttempts = 8;
    let tradesThisWeek = 0;
    for (let attempt = 0; attempt < tradeAttempts; attempt++) {
        const shouldAttemptTrade = Math.random() < tradeChance || (tradesThisWeek === 0 && attempt === tradeAttempts - 1);
        if (shouldAttemptTrade && executeTrade()) {
            tradesThisWeek++;
        }
    }

    // --- 3. Extensions (Regular Season) ---
    updatedTeams.forEach(team => {
        if (team.isUserTeam) return;
        if (state.week < 3 || state.week > 26) return; // Regular season window
        if (Math.random() > 0.35) return;

        const roster = team.roster || [];
        const extensionCandidates = roster
            .filter(player => {
                const contract = player.contract;
                if (!contract || contract.type !== 'Guaranteed') return false;
                if ((contract.yearsLeft ?? 0) !== 1) return false;
                if ((player.overall ?? 0) < 74 && ((player.potential ?? 0) - (player.overall ?? 0)) < 10) return false;
                if ((player.age ?? 25) >= 38) return false;
                return true;
            })
            .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

        if (!extensionCandidates.length) return;

        const attempts = Math.min(2, extensionCandidates.length);
        for (let i = 0; i < attempts; i++) {
            const player = extensionCandidates[i];
            const contract = player.contract;
            if (!contract) continue;

            const age = player.age ?? 25;
            let extensionYears = 2;
            if ((player.overall ?? 0) >= 88 && age <= 30) extensionYears = randomBetween(3, 4);
            else if (age >= 33) extensionYears = randomBetween(1, 2);
            else extensionYears = randomBetween(2, 3);

            const baseArray = Array.isArray(contract.yearlySalaries) && contract.yearlySalaries.length > 0
                ? [...contract.yearlySalaries]
                : Array.from({ length: Math.max(1, contract.yearsLeft ?? 1) }, () => contract.salary || MIN_SALARY);

            const maxTotalYears = 5;
            const totalYears = clamp(baseArray.length + extensionYears, baseArray.length + 1, maxTotalYears);
            const yearsToAppend = totalYears - baseArray.length;
            if (yearsToAppend <= 0) continue;

            const nextYearMarket = estimateNBAMarketSalary(player, age + 1);
            const loyaltyDiscount = 0.95 + randomBetween(0, 5) / 100; // 95% - 100%
            const extensionStart = Math.round(clamp(nextYearMarket * loyaltyDiscount, MIN_SALARY, MAX_SALARY) / 10000) * 10000;
            const appended = buildYearlySalaries(Math.max(extensionStart, baseArray[baseArray.length - 1]), yearsToAppend + 1, { ...player, age: age + baseArray.length });
            appended.shift(); // drop the duplicated "start" year

            const newYearlySalaries = [...baseArray, ...appended].slice(0, totalYears);
            player.contract = {
                ...contract,
                yearlySalaries: newYearlySalaries,
                salary: newYearlySalaries[0],
                yearsLeft: newYearlySalaries.length,
                type: 'Guaranteed',
            };

            transactions.push({
                id: crypto.randomUUID(),
                week: state.week,
                season: state.season,
                type: 'Extension',
                description: `${team.name} extended ${formatPlayerForLog(player)} (${totalYears} yrs)`,
                teamName: team.name,
                playerIds: [player.id]
            });
        }

        refreshTeamFinances(team);
    });

    // --- 4. Re-signings ---
    updatedTeams.forEach(team => {
        if (freeAgents.length === 0) return;
        let reSignAttempts = 0;
        const reSignChance = 0.9;
        while (reSignAttempts < 2) {
            const reSignWindow = freeAgents
                .filter(agent => agent.previousTeam === team.name)
                .filter(agent => state.week - (agent.weekAdded ?? state.week) <= 2)
                .sort((a, b) => (b.player.overall ?? 0) - (a.player.overall ?? 0));

            const candidate = reSignWindow[0];
            if (!candidate) break;
            if (Math.random() > reSignChance) break;
            if (team.roster.length >= ROSTER_LIMIT) break;

            const budget = getBudget(team);
            const playerCopy = { ...candidate.player, team: team.name };
            if (getPlayerAskSalary(candidate.player) > budget) break;
            playerCopy.contract = buildContract(candidate.player, 'Guaranteed', budget);

            team.roster.push(playerCopy);
            const index = freeAgents.findIndex(agent => agent.player.id === candidate.player.id && agent.reason === candidate.reason);
            if (index > -1) freeAgents.splice(index, 1);

            refreshTeamFinances(team);
            transactions.push({
                id: crypto.randomUUID(),
                week: state.week,
                season: state.season,
                type: 'Re-Signing',
                description: `${team.name} re-signed ${formatPlayerForLog(playerCopy)}`,
                teamName: team.name,
                playerIds: [playerCopy.id]
            });

            reSignAttempts++;
        }
    });

    // --- 5. Signings ---
    updatedTeams.forEach(team => {
        if (!freeAgents.length) return;
        let signingAttempts = 0;
        const maxSigningRounds = Math.max(1, Math.min(2, ROSTER_LIMIT - team.roster.length));
        while (signingAttempts < maxSigningRounds && freeAgents.length) {
            const guaranteed = team.roster.filter(p => p.contract?.type !== 'Two-Way').length;
            const hasRoom = team.roster.length < ROSTER_LIMIT;
            const needsGuaranteed = guaranteed < 14;
            const depthPush = hasRoom && Math.random() < 0.55;
            if (!needsGuaranteed && !depthPush) break;
            if (!hasRoom) break;

            const budget = getBudget(team);
            const sortedFreeAgents = [...freeAgents].sort((a, b) => (b.player.overall ?? 0) - (a.player.overall ?? 0));
            const affordable = sortedFreeAgents.filter(agent => getPlayerAskSalary(agent.player) <= budget);
            const signingTarget = affordable[0];
            if (!signingTarget) break;

            const contractType = team.roster.length >= 15 ? 'Two-Way' : 'Guaranteed';
            const playerCopy = { ...signingTarget.player, team: team.name };
            playerCopy.contract = buildContract(signingTarget.player, contractType, budget);

            team.roster.push(playerCopy);
            const faIndex = freeAgents.findIndex(agent => agent.player.id === signingTarget.player.id && agent.reason === signingTarget.reason);
            if (faIndex > -1) freeAgents.splice(faIndex, 1);

            refreshTeamFinances(team);
            transactions.push({
                id: crypto.randomUUID(),
                week: state.week,
                season: state.season,
                type: 'Signing',
                description: `${team.name} signed ${formatPlayerForLog(playerCopy)}`,
                teamName: team.name,
                playerIds: [playerCopy.id]
            });

            signingAttempts++;
        }
    });

    return {
        ...state,
        nbaTeams: updatedTeams,
        nbaFreeAgents: freeAgents,
        nbaTransactions: transactions,
        nbaDraftPickAssets: draftPickAssets
    };
};
export const pipelineBonus = 0;
export const userCoachSkills: string[] = [];
// NBAFreeAgent stub removed

export const runSimulationForWeek = (
    state: GameState, 
    week: number, 
    teams: Team[], 
    recruits: Recruit[], 
    nbaTeams?: Team[], 
    nbaSchedule?: GameResult[][],
    nbaFreeAgents: any[] = [],
    userCoachSkills?: string[],
    playbook?: any
): { 
    updatedAllTeams: Team[], 
    updatedSchedule: GameResult[][], 
    updatedRecruits: Recruit[], 
    gameLogs: GameBoxScore[], 
    newUserTeamAttendance: GameAttendanceRecord[], 
    updatedCoach: Coach | null, 
    updatedNBATeams?: Team[], 
    updatedNBASchedule?: GameResult[][],
    updatedNBAFreeAgents?: any[],
    nbaTransactions?: any[],
    mockDraftProjections?: any,
    mockDraftProjectionDiffs?: any,
    customDraftPickRules?: any,
    nbaDraftPickAssets?: DraftPickAsset[]
} => {
    const gameDayMatchups = state.schedule[week - 1] || [];
    const gameLogs: GameBoxScore[] = [];
    const newUserTeamAttendance: GameAttendanceRecord[] = [];
    const teamsCopy: Team[] = JSON.parse(JSON.stringify(teams));
    const teamsByName = new Map<string, Team>(teamsCopy.map((t: Team) => [t.name, t]));
    let updatedCoach = state.coach ? JSON.parse(JSON.stringify(state.coach)) as Coach : null;

    const recordGameDay = (homeTeam: Team, awayTeam: Team, gameId: string) => {
        const forecast = calculateAttendance(homeTeam, awayTeam, week, playbook || []);

        const arena = ensureArenaFacility(homeTeam);
        const attendanceEntry: GameAttendanceRecord = {
            gameId,
            opponent: awayTeam.name,
            attendance: forecast.attendance,
            capacity: forecast.capacity,
            revenue: forecast.revenue,
            week,
            simulated: false,
            segmentData: forecast.segments?.map(seg => ({
                key: seg.key,
                revenue: Math.round(seg.filled * seg.price),
                attendance: seg.filled,
                price: seg.price,
            })),
        };
        // Avoid duplicate logs if a week is simulated/replayed.
        arena.attendanceLog = [
            ...(arena.attendanceLog || []).filter(entry => entry.gameId !== gameId),
            attendanceEntry,
        ];
        homeTeam.facilities = { ...(homeTeam.facilities || {}), arena };

        // Apply finances (ticket + concessions + parking) for the home team.
        const prices = homeTeam.prices ?? DEFAULT_TEAM_PRICES;
        const willingness = calculateFanWillingness(homeTeam);
        const foodDemandFactor = priceDemandFactor(prices.concessionFoodPrice, willingness.concessionFood, 1.65, 1.5);
        const drinkDemandFactor = priceDemandFactor(prices.concessionDrinkPrice, willingness.concessionDrink, 1.55, 1.5);
        const concessionRevenue = Math.round(
            forecast.attendance *
            (prices.concessionFoodPrice * foodDemandFactor +
                prices.concessionDrinkPrice * drinkDemandFactor)
        );
        const parkingRevenue = Math.round(calculateDetailedParkingRevenue(homeTeam, forecast.attendance));

        recordFinancialTransaction(homeTeam, state.season, week, {
            description: `Ticket Revenue vs ${awayTeam.name}`,
            category: 'Game Day Revenue',
            amount: Math.round(forecast.revenue),
            revenueKey: 'gateRevenue',
        });
        if (concessionRevenue) {
            recordFinancialTransaction(homeTeam, state.season, week, {
                description: `Concessions vs ${awayTeam.name}`,
                category: 'Game Day Revenue',
                amount: concessionRevenue,
                revenueKey: 'concessionsRevenue',
            });
        }
        if (parkingRevenue) {
            recordFinancialTransaction(homeTeam, state.season, week, {
                description: `Parking vs ${awayTeam.name}`,
                category: 'Game Day Revenue',
                amount: parkingRevenue,
                revenueKey: 'parkingRevenue',
            });
        }

        // Promotional event costs post on the game day (when the date passes), then the event is marked resolved.
        const scheduledPromo = homeTeam.eventCalendar?.find(e => e.week === week && e.status === 'pending');
        if (scheduledPromo) {
            const promoEntry = (playbook || []).find(p => p.id === scheduledPromo.playbookId);
            if (promoEntry?.cost) {
                recordFinancialTransaction(homeTeam, state.season, week, {
                    description: `Promotion: ${promoEntry.label} vs ${awayTeam.name}`,
                    category: 'Expense',
                    amount: -Math.abs(promoEntry.cost),
                    expenseKey: 'marketingExpenses',
                });
            }
            homeTeam.eventCalendar = (homeTeam.eventCalendar || []).map(e =>
                e.id === scheduledPromo.id ? { ...e, status: 'resolved' as const } : e
            );
        }

        // Travel costs only for the away team.
        const projectedTravel = awayTeam.initialProjectedRevenue?.travelExpenses ?? calculateTeamRevenue(awayTeam, null).travelExpenses;
        const awayGames = 16;
        const travelCost = Math.round((projectedTravel || 0) / awayGames);
        if (travelCost > 0) {
            recordFinancialTransaction(awayTeam, state.season, week, {
                description: `Travel & Logistics @ ${homeTeam.name}`,
                category: 'Expense',
                amount: -travelCost,
                expenseKey: 'travelExpenses',
            });
        }

        return forecast;
    };

    // --- NCAA Simulation ---
    for (const game of gameDayMatchups) {
        const homeTeam = teamsByName.get(game.homeTeam);
        const awayTeam = teamsByName.get(game.awayTeam);
        if (homeTeam && awayTeam) {
            const gameId = `S${state.season}G${week}-${homeTeam.name}v${awayTeam.name}`;

            // Full-game simulation
            const isUserGame = homeTeam.name === state.userTeam?.name || awayTeam.name === state.userTeam?.name;
            
            const skillsToPass = isUserGame ? userCoachSkills : undefined;
            const simulatedGameResult = simulateGame(homeTeam, awayTeam, gameId, undefined, skillsToPass);
            
            gameLogs.push(simulatedGameResult);

            const forecast = recordGameDay(homeTeam, awayTeam, gameId);
            if (homeTeam.name === state.userTeam?.name) {
                newUserTeamAttendance.push({
                    gameId,
                    opponent: awayTeam.name,
                    attendance: forecast.attendance,
                    capacity: forecast.capacity,
                    revenue: forecast.revenue,
                    week,
                    simulated: false,
                });
            }
        }
    }

    gameLogs.forEach(boxScore => {
        const homeTeam = teamsByName.get(boxScore.homeTeam);
        const awayTeam = teamsByName.get(boxScore.awayTeam);
        if (!homeTeam || !awayTeam) return;

                    if (boxScore.homeScore > boxScore.awayScore) {
                        homeTeam.record.wins++;
                        awayTeam.record.losses++;
                        applyHeadCoachResult(homeTeam, true);
                        applyHeadCoachResult(awayTeam, false);
                        homeTeam.fanInterest += 0.5;
                        awayTeam.fanInterest -= 0.5;
                        homeTeam.playbookFamiliarity = clamp(homeTeam.playbookFamiliarity + 2, 0, 100);
                        awayTeam.playbookFamiliarity = clamp(awayTeam.playbookFamiliarity + 1, 0, 100);
                        homeTeam.fanMorale = clamp(homeTeam.fanMorale + 3, 0, 100);
                        awayTeam.fanMorale = clamp(awayTeam.fanMorale - 2, 0, 100);
                        if(homeTeam.isUserTeam && updatedCoach) {
                                                updatedCoach.contract.progress.wins++;
                                                updatedCoach.xp += 10; // XP for winning a game
                                                if (updatedCoach.xp >= updatedCoach.level * 10) { // Simple leveling system
                                                    updatedCoach.level++;
                                                    updatedCoach.skillPoints++;
                                                    updatedCoach.xp = updatedCoach.xp - (updatedCoach.level - 1) * 10;
                                                }                        }
                    } else {
                                    awayTeam.record.wins++;
                                    homeTeam.record.losses++;
                                    applyHeadCoachResult(awayTeam, true);
                                    applyHeadCoachResult(homeTeam, false);
                                    awayTeam.fanInterest += 0.5;
                                    homeTeam.fanInterest -= 0.5;
                                    awayTeam.playbookFamiliarity = clamp(awayTeam.playbookFamiliarity + 2, 0, 100);
                                    homeTeam.playbookFamiliarity = clamp(homeTeam.playbookFamiliarity + 1, 0, 100);
                                    awayTeam.fanMorale = clamp(awayTeam.fanMorale + 3, 0, 100);
                                    homeTeam.fanMorale = clamp(homeTeam.fanMorale - 2, 0, 100);
                                    if(homeTeam.isUserTeam && updatedCoach) {
                                                            updatedCoach.xp += 2; // XP for losing a game
                                                            if (updatedCoach.xp >= updatedCoach.level * 10) { // Simple leveling system
                                                                updatedCoach.level++;
                                                                updatedCoach.skillPoints++;
                                                                updatedCoach.xp = updatedCoach.xp - (updatedCoach.level - 1) * 10;
                                                            }                                    }
                                }

        [...boxScore.homeTeamStats, ...boxScore.awayTeamStats].forEach(playerStat => {
            const isHomePlayer = homeTeam.roster.some((p: Player) => p.id === playerStat.playerId);
            const teamToUpdate = isHomePlayer ? homeTeam : awayTeam;
            const player = teamToUpdate.roster.find((p: Player) => p.id === playerStat.playerId);
            if (player) {
                player.seasonStats.gamesPlayed++;
                player.seasonStats.points += playerStat.stats.points;
                player.seasonStats.rebounds += playerStat.stats.rebounds;
                player.seasonStats.assists += playerStat.stats.assists;
                player.seasonStats.minutes = (player.seasonStats.minutes || 0) + (playerStat.stats.minutes ?? 0);
            }
        });
    });

    const updatedSchedule = state.schedule.map((gameDay, index) =>
        index === week - 1
            ? gameDay.map(game => {
                const log = gameLogs.find(l => l.homeTeam === game.homeTeam && l.awayTeam === game.awayTeam);
                return log ? { ...game, homeScore: log.homeScore, awayScore: log.awayScore, played: true } : game;
            })
            : gameDay
    );

    // --- NBA Simulation ---
    let updatedNBATeams: Team[] | undefined = undefined;
    let updatedNBASchedule: GameResult[][] | undefined = undefined;
    let updatedNBAFreeAgents: any[] | undefined = undefined;
    let nbaTransactions: any[] | undefined = undefined;
    let nbaDraftPickAssets: DraftPickAsset[] | undefined = undefined;

    if (nbaTeams && nbaSchedule) {
        const nbaTeamsCopy: Team[] = JSON.parse(JSON.stringify(nbaTeams));
        const nbaTeamsByName = new Map<string, Team>(nbaTeamsCopy.map((t: Team) => [t.name, t]));
        const nbaWeekGames = nbaSchedule[week - 1] || [];
        const nbaGameLogs: GameBoxScore[] = [];

        nbaWeekGames.forEach(game => {
             if (game.played) return;

             const homeTeam = nbaTeamsByName.get(game.homeTeam);
             const awayTeam = nbaTeamsByName.get(game.awayTeam);
             if (homeTeam && awayTeam) {
                 const gameId = `NBA-S${state.season}W${week}-${homeTeam.name}v${awayTeam.name}`;
                 nbaGameLogs.push(simulateGame(homeTeam, awayTeam, gameId));
             }
        });

        nbaGameLogs.forEach(boxScore => {
            const homeTeam = nbaTeamsByName.get(boxScore.homeTeam);
            const awayTeam = nbaTeamsByName.get(boxScore.awayTeam);
            if (!homeTeam || !awayTeam) return;

            if (boxScore.homeScore > boxScore.awayScore) {
                homeTeam.record.wins++;
                awayTeam.record.losses++;
            } else {
                awayTeam.record.wins++;
                homeTeam.record.losses++;
            }

            // Update NBA Stats
             [...boxScore.homeTeamStats, ...boxScore.awayTeamStats].forEach(playerStat => {
                const isHomePlayer = homeTeam.roster.some((p: Player) => p.id === playerStat.playerId);
                const teamToUpdate = isHomePlayer ? homeTeam : awayTeam;
                const player = teamToUpdate.roster.find((p: Player) => p.id === playerStat.playerId);
                if (player) {
                    if (!player.nbaStats) player.nbaStats = { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 };
                    player.nbaStats.gamesPlayed++;
                    player.nbaStats.points += playerStat.stats.points;
                    player.nbaStats.rebounds += playerStat.stats.rebounds;
                    player.nbaStats.assists += playerStat.stats.assists;
                    player.nbaStats.minutes = (player.nbaStats.minutes || 0) + (playerStat.stats.minutes ?? 0);
                }
            });
        });

        // Process Weekly Moves (Transactions)
        const transactionResult = processNBAWeeklyMoves({
            ...state,
            nbaTeams: nbaTeamsCopy,
            nbaFreeAgents: nbaFreeAgents || [],
            nbaTransactions: [],
            season: state.season,
            week: week
        } as GameState);

        updatedNBATeams = transactionResult.nbaTeams;
        updatedNBAFreeAgents = transactionResult.nbaFreeAgents;
        nbaTransactions = transactionResult.nbaTransactions;
        nbaDraftPickAssets = transactionResult.nbaDraftPickAssets;

        updatedNBASchedule = nbaSchedule.map((gameDay, index) =>
            index === week - 1
                ? gameDay.map(game => {
                    const log = nbaGameLogs.find(l => l.homeTeam === game.homeTeam && l.awayTeam === game.awayTeam);
                    return log ? { ...game, homeScore: log.homeScore, awayScore: log.awayScore, played: true } : game;
                })
                : gameDay
        );
    }

    const teamsWithDevelopment = processInSeasonDevelopment(teamsCopy, userCoachSkills);
    const { updatedRecruits } = processRecruitingWeek(
        teamsWithDevelopment,
        recruits,
        state.userTeam!.name,
        week,
        state.schedule,
        false,
        state.contactsMadeThisWeek,
        getContactPoints(state.userTeam),
        userCoachSkills,
        userCoachSkills,
        { 
            skipCpuActions: (state.recruitingCadence ?? 'weekly') === 'daily',
            startDate: state.currentDate,
            useDailyCommitments: (state.recruitingCadence ?? 'weekly') === 'daily'
        }
    );

    return { updatedAllTeams: teamsWithDevelopment, updatedSchedule, updatedRecruits, gameLogs, newUserTeamAttendance, updatedCoach, updatedNBATeams, updatedNBASchedule, updatedNBAFreeAgents, nbaTransactions, nbaDraftPickAssets: nbaDraftPickAssets ?? state.nbaDraftPickAssets };
};

// NOTE: Weekly simulation is legacy-only. The game now advances one day at a time and simulates
// only the scheduled games that occur on `currentDate`. Do not reintroduce week-based sim UI.
export const runSimulationForDate = (
    state: GameState,
    dateISO: string,
    teams: Team[],
    schedule: GameResult[][],
    userCoachSkills?: string[],
    playbook?: any
): {
    updatedAllTeams: Team[],
    updatedSchedule: GameResult[][],
    gameLogs: GameBoxScore[],
    newUserTeamAttendance: GameAttendanceRecord[],
    updatedCoach: Coach | null,
    simulatedWeeks: number[],
    processedEventIds: string[]
} => {
    const eventsToday = (state.eventQueue || []).filter(e => e.type === EventType.GAME && isSameISO(e.date, dateISO) && !e.processed);
    const processedEventIds: string[] = [];
    const simulatedWeeksSet = new Set<number>();

    const gameLogs: GameBoxScore[] = [];
    const newUserTeamAttendance: GameAttendanceRecord[] = [];
    const teamsCopy: Team[] = JSON.parse(JSON.stringify(teams));
    const teamsByName = new Map<string, Team>(teamsCopy.map((t: Team) => [t.name, t]));
    const updatedSchedule: GameResult[][] = JSON.parse(JSON.stringify(schedule));
    let updatedCoach = state.coach ? JSON.parse(JSON.stringify(state.coach)) as Coach : null;

    const recordGameDay = (homeTeam: Team, awayTeam: Team, week: number, gameId: string) => {
        const forecast = calculateAttendance(homeTeam, awayTeam, week, playbook || []);

        const arena = ensureArenaFacility(homeTeam);
        const attendanceEntry: GameAttendanceRecord = {
            gameId,
            opponent: awayTeam.name,
            attendance: forecast.attendance,
            capacity: forecast.capacity,
            revenue: forecast.revenue,
            week,
            simulated: false,
            segmentData: forecast.segments?.map(seg => ({
                key: seg.key,
                revenue: Math.round(seg.filled * seg.price),
                attendance: seg.filled,
                price: seg.price,
            })),
        };
        arena.attendanceLog = [
            ...(arena.attendanceLog || []).filter(entry => entry.gameId !== gameId),
            attendanceEntry,
        ];
        homeTeam.facilities = { ...(homeTeam.facilities || {}), arena };

        const prices = homeTeam.prices ?? DEFAULT_TEAM_PRICES;
        const willingness = calculateFanWillingness(homeTeam);
        const foodDemandFactor = priceDemandFactor(prices.concessionFoodPrice, willingness.concessionFood, 1.65, 1.5);
        const drinkDemandFactor = priceDemandFactor(prices.concessionDrinkPrice, willingness.concessionDrink, 1.55, 1.5);
        const concessionRevenue = Math.round(
            forecast.attendance *
            (prices.concessionFoodPrice * foodDemandFactor +
                prices.concessionDrinkPrice * drinkDemandFactor)
        );
        const parkingRevenue = Math.round(calculateDetailedParkingRevenue(homeTeam, forecast.attendance));

        recordFinancialTransaction(homeTeam, state.season, week, {
            description: `Ticket Revenue vs ${awayTeam.name}`,
            category: 'Game Day Revenue',
            amount: Math.round(forecast.revenue),
            revenueKey: 'gateRevenue',
        });
        if (concessionRevenue) {
            recordFinancialTransaction(homeTeam, state.season, week, {
                description: `Concessions vs ${awayTeam.name}`,
                category: 'Game Day Revenue',
                amount: concessionRevenue,
                revenueKey: 'concessionsRevenue',
            });
        }
        if (parkingRevenue) {
            recordFinancialTransaction(homeTeam, state.season, week, {
                description: `Parking vs ${awayTeam.name}`,
                category: 'Game Day Revenue',
                amount: parkingRevenue,
                revenueKey: 'parkingRevenue',
            });
        }

        const scheduledPromo = homeTeam.eventCalendar?.find(e => e.week === week && e.status === 'pending');
        if (scheduledPromo) {
            const promoEntry = (playbook || []).find((p: any) => p.id === scheduledPromo.playbookId);
            if (promoEntry?.cost) {
                recordFinancialTransaction(homeTeam, state.season, week, {
                    description: `Promotion: ${promoEntry.label} vs ${awayTeam.name}`,
                    category: 'Expense',
                    amount: -Math.abs(promoEntry.cost),
                    expenseKey: 'marketingExpenses',
                });
            }
            homeTeam.eventCalendar = (homeTeam.eventCalendar || []).map(e =>
                e.id === scheduledPromo.id ? { ...e, status: 'resolved' as const } : e
            );
        }

        const projectedTravel = awayTeam.initialProjectedRevenue?.travelExpenses ?? calculateTeamRevenue(awayTeam, null).travelExpenses;
        const awayGames = 16;
        const travelCost = Math.round((projectedTravel || 0) / awayGames);
        if (travelCost > 0) {
            recordFinancialTransaction(awayTeam, state.season, week, {
                description: `Travel & Logistics @ ${homeTeam.name}`,
                category: 'Expense',
                amount: -travelCost,
                expenseKey: 'travelExpenses',
            });
        }

        return forecast;
    };

    for (const event of eventsToday) {
        const week = Number(event.payload?.week || state.gameInSeason || 1);
        simulatedWeeksSet.add(week);
        processedEventIds.push(event.id);

        const homeTeam = teamsByName.get(event.payload?.homeTeam);
        const awayTeam = teamsByName.get(event.payload?.awayTeam);
        if (!homeTeam || !awayTeam) continue;

        const gameId = event.payload?.gameId || `S${state.season}D-${dateISO}-${homeTeam.name}v${awayTeam.name}`;
        const isUserGame = homeTeam.name === state.userTeam?.name || awayTeam.name === state.userTeam?.name;
        const skillsToPass = isUserGame ? userCoachSkills : undefined;
        const simulatedGameResult = simulateGame(homeTeam, awayTeam, gameId, undefined, skillsToPass);
        gameLogs.push(simulatedGameResult);

        const forecast = recordGameDay(homeTeam, awayTeam, week, gameId);
        if (homeTeam.name === state.userTeam?.name) {
            newUserTeamAttendance.push({
                gameId,
                opponent: awayTeam.name,
                attendance: forecast.attendance,
                capacity: forecast.capacity,
                revenue: forecast.revenue,
                week,
                simulated: false,
            });
        }

        const gamesForWeek = updatedSchedule[week - 1] || [];
        const gameIndex = gamesForWeek.findIndex(g =>
            (g as any).gameEventId === event.id ||
            ((g.homeTeam === homeTeam.name && g.awayTeam === awayTeam.name) && (!g.played || isSameISO(g.date || dateISO, dateISO)))
        );
        if (gameIndex !== -1) {
            gamesForWeek[gameIndex] = {
                ...gamesForWeek[gameIndex],
                homeScore: simulatedGameResult.homeScore,
                awayScore: simulatedGameResult.awayScore,
                played: true,
                date: gamesForWeek[gameIndex].date || dateISO,
            };
        }
        updatedSchedule[week - 1] = gamesForWeek;
    }

    gameLogs.forEach(boxScore => {
        const homeTeam = teamsByName.get(boxScore.homeTeam);
        const awayTeam = teamsByName.get(boxScore.awayTeam);
        if (!homeTeam || !awayTeam) return;

        if (boxScore.homeScore > boxScore.awayScore) {
            homeTeam.record.wins++;
            awayTeam.record.losses++;
            applyHeadCoachResult(homeTeam, true);
            applyHeadCoachResult(awayTeam, false);
            homeTeam.fanInterest += 0.5;
            awayTeam.fanInterest -= 0.5;
            homeTeam.playbookFamiliarity = clamp(homeTeam.playbookFamiliarity + 2, 0, 100);
            awayTeam.playbookFamiliarity = clamp(awayTeam.playbookFamiliarity + 1, 0, 100);
            homeTeam.fanMorale = clamp(homeTeam.fanMorale + 3, 0, 100);
            awayTeam.fanMorale = clamp(awayTeam.fanMorale - 2, 0, 100);
            if (homeTeam.isUserTeam && updatedCoach) {
                updatedCoach.contract.progress.wins++;
                updatedCoach.xp += 10;
                if (updatedCoach.xp >= updatedCoach.level * 10) {
                    updatedCoach.level++;
                    updatedCoach.skillPoints++;
                    updatedCoach.xp = updatedCoach.xp - (updatedCoach.level - 1) * 10;
                }
            }
        } else {
            awayTeam.record.wins++;
            homeTeam.record.losses++;
            applyHeadCoachResult(awayTeam, true);
            applyHeadCoachResult(homeTeam, false);
            awayTeam.fanInterest += 0.5;
            homeTeam.fanInterest -= 0.5;
            awayTeam.playbookFamiliarity = clamp(awayTeam.playbookFamiliarity + 2, 0, 100);
            homeTeam.playbookFamiliarity = clamp(homeTeam.playbookFamiliarity + 1, 0, 100);
            awayTeam.fanMorale = clamp(awayTeam.fanMorale + 3, 0, 100);
            homeTeam.fanMorale = clamp(homeTeam.fanMorale - 2, 0, 100);
            if (awayTeam.isUserTeam && updatedCoach) {
                updatedCoach.contract.progress.wins++;
                updatedCoach.xp += 10;
                if (updatedCoach.xp >= updatedCoach.level * 10) {
                    updatedCoach.level++;
                    updatedCoach.skillPoints++;
                    updatedCoach.xp = updatedCoach.xp - (updatedCoach.level - 1) * 10;
                }
            }
        }
    });

    return {
        updatedAllTeams: teamsCopy,
        updatedSchedule,
        gameLogs,
        newUserTeamAttendance,
        updatedCoach,
        simulatedWeeks: Array.from(simulatedWeeksSet.values()).sort((a, b) => a - b),
        processedEventIds,
    };
};


export const generateScheduleEvents = (teams: Team[]): { events: GameEvent[]; schedule: GameResult[][] } => {
    const events: GameEvent[] = [];
    // Legacy schedule array for compatibility, assuming 30 weeks
    const schedule: GameResult[][] = Array(30).fill(null).map(() => []);

    // Helper to add event
    const addGameEvent = (date: string, home: Team, away: Team, week: number) => {
        const gameId = crypto.randomUUID();
        const event: GameEvent = {
            id: gameId,
            date,
            type: EventType.GAME,
            label: `${away.name} @ ${home.name}`,
            processed: false,
            payload: {
                gameId,
                homeTeam: home.name,
                awayTeam: away.name,
                isConference: home.conference === away.conference,
                week
            },
        };
        events.push(event);

        // Also populate legacy schedule for now
        schedule[week - 1].push({
            homeTeam: home.name,
            awayTeam: away.name,
            homeScore: 0,
            awayScore: 0,
            played: false,
            date,
            gameEventId: gameId,
            // winner: null,
            isConference: home.conference === away.conference,
            overtime: false
        });
    };

    // --- 1. Non-Conference (Nov - Dec) ---
    // Weeks 1-8. Each team plays ~8-10 games.
    const nonConfWeeks = 8;
    
    // Simple randomized matching for now to ensure every team plays
    for (let w = 1; w <= nonConfWeeks; w++) {
        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        // Pair them up
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                const home = shuffled[i];
                const away = shuffled[i+1];
                // Games happen on Tue, Thu, Sat in early season usually
                // Simple: Week 1 games on Day 1, Week 2 on Day 7+ etc
                // Just spreading them out slightly for demo
                const dayOffset = (w - 1) * 7 + (i % 3) * 2; // Spread across the week
                const gameDate = addDaysISO(SEASON_START_DATE, dayOffset);
                addGameEvent(gameDate, home, away, w);
            }
        }
    }

    // --- 2. Conference Play (Jan - Feb) ---
    // Weeks 9-20. 
    // Group by conference
    const conferences = Array.from(new Set(teams.map(t => t.conference)));
    conferences.forEach(conf => {
        if (!conf) return;
        const confTeams = teams.filter(t => t.conference === conf);
        if (confTeams.length < 2) return;

        // Round robin (simple: each plays each other once or twice)
        // For simplicity: pairings for weeks 9-22
        const startWeek = 9;
        const totalConfWeeks = 12;
        
        for (let w = 0; w < totalConfWeeks; w++) {
            const weekNum = startWeek + w;
            // Create pairings for this week
            // Using a simple rotation or random pair that hasn't played much?
            // "Swiss" style or simple shuffle for MVP
            const shuffled = [...confTeams].sort(() => Math.random() - 0.5);
            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    const home = shuffled[i];
                    const away = shuffled[i+1];
                     const dayOffset = (weekNum - 1) * 7 + (i % 2) * 2; // Tue/Thu/Sat
                    const gameDate = addDaysISO(SEASON_START_DATE, dayOffset);
                    addGameEvent(gameDate, home, away, weekNum);
                }
            }
        }
    });

    // Sort events by date
    events.sort((a, b) => {
        return a.date.localeCompare(b.date);
    });

    return { events, schedule };
};


// Restored Functions

export const initializeEconomy = (team: Team): Team => {
    const updatedTeam = { ...team };

    // Ensure facilities exist (fix for legacy saves / missing init)
    if (!updatedTeam.facilities) {
        updatedTeam.facilities = {
            arena: ensureArenaFacility(updatedTeam),
            training: { level: 1, quality: 50, maintenanceCost: 10000, equipmentLevel: 1 },
            medical: { level: 1, quality: 50, maintenanceCost: 10000 },
            scouting: { level: 1, quality: 50, maintenanceCost: 10000, networkReach: 10 },
            coaching: { level: 1, quality: 50, maintenanceCost: 10000, technologyLevel: 1 },
            academic: { level: 1, quality: 50, maintenanceCost: 5000, tutorQuality: 1 },
            nutrition: { level: 1, quality: 50, maintenanceCost: 8000, diningQuality: 1 },
            housing: { level: 1, quality: 50, maintenanceCost: 15000, luxuryLevel: 1 }
        };
    } else {
        // Retrofit existing saves
        if (!updatedTeam.facilities.training) updatedTeam.facilities.training = { level: 1, quality: 50, maintenanceCost: 10000, equipmentLevel: 1 };
        if (!updatedTeam.facilities.medical) updatedTeam.facilities.medical = { level: 1, quality: 50, maintenanceCost: 10000 };
        if (!updatedTeam.facilities.scouting) updatedTeam.facilities.scouting = { level: 1, quality: 50, maintenanceCost: 10000, networkReach: 10 };
        if (!updatedTeam.facilities.coaching) updatedTeam.facilities.coaching = { level: 1, quality: 50, maintenanceCost: 10000, technologyLevel: 1 };
        if (!updatedTeam.facilities.academic) updatedTeam.facilities.academic = { level: 1, quality: 50, maintenanceCost: 5000, tutorQuality: 1 };
        if (!updatedTeam.facilities.nutrition) updatedTeam.facilities.nutrition = { level: 1, quality: 50, maintenanceCost: 8000, diningQuality: 1 };
        if (!updatedTeam.facilities.housing) updatedTeam.facilities.housing = { level: 1, quality: 50, maintenanceCost: 15000, luxuryLevel: 1 };
    }

    // Ensure new economy fields exist
    if (!updatedTeam.ticketZones) {
        const capacity = updatedTeam.facilities?.arena?.capacity || 5000;
        updatedTeam.ticketZones = [
            { id: 'Courtside', name: 'Courtside', capacity: Math.round(capacity * 0.02), price: 150, attendance: 0, dynamicPricing: { rivalryPremium: true, rankedPremium: true, cupcakeDiscount: false } },
            { id: 'Club', name: 'Club Level', capacity: Math.round(capacity * 0.10), price: 75, attendance: 0, dynamicPricing: { rivalryPremium: true, rankedPremium: true, cupcakeDiscount: false } },
            { id: 'LowerBowl', name: 'Lower Bowl', capacity: Math.round(capacity * 0.38), price: 40, attendance: 0, dynamicPricing: { rivalryPremium: true, rankedPremium: true, cupcakeDiscount: false } },
            { id: 'UpperDeck', name: 'Upper Deck', capacity: Math.round(capacity * 0.50), price: 15, attendance: 0, dynamicPricing: { rivalryPremium: false, rankedPremium: false, cupcakeDiscount: true } }
        ];
    }
    
    // Initialize default items if missing (for existing saves)
    if (!updatedTeam.concessions?.items || updatedTeam.concessions.items.length === 0) {
        updatedTeam.concessions = {
            ...updatedTeam.concessions,
            tier: 'Standard',
            alcoholPolicy: true,
            items: [
                { id: 'hotdog', name: 'Hot Dog', type: 'Staple', costPerUnit: 1.50, price: 6.00, demandMultiplier: 1.0, supplierTier: 'Standard' },
                { id: 'beer', name: 'Draft Beer', type: 'Premium', costPerUnit: 2.00, price: 11.00, demandMultiplier: 1.2, supplierTier: 'Standard' },
                { id: 'nachos', name: 'Nachos', type: 'Staple', costPerUnit: 2.50, price: 8.00, demandMultiplier: 0.9, supplierTier: 'Standard' },
                { id: 'burger', name: 'Gourmet Burger', type: 'Premium', costPerUnit: 4.50, price: 14.00, demandMultiplier: 0.8, supplierTier: 'Gourmet' }
            ]
        };
    }

    if (!updatedTeam.merchandising?.items || updatedTeam.merchandising.items.length === 0) {
        updatedTeam.merchandising = {
            ...updatedTeam.merchandising,
            inventoryStrategy: 'JustInTime',
            jerseySales: {},
            items: [
                { id: 'jersey', name: 'Replica Jersey', type: 'Authentic', costPerUnit: 35, price: 90, inventory: 1000, demandMultiplier: 1.0, inventoryStrategy: 'JustInTime' },
                { id: 'tshirt', name: 'Team T-Shirt', type: 'Apparel', costPerUnit: 8, price: 30, inventory: 5000, demandMultiplier: 1.5, inventoryStrategy: 'Bulk' },
                { id: 'hat', name: 'Snapback Hat', type: 'Apparel', costPerUnit: 12, price: 35, inventory: 2000, demandMultiplier: 1.1, inventoryStrategy: 'Bulk' }
            ]
        };
    }

    // Initialize Alumni if missing or outdated
    if (!updatedTeam.alumniRegistry) {
        updatedTeam.alumniRegistry = generateBaselineAlumniRegistry(updatedTeam);
    } else if (!updatedTeam.alumniRegistry.activeInfluence) {
        updatedTeam.alumniRegistry = recalculateAlumniInfluence(updatedTeam.alumniRegistry);
    }

    // Initialize War Chest
    if (!updatedTeam.warChest) {
        updatedTeam.warChest = {
            discretionaryBudget: 0,
            requests: []
        };
    }

    // Initialize/retrofit booster + alumni network fields on wealth
    if (!updatedTeam.wealth) {
        updatedTeam.wealth = seedProgramWealth(updatedTeam.name, updatedTeam.prestige, updatedTeam.conference, updatedTeam.fanInterest);
    } else {
        if (typeof updatedTeam.wealth.boosterSentiment !== 'number') {
            updatedTeam.wealth.boosterSentiment = clamp(50 + (updatedTeam.wealth.donationLevel - 50) * 0.75, 0, 100);
        }
        if (typeof updatedTeam.wealth.boosterLiquidity !== 'number') {
            updatedTeam.wealth.boosterLiquidity = updatedTeam.warChest.discretionaryBudget || 0;
        }
        if (!updatedTeam.wealth.alumniNetwork) {
            updatedTeam.wealth.alumniNetwork = {
                strength: clamp(15 + updatedTeam.wealth.donationLevel * 0.35 + updatedTeam.wealth.boosterPool * 2, 0, 100),
                lastDonation: 0,
                lastDonationSeason: 0,
                lastDonationBreakdown: { nil: 0, facilities: 0, endowment: 0 },
            };
        }
        if (!Array.isArray(updatedTeam.wealth.boosterReasons)) {
            updatedTeam.wealth.boosterReasons = [];
        }
    }

    return updatedTeam;
};

export const updateTeamWithUserCoach = (team: Team, userCoach: Coach, season: number): Team => {
    // Create a new HeadCoach profile based on the user's coach data
    
    const newHeadCoach: HeadCoachProfile = {
        name: userCoach.name,
        age: userCoach.age,
        almaMater: userCoach.almaMater,
        style: userCoach.style,
        reputation: userCoach.reputation,
        careerStops: [...userCoach.careerStops],
        history: [...userCoach.history],
        draftedPlayers: [...(userCoach.draftedPlayers || [])],
        contract: userCoach.contract ? { 
            salary: userCoach.contract.salary, 
            yearsRemaining: userCoach.contract.yearsRemaining 
        } : undefined,
        seasons: userCoach.history.length,
        careerWins: userCoach.history.reduce((sum, h) => sum + h.wins, 0),
        careerLosses: userCoach.history.reduce((sum, h) => sum + h.losses, 0),
        seasonWins: 0,
        seasonLosses: 0,
        startSeason: userCoach.startSeason,
        lastTeam: team.name,
        championships: userCoach.history.filter(h => h.achievements.includes('National Champion')).length,
        finalFours: userCoach.history.filter(h => h.achievements.includes('Final Four')).length,
        sweetSixteens: userCoach.history.filter(h => h.achievements.includes('Sweet 16')).length,
        ncaaAppearances: userCoach.history.filter(h => h.achievements.includes('Tournament Appearance')).length,
    };

    return {
        ...team,
        headCoach: newHeadCoach,
        isUserTeam: true,
    };
};





export const applyNBAFreeAgentRetirementRules = (agents: NBAFreeAgent[]): NBAFreeAgent[] => {
    return agents.filter(agent => agent.player.age < 40);
};

const INTERNATIONAL_FREE_AGENT_POSITIONS: RosterPositions[] = ['PG', 'SG', 'SF', 'PF', 'C'];
const INTERNATIONAL_FREE_AGENT_COUNT = 50;

const generateInternationalFreeAgents = (count: number): NBAFreeAgent[] => {
    const topPlayerIndex = Math.floor(Math.random() * count);
    return Array.from({ length: count }, (_, index) => {
        const forcedPosition = pickRandom(INTERNATIONAL_FREE_AGENT_POSITIONS);
        const player = createPlayer('Pro', forcedPosition);
        let targetOverall = randomBetween(70, 80);
        if (index === topPlayerIndex) {
            targetOverall = 81;
        }
        tunePlayerToOverall(player, targetOverall);
        player.age = randomBetween(20, 27);
        player.experience = Math.max(1, (player.age ?? 22) - 19);
        player.contract = undefined;
        player.nbaStats = { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 };
        player.originDescription = 'International Free Agent';

        return {
            player,
            reason: 'Undrafted',
            previousTeam: undefined,
            seasonAdded: 0,
            weekAdded: 0
        };
    });
};

const tunePlayerToOverall = (player: Player, targetOverall: number) => {
    const statKeys = Object.keys(player.stats) as (keyof Player['stats'])[];
    let attempts = 0;
    while (Math.abs(player.overall - targetOverall) > 1 && attempts < 4) {
        const delta = targetOverall - player.overall;
        statKeys.forEach(stat => {
            const modifier = Math.max(1, Math.round(Math.abs(delta) * (stat === 'stamina' ? 0.18 : 0.32)));
            player.stats[stat] = clamp(
                player.stats[stat] + (delta > 0 ? modifier : -modifier),
                stat === 'stamina' ? 55 : 40,
                97
            );
        });
        player.overall = calculateOverall(player.stats);
        attempts++;
    }
    player.startOfSeasonOverall = player.overall;
};

export const generateInitialNBAFreeAgents = (): NBAFreeAgent[] => {
    const agents: NBAFreeAgent[] = [];
    agents.push(...generateInternationalFreeAgents(INTERNATIONAL_FREE_AGENT_COUNT));

    return agents.sort((a, b) => b.player.overall - a.player.overall);
};

export const processFacilityConstruction = (team: Team): Team => team;
export const degradeFacilities = (team: Team): Team => team;
export const generateSponsorOffers = (team: Team): SponsorOffer[] => [];
export const hireStaff = (team: Team, staff: Staff): Team => team;
export const updateConcessionPricing = (team: Team, itemId: string, price: number): Team => {
    const prices = team.prices ?? DEFAULT_TEAM_PRICES;
    const concessions = team.concessions || { tier: 'Standard' as ConcessionTier, alcoholPolicy: true, items: [] };
    const items = concessions.items || [];
    const nextItems = items.map(item => {
        if (item.id !== itemId) return item;
        const maxPrice = deriveMaxPriceFromCost(item.costPerUnit, 3.5, 10, 250);
        return { ...item, price: clamp(normalizeNonNegativeNumber(price, item.price), 0, maxPrice) };
    });

    const foodItems = nextItems.filter(i => !isLikelyDrinkItem(i.name));
    const drinkItems = nextItems.filter(i => isLikelyDrinkItem(i.name));
    const average = (values: number[]): number => values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
    const nextFood = foodItems.length ? average(foodItems.map(i => i.price)) : prices.concessionFoodPrice;
    const nextDrink = drinkItems.length ? average(drinkItems.map(i => i.price)) : prices.concessionDrinkPrice;

    return {
        ...team,
        concessions: { ...concessions, items: nextItems },
        prices: {
            ...prices,
            concessionFoodPrice: clamp(nextFood, 0, 250),
            concessionDrinkPrice: clamp(nextDrink, 0, 250),
        },
    };
};

export const updateMerchPricing = (team: Team, itemId: string, price: number): Team => {
    const prices = team.prices ?? DEFAULT_TEAM_PRICES;
    const merchandising = team.merchandising || { inventoryStrategy: 'JustInTime' as const, jerseySales: {}, items: [] };
    const items = merchandising.items || [];
    const nextItems = items.map(item => {
        if (item.id !== itemId) return item;
        const maxPrice = deriveMaxPriceFromCost(item.costPerUnit, 2.5, 10, 2000);
        return { ...item, price: clamp(normalizeNonNegativeNumber(price, item.price), 0, maxPrice) };
    });

    const jerseyItem = nextItems.find(i => i.id === 'jersey' || i.type === 'Authentic');
    const apparelItems = nextItems.filter(i => i.type === 'Apparel');
    const average = (values: number[]): number => values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
    const nextJersey = jerseyItem ? jerseyItem.price : prices.jerseyPrice;
    const nextMerch = apparelItems.length ? average(apparelItems.map(i => i.price)) : prices.merchandisePrice;

    return {
        ...team,
        merchandising: { ...merchandising, items: nextItems },
        prices: {
            ...prices,
            jerseyPrice: clamp(nextJersey, 0, 2000),
            merchandisePrice: clamp(nextMerch, 0, 2000),
        },
    };
};

export const updateTicketPricing = (team: Team, zoneId: string, price: number): Team => {
    const prices = team.prices ?? DEFAULT_TEAM_PRICES;
    const zones = team.ticketZones || [];
    if (!zones.length) return team;
    const nextZones = zones.map(zone => zone.id === zoneId ? { ...zone, price: clamp(normalizeNonNegativeNumber(price, zone.price), 0, 500) } : zone);
    const weightedAverage = nextZones.reduce((sum, zone) => sum + zone.price * zone.capacity, 0) / nextZones.reduce((sum, zone) => sum + zone.capacity, 0);
    return {
        ...team,
        ticketZones: nextZones,
        prices: { ...prices, ticketPrice: clamp(weightedAverage, 1, 250) },
    };
};

export const setMerchInventoryStrategy = (team: Team, strategy: string): Team => {
    const merchandising = team.merchandising || { inventoryStrategy: 'JustInTime' as const, jerseySales: {}, items: [] };
    const normalized: Team['merchandising']['inventoryStrategy'] =
        strategy === 'Conservative' || strategy === 'Aggressive' || strategy === 'JustInTime' || strategy === 'Bulk'
            ? (strategy as Team['merchandising']['inventoryStrategy'])
            : merchandising.inventoryStrategy;
    const itemStrategy: MerchStrategy = normalized === 'Bulk' || normalized === 'Aggressive' ? 'Bulk' : 'JustInTime';
    const nextItems = (merchandising.items || []).map(item => ({ ...item, inventoryStrategy: itemStrategy }));
    return { ...team, merchandising: { ...merchandising, inventoryStrategy: normalized, items: nextItems } };
};

export const toggleDynamicPricing = (team: Team, zoneId: string, rule: any): Team => {
    const zones = team.ticketZones || [];
    if (!zones.length) return team;
    const nextZones = zones.map(zone => {
        if (zone.id !== zoneId) return zone;
        const current = zone.dynamicPricing || { rivalryPremium: false, rankedPremium: false, cupcakeDiscount: false };
        return { ...zone, dynamicPricing: { ...current, ...(rule || {}) } };
    });
    return { ...team, ticketZones: nextZones };
};
export const setTravelSettings = (team: Team, method: any, accommodation: any): Team => team;
export const scheduleEvent = (team: Team, week: number, eventEntry: EventPlaybookEntry, opponent: string): Team => {
    const calendar = [...(team.eventCalendar || [])];
    const existingIndex = calendar.findIndex(e => e.week === week && e.status !== 'cancelled');

    const next = {
        id: existingIndex >= 0 ? calendar[existingIndex]!.id : crypto.randomUUID(),
        playbookId: eventEntry.id,
        week,
        opponent,
        status: 'pending' as const,
    };

    if (existingIndex >= 0) {
        calendar[existingIndex] = next;
    } else {
        calendar.push(next);
    }

    return { ...team, eventCalendar: calendar };
};

export const cancelEvent = (team: Team, eventId: string): Team => {
    const calendar = team.eventCalendar || [];
    if (!calendar.length) return team;

    const nextCalendar = calendar.map(e => (e.id === eventId ? { ...e, status: 'cancelled' as const } : e));
    return { ...team, eventCalendar: nextCalendar };
};

const hashToUnit = (value: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 0xffffffff;
};

const roundLabelToIndex = (label: string | undefined): number => {
    const normalized = (label || '').toLowerCase();
    if (normalized.includes('national') || normalized.includes('champ')) return 6;
    if (normalized.includes('runner')) return 5;
    if (normalized.includes('final four') || normalized.includes('final')) return 5;
    if (normalized.includes('elite 8') || normalized.includes('elite eight')) return 4;
    if (normalized.includes('sweet 16') || normalized.includes('sweet sixteen')) return 3;
    if (normalized.includes('round of 32') || normalized.includes('r32')) return 2;
    if (normalized.includes('round of 64') || normalized.includes('r64')) return 1;
    return 0;
};

const indexToRoundLabel = (index: number): string => {
    switch (index) {
        case 6: return 'National Championship';
        case 5: return 'Final Four';
        case 4: return 'Elite 8';
        case 3: return 'Sweet 16';
        case 2: return 'Round of 32';
        case 1: return 'Round of 64';
        default: return 'N/A';
    }
};

const clampScore = (value: number): number => clamp(value, 0, 100);

const scoreDeltaLinear = (actual: number, expected: number, pointsPerUnit: number): number => {
    const safeActual = Number.isFinite(actual) ? actual : 0;
    const safeExpected = Number.isFinite(expected) ? expected : 0;
    return clampScore(50 + (safeActual - safeExpected) * pointsPerUnit);
};

const scoreRatio = (actual: number, expected: number, pointsPerPct: number): number => {
    const safeActual = Math.max(0, Number.isFinite(actual) ? actual : 0);
    const safeExpected = Math.max(0, Number.isFinite(expected) ? expected : 0);
    if (safeExpected <= 0) return safeActual > 0 ? 100 : 50;
    const ratio = safeActual / safeExpected;
    return clampScore(50 + (ratio - 1) * pointsPerPct);
};

const normalizeWeights = (weights: Record<BoardMetricKey, number>): Record<BoardMetricKey, number> => {
    const total = Object.values(weights).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
    if (total <= 0) return { wins: 0.3, postseason: 0.25, pipeline: 0.1, brand: 0.15, finances: 0.2 };
    const out = { ...weights } as Record<BoardMetricKey, number>;
    (Object.keys(out) as BoardMetricKey[]).forEach(key => {
        out[key] = (Number.isFinite(out[key]) ? out[key] : 0) / total;
    });
    return out;
};

const pickBoardProfile = (team: Team, seedSalt: string): BoardProfile => {
    const prestige = team.prestige ?? 50;
    const r = hashToUnit(`${team.name}-${team.conference}-${seedSalt}`);
    if (prestige >= 80) {
        if (r < 0.60) return 'WinNow';
        if (r < 0.90) return 'Balanced';
        return 'BusinessFirst';
    }
    if (prestige >= 60) {
        if (r < 0.50) return 'Balanced';
        if (r < 0.75) return 'Builder';
        if (r < 0.90) return 'BusinessFirst';
        return 'WinNow';
    }
    if (r < 0.40) return 'Builder';
    if (r < 0.80) return 'Balanced';
    if (r < 0.95) return 'BusinessFirst';
    return 'WinNow';
};

const weightsForProfile = (profile: BoardProfile): Record<BoardMetricKey, number> => {
    switch (profile) {
        case 'WinNow':
            return normalizeWeights({ wins: 0.38, postseason: 0.30, pipeline: 0.12, brand: 0.08, finances: 0.12 });
        case 'BusinessFirst':
            return normalizeWeights({ wins: 0.18, postseason: 0.10, pipeline: 0.12, brand: 0.28, finances: 0.32 });
        case 'Builder':
            return normalizeWeights({ wins: 0.26, postseason: 0.18, pipeline: 0.26, brand: 0.12, finances: 0.18 });
        case 'Balanced':
        default:
            return normalizeWeights({ wins: 0.30, postseason: 0.24, pipeline: 0.12, brand: 0.14, finances: 0.20 });
    }
};

const estimateExpectedWins = (team: Team): number => {
    const prestige = Number.isFinite(team.prestige) ? team.prestige : 50;
    const roster = Array.isArray(team.roster) ? team.roster : [];
    const top8 = [...roster].sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0)).slice(0, 8);
    const top8Avg = top8.reduce((sum, p) => sum + (p.overall ?? 0), 0) / (top8.length || 1);
    const coachingQuality = team.facilities?.coaching?.quality ?? 50;
    const facilityBonus = (coachingQuality - 50) * 0.05;
    const rosterBonus = (top8Avg - 70) * 0.35;
    const base = 7 + prestige * 0.18 + rosterBonus + facilityBonus;
    return clamp(Math.round(base), 5, 30);
};

const estimateExpectedRound = (expectedWins: number, prestige: number): string => {
    const adjusted = expectedWins + Math.round((prestige - 50) / 25);
    if (adjusted >= 28) return 'Final Four';
    if (adjusted >= 25) return 'Elite 8';
    if (adjusted >= 22) return 'Sweet 16';
    if (adjusted >= 18) return 'Round of 32';
    return 'Round of 64';
};

const estimateExpectedDraftPicks = (team: Team): number => {
    const prestige = Number.isFinite(team.prestige) ? team.prestige : 50;
    const expected = Math.round(clamp((prestige - 55) / 18, 0, 3));
    return expected;
};

const estimateExpectedAttendanceFill = (team: Team): number => {
    const prestige = Number.isFinite(team.prestige) ? team.prestige : 50;
    const fanInterest = Number.isFinite(team.fanInterest) ? team.fanInterest : 50;
    const base = 0.55 + (prestige - 50) * 0.003 + (fanInterest - 50) * 0.002;
    return clamp(base, 0.35, 0.98);
};

export const generateBoardExpectations = (team: Team): BoardExpectations => {
    const previous = team.boardExpectations;
    const profile = previous?.boardProfile ?? pickBoardProfile(team, 'board-v1');
    const weights = previous?.weights ?? weightsForProfile(profile);

    const projected = team.initialProjectedRevenue ?? calculateTeamRevenue(team, null);
    const targetRevenue = Math.round((projected.totalRevenue || 0) * 1.05);
    const maxBudget = Math.round(targetRevenue * 0.95);

    const expectedWins = estimateExpectedWins(team);
    const prestige = Number.isFinite(team.prestige) ? team.prestige : 50;
    const targetTourneyRound = estimateExpectedRound(expectedWins, prestige);

    const projectedNetIncome = Math.max(0, Math.round((projected.totalRevenue || 0) - (projected.operationalExpenses || 0)));
    const targetNetIncome = Math.round(projectedNetIncome * 1.02);

    const targetDraftPicks = estimateExpectedDraftPicks(team);
    const targetAttendanceFillRate = estimateExpectedAttendanceFill(team);

    const targetJerseySales = Math.round(clamp((prestige - 50) * 120 + (team.fanInterest - 50) * 90, 0, 40000));

    return {
        targetWins: expectedWins,
        targetTourneyRound,
        targetNetIncome,
        targetRevenue,
        targetJerseySales,
        targetDraftPicks,
        targetAttendanceFillRate,
        boardProfile: profile,
        weights: normalizeWeights(weights),
        maxBudget,
        patience: previous?.patience ?? 100,
        pressure: previous?.pressure ?? 0,
        discretionaryFunds: previous?.discretionaryFunds ?? 0,
        jobSecurityStatus: previous?.jobSecurityStatus ?? 'Safe',
        metrics: previous?.metrics,
    };
};

export const toContractBoardExpectations = (seasonExpectations: BoardExpectations, contractLength: number): BoardExpectations => {
    const years = Math.max(1, Math.round(contractLength || 1));
    const currentMode = seasonExpectations.evaluationMode ?? 'season';
    const currentLength = Math.max(1, Math.round(seasonExpectations.contractLength || 1));

    const perSeasonWins = currentMode === 'contract'
        ? seasonExpectations.targetWins / currentLength
        : seasonExpectations.targetWins;

    const perSeasonNetIncome = currentMode === 'contract'
        ? seasonExpectations.targetNetIncome / currentLength
        : seasonExpectations.targetNetIncome;

    return {
        ...seasonExpectations,
        evaluationMode: years > 1 ? 'contract' : 'season',
        contractLength: years > 1 ? years : undefined,
        targetPostseasonCount: (() => {
            if (years <= 1) return undefined;
            const idx = roundLabelToIndex(seasonExpectations.targetTourneyRound);
            const fractionByIndex: Record<number, number> = {
                6: 0.15,
                5: 0.18,
                4: 0.25,
                3: 0.33,
                2: 0.50,
                1: 0.75,
                0: 0.50,
            };
            const fraction = fractionByIndex[idx] ?? 0.5;
            return clamp(Math.round(years * fraction), 1, years);
        })(),
        targetWins: Math.round(perSeasonWins * years),
        targetNetIncome: Math.round(perSeasonNetIncome * years),
    };
};

export const calculateBoardPressure = (
    team: Team,
    seasonRecord: UserSeasonRecord | null | undefined,
    draftResults: DraftPick[] | null | undefined,
    baselineExpectations: BoardExpectations | undefined,
    yearPerformance: Array<'Met' | 'Missed'>,
    coachContract?: CoachContract | null,
): { boardExpectations: BoardExpectations } => {
    const baseline = baselineExpectations ?? team.boardExpectations ?? generateBoardExpectations(team);
    const weights = normalizeWeights(baseline.weights);

    const contractYears = Math.max(1, Math.round(baseline.contractLength ?? coachContract?.totalYears ?? 1));
    const contractMode = (baseline.evaluationMode ?? 'season') === 'contract' && contractYears > 1 && !!coachContract;
    const yearsCompleted = contractMode
        ? clamp((coachContract?.totalYears ?? contractYears) - (coachContract?.yearsRemaining ?? 0), 1, contractYears)
        : 1;

    const wins = seasonRecord?.wins ?? team.record?.wins ?? 0;
    const actualWins = contractMode ? (coachContract?.progress?.wins ?? wins) : wins;
    const expectedWins = contractMode ? (baseline.targetWins / contractYears) * yearsCompleted : baseline.targetWins;
    const winSpread = contractMode ? 6 * yearsCompleted : 6;
    const winScore = scoreDeltaLinear(actualWins, expectedWins, winSpread);

    const actualRoundIndex = roundLabelToIndex(seasonRecord?.tournamentResult ?? baseline.targetTourneyRound);
    const expectedRoundIndex = roundLabelToIndex(baseline.targetTourneyRound);
    const postseasonScore = scoreDeltaLinear(actualRoundIndex, expectedRoundIndex, 22);

    const netIncome = (seasonRecord?.totalRevenue ?? 0) - (seasonRecord?.operationalExpenses ?? 0);
    const expectedNetIncome = contractMode ? (baseline.targetNetIncome / contractYears) : baseline.targetNetIncome;
    const financesScore = scoreRatio(netIncome, expectedNetIncome, 110);

    const attendance = seasonRecord?.gameAttendance ?? [];
    const fillSamples = attendance
        .map(r => (r.capacity && r.capacity > 0 ? r.attendance / r.capacity : null))
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const avgFill = fillSamples.length ? fillSamples.reduce((sum, v) => sum + v, 0) / fillSamples.length : null;
    const fillScore = avgFill == null ? 50 : scoreRatio(avgFill, baseline.targetAttendanceFillRate, 180);

    const jerseySales = team.merchandising?.jerseySales || {};
    const jerseyTracked = Object.keys(jerseySales).length > 0;
    const jerseyUnits = Object.values(jerseySales).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
    const jerseyScore = jerseyTracked ? scoreRatio(jerseyUnits, baseline.targetJerseySales, 90) : 50;
    const brandScore = clampScore(fillScore * 0.90 + jerseyScore * 0.10);

    const draftedThisYear = (draftResults || []).filter(pick => pick.originalTeam === team.name).length;
    const draftScore = scoreDeltaLinear(draftedThisYear, baseline.targetDraftPicks, 28);

    const alumni = team.alumniRegistry?.allAlumni || [];
    const season = seasonRecord?.season ?? 0;
    const nbaAlumniRecent = season > 0
        ? alumni.filter(a => a.proStatus !== 'none' && a.graduationSeason >= season - 8).length
        : alumni.filter(a => a.proStatus !== 'none').length;
    const expectedNbaAlumniRecent = Math.round(clamp((team.prestige - 55) / 10, 0, 8));
    const alumniScore = scoreDeltaLinear(nbaAlumniRecent, expectedNbaAlumniRecent, 8);
    const pipelineScore = clampScore(draftScore * 0.65 + alumniScore * 0.35);

    const components: BoardMetricResult[] = [
        {
            key: 'wins',
            label: 'Wins vs Expectation',
            weight: weights.wins,
            score: winScore,
            actual: actualWins,
            expected: expectedWins,
            displayActual: contractMode ? `${Math.round(actualWins)} (total)` : undefined,
            displayExpected: contractMode ? `${Math.round(expectedWins)} by Year ${yearsCompleted}/${contractYears}` : undefined,
        },
        {
            key: 'postseason',
            label: 'Postseason Results',
            weight: weights.postseason,
            score: postseasonScore,
            actual: actualRoundIndex,
            expected: expectedRoundIndex,
            displayActual: seasonRecord?.tournamentResult ?? indexToRoundLabel(actualRoundIndex),
            displayExpected: baseline.targetTourneyRound,
        },
        {
            key: 'pipeline',
            label: 'Pro Pipeline (Draft + Alumni)',
            weight: weights.pipeline,
            score: pipelineScore,
            actual: draftedThisYear,
            expected: baseline.targetDraftPicks,
            displayActual: `${draftedThisYear} drafted â€¢ ${nbaAlumniRecent} NBA alumni (8y)`,
            displayExpected: `${baseline.targetDraftPicks} drafted â€¢ ${expectedNbaAlumniRecent} NBA alumni (8y)`,
        },
        {
            key: 'brand',
            label: 'Brand (Attendance + Jerseys)',
            weight: weights.brand,
            score: brandScore,
            actual: avgFill ?? undefined,
            expected: baseline.targetAttendanceFillRate,
            displayActual: `${avgFill == null ? 'N/A' : `${Math.round(avgFill * 100)}%`} fill â€¢ ${jerseyTracked ? `${Math.round(jerseyUnits).toLocaleString()} jerseys` : 'jerseys N/A'}`,
            displayExpected: `${Math.round(baseline.targetAttendanceFillRate * 100)}% fill â€¢ ${jerseyTracked ? `${Math.round(baseline.targetJerseySales).toLocaleString()} jerseys` : 'jerseys N/A'}`,
        },
        {
            key: 'finances',
            label: 'Net Income',
            weight: weights.finances,
            score: financesScore,
            actual: netIncome,
            expected: expectedNetIncome,
        },
    ];

    const compositeScore = clampScore(
        components.reduce((sum, c) => sum + c.score * c.weight, 0) /
        Math.max(0.0001, components.reduce((sum, c) => sum + c.weight, 0))
    );

    const goalsMet = components.filter(c => c.score >= 60).length;

    const previousPatience = baseline.patience ?? 100;
    const performanceDelta = compositeScore - 50;
    const patienceChange = performanceDelta >= 0 ? 2 : -Math.min(18, Math.ceil(Math.abs(performanceDelta) / 3));
    const patience = clamp(previousPatience + patienceChange, 0, 100);
    const recentMisses = (yearPerformance || []).slice(-2).filter(r => r === 'Missed').length;
    const pressure = clamp(100 - patience + recentMisses * 12 + Math.max(0, 55 - compositeScore) * 0.5, 0, 100);

    let jobSecurityStatus: BoardExpectations['jobSecurityStatus'] = 'Safe';
    if (compositeScore >= 70) jobSecurityStatus = 'Safe';
    else if (compositeScore >= 55) jobSecurityStatus = 'Warm';
    else if (compositeScore >= 40) jobSecurityStatus = 'Hot';
    else jobSecurityStatus = 'Fired';

    if (jobSecurityStatus !== 'Fired' && patience < 18 && compositeScore < 50) {
        jobSecurityStatus = 'Fired';
    }

    const next = contractMode ? baseline : generateBoardExpectations({ ...team, boardExpectations: baseline });

    return {
        boardExpectations: {
            ...next,
            boardProfile: baseline.boardProfile,
            weights: baseline.weights,
            patience,
            pressure,
            jobSecurityStatus,
            metrics: {
                compositeScore,
                goalsMet,
                components,
                winScore,
                tourneyScore: postseasonScore,
                netIncomeScore: financesScore,
            },
        },
    };
};
export const updateStaffPayroll = (team: Team): Team => team;
export const startCapitalProject = (team: Team, project: any): Team => team;
export const contributeToProject = (team: Team, projectId: string, amount: number): Team => team;
export const requestFunds = (team: Team, type: string, amount: number, reason: string): { team: Team, approved: boolean, message: string } => ({ team, approved: false, message: "Request denied (Stub)" });
export const generatePoachingOffers = (team: Team, coach: any, allTeams: Team[], week: number): any[] => [];
const getNBATeamPowerRating = (team: Team): number => {
    const wins = team.record?.wins ?? 0;
    const losses = team.record?.losses ?? 0;
    const prestige = team.prestige ?? 75;
    const roster = [...(team.roster || [])].sort((a, b) => (b.overall || 0) - (a.overall || 0));
    const corePlayers = roster.slice(0, 8);
    const averageOverall = corePlayers.reduce((sum, player) => sum + (player.overall || 70), 0) / (corePlayers.length || 1);
    return averageOverall * 4 + prestige * 1.5 + (wins - losses) * 3;
};

const simulateNBASeries = (teamA: Team | undefined, teamB: Team | undefined) => {
    if (!teamA && !teamB) {
        return { winner: undefined, loser: undefined };
    }
    if (teamA && !teamB) return { winner: teamA, loser: undefined };
    if (!teamA && teamB) return { winner: teamB, loser: undefined };

    const ratingA = getNBATeamPowerRating(teamA!);
    const ratingB = getNBATeamPowerRating(teamB!);
    const total = ratingA + ratingB || 1;
    const baseProbability = clamp(ratingA / total, 0.25, 0.75);
    const randomness = (Math.random() - 0.5) * 0.12;
    const oddsForA = clamp(baseProbability + randomness, 0.2, 0.8);
    const roll = Math.random();
    return roll < oddsForA
        ? { winner: teamA!, loser: teamB! }
        : { winner: teamB!, loser: teamA! };
};

const seedConference = (teams: Team[], conference: 'East' | 'West'): Team[] => {
    return teams
        .filter(team => (team.conference || 'East') === conference)
        .sort((a, b) => {
            const winDiff = (b.record?.wins ?? 0) - (a.record?.wins ?? 0);
            if (winDiff !== 0) return winDiff;
            const lossDiff = (a.record?.losses ?? 0) - (b.record?.losses ?? 0);
            if (lossDiff !== 0) return lossDiff;
            return (b.prestige ?? 0) - (a.prestige ?? 0);
        });
};

const runConferenceBracket = (seededTeams: Team[]): Team | undefined => {
    if (seededTeams.length === 0) return undefined;
    const firstRoundPairs: Array<[number, number]> = [
        [0, 7], [3, 4], [1, 6], [2, 5]
    ];
    const winners: Team[] = [];
    firstRoundPairs.forEach(([a, b]) => {
        const teamA = seededTeams[a];
        const teamB = seededTeams[b];
        const result = simulateNBASeries(teamA, teamB);
        if (result.loser) result.loser.playoffFinish = 4;
        if (result.winner) winners.push(result.winner);
    });
    const semifinalists: Team[] = [];
    for (let i = 0; i < winners.length; i += 2) {
        const teamA = winners[i];
        const teamB = winners[i + 1];
        const result = simulateNBASeries(teamA, teamB);
        if (result.loser) result.loser.playoffFinish = 3;
        if (result.winner) semifinalists.push(result.winner);
    }
    const finalResult = simulateNBASeries(semifinalists[0], semifinalists[1]);
    if (finalResult.loser) finalResult.loser.playoffFinish = 2;
    return finalResult.winner ?? semifinalists[0] ?? winners[0] ?? seededTeams[0];
};

export const finalizeNBASeason = (teams: Team[], season: number): { updatedNBATeams: Team[], releasedPlayers: Player[], simulation: NBASimulationResult } => {
    const clonedTeams: Team[] = teams.map(team => ({
        ...team,
        record: { wins: team.record?.wins ?? 0, losses: team.record?.losses ?? 0 },
        roster: team.roster.map(player => ({ ...player })),
        playoffFinish: 5
    }));
    const releasedPlayers: Player[] = [];

    const eastChampion = runConferenceBracket(seedConference(clonedTeams, 'East'));
    const westChampion = runConferenceBracket(seedConference(clonedTeams, 'West'));
    const finalsResult = simulateNBASeries(eastChampion, westChampion);
    const championTeam = finalsResult.winner || eastChampion || westChampion;
    if (finalsResult.loser) finalsResult.loser.playoffFinish = 1;
    if (championTeam) championTeam.playoffFinish = 0;

    const draftOrder = [...clonedTeams].sort((a, b) => {
        const finishDiff = (b.playoffFinish ?? 5) - (a.playoffFinish ?? 5);
        if (finishDiff !== 0) return finishDiff;
        const winDiff = (a.record?.wins ?? 0) - (b.record?.wins ?? 0);
        if (winDiff !== 0) return winDiff;
        return (a.prestige ?? 0) - (b.prestige ?? 0);
    }).map(team => team.name);

    const resetTeams = clonedTeams.map(team => {
        const retainedPlayers: Player[] = [];
        team.roster.forEach(player => {
            const updatedPlayer = processNBAOffseasonDevelopment({ ...player });
            updatedPlayer.age = (updatedPlayer.age ?? 24) + 1;
            if (updatedPlayer.contract) {
                updatedPlayer.contract = {
                    ...updatedPlayer.contract,
                    yearlySalaries: Array.isArray(updatedPlayer.contract.yearlySalaries)
                        ? [...updatedPlayer.contract.yearlySalaries]
                        : undefined,
                };
                syncNBAContractForSeason(updatedPlayer, season);
                if (Array.isArray(updatedPlayer.contract.yearlySalaries) && updatedPlayer.contract.yearlySalaries.length > 0) {
                    updatedPlayer.contract.yearlySalaries.shift(); // drop the season that just ended
                    if (updatedPlayer.contract.yearlySalaries.length > 0) {
                        updatedPlayer.contract.salary = updatedPlayer.contract.yearlySalaries[0];
                        updatedPlayer.contract.yearsLeft = updatedPlayer.contract.yearlySalaries.length;
                    } else if (updatedPlayer.contract.yearsLeft != null) {
                        updatedPlayer.contract.yearsLeft = Math.max(0, updatedPlayer.contract.yearsLeft - 1);
                    }
                } else if (updatedPlayer.contract.yearsLeft != null) {
                    updatedPlayer.contract.yearsLeft = Math.max(0, updatedPlayer.contract.yearsLeft - 1);
                }
            }
            updatedPlayer.seasonStats = { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 };
            if (updatedPlayer.nbaStats) {
                updatedPlayer.nbaStats = { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 };
            }
            const contractYears = updatedPlayer.contract?.yearsLeft ?? 0;
            const shouldRetire = (updatedPlayer.age ?? 0) >= 38 && Math.random() < 0.25;
            if (contractYears <= 0 || shouldRetire) {
                const released = { ...updatedPlayer };
                released.contract = undefined;
                releasedPlayers.push(released);
            } else {
                retainedPlayers.push(updatedPlayer);
            }
        });
        return {
            ...team,
            roster: retainedPlayers,
            record: { wins: 0, losses: 0 }
        };
    });

    const simulation: NBASimulationResult = {
        season,
        teams: clonedTeams.map(team => ({
            name: team.name,
            conference: (team.conference as 'East' | 'West') || 'East',
            rating: getNBATeamPowerRating(team),
            wins: team.record?.wins ?? 0,
            losses: team.record?.losses ?? 0,
            playoffFinish: team.playoffFinish ?? 5
        })),
        draftOrder,
        champion: championTeam?.name || 'No Champion'
    };

    return { updatedNBATeams: resetTeams, releasedPlayers, simulation };
};




export const calculateTransferPlayerInterest = (player: Transfer, team: Team, coachSkills?: Record<string, number>): number => {
    let interest = player.interest || 50;
    
    // Prestige factor
    if (team.prestige > 75) interest += 10;
    if (team.prestige < 40) interest -= 10;

    // Location factor
    if (player.homeState === team.state) interest += 15;

    // Playing time factor (simplified)
    const playersAtPos = team.roster.filter(p => p.position === player.position).length;
    if (playersAtPos < 2) interest += 20; // Needs the position
    if (playersAtPos > 3) interest -= 15; // Crowded

    // Coach Skills
    if (coachSkills && team.isUserTeam) {
         if (coachSkills['portal_whisperer']) interest += 10;
    }

    return Math.min(100, Math.max(0, interest));
};


export const processNBAOffseasonDevelopment = (player: Player): Player => {
    const age = player.age || 22;
    let change = 0;
    if (age < 27) change = 2;
    else if (age > 32) change = -2;
    
    const newOverall = Math.min(99, Math.max(40, player.overall + change));
    return { ...player, overall: newOverall, startOfSeasonOverall: newOverall };
};

// Helper for day of year (Internal to this file now)
const getDayOfYear = (d: GameDate) => {
    const MONTH_ORDER_CAL = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const DAYS_IN_MONTH_MAP: Record<string, number> = { 'OCT': 31, 'NOV': 30, 'DEC': 31, 'JAN': 31, 'FEB': 28, 'MAR': 31, 'APR': 30, 'MAY': 31, 'JUN': 30, 'JUL': 31, 'AUG': 31, 'SEP': 30 };
    let total = 0;
    for (let i = 0; i < MONTH_ORDER_CAL.indexOf(d.month); i++) {
        total += DAYS_IN_MONTH_MAP[MONTH_ORDER_CAL[i]];
    }
    return total + d.day;
};

const processDailyNBAGames = (state: GameState, dayIndex: number): Partial<GameState> => {
    if (!state.nbaSchedule || !state.nbaTeams) return {};

    const weekIndex = Math.floor(dayIndex / 7);
    if (!state.nbaSchedule[weekIndex]) return {};

    const weekGames = state.nbaSchedule[weekIndex];
    // Filter for games that happen specifically today
    const todaysGames = weekGames.filter(g => g.day === dayIndex && !g.played);

    if (todaysGames.length === 0) return {};

    // Clone necessary arrays
    const updatedNBASchedule = [...state.nbaSchedule];
    const updatedWeekGames = [...weekGames];
    updatedNBASchedule[weekIndex] = updatedWeekGames;

    // We assume nbaTeams are seeded with correct league='NBA'
    const updatedNBATeamsMap = new Map(state.nbaTeams.map(t => [t.name, { ...t, record: { ...t.record } }])); 

    todaysGames.forEach(game => {
        const home = updatedNBATeamsMap.get(game.homeTeam);
        const away = updatedNBATeamsMap.get(game.awayTeam);
        
        if (home && away) {
             // Simulate
             const result = simulateGame(home, away, `NBA-S${state.season}-D${dayIndex}-${home.name}v${away.name}`);
             
             // Update Scores
             const gameIndex = updatedWeekGames.indexOf(game);
             if (gameIndex !== -1) {
                 updatedWeekGames[gameIndex] = {
                     ...game,
                     homeScore: result.homeScore,
                     awayScore: result.awayScore,
                     played: true
                 };
             }

             // Update Standings
             if (result.homeScore > result.awayScore) {
                 home.record.wins++;
                 away.record.losses++;
             } else {
                 away.record.wins++;
                 home.record.losses++;
             }
        }
    });

    return {
        nbaSchedule: updatedNBASchedule,
        nbaTeams: Array.from(updatedNBATeamsMap.values()),
    };
};

const diffDaysISO = (fromISO: string, toISO: string): number => {
    const from = new Date(fromISO);
    const to = new Date(toISO);
    const ms = to.getTime() - from.getTime();
    return Math.floor(ms / 86400000);
};

const computeRecruitingWeekFromDate = (seasonStartISO: string, currentISO: string): number => {
    const dayIndex = Math.max(0, diffDaysISO(seasonStartISO, currentISO));
    // Roughly 4 calendar days per "recruiting week" to keep pacing similar to the old week-based model.
    return clamp(1 + Math.floor(dayIndex / 4), 1, 31);
};

const getTeamScholarshipSlotsRemaining = (team: Team, recruits: Recruit[]): number => {
    const returning = team.roster.filter(p => p.year !== 'Sr').length;
    const projectedOpenSlots = Math.max(0, 13 - returning);
    const commits = recruits.filter(r => r.verbalCommitment === team.name).length;
    return Math.max(0, projectedOpenSlots - commits);
};

const countOutstandingOffersForTeam = (teamName: string, recruits: Recruit[]): number => {
    return recruits.filter(r =>
        (r.cpuOffers || []).includes(teamName) &&
        !r.verbalCommitment &&
        !(r.declinedOffers || []).includes(teamName)
    ).length;
};

const processRecruitingDayActions = (
    teams: Team[],
    recruits: Recruit[],
    userTeamName: string,
    recruitingWeek: number,
    currentDateISO: string,
    seasonStartISO: string,
    userCoachSkills?: string[]
): Recruit[] => {
    const updatedRecruits = JSON.parse(JSON.stringify(recruits)) as Recruit[];
    const teamsByName = new Map(teams.map(t => [t.name, t]));
    const recruitsById = new Map(updatedRecruits.map(r => [r.id, r]));
    const daysSinceSeasonStart = Math.max(0, diffDaysISO(seasonStartISO, currentDateISO));

    // 1. Process Pending Commitments (Daily Trickle)
    updatedRecruits.forEach(r => {
        if (r.pendingCommitment && !r.verbalCommitment) {
             // If date reached or passed
             // Compare ISO strings directly (YYYY-MM-DD) works if strict format
             if (currentDateISO >= r.pendingCommitment.date && daysSinceSeasonStart >= 7) {
                  r.verbalCommitment = r.pendingCommitment.school;
                  r.softCommitment = !r.pendingCommitment.isHard;
                  r.isTargeted = false;
                  r.recruitmentStage = r.pendingCommitment.isHard ? 'HardCommit' : 'SoftCommit';
                  r.commitWeek = recruitingWeek;
                  r.lastRecruitingNews = r.pendingCommitment.news;
                  if (r.userHasOffered) r.userHasOffered = false;
                  r.pendingCommitment = undefined;
             }
         }
     });

    // Daily momentum decay so stale offers can cycle and the pool doesn't freeze after early season.
    // Decay is deterministic (stable hash) and slow enough that momentum still matters for a while.
    updatedRecruits.forEach(r => {
        if (!r.teamMomentum) return;
        Object.keys(r.teamMomentum).forEach(teamName => {
            const v = r.teamMomentum?.[teamName] ?? 0;
            const shouldDecayToday = stableIntBetween(`${currentDateISO}:${r.id}:${teamName}:mom`, 0, 2) === 0; // ~1/3 days
            if (!shouldDecayToday) return;
            if (v > 0) r.teamMomentum![teamName] = v - 1;
            else if (v < 0) r.teamMomentum![teamName] = v + 1;
            if (r.teamMomentum![teamName] === 0) delete r.teamMomentum![teamName];
        });
    });

    const sortedRecruits = [...updatedRecruits].sort((a, b) => (b.overall + b.potential) - (a.overall + a.potential));

    const early = recruitingWeek <= 4;
    const mid = recruitingWeek > 4 && recruitingWeek <= 8;
    const late = recruitingWeek > 8;

    const cpuTeams = [...teams]
        .filter(t => !t.isUserTeam)
        .sort((a, b) => a.name.localeCompare(b.name));

    const recordCpuOffer = (target: Recruit, team: Team) => {
        if (target.verbalCommitment) return;
        if ((target.declinedOffers || []).includes(team.name)) return;
        if ((target.cpuOffers || []).includes(team.name)) return;

        target.cpuOffers = [...(target.cpuOffers || []), team.name];
        if (!target.teamMomentum) target.teamMomentum = {};
        target.teamMomentum[team.name] = clamp((target.teamMomentum[team.name] ?? 0) + (mid ? 4 : 3), -20, 20);
        if (!target.offerHistory) target.offerHistory = [];
        target.offerHistory.push({
            teamName: team.name,
            week: recruitingWeek,
            date: currentDateISO,
            pitchType: pickOfferPitchTypeForTeam(target, team),
            source: 'CPU',
        });
    };

    const revokeCpuOffer = (target: Recruit, teamName: string) => {
        if (!(target.cpuOffers || []).includes(teamName)) return;
        target.cpuOffers = (target.cpuOffers || []).filter(x => x !== teamName);
        if (!target.offerHistory) target.offerHistory = [];
        for (let i = target.offerHistory.length - 1; i >= 0; i--) {
            const entry = target.offerHistory[i]!;
            if (entry.teamName === teamName && !entry.revoked) {
                target.offerHistory[i] = { ...entry, revoked: true };
                break;
            }
        }
        if (!target.teamMomentum) target.teamMomentum = {};
        target.teamMomentum[teamName] = clamp((target.teamMomentum[teamName] ?? 0) - 2, -20, 20);
    };

    cpuTeams.forEach(team => {
        const slotsRemaining = getTeamScholarshipSlotsRemaining(team, updatedRecruits);
        const outstanding = countOutstandingOffersForTeam(team.name, updatedRecruits);
        const capFactor = early ? 2.0 : mid ? 1.6 : late ? 1.2 : 1.0;
        const maxOutstanding = Math.max(2, Math.round(slotsRemaining * capFactor + (team.prestige >= 80 ? 1 : 0)));

        // Pull "unresponsive" offers after 14 days and reallocate elsewhere.
        // Unresponsive = offer is old and has not generated positive momentum.
        if (outstanding > 0) {
            const offered = updatedRecruits
                .filter(r => (r.cpuOffers || []).includes(team.name) && !r.verbalCommitment)
                .map(r => {
                    const lastOffer = [...(r.offerHistory || [])].reverse().find(e => e.teamName === team.name && !e.revoked) || null;
                    const offerAgeDays = lastOffer?.date ? Math.max(0, diffDaysISO(lastOffer.date, currentDateISO)) : 0;
                    const momentum = r.teamMomentum?.[team.name] ?? 0;
                    return { r, offerAgeDays, momentum };
                })
                // Always recycle very old offers; otherwise recycle moderately old offers that aren't gaining traction.
                .filter(x => (x.offerAgeDays >= 30 && x.momentum <= 10) || (x.offerAgeDays >= 18 && x.momentum <= 4))
                .sort((a, b) => b.offerAgeDays - a.offerAgeDays);

            offered.slice(0, 2).forEach(({ r }) => revokeCpuOffer(r, team.name));
        }

        // If we have no slots left, start trimming longshots more aggressively.
        if (slotsRemaining <= 0 && outstanding > 0) {
            const offered = updatedRecruits
                .filter(r => (r.cpuOffers || []).includes(team.name) && !r.verbalCommitment)
                .map(r => ({ r, m: r.teamMomentum?.[team.name] ?? 0 }))
                .sort((a, b) => a.m - b.m);
            offered.slice(0, Math.min(2, offered.length)).forEach(({ r }) => revokeCpuOffer(r, team.name));
            return;
        }

        if (outstanding > maxOutstanding) {
            const offered = updatedRecruits
                .filter(r => (r.cpuOffers || []).includes(team.name) && !r.verbalCommitment)
                .map(r => ({ r, m: r.teamMomentum?.[team.name] ?? 0 }))
                .sort((a, b) => a.m - b.m);
            const toRevoke = outstanding - maxOutstanding;
            offered.slice(0, toRevoke).forEach(({ r }) => revokeCpuOffer(r, team.name));
        }

        if (slotsRemaining <= 0) return;
        if (countOutstandingOffersForTeam(team.name, updatedRecruits) >= maxOutstanding) return;

        const needs = calculateTeamNeeds(team);
        const teamRegion = getRegionForState(team.state);

        const reachTier =
            team.prestige >= 85 ? 5 :
            team.prestige >= 75 ? 4 :
            team.prestige >= 60 ? 3 :
            2;

        // Offer board depth should expand as the season progresses so teams can fill classes.
        // A shallow late-season board causes the AI to keep re-offering only the very top recruits,
        // leaving most of the pool with few/no offers and stalling commitments.
        const boardSize = early
            ? 85
            : mid
                ? 125
                : clamp(150 + Math.round(Math.max(0, recruitingWeek - 9) * 6), 150, 260);
        const board = sortedRecruits
            .filter(r => !r.verbalCommitment)
            .map(r => {
                const need = needs.includes(r.position) || (r.secondaryPosition && needs.includes(r.secondaryPosition)) ? 1 : 0;
                const recruitRegion = r.region || getRegionForState(r.homeState);
                const regionBonus = recruitRegion && teamRegion && recruitRegion === teamRegion ? 5 : 0;
                const homeStateBonus = r.homeState === team.state ? 10 : 0;
                const reachPenalty = r.stars > reachTier ? (r.stars - reachTier) * 14 : 0;
                const base = r.overall * 0.65 + r.potential * 0.35 + r.stars * 6;
                const score = base + (need ? 14 : 0) + regionBonus + homeStateBonus - reachPenalty;
                return { r, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, boardSize)
            .map(x => x.r);

        const offerCandidates = board.filter(r => !(r.cpuOffers || []).includes(team.name) && !(r.declinedOffers || []).includes(team.name));
        // Ensure lower-prestige teams still participate; otherwise the offer ecosystem collapses and most recruits never commit.
        const offersKey = `${currentDateISO}:${team.name}:offer`;
        const maxOffersToday = (() => {
            if (team.prestige >= 86) return 1;
            if (team.prestige >= 78) return stableIntBetween(offersKey, 0, 1) === 0 ? 1 : 0; // ~50%
            if (team.prestige >= 70) return stableIntBetween(offersKey, 0, 2) === 0 ? 1 : 0; // ~33%
            if (team.prestige >= 62) return stableIntBetween(offersKey, 0, 3) === 0 ? 1 : 0; // ~25%
            if (team.prestige >= 55) return stableIntBetween(offersKey, 0, 4) === 0 ? 1 : 0; // ~20%
            return stableIntBetween(offersKey, 0, 6) === 0 ? 1 : 0; // ~14%
        })();
        let offersMade = 0;

        for (const target of offerCandidates) {
            if (offersMade >= maxOffersToday) break;
            if (countOutstandingOffersForTeam(team.name, updatedRecruits) >= maxOutstanding) break;
            recordCpuOffer(target, team);
            offersMade++;

            // If this recruit is in a package deal, mirror the offer to the linked recruit(s) immediately.
            const packageDealLinks = (target.relationships || []).filter(isPackageDealLink);
            for (const link of packageDealLinks) {
                const other = recruitsById.get(link.personId);
                if (!other) continue;
                if (other.verbalCommitment) continue;
                if ((other.declinedOffers || []).includes(team.name)) continue;
                recordCpuOffer(other, team);
            }
        }
    });

    // 2. Daily commitment decisions (locked out for the first 7 days of the season).
    if (daysSinceSeasonStart >= 7) {
        const decisionPressure = getDecisionPressure(recruitingWeek, false);
        const teamCommitCounts = new Map<string, number>();
        updatedRecruits.forEach((r: Recruit) => {
            if (r.verbalCommitment) {
                teamCommitCounts.set(r.verbalCommitment, (teamCommitCounts.get(r.verbalCommitment) || 0) + 1);
            }
        });

        const seedKeyPrefix = `${currentDateISO}:${recruitingWeek}`;
        updatedRecruits.forEach((r: Recruit) => {
            if (r.verbalCommitment) return;
            if (r.pendingCommitment) return;
            if (r.recruitmentStage === 'Signed') return;

            const offers = [
                ...(r.cpuOffers || []),
                ...(r.userHasOffered ? [userTeamName] : []),
            ].filter(teamName => !(r.declinedOffers || []).includes(teamName));
            if (!offers.length) return;

            const offerDetails = offers
                .map(teamName => {
                    const team = teamsByName.get(teamName);
                    if (!team) return null;
                    return {
                        name: teamName,
                        score: calculateRecruitInterestScore(
                            r,
                            team,
                            { gameInSeason: recruitingWeek, isSigningPeriod: false },
                            teamName === userTeamName ? userCoachSkills : undefined
                        ),
                    };
                })
                .filter(Boolean) as { name: string; score: number }[];

            offerDetails.sort((a, b) => b.score - a.score);
            const topOffer = offerDetails[0];
            if (!topOffer) return;

            const { shares } = buildRecruitOfferShortlist(offerDetails, {
                min: 3,
                max: 6,
                leaderWindow: 10,
                seedKey: `${seedKeyPrefix}:${r.id}:dailyCommit`,
                temperatureMultiplier: getRecruitOfferShareTemperatureMultiplier(r),
            });

            const topShare = shares.get(topOffer.name) ?? 0;
            const runnerUp = offerDetails[1];
            const interestDifference = runnerUp ? topOffer.score - runnerUp.score : 99;

            const minCommitWeek =
                r.stars >= 5 ? 3 :
                r.stars === 4 ? 2 :
                1;
            if (recruitingWeek < minCommitWeek) return;

            const earlySeason = recruitingWeek <= 4;
            const midSeason = recruitingWeek > 4 && recruitingWeek <= 8;
            const offerCount = offerDetails.length;
            const pressureAdjustment = Math.round(decisionPressure * 8);

            const leaderTeam = teamsByName.get(topOffer.name);
            let scarcityMod = 0;
            if (leaderTeam) {
                const returning = leaderTeam.roster.filter(p => p.year !== 'Sr').length;
                const commits = teamCommitCounts.get(topOffer.name) || 0;
                const slots = 13 - returning - commits;
                if (slots <= 1) scarcityMod = 8;
                else if (slots <= 2) scarcityMod = 4;
            }

            // Late-cycle acceleration: by Jan/Feb, most recruits should be committing even if their absolute score isn't elite.
            // We drop the absolute score gate progressively after week 9 to avoid a "December cliff" where commitments stall.
            const lateWeeks = Math.max(0, recruitingWeek - 9);
            const lateDrop = Math.round(clamp(lateWeeks / 16, 0, 1) * 12) + (recruitingWeek >= 26 ? Math.round(clamp((recruitingWeek - 26) / 5, 0, 1) * 6) : 0); // 0..18
            const starAdj = r.stars >= 5 ? 3 : r.stars === 4 ? 1 : r.stars <= 2 ? -3 : 0;
            const baseScoreGate = (earlySeason ? 90 : midSeason ? 84 : 78) - lateDrop + starAdj;
            const absoluteScoreGate = clamp(baseScoreGate - Math.floor(offerCount / 4) * 2 - pressureAdjustment - scarcityMod, 45, 92);
            // After week ~10, allow "relative" commitments: if the recruit clearly prefers one school, they can still commit
            // even if the absolute score isn't high (i.e., they're choosing the best of available options).
            const relativeScoreGate = clamp(62 - Math.round(Math.max(0, recruitingWeek - 10) * 1.25) + (r.stars >= 4 ? 3 : 0), 30, 62);
            const scoreGate = recruitingWeek >= 10 ? Math.min(absoluteScoreGate, relativeScoreGate) : absoluteScoreGate;
            const shareGate = clamp(78 - offerCount * 4 - Math.round(recruitingWeek * 1.5) - Math.round(decisionPressure * 10) - scarcityMod * 2, 15, 78);
            const leadGate = clamp((earlySeason ? 12 : midSeason ? 8 : 5) - Math.floor(offerCount / 6) - Math.round(decisionPressure * 2) - Math.ceil(scarcityMod / 2), 1, 14);

            const hasClearLead = offerDetails.length === 1 || interestDifference >= leadGate;
            const meetsGates = topOffer.score >= scoreGate && topShare >= shareGate && hasClearLead;

            // Convert weekly-style gates into a daily chance with a long ramp across the season.
            // This keeps early-season commitments rare, but pushes the pool to mostly committed by Feb.
            const desperationEligible = !meetsGates && recruitingWeek >= 12 && r.stars <= 3 && offers.length <= 4;
            const desperationScoreGate = clamp(44 - Math.round((recruitingWeek - 12) * 0.8), 26, 44);
            const desperationShareGate = clamp(52 - Math.round((recruitingWeek - 12) * 1.1), 24, 52);
            const canDesperationCommit = desperationEligible && topOffer.score >= desperationScoreGate && topShare >= desperationShareGate;

            // Late-cycle auto-resolution: after mid-January, clear leaders should start collecting commits across the board.
            const lateAutoEligible = !meetsGates && !canDesperationCommit && recruitingWeek >= 18 && offers.length >= 2 && hasClearLead;
            const lateAutoShareGate = clamp(48 - Math.round((recruitingWeek - 18) * 1.1), 26, 48);
            const lateAutoScoreGate = clamp(54 - Math.round((recruitingWeek - 18) * 1.2) + (r.stars >= 4 ? 5 : 0), 30, 65);
            const canLateAutoCommit = lateAutoEligible && topShare >= lateAutoShareGate && topOffer.score >= lateAutoScoreGate;

            // Ultra-late commit pressure: by late Feb, the majority of recruits should be committed even if their offers are mediocre.
            // This is intentionally "soft" (probabilistic) and depends on having at least one offer + some leader share.
            const ultraLateEligible = !meetsGates && !canDesperationCommit && !canLateAutoCommit && recruitingWeek >= 22 && offers.length >= 1;
            const ultraLateTime = clamp((recruitingWeek - 22) / 9, 0, 1); // ramps Jan->Feb
            const ultraLateShareFactor = clamp((topShare - 18) / 82, 0, 1);
            const ultraLateStarBrake = r.stars >= 4 ? 0.75 : 1.0;
            const ultraLateChance = ultraLateEligible ? clamp(0.025 + ultraLateTime * 0.19, 0.025, 0.215) * ultraLateShareFactor * ultraLateStarBrake : 0;

            if (!meetsGates && !canDesperationCommit && !canLateAutoCommit && ultraLateChance <= 0) return;

            const seasonRamp = clamp((daysSinceSeasonStart - 7) / 75, 0, 1); // ramps over ~2.5 months
            const lateBoost = clamp((recruitingWeek - 10) / 12, 0, 1) * 0.22;
            const effectiveScoreGate = canDesperationCommit ? desperationScoreGate : canLateAutoCommit ? lateAutoScoreGate : scoreGate;
            const effectiveShareGate = canDesperationCommit ? desperationShareGate : canLateAutoCommit ? lateAutoShareGate : shareGate;

            const scoreEdge = clamp((topOffer.score - effectiveScoreGate) / 18, 0, 1);
            const shareEdge = clamp((topShare - effectiveShareGate) / 24, 0, 1);
            const baseChance = canDesperationCommit
                ? clamp(0.12 + scoreEdge * 0.30 + shareEdge * 0.30, 0.12, 0.65)
                : canLateAutoCommit
                    ? clamp(0.14 + scoreEdge * 0.33 + shareEdge * 0.33, 0.14, 0.82)
                    : clamp(0.10 + scoreEdge * 0.34 + shareEdge * 0.34, 0.10, 0.78);
            const lateFloor = clamp((recruitingWeek - 14) / 12, 0, 1) * 0.10;
            const commitChance = clamp(baseChance * (0.50 + seasonRamp * 0.85 + lateBoost) + lateFloor + ultraLateChance, 0.06, 0.96);

            const commitRoll = stableFloatBetween(`${seedKeyPrefix}:${r.id}:commitRoll`, 0, 1);
            if (commitRoll > commitChance) return;

            const daysDelay = stableIntBetween(`${seedKeyPrefix}:${r.id}:delay`, 0, 3);
            const earliestCommitDate = addDaysISO(seasonStartISO, 7);
            const desiredCommitDate = addDaysISO(currentDateISO, daysDelay);
            const commitDate = desiredCommitDate < earliestCommitDate ? earliestCommitDate : desiredCommitDate;

            r.pendingCommitment = {
                school: topOffer.name,
                date: commitDate,
                isHard: recruitingWeek > 8,
                news: `${r.name} committed to ${topOffer.name}.`,
            };
        });
    }

    return updatedRecruits;
};

export const runDailySimulation = (
    state: GameState,
    forceSimUserGame: boolean = false
): { 
    updatedState: Partial<GameState>, 
    messages: string[],
    shouldSimulateGamesToday?: boolean
} => {
    const currentDate = state.currentDate || state.seasonAnchors?.seasonStart || SEASON_START_DATE;
    const eventsToday = state.eventQueue?.filter(e => isSameISO(e.date, currentDate) && !e.processed) || [];
    const gameEventsToday = eventsToday.filter(e => e.type === EventType.GAME);
    const seasonStartISO = state.seasonAnchors?.seasonStart || SEASON_START_DATE;
    const coachSkills = Object.keys(state.coach?.skills || {});

    // Weekly cadence is deprecated; treat legacy saves as daily.
    const recruitingCadence = state.recruitingCadence === 'weekly' ? 'daily' : (state.recruitingCadence ?? 'daily');
    const isNbaMode = typeof state.status === 'string' && state.status.startsWith('NBA_');
    const canRecruitDaily =
        recruitingCadence === 'daily' &&
        state.userTeam &&
        state.userTeam.name &&
        state.gameInSeason <= 31 &&
        state.status !== GameStatus.TOURNAMENT &&
        state.status !== GameStatus.SIGNING_PERIOD &&
        state.status !== GameStatus.OFFSEASON &&
        !isNbaMode;
    const recruitingWeek = canRecruitDaily ? computeRecruitingWeekFromDate(state.seasonAnchors?.seasonStart || SEASON_START_DATE, currentDate) : state.gameInSeason;

    if (gameEventsToday.length > 0) {
        const userGameEvent = state.userTeam
            ? gameEventsToday.find(e => e.payload?.homeTeam === state.userTeam!.name || e.payload?.awayTeam === state.userTeam!.name)
            : undefined;

        if (userGameEvent && !forceSimUserGame) {
            const opponent = state.userTeam!.name === userGameEvent.payload.homeTeam
                ? userGameEvent.payload.awayTeam
                : userGameEvent.payload.homeTeam;
            const updatedRecruits = canRecruitDaily
                ? processRecruitingDayActions(state.allTeams, state.recruits, state.userTeam!.name, recruitingWeek, currentDate, seasonStartISO, coachSkills)
                : state.recruits;
            return { updatedState: { recruits: updatedRecruits }, messages: [`Game day against ${opponent}!`] };
        }

        const updatedRecruits = canRecruitDaily
            ? processRecruitingDayActions(state.allTeams, state.recruits, state.userTeam!.name, recruitingWeek, currentDate, seasonStartISO, coachSkills)
            : state.recruits;
        return { updatedState: { recruits: updatedRecruits }, messages: [], shouldSimulateGamesToday: true };
    }

    const nextDate = addDaysISO(currentDate, 1);
    const updatedRecruits = canRecruitDaily
        ? processRecruitingDayActions(state.allTeams, state.recruits, state.userTeam!.name, recruitingWeek, currentDate, seasonStartISO, coachSkills)
        : state.recruits;
    return { updatedState: { currentDate: nextDate, recruits: updatedRecruits }, messages: [] };
};
