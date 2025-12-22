import { describe, it, expect } from 'vitest';
import { calculateBoardPressure, generateBoardExpectations } from './gameService';
import { Team, UserSeasonRecord, DraftPick } from '../types';

const makeFinances = (overrides: Partial<Team['finances']> = {}): Team['finances'] => ({
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
    ...overrides,
});

const makeTeam = (overrides: Partial<Team> = {}): Team =>
    ({
        name: 'Test U',
        conference: 'Test Conf',
        prestige: 75,
        recruitingPrestige: 75,
        roster: [{ id: 'p1', name: 'Player', year: 'Sr', position: 'PG', overall: 82, stats: {} as any, seasonStats: {} as any } as any],
        staff: { assistants: [], trainers: [], scouts: [] },
        record: { wins: 20, losses: 11 },
        sponsor: { name: 'Nike', tier: 'Elite' } as any,
        sponsorRevenue: { jersey: 0, shoe: 0, merch: 0, total: 0 } as any,
        sponsorContractYearsRemaining: 1,
        sponsorContractLength: 1,
        sponsorOffers: [],
        fanInterest: 70,
        prices: { ticketPrice: 25, jerseyPrice: 90, merchandisePrice: 30, concessionFoodPrice: 6, concessionDrinkPrice: 8, parkingPrice: 15 } as any,
        finances: makeFinances({ totalRevenue: 12000000, operationalExpenses: 8000000 }),
        wealth: { endowmentScore: 50, donationLevel: 50, boosterPool: 0, donorMomentum: 0 } as any,
        headCoach: { name: 'Coach', age: 45, almaMater: 'Test U', style: 'Balanced', reputation: 60, seasons: 1, careerWins: 0, careerLosses: 0, seasonWins: 0, seasonLosses: 0, startSeason: 1, careerStops: [] } as any,
        pipelineStates: [],
        concessions: { tier: 'Standard', alcoholPolicy: true, items: [] } as any,
        merchandising: { inventoryStrategy: 'JustInTime', jerseySales: {}, items: [] } as any,
        parking: { generalPrice: 10, vipPrice: 20, tailgateCulture: 50 } as any,
        state: 'Test',
        playbookFamiliarity: 50,
        initialProjectedRevenue: makeFinances({ totalRevenue: 12000000, operationalExpenses: 8000000 }),
        ...overrides,
    }) as Team;

describe('Board expectations & CPI', () => {
    it('generateBoardExpectations returns normalized weights and targets', () => {
        const team = makeTeam();
        const expectations = generateBoardExpectations(team);

        const weightSum = Object.values(expectations.weights).reduce((sum, v) => sum + v, 0);
        expect(weightSum).toBeGreaterThan(0.99);
        expect(weightSum).toBeLessThan(1.01);

        expect(expectations.targetWins).toBeGreaterThanOrEqual(5);
        expect(expectations.targetWins).toBeLessThanOrEqual(30);
        expect(expectations.targetAttendanceFillRate).toBeGreaterThanOrEqual(0.35);
        expect(expectations.targetAttendanceFillRate).toBeLessThanOrEqual(0.98);
        expect(expectations.targetDraftPicks).toBeGreaterThanOrEqual(0);
    });

    it('calculateBoardPressure produces components and a composite score', () => {
        const team = makeTeam({
            merchandising: { inventoryStrategy: 'JustInTime', jerseySales: { p1: 5000 }, items: [] } as any,
        });
        const baseline = generateBoardExpectations(team);
        const seasonRecord: UserSeasonRecord = {
            season: 10,
            teamName: team.name,
            wins: baseline.targetWins + 5,
            losses: 31 - (baseline.targetWins + 5),
            rank: 12,
            prestige: team.prestige,
            totalRevenue: 14000000,
            operationalExpenses: 8000000,
            projectedRevenue: 12000000,
            gameAttendance: [{ opponent: 'Foo', attendance: 9000, capacity: 10000, revenue: 0 }],
            tournamentResult: 'Sweet 16',
        };
        const draftResults: DraftPick[] = [
            { pick: 10, round: 1, player: { id: 'p1', name: 'Player', position: 'PG', height: 74, overall: 82 } as any, season: 10, originalTeam: team.name, nbaTeam: 'Test', source: 'NCAA', originDescription: '' },
        ];

        const { boardExpectations } = calculateBoardPressure(team, seasonRecord, draftResults, baseline, []);
        expect(boardExpectations.metrics?.components?.length).toBe(5);
        expect(boardExpectations.metrics?.compositeScore).toBeGreaterThanOrEqual(0);
        expect(boardExpectations.metrics?.compositeScore).toBeLessThanOrEqual(100);
        expect(['Safe', 'Warm', 'Hot', 'Fired']).toContain(boardExpectations.jobSecurityStatus);
    });
});

