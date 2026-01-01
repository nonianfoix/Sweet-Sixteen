import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { GameState, GameAction, TeamColors, NilNegotiationCandidate } from '../types';
import { GameStatus } from '../types';
import Subheading from '../components/Subheading';
import { buildNilNegotiationCandidates } from '../services/nilService';
import { formatCurrency } from '../services/gameService';
import { isSeniorAcademicYear, isJuniorAcademicYear, formatPotentialValue } from '../services/gameUtils';

const styles = {
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
        whiteSpace: 'pre-wrap',
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
    healthCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '6px',
        padding: '10px',
        backgroundColor: '#f8f8f8',
        fontSize: '0.65rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    nilInfoBanner: {
        backgroundColor: '#fff7e6',
        border: '1px solid #ffcc80',
        borderRadius: '4px',
        padding: '8px 10px',
        fontSize: '0.6rem',
        marginBottom: '12px',
        color: '#6d4c41',
    },
    nilBudgetMeta: {
        fontSize: '0.55rem',
        color: '#555',
        margin: '4px 0',
    },
    nilBudgetMeterTrack: {
        width: '100%',
        height: '6px',
        backgroundColor: '#e0e0e0',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    nilBudgetMeterFill: {
        height: '100%',
        borderRadius: '999px',
        backgroundColor: '#1b5e20',
        transition: 'width 0.3s ease',
    },
    nilStatusPill: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 8px',
        borderRadius: '999px',
        fontSize: '0.55rem',
        fontWeight: 'bold',
    },
    nilInsightText: {
        fontSize: '0.5rem',
        margin: '4px 0 0 0',
        color: '#555',
    },
    nilTermHelper: {
        fontSize: '0.5rem',
        marginTop: '4px',
        color: '#8d6e63',
    },
    nilOutlookBarTrack: {
        width: '100%',
        height: '6px',
        backgroundColor: '#e0e0e0',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    nilOutlookBarFill: {
        height: '100%',
        borderRadius: '999px',
        backgroundColor: '#1b5e20',
        transition: 'width 0.3s ease',
    },
    nilHistoryPanel: {
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        backgroundColor: '#fdf7ff',
        padding: '10px',
        maxHeight: '180px',
        overflowY: 'auto',
    },
    nilHistoryList: {
        listStyle: 'none',
        paddingLeft: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '6px',
        fontSize: '0.6rem',
    },
    nilHistoryItem: {
        borderLeft: '3px solid #9c27b0',
        paddingLeft: '8px',
        color: '#4a148c',
    },
};

const NilNegotiationView = ({ state, dispatch, colors }: { state: GameState; dispatch: React.Dispatch<GameAction>; colors: TeamColors }) => {
    const userTeam = state.userTeam;
    const [offerInputs, setOfferInputs] = useState<Record<string, { amount: number; years: number }>>({});
    const fanMoraleBaseline = userTeam ? (userTeam.fanMorale ?? userTeam.fanInterest ?? 50) : 50;

    useEffect(() => {
        if (!userTeam) return;
        
        // Safety Check: Detect corrupted data (NaN)
        const hasCorruption = state.nilNegotiationCandidates.some(c => 
            Number.isNaN(c.expectedNilValue) || Number.isNaN(c.minimumAsk) || c.minimumAsk === undefined
        );

        if (state.nilNegotiationCandidates.length > 0 && !hasCorruption) return;
        
        const seededCandidates = buildNilNegotiationCandidates(userTeam, {
            fanSentiment: fanMoraleBaseline,
            unfinishedBusinessBonus: 0,
        });
        
        if (seededCandidates.length > 0 || hasCorruption) {
             dispatch({ type: 'SEED_NIL_CANDIDATES', payload: { candidates: seededCandidates } });
        }
    }, [dispatch, fanMoraleBaseline, state.nilNegotiationCandidates, userTeam]);

    if (!userTeam) return <div style={{ fontSize: '0.8rem' }}>Select a team to manage NIL decisions.</div>;
    const remainingBudget = Math.max(0, (userTeam.nilBudget ?? 0) - (userTeam.nilBudgetUsed ?? 0));
    const totalBudget = userTeam.nilBudget ?? 0;
    const nilSpent = Math.max(0, totalBudget - remainingBudget);
    const nilUsagePercent = totalBudget > 0 ? Math.round((nilSpent / totalBudget) * 100) : 0;
    const nilUsageColor = nilUsagePercent < 65 ? '#1b5e20' : nilUsagePercent < 90 ? '#ef6c00' : '#b71c1c';
    const nilCycleOpen = state.status === GameStatus.NIL_NEGOTIATION;
    const hasLiveNegotiations = state.nilNegotiationCandidates.length > 0;
    const canFinalize = nilCycleOpen && hasLiveNegotiations;
    const candidateList = useMemo(() => {
        if (hasLiveNegotiations) return state.nilNegotiationCandidates;
        return buildNilNegotiationCandidates(userTeam, {
            fanSentiment: fanMoraleBaseline,
            unfinishedBusinessBonus: 0,
        });
    }, [fanMoraleBaseline, hasLiveNegotiations, state.nilNegotiationCandidates, userTeam]);
    const eligibleCandidates = useMemo(
        () => candidateList.filter(candidate => !isSeniorAcademicYear(candidate.year)),
        [candidateList]
    );
    const canMakeOffers = hasLiveNegotiations || eligibleCandidates.length > 0;

    const getDefaultOfferInput = useCallback(
        (candidate: NilNegotiationCandidate) => ({
            amount: candidate.minimumAsk,
            years: isJuniorAcademicYear(candidate.year) ? 1 : candidate.prefersMultiYear ? 2 : 1,
        }),
        []
    );

    const handleInputChange = (candidate: NilNegotiationCandidate, key: 'amount' | 'years', rawValue: number) => {
        const numericValue = Number.isNaN(rawValue) ? 0 : rawValue;
        setOfferInputs(prev => {
            const existing = prev[candidate.playerId] || getDefaultOfferInput(candidate);
            const next = { ...existing };
            if (key === 'amount') {
                next.amount = Math.max(0, numericValue);
            } else {
                next.years = isJuniorAcademicYear(candidate.year)
                    ? 1
                    : Math.max(1, Math.min(2, Math.round(numericValue)));
            }
            return { ...prev, [candidate.playerId]: next };
        });
    };

    const handleOffer = (candidate: NilNegotiationCandidate) => {
        if (isSeniorAcademicYear(candidate.year)) {
            dispatch({ type: 'SET_TOAST', payload: 'Seniors have exhausted their eligibility and cannot be retained.' });
            return;
        }
        const input = offerInputs[candidate.playerId] || getDefaultOfferInput(candidate);
        dispatch({
            type: 'MAKE_NIL_OFFER',
            payload: {
                playerId: candidate.playerId,
                amount: Math.round(Math.max(0, input.amount)),
                years: isJuniorAcademicYear(candidate.year) ? 1 : Math.max(1, Math.min(2, Math.round(input.years))),
            },
        });
    };

    const finalizeNegotiations = () => {
        if (!nilCycleOpen) {
            dispatch({ type: 'SET_TOAST', payload: 'The NIL hub becomes actionable once the offseason begins.' });
            return;
        }
        dispatch({ type: 'FINALIZE_NIL_NEGOTIATIONS' });
        dispatch({ type: 'EVALUATE_OFFSEASON' });
    };

    return (
        <div>
            <Subheading color={colors.primary}>NIL Retention Hub</Subheading>
            <p style={{ fontSize: '0.7rem', marginBottom: '10px' }}>
                Allocate Name/Image/Likeness resources to keep impact players from bolting early. Elite sponsors may subsidize certain archetypes.
            </p>
            <div style={styles.nilInfoBanner}>
                Underclassmen only appear here, and juniors can only recommit for a single season.
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px' }}>
                <div style={styles.healthCard}>
                    <strong>Total NIL Budget</strong>
                    <span style={{ fontSize: '0.9rem' }}>{formatCurrency(totalBudget)}</span>
                </div>
                <div style={styles.healthCard}>
                    <strong>Remaining Budget</strong>
                    <span style={{ fontSize: '0.9rem' }}>{formatCurrency(remainingBudget)}</span>
                    <p style={styles.nilBudgetMeta}>{nilUsagePercent}% spent ({formatCurrency(nilSpent)} used)</p>
                    <div style={styles.nilBudgetMeterTrack}>
                        <div
                            style={{
                                ...styles.nilBudgetMeterFill,
                                width: Math.min(100, nilUsagePercent) + '%',
                                backgroundColor: nilUsageColor,
                            }}
                        />
                    </div>
                </div>
                <div style={styles.healthCard}>
                    <strong>Sponsor Boost</strong>
                    <span style={{ fontSize: '0.9rem' }}>{formatCurrency(userTeam.nilBoostFromSponsor || 0)}</span>
                    <p style={styles.nilBudgetMeta}>Automatically applied to matching archetypes.</p>
                </div>
            </div>
            <div style={styles.tableContainer}>
                <table style={{ ...styles.table, fontSize: '0.65rem', minWidth: '1050px' }}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Player</th>
                            <th style={styles.th}>OVR</th>
                            <th style={styles.th}>Potential</th>
                            <th style={styles.th}>Draft Outlook</th>
                            <th style={styles.th}>Expectation</th>
                            <th style={styles.th}>Min Ask</th>
                            <th style={styles.th}>Sponsor Offset</th>
                            <th style={styles.th}>Budget Hit</th>
                            <th style={styles.th}>Offer (USD)</th>
                            <th style={styles.th}>Term</th>
                            <th style={styles.th}>Outlook</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eligibleCandidates.length === 0 && (
                            <tr>
                                <td style={styles.td} colSpan={13}>No eligible players for NIL retention this offseason.</td>
                            </tr>
                        )}
                        {eligibleCandidates.map(candidate => {
                            const input = offerInputs[candidate.playerId] || getDefaultOfferInput(candidate);
                            const normalizedOffer = Math.max(0, Math.round(input.amount));
                            const netOffer = normalizedOffer + (candidate.sponsorSubsidy || 0);
                            const shortfall = Math.max(0, candidate.minimumAsk - netOffer);
                            const budgetHit = Math.max(0, normalizedOffer - (candidate.sponsorSubsidy || 0));
                            const budgetColor = budgetHit > remainingBudget ? '#b71c1c' : budgetHit > Math.max(1, remainingBudget) * 0.5 ? '#ef6c00' : '#1b5e20';
                            const outlookFill = Math.max(0, Math.min(100, Math.round((netOffer / candidate.minimumAsk) * 100)));
                            const outlookColor = candidate.status === 'accepted'
                                ? '#1b5e20'
                                : candidate.status === 'declined'
                                    ? '#b71c1c'
                                    : shortfall <= 0
                                        ? '#1b5e20'
                                        : shortfall <= 25000
                                            ? '#ef6c00'
                                            : '#b71c1c';
                            const outlookText = candidate.status === 'accepted'
                                ? 'Locked in'
                                : candidate.status === 'declined'
                                    ? 'Moving on'
                                    : shortfall <= 0
                                        ? 'Competitive offer ready'
                                        : 'Needs ' + formatCurrency(shortfall) + ' more';
                            const rowBackground =
                                candidate.status === 'accepted'
                                    ? 'rgba(200, 230, 201, 0.5)'
                                    : candidate.status === 'declined'
                                        ? 'rgba(255, 205, 210, 0.45)'
                                        : shortfall <= 0
                                            ? 'rgba(232, 245, 233, 0.45)'
                                            : 'rgba(255, 244, 229, 0.45)';
                            let statusLabel = 'Awaiting action';
                            let statusTone = { bg: '#fffde7', color: '#8d6e63' };
                            if (candidate.status === 'accepted') {
                                statusLabel = 'Returning (' + candidate.acceptedYears + ' yr)';
                                statusTone = { bg: '#c8e6c9', color: '#1b5e20' };
                            } else if (candidate.status === 'declined') {
                                statusLabel = 'Departing';
                                statusTone = { bg: '#ffebee', color: '#b71c1c' };
                            } else if (shortfall <= 0) {
                                statusLabel = 'Offer in range';
                                statusTone = { bg: '#dcedc8', color: '#1b5e20' };
                            } else {
                                statusLabel = 'Needs sweeter deal';
                                statusTone = { bg: '#fff3e0', color: '#ef6c00' };
                            }
                            const isJunior = isJuniorAcademicYear(candidate.year);
                            const yearsOptions = isJunior ? [1] : [1, 2];
                            return (
                                <tr key={candidate.playerId} style={{ backgroundColor: rowBackground }}>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: 'bold' }}>{candidate.playerName}</div>
                                        <div style={{ fontSize: '0.55rem' }}>
                                            {candidate.year} - {candidate.position}
                                            {candidate.secondaryPosition ? ' / ' + candidate.secondaryPosition : ''}
                                        </div>
                                        <div style={{ fontSize: '0.55rem', color: '#666' }}>{candidate.reason}</div>
                                    </td>
                                    <td style={styles.td}>{candidate.overall}</td>
                                    <td style={styles.td}>{formatPotentialValue(candidate.potential)}</td>
                                    <td style={styles.td}>{candidate.draftProjection}</td>
                                    <td style={styles.td}>{formatCurrency(candidate.expectedNilValue)}</td>
                                    <td style={styles.td}>{formatCurrency(candidate.minimumAsk)}</td>
                                    <td style={styles.td}>
                                        {formatCurrency(candidate.sponsorSubsidy)}
                                        {candidate.sponsorSubsidy > 0 && <p style={styles.nilInsightText}>Brand offset applied</p>}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.nilStatusPill, backgroundColor: 'rgba(0,0,0,0.04)', color: budgetColor }}>
                                            {formatCurrency(budgetHit)}
                                        </span>
                                        <p style={{ ...styles.nilInsightText, color: budgetColor }}>
                                            {budgetHit > remainingBudget
                                                ? 'Need ' + formatCurrency(budgetHit - remainingBudget) + ' more'
                                                : 'Fits remaining budget'}
                                        </p>
                                    </td>
                                    <td style={styles.td}>
                                        <input
                                            type="number"
                                            min={0}
                                            step={5000}
                                            style={{
                                                width: '120px',
                                                border: candidate.status === 'pending' && shortfall > 0 ? '2px solid #b71c1c' : '1px solid #bdbdbd',
                                                backgroundColor: candidate.status === 'pending' && shortfall <= 0 ? 'rgba(200, 230, 201, 0.4)' : '#fff',
                                            }}
                                            value={normalizedOffer}
                                            onChange={e => handleInputChange(candidate, 'amount', Number(e.target.value))}
                                            disabled={candidate.status !== 'pending'}
                                        />
                                    </td>
                                    <td style={styles.td}>
                                        <select
                                            style={styles.select}
                                            value={input.years}
                                            onChange={e => handleInputChange(candidate, 'years', Number(e.target.value))}
                                            disabled={candidate.status !== 'pending' || isJunior}
                                            title={isJunior ? 'Juniors only have one season of eligibility left.' : 'Extend stability for multi-year minded sophomores.'}
                                        >
                                            {yearsOptions.map(option => (
                                                <option key={option} value={option}>{option} Year{option > 1 ? 's' : ''}</option>
                                            ))}
                                        </select>
                                        {isJunior && <p style={styles.nilTermHelper}>JR deal capped at 1 year</p>}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.nilOutlookBarTrack}>
                                            <div style={{ ...styles.nilOutlookBarFill, width: outlookFill + '%', backgroundColor: outlookColor }} />
                                        </div>
                                        <p style={{ ...styles.nilInsightText, color: outlookColor }}>{outlookText}</p>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.nilStatusPill, backgroundColor: statusTone.bg, color: statusTone.color }}>
                                            {statusLabel}
                                        </span>
                                        {candidate.status === 'pending' && <p style={styles.nilInsightText}>{candidate.reason}</p>}
                                    </td>
                                    <td style={styles.td}>
                                        <button
                                            style={{
                                                ...styles.smallButton,
                                                opacity: candidate.status === 'pending' && canFinalize ? 1 : 0.5,
                                                backgroundColor: shortfall > 0 ? '#FCE4EC' : styles.smallButton.backgroundColor,
                                            }}
                                            disabled={candidate.status !== 'pending' || !canMakeOffers}
                                            onClick={() => handleOffer(candidate)}
                                            title={shortfall > 0 ? 'Bump the offer to reach their ask' : 'Fire off the offer'}
                                        >
                                            Offer
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '20px' }}>
                <Subheading color={colors.primary}>Conversation Log</Subheading>
                {state.nilNegotiationHistory.length === 0 ? (
                    <p style={{ fontSize: '0.65rem', color: '#555' }}>No conversations logged yet. Make an offer to see feedback.</p>
                ) : (
                    <div style={styles.nilHistoryPanel}>
                        <ul style={styles.nilHistoryList}>
                            {state.nilNegotiationHistory.map((entry: string, index: number) => (
                                <li key={`${entry}-${index}`} style={styles.nilHistoryItem}>{entry}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                {!nilCycleOpen && (
                    <span style={{ fontSize: '0.6rem', color: '#555' }}>
                        NIL negotiations unlock right after the season recap. Finish your first season to access full controls.
                    </span>
                )}
                <button
                    style={{ ...styles.button, opacity: canFinalize ? 1 : 0.5 }}
                    onClick={finalizeNegotiations}
                    disabled={!canFinalize}
                    title={canFinalize ? 'Lock in NIL results' : 'Available once the offseason NIL window is active'}
                >
                    Finalize NIL Decisions
                </button>
            </div>
        </div>
    );
};

export default NilNegotiationView;
