// @ts-nocheck
import { processWeeklyFinances } from './gameService';
import { Team, GameResult } from '../types';

// Mock Team Data
const mockTeam: Team = {
    id: 'test-team',
    name: 'Test University',
    budget: { cash: 1000000, allocations: { marketing: 0, recruiting: 0, facilities: 0, staffDevelopment: 0 } },
    finances: {
        revenue: 0, expenses: 0, profit: 0,
        ticketRevenue: 0, concessionsRevenue: 0, merchandiseRevenue: 0, parkingRevenue: 0,
        tvRevenue: 0, licensingRevenue: 0, donorRevenue: 0, tournamentRevenue: 0,
        coachSalary: 0, staffSalary: 0, facilityMaintenance: 0, recruitingExpenses: 0,
        marketingExpenses: 0, travelExpenses: 0, scholarshipExpenses: 0, operationalExpenses: 0,
        loanPayments: 0, nilCollectiveAllocation: 0
    },
    financialHistory: [],
    concessions: {
        tier: 'Standard',
        pricing: { priceBands: { base: 1.2, premium: 1.5 }, bundleDiscount: 0.1, dynamicPricing: { weekendMultiplier: 1.1, weekdayMultiplier: 0.9 } },
        alcoholPolicy: true,
        items: []
    },
    merchandising: {
        tier: 'Standard',
        pricing: { apparelMultiplier: 1.1, authenticMultiplier: 1.2, flashSaleActive: false, flashSaleDepth: 0.15, playerSegmentBoost: 0.05 },
        inventoryStrategy: 'Conservative',
        topSellers: []
    },
    parking: {
        generalPrice: 25,
        vipPrice: 60,
        tailgateCulture: 50,
        revenueSettings: { surgeMultiplier: 1.1, earlyAccessPremium: 15, amenityAddonPrice: 3 }
    },
    roster: [],
    facilities: {
        arena: { 
            name: 'Arena', 
            capacity: 10000, 
            quality: 80, 
            level: 1, 
            maintenanceCost: 1000, 
            luxurySuites: 10,
            attendanceLog: [
                { week: 1, opponent: 'Rival State', attendance: 10000, revenue: 500000, segmentData: {} as any }
            ]
        },
        training: { name: 'Gym', quality: 80, level: 1, maintenanceCost: 500, equipmentLevel: 1 },
        scouting: { name: 'Room', quality: 80, level: 1, maintenanceCost: 200, networkReach: 1 },
        coaching: { name: 'Office', quality: 80, level: 1, maintenanceCost: 100, technologyLevel: 1 }
    }
} as unknown as Team;

// Mock Game Result
const mockGame: GameResult = {
    id: 'game-1',
    homeTeam: 'Test University',
    awayTeam: 'Rival State',
    homeScore: 80,
    awayScore: 75,
    played: true,
    attendance: 10000,
    week: 1
} as any;

describe('Economy Logic', () => {
    test('processWeeklyFinances calculates concessions, merch, and parking revenue', () => {
        const updatedTeam = processWeeklyFinances(mockTeam, 1, [mockGame]);

        console.log('Concessions Revenue:', updatedTeam.finances.concessionsRevenue);
        console.log('Merch Revenue:', updatedTeam.finances.merchandiseRevenue);
        console.log('Parking Revenue:', updatedTeam.finances.parkingRevenue);

        expect(updatedTeam.finances.concessionsRevenue).toBeGreaterThan(0);
        expect(updatedTeam.finances.merchandiseRevenue).toBeGreaterThan(0);
        expect(updatedTeam.finances.parkingRevenue).toBeGreaterThan(0);
        
        // Check Cash Update
        expect(updatedTeam.budget.cash).not.toBe(1000000);
    });
});

