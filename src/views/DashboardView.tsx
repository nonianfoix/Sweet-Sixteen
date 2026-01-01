import React, { useMemo, useState, useEffect, useRef } from 'react';
import type {
    GameState,
    GameAction,
    TeamColors,
    Team,
} from '../types';
import { EventType } from '../types';
import * as constants from '../constants';
import { DashboardScheduleCalendar } from '../components/DashboardScheduleCalendar';
import Subheading from '../components/Subheading';
import { getGameDateString, getGameDateStringFromEventQueue } from '../services/calendarService';
import { SEASON_START_DATE, isSameISO, formatISODate } from '../services/dateService';
import { getSchoolLogoUrl } from '../services/utils';

const { SCHOOL_COLORS } = constants;

const styles = {
    smallButton: {
        padding: '4px 8px',
        fontSize: '0.65rem',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
    },
};

const Dashboard = ({
    state,
    colors,
    dispatch,
    followCalendarDuringSim = false,
}: {
    state: GameState;
    colors: TeamColors;
    dispatch: React.Dispatch<GameAction>;
    followCalendarDuringSim?: boolean;
}) => {
    const isNBA = state.coach?.currentLeague === 'NBA';
    const currentTeam = isNBA ? state.nbaTeams.find(t => t.name === state.coach?.currentNBATeam) : state.userTeam;
    const [promoScheduling, setPromoScheduling] = useState<null | { week: number; opponent: string }>(null);

    const powerRankings = useMemo(() => {
        const teams = isNBA ? state.nbaTeams : state.allTeams;
        const rankings = [...teams]
            .map(t => ({...t, power: t.record.wins * 2 + t.prestige / 10}))
            .sort((a,b) => b.power - a.power);
        return rankings;
    }, [state.allTeams, state.nbaTeams, isNBA]);

    const getRank = (teamName: string) => {
        const rank = powerRankings.findIndex(t => t.name === teamName) + 1;
        return rank;
    };

    const nextGames = isNBA 
        ? (state.gameInSeason <= 31 ? state.nbaSchedule?.[state.gameInSeason - 1]?.filter(g => g.homeTeam === currentTeam?.name || g.awayTeam === currentTeam?.name) : [])
        : (state.gameInSeason <= 31 ? state.schedule?.[state.gameInSeason - 1]?.filter(g => g.homeTeam === state.userTeam?.name || g.awayTeam === state.userTeam?.name) : []);

    const lastResults = isNBA
        ? (state.gameInSeason > 1 ? state.nbaSchedule?.[state.gameInSeason - 2]?.filter(g => g.homeTeam === currentTeam?.name || g.awayTeam === currentTeam?.name) : [])
        : state.lastSimResults;

    const nextGameDateLabel = useMemo(() => {
        if (isNBA) {
            return getGameDateString(state.season + 2024, state.gameInSeason);
        }
        const nextEvent = (state.eventQueue || []).find(
            e => e.type === EventType.GAME && !e.processed && Number(e.payload?.week) === state.gameInSeason
        );
        if (nextEvent?.date) return formatISODate(nextEvent.date);
        return getGameDateString(state.season + 2024, state.gameInSeason);
    }, [isNBA, state.eventQueue, state.gameInSeason, state.season]);

    return (
        <div>
            {promoScheduling && state.userTeam && !isNBA && (
                <div
                    onClick={() => setPromoScheduling(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                        zIndex: 9999,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(560px, 96vw)',
                            background: '#fff',
                            border: `3px solid ${colors.primary}`,
                            borderRadius: 10,
                            boxShadow: '0 14px 34px rgba(0,0,0,0.35)',
                            padding: 14,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#111' }}>
                                    Schedule Promotion
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#444' }}>
                                    {getGameDateStringFromEventQueue(state.eventQueue, state.season + 2024, promoScheduling.week)} vs {promoScheduling.opponent}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPromoScheduling(null)}
                                style={{
                                    border: `2px solid ${colors.primary}`,
                                    background: '#fff',
                                    color: '#111',
                                    borderRadius: 8,
                                    width: 34,
                                    height: 34,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: '0.9rem',
                                    lineHeight: 1,
                                }}
                                aria-label="Close"
                            >
                                ?
                            </button>
                        </div>

                        {(() => {
                            const existingEvent = state.userTeam?.eventCalendar?.find(e => e.week === promoScheduling.week);
                            if (existingEvent) {
                                const label =
                                    state.eventPlaybookCatalog.find(p => p.id === existingEvent.playbookId)?.label || 'Event Scheduled';
                                return (
                                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ background: '#f0f8ff', padding: 10, borderRadius: 8, border: '1px solid #b0c4de' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0056b3' }}>{label}</div>
                                            <div style={{ fontSize: '0.65rem', marginTop: 6, color: '#333' }}>Status: {existingEvent.status}</div>
                                        </div>
                                        <button
                                            type="button"
                                            style={{
                                                backgroundColor: '#ffebee',
                                                color: '#c62828',
                                                border: '1px solid #ef9a9a',
                                                padding: '0.45rem 0.75rem',
                                                fontSize: '0.7rem',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                width: '100%',
                                                borderRadius: 8,
                                            }}
                                            onClick={() => {
                                                dispatch({ type: 'CANCEL_EVENT', payload: { eventId: existingEvent.id } });
                                                setPromoScheduling(null);
                                            }}
                                        >
                                            Cancel Event
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <select
                                        style={{
                                            padding: '0.55rem',
                                            borderRadius: 8,
                                            border: `2px solid ${colors.primary}55`,
                                            fontSize: '0.7rem',
                                            fontFamily: "'Press Start 2P', 'Courier New', system-ui, sans-serif",
                                            background: '#fff',
                                        }}
                                        defaultValue=""
                                        onChange={(e) => {
                                            const playbookId = e.target.value;
                                            if (!playbookId) return;
                                            dispatch({
                                                type: 'SCHEDULE_EVENT',
                                                payload: {
                                                    playbookId,
                                                    week: promoScheduling.week,
                                                    opponent: promoScheduling.opponent,
                                                },
                                            });
                                            setPromoScheduling(null);
                                        }}
                                    >
                                        <option value="">Select Promotion...</option>
                                        {state.eventPlaybookCatalog.map(event => (
                                            <option key={event.id} value={event.id}>
                                                {event.label} (${event.cost.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: '0.65rem', color: '#666' }}>
                                        Promotions are for upcoming home games.
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
            {state.trainingSummary.length > 0 && !isNBA && state.gameInSeason === 1 && (
                <div style={{marginBottom: '20px'}}>
                <Subheading color={colors.primary}>Off-Season Training Results</Subheading>
                {state.trainingSummary.map((s,i) => <p key={i} style={{fontSize: '0.7rem', marginBottom: '5px'}}>{s}</p>)}
                </div>
            )}

            {/* Job Security Widget */}
            {!isNBA && state.userTeam && state.coach?.contract?.expectations && (
                <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                    <Subheading color={colors.primary}>Job Security & Board Expectations</Subheading>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Status: </span>
                            <span style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 'bold', 
                                color: state.coach.contract.expectations.jobSecurityStatus === 'Safe' ? 'green' : 
                                       state.coach.contract.expectations.jobSecurityStatus === 'Warm' ? 'orange' : 'red' 
                            }}>
                                {state.coach.contract.expectations.jobSecurityStatus}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.7rem' }}>
                            Composite Score: {state.coach.contract.expectations.metrics ? Math.round(state.coach.contract.expectations.metrics.compositeScore) : 100}/100
                        </div>
                    </div>
                    
                    {state.coach.contract.expectations.metrics ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.65rem', color: '#555' }}>
                                <strong>Board Profile:</strong> {state.coach.contract.expectations.boardProfile} �{' '}
                                <strong>Pressure:</strong> {Math.round(state.coach.contract.expectations.pressure)}%
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', fontSize: '0.65rem' }}>
                                {state.coach.contract.expectations.metrics.components.map(component => {
                                    const isFinances = component.key === 'finances';
                                    const formatCurrencyCompact = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
                                    const actualText = component.displayActual
                                        ?? (typeof component.actual === 'number'
                                            ? (isFinances ? formatCurrencyCompact(component.actual) : `${Math.round(component.actual)}`)
                                            : 'N/A');
                                    const expectedText = component.displayExpected
                                        ?? (typeof component.expected === 'number'
                                            ? (isFinances ? formatCurrencyCompact(component.expected) : `${Math.round(component.expected)}`)
                                            : 'N/A');

                                    return (
                                        <div key={component.key} style={{ textAlign: 'center', padding: '6px', backgroundColor: '#eee', borderRadius: '4px' }}>
                                            <strong>{component.label}</strong><br/>
                                            {actualText} / {expectedText}<br/>
                                            <span style={{ color: '#666' }}>
                                                Score: {Math.round(component.score)} � Weight {Math.round(component.weight * 100)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.7rem' }}>
                            <div>
                                <strong>Wins:</strong> {state.coach.contract.expectations.evaluationMode === 'contract' ? state.coach.contract.progress.wins : state.userTeam.record.wins} / {state.coach.contract.expectations.targetWins}
                            </div>
                            <div>
                                <strong>Postseason:</strong> {state.coach.contract.expectations.targetPostseasonCount
                                    ? `${state.coach.contract.expectations.targetTourneyRound.replace('Round of ', 'R')} x${state.coach.contract.expectations.targetPostseasonCount}`
                                    : state.coach.contract.expectations.targetTourneyRound}
                            </div>
                            <div>
                                <strong>Draft Picks:</strong> {state.coach.contract.expectations.targetDraftPicks} / yr
                            </div>
                            <div>
                                <strong>Attendance:</strong> {Math.round(state.coach.contract.expectations.targetAttendanceFillRate * 100)}% fill target
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* FORCE SIMULATION BUTTON */}
            {!isNBA && state.eventQueue?.some(e => 
                e.type === EventType.GAME && 
                !e.processed && 
                state.currentDate && 
                isSameISO(e.date, state.currentDate) &&
                (e.payload.homeTeam === state.userTeam?.name || e.payload.awayTeam === state.userTeam?.name)
            ) && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', border: `1px solid ${colors.primary}`, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: colors.primary, fontSize: '0.8rem' }}>Game Day Pending</strong>
                        <span style={{ color: '#666', fontSize: '0.7rem' }}>Running late? Simulate this game immediately.</span>
                    </div>
                    <button 
                        onClick={() => dispatch({ type: 'SIMULATE_USER_GAME' })}
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: colors.primary, 
                            color: colors.text, 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        Simulate Game
                    </button>
                </div>
            )}

            {!isNBA && state.userTeam && (state.eventQueue?.length || 0) > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <Subheading color={colors.primary}>Calendar</Subheading>
                    <DashboardScheduleCalendar
                        userTeamName={state.userTeam.name}
                        userTeamColors={colors}
                        schedule={state.schedule}
                        eventQueue={state.eventQueue}
                        currentDate={state.currentDate || SEASON_START_DATE}
                        currentWeek={state.gameInSeason}
                        getLogoSrc={(schoolName) => getSchoolLogoUrl(schoolName)}
                        getTeamColors={(schoolName) => SCHOOL_COLORS[schoolName] || { primary: '#C0C0C0', secondary: '#808080', text: '#FFFFFF' }}
                        onSelectHomeGame={({ week, opponent }) => setPromoScheduling({ week, opponent })}
                        onViewGameLog={({ week, opponent, isHome }) => {
                            const homeTeam = isHome ? state.userTeam.name : opponent;
                            const awayTeam = isHome ? opponent : state.userTeam.name;
                            const gameLog = state.gameLogs.find(log =>
                                log.gameId === `S${state.season}G${week}-${homeTeam}v${awayTeam}` ||
                                log.gameId === `S${state.season}G${week}-${awayTeam}v${homeTeam}`
                            );
                            if (gameLog) {
                                dispatch({ type: 'VIEW_GAME_LOG', payload: { gameLog } });
                            }
                        }}
                        followCurrentDate={followCalendarDuringSim}
                    />
                </div>
            )}

            <Subheading color={colors.primary}>Next {isNBA ? 'Games' : 'Game'} ({nextGameDateLabel})</Subheading>
            {state.gameInSeason <= 31 && nextGames && nextGames.length > 0 && currentTeam ? (
                <div>
                    {nextGames.map((game, idx) => (
                        <p key={idx}>
                           {game.homeTeam === currentTeam.name ? 'vs' : '@'} {game.homeTeam === currentTeam.name ? game.awayTeam : game.homeTeam} (#{getRank(game.homeTeam === currentTeam.name ? game.awayTeam : game.homeTeam)})
                        </p>
                    ))}
                </div>
            ) : state.tournament?.champion ? (
                <p>Season Over. Proceed to Signing Period.</p>
            ) : (
                <p>{isNBA ? 'Regular season is over. Playoffs begin soon.' : 'Regular season is over. Go to Tournament view.'}</p>
            )}

            <Subheading color={colors.primary}>Pipeline States</Subheading>
            {currentTeam?.pipelineStates && currentTeam.pipelineStates.length > 0 ? (
                <p style={{fontSize: '0.8rem'}}>{currentTeam.pipelineStates.join(', ')}</p>
            ) : (
                <p style={{fontSize: '0.8rem', color: '#999'}}>No pipeline states established.</p>
            )}

            <Subheading color={colors.primary}>Last Week's Results</Subheading>
            {lastResults && lastResults.length > 0 && currentTeam ? (
                <div style={{fontSize: '0.7rem'}}>
                    {[...lastResults]
                        .sort((a, b) => {
                            const aIsUserGame = a.homeTeam === currentTeam.name || a.awayTeam === currentTeam.name;
                            const bIsUserGame = b.homeTeam === currentTeam.name || b.awayTeam === currentTeam.name;
                            if (aIsUserGame && !bIsUserGame) return -1;
                            if (!aIsUserGame && bIsUserGame) return 1;
                            return 0;
                        })
                        .map((g, i) => {
                            const isUserGame = g.homeTeam === currentTeam.name || g.awayTeam === currentTeam.name;
                            const pStyle: React.CSSProperties = isUserGame ? {
                                backgroundColor: colors.primary,
                                color: colors.text,
                                padding: '5px',
                                borderRadius: '3px'
                            } : {};
                            const winner = g.homeScore > g.awayScore ? 'home' : 'away';
                            const winnerStyle = { color: 'green', fontWeight: 'bold' };

                            return (
                                <p key={i} style={pStyle}>
                                    {g.awayTeam} (#{getRank(g.awayTeam)}){' '}
                                    <span style={winner === 'away' ? winnerStyle : {}}>
                                        {g.awayScore}
                                    </span>
                                    {' @ '}
                                    {g.homeTeam} (#{getRank(g.homeTeam)}){' '}
                                    <span style={winner === 'home' ? winnerStyle : {}}>
                                        {g.homeScore}
                                    </span>
                                    {isUserGame && g.played && (
                                        <button 
                                            onClick={() => {
                                                const gameIdPrefix = isNBA ? `NBA-S${state.season}W${state.gameInSeason - 1}` : `S${state.season}G${state.gameInSeason - 1}`;
                                                const gameLog = isNBA 
                                                    ? null // NBA logs not stored in main gameLogs yet or need finding logic
                                                    : state.gameLogs.find(log => log.gameId === `${gameIdPrefix}-${g.homeTeam}v${g.awayTeam}` || log.gameId === `${gameIdPrefix}-${g.awayTeam}v${g.homeTeam}`);
                                                
                                                // For now, disable NBA game log view until logs are properly stored/retrieved
                                                if (gameLog && !isNBA) {
                                                    dispatch({ type: 'VIEW_GAME_LOG', payload: { gameLog } });
                                                }
                                            }}
                                            style={{ ...styles.smallButton, marginLeft: '10px' }}
                                        >
                                            View Box Score
                                        </button>
                                    )}
                                </p>
                            );
                        })}
                </div>
            ) : <p>No games simulated yet this season.</p>}
        </div>
    );
};


export default Dashboard;


