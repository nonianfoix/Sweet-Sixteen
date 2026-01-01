import React from 'react';
import type { GameState, GameAction, TeamColors, RotationPreference } from '../types';
import { ROTATION_PREFERENCE_OPTIONS } from '../services/gameReducer';
import { styles } from '../styles';
import Subheading from '../components/Subheading';

interface GameLogViewProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const GameLogView = ({ state, dispatch, colors }: GameLogViewProps) => {
    if (!state.selectedGameLog) return null;

    const { homeTeam, awayTeam, homeScore, awayScore, homeTeamStats, awayTeamStats, playByPlay } = state.selectedGameLog;

    const formatStat = (stat: number) => stat.toFixed(0);
    const calculateTotals = (teamStats: typeof homeTeamStats) => teamStats.reduce((totals, ps) => ({
        points: totals.points + ps.stats.points,
        rebounds: totals.rebounds + ps.stats.rebounds,
        assists: totals.assists + ps.stats.assists,
        fieldGoalsMade: totals.fieldGoalsMade + ps.stats.fieldGoalsMade,
        fieldGoalsAttempted: totals.fieldGoalsAttempted + ps.stats.fieldGoalsAttempted,
        threePointersMade: totals.threePointersMade + ps.stats.threePointersMade,
        threePointersAttempted: totals.threePointersAttempted + ps.stats.threePointersAttempted,
        freeThrowsMade: totals.freeThrowsMade + ps.stats.freeThrowsMade,
        freeThrowsAttempted: totals.freeThrowsAttempted + ps.stats.freeThrowsAttempted,
        turnovers: totals.turnovers + ps.stats.turnovers,
        minutes: totals.minutes + (ps.stats.minutes ?? 0),
    }), {
        points: 0,
        rebounds: 0,
        assists: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        turnovers: 0,
        minutes: 0,
    });

    const homeTotals = calculateTotals(homeTeamStats);
    const awayTotals = calculateTotals(awayTeamStats);

    return (
        <div style={{ padding: '10px', fontSize: '0.7rem' }}>
            <button onClick={() => dispatch({ type: 'CLOSE_GAME_LOG' })} style={styles.button}>Back</button>
            <Subheading color={colors.primary}>Game Log: {awayTeam} @ {homeTeam}</Subheading>
            <p style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px' }}>Final Score: {awayTeam} {awayScore} - {homeScore} {homeTeam}</p>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div style={{ width: '48%' }}>
                    <Subheading color={colors.primary}>{homeTeam} Stats</Subheading>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>PTS</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>REB</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>AST</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MIN</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>FG</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>3PT</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>FT</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>TO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {homeTeamStats.map(ps => (
                                    <tr key={ps.playerId}>
                                        <td style={styles.td}>{ps.name} ({ps.pos})</td>
                                        <td style={styles.td}>{formatStat(ps.stats.points)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.rebounds)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.assists)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.minutes ?? 0)}</td>
                                        <td style={styles.td}>{ps.stats.fieldGoalsMade}-{ps.stats.fieldGoalsAttempted}</td>
                                        <td style={styles.td}>{ps.stats.threePointersMade}-{ps.stats.threePointersAttempted}</td>
                                        <td style={styles.td}>{ps.stats.freeThrowsMade}-{ps.stats.freeThrowsAttempted}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.turnovers)}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 'bold', borderTop: `2px solid ${colors.primary}` }}>
                                    <td style={styles.td}>Totals</td>
                                    <td style={styles.td}>{formatStat(homeTotals.points)}</td>
                                    <td style={styles.td}>{formatStat(homeTotals.rebounds)}</td>
                                    <td style={styles.td}>{formatStat(homeTotals.assists)}</td>
                                    <td style={styles.td}>{formatStat(homeTotals.minutes)}</td>
                                    <td style={styles.td}>{homeTotals.fieldGoalsMade}-{homeTotals.fieldGoalsAttempted}</td>
                                    <td style={styles.td}>{homeTotals.threePointersMade}-{homeTotals.threePointersAttempted}</td>
                                    <td style={styles.td}>{homeTotals.freeThrowsMade}-{homeTotals.freeThrowsAttempted}</td>
                                    <td style={styles.td}>{formatStat(homeTotals.turnovers)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', margin: 0 }}>Rotation Preference:</label>
                    <select
                        value={state.rotationPreference}
                        onChange={(e) => dispatch({ type: 'SET_ROTATION_PREFERENCE', payload: e.target.value as RotationPreference })}
                        style={{ ...styles.select, minWidth: '160px' }}
                    >
                        {ROTATION_PREFERENCE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value} title={option.description}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ width: '48%' }}>
                    <Subheading color={colors.primary}>{awayTeam} Stats</Subheading>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>PTS</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>REB</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>AST</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MIN</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>FG</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>3PT</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>FT</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>TO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {awayTeamStats.map(ps => (
                                    <tr key={ps.playerId}>
                                        <td style={styles.td}>{ps.name} ({ps.pos})</td>
                                        <td style={styles.td}>{formatStat(ps.stats.points)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.rebounds)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.assists)}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.minutes ?? 0)}</td>
                                        <td style={styles.td}>{ps.stats.fieldGoalsMade}-{ps.stats.fieldGoalsAttempted}</td>
                                        <td style={styles.td}>{ps.stats.threePointersMade}-{ps.stats.threePointersAttempted}</td>
                                        <td style={styles.td}>{ps.stats.freeThrowsMade}-{ps.stats.freeThrowsAttempted}</td>
                                        <td style={styles.td}>{formatStat(ps.stats.turnovers)}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 'bold', borderTop: `2px solid ${colors.primary}` }}>
                                    <td style={styles.td}>Totals</td>
                                    <td style={styles.td}>{formatStat(awayTotals.points)}</td>
                                    <td style={styles.td}>{formatStat(awayTotals.rebounds)}</td>
                                    <td style={styles.td}>{formatStat(awayTotals.assists)}</td>
                                    <td style={styles.td}>{formatStat(awayTotals.minutes)}</td>
                                    <td style={styles.td}>{awayTotals.fieldGoalsMade}-{awayTotals.fieldGoalsAttempted}</td>
                                    <td style={styles.td}>{awayTotals.threePointersMade}-{awayTotals.threePointersAttempted}</td>
                                    <td style={styles.td}>{awayTotals.freeThrowsMade}-{awayTotals.freeThrowsAttempted}</td>
                                    <td style={styles.td}>{formatStat(awayTotals.turnovers)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Subheading color={colors.primary}>Play-by-Play</Subheading>
            <div style={{ maxHeight: '300px', overflowY: 'scroll', border: `1px solid ${colors.primary}`, padding: '10px' }}>
                {playByPlay.map((event, index) => (
                    <p key={index} style={{ marginBottom: '3px' }}>{event.text}</p>
                ))}
            </div>
        </div>
    );
};

export default GameLogView;
