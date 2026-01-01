import React from 'react';
import type { Team, TeamColors, TeamHistory, DraftPick } from '../../types';
import Subheading from '../Subheading';
import { ACTIVE_NBA_PLAYERS_DATA, NBA_ACRONYM_TO_NAME } from '../../constants';
import { formatCurrency, describeEndowmentTier, describeDonationLevel, describeMomentum } from '../../services/utils';

interface SchoolHistoryModalProps {
    team: Team;
    colors: TeamColors;
    historyEntries: TeamHistory[];
    draftPicks: DraftPick[];
    championships: number;
    onClose: () => void;
}

const styles = {
    modalOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(5px)',
    },
    modalContent: {
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto' as const,
        position: 'relative' as const,
        padding: '25px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
    },
    modalCloseButton: {
        position: 'absolute' as const,
        top: '15px',
        right: '15px',
        background: 'none',
        border: 'none',
        color: '#64748b',
        fontSize: '1.2rem',
        cursor: 'pointer',
    },
    title: {
        fontFamily: "'Inter', sans-serif",
        fontWeight: 900,
        textTransform: 'uppercase' as const,
        letterSpacing: '-0.5px',
        margin: '0 0 15px 0',
    },
    coachModalGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
    },
    coachModalCard: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '15px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    modalList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontSize: '0.75rem',
        lineHeight: 1.6,
    },
    tableContainer: {
        overflowX: 'auto' as const,
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '0.7rem',
        backgroundColor: '#fff',
    },
    th: {
        padding: '8px 12px',
        textAlign: 'left' as const,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        fontSize: '0.65rem',
    },
    td: {
        padding: '8px 12px',
        borderBottom: '1px solid #e2e8f0',
        color: '#334155',
    },
};

const SchoolHistoryModal: React.FC<SchoolHistoryModalProps> = ({ team, colors, historyEntries, draftPicks, championships, onClose }) => {
    const coach = team.headCoach;
    const wealth = team.wealth;
    const historySlice = historyEntries.slice(0, 6);
    const formatSeasonLabel = (season: number) => `${2024 + season}-${(2025 + season) % 100}`;
    const wealthTierLabel = describeEndowmentTier(wealth.endowmentScore);
    const donationLabel = describeDonationLevel(wealth.donationLevel);
    const momentumLabel = describeMomentum(wealth.donorMomentum);

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{ ...styles.modalContent, maxWidth: '960px' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{ ...styles.title, fontSize: '1.4rem', color: colors.primary, marginBottom: '10px' }}>
                    {team.name} Program Snapshot
                </h3>
                <p style={{ fontSize: '0.75rem', marginBottom: '15px' }}>
                    Prestige {team.prestige} · Sponsor {team.sponsor?.name || 'Independent'} · Championships: {championships}
                </p>
                <div style={styles.coachModalGrid}>
                    <div style={styles.coachModalCard}>
                        <h4 style={{ margin: '0 0 8px', color: colors.primary }}>Head Coach</h4>
                        {coach ? (
                            <ul style={styles.modalList}>
                                <li><strong>{coach.name}</strong> · Age {coach.age} · {coach.almaMater}</li>
                                <li>Style: {coach.style}</li>
                                <li>Tenure: {coach.seasons} seasons</li>
                                <li>Career Record: {coach.careerWins}-{coach.careerLosses}</li>
                                <li>Current Season: {coach.seasonWins}-{coach.seasonLosses}</li>
                                <li>Reputation: {coach.reputation}</li>
                            </ul>
                        ) : (
                            <p style={{ fontSize: '0.7rem' }}>No head coach data available.</p>
                        )}
                    </div>
                    <div style={styles.coachModalCard}>
                        <h4 style={{ margin: '0 0 8px', color: colors.primary }}>Program Details</h4>
                        <ul style={styles.modalList}>
                            <li>Fan Interest: {team.fanInterest.toFixed(1)}</li>
                            <li>Current Record: {team.record.wins}-{team.record.losses}</li>
                            <li>Wealth Tier: {wealthTierLabel}</li>
                            <li>Donor Energy: {donationLabel} ({momentumLabel})</li>
                            <li>Booster Pool: {team.wealth.boosterPool} pts</li>
                        </ul>
                    </div>
                </div>
                <Subheading color={colors.primary}>Recent Seasons</Subheading>
                {historySlice.length ? (
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Season</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Prestige</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Rank</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historySlice.map(entry => (
                                    <tr key={`${team.name}-${entry.season}`}>
                                        <td style={styles.td}>{formatSeasonLabel(entry.season)}</td>
                                        <td style={styles.td}>{entry.prestige}</td>
                                        <td style={styles.td}>{entry.rank || '—'}</td>
                                        <td style={styles.td}>{formatCurrency(entry.totalRevenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem', marginBottom: '15px' }}>No historical records logged yet.</p>
                )}
                <Subheading color={colors.primary}>All-Time Program Draft Picks ({draftPicks.length})</Subheading>
                {ACTIVE_NBA_PLAYERS_DATA[team.name] && (
                    <p style={{ fontSize: '0.7rem', marginBottom: '10px', fontStyle: 'italic' }}>
                        Active NBA Players: {ACTIVE_NBA_PLAYERS_DATA[team.name].activeCount} · Total Annual Earnings: {formatCurrency(ACTIVE_NBA_PLAYERS_DATA[team.name].totalEarnings)}
                    </p>
                )}
                {draftPicks.length ? (
                    <div style={{ ...styles.tableContainer, maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Season</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Pick</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: colors.primary, color: colors.text }}>NBA Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draftPicks.map((pick, idx) => (
                                    <tr key={`${pick.player}-${pick.season}-${idx}`}>
                                        <td style={styles.td}>{formatSeasonLabel(pick.season)}</td>
                                        <td style={styles.td}>{pick.pick > 60 ? 'Undrafted' : `R${pick.round} #${pick.pick}`}</td>
                                        <td style={styles.td}>{pick.player}</td>
                                        <td style={styles.td}>{NBA_ACRONYM_TO_NAME[pick.nbaTeam] || pick.nbaTeam}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>No players drafted yet.</p>
                )}
            </div>
        </div>
    );
};

export default SchoolHistoryModal;
