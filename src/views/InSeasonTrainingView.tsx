import React from 'react';
import Subheading from '../components/Subheading';
import { styles } from '../styles';
import { getTrainingPoints } from '../services/gameService';
import { formatPlayerHeight } from '../services/gameReducer';
import { formatPotentialValue } from '../services/gameUtils';
import type { GameState, GameAction, TeamColors, Player } from '../types';

interface InSeasonTrainingViewProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const TrainingSummaryCards = ({
    availablePoints,
    trainingCost,
    roster,
    autoTrainingEnabled,
    trainingPointsUsed,
}: {
    availablePoints: number;
    trainingCost: number;
    roster: Player[];
    autoTrainingEnabled: boolean;
    trainingPointsUsed: number;
}) => {
    const sessionsLeft = Math.max(0, Math.floor(availablePoints / trainingCost));
    const targetedPlayers = roster.filter(p => p.isTargeted);
    const avgTargetGap = targetedPlayers.length
        ? (targetedPlayers.reduce((sum, player) => sum + Math.max(0, player.potential - player.overall), 0) / targetedPlayers.length).toFixed(1)
        : '0.0';
    const highCeilingPlayers = roster.filter(p => p.potential - p.overall >= 10).length;
    const lowStaminaPlayers = roster.filter(p => (p.stats.stamina ?? 70) < 60).length;

    return (
        <div style={styles.trainingSummaryGrid}>
            <div style={styles.trainingSummaryCard}>
                <span>Sessions Left</span>
                <strong style={{ color: sessionsLeft > 0 ? 'green' : '#B22222' }}>{sessionsLeft}</strong>
                <p style={styles.trainingSummaryMeta}>Each +1 boost costs {trainingCost} pts.</p>
            </div>
            <div style={styles.trainingSummaryCard}>
                <span>Points Spent</span>
                <strong>{trainingPointsUsed}</strong>
                <p style={styles.trainingSummaryMeta}>{autoTrainingEnabled ? 'Auto-spend enabled' : 'Manual only'}</p>
            </div>
            <div style={styles.trainingSummaryCard}>
                <span>Targeted Players</span>
                <strong>{targetedPlayers.length}</strong>
                <p style={styles.trainingSummaryMeta}>Avg gap: {avgTargetGap} OVR</p>
            </div>
            <div style={styles.trainingSummaryCard}>
                <span>High-Ceiling Prospects</span>
                <strong>{highCeilingPlayers}</strong>
                <p style={styles.trainingSummaryMeta}>Need 10+ OVR growth</p>
            </div>
            <div style={styles.trainingSummaryCard}>
                <span>Low Stamina Alerts</span>
                <strong style={{ color: lowStaminaPlayers ? '#B22222' : 'inherit' }}>{lowStaminaPlayers}</strong>
                <p style={styles.trainingSummaryMeta}>Consider conditioning work</p>
            </div>
        </div>
    );
};

const InSeasonTrainingView = ({ state, dispatch, colors }: InSeasonTrainingViewProps) => {
    if (!state.userTeam) return null;

    const availablePoints = getTrainingPoints(state.userTeam) - (state.trainingPointsUsedThisWeek || 0);
    const trainingCost = 3;
    const canTrain = availablePoints >= trainingCost;
    const autoTrainingEnabled = state.autoTrainingEnabled;

    const handleTrain = (playerId: string, stat: keyof Player['stats']) => {
        dispatch({ type: 'TRAIN_PLAYER_STAT', payload: { playerId, stat } });
    };

    const toggleAutoTraining = () => {
        dispatch({ type: 'SET_AUTO_TRAINING_ENABLED', payload: !autoTrainingEnabled });
    };

    const statKeys: (keyof Player['stats'])[] = [
        'insideScoring',
        'outsideScoring',
        'playmaking',
        'perimeterDefense',
        'insideDefense',
        'rebounding',
        'stamina',
    ];

    return (
        <div>
            <Subheading color={colors.primary}>In-Season Training</Subheading>
            <p style={{ fontSize: '0.7rem', marginBottom: '10px', color: availablePoints < trainingCost ? 'red' : 'inherit' }}>
                Available Points This Week: <strong>{availablePoints} / {getTrainingPoints(state.userTeam)}</strong>
            </p>
            <p style={{ fontSize: '0.7rem', marginBottom: '20px' }}>
                Spend training points to improve player stats. Each +1 boost costs {trainingCost} points. Points reset after each game.
            </p>
            <div style={styles.autoTrainingToggleRow}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem' }}>
                    <input type="checkbox" checked={autoTrainingEnabled} onChange={toggleAutoTraining} />
                    Enable automatic training after each sim
                </label>
                <span style={{ fontSize: '0.6rem', color: autoTrainingEnabled ? 'green' : '#B22222' }}>
                    {autoTrainingEnabled ? 'Idle points will boost targets automatically.' : 'All training must be triggered manually.'}
                </span>
            </div>
            <TrainingSummaryCards
                availablePoints={availablePoints}
                trainingCost={trainingCost}
                roster={state.userTeam.roster}
                autoTrainingEnabled={autoTrainingEnabled}
                trainingPointsUsed={state.trainingPointsUsedThisWeek}
            />
            <div style={styles.tableContainer}>
                <table style={{ ...styles.table, fontSize: '0.6rem', minWidth: '800px' }}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Yr</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pos</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Ht</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>OVR</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>POT</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>In. Scr</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Out. Scr</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Plm.</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Per. D</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>In. D</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Reb.</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Stam.</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.userTeam.roster
                            .slice()
                            .sort((a, b) => b.overall - a.overall)
                            .map(player => (
                                <tr key={player.id}>
                                    <td
                                        style={{
                                            ...styles.td,
                                            color: player.starterPosition ? '#B22222' : styles.td.color || '#000000',
                                            fontWeight: player.starterPosition ? 'bold' : 'normal',
                                        }}
                                    >
                                        {player.name}
                                    </td>
                                    <td style={styles.td}>{player.year}</td>
                                    <td style={styles.td}>{player.position}{player.secondaryPosition ? `/${player.secondaryPosition}` : ''}</td>
                                    <td style={styles.td}>{formatPlayerHeight(player.height)}</td>
                                    <td style={styles.td}>{player.overall}</td>
                                    <td style={styles.td}>{formatPotentialValue(player.potential)}</td>
                                    {statKeys.map(stat => (
                                        <td key={stat} style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span>{Math.round(player.stats[stat])}</span>
                                                <button
                                                    onClick={() => handleTrain(player.id, stat)}
                                                    disabled={!canTrain || player.stats[stat] >= 99}
                                                    style={{ ...styles.smallButton, padding: '2px 4px', lineHeight: 1 }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                    ))}
                                    <td style={styles.td}>
                                        <button
                                            style={{ ...styles.smallButton, backgroundColor: player.isTargeted ? '#4CAF50' : '#C0C0C0' }}
                                            onClick={() => dispatch({ type: 'TOGGLE_PLAYER_TARGET', payload: { playerId: player.id } })}
                                        >
                                            {player.isTargeted ? 'Targeted' : 'Target'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            <div style={styles.autoTrainingLogContainer}>
                <Subheading color={colors.primary}>Auto-Training Log</Subheading>
                {state.autoTrainingLog.length ? (
                    <ul style={styles.autoTrainingLogList}>
                        {state.autoTrainingLog.slice(0, 8).map((entry, index) => (
                            <li key={`${entry}-${index}`} style={{ marginBottom: '4px' }}>{entry}</li>
                        ))}
                    </ul>
                ) : (
                    <p style={styles.autoTrainingLogEmpty}>No automatic training entries yet.</p>
                )}
            </div>
        </div>
    );
};

export default InSeasonTrainingView;
