import React from 'react';
import { GameState, Team, GameAction, TeamColors, EventPlaybookEntry } from './types';
import { getGameDateStringFromEventQueue } from './services/calendarService';

interface EventsTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const EventsTab: React.FC<EventsTabProps> = ({ state, userTeam, dispatch, colors }) => {
    const schedule = state.schedule;
    const eventCalendar = userTeam.eventCalendar || [];
    const playbook = state.eventPlaybookCatalog;

    const handleScheduleEvent = (week: number, playbookId: string, opponent: string) => {
        dispatch({
            type: 'SCHEDULE_EVENT',
            payload: { playbookId, week, opponent }
        });
    };

    const handleCancelEvent = (eventId: string) => {
        dispatch({
            type: 'CANCEL_EVENT',
            payload: { eventId }
        });
    };

    // Filter for home games only
    const homeGames = [];
    for (let i = 0; i < schedule.length; i++) {
        const game = schedule[i].find(g => g.homeTeam === userTeam.name);
        if (game) {
            homeGames.push({ week: i + 1, game });
        }
    }

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            height: '100%',
            fontFamily: "'Press Start 2P', cursive",
            padding: '1rem',
        } as React.CSSProperties,
        headerCard: {
            backgroundColor: '#ffffff',
            border: `4px solid ${colors.primary}`,
            padding: '1.5rem',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)',
        } as React.CSSProperties,
        sectionTitle: {
            fontSize: '0.9rem',
            fontWeight: 700,
            color: colors.primary,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
        } as React.CSSProperties,
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
        } as React.CSSProperties,
        eventCard: {
            backgroundColor: '#fff',
            border: '2px solid #ccc',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            position: 'relative',
        } as React.CSSProperties,
        gameInfo: {
            borderBottom: '1px solid #eee',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem',
        } as React.CSSProperties,
        select: {
            padding: '0.5rem',
            fontFamily: "'Press Start 2P', 'Courier New', system-ui, sans-serif",
            fontSize: '0.7rem',
            width: '100%',
            marginBottom: '0.5rem',
        } as React.CSSProperties,
        activeEvent: {
            backgroundColor: '#e3f2fd',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #2196f3',
        } as React.CSSProperties,
        cancelButton: {
            backgroundColor: '#ffebee',
            color: '#c62828',
            border: '1px solid #ef9a9a',
            padding: '0.25rem 0.5rem',
            fontSize: '0.6rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            width: '100%',
            marginTop: '0.5rem',
        } as React.CSSProperties,
    };

    return (
        <div style={styles.container}>
            <div style={styles.headerCard}>
                <h2 style={styles.sectionTitle}>Event Management</h2>
                <p style={{fontSize: '0.7rem', color: '#666', lineHeight: '1.4'}}>
                    Plan your season's promotional calendar. Strategic events can boost attendance, 
                    improve fan sentiment, or impress recruits.
                </p>
            </div>

            <div style={styles.grid}>
                {homeGames.map(({ week, game }) => {
                    const existingEvent = eventCalendar.find(e => e.week === week);
                    const opponent = state.allTeams.find(t => t.name === game.awayTeam);
                    
                    return (
                        <div key={week} style={styles.eventCard}>
                            <div style={styles.gameInfo}>
                                <div style={{fontWeight: 'bold', fontSize: '0.8rem'}}>{getGameDateStringFromEventQueue(state.eventQueue, state.season + 2024, week)}</div>
                                <div style={{fontSize: '0.7rem', color: '#666'}}>vs {game.awayTeam}</div>
                                {opponent && <div style={{fontSize: '0.6rem', color: '#888'}}>Rk {opponent.prestige}</div>}
                            </div>

                            {existingEvent ? (
                                <div style={styles.activeEvent}>
                                    <div style={{fontWeight: 'bold', fontSize: '0.7rem', color: '#1565c0'}}>
                                        {playbook.find(p => p.id === existingEvent.playbookId)?.label || 'Event'}
                                    </div>
                                    <div style={{fontSize: '0.6rem', marginTop: '0.25rem'}}>
                                        Status: {existingEvent.status}
                                    </div>
                                    <button 
                                        style={styles.cancelButton}
                                        onClick={() => handleCancelEvent(existingEvent.id)}
                                    >
                                        Cancel Event
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <select 
                                        style={styles.select}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleScheduleEvent(week, e.target.value, game.awayTeam);
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="">Select Promotion...</option>
                                        {playbook.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.label} (${p.cost.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{fontSize: '0.6rem', color: '#888', fontStyle: 'italic'}}>
                                        No event scheduled
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EventsTab;
