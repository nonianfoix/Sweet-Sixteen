import React, { useEffect, useMemo, useState } from 'react';
import { ARENA_CAPACITIES } from './constants';
import {
    AttendanceForecast,
    FanArchetype,
    GameAction,
    GameAttendanceRecord,
    GameResult,
    GameState,
    GameStatus,
    SeatMix,
    SeatSegmentKey,
    Team,
    TeamColors,
    EventPlaybookEntry,
    ScheduledEvent,
} from './types';
import { calculateAttendance, getZonePriceBounds, resolveZoneTicketPrice } from './services/gameService';
import { logTelemetryEvent } from './services/telemetryService';
import { getGameDateStringFromEventQueue } from './services/calendarService';

const SEAT_SEGMENT_ORDER: SeatSegmentKey[] = ['lowerBowl', 'studentSection', 'upperBowl', 'suites'];
const ARCHETYPE_LABELS: Record<FanArchetype, string> = {
    diehard: 'Diehard',
    casual: 'Casual',
    value: 'Value',
    status: 'Status',
    booster: 'Booster',
};

interface AttendanceTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

type ZoneBounds = Record<SeatSegmentKey, { min: number; max: number }>;

const clampToBounds = (value: number, bounds: { min: number; max: number }) => Math.min(bounds.max, Math.max(bounds.min, value));

const defaultZoneState = (seatMix: SeatMix | undefined | null, bounds: ZoneBounds) => {
    const baseState: Record<SeatSegmentKey, number> = {
        lowerBowl: seatMix?.lowerBowl?.priceModifier ?? 1,
        upperBowl: seatMix?.upperBowl?.priceModifier ?? 1,
        studentSection: seatMix?.studentSection?.priceModifier ?? 1,
        suites: seatMix?.suites?.priceModifier ?? 1.6,
    };
    (Object.keys(baseState) as SeatSegmentKey[]).forEach(key => {
        baseState[key] = clampToBounds(baseState[key], bounds[key] ?? { min: 0.5, max: 2.5 });
    });
    return baseState;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const formatPriceDisplay = (value?: number) => (typeof value === 'number' ? `$${value.toLocaleString()}` : '—');

const getZoneLabel = (key: SeatSegmentKey) =>
    key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();

const dedupeAttendanceRecords = (records: GameAttendanceRecord[]): GameAttendanceRecord[] => {
    const indexByKey = new Map<string, number>();
    const deduped: GameAttendanceRecord[] = [];
    for (const record of records || []) {
        const key =
            record.gameId ||
            `${record.week ?? 'na'}|${record.opponent}|${record.attendance}|${record.capacity ?? 'na'}|${record.revenue}|${record.simulated ? 'sim' : 'real'}`;
        const existingIndex = indexByKey.get(key);
        if (existingIndex == null) {
            indexByKey.set(key, deduped.length);
            deduped.push(record);
        } else {
            deduped[existingIndex] = record;
        }
    }
    return deduped;
};

const describeDemandScore = (score?: number) => {
    if (score == null) return 'Unknown';
    if (score >= 1.1) return 'Surging';
    if (score >= 0.85) return 'Healthy';
    if (score >= 0.6) return 'Stable';
    return 'Soft';
};

const percentColor = (value: number) => {
    if (value >= 0.95) return '#0B8043';
    if (value >= 0.8) return '#1B9AAA';
    if (value >= 0.6) return '#F4B400';
    if (value >= 0.4) return '#F57C00';
    return '#B22222';
};

const findNextHomeGame = (state: GameState, teamName: string) => {
    const startIndex = Math.max(0, state.gameInSeason - 1);
    for (let weekIndex = startIndex; weekIndex < state.schedule.length; weekIndex += 1) {
        const game = state.schedule[weekIndex].find(match => match.homeTeam === teamName);
        if (game) {
            return { week: weekIndex + 1, game };
        }
    }
    for (let weekIndex = 0; weekIndex < startIndex; weekIndex += 1) {
        const game = state.schedule[weekIndex].find(match => match.homeTeam === teamName);
        if (game) {
            return { week: weekIndex + 1, game };
        }
    }
    return null;
};

const findUpcomingHomeGames = (state: GameState, teamName: string, limit: number = 5) => {
    const games: { week: number; game: any }[] = [];
    const startIndex = Math.max(0, state.gameInSeason - 1);
    for (let weekIndex = startIndex; weekIndex < state.schedule.length; weekIndex += 1) {
        const game = state.schedule[weekIndex].find(match => match.homeTeam === teamName);
        if (game) {
            games.push({ week: weekIndex + 1, game });
            if (games.length >= limit) break;
        }
    }
    return games;
};

import { ArenaMap } from './ArenaMap';

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ state, userTeam, dispatch, colors }) => {
    const arena = userTeam.facilities?.arena;
    const seatMix = arena?.seatMix;
    const zoneBounds = useMemo(() => getZonePriceBounds(userTeam.prices.ticketPrice), [userTeam.prices.ticketPrice]);
    const [zonePricing, setZonePricing] = useState(() => defaultZoneState(seatMix, zoneBounds));
    const [selectedZone, setSelectedZone] = useState<SeatSegmentKey | null>(null);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1200);
    const [showZoneAnalytics, setShowZoneAnalytics] = useState(!isSmallScreen);
    const [showSuiteInsights, setShowSuiteInsights] = useState(!isSmallScreen);

    useEffect(() => {
        const handleResize = () => {
            const small = window.innerWidth < 1200;
            setIsSmallScreen(small);
            if (!small) {
                setShowZoneAnalytics(true);
                setShowSuiteInsights(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setZonePricing(defaultZoneState(seatMix, zoneBounds));
    }, [seatMix, userTeam.name, zoneBounds]);

    const nextHomeGame = useMemo(() => findNextHomeGame(state, userTeam.name), [state, userTeam.name]);
    const opponentTeam = useMemo(() => {
        if (!nextHomeGame) return null;
        const opponentName = nextHomeGame.game.awayTeam;
        return state.allTeams.find(team => team.name === opponentName) ?? null;
    }, [nextHomeGame, state.allTeams]);

    const previewSeatMix = useMemo(() => {
        if (!seatMix) return null;
        const mix: SeatMix = { ...seatMix };
        (Object.keys(zonePricing) as SeatSegmentKey[]).forEach(key => {
            if (mix[key]) {
                const bounds = zoneBounds[key] ?? { min: 0.5, max: 2.5 };
                const rawValue = zonePricing[key] ?? mix[key]!.priceModifier ?? 1;
                mix[key] = { ...mix[key], priceModifier: clampToBounds(rawValue, bounds) };
            }
        });
        return mix;
    }, [seatMix, zonePricing, zoneBounds]);

    const capacity =
        arena?.capacity ??
        ARENA_CAPACITIES[userTeam.name] ??
        (seatMix ? Object.values(seatMix).reduce((sum, segment: any) => sum + (segment.capacity || 0), 0) : 0);

    const attendanceForecast = useMemo<AttendanceForecast | null>(() => {
        if (!previewSeatMix || !nextHomeGame || !opponentTeam || !arena) return null;
        const simulatedHomeTeam: Team = {
            ...userTeam,
            facilities: {
                ...userTeam.facilities,
                arena: { ...arena, seatMix: previewSeatMix },
            },
        };
        return calculateAttendance(simulatedHomeTeam, opponentTeam, nextHomeGame.week, state.eventPlaybookCatalog);
    }, [previewSeatMix, nextHomeGame, opponentTeam, arena, userTeam, state.eventPlaybookCatalog]);

    const handleSavePricing = () => {
        if (!seatMix) return;
        dispatch({ type: 'UPDATE_ZONE_PRICING', payload: zonePricing });
    };

    const handleRunForecast = () => {
        dispatch({ type: 'RUN_ATTENDANCE_SIM', payload: zonePricing });
        logTelemetryEvent('economy.attendanceForecast', {
            team: userTeam.name,
            forecast: attendanceForecast,
        });
    };

    const handleExportCsv = () => {
        if (!attendanceHistory.length) return;
        const headers = ['Game', 'Opponent', 'Attendance', 'Capacity', 'Revenue', 'Simulated'];
        const rows = attendanceHistory.map(entry => [
            entry.week ? `Week ${entry.week}` : entry.gameId,
            entry.opponent,
            entry.attendance,
            entry.capacity,
            entry.revenue,
            entry.simulated ? 'Yes' : 'No'
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `attendance_export_${userTeam.name}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const attendanceHistory = useMemo<GameAttendanceRecord[]>(() => {
        const source = arena?.attendanceLog?.length ? arena.attendanceLog : state.currentUserTeamAttendance;
        return dedupeAttendanceRecords(source);
    }, [arena?.attendanceLog, state.currentUserTeamAttendance]);

    const gameLogsById = useMemo(() => new Map((state.gameLogs || []).map(log => [log.gameId, log] as const)), [state.gameLogs]);

    const topSellingSegment = useMemo(() => {
        if (!attendanceForecast) return null;

        const segmentsWithFill = attendanceForecast.segments.map(s => ({
            ...s,
            fillRate: s.capacity > 0 ? s.filled / s.capacity : 0,
            label: getZoneLabel(s.key),
        }));

        return [...segmentsWithFill].sort((a, b) => b.fillRate - a.fillRate)[0];
    }, [attendanceForecast]);

    const { bestGate, worstFill, sparklineData, chartFriendlyData, avgSuiteUtilization } = useMemo(() => {
        if (!attendanceHistory || attendanceHistory.length === 0) {
            return { bestGate: 0, worstFill: 0, sparklineData: [], chartFriendlyData: null, avgSuiteUtilization: 0 };
        }

        let bestGate = 0;
        let worstFill = 100;
        const sparklineData: number[] = [];
        const rollingTotals: number[] = [];
        const movingAverage: number[] = [];
        let sum = 0;
        let suiteFills = 0;
        let suiteGames = 0;

        attendanceHistory.forEach((entry, index) => {
            if (entry.revenue > bestGate) {
                bestGate = entry.revenue;
            }
            if (entry.capacity && entry.capacity > 0) {
                const fill = (entry.attendance / entry.capacity) * 100;
                if (fill < worstFill) {
                    worstFill = fill;
                }
            }
            sparklineData.push(entry.attendance);
            sum += entry.revenue;
            rollingTotals.push(sum);

            const window = sparklineData.slice(Math.max(0, index - 2), index + 1);
            movingAverage.push(window.reduce((a, b) => a + b, 0) / window.length);

            if (entry.segmentData) {
                const suiteSegment = entry.segmentData.find(s => s.key === 'suites');
                if (suiteSegment && arena?.seatMix.suites.capacity) {
                    suiteFills += suiteSegment.attendance / arena.seatMix.suites.capacity;
                    suiteGames++;
                }
            }
        });

        const capacity = attendanceHistory[0]?.capacity;
        const fillThreshold = capacity ? capacity * 0.95 : 0;
        const avgSuiteUtilization = suiteGames > 0 ? (suiteFills / suiteGames) * 100 : 0;

        return { bestGate, worstFill, sparklineData, chartFriendlyData: { rollingTotals, movingAverage, fillThreshold }, avgSuiteUtilization };
    }, [attendanceHistory, arena?.seatMix.suites.capacity]);

    if (!arena || !seatMix) {
        return <div style={{ fontSize: '0.75rem' }}>Arena data unavailable for this team.</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <section style={styles.summary}>
                <div>
                    <span style={styles.summaryLabel}>Venue</span>
                    <strong>{arena.name}</strong>
                    <p style={styles.summaryMeta}>
                        {capacity.toLocaleString()} seats • Quality {arena.quality}/100 • Suites {arena.luxurySuites}
                    </p>
                </div>
                {opponentTeam ? (
                    <div>
                        <span style={styles.summaryLabel}>Next Home Opponent</span>
                        <strong>{opponentTeam.name}</strong>
                        <p style={styles.summaryMeta}>
                            Prestige {opponentTeam.prestige} • Record {opponentTeam.record.wins}-{opponentTeam.record.losses}
                        </p>
                    </div>
                ) : (
                    <div>
                        <span style={styles.summaryLabel}>Schedule</span>
                        <strong>No home games remain</strong>
                    </div>
                )}
                <div>
                    <span style={styles.summaryLabel}>Team Momentum</span>
                    <strong>
                        {userTeam.record.wins}-{userTeam.record.losses}
                    </strong>
                    <p style={styles.summaryMeta}>
                        Ticket ${userTeam.prices.ticketPrice} • Fan Sentiment {userTeam.fanSentiment ?? userTeam.fanInterest}
                    </p>
                </div>
            </section>

            <section>
                <h4 style={{ color: colors.primary, marginBottom: '0.5rem', marginTop: 0 }}>Zone Pricing Controls</h4>
                
                <div style={{ display: 'flex', flexDirection: isSmallScreen ? 'column' : 'row', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <ArenaMap 
                            seatMix={seatMix} 
                            forecast={attendanceForecast} 
                            selectedZone={selectedZone} 
                            onZoneSelect={setSelectedZone}
                            colors={colors}
                            sponsorName={userTeam.sponsor?.name}
                        />
                        <p style={{ fontSize: '0.65rem', color: '#666', textAlign: 'center', marginTop: '0.5rem' }}>
                            Click a zone to highlight details. Colors indicate fill rate (Green = High, Red = Low).
                        </p>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={styles.zoneGrid}>
                            {SEAT_SEGMENT_ORDER.map(key => {
                                const segment = previewSeatMix?.[key] ?? seatMix[key];
                                const fill =
                                    attendanceForecast && capacity > 0
                                        ? attendanceForecast.segments.find(seg => seg.key === key)?.filled ?? 0
                                        : 0;
                                const fillPct = capacity > 0 && segment ? fill / segment.capacity : 0;
                                const color = percentColor(fillPct);
                                const price = resolveZoneTicketPrice(
                                    key,
                                    previewSeatMix?.[key]?.priceModifier ?? seatMix[key]?.priceModifier ?? zonePricing[key] ?? 1,
                                    userTeam.prices.ticketPrice,
                                    segment.dynamicPricing,
                                    opponentTeam ? {
                                        isRival: opponentTeam.conference === userTeam.conference, // Simplified check
                                        opponentPrestige: opponentTeam.prestige
                                    } : undefined
                                );
                                const isSelected = selectedZone === key;

                                return (
                                    <div 
                                        key={key} 
                                        style={{ 
                                            ...styles.zoneCard, 
                                            borderColor: isSelected ? colors.primary : color,
                                            borderWidth: isSelected ? '2px' : '1px',
                                            backgroundColor: isSelected ? '#f0f8ff' : '#fff',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setSelectedZone(isSelected ? null : key)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <strong>{getZoneLabel(key)}</strong>
                                            <span style={{ fontSize: '0.65rem' }}>{segment.capacity.toLocaleString()} seats</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={zoneBounds[key].min}
                                            max={zoneBounds[key].max}
                                            step="0.05"
                                            value={zonePricing[key]}
                                            onChange={event => setZonePricing(prev => ({ ...prev, [key]: Number(event.target.value) }))}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ width: '100%' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                            <span>{zonePricing[key].toFixed(2)}x</span>
                                            <span>${price.toLocaleString()}</span>
                                        </div>
                                        <div style={styles.fillBar}>
                                            <div
                                                style={{
                                                    ...styles.fillBarInner,
                                                    width: `${Math.min(100, Math.round(fillPct * 100))}%`,
                                                    backgroundColor: color,
                                                }}
                                            />
                                        </div>
                                        <p style={{ ...styles.summaryMeta, marginTop: '0.25rem' }}>
                                            Forecast fill {(fillPct * 100).toFixed(1)}%
                                        </p>

                                        {/* Dynamic Pricing Toggles */}
                                        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                            <strong style={{ fontSize: '0.6rem', display: 'block', marginBottom: '0.25rem' }}>Dynamic Rules</strong>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <label style={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={segment.dynamicPricing?.rivalryPremium ?? false}
                                                        onChange={() => dispatch({ type: 'TOGGLE_DYNAMIC_PRICING', payload: { zoneId: key, rule: 'rivalryPremium' } })}
                                                    />
                                                    Rivalry Premium (+25%)
                                                </label>
                                                <label style={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={segment.dynamicPricing?.rankedPremium ?? false}
                                                        onChange={() => dispatch({ type: 'TOGGLE_DYNAMIC_PRICING', payload: { zoneId: key, rule: 'rankedPremium' } })}
                                                    />
                                                    Ranked Premium (+15%)
                                                </label>
                                                <label style={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={segment.dynamicPricing?.cupcakeDiscount ?? false}
                                                        onChange={() => dispatch({ type: 'TOGGLE_DYNAMIC_PRICING', payload: { zoneId: key, rule: 'cupcakeDiscount' } })}
                                                    />
                                                    Cupcake Discount (-20%)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <button style={styles.ctaButton(colors)} onClick={handleSavePricing}>
                                Save Zone Pricing
                            </button>
                            <button style={styles.secondaryButton} onClick={handleRunForecast}>
                                Run Forecast
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section style={styles.summary}>
                <header style={{ marginBottom: '1rem', borderBottom: `2px solid ${colors.primary}20`, paddingBottom: '0.5rem' }}>
                    <h4 style={{ color: colors.primary, margin: 0 }}>Promotional Calendar</h4>
                    <p style={styles.summaryMeta}>Schedule events to boost attendance, sentiment, or recruiting.</p>
                </header>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {findUpcomingHomeGames(state, userTeam.name).map(({ week, game }) => {
                        const existingEvent = userTeam.eventCalendar?.find(e => e.week === week);
                        const opponent = state.allTeams.find(t => t.name === game.awayTeam);
                        
                        return (
                            <div key={week} style={styles.zoneCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                     <strong>{getGameDateStringFromEventQueue(state.eventQueue, state.season + 2024, week)} vs {game.awayTeam}</strong>
                                    {opponent && <span style={{ fontSize: '0.7rem', color: '#666' }}>Rk {opponent.prestige}</span>}
                                </div>
                                
                                {existingEvent ? (
                                    <div style={{ backgroundColor: '#f0f8ff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #b0c4de' }}>
                                        <strong style={{ color: '#0056b3', fontSize: '0.8rem' }}>
                                            {state.eventPlaybookCatalog.find(p => p.id === existingEvent.playbookId)?.label || 'Event Scheduled'}
                                        </strong>
                                        <p style={{ fontSize: '0.7rem', margin: '0.25rem 0 0' }}>Status: {existingEvent.status}</p>
                                        <button 
                                            style={{ ...styles.secondaryButton, marginTop: '0.5rem', width: '100%', color: '#d32f2f', borderColor: '#d32f2f' }}
                                            onClick={() => dispatch({ type: 'CANCEL_EVENT', payload: { eventId: existingEvent.id } })}
                                        >
                                            Cancel Event
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <select 
                                            style={{
                                                padding: '0.55rem',
                                                borderRadius: '8px',
                                                border: `2px solid ${colors.primary}55`,
                                                fontSize: '0.7rem',
                                                fontFamily: "'Press Start 2P', 'Courier New', system-ui, sans-serif",
                                                background: '#fff',
                                            }}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    dispatch({ 
                                                        type: 'SCHEDULE_EVENT', 
                                                        payload: { 
                                                            playbookId: e.target.value, 
                                                            week, 
                                                            opponent: game.awayTeam 
                                                        } 
                                                    });
                                                }
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="">Select Promotion...</option>
                                            {state.eventPlaybookCatalog.map(event => (
                                                <option key={event.id} value={event.id}>
                                                    {event.label} (${event.cost.toLocaleString()})
                                                </option>
                                            ))}
                                        </select>
                                        <p style={{ fontSize: '0.65rem', color: '#888', fontStyle: 'italic' }}>
                                            Select an event to see details.
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {isSmallScreen && (
                <button style={styles.secondaryButton} onClick={() => setShowZoneAnalytics(prev => !prev)}>
                    {showZoneAnalytics ? 'Hide' : 'Show'} Zone Analytics
                </button>
            )}
            {attendanceForecast && showZoneAnalytics && (
                <section>
                    <h4 style={{ color: colors.primary, margin: 0 }}>Zone Analytics</h4>
                    <div style={styles.analyticsGrid}>
                        {attendanceForecast.segments.map(segment => {
                            const fillPct =
                                segment.fillRate ??
                                (segment.capacity > 0 ? Number(((segment.filled / segment.capacity) * 100).toFixed(1)) : 0);
                            const priceDelta =
                                segment.price != null && segment.fairPrice != null
                                    ? segment.price - segment.fairPrice
                                    : null;
                            const deltaColor =
                                priceDelta != null && Math.abs(priceDelta) > 1 ? (priceDelta > 0 ? '#B22222' : '#0B8043') : '#555';
                            const mixEntries = segment.mix
                                ? (Object.entries(segment.mix) as [FanArchetype, number][])
                                      .filter(([, value]) => value != null)
                                      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                                : [];
                            const topMix = mixEntries.slice(0, 3);
                            const demandLabel = describeDemandScore(segment.demandScore);
                            return (
                                <div key={`${segment.key}-analytics`} style={styles.analyticsCard}>
                                    <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                        <strong>{getZoneLabel(segment.key)}</strong>
                                        <span style={{ fontSize: '0.65rem', color: '#666' }}>{fillPct}% fill</span>
                                    </header>
                                    <p style={{ ...styles.summaryMeta, marginBottom: '0.25rem' }}>
                                        Price {formatPriceDisplay(segment.price)} vs anchor {formatPriceDisplay(segment.fairPrice)}
                                    </p>
                                    {priceDelta != null && (
                                        <p style={{ fontSize: '0.65rem', margin: 0, color: deltaColor }}>
                                            {priceDelta === 0 ? 'On target' : `${priceDelta > 0 ? '+' : ''}${priceDelta.toFixed(0)} vs fair`}
                                            {Math.abs(priceDelta) > 10 && <strong style={{ marginLeft: '8px' }}>Recommend {priceDelta > 0 ? 'Lowering' : 'Raising'} Price</strong>}
                                        </p>
                                    )}
                                    {segment.rollingAverageFillRate != null && (
                                        <p style={{ fontSize: '0.65rem', margin: '4px 0 0', color: '#333' }}>
                                            vs. {segment.rollingAverageFillRate.toFixed(1)}% (3-game avg)
                                            {Math.abs(fillPct - segment.rollingAverageFillRate) > 8 && <span style={{ color: '#B22222', fontWeight: 'bold' }}> (High Variance)</span>}
                                        </p>
                                    )}
                                    <p style={{ ...styles.summaryMeta, marginTop: '0.35rem' }}>
                                        Demand {demandLabel} • Score {segment.demandScore?.toFixed(2) ?? '—'}
                                    </p>
                                    <p style={{ ...styles.summaryMeta, marginTop: '0.15rem' }}>
                                        Confidence <span style={{ color: segment.confidenceScore && segment.confidenceScore < 0.75 ? '#B22222' : '#0B8043' }}>{segment.confidenceScore ? (segment.confidenceScore * 100).toFixed(0) : '--'}%</span>
                                    </p>
                                    {topMix.length > 0 ? (
                                        <ul style={styles.mixList}>
                                            {topMix.map(([arch, value]) => (
                                                <li key={`${segment.key}-${arch}`} title={`${ARCHETYPE_LABELS[arch]}: Fans primarily driven by ${arch.toString()}.`}>
                                                    {ARCHETYPE_LABELS[arch] ?? arch}: {value.toFixed(0)}%
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ ...styles.summaryMeta, fontStyle: 'italic' }}>Mix data not available</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {isSmallScreen && (
                 <button style={styles.secondaryButton} onClick={() => setShowSuiteInsights(prev => !prev)}>
                    {showSuiteInsights ? 'Hide' : 'Show'} Suite & Booster Insights
                </button>
            )}
            {attendanceForecast && showSuiteInsights && (
                <section>
                    <h4 style={{ color: colors.primary, margin: 0 }}>Suite & Booster Insights</h4>
                    <div style={styles.forecastCard}>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <strong style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.5rem' }}>Suite Utilization</strong>
                                {(() => {
                                    const suiteSegment = attendanceForecast.segments.find(s => s.key === 'suites');
                                    if (!suiteSegment) return <p>No suites available.</p>;
                                    return (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span>{suiteSegment.filled} / {suiteSegment.capacity}</span>
                                            </div>
                                            <div style={styles.fillBar}>
                                                <div
                                                    style={{
                                                        ...styles.fillBarInner,
                                                        width: `${(suiteSegment.filled / suiteSegment.capacity) * 100}%`,
                                                        backgroundColor: colors.secondary,
                                                    }}
                                                />
                                            </div>
                                            <p style={styles.summaryMeta}>
                                                {suiteSegment.filled === suiteSegment.capacity
                                                    ? "Waitlist active. Premium demand is maxed out."
                                                    : "Capacity available for corporate partners."}
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <strong style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.5rem' }}>Booster Pool</strong>
                                <p style={styles.summaryMeta}>
                                    {userTeam.wealth.boosterPool} points available
                                </p>
                                <p style={styles.summaryMeta}>
                                    Upcoming Alumni Events: 1
                                </p>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <strong style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.5rem' }}>Quick Actions</strong>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button style={styles.secondaryButton} onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.FINANCES })}>Schedule Donor Gala</button>
                                    <button style={styles.secondaryButton} onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.FINANCES })}>Adjust Alumni Sliders</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: colors.primary, margin: 0 }}>Gate Ledger</h4>
                    <button onClick={handleExportCsv} style={{ ...styles.secondaryButton, padding: '0.25rem 0.5rem', fontSize: '0.55rem' }}>
                        Export CSV
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div style={styles.summaryBadge}>
                        <span style={styles.summaryLabel}>Best Gate</span>
                        <strong>{formatCurrency(bestGate)}</strong>
                    </div>
                    <div style={styles.summaryBadge}>
                        <span style={styles.summaryLabel}>Worst Fill %</span>
                        <strong>{worstFill.toFixed(1)}%</strong>
                    </div>
                    <div style={styles.summaryBadge}>
                        <span style={styles.summaryLabel}>Avg. Suite Use</span>
                        <strong>{avgSuiteUtilization.toFixed(1)}%</strong>
                    </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <Sparkline data={sparklineData} width={200} height={40} color={colors.primary} />
                </div>
                {attendanceHistory.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Game</th>
                                    <th>Attendance</th>
                                    <th>% Capacity</th>
                                    <th>Box Office</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...attendanceHistory].reverse().map((entry) => {
                                    const pct =
                                        entry.capacity && entry.capacity > 0
                                            ? (entry.attendance / entry.capacity) * 100
                                            : 0;
                                    const labelWeek =
                                        entry.week != null
                                            ? `Week ${entry.week}`
                                            : `Game`;
                                    const gameLog = entry.gameId ? gameLogsById.get(entry.gameId) : undefined;
                                    const userScore =
                                        gameLog
                                            ? (gameLog.homeTeam === userTeam.name ? gameLog.homeScore : gameLog.awayScore)
                                            : undefined;
                                    const opponentScore =
                                        gameLog
                                            ? (gameLog.homeTeam === userTeam.name ? gameLog.awayScore : gameLog.homeScore)
                                            : undefined;
                                    const didWin =
                                        typeof userScore === 'number' && typeof opponentScore === 'number'
                                            ? userScore > opponentScore
                                            : null;
                                    return (
                                        <tr key={entry.gameId ?? `${labelWeek}-${entry.opponent}`}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <span>
                                                        {labelWeek} vs {entry.opponent}
                                                    </span>
                                                    {typeof userScore === 'number' && typeof opponentScore === 'number' && didWin != null ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!gameLog) return;
                                                                dispatch({ type: 'VIEW_GAME_LOG', payload: { gameLog } });
                                                            }}
                                                            style={styles.scorePillButton(didWin ? 'win' : 'loss')}
                                                            title="Open game log"
                                                        >
                                                            {didWin ? 'W' : 'L'} {userScore}-{opponentScore}
                                                        </button>
                                                    ) : null}
                                                    {entry.simulated ? <em style={{ color: '#888' }}>(Forecast)</em> : null}
                                                </div>
                                            </td>
                                            <td>{entry.attendance.toLocaleString()} / {entry.capacity?.toLocaleString() ?? '—'}</td>
                                            <td>{pct.toFixed(1)}%</td>
                                            <td>{formatCurrency(entry.revenue)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>Gate data will appear once you log a home game.</p>
                )}
            </section>
        </div>
    );
};

const styles = {
    summary: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        padding: '0.75rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fdfdfd',
        color: '#333',
    } as React.CSSProperties,
    summaryLabel: {
        fontSize: '0.55rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#777',
    } as React.CSSProperties,
    summaryMeta: {
        margin: 0,
        fontSize: '0.65rem',
        color: '#666',
    } as React.CSSProperties,
    zoneGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
    } as React.CSSProperties,
    zoneCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '8px',
        padding: '0.5rem',
        backgroundColor: '#fff',
        color: '#333',
    } as React.CSSProperties,
    fillBar: {
        width: '100%',
        height: '6px',
        backgroundColor: '#ececec',
        borderRadius: '999px',
        overflow: 'hidden',
        marginTop: '0.35rem',
    } as React.CSSProperties,
    fillBarInner: {
        height: '100%',
        borderRadius: '999px',
    } as React.CSSProperties,
    ctaButton: (colors: TeamColors) =>
        ({
            backgroundColor: colors.primary,
            color: colors.text,
            border: 'none',
            padding: '0.45rem 0.75rem',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.6rem',
            cursor: 'pointer',
        }) as React.CSSProperties,
    secondaryButton: {
        backgroundColor: '#f0f0f0',
        color: '#333',
        border: '1px solid #ccc',
        padding: '0.45rem 0.75rem',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.6rem',
        cursor: 'pointer',
    } as React.CSSProperties,
    forecastCard: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '0.75rem',
        backgroundColor: '#fff',
        color: '#333',
    } as React.CSSProperties,
    tagPill: {
        fontSize: '0.6rem',
        padding: '0.15rem 0.5rem',
        borderRadius: '999px',
        border: '1px solid rgba(0,0,0,0.08)',
        textTransform: 'capitalize',
        backgroundColor: '#f5f5f5',
    } as React.CSSProperties,
    scorePillButton: (tone: 'win' | 'loss') =>
        ({
            backgroundColor: '#fff',
            color: tone === 'win' ? '#0B8043' : '#B22222',
            border: '1px solid rgba(0,0,0,0.18)',
            borderRadius: 999,
            padding: '0.2rem 0.45rem',
            fontSize: '0.55rem',
            fontFamily: "'Press Start 2P', cursive",
            lineHeight: 1.2,
            cursor: 'pointer',
        }) as React.CSSProperties,
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.65rem',
    } as React.CSSProperties,
    analyticsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
    } as React.CSSProperties,
    analyticsCard: {
        border: '1px solid #dcdcdc',
        borderRadius: '8px',
        padding: '0.65rem',
        backgroundColor: '#fff',
        color: '#333',
    } as React.CSSProperties,
    mixList: {
        listStyle: 'none',
        padding: 0,
        margin: '0.35rem 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
        fontSize: '0.62rem',
    } as React.CSSProperties,
    summaryBadge: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '0.5rem',
        backgroundColor: '#fdfdfd',
        color: '#333',
        textAlign: 'center',
        flex: '1 1 0',
    } as React.CSSProperties,
};

const Sparkline = ({ data, width, height, color }: { data: number[], width: number, height: number, color: string }) => {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / (max - min)) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
            />
        </svg>
    );
};
