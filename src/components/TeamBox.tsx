
import React from 'react';
import { TeamColors } from '../types';
import { SCHOOL_COLORS } from '../constants';

const styles = {
    button: {
        padding: '8px 16px',
        border: '2px solid #000',
        borderRadius: '6px',
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
        fontSize: '0.7rem',
        fontFamily: "'Press Start 2P', 'Courier New', system-ui, sans-serif",
    },
};

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
        ? { primary: '#C0C0C0', secondary: '#808080', text: '#000000' } 
        : SCHOOL_COLORS[name] || { primary: '#C0C0C0', secondary: '#808080', text: '#000000' };
    
    const style: React.CSSProperties = {
        ...styles.button,
        backgroundColor: teamColors.primary,
        color: teamColors.text,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5px 8px',
        fontSize: '0.9rem',
        marginBottom: 0,
        width: '100%',
        textAlign: 'center',
        height: '75px', // Ensure consistent height for 3 lines of text
    };
    
    if (isUserTeam) {
        style.border = `3px solid ${userTeamColors.secondary}`;
        style.boxShadow = `0 0 8px ${userTeamColors.secondary}`;
    }

    return (
        <div style={style}>
            <span style={{ flexGrow: 1, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                (#{seed}) {name} {conference && `(${conference})`}
            </span>
            {played && <span style={{
                flexShrink: 0,
                marginLeft: '10px',
                backgroundColor: '#E0E0E0',
                color: isWinner ? 'green' : '#000000',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '0.8rem',
            }}>{score}</span>}
        </div>
    );
};

export default TeamBox;
