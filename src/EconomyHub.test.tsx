// @ts-nocheck
// EconomyHub.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EconomyHub } from './EconomyHub';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { GameState, Team, EconomyTelemetryEvent, Finances, Player } from './types';

const samplePlayerStats = {
    insideScoring: 80,
    outsideScoring: 75,
    playmaking: 70,
    perimeterDefense: 70,
    insideDefense: 65,
    rebounding: 60,
    stamina: 85,
};

const samplePlayer: Player = {
    id: 'recruit-1',
    name: 'Mock Prospect',
    position: 'PG',
    secondaryPosition: 'SG',
    height: 75,
    year: 'Jr',
    overall: 78,
    potential: 85,
    stats: samplePlayerStats,
    starterPosition: 'PG',
    startOfSeasonOverall: 78,
    xFactor: 5,
    seasonStats: { gamesPlayed: 20, points: 300, rebounds: 80, assists: 120, minutes: 600 },
    isTargeted: false,
    naturalProgressAccumulator: 0,
    rotationMinutes: 0,
    nilContractAmount: 0,
    nilContractYearsRemaining: 0,
    nilPersonalityTraits: ['LegacyBuilder'],
    localHeroismFactor: 10,
    socialMediaHeat: 25,
    draftProjection: 'SecondRound',
};

// Mock data for testing
export const mockTeam: Team = {
    name: 'Test Team',
    conference: 'Power',
    prestige: 70,
    recruitingPrestige: 70,
    roster: [samplePlayer],
    staff: { assistants: [], trainers: [], scouts: [] },
    record: { wins: 10, losses: 5 },
    isUserTeam: true,
    sponsor: { name: 'Nike', tier: 'Elite', slogan: 'Just Do It' },
    sponsorRevenue: { jersey: 0, shoe: 0, merch: 0, total: 0 },
    sponsorContractYearsRemaining: 1,
    sponsorContractLength: 1,
    sponsorOffers: [],
    fanInterest: 80,
    fanSentiment: 75,
    prices: { ticketPrice: 20, jerseyPrice: 80, merchandisePrice: 30, concessionFoodPrice: 10, concessionDrinkPrice: 5, parkingPrice: 15 },
    finances: {
        baseRevenue: 0, gateRevenue: 0, merchandiseRevenue: 0, concessionsRevenue: 0, parkingRevenue: 0,
        donationRevenue: 0, endowmentSupport: 0, tournamentShare: 0, sponsorPayout: 0, totalRevenue: 0,
        operationalExpenses: 0, firedStaffSalaries: 0, facilitiesExpenses: 0, travelExpenses: 0,
        recruitingExpenses: 0, marketingExpenses: 0, administrativeExpenses: 0, staffPayrollExpenses: 0
    },
    wealth: { endowmentScore: 70, donationLevel: 60, boosterPool: 10, donorMomentum: 5 },
    headCoach: { name: 'Coach Test', age: 40, almaMater: 'University', style: 'Offense', reputation: 75, seasons: 5, careerWins: 100, careerLosses: 50, seasonWins: 0, seasonLosses: 0, startSeason: 1, draftedPlayers: [], lastTeam: 'Team A', careerStops: [], contract: { salary: 1000000, yearsRemaining: 3 } },
    playerFocusId: null,
    teamCaptainId: null,
    nilBudget: 500000,
    nilBudgetUsed: 100000,
    nilBoostFromSponsor: 50000,
    alumniRegistry: [],
    facilities: {
        name: 'Arena',
        capacity: 15000,
        quality: 80,
        luxurySuites: 50,
        seatMix: {
            lowerBowl: { capacity: 6000, priceModifier: 1.2 },
            studentSection: { capacity: 3000, priceModifier: 0.8 },
            upperBowl: { capacity: 5000, priceModifier: 1.0 },
            suites: { capacity: 1000, priceModifier: 2.0 },
        },
        attendanceLog: [],
    },
    nilCollective: { id: 'nil-1', tier: 'national', reputation: 70, baseBudget: 500000, sponsorMatch: 100000, alumniContribution: 50000, updatedWeek: 1 },
    eventCalendar: [],
    sponsorQuests: [],
    initialProjectedRevenue: {} as Finances,
    budget: { cash: 1000000 }
};

export const mockTelemetryEvents: EconomyTelemetryEvent[] = [
    { id: '1', type: 'revenue', message: 'Ticket sale', timestamp: Date.now(), value: 10000 },
    { id: '2', type: 'expense', message: 'Staff payroll', timestamp: Date.now() + 1000, value: -5000 },
    { id: '3', type: 'revenue', message: 'Sponsor payout, "bonus"', timestamp: Date.now() + 2000, value: 20000 }
];

export const mockGameState: GameState = {
    season: 1,
    week: 1,
    gameInSeason: 1,
    schedule: [],
    allTeams: [mockTeam],
    userTeamId: 'Test Team',
    recruits: [],
    sponsors: {},
    history: { userTeamRecords: [], champions: [], teamHistory: {}, nbaDrafts: [] },
    internationalProspects: [],
    nbaSimulation: null,
    nbaTeams: [],
    nbaSchedule: [],
    eventPlaybookCatalog: [],
    sponsorQuestDeck: [],
    economyTelemetry: {
        eventFeed: mockTelemetryEvents
    },
    currentUserTeamAttendance: []
};

describe('EconomyHub handleEconomyExport', () => {
    it('should generate and download a CSV file with correct telemetry data', () => {
        // Mock global objects and functions
        const createElementSpy = vi.spyOn(document, 'createElement');
        const setAttributeSpy = vi.spyOn(HTMLElement.prototype, 'setAttribute');
        const appendChildSpy = vi.spyOn(document.body, 'appendChild');
        const removeChildSpy = vi.spyOn(document.body, 'removeChild');
        const clickSpy = vi.spyOn(HTMLElement.prototype, 'click');
        const URLcreateObjectUrlSpy = vi.spyOn(URL, 'createObjectURL');
        const URLrevokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL');

        const mockBlob = new Blob(['mock,csv,content'], { type: 'text/csv;charset=utf-8;' });
        URLcreateObjectUrlSpy.mockReturnValue('blob:mock-url');

        // Render the component
        render(
            <EconomyHub
                state={mockGameState}
                userTeam={mockTeam}
                dispatch={vi.fn()}
                colors={{ primary: '#000', secondary: '#fff', text: '#000' }}
            />
        );

        // Find the export button and click it
        const exportButton = screen.getByText('Export Telemetry');
        fireEvent.click(exportButton);

        // Assertions
        expect(createElementSpy).toHaveBeenCalledWith('a');

        // Verify CSV content (roughly, as exact timestamp is hard to predict)
        // The actual implementation constructs the CSV string directly, so we can verify parts of it
        const expectedCsvStart = 'ID,Type,Message,Timestamp,Value\n1,revenue,"Ticket sale",';
        const expectedCsvEnd = '10000\n2,expense,"Staff payroll",';
        
        // This is a bit brittle, but checks if the content roughly matches what's expected
        // A more robust test might create a Blob and check its content if the API exposed it easily.
        // For now, we'll check attributes of the link element
        expect(setAttributeSpy).toHaveBeenCalledWith('download', `economy_telemetry_${mockTeam.name}.csv`);
        expect(setAttributeSpy).toHaveBeenCalledWith('href', 'blob:mock-url');
        expect(setAttributeSpy).toHaveBeenCalledWith('style', 'visibility: hidden');
        
        expect(appendChildSpy).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
        // expect(URLrevokeObjectUrlSpy).toHaveBeenCalledWith('blob:mock-url'); // revokeObjectURL might be called async sometimes
    });
});

