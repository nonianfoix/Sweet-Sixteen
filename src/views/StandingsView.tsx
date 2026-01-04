import React, { useMemo, useState } from 'react';
import Subheading from '../components/Subheading';
import MockDraftView from './MockDraftView';
import { styles } from '../styles';
import { buildDraftProspectBoard } from '../services/gameService';
import { formatPlayerHeight } from '../services/gameReducer';
import type { GameState, GameAction, TeamColors, Player } from '../types';

const renderYearPill = (year: Player['year']) => {
    const yearColors: Record<Player['year'], { bg: string; text: string }> = {
        'Fr': { bg: '#e0f2f1', text: '#00695c' },
        'So': { bg: '#e3f2fd', text: '#1565c0' },
        'Jr': { bg: '#fff3e0', text: '#e65100' },
        'Sr': { bg: '#ffebee', text: '#c62828' },
        'Intl': { bg: '#f3e5f5', text: '#7b1fa2' },
        'Pro': { bg: '#fce4ec', text: '#c2185b' },
    };
    const colors = yearColors[year] || { bg: '#f5f5f5', text: '#333' };
    return (
        <span style={{
            backgroundColor: colors.bg,
            color: colors.text,
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.65rem',
            border: `1px solid ${colors.text}`,
        }}>
            {year}
        </span>
    );
};

interface StandingsProps {
    state: GameState;
    colors: TeamColors;
    dispatch: React.Dispatch<GameAction>;
}

const PlayerStats = ({ state, colors }: { state: GameState; colors: TeamColors }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({
        key: 'points',
        direction: 'descending',
    });

    const allPlayers = useMemo(
        () => state.allTeams.flatMap(team => team.roster.map(player => ({ ...player, teamName: team.name }))),
        [state.allTeams]
    );

    const powerRankings = useMemo(() => {
        const ranks = new Map<string, number>();
        [...state.allTeams]
            .sort((a, b) => b.record.wins * 2 + b.prestige / 10 - (a.record.wins * 2 + a.prestige / 10))
            .forEach((team, index) => {
                ranks.set(team.name, index + 1);
            });
        return ranks;
    }, [state.allTeams]);

    const draftProspects = useMemo(
        () => buildDraftProspectBoard(state.allTeams, state.internationalProspects || [], 60),
        [state.allTeams, state.internationalProspects]
    );

    const sortedPlayers = useMemo(() => {
        const getSortableValue = (player: (typeof allPlayers)[number], key: string) => {
            if (key === 'overall' || key === 'height') {
                return player[key as keyof Player];
            }
            if (key === 'mpg') {
                const games = player.seasonStats.gamesPlayed || 0;
                return games > 0 ? (player.seasonStats.minutes ?? 0) / games : 0;
            }
            const statValue = player.seasonStats[key as keyof Player['seasonStats']] || 0;
            return player.seasonStats.gamesPlayed > 0 ? statValue / player.seasonStats.gamesPlayed : 0;
        };

        const sortablePlayers = [...allPlayers];
        sortablePlayers.sort((a, b) => {
            const aValue = getSortableValue(a, sortConfig.key);
            const bValue = getSortableValue(b, sortConfig.key);

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortablePlayers;
    }, [allPlayers, sortConfig]);

    const userTeamName = state.userTeam?.name;

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const renderSortArrow = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    return (
        <div>
            <Subheading color={colors.primary}>Player Stats</Subheading>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Team</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pos</th>
                            <th
                                style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }}
                                onClick={() => requestSort('height')}
                            >
                                Ht {renderSortArrow('height')}
                            </th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Year</th>
                            <th
                                style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }}
                                onClick={() => requestSort('overall')}
                            >
                                OVR {renderSortArrow('overall')}
                            </th>
                            <th
                                style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }}
                                onClick={() => requestSort('points')}
                            >
                                PPG {renderSortArrow('points')}
                            </th>
                            <th
                                style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }}
                                onClick={() => requestSort('rebounds')}
                            >
                                RPG {renderSortArrow('rebounds')}
                            </th>
                            <th
                                style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }}
                                onClick={() => requestSort('assists')}
                            >
                                APG {renderSortArrow('assists')}
                            </th>
                            <th
                                style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text, cursor: 'pointer' }}
                                onClick={() => requestSort('mpg')}
                            >
                                MPG {renderSortArrow('mpg')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map(player => {
                            const isUserPlayer = player.teamName === userTeamName;
                            const draftRankIndex = draftProspects.findIndex(dp => dp.player.id === player.id);
                            const draftRank = draftRankIndex !== -1 ? draftRankIndex + 1 : null;
                            const teamRank = powerRankings.get(player.teamName);
                            const rowStyle: React.CSSProperties = isUserPlayer
                                ? {
                                      backgroundColor: '#FFF5C2',
                                      fontWeight: 'bold',
                                      border: `2px solid ${colors.primary}`,
                                  }
                                : {};
                            return (
                                <tr key={player.id} style={rowStyle}>
                                    <td style={styles.td}>{player.name} {draftRank ? `(#${draftRank})` : ''}</td>
                                    <td style={styles.td}>{player.teamName} {teamRank ? `(#${teamRank})` : ''}</td>
                                    <td style={styles.td}>{player.position}</td>
                                    <td style={styles.td}>{formatPlayerHeight(player.height)}</td>
                                    <td style={styles.td}>{renderYearPill(player.year)}</td>
                                    <td style={styles.td}>{player.overall}</td>
                                    <td style={styles.td}>{(player.seasonStats.points / (player.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                    <td style={styles.td}>{(player.seasonStats.rebounds / (player.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                    <td style={styles.td}>{(player.seasonStats.assists / (player.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                    <td style={styles.td}>{((player.seasonStats.minutes ?? 0) / (player.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Standings = ({ state, colors, dispatch }: StandingsProps) => {
    const [selectedTab, setSelectedTab] = useState<'standings' | 'playerStats' | 'mockDraft'>('standings');

    const sortedTeams = useMemo(() => {
        const teamsWithPower = [...state.allTeams]
            .map(t => ({ ...t, power: t.record.wins * 2 + t.prestige / 10, conference: t.conference || 'Independent' }))
            .sort((a, b) => b.power - a.power);

        const conferenceBuckets = new Map<string, typeof teamsWithPower>();
        teamsWithPower.forEach(team => {
            if (!conferenceBuckets.has(team.conference)) {
                conferenceBuckets.set(team.conference, []);
            }
            conferenceBuckets.get(team.conference)!.push(team);
        });

        const conferenceRanks = new Map<string, number>();
        conferenceBuckets.forEach(bucket => {
            bucket.sort((a, b) => b.power - a.power);
            bucket.forEach((team, idx) => {
                conferenceRanks.set(team.name, idx + 1);
            });
        });

        return teamsWithPower.map(team => ({
            ...team,
            conferenceRank: conferenceRanks.get(team.name) || null,
        }));
    }, [state.allTeams]);

    const buttonTextColorForInactive = colors.secondary.toUpperCase() === '#FFFFFF' && colors.text.toUpperCase() === '#FFFFFF'
        ? colors.primary
        : colors.text;

    return (
        <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button
                    onClick={() => setSelectedTab('standings')}
                    style={{
                        ...styles.button,
                        flex: 1,
                        backgroundColor: selectedTab === 'standings' ? colors.primary : colors.secondary,
                        color: selectedTab === 'standings' ? colors.text : buttonTextColorForInactive,
                    }}
                >
                    National Rankings
                </button>
                <button
                    onClick={() => setSelectedTab('playerStats')}
                    style={{
                        ...styles.button,
                        flex: 1,
                        backgroundColor: selectedTab === 'playerStats' ? colors.primary : colors.secondary,
                        color: selectedTab === 'playerStats' ? colors.text : buttonTextColorForInactive,
                    }}
                >
                    Player Stats
                </button>
                <button
                    onClick={() => setSelectedTab('mockDraft')}
                    style={{
                        ...styles.button,
                        flex: 1,
                        backgroundColor: selectedTab === 'mockDraft' ? colors.primary : colors.secondary,
                        color: selectedTab === 'mockDraft' ? colors.text : buttonTextColorForInactive,
                    }}
                >
                    Mock Draft
                </button>
            </div>
            {selectedTab === 'standings' ? (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Rank</th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Team</th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Conference</th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Record</th>
                                <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Prestige</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeams.map((t, i) => (
                                <tr key={t.name}>
                                    <td style={styles.td}>{i + 1}</td>
                                    <td
                                        style={{
                                            ...styles.td,
                                            color: t.name === state.userTeam?.name ? colors.primary : '#000000',
                                            fontWeight: t.name === state.userTeam?.name ? 'bold' : 'normal',
                                        }}
                                    >
                                        {t.name}
                                    </td>
                                    <td style={styles.td}>{t.conference}{t.conferenceRank ? ` (#${t.conferenceRank})` : ''}</td>
                                    <td style={styles.td}>{t.record.wins}-{t.record.losses}</td>
                                    <td style={styles.td}>{t.prestige}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : selectedTab === 'playerStats' ? (
                <PlayerStats state={state} colors={colors} />
            ) : (
                <MockDraftView state={state} colors={colors} dispatch={dispatch} />
            )}
        </div>
    );
};

export default Standings;
