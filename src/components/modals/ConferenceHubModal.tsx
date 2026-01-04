import React, { useMemo, useState, useEffect } from 'react';
import type {
    GameState,
    Team,
    Player,
} from '../../types';
import { getSchoolLogoUrl, schoolNameToSlug } from '../../services/utils';
import { getConferenceLogoUrl } from '../../services/logoUtils';
import { calculateOverall } from '../../services/gameService';
import { styles } from '../../styles';

const ConferenceHubModal = ({
    state,
    conferenceLabel,
    conferenceLogoUrl,
    onClose,
    onOpenStandings,
}: {
    state: GameState;
    conferenceLabel: string;
    conferenceLogoUrl?: string;
    onClose: () => void;
    onOpenStandings: () => void;
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'standings' | 'leaders' | 'recruits'>('overview');
    const [selectedConference, setSelectedConference] = useState(conferenceLabel);

    useEffect(() => {
        setSelectedConference(conferenceLabel);
    }, [conferenceLabel]);

    const availableConferences = useMemo(() => {
        return [...new Set(state.allTeams.map(t => t.conference).filter(Boolean))].sort((a, b) =>
            a.localeCompare(b)
        );
    }, [state.allTeams]);

    const conferenceLabelActive = selectedConference || conferenceLabel;
    const conferenceLogoUrlActive = getConferenceLogoUrl(conferenceLabelActive) ?? conferenceLogoUrl;

    const conferenceTeams = useMemo(() => {
        return [...state.allTeams]
            .filter(t => t.conference === conferenceLabelActive)
            .sort((a, b) => {
                if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
                if (a.record.losses !== b.record.losses) return a.record.losses - b.record.losses;
                return b.prestige - a.prestige;
            });
    }, [state.allTeams, conferenceLabelActive]);

    const userTeamConferenceRank = useMemo(() => {
        if (!state.userTeam) return null;
        if (state.userTeam.conference !== conferenceLabelActive) return null;
        const idx = conferenceTeams.findIndex(t => t.name === state.userTeam!.name);
        return idx >= 0 ? idx + 1 : null;
    }, [state.userTeam, conferenceTeams, conferenceLabelActive]);

    const conferenceSummary = useMemo(() => {
        if (!conferenceTeams.length) return null;
        const totalWins = conferenceTeams.reduce((s, t) => s + (t.record?.wins || 0), 0);
        const totalLosses = conferenceTeams.reduce((s, t) => s + (t.record?.losses || 0), 0);
        const avgPrestige =
            conferenceTeams.reduce((s, t) => s + (typeof t.prestige === 'number' ? t.prestige : 0), 0) / conferenceTeams.length;
        const leader = conferenceTeams[0];
        return {
            teamCount: conferenceTeams.length,
            totalWins,
            totalLosses,
            avgPrestige: Math.round(avgPrestige),
            leaderTeam: leader?.name,
        };
    }, [conferenceTeams]);

    const topConferencePlayers = useMemo(() => {
        return conferenceTeams
            .flatMap(team => team.roster.map(player => ({ player, teamName: team.name })))
            .sort((a, b) => (b.player.overall || 0) - (a.player.overall || 0))
            .slice(0, 12);
    }, [conferenceTeams]);

    const playerLeaders = useMemo(() => {
        const players = conferenceTeams.flatMap(team => team.roster.map(player => ({ player, teamName: team.name })));
        const perGame = (value: number, games: number) => (games > 0 ? value / games : 0);

        const scored = [...players]
            .sort(
                (a, b) =>
                    perGame(b.player.seasonStats?.points || 0, b.player.seasonStats?.gamesPlayed || 0) -
                    perGame(a.player.seasonStats?.points || 0, a.player.seasonStats?.gamesPlayed || 0)
            )
            .slice(0, 10);
        const reb = [...players]
            .sort(
                (a, b) =>
                    perGame(b.player.seasonStats?.rebounds || 0, b.player.seasonStats?.gamesPlayed || 0) -
                    perGame(a.player.seasonStats?.rebounds || 0, a.player.seasonStats?.gamesPlayed || 0)
            )
            .slice(0, 10);
        const ast = [...players]
            .sort(
                (a, b) =>
                    perGame(b.player.seasonStats?.assists || 0, b.player.seasonStats?.gamesPlayed || 0) -
                    perGame(a.player.seasonStats?.assists || 0, a.player.seasonStats?.gamesPlayed || 0)
            )
            .slice(0, 10);
        const ovr = [...players].sort((a, b) => (b.player.overall || 0) - (a.player.overall || 0)).slice(0, 10);

        return { scored, reb, ast, ovr, perGame };
    }, [conferenceTeams]);

    const conferenceCommits = useMemo(() => {
        const conferenceTeamNames = new Set(conferenceTeams.map(t => t.name));
        return state.recruits
            .filter(r => r.verbalCommitment && conferenceTeamNames.has(r.verbalCommitment))
            .sort((a, b) => {
                if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
                const aRank = a.nationalRank ?? 9999;
                const bRank = b.nationalRank ?? 9999;
                if (aRank !== bRank) return aRank - bRank;
                return (b.overall || 0) - (a.overall || 0);
            })
            .slice(0, 10);
    }, [state.recruits, conferenceTeams]);

    const topAvailableRecruits = useMemo(() => {
        return [...state.recruits]
            .filter(r => !r.verbalCommitment)
            .sort((a, b) => {
                if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
                const aRank = a.nationalRank ?? 9999;
                const bRank = b.nationalRank ?? 9999;
                if (aRank !== bRank) return aRank - bRank;
                return (b.interest || 0) - (a.interest || 0);
            })
            .slice(0, 12);
    }, [state.recruits]);

    const topRecruitsNational = useMemo(() => {
        return [...state.recruits]
            .sort((a, b) => {
                if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
                const aRank = a.nationalRank ?? 9999;
                const bRank = b.nationalRank ?? 9999;
                if (aRank !== bRank) return aRank - bRank;
                return (b.interest || 0) - (a.interest || 0);
            })
            .slice(0, 10);
    }, [state.recruits]);

    return (
        <div style={styles.conferenceHubOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={`${conferenceLabelActive} hub`}>
            <div style={styles.conferenceHubModalContent} onClick={e => e.stopPropagation()}>
                <button style={styles.conferenceHubCloseButton} onClick={onClose} aria-label="Close">X</button>

                <div style={styles.conferenceHubHeader}>
                    {conferenceLogoUrlActive ? (
                        <img src={conferenceLogoUrlActive} alt={conferenceLabelActive} style={styles.conferenceHubLogo} />
                    ) : null}
                    <div style={styles.conferenceHubHeaderText}>
                        <div style={styles.conferenceHubTitle}>{conferenceLabelActive}</div>
                        <div style={styles.conferenceHubSubtitle}>Conference Hub</div>
                        {conferenceSummary ? (
                            <div style={styles.conferenceHubHeaderStatsRow}>
                                <span style={{ ...styles.conferenceHubStatPill, ...styles.conferenceHubStatPillDark }}>
                                    <span style={styles.conferenceHubStatLabel}>Teams</span>
                                    <span style={styles.conferenceHubStatValue}>{conferenceSummary.teamCount}</span>
                                </span>
                                <span style={{ ...styles.conferenceHubStatPill, ...styles.conferenceHubStatPillBlue }}>
                                    <span style={styles.conferenceHubStatLabel}>Combined</span>
                                    <span style={styles.conferenceHubStatValue}>{conferenceSummary.totalWins}-{conferenceSummary.totalLosses}</span>
                                </span>
                                <span style={{ ...styles.conferenceHubStatPill, ...styles.conferenceHubStatPillGreen }}>
                                    <span style={styles.conferenceHubStatLabel}>Avg Pres</span>
                                    <span style={styles.conferenceHubStatValue}>{conferenceSummary.avgPrestige}</span>
                                </span>
                                <span style={{ ...styles.conferenceHubStatPill, ...styles.conferenceHubStatPillAmber }}>
                                    <span style={styles.conferenceHubStatLabel}>Leader</span>
                                    <span style={{ ...styles.conferenceHubStatValue, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conferenceSummary.leaderTeam}</span>
                                </span>
                                <span style={{ ...styles.conferenceHubStatPill, ...styles.conferenceHubStatPillPurple }}>
                                    <span style={styles.conferenceHubStatLabel}>Your Rank</span>
                                    <span style={styles.conferenceHubStatValue}>{userTeamConferenceRank ?? '-'}</span>
                                </span>
                            </div>
                        ) : null}
                    </div>
                    <div style={styles.conferenceHubHeaderActions}>
                        <label style={styles.conferenceHubSelectLabel}>
                            View
                            <select
                                value={conferenceLabelActive}
                                onChange={e => setSelectedConference(e.target.value)}
                                style={styles.conferenceHubSelect}
                                aria-label="Select conference"
                            >
                                {availableConferences.map(c => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button style={styles.conferenceHubActionButton} onClick={onOpenStandings}>Standings</button>
                    </div>
                </div>

                <div style={styles.conferenceHubTabs} role="tablist" aria-label="Conference hub tabs">
                    {([
                        ['overview', 'Overview'],
                        ['standings', 'Standings'],
                        ['leaders', 'Leaders'],
                        ['recruits', 'Recruits'],
                    ] as const).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === key}
                            onClick={() => setActiveTab(key)}
                            style={{
                                ...styles.conferenceHubTabButton,
                                ...(activeTab === key ? styles.conferenceHubTabButtonActive : null),
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div style={styles.conferenceHubBody}>
                    {activeTab === 'overview' && (
                        <div style={styles.conferenceHubGrid}>
                    <section style={styles.conferenceHubPanel}>
                        <div style={{ ...styles.conferenceHubPanelTitle, background: '#1e40af' }}>Conference Snapshot</div>
                        {conferenceSummary ? (
                            <div style={styles.conferenceHubCardGrid}>
                                <div style={styles.conferenceHubCard}>
                                    <div style={styles.conferenceHubCardLabel}>Teams</div>
                                    <div style={styles.conferenceHubCardValue}>{conferenceSummary.teamCount}</div>
                                </div>
                                <div style={styles.conferenceHubCard}>
                                    <div style={styles.conferenceHubCardLabel}>Combined</div>
                                    <div style={styles.conferenceHubCardValue}>
                                        {conferenceSummary.totalWins}-{conferenceSummary.totalLosses}
                                    </div>
                                </div>
                                <div style={styles.conferenceHubCard}>
                                    <div style={styles.conferenceHubCardLabel}>Avg Prestige</div>
                                    <div style={styles.conferenceHubCardValue}>{conferenceSummary.avgPrestige}</div>
                                </div>
                                <div style={styles.conferenceHubCard}>
                                    <div style={styles.conferenceHubCardLabel}>Leader</div>
                                    <div style={styles.conferenceHubCardValueSmall}>{conferenceSummary.leaderTeam}</div>
                                </div>
                                <div style={styles.conferenceHubCard}>
                                    <div style={styles.conferenceHubCardLabel}>Your Rank</div>
                                    <div style={styles.conferenceHubCardValue}>{userTeamConferenceRank ?? '-'}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.conferenceHubEmpty}>No teams found for this conference.</div>
                        )}

                        <div style={{ ...styles.conferenceHubPanelSubTitle, marginTop: '10px' }}>Standings</div>
                        <div style={styles.conferenceHubTableScroll}>
                            <div style={{ ...styles.conferenceHubRow, ...styles.conferenceHubHeaderRow }}>
                                <div style={{ flex: 2 }}>Team</div>
                                <div style={{ flex: 1, textAlign: 'right' }}>W</div>
                                <div style={{ flex: 1, textAlign: 'right' }}>L</div>
                            </div>
                            {conferenceTeams.map((t, idx) => (
                                <div
                                    key={`${t.name}-ov-${idx}`}
                                    style={{
                                        ...styles.conferenceHubRow,
                                        backgroundColor: idx % 2 === 0 ? '#E0E0E0' : '#F2F2F2',
                                        ...(state.userTeam?.name === t.name ? styles.conferenceHubRowHighlight : null),
                                    }}
                                >
                                    <div style={{ flex: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {idx + 1}. {t.name}
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'right' }}>{t.record.wins}</div>
                                    <div style={{ flex: 1, textAlign: 'right' }}>{t.record.losses}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section style={styles.conferenceHubPanel}>
                        <div style={{ ...styles.conferenceHubPanelTitle, background: '#059669' }}>Top Players</div>
                        <div style={styles.conferenceHubList}>
                            {topConferencePlayers.map(({ player, teamName }) => (
                                <div key={`${player.id}-${teamName}`} style={styles.conferenceHubListItem}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {player.name} <span style={{ opacity: 0.75 }}>{player.position}</span>
                                        </div>
                                        <div style={{ whiteSpace: 'nowrap' }}>
                                            <span style={styles.conferenceHubPill}>OVR {player.overall}</span>
                                        </div>
                                    </div>
                                    <div style={styles.conferenceHubMeta}>{teamName}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section style={styles.conferenceHubPanel}>
                        <div style={{ ...styles.conferenceHubPanelTitle, background: '#7c3aed' }}>Top Recruits</div>
                        <div style={styles.conferenceHubPanelSubTitle}>Committed to conference</div>
                        <div style={styles.conferenceHubList}>
                            {conferenceCommits.length ? (
                                conferenceCommits.map(r => (
                                    <div key={r.id} style={styles.conferenceHubListItem}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r.name} <span style={{ opacity: 0.75 }}>{r.position}</span>
                                            </div>
                                            <div style={{ whiteSpace: 'nowrap' }}>
                                                <span style={styles.conferenceHubPill}>{'★'.repeat(Math.max(0, r.stars || 0))}</span>
                                                {typeof r.nationalRank === 'number' ? <span style={styles.conferenceHubPill}>#{r.nationalRank}</span> : null}
                                            </div>
                                        </div>
                                        <div style={styles.conferenceHubMeta}>{r.verbalCommitment}</div>
                                    </div>
                                ))
                            ) : (
                                <div style={styles.conferenceHubEmpty}>No commits yet.</div>
                            )}
                        </div>

                        <div style={{ ...styles.conferenceHubPanelSubTitle, marginTop: '10px' }}>National board</div>
                        <div style={styles.conferenceHubList}>
                            {topRecruitsNational.map(r => (
                                <div key={`${r.id}-nat`} style={styles.conferenceHubListItem}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.name} <span style={{ opacity: 0.75 }}>{r.position}</span>
                                        </div>
                                        <div style={{ whiteSpace: 'nowrap' }}>
                                            <span style={styles.conferenceHubPill}>{'★'.repeat(Math.max(0, r.stars || 0))}</span>
                                            {typeof r.nationalRank === 'number' ? <span style={styles.conferenceHubPill}>#{r.nationalRank}</span> : null}
                                        </div>
                                    </div>
                                    <div style={styles.conferenceHubMeta}>
                                        {r.hometownCity && r.hometownState ? `${r.hometownCity}, ${r.hometownState}` : r.highSchoolName || ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                        </div>
                    )}

                    {activeTab === 'standings' && (
                        <section style={styles.conferenceHubPanel}>
                            <div style={{ ...styles.conferenceHubPanelTitle, background: '#0369a1' }}>Standings</div>
                            <div style={styles.conferenceStandingsHeader}>
                                <div style={{ flex: 1 }}>Team</div>
                                <div style={{ width: '70px', textAlign: 'right' }}>W</div>
                                <div style={{ width: '70px', textAlign: 'right' }}>L</div>
                                <div style={{ width: '90px', textAlign: 'right' }}>Prestige</div>
                            </div>
                            <div style={styles.conferenceStandingsScroll}>
                                {conferenceTeams.map((t, idx) => {
                                    const isUser = state.userTeam?.name === t.name;
                                    const isLeader = idx === 0;
                                    const teamLogoUrl = `school logos/${schoolNameToSlug(t.name)}`;
                                    return (
                                        <div
                                            key={`${t.name}-${idx}`}
                                            style={{
                                                ...styles.conferenceStandingsRow,
                                                ...(isUser ? styles.conferenceStandingsRowUser : null),
                                                ...(isLeader ? styles.conferenceStandingsRowLeader : null),
                                            }}
                                        >
                                            <div style={styles.conferenceStandingsTeamCell}>
                                                <div style={styles.conferenceStandingsRank}>{idx + 1}.</div>
                                                <img
                                                    src={teamLogoUrl}
                                                    alt={`${t.name} logo`}
                                                    style={styles.conferenceStandingsTeamLogo}
                                                />
                                                <div style={styles.conferenceStandingsTeamName}>{t.name}</div>
                                            </div>
                                            <div style={styles.conferenceStandingsStatCell}>{t.record.wins}</div>
                                            <div style={styles.conferenceStandingsStatCell}>{t.record.losses}</div>
                                            <div style={{ ...styles.conferenceStandingsStatCell, width: '90px' }}>{t.prestige}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {activeTab === 'leaders' && (
                        <div style={styles.conferenceHubGridAuto}>
                            <section style={styles.conferenceHubPanel}>
                                <div style={{ ...styles.conferenceHubPanelTitle, background: '#ea580c' }}>Scoring Leaders</div>
                                <div style={styles.conferenceHubPanelSubTitle}>PPG</div>
                                <div style={styles.conferenceHubList}>
                                    {playerLeaders.scored.map(({ player, teamName }, idx) => (
                                        <div key={`${player.id}-ppg`} style={styles.conferenceHubListItem}>
                                            <div style={styles.conferenceHubListItemRow}>
                                                <div style={styles.conferenceHubListItemName}>
                                                    {idx + 1}. {player.name} <span style={{ opacity: 0.75 }}>{player.position}</span>
                                                </div>
                                                <div style={styles.conferenceHubListItemValue}>
                                                    <span style={styles.conferenceHubPill}>
                                                        {playerLeaders
                                                            .perGame(player.seasonStats?.points || 0, player.seasonStats?.gamesPlayed || 0)
                                                            .toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={styles.conferenceHubMeta}>{teamName}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section style={styles.conferenceHubPanel}>
                                <div style={{ ...styles.conferenceHubPanelTitle, background: '#0d9488' }}>Assist Leaders</div>
                                <div style={styles.conferenceHubPanelSubTitle}>APG</div>
                                <div style={styles.conferenceHubList}>
                                    {playerLeaders.ast.map(({ player, teamName }, idx) => (
                                        <div key={`${player.id}-apg`} style={styles.conferenceHubListItem}>
                                            <div style={styles.conferenceHubListItemRow}>
                                                <div style={styles.conferenceHubListItemName}>
                                                    {idx + 1}. {player.name} <span style={{ opacity: 0.75 }}>{player.position}</span>
                                                </div>
                                                <div style={styles.conferenceHubListItemValue}>
                                                    <span style={styles.conferenceHubPill}>
                                                        {playerLeaders
                                                            .perGame(player.seasonStats?.assists || 0, player.seasonStats?.gamesPlayed || 0)
                                                            .toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={styles.conferenceHubMeta}>{teamName}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section style={styles.conferenceHubPanel}>
                                <div style={{ ...styles.conferenceHubPanelTitle, background: '#4f46e5' }}>Rebound Leaders</div>
                                <div style={styles.conferenceHubPanelSubTitle}>RPG</div>
                                <div style={styles.conferenceHubList}>
                                    {playerLeaders.reb.map(({ player, teamName }, idx) => (
                                        <div key={`${player.id}-rpg`} style={styles.conferenceHubListItem}>
                                            <div style={styles.conferenceHubListItemRow}>
                                                <div style={styles.conferenceHubListItemName}>
                                                    {idx + 1}. {player.name} <span style={{ opacity: 0.75 }}>{player.position}</span>
                                                </div>
                                                <div style={styles.conferenceHubListItemValue}>
                                                    <span style={styles.conferenceHubPill}>
                                                        {playerLeaders
                                                            .perGame(player.seasonStats?.rebounds || 0, player.seasonStats?.gamesPlayed || 0)
                                                            .toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={styles.conferenceHubMeta}>{teamName}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section style={styles.conferenceHubPanel}>
                                <div style={{ ...styles.conferenceHubPanelTitle, background: '#16a34a' }}>Top Overall</div>
                                <div style={styles.conferenceHubPanelSubTitle}>OVR</div>
                                <div style={styles.conferenceHubList}>
                                    {playerLeaders.ovr.map(({ player, teamName }, idx) => (
                                        <div key={`${player.id}-ovr`} style={styles.conferenceHubListItem}>
                                            <div style={styles.conferenceHubListItemRow}>
                                                <div style={styles.conferenceHubListItemName}>
                                                    {idx + 1}. {player.name} <span style={{ opacity: 0.75 }}>{player.position}</span>
                                                </div>
                                                <div style={styles.conferenceHubListItemValue}>
                                                    <span style={styles.conferenceHubPill}>OVR {player.overall}</span>
                                                </div>
                                            </div>
                                            <div style={styles.conferenceHubMeta}>{teamName}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'recruits' && (
                        <div style={styles.conferenceHubGridAuto}>
                            <section style={styles.conferenceHubPanel}>
                                <div style={{ ...styles.conferenceHubPanelTitle, background: '#dc2626' }}>Conference Commits</div>
                                <div style={styles.conferenceHubPanelSubTitle}>Committed to conference</div>
                                <div style={styles.conferenceHubList}>
                                    {conferenceCommits.length ? (
                                        conferenceCommits.map(r => (
                                            <div key={r.id} style={styles.conferenceHubListItem}>
                                                <div style={styles.conferenceHubListItemRow}>
                                                    <div style={styles.conferenceHubListItemName}>
                                                        {r.name} <span style={{ opacity: 0.75 }}>{r.position}</span>
                                                    </div>
                                                    <div style={styles.conferenceHubListItemValue}>
                                                        <span style={styles.conferenceHubPill}>{'★'.repeat(Math.max(0, r.stars || 0))}</span>
                                                        {typeof r.nationalRank === 'number' ? <span style={styles.conferenceHubPill}>#{r.nationalRank}</span> : null}
                                                    </div>
                                                </div>
                                                <div style={styles.conferenceHubMeta}>{r.verbalCommitment}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={styles.conferenceHubEmpty}>No commits yet.</div>
                                    )}
                                </div>
                            </section>

                            <section style={styles.conferenceHubPanel}>
                                <div style={{ ...styles.conferenceHubPanelTitle, background: '#0284c7' }}>Top Available</div>
                                <div style={styles.conferenceHubPanelSubTitle}>Uncommitted</div>
                                <div style={styles.conferenceHubList}>
                                    {topAvailableRecruits.map(r => (
                                        <div key={`${r.id}-avail`} style={styles.conferenceHubListItem}>
                                            <div style={styles.conferenceHubListItemRow}>
                                                <div style={styles.conferenceHubListItemName}>
                                                    {r.name} <span style={{ opacity: 0.75 }}>{r.position}</span>
                                                </div>
                                                <div style={styles.conferenceHubListItemValue}>
                                                    <span style={styles.conferenceHubPill}>{'★'.repeat(Math.max(0, r.stars || 0))}</span>
                                                    {typeof r.nationalRank === 'number' ? <span style={styles.conferenceHubPill}>#{r.nationalRank}</span> : null}
                                                </div>
                                            </div>
                                            <div style={styles.conferenceHubMeta}>
                                                {r.hometownCity && r.hometownState ? `${r.hometownCity}, ${r.hometownState}` : r.highSchoolName || ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default ConferenceHubModal;
