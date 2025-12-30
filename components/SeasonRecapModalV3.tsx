
import React, { useState } from 'react';
import { SeasonRecapData, TeamColors } from '../types';
import { getSchoolLogoUrl, rgbaFromHex, bestTextColor } from '../services/utils';

interface SeasonRecapModalV3Props {
    recapData: SeasonRecapData;
    onClose: () => void;
    teamName: string;
    coachName: string;
    colors: TeamColors;
}

const SeasonRecapModalV3: React.FC<SeasonRecapModalV3Props> = ({ recapData, onClose, teamName, coachName, colors }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CPI' | 'RECRUITING' | 'FINANCES'>('OVERVIEW');
    const logoUrl = getSchoolLogoUrl(teamName);
    const teamPrimary = colors?.primary || '#0f172a';
    const teamSecondary = colors?.secondary || '#e2e8f0';

    const sectionCard: React.CSSProperties = {
        background: '#f8fafc',
        borderRadius: '6px',
        border: '2px solid #0f172a',
        boxShadow: '4px 4px 0 #0f172a',
        padding: '16px',
    };

    const infoPill: React.CSSProperties = {
        background: '#ffffff',
        border: '2px solid #0f172a',
        borderRadius: '6px',
        boxShadow: '2px 2px 0 #0f172a',
        padding: '4px 10px',
        fontSize: '12px',
        color: '#0f172a',
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
    };

    const tabButton = (active: boolean): React.CSSProperties => ({
        padding: '10px 16px',
        borderRadius: '6px',
        border: '2px solid #0f172a',
        background: active ? '#fde047' : '#ffffff',
        color: '#0f172a',
        boxShadow: active ? '3px 3px 0 #0f172a' : '2px 2px 0 rgba(15,23,42,0.35)',
        fontWeight: 900,
        fontSize: '13px',
        cursor: 'pointer',
        textTransform: 'uppercase' as 'uppercase',
        letterSpacing: '0.05em',
    });

    const actionButton: React.CSSProperties = {
        padding: '12px 24px',
        borderRadius: '6px',
        border: '2px solid #0f172a',
        background: '#fde047',
        color: '#0f172a',
        boxShadow: '4px 4px 0 #0f172a',
        fontWeight: 900,
        fontSize: '14px',
        cursor: 'pointer',
    };

    const statLabel: React.CSSProperties = {
        fontSize: '10px',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#64748b',
    };

    const statValue: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: 900,
        color: '#0f172a',
    };

    function getErrorColor(score: number): string {
        if (score >= 80) return '#22c55e';
        if (score >= 50) return '#eab308';
        return '#ef4444';
    }

    function getSecurityStyle(security: string): { bg: string; text: string } {
        switch (security) {
            case 'Safe': return { bg: '#dcfce7', text: '#166534' };
            case 'Warm': return { bg: '#fef9c3', text: '#854d0e' };
            case 'Hot': return { bg: '#fee2e2', text: '#991b1b' };
            case 'Fired': return { bg: '#1a202c', text: '#f87171' };
            default: return { bg: '#f1f5f9', text: '#475569' };
        }
    }

    function getOrdinal(n: number): string {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    function formatMoney(amount: number): string {
        if (amount == null || isNaN(amount)) return '$0';
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    }

    // Safe access wrappers
    const results = recapData?.results ?? { wins: 0, losses: 0, conferenceRecord: '0-0', conferenceFinish: 0, postSeasonResult: 'N/A', finalRank: 0 };
    const financials = recapData?.financials ?? { totalRevenue: 0, netIncome: 0, primarySource: 'N/A' };
    const recruiting = recapData?.recruiting ?? { classRank: 0, classSize: 0, topRecruit: 'N/A', needsMet: false };
    const prestigeChange = recapData?.prestigeChange ?? { previous: 0, current: 0, delta: 0, primaryReason: 'N/A' };
    const rosterChanges = recapData?.rosterChanges ?? { graduating: [], drafted: [], transferringOut: [], returningStarters: 0 };
    const cpi = recapData?.cpi;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                backgroundColor: 'rgba(15,23,42,0.85)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '95vw',
                    maxWidth: '1100px',
                    maxHeight: '95vh',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '10px 10px 0 #0f172a',
                    border: '4px solid #0f172a',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* HEADER */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '4px solid #0f172a',
                    background: '#e2e8f0',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                }}>
                    {logoUrl && (
                        <img src={logoUrl} alt="" style={{ width: '80px', height: '80px', objectFit: 'contain', opacity: 0.9 }} />
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>{teamName}</div>
                            <span style={{...infoPill, background: teamPrimary, color: bestTextColor(teamPrimary), borderColor: '#0f172a' }}>
                                {results.wins}-{results.losses}
                            </span>
                            {cpi && (
                                <span style={infoPill}>
                                    CPI: {cpi.score}
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>
                            Season Recap • Coach {coachName}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                            <span style={infoPill}>Conference: {results.conferenceRecord} ({results.conferenceFinish}{getOrdinal(results.conferenceFinish)})</span>
                            <span style={infoPill}>Postseason: {results.postSeasonResult}</span>
                            <span style={infoPill}>Final Rank: {results.finalRank > 0 ? `#${results.finalRank}` : 'NR'}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            border: '2px solid #0f172a',
                            background: '#fde047',
                            boxShadow: '2px 2px 0 #0f172a',
                            cursor: 'pointer',
                            color: '#0f172a',
                            fontWeight: 900,
                            fontSize: '18px',
                        }}
                        aria-label="Close"
                    >
                        X
                    </button>
                </div>

                {/* NAV TABS */}
                <div style={{ display: 'flex', gap: '10px', padding: '12px 24px', borderBottom: '2px solid #cbd5e1', background: '#e2e8f0' }}>
                    <button style={tabButton(activeTab === 'OVERVIEW')} onClick={() => setActiveTab('OVERVIEW')}>Overview</button>
                    {cpi && <button style={tabButton(activeTab === 'CPI')} onClick={() => setActiveTab('CPI')}>Coach Analysis</button>}
                    <button style={tabButton(activeTab === 'RECRUITING')} onClick={() => setActiveTab('RECRUITING')}>Recruiting</button>
                    <button style={tabButton(activeTab === 'FINANCES')} onClick={() => setActiveTab('FINANCES')}>Finances</button>
                </div>

                {/* CONTENT */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {activeTab === 'OVERVIEW' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={sectionCard}>
                                    <div style={{ ...statLabel, marginBottom: '10px' }}>PRESTIGE UPDATE</div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                        <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{prestigeChange.current}</div>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: (prestigeChange.delta ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                                            {(prestigeChange.delta ?? 0) >= 0 ? '+' : ''}{prestigeChange.delta ?? 0}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>from {prestigeChange.previous}</span>
                                    </div>
                                    <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic', color: '#475569' }}>
                                        Primary logic: {prestigeChange.primaryReason}
                                    </div>
                                </div>

                                <div style={sectionCard}>
                                    <div style={{ ...statLabel, marginBottom: '10px' }}>ROSTER MOVEMENT</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={statLabel}>Graduating</span><span style={statValue}>{rosterChanges.graduating.length}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={statLabel}>Drafted</span><span style={statValue}>{rosterChanges.drafted.length}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={statLabel}>Transfers Out</span><span style={statValue}>{rosterChanges.transferringOut.length}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={statLabel}>Run It Back</span><span style={statValue}>{rosterChanges.returningStarters} Starters</span></div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'CPI' && cpi && (
                        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'stretch' }}>
                            <div style={{ ...sectionCard, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    background: `conic-gradient(${getErrorColor(cpi.score)} ${cpi.score}%, #e5e7eb 0)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <div style={{
                                        width: '96px',
                                        height: '96px',
                                        borderRadius: '50%',
                                        background: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                    }}>
                                        <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{cpi.score}</span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>CPI SCORE</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{cpi.grade}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Performance Grade</div>
                                </div>
                                <div style={{
                                    padding: '8px 16px',
                                    borderRadius: '999px',
                                    background: getSecurityStyle(cpi.security).bg,
                                    color: getSecurityStyle(cpi.security).text,
                                    fontWeight: 800,
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                }}>
                                    Job Security: {cpi.security}
                                </div>
                            </div>

                            <div style={{ ...sectionCard, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ ...statLabel, marginBottom: '12px' }}>PERFORMANCE FACTORS</div>
                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {cpi.components.map((comp, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px',
                                            background: '#ffffff',
                                            borderRadius: '6px',
                                            borderLeft: `4px solid ${comp.score >= 0 ? '#22c55e' : '#ef4444'}`,
                                            border: '1px solid #e2e8f0',
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{comp.label}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{comp.reason}</div>
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 900, color: comp.score >= 0 ? '#15803d' : '#b91c1c' }}>
                                                {comp.score >= 0 ? '+' : ''}{comp.score}
                                            </div>
                                        </div>
                                    ))}
                                    {cpi.components.length === 0 && (
                                        <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '20px' }}>
                                            No major performance factors recorded.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'RECRUITING' && (
                        <div style={sectionCard}>
                            <div style={{ ...statLabel, marginBottom: '12px' }}>RECRUITING CLASS OVERVIEW</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
                                <div><div style={statLabel}>Class Rank</div><div style={statValue}>#{recruiting.classRank || 'N/A'}</div></div>
                                <div><div style={statLabel}>Class Size</div><div style={statValue}>{recruiting.classSize}</div></div>
                                <div style={{ gridColumn: 'span 2' }}><div style={statLabel}>Top Recruit</div><div style={statValue}>{recruiting.topRecruit}</div></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'FINANCES' && (
                        <div style={sectionCard}>
                            <div style={{ ...statLabel, marginBottom: '12px' }}>FINANCIAL SUMMARY</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
                                <div><div style={statLabel}>Total Revenue</div><div style={statValue}>{formatMoney(financials.totalRevenue)}</div></div>
                                <div><div style={statLabel}>Net Income</div><div style={{...statValue, color: financials.netIncome >= 0 ? '#22c55e' : '#ef4444'}}>{formatMoney(financials.netIncome)}</div></div>
                                <div style={{ gridColumn: 'span 2' }}><div style={statLabel}>Primary Revenue Source</div><div style={statValue}>{financials.primarySource}</div></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div style={{ padding: '16px 24px', borderTop: '4px solid #0f172a', background: '#e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={actionButton} onClick={onClose}>
                        Proceed to Offseason &gt;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeasonRecapModalV3;
