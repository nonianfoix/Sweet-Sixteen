import React, { useState } from 'react';
import { GameAction, Team, GameState, CapitalProject } from './types';
import { FACILITY_UPGRADES } from './constants';

interface FacilitiesTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: any;
}

const FACILITY_TYPES = [
    { key: 'arena', label: 'Arena', icon: '🏟️', description: 'Boosts attendance revenue.', benefit: 'Revenue' },
    { key: 'training', label: 'Training Center', icon: '🏋️', description: 'Improves player development speed.', benefit: 'Development' },
    { key: 'scouting', label: 'Scouting Dept', icon: '🔭', description: 'Reveals more recruit attributes.', benefit: 'Recruiting' },
    { key: 'coaching', label: 'Coaching Suites', icon: '📋', description: 'Unlocks more gameplan options.', benefit: 'Strategy' },
    { key: 'medical', label: 'Medical Center', icon: '🏥', description: 'Reduces injury duration.', benefit: 'Health' },
    { key: 'academic', label: 'Academic Center', icon: '📚', description: 'Boosts team GPA and Academic recruiting.', benefit: 'Academics' },
    { key: 'nutrition', label: 'Nutrition Center', icon: '🥗', description: 'Boosts physical development.', benefit: 'Physicals' },
    { key: 'housing', label: 'Housing', icon: '🏠', description: 'Boosts morale and recruiting.', benefit: 'Morale' },
] as const;

export const FacilitiesTab: React.FC<FacilitiesTabProps> = ({ state, userTeam, dispatch, colors }) => {
    const facilities = userTeam.facilities || {};
    const cash = userTeam.budget?.cash || 0;
    const activeProjects = userTeam.activeCapitalProjects || [];
    const maintenanceAllocation = userTeam.budget?.allocations?.facilities || 0;

    const [contributionAmounts, setContributionAmounts] = useState<Record<string, number>>({});

    const handleStartProject = (type: string, upgrade: any) => {
        if (activeProjects.some(p => p.type === type)) {
            dispatch({ type: 'SET_TOAST', payload: 'A project for this facility is already active.' });
            return;
        }

        const newProject: CapitalProject = {
            id: Math.random().toString(36).substr(2, 9),
            name: upgrade.name,
            type: type as any,
            description: upgrade.description,
            totalCost: upgrade.cost,
            fundsAllocated: 0,
            status: 'Planning',
            weeksRemaining: upgrade.weeks,
            benefitDescription: upgrade.benefit,
            newLevel: upgrade.level
        };

        dispatch({ type: 'START_CAPITAL_PROJECT', payload: { project: newProject } });
    };

    const handleContribute = (projectId: string) => {
        const amount = contributionAmounts[projectId] || 0;
        if (amount <= 0) return;
        if (cash < amount) {
            dispatch({ type: 'SET_TOAST', payload: 'Insufficient funds.' });
            return;
        }
        dispatch({ type: 'CONTRIBUTE_TO_PROJECT', payload: { projectId, amount } });
        setContributionAmounts(prev => ({ ...prev, [projectId]: 0 }));
    };

    const handleRenovate = (facilityKey: string, quality: number) => {
        if (quality >= 100) return;
        const cost = Math.round((100 - quality) * 5000); // $5k per 1% quality
        if (cash < cost) {
            dispatch({ type: 'SET_TOAST', payload: 'Insufficient funds for renovation.' });
            return;
        }
        dispatch({ type: 'RENOVATE_FACILITY', payload: { facilityKey, cost } });
    };

    const handleMaintenanceChange = (amount: number) => {
        dispatch({ type: 'UPDATE_BUDGET_ALLOCATION', payload: { category: 'facilities', amount } });
    };

    const renderFacilityCard = (type: typeof FACILITY_TYPES[number]) => {
        const fac = (facilities as any)[type.key];
        const level = fac?.level || 1;
        const quality = fac?.quality || 50;
        
        // Find active project for this facility
        const activeProject = activeProjects.find(p => p.type === type.label.split(' ')[0] || p.type === type.key.charAt(0).toUpperCase() + type.key.slice(1));
        
        // Find next upgrade if no active project
        const upgradeKey = type.key.charAt(0).toUpperCase() + type.key.slice(1);
        const nextUpgrade = !activeProject ? (FACILITY_UPGRADES as any)[upgradeKey]?.find((u: any) => u.level === level + 1) : null;

        const renovationCost = Math.round((100 - quality) * 5000);
        
        let conditionColor = '#4ade80';
        let conditionText = 'Excellent';
        if (quality < 90) { conditionColor = '#a3e635'; conditionText = 'Good'; }
        if (quality < 75) { conditionColor = '#facc15'; conditionText = 'Fair'; }
        if (quality < 50) { conditionColor = '#f87171'; conditionText = 'Poor'; }
        if (quality < 25) { conditionColor = '#ef4444'; conditionText = 'Critical'; }

        return (
            <div key={type.key} style={{ 
                border: `1px solid ${colors.border}`, 
                borderRadius: '12px', 
                padding: '1.25rem',
                backgroundColor: colors.card,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                            fontSize: '1.5rem', 
                            backgroundColor: colors.background, 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            {type.icon}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>{type.label}</h3>
                            <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>Level {level}</div>
                        </div>
                    </div>
                    {level >= 5 && (
                        <div style={{ 
                            backgroundColor: '#fbbf24', 
                            color: '#fff', 
                            fontSize: '0.7rem', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontWeight: 'bold' 
                        }}>
                            MAX
                        </div>
                    )}
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563' }}>
                    {type.description}
                </p>
                
                {/* Quality Section */}
                <div style={{ backgroundColor: colors.background, padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#1f2937' }}>
                        <span>Condition: <span style={{ color: conditionColor, fontWeight: 'bold' }}>{conditionText}</span></span>
                        <span>{Math.round(quality)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${quality}%`, 
                            height: '100%', 
                            backgroundColor: conditionColor,
                            borderRadius: '3px',
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                    {quality < 100 && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleRenovate(type.key, quality)}
                                disabled={cash < renovationCost}
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 8px',
                                    backgroundColor: cash >= renovationCost ? colors.secondary : '#e5e7eb',
                                    color: cash >= renovationCost ? colors.primary : '#9ca3af',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: cash >= renovationCost ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <span>🛠️ Renovate</span>
                                <span>(${renovationCost.toLocaleString()})</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Active Project or Upgrade Option */}
                {activeProject ? (
                    <div style={{ 
                        marginTop: 'auto',
                        backgroundColor: '#eff6ff', 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid #dbeafe' 
                    }}>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#1e40af' }}>{activeProject.name}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#1e3a8a' }}>
                            <span>{activeProject.status}</span>
                            {activeProject.status === 'Construction' && <span>{activeProject.weeksRemaining} wks left</span>}
                        </div>

                        <div style={{ width: '100%', height: '8px', backgroundColor: '#dbeafe', borderRadius: '4px', marginBottom: '0.5rem' }}>
                            <div style={{ 
                                width: `${Math.min(100, (activeProject.fundsAllocated / activeProject.totalCost) * 100)}%`, 
                                height: '100%', 
                                backgroundColor: activeProject.status === 'Construction' ? '#3b82f6' : '#10b981',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        
                        {activeProject.status === 'Planning' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    placeholder="$"
                                    value={contributionAmounts[activeProject.id] || ''}
                                    onChange={(e) => setContributionAmounts(prev => ({ ...prev, [activeProject.id]: parseInt(e.target.value) || 0 }))}
                                    style={{ 
                                        width: '70px', 
                                        padding: '4px', 
                                        fontSize: '0.8rem', 
                                        borderRadius: '4px', 
                                        border: '1px solid #bfdbfe' 
                                    }}
                                />
                                <button 
                                    onClick={() => handleContribute(activeProject.id)}
                                    disabled={!contributionAmounts[activeProject.id] || contributionAmounts[activeProject.id] <= 0}
                                    style={{ 
                                        flex: 1, 
                                        backgroundColor: '#2563eb', 
                                        color: '#fff', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Fund
                                </button>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#60a5fa', marginTop: '4px' }}>
                            <span>${activeProject.fundsAllocated.toLocaleString()} / ${activeProject.totalCost.toLocaleString()}</span>
                        </div>
                    </div>
                ) : nextUpgrade ? (
                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: `1px dashed ${colors.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1f2937' }}>Next: {nextUpgrade.name}</span>
                            <span style={{ fontSize: '0.8rem', color: colors.primary, fontWeight: 'bold' }}>${nextUpgrade.cost.toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={() => handleStartProject(upgradeKey, nextUpgrade)}
                            style={{ 
                                width: '100%',
                                backgroundColor: colors.primary, 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '6px', 
                                padding: '8px', 
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Start Project
                        </button>
                    </div>
                ) : (
                    <div style={{ marginTop: 'auto', padding: '1rem', textAlign: 'center', color: colors.textMuted, fontSize: '0.85rem', fontStyle: 'italic', backgroundColor: colors.background, borderRadius: '8px' }}>
                        State of the Art Facility
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Dashboard Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2rem',
                backgroundColor: colors.card,
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.border}`
            }}>
                <div>
                    <h2 style={{ color: '#1f2937', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Facilities Management</h2>
                    <p style={{ fontSize: '0.9rem', margin: 0, color: '#4b5563' }}>
                        Maintain and upgrade your campus infrastructure to attract top talent.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '4px' }}>Weekly Maintenance Budget</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <input 
                                type="range" 
                                min="0" 
                                max="100000" 
                                step="1000" 
                                value={maintenanceAllocation} 
                                onChange={(e) => handleMaintenanceChange(parseInt(e.target.value))}
                                style={{ width: '120px' }}
                            />
                            <span style={{ fontWeight: 'bold', color: '#1f2937', minWidth: '80px' }}>${maintenanceAllocation.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', paddingLeft: '2rem', borderLeft: `1px solid ${colors.border}` }}>
                        <div style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '4px' }}>War Chest</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                            ${cash.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Facilities Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: '1.5rem' 
            }}>
                {FACILITY_TYPES.map(renderFacilityCard)}
            </div>
        </div>
    );
};