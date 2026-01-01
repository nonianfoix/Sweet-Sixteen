// @ts-nocheck

import { describe, it, expect } from 'vitest';
import { simulateGame, runSimulationForWeek, createPlayer } from './gameService';
import { Team, GameState, GameStatus, RosterPositions } from '../types';

// Mock Data Helpers
const createMockPlayer = (id: string, position: RosterPositions) => ({
    ...createPlayer('Sr', position),
    id,
    rotationMinutes: 30, // Ensure they play
});

const createMockTeam = (name: string, idPrefix: string): Team => ({
    name,
    conference: 'Test Conf',
    prestige: 80,
    recruitingPrestige: 80,
    roster: [
        createMockPlayer(`${idPrefix}-p1`, 'PG'),
        createMockPlayer(`${idPrefix}-p2`, 'SG'),
        createMockPlayer(`${idPrefix}-p3`, 'SF'),
        createMockPlayer(`${idPrefix}-p4`, 'PF'),
        createMockPlayer(`${idPrefix}-p5`, 'C'),
        createMockPlayer(`${idPrefix}-p6`, 'PG'), // Bench
        createMockPlayer(`${idPrefix}-p7`, 'C'),  // Bench
    ],
    staff: { assistants: [], trainers: [], scouts: [] },
    record: { wins: 0, losses: 0 },
    sponsor: { name: 'Nike', tier: 'Elite' },
    sponsorRevenue: { jersey: 0, shoe: 0, merch: 0, total: 0 },
    sponsorContractYearsRemaining: 1,
    sponsorContractLength: 1,
    sponsorOffers: [],
    fanInterest: 80,
    prices: { ticketPrice: 10, jerseyPrice: 50, merchandisePrice: 20, concessionFoodPrice: 5, concessionDrinkPrice: 5, parkingPrice: 10 },
    finances: {
        baseRevenue: 0, gateRevenue: 0, merchandiseRevenue: 0, concessionsRevenue: 0, parkingRevenue: 0, donationRevenue: 0, endowmentSupport: 0, tournamentShare: 0, sponsorPayout: 0, totalRevenue: 0,
        operationalExpenses: 0, firedStaffSalaries: 0, facilitiesExpenses: 0, travelExpenses: 0, recruitingExpenses: 0, marketingExpenses: 0, administrativeExpenses: 0, staffPayrollExpenses: 0
    },
    wealth: { endowmentScore: 0, donationLevel: 0, boosterPool: 0, donorMomentum: 0 },
    headCoach: {
        name: 'Coach', age: 50, almaMater: 'Test', style: 'Offense', reputation: 80, seasons: 1, careerWins: 0, careerLosses: 0, seasonWins: 0, seasonLosses: 0, startSeason: 1, careerStops: []
    },
    pipelineStates: [],
    playbookFamiliarity: 50,
    state: 'Test State',
    concessions: { tier: 'Standard', alcoholPolicy: false, items: [] },
    merchandising: { inventoryStrategy: 'Conservative', jerseySales: {}, items: [] },
    parking: { generalPrice: 10, vipPrice: 20, tailgateCulture: 0 },
});

describe('Game Simulation Logic', () => {
    it('should produce realistic scores (46-128)', () => {
        const homeTeam = createMockTeam('Home', 'home');
        const awayTeam = createMockTeam('Away', 'away');
        
        // Run multiple simulations to check range
        for (let i = 0; i < 20; i++) {
            const result = simulateGame(homeTeam, awayTeam, 'test-game');
            expect(result.homeScore).toBeGreaterThanOrEqual(40);
            expect(result.homeScore).toBeLessThanOrEqual(128);
            expect(result.awayScore).toBeGreaterThanOrEqual(40);
            expect(result.awayScore).toBeLessThanOrEqual(128);
        }
    });

    it('should correctly update win/loss records', () => {
        const homeTeam = createMockTeam('Home', 'home');
        const awayTeam = createMockTeam('Away', 'away');
        
        const mockState: GameState = {
            allTeams: [homeTeam, awayTeam],
            schedule: [[{ homeTeam: 'Home', awayTeam: 'Away', homeScore: 0, awayScore: 0, played: false }]],
            recruits: [],
            sponsors: {},
            initialHistory: { userTeamRecords: [], champions: [], teamHistory: {}, nbaDrafts: [] },
            internationalProspects: [],
            nbaSimulation: { season: 1, teams: [], draftOrder: [], champion: '' },
            nbaTeams: [],
            nbaSchedule: [],
            nbaFreeAgents: [],
            eventPlaybookCatalog: [],
            sponsorQuestDeck: [],
            season: 1,
            gameInSeason: 1,
            version: 6,
            status: GameStatus.IDLE,
            userTeam: homeTeam, // Set a user team to avoid crash
            contactsMadeThisWeek: 0,
            trainingPointsUsedThisWeek: 0,
            lastSimResults: [],
            seasonEndSummary: [],
            signingDaySummary: [],
            draftResults: [],
            signingPeriodDay: 0,
            currentNBASimulation: { season: 1, teams: [], draftOrder: [], champion: '' },
            rosterRolledOver: false,
            offSeasonAdvanced: false,
            mockDraftProjections: {},
            mockDraftProjectionDiffs: {},
            trainingFocuses: { pg: null, sg_sf: null, pf_c: null },
            trainingSummary: [],
            rotationPreference: 'balanced',
            autoTrainingEnabled: false,
            autoTrainingLog: [],
            tournament: null,
            retiredCoaches: [],
            gameLogs: [],
            selectedGameLog: null,
            postSeasonResolved: false,
            currentUserTeamAttendance: [],
            economyTelemetry: { attendanceDeltas: [], nilSpendEfficiency: [], completedQuests: [], eventFeed: [] },
            toastMessage: null,
            seasonRecapData: null,
            coach: null,
            jobOffers: null,
            pendingJobOffer: null,
        };

        const result = runSimulationForWeek(mockState, 1, [homeTeam, awayTeam], [], undefined, undefined, []);
        
        const updatedHome = result.updatedAllTeams.find(t => t.name === 'Home');
        const updatedAway = result.updatedAllTeams.find(t => t.name === 'Away');

        expect(updatedHome).toBeDefined();
        expect(updatedAway).toBeDefined();

        const totalGames = updatedHome!.record.wins + updatedHome!.record.losses;
        expect(totalGames).toBe(1);
        
        const totalAwayGames = updatedAway!.record.wins + updatedAway!.record.losses;
        expect(totalAwayGames).toBe(1);

        // One should win, one should lose
        if (updatedHome!.record.wins === 1) {
            expect(updatedHome!.record.losses).toBe(0);
            expect(updatedAway!.record.wins).toBe(0);
            expect(updatedAway!.record.losses).toBe(1);
        } else {
            expect(updatedHome!.record.losses).toBe(1);
            expect(updatedAway!.record.wins).toBe(1);
            expect(updatedAway!.record.losses).toBe(0);
        }
    });
});

