import { AlumniProfile, AlumniRegistry, Player, Team, GameState, AlumniArchetype, DonorDilemma, EquityPool } from '../types';
import { FIRST_NAMES, LAST_NAMES, ACTIVE_NBA_PLAYERS_DATA, FEMALE_FIRST_NAMES } from '../constants';
import { generatePlayerName, generateFirstName, generateLastName } from '../constants/namePools';
import { REAL_NBA_PLAYERS } from '../data/realNbaPlayers';
import { SCHOOL_INSTITUTIONAL_PROFILES } from '../data/institutional_harvester/school_profiles.nokey.generated';
import { BILLIONAIRE_ALMA_MATERS, TITAN_EARNINGS_RANGE } from '../data/billionaire_schools';

const randomBetween = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const PROFESSIONS = ['Business', 'Finance', 'Tech', 'Medicine', 'Law', 'Coaching', 'Media', 'Entrepreneur', 'Education', 'Public Service', 'Arts'];

const generateProfession = (prestige: number, teamName?: string): string => {
    // 1. Try to use scraped data profile
    if (teamName && SCHOOL_INSTITUTIONAL_PROFILES[teamName]?.archetypeWeights) {
        const weights = SCHOOL_INSTITUTIONAL_PROFILES[teamName].archetypeWeights!;
        const rand = Math.random() * 100;
        let cumulative = 0;

        // Map weights to professions (approximate mapping)
        // tech_students -> Tech
        cumulative += (weights['tech_students'] || 0);
        if (rand < cumulative) return 'Tech';

        // finance_business_students -> Business, Finance, Entrepreneur
        cumulative += (weights['finance_business_students'] || 0);
        if (rand < cumulative) return pickRandom(['Business', 'Finance', 'Entrepreneur']);

        // health_med_students -> Medicine
        cumulative += (weights['health_med_students'] || 0);
        if (rand < cumulative) return 'Medicine';

        // law_students -> Law, Political
        cumulative += (weights['law_students'] || 0);
        if (rand < cumulative) return pickRandom(['Law', 'Public Service']);

        // education_students -> Education, Coaching
        cumulative += (weights['education_students'] || 0);
        if (rand < cumulative) return pickRandom(['Education', 'Coaching']);

        // arts_media_students -> Media, Arts
        cumulative += (weights['arts_media_students'] || 0);
        if (rand < cumulative) return pickRandom(['Media', 'Arts']);

        // general_liberal_arts -> Spread across others
        return pickRandom(['Public Service', 'Education', 'Business', 'Arts']);
    }

    // 2. Fallback to legacy prestige-based logic
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
    if (wealth > 95 && profession !== 'Pro Athlete') return 'Titan'; // Ultra-wealthy non-athlete
    if (proStatus === 'drafted' || proStatus === 'pro_success') return 'Local'; 
    if (profession === 'Tech') return 'Tech';
    if (profession === 'Finance' || profession === 'Business' || profession === 'Entrepreneur') return 'Finance';
    if (profession === 'Public Service' || profession === 'Law') return 'Political';
    if (profession === 'Medicine') return 'Health';
    if (profession === 'Media' || profession === 'Arts') return 'Arts';
    
    // Fallback based on wealth/sentiment
    if (wealth > 80) return 'Finance';
    if (sentiment > 80) return 'Local';
    return 'Local'; 
};

// Initial Active Influence State
const INITIAL_INFLUENCE: AlumniInfluence = {
    recruitingBonus: {},
    mediaProtection: 0,
    facilitySpeed: 0,
    scoutingEfficiency: 0,
    endowmentYield: 0,
    academicPrestigeBonus: 0,
    jobSecurityBonus: 0,
    medicalEfficiency: 0,
    fanAppeal: 0,
    titanBonus: 0
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
    },
    {
        title: "Medical Wing Naming",
        description: "A 'Health' system CEO offers to renovate the training room, but wants it named after their controversial company.",
        archetype: 'Health',
        options: [
            { 
                label: "Accept Renovation", 
                effectDescription: "+Facility Speed, -Integrity", 
                consequences: { facilitySpeed: 15, integrity: -5, alumniSentiment: 5 } 
            },
            { 
                label: "Refuse", 
                effectDescription: "Status Quo", 
                consequences: { alumniSentiment: -2 } 
            }
        ]
    },
    {
        title: "Viral Uniform Concept",
        description: "An 'Arts' alumnus designed a wild new alternate jersey that's trending online.",
        archetype: 'Arts',
        options: [
            { 
                label: "Wear Them", 
                effectDescription: "+Momentum, -Traditionalist Sentiment", 
                consequences: { donorMomentum: 15, alumniSentiment: -5 } 
            },
            { 
                label: "Stick to School Colors", 
                effectDescription: "+Local Sentiment", 
                consequences: { alumniSentiment: 5 } 
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
    const currentYear = new Date().getFullYear();
    const yearsSinceGrad = Math.max(1, currentYear - graduationSeason); // Approximation if graduationSeason is effectively year

    if (forceEarnings) {
        careerEarnings = forceEarnings;
    } else {
        if (proStatus === 'drafted') careerEarnings = randomBetween(5000000, 100000000);
        else if (proStatus === 'overseas') careerEarnings = randomBetween(200000, 2000000);
        else {
            // Check for Billionaire (Titan) Probability
            const titanChance = BILLIONAIRE_ALMA_MATERS[team.name] || 0.0001; // Tiny base chance for everyone
            if (Math.random() < titanChance) {
                // TITAN GENERATED
                careerEarnings = randomBetween(TITAN_EARNINGS_RANGE.min, TITAN_EARNINGS_RANGE.max);
            } else {
                // Use real institutional data if available
                const schoolProfile = SCHOOL_INSTITUTIONAL_PROFILES[team.name];
                if (schoolProfile?.medianEarnings10yr) {
                    // Base: Median Earnings * Years (up to 30 years)
                    const earningPower = schoolProfile.medianEarnings10yr;
                    careerEarnings = earningPower * Math.min(30, yearsSinceGrad);

                    // Penalty: Student Debt (highest impact early in career)
                    if (yearsSinceGrad < 12 && schoolProfile.gradDebtMedian) {
                        careerEarnings -= schoolProfile.gradDebtMedian * 2; // Debt counts double against "liquid wealth"
                    }

                    // Random variance (0.5x to 2.0x) - some people strike it rich
                    careerEarnings *= (0.5 + Math.random() * 1.5);
                } else {
                     careerEarnings = randomBetween(50000, 500000); 
                }
            }
        }
    }

    // Determine Profession (Titan overrides)
    let profession = proStatus !== 'none' ? 'Pro Athlete' : generateProfession(prestigeAtGrad, team.name);
    if (careerEarnings > 100000000 && proStatus === 'none') {
        profession = 'Entrepreneur'; // Titans are usually entrepreneurs
    }
    
    // Recalculate Wealth Score with new inputs
    let wealthScore = Math.min(100, Math.round((careerEarnings / 1000000) * 10) + randomBetween(0, 5));
    // Titans break the scale, capped at 100 for UI but internal wealth is high
    
    // Apply City Wealth Bonus for Locals
    const schoolProfile = SCHOOL_INSTITUTIONAL_PROFILES[team.name];
    if (profession !== 'Pro Athlete' && schoolProfile?.cityMedianHouseholdIncome && wealthScore < 90) {
        // High cost of living cities (San Jose, etc) assumed to mean higher disposable income for elite 'Local' boosters
        if (schoolProfile.cityMedianHouseholdIncome > 75000) {
            wealthScore += 10;
        } else if (schoolProfile.cityMedianHouseholdIncome < 40000) {
            wealthScore -= 5;
        }
    }
    
    wealthScore = Math.max(0, Math.min(100, wealthScore));
    
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
        activeInfluence: { ...INITIAL_INFLUENCE },
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
    } else if (newAlumni.archetype === 'Health') {
        activeInfluence.medicalEfficiency = Math.min(100, activeInfluence.medicalEfficiency + 1);
    } else if (newAlumni.archetype === 'Arts') {
        activeInfluence.fanAppeal = Math.min(100, activeInfluence.fanAppeal + 1);
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
                name: generatePlayerName(),
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
            name: `${firstName} ${generateLastName()}`,
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
            jobSecurityBonus: 0,
            medicalEfficiency: 0,
            fanAppeal: 0
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
            jobSecurityBonus: 0,
            medicalEfficiency: 0,
            fanAppeal: 0
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

export const seedAlumniRegistry = (team: Team): AlumniRegistry => {
    // Start with empty registry
    let registry: AlumniRegistry = { 
        summaryStats: { countsPerProfession: {}, donationMomentum: 0, notableAlumni: [] }, 
        allAlumni: [],
        activeInfluence: { ...INITIAL_INFLUENCE },
        equityPools: []
    };

    // Calculate how many pre-existing Titans to generate
    const titanChance = BILLIONAIRE_ALMA_MATERS[team.name] || 0;
    
    // We simulate a "History" of ~1000 notable alumni to seed the registry
    // Tier 1 (2.5%) -> 25 Titans immediately available
    const HISTORY_SIZE = 1000;
    const numTitans = Math.round(HISTORY_SIZE * titanChance);
    
    if (numTitans > 0) {
        for (let i = 0; i < numTitans; i++) {
             const gradYear = randomBetween(1980, 2015);
             const mockPlayer: Player = {
                 id: `seed-titan-${i}`,
                 name: generatePlayerName(),
                 position: 'PG', 
                 height: 75,
                 year: 'Sr',
                 overall: 50,
                 potential: 50,
                 stats: {} as any, 
                 starterPosition: null, 
                 startOfSeasonOverall: 50,
                 draftProjection: 'Undrafted', 
                 team: team.name, 
                 yos: 2025 - gradYear,
                 gamesPlayed: 0,
                 minutesPerGame: 0,
                 pointsPerGame: 0,
                 reboundsPerGame: 0,
                 assistsPerGame: 0,
                 stealsPerGame: 0,
                 blocksPerGame: 0,
                 fieldGoalPercentage: 0,
                 threePointPercentage: 0,
                 freeThrowPercentage: 0,
                 contract: { salary: 0, yearsLeft: 0 },
                 injury: null,
                 gameLog: [],
                 clutchFactor: 0,
                 consistency: 0,
                 durability: 0,
                 hometown: 'Unknown',
                 state: 'Unknown',
                 personality: { 
                    leadership: 50, workEthic: 50, loyalty: 50, clutch: 50,
                    ambition: 50, ego: 50, adaptability: 50, pressure: 50
                 },
                 badges: []
             };
             
             // Force Titan status by overriding earnings
             const earnings = randomBetween(TITAN_EARNINGS_RANGE.min, TITAN_EARNINGS_RANGE.max);
             const alum = generateAlumni(mockPlayer, team, gradYear, 'none', earnings);
             
             // Ensure Archetype is Titan (handled by determineArchetype via wealth)
             // But force profession to Entrepreneur if needed
             if (alum.archetype !== 'Titan') {
                 // Should not happen if wealth > 500M, but just in case
             }
             
             registry = updateAlumniRegistry(registry, alum);
        }
    }
    
    return registry;
};

// Annual wealth appreciation logic
export const processAlumniWealthGrowth = (registry: AlumniRegistry): AlumniRegistry => {
    const updatedAlumni = registry.allAlumni.map(alum => {
        // Base growth rate by tier
        let growthRate = 0.02; // Inflation default
        let volatility = 0.05; // Standard dev

        if (alum.archetype === 'Titan') {
            growthRate = 0.08; // 8% avg return on massive capital
            volatility = 0.15; // High volatility
        } else if (alum.donationTier === 'high') {
            growthRate = 0.06;
            volatility = 0.10;
        } else if (alum.donationTier === 'medium') {
            growthRate = 0.04;
        }

        // Apply random volatility
        // Box-Muller transform for normal distribution approximation or simple variance
        const variance = (Math.random() * 2 - 1) * volatility;
        const actualGrowth = growthRate + variance;

        // Apply growth
        let newEarnings = alum.careerEarnings * (1 + actualGrowth);

        // Rare Events
        // 1/1000 chance of "Liquidity Event" (IPO, Acquisition) -> +50%
        if (Math.random() < 0.001) {
            newEarnings *= 1.5;
        }
        // 1/1000 chance of "Crisis" (Bankruptcy, Lawsuit) -> -30%
        if (Math.random() < 0.001) {
            newEarnings *= 0.7;
        }

        // Cap decline at 0
        newEarnings = Math.max(0, newEarnings);

        // Update Wealth Score & Tier based on new earnings
        // Re-using logic from generateAlumni conceptually
        let wealthScore = Math.min(100, Math.round((newEarnings / 1000000) * 10));
        
        // Recalculate tier
        const donationTier: 'high' | 'medium' | 'low' | 'none' = 
            wealthScore > 80 ? 'high' : 
            wealthScore > 40 ? 'medium' : 
            wealthScore > 10 ? 'low' : 'none';

        // Check if they evolved into a Titan (if not already)
        let archetype = alum.archetype;
        if (newEarnings > 500000000 && archetype !== 'Titan' && alum.profession !== 'Pro Athlete') {
            archetype = 'Titan';
        }

        return {
            ...alum,
            careerEarnings: Math.round(newEarnings),
            donationTier,
            archetype,
        };
    });

    // Re-calculate influence with new tiers/archetypes
    // Fix: Cast updatedAlumni to ensure compatibility if inference is weak
    const newRegistry: AlumniRegistry = {
        ...registry,
        allAlumni: updatedAlumni as AlumniProfile[]
    };

    return recalculateAlumniInfluence(newRegistry);
};
