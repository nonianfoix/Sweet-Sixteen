
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameAction, TeamColors, GameStatus, EventType } from '../types';
import { isSameISO } from '../services/dateService';
import { getContactPoints, getTrainingPoints } from '../services/gameService';

interface NavAndActionsProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
    onSimulationStateChange?: (isSimulating: boolean) => void;
}

const styles = {
    navAndActionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '10px',
        position: 'sticky' as 'sticky',
        top: 70,
        zIndex: 90,
        backgroundColor: '#C0C0C0',
        padding: '10px 0',
    },
    navRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '10px',
    },
    actionsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '10px',
    },
    button: {
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.8rem',
        padding: '10px',
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        backgroundColor: '#C0C0C0',
        color: '#000000',
        cursor: 'pointer',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap' as 'pre-wrap',
    },
    resourceMeterCard: {
        flex: '1 1 200px',
        minWidth: '200px',
        border: '1px solid #d0d0d0',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#fdfdfd',
    },
    resourceMeterHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.6rem',
        marginBottom: '6px',
    },
    resourceMeterTrack: {
        width: '100%',
        height: '8px',
        backgroundColor: '#e0e0e0',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    resourceMeterFill: {
        height: '100%',
        borderRadius: '999px',
    },
    resourceMeterMeta: {
        fontSize: '0.55rem',
        marginTop: '6px',
        color: '#444',
    },
};

const NavAndActions = ({
    state,
    dispatch,
    colors,
    onSimulationStateChange,
}: NavAndActionsProps) => {
    const [isSimulatingSeason, setIsSimulatingSeason] = useState(false);
    const [isSimulatingTournament, setIsSimulatingTournament] = useState(false);
    const [isSimulatingToGame, setIsSimulatingToGame] = useState(false);
    const [isShowingTournamentResults, setIsShowingTournamentResults] = useState(false);

    // Refs for simulation state to avoid closure staleness in timeouts
    const isSimulatingSeasonRef = useRef(isSimulatingSeason);
    const isSimulatingTournamentRef = useRef(isSimulatingTournament);
    const isSimulatingToGameRef = useRef(isSimulatingToGame);
    const stateRef = useRef(state);
    stateRef.current = state;

    useEffect(() => {
        isSimulatingSeasonRef.current = isSimulatingSeason;
        isSimulatingTournamentRef.current = isSimulatingTournament;
        isSimulatingToGameRef.current = isSimulatingToGame;
    }, [isSimulatingSeason, isSimulatingTournament, isSimulatingToGame]);

    useEffect(() => {
        // Reset simulation state when season changes
        setIsSimulatingSeason(false);
        setIsSimulatingTournament(false);
        setIsSimulatingToGame(false);
    }, [state.season]); 

    useEffect(() => {
        onSimulationStateChange?.(isSimulatingSeason || isSimulatingToGame || isSimulatingTournament);
    }, [isSimulatingSeason, isSimulatingToGame, isSimulatingTournament, onSimulationStateChange]);

    const seasonTimerRef = useRef<NodeJS.Timeout | null>(null);
    const tournamentTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isSimulatingSeason) { 
            const runSeasonSim = () => {
                if (!isSimulatingSeasonRef.current) return; 
                
                const prevDate = stateRef.current.currentDate;

                // Stop at end of regular season
                if (stateRef.current.gameInSeason > 31) {
                    setIsSimulatingSeason(false);
                    return;
                }
                
                const hasUserGameToday = !!stateRef.current.userTeam && !!(stateRef.current.eventQueue || []).some(e =>
                    e.type === EventType.GAME &&
                    !e.processed &&
                    stateRef.current.currentDate &&
                    isSameISO(e.date, stateRef.current.currentDate) &&
                    (e.payload?.homeTeam === stateRef.current.userTeam?.name || e.payload?.awayTeam === stateRef.current.userTeam?.name)
                );

                dispatch({ type: hasUserGameToday ? 'SIMULATE_USER_GAME' : 'SIMULATE_DAY' });
                
                seasonTimerRef.current = setTimeout(() => {
                    // Check if date advanced. If not, we triggered a stop (e.g. user game).
                    if (isSameISO(prevDate, stateRef.current.currentDate)) {
                         setIsSimulatingSeason(false);
                    } else {
                         runSeasonSim();
                    }
                }, 50);
            };
            runSeasonSim();
        }

        return () => { 
            if (seasonTimerRef.current) {
                clearTimeout(seasonTimerRef.current);
                seasonTimerRef.current = null;
            }
        };
    }, [isSimulatingSeason]); // Only depends on toggle

    useEffect(() => {
        if (isSimulatingTournament) {
            const runTournamentSim = () => {
                if (!isSimulatingTournamentRef.current) return;

                const currentState = stateRef.current;
                const tournament = currentState.tournament;

                if (currentState.status !== GameStatus.TOURNAMENT || !tournament || tournament.champion) {
                    setIsSimulatingTournament(false);
                    return;
                }

                dispatch({ type: 'SIMULATE_TOURNAMENT_ROUND' });

                tournamentTimerRef.current = setTimeout(() => {
                    runTournamentSim();
                }, 5000); // 5 second delay between rounds for auto-sim
            };

            runTournamentSim();
        }

        return () => {
            if (tournamentTimerRef.current) {
                clearTimeout(tournamentTimerRef.current);
                tournamentTimerRef.current = null;
            }
        };
    }, [isSimulatingTournament]);

    
    // Ref to detect when game advances for SimToNextGame
    const initialGameRef = useRef(state.gameInSeason);

    useEffect(() => {
        if (isSimulatingToGame) {
             const runGameSim = () => {
                if (!isSimulatingToGameRef.current) return;

                const hasUserGameToday = !!stateRef.current.userTeam && !!(stateRef.current.eventQueue || []).some(e =>
                    e.type === EventType.GAME &&
                    !e.processed &&
                    stateRef.current.currentDate &&
                    isSameISO(e.date, stateRef.current.currentDate) &&
                    (e.payload?.homeTeam === stateRef.current.userTeam?.name || e.payload?.awayTeam === stateRef.current.userTeam?.name)
                );

                if (hasUserGameToday) {
                    setIsSimulatingToGame(false);
                    return;
                }

                 const prevDate = stateRef.current.currentDate;

                 // Stop if season over
                 if (stateRef.current.gameInSeason > 31) {
                     setIsSimulatingToGame(false);
                     return;
                 }

                 dispatch({ type: 'SIMULATE_DAY' });
                 semesterTimerRef.current = setTimeout(() => {
                     // Stop if date didn't advance (user game)
                     if (isSameISO(prevDate, stateRef.current.currentDate)) {
                         setIsSimulatingToGame(false);
                     } else {
                         runGameSim();
                     }
                 }, 50);
             };
             
             runGameSim();
             
             return () => {
                if (semesterTimerRef.current) clearTimeout(semesterTimerRef.current);
             }
        } else {
             initialGameRef.current = state.gameInSeason;
        }
    }, [isSimulatingToGame]); // Only depends on toggle
    
    // I need to define semesterTimerRef or similar.
    // Wait, the original code used a local `timer` var in useEffect. 
    // Using a ref is better for robust cleanup.
    const semesterTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleSimulate = () => {
        dispatch({ type: 'SIMULATE_DAY' });
    };

    const handleSimToNextGame = () => {
        setIsSimulatingToGame(true);
    };

    const getNavItems = (state: GameState): {label: string, status: GameStatus}[] => {
        const baseItems: {label: string, status: GameStatus}[] = [
            {label: 'Dashboard', status: GameStatus.DASHBOARD},
            {label: 'Roster', status: GameStatus.ROSTER},
            {label: 'Finances', status: GameStatus.FINANCES},
        ];
        
        if (state.userTeam) {
            baseItems.push({label: 'Staff', status: GameStatus.STAFF});
        }

        if (state.gameInSeason > 31 || state.status === GameStatus.TOURNAMENT) {
            baseItems.push({label: 'Tournament', status: GameStatus.TOURNAMENT});
        } else {
             baseItems.push({label: 'Schedule', status: GameStatus.SCHEDULE});
        }
        
        if (state.status === GameStatus.ROSTER_FILLING || (state.signingPeriodDay > 7 && state.gameInSeason > 31)) {
            baseItems.push({label: 'Finalize Signings', status: GameStatus.ROSTER_FILLING});
        }

        baseItems.push(
            {label: 'Standings', status: GameStatus.STANDINGS}
        );

        if (state.gameInSeason <= 31) {
            baseItems.push({label: 'Training', status: GameStatus.IN_SEASON_TRAINING});
        }

        baseItems.push(
            {label: 'Recruiting', status: GameStatus.RECRUITING},
            {label: 'History', status: GameStatus.HISTORY}
        );

        if (state.portalPlayers && state.portalPlayers.length > 0 && !state.transferPortalComplete) {
            baseItems.push({label: 'Transfer Portal', status: GameStatus.TRANSFER_PORTAL});
        }
        return baseItems;
    }
    
    const contactPointCap = state.userTeam ? getContactPoints(state.userTeam) : 100;
    const trainingPointCap = state.userTeam ? getTrainingPoints(state.userTeam) : 150;

    const navItems = getNavItems(state);

    const getAdvanceActions = () => {
        const actions = [];
        let disabled = false;

        // Tournament (prioritize explicit tournament view even if gameInSeason is stale)
        if (state.status === GameStatus.TOURNAMENT && state.tournament && !state.tournament.champion) {
            actions.push({ 
                label: isShowingTournamentResults ? 'Viewing Results...' : 'Simulate Round', 
                onClick: () => {
                    dispatch({ type: 'SIMULATE_TOURNAMENT_ROUND' });
                    setIsShowingTournamentResults(true);
                    setTimeout(() => setIsShowingTournamentResults(false), 5000);
                } 
            });
        }
        // Regular Season
        else if (state.gameInSeason <= 31) {
            actions.push({ label: 'Simulate Day', onClick: handleSimulate });
            actions.push({ label: 'Sim to Next Game', onClick: handleSimToNextGame });
        }
        // Tournament missing (repair path)
        else if (state.gameInSeason > 31 && !state.tournament) {
            actions.push({ label: 'Start Tournament', onClick: () => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.TOURNAMENT }) });
        }
        // Tournament (fallback)
        else if (state.tournament && !state.tournament.champion) {
            actions.push({ 
                label: isShowingTournamentResults ? 'Viewing Results...' : 'Simulate Round', 
                onClick: () => {
                    dispatch({ type: 'SIMULATE_TOURNAMENT_ROUND' });
                    setIsShowingTournamentResults(true);
                    setTimeout(() => setIsShowingTournamentResults(false), 5000);
                } 
            });
        }
        // Signing Period
        else if (state.signingPeriodDay <= 7) {
            actions.push({ label: `Sim Day ${state.signingPeriodDay}`, onClick: () => dispatch({ type: 'SIMULATE_SIGNING_DAY' }) });
        }
         // Post-Signing Flow
        else if (state.signingPeriodDay > 7) {
            if (state.status === GameStatus.ROSTER_FILLING) {
                 const rosterSize = state.userTeam?.roster.length ?? 0;
                 disabled = rosterSize < 13 || rosterSize > 15;
                 actions.push({ label: 'Proceed to Training', onClick: () => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.TRAINING }) });
            } else if (state.status !== GameStatus.TRAINING) {
                 actions.push({ label: 'Finalize Signings', onClick: () => dispatch({ type: 'ADVANCE_TO_OFF_SEASON' }) });
             }
        }
        
        return { actions, disabled };
    };

    const { actions: advanceActions, disabled: advanceDisabled } = getAdvanceActions();
    
    const buttonTextColor = (colors.secondary.toUpperCase() === '#FFFFFF' && colors.text.toUpperCase() === '#FFFFFF') 
        ? colors.primary 
        : colors.text;

    const buttonStyle = {
        ...styles.button,
        backgroundColor: colors.secondary,
        color: buttonTextColor,
        borderColor: `${colors.text} ${colors.primary} ${colors.primary} ${colors.text}`,
        flex: 1, // Ensure equal width
    };

    const renderResourceMeter = (label: string, used: number, total: number, accent: string) => {
        if (!total) return null;
        const percent = Math.min(100, Math.round((used / total) * 100));
        return (
            <div style={styles.resourceMeterCard}>
                <div style={styles.resourceMeterHeader}>
                    <span>{label}</span>
                    <span>{used}/{total}</span>
                </div>
                <div style={{...styles.resourceMeterTrack, backgroundColor: colors.primary}}>
                    <div style={{ ...styles.resourceMeterFill, width: `${percent}%`, backgroundColor: accent }} />
                </div>
            </div>
        );
    };

    const availableTrainingPoints = trainingPointCap - (state.trainingPointsUsedThisWeek || 0);

    return (
        <div style={styles.navAndActionsContainer}>
            <div style={styles.navRow}>
                {navItems.map(item => {
                    const isActive = state.status === item.status;
                    const navButtonStyle = {
                        ...styles.button,
                        backgroundColor: colors.secondary,
                        color: buttonTextColor,
                        ...(isActive ? {borderColor: `${colors.primary} ${colors.text} ${colors.text} ${colors.primary}`} : {})
                    };
                    return (
                        <button
                            key={item.status}
                            style={navButtonStyle}
                            onClick={() => {
                                dispatch({ type: 'CHANGE_VIEW', payload: item.status })
                            }}
                            disabled={isSimulatingSeason}
                        >
                            {item.label}
                        </button>
                    )
                })}
            </div>
            <div style={styles.actionsRow}>
                {advanceActions.map((action, idx) => (
                    <button 
                        key={idx} 
                        style={buttonStyle} 
                        onClick={action.onClick} 
                        disabled={advanceDisabled || isSimulatingSeason || isSimulatingToGame || isShowingTournamentResults}
                    >
                        {action.label}
                    </button>
                ))}
                
                {state.gameInSeason <= 31 && (
                    <button 
                        style={buttonStyle}
                        onClick={() => setIsSimulatingSeason(prev => !prev)}
                        disabled={isSimulatingTournament || isSimulatingToGame}
                    >
                        {isSimulatingSeason ? 'Pause Season Sim' : 'Sim Season'}
                    </button>
                )}
                {state.gameInSeason > 31 && state.status === GameStatus.TOURNAMENT && state.tournament && !state.tournament.champion && (
                    <button 
                        style={buttonStyle}
                        onClick={() => setIsSimulatingTournament(prev => !prev)}
                        disabled={isSimulatingSeason}
                    >
                        {isSimulatingTournament ? 'Pause Tournament' : 'Sim Tournament'}
                    </button>
                )}
            </div>
            {state.userTeam && (
                <div style={{display: 'flex', justifyContent: 'space-between', gap: '20px'}}>
                    {renderResourceMeter('Contact Points', state.contactsMadeThisWeek, contactPointCap, '#4CAF50')}
                    {renderResourceMeter('Training Points', availableTrainingPoints, trainingPointCap, '#2196F3')}
                    <div style={{...styles.resourceMeterCard, borderLeft: '4px solid #4CAF50'}}>
                        <div style={styles.resourceMeterHeader}>
                            <span>Auto Training</span>
                            <span style={{color: state.autoTrainingEnabled ? 'green' : '#B22222'}}>
                                {state.autoTrainingEnabled ? 'On' : 'Off'}
                            </span>
                        </div>
                        <p style={styles.resourceMeterMeta}>
                            {state.autoTrainingEnabled ? 'Unused weekly points flow to your targets.' : 'Points only move when you spend them.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavAndActions;
