
import React from 'react';
import { GameAction } from '../types';
import { SCHOOLS, SCHOOL_PRESTIGE_RANGES, SCHOOL_COLORS } from '../constants';
import { schoolNameToSlug, getSchoolLogoUrl, bestTextColor } from '../services/utils';

interface TeamSelectionProps {
    dispatch: React.Dispatch<GameAction>;
}

const TeamSelection = ({ dispatch }: TeamSelectionProps) => {
    const handleRandomTeam = () => {
        const weightedSchools = SCHOOLS.map(school => {
            const prestigeRange = SCHOOL_PRESTIGE_RANGES[school] || { min: 55, max: 75 };
            const averagePrestige = (prestigeRange.min + prestigeRange.max) / 2;
            const weight = Math.max(1, Math.round(120 - averagePrestige));
            return { school, weight };
        });
        const totalWeight = weightedSchools.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const entry of weightedSchools) {
            roll -= entry.weight;
            if (roll <= 0) {
                dispatch({ type: 'SELECT_TEAM', payload: entry.school });
                return;
            }
        }
        dispatch({ type: 'SELECT_TEAM', payload: weightedSchools[weightedSchools.length - 1].school });
    };

    return (
        <div style={{
            padding: '40px 20px',
            backgroundColor: '#C0C0C0',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            <h1 style={{
                fontSize: '32px',
                fontWeight: 400,
                color: '#0f172a',
                marginBottom: '12px',
                fontFamily: "'Press Start 2P', cursive",
                textShadow: '3px 3px 0 #94a3b8',
            }}>Sweet Sixteen</h1>
            <p style={{ color: '#475569', marginBottom: '24px', fontSize: '14px' }}>Select your team to begin your coaching journey</p>
            <button
                style={{
                    padding: '12px 28px',
                    border: '2px solid #0f172a',
                    borderRadius: '6px',
                    backgroundColor: '#fde047',
                    color: '#0f172a',
                    boxShadow: '3px 3px 0 #0f172a',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginBottom: '28px',
                }}
                onClick={handleRandomTeam}
            >
                Select Random Team
            </button>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '10px',
                width: '100%',
                maxWidth: '1400px',
            }}>
                {SCHOOLS.slice().sort((a, b) => a.localeCompare(b)).map(school => {
                    const colors = SCHOOL_COLORS[school] || { primary: '#4b5563', secondary: '#ffffff', text: '#ffffff' };
                    const logoUrl = getSchoolLogoUrl(school);
                    const textColor = bestTextColor(colors.primary);
                    return (
                        <button
                            key={school}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '12px 8px',
                                minHeight: '90px',
                                backgroundColor: colors.primary,
                                border: '2px solid #0f172a',
                                borderRadius: '6px',
                                boxShadow: '3px 3px 0 #0f172a',
                                cursor: 'pointer',
                                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                            onClick={() => dispatch({ type: 'SELECT_TEAM', payload: school })}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '4px 4px 0 #0f172a';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '3px 3px 0 #0f172a';
                            }}
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="" style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'contain',
                                }} />
                            ) : (
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(255,255,255,0.2)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '18px', 
                                    fontWeight: 900, 
                                    color: textColor,
                                }}>
                                    {school.charAt(0)}
                                </div>
                            )}
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: textColor,
                                lineHeight: 1.15,
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                wordBreak: 'break-word',
                                maxWidth: '100%',
                            }}>{school}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamSelection;
