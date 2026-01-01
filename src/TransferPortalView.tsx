import React, { useState, useMemo } from 'react';
import type { GameState, GameAction, TeamColors, Player } from './types';
import { calculateTransferPlayerInterest } from './services/gameService';

export const TransferPortalView = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const { portalPlayers, userTeam } = state;
    const [positionFilter, setPositionFilter] = useState<string>('All');
    const [minOverall, setMinOverall] = useState<number>(0);
    const [minInterest, setMinInterest] = useState<number>(0);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'overall', direction: 'desc' });

    const filteredPlayers = useMemo(() => {
        if (!portalPlayers) return [];
        return portalPlayers.filter(player => {
            if (positionFilter !== 'All' && player.position !== positionFilter) return false;
            if (player.overall < minOverall) return false;
            const interest = userTeam ? calculateTransferPlayerInterest(player, userTeam, state.coach?.skills) : 0;
            if (interest < minInterest) return false;
            return true;
        });
    }, [portalPlayers, positionFilter, minOverall, minInterest, userTeam, state.coach?.skills]);

    const sortedPlayers = useMemo(() => {
        return [...filteredPlayers].sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof Player];
            let bValue: any = b[sortConfig.key as keyof Player];

            if (sortConfig.key === 'interest') {
                aValue = userTeam ? calculateTransferPlayerInterest(a, userTeam, state.coach?.skills) : 0;
                bValue = userTeam ? calculateTransferPlayerInterest(b, userTeam, state.coach?.skills) : 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPlayers, sortConfig, userTeam, state.coach?.skills]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    if (!portalPlayers) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{color: colors.primary}}>Transfer Portal</h2>
                    <button 
                        onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'DASHBOARD' as any })}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#eee',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Back to Dashboard
                    </button>
                </div>
                <p>The transfer portal is currently empty.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{color: colors.primary}}>Transfer Portal</h2>
            <p>The following players are in the transfer portal. You can offer them a scholarship to join your team.</p>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} style={{ padding: '5px' }}>
                    <option value="All">All Positions</option>
                    <option value="PG">PG</option>
                    <option value="SG">SG</option>
                    <option value="SF">SF</option>
                    <option value="PF">PF</option>
                    <option value="C">C</option>
                </select>
                <input 
                    type="number" 
                    placeholder="Min Overall" 
                    value={minOverall} 
                    onChange={e => setMinOverall(Number(e.target.value))} 
                    style={{ padding: '5px', width: '100px' }} 
                />
                <input 
                    type="number" 
                    placeholder="Min Interest" 
                    value={minInterest} 
                    onChange={e => setMinInterest(Number(e.target.value))} 
                    style={{ padding: '5px', width: '100px' }} 
                />
            </div>

            <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr style={{backgroundColor: colors.primary, color: colors.text}}>
                            <th onClick={() => requestSort('name')} style={{padding: '8px', border: `1px solid ${colors.secondary}`, cursor: 'pointer'}}>Name</th>
                            <th onClick={() => requestSort('position')} style={{padding: '8px', border: `1px solid ${colors.secondary}`, cursor: 'pointer'}}>Pos</th>
                            <th onClick={() => requestSort('year')} style={{padding: '8px', border: `1px solid ${colors.secondary}`, cursor: 'pointer'}}>Yr</th>
                            <th onClick={() => requestSort('overall')} style={{padding: '8px', border: `1px solid ${colors.secondary}`, cursor: 'pointer'}}>Ovr</th>
                            <th onClick={() => requestSort('potential')} style={{padding: '8px', border: `1px solid ${colors.secondary}`, cursor: 'pointer'}}>Pot</th>
                            <th onClick={() => requestSort('interest')} style={{padding: '8px', border: `1px solid ${colors.secondary}`, cursor: 'pointer'}}>Int</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Motivation</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Origin</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Offers</th>
                            <th style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map(player => {
                            const interest = userTeam ? calculateTransferPlayerInterest(player, userTeam, state.coach?.skills) : 0;
                            return (
                                <tr key={player.id}>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.name}</td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.position}</td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.year}</td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.overall}</td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.potential}</td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{interest}</td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`, fontSize: '0.8em', fontStyle: 'italic'}}>{player.transferMotivation || 'N/A'}</td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>{player.originTeamName}</td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>
                                        {player.cpuOffers ? player.cpuOffers.length : 0}
                                    </td>
                                    <td style={{padding: '8px', border: `1px solid ${colors.secondary}`}}>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button 
                                                onClick={() => dispatch({ type: 'OFFER_TRANSFER_PLAYER', payload: { playerId: player.id } })}
                                                disabled={player.userHasOffered}
                                                style={{
                                                    backgroundColor: player.userHasOffered ? '#ccc' : colors.secondary,
                                                    color: colors.text,
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    cursor: player.userHasOffered ? 'default' : 'pointer'
                                                }}
                                            >
                                                {player.userHasOffered ? 'Offered' : 'Offer'}
                                            </button>
                                            <button 
                                                onClick={() => dispatch({ type: 'TOGGLE_TRANSFER_TARGET', payload: { playerId: player.id } })}
                                                style={{
                                                    backgroundColor: player.isTargeted ? '#4CAF50' : '#ccc',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {player.isTargeted ? 'Targeted' : 'Target'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <button onClick={() => dispatch({ type: 'SIMULATE_TRANSFER_PORTAL_DAY' })} style={{marginTop: '20px', padding: '10px', backgroundColor: colors.secondary, color: colors.text, border: 'none', cursor: 'pointer'}}>Simulate a Day</button>
            <button onClick={() => dispatch({ type: 'FINALIZE_TRANSFER_PORTAL' })} style={{marginTop: '20px', marginLeft: '10px', padding: '10px', backgroundColor: colors.primary, color: colors.text, border: 'none', cursor: 'pointer'}}>Finalize Portal</button>
        </div>
    );
};
