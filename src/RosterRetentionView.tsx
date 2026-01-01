
import React from 'react';
import type { GameState, GameAction, TeamColors, Player } from './types';

export const RosterRetentionView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const atRiskPlayers = state.userTeam?.roster.filter(p => p.atRiskOfTransfer) || [];

    const getReason = (player: Player) => {
        if ((player.rotationMinutes ?? 0) < 10) return "Unhappy with playing time";
        const winPct = state.userTeam!.record.wins / (state.userTeam!.record.wins + state.userTeam!.record.losses);
        if (winPct < 0.4) return "Wants to join a winning program";
        if (player.potential > player.overall + 5) return "Feels they are not developing";
        return "Considering other options";
    }

    return (
        <div>
            <h2 style={{color: colors.primary}}>Roster Retention</h2>
            <p>The following players are unhappy and considering transferring. You can meet with them to try and convince them to stay.</p>
            
            {atRiskPlayers.length > 0 ? (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr style={{backgroundColor: colors.primary, color: colors.text}}>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Name</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Position</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Year</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Overall</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Potential</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Reason</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {atRiskPlayers.map(player => (
                            <tr key={player.id}>
                                <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.name}</td>
                                <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.position}</td>
                                <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.year}</td>
                                <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.overall}</td>
                                <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.potential}</td>
                                <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.transferMotivation || getReason(player)}</td>
                                <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>
                                    {player.retentionTalkUsed ? (
                                        <span style={{ color: 'red' }}>Persuasion Failed</span>
                                    ) : (
                                        <button onClick={() => dispatch({ type: 'MEET_WITH_PLAYER', payload: {playerId: player.id} })}>Meet with Player</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No players are currently at risk of transferring.</p>
            )}

            <button onClick={() => dispatch({ type: 'FINALIZE_ROSTER_RETENTION' })} style={{marginTop: '20px'}}>Finalize Roster</button>
        </div>
    );
};
