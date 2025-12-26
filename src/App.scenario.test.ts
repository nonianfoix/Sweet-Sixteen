// App.scenario.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameReducer } from '../App';
import { GameState, Team, GameAction, GameAttendanceRecord, GameStatus, NilNegotiationCandidate, ArenaFacility, GameResult, Recruit } from '../types';
import { mockTeam } from '../EconomyHub.test';
import { resolveZoneTicketPrice } from '../services/gameService';
import { createRecruit, processRecruitingWeek } from '../services/gameService';

const scenarioNilCandidate: NilNegotiationCandidate = {
    playerId: mockTeam.roster[0].id,
    playerName: mockTeam.roster[0].name,
    year: mockTeam.roster[0].year,
    position: mockTeam.roster[0].position,
    secondaryPosition: mockTeam.roster[0].secondaryPosition,
    overall: mockTeam.roster[0].overall,
    potential: mockTeam.roster[0].potential,
    draftProjection: mockTeam.roster[0].draftProjection || 'Undrafted',
    expectedNilValue: mockTeam.roster[0].nilValue || 100000,
    minimumAsk: 50000,
    prefersMultiYear: true,
    sponsorSubsidy: 0,
    reason: 'Test NIL candidate',
    status: 'pending',
};

const baseArenaFacility: Omit<ArenaFacility, 'attendanceLog'> = {
    name: 'Home Arena',
    capacity: 15000,
    quality: 80,
    luxurySuites: 50,
    seatMix: {
        lowerBowl: { capacity: 6000, priceModifier: 1.2 },
        studentSection: { capacity: 3000, priceModifier: 0.8 },
        upperBowl: { capacity: 5000, priceModifier: 1.0 },
        suites: { capacity: 1000, priceModifier: 2.0 },
    },
};

const createScenarioFacilities = (): Team['facilities'] => ({
    arena: {
        ...baseArenaFacility,
        attendanceLog: [],
    },
});

// Helper to create a deep copy of the state to avoid mutation issues
const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));

const createInitialGameState = (): GameState => ({
    season: 1,
    week: 1,
    gameInSeason: 1,
    schedule: [
        [{ homeTeam: mockTeam.name, awayTeam: 'Opponent 1', homeScore: 0, awayScore: 0, played: false }],
        [{ homeTeam: mockTeam.name, awayTeam: 'Opponent 2', homeScore: 0, awayScore: 0, played: false }],
        [{ homeTeam: mockTeam.name, awayTeam: 'Opponent 3', homeScore: 0, awayScore: 0, played: false }],
        [{ homeTeam: mockTeam.name, awayTeam: 'Opponent 4', homeScore: 0, awayScore: 0, played: false }],
        [{ homeTeam: mockTeam.name, awayTeam: 'Opponent 5', homeScore: 0, awayScore: 0, played: false }],
        [{ homeTeam: 'Opponent 6', awayTeam: mockTeam.name, homeScore: 0, awayScore: 0, played: false }],
    ],
    allTeams: [
        deepCopy(mockTeam),
        { ...deepCopy(mockTeam), name: 'Opponent 1', isUserTeam: false },
        { ...deepCopy(mockTeam), name: 'Opponent 2', isUserTeam: false },
        { ...deepCopy(mockTeam), name: 'Opponent 3', isUserTeam: false },
        { ...deepCopy(mockTeam), name: 'Opponent 4', isUserTeam: false },
        { ...deepCopy(mockTeam), name: 'Opponent 5', isUserTeam: false },
        { ...deepCopy(mockTeam), name: 'Opponent 6', isUserTeam: false },
    ],
    userTeam: deepCopy(mockTeam),
    userTeamId: mockTeam.name,
    recruits: [],
    sponsors: {},
    history: { userTeamRecords: [], champions: [], teamHistory: {}, nbaDrafts: [] },
    gameLogs: [],
    internationalProspects: [],
    nbaSimulation: null,
    nbaTeams: [],
    nbaSchedule: [],
    eventPlaybookCatalog: [],
    sponsorQuestDeck: [],
    economyTelemetry: {
        attendanceDeltas: [],
        nilSpendEfficiency: [],
        completedQuests: [],
        eventFeed: [],
    },
    nilNegotiationCandidates: [scenarioNilCandidate],
    nilNegotiationHistory: [],
    currentUserTeamAttendance: [],
    notifications: [],
    mode: GameStatus.HOME, // Default mode for testing
    tournament: null,
    conferenceTournaments: [],
    nbaDraftBoard: [],
    newsFeed: [],
    userTeamRecords: [],
    scoutingReports: [],
});

describe('App.tsx gameReducer scenario tests', () => {
    let initialState: GameState;

    beforeEach(() => {
        initialState = createInitialGameState();
        // Ensure userTeam has initial facilities for attendance calculations
        const userTeam = initialState.allTeams.find(t => t.isUserTeam);
        if (userTeam) {
            userTeam.facilities = createScenarioFacilities();
        }
        if (initialState.userTeam) {
            initialState.userTeam.facilities = createScenarioFacilities();
        }
    });

    it('should simulate a 5-game homestand with varying pricing and verify zone analytics', () => {
        let state = initialState;
        const userTeamIndex = state.allTeams.findIndex(team => team.isUserTeam);
        if (userTeamIndex === -1) throw new Error("User team not found in initial state.");

        // Week 1: Normal pricing
        state = gameReducer(state, { type: 'SIMULATE_WEEK' });
        expect(state.week).toBe(2);
        expect(state.gameInSeason).toBe(2);
        expect(state.currentUserTeamAttendance.length).toBe(1);
        let week1Attendance = state.currentUserTeamAttendance[0];

        // Week 2: Increase lower bowl price, decrease student section price
        const baseTicketPrice = state.userTeam?.prices.ticketPrice ?? mockTeam.prices.ticketPrice;
        const baseLowerModifier = state.userTeam?.facilities?.arena?.seatMix?.lowerBowl?.priceModifier ?? 1;
        const baseStudentModifier = state.userTeam?.facilities?.arena?.seatMix?.studentSection?.priceModifier ?? 1;
        const baseLowerPrice = resolveZoneTicketPrice('lowerBowl', baseLowerModifier, baseTicketPrice);
        const baseStudentPrice = resolveZoneTicketPrice('studentSection', baseStudentModifier, baseTicketPrice);
        state = gameReducer(state, {
            type: 'UPDATE_ZONE_PRICING',
            payload: {
                lowerBowl: 1.5,
                studentSection: 0.6,
                upperBowl: 1.0,
                suites: 2.0,
            }
        });
        state = gameReducer(state, { type: 'SIMULATE_WEEK' });
        expect(state.week).toBe(3);
        expect(state.gameInSeason).toBe(3);
        expect(state.currentUserTeamAttendance.length).toBe(2);
        let week2Attendance = state.currentUserTeamAttendance[1];
        const updatedLowerPrice = resolveZoneTicketPrice(
            'lowerBowl',
            state.userTeam?.facilities?.arena?.seatMix?.lowerBowl?.priceModifier ?? baseLowerModifier,
            state.userTeam?.prices.ticketPrice ?? baseTicketPrice,
        );
        const updatedStudentPrice = resolveZoneTicketPrice(
            'studentSection',
            state.userTeam?.facilities?.arena?.seatMix?.studentSection?.priceModifier ?? baseStudentModifier,
            state.userTeam?.prices.ticketPrice ?? baseTicketPrice,
        );
        // Prices should now reflect the updated modifiers.
        // Assert that prices affect attendance (directionally) via the updated modifiers.
        expect(updatedLowerPrice).toBeGreaterThan(baseLowerPrice);
        expect(updatedStudentPrice).toBeLessThan(baseStudentPrice);

        // Week 3: Run attendance sim without actually simulating week (to verify forecast)
        let stateAfterSim = gameReducer(deepCopy(state), { // Use deepCopy to not affect 'state' for next week's simulation
            type: 'RUN_ATTENDANCE_SIM',
            payload: {
                lowerBowl: 1.0,
                studentSection: 0.8,
                upperBowl: 1.0,
                suites: 2.0,
            }
        });
        expect(stateAfterSim.currentUserTeamAttendance.length).toBe(3); // Should add a simulated record
        expect(stateAfterSim.currentUserTeamAttendance[2].simulated).toBe(true);

        // Week 3: Simulate with normal pricing
        state = gameReducer(state, { type: 'SIMULATE_WEEK' });
        expect(state.week).toBe(4);
        expect(state.gameInSeason).toBe(4);
        expect(state.currentUserTeamAttendance.length).toBe(3);
        
        // Week 4: Increase overall ticket price
        state = gameReducer(state, { type: 'UPDATE_PRICES', payload: { ticketPrice: 30 } });
        state = gameReducer(state, { type: 'SIMULATE_WEEK' });
        expect(state.week).toBe(5);
        expect(state.gameInSeason).toBe(5);
        expect(state.currentUserTeamAttendance.length).toBe(4);
        
        // Week 5: Simulate another week with high prices
        state = gameReducer(state, { type: 'SIMULATE_WEEK' });
        expect(state.week).toBe(6);
        expect(state.gameInSeason).toBe(6);
        expect(state.currentUserTeamAttendance.length).toBe(5); // 5 actual games played
        
        const finalUserTeam = state.allTeams.find(t => t.isUserTeam);
        expect(finalUserTeam?.facilities?.arena?.attendanceLog?.length).toBe(5); // Should have 5 logs
        
        // Verify revenue changes via attendance log entries
        const attendanceRevenue = finalUserTeam?.facilities?.arena?.attendanceLog?.reduce((sum, entry) => sum + (entry.revenue || 0), 0) ?? 0;
        expect(attendanceRevenue).toBeGreaterThan(0);
        
        // Check telemetry (example: should have revenue events)
        expect(state.economyTelemetry.eventFeed.filter(e => e.type === 'revenue').length).toBeGreaterThan(0);
    });

    it('should correctly handle LOAD_STATE action', () => {
        const userTeam = deepCopy(mockTeam);
        userTeam.finances.totalRevenue = 5000000;
        userTeam.fanSentiment = 99;

        const loadedState: GameState = {
            ...initialState,
            season: 5,
            week: 10,
            allTeams: [{ ...userTeam }],
            userTeamId: userTeam.name,
            economyTelemetry: {
                eventFeed: [{ id: 'loaded', type: 'revenue', message: 'Loaded revenue', timestamp: Date.now(), value: 1000 }]
            }
        };

        const newState = gameReducer(initialState, { type: 'LOAD_STATE', payload: loadedState });

        expect(newState.season).toBe(5);
        expect(newState.week).toBe(10);
        expect(newState.allTeams.find(t => t.isUserTeam)?.finances.totalRevenue).toBe(5000000);
        expect(newState.economyTelemetry.eventFeed.length).toBe(1);
        expect(newState.economyTelemetry.eventFeed[0].id).toBe('loaded');
    });

    it('should resolve a package-deal pair with overlapping elite offers', () => {
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

        const duke = { ...deepCopy(mockTeam), name: 'Duke', prestige: 95, recruitingPrestige: 95, isUserTeam: true, state: 'NC', conference: 'ACC' };
        const mid = { ...deepCopy(mockTeam), name: 'Midtown U', prestige: 68, recruitingPrestige: 68, isUserTeam: false, state: 'TX', conference: 'AAC' };
        const teams = [duke, mid];

        const recruitA = {
            ...createRecruit(),
            id: 'recruit-a',
            name: 'Jordan Ellis',
            stars: 5,
            overall: 90,
            potential: 96,
            position: 'SG',
            interest: 72,
            cpuOffers: ['Duke', 'Midtown U'],
            userHasOffered: false,
            declinedOffers: [],
            motivations: {
                proximity: 35,
                playingTime: 25,
                nil: 85,
                exposure: 90,
                relationship: 88,
                development: 65,
                academics: 50,
            },
            relationships: [{
                type: 'Sibling',
                personId: 'recruit-b',
                displayName: 'Jalen Ellis',
                sportLevel: 'HS',
                notes: 'Package deal',
            }],
            softCommitment: false,
            verbalCommitment: null,
            visitStatus: 'None',
            dealbreaker: 'None',
        } as Recruit;

        const recruitB = {
            ...createRecruit(),
            id: 'recruit-b',
            name: 'Jalen Ellis',
            stars: 4,
            overall: 84,
            potential: 92,
            position: 'SG',
            interest: 70,
            cpuOffers: ['Duke', 'Midtown U'],
            userHasOffered: false,
            declinedOffers: [],
            motivations: {
                proximity: 40,
                playingTime: 35,
                nil: 78,
                exposure: 82,
                relationship: 85,
                development: 60,
                academics: 55,
            },
            relationships: [{
                type: 'Sibling',
                personId: 'recruit-a',
                displayName: 'Jordan Ellis',
                sportLevel: 'HS',
                notes: 'Package deal',
            }],
            softCommitment: false,
            verbalCommitment: null,
            visitStatus: 'None',
            dealbreaker: 'None',
        } as Recruit;

        let recruits = [recruitA, recruitB];
        const schedule: GameResult[][] = Array.from({ length: 12 }, () => []);

        for (let week = 1; week <= 8; week += 1) {
            const result = processRecruitingWeek(teams, recruits, duke.name, week, schedule, false, 0, 0);
            recruits = result.updatedRecruits;
        }

        const updatedA = recruits.find(r => r.id === 'recruit-a');
        const updatedB = recruits.find(r => r.id === 'recruit-b');

        expect(updatedA?.verbalCommitment).toBeTruthy();
        expect(updatedA?.verbalCommitment).toBe(updatedB?.verbalCommitment);
        expect(updatedA?.verbalCommitment).toBe('Duke');

        randomSpy.mockRestore();
    });

    it('should update NIL budget and usage on MAKE_NIL_OFFER action', () => {
        let state = initialState;
        const userTeam = state.allTeams.find(t => t.isUserTeam);
        if (!userTeam) throw new Error("User team not found.");

        const initialNilBudget = userTeam.nilBudget;
        const initialNilUsed = userTeam.nilBudgetUsed;
        const offerAmount = 50000;

        const playerToOffer = { ...userTeam.roster[0], id: 'recruit-1', nilContractYearsRemaining: 0 };
        const action: GameAction = {
            type: 'MAKE_NIL_OFFER',
            payload: {
                playerId: playerToOffer.id,
                amount: offerAmount,
                years: 1,
                recruitPlayer: playerToOffer, // For MAKE_NIL_OFFER, payload needs to include the player/recruit details
                isAccepted: true
            }
        };
        state = gameReducer(state, action);

        const updatedUserTeam = state.allTeams.find(t => t.isUserTeam);
        expect(updatedUserTeam?.nilBudgetUsed).toBe(initialNilUsed + offerAmount);
        expect(updatedUserTeam?.nilBudget).toBe(initialNilBudget); // Budget itself should not change, only usage
        expect(updatedUserTeam?.roster.find(p => p.id === playerToOffer.id)?.nilContractAmount).toBe(offerAmount);
    });
});
