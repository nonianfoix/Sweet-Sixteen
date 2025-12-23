
import React from 'react';
import { GameDate } from '../types';
import { formatDate } from '../services/dateService';

interface CalendarWidgetProps {
    date: GameDate;
    season: number;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ date, season }) => {
    return (
        <div style={{
            backgroundColor: '#333',
            color: '#fff',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '150px',
            border: '2px solid #555'
        }}>
            <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>SEASON {season}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatDate(date)}</div>
        </div>
    );
};
