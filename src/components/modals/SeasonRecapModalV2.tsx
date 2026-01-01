import React, { useMemo, useState } from 'react';
import type { GameState } from '../../types';
import { NBA_ACRONYM_TO_NAME } from '../../constants';
import { formatCurrency } from '../../services/utils';
import { styles } from '../../styles';

const SeasonRecapModalV2 = ({ recapData, onClose }: { recapData: GameState['seasonRecapData'], onClose: () => void }) => {
    if (!recapData) return null;

    const {
        season,
        seasonYear,
        teamName,
        conference,
        nationalRank,
        record,
        regularSeasonRecord,
        postseasonRecord,
        tournamentResult,
        prestigeChange,
        prestige,
        coachReputation,
        coachReputationChange,
        signings,
        drafted,
        formerDrafted,
        totalRevenue,
        projectedRevenue,
        operationalExpenses,
        netIncome,
        cashOnHand,
        revenueBreakdown,
        attendance,
        sponsor,
        tournamentChampion,
        tournamentRunnerUp,
        signedRecruits,
        verbalCommits,
        signedPct,
        verbalPct,
        decommitments,
        flips,
        cpi,
    } = recapData;

    const reputationValue = coachReputation ?? 0;
    // Handle legacy number or new object structure
    const reputationChangeDelta = (coachReputationChange as any)?.delta ?? (coachReputationChange ?? 0);
    const prestigeChangeDelta = (typeof prestigeChange === 'object' ? prestigeChange?.delta : prestigeChange) ?? 0;

    const prestigeStyle = prestigeChangeDelta === 0 ? {} : { color: prestigeChangeDelta > 0 ? 'green' : 'red', fontWeight: 'bold' as const };
    const prestigeText = prestigeChangeDelta > 0 ? `? +${prestigeChangeDelta}` : `? ${prestigeChangeDelta}`;
    const reputationStyle = reputationChangeDelta === 0 ? {} : { color: reputationChangeDelta > 0 ? 'green' : 'red', fontWeight: 'bold' as const };
    const reputationText = reputationChangeDelta >= 0 ? `+${reputationChangeDelta}` : `${reputationChangeDelta}`;

    const cpiStatusColor = (status: string | undefined) => {
        if (status === 'Safe') return 'green';
        if (status === 'Warm') return 'orange';
        if (status === 'Hot') return 'red';
        if (status === 'Fired') return '#B22222';
        return '#000';
    };

    const bestDriver = cpi?.components?.length
        ? [...cpi.components].sort((a, b) => (b.score - a.score))[0]
        : null;
    const worstDriver = cpi?.components?.length
        ? [...cpi.components].sort((a, b) => (a.score - b.score))[0]
        : null;

    const [tab, setTab] = useState<'overview' | 'recruiting' | 'draft' | 'finances' | 'coach'>('overview');

    const formatPct = (n?: number) => {
        if (n == null || Number.isNaN(n)) return '�';
        return `${Math.round(n * 100)}%`;
    };

    const box: React.CSSProperties = {
        backgroundColor: '#E0E0E0',
        border: '2px solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        padding: '10px',
    };

    const sectionTitle: React.CSSProperties = {
        ...styles.modalSubheading,
        color: '#000',
        margin: '0 0 10px 0',
        fontSize: '0.8rem',
    };

    const label: React.CSSProperties = {
        fontSize: '0.55rem',
        color: '#111827',
        opacity: 0.9,
        marginBottom: '4px',
    };

    const valueStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        color: '#000',
    };

    const TabButton = ({ id, text }: { id: typeof tab; text: string }) => {
        const active = tab === id;
        return (
            <button
                type="button"
                onClick={() => setTab(id)}
                style={{
                    ...styles.button,
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '0.55rem',
                    padding: '8px 10px',
                    backgroundColor: active ? '#E0E0E0' : '#C0C0C0',
                    border: '2px solid',
                    borderColor: active ? '#000 #000 #808080 #808080' : '#FFFFFF #808080 #808080 #FFFFFF',
                    cursor: 'pointer',
                    flex: 1,
                }}
            >
                {text}
            </button>
        );
    };

    const moneyOrDash = (n?: number) => (typeof n === 'number' ? formatCurrency(n) : '�');

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '980px', width: '95vw', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                    <h2 style={{ ...styles.title, fontSize: '1.3rem', textShadow: '2px 2px 0px #808080', color: 'black', margin: 0 }}>
                        Season Recap
                    </h2>
                    <div style={{ fontSize: '0.6rem', color: '#111827', textAlign: 'right' }}>
                        <div>{teamName || '�'}{conference ? ` (${conference})` : ''}</div>
                        <div>{seasonYear ? `Season Year: ${seasonYear}` : season != null ? `Season: ${season}` : ''}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginTop: '12px' }}>
                    <div style={box}>
                        <div style={label}>Overall Record</div>
                        <div style={valueStyle}>{record}</div>
                        {regularSeasonRecord ? <div style={{ fontSize: '0.5rem', marginTop: '6px', opacity: 0.8 }}>REG: {regularSeasonRecord}</div> : null}
                        {postseasonRecord ? <div style={{ fontSize: '0.5rem', marginTop: '4px', opacity: 0.8 }}>POST: {postseasonRecord}</div> : null}
                    </div>
                    <div style={box}>
                        <div style={label}>Postseason</div>
                        <div style={valueStyle}>{tournamentResult}</div>
                        {tournamentChampion ? (
                            <div style={{ fontSize: '0.5rem', marginTop: '6px', opacity: 0.85 }}>
                                Champ: {tournamentChampion}{tournamentRunnerUp ? ` (vs ${tournamentRunnerUp})` : ''}
                            </div>
                        ) : null}
                    </div>
                    <div style={box}>
                        <div style={label}>Prestige</div>
                        <div style={valueStyle}>
                            {prestige != null ? prestige : '�'}{' '}
                            <span style={prestigeStyle}>{prestigeText}</span>
                        </div>
                        {nationalRank != null ? <div style={{ fontSize: '0.5rem', marginTop: '6px', opacity: 0.8 }}>Rank: #{nationalRank}</div> : null}
                    </div>
                    <div style={box}>
                        <div style={label}>Coach</div>
                        <div style={valueStyle}>
                            Rep: {reputationValue}{' '}
                            <span style={reputationStyle}>({reputationText})</span>
                        </div>
                        {cpi ? (
                            <div style={{ fontSize: '0.5rem', marginTop: '6px', opacity: 0.9 }}>
                                CPI: {Math.round(cpi.compositeScore)}/100 �{' '}
                                <span style={{ color: cpiStatusColor(cpi.status), fontWeight: 'bold' }}>{cpi.status}</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <TabButton id="overview" text="Overview" />
                    <TabButton id="recruiting" text="Recruiting" />
                    <TabButton id="draft" text="Draft" />
                    <TabButton id="finances" text="Finances" />
                    <TabButton id="coach" text="Coach" />
                </div>

                <div style={{ ...box, marginTop: '10px', maxHeight: '52vh', overflowY: 'auto' }}>
                    {tab === 'overview' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                            <div style={box}>
                                <h4 style={sectionTitle}>Season Highlights</h4>
                                <div style={{ fontSize: '0.65rem', lineHeight: 1.4 }}>
                                    <div><strong>Team:</strong> {teamName || '�'}</div>
                                    <div><strong>Conference:</strong> {conference || '�'}</div>
                                    <div><strong>National Rank:</strong> {nationalRank != null ? `#${nationalRank}` : '�'}</div>
                                    <div><strong>Sponsor:</strong> {sponsor ? `${sponsor.name}${sponsor.tier ? ` (${sponsor.tier})` : ''}` : 'None'}</div>
                                </div>
                            </div>
                            <div style={box}>
                                <h4 style={sectionTitle}>Quick Counts</h4>
                                <div style={{ fontSize: '0.65rem', lineHeight: 1.4 }}>
                                    <div><strong>Signed:</strong> {(signedRecruits?.length ?? signings?.length) || 0} ({formatPct(signedPct)})</div>
                                    <div><strong>Verbals:</strong> {verbalCommits?.length || 0} ({formatPct(verbalPct)})</div>
                                    <div><strong>Decommitments:</strong> {decommitments ?? 0}</div>
                                    <div><strong>Flips:</strong> {flips ?? 0}</div>
                                    <div><strong>Drafted Players:</strong> {drafted?.length || 0}</div>
                                    <div><strong>Former Alumni Drafted:</strong> {formerDrafted?.length || 0}</div>
                                    <div><strong>Home Games Tracked:</strong> {attendance?.games || 0}</div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {tab === 'recruiting' ? (
                        <div>
                            <h4 style={sectionTitle}>Recruiting Summary</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                <div style={box}>
                                    <div style={label}>Signed</div>
                                    <div style={valueStyle}>{(signedRecruits?.length ?? signings?.length) || 0} ({formatPct(signedPct)})</div>
                                </div>
                                <div style={box}>
                                    <div style={label}>Verbals</div>
                                    <div style={valueStyle}>{verbalCommits?.length || 0} ({formatPct(verbalPct)})</div>
                                </div>
                                <div style={box}>
                                    <div style={label}>Decommitments</div>
                                    <div style={valueStyle}>{decommitments ?? 0}</div>
                                </div>
                                <div style={box}>
                                    <div style={label}>Flips</div>
                                    <div style={valueStyle}>{flips ?? 0}</div>
                                </div>
                            </div>

                            <h4 style={sectionTitle}>Signed Recruits</h4>
                            {(signedRecruits?.length ?? signings?.length) ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                                    {[...(signedRecruits || signings || [])]
                                        .sort((a, b) => (b.stars - a.stars) || (b.overall - a.overall))
                                        .map(r => (
                                            <div key={r.id} style={box}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                    <div style={{ fontSize: '0.65rem' }}><strong>{r.name}</strong></div>
                                                    <div style={{ fontSize: '0.55rem', opacity: 0.85 }}>{r.stars}?</div>
                                                </div>
                                                <div style={{ fontSize: '0.55rem', marginTop: '6px', opacity: 0.9 }}>
                                                    {r.position} � OVR {r.overall} � POT {r.potential}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.65rem' }}>None</div>
                            )}

                            {verbalCommits?.length ? (
                                <>
                                    <h4 style={{ ...sectionTitle, marginTop: '12px' }}>Verbals (Poachable)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                                        {[...verbalCommits]
                                            .sort((a, b) => (b.stars - a.stars) || (b.overall - a.overall))
                                            .map(r => (
                                                <div key={r.id} style={box}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                                        <div style={{ fontSize: '0.65rem' }}><strong>{r.name}</strong></div>
                                                        <div style={{ fontSize: '0.55rem', opacity: 0.85 }}>{r.stars}?</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.55rem', marginTop: '6px', opacity: 0.9 }}>
                                                        {r.position} � OVR {r.overall} � POT {r.potential}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    ) : null}

                    {tab === 'draft' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                            <div style={box}>
                                <h4 style={sectionTitle}>Your Draft Picks</h4>
                                {drafted?.length ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.6rem', lineHeight: 1.45 }}>
                                        {drafted.map((d, idx) => (
                                            <li key={`${d.player.id}-${idx}`} style={{ padding: '6px 0', borderTop: idx === 0 ? undefined : '1px solid #bdbdbd' }}>
                                                <div><strong>{d.player.name}</strong></div>
                                                <div style={{ opacity: 0.9 }}>R{d.round} #{d.pick} � {NBA_ACRONYM_TO_NAME[d.nbaTeam] || d.nbaTeam}</div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div style={{ fontSize: '0.65rem' }}>None</div>
                                )}
                            </div>
                            <div style={box}>
                                <h4 style={sectionTitle}>Former Alumni Drafted</h4>
                                {formerDrafted?.length ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.6rem', lineHeight: 1.45 }}>
                                        {formerDrafted.map((d, idx) => (
                                            <li key={`${d.player.id}-${idx}`} style={{ padding: '6px 0', borderTop: idx === 0 ? undefined : '1px solid #bdbdbd' }}>
                                                <div><strong>{d.player.name}</strong></div>
                                                <div style={{ opacity: 0.9 }}>R{d.round} #{d.pick} � {NBA_ACRONYM_TO_NAME[d.nbaTeam] || d.nbaTeam}</div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div style={{ fontSize: '0.65rem' }}>None</div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {tab === 'finances' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                            <div style={box}>
                                <h4 style={sectionTitle}>Totals</h4>
                                <div style={{ fontSize: '0.65rem', lineHeight: 1.5 }}>
                                    <div><strong>Total Revenue:</strong> {moneyOrDash(totalRevenue)}</div>
                                    <div><strong>Projected Revenue:</strong> {moneyOrDash(projectedRevenue)}</div>
                                    <div><strong>Operational Expenses:</strong> {moneyOrDash(operationalExpenses)}</div>
                                    <div><strong>Net Income:</strong> {moneyOrDash(netIncome)}</div>
                                    <div><strong>Cash On Hand:</strong> {moneyOrDash(cashOnHand)}</div>
                                </div>
                            </div>
                            <div style={box}>
                                <h4 style={sectionTitle}>Attendance</h4>
                                <div style={{ fontSize: '0.65rem', lineHeight: 1.5 }}>
                                    <div><strong>Games:</strong> {attendance?.games || 0}</div>
                                    <div><strong>Avg Attendance:</strong> {attendance ? attendance.avgAttendance.toLocaleString() : '�'}</div>
                                    <div><strong>Avg Fill Rate:</strong> {attendance?.avgFillRate != null ? formatPct(attendance.avgFillRate) : '�'}</div>
                                    <div><strong>Avg Game Revenue:</strong> {attendance ? formatCurrency(attendance.avgGameRevenue) : '�'}</div>
                                </div>
                            </div>
                            <div style={{ ...box, gridColumn: '1 / -1' }}>
                                <h4 style={sectionTitle}>Revenue Breakdown</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', fontSize: '0.6rem' }}>
                                    <div><strong>Gate:</strong> {moneyOrDash(revenueBreakdown?.gateRevenue)}</div>
                                    <div><strong>Merch:</strong> {moneyOrDash(revenueBreakdown?.merchandiseRevenue)}</div>
                                    <div><strong>Concessions:</strong> {moneyOrDash(revenueBreakdown?.concessionsRevenue)}</div>
                                    <div><strong>Parking:</strong> {moneyOrDash(revenueBreakdown?.parkingRevenue)}</div>
                                    <div><strong>Sponsor:</strong> {moneyOrDash(revenueBreakdown?.sponsorPayout)}</div>
                                    <div><strong>Tournament:</strong> {moneyOrDash(revenueBreakdown?.tournamentShare)}</div>
                                    <div><strong>Donations:</strong> {moneyOrDash(revenueBreakdown?.donationRevenue)}</div>
                                    <div><strong>Endowment:</strong> {moneyOrDash(revenueBreakdown?.endowmentSupport)}</div>
                                    <div><strong>Base:</strong> {moneyOrDash(revenueBreakdown?.baseRevenue)}</div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {tab === 'coach' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                            <div style={box}>
                                <h4 style={sectionTitle}>Coach Summary</h4>
                                <div style={{ fontSize: '0.65rem', lineHeight: 1.5 }}>
                                    <div><strong>Reputation:</strong> {reputationValue} (<span style={reputationStyle}>{reputationText}</span>)</div>
                                    {cpi ? (
                                        <>
                                            <div><strong>CPI:</strong> {Math.round(cpi.compositeScore)}/100</div>
                                            <div><strong>Status:</strong> <span style={{ color: cpiStatusColor(cpi.status), fontWeight: 'bold' }}>{cpi.status}</span></div>
                                            <div><strong>Profile:</strong> {cpi.boardProfile}</div>
                                        </>
                                    ) : (
                                        <div style={{ opacity: 0.9 }}>CPI: �</div>
                                    )}
                                </div>
                                {(bestDriver || worstDriver) && (
                                    <div style={{ marginTop: '10px', fontSize: '0.6rem', opacity: 0.95 }}>
                                        {bestDriver ? <div><strong>Best:</strong> {bestDriver.label} ({Math.round(bestDriver.score)})</div> : null}
                                        {worstDriver ? <div style={{ marginTop: '6px' }}><strong>Worst:</strong> {worstDriver.label} ({Math.round(worstDriver.score)})</div> : null}
                                    </div>
                                )}
                            </div>
                            <div style={box}>
                                <h4 style={sectionTitle}>CPI Breakdown</h4>
                                {cpi?.components?.length ? (
                                    <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', fontSize: '0.55rem', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ textAlign: 'left', padding: '4px 2px' }}>Metric</th>
                                                    <th style={{ textAlign: 'right', padding: '4px 2px' }}>Score</th>
                                                    <th style={{ textAlign: 'right', padding: '4px 2px' }}>Weight</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cpi.components.map((comp, idx) => (
                                                    <tr key={idx} style={{ borderTop: '1px solid #bdbdbd' }}>
                                                        <td style={{ padding: '4px 2px' }}>{comp.label}</td>
                                                        <td style={{ padding: '4px 2px', textAlign: 'right' }}>{Math.round(comp.score)}</td>
                                                        <td style={{ padding: '4px 2px', textAlign: 'right' }}>{Math.round(comp.weight * 100)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.65rem' }}>No CPI data.</div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                <button onClick={onClose} style={{ ...styles.button, marginTop: '12px', width: '100%' }}>Continue</button>
            </div>
        </div>
    );
};


export default SeasonRecapModalV2;
