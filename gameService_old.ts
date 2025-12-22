
// services/gameService.ts
import {
    Player, Team, GameResult, GameState, GameStatus, Recruit,
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
    BudgetAllocations, BoardExpectations, FinancialWeekRecord, ConcessionTier, MerchPricingSettings, ParkingPricingSettings, LicensingContract, VisitStatus, Transfer, StaffSpecialty, GameAdjustment
} from '../types';
import {
  SCHOOLS, FIRST_NAMES, LAST_NAMES, SCHOOL_PRESTIGE_RANGES, SCHOOL_CONFERENCES,
  SCHOOL_SPONSORS, INITIAL_SPONSORS, SponsorName, CONFERENCE_STRENGTH, ARENA_CAPACITIES as LEGACY_ARENA_CAPACITIES, SPONSOR_SLOGANS, SCHOOL_ENDOWMENT_OVERRIDES, NBA_TEAMS, INTERNATIONAL_PROGRAMS,
  US_STATES, SCHOOL_STATES
} from '../constants';
import { ARENA_CAPACITIES as AUTHORITATIVE_ARENA_CAPACITIES } from '../new_arena_capacities';
import { NCAA_TOURNAMENT_CHAMPIONS } from '../realWorldData';
import { ensurePlayerNilProfile, calculateTeamNilBudget, updateNILCollective } from './nilService';
import { generateAlumni, updateAlumniRegistry, generateBaselineAlumniRegistry } from './alumniService';
import { generateSponsorQuests } from './questService';

export const randomBetween = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
export const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const clampTo40 = (value: number): number => clamp(value, 0, 40);
const DEFAULT_HISTORY_SEASONS = 31;
const BASE_CALENDAR_YEAR = 2024;
const REAL_WORLD_REFERENCE_YEAR = 2025;
const ARENA_CAPACITY_MAP: Record<string, number> = {
    ...LEGACY_ARENA_CAPACITIES,
    ...AUTHORITATIVE_ARENA_CAPACITIES,
};

const normalizeSchoolKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

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
    };
};

export const ensureMedicalFacility = (team: Team): MedicalFacility => {
    const existing = team.facilities?.medical;
    const baseQuality = existing?.quality ?? clamp(team.prestige + randomBetween(-8, 8), 40, 95);
    const level = existing?.level ?? Math.max(1, Math.min(5, Math.floor(baseQuality / 20)));
    return {
        quality: Math.max(20, Math.min(100, baseQuality)),
        level,
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

export const buildSponsorQuestDeck = (): SponsorQuest[] =>
    BASE_SPONSOR_QUESTS.map(quest => ({
        ...quest,
        id: `${quest.id}-${Math.random().toString(36).slice(2, 7)}`,
    }));

const seasonToCalendarYear = (season: number) => BASE_CALENDAR_YEAR + season + 1;
const calendarYearToSeason = (year: number) => year - BASE_CALENDAR_YEAR - 1;

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

const formatCurrency = (value: number) => {
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

const applyGameProgressionToPlayer = (player: Player): Player => {
    const gap = player.potential - player.overall;
    if (Math.abs(gap) < 0.05) {
        return { ...player, naturalProgressAccumulator: player.naturalProgressAccumulator ?? 0 };
    }
    const direction = Math.sign(gap);
    const delta = Math.abs(gap) * NATURAL_PER_GAME_RATE;
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
    return { endowmentScore, donationLevel, boosterPool, donorMomentum: 0 };
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
    return { ...previous, donationLevel, boosterPool, donorMomentum };
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
  const overall = calculateOverall(stats);

    let potential = randomBetween(overall, 95);
    const idealHeight = (POSITION_HEIGHT_RANGES[position].min + POSITION_HEIGHT_RANGES[position].max) / 2;
    const heightDifference = Math.abs(height - idealHeight);
    if (heightDifference <= 1) {
        potential = clamp(potential + randomBetween(1, 3), overall, 99);
    }

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
  };
  return ensurePlayerNilProfile(player);
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

    const { year, starterPosition, seasonStats, ...recruitData } = playerPart;
    const personalityTrait = pickRandom(PROSPECT_PERSONALITIES);
    const nilPriority = pickRandom(NIL_PRIORITY_OPTIONS);
    const preferredProgramAttributes = buildProgramPreference();

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
        archetype: pickRandom(['BagChaser', 'Hooper', 'HometownHero', 'Academic']),
        dealbreaker: pickRandom(['NIL', 'PlayingTime', 'Proximity', 'Academics', 'None', 'None', 'None']),
        visitStatus: 'None',
        homeState: pickRandom(US_STATES),
        state: pickRandom(US_STATES), // Redundant but required by interface
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
    const growthWindow = Math.max(0, updatedPlayer.potential - updatedPlayer.overall);
    if (growthWindow <= 0) {
        return updatedPlayer;
    }
    const classMultiplier = updatedPlayer.year === 'Fr' ? 4 : updatedPlayer.year === 'So' ? 3 : updatedPlayer.year === 'Jr' ? 2 : 1;
    const prestigeBonus = Math.max(0, Math.floor(programPrestige / 25));
    const internationalBonus = isInternational ? 1 : 0;
    const baseSteps = classMultiplier + Math.floor(growthWindow / 7) + prestigeBonus + internationalBonus;
    const growthSteps = Math.min(14, Math.max(1, randomBetween(1, baseSteps)));

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

export const rollOverTeamsForNextSeason = (teams: Team[], season: number): Team[] => {
    return teams.map(team => {
        const graduatingPlayers = team.roster.filter(p => p.year === 'Sr');
        let alumniRegistry = team.alumniRegistry;

        graduatingPlayers.forEach(player => {
            const alumni = generateAlumni(player, team, season);
            alumniRegistry = updateAlumniRegistry(alumniRegistry, alumni);
        });

        return {
            ...team,
            roster: rollOverTeamRoster(team),
            record: { wins: 0, losses: 0 },
            headCoach: team.headCoach
                ? { ...team.headCoach, seasons: team.headCoach.seasons + 1, seasonWins: 0, seasonLosses: 0 }
                : createHeadCoachProfile(team.name, team.prestige),
            alumniRegistry,
        };
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
        return { name: sponsorName, tier: 'Elite', slogan: SPONSOR_SLOGANS[sponsorName] };
    }
    const tier = sponsorsData[sponsorName]?.tier || 'Low';
    const slogan = SPONSOR_SLOGANS[sponsorName] || '';
    return { name: sponsorName, tier, slogan };
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
    const winLossDifferential = team.record.wins - team.record.losses;
    const recordFactor = winLossDifferential * 0.5;
    
    // Exponential prestige curve for tickets to allow top teams (99 prestige) to charge premium prices
    // 99 prestige -> ~52 base from prestige
    // 50 prestige -> ~20 base from prestige
    const prestigeFactor = Math.pow(team.prestige, 1.4) / 12;
    const interestFactor = (team.fanInterest / 10);

    const ticket = 12 + prestigeFactor + interestFactor + recordFactor;
    
    const jersey = 60 + (team.prestige * 0.6) + (team.fanInterest * 0.2);
    const merchandise = 20 + (team.prestige * 0.3) + (team.fanInterest * 0.1);
    const concessionFood = 6 + (team.prestige / 15);
    const concessionDrink = 4 + (team.prestige / 20);
    const parking = 8 + (team.prestige / 6);

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
    const confStrength = CONFERENCE_STRENGTH[team.conference] || 'Low';
    const confBase = { 'Power': 3000000, 'Mid': 1400000, 'Low': 800000 }[confStrength];
    const prestigeBonus = team.prestige * 15000;
    const baseRevenue = clamp(confBase + prestigeBonus, 500000, 4000000);

    const capacity = ARENA_CAPACITY_MAP[team.name] || 5000;
    const homeGames = 15;
    const willingness = calculateFanWillingness(team);
    const priceSentimentPenalty = Math.max(0, (team.prices.ticketPrice - willingness.ticket) / willingness.ticket);
    const lastTournamentResult = lastSeasonRecord?.tournamentResult ?? lastSeasonRecord?.postseasonResult ?? '';
    let hypeBonus = 1.0;
    if (lastTournamentResult.includes('Final Four')) hypeBonus = 1.15;
    else if (lastTournamentResult.includes('Elite 8')) hypeBonus = 1.1;
    else if (lastTournamentResult.includes('Sweet 16')) hypeBonus = 1.05;

    const baseAttendance = capacity * (team.fanInterest / 100) * hypeBonus;
    const finalAttendance = Math.min(capacity, baseAttendance * (1 - priceSentimentPenalty * 0.5));
    const gateRevenue = homeGames * finalAttendance * team.prices.ticketPrice;
    
    const concessionFoodSentimentPenalty = Math.max(0, (team.prices.concessionFoodPrice - willingness.concessionFood) / willingness.concessionFood);
    const concessionDrinkSentimentPenalty = Math.max(0, (team.prices.concessionDrinkPrice - willingness.concessionDrink) / willingness.concessionDrink);
    const concessionsRevenue = homeGames * finalAttendance * 
        (team.prices.concessionFoodPrice * (1 - concessionFoodSentimentPenalty * 0.3) + 
         team.prices.concessionDrinkPrice * (1 - concessionDrinkSentimentPenalty * 0.2));

    const baseMerchDemand = (team.fanInterest * 200) + (team.prestige * 1500);
    const jerseyPriceSentimentPenalty = Math.max(0, (team.prices.jerseyPrice - willingness.jersey) / willingness.jersey);
    const merchPriceSentimentPenalty = Math.max(0, (team.prices.merchandisePrice - willingness.merchandise) / willingness.merchandise);
    const jerseyRevenue = (baseMerchDemand * 0.08 * team.prices.jerseyPrice) * Math.max(0.1, 1 - jerseyPriceSentimentPenalty) * hypeBonus;
    const generalMerchRevenue = (baseMerchDemand * 0.15 * team.prices.merchandisePrice) * Math.max(0.1, 1 - merchPriceSentimentPenalty) * hypeBonus;
    const merchandiseRevenue = jerseyRevenue + generalMerchRevenue;

    const parkingPriceSentimentPenalty = Math.max(0, (team.prices.parkingPrice - willingness.parking) / willingness.parking);
    const parkingRevenue = homeGames * finalAttendance * team.prices.parkingPrice * Math.max(0.1, 1 - parkingPriceSentimentPenalty);

    const tournamentShare = getTournamentPayout(team.name, tournament);
    const sponsorSnapshot = calculateSponsorRevenueSnapshot(team);
    const sponsorPayout = sponsorSnapshot.total;
    const donationRevenue = team.wealth ? (team.wealth.donationLevel * 15000) + (team.wealth.boosterPool * 40000) : 0;
    const endowmentSupport = team.wealth ? team.wealth.endowmentScore * 20000 : 0;
    const totalRevenue = baseRevenue + gateRevenue + merchandiseRevenue + concessionsRevenue + tournamentShare + sponsorPayout + parkingRevenue + donationRevenue + endowmentSupport;
    const coachSalary = team.headCoach?.contract ? team.headCoach.contract.salary : 0;
    const staffSalaries = [...team.staff.assistants, ...team.staff.trainers, ...team.staff.scouts].reduce((sum, member) => sum + member.salary, 0) + coachSalary;
    const firedStaffSalaries = team.finances.firedStaffSalaries || 0;
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
    };
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
    const REGULAR_SEASON_GAMES = 31;
    const gamesPlayed = Math.min(gameInSeason > 31 ? REGULAR_SEASON_GAMES : gameInSeason - 1, REGULAR_SEASON_GAMES);
    const seasonProgress = gamesPlayed / REGULAR_SEASON_GAMES;

    const projected = calculateTeamRevenue(team, tournament);
    
    const baseRevenue = projected.baseRevenue * seasonProgress;
    // Calculate gate revenue directly from the attendance records for games played so far
    const gateRevenue = attendanceRecords.reduce((sum, record) => sum + (record.revenue || 0), 0);
    const concessionsRevenue = gateRevenue * ((team.prices.concessionFoodPrice + team.prices.concessionDrinkPrice) / team.prices.ticketPrice) * 0.6;
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

    teams.forEach(team => {
        if (team.isUserTeam) return;
        const availableScholarships = 15 - team.roster.filter(p => p.year !== 'Sr').length;
        if (availableScholarships <= 0) return;
        const offersToMake = Math.ceil(availableScholarships * (1 + (team.prestige / 200)));
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
                    recruitToUpdate.cpuOffers.push(team.name);
                    offersMade++;
                }
            }
        }
    });
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

    // Generate NBA Draft History from Alumni
    const nbaDrafts: NBADraftHistoryEntry[] = [];
    const draftsBySeason = new Map<number, DraftPick[]>();

    teams.forEach(team => {
        if (!team.alumniRegistry || !team.alumniRegistry.allAlumni) return;
        
        team.alumniRegistry.allAlumni.forEach(alumni => {
            if (alumni.proStatus === 'drafted' || alumni.proStatus === 'pro_success') {
                const season = alumni.graduationSeason; 
                if (season > 0) return; // Only historical
                
                if (!draftsBySeason.has(season)) {
                    draftsBySeason.set(season, []);
                }
                
                const fakePlayer = createPlayer('Sr', (alumni.position as RosterPositions) || 'PG');
                fakePlayer.id = alumni.id;
                fakePlayer.name = alumni.name;
                fakePlayer.overall = 80 + Math.floor(Math.random() * 15);
                fakePlayer.potential = 85 + Math.floor(Math.random() * 14);

                draftsBySeason.get(season)!.push({
                    pick: 0, 
                    round: 1, 
                    player: fakePlayer,
                    season: season,
                    originalTeam: team.name,
                    nbaTeam: alumni.nbaTeam || 'Unknown',
                    source: 'NCAA',
                    originDescription: `${team.name} (Sr)`,
                });
            }
        });
    });

    draftsBySeason.forEach((picks, season) => {
        picks.sort((a, b) => b.player.overall - a.player.overall);
        picks.forEach((pick, index) => {
            pick.pick = index + 1;
            pick.round = index < 30 ? 1 : 2;
        });
        nbaDrafts.push({
            season: season,
            picks: picks,
            nbaChampion: 'Unknown',
            draftOrder: [],
        });
    });
    
    nbaDrafts.sort((a, b) => a.season - b.season);

    return { history: { userTeamRecords: [], champions, teamHistory, nbaDrafts }, teamsWithBoost };
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
    const prestigeRange = SCHOOL_PRESTIGE_RANGES[name] || { min: 40, max: 65 };
    const prestige = randomBetween(prestigeRange.min, prestigeRange.max);
    const roster = [...Array.from({ length: 3 }, () => createPlayer('Sr')), ...Array.from({ length: 3 }, () => createPlayer('Jr')), ...Array.from({ length: 4 }, () => createPlayer('So')), ...Array.from({ length: 4 }, () => createPlayer('Fr'))];
    const sponsorName = SCHOOL_SPONSORS[name] || 'Nike';
    const sponsor = createSponsorFromName(sponsorName, initialSponsors);

    const conference = SCHOOL_CONFERENCES[name] || 'Independent';
    const wealth = seedProgramWealth(name, prestige, conference, prestige);
    const headCoach = createHeadCoachProfile(name, prestige, 1);
    const alumniRegistry = generateBaselineAlumniRegistry({ name, prestige, conference } as Team, DEFAULT_HISTORY_SEASONS);
    return {
        name,
        conference,
        state: SCHOOL_STATES[name] || 'Unknown',
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
        fanInterest: prestige,
        fanMorale: clamp(prestige + randomBetween(-10, 10), 5, 99),
        playbookFamiliarity: 50,
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
        },
        wealth,
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
      const initialFinances = calculateTeamRevenue(team, null);
      team.finances = initialFinances;
      team.initialProjectedRevenue = initialFinances;
      
      const weeks = 30;
      const allocations: BudgetAllocations = {
          marketing: Math.round(initialFinances.marketingExpenses / weeks),
          recruiting: Math.round(initialFinances.recruitingExpenses / weeks),
          facilities: Math.round(initialFinances.facilitiesExpenses / weeks),
          staffDevelopment: 0,
      };

      team.budget = { 
          cash: Math.max(0, initialFinances.totalRevenue - initialFinances.operationalExpenses),
          allocations
      };
      
      team.boardExpectations = {
          targetRevenue: Math.round(initialFinances.totalRevenue * 1.05),
          maxBudget: Math.round(initialFinances.totalRevenue * 0.95),
          boardPressure: 0,
          discretionaryFunds: 0
      };
      
      team.financialHistory = [];
      const nilBudget = calculateTeamNilBudget(team, {
          fanSentiment: team.fanSentiment || team.fanInterest,
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
  const schedule = generateSchedule(allTeams);
  let recruits: Recruit[] = Array.from({ length: 350 }, createRecruit);
  recruits = runInitialRecruitingOffers(allTeams, recruits);
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
  return { allTeams, schedule, recruits, sponsors: finalSponsors, initialHistory, internationalProspects, nbaSimulation, nbaTeams, nbaSchedule, eventPlaybookCatalog, sponsorQuestDeck };
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

export const CRUNCH_TIME_TRIGGER_MINUTES = 3; // Minutes remaining to trigger crunch time
export const CRUNCH_TIME_SCORE_DIFFERENCE = 5; // Max score difference to trigger crunch time

export const simulateGame = (homeTeam: Team, awayTeam: Team, gameId: string, adjustment?: GameAdjustment, half?: 1 | 2, existingBoxScore?: GameBoxScore, userCoachSkills?: string[]): GameBoxScore & { crunchTimeDecision?: boolean; timeRemaining?: number } => {
  const isNBA = homeTeam.league === 'NBA';
  const MINUTES_PER_GAME = isNBA ? 48 : 40;
  const TOTAL_TEAM_MINUTES = MINUTES_PER_GAME * 5;


  const homeAdvantage = 5;
  let gameTimeRemaining = half === 1 ? MINUTES_PER_GAME * 30 : MINUTES_PER_GAME * 60; // total seconds (40 min game * 60 sec/min)
  const secondsPerPossession = (MINUTES_PER_GAME * 60) / possessions;
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
  
  // Halftime Logic
  const possessionsToSim = half ? Math.floor(possessions / 2) : possessions;

  let homeScore = existingBoxScore ? existingBoxScore.homeScore : 0;
  let awayScore = existingBoxScore ? existingBoxScore.awayScore : 0;
  const playByPlay: PlayByPlayEvent[] = existingBoxScore ? [...existingBoxScore.playByPlay] : [];

  const homePlayable = getPlayableRoster(homeTeam);
  const awayPlayable = getPlayableRoster(awayTeam);
  
  // Initialize stats or use existing
  const homeStats: GamePlayerStats[] = existingBoxScore 
    ? existingBoxScore.homeTeamStats 
    : homePlayable.map(p => ({ playerId: p.id, name: p.name, pos: p.position, stats: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0, freeThrowsMade: 0, freeThrowsAttempted: 0, minutes: Math.round(p.rotationMinutes ?? 0) } }));
  
  const awayStats: GamePlayerStats[] = existingBoxScore
    ? existingBoxScore.awayTeamStats
    : awayPlayable.map(p => ({ playerId: p.id, name: p.name, pos: p.position, stats: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0, freeThrowsMade: 0, freeThrowsAttempted: 0, minutes: Math.round(p.rotationMinutes ?? 0) } }));

  let possessionTeam: 'home' | 'away' = 'home';
  // If resuming, maybe randomize possession? Or just default to home.
  if (existingBoxScore) {
      possessionTeam = Math.random() > 0.5 ? 'home' : 'away';
  }

  for (let i = 0; i < possessionsToSim; i++) {
    gameTimeRemaining = Math.max(0, gameTimeRemaining - secondsPerPossession);
    // Crunch time logic
    if (!existingBoxScore && half !== 1 && half !== 2 && homeTeam.isUserTeam && gameTimeRemaining <= CRUNCH_TIME_TRIGGER_MINUTES * 60) {
        const scoreDiff = Math.abs(homeScore - awayScore);
        if (scoreDiff <= CRUNCH_TIME_SCORE_DIFFERENCE) {
            return {
                gameId, homeTeam: homeTeam.name, awayTeam: awayTeam.name, homeScore, awayScore, homeTeamStats: homeStats, awayTeamStats: awayStats, playByPlay,
                crunchTimeDecision: true,
                timeRemaining: Math.floor(gameTimeRemaining / 60)
            };
        }
    }

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

  // Overtime / Tie-breaking logic (only if full game or end of second half)
  if (!half || half === 2) {
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
  }

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
                .filter(p => p.overall < p.potential && p.overall < 99)
                .sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall));
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
            const gap = Math.max(0, player.potential - player.overall);
            if (gap < 4) return;
            const prestigeBonus = team.prestige / 35;
            const potentialBonus = gap / 8;
            const highPotentialBoost = player.potential >= 95 ? 1.75 : player.potential >= 88 ? 1.25 : 1;
            const naturalSteps = Math.floor((potentialBonus + prestigeBonus) * highPotentialBoost);
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

const personalityInterestBonuses: Record<ProspectPersonality, (team: Team) => number> = {
    Loyal: team => getTeamCommunityScore(team) * 0.08,
    'NBA Bound': team => (team.prestige ?? 50) * 0.08 + getTeamMarketScore(team) * 0.03,
    'Academically Focused': team => getTeamAcademicScore(team) * 0.1,
    'Local Hero': team => getTeamCommunityScore(team) * 0.1,
    'Spotlight Seeker': team => getTeamMarketScore(team) * 0.08 + (team.prestige ?? 50) * 0.02,
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
        (recruit.stars * 10) + 
        (recruit.overall / 10) + 
        randomBetween(-10, 10);

    let prestigeFactor = (team.recruitingPrestige - 50) * 0.5;
    
    // Pipeline Bonus
    if (team.pipelines) {
        const pipeline = team.pipelines.find(p => p.state === recruit.homeState);
        if (pipeline) {
            if (pipeline.tier === 'Gold') prestigeFactor *= 1.5;
            else if (pipeline.tier === 'Silver') prestigeFactor *= 1.25;
            else if (pipeline.tier === 'Bronze') prestigeFactor *= 1.1;
        }
    }

    const recordFactor = (team.record.wins - team.record.losses) * 0.2;
    const needs = calculateTeamNeeds(team);
    const positionNeedFactor = needs.includes(recruit.position) || (recruit.secondaryPosition && needs.includes(recruit.secondaryPosition)) ? 5 : 0;
    const playingTimeFactor = (99 - (team.roster.find(p => p.position === recruit.position)?.overall || 50)) * 0.1;
    const inSeasonBonus = context.gameInSeason <= 31 ? context.gameInSeason * 0.1 : 0;
    const wealthBonus = getWealthRecruitingBonus(team) * 1.5;
    
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
    const marketScore = getTeamMarketScore(team);
    const communityScore = getTeamCommunityScore(team);
    const attributeScores = [
        attributeAlignment(academicScore, recruit.preferredProgramAttributes.academics),
        attributeAlignment(marketScore, recruit.preferredProgramAttributes.marketExposure),
        attributeAlignment(communityScore, recruit.preferredProgramAttributes.communityEngagement),
    ];
    const attributeBonus = attributeScores.reduce((sum, score) => sum + score, 0) * 4;
    const personalityBonus = personalityInterestBonuses[recruit.personalityTrait](team);
    const nilPriorityBonus = nilPriorityInterestBonuses[recruit.nilPriority](team);

    // New Recruiting Logic (Archetypes & Dealbreakers)
    let archetypeBonus = 0;
    const isHomeState = recruit.homeState === team.state;
    
    if (team.pipelines) {
        const pipeline = team.pipelines.find(p => p.state === recruit.homeState);
        if (pipeline) {
            if (pipeline.tier === 'Gold') prestigeFactor *= 1.5;
            else if (pipeline.tier === 'Silver') prestigeFactor *= 1.25;
            else if (pipeline.tier === 'Bronze') prestigeFactor *= 1.1;
        }
    }

    switch (recruit.archetype) {
        case 'BagChaser':
            archetypeBonus += wealthBonus * 2; // Double the impact of wealth
            break;
        case 'Hooper':
            archetypeBonus += playingTimeFactor * 2; // Double the impact of playing time
            break;
        case 'HometownHero':
            archetypeBonus += isHomeState ? 25 : -5; // Massive bonus for home state, slight penalty for leaving
            break;
        case 'Academic':
            archetypeBonus += (academicScore - 50) * 0.3; // Bonus for good academics
            break;
    }

    // Dealbreaker Logic (Penalties)
    let dealbreakerPenalty = 0;
    if (recruit.dealbreaker === 'Proximity' && !isHomeState) {
        dealbreakerPenalty = 50; // Effectively kills interest
    } else if (recruit.dealbreaker === 'Academics' && academicScore < 60) {
        dealbreakerPenalty = 30;
    } else if (recruit.dealbreaker === 'PlayingTime' && playingTimeFactor < 0) {
        dealbreakerPenalty = 25;
    } else if (recruit.dealbreaker === 'NIL' && wealthBonus < 0) {
        dealbreakerPenalty = 25;
    }

    let rawScore =
        baseInterest +
        prestigeFactor +
        recordFactor +
        positionNeedFactor +
        playingTimeFactor +
        inSeasonBonus +
        wealthBonus +
        budgetBonus +
        signingBonus +
        attributeBonus +
        personalityBonus +
        nilPriorityBonus +
        pipelineBonus +
        archetypeBonus -
        dealbreakerPenalty;

    // Apply Coach Skills (Silver Tongue)
    if (team.isUserTeam && userCoachSkills && userCoachSkills.includes('silver_tongue')) {
        rawScore = rawScore * 1.05; // +5% interest
    }

    return Math.round(clamp(rawScore, 1, 100));
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

        portalPlayers.push(...leavingPlayers.map(p => ({...p})));

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
                portalPlayers.push({...randomPlayer});
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

export const processRecruitingWeek = (teams: Team[], recruits: Recruit[], userTeamName: string, week: number, schedule: GameResult[][], isSigningPeriod: boolean = false, contactsMadeThisWeek: number = 0, contactPoints?: number, userCoachSkills?: string[]): { updatedRecruits: Recruit[], updatedContactsMadeThisWeek: number } => {
    let currentContactsMade = contactsMadeThisWeek;
    const updatedRecruits = JSON.parse(JSON.stringify(recruits));
    const teamsByName = new Map(teams.map(t => [t.name, t]));
    const userTeam = teams.find(t => t.isUserTeam);

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
                        let boost = 0;
                        if (won) {
                            boost = 15 + (rivalry ? 10 : 0) + (r.stars * 2);
                        } else {
                            boost = -10 - (rivalry ? 10 : 0) - (r.stars);
                        }
                        r.interest = Math.min(100, Math.max(0, r.interest + boost));
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

    // Enhanced AI teams recruiting logic based on prestige
    teams.forEach(team => {
        if (team.isUserTeam) return;

        const availableScholarships = 15 - team.roster.filter(p => p.year !== 'Sr').length;
        if (availableScholarships <= 0) return;

        let targetPool: Recruit[];
        let offerChance: number;

        // Define recruiting pools and aggressiveness based on prestige
        if (team.prestige > 80) { // High-Major
            targetPool = sortedRecruits.slice(0, 75);
            offerChance = 0.4; // More aggressive
        } else if (team.prestige > 65) { // Mid-Major
            targetPool = sortedRecruits.slice(50, 200);
            offerChance = 0.25;
        } else { // Low-Major
            targetPool = sortedRecruits.slice(150);
            offerChance = 0.15; // Less aggressive, more opportunistic
        }

        const potentialTargets = targetPool.filter(r => !r.cpuOffers.includes(team.name) && !r.verbalCommitment);

        if (potentialTargets.length > 0 && Math.random() < offerChance) {
            const target = potentialTargets[0]; // Target the best player in their pool
            target.cpuOffers.push(team.name);
        }
    });

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
                r.interest = Math.min(100, Math.round(r.interest + boost));
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
                    r.interest = Math.min(100, r.interest + randomBetween(15, 25));
                }
            }
        }
    }

    updatedRecruits.forEach((r: Recruit) => {
        if (r.verbalCommitment) return;

        const allOffers = [...r.cpuOffers, ...(r.userHasOffered ? [userTeamName] : [])].filter(offer => !r.declinedOffers.includes(offer));
        if (allOffers.length === 0) return;

        const offerDetails = allOffers.map(teamName => ({ name: teamName, score: calculateRecruitInterestScore(r, teamsByName.get(teamName)!, { gameInSeason: week, isSigningPeriod }, teamName === userTeamName ? userCoachSkills : undefined) }));
        offerDetails.sort((a, b) => b.score - a.score);
        
        const topOffer = offerDetails[0];
        if (!topOffer) return;
        
        const commitThreshold = 70;
        const interestDifference = offerDetails.length > 1 ? topOffer.score - offerDetails[1].score : 100;
        
        if (isSigningPeriod) {
            // During signing period, commitment threshold drops each day.
            // Day 1: 60, Day 2: 55, ..., Day 7: 30
            const signingDay = (week - 32); // signingPeriodDay is passed as week
            const signingCommitThreshold = 65 - (signingDay * 5);
            if (topOffer.score > signingCommitThreshold) {
                r.verbalCommitment = topOffer.name;
                r.isTargeted = false;
                if (r.userHasOffered) {
                    r.userHasOffered = false;
                }
            }
        } else if (topOffer.score > commitThreshold && interestDifference > 5) {
            r.verbalCommitment = topOffer.name;
            r.isTargeted = false;
            if (r.userHasOffered) {
                r.userHasOffered = false;
            }
        } else if (week > 8 && r.stars <= 3 && allOffers.length <= 4) {
            // Late season "desperation" for lower-rated recruits with few offers
            const desperationCommitThreshold = 30 + (week - 8); // Starts at 30 and increases
            if (topOffer.score > desperationCommitThreshold) {
                r.verbalCommitment = topOffer.name;
                r.isTargeted = false;
                if (r.userHasOffered) {
                    r.userHasOffered = false;
                }
            }
        }
    });

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

export const advanceToNewSeason = (teams: Team[], recruits: Recruit[], season: number, userCoachSkills?: string[]): { finalTeams: Team[] } => {
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
                const { verbalCommitment, userHasOffered, cpuOffers, interest, stars, declinedOffers, isTargeted, ...playerData } = r;
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

        return teamWithPipelines;
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
            homeTeam: firstFourTeams[i].name, 
            awayTeam: firstFourTeams[i+1].name, 
            homeScore: 0, 
            awayScore: 0, 
            played: false, 
            homeSeed: 16, 
            awaySeed: 16 
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
                homeTeam: homeTeam?.name,
                homeSeed: p.high,
                awayTeam: awayTeam?.name,
                awaySeed: p.low,
                homeScore: 0,
                awayScore: 0,
                played: false,
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
    nbaSimulation?: NBASimulationResult
): { updatedTeams: Team[], draftResults: DraftPick[], nbaSimulation: NBASimulationResult } => {
    const simulation = nbaSimulation ?? simulateNBASeason(season);
    const prospectCount = Math.min(60, simulation.draftOrder.length * 2);
    const prospectBoard = buildDraftProspectBoard(teams, internationalProspects, prospectCount, season);
    const picksToMake = Math.min(prospectBoard.length, simulation.draftOrder.length * 2);
    const draftOrder = [...simulation.draftOrder, ...simulation.draftOrder].slice(0, picksToMake);

    const draftResults: DraftPick[] = draftOrder.map((nbaTeam, index) => {
        const prospect = prospectBoard[index];
        if (!prospect) return null;
        return {
            pick: index + 1,
            round: (index < simulation.draftOrder.length ? 1 : 2) as 1 | 2,
            player: prospect.player,
            season,
            originalTeam: prospect.originalTeam,
            nbaTeam,
            source: prospect.source,
            originDescription: prospect.originDescription,
        } as DraftPick;
    }).filter((pick): pick is DraftPick => !!pick);

    const draftedPlayerIds = new Set(
        draftResults
            .filter(d => d.source === 'NCAA')
            .map(d => d.player.id)
    );
    const updatedTeams = teams.map(team => ({
        ...team,
        roster: team.roster.filter(p => !draftedPlayerIds.has(p.id)),
    }));

    return { updatedTeams, draftResults, nbaSimulation: simulation };
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
        .map(r => `${r.stars}★ ${r.position} ${r.name} (#${r.overall} OVR) signed with your team.`);

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
            if (player.overall >= player.potential) return player;
            const improvement = Math.random() * ((player.potential - player.overall) / 10) + (player.xFactor / 20);
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

                offers.push({ sponsorName: name, contractLength, yearlyValue });
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
                    const total = o.yearlyValue * o.contractLength;
                    if (!best || total > bestTotal || (total === bestTotal && o.yearlyValue > (best?.yearlyValue || 0))) {
                        best = o;
                        bestTotal = total;
                    }
                }
                if (best && (best.yearlyValue >= currentValue || bestTotal >= currentValue * 3)) {
                    const accepted = createSponsorFromName(best.sponsorName, sponsors);
                    newTeam.sponsor = accepted;
                    newTeam.sponsorContractYearsRemaining = best.contractLength;
                    newTeam.sponsorContractLength = best.contractLength;
                    newTeam.sponsorOffers = [];
                    const recalced = calculateSponsorRevenueSnapshot({ ...newTeam, sponsor: accepted });
                    newTeam.sponsorRevenue = { ...recalced, total: best.yearlyValue };
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
    };

    const specialties: Record<StaffRole, StaffSpecialty[]> = {
        'Assistant Coach': ['Offense: Motion', 'Offense: Run & Gun', 'Offense: Princeton', 'Defense: Pack Line', 'Defense: Full Court Press', 'Defense: 2-3 Zone'],
        'Trainer': ['Training: Strength', 'Training: Conditioning', 'Training: Recovery'],
        'Scout': ['Scouting: High School', 'Scouting: International', 'Scouting: Transfer Portal'],
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

export const initializeNBATeams = (): Team[] => {
    return NBA_TEAMS.map(info => {
        // Generate a roster of 15 players
        const roster: Player[] = [];
        // Starters
        roster.push(createPlayer('Sr', 'PG'));
        roster.push(createPlayer('Sr', 'SG'));
        roster.push(createPlayer('Sr', 'SF'));
        roster.push(createPlayer('Sr', 'PF'));
        roster.push(createPlayer('Sr', 'C'));
        // Bench
        for (let i = 0; i < 10; i++) {
            const pos = pickRandom(['PG', 'SG', 'SF', 'PF', 'C'] as RosterPositions[]);
            roster.push(createPlayer('Sr', pos));
        }

        // Boost ratings for NBA level
        roster.forEach(p => {
            p.overall = Math.min(99, p.overall + 25); // NBA players are elite
            p.potential = Math.min(99, p.potential + 20);
            Object.keys(p.stats).forEach(key => {
                const k = key as keyof Player['stats'];
                p.stats[k] = Math.min(99, p.stats[k] + 25);
            });
            // Add NBA specific fields
            p.age = randomBetween(19, 35);
            p.experience = Math.max(0, p.age! - 20);
            p.contract = {
                salary: randomBetween(1000000, 40000000),
                yearsLeft: randomBetween(1, 5),
                type: 'Guaranteed'
            };
            p.nbaStats = { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 };
        });

        const team: Team = {
            name: info.name,
            conference: info.conference,
            division: 'Central', // Placeholder, would need real divisions
            league: 'NBA',
            state: 'Unknown', // Placeholder
            prestige: 80, // Placeholder
            recruitingPrestige: 80,
            roster,
            staff: generateStaffCandidates(), // Reuse staff gen for now
            record: { wins: 0, losses: 0 },
            sponsor: { name: 'Nike', tier: 'Elite' }, // Default sponsor
            sponsorRevenue: { jersey: 0, shoe: 0, merch: 0, total: 0 },
            sponsorContractYearsRemaining: 5,
            sponsorContractLength: 5,
            sponsorOffers: [],
            fanInterest: 80,
            prices: { ticketPrice: 100, jerseyPrice: 120, merchandisePrice: 40, concessionFoodPrice: 15, concessionDrinkPrice: 10, parkingPrice: 50 },
            finances: {
                baseRevenue: 0, gateRevenue: 0, merchandiseRevenue: 0, concessionsRevenue: 0, parkingRevenue: 0, donationRevenue: 0, endowmentSupport: 0, tournamentShare: 0, sponsorPayout: 0, totalRevenue: 0,
                operationalExpenses: 0, firedStaffSalaries: 0, facilitiesExpenses: 0, travelExpenses: 0, recruitingExpenses: 0, marketingExpenses: 0, administrativeExpenses: 0, staffPayrollExpenses: 0
            },
            wealth: { endowmentScore: 0, donationLevel: 0, boosterPool: 0, donorMomentum: 0 },
            headCoach: createHeadCoachProfile(info.name, 80),
            salaryCapSpace: 10000000,
            luxuryTaxBill: 0,
            concessions: { tier: 'Standard', alcoholPolicy: true, items: [] },
            merchandising: { inventoryStrategy: 'Aggressive', jerseySales: {}, items: [] },
            parking: { generalPrice: 25, vipPrice: 75, tailgateCulture: 50000 },
        };
        return team;
    });
};

export const generateNBASchedule = (teams: Team[]): GameResult[][] => {
    const schedule: GameResult[][] = [];
    const weeks = 31; // Align with NCAA 31 weeks
    
    // Simple round-robin-ish generator for now to fill 82 games
    // This is a simplified generator. A real one is complex.
    // We will just generate random matchups for each week to approximate 82 games.
    
    // Approx 2.6 games per week per team.
    
    for (let w = 0; w < weeks; w++) {
        const weekGames: GameResult[] = [];
        // Each team plays 2-3 games this week
        const teamsScheduled = new Set<string>();
        
        // Shuffle teams
        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        
        // Create pairings
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                // Game 1
                weekGames.push({
                    homeTeam: shuffled[i].name,
                    awayTeam: shuffled[i+1].name,
                    homeScore: 0,
                    awayScore: 0,
                    played: false
                });
                
                // Game 2 (swap home/away or new opponent) - simplified: just 2 games per week for everyone + extras later
                 weekGames.push({
                    homeTeam: shuffled[i+1].name,
                    awayTeam: shuffled[i].name,
                    homeScore: 0,
                    awayScore: 0,
                    played: false
                });
                
                // Add a 3rd game for some teams to reach 82?
                // 31 weeks * 2 games = 62 games. Need 20 more.
                // So ~65% of weeks have a 3rd game.
                if (Math.random() < 0.65) {
                     weekGames.push({
                        homeTeam: shuffled[i].name,
                        awayTeam: shuffled[i+1].name, // Repeat matchup for simplicity in this heuristic
                        homeScore: 0,
                        awayScore: 0,
                        played: false
                    });
                }
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

export const processWeeklyFinances = (team: Team, week: number): Team => {
    if (!team.budget || !team.budget.allocations) return team;

    const { marketing, recruiting, facilities, staffDevelopment } = team.budget.allocations;
    const totalWeeklyExpenses = marketing + recruiting + facilities + staffDevelopment;

    // Calculate Weekly Merch Revenue
    const merchRevenue = calculateWeeklyMerchRevenue(team);
    const licensingRevenue = calculateLicensingRevenue(team);

    // Update Cash (Revenue - Expenses)
    const newCash = Math.max(0, team.budget.cash + merchRevenue + licensingRevenue - totalWeeklyExpenses);

    // Record history
    // Note: Revenue is typically calculated per game, so we might need to pass that in or handle it separately.
    // For now, we record the expense side and merch revenue.
    const historyEntry: FinancialWeekRecord = {
        week,
        revenue: merchRevenue + licensingRevenue, // Base weekly revenue (game revenue added elsewhere)
        expenses: totalWeeklyExpenses,
        profit: (merchRevenue + licensingRevenue) - totalWeeklyExpenses,
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

    return {
        ...team,
        budget: { ...team.budget, cash: newCash },
        fanInterest: newFanInterest,
        facilities: newFacilities,
        nilCollective: newNilCollective,
        financialHistory: [...(team.financialHistory || []), historyEntry]
    };
};

export const updateBoardExpectations = (team: Team): Team => {
    if (!team.boardExpectations) return team;

    const { targetRevenue, maxBudget } = team.boardExpectations;
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

    const newPressure = clamp(team.boardExpectations.boardPressure + pressureChange, 0, 100);
    const newDiscretionary = team.boardExpectations.discretionaryFunds + discretionaryChange;

    // Set new targets for next year
    const newTargetRevenue = Math.round(actualRevenue * 1.03); // Expect 3% growth
    const newMaxBudget = Math.round(newTargetRevenue * 0.95);

    return {
        ...team,
        boardExpectations: {
            targetRevenue: newTargetRevenue,
            maxBudget: newMaxBudget,
            boardPressure: newPressure,
            discretionaryFunds: newDiscretionary
        }
    };
};

export const calculateDetailedConcessionsRevenue = (team: Team, attendance: number, week: number): number => {
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
    const effectiveFoodPrice = team.prices.concessionFoodPrice * tierMultiplier * dynamicMultiplier;
    const effectiveDrinkPrice = team.prices.concessionDrinkPrice * tierMultiplier * dynamicMultiplier;
    const willingness = calculateFanWillingness(team);
    const foodSentimentPenalty = Math.max(0, (effectiveFoodPrice - willingness.concessionFood) / willingness.concessionFood);
    const drinkSentimentPenalty = Math.max(0, (effectiveDrinkPrice - willingness.concessionDrink) / willingness.concessionDrink);
    const sentimentPenalty = Math.max(foodSentimentPenalty, drinkSentimentPenalty);
    const baseTierBuyRate = concessions.tier === 'Premium' ? 0.35 : concessions.tier === 'Basic' ? 0.6 : 0.45;
    
    const tailgateInvestment = team.parking?.tailgateCulture || 0;
    const tailgateBoost = Math.min(0.1, tailgateInvestment / 50000); // Up to 10% boost for $5k investment

    const adjustedBuyRate = baseTierBuyRate * Math.max(0.4, 1 - sentimentPenalty * 0.4) * (1 + tailgateBoost);
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
    const parking = team.parking ?? {
        generalPrice: team.prices.parkingPrice || 10,
        vipPrice: (team.prices.parkingPrice || 10) * 1.5,
        tailgateCulture: 0,
        revenueSettings: SERVICE_DEFAULT_PARKING_SETTINGS,
    };
    const settings = parking.revenueSettings ?? SERVICE_DEFAULT_PARKING_SETTINGS;
    const generalPrice = parking.generalPrice * settings.surgeMultiplier;
    const vipPrice = parking.vipPrice * settings.surgeMultiplier;
    const cars = Math.round(attendance / 2.5);
    const vipSpots = 500;
    const vipDemand = Math.min(vipSpots, Math.round(cars * 0.1));
    const generalCars = Math.max(0, cars - vipDemand);
    const earlyAccessOrders = Math.min(150, Math.max(0, Math.round(attendance / 25)));
    const earlyAccessRevenue = earlyAccessOrders * settings.earlyAccessPremium;
    const amenityRevenue = attendance * 0.05 * settings.amenityAddonPrice;

    return (vipDemand * vipPrice) + (generalCars * generalPrice) + earlyAccessRevenue + amenityRevenue;
};

export const calculateWeeklyMerchRevenue = (team: Team): number => {
    const pricing = team.merchandising?.pricing ?? SERVICE_DEFAULT_MERCH_PRICING;
    const willingness = calculateFanWillingness(team);
    const baseMerchDemand = (team.fanInterest * 200) + (team.prestige * 1500);
    const jerseyPrice = team.prices.jerseyPrice * pricing.authenticMultiplier * (pricing.flashSaleActive ? 1 - pricing.flashSaleDepth : 1);
    const merchPrice = team.prices.merchandisePrice * pricing.apparelMultiplier * (pricing.flashSaleActive ? 1 - pricing.flashSaleDepth : 1);
    const jerseyPriceSentimentPenalty = Math.max(0, (jerseyPrice - willingness.jersey) / willingness.jersey);
    const merchPriceSentimentPenalty = Math.max(0, (merchPrice - willingness.merchandise) / willingness.merchandise);
    const starBoost = Math.min(0.6, (team.roster.filter(p => p.overall >= 90).length) * pricing.playerSegmentBoost);
    const playerBoost = 1 + starBoost;
    const jerseyRevenue = (baseMerchDemand * 0.08 * jerseyPrice) * Math.max(0.1, 1 - jerseyPriceSentimentPenalty) * playerBoost;
    const generalMerchRevenue = (baseMerchDemand * 0.15 * merchPrice) * Math.max(0.1, 1 - merchPriceSentimentPenalty);
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

export const runSimulationForWeek = (
    state: GameState, 
    week: number, 
    teams: Team[], 
    recruits: Recruit[], 
    nbaTeams?: Team[], 
    nbaSchedule?: GameResult[][],
    options?: {
        stopAtHalftime?: boolean;
        resumeFromHalftime?: {
            gameId: string;
            adjustment: GameAdjustment;
            existingState: GameBoxScore;
        }
    },
    userCoachSkills?: string[]
): { 
    updatedAllTeams: Team[], 
    updatedSchedule: GameResult[][], 
    updatedRecruits: Recruit[], 
    gameLogs: GameBoxScore[], 
    newUserTeamAttendance: GameAttendanceRecord[], 
    updatedCoach: Coach | null, 
    updatedNBATeams?: Team[], 
    updatedNBASchedule?: GameResult[][],
    halftimeState?: { gameId: string, boxScore: GameBoxScore },
    crunchTimeState?: { gameId: string, boxScore: GameBoxScore, timeRemaining: number }
} => {
    const gameDayMatchups = state.schedule[week - 1] || [];
    const gameLogs: GameBoxScore[] = [];
    const newUserTeamAttendance: GameAttendanceRecord[] = [];
    const teamsCopy: Team[] = JSON.parse(JSON.stringify(teams));
    const teamsByName = new Map<string, Team>(teamsCopy.map((t: Team) => [t.name, t]));
    let updatedCoach = state.coach ? JSON.parse(JSON.stringify(state.coach)) as Coach : null;
    let halftimeState: { gameId: string, boxScore: GameBoxScore } | undefined = undefined;
    let crunchTimeState: { gameId: string, boxScore: GameBoxScore, timeRemaining: number } | undefined = undefined;

    // --- NCAA Simulation ---
    for (const game of gameDayMatchups) {
        const homeTeam = teamsByName.get(game.homeTeam);
        const awayTeam = teamsByName.get(game.awayTeam);
        if (homeTeam && awayTeam) {
            const gameId = `S${state.season}G${week}-${homeTeam.name}v${awayTeam.name}`;
            
            // Resume Logic
            if (options?.resumeFromHalftime) {
                if (gameId === options.resumeFromHalftime.gameId) {
                    const res = simulateGame(homeTeam, awayTeam, gameId, options.resumeFromHalftime.adjustment, 2, options.resumeFromHalftime.existingState, userCoachSkills);
                    gameLogs.push(res);
                    
                    if (homeTeam.name === state.userTeam?.name) {
                        const forecast = calculateAttendance(homeTeam, awayTeam, week);
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
                // No early return here, other games still need to simulate
                continue; // Continue to next game in the loop
            }

            // Normal or Halftime Logic
            const isUserGame = homeTeam.name === state.userTeam?.name || awayTeam.name === state.userTeam?.name;
            
            if (isUserGame && options?.stopAtHalftime) {
                const res = simulateGame(homeTeam, awayTeam, gameId, undefined, 1, undefined, userCoachSkills);
                halftimeState = { gameId, boxScore: res };
                gameLogs.push(res); // Push partial stats so they are reflected in the UI/Team state temporarily
            } else {
                const skillsToPass = isUserGame ? userCoachSkills : undefined;
                const simulatedGameResult = simulateGame(homeTeam, awayTeam, gameId, undefined, undefined, undefined, skillsToPass);
                
                if (simulatedGameResult.crunchTimeDecision && simulatedGameResult.timeRemaining !== undefined && isUserGame) {
                    crunchTimeState = { 
                        gameId, 
                        boxScore: simulatedGameResult as GameBoxScore, // Cast to GameBoxScore as crunchTimeDecision is not part of the actual GameBoxScore interface, but a temporary flag
                        timeRemaining: simulatedGameResult.timeRemaining
                    };
                    break; // Stop simulating other games for this week, return for crunch time decision
                }
                gameLogs.push(simulatedGameResult);
            }

            if (homeTeam.name === state.userTeam?.name && !options?.stopAtHalftime) {
                const forecast = calculateAttendance(homeTeam, awayTeam, week);
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

    if (nbaTeams && nbaSchedule) {
        const nbaTeamsCopy: Team[] = JSON.parse(JSON.stringify(nbaTeams));
        const nbaTeamsByName = new Map<string, Team>(nbaTeamsCopy.map((t: Team) => [t.name, t]));
        const nbaWeekGames = nbaSchedule[week - 1] || [];
        const nbaGameLogs: GameBoxScore[] = [];

        nbaWeekGames.forEach(game => {
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

        updatedNBATeams = nbaTeamsCopy;
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
    const { updatedRecruits } = processRecruitingWeek(teamsWithDevelopment, recruits, state.userTeam!.name, week, state.schedule, false, state.contactsMadeThisWeek, getContactPoints(state.userTeam), userCoachSkills);

    return { updatedAllTeams: teamsWithDevelopment, updatedSchedule, updatedRecruits, gameLogs, newUserTeamAttendance, updatedCoach, updatedNBATeams, updatedNBASchedule, crunchTimeState };
};
