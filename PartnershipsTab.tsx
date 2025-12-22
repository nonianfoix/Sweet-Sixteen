import React, { useEffect, useMemo, useState } from 'react';
import { createNilCollectiveProfile } from './services/gameService';
import { BroadcastDeal, GameAction, GameResult, GameState, SponsorQuest, Team, TeamColors } from './types';
import { ALUMNI_SPONSORS } from './constants';

interface PartnershipsTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const isSyndicateQuest = (quest: SponsorQuest) => quest.isAlumniOwned || ALUMNI_SPONSORS.includes(quest.sponsor);

type HomeGameSlot = { week: number; opponent: string };

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const statusColor = (status: SponsorQuest['status']) => {
    switch (status) {
        case 'completed':
            return '#0B8043';
        case 'active':
            return '#1B9AAA';
        case 'available':
            return '#F4B400';
        default:
            return '#B22222';
    }
};

const buildHomeGameList = (schedule: GameResult[][], teamName: string, startWeek: number): HomeGameSlot[] => {
    const slots: HomeGameSlot[] = [];
    for (let weekIndex = startWeek - 1; weekIndex < schedule.length; weekIndex += 1) {
        const week = schedule[weekIndex];
        if (!week) continue;
        const matchup = week.find(game => game.homeTeam === teamName);
        if (matchup) {
            slots.push({ week: weekIndex + 1, opponent: matchup.awayTeam });
        }
    }
    return slots;
};

export const PartnershipsTab: React.FC<PartnershipsTabProps> = ({ state, userTeam, dispatch, colors }) => {
    const collective = userTeam.nilCollective ?? createNilCollectiveProfile(userTeam);
    const totalNilBudget = collective.baseBudget + collective.sponsorMatch + collective.alumniContribution;
    const [collectiveDraft, setCollectiveDraft] = useState(() => ({
        sponsorMatch: collective.sponsorMatch,
        alumniContribution: collective.alumniContribution,
    }));
    const [selectedEventId, setSelectedEventId] = useState(state.eventPlaybookCatalog[0]?.id ?? '');
    const upcomingHomeGames = useMemo(
        () => buildHomeGameList(state.schedule, userTeam.name, state.gameInSeason).slice(0, 5),
        [state.schedule, userTeam.name, state.gameInSeason],
    );
    const [selectedWeek, setSelectedWeek] = useState(upcomingHomeGames[0]?.week ?? 0);

    useEffect(() => {
        setCollectiveDraft({
            sponsorMatch: collective.sponsorMatch,
            alumniContribution: collective.alumniContribution,
        });
    }, [collective.sponsorMatch, collective.alumniContribution, collective.id]);

    useEffect(() => {
        if (!selectedWeek && upcomingHomeGames.length > 0) {
            setSelectedWeek(upcomingHomeGames[0].week);
        }
    }, [upcomingHomeGames, selectedWeek]);

    const nilUsagePct =
        userTeam.nilBudget && userTeam.nilBudget > 0
            ? Math.min(1, (userTeam.nilBudgetUsed ?? 0) / userTeam.nilBudget)
            : 0;
    
    const nilState = useMemo(() => {
        const allocated = userTeam.nilBudget ?? 0;
        const committed = userTeam.nilBudgetUsed ?? 0;
        const available = allocated - committed;
        return { allocated, committed, available };
    }, [userTeam.nilBudget, userTeam.nilBudgetUsed]);

    const activeQuests = (userTeam.sponsorQuests || []).filter(quest => quest.status === 'active');
    const activeSyndicateCount = activeQuests.filter(isSyndicateQuest).length;
    const completedQuests = (userTeam.sponsorQuests || []).filter(quest => quest.status === 'completed').slice(-3);
    const availableQuests = state.sponsorQuestDeck.filter(quest => quest.status === 'available').slice(0, 4);
    const pendingBroadcastOffers = userTeam.pendingBroadcastOffers || [];
    const scheduledEvents = userTeam.eventCalendar || [];

    const cashUnlocks = useMemo(() => {
        const questCash = availableQuests.reduce((sum, q) => sum + q.rewardCash, 0);
        const broadcastCash = pendingBroadcastOffers.reduce((sum, o) => sum + o.annualValue, 0);
        return {
            questCash,
            broadcastCash,
            total: questCash + broadcastCash,
        };
    }, [availableQuests, pendingBroadcastOffers]);

    const handleSaveCollective = () => {
        dispatch({
            type: 'MANAGE_NIL_COLLECTIVE',
            payload: {
                sponsorMatch: collectiveDraft.sponsorMatch,
                alumniContribution: collectiveDraft.alumniContribution,
            },
        });
        dispatch({ type: 'SET_TOAST', payload: 'Collective budget updated.' });
    };

    const handleQuestAccept = (quest: SponsorQuest) => {
        dispatch({ type: 'ACCEPT_SPONSOR_QUEST', payload: quest });
    };

    const handleScheduleEvent = () => {
        if (!selectedEventId || !selectedWeek) return;
        const slot = upcomingHomeGames.find(game => game.week === selectedWeek);
        if (!slot) return;
        if (scheduledEvents.some(event => event.week === selectedWeek && event.playbookId === selectedEventId)) {
            dispatch({ type: 'SET_TOAST', payload: 'Event already scheduled for that week.' });
            return;
        }
        dispatch({
            type: 'SCHEDULE_EVENT',
            payload: {
                playbookId: selectedEventId,
                week: selectedWeek,
                opponent: slot.opponent,
            },
        });
    };

    const handleBroadcastAccept = (deal: BroadcastDeal) => {
        dispatch({ type: 'NEGOTIATE_BROADCAST', payload: { deal } });
    };

    const handleBroadcastDecline = (deal: BroadcastDeal) => {
        dispatch({ type: 'DECLINE_BROADCAST_OFFER', payload: { offerId: deal.id } });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <section>
                <h4 style={{ ...styles.sectionHeading, color: colors.primary }}>Cash Unlock Paths</h4>
                <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                        <span style={styles.summaryLabel}>Available Quests</span>
                        <strong style={styles.summaryValue}>{formatCurrency(cashUnlocks.questCash)}</strong>
                        <p style={styles.summaryMeta}>From {availableQuests.length} available contracts.</p>
                    </div>
                    <div style={styles.summaryCard}>
                        <span style={styles.summaryLabel}>Broadcast Offers</span>
                        <strong style={styles.summaryValue}>{formatCurrency(cashUnlocks.broadcastCash)}</strong>
                         <p style={styles.summaryMeta}>From {pendingBroadcastOffers.length} pending offers.</p>
                    </div>
                    <div style={styles.summaryCard}>
                        <span style={styles.summaryLabel}>Total Potential</span>
                        <strong style={styles.summaryValue}>{formatCurrency(cashUnlocks.total)}</strong>
                        <p style={styles.summaryMeta}>Immediate cash injection opportunities.</p>
                    </div>
                </div>
            </section>
            <section style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                    <span style={styles.summaryLabel}>Collective Tier</span>
                    <strong style={styles.summaryValue}>{collective.tier.toUpperCase()}</strong>
                    <p style={styles.summaryMeta}>Reputation {collective.reputation}/100</p>
                </div>
                <div style={styles.summaryCard}>
                    <span style={styles.summaryLabel}>NIL Budget</span>
                    <strong style={styles.summaryValue}>{formatCurrency(totalNilBudget)}</strong>
                    <div style={styles.progressTrack}>
                        <div style={{ ...styles.progressFill, width: `${nilUsagePct * 100}%`, backgroundColor: colors.primary }} />
                    </div>
                    <p style={styles.summaryMeta}>
                        Used {formatCurrency(userTeam.nilBudgetUsed ?? 0)} / {formatCurrency(userTeam.nilBudget ?? 0)}
                    </p>
                </div>
                <div style={styles.summaryCard}>
                    <span style={styles.summaryLabel}>Active Sponsor Quests</span>
                    <strong style={styles.summaryValue}>{activeQuests.length}</strong>
                    <p style={styles.summaryMeta}>{completedQuests.length} completed recently</p>
                    {activeSyndicateCount > 0 && (
                        <p style={{...styles.summaryMeta, color: '#d4af37', fontWeight: 'bold', marginTop: '0.2rem'}}>
                            ★ {activeSyndicateCount} Syndicate Active
                        </p>
                    )}
                </div>
                <div style={styles.summaryCard}>
                    <span style={styles.summaryLabel}>Broadcast Deal</span>
                    {userTeam.broadcastDeal ? (
                        <>
                            <strong style={styles.summaryValue}>{userTeam.broadcastDeal.partner}</strong>
                            <p style={styles.summaryMeta}>
                                ${userTeam.broadcastDeal.annualValue.toLocaleString()} / yr • Through {userTeam.broadcastDeal.endSeason}
                            </p>
                        </>
                    ) : (
                        <>
                            <strong style={styles.summaryValue}>Open Market</strong>
                            <p style={styles.summaryMeta}>No partner locked. Evaluate offers below.</p>
                        </>
                    )}
                </div>
            </section>
            <section>
                <h4 style={{ ...styles.sectionHeading, color: colors.primary }}>NIL Budget State</h4>
                <div style={styles.collectiveGrid}>
                    <div style={styles.collectiveCard}>
                        <span style={styles.summaryLabel}>Available</span>
                        <strong style={styles.summaryValue}>{formatCurrency(nilState.available)}</strong>
                        <p style={styles.summaryMeta}>Ready to be offered to players.</p>
                    </div>
                    <div style={styles.collectiveCard}>
                        <span style={styles.summaryLabel}>Committed</span>
                        <strong style={styles.summaryValue}>{formatCurrency(nilState.committed)}</strong>
                        <p style={styles.summaryMeta}>Paid out to current players.</p>
                    </div>
                    <div style={styles.collectiveCard}>
                        <span style={styles.summaryLabel}>Total Allocated</span>
                        <strong style={styles.summaryValue}>{formatCurrency(nilState.allocated)}</strong>
                        <p style={styles.summaryMeta}>Your total NIL war chest.</p>
                    </div>
                </div>
            </section>
            <section>
                <h4 style={{ ...styles.sectionHeading, color: colors.primary }}>NIL Collective Controls</h4>
                <div style={styles.collectiveGrid}>
                    <div style={styles.collectiveCard}>
                        <span style={styles.summaryLabel}>Base Budget</span>
                        <strong style={styles.summaryValue}>{formatCurrency(collective.baseBudget)}</strong>
                        <p style={styles.summaryMeta}>Locked in via donors</p>
                    </div>
                    <div style={styles.collectiveCard}>
                        <span style={styles.summaryLabel}>Sponsor Match</span>
                        <strong style={styles.summaryValue}>{formatCurrency(collectiveDraft.sponsorMatch)}</strong>
                        <input
                            type="range"
                            min={0}
                            max={collective.baseBudget}
                            step={1000}
                            value={collectiveDraft.sponsorMatch}
                            onChange={event =>
                                setCollectiveDraft(draft => ({ ...draft, sponsorMatch: Number(event.target.value) }))
                            }
                            style={{ width: '100%' }}
                        />
                        <p style={styles.summaryMeta}>Boosted by apparel deals and NIL sponsors.</p>
                    </div>
                    <div style={styles.collectiveCard}>
                        <span style={styles.summaryLabel}>Alumni Windfall</span>
                        <strong style={styles.summaryValue}>{formatCurrency(collectiveDraft.alumniContribution)}</strong>
                        <input
                            type="range"
                            min={0}
                            max={collective.baseBudget}
                            step={1000}
                            value={collectiveDraft.alumniContribution}
                            onChange={event =>
                                setCollectiveDraft(draft => ({ ...draft, alumniContribution: Number(event.target.value) }))
                            }
                            style={{ width: '100%' }}
                        />
                        <p style={styles.summaryMeta}>Dial up alumni asks before rivalry weeks.</p>
                    </div>
                </div>
                <button style={styles.primaryButton(colors)} onClick={handleSaveCollective}>
                    Save Collective Mix
                </button>
            </section>

            <section>
                <h4 style={{ ...styles.sectionHeading, color: colors.primary }}>Sponsor Quests</h4>
                <div style={styles.questGrid}>
                    {activeQuests.length === 0 && (
                        <p style={styles.summaryMeta}>You have no active sponsor quests. Grab one from the deck below.</p>
                    )}
                    {activeQuests.map(quest => {
                        const pct = Math.min(100, Math.round((quest.progress / Math.max(1, quest.target)) * 100));
                        return (
                            <div key={quest.id} style={styles.questCard}>
                                <div style={styles.questHeader}>
                                    <strong>{quest.title}</strong>
                                    <span style={{ ...styles.questStatus, borderColor: statusColor(quest.status), color: statusColor(quest.status) }}>
                                        {quest.status.toUpperCase()}
                                    </span>
                                </div>
                                <p style={styles.summaryMeta}>{quest.description}</p>
                                <div style={styles.progressTrack}>
                                    <div style={{ ...styles.progressFill, width: `${pct}%`, backgroundColor: colors.primary }} />
                                </div>
                                <p style={styles.summaryMeta}>
                                    {quest.progress.toLocaleString()} / {quest.target.toLocaleString()} • Reward {formatCurrency(quest.rewardCash)}
                                </p>
                                <p style={{ ...styles.summaryMeta, fontStyle: 'italic' }}>Expires Week {quest.expiresWeek}</p>
                            </div>
                        );
                    })}
                </div>
                <h5 style={{ ...styles.sectionHeading, color: '#555', marginTop: '0.5rem' }}>Available Contracts</h5>
                <div style={styles.questGrid}>
                    {availableQuests.map(quest => {
                        const isSyndicate = isSyndicateQuest(quest);
                        return (
                            <div key={quest.id} style={{ 
                                ...styles.questCard, 
                                borderColor: isSyndicate ? '#d4af37' : '#d0d0d0',
                                boxShadow: isSyndicate ? '0 0 8px rgba(212, 175, 55, 0.2)' : 'none'
                            }}>
                                <div style={styles.questHeader}>
                                    <strong>{quest.title}</strong>
                                    <span style={{ 
                                        ...styles.questStatus, 
                                        borderColor: isSyndicate ? '#d4af37' : '#F4B400', 
                                        color: isSyndicate ? '#fff' : '#F4B400',
                                        backgroundColor: isSyndicate ? '#d4af37' : 'transparent',
                                        fontWeight: isSyndicate ? 'bold' : 'normal',
                                        padding: isSyndicate ? '0.1rem 0.4rem' : '0'
                                    }}>
                                        {isSyndicate ? 'THE SYNDICATE' : quest.sponsor}
                                    </span>
                                </div>
                                <p style={styles.summaryMeta}>{quest.description}</p>
                                <p style={styles.summaryMeta}>
                                    Target: {quest.target.toLocaleString()} • Reward {formatCurrency(quest.rewardCash)}
                                </p>
                                <button style={isSyndicate ? {...styles.primaryButton(colors), backgroundColor: '#d4af37', color: '#fff', border: 'none'} : styles.secondaryButton} onClick={() => handleQuestAccept(quest)}>
                                    Accept {isSyndicate ? 'Offer' : 'Quest'}
                                </button>
                            </div>
                        );
                    })}
                    {availableQuests.length === 0 && <p style={styles.summaryMeta}>Quest deck exhausted.</p>}
                </div>
            </section>

            <section>
                <h4 style={{ ...styles.sectionHeading, color: colors.primary }}>Event Playbook</h4>
                {state.eventPlaybookCatalog.length === 0 ? (
                    <p style={styles.summaryMeta}>Event catalog not seeded.</p>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <label style={styles.fieldLabel}>
                            Event
                            <select
                                value={selectedEventId}
                                onChange={event => setSelectedEventId(event.target.value)}
                                style={styles.select}
                            >
                                {state.eventPlaybookCatalog.map(event => (
                                    <option key={event.id} value={event.id}>
                                        {event.label} ({formatCurrency(event.cost)})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label style={styles.fieldLabel}>
                            Home Game
                            <select
                                value={selectedWeek}
                                onChange={event => setSelectedWeek(Number(event.target.value))}
                                style={styles.select}
                            >
                                {upcomingHomeGames.map(game => (
                                    <option key={game.week} value={game.week}>
                                        Week {game.week}: vs {game.opponent}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            style={{ ...styles.primaryButton(colors), minWidth: '160px' }}
                            disabled={!selectedEventId || !selectedWeek}
                            onClick={handleScheduleEvent}
                        >
                            Schedule Event
                        </button>
                    </div>
                )}
                {scheduledEvents.length > 0 && (
                    <ul style={styles.eventList}>
                        {[...scheduledEvents]
                            .sort((a, b) => a.week - b.week)
                            .map(event => {
                                const playbook = state.eventPlaybookCatalog.find(entry => entry.id === event.playbookId);
                                const isLocked = event.week - state.gameInSeason <= 1;
                                return (
                                    <li key={event.id} style={styles.eventListItem}>
                                        <span>
                                            Week {event.week}: {playbook?.label ?? event.playbookId}
                                            {playbook && <span style={{ fontSize: '0.6rem', color: '#555', marginLeft: '8px' }}>({playbook.effect}: {playbook.modifier})</span>}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.6rem', color: '#555' }}>{event.status.toUpperCase()}</span>
                                            <button style={styles.secondaryButton} disabled={isLocked} onClick={() => dispatch({ type: 'RESCHEDULE_EVENT', payload: { eventId: event.id, week: event.week + 1 } })}>Reschedule</button>
                                            <button style={styles.secondaryButton} disabled={isLocked} onClick={() => dispatch({ type: 'CANCEL_EVENT', payload: { eventId: event.id } })}>Cancel</button>
                                        </div>
                                    </li>
                                );
                            })}
                    </ul>
                )}
            </section>

            <section>
                <h4 style={{ ...styles.sectionHeading, color: colors.primary }}>Broadcast Opportunities</h4>
                {pendingBroadcastOffers.length === 0 ? (
                    <p style={styles.summaryMeta}>No offers pending. Advance the week to generate new proposals.</p>
                ) : (
                    <div style={styles.broadcastGrid}>
                        {pendingBroadcastOffers.map(offer => (
                            <div key={offer.id} style={styles.broadcastCard}>
                                <strong>{offer.partner}</strong>
                                <p style={styles.summaryMeta}>
                                    ${offer.annualValue.toLocaleString()} / yr • Exposure +{offer.exposureBonus}
                                </p>
                                <p style={styles.summaryMeta}>
                                    Seasons {offer.startSeason}-{offer.endSeason}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button style={styles.primaryButton(colors)} onClick={() => handleBroadcastAccept(offer)}>
                                        Accept
                                    </button>
                                    <button style={styles.secondaryButton} onClick={() => handleBroadcastDecline(offer)}>
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h4 style={{ ...styles.sectionHeading, color: colors.primary }}>Licensing & Merchandising Rights</h4>
                <div style={styles.summaryGrid}>
                    {(userTeam.licensingDeals || []).map(deal => (
                        <div key={deal.id} style={styles.summaryCard}>
                            <span style={styles.summaryLabel}>{deal.category}</span>
                            <strong style={styles.summaryValue}>{deal.partner}</strong>
                            <p style={styles.summaryMeta}>
                                Royalty: {(deal.royaltyRate * 100).toFixed(1)}%
                            </p>
                            <p style={styles.summaryMeta}>
                                {deal.duration} Year Contract
                            </p>
                        </div>
                    ))}
                    {(userTeam.licensingDeals || []).length === 0 && (
                        <p style={styles.summaryMeta}>No active licensing deals.</p>
                    )}
                </div>

                <h5 style={{ ...styles.sectionHeading, color: '#555', marginTop: '1rem' }}>Available Licensing Offers</h5>
                <div style={styles.broadcastGrid}>
                    {(userTeam.pendingLicensingOffers || []).map(offer => (
                        <div key={offer.id} style={styles.broadcastCard}>
                            <strong>{offer.partner}</strong>
                            <span style={styles.summaryLabel}>{offer.category}</span>
                            <p style={styles.summaryMeta}>
                                Upfront: {formatCurrency(offer.upfrontPayment)}
                            </p>
                            <p style={styles.summaryMeta}>
                                Royalty: {(offer.royaltyRate * 100).toFixed(1)}% • {offer.duration} Years
                            </p>
                            <button 
                                style={styles.primaryButton(colors)} 
                                onClick={() => dispatch({ type: 'ACCEPT_LICENSING_DEAL', payload: offer })}
                            >
                                Sign Deal
                            </button>
                        </div>
                    ))}
                    {(userTeam.pendingLicensingOffers || []).length === 0 && (
                        <p style={styles.summaryMeta}>No licensing partners are currently interested.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

const styles = {
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
    } as React.CSSProperties,
    summaryCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '8px',
        padding: '0.75rem',
        backgroundColor: '#fff',
        color: '#333',
    } as React.CSSProperties,
    summaryLabel: {
        fontSize: '0.55rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#777',
    } as React.CSSProperties,
    summaryValue: {
        fontSize: '1rem',
        margin: '0.15rem 0',
        display: 'block',
    } as React.CSSProperties,
    summaryMeta: {
        fontSize: '0.65rem',
        margin: 0,
        color: '#555',
    } as React.CSSProperties,
    progressTrack: {
        width: '100%',
        height: '6px',
        borderRadius: '999px',
        backgroundColor: '#ececec',
        overflow: 'hidden',
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
    } as React.CSSProperties,
    progressFill: {
        height: '100%',
        borderRadius: '999px',
    } as React.CSSProperties,
    sectionHeading: {
        margin: 0,
        marginBottom: '0.5rem',
        fontSize: '0.9rem',
    } as React.CSSProperties,
    collectiveGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem',
    } as React.CSSProperties,
    collectiveCard: {
        border: '1px solid #d0d0d0',
        borderRadius: '8px',
        padding: '0.75rem',
        backgroundColor: '#fdfdfd',
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    } as React.CSSProperties,
    primaryButton: (colors: TeamColors) =>
        ({
            backgroundColor: colors.primary,
            color: colors.text,
            border: 'none',
            padding: '0.5rem 0.75rem',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.6rem',
            cursor: 'pointer',
            borderRadius: '4px',
        }) as React.CSSProperties,
    secondaryButton: {
        backgroundColor: '#f0f0f0',
        color: '#333',
        border: '1px solid #ccc',
        padding: '0.45rem 0.75rem',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.6rem',
        cursor: 'pointer',
        borderRadius: '4px',
    } as React.CSSProperties,
    questGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
    } as React.CSSProperties,
    questCard: {
        border: '1px solid #c0c0c0',
        borderRadius: '8px',
        padding: '0.75rem',
        backgroundColor: '#fff',
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
    } as React.CSSProperties,
    questHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '0.5rem',
        alignItems: 'center',
    } as React.CSSProperties,
    questStatus: {
        fontSize: '0.55rem',
        border: '1px solid',
        padding: '0.2rem 0.4rem',
        borderRadius: '999px',
    } as React.CSSProperties,
    fieldLabel: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '0.6rem',
        gap: '0.25rem',
    } as React.CSSProperties,
    select: {
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.65rem',
        padding: '0.35rem',
    } as React.CSSProperties,
    eventList: {
        listStyle: 'none',
        padding: 0,
        margin: '0.5rem 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        fontSize: '0.65rem',
    } as React.CSSProperties,
    eventListItem: {
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '1px dashed #ddd',
        paddingBottom: '0.25rem',
    } as React.CSSProperties,
    broadcastGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
    } as React.CSSProperties,
    broadcastCard: {
        border: '1px solid #c0c0c0',
        borderRadius: '8px',
        padding: '0.75rem',
        backgroundColor: '#fff',
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
    } as React.CSSProperties,
};
