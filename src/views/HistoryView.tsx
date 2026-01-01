import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type {
    GameState,
    GameAction,
    TeamColors,
    UserSeasonRecord,
    TeamHistory,
    HeadCoachProfile,
    NBADraftHistoryEntry,
    NBATransaction,
    Player,
    Team,
    ChampionRecord,
    NilNegotiationStatus,
} from '../types';
import { getSchoolLogoUrl } from '../services/utils';
import { getTeamLogoUrl, getTeamAbbreviation } from '../services/gameReducer';
import * as constants from '../constants';
import { styles } from '../styles';
import { formatCurrency } from '../services/gameService';

const { SCHOOLS, NBA_TEAMS, SCHOOL_COLORS, BASE_CALENDAR_YEAR, NBA_ACRONYM_TO_NAME } = constants;
import SchoolHistoryModal from '../components/modals/SchoolHistoryModal';
import CoachProfileModal from '../components/modals/CoachProfileModal';
import { getGameDateString } from '../services/calendarService';

// Deterministic random generator based on team name
const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const getDeterministicNBATeam = (seedStr: string): string => {
    const seed = hashCode(seedStr);
    const nbaTeamInfo = NBA_TEAMS[seed % NBA_TEAMS.length];
    return nbaTeamInfo ? nbaTeamInfo.name : 'Los Angeles Lakers';
};

const History = ({ state, colors, onSeasonClick, onSelectNbaTeam, dispatch }: { state: GameState, colors: TeamColors, onSeasonClick: (record: UserSeasonRecord) => void, onSelectNbaTeam?: (team: any) => void, dispatch: React.Dispatch<GameAction> }) => {
    const formatSeason = (season: number) => `${2024 + season}-${(2025 + season) % 100}`;
    const selectedTab = state.historyTab || 'myCareer';
    const setSelectedTab = (tab: typeof selectedTab) => dispatch({ type: 'SET_HISTORY_TAB', payload: tab });
    const selectedNbaTab = state.nbaHistoryTab || 'drafts';
    const setSelectedNbaTab = (tab: typeof selectedNbaTab) => dispatch({ type: 'SET_NBA_HISTORY_TAB', payload: tab });
    const [selectedTeam, setSelectedTeam] = useState<string>(state.userTeam?.name || SCHOOLS[0]);
    const [selectedSeason, setSelectedSeason] = useState(state.season);
    const [selectedDraftSeason, setSelectedDraftSeason] = useState<number | null>(null);
    const [selectedSchoolName, setSelectedSchoolName] = useState<string | null>(null);
    const [selectedCoachProfile, setSelectedCoachProfile] = useState<{ coach: HeadCoachProfile; teamName?: string; historyEntries: (TeamHistory & { teamName: string })[] } | null>(null);
    const [showRetiredCoaches, setShowRetiredCoaches] = useState(false);
    type CoachDirectorySortColumn =
        | 'team'
        | 'prestige'
        | 'coach'
        | 'style'
        | 'tenure'
        | 'careerWins'
        | 'careerLosses'
        | 'careerWinPct'
        | 'season'
        | 'reputation';
    const [coachDirectorySort, setCoachDirectorySort] = useState<{ column: CoachDirectorySortColumn; direction: 'asc' | 'desc' }>({ column: 'team', direction: 'asc' });
    const latestDraftEntry = useMemo(() => {
        if (!state.history?.nbaDrafts?.length) return null;
        return [...state.history.nbaDrafts].sort((a, b) => b.season - a.season)[0];
    }, [state.history?.nbaDrafts]);
    const nbaAlumniCount = useMemo(() => {
        if (!state.userTeam) return 0;
        const teamName = state.userTeam.name;
        const tenureStart = (() => {
            const stops = state.coach?.careerStops;
            if (stops && stops.length) {
                const activeStop = [...stops].reverse().find(stop => stop.teamName === teamName);
                if (activeStop) return activeStop.startSeason;
            }
            return state.coach?.startSeason ?? state.season;
        })();
        return state.history.nbaDrafts.reduce((sum, draft) => {
            if (draft.season < tenureStart) return sum;
            const draftedThisSeason = draft.picks.filter(pick => pick.originalTeam === teamName).length;
            return sum + draftedThisSeason;
        }, 0);
    }, [state.userTeam, state.history.nbaDrafts, state.coach?.careerStops, state.coach?.startSeason, state.season]);
    const nbaSummaryCards = [
        {
            label: 'Latest Champion',
            value: latestDraftEntry?.nbaChampion || 'TBD',
            meta: latestDraftEntry ? `Season ${formatSeason(latestDraftEntry.season)}` : `Season ${formatSeason(state.season)}`
        },
        {
            label: 'Program Alumni In NBA',
            value: nbaAlumniCount.toString(),
            meta: 'Players drafted under you'
        },
        {
            label: 'Transactions Logged',
            value: (state.nbaTransactions?.length || 0).toString(),
            meta: 'This season'
        },
        {
            label: 'Free Agents Available',
            value: (state.nbaFreeAgents?.length || 0).toString(),
            meta: 'CPU movement ready'
        }
    ];
    const nbaTabs: Array<{ key: typeof selectedNbaTab; label: string; description: string }> = [
        { key: 'drafts', label: 'Draft Hub', description: 'Picks, champions, and origins' },
        { key: 'standings', label: 'Power Table', description: 'Conference hierarchy & cap health' },
        { key: 'rosters', label: 'Alumni Tracker', description: 'Where your players landed' },
        { key: 'stats', label: 'Leaderboard', description: 'Top performers this season' },
        { key: 'transactions', label: 'Wire Log', description: 'Trades, cuts, and signings' },
        { key: 'freeAgency', label: 'Free-Agent Board', description: 'Best talent still unsigned' },
    ];
    const nbaStyles = {
        viewport: { display: 'flex', flexDirection: 'column' as const, gap: '15px' },
        summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
        summaryCard: {
            border: '1px solid #dfe2eb',
            borderRadius: '6px',
            backgroundColor: '#f7f9ff',
            padding: '10px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
        },
        summaryLabel: { fontSize: '0.55rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: 0, color: '#4a4a4a' },
        summaryValue: { fontSize: '1rem', margin: '2px 0', color: colors.primary },
        summaryMeta: { fontSize: '0.6rem', margin: 0, color: '#666' },
        subNav: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px' },
        subNavButton: {
            flex: '1 1 160px',
            borderRadius: '6px',
            padding: '10px 12px',
            border: '1px solid #c5cad5',
            backgroundColor: '#f8f8f8',
            color: '#333',
            textAlign: 'left' as const,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.55rem',
        },
        subNavLabel: { display: 'block', fontSize: '0.65rem', marginBottom: '4px' },
        subNavDescription: { fontSize: '0.5rem', color: '#4c4c4c', lineHeight: 1.4 },
        card: {
            borderRadius: '8px',
            border: '1px solid #dfe2eb',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            overflow: 'hidden',
        },
        cardHeader: {
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap' as const,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e3e6ef',
            backgroundColor: '#f4f7ff',
        },
        cardHeaderTitles: { display: 'flex', flexDirection: 'column' as const, gap: '3px' },
        cardTitle: { margin: 0, fontSize: '0.75rem', letterSpacing: '0.05em' },
        cardSubtitle: { margin: 0, fontSize: '0.6rem', color: '#4c4c4c' },
        cardBody: { padding: '12px 16px' },
        select: { ...styles.select, margin: 0, minWidth: '180px' },
        dualColumn: { display: 'flex', gap: '20px', flexWrap: 'wrap' as const },
    };
    const championBySeason = useMemo(() => {
        const map = new Map<number, ChampionRecord>();
        (state.history?.champions || []).forEach(champ => map.set(champ.season, champ));
        return map;
    }, [state.history?.champions]);
    const getTeamDraftPicks = (teamName?: string) => {
        if (!teamName) return [];
        const inGamePicks = (state.history?.nbaDrafts || []).flatMap(entry =>
            entry.picks
                .filter(p => p.originalTeam === teamName)
                .map(p => ({
                    season: entry.season,
                    round: p.round,
                    status: 'pending' as NilNegotiationStatus,
                    pick: p.pick,
                    player: p.player.name,
                    nbaTeam: p.nbaTeam,
                }))
        );

        // FIX: Removed random historical player generation. 
        // We now rely on the real data in state.history.nbaDrafts which goes back to 1969.
        // This prevents "random" players from being mixed in with real players.
        
        return inGamePicks.sort((a, b) => b.season - a.season);
    };
    const buildCoachHistoryEntries = (coach: HeadCoachProfile): (TeamHistory & { teamName: string })[] => {
        const stops = coach.careerStops && coach.careerStops.length
            ? coach.careerStops
            : (coach.lastTeam ? [{ teamName: coach.lastTeam, startSeason: coach.startSeason }] : []);
        const entries: (TeamHistory & { teamName: string })[] = [];
        const seen = new Set<string>();
        stops.forEach(stop => {
            const startSeason = stop.startSeason ?? coach.startSeason ?? 1;
            const endSeason = stop.endSeason ?? state.season;
            const records = state.history.teamHistory[stop.teamName] || [];
            records.forEach(entry => {
                if (entry.season >= startSeason && entry.season <= endSeason) {
                    const key = `${stop.teamName}-${entry.season}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        entries.push({ ...entry, teamName: stop.teamName });
                    }
                }
            });
        });
        return entries.sort((a, b) => b.season - a.season);
    };

    useEffect(() => {
        if (state.history?.nbaDrafts && state.history.nbaDrafts.length > 0) {
            const latest = Math.max(...state.history.nbaDrafts.map(d => d.season));
            if (selectedDraftSeason === null || !state.history.nbaDrafts.some(d => d.season === selectedDraftSeason)) {
                setSelectedDraftSeason(latest);
            }
        }
    }, [state.history?.nbaDrafts, selectedDraftSeason]);

    const buttonTextColorForInactive = (colors.secondary.toUpperCase() === '#FFFFFF' && colors.text.toUpperCase() === '#FFFFFF') ? colors.primary : colors.text;
    const selectedSchoolTeam = selectedSchoolName ? state.allTeams.find(t => t.name === selectedSchoolName) || null : null;
    const schoolHistoryEntries = useMemo(() => {
        if (!selectedSchoolName) return [];
        const entries = state.history?.teamHistory?.[selectedSchoolName] || [];
        return [...entries].sort((a, b) => b.season - a.season);
    }, [selectedSchoolName, state.history?.teamHistory]);
    const schoolDraftPicks = useMemo(() => getTeamDraftPicks(selectedSchoolName), [selectedSchoolName, state.history?.nbaDrafts]);
    const schoolChampionships = useMemo(() => {
        if (!selectedSchoolName) return 0;
        return (state.history?.champions || []).filter(champ => champ.teamName === selectedSchoolName).length;
    }, [selectedSchoolName, state.history?.champions]);

    const getCoachProfileForTeam = useCallback((team: Team) => {
        const headCoach = team.headCoach;
        if (!headCoach) return null;
        if (team.isUserTeam && state.coach) {
            const pastWins = state.coach.history.reduce((acc, h) => acc + h.wins, 0);
            const pastLosses = state.coach.history.reduce((acc, h) => acc + h.losses, 0);
            const currentWins = team.record.wins;
            const currentLosses = team.record.losses;
            return { 
                ...headCoach, 
                reputation: state.coach.reputation,
                age: state.coach.age,
                almaMater: state.coach.almaMater,
                style: state.coach.style,
                startSeason: state.coach.startSeason,
                seasons: state.coach.history.length + 1,
                careerWins: pastWins + currentWins,
                careerLosses: pastLosses + currentLosses,
                seasonWins: currentWins,
                seasonLosses: currentLosses,
                careerStops: state.coach.careerStops,
                history: state.coach.history,
             };
        }
        return headCoach;
    }, [state.coach]);

    const getCoachTenureSeasons = useCallback((team: Team) => {
        const coach = getCoachProfileForTeam(team);
        if (!coach) return 0;
        const stops = coach.careerStops || [];
        const currentStop = [...stops].reverse().find(stop => stop.teamName === team.name);
        if (!currentStop) {
            return Math.max(1, coach.seasons || 1);
        }
        const endSeason = currentStop.endSeason ?? state.season;
        return Math.max(1, endSeason - currentStop.startSeason + 1);
    }, [getCoachProfileForTeam, state.season]);
    const getCoachSortValue = useCallback((team: Team, column: CoachDirectorySortColumn) => {
        const coach = getCoachProfileForTeam(team);
        switch (column) {
            case 'team':
                return team.name;
            case 'prestige':
                return team.prestige;
            case 'coach':
                return coach?.name || '';
            case 'style':
                return coach?.style || '';
            case 'tenure':
                return getCoachTenureSeasons(team);
            case 'careerWins':
                return coach?.careerWins ?? 0;
            case 'careerLosses':
                return coach?.careerLosses ?? 0;
            case 'careerWinPct': {
                if (!coach) return 0;
                const total = coach.careerWins + coach.careerLosses;
                return total > 0 ? coach.careerWins / total : 0;
            }
            case 'season': {
                if (!coach) return 0;
                const total = coach.seasonWins + coach.seasonLosses;
                return total > 0 ? coach.seasonWins / total : coach.seasonWins;
            }
            case 'reputation':
                return coach?.reputation ?? 0;
        }
    }, [getCoachProfileForTeam, getCoachTenureSeasons]);
    const sortedCoachDirectoryTeams = useMemo(() => {
        const direction = coachDirectorySort.direction === 'asc' ? 1 : -1;
        const column = coachDirectorySort.column;
        const bySorted = [...state.allTeams].sort((a, b) => {
            if (column === 'careerWinPct') {
                const winsA = a.headCoach?.careerWins ?? 0;
                const lossesA = a.headCoach?.careerLosses ?? 0;
                const winsB = b.headCoach?.careerWins ?? 0;
                const lossesB = b.headCoach?.careerLosses ?? 0;
                const pctA = winsA + lossesA > 0 ? winsA / (winsA + lossesA) : 0;
                const pctB = winsB + lossesB > 0 ? winsB / (winsB + lossesB) : 0;
                if (pctA !== pctB) {
                    return direction * (pctA - pctB);
                }
                if (winsA !== winsB) {
                    return direction * (winsA - winsB);
                }
                return 0;
            }
            const valueA = getCoachSortValue(a, column);
            const valueB = getCoachSortValue(b, column);
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction * ((valueA ?? -Infinity) - (valueB ?? -Infinity));
            }
            return direction * String(valueA ?? '').localeCompare(String(valueB ?? ''));
        });
        if (state.userTeam) {
            const userIndex = bySorted.findIndex(team => team.name === state.userTeam?.name);
            if (userIndex > 0) {
                const [userTeamEntry] = bySorted.splice(userIndex, 1);
                bySorted.unshift(userTeamEntry);
            }
        }
        return bySorted;
    }, [state.allTeams, coachDirectorySort, getCoachSortValue, state.userTeam]);
    const toggleCoachSort = (column: CoachDirectorySortColumn) => {
        setCoachDirectorySort(prev => prev.column === column ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { column, direction: 'asc' });
    };
    const sortIndicator = (column: CoachDirectorySortColumn) => coachDirectorySort.column === column ? (coachDirectorySort.direction === 'asc' ? '?' : '?') : '';

    const renderMyCareer = () => {
        const draftPickTotal = (state.coach?.history || []).reduce((sum, rec) => {
            const draftEntry = state.history?.nbaDrafts?.find(d => d.season === rec.season);
            if (!draftEntry) return sum;
            return sum + draftEntry.picks.filter(p => p.originalTeam === rec.teamName).length;
        }, 0);

        const totals = (state.coach?.history || []).reduce(
            (acc, rec) => {
                acc.wins += rec.wins;
                acc.losses += rec.losses;
                acc.net += rec.totalRevenue - rec.operationalExpenses;
                acc.salary += rec.salary;

                let highestStage = -1; // -1 = none, 0 = tournament, 1 = R32, 2 = S16, 3 = E8, 4 = F4, 5 = Runner-Up, 6 = Champ
                const achievementBlob = rec.achievements.join(' ').toLowerCase();

                if (achievementBlob.includes('champion')) highestStage = Math.max(highestStage, 6);
                else if (achievementBlob.includes('runner-up') || achievementBlob.includes('runner up')) highestStage = Math.max(highestStage, 5);
                else if (achievementBlob.includes('final four')) highestStage = Math.max(highestStage, 4);
                else if (achievementBlob.includes('elite 8') || achievementBlob.includes('elite eight')) highestStage = Math.max(highestStage, 3);
                else if (achievementBlob.includes('sweet 16')) highestStage = Math.max(highestStage, 2);
                else if (achievementBlob.includes('round of 32')) highestStage = Math.max(highestStage, 1);
                else if (achievementBlob.includes('tournament appearance')) highestStage = Math.max(highestStage, 0);

                if (highestStage >= 0) acc.achievements.tournamentAppearances++;
                if (highestStage >= 1) acc.achievements.roundOf32++;
                if (highestStage >= 2) acc.achievements.sweet16++;
                if (highestStage >= 3) acc.achievements.elite8++;
                if (highestStage >= 4) acc.achievements.final4++;
                if (highestStage >= 5) acc.achievements.runnerUp++;
                if (highestStage >= 6) acc.achievements.championships++;

                return acc;
            },
            { wins: 0, losses: 0, net: 0, salary: 0, achievements: { tournamentAppearances: 0, roundOf32: 0, sweet16: 0, elite8: 0, final4: 0, runnerUp: 0, championships: 0, draftPicks: 0 } }
        );
        totals.achievements.draftPicks = draftPickTotal;

        const achievementSummaryParts: string[] = [];
        if (totals.achievements.tournamentAppearances) achievementSummaryParts.push(`Tournament Apps: ${totals.achievements.tournamentAppearances}`);
        if (totals.achievements.roundOf32) achievementSummaryParts.push(`Round of 32: ${totals.achievements.roundOf32}`);
        if (totals.achievements.sweet16) achievementSummaryParts.push(`Sweet 16: ${totals.achievements.sweet16}`);
        if (totals.achievements.elite8) achievementSummaryParts.push(`Elite 8: ${totals.achievements.elite8}`);
        if (totals.achievements.final4) achievementSummaryParts.push(`Final Four: ${totals.achievements.final4}`);
        if (totals.achievements.runnerUp) achievementSummaryParts.push(`Runner-Up: ${totals.achievements.runnerUp}`);
        if (totals.achievements.championships) achievementSummaryParts.push(`Titles: ${totals.achievements.championships}`);
        if (totals.achievements.draftPicks) achievementSummaryParts.push(`NBA Picks: ${totals.achievements.draftPicks}`);
        const achievementSummary = achievementSummaryParts.length ? achievementSummaryParts.join(' | ') : 'None yet';

        return (
            <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Season</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>School</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Record</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Salary</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Achievements</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>NCAA Title Game</th>
                        <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Totals</th>
                    </tr>
                </thead>
                <tbody>
                    {state.coach?.history.map(record => {
                        const championEntry = championBySeason.get(record.season);
                        const hasRealChampion = championEntry && championEntry.teamName !== 'No Champion';
                        const isChampion = hasRealChampion && championEntry?.teamName === record.teamName;
                        return (
                            <tr key={`${record.season}-${record.teamName}`}>
                                <td style={styles.td}>{formatSeason(record.season)}</td>
                                <td style={styles.td}>{record.teamName}</td>
                                <td style={styles.td}>{record.wins}-{record.losses}</td>
                                <td style={styles.td}>{formatCurrency(record.salary)}</td>
                                <td style={styles.td}>{record.achievements.join(', ') || '-'}</td>
                                <td style={{
                                    ...styles.td,
                                    fontWeight: isChampion ? 'bold' : 'normal',
                                    color: isChampion ? colors.primary : styles.td.color || '#000000'
                                }}>
                                    {hasRealChampion && championEntry?.teamName ? (
                                        <>
                                            {championEntry.teamName}
                                            {championEntry.runnerUpTeamName && (
                                                <>
                                                    <br />
                                                    <span style={{ fontWeight: 'normal' }}>
                                                        over {championEntry.runnerUpTeamName}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    ) : 'N/A'}
                                </td>
                                <td style={styles.td}>
                                    Wins: {record.wins}<br/>
                                    Losses: {record.losses}<br/>
                                    Net: {formatCurrency(record.totalRevenue - record.operationalExpenses)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <td style={{...styles.td, fontWeight: 'bold'}} colSpan={2}>Career Totals</td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>
                            {totals.wins}-{totals.losses}
                        </td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{formatCurrency(totals.salary)}</td>
                        <td style={{...styles.td, fontSize: '0.65rem', lineHeight: 1.4}}>{achievementSummary}</td>
                        <td style={{...styles.td}}></td>
                        <td style={{...styles.td, fontWeight: 'bold'}}>
                            Wins: {totals.wins}<br/>
                            Losses: {totals.losses}<br/>
                            Net: {formatCurrency(totals.net)}<br/>
                            NBA Picks: {totals.achievements.draftPicks}
                        </td>
                    </tr>
                </tfoot>
            </table>
            </div>
        );
    };

    const renderTeamRecords = () => {
        const teamHistory = state.history.teamHistory[selectedTeam] || [];
        return (
            <div>
                <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} style={{...styles.select, marginBottom: '10px', width: '100%'}}>
                    {[...SCHOOLS].sort((a, b) => a.localeCompare(b)).map(school => <option key={school} value={school}>{school}</option>)}
                </select>
                <div style={styles.tableContainer}>
                <table style={styles.table}>
                     <thead>
                        <tr>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Season</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Rank</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Prestige</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Champion</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Runner-Up</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamHistory.map(record => {
                            const championEntry = championBySeason.get(record.season);
                            const hasRealChampion = championEntry && championEntry.teamName !== 'No Champion';
                            const isChampion = hasRealChampion && championEntry?.teamName === selectedTeam;
                            const isRunnerUp = hasRealChampion && championEntry?.runnerUpTeamName === selectedTeam;
                            const championLabel = hasRealChampion ? championEntry?.teamName : 'N/A';
                            const runnerUpLabel = hasRealChampion ? (championEntry?.runnerUpTeamName || 'N/A') : 'N/A';
                            return (
                                <tr key={record.season}>
                                    <td style={styles.td}>{formatSeason(record.season)}</td>
                                    <td style={styles.td}>#{record.rank}</td>
                                    <td style={styles.td}>{record.prestige}</td>
                                    <td style={{
                                        ...styles.td,
                                        fontWeight: isChampion ? 'bold' : 'normal',
                                        color: isChampion ? colors.primary : styles.td.color || '#000000'
                                    }}>
                                        {championLabel}
                                    </td>
                                    <td style={{
                                        ...styles.td,
                                        fontWeight: isRunnerUp ? 'bold' : 'normal',
                                        color: isRunnerUp ? colors.primary : styles.td.color || '#000000'
                                    }}>
                                        {runnerUpLabel}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
            </div>
        );
    };

    const renderNationalRankings = () => {
        const rankingsForSeason = Object.entries(state.history.teamHistory)
            .map(([teamName, history]) => {
                const entry = history.find(h => h.season === selectedSeason);
                if (!entry) return null;
                const team = state.allTeams.find(t => t.name === teamName);
                const conference = team?.conference || 'Independent';
                const conferenceTeams = state.allTeams.filter(t => t.conference === conference);
                const conferenceRank = conferenceTeams
                    .map(t => {
                        const teamHistoryEntry = state.history.teamHistory[t.name]?.find(h => h.season === selectedSeason);
                        return {
                            name: t.name,
                            confRank: teamHistoryEntry?.rank || Infinity,
                        };
                    })
                    .sort((a, b) => a.confRank - b.confRank)
                    .findIndex(t => t.name === teamName) + 1;
                return { teamName, ...entry, conference, conferenceRank };
            })
            .filter((t): t is { teamName: string; season: number; prestige: number; rank: number; totalRevenue: number; projectedRevenue: number; conference: string; conferenceRank: number } => !!t && !!t.rank && t.rank > 0)
            .sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity))
            .slice(0, 25);
        
        const availableSeasons = Array.from(new Set(Object.values(state.history.teamHistory).flat().map(h => h.season))).sort((a, b) => b - a);
        
        return (
             <div>
                <select value={selectedSeason} onChange={(e) => setSelectedSeason(parseInt(e.target.value, 10))} style={{...styles.select, marginBottom: '10px', width: '100%'}}>
                    {availableSeasons.map(s => (
                        <option key={s} value={s}>{`Season ${formatSeason(s)}`}</option>
                    ))}
                </select>
                <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Rank</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Team</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Conference</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Prestige</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankingsForSeason.map(t => (
                            <tr key={t.teamName}>
                                <td style={styles.td}>#{t.rank}</td>
                                <td style={styles.td}>{t.teamName}</td>
                                <td style={styles.td}>{t.conference} {isNaN(t.conferenceRank) || !isFinite(t.conferenceRank) ? '' : `(#{t.conferenceRank})`}</td>
                                <td style={styles.td}>{t.prestige}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        );
    };

    const renderDraftHistory = () => {
        if (!state.history.nbaDrafts.length) {
            return <p style={{ fontSize: '0.8rem' }}>No NBA drafts have been recorded yet.</p>;
        }
        console.log('Available Draft Seasons:', state.history.nbaDrafts.map(d => d.season));
        const seasons = [...state.history.nbaDrafts.map(d => d.season)].sort((a, b) => b - a);
        console.log('Draft History Debug:', { 
            selectedDraftSeason, 
            seasons, 
            hasZero: seasons.includes(0),
            firstSeason: seasons[0]
        });
        const activeSeason = (selectedDraftSeason !== null && seasons.includes(selectedDraftSeason)) ? selectedDraftSeason : seasons[0];
        const draftEntry = state.history.nbaDrafts.find(d => d.season === activeSeason) || state.history.nbaDrafts[state.history.nbaDrafts.length - 1];
        const championRecord = state.history.champions.find(c => c.season === activeSeason);
        const championName = draftEntry.nbaChampion || championRecord?.teamName || 'TBD';

        const seenPlayers = new Set<string>();
        const uniqueSeasonPicks = draftEntry.picks.filter(pick => {
            const playerId = pick.player?.id || `${pick.nbaTeam}-${pick.pick}`;
            if (seenPlayers.has(playerId)) {
                return false;
            }
            seenPlayers.add(playerId);
            return true;
        });

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Draft Ledger</h4>
                        <p style={nbaStyles.cardSubtitle}>Season {formatSeason(activeSeason)} � NBA Champion {championName}</p>
                    </div>
                    <select
                        value={activeSeason}
                        onChange={(e) => setSelectedDraftSeason(parseInt(e.target.value, 10))}
                        style={nbaStyles.select}
                    >
                        {seasons.map(s => (
                            <option key={s} value={s}>{`Season ${formatSeason(s)}`}</option>
                        ))}
                    </select>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 4 }}>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pick</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>NBA Team</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Origin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueSeasonPicks.map(pick => {
                                    const nbaTeamName = pick.nbaTeam === 'Unknown'
                                        ? getDeterministicNBATeam(`${draftEntry.season}-${pick.round}-${pick.pick}`)
                                        : pick.nbaTeam;
                                    const slotAcronym =
                                        pick.slotTeam && pick.slotTeam !== nbaTeamName
                                            ? getTeamAbbreviation(pick.slotTeam)
                                            : null;

                                    return (
                                        <tr key={`${draftEntry.season}-${pick.pick}`}>
                                            <td style={styles.td}>{pick.pick > 60 ? 'Undrafted' : `R${pick.round} #${pick.pick}`}</td>
                                            <td style={styles.td}>
                                                {nbaTeamName}
                                                {slotAcronym && (
                                                    <span style={{ marginLeft: '4px', fontSize: '0.6rem', color: '#555' }}>
                                                        via {slotAcronym}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={styles.td}>{pick.player.name} ({pick.player.position})</td>
                                            <td style={styles.td}>{pick.originDescription}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };

    const renderNbaStandings = () => {
        const teamsSource = state.nbaTeams && state.nbaTeams.length > 0 ? state.nbaTeams : (state.currentNBASimulation?.teams || []);
        if (teamsSource.length === 0) return <p style={{ fontSize: '0.8rem' }}>No NBA data available.</p>;

        const getStandingsData = (team: any) => {
            const roster = team.roster || [];
            const payroll = roster.reduce((sum: number, p: any) => sum + (p.contract?.salary || 0), 0);
            const capSpace = (constants.NBA_SALARY_CAP_2025 || 154647000) - payroll;
            
            return {
                name: team.name,
                wins: team.wins ?? team.record?.wins ?? 0,
                losses: team.losses ?? team.record?.losses ?? 0,
                rating: team.rating ?? team.prestige ?? 75,
                conference: team.conference ?? (team.division === 'West' ? 'West' : 'East'),
                capSpace: capSpace,
                taxBill: Math.max(0, payroll - (constants.NBA_LUXURY_TAX_THRESHOLD_2025 || 187895000)) // Estimate tax bill
            };
        };

        const allTeams = teamsSource.map(getStandingsData);
        const eastTeams = allTeams.filter(t => t.conference === 'East').sort((a, b) => b.wins - a.wins);
        const westTeams = allTeams.filter(t => t.conference === 'West').sort((a, b) => b.wins - a.wins);

        const renderConfTable = (title: string, teams: typeof eastTeams) => (
            <div style={{ flex: 1, minWidth: '320px' }}>
                <h5 style={{ margin: '0 0 10px', fontSize: '0.65rem', color: '#4a4a4a', letterSpacing: '0.05em' }}>{title}</h5>
                <table style={{ ...styles.table, fontSize: '0.7rem' }}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Team</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>W</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>L</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Cap Space</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Tax Bill</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((t, i) => (
                            <tr key={t.name}>
                                <td style={{ ...styles.td, fontWeight: 'bold' }}>
                                    {onSelectNbaTeam ? (
                                        <button
                                            onClick={() => onSelectNbaTeam(teamsSource.find(team => team.name === t.name))}
                                            style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontFamily: 'inherit' }}
                                        >
                                            {i + 1}. {NBA_ACRONYM_TO_NAME[t.name] || t.name}
                                        </button>
                                    ) : (
                                        <>{i + 1}. {NBA_ACRONYM_TO_NAME[t.name] || t.name}</>
                                    )}
                                </td>
                                <td style={styles.td}>{t.wins}</td>
                                <td style={styles.td}>{t.losses}</td>
                                <td style={{ ...styles.td, color: (t.capSpace || 0) < 0 ? '#c62828' : '#1b5e20' }}>
                                    {t.capSpace !== undefined ? formatCurrency(t.capSpace) : '-'}
                                </td>
                                <td style={{ ...styles.td, color: '#c62828' }}>
                                    {t.taxBill && t.taxBill > 0 ? formatCurrency(t.taxBill) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Power Table</h4>
                        <p style={nbaStyles.cardSubtitle}>Live standings with cap posture</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 16 }}>
                    <div style={nbaStyles.dualColumn}>
                        {renderConfTable('Eastern Conference', eastTeams)}
                        {renderConfTable('Western Conference', westTeams)}
                    </div>
                </div>
            </section>
        );
    };

    const renderNbaRosters = () => {
        const nbaTeamsSource = state.nbaTeams && state.nbaTeams.length > 0 ? state.nbaTeams : (state.currentNBASimulation?.teams || []);
        const currentSalaryByPlayerId = new Map<string, number>();
        const currentTeamByPlayerId = new Map<string, string>();
        const currentOverallByPlayerId = new Map<string, number>();
        nbaTeamsSource.forEach(team => {
            (team.roster || []).forEach(player => {
                const salary = player.contract?.salary;
                if (typeof salary === 'number' && salary > 0) {
                    currentSalaryByPlayerId.set(player.id, salary);
                }
                currentTeamByPlayerId.set(player.id, team.name);
                if (typeof (player as any).overall === 'number') {
                    currentOverallByPlayerId.set(player.id, (player as any).overall);
                }
            });
        });

        const alumniInNba = (state.history?.nbaDrafts || []).flatMap(d => d.picks)
            .filter(p => p.originalTeam === state.userTeam?.name)
            .sort((a, b) => b.season - a.season);

        if (!alumniInNba.length) {
             return <p style={{ fontSize: '0.8rem' }}>No alumni currently in the NBA.</p>;
        }

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Alumni Tracker</h4>
                        <p style={nbaStyles.cardSubtitle}>Active players drafted from {state.userTeam?.name || 'your program'}</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 0 }}>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Draft Year</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Drafted By</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Current Team</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pick</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>OVR</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alumniInNba.map((p, i) => {
                                    const salary = currentSalaryByPlayerId.get(p.player.id);
                                    const currentTeam = currentTeamByPlayerId.get(p.player.id);
                                    const currentOverall = currentOverallByPlayerId.get(p.player.id);
                                    return (
                                        <tr key={i}>
                                            <td style={styles.td}>{p.player.name}</td>
                                            <td style={styles.td}>{formatSeason(p.season)}</td>
                                            <td style={styles.td}>{NBA_ACRONYM_TO_NAME[p.nbaTeam] || p.nbaTeam}</td>
                                            <td style={styles.td}>{currentTeam ? (NBA_ACRONYM_TO_NAME[currentTeam] || currentTeam) : '-'}</td>
                                            <td style={styles.td}>{p.pick > 60 ? 'Undrafted' : `R${p.round} #${p.pick}`}</td>
                                            <td style={styles.td}>{typeof currentOverall === 'number' ? currentOverall : '-'}</td>
                                            <td style={styles.td}>{typeof salary === 'number' ? formatCurrency(salary) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };

    const renderNbaStats = () => {
        // Use live teams if available, otherwise fallback to simulation
        const teamsSource = state.nbaTeams && state.nbaTeams.length > 0 ? state.nbaTeams : (state.currentNBASimulation?.teams || []);
        
        if (teamsSource.length === 0) return <p style={{ fontSize: '0.8rem' }}>No NBA data available.</p>;

        const allPlayers = teamsSource.flatMap(t => t.roster.map(p => ({ ...p, teamName: t.name })));
        
        // Filter players with stats and sort by PPG
        const leaders = allPlayers
            .filter(p => p.nbaStats && p.nbaStats.gamesPlayed > 0)
            .sort((a, b) => (b.nbaStats!.points / b.nbaStats!.gamesPlayed) - (a.nbaStats!.points / a.nbaStats!.gamesPlayed))
            .slice(0, 50);

        if (leaders.length === 0) return <p style={{ fontSize: '0.8rem' }}>No stats available yet. Simulate further into the season.</p>;

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>League Leaders</h4>
                        <p style={nbaStyles.cardSubtitle}>Top 50 scorers with per-game splits</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 0 }}>
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Rank</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Team</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>GP</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MIN</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>PTS</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>REB</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>AST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaders.map((p, i) => {
                                    const gp = p.nbaStats!.gamesPlayed;
                                    return (
                                        <tr key={p.id}>
                                            <td style={styles.td}>#{i + 1}</td>
                                            <td style={styles.td}>{p.name} <span style={{fontSize: '0.6rem', color: '#666'}}>({p.position})</span></td>
                                            <td style={styles.td}>{NBA_ACRONYM_TO_NAME[p.teamName] || p.teamName}</td>
                                            <td style={styles.td}>{gp}</td>
                                            <td style={styles.td}>{(p.nbaStats!.minutes / gp).toFixed(1)}</td>
                                            <td style={styles.td}>{(p.nbaStats!.points / gp).toFixed(1)}</td>
                                            <td style={styles.td}>{(p.nbaStats!.rebounds / gp).toFixed(1)}</td>
                                            <td style={styles.td}>{(p.nbaStats!.assists / gp).toFixed(1)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };



    const renderRetiredCoaches = () => {
        if (!state.retiredCoaches.length) {
            return <p style={{ fontSize: '0.75rem' }}>No coaches have retired yet.</p>;
        }
        const sorted = [...state.retiredCoaches].sort((a, b) => (b.retiredSeason || 0) - (a.retiredSeason || 0));
        return (
            <div style={styles.tableContainer}>
                <table style={{ ...styles.table, fontSize: '0.6rem', minWidth: '720px' }}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Coach</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Retired</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Last Team</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Record</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Style</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Reputation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((coach, index) => (
                            <tr key={`${coach.name}-${index}`}>
                                <td style={styles.td}>
                                    <button
                                        style={styles.tableLinkButton}
                                        onClick={() => setSelectedCoachProfile({
                                            coach,
                                            teamName: coach.lastTeam,
                                            historyEntries: buildCoachHistoryEntries(coach),
                                            nbaDrafts: state.history.nbaDrafts || [],
                                        })}
                                    >
                                        {coach.name}
                                    </button>
                                </td>
                                <td style={styles.td}>{coach.retiredSeason ? formatSeason(coach.retiredSeason) : '—'}</td>
                                <td style={styles.td}>{coach.lastTeam || '—'}</td>
                                <td style={styles.td}>{coach.careerWins}-{coach.careerLosses}</td>
                                <td style={styles.td}>{coach.style}</td>
                                <td style={styles.td}>{coach.reputation}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderCoachDirectory = () => {
    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.7rem' }}>
                    <input
                        type="checkbox"
                        checked={showRetiredCoaches}
                        onChange={e => setShowRetiredCoaches(e.target.checked)}
                        style={{ marginRight: '6px' }}
                    />
                    Show retired coaches
                </label>
            </div>
            {showRetiredCoaches ? renderRetiredCoaches() : (
                <div style={styles.tableContainer}>
                    <table style={{ ...styles.table, fontSize: '0.6rem', minWidth: '880px' }}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('team')}>
                                        Team {sortIndicator('team')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('prestige')}>
                                        Prestige {sortIndicator('prestige')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('coach')}>
                                        Head Coach {sortIndicator('coach')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('style')}>
                                        Style {sortIndicator('style')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('tenure')}>
                                        Tenure {sortIndicator('tenure')}
                                    </button>
                                </th>
                        <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                            <button style={styles.tableSortButton} onClick={() => toggleCoachSort('careerWins')}>
                                Career Wins {sortIndicator('careerWins')}
                            </button>
                        </th>
                        <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                            <button style={styles.tableSortButton} onClick={() => toggleCoachSort('careerLosses')}>
                                Losses {sortIndicator('careerLosses')}
                            </button>
                        </th>
                        <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                            <button style={styles.tableSortButton} onClick={() => toggleCoachSort('careerWinPct')}>
                                Win % {sortIndicator('careerWinPct')}
                            </button>
                        </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('season')}>
                                        Current Season {sortIndicator('season')}
                                    </button>
                                </th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>
                                    <button style={styles.tableSortButton} onClick={() => toggleCoachSort('reputation')}>
                                        Reputation {sortIndicator('reputation')}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCoachDirectoryTeams.map(team => {
                                const coach = getCoachProfileForTeam(team);
                                const tenureYears = coach ? getCoachTenureSeasons(team) : 0;
                                return (
                                <tr key={team.name}>
                                    <td style={{ ...styles.td, fontWeight: team.isUserTeam ? 'bold' : 'normal', color: team.isUserTeam ? colors.primary : styles.td.color }}>
                                        <button style={styles.tableLinkButton} onClick={() => setSelectedSchoolName(team.name)}>
                                            {team.name}
                                        </button>
                                    </td>
                                    <td style={styles.td}>{team.prestige}</td>
                                    <td style={styles.td}>
                                        <button
                                            style={styles.tableLinkButton}
                                            onClick={() => coach && setSelectedCoachProfile({
                                                coach,
                                                teamName: team.name,
                                                historyEntries: buildCoachHistoryEntries(coach),
                                                nbaDrafts: state.history.nbaDrafts || [],
                                            })}
                                        >
                                            {coach?.name || 'TBD'}
                                        </button>
                                    </td>
                                    <td style={styles.td}>{coach?.style || 'Balanced'}</td>
                            <td style={styles.td}>
                                {coach
                                    ? `${tenureYears} yr${tenureYears === 1 ? '' : 's'}`
                                    : 'N/A'}
                            </td>
                                <td style={styles.td}>
                                    {coach?.careerWins ?? 0}
                                </td>
                                <td style={styles.td}>
                                    {coach?.careerLosses ?? 0}
                                </td>
                                <td style={styles.td}>
                                    {coach ? (
                                        ((coach.careerWins + coach.careerLosses) > 0
                                            ? `${((coach.careerWins / (coach.careerWins + coach.careerLosses)) * 100).toFixed(1)}%`
                                            : '0.0%')
                                    ) : '0.0%'}
                                </td>
                                <td style={styles.td}>{coach ? `${coach.seasonWins}-${coach.seasonLosses}` : '0-0'}</td>
                                    <td style={styles.td}>{coach?.reputation ?? 0}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

    const getApproxPlayerAge = (player: Player) => {
        if (player.age) return player.age;
        
        let baseAge = 22; // Default for Senior/Unknown
        if (player.year === 'Fr') baseAge = 19;
        else if (player.year === 'So') baseAge = 20;
        else if (player.year === 'Jr') baseAge = 21;
        else if (player.year === 'Intl') baseAge = 20;

        if (player.draftYear !== undefined) {
            return baseAge + (state.season - player.draftYear);
        }
        
        // If simply in pool without draft year (undrafted rookie), use base age + time in pool?
        // But we don't track time in pool easily without looking at when they were added relative to now.
        // For simple display, baseAge is better than NaN.
        return baseAge;
    };

    const renderNbaFreeAgents = () => {
        if (!state.nbaFreeAgents || state.nbaFreeAgents.length === 0) {
            return <p style={{ fontSize: '0.8rem' }}>No free agents currently available.</p>;
        }

        const sortedAgents = [...state.nbaFreeAgents].sort((a, b) => b.player.overall - a.player.overall);

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Free-Agent Board</h4>
                        <p style={nbaStyles.cardSubtitle}>Sorted by overall with context for why they are available</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 0 }}>
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pos</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>OVR</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Age</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Previous Team</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAgents.map((agent) => (
                                    <tr key={agent.player.id}>
                                        <td style={styles.td}>{agent.player.name}</td>
                                        <td style={styles.td}>{agent.player.position}</td>
                                        <td style={styles.td}>{agent.player.overall}</td>
                                        <td style={styles.td}>{getApproxPlayerAge(agent.player)}</td>
                                        <td style={styles.td}>{NBA_ACRONYM_TO_NAME[agent.previousTeam] || agent.previousTeam || agent.player.originDescription || 'Undrafted'}</td>
                                        <td style={styles.td}>{agent.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };

    const renderNbaTransactions = () => {
        if (!state.nbaTransactions || state.nbaTransactions.length === 0) {
            return <p style={{ fontSize: '0.8rem' }}>No transactions have occurred this season.</p>;
        }

        const sortedTransactions = [...state.nbaTransactions].sort((a, b) => {
            if (b.season !== a.season) return b.season - a.season;
            return b.week - a.week;
        });

        // Helper to format date
        const getTransactionDate = (t: NBATransaction) => {
             // Use global helper for consistency
             return getGameDateString(BASE_CALENDAR_YEAR + t.season, t.week);
        };

        return (
            <section style={nbaStyles.card}>
                <header style={nbaStyles.cardHeader}>
                    <div style={nbaStyles.cardHeaderTitles}>
                        <h4 style={{ ...nbaStyles.cardTitle, color: colors.primary }}>Transaction Wire</h4>
                        <p style={nbaStyles.cardSubtitle}>Chronological log of CPU trades, cuts, and signings</p>
                    </div>
                </header>
                <div style={{ ...nbaStyles.cardBody, paddingTop: 0 }}>
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Date</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Type</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTransactions.map((t) => (
                                    <tr key={t.id}>
                                        <td style={styles.td}>{getTransactionDate(t)}</td>
                                        <td style={styles.td}>{t.type}</td>
                                        <td style={{...styles.td, textAlign: 'left'}}>{t.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    };

    const renderHistoryTabContent = () => {
        switch (selectedTab) {
            case 'myCareer':
                return renderMyCareer();
            case 'teamRecords':
                return renderTeamRecords();
            case 'nationalRankings':
                return renderNationalRankings();
            case 'nba':
                return (
                    <div style={nbaStyles.viewport}>
                        <div style={nbaStyles.summaryGrid}>
                            {nbaSummaryCards.map(card => (
                                <div key={card.label} style={nbaStyles.summaryCard}>
                                    <p style={nbaStyles.summaryLabel}>{card.label}</p>
                                    <p style={nbaStyles.summaryValue}>{card.value}</p>
                                    <p style={nbaStyles.summaryMeta}>{card.meta}</p>
                                </div>
                            ))}
                        </div>
                        <div style={nbaStyles.subNav}>
                            {nbaTabs.map(tab => {
                                const isActive = selectedNbaTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        style={{
                                            ...nbaStyles.subNavButton,
                                            backgroundColor: isActive ? colors.primary : '#f8f8f8',
                                            color: isActive ? colors.text : '#333',
                                            border: `1px solid ${isActive ? colors.primary : '#c5cad5'}`,
                                            boxShadow: isActive ? 'inset 0 -3px 0 rgba(0,0,0,0.15)' : 'none'
                                        }}
                                        onClick={() => setSelectedNbaTab(tab.key)}
                                    >
                                        <span style={nbaStyles.subNavLabel}>{tab.label}</span>
                                        <span style={nbaStyles.subNavDescription}>{tab.description}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedNbaTab === 'drafts' && renderDraftHistory()}
                        {selectedNbaTab === 'standings' && renderNbaStandings()}
                        {selectedNbaTab === 'rosters' && renderNbaRosters()}
                        {selectedNbaTab === 'stats' && renderNbaStats()}
                        {selectedNbaTab === 'transactions' && renderNbaTransactions()}
                        {selectedNbaTab === 'freeAgency' && renderNbaFreeAgents()}
                    </div>
                );
            case 'coachDirectory':
            default:
                return renderCoachDirectory();
        }
    };

    const historyTabs: Array<{ key: typeof selectedTab; label: string }> = [
        { key: 'myCareer', label: 'My Career' },
        { key: 'teamRecords', label: 'Team Records' },
        { key: 'nationalRankings', label: 'National Rankings' },
        { key: 'nba', label: 'NBA' },
        { key: 'coachDirectory', label: 'Coach Directory' },
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '15px' }}>
                {historyTabs.map(tab => (
                    <button
                        key={tab.key}
                        style={{
                            ...styles.button,
                            fontSize: '0.6rem',
                            padding: '8px',
                            backgroundColor: selectedTab === tab.key ? colors.primary : colors.secondary,
                            color: selectedTab === tab.key ? colors.text : buttonTextColorForInactive,
                            borderColor: selectedTab === tab.key ? colors.primary : '#808080',
                        }}
                        onClick={() => setSelectedTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '10px' }}>
                {renderHistoryTabContent()}
            </div>
            {selectedSchoolName && selectedSchoolTeam && (
                <SchoolHistoryModal
                    team={selectedSchoolTeam}
                    colors={SCHOOL_COLORS[selectedSchoolTeam.name] || colors}
                    historyEntries={schoolHistoryEntries}
                    draftPicks={schoolDraftPicks}
                    championships={schoolChampionships}
                    onClose={() => setSelectedSchoolName(null)}
                />
            )}
            {selectedCoachProfile && (
                <CoachProfileModal
                    coach={selectedCoachProfile.coach}
                    teamName={selectedCoachProfile.teamName}
                    colors={colors}
                    historyEntries={selectedCoachProfile.historyEntries}
                    nbaDrafts={state.history.nbaDrafts || []}
                    onClose={() => setSelectedCoachProfile(null)}
                />
            )}
        </div>
    );
};


export default History;
