import React, { useState, useMemo, useEffect } from 'react';
import { GameAction, Team, GameState, Loan, MarketingCampaign, MarketingCampaignType, FundRequest } from './types';

import { BASE_CALENDAR_YEAR } from './constants';

interface FinancialsTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: any;
}

const CAMPAIGN_TYPES: { type: MarketingCampaignType; cost: number; duration: number; desc: string }[] = [
    { type: 'Student Rush', cost: 5000, duration: 2, desc: 'Quick boost for student section.' },
    { type: 'Local Business Partnership', cost: 15000, duration: 8, desc: 'Steady local support.' },
    { type: 'Social Media Blitz', cost: 25000, duration: 4, desc: 'High impact, short duration.' },
    { type: 'Community Day', cost: 10000, duration: 1, desc: 'One-time attendance spike.' },
    { type: 'National TV Spot', cost: 100000, duration: 4, desc: 'Major prestige exposure.' },
];

export const FinancialsTab: React.FC<FinancialsTabProps> = ({ state, userTeam, dispatch, colors }) => {
    const cash = userTeam.budget?.cash || 0;
    const loans = userTeam.loans || [];
    const activeCampaigns = userTeam.activeCampaigns || [];
    const finances = userTeam.finances;
    
    // Financial Goal Tracking
    const coachContract = state.coach?.contract;
    const expectations = coachContract?.expectations;
    const targetNetIncome = expectations?.targetNetIncome;
    
    const currentNetIncome = finances.totalRevenue - finances.operationalExpenses;
    
    let goalProgress = 0;
    if (targetNetIncome !== undefined) {
        if (targetNetIncome <= 0) {
            // If target is 0 (break even), any positive income is success
            goalProgress = currentNetIncome >= targetNetIncome ? 100 : 0;
        } else {
            goalProgress = Math.min(100, Math.max(0, (currentNetIncome / targetNetIncome) * 100));
        }
    }

    // RPF Calculation (Revenue Per Fan) - Estimate based on recent games or season total
    // We need total attendance for the season. 
    // If not tracked directly, we can sum from logs.
    const totalAttendance = useMemo(() => {
        return userTeam.facilities?.arena?.attendanceLog.reduce((sum, log) => sum + log.attendance, 0) || 1;
    }, [userTeam.facilities?.arena?.attendanceLog]);
    
    const rpf = finances.totalRevenue / (totalAttendance || 1);

    // Ledger Filtering
    const [selectedSeason, setSelectedSeason] = useState<number>(state.season);

    // Sync selected season when state.season changes (e.g. new season starts)
    useEffect(() => {
        setSelectedSeason(state.season);
    }, [state.season]);

    const availableSeasons = useMemo(() => {
        const seasons = new Set<number>();
        seasons.add(state.season); // Always include current
        if (finances.ledger) {
            finances.ledger.forEach(entry => seasons.add(entry.season));
        }
        return Array.from(seasons).sort((a, b) => b - a); // Descending
    }, [finances.ledger, state.season]);

    const filteredLedger = useMemo(() => {
        if (!finances.ledger) return [];
        return finances.ledger.filter(entry => entry.season === selectedSeason);
    }, [finances.ledger, selectedSeason]);

    // Loan Modal State
    const [loanAmount, setLoanAmount] = useState(100000);
    const [loanTerm, setLoanTerm] = useState(12);

    const handleTakeLoan = () => {
        if (window.confirm(`Take a loan of $${loanAmount.toLocaleString()} for ${loanTerm} months at 5% interest?`)) {
            dispatch({ type: 'TAKE_LOAN', payload: { amount: loanAmount, termMonths: loanTerm, interestRate: 0.05 } });
        }
    };

    const handlePayLoan = (id: string, amount: number) => {
        if (cash < amount) return;
        if (window.confirm(`Pay $${amount.toLocaleString()} towards this loan?`)) {
            dispatch({ type: 'PAY_LOAN', payload: { loanId: id, amount } });
        }
    };

    const handleStartCampaign = (campaign: typeof CAMPAIGN_TYPES[number]) => {
        if (cash < campaign.cost) return;
        if (window.confirm(`Start ${campaign.type} for $${campaign.cost.toLocaleString()}?`)) {
            dispatch({ type: 'START_MARKETING_CAMPAIGN', payload: { type: campaign.type, cost: campaign.cost, durationWeeks: campaign.duration } });
        }
    };

    const handleRequestFunds = (type: FundRequest['type'], amount: number, reason: string) => {
        if (window.confirm(`Request $${amount.toLocaleString()} for ${type}? This will be reviewed by the Board.`)) {
            dispatch({ type: 'REQUEST_FUNDS', payload: { type, amount, reason } });
        }
    };

    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Board Expectations & High Level Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <section style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', border: `1px solid ${colors.muted}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: colors.primary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Board Expectations</span>
                        {targetNetIncome !== undefined && <span style={{ fontSize: '0.7rem', backgroundColor: '#eee', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>Board Target</span>}
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Net Income Goal</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {targetNetIncome !== undefined ? `$${targetNetIncome.toLocaleString()}` : 'N/A'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Current Status</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: currentNetIncome >= (targetNetIncome || 0) ? '#4ade80' : '#f87171' }}>
                                ${currentNetIncome.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {targetNetIncome !== undefined && (
                        <div style={{ width: '100%', height: '12px', backgroundColor: '#eee', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{ width: `${goalProgress}%`, height: '100%', backgroundColor: goalProgress >= 100 ? '#4ade80' : colors.accent, transition: 'width 0.5s ease' }} />
                        </div>
                    )}
                    
                    <p style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                        {currentNetIncome >= (targetNetIncome || 0)
                            ? "The Board is pleased with your fiscal responsibility." 
                            : "The Board demands better financial performance. Avoid a deficit."}
                    </p>
                </section>

                <section style={{ padding: '1.5rem', backgroundColor: colors.secondary, borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <h4 style={{ margin: 0, color: '#fff', opacity: 0.9 }}>Revenue Per Fan (RPF)</h4>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', margin: '0.5rem 0' }}>
                        ${rpf.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#fff', opacity: 0.8 }}>Target: $12.50+</div>
                </section>
            </div>

            {/* Active Job Offers */}
            {state.poachingOffers && state.poachingOffers.length > 0 && (
                <section style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', border: `2px solid ${colors.accent}`, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: colors.primary }}>Active Job Offers</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        {state.poachingOffers.filter(o => !!o).map(offer => (
                            <div key={offer.id} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{offer.teamName}</div>
                                <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                    <div>Prestige: {offer.prestige}</div>
                                    <div>Salary: ${offer.salary.toLocaleString()}</div>
                                    <div>Length: {offer.length} Years</div>
                                    <div>Expires: Week {offer.expiresWeek}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm(`Accept offer from ${offer.teamName} for next season?`)) {
                                                dispatch({ type: 'RESOLVE_POACHING_OFFER', payload: { decision: 'next_season', offer } });
                                            }
                                        }}
                                        style={{ flex: 1, padding: '5px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontFamily: "'Press Start 2P', cursive" }}
                                    >
                                        Accept (Next Season)
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm(`Reject offer from ${offer.teamName}?`)) {
                                                dispatch({ type: 'RESOLVE_POACHING_OFFER', payload: { decision: 'reject', offer } });
                                            }
                                        }}
                                        style={{ flex: 1, padding: '5px', backgroundColor: '#f87171', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontFamily: "'Press Start 2P', cursive" }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* War Chest */}
            <section style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', border: `1px solid ${colors.muted}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: colors.primary }}>Coach's War Chest</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Discretionary Budget</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${userTeam.warChest?.discretionaryBudget.toLocaleString() || 0}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button 
                        onClick={() => handleRequestFunds('CharterFlights', 50000, 'Improve travel comfort to reduce fatigue.')}
                        style={{ padding: '10px', backgroundColor: colors.secondary, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Request Charter Flights ($50k)
                    </button>
                    <button 
                        onClick={() => handleRequestFunds('StaffBonus', 25000, 'Boost staff morale and retention.')}
                        style={{ padding: '10px', backgroundColor: colors.secondary, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Request Staff Bonus ($25k)
                    </button>
                    <button 
                        onClick={() => handleRequestFunds('FacilityRush', 100000, 'Accelerate facility upgrades.')}
                        style={{ padding: '10px', backgroundColor: colors.secondary, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Request Facility Rush ($100k)
                    </button>
                    <button 
                        onClick={() => handleRequestFunds('MarketingBlitz', 15000, 'Immediate marketing push for next game.')}
                        style={{ padding: '10px', backgroundColor: colors.secondary, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Request Marketing Blitz ($15k)
                    </button>
                </div>

                <h4 style={{ fontSize: '0.9rem', color: colors.primary, marginBottom: '0.5rem' }}>Request History</h4>
                {userTeam.warChest?.requests && userTeam.warChest.requests.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.8rem' }}>
                        {[...userTeam.warChest.requests].reverse().map(req => (
                            <li key={req.id} style={{ padding: '5px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{req.type} (${req.amount.toLocaleString()})</span>
                                <span style={{ 
                                    fontWeight: 'bold', 
                                    color: req.status === 'Approved' ? 'green' : req.status === 'Denied' ? 'red' : 'orange' 
                                }}>
                                    {req.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>No requests made yet.</p>
                )}
            </section>

            {/* P&L Statement */}
            <section style={{ backgroundColor: '#fff', borderRadius: '8px', border: `1px solid ${colors.muted}`, overflow: 'hidden' }}>
                <header style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderBottom: `1px solid ${colors.muted}` }}>
                    <h3 style={{ margin: 0, color: colors.primary }}>Profit & Loss Statement</h3>
                </header>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', divideX: `1px solid ${colors.muted}` }}>
                    {/* Revenue */}
                    <div style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginTop: 0, color: '#2e7d32', borderBottom: '2px solid #2e7d32', paddingBottom: '0.5rem' }}>Revenue</h4>
                        <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Gate Receipts</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${finances.gateRevenue.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Concessions</td>
                                    <td style={{ textAlign: 'right' }}>${finances.concessionsRevenue.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Merchandise</td>
                                    <td style={{ textAlign: 'right' }}>${finances.merchandiseRevenue.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Media Rights</td>
                                    <td style={{ textAlign: 'right' }}>${finances.broadcastRevenue.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Sponsorships</td>
                                    <td style={{ textAlign: 'right' }}>${finances.sponsorPayout.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Parking</td>
                                    <td style={{ textAlign: 'right' }}>${finances.parkingRevenue.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Endowment</td>
                                    <td style={{ textAlign: 'right' }}>${finances.endowmentSupport.toLocaleString()}</td>
                                </tr>
                                <tr style={{ borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>Total Revenue</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>${finances.totalRevenue.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Expenses */}
                    <div style={{ padding: '1.5rem', borderLeft: '1px solid #eee' }}>
                        <h4 style={{ marginTop: 0, color: '#c62828', borderBottom: '2px solid #c62828', paddingBottom: '0.5rem' }}>Expenses</h4>
                        <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Staff Payroll</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${finances.staffPayrollExpenses.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Travel & Logistics</td>
                                    <td style={{ textAlign: 'right' }}>${finances.travelExpenses.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Recruiting</td>
                                    <td style={{ textAlign: 'right' }}>${finances.recruitingExpenses.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Marketing & Ops</td>
                                    <td style={{ textAlign: 'right' }}>${finances.marketingExpenses.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Facilities Maint.</td>
                                    <td style={{ textAlign: 'right' }}>${finances.facilitiesExpenses.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>NIL Payouts</td>
                                    <td style={{ textAlign: 'right' }}>${finances.nilExpenses.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.5rem 0' }}>Loan Interest</td>
                                    <td style={{ textAlign: 'right' }}>${finances.loanPayments.toLocaleString()}</td>
                                </tr>
                                <tr style={{ borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>Total Expenses</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#c62828' }}>${finances.operationalExpenses.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderTop: `1px solid ${colors.muted}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Net Operating Income</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: currentNetIncome >= 0 ? '#2e7d32' : '#c62828' }}>
                        ${currentNetIncome.toLocaleString()}
                    </span>
                </div>
            </section>

            {/* Loans & Marketing Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Loans */}
                <section>
                    <h3 style={{ color: colors.primary }}>Debt Management</h3>
                    <div style={{ marginBottom: '1rem', padding: '1rem', border: `1px solid ${colors.muted}`, borderRadius: '8px', backgroundColor: '#fff' }}>
                        <h4 style={{marginTop:0}}>Request Capital</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input 
                                type="number" 
                                value={loanAmount} 
                                onChange={e => setLoanAmount(Number(e.target.value))} 
                                step="10000"
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
                            />
                            <select value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                                <option value={6}>6 Mo</option>
                                <option value={12}>1 Year</option>
                                <option value={24}>2 Years</option>
                                <option value={48}>4 Years</option>
                            </select>
                            <button onClick={handleTakeLoan} style={{ padding: '0.5rem 1rem', backgroundColor: colors.accent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Borrow
                            </button>
                        </div>
                    </div>

                    {loans.length > 0 ? (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {loans.map(loan => (
                                <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div>
                                        <strong style={{color: colors.primary}}>Loan #{loan.id.substring(0,6)}</strong>
                                        <div style={{fontSize: '0.8rem', color: '#666'}}>${loan.principal.toLocaleString()} remaining</div>
                                    </div>
                                    <button onClick={() => handlePayLoan(loan.id, loan.principal)} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
                                        Pay Off
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : <p style={{ fontStyle: 'italic', color: '#666' }}>No active loans.</p>}
                </section>

                {/* Marketing */}
                <section>
                    <h3 style={{ color: colors.primary }}>Marketing Campaigns</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {CAMPAIGN_TYPES.map(c => (
                            <div key={c.type} style={{ padding: '0.75rem', border: `1px solid ${colors.muted}`, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: cash < c.cost ? 0.6 : 1 }}>
                                <div>
                                    <strong style={{ fontSize: '0.9rem', display: 'block' }}>{c.type}</strong>
                                    <span style={{ fontSize: '0.75rem', color: '#666' }}>{c.desc}</span>
                                </div>
                                <button 
                                    onClick={() => handleStartCampaign(c)} 
                                    disabled={cash < c.cost}
                                    style={{ padding: '0.4rem 0.8rem', backgroundColor: colors.primary, color: '#fff', border: 'none', borderRadius: '4px', cursor: cash >= c.cost ? 'pointer' : 'default', fontSize: '0.8rem' }}
                                >
                                    ${(c.cost/1000).toFixed(0)}k
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Ledger */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: colors.primary }}>Financial Ledger</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: '#666' }}>Season:</label>
                        <select 
                            value={selectedSeason} 
                            onChange={(e) => setSelectedSeason(Number(e.target.value))}
                            style={{ 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '4px', 
                                border: `1px solid ${colors.muted}`,
                                fontFamily: 'inherit',
                                fontSize: '0.8rem'
                            }}
                        >
                            {availableSeasons.map(s => (
                                <option key={s} value={s}>
                                    {BASE_CALENDAR_YEAR + s}-{BASE_CALENDAR_YEAR + s + 1}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: `1px solid ${colors.muted}`, borderRadius: '8px', backgroundColor: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', borderBottom: `2px solid ${colors.muted}` }}>
                            <tr>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Game</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLedger && filteredLedger.length > 0 ? (
                                [...filteredLedger].reverse().map((entry) => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            {entry.week <= 31 ? `Game ${entry.week}` : 'Post'}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{entry.description}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ 
                                                padding: '0.2rem 0.5rem', 
                                                borderRadius: '4px', 
                                                backgroundColor: entry.amount >= 0 ? '#e6f4ea' : '#fce8e6',
                                                color: entry.amount >= 0 ? '#1e7e34' : '#d93025',
                                                fontSize: '0.7rem'
                                            }}>
                                                {entry.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: entry.amount >= 0 ? '#1e7e34' : '#d93025' }}>
                                            {entry.amount >= 0 ? '+' : ''}${entry.amount.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>
                                            ${entry.runningBalance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                                        No transactions recorded for this season.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

        </div>
    );
};
