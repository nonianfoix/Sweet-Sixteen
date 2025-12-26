import React, { useEffect, useMemo, useState } from 'react';
import { GameEvent, GameResult, ISODate, Month } from '../types';
import { isoToJsDateUTC } from '../services/dateService';
import type { TeamColors } from '../types';

type UserGameInfo = {
    week: number;
    date: ISODate;
    opponent: string;
    isHome: boolean;
    played: boolean;
    userScore?: number;
    opponentScore?: number;
};

const MONTH_ORDER: Month[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTH_LABELS: Record<Month, string> = {
    JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April', MAY: 'May', JUN: 'June',
    JUL: 'July', AUG: 'August', SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December',
};

const makeDateKey = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

const monthIndexToMonth = (idx: number): Month => MONTH_ORDER[Math.max(0, Math.min(11, idx))];

const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.trim().replace('#', '');
    const full = normalized.length === 3
        ? normalized.split('').map(c => c + c).join('')
        : normalized;
    if (full.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = Number.parseInt(full.slice(0, 2), 16);
    const g = Number.parseInt(full.slice(2, 4), 16);
    const b = Number.parseInt(full.slice(4, 6), 16);
    if (![r, g, b].every(Number.isFinite)) return `rgba(0,0,0,${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const DashboardScheduleCalendar = ({
    userTeamName,
    userTeamColors,
    schedule,
    eventQueue,
    currentDate,
    currentWeek,
    getLogoSrc,
    getTeamColors,
    onSelectHomeGame,
    onViewGameLog,
    followCurrentDate = false,
}: {
    userTeamName: string;
    userTeamColors: TeamColors;
    schedule: GameResult[][];
    eventQueue: GameEvent[];
    currentDate: ISODate;
    currentWeek: number;
    getLogoSrc: (schoolName: string) => string;
    getTeamColors: (schoolName: string) => TeamColors;
    onSelectHomeGame?: (info: { week: number; date: ISODate; opponent: string }) => void;
    onViewGameLog?: (info: { week: number; opponent: string; isHome: boolean }) => void;
    followCurrentDate?: boolean;
}) => {
    const currentJsDate = useMemo(() => isoToJsDateUTC(currentDate), [currentDate]);

    const userGamesByDateKey = useMemo(() => {
        const byWeek = new Map<number, ISODate>();
        for (const event of eventQueue || []) {
            if (event.type !== 'GAME') continue;
            const week = Number(event.payload?.week);
            if (!Number.isFinite(week) || week <= 0 || week > 31) continue;
            if (!byWeek.has(week)) byWeek.set(week, event.date);
        }

        const map = new Map<string, UserGameInfo>();
        for (let week = 1; week <= 31; week++) {
            const matchups = schedule?.[week - 1] || [];
            const userGame = matchups.find(g => g.homeTeam === userTeamName || g.awayTeam === userTeamName);
            if (!userGame) continue;
            const date = byWeek.get(week);
            if (!date) continue;

            const isHome = userGame.homeTeam === userTeamName;
            const opponent = isHome ? userGame.awayTeam : userGame.homeTeam;
            const played = !!userGame.played;
            const userScore = played ? (isHome ? userGame.homeScore : userGame.awayScore) : undefined;
            const opponentScore = played ? (isHome ? userGame.awayScore : userGame.homeScore) : undefined;
            const key = date;
            map.set(key, { week, date, opponent, isHome, played, userScore, opponentScore });
        }
        return map;
    }, [eventQueue, schedule, userTeamName]);

    const seasonStartYear = useMemo(() => {
        const gameDates = (eventQueue || [])
            .filter(e => e.type === 'GAME' && typeof e.date === 'string' && e.date.length >= 7)
            .map(e => e.date)
            .sort();
        if (gameDates.length > 0) {
            return isoToJsDateUTC(gameDates[0]).getUTCFullYear();
        }
        const month = currentJsDate.getUTCMonth();
        const year = currentJsDate.getUTCFullYear();
        return month >= 10 ? year : year - 1;
    }, [currentJsDate, eventQueue]);

    const minMonthStart = useMemo(() => new Date(Date.UTC(seasonStartYear, 10, 1)), [seasonStartYear]);
    const maxMonthStart = useMemo(() => new Date(Date.UTC(seasonStartYear + 1, 5, 1)), [seasonStartYear]);

    const clampToMonthBounds = (d: Date) => {
        if (d.getTime() < minMonthStart.getTime()) return minMonthStart;
        if (d.getTime() > maxMonthStart.getTime()) return maxMonthStart;
        return d;
    };

    const initialMonthStart = clampToMonthBounds(new Date(Date.UTC(currentJsDate.getUTCFullYear(), currentJsDate.getUTCMonth(), 1)));
    const [viewYear, setViewYear] = useState(initialMonthStart.getUTCFullYear());
    const [viewMonthIndex, setViewMonthIndex] = useState(initialMonthStart.getUTCMonth());

    useEffect(() => {
        if (!followCurrentDate) return;
        const targetMonthStart = clampToMonthBounds(new Date(Date.UTC(currentJsDate.getUTCFullYear(), currentJsDate.getUTCMonth(), 1)));
        const nextYear = targetMonthStart.getUTCFullYear();
        const nextMonth = targetMonthStart.getUTCMonth();
        if (nextYear !== viewYear || nextMonth !== viewMonthIndex) {
            setViewYear(nextYear);
            setViewMonthIndex(nextMonth);
        }
    }, [currentJsDate, followCurrentDate, maxMonthStart, minMonthStart, viewMonthIndex, viewYear]);

    const viewMonth: Month = monthIndexToMonth(viewMonthIndex);

    const monthGrid = useMemo(() => {
        const first = new Date(Date.UTC(viewYear, viewMonthIndex, 1));
        const daysInMonth = new Date(Date.UTC(viewYear, viewMonthIndex + 1, 0)).getUTCDate();
        const leading = first.getUTCDay(); // 0=Sun
        const totalCells = 42;
        const cells: Array<{ date: Date | null; key: string }> = [];

        for (let i = 0; i < totalCells; i++) {
            const dayNum = i - leading + 1;
            if (dayNum < 1 || dayNum > daysInMonth) {
                cells.push({ date: null, key: `empty-${i}` });
                continue;
            }
            const d = new Date(Date.UTC(viewYear, viewMonthIndex, dayNum));
            cells.push({ date: d, key: makeDateKey(d) });
        }
        return cells;
    }, [viewMonthIndex, viewYear]);

    const viewMonthStart = useMemo(() => new Date(Date.UTC(viewYear, viewMonthIndex, 1)), [viewMonthIndex, viewYear]);
    const isPrevDisabled = viewMonthStart.getTime() <= minMonthStart.getTime();
    const isNextDisabled = viewMonthStart.getTime() >= maxMonthStart.getTime();

    const onPrevMonth = () => {
        if (isPrevDisabled) return;
        const next = new Date(Date.UTC(viewYear, viewMonthIndex - 1, 1));
        setViewYear(next.getUTCFullYear());
        setViewMonthIndex(next.getUTCMonth());
    };
    const onNextMonth = () => {
        if (isNextDisabled) return;
        const next = new Date(Date.UTC(viewYear, viewMonthIndex + 1, 1));
        setViewYear(next.getUTCFullYear());
        setViewMonthIndex(next.getUTCMonth());
    };

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const surfaceBg = '#ffffff';
    const surfaceMuted = '#f1f5f9';
    const ink = '#0f172a';
    const mutedInk = 'rgba(15,23,42,0.62)';
    const cardBorder = 'rgba(15,23,42,0.16)';
    const todayBorder = 'rgba(15,23,42,0.35)';
    const accentBorder = userTeamColors?.primary ? hexToRgba(userTeamColors.primary, 0.95) : 'rgba(255,122,0,0.95)';

    return (
        <div style={{
            background: surfaceBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 12,
            padding: 12,
            boxShadow: '0 10px 22px rgba(15,23,42,0.10)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ color: mutedInk, fontSize: 12, letterSpacing: 0.7 }}>CALENDAR</div>
                    <div style={{ color: ink, fontSize: 16, fontWeight: 800 }}>{MONTH_LABELS[viewMonth]} {viewYear}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        type="button"
                        onClick={onPrevMonth}
                        disabled={isPrevDisabled}
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: `1px solid ${cardBorder}`,
                            background: surfaceBg,
                            color: ink,
                            cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
                            opacity: isPrevDisabled ? 0.45 : 1,
                        }}
                        aria-label="Previous month"
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        onClick={onNextMonth}
                        disabled={isNextDisabled}
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: `1px solid ${cardBorder}`,
                            background: surfaceBg,
                            color: ink,
                            cursor: isNextDisabled ? 'not-allowed' : 'pointer',
                            opacity: isNextDisabled ? 0.45 : 1,
                        }}
                        aria-label="Next month"
                    >
                        ›
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                {dayNames.map(d => (
                    <div key={d} style={{ textAlign: 'center', color: mutedInk, fontSize: 11, fontWeight: 800 }}>
                        {d}
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {monthGrid.map(cell => {
                    if (!cell.date) {
                        return <div key={cell.key} style={{ height: 60, borderRadius: 10, background: surfaceMuted, border: `1px solid ${cardBorder}` }} />;
                    }

                    const key = makeDateKey(cell.date);
                    const userGame = userGamesByDateKey.get(key);
                    const isToday = makeDateKey(currentJsDate) === key;
                    const isCurrentWeek = userGame?.week === currentWeek;

                    const opponentColors = userGame ? getTeamColors(userGame.opponent) : null;
                    const accent = opponentColors?.primary || userTeamColors.primary;
                    const baseBg = userGame
                        ? (userGame.isHome ? '#F0DCC4' : hexToRgba(accent, 0.8))
                        : surfaceBg;

                    const border = isCurrentWeek
                        ? `2px solid ${accentBorder}`
                        : isToday
                            ? `2px solid ${todayBorder}`
                            : `1px solid ${cardBorder}`;

                    const dateBadgeBg = userGame ? accent : 'transparent';
                    const dateBadgeColor = userGame ? '#ffffff' : ink;

                    const matchupLabel = userGame ? `${userGame.isHome ? 'vs' : '@'} ${userGame.opponent}` : '';
                    const logoOpacity = userGame ? (userGame.played ? 0.40 : 0.62) : 0;
                    const canClickHomeGame =
                        !!userGame?.isHome &&
                        !userGame.played &&
                        userGame.week >= currentWeek &&
                        typeof onSelectHomeGame === 'function';

                    return (
                        <div
                            key={cell.key}
                            role={canClickHomeGame ? 'button' : undefined}
                            tabIndex={canClickHomeGame ? 0 : undefined}
                            onClick={() => {
                                if (!canClickHomeGame || !userGame) return;
                                onSelectHomeGame?.({ week: userGame.week, date: userGame.date, opponent: userGame.opponent });
                            }}
                            onKeyDown={(e) => {
                                if (!canClickHomeGame || !userGame) return;
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelectHomeGame?.({ week: userGame.week, date: userGame.date, opponent: userGame.opponent });
                                }
                            }}
                            style={{
                                height: 60,
                                borderRadius: 10,
                                background: baseBg,
                                border,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                padding: 6,
                                cursor: canClickHomeGame ? 'pointer' : 'default',
                            }}
                            title={userGame ? `${MONTH_LABELS[viewMonth]} ${cell.date.getUTCDate()}, ${viewYear} — ${matchupLabel}` : `${MONTH_LABELS[viewMonth]} ${cell.date.getUTCDate()}, ${viewYear}`}
                        >
                            {userGame && (
                                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
                                </div>
                            )}
                            {userGame && (
                                <img
                                    src={getLogoSrc(userGame.opponent)}
                                    alt=""
                                    aria-hidden="true"
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-30%, -50%)',
                                        width: 76,
                                        height: 76,
                                        objectFit: 'contain',
                                        opacity: logoOpacity,
                                        filter: userGame.played ? 'grayscale(85%) saturate(0.5)' : 'saturate(0.85)',
                                        pointerEvents: 'none',
                                        zIndex: 0,
                                    }}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', position: 'relative', zIndex: 3 }}>
                                <div style={{
                                    color: dateBadgeColor,
                                    background: dateBadgeBg,
                                    fontSize: 12,
                                    fontWeight: 900,
                                    borderRadius: 6,
                                    padding: '2px 6px',
                                    minWidth: 20,
                                    textAlign: 'center',
                                    boxShadow: userGame ? '0 1px 0 rgba(15,23,42,0.25)' : 'none',
                                }}>
                                    {cell.date.getUTCDate()}
                                </div>
                                {userGame && (
                                    <div style={{ color: mutedInk, fontSize: 10, fontWeight: 900 }}>
                                        {userGame.isHome ? 'vs' : '@'}
                                    </div>
                                )}
                            </div>

                            {userGame ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 6, position: 'relative', zIndex: 3 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                        <div style={{ color: ink, fontSize: 10, fontWeight: 800, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {matchupLabel}
                                        </div>
                                        {userGame.played && typeof userGame.userScore === 'number' && typeof userGame.opponentScore === 'number' ? (
                                            <button
                                                type="button"
                                                disabled={typeof onViewGameLog !== 'function'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewGameLog?.({ week: userGame.week, opponent: userGame.opponent, isHome: userGame.isHome });
                                                }}
                                                style={{
                                                    marginTop: 4,
                                                    alignSelf: 'flex-start',
                                                    background: '#ffffff',
                                                    border: `1px solid ${cardBorder}`,
                                                    borderRadius: 999,
                                                    padding: '2px 8px',
                                                    fontSize: 12,
                                                    fontWeight: 900,
                                                    lineHeight: 1.2,
                                                    color: userGame.userScore > userGame.opponentScore ? '#16a34a' : '#dc2626',
                                                    cursor: typeof onViewGameLog === 'function' ? 'pointer' : 'not-allowed',
                                                }}
                                                title="Open game log"
                                            >
                                                {userGame.userScore > userGame.opponentScore ? 'W' : 'L'} {userGame.userScore}-{userGame.opponentScore}
                                            </button>
                                        ) : (
                                            <div style={{ height: 10 }} />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div />
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 10, color: mutedInk, fontSize: 11 }}>
                <div><span style={{ color: accentBorder, fontWeight: 900 }}>▣</span> Upcoming game day</div>
                <div><span style={{ color: todayBorder, fontWeight: 900 }}>▣</span> Today</div>
            </div>
        </div>
    );
};
