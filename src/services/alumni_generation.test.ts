// @ts-nocheck
import { generateHistoricalAlumni, recalculateAlumniInfluence, generateAlumni } from './alumniService';
import { initializeEconomy } from './gameService';
import { Team, AlumniRegistry, Player } from '../types';

// Mock Team
const mockTeam: Team = {
    name: 'Test University',
    prestige: 80,
    fanMorale: 80,
    // ... other required fields mocked minimally
    conference: 'Test Conf',
    recruitingPrestige: 80,
    roster: [],
    staff: { assistants: [], trainers: [], scouts: [] },
    record: { wins: 0, losses: 0 },
    sponsorRevenue: { jersey: 0, shoe: 0, merch: 0, total: 0 },
    sponsorContractYearsRemaining: 1,
    sponsorContractLength: 1,
    sponsorOffers: [],
    fanInterest: 80,
    prices: {} as any,
    finances: {} as any,
    wealth: {} as any,
    headCoach: {} as any,
    pipelineStates: [],
    concessions: { tier: 'Standard', alcoholPolicy: false, items: [] },
    merchandising: { inventoryStrategy: 'Conservative', jerseySales: {}, items: [] },
    parking: { generalPrice: 10, vipPrice: 20, tailgateCulture: 50 },
    sponsor: { name: 'Nike', tier: 'Elite', type: 'Apparel' }
};

describe('Alumni Generation', () => {
    test('generateHistoricalAlumni creates registry with activeInfluence', () => {
        const registry = generateHistoricalAlumni(mockTeam);
        expect(registry).toBeDefined();
        expect(registry.allAlumni.length).toBeGreaterThan(0);
        expect(registry.activeInfluence).toBeDefined();
        expect(registry.activeInfluence.scoutingEfficiency).toBeGreaterThanOrEqual(0);
    });

    test('recalculateAlumniInfluence adds activeInfluence to outdated registry', () => {
        // Create outdated registry (manually)
        const outdatedRegistry: any = {
            summaryStats: { countsPerProfession: {}, donationMomentum: 0, notableAlumni: [] },
            allAlumni: []
        };
        
        // Add some alumni
        const player1 = { id: 'p1', name: 'Tech Guy', position: 'PG', draftProjection: 'Undrafted' } as Player;
        const alum1 = generateAlumni(player1, mockTeam, 2020);
        alum1.archetype = 'Tech'; // Force archetype
        outdatedRegistry.allAlumni.push(alum1);

        const updatedRegistry = recalculateAlumniInfluence(outdatedRegistry);
        
        expect(updatedRegistry.activeInfluence).toBeDefined();
        expect(updatedRegistry.activeInfluence.scoutingEfficiency).toBeGreaterThan(0); // Tech gives scouting efficiency
    });

    test('initializeEconomy migrates team with missing alumni', () => {
        const teamWithoutAlumni = { ...mockTeam, alumniRegistry: undefined };
        const initializedTeam = initializeEconomy(teamWithoutAlumni);
        
        expect(initializedTeam.alumniRegistry).toBeDefined();
        expect(initializedTeam.alumniRegistry?.activeInfluence).toBeDefined();
    });

    test('initializeEconomy migrates team with outdated alumni', () => {
        const outdatedRegistry: any = {
            summaryStats: { countsPerProfession: {}, donationMomentum: 0, notableAlumni: [] },
            allAlumni: [],
            // Missing activeInfluence
        };
        const teamWithOutdatedAlumni = { ...mockTeam, alumniRegistry: outdatedRegistry };
        const initializedTeam = initializeEconomy(teamWithOutdatedAlumni);
        
        expect(initializedTeam.alumniRegistry).toBeDefined();
        expect(initializedTeam.alumniRegistry?.activeInfluence).toBeDefined();
    });
});

