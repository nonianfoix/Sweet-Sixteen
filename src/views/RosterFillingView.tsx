import React, { useMemo, useState } from 'react';
import Subheading from '../components/Subheading';
import { styles } from '../styles';
import { formatPotentialValue } from '../services/gameUtils';
import { getPositionDepthSummary, ROTATION_PREFERENCE_OPTIONS } from '../services/gameReducer';
import type { GameState, GameAction, TeamColors, RotationPreference, RosterPositions } from '../types';

interface RosterFillingViewProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const RosterFillingView = ({ state, dispatch, colors }: RosterFillingViewProps) => {
    if (!state.userTeam) return null;
    const rosterSize = state.userTeam.roster.length;
    const canProceed = rosterSize >= 13 && rosterSize <= 15;
    const fillingDepth = useMemo(() => getPositionDepthSummary(state.userTeam!.roster), [state.userTeam]);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

    const totalMinutes = useMemo(() => state.userTeam!.roster.reduce((sum, p) => sum + (p.rotationMinutes || 0), 0), [state.userTeam]);

    const handleCutPlayer = (playerId: string, playerName: string) => {
        if (window.confirm(`Are you sure you want to cut ${playerName}? This will free up a roster spot.`)) {
            dispatch({ type: 'CUT_PLAYER', payload: { playerId } });
        }
    };

    const handleBulkCut = () => {
        if (selectedPlayerIds.length === 0) return;
        if (window.confirm(`Are you sure you want to cut ${selectedPlayerIds.length} players? This cannot be undone.`)) {
            dispatch({ type: 'BULK_CUT_PLAYERS', payload: { playerIds: selectedPlayerIds } });
            setSelectedPlayerIds([]);
        }
    };

    const togglePlayerSelection = (playerId: string) => {
        setSelectedPlayerIds(prev => (prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]));
    };

    return (
        <div>
            <Subheading color={colors.primary}>Summer Off-season: Roster Management</Subheading>
            <p style={{ fontSize: '0.7rem', marginBottom: '10px' }}>
                Your roster size is currently {rosterSize} / 15.
            </p>
            <p style={{ fontSize: '0.7rem', marginBottom: '20px' }}>
                You must have between 13 and 15 players on your roster to start the season. (Roster Count: {rosterSize} players)
            </p>
            <div style={styles.positionDepthRow}>
                {(Object.keys(fillingDepth) as RosterPositions[]).map(pos => (
                    <span key={`fill-depth-${pos}`} style={styles.positionDepthPill}>
                        {pos}: {fillingDepth[pos]}/3
                    </span>
                ))}
            </div>
            <div style={{ marginBottom: '10px' }}>
                <Subheading color={colors.primary}>Rotation Minutes</Subheading>
                <p style={{ fontSize: '0.7rem', marginBottom: '10px', color: totalMinutes === 200 ? '#1a7f37' : totalMinutes > 200 ? '#B22222' : '#333' }}>
                    Minutes Allocated: {totalMinutes} / 200
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => dispatch({ type: 'AUTO_DISTRIBUTE_MINUTES' })} style={{ ...styles.button }}>Auto-Distribute</button>
                    <button onClick={() => dispatch({ type: 'AUTO_DISTRIBUTE_REMAINING_MINUTES' })} style={{ ...styles.button }}>Auto-Distribute Remaining</button>
                    <button onClick={() => dispatch({ type: 'RESET_MINUTES' })} style={{ ...styles.button }}>Reset Minutes</button>
                    <button
                        onClick={() => {
                            if (totalMinutes !== 200) {
                                dispatch({ type: 'SET_TOAST', payload: `You must allocate exactly 200 minutes (currently ${totalMinutes}).` });
                            } else {
                                dispatch({ type: 'SET_TOAST', payload: 'Minutes saved!' });
                            }
                        }}
                        style={{ ...styles.button }}
                    >
                        Save Minutes
                    </button>
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
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                    style={{ ...styles.button, marginRight: '10px' }}
                    onClick={() => dispatch({ type: 'FILL_ROSTER' })}
                    disabled={rosterSize >= 13}
                >
                    Fill Roster with Walk-Ons
                </button>
                {selectedPlayerIds.length > 0 && (
                    <button
                        style={{ ...styles.button, backgroundColor: '#B22222', color: 'white' }}
                        onClick={handleBulkCut}
                    >
                        Cut Selected ({selectedPlayerIds.length})
                    </button>
                )}
            </div>
            {!canProceed && rosterSize > 15 && (
                <p style={{ color: 'red', marginTop: '10px', fontSize: '0.7rem' }}>
                    You are over the roster limit - make a cut before the season starts.
                </p>
            )}

            <div style={styles.tableContainer}>
                <table style={{ ...styles.table, marginTop: '20px' }}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, width: '40px', backgroundColor: colors.primary, color: colors.text }}>Select</th>
                            <th style={{ ...styles.th, width: '40%', backgroundColor: colors.primary, color: colors.text }}>Name</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pos</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Yr</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>OVR</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pot</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Actions</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MPG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.userTeam.roster.map((p, idx) => (
                            <tr key={p.id} style={idx % 2 === 0 ? styles.trEven : {}}>
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedPlayerIds.includes(p.id)}
                                        onChange={() => togglePlayerSelection(p.id)}
                                    />
                                </td>
                                <td style={styles.td}>{idx + 1}. {p.name}</td>
                                <td style={styles.td}>{p.position}{p.secondaryPosition ? `/${p.secondaryPosition}` : ''}</td>
                                <td style={styles.td}>{p.year}</td>
                                <td style={styles.td}>{p.overall}</td>
                                <td style={styles.td}>{formatPotentialValue(p.potential)}</td>
                                <td style={styles.td}>
                                    <button
                                        onClick={() => handleCutPlayer(p.id, p.name)}
                                        style={{ ...styles.pullButton, flexShrink: 0 }}
                                    >
                                        Cut
                                    </button>
                                </td>
                                <td style={styles.td}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="40"
                                        value={p.rotationMinutes || 0}
                                        onChange={(e) => dispatch({ type: 'UPDATE_PLAYER_MINUTES', payload: { playerId: p.id, minutes: parseInt(e.target.value) || 0 } })}
                                        style={{ width: '50px', padding: '2px' }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RosterFillingView;
