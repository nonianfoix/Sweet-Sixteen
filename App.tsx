
import React, { useReducer, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { EconomyHub } from './EconomyHub';
import { RosterRetentionView } from './RosterRetentionView';
import { TransferPortalView } from './TransferPortalView';
import { NbaDraftLotteryView } from './NbaDraftLotteryView';

import { CoachSkillTree } from './CoachSkillTree';
import StaffView from './components/StaffView';
import SponsorModal from './components/SponsorModal';
import ContractOfferModal from './components/ContractOfferModal';

import PoachingOfferModal from './components/PoachingOfferModal';
import { CalendarWidget } from './components/CalendarWidget';
import { DashboardScheduleCalendar } from './components/DashboardScheduleCalendar';
import type {
  GameState,
  GameDate,
  GameAction,
  RotationPreference,
  Team,
  Player,
  Recruit,
  GameResult,
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
  Finances,
  GameAttendanceRecord,
  SeatMix,
  SeatSegmentKey,
  ScheduledEvent,
  EconomyEventFeedItem,
  SponsorQuest,
  SponsorQuestStatus,
  ContractGoal,
  Coach,
  CoachContract,
  CoachSeasonRecord,
  Staff,
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
	  OfferPitchType
	} from './types';
import { GameStatus, ScheduledEventStatus, EventType, GameEvent } from './types';
import RecruitOfferDetailsModal from './components/RecruitOfferDetailsModal';
import * as constants from './constants';
import type { SponsorName } from './types';
// FIX: Added missing function imports from gameService. This resolves multiple "has no exported member" errors.
import { initializeGameWorld, simulateGame, processInSeasonDevelopment, processRecruitingWeek, runSimulationForWeek, runDailySimulation, advanceToNewSeason, rollOverTeamsForNextSeason, createTournament, generateSchedule, createRecruit, processTraining, autoSetStarters, generateSigningAndProgressionSummaries, processDraft, fillRosterWithWalkOns, calculateRecruitInterestScore, calculateRecruitInterestBreakdown, getRecruitWhyBadges, estimateRecruitDistanceMilesToTeam, getRecruitRegionForState, buildRecruitOfferShortlist, calculateSponsorRevenueSnapshot, createSponsorFromName, recalculateSponsorLandscape,  calculateTeamRevenue, calculateCurrentSeasonEarnedRevenue, runInitialRecruitingOffers, calculateTeamNeeds, processEndOfSeasonPrestigeUpdates, randomBetween, generateContractOptions, generateJobOffers, updateCoachReputation, calculateCoachSalary, generateStaffCandidates, calculateOverall, generateFreeAgentStaff, getTrainingPoints, getContactPoints, calculateFanWillingness, seedProgramWealth, getWealthRecruitingBonus, getWealthTrainingBonus, generateInternationalProspects, simulateNBASeason, buildDraftProspectBoard, calculateNBACoachSalary, generateNBAJobOffers, createHeadCoachProfile, ensureArenaFacility, createNilCollectiveProfile, buildEventPlaybookCatalog, buildSponsorQuestDeck, calculateAttendance, clampZonePriceModifier, processTransferPortalOpen, processTransferPortalDay, clamp, processWeeklyFinances, processFacilityConstruction, degradeFacilities, generateSponsorOffers, hireStaff, updateSponsorContracts, updateConcessionPricing, updateMerchPricing, updateTicketPricing, setMerchInventoryStrategy, toggleDynamicPricing, setTravelSettings, scheduleEvent, cancelEvent, calculateBoardPressure, updateStaffPayroll, startCapitalProject, contributeToProject, initializeEconomy, requestFunds, generateBoardExpectations, toContractBoardExpectations, generatePoachingOffers, finalizeNBASeason, formatCurrency, updateTeamWithUserCoach, generateInitialNBAFreeAgents, processNBAWeeklyMoves, applyNBAFreeAgentRetirementRules, buildInitialDraftPickAssets, calculateRetentionProbability, seasonToCalendarYear, generateNBASchedule, buildSeasonAnchors, generateSeasonSchedule, validateSeasonSchedule, generateRecruitRelationships, recomputeRecruitBoardRanks, applyPackageDealOfferMirroring } from './services/gameService';
import { computeDraftPickOwnership, DraftSlotAssignment } from './services/draftUtils';
import { ensurePlayerNilProfile, buildNilNegotiationCandidates, evaluateNilOffer, calculateTeamNilBudget } from './services/nilService';
import { generateAlumni, updateAlumniRegistry } from './services/alumniService';
import { NBA_SALARIES } from './data/nbaSalaries';
import { NBA_DRAFT_PICK_RULES } from './data/nbaDraftPickSwaps';
import { getGameDateString, getGameDateStringFromEventQueue } from './services/calendarService';
import { SEASON_START_DATE, isSameISO, addDaysISO, jsDateToISODateUTC, formatISODate, gameDateToISODateUTC } from './services/dateService';

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

const getTeamAbbreviation = (teamName: string) => NBA_NAME_TO_ACRONYM[teamName] || teamName;

const NBA_LOGO_MODULES = import.meta.glob('./NBA Logos/*.png', { eager: true, as: 'url' }) as Record<string, string>;
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
const getTeamLogoUrl = (teamName: string) => {
    const slug = TEAM_NAME_LOGO_SLUG_OVERRIDES[teamName] || slugifyTeamName(teamName);
    return NBA_LOGO_BY_SLUG[slug];
};

const syncSelectedNBATeamWithRoster = (selected: Team | NBATeamSimulation | null, nbaTeams: Team[]): Team | NBATeamSimulation | null => {
    if (!selected) return null;
    const matched = nbaTeams.find(team => team.name === selected.name);
    return matched || selected;
};

const CURRENT_SAVE_VERSION = 6;

const MAX_TEAM_MINUTES = 200;

const upsertDraftHistoryEntry = (drafts: NBADraftHistoryEntry[] | undefined, entry: NBADraftHistoryEntry): NBADraftHistoryEntry[] => {
    const filtered = (drafts || []).filter(d => d.season !== entry.season);
    return [...filtered, entry];
};

const ROTATION_PREFERENCE_OPTIONS: { value: RotationPreference; label: string; description: string }[] = [
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

const TRAINING_STAT_LABELS: Record<keyof Player['stats'], string> = {
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

type PricePresetKey = 'fanFriendly' | 'balanced' | 'premium';
const PRICE_PRESETS: Record<PricePresetKey, { label: string; description: string; multipliers: Record<keyof Prices, number> }> = {
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

type InterestTier = { min: number; label: string; color: string };
const INTEREST_TIERS: InterestTier[] = [
    { min: 90, label: 'Locked', color: '#0B8043' },
    { min: 75, label: 'Warm', color: '#1B9AAA' },
    { min: 50, label: 'Open', color: '#F4B400' },
    { min: 30, label: 'Cool', color: '#F57C00' },
    { min: 0, label: 'Cold', color: '#B22222' },
];

const getInterestTier = (interest: number) => INTEREST_TIERS.find(tier => interest >= tier.min) || INTEREST_TIERS[INTEREST_TIERS.length - 1];
const formatPotentialValue = (value?: number) => (typeof value === 'number' ? Math.round(value) : '-');
type FinancialInvestmentType = 'recruitingCampaign' | 'trainingFacilities' | 'marketingPush';
const FINANCIAL_INVESTMENTS: Record<FinancialInvestmentType, { label: string; cost: number; description: string; affects: 'recruiting' | 'training' | 'marketing'; successMessage: string; impact: string }> = {
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

const getPositionDepthSummary = (roster: Player[]): Record<RosterPositions, number> => {
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

type StaffGroupKey = 'assistants' | 'trainers' | 'scouts';

const staffRoleLabels: Record<StaffGroupKey, Staff['role']> = {
    assistants: 'Assistant Coach',
    trainers: 'Trainer',
    scouts: 'Scout',
};

const formatPlayerHeight = (inches: number) => {
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

const calculateAvailableScholarships = (team: Team): number => {
  const seniors = team.roster.filter(p => p.year === 'Sr').length;
  const activeRoster = team.roster.length;
  return 15 - activeRoster + seniors;
};

// Display-only: during signing period we may show next year's class labels in UI.

const normalizeStaffContract = (member: Staff): Staff => {
    const contractLength = member.contractLength ?? randomBetween(2, 4);
    const yearsRemaining = member.yearsRemaining ?? contractLength;
    if (member.contractLength === contractLength && member.yearsRemaining === yearsRemaining) {
        return member;
    }
    return { ...member, contractLength, yearsRemaining };
};

const normalizeTeamStaffContracts = (team: Team): Team => {
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

const normalizePlayerSeasonStats = (player: Player): Player => {
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

const normalizeTeamData = (team: Team): Team => {
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

const ageStaffContractsForTeam = (team: Team): Team => {
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

        const normalizedTeams = loadedState.allTeams.map(ensureTeamHeadCoach);
        const normalizedUserTeam = loadedState.userTeam ? ensureTeamHeadCoach(loadedState.userTeam) : null;
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
            lastSimWeekKey: loadedState.lastSimWeekKey ?? null,
            customDraftPickRules: loadedState.customDraftPickRules ?? [],
        };
    }
    case 'CHANGE_VIEW': {
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
        let updatedWealth = { ...state.userTeam.wealth };
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
        const { updatedState, messages, shouldSimulateGameWeek } = runDailySimulation(state, true);
        let newState: GameState = { ...state, ...updatedState };
        const toastMessage = messages.length > 0 ? messages.join('\n') : null;

        if (shouldSimulateGameWeek) {
            newState = gameReducer({ ...newState, gameInSeason: shouldSimulateGameWeek }, { type: 'SIMULATE_WEEK' });
            return { ...newState, toastMessage: toastMessage ?? newState.toastMessage };
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
      if (!state.userTeam || state.gameInSeason > 31) return state;
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
                      interest: Math.max(0, Math.min(100, r.interest + interestChange)),
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
        currentUserTeamAttendance: [...state.currentUserTeamAttendance, ...newUserTeamAttendance],
        toastMessage: toastMessage || state.toastMessage,
        coach: updatedCoach,
        freeAgentStaff: newFreeAgentStaff,
        autoTrainingLog: updatedAutoTrainingLog,
        economyTelemetry: telemetryAfterWeek,
        poachingOffers: newPoachingOffer ? [...(state.poachingOffers || []), newPoachingOffer] : state.poachingOffers,
        nbaTransactions: state.nbaTransactions ? [...state.nbaTransactions, ...(nbaTransactions || [])] : (nbaTransactions || []),
        selectedNBATeam: resolvedSelectedNBATeam,
      };
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

        if (cons.donorMomentum && updatedUserTeam.wealth) {
            updatedUserTeam.wealth = {
                ...updatedUserTeam.wealth,
                donorMomentum: Math.max(-100, Math.min(100, updatedUserTeam.wealth.donorMomentum + cons.donorMomentum))
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

            const recapData = {
                record: `${userTeamFromAllTeams.record.wins}-${userTeamFromAllTeams.record.losses}`,
                tournamentResult: tournamentResult,
                signings: state.recruits.filter(r => r.verbalCommitment === userTeamFromAllTeams.name),
                drafted: userDraftedPlayers,
                prestigeChange: prestigeChanges.get(userTeamFromAllTeams.name) || 0,
                coachReputation: predictedReputation,
                coachReputationChange: reputationChange,
                totalRevenue: userTeamHistory.totalRevenue,
                projectedRevenue: userTeamHistory.projectedRevenue,
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
	          const newInterest = Math.min(100, Math.round(r.interest + boost));
	          const teamName = state.userTeam!.name;
	          const teamMomentum = { ...(r.teamMomentum || {}) };
	          teamMomentum[teamName] = clamp((teamMomentum[teamName] ?? 0) + 2, -20, 20);
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
		                const newInterest = Math.min(100, r.interest + boost);
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
	        const offeredRecruit = state.recruits.find(r => r.id === action.payload.recruitId);
	        const packageDealLinkedIds = new Set(
	            (offeredRecruit?.relationships || [])
	                .filter(rel => rel.sportLevel === 'HS' && (rel.notes || '').toLowerCase().includes('package deal'))
	                .map(rel => rel.personId)
	        );
	        return {
	          ...state,
	          userTeam: updatedUserTeam,
	          allTeams: state.allTeams.map(t => t.name === updatedUserTeam.name ? updatedUserTeam : t),
	          recruits: state.recruits.map(r => {
	            const teamName = state.userTeam!.name;
	            if (r.id === action.payload.recruitId) {
	                const teamMomentum = { ...(r.teamMomentum || {}) };
	                teamMomentum[teamName] = clamp((teamMomentum[teamName] ?? 0) + 5, -20, 20);
	                const offerHistory = [...(r.offerHistory || [])];
	                offerHistory.push({ teamName, week: state.week, pitchType, source: 'User' });
	                const coachabilityMultiplier = 0.9 + clamp((r.coachability ?? 60) / 250, 0, 0.6);
	                return { ...r, userHasOffered: true, interest: Math.min(100, r.interest + randomBetween(15, 25) * coachabilityMultiplier), teamMomentum, offerHistory, lastUserContactWeek: state.week };
	            }

	            if (packageDealLinkedIds.has(r.id) && !r.verbalCommitment && !r.declinedOffers?.includes(teamName)) {
	                const teamMomentum = { ...(r.teamMomentum || {}) };
	                teamMomentum[teamName] = clamp((teamMomentum[teamName] ?? 0) + 3, -20, 20);
	                const boosted = clamp(r.interest + 6, 0, 100);
	                const lastRecruitingNews = r.lastRecruitingNews || (offeredRecruit ? `${r.name} is considering a package deal with ${offeredRecruit.name}.` : r.lastRecruitingNews);
	                return boosted === r.interest ? { ...r, teamMomentum, lastRecruitingNews } : { ...r, interest: boosted, teamMomentum, lastRecruitingNews };
	            }

	            return r;
	          }),
	          contactsMadeThisWeek: state.contactsMadeThisWeek + offerCost,
	          toastMessage: `Scholarship offered (${pitchType}). (-$${financialCost})`,
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
	                    return { ...r, interest: Math.max(0, r.interest - interestPenalty), teamMomentum };
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
        const recapCpi = recapCpiEvaluation.boardExpectations.metrics
            ? {
                compositeScore: recapCpiEvaluation.boardExpectations.metrics.compositeScore,
                status: recapCpiEvaluation.boardExpectations.jobSecurityStatus,
                boardProfile: recapCpiEvaluation.boardExpectations.boardProfile,
                components: recapCpiEvaluation.boardExpectations.metrics.components,
            }
            : undefined;

        const recapData = {
            record: lastSeasonRecord ? `${lastSeasonRecord.wins}-${lastSeasonRecord.losses}` : 'N/A',
            tournamentResult: lastSeasonRecord?.tournamentResult || 'N/A',
            signings: state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name),
            drafted: state.draftResults.filter(d => d.originalTeam === state.userTeam!.name),
            prestigeChange: prestigeChanges.get(state.userTeam.name) || 0,
            coachReputation: predictedReputation,
            coachReputationChange: reputationChange,
            totalRevenue: lastSeasonRecord?.totalRevenue || 0,
            projectedRevenue: lastSeasonRecord?.projectedRevenue || 0,
            cpi: recapCpi,
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
        const { messages, shouldSimulateGameWeek } = runDailySimulation(state, true);
        if (!shouldSimulateGameWeek) {
            return { ...state, toastMessage: messages.length > 0 ? messages[0] : state.toastMessage };
        }
        const simulated = gameReducer({ ...state, gameInSeason: shouldSimulateGameWeek }, { type: 'SIMULATE_WEEK' });
        return { ...simulated, toastMessage: 'Simulated game.' };
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
        newRecruits = generateRecruitRelationships(newRecruits);
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

const GameLogView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    if (!state.selectedGameLog) return null;

    const { homeTeam, awayTeam, homeScore, awayScore, homeTeamStats, awayTeamStats, playByPlay } = state.selectedGameLog;

    const allPlayersStats = [...homeTeamStats, ...awayTeamStats];

    const formatStat = (stat: number) => stat.toFixed(0);
    const calculateTotals = (teamStats: typeof homeTeamStats) => teamStats.reduce((totals, ps) => ({
        points: totals.points + ps.stats.points,
        rebounds: totals.rebounds + ps.stats.rebounds,
        assists: totals.assists + ps.stats.assists,
        fieldGoalsMade: totals.fieldGoalsMade + ps.stats.fieldGoalsMade,
        fieldGoalsAttempted: totals.fieldGoalsAttempted + ps.stats.fieldGoalsAttempted,
        threePointersMade: totals.threePointersMade + ps.stats.threePointersMade,
        threePointersAttempted: totals.threePointersAttempted + ps.stats.threePointersAttempted,
        freeThrowsMade: totals.freeThrowsMade + ps.stats.freeThrowsMade,
        freeThrowsAttempted: totals.freeThrowsAttempted + ps.stats.freeThrowsAttempted,
        turnovers: totals.turnovers + ps.stats.turnovers,
        minutes: totals.minutes + (ps.stats.minutes ?? 0),
    }), {
        points: 0,
        rebounds: 0,
        assists: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        turnovers: 0,
        minutes: 0,
    });

    const homeTotals = calculateTotals(homeTeamStats);
    const awayTotals = calculateTotals(awayTeamStats);

    return (
        <div style={{ padding: '10px', fontSize: '0.7rem' }}>
            <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.DASHBOARD })} style={styles.button}>Back to Dashboard</button>
            <Subheading color={colors.primary}>Game Log: {awayTeam} @ {homeTeam}</Subheading>
            <p style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px' }}>Final Score: {awayTeam} {awayScore} - {homeScore} {homeTeam}</p>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div style={{ width: '48%' }}>
                    <Subheading color={colors.primary}>{homeTeam} Stats</Subheading>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>PTS</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>REB</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>AST</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MIN</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>FG</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>3PT</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>FT</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>TO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {homeTeamStats.map(ps => (
                                    <tr key={ps.playerId}>
                                        <td style={styles.td}>{ps.name} ({ps.pos})</td>
                                        <td style={styles.td}>{formatStat(ps.stats.points)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.rebounds)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.assists)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.minutes ?? 0)}</td>
                                        <td style={styles.td}>{ps.stats.fieldGoalsMade}-{ps.stats.fieldGoalsAttempted}</td>
                                        <td style={styles.td}>{ps.stats.threePointersMade}-{ps.stats.threePointersAttempted}</td>
                                        <td style={styles.td}>{ps.stats.freeThrowsMade}-{ps.stats.freeThrowsAttempted}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.turnovers)}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 'bold', borderTop: `2px solid ${colors.primary}` }}>
                                    <td style={styles.td}>Totals</td>
                                    <td style={styles.td}>{formatStat(homeTotals.points)}</td>
                                    <td style={styles.td}>{formatStat(homeTotals.rebounds)}</td>
                                    <td style={styles.td}>{formatStat(homeTotals.assists)}</td>
                                    <td style={styles.td}>{formatStat(homeTotals.minutes)}</td>
                                    <td style={styles.td}>{homeTotals.fieldGoalsMade}-{homeTotals.fieldGoalsAttempted}</td>
                                    <td style={styles.td}>{homeTotals.threePointersMade}-{homeTotals.threePointersAttempted}</td>
                                    <td style={styles.td}>{homeTotals.freeThrowsMade}-{homeTotals.freeThrowsAttempted}</td>
                                    <td style={styles.td}>{formatStat(homeTotals.turnovers)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', margin: 0 }}>Rotation Preference:</label>
                    <select
                        value={state.rotationPreference}
                        onChange={(e) => dispatch({ type: 'SET_ROTATION_PREFERENCE', payload: e.target.value as RotationPreference })}
                        style={{ ...styles.select, minWidth: '160px' }}
                    >
                        {ROTATION_PREFERENCE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value} title={option.description}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', margin: 0 }}>Rotation Preference:</label>
                    <select
                        value={state.rotationPreference}
                        onChange={(e) => dispatch({ type: 'SET_ROTATION_PREFERENCE', payload: e.target.value as RotationPreference })}
                        style={{ ...styles.select, minWidth: '160px' }}
                    >
                        {ROTATION_PREFERENCE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value} title={option.description}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ width: '48%' }}>
                    <Subheading color={colors.primary}>{awayTeam} Stats</Subheading>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>PTS</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>REB</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>AST</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MIN</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>FG</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>3PT</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>FT</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>TO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {awayTeamStats.map(ps => (
                                    <tr key={ps.playerId}>
                                        <td style={styles.td}>{ps.name} ({ps.pos})</td>
                                        <td style={styles.td}>{formatStat(ps.stats.points)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.rebounds)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.assists)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.minutes ?? 0)}</td>
                                        <td style={styles.td}>{ps.stats.fieldGoalsMade}-{ps.stats.fieldGoalsAttempted}</td>
                                        <td style={styles.td}>{ps.stats.threePointersMade}-{ps.stats.threePointersAttempted}</td>
                                        <td style={styles.td}>{ps.stats.freeThrowsMade}-{ps.stats.freeThrowsAttempted}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.turnovers)}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 'bold', borderTop: `2px solid ${colors.primary}` }}>
                                    <td style={styles.td}>Totals</td>
                                    <td style={styles.td}>{formatStat(awayTotals.points)}</td>
                                    <td style={styles.td}>{formatStat(awayTotals.rebounds)}</td>
                                    <td style={styles.td}>{formatStat(awayTotals.assists)}</td>
                                    <td style={styles.td}>{formatStat(awayTotals.minutes)}</td>
                                    <td style={styles.td}>{awayTotals.fieldGoalsMade}-{awayTotals.fieldGoalsAttempted}</td>
                                    <td style={styles.td}>{awayTotals.threePointersMade}-{awayTotals.threePointersAttempted}</td>
                                    <td style={styles.td}>{awayTotals.freeThrowsMade}-{awayTotals.freeThrowsAttempted}</td>
                                    <td style={styles.td}>{formatStat(awayTotals.turnovers)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Subheading color={colors.primary}>Play-by-Play</Subheading>
            <div style={{ maxHeight: '300px', overflowY: 'scroll', border: `1px solid ${colors.primary}`, padding: '10px' }}>
                {playByPlay.map((event, index) => (
                    <p key={index} style={{ marginBottom: '3px' }}>{event.text}</p>
                ))}
            </div>
        </div>
    );
};

// --- Components ---

const InSeasonTrainingView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    if (!state.userTeam) return null;

    const availablePoints = getTrainingPoints(state.userTeam) - (state.trainingPointsUsedThisWeek || 0);
    const trainingCost = 3;
    const canTrain = availablePoints >= trainingCost;
    const autoTrainingEnabled = state.autoTrainingEnabled;

    const handleTrain = (playerId: string, stat: keyof Player['stats']) => {
        dispatch({ type: 'TRAIN_PLAYER_STAT', payload: { playerId, stat } });
    };

    const toggleAutoTraining = () => {
        dispatch({ type: 'SET_AUTO_TRAINING_ENABLED', payload: !autoTrainingEnabled });
    };
    
    const statKeys: (keyof Player['stats'])[] = ['insideScoring', 'outsideScoring', 'playmaking', 'perimeterDefense', 'insideDefense', 'rebounding', 'stamina'];

    return (
        <div>
            <Subheading color={colors.primary}>In-Season Training</Subheading>
            <p style={{ fontSize: '0.7rem', marginBottom: '10px', color: availablePoints < trainingCost ? 'red' : 'inherit' }}>
                Available Points This Week: <strong>{availablePoints} / {getTrainingPoints(state.userTeam)}</strong>
            </p>
            <p style={{ fontSize: '0.7rem', marginBottom: '20px' }}>
                Spend training points to improve player stats. Each +1 boost costs {trainingCost} points. Points reset after each game.
            </p>
            <div style={styles.autoTrainingToggleRow}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem' }}>
                    <input type="checkbox" checked={autoTrainingEnabled} onChange={toggleAutoTraining} />
                    Enable automatic training after each sim
                </label>
                <span style={{ fontSize: '0.6rem', color: autoTrainingEnabled ? 'green' : '#B22222' }}>
                    {autoTrainingEnabled ? 'Idle points will boost targets automatically.' : 'All training must be triggered manually.'}
                </span>
            </div>
            <TrainingSummaryCards
                availablePoints={availablePoints}
                trainingCost={trainingCost}
                roster={state.userTeam.roster}
                autoTrainingEnabled={autoTrainingEnabled}
                trainingPointsUsed={state.trainingPointsUsedThisWeek}
            />
            <div style={styles.tableContainer}>
                <table style={{...styles.table, fontSize: '0.6rem', minWidth: '800px'}}>
                    <thead>
                        <tr>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Player</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Yr</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Pos</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Ht</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>OVR</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>POT</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>In. Scr</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Out. Scr</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Plm.</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Per. D</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>In. D</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Reb.</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Stam.</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.userTeam.roster.slice().sort((a,b) => b.overall - a.overall).map(player => (
                            <tr key={player.id}>
                                <td style={{ 
                                    ...styles.td, 
                                    color: player.starterPosition ? '#B22222' : styles.td.color || '#000000',
                                    fontWeight: player.starterPosition ? 'bold' : 'normal'
                                }}>
                                    {player.name}
                                </td>
                                <td style={styles.td}>{player.year}</td>
                                <td style={styles.td}>{player.position}{player.secondaryPosition ? `/${player.secondaryPosition}` : ''}</td>
                                <td style={styles.td}>{formatPlayerHeight(player.height)}</td>
                                <td style={styles.td}>{player.overall}</td>
                                <td style={styles.td}>{formatPotentialValue(player.potential)}</td>
                                {statKeys.map(stat => (
                                    <td key={stat} style={styles.td}>
                                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                            <span>{Math.round(player.stats[stat])}</span>
                                            <button 
                                                onClick={() => handleTrain(player.id, stat)}
                                                disabled={!canTrain || player.stats[stat] >= 99}
                                                style={{...styles.smallButton, padding: '2px 4px', lineHeight: 1}}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                ))}
                                <td style={styles.td}>
                                    <button 
                                        style={{ ...styles.smallButton, backgroundColor: player.isTargeted ? '#4CAF50' : '#C0C0C0' }}
                                        onClick={() => dispatch({ type: 'TOGGLE_PLAYER_TARGET', payload: { playerId: player.id } })}
                                    >
                                        {player.isTargeted ? 'Targeted' : 'Target'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={styles.autoTrainingLogContainer}>
                <Subheading color={colors.primary}>Auto-Training Log</Subheading>
                {state.autoTrainingLog.length ? (
                    <ul style={styles.autoTrainingLogList}>
                        {state.autoTrainingLog.slice(0, 8).map((entry, index) => (
                            <li key={`${entry}-${index}`} style={{ marginBottom: '4px' }}>{entry}</li>
                        ))}
                    </ul>
                ) : (
                    <p style={styles.autoTrainingLogEmpty}>No automatic training entries yet.</p>
                )}
            </div>
        </div>
    );
};

const TrainingSummaryCards = ({ availablePoints, trainingCost, roster, autoTrainingEnabled, trainingPointsUsed }: { availablePoints: number; trainingCost: number; roster: Player[]; autoTrainingEnabled: boolean; trainingPointsUsed: number }) => {
    const sessionsLeft = Math.max(0, Math.floor(availablePoints / trainingCost));
    const targetedPlayers = roster.filter(p => p.isTargeted);
    const avgTargetGap = targetedPlayers.length
        ? (targetedPlayers.reduce((sum, player) => sum + Math.max(0, player.potential - player.overall), 0) / targetedPlayers.length).toFixed(1)
        : '0.0';
    const highCeilingPlayers = roster.filter(p => p.potential - p.overall >= 10).length;
    const lowStaminaPlayers = roster.filter(p => (p.stats.stamina ?? 70) < 60).length;

    return (
        <div style={styles.trainingSummaryGrid}>
            <div style={styles.trainingSummaryCard}>
                <span>Sessions Left</span>
                <strong style={{ color: sessionsLeft > 0 ? 'green' : '#B22222' }}>{sessionsLeft}</strong>
                <p style={styles.trainingSummaryMeta}>Each +1 boost costs {trainingCost} pts.</p>
            </div>
            <div style={styles.trainingSummaryCard}>
                <span>Points Spent</span>
                <strong>{trainingPointsUsed}</strong>
                <p style={styles.trainingSummaryMeta}>{autoTrainingEnabled ? 'Auto-spend enabled' : 'Manual only'}</p>
            </div>
            <div style={styles.trainingSummaryCard}>
                <span>Targeted Players</span>
                <strong>{targetedPlayers.length}</strong>
                <p style={styles.trainingSummaryMeta}>Avg gap: {avgTargetGap} OVR</p>
            </div>
            <div style={styles.trainingSummaryCard}>
                <span>High-Ceiling Prospects</span>
                <strong>{highCeilingPlayers}</strong>
                <p style={styles.trainingSummaryMeta}>Need 10+ OVR growth</p>
            </div>
            <div style={styles.trainingSummaryCard}>
                <span>Low Stamina Alerts</span>
                <strong style={{ color: lowStaminaPlayers ? '#B22222' : 'inherit' }}>{lowStaminaPlayers}</strong>
                <p style={styles.trainingSummaryMeta}>Consider conditioning work</p>
            </div>
        </div>
    );
};


const TeamSelection = ({ dispatch }: { dispatch: React.Dispatch<GameAction> }) => {
    const handleRandomTeam = () => {
        const weightedSchools = SCHOOLS.map(school => {
            const prestigeRange = SCHOOL_PRESTIGE_RANGES[school] || { min: 55, max: 75 };
            const averagePrestige = (prestigeRange.min + prestigeRange.max) / 2;
            const weight = Math.max(1, Math.round(120 - averagePrestige));
            return { school, weight };
        });
        const totalWeight = weightedSchools.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const entry of weightedSchools) {
            roll -= entry.weight;
            if (roll <= 0) {
                dispatch({ type: 'SELECT_TEAM', payload: entry.school });
                return;
            }
        }
        dispatch({ type: 'SELECT_TEAM', payload: weightedSchools[weightedSchools.length - 1].school });
    };

    return (
        <div style={styles.teamSelectionContainer}>
            <h1 style={styles.title}>Sweet Sixteen</h1>
            <button 
                style={{ ...styles.button, marginBottom: '20px', backgroundColor: '#FFC727', borderColor: '#FFFFFF #808080 #808080 #FFFFFF' }} 
                onClick={handleRandomTeam}
            >
                Select Random Team
            </button>
            <div style={styles.grid}>
                {SCHOOLS.slice().sort((a, b) => a.localeCompare(b)).map(school => (
                    <button key={school} style={styles.button} onClick={() => dispatch({ type: 'SELECT_TEAM', payload: school })}>
                        {school}
                    </button>
                ))}
            </div>
        </div>
    );
};

const Toast = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return <div style={styles.toast}>{message}</div>;
};


const SponsorDisplay = ({ sponsor, yearsRemaining, onClick }: { sponsor: Sponsor, yearsRemaining: number, onClick?: () => void }) => {
    const slogan = SPONSOR_SLOGANS[sponsor.name];
    const clickable = typeof onClick === 'function';
    return (
        <div
            style={{ ...styles.sponsorDisplay, cursor: clickable ? 'pointer' : 'default' }}
            onClick={onClick}
            role={clickable ? 'button' : undefined}
            aria-label={clickable ? 'Open sponsor management' : undefined}
        >
            <span>{sponsor.name.toUpperCase()} ({yearsRemaining} YRS LEFT)</span>
            {slogan && <span style={styles.sponsorSlogan}>{slogan}</span>}
        </div>
    );
};

const schoolNameToSlug = (name: string): string => {
  if (!name) return '';
    const specialCases: { [key: string]: string } = {
      "Albany": "albany-ny",
      "St. John's": "st-johns-ny",
      "Miami (OH)": "miami-oh",
      "Miami": "miami-fl",
    "Cal State Fullerton": "cal-st-fullerton",
    "Cal State Northridge": "cal-st-northridge",
    "Saint Mary's": "saint-marys",
    "NC State": "nc-state",
    "USC": "southern-cal",
    "Saint Joseph's": "saint-josephs",
    "Saint Peter's": "st-peters",

    "St. Bonaventure": "st-bonaventure",
    "Alabama A&M": "alabama-am",
    "Alabama State": "alabama-st",
    "Alcorn State": "alcorn",
    "Arkansas-Pine Bluff": "ark-pine-bluff",
    "Arizona State": "arizona-st",
    "Bethune-Cookman": "bethune-cookman",
    "Boston University": "boston-u",
    "Coppin State": "coppin-st",
    "Delaware State": "delaware-st",
    "Coastal Carolina": "coastal-caro",
    "Florida Atlantic": "fla-atlantic",
    "Florida A&M": "florida-am",
    "Grambling State": "grambling",
    "Jackson State": "jackson-st",
    "Mississippi Valley State": "mississippi-val",
    "Mississippi State": "mississippi-st",  
    "Morgan State": "morgan-st",
    "Norfolk State": "norfolk-st",
    "North Carolina A&T": "nc-at",
    "North Carolina Central": "nc-central",
    "Prairie View A&M": "prairie-view",
    "Penn State": "penn-st",
    "South Carolina State": "south-carolina-st",
    "South Alabama": "south-ala",

    "Tennessee State": "tennessee-st",
    "Texas Southern": "texas-southern",
    "Appalachian State": "appalachian-st",
    "Arkansas State": "arkansas-st",
    "Ball State": "ball-st",
    "Boise State": "boise-st",
    "Bowling Green": "bowling-green",
    "Central Michigan": "central-mich",
    "Charleston WV": "charleston-wv",
    "Cleveland State": "cleveland-st",
    "Colorado State": "colorado-st",
    "East Carolina": "east-carolina",
    "Eastern Kentucky": "Eastern-KY",
    "Eastern Michigan": "eastern-mich",
    "Fresno State": "fresno-st",
    "Georgia State": "georgia-st",
    "Idaho State": "idaho-st",
    "Illinois State": "illinois-st",
    "Indiana State": "indiana-st",
    "Iowa": "iowa",
    "Iowa State": "iowa-st",
    "Kansas State": "kansas-st",
    "Kent State": "kent-st",
    "Long Beach State": "long-beach-st",
    "McNeese State": "mcneese-st",
    "Michigan State": "michigan-st",
    "Middle Tennessee": "middle-tenn",
    "Montana State": "montana-st",
    "Morehead State": "morehead-st",
    "Murray State": "murray-st",
    "New Mexico State": "new-mexico-st",
    "Nicholls State": "nicholls-st",
    "North Dakota State": "north-dakota-st",
    "Northern Arizona": "northern-ariz",
    "Northern Colorado": "northern-colo",
    "Northern Illinois": "northern-ill",
    "Northern Iowa": "uni",
    "Northwestern State": "northwestern-st",
    "Oklahoma State": "oklahoma-st",
    "Omaha": "neb-omaha",
    "Oregon State": "oregon-st",
    "Portland State": "portland-st",
    "Sacramento State": "sacramento-st",
    "Sam Houston State": "sam-houston-st",
    "San Diego State": "san-diego-st",
    "San Jose State": "san-jose-st",
    "South Dakota State": "south-dakota-st",
    "Southeast Missouri State": "southeast-mo-st",
    "Southern Illinois":"southern-ill",
    "Southern Miss": "southern-miss",
    "Southern Utah": "southern-utah",
    "Southern": "southern-u",
    "Stephen F. Austin": "stephen-f-austin",
    "Texas State": "texas-st",
    "UIC": "ill-chicago",
    "Utah State": "utah-st",
    "Washington State": "washington-st",
    "Wichita State": "wichita-st",
    "Wright State": "wright-st",
    "Youngstown State": "youngstown-st",
    "Florida State": "florida-st",
    "Georgia Southern": "ga-southern",
    "Ohio State": "ohio-st",
    "USC": "southern-california",
    "Saint Mary's": "st-marys-ca",
    "NC State": "north-carolina-st",
    "South Florida": "south-fla",
    "Detroit Mercy": "detroit",
    "Maryland Eastern Shore": "umes.png",
  };

  if (specialCases[name]) {
    return specialCases[name].includes('.') ? specialCases[name] : `${specialCases[name]}.svg`;
  }

  return `${name.toLowerCase().replace(/ /g, '-').replace(/[&'.()]/g, '')}.svg`;
};

const Header = ({ state, dispatch, colors, onHeaderClick, onSponsorClick, onCoachClick }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors, onHeaderClick: () => void, onSponsorClick: () => void, onCoachClick: () => void }) => {
    if (!state.userTeam) return null;
    const formatSeason = (season: number) => `${2024 + season}-${(2025 + season) % 100}`;

    const powerRankings = useMemo(() =>
        [...state.allTeams]
        .map(t => ({ ...t, power: t.record.wins * 2 + t.prestige / 10 }))
        .sort((a, b) => b.power - a.power),
        [state.allTeams]
    );

    const getRankOrSeedInfo = () => {
        if (state.gameInSeason > 31 && state.tournament && state.userTeam) {
            const allMatchups = [
                ...state.tournament.firstFour,
                ...Object.values(state.tournament.regions).flatMap(r => r.flat())
            ];
            const userMatchup = allMatchups.find(m => m.homeTeam === state.userTeam!.name || m.awayTeam === state.userTeam!.name);
            if (userMatchup) {
                const seed = userMatchup.homeTeam === state.userTeam.name ? userMatchup.homeSeed : userMatchup.awaySeed;
                return `(#${seed} ${state.userTeam.conference})`;
            }
             return `(${state.userTeam.conference})`;
        }
        const rank = powerRankings.findIndex(t => t.name === state.userTeam!.name) + 1;
        return rank ? `(#${rank})` : '';
    };

    const handleLogoClick = () => {
        if (!state.userTeam) return;
        dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.NIL_NEGOTIATION });
    };

    const conferenceLabel = state.userTeam?.conference || 'Independent';

    return (
        <header style={{ ...styles.header, backgroundColor: colors.primary, color: colors.text, borderBottom: `4px solid ${colors.secondary}` }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{fontSize: '0.8rem', cursor: 'pointer'}} onClick={onHeaderClick} role="button" aria-label="Open settings">
                    <h2 style={{fontSize: '1.2rem', marginBottom: '5px'}}>
                      {state.userTeam.name} {getRankOrSeedInfo()}
                    </h2>
                    <p>Record: {state.userTeam.record.wins}-{state.userTeam.record.losses} | Prestige: {state.userTeam.prestige}</p>
                    <p style={{ marginTop: '2px', fontSize: '0.7rem', color: colors.text }}>
                        Conference: {conferenceLabel}
                    </p>
                </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                {state.userTeam.sponsor && <SponsorDisplay sponsor={state.userTeam.sponsor} yearsRemaining={state.userTeam.sponsorContractYearsRemaining} onClick={onSponsorClick} />}
                {state.coach?.contract && <button onClick={onCoachClick} style={styles.coachButton}>Coach</button>}
            </div>
            <div style={styles.logoBetween}>
                <button
                    type="button"
                    style={styles.logoButton}
                    onClick={handleLogoClick}
                    title="Open NIL Retention Hub"
                >
                    <img
                        src={`school logos/${schoolNameToSlug(state.userTeam.name)}`}
                        alt={`${state.userTeam.name} logo`}
                        style={styles.logoImage}
                    />
                </button>
            </div>
            <div style={styles.headerRight}>
                <div style={styles.seasonInfo}>
                    <CalendarWidget date={state.currentDate || SEASON_START_DATE} season={state.season} />
                </div>
            </div>
        </header>
    );
};

const NavAndActions = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const [isSimulatingSeason, setIsSimulatingSeason] = useState(false);
    const [isSimulatingTournament, setIsSimulatingTournament] = useState(false);
    const [isSimulatingToGame, setIsSimulatingToGame] = useState(false);

    // Refs for simulation state to avoid closure staleness in timeouts
    const isSimulatingSeasonRef = useRef(isSimulatingSeason);
    const isSimulatingToGameRef = useRef(isSimulatingToGame);
    const stateRef = useRef(state);
    stateRef.current = state;

    useEffect(() => {
        isSimulatingSeasonRef.current = isSimulatingSeason;
        isSimulatingToGameRef.current = isSimulatingToGame;
    }, [isSimulatingSeason, isSimulatingToGame]);

    useEffect(() => {
        // Reset simulation state when season changes
        setIsSimulatingSeason(false);
        setIsSimulatingTournament(false);
        setIsSimulatingToGame(false);
    }, [state.season]); 

    const seasonTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isSimulatingSeason) { 
            const runSeasonSim = () => {
                if (!isSimulatingSeasonRef.current) return; 
                
                const prevDate = stateRef.current.currentDate;

                // Stop at end of regular season
                if (stateRef.current.gameInSeason > 31) {
                    setIsSimulatingSeason(false);
                    return;
                }
                
                const hasUserGameToday = !!stateRef.current.userTeam && !!(stateRef.current.eventQueue || []).some(e =>
                    e.type === EventType.GAME &&
                    !e.processed &&
                    stateRef.current.currentDate &&
                    isSameISO(e.date, stateRef.current.currentDate) &&
                    (e.payload?.homeTeam === stateRef.current.userTeam?.name || e.payload?.awayTeam === stateRef.current.userTeam?.name)
                );

                dispatch({ type: hasUserGameToday ? 'SIMULATE_USER_GAME' : 'SIMULATE_DAY' });
                
                seasonTimerRef.current = setTimeout(() => {
                    // Check if date advanced. If not, we triggered a stop (e.g. user game).
                    if (isSameISO(prevDate, stateRef.current.currentDate)) {
                         setIsSimulatingSeason(false);
                    } else {
                         runSeasonSim();
                    }
                }, 50);
            };
            runSeasonSim();
        }

        return () => { 
            if (seasonTimerRef.current) {
                clearTimeout(seasonTimerRef.current);
                seasonTimerRef.current = null;
            }
        };
    }, [isSimulatingSeason]); // Only depends on toggle

    
    // Ref to detect when game advances for SimToNextGame
    const initialGameRef = useRef(state.gameInSeason);

    useEffect(() => {
        if (isSimulatingToGame) {
             const runGameSim = () => {
                if (!isSimulatingToGameRef.current) return;

                const hasUserGameToday = !!stateRef.current.userTeam && !!(stateRef.current.eventQueue || []).some(e =>
                    e.type === EventType.GAME &&
                    !e.processed &&
                    stateRef.current.currentDate &&
                    isSameISO(e.date, stateRef.current.currentDate) &&
                    (e.payload?.homeTeam === stateRef.current.userTeam?.name || e.payload?.awayTeam === stateRef.current.userTeam?.name)
                );

                if (hasUserGameToday) {
                    setIsSimulatingToGame(false);
                    return;
                }

                 const prevDate = stateRef.current.currentDate;

                 // Stop if season over
                 if (stateRef.current.gameInSeason > 31) {
                     setIsSimulatingToGame(false);
                     return;
                 }

                 dispatch({ type: 'SIMULATE_DAY' });
                 semesterTimerRef.current = setTimeout(() => {
                     // Stop if date didn't advance (user game)
                     if (isSameISO(prevDate, stateRef.current.currentDate)) {
                         setIsSimulatingToGame(false);
                     } else {
                         runGameSim();
                     }
                 }, 50);
             };
             
             runGameSim();
             
             return () => {
                if (semesterTimerRef.current) clearTimeout(semesterTimerRef.current);
             }
        } else {
             initialGameRef.current = state.gameInSeason;
        }
    }, [isSimulatingToGame]); // Only depends on toggle
    
    // I need to define semesterTimerRef or similar.
    // Wait, the original code used a local `timer` var in useEffect. 
    // Using a ref is better for robust cleanup.
    const semesterTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleSimulate = () => {
        dispatch({ type: 'SIMULATE_DAY' });
    };

    const handleSimToNextGame = () => {
        setIsSimulatingToGame(true);
    };

    const getNavItems = (state: GameState): {label: string, status: GameStatus}[] => {
        const baseItems: {label: string, status: GameStatus}[] = [
            {label: 'Dashboard', status: GameStatus.DASHBOARD},
            {label: 'Roster', status: GameStatus.ROSTER},
            {label: 'Finances', status: GameStatus.FINANCES},
        ];
        
        if (state.userTeam) {
            baseItems.push({label: 'Staff', status: GameStatus.STAFF});
        }

        if (state.gameInSeason > 31 || state.status === GameStatus.TOURNAMENT) {
            baseItems.push({label: 'Tournament', status: GameStatus.TOURNAMENT});
        } else {
             baseItems.push({label: 'Schedule', status: GameStatus.SCHEDULE});
        }
        
        if (state.status === GameStatus.ROSTER_FILLING || (state.signingPeriodDay > 7 && state.gameInSeason > 31)) {
            baseItems.push({label: 'Finalize Signings', status: GameStatus.ROSTER_FILLING});
        }

        baseItems.push(
            {label: 'Standings', status: GameStatus.STANDINGS}
        );

        if (state.gameInSeason <= 31) {
            baseItems.push({label: 'Training', status: GameStatus.IN_SEASON_TRAINING});
        }

        baseItems.push(
            {label: 'Recruiting', status: GameStatus.RECRUITING},
            {label: 'History', status: GameStatus.HISTORY}
        );

        if (state.portalPlayers && state.portalPlayers.length > 0 && !state.transferPortalComplete) {
            baseItems.push({label: 'Transfer Portal', status: GameStatus.TRANSFER_PORTAL});
        }
        return baseItems;
    }
    
    const contactPointCap = state.userTeam ? getContactPoints(state.userTeam) : 100;
    const trainingPointCap = state.userTeam ? getTrainingPoints(state.userTeam) : 150;

    const navItems = getNavItems(state);

    const getAdvanceActions = () => {
        const actions = [];
        let disabled = false;

        // Tournament (prioritize explicit tournament view even if gameInSeason is stale)
        if (state.status === GameStatus.TOURNAMENT && state.tournament && !state.tournament.champion) {
            actions.push({ label: 'Simulate Round', onClick: () => dispatch({ type: 'SIMULATE_TOURNAMENT_ROUND' }) });
        }
        // Regular Season
        else if (state.gameInSeason <= 31) {
            actions.push({ label: 'Simulate Day', onClick: handleSimulate });
            actions.push({ label: 'Sim to Next Game', onClick: handleSimToNextGame });
        }
        // Tournament (fallback)
        else if (state.tournament && !state.tournament.champion) {
            actions.push({ label: 'Simulate Round', onClick: () => dispatch({ type: 'SIMULATE_TOURNAMENT_ROUND' }) });
        }
        // Signing Period
        else if (state.signingPeriodDay <= 7) {
            actions.push({ label: `Sim Day ${state.signingPeriodDay}`, onClick: () => dispatch({ type: 'SIMULATE_SIGNING_DAY' }) });
        }
         // Post-Signing Flow
        else if (state.signingPeriodDay > 7) {
            if (state.status === GameStatus.ROSTER_FILLING) {
                 const rosterSize = state.userTeam?.roster.length ?? 0;
                 disabled = rosterSize < 13 || rosterSize > 15;
                 actions.push({ label: 'Proceed to Training', onClick: () => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.TRAINING }) });
            } else if (state.status !== GameStatus.TRAINING) {
                 actions.push({ label: 'Finalize Signings', onClick: () => dispatch({ type: 'ADVANCE_TO_OFF_SEASON' }) });
             }
        }
        
        return { actions, disabled };
    };

    const { actions: advanceActions, disabled: advanceDisabled } = getAdvanceActions();
    
    const buttonTextColor = (colors.secondary.toUpperCase() === '#FFFFFF' && colors.text.toUpperCase() === '#FFFFFF') 
        ? colors.primary 
        : colors.text;

    const buttonStyle = {
        ...styles.button,
        backgroundColor: colors.secondary,
        color: buttonTextColor,
        borderColor: `${colors.text} ${colors.primary} ${colors.primary} ${colors.text}`,
        flex: 1, // Ensure equal width
    };

    const renderResourceMeter = (label: string, used: number, total: number, accent: string) => {
        if (!total) return null;
        const percent = Math.min(100, Math.round((used / total) * 100));
        return (
            <div style={styles.resourceMeterCard}>
                <div style={styles.resourceMeterHeader}>
                    <span>{label}</span>
                    <span>{used}/{total}</span>
                </div>
                <div style={{ ...styles.resourceMeterTrack, backgroundColor: colors.primary }}>
                    <div style={{ ...styles.resourceMeterFill, width: `${percent}%`, backgroundColor: accent }} />
                </div>
            </div>
        );
    };

    const availableTrainingPoints = trainingPointCap - (state.trainingPointsUsedThisWeek || 0);

    return (
        <div style={styles.navAndActionsContainer}>
            <div style={styles.navRow}>
                {navItems.map(item => {
                    const isActive = state.status === item.status;
                    const navButtonStyle = {
                        ...styles.button,
                        backgroundColor: colors.secondary,
                        color: buttonTextColor,
                        ...(isActive ? {borderColor: `${colors.primary} ${colors.text} ${colors.text} ${colors.primary}`} : {})
                    };
                    return (
                        <button
                            key={item.status}
                            style={navButtonStyle}
                            onClick={() => {
                                dispatch({ type: 'CHANGE_VIEW', payload: item.status })
                            }}
                            disabled={isSimulatingSeason}
                        >
                            {item.label}
                        </button>
                    )
                })}
            </div>
            <div style={styles.actionsRow}>
                {advanceActions.map((action, idx) => (
                    <button 
                        key={idx} 
                        style={buttonStyle} 
                        onClick={action.onClick} 
                        disabled={advanceDisabled || isSimulatingSeason || isSimulatingToGame}
                    >
                        {action.label}
                    </button>
                ))}
                
                {state.gameInSeason <= 31 && (
                    <button 
                        style={buttonStyle}
                        onClick={() => setIsSimulatingSeason(prev => !prev)}
                        disabled={isSimulatingTournament || isSimulatingToGame}
                    >
                        {isSimulatingSeason ? 'Pause Season Sim' : 'Sim Season'}
                    </button>
                )}
                {state.gameInSeason > 31 && state.status === GameStatus.TOURNAMENT && !state.tournament?.champion && (
                    <button 
                        style={buttonStyle}
                        onClick={() => setIsSimulatingTournament(prev => !prev)}
                        disabled={isSimulatingSeason}
                    >
                        {isSimulatingTournament ? 'Pause Tournament' : 'Sim Tournament'}
                    </button>
                )}
            </div>
            {state.userTeam && (
                <div style={{display: 'flex', justifyContent: 'space-between', gap: '20px'}}>
                    {renderResourceMeter('Contact Points', state.contactsMadeThisWeek, contactPointCap, '#4CAF50')}
                    {renderResourceMeter('Training Points', availableTrainingPoints, trainingPointCap, '#2196F3')}
                    <div style={{...styles.resourceMeterCard, borderLeft: '4px solid #4CAF50'}}>
                        <div style={styles.resourceMeterHeader}>
                            <span>Auto Training</span>
                            <span style={{color: state.autoTrainingEnabled ? 'green' : '#B22222'}}>
                                {state.autoTrainingEnabled ? 'On' : 'Off'}
                            </span>
                        </div>
                        <p style={styles.resourceMeterMeta}>
                            {state.autoTrainingEnabled ? 'Unused weekly points flow to your targets.' : 'Points only move when you spend them.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

type SubheadingProps = {
    children?: React.ReactNode;
    color: string;
};

const Subheading = ({ children, color }: SubheadingProps) => (
    <h4 style={{ color, borderBottom: `2px solid ${color}`, paddingBottom: '5px', marginBottom: '10px', marginTop: '20px' }}>{children}</h4>
);


const Dashboard = ({ state, colors, dispatch }: { state: GameState, colors: TeamColors, dispatch: React.Dispatch<GameAction>}) => {
    const isNBA = state.coach?.currentLeague === 'NBA';
    const currentTeam = isNBA ? state.nbaTeams.find(t => t.name === state.coach?.currentNBATeam) : state.userTeam;
    const [promoScheduling, setPromoScheduling] = useState<null | { week: number; opponent: string }>(null);

    const powerRankings = useMemo(() => {
        const teams = isNBA ? state.nbaTeams : state.allTeams;
        const rankings = [...teams]
            .map(t => ({...t, power: t.record.wins * 2 + t.prestige / 10}))
            .sort((a,b) => b.power - a.power);
        return rankings;
    }, [state.allTeams, state.nbaTeams, isNBA]);

    const getRank = (teamName: string) => {
        const rank = powerRankings.findIndex(t => t.name === teamName) + 1;
        return rank;
    };

    const nextGames = isNBA 
        ? (state.gameInSeason <= 31 ? state.nbaSchedule?.[state.gameInSeason - 1]?.filter(g => g.homeTeam === currentTeam?.name || g.awayTeam === currentTeam?.name) : [])
        : (state.gameInSeason <= 31 ? state.schedule?.[state.gameInSeason - 1]?.filter(g => g.homeTeam === state.userTeam?.name || g.awayTeam === state.userTeam?.name) : []);

    const lastResults = isNBA
        ? (state.gameInSeason > 1 ? state.nbaSchedule?.[state.gameInSeason - 2]?.filter(g => g.homeTeam === currentTeam?.name || g.awayTeam === currentTeam?.name) : [])
        : state.lastSimResults;

    const nextGameDateLabel = useMemo(() => {
        if (isNBA) {
            return getGameDateString(state.season + 2024, state.gameInSeason);
        }
        const nextEvent = (state.eventQueue || []).find(
            e => e.type === EventType.GAME && !e.processed && Number(e.payload?.week) === state.gameInSeason
        );
        if (nextEvent?.date) return formatISODate(nextEvent.date);
        return getGameDateString(state.season + 2024, state.gameInSeason);
    }, [isNBA, state.eventQueue, state.gameInSeason, state.season]);

    return (
        <div>
            {promoScheduling && state.userTeam && !isNBA && (
                <div
                    onClick={() => setPromoScheduling(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                        zIndex: 9999,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(560px, 96vw)',
                            background: '#fff',
                            border: `3px solid ${colors.primary}`,
                            borderRadius: 10,
                            boxShadow: '0 14px 34px rgba(0,0,0,0.35)',
                            padding: 14,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#111' }}>
                                    Schedule Promotion
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#444' }}>
                                    {getGameDateStringFromEventQueue(state.eventQueue, state.season + 2024, promoScheduling.week)} vs {promoScheduling.opponent}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPromoScheduling(null)}
                                style={{
                                    border: `2px solid ${colors.primary}`,
                                    background: '#fff',
                                    color: '#111',
                                    borderRadius: 8,
                                    width: 34,
                                    height: 34,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: '0.9rem',
                                    lineHeight: 1,
                                }}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {(() => {
                            const existingEvent = state.userTeam?.eventCalendar?.find(e => e.week === promoScheduling.week);
                            if (existingEvent) {
                                const label =
                                    state.eventPlaybookCatalog.find(p => p.id === existingEvent.playbookId)?.label || 'Event Scheduled';
                                return (
                                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ background: '#f0f8ff', padding: 10, borderRadius: 8, border: '1px solid #b0c4de' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0056b3' }}>{label}</div>
                                            <div style={{ fontSize: '0.65rem', marginTop: 6, color: '#333' }}>Status: {existingEvent.status}</div>
                                        </div>
                                        <button
                                            type="button"
                                            style={{
                                                backgroundColor: '#ffebee',
                                                color: '#c62828',
                                                border: '1px solid #ef9a9a',
                                                padding: '0.45rem 0.75rem',
                                                fontSize: '0.7rem',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                width: '100%',
                                                borderRadius: 8,
                                            }}
                                            onClick={() => {
                                                dispatch({ type: 'CANCEL_EVENT', payload: { eventId: existingEvent.id } });
                                                setPromoScheduling(null);
                                            }}
                                        >
                                            Cancel Event
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <select
                                        style={{
                                            padding: '0.55rem',
                                            borderRadius: 8,
                                            border: `2px solid ${colors.primary}55`,
                                            fontSize: '0.7rem',
                                            fontFamily: "'Press Start 2P', 'Courier New', system-ui, sans-serif",
                                            background: '#fff',
                                        }}
                                        defaultValue=""
                                        onChange={(e) => {
                                            const playbookId = e.target.value;
                                            if (!playbookId) return;
                                            dispatch({
                                                type: 'SCHEDULE_EVENT',
                                                payload: {
                                                    playbookId,
                                                    week: promoScheduling.week,
                                                    opponent: promoScheduling.opponent,
                                                },
                                            });
                                            setPromoScheduling(null);
                                        }}
                                    >
                                        <option value="">Select Promotion...</option>
                                        {state.eventPlaybookCatalog.map(event => (
                                            <option key={event.id} value={event.id}>
                                                {event.label} (${event.cost.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: '0.65rem', color: '#666' }}>
                                        Promotions are for upcoming home games.
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
            {state.trainingSummary.length > 0 && !isNBA && state.gameInSeason === 1 && (
                <div style={{marginBottom: '20px'}}>
                <Subheading color={colors.primary}>Off-Season Training Results</Subheading>
                {state.trainingSummary.map((s,i) => <p key={i} style={{fontSize: '0.7rem', marginBottom: '5px'}}>{s}</p>)}
                </div>
            )}

            {/* Job Security Widget */}
            {!isNBA && state.userTeam && state.coach?.contract?.expectations && (
                <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                    <Subheading color={colors.primary}>Job Security & Board Expectations</Subheading>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Status: </span>
                            <span style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 'bold', 
                                color: state.coach.contract.expectations.jobSecurityStatus === 'Safe' ? 'green' : 
                                       state.coach.contract.expectations.jobSecurityStatus === 'Warm' ? 'orange' : 'red' 
                            }}>
                                {state.coach.contract.expectations.jobSecurityStatus}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.7rem' }}>
                            Composite Score: {state.coach.contract.expectations.metrics ? Math.round(state.coach.contract.expectations.metrics.compositeScore) : 100}/100
                        </div>
                    </div>
                    
                    {state.coach.contract.expectations.metrics ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: '#555' }}>
                                <strong>Board Profile:</strong> {state.coach.contract.expectations.boardProfile} •{' '}
                                <strong>Pressure:</strong> {Math.round(state.coach.contract.expectations.pressure)}%
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', fontSize: '0.65rem' }}>
                                {state.coach.contract.expectations.metrics.components.map(component => {
                                    const isFinances = component.key === 'finances';
                                    const formatCurrencyCompact = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
                                    const actualText = component.displayActual
                                        ?? (typeof component.actual === 'number'
                                            ? (isFinances ? formatCurrencyCompact(component.actual) : `${Math.round(component.actual)}`)
                                            : 'N/A');
                                    const expectedText = component.displayExpected
                                        ?? (typeof component.expected === 'number'
                                            ? (isFinances ? formatCurrencyCompact(component.expected) : `${Math.round(component.expected)}`)
                                            : 'N/A');

                                    return (
                                        <div key={component.key} style={{ textAlign: 'center', padding: '6px', backgroundColor: '#eee', borderRadius: '4px' }}>
                                            <strong>{component.label}</strong><br/>
                                            {actualText} / {expectedText}<br/>
                                            <span style={{ color: '#666' }}>
                                                Score: {Math.round(component.score)} • Weight {Math.round(component.weight * 100)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.7rem' }}>
                            <div>
                                <strong>Wins:</strong> {state.coach.contract.expectations.evaluationMode === 'contract' ? state.coach.contract.progress.wins : state.userTeam.record.wins} / {state.coach.contract.expectations.targetWins}
                            </div>
                            <div>
                                <strong>Postseason:</strong> {state.coach.contract.expectations.targetPostseasonCount
                                    ? `${state.coach.contract.expectations.targetTourneyRound.replace('Round of ', 'R')} x${state.coach.contract.expectations.targetPostseasonCount}`
                                    : state.coach.contract.expectations.targetTourneyRound}
                            </div>
                            <div>
                                <strong>Draft Picks:</strong> {state.coach.contract.expectations.targetDraftPicks} / yr
                            </div>
                            <div>
                                <strong>Attendance:</strong> {Math.round(state.coach.contract.expectations.targetAttendanceFillRate * 100)}% fill target
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* FORCE SIMULATION BUTTON */}
            {!isNBA && state.eventQueue?.some(e => 
                e.type === EventType.GAME && 
                !e.processed && 
                state.currentDate && 
                isSameISO(e.date, state.currentDate) &&
                (e.payload.homeTeam === state.userTeam?.name || e.payload.awayTeam === state.userTeam?.name)
            ) && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', border: `1px solid ${colors.primary}`, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: colors.primary, fontSize: '0.8rem' }}>Game Day Pending</strong>
                        <span style={{ color: '#666', fontSize: '0.7rem' }}>Running late? Simulate this game immediately.</span>
                    </div>
                    <button 
                        onClick={() => dispatch({ type: 'SIMULATE_USER_GAME' })}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: colors.primary, 
                            color: colors.text, 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        Simulate Game
                    </button>
                </div>
            )}

            {!isNBA && state.userTeam && (state.eventQueue?.length || 0) > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <Subheading color={colors.primary}>Calendar</Subheading>
                    <DashboardScheduleCalendar
                        userTeamName={state.userTeam.name}
                        userTeamColors={colors}
                        schedule={state.schedule}
                        eventQueue={state.eventQueue}
                        currentDate={state.currentDate || SEASON_START_DATE}
                        currentWeek={state.gameInSeason}
                        getLogoSrc={(schoolName) => `school logos/${schoolNameToSlug(schoolName)}`}
                        getTeamColors={(schoolName) => SCHOOL_COLORS[schoolName] || { primary: '#C0C0C0', secondary: '#808080', text: '#FFFFFF' }}
                        onSelectHomeGame={({ week, opponent }) => setPromoScheduling({ week, opponent })}
                    />
                </div>
            )}

            <Subheading color={colors.primary}>Next {isNBA ? 'Games' : 'Game'} ({nextGameDateLabel})</Subheading>
            {state.gameInSeason <= 31 && nextGames && nextGames.length > 0 && currentTeam ? (
                <div>
                    {nextGames.map((game, idx) => (
                        <p key={idx}>
                           {game.homeTeam === currentTeam.name ? 'vs' : '@'} {game.homeTeam === currentTeam.name ? game.awayTeam : game.homeTeam} (#{getRank(game.homeTeam === currentTeam.name ? game.awayTeam : game.homeTeam)})
                        </p>
                    ))}
                </div>
            ) : state.tournament?.champion ? (
                <p>Season Over. Proceed to Signing Period.</p>
            ) : (
                <p>{isNBA ? 'Regular season is over. Playoffs begin soon.' : 'Regular season is over. Go to Tournament view.'}</p>
            )}

            <Subheading color={colors.primary}>Pipeline States</Subheading>
            {currentTeam?.pipelineStates && currentTeam.pipelineStates.length > 0 ? (
                <p style={{fontSize: '0.8rem'}}>{currentTeam.pipelineStates.join(', ')}</p>
            ) : (
                <p style={{fontSize: '0.8rem', color: '#999'}}>No pipeline states established.</p>
            )}

            <Subheading color={colors.primary}>Last Week's Results</Subheading>
            {lastResults && lastResults.length > 0 && currentTeam ? (
                <div style={{fontSize: '0.7rem'}}>
                    {[...lastResults]
                        .sort((a, b) => {
                            const aIsUserGame = a.homeTeam === currentTeam.name || a.awayTeam === currentTeam.name;
                            const bIsUserGame = b.homeTeam === currentTeam.name || b.awayTeam === currentTeam.name;
                            if (aIsUserGame && !bIsUserGame) return -1;
                            if (!aIsUserGame && bIsUserGame) return 1;
                            return 0;
                        })
                        .map((g, i) => {
                            const isUserGame = g.homeTeam === currentTeam.name || g.awayTeam === currentTeam.name;
                            const pStyle: React.CSSProperties = isUserGame ? {
                                backgroundColor: colors.primary,
                                color: colors.text,
                                padding: '5px',
                                borderRadius: '3px'
                            } : {};
                            const winner = g.homeScore > g.awayScore ? 'home' : 'away';
                            const winnerStyle = { color: 'green', fontWeight: 'bold' };

                            return (
                                <p key={i} style={pStyle}>
                                    {g.awayTeam} (#{getRank(g.awayTeam)}){' '}
                                    <span style={winner === 'away' ? winnerStyle : {}}>
                                        {g.awayScore}
                                    </span>
                                    {' @ '}
                                    {g.homeTeam} (#{getRank(g.homeTeam)}){' '}
                                    <span style={winner === 'home' ? winnerStyle : {}}>
                                        {g.homeScore}
                                    </span>
                                    {isUserGame && g.played && (
                                        <button 
                                            onClick={() => {
                                                const gameIdPrefix = isNBA ? `NBA-S${state.season}W${state.gameInSeason - 1}` : `S${state.season}G${state.gameInSeason - 1}`;
                                                const gameLog = isNBA 
                                                    ? null // NBA logs not stored in main gameLogs yet or need finding logic
                                                    : state.gameLogs.find(log => log.gameId === `${gameIdPrefix}-${g.homeTeam}v${g.awayTeam}` || log.gameId === `${gameIdPrefix}-${g.awayTeam}v${g.homeTeam}`);
                                                
                                                // For now, disable NBA game log view until logs are properly stored/retrieved
                                                if (gameLog && !isNBA) {
                                                    dispatch({ type: 'VIEW_GAME_LOG', payload: { gameLog } });
                                                }
                                            }}
                                            style={{ ...styles.smallButton, marginLeft: '10px' }}
                                        >
                                            View Box Score
                                        </button>
                                    )}
                                </p>
                            );
                        })}
                </div>
            ) : <p>No games simulated yet this season.</p>}
        </div>
    );
};

const RosterView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const [starters, setStarters] = useState<{[key in RosterPositions]: string}>({ PG: '', SG: '', SF: '', PF: '', C: '' });
    const [viewStats, setViewStats] = useState(false);

    useEffect(() => {
        // FIX: Added a null check for state.userTeam to prevent crashes when the component mounts before the team is selected.
        if (!state.userTeam) {
            return;
        }

        if(state.userTeam){
            const initialStarters: {[key in RosterPositions]: string} = { PG: '', SG: '', SF: '', PF: '', C: '' };
            state.userTeam.roster.forEach(p => {
                if (p.starterPosition) {
                   initialStarters[p.starterPosition] = p.id;
                }
            });
            setStarters(initialStarters);
        }
    }, [state.userTeam]);


    const renderTrend = (player: Player) => {
        if (player.startOfSeasonOverall === undefined) return <span style={{ color: 'gray' }}>-</span>;
        const trend = player.overall - player.startOfSeasonOverall;
        if (trend > 0) return <span style={{ color: '#1a7f37' }}>▲ +{trend}</span>;
        if (trend < 0) return <span style={{ color: '#c52b2b' }}>▼ {trend}</span>;
        return <span style={{ color: 'gray' }}>—</span>;
    };


    if (!state.userTeam) return null;

    const inSigningPeriod = state.status === GameStatus.SIGNING_PERIOD && (state.signingPeriodDay || 0) <= 7;
    const nextYearLabel = (y: Player['year']): Player['year'] => {
        if (!inSigningPeriod) return y;
        if (y === 'Fr') return 'So';
        if (y === 'So') return 'Jr';
        if (y === 'Jr') return 'Sr';
        return y;
    };

    const handleStarterChange = (pos: RosterPositions, playerId: string) => {
        setStarters(prev => ({...prev, [pos]: playerId}));
    };
    
    const saveStarters = () => {
        if (new Set(Object.values(starters)).size !== 5 || Object.values(starters).some(id => !id)) {
            dispatch({ type: 'SET_TOAST', payload: "You must select 5 unique starters." });
            return;
        }
        dispatch({ type: 'SET_STARTERS', payload: starters });
    };

    const totalMinutes = useMemo(() => {
        if (!state.userTeam) return 0;
        return state.userTeam.roster.reduce((sum, p) => sum + (p.rotationMinutes || 0), 0);
    }, [state.userTeam]);

    const saveMinutes = () => {
        if (totalMinutes !== 200) {
            dispatch({ type: 'SET_TOAST', payload: `You must allocate exactly 200 minutes (currently ${totalMinutes}).` });
            return;
        }
        dispatch({ type: 'SET_TOAST', payload: 'Minutes saved!' });
    };

    const autoSetLineup = () => {
        if (!state.userTeam) return;
        const rosterWithAutoStarters = autoSetStarters(state.userTeam.roster);
        const finalStarters: { [key in RosterPositions]: string } = { PG: '', SG: '', SF: '', PF: '', C: '' };
        rosterWithAutoStarters.forEach(p => {
            if (p.starterPosition) finalStarters[p.starterPosition] = p.id;
        });

        if (new Set(Object.values(finalStarters)).size !== 5 || Object.values(finalStarters).some(id => !id)) {
            dispatch({ type: 'SET_TOAST', payload: "Auto-set failed. Please set manually." });
            return;
        }

        dispatch({ type: 'SET_STARTERS', payload: finalStarters });
    };

    const handleCutPlayer = (playerId: string, playerName: string) => {
        if (window.confirm(`Are you sure you want to cut ${playerName}? This will free up a scholarship.`)) {
            dispatch({ type: 'CUT_PLAYER', payload: { playerId } });
        }
    };

    const handleFocusChange = (playerId: string) => {
        dispatch({ type: 'SET_PLAYER_FOCUS', payload: { playerId: playerId || null } });
    };

    const handleCaptainChange = (playerId: string) => {
        dispatch({ type: 'SET_TEAM_CAPTAIN', payload: { playerId: playerId || null } });
    };

    const sortedRoster = state.userTeam.roster
        .slice()
        .sort((a, b) => b.overall - a.overall);
    const totalPlayers = sortedRoster.length;
    const positionDepth = useMemo(() => getPositionDepthSummary(sortedRoster), [sortedRoster]);

    return (
        <div>
            <div style={{marginBottom: '20px'}}>
                <Subheading color={colors.primary}>Set Starting Lineup</Subheading>
                <p style={{ fontSize: '0.7rem', marginBottom: '10px' }}>Roster Count: {totalPlayers} players</p>
                <div style={styles.positionDepthRow}>
                    {(Object.keys(positionDepth) as RosterPositions[]).map(pos => (
                        <span key={`depth-${pos}`} style={styles.positionDepthPill}>
                            {pos}: {positionDepth[pos]}/3
                        </span>
                    ))}
                </div>
                { (['PG', 'SG', 'SF', 'PF', 'C'] as RosterPositions[]).map(pos => (
                    <div key={pos} style={{display: 'flex', alignItems: 'center', marginBottom: '5px'}}>
                        <label style={{width: '50px', flexShrink: 0}}>{pos}:</label>
                        <select value={starters[pos]} onChange={(e) => handleStarterChange(pos, e.target.value)} style={{...styles.select, flex: 1, minWidth: 0}}>
                            <option value="">Select...</option>
                            {sortedRoster.map(p => <option key={p.id} value={p.id}>{p.name} ({p.overall})</option>)}
                        </select>
                    </div>
                ))}
                <button onClick={saveStarters} style={{...styles.button, marginRight: '10px', marginTop: '10px'}}>Save Starters</button>
                <button onClick={autoSetLineup} style={{...styles.button, marginTop: '10px'}}>Auto-Set</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <Subheading color={colors.primary}>Player Roles</Subheading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span>Featured Scorer</span>
                        <select
                            value={state.userTeam.playerFocusId ?? ''}
                            onChange={e => handleFocusChange(e.target.value)}
                            style={{ ...styles.select, maxWidth: '320px' }}
                        >
                            <option value="">None (balanced)</option>
                            {sortedRoster.map(player => (
                                <option key={player.id} value={player.id}>{player.name} ({player.position})</option>
                            ))}
                        </select>
                        <span style={{ fontSize: '0.6rem', color: '#555' }}>Focused players get extra touches, shots, and pick-and-roll opportunities.</span>
                    </label>
                    <label style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span>Team Captain</span>
                        <select
                            value={state.userTeam.teamCaptainId ?? ''}
                            onChange={e => handleCaptainChange(e.target.value)}
                            style={{ ...styles.select, maxWidth: '320px' }}
                        >
                            <option value="">None</option>
                            {sortedRoster.map(player => (
                                <option key={player.id} value={player.id}>{player.name} ({player.position})</option>
                            ))}
                        </select>
                        <span style={{ fontSize: '0.6rem', color: '#555' }}>Captains stabilize the lineup and add subtle boosts on both ends.</span>
                    </label>
                </div>
            </div>

            <div style={{marginBottom: '20px'}}>
                <Subheading color={colors.primary}>Rotation Minutes</Subheading>
                <p style={{ fontSize: '0.7rem', marginBottom: '10px', color: totalMinutes === 200 ? '#1a7f37' : totalMinutes > 200 ? '#B22222' : '#333' }}>
                    Minutes Allocated: {totalMinutes} / 200
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => dispatch({ type: 'AUTO_DISTRIBUTE_MINUTES' })} style={{ ...styles.button }}>Auto-Distribute</button>
                    <button onClick={() => dispatch({ type: 'AUTO_DISTRIBUTE_REMAINING_MINUTES' })} style={{ ...styles.button }}>Auto-Distribute Remaining</button>
                    <button onClick={() => dispatch({ type: 'RESET_MINUTES' })} style={{ ...styles.button }}>Reset Minutes</button>
                    <button onClick={saveMinutes} style={{ ...styles.button }}>Save Minutes</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', margin: 0 }}>Rotation Preference:</label>
                        <select
                            value={state.rotationPreference}
                            onChange={(e) => dispatch({ type: 'SET_ROTATION_PREFERENCE', payload: e.target.value as RotationPreference })}
                            style={{ ...styles.select, minWidth: '170px' }}
                        >
                            {ROTATION_PREFERENCE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value} title={option.description}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
             <button onClick={() => setViewStats(!viewStats)} style={{...styles.button, marginBottom: '10px'}}>
                {viewStats ? 'View Ratings' : 'View Stats'}
            </button>
            <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead><tr>
                    {viewStats ? (
                        <>
                            <th style={{...styles.th, width: '40%', backgroundColor: colors.primary, color: colors.text}}>Name</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>GP</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>PPG</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>RPG</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>APG</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>MPG</th>
                        </>
                    ) : (
                        <>
                            <th style={{...styles.th, width: '30%', backgroundColor: colors.primary, color: colors.text}}>Name</th>
                            <th style={{...styles.th, width: '15%', backgroundColor: colors.primary, color: colors.text}}>Pos</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Ht</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Yr</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>OVR</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Trend</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Pot</th>
                            <th style={{...styles.th, width: '12%', backgroundColor: colors.primary, color: colors.text}}>Starter</th>
                            <th style={{...styles.th, width: '8%', backgroundColor: colors.primary, color: colors.text}}>MPG</th>
                        </>
                    )}
                </tr></thead>
                <tbody>
                    {sortedRoster.map((p, index) => {
                        const displayYear = nextYearLabel(p.year);
                        const isSenior = displayYear === 'Sr';
                        const isHighPotentialFreshman = displayYear === 'Fr' && p.potential >= 85;
                        const yearCellStyle: React.CSSProperties = {
                            ...styles.td,
                            color: isSenior ? '#B22222' : '#000000',
                            fontWeight: isSenior ? 'bold' : 'normal',
                        };
                        const nameCellStyle: React.CSSProperties = {
                            ...styles.td,
                            color: isHighPotentialFreshman ? '#006400' : '#000000',
                            fontWeight: isHighPotentialFreshman ? 'bold' : 'normal',
                        };

                        const renderCutButton = () => (
                            <button
                                onClick={() => handleCutPlayer(p.id, p.name)}
                                style={{ ...styles.pullButton, flexShrink: 0 }}
                            >
                                Cut
                            </button>
                        );

                        return (
                            <tr key={p.id}>
                                {viewStats ? (
                                    <>
                                        <td style={nameCellStyle}>
                                            <div style={styles.inlineRowAction}>
                                                <span>{index + 1}. {p.name}</span>
                                                {renderCutButton()}
                                            </div>
                                        </td>
                                        <td style={styles.td}>{p.seasonStats.gamesPlayed}</td>
                                        <td style={styles.td}>{(p.seasonStats.points / (p.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                        <td style={styles.td}>{(p.seasonStats.rebounds / (p.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                        <td style={styles.td}>{(p.seasonStats.assists / (p.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={40}
                                                    value={p.rotationMinutes ?? 0}
                                                    onChange={(e) => dispatch({ type: 'SET_PLAYER_MINUTES', payload: { playerId: p.id, minutes: parseInt(e.target.value || '0', 10) } })}
                                                    style={{ width: '60px' }}
                                                    disabled={!!p.minutesLocked}
                                                />
                                                <button
                                                    style={styles.smallButton}
                                                    onClick={() => dispatch({ type: 'TOGGLE_PLAYER_MINUTES_LOCK', payload: { playerId: p.id } })}
                                                >
                                                    {p.minutesLocked ? 'Unlock' : 'Lock'}
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={nameCellStyle}>{index + 1}. {p.name}</td>
                                        <td style={styles.td}>{p.position}{p.secondaryPosition ? `/${p.secondaryPosition}` : ''}</td>
                                        <td style={styles.td}>{formatPlayerHeight(p.height)}</td>
                                        <td style={yearCellStyle}>{displayYear}</td>
                                        <td style={styles.td}>{p.overall}</td>
                                        <td style={styles.td}>{renderTrend(p)}</td>
                                        <td style={styles.td}>{formatPotentialValue(p.potential)}</td>
                                        <td style={styles.td}>
                                            <div style={styles.inlineRowAction}>
                                                <span>{p.starterPosition ? p.starterPosition : 'No'}</span>
                                                {renderCutButton()}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={40}
                                                    value={p.rotationMinutes ?? 0}
                                                    onChange={(e) => dispatch({ type: 'SET_PLAYER_MINUTES', payload: { playerId: p.id, minutes: parseInt(e.target.value || '0', 10) } })}
                                                    style={{ width: '60px' }}
                                                    disabled={!!p.minutesLocked}
                                                />
                                                <button
                                                    style={styles.smallButton}
                                                    onClick={() => dispatch({ type: 'TOGGLE_PLAYER_MINUTES_LOCK', payload: { playerId: p.id } })}
                                                >
                                                    {p.minutesLocked ? 'Unlock' : 'Lock'}
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            </div>
            <OtherTeamsRosterView state={state} colors={colors} />
        </div>
    );
}

const OtherTeamsRosterView = ({ state, colors }: { state: GameState, colors: TeamColors }) => {
    const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
    const selectedTeam = selectedTeamName ? state.allTeams.find(team => team.name === selectedTeamName) : null;
    const selectedTeamColors = selectedTeam ? SCHOOL_COLORS[selectedTeam.name] || colors : colors;
    const rosterTeamOptions = useMemo(() => [...state.allTeams].sort((a, b) => a.name.localeCompare(b.name)), [state.allTeams]);



    const renderTrend = (player: Player) => {
        if (player.startOfSeasonOverall === undefined) return <span style={{ color: 'gray' }}>-</span>;
        const trend = player.overall - player.startOfSeasonOverall;
        if (trend > 0) return <span style={{ color: '#1a7f37' }}>▲ +{trend}</span>;
        if (trend < 0) return <span style={{ color: '#c52b2b' }}>▼ {trend}</span>;
        return <span style={{ color: 'gray' }}>—</span>;
    };

    return (
        <div style={{marginTop: '40px'}}>
            <Subheading color={colors.primary}>View Other Rosters</Subheading>
            <select onChange={(e) => setSelectedTeamName(e.target.value)} style={{...styles.select, marginBottom: '20px'}}>
                <option value="">Select a team</option>
                {rosterTeamOptions.map(team => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                ))}
            </select>
            { /* Display next year's class labels during signing period */ }
            {(() => {
                return null;
            })()}
            {selectedTeam && (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{...styles.th, width: '30%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Name</th>
                                <th style={{...styles.th, width: '15%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Pos</th>
                                <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Ht</th>
                                <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Yr</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>OVR</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Trend</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Pot</th>
                            <th style={{...styles.th, width: '8%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>MIN</th>
                        </tr>
                    </thead>
                    <tbody>
                            {selectedTeam.roster.slice().sort((a, b) => b.overall - a.overall).map((p, index) => {
                                const inSigningPeriod = state.status === GameStatus.SIGNING_PERIOD && (state.signingPeriodDay || 0) <= 7;
                                const displayYear = inSigningPeriod
                                    ? (p.year === 'Fr' ? 'So' : p.year === 'So' ? 'Jr' : p.year === 'Jr' ? 'Sr' : p.year)
                                    : p.year;
                                return (
                                    <tr key={p.id}>
                                        <td style={styles.td}>{index + 1}. {p.name}</td>
                                        <td style={styles.td}>{p.position}{p.secondaryPosition ? `/${p.secondaryPosition}` : ''}</td>
                                        <td style={styles.td}>{formatPlayerHeight(p.height)}</td>
                                        <td style={styles.td}>{displayYear}</td>
                                        <td style={styles.td}>{p.overall}</td>
                                        <td style={styles.td}>{renderTrend(p)}</td>
                                <td style={styles.td}>{formatPotentialValue(p.potential)}</td>
                                <td style={styles.td}>{p.rotationMinutes ?? 0}</td>
                            </tr>
                        );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const Schedule = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {

    const [selectedTeam, setSelectedTeam] = useState(state.userTeam?.name || '');

    const powerRankings = useMemo(() => 

        [...state.allTeams]

        .map(t => ({...t, power: t.record.wins * 2 + t.prestige / 10}))

        .sort((a,b) => b.power - a.power), 

    [state.allTeams]);

    const scheduleTeamOptions = useMemo(() => [...state.allTeams].sort((a, b) => a.name.localeCompare(b.name)), [state.allTeams]);

    const getRank = (teamName: string) => powerRankings.findIndex(t => t.name === teamName) + 1;



    const handleTeamChange = (event: React.ChangeEvent<HTMLSelectElement>) => {

        setSelectedTeam(event.target.value);

    };



    return (

        <div>

            <div style={{ marginBottom: '20px' }}>

                <label htmlFor="team-schedule-select" style={{ marginRight: '10px' }}>Select Team:</label>

                <select id="team-schedule-select" value={selectedTeam} onChange={handleTeamChange} style={styles.select}>

                    {scheduleTeamOptions.map(team => (

                        <option key={team.name} value={team.name}>{team.name}</option>

                    ))}

                </select>

            </div>

            {state.schedule.map((gameDay, i) => {

                const gamesForSelectedTeam = gameDay.filter(g => g.homeTeam === selectedTeam || g.awayTeam === selectedTeam);

                if (gamesForSelectedTeam.length === 0) return null;



                return (

                    <div key={i} style={{marginBottom: '15px'}}>

                        <Subheading color={colors.primary}>Game {i + 1}</Subheading>

                        <ul style={{fontSize: '0.7rem', listStyle: 'none', padding: 0}}>

                            {gamesForSelectedTeam.map((g, j) => (

                                <li key={j} style={{marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px'}}>

                                    <TeamBox 

                                        name={g.awayTeam} 

                                        seed={getRank(g.awayTeam)} 

                                        score={g.awayScore} 

                                        played={g.played} 

                                        conference={SCHOOL_CONFERENCES[g.awayTeam]}

                                        isUserTeam={g.awayTeam === selectedTeam} 

                                        userTeamColors={colors}

                                        isWinner={g.played && g.awayScore > g.homeScore}

                                    />

                                    <span style={{fontSize: '0.6rem'}}>@</span>

                                    <TeamBox 

                                        name={g.homeTeam} 

                                        seed={getRank(g.homeTeam)} 

                                        score={g.homeScore} 

                                        played={g.played} 

                                        conference={SCHOOL_CONFERENCES[g.homeTeam]}

                                        isUserTeam={g.homeTeam === selectedTeam} 

                                        userTeamColors={colors}

                                        isWinner={g.played && g.homeScore > g.awayScore}

                                    />

                                    {g.played && (

                                        <button 

                                            onClick={() => {

                                                const gameLog = state.gameLogs.find(log => log.gameId === `S${state.season}G${i + 1}-${g.homeTeam}v${g.awayTeam}` || log.gameId === `S${state.season}G${i + 1}-${g.awayTeam}v${g.homeTeam}`);

                                                if (gameLog) {

                                                    dispatch({ type: 'VIEW_GAME_LOG', payload: { gameLog } });

                                                }

                                            }}

                                            style={{ ...styles.smallButton, marginLeft: '10px' }}

                                        >

                                            View Box Score

                                        </button>

                                    )}

                                </li>

                            ))}

                        </ul>

                    </div>

                );

            })}

        </div>

    );

};

const StarRating = ({ stars }: { stars: number }) => {

    const normalized = Math.max(0, Math.min(5, Math.round(stars || 0)));

    const filledChar = String.fromCharCode(0x2605);

    const emptyChar = String.fromCharCode(0x2606);

    const filled = filledChar.repeat(normalized);

    const empty = emptyChar.repeat(5 - normalized);

    return (

        <span

            aria-label={`${normalized} star${normalized === 1 ? '' : 's'}`}

            style={{

                color: '#FFC72C',

                textShadow: '1px 1px #000, -1px -1px #000, 1px -1px #000, -1px 1px #000',

                fontSize: '1.2rem',

                letterSpacing: '1.5px',

            }}

        >

            {filled}

            {empty}

        </span>

    );

};

	const CommitmentStatus = ({ teamName, teamRank, isSigningPeriod, isSoftCommit }: { teamName: string, teamRank?: number, isSigningPeriod: boolean, isSoftCommit?: boolean }) => {
	    const teamColors = SCHOOL_COLORS[teamName] || { primary: '#C0C0C0', secondary: '#808080', text: '#000000' };

    const style: React.CSSProperties = {
        ...styles.button,
        backgroundColor: teamColors.primary,
        color: teamColors.text,
        padding: '5px',
        fontSize: '0.5rem',
        textAlign: 'center',
        cursor: 'default',
        width: '100%',
        minWidth: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        lineHeight: '1.2',
    };

	    const [label1, label2] = isSigningPeriod ? ['Signed', 'With'] : [isSoftCommit ? 'Soft' : 'Hard', 'Committed'];

    return (
        <div style={style}>
            <span>{label1}</span>
            <span>{label2}</span>
            <span style={{ fontWeight: 'bold' }}>{teamName}</span>
            {teamRank && (
                <span style={{ fontWeight: 'bold', fontSize: '0.6rem', marginLeft: '3px' }}>#{teamRank}</span>
            )}
        </div>
    );
};


const MotivationDisplay = ({ motivations }: { motivations?: any }) => {
    if (!motivations) return null;
    const keys = Object.keys(motivations) as (keyof typeof motivations)[];
    // Sort keys by value descending to show top drivers first
    const sortedKeys = keys.sort((a, b) => motivations[b] - motivations[a]).slice(0, 3);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.65rem' }}>
            {sortedKeys.map(k => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{k}</span>
                    <div style={{ width: '100%', backgroundColor: '#e0e0e0', height: '6px', borderRadius: '3px' }}>
                        <div style={{ 
                            width: `${motivations[k]}%`, 
                            backgroundColor: motivations[k] > 75 ? '#4CAF50' : motivations[k] > 50 ? '#FFC107' : '#D32F2F', 
                            height: '100%', 
                            borderRadius: '3px' 
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

	const RecruitingViewInner = ({ state, dispatch, colors, isSigningPeriod }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors, isSigningPeriod?: boolean }) => {
	    const [viewingOffersFor, setViewingOffersFor] = useState<Recruit | null>(null);
	    const [negativeRecruitingFor, setNegativeRecruitingFor] = useState<Recruit | null>(null);
	    const [schedulingVisitFor, setSchedulingVisitFor] = useState<Recruit | null>(null);
	    const [offeringScholarshipFor, setOfferingScholarshipFor] = useState<Recruit | null>(null);
	    const [showRecruitingAnalytics, setShowRecruitingAnalytics] = useState(false);
	    const [hideVerballyCommitted, setHideVerballyCommitted] = useState(false);
	    const [hideSigned, setHideSigned] = useState(false);
	    const [showUserCommitsOnly, setShowUserCommitsOnly] = useState(false);
	    const [positionFilter, setPositionFilter] = useState<'all' | RosterPositions>('all');
	    const [starFilter, setStarFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
	    const [minInterest, setMinInterest] = useState(0);
	    const [targetsOnly, setTargetsOnly] = useState(false);
	    const [searchQuery, setSearchQuery] = useState('');
	    const [regionFilter, setRegionFilter] = useState<'all' | 'Northeast' | 'Midwest' | 'South' | 'West'>('all');
	    const [homeStateFilter, setHomeStateFilter] = useState<'all' | string>('all');
	    const [maxDistanceMiles, setMaxDistanceMiles] = useState(2500);
	    const [stageFilter, setStageFilter] = useState<'all' | string>('all');
	    const [needsFitOnly, setNeedsFitOnly] = useState(false);
	    const [showColLocation, setShowColLocation] = useState(false);
	    const [showColHighSchool, setShowColHighSchool] = useState(false);
	    const [showColNationalRank, setShowColNationalRank] = useState(false);
	    const [showColStage, setShowColStage] = useState(false);
	    const [showColTop2, setShowColTop2] = useState(false);
    type SortableKey = keyof Pick<Recruit, 'overall' | 'potential' | 'interest' | 'stars'> | 'rank';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' }>({ key: 'rank', direction: 'ascending' });

    const userTeamName = state.userTeam?.name ?? null;
    const teamNeeds = useMemo(() => state.userTeam ? calculateTeamNeeds(state.userTeam) : '', [state.userTeam]);

    const powerRankings = useMemo(() => {
        const ranks = new Map<string, number>();
        [...state.allTeams]
            .sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10))
            .forEach((team, index) => {
                ranks.set(team.name, index + 1);
            });
        return ranks;
    }, [state.allTeams]);

    const recruitRanks = useMemo(() => {
        // Use the canonical board ranks computed in `services/gameService.ts` via `recomputeRecruitBoardRanks`.
        const ranks = new Map<string, number>();
        state.recruits.forEach(recruit => {
            if (typeof recruit.nationalRank === 'number') {
                ranks.set(recruit.id, recruit.nationalRank);
            }
        });
        return ranks;
    }, [state.recruits]);

    const sortedRecruits = useMemo(() => {
        let sortableRecruits = [...state.recruits];
        sortableRecruits.sort((a, b) => {
            if (sortConfig.key === 'rank') {
                const rankA = recruitRanks.get(a.id);
                const rankB = recruitRanks.get(b.id);
                const aIsRanked = rankA !== undefined;
                const bIsRanked = rankB !== undefined;
                if (sortConfig.direction === 'ascending') {
                    if (aIsRanked && !bIsRanked) return -1;
                    if (!aIsRanked && bIsRanked) return 1;
                    if (!aIsRanked && !bIsRanked) return b.overall - a.overall;
                    return rankA! - rankB!;
                } else {
                    if (aIsRanked && !bIsRanked) return -1;
                    if (!aIsRanked && bIsRanked) return 1;
                    if (!aIsRanked && !bIsRanked) return b.overall - a.overall;
                    return rankB! - rankA!;
                }
            } else {
                const key = sortConfig.key as Exclude<SortableKey, 'rank'>;
                if (a[key] < b[key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[key] > b[key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            }
        });
        return sortableRecruits;
    }, [state.recruits, sortConfig, recruitRanks]);

	    const filteredRecruits = useMemo(() => {
	        const query = searchQuery.trim().toLowerCase();
	        const needsText = state.userTeam ? calculateTeamNeeds(state.userTeam) : '';
	        const needsPositions = (needsText.match(/\b(PG|SG|SF|PF|C)\b/g) || []) as RosterPositions[];
	        return sortedRecruits.filter(r => {
	            const hasCommitment = !!r.verbalCommitment;
	            const isSigned = Boolean(isSigningPeriod && hasCommitment);
	            const isVerbalOnly = hasCommitment && !isSigned;
	            const committedToUser = userTeamName ? r.verbalCommitment === userTeamName : false;
	            if (hideSigned && isSigned) return false;
	            if (hideVerballyCommitted && isVerbalOnly) return false;
	            if (showUserCommitsOnly && !committedToUser) return false;
	            if (positionFilter !== 'all') {
	                const matchesPrimary = r.position === positionFilter;
	                const matchesSecondary = r.secondaryPosition === positionFilter;
	                if (!matchesPrimary && !matchesSecondary) return false;
	            }
	            if (starFilter !== 'all' && r.stars !== starFilter) return false;
	            if (r.interest < minInterest) return false;
	            if (targetsOnly && !r.isTargeted) return false;
	            if (regionFilter !== 'all') {
	                const reg = getRecruitRegionForState(r.hometownState || r.homeState) || 'Unknown';
	                if (reg !== regionFilter) return false;
	            }
	            if (homeStateFilter !== 'all') {
	                if ((r.hometownState || r.homeState) !== homeStateFilter) return false;
	            }
	            if (maxDistanceMiles < 2500 && state.userTeam) {
	                const dist = estimateRecruitDistanceMilesToTeam(r, state.userTeam);
	                if (dist > maxDistanceMiles) return false;
	            }
	            if (stageFilter !== 'all') {
	                if ((r.recruitmentStage || (r.verbalCommitment ? 'HardCommit' : 'Open')) !== stageFilter) return false;
	            }
	            if (needsFitOnly && needsPositions.length) {
	                const fits = needsPositions.includes(r.position as RosterPositions) || (r.secondaryPosition ? needsPositions.includes(r.secondaryPosition as RosterPositions) : false);
	                if (!fits) return false;
	            }
	            if (query && !r.name.toLowerCase().includes(query)) return false;
	            return true;
	        });
	    }, [sortedRecruits, hideSigned, hideVerballyCommitted, showUserCommitsOnly, isSigningPeriod, positionFilter, starFilter, minInterest, targetsOnly, searchQuery, userTeamName, regionFilter, homeStateFilter, maxDistanceMiles, stageFilter, needsFitOnly, state.userTeam]);

    const requestSort = (key: SortableKey) => {
        let direction: 'ascending' | 'descending' = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const renderSortArrow = (key: SortableKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    if (!state.userTeam) return null;
    
    const totalScholarships = calculateAvailableScholarships(state.userTeam);
    const offersMade = state.recruits.filter(r => r.userHasOffered && r.verbalCommitment !== state.userTeam!.name).length;
    const committedRecruits = state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name).length;
    const availableScholarships = totalScholarships - offersMade - committedRecruits;
    const targetedRecruits = state.recruits.filter(r => r.isTargeted).length;
    const contactPointsRemaining = Math.max(0, getContactPoints(state.userTeam) - state.contactsMadeThisWeek);
    const positionOptions: (RosterPositions | 'all')[] = ['all', 'PG', 'SG', 'SF', 'PF', 'C'];
    const starOptions: ('all' | 1 | 2 | 3 | 4 | 5)[] = ['all', 5, 4, 3, 2, 1];
	    const filtersActive =
	        hideVerballyCommitted ||
	        hideSigned ||
	        showUserCommitsOnly ||
	        positionFilter !== 'all' ||
	        starFilter !== 'all' ||
	        minInterest > 0 ||
	        targetsOnly ||
	        regionFilter !== 'all' ||
	        homeStateFilter !== 'all' ||
	        maxDistanceMiles < 2500 ||
	        stageFilter !== 'all' ||
	        needsFitOnly ||
	        searchQuery.trim().length > 0;

	    const resetRecruitFilters = () => {
	        setHideVerballyCommitted(false);
	        setHideSigned(false);
	        setShowUserCommitsOnly(false);
	        setPositionFilter('all');
	        setStarFilter('all');
	        setMinInterest(0);
	        setTargetsOnly(false);
	        setSearchQuery('');
	        setRegionFilter('all');
	        setHomeStateFilter('all');
	        setMaxDistanceMiles(2500);
	        setStageFilter('all');
	        setNeedsFitOnly(false);
	    };

	    const scholarshipTextStyle: React.CSSProperties = {
	        color: availableScholarships < 0 ? '#B22222' : 'inherit',
	        fontWeight: availableScholarships < 0 ? 'bold' : 'normal',
	        textAlign: 'right'
	    };
	
	    const teamsByName = useMemo(() => new Map(state.allTeams.map(t => [t.name, t])), [state.allTeams]);
	    const topTwoByRecruitId = useMemo(() => {
	        const map = new Map<string, { leader?: string; second?: string }>();
	        if (!showColTop2) return map;
	        state.recruits.forEach(r => {
	            const offerNames = [...(r.cpuOffers || []), ...(r.userHasOffered ? [state.userTeam!.name] : [])];
	            if (offerNames.length === 0) return;
	            const details = offerNames
	                .map(teamName => {
	                    const team = teamsByName.get(teamName);
	                    if (!team) return null;
	                    return { name: teamName, score: calculateRecruitInterestScore(r, team, { gameInSeason: state.gameInSeason }) };
	                })
	                .filter(Boolean) as { name: string; score: number }[];
	            if (!details.length) return;
	            details.sort((a, b) => b.score - a.score);
	            const { shortlist } = buildRecruitOfferShortlist(details, { min: 3, max: 6, leaderWindow: 10 });
	            const leader = shortlist[0]?.name || details[0]?.name;
	            const second = shortlist[1]?.name || details[1]?.name;
	            map.set(r.id, { leader, second });
	        });
	        return map;
	    }, [showColTop2, state.recruits, state.userTeam, state.allTeams, state.gameInSeason, teamsByName]);

	    return (
	        <div>
	            {viewingOffersFor && (
	                <OffersModal 
                    recruit={viewingOffersFor} 
                    userTeamName={state.userTeam.name}
                    allTeams={state.allTeams}
                    gameInSeason={state.gameInSeason}
                    onOpenRecruitId={(recruitId) => {
                      const related = state.recruits.find(r => r.id === recruitId);
                      if (related) setViewingOffersFor(related);
                    }}
                    contactPointsUsed={state.contactsMadeThisWeek}
                    contactPointsMax={getContactPoints(state.userTeam)}
                    scoutLevel={state.userTeam?.scoutingReports?.[viewingOffersFor.id] || 0}
                    actionsDisabled={!!viewingOffersFor.verbalCommitment && viewingOffersFor.verbalCommitment !== state.userTeam.name}
                    onContactRecruit={() => dispatch({ type: 'CONTACT_RECRUIT', payload: { recruitId: viewingOffersFor.id } })}
                    onOfferScholarship={() => setOfferingScholarshipFor(viewingOffersFor)}
                    onPullOffer={() => dispatch({ type: 'PULL_SCHOLARSHIP', payload: { recruitId: viewingOffersFor.id } })}
                    onCoachVisit={() => dispatch({ type: 'COACH_VISIT', payload: { recruitId: viewingOffersFor.id } })}
                    onScheduleOfficialVisit={() => setSchedulingVisitFor(viewingOffersFor)}
                    onScout={() => dispatch({ type: 'SCOUT_RECRUIT', payload: { recruitId: viewingOffersFor.id, cost: 3 } })}
                    onNegativeRecruit={() => setNegativeRecruitingFor(viewingOffersFor)}
                    onClose={() => setViewingOffersFor(null)} 
	                />
	            )}
	            {offeringScholarshipFor && (
	                <OfferScholarshipModal
	                    recruit={offeringScholarshipFor}
	                    onClose={() => setOfferingScholarshipFor(null)}
	                    dispatch={dispatch}
	                />
	            )}
	            {showRecruitingAnalytics && (
	                <RecruitingAnalyticsModal
	                    recruits={state.recruits}
	                    allTeams={state.allTeams}
	                    userTeam={state.userTeam}
	                    gameInSeason={state.gameInSeason}
	                    onClose={() => setShowRecruitingAnalytics(false)}
	                />
	            )}
	            {negativeRecruitingFor && (
	                <NegativeRecruitingModal 
                    recruit={negativeRecruitingFor} 
                    onClose={() => setNegativeRecruitingFor(null)} 
                    dispatch={dispatch}
                />
            )}
            {schedulingVisitFor && state.userTeam && (
                <ScheduleVisitModal
                    recruit={schedulingVisitFor}
                    currentWeek={state.week}
                    userTeamName={state.userTeam.name}
                    schedule={state.schedule}
                    onClose={() => setSchedulingVisitFor(null)}
                    dispatch={dispatch}
                />
            )}
            <div style={styles.recruitingHeader}>
                <div>
                    <p>Contacts made this {isSigningPeriod ? 'day' : 'week'}: {state.contactsMadeThisWeek}/{getContactPoints(state.userTeam)}</p>
                    <p style={{ fontSize: '0.6rem', marginTop: '5px', color: '#555' }}>{teamNeeds}</p>
                    <div style={styles.searchBarRow}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search recruits by name..."
                            style={styles.searchInput}
                        />
                        <button
                            style={{ ...styles.clearFiltersButton, opacity: filtersActive ? 1 : 0.6 }}
                            onClick={resetRecruitFilters}
                            disabled={!filtersActive}
                        >
                            Clear Filters
                        </button>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.6rem', color: '#333' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="checkbox"
                                checked={hideVerballyCommitted}
                                onChange={e => setHideVerballyCommitted(e.target.checked)}
                            />
                            Hide verbally committed
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="checkbox"
                                checked={hideSigned}
                                onChange={e => setHideSigned(e.target.checked)}
                            />
                            Hide signed
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="checkbox"
                                checked={showUserCommitsOnly}
                                onChange={e => setShowUserCommitsOnly(e.target.checked)}
                            />
                            My commits only
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="checkbox"
                                checked={targetsOnly}
                                onChange={e => setTargetsOnly(e.target.checked)}
                            />
                            Targets only
                        </label>
                    </div>
	                    <div style={styles.recruitFiltersRow}>
	                        <label style={styles.filterControl}>
	                            <span>Position</span>
	                            <select value={positionFilter} onChange={e => setPositionFilter(e.target.value as 'all' | RosterPositions)}>
	                                {positionOptions.map(option => (
	                                    <option key={option} value={option}>
	                                        {option === 'all' ? 'All' : option}
	                                    </option>
	                                ))}
	                            </select>
	                        </label>
	                        <label style={styles.filterControl}>
	                            <span>Stars</span>
	                            <select value={starFilter} onChange={e => setStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}>
	                                {starOptions.map(option => (
	                                    <option key={option} value={option}>
	                                        {option === 'all' ? 'All' : `${option}-Star`}
	                                    </option>
	                                ))}
	                            </select>
	                        </label>
	                        <label style={styles.filterControl}>
	                            <span>Region</span>
	                            <select value={regionFilter} onChange={e => setRegionFilter(e.target.value as any)}>
	                                <option value="all">All</option>
	                                <option value="Northeast">Northeast</option>
	                                <option value="Midwest">Midwest</option>
	                                <option value="South">South</option>
	                                <option value="West">West</option>
	                            </select>
	                        </label>
	                        <label style={styles.filterControl}>
	                            <span>State</span>
	                            <select value={homeStateFilter} onChange={e => setHomeStateFilter(e.target.value)}>
	                                <option value="all">All</option>
	                                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
	                            </select>
	                        </label>
	                        <label style={styles.filterControl}>
	                            <span>Stage</span>
	                            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
	                                <option value="all">All</option>
	                                <option value="Open">Open</option>
	                                <option value="Narrowing">Narrowing</option>
	                                <option value="SoftCommit">Soft Commit</option>
	                                <option value="HardCommit">Hard Commit</option>
	                                <option value="Signed">Signed</option>
	                            </select>
	                        </label>
	                        <label style={{ ...styles.filterControl, flex: '2 1 220px' }}>
	                            <span>Minimum Interest: {minInterest}%</span>
	                            <input
	                                type="range"
	                                min={0}
	                                max={100}
	                                value={minInterest}
	                                onChange={e => setMinInterest(parseInt(e.target.value))}
	                            />
	                        </label>
	                        <label style={{ ...styles.filterControl, flex: '2 1 220px' }}>
	                            <span>Max Distance: {maxDistanceMiles} mi</span>
	                            <input
	                                type="range"
	                                min={0}
	                                max={2500}
	                                step={50}
	                                value={maxDistanceMiles}
	                                onChange={e => setMaxDistanceMiles(parseInt(e.target.value))}
	                            />
	                        </label>
	                        <label style={{ ...styles.filterControl, flex: '0 0 auto', alignItems: 'center' }}>
	                            <span>Needs Fit</span>
	                            <input type="checkbox" checked={needsFitOnly} onChange={e => setNeedsFitOnly(e.target.checked)} />
	                        </label>
	                    </div>
	                    <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.6rem', color: '#333' }}>
	                        <span style={{ fontWeight: 'bold' }}>Columns:</span>
	                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
	                            <input type="checkbox" checked={showColLocation} onChange={e => setShowColLocation(e.target.checked)} />
	                            Location
	                        </label>
	                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
	                            <input type="checkbox" checked={showColHighSchool} onChange={e => setShowColHighSchool(e.target.checked)} />
	                            HS
	                        </label>
	                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
	                            <input type="checkbox" checked={showColNationalRank} onChange={e => setShowColNationalRank(e.target.checked)} />
	                            Nat Rank
	                        </label>
	                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
	                            <input type="checkbox" checked={showColStage} onChange={e => setShowColStage(e.target.checked)} />
	                            Stage
	                        </label>
	                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
	                            <input type="checkbox" checked={showColTop2} onChange={e => setShowColTop2(e.target.checked)} />
	                            Top 2
	                        </label>
	                    </div>
	                </div>
	                <div style={{ textAlign: 'right' }}>
	                    <p style={scholarshipTextStyle}>Available Scholarships: {availableScholarships}/{totalScholarships}</p>
	                    <button style={{ ...styles.smallButton, marginTop: '6px' }} onClick={() => setShowRecruitingAnalytics(true)}>
	                        Analytics
	                    </button>
	                </div>
	            </div>
            <div style={styles.tableContainer}>
            <table style={{...styles.table, fontSize: '0.6rem'}}>
	                <thead style={styles.recruitingThead}>
	                    <tr>
	                        <th style={{...styles.th, width: '8%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('rank')}>Rank {renderSortArrow('rank')}</th>
	                        <th style={{...styles.th, width: '18%', backgroundColor: colors.primary, color: colors.text}}>Name</th>
	                        {showColLocation && <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Loc</th>}
	                        {showColHighSchool && <th style={{...styles.th, width: '12%', backgroundColor: colors.primary, color: colors.text}}>HS</th>}
	                        {showColNationalRank && <th style={{...styles.th, width: '7%', backgroundColor: colors.primary, color: colors.text}}>Nat</th>}
	                        <th style={{...styles.th, width: '12%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('stars')}>Stars</th>
	                        <th style={{...styles.th, width: '8%', backgroundColor: colors.primary, color: colors.text}}>Pos</th>
	                        <th style={{...styles.th, width: '12%', backgroundColor: colors.primary, color: colors.text}}>Archetype</th>
	                        <th style={{...styles.th, width: '6%', backgroundColor: colors.primary, color: colors.text}}>Ht</th>
	                        <th style={{...styles.th, width: '6%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('overall')}>OVR {renderSortArrow('overall')}</th>
	                        <th style={{...styles.th, width: '6%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('potential')}>Pot {renderSortArrow('potential')}</th>
	                        <th style={{...styles.th, width: '6%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('interest')}>Int {renderSortArrow('interest')}</th>
	                        {showColStage && <th style={{...styles.th, width: '8%', backgroundColor: colors.primary, color: colors.text}}>Stage</th>}
	                        {showColTop2 && <th style={{...styles.th, width: '14%', backgroundColor: colors.primary, color: colors.text}}>Top 2</th>}
	                        <th style={{...styles.th, width: '15%', backgroundColor: colors.primary, color: colors.text}}>Status</th>
	                        <th style={{...styles.th, width: '15%', backgroundColor: colors.primary, color: colors.text}}>Top Motivations</th>
	                        <th style={{...styles.th, width: '11%', backgroundColor: colors.primary, color: colors.text}}>Actions</th>
	                        <th style={{...styles.th, width: '8%', backgroundColor: colors.primary, color: colors.text}}>Target</th>
	                    </tr>
	                </thead>
                <tbody>
                    {filteredRecruits.map(r => {
                        const totalOffers = r.cpuOffers.length + (r.userHasOffered ? 1 : 0);
                        const userHasOffered = r.userHasOffered;
                        const rank = recruitRanks.get(r.id);
                        const hasUserDeclined = r.declinedOffers.includes(state.userTeam!.name);
                        const isCommittedToUser = r.verbalCommitment === state.userTeam!.name;
                        const isCommittedToOther = !!r.verbalCommitment && !isCommittedToUser;
                        const isCommittedAndLocked = !!isSigningPeriod && !!r.verbalCommitment;
                        const committedTeamRank = r.verbalCommitment ? powerRankings.get(r.verbalCommitment) : undefined;

                        const rowStyle: React.CSSProperties = {};
                        if (isCommittedToUser) {
                            rowStyle.backgroundColor = '#90EE90'; // Light Green for user commits
                        } else if (hasUserDeclined) {
                            rowStyle.backgroundColor = '#FFD2D2'; // Light Red for declines
                        } else if (isSigningPeriod && isCommittedToOther) {
                            rowStyle.backgroundColor = '#FFDAB9'; // Orange for signed with CPU
                        } else if (isCommittedToOther) {
                            rowStyle.backgroundColor = '#ADD8E6'; // Blue for verbal with CPU
                        } else if (userHasOffered) {
                            rowStyle.backgroundColor = '#FFFFAA'; // Yellow for offers
                        }

                        const interestTier = getInterestTier(r.interest);

                        return (
                            <tr key={r.id} style={rowStyle}>
                                <td style={styles.td}>{rank ? `#${rank}` : 'UR'}</td>
                                <td style={styles.td}>
                                    <button onClick={() => setViewingOffersFor(r)} style={{ ...styles.linkButton, fontWeight: 'bold' }}>
                                        {r.name}
                                    </button>
                                    {(r.hometownCity || r.hometownState || r.highSchoolName) && (
                                        <div
                                            style={{ fontSize: '0.55rem', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            title={[r.hometownCity, r.hometownState].filter(Boolean).join(', ') + (r.highSchoolName ? ` - ${r.highSchoolName}` : '')}
                                        >
                                            {[r.hometownCity, r.hometownState].filter(Boolean).join(', ')}
                                            {r.highSchoolName ? ` - ${r.highSchoolName}` : ''}
                                        </div>
                                    )}
                                    {(state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 && r.isGem && <span title="Gem" style={{marginLeft: '5px'}}>ðŸ’Ž</span>}
                                    {(state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 && r.isBust && <span title="Bust" style={{marginLeft: '5px'}}>ðŸ’”</span>}
	                                </td>
	                                {showColLocation && (
	                                    <td style={styles.td} title={`Est. distance: ${estimateRecruitDistanceMilesToTeam(r, state.userTeam!).toLocaleString()} mi`}>
	                                        {[r.hometownCity, r.hometownState || r.homeState].filter(Boolean).join(', ') || '—'}
	                                    </td>
	                                )}
	                                {showColHighSchool && (
	                                    <td style={styles.td} title={r.highSchoolName || ''}>
	                                        {r.highSchoolName || '—'}
	                                    </td>
	                                )}
	                                {showColNationalRank && (
	                                    <td style={styles.td}>{r.nationalRank ? `#${r.nationalRank}` : '—'}</td>
	                                )}
	                                <td style={styles.td}><StarRating stars={r.stars}/></td>
                                <td style={styles.td}>{r.position}{r.secondaryPosition ? `/${r.secondaryPosition}` : ''}</td>
                                <td style={{...styles.td, maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={r.archetype}>{r.archetype || 'N/A'}</td>
                                <td style={styles.td}>{formatPlayerHeight(r.height)}</td>
                                <td style={styles.td}>{r.overall}</td>
                                <td style={styles.td}>{formatPotentialValue(r.potential)}</td>
                                <td style={styles.td}>
                                    <div style={styles.interestCell}>
                                        <div style={styles.interestBarTrack}>
                                            <div style={{ ...styles.interestBarFill, width: `${r.interest}%`, backgroundColor: interestTier.color }} />
                                        </div>
                                        <div style={styles.interestBadge}>
                                            <span>{r.interest}%</span>
                                            <span>{interestTier.label}</span>
	                                        </div>
	                                    </div>
	                                </td>
	                                {showColStage && (
	                                    <td style={styles.td}>{r.recruitmentStage || (r.verbalCommitment ? 'HardCommit' : 'Open')}</td>
	                                )}
	                                {showColTop2 && (
	                                    <td style={styles.td}>
	                                        {(() => {
	                                            const top2 = topTwoByRecruitId.get(r.id);
	                                            if (!top2?.leader) return '—';
	                                            return (
	                                                <span title={top2.second ? `${top2.leader} / ${top2.second}` : top2.leader}>
	                                                    <strong>{top2.leader}</strong>
	                                                    {top2.second ? ` / ${top2.second}` : ''}
	                                                </span>
	                                            );
	                                        })()}
	                                    </td>
	                                )}
	                                <td style={{...styles.td, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }}>
	                                    {r.verbalCommitment ? (
	                                        <CommitmentStatus teamName={r.verbalCommitment} teamRank={committedTeamRank} isSigningPeriod={!!isSigningPeriod} isSoftCommit={!isSigningPeriod ? r.softCommitment : undefined} />
	                                    ) : hasUserDeclined ? (
	                                        <span style={{color: 'red'}}>Offer Declined</span>
	                                    ) : totalOffers > 0 ? (
	                                        <button onClick={() => setViewingOffersFor(r)} style={styles.linkButton}>{totalOffers} Offers</button>
                                    ) : 'Undecided'}
                                </td>
                                <td style={styles.td}>
                                    <MotivationDisplay motivations={r.motivations} />
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGrid}>
                                        <button
                                          style={styles.smallButton}
                                          onClick={() => dispatch({ type: 'CONTACT_RECRUIT', payload: { recruitId: r.id } })}
                                          disabled={isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 1 > getContactPoints(state.userTeam)}
                                        >
                                          {userHasOffered ? 'Maintain (1)' : 'Contact (1)'}
                                        </button>
                                        {userHasOffered ? (
                                          <button style={styles.pullButton} onClick={() => dispatch({type: 'PULL_SCHOLARSHIP', payload: {recruitId: r.id}})} disabled={isCommittedAndLocked}>
                                            Pull Offer
                                          </button>
                                        ) : (
	                                        <button style={styles.smallButton} onClick={() => setOfferingScholarshipFor(r)} disabled={isCommittedAndLocked || hasUserDeclined || isCommittedToOther || state.contactsMadeThisWeek + 9 > getContactPoints(state.userTeam)}>Offer (9)</button>
                                        )}
                                        <button style={styles.smallButton} onClick={() => dispatch({ type: 'COACH_VISIT', payload: { recruitId: r.id } })} disabled={isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 5 > getContactPoints(state.userTeam)}>Coach Visit (5)</button>
                                        <button style={styles.smallButton} onClick={() => setSchedulingVisitFor(r)} disabled={isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 8 > getContactPoints(state.userTeam)}>Official Visit (8)</button>
                                        <button 
                                            style={styles.smallButton} 
                                            onClick={() => dispatch({ type: 'SCOUT_RECRUIT', payload: { recruitId: r.id, cost: 3 } })} 
                                            disabled={isCommittedAndLocked || (state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 || state.contactsMadeThisWeek + 3 > getContactPoints(state.userTeam)}
                                        >
                                            Scout ({(state.userTeam?.scoutingReports?.[r.id] || 0)}/3) (3)
                                        </button>
                                        <button
                                            style={styles.smallButton}
                                            onClick={() => setNegativeRecruitingFor(r)}
                                            disabled={contactPointsRemaining <= 0}
                                        >
                                            Negative Recruit
                                        </button>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <button 
                                        style={{ ...styles.smallButton, backgroundColor: r.isTargeted ? '#4CAF50' : '#C0C0C0' }}
                                        onClick={() => dispatch({ type: 'TOGGLE_RECRUIT_TARGET', payload: { recruitId: r.id } })}
                                    >
                                        {r.isTargeted ? 'Targeted' : 'Target'}
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            </div>
        </div>
    );
}

const NegativeRecruitingModal = ({ recruit, onClose, dispatch }: { recruit: Recruit, onClose: () => void, dispatch: React.Dispatch<GameAction> }) => {
    const [targetSchool, setTargetSchool] = useState<string>('');
    const [method, setMethod] = useState<'Rumors' | 'Violations' | 'Academics'>('Rumors');

    const handleSubmit = () => {
        if (!targetSchool) {
            // Or show some error to the user
            return;
        }
        dispatch({
            type: 'NEGATIVE_RECRUIT',
            payload: {
                recruitId: recruit.id,
                targetSchool,
                method,
            },
        });
        onClose();
    };

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <h2>Negative Recruit: {recruit.name}</h2>
                <p>Choose a rival school to target and a method of negative recruiting. This will cost 1 contact point.</p>
                
                <div style={{ margin: '20px 0' }}>
                    <label>
                        Target School:
                        <select value={targetSchool} onChange={(e) => setTargetSchool(e.target.value)}>
                            <option value="">Select a school</option>
                            {recruit.cpuOffers.map(offer => (
                                <option key={offer} value={offer}>{offer}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div style={{ margin: '20px 0' }}>
                    <p>Method:</p>
                    <label>
                        <input type="radio" value="Rumors" checked={method === 'Rumors'} onChange={() => setMethod('Rumors')} />
                        Spread Rumors (Low risk, low reward)
                    </label>
                    <label>
                        <input type="radio" value="Violations" checked={method === 'Violations'} onChange={() => setMethod('Violations')} />
                        Report Violations (High risk, high reward)
                    </label>
                    <label>
                        <input type="radio" value="Academics" checked={method === 'Academics'} onChange={() => setMethod('Academics')} />
                        Question Academics (Medium risk, medium reward)
                    </label>
                </div>

                <button onClick={handleSubmit} disabled={!targetSchool}>Submit</button>
                <button onClick={onClose} style={{ marginLeft: '10px' }}>Cancel</button>
            </div>
        </div>
    );
};

const OfferScholarshipModal = ({ recruit, onClose, dispatch }: { recruit: Recruit; onClose: () => void; dispatch: React.Dispatch<GameAction> }) => {
    const [pitchType, setPitchType] = useState<OfferPitchType>('Standard');

    const options: { value: OfferPitchType; label: string; desc: string }[] = [
        { value: 'Standard', label: 'Standard', desc: 'Balanced pitch.' },
        { value: 'EarlyPush', label: 'Early Push', desc: 'Press urgency and momentum early.' },
        { value: 'NILHeavy', label: 'NIL Heavy', desc: 'Lead with NIL opportunities.' },
        { value: 'PlayingTimePromise', label: 'Playing Time Promise', desc: 'Emphasize role clarity and minutes.' },
        { value: 'LocalAngle', label: 'Local Angle', desc: 'Family/proximity/hometown focus.' },
        { value: 'AcademicPitch', label: 'Academic Pitch', desc: 'Sell academics and support systems.' },
    ];

    const handleSubmit = () => {
        dispatch({ type: 'OFFER_SCHOLARSHIP', payload: { recruitId: recruit.id, pitchType } });
        onClose();
    };

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <h2>Offer Scholarship: {recruit.name}</h2>
                <p style={{ fontSize: '0.75rem', color: '#555' }}>Choose a pitch type. This can change how the recruit evaluates your offer.</p>

                <div style={{ margin: '15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map(opt => (
                        <label key={opt.value} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <input
                                type="radio"
                                value={opt.value}
                                checked={pitchType === opt.value}
                                onChange={() => setPitchType(opt.value)}
                            />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{opt.label}</div>
                                <div style={{ fontSize: '0.7rem', color: '#666' }}>{opt.desc}</div>
                            </div>
                        </label>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button style={styles.smallButton} onClick={onClose}>Cancel</button>
                    <button style={{ ...styles.smallButton, backgroundColor: '#4CAF50', color: '#fff' }} onClick={handleSubmit}>Make Offer</button>
                </div>
            </div>
        </div>
    );
};

const RecruitingAnalyticsModal = ({ recruits, allTeams, userTeam, gameInSeason, onClose }: { recruits: Recruit[]; allTeams: Team[]; userTeam: Team; gameInSeason: number; onClose: () => void }) => {
    const teamsByName = useMemo(() => new Map(allTeams.map(t => [t.name, t])), [allTeams]);

    const metrics = useMemo(() => {
        const top100 = recruits.filter(r => typeof r.nationalRank === 'number' && r.nationalRank <= 100);
        const topPool = top100.length ? top100 : recruits.slice().sort((a, b) => (a.overall * 0.7 + a.potential * 0.3) - (b.overall * 0.7 + b.potential * 0.3)).slice(-100);

        const committed = (r: Recruit) => Boolean(r.verbalCommitment) || ['SoftCommit', 'HardCommit', 'Signed'].includes(r.recruitmentStage || '');
        const committedTop = topPool.filter(committed).length;

        const offersCount = (r: Recruit) => (r.cpuOffers?.length || 0) + (r.userHasOffered ? 1 : 0);
        const avgOffersTop = topPool.length ? topPool.reduce((s, r) => s + offersCount(r), 0) / topPool.length : 0;

        const shortlistSizes = topPool.map(r => {
            const offerNames = [...(r.cpuOffers || []), ...(r.userHasOffered ? [userTeam.name] : [])];
            const details = offerNames
                .map(name => {
                    const team = teamsByName.get(name);
                    if (!team) return null;
                    return { name, score: calculateRecruitInterestScore(r, team, { gameInSeason }) };
                })
                .filter(Boolean) as { name: string; score: number }[];
            if (!details.length) return 0;
            const { shortlist } = buildRecruitOfferShortlist(details, { min: 3, max: 6, leaderWindow: 10 });
            return shortlist.length;
        }).filter(n => n > 0);
        const avgShortlist = shortlistSizes.length ? shortlistSizes.reduce((a, b) => a + b, 0) / shortlistSizes.length : 0;

        const stageCounts = recruits.reduce((acc, r) => {
            const stage = r.recruitmentStage || (r.verbalCommitment ? 'HardCommit' : 'Open');
            acc[stage] = (acc[stage] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const reopenCount = recruits.filter(r => (r.lastRecruitingNews || '').toLowerCase().includes('reopened')).length;

        return {
            topPoolSize: topPool.length,
            committedTop,
            committedTopPct: topPool.length ? (committedTop / topPool.length) * 100 : 0,
            avgOffersTop,
            avgShortlist,
            stageCounts,
            reopenCount,
        };
    }, [recruits, teamsByName, userTeam.name, gameInSeason]);

    return (
        <div style={styles.modalBackdrop}>
            <div style={{ ...styles.modalContent, maxWidth: '900px' }}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h2 style={{ marginTop: 0 }}>Recruiting Analytics</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                    <div><strong>Top-{metrics.topPoolSize} committed:</strong> {metrics.committedTop} ({metrics.committedTopPct.toFixed(1)}%)</div>
                    <div><strong>Avg offers (top):</strong> {metrics.avgOffersTop.toFixed(1)}</div>
                    <div><strong>Avg shortlist size (top):</strong> {metrics.avgShortlist.toFixed(1)}</div>
                    <div><strong>Reopens:</strong> {metrics.reopenCount}</div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.8rem' }}>
                    <h4 style={{ margin: '10px 0 6px 0' }}>Stage Breakdown</h4>
                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
                        {Object.entries(metrics.stageCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                            <li key={k}>{k}: {v}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const ScheduleVisitModal = ({ recruit, currentWeek, userTeamName, schedule, onClose, dispatch }: {
    recruit: Recruit;
    currentWeek: number;
    userTeamName: string;
    schedule: GameResult[][];
    onClose: () => void;
    dispatch: React.Dispatch<GameAction>;
}) => {
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

    const availableWeeks = useMemo(() => {
        const weeks: { week: number; opponent: string; isRivalry: boolean }[] = [];
        for (let i = currentWeek; i < schedule.length; i++) {
            const weekSchedule = schedule[i];
            const homeGame = weekSchedule.find(game => game.homeTeam === userTeamName);
            if (homeGame) {
                const opponent = homeGame.awayTeam;
                // TODO: Implement rivalry logic based on team data or constants
                const isRivalry = false; 
                weeks.push({ week: i + 1, opponent, isRivalry });
            }
        }
        return weeks;
    }, [currentWeek, schedule, userTeamName]);

    const handleSchedule = () => {
        if (selectedWeek) {
            dispatch({ type: 'SCHEDULE_VISIT', payload: { recruitId: recruit.id, week: selectedWeek } });
            onClose();
        }
    };

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <h2>Schedule Official Visit for {recruit.name}</h2>
                <p>Select a week for {recruit.name}'s official visit. Visiting during a big home game can significantly boost interest!</p>

                <div style={{ margin: '20px 0' }}>
                    <label>
                        Visit Week:
                        <select value={selectedWeek || ''} onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}>
                            <option value="">Select a week</option>
                            {availableWeeks.map(weekInfo => (
                                <option key={weekInfo.week} value={weekInfo.week}>
                                    Week {weekInfo.week}: vs {weekInfo.opponent} {weekInfo.isRivalry && '(Rivalry)'}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <button onClick={handleSchedule} disabled={!selectedWeek}>Schedule Visit</button>
                <button onClick={onClose} style={{ marginLeft: '10px' }}>Cancel</button>
            </div>
        </div>
    );
};

const Recruiting = (props: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => <RecruitingViewInner {...props} isSigningPeriod={false} />;

const Standings = ({ state, colors, dispatch }: { state: GameState, colors: TeamColors, dispatch: React.Dispatch<GameAction> }) => {
const [selectedTab, setSelectedTab] = useState<'standings' | 'playerStats' | 'mockDraft'>('standings');

  const sortedTeams = useMemo(() => {
    const teamsWithPower = [...state.allTeams]
      .map(t => ({...t, power: t.record.wins * 2 + t.prestige / 10, conference: t.conference || 'Independent'}))
      .sort((a,b) => b.power - a.power);

    const conferenceBuckets = new Map<string, typeof teamsWithPower>();
    teamsWithPower.forEach(team => {
      if (!conferenceBuckets.has(team.conference)) {
        conferenceBuckets.set(team.conference, []);
      }
      conferenceBuckets.get(team.conference)!.push(team);
    });

    const conferenceRanks = new Map<string, number>();
    conferenceBuckets.forEach(bucket => {
      bucket.sort((a, b) => b.power - a.power);
      bucket.forEach((team, idx) => {
        conferenceRanks.set(team.name, idx + 1);
      });
    });

    return teamsWithPower.map(team => ({
      ...team,
      conferenceRank: conferenceRanks.get(team.name) || null,
    }));
  }, [state.allTeams]);

  const buttonTextColorForInactive = (colors.secondary.toUpperCase() === '#FFFFFF' && colors.text.toUpperCase() === '#FFFFFF') ? colors.primary : colors.text;

  return (
    <div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setSelectedTab('standings')} style={{...styles.button, flex: 1, backgroundColor: selectedTab === 'standings' ? colors.primary : colors.secondary, color: selectedTab === 'standings' ? colors.text : buttonTextColorForInactive}}>National Rankings</button>
            <button onClick={() => setSelectedTab('playerStats')} style={{...styles.button, flex: 1, backgroundColor: selectedTab === 'playerStats' ? colors.primary : colors.secondary, color: selectedTab === 'playerStats' ? colors.text : buttonTextColorForInactive}}>Player Stats</button>
            <button onClick={() => setSelectedTab('mockDraft')} style={{...styles.button, flex: 1, backgroundColor: selectedTab === 'mockDraft' ? colors.primary : colors.secondary, color: selectedTab === 'mockDraft' ? colors.text : buttonTextColorForInactive}}>Mock Draft</button>
        </div>
        {selectedTab === 'standings' ? (
            <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead><tr>
                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Rank</th>
                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Team</th>
                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Conference</th>
                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Record</th>
                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Prestige</th>
            </tr></thead>
            <tbody>
              {sortedTeams.map((t, i) => <tr key={t.name}>
                <td style={styles.td}>{i + 1}</td>
                <td style={{...styles.td, color: t.name === state.userTeam?.name ? colors.primary : '#000000', fontWeight: t.name === state.userTeam?.name ? 'bold' : 'normal' }}>{t.name}</td>
                <td style={styles.td}>{t.conference}{t.conferenceRank ? ` (#${t.conferenceRank})` : ''}</td>
                <td style={styles.td}>{t.record.wins}-{t.record.losses}</td>
                <td style={styles.td}>{t.prestige}</td>
              </tr>)}
            </tbody>
          </table>
          </div>
        ) : selectedTab === 'playerStats' ? (
            <PlayerStats state={state} colors={colors} />
        ) : (
            <MockDraftView state={state} colors={colors} dispatch={dispatch} />
        )}
    </div>
  )
};

const TeamBox = ({ name, seed, score, played, conference, isUserTeam, userTeamColors, isWinner }: { name: string; seed: number; score: number; played: boolean, conference?: string, isUserTeam: boolean; userTeamColors: TeamColors; isWinner: boolean }) => {
    const isPlaceholder = !name || name.startsWith('FF Winner');
    const teamColors = isPlaceholder ? { primary: '#C0C0C0', secondary: '#808080', text: '#000000' } : SCHOOL_COLORS[name] || { primary: '#C0C0C0', secondary: '#808080', text: '#000000' };
    
    const style: React.CSSProperties = {
        ...styles.button,
        backgroundColor: teamColors.primary,
        color: teamColors.text,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5px 8px',
        fontSize: '0.9rem',
        marginBottom: 0,
        width: '100%',
        textAlign: 'center',
        height: '75px', // Ensure consistent height for 3 lines of text
    };
    
    if (isUserTeam) {
        style.border = `3px solid ${userTeamColors.secondary}`;
        style.boxShadow = `0 0 8px ${userTeamColors.secondary}`;
    }

    return (
        <div style={style}>
            <span style={{ flexGrow: 1, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                (#{seed}) {name} {conference && `(${conference})`}
            </span>
            {played && <span style={{
                flexShrink: 0,
                marginLeft: '10px',
                backgroundColor: '#E0E0E0',
                color: isWinner ? 'green' : '#000000',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '0.8rem',
            }}>{score}</span>}
        </div>
    );
};

type MatchupProps = {
    matchup: TournamentMatchup;
    teamsByName: Map<string, Team>;
    userTeamName: string;
    userTeamColors: TeamColors;
};

// FIX: Changed component signature to use React.FC to correctly handle the 'key' prop type issue.
const Matchup: React.FC<MatchupProps> = ({ matchup, teamsByName, userTeamName, userTeamColors }) => (
    <div style={{ marginBottom: '15px', width: '280px' }}>
        <TeamBox name={matchup.homeTeam} seed={matchup.homeSeed} score={matchup.homeScore} played={matchup.played} conference={teamsByName.get(matchup.homeTeam)?.conference} isUserTeam={matchup.homeTeam === userTeamName} userTeamColors={userTeamColors} isWinner={matchup.played && matchup.homeScore > matchup.awayScore} />
        <p style={{ textAlign: 'center', margin: '2px 0', fontSize: '0.6rem' }}>vs</p>
        <TeamBox name={matchup.awayTeam} seed={matchup.awaySeed} score={matchup.awayScore} played={matchup.played} conference={teamsByName.get(matchup.awayTeam)?.conference} isUserTeam={matchup.awayTeam === userTeamName} userTeamColors={userTeamColors} isWinner={matchup.played && matchup.awayScore > matchup.homeScore} />
    </div>
);

type RegionBracketProps = {
    name: string;
    rounds: TournamentMatchup[][];
    teamsByName: Map<string, Team>;
    align?: 'left' | 'right';
    userTeamName: string;
    userTeamColors: TeamColors;
};

// FIX: Changed component signature to use React.FC to correctly handle the 'key' prop type issue.
const RegionBracket: React.FC<RegionBracketProps> = ({ name, rounds, teamsByName, align = 'left', userTeamName, userTeamColors }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h4 style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: align === 'left' ? 'rotate(180deg)' : 'none', marginBottom: '10px' }}>{name}</h4>
        <div style={{ display: 'flex', gap: '20px', flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
            {rounds.map((round, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                    {round.map((matchup, j) => <Matchup key={`${i}-${j}`} matchup={matchup} teamsByName={teamsByName} userTeamName={userTeamName} userTeamColors={userTeamColors}/>)}
                </div>
            ))}
        </div>
    </div>
);


const TournamentView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const [viewMode, setViewMode] = useState<'round' | 'full'>('round');
    const [selectedRound, setSelectedRound] = useState(0);

    const teamsByName: Map<string, Team> = useMemo(() => new Map(state.allTeams.map(t => [t.name, t])), [state.allTeams]);

    const { tournament, userTeam } = state;
    const userTeamName = userTeam?.name || '';

    const roundNames = ['First Four', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'];
    const maxRounds = roundNames.length;

    useEffect(() => {
        if (!tournament) return;

        const findFirstUnplayedRoundIndex = () => {
            if (!tournament.firstFour.every(m => m.played)) return 0;
            const firstUnplayedRegional = Object.values(tournament.regions)
                .flatMap(r => r.flat())
                .find(m => !m.played);
            if (firstUnplayedRegional) {
                for (const region of Object.values(tournament.regions)) {
                    for (let i = 0; i < region.length; i++) {
                        if (region[i].some(m => !m.played)) {
                            return i + 1; // +1 to account for first four
                        }
                    }
                }
            }
            if (tournament.finalFour.length === 0 || tournament.finalFour.some(m => !m.played)) return 5;
            if (!tournament.championship || !tournament.championship.played) return 6;
            return 6; // Default to showing champion
        };
        setSelectedRound(findFirstUnplayedRoundIndex());
    }, [tournament]);

    if (!tournament) return <div>The regular season is not over yet.</div>;
    
    const renderRoundView = () => {
        let matchups: TournamentMatchup[] = [];
        let title = roundNames[selectedRound];

        if (selectedRound === 0) {
            matchups = tournament.firstFour;
        } else if (selectedRound >= 1 && selectedRound <= 4) {
            const regionRoundIndex = selectedRound - 1;
            matchups = Object.values(tournament.regions).flatMap(r => r[regionRoundIndex] || []);
        } else if (selectedRound === 5) {
            matchups = tournament.finalFour;
        } else if (selectedRound === 6 && tournament.championship) {
            matchups = [tournament.championship];
        }

        const userMatchup = matchups.find(m => m.homeTeam === userTeamName || m.awayTeam === userTeamName);
        const otherMatchups = matchups.filter(m => m !== userMatchup);

        return (
            <div>
                 <h3 style={{ textAlign: 'center', color: colors.primary, marginBottom: '10px', fontSize: '1.5rem' }}>{title}</h3>

                {userMatchup && (
                    <>
                        <Subheading color={colors.primary}>Your Matchup</Subheading>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <Matchup matchup={userMatchup} teamsByName={teamsByName} userTeamName={userTeamName} userTeamColors={colors}/>
                        </div>
                        <Subheading color={colors.primary}>Other Games</Subheading>
                    </>
                )}

                 <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                    {otherMatchups.length > 0 ? otherMatchups.map((matchup, j) => <Matchup key={j} matchup={matchup} teamsByName={teamsByName} userTeamName={userTeamName} userTeamColors={colors}/>)
                     : !userMatchup && <p>Matchups for this round have not been set yet.</p>}
                </div>
            </div>
        );
    }
    
    const renderFullBracket = () => {
        const { regions, finalFour, championship, firstFour } = tournament;
        const leftRegions = ['West', 'East'] as TournamentRegionName[];
        const rightRegions = ['South', 'Midwest'] as TournamentRegionName[];
        return (
             <>
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ textAlign: 'center', color: colors.primary, marginBottom: '10px' }}>First Four</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        {firstFour.map((matchup, j) => <Matchup key={j} matchup={matchup} teamsByName={teamsByName} userTeamName={userTeamName} userTeamColors={colors}/>)}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'auto', padding: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
                        {leftRegions.map(name => <RegionBracket key={name} name={name} rounds={regions[name]} align="left" teamsByName={teamsByName} userTeamName={userTeamName} userTeamColors={colors}/>)}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', flexShrink: 0 }}>
                        <h4 style={{color: colors.primary, fontSize: '1.2rem'}}>Final Four</h4>
                        {finalFour.map((matchup, j) => <Matchup key={j} matchup={matchup} teamsByName={teamsByName} userTeamName={userTeamName} userTeamColors={colors}/>)}
                        {championship && (
                             <>
                             <h4 style={{color: colors.primary, marginTop: '20px', fontSize: '1.2rem'}}>Championship</h4>
                             <Matchup matchup={championship} teamsByName={teamsByName} userTeamName={userTeamName} userTeamColors={colors}/>
                             </>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
                        {rightRegions.map(name => <RegionBracket key={name} name={name} rounds={regions[name]} align="right" teamsByName={teamsByName} userTeamName={userTeamName} userTeamColors={colors}/>)}
                    </div>
                </div>
            </>
        )
    }

    return (
        <div>
            <Subheading color={colors.primary}>National Tournament</Subheading>
            {tournament.champion && <h4 style={{ textAlign: 'center', margin: '20px 0', color: colors.primary }}>Champion: {tournament.champion === state.userTeam?.name ? <strong>{tournament.champion}</strong> : tournament.champion}</h4>}
            
            <div style={{display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px 0'}}>
                <button style={{...styles.button}} onClick={() => setViewMode('round')}>Round View</button>
                <button style={{...styles.button}} onClick={() => setViewMode('full')}>Full Bracket</button>
            </div>
            {viewMode === 'round' && (
                <div style={{display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px 0'}}>
                    <button style={{...styles.button}} onClick={() => setSelectedRound(r => Math.max(0, r-1))} disabled={selectedRound === 0}>Prev Round</button>
                    <button style={{...styles.button}} onClick={() => setSelectedRound(r => Math.min(maxRounds-1, r+1))} disabled={selectedRound === maxRounds-1 || tournament.champion !== null}>Next Round</button>
                </div>
            )}

            {viewMode === 'round' ? renderRoundView() : renderFullBracket()}

        </div>
    );
};

const DraftResultsModal = ({ draftResults, userTeamName, onClose }: { draftResults: DraftPick[], userTeamName: string, onClose: () => void }) => (
    <div style={styles.modalOverlay} onClick={onClose}>
        <div style={{ ...styles.modalContent, maxWidth: '950px', width: '95vw' }} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} style={styles.modalCloseButton}>X</button>
            <h3 style={{ ...styles.title, fontSize: '1.2rem', textShadow: '2px 2px 0px #808080', color: 'black', marginBottom: '15px' }}>
                NBA Draft Results
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div style={styles.tableContainer}>
                <table style={{...styles.table, fontSize: '0.6rem'}}>
                    <thead>
                        <tr>
                            <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>Pick</th>
                            <th style={{...styles.th, backgroundColor: '#ddd', color: '#000', width: '40%'}}>Player</th>
                            <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>POS</th>
                            <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>Ht</th>
                            <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>OVR</th>
                            <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>Slot Team</th>
                            <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>NBA Team</th>
                            <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>Origin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {draftResults.map(pick => {
                            const isUserPlayer = pick.originalTeam === userTeamName;
                            const rowStyle: React.CSSProperties = isUserPlayer ? { backgroundColor: '#FFFFAA' } : {};
                            const slotAcronym =
                                pick.slotTeam && pick.slotTeam !== pick.nbaTeam
                                    ? getTeamAbbreviation(pick.slotTeam)
                                    : null;
                            return (
                                <tr key={pick.pick} style={rowStyle}>
                                    <td style={styles.td}>{pick.pick}</td>
                                    <td style={styles.td}>{pick.player.name}</td>
                                    <td style={styles.td}>{pick.player.position}</td>
                                    <td style={styles.td}>{formatPlayerHeight(pick.player.height)}</td>
                                    <td style={styles.td}>{pick.player.overall}</td>
                                    <td style={styles.td}>{pick.slotTeam || pick.nbaTeam}</td>
                                    <td style={styles.td}>
                                        {pick.nbaTeam}
                                        {slotAcronym && (
                                            <span style={{ marginLeft: '4px', fontSize: '0.6rem', color: '#555' }}>
                                                via {slotAcronym}
                                            </span>
                                        )}
                                    </td>
                                    <td style={styles.td}>{pick.originDescription}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    </div>
);


const SigningPeriodView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const [showDraft, setShowDraft] = useState(false);
    return (
        <div>
            {showDraft && state.userTeam && <DraftResultsModal draftResults={state.draftResults} userTeamName={state.userTeam.name} onClose={() => setShowDraft(false)}/>}
            <Subheading color={colors.primary}>Post-Season Signing Period: Day {state.signingPeriodDay > 7 ? 7 : state.signingPeriodDay} / 7</Subheading>
            {state.tournament?.champion && <p style={{fontWeight: 'bold', margin: '10px 0'}}>{state.tournament.champion} wins the National Championship!</p>}
            
            <button onClick={() => setShowDraft(true)} style={{...styles.button, margin: '15px 0'}}>View Draft Results</button>

            <RecruitingViewInner state={state} dispatch={dispatch} colors={colors} isSigningPeriod={true} />
        </div>
    );
};

const RosterFillingView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    if (!state.userTeam) return null;
    const rosterSize = state.userTeam.roster.length;
    const canProceed = rosterSize >= 13 && rosterSize <= 15;
    const fillingDepth = useMemo(() => getPositionDepthSummary(state.userTeam!.roster), [state.userTeam]);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

    const totalMinutes = useMemo(() => {
        return state.userTeam!.roster.reduce((sum, p) => sum + (p.rotationMinutes || 0), 0);
    }, [state.userTeam]);

    const handleCutPlayer = (playerId: string, playerName: string) => {
        if (window.confirm(`Are you sure you want to cut ${playerName}? This will free up a roster spot.`)) {
            dispatch({ type: 'CUT_PLAYER', payload: { playerId } });
        }
    };

    const handleBulkCut = () => {
        if (selectedPlayerIds.length === 0) return;
        if (window.confirm(`Are you sure you want to cut ${selectedPlayerIds.length} players? This cannot be undone.`)) {
            dispatch({ type: 'BULK_CUT_PLAYERS', payload: { playerIds: selectedPlayerIds } });
            setSelectedPlayerIds([]);
        }
    };

    const togglePlayerSelection = (playerId: string) => {
        setSelectedPlayerIds(prev => 
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    };

    return (
        <div>
            <Subheading color={colors.primary}>Summer Off-season: Roster Management</Subheading>
            <p style={{fontSize: '0.7rem', marginBottom: '10px'}}>
                Your roster size is currently {rosterSize} / 15.
            </p>
            <p style={{fontSize: '0.7rem', marginBottom: '20px'}}>
                You must have between 13 and 15 players on your roster to start the season. (Roster Count: {rosterSize} players)
            </p>
            <div style={styles.positionDepthRow}>
                {(Object.keys(fillingDepth) as RosterPositions[]).map(pos => (
                    <span key={`fill-depth-${pos}`} style={styles.positionDepthPill}>
                        {pos}: {fillingDepth[pos]}/3
                    </span>
                ))}
            </div>
            <div style={{marginBottom: '10px'}}>
                <Subheading color={colors.primary}>Rotation Minutes</Subheading>
                <p style={{ fontSize: '0.7rem', marginBottom: '10px', color: totalMinutes === 200 ? '#1a7f37' : totalMinutes > 200 ? '#B22222' : '#333' }}>
                    Minutes Allocated: {totalMinutes} / 200
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => dispatch({ type: 'AUTO_DISTRIBUTE_MINUTES' })} style={{ ...styles.button }}>Auto-Distribute</button>
                    <button onClick={() => dispatch({ type: 'AUTO_DISTRIBUTE_REMAINING_MINUTES' })} style={{ ...styles.button }}>Auto-Distribute Remaining</button>
                    <button onClick={() => dispatch({ type: 'RESET_MINUTES' })} style={{ ...styles.button }}>Reset Minutes</button>
                    <button onClick={() => {
                        if (totalMinutes !== 200) {
                            dispatch({ type: 'SET_TOAST', payload: `You must allocate exactly 200 minutes (currently ${totalMinutes}).` });
                        } else {
                            dispatch({ type: 'SET_TOAST', payload: 'Minutes saved!' });
                        }
                    }} style={{ ...styles.button }}>Save Minutes</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', margin: 0 }}>Rotation Preference:</label>
                        <select
                            value={state.rotationPreference}
                            onChange={(e) => dispatch({ type: 'SET_ROTATION_PREFERENCE', payload: e.target.value as RotationPreference })}
                            style={{ ...styles.select, minWidth: '170px' }}
                        >
                            {ROTATION_PREFERENCE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value} title={option.description}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
             <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button 
                    style={{...styles.button, marginRight: '10px'}} 
                    onClick={() => dispatch({type: 'FILL_ROSTER'})}
                    disabled={rosterSize >= 13}
                >
                    Fill Roster with Walk-Ons
                </button>
                {selectedPlayerIds.length > 0 && (
                    <button 
                        style={{...styles.button, backgroundColor: '#B22222', color: 'white'}} 
                        onClick={handleBulkCut}
                    >
                        Cut Selected ({selectedPlayerIds.length})
                    </button>
                )}
             </div>
            {!canProceed && rosterSize > 15 && <p style={{color: 'red', marginTop: '10px', fontSize: '0.7rem'}}>You are over the roster limit â€” make a cut before the season starts.</p>}
            
             <div style={styles.tableContainer}>
             <table style={{...styles.table, marginTop: '20px'}}>
                <thead><tr>
                    <th style={{...styles.th, width: '40px', backgroundColor: colors.primary, color: colors.text}}>Select</th>
                    <th style={{...styles.th, width: '40%', backgroundColor: colors.primary, color: colors.text}}>Name</th>
                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Pos</th>
                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Yr</th>
                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>OVR</th>
                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Pot</th>
                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Actions</th>
                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>MPG</th>
                </tr></thead>
                <tbody>
                    {state.userTeam.roster.map((p, idx) => (
                        <tr key={p.id} style={idx % 2 === 0 ? styles.trEven : {}}>
                            <td style={{...styles.td, textAlign: 'center'}}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedPlayerIds.includes(p.id)} 
                                    onChange={() => togglePlayerSelection(p.id)}
                                />
                            </td>
                            <td style={styles.td}>{idx + 1}. {p.name}</td>
                            <td style={styles.td}>{p.position}{p.secondaryPosition ? `/${p.secondaryPosition}` : ''}</td>
                            <td style={styles.td}>{p.year}</td>
                            <td style={styles.td}>{p.overall}</td>
                            <td style={styles.td}>{formatPotentialValue(p.potential)}</td>
                            <td style={styles.td}>
                                <button
                                    onClick={() => handleCutPlayer(p.id, p.name)}
                                    style={{ ...styles.pullButton, flexShrink: 0 }}
                                >
                                    Cut
                                </button>
                            </td>
                            <td style={styles.td}>
                                <input
                                    type="number"
                                    min="0"
                                    max="40"
                                    value={p.rotationMinutes || 0}
                                    onChange={(e) => dispatch({ type: 'UPDATE_PLAYER_MINUTES', payload: { playerId: p.id, minutes: parseInt(e.target.value) || 0 } })}
                                    style={{ width: '50px', padding: '2px' }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    );
};

const Training = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const [focuses, setFocuses] = useState<{[key: string]: keyof Player['stats'] | ''}>({ pg: '', sg_sf: '', pf_c: '' });

    const handleSelect = (group: string, value: keyof Player['stats']) => {
        setFocuses(prev => ({...prev, [group]: value}));
    };

    const isReady = focuses.pg && focuses.sg_sf && focuses.pf_c;

    const statOptions: (keyof Player['stats'])[] = ['insideScoring', 'outsideScoring', 'playmaking', 'perimeterDefense', 'insideDefense', 'rebounding', 'stamina'];

    const renderFocusSelector = (group: 'pg' | 'sg_sf' | 'pf_c', title: string) => (
        <div style={{marginBottom: '15px'}}>
            <h5 style={{color: colors.primary, marginBottom: '5px'}}>{title}</h5>
            <select value={focuses[group]} onChange={(e) => handleSelect(group, e.target.value as keyof Player['stats'])} style={styles.select}>
                 <option value="" disabled>Select focus...</option>
                 {statOptions.map(opt => (
                     <option key={opt} value={opt}>{opt.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</option>
                 ))}
            </select>
        </div>
    );

    const handleRandomizeFocus = () => {
        setFocuses({
            pg: statOptions[Math.floor(Math.random() * statOptions.length)],
            sg_sf: statOptions[Math.floor(Math.random() * statOptions.length)],
            pf_c: statOptions[Math.floor(Math.random() * statOptions.length)],
        });
    };
    return (
        <div>
            <Subheading color={colors.primary}>Off-Season Training</Subheading>
            <p style={{fontSize: '0.7rem', marginBottom: '20px'}}>Select a training focus for each position group to improve their skills before the next season.</p>
            {renderFocusSelector('pg', 'Point Guards (PG)')}
            {renderFocusSelector('sg_sf', 'Wings (SG/SF)')}
            {renderFocusSelector('pf_c', 'Bigs (PF/C)')}
            
            <button 
                style={{...styles.button, marginTop: '20px'}} 
                onClick={() => dispatch({type: 'FINALIZE_TRAINING', payload: focuses as TrainingFocuses})}
                disabled={!isReady}
            >
                Finalize Training & Start New Season
            </button>
            <button
                style={{...styles.button, marginTop: '20px', marginLeft: '10px'}}
                onClick={handleRandomizeFocus}
            >
                Randomize Focus
            </button>

            <div style={{marginTop: '20px'}}>
                <h5 style={{color: colors.primary}}>Individual Training Overrides</h5>
                <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Player</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Focus</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Intensity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.userTeam?.roster.map(p => (
                            <tr key={p.id}>
                                <td style={styles.td}>{p.name} ({p.position})</td>
                                <td style={styles.td}>
                                    <select 
                                        value={p.trainingFocus || 'Balanced'} 
                                        onChange={(e) => dispatch({type: 'UPDATE_PLAYER_TRAINING', payload: {playerId: p.id, focus: e.target.value as TrainingFocus}})}
                                        style={styles.select}
                                    >
                                        <option value="Balanced">Balanced</option>
                                        <option value="Inside Scoring">Inside Scoring</option>
                                        <option value="Outside Scoring">Outside Scoring</option>
                                        <option value="Playmaking">Playmaking</option>
                                        <option value="Defense">Defense</option>
                                        <option value="Rebounding">Rebounding</option>
                                        <option value="Athleticism">Athleticism</option>
                                    </select>
                                </td>
                                <td style={styles.td}>
                                    <select 
                                        value={p.trainingIntensity || 'Medium'} 
                                        onChange={(e) => dispatch({type: 'UPDATE_PLAYER_TRAINING', payload: {playerId: p.id, intensity: e.target.value as TrainingIntensity}})}
                                        style={styles.select}
                                    >
                                        <option value="Light">Light</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Intense">Intense</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
};

// Deterministic random generator based on team name
const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const getDeterministicNBATeam = (seedStr: string): string => {
    const seed = hashCode(seedStr);
    const nbaTeamInfo = NBA_TEAMS[seed % NBA_TEAMS.length];
    return nbaTeamInfo ? nbaTeamInfo.name : 'Los Angeles Lakers';
};

const History = ({ state, colors, onSeasonClick, onSelectNbaTeam, dispatch }: { state: GameState, colors: TeamColors, onSeasonClick: (record: UserSeasonRecord) => void, onSelectNbaTeam?: (team: any) => void, dispatch: React.Dispatch<GameAction> }) => {
    const formatSeason = (season: number) => `${2024 + season}-${(2025 + season) % 100}`;
    const selectedTab = state.historyTab || 'myCareer';
    const setSelectedTab = (tab: typeof selectedTab) => dispatch({ type: 'SET_HISTORY_TAB', payload: tab });
    const selectedNbaTab = state.nbaHistoryTab || 'drafts';
    const setSelectedNbaTab = (tab: typeof selectedNbaTab) => dispatch({ type: 'SET_NBA_HISTORY_TAB', payload: tab });
    const [selectedTeam, setSelectedTeam] = useState<string>(state.userTeam?.name || SCHOOLS[0]);
    const [selectedSeason, setSelectedSeason] = useState(state.season);
    const [selectedDraftSeason, setSelectedDraftSeason] = useState<number | null>(null);
    const [selectedSchoolName, setSelectedSchoolName] = useState<string | null>(null);
    const [selectedCoachProfile, setSelectedCoachProfile] = useState<{ coach: HeadCoachProfile; teamName?: string; historyEntries: (TeamHistory & { teamName: string })[] } | null>(null);
    const [showRetiredCoaches, setShowRetiredCoaches] = useState(false);
    type CoachDirectorySortColumn =
        | 'team'
        | 'prestige'
        | 'coach'
        | 'style'
        | 'tenure'
        | 'careerWins'
        | 'careerLosses'
        | 'careerWinPct'
        | 'season'
        | 'reputation';
    const [coachDirectorySort, setCoachDirectorySort] = useState<{ column: CoachDirectorySortColumn; direction: 'asc' | 'desc' }>({ column: 'team', direction: 'asc' });
    const latestDraftEntry = useMemo(() => {
        if (!state.history?.nbaDrafts?.length) return null;
        return [...state.history.nbaDrafts].sort((a, b) => b.season - a.season)[0];
    }, [state.history?.nbaDrafts]);
    const nbaAlumniCount = useMemo(() => {
        if (!state.userTeam) return 0;
        const teamName = state.userTeam.name;
        const tenureStart = (() => {
            const stops = state.coach?.careerStops;
            if (stops && stops.length) {
                const activeStop = [...stops].reverse().find(stop => stop.teamName === teamName);
                if (activeStop) return activeStop.startSeason;
            }
            return state.coach?.startSeason ?? state.season;
        })();
        return state.history.nbaDrafts.reduce((sum, draft) => {
            if (draft.season < tenureStart) return sum;
            const draftedThisSeason = draft.picks.filter(pick => pick.originalTeam === teamName).length;
            return sum + draftedThisSeason;
        }, 0);
    }, [state.userTeam, state.history.nbaDrafts, state.coach?.careerStops, state.coach?.startSeason, state.season]);
    const nbaSummaryCards = [
        {
            label: 'Latest Champion',
            value: latestDraftEntry?.nbaChampion || 'TBD',
            meta: latestDraftEntry ? `Season ${formatSeason(latestDraftEntry.season)}` : `Season ${formatSeason(state.season)}`
        },
        {
            label: 'Program Alumni In NBA',
            value: nbaAlumniCount.toString(),
            meta: 'Players drafted under you'
        },
        {
            label: 'Transactions Logged',
            value: (state.nbaTransactions?.length || 0).toString(),
            meta: 'This season'
        },
        {
            label: 'Free Agents Available',
            value: (state.nbaFreeAgents?.length || 0).toString(),
            meta: 'CPU movement ready'
        }
    ];
    const nbaTabs: Array<{ key: typeof selectedNbaTab; label: string; description: string }> = [
        { key: 'drafts', label: 'Draft Hub', description: 'Picks, champions, and origins' },
        { key: 'standings', label: 'Power Table', description: 'Conference hierarchy & cap health' },
        { key: 'rosters', label: 'Alumni Tracker', description: 'Where your players landed' },
        { key: 'stats', label: 'Leaderboard', description: 'Top performers this season' },
        { key: 'transactions', label: 'Wire Log', description: 'Trades, cuts, and signings' },
        { key: 'freeAgency', label: 'Free-Agent Board', description: 'Best talent still unsigned' },
    ];
    const nbaStyles = {
        viewport: { display: 'flex', flexDirection: 'column' as const, gap: '15px' },
        summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
        summaryCard: {
            border: '1px solid #dfe2eb',
            borderRadius: '6px',
            backgroundColor: '#f7f9ff',
            padding: '10px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
        },
        summaryLabel: { fontSize: '0.55rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: 0, color: '#4a4a4a' },
        summaryValue: { fontSize: '1rem', margin: '2px 0', color: colors.primary },
        summaryMeta: { fontSize: '0.6rem', margin: 0, color: '#666' },
        subNav: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px' },
        subNavButton: {
            flex: '1 1 160px',
            borderRadius: '6px',
            padding: '10px 12px',
            border: '1px solid #c5cad5',
            backgroundColor: '#f8f8f8',
            color: '#333',
            textAlign: 'left' as const,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.55rem',
        },
        subNavLabel: { display: 'block', fontSize: '0.65rem', marginBottom: '4px' },
        subNavDescription: { fontSize: '0.5rem', color: '#4c4c4c', lineHeight: 1.4 },
        card: {
            borderRadius: '8px',
            border: '1px solid #dfe2eb',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            overflow: 'hidden',
        },
        cardHeader: {
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap' as const,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e3e6ef',
            backgroundColor: '#f4f7ff',
        },
        cardHeaderTitles: { display: 'flex', flexDirection: 'column' as const, gap: '3px' },
        cardTitle: { margin: 0, fontSize: '0.75rem', letterSpacing: '0.05em' },
        cardSubtitle: { margin: 0, fontSize: '0.6rem', color: '#4c4c4c' },
        cardBody: { padding: '12px 16px' },
        select: { ...styles.select, margin: 0, minWidth: '180px' },
        dualColumn: { display: 'flex', gap: '20px', flexWrap: 'wrap' as const },
    };
    const championBySeason = useMemo(() => {
        const map = new Map<number, ChampionRecord>();
        (state.history?.champions || []).forEach(champ => map.set(champ.season, champ));
        return map;
    }, [state.history?.champions]);
    const getTeamDraftPicks = (teamName?: string) => {
        if (!teamName) return [];
        const inGamePicks = (state.history?.nbaDrafts || []).flatMap(entry =>
            entry.picks
                .filter(p => p.originalTeam === teamName)
                .map(p => ({
                    season: entry.season,
                    round: p.round,
                    status: 'pending' as NilNegotiationStatus,
                    pick: p.pick,
                    player: p.player.name,
                    nbaTeam: p.nbaTeam,
                }))
        );

        // FIX: Removed random historical player generation. 
        // We now rely on the real data in state.history.nbaDrafts which goes back to 1969.
        // This prevents "random" players from being mixed in with real players.
        
        return inGamePicks.sort((a, b) => b.season - a.season);
    };
    const buildCoachHistoryEntries = (coach: HeadCoachProfile): (TeamHistory & { teamName: string })[] => {
        const stops = coach.careerStops && coach.careerStops.length
            ? coach.careerStops
            : (coach.lastTeam ? [{ teamName: coach.lastTeam, startSeason: coach.startSeason }] : []);
        const entries: (TeamHistory & { teamName: string })[] = [];
        const seen = new Set<string>();
        stops.forEach(stop => {
            const startSeason = stop.startSeason ?? coach.startSeason ?? 1;
            const endSeason = stop.endSeason ?? state.season;
            const records = state.history.teamHistory[stop.teamName] || [];
            records.forEach(entry => {
                if (entry.season >= startSeason && entry.season <= endSeason) {
                    const key = `${stop.teamName}-${entry.season}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        entries.push({ ...entry, teamName: stop.teamName });
                    }
                }
            });
        });
        return entries.sort((a, b) => b.season - a.season);
    };

    useEffect(() => {
        if (state.history?.nbaDrafts && state.history.nbaDrafts.length > 0) {
            const latest = Math.max(...state.history.nbaDrafts.map(d => d.season));
            if (selectedDraftSeason === null || !state.history.nbaDrafts.some(d => d.season === selectedDraftSeason)) {
                setSelectedDraftSeason(latest);
            }
        }
    }, [state.history?.nbaDrafts, selectedDraftSeason]);

    const buttonTextColorForInactive = (colors.secondary.toUpperCase() === '#FFFFFF' && colors.text.toUpperCase() === '#FFFFFF') ? colors.primary : colors.text;
    const selectedSchoolTeam = selectedSchoolName ? state.allTeams.find(t => t.name === selectedSchoolName) || null : null;
    const schoolHistoryEntries = useMemo(() => {
        if (!selectedSchoolName) return [];
        const entries = state.history?.teamHistory?.[selectedSchoolName] || [];
        return [...entries].sort((a, b) => b.season - a.season);
    }, [selectedSchoolName, state.history?.teamHistory]);
    const schoolDraftPicks = useMemo(() => getTeamDraftPicks(selectedSchoolName), [selectedSchoolName, state.history?.nbaDrafts]);
    const schoolChampionships = useMemo(() => {
        if (!selectedSchoolName) return 0;
        return (state.history?.champions || []).filter(champ => champ.teamName === selectedSchoolName).length;
    }, [selectedSchoolName, state.history?.champions]);

    const getCoachProfileForTeam = useCallback((team: Team) => {
        const headCoach = team.headCoach;
        if (!headCoach) return null;
        if (team.isUserTeam && state.coach) {
            const pastWins = state.coach.history.reduce((acc, h) => acc + h.wins, 0);
            const pastLosses = state.coach.history.reduce((acc, h) => acc + h.losses, 0);
            const currentWins = team.record.wins;
            const currentLosses = team.record.losses;
            return { 
                ...headCoach, 
                reputation: state.coach.reputation,
                age: state.coach.age,
                almaMater: state.coach.almaMater,
                style: state.coach.style,
                startSeason: state.coach.startSeason,
                seasons: state.coach.history.length + 1,
                careerWins: pastWins + currentWins,
                careerLosses: pastLosses + currentLosses,
                seasonWins: currentWins,
                seasonLosses: currentLosses,
                careerStops: state.coach.careerStops,
                history: state.coach.history,
             };
        }
        return headCoach;
    }, [state.coach]);

    const getCoachTenureSeasons = useCallback((team: Team) => {
        const coach = getCoachProfileForTeam(team);
        if (!coach) return 0;
        const stops = coach.careerStops || [];
        const currentStop = [...stops].reverse().find(stop => stop.teamName === team.name);
        if (!currentStop) {
            return Math.max(1, coach.seasons || 1);
        }
        const endSeason = currentStop.endSeason ?? state.season;
        return Math.max(1, endSeason - currentStop.startSeason + 1);
    }, [getCoachProfileForTeam, state.season]);
    const getCoachSortValue = useCallback((team: Team, column: CoachDirectorySortColumn) => {
        const coach = getCoachProfileForTeam(team);
        switch (column) {
            case 'team':
                return team.name;
            case 'prestige':
                return team.prestige;
            case 'coach':
                return coach?.name || '';
            case 'style':
                return coach?.style || '';
            case 'tenure':
                return getCoachTenureSeasons(team);
            case 'careerWins':
                return coach?.careerWins ?? 0;
            case 'careerLosses':
                return coach?.careerLosses ?? 0;
            case 'careerWinPct': {
                if (!coach) return 0;
                const total = coach.careerWins + coach.careerLosses;
                return total > 0 ? coach.careerWins / total : 0;
            }
            case 'season': {
                if (!coach) return 0;
                const total = coach.seasonWins + coach.seasonLosses;
                return total > 0 ? coach.seasonWins / total : coach.seasonWins;
            }
            case 'reputation':
                return coach?.reputation ?? 0;
        }
    }, [getCoachProfileForTeam, getCoachTenureSeasons]);
    const sortedCoachDirectoryTeams = useMemo(() => {
        const direction = coachDirectorySort.direction === 'asc' ? 1 : -1;
        const column = coachDirectorySort.column;
        const bySorted = [...state.allTeams].sort((a, b) => {
            if (column === 'careerWinPct') {
                const winsA = a.headCoach?.careerWins ?? 0;
                const lossesA = a.headCoach?.careerLosses ?? 0;
                const winsB = b.headCoach?.careerWins ?? 0;
                const lossesB = b.headCoach?.careerLosses ?? 0;
                const pctA = winsA + lossesA > 0 ? winsA / (winsA + lossesA) : 0;
                const pctB = winsB + lossesB > 0 ? winsB / (winsB + lossesB) : 0;
                if (pctA !== pctB) {
                    return direction * (pctA - pctB);
                }
                if (winsA !== winsB) {
                    return direction * (winsA - winsB);
                }
                return 0;
            }
            const valueA = getCoachSortValue(a, column);
            const valueB = getCoachSortValue(b, column);
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction * ((valueA ?? -Infinity) - (valueB ?? -Infinity));
            }
            return direction * String(valueA ?? '').localeCompare(String(valueB ?? ''));
        });
        if (state.userTeam) {
            const userIndex = bySorted.findIndex(team => team.name === state.userTeam?.name);
            if (userIndex > 0) {
                const [userTeamEntry] = bySorted.splice(userIndex, 1);
                bySorted.unshift(userTeamEntry);
            }
        }
        return bySorted;
    }, [state.allTeams, coachDirectorySort, getCoachSortValue, state.userTeam]);
    const toggleCoachSort = (column: CoachDirectorySortColumn) => {
        setCoachDirectorySort(prev => prev.column === column ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { column, direction: 'asc' });
    };
    const sortIndicator = (column: CoachDirectorySortColumn) => coachDirectorySort.column === column ? (coachDirectorySort.direction === 'asc' ? '▲' : '▼') : '';

    const renderMyCareer = () => {
        const draftPickTotal = (state.coach?.history || []).reduce((sum, rec) => {
            const draftEntry = state.history?.nbaDrafts?.find(d => d.season === rec.season);
            if (!draftEntry) return sum;
            return sum + draftEntry.picks.filter(p => p.originalTeam === rec.teamName).length;
        }, 0);

        const totals = (state.coach?.history || []).reduce(
            (acc, rec) => {
                acc.wins += rec.wins;
                acc.losses += rec.losses;
                acc.net += rec.totalRevenue - rec.operationalExpenses;
                acc.salary += rec.salary;

                let highestStage = -1; // -1 = none, 0 = tournament, 1 = R32, 2 = S16, 3 = E8, 4 = F4, 5 = Runner-Up, 6 = Champ
                const achievementBlob = rec.achievements.join(' ').toLowerCase();

                if (achievementBlob.includes('champion')) highestStage = Math.max(highestStage, 6);
                else if (achievementBlob.includes('runner-up') || achievementBlob.includes('runner up')) highestStage = Math.max(highestStage, 5);
                else if (achievementBlob.includes('final four')) highestStage = Math.max(highestStage, 4);
                else if (achievementBlob.includes('elite 8') || achievementBlob.includes('elite eight')) highestStage = Math.max(highestStage, 3);
                else if (achievementBlob.includes('sweet 16')) highestStage = Math.max(highestStage, 2);
                else if (achievementBlob.includes('round of 32')) highestStage = Math.max(highestStage, 1);
                else if (achievementBlob.includes('tournament appearance')) highestStage = Math.max(highestStage, 0);

                if (highestStage >= 0) acc.achievements.tournamentAppearances++;
                if (highestStage >= 1) acc.achievements.roundOf32++;
                if (highestStage >= 2) acc.achievements.sweet16++;
                if (highestStage >= 3) acc.achievements.elite8++;
                if (highestStage >= 4) acc.achievements.final4++;
                if (highestStage >= 5) acc.achievements.runnerUp++;
                if (highestStage >= 6) acc.achievements.championships++;

                return acc;
            },
            { wins: 0, losses: 0, net: 0, salary: 0, achievements: { tournamentAppearances: 0, roundOf32: 0, sweet16: 0, elite8: 0, final4: 0, runnerUp: 0, championships: 0, draftPicks: 0 } }
        );
        totals.achievements.draftPicks = draftPickTotal;

        const achievementSummaryParts: string[] = [];
        if (totals.achievements.tournamentAppearances) achievementSummaryParts.push(`Tournament Apps: ${totals.achievements.tournamentAppearances}`);
        if (totals.achievements.roundOf32) achievementSummaryParts.push(`Round of 32: ${totals.achievements.roundOf32}`);
        if (totals.achievements.sweet16) achievementSummaryParts.push(`Sweet 16: ${totals.achievements.sweet16}`);
        if (totals.achievements.elite8) achievementSummaryParts.push(`Elite 8: ${totals.achievements.elite8}`);
        if (totals.achievements.final4) achievementSummaryParts.push(`Final Four: ${totals.achievements.final4}`);
        if (totals.achievements.runnerUp) achievementSummaryParts.push(`Runner-Up: ${totals.achievements.runnerUp}`);
        if (totals.achievements.championships) achievementSummaryParts.push(`Titles: ${totals.achievements.championships}`);
        if (totals.achievements.draftPicks) achievementSummaryParts.push(`NBA Picks: ${totals.achievements.draftPicks}`);
        const achievementSummary = achievementSummaryParts.length ? achievementSummaryParts.join(' | ') : 'None yet';

        return (
            <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Season</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>School</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Record</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Salary</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Achievements</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>NCAA Title Game</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Totals</th>
                    </tr>
                </thead>
                <tbody>
                    {state.coach?.history.map(record => {
                        const championEntry = championBySeason.get(record.season);
                        const hasRealChampion = championEntry && championEntry.teamName !== 'No Champion';
                        const isChampion = hasRealChampion && championEntry?.teamName === record.teamName;
                        return (
                            <tr key={`${record.season}-${record.teamName}`}>
                                <td style={styles.td}>{formatSeason(record.season)}</td>
                                <td style={styles.td}>{record.teamName}</td>
                                <td style={styles.td}>{record.wins}-{record.losses}</td>
                                <td style={styles.td}>{formatCurrency(record.salary)}</td>
                                <td style={styles.td}>{record.achievements.join(', ') || '-'}</td>
                                <td style={{
                                    ...styles.td,
                                    fontWeight: isChampion ? 'bold' : 'normal',
                                    color: isChampion ? colors.primary : styles.td.color || '#000000'
                                }}>
                                    {hasRealChampion && championEntry?.teamName ? (
                                        <>
                                            {championEntry.teamName}
                                            {championEntry.runnerUpTeamName && (
                                                <>
                                                    <br />
                                                    <span style={{ fontWeight: 'normal' }}>
                                                        over {championEntry.runnerUpTeamName}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    ) : 'N/A'}
                                </td>
                                <td style={styles.td}>
                                    Wins: {record.wins}<br/>
                                    Losses: {record.losses}<br/>
                                    Net: {formatCurrency(record.totalRevenue - record.operationalExpenses)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <td style={{...styles.td, fontWeight: 'bold'}} colSpan={2}>Career Totals</td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>
                            {totals.wins}-{totals.losses}
                        </td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{formatCurrency(totals.salary)}</td>
                        <td style={{...styles.td, fontSize: '0.65rem', lineHeight: 1.4}}>{achievementSummary}</td>
                        <td style={{...styles.td}}></td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>
                            Wins: {totals.wins}<br/>
                            Losses: {totals.losses}<br/>
                            Net: {formatCurrency(totals.net)}<br/>
                            NBA Picks: {totals.achievements.draftPicks}
                        </td>
                    </tr>
                </tfoot>
            </table>
            </div>
        );
    };

    const renderTeamRecords = () => {
        const teamHistory = state.history.teamHistory[selectedTeam] || [];
        return (
            <div>
                <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} style={{...styles.select, marginBottom: '10px', width: '100%'}}>
                    {[...SCHOOLS].sort((a, b) => a.localeCompare(b)).map(school => <option key={school} value={school}>{school}</option>)}
                </select>
                <div style={styles.tableContainer}>
                <table style={styles.table}>
                     <thead>
                        <tr>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Season</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Rank</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Prestige</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Champion</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Runner-Up</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamHistory.map(record => {
                            const championEntry = championBySeason.get(record.season);
                            const hasRealChampion = championEntry && championEntry.teamName !== 'No Champion';
                            const isChampion = hasRealChampion && championEntry?.teamName === selectedTeam;
                            const isRunnerUp = hasRealChampion && championEntry?.runnerUpTeamName === selectedTeam;
                            const championLabel = hasRealChampion ? championEntry?.teamName : 'N/A';
                            const runnerUpLabel = hasRealChampion ? (championEntry?.runnerUpTeamName || 'N/A') : 'N/A';
                            return (
                                <tr key={record.season}>
                                    <td style={styles.td}>{formatSeason(record.season)}</td>
                                    <td style={styles.td}>#{record.rank}</td>
                                    <td style={styles.td}>{record.prestige}</td>
                                    <td style={{
                                        ...styles.td,
                                        fontWeight: isChampion ? 'bold' : 'normal',
                                        color: isChampion ? colors.primary : styles.td.color || '#000000'
                                    }}>
                                        {championLabel}
                                    </td>
                                    <td style={{
                                        ...styles.td,
                                        fontWeight: isRunnerUp ? 'bold' : 'normal',
                                        color: isRunnerUp ? colors.primary : styles.td.color || '#000000'
                                    }}>
                                        {runnerUpLabel}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
            </div>
        );
    };

    const renderNationalRankings = () => {
        const rankingsForSeason = Object.entries(state.history.teamHistory)
            .map(([teamName, history]) => {
                const entry = history.find(h => h.season === selectedSeason);
                if (!entry) return null;
                const team = state.allTeams.find(t => t.name === teamName);
                const conference = team?.conference || 'Independent';
                const conferenceTeams = state.allTeams.filter(t => t.conference === conference);
                const conferenceRank = conferenceTeams
                    .map(t => {
                        const teamHistoryEntry = state.history.teamHistory[t.name]?.find(h => h.season === selectedSeason);
                        return {
                            name: t.name,
                            confRank: teamHistoryEntry?.rank || Infinity,
                        };
                    })
                    .sort((a, b) => a.confRank - b.confRank)
                    .findIndex(t => t.name === teamName) + 1;
                return { teamName, ...entry, conference, conferenceRank };
            })
            .filter((t): t is { teamName: string; season: number; prestige: number; rank: number; totalRevenue: number; projectedRevenue: number; conference: string; conferenceRank: number } => !!t && !!t.rank && t.rank > 0)
            .sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity))
            .slice(0, 25);
        
        const availableSeasons = Array.from(new Set(Object.values(state.history.teamHistory).flat().map(h => h.season))).sort((a, b) => b - a);
        
        return (
             <div>
                <select value={selectedSeason} onChange={(e) => setSelectedSeason(parseInt(e.target.value, 10))} style={{...styles.select, marginBottom: '10px', width: '100%'}}>
                    {availableSeasons.map(s => (
                        <option key={s} value={s}>{`Season ${formatSeason(s)}`}</option>
                    ))}
                </select>
                <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Rank</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Team</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Conference</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Prestige</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankingsForSeason.map(t => (
                            <tr key={t.teamName}>
                                <td style={styles.td}>#{t.rank}</td>
                                <td style={styles.td}>{t.teamName}</td>
                                <td style={styles.td}>{t.conference} {isNaN(t.conferenceRank) || !isFinite(t.conferenceRank) ? '' : `(#{t.conferenceRank})`}</td>
                                <td style={styles.td}>{t.prestige}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        );
    };

    const renderDraftHistory = () => {
        if (!state.history.nbaDrafts.length) {
            return <p style={{ fontSize: '0.8rem' }}>No NBA drafts have been recorded yet.</p>;
        }
        console.log('Available Draft Seasons:', state.history.nbaDrafts.map(d => d.season));
        const seasons = [...state.history.nbaDrafts.map(d => d.season)].sort((a, b) => b - a);
        console.log('Draft History Debug:', { 
            selectedDraftSeason, 
            seasons, 
            hasZero: seasons.includes(0),
            firstSeason: seasons[0]
        });
        const activeSeason = (selectedDraftSeason !== null && seasons.includes(selectedDraftSeason)) ? selectedDraftSeason : seasons[0];
        const draftEntry = state.history.nbaDrafts.find(d => d.season === activeSeason) || state.history.nbaDrafts[state.history.nbaDrafts.length - 1];
        const championRecord = state.history.champions.find(c => c.season === activeSeason);
        const championName = draftEntry.nbaChampion || championRecord?.teamName || 'TBD';

        const seenPlayers = new Set<string>();
        const uniqueSeasonPicks = draftEntry.picks.filter(pick => {
            const playerId = pick.player?.id || `${pick.nbaTeam}-${pick.pick}`;
            if (seenPlayers.has(playerId)) {
                return false;
            }
            seenPlayers.add(playerId);
            return true;
        });

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Draft Ledger</h4>
                        <p style={nbaStyles.cardSubtitle}>Season {formatSeason(activeSeason)} • NBA Champion {championName}</p>
                    </div>
                    <select
                        value={activeSeason}
                        onChange={(e) => setSelectedDraftSeason(parseInt(e.target.value, 10))}
                        style={nbaStyles.select}
                    >
                        {seasons.map(s => (
                            <option key={s} value={s}>{`Season ${formatSeason(s)}`}</option>
                        ))}
                    </select>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 4 }}>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pick</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>NBA Team</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Origin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueSeasonPicks.map(pick => {
                                    const nbaTeamName = pick.nbaTeam === 'Unknown'
                                        ? getDeterministicNBATeam(`${draftEntry.season}-${pick.round}-${pick.pick}`)
                                        : pick.nbaTeam;
                                    const slotAcronym =
                                        pick.slotTeam && pick.slotTeam !== nbaTeamName
                                            ? getTeamAbbreviation(pick.slotTeam)
                                            : null;

                                    return (
                                        <tr key={`${draftEntry.season}-${pick.pick}`}>
                                            <td style={styles.td}>{pick.pick > 60 ? 'Undrafted' : `R${pick.round} #${pick.pick}`}</td>
                                            <td style={styles.td}>
                                                {nbaTeamName}
                                                {slotAcronym && (
                                                    <span style={{ marginLeft: '4px', fontSize: '0.6rem', color: '#555' }}>
                                                        via {slotAcronym}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={styles.td}>{pick.player.name} ({pick.player.position})</td>
                                            <td style={styles.td}>{pick.originDescription}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };

    const renderNbaStandings = () => {
        const teamsSource = state.nbaTeams && state.nbaTeams.length > 0 ? state.nbaTeams : (state.currentNBASimulation?.teams || []);
        if (teamsSource.length === 0) return <p style={{ fontSize: '0.8rem' }}>No NBA data available.</p>;

        const getStandingsData = (team: any) => {
            const roster = team.roster || [];
            const payroll = roster.reduce((sum: number, p: any) => sum + (p.contract?.salary || 0), 0);
            const capSpace = (constants.NBA_SALARY_CAP_2025 || 154647000) - payroll;
            
            return {
                name: team.name,
                wins: team.wins ?? team.record?.wins ?? 0,
                losses: team.losses ?? team.record?.losses ?? 0,
                rating: team.rating ?? team.prestige ?? 75,
                conference: team.conference ?? (team.division === 'West' ? 'West' : 'East'),
                capSpace: capSpace,
                taxBill: Math.max(0, payroll - (constants.NBA_LUXURY_TAX_THRESHOLD_2025 || 187895000)) // Estimate tax bill
            };
        };

        const allTeams = teamsSource.map(getStandingsData);
        const eastTeams = allTeams.filter(t => t.conference === 'East').sort((a, b) => b.wins - a.wins);
        const westTeams = allTeams.filter(t => t.conference === 'West').sort((a, b) => b.wins - a.wins);

        const renderConfTable = (title: string, teams: typeof eastTeams) => (
            <div style={{ flex: 1, minWidth: '320px' }}>
                <h5 style={{ margin: '0 0 10px', fontSize: '0.65rem', color: '#4a4a4a', letterSpacing: '0.05em' }}>{title}</h5>
                <table style={{ ...styles.table, fontSize: '0.7rem' }}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Team</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>W</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>L</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Cap Space</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Tax Bill</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((t, i) => (
                            <tr key={t.name}>
                                <td style={{ ...styles.td, fontWeight: 'bold' }}>
                                    {onSelectNbaTeam ? (
                                        <button
                                            onClick={() => onSelectNbaTeam(teamsSource.find(team => team.name === t.name))}
                                            style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontFamily: 'inherit' }}
                                        >
                                            {i + 1}. {NBA_ACRONYM_TO_NAME[t.name] || t.name}
                                        </button>
                                    ) : (
                                        <>{i + 1}. {NBA_ACRONYM_TO_NAME[t.name] || t.name}</>
                                    )}
                                </td>
                                <td style={styles.td}>{t.wins}</td>
                                <td style={styles.td}>{t.losses}</td>
                                <td style={{ ...styles.td, color: (t.capSpace || 0) < 0 ? '#c62828' : '#1b5e20' }}>
                                    {t.capSpace !== undefined ? formatCurrency(t.capSpace) : '-'}
                                </td>
                                <td style={{ ...styles.td, color: '#c62828' }}>
                                    {t.taxBill && t.taxBill > 0 ? formatCurrency(t.taxBill) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Power Table</h4>
                        <p style={nbaStyles.cardSubtitle}>Live standings with cap posture</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 16 }}>
                    <div style={nbaStyles.dualColumn}>
                        {renderConfTable('Eastern Conference', eastTeams)}
                        {renderConfTable('Western Conference', westTeams)}
                    </div>
                </div>
            </section>
        );
    };

    const renderNbaRosters = () => {
        const nbaTeamsSource = state.nbaTeams && state.nbaTeams.length > 0 ? state.nbaTeams : (state.currentNBASimulation?.teams || []);
        const currentSalaryByPlayerId = new Map<string, number>();
        const currentTeamByPlayerId = new Map<string, string>();
        const currentOverallByPlayerId = new Map<string, number>();
        nbaTeamsSource.forEach(team => {
            (team.roster || []).forEach(player => {
                const salary = player.contract?.salary;
                if (typeof salary === 'number' && salary > 0) {
                    currentSalaryByPlayerId.set(player.id, salary);
                }
                currentTeamByPlayerId.set(player.id, team.name);
                if (typeof (player as any).overall === 'number') {
                    currentOverallByPlayerId.set(player.id, (player as any).overall);
                }
            });
        });

        const alumniInNba = (state.history?.nbaDrafts || []).flatMap(d => d.picks)
            .filter(p => p.originalTeam === state.userTeam?.name)
            .sort((a, b) => b.season - a.season);

        if (!alumniInNba.length) {
             return <p style={{ fontSize: '0.8rem' }}>No alumni currently in the NBA.</p>;
        }

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Alumni Tracker</h4>
                        <p style={nbaStyles.cardSubtitle}>Active players drafted from {state.userTeam?.name || 'your program'}</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 0 }}>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Draft Year</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Drafted By</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Current Team</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pick</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>OVR</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alumniInNba.map((p, i) => {
                                    const salary = currentSalaryByPlayerId.get(p.player.id);
                                    const currentTeam = currentTeamByPlayerId.get(p.player.id);
                                    const currentOverall = currentOverallByPlayerId.get(p.player.id);
                                    return (
                                        <tr key={i}>
                                            <td style={styles.td}>{p.player.name}</td>
                                            <td style={styles.td}>{formatSeason(p.season)}</td>
                                            <td style={styles.td}>{NBA_ACRONYM_TO_NAME[p.nbaTeam] || p.nbaTeam}</td>
                                            <td style={styles.td}>{currentTeam ? (NBA_ACRONYM_TO_NAME[currentTeam] || currentTeam) : '-'}</td>
                                            <td style={styles.td}>{p.pick > 60 ? 'Undrafted' : `R${p.round} #${p.pick}`}</td>
                                            <td style={styles.td}>{typeof currentOverall === 'number' ? currentOverall : '-'}</td>
                                            <td style={styles.td}>{typeof salary === 'number' ? formatCurrency(salary) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };

    const renderNbaStats = () => {
        // Use live teams if available, otherwise fallback to simulation
        const teamsSource = state.nbaTeams && state.nbaTeams.length > 0 ? state.nbaTeams : (state.currentNBASimulation?.teams || []);
        
        if (teamsSource.length === 0) return <p style={{ fontSize: '0.8rem' }}>No NBA data available.</p>;

        const allPlayers = teamsSource.flatMap(t => t.roster.map(p => ({ ...p, teamName: t.name })));
        
        // Filter players with stats and sort by PPG
        const leaders = allPlayers
            .filter(p => p.nbaStats && p.nbaStats.gamesPlayed > 0)
            .sort((a, b) => (b.nbaStats!.points / b.nbaStats!.gamesPlayed) - (a.nbaStats!.points / a.nbaStats!.gamesPlayed))
            .slice(0, 50);

        if (leaders.length === 0) return <p style={{ fontSize: '0.8rem' }}>No stats available yet. Simulate further into the season.</p>;

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>League Leaders</h4>
                        <p style={nbaStyles.cardSubtitle}>Top 50 scorers with per-game splits</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 0 }}>
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Rank</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Team</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>GP</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MIN</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>PTS</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>REB</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>AST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaders.map((p, i) => {
                                    const gp = p.nbaStats!.gamesPlayed;
                                    return (
                                        <tr key={p.id}>
                                            <td style={styles.td}>#{i + 1}</td>
                                            <td style={styles.td}>{p.name} <span style={{fontSize: '0.6rem', color: '#666'}}>({p.position})</span></td>
                                            <td style={styles.td}>{NBA_ACRONYM_TO_NAME[p.teamName] || p.teamName}</td>
                                            <td style={styles.td}>{gp}</td>
                                            <td style={styles.td}>{(p.nbaStats!.minutes / gp).toFixed(1)}</td>
                                            <td style={styles.td}>{(p.nbaStats!.points / gp).toFixed(1)}</td>
                                            <td style={styles.td}>{(p.nbaStats!.rebounds / gp).toFixed(1)}</td>
                                            <td style={styles.td}>{(p.nbaStats!.assists / gp).toFixed(1)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };



    const renderRetiredCoaches = () => {
        if (!state.retiredCoaches.length) {
            return <p style={{ fontSize: '0.75rem' }}>No coaches have retired yet.</p>;
        }
        const sorted = [...state.retiredCoaches].sort((a, b) => (b.retiredSeason || 0) - (a.retiredSeason || 0));
        return (
            <div style={styles.tableContainer}>
                <table style={{ ...styles.table, fontSize: '0.6rem', minWidth: '720px' }}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Coach</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Retired</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Last Team</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Record</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Style</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Reputation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((coach, index) => (
                            <tr key={`${coach.name}-${index}`}>
                                <td style={styles.td}>
                                    <button
                                        style={styles.tableLinkButton}
                                        onClick={() => setSelectedCoachProfile({
                                            coach,
                                            teamName: coach.lastTeam,
                                            historyEntries: buildCoachHistoryEntries(coach),
                                            nbaDrafts: state.history.nbaDrafts || [],
                                        })}
                                    >
                                        {coach.name}
                                    </button>
                                </td>
                                <td style={styles.td}>{coach.retiredSeason ? formatSeason(coach.retiredSeason) : 'â€”'}</td>
                                <td style={styles.td}>{coach.lastTeam || 'â€”'}</td>
                                <td style={styles.td}>{coach.careerWins}-{coach.careerLosses}</td>
                                <td style={styles.td}>{coach.style}</td>
                                <td style={styles.td}>{coach.reputation}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderCoachDirectory = () => {
    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.7rem' }}>
                    <input
                        type="checkbox"
                        checked={showRetiredCoaches}
                        onChange={e => setShowRetiredCoaches(e.target.checked)}
                        style={{ marginRight: '6px' }}
                    />
                    Show retired coaches
                </label>
            </div>
            {showRetiredCoaches ? renderRetiredCoaches() : (
                <div style={styles.tableContainer}>
                    <table style={{ ...styles.table, fontSize: '0.6rem', minWidth: '880px' }}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('team')}>
                                        Team {sortIndicator('team')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('prestige')}>
                                        Prestige {sortIndicator('prestige')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('coach')}>
                                        Head Coach {sortIndicator('coach')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('style')}>
                                        Style {sortIndicator('style')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('tenure')}>
                                        Tenure {sortIndicator('tenure')}
                                    </button>
                                </th>
                        <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                            <button style={styles.tableSortButton} onClick={() => toggleCoachSort('careerWins')}>
                                Career Wins {sortIndicator('careerWins')}
                            </button>
                        </th>
                        <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                            <button style={styles.tableSortButton} onClick={() => toggleCoachSort('careerLosses')}>
                                Losses {sortIndicator('careerLosses')}
                            </button>
                        </th>
                        <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                            <button style={styles.tableSortButton} onClick={() => toggleCoachSort('careerWinPct')}>
                                Win % {sortIndicator('careerWinPct')}
                            </button>
                        </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('season')}>
                                        Current Season {sortIndicator('season')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('reputation')}>
                                        Reputation {sortIndicator('reputation')}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCoachDirectoryTeams.map(team => {
                                const coach = getCoachProfileForTeam(team);
                                const tenureYears = coach ? getCoachTenureSeasons(team) : 0;
                                return (
                                <tr key={team.name}>
                                    <td style={{ ...styles.td, fontWeight: team.isUserTeam ? 'bold' : 'normal', color: team.isUserTeam ? colors.primary : styles.td.color }}>
                                        <button style={styles.tableLinkButton} onClick={() => setSelectedSchoolName(team.name)}>
                                            {team.name}
                                        </button>
                                    </td>
                                    <td style={styles.td}>{team.prestige}</td>
                                    <td style={styles.td}>
                                        <button
                                            style={styles.tableLinkButton}
                                            onClick={() => coach && setSelectedCoachProfile({
                                                coach,
                                                teamName: team.name,
                                                historyEntries: buildCoachHistoryEntries(coach),
                                                nbaDrafts: state.history.nbaDrafts || [],
                                            })}
                                        >
                                            {coach?.name || 'TBD'}
                                        </button>
                                    </td>
                                    <td style={styles.td}>{coach?.style || 'Balanced'}</td>
                            <td style={styles.td}>
                                {coach
                                    ? `${tenureYears} yr${tenureYears === 1 ? '' : 's'}`
                                    : 'N/A'}
                            </td>
                                <td style={styles.td}>
                                    {coach?.careerWins ?? 0}
                                </td>
                                <td style={styles.td}>
                                    {coach?.careerLosses ?? 0}
                                </td>
                                <td style={styles.td}>
                                    {coach ? (
                                        ((coach.careerWins + coach.careerLosses) > 0
                                            ? `${((coach.careerWins / (coach.careerWins + coach.careerLosses)) * 100).toFixed(1)}%`
                                            : '0.0%')
                                    ) : '0.0%'}
                                </td>
                                <td style={styles.td}>{coach ? `${coach.seasonWins}-${coach.seasonLosses}` : '0-0'}</td>
                                    <td style={styles.td}>{coach?.reputation ?? 0}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

    const getApproxPlayerAge = (player: Player) => {
        if (player.age) return player.age;
        
        let baseAge = 22; // Default for Senior/Unknown
        if (player.year === 'Fr') baseAge = 19;
        else if (player.year === 'So') baseAge = 20;
        else if (player.year === 'Jr') baseAge = 21;
        else if (player.year === 'Intl') baseAge = 20;

        if (player.draftYear !== undefined) {
            return baseAge + (state.season - player.draftYear);
        }
        
        // If simply in pool without draft year (undrafted rookie), use base age + time in pool?
        // But we don't track time in pool easily without looking at when they were added relative to now.
        // For simple display, baseAge is better than NaN.
        return baseAge;
    };

    const renderNbaFreeAgents = () => {
        if (!state.nbaFreeAgents || state.nbaFreeAgents.length === 0) {
            return <p style={{ fontSize: '0.8rem' }}>No free agents currently available.</p>;
        }

        const sortedAgents = [...state.nbaFreeAgents].sort((a, b) => b.player.overall - a.player.overall);

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Free-Agent Board</h4>
                        <p style={nbaStyles.cardSubtitle}>Sorted by overall with context for why they are available</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 0 }}>
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pos</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>OVR</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Age</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Previous Team</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAgents.map((agent) => (
                                    <tr key={agent.player.id}>
                                        <td style={styles.td}>{agent.player.name}</td>
                                        <td style={styles.td}>{agent.player.position}</td>
                                        <td style={styles.td}>{agent.player.overall}</td>
                                        <td style={styles.td}>{getApproxPlayerAge(agent.player)}</td>
                                        <td style={styles.td}>{NBA_ACRONYM_TO_NAME[agent.previousTeam] || agent.previousTeam || agent.player.originDescription || 'Undrafted'}</td>
                                        <td style={styles.td}>{agent.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };

    const renderNbaTransactions = () => {
        if (!state.nbaTransactions || state.nbaTransactions.length === 0) {
            return <p style={{ fontSize: '0.8rem' }}>No transactions have occurred this season.</p>;
        }

        const sortedTransactions = [...state.nbaTransactions].sort((a, b) => {
            if (b.season !== a.season) return b.season - a.season;
            return b.week - a.week;
        });

        // Helper to format date
        const getTransactionDate = (t: NBATransaction) => {
             // Use global helper for consistency
             return getGameDateString(BASE_CALENDAR_YEAR + t.season, t.week);
        };

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Transaction Wire</h4>
                        <p style={nbaStyles.cardSubtitle}>Chronological log of CPU trades, cuts, and signings</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 0 }}>
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Date</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Type</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTransactions.map((t) => (
                                    <tr key={t.id}>
                                        <td style={styles.td}>{getTransactionDate(t)}</td>
                                        <td style={styles.td}>{t.type}</td>
                                        <td style={{...styles.td, textAlign: 'left'}}>{t.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };

    const renderHistoryTabContent = () => {
        switch (selectedTab) {
            case 'myCareer':
                return renderMyCareer();
            case 'teamRecords':
                return renderTeamRecords();
            case 'nationalRankings':
                return renderNationalRankings();
            case 'nba':
                return (
                    <div style={nbaStyles.viewport}>
                        <div style={nbaStyles.summaryGrid}>
                            {nbaSummaryCards.map(card => (
                                <div key={card.label} style={nbaStyles.summaryCard}>
                                    <p style={nbaStyles.summaryLabel}>{card.label}</p>
                                    <p style={nbaStyles.summaryValue}>{card.value}</p>
                                    <p style={nbaStyles.summaryMeta}>{card.meta}</p>
                                </div>
                            ))}
                        </div>
                        <div style={nbaStyles.subNav}>
                            {nbaTabs.map(tab => {
                                const isActive = selectedNbaTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        style={{
                                            ...nbaStyles.subNavButton,
                                            backgroundColor: isActive ? colors.primary : '#f8f8f8',
                                            color: isActive ? colors.text : '#333',
                                            border: `1px solid ${isActive ? colors.primary : '#c5cad5'}`,
                                            boxShadow: isActive ? 'inset 0 -3px 0 rgba(0,0,0,0.15)' : 'none'
                                        }}
                                        onClick={() => setSelectedNbaTab(tab.key)}
                                    >
                                        <span style={nbaStyles.subNavLabel}>{tab.label}</span>
                                        <span style={nbaStyles.subNavDescription}>{tab.description}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedNbaTab === 'drafts' && renderDraftHistory()}
                        {selectedNbaTab === 'standings' && renderNbaStandings()}
                        {selectedNbaTab === 'rosters' && renderNbaRosters()}
                        {selectedNbaTab === 'stats' && renderNbaStats()}
                        {selectedNbaTab === 'transactions' && renderNbaTransactions()}
                        {selectedNbaTab === 'freeAgency' && renderNbaFreeAgents()}
                    </div>
                );
            case 'coachDirectory':
            default:
                return renderCoachDirectory();
        }
    };

    const historyTabs: Array<{ key: typeof selectedTab; label: string }> = [
        { key: 'myCareer', label: 'My Career' },
        { key: 'teamRecords', label: 'Team Records' },
        { key: 'nationalRankings', label: 'National Rankings' },
        { key: 'nba', label: 'NBA' },
        { key: 'coachDirectory', label: 'Coach Directory' },
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '15px' }}>
                {historyTabs.map(tab => (
                    <button
                        key={tab.key}
                        style={{
                            ...styles.button,
                            fontSize: '0.6rem',
                            padding: '8px',
                            backgroundColor: selectedTab === tab.key ? colors.primary : colors.secondary,
                            color: selectedTab === tab.key ? colors.text : buttonTextColorForInactive,
                            borderColor: selectedTab === tab.key ? colors.primary : '#808080',
                        }}
                        onClick={() => setSelectedTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '10px' }}>
                {renderHistoryTabContent()}
            </div>
            {selectedSchoolName && selectedSchoolTeam && (
                <SchoolHistoryModal
                    team={selectedSchoolTeam}
                    colors={SCHOOL_COLORS[selectedSchoolTeam.name] || colors}
                    historyEntries={schoolHistoryEntries}
                    draftPicks={schoolDraftPicks}
                    championships={schoolChampionships}
                    onClose={() => setSelectedSchoolName(null)}
                />
            )}
            {selectedCoachProfile && (
                <CoachProfileModal
                    coach={selectedCoachProfile.coach}
                    teamName={selectedCoachProfile.teamName}
                    colors={colors}
                    historyEntries={selectedCoachProfile.historyEntries}
                    nbaDrafts={state.history.nbaDrafts || []}
                    onClose={() => setSelectedCoachProfile(null)}
                />
            )}
        </div>
    );
};



const NilNegotiationView = ({ state, dispatch, colors }: { state: GameState; dispatch: React.Dispatch<GameAction>; colors: TeamColors }) => {
    const userTeam = state.userTeam;
    const [offerInputs, setOfferInputs] = useState<Record<string, { amount: number; years: number }>>({});
    const fanMoraleBaseline = userTeam ? (userTeam.fanMorale ?? userTeam.fanInterest ?? 50) : 50;

    useEffect(() => {
        if (!userTeam) return;
        
        // Safety Check: Detect corrupted data (NaN)
        const hasCorruption = state.nilNegotiationCandidates.some(c => 
            Number.isNaN(c.expectedNilValue) || Number.isNaN(c.minimumAsk) || c.minimumAsk === undefined
        );

        if (state.nilNegotiationCandidates.length > 0 && !hasCorruption) return;
        
        const seededCandidates = buildNilNegotiationCandidates(userTeam, {
            fanSentiment: fanMoraleBaseline,
            unfinishedBusinessBonus: 0,
        });
        
        if (seededCandidates.length > 0 || hasCorruption) {
             dispatch({ type: 'SEED_NIL_CANDIDATES', payload: { candidates: seededCandidates } });
        }
    }, [dispatch, fanMoraleBaseline, state.nilNegotiationCandidates, userTeam]);

    if (!userTeam) return <div style={{ fontSize: '0.8rem' }}>Select a team to manage NIL decisions.</div>;
    const remainingBudget = Math.max(0, (userTeam.nilBudget ?? 0) - (userTeam.nilBudgetUsed ?? 0));
    const totalBudget = userTeam.nilBudget ?? 0;
    const nilSpent = Math.max(0, totalBudget - remainingBudget);
    const nilUsagePercent = totalBudget > 0 ? Math.round((nilSpent / totalBudget) * 100) : 0;
    const nilUsageColor = nilUsagePercent < 65 ? '#1b5e20' : nilUsagePercent < 90 ? '#ef6c00' : '#b71c1c';
    const nilCycleOpen = state.status === GameStatus.NIL_NEGOTIATION;
    const hasLiveNegotiations = state.nilNegotiationCandidates.length > 0;
    const canFinalize = nilCycleOpen && hasLiveNegotiations;
    const candidateList = useMemo(() => {
        if (hasLiveNegotiations) return state.nilNegotiationCandidates;
        return buildNilNegotiationCandidates(userTeam, {
            fanSentiment: fanMoraleBaseline,
            unfinishedBusinessBonus: 0,
        });
    }, [fanMoraleBaseline, hasLiveNegotiations, state.nilNegotiationCandidates, userTeam]);
    const eligibleCandidates = useMemo(
        () => candidateList.filter(candidate => !isSeniorAcademicYear(candidate.year)),
        [candidateList]
    );
    const canMakeOffers = hasLiveNegotiations || eligibleCandidates.length > 0;

    const getDefaultOfferInput = useCallback(
        (candidate: NilNegotiationCandidate) => ({
            amount: candidate.minimumAsk,
            years: isJuniorAcademicYear(candidate.year) ? 1 : candidate.prefersMultiYear ? 2 : 1,
        }),
        []
    );

    const handleInputChange = (candidate: NilNegotiationCandidate, key: 'amount' | 'years', rawValue: number) => {
        const numericValue = Number.isNaN(rawValue) ? 0 : rawValue;
        setOfferInputs(prev => {
            const existing = prev[candidate.playerId] || getDefaultOfferInput(candidate);
            const next = { ...existing };
            if (key === 'amount') {
                next.amount = Math.max(0, numericValue);
            } else {
                next.years = isJuniorAcademicYear(candidate.year)
                    ? 1
                    : Math.max(1, Math.min(2, Math.round(numericValue)));
            }
            return { ...prev, [candidate.playerId]: next };
        });
    };

    const handleOffer = (candidate: NilNegotiationCandidate) => {
        if (isSeniorAcademicYear(candidate.year)) {
            dispatch({ type: 'SET_TOAST', payload: 'Seniors have exhausted their eligibility and cannot be retained.' });
            return;
        }
        const input = offerInputs[candidate.playerId] || getDefaultOfferInput(candidate);
        dispatch({
            type: 'MAKE_NIL_OFFER',
            payload: {
                playerId: candidate.playerId,
                amount: Math.round(Math.max(0, input.amount)),
                years: isJuniorAcademicYear(candidate.year) ? 1 : Math.max(1, Math.min(2, Math.round(input.years))),
            },
        });
    };

    const finalizeNegotiations = () => {
        if (!nilCycleOpen) {
            dispatch({ type: 'SET_TOAST', payload: 'The NIL hub becomes actionable once the offseason begins.' });
            return;
        }
        dispatch({ type: 'FINALIZE_NIL_NEGOTIATIONS' });
        dispatch({ type: 'EVALUATE_OFFSEASON' });
    };

    return (
        <div>
            <Subheading color={colors.primary}>NIL Retention Hub</Subheading>
            <p style={{ fontSize: '0.7rem', marginBottom: '10px' }}>
                Allocate Name/Image/Likeness resources to keep impact players from bolting early. Elite sponsors may subsidize certain archetypes.
            </p>
            <div style={styles.nilInfoBanner}>
                Underclassmen only appear here, and juniors can only recommit for a single season.
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px' }}>
                <div style={styles.healthCard}>
                    <strong>Total NIL Budget</strong>
                    <span style={{ fontSize: '0.9rem' }}>{formatCurrency(totalBudget)}</span>
                </div>
                <div style={styles.healthCard}>
                    <strong>Remaining Budget</strong>
                    <span style={{ fontSize: '0.9rem' }}>{formatCurrency(remainingBudget)}</span>
                    <p style={styles.nilBudgetMeta}>{nilUsagePercent}% spent ({formatCurrency(nilSpent)} used)</p>
                    <div style={styles.nilBudgetMeterTrack}>
                        <div
                            style={{
                                ...styles.nilBudgetMeterFill,
                                width: Math.min(100, nilUsagePercent) + '%',
                                backgroundColor: nilUsageColor,
                            }}
                        />
                    </div>
                </div>
                <div style={styles.healthCard}>
                    <strong>Sponsor Boost</strong>
                    <span style={{ fontSize: '0.9rem' }}>{formatCurrency(userTeam.nilBoostFromSponsor || 0)}</span>
                    <p style={styles.nilBudgetMeta}>Automatically applied to matching archetypes.</p>
                </div>
            </div>
            <div style={styles.tableContainer}>
                <table style={{ ...styles.table, fontSize: '0.65rem', minWidth: '1050px' }}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Player</th>
                            <th style={styles.th}>OVR</th>
                            <th style={styles.th}>Potential</th>
                            <th style={styles.th}>Draft Outlook</th>
                            <th style={styles.th}>Expectation</th>
                            <th style={styles.th}>Min Ask</th>
                            <th style={styles.th}>Sponsor Offset</th>
                            <th style={styles.th}>Budget Hit</th>
                            <th style={styles.th}>Offer (USD)</th>
                            <th style={styles.th}>Term</th>
                            <th style={styles.th}>Outlook</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eligibleCandidates.length === 0 && (
                            <tr>
                                <td style={styles.td} colSpan={13}>No eligible players for NIL retention this offseason.</td>
                            </tr>
                        )}
                        {eligibleCandidates.map(candidate => {
                            const input = offerInputs[candidate.playerId] || getDefaultOfferInput(candidate);
                            const normalizedOffer = Math.max(0, Math.round(input.amount));
                            const netOffer = normalizedOffer + (candidate.sponsorSubsidy || 0);
                            const shortfall = Math.max(0, candidate.minimumAsk - netOffer);
                            const budgetHit = Math.max(0, normalizedOffer - (candidate.sponsorSubsidy || 0));
                            const budgetColor = budgetHit > remainingBudget ? '#b71c1c' : budgetHit > Math.max(1, remainingBudget) * 0.5 ? '#ef6c00' : '#1b5e20';
                            const outlookFill = Math.max(0, Math.min(100, Math.round((netOffer / candidate.minimumAsk) * 100)));
                            const outlookColor = candidate.status === 'accepted'
                                ? '#1b5e20'
                                : candidate.status === 'declined'
                                    ? '#b71c1c'
                                    : shortfall <= 0
                                        ? '#1b5e20'
                                        : shortfall <= 25000
                                            ? '#ef6c00'
                                            : '#b71c1c';
                            const outlookText = candidate.status === 'accepted'
                                ? 'Locked in'
                                : candidate.status === 'declined'
                                    ? 'Moving on'
                                    : shortfall <= 0
                                        ? 'Competitive offer ready'
                                        : 'Needs ' + formatCurrency(shortfall) + ' more';
                            const rowBackground =
                                candidate.status === 'accepted'
                                    ? 'rgba(200, 230, 201, 0.5)'
                                    : candidate.status === 'declined'
                                        ? 'rgba(255, 205, 210, 0.45)'
                                        : shortfall <= 0
                                            ? 'rgba(232, 245, 233, 0.45)'
                                            : 'rgba(255, 244, 229, 0.45)';
                            let statusLabel = 'Awaiting action';
                            let statusTone = { bg: '#fffde7', color: '#8d6e63' };
                            if (candidate.status === 'accepted') {
                                statusLabel = 'Returning (' + candidate.acceptedYears + ' yr)';
                                statusTone = { bg: '#c8e6c9', color: '#1b5e20' };
                            } else if (candidate.status === 'declined') {
                                statusLabel = 'Departing';
                                statusTone = { bg: '#ffebee', color: '#b71c1c' };
                            } else if (shortfall <= 0) {
                                statusLabel = 'Offer in range';
                                statusTone = { bg: '#dcedc8', color: '#1b5e20' };
                            } else {
                                statusLabel = 'Needs sweeter deal';
                                statusTone = { bg: '#fff3e0', color: '#ef6c00' };
                            }
                            const isJunior = isJuniorAcademicYear(candidate.year);
                            const yearsOptions = isJunior ? [1] : [1, 2];
                            return (
                                <tr key={candidate.playerId} style={{ backgroundColor: rowBackground }}>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: 'bold' }}>{candidate.playerName}</div>
                                        <div style={{ fontSize: '0.55rem' }}>
                                            {candidate.year} - {candidate.position}
                                            {candidate.secondaryPosition ? ' / ' + candidate.secondaryPosition : ''}
                                        </div>
                                        <div style={{ fontSize: '0.55rem', color: '#666' }}>{candidate.reason}</div>
                                    </td>
                                    <td style={styles.td}>{candidate.overall}</td>
                                    <td style={styles.td}>{formatPotentialValue(candidate.potential)}</td>
                                    <td style={styles.td}>{candidate.draftProjection}</td>
                                    <td style={styles.td}>{formatCurrency(candidate.expectedNilValue)}</td>
                                    <td style={styles.td}>{formatCurrency(candidate.minimumAsk)}</td>
                                    <td style={styles.td}>
                                        {formatCurrency(candidate.sponsorSubsidy)}
                                        {candidate.sponsorSubsidy > 0 && <p style={styles.nilInsightText}>Brand offset applied</p>}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.nilStatusPill, backgroundColor: 'rgba(0,0,0,0.04)', color: budgetColor }}>
                                            {formatCurrency(budgetHit)}
                                        </span>
                                        <p style={{ ...styles.nilInsightText, color: budgetColor }}>
                                            {budgetHit > remainingBudget
                                                ? 'Need ' + formatCurrency(budgetHit - remainingBudget) + ' more'
                                                : 'Fits remaining budget'}
                                        </p>
                                    </td>
                                    <td style={styles.td}>
                                        <input
                                            type="number"
                                            min={0}
                                            step={5000}
                                            style={{
                                                width: '120px',
                                                border: candidate.status === 'pending' && shortfall > 0 ? '2px solid #b71c1c' : '1px solid #bdbdbd',
                                                backgroundColor: candidate.status === 'pending' && shortfall <= 0 ? 'rgba(200, 230, 201, 0.4)' : '#fff',
                                            }}
                                            value={normalizedOffer}
                                            onChange={e => handleInputChange(candidate, 'amount', Number(e.target.value))}
                                            disabled={candidate.status !== 'pending'}
                                        />
                                    </td>
                                    <td style={styles.td}>
                                        <select
                                            style={styles.select}
                                            value={input.years}
                                            onChange={e => handleInputChange(candidate, 'years', Number(e.target.value))}
                                            disabled={candidate.status !== 'pending' || isJunior}
                                            title={isJunior ? 'Juniors only have one season of eligibility left.' : 'Extend stability for multi-year minded sophomores.'}
                                        >
                                            {yearsOptions.map(option => (
                                                <option key={option} value={option}>{option} Year{option > 1 ? 's' : ''}</option>
                                            ))}
                                        </select>
                                        {isJunior && <p style={styles.nilTermHelper}>JR deal capped at 1 year</p>}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.nilOutlookBarTrack}>
                                            <div style={{ ...styles.nilOutlookBarFill, width: outlookFill + '%', backgroundColor: outlookColor }} />
                                        </div>
                                        <p style={{ ...styles.nilInsightText, color: outlookColor }}>{outlookText}</p>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.nilStatusPill, backgroundColor: statusTone.bg, color: statusTone.color }}>
                                            {statusLabel}
                                        </span>
                                        {candidate.status === 'pending' && <p style={styles.nilInsightText}>{candidate.reason}</p>}
                                    </td>
                                    <td style={styles.td}>
                                        <button
                                            style={{
                                                ...styles.smallButton,
                                                opacity: candidate.status === 'pending' && canFinalize ? 1 : 0.5,
                                                backgroundColor: shortfall > 0 ? '#FCE4EC' : styles.smallButton.backgroundColor,
                                            }}
                                            disabled={candidate.status !== 'pending' || !canMakeOffers}
                                            onClick={() => handleOffer(candidate)}
                                            title={shortfall > 0 ? 'Bump the offer to reach their ask' : 'Fire off the offer'}
                                        >
                                            Offer
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '20px' }}>
                <Subheading color={colors.primary}>Conversation Log</Subheading>
                {state.nilNegotiationHistory.length === 0 ? (
                    <p style={{ fontSize: '0.65rem', color: '#555' }}>No conversations logged yet. Make an offer to see feedback.</p>
                ) : (
                    <div style={styles.nilHistoryPanel}>
                        <ul style={styles.nilHistoryList}>
                            {state.nilNegotiationHistory.map((entry, index) => (
                                <li key={`${entry}-${index}`} style={styles.nilHistoryItem}>{entry}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                {!nilCycleOpen && (
                    <span style={{ fontSize: '0.6rem', color: '#555' }}>
                        NIL negotiations unlock right after the season recap. Finish your first season to access full controls.
                    </span>
                )}
                <button
                    style={{ ...styles.button, opacity: canFinalize ? 1 : 0.5 }}
                    onClick={finalizeNegotiations}
                    disabled={!canFinalize}
                    title={canFinalize ? 'Lock in NIL results' : 'Available once the offseason NIL window is active'}
                >
                    Finalize NIL Decisions
                </button>
            </div>
        </div>
    );
};const BoxScoreModal = ({ boxScore, onClose }: { boxScore: GameBoxScore, onClose: () => void }) => {
    const renderTable = (title: string, stats: GameBoxScore['homeTeamStats']) => {
        const totals = stats.reduce((sum, p) => ({
            points: sum.points + p.stats.points,
            rebounds: sum.rebounds + p.stats.rebounds,
            assists: sum.assists + p.stats.assists,
            minutes: sum.minutes + p.stats.minutes,
        }), { points: 0, rebounds: 0, assists: 0, minutes: 0 });
        return (
            <div style={{marginBottom: '15px'}}>
            <h4 style={{fontSize: '0.8rem', marginBottom: '5px'}}>{title}</h4>
            <div style={styles.tableContainer}>
            <table style={{...styles.table, fontSize: '0.6rem'}}>
                <thead>
                    <tr>
                        <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>Player</th>
                        <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>PTS</th>
                        <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>REB</th>
                        <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>AST</th>
                        <th style={{...styles.th, backgroundColor: '#ddd', color: '#000'}}>MIN</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.map(p => (
                        <tr key={p.playerId}>
                            <td style={styles.td}>{p.name} ({p.pos})</td>
                            <td style={styles.td}>{p.stats.points}</td>
                            <td style={styles.td}>{p.stats.rebounds}</td>
                            <td style={styles.td}>{p.stats.assists}</td>
                            <td style={styles.td}>{p.stats.minutes}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ddd' }}>
                        <td style={styles.td}>Totals</td>
                        <td style={styles.td}>{totals.points}</td>
                        <td style={styles.td}>{totals.rebounds}</td>
                        <td style={styles.td}>{totals.assists}</td>
                        <td style={styles.td}>{totals.minutes}</td>
                    </tr>
                </tfoot>
            </table>
            </div>
        </div>
        );
    };
    
    return (
         <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{ ...styles.title, fontSize: '1.2rem', textShadow: '2px 2px 0px #808080', color: 'black', marginBottom: '15px' }}>
                    Box Score: {boxScore.awayTeam} @ {boxScore.homeTeam}
                </h3>
                {renderTable(boxScore.awayTeam, boxScore.awayTeamStats)}
                {renderTable(boxScore.homeTeam, boxScore.homeTeamStats)}
            </div>
        </div>
    );
};

const SettingsModal = ({
    isOpen,
    onClose,
    onSave,
    onLoad,
    onDelete,
    onExport,
    onImport,
}: {
    isOpen: boolean,
    onClose: () => void,
    onSave: (slot: number) => void,
    onLoad: (slot: number) => void,
    onDelete: (slot: number) => void,
    onExport: () => void,
    onImport: (file: File) => void,
}) => {
    if (!isOpen) return null;

    const [slotsMeta, setSlotsMeta] = useState<(any)[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const metas = [1, 2, 3].map(slot => {
            const metaJSON = localStorage.getItem(`sweetSixteenMeta_v${CURRENT_SAVE_VERSION}_${slot}`);
            return metaJSON ? { slot, ...JSON.parse(metaJSON) } : { slot, empty: true };
        });
        setSlotsMeta(metas);
    }, [isOpen]);

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>Settings</h2>
                {slotsMeta.map(meta => (
                    <div key={meta.slot} style={styles.slotContainer}>
                        <div style={styles.slotInfo}>
                            <strong>Slot {meta.slot}:</strong>
                            <span style={{ marginLeft: '10px', fontSize: '0.6rem' }}>
                                {meta.empty ? <em>- Empty -</em> : `${meta.teamName} - ${2024 + meta.season}-${(2025 + meta.season) % 100} G${meta.game} (${meta.timestamp})`}
                            </span>
                        </div>
                        <div style={styles.slotActions}>
                            <button style={styles.smallButton} onClick={() => onSave(meta.slot)}>Save</button>
                            <button style={styles.smallButton} onClick={() => onLoad(meta.slot)} disabled={meta.empty}>Load</button>
                            <button style={{...styles.smallButton, backgroundColor: '#E0A0A0'}} onClick={() => onDelete(meta.slot)} disabled={meta.empty}>Delete</button>
                        </div>
                    </div>
                ))}
                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Manual Save Management</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button style={styles.smallButton} onClick={onExport}>Download Current Save</button>
                        <label style={{ fontSize: '0.7rem' }}>
                            Load From File:
                            <input
                                type="file"
                                accept="application/json"
                                ref={fileInputRef}
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        onImport(file);
                                        e.target.value = '';
                                    }
                                }}
                                style={{ display: 'block', marginTop: '5px' }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

		const OffersModal = ({ recruit, userTeamName, allTeams, gameInSeason, onOpenRecruitId, contactPointsUsed, contactPointsMax, scoutLevel, actionsDisabled, onContactRecruit, onOfferScholarship, onPullOffer, onCoachVisit, onScheduleOfficialVisit, onScout, onNegativeRecruit, onClose }: { recruit: Recruit; userTeamName: string; allTeams: Team[]; gameInSeason: number; onOpenRecruitId?: (recruitId: string) => void; contactPointsUsed?: number; contactPointsMax?: number; scoutLevel?: number; actionsDisabled?: boolean; onContactRecruit?: () => void; onOfferScholarship?: () => void; onPullOffer?: () => void; onCoachVisit?: () => void; onScheduleOfficialVisit?: () => void; onScout?: () => void; onNegativeRecruit?: () => void; onClose: () => void; }) => {
		    return (
		        <RecruitOfferDetailsModal
		            recruit={recruit}
		            userTeamName={userTeamName}
		            allTeams={allTeams}
		            gameInSeason={gameInSeason}
		            onOpenRecruit={onOpenRecruitId}
		            contactPointsUsed={contactPointsUsed}
		            contactPointsMax={contactPointsMax}
		            scoutLevel={scoutLevel}
		            actionsDisabled={actionsDisabled}
		            onContactRecruit={onContactRecruit}
		            onOfferScholarship={onOfferScholarship}
		            onPullOffer={onPullOffer}
		            onCoachVisit={onCoachVisit}
		            onScheduleOfficialVisit={onScheduleOfficialVisit}
		            onScout={onScout}
		            onNegativeRecruit={onNegativeRecruit}
		            onClose={onClose}
		        />
		    );

		    const teamsByName = useMemo(() => new Map(allTeams.map(t => [t.name, t])), [allTeams]);
		    const [showDebug, setShowDebug] = useState(false);
		    const [showLongshots, setShowLongshots] = useState(false);
		    const [sensitivity, setSensitivity] = useState(85);
		    const temperature = useMemo(() => clamp(15 - sensitivity * 0.13, 2.2, 10), [sensitivity]);
		
		    const shortlistPalette = ['#2563eb', '#16a34a', '#7c3aed', '#f59e0b', '#dc2626', '#0ea5e9', '#0891b2', '#db2777'];
		    const colorForTeam = (teamName: string, fallbackIndex: number): string => {
		        const tc = (SCHOOL_COLORS as Record<string, TeamColors | undefined>)[teamName];
		        const preferred = tc?.primary && tc.primary.toUpperCase() !== '#FFFFFF' ? tc.primary : tc?.secondary;
		        return preferred || shortlistPalette[fallbackIndex % shortlistPalette.length]!;
		    };
	
	    const pitchLabel = (teamName: string) => {
	        const history = recruit.offerHistory || [];
	        for (let i = history.length - 1; i >= 0; i--) {
	            const entry = history[i]!;
	            if (entry.teamName !== teamName) continue;
	            if (entry.revoked) return null;
	            return entry.pitchType;
	        }
	        return null;
	    };

    const powerRankings = useMemo(() => {
        const ranks = new Map<string, number>();
        [...allTeams]
            .sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10))
            .forEach((team, index) => {
                ranks.set(team.name, index + 1);
            });
        return ranks;
	    }, [allTeams]);

	    const offerNames = [...recruit.cpuOffers, ...(recruit.userHasOffered ? [userTeamName] : [])];
	    const rawOffers = offerNames.map(teamName => {
	        const team = teamsByName.get(teamName);
	        const breakdown = team ? calculateRecruitInterestBreakdown(recruit, team, { gameInSeason }) : null;
	        const score = breakdown ? breakdown.score : 0;
	        return {
	            name: teamName,
	            score,
	            prestige: team ? team.prestige : 0,
	            rank: team ? powerRankings.get(team.name) : undefined,
	            pitchType: breakdown?.pitchType ?? pitchLabel(teamName),
	            whyBadges: breakdown?.whyBadges ?? (team ? getRecruitWhyBadges(recruit, team, { gameInSeason }) : []),
	            debug: breakdown,
	        };
	    });

		    const sortedRawOffers = [...rawOffers].sort((a, b) => b.score - a.score);
		    const { shortlist, shares } = buildRecruitOfferShortlist(
		        sortedRawOffers.map(o => ({ name: o.name, score: o.score })),
		        { min: 3, max: 6, leaderWindow: 10, seedKey: `${recruit.id}:${gameInSeason}`, temperature }
		    );
	    const shortlistNames = new Set(shortlist.map(o => o.name));
	    const scoreLeaderName = shortlist[0]?.name ?? null;
	    const shareLeaderName = (() => {
	        let bestName: string | null = null;
	        let bestShare = -Infinity;
	        shortlist.forEach(o => {
	            const share = shares.get(o.name);
	            if (share == null) return;
	            if (share > bestShare) {
	                bestShare = share;
	                bestName = o.name;
	            }
	        });
	        return bestName ?? scoreLeaderName;
	    })();
	    const leaderShare = shareLeaderName ? shares.get(shareLeaderName) : undefined;
	
	    const shortlistOfferDetails = sortedRawOffers
	        .filter(o => shortlistNames.has(o.name))
		        .map(o => {
		            const share = shares.get(o.name);
		            const interestPct = share ?? 0;
		            const interestLabel = share == null || share < 1 ? '<1%' : `${Math.round(share)}%`;
		            const tier = o.name === shareLeaderName
		                ? 'Leader'
		                : (leaderShare != null && leaderShare > 0 ? (interestPct >= leaderShare * 0.65 ? 'In The Mix' : 'Chasing') : (interestPct >= 16 ? 'In The Mix' : 'Chasing'));
		            return { ...o, interestPct, interestLabel, tier };
		        });
	
		    const longshotOfferDetails = sortedRawOffers
		        .filter(o => !shortlistNames.has(o.name))
		        .map(o => ({ ...o, interestPct: 0, interestLabel: '<1%', tier: 'Longshot' }));
		
		    type OfferView = (typeof rawOffers)[number] & { interestPct: number; interestLabel: string; tier: string };
		
		    const interestSorted = [...shortlistOfferDetails].sort((a, b) => b.interestPct - a.interestPct);
		    const topLeader = interestSorted[0];
		    const topRunnerUp = interestSorted[1];
		    const leaderDelta = topLeader && topRunnerUp ? Math.max(0, topLeader.interestPct - topRunnerUp.interestPct) : null;
		
		    const userOfferName = recruit.userHasOffered ? userTeamName : null;
		    const userOffer = userOfferName ? [...shortlistOfferDetails, ...longshotOfferDetails].find(o => o.name === userOfferName) : undefined;
		    const leaderOffer = shareLeaderName ? shortlistOfferDetails.find(o => o.name === shareLeaderName) : undefined;
		    const userShareRank = userOfferName ? (interestSorted.findIndex(o => o.name === userOfferName) + 1) : 0;
		    const shareGapVsLeader = leaderOffer && userOffer ? Math.max(0, leaderOffer.interestPct - userOffer.interestPct) : null;
		    const scoreGapVsLeader = leaderOffer && userOffer ? Math.max(0, leaderOffer.score - userOffer.score) : null;
		
		    const motivationItems = [
		        { key: 'playingTime', label: 'Playing Time' },
		        { key: 'nil', label: 'NIL' },
		        { key: 'exposure', label: 'Exposure' },
		        { key: 'proximity', label: 'Proximity' },
		        { key: 'development', label: 'Development' },
		        { key: 'academics', label: 'Academics' },
		        { key: 'relationship', label: 'Relationships' },
		    ] as const;
		
		    const tierStyle = (tier: string): { fill: string; badgeBg: string; badgeText: string } => {
		        if (tier === 'Leader') return { fill: '#2e7d32', badgeBg: '#2e7d32', badgeText: '#fff' };
		        if (tier === 'In The Mix') return { fill: '#1565c0', badgeBg: '#1565c0', badgeText: '#fff' };
		        if (tier === 'Chasing') return { fill: '#6d4c41', badgeBg: '#6d4c41', badgeText: '#fff' };
		        return { fill: '#9ca3af', badgeBg: '#e5e7eb', badgeText: '#111827' };
		    };
		
		    const OfferCard = ({ offer }: { offer: OfferView }) => {
		        const style = tierStyle(offer.tier);
		        const barPct = offer.interestPct > 0 ? Math.max(offer.interestPct, 1) : 0;
		        return (
		            <div style={{
		                border: '1px solid #d6d6d6',
		                borderRadius: '12px',
		                padding: '10px 12px',
		                background: '#ffffff',
		                boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
		                display: 'flex',
		                flexDirection: 'column',
		                gap: '8px',
		            }}>
		                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
		                    <div style={{ minWidth: 0 }}>
		                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
		                            <span style={{ background: style.badgeBg, color: style.badgeText, borderRadius: '999px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 'bold' }}>
		                                {offer.tier}
		                            </span>
		                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={offer.name}>
		                                {offer.name}{offer.rank ? ` (#${offer.rank})` : ''}
		                            </span>
		                        </div>
		                        <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
		                            <span>Pres: <strong>{offer.prestige}</strong></span>
		                            {offer.pitchType ? <span>Pitch: <strong>{offer.pitchType}</strong></span> : null}
		                        </div>
		                        {offer.whyBadges?.length ? (
		                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
		                                {offer.whyBadges.map((b: string) => (
		                                    <span key={b} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px', fontSize: '0.65rem', color: '#111827' }}>
		                                        {b}
		                                    </span>
		                                ))}
		                            </div>
		                        ) : null}
		                    </div>
		                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
		                        <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: offer.tier === 'Leader' ? '#2e7d32' : '#111827' }}>
		                            {offer.interestLabel}
		                        </div>
		                        <div style={{ fontSize: '0.65rem', color: '#666' }}>Interest</div>
		                    </div>
		                </div>
		                <div style={{ width: '100%', background: '#eaeaea', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
		                    <div style={{ width: `${barPct}%`, background: style.fill, height: '100%' }} />
		                </div>
		                {offer.debug && (
		                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px', fontSize: '0.68rem', color: '#4b5563' }}>
		                        <div title="Overall fit score">
		                            Fit <strong style={{ color: '#111827' }}>{Math.round(offer.debug.score)}</strong>
		                        </div>
		                        <div title="Brand/region awareness (0-100)">
		                            Aware <strong style={{ color: '#111827' }}>{Math.round(offer.debug.awarenessScore)}</strong>
		                        </div>
		                        <div title="Estimated distance (miles)">
		                            Miles <strong style={{ color: '#111827' }}>{Math.round(offer.debug.estDistanceMiles)}</strong>
		                        </div>
		                        <div title="Momentum from recent actions (-20 to +20)">
		                            Mom{' '}
		                            <strong style={{ color: offer.debug.momentum >= 0 ? '#166534' : '#991b1b' }}>
		                                {offer.debug.momentum >= 0 ? `+${offer.debug.momentum}` : offer.debug.momentum}
		                            </strong>
		                        </div>
		                    </div>
		                )}
		                {showDebug && offer.debug && (
		                    <div style={{ fontSize: '0.68rem', color: '#555', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
		                        <span>Score: <strong>{offer.debug.score}</strong></span>
		                        <span>Awareness: <strong>{offer.debug.awarenessScore}</strong></span>
		                        <span>Dist: <strong>{offer.debug.estDistanceMiles}</strong> mi</span>
		                        <span>Momentum: <strong>{offer.debug.momentum}</strong></span>
		                    </div>
		                )}
		            </div>
		        );
		    };

		    return (
		        <div style={styles.modalOverlay} onClick={onClose}>
		            <div
		                style={{
		                    ...styles.modalContent,
		                    maxWidth: '1520px',
		                    width: '98vw',
		                    maxHeight: '92vh',
		                    overflow: 'hidden',
		                    padding: '16px',
		                    background: '#f5f5f5',
		                }}
		                onClick={e => e.stopPropagation()}
		            >
		                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
		                <h3 style={{ ...styles.title, fontSize: '1.2rem', textShadow: '2px 2px 0px #808080', color: 'black', marginBottom: '10px' }}>
		                    Offers for {recruit.name}
		                </h3>
		                {(recruit.hometownCity || recruit.hometownState || recruit.highSchoolName) && (
		                    <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '-6px', marginBottom: '8px' }}>
		                        {[recruit.hometownCity, recruit.hometownState].filter(Boolean).join(', ')}
		                        {recruit.highSchoolName ? ` - ${recruit.highSchoolName}` : ''}
		                    </p>
		                )}
		
		                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.7rem', color: '#333', marginBottom: '8px' }}>
		                    {recruit.nationalRank && <span style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '3px 8px' }}><strong>Nat</strong> #{recruit.nationalRank}</span>}
		                    {recruit.positionalRank && <span style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '3px 8px' }}><strong>Pos</strong> #{recruit.positionalRank}</span>}
		                    {recruit.recruitmentStage && <span style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '3px 8px' }}><strong>Stage</strong> {recruit.recruitmentStage}</span>}
		                    {typeof recruit.height === 'number' && <span style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '3px 8px' }}><strong>Ht</strong> {formatPlayerHeight(recruit.height)}</span>}
		                    {recruit.weight && <span style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '3px 8px' }}><strong>Wt</strong> {recruit.weight} lbs</span>}
		                    {recruit.wingspan && <span style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '3px 8px' }}><strong>WS</strong> {recruit.wingspan}&quot;</span>}
		                    {recruit.playStyleTags?.length ? <span style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '3px 8px' }}><strong>Tags</strong> {recruit.playStyleTags.slice(0, 3).join(', ')}</span> : null}
		                </div>
		
		                {recruit.lastRecruitingNews && (
		                    <p style={{ fontSize: '0.75rem', color: '#111827', background: '#fff', border: '1px solid #ddd', padding: '8px 10px', borderRadius: '12px', marginBottom: '10px' }}>
		                        {recruit.lastRecruitingNews}
		                    </p>
		                )}
		
		                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
		                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#333' }}>
		                        <input type="checkbox" checked={showDebug} onChange={e => setShowDebug(e.target.checked)} />
		                        Debug
		                    </label>
		                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.7rem', color: '#333' }}>
		                        <span style={{ fontWeight: 'bold' }}>Interest Spread</span>
		                        <input type="range" min={0} max={100} value={sensitivity} onChange={e => setSensitivity(parseInt(e.target.value))} />
		                        <span style={{ width: '34px', textAlign: 'right' }}>{sensitivity}</span>
		                    </label>
		                    <span style={{ fontSize: '0.7rem', color: '#666' }} title="Lower temperature = more separation in shares">
		                        temp {temperature.toFixed(1)}
		                    </span>
		                    <span style={{ fontSize: '0.7rem', color: '#666' }} title="These percentages are a share of the shortlist only (they sum to ~100%).">
		                        (shortlist share)
		                    </span>
		                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
		                        Fit score → shortlist share (higher fit usually means higher share).
		                    </span>
		                </div>
		
		                <div style={{ display: 'flex', gap: '12px', height: 'calc(92vh - 250px)', minHeight: '420px' }}>
		                    <div style={{ flex: '1 1 62%', minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px' }}>
		                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#111827' }}>Shortlist</div>
		                        {userOfferName ? (
		                            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '10px 12px' }}>
		                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
		                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#111827' }}>
		                                        Your Standing: {userOfferName}
		                                    </div>
		                                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
		                                        {userOffer && userOffer.tier === 'Longshot' ? 'Not in shortlist (showing as longshot).' : 'In shortlist.'}
		                                    </div>
		                                </div>
		                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.72rem', color: '#374151' }}>
		                                    <span>
		                                        Your interest: <strong>{recruit.interest}</strong>/100 <span style={{ color: '#6b7280' }}>(absolute)</span>
		                                    </span>
		                                    <span>
		                                        Share: <strong>{userOffer ? userOffer.interestLabel : '<1%'}</strong>
		                                        {userShareRank > 0 ? <span style={{ color: '#6b7280' }}> (#{userShareRank})</span> : null}
		                                    </span>
		                                    {leaderOffer && userOffer ? (
		                                        <span>
		                                            Behind leader: <strong>{shareGapVsLeader != null ? `${shareGapVsLeader.toFixed(1)}%` : '—'}</strong> share,{' '}
		                                            <strong>{scoreGapVsLeader != null ? Math.round(scoreGapVsLeader) : '—'}</strong> fit
		                                        </span>
		                                    ) : null}
		                                    {userOffer?.pitchType ? <span>Pitch: <strong>{userOffer.pitchType}</strong></span> : null}
		                                    {userOffer?.debug ? <span>Miles: <strong>{Math.round(userOffer.debug.estDistanceMiles)}</strong></span> : null}
		                                    {userOffer?.debug ? (
		                                        <span>
		                                            Momentum:{' '}
		                                            <strong style={{ color: userOffer.debug.momentum >= 0 ? '#166534' : '#991b1b' }}>
		                                                {userOffer.debug.momentum >= 0 ? `+${userOffer.debug.momentum}` : userOffer.debug.momentum}
		                                            </strong>
		                                        </span>
		                                    ) : null}
		                                </div>
		                            </div>
		                        ) : null}
		                        {shortlistOfferDetails.length ? (
		                            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '10px 12px' }}>
		                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
		                                    <div style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 'bold' }}>
		                                        {topLeader ? `Leader: ${topLeader.name} (${topLeader.interestLabel})` : 'Leader: —'}
		                                    </div>
		                                    <div style={{ fontSize: '0.75rem', color: '#374151' }}>
		                                        {topRunnerUp ? `Runner-up: ${topRunnerUp.name} (${topRunnerUp.interestLabel})` : 'Runner-up: —'}
		                                        {leaderDelta != null ? <span style={{ marginLeft: '8px', color: '#6b7280' }}>Δ {leaderDelta.toFixed(1)}%</span> : null}
		                                    </div>
		                                </div>
		                                <div style={{ marginTop: '8px', height: '12px', borderRadius: '999px', overflow: 'hidden', display: 'flex', background: '#eaeaea' }}>
		                                    {interestSorted.map((o, idx) => (
		                                        <div
		                                            key={o.name}
		                                            title={`${o.name} ${o.interestLabel}`}
		                                            style={{
		                                                width: `${Math.max(0, o.interestPct)}%`,
		                                                background: colorForTeam(o.name, idx),
		                                                minWidth: o.interestPct > 0 ? '2px' : undefined,
		                                            }}
		                                        />
		                                    ))}
		                                </div>
		                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
		                                    {interestSorted.slice(0, 5).map((o, idx) => (
		                                        <span key={o.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px', fontSize: '0.65rem', color: '#111827' }}>
		                                            <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: colorForTeam(o.name, idx), display: 'inline-block' }} />
		                                            {o.name} <span style={{ color: '#6b7280' }}>{o.interestLabel}</span>
		                                        </span>
		                                    ))}
		                                </div>
		                            </div>
		                        ) : null}
		                        <div style={{ overflowY: 'auto', paddingRight: '6px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '10px' }}>
		                            {shortlistOfferDetails.length ? shortlistOfferDetails.map((offer: OfferView) => (
		                                <OfferCard key={offer.name} offer={offer} />
		                            )) : <div style={{ fontSize: '0.8rem', color: '#555' }}>No offers yet.</div>}
		                        </div>
		                        {longshotOfferDetails.length > 0 && (
		                            <div style={{ marginTop: '6px' }}>
		                                <button style={{ ...styles.smallButton, width: 'fit-content' }} onClick={() => setShowLongshots(v => !v)}>
		                                    {showLongshots ? 'Hide' : 'Show'} Longshots ({longshotOfferDetails.length})
		                                </button>
		                                {showLongshots && (
		                                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
		                                        {longshotOfferDetails.map((offer: OfferView) => (
		                                            <div key={offer.name} style={{ fontSize: '0.72rem', color: '#444', background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
		                                                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={offer.name}>
		                                                    {offer.name}{offer.rank ? ` (#${offer.rank})` : ''} (Pres: {offer.prestige}{offer.pitchType ? ` - ${offer.pitchType}` : ''})
		                                                </span>
		                                                <span style={{ color: '#666' }}>{offer.interestLabel}</span>
		                                            </div>
		                                        ))}
		                                    </div>
		                                )}
		                            </div>
		                        )}
		                    </div>
		
		                    <div style={{ flex: '1 1 38%', minWidth: 0, overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
		                        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '10px 12px' }}>
		                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>Recruit Profile</div>
		                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.7rem', color: '#374151', marginBottom: '10px' }}>
		                                {recruit.archetype ? <span style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px' }}><strong>Archetype</strong> {recruit.archetype}</span> : null}
		                                {recruit.dealbreaker ? <span style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px' }}><strong>Dealbreaker</strong> {recruit.dealbreaker}</span> : null}
		                                {recruit.nilPriority ? <span style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px' }}><strong>NIL</strong> {recruit.nilPriority}</span> : null}
		                                {typeof recruit.resilience === 'number' ? <span style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px' }}><strong>Resilience</strong> {recruit.resilience}</span> : null}
		                                {typeof recruit.coachability === 'number' ? <span style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px' }}><strong>Coachability</strong> {recruit.coachability}</span> : null}
		                                {typeof recruit.hypeLevel === 'number' ? <span style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px' }}><strong>Hype</strong> {recruit.hypeLevel}</span> : null}
		                            </div>
		                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px' }}>What Matters (weights)</div>
		                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
		                                {motivationItems.map(item => {
		                                    const value = recruit.motivations ? recruit.motivations[item.key] : 50;
		                                    return (
		                                        <div key={item.key} style={{ minWidth: 0 }}>
		                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#374151', marginBottom: '2px' }}>
		                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
		                                                <span style={{ color: '#6b7280' }}>{value}</span>
		                                            </div>
		                                            <div style={{ width: '100%', background: '#eef2f7', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
		                                                <div style={{ width: `${clamp(value, 0, 100)}%`, background: '#2563eb', height: '100%' }} />
		                                            </div>
		                                        </div>
		                                    );
		                                })}
		                            </div>
		                        </div>
		                        {(recruit.offerHistory?.length || recruit.visitHistory?.length) ? (
		                            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '10px 12px' }}>
		                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>Timeline</div>
		                                <div style={{ fontSize: '0.72rem', color: '#444' }}>
		                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Offers</div>
		                                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
		                                        {[...(recruit.offerHistory || [])].slice(-10).reverse().map((e, idx) => (
		                                            <li key={`${e.teamName}-${e.week}-${idx}`} style={{ opacity: e.revoked ? 0.7 : 1 }}>
		                                                Week {e.week}: {e.teamName} — {e.pitchType}{e.revoked ? ' (revoked)' : ''}
		                                            </li>
		                                        ))}
		                                    </ul>
		                                    <div style={{ fontWeight: 'bold', margin: '10px 0 4px 0' }}>Visits</div>
		                                    <ul style={{ margin: 0, paddingLeft: '18px' }}>
		                                        {[...(recruit.visitHistory || [])].slice(-10).reverse().map((e, idx) => (
		                                            <li key={`${e.teamName}-${e.week}-${idx}`}>
		                                                Week {e.week}: {e.kind} — {e.teamName}{e.outcome ? ` (${e.outcome})` : ''}
		                                            </li>
		                                        ))}
		                                    </ul>
		                                </div>
		                            </div>
		                        ) : null}
		
		                        {recruit.relationships?.length ? (
		                            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '10px 12px' }}>
		                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>Relationships</div>
		                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.72rem', color: '#444' }}>
		                                    {recruit.relationships.map((rel, idx) => (
		                                        <li key={`${rel.personId}-${idx}`}>
		                                            {rel.type}: {rel.displayName}{rel.notes ? ` - ${rel.notes}` : ''}
		                                        </li>
		                                    ))}
		                                </ul>
		                            </div>
		                        ) : null}
		                    </div>
		                </div>
		
		                {recruit.verbalCommitment && (
		                    <p style={{marginTop: '10px', fontSize: '0.8rem', fontWeight: 'bold'}}>
		                        Verbally Committed: {recruit.verbalCommitment}
		                    </p>
		                )}
		            </div>
		        </div>
		    );
	};



const SeasonAttendanceDetailModal = ({ seasonRecord, teamName, colors, onClose }: { seasonRecord: UserSeasonRecord, teamName: string, colors: TeamColors, onClose: () => void }) => {
    if (!seasonRecord) return null;

    const capacity = ARENA_CAPACITIES[teamName] || 5000;
    
    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{ ...styles.title, fontSize: '1.3rem', color: colors.primary, marginBottom: '15px' }}>
                    Game Attendance for {2024 + seasonRecord.season}
                </h3>
                 <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div style={styles.tableContainer}>
                    <table style={{...styles.table, fontSize: '0.6rem'}}>
                        <thead>
                            <tr>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Opponent</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Attendance</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Capacity %</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seasonRecord.gameAttendance.map((game, index) => (
                                <tr key={index}>
                                    <td style={styles.td}>vs {game.opponent}</td>
                                    <td style={styles.td}>{game.attendance.toLocaleString()} / {capacity.toLocaleString()}</td>
                                    <td style={styles.td}>{((game.attendance / capacity) * 100).toFixed(1)}%</td>
                                    <td style={styles.td}>{formatCurrency(game.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FinancialAdvisorNote = ({ score }: { score: number }) => {
    let advice = '';
    if (score > 15) advice = "Fans think this is a bargain! We have significant room to raise prices here.";
    else if (score > 8) advice = "This is a great price point for the fans. We could probably raise it a bit without much pushback.";
    else if (score > 2) advice = "Fans are happy with this price. We might be able to increase it slightly.";
    else if (score <= 2) advice = "This price is right at market value. Any changes should be made cautiously.";
    else if (score >= -8) advice = "Fans are starting to feel these prices are a bit high. Consider holding or lowering them.";
    else if (score >= -15) advice = "There's significant grumbling about this price. A reduction might improve fan happiness.";
    else advice = "Fans are outraged. We should lower this price immediately to avoid hurting attendance and sales.";

    return (
        <p style={{ fontSize: '0.6rem', fontStyle: 'italic', color: '#555', marginTop: '5px' }}>
            Advisor: "{advice}"
        </p>
    );
};

const PriceSentimentIndicator = ({ score, willingness }: { score: number, willingness: number }) => {
    const getIndicator = () => {
        if (score > 15) return { emoji: 'ðŸ¤©', label: 'Bargain!' };      // Very Good
        if (score > 8) return { emoji: 'ðŸ˜„', label: 'Great Deal' };     // Good
        if (score > 2) return { emoji: 'ðŸ™‚', label: 'Fair Price' };     // Slightly Good
        if (score >= -2) return { emoji: 'ðŸ˜', label: 'Neutral' };      // Neutral
        if (score >= -8) return { emoji: 'ðŸ¤”', label: 'A Bit High' };    // Slightly Bad
        if (score >= -15) return { emoji: 'ðŸ˜ ', label: 'Too Expensive' }; // Bad
        return { emoji: 'ðŸ¤¬', label: 'Outrageous!' };                   // Very Bad
    };
    const { emoji, label } = getIndicator();
    return (
      <span style={{ minWidth: '150px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.6rem' }}>
        <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 'bold' }}>{label}</span>
            <span style={{ color: '#555' }}>(Target: ${willingness})</span>
        </div>
      </span>
    );
};

const describeEndowmentTier = (score: number): string => {
    if (score >= 90) return 'Generational Wealth';
    if (score >= 80) return 'Blue-Chip Funded';
    if (score >= 65) return 'Well Financed';
    if (score >= 50) return 'Stable Backing';
    return 'Resourceful';
};

const describeDonationLevel = (level: number): string => {
    if (level >= 90) return 'Record-Breaking Drive';
    if (level >= 70) return 'Energized Alumni';
    if (level >= 50) return 'Steady Support';
    if (level >= 30) return 'Guarded Donors';
    return 'Fatigued Boosters';
};

const describeMomentum = (momentum: number): string => {
    if (momentum >= 8) return 'Surging';
    if (momentum >= 3) return 'Building Steam';
    if (momentum > -3) return 'Holding';
    if (momentum > -8) return 'Cooling';
    return 'Pullback';
};

type SchoolHistoryModalProps = {
    team: Team;
    colors: TeamColors;
    historyEntries: TeamHistory[];
    draftPicks: { season: number; round: number; pick: number; player: string; nbaTeam: string }[];
    championships: number;
    onClose: () => void;
};

const SchoolHistoryModal = ({ team, colors, historyEntries, draftPicks, championships, onClose }: SchoolHistoryModalProps) => {
    const coach = team.headCoach;
    const wealth = team.wealth;
    const historySlice = historyEntries.slice(0, 6);
    const formatSeasonLabel = (season: number) => `${2024 + season}-${(2025 + season) % 100}`;
    const wealthTierLabel = describeEndowmentTier(wealth.endowmentScore);
    const donationLabel = describeDonationLevel(wealth.donationLevel);
    const momentumLabel = describeMomentum(wealth.donorMomentum);

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{ ...styles.modalContent, maxWidth: '960px' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{ ...styles.title, fontSize: '1.4rem', color: colors.primary, marginBottom: '10px' }}>
                    {team.name} Program Snapshot
                </h3>
                <p style={{ fontSize: '0.75rem', marginBottom: '15px' }}>
                    Prestige {team.prestige} Â· Sponsor {team.sponsor?.name || 'Independent'} Â· Championships: {championships}
                </p>
                <div style={styles.coachModalGrid}>
                    <div style={styles.coachModalCard}>
                        <h4 style={{ margin: '0 0 8px', color: colors.primary }}>Head Coach</h4>
                        {coach ? (
                            <ul style={styles.modalList}>
                                <li><strong>{coach.name}</strong> Â· Age {coach.age} Â· {coach.almaMater}</li>
                                <li>Style: {coach.style}</li>
                                <li>Tenure: {coach.seasons} seasons</li>
                                <li>Career Record: {coach.careerWins}-{coach.careerLosses}</li>
                                <li>Current Season: {coach.seasonWins}-{coach.seasonLosses}</li>
                                <li>Reputation: {coach.reputation}</li>
                            </ul>
                        ) : (
                            <p style={{ fontSize: '0.7rem' }}>No head coach data available.</p>
                        )}
                    </div>
                    <div style={styles.coachModalCard}>
                        <h4 style={{ margin: '0 0 8px', color: colors.primary }}>Program Details</h4>
                        <ul style={styles.modalList}>
                            <li>Fan Interest: {team.fanInterest.toFixed(1)}</li>
                            <li>Current Record: {team.record.wins}-{team.record.losses}</li>
                            <li>Wealth Tier: {wealthTierLabel}</li>
                            <li>Donor Energy: {donationLabel} ({momentumLabel})</li>
                            <li>Booster Pool: {team.wealth.boosterPool} pts</li>
                        </ul>
                    </div>
                </div>
                <Subheading color={colors.primary}>Recent Seasons</Subheading>
                {historySlice.length ? (
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Season</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Prestige</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Rank</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historySlice.map(entry => (
                                    <tr key={`${team.name}-${entry.season}`}>
                                        <td style={styles.td}>{formatSeasonLabel(entry.season)}</td>
                                        <td style={styles.td}>{entry.prestige}</td>
                                        <td style={styles.td}>{entry.rank || 'â€”'}</td>
                                        <td style={styles.td}>{formatCurrency(entry.totalRevenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem', marginBottom: '15px' }}>No historical records logged yet.</p>
                )}
                <Subheading color={colors.primary}>All-Time Program Draft Picks ({draftPicks.length})</Subheading>
                {ACTIVE_NBA_PLAYERS_DATA[team.name] && (
                    <p style={{ fontSize: '0.7rem', marginBottom: '10px', fontStyle: 'italic' }}>
                        Active NBA Players: {ACTIVE_NBA_PLAYERS_DATA[team.name].activeCount} Â· Total Annual Earnings: {formatCurrency(ACTIVE_NBA_PLAYERS_DATA[team.name].totalEarnings)}
                    </p>
                )}
                {draftPicks.length ? (
                    <div style={{ ...styles.tableContainer, maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Season</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pick</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>NBA Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draftPicks.map((pick, idx) => (
                                    <tr key={`${pick.player}-${pick.season}-${idx}`}>
                                        <td style={styles.td}>{formatSeasonLabel(pick.season)}</td>
                                        <td style={styles.td}>{pick.pick > 60 ? 'Undrafted' : `R${pick.round} #${pick.pick}`}</td>
                                        <td style={styles.td}>{pick.player}</td>
                                        <td style={styles.td}>{NBA_ACRONYM_TO_NAME[pick.nbaTeam] || pick.nbaTeam}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>No players drafted yet.</p>
                )}
            </div>
        </div>
    );
};

type CoachProfileModalProps = {
    coach: HeadCoachProfile;
    teamName?: string;
    colors: TeamColors;
    historyEntries: (TeamHistory & { teamName: string })[];
    nbaDrafts: NBADraftHistoryEntry[];
    onClose: () => void;
};

const CoachProfileModal = ({ coach, teamName, colors, historyEntries, nbaDrafts, onClose }: CoachProfileModalProps) => {
    const modalColors = teamName ? (SCHOOL_COLORS[teamName] || colors) : colors;
    const formatSeasonLabel = (season: number) => `${2024 + season}-${(2025 + season) % 100}`;
    const earliestRecordedSeason = coach.careerStops && coach.careerStops.length
        ? coach.careerStops.reduce((min, entry) => Math.min(min, entry.startSeason), coach.startSeason)
        : coach.startSeason;
    const draftedEntries = useMemo(() => {
        const picks: { season: number; player: string; team: string; nbaTeam: string; round: number; pick: number }[] = [];
        
        historyEntries.forEach(history => {
            const draftYear = history.season;
            const draft = nbaDrafts.find(d => d.season === draftYear);
            if (draft) {
                draft.picks.forEach(pick => {
                    if (pick.originalTeam === history.teamName) {
                        picks.push({
                            season: draftYear,
                            player: pick.player.name,
                            team: history.teamName,
                            nbaTeam: pick.nbaTeam,
                            round: pick.round,
                            pick: pick.pick
                        });
                    }
                });
            }
        });

        return picks.sort((a, b) => b.season - a.season || a.pick - b.pick);
    }, [historyEntries, nbaDrafts]);
    const historySlice = historyEntries.slice(0, 8);
    const totalHistorySeasons = historyEntries.length;
    const averagePrestige = totalHistorySeasons
        ? (historyEntries.reduce((sum, entry) => sum + entry.prestige, 0) / totalHistorySeasons).toFixed(1)
        : null;
    const bestRank = historyEntries.reduce<number | null>((best, entry) => {
        if (typeof entry.rank === 'number' && entry.rank > 0) {
            return best === null ? entry.rank : Math.min(best, entry.rank);
        }
        return best;
    }, null);
    const bestRevenueSeason = historyEntries.reduce<(TeamHistory & { teamName: string }) | null>((bestEntry, entry) => {
        if (!bestEntry || entry.totalRevenue > bestEntry.totalRevenue) {
            return entry;
        }
        return bestEntry;
    }, null);

    const historyByTeam = useMemo(() => {
        const grouped = new Map<string, (TeamHistory & { teamName: string })[]>();
        historyEntries.forEach(entry => {
            const bucket = grouped.get(entry.teamName) || [];
            bucket.push(entry);
            grouped.set(entry.teamName, bucket);
        });
        return grouped;
    }, [historyEntries]);

    const stopSummaries = useMemo(() => {
        const stops = coach.careerStops?.length
            ? coach.careerStops
            : (teamName ? [{ teamName, startSeason: coach.startSeason }] : []);
        return stops.map(stop => {
            const entries = historyByTeam.get(stop.teamName) || [];
            const resolvedEnd = typeof stop.endSeason === 'number'
                ? stop.endSeason
                : entries.length
                    ? entries.reduce((max, entry) => Math.max(max, entry.season), stop.startSeason)
                    : (coach.retired && coach.lastTeam === stop.teamName && typeof coach.retiredSeason === 'number'
                        ? coach.retiredSeason
                        : null);
            const seasonsAtStop = resolvedEnd != null ? Math.max(1, resolvedEnd - stop.startSeason + 1) : null;
            const bestStopRank = entries.reduce<number | null>((bestRankValue, entry) => {
                if (typeof entry.rank === 'number' && entry.rank > 0) {
                    return bestRankValue === null ? entry.rank : Math.min(bestRankValue, entry.rank);
                }
                return bestRankValue;
            }, null);
            const avgStopPrestige = entries.length
                ? (entries.reduce((sum, entry) => sum + entry.prestige, 0) / entries.length).toFixed(1)
                : null;

            return {
                teamName: stop.teamName,
                displayRange: resolvedEnd != null
                    ? `${formatSeasonLabel(stop.startSeason)} - ${formatSeasonLabel(resolvedEnd)}`
                    : `${formatSeasonLabel(stop.startSeason)} - Present`,
                tenureLabel: seasonsAtStop ? `${seasonsAtStop} season${seasonsAtStop > 1 ? 's' : ''}` : 'In progress',
                bestRank: bestStopRank,
                avgPrestige: avgStopPrestige,
            };
        });
    }, [coach, teamName, historyByTeam]);

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{ ...styles.modalContent, maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{ ...styles.title, fontSize: '1.3rem', color: modalColors.primary, marginBottom: '10px' }}>
                    Coach {coach.name}
                </h3>
                <p style={{ fontSize: '0.75rem', marginBottom: '10px' }}>
                    {teamName ? `Current Team: ${teamName}` : coach.retired ? `Formerly: ${coach.lastTeam || 'Various Programs'}` : 'Independent'}
                </p>
                <div style={styles.coachModalGrid}>
                    <div style={styles.coachModalCard}>
                        <h4 style={{ margin: '0 0 8px', color: modalColors.primary }}>Profile</h4>
                        <ul style={styles.modalList}>
                            <li>Age: {coach.age}</li>
                            <li>Alma Mater: {coach.almaMater}</li>
                            <li>Style: {coach.style}</li>
                            <li>Career Record: {coach.careerWins}-{coach.careerLosses}</li>
                            <li>Current Season: {coach.seasonWins}-{coach.seasonLosses}</li>
                            {(coach.ncaaAppearances || coach.finalFours || coach.championships || coach.sweetSixteens) && (
                                <li>
                                    NCAA: {coach.ncaaAppearances ?? 0} apps Â· Sweet 16s {coach.sweetSixteens ?? 0} Â· Final Fours {coach.finalFours ?? 0} Â· Titles {coach.championships ?? 0}
                                </li>
                            )}
                            <li>Reputation: {coach.reputation}</li>
                            {coach.retired && <li>Retired: {coach.retiredSeason ? `${2024 + coach.retiredSeason}` : 'Yes'} ({coach.retiredReason || 'Age'})</li>}
                        </ul>
                    </div>
                    <div style={styles.coachModalCard}>
                        <h4 style={{ margin: '0 0 8px', color: modalColors.primary }}>Career Snapshot</h4>
                        <ul style={styles.modalList}>
                            <li>Stops coached: {stopSummaries.length || 1}</li>
                            <li>Seasons logged: {totalHistorySeasons || '--'}</li>
                            <li>Avg prestige: {averagePrestige ?? '--'}</li>
                            <li>Best rank: {bestRank ? `#${bestRank}` : '--'}</li>
                            <li>Draft picks: {coach.draftedPlayers?.length || 0}</li>
                            <li>Best revenue: {bestRevenueSeason ? `${bestRevenueSeason.teamName} ${formatSeasonLabel(bestRevenueSeason.season)} (${formatCurrency(bestRevenueSeason.totalRevenue)})` : '--'}</li>
                        </ul>
                    </div>
                </div>
                <Subheading color={modalColors.primary}>Coaching Journey</Subheading>
                {stopSummaries.length ? (
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Program</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Years</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Tenure</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Highlights</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stopSummaries.map(stop => {
                                    const highlights = [
                                        stop.bestRank ? `Best Rank #${stop.bestRank}` : '',
                                        stop.avgPrestige ? `Avg Prestige ${stop.avgPrestige}` : '',
                                    ].filter(Boolean).join(' | ') || 'No data logged';
                                    return (
                                        <tr key={`${coach.name}-${stop.teamName}-${stop.displayRange}`}>
                                            <td style={styles.td}>{stop.teamName}</td>
                                            <td style={styles.td}>{stop.displayRange}</td>
                                            <td style={styles.td}>{stop.tenureLabel}</td>
                                            <td style={styles.td}>{highlights}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>No prior coaching stops recorded.</p>
                )}
                <Subheading color={modalColors.primary}>Season Results ({historyEntries.length})</Subheading>
                {historySlice.length ? (
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.6rem', minWidth: '680px' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Season</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Team</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Prestige</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Rank</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Record</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Postseason</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historySlice.map(entry => (
                                    <tr key={`${entry.teamName}-${entry.season}`}>
                                        <td style={styles.td}>{formatSeasonLabel(entry.season)}</td>
                                        <td style={styles.td}>{entry.teamName}</td>
                                        <td style={styles.td}>{entry.prestige}</td>
                                        <td style={styles.td}>{typeof entry.rank === 'number' && entry.rank > 0 ? `#${entry.rank}` : '--'}</td>
                                        <td style={styles.td}>{typeof entry.wins === 'number' && typeof entry.losses === 'number' ? `${entry.wins}-${entry.losses}` : '--'}</td>
                                        <td style={styles.td}>{entry.postseasonResult || '--'}</td>
                                        <td style={styles.td}>{formatCurrency(entry.totalRevenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>No season records tracked for this coach yet.</p>
                )}
                <Subheading color={modalColors.primary}>Players Drafted by Coach ({draftedEntries.length})</Subheading>
                {draftedEntries.length ? (
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Season</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Team</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>NBA Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draftedEntries.map((pick, idx) => (
                                    <tr key={`${coach.name}-${idx}-${pick.player}`}>
                                        <td style={styles.td}>{`${2024 + pick.season}`}</td>
                                        <td style={styles.td}>{pick.pick > 60 ? 'Undrafted' : `R${pick.round} #${pick.pick}`} - {pick.player}</td>
                                        <td style={styles.td}>{pick.team}</td>
                                        <td style={styles.td}>{NBA_ACRONYM_TO_NAME[pick.nbaTeam] || pick.nbaTeam}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>No NBA draft picks yet.</p>
                )}
            </div>
        </div>
    );
};

type SponsorModalProps = {
    team: Team;
    allTeams: Team[];
    sponsors: { [key in SponsorName]?: SponsorData };
    colors: TeamColors;
    onClose: () => void;
    onAcceptOffer: (offer: SponsorOffer) => void;
};



const SeasonRecapModal = ({ recapData, onClose }: { recapData: GameState['seasonRecapData'], onClose: () => void }) => {
    if (!recapData) return null;
    
    const { record, tournamentResult, prestigeChange, coachReputation, coachReputationChange, signings, drafted, totalRevenue, projectedRevenue, cpi } = recapData;
    const reputationValue = coachReputation ?? 0;
    const reputationChangeValue = coachReputationChange ?? 0;

    const prestigeStyle = prestigeChange === 0 ? {} : { color: prestigeChange > 0 ? 'green' : 'red', fontWeight: 'bold' };
    const prestigeText = prestigeChange > 0 ? `▲ +${prestigeChange}` : `▼ ${prestigeChange}`;
    const reputationStyle = reputationChangeValue === 0 ? {} : { color: reputationChangeValue > 0 ? 'green' : 'red', fontWeight: 'bold' };
    const reputationText = reputationChangeValue >= 0 ? `+${reputationChangeValue}` : `${reputationChangeValue}`;
    
    const renderList = (title: string, items: { name: string, details: React.ReactNode }[]) => (
        <div style={{ marginBottom: '15px' }}>
            <h4 style={{...styles.modalSubheading, color: '#000' }}>{title}</h4>
            {items.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.6rem' }}>
                    {items.map((item, index) => <li key={index}><strong>{item.name}</strong> - {item.details}</li>)}
                </ul>
            ) : <p style={{ fontSize: '0.6rem' }}>None</p>}
        </div>
    );

    const cpiStatusColor = (status: string | undefined) => {
        if (status === 'Safe') return 'green';
        if (status === 'Warm') return 'orange';
        if (status === 'Hot') return 'red';
        if (status === 'Fired') return '#B22222';
        return '#000';
    };

    const bestDriver = cpi?.components?.length
        ? [...cpi.components].sort((a, b) => (b.score - a.score))[0]
        : null;
    const worstDriver = cpi?.components?.length
        ? [...cpi.components].sort((a, b) => (a.score - b.score))[0]
        : null;
    
    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, maxWidth: '800px'}}>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>Season Recap</h2>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '15px', fontSize: '0.8rem' }}>
                    <p><strong>Record:</strong> {record}</p>
                    <p><strong>Result:</strong> {tournamentResult}</p>
                    <p><strong>Prestige:</strong> <span style={prestigeStyle}>{prestigeText}</span></p>
                    <p><strong>Coach Rep:</strong> {reputationValue} (<span style={reputationStyle}>{reputationText}</span>)</p>
                </div>
                {cpi && (
                    <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #000', backgroundColor: '#E0E0E0' }}>
                        <h4 style={{...styles.modalSubheading, color: '#000' }}>Coach Performance Index (CPI)</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px', fontSize: '0.75rem' }}>
                            <p><strong>CPI:</strong> {Math.round(cpi.compositeScore)}/100</p>
                            <p><strong>Status:</strong> <span style={{ color: cpiStatusColor(cpi.status), fontWeight: 'bold' }}>{cpi.status}</span></p>
                            <p><strong>Profile:</strong> {cpi.boardProfile}</p>
                        </div>
                        {(bestDriver || worstDriver) && (
                            <div style={{ textAlign: 'center', fontSize: '0.65rem', marginBottom: '8px', color: '#333' }}>
                                {bestDriver && <span><strong>Best:</strong> {bestDriver.label} ({Math.round(bestDriver.score)})</span>}
                                {bestDriver && worstDriver && <span> • </span>}
                                {worstDriver && <span><strong>Worst:</strong> {worstDriver.label} ({Math.round(worstDriver.score)})</span>}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px', fontSize: '0.6rem' }}>
                            {cpi.components.map(component => (
                                <div key={component.key} style={{ padding: '6px', border: '1px solid #808080', backgroundColor: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <strong style={{ fontSize: '0.6rem' }}>{component.label}</strong>
                                        <span style={{ color: '#555' }}>{Math.round(component.weight * 100)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#333' }}>{component.displayActual ?? (typeof component.actual === 'number' ? `${Math.round(component.actual)}` : 'N/A')}</span>
                                        <span style={{ color: '#666' }}>{component.displayExpected ?? (typeof component.expected === 'number' ? `${Math.round(component.expected)}` : '')}</span>
                                    </div>
                                    <div style={{ marginTop: '4px', color: component.score >= 60 ? 'green' : component.score >= 45 ? '#444' : 'red', fontWeight: 'bold' }}>
                                        Score: {Math.round(component.score)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {projectedRevenue > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem' }}>
                        <p><strong>Revenue:</strong> {formatCurrency(totalRevenue)} vs. Projected {formatCurrency(projectedRevenue)}</p>
                    </div>
                )}
                {renderList('NBA Draft Picks', drafted.map(d => ({ name: d.player.name, details: `Pick #${d.pick} - ${NBA_ACRONYM_TO_NAME[d.nbaTeam] || d.nbaTeam}` })))}
                {renderList('New Signings', signings.map(s => {
                    const stars = Math.max(0, Math.min(5, Math.round((s as any).stars ?? 0)));
                    return {
                        name: s.name,
                        details: (
                            <span>
                                <span style={{ color: '#d4af37' }}>{'★'.repeat(stars)}</span>
                                <span style={{ color: '#999' }}>{'☆'.repeat(5 - stars)}</span>
                                {' '}{s.position} ({s.overall} OVR)
                            </span>
                        )
                    };
                }))}
                <button onClick={onClose} style={{...styles.button, marginTop: '20px', width: '100%'}}>Continue</button>
            </div>
        </div>
    );
};

const migrateSaveState = (loadedState: any): GameState => {
    let state = { ...loadedState };
    const version = state.version || 1;

    if (version < 3) {
      state.allTeams.forEach((t: Team) => {
        t.fanInterest = t.prestige;
        t.prices = { ticketPrice: 15, jerseyPrice: 75, merchandisePrice: 25, concessionFoodPrice: 10, concessionDrinkPrice: 5, parkingPrice: 10 };
        t.finances = { baseRevenue: 0, gateRevenue: 0, merchandiseRevenue: 0, concessionsRevenue: 0, parkingRevenue: 0, donationRevenue: 0, endowmentSupport: 0, tournamentShare: 0, sponsorPayout: 0, totalRevenue: 0, operationalExpenses: 0, firedStaffSalaries: 0, facilitiesExpenses: 0, travelExpenses: 0, recruitingExpenses: 0, marketingExpenses: 0, administrativeExpenses: 0, staffPayrollExpenses: 0, loanPayments: 0, broadcastRevenue: 0, licensingRevenue: 0, nilExpenses: 0, netIncome: 0, cashOnHand: 0, ledger: [] };
      });
      if(state.userTeam) {
        state.userTeam.fanInterest = state.userTeam.prestige;
        state.userTeam.prices = { ticketPrice: 15, jerseyPrice: 75, merchandisePrice: 25, concessionFoodPrice: 10, concessionDrinkPrice: 5, parkingPrice: 10 };
        state.userTeam.finances = { baseRevenue: 0, gateRevenue: 0, merchandiseRevenue: 0, concessionsRevenue: 0, parkingRevenue: 0, donationRevenue: 0, endowmentSupport: 0, tournamentShare: 0, sponsorPayout: 0, totalRevenue: 0, operationalExpenses: 0, firedStaffSalaries: 0, facilitiesExpenses: 0, travelExpenses: 0, recruitingExpenses: 0, marketingExpenses: 0, administrativeExpenses: 0, staffPayrollExpenses: 0, broadcastRevenue: 0, licensingRevenue: 0, nilExpenses: 0, netIncome: 0, cashOnHand: 0, ledger: [] };
      }
      if(state.history?.userTeamRecords) {
        state.history.userTeamRecords.forEach((r: UserSeasonRecord) => {
            if(!r.totalRevenue) r.totalRevenue = 0;
            if(!r.gameAttendance) r.gameAttendance = [];
        });
      }
       if(state.history?.teamHistory) {
         Object.values(state.history.teamHistory).forEach((teamHistArr: any) => {
            teamHistArr.forEach((h: TeamHistory) => {
                 if(!h.totalRevenue) h.totalRevenue = 0;
            });
         });
      }
    }

    if (state.rotationPreference == null) {
        state.rotationPreference = 'balanced';
    }

    const ensureTeamFinancials = (team: Team) => {
        if (!team.finances) {
            team.finances = {
                baseRevenue: 0,
                gateRevenue: 0,
                merchandiseRevenue: 0,
                concessionsRevenue: 0,
                parkingRevenue: 0,
                donationRevenue: 0,
                broadcastRevenue: 0,
                licensingRevenue: 0,
                nilExpenses: 0,
                netIncome: 0,
                cashOnHand: 0,
                endowmentSupport: 0,
                tournamentShare: 0,
                ledger: [],

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
                loanPayments: 0,
            };
        } else {
            team.finances.baseRevenue = team.finances.baseRevenue || 0;
            team.finances.gateRevenue = team.finances.gateRevenue || 0;
            team.finances.merchandiseRevenue = team.finances.merchandiseRevenue || 0;
            team.finances.concessionsRevenue = team.finances.concessionsRevenue || 0;
            team.finances.parkingRevenue = team.finances.parkingRevenue || 0;
            team.finances.donationRevenue = team.finances.donationRevenue || 0;
            team.finances.endowmentSupport = team.finances.endowmentSupport || 0;
            team.finances.tournamentShare = team.finances.tournamentShare || 0;
            team.finances.sponsorPayout = team.finances.sponsorPayout || 0;
            team.finances.totalRevenue = team.finances.totalRevenue || 0;
            team.finances.operationalExpenses = team.finances.operationalExpenses || 0;
            team.finances.firedStaffSalaries = team.finances.firedStaffSalaries || 0;
            team.finances.facilitiesExpenses = team.finances.facilitiesExpenses || 0;
            team.finances.travelExpenses = team.finances.travelExpenses || 0;
            team.finances.recruitingExpenses = team.finances.recruitingExpenses || 0;
            team.finances.marketingExpenses = team.finances.marketingExpenses || 0;
            team.finances.administrativeExpenses = team.finances.administrativeExpenses || 0;
            team.finances.staffPayrollExpenses = team.finances.staffPayrollExpenses || 0;
        }
        if (!team.wealth) {
            const fanInterest = typeof team.fanInterest === 'number' ? team.fanInterest : (team.prestige || 50);
            const prestige = typeof team.prestige === 'number' ? team.prestige : 50;
            team.wealth = seedProgramWealth(team.name, prestige, team.conference || 'Independent', fanInterest);
        }
    };

    if (state.allTeams) {
        state.allTeams.forEach((t: Team) => ensureTeamFinancials(t));
    }
    if (state.userTeam) {
        ensureTeamFinancials(state.userTeam);
    }

    // If an older save seeded full-season projections into `finances`, clear them at season start so the ledger/YTD start at 0.
    const shouldResetSeasonFinances = (team: Team) => {
        const ledgerEmpty = !team.finances?.ledger || team.finances.ledger.length === 0;
        const looksSeeded = (team.finances?.totalRevenue || 0) > 0 || (team.finances?.operationalExpenses || 0) > 0;
        const atSeasonStart = (state.gameInSeason || 1) === 1;
        if (!ledgerEmpty || !looksSeeded || !atSeasonStart) return;
        const firedStaffSalaries = team.finances?.firedStaffSalaries || 0;
        team.finances = {
            ...team.finances,
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
            facilitiesExpenses: 0,
            travelExpenses: 0,
            recruitingExpenses: 0,
            marketingExpenses: 0,
            administrativeExpenses: 0,
            staffPayrollExpenses: 0,
            loanPayments: 0,
            nilExpenses: 0,
            firedStaffSalaries,
            netIncome: 0,
            cashOnHand: team.budget?.cash || 0,
            ledger: [],
        };
    };
    if (state.allTeams) state.allTeams.forEach((t: Team) => shouldResetSeasonFinances(t));
    if (state.userTeam) shouldResetSeasonFinances(state.userTeam);
    
    const loadedHistory = state.history || {};
    const migratedState: GameState = {
        ...initialState,
        ...state,
        history: {
            userTeamRecords: loadedHistory.userTeamRecords || [],
            champions: loadedHistory.champions || [],
            teamHistory: loadedHistory.teamHistory || {},
            nbaDrafts: loadedHistory.nbaDrafts || [],
        },
        version: CURRENT_SAVE_VERSION,
        currentUserTeamAttendance: state.currentUserTeamAttendance || [],
        internationalProspects: state.internationalProspects || [],
        currentNBASimulation: state.currentNBASimulation || null,
        lastSimWeekKey: state.lastSimWeekKey ?? null,
    };

    migratedState.allTeams = migratedState.allTeams.map(normalizeTeamData);
    if (migratedState.userTeam) {
        migratedState.userTeam = normalizeTeamData(migratedState.userTeam);
    }
    migratedState.freeAgentStaff = migratedState.freeAgentStaff
        ? {
            assistants: migratedState.freeAgentStaff.assistants.map(normalizeStaffContract),
            trainers: migratedState.freeAgentStaff.trainers.map(normalizeStaffContract),
            scouts: migratedState.freeAgentStaff.scouts.map(normalizeStaffContract),
        }
        : generateFreeAgentStaff();
    migratedState.mockDraftProjections = migratedState.mockDraftProjections || {};
    migratedState.mockDraftProjectionDiffs = migratedState.mockDraftProjectionDiffs || {};
    migratedState.mockDraftBoard = migratedState.mockDraftBoard || [];
    migratedState.customDraftPickRules = migratedState.customDraftPickRules || [];
    migratedState.pendingStaffRenewals = (state.pendingStaffRenewals && state.pendingStaffRenewals.length > 0)
        ? state.pendingStaffRenewals
        : collectExpiredStaffRenewals(migratedState.userTeam);
    if (migratedState.coach) {
        migratedState.coach.playerAlumni = migratedState.coach.playerAlumni || {};
    }
    migratedState.nilNegotiationCandidates = state.nilNegotiationCandidates || [];
    migratedState.nilNegotiationHistory = state.nilNegotiationHistory || [];
    migratedState.nilPhaseComplete = state.nilPhaseComplete ?? false;

    // Fix: Enforce minimum Net Income goals (7M+) for all teams
    const enforceMinNetIncome = (team: Team) => {
        if (team.boardExpectations) {
            const prestige = team.prestige;
            let target = 7000000;
            if (prestige >= 90) target = 45000000;
            else if (prestige >= 80) target = 30000000;
            else if (prestige >= 70) target = 20000000;
            else if (prestige >= 60) target = 15000000;
            else if (prestige >= 50) target = 10000000;

            if (team.boardExpectations.targetNetIncome < target) {
                team.boardExpectations.targetNetIncome = target;
            }
        }
    };

    if (migratedState.allTeams) {
        migratedState.allTeams.forEach(enforceMinNetIncome);
    }
    if (migratedState.userTeam) {
        enforceMinNetIncome(migratedState.userTeam);
    }

    return migratedState;
};

const CoachModal = ({ state, dispatch, onClose }: { state: GameState, dispatch: React.Dispatch<GameAction>, onClose: () => void }) => {
    if (!state.coach?.contract || !state.userTeam) return null;
    const { expectations, yearsRemaining } = state.coach.contract;
    const { coach } = state;
    const [pendingName, setPendingName] = useState(coach.name);
    const [activeTab, setActiveTab] = useState<'status' | 'skills'>('status');

    const earnedRevenue = calculateCurrentSeasonEarnedRevenue(state.userTeam, state.gameInSeason, state.currentUserTeamAttendance, state.tournament);
    const currentSeasonNetIncome = earnedRevenue.totalRevenue - earnedRevenue.operationalExpenses;

    
    const isTournamentTime = state.gameInSeason > 31 && state.tournament;
    const tournamentStatus = () => {
        if (!isTournamentTime) return "Not Started";
        const allMatchups = [...state.tournament!.firstFour, ...Object.values(state.tournament!.regions).flatMap(r => r.flat())];
        const inTournament = allMatchups.some(m => m.homeTeam === state.userTeam?.name || m.awayTeam === state.userTeam?.name);
        return inTournament ? "Qualified" : "Did Not Qualify";
    }

    const renderSkills = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.8rem', backgroundColor: '#eee', padding: '10px', borderRadius: '5px' }}>
                <span><strong>Level:</strong> {coach.level}</span>
                <span><strong>XP:</strong> {coach.xp}</span>
                <span><strong>Skill Points:</strong> {coach.skillPoints}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {constants.COACH_SKILL_TREE.map(skill => {
                    const currentLevel = coach.skills[skill.id] || 0;
                    const isMaxed = currentLevel >= skill.maxLevel;
                    const canAfford = coach.skillPoints >= skill.cost;
                    
                    return (
                        <div key={skill.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.7rem', marginBottom: '4px' }}>{skill.name} ({currentLevel}/{skill.maxLevel})</div>
                            <div style={{ fontSize: '0.6rem', margin: '5px 0', height: '30px' }}>{skill.description}</div>
                            <div style={{ fontSize: '0.6rem', marginBottom: '5px' }}>Cost: {skill.cost} SP</div>
                            <button 
                                disabled={isMaxed || !canAfford}
                                onClick={() => dispatch({ type: 'PURCHASE_SKILL', payload: { skillId: skill.id } })}
                                style={{ ...styles.smallButton, marginTop: '5px', width: '100%', opacity: (isMaxed || !canAfford) ? 0.5 : 1, backgroundColor: isMaxed ? '#ccc' : '#4CAF50', color: 'white', border: 'none' }}
                            >
                                {isMaxed ? 'Maxed' : 'Upgrade'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{...styles.modalContent, maxWidth: '600px'}} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{...styles.title, fontSize: '1.2rem', textShadow: '2px 2px 0px #808080', color: 'black'}}>Coach Profile</h3>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                    <button onClick={() => setActiveTab('status')} style={{ ...styles.smallButton, backgroundColor: activeTab === 'status' ? '#333' : '#fff', color: activeTab === 'status' ? '#fff' : '#000' }}>Status</button>
                    <button onClick={() => setActiveTab('skills')} style={{ ...styles.smallButton, backgroundColor: activeTab === 'skills' ? '#333' : '#fff', color: activeTab === 'skills' ? '#fff' : '#000' }}>Skill Tree</button>
                </div>

                {activeTab === 'status' ? (
                    <div>
                        <div style={{fontSize: '0.8rem', marginBottom: '15px', display: 'flex', justifyContent: 'space-between'}}>
                            <span><strong>Reputation:</strong> {coach.reputation}</span>
                            <span><strong>Career Earnings:</strong> {formatCurrency(coach.careerEarnings)}</span>
                        </div>
                        <Subheading color={'#333'}>Current Contract ({yearsRemaining} Yrs Left)</Subheading>
                        <p style={{fontSize: '0.7rem', marginBottom: '10px'}}><strong>Salary:</strong> {formatCurrency(state.coach.contract.salary)} / year</p>
                        
                         <Subheading color={'#333'}>Board Expectations</Subheading>
                        <div style={{fontSize: '0.8rem', marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                            <div>
                                <strong>Profile:</strong> {expectations.boardProfile}
                            </div>
                            <div>
                                <strong>Pressure:</strong> {Math.round(expectations.pressure)}%
                            </div>
                            <div>
                                <strong>Wins:</strong> {expectations.evaluationMode === 'contract' ? `${coach.contract.progress.wins} / ${expectations.targetWins}` : expectations.targetWins}
                            </div>
                            <div>
                                <strong>Postseason:</strong> {expectations.targetPostseasonCount
                                    ? `${expectations.targetTourneyRound.replace('Round of ', 'R')} x${expectations.targetPostseasonCount}`
                                    : expectations.targetTourneyRound}
                            </div>
                            <div>
                                <strong>Net Income:</strong> {formatCurrency(expectations.targetNetIncome)}
                            </div>
                            <div>
                                <strong>Draft Picks:</strong> {expectations.targetDraftPicks} / yr
                            </div>
                            <div>
                                <strong>Attendance:</strong> {Math.round(expectations.targetAttendanceFillRate * 100)}% fill
                            </div>
                            <div>
                                <strong>Weights:</strong> W {Math.round(expectations.weights.wins * 100)} / P {Math.round(expectations.weights.postseason * 100)} / Pipe {Math.round(expectations.weights.pipeline * 100)} / Brand {Math.round(expectations.weights.brand * 100)} / $ {Math.round(expectations.weights.finances * 100)}
                            </div>
                        </div>
                        <p style={{fontSize: '0.7rem', marginTop: '10px', fontStyle: 'italic'}}>
                            Job security is computed as a composite score (0–100) based on performance vs these expectations.
                        </p>
                        <Subheading color={'#333'}>Personalize</Subheading>
                        <div style={styles.renameRow}>
                            <input
                                value={pendingName}
                                onChange={e => setPendingName(e.target.value)}
                                style={styles.renameInput}
                                placeholder="Enter new coach name"
                            />
                            <button style={{ ...styles.button, flex: '0 0 auto' }} onClick={() => dispatch({ type: 'RENAME_USER_COACH', payload: { name: pendingName } })}>
                                Rename
                            </button>
                        </div>
                    </div>
                ) : renderSkills()}
            </div>
        </div>
    );
};







const NBAContractNegotiationModal = ({ teamName, coach, dispatch }: { teamName: string, coach: Coach, dispatch: React.Dispatch<GameAction> }) => {
    const { length, options, salary } = useMemo(() => {
        const length = randomBetween(3, 5);
        const salary = calculateNBACoachSalary(teamName, coach);
        // Build simple wins-based goals for NBA
        const goals: ContractGoal[] = [];
        const perSeasonTargets = [38, 44, 50].map(t => ({ t, desc: `Win ${t} games per season on average.` }));
        perSeasonTargets.forEach(({ t, desc }) => {
            goals.push({ type: 'wins', target: t * length, duration: length, description: `${desc} (${t * length} total over ${length} years).` });
        });
        return { length, options: goals, salary };
    }, [teamName, coach]);
    const totalValue = length * salary;
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>
                    NBA Head Coach Offer
                </h2>
                <p style={{textAlign: 'center', marginBottom: '10px', fontSize: '0.8rem'}}>General Manager of {teamName}</p>
                <p style={{textAlign: 'center', marginBottom: '5px', fontSize: '0.8rem'}}>Offering a {length}-year deal at {formatCurrency(salary)} per year.</p>
                <p style={{textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>Total Value: {formatCurrency(totalValue)}</p>
                <p style={{textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem'}}>Choose one of the following goals:</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {options.map((goal, i) => (
                        <button key={i} style={{...styles.button, padding: '15px'}} onClick={() => dispatch({type: 'SELECT_NBA_CONTRACT_GOAL', payload: { goal, salary }})}>
                           {goal.description}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GameOverModal = ({ reason, dispatch }: { reason: string, dispatch: React.Dispatch<GameAction> }) => (
    <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
            <h2 style={{ ...styles.title, fontSize: '2rem', textShadow: '3px 3px #808080', color: '#B22222' }}>
                Career Over
            </h2>
            <p style={{textAlign: 'center', marginBottom: '20px', fontSize: '0.8rem'}}>
                {reason}
            </p>
            <button style={{...styles.button, width: '100%'}} onClick={() => dispatch({type: 'START_NEW_GAME'})}>
                Start New Career
            </button>
        </div>
    </div>
);

const NBADashboard = ({ state, dispatch }: { state: GameState, dispatch: React.Dispatch<GameAction> }) => {
    const team = state.nbaCoachTeam || 'NBA Team';
    const record = state.nbaRecord || { wins: 0, losses: 0 };
    return (
        <div>
            <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>
                NBA Coaching: {team}
            </h2>
            <p style={{ fontSize: '0.8rem', marginBottom: '10px' }}>Season: {state.nbaSeason}</p>
            <p style={{ fontSize: '0.8rem', marginBottom: '20px' }}>Record: {record.wins}-{record.losses}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button style={styles.button} onClick={() => dispatch({ type: 'SIMULATE_NBA_SEASON' })}>
                    Simulate NBA Season
                </button>
                <button style={styles.button} onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.DASHBOARD })}>
                    Return to College
                </button>
            </div>
        </div>
    );
};

const CoachPerformanceReviewModal = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    if (!state.contractReviewData || !state.coach?.contract) return null;

    const { goalMet, wins, tournamentAppearances, revenue, adDecision } = state.contractReviewData;
    const { expectations, teamName } = state.coach.contract;

    const adMessage = adDecision === 'renew' 
        ? `We are pleased with your performance. We'd like to offer you an extension, and you are also free to explore other opportunities.`
        : `Performance did not meet board standards. We have decided to part ways. We wish you the best in your future endeavors.`;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>Coach Performance Review</h2>
                <p style={{textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem'}}>A message from the {teamName} Athletic Department</p>
                
                <Subheading color={'#333'}>Board CPI Review</Subheading>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '10px' }}>
                    <div>
                        <strong>Composite:</strong> {expectations.metrics ? Math.round(expectations.metrics.compositeScore) : 'N/A'}/100
                    </div>
                    <div>
                        <strong>Profile:</strong> {expectations.boardProfile}
                    </div>
                </div>

                {expectations.metrics?.components?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', fontSize: '0.65rem', marginBottom: '10px' }}>
                        {expectations.metrics.components.map(component => {
                            const isFinances = component.key === 'finances';
                            const actualText = component.displayActual ?? (typeof component.actual === 'number' ? (isFinances ? formatCurrency(component.actual) : `${Math.round(component.actual)}`) : 'N/A');
                            const expectedText = component.displayExpected ?? (typeof component.expected === 'number' ? (isFinances ? formatCurrency(component.expected) : `${Math.round(component.expected)}`) : 'N/A');
                            return (
                                <div key={component.key} style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f7f7f7' }}>
                                    <strong>{component.label}</strong><br/>
                                    {actualText} / {expectedText}<br/>
                                    <span style={{ color: '#666' }}>
                                        Score {Math.round(component.score)} • Weight {Math.round(component.weight * 100)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.7rem', marginBottom: '10px' }}>
                        <div style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <strong>Wins</strong><br/>
                            {wins} / {expectations.targetWins}
                        </div>
                        <div style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <strong>Postseason</strong><br/>
                            {tournamentAppearances} / {expectations.targetTourneyRound}
                        </div>
                        <div style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <strong>Net Income</strong><br/>
                            {formatCurrency(revenue)} / {formatCurrency(expectations.targetNetIncome)}
                        </div>
                    </div>
                )}
                <p style={{fontSize: '0.8rem', fontWeight: 'bold', color: goalMet ? 'green' : 'red', marginTop: '5px'}}>Result: {goalMet ? 'SATISFACTORY' : 'UNSATISFACTORY'}</p>

                <Subheading color={'#333'}>Athletic Director's Decision</Subheading>
                <p style={{fontSize: '0.7rem', fontStyle: 'italic', margin: '10px 0'}}>"{adMessage}"</p>

                <button style={{...styles.button, width: '100%', marginTop: '20px'}} onClick={() => dispatch({ type: 'PROCEED_TO_JOB_MARKET' })}>
                    Proceed to Job Market
                </button>
            </div>
        </div>
    );
};


const JobMarketModal = ({ offers, nbaOffers, dispatch, powerRanks, onStay }: { offers: JobOffer[], nbaOffers: string[], dispatch: React.Dispatch<GameAction>, powerRanks: Map<string, number>, onStay: () => void }) => (
    <div style={styles.modalOverlay}>
        <div style={{...styles.modalContent, maxWidth: '650px', maxHeight: '780px', padding: '30px 30px 20px'}}>
            <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>
                The Job Market
            </h2>
            <p style={{textAlign: 'center', marginBottom: '20px', fontSize: '0.8rem'}}>
                Your performance has attracted attention. Review these offers or choose to stay with your current program.
            </p>
             <div style={{ maxHeight: '520px', overflowY: 'auto', marginTop: '10px' }}>
                {[...offers].sort((a, b) => a.teamName.localeCompare(b.teamName)).map(offer => (
                    <div key={offer.teamName} style={styles.jobOfferCard}>
                        <div>
                            <h3 style={{fontSize: '1rem', color: SCHOOL_COLORS[offer.teamName]?.primary || '#000'}}>{offer.teamName}</h3>
                            <p style={{fontSize: '0.6rem', fontStyle: 'italic'}}>Athletic Director of {offer.teamName}</p>
                            <p style={{fontSize: '0.6rem'}}>Prestige: {offer.prestige} | Last Season Rank: #{powerRanks.get(offer.teamName) || 'N/A'}</p>
                            <p style={{fontSize: '0.6rem'}}>Contract: {offer.length} yrs @ {formatCurrency(offer.salary)} / yr</p>
                        </div>
                        <button style={styles.smallButton} onClick={() => dispatch({ type: 'SELECT_JOB_OFFER', payload: offer })}>
                            Accept
                        </button>
                    </div>
                ))}
                {nbaOffers.length > 0 && (
                    <>
                        <h3 style={{ fontSize: '0.9rem', marginTop: '10px' }}>NBA Teams</h3>
                        {nbaOffers.map(name => (
                            <div key={name} style={styles.jobOfferCard}>
                                <div>
                                    <h3 style={{fontSize: '1rem'}}>{name}</h3>
                                    <p style={{fontSize: '0.6rem', fontStyle: 'italic'}}>General Manager of {name}</p>
                                    <p style={{fontSize: '0.6rem'}}>League: NBA</p>
                                </div>
                                <button style={styles.smallButton} onClick={() => dispatch({ type: 'SELECT_NBA_JOB_OFFER', payload: name })}>
                                    Accept
                                </button>
                            </div>
                        ))}
                    </>
                )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <button style={{ ...styles.button, backgroundColor: '#f0f0f0' }} onClick={onStay}>
                    Reject All & Stay
                </button>
            </div>
        </div>
    </div>
);

const StaffFreeAgencyModal = ({ freeAgents, userTeam, dispatch, onClose }: { freeAgents: GameState['freeAgentStaff'], userTeam: Team, dispatch: React.Dispatch<GameAction>, onClose: () => void }) => {
    if (!freeAgents) return null;

    const handleHire = (staff: Staff, role: 'assistants' | 'trainers' | 'scouts') => {
        dispatch({ type: 'HIRE_FREE_AGENT_STAFF', payload: { staff, role } });
        onClose();
    };

    const renderFreeAgentGroup = (title: string, staffList: Staff[], role: 'assistants' | 'trainers' | 'scouts') => {
        const canHire = userTeam.staff[role].length < 3;
        return (
            <div style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#333', borderBottom: '2px solid #333', paddingBottom: '5px', marginBottom: '10px' }}>{title}</h3>
                {staffList.map(staff => (
                    <div key={staff.id} style={styles.staffCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '0.7rem' }}>{staff.name}</h4>
                            <span style={styles.staffGrade}>Grade: {staff.grade}</span>
                        </div>
                        <p style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#555', margin: '2px 0' }}>{staff.specialty}</p>
                        <p style={{ fontSize: '0.6rem', fontStyle: 'italic', margin: '5px 0' }}>{staff.description}</p>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
                            <p style={{fontSize: '0.6rem', textAlign: 'right'}}>Salary: {formatCurrency(staff.salary)}</p>
                            {canHire && <button onClick={() => handleHire(staff, role)} style={styles.smallButton}>Hire</button>}
                        </div>
                    </div>
                ))}
                 {!staffList.length && <p style={{fontSize: '0.7rem'}}>No free agents available.</p>}
            </div>
        );
    }

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>
                    Staff Free Agents
                </h2>
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                    {renderFreeAgentGroup('Assistant Coaches', freeAgents.assistants, 'assistants')}
                    {renderFreeAgentGroup('Trainers', freeAgents.trainers, 'trainers')}
                    {renderFreeAgentGroup('Scouts', freeAgents.scouts, 'scouts')}
                </div>
            </div>
        </div>
    );
};

const StaffRenewalModal = ({ renewal, colors, onRenew, onDecline }: { renewal: PendingStaffRenewal, colors: TeamColors, onRenew: (newSalary: number, years: number) => void, onDecline: () => void }) => {
    const raiseMultiplier = 1.12;
    const suggestedSalary = Math.max(50000, Math.round((renewal.currentSalary * raiseMultiplier) / 5000) * 5000);
    const roleLabel = staffRoleLabels[renewal.role];
    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ ...styles.title, fontSize: '1.2rem', color: colors.primary, textShadow: 'none', marginBottom: '10px' }}>Staff Contract Decision</h3>
                <p style={{ fontSize: '0.8rem', marginBottom: '10px' }}>
                    {renewal.name} ({roleLabel}) has reached the end of their {renewal.grade}-grade contract.
                </p>
                <div style={{ fontSize: '0.75rem', marginBottom: '15px', lineHeight: 1.5 }}>
                    <p><strong>Current Salary:</strong> {formatCurrency(renewal.currentSalary)}</p>
                    <p><strong>New Ask (+12% loyalty bump):</strong> {formatCurrency(suggestedSalary)} for {renewal.yearsOffered} yrs</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button style={{ ...styles.button }} onClick={() => onRenew(suggestedSalary, renewal.yearsOffered)}>
                        Re-sign {renewal.name}
                    </button>
                    <button style={{ ...styles.button, backgroundColor: '#B22222', borderColor: '#B22222' }} onClick={onDecline}>
                        Let {renewal.name} Walk
                    </button>
                </div>
            </div>
        </div>
    );
};

const StaffRecruitmentModal = ({ dispatch }: { dispatch: React.Dispatch<GameAction> }) => {
    const [candidates, setCandidates] = useState(generateStaffCandidates());
    const [selectedAssistants, setSelectedAssistants] = useState<Staff[]>([]);
    const [selectedTrainers, setSelectedTrainers] = useState<Staff[]>([]);
    const [selectedScouts, setSelectedScouts] = useState<Staff[]>([]);

    const totalSelected = selectedAssistants.length + selectedTrainers.length + selectedScouts.length;

    const handleHire = () => {
        dispatch({ type: 'HIRE_STAFF', payload: { assistants: selectedAssistants, trainers: selectedTrainers, scouts: selectedScouts } });
    };

    const handleRefreshCandidates = () => {
        const newCandidates = generateStaffCandidates();
        // Keep selected candidates in the list
        newCandidates.assistants = [...selectedAssistants, ...newCandidates.assistants.filter(c => !selectedAssistants.find(s => s.id === c.id))];
        newCandidates.trainers = [...selectedTrainers, ...newCandidates.trainers.filter(c => !selectedTrainers.find(s => s.id === c.id))];
        newCandidates.scouts = [...selectedScouts, ...newCandidates.scouts.filter(c => !selectedScouts.find(s => s.id === c.id))];
        setCandidates(newCandidates);
    };

    const handleRandomStaff = () => {
        const randomAssistants = candidates.assistants.slice(0, 3);
        const randomTrainers = candidates.trainers.slice(0, 3);
        const randomScouts = candidates.scouts.slice(0, 3);
        
        dispatch({ type: 'HIRE_STAFF', payload: { assistants: randomAssistants, trainers: randomTrainers, scouts: randomScouts } });
    };

    const handleSelect = (staff: Staff, role: StaffRole) => {
        const isCurrentlySelected = (
            (role === 'Assistant Coach' && selectedAssistants.some(s => s.id === staff.id)) ||
            (role === 'Trainer' && selectedTrainers.some(s => s.id === staff.id)) ||
            (role === 'Scout' && selectedScouts.some(s => s.id === staff.id))
        );

        if (isCurrentlySelected) {
            if (role === 'Assistant Coach') setSelectedAssistants(prev => prev.filter(s => s.id !== staff.id));
            if (role === 'Trainer') setSelectedTrainers(prev => prev.filter(s => s.id !== staff.id));
            if (role === 'Scout') setSelectedScouts(prev => prev.filter(s => s.id !== staff.id));
        } else {
            if (role === 'Assistant Coach' && selectedAssistants.length < 3) setSelectedAssistants(prev => [...prev, staff]);
            if (role === 'Trainer' && selectedTrainers.length < 3) setSelectedTrainers(prev => [...prev, staff]);
            if (role === 'Scout' && selectedScouts.length < 3) setSelectedScouts(prev => [...prev, staff]);
        }
    };

    const renderCandidateGroup = (title: string, staffList: Staff[], selected: Staff[], role: StaffRole) => (
        <div style={{ marginBottom: '15px' }}>
            <h3 style={{ color: '#333', borderBottom: '2px solid #333', paddingBottom: '5px', marginBottom: '10px' }}>{title} ({selected.length}/3)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {staffList.map(staff => (
                    <div key={staff.id} style={{ ...styles.staffCard, cursor: 'pointer', outline: selected.some(s => s.id === staff.id) ? '3px solid #005BBB' : 'none' }} onClick={() => handleSelect(staff, role)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '0.7rem' }}>{staff.name}</h4>
                            <span style={styles.staffGrade}>Grade: {staff.grade}</span>
                        </div>
                        <p style={{ fontSize: '0.6rem', fontStyle: 'italic', margin: '5px 0' }}>{staff.description}</p>
                        <p style={{ fontSize: '0.6rem', textAlign: 'right' }}>Salary: {formatCurrency(staff.salary)}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>
                    Assemble Your Staff
                </h2>
                <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.8rem', color: '#000000' }}>
                    Your first order of business is to hire your coaching staff. You can hire up to 3 members for each role.
                </p>
                <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '10px'}}>Total Selected: {totalSelected} / 9</p>
                <div style={{ maxHeight: '40vh', overflowY: 'auto', paddingRight: '10px' }}>
                    {renderCandidateGroup('Assistant Coach', candidates.assistants, selectedAssistants, 'Assistant Coach')}
                    {renderCandidateGroup('Trainer', candidates.trainers, selectedTrainers, 'Trainer')}
                    {renderCandidateGroup('Scout', candidates.scouts, selectedScouts, 'Scout')}
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '20px'}}>
                    <button style={{ ...styles.button }} onClick={handleRefreshCandidates}>
                        Refresh Candidates
                    </button>
                    <button style={{ ...styles.button }} onClick={handleRandomStaff}>
                        Random Staff
                    </button>
                </div>
                <button style={{ ...styles.button, width: '100%', marginTop: '20px' }} onClick={handleHire} disabled={totalSelected === 0}>
                    Finalize Staff
                </button>
            </div>
        </div>
    );
};





const PlayerStats = ({ state, colors }: { state: GameState, colors: TeamColors }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'points', direction: 'descending' });

    const allPlayers = useMemo(() => {
        return state.allTeams.flatMap(team => team.roster.map(player => ({ ...player, teamName: team.name })));
    }, [state.allTeams]);

    const powerRankings = useMemo(() => {
        const ranks = new Map<string, number>();
        [...state.allTeams]
            .sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10))
            .forEach((team, index) => {
                ranks.set(team.name, index + 1);
            });
        return ranks;
    }, [state.allTeams]);

    const draftProspects = useMemo(
        () => buildDraftProspectBoard(state.allTeams, state.internationalProspects || [], 60),
        [state.allTeams, state.internationalProspects]
    );

    const sortedPlayers = useMemo(() => {
        const getSortableValue = (player: (typeof allPlayers)[number], key: string) => {
            if (key === 'overall' || key === 'height') {
                return player[key as keyof Player];
            }
            if (key === 'mpg') {
                const games = player.seasonStats.gamesPlayed || 0;
                return games > 0 ? (player.seasonStats.minutes ?? 0) / games : 0;
            }
            const statValue = player.seasonStats[key as keyof Player['seasonStats']] || 0;
            return player.seasonStats.gamesPlayed > 0
                ? statValue / player.seasonStats.gamesPlayed
                : 0;
        };

        let sortablePlayers = [...allPlayers];
        sortablePlayers.sort((a, b) => {
            const aValue = getSortableValue(a, sortConfig.key);
            const bValue = getSortableValue(b, sortConfig.key);

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortablePlayers;
    }, [allPlayers, sortConfig]);

    const userTeamName = state.userTeam?.name;

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const renderSortArrow = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    return (
        <div>
            <Subheading color={colors.primary}>Player Stats</Subheading>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Team</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pos</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }} onClick={() => requestSort('height')}>Ht {renderSortArrow('height')}</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Year</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }} onClick={() => requestSort('overall')}>OVR {renderSortArrow('overall')}</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }} onClick={() => requestSort('points')}>PPG {renderSortArrow('points')}</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }} onClick={() => requestSort('rebounds')}>RPG {renderSortArrow('rebounds')}</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }} onClick={() => requestSort('assists')}>APG {renderSortArrow('assists')}</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }} onClick={() => requestSort('mpg')}>MPG {renderSortArrow('mpg')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map(player => {
                            const isUserPlayer = player.teamName === userTeamName;
                            const draftRankIndex = draftProspects.findIndex(dp => dp.player.id === player.id);
                            const draftRank = draftRankIndex !== -1 ? draftRankIndex + 1 : null;
                            const teamRank = powerRankings.get(player.teamName);
                            const rowStyle: React.CSSProperties = isUserPlayer
                                ? {
                                    backgroundColor: '#FFF5C2',
                                    fontWeight: 'bold',
                                    border: `2px solid ${colors.primary}`,
                                  }
                                : {};
                            return (
                                <tr key={player.id} style={rowStyle}>
                                    <td style={styles.td}>{player.name} {draftRank ? `(#${draftRank})` : ''}</td>
                                    <td style={styles.td}>{player.teamName} {teamRank ? `(#${teamRank})` : ''}</td>
                                    <td style={styles.td}>{player.position}</td>
                                    <td style={styles.td}>{formatPlayerHeight(player.height)}</td>
                                    <td style={styles.td}>{player.year}</td>
                                    <td style={styles.td}>{player.overall}</td>
                                    <td style={styles.td}>{(player.seasonStats.points / (player.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                    <td style={styles.td}>{(player.seasonStats.rebounds / (player.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                    <td style={styles.td}>{(player.seasonStats.assists / (player.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                    <td style={styles.td}>{((player.seasonStats.minutes ?? 0) / (player.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MockDraftView = ({ state, colors, dispatch }: { state: GameState, colors: TeamColors, dispatch: React.Dispatch<GameAction> }) => {
    const simulation = state.currentNBASimulation;
    const [positionFilter, setPositionFilter] = useState<'ALL' | Player['position']>('ALL');
    const [roundFilter, setRoundFilter] = useState<'all' | 'first' | 'second'>('all');
    const [userOnly, setUserOnly] = useState(false);
    const [sortMode, setSortMode] = useState<'pick' | 'score' | 'trend'>('pick');
    const [localTrendDiffs, setLocalTrendDiffs] = useState<Record<string, number>>({});
    const previousPickMapRef = useRef<Map<string, number>>(new Map());
    const resetFilters = () => {
        setPositionFilter('ALL');
        setRoundFilter('all');
        setUserOnly(false);
        setSortMode('pick');
    };
    const boardSeed = simulation?.season ?? state.season;
    const generatedProspects = useMemo(
        () => buildDraftProspectBoard(state.allTeams, state.internationalProspects || [], 60, boardSeed),
        [boardSeed, state.allTeams, state.internationalProspects]
    );
    const storedBoard = state.mockDraftBoard || [];
    const boardMatches = useMemo(() => {
        if (!storedBoard.length || storedBoard.length !== generatedProspects.length) return false;
        return storedBoard.every((entry, index) => entry.player.id === generatedProspects[index].player.id);
    }, [storedBoard, generatedProspects]);
    useEffect(() => {
        if (!boardMatches) {
            dispatch({ type: 'SET_MOCK_DRAFT_BOARD', payload: { board: generatedProspects } });
        }
    }, [boardMatches, generatedProspects, dispatch]);
    const prospects = boardMatches ? storedBoard : generatedProspects;
    const baseDraftOrder = useMemo(() => {
        if (state.nbaTeams && state.nbaTeams.length > 0) {
            return [...state.nbaTeams]
                .sort((a, b) => {
                    const aWins = a.record?.wins ?? 0;
                    const bWins = b.record?.wins ?? 0;
                    if (aWins !== bWins) return aWins - bWins;
                    const aLosses = a.record?.losses ?? 0;
                    const bLosses = b.record?.losses ?? 0;
                    if (aLosses !== bLosses) return bLosses - aLosses;
                    return a.name.localeCompare(b.name);
                })
                .map(team => team.name);
        }
        const storedOrder = Object.entries(state.mockDraftProjections || {})
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([, teamName]) => teamName);
        if (storedOrder.length > 0) return storedOrder;
        if (simulation) return [...simulation.draftOrder];
        return [];
    }, [simulation, state.mockDraftProjections, state.nbaTeams]);
    const draftOrder = useMemo(() => {
        if (baseDraftOrder.length === 0) return [];
        const targetLength = Math.max(prospects.length, baseDraftOrder.length);
        const expanded: string[] = [];
        for (let i = 0; i < targetLength; i++) {
            expanded.push(baseDraftOrder[i % baseDraftOrder.length]);
        }
        return expanded;
    }, [baseDraftOrder, prospects.length]);
    const trendDiffs = state.mockDraftProjectionDiffs || {};
    const hasServerDiffs = Object.keys(trendDiffs).length > 0;
    useEffect(() => {
        if (prospects.length === 0) return;
        const incomingOrder = new Map<string, number>();
        const calculatedDiffs: Record<string, number> = {};
        const previousOrder = previousPickMapRef.current;
        prospects.forEach((prospect, index) => {
            const previousPick = previousOrder.get(prospect.player.id);
            const currentPick = index + 1;
            calculatedDiffs[prospect.player.id] =
                typeof previousPick === 'number' ? previousPick - currentPick : 0;
            incomingOrder.set(prospect.player.id, currentPick);
        });
        previousPickMapRef.current = incomingOrder;
        setLocalTrendDiffs(calculatedDiffs);
    }, [prospects]);
    const effectiveTrendDiffs = hasServerDiffs ? trendDiffs : localTrendDiffs;

    const categoryTotals = useMemo(() => {
        return prospects.reduce<Record<string, number>>((acc, prospect) => {
            acc[prospect.category] = (acc[prospect.category] || 0) + 1;
            return acc;
        }, {});
    }, [prospects]);
    const nbaRecordMap = useMemo(() => {
        const map = new Map<string, { wins: number; losses: number }>();
        (state.nbaTeams || []).forEach(team => {
            map.set(team.name, { wins: team.record?.wins ?? 0, losses: team.record?.losses ?? 0 });
        });
        simulation?.teams.forEach(team => {
            if (!map.has(team.name)) {
                map.set(team.name, { wins: team.wins, losses: team.losses });
            }
        });
        return map;
    }, [simulation, state.nbaTeams]);
    const upcomingDraftYear = useMemo(() => {
        if (state.currentNBASimulation && typeof state.currentNBASimulation.season === 'number') {
            return seasonToCalendarYear(state.currentNBASimulation.season);
        }
        return seasonToCalendarYear(state.season);
    }, [state.currentNBASimulation, state.season]);
    const pickOwnerHeaderLabel = upcomingDraftYear > 2000 ? `Pick Owner (${upcomingDraftYear})` : 'Pick Owner';

    const teamBadge = (name: string, size: number, highlight?: boolean) => {
        const acronym = NBA_NAME_TO_ACRONYM[name] || name;
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: highlight ? '#222' : '#fff',
                    color: highlight ? '#fff' : '#222',
                    border: '1px solid #999',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size * 0.35,
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
        >
            {acronym.slice(0, 3)}
        </div>
    );
};

    const renderTeamLogoImage = (teamName: string, size: number, highlight?: boolean) => {
        const logoUrl = getTeamLogoUrl(teamName);
        if (logoUrl) {
            return (
                <img
                    src={logoUrl}
                    alt={`${teamName} logo`}
                    style={{
                        width: size,
                        height: size,
                        objectFit: 'contain',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: '#fff',
                    }}
                />
            );
        }
        return teamBadge(teamName, size, highlight);
    };

    const projectedChampion = useMemo(() => {
        const scoreLiveTeam = (team: Team) => {
            const wins = team.record?.wins ?? 0;
            const losses = team.record?.losses ?? 0;
            const games = wins + losses;
            const winPct = games > 0 ? wins / games : 0;
            const prestige = team.prestige ?? 50;
            const avgOverall =
                team.roster && team.roster.length > 0
                    ? team.roster.reduce((sum, player) => sum + (player.overall || 60), 0) / team.roster.length
                    : prestige;
            return winPct * 100 + wins * 2 - losses + prestige * 0.4 + avgOverall * 0.6;
        };
        const scoreSimTeam = (team: NBATeamSimulation) => {
            const winPct = team.wins + team.losses > 0 ? team.wins / (team.wins + team.losses) : 0;
            return winPct * 80 + team.wins * 2 - team.losses + team.rating;
        };
        if (state.nbaTeams && state.nbaTeams.length > 0) {
            const best = [...state.nbaTeams].sort((a, b) => scoreLiveTeam(b) - scoreLiveTeam(a))[0];
            if (best)
                return {
                    name: best.name,
                    wins: best.record?.wins ?? 0,
                    losses: best.record?.losses ?? 0,
                };
        }
        if (simulation?.teams && simulation.teams.length > 0) {
            const best = [...simulation.teams].sort((a, b) => scoreSimTeam(b) - scoreSimTeam(a))[0];
            if (best) return { name: best.name, wins: best.wins, losses: best.losses };
        }
        return { name: simulation?.champion || 'TBD', wins: undefined, losses: undefined };
    }, [simulation, state.nbaTeams]);

    if (!simulation) {
        return (
            <div style={{ padding: '10px', fontSize: '0.8rem' }}>
                <p>The mock draft unlocks once the NBA season simulation runs for the upcoming class. Advance to the offseason to generate projections.</p>
            </div>
        );
    }

    if (prospects.length === 0) {
        return (
            <div style={{ padding: '10px', fontSize: '0.8rem' }}>
                <p>No prospects are currently projected. Continue the season to build up draft buzz.</p>
            </div>
        );
    }

    const chipStyle: React.CSSProperties = {
        borderRadius: '12px',
        padding: '2px 8px',
        fontSize: '0.65rem',
        backgroundColor: colors.secondary,
        color: colors.text,
    };

    const classLabels: Record<string, string> = {
        freshman: 'Fr',
        sophomore: 'So',
        junior: 'Jr',
        senior: 'Sr',
        international: 'Intl',
    };
    const firstRoundLength = simulation.draftOrder.length;
    const getPerGame = (player: Player) => {
        const stats = player.seasonStats || { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 };
        const games = Math.max(1, stats.gamesPlayed || 1);
        return {
            ppg: stats.points / games,
            rpg: stats.rebounds / games,
            apg: stats.assists / games,
            mpg: (stats.minutes ?? 0) / games,
        };
    };
    const enrichedProspects = useMemo(() => {
        const baseLength = baseDraftOrder.length || 1;
        return prospects.map((prospect, index) => {
            const nbaTeam = draftOrder[index] || 'TBD';
            const slotTeam = baseDraftOrder[index % baseLength] || nbaTeam;
            return {
                ...prospect,
                pick: index + 1,
                nbaTeam,
                slotTeam,
                perGame: getPerGame(prospect.player),
                isUserPlayer: prospect.originalTeam === state.userTeam?.name,
                diff: effectiveTrendDiffs[prospect.player.id],
            };
        });
    }, [baseDraftOrder, draftOrder, prospects, state.userTeam?.name, effectiveTrendDiffs]);
    const pickOwnerLookup = useMemo(() => {
        const slotEntries: DraftSlotAssignment[] = enrichedProspects.map(prospect => ({
            pick: prospect.pick,
            round: prospect.pick <= firstRoundLength ? 1 : 2,
            slotTeam: prospect.slotTeam || prospect.nbaTeam,
        }));
        const ruleSet = state.customDraftPickRules && state.customDraftPickRules.length > 0
            ? state.customDraftPickRules
            : NBA_DRAFT_PICK_RULES;
        return computeDraftPickOwnership(slotEntries, ruleSet, upcomingDraftYear);
    }, [enrichedProspects, firstRoundLength, upcomingDraftYear, state.customDraftPickRules]);
    const filteredProspects = useMemo(() => {
        return enrichedProspects
            .filter(entry => (positionFilter === 'ALL' ? true : entry.player.position === positionFilter))
            .filter(entry => (userOnly ? entry.isUserPlayer : true))
            .filter(entry => {
                if (roundFilter === 'first') return entry.pick <= firstRoundLength;
                if (roundFilter === 'second') return entry.pick > firstRoundLength;
                return true;
            })
            .sort((a, b) => {
                switch (sortMode) {
                    case 'score':
                        return b.score - a.score;
                    case 'trend':
                        return (b.diff || 0) - (a.diff || 0);
                    default:
                        return a.pick - b.pick;
                }
            });
    }, [enrichedProspects, firstRoundLength, positionFilter, roundFilter, sortMode, userOnly]);
    const originCounts = useMemo(() => {
        return prospects.reduce(
            (totals, prospect) => {
                totals[prospect.source] = (totals[prospect.source] || 0) + 1;
                return totals;
            },
            {} as Record<DraftProspectSource, number>
        );
    }, [prospects]);

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', fontSize: '0.7rem' }}>
                {(Object.keys(classLabels) as Array<keyof typeof classLabels>).map(key => (
                    <span key={key} style={chipStyle}>
                        {classLabels[key]}: {categoryTotals[key] || 0}
                    </span>
                ))}
                <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
                    Projected Champion: {projectedChampion.name}
                    {typeof projectedChampion.wins === 'number' &&
                    typeof projectedChampion.losses === 'number'
                        ? ` (${projectedChampion.wins}-${projectedChampion.losses})`
                        : ''}
                </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px', fontSize: '0.65rem' }}>
                <label>
                    Position:&nbsp;
                    <select value={positionFilter} onChange={e => setPositionFilter(e.target.value as any)} style={styles.select}>
                        <option value="ALL">All</option>
                        <option value="PG">PG</option>
                        <option value="SG">SG</option>
                        <option value="SF">SF</option>
                        <option value="PF">PF</option>
                        <option value="C">C</option>
                    </select>
                </label>
                <label>
                    Round:&nbsp;
                    <select value={roundFilter} onChange={e => setRoundFilter(e.target.value as any)} style={styles.select}>
                        <option value="all">Full Draft</option>
                        <option value="first">Round 1</option>
                        <option value="second">Round 2</option>
                    </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="checkbox" checked={userOnly} onChange={e => setUserOnly(e.target.checked)} />
                    Show my players
                </label>
                <label>
                    Sort:&nbsp;
                    <select value={sortMode} onChange={e => setSortMode(e.target.value as any)} style={styles.select}>
                        <option value="pick">Projected Pick</option>
                        <option value="score">Draft Score</option>
                        <option value="trend">Trend</option>
                    </select>
                </label>
                <button onClick={resetFilters} style={{ ...styles.smallButton, alignSelf: 'center' }}>
                    Reset
                </button>
            </div>
            <p style={{ fontSize: '0.6rem', color: '#555', marginTop: '-6px', marginBottom: '8px' }}>
                Trend legend: ▲X means a player climbed X slots, ▼X fell X slots, and 0 stayed put.
            </p>
            <p style={{ fontSize: '0.65rem', marginBottom: '6px', color: '#444' }}>
                Showing {filteredProspects.length} of {prospects.length} prospects ({originCounts['NCAA'] || 0} NCAA /{' '}
                {originCounts['International'] || 0} Intl)
            </p>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pick</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>NBA Team</th>
                            <th
                                style={{
                                    ...styles.th,
                                    backgroundColor: colors.primary,
                                    color: colors.text,
                                    fontSize: '0.76rem',
                                    whiteSpace: 'nowrap',
                                    minWidth: '150px',
                                }}
                            >
                                {pickOwnerHeaderLabel}
                            </th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>POS</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Ht</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Class</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Origin</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>OVR</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>POT</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>PPG</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>RPG</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>APG</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MPG</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProspects.map(prospect => {
                            const rowStyle: React.CSSProperties = prospect.isUserPlayer ? { backgroundColor: '#FFFFAA' } : {};
                            const diff = prospect.diff;
                            const slotTeamKey = prospect.slotTeam || prospect.nbaTeam;
                            const ownerEntry = pickOwnerLookup.get(prospect.pick);
                            const pickOwnerName = ownerEntry?.owner || slotTeamKey;
                            const ownerDiffers = pickOwnerName !== slotTeamKey;
                            let trendLabel = 'NEW';
                            let trendColor = '#777';
                            if (typeof diff === 'number') {
                                if (diff > 0) {
                                    trendLabel = `▲ ${diff}`;
                                    trendColor = '#1a7f37';
                                } else if (diff < 0) {
                                    trendLabel = `▼ ${Math.abs(diff)}`;
                                    trendColor = '#c52b2b';
                                } else {
                                    trendLabel = '0';
                                    trendColor = '#555';
                                }
                            }
                            const teamRecord = nbaRecordMap.get(prospect.nbaTeam);
                            const slotAcronym =
                                prospect.slotTeam && prospect.slotTeam !== prospect.nbaTeam
                                    ? getTeamAbbreviation(prospect.slotTeam)
                                    : null;
                            return (
                                <tr key={`${prospect.player.id}-${prospect.pick}`} style={rowStyle}>
                                    <td style={styles.td}>{prospect.pick}</td>
                                    <td style={styles.td}>
                                        <div style={styles.teamCell}>
                                            <div style={styles.teamLogoWrapper}>{renderTeamLogoImage(prospect.nbaTeam, 32)}</div>
                                            <div style={styles.teamNameBlock}>
                                                <span>
                                                    {prospect.nbaTeam}
                                                    {teamRecord ? ` (${teamRecord.wins}-${teamRecord.losses})` : ''}
                                                </span>
                                                {slotAcronym && (
                                                    <span style={styles.teamViaText}>via {slotAcronym}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...styles.td, minWidth: '190px', fontSize: '0.72rem', lineHeight: 1.4 }}>
                                        <div style={styles.teamCell}>
                                            <div style={styles.teamLogoWrapper}>{renderTeamLogoImage(pickOwnerName, 32, ownerDiffers)}</div>
                                            <div style={styles.teamNameBlock}>
                                                <span>{pickOwnerName}</span>
                                                {ownerDiffers && (
                                                    <span style={styles.teamViaText}>via {slotTeamKey}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        {prospect.player.name}
                                        <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: trendColor, fontWeight: 'bold' }}>
                                            {trendLabel}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{prospect.player.position}</td>
                                    <td style={styles.td}>{formatPlayerHeight(prospect.player.height)}</td>
                                    <td style={styles.td}>{classLabels[prospect.category]}</td>
                                    <td style={styles.td}>{prospect.originDescription}</td>
                                    <td style={styles.td}>{prospect.player.overall}</td>
                                    <td style={styles.td}>{formatPotentialValue(prospect.player.potential)}</td>
                                    <td style={styles.td}>{prospect.perGame.ppg.toFixed(1)}</td>
                                    <td style={styles.td}>{prospect.perGame.rpg.toFixed(1)}</td>
                                    <td style={styles.td}>{prospect.perGame.apg.toFixed(1)}</td>
                                    <td style={styles.td}>{prospect.perGame.mpg.toFixed(1)}</td>
                                    <td style={styles.td}>{Math.round(prospect.score)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};








const NBATeamDetailView = ({ team, dispatch, state, colors }: { team: Team | NBATeamSimulation, dispatch: React.Dispatch<GameAction>, state: GameState, colors: TeamColors }) => {
    const [subTab, setSubTab] = useState<'roster' | 'financials'>('roster');
    
    // Helper to get consistent Team object structure (simulation vs live)
    const teamData = {
        name: team.name,
        record: { wins: (team as any).record?.wins ?? (team as any).wins ?? 0, losses: (team as any).record?.losses ?? (team as any).losses ?? 0 },
        capSpace: (team as any).salaryCapSpace ?? 0,
        taxBill: (team as any).luxuryTaxBill ?? 0,
        roster: (team as any).roster as Player[] | undefined,
    };

    // Identified alumni
    const alumniIds = new Set<string>();
    state.history.nbaDrafts.forEach(d => {
        d.picks.forEach(p => {
             if (p.originalTeam === state.userTeam?.name) {
                 alumniIds.add(p.player.id || p.player.name); // Fallback to name if ID missing in old saves
             }
        });
    });

    return (
        <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <button 
                    style={{ ...styles.button, fontSize: '0.6rem', padding: '5px 10px', marginRight: '10px' }}
                    onClick={() => dispatch({ type: 'CLOSE_NBA_TEAM_VIEW' })}
                >
                    &lt; Back
                </button>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', marginBottom: 0, color: 'black', textAlign: 'left' }}>
                    {NBA_ACRONYM_TO_NAME[teamData.name] || teamData.name}
                </h2>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.8rem', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
                <span>Record: <strong>{teamData.record.wins}-{teamData.record.losses}</strong></span>
                <span style={{ color: teamData.capSpace < 0 ? '#d32f2f' : '#388e3c' }}>
                    Cap Room: <strong>{formatCurrency(teamData.capSpace)}</strong>
                </span>
                <span style={{ color: teamData.taxBill > 0 ? '#d32f2f' : '#333' }}>
                    Tax Bill: <strong>{formatCurrency(teamData.taxBill)}</strong>
                </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <button onClick={() => setSubTab('roster')} style={{ ...styles.smallButton, fontSize: '0.7rem', padding: '8px 16px', backgroundColor: subTab === 'roster' ? '#333' : '#fff', color: subTab === 'roster' ? '#fff' : '#000' }}>Roster</button>
                <button onClick={() => setSubTab('financials')} style={{ ...styles.smallButton, fontSize: '0.7rem', padding: '8px 16px', backgroundColor: subTab === 'financials' ? '#333' : '#fff', color: subTab === 'financials' ? '#fff' : '#000' }}>Cap Sheet</button>
            </div>

            {subTab === 'roster' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    {teamData.roster ? (
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                              <thead>
                                  <tr>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Pos</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Player</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Origin</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Age</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Ovr</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Pot</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>MPG</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>PPG</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>RPG</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>APG</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Salary</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Years</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamData.roster.sort((a,b) => (b.contract?.salary || 0) - (a.contract?.salary || 0)).map(p => {
                                    const isAlumni = alumniIds.has(p.id) || alumniIds.has(p.name);
                                    const gp = p.nbaStats?.gamesPlayed || 0;
                                    const mpg = gp > 0 ? (p.nbaStats!.minutes / gp).toFixed(1) : '-';
                                    const ppg = gp > 0 ? (p.nbaStats!.points / gp).toFixed(1) : '-';
                                    const rpg = gp > 0 ? (p.nbaStats!.rebounds / gp).toFixed(1) : '-';
                                    const apg = gp > 0 ? (p.nbaStats!.assists / gp).toFixed(1) : '-';

                                    return (
                                        <tr key={p.id} style={{ backgroundColor: isAlumni ? '#e3f2fd' : 'transparent' }}>
                                            <td style={styles.td}>{p.position}</td>
                                             <td style={styles.td}>
                                                 {p.name} {isAlumni && <span style={{fontSize: '0.6rem', color: '#1976d2', fontWeight: 'bold'}}>(Alum)</span>}
                                             </td>
                                             <td style={styles.td}>{p.originDescription || 'Unknown'}</td>
                                             <td style={styles.td}>{p.age ?? 22}</td>
                                             <td style={styles.td}>{p.overall ?? '-'}</td>
                                            <td style={styles.td}>{formatPotentialValue(p.potential)}</td>
                                            <td style={styles.td}>{mpg}</td>
                                            <td style={styles.td}>{ppg}</td>
                                            <td style={styles.td}>{rpg}</td>
                                            <td style={styles.td}>{apg}</td>
                                            <td style={styles.td}>{formatCurrency(p.contract?.salary || 0)}</td>
                                            <td style={styles.td}>{p.contract?.yearsLeft || 1}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p>Roster data not available (Simulation Mode).</p>
                    )}
                </div>
            )}
            
            {subTab === 'financials' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', border: '1px solid #ddd' }}>
                        <div style={{ padding: '15px', backgroundColor: '#f9f9f9', marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <h4 style={{marginTop: 0, marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px'}}>Financial Overview</h4>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div>
                                <p style={{margin: '4px 0'}}><strong>Total Payroll:</strong> {formatCurrency(teamData.roster ? teamData.roster.reduce((sum, p) => sum + (p.contract?.salary || 0), 0) : 0)}</p>
                                <p style={{margin: '4px 0'}}><strong>Luxury Tax Estimate:</strong> {formatCurrency(teamData.taxBill)}</p>
                            </div>
                            <div style={{textAlign: 'right', fontSize: '0.7rem', color: '#666', maxWidth: '300px', fontStyle: 'italic'}}>
                                Note: Future salary cap and luxury tax thresholds are projected with an estimated ~5% annual increase.
                            </div>
                        </div>
                        </div>

                    {teamData.roster ? (
                        <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1, boxShadow: '2px 0 5px rgba(0,0,0,0.1)' }}>Player</th>
                                    <th style={styles.th}>Age</th>
                                    {[0, 1, 2, 3, 4].map(i => {
                                        const y = BASE_CALENDAR_YEAR + state.season + i;
                                        return <th key={i} style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>{y}-{String(y + 1).slice(-2)}</th>
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {teamData.roster
                                    .sort((a, b) => (b.contract?.salary || 0) - (a.contract?.salary || 0))
                                    .map(p => {
                                        const annualSalary = p.contract?.salary || 0;
                                        const yearsDesc = p.contract?.yearsLeft || 0;
                                        return (
                                            <tr key={p.id}>
                                                <td style={{...styles.td, textAlign: 'left', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1, boxShadow: '2px 0 5px rgba(0,0,0,0.05)'}}>{p.name}</td>
                                                <td style={styles.td}>{p.age ? p.age + 0 : '-'}</td>
                                                {[0, 1, 2, 3, 4].map(i => {
                                                    const isUnderContract = i < yearsDesc;
                                                    return (
                                                        <td key={i} style={{...styles.td, color: isUnderContract ? '#000' : '#ccc', backgroundColor: isUnderContract ? '#e8f5e9' : 'transparent'}}>
                                                            {isUnderContract ? formatCurrency(annualSalary) : ''}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                })}
                                {/* Totals Row */}
                                <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                    <td style={{...styles.td, textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#f0f0f0', zIndex: 1}}>TOTALS</td>
                                    <td style={styles.td}></td>
                                    {[0, 1, 2, 3, 4].map(i => {
                                        const yearTotal = teamData.roster?.reduce((sum, p) => {
                                            const yearsDesc = p.contract?.yearsLeft || 0;
                                            return sum + (i < yearsDesc ? (p.contract?.salary || 0) : 0);
                                        }, 0) || 0;
                                        return (
                                            <td key={i} style={styles.td}>{formatCurrency(yearTotal)}</td>
                                        );
                                    })}
                                </tr>
                                {/* Cap Space Row */}
                                    <tr style={{ borderTop: '1px solid #ccc', backgroundColor: '#fff' }}>
                                    <td style={{...styles.td, textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1}}>Cap Space</td>
                                    <td style={styles.td}></td>
                                    {[0, 1, 2, 3, 4].map(i => {
                                        // Project cap Increase 5% per year
                                        const baseCap = constants.NBA_SALARY_CAP_2025 || 140000000;
                                        const projectedCap = baseCap * Math.pow(1.05, state.season + i);
                                        
                                        const yearTotal = teamData.roster?.reduce((sum, p) => {
                                            const yearsDesc = p.contract?.yearsLeft || 0;
                                            return sum + (i < yearsDesc ? (p.contract?.salary || 0) : 0);
                                        }, 0) || 0;
                                        const space = projectedCap - yearTotal;
                                        return (
                                            <td key={i} style={{...styles.td, color: space >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                                                {formatCurrency(space)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                        </div>
                    ) : <p>Roster data not available.</p>}
                </div>
            )}
        </div>
    );
};


export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  useEffect(() => {
      if (
          state.status === GameStatus.DASHBOARD &&
          state.userTeam &&
          Array.isArray(state.userTeam.sponsorOffers) &&
          state.userTeam.sponsorOffers.length > 0 &&
          !isSponsorModalOpen
      ) {
          setIsSponsorModalOpen(true);
      }
  }, [state.status, state.userTeam?.sponsorOffers?.length]);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [isStaffFreeAgencyModalOpen, setIsStaffFreeAgencyModalOpen] = useState(false);
  const [detailedSeasonRecord, setDetailedSeasonRecord] = useState<UserSeasonRecord | null>(null);
  const activeStaffRenewal = state.pendingStaffRenewals[0] || null;

  const handleRenewStaffMember = (newSalary: number, years: number) => {
    if (!activeStaffRenewal) return;
    dispatch({ type: 'RENEW_STAFF_CONTRACT', payload: { staffId: activeStaffRenewal.staffId, role: activeStaffRenewal.role, newSalary, years } });
  };

  const handleDeclineStaffRenewal = () => {
    if (!activeStaffRenewal) return;
    dispatch({ type: 'DECLINE_STAFF_RENEWAL', payload: { staffId: activeStaffRenewal.staffId, role: activeStaffRenewal.role } });
  };

  const saveGame = (slot: number) => {
    try {
        if (!state.userTeam) {
            dispatch({ type: 'SET_TOAST', payload: "Cannot save before selecting a team." });
            return;
        }
        const stateToSave = { ...state, version: CURRENT_SAVE_VERSION };
        const saveState = JSON.stringify(stateToSave);
        localStorage.setItem(`sweetSixteenSave_v${CURRENT_SAVE_VERSION}_${slot}`, saveState);
        
        const meta = {
            teamName: state.userTeam.name,
            season: state.season,
            game: state.gameInSeason <= 31 ? state.gameInSeason : "Post",
            timestamp: new Date().toISOString().slice(0, 10)
        };
        localStorage.setItem(`sweetSixteenMeta_v${CURRENT_SAVE_VERSION}_${slot}`, JSON.stringify(meta));
        
        dispatch({ type: 'SET_TOAST', payload: `Game saved to slot ${slot}.` });
        setIsSettingsOpen(false);
    } catch (error) {
        console.error("Failed to save game:", error);
        dispatch({ type: 'SET_TOAST', payload: "Error saving game." });
    }
  };

  const loadGame = (slot: number) => {
    try {
        let savedStateJSON = localStorage.getItem(`sweetSixteenSave_v${CURRENT_SAVE_VERSION}_${slot}`);
        if (!savedStateJSON) {
             const legacySave = localStorage.getItem(`sweetSixteenSave_${slot}`);
             if(legacySave){
                dispatch({ type: 'SET_TOAST', payload: `Loading legacy save...` });
                savedStateJSON = legacySave;
             }
        }
        
        if (savedStateJSON) {
            const loadedState = JSON.parse(savedStateJSON);
            const migratedState = migrateSaveState(loadedState);
            dispatch({ type: 'LOAD_STATE', payload: migratedState });
            dispatch({ type: 'SET_TOAST', payload: `Game loaded from slot ${slot}.` });
            setIsSettingsOpen(false);
        } else {
            dispatch({ type: 'SET_TOAST', payload: `No save data in slot ${slot}.` });
        }
    } catch (error) {
        console.error("Failed to load game:", error);
        dispatch({ type: 'SET_TOAST', payload: "Error loading game data." });
    }
  };

  const deleteSave = (slot: number) => {
    if (window.confirm(`Are you sure you want to delete the save in slot ${slot}?`)) {
        localStorage.removeItem(`sweetSixteenSave_v${CURRENT_SAVE_VERSION}_${slot}`);
        localStorage.removeItem(`sweetSixteenMeta_v${CURRENT_SAVE_VERSION}_${slot}`);
        localStorage.removeItem(`sweetSixteenSave_${slot}`);
        localStorage.removeItem(`sweetSixteenMeta_${slot}`);
        dispatch({ type: 'SET_TOAST', payload: `Save slot ${slot} deleted.` });
        setIsSettingsOpen(false); 
    }
  };

  const exportCurrentSave = () => {
    try {
        if (!state.userTeam) {
            dispatch({ type: 'SET_TOAST', payload: 'Select a team before exporting a save.' });
            return;
        }
        const payload = { ...state, version: CURRENT_SAVE_VERSION };
        const serialized = JSON.stringify(payload);
        const blob = new Blob([serialized], { type: 'application/json' });
        const safeTeamName = state.userTeam.name.replace(/[^a-z0-9]/gi, '_');
        const fileName = `sweet-sixteen-${safeTeamName}-season-${state.season}.json`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        dispatch({ type: 'SET_TOAST', payload: 'Save downloaded.' });
    } catch (error) {
        console.error('Failed to export save:', error);
        dispatch({ type: 'SET_TOAST', payload: 'Error exporting save.' });
    }
  };

  const importSaveFromFile = async (file: File) => {
    try {
        const contents = await file.text();
        const parsed = JSON.parse(contents);
        const migratedState = migrateSaveState(parsed);
        dispatch({ type: 'LOAD_STATE', payload: migratedState });
        dispatch({ type: 'SET_TOAST', payload: `Loaded save from ${file.name}.` });
        setIsSettingsOpen(false);
    } catch (error) {
        console.error('Failed to import save:', error);
        dispatch({ type: 'SET_TOAST', payload: 'Error loading save file.' });
    }
  };
  
  const powerRankings = useMemo(() => {
      const ranks = new Map<string, number>();
      if (state.allTeams.length === 0) return ranks;
      [...state.allTeams]
          .sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10))
          .forEach((t, i) => ranks.set(t.name, i + 1));
      return ranks;
  }, [state.allTeams]);

  const userTeamRecordsWithCurrent = useMemo(() => {
      const records = [...(state.history?.userTeamRecords || [])];
      const isCurrentSeasonRecorded = records.some(r => r.season === state.season && r.teamName === state.userTeam?.name);

      if (state.userTeam && !isCurrentSeasonRecorded) {
          const earnedRevenue = calculateCurrentSeasonEarnedRevenue(state.userTeam, state.gameInSeason, state.currentUserTeamAttendance, state.tournament);
          records.push({
              season: state.season,
              teamName: state.userTeam.name,
              wins: state.userTeam.record.wins,
              losses: state.userTeam.record.losses,
              rank: powerRankings.get(state.userTeam.name) || 0,
              prestige: state.userTeam.prestige,
              totalRevenue: earnedRevenue.totalRevenue, // Use earned revenue for in-progress season
              operationalExpenses: earnedRevenue.operationalExpenses,
              projectedRevenue: state.userTeam.initialProjectedRevenue?.totalRevenue || 0,
              gameAttendance: state.currentUserTeamAttendance,
              tournamentResult: 'In Progress',
          });
      }
      return records;
  }, [state.history?.userTeamRecords, state.userTeam, state.season, state.tournament, state.currentUserTeamAttendance, powerRankings, state.gameInSeason]);


  const teamColors = (state.userTeam && SCHOOL_COLORS[state.userTeam.name]) 
    ? SCHOOL_COLORS[state.userTeam.name] 
    : {primary: '#333', secondary: '#666', text: '#fff'};

  const renderContent = () => {
    switch (state.status) {
    case GameStatus.DASHBOARD:
      return <Dashboard state={state} colors={teamColors} dispatch={dispatch} />;
    case GameStatus.NBA_DASHBOARD:
      return <NBADashboard state={state} dispatch={dispatch} />;
    case GameStatus.ROSTER:
      return <RosterView state={state} dispatch={dispatch} colors={teamColors} />;
    case GameStatus.SCHEDULE:
      return <Schedule state={state} dispatch={dispatch} colors={teamColors} />;
    case GameStatus.GAME_LOG:
        return <GameLogView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.RECRUITING: return <Recruiting state={state} dispatch={dispatch} colors={teamColors}/>;
      case GameStatus.STANDINGS: return <Standings state={state} colors={teamColors} dispatch={dispatch}/>;
      case GameStatus.TOURNAMENT: return <TournamentView state={state} dispatch={dispatch} colors={teamColors}/>;
      case GameStatus.SIGNING_PERIOD: return <SigningPeriodView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.ROSTER_FILLING: return <RosterFillingView state={state} dispatch={dispatch} colors={teamColors}/>;
      case GameStatus.TRAINING: return <Training state={state} dispatch={dispatch} colors={teamColors}/>;
      case GameStatus.IN_SEASON_TRAINING: return <InSeasonTrainingView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.HISTORY: return <History state={state} colors={teamColors} onSeasonClick={setDetailedSeasonRecord} dispatch={dispatch} onSelectNbaTeam={(team) => dispatch({ type: 'VIEW_NBA_TEAM', payload: team })} />;
      case GameStatus.NBA_TEAM_DETAIL: return state.selectedNBATeam ? <NBATeamDetailView team={state.selectedNBATeam} dispatch={dispatch} state={state} colors={teamColors} /> : null;
      case GameStatus.NBA_DRAFT_LOTTERY: return <NbaDraftLotteryView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.NIL_NEGOTIATION: return <NilNegotiationView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.SEASON_RECAP: return <SeasonRecapModal recapData={state.seasonRecapData} onClose={() => dispatch({type: 'EVALUATE_OFFSEASON'})}/>;
      case GameStatus.FINANCES:
        return state.userTeam ? <EconomyHub state={state} userTeam={state.userTeam} dispatch={dispatch} colors={teamColors} /> : null;
      case GameStatus.ROSTER_RETENTION: return <RosterRetentionView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.TRANSFER_PORTAL: return <TransferPortalView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.STAFF:
        return <StaffView team={state.userTeam!} colors={teamColors} dispatch={dispatch} onOpenFreeAgency={() => setIsStaffFreeAgencyModalOpen(true)} />;
      case GameStatus.SKILL_TREE:
        return <CoachSkillTree state={state} dispatch={dispatch} colors={teamColors} />;
      default: return <div>Coming Soon</div>;
    }
  };
  
  if (state.status === GameStatus.TEAM_SELECTION) {
      return <TeamSelection dispatch={dispatch} />
  }
   if (state.status === GameStatus.STAFF_RECRUITMENT) {
      return <StaffRecruitmentModal dispatch={dispatch} />;
  }
   if(state.status === GameStatus.COACH_PERFORMANCE_REVIEW) {
      return <CoachPerformanceReviewModal state={state} dispatch={dispatch} colors={teamColors} />
  }
  if(state.status === GameStatus.JOB_MARKET && (state.jobOffers || state.nbaJobOffers)) {
      return <JobMarketModal offers={state.jobOffers || []} nbaOffers={state.nbaJobOffers || []} dispatch={dispatch} powerRanks={powerRankings} onStay={() => dispatch({ type: 'REJECT_JOB_OFFERS' })} />
  }
  if(state.status === GameStatus.NBA_CONTRACT_NEGOTIATION && state.coach && state.nbaCoachTeam) {
      return <NBAContractNegotiationModal teamName={state.nbaCoachTeam} coach={state.coach} dispatch={dispatch} />
  }

  if(state.status === GameStatus.GAME_OVER && state.gameOverReason) {
      return <GameOverModal reason={state.gameOverReason} dispatch={dispatch} />;
  }
  if(state.status === GameStatus.CONTRACT_NEGOTIATION && state.userTeam) {
      const programExpectations = state.userTeam.boardExpectations || generateBoardExpectations(state.userTeam);
      const duration = state.pendingJobOffer?.length ?? 4;
      const contractExpectations = toContractBoardExpectations(programExpectations, duration);
      return <ContractOfferModal 
          isOpen={true}
          teamName={state.userTeam.name}
          prestige={state.userTeam.prestige}
          expectations={contractExpectations}
          offerSalary={state.pendingJobOffer?.salary}
          offerDuration={duration}
          onSign={(salary, duration) => dispatch({ type: 'SIGN_CONTRACT', payload: { expectations: toContractBoardExpectations(programExpectations, duration), salary, duration } })}
      />
  }
  if (state.status === GameStatus.SKILL_TREE) {
      return (
          <CoachSkillTree state={state} dispatch={dispatch} colors={teamColors} />
      );
  }

  return (
    <div style={styles.app}>
      {state.toastMessage && (
          <Toast message={state.toastMessage} onDismiss={() => dispatch({ type: 'SET_TOAST', payload: null })} />
      )}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={saveGame}
        onLoad={loadGame}
        onDelete={deleteSave}
        onExport={exportCurrentSave}
        onImport={importSaveFromFile}
      />
       {isCoachModalOpen && state.userTeam && (
            <CoachModal state={state} dispatch={dispatch} onClose={() => setIsCoachModalOpen(false)} />
        )}
      {detailedSeasonRecord && (
        <SeasonAttendanceDetailModal 
            seasonRecord={detailedSeasonRecord}
            teamName={detailedSeasonRecord.teamName}
            colors={SCHOOL_COLORS[detailedSeasonRecord.teamName] || teamColors}
            onClose={() => setDetailedSeasonRecord(null)}
        />
      )}
      {isSponsorModalOpen && state.userTeam && (
        <SponsorModal
            team={state.userTeam}
            allTeams={state.allTeams}
            sponsors={state.sponsors}
            colors={teamColors}
            onClose={() => setIsSponsorModalOpen(false)}
            onAcceptOffer={(offer) => {
                dispatch({ type: 'ACCEPT_SPONSOR_OFFER', payload: offer });
                setIsSponsorModalOpen(false);
            }}
        />
      )}
      {/* PoachingOfferModal removed - offers now handled in FinancialsTab */}
      {isStaffFreeAgencyModalOpen && state.freeAgentStaff && state.userTeam && (
        <StaffFreeAgencyModal
            freeAgents={state.freeAgentStaff}
            userTeam={state.userTeam}
            dispatch={dispatch}
            onClose={() => setIsStaffFreeAgencyModalOpen(false)}
        />
      )}

      {activeStaffRenewal && state.userTeam && (
        <StaffRenewalModal
            renewal={activeStaffRenewal}
            colors={teamColors}
            onRenew={handleRenewStaffMember}
            onDecline={handleDeclineStaffRenewal}
        />
      )}

      {state.selectedGameLog && (
        <BoxScoreModal
            boxScore={state.selectedGameLog}
            onClose={() => dispatch({ type: 'CLOSE_GAME_LOG' })}
        />
      )}
      
    <Header
        state={state}
        dispatch={dispatch}
        colors={teamColors}
        onHeaderClick={() => setIsSettingsOpen(true)}
        onSponsorClick={() => state.userTeam && setIsSponsorModalOpen(true)}
        onCoachClick={() => setIsCoachModalOpen(true)}
    />
    <main style={styles.mainContentArea}>
        <NavAndActions state={state} dispatch={dispatch} colors={teamColors} />
        <div style={{...styles.content, border: `4px solid ${teamColors.primary}`}}>
            {renderContent()}
        </div>
    </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    app: { 
        minHeight: '100vh', 
        fontFamily: "'Press Start 2P', cursive",
        color: '#000000',
    },
    toast: {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        zIndex: 2000,
        fontSize: '0.8rem',
        border: '2px solid white',
    },
    teamSelectionContainer: {
        backgroundColor: '#C0C0C0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
    },
    title: {
        fontSize: '3rem',
        color: '#000000',
        textShadow: '4px 4px 0px #808080',
        marginBottom: '40px',
        textAlign: 'center',
    },
    header: {
        padding: '10px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerRight: {
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '15px',
        fontSize: '0.8rem',
        textAlign: 'right',
    },
    seasonInfo: {
        textAlign: 'right',
        fontSize: '0.8rem',
    },
    logoBetween: {
        width: '90px',
        height: '90px',
        flex: '0 0 90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoButton: {
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
    },
    logoImage: {
        maxHeight: '80px',
        maxWidth: '80px',
        objectFit: 'contain',
    },
    coachButton: {
      fontFamily: "'Press Start 2P', cursive",
      fontSize: '0.6rem',
      padding: '4px 8px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
      backgroundColor: '#C0C0C0',
      color: '#000000',
      cursor: 'pointer',
    },
    sponsorDisplay: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        letterSpacing: '1px',
    },
    sponsorSlogan: {
        fontSize: '0.6rem',
        fontStyle: 'italic',
        letterSpacing: '1px',
        opacity: 0.8,
    },
    searchBarRow: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px',
        alignItems: 'center',
    },
    searchInput: {
        flex: '1 1 auto',
        padding: '6px 8px',
        borderRadius: '4px',
        border: '1px solid #bdbdbd',
        fontSize: '0.7rem',
    },
    clearFiltersButton: {
        border: '1px solid #8a8a8a',
        borderRadius: '4px',
        backgroundColor: '#f2f2f2',
        fontSize: '0.65rem',
        padding: '6px 10px',
        cursor: 'pointer',
        height: '30px',
    },
    recruitFiltersRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '10px',
    },
    filterControl: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontSize: '0.6rem',
        flex: '1 1 150px',
    },
    recruitingSummaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px',
        margin: '15px 0',
    },
    recruitingSummaryCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        fontSize: '0.65rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    trainingSummaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '10px',
        margin: '15px 0',
    },
    trainingSummaryCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#f1f8e9',
        fontSize: '0.65rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    trainingSummaryMeta: {
        fontSize: '0.55rem',
        color: '#555',
        margin: 0,
    },
    interestCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    interestBarTrack: {
        width: '100%',
        height: '6px',
        backgroundColor: '#e0e0e0',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    interestBarFill: {
        height: '100%',
        borderRadius: '999px',
    },
    interestBadge: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.55rem',
        fontWeight: 'bold',
    },
    financialHealthRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        margin: '10px 0 20px',
    },
    healthCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#f8f8f8',
        fontSize: '0.65rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    nilInfoBanner: {
        backgroundColor: '#fff7e6',
        border: '1px solid #ffcc80',
        borderRadius: '4px',
        padding: '8px 10px',
        fontSize: '0.6rem',
        marginBottom: '12px',
        color: '#6d4c41',
    },
    nilBudgetMeta: {
        fontSize: '0.55rem',
        color: '#555',
        margin: '4px 0',
    },
    nilBudgetMeterTrack: {
        width: '100%',
        height: '6px',
        backgroundColor: '#e0e0e0',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    nilBudgetMeterFill: {
        height: '100%',
        borderRadius: '999px',
        backgroundColor: '#1b5e20',
        transition: 'width 0.3s ease',
    },
    nilStatusPill: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 8px',
        borderRadius: '999px',
        fontSize: '0.55rem',
        fontWeight: 'bold',
    },
    nilInsightText: {
        fontSize: '0.5rem',
        margin: '4px 0 0 0',
        color: '#555',
    },
    nilTermHelper: {
        fontSize: '0.5rem',
        marginTop: '4px',
        color: '#8d6e63',
    },
    nilOutlookBarTrack: {
        width: '100%',
        height: '6px',
        backgroundColor: '#e0e0e0',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    nilOutlookBarFill: {
        height: '100%',
        borderRadius: '999px',
        backgroundColor: '#1b5e20',
        transition: 'width 0.3s ease',
    },
    nilHistoryPanel: {
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        backgroundColor: '#fdf7ff',
        padding: '10px',
        maxHeight: '180px',
        overflowY: 'auto',
    },
    nilHistoryList: {
        listStyle: 'none',
        paddingLeft: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '0.6rem',
    },
    nilHistoryItem: {
        borderLeft: '3px solid #9c27b0',
        paddingLeft: '8px',
        color: '#4a148c',
    },
    positionDepthRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '10px',
        fontSize: '0.65rem',
    },
    positionDepthPill: {
        border: '1px solid #d0d0d0',
        borderRadius: '4px',
        padding: '2px 6px',
        backgroundColor: '#f7f7f7',
    },
    healthMeta: {
        fontSize: '0.55rem',
        margin: 0,
        color: '#555',
    },
    revenueMixGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '8px',
        marginBottom: '15px',
    },
    revenueMixCard: {
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        padding: '8px',
        fontSize: '0.6rem',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    revenueMixMeta: {
        fontSize: '0.55rem',
        margin: 0,
        color: '#666',
    },
    investmentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '10px',
        marginBottom: '20px',
    },
    investmentCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#f4f6ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '0.6rem',
    },
    investmentMeta: {
        fontSize: '0.55rem',
        fontStyle: 'italic',
        color: '#333',
        margin: 0,
    },
    tableLinkButton: {
        background: 'none',
        border: 'none',
        padding: 0,
        color: '#0044cc',
        textDecoration: 'underline',
        cursor: 'pointer',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.6rem',
    },
    tableSortButton: {
        background: 'none',
        border: 'none',
        padding: 0,
        color: 'inherit',
        cursor: 'pointer',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.55rem',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px',
        marginBottom: '20px',
    },
    kpiCard: {
        border: '1px solid #d1d1d1',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#fefefe',
        fontSize: '0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    kpiMeta: {
        fontSize: '0.55rem',
        color: '#666',
        margin: 0,
    },
    coachModalGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '12px',
        marginBottom: '15px',
    },
    coachModalCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        fontSize: '0.65rem',
    },
    modalList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    renameRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '8px',
    },
    renameInput: {
        flex: 1,
        padding: '6px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.7rem',
    },
    autoTrainingToggleRow: {
        border: '1px dashed #9e9e9e',
        padding: '10px',
        borderRadius: '6px',
        marginBottom: '15px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    autoTrainingLogContainer: {
        marginTop: '15px',
        padding: '10px',
        border: '1px solid #cccccc',
        borderRadius: '6px',
        backgroundColor: '#fafafa',
    },
    autoTrainingLogList: {
        listStyle: 'none',
        paddingLeft: 0,
        fontSize: '0.6rem',
        maxHeight: '120px',
        overflowY: 'auto',
        margin: 0,
    },
    autoTrainingLogEmpty: {
        fontSize: '0.6rem',
        color: '#555',
        margin: 0,
    },
    pricePresetRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '10px',
    },
    presetButton: {
        flex: '1 1 200px',
        minWidth: '200px',
        border: '2px solid #9e9e9e',
        padding: '10px',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '0.6rem',
        cursor: 'pointer',
    },
    scenarioCard: {
        border: '2px solid #c0c0c0',
        borderRadius: '6px',
        padding: '12px',
        backgroundColor: '#f7f7f7',
        marginBottom: '15px',
    },
    scenarioRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.65rem',
        marginBottom: '6px',
    },
    sentimentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '6px',
        marginTop: '10px',
    },
    sentimentPill: {
        border: '1px solid #d0d0d0',
        borderRadius: '999px',
        padding: '6px 10px',
        fontSize: '0.55rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    weeklyMeters: {
        marginTop: '15px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
    },
    resourceMeterCard: {
        flex: '1 1 200px',
        minWidth: '200px',
        border: '1px solid #d0d0d0',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#fdfdfd',
    },
    resourceMeterHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.6rem',
        marginBottom: '6px',
    },
    resourceMeterTrack: {
        width: '100%',
        height: '8px',
        backgroundColor: '#e0e0e0',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    resourceMeterFill: {
        height: '100%',
        borderRadius: '999px',
    },
    resourceMeterMeta: {
        fontSize: '0.55rem',
        marginTop: '6px',
        color: '#444',
    },
    modalSubheading: {
        fontSize: '0.75rem',
        marginTop: '15px',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    sponsorGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px',
        marginTop: '10px',
    },
    sponsorCard: {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#CCCCCC',
        borderRadius: '4px',
        padding: '15px',
        marginBottom: '10px',
        backgroundColor: '#F5F5F5',
        fontSize: '0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    jobOfferCard: {
        border: '2px solid #808080',
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#E0E0E0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sponsorModalContent: {
        backgroundColor: '#C0C0C0',
        padding: '20px',
        border: '4px solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
    },
    sponsorTableHeader: {
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontSize: '0.6rem',
    },
    sponsorTableRow: {
        transition: 'background-color 0.2s ease',
    },
    mainContentArea: {
        padding: '10px',
        backgroundColor: '#C0C0C0'
    },
    navAndActionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '10px',
        position: 'sticky',
        top: 70,
        zIndex: 90,
        backgroundColor: '#C0C0C0',
        padding: '10px 0',
    },
    navRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '10px',
    },
    actionsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '10px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        width: '100%',
        maxWidth: '1200px',
    },
    button: {
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.8rem',
        padding: '10px',
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        backgroundColor: '#C0C0C0',
        color: '#000000',
        cursor: 'pointer',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
    },
    content: {
        padding: '15px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        position: 'relative',
    },
    tableContainer: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.7rem',
        color: '#000000',
        minWidth: '600px',
    },
    th: {
        padding: '8px',
        border: '1px solid #000',
        textAlign: 'left',
    },
    td: {
        padding: '8px',
        border: '1px solid #ddd',
        verticalAlign: 'middle',
        color: '#000000',
    },
    teamCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
    },
    teamLogoWrapper: {
        flexShrink: 0,
    },
    teamNameBlock: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
    },
    teamViaText: {
        fontSize: '0.62rem',
        color: '#555',
    },
    inlineRowAction: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    select: {
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.7rem',
        padding: '5px',
        border: '2px solid #000',
        backgroundColor: '#FFFFFF',
        color: '#000000',
    },
    pullButton: {
      fontFamily: "'Press Start 2P', cursive",
      fontSize: '0.5rem',
      padding: '4px 6px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
      backgroundColor: '#E0A0A0',
      color: '#000000',
      cursor: 'pointer',
    },
    recruitingHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px',
        fontSize: '0.7rem'
    },
    recruitingThead: {
        fontSize: '0.55rem',
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: '#111827',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.6rem',
        padding: 0,
    },
    actionGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
    },
    smallButton: {
      fontFamily: "'Press Start 2P', cursive",
      fontSize: '0.5rem',
      padding: '4px 6px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
      backgroundColor: '#C0C0C0',
      color: '#000000',
      cursor: 'pointer',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#C0C0C0',
        padding: '20px',
        border: '4px solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
    },
    modalCloseButton: {
        position: 'absolute',
        top: '5px',
        right: '5px',
        fontFamily: "'Press Start 2P', cursive",
        backgroundColor: '#C0C0C0',
        border: '2px solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        width: '25px',
        height: '25px',
        cursor: 'pointer',
    },
    slotContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        border: '2px solid #808080',
        marginBottom: '10px',
        backgroundColor: '#E0E0E0',
    },
    slotInfo: {
        flex: 1,
    },
    slotActions: {
        display: 'flex',
        gap: '5px',
    },
    revenueRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '5px 0',
        borderBottom: '1px solid #aaa',
        fontSize: '0.7rem'
    },
    staffCard: {
        border: '2px solid #808080',
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#E0E0E0',
        color: '#000000',
    },
    staffGrade: {
        backgroundColor: '#A0A0A0',
        padding: '3px 6px',
        fontSize: '0.6rem',
        border: '1px solid #000'
    }
};
