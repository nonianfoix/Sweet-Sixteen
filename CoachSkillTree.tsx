import React from 'react';
import { GameAction, GameState, TeamColors, CoachSkill } from './types';
import { COACH_SKILL_TREE } from './constants';

interface CoachSkillTreeProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

export const CoachSkillTree: React.FC<CoachSkillTreeProps> = ({ state, dispatch, colors }) => {
    const { coach } = state;

    if (!coach) return null;

    const handlePurchase = (skillId: string, cost: number) => {
        if (coach.skillPoints >= cost) {
            dispatch({ type: 'PURCHASE_SKILL', payload: { skillId } });
        } else {
            dispatch({ type: 'SET_TOAST', payload: "Not enough skill points!" });
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: colors.primary, margin: 0 }}>Coach Skill Tree</h2>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Skill Points: {coach.skillPoints}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Level {coach.level}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {COACH_SKILL_TREE.map((skill: CoachSkill) => {
                    const currentLevel = coach.skills[skill.id] || 0;
                    const isMaxed = currentLevel >= skill.maxLevel;
                    const canAfford = coach.skillPoints >= skill.cost;
                    const nextLevel = currentLevel + 1;

                    return (
                        <div key={skill.id} style={{ 
                            border: `1px solid ${colors.secondary}`, 
                            borderRadius: '8px', 
                            padding: '15px',
                            backgroundColor: currentLevel > 0 ? '#f0f9ff' : '#fff',
                            opacity: isMaxed ? 0.8 : 1
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{skill.name}</h3>
                                <span style={{ 
                                    backgroundColor: colors.primary, 
                                    color: colors.text, 
                                    padding: '2px 8px', 
                                    borderRadius: '12px',
                                    fontSize: '0.8rem'
                                }}>
                                    Lvl {currentLevel}/{skill.maxLevel}
                                </span>
                            </div>
                            
                            <p style={{ fontSize: '0.9rem', color: '#444', minHeight: '40px' }}>
                                {skill.description}
                            </p>

                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: '#666' }}>
                                    Cost: {skill.cost} SP
                                </span>
                                <button
                                    onClick={() => handlePurchase(skill.id, skill.cost)}
                                    disabled={isMaxed || !canAfford}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: isMaxed ? '#ccc' : (canAfford ? colors.secondary : '#eee'),
                                        color: isMaxed ? '#666' : (canAfford ? colors.text : '#999'),
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isMaxed || !canAfford ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isMaxed ? 'Maxed' : 'Upgrade'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <button 
                onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'STAFF' as any })}
                style={{
                    marginTop: '30px',
                    padding: '10px 20px',
                    backgroundColor: '#eee',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Back to Staff
            </button>
        </div>
    );
};
