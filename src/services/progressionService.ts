import { Player } from '../types';
import { randomBetween, clamp } from './gameService';

export type AttributeBucket = 'physicals' | 'technical' | 'mental' | 'durability';

export interface BucketGrowthProfile {
    baseGrowthRate: number;
    agePeakStart: number;
    agePeakEnd: number;
    declineStart: number;
    volatility: number;
}

export type DevelopmentArchetype = 
    | 'Late Bloomer'
    | 'Early Peak'
    | 'Two-Way Developer'
    | 'Offensive Specialist'
    | 'Defensive Anchor'
    | 'Athletic Marvel'
    | 'Skill Technician'
    | 'Injury-Prone Talent'
    | 'High-Variance Prospect'
    | 'Standard'; // Default

const ARCHETYPE_PROFILES: Record<DevelopmentArchetype, Record<AttributeBucket, BucketGrowthProfile>> = {
    'Standard': {
        physicals: { baseGrowthRate: 1.0, agePeakStart: 25, agePeakEnd: 28, declineStart: 29, volatility: 0.1 },
        technical: { baseGrowthRate: 1.0, agePeakStart: 26, agePeakEnd: 30, declineStart: 32, volatility: 0.1 },
        mental: { baseGrowthRate: 1.2, agePeakStart: 28, agePeakEnd: 34, declineStart: 35, volatility: 0.05 },
        durability: { baseGrowthRate: 0.5, agePeakStart: 22, agePeakEnd: 27, declineStart: 30, volatility: 0.2 },
    },
    'Late Bloomer': {
        physicals: { baseGrowthRate: 1.2, agePeakStart: 26, agePeakEnd: 29, declineStart: 30, volatility: 0.15 },
        technical: { baseGrowthRate: 1.3, agePeakStart: 27, agePeakEnd: 32, declineStart: 33, volatility: 0.1 },
        mental: { baseGrowthRate: 1.1, agePeakStart: 28, agePeakEnd: 35, declineStart: 36, volatility: 0.1 },
        durability: { baseGrowthRate: 1.0, agePeakStart: 24, agePeakEnd: 29, declineStart: 31, volatility: 0.1 },
    },
    'Early Peak': {
        physicals: { baseGrowthRate: 1.5, agePeakStart: 21, agePeakEnd: 25, declineStart: 27, volatility: 0.1 },
        technical: { baseGrowthRate: 0.8, agePeakStart: 22, agePeakEnd: 26, declineStart: 29, volatility: 0.1 },
        mental: { baseGrowthRate: 0.8, agePeakStart: 24, agePeakEnd: 28, declineStart: 30, volatility: 0.1 },
        durability: { baseGrowthRate: 0.5, agePeakStart: 20, agePeakEnd: 25, declineStart: 28, volatility: 0.2 },
    },
    // ... Implement others as needed, mapping back to Standard for brevity in this initial pass
    'Two-Way Developer': { /* ...similar to standard but balanced growth */ 
        physicals: { baseGrowthRate: 1.1, agePeakStart: 24, agePeakEnd: 28, declineStart: 30, volatility: 0.1 },
        technical: { baseGrowthRate: 1.1, agePeakStart: 25, agePeakEnd: 29, declineStart: 31, volatility: 0.1 },
        mental: { baseGrowthRate: 1.1, agePeakStart: 26, agePeakEnd: 32, declineStart: 34, volatility: 0.1 },
        durability: { baseGrowthRate: 1.0, agePeakStart: 23, agePeakEnd: 28, declineStart: 31, volatility: 0.1 },
    },
    'Offensive Specialist': { /* Technical focus */ 
        physicals: { baseGrowthRate: 0.9, agePeakStart: 24, agePeakEnd: 28, declineStart: 30, volatility: 0.1 },
        technical: { baseGrowthRate: 1.4, agePeakStart: 24, agePeakEnd: 30, declineStart: 32, volatility: 0.15 },
        mental: { baseGrowthRate: 1.0, agePeakStart: 26, agePeakEnd: 32, declineStart: 34, volatility: 0.1 },
        durability: { baseGrowthRate: 0.9, agePeakStart: 23, agePeakEnd: 28, declineStart: 30, volatility: 0.1 },
    },
    'Defensive Anchor': { /* Physical/Mental focus */ 
        physicals: { baseGrowthRate: 1.1, agePeakStart: 24, agePeakEnd: 28, declineStart: 30, volatility: 0.1 },
        technical: { baseGrowthRate: 0.8, agePeakStart: 25, agePeakEnd: 29, declineStart: 31, volatility: 0.1 },
        mental: { baseGrowthRate: 1.3, agePeakStart: 25, agePeakEnd: 32, declineStart: 34, volatility: 0.1 },
        durability: { baseGrowthRate: 1.1, agePeakStart: 23, agePeakEnd: 29, declineStart: 32, volatility: 0.1 },
    },
    'Athletic Marvel': { /* Physical focus */ 
        physicals: { baseGrowthRate: 1.6, agePeakStart: 22, agePeakEnd: 26, declineStart: 28, volatility: 0.2 },
        technical: { baseGrowthRate: 0.7, agePeakStart: 24, agePeakEnd: 28, declineStart: 30, volatility: 0.15 },
        mental: { baseGrowthRate: 0.8, agePeakStart: 25, agePeakEnd: 30, declineStart: 32, volatility: 0.1 },
        durability: { baseGrowthRate: 0.8, agePeakStart: 21, agePeakEnd: 26, declineStart: 29, volatility: 0.2 },
    },
    'Skill Technician': { /* Technical focus, low physical */ 
        physicals: { baseGrowthRate: 0.7, agePeakStart: 26, agePeakEnd: 30, declineStart: 32, volatility: 0.05 },
        technical: { baseGrowthRate: 1.5, agePeakStart: 24, agePeakEnd: 32, declineStart: 34, volatility: 0.1 },
        mental: { baseGrowthRate: 1.3, agePeakStart: 26, agePeakEnd: 34, declineStart: 36, volatility: 0.05 },
        durability: { baseGrowthRate: 1.0, agePeakStart: 24, agePeakEnd: 30, declineStart: 33, volatility: 0.1 },
    },
    'Injury-Prone Talent': { /* High growth, terrible durability */ 
        physicals: { baseGrowthRate: 1.3, agePeakStart: 23, agePeakEnd: 27, declineStart: 29, volatility: 0.3 },
        technical: { baseGrowthRate: 1.3, agePeakStart: 24, agePeakEnd: 28, declineStart: 30, volatility: 0.2 },
        mental: { baseGrowthRate: 1.0, agePeakStart: 25, agePeakEnd: 30, declineStart: 32, volatility: 0.1 },
        durability: { baseGrowthRate: -0.5, agePeakStart: 20, agePeakEnd: 24, declineStart: 25, volatility: 0.4 },
    },
    'High-Variance Prospect': { /* High volatility */ 
        physicals: { baseGrowthRate: 1.2, agePeakStart: 23, agePeakEnd: 28, declineStart: 30, volatility: 0.4 },
        technical: { baseGrowthRate: 1.2, agePeakStart: 24, agePeakEnd: 29, declineStart: 31, volatility: 0.4 },
        mental: { baseGrowthRate: 1.0, agePeakStart: 25, agePeakEnd: 30, declineStart: 32, volatility: 0.3 },
        durability: { baseGrowthRate: 1.0, agePeakStart: 22, agePeakEnd: 27, declineStart: 30, volatility: 0.3 },
    }
};

const BUCKET_MAP: Record<keyof Player['stats'], AttributeBucket> = {
    insideScoring: 'technical',
    outsideScoring: 'technical',
    playmaking: 'technical',
    perimeterDefense: 'physicals', // Simplified mapping
    insideDefense: 'physicals',
    rebounding: 'physicals',
    stamina: 'durability' // Or physicals
};

export const getArchetypeProfile = (archetype?: string): Record<AttributeBucket, BucketGrowthProfile> => {
    return ARCHETYPE_PROFILES[archetype as DevelopmentArchetype] || ARCHETYPE_PROFILES['Standard'];
};

export const calculateOverall = (stats: Player['stats']): number => {
    // Re-use existing weight logic from gameService if needed, or implement here.
    // For now, mirroring the weights seen in gameService:
    const weights: Record<keyof Player['stats'], number> = {
        insideScoring: 0.18,
        outsideScoring: 0.18,
        playmaking: 0.14,
        perimeterDefense: 0.14,
        insideDefense: 0.14,
        rebounding: 0.14,
        stamina: 0.08,
    };
    const score = (Object.keys(stats) as (keyof Player['stats'])[])
        .reduce((acc, key) => acc + stats[key] * (weights[key] || 0), 0);
    return Math.round(score);
};

export const applySeasonProgression = (player: Player): Player => {
    const age = player.age || 22;
    const archetype = (player.role as unknown as DevelopmentArchetype) || 'Standard'; // Using role as proxy for now if archetype not on Player
    const profile = getArchetypeProfile(archetype);
    
    // Minutes factor (NBA context)
    const minutes = player.nbaStats?.minutes || 0;
    const games = Math.max(1, player.nbaStats?.gamesPlayed || 1);
    const mpg = minutes / games;
    
    let usageFactor = 1.0;
    if (mpg < 10) usageFactor = 0.5; // Stagnation
    else if (mpg > 25) usageFactor = 1.2; // Optimal
    
    const newStats = { ...player.stats };
    
    (Object.keys(newStats) as (keyof Player['stats'])[]).forEach(stat => {
        const bucket = BUCKET_MAP[stat] || 'technical';
        const bucketProfile = profile[bucket];
        
        // Growth or Decline?
        const isDecline = age >= bucketProfile.declineStart;
        
        let change = 0;
        if (isDecline) {
            // Decline curve
            const yearsInDecline = age - bucketProfile.declineStart;
            change = -(0.5 + (yearsInDecline * 0.3) + (Math.random() * bucketProfile.volatility));
        } else {
            // Growth curve
            if (age >= bucketProfile.agePeakStart && age <= bucketProfile.agePeakEnd) {
                // Peak plateau - small random changes
                change = (Math.random() - 0.5) * 2; 
            } else {
                // Growing phase
                change = bucketProfile.baseGrowthRate * usageFactor + ((Math.random() - 0.5) * 2 * bucketProfile.volatility);
            }
        }
        
        // Apply change
        newStats[stat] = clamp(newStats[stat] + change, 25, 99);
    });

    const newOverall = calculateOverall(newStats);
    
    // Update potential: Potential should naturally decay towards overall as they age
    // or stay high if they are truly special.
    let newPotential = player.potential;
    if (age > 24) {
        // Potential collapses to current ability + variance
        newPotential = Math.max(newOverall, Math.min(newPotential, newOverall + (30 - age))); 
    }

    return {
        ...player,
        stats: newStats,
        overall: newOverall,
        potential: newPotential,
        startOfSeasonOverall: newOverall // Reset for next season view
    };
};
