/**
 * NBA Schedule Service - Generates NBA schedules with actual ISODate values
 */

import { AnnualCalendar, ISODate, NBAPlayoffBracket, NBAPlayoffSeries, NBAScheduledGame, NBASeasonSchedule } from '../types';
import { addDaysISO, dayOfWeekISO, isoToJsDateUTC } from './dateService';
import { NBA_TEAMS } from '../constants';

/**
 * Generate NBA schedule with actual ISODate values using the AnnualCalendar.
 * Distributes 82 games per team across the season with proper date spacing.
 */
export const generateNBAScheduleWithDates = (
    teams: { name: string }[],
    calendar: AnnualCalendar
): NBASeasonSchedule => {
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

    const matchupPool: { home: string; away: string }[] = [];

    // Add series of games (balanced home/away)
    const addSeries = (t1: string, t2: string, count: number) => {
        let homeGames = Math.floor(count / 2);
        let roadGames = count - homeGames;
        if (homeGames !== roadGames && Math.random() > 0.5) {
            [homeGames, roadGames] = [roadGames, homeGames];
        }
        for (let i = 0; i < homeGames; i++) matchupPool.push({ home: t1, away: t2 });
        for (let i = 0; i < roadGames; i++) matchupPool.push({ home: t2, away: t1 });
    };

    const getPairId = (t1: string, t2: string) => [t1, t2].sort().join('::');

    // 2. Generate Matchups (same logic as original)
    // A. Division Games (4 games vs 4 opponents = 16 games)
    for (const div in divTeams) {
        const dt = divTeams[div];
        for (let i = 0; i < dt.length; i++) {
            for (let j = i + 1; j < dt.length; j++) {
                addSeries(dt[i], dt[j], 4);
            }
        }
    }

    // B. Inter-Conference Games (2 games vs 15 opponents = 30 games)
    confTeams['East'].forEach(eTeam => {
        confTeams['West'].forEach(wTeam => {
            addSeries(eTeam, wTeam, 2);
        });
    });

    // C. Intra-Conference Non-Division
    ['East', 'West'].forEach(conf => {
        const cTeams = confTeams[conf];
        const nonDivPairs: { t1: string; t2: string }[] = [];
        
        for (let i = 0; i < cTeams.length; i++) {
            for (let j = i + 1; j < cTeams.length; j++) {
                const t1 = cTeams[i];
                const t2 = cTeams[j];
                if (teamDivision[t1] && teamDivision[t2] && teamDivision[t1] !== teamDivision[t2]) {
                    nonDivPairs.push({ t1, t2 });
                }
            }
        }

        let chosenFor4Games = new Set<string>();
        let success = false;
        let attempts = 0;

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

    // 3. Shuffle matchups
    for (let i = matchupPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matchupPool[i], matchupPool[j]] = [matchupPool[j], matchupPool[i]];
    }

    // 4. Generate date slots from calendar
    const generateDateSlots = (): ISODate[] => {
        const slots: ISODate[] = [];
        let cursor = calendar.nbaSeasonStart;
        
        while (cursor <= calendar.nbaRegularSeasonEnd) {
            // Skip All-Star break
            if (cursor >= calendar.nbaAllStarBreakStart && cursor <= calendar.nbaAllStarBreakEnd) {
                cursor = addDaysISO(cursor, 1);
                continue;
            }
            
            // Skip Christmas Eve (Dec 24) - Christmas Day is special
            const cursorDate = isoToJsDateUTC(cursor);
            const month = cursorDate.getUTCMonth() + 1;
            const day = cursorDate.getUTCDate();
            if (month === 12 && day === 24) {
                cursor = addDaysISO(cursor, 1);
                continue;
            }
            
            slots.push(cursor);
            cursor = addDaysISO(cursor, 1);
        }
        
        return slots;
    };

    const dateSlots = generateDateSlots();
    
    // 5. Distribute games to dates
    const gamesById: Record<string, NBAScheduledGame> = {};
    const gamesByDate: Record<ISODate, string[]> = {};
    const teamSchedules: Record<string, ISODate[]> = {};
    const teamLastGameDate: Record<string, ISODate> = {};
    
    teams.forEach(t => {
        teamSchedules[t.name] = [];
    });

    // Calculate target games per date (roughly 13-15 games per day across 30 teams)
    const totalGames = matchupPool.length;
    const gamesPerDate = Math.ceil(totalGames / dateSlots.length);
    
    let matchupIndex = 0;
    
    for (const date of dateSlots) {
        if (matchupIndex >= matchupPool.length) break;
        
        gamesByDate[date] = [];
        const teamsPlayingToday = new Set<string>();
        let gamesScheduledToday = 0;
        
        // Try to schedule games for this date
        while (gamesScheduledToday < gamesPerDate && matchupIndex < matchupPool.length) {
            const matchup = matchupPool[matchupIndex];
            
            // Check if either team is already playing today
            if (teamsPlayingToday.has(matchup.home) || teamsPlayingToday.has(matchup.away)) {
                matchupIndex++;
                continue;
            }
            
            // Check for 3-in-a-row (not allowed)
            const yesterday = addDaysISO(date, -1);
            const twoDaysAgo = addDaysISO(date, -2);
            const homePlayedYesterday = teamLastGameDate[matchup.home] === yesterday;
            const awayPlayedYesterday = teamLastGameDate[matchup.away] === yesterday;
            
            if (homePlayedYesterday && teamSchedules[matchup.home].includes(twoDaysAgo)) {
                matchupIndex++;
                continue;
            }
            if (awayPlayedYesterday && teamSchedules[matchup.away].includes(twoDaysAgo)) {
                matchupIndex++;
                continue;
            }
            
            // Schedule the game
            const gameId = `nba-${date}-${matchup.home}-${matchup.away}`.replace(/\s+/g, '-');
            const isChristmas = date.includes('-12-25');
            const isWeekend = [0, 6].includes(dayOfWeekISO(date));
            
            const game: NBAScheduledGame = {
                id: gameId,
                date,
                homeTeam: matchup.home,
                awayTeam: matchup.away,
                homeScore: 0,
                awayScore: 0,
                played: false,
                isNationalTV: isChristmas || (isWeekend && Math.random() < 0.3),
                tvNetwork: isChristmas ? 'ABC' : isWeekend && Math.random() < 0.3 ? 'TNT' : 'League Pass',
                gameType: 'regular',
            };
            
            gamesById[gameId] = game;
            gamesByDate[date].push(gameId);
            teamSchedules[matchup.home].push(date);
            teamSchedules[matchup.away].push(date);
            teamLastGameDate[matchup.home] = date;
            teamLastGameDate[matchup.away] = date;
            teamsPlayingToday.add(matchup.home);
            teamsPlayingToday.add(matchup.away);
            
            matchupIndex++;
            gamesScheduledToday++;
        }
    }
    
    // Handle any remaining games by adding them to dates with fewer games
    while (matchupIndex < matchupPool.length) {
        const matchup = matchupPool[matchupIndex];
        
        for (const date of dateSlots) {
            const gamesOnDate = gamesByDate[date] || [];
            const teamsOnDate = new Set<string>();
            gamesOnDate.forEach(gid => {
                const g = gamesById[gid];
                teamsOnDate.add(g.homeTeam);
                teamsOnDate.add(g.awayTeam);
            });
            
            if (!teamsOnDate.has(matchup.home) && !teamsOnDate.has(matchup.away)) {
                const gameId = `nba-${date}-${matchup.home}-${matchup.away}-extra`.replace(/\s+/g, '-');
                const game: NBAScheduledGame = {
                    id: gameId,
                    date,
                    homeTeam: matchup.home,
                    awayTeam: matchup.away,
                    homeScore: 0,
                    awayScore: 0,
                    played: false,
                    isNationalTV: false,
                    tvNetwork: 'League Pass',
                    gameType: 'regular',
                };
                
                gamesById[gameId] = game;
                if (!gamesByDate[date]) gamesByDate[date] = [];
                gamesByDate[date].push(gameId);
                teamSchedules[matchup.home].push(date);
                teamSchedules[matchup.away].push(date);
                break;
            }
        }
        matchupIndex++;
    }
    
    return {
        seasonYear: calendar.year,
        gamesByDate,
        gamesById,
        teamSchedules,
    };
};

/**
 * Get NBA games scheduled for a specific date.
 */
export const getNBAGamesForDate = (
    schedule: NBASeasonSchedule,
    date: ISODate
): NBAScheduledGame[] => {
    const gameIds = schedule.gamesByDate[date] || [];
    return gameIds.map(id => schedule.gamesById[id]).filter(Boolean);
};

/**
 * Get a team's schedule as a list of games.
 */
export const getTeamNBASchedule = (
    schedule: NBASeasonSchedule,
    teamName: string
): NBAScheduledGame[] => {
    const dates = schedule.teamSchedules[teamName] || [];
    const games: NBAScheduledGame[] = [];
    
    for (const date of dates) {
        const gameIds = schedule.gamesByDate[date] || [];
        for (const id of gameIds) {
            const game = schedule.gamesById[id];
            if (game && (game.homeTeam === teamName || game.awayTeam === teamName)) {
                games.push(game);
            }
        }
    }
    
    return games.sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Update a game result in the schedule.
 */
export const updateNBAGameResult = (
    schedule: NBASeasonSchedule,
    gameId: string,
    homeScore: number,
    awayScore: number
): NBASeasonSchedule => {
    const game = schedule.gamesById[gameId];
    if (!game) return schedule;
    
    return {
        ...schedule,
        gamesById: {
            ...schedule.gamesById,
            [gameId]: {
                ...game,
                homeScore,
                awayScore,
                played: true,
            },
        },
    };
};

// ===== NBA PLAYOFFS GENERATION =====

type TeamStanding = {
    name: string;
    conference: 'East' | 'West';
    wins: number;
    losses: number;
};

/**
 * Create playoff series games with proper date spacing (2-2-1-1-1 format).
 */
const createPlayoffSeriesGames = (
    homeTeam: string,
    awayTeam: string,
    startDate: ISODate,
    round: 'first' | 'semis' | 'conf_finals' | 'finals'
): NBAScheduledGame[] => {
    const games: NBAScheduledGame[] = [];
    
    // 2-2-1-1-1 format: Games 1,2 at higher seed, 3,4 at lower seed, 5 at higher, 6 at lower, 7 at higher
    const homeAwayPattern = [true, true, false, false, true, false, true]; // true = home team hosts
    const dayGaps = [0, 2, 3, 2, 3, 2, 3]; // Days between games
    
    let currentDate = startDate;
    
    for (let gameNum = 0; gameNum < 7; gameNum++) {
        const isHomeTeamHost = homeAwayPattern[gameNum];
        const gameId = `playoff-${round}-${homeTeam}-${awayTeam}-g${gameNum + 1}`.replace(/\s+/g, '-');
        
        const game: NBAScheduledGame = {
            id: gameId,
            date: currentDate,
            homeTeam: isHomeTeamHost ? homeTeam : awayTeam,
            awayTeam: isHomeTeamHost ? awayTeam : homeTeam,
            homeScore: 0,
            awayScore: 0,
            played: false,
            isNationalTV: true,
            tvNetwork: round === 'finals' ? 'ABC' : 'TNT',
            gameType: 'playoff',
            playoffRound: round,
            playoffSeriesId: `${round}-${homeTeam}-${awayTeam}`.replace(/\s+/g, '-'),
        };
        
        games.push(game);
        currentDate = addDaysISO(currentDate, dayGaps[gameNum + 1] || 2);
    }
    
    return games;
};

/**
 * Create a playoff series between two teams.
 */
const createPlayoffSeries = (
    homeTeam: string,
    awayTeam: string,
    homeSeed: number,
    awaySeed: number,
    startDate: ISODate,
    conference: 'East' | 'West' | 'Finals',
    round: 'first' | 'semis' | 'conf_finals' | 'finals'
): NBAPlayoffSeries => {
    return {
        id: `${round}-${homeTeam}-${awayTeam}`.replace(/\s+/g, '-'),
        homeTeam,
        awayTeam,
        homeSeed,
        awaySeed,
        homeWins: 0,
        awayWins: 0,
        games: createPlayoffSeriesGames(homeTeam, awayTeam, startDate, round),
        winner: null,
        conference,
        round,
    };
};

/**
 * Setup NBA Playoffs bracket from final standings.
 */
export const setupNBAPlayoffs = (
    standings: TeamStanding[],
    calendar: AnnualCalendar,
    season: number
): NBAPlayoffBracket => {
    // Sort by conference and wins
    const eastTeams = standings
        .filter(t => t.conference === 'East')
        .sort((a, b) => b.wins - a.wins);
    const westTeams = standings
        .filter(t => t.conference === 'West')
        .sort((a, b) => b.wins - a.wins);
    
    // Get playoff teams (top 8 after play-in)
    const eastPlayoff = eastTeams.slice(0, 8);
    const westPlayoff = westTeams.slice(0, 8);
    
    // Play-in results (simplified - top 6 are in, 7-10 play-in)
    const playInResults = {
        east: {
            seed7: eastTeams[6]?.name || '',
            seed8: eastTeams[7]?.name || '',
            winner7v8: eastTeams[6]?.name || '', // 7 beats 8
            loser7v8: eastTeams[7]?.name || '',
            seed9: eastTeams[8]?.name || '',
            seed10: eastTeams[9]?.name || '',
            winner9v10: eastTeams[8]?.name || '', // 9 beats 10
            finalSeed7: eastTeams[6]?.name || '',
            finalSeed8: eastTeams[7]?.name || '', // 8 beats 9 for the 8th spot
        },
        west: {
            seed7: westTeams[6]?.name || '',
            seed8: westTeams[7]?.name || '',
            winner7v8: westTeams[6]?.name || '',
            loser7v8: westTeams[7]?.name || '',
            seed9: westTeams[8]?.name || '',
            seed10: westTeams[9]?.name || '',
            winner9v10: westTeams[8]?.name || '',
            finalSeed7: westTeams[6]?.name || '',
            finalSeed8: westTeams[7]?.name || '',
        },
    };
    
    // First round matchups (1v8, 2v7, 3v6, 4v5 in each conference)
    const firstRoundStart = calendar.nbaPlayoffsStart;
    
    const firstRound: NBAPlayoffSeries[] = [
        // East
        createPlayoffSeries(eastPlayoff[0].name, eastPlayoff[7].name, 1, 8, firstRoundStart, 'East', 'first'),
        createPlayoffSeries(eastPlayoff[3].name, eastPlayoff[4].name, 4, 5, firstRoundStart, 'East', 'first'),
        createPlayoffSeries(eastPlayoff[2].name, eastPlayoff[5].name, 3, 6, firstRoundStart, 'East', 'first'),
        createPlayoffSeries(eastPlayoff[1].name, eastPlayoff[6].name, 2, 7, firstRoundStart, 'East', 'first'),
        // West
        createPlayoffSeries(westPlayoff[0].name, westPlayoff[7].name, 1, 8, firstRoundStart, 'West', 'first'),
        createPlayoffSeries(westPlayoff[3].name, westPlayoff[4].name, 4, 5, firstRoundStart, 'West', 'first'),
        createPlayoffSeries(westPlayoff[2].name, westPlayoff[5].name, 3, 6, firstRoundStart, 'West', 'first'),
        createPlayoffSeries(westPlayoff[1].name, westPlayoff[6].name, 2, 7, firstRoundStart, 'West', 'first'),
    ];
    
    return {
        season,
        playInResults,
        firstRound,
        confSemis: [], // Generated after first round completes
        confFinals: [], // Generated after semis complete
        finals: null,
        champion: null,
    };
};

/**
 * Advance a playoff series by simulating the next game.
 * Returns the updated series.
 */
export const simulatePlayoffGame = (
    series: NBAPlayoffSeries,
    homeTeamWins: boolean
): NBAPlayoffSeries => {
    const nextGameIndex = series.homeWins + series.awayWins;
    if (nextGameIndex >= 7 || series.winner) {
        return series; // Series already complete
    }
    
    const game = series.games[nextGameIndex];
    if (!game) return series;
    
    // Determine winner
    const gameHomeTeam = game.homeTeam;
    const isSeriesHomeTeam = gameHomeTeam === series.homeTeam;
    
    const homeScore = homeTeamWins ? 105 + Math.floor(Math.random() * 20) : 95 + Math.floor(Math.random() * 15);
    const awayScore = homeTeamWins ? 95 + Math.floor(Math.random() * 15) : 105 + Math.floor(Math.random() * 20);
    
    const updatedGame: NBAScheduledGame = {
        ...game,
        homeScore,
        awayScore,
        played: true,
    };
    
    const newHomeWins = isSeriesHomeTeam === homeTeamWins ? series.homeWins + 1 : series.homeWins;
    const newAwayWins = isSeriesHomeTeam === homeTeamWins ? series.awayWins : series.awayWins + 1;
    
    // Check for series winner (first to 4)
    let winner: string | null = null;
    if (newHomeWins >= 4) {
        winner = series.homeTeam;
    } else if (newAwayWins >= 4) {
        winner = series.awayTeam;
    }
    
    return {
        ...series,
        homeWins: newHomeWins,
        awayWins: newAwayWins,
        games: series.games.map((g, i) => i === nextGameIndex ? updatedGame : g),
        winner,
    };
};

/**
 * Check if a round is complete (all series have winners).
 */
export const isRoundComplete = (series: NBAPlayoffSeries[]): boolean => {
    return series.length > 0 && series.every(s => s.winner !== null);
};

/**
 * Advance to the next playoff round.
 */
export const advancePlayoffRound = (
    bracket: NBAPlayoffBracket,
    calendar: AnnualCalendar
): NBAPlayoffBracket => {
    // Check if first round is complete -> generate semis
    if (isRoundComplete(bracket.firstRound) && bracket.confSemis.length === 0) {
        const eastWinners = bracket.firstRound
            .filter(s => s.conference === 'East')
            .map(s => ({ team: s.winner!, seed: s.homeSeed < s.awaySeed ? s.homeSeed : s.awaySeed }))
            .sort((a, b) => a.seed - b.seed);
        
        const westWinners = bracket.firstRound
            .filter(s => s.conference === 'West')
            .map(s => ({ team: s.winner!, seed: s.homeSeed < s.awaySeed ? s.homeSeed : s.awaySeed }))
            .sort((a, b) => a.seed - b.seed);
        
        const semisStart = addDaysISO(calendar.nbaPlayoffsStart, 14);
        
        return {
            ...bracket,
            confSemis: [
                createPlayoffSeries(eastWinners[0].team, eastWinners[3].team, eastWinners[0].seed, eastWinners[3].seed, semisStart, 'East', 'semis'),
                createPlayoffSeries(eastWinners[1].team, eastWinners[2].team, eastWinners[1].seed, eastWinners[2].seed, semisStart, 'East', 'semis'),
                createPlayoffSeries(westWinners[0].team, westWinners[3].team, westWinners[0].seed, westWinners[3].seed, semisStart, 'West', 'semis'),
                createPlayoffSeries(westWinners[1].team, westWinners[2].team, westWinners[1].seed, westWinners[2].seed, semisStart, 'West', 'semis'),
            ],
        };
    }
    
    // Check if semis complete -> generate conf finals
    if (isRoundComplete(bracket.confSemis) && bracket.confFinals.length === 0) {
        const eastWinners = bracket.confSemis
            .filter(s => s.conference === 'East')
            .map(s => ({ team: s.winner!, seed: s.homeSeed < s.awaySeed ? s.homeSeed : s.awaySeed }))
            .sort((a, b) => a.seed - b.seed);
        
        const westWinners = bracket.confSemis
            .filter(s => s.conference === 'West')
            .map(s => ({ team: s.winner!, seed: s.homeSeed < s.awaySeed ? s.homeSeed : s.awaySeed }))
            .sort((a, b) => a.seed - b.seed);
        
        const confFinalsStart = addDaysISO(calendar.nbaPlayoffsStart, 28);
        
        return {
            ...bracket,
            confFinals: [
                createPlayoffSeries(eastWinners[0].team, eastWinners[1].team, eastWinners[0].seed, eastWinners[1].seed, confFinalsStart, 'East', 'conf_finals'),
                createPlayoffSeries(westWinners[0].team, westWinners[1].team, westWinners[0].seed, westWinners[1].seed, confFinalsStart, 'West', 'conf_finals'),
            ],
        };
    }
    
    // Check if conf finals complete -> generate finals
    if (isRoundComplete(bracket.confFinals) && bracket.finals === null) {
        const eastChamp = bracket.confFinals.find(s => s.conference === 'East')?.winner;
        const westChamp = bracket.confFinals.find(s => s.conference === 'West')?.winner;
        
        if (eastChamp && westChamp) {
            const finalsStart = calendar.nbaFinalsStart;
            
            return {
                ...bracket,
                finals: createPlayoffSeries(eastChamp, westChamp, 1, 1, finalsStart, 'Finals', 'finals'),
            };
        }
    }
    
    // Check if finals complete -> set champion
    if (bracket.finals && bracket.finals.winner && !bracket.champion) {
        return {
            ...bracket,
            champion: bracket.finals.winner,
        };
    }
    
    return bracket;
};

