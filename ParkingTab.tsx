import React, { useState, useEffect } from 'react';
import { GameState, Team, GameAction, TeamColors } from './types';

interface ParkingTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const ParkingTab: React.FC<ParkingTabProps> = ({ state, userTeam, dispatch, colors }) => {
    const [projectedRevenue, setProjectedRevenue] = useState(0);
    const [trafficFlow, setTrafficFlow] = useState(100);

    const parking = userTeam.parking || {
        generalPrice: 20,
        vipPrice: 50,
        tailgateCulture: 50,
        revenueSettings: { surgeMultiplier: 1.0, earlyAccessPremium: 10, amenityAddonPrice: 5 }
    };

    const generalPrice = parking.generalPrice;
    const vipPrice = parking.vipPrice;
    const tailgateCulture = parking.tailgateCulture;

    useEffect(() => {
        const avgAttendance = state.currentUserTeamAttendance.length > 0
            ? state.currentUserTeamAttendance.reduce((sum, r) => sum + r.attendance, 0) / state.currentUserTeamAttendance.length
            : 5000;

        // Projection Logic
        // Assume 1 car per 2.5 fans
        const cars = avgAttendance / 2.5;
        const vipCars = cars * 0.1; // 10% VIP
        const generalCars = cars * 0.9;

        // Price elasticity
        const generalDemand = Math.max(0.5, 1 - ((generalPrice - 20) / 50)); // Drops as price goes over 20
        const vipDemand = Math.max(0.7, 1 - ((vipPrice - 50) / 100));

        const revenue = (generalCars * generalDemand * generalPrice) + (vipCars * vipDemand * vipPrice);
        setProjectedRevenue(Math.round(revenue));

        // Traffic Flow: Higher attendance + high tailgate culture = worse traffic
        // But higher prices reduce demand, improving traffic
        const congestion = (cars * generalDemand) / 2000; // Arbitrary capacity factor
        const cultureFactor = tailgateCulture / 200; // Tailgaters stay longer/arrive earlier
        
        let flow = 100 - (congestion * 20) - (cultureFactor * 10);
        setTrafficFlow(Math.max(0, Math.min(100, flow)));

    }, [generalPrice, vipPrice, tailgateCulture, userTeam.currentUserTeamAttendance]);

    const handlePriceChange = (type: 'general' | 'vip', value: number) => {
        dispatch({ 
            type: 'SET_PARKING_PRICES', 
            payload: { 
                general: type === 'general' ? value : generalPrice,
                vip: type === 'vip' ? value : vipPrice
            } 
        });
    };

    const handleTailgateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: 'SET_TAILGATE_CULTURE', payload: parseInt(e.target.value) });
    };

    const styles = {
        container: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            height: '100%',
            fontFamily: "'Press Start 2P', cursive",
        } as React.CSSProperties,
        card: {
            backgroundColor: '#ffffff',
            border: `4px solid ${colors.primary}`,
            padding: '1.5rem',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            position: 'relative',
            zIndex: 10,
            isolation: 'isolate',
        } as React.CSSProperties,
        sectionTitle: {
            fontSize: '0.9rem',
            fontWeight: 700,
            color: colors.primary,
            borderBottom: `4px solid ${colors.secondary}`,
            paddingBottom: '0.75rem',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
        } as React.CSSProperties,
        controlGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
        } as React.CSSProperties,
        label: {
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#555',
            textTransform: 'uppercase',
        } as React.CSSProperties,
        sliderContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        } as React.CSSProperties,
        slider: {
            flex: 1,
            accentColor: colors.primary,
            cursor: 'pointer',
            height: '10px',
        } as React.CSSProperties,
        valueDisplay: {
            fontSize: '1rem',
            fontWeight: 700,
            color: '#333',
            minWidth: '80px',
            textAlign: 'right',
            fontFamily: "'Press Start 2P', cursive",
        } as React.CSSProperties,
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
            textShadow: '2px 2px 0 rgba(0,0,0,0.1)',
        } as React.CSSProperties,
        metricLabel: {
            fontSize: '0.6rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.8,
        } as React.CSSProperties,
        trafficBar: {
            height: '16px',
            backgroundColor: '#ddd',
            border: '2px solid #000',
            marginTop: '1rem',
            position: 'relative',
        } as React.CSSProperties,
        trafficFill: {
            height: '100%',
            width: `${trafficFlow}%`,
            backgroundColor: trafficFlow > 70 ? '#4caf50' : trafficFlow > 40 ? '#ff9800' : '#f44336',
            transition: 'width 0.3s ease, background-color 0.3s ease',
        } as React.CSSProperties,
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Lot Management</h2>

                <div style={styles.controlGroup}>
                    <label style={styles.label}>General Parking Price</label>
                    <div style={styles.sliderContainer}>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={generalPrice}
                            onChange={(e) => handlePriceChange('general', parseInt(e.target.value))}
                            style={styles.slider}
                        />
                        <span style={styles.valueDisplay}>${generalPrice}</span>
                    </div>
                </div>

                <div style={styles.controlGroup}>
                    <label style={styles.label}>VIP / Reserved Price</label>
                    <div style={styles.sliderContainer}>
                        <input
                            type="range"
                            min="20"
                            max="150"
                            step="5"
                            value={vipPrice}
                            onChange={(e) => handlePriceChange('vip', parseInt(e.target.value))}
                            style={styles.slider}
                        />
                        <span style={styles.valueDisplay}>${vipPrice}</span>
                    </div>
                </div>

                <div style={styles.controlGroup}>
                    <label style={styles.label}>Tailgate Culture Support</label>
                    <div style={styles.sliderContainer}>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="10"
                            value={tailgateCulture}
                            onChange={handleTailgateChange}
                            style={styles.slider}
                        />
                        <span style={styles.valueDisplay}>{tailgateCulture}%</span>
                    </div>
                    <p style={{fontSize: '0.75rem', color: '#888', marginTop: '0.25rem'}}>
                        Investing in tailgate culture improves fan satisfaction but increases congestion.
                    </p>
                </div>
            </div>

            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Logistics & Revenue</h2>

                <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Proj. Weekly Revenue</div>
                    <div style={styles.metricValue}>${projectedRevenue.toLocaleString()}</div>
                </div>

                <div style={{marginTop: '2rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <label style={styles.label}>Traffic Flow Efficiency</label>
                        <span style={{fontWeight: 'bold', color: trafficFlow > 70 ? '#4caf50' : '#f44336'}}>{Math.round(trafficFlow)}%</span>
                    </div>
                    <div style={styles.trafficBar}>
                        <div style={styles.trafficFill} />
                    </div>
                    <p style={{fontSize: '0.75rem', color: '#888', marginTop: '0.5rem'}}>
                        {trafficFlow < 50 ? 'Severe bottlenecks expected. Consider raising prices or reducing tailgate zones.' : 'Smooth entry/exit expected.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ParkingTab;
