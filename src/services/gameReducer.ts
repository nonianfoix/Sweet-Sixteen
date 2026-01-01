import type {
  GameState,
  GameDate,
  GameAction,
  RotationPreference,
  Team,
  Player,
  Recruit,
  GameResult,
  InterestTier,
  RosterPositions,
  TournamentMatchup,
  UserSeasonRecord,
  ChampionRecord,
  TrainingFocuses,
  Sponsor,
  Tournament,
  TournamentRegionName,
  GameBoxScore,
  DraftPick,
  SponsorRevenue,
  TeamHistory,
  SponsorOffer,
  SponsorData,
  Prices,
  PricePresetKey,
  Finances,
  FinancialInvestmentType,
  GameAttendanceRecord,
  SeatMix,
  SeatSegmentKey,
  ScheduledEvent,
  EconomyEventFeedItem,
  SponsorQuest,
  SponsorQuestStatus,
  SeasonRecapData,
  SeasonRecapResult,
  ContractGoal,
  TimelineEvent,
  Coach,
  CoachContract,
  CoachSeasonRecord,
  Staff,
  StaffGroupKey,
  PendingStaffRenewal,
  TeamColors,
  InternationalProspect,
  DraftProspect,
  DraftProspectSource,
  NBASimulationResult,
  NBADraftHistoryEntry,
  TrainingFocus,
  TrainingIntensity,
  Transfer,
  Pipeline,
  HeadCoachProfile,
  JobOffer,
  StaffRole,
  NilNegotiationCandidate,
  PlayByPlayEvent,
  NBATeamSimulation,
  NBAFreeAgent,
  NBATransaction,
  NBAPlayoffs,
  GameAdjustment,
  Loan,
  MarketingCampaign,
  NilNegotiationStatus,
  OfferPitchType,
  SponsorTier,
  PlayerDevelopmentDNA,
  PlayerPlayStyleIdentity,
  RecruitDecisionStyle,
  RecruitCommitmentStyle
} from '../types';
import { GameStatus, ScheduledEventStatus, EventType, GameEvent } from '../types';
import type { SponsorName } from '../types';
import * as constants from '../constants';
import { initializeGameWorld, simulateGame, processInSeasonDevelopment, processRecruitingWeek, runSimulationForDate, runDailySimulation, advanceToNewSeason, rollOverTeamsForNextSeason, createTournament, generateSchedule, createRecruit, processTraining, autoSetStarters, generateSigningAndProgressionSummaries, processDraft, fillRosterWithWalkOns, calculateRecruitInterestScore, calculateRecruitInterestBreakdown, getRecruitWhyBadges, estimateRecruitDistanceMilesToTeam, getRecruitRegionForState, buildRecruitOfferShortlist, getRecruitOfferShareTemperatureMultiplier, calculateSponsorRevenueSnapshot, createSponsorFromName, recalculateSponsorLandscape,  calculateTeamRevenue, calculateCurrentSeasonEarnedRevenue, runInitialRecruitingOffers, calculateTeamNeeds, processEndOfSeasonPrestigeUpdates, randomBetween, generateContractOptions, generateJobOffers, updateCoachReputation, calculateCoachSalary, generateStaffCandidates, calculateOverall, generateFreeAgentStaff, getTrainingPoints, getContactPoints, calculateFanWillingness, seedProgramWealth, getWealthRecruitingBonus, getWealthTrainingBonus, generateInternationalProspects, simulateNBASeason, buildDraftProspectBoard, calculateNBACoachSalary, generateNBAJobOffers, createHeadCoachProfile, ensureArenaFacility, createNilCollectiveProfile, buildEventPlaybookCatalog, buildSponsorQuestDeck, calculateAttendance, clampZonePriceModifier, processTransferPortalOpen, processTransferPortalDay, clamp, processWeeklyFinances, processFacilityConstruction, degradeFacilities, generateSponsorOffers, hireStaff, updateSponsorContracts, updateConcessionPricing, updateMerchPricing, updateTicketPricing, setMerchInventoryStrategy, toggleDynamicPricing, setTravelSettings, scheduleEvent, cancelEvent, calculateBoardPressure, updateStaffPayroll, startCapitalProject, contributeToProject, initializeEconomy, requestFunds, generateBoardExpectations, toContractBoardExpectations, generatePoachingOffers, finalizeNBASeason, formatCurrency, updateTeamWithUserCoach, generateInitialNBAFreeAgents, processNBAWeeklyMoves, applyNBAFreeAgentRetirementRules, buildInitialDraftPickAssets, calculateRetentionProbability, seasonToCalendarYear, generateNBASchedule, buildSeasonAnchors, generateSeasonSchedule, validateSeasonSchedule, generateRecruitRelationships, recomputeRecruitBoardRanks, applyPackageDealOfferMirroring, ensureFullTeamData, calculateCoachPerformanceIndex } from './gameService';
import { computeDraftPickOwnership, DraftSlotAssignment } from './draftUtils';
import { ensurePlayerNilProfile, buildNilNegotiationCandidates, evaluateNilOffer, calculateTeamNilBudget } from './nilService';
import { generateAlumni, updateAlumniRegistry } from './alumniService';
import { NBA_SALARIES } from '../data/nbaSalaries';
import { NBA_DRAFT_PICK_RULES } from '../data/nbaDraftPickSwaps';
import { getGameDateString, getGameDateStringFromEventQueue } from './calendarService';
import { getSchoolLogoUrl, bestTextColor, getProgramWealth } from './utils';
import { SEASON_START_DATE, isSameISO, addDaysISO, jsDateToISODateUTC, formatISODate, gameDateToISODateUTC } from './dateService';

const { SCHOOLS, SCHOOL_PRESTIGE_RANGES, SCHOOL_ENDOWMENT_OVERRIDES, SCHOOL_SPONSORS, INITIAL_SPONSORS, SPONSOR_SLOGANS, ARENA_CAPACITIES, FIRST_NAMES, FEMALE_FIRST_NAMES, LAST_NAMES, NBA_TEAMS, INTERNATIONAL_PROGRAMS, SPONSORS, ACTIVE_NBA_PLAYERS_DATA, US_STATES, SCHOOL_STATES, COACH_SKILL_TREE, RECRUITING_COSTS, SCHOOL_COLORS, SCHOOL_CONFERENCES, ALL_TIME_NBA_ALUMNI_COUNTS, NBA_ACRONYM_TO_NAME, BASE_CALENDAR_YEAR } = constants;


const NBA_NAME_TO_ACRONYM: Record<string, string> = Object.entries(NBA_ACRONYM_TO_NAME).reduce(
    (map, [acronym, name]) => {
        if (!map[name]) {
            map[name] = acronym;
        }
        return map;
    },
    {} as Record<string, string>
);

export const getTeamAbbreviation = (teamName: string) => NBA_NAME_TO_ACRONYM[teamName] || teamName;

const NBA_LOGO_MODULES = import.meta.glob('../NBA Logos/*.png', { eager: true, as: 'url' }) as Record<string, string>;
const NBA_LOGO_BY_SLUG = Object.fromEntries(
    Object.entries(NBA_LOGO_MODULES).map(([modulePath, url]) => {
        const fileName = modulePath.split('/').pop() || '';
        const slug = fileName.replace(/-logo\.png$/i, '');
        return [slug, url];
    })
);
const TEAM_NAME_LOGO_SLUG_OVERRIDES: Record<string, string> = {
    'LA Clippers': 'los-angeles-clippers',
};
const slugifyTeamName = (teamName: string) =>
    teamName
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
export const getTeamLogoUrl = (teamName: string) => {
    const slug = TEAM_NAME_LOGO_SLUG_OVERRIDES[teamName] || slugifyTeamName(teamName);
    return NBA_LOGO_BY_SLUG[slug];
};

const syncSelectedNBATeamWithRoster = (selected: Team | NBATeamSimulation | null, nbaTeams: Team[]): Team | NBATeamSimulation | null => {
    if (!selected) return null;
    const matched = nbaTeams.find(team => team.name === selected.name);
    return matched || selected;
};

export const CURRENT_SAVE_VERSION = 6;

const MAX_TEAM_MINUTES = 200;

const upsertDraftHistoryEntry = (drafts: NBADraftHistoryEntry[] | undefined, entry: NBADraftHistoryEntry): NBADraftHistoryEntry[] => {
    const filtered = (drafts || []).filter(d => d.season !== entry.season);
    return [...filtered, entry];
};

export const ROTATION_PREFERENCE_OPTIONS: { value: RotationPreference; label: string; description: string }[] = [
    { value: 'balanced', label: 'Balanced', description: 'Let the system prioritize overall strength.' },
    { value: 'starterHeavy', label: 'Starter Heavy', description: 'Keep starters on the floor and limit bench minutes.' },
    { value: 'sevenSecond', label: '7-Second', description: 'Favor playmakers/grinders who push the pace early.' },
    { value: 'threeAndD', label: '3 & D', description: 'Reward defenders who can space the floor.' },
    { value: 'defensive', label: 'Defense First', description: 'Lean on players with strong defensive metrics.' },
];

const rotationPreferenceBoosters: Record<RotationPreference, (player: Player) => number> = {
    balanced: () => 1,
    starterHeavy: player => player.starterPosition ? 1.35 : 0.9,
    sevenSecond: player => 1 + (player.stats.playmaking + player.stats.outsideScoring) / 220,
    threeAndD: player => 1 + (player.stats.outsideScoring + player.stats.perimeterDefense) / 250,
    defensive: player => 1 + (player.stats.perimeterDefense + player.stats.insideDefense) / 250,
};

export const TRAINING_STAT_LABELS: Record<keyof Player['stats'], string> = {
    insideScoring: 'Inside Scoring',
    outsideScoring: 'Outside Scoring',
    playmaking: 'Playmaking',
    perimeterDefense: 'Perimeter Defense',
    insideDefense: 'Interior Defense',
    rebounding: 'Rebounding',
    stamina: 'Stamina',
};

const AUTO_TRAINING_LOG_LIMIT = 20;
const AUTO_TRAINING_STAT_KEYS: (keyof Player['stats'])[] = ['insideScoring', 'outsideScoring', 'playmaking', 'perimeterDefense', 'insideDefense', 'rebounding'];


export const PRICE_PRESETS: Record<PricePresetKey, { label: string; description: string; multipliers: Record<keyof Prices, number> }> = {
    fanFriendly: {
        label: 'Fan Friendly',
        description: 'Trim prices ~10% to spike demand while protecting core revenue.',
        multipliers: {
            ticketPrice: 0.9,
            jerseyPrice: 0.92,
            merchandisePrice: 0.9,
            concessionFoodPrice: 0.9,
            concessionDrinkPrice: 0.9,
            parkingPrice: 0.88,
        },
    },
    balanced: {
        label: 'Baseline',
        description: 'Reset to your current season prices.',
        multipliers: {
            ticketPrice: 1,
            jerseyPrice: 1,
            merchandisePrice: 1,
            concessionFoodPrice: 1,
            concessionDrinkPrice: 1,
            parkingPrice: 1,
        },
    },
    premium: {
        label: 'Booster Boost',
        description: 'Lean into demand with 8-15% hikes for quick cash.',
        multipliers: {
            ticketPrice: 1.08,
            jerseyPrice: 1.12,
            merchandisePrice: 1.1,
            concessionFoodPrice: 1.06,
            concessionDrinkPrice: 1.06,
            parkingPrice: 1.15,
        },
    },
};


export const INTEREST_TIERS: InterestTier[] = [
    { min: 90, label: 'Locked', color: '#0B8043' },
    { min: 75, label: 'Warm', color: '#1B9AAA' },
    { min: 50, label: 'Open', color: '#F4B400' },
    { min: 30, label: 'Cool', color: '#F57C00' },
    { min: 0, label: 'Cold', color: '#B22222' },
];

export const getInterestTier = (interest: number) => INTEREST_TIERS.find(tier => interest >= tier.min) || INTEREST_TIERS[INTEREST_TIERS.length - 1];
const normalizeInterest = (value: number) => clamp(Math.round(value), 0, 100);
const formatPotentialValue = (value?: number) => (typeof value === 'number' ? Math.round(value) : '-');

export const FINANCIAL_INVESTMENTS: Record<FinancialInvestmentType, { label: string; cost: number; description: string; affects: 'recruiting' | 'training' | 'marketing'; successMessage: string; impact: string }> = {
    recruitingCampaign: {
        label: 'Recruiting Blitz',
        cost: 500000,
        description: 'Host booster galas and VIP visit weekends to shake the recruiting landscape.',
        affects: 'recruiting',
        successMessage: 'Booster spending surges! Recruiting bonuses improved.',
        impact: '+Booster pool, +donor energy, higher contact points.',
    },
    trainingFacilities: {
        label: 'Facility Upgrade',
        cost: 750000,
        description: 'Invest in practice tech and recovery suites to speed up development.',
        affects: 'training',
        successMessage: 'New training wing opens! Training bonuses increased.',
        impact: '+Endowment score, +training points, happier players.',
    },
    marketingPush: {
        label: 'Marketing Push',
        cost: 300000,
        description: 'City-wide campaign plus NIL showcases to hype the brand.',
        affects: 'marketing',
        successMessage: 'Fans energized by the marketing blitz!',
        impact: '+Fan interest, +donor momentum, larger crowds.',
    },
};

const applyHeadCoachResult = (team: Team, didWin: boolean) => {
    if (!team.headCoach) return;
    if (didWin) {
        team.headCoach.careerWins += 1;
        team.headCoach.seasonWins += 1;
    } else {
        team.headCoach.careerLosses += 1;
        team.headCoach.seasonLosses += 1;
    }
};

const alignTeamHeadCoachWithUser = (team: Team, coach: Coach, season?: number): Team => {
    const preparedTeam = ensureTeamEconomyState(ensureTeamHeadCoach(team));
    const existing = preparedTeam.headCoach!;
    const startSeason = season ?? existing.startSeason ?? 1;
    const isFirstGig = coach.history.length === 0;
    const stops = [...(existing.careerStops || [])];
    if (isFirstGig || !stops.length) {
        stops.length = 0;
        stops.push({ teamName: team.name, startSeason });
    } else {
        const last = { ...stops[stops.length - 1] };
        if (last.teamName !== team.name) {
            if (!last.endSeason && season) {
                last.endSeason = Math.max(last.startSeason, season - 1);
            }
            stops[stops.length - 1] = last;
            stops.push({ teamName: team.name, startSeason: season ?? last.startSeason });
        }
    }
    const updatedHeadCoach: HeadCoachProfile = {
        ...existing,
        name: coach.name,
        reputation: coach.reputation,
        startSeason: stops[stops.length - 1].startSeason,
        lastTeam: team.name,
        careerStops: stops,
        draftedPlayers: isFirstGig ? [] : (existing.draftedPlayers || []),
    };
    if (isFirstGig) {
        updatedHeadCoach.age = 29;
        updatedHeadCoach.seasons = 0;
        updatedHeadCoach.careerWins = 0;
        updatedHeadCoach.careerLosses = 0;
        updatedHeadCoach.seasonWins = 0;
        updatedHeadCoach.seasonLosses = 0;
        updatedHeadCoach.history = [];
    } else {
        updatedHeadCoach.careerWins = coach.history.reduce((sum, h) => sum + h.wins, 0);
        updatedHeadCoach.careerLosses = coach.history.reduce((sum, h) => sum + h.losses, 0);
        updatedHeadCoach.seasonWins = 0;
        updatedHeadCoach.seasonLosses = 0;
        updatedHeadCoach.seasons = coach.history.length;
    }
    return ensureTeamEconomyState({ ...team, headCoach: updatedHeadCoach });
};

const getEarliestHistorySeason = (historyMap?: { [key: string]: TeamHistory[] }): number | undefined => {
    if (!historyMap) return undefined;
    let minSeason = Infinity;
    Object.values(historyMap).forEach(entries => {
        entries.forEach(entry => {
            if (entry.season < minSeason) minSeason = entry.season;
        });
    });
    return Number.isFinite(minSeason) ? minSeason : undefined;
};

const evaluateCoachForNextSeason = (
    team: Team,
    nextSeason: number,
    historyMap?: { [key: string]: TeamHistory[] },
    prestigeMap?: Record<string, number>,
    earliestSeason?: number,
): { coach: HeadCoachProfile; retiredCoach?: HeadCoachProfile } => {
    const ensured = ensureTeamHeadCoach(team).headCoach!;
    const newAge = ensured.age + 1;
    const forcedRetire = newAge >= 88;
    const randomRetire = newAge >= 83 && Math.random() < 0.35;
    if (forcedRetire || randomRetire) {
        const updatedStops = ensured.careerStops?.map((stop, idx, arr) =>
            idx === arr.length - 1 ? { ...stop, endSeason: stop.endSeason ?? nextSeason - 1 } : stop
        ) || [];
        const retiredCoach: HeadCoachProfile = {
            ...ensured,
            retired: true,
            retiredSeason: nextSeason,
            retiredReason: forcedRetire ? 'Age' : 'Health',
            lastTeam: team.name,
            careerStops: updatedStops,
        };
        const replacement = createHeadCoachProfile(team.name, team.prestige, nextSeason, {
            historyMap,
            teamPrestigeMap: prestigeMap,
            currentSeason: nextSeason,
            earliestSeason: earliestSeason ?? getEarliestHistorySeason(historyMap),
        });
        return { coach: replacement, retiredCoach };
    }
    return {
        coach: {
            ...ensured,
            age: newAge,
            seasons: ensured.seasons + 1,
            seasonWins: 0,
            seasonLosses: 0,
            lastTeam: team.name,
        },
    };
};

const ensureTeamHeadCoach = (team: Team): Team => {
    if (!team.headCoach) {
        return ensureTeamEconomyState({ ...team, headCoach: createHeadCoachProfile(team.name, team.prestige, 1) });
    }
    const maxWins = team.headCoach.seasons * (31 + 6);
    const maxLosses = team.headCoach.seasons * 32;
    return ensureTeamEconomyState({
        ...team,
        headCoach: {
            ...team.headCoach,
            careerWins: clampNumber(team.headCoach.careerWins ?? 0, 0, maxWins),
            careerLosses: clampNumber(team.headCoach.careerLosses ?? 0, 0, maxLosses),
            seasonWins: team.headCoach.seasonWins ?? 0,
            seasonLosses: team.headCoach.seasonLosses ?? 0,
            lastTeam: team.name,
        },
    });
};

const findNextHomeGameForTeam = (schedule: GameResult[][], gameInSeason: number, teamName: string) => {
    const startIndex = Math.max(0, gameInSeason - 1);
    for (let weekIndex = startIndex; weekIndex < schedule.length; weekIndex += 1) {
        const game = schedule[weekIndex].find(match => match.homeTeam === teamName);
        if (game) {
            return { week: weekIndex + 1, game };
        }
    }
    for (let weekIndex = 0; weekIndex < startIndex; weekIndex += 1) {
        const game = schedule[weekIndex].find(match => match.homeTeam === teamName);
        if (game) {
            return { week: weekIndex + 1, game };
        }
    }
    return null;
};

const clampMinutes = (value: number) => Math.max(0, Math.min(40, value));
const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const normalizeAcademicYearLabel = (year?: string | null) => (year || '').toLowerCase().replace(/\./g, '').trim();
const isSeniorAcademicYear = (year?: string | null) => {
    const normalized = normalizeAcademicYearLabel(year);
    if (!normalized) return false;
    return normalized.startsWith('sr') || normalized.includes('senior') || normalized.startsWith('gr') || normalized.includes('grad');
};
const isJuniorAcademicYear = (year?: string | null) => {
    const normalized = normalizeAcademicYearLabel(year);
    if (!normalized) return false;
    return normalized.startsWith('jr') || normalized.includes('junior');
};
const staminaCap = (player: Player) => clampMinutes(Math.round(20 + Math.max(0, (player.stats.stamina ?? 70) - 50) * 0.3));
const computeRotationWeight = (player: Player) => {
    const staminaFactor = 0.6 + (player.stats.stamina ?? 70) / 200;
    return Math.max(1, Math.pow(player.overall, 1.2) * (player.starterPosition ? 1.2 : 0.95) * staminaFactor);
};

const distributeMinutesForUnlocked = (roster: Player[], targetMinutes: number, preference: RotationPreference): Player[] => {
    const lockedSum = roster.reduce((sum, player) => sum + (player.minutesLocked ? clampMinutes(player.rotationMinutes ?? 0) : 0), 0);
    const unlockedEntries = roster
        .map((player, index) => ({ player, index }))
        .filter(entry => !entry.player.minutesLocked);
    if (!unlockedEntries.length) {
        return roster.map(player => ({
            ...player,
            rotationMinutes: player.minutesLocked ? clampMinutes(player.rotationMinutes ?? 0) : clampMinutes(player.rotationMinutes ?? 0),
        }));
    }

    const targetForUnlocked = Math.max(0, targetMinutes - lockedSum);
    const weights = unlockedEntries.map(entry => {
        const baseWeight = computeRotationWeight(entry.player);
        const preferenceBoost = rotationPreferenceBoosters[preference](entry.player);
        return baseWeight * preferenceBoost;
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0) || unlockedEntries.length;
    let allocations = unlockedEntries.map((entry, idx) => {
        const target = Math.floor((weights[idx] / totalWeight) * targetForUnlocked);
        return clampMinutes(Math.min(staminaCap(entry.player), target));
    });
    let remaining = targetForUnlocked - allocations.reduce((sum, val) => sum + val, 0);

    while (remaining !== 0) {
        const candidates = allocations
            .map((value, idx) => ({ idx, value }))
            .filter(entry => {
                const cap = staminaCap(unlockedEntries[entry.idx].player);
                return remaining > 0 ? entry.value < cap : entry.value > 0;
            });
        if (!candidates.length) break;
        const targetEntry = candidates.sort((a, b) => (remaining > 0 ? b.value - a.value : a.value - b.value))[0];
        allocations[targetEntry.idx] += remaining > 0 ? 1 : -1;
        remaining += remaining > 0 ? -1 : 1;
    }

    const updatedRoster = roster.map((player, index) => {
        if (player.minutesLocked) {
            return { ...player, rotationMinutes: clampMinutes(player.rotationMinutes ?? 0) };
        }
        const unlockedIndex = unlockedEntries.findIndex(entry => entry.index === index);
        if (unlockedIndex === -1) return player;
        const cap = staminaCap(player);
        return { ...player, rotationMinutes: Math.min(cap, clampMinutes(allocations[unlockedIndex])) };
    });

    return updatedRoster;
};

const addRemainingMinutesToUnlocked = (roster: Player[]): { roster: Player[]; remaining: number } => {
    const lockedSum = roster.reduce((sum, player) => sum + (player.minutesLocked ? clampMinutes(player.rotationMinutes ?? 0) : 0), 0);
    const targetForUnlocked = Math.max(0, MAX_TEAM_MINUTES - lockedSum);
    const updatedRoster = roster.map(player => ({ ...player, rotationMinutes: clampMinutes(player.rotationMinutes ?? 0) }));
    const unlockedIndexes = updatedRoster
        .map((player, index) => ({ player, index }))
        .filter(entry => !entry.player.minutesLocked)
        .map(entry => entry.index);

    if (!unlockedIndexes.length) {
        return { roster: updatedRoster, remaining: targetForUnlocked };
    }

    let currentSum = unlockedIndexes.reduce((sum, idx) => sum + (updatedRoster[idx].rotationMinutes ?? 0), 0);
    let remaining = targetForUnlocked - currentSum;

    while (remaining > 0) {
        const candidates = unlockedIndexes
            .map(idx => ({ idx, minutes: updatedRoster[idx].rotationMinutes ?? 0, cap: staminaCap(updatedRoster[idx]) }))
            .filter(entry => entry.minutes < entry.cap);
        if (!candidates.length) break;
        const targetIdx = candidates.sort((a, b) => {
            const aScore = (updatedRoster[a.idx].starterPosition ? 2 : 1) * (updatedRoster[a.idx].overall || 0);
            const bScore = (updatedRoster[b.idx].starterPosition ? 2 : 1) * (updatedRoster[b.idx].overall || 0);
            return bScore - aScore;
        })[0].idx;
        updatedRoster[targetIdx] = {
            ...updatedRoster[targetIdx],
            rotationMinutes: Math.min(staminaCap(updatedRoster[targetIdx]), clampMinutes((updatedRoster[targetIdx].rotationMinutes ?? 0) + 1)),
        };
        remaining--;
    }

    return { roster: updatedRoster, remaining };
};

export const initialState: GameState = {
    version: CURRENT_SAVE_VERSION,
    status: GameStatus.TEAM_SELECTION,
    previousStatus: null,
    userTeam: null,
  allTeams: [],
  recruits: [],
  season: 1,
  seasonYear: seasonToCalendarYear(1),
  seasonAnchors: buildSeasonAnchors(seasonToCalendarYear(1)),
  currentDate: SEASON_START_DATE,
  gameInSeason: 1, // Will be mapped to date later
  eventQueue: [],
  week: 1,
  selectedGameLog: null,
  schedule: [],
  scheduledGamesById: {},
  teamSchedulesById: {},
  scheduledEventIdsByDate: {},
  contactsMadeThisWeek: 0,
  trainingPointsUsedThisWeek: 0,
  lastSimResults: [],
  lastSimWeekKey: null,
  seasonEndSummary: [],
  signingDaySummary: [],
  draftResults: [],
  signingPeriodDay: 1,
  internationalProspects: [],
  currentNBASimulation: null,
  rosterRolledOver: false,
  offSeasonAdvanced: false,
  mockDraftProjections: {},
  mockDraftProjectionDiffs: {},
  mockDraftBoard: [],
  customDraftPickRules: [],
  nbaDraftPickAssets: buildInitialDraftPickAssets(),
  trainingFocuses: { pg: null, sg_sf: null, pf_c: null },
  trainingSummary: [],
  rotationPreference: 'balanced',
  autoTrainingEnabled: true,
  autoTrainingLog: [],
  tournament: null,
  history: {
    userTeamRecords: [],
    champions: [],
    teamHistory: {},
    nbaDrafts: [],
  },
  retiredCoaches: [],
  gameLogs: [],
  postSeasonResolved: false,
  sponsors: {},
  currentUserTeamAttendance: [],
  sponsorQuestDeck: [],
  eventPlaybookCatalog: [],
  economyTelemetry: {
    attendanceDeltas: [],
    nilSpendEfficiency: [],
    completedQuests: [],
    eventFeed: [],
  },
  toastMessage: null,
  seasonRecapData: null,
  gameOverReason: null,
  coach: {
    name: "Coach",
    age: 29,
    almaMater: "Unknown",
    style: "Balanced",
    startSeason: 1,
    reputation: 50,
    careerEarnings: 0,
    history: [],
    contract: null,
    failedContracts: 0,
    playerAlumni: {},
    currentLeague: 'NCAA',
    currentNBATeam: null,
    xp: 0,
    level: 1,
    skillPoints: 0,
    skills: {},
    careerStops: [],
  },
  jobOffers: null,
  pendingJobOffer: null,
  contractReviewData: null,
  freeAgentStaff: generateFreeAgentStaff(),
  pendingStaffRenewals: [],
  poachingOffers: [],
  nbaJobOffers: null,
  nbaCoachTeam: null,
  nbaHistoryTab: 'drafts',
  historyTab: 'myCareer',
  nbaCoachContract: null,
  nbaSeason: 0,
  nbaRecord: { wins: 0, losses: 0 },
  nilNegotiationCandidates: [],
  nilNegotiationHistory: [],
  nilPhaseComplete: false,
  nbaTeams: [],
  nbaFreeAgents: [],
  nbaSchedule: [],
    nbaTransactions: [],
    previousTeamName: undefined,
    timeline: [],
    selectedNBATeam: null,
};

const ensurePlayerNilState = (player: Player): Player => ensurePlayerNilProfile(player);

const ensureTeamEconomyState = (team: Team): Team => {
    const arena = ensureArenaFacility(team);
    const fanMorale = clampNumber(team.fanMorale ?? team.fanInterest ?? team.prestige, 5, 99);
    const sponsorTier = team.sponsor?.tier || 'Low';
    const normalizedBoardExpectations = team.boardExpectations ? generateBoardExpectations(team) : team.boardExpectations;
    const nilBudget = team.nilBudget ?? calculateTeamNilBudget(team, {
        fanSentiment: fanMorale,
        sponsorTier,
        tournamentBonus: 0,
    });
    const nilBoost = team.nilBoostFromSponsor ?? Math.round(nilBudget * 0.12);
    const nilCollective = team.nilCollective ?? createNilCollectiveProfile(team);
    return initializeEconomy({
        ...team,
        roster: team.roster.map(player => ensurePlayerNilState(player)),
        fanMorale,
        boardExpectations: normalizedBoardExpectations,
        nilBudget,
        nilBudgetUsed: team.nilBudgetUsed ?? 0,
        nilBoostFromSponsor: nilBoost,
        nilCollective,
        budget: team.budget ?? { cash: 0, allocations: { marketing: 0, recruiting: 0, facilities: 0, staffDevelopment: 0 } },
        facilities: {
            ...team.facilities,
            arena,
        },
        sponsorQuests: team.sponsorQuests ?? [],
        eventCalendar: team.eventCalendar ?? [],
        pendingBroadcastOffers: team.pendingBroadcastOffers ?? [],
        broadcastDeal: team.broadcastDeal ?? null,
        finances: team.finances ?? {
            baseRevenue: 0,
            gateRevenue: 0,
            concessionsRevenue: 0,
            merchandiseRevenue: 0,
            parkingRevenue: 0,
            donationRevenue: 0,
            tournamentShare: 0,
            licensingRevenue: 0,
            broadcastRevenue: 0,
            sponsorPayout: 0,
            endowmentSupport: 0,
            totalRevenue: 0,
            operationalExpenses: 0,
            firedStaffSalaries: 0,
            staffPayrollExpenses: 0,
            travelExpenses: 0,
            recruitingExpenses: 0,
            marketingExpenses: 0,
            facilitiesExpenses: 0,
            administrativeExpenses: 0,
            loanPayments: 0,
            nilExpenses: 0,
            ledger: [],
            netIncome: 0,
            cashOnHand: 0,
        },
    });
};

const mergeNBAFreeAgents = (current: NBAFreeAgent[], additions: NBAFreeAgent[]): NBAFreeAgent[] => {
    if (!additions || additions.length === 0) {
        return applyNBAFreeAgentRetirementRules(current);
    }
    const existingIds = new Set(current.map(entry => entry.player.id));
    const deduped = additions.filter(entry => {
        if (existingIds.has(entry.player.id)) {
            return false;
        }
        existingIds.add(entry.player.id);
        return true;
    });
    const merged = deduped.length ? [...current, ...deduped] : current;
    return applyNBAFreeAgentRetirementRules(merged);
};

const dedupeAttendanceRecords = (records: GameAttendanceRecord[]): GameAttendanceRecord[] => {
    const indexByKey = new Map<string, number>();
    const deduped: GameAttendanceRecord[] = [];
    for (const record of records || []) {
        const key =
            record.gameId ||
            `${record.week ?? 'na'}|${record.opponent}|${record.attendance}|${record.capacity ?? 'na'}|${record.revenue}|${record.simulated ? 'sim' : 'real'}`;
        const existingIndex = indexByKey.get(key);
        if (existingIndex == null) {
            indexByKey.set(key, deduped.length);
            deduped.push(record);
        } else {
            deduped[existingIndex] = record;
        }
    }
    return deduped;
};

const calculateUnfinishedBusinessBonus = (teamName: string, tournament: Tournament | null): number => {
    if (!tournament) return 0;
    let bonus = 0;
    if (tournament.finalFour.some(match => match.homeTeam === teamName || match.awayTeam === teamName)) {
        bonus += 3;
    }
    if (tournament.championship && (tournament.championship.homeTeam === teamName || tournament.championship.awayTeam === teamName)) {
        if (tournament.champion !== teamName) {
            bonus += 4;
        } else {
            bonus -= 2;
        }
    }
    return Math.max(0, bonus);
};

const playerCoversPosition = (player: Player, position: RosterPositions): boolean =>
    player.position === position ||
    player.secondaryPosition === position ||
    (player.additionalPositions ? player.additionalPositions.includes(position) : false);

export const getPositionDepthSummary = (roster: Player[]): Record<RosterPositions, number> => {
    const summary: Record<RosterPositions, number> = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 };
    roster.forEach(player => {
        (Object.keys(summary) as RosterPositions[]).forEach(pos => {
            if (playerCoversPosition(player, pos)) {
                summary[pos] += 1;
            }
        });
    });
    return summary;
};

export const staffRoleLabels: Record<StaffGroupKey, Staff['role']> = {
    assistants: 'Assistant Coach',
    trainers: 'Trainer',
    scouts: 'Scout',
};

export const formatPlayerHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
};

const collectExpiredStaffRenewals = (team: Team | null): PendingStaffRenewal[] => {
    if (!team?.staff) return [];
    const pending: PendingStaffRenewal[] = [];
    (Object.keys(team.staff) as StaffGroupKey[]).forEach(roleKey => {
        team.staff[roleKey].forEach(member => {
            const remaining = member.yearsRemaining ?? member.contractLength ?? 0;
            if (remaining <= 0) {
                pending.push({
                    staffId: member.id,
                    role: roleKey,
                    name: member.name,
                    grade: member.grade,
                    currentSalary: member.salary,
                    yearsOffered: Math.max(2, member.contractLength || 2),
                });
            }
        });
    });
    return pending;
};

export const calculateAvailableScholarships = (team: Team): number => {
  const seniors = team.roster.filter(p => p.year === 'Sr').length;
  const activeRoster = team.roster.length;
  return 15 - activeRoster + seniors;
};

// Display-only: during signing period we may show next year's class labels in UI.

export const normalizeStaffContract = (member: Staff): Staff => {
    const contractLength = member.contractLength ?? randomBetween(2, 4);
    const yearsRemaining = member.yearsRemaining ?? contractLength;
    if (member.contractLength === contractLength && member.yearsRemaining === yearsRemaining) {
        return member;
    }
    return { ...member, contractLength, yearsRemaining };
};

export const normalizeTeamStaffContracts = (team: Team): Team => {
    if (!team.staff) return team;
    const normalizeGroup = (group: Staff[]) => group.map(normalizeStaffContract);
    return {
        ...team,
        staff: {
            assistants: normalizeGroup(team.staff.assistants),
            trainers: normalizeGroup(team.staff.trainers),
            scouts: normalizeGroup(team.staff.scouts),
        },
    };
};

export const normalizePlayerSeasonStats = (player: Player): Player => {
    const stats = player.seasonStats || { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 };
    const normalizedStats = {
        gamesPlayed: stats.gamesPlayed ?? 0,
        points: stats.points ?? 0,
        rebounds: stats.rebounds ?? 0,
        assists: stats.assists ?? 0,
        minutes: stats.minutes ?? 0,
    };
    const normalizedPlayerStats = {
        ...player.stats,
        stamina: player.stats?.stamina ?? 70,
    };
    if (
        stats.gamesPlayed === normalizedStats.gamesPlayed &&
        stats.points === normalizedStats.points &&
        stats.rebounds === normalizedStats.rebounds &&
        stats.assists === normalizedStats.assists &&
        stats.minutes === normalizedStats.minutes &&
        player.stats?.stamina !== undefined
    ) {
        return player;
    }
    return { ...player, seasonStats: normalizedStats, stats: normalizedPlayerStats };
};

export const normalizeTeamData = (team: Team): Team => {
    const normalizedTeam = normalizeTeamStaffContracts(team);
    const withRoles = {
        ...normalizedTeam,
        playerFocusId: normalizedTeam.playerFocusId ?? null,
        teamCaptainId: normalizedTeam.teamCaptainId ?? null,
    };
    const rosterWithStats = withRoles.roster.map(player => ensurePlayerNilState(normalizePlayerSeasonStats(player)));
    return ensureTeamEconomyState({
        ...withRoles,
        roster: rosterWithStats,
    });
};

export const ageStaffContractsForTeam = (team: Team): Team => {
    if (!team.staff) return team;
    const ageGroup = (group: Staff[]) => group.map(member => {
        const current = member.yearsRemaining ?? member.contractLength ?? 1;
        const next = Math.max(0, current - 1);
        if (next === current) return member;
        return { ...member, yearsRemaining: next };
    });
    return {
        ...team,
        staff: {
            assistants: ageGroup(team.staff.assistants),
            trainers: ageGroup(team.staff.trainers),
            scouts: ageGroup(team.staff.scouts),
        },
    };
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_NEW_GAME': {
        return { ...initialState };
    }
    case 'SELECT_TEAM': {
      const { allTeams, schedule, eventQueue, seasonYear, seasonAnchors, scheduledGamesById, teamSchedulesById, scheduledEventIdsByDate, recruits, sponsors, initialHistory, internationalProspects, nbaSimulation, nbaTeams, nbaSchedule, nbaFreeAgents, nbaTransactions, eventPlaybookCatalog, sponsorQuestDeck } = initializeGameWorld(action.payload);
      const seededTeams = allTeams.map(ensureTeamHeadCoach);
      const userTeam = seededTeams.find(t => t.isUserTeam) || null;
      const randomFirstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const randomLastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const newCoach: Coach = {
        name: `${randomFirstName} ${randomLastName}`,
        age: 29,
        almaMater: userTeam ? userTeam.name : "Unknown",
        style: "Balanced",
        startSeason: 1,
        reputation: 50,
        careerEarnings: 0,
        history: [],
        contract: null,
        failedContracts: 0,
        playerAlumni: {},
        currentLeague: 'NCAA',
        currentNBATeam: null,
        xp: 0,
        level: 1,
        skillPoints: 0,
        skills: {},
        careerStops: [{ teamName: userTeam ? userTeam.name : "Unknown", startSeason: 1 }],
      };
      const updatedUserTeam = userTeam ? updateTeamWithUserCoach(userTeam, newCoach, 1) : null;
      if (updatedUserTeam) {
        updatedUserTeam.playbookFamiliarity = 50;
        updatedUserTeam.fanMorale = 50;
      }
      const teamsWithUserCoach = updatedUserTeam
        ? seededTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t)
        : seededTeams;
      return {
        ...initialState,
        status: GameStatus.CONTRACT_NEGOTIATION,
        userTeam: updatedUserTeam,
        allTeams: teamsWithUserCoach,
        schedule,
        recruits,
        seasonYear,
        seasonAnchors,
        currentDate: seasonAnchors.seasonStart,
        scheduledGamesById,
        teamSchedulesById,
        scheduledEventIdsByDate,
        version: CURRENT_SAVE_VERSION,
        history: initialHistory,
        internationalProspects,
        currentNBASimulation: nbaSimulation,
        sponsors,
        coach: newCoach,
        nbaTeams: nbaTeams || [],
        nbaFreeAgents: applyNBAFreeAgentRetirementRules(nbaFreeAgents || []),
        nbaSchedule: nbaSchedule || [],
        nbaTransactions: nbaTransactions || [],
        eventPlaybookCatalog,
        sponsorQuestDeck,
        eventQueue,
      };
    }
    case 'SIGN_CONTRACT': {
        if (!state.userTeam || !state.coach) return state;
        const { expectations, salary, duration } = action.payload;
        const newContract: CoachContract = {
            teamName: state.userTeam.name,
            yearsRemaining: duration,
            totalYears: duration,
            startSeason: state.season,
            initialPrestige: state.userTeam.prestige,
            expectations: expectations,
            progress: { wins: 0, tournamentAppearances: 0, netIncome: 0 },
            yearPerformance: [],
            salary,
        };
        const newCoach: Coach = {
            ...state.coach,
            contract: newContract,
        };
        const updatedUserTeam = state.userTeam.boardExpectations
            ? state.userTeam
            : { ...state.userTeam, boardExpectations: generateBoardExpectations(state.userTeam) };
        const updatedAllTeams = state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t);
        
        // If this is the very first contract of the game, go to staff recruitment
        if (state.season === 1 && state.status === GameStatus.CONTRACT_NEGOTIATION) {
            return {
                ...state,
                coach: newCoach,
                userTeam: updatedUserTeam,
                allTeams: updatedAllTeams,
                status: GameStatus.STAFF_RECRUITMENT,
                pendingJobOffer: null,
            };
        }

        // Otherwise, it's a renewal, proceed to next phase (Roster Retention)
        return {
            ...state,
            coach: newCoach,
            userTeam: updatedUserTeam,
            allTeams: updatedAllTeams,
            status: GameStatus.ROSTER_RETENTION,
            pendingJobOffer: null,
            pendingStaffRenewals: collectExpiredStaffRenewals(updatedUserTeam),
        };
    }
    // Duplicate RESOLVE_POACHING_OFFER removed
    case 'HIRE_STAFF': {
        if (!state.userTeam) return state;
        const { assistants, trainers, scouts } = action.payload;
        const userTeamWithStaff = updateStaffPayroll({ ...state.userTeam, staff: { assistants, trainers, scouts } });
        const allTeamsWithStaff = state.allTeams.map(t => t.name === userTeamWithStaff.name ? userTeamWithStaff : t);

        return {
            ...state,
            userTeam: userTeamWithStaff,
            allTeams: allTeamsWithStaff,
            status: GameStatus.DASHBOARD,
        };
    }
    case 'FIRE_STAFF': {
        if (!state.userTeam) return state;
        const { staffId, role } = action.payload;

        const staffToFire = state.userTeam.staff[role].find(s => s.id === staffId);
        if (!staffToFire) return state; // Staff member not found

        const updatedStaff = { ...state.userTeam.staff };
        updatedStaff[role] = updatedStaff[role].filter(s => s.id !== staffId);

        const remainingYears = staffToFire.yearsRemaining ?? staffToFire.contractLength ?? 1;
        const severanceCost = staffToFire.salary * remainingYears;

        const updatedFinances = {
            ...state.userTeam.finances,
            firedStaffSalaries: (state.userTeam.finances.firedStaffSalaries || 0) + severanceCost,
        };

        const newUserTeam = updateStaffPayroll({ ...state.userTeam, staff: updatedStaff, finances: updatedFinances });
        const newAllTeams = state.allTeams.map(t => t.name === newUserTeam.name ? newUserTeam : t);

        return {
            ...state,
            userTeam: newUserTeam,
            allTeams: newAllTeams,
            toastMessage: remainingYears > 0
                ? `Staff member fired. Incurred ${formatCurrency(severanceCost)} in buyout (${remainingYears} year${remainingYears === 1 ? '' : 's'} remaining).`
                : `Staff member released with no buyout owed.`,
        };
    }
    case 'HIRE_FREE_AGENT_STAFF': {
        if (!state.userTeam || !state.freeAgentStaff) return state;
        const { staff, role } = action.payload;

        if (state.userTeam.staff[role].length >= 3) {
            return { ...state, toastMessage: `You already have the maximum number of ${role}.` };
        }

        const contractLength = staff.contractLength ?? randomBetween(2, 4);
        const hiredStaff: Staff = { ...staff, contractLength, yearsRemaining: contractLength };

        const updatedStaff = { ...state.userTeam.staff };
        updatedStaff[role] = [...updatedStaff[role], hiredStaff];

        const newUserTeam = updateStaffPayroll({ ...state.userTeam, staff: updatedStaff });
        const newAllTeams = state.allTeams.map(t => t.name === newUserTeam.name ? newUserTeam : t);

        const updatedFreeAgents = { ...state.freeAgentStaff };
        updatedFreeAgents[role] = updatedFreeAgents[role].filter(s => s.id !== staff.id);

        return {
            ...state,
            userTeam: newUserTeam,
            allTeams: newAllTeams,
            freeAgentStaff: updatedFreeAgents,
            toastMessage: `${hiredStaff.name} hired on a ${hiredStaff.contractLength}-year deal.`,
        };
    }
    case 'RENEW_STAFF_CONTRACT': {
        if (!state.userTeam) return state;
        const { staffId, role, newSalary, years } = action.payload;
        const member = state.userTeam.staff[role].find(s => s.id === staffId);
        if (!member) return state;
        const updatedStaffGroup = state.userTeam.staff[role].map(s =>
            s.id === staffId ? { ...s, salary: newSalary, contractLength: years, yearsRemaining: years } : s
        );
        const updatedStaff = { ...state.userTeam.staff, [role]: updatedStaffGroup };
        const updatedUserTeam = updateStaffPayroll({ ...state.userTeam, staff: updatedStaff });
        const updatedAllTeams = state.allTeams.map(team => team.name === updatedUserTeam.name ? updatedUserTeam : team);
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: updatedAllTeams,
            pendingStaffRenewals: state.pendingStaffRenewals.filter(r => r.staffId !== staffId),
            toastMessage: `${member.name} re-signed for ${years} years at ${formatCurrency(newSalary)}.`,
        };
    }
    case 'DECLINE_STAFF_RENEWAL': {
        if (!state.userTeam) return state;
        const { staffId, role } = action.payload;
        const member = state.userTeam.staff[role].find(s => s.id === staffId);
        if (!member) return state;
        const updatedStaffGroup = state.userTeam.staff[role].filter(s => s.id !== staffId);
        const updatedStaff = { ...state.userTeam.staff, [role]: updatedStaffGroup };
        const updatedUserTeam = updateStaffPayroll({ ...state.userTeam, staff: updatedStaff });
        const updatedAllTeams = state.allTeams.map(team => team.name === updatedUserTeam.name ? updatedUserTeam : team);
        const freeAgents = state.freeAgentStaff
            ? { ...state.freeAgentStaff }
            : generateFreeAgentStaff();
        const refreshedContract = Math.max(1, member.contractLength || 1);
        const refreshedStaffer: Staff = { ...member, contractLength: refreshedContract, yearsRemaining: refreshedContract };
        freeAgents[role] = [...freeAgents[role], refreshedStaffer];
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: updatedAllTeams,
            freeAgentStaff: freeAgents,
            pendingStaffRenewals: state.pendingStaffRenewals.filter(r => r.staffId !== staffId),
            toastMessage: `${member.name} was allowed to walk.`,
        };
    }
    case 'TOGGLE_RECRUIT_TARGET': {
        return {
            ...state,
            recruits: state.recruits.map(r =>
                r.id === action.payload.recruitId ? { ...r, isTargeted: !r.isTargeted } : r
            ),
        };
    }
    case 'TOGGLE_PLAYER_TARGET': {
        if (!state.userTeam) return state;
        return {
            ...state,
            userTeam: {
                ...state.userTeam,
                roster: state.userTeam.roster.map(p =>
                    p.id === action.payload.playerId ? { ...p, isTargeted: !p.isTargeted } : p
                ),
            },
            allTeams: state.allTeams.map(team =>
                team.name === state.userTeam!.name ? 
                { 
                    ...team, 
                    roster: team.roster.map(p => 
                        p.id === action.payload.playerId ? { ...p, isTargeted: !p.isTargeted } : p
                    ), 
                } : team
            ),
        };
    }
    case 'MAKE_NIL_OFFER': {
        if (!state.userTeam) return state;
        const { playerId, amount, years } = action.payload;
        const candidate = state.nilNegotiationCandidates.find(c => c.playerId === playerId);
        if (!candidate || candidate.status !== 'pending') {
            return { ...state, toastMessage: 'This player already made their decision.' };
        }
        const rosterIndex = state.userTeam.roster.findIndex(p => p.id === playerId);
        if (rosterIndex === -1) return state;
        const targetPlayer = state.userTeam.roster[rosterIndex];
        if (isSeniorAcademicYear(targetPlayer.year) || isSeniorAcademicYear(candidate.year)) {
            return {
                ...state,
                toastMessage: 'Seniors have exhausted their eligibility and cannot receive NIL retention offers.',
            };
        }
        const sanitizedAmount = Math.max(0, amount);
        const sanitizedYears = isJuniorAcademicYear(targetPlayer.year)
            ? 1
            : Math.max(1, Math.min(2, years));
        const sponsorOffset = candidate.sponsorSubsidy || 0;
        const netBudgetHit = Math.max(0, sanitizedAmount - sponsorOffset);
        const remainingBudget = Math.max(0, (state.userTeam.nilBudget ?? 0) - (state.userTeam.nilBudgetUsed ?? 0));
        if (netBudgetHit > remainingBudget) {
            return { ...state, toastMessage: 'Not enough NIL budget remaining for that offer.' };
        }
        const decision = evaluateNilOffer(candidate, sanitizedAmount, sanitizedYears, targetPlayer);
        const updatedCandidates = state.nilNegotiationCandidates.map(c =>
            c.playerId === playerId
                ? {
                    ...c,
                    status: (decision.accepted ? 'accepted' : 'declined') as NilNegotiationStatus,
                    acceptedAmount: decision.accepted ? sanitizedAmount : undefined,
                    acceptedYears: decision.accepted ? sanitizedYears : undefined,
                }
                : c
        );
        const updatedHistory = [...state.nilNegotiationHistory, decision.message];
        if (!decision.accepted) {
            return {
                ...state,
                nilNegotiationCandidates: updatedCandidates,
                nilNegotiationHistory: updatedHistory,
                toastMessage: decision.message,
            };
        }
        const updatedPlayer: Player = {
            ...targetPlayer,
            nilContractAmount: sanitizedAmount,
            nilContractYearsRemaining: sanitizedYears,
            nilValue: candidate.expectedNilValue,
        };
        const updatedRoster = state.userTeam.roster.map(p => (p.id === playerId ? updatedPlayer : p));
        const updatedUserTeam: Team = {
            ...state.userTeam,
            roster: updatedRoster,
            nilBudgetUsed: (state.userTeam.nilBudgetUsed ?? 0) + netBudgetHit,
        };
        const updatedAllTeams = state.allTeams.map(team =>
            team.name === updatedUserTeam.name ? updatedUserTeam : team
        );
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: updatedAllTeams,
            nilNegotiationCandidates: updatedCandidates,
            nilNegotiationHistory: updatedHistory,
            toastMessage: decision.message,
        };
    }
    case 'FINALIZE_NIL_NEGOTIATIONS': {
        return {
            ...state,
            nilPhaseComplete: true,
        };
    }
    case 'SEED_NIL_CANDIDATES': {
        if (state.nilNegotiationCandidates.length > 0) {
            return state;
        }
        return {
            ...state,
            nilNegotiationCandidates: action.payload.candidates,
        };
    }
    case 'MANAGE_NIL_COLLECTIVE': {
        if (!state.userTeam?.nilCollective) return state;
        const sponsorMatch = Math.max(0, action.payload.sponsorMatch);
        const alumniContribution = Math.max(0, action.payload.alumniContribution);
        const updatedCollective = {
            ...state.userTeam.nilCollective,
            sponsorMatch,
            alumniContribution,
            updatedWeek: state.gameInSeason,
        };
        const nilBudget = updatedCollective.baseBudget + sponsorMatch + alumniContribution;
        const nilBudgetUsed = Math.min(state.userTeam.nilBudgetUsed ?? 0, nilBudget);
        const updatedUserTeam = {
            ...state.userTeam,
            nilCollective: updatedCollective,
            nilBudget,
            nilBudgetUsed,
        };
        const nilEfficiency = nilBudget ? nilBudgetUsed / nilBudget : 0;
        const telemetry = {
            ...state.economyTelemetry,
            nilSpendEfficiency: [...state.economyTelemetry.nilSpendEfficiency, nilEfficiency].slice(-12),
        };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(team => (team.name === updatedUserTeam.name ? updatedUserTeam : team)),
            economyTelemetry: telemetry,
            toastMessage: 'Collective budget updated.',
        };
    }
    case 'LOAD_STATE': {
        const loadedState = action.payload;
        const loadedSeason = loadedState.season ?? 1;
        const loadedSeasonYear = loadedState.seasonYear ?? seasonToCalendarYear(loadedSeason);
        const loadedAnchors = loadedState.seasonAnchors ?? buildSeasonAnchors(loadedSeasonYear);

        const normalizeISODate = (value: any): string => {
            if (typeof value === 'string') return value;
            if (value && typeof value === 'object' && typeof value.year === 'number' && typeof value.month === 'string' && typeof value.day === 'number') {
                return gameDateToISODateUTC(value);
            }
            return loadedAnchors.seasonStart || SEASON_START_DATE;
        };

        const normalizedTeams = loadedState.allTeams.map(t => {
            ensureFullTeamData(t);
            return t;
        });
        const normalizedUserTeam = loadedState.userTeam ? (() => {
            const t = { ...loadedState.userTeam };
            ensureFullTeamData(t);
            return t;
        })() : null;
        const savedFreeAgents = (loadedState.nbaFreeAgents as NBAFreeAgent[]) ?? [];
        const seededFreeAgents = savedFreeAgents.length > 0 ? savedFreeAgents : generateInitialNBAFreeAgents();
        const normalizedEventQueue = (loadedState.eventQueue || []).map((e: any) => ({ ...e, date: normalizeISODate(e.date) }));

        const rebuiltScheduleMaps = (() => {
            if (loadedState.scheduledGamesById && loadedState.teamSchedulesById && loadedState.scheduledEventIdsByDate) {
                return {
                    scheduledGamesById: loadedState.scheduledGamesById,
                    teamSchedulesById: loadedState.teamSchedulesById,
                    scheduledEventIdsByDate: loadedState.scheduledEventIdsByDate,
                };
            }

            const teamsByName = new Map(normalizedTeams.map(t => [t.name, t]));
            const scheduledGamesById: Record<string, any> = {};
            const scheduledEventIdsByDate: Record<string, string[]> = {};
            const teamSchedulesById: Record<string, any> = Object.fromEntries(
                normalizedTeams.map(t => [t.name, { teamId: t.name, gamesByDate: {} }])
            );

            for (const evt of normalizedEventQueue) {
                if (evt.type !== EventType.GAME) continue;
                const homeTeamId = evt.payload?.homeTeam;
                const awayTeamId = evt.payload?.awayTeam;
                if (!homeTeamId || !awayTeamId) continue;
                const date = normalizeISODate(evt.date);
                const id = evt.payload?.scheduledGameEventId || evt.id;
                const homeConf = teamsByName.get(homeTeamId)?.conference;
                const awayConf = teamsByName.get(awayTeamId)?.conference;
                const conferenceId = homeConf && awayConf && homeConf === awayConf ? homeConf : undefined;

                scheduledGamesById[id] = {
                    id,
                    seasonYear: loadedSeasonYear,
                    date,
                    type: 'REG',
                    homeTeamId,
                    awayTeamId,
                    conferenceId,
                };
                if (!scheduledEventIdsByDate[date]) scheduledEventIdsByDate[date] = [];
                scheduledEventIdsByDate[date].push(id);
                if (teamSchedulesById[homeTeamId]) teamSchedulesById[homeTeamId].gamesByDate[date] = id;
                if (teamSchedulesById[awayTeamId]) teamSchedulesById[awayTeamId].gamesByDate[date] = id;
            }

            return { scheduledGamesById, teamSchedulesById, scheduledEventIdsByDate };
        })();

        const normalizedCoach = (() => {
            if (!loadedState.coach?.contract || !normalizedUserTeam) return loadedState.coach;
            const contract = loadedState.coach.contract;
            const totalYears = contract.totalYears ?? contract.yearsRemaining ?? 1;
            const expectations = contract.expectations?.evaluationMode === 'contract'
                ? {
                    ...contract.expectations,
                    contractLength: contract.expectations.contractLength ?? totalYears,
                }
                : contract.expectations;
            return {
                ...loadedState.coach,
                contract: {
                    ...contract,
                    totalYears,
                    expectations,
                },
            };
        })();

        const normalizedTournament =
            loadedState.status === GameStatus.TOURNAMENT && !loadedState.tournament
                ? createTournament(normalizedTeams)
                : (loadedState.tournament ?? null);
        return {
            ...loadedState,
            season: loadedSeason,
            seasonYear: loadedSeasonYear,
            seasonAnchors: loadedAnchors,
            currentDate: normalizeISODate(loadedState.currentDate),
            autoTrainingEnabled: loadedState.autoTrainingEnabled ?? true,
            autoTrainingLog: loadedState.autoTrainingLog ?? [],
            allTeams: normalizedTeams,
            userTeam: normalizedUserTeam,
            coach: normalizedCoach,
            nbaFreeAgents: applyNBAFreeAgentRetirementRules(seededFreeAgents),
            nbaTransactions: loadedState.nbaTransactions ?? [],
            retiredCoaches: loadedState.retiredCoaches ?? [],
            nilNegotiationCandidates: loadedState.nilNegotiationCandidates ?? [],
            nilNegotiationHistory: loadedState.nilNegotiationHistory ?? [],
            nilPhaseComplete: loadedState.nilPhaseComplete ?? false,
            eventPlaybookCatalog: loadedState.eventPlaybookCatalog ?? buildEventPlaybookCatalog(),
            sponsorQuestDeck: loadedState.sponsorQuestDeck ?? buildSponsorQuestDeck(loadedState.gameInSeason ?? 1, loadedState.userTeam?.alumniRegistry),
            mockDraftBoard: loadedState.mockDraftBoard || [],
            eventQueue: normalizedEventQueue,
            scheduledGamesById: rebuiltScheduleMaps.scheduledGamesById,
            teamSchedulesById: rebuiltScheduleMaps.teamSchedulesById,
            scheduledEventIdsByDate: rebuiltScheduleMaps.scheduledEventIdsByDate,
            economyTelemetry: loadedState.economyTelemetry ?? {
                attendanceDeltas: [],
                nilSpendEfficiency: [],
                completedQuests: [],
                eventFeed: [],
            },
            recruits: loadedState.recruits ? recomputeRecruitBoardRanks(loadedState.recruits) : loadedState.recruits,
            recruitingCadence: 'daily',
            lastSimWeekKey: loadedState.lastSimWeekKey ?? null,
            customDraftPickRules: loadedState.customDraftPickRules ?? [],
            tournament: normalizedTournament,
        };
    }
    case 'CHANGE_VIEW': {
      if (action.payload === GameStatus.TOURNAMENT && state.gameInSeason > 31 && !state.tournament) {
        return {
            ...state,
            status: GameStatus.TOURNAMENT,
            tournament: createTournament(state.allTeams),
            currentDate: state.seasonAnchors?.selectionSunday || state.currentDate || SEASON_START_DATE,
        };
      }
      return { ...state, status: action.payload };
    }
    case 'SET_TOAST': {
        return { ...state, toastMessage: action.payload };
    }
    case 'UPDATE_PRICES': {
        if (!state.userTeam) return state;
        const newUserTeam = { ...state.userTeam, prices: action.payload };
        return {
            ...state,
            userTeam: newUserTeam,
            allTeams: state.allTeams.map(t => t.name === newUserTeam.name ? newUserTeam : t),
            toastMessage: 'Prices Updated!',
        };
    }
    case 'UPDATE_ZONE_PRICING': {
        if (!state.userTeam?.facilities?.arena) return state;
        const nextSeatMix = { ...state.userTeam.facilities.arena.seatMix };
        const ticketPrice = state.userTeam.prices.ticketPrice;
        (Object.keys(action.payload) as SeatSegmentKey[]).forEach(key => {
            if (nextSeatMix[key]) {
                const desiredModifier = action.payload[key] ?? nextSeatMix[key]!.priceModifier ?? 1;
                nextSeatMix[key] = {
                    ...nextSeatMix[key],
                    priceModifier: clampZonePriceModifier(key, desiredModifier, ticketPrice),
                };
            }
        });
        const updatedArena = {
            ...state.userTeam.facilities.arena,
            seatMix: nextSeatMix,
        };
        const newUserTeam = {
            ...state.userTeam,
            facilities: {
                ...state.userTeam.facilities,
                arena: updatedArena,
            },
        };
        return {
            ...state,
            userTeam: newUserTeam,
            allTeams: state.allTeams.map(team => (team.name === newUserTeam.name ? newUserTeam : team)),
            toastMessage: 'Zone pricing saved.',
        };
    }
    case 'RUN_ATTENDANCE_SIM': {
        if (!state.userTeam || !state.userTeam.facilities?.arena) return state;
        const targetGame = findNextHomeGameForTeam(state.schedule, state.gameInSeason, state.userTeam.name);
        if (!targetGame) {
            return { ...state, toastMessage: 'No home games remain on the schedule.' };
        }
        const opponent = state.allTeams.find(team => team.name === targetGame.game.awayTeam);
        if (!opponent) return state;
        const baseSeatMix = state.userTeam.facilities.arena.seatMix;
        const pendingMix: SeatMix = (Object.keys(baseSeatMix) as SeatSegmentKey[]).reduce((acc, key) => {
            const pendingModifier = action.payload?.[key];
            const desiredModifier = pendingModifier ?? baseSeatMix[key].priceModifier ?? 1;
            acc[key] = {
                capacity: baseSeatMix[key].capacity,
                priceModifier: clampZonePriceModifier(key, desiredModifier, state.userTeam!.prices.ticketPrice),
            };
            return acc;
        }, {} as SeatMix);
        const simulatedArena = {
            ...state.userTeam.facilities.arena,
            seatMix: pendingMix,
        };
        const simulatedTeam: Team = {
            ...state.userTeam,
            facilities: {
                ...state.userTeam.facilities,
                arena: simulatedArena,
            },
        };
        const forecast = calculateAttendance(simulatedTeam, opponent, targetGame.week, state.eventPlaybookCatalog || []);
        const forecastId = `forecast-${targetGame.week}`;
        const forecastRecord: GameAttendanceRecord = {
            gameId: forecastId,
            opponent: opponent.name,
            attendance: forecast.attendance,
            capacity: forecast.capacity,
            revenue: forecast.revenue,
            simulated: true,
        };
        const attendanceLog = [
            ...state.userTeam.facilities.arena.attendanceLog.filter(entry => entry.gameId !== forecastId || !entry.simulated),
            forecastRecord,
        ].slice(-12);
        const updatedArena = {
            ...simulatedArena,
            attendanceLog,
        };
        const telemetry = {
            ...state.economyTelemetry,
            attendanceDeltas: [...state.economyTelemetry.attendanceDeltas, forecast.attendance - forecast.capacity].slice(-10),
        };
        const updatedUserTeam = {
            ...simulatedTeam,
            facilities: {
                ...simulatedTeam.facilities,
                arena: updatedArena,
            },
        };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(team => (team.name === updatedUserTeam.name ? updatedUserTeam : team)),
            economyTelemetry: telemetry,
            toastMessage: `Forecast: ${forecast.attendance.toLocaleString()} expected.`,
        };
    }
    case 'MAKE_FINANCIAL_INVESTMENT': {
        if (!state.userTeam) return state;
        const investment = FINANCIAL_INVESTMENTS[action.payload.investmentType];
        if (!investment) return state;
        const currentNet = state.userTeam.finances.totalRevenue - state.userTeam.finances.operationalExpenses;
        if (currentNet < investment.cost) {
            return { ...state, toastMessage: 'Not enough surplus to fund this initiative.' };
        }

        const updatedFinances = {
            ...state.userTeam.finances,
            operationalExpenses: state.userTeam.finances.operationalExpenses + investment.cost,
            recruitingExpenses: investment.affects === 'recruiting' ? state.userTeam.finances.recruitingExpenses + investment.cost : state.userTeam.finances.recruitingExpenses,
            facilitiesExpenses: investment.affects === 'training' ? state.userTeam.finances.facilitiesExpenses + investment.cost : state.userTeam.finances.facilitiesExpenses,
            marketingExpenses: investment.affects === 'marketing' ? state.userTeam.finances.marketingExpenses + investment.cost : state.userTeam.finances.marketingExpenses,
            ledger: [
                ...state.userTeam.finances.ledger,
                {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    week: state.week,
                    season: state.season,
                    description: `Investment: ${investment.label}`,
                    category: 'Expense' as const,
                    amount: -investment.cost,
                    runningBalance: state.userTeam.budget.cash - investment.cost // This assumes cash is deducted. Wait, MAKE_FINANCIAL_INVESTMENT does NOT deduct cash in the reducer!
                    // It updates `operationalExpenses`.
                    // "operationalExpenses: state.userTeam.finances.operationalExpenses + investment.cost"
                    // This means it's added to the annual expenses and paid out weekly?
                    // "const currentNet = state.userTeam.finances.totalRevenue - state.userTeam.finances.operationalExpenses;"
                    // It checks against net income, not cash.
                    // If it's an "Investment", it usually implies cash.
                    // But the reducer logic adds it to expenses buckets.
                    // If I add a ledger entry here, it implies cash out.
                    // I need to be careful.
                    // If `processWeeklyFinances` uses these expense buckets to calculate weekly cash flow, then adding a lump sum here AND increasing the bucket would double count.
                    // Let's check `processWeeklyFinances`.
                    // "weeklyExpenses += allocations.marketing + allocations.recruiting..."
                    // "updatedTeam.finances.marketingExpenses += allocations.marketing;"
                    // It seems `processWeeklyFinances` ADDS to the buckets based on allocations.
                    // `MAKE_FINANCIAL_INVESTMENT` adds to the buckets DIRECTLY.
                    // Does `processWeeklyFinances` read the buckets to determine cash flow?
                    // No, it calculates `weeklyExpenses` from allocations and fixed costs.
                    // It UPDATES the buckets.
                    // So `MAKE_FINANCIAL_INVESTMENT` increasing the bucket might just be for tracking?
                    // Wait, `processWeeklyFinances` line 4612: `updatedTeam.finances.netIncome = updatedTeam.finances.totalRevenue - updatedTeam.finances.operationalExpenses;`
                    // So it affects Net Income.
                    // But does it affect Cash?
                    // `updatedTeam.budget.cash += (weeklyRevenue - weeklyExpenses);`
                    // `weeklyExpenses` comes from `allocations`, `travel`, `loan`, `maintenance`.
                    // It does NOT seem to include the `operationalExpenses` bucket directly.
                    // So `MAKE_FINANCIAL_INVESTMENT` as written in `App.tsx` updates the *record* of expenses but might not actually deduct cash?
                    // That sounds like a bug or a design choice (amortized?).
                    // BUT, `UPGRADE_FACILITY` (line 1330) DOES deduct cash: `cash: currentCash - cost`.
                    // So `UPGRADE_FACILITY` is a cash transaction.
                    // `MAKE_FINANCIAL_INVESTMENT` seems to be a "budget adjustment" or "commitment"?
                    // Actually, looking at `MAKE_FINANCIAL_INVESTMENT`:
                    // It checks `currentNet < investment.cost`.
                    // It updates `operationalExpenses`.
                    // It does NOT update `budget.cash`.
                    // So it's not a cash transaction.
                    // I will ONLY add ledger entries for actions that update `budget.cash`.
                    
                    // RE-EVALUATING TARGETS:
                    // 1. UPGRADE_FACILITY: Deducts cash. YES.
                    // 2. TAKE_LOAN: Adds cash. YES.
                    // 3. PAY_LOAN: Deducts cash. YES.
                    // 4. START_MARKETING_CAMPAIGN: Deducts cash. YES.
                    // 5. CONTRIBUTE_TO_PROJECT: Deducts cash. YES.
                    
                    // I will stick to these 5 for `App.tsx`.
                }
            ]
        };

        const clamp100 = (value: number) => Math.max(0, Math.min(100, value));
        const baseWealth = getProgramWealth(state.userTeam);
        let updatedWealth = { ...baseWealth };
        let fanInterest = state.userTeam.fanInterest;

        switch (action.payload.investmentType) {
            case 'recruitingCampaign':
                updatedWealth = {
                    ...updatedWealth,
                    boosterPool: Math.min(25, updatedWealth.boosterPool + 2),
                    donationLevel: clamp100(updatedWealth.donationLevel + 5),
                    donorMomentum: Math.min(30, updatedWealth.donorMomentum + 3),
                };
                break;
            case 'trainingFacilities':
                updatedWealth = {
                    ...updatedWealth,
                    endowmentScore: clamp100(updatedWealth.endowmentScore + 4),
                    donorMomentum: Math.min(30, updatedWealth.donorMomentum + 2),
                };
                break;
            case 'marketingPush':
                fanInterest = clamp100((fanInterest ?? 50) + 6);
                updatedWealth = {
                    ...updatedWealth,
                    donorMomentum: Math.min(30, updatedWealth.donorMomentum + 2),
                };
                break;
        }

        const updatedTeam = {
            ...state.userTeam,
            finances: updatedFinances,
            wealth: updatedWealth,
            fanInterest,
        };

        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(team => team.name === updatedTeam.name ? updatedTeam : team),
            toastMessage: investment.successMessage,
        };
    }
    case 'UPGRADE_FACILITY': {
        if (!state.userTeam || !state.userTeam.budget) return state;
        const { facilityType, upgradeType, cost } = action.payload;
        const currentCash = state.userTeam.budget.cash;

        if (currentCash < cost) {
            return { ...state, toastMessage: 'Insufficient funds for upgrade.' };
        }

        const facilities = state.userTeam.facilities;
        const facility = facilities[facilityType] || { level: 1, quality: 50, attendanceLog: [], constructionWeeksRemaining: 0 };

        if (facility.constructionWeeksRemaining) {
             return { ...state, toastMessage: 'Facility is already under construction.' };
        }

        const constructionTime = 4 + (facility.level * 2); // Example: Lvl 1->2 takes 6 weeks

        const updatedFacility = {
            ...facility,
            constructionWeeksRemaining: constructionTime,
            pendingLevel: facility.level + 1,
            pendingUpgradeType: upgradeType // Store this to know what to apply when finished
        };

        const updatedUserTeam = {
            ...state.userTeam,
            budget: { ...state.userTeam.budget, cash: currentCash - cost },
            facilities: {
                ...facilities,
                [facilityType]: updatedFacility,
            },
        };

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
            toastMessage: `${facilityType} upgrade started! Ready in ${constructionTime} weeks.`,
        };
    }
    case 'TAKE_LOAN': {
        if (!state.userTeam || !state.userTeam.budget) return state;
        const { amount, termMonths, interestRate } = action.payload;
        
        const newLoan: Loan = {
            id: Math.random().toString(36).substr(2, 9),
            principal: amount,
            interestRate,
            termMonths,
            monthsRemaining: termMonths,
            monthlyPayment: (amount * (1 + interestRate)) / termMonths,
            originalAmount: amount
        };

        const updatedUserTeam = {
            ...state.userTeam,
            budget: { ...state.userTeam.budget, cash: state.userTeam.budget.cash + amount },
            loans: [...(state.userTeam.loans || []), newLoan],
            finances: {
                ...state.userTeam.finances,
                ledger: [
                    ...state.userTeam.finances.ledger,
                    {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        week: state.gameInSeason,
                        season: state.season,
                        description: `Loan Secured`,
                        category: 'Debt' as const,
                        amount: amount,
                        runningBalance: state.userTeam.budget.cash + amount
                    }
                ]
            }
        };

        return {
             ...state,
             userTeam: updatedUserTeam,
             allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
             toastMessage: `Loan of $${amount.toLocaleString()} secured.`,
        };
    }
    case 'PAY_LOAN': {
        if (!state.userTeam || !state.userTeam.budget) return state;
        const { loanId, amount } = action.payload;
        if (state.userTeam.budget.cash < amount) return { ...state, toastMessage: 'Insufficient funds.' };
        
        const updatedLoans = (state.userTeam.loans || []).map(l => {
            if (l.id === loanId) {
                return { ...l, principal: Math.max(0, l.principal - amount) };
            }
            return l;
        }).filter(l => l.principal > 0);

        const updatedUserTeam = {
            ...state.userTeam,
            budget: { ...state.userTeam.budget, cash: state.userTeam.budget.cash - amount },
            loans: updatedLoans,
            finances: {
                ...state.userTeam.finances,
                ledger: [
                    ...state.userTeam.finances.ledger,
                    {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        week: state.gameInSeason,
                        season: state.season,
                        description: `Loan Principal Payment`,
                        category: 'Debt' as const,
                        amount: -amount,
                        runningBalance: state.userTeam.budget.cash - amount
                    }
                ]
            }
        };

        return {
             ...state,
             userTeam: updatedUserTeam,
             allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
             toastMessage: `Loan payment of $${amount.toLocaleString()} made.`,
        };
    }
    case 'START_MARKETING_CAMPAIGN': {
         if (!state.userTeam || !state.userTeam.budget) return state;
         const { type, cost, durationWeeks } = action.payload;
         if (state.userTeam.budget.cash < cost) return { ...state, toastMessage: 'Insufficient funds.' };

         const newCampaign: MarketingCampaign = {
             id: Math.random().toString(36).substr(2, 9),
             type,
             cost,
             durationWeeks,
             weeksRemaining: durationWeeks,
             startWeek: state.week,
             active: true,
             impactMultiplier: 1.1 
         };

         const updatedUserTeam = {
             ...state.userTeam,
             budget: { ...state.userTeam.budget, cash: state.userTeam.budget.cash - cost },
             activeCampaigns: [...(state.userTeam.activeCampaigns || []), newCampaign],
             finances: {
                 ...state.userTeam.finances,
                 ledger: [
                     ...state.userTeam.finances.ledger,
                     {
                         id: crypto.randomUUID(),
                         date: new Date().toISOString(),
                         week: state.week,
                         season: state.season,
                         description: `Marketing Campaign: ${type}`,
                         category: 'Expense' as const,
                         amount: -cost,
                         runningBalance: state.userTeam.budget.cash - cost
                     }
                 ]
             }
         };

         return {
             ...state,
             userTeam: updatedUserTeam,
             allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
             toastMessage: `${type} campaign started!`,
         };
    }
    case 'UPDATE_CONCESSION_ITEM_PRICE': {
        if (!state.userTeam) return state;
        const updatedTeam = updateConcessionPricing(state.userTeam, action.payload.itemId, action.payload.price);
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
        };
    }
    case 'UPDATE_MERCH_ITEM_PRICE': {
        if (!state.userTeam) return state;
        const updatedTeam = updateMerchPricing(state.userTeam, action.payload.itemId, action.payload.price);
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
        };
    }
    case 'UPDATE_TICKET_ZONE_PRICE': {
        if (!state.userTeam) return state;
        const updatedTeam = updateTicketPricing(state.userTeam, action.payload.zoneId, action.payload.price);
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
        };
    }
    case 'SET_MERCH_STRATEGY': {
        if (!state.userTeam) return state;
        const updatedTeam = setMerchInventoryStrategy(state.userTeam, action.payload.strategy);
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
        };
    }
    case 'TOGGLE_DYNAMIC_PRICING': {
        if (!state.userTeam) return state;
        const updatedTeam = toggleDynamicPricing(state.userTeam, action.payload.zoneId, action.payload.rule);
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
        };
    }
    case 'SET_TRAVEL_SETTINGS': {
        if (!state.userTeam) return state;
        const updatedTeam = setTravelSettings(state.userTeam, action.payload.method, action.payload.accommodation);
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
        };
    }
    case 'START_CAPITAL_PROJECT': {
        if (!state.userTeam) return state;
        const updatedTeam = startCapitalProject(state.userTeam, action.payload.project);
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
            toastMessage: `Project "${action.payload.project.name}" started!`,
        };
    }
    case 'CONTRIBUTE_TO_PROJECT': {
        if (!state.userTeam || !state.userTeam.budget) return state;
        const { projectId, amount } = action.payload;
        if (state.userTeam.budget.cash < amount) {
             return { ...state, toastMessage: 'Insufficient funds.' };
        }
        const updatedTeam = contributeToProject(state.userTeam, projectId, amount);
        // Manually add ledger entry since contributeToProject might not have access to the full state context for ledger (or we can do it here)
        // Actually, contributeToProject returns a team. Let's see if we can inject the ledger entry here.
        updatedTeam.finances.ledger = [
            ...updatedTeam.finances.ledger,
            {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                week: state.gameInSeason,
                season: state.season,
                description: `Capital Project Contribution`,
                category: 'Capital' as const,
                amount: -amount,
                runningBalance: updatedTeam.budget.cash // contributeToProject should have updated the cash
            }
        ];
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
            toastMessage: `Allocated $${amount.toLocaleString()} to project.`,
        };
    }
    case 'RENOVATE_FACILITY': {
        if (!state.userTeam || !state.userTeam.budget) return state;
        const { facilityKey, cost } = action.payload;
        
        if (state.userTeam.budget.cash < cost) {
             return { ...state, toastMessage: 'Insufficient funds for renovation.' };
        }

        const updatedTeam = {
            ...state.userTeam,
            budget: { ...state.userTeam.budget },
            finances: { ...state.userTeam.finances, ledger: [...state.userTeam.finances.ledger] },
            facilities: state.userTeam.facilities ? ({ ...state.userTeam.facilities } as any) : undefined,
        };

        const facilities = updatedTeam.facilities as any;
        if (!facilities) {
            return { ...state, toastMessage: 'Facilities not initialized for this team.' };
        }

        const ensureFacility = (key: string) => {
            if (facilities[key]) return;
            switch (key) {
                case 'training':
                    facilities.training = { level: 1, quality: 50, maintenanceCost: 10000, equipmentLevel: 1 };
                    return;
                case 'medical':
                    facilities.medical = { level: 1, quality: 50, maintenanceCost: 10000 };
                    return;
                case 'scouting':
                    facilities.scouting = { level: 1, quality: 50, maintenanceCost: 10000, networkReach: 10 };
                    return;
                case 'coaching':
                    facilities.coaching = { level: 1, quality: 50, maintenanceCost: 10000, technologyLevel: 1 };
                    return;
                case 'academic':
                    facilities.academic = { level: 1, quality: 50, maintenanceCost: 5000, tutorQuality: 1 };
                    return;
                case 'nutrition':
                    facilities.nutrition = { level: 1, quality: 50, maintenanceCost: 8000, diningQuality: 1 };
                    return;
                case 'housing':
                    facilities.housing = { level: 1, quality: 50, maintenanceCost: 15000, luxuryLevel: 1 };
                    return;
                case 'arena':
                    return;
                default:
                    return;
            }
        };

        ensureFacility(facilityKey);
        if (!facilities[facilityKey]) {
            return { ...state, toastMessage: `Unknown facility "${facilityKey}".` };
        }

        facilities[facilityKey] = { ...facilities[facilityKey], quality: 100 };
        updatedTeam.budget.cash -= cost;

        updatedTeam.finances.ledger = [
            ...updatedTeam.finances.ledger,
            {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                week: state.gameInSeason,
                season: state.season,
                description: `Renovation: ${facilityKey}`,
                category: 'Facilities Expenses' as const,
                amount: -cost,
                runningBalance: updatedTeam.budget.cash,
            },
        ];

        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
            toastMessage: `${facilityKey} renovated to 100% quality.`,
        };
    }
    case 'UPDATE_BUDGET_ALLOCATION': {
        if (!state.userTeam || !state.userTeam.budget) return state;
        const { category, amount } = action.payload;
        
        const updatedBudget = {
            ...state.userTeam.budget,
            allocations: {
                ...state.userTeam.budget.allocations,
                [category]: amount
            }
        };

        const updatedUserTeam = {
            ...state.userTeam,
            budget: updatedBudget
        };

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
        };
    }
    case 'SCHEDULE_EVENT': {
        if (!state.userTeam) return state;
        const { week, playbookId, opponent } = action.payload;
        const eventEntry = state.eventPlaybookCatalog.find(e => e.id === playbookId);
        
        if (!eventEntry) return state;

        const updatedTeam = scheduleEvent(state.userTeam, week, eventEntry, opponent);
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
            toastMessage: `${eventEntry.label} scheduled for Week ${week}.`,
        };
    }


    case 'RESOLVE_POACHING_OFFER': {
        const { decision, offer } = action.payload;
        if (decision === 'reject') {
            return { ...state, activePoachingOffer: null };
        }
        
        if (decision === 'next_season') {
             return { 
                ...state, 
                activePoachingOffer: null,
                pendingJobOffer: {
                    id: 'poaching-' + offer.teamName,
                    teamName: offer.teamName,
                    prestige: offer.prestige,
                    conference: state.allTeams.find(t => t.name === offer.teamName)?.conference || 'Unknown',
                    salary: offer.salary,
                    length: offer.length, 
                    expectations: generateBoardExpectations(state.allTeams.find(t => t.name === offer.teamName)!),
                    yearPerformance: []
                },
                toastMessage: `You have accepted the offer from ${offer.teamName} for next season.` 
            };
        }

        // Immediate move logic would go here if supported
        const remainingOffers = state.poachingOffers.filter(o => o.id !== offer.id);
        return { ...state, poachingOffers: remainingOffers };
    }

    case 'SIMULATE_DAY': {
        const { updatedState, messages, shouldSimulateGamesToday } = runDailySimulation(state, true);
        let newState: GameState = { ...state, ...updatedState };
        const toastMessage = messages.length > 0 ? messages.join('\n') : null;

        if (shouldSimulateGamesToday) {
            const simDate = newState.currentDate || SEASON_START_DATE;
            const coachSkills = Object.keys(newState.coach?.skills || {});
            const { updatedAllTeams, updatedSchedule, gameLogs, newUserTeamAttendance, updatedCoach, processedEventIds, simulatedWeeks, updatedRecruits, recruitingEvents } = runSimulationForDate(
                newState,
                simDate,
                newState.allTeams,
                newState.schedule,
                coachSkills,
                newState.eventPlaybookCatalog
            );

            const processedEventQueue = (newState.eventQueue || []).map(e =>
                processedEventIds.includes(e.id) ? { ...e, processed: true } : e
            );

            const weeksToFinalize = (simulatedWeeks || []).filter(weekNum => {
                const weekGames = (updatedSchedule || [])[weekNum - 1] || [];
                return weekGames.length > 0 && weekGames.every(g => g.played);
            });

            let finalizedTeams = updatedAllTeams;
            if (weeksToFinalize.length > 0) {
                const season = newState.season;
                const scheduleAfter = updatedSchedule || [];

                weeksToFinalize.forEach(weekNum => {
                    finalizedTeams = finalizedTeams.map(team => {
                        let t = processWeeklyFinances(team, season, weekNum, scheduleAfter[weekNum - 1] || []);
                        t = degradeFacilities(t);
                        t = processFacilityConstruction(t);
                        return t;
                    });
                });

                finalizedTeams = processInSeasonDevelopment(finalizedTeams, coachSkills);
            }

            const nextDate = addDaysISO(simDate, 1);
            const nextWeek = (() => {
                const schedule = updatedSchedule || [];
                for (let i = 0; i < schedule.length; i += 1) {
                    const weekGames = schedule[i] || [];
                    if (weekGames.some(g => !g.played)) return i + 1;
                }
                return schedule.length + 1;
            })();

            newState = {
                ...newState,
                allTeams: finalizedTeams,
                userTeam: finalizedTeams.find(t => t.isUserTeam) || newState.userTeam,
                schedule: updatedSchedule,
                eventQueue: processedEventQueue,
                currentDate: nextDate,
                week: nextWeek,
                gameInSeason: nextWeek,
                contactsMadeThisWeek: 0,
                trainingPointsUsedThisWeek: 0,
                gameLogs: [...newState.gameLogs, ...gameLogs],
                currentUserTeamAttendance: dedupeAttendanceRecords([...newState.currentUserTeamAttendance, ...newUserTeamAttendance]),
                coach: updatedCoach,
                recruits: updatedRecruits,
                timeline: [...(newState.timeline || []), ...recruitingEvents],
            };
        }

        if (newState.gameInSeason > 31 && newState.status !== GameStatus.TOURNAMENT && !newState.tournament) {
            newState = {
                ...newState,
                status: GameStatus.TOURNAMENT,
                tournament: createTournament(newState.allTeams),
                currentDate: newState.seasonAnchors?.selectionSunday || newState.currentDate || SEASON_START_DATE,
            };
        }

        return { ...newState, toastMessage: toastMessage ?? newState.toastMessage };
    }

    case 'SIMULATE_WEEK': {
      // Legacy (deprecated): weekly sim is no longer used. Daily progression simulates only today's games.
      // Keep this guard to prevent old saves/UI from breaking if they dispatch the action.
      return state;
      /* if (!state.userTeam || state.gameInSeason > 31) return state;
      const currentSimKey = `${state.season}-${state.gameInSeason}`;
      if (state.lastSimWeekKey === currentSimKey) {
          return state;
      }

      const recruitsWithUserOfferBefore = new Set(
        state.recruits.filter(r => r.userHasOffered).map(r => r.id)
      );

      // Check if user plays this week
      const week = state.gameInSeason;


      const gameDayMatchups = (state.schedule || [])[week - 1] || [];
      const userPlays = gameDayMatchups.some(g => g.homeTeam === state.userTeam?.name || g.awayTeam === state.userTeam?.name);

      const { updatedAllTeams: teamsFromSim, updatedSchedule, gameLogs, newUserTeamAttendance, updatedCoach, updatedNBATeams, updatedNBASchedule, updatedNBAFreeAgents, updatedRecruits: recruitsFromSimulation, mockDraftProjections, mockDraftProjectionDiffs, nbaTransactions, customDraftPickRules, nbaDraftPickAssets } = runSimulationForWeek(
          state, 
          state.gameInSeason, 
          state.allTeams, 
          state.recruits, 
          state.nbaTeams, 
          state.nbaSchedule,
          state.nbaFreeAgents,
          Object.keys(state.coach?.skills || {}),
          state.eventPlaybookCatalog
      );

      // Process Finances and Facilities for the week
      const updatedAllTeams = teamsFromSim.map(team => {
          let t = processWeeklyFinances(team, state.season, week, updatedSchedule[week - 1] || []);
          t = degradeFacilities(t);
          t = processFacilityConstruction(t);
          return t;
      });
      
      let updatedRecruits = recruitsFromSimulation;





      let toastMessage: string | null = null;
      recruitsWithUserOfferBefore.forEach(recruitId => {
          const newRecruitState = updatedRecruits.find(r => r.id === recruitId);
          if (newRecruitState && !newRecruitState.userHasOffered && newRecruitState.verbalCommitment && newRecruitState.verbalCommitment !== state.userTeam?.name) {
              toastMessage = `${newRecruitState.name} committed to ${newRecruitState.verbalCommitment}. Your offer was rescinded.`;
          }
      });

      // --- Process Official Visits for the week ---
      const userTeamGameForWeek = updatedSchedule[state.gameInSeason - 1]?.find(
          g => g.homeTeam === state.userTeam?.name || g.awayTeam === state.userTeam?.name
      );
      let userTeamWonThisWeek: boolean | null = null;
      if (userTeamGameForWeek && userTeamGameForWeek.played && state.userTeam) {
          const userTeamWon = (userTeamGameForWeek.homeTeam === state.userTeam.name && userTeamGameForWeek.homeScore > userTeamGameForWeek.awayScore) ||
                              (userTeamGameForWeek.awayTeam === state.userTeam.name && userTeamGameForWeek.awayScore > userTeamGameForWeek.homeScore);
          userTeamWonThisWeek = userTeamWon;
          const opponentName = userTeamGameForWeek.homeTeam === state.userTeam.name ? userTeamGameForWeek.awayTeam : userTeamGameForWeek.homeTeam;
          const opponentTeam = state.allTeams.find(t => t.name === opponentName);
          const isRivalryGame = (state.userTeam.conference === opponentTeam?.conference); // Simplified rivalry check
          
          updatedRecruits = updatedRecruits.map(r => {
              if (r.visitStatus === 'Scheduled' && r.visitWeek === state.gameInSeason) {
                  let interestChange = 0;
                  let visitToast = `${r.name}'s official visit concluded. `;

                  if (userTeamWon) {
                      interestChange = isRivalryGame ? randomBetween(30, 45) : randomBetween(20, 35);
                      visitToast += `They were impressed by the win against ${opponentName}${isRivalryGame ? ' (a conference rival)' : ''}! Interest increased.`;
                  } else {
                      interestChange = isRivalryGame ? randomBetween(-20, -10) : randomBetween(-10, 0); // Losing rivalry tanks interest
                      visitToast += `They were disappointed by the loss against ${opponentName}${isRivalryGame ? ' (a conference rival)' : ''}. Interest ${interestChange < 0 ? 'decreased' : 'held steady'}.`;
                  }
                  toastMessage = (toastMessage ? toastMessage + '\n' : '') + visitToast;
                  return {
                      ...r,
                      interest: normalizeInterest(r.interest + interestChange),
                      visitStatus: 'Completed',
                  };
              }
              return r;
          });
      }

      // Check for Poaching Offers
      let currentPoachingOffers = (state.poachingOffers || []).filter(o => !!o);
      if (state.userTeam && state.coach && state.gameInSeason > 15 && state.gameInSeason < 25) {
          const newOffers = generatePoachingOffers(state.userTeam, state.coach, state.allTeams, state.week);
          if (newOffers.length > 0) {
              const uniqueNewOffers = newOffers.filter(newOffer => !currentPoachingOffers.some(existing => existing.teamName === newOffer.teamName));
              if (uniqueNewOffers.length > 0) {
                  currentPoachingOffers = [...currentPoachingOffers, ...uniqueNewOffers];
                  toastMessage = (toastMessage ? toastMessage + '\n' : '') + `You have received ${uniqueNewOffers.length} new job offer(s)! Check Job Security.`;
              }
          }
      }
      // Handle expiring offers
      const expiredOffers = currentPoachingOffers.filter(o => o.expiresWeek <= state.week);
      if (expiredOffers.length > 0) {
          currentPoachingOffers = currentPoachingOffers.filter(o => o.expiresWeek > state.week);
          toastMessage = (toastMessage ? toastMessage + '\n' : '') + `${expiredOffers.length} job offer(s) expired.`;
      }

      let nextStatus = state.status;
      let tournament = state.tournament;
      let nextGame = state.gameInSeason + 1;
      
      if (nextGame > 31) {
        nextStatus = GameStatus.TOURNAMENT;
        tournament = createTournament(updatedAllTeams);
      }

      let newUserTeam = updatedAllTeams.find((t:Team) => t.isUserTeam) || null;

      if (newUserTeam && state.userTeam) {
          const userTeamName = state.userTeam.name;
          updatedRecruits = updatedRecruits.map(r => {
              if (r.verbalCommitment && r.verbalCommitment !== userTeamName) return r;
              if (r.declinedOffers?.includes(userTeamName)) return r;

              const weeksSinceTouch = r.lastUserContactWeek != null ? Math.max(0, state.week - r.lastUserContactWeek) : 99;
              let decay = 0;
              if (weeksSinceTouch >= 2) {
                  decay = r.userHasOffered ? 1 : 2;
                  if (weeksSinceTouch >= 5) decay += 1;
              }

              let idleBoost = 0;
              if (userTeamWonThisWeek) idleBoost += randomBetween(0, 1);
              if (newUserTeam.prestige >= 85 && Math.random() < 0.25) idleBoost += 1;
              if (newUserTeam.record?.wins >= 22 && Math.random() < 0.2) idleBoost += 1;

              if (decay === 0 && idleBoost === 0) return r;
              const nextInterest = clamp(Math.round(r.interest - decay + idleBoost), 0, 100);
              return nextInterest === r.interest ? r : { ...r, interest: nextInterest };
          });
      }
      const newFreeAgentStaff = generateFreeAgentStaff();
      const autoTrainingEvents: string[] = [];

      if (state.autoTrainingEnabled && newUserTeam) {
          // Auto-spend points if none are spent and no players are targeted
          if (state.trainingPointsUsedThisWeek === 0 && !newUserTeam.roster.some(p => p.isTargeted)) {
              let autoSpendPoints = getTrainingPoints(state.userTeam);
              const trainingCost = 3;
              let rosterForAutoTrain = [...newUserTeam.roster];

              while(autoSpendPoints >= trainingCost) {
                  const trainablePlayers = rosterForAutoTrain.filter(p => p.overall < p.potential);
                  if (trainablePlayers.length === 0) break;

                  const randomPlayer = trainablePlayers[Math.floor(Math.random() * trainablePlayers.length)];
                  const randomStat = AUTO_TRAINING_STAT_KEYS[Math.floor(Math.random() * AUTO_TRAINING_STAT_KEYS.length)];

                  if (randomPlayer.stats[randomStat] < 99) {
                      randomPlayer.stats[randomStat]++;
                      randomPlayer.overall = calculateOverall(randomPlayer.stats);
                      autoSpendPoints -= trainingCost;
                      autoTrainingEvents.push(`${randomPlayer.name} +1 ${TRAINING_STAT_LABELS[randomStat]} (Idle boost)`);
                  } else {
                      break;
                  }
              }
              newUserTeam.roster = rosterForAutoTrain;
          }

          // Auto-training for targeted players
          let currentTrainingPoints = getTrainingPoints(state.userTeam) - state.trainingPointsUsedThisWeek;
          const trainingCost = 3;
          let updatedUserTeamRoster = [...newUserTeam.roster];

          while (currentTrainingPoints >= trainingCost) {
              let trainedThisIteration = false;
              const trainablePlayers = updatedUserTeamRoster
                  .filter(p => p.isTargeted && p.overall < 99)
                  .sort((a, b) => a.overall - b.overall);

              if (trainablePlayers.length === 0) break;

              for (const player of trainablePlayers) {
                  if (currentTrainingPoints < trainingCost) break;

                  const playerStats = { ...player.stats };
                  const orderedStatKeys = [...AUTO_TRAINING_STAT_KEYS].sort((a, b) => playerStats[a] - playerStats[b]);

                  let statImproved = false;
                  for (const stat of orderedStatKeys) {
                      if (playerStats[stat] < 99) {
                          playerStats[stat] = playerStats[stat] + 1;
                          currentTrainingPoints -= trainingCost;
                          player.stats = playerStats;
                          player.overall = calculateOverall(playerStats);
                          autoTrainingEvents.push(`${player.name} +1 ${TRAINING_STAT_LABELS[stat]} (Targeted)`);
                          trainedThisIteration = true;
                          statImproved = true;
                          break;
                      }
                  }

                  if (!statImproved) {
                      player.isTargeted = false;
                  }

                  if (player.overall >= 99) {
                      player.isTargeted = false;
                  }
              }
              if (!trainedThisIteration) break;
          }
          newUserTeam.roster = updatedUserTeamRoster;
      }

      let telemetryAfterWeek = state.economyTelemetry;
      if (newUserTeam && state.userTeam) {
          const attendanceLog = [
              ...(newUserTeam.facilities?.arena?.attendanceLog || []).filter(entry => !entry.simulated),
              ...newUserTeamAttendance.map(entry => ({ ...entry, simulated: false })),
          ].slice(-12);
          newUserTeam = newUserTeam.facilities?.arena
              ? {
                    ...newUserTeam,
                    facilities: {
                        ...newUserTeam.facilities,
                        arena: {
                            ...newUserTeam.facilities.arena,
                            attendanceLog,
                        },
                    },
                }
              : newUserTeam;

          const attendanceDeltas = newUserTeamAttendance
              .filter(entry => typeof entry.capacity === 'number')
              .map(entry => entry.attendance - (entry.capacity ?? 0));
          let telemetryWithAttendance = state.economyTelemetry;
          if (attendanceDeltas.length > 0) {
              telemetryWithAttendance = {
                  ...telemetryWithAttendance,
                  attendanceDeltas: [...telemetryWithAttendance.attendanceDeltas, ...attendanceDeltas].slice(-10),
              };
          }

          const attendanceHits = newUserTeamAttendance.filter(entry => entry.capacity && entry.attendance >= entry.capacity * 0.95).length;
          const winDelta = Math.max(0, newUserTeam.record.wins - state.userTeam.record.wins);
          const previousQuests = state.userTeam.sponsorQuests || [];
          const updatedQuests = (newUserTeam.sponsorQuests || []).map(quest => {
              if (quest.status !== 'active') {
                  return quest;
              }
              let progress = quest.progress;
              if (quest.type === 'attendance' && attendanceHits > 0) {
                  progress = Math.min(quest.target, progress + attendanceHits);
              } else if (quest.type === 'wins' && winDelta > 0) {
                  progress = Math.min(quest.target, progress + winDelta);
              } else if (quest.type === 'nil') {
                  progress = Math.min(quest.target, newUserTeam.nilBudgetUsed ?? 0);
              } else if (quest.type === 'media' && newUserTeam.broadcastDeal) {
                  progress = quest.target;
              }
              const status: SponsorQuestStatus = progress >= quest.target ? 'completed' : 'active';
              return { ...quest, progress, status };
          });
          const eventFeedEntries: EconomyEventFeedItem[] = [];
          let completedQuestNames = state.economyTelemetry.completedQuests;
          const newlyCompleted = updatedQuests.filter(
              quest => quest.status === 'completed' && (previousQuests.find(prev => prev.id === quest.id)?.status !== 'completed'),
          );
          if (newlyCompleted.length > 0) {
              completedQuestNames = [...completedQuestNames, ...newlyCompleted.map(q => q.title)].slice(-10);
              eventFeedEntries.push(
                  ...newlyCompleted.map(q => ({
                      id: `quest-${q.id}-${state.gameInSeason}`,
                      type: 'quest' as const,
                      message: `Completed ${q.title}.`,
                      timestamp: Date.now(),
                  })),
              );
          }

          const resolvedEvents = (state.userTeam.eventCalendar || []).map(event => {
              if (event.status !== 'pending' || event.week !== state.gameInSeason) {
                  return event;
              }
              const playbook = state.eventPlaybookCatalog.find(entry => entry.id === event.playbookId);
              if (playbook) {
                  if (playbook.effect === 'attendance' || playbook.effect === 'sentiment') {
                      const boost = Math.round(playbook.modifier * 100);
                      newUserTeam = { ...newUserTeam!, fanMorale: clampNumber((newUserTeam!.fanMorale ?? newUserTeam!.fanInterest) + boost, 5, 99) };
                  } else if (playbook.effect === 'nil') {
                      const bonus = Math.round((newUserTeam!.nilBudget ?? 0) * playbook.modifier);
                      const nilCollective = newUserTeam!.nilCollective
                          ? { ...newUserTeam!.nilCollective, alumniContribution: newUserTeam!.nilCollective.alumniContribution + bonus }
                          : undefined;
                      newUserTeam = {
                          ...newUserTeam!,
                          nilCollective,
                          nilBudget: (newUserTeam!.nilBudget ?? 0) + bonus,
                      };
                  }
                  eventFeedEntries.push({
                      id: `event-${event.id}`,
                      type: 'event',
                      message: `${playbook.label} executed Week ${event.week}.`,
                      timestamp: Date.now(),
                  });
              }
              return { ...event, status: 'resolved' as const };
          });

          newUserTeam = {
              ...newUserTeam,
              sponsorQuests: updatedQuests,
              eventCalendar: resolvedEvents,
          };

          if (eventFeedEntries.length > 0 || completedQuestNames !== telemetryWithAttendance.completedQuests) {
              telemetryAfterWeek = {
                  ...telemetryWithAttendance,
                  completedQuests: completedQuestNames,
                  eventFeed: [...telemetryWithAttendance.eventFeed, ...eventFeedEntries].slice(-18),
              };
          } else {
              telemetryAfterWeek = telemetryWithAttendance;
          }
      } else {
          telemetryAfterWeek = state.economyTelemetry;
      }

      const teamsWithUserUpdates = newUserTeam
          ? updatedAllTeams.map(team => (team.isUserTeam ? newUserTeam! : team))
          : updatedAllTeams;

      const updatedAutoTrainingLog = autoTrainingEvents.length
          ? [...autoTrainingEvents.map(entry => `G${state.gameInSeason}: ${entry}`), ...state.autoTrainingLog].slice(0, AUTO_TRAINING_LOG_LIMIT)
          : state.autoTrainingLog;

      const newPoachingOffer = generatePoachingOffers(newUserTeam!, updatedCoach || state.coach!, updatedAllTeams, nextGame)[0];
      const resolvedNBATeams = updatedNBATeams || state.nbaTeams;
      const resolvedSelectedNBATeam = syncSelectedNBATeamWithRoster(state.selectedNBATeam, resolvedNBATeams);

      const eventsForWeek = (state.eventQueue || []).filter(
          e => e.type === EventType.GAME && Number(e.payload?.week) === week
      );
      const gameDateForWeek = eventsForWeek[0]?.date || state.currentDate || SEASON_START_DATE;
      const processedEventQueue = (state.eventQueue || []).map(e =>
          e.type === EventType.GAME && Number(e.payload?.week) === week ? { ...e, processed: true } : e
      );
      let nextDate = addDaysISO(gameDateForWeek, 1);
      if (nextGame > 31) {
          nextDate = state.seasonAnchors?.selectionSunday || nextDate;
      }

      return {
        ...state,
        status: nextStatus,
        allTeams: teamsWithUserUpdates,
        userTeam: newUserTeam,
        schedule: updatedSchedule,
        recruits: updatedRecruits,
        gameInSeason: nextGame,
        week: nextGame,
        currentDate: nextDate,
        eventQueue: processedEventQueue,
        nbaTeams: resolvedNBATeams,
        nbaSchedule: updatedNBASchedule || state.nbaSchedule,
        nbaFreeAgents: applyNBAFreeAgentRetirementRules(updatedNBAFreeAgents || state.nbaFreeAgents),
        mockDraftProjections: mockDraftProjections || state.mockDraftProjections,
        mockDraftProjectionDiffs: mockDraftProjectionDiffs || state.mockDraftProjectionDiffs,
        customDraftPickRules: customDraftPickRules || state.customDraftPickRules,
        nbaDraftPickAssets: nbaDraftPickAssets || state.nbaDraftPickAssets,
        contactsMadeThisWeek: 0,
        trainingPointsUsedThisWeek: 0,
        lastSimResults: updatedSchedule[state.gameInSeason - 1],
        lastSimWeekKey: currentSimKey,
        tournament,
        gameLogs: [...state.gameLogs, ...gameLogs],
        currentUserTeamAttendance: dedupeAttendanceRecords([...state.currentUserTeamAttendance, ...newUserTeamAttendance]),
        toastMessage: toastMessage || state.toastMessage,
        coach: updatedCoach,
        freeAgentStaff: newFreeAgentStaff,
        autoTrainingLog: updatedAutoTrainingLog,
        economyTelemetry: telemetryAfterWeek,
        poachingOffers: newPoachingOffer ? [...(state.poachingOffers || []), newPoachingOffer] : state.poachingOffers,
        nbaTransactions: state.nbaTransactions ? [...state.nbaTransactions, ...(nbaTransactions || [])] : (nbaTransactions || []),
        selectedNBATeam: resolvedSelectedNBATeam,
      };
      */
    }



    case 'VIEW_NBA_TEAM': {
        return {
            ...state,
            previousStatus: state.status,
            status: GameStatus.NBA_TEAM_DETAIL,
            selectedNBATeam: action.payload,
        };
    }
    case 'CLOSE_NBA_TEAM_VIEW': {
        const fallbackStatus =
            state.previousStatus && state.previousStatus !== GameStatus.NBA_TEAM_DETAIL
                ? state.previousStatus
                : GameStatus.HISTORY;
        return {
            ...state,
            status: fallbackStatus,
            previousStatus: null,
            selectedNBATeam: null,
        };
    }
    
    case 'SET_NBA_HISTORY_TAB': {
        return {
            ...state,
            nbaHistoryTab: action.payload
        };
    }

    case 'SET_HISTORY_TAB': {
        return {
            ...state,
            historyTab: action.payload
        };
    }

    case 'RESOLVE_DILEMMA': {
        if (!state.userTeam || !state.userTeam.alumniRegistry || !state.userTeam.alumniRegistry.activeDilemma) return state;
        const { optionIndex } = action.payload;
        const dilemma = state.userTeam.alumniRegistry.activeDilemma;
        const selectedOption = dilemma.options[optionIndex];
        
        if (!selectedOption) return state;

        let updatedUserTeam = { ...state.userTeam };
        let toastMsg = `Dilemma Resolved: ${selectedOption.label}`;

        // Apply consequences
        const cons = selectedOption.consequences;
        
        if (cons.budget) {
            updatedUserTeam.budget.cash += cons.budget;
             updatedUserTeam.finances.ledger = [
                ...updatedUserTeam.finances.ledger,
                {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    week: state.gameInSeason,
                    season: state.season,
                    description: `Dilemma: ${dilemma.title}`,
                    category: cons.budget > 0 ? 'Revenue' : 'Expense',
                    amount: cons.budget,
                    runningBalance: updatedUserTeam.budget.cash
                }
            ];
        }

        if (cons.prestige) {
            updatedUserTeam.prestige = Math.max(0, Math.min(100, updatedUserTeam.prestige + cons.prestige));
        }

        if (cons.donorMomentum) {
            const currentWealth = getProgramWealth(updatedUserTeam);
            updatedUserTeam.wealth = {
                ...currentWealth,
                donorMomentum: Math.max(-100, Math.min(100, (currentWealth.donorMomentum ?? 0) + cons.donorMomentum))
            };
        }

        // Clear dilemma
        updatedUserTeam.alumniRegistry = {
            ...updatedUserTeam.alumniRegistry,
            activeDilemma: undefined
        };

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
            toastMessage: toastMsg
        };
    }


    case 'TRAIN_PLAYER_STAT': {
        if (!state.userTeam) return state;
        const trainingCost = 3;
        if ((getTrainingPoints(state.userTeam) - state.trainingPointsUsedThisWeek) < trainingCost) {
            return { ...state, toastMessage: "Not enough training points." };
        }

        let playerTrained = false;
        const newUserTeamRoster = state.userTeam.roster.map(p => {
            if (p.id === action.payload.playerId) {
                const statToImprove = action.payload.stat;
                if (p.stats[statToImprove] < 99) {
                    playerTrained = true;
                    const newStats = { ...p.stats, [statToImprove]: p.stats[statToImprove] + 1 };
                    return {
                        ...p,
                        stats: newStats,
                        overall: calculateOverall(newStats)
                    };
                }
            }
            return p;
        });

        if (!playerTrained) {
            return { ...state, toastMessage: "Stat is already maxed out." };
        }

        const newUserTeam = { ...state.userTeam, roster: newUserTeamRoster };
        return {
            ...state,
            userTeam: newUserTeam,
            allTeams: state.allTeams.map(t => t.name === newUserTeam.name ? newUserTeam : t),
            trainingPointsUsedThisWeek: state.trainingPointsUsedThisWeek + trainingCost,
        };
    }

   case 'SIMULATE_TOURNAMENT_ROUND': {
        return gameReducer(state, { type: 'ADVANCE_TOURNAMENT_ROUND' });
    }
   case 'ADVANCE_TOURNAMENT_ROUND': {
        if (!state.tournament || state.tournament.champion || !state.userTeam) return state;

        let newCoach = state.coach ? JSON.parse(JSON.stringify(state.coach)) as Coach : null;
        let newTournament: Tournament = JSON.parse(JSON.stringify(state.tournament));
        const teamsByName = new Map(state.allTeams.map(t => [t.name, t]));
        const anchors = state.seasonAnchors;

        const getTournamentStage = (t: Tournament): 'FIRST_FOUR' | 'R64' | 'R32' | 'S16' | 'E8' | 'FF' | 'TITLE' | 'DONE' => {
            if (t.firstFour?.some(m => !m.played)) return 'FIRST_FOUR';
            const regionRounds = Object.values(t.regions || {}) as any;
            const r64 = regionRounds.flatMap((r: any) => (r?.[0] || []) as TournamentMatchup[]);
            if (r64.some(m => !m.played)) return 'R64';
            const r32 = regionRounds.flatMap((r: any) => (r?.[1] || []) as TournamentMatchup[]);
            if (r32.some(m => !m.played)) return 'R32';
            const s16 = regionRounds.flatMap((r: any) => (r?.[2] || []) as TournamentMatchup[]);
            if (s16.some(m => !m.played)) return 'S16';
            const e8 = regionRounds.flatMap((r: any) => (r?.[3] || []) as TournamentMatchup[]);
            if (e8.some(m => !m.played)) return 'E8';
            if (t.finalFour?.some(m => !m.played)) return 'FF';
            if (t.championship && !t.championship.played) return 'TITLE';
            return 'DONE';
        };

        const stageBefore = getTournamentStage(newTournament);
        const stageDateISO = (() => {
            if (!anchors?.ncaa) return state.currentDate || SEASON_START_DATE;
            switch (stageBefore) {
                case 'FIRST_FOUR': return anchors.ncaa.firstFourTue;
                case 'R64': return anchors.ncaa.r64Thu;
                case 'R32': return anchors.ncaa.r32Sat;
                case 'S16': return anchors.ncaa.s16Thu;
                case 'E8': return anchors.ncaa.e8Sat;
                case 'FF': return anchors.ncaa.finalFourSat;
                case 'TITLE': return anchors.ncaa.titleMon;
                default: return anchors.selectionSunday || state.currentDate || SEASON_START_DATE;
            }
        })();

        const simulateMatchups = (matchups: TournamentMatchup[]) => {
            return matchups.map(matchup => {
                if (matchup.played || !matchup.homeTeam || !matchup.awayTeam) return matchup;
                const homeTeam = teamsByName.get(matchup.homeTeam);
                const awayTeam = teamsByName.get(matchup.awayTeam);
                if (!homeTeam || !awayTeam) return matchup;
                const { homeScore, awayScore } = simulateGame(homeTeam, awayTeam, `T-${matchup.homeTeam}-${matchup.awayTeam}`);
                const newMatchup = { ...matchup, homeScore, awayScore, played: true };
                applyHeadCoachResult(homeTeam, homeScore > awayScore);
                applyHeadCoachResult(awayTeam, awayScore > homeScore);

                if (newCoach?.contract) {
                    if (newMatchup.homeTeam === state.userTeam?.name && newMatchup.homeScore > newMatchup.awayScore) {
                        newCoach.contract.progress.wins++;
                    } else if (newMatchup.awayTeam === state.userTeam?.name && newMatchup.awayScore > newMatchup.homeScore) {
                        newCoach.contract.progress.wins++;
                    }
                }
                return newMatchup;
            });
        };

        const getWinners = (matchups: TournamentMatchup[]): { name: string, seed: number }[] => {
            return matchups.map(m => m.homeScore > m.awayScore ? { name: m.homeTeam!, seed: m.homeSeed } : { name: m.awayTeam!, seed: m.awaySeed });
        };
        
        let wasChampionshipSimulated = false;

        if (newTournament.firstFour.some(m => !m.played)) {
            newTournament.firstFour = simulateMatchups(newTournament.firstFour);
            
            // Update Round of 64 with First Four winners
            // Logic: Replaced the "FF Winner X" placeholder with the actual winner.
            newTournament.firstFour.forEach((ffMatch, index) => {
                const winnerName = ffMatch.homeScore > ffMatch.awayScore ? ffMatch.homeTeam : ffMatch.awayTeam;
                const placeholderName = `FF Winner ${index + 1}`; 
                
                Object.values(newTournament.regions).forEach((region: any) => {
                    const round1 = region[0] as TournamentMatchup[];
                    round1.forEach(matchup => {
                        if (matchup.homeTeam === placeholderName) {
                            matchup.homeTeam = winnerName;
                        }
                        if (matchup.awayTeam === placeholderName) {
                            matchup.awayTeam = winnerName;
                        }
                    });
                });
            });
        }
        else {
            let roundWasSimulated = false;
            for (const regionName in newTournament.regions) {
                const region = newTournament.regions[regionName as TournamentRegionName];
                const roundToPlayIndex = region.findIndex(round => round.some(m => !m.played));
                if (roundToPlayIndex !== -1) {
                    const simulatedRound = simulateMatchups(region[roundToPlayIndex]);
                    region[roundToPlayIndex] = simulatedRound;
                    roundWasSimulated = true;
                }
            }
            
            if (roundWasSimulated) {
                const allRegionsDone = Object.values(newTournament.regions).every(r => r[r.length - 1].length === 1 && r[r.length - 1][0].played);
                if (allRegionsDone && newTournament.finalFour.length === 0) {
                    const regionWinners = (Object.values(newTournament.regions) as TournamentMatchup[][][]).map(region => getWinners(region[region.length - 1])[0]);
                    if (regionWinners.length === 4 && regionWinners.every(w => w && w.name)) {
                        newTournament.finalFour = [
                            { id: `ff-1-${Date.now()}`, round: 5, region: 'Final Four' as TournamentRegionName, homeTeam: regionWinners[0].name, awayTeam: regionWinners[1].name, homeSeed: regionWinners[0].seed, awaySeed: regionWinners[1].seed, homeScore: 0, awayScore: 0, played: false },
                            { id: `ff-2-${Date.now()}`, round: 5, region: 'Final Four' as TournamentRegionName, homeTeam: regionWinners[2].name, awayTeam: regionWinners[3].name, homeSeed: regionWinners[2].seed, awaySeed: regionWinners[3].seed, homeScore: 0, awayScore: 0, played: false }
                        ];
                    }
                } else {
                    Object.values(newTournament.regions).forEach(region => {
                        const lastRound = region[region.length - 1];
                        if (lastRound.length > 1 && lastRound.every(m => m.played)) {
                            const winners = getWinners(lastRound);
                            const nextRound: TournamentMatchup[] = [];
                            for (let i = 0; i < winners.length; i += 2) {
                                nextRound.push({ id: `r${lastRound[0].round + 1}-${i/2}-${Date.now()}`, round: lastRound[0].round + 1, region: 'Region' as TournamentRegionName, homeTeam: winners[i].name, awayTeam: winners[i+1].name, homeSeed: winners[i].seed, awaySeed: winners[i+1].seed, homeScore: 0, awayScore: 0, played: false });
                            }
                            region.push(nextRound);
                        }
                    });
                }
            }
            else if (newTournament.finalFour.length > 0 && newTournament.finalFour.some(m => !m.played)) {
                newTournament.finalFour = simulateMatchups(newTournament.finalFour);
                const winners = getWinners(newTournament.finalFour);
                if (winners.length === 2 && winners.every(w => w && w.name)) {
                    newTournament.championship = { id: `champ-${Date.now()}`, round: 6, region: 'Championship' as TournamentRegionName, homeTeam: winners[0].name, awayTeam: winners[1].name, homeSeed: winners[0].seed, awaySeed: winners[1].seed, homeScore: 0, awayScore: 0, played: false };
                }
            }
            else if (newTournament.championship && !newTournament.championship.played) {
                newTournament.championship = simulateMatchups([newTournament.championship])[0];
                const winner = getWinners([newTournament.championship])[0];
                newTournament.champion = winner.name;
                wasChampionshipSimulated = true;
                if (state.userTeam && winner.name === state.userTeam.name && state.coach) {
                    state.coach.xp += 50; // XP for winning the championship
                    if (state.coach.xp >= state.coach.level * 10) {
                        state.coach.level++;
                        state.coach.skillPoints++;
                        state.coach.xp = state.coach.xp - (state.coach.level - 1) * 10;
                    }
                    // Increase fan morale for winning championship
                    state.userTeam.fanMorale = clamp(state.userTeam.fanMorale + 20, 0, 100);
                }
            }
        }
        
        if (wasChampionshipSimulated) {
            const nbaFinalizeResult = state.nbaTeams ? finalizeNBASeason(state.nbaTeams, state.season) : undefined;
            const updatedNBATeams = nbaFinalizeResult?.updatedNBATeams || state.nbaTeams || [];
            const expiredFreeAgents = nbaFinalizeResult?.releasedPlayers || [];
            const nbaSimResult = nbaFinalizeResult?.simulation || state.currentNBASimulation || undefined;
            
            const { updatedTeams, draftResults, nbaSimulation, undraftedFreeAgents } = processDraft(
                state.allTeams, 
                state.season, 
                state.internationalProspects, 
                nbaSimResult, 
                updatedNBATeams, 
                state.customDraftPickRules,
                state.mockDraftBoard
            );
            const { progressionSummary, signingSummary } = generateSigningAndProgressionSummaries(updatedTeams, state.recruits, state.userTeam.name);
            
             const { updatedTeams: teamsWithPrestige, prestigeChanges } = processEndOfSeasonPrestigeUpdates(updatedTeams, newTournament, state.recruits, draftResults);
            
            const sortedTeamsByPerformance = [...teamsWithPrestige].sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10));
            const teamRanks = new Map(sortedTeamsByPerformance.map((team, index) => [team.name, index + 1]));

            let newHistory = { ...state.history };

             const userTeamFromAllTeams = teamsWithPrestige.find(t => t.isUserTeam)!;
             const finalRevenue = calculateTeamRevenue(userTeamFromAllTeams, newTournament);
             const userTeamRank = teamRanks.get(userTeamFromAllTeams.name) || 0;
 
             const tournamentMatchups = [
                 ...newTournament.firstFour,
                 ...Object.values(newTournament.regions).flat(2),
                 ...newTournament.finalFour,
                 ...(newTournament.championship ? [newTournament.championship] : [])
             ];
             const playedTournamentMatchups = tournamentMatchups.filter(m => m.played);
             const tournamentRecordByTeam = new Map<string, { wins: number; losses: number }>();
             const ensureTournamentRecord = (teamName: string) => {
                 if (!tournamentRecordByTeam.has(teamName)) {
                     tournamentRecordByTeam.set(teamName, { wins: 0, losses: 0 });
                 }
                 return tournamentRecordByTeam.get(teamName)!;
             };
 
             playedTournamentMatchups.forEach(match => {
                 const homeRecord = ensureTournamentRecord(match.homeTeam);
                 const awayRecord = ensureTournamentRecord(match.awayTeam);
                 if (match.homeScore > match.awayScore) {
                     homeRecord.wins += 1;
                     awayRecord.losses += 1;
                 } else {
                     awayRecord.wins += 1;
                     homeRecord.losses += 1;
                 }
             });
             
             const teamName = userTeamFromAllTeams.name;
             const inFirstFour = newTournament.firstFour.some(m => m.homeTeam === teamName || m.awayTeam === teamName);
             const inMainBracket = Object.values(newTournament.regions).flat(2).some(m => m.homeTeam === teamName || m.awayTeam === teamName);
             const allPlayedMatchups = playedTournamentMatchups.filter(m => (m.homeTeam === teamName || m.awayTeam === teamName));

             const tournamentRecord = tournamentRecordByTeam.get(teamName);
             const tournamentWins = tournamentRecord?.wins ?? 0;
             const tournamentLosses = tournamentRecord?.losses ?? 0;

            const getUserTeamTournamentResult = () => {
                if (!inFirstFour && !inMainBracket) {
                    return 'Did not qualify';
                }

                if (newTournament.champion === teamName) return 'National Champions!';
                if (tournamentWins === 5) return 'National Runner-Up';
                if (tournamentWins === 4) return 'Final Four';
                if (tournamentWins === 3) return 'Elite 8';
                if (tournamentWins === 2) return 'Sweet 16';
                if (tournamentWins === 1 && inMainBracket) return 'Round of 32';
                if (tournamentWins === 0 && inMainBracket) return 'Round of 64';
                if (tournamentWins === 0 && inFirstFour) return 'First Four';

                return 'Did not qualify';
            };
            const tournamentResult = getUserTeamTournamentResult();
            const madeTournament = tournamentResult !== 'Did not qualify' && tournamentResult !== 'First Four';

            const regularSeasonWins = userTeamFromAllTeams.record.wins;
            const regularSeasonLosses = userTeamFromAllTeams.record.losses;
            const totalWins = regularSeasonWins + tournamentWins;
            const totalLosses = regularSeasonLosses + tournamentLosses;
            const userTeamHistory: UserSeasonRecord = {
                season: state.season,
                teamName: userTeamFromAllTeams.name,
                wins: totalWins,
                losses: totalLosses,
                rank: userTeamRank,
                prestige: userTeamFromAllTeams.prestige,
                totalRevenue: userTeamFromAllTeams.finances?.totalRevenue || 0,
                operationalExpenses: userTeamFromAllTeams.finances?.operationalExpenses || 0,
                projectedRevenue: userTeamFromAllTeams.initialProjectedRevenue?.totalRevenue || 0,
                gameAttendance: state.currentUserTeamAttendance,
                tournamentResult: tournamentResult,
                regularSeasonWins,
                regularSeasonLosses,
                postseasonWins: tournamentWins,
                postseasonLosses: tournamentLosses,
            };
            const championTeam = teamsWithPrestige.find(t => t.name === newTournament.champion);
            const championTournamentRecord = championTeam ? tournamentRecordByTeam.get(championTeam.name) : null;
            const runnerUpName = newTournament.championship
                ? (newTournament.championship.homeTeam === newTournament.champion
                    ? newTournament.championship.awayTeam
                    : newTournament.championship.homeTeam)
                : null;
            const championHistory: ChampionRecord = { 
                season: state.season, 
                teamName: newTournament.champion!, 
                wins: (championTeam?.record.wins || 0) + (championTournamentRecord?.wins || 0), 
                losses: (championTeam?.record.losses || 0) + (championTournamentRecord?.losses || 0),
                runnerUpTeamName: runnerUpName || undefined,
            };
             
             const newTeamHistory = { ...state.history.teamHistory };
             teamsWithPrestige.forEach(team => {
                 const rank = teamRanks.get(team.name) || 0;
                 const revenue = calculateTeamRevenue(team, newTournament).totalRevenue;
                 const postseasonRecord = tournamentRecordByTeam.get(team.name);
                 const postseasonWins = postseasonRecord?.wins ?? 0;
                 const postseasonLosses = postseasonRecord?.losses ?? 0;
                 const teamHistory: TeamHistory = {
                     season: state.season,
                     prestige: team.prestige,
                     rank,
                     totalRevenue: revenue,
                     projectedRevenue: team.initialProjectedRevenue?.totalRevenue || 0,
                     wins: team.record.wins + postseasonWins,
                     losses: team.record.losses + postseasonLosses,
                     regularSeasonWins: team.record.wins,
                     regularSeasonLosses: team.record.losses,
                     postseasonWins: postseasonRecord?.wins,
                     postseasonLosses: postseasonRecord?.losses,
                     postseasonResult: team.name === newTournament.champion ? 'Champions' : undefined,
                 };
                 newTeamHistory[team.name] = [...(newTeamHistory[team.name] || []), teamHistory];
             });

            if (!newCoach.playerAlumni) {
                newCoach.playerAlumni = {};
            }
            userTeamFromAllTeams.roster.forEach(player => {
                newCoach.playerAlumni[player.id] = {
                    name: player.name,
                    lastTeam: userTeamFromAllTeams.name,
                    lastSeason: state.season,
                };
            });

            const draftHistoryEntry = {
                season: state.season,
                picks: draftResults,
                nbaChampion: nbaSimulation.champion,
                draftOrder: nbaSimulation.draftOrder,
            };
            draftResults.forEach(pick => {
                const coachTeam = teamsWithPrestige.find(t => t.name === pick.originalTeam);
                if (coachTeam?.headCoach) {
                    const entry = { season: state.season, player: pick.player.name, nbaTeam: pick.nbaTeam, team: pick.originalTeam, round: pick.round, pick: pick.pick };
                    const prevDrafts = coachTeam.headCoach.draftedPlayers || [];
                    coachTeam.headCoach.draftedPlayers = [entry, ...prevDrafts].slice(0, 30);
                }
                if (coachTeam) {
                    const alumni = generateAlumni(pick.player as Player, coachTeam, state.season, 'drafted');
                    coachTeam.alumniRegistry = updateAlumniRegistry(coachTeam.alumniRegistry, alumni);
                }
            });
            const userTeamCoachProfile = teamsWithPrestige.find(t => t.isUserTeam)?.headCoach;
            if (userTeamCoachProfile && newCoach) {
                newCoach.draftedPlayers = userTeamCoachProfile.draftedPlayers || [];
            }

            const baseHistory = state.history || { userTeamRecords: [], champions: [], teamHistory: {}, nbaDrafts: [] };
            newHistory = {
                userTeamRecords: [...baseHistory.userTeamRecords, userTeamHistory],
                champions: [...baseHistory.champions, championHistory],
                teamHistory: newTeamHistory,
                nbaDrafts: upsertDraftHistoryEntry(baseHistory.nbaDrafts, draftHistoryEntry),
            };

            if (newCoach.contract) {
                if (madeTournament) {
                    newCoach.contract.progress.tournamentAppearances += 1;
                }
            }
            
            const userDraftedPlayers = draftResults.filter(d => d.originalTeam === userTeamFromAllTeams.name);
            const formerDraftedPlayers = draftResults.filter(d => d.originalTeam !== userTeamFromAllTeams.name && !!newCoach.playerAlumni?.[d.player.id]);
            userDraftedPlayers.forEach(d => { if (newCoach.playerAlumni[d.player.id]) delete newCoach.playerAlumni[d.player.id]; });
            formerDraftedPlayers.forEach(d => { if (newCoach.playerAlumni[d.player.id]) delete newCoach.playerAlumni[d.player.id]; });
            const achievements: string[] = [];
            if (tournamentResult !== 'Did not qualify') {
                achievements.push('Tournament Appearance');
                if (tournamentResult !== 'Round of 64' && tournamentResult !== 'First Four') {
                    achievements.push(tournamentResult);
                }
            }
            const draftedCount = userDraftedPlayers.length;
            const draftLabel = draftedCount === 1 ? 'NBA Draft Pick' : 'NBA Draft Picks';
            achievements.push(`${draftedCount} ${draftLabel}`);
            if (formerDraftedPlayers.length > 0) {
                const formerLabel = formerDraftedPlayers.length === 1 ? 'Former NBA Draft Pick' : 'Former NBA Draft Picks';
                achievements.push(`${formerDraftedPlayers.length} ${formerLabel}`);
            }
            const coachRecord: CoachSeasonRecord = {
                season: state.season, teamName: userTeamFromAllTeams.name, wins: totalWins, losses: totalLosses, salary: newCoach.contract!.salary, achievements, totalRevenue: userTeamHistory.totalRevenue, projectedRevenue: userTeamHistory.projectedRevenue, operationalExpenses: finalRevenue.operationalExpenses,
            };
            // Add a check to prevent duplicate entries for the same season
            if (!newCoach.history.some(rec => rec.season === state.season && rec.teamName === userTeamFromAllTeams.name)) {
                newCoach.history.push(coachRecord);
            }
            newCoach.careerEarnings += newCoach.contract!.salary;


            const relevantCoach = state.coach || newCoach;
            const previousReputation = relevantCoach.reputation;
            const predictedReputation = state.coach?.contract
                ? updateCoachReputation({ ...relevantCoach }, userTeamHistory, state.coach.contract!)
                : relevantCoach.reputation;
            const reputationChange = predictedReputation - previousReputation;

            const attendance = (() => {
                const games = userTeamHistory.gameAttendance || [];
                const count = games.length || 0;
                const totalAttendance = games.reduce((sum, g) => sum + (g.attendance || 0), 0);
                const totalCapacity = games.reduce((sum, g) => sum + (g.capacity || 0), 0);
                const totalRevenue = games.reduce((sum, g) => sum + (g.revenue || 0), 0);
                const avgAttendance = count ? Math.round(totalAttendance / count) : 0;
                const avgCapacity = totalCapacity ? Math.round(totalCapacity / count) : undefined;
                const avgFillRate = avgCapacity ? totalAttendance / (avgCapacity * count) : undefined;
                const avgGameRevenue = count ? Math.round(totalRevenue / count) : 0;
                return { games: count, avgAttendance, avgCapacity, avgFillRate, avgGameRevenue };
            })();

            const sponsor = (() => {
                const sponsorName = userTeamFromAllTeams.sponsor?.name;
                if (!sponsorName) return undefined;
                const sponsorTier = (state.sponsors as any)?.[sponsorName]?.tier as SponsorTier | undefined;
                return { name: sponsorName, tier: sponsorTier };
            })();

            const tournamentRunnerUp = (() => {
                const champ = newTournament?.champion;
                const title = newTournament?.championship;
                if (!champ || !title?.played) return null;
                const other = title.homeTeam === champ ? title.awayTeam : title.homeTeam;
                return other || null;
            })();

            const recapData: SeasonRecapData = {
                season: state.season,
                seasonYear: state.seasonYear,
                teamName: userTeamFromAllTeams.name,
                conference: userTeamFromAllTeams.conference,
                nationalRank: userTeamHistory.rank,
                results: {
                    wins: userTeamFromAllTeams.record.wins,
                    losses: userTeamFromAllTeams.record.losses,
                    conferenceRecord: userTeamFromAllTeams.seasonStats 
                        ? `${userTeamFromAllTeams.seasonStats.confWins}-${userTeamFromAllTeams.seasonStats.confLosses}`
                        : '0-0',
                    conferenceFinish: userTeamFromAllTeams.seasonStats?.confFinish || 0,
                    postSeasonResult: tournamentResult,
                    finalRank: userTeamHistory.rank
                },
                financials: {
                    totalRevenue: userTeamHistory.totalRevenue,
                    netIncome: finalRevenue.netIncome,
                    primarySource: Object.entries(finalRevenue)
                        .filter(([k, v]) => typeof v === 'number' && k.endsWith('Revenue') && k !== 'totalRevenue')
                        .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0]?.replace('Revenue', '') || 'None',
                    revenueBreakdown: finalRevenue
                },
                recruiting: {
                    classRank: 0, // Placeholder
                    topRecruit: 'None', // Placeholder for now
                    classSize: state.recruits.filter(r => r.verbalCommitment === userTeamFromAllTeams.name && (r.isSigned || r.recruitmentStage === 'Signed')).length,
                    needsMet: true
                },
                prestigeChange: {
                    previous: userTeamHistory.prestige - (prestigeChanges.get(userTeamFromAllTeams.name) || 0),
                    current: userTeamHistory.prestige,
                    delta: prestigeChanges.get(userTeamFromAllTeams.name) || 0,
                    primaryReason: 'Season Performance'
                },
                rosterChanges: {
                     graduating: [],
                     transferringOut: [],
                     drafted: userDraftedPlayers,
                     returningStarters: 0
                },
                cpi: calculateCoachPerformanceIndex(userTeamFromAllTeams, newHistory, { 
                    wins: userTeamFromAllTeams.record.wins,
                    losses: userTeamFromAllTeams.record.losses,
                    conferenceRecord: userTeamFromAllTeams.seasonStats 
                        ? `${userTeamFromAllTeams.seasonStats.confWins}-${userTeamFromAllTeams.seasonStats.confLosses}`
                        : '0-0',
                    conferenceFinish: userTeamFromAllTeams.seasonStats?.confFinish || 0,
                    postSeasonResult: tournamentResult,
                    finalRank: userTeamHistory.rank
                }),
                // Legacy fields for backward compatibility if helpful
                record: `${userTeamFromAllTeams.record.wins}-${userTeamFromAllTeams.record.losses}`,
                tournamentResult: tournamentResult,
            };

            const expiredEntries: NBAFreeAgent[] = expiredFreeAgents.map(player => ({
                player,
                reason: 'Expired',
                seasonAdded: state.season,
                weekAdded: 30
            }));
            const undraftedEntries: NBAFreeAgent[] = undraftedFreeAgents.map(player => ({
                player,
                reason: 'Undrafted',
                previousTeam: player.originDescription || 'Undrafted',
                seasonAdded: state.season,
                weekAdded: 30
            }));
            const pendingFreeAgentsList = [...expiredEntries, ...undraftedEntries];
            const updatedNBAFreeAgentPool = mergeNBAFreeAgents(state.nbaFreeAgents || [], pendingFreeAgentsList);
            const resolvedSelectedNBATeam = syncSelectedNBATeamWithRoster(state.selectedNBATeam, updatedNBATeams);

            return {
                ...state,
                status: GameStatus.SEASON_RECAP,
                allTeams: teamsWithPrestige,
                userTeam: teamsWithPrestige.find(t => t.isUserTeam) || null,
                tournament: newTournament,
                signingDaySummary: signingSummary,
                seasonEndSummary: progressionSummary,
                draftResults: draftResults,
                history: newHistory,
                internationalProspects: [],
                currentNBASimulation: null,
                nbaTeams: updatedNBATeams,
                nbaFreeAgents: applyNBAFreeAgentRetirementRules(updatedNBAFreeAgentPool),
                coach: newCoach,
                seasonRecapData: recapData,
                selectedNBATeam: resolvedSelectedNBATeam,
                currentDate: anchors?.ncaa?.titleMon || stageDateISO,
            };
        }
        
        return { ...state, tournament: newTournament, coach: newCoach, currentDate: stageDateISO };
    }
    case 'SCOUT_RECRUIT': {
        if (!state.userTeam) return state;
        const { recruitId, cost } = action.payload;
        
        const contactPoints = getContactPoints(state.userTeam);
        if (state.contactsMadeThisWeek + cost > contactPoints) {
            return { ...state, toastMessage: 'Not enough recruiting points!' };
        }

        const financialCost = RECRUITING_COSTS.SCOUT;
        if ((state.userTeam.budget?.cash || 0) < financialCost) {
             return { ...state, toastMessage: 'Insufficient funds for scouting.' };
        }

        const currentLevel = state.userTeam.scoutingReports?.[recruitId] || 0;
        if (currentLevel >= 3) return state;

        const newLevel = currentLevel + 1;
        const updatedScoutingReports = { ...state.userTeam.scoutingReports, [recruitId]: newLevel };
        
        const updatedUserTeam = { 
            ...state.userTeam, 
            scoutingReports: updatedScoutingReports,
            budget: { ...state.userTeam.budget!, cash: state.userTeam.budget!.cash - financialCost },
            finances: {
                ...state.userTeam.finances,
                recruitingExpenses: state.userTeam.finances.recruitingExpenses + financialCost,
                operationalExpenses: state.userTeam.finances.operationalExpenses + financialCost,
                ledger: [
                    ...(state.userTeam.finances.ledger || []),
                    {
                        id: `exp-scout-${Date.now()}-${Math.random()}`,
                        date: `Week ${state.week}`,
                        week: state.week,
                        season: state.season,
                        description: 'Recruiting: Scouting Report',
                        category: 'Expense' as 'Expense',
                        amount: -financialCost,
                        runningBalance: (state.userTeam.budget?.cash || 0) - financialCost
                    }
                ]
            }
        };

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
            contactsMadeThisWeek: state.contactsMadeThisWeek + cost,
            toastMessage: `Scouting level increased to ${newLevel}. (-$${financialCost})`,
        };
    }
    case 'CONTACT_RECRUIT': {
      const contactPoints = getContactPoints(state.userTeam);
      if (!state.userTeam || state.contactsMadeThisWeek >= contactPoints) return state;

      const targetRecruit = state.recruits.find(r => r.id === action.payload.recruitId);
      const isMaintainContact = !!targetRecruit?.userHasOffered;
      const financialCost = isMaintainContact ? Math.max(1, Math.round(RECRUITING_COSTS.CONTACT * 0.5)) : RECRUITING_COSTS.CONTACT;
      if ((state.userTeam.budget?.cash || 0) < financialCost) {
           return { ...state, toastMessage: 'Insufficient funds to contact recruit.' };
      }

      const updatedUserTeam = {
          ...state.userTeam,
          budget: { ...state.userTeam.budget!, cash: state.userTeam.budget!.cash - financialCost },
          finances: {
              ...state.userTeam.finances,
              recruitingExpenses: state.userTeam.finances.recruitingExpenses + financialCost,
              operationalExpenses: state.userTeam.finances.operationalExpenses + financialCost,
              ledger: [
                  ...(state.userTeam.finances.ledger || []),
                  {
                      id: `exp-contact-${Date.now()}-${Math.random()}`,
                      date: `Week ${state.week}`,
                      week: state.week,
                      season: state.season,
                      description: isMaintainContact ? 'Recruiting: Maintain Contact' : 'Recruiting: Contact Recruit',
                      category: 'Expense' as 'Expense',
                      amount: -financialCost,
                      runningBalance: (state.userTeam.budget?.cash || 0) - financialCost
                  }
              ]
          }
      };

      return {
        ...state,
        userTeam: updatedUserTeam,
        allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
	        recruits: state.recruits.map(r => {
	          if (r.id !== action.payload.recruitId) return r;
	          const baseline = calculateRecruitInterestScore(r, state.userTeam!, { gameInSeason: state.gameInSeason });
	          const difference = baseline - r.interest;
	          let boost: number;
	          const urgencyMultiplier = 0.6 + Math.max(0, 100 - r.interest) / 120;
	          const coachabilityMultiplier = 0.85 + clamp((r.coachability ?? 60) / 220, 0, 0.7);
	          const maintainMultiplier = r.userHasOffered ? 0.55 : 1;
	          if (difference > 0) {
	            boost = Math.min(6, Math.max(2, difference * 0.33)) * urgencyMultiplier * coachabilityMultiplier * maintainMultiplier;
	          } else {
	            const aboveBaseline = Math.abs(difference);
	            boost = Math.max(1, 2 - aboveBaseline / 30) * urgencyMultiplier * coachabilityMultiplier * maintainMultiplier;
	          }
	          const newInterest = normalizeInterest(r.interest + boost);
	          const teamName = state.userTeam!.name;
	          const teamMomentum = { ...(r.teamMomentum || {}) };
	          // User contacts have higher impact than CPU contacts (+4 to +6 vs CPU's +2 to +4)
	          const userMomentumBoost = 4 + Math.floor(Math.random() * 3); // 4, 5, or 6
	          teamMomentum[teamName] = clamp((teamMomentum[teamName] ?? 0) + userMomentumBoost, -20, 25);
	          return { ...r, interest: newInterest, teamMomentum, lastUserContactWeek: state.week };
	        }),
	        contactsMadeThisWeek: state.contactsMadeThisWeek + 1,
	      };
	    }
    case 'COACH_VISIT': {
        if (!state.userTeam) return state;
        const visitCost = 5;
        const contactPoints = getContactPoints(state.userTeam);
        if (state.contactsMadeThisWeek + visitCost > contactPoints) {
            return {
                ...state,
                toastMessage: `Not enough contacts for a coach visit (${visitCost} needed).`
            };
        }

        const financialCost = RECRUITING_COSTS.VISIT_HOME;
        if ((state.userTeam.budget?.cash || 0) < financialCost) {
             return { ...state, toastMessage: 'Insufficient funds for home visit.' };
        }

        const updatedUserTeam = {
            ...state.userTeam,
            budget: { ...state.userTeam.budget!, cash: state.userTeam.budget!.cash - financialCost },
            finances: {
                ...state.userTeam.finances,
                recruitingExpenses: state.userTeam.finances.recruitingExpenses + financialCost,
                operationalExpenses: state.userTeam.finances.operationalExpenses + financialCost,
                ledger: [
                    ...(state.userTeam.finances.ledger || []),
                    {
                        id: `exp-visit-home-${Date.now()}-${Math.random()}`,
                        date: `Week ${state.week}`,
                        week: state.week,
                        season: state.season,
                        description: 'Recruiting: Home Visit',
                        category: 'Expense' as 'Expense',
                        amount: -financialCost,
                        runningBalance: (state.userTeam.budget?.cash || 0) - financialCost
                    }
                ]
            }
        };

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
		            recruits: state.recruits.map(r => {
		                if (r.id !== action.payload.recruitId) return r;
		                const prestigeBonus = Math.max(0, Math.floor((state.userTeam?.prestige || 50 - 50) / 12));
		                const coachabilityMultiplier = 0.9 + clamp((r.coachability ?? 60) / 250, 0, 0.6);
		                const boost = (randomBetween(18, 25) + prestigeBonus) * coachabilityMultiplier;
		                const newInterest = normalizeInterest(r.interest + boost);
		                const teamName = state.userTeam!.name;
		                const teamMomentum = { ...(r.teamMomentum || {}) };
		                teamMomentum[teamName] = clamp((teamMomentum[teamName] ?? 0) + 4, -20, 20);
		                const visitHistory = [...(r.visitHistory || [])];
		                visitHistory.push({ teamName, week: state.week, kind: 'Home', outcome: 'Positive' });
		                return { ...r, interest: newInterest, teamMomentum, visitHistory, lastUserContactWeek: state.week };
		            }),
	            contactsMadeThisWeek: state.contactsMadeThisWeek + visitCost,
	            toastMessage: `Home visit complete. (-$${financialCost})`,
	        };
	    }
    case 'SCHEDULE_VISIT': {
        if (!state.userTeam) return state;
        const visitCost = 8; // Same cost as the old immediate official visit
        const contactPoints = getContactPoints(state.userTeam);

        if (state.contactsMadeThisWeek + visitCost > contactPoints) {
            return {
                ...state,
                toastMessage: `Not enough contacts to schedule an official visit (${visitCost} needed).`
            };
        }

        const financialCost = RECRUITING_COSTS.VISIT_CAMPUS;
        if ((state.userTeam.budget?.cash || 0) < financialCost) {
             return { ...state, toastMessage: 'Insufficient funds for official visit.' };
        }

        const updatedUserTeam = {
            ...state.userTeam,
            budget: { ...state.userTeam.budget!, cash: state.userTeam.budget!.cash - financialCost },
            finances: {
                ...state.userTeam.finances,
                recruitingExpenses: state.userTeam.finances.recruitingExpenses + financialCost,
                operationalExpenses: state.userTeam.finances.operationalExpenses + financialCost,
                ledger: [
                    ...(state.userTeam.finances.ledger || []),
                    {
                        id: `exp-visit-official-${Date.now()}-${Math.random()}`,
                        date: `Week ${state.week}`,
                        week: state.week,
                        season: state.season,
                        description: 'Recruiting: Official Visit',
                        category: 'Expense' as 'Expense',
                        amount: -financialCost,
                        runningBalance: (state.userTeam.budget?.cash || 0) - financialCost
                    }
                ]
            }
        };

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
		            recruits: state.recruits.map(r => {
		                if (r.id === action.payload.recruitId) {
		                    const teamName = state.userTeam!.name;
		                    const teamMomentum = { ...(r.teamMomentum || {}) };
		                    teamMomentum[teamName] = clamp((teamMomentum[teamName] ?? 0) + 2, -20, 20);
		                    const visitHistory = [...(r.visitHistory || [])];
		                    visitHistory.push({ teamName, week: action.payload.week, kind: 'Official' });
		                    return { ...r, visitStatus: 'Scheduled', visitWeek: action.payload.week, teamMomentum, visitHistory, lastUserContactWeek: state.week };
		                }
		                return r;
		            }),
	            contactsMadeThisWeek: state.contactsMadeThisWeek + visitCost,
	            toastMessage: `Official visit for ${state.recruits.find(r => r.id === action.payload.recruitId)?.name} scheduled for Week ${action.payload.week}. (-$${financialCost})`,
	        };
	    }
	    case 'OFFER_SCHOLARSHIP': {
	        if (!state.userTeam) return state;
	        const offeredRecruit = state.recruits.find(r => r.id === action.payload.recruitId);
            const userPrestige = state.userTeam.recruitingPrestige ?? state.userTeam.prestige ?? 50;
            // NOTE: Elite Fit warnings are shown in the modal. We no longer block offers for low-academics recruits.
            // This allows elite programs like Duke to pursue any player they choose.

            // Offer pruning (user team): enforce max active offers to prevent 40+ spam.
            const maxActiveOffers = userPrestige >= 94 ? 18 : userPrestige >= 80 ? 25 : 40;
            const activeOffers = state.recruits.filter(r => r.userHasOffered && !(r.isSigned || r.recruitmentStage === 'Signed')).length;
            const rescindCandidate = (() => {
                if (activeOffers < maxActiveOffers) return null;
                const teamName = state.userTeam!.name;
                const candidates = state.recruits
                    .filter(r => r.userHasOffered && r.id !== action.payload.recruitId)
                    .filter(r => !(r.isSigned || r.recruitmentStage === 'Signed'))
                    .map(r => ({
                        r,
                        momentum: r.teamMomentum?.[teamName] ?? 0,
                        interest: r.interest ?? 0,
                    }))
                    .sort((a, b) => (a.momentum - b.momentum) || (a.interest - b.interest));
                return candidates[0]?.r ?? null;
            })();
	        const offerCost = 9;
        if (state.contactsMadeThisWeek + offerCost > getContactPoints(state.userTeam)) {
            return {
                ...state,
                toastMessage: `Not enough contacts to make an offer (${offerCost} needed).`
            };
        }

        const financialCost = RECRUITING_COSTS.OFFER;
        if ((state.userTeam.budget?.cash || 0) < financialCost) {
             return { ...state, toastMessage: 'Insufficient funds to make offer.' };
        }

	        const updatedUserTeam = {
            ...state.userTeam,
            budget: { ...state.userTeam.budget!, cash: state.userTeam.budget!.cash - financialCost },
            finances: {
                ...state.userTeam.finances,
                recruitingExpenses: state.userTeam.finances.recruitingExpenses + financialCost,
                operationalExpenses: state.userTeam.finances.operationalExpenses + financialCost,
                ledger: [
                    ...(state.userTeam.finances.ledger || []),
                    {
                        id: `exp-offer-${Date.now()}-${Math.random()}`,
                        date: `Week ${state.week}`,
                        week: state.week,
                        season: state.season,
                        description: 'Recruiting: Scholarship Offer',
                        category: 'Expense' as 'Expense',
                        amount: -financialCost,
                        runningBalance: (state.userTeam.budget?.cash || 0) - financialCost
                    }
                ]
            }
        };

	        const pitchType = action.payload.pitchType ?? 'Standard';
	        const packageDealLinkedIds = new Set(
	            (offeredRecruit?.relationships || [])
	                .filter(rel => rel.sportLevel === 'HS' && (rel.notes || '').toLowerCase().includes('package deal'))
	                .map(rel => rel.personId)
	                .filter(id => id && id !== offeredRecruit?.id)
	        );
	        return {
	          ...state,
	          userTeam: updatedUserTeam,
	          allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
	          recruits: state.recruits.map(r => {
	            const teamName = state.userTeam!.name;
                if (rescindCandidate && r.id === rescindCandidate.id) {
                    const offerHistory = [...(r.offerHistory || [])];
                    for (let i = offerHistory.length - 1; i >= 0; i--) {
                        const entry = offerHistory[i];
                        if (entry.teamName === teamName && !entry.revoked) {
                            offerHistory[i] = { ...entry, revoked: true };
                            break;
                        }
                    }
                    return { ...r, userHasOffered: false, offerHistory };
                }
	            if (r.id === action.payload.recruitId) {
	                const teamMomentum = { ...(r.teamMomentum || {}) };
	                teamMomentum[teamName] = clamp((teamMomentum[teamName] ?? 0) + 5, -20, 20);
	                const offerHistory = [...(r.offerHistory || [])];
	                offerHistory.push({ teamName, week: state.week, date: state.currentDate, pitchType, source: 'User' });
	                const coachabilityMultiplier = 0.9 + clamp((r.coachability ?? 60) / 250, 0, 0.6);
	                return { ...r, userHasOffered: true, interest: normalizeInterest(r.interest + randomBetween(15, 25) * coachabilityMultiplier), teamMomentum, offerHistory, lastUserContactWeek: state.week, activeOfferCount: (r.cpuOffers?.length || 0) + 1 };
	            }

	            if (packageDealLinkedIds.has(r.id) && !r.verbalCommitment && !r.declinedOffers?.includes(teamName)) {
	                const teamMomentum = { ...(r.teamMomentum || {}) };
	                teamMomentum[teamName] = clamp((teamMomentum[teamName] ?? 0) + 7, -20, 20);
	                const boosted = normalizeInterest(r.interest + 12);
	                const lastRecruitingNews = r.lastRecruitingNews || (offeredRecruit ? `${r.name} is considering a package deal with ${offeredRecruit.name}.` : r.lastRecruitingNews);
	                return boosted === r.interest ? { ...r, teamMomentum, lastRecruitingNews } : { ...r, interest: boosted, teamMomentum, lastRecruitingNews };
	            }

	            return r;
	          }),
	          contactsMadeThisWeek: state.contactsMadeThisWeek + offerCost,
	          toastMessage: rescindCandidate
                ? `Offer cap reached: pulled ${rescindCandidate.name}, then offered (${pitchType}). (-$${financialCost})`
                : `Scholarship offered (${pitchType}). (-$${financialCost})`,
	        };
	    }
	    case 'PULL_SCHOLARSHIP': {
	        return {
	            ...state,
	            recruits: state.recruits.map(r => {
	                if (r.id === action.payload.recruitId) {
	                    const teamName = state.userTeam?.name;
	                    const offerHistory = [...(r.offerHistory || [])];
	                    if (teamName) {
	                        for (let i = offerHistory.length - 1; i >= 0; i--) {
	                            const entry = offerHistory[i];
	                            if (entry.teamName === teamName && !entry.revoked) {
	                                offerHistory[i] = { ...entry, revoked: true };
	                                break;
	                            }
	                        }
	                    }
	                    const newRecruit = { ...r, userHasOffered: false, offerHistory };
	                    if (newRecruit.verbalCommitment === state.userTeam?.name) {
	                        newRecruit.verbalCommitment = null;
	                    }
	                    return newRecruit;
	                }
	                return r;
	            })
	        };
	    }
    case 'NEGATIVE_RECRUIT': {
        if (!state.userTeam || !state.coach) return state;

        const { recruitId, targetSchool, method } = action.payload;
        const contactPointsCost = 1;

        if (state.contactsMadeThisWeek + contactPointsCost > getContactPoints(state.userTeam)) {
            return { ...state, toastMessage: 'Not enough contact points.' };
        }

        const financialCost = RECRUITING_COSTS.NEGATIVE;
        if ((state.userTeam.budget?.cash || 0) < financialCost) {
             return { ...state, toastMessage: 'Insufficient funds for negative recruiting.' };
        }

        const recruit = state.recruits.find(r => r.id === recruitId);
        if (!recruit) return state;

        let successChance = 0.5;
        let backfireChance = 0.2;
        let interestPenalty = 10;
        let repPenalty = 5;

        switch (method) {
            case 'Rumors':
                successChance = 0.6;
                backfireChance = 0.1;
                interestPenalty = 5;
                repPenalty = 2;
                break;
            case 'Violations':
                successChance = 0.4;
                backfireChance = 0.4;
                interestPenalty = 20;
                repPenalty = 10;
                break;
            case 'Academics':
                successChance = 0.5;
                backfireChance = 0.2;
                interestPenalty = 10;
                repPenalty = 5;
                break;
        }

        const roll = Math.random();
        let toastMessage = '';
        let updatedRecruits = [...state.recruits];
        let updatedCoach = { ...state.coach };

	        if (roll < backfireChance) {
	            // Backfire
	            updatedCoach.reputation = Math.max(0, updatedCoach.reputation - repPenalty);
	            updatedRecruits = updatedRecruits.map(r => {
	                if (r.id === recruitId) {
	                    const userTeamName = state.userTeam!.name;
	                    const teamMomentum = { ...(r.teamMomentum || {}) };
	                    teamMomentum[userTeamName] = clamp((teamMomentum[userTeamName] ?? 0) - 4, -20, 20);
	                    return { ...r, interest: normalizeInterest(r.interest - interestPenalty), teamMomentum };
	                }
	                return r;
	            });
	            toastMessage = `It backfired! Your negative recruiting against ${targetSchool} was discovered. Your reputation took a hit, and ${recruit.name}'s interest in your program has decreased. (-$${financialCost})`;
	        } else if (roll < backfireChance + successChance) {
	            // Success
	            const targetTeam = state.allTeams.find(t => t.name === targetSchool);
	            if(targetTeam) {
	                // This is a bit of a hack, but we'll manually lower the recruit's interest in the target school.
	                // A better approach would be to have a more sophisticated system for tracking recruit interest.
	                updatedRecruits = updatedRecruits.map(r => {
	                    if (r.id !== recruitId) return r;
	                    const userTeamName = state.userTeam!.name;
	                    const teamMomentum = { ...(r.teamMomentum || {}) };
	                    teamMomentum[targetSchool] = clamp((teamMomentum[targetSchool] ?? 0) - 6, -20, 20);
	                    teamMomentum[userTeamName] = clamp((teamMomentum[userTeamName] ?? 0) + 1, -20, 20);
	                    return { ...r, teamMomentum };
	                });
	                toastMessage = `It worked! Your negative recruiting against ${targetSchool} was effective. ${recruit.name}'s interest in their program has decreased. (-$${financialCost})`;
	            } else {
	                toastMessage = 'Something went wrong.';
	            }
            
        } else {
            // Failure
            toastMessage = `Your negative recruiting attempt against ${targetSchool} had no effect. (-$${financialCost})`;
        }

        const updatedUserTeam = {
            ...state.userTeam,
            budget: { ...state.userTeam.budget!, cash: state.userTeam.budget!.cash - financialCost },
            finances: {
                ...state.userTeam.finances,
                recruitingExpenses: state.userTeam.finances.recruitingExpenses + financialCost,
                operationalExpenses: state.userTeam.finances.operationalExpenses + financialCost,
                ledger: [
                    ...(state.userTeam.finances.ledger || []),
                    {
                        id: `exp-negative-${Date.now()}-${Math.random()}`,
                        date: `Week ${state.week}`,
                        week: state.week,
                        season: state.season,
                        description: 'Recruiting: Negative Recruiting',
                        category: 'Expense' as 'Expense',
                        amount: -financialCost,
                        runningBalance: (state.userTeam.budget?.cash || 0) - financialCost
                    }
                ]
            }
        };

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
            recruits: updatedRecruits,
            coach: updatedCoach,
            contactsMadeThisWeek: state.contactsMadeThisWeek + contactPointsCost,
            toastMessage,
        };
    }


    case 'SET_PLAYER_MINUTES': {
        if (!state.userTeam) return state;
        const { playerId, minutes } = action.payload;
        const rounded = Math.round(minutes);
        const clamped = Math.max(0, Math.min(40, rounded));
        const roster = state.userTeam.roster;
        const otherTotal = roster.reduce((sum, p) => (p.id === playerId ? sum : sum + (p.rotationMinutes || 0)), 0);
        const allowedMax = Math.max(0, 200 - otherTotal);
        const finalMinutes = Math.min(clamped, allowedMax);
        const updatedUser = {
            ...state.userTeam,
            roster: state.userTeam.roster.map(p => p.id === playerId ? { ...p, rotationMinutes: finalMinutes } : p)
        };
        const toastMessage = finalMinutes !== clamped ? 'Team minutes cannot exceed 200; allocation capped.' : state.toastMessage;
        return {
            ...state,
            userTeam: updatedUser,
            allTeams: state.allTeams.map(t => t.name === updatedUser.name ? updatedUser : t),
            toastMessage,
        };
    }
    case 'TOGGLE_PLAYER_MINUTES_LOCK': {
        if (!state.userTeam) return state;
        const toggleId = action.payload.playerId;
        const newRoster = state.userTeam.roster.map(p => p.id === toggleId ? { ...p, minutesLocked: !p.minutesLocked } : p);
        const updatedUser = { ...state.userTeam, roster: newRoster };
        return {
            ...state,
            userTeam: updatedUser,
            allTeams: state.allTeams.map(team => team.name === updatedUser.name ? updatedUser : team),
        };
    }
    case 'AUTO_DISTRIBUTE_MINUTES': {
        if (!state.userTeam) return state;
        const updatedRoster = distributeMinutesForUnlocked(state.userTeam.roster, MAX_TEAM_MINUTES, state.rotationPreference);
        const updatedUser = { ...state.userTeam, roster: updatedRoster };
        return {
            ...state,
            userTeam: updatedUser,
            allTeams: state.allTeams.map(t => t.name === updatedUser.name ? updatedUser : t),
            toastMessage: 'Minutes auto-distributed.',
        };
    }
    case 'AUTO_DISTRIBUTE_REMAINING_MINUTES': {
        if (!state.userTeam) return state;
        const { roster: updatedRoster, remaining } = addRemainingMinutesToUnlocked(state.userTeam.roster);
        const updatedUser = { ...state.userTeam, roster: updatedRoster };
        const toastMessage = remaining === 0
            ? 'Remaining minutes auto-distributed.'
            : 'Remaining minutes distributed until every unlocked player reached 40 MPG.';
        return {
            ...state,
            userTeam: updatedUser,
            allTeams: state.allTeams.map(t => t.name === updatedUser.name ? updatedUser : t),
            toastMessage,
        };
    }
    case 'SET_PLAYER_FOCUS': {
        if (!state.userTeam) return state;
        const updatedUser = { ...state.userTeam, playerFocusId: action.payload.playerId || null };
        return {
            ...state,
            userTeam: updatedUser,
            allTeams: state.allTeams.map(team => team.name === updatedUser.name ? updatedUser : team),
            toastMessage: action.payload.playerId ? 'Focus player updated.' : 'Focus cleared.',
        };
    }
    case 'SET_TEAM_CAPTAIN': {
        if (!state.userTeam) return state;
        const updatedUser = { ...state.userTeam, teamCaptainId: action.payload.playerId || null };
        return {
            ...state,
            userTeam: updatedUser,
            allTeams: state.allTeams.map(team => team.name === updatedUser.name ? updatedUser : team),
            toastMessage: action.payload.playerId ? 'Team captain named.' : 'Captain cleared.',
        };
    }
    case 'SET_ROTATION_PREFERENCE': {
        return {
            ...state,
            rotationPreference: action.payload,
        };
    }
    case 'RENAME_USER_COACH': {
        if (!state.coach || !state.userTeam) return state;
        const name = action.payload.name.trim();
        if (!name) return state;
        const updatedCoach = { ...state.coach, name };
        const updatedUserTeam = state.userTeam.headCoach
            ? {
                ...state.userTeam,
                headCoach: { ...state.userTeam.headCoach, name },
            }
            : alignTeamHeadCoachWithUser(state.userTeam, updatedCoach, state.season);
        const updatedAllTeams = state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t);
        return {
            ...state,
            coach: updatedCoach,
            userTeam: updatedUserTeam,
            allTeams: updatedAllTeams,
            toastMessage: 'Coach name updated.',
        };
    }
    case 'SET_AUTO_TRAINING_ENABLED': {
        return {
            ...state,
            autoTrainingEnabled: action.payload,
            toastMessage: action.payload ? 'Auto-training enabled.' : 'Auto-training disabled.',
        };
    }
    case 'RESET_MINUTES': {
        if (!state.userTeam) return state;
        const zeroedRoster = state.userTeam.roster.map(player => ({ ...player, rotationMinutes: 0 }));
        const updatedUserTeam = { ...state.userTeam, roster: zeroedRoster };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(team => team.name === updatedUserTeam.name ? updatedUserTeam : team),
            toastMessage: 'Minutes reset to 0 for everyone.',
        };
    }
    case 'SIMULATE_SIGNING_DAY': {
        if (!state.userTeam) return state;
        const { updatedRecruits } = processRecruitingWeek(state.allTeams, state.recruits, state.userTeam.name, 32 + state.signingPeriodDay, state.schedule, true, 0, undefined, Object.keys(state.coach?.skills || {}));
        const nextDay = state.signingPeriodDay + 1;
        const nextDate = addDaysISO(state.currentDate || (state.seasonAnchors?.ncaa?.titleMon ?? SEASON_START_DATE), 1);

        if (nextDay > 7) {
            if (state.offSeasonAdvanced) {
                return {
                    ...state,
                    recruits: updatedRecruits,
                    contactsMadeThisWeek: 0,
                    signingPeriodDay: nextDay,
                    currentDate: nextDate,
                };
            }

            const { finalTeams } = advanceToNewSeason(state.allTeams, updatedRecruits, state.season, Object.keys(state.coach?.skills || {}));
            const { progressionSummary, signingSummary } = generateSigningAndProgressionSummaries(finalTeams, updatedRecruits, state.userTeam.name);

            // Update pipeline states
            const userTeam = finalTeams.find(t => t.isUserTeam);
            if (userTeam) {
                const stateCounts: { [key: string]: number } = {};
                userTeam.roster.forEach(p => {
                    if (p.homeState) {
                        stateCounts[p.homeState] = (stateCounts[p.homeState] || 0) + 1;
                    }
                });

                const newPipelineStates: string[] = [];
                const newPipelines: Pipeline[] = [];
                for (const state in stateCounts) {
                    let tier: 'Gold' | 'Silver' | 'Bronze' | undefined;
                    if (stateCounts[state] >= 10) {
                        tier = 'Gold';
                    } else if (stateCounts[state] >= 6) {
                        tier = 'Silver';
                    } else if (stateCounts[state] >= 3) {
                        tier = 'Bronze';
                    }

                    if (tier) {
                        newPipelineStates.push(state);
                        newPipelines.push({ state, tier });
                    }
                }
                userTeam.pipelineStates = newPipelineStates;
                userTeam.pipelines = newPipelines;
            }

            return {
                ...state,
                allTeams: finalTeams,
                userTeam: finalTeams.find(t => t.isUserTeam) || null,
                recruits: updatedRecruits,
                contactsMadeThisWeek: 0,
                signingPeriodDay: nextDay,
                currentDate: nextDate,
                signingDaySummary: signingSummary,
                seasonEndSummary: progressionSummary,
                rosterRolledOver: true,
                offSeasonAdvanced: true,
                status: GameStatus.ROSTER_FILLING,
                nilPhaseComplete: false,
                nilNegotiationCandidates: [],
                nilNegotiationHistory: [],
                nbaSchedule: generateNBASchedule(state.nbaTeams || []),
            };
        }

        // NBA Offseason Daily Moves
        let nbaUpdate = {};
        if (state.nbaTeams && state.nbaFreeAgents) {
            let currentNbaTeams = state.nbaTeams;
            // Reset stats on Day 1 of signing period (NBA Offseason start)
            if (state.signingPeriodDay === 1) {
                 currentNbaTeams = currentNbaTeams.map(t => ({
                     ...t,
                     record: { wins: 0, losses: 0 },
                     roster: t.roster.map(p => ({
                         ...p,
                         nbaStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 },
                         seasonStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 }
                     }))
                 }));
            }

            // Use a pseudo-week > 30 to represent offseason "days"
            const pseudoWeek = 30 + state.signingPeriodDay; 
            const resultState = processNBAWeeklyMoves({
                ...state,
                nbaTeams: currentNbaTeams,
                week: pseudoWeek
            });
            const nextNbaPool = resultState.nbaFreeAgents;
            const oldTxLength = state.nbaTransactions?.length || 0;
            const dailyNbaTransactions = resultState.nbaTransactions?.slice(oldTxLength) || [];
            
            nbaUpdate = {
                nbaTeams: resultState.nbaTeams,
                nbaFreeAgents: applyNBAFreeAgentRetirementRules(nextNbaPool || []),
                nbaTransactions: resultState.nbaTransactions,
                nbaDraftPickAssets: resultState.nbaDraftPickAssets
            };
        }

        return {
            ...state,
            recruits: updatedRecruits,
            signingPeriodDay: nextDay,
            contactsMadeThisWeek: 0,
            toastMessage: `Day ${state.signingPeriodDay} Complete`,
            currentDate: nextDate,
            ...nbaUpdate
        };
    }
    case 'ADVANCE_TO_OFF_SEASON': {
        if (!state.userTeam) return state;
        if (state.offSeasonAdvanced) return state;

        const { finalTeams: advancedTeams } = advanceToNewSeason(state.allTeams, state.recruits, state.season, Object.keys(state.coach?.skills || {}));
        const { updatedTeams: finalTeams, summary: sponsorSummary } = updateSponsorContracts(advancedTeams, state.sponsors);
        const { progressionSummary, signingSummary } = generateSigningAndProgressionSummaries(finalTeams, state.recruits, state.userTeam.name);

        const refreshedNbaTeams = (state.nbaTeams || []).map(t => ({
            ...t,
            record: { wins: 0, losses: 0 },
            roster: t.roster.map(p => ({
                ...p,
                nbaStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 },
                seasonStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 }
            }))
        }));
        const resolvedSelectedNBATeam = syncSelectedNBATeamWithRoster(state.selectedNBATeam, refreshedNbaTeams);

        return {
            ...state,
            allTeams: finalTeams,
            userTeam: finalTeams.find(t => t.isUserTeam) || null,
            signingDaySummary: signingSummary,
            seasonEndSummary: progressionSummary,
            rosterRolledOver: true,
            offSeasonAdvanced: true,
            status: GameStatus.ROSTER_FILLING,
            nilPhaseComplete: false,
            nilNegotiationCandidates: [],
            nilNegotiationHistory: [],
            nbaSchedule: generateNBASchedule(state.nbaTeams || []),
            nbaTeams: refreshedNbaTeams,
            selectedNBATeam: resolvedSelectedNBATeam,
        };
    }
    case 'CUT_PLAYER': {
        if (!state.userTeam) return state;
        const { playerId } = action.payload;
        const player = state.userTeam.roster.find(p => p.id === playerId);
        if (!player) return state;

        const updatedRoster = state.userTeam.roster.filter(p => p.id !== playerId);
        const updatedUserTeam = { ...state.userTeam, roster: updatedRoster };

        // Add to alumni as "Cut"
        if (state.coach) {
            if (!state.coach.playerAlumni) state.coach.playerAlumni = {};
            state.coach.playerAlumni[player.id] = {
                name: player.name,
                lastTeam: state.userTeam.name,
                lastSeason: state.season,
            };
        }

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
            toastMessage: `Cut ${player.name} from the roster.`,
        };
    }
    case 'BULK_CUT_PLAYERS': {
        if (!state.userTeam) return state;
        const { playerIds } = action.payload;
        if (!playerIds || playerIds.length === 0) return state;

        const updatedRoster = state.userTeam.roster.filter(p => !playerIds.includes(p.id));
        const updatedUserTeam = { ...state.userTeam, roster: updatedRoster };

        // Add to alumni as "Cut"
        if (state.coach) {
            if (!state.coach.playerAlumni) state.coach.playerAlumni = {};
            playerIds.forEach((id: string) => {
                const player = state.userTeam!.roster.find(p => p.id === id);
                if (player) {
                    state.coach!.playerAlumni[id] = {
                        name: player.name,
                        lastTeam: state.userTeam!.name,
                        lastSeason: state.season,
                    };
                }
            });
        }

        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
            toastMessage: `Cut ${playerIds.length} players from the roster.`,
        };
    }




    case 'ADVANCE_TO_DRAFT': {
        // For now, if we don't have a full interactive Draft View yet, we can skip to Signing Period 
        // OR go to NBA_DRAFT if we plan to build it next.
        // The implementation plan implies building Draft & Lottery Storylines.
        // Let's go to NBA_DRAFT and assume we'll fix renderContent.
        // But to keep the loop working for the user test, I'll just go to SIGNING_PERIOD 
        // UNTIL I build the Draft View.
        // Wait, the task "Add Lottery Reveal UI" is what I'm doing.
        // The "Interactive Draft" is logically next.
        // I will route to SIGNING_PERIOD for now to close the loop, 
        // but add a comment that this should point to NBA_DRAFT later.
        // Actually, let's point to SIGNING_PERIOD but preserve the "Lottery Done" state if needed.
        
        return {
            ...state,
            status: GameStatus.SIGNING_PERIOD,
            signingPeriodDay: 1,
            currentDate: state.seasonAnchors?.ncaa?.titleMon ? addDaysISO(state.seasonAnchors.ncaa.titleMon, 1) : state.currentDate,
        };
    }
     case 'FILL_ROSTER': {
        if (!state.userTeam) return state;
        const filledUserTeam = fillRosterWithWalkOns(state.userTeam);
        return {
            ...state,
            userTeam: filledUserTeam,
            allTeams: state.allTeams.map(t => t.name === filledUserTeam.name ? filledUserTeam : t),
        };
    }
    case 'SET_STARTERS': {
        if (!state.userTeam) return state;
        const starterPayload = action.payload;
        const starterIdsToPos = new Map<string, RosterPositions>();
        Object.entries(starterPayload).forEach(([pos, id]) => {
            if (id) starterIdsToPos.set(id, pos as RosterPositions);
        });

        const newUserTeam = {
            ...state.userTeam,
            roster: state.userTeam.roster.map(p => ({
                ...p,
                starterPosition: starterIdsToPos.get(p.id) || null,
            })),
        };
        const newAllTeams = state.allTeams.map(t => t.name === newUserTeam.name ? newUserTeam : t);
        return {
            ...state,
            userTeam: newUserTeam,
            allTeams: newAllTeams,
            toastMessage: 'Starters Saved!',
        };
    }

    case 'ACCEPT_SPONSOR_OFFER': {
        if (!state.userTeam) return state;
        const { sponsorName, years, annualPayout } = action.payload;
        const newSponsor: Sponsor = createSponsorFromName(sponsorName, state.sponsors);

        const tempTeamForRevenueCalc = { ...state.userTeam, sponsor: newSponsor };
        const calculatedRevenue = calculateSponsorRevenueSnapshot(tempTeamForRevenueCalc);

        const updatedUserTeam = {
            ...state.userTeam,
            sponsor: newSponsor,
            sponsorRevenue: { ...calculatedRevenue, total: annualPayout },
            sponsorContractYearsRemaining: years,
            sponsorContractLength: years,
            sponsorOffers: [],
            budget: {
                ...state.userTeam.budget,
                cash: (state.userTeam.budget?.cash || 0) + annualPayout, // Immediate payout
            },
            finances: {
                ...state.userTeam.finances,
                ledger: [
                    ...(state.userTeam.finances.ledger || []),
                    {
                        id: `rev-sponsor-${Date.now()}`,
                        date: `Week ${state.week}`,
                        week: state.week,
                        season: state.season,
                        description: `Sponsor Signing Bonus: ${sponsorName}`,
                        category: 'Revenue' as 'Revenue',
                        amount: annualPayout,
                        runningBalance: (state.userTeam.budget?.cash || 0) + annualPayout
                    }
                ]
            }
        };

        const updatedAllTeams = state.allTeams.map(team =>
            team.name === updatedUserTeam.name ? updatedUserTeam : team
        );
        // Recompute sponsor landscape to reflect the new deal immediately in UI
        const { sponsors: sponsorsAfter, updatedTeams: teamsAfter } = recalculateSponsorLandscape(updatedAllTeams, state.sponsors, state.tournament);

        return {
            ...state,
            userTeam: teamsAfter.find(t => t.isUserTeam) || updatedUserTeam,
            allTeams: teamsAfter,
            sponsors: sponsorsAfter,
        };
    }
    case 'ACCEPT_SPONSOR_QUEST': {
        if (!state.userTeam) return state;
        const quest: SponsorQuest = {
            ...action.payload,
            status: 'active',
            progress: 0,
        };
        const updatedDeck = state.sponsorQuestDeck.filter(entry => entry.id !== action.payload.id);
        const updatedUserTeam = {
            ...state.userTeam,
            sponsorQuests: [...(state.userTeam.sponsorQuests ?? []).filter(q => q.id !== quest.id), quest],
        };
        return {
            ...state,
            sponsorQuestDeck: updatedDeck,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(team => (team.name === updatedUserTeam.name ? updatedUserTeam : team)),
            toastMessage: 'Sponsor quest activated.',
        };
    }

    case 'NEGOTIATE_BROADCAST': {
        if (!state.userTeam) return state;
        const { deal } = action.payload;
        const pendingOffers = (state.userTeam.pendingBroadcastOffers || []).filter(offer => offer.id !== deal.id);
        const sentiment = clampNumber((state.userTeam.fanMorale ?? state.userTeam.fanInterest ?? 50) + deal.exposureBonus, 5, 99);
        const feedEntry: EconomyEventFeedItem = {
            id: `broadcast-${deal.id}`,
            type: 'broadcast',
            message: `${deal.partner} broadcast deal locked through ${deal.endSeason}.`,
            timestamp: Date.now(),
        };
        const updatedUserTeam = {
            ...state.userTeam,
            broadcastDeal: deal,
            pendingBroadcastOffers: pendingOffers,
            fanMorale: sentiment,
        };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(team => (team.name === updatedUserTeam.name ? updatedUserTeam : team)),
            economyTelemetry: {
                ...state.economyTelemetry,
                eventFeed: [...state.economyTelemetry.eventFeed, feedEntry].slice(-15),
            },
            toastMessage: 'Broadcast deal accepted.',
        };
    }
    case 'DECLINE_BROADCAST_OFFER': {
        if (!state.userTeam) return state;
        const pendingOffers = (state.userTeam.pendingBroadcastOffers || []).filter(offer => offer.id !== action.payload.offerId);
        const feedEntry: EconomyEventFeedItem = {
            id: `broadcast-decline-${action.payload.offerId}`,
            type: 'broadcast',
            message: 'Declined a broadcast proposal.',
            timestamp: Date.now(),
        };
        const updatedUserTeam = { ...state.userTeam, pendingBroadcastOffers: pendingOffers };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(team => (team.name === updatedUserTeam.name ? updatedUserTeam : team)),
            economyTelemetry: {
                ...state.economyTelemetry,
                eventFeed: [...state.economyTelemetry.eventFeed, feedEntry].slice(-15),
            },
        };
    }
    case 'PROCEED_TO_ROSTER_MANAGEMENT': {
        if (!state.userTeam) return state;
        
        const { updatedTeams, prestigeChanges } = processEndOfSeasonPrestigeUpdates(
            state.allTeams,
            state.tournament,
            state.recruits,
            state.draftResults,
            Object.keys(state.coach?.skills || {})
        );
        
        const lastSeasonRecord = state.history.userTeamRecords.find(r => r.season === state.season);

        const previousReputation = state.coach?.reputation || 0;
        const predictedReputation = lastSeasonRecord && state.coach?.contract
            ? updateCoachReputation({ ...state.coach }, lastSeasonRecord, state.coach.contract)
            : previousReputation;
        const reputationChange = predictedReputation - previousReputation;
        
        const recapTeam = updatedTeams.find(t => t.isUserTeam) || state.userTeam;
        const recapBaseline = state.coach?.contract?.expectations
            ? state.coach.contract.expectations
            : (recapTeam.boardExpectations || generateBoardExpectations(recapTeam));
        const recapCpiEvaluation = calculateBoardPressure(
            recapTeam,
            lastSeasonRecord,
            state.draftResults,
            recapBaseline,
            state.coach?.contract?.yearPerformance || [],
            state.coach?.contract || null
        );
        const recapResults: SeasonRecapResult = {
            wins: lastSeasonRecord?.wins ?? recapTeam?.record?.wins ?? 0,
            losses: lastSeasonRecord?.losses ?? recapTeam?.record?.losses ?? 0,
            conferenceRecord: recapTeam?.seasonStats
                ? `${recapTeam.seasonStats.confWins}-${recapTeam.seasonStats.confLosses}`
                : lastSeasonRecord
                    ? `${lastSeasonRecord.regularSeasonWins ?? lastSeasonRecord.wins}-${lastSeasonRecord.regularSeasonLosses ?? lastSeasonRecord.losses}`
                    : '0-0',
            conferenceFinish: recapTeam?.seasonStats?.confFinish ?? 0,
            postSeasonResult: lastSeasonRecord?.tournamentResult || 'N/A',
            finalRank: lastSeasonRecord?.rank ?? 0,
        };

        const recapCpiScore = recapCpiEvaluation.boardExpectations.metrics?.compositeScore ?? 0;
        const recapCpiStatus = recapCpiEvaluation.boardExpectations.jobSecurityStatus || 'Warm';
        const recapCpiComponents = (recapCpiEvaluation.boardExpectations.metrics?.components || []).map(component => ({
            label: component.label,
            score: component.score,
            reason: component.displayActual ?? component.label,
            key: component.key,
            weight: component.weight,
            displayActual: component.displayActual,
            displayExpected: component.displayExpected,
            actual: component.actual,
            expected: component.expected,
        }));
        const recapCpiGrade = recapCpiScore >= 90 ? 'A' : recapCpiScore >= 80 ? 'B' : recapCpiScore >= 70 ? 'C' : recapCpiScore >= 60 ? 'D' : 'F';
        const recapCpi: SeasonRecapData['cpi'] | undefined = recapCpiEvaluation.boardExpectations.metrics
            ? {
                score: recapCpiScore,
                grade: recapCpiGrade,
                security: recapCpiStatus,
                components: recapCpiComponents,
                compositeScore: recapCpiScore,
                status: recapCpiStatus,
                boardProfile: recapCpiEvaluation.boardExpectations.boardProfile,
            }
            : undefined;

        const gamesPlayed = (state.userTeam?.seasonStats?.wins ?? 0) + (state.userTeam?.seasonStats?.losses ?? 0);
        const recapData: SeasonRecapData = {
            season: state.season,
            seasonYear: state.seasonYear,
            teamName: state.userTeam?.name,
            conference: state.userTeam?.conference,
            results: recapResults,
            signings: state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name && (r.isSigned || r.recruitmentStage === 'Signed')),
            signedRecruits: state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name && (r.isSigned || r.recruitmentStage === 'Signed')),
            verbalCommits: state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name && !(r.isSigned || r.recruitmentStage === 'Signed')),
            signedPct: (() => {
                const signed = state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name && (r.isSigned || r.recruitmentStage === 'Signed')).length;
                const verbal = state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name && !(r.isSigned || r.recruitmentStage === 'Signed')).length;
                const total = signed + verbal;
                return total > 0 ? signed / total : 0;
            })(),
            verbalPct: (() => {
                const signed = state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name && (r.isSigned || r.recruitmentStage === 'Signed')).length;
                const verbal = state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name && !(r.isSigned || r.recruitmentStage === 'Signed')).length;
                const total = signed + verbal;
                return total > 0 ? verbal / total : 0;
            })(),
            decommitments: state.recruits.reduce((sum, r) => sum + ((r.recruitingEvents || []).filter(e => e.type === 'Decommit').length), 0),
            flips: state.recruits.reduce((sum, r) => sum + ((r.recruitingEvents || []).filter(e => e.type === 'Flip').length), 0),
            drafted: state.draftResults.filter(d => d.originalTeam === state.userTeam!.name),
            prestigeChange: {
                previous: (state.userTeam?.prestige || 50) - (prestigeChanges.get(state.userTeam?.name || '') || 0),
                current: state.userTeam?.prestige || 50,
                delta: prestigeChanges.get(state.userTeam?.name || '') || 0,
            },
            coachReputation: predictedReputation,
            coachReputationChange: reputationChange,
            financials: {
                totalRevenue: lastSeasonRecord?.totalRevenue || 0,
                netIncome: lastSeasonRecord?.projectedRevenue || 0,
            },
            attendance: {
                games: gamesPlayed,
                avgAttendance: 0,
                avgFillRate: 0,
                avgGameRevenue: 0,
            },
            cpi: recapCpi,
            record: `${recapResults.wins}-${recapResults.losses}`,
            tournamentResult: recapResults.postSeasonResult,
        };
        
        return {
            ...state,
            status: GameStatus.SEASON_RECAP,
            allTeams: updatedTeams,
            userTeam: updatedTeams.find(t => t.isUserTeam) || null,
            seasonRecapData: recapData,
        };
    }
    case 'EVALUATE_OFFSEASON': {
        if (!state.coach?.contract || !state.userTeam) return state;

        // Prevent double execution
        if (state.status === GameStatus.SIGNING_PERIOD || 
            state.status === GameStatus.ROSTER_RETENTION || 
            state.status === GameStatus.TRANSFER_PORTAL || 
            state.status === GameStatus.JOB_MARKET) {
            return state;
        }

        const shouldRollRosters = !state.rosterRolledOver;
        const preppedTeams = shouldRollRosters ? rollOverTeamsForNextSeason(state.allTeams, state.season) : state.allTeams;
        const normalizedTeams = preppedTeams.map(t => ensureTeamHeadCoach(t));
        const normalizedUserTeam = normalizedTeams.find(t => t.isUserTeam) || state.userTeam;
        const rosterUpdate = {
            allTeams: normalizedTeams,
            userTeam: normalizedUserTeam,
            rosterRolledOver: true,
            offSeasonAdvanced: false,
        };

        const lastSeasonRecord = state.history.userTeamRecords.find(r => r.teamName === state.userTeam!.name && r.season === state.season);
        let updatedCoach = { ...state.coach };

        if (lastSeasonRecord) {
            updatedCoach.reputation = updateCoachReputation(updatedCoach, lastSeasonRecord, updatedCoach.contract);
        }

        // Decrement contract years before evaluation
        if (updatedCoach.contract) {
            updatedCoach = {
                ...updatedCoach,
                contract: {
                    ...updatedCoach.contract,
                    yearsRemaining: updatedCoach.contract.yearsRemaining - 1,
                },
            };
        }
        
        const fanMorale = normalizedUserTeam.fanMorale ?? normalizedUserTeam.fanInterest ?? 50;
        const unfinishedBusiness = calculateUnfinishedBusinessBonus(normalizedUserTeam.name, state.tournament);
        const recalculatedNilBudget = calculateTeamNilBudget(normalizedUserTeam, {
            fanSentiment: fanMorale,
            sponsorTier: normalizedUserTeam.sponsor?.tier || 'Low',
            tournamentBonus: unfinishedBusiness,
        });
        const nilReadyUserTeam = {
            ...normalizedUserTeam,
            nilBudget: recalculatedNilBudget,
            nilBudgetUsed: 0,
            nilBoostFromSponsor: Math.round(recalculatedNilBudget * 0.12),
        };
        const nilCandidates = buildNilNegotiationCandidates(nilReadyUserTeam, {
            fanSentiment: fanMorale,
            unfinishedBusinessBonus: unfinishedBusiness,
        });

        // Evaluate Board Pressure & Job Security
            const evaluation = calculateBoardPressure(
             normalizedUserTeam,
             lastSeasonRecord,
             state.draftResults,
             updatedCoach.contract?.expectations,
             updatedCoach.contract?.yearPerformance || [],
             updatedCoach.contract || null
         );
        
        const expectations = evaluation.boardExpectations!;
        const jobStatus = expectations.jobSecurityStatus;
        const goalMet = jobStatus === 'Safe' || jobStatus === 'Warm';

        // Update Coach Contract with new expectations state
        if (updatedCoach.contract) {
             updatedCoach.contract.expectations = expectations;
             
             // Record this year's performance
            const yearResult: 'Met' | 'Missed' = goalMet ? 'Met' : 'Missed';
            updatedCoach.contract.yearPerformance = [
                ...(updatedCoach.contract.yearPerformance || []),
                yearResult
            ];
        }

        // Check for Firing
        if (jobStatus === 'Fired' && !state.pendingJobOffer) {
             const jobOffers = generateJobOffers(normalizedUserTeam, updatedCoach, state.allTeams, false);
             const nbaOffers = generateNBAJobOffers(updatedCoach, state.currentNBASimulation, normalizedUserTeam.prestige);
             
             return { 
                 ...state, 
                 ...rosterUpdate, 
                 status: GameStatus.JOB_MARKET, 
                 coach: updatedCoach, 
                 jobOffers, 
                 nbaJobOffers: nbaOffers, 
                 toastMessage: "You have been fired due to poor performance!" 
            };
        }

        // Check for Contract Expiration
        if (updatedCoach.contract && updatedCoach.contract.yearsRemaining < 1) {
            if (!goalMet) {
                updatedCoach.failedContracts += 1;
            }

            if (updatedCoach.failedContracts >= 2) {
                return { ...state, status: GameStatus.GAME_OVER, gameOverReason: `After failing multiple contracts, your coaching career is over.` };
            }
            
            // Renewal Logic
            // If Safe, almost always renew. If Warm, 50% chance. If Hot, likely fire (but we handled Fired above).
            let willRenew = true;
            if (jobStatus === 'Hot') willRenew = Math.random() > 0.7; // 30% chance to save job
            if (jobStatus === 'Warm') willRenew = Math.random() > 0.2; // 80% chance to renew

             const currentSeasonRecord = lastSeasonRecord;
             const wins = currentSeasonRecord?.wins || 0;
             const revenue = (currentSeasonRecord?.totalRevenue || 0) - (currentSeasonRecord?.operationalExpenses || 0);
            const tournamentAppearances = (() => {
                const result = (currentSeasonRecord?.tournamentResult || '').toLowerCase();
                if (!result || result.includes('did not') || result === 'n/a') return 0;
                return 1;
            })();
 
             return {
                 ...state,
                 ...rosterUpdate, 
                 status: GameStatus.COACH_PERFORMANCE_REVIEW,
                 coach: updatedCoach,
                 contractReviewData: {
                     goalMet,
                     wins: wins,
                     tournamentAppearances,
                     revenue: revenue,
                     adDecision: willRenew ? 'renew' : 'fire'
                 }
             };
        }

        if (!state.nilPhaseComplete && nilCandidates.length > 0) {
            const teamsWithNil = normalizedTeams.map(team =>
                team.name === nilReadyUserTeam.name ? nilReadyUserTeam : team
            );
            return {
                ...state,
                ...rosterUpdate,
                allTeams: teamsWithNil,
                userTeam: nilReadyUserTeam,
                nilNegotiationCandidates: nilCandidates,
                nilNegotiationHistory: [],
                status: GameStatus.NIL_NEGOTIATION,
                coach: updatedCoach,
            };
        }

        const teamsWithNil = normalizedTeams.map(team =>
            team.name === nilReadyUserTeam.name ? nilReadyUserTeam : team
        );
        const rosterAfterNil = { ...rosterUpdate, allTeams: teamsWithNil, userTeam: nilReadyUserTeam };

        const prestigeDrop = state.coach.contract.initialPrestige - nilReadyUserTeam.prestige;
        if (prestigeDrop > 10) {
            const fireChance = (prestigeDrop - 10) * 0.10;
            if (Math.random() < fireChance && !state.pendingJobOffer) {
                 const jobOffers = generateJobOffers(nilReadyUserTeam, updatedCoach, state.allTeams, false);
                 const nbaOffers = generateNBAJobOffers(updatedCoach, state.currentNBASimulation, nilReadyUserTeam.prestige);
                if (jobOffers.length === 0 && nbaOffers.length === 0) {
                return { ...state, ...rosterAfterNil, status: GameStatus.GAME_OVER, gameOverReason: `You were fired for letting prestige fall, and no other schools were interested.` };
            }
            return { ...state, ...rosterAfterNil, status: GameStatus.JOB_MARKET, coach: updatedCoach, jobOffers, nbaJobOffers: nbaOffers, toastMessage: "You've been fired!" };
        }
        }
        
        return {
            ...state,
            ...rosterAfterNil,
            status: GameStatus.ROSTER_RETENTION, // Transition to Roster Retention to start Portal flow
            seasonRecapData: null,
            coach: updatedCoach,
            signingPeriodDay: 1,
            offSeasonAdvanced: false,
            toastMessage: 'Entering Offseason: Roster Retention',
        };
    }
    case 'PROCEED_TO_JOB_MARKET': {
        if (!state.userTeam || !state.coach) return state;

        // If coming from contract review, check for game over condition
        if (state.contractReviewData) {
             const jobOffers = generateJobOffers(state.userTeam, state.coach, state.allTeams, state.contractReviewData.goalMet);
             const nbaOffers = generateNBAJobOffers(state.coach, state.currentNBASimulation, state.userTeam.prestige);

             if (jobOffers.length === 0 && nbaOffers.length === 0) {
                 return { ...state, status: GameStatus.GAME_OVER, gameOverReason: `You failed your contract goal, and no other schools or NBA teams were interested.` };
             }
             
             return {
                ...state,
                status: GameStatus.JOB_MARKET,
                jobOffers,
                nbaJobOffers: nbaOffers,
                contractReviewData: null,
            };
        }

        // General entry (e.g. from menu or firing without review)
        const jobOffers = state.jobOffers || generateJobOffers(state.userTeam, state.coach, state.allTeams, false);
        const nbaOffers = state.nbaJobOffers || generateNBAJobOffers(state.coach, state.currentNBASimulation, state.userTeam.prestige);

        return {
            ...state,
            status: GameStatus.JOB_MARKET,
            jobOffers,
            nbaJobOffers: nbaOffers,
        };
    }
    case 'REJECT_JOB_OFFERS': {
        if (!state.userTeam) return state;
        const userTeamHasAtRiskPlayers = state.userTeam.roster.some(p => p.atRiskOfTransfer);
        const nextStatus = userTeamHasAtRiskPlayers ? GameStatus.ROSTER_RETENTION : GameStatus.TRANSFER_PORTAL;
        
        return {
            ...state,
            status: nextStatus,
            jobOffers: null,
            nbaJobOffers: null,
            toastMessage: "Job offers rejected. Returning to team.",
        };
    }
    case 'SELECT_NBA_JOB_OFFER': {
        if (!state.coach) return state;
        const nbaTeam = action.payload;
        return {
            ...state,
            nbaCoachTeam: nbaTeam,
            nbaJobOffers: null,
            jobOffers: state.jobOffers, // keep college offers for now
            coach: { ...state.coach, currentLeague: 'NBA', currentNBATeam: nbaTeam },
            status: GameStatus.NBA_CONTRACT_NEGOTIATION,
        };
    }
    case 'SELECT_NBA_CONTRACT_GOAL': {
        if (!state.coach || !state.nbaCoachTeam) return state;
        const { goal, salary } = action.payload;
        const newContract: CoachContract = {
            teamName: state.nbaCoachTeam,
            yearsRemaining: goal.duration,
            initialPrestige: 85,
            goal,
            expectations: {
                targetWins: 0,
                targetTourneyRound: 'N/A',
                targetNetIncome: 0,
                targetRevenue: 0,
                targetJerseySales: 0,
                targetDraftPicks: 0,
                targetAttendanceFillRate: 0.5,
                boardProfile: 'Balanced',
                weights: { wins: 0.3, postseason: 0.25, pipeline: 0.1, brand: 0.15, finances: 0.2 },
                maxBudget: 0,
                patience: 100,
                pressure: 0,
                discretionaryFunds: 0,
                jobSecurityStatus: 'Safe',
            }, // Dummy for NBA
            progress: { wins: 0, tournamentAppearances: 0, netIncome: 0 },
            yearPerformance: [],
            salary,
        };
        return {
            ...state,
            nbaCoachContract: newContract,
            coach: { ...state.coach, currentLeague: 'NBA', currentNBATeam: state.nbaCoachTeam },
            status: GameStatus.NBA_DASHBOARD,
        };
    }
    case 'SIMULATE_NBA_SEASON': {
        if (!state.nbaCoachTeam) return state;
        const season = state.nbaSeason || state.season;
        const sim = simulateNBASeason(season);
        const team = sim.teams.find(t => t.name === state.nbaCoachTeam);
        const wins = team ? team.wins : 0;
        const losses = team ? team.losses : 0;
        // Increment contract progress if present
        const nextContract = state.nbaCoachContract ? { ...state.nbaCoachContract, yearsRemaining: Math.max(0, state.nbaCoachContract.yearsRemaining - 1), progress: { ...state.nbaCoachContract.progress, wins: (state.nbaCoachContract.progress.wins || 0) + wins } } : state.nbaCoachContract || null;
        return {
            ...state,
            currentNBASimulation: sim,
            nbaRecord: { wins, losses },
            nbaSeason: season + 1,
            nbaCoachContract: nextContract,
        };
    }
    case 'SELECT_JOB_OFFER': {
        if (!state.coach) return state;

        const offer = action.payload;
        const newTeamName = offer.teamName;
        const previousTeamName = state.userTeam?.name;
        const prestigeLookup = Object.fromEntries(state.allTeams.map(t => [t.name, t.prestige]));
        const earliestRecordedSeason = getEarliestHistorySeason(state.history.teamHistory);
        const newAllTeams = state.allTeams.map(t => {
            if (t.name === newTeamName) {
                const updated = updateTeamWithUserCoach({ ...t, isUserTeam: true }, state.coach!, state.season);
                return updated;
            }
            if (previousTeamName && t.name === previousTeamName) {
                const previousTeam = {
                    ...t,
                    isUserTeam: false,
                    headCoach: createHeadCoachProfile(t.name, t.prestige, state.season, {
                        historyMap: state.history.teamHistory,
                        teamPrestigeMap: prestigeLookup,
                        currentSeason: state.season,
                        earliestSeason: earliestRecordedSeason,
                    }),
                };
                previousTeam.playbookFamiliarity = Math.max(0, previousTeam.playbookFamiliarity - 30);
                previousTeam.fanMorale = clamp(previousTeam.fanMorale - 20, 0, 100);
                return previousTeam;
            }
            return { ...t, isUserTeam: false };
        });
        const newUserTeam = newAllTeams.find(t => t.isUserTeam) || null;

        return {
            ...state,
            userTeam: newUserTeam,
            allTeams: newAllTeams,
            jobOffers: null,
            pendingJobOffer: offer,
            coach: { ...state.coach, contract: null },
            status: GameStatus.CONTRACT_NEGOTIATION,
            pendingStaffRenewals: collectExpiredStaffRenewals(newUserTeam),
            nilNegotiationCandidates: [],
            nilNegotiationHistory: [],
            nilPhaseComplete: false,
            previousTeamName: previousTeamName, // Track old team for history recording
            toastMessage: null, // Clear any previous messages (e.g. "Fired")
        };
    }






        case 'MEET_WITH_PLAYER': {
        if (!state.userTeam || !state.coach) return state;
        const { playerId } = action.payload;
        
        let retentionSuccess = false;
        
        const updatedRoster = state.userTeam.roster.map(p => {
             if (p.id === playerId) {
                 if (p.retentionTalkUsed) return p; // Already talked
                 
                 const prob = calculateRetentionProbability(p, state.userTeam!, state.coach);
                 const roll = Math.random() * 100;
                 const success = roll < prob;
                 
                 if (success) {
                     retentionSuccess = true;
                     return { ...p, atRiskOfTransfer: false, transferMotivation: undefined, retentionTalkUsed: true };
                 } else {
                     return { ...p, retentionTalkUsed: true };
                 }
             }
             return p;
        });

        const updatedUserTeam = { ...state.userTeam, roster: updatedRoster };
        const msg = retentionSuccess ? "Success! The player agreed to stay." : "The meeting did not go well. The player is still considering leaving.";
        
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
            toastMessage: msg
        };
    }

    case 'FINALIZE_ROSTER_RETENTION': {
        if (!state.userTeam) return state;

        // Process Transfer Portal Open
        const { teams: teamsAfterPortalOpen, portalPlayers } = processTransferPortalOpen(state.allTeams);
        
        // Find updated user team
        let updatedUserTeam = teamsAfterPortalOpen.find(t => t.isUserTeam) || state.userTeam;

        // Explicitly remove at-risk players from user team and add to portal
        const departingPlayers = updatedUserTeam.roster.filter(p => p.atRiskOfTransfer);
        const keptPlayers = updatedUserTeam.roster.filter(p => !p.atRiskOfTransfer);

        updatedUserTeam = { ...updatedUserTeam, roster: keptPlayers };
        
        const finalPortalPlayers = [...portalPlayers, ...departingPlayers.map(p => ({
            ...p,
            interest: 0,
            userHasOffered: false,
            cpuOffers: [],
            isTargeted: false,
            originTeamName: updatedUserTeam.name
        }))];

        const finalTeams = teamsAfterPortalOpen.map(t => t.isUserTeam ? updatedUserTeam : t);

        return {
            ...state,
            allTeams: finalTeams,
            userTeam: updatedUserTeam,
            transferPortal: {
                players: finalPortalPlayers,
                userOffers: [],
                day: 1
            },
            status: GameStatus.TRANSFER_PORTAL,
            toastMessage: "Transfer Portal is now open!",
        };
    }

    case 'SIMULATE_USER_GAME': {
        const { messages, shouldSimulateGamesToday } = runDailySimulation(state, true);
        if (!shouldSimulateGamesToday) {
            return { ...state, toastMessage: messages.length > 0 ? messages[0] : state.toastMessage };
        }

        const simDate = state.currentDate || SEASON_START_DATE;
        const coachSkills = Object.keys(state.coach?.skills || {});
        const { updatedAllTeams, updatedSchedule, gameLogs, newUserTeamAttendance, updatedCoach, processedEventIds, simulatedWeeks, updatedRecruits, recruitingEvents } = runSimulationForDate(
            state,
            simDate,
            state.allTeams,
            state.schedule,
            coachSkills,
            state.eventPlaybookCatalog
        );

        const processedEventQueue = (state.eventQueue || []).map(e =>
            processedEventIds.includes(e.id) ? { ...e, processed: true } : e
        );

        const weeksToFinalize = (simulatedWeeks || []).filter(weekNum => {
            const weekGames = (updatedSchedule || [])[weekNum - 1] || [];
            return weekGames.length > 0 && weekGames.every(g => g.played);
        });

        let finalizedTeams = updatedAllTeams;
        if (weeksToFinalize.length > 0) {
            const season = state.season;
            const scheduleAfter = updatedSchedule || [];

            weeksToFinalize.forEach(weekNum => {
                finalizedTeams = finalizedTeams.map(team => {
                    let t = processWeeklyFinances(team, season, weekNum, scheduleAfter[weekNum - 1] || []);
                    t = degradeFacilities(t);
                    t = processFacilityConstruction(t);
                    return t;
                });
            });

            finalizedTeams = processInSeasonDevelopment(finalizedTeams, coachSkills);
        }

        const nextDate = addDaysISO(simDate, 1);
        const nextWeek = (() => {
            const schedule = updatedSchedule || [];
            for (let i = 0; i < schedule.length; i += 1) {
                const weekGames = schedule[i] || [];
                if (weekGames.some(g => !g.played)) return i + 1;
            }
            return schedule.length + 1;
        })();

        return {
            ...state,
            allTeams: finalizedTeams,
            userTeam: finalizedTeams.find(t => t.isUserTeam) || state.userTeam,
            schedule: updatedSchedule,
            eventQueue: processedEventQueue,
            currentDate: nextDate,
            week: nextWeek,
            gameInSeason: nextWeek,
            contactsMadeThisWeek: 0,
            trainingPointsUsedThisWeek: 0,
            gameLogs: [...state.gameLogs, ...gameLogs],
            currentUserTeamAttendance: dedupeAttendanceRecords([...state.currentUserTeamAttendance, ...newUserTeamAttendance]),
            coach: updatedCoach,
            toastMessage: 'Simulated game.',
            recruits: updatedRecruits,
            timeline: [...(state.timeline || []), ...recruitingEvents],
        };
    }

    case 'SIMULATE_TRANSFER_PORTAL_DAY': {
        if (!state.userTeam || !state.transferPortal) return state;

        const { updatedTeams, updatedPortalPlayers } = processTransferPortalDay(state.allTeams, state.transferPortal.players, Object.keys(state.coach?.skills || {}));
        
        // Update user team reference
        const updatedUserTeam = updatedTeams.find(t => t.isUserTeam) || state.userTeam;
        
        const nextDay = state.transferPortal.day + 1;
        let nextStatus = state.status;
        
        if (nextDay > 4) {
             nextStatus = GameStatus.NBA_DRAFT_LOTTERY;
        }

        return {
            ...state,
            allTeams: updatedTeams,
            userTeam: updatedUserTeam,
            transferPortal: {
                ...state.transferPortal,
                players: updatedPortalPlayers,
                day: nextDay
            },
            status: nextStatus,
            toastMessage: `Simulated Transfer Portal Day ${state.transferPortal.day}`,
        };
    }

    case 'OFFER_TRANSFER_PLAYER': {
        if (!state.transferPortal) return state;
        const { playerId } = action.payload;
        
        const updatedPlayers = state.transferPortal.players.map(p => {
            if (p.id === playerId) {
                return { ...p, userHasOffered: !p.userHasOffered };
            }
            return p;
        });

        const updatedUserOffers = updatedPlayers.find(p => p.id === playerId)?.userHasOffered
            ? [...state.transferPortal.userOffers, playerId]
            : state.transferPortal.userOffers.filter(id => id !== playerId);

        return {
            ...state,
            transferPortal: {
                ...state.transferPortal,
                players: updatedPlayers,
                userOffers: updatedUserOffers,
            }
        };
    }

    case 'TOGGLE_TRANSFER_TARGET': {
        if (!state.transferPortal) return state;
        const { playerId } = action.payload;

        const updatedPlayers = state.transferPortal.players.map(p => {
            if (p.id === playerId) {
                return { ...p, isTargeted: !p.isTargeted };
            }
            return p;
        });

        return {
            ...state,
            transferPortal: {
                ...state.transferPortal,
                players: updatedPlayers,
            }
        };
    }

    case 'FINALIZE_TRANSFER_PORTAL': {
        if (!state.userTeam) return state;

        return {
            ...state,
            status: GameStatus.NBA_DRAFT_LOTTERY,
            transferPortalComplete: true,
            toastMessage: "Proceeding to Draft Lottery",
        };
    }


    case 'SET_PARKING_PRICES': {
        if (!state.userTeam) return state;
        const { general, vip } = action.payload;
        const updatedUserTeam = {
            ...state.userTeam,
            parking: {
                ...(state.userTeam.parking || { tailgateCulture: 50, revenueSettings: { surgeMultiplier: 1, earlyAccessPremium: 0, amenityAddonPrice: 0 } }),
                generalPrice: general,
                vipPrice: vip,
            }
        };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
        };
    }
    case 'SET_TAILGATE_CULTURE': {
        if (!state.userTeam) return state;
        const updatedUserTeam = {
            ...state.userTeam,
            parking: {
                ...(state.userTeam.parking || { generalPrice: 20, vipPrice: 50, revenueSettings: { surgeMultiplier: 1, earlyAccessPremium: 0, amenityAddonPrice: 0 } }),
                tailgateCulture: action.payload,
            }
        };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
        };
    }



    case 'UPDATE_CONCESSION_ITEM_TIER': {
        if (!state.userTeam) return state;
        const { itemId, tier } = action.payload;
        const concessions = state.userTeam.concessions || { items: [], tier: 'Standard', alcoholPolicy: true };
        
        const updatedItems = (concessions.items || []).map(item => {
            if (item.id === itemId) {
                const getMultiplier = (t: string) => t === 'Budget' ? 0.8 : t === 'Gourmet' ? 1.5 : 1.0;
                const currentMult = getMultiplier(item.supplierTier);
                const newMult = getMultiplier(tier);
                
                const baseCost = item.costPerUnit / currentMult;
                const newCost = baseCost * newMult;
                
                const getDemandMult = (t: string) => t === 'Budget' ? 0.9 : t === 'Gourmet' ? 1.2 : 1.0;
                const newDemandMult = getDemandMult(tier);
                
                return { 
                    ...item, 
                    supplierTier: tier,
                    costPerUnit: newCost,
                    demandMultiplier: newDemandMult
                };
            }
            return item;
        });
        
        const updatedUserTeam = {
            ...state.userTeam,
            concessions: {
                ...concessions,
                items: updatedItems
            }
        };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
        };
    }


    case 'SET_NIL_SPLIT': {
        if (!state.userTeam) return state;
        const split = action.payload;
        const merchandising = state.userTeam.merchandising || { items: [], inventoryStrategy: 'JustInTime', jerseySales: {} };
        
        const updatedUserTeam = {
            ...state.userTeam,
            merchandising: {
                ...merchandising,
                nilSplit: split
            }
        };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
        };
    }

    case 'CANCEL_EVENT': {
        if (!state.userTeam) return state;
        const { eventId } = action.payload;
        const updatedUserTeam = cancelEvent(state.userTeam, eventId);
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
            toastMessage: `Event cancelled.`,
        };
    }


    case 'UPDATE_PLAYER_TRAINING': {
        if (!state.userTeam) return state;
        const { playerId, focus, intensity } = action.payload;
        const updatedRoster = state.userTeam.roster.map(p => {
            if (p.id === playerId) {
                return { ...p, trainingFocus: focus ?? p.trainingFocus, trainingIntensity: intensity ?? p.trainingIntensity };
            }
            return p;
        });
        const updatedUserTeam = { ...state.userTeam, roster: updatedRoster };
        return {
            ...state,
            userTeam: updatedUserTeam,
            allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
        };
    }
    case 'FINALIZE_TRAINING': {
        const nextSeason = state.season + 1;
        const retiredThisOffseason: HeadCoachProfile[] = [];
        const { trainedTeams, summary } = processTraining(state.allTeams, action.payload, Object.keys(state.coach?.skills || {}));
        const prestigeLookup = Object.fromEntries(state.allTeams.map(t => [t.name, t.prestige]));
        const earliestRecordedSeason = getEarliestHistorySeason(state.history.teamHistory);
        const resetTeamsWithProjectedRevenue = trainedTeams.map(team => {
            const normalizedTeam = ensureTeamHeadCoach(team);
            const lifecycleResult = normalizedTeam.isUserTeam
                ? {
                    coach: {
                        ...normalizedTeam.headCoach!,
                        age: normalizedTeam.headCoach!.age + 1,
                        seasons: normalizedTeam.headCoach!.seasons + 1,
                        seasonWins: 0,
                        seasonLosses: 0,
                        lastTeam: normalizedTeam.name,
                    },
                }
                : evaluateCoachForNextSeason(
                    normalizedTeam,
                    nextSeason,
                    state.history.teamHistory,
                    prestigeLookup,
                    earliestRecordedSeason,
                );
            
            // If this is the user's team and we have a pending job offer, we need to handle the transition
            // The "old" user team becomes a CPU team (and gets a new CPU coach if needed)
            // The "new" user team will be set later
            if (normalizedTeam.isUserTeam && state.pendingJobOffer) {
                 // The user is leaving this team. 
                 // We need to ensure this team gets a CPU coach for next season.
                 // The evaluateCoachForNextSeason logic above might have just updated the USER coach's record on this team.
                 // But since the user is leaving, we actually want to generate a NEW CPU coach for this team
                 // or promote an assistant, etc. For simplicity, let's create a new CPU profile.
                 const newCpuCoach = createHeadCoachProfile(normalizedTeam.name, normalizedTeam.prestige);
                 return {
                     ...normalizedTeam,
                     isUserTeam: false, // No longer user team
                     headCoach: newCpuCoach,
                     record: { wins: 0, losses: 0 },
                     roster: normalizedTeam.roster.map(player => ({
                        ...player,
                        seasonStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 },
                    })),
                    initialProjectedRevenue: calculateTeamRevenue(normalizedTeam, null)
                 };
            }

            const { coach: refreshedCoach, retiredCoach } = lifecycleResult;
            if (retiredCoach) retiredThisOffseason.push(retiredCoach);
            const resetTeam = {
                ...normalizedTeam,
                headCoach: refreshedCoach,
                record: { wins: 0, losses: 0 },
                roster: normalizedTeam.roster.map(player => ({
                    ...player,
                    seasonStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 },
                })),
            };
            resetTeam.initialProjectedRevenue = calculateTeamRevenue(resetTeam, null);
            return resetTeam;
        });

        const { sponsors: updatedSponsors, updatedTeams: teamsWithFinalRevenue } = recalculateSponsorLandscape(resetTeamsWithProjectedRevenue, state.sponsors, state.tournament);
        const { updatedTeams: contractAdjustedTeams, summary: sponsorSummary } = updateSponsorContracts(teamsWithFinalRevenue, updatedSponsors);
        // After CPU teams accept offers, recalc landscape again so market share and school counts reflect changes
        const { sponsors: sponsorsPostDeals, updatedTeams: teamsPostDeals } = recalculateSponsorLandscape(contractAdjustedTeams, updatedSponsors, state.tournament);
        
        // Handle Job Switch / Team Assignment
        let finalTeams = teamsPostDeals;
        let newUserTeam: Team | null = null;
        let updatedCoach = { ...state.coach };
        updatedCoach.age = (updatedCoach.age || 29) + 1;

        if (state.pendingJobOffer) {
            const newTeamName = state.pendingJobOffer.teamName;
            // Use previousTeamName if set (from SELECT_JOB_OFFER), otherwise fall back to current userTeam name
            const oldTeamName = state.previousTeamName || state.userTeam?.name;
            
            // 1. Update Coach History for the finished season
            if (oldTeamName) {
                // If we switched teams mid-stream (via SELECT_JOB_OFFER), state.userTeam might be the NEW team.
                // We need to find the OLD team's record.
                // If previousTeamName is set, the old team is in state.allTeams (as a CPU team now).
                const oldTeam = state.allTeams.find(t => t.name === oldTeamName);
                const recordSource = oldTeam || state.userTeam; // Fallback to userTeam if oldTeam not found (shouldn't happen)

                if (recordSource) {
                    const seasonRecord: CoachSeasonRecord = {
                        season: state.season,
                        teamName: oldTeamName,
                        wins: recordSource.record.wins,
                        losses: recordSource.record.losses,
                        salary: state.coach.contract?.salary || 0,
                        achievements: [], // Populate if tracked
                        totalRevenue: recordSource.finances?.totalRevenue || 0,
                        projectedRevenue: recordSource.initialProjectedRevenue?.totalRevenue || 0,
                        operationalExpenses: recordSource.finances?.operationalExpenses || 0,
                    };
                    
                    updatedCoach.history = [...(updatedCoach.history || []), seasonRecord];

                    // Update Career Stops
                    const stops = [...(updatedCoach.careerStops || [])];
                    const lastStopIndex = stops.findIndex(s => s.teamName === oldTeamName && !s.endSeason);
                    if (lastStopIndex !== -1) {
                        stops[lastStopIndex] = { ...stops[lastStopIndex], endSeason: state.season };
                    } else {
                         // Fallback if not found (shouldn't happen if initialized correctly)
                         stops.push({ teamName: oldTeamName, startSeason: state.coach.contract?.yearsRemaining ? state.season - (5 - state.coach.contract.yearsRemaining) : state.season, endSeason: state.season });
                    }
                    
                    // Add new stop
                    stops.push({ teamName: newTeamName, startSeason: nextSeason });
                    updatedCoach.careerStops = stops;
                }
            }

            // 2. Update Contract
            const newTeam = state.allTeams.find(t => t.name === newTeamName);
            const contractLength = state.pendingJobOffer.length;
            const programExpectations = newTeam ? generateBoardExpectations(newTeam) : generateBoardExpectations(state.userTeam!);
            updatedCoach.contract = {
                teamName: newTeamName,
                salary: state.pendingJobOffer.salary,
                yearsRemaining: contractLength,
                totalYears: contractLength,
                startSeason: nextSeason,
                initialPrestige: state.pendingJobOffer.prestige,
                expectations: toContractBoardExpectations(programExpectations, contractLength),
                progress: { wins: 0, tournamentAppearances: 0, netIncome: 0 },
                yearPerformance: [],
            };

            // 3. Update Teams
            finalTeams = finalTeams.map(t => {
                if (t.name === newTeamName) {
                    // This is the new user team
                    const headCoachProfile: HeadCoachProfile = {
                        name: updatedCoach.name,
                        age: 45, // Placeholder or track in Coach state
                        almaMater: 'Unknown',
                        style: 'Balanced' as any,
                        reputation: updatedCoach.reputation,
                        seasons: updatedCoach.history.length,
                        careerWins: updatedCoach.history.reduce((acc, h) => acc + h.wins, 0),
                        careerLosses: updatedCoach.history.reduce((acc, h) => acc + h.losses, 0),
                        seasonWins: 0,
                        seasonLosses: 0,
                        startSeason: nextSeason,
                        careerStops: updatedCoach.careerStops,
                        history: updatedCoach.history,
                    };

                    return {
                        ...t,
                        isUserTeam: true,
                        headCoach: headCoachProfile,
                    };
                }
                return t;
            });
            
            newUserTeam = finalTeams.find(t => t.name === newTeamName) || null;

        } else {
             // Normal rollover, same team
             newUserTeam = finalTeams.find(t => t.isUserTeam) || null;
             // Ensure user coach profile on team is synced with global coach state if needed
        }

        // --- PROCESS NBA DRAFT & ROSTER TURNOVER ---
        const { updatedTeams: teamsAfterDraft, draftResults, undraftedFreeAgents, updatedNBATeams } = processDraft(
            finalTeams,
            state.season,
            state.internationalProspects,
            state.currentNBASimulation || undefined,
            state.nbaTeams || [],
            state.customDraftPickRules,
            state.mockDraftBoard
        );

        // Update Draft History
        const baseHistory = state.history || { teamHistory: {}, champions: [], nbaDrafts: [], userTeamRecords: [] };
        const newEntry: NBADraftHistoryEntry = {
            season: state.season,
            picks: draftResults,
            nbaChampion: '', // Placeholder as championship might not be decided yet or not relevant here
            draftOrder: []   // Placeholder
        };
        const updatedHistory = {
            ...baseHistory,
            nbaDrafts: upsertDraftHistoryEntry(baseHistory.nbaDrafts, newEntry),
        };

        // Merge Free Agents (Simple Deduplication by ID)
        const currentFreeAgents = state.nbaFreeAgents || [];
        const newFreeAgents: NBAFreeAgent[] = undraftedFreeAgents.map(p => ({
            player: p,
            reason: 'Undrafted',
            seasonAdded: state.season,
            weekAdded: 30
        }));
        const newFreeAgentIds = new Set(newFreeAgents.map(fa => fa.player.id));
        const mergedFreeAgents = [
            ...currentFreeAgents,
            ...newFreeAgents.filter(fa => !currentFreeAgents.some(existing => existing.player.id === fa.player.id))
        ];

        finalTeams = teamsAfterDraft;
        // ---------------------------------------------

        const staffAgedTeams = finalTeams.map(ageStaffContractsForTeam);
        
        // Re-fetch user team from the aged list to ensure we have the latest version
        newUserTeam = staffAgedTeams.find(t => t.name === (newUserTeam?.name || state.userTeam?.name)) || null;

        const nextSeasonYear = seasonToCalendarYear(nextSeason);
        const nextAnchors = buildSeasonAnchors(nextSeasonYear);
        const scheduleSettings = {
            regularSeasonGamesPerTeam: 31,
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
        const generatedSchedule = generateSeasonSchedule(nextSeasonYear, staffAgedTeams, scheduleSettings, nextAnchors);
        const newSchedule = generatedSchedule.legacySchedule;

        const scheduleIssues = validateSeasonSchedule(generatedSchedule, staffAgedTeams, scheduleSettings);
        if (scheduleIssues.length) {
            console.warn('Schedule validation issues:', scheduleIssues);
        }

        const newEventQueue = generatedSchedule.regularSeasonDates.flatMap((dateISO, idx) => {
            const week = idx + 1;
            return (generatedSchedule.scheduledEventIdsByDate[dateISO] || []).map(id => {
                const ev = generatedSchedule.scheduledGamesById[id];
                return {
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
                } as GameEvent;
            });
        });
        let newRecruits = Array.from({ length: 350 }, () => createRecruit());
        newRecruits = generateRecruitRelationships(newRecruits, staffAgedTeams);
        newRecruits = recomputeRecruitBoardRanks(newRecruits);
        newRecruits = runInitialRecruitingOffers(staffAgedTeams, newRecruits);
        newRecruits = applyPackageDealOfferMirroring(newRecruits, staffAgedTeams, newUserTeam.name, 1);
        const nextInternationalProspects = generateInternationalProspects();
        const nextNBASimulation = simulateNBASeason(state.season + 1);

        const combinedSummary = [...summary, ...sponsorSummary].filter(line => line && line.trim().length > 0);
        const resolvedSelectedNBATeam = syncSelectedNBATeamWithRoster(state.selectedNBATeam, updatedNBATeams);
        
        return {
            ...state,
            version: CURRENT_SAVE_VERSION,
            status: GameStatus.RECRUITING,
            season: nextSeason,
            seasonYear: nextSeasonYear,
            seasonAnchors: nextAnchors,
            // Removed duplicate status assignment
            userTeam: newUserTeam,
            allTeams: staffAgedTeams,
            schedule: newSchedule,
            eventQueue: newEventQueue,
            currentDate: nextAnchors.seasonStart,
            scheduledGamesById: generatedSchedule.scheduledGamesById,
            teamSchedulesById: generatedSchedule.teamSchedulesById,
            scheduledEventIdsByDate: generatedSchedule.scheduledEventIdsByDate,
            recruits: newRecruits,
            trainingSummary: combinedSummary,
            sponsors: sponsorsPostDeals,
            internationalProspects: nextInternationalProspects,
            currentNBASimulation: nextNBASimulation,
            nbaTeams: updatedNBATeams,
            selectedNBATeam: resolvedSelectedNBATeam,
            nbaFreeAgents: applyNBAFreeAgentRetirementRules(mergedFreeAgents),
            history: updatedHistory,
            pendingStaffRenewals: collectExpiredStaffRenewals(newUserTeam),
            // Reset weekly/seasonal state
            gameInSeason: 1,
            week: 1,
            signingPeriodDay: 1,
            signingDaySummary: [],
            seasonEndSummary: [],
            rosterRolledOver: false,
            offSeasonAdvanced: false,
            contactsMadeThisWeek: 0,
            trainingPointsUsedThisWeek: 0,
            lastSimResults: [],
            tournament: null,
            currentUserTeamAttendance: [],
            seasonRecapData: null,
            retiredCoaches: [...state.retiredCoaches, ...retiredThisOffseason],
            coach: updatedCoach,
            previousTeamName: undefined,
        };
    }
    case 'VIEW_GAME_LOG': {
        return { ...state, status: GameStatus.GAME_LOG, selectedGameLog: action.payload.gameLog, previousStatus: state.status };
    }
    case 'CLOSE_GAME_LOG': {
        return {
             ...state,
             status: state.previousStatus || GameStatus.DASHBOARD,
             selectedGameLog: null,
        };
    }
    case 'UPDATE_MOCK_DRAFT_PROJECTIONS': {
        return {
            ...state,
            mockDraftProjections: action.payload.picks,
            mockDraftProjectionDiffs: action.payload.diffs,
        };
    }
    case 'SET_MOCK_DRAFT_BOARD': {
        return {
            ...state,
            mockDraftBoard: action.payload.board,
        };
    }
    case 'PURCHASE_SKILL': {
        const { skillId } = action.payload;
        if (!state.userTeam || !state.coach) return state;
        
        const skill = COACH_SKILL_TREE.find(s => s.id === skillId);
        if (!skill) return state;

        const currentSkillLevel = state.coach.skills[skillId] || 0;
        if (currentSkillLevel >= skill.maxLevel) return state;

        if (state.coach.skillPoints < skill.cost) return state;

        return {
            ...state,
            coach: {
                ...state.coach,
                skillPoints: state.coach.skillPoints - skill.cost,
                skills: { ...state.coach.skills, [skillId]: currentSkillLevel + 1 },
            }
        };
    }
    case 'REQUEST_FUNDS': {
        if (!state.userTeam) return state;
        const { type, amount, reason } = action.payload;
        const { team: updatedTeam, approved, message } = requestFunds(state.userTeam, type, amount, reason);
        
        return {
            ...state,
            userTeam: updatedTeam,
            allTeams: state.allTeams.map(t => t.name === updatedTeam.name ? updatedTeam : t),
            toastMessage: message,
        };
    }

    default:
      return state;
  }
}


