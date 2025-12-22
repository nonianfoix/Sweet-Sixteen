import React from 'react';
import { SeatMix, SeatSegmentKey, AttendanceForecast } from './types';

interface ArenaMapProps {
    seatMix: SeatMix;
    forecast: AttendanceForecast | null;
    selectedZone: SeatSegmentKey | null;
    onZoneSelect: (zone: SeatSegmentKey) => void;
    colors: { primary: string; secondary: string };
    sponsorName?: string;
}

export const ArenaMap: React.FC<ArenaMapProps> = ({ seatMix, forecast, selectedZone, onZoneSelect, colors, sponsorName }) => {
    const getFillColor = (key: SeatSegmentKey) => {
        if (!forecast) return '#eee';
        const segment = forecast.segments.find(s => s.key === key);
        if (!segment || segment.capacity === 0) return '#eee';
        
        const fillRate = segment.filled / segment.capacity;
        // Gradient from Red (low) to Green (high)
        if (fillRate >= 0.95) return '#4caf50'; // Green
        if (fillRate >= 0.80) return '#8bc34a'; // Light Green
        if (fillRate >= 0.60) return '#ffeb3b'; // Yellow
        if (fillRate >= 0.40) return '#ff9800'; // Orange
        return '#f44336'; // Red
    };

    const getOpacity = (key: SeatSegmentKey) => {
        return selectedZone === key ? 1 : selectedZone ? 0.3 : 0.8;
    };

    const getStroke = (key: SeatSegmentKey) => {
        return selectedZone === key ? colors.primary : '#fff';
    };

    return (
        <svg viewBox="0 0 400 300" style={{ width: '100%', height: 'auto', maxHeight: '300px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            {/* Court */}
            <rect x="160" y="110" width="80" height="80" fill="#d2b48c" stroke="#fff" strokeWidth="2" />
            <circle cx="200" cy="150" r="10" fill="none" stroke="#fff" strokeWidth="2" />
            <line x1="200" y1="110" x2="200" y2="190" stroke="#fff" strokeWidth="2" />
            {sponsorName && (
                <>
                    <text x="200" y="140" textAnchor="middle" fontSize="6" fill="#fff" opacity="0.7" fontWeight="bold" letterSpacing="1px">
                        {sponsorName.toUpperCase()}
                    </text>
                    <text x="200" y="165" textAnchor="middle" fontSize="6" fill="#fff" opacity="0.7" fontWeight="bold" letterSpacing="1px">
                        ARENA
                    </text>
                </>
            )}

            {/* Lower Bowl (Ring around court) */}
            <path
                d="M 120 70 L 280 70 L 280 230 L 120 230 Z M 160 110 L 160 190 L 240 190 L 240 110 Z"
                fill={getFillColor('lowerBowl')}
                fillRule="evenodd"
                stroke={getStroke('lowerBowl')}
                strokeWidth="2"
                opacity={getOpacity('lowerBowl')}
                onClick={() => onZoneSelect('lowerBowl')}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            />
            <text x="200" y="90" textAnchor="middle" fontSize="10" fill="#333" pointerEvents="none">Lower Bowl</text>

            {/* Student Section (Behind left basket) */}
            <rect
                x="80"
                y="110"
                width="40"
                height="80"
                fill={getFillColor('studentSection')}
                stroke={getStroke('studentSection')}
                strokeWidth="2"
                opacity={getOpacity('studentSection')}
                onClick={() => onZoneSelect('studentSection')}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            />
            <text x="100" y="155" textAnchor="middle" fontSize="8" fill="#333" transform="rotate(-90 100 155)" pointerEvents="none">Students</text>

            {/* Suites (Top and Bottom strips) */}
            <rect
                x="80"
                y="40"
                width="240"
                height="30"
                fill={getFillColor('suites')}
                stroke={getStroke('suites')}
                strokeWidth="2"
                opacity={getOpacity('suites')}
                onClick={() => onZoneSelect('suites')}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            />
             <rect
                x="80"
                y="230"
                width="240"
                height="30"
                fill={getFillColor('suites')}
                stroke={getStroke('suites')}
                strokeWidth="2"
                opacity={getOpacity('suites')}
                onClick={() => onZoneSelect('suites')}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            />
            <text x="200" y="60" textAnchor="middle" fontSize="10" fill="#333" pointerEvents="none">Luxury Suites</text>

            {/* Upper Bowl (Outer areas) */}
            <path
                d="M 40 10 L 360 10 L 360 290 L 40 290 Z M 80 40 L 320 40 L 320 260 L 80 260 Z"
                fill={getFillColor('upperBowl')}
                fillRule="evenodd"
                stroke={getStroke('upperBowl')}
                strokeWidth="2"
                opacity={getOpacity('upperBowl')}
                onClick={() => onZoneSelect('upperBowl')}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            />
            <text x="200" y="30" textAnchor="middle" fontSize="12" fill="#333" pointerEvents="none">Upper Bowl</text>
        </svg>
    );
};
