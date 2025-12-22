
interface NBATeamInfo {
    name: string;
    conference: 'East' | 'West';
    division: 'Atlantic' | 'Central' | 'Southeast' | 'Northwest' | 'Pacific' | 'Southwest';
}

const NBA_TEAMS: NBATeamInfo[] = [
    // Atlantic
    { name: 'Boston Celtics', conference: 'East', division: 'Atlantic' },
    { name: 'Brooklyn Nets', conference: 'East', division: 'Atlantic' },
    { name: 'New York Knicks', conference: 'East', division: 'Atlantic' },
    { name: 'Philadelphia 76ers', conference: 'East', division: 'Atlantic' },
    { name: 'Toronto Raptors', conference: 'East', division: 'Atlantic' },
    // Central
    { name: 'Chicago Bulls', conference: 'East', division: 'Central' },
    { name: 'Cleveland Cavaliers', conference: 'East', division: 'Central' },
    { name: 'Detroit Pistons', conference: 'East', division: 'Central' },
    { name: 'Indiana Pacers', conference: 'East', division: 'Central' },
    { name: 'Milwaukee Bucks', conference: 'East', division: 'Central' },
    // Southeast
    { name: 'Atlanta Hawks', conference: 'East', division: 'Southeast' },
    { name: 'Charlotte Hornets', conference: 'East', division: 'Southeast' },
    { name: 'Miami Heat', conference: 'East', division: 'Southeast' },
    { name: 'Orlando Magic', conference: 'East', division: 'Southeast' },
    { name: 'Washington Wizards', conference: 'East', division: 'Southeast' },
    // Northwest
    { name: 'Denver Nuggets', conference: 'West', division: 'Northwest' },
    { name: 'Minnesota Timberwolves', conference: 'West', division: 'Northwest' },
    { name: 'Oklahoma City Thunder', conference: 'West', division: 'Northwest' },
    { name: 'Portland Trail Blazers', conference: 'West', division: 'Northwest' },
    { name: 'Utah Jazz', conference: 'West', division: 'Northwest' },
    // Pacific
    { name: 'Golden State Warriors', conference: 'West', division: 'Pacific' },
    { name: 'LA Clippers', conference: 'West', division: 'Pacific' },
    { name: 'Los Angeles Lakers', conference: 'West', division: 'Pacific' },
    { name: 'Phoenix Suns', conference: 'West', division: 'Pacific' },
    { name: 'Sacramento Kings', conference: 'West', division: 'Pacific' },
    // Southwest
    { name: 'Dallas Mavericks', conference: 'West', division: 'Southwest' },
    { name: 'Houston Rockets', conference: 'West', division: 'Southwest' },
    { name: 'Memphis Grizzlies', conference: 'West', division: 'Southwest' },
    { name: 'New Orleans Pelicans', conference: 'West', division: 'Southwest' },
    { name: 'San Antonio Spurs', conference: 'West', division: 'Southwest' },
];

export interface GameResult {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    played: boolean;
    isPlayoffGame?: boolean;
}

export const generateNBASchedule = (teams: { name: string }[]): GameResult[][] => {
    // Helper to find team info
    const getTeamInfo = (name: string) => NBA_TEAMS.find(t => t.name === name);

    // 1. Organize teams by Conference and Division
    const confTeams: Record<string, string[]> = { East: [], West: [] };
    const divTeams: Record<string, string[]> = {};
    const teamDivision: Record<string, string> = {};

    teams.forEach(t => {
        const info = getTeamInfo(t.name);
        if (info) {
            confTeams[info.conference].push(t.name);
            if (!divTeams[info.division]) divTeams[info.division] = [];
            divTeams[info.division].push(t.name);
            teamDivision[t.name] = info.division;
        }
    });

    const matchupPool: { home: string, away: string }[] = [];
    
    // Add series of games (balanced home/away)
    const addSeries = (t1: string, t2: string, count: number) => {
        let homeGames = Math.floor(count / 2);
        let roadGames = count - homeGames;
        // If odd number, randomize who gets extra home game
        if (homeGames !== roadGames && Math.random() > 0.5) {
             [homeGames, roadGames] = [roadGames, homeGames];
        }
        
        for (let i = 0; i < homeGames; i++) matchupPool.push({ home: t1, away: t2 });
        for (let i = 0; i < roadGames; i++) matchupPool.push({ home: t2, away: t1 });
    };

    const getPairId = (t1: string, t2: string) => [t1, t2].sort().join('::');

    for (const div in divTeams) {
        const dt = divTeams[div];
        for (let i = 0; i < dt.length; i++) {
            for (let j = i + 1; j < dt.length; j++) {
                addSeries(dt[i], dt[j], 4);
            }
        }
    }

    confTeams['East'].forEach(eTeam => {
        confTeams['West'].forEach(wTeam => {
            addSeries(eTeam, wTeam, 2);
        });
    });

    ['East', 'West'].forEach(conf => {
        const cTeams = confTeams[conf];
        const nonDivPairs: {t1: string, t2: string}[] = [];
        
        for (let i = 0; i < cTeams.length; i++) {
            for (let j = i + 1; j < cTeams.length; j++) {
                const t1 = cTeams[i];
                const t2 = cTeams[j];
                if (teamDivision[t1] && teamDivision[t2] && teamDivision[t1] !== teamDivision[t2]) {
                    nonDivPairs.push({ t1, t2 });
                }
            }
        }

        let success = false;
        let attempts = 0;
        let chosenFor4Games = new Set<string>();

        while (!success && attempts < 50) {
            attempts++;
            chosenFor4Games.clear();
            const needsUpgrade = new Map<string, number>();
            cTeams.forEach(t => needsUpgrade.set(t, 6));
            
            const shuffledPairs = [...nonDivPairs].sort(() => Math.random() - 0.5);
            
            for (const pair of shuffledPairs) {
                if ((needsUpgrade.get(pair.t1) || 0) > 0 && (needsUpgrade.get(pair.t2) || 0) > 0) {
                    chosenFor4Games.add(getPairId(pair.t1, pair.t2));
                    needsUpgrade.set(pair.t1, (needsUpgrade.get(pair.t1) || 0) - 1);
                    needsUpgrade.set(pair.t2, (needsUpgrade.get(pair.t2) || 0) - 1);
                }
            }
            
            if (Array.from(needsUpgrade.values()).every(v => v === 0)) {
                success = true;
            }
        }
        
        for (const pair of nonDivPairs) {
            const is4Game = chosenFor4Games.has(getPairId(pair.t1, pair.t2));
            addSeries(pair.t1, pair.t2, is4Game ? 4 : 3);
        }
    });

    for (let i = matchupPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matchupPool[i], matchupPool[j]] = [matchupPool[j], matchupPool[i]];
    }

    const schedule: GameResult[][] = [];
    const weeks = 31;
    let poolIndex = 0;
    
    for (let w = 0; w < weeks; w++) {
        const weekGames: GameResult[] = [];
        const gamesForThisWeek = Math.ceil((matchupPool.length - poolIndex) / (weeks - w));
        
        for (let i = 0; i < gamesForThisWeek; i++) {
             if (poolIndex < matchupPool.length) {
                 const m = matchupPool[poolIndex++];
                 weekGames.push({
                     homeTeam: m.home,
                     awayTeam: m.away,
                     homeScore: 0,
                     awayScore: 0,
                     played: false,
                     isPlayoffGame: false
                 });
             }
        }
        schedule.push(weekGames);
    }
    
    return schedule;
};


// Verification Logic
const schedule = generateNBASchedule(NBA_TEAMS);

console.log('Schedule generated with ' + schedule.length + ' weeks.');
console.log('Total games per team:');
const gamesPlayed: Record<string, number> = {};
NBA_TEAMS.forEach(t => gamesPlayed[t.name] = 0);

schedule.forEach(week => {
    week.forEach(game => {
        gamesPlayed[game.homeTeam]++;
        gamesPlayed[game.awayTeam]++;
    });
});

let allCorrect = true;
for (const team in gamesPlayed) {
    if (gamesPlayed[team] !== 82) {
        console.error(`Error: ${team} plays ${gamesPlayed[team]} games.`);
        allCorrect = false;
    }
}

if (allCorrect) {
    console.log('SUCCESS: All teams play exactly 82 games.');
} else {
    console.error('FAILURE: Schedule incorrect.');
    process.exit(1);
}
