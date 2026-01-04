import React, { useMemo, useState, useEffect } from 'react';
import {
    GameState,
    GameAction,
    TeamColors,
    Player,
    RosterPositions,
    GameStatus,
    RotationPreference,
} from '../types';
import { calculateOverall } from '../services/gameService';
import { ROTATION_PREFERENCE_OPTIONS, formatPlayerHeight, calculateAvailableScholarships, getPositionDepthSummary } from '../services/gameReducer';
import * as constants from '../constants';
import { styles } from '../styles';
import Subheading from '../components/Subheading';
import { autoSetStarters } from '../services/gameService';
import { formatPotentialValue } from '../services/gameUtils';
import OtherTeamsRosterView from '../components/OtherTeamsRosterView';

const { SCHOOLS } = constants;

const RosterView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const [starters, setStarters] = useState<{[key in RosterPositions]: string}>({ PG: '', SG: '', SF: '', PF: '', C: '' });
    const [viewStats, setViewStats] = useState(false);

    useEffect(() => {
        // FIX: Added a null check for state.userTeam to prevent crashes when the component mounts before the team is selected.
        if (!state.userTeam) {
            return;
        }

        if(state.userTeam){
            const initialStarters: {[key in RosterPositions]: string} = { PG: '', SG: '', SF: '', PF: '', C: '' };
            state.userTeam.roster.forEach(p => {
                if (p.starterPosition) {
                   initialStarters[p.starterPosition] = p.id;
                }
            });
            setStarters(initialStarters);
        }
    }, [state.userTeam]);


    const renderTrendV2 = (player: Player) => {
        if (player.startOfSeasonOverall === undefined) return <span style={{ color: 'gray' }}>-</span>;
        const trend = player.overall - player.startOfSeasonOverall;
        if (trend > 0) return <span style={{ color: '#1a7f37', fontWeight: 'bold' }}>▲ +{trend}</span>;
        if (trend < 0) return <span style={{ color: '#c52b2b', fontWeight: 'bold' }}>▼ {trend}</span>;
        return <span style={{ color: 'gray' }}>-</span>;
    };

    const renderTrend = (player: Player) => {
        if (player.startOfSeasonOverall === undefined) return <span style={{ color: 'gray' }}>-</span>;
        const trend = player.overall - player.startOfSeasonOverall;
        if (trend > 0) return <span style={{ color: '#1a7f37' }}>? +{trend}</span>;
        if (trend < 0) return <span style={{ color: '#c52b2b' }}>? {trend}</span>;
        return <span style={{ color: 'gray' }}>�</span>;
    };

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
                fontSize: '0.7rem',
                border: `1px solid ${colors.text}`,
            }}>
                {year}
            </span>
        );
    };



    if (!state.userTeam) return null;

    const inSigningPeriod = state.status === GameStatus.SIGNING_PERIOD && (state.signingPeriodDay || 0) <= 7;
    const nextYearLabel = (y: Player['year']): Player['year'] => {
        if (!inSigningPeriod) return y;
        if (y === 'Fr') return 'So';
        if (y === 'So') return 'Jr';
        if (y === 'Jr') return 'Sr';
        return y;
    };

    const handleStarterChange = (pos: RosterPositions, playerId: string) => {
        setStarters(prev => ({...prev, [pos]: playerId}));
    };
    
    const saveStarters = () => {
        if (new Set(Object.values(starters)).size !== 5 || Object.values(starters).some(id => !id)) {
            dispatch({ type: 'SET_TOAST', payload: "You must select 5 unique starters." });
            return;
        }
        dispatch({ type: 'SET_STARTERS', payload: starters });
    };

    const totalMinutes = useMemo(() => {
        if (!state.userTeam) return 0;
        return state.userTeam.roster.reduce((sum, p) => sum + (p.rotationMinutes || 0), 0);
    }, [state.userTeam]);

    const saveMinutes = () => {
        if (totalMinutes !== 200) {
            dispatch({ type: 'SET_TOAST', payload: `You must allocate exactly 200 minutes (currently ${totalMinutes}).` });
            return;
        }
        dispatch({ type: 'SET_TOAST', payload: 'Minutes saved!' });
    };

    const autoSetLineup = () => {
        if (!state.userTeam) return;
        const rosterWithAutoStarters = autoSetStarters(state.userTeam.roster);
        const finalStarters: { [key in RosterPositions]: string } = { PG: '', SG: '', SF: '', PF: '', C: '' };
        rosterWithAutoStarters.forEach(p => {
            if (p.starterPosition) finalStarters[p.starterPosition] = p.id;
        });

        if (new Set(Object.values(finalStarters)).size !== 5 || Object.values(finalStarters).some(id => !id)) {
            dispatch({ type: 'SET_TOAST', payload: "Auto-set failed. Please set manually." });
            return;
        }

        dispatch({ type: 'SET_STARTERS', payload: finalStarters });
    };

    const handleCutPlayer = (playerId: string, playerName: string) => {
        if (window.confirm(`Are you sure you want to cut ${playerName}? This will free up a scholarship.`)) {
            dispatch({ type: 'CUT_PLAYER', payload: { playerId } });
        }
    };

    const handleFocusChange = (playerId: string) => {
        dispatch({ type: 'SET_PLAYER_FOCUS', payload: { playerId: playerId || null } });
    };

    const handleCaptainChange = (playerId: string) => {
        dispatch({ type: 'SET_TEAM_CAPTAIN', payload: { playerId: playerId || null } });
    };

    const sortedRoster = state.userTeam.roster
        .slice()
        .sort((a, b) => b.overall - a.overall);
    const totalPlayers = sortedRoster.length;
    const positionDepth = useMemo(() => getPositionDepthSummary(sortedRoster), [sortedRoster]);

    return (
        <div>
            <div style={{marginBottom: '20px'}}>
                <Subheading color={colors.primary}>Set Starting Lineup</Subheading>
                <p style={{ fontSize: '0.7rem', marginBottom: '10px' }}>Roster Count: {totalPlayers} players</p>
                <div style={styles.positionDepthRow}>
                    {(Object.keys(positionDepth) as RosterPositions[]).map(pos => (
                        <span key={`depth-${pos}`} style={styles.positionDepthPill}>
                            {pos}: {positionDepth[pos]}/3
                        </span>
                    ))}
                </div>
                { (['PG', 'SG', 'SF', 'PF', 'C'] as RosterPositions[]).map(pos => (
                    <div key={pos} style={{display: 'flex', alignItems: 'center', marginBottom: '5px'}}>
                        <label style={{width: '50px', flexShrink: 0}}>{pos}:</label>
                        <select value={starters[pos]} onChange={(e) => handleStarterChange(pos, e.target.value)} style={{...styles.select, flex: 1, minWidth: 0}}>
                            <option value="">Select...</option>
                            {sortedRoster.map(p => <option key={p.id} value={p.id}>{p.name} ({p.overall})</option>)}
                        </select>
                    </div>
                ))}
                <button onClick={saveStarters} style={{...styles.button, marginRight: '10px', marginTop: '10px'}}>Save Starters</button>
                <button onClick={autoSetLineup} style={{...styles.button, marginTop: '10px'}}>Auto-Set</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <Subheading color={colors.primary}>Player Roles</Subheading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span>Featured Scorer</span>
                        <select
                            value={state.userTeam.playerFocusId ?? ''}
                            onChange={e => handleFocusChange(e.target.value)}
                            style={{ ...styles.select, maxWidth: '320px' }}
                        >
                            <option value="">None (balanced)</option>
                            {sortedRoster.map(player => (
                                <option key={player.id} value={player.id}>{player.name} ({player.position})</option>
                            ))}
                        </select>
                        <span style={{ fontSize: '0.6rem', color: '#555' }}>Focused players get extra touches, shots, and pick-and-roll opportunities.</span>
                    </label>
                    <label style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span>Team Captain</span>
                        <select
                            value={state.userTeam.teamCaptainId ?? ''}
                            onChange={e => handleCaptainChange(e.target.value)}
                            style={{ ...styles.select, maxWidth: '320px' }}
                        >
                            <option value="">None</option>
                            {sortedRoster.map(player => (
                                <option key={player.id} value={player.id}>{player.name} ({player.position})</option>
                            ))}
                        </select>
                        <span style={{ fontSize: '0.6rem', color: '#555' }}>Captains stabilize the lineup and add subtle boosts on both ends.</span>
                    </label>
                </div>
            </div>

            <div style={{marginBottom: '20px'}}>
                <Subheading color={colors.primary}>Rotation Minutes</Subheading>
                <p style={{ fontSize: '0.7rem', marginBottom: '10px', color: totalMinutes === 200 ? '#1a7f37' : totalMinutes > 200 ? '#B22222' : '#333' }}>
                    Minutes Allocated: {totalMinutes} / 200
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => dispatch({ type: 'AUTO_DISTRIBUTE_MINUTES' })} style={{ ...styles.button }}>Auto-Distribute</button>
                    <button onClick={() => dispatch({ type: 'AUTO_DISTRIBUTE_REMAINING_MINUTES' })} style={{ ...styles.button }}>Auto-Distribute Remaining</button>
                    <button onClick={() => dispatch({ type: 'RESET_MINUTES' })} style={{ ...styles.button }}>Reset Minutes</button>
                    <button onClick={saveMinutes} style={{ ...styles.button }}>Save Minutes</button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', margin: 0 }}>Rotation Preference:</label>
                        <select
                            value={state.rotationPreference}
                            onChange={(e) => dispatch({ type: 'SET_ROTATION_PREFERENCE', payload: e.target.value as RotationPreference })}
                            style={{ ...styles.select, minWidth: '170px' }}
                        >
                            {ROTATION_PREFERENCE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value} title={option.description}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
             <button onClick={() => setViewStats(!viewStats)} style={{...styles.button, marginBottom: '10px'}}>
                {viewStats ? 'View Ratings' : 'View Stats'}
            </button>
            <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead><tr>
                    {viewStats ? (
                        <>
                            <th style={{...styles.th, width: '40%', backgroundColor: colors.primary, color: colors.text}}>Name</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>GP</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>PPG</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>RPG</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>APG</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>MPG</th>
                        </>
                    ) : (
                        <>
                            <th style={{...styles.th, width: '30%', backgroundColor: colors.primary, color: colors.text}}>Name</th>
                            <th style={{...styles.th, width: '15%', backgroundColor: colors.primary, color: colors.text}}>Pos</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Ht</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Yr</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>OVR</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Trend</th>
                            <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Pot</th>
                            <th style={{...styles.th, width: '12%', backgroundColor: colors.primary, color: colors.text}}>Starter</th>
                            <th style={{...styles.th, width: '8%', backgroundColor: colors.primary, color: colors.text}}>MPG</th>
                        </>
                    )}
                </tr></thead>
                <tbody>
                    {sortedRoster.map((p, index) => {
                        const displayYear = nextYearLabel(p.year);
                        const isSenior = displayYear === 'Sr';
                        const isHighPotentialFreshman = displayYear === 'Fr' && p.potential >= 85;
                        const yearCellStyle: React.CSSProperties = {
                            ...styles.td,
                            color: isSenior ? '#B22222' : '#000000',
                            fontWeight: isSenior ? 'bold' : 'normal',
                        };
                        const nameCellStyle: React.CSSProperties = {
                            ...styles.td,
                            color: isHighPotentialFreshman ? '#006400' : '#000000',
                            fontWeight: isHighPotentialFreshman ? 'bold' : 'normal',
                        };

                        const renderCutButton = () => (
                            <button
                                onClick={() => handleCutPlayer(p.id, p.name)}
                                style={{ ...styles.pullButton, flexShrink: 0 }}
                            >
                                Cut
                            </button>
                        );

                        return (
                            <tr key={p.id}>
                                {viewStats ? (
                                    <>
                                        <td style={nameCellStyle}>
                                            <div style={styles.inlineRowAction}>
                                                <span>{index + 1}. {p.name}</span>
                                                {renderCutButton()}
                                            </div>
                                        </td>
                                        <td style={styles.td}>{p.seasonStats.gamesPlayed}</td>
                                        <td style={styles.td}>{(p.seasonStats.points / (p.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                        <td style={styles.td}>{(p.seasonStats.rebounds / (p.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                        <td style={styles.td}>{(p.seasonStats.assists / (p.seasonStats.gamesPlayed || 1)).toFixed(1)}</td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={40}
                                                    value={p.rotationMinutes ?? 0}
                                                    onChange={(e) => dispatch({ type: 'SET_PLAYER_MINUTES', payload: { playerId: p.id, minutes: parseInt(e.target.value || '0', 10) } })}
                                                    style={{ ...styles.select, width: '55px', cursor: 'text', padding: '4px 6px' }}
                                                    disabled={!!p.minutesLocked}
                                                />
                                                <button
                                                    style={styles.smallButton}
                                                    onClick={() => dispatch({ type: 'TOGGLE_PLAYER_MINUTES_LOCK', payload: { playerId: p.id } })}
                                                >
                                                    {p.minutesLocked ? 'Unlock' : 'Lock'}
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={nameCellStyle}>{index + 1}. {p.name}</td>
                                        <td style={styles.td}>{p.position}{p.secondaryPosition ? `/${p.secondaryPosition}` : ''}</td>
                                        <td style={styles.td}>{formatPlayerHeight(p.height)}</td>
                                        <td style={styles.td}>{renderYearPill(displayYear)}</td>
                                        <td style={styles.td}>{p.overall}</td>
                                        <td style={styles.td}>{renderTrendV2(p)}</td>
                                        <td style={styles.td}>{formatPotentialValue(p.potential)}</td>
                                        <td style={styles.td}>
                                            <div style={styles.inlineRowAction}>
                                                <span>{p.starterPosition ? p.starterPosition : 'No'}</span>
                                                {renderCutButton()}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={40}
                                                    value={p.rotationMinutes ?? 0}
                                                    onChange={(e) => dispatch({ type: 'SET_PLAYER_MINUTES', payload: { playerId: p.id, minutes: parseInt(e.target.value || '0', 10) } })}
                                                    style={{ ...styles.select, width: '55px', cursor: 'text', padding: '4px 6px' }}
                                                    disabled={!!p.minutesLocked}
                                                />
                                                <button
                                                    style={styles.smallButton}
                                                    onClick={() => dispatch({ type: 'TOGGLE_PLAYER_MINUTES_LOCK', payload: { playerId: p.id } })}
                                                >
                                                    {p.minutesLocked ? 'Unlock' : 'Lock'}
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            </div>
            <OtherTeamsRosterView state={state} colors={colors} />
        </div>
    );
}


export default RosterView;
