import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { GameState, GameAction, TeamColors, Player, Team, NBATeamSimulation, DraftProspectSource } from '../types';
import { NBA_NAME_TO_ACRONYM } from '../constants';
import { NBA_DRAFT_PICK_RULES } from '../data/nbaDraftPickSwaps';
import { buildDraftProspectBoard, seasonToCalendarYear } from '../services/gameService';
import { computeDraftPickOwnership, DraftSlotAssignment } from '../services/draftUtils';
import { formatPotentialValue } from '../services/gameUtils';
import { formatPlayerHeight } from '../services/utils';
import { getTeamLogoUrl } from '../services/logoUtils';
import { getTeamAbbreviation } from '../services/gameReducer';

const styles = {
    select: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '12px',
        fontWeight: 700,
        padding: '6px 10px',
        border: '2px solid #0f172a',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        boxShadow: '2px 2px 0 #0f172a',
        cursor: 'pointer',
    },
    smallButton: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: '10px',
      fontWeight: 800,
      padding: '4px 8px',
      border: '2px solid #0f172a',
      borderRadius: '4px',
      backgroundColor: '#ffffff',
      color: '#0f172a',
      boxShadow: '2px 2px 0 #0f172a',
      cursor: 'pointer',
    },
    tableContainer: {
        overflowX: 'auto' as const,
    },
    table: {
        width: '100%',
        borderCollapse: 'separate' as const,
        borderSpacing: '0',
        fontSize: '12px',
        color: '#0f172a',
        minWidth: '600px',
        background: '#f8fafc',
        border: '2px solid #0f172a',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '4px 4px 0 #0f172a',
    },
    th: {
        padding: '10px 12px',
        borderBottom: '2px solid #0f172a',
        textAlign: 'left' as const,
        fontWeight: 900,
        fontSize: '11px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    td: {
        padding: '10px 12px',
        borderBottom: '1px solid #e2e8f0',
        verticalAlign: 'middle' as const,
        color: '#0f172a',
        fontWeight: 600,
    },
    teamCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
    },
    teamLogoWrapper: {
        flexShrink: 0,
    },
    teamNameBlock: {
        display: 'flex',
        flexDirection: 'column' as const,
        minWidth: 0,
    },
    teamViaText: {
        fontSize: '0.62rem',
        color: '#555',
    },
};

const MockDraftView = ({ state, colors, dispatch }: { state: GameState, colors: TeamColors, dispatch: React.Dispatch<GameAction> }) => {
    const simulation = state.currentNBASimulation;
    const [positionFilter, setPositionFilter] = useState<'ALL' | Player['position']>('ALL');
    const [roundFilter, setRoundFilter] = useState<'all' | 'first' | 'second'>('all');
    const [userOnly, setUserOnly] = useState(false);
    const [sortMode, setSortMode] = useState<'pick' | 'score' | 'trend'>('pick');
    const [localTrendDiffs, setLocalTrendDiffs] = useState<Record<string, number>>({});
    const previousPickMapRef = useRef<Map<string, number>>(new Map());
    const resetFilters = () => {
        setPositionFilter('ALL');
        setRoundFilter('all');
        setUserOnly(false);
        setSortMode('pick');
    };
    const boardSeed = simulation?.season ?? state.season;
    const generatedProspects = useMemo(
        () => buildDraftProspectBoard(state.allTeams, state.internationalProspects || [], 60, boardSeed),
        [boardSeed, state.allTeams, state.internationalProspects]
    );
    const storedBoard = state.mockDraftBoard || [];
    const boardMatches = useMemo(() => {
        if (!storedBoard.length || storedBoard.length !== generatedProspects.length) return false;
        return storedBoard.every((entry, index) => entry.player.id === generatedProspects[index].player.id);
    }, [storedBoard, generatedProspects]);
    useEffect(() => {
        if (!boardMatches) {
            dispatch({ type: 'SET_MOCK_DRAFT_BOARD', payload: { board: generatedProspects } });
        }
    }, [boardMatches, generatedProspects, dispatch]);
    const prospects = boardMatches ? storedBoard : generatedProspects;
    const baseDraftOrder = useMemo(() => {
        if (state.nbaTeams && state.nbaTeams.length > 0) {
            return [...state.nbaTeams]
                .sort((a, b) => {
                    const aWins = a.record?.wins ?? 0;
                    const bWins = b.record?.wins ?? 0;
                    if (aWins !== bWins) return aWins - bWins;
                    const aLosses = a.record?.losses ?? 0;
                    const bLosses = b.record?.losses ?? 0;
                    if (aLosses !== bLosses) return bLosses - aLosses;
                    return a.name.localeCompare(b.name);
                })
                .map(team => team.name);
        }
        const storedOrder = Object.entries(state.mockDraftProjections || {})
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([, teamName]) => teamName);
        if (storedOrder.length > 0) return storedOrder;
        if (simulation) return [...simulation.draftOrder];
        return [];
    }, [simulation, state.mockDraftProjections, state.nbaTeams]);
    const draftOrder = useMemo(() => {
        if (baseDraftOrder.length === 0) return [];
        const targetLength = Math.max(prospects.length, baseDraftOrder.length);
        const expanded: string[] = [];
        for (let i = 0; i < targetLength; i++) {
            expanded.push(baseDraftOrder[i % baseDraftOrder.length]);
        }
        return expanded;
    }, [baseDraftOrder, prospects.length]);
    const trendDiffs = state.mockDraftProjectionDiffs || {};
    const hasServerDiffs = Object.keys(trendDiffs).length > 0;
    useEffect(() => {
        if (prospects.length === 0) return;
        const incomingOrder = new Map<string, number>();
        const calculatedDiffs: Record<string, number> = {};
        const previousOrder = previousPickMapRef.current;
        prospects.forEach((prospect, index) => {
            const previousPick = previousOrder.get(prospect.player.id);
            const currentPick = index + 1;
            calculatedDiffs[prospect.player.id] =
                typeof previousPick === 'number' ? previousPick - currentPick : 0;
            incomingOrder.set(prospect.player.id, currentPick);
        });
        previousPickMapRef.current = incomingOrder;
        setLocalTrendDiffs(calculatedDiffs);
    }, [prospects]);
    const effectiveTrendDiffs = hasServerDiffs ? trendDiffs : localTrendDiffs;

    const categoryTotals = useMemo(() => {
        return prospects.reduce<Record<string, number>>((acc, prospect) => {
            acc[prospect.category] = (acc[prospect.category] || 0) + 1;
            return acc;
        }, {});
    }, [prospects]);
    const nbaRecordMap = useMemo(() => {
        const map = new Map<string, { wins: number; losses: number }>();
        (state.nbaTeams || []).forEach(team => {
            map.set(team.name, { wins: team.record?.wins ?? 0, losses: team.record?.losses ?? 0 });
        });
        simulation?.teams.forEach(team => {
            if (!map.has(team.name)) {
                map.set(team.name, { wins: team.wins, losses: team.losses });
            }
        });
        return map;
    }, [simulation, state.nbaTeams]);
    // The draft happens at the END of the season, so add 1 to get the correct draft year
    // (e.g., Season 1 = 2025-26, draft happens in June 2026)
    const upcomingDraftYear = useMemo(() => {
        if (state.currentNBASimulation && typeof state.currentNBASimulation.season === 'number') {
            return seasonToCalendarYear(state.currentNBASimulation.season) + 1;
        }
        return seasonToCalendarYear(state.season) + 1;
    }, [state.currentNBASimulation, state.season]);
    const pickOwnerHeaderLabel = upcomingDraftYear > 2000 ? `Pick Owner (${upcomingDraftYear})` : 'Pick Owner';

    const teamBadge = (name: string, size: number, highlight?: boolean) => {
        const acronym = NBA_NAME_TO_ACRONYM[name] || name;
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: highlight ? '#222' : '#fff',
                    color: highlight ? '#fff' : '#222',
                    border: '1px solid #999',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size * 0.35,
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
        >
            {acronym.slice(0, 3)}
        </div>
    );
};

    const renderTeamLogoImage = (teamName: string, size: number, highlight?: boolean) => {
        const logoUrl = getTeamLogoUrl(teamName);
        if (logoUrl) {
            return (
                <img
                    src={logoUrl}
                    alt={`${teamName} logo`}
                    style={{
                        width: size,
                        height: size,
                        objectFit: 'contain',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: '#fff',
                    }}
                />
            );
        }
        return teamBadge(teamName, size, highlight);
    };

    const projectedChampion = useMemo(() => {
        const scoreLiveTeam = (team: Team) => {
            const wins = team.record?.wins ?? 0;
            const losses = team.record?.losses ?? 0;
            const games = wins + losses;
            const winPct = games > 0 ? wins / games : 0;
            const prestige = team.prestige ?? 50;
            const avgOverall =
                team.roster && team.roster.length > 0
                    ? team.roster.reduce((sum, player) => sum + (player.overall || 60), 0) / team.roster.length
                    : prestige;
            return winPct * 100 + wins * 2 - losses + prestige * 0.4 + avgOverall * 0.6;
        };
        const scoreSimTeam = (team: NBATeamSimulation) => {
            const winPct = team.wins + team.losses > 0 ? team.wins / (team.wins + team.losses) : 0;
            return winPct * 80 + team.wins * 2 - team.losses + team.rating;
        };
        if (state.nbaTeams && state.nbaTeams.length > 0) {
            const best = [...state.nbaTeams].sort((a, b) => scoreLiveTeam(b) - scoreLiveTeam(a))[0];
            if (best)
                return {
                    name: best.name,
                    wins: best.record?.wins ?? 0,
                    losses: best.record?.losses ?? 0,
                };
        }
        if (simulation?.teams && simulation.teams.length > 0) {
            const best = [...simulation.teams].sort((a, b) => scoreSimTeam(b) - scoreSimTeam(a))[0];
            if (best) return { name: best.name, wins: best.wins, losses: best.losses };
        }
        return { name: simulation?.champion || 'TBD', wins: undefined, losses: undefined };
    }, [simulation, state.nbaTeams]);

    if (!simulation) {
        return (
            <div style={{ padding: '10px', fontSize: '0.8rem' }}>
                <p>The mock draft unlocks once the NBA season simulation runs for the upcoming class. Advance to the offseason to generate projections.</p>
            </div>
        );
    }

    if (prospects.length === 0) {
        return (
            <div style={{ padding: '10px', fontSize: '0.8rem' }}>
                <p>No prospects are currently projected. Continue the season to build up draft buzz.</p>
            </div>
        );
    }

    const chipStyle: React.CSSProperties = {
        borderRadius: '12px',
        padding: '2px 8px',
        fontSize: '0.65rem',
        backgroundColor: colors.secondary,
        color: colors.text,
    };

    const classLabels: Record<string, string> = {
        freshman: 'Fr',
        sophomore: 'So',
        junior: 'Jr',
        senior: 'Sr',
        international: 'Intl',
    };
    const firstRoundLength = simulation.draftOrder.length;
    const getPerGame = (player: Player) => {
        const stats = player.seasonStats || { gamesPlayed: 0, points: 0, rebounds: 0, assists: 0, minutes: 0 };
        const games = Math.max(1, stats.gamesPlayed || 1);
        return {
            ppg: stats.points / games,
            rpg: stats.rebounds / games,
            apg: stats.assists / games,
            mpg: (stats.minutes ?? 0) / games,
        };
    };
    const enrichedProspects = useMemo(() => {
        const baseLength = baseDraftOrder.length || 1;
        return prospects.map((prospect, index) => {
            const nbaTeam = draftOrder[index] || 'TBD';
            const slotTeam = baseDraftOrder[index % baseLength] || nbaTeam;
            return {
                ...prospect,
                pick: index + 1,
                nbaTeam,
                slotTeam,
                perGame: getPerGame(prospect.player),
                isUserPlayer: prospect.originalTeam === state.userTeam?.name,
                diff: effectiveTrendDiffs[prospect.player.id],
            };
        });
    }, [baseDraftOrder, draftOrder, prospects, state.userTeam?.name, effectiveTrendDiffs]);
    const pickOwnerLookup = useMemo(() => {
        const slotEntries: DraftSlotAssignment[] = enrichedProspects.map(prospect => ({
            pick: prospect.pick,
            round: prospect.pick <= firstRoundLength ? 1 : 2,
            slotTeam: prospect.slotTeam || prospect.nbaTeam,
        }));
        const ruleSet = state.customDraftPickRules && state.customDraftPickRules.length > 0
            ? state.customDraftPickRules
            : NBA_DRAFT_PICK_RULES;
        return computeDraftPickOwnership(slotEntries, ruleSet, upcomingDraftYear);
    }, [enrichedProspects, firstRoundLength, upcomingDraftYear, state.customDraftPickRules]);
    const filteredProspects = useMemo(() => {
        return enrichedProspects
            .filter(entry => (positionFilter === 'ALL' ? true : entry.player.position === positionFilter))
            .filter(entry => (userOnly ? entry.isUserPlayer : true))
            .filter(entry => {
                if (roundFilter === 'first') return entry.pick <= firstRoundLength;
                if (roundFilter === 'second') return entry.pick > firstRoundLength;
                return true;
            })
            .sort((a, b) => {
                switch (sortMode) {
                    case 'score':
                        return b.score - a.score;
                    case 'trend':
                        return (b.diff || 0) - (a.diff || 0);
                    default:
                        return a.pick - b.pick;
                }
            });
    }, [enrichedProspects, firstRoundLength, positionFilter, roundFilter, sortMode, userOnly]);
    const originCounts = useMemo(() => {
        return prospects.reduce(
            (totals, prospect) => {
                totals[prospect.source] = (totals[prospect.source] || 0) + 1;
                return totals;
            },
            {} as Record<DraftProspectSource, number>
        );
    }, [prospects]);

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', fontSize: '0.7rem' }}>
                {(Object.keys(classLabels) as Array<keyof typeof classLabels>).map(key => (
                    <span key={key} style={chipStyle}>
                        {classLabels[key]}: {categoryTotals[key] || 0}
                    </span>
                ))}
                <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
                    Projected Champion: {projectedChampion.name}
                    {typeof projectedChampion.wins === 'number' &&
                    typeof projectedChampion.losses === 'number'
                        ? ` (${projectedChampion.wins}-${projectedChampion.losses})`
                        : ''}
                </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px', fontSize: '0.65rem' }}>
                <label>
                    Position:&nbsp;
                    <select value={positionFilter} onChange={e => setPositionFilter(e.target.value as any)} style={styles.select}>
                        <option value="ALL">All</option>
                        <option value="PG">PG</option>
                        <option value="SG">SG</option>
                        <option value="SF">SF</option>
                        <option value="PF">PF</option>
                        <option value="C">C</option>
                    </select>
                </label>
                <label>
                    Round:&nbsp;
                    <select value={roundFilter} onChange={e => setRoundFilter(e.target.value as any)} style={styles.select}>
                        <option value="all">Full Draft</option>
                        <option value="first">Round 1</option>
                        <option value="second">Round 2</option>
                    </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="checkbox" checked={userOnly} onChange={e => setUserOnly(e.target.checked)} />
                    Show my players
                </label>
                <label>
                    Sort:&nbsp;
                    <select value={sortMode} onChange={e => setSortMode(e.target.value as any)} style={styles.select}>
                        <option value="pick">Projected Pick</option>
                        <option value="score">Draft Score</option>
                        <option value="trend">Trend</option>
                    </select>
                </label>
                <button onClick={resetFilters} style={{ ...styles.smallButton, alignSelf: 'center' }}>
                    Reset
                </button>
            </div>
            <p style={{ fontSize: '0.6rem', color: '#555', marginTop: '-6px', marginBottom: '8px' }}>
                Trend legend: ▲X means a player climbed X slots, ▼X fell X slots, and 0 stayed put.
            </p>
            <p style={{ fontSize: '0.65rem', marginBottom: '6px', color: '#444' }}>
                Showing {filteredProspects.length} of {prospects.length} prospects ({originCounts['NCAA'] || 0} NCAA /{' '}
                {originCounts['International'] || 0} Intl)
            </p>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pick</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>NBA Team</th>
                            <th
                                style={{
                                    ...styles.th,
                                    backgroundColor: colors.primary,
                                    color: colors.text,
                                    fontSize: '0.76rem',
                                    whiteSpace: 'nowrap',
                                    minWidth: '150px',
                                }}
                            >
                                {pickOwnerHeaderLabel}
                            </th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>POS</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Ht</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Class</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Origin</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>OVR</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>POT</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>PPG</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>RPG</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>APG</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>MPG</th>
                            <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProspects.map(prospect => {
                            const rowStyle: React.CSSProperties = prospect.isUserPlayer ? { backgroundColor: '#FFFFAA' } : {};
                            const diff = prospect.diff;
                            const slotTeamKey = prospect.slotTeam || prospect.nbaTeam;
                            const ownerEntry = pickOwnerLookup.get(prospect.pick);
                            const pickOwnerName = ownerEntry?.owner || slotTeamKey;
                            const ownerDiffers = pickOwnerName !== slotTeamKey;
                            let trendLabel = 'NEW';
                            let trendColor = '#777';
                            if (typeof diff === 'number') {
                                if (diff > 0) {
                                    trendLabel = `▲ ${diff}`;
                                    trendColor = '#1a7f37';
                                } else if (diff < 0) {
                                    trendLabel = `▼ ${Math.abs(diff)}`;
                                    trendColor = '#c52b2b';
                                } else {
                                    trendLabel = '0';
                                    trendColor = '#555';
                                }
                            }
                            const teamRecord = nbaRecordMap.get(prospect.nbaTeam);
                            const slotAcronym =
                                prospect.slotTeam && prospect.slotTeam !== prospect.nbaTeam
                                    ? getTeamAbbreviation(prospect.slotTeam)
                                    : null;
                            return (
                                <tr key={`${prospect.player.id}-${prospect.pick}`} style={rowStyle}>
                                    <td style={styles.td}>{prospect.pick}</td>
                                    <td style={styles.td}>
                                        <div style={styles.teamCell}>
                                            <div style={styles.teamLogoWrapper}>{renderTeamLogoImage(prospect.nbaTeam, 32)}</div>
                                            <div style={styles.teamNameBlock}>
                                                <span>
                                                    {prospect.nbaTeam}
                                                    {teamRecord ? ` (${teamRecord.wins}-${teamRecord.losses})` : ''}
                                                </span>
                                                {slotAcronym && (
                                                    <span style={styles.teamViaText}>via {slotAcronym}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...styles.td, minWidth: '190px', fontSize: '0.72rem', lineHeight: 1.4 }}>
                                        <div style={styles.teamCell}>
                                            <div style={styles.teamLogoWrapper}>{renderTeamLogoImage(pickOwnerName, 32, ownerDiffers)}</div>
                                            <div style={styles.teamNameBlock}>
                                                <span>{pickOwnerName}</span>
                                                {ownerDiffers && (
                                                    <span style={styles.teamViaText}>via {slotTeamKey}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        {prospect.player.name}
                                        <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: trendColor, fontWeight: 'bold' }}>
                                            {trendLabel}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{prospect.player.position}</td>
                                    <td style={styles.td}>{formatPlayerHeight(prospect.player.height)}</td>
                                    <td style={styles.td}>{classLabels[prospect.category]}</td>
                                    <td style={styles.td}>{prospect.originDescription}</td>
                                    <td style={styles.td}>{prospect.player.overall}</td>
                                    <td style={styles.td}>{formatPotentialValue(prospect.player.potential)}</td>
                                    <td style={styles.td}>{prospect.perGame.ppg.toFixed(1)}</td>
                                    <td style={styles.td}>{prospect.perGame.rpg.toFixed(1)}</td>
                                    <td style={styles.td}>{prospect.perGame.apg.toFixed(1)}</td>
                                    <td style={styles.td}>{prospect.perGame.mpg.toFixed(1)}</td>
                                    <td style={styles.td}>{Math.round(prospect.score)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MockDraftView;
