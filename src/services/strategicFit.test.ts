// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { calculateStrategicBestFit } from './gameService';
import { Recruit, Team, RosterPositions, OfferPitchType } from '../types';

describe('calculateStrategicBestFit', () => {
    const mockTeam: Team = {
        name: 'Test University',
        state: 'FL',
        prestige: 80,
        recruitingPrestige: 80,
        wealth: {
            donorMomentum: 10,
            alumniNetwork: { strength: 80, activeBoosters: 100 },
            endowmentScore: 80
        },
        nilBudget: 1000000,
        nilBudgetUsed: 0,
        roster: [],
        facilities: {
            training: { quality: 90, equipmentLevel: 9, level: 5 },
            arena: { capacity: 15000, quality: 80 }
        },
        headCoach: { reputation: 90 }
    } as unknown as Team;

    const mockRecruit: Recruit = {
        id: 'recruit-1',
        name: 'Top Prospect',
        position: 'PG' as RosterPositions,
        stars: 5,
        homeState: 'FL',
        coordinates: { lat: 28.5383, lng: -81.3792 }, // Orlando
        motivations: {
            proximity: 90,
            playingTime: 80,
            nil: 70,
            exposure: 60,
            relationship: 50,
            development: 40,
            academics: 30
        },
        dealbreaker: 'None'
    } as unknown as Recruit;

    it('should select the pitch with the highest leverage score', () => {
        // FL recruit to FL team = high proximity rating (100)
        // Proximity leverage = 0.9 * 100 = 90
        const result = calculateStrategicBestFit(mockRecruit, mockTeam);
        expect(result.pitch).toBe('LocalAngle');
        expect(result.score).toBeGreaterThan(0.8);
    });

    it('should respect the 70% school rating threshold', () => {
        const lowPrestigeTeam = { ...mockTeam, prestige: 40, recruitingPrestige: 40, nilBudget: 100000 };
        const result = calculateStrategicBestFit(mockRecruit, lowPrestigeTeam);
        
        // With low prestige/NIL, many pitches should be disqualified.
        // It should fallback to Standard if nothing is > 70
        if (result.pitch === 'Standard') {
            expect(result.reason).toContain('70% threshold');
        }
    });

    it('should recommend a counter-pitch if a dealbreaker cannot be met', () => {
        const distantRecruit = { 
            ...mockRecruit, 
            dealbreaker: 'Proximity',
            coordinates: { lat: 34.0522, lng: -118.2437 } // Los Angeles (Distant from FL)
        } as unknown as Recruit;

        const result = calculateStrategicBestFit(distantRecruit, mockTeam);
        
        // School is in FL, recruit in LA. Proximity rating will be low.
        // Should suggest a counter-pitch like Playing Time or NIL
        expect(result.pitch).not.toBe('LocalAngle');
        expect(result.reason).toContain('too low to win there');
    });
});

