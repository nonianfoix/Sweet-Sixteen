import React from 'react';
import { GameAction, GameState, TeamColors, CoachSkill } from './types';
import { COACH_SKILL_TREE } from './constants';

interface CoachSkillTreeProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
    isEmbedded?: boolean; // New prop to control layout when inside a modal
}

export const CoachSkillTree: React.FC<CoachSkillTreeProps> = ({ state, dispatch, colors, isEmbedded = false }) => {
    const { coach } = state;

    if (!coach) return null;

    const handlePurchase = (skillId: string, cost: number) => {
        if (coach.skillPoints >= cost) {
            dispatch({ type: 'PURCHASE_SKILL', payload: { skillId } });
        } else {
            dispatch({ type: 'SET_TOAST', payload: "Not enough skill points!" });
        }
    };

    // Pastelish colors for different skill types/levels to add vibrancy
    const getSkillColor = (level: number, max: number) => {
        if (level === 0) return '#64748b'; // Slate (Locked/Unowned)
        if (level === max) return '#10b981'; // Emerald (Maxed)
        return '#3b82f6'; // Blue (In Progress)
    };

    return (
        <div style={{ 
            padding: isEmbedded ? '0' : '20px', 
            maxWidth: isEmbedded ? '100%' : '1200px', 
            margin: '0 auto',
            maxHeight: isEmbedded ? '60vh' : 'auto',
            overflowY: isEmbedded ? 'auto' : 'visible'
        }}>
             {!isEmbedded && (
                 <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'STAFF' as any })}
                    style={{
                        marginBottom: '20px',
                        padding: '8px 16px',
                        backgroundColor: '#fff',
                        color: '#0f172a',
                        border: '2px solid #0f172a',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        boxShadow: '2px 2px 0 #0f172a',
                        fontSize: '0.9rem'
                    }}
                >
                    ← Back to Staff
                </button>
             )}

            <div style={{ 
                background: isEmbedded ? 'transparent' : '#f8fafc', 
                border: isEmbedded ? 'none' : '2px solid #0f172a', 
                boxShadow: isEmbedded ? 'none' : '4px 4px 0 #0f172a', 
                borderRadius: isEmbedded ? '0' : '8px',
                padding: isEmbedded ? '0' : '24px'
            }}>
                {/* Header only if not embedded (Modal presumably has its own header) */}
                {!isEmbedded && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
                        <h2 style={{ color: '#0f172a', margin: 0, fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Coach Skill Tree</h2>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Skill Points: {coach.skillPoints}</div>
                            <div style={{ 
                                fontSize: '0.9rem', 
                                color: '#1e293b', 
                                fontWeight: 700, 
                                marginTop: '4px',
                                background: '#e2e8f0',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block'
                            }}>
                                Level {coach.level}
                            </div>
                        </div>
                    </div>
                )}
                
                {isEmbedded && (
                     <div style={{ 
                         display: 'flex', 
                         justifyContent: 'space-between', 
                         marginBottom: '16px', 
                         padding: '12px', 
                         background: '#e0f2fe', 
                         border: '2px solid #0369a1', 
                         borderRadius: '6px',
                         color: '#0c4a6e',
                         fontWeight: 800
                     }}>
                         <span>Unspent SP: {coach.skillPoints}</span>
                         <span>Level {coach.level}</span>
                     </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {COACH_SKILL_TREE.map((skill: CoachSkill) => {
                        const currentLevel = coach.skills[skill.id] || 0;
                        const isMaxed = currentLevel >= skill.maxLevel;
                        const canAfford = coach.skillPoints >= skill.cost;
                        // const nextLevel = currentLevel + 1; // Unused
                        const accentColor = getSkillColor(currentLevel, skill.maxLevel);

                        return (
                            <div key={skill.id} style={{ 
                                border: `2px solid ${accentColor}`, 
                                borderRadius: '8px', 
                                padding: '16px',
                                backgroundColor: '#fff',
                                boxShadow: `4px 4px 0 ${accentColor}`,
                                opacity: isMaxed ? 0.9 : 1,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: accentColor }}>{skill.name}</h3>
                                    <span style={{ 
                                        backgroundColor: accentColor, 
                                        color: '#fff', 
                                        padding: '2px 8px', 
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        Lvl {currentLevel}/{skill.maxLevel}
                                    </span>
                                </div>
                                
                                <p style={{ fontSize: '0.85rem', color: '#475569', minHeight: '40px', lineHeight: '1.4', marginBottom: '12px' }}>
                                    {skill.description}
                                </p>

                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>
                                        Cost: <span style={{ color: '#0f172a' }}>{skill.cost} SP</span>
                                    </span>
                                    <button
                                        onClick={() => handlePurchase(skill.id, skill.cost)}
                                        disabled={isMaxed || !canAfford}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: isMaxed ? '#e2e8f0' : (canAfford ? '#fde047' : '#f1f5f9'),
                                            color: isMaxed ? '#94a3b8' : (canAfford ? '#0f172a' : '#94a3b8'),
                                            border: '2px solid',
                                            borderColor: isMaxed ? '#cbd5e1' : (canAfford ? '#0f172a' : '#cbd5e1'),
                                            borderRadius: '6px',
                                            cursor: isMaxed || !canAfford ? 'not-allowed' : 'pointer',
                                            fontWeight: 800,
                                            boxShadow: canAfford && !isMaxed ? '2px 2px 0 #0f172a' : 'none',
                                            textTransform: 'uppercase',
                                            fontSize: '0.75rem',
                                            transform: canAfford && !isMaxed ? 'translateY(-2px)' : 'none'
                                        }}
                                    >
                                        {isMaxed ? 'Maxed' : 'Upgrade'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
