import React, { useState, useMemo } from 'react';
import { GameState, Team, GameAction, TeamColors, AlumniProfile, AlumniArchetype, DonorDilemma } from './types';
import { BASE_CALENDAR_YEAR } from './constants';

interface AlumniTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

type SortField = 'name' | 'graduationSeason' | 'donationTier' | 'sentiment';
type SortDirection = 'asc' | 'desc';

const AlumniTab: React.FC<AlumniTabProps> = ({ state, userTeam, dispatch, colors }) => {
    const [sortField, setSortField] = useState<SortField>('graduationSeason');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const wealth = userTeam.wealth || {
        endowmentScore: 50,
        donationLevel: 50,
        boosterPool: 100,
        donorMomentum: 0
    };

    const archetypeCounts = useMemo(() => {
        const counts: Record<AlumniArchetype, number> = { Tech: 0, Finance: 0, Local: 0, Political: 0 };
        userTeam.alumniRegistry?.allAlumni.forEach(a => {
            if (counts[a.archetype] !== undefined) counts[a.archetype]++;
        });
        return counts;
    }, [userTeam.alumniRegistry]);

    const activeInfluence = userTeam.alumniRegistry?.activeInfluence;
    const activeDilemma = userTeam.alumniRegistry?.activeDilemma;

    const handleDilemmaOption = (optionIndex: number) => {
        dispatch({ 
            type: 'RESOLVE_DILEMMA', 
            payload: { optionIndex } 
        });
    };

    const handleAction = (actionType: string, alumId?: string) => {
        dispatch({ 
            type: 'ALUMNI_ACTION', 
            payload: { actionType, alumId } 
        });
        // Visual feedback
        if (alumId) {
            alert(`${actionType === 'INVITE_GAME' ? 'Invited to game' : 'Asked for donation'}!`);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedAlumni = useMemo(() => {
        const alumni = userTeam.alumniRegistry?.allAlumni || [];
        return [...alumni].sort((a, b) => {
            let valA: any = a[fieldToProp(sortField)];
            let valB: any = b[fieldToProp(sortField)];

            // Custom sort for donation tier
            if (sortField === 'donationTier') {
                const tiers = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
                valA = tiers[a.donationTier] || 0;
                valB = tiers[b.donationTier] || 0;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [userTeam.alumniRegistry, sortField, sortDirection]);

    const paginatedAlumni = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAlumni.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAlumni, currentPage]);

    const totalPages = Math.ceil((userTeam.alumniRegistry?.allAlumni.length || 0) / itemsPerPage);

    function fieldToProp(field: SortField): keyof AlumniProfile {
        switch (field) {
            case 'name': return 'name';
            case 'graduationSeason': return 'graduationSeason';
            case 'sentiment': return 'sentiment';
            default: return 'name';
        }
    }

    // Helper to format class year (e.g., 2024 -> "2023-24")
    const formatClassYear = (seasonIndex: number) => {
        const startYear = BASE_CALENDAR_YEAR + seasonIndex;
        return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
    };

    const styles = {
        container: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 2fr',
            gap: '2rem',
            height: '100%',
            fontFamily: "'Press Start 2P', cursive",
        } as React.CSSProperties,
        card: {
            backgroundColor: '#ffffff',
            border: `4px solid ${colors.primary}`,
            padding: '1.5rem',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            position: 'relative',
            zIndex: 10,
            isolation: 'isolate',
            height: 'fit-content',
        } as React.CSSProperties,
        tableCard: {
            backgroundColor: '#ffffff',
            border: `4px solid ${colors.primary}`,
            padding: '1.5rem',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative',
            zIndex: 10,
            isolation: 'isolate',
            height: '100%',
            overflow: 'hidden',
        } as React.CSSProperties,
        sectionTitle: {
            fontSize: '0.9rem',
            fontWeight: 700,
            color: colors.primary,
            borderBottom: `4px solid ${colors.secondary}`,
            paddingBottom: '0.75rem',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
        } as React.CSSProperties,
        actionButton: (color: string) => ({
            width: '100%',
            padding: '1rem',
            border: '4px solid #000',
            backgroundColor: color,
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.7rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'transform 0.1s, box-shadow 0.2s',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
            fontFamily: "'Press Start 2P', cursive",
            marginBottom: '1rem',
        } as React.CSSProperties),
        metricCard: {
            backgroundColor: colors.secondary,
            padding: '1.5rem',
            border: '4px solid #000',
            textAlign: 'center',
            color: colors.text,
            boxShadow: '4px 4px 0 rgba(0,0,0,0.1)',
        } as React.CSSProperties,
        metricValue: {
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '1rem 0',
            textShadow: '2px 2px 0 rgba(0,0,0,0.1)',
        } as React.CSSProperties,
        metricLabel: {
            fontSize: '0.6rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.8,
        } as React.CSSProperties,
        momentumBar: {
            height: '16px',
            backgroundColor: '#ddd',
            border: '2px solid #000',
            marginTop: '1rem',
            position: 'relative',
        } as React.CSSProperties,
        momentumFill: {
            height: '100%',
            width: `${Math.min(100, Math.max(0, 50 + wealth.donorMomentum))}%`,
            backgroundColor: wealth.donorMomentum > 0 ? '#4caf50' : wealth.donorMomentum < 0 ? '#f44336' : '#9e9e9e',
            transition: 'width 0.3s ease',
        } as React.CSSProperties,
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.6rem',
        } as React.CSSProperties,
        th: {
            backgroundColor: colors.primary,
            color: '#fff',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            border: '4px solid #000',
            textTransform: 'uppercase',
            userSelect: 'none',
        } as React.CSSProperties,
        td: {
            padding: '0.75rem',
            border: '2px solid #ccc',
            backgroundColor: '#fff',
            verticalAlign: 'middle',
        } as React.CSSProperties,
        pagination: {
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: 'auto',
            paddingTop: '1rem',
            alignItems: 'center',
        } as React.CSSProperties,
        pageButton: (disabled: boolean) => ({
            padding: '0.5rem 1rem',
            border: '2px solid #000',
            backgroundColor: disabled ? '#ddd' : '#fff',
            color: disabled ? '#888' : '#000',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.6rem',
            boxShadow: disabled ? 'none' : '2px 2px 0 rgba(0,0,0,0.1)',
        } as React.CSSProperties),
        smallBtn: (color: string) => ({
            padding: '0.4rem 0.6rem',
            border: '2px solid #000',
            backgroundColor: color,
            color: '#fff',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.5rem',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
            marginRight: '0.5rem',
        } as React.CSSProperties),
    };

    return (
        <div style={styles.container}>
            {/* Left Column: Actions & Summary */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Program Wealth</h2>

                    {/* Equity Pools Dashboard */}
                    {userTeam.alumniRegistry?.equityPools ? (
                         <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            {userTeam.alumniRegistry.equityPools.map(pool => (
                                <div key={pool.name}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem'}}>
                                        <label style={{fontSize: '0.6rem', fontWeight: 'bold'}}>{pool.name}</label>
                                        <span style={{fontSize: '0.6rem', color: '#666'}}>
                                            ${(pool.balance / 1000000).toFixed(1)}M / ${(pool.target / 1000000).toFixed(1)}M
                                        </span>
                                    </div>
                                    <div style={{height: '12px', backgroundColor: '#eee', border: '1px solid #999', position: 'relative'}}>
                                        <div style={{
                                            height: '100%', 
                                            width: `${Math.min(100, (pool.balance / pool.target) * 100)}%`,
                                            backgroundColor: pool.status === 'Locked' ? '#9e9e9e' : 
                                                             pool.status === 'PayoutAvailable' ? '#ffd700' : '#4caf50',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    <div style={{fontSize: '0.5rem', marginTop: '0.2rem', color: '#888'}}>
                                        {pool.status === 'PayoutAvailable' ? 'Ready for Payout!' : 
                                         pool.status === 'Locked' ? 'Locked (Low Prestige)' : 'Accumulating...'}
                                    </div>
                                </div>
                            ))}
                         </div>
                    ) : (
                        // Fallback for legacy save data
                        <div style={{marginTop: '2rem'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                <label style={{fontSize: '0.7rem'}}>Donor Momentum</label>
                                <span style={{fontWeight: 'bold', color: wealth.donorMomentum > 0 ? '#4caf50' : '#f44336', fontSize: '0.7rem'}}>
                                    {wealth.donorMomentum > 0 ? '+' : ''}{wealth.donorMomentum}
                                </span>
                            </div>
                            <div style={styles.momentumBar}>
                                <div style={styles.momentumFill} />
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Donor Relations</h2>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <button onClick={() => handleAction('HOST_GALA')} style={styles.actionButton('#9c27b0')}>
                            <span>Host Fundraising Gala</span>
                            <span style={{fontSize: '0.6rem'}}>Cost: $50k</span>
                        </button>
                        <p style={{fontSize: '0.5rem', color: '#666', marginBottom: '1rem', fontFamily: "'Press Start 2P', cursive"}}>
                            Boosts donor momentum significantly. Best used after big wins.
                        </p>

                        <button onClick={() => handleAction('ASK_DONATION')} style={styles.actionButton('#2196f3')}>
                            <span>Launch Capital Campaign</span>
                            <span style={{fontSize: '0.6rem'}}>Cost: $10k</span>
                        </button>
                        <p style={{fontSize: '0.5rem', color: '#666', marginBottom: '1rem', fontFamily: "'Press Start 2P', cursive"}}>
                            Direct ask for facility upgrades. Success depends on sentiment.
                        </p>

                        <button onClick={() => handleAction('INVITE_PRACTICE')} style={styles.actionButton('#ff9800')}>
                            <span>Invite Boosters to Practice</span>
                            <span style={{fontSize: '0.6rem'}}>Free</span>
                        </button>
                        <p style={{fontSize: '0.5rem', color: '#666', marginBottom: '1rem', fontFamily: "'Press Start 2P', cursive"}}>
                            Improves sentiment but may distract players slightly.
                        </p>
                    </div>
                </div>
            </div>

            {/* Middle Column: Network Stats & Influence */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Alumni Network</h2>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                        {Object.entries(archetypeCounts).map(([type, count]) => (
                            <div key={type} style={{textAlign: 'center', padding: '0.5rem', border: '2px solid #eee'}}>
                                <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{count}</div>
                                <div style={{fontSize: '0.6rem', color: '#666'}}>{type}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.card}>
                    <h2 style={styles.sectionTitle}>Active Influence</h2>
                    {activeInfluence ? (
                        <div style={{fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                            {activeInfluence.scoutingEfficiency > 0 && (
                                <div style={{color: '#2196f3'}}>
                                    <strong>Tech:</strong> +{activeInfluence.scoutingEfficiency}% Scouting Efficiency
                                </div>
                            )}
                            {activeInfluence.endowmentYield > 0 && (
                                <div style={{color: '#4caf50'}}>
                                    <strong>Finance:</strong> +{activeInfluence.endowmentYield}% Endowment Yield
                                </div>
                            )}
                            {activeInfluence.academicPrestigeBonus > 0 && (
                                <div style={{color: '#4caf50'}}>
                                    <strong>Finance/Tech:</strong> +{activeInfluence.academicPrestigeBonus} Academic Prestige
                                </div>
                            )}
                            {activeInfluence.facilitySpeed > 0 && (
                                <div style={{color: '#9c27b0'}}>
                                    <strong>Political:</strong> +{activeInfluence.facilitySpeed}% Facility Speed
                                </div>
                            )}
                            {activeInfluence.jobSecurityBonus > 0 && (
                                <div style={{color: '#9c27b0'}}>
                                    <strong>Political:</strong> +{activeInfluence.jobSecurityBonus} Job Security
                                </div>
                            )}
                            {activeInfluence.mediaProtection > 0 && (
                                <div style={{color: '#ff9800'}}>
                                    <strong>Local:</strong> +{activeInfluence.mediaProtection}% Media Protection
                                </div>
                            )}
                            {Object.keys(activeInfluence.recruitingBonus).length > 0 && (
                                <div style={{color: '#607d8b', marginTop: '0.5rem'}}>
                                    <strong>Pipeline Bonuses:</strong>
                                    {Object.entries(activeInfluence.recruitingBonus).map(([state, bonus]) => (
                                        <div key={state} style={{paddingLeft: '0.5rem', fontSize: '0.6rem'}}>
                                            {state}: +{bonus} Interest
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{fontSize: '0.7rem', color: '#888'}}>No influence data available.</div>
                    )}
                </div>

                {activeDilemma && (
                    <div style={{...styles.card, borderColor: '#f44336', backgroundColor: '#fff8f8'}}>
                        <h2 style={{...styles.sectionTitle, color: '#d32f2f'}}>⚠ Donor Dilemma</h2>
                        <div style={{fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem'}}>{activeDilemma.title}</div>
                        <p style={{fontSize: '0.6rem', marginBottom: '1rem'}}>{activeDilemma.description}</p>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                            {activeDilemma.options.map((option, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleDilemmaOption(idx)}
                                    style={{
                                        padding: '0.5rem',
                                        border: '2px solid #d32f2f',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '0.6rem'
                                    }}
                                >
                                    <div style={{fontWeight: 'bold'}}>{option.label}</div>
                                    <div style={{fontSize: '0.5rem', color: '#666'}}>{option.effectDescription}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Alumni Table */}
            <div style={styles.tableCard}>
                <h2 style={styles.sectionTitle}>Alumni Registry</h2>
                
                <div style={{flex: 1, overflow: 'auto'}}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th} onClick={() => handleSort('name')}>
                                    Alumnus {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th style={styles.th} onClick={() => handleSort('graduationSeason')}>
                                    Class {sortField === 'graduationSeason' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th style={styles.th}>Career</th>
                                <th style={styles.th} onClick={() => handleSort('donationTier')}>
                                    Wealth {sortField === 'donationTier' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th style={styles.th} onClick={() => handleSort('sentiment')}>
                                    Sentiment {sortField === 'sentiment' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAlumni.length > 0 ? (
                                paginatedAlumni.map((alum, index) => {
                                    const isPro = alum.proStatus === 'drafted' || alum.proStatus === 'pro_success' || alum.proStatus === 'overseas' || alum.proStatus === 'retired_pro';
                                    return (
                                        <tr key={alum.id} style={{backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'}}>
                                            <td style={styles.td}>
                                                <div style={{fontWeight: 'bold'}}>{alum.name}</div>
                                                {isPro && <div style={{fontSize: '0.5rem', color: '#666'}}>{alum.position}</div>}
                                            </td>
                                            <td style={styles.td}>{formatClassYear(alum.graduationSeason)}</td>
                                            <td style={styles.td}>
                                                {alum.proStatus === 'drafted' || alum.proStatus === 'pro_success' ? (
                                                    <span style={{color: '#ff9800', fontWeight: 'bold'}}>🏀 NBA ({alum.nbaTeam || 'Active'})</span>
                                                ) : alum.proStatus === 'overseas' ? (
                                                    <span style={{color: '#2196f3'}}>🌍 {alum.internationalTeam || 'Overseas'}</span>
                                                ) : alum.proStatus === 'retired_pro' ? (
                                                    <span style={{color: '#9c27b0', fontWeight: 'bold'}}>🏁 Former Pro</span>
                                                ) : (
                                                    <span style={{color: '#555'}}>{alum.profession || 'Alumnus'}</span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    color: alum.donationTier === 'high' ? '#4caf50' : 
                                                           alum.donationTier === 'medium' ? '#2196f3' : '#9e9e9e',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {alum.donationTier.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                                    <div style={{
                                                        width: '30px', 
                                                        height: '6px', 
                                                        backgroundColor: '#ddd', 
                                                        border: '1px solid #000'
                                                    }}>
                                                        <div style={{
                                                            width: `${alum.sentiment}%`, 
                                                            height: '100%', 
                                                            backgroundColor: alum.sentiment > 70 ? '#4caf50' : '#f44336'
                                                        }} />
                                                    </div>
                                                    <span>{alum.sentiment}</span>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{display: 'flex'}}>
                                                    <button 
                                                        style={styles.smallBtn('#4caf50')} 
                                                        onClick={() => handleAction('INVITE_GAME', alum.id)}
                                                        title="Invite to Game"
                                                    >
                                                        INVITE
                                                    </button>
                                                    <button 
                                                        style={styles.smallBtn('#2196f3')} 
                                                        onClick={() => handleAction('ASK_DONATION_ALUM', alum.id)}
                                                        title="Ask for Donation"
                                                    >
                                                        ASK
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{...styles.td, textAlign: 'center', padding: '2rem'}}>
                                        No alumni records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={styles.pagination}>
                        <button 
                            style={styles.pageButton(currentPage === 1)} 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            PREV
                        </button>
                        <span style={{fontSize: '0.7rem'}}>Page {currentPage} of {totalPages}</span>
                        <button 
                            style={styles.pageButton(currentPage === totalPages)} 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            NEXT
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlumniTab;
