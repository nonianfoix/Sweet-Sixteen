import React, { useState, useMemo } from 'react';
import type { GameState, TeamColors, Player } from '../types';
import { GameStatus } from '../types';
import { styles } from '../styles';
import Subheading from './Subheading';
import { formatPlayerHeight } from '../services/gameReducer';
import { formatPotentialValue } from '../services/gameUtils';
import * as constants from '../constants';

const { SCHOOL_COLORS } = constants;

interface OtherTeamsRosterViewProps {
    state: GameState;
    colors: TeamColors;
}

const OtherTeamsRosterView = ({ state, colors }: OtherTeamsRosterViewProps) => {
    const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
    const selectedTeam = selectedTeamName ? state.allTeams.find(team => team.name === selectedTeamName) : null;
    const selectedTeamColors = selectedTeam ? SCHOOL_COLORS[selectedTeam.name] || colors : colors;
    const rosterTeamOptions = useMemo(() => [...state.allTeams].sort((a, b) => a.name.localeCompare(b.name)), [state.allTeams]);

    const renderTrend = (player: Player) => {
        if (player.startOfSeasonOverall === undefined) return <span style={{ color: 'gray' }}>-</span>;
        const trend = player.overall - player.startOfSeasonOverall;
        if (trend > 0) return <span style={{ color: '#1a7f37' }}>▲ +{trend}</span>;
        if (trend < 0) return <span style={{ color: '#c52b2b' }}>▼ {trend}</span>;
        return <span style={{ color: 'gray' }}>—</span>;
    };

    return (
        <div style={{marginTop: '40px'}}>
            <Subheading color={colors.primary}>View Other Rosters</Subheading>
            <select onChange={(e) => setSelectedTeamName(e.target.value)} style={{...styles.select, marginBottom: '20px'}}>
                <option value="">Select a team</option>
                {rosterTeamOptions.map(team => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                ))}
            </select>
            {selectedTeam && (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{...styles.th, width: '30%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Name</th>
                                <th style={{...styles.th, width: '15%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Pos</th>
                                <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Ht</th>
                                <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Yr</th>
                                <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>OVR</th>
                                <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Trend</th>
                                <th style={{...styles.th, width: '10%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>Pot</th>
                                <th style={{...styles.th, width: '8%', backgroundColor: selectedTeamColors.primary, color: selectedTeamColors.text}}>MIN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedTeam.roster.slice().sort((a, b) => b.overall - a.overall).map((p, index) => {
                                const inSigningPeriod = state.status === GameStatus.SIGNING_PERIOD && (state.signingPeriodDay || 0) <= 7;
                                const displayYear = inSigningPeriod
                                    ? (p.year === 'Fr' ? 'So' : p.year === 'So' ? 'Jr' : p.year === 'Jr' ? 'Sr' : p.year)
                                    : p.year;
                                return (
                                    <tr key={p.id}>
                                        <td style={styles.td}>{index + 1}. {p.name}</td>
                                        <td style={styles.td}>{p.position}{p.secondaryPosition ? `/${p.secondaryPosition}` : ''}</td>
                                        <td style={styles.td}>{formatPlayerHeight(p.height)}</td>
                                        <td style={styles.td}>{displayYear}</td>
                                        <td style={styles.td}>{p.overall}</td>
                                        <td style={styles.td}>{renderTrend(p)}</td>
                                        <td style={styles.td}>{formatPotentialValue(p.potential)}</td>
                                        <td style={styles.td}>{p.rotationMinutes ?? 0}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OtherTeamsRosterView;
