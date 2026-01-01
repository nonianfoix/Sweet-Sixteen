import React, { useState, useMemo } from 'react';
import { Team, SponsorName, TeamColors, SponsorData, SponsorOffer } from '../types';
import { createSponsorFromName, calculateSponsorRevenueSnapshot } from '../services/gameService';
import { SPONSOR_SLOGANS } from '../constants';

interface SponsorModalProps {
    team: Team;
    allTeams: Team[];
    sponsors: { [key in SponsorName]?: SponsorData };
    colors: TeamColors;
    onClose: () => void;
    onAcceptOffer: (offer: SponsorOffer) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

const SponsorModal = ({ team, allTeams, sponsors, colors, onClose, onAcceptOffer }: SponsorModalProps) => {
    const [activeTab, setActiveTab] = useState<'landscape' | 'schools'>('landscape');

    const sponsorMetrics = useMemo(() => {
        const metrics = new Map<SponsorName, { totalRevenue: number }>();
        let totalLeagueSponsorRevenue = 0;

        allTeams.forEach(t => {
            const payout = t.sponsorRevenue.total;
            totalLeagueSponsorRevenue += payout;
            const current = metrics.get(t.sponsor.name) || { totalRevenue: 0 };
            metrics.set(t.sponsor.name, {
                totalRevenue: current.totalRevenue + payout,
            });
        });
        return { metrics, totalLeagueSponsorRevenue };
    }, [allTeams]);
    
    const renderSponsorLandscape = () => {
        const allSponsors = (Object.keys(sponsors) as SponsorName[]).sort((a, b) => {
            const shareA = sponsors[a]?.marketShare || 0;
            const shareB = sponsors[b]?.marketShare || 0;
            return shareB - shareA;
        });

        return (
            <div>
                <h4 style={{ ...styles.title, fontSize: '1.2rem', color: colors.primary, textShadow: 'none', marginBottom: '15px' }}>Sponsor Landscape</h4>
                <p style={{ fontSize: '0.7rem', marginBottom: '15px' }}>This shows each brand's tier, market share, and an estimated revenue breakdown if they were your team's sponsor.</p>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={styles.tableContainer}>
                    <table style={{...styles.table, fontSize: '0.6rem', minWidth: '1050px'}}>
                        <thead>
                            <tr>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Brand (Tier)</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Total Revenue</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Revenue Share</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Schools</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Avg Prestige</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Your Est. Deal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allSponsors.map(sponsorName => {
                                const sponsorData = sponsors[sponsorName];
                                if (!sponsorData) return null;

                                const tempSponsor = createSponsorFromName(sponsorName, sponsors);
                                const tempTeam = { ...team, sponsor: tempSponsor };
                                const estimatedRevenue = calculateSponsorRevenueSnapshot(tempTeam);
                                const totalRevenue = sponsorMetrics.metrics.get(sponsorName)?.totalRevenue || 0;
                                const revenueShare = sponsorMetrics.totalLeagueSponsorRevenue > 0 ? (totalRevenue / sponsorMetrics.totalLeagueSponsorRevenue) * 100 : 0;

                                // Compute average prestige for schools currently signed to this brand
                                const brandTeams = allTeams.filter(t => t.sponsor?.name === sponsorName);
                                const avgPrestige = brandTeams.length > 0 ? (brandTeams.reduce((sum, t) => sum + (t.prestige || 0), 0) / brandTeams.length) : 0;
                                return (
                                    <tr key={sponsorName}>
                                        <td style={styles.td}>{sponsorName} ({sponsorData.tier})</td>
                                        <td style={styles.td}>{formatCurrency(totalRevenue)}</td>
                                        <td style={styles.td}>{revenueShare.toFixed(1)}%</td>
                                        <td style={styles.td}>{sponsorData.sponsoredTeamCount} {sponsorName === 'Jordan' ? '/ 20' : ''}</td>
                                        <td style={styles.td}>{avgPrestige.toFixed(1)}</td>
                                        <td style={styles.td}>
                                            {formatCurrency(estimatedRevenue.total)}<br/>
                                            <span style={{fontSize: '0.5rem'}}>J:{formatCurrency(estimatedRevenue.jersey)}/S:{formatCurrency(estimatedRevenue.shoe)}/M:{formatCurrency(estimatedRevenue.merch)}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderSchoolsByBrand = () => {
        const grouped = new Map<SponsorName, string[]>();
        allTeams.forEach(t => {
            const name = t.sponsor?.name as SponsorName;
            if (!name) return;
            if (!grouped.has(name)) grouped.set(name, []);
            grouped.get(name)!.push(t.name);
        });
        const rows = (Object.keys(sponsors) as SponsorName[]).sort((a, b) => (grouped.get(b)?.length || 0) - (grouped.get(a)?.length || 0));
        return (
            <div>
                <h4 style={{ ...styles.title, fontSize: '1.2rem', color: colors.primary, textShadow: 'none', marginBottom: '15px' }}>Schools by Brand</h4>
                <p style={{ fontSize: '0.7rem', marginBottom: '15px' }}>A breakdown of which schools are currently signed to each sponsor.</p>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={styles.tableContainer}>
                        <table style={{...styles.table, fontSize: '0.6rem', minWidth: '900px'}}>
                            <thead>
                                <tr>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Brand</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Count</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Schools</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(name => (
                                    <tr key={name}>
                                        <td style={styles.td}>{name}</td>
                                        <td style={styles.td}>{grouped.get(name)?.length || 0}</td>
                                        <td style={{...styles.td, whiteSpace: 'normal'}}>
                                            {(grouped.get(name) || []).sort().join(', ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.sponsorModalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{ ...styles.title, fontSize: '1.3rem', color: colors.primary, marginBottom: '15px' }}>
                    {team.sponsorOffers.length > 0 ? 'Sponsor Offers' : 'Sponsorship'}
                </h3>
                {team.pipelines && team.pipelines.length > 0 && (
                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e0e0e0', border: '1px solid #999', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Pipeline Confidence</span>
                            <span style={{ fontSize: '0.7rem' }}>{team.pipelineStates?.join(', ') || 'None'}</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: '#ccc', marginTop: '5px', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${Math.min(100, (team.pipelines?.length || 0) * 20)}%`, 
                                height: '100%', 
                                backgroundColor: team.pipelines?.some(p => p.tier === 'Gold') ? colors.secondary : colors.primary 
                            }} />
                        </div>
                        <p style={{ fontSize: '0.6rem', marginTop: '4px', fontStyle: 'italic' }}>
                            Effective pipelines increase sponsor appeal in those regions.
                        </p>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <button style={{ ...styles.smallButton, backgroundColor: activeTab === 'landscape' ? '#FFD54F' : '#C0C0C0' }} onClick={() => setActiveTab('landscape')}>Landscape</button>
                    <button style={{ ...styles.smallButton, backgroundColor: activeTab === 'schools' ? '#FFD54F' : '#C0C0C0' }} onClick={() => setActiveTab('schools')}>Schools by Brand</button>
                </div>
                {team.sponsorOffers.length > 0 ? (
                    <div>
                        {team.sponsorOffers.map((offer, index) => {
                            const tier = createSponsorFromName(offer.sponsorName, sponsors).tier;
                            return (
                                <div key={index} style={{ ...styles.sponsorCard, borderColor: colors.secondary, backgroundColor: '#f9f9f9', color: '#333' }}>
                                    <h4 style={{ margin: '0 0 10px 0' }}>{offer.sponsorName} ({tier} Tier) - <em style={{fontSize: '0.7em'}}>{SPONSOR_SLOGANS[offer.sponsorName]}</em></h4>
                                    <p style={{ fontSize: '0.8rem', margin: '0 0 5px 0' }}>Contract Length: {offer.years} years</p>
                                    <p style={{ fontSize: '0.8rem', margin: '0 0 10px 0' }}>Yearly Value: {formatCurrency(offer.annualPayout)}</p>
                                    <button
                                        style={styles.smallButton}
                                        onClick={() => onAcceptOffer(offer)}
                                    >
                                        Accept
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    activeTab === 'landscape' ? renderSponsorLandscape() : renderSchoolsByBrand()
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    title: {
        fontFamily: "'Press Start 2P', cursive",
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    tableContainer: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.7rem',
        color: '#000000',
        minWidth: '600px',
    },
    th: {
        padding: '8px',
        border: '1px solid #000',
        textAlign: 'left',
    },
    td: {
        padding: '8px',
        border: '1px solid #ddd',
        verticalAlign: 'middle',
        color: '#000000',
    },
    smallButton: {
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.5rem',
        padding: '4px 6px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        backgroundColor: '#C0C0C0',
        color: '#000000',
        cursor: 'pointer',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    sponsorModalContent: {
        backgroundColor: '#C0C0C0',
        padding: '20px',
        border: '4px solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
    },
    modalCloseButton: {
        position: 'absolute',
        top: '5px',
        right: '5px',
        fontFamily: "'Press Start 2P', cursive",
        backgroundColor: '#C0C0C0',
        border: '2px solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        width: '25px',
        height: '25px',
        cursor: 'pointer',
    },
    sponsorCard: {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#CCCCCC',
        borderRadius: '4px',
        padding: '15px',
        marginBottom: '10px',
        backgroundColor: '#F5F5F5',
        fontSize: '0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
};

export default SponsorModal;
