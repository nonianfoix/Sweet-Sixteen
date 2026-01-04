
import React from 'react';
import { TeamColors } from '../types';
import { SCHOOL_COLORS } from '../constants';
import { getSchoolLogoUrl, bestTextColor } from '../services/utils';

interface TeamBoxProps {
    name: string;
    seed: number;
    score: number;
    played: boolean;
    conference?: string;
    isUserTeam: boolean;
    userTeamColors: TeamColors;
    isWinner: boolean;
}

const TeamBox = ({ 
    name, 
    seed, 
    score, 
    played, 
    conference, 
    isUserTeam, 
    userTeamColors, 
    isWinner 
}: TeamBoxProps) => {
    const isPlaceholder = !name || name.startsWith('FF Winner');
    const teamColors = isPlaceholder 
        ? { primary: '#e2e8f0', secondary: '#94a3b8', text: '#64748b' } 
        : SCHOOL_COLORS[name] || { primary: '#64748b', secondary: '#94a3b8', text: '#ffffff' };
    
    const textColor = bestTextColor(teamColors.primary);
    const logoUrl = !isPlaceholder ? getSchoolLogoUrl(name) : null;

    const baseStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: teamColors.primary,
        border: isUserTeam ? `3px solid ${userTeamColors.secondary}` : '2px solid #0f172a',
        borderRadius: '6px',
        boxShadow: isUserTeam 
            ? `3px 3px 0 ${userTeamColors.secondary}, 0 0 8px ${userTeamColors.secondary}40` 
            : '3px 3px 0 #0f172a',
        width: '100%',
        minHeight: '50px',
        cursor: 'default',
        transition: 'transform 0.1s ease',
        position: 'relative',
        overflow: 'hidden',
    };

    // Winner highlight
    if (played && isWinner) {
        baseStyle.border = '2px solid #16a34a';
        baseStyle.boxShadow = '3px 3px 0 #16a34a';
    }

    return (
        <div style={baseStyle}>
            {/* Team Logo */}
            {logoUrl ? (
                <img 
                    src={logoUrl} 
                    alt="" 
                    style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                        flexShrink: 0,
                    }} 
                />
            ) : (
                <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.2)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '14px', 
                    fontWeight: 900, 
                    color: textColor,
                    flexShrink: 0,
                }}>
                    {name ? name.charAt(0) : '?'}
                </div>
            )}

            {/* Team Info */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                minWidth: 0,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        color: textColor,
                        opacity: 0.7,
                        flexShrink: 0,
                    }}>
                        #{seed}
                    </span>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: textColor,
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {name || 'TBD'}
                    </span>
                </div>
                {conference && (
                    <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: textColor,
                        opacity: 0.6,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        {conference}
                    </span>
                )}
            </div>

            {/* Score Badge */}
            {played && (
                <div style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: isWinner ? '#16a34a' : 'rgba(0,0,0,0.2)',
                    color: isWinner ? '#ffffff' : textColor,
                    fontWeight: 900,
                    fontSize: '14px',
                    flexShrink: 0,
                    boxShadow: isWinner ? '1px 1px 0 #0f172a' : 'none',
                }}>
                    {score}
                </div>
            )}
        </div>
    );
};

export default TeamBox;
