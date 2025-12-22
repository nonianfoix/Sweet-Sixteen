
import { describe, it, expect, vi } from 'vitest';
import { simulateGame, createHeadCoachProfile } from './gameService';
import { Team, Player, GameAdjustment } from '../types';

// Mock data helpers (simplified from gameService.test.ts)
const createMockPlayer = (id: string, overall: number): Player => ({
    id,
    name: `Player ${id}`,
    position: 'PG',
    height: '6-0',
    year: 'Fr',
    overall,
    potential: 'B',
    stats: {
        insideScoring: overall,
        outsideScoring: overall,
        playmaking: overall,
        defense: overall,
        rebounding: overall,
        stamina: 80,
        durability: 80,
        workEthic: 'B',
        insideDefense: overall,
        perimeterDefense: overall,
        athleticism: overall,
        iq: overall,
        potential: 80,
        clutch: 50,
        injuryProne: 10,
        freeThrow: 70,
        handling: 70,
        passing: 70,
        offensiveRebound: 50,
        defensiveRebound: 50,
        block: 50,
        steal: 50,
        shotContest: 50,
        helpDefense: 50,
        onBallDefense: 50,
        midRange: overall,
        threePoint: overall,
        finishing: overall,
        postControl: 50,
        playRecognition: 50,
        consistency: 50,
        intangibles: 50,
        points: 0,
        assists: 0,
        rebounds: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        gamesPlayed: 0,
        gamesStarted: 0,
        minutes: 0,
        fouls: 0,
        plusMinus: 0,
        usage: 0,
        per: 0,
        ts: 0,
        efg: 0,
        ortg: 0,
        drtg: 0,
        winShares: 0,
        bpm: 0,
        vorp: 0,
        dws: 0,
        ows: 0,
        obpm: 0,
        dbpm: 0,
        perGame: {
            points: 0,
            assists: 0,
            rebounds: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fieldGoalsMade: 0,
            fieldGoalsAttempted: 0,
            threePointersMade: 0,
            threePointersAttempted: 0,
            freeThrowsMade: 0,
            freeThrowsAttempted: 0,
            minutes: 0,
            fouls: 0,
            plusMinus: 0
        }
    },
    hometown: 'City',
    state: 'State',
    recruitingStars: 3,
    interest: 100,
    isRedshirt: false,
    isTransfer: false,
    transferYearsMustSit: 0,
    gamesPlayed: 0,
    statsHistory: [],
    ratingsHistory: [],
    recruitingRound: 0,
    offensiveStyle: 'Balanced',
    defensiveStyle: 'Man-to-Man',
    role: 'Bench',
    happiness: 100,
    minutesExpectation: 20,
    transferProbability: 0,
    draftStock: 0,
    academics: 80,
    ambition: 50,
    loyalty: 50,
    discipline: 50,
    adaptability: 50,
    leadership: 50,
    clutch: 50,
    consistency: 50,
    injuryProne: 10,
    workEthic: 'B',
    personality: 'Neutral',
    badges: [],
    seasonStats: {
        points: 0,
        assists: 0,
        rebounds: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        gamesPlayed: 0,
        gamesStarted: 0,
        minutes: 0,
        fouls: 0,
        plusMinus: 0,
        usage: 0,
        per: 0,
        ts: 0,
        efg: 0,
        ortg: 0,
        drtg: 0,
        winShares: 0,
        bpm: 0,
        vorp: 0,
        dws: 0,
        ows: 0,
        obpm: 0,
        dbpm: 0
    },
    rotationMinutes: 20 // Default minutes
});

const createMockTeam = (name: string, isUser: boolean, overall: number): Team => {
    const roster = Array.from({ length: 12 }, (_, i) => createMockPlayer(`${name}-${i}`, overall));
    return {
        name,
        conference: 'Conf',
        division: 'Div',
        state: 'State',
        prestige: 80,
        recruitingPrestige: 80,
        roster,
        staff: { assistants: [], trainers: [], scouts: [] },
        record: { wins: 0, losses: 0 },
        history: [],
        rivals: [],
        playbookFamiliarity: 100,
        pipelineStates: [],
        isUserTeam: isUser,
        coach: createHeadCoachProfile('Coach', 'Name', 40, 'Balanced', 'Man-to-Man', 'Balanced', 'Balanced'),
        offense: 'Balanced',
        defense: 'Man-to-Man',
        tempo: 'Balanced',
        rotationPreference: 'Balanced',
        budget: 1000000,
        expenditures: { scouting: 0, training: 0, facilities: 0, marketing: 0, health: 0 },
        facilities: { arena: 'Arena', training: 'Gym', medical: 'Clinic' },
        arena: { name: 'Arena', capacity: 10000, attendance: 0, ticketPrice: 20, luxurySuites: 0, parking: 0, concessions: 0, amenities: 0, maintenance: 0, renovations: [] },
        fanBase: { loyalty: 50, passion: 50, size: 50000, expectations: 50, mood: 50 },
        owner: { name: 'Owner', patience: 50, ambition: 50, wealth: 50, involvement: 50 },
        scouting: { network: 50, budget: 0, regions: [] },
        training: { facilities: 50, budget: 0, staff: [] },
        medical: { facilities: 50, budget: 0, staff: [] },
        marketing: { budget: 0, campaigns: [] },
        academics: { reputation: 50, budget: 0, standards: 50 },
        brand: { value: 50, recognition: 50, image: 50 },
        media: { contract: 0, exposure: 50, sentiment: 50 },
        chemistry: 50,
        morale: 50,
        momentum: 50,
        strategy: { offense: 'Balanced', defense: 'Man-to-Man', tempo: 'Balanced', rotation: 'Balanced' },
        goals: [],
        achievements: [],
        injuries: [],
        transfers: [],
        recruits: [],
        draftPicks: [],
        alumni: [],
        hallOfFame: [],
        retiredJerseys: [],
        rivalryHistory: [],
        championships: [],
        tournamentAppearances: [],
        finalFours: [],
        conferenceTitles: [],
        awards: [],
        records: [],
        stats: {
            points: 0,
            assists: 0,
            rebounds: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fieldGoalsMade: 0,
            fieldGoalsAttempted: 0,
            threePointersMade: 0,
            threePointersAttempted: 0,
            freeThrowsMade: 0,
            freeThrowsAttempted: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0
        }
    } as unknown as Team; // Casting to avoid implementing every single field for mock
};

describe('Diagnostic Scoring Test', () => {
    it('should log game details for Duke (High) vs Toledo (Mid)', () => {
        const duke = createMockTeam('Duke', false, 90); // 90 OVR - Elite
        const toledo = createMockTeam('Toledo', false, 70); // 70 OVR - Mid-Major

        // Reset minutes to 0 to trigger auto-allocation
        duke.roster.forEach(p => p.rotationMinutes = 0);
        toledo.roster.forEach(p => p.rotationMinutes = 0);

        console.log('--- Starting Diagnostic Simulation (Duke vs Toledo) ---');
        const result = simulateGame(duke, toledo, 'S1G1');
        
        console.log(`Score: ${result.homeTeam} ${result.homeScore} - ${result.awayTeam} ${result.awayScore}`);
        const homeFGA = result.homeTeamStats.reduce((a,b) => a + b.stats.fieldGoalsAttempted, 0);
        const awayFGA = result.awayTeamStats.reduce((a,b) => a + b.stats.fieldGoalsAttempted, 0);
        const homeTO = result.homeTeamStats.reduce((a,b) => a + b.stats.turnovers, 0);
        const awayTO = result.awayTeamStats.reduce((a,b) => a + b.stats.turnovers, 0);
        const homeFTA = result.homeTeamStats.reduce((a,b) => a + b.stats.freeThrowsAttempted, 0);
        const awayFTA = result.awayTeamStats.reduce((a,b) => a + b.stats.freeThrowsAttempted, 0);

        const homePossessions = homeFGA + homeTO + (homeFTA * 0.44);
        const awayPossessions = awayFGA + awayTO + (awayFTA * 0.44);

        console.log(`Possessions (Home/Away): ${homePossessions.toFixed(1)} / ${awayPossessions.toFixed(1)}`);
        console.log(`Duke FG%: ${result.homeTeamStats.reduce((a,b) => a + b.stats.fieldGoalsMade, 0) / homeFGA}`);
        console.log(`Toledo FG%: ${result.awayTeamStats.reduce((a,b) => a + b.stats.fieldGoalsMade, 0) / awayFGA}`);
        
        expect(result.homeScore).toBeGreaterThan(60); // Duke should score decent
    });
});
