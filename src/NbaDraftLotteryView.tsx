import React, { useState, useEffect } from 'react';
import type { GameState, GameAction, TeamColors, NBASimulationResult, Team } from './types';
import { NBA_TEAMS } from './constants';
import { REAL_NBA_DRAFTS, RealDraftPick } from './data/realNbaDrafts';

interface NbaDraftLotteryViewProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

export const NbaDraftLotteryView = ({ state, dispatch, colors }: NbaDraftLotteryViewProps) => {
    const [revealedIndex, setRevealedIndex] = useState<number>(-1);
    const [isComplete, setIsComplete] = useState<boolean>(false);

    const currentYearDraft = REAL_NBA_DRAFTS[state.seasonYear];

    // Get the draft order from the simulation result
    // In our simplified logic, the order is already determined by simulateNBASeason.
    // However, for the "Lottery" drama, we want to reveal the top 14 picks specifically.
    const simulatedDraftOrder = state.currentNBASimulation?.draftOrder || []; // Array of Team Names
    const lotteryPicks = simulatedDraftOrder.slice(0, 14).map((teamName, index) => {
        const pickNumber = index + 1;
        const realPick = currentYearDraft?.find(pick => pick.pick === pickNumber);
        return {
            pick: pickNumber,
            team: teamName,
            player: realPick?.player || '???',
            college: realPick?.college || 'N/A'
        };
    });
    
    useEffect(() => {
        if (revealedIndex < 14) {
            const timer = setTimeout(() => {
                setRevealedIndex(prev => prev + 1);
            }, 1000); // 1 second per reveal
            return () => clearTimeout(timer);
        } else {
            setIsComplete(true);
        }
    }, [revealedIndex]);

    const getTeamLogo = (teamName: string) => {
         // Placeholder or use existing logic if available.
         // For now just return name
         return null;
    };
    
    
    // We want to display them in reverse order of reveal (14 -> 1)
    // revealedIndex 0 -> Show Pick 14
    // revealedIndex 1 -> Show Pick 13
    // ...
    // revealedIndex 13 -> Show Pick 1
    


    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ color: colors.primary, fontSize: '2em', marginBottom: '20px' }}>NBA Draft Lottery</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                {/* Header Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', padding: '10px', width: '100%', borderBottom: '2px solid #ccc', fontWeight: 'bold' }}>
                    <div>Pick</div>
                    <div>Team</div>
                    <div>Player</div>
                    <div>College</div>
                </div>

                {/* Slots 1-14 (Static placeholders until revealed) */}
                {lotteryPicks.map((pickData, idx) => {
                    const pickNum = pickData.pick; // 1 to 14
                    
                    const isRevealed = revealedIndex >= (13 - idx);
                    
                    return (
                        <div key={idx} style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '80px 1fr 1fr 1fr', // Added columns for Player and College
                            padding: '15px', 
                            width: '100%', 
                            backgroundColor: isRevealed ? (pickNum === 1 ? '#FFD700' : '#f9f9f9') : '#eee',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            transition: 'all 0.5s ease',
                            opacity: isRevealed ? 1 : 0.5
                        }}>
                            <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>#{pickNum}</div>
                            <div style={{ fontSize: '1.2em', fontWeight: isRevealed ? 'bold' : 'normal' }}>
                                {isRevealed ? pickData.team : '???'}
                            </div>
                            <div style={{ fontSize: '1.2em', fontWeight: isRevealed ? 'bold' : 'normal' }}>
                                {isRevealed ? pickData.player : '???'}
                            </div>
                            <div style={{ fontSize: '1.2em', fontWeight: isRevealed ? 'bold' : 'normal' }}>
                                {isRevealed ? pickData.college : '???'}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isComplete && (
                <div style={{ marginTop: '30px' }}>
                    <button 
                        onClick={() => dispatch({ type: 'ADVANCE_TO_DRAFT' } as any)}
                        style={{
                            padding: '15px 30px',
                            fontSize: '1.2em',
                            backgroundColor: colors.primary,
                            color: colors.text,
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Proceed to Draft
                    </button>
                </div>
            )}
        </div>
    );
};
