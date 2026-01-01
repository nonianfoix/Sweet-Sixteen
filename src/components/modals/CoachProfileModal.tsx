import React, { useMemo, useState } from 'react';
import type {
    TeamColors,
    TeamHistory,
    HeadCoachProfile,
    NBADraftHistoryEntry,
} from '../../types';
import { SCHOOL_COLORS, NBA_ACRONYM_TO_NAME } from '../../constants';
import { formatCurrency } from '../../services/gameService';
import Subheading from '../Subheading';
import { styles } from '../../styles';

interface CoachProfileModalProps {
    coach: HeadCoachProfile;
    teamName?: string;
    colors: TeamColors;
    historyEntries: (TeamHistory & { teamName: string })[];
    nbaDrafts: NBADraftHistoryEntry[];
    onClose: () => void;
}

const CoachProfileModal = ({ coach, teamName, colors, historyEntries, nbaDrafts, onClose }: CoachProfileModalProps) => {
    const modalColors = teamName ? (SCHOOL_COLORS[teamName] || colors) : colors;
    const formatSeasonLabel = (season: number) => `${2024 + season}-${(2025 + season) % 100}`;
    const earliestRecordedSeason = coach.careerStops && coach.careerStops.length
        ? coach.careerStops.reduce((min, entry) => Math.min(min, entry.startSeason), coach.startSeason)
        : coach.startSeason;
    const draftedEntries = useMemo(() => {
        const picks: { season: number; player: string; team: string; nbaTeam: string; round: number; pick: number }[] = [];
        
        historyEntries.forEach(history => {
            const draftYear = history.season;
            const draft = nbaDrafts.find(d => d.season === draftYear);
            if (draft) {
                draft.picks.forEach(pick => {
                    if (pick.originalTeam === history.teamName) {
                        picks.push({
                            season: draftYear,
                            player: pick.player.name,
                            team: history.teamName,
                            nbaTeam: pick.nbaTeam,
                            round: pick.round,
                            pick: pick.pick
                        });
                    }
                });
            }
        });

        return picks.sort((a, b) => b.season - a.season || a.pick - b.pick);
    }, [historyEntries, nbaDrafts]);
    const historySlice = historyEntries.slice(0, 8);
    const totalHistorySeasons = historyEntries.length;
    const averagePrestige = totalHistorySeasons
        ? (historyEntries.reduce((sum, entry) => sum + entry.prestige, 0) / totalHistorySeasons).toFixed(1)
        : null;
    const bestRank = historyEntries.reduce<number | null>((best, entry) => {
        if (typeof entry.rank === 'number' && entry.rank > 0) {
            return best === null ? entry.rank : Math.min(best, entry.rank);
        }
        return best;
    }, null);
    const bestRevenueSeason = historyEntries.reduce<(TeamHistory & { teamName: string }) | null>((bestEntry, entry) => {
        if (!bestEntry || entry.totalRevenue > bestEntry.totalRevenue) {
            return entry;
        }
        return bestEntry;
    }, null);

    const historyByTeam = useMemo(() => {
        const grouped = new Map<string, (TeamHistory & { teamName: string })[]>();
        historyEntries.forEach(entry => {
            const bucket = grouped.get(entry.teamName) || [];
            bucket.push(entry);
            grouped.set(entry.teamName, bucket);
        });
        return grouped;
    }, [historyEntries]);

    const stopSummaries = useMemo(() => {
        const stops = coach.careerStops?.length
            ? coach.careerStops
            : (teamName ? [{ teamName, startSeason: coach.startSeason }] : []);
        return stops.map(stop => {
            const entries = historyByTeam.get(stop.teamName) || [];
            const resolvedEnd = typeof stop.endSeason === 'number'
                ? stop.endSeason
                : entries.length
                    ? entries.reduce((max, entry) => Math.max(max, entry.season), stop.startSeason)
                    : (coach.retired && coach.lastTeam === stop.teamName && typeof coach.retiredSeason === 'number'
                        ? coach.retiredSeason
                        : null);
            const seasonsAtStop = resolvedEnd != null ? Math.max(1, resolvedEnd - stop.startSeason + 1) : null;
            const bestStopRank = entries.reduce<number | null>((bestRankValue, entry) => {
                if (typeof entry.rank === 'number' && entry.rank > 0) {
                    return bestRankValue === null ? entry.rank : Math.min(bestRankValue, entry.rank);
                }
                return bestRankValue;
            }, null);
            const avgStopPrestige = entries.length
                ? (entries.reduce((sum, entry) => sum + entry.prestige, 0) / entries.length).toFixed(1)
                : null;

            return {
                teamName: stop.teamName,
                displayRange: resolvedEnd != null
                    ? `${formatSeasonLabel(stop.startSeason)} - ${formatSeasonLabel(resolvedEnd)}`
                    : `${formatSeasonLabel(stop.startSeason)} - Present`,
                tenureLabel: seasonsAtStop ? `${seasonsAtStop} season${seasonsAtStop > 1 ? 's' : ''}` : 'In progress',
                bestRank: bestStopRank,
                avgPrestige: avgStopPrestige,
            };
        });
    }, [coach, teamName, historyByTeam]);

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{ ...styles.modalContent, maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{ ...styles.title, fontSize: '1.3rem', color: modalColors.primary, marginBottom: '10px' }}>
                    Coach {coach.name}
                </h3>
                <p style={{ fontSize: '0.75rem', marginBottom: '10px' }}>
                    {teamName ? `Current Team: ${teamName}` : coach.retired ? `Formerly: ${coach.lastTeam || 'Various Programs'}` : 'Independent'}
                </p>
                <div style={styles.coachModalGrid}>
                    <div style={styles.coachModalCard}>
                        <h4 style={{ margin: '0 0 8px', color: modalColors.primary }}>Profile</h4>
                        <ul style={styles.modalList}>
                            <li>Age: {coach.age}</li>
                            <li>Alma Mater: {coach.almaMater}</li>
                            <li>Style: {coach.style}</li>
                            <li>Career Record: {coach.careerWins}-{coach.careerLosses}</li>
                            <li>Current Season: {coach.seasonWins}-{coach.seasonLosses}</li>
                            {(coach.ncaaAppearances || coach.finalFours || coach.championships || coach.sweetSixteens) && (
                                <li>
                                    NCAA: {coach.ncaaAppearances ?? 0} apps · Sweet 16s {coach.sweetSixteens ?? 0} · Final Fours {coach.finalFours ?? 0} · Titles {coach.championships ?? 0}
                                </li>
                            )}
                            <li>Reputation: {coach.reputation}</li>
                            {coach.retired && <li>Retired: {coach.retiredSeason ? `${2024 + coach.retiredSeason}` : 'Yes'} ({coach.retiredReason || 'Age'})</li>}
                        </ul>
                    </div>
                    <div style={styles.coachModalCard}>
                        <h4 style={{ margin: '0 0 8px', color: modalColors.primary }}>Career Snapshot</h4>
                        <ul style={styles.modalList}>
                            <li>Stops coached: {stopSummaries.length || 1}</li>
                            <li>Seasons logged: {totalHistorySeasons || '--'}</li>
                            <li>Avg prestige: {averagePrestige ?? '--'}</li>
                            <li>Best rank: {bestRank ? `#${bestRank}` : '--'}</li>
                            <li>Draft picks: {coach.draftedPlayers?.length || 0}</li>
                            <li>Best revenue: {bestRevenueSeason ? `${bestRevenueSeason.teamName} ${formatSeasonLabel(bestRevenueSeason.season)} (${formatCurrency(bestRevenueSeason.totalRevenue)})` : '--'}</li>
                        </ul>
                    </div>
                </div>
                <Subheading color={modalColors.primary}>Coaching Journey</Subheading>
                {stopSummaries.length ? (
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Program</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Years</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Tenure</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Highlights</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stopSummaries.map(stop => {
                                    const highlights = [
                                        stop.bestRank ? `Best Rank #${stop.bestRank}` : '',
                                        stop.avgPrestige ? `Avg Prestige ${stop.avgPrestige}` : '',
                                    ].filter(Boolean).join(' | ') || 'No data logged';
                                    return (
                                        <tr key={`${coach.name}-${stop.teamName}-${stop.displayRange}`}>
                                            <td style={styles.td}>{stop.teamName}</td>
                                            <td style={styles.td}>{stop.displayRange}</td>
                                            <td style={styles.td}>{stop.tenureLabel}</td>
                                            <td style={styles.td}>{highlights}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>No prior coaching stops recorded.</p>
                )}
                <Subheading color={modalColors.primary}>Season Results ({historyEntries.length})</Subheading>
                {historySlice.length ? (
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.6rem', minWidth: '680px' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Season</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Team</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Prestige</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Rank</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Record</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Postseason</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historySlice.map(entry => (
                                    <tr key={`${entry.teamName}-${entry.season}`}>
                                        <td style={styles.td}>{formatSeasonLabel(entry.season)}</td>
                                        <td style={styles.td}>{entry.teamName}</td>
                                        <td style={styles.td}>{entry.prestige}</td>
                                        <td style={styles.td}>{typeof entry.rank === 'number' && entry.rank > 0 ? `#${entry.rank}` : '--'}</td>
                                        <td style={styles.td}>{typeof entry.wins === 'number' && typeof entry.losses === 'number' ? `${entry.wins}-${entry.losses}` : '--'}</td>
                                        <td style={styles.td}>{entry.postseasonResult || '--'}</td>
                                        <td style={styles.td}>{formatCurrency(entry.totalRevenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>No season records tracked for this coach yet.</p>
                )}
                <Subheading color={modalColors.primary}>Players Drafted by Coach ({draftedEntries.length})</Subheading>
                {draftedEntries.length ? (
                    <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Season</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Player</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>Team</th>
                                    <th style={{ ...styles.th, backgroundColor: modalColors.primary, color: modalColors.text }}>NBA Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draftedEntries.map((pick, idx) => (
                                    <tr key={`${coach.name}-${idx}-${pick.player}`}>
                                        <td style={styles.td}>{`${2024 + pick.season}`}</td>
                                        <td style={styles.td}>{pick.pick > 60 ? 'Undrafted' : `R${pick.round} #${pick.pick}`} - {pick.player}</td>
                                        <td style={styles.td}>{pick.team}</td>
                                        <td style={styles.td}>{NBA_ACRONYM_TO_NAME[pick.nbaTeam] || pick.nbaTeam}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.7rem' }}>No NBA draft picks yet.</p>
                )}
            </div>
        </div>
    );
};


export default CoachProfileModal;
