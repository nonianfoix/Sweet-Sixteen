// Probabilities of generating a "Titan" (Billionaire) alumnus
// Based on real-world billionaire alumni counts
// Factors: 
// High: ~120+ billionaires (Harvard, Stanford, Penn)
// Medium: ~30-50 billionaires (Yale, Columbia, Cornell, MIT, USC)
// Low: ~10-20 billionaires (Michigan, UCLA, Texas, etc)

export const BILLIONAIRE_ALMA_MATERS: Record<string, number> = {
    // TIER 1: The Billionaire Factories (Massive Networks - Nvidia, Palantir, etc)
    "Harvard": 0.025,  // 2.5% chance per gen
    "Stanford": 0.025,
    "Penn": 0.025, 
    
    // TIER 2: Elite Producers
    "Columbia": 0.015,
    "Yale": 0.015,
    "MIT": 0.015,
    "Cornell": 0.015,
    "USC": 0.015,
    "Princeton": 0.015,

    // TIER 3: Notable Producers
    "Michigan": 0.005,
    "Texas": 0.005,
    "California": 0.005,
    "UCLA": 0.005,
    "UVA": 0.005,
    "Notre Dame": 0.005,
    "Vanderbilt": 0.005,
    "Duke": 0.005,
    "Northwestern": 0.005,
    "SMU": 0.005,
    "Georgia Tech": 0.005
};

// Earnings range for Titans: $500M - $5B
export const TITAN_EARNINGS_RANGE = { min: 500000000, max: 5000000000 };
