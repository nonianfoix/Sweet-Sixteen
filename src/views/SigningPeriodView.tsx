import React, { useState } from 'react';
import RecruitingViewInner from './RecruitingView';
import Subheading from '../components/Subheading';
import { styles } from '../styles';
import { formatPlayerHeight, getTeamAbbreviation } from '../services/gameReducer';
import type { GameState, GameAction, TeamColors, DraftPick } from '../types';

const DraftResultsModal = ({ draftResults, userTeamName, onClose }: { draftResults: DraftPick[]; userTeamName: string; onClose: () => void }) => (
    <div style={styles.modalOverlay} onClick={onClose}>
        <div style={{ ...styles.modalContent, maxWidth: '950px', width: '95vw' }} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} style={styles.modalCloseButton}>X</button>
            <h3 style={{ ...styles.title, fontSize: '1.2rem', textShadow: '2px 2px 0px #808080', color: 'black', marginBottom: '15px' }}>
                NBA Draft Results
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div style={styles.tableContainer}>
                    <table style={{ ...styles.table, fontSize: '0.6rem' }}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, backgroundColor: '#ddd', color: '#000' }}>Pick</th>
                                <th style={{ ...styles.th, backgroundColor: '#ddd', color: '#000', width: '40%' }}>Player</th>
                                <th style={{ ...styles.th, backgroundColor: '#ddd', color: '#000' }}>POS</th>
                                <th style={{ ...styles.th, backgroundColor: '#ddd', color: '#000' }}>Ht</th>
                                <th style={{ ...styles.th, backgroundColor: '#ddd', color: '#000' }}>OVR</th>
                                <th style={{ ...styles.th, backgroundColor: '#ddd', color: '#000' }}>Slot Team</th>
                                <th style={{ ...styles.th, backgroundColor: '#ddd', color: '#000' }}>NBA Team</th>
                                <th style={{ ...styles.th, backgroundColor: '#ddd', color: '#000' }}>Origin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {draftResults.map(pick => {
                                const isUserPlayer = pick.originalTeam === userTeamName;
                                const rowStyle: React.CSSProperties = isUserPlayer ? { backgroundColor: '#FFFFAA' } : {};
                                const slotAcronym =
                                    pick.slotTeam && pick.slotTeam !== pick.nbaTeam
                                        ? getTeamAbbreviation(pick.slotTeam)
                                        : null;
                                return (
                                    <tr key={pick.pick} style={rowStyle}>
                                        <td style={styles.td}>{pick.pick}</td>
                                        <td style={styles.td}>{pick.player.name}</td>
                                        <td style={styles.td}>{pick.player.position}</td>
                                        <td style={styles.td}>{formatPlayerHeight(pick.player.height)}</td>
                                        <td style={styles.td}>{pick.player.overall}</td>
                                        <td style={styles.td}>{pick.slotTeam || pick.nbaTeam}</td>
                                        <td style={styles.td}>
                                            {pick.nbaTeam}
                                            {slotAcronym && (
                                                <span style={{ marginLeft: '4px', fontSize: '0.6rem', color: '#555' }}>
                                                    via {slotAcronym}
                                                </span>
                                            )}
                                        </td>
                                        <td style={styles.td}>{pick.originDescription}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
);

const SigningPeriodView = ({ state, dispatch, colors }: { state: GameState; dispatch: React.Dispatch<GameAction>; colors: TeamColors }) => {
    const [showDraft, setShowDraft] = useState(false);
    return (
        <div>
            {showDraft && state.userTeam && (
                <DraftResultsModal draftResults={state.draftResults} userTeamName={state.userTeam.name} onClose={() => setShowDraft(false)} />
            )}
            <Subheading color={colors.primary}>Post-Season Signing Period: Day {state.signingPeriodDay > 7 ? 7 : state.signingPeriodDay} / 7</Subheading>
            {state.tournament?.champion && <p style={{ fontWeight: 'bold', margin: '10px 0' }}>{state.tournament.champion} wins the National Championship!</p>}

            <button onClick={() => setShowDraft(true)} style={{ ...styles.button, margin: '15px 0' }}>View Draft Results</button>

            <RecruitingViewInner state={state} dispatch={dispatch} colors={colors} isSigningPeriod={true} />
        </div>
    );
};

export default SigningPeriodView;
