import { processNBAWeeklyMoves } from '../services/gameService';
import { Player, Team, NBAFreeAgent, GameState, GameStatus } from '../types';

// Mock Constants (since we can't easily import them if they are not exported)
const MIN_NBA_ROSTER_SIZE = 14;

// Helper to create mock player
const createMockPlayer = (id: string, ovr: number, age: number, pot: number): Player => ({
    id,
    name: `Player ${id}`,
    overall: ovr,
    potential: pot,
    age,
    year: 'Pro',
    position: 'SG',
    height: 78,
    stats: {} as any,
    seasonStats: {} as any,
    contract: { salary: 1000000, yearsLeft: 1, type: 'Guaranteed' },
    starterPosition: null,
    startOfSeasonOverall: ovr,
    xFactor: 0,
    isTargeted: false
} as any as Player);

// Helper to create mock team
const createMockTeam = (name: string, playerCount: number, startOvr: number): Team => {
    const roster: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
        roster.push(createMockPlayer(`${name}-${i}`, startOvr + i, 25, startOvr + i + 5));
    }
    return {
        name,
        roster,
        prestige: 80,
        record: { wins: 0, losses: 0 },
        // ... minimum other required fields
    } as any as Team;
};

// 1. Setup Data
console.log("Setting up mock data...");

const teamOverLimit = createMockTeam("TeamOver", 16, 70); // 16 players, OVR 70-85
// Make the worst player explicitly bad/old to test cut logic
teamOverLimit.roster[0].overall = 65;
teamOverLimit.roster[0].age = 32; // Should be cut score high

const teamUnderLimit = createMockTeam("TeamUnder", 13, 75); // 13 players
const bestFA = createMockPlayer("FA-Best", 78, 24, 82); // Strategic target
const worstFA = createMockPlayer("FA-Worst", 65, 30, 65); // Min filler

const freeAgents: NBAFreeAgent[] = [
    { player: bestFA, reason: 'Cut', seasonAdded: 0, weekAdded: 1 },
    { player: worstFA, reason: 'Cut', seasonAdded: 0, weekAdded: 1 }
];

const teams = [teamOverLimit, teamUnderLimit];

const mockState: GameState = {
    nbaTeams: teams,
    nbaFreeAgents: freeAgents,
    nbaTransactions: [],
    season: 0,
    week: 1,
    status: GameStatus.NBA_DASHBOARD,
    // ... minimal other fields
    allTeams: [],
    schedule: [],
    recruits: [],
    sponsors: {},
    sponsorQuestDeck: [],
    eventPlaybookCatalog: [],
    economyTelemetry: { attendanceDeltas: [], nilSpendEfficiency: [], completedQuests: [], eventFeed: [] },
    gameLogs: [],
    internationalProspects: [],
    history: { userTeamRecords: [], champions: [], teamHistory: {}, nbaDrafts: [] },
    retiredCoaches: [],
    trainingFocuses: { pg: null, sg_sf: null, pf_c: null },
    trainingSummary: [],
    autoTrainingLog: [],
    seasonEndSummary: [],
    signingDaySummary: [],
    draftResults: [],
    nilNegotiationCandidates: [],
    nilNegotiationHistory: [],
    mockDraftProjections: {},
    mockDraftProjectionDiffs: {},
    customDraftPickRules: [],
    contactsMadeThisWeek: 0,
    trainingPointsUsedThisWeek: 0,
    lastSimResults: [],
    signingPeriodDay: 0,
    rosterRolledOver: false,
    offSeasonAdvanced: false,
    postSeasonResolved: false,
    rotationPreference: 'balanced',
    autoTrainingEnabled: false,
    currentUserTeamAttendance: [],
    userTeam: null,
    currentNBASimulation: null,
    poachingOffers: [],
    toastMessage: null,
    seasonRecapData: null,
    coach: null,
    jobOffers: null,
    pendingJobOffer: null,
    contractReviewData: null,
    freeAgentStaff: null,
    pendingStaffRenewals: [],
    gameOverReason: null,
    version: 1,
    playbookFamiliarity: 0
} as any as GameState;

// 2. Run Logic
console.log("Running processNBAWeeklyMoves...");
const resultState = processNBAWeeklyMoves(mockState);
const resultTeams = resultState.nbaTeams;
const resultTransactions = resultState.nbaTransactions || [];

// 3. Verify Results
console.log("\n--- Verification Results ---");

const resTeamOver = resultTeams.find(t => t.name === "TeamOver")!;
const resTeamUnder = resultTeams.find(t => t.name === "TeamUnder")!;

// Check Cuts
if (resTeamOver.roster.length === 15) {
    console.log("PASS: TeamOver roster trimmed to 15.");
} else {
    console.log(`FAIL: TeamOver roster size is ${resTeamOver.roster.length} (Expected 15)`);
}

const cutEvent = resultTransactions.find(t => t.teamName === "TeamOver" && t.type === 'Cut');
if (cutEvent) {
    console.log(`PASS: Cut transaction found: ${cutEvent.description}`);
} else {
    console.log("FAIL: No cut transaction logged for TeamOver.");
}

// Check Signings (Minimum Filling)
if (resTeamUnder.roster.length >= 14) {
    console.log(`PASS: TeamUnder roster filled to ${resTeamUnder.roster.length} (Expected >= 14).`);
} else {
    console.log(`FAIL: TeamUnder roster size is ${resTeamUnder.roster.length} (Expected >= 14)`);
}

const signEvent = resultTransactions.find(t => t.teamName === "TeamUnder" && t.type === 'Signing');
if (signEvent) {
    console.log(`PASS: Signing transaction found: ${signEvent.description}`);
} else {
    console.log("FAIL: No signing transaction logged for TeamUnder.");
}

console.log(`TeamUnder Size: ${resTeamUnder.roster.length}`);