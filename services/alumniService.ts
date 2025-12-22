import { AlumniProfile, AlumniRegistry, Player, Team, GameState, AlumniArchetype, DonorDilemma, EquityPool } from '../types';
import { FIRST_NAMES, LAST_NAMES, ACTIVE_NBA_PLAYERS_DATA, FEMALE_FIRST_NAMES } from '../constants';
import { REAL_NBA_PLAYERS } from '../data/realNbaPlayers';

const randomBetween = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const PROFESSIONS = ['Business', 'Finance', 'Tech', 'Medicine', 'Law', 'Coaching', 'Media', 'Entrepreneur', 'Education', 'Public Service'];

const generateProfession = (prestige: number): string => {
    const roll = Math.random();
    if (prestige > 80) {
        if (roll < 0.3) return 'Finance';
        if (roll < 0.5) return 'Tech';
        if (roll < 0.7) return 'Business';
        return pickRandom(PROFESSIONS);
    }
    return pickRandom(PROFESSIONS);
};

const determineArchetype = (sentiment: number, wealth: number, profession: string, proStatus: string): AlumniArchetype => {
    if (proStatus === 'drafted' || proStatus === 'pro_success') return 'Local'; // Local Legends
    if (profession === 'Tech') return 'Tech';
    if (profession === 'Finance' || profession === 'Business') return 'Finance';
    if (profession === 'Public Service' || profession === 'Law') return 'Political';
    
    // Fallback based on wealth/sentiment
    if (wealth > 80) return 'Finance';
    if (sentiment > 80) return 'Local';
    return 'Local'; // Default to Local (Supporter equivalent)
};

const DILEMMA_TEMPLATES: {
    title: string;
    description: string;
    archetype: AlumniArchetype;
    options: DonorDilemma['options'];
}[] = [
    {
        title: "Legacy Admission",
        description: "A prominent 'Finance' donor wants their nephew to walk on. The kid is 5'7\" and can't shoot.",
        archetype: 'Finance',
        options: [
            { 
                label: "Accept the Favor", 
                effectDescription: "+$500k Budget, -5 Chemistry", 
                consequences: { budget: 500000, chemistry: -5, alumniSentiment: 5 } 
            },
            { 
                label: "Respectfully Decline", 
                effectDescription: "-$100k Budget, +5 Coach Integrity", 
                consequences: { budget: -100000, integrity: 5, alumniSentiment: -5 } 
            }
        ]
    },
    {
        title: "Old Guard's Advice",
        description: "A group of former players ('Local' legends) insist you bench a star transfer who 'doesn't get the culture'.",
        archetype: 'Local',
        options: [
            { 
                label: "Bench the Transfer", 
                effectDescription: "+Alumni Sentiment, -Team Talent Utilization", 
                consequences: { alumniSentiment: 8, chemistry: -3 } 
            },
            { 
                label: "Play the Best Players", 
                effectDescription: "-Alumni Sentiment, +Win Probability", 
                consequences: { alumniSentiment: -5, chemistry: 2 } 
            }
        ]
    },
    {
        title: "Tech Innovation Lab",
        description: "A 'Tech' mogul offers to fund a new Analytics center, but demands you fire your favorite 'old school' assistant.",
        archetype: 'Tech',
        options: [
            { 
                label: "Accept the Gift", 
                effectDescription: "+Scouting Efficiency, -Staff Loyalty", 
                consequences: { staffLoyalty: -10, alumniSentiment: 10 } 
            },
            { 
                label: "Decline", 
                effectDescription: "Status Quo", 
                consequences: { alumniSentiment: -2 } 
            }
        ]
    },
    {
        title: "Political Pressure",
        description: "A 'Political' donor hints that facility permits will be approved faster if you schedule a game in their home district.",
        archetype: 'Political',
        options: [
            { 
                label: "Schedule the Game", 
                effectDescription: "+Facility Speed, +Travel Fatigue", 
                consequences: { facilitySpeed: 10, alumniSentiment: 5 } 
            },
            { 
                label: "Stay Home", 
                effectDescription: "-Facility Speed", 
                consequences: { facilitySpeed: -5, alumniSentiment: -2 } 
            }
        ]
    }
];

export const generateDilemma = (team: Team): DonorDilemma => {
    const template = pickRandom(DILEMMA_TEMPLATES);
    return {
        ...template,
        id: `dilemma-${Date.now()}-${randomBetween(100,999)}`
    };
};

export const processAlumniWeek = (registry: AlumniRegistry, teamRecord: Team['record']): AlumniRegistry => {
    let newRegistry = { ...registry };
    
    // 1. Weekly Sentiment Decay/Growth based on recent performance (simplified for now)
    // In a real loop, we'd check if they won this week, but here we simulate Drift
    const sentimentDrift = randomBetween(-1, 1);
    
    // 2. Process Equity Pools
    if (!newRegistry.equityPools) {
        newRegistry.equityPools = [
            { id: 'momentum', name: 'Momentum Pool', balance: 0, target: 1000000, status: 'active', payoutType: 'cash' },
            { id: 'endowment', name: 'Endowment Match', balance: 0, target: 5000000, status: 'active', payoutType: 'interest' },
            { id: 'moonshot', name: 'Championship Bounty', balance: 0, target: 10000000, status: 'locked', payoutType: 'cash' },
        ];
    }
    
    newRegistry.equityPools = newRegistry.equityPools.map(pool => {
        if (pool.status === 'active') {
             // Growth dependent on sentiment
             const growthRate = (registry.summaryStats.donationMomentum / 1000) + 0.001;
             const growth = Math.floor(pool.balance * growthRate) + (registry.summaryStats.donationMomentum * 10);
             return { ...pool, balance: pool.balance + Math.max(0, growth) };
        }
        return pool;
    });

    // 3. Random Dilemma Trigger (Low chance)
    if (!newRegistry.activeDilemma && Math.random() < 0.02) { // 2% chance per week
       newRegistry.activeDilemma = generateDilemma({ ...{} as Team, record: teamRecord }); // Hacky partial team
    }

    return newRegistry;
};

export const generateAlumni = (player: Player, team: Team, graduationSeason: number, forceProStatus?: string, forceEarnings?: number): AlumniProfile => {
    const sentiment = team.fanMorale ?? 50; 
    const prestigeAtGrad = team.prestige;
    
    let proStatus = player.draftProjection === 'Lottery' || player.draftProjection === 'FirstRound' ? 'drafted' :
                      player.draftProjection === 'SecondRound' ? 'overseas' : 'none';

    if (forceProStatus) {
        proStatus = forceProStatus;
    }
    
    let careerEarnings = 0;
    if (forceEarnings) {
        careerEarnings = forceEarnings;
    } else {
        if (proStatus === 'drafted') careerEarnings = randomBetween(5000000, 100000000);
        else if (proStatus === 'overseas') careerEarnings = randomBetween(200000, 2000000);
        else careerEarnings = randomBetween(50000, 500000); 
    }

    const profession = proStatus !== 'none' ? 'Pro Athlete' : generateProfession(prestigeAtGrad);
    const wealthScore = Math.min(100, Math.round((careerEarnings / 1000000) * 10) + randomBetween(0, 20));
    
    const archetype = determineArchetype(sentiment, wealthScore, profession, proStatus);
    const donationTier = wealthScore > 80 ? 'high' : wealthScore > 40 ? 'medium' : wealthScore > 10 ? 'low' : 'none';

    return {
        id: player.id,
        name: player.name,
        graduationSeason,
        profession,
        prestigeAtGrad,
        achievements: [], 
        proStatus: proStatus as any,
        donationTier,
        sentiment,
        archetype,
        careerEarnings,
        position: player.position
    };
};

export const updateAlumniRegistry = (registry: AlumniRegistry | undefined, newAlumni: AlumniProfile): AlumniRegistry => {
    const existing = registry || { 
        summaryStats: { countsPerProfession: {}, donationMomentum: 0, notableAlumni: [] }, 
        allAlumni: [],
        activeInfluence: {
            recruitingBonus: {},
            mediaProtection: 0,
            facilitySpeed: 0,
            scoutingEfficiency: 0,
            endowmentYield: 0,
            academicPrestigeBonus: 0,
            jobSecurityBonus: 0
        },
        equityPools: []
    };
    
    const allAlumni = [...existing.allAlumni, newAlumni];
    
    // Update Stats
    const countsPerProfession = { ...existing.summaryStats.countsPerProfession };
    countsPerProfession[newAlumni.profession] = (countsPerProfession[newAlumni.profession] || 0) + 1;

    let donationMomentum = existing.summaryStats.donationMomentum;
    if (newAlumni.donationTier === 'high') donationMomentum += 5;
    else if (newAlumni.donationTier === 'medium') donationMomentum += 2;
    else if (newAlumni.donationTier === 'low') donationMomentum += 0.5;

    const notableAlumni = [...existing.summaryStats.notableAlumni];
    if (newAlumni.archetype === 'Local' && newAlumni.proStatus === 'drafted') {
        notableAlumni.push(newAlumni.name);
    }

    // Recalculate Influence
    const activeInfluence = { ...existing.activeInfluence };
    if (newAlumni.archetype === 'Tech') {
        activeInfluence.scoutingEfficiency = Math.min(100, activeInfluence.scoutingEfficiency + 1);
    } else if (newAlumni.archetype === 'Finance') {
        activeInfluence.endowmentYield = Math.min(100, activeInfluence.endowmentYield + 1);
    } else if (newAlumni.archetype === 'Political') {
        activeInfluence.facilitySpeed = Math.min(100, activeInfluence.facilitySpeed + 1);
        // Add recruiting bonus for random state? Or home state?
        // For simplicity, let's say Political alumni boost their home state (if we had it) or just a random pipeline state
    } else if (newAlumni.archetype === 'Local') {
        activeInfluence.mediaProtection = Math.min(100, activeInfluence.mediaProtection + 1);
    }

    // NBA Alumni Bonus (Wealth & Fame)
    // NBA players count as "Local" (Media) by default, but we add extra bonuses here
    if (newAlumni.proStatus === 'drafted' || newAlumni.proStatus === 'pro_success' || newAlumni.proStatus === 'retired_pro') {
        // Wealth -> Finance Boost
        activeInfluence.endowmentYield = Math.min(100, activeInfluence.endowmentYield + 2);
        // Fame -> Extra Media Boost
        activeInfluence.mediaProtection = Math.min(100, activeInfluence.mediaProtection + 2);
    }
    
    // Calculate new bonuses
    // Academic Prestige (Finance + Tech)
    const financeCount = countsPerProfession['Finance'] || 0;
    const techCount = countsPerProfession['Tech'] || 0;
    activeInfluence.academicPrestigeBonus = Math.min(20, Math.floor((financeCount + techCount) / 5));

    // Job Security (Local + Political)
    const localCount = countsPerProfession['Local'] || 0; // Likely undefined in simple map, need to track archetype counts better
    // Simplified: Use notable alumni count as proxy for Local power
    activeInfluence.jobSecurityBonus = Math.min(15, notableAlumni.length);

    return {
        summaryStats: {
            countsPerProfession,
            donationMomentum,
            notableAlumni
        },
        allAlumni,
        activeInfluence,
        equityPools: existing.equityPools || []
    };
};

export const generateHistoricalAlumni = (team: Team): AlumniRegistry => {
    const activeNbaData = ACTIVE_NBA_PLAYERS_DATA[team.name];
    const activeNbaCount = activeNbaData ? activeNbaData.activeCount : 0;
    const totalNbaEarnings = activeNbaData ? activeNbaData.totalEarnings : 0;

    // Base count of alumni (non-NBA)
    const baseCount = Math.round(team.prestige * 0.5) + 20; 
    const alumni: AlumniProfile[] = [];
    
    // Generate Active NBA Alumni (Real World Data)
    const realNbaPlayers = REAL_NBA_PLAYERS[team.name];
    if (realNbaPlayers && realNbaPlayers.length > 0) {
        realNbaPlayers.forEach((realPlayer, index) => {
            // Parse height "6-9" -> inches
            const [feet, inches] = realPlayer.height.split('-').map(Number);
            const heightInches = (feet * 12) + (inches || 0);

            // Estimate grad season based on YOS. Current year 2024.
            // If YOS is 5, they started in 2019. Graduated 2019 or 2018.
            // Let's say grad season = 2024 - YOS.
            // But game starts at season 1 (2024). So grad season should be negative or relative to start.
            // In the mock logic: const gradSeason = -1 * randomBetween(1, 15);
            // If YOS is 1, grad season is -1. If YOS is 10, grad season is -10.
            const gradSeason = -1 * (realPlayer.yos || 1);

            // Normalize position
            let validPos = 'PG';
            const p = realPlayer.position;
            if (p === 'PG' || p === 'SG' || p === 'SF' || p === 'C') validPos = p;
            else if (p === 'G') validPos = 'SG';
            else if (p === 'F') validPos = 'SF';
            else if (p === 'GF') validPos = 'SG';
            else if (p === 'FC' || p === 'C-F') validPos = 'PF';

            const mockPlayer: Player = {
                id: `nba-${realPlayer.name.replace(/\s+/g, '-').toLowerCase()}`,
                name: realPlayer.name,
                position: validPos as any,
                height: heightInches,
                year: 'Sr', // Irrelevant for alumni
                overall: 85, // Placeholder
                potential: 90,
                stats: {} as any,
                starterPosition: null,
                startOfSeasonOverall: 85,
                xFactor: 0,
                seasonStats: {} as any,
                isTargeted: false,
                draftProjection: 'Lottery', // Forces 'drafted' status
            };
            
            const mockTeamState = { 
                ...team, 
                fanMorale: Math.max(5, Math.min(100, (team.fanMorale ?? 50) + randomBetween(-10, 10))) 
            };
            
            // Estimate earnings based on YOS? Or just random high number.
            // Real data doesn't have earnings, only YOS.
            // Older players = more earnings.
            const estimatedEarnings = (realPlayer.yos || 1) * randomBetween(2000000, 15000000);
            
            const alumniProfile = generateAlumni(mockPlayer, mockTeamState, gradSeason, 'drafted', estimatedEarnings);
            alumniProfile.nbaTeam = realPlayer.team; // Explicitly set NBA team
            alumni.push(alumniProfile);
        });
    } else if (activeNbaCount > 0) {
        // Fallback to mock generation if no real players found but count > 0
        const avgEarnings = Math.floor(totalNbaEarnings / activeNbaCount);
        for (let i = 0; i < activeNbaCount; i++) {
            const gradSeason = -1 * randomBetween(1, 15); 
            const mockPlayer: Player = {
                id: `mock-nba-${i}`,
                name: `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`,
                position: pickRandom(['PG','SG','SF','PF','C']),
                height: 75,
                year: 'Sr',
                overall: 85,
                potential: 90,
                stats: {} as any,
                starterPosition: null,
                startOfSeasonOverall: 85,
                xFactor: 0,
                seasonStats: {} as any,
                isTargeted: false,
                draftProjection: 'Lottery'
            };
             const mockTeamState = { 
                ...team, 
                fanMorale: Math.max(5, Math.min(100, (team.fanMorale ?? 50) + randomBetween(-10, 10))) 
            };
            const earnings = Math.max(1000000, avgEarnings + randomBetween(-5000000, 5000000));
            alumni.push(generateAlumni(mockPlayer, mockTeamState, gradSeason, 'drafted', earnings));
        }
    }

    // Generate General Alumni
    for(let i=0; i<baseCount; i++) {
        const gradSeason = -1 * randomBetween(0, 30); 
        const isFemale = Math.random() > 0.5;
        const firstName = isFemale ? pickRandom(FEMALE_FIRST_NAMES) : pickRandom(FIRST_NAMES);

        const mockPlayer: Player = {
            id: `mock-alum-${i}`,
            name: `${firstName} ${pickRandom(LAST_NAMES)}`,
            position: pickRandom(['PG','SG','SF','PF','C']),
            height: 75,
            year: 'Sr',
            overall: 70,
            potential: 70,
            stats: {} as any,
            starterPosition: null,
            startOfSeasonOverall: 70,
            xFactor: 0,
            seasonStats: {} as any,
            isTargeted: false,
            draftProjection: 'Undrafted'
        };
        
        const mockTeamState = { 
            ...team, 
            fanMorale: Math.max(5, Math.min(100, (team.fanMorale ?? 50) + randomBetween(-30, 30))) 
        };
        
        alumni.push(generateAlumni(mockPlayer, mockTeamState, gradSeason));
    }

    let registry: AlumniRegistry = { 
        summaryStats: { countsPerProfession: {}, donationMomentum: 0, notableAlumni: [] }, 
        allAlumni: [],
        activeInfluence: {
            recruitingBonus: {},
            mediaProtection: 0,
            facilitySpeed: 0,
            scoutingEfficiency: 0,
            endowmentYield: 0,
            academicPrestigeBonus: 0,
            jobSecurityBonus: 0
        },
        equityPools: []
    };
    
    alumni.forEach(a => {
        registry = updateAlumniRegistry(registry, a);
    });
    return registry;
};

export const recalculateAlumniInfluence = (registry: AlumniRegistry): AlumniRegistry => {
    let newRegistry: AlumniRegistry = {
        ...registry,
        activeInfluence: {
            recruitingBonus: {},
            mediaProtection: 0,
            facilitySpeed: 0,
            scoutingEfficiency: 0,
            endowmentYield: 0,
            academicPrestigeBonus: 0,
            jobSecurityBonus: 0
        }
    };

    // Reset stats to ensure accuracy
    newRegistry.summaryStats = {
        countsPerProfession: {},
        donationMomentum: 0,
        notableAlumni: []
    };

    // Re-process all alumni
    registry.allAlumni.forEach(alum => {
        newRegistry = updateAlumniRegistry(newRegistry, alum);
    });

    return newRegistry;
};

// Alias for backward compatibility if needed, or just remove
export const generateBaselineAlumniRegistry = generateHistoricalAlumni;
