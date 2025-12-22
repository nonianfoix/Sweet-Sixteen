import React, { useState } from 'react';
import { GameState, Team, GameAction, TeamColors } from './types';
import { AttendanceTab } from './AttendanceTab';
import { PartnershipsTab } from './PartnershipsTab';
import AlumniTab from './AlumniTab';
import ConcessionsTab from './ConcessionsTab';
import MerchandisingTab from './MerchandisingTab';
import ParkingTab from './ParkingTab';
import LogisticsTab from './LogisticsTab';
import EventsTab from './EventsTab';
import { FacilitiesTab } from './FacilitiesTab';
import { FinancialsTab } from './FinancialsTab';

interface EconomyHubProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

export const EconomyHub: React.FC<EconomyHubProps> = ({ state, userTeam, dispatch, colors }) => {
    const [activeTab, setActiveTab] = useState<'attendance' | 'partnerships' | 'alumni' | 'concessions' | 'merchandising' | 'parking' | 'logistics' | 'events' | 'facilities' | 'financials'>('attendance');

    const palette = {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: '#FFD700', // Gold accent for premium feel
        text: '#1a1a1a',
        muted: '#f5f5f5',
        border: colors.primary, // Use primary color for retro borders
    };

    const tabs = [
        { id: 'attendance', label: 'Attendance' },
        { id: 'partnerships', label: 'Partnerships' },
        { id: 'alumni', label: 'Alumni' },
        { id: 'concessions', label: 'Concessions' },
        { id: 'merchandising', label: 'Merch' },
        { id: 'parking', label: 'Parking' },
        { id: 'logistics', label: 'Travel' },
        { id: 'events', label: 'Events' },
        { id: 'facilities', label: 'Facilities' },
        { id: 'financials', label: 'Ledger' },
    ] as const;

    return (
        <div style={styles.container}>
            <header style={styles.header(palette)}>
                <div style={styles.headerContent}>
                    <h1 style={styles.title}>Economy Command Center</h1>
                    <div style={styles.balanceBadge(palette)}>
                        <span style={styles.balanceLabel}>Current Budget</span>
                        <span style={styles.balanceValue}>${userTeam.budget?.cash.toLocaleString() ?? 0}</span>
                    </div>
                </div>
                <nav style={styles.nav}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={activeTab === tab.id ? styles.activeTab(palette) : styles.tab(palette)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            <main style={styles.main}>
                <div style={styles.contentWrapper}>
                    {activeTab === 'attendance' && <AttendanceTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                    {activeTab === 'partnerships' && <PartnershipsTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                    {activeTab === 'alumni' && <AlumniTab state={state} userTeam={userTeam} colors={colors} dispatch={dispatch} />}
                    {activeTab === 'concessions' && <ConcessionsTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                    {activeTab === 'merchandising' && <MerchandisingTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                    {activeTab === 'parking' && <ParkingTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                    {activeTab === 'logistics' && <LogisticsTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                    {activeTab === 'events' && <EventsTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                    {activeTab === 'facilities' && <FacilitiesTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                    {activeTab === 'financials' && <FinancialsTab state={state} userTeam={userTeam} dispatch={dispatch} colors={colors} />}
                </div>
            </main>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f0f0f0', // Slightly darker background for contrast
        fontFamily: "'Press Start 2P', cursive",
        position: 'relative',
        zIndex: 0,
    } as React.CSSProperties,
    header: (palette: any) => ({
        backgroundColor: '#ffffff',
        borderBottom: `4px solid ${palette.primary}`,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
    } as React.CSSProperties),
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    } as React.CSSProperties,
    title: {
        fontSize: '1.2rem', // Adjusted for retro font size
        fontWeight: 700,
        color: '#1a1a1a',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
    } as React.CSSProperties,
    balanceBadge: (palette: any) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        backgroundColor: '#fff',
        padding: '0.5rem 1rem',
        border: `2px solid ${palette.primary}`,
        boxShadow: '4px 4px 0 rgba(0,0,0,0.1)',
    } as React.CSSProperties),
    balanceLabel: {
        fontSize: '0.6rem',
        textTransform: 'uppercase',
        color: '#666',
        marginBottom: '0.25rem',
    } as React.CSSProperties,
    balanceValue: {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#2e7d32',
    } as React.CSSProperties,
    nav: {
        display: 'flex',
        gap: '0.75rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        scrollbarWidth: 'none',
    } as React.CSSProperties,
    tab: (palette: any) => ({
        padding: '0.75rem 1rem',
        border: '2px solid #ccc',
        backgroundColor: '#fff',
        color: '#666',
        cursor: 'pointer',
        fontSize: '0.7rem',
        fontFamily: "'Press Start 2P', cursive",
        transition: 'transform 0.1s',
        boxShadow: '2px 2px 0 #ccc',
    } as React.CSSProperties),
    activeTab: (palette: any) => ({
        padding: '0.75rem 1rem',
        border: `2px solid ${palette.primary}`,
        backgroundColor: palette.primary,
        color: '#ffffff',
        cursor: 'pointer',
        fontSize: '0.7rem',
        fontFamily: "'Press Start 2P', cursive",
        boxShadow: `2px 2px 0 ${palette.secondary}`,
        transform: 'translate(-1px, -1px)',
    } as React.CSSProperties),
    main: {
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
    } as React.CSSProperties,
    contentWrapper: {
        width: '100%',
        margin: '0 auto',
        height: '100%',
    } as React.CSSProperties,
};


