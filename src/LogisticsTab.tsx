import React from 'react';
import { GameState, Team, GameAction, TeamColors, TravelMethod, AccommodationTier } from './types';

interface LogisticsTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const TRAVEL_METHODS: { value: TravelMethod; label: string; costMultiplier: number; fatigueImpact: string }[] = [
    { value: 'Bus', label: 'Team Bus', costMultiplier: 1.0, fatigueImpact: 'High' },
    { value: 'Commercial', label: 'Commercial Flights', costMultiplier: 3.0, fatigueImpact: 'Medium' },
    { value: 'Charter', label: 'Private Charter', costMultiplier: 8.0, fatigueImpact: 'Low' },
];

const ACCOMMODATION_TIERS: { value: AccommodationTier; label: string; costMultiplier: number; moraleImpact: string }[] = [
    { value: 'Budget', label: 'Budget Motels', costMultiplier: 1.0, moraleImpact: 'Negative' },
    { value: 'Standard', label: 'Standard Hotels', costMultiplier: 2.5, moraleImpact: 'Neutral' },
    { value: 'Luxury', label: 'Luxury Resorts', costMultiplier: 6.0, moraleImpact: 'Positive' },
];

const LogisticsTab: React.FC<LogisticsTabProps> = ({ state, userTeam, dispatch, colors }) => {
    const travel = userTeam.travelSettings || { defaultMethod: 'Bus', defaultAccommodation: 'Budget' };

    const handleMethodChange = (method: TravelMethod) => {
        dispatch({ 
            type: 'SET_TRAVEL_SETTINGS', 
            payload: { method, accommodation: travel.defaultAccommodation } 
        });
    };

    const handleAccommodationChange = (accommodation: AccommodationTier) => {
        dispatch({ 
            type: 'SET_TRAVEL_SETTINGS', 
            payload: { method: travel.defaultMethod, accommodation } 
        });
    };

    // Calculate projected weekly cost (rough estimate)
    // Matching backend logic from gameService.ts
    // Travel: Bus=2k, Comm=15k, Charter=45k
    // Lodging: Budget=1k, Std=5k, Lux=15k
    // Distance Multiplier: 1x (Close) to 2.5x (Far). Avg ~1.75x
    
    let travelBase = 2000;
    if (travel.defaultMethod === 'Commercial') travelBase = 15000;
    if (travel.defaultMethod === 'Charter') travelBase = 45000;

    let lodgingBase = 1000;
    if (travel.defaultAccommodation === 'Standard') lodgingBase = 5000;
    if (travel.defaultAccommodation === 'Luxury') lodgingBase = 15000;

    // Estimate using average distance (1.75x multiplier on travel only)
    const avgTravelCost = travelBase * 1.75;
    const costPerTrip = avgTravelCost + lodgingBase;
    
    // Average 1 away game per week
    const projectedWeeklyCost = costPerTrip;

    const styles = {
        container: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            height: '100%',
            fontFamily: "'Press Start 2P', cursive",
            padding: '1rem',
        } as React.CSSProperties,
        card: {
            backgroundColor: '#ffffff',
            border: `4px solid ${colors.primary}`,
            padding: '1.5rem',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
        } as React.CSSProperties,
        sectionTitle: {
            fontSize: '0.9rem',
            fontWeight: 700,
            color: colors.primary,
            borderBottom: `4px solid ${colors.secondary}`,
            paddingBottom: '0.75rem',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
        } as React.CSSProperties,
        optionGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        } as React.CSSProperties,
        optionCard: (isSelected: boolean) => ({
            padding: '1rem',
            border: isSelected ? `6px solid ${colors.primary}` : '2px solid #e0e0e0',
            backgroundColor: isSelected ? '#f0f8ff' : '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isSelected ? `0 4px 12px rgba(0,0,0,0.15)` : 'none',
            fontWeight: isSelected ? 'bold' : 'normal',
        } as React.CSSProperties),
        metricCard: {
            backgroundColor: colors.secondary,
            padding: '1.5rem',
            border: '4px solid #000',
            textAlign: 'center',
            color: colors.text,
            boxShadow: '4px 4px 0 rgba(0,0,0,0.1)',
        } as React.CSSProperties,
        metricValue: {
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '1rem 0',
        } as React.CSSProperties,
        impactLabel: (type: 'positive' | 'negative' | 'neutral') => ({
            fontSize: '0.7rem',
            fontWeight: 'bold',
            color: type === 'positive' ? '#2e7d32' : type === 'negative' ? '#c62828' : '#666',
        } as React.CSSProperties),
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Travel Method</h2>
                <div style={styles.optionGroup}>
                    {TRAVEL_METHODS.map(option => (
                        <div 
                            key={option.value}
                            style={styles.optionCard(travel.defaultMethod === option.value)}
                            onClick={() => handleMethodChange(option.value)}
                        >
                            <div>
                                <div style={{fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.25rem'}}>{option.label}</div>
                                <div style={{fontSize: '0.6rem', color: '#666'}}>Fatigue: {option.fatigueImpact}</div>
                            </div>
                            {travel.defaultMethod === option.value && <span style={{color: colors.primary, fontSize: '1.2rem'}}>✔</span>}
                        </div>
                    ))}
                </div>

                <h2 style={{...styles.sectionTitle, marginTop: '1.5rem'}}>Accommodation</h2>
                <div style={styles.optionGroup}>
                    {ACCOMMODATION_TIERS.map(option => (
                        <div 
                            key={option.value}
                            style={styles.optionCard(travel.defaultAccommodation === option.value)}
                            onClick={() => handleAccommodationChange(option.value)}
                        >
                            <div>
                                <div style={{fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.25rem'}}>{option.label}</div>
                                <div style={{fontSize: '0.6rem', color: '#666'}}>Morale: {option.moraleImpact}</div>
                            </div>
                            {travel.defaultAccommodation === option.value && <span style={{color: colors.primary, fontSize: '1.2rem'}}>✔</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Logistics Overview</h2>
                
                <div style={styles.metricCard}>
                    <div style={{fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8}}>Est. Cost Per Trip</div>
                    <div style={styles.metricValue}>${costPerTrip.toLocaleString()}</div>
                </div>

                <div style={{marginTop: '2rem'}}>
                    <h3 style={{fontSize: '0.8rem', marginBottom: '1rem'}}>Impact Analysis</h3>
                    
                    <div style={{marginBottom: '1rem'}}>
                        <div style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem'}}>Player Fatigue</div>
                        <div style={styles.impactLabel(
                            travel.defaultMethod === 'Charter' ? 'positive' : travel.defaultMethod === 'Bus' ? 'negative' : 'neutral'
                        )}>
                            {travel.defaultMethod === 'Charter' ? 'Minimal Impact' : travel.defaultMethod === 'Bus' ? 'Significant Fatigue' : 'Moderate Fatigue'}
                        </div>
                    </div>

                    <div>
                        <div style={{fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem'}}>Team Morale</div>
                        <div style={styles.impactLabel(
                            travel.defaultAccommodation === 'Luxury' ? 'positive' : travel.defaultAccommodation === 'Budget' ? 'negative' : 'neutral'
                        )}>
                            {travel.defaultAccommodation === 'Luxury' ? 'Boosts Morale' : travel.defaultAccommodation === 'Budget' ? 'Hurts Morale' : 'Neutral'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticsTab;
