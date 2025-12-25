
import React from 'react';
import { ISODate } from '../types';
import { formatISODate } from '../services/dateService';

interface CalendarWidgetProps {
    date: ISODate;
    season: number;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ date, season }) => {
    return (
        <div style={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '150px',
            border: '1px solid rgba(15,23,42,0.18)',
            boxShadow: '0 10px 18px rgba(15,23,42,0.08)'
        }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.65)', marginBottom: '4px' }}>SEASON {season}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatISODate(date)}</div>
        </div>
    );
};
