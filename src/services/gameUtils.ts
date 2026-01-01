import {
    Team, 
    Player, 
    Coach, 
    HeadCoachProfile, 
    TeamHistory, 
    GameResult, 
    GameState, 
    PricePresetKey, 
    Prices, 
    RotationPreference,
    RosterPositions,
    Staff,
    StaffGroupKey,
    PendingStaffRenewal,
    GameAttendanceRecord,
    NBAFreeAgent,
    FinancialInvestmentType,
    InterestTier,
    Tournament,
    NBATeamSimulation,
    NBADraftHistoryEntry
} from '../types';
import { 
    ensureArenaFacility, 
    createNilCollectiveProfile, 
    initializeEconomy, 
    generateBoardExpectations, 
    applyNBAFreeAgentRetirementRules,
    createHeadCoachProfile,
    randomBetween
} from './gameService';
import { ensurePlayerNilProfile, calculateTeamNilBudget } from './nilService';

// --- Constants & Configs ---

export const ROTATION_PREFERENCE_OPTIONS: { value: RotationPreference; label: string; description: string }[] = [
    { value: 'balanced', label: 'Balanced', description: 'Let the system prioritize overall strength.' },
    { value: 'starterHeavy', label: 'Starter Heavy', description: 'Keep starters on the floor and limit bench minutes.' },
    { value: 'sevenSecond', label: '7-Second', description: 'Favor playmakers/grinders who push the pace early.' },
    { value: 'threeAndD', label: '3 & D', description: 'Reward defenders who can space the floor.' },
    { value: 'defensive', label: 'Defense First', description: 'Lean on players with strong defensive metrics.' },
];

export const rotationPreferenceBoosters: Record<RotationPreference, (player: Player) => number> = {
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

export const AUTO_TRAINING_LOG_LIMIT = 20;
export const AUTO_TRAINING_STAT_KEYS: (keyof Player['stats'])[] = ['insideScoring', 'outsideScoring', 'playmaking', 'perimeterDefense', 'insideDefense', 'rebounding'];

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

export const staffRoleLabels: Record<StaffGroupKey, Staff['role']> = {
    assistants: 'Assistant Coach',
    trainers: 'Trainer',
    scouts: 'Scout',
};

// --- Helper Functions ---

export const getInterestTier = (interest: number) => INTEREST_TIERS.find(tier => interest >= tier.min) || INTEREST_TIERS[INTEREST_TIERS.length - 1];
export const normalizeInterest = (value: number) => clampNumber(Math.round(value), 0, 100);
export const formatPotentialValue = (value?: number) => (typeof value === 'number' ? Math.round(value) : '-');

export const clampMinutes = (value: number) => Math.max(0, Math.min(40, value));
export const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const normalizeAcademicYearLabel = (year?: string | null) => (year || '').toLowerCase().replace(/\./g, '').trim();
export const isSeniorAcademicYear = (year?: string | null) => {
    const normalized = normalizeAcademicYearLabel(year);
    if (!normalized) return false;
    return normalized.startsWith('sr') || normalized.includes('senior') || normalized.startsWith('gr') || normalized.includes('grad');
};
export const isJuniorAcademicYear = (year?: string | null) => {
    const normalized = normalizeAcademicYearLabel(year);
    if (!normalized) return false;
    return normalized.startsWith('jr') || normalized.includes('junior');
};

export const formatPlayerHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
};

// --- Game Logic Helpers ---

export const syncSelectedNBATeamWithRoster = (selected: Team | NBATeamSimulation | null, nbaTeams: Team[]): Team | NBATeamSimulation | null => {
    if (!selected) return null;
    const matched = nbaTeams.find(team => team.name === selected.name);
    return matched || selected;
};

export const upsertDraftHistoryEntry = (drafts: NBADraftHistoryEntry[] | undefined, entry: NBADraftHistoryEntry): NBADraftHistoryEntry[] => {
    const filtered = (drafts || []).filter(d => d.season !== entry.season);
    return [...filtered, entry];
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

export const calculateAvailableScholarships = (team: Team): number => {
    const seniors = team.roster.filter(p => p.year === 'Sr').length;
    const activeRoster = team.roster.length;
    return 15 - activeRoster + seniors;
};

export const getEarliestHistorySeason = (historyMap?: { [key: string]: TeamHistory[] }): number | undefined => {
    if (!historyMap) return undefined;
    let minSeason = Infinity;
    Object.values(historyMap).forEach(entries => {
        entries.forEach(entry => {
            if (entry.season < minSeason) minSeason = entry.season;
        });
    });
    return Number.isFinite(minSeason) ? minSeason : undefined;
};

export const findNextHomeGameForTeam = (schedule: GameResult[][], gameInSeason: number, teamName: string) => {
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

export const playerCoversPosition = (player: Player, position: RosterPositions): boolean =>
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

export const dedupeAttendanceRecords = (records: GameAttendanceRecord[]): GameAttendanceRecord[] => {
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

export const calculateUnfinishedBusinessBonus = (teamName: string, tournament: Tournament | null): number => {
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

export const mergeNBAFreeAgents = (current: NBAFreeAgent[], additions: NBAFreeAgent[]): NBAFreeAgent[] => {
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

// --- Initialization & Normalization Helpers ---

export const ensurePlayerNilState = (player: Player): Player => ensurePlayerNilProfile(player);

export const ensureTeamHeadCoach = (team: Team): Team => {
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

export const ensureTeamEconomyState = (team: Team): Team => {
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

export const alignTeamHeadCoachWithUser = (team: Team, coach: Coach, season?: number): Team => {
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

export const evaluateCoachForNextSeason = (
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

export const normalizeStaffContract = (member: Staff): Staff => {
    const contractLength = member.contractLength ?? randomBetween(2, 4);
    const yearsRemaining = member.yearsRemaining ?? contractLength;
    return { ...member, contractLength, yearsRemaining };
};

export const normalizeTeamStaffContracts = (team: Team): Team => {
    const staff = team.staff || { assistants: [], trainers: [], scouts: [] };
    const normalizeGroup = (group: Staff[]) => group.map(normalizeStaffContract);
    return {
        ...team,
        staff: {
            assistants: normalizeGroup(staff.assistants),
            trainers: normalizeGroup(staff.trainers),
            scouts: normalizeGroup(staff.scouts),
        },
    };
};

export const collectExpiredStaffRenewals = (team: Team | null): PendingStaffRenewal[] => {
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

export const ageStaffContractsForTeam = (team: Team): Team => {
    if (!team.staff) return team;
    const ageGroup = (group: Staff[]) =>
        group.map(member => {
            const newVal = (member.yearsRemaining ?? 0) - 1;
            return {
                ...member,
                yearsRemaining: Math.max(0, newVal),
            };
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

export const normalizePlayerSeasonStats = (player: Player): Player => {
    if (!player.seasonStats) {
        return { ...player, seasonStats: { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, minutes: 0 } };
    }
    const { gamesPlayed, points, rebounds, assists, steals, blocks } = player.seasonStats;
    if (gamesPlayed === 0 && points === 0 && rebounds === 0 && assists === 0) return player;
    // Simple verification/cleanup if needed
    return player;
};

export const normalizeTeamData = (team: Team): Team => {
    const withCoach = ensureTeamHeadCoach(team);
    const withEconomy = ensureTeamEconomyState(withCoach);
    const withStaff = normalizeTeamStaffContracts(withEconomy);
    return {
        ...withStaff,
        roster: withStaff.roster.map(normalizePlayerSeasonStats),
    };
};

// --- Roster Logic ---
// (Recreating minute distribution logic here so it can be used by gameReducer)

const staminaCap = (player: Player) => clampMinutes(Math.round(20 + Math.max(0, (player.stats.stamina ?? 70) - 50) * 0.3));
const computeRotationWeight = (player: Player) => {
    const staminaFactor = 0.6 + (player.stats.stamina ?? 70) / 200;
    return Math.max(1, Math.pow(player.overall, 1.2) * (player.starterPosition ? 1.2 : 0.95) * staminaFactor);
};

const MAX_TEAM_MINUTES = 200;

export const distributeMinutesForUnlocked = (roster: Player[], targetMinutes: number, preference: RotationPreference): Player[] => {
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

export const addRemainingMinutesToUnlocked = (roster: Player[]): { roster: Player[]; remaining: number } => {
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
