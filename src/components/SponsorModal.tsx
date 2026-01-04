import React, { useState, useMemo } from 'react';
import { Team, SponsorName, TeamColors, SponsorData, SponsorOffer } from '../types';
import { createSponsorFromName, calculateSponsorRevenueSnapshot } from '../services/gameService';
import { SPONSOR_SLOGANS } from '../constants';
import { teamColor, bestTextColor, clamp } from '../services/utils';

// Brand Logos
import NikeLogo from '../BRAND LOGOS/Logo_NIKE.svg';
import AdidasLogo from '../BRAND LOGOS/Adidas_2022_logo.svg';
import JordanLogo from '../BRAND LOGOS/Jumpman_logo.svg';
import UnderArmourLogo from '../BRAND LOGOS/Under_armour_logo.svg';
import PumaLogo from '../BRAND LOGOS/Puma-logo-(text).svg';
import ReebokLogo from '../BRAND LOGOS/Reebok_wordmark_(1977–1993).svg';
import NewBalanceLogo from '../BRAND LOGOS/20160801155104!New_Balance_logo.svg';

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

// --- SPONSORSHIP 2.0 CONFIGURATION ---
type BrandPerk = { name: string; description: string; effect: string; icon: string };
type BrandConfig = { color: string; accent: string; perk: BrandPerk; description: string; logoStyle: React.CSSProperties; logoSrc: string };

const SPONSOR_CONFIG: Record<SponsorName, BrandConfig> = {
    'Nike': {
        color: '#111111',
        accent: '#fbbf24', // Gold
        perk: { name: 'Global Icon', description: 'Massive recruiting reach bonus.', effect: '+15% Interest (Non-Pipeline)', icon: '🌍' },
        description: 'The undisputed king of sportswear. Nike demands success but offers unparalleled visibility.',
        logoStyle: { fontFamily: 'Impact, sans-serif', letterSpacing: '-1px', fontStyle: 'italic' },
        logoSrc: NikeLogo
    },
    'Jordan': {
        color: '#ef4444',
        accent: '#000000',
        perk: { name: 'Jumpman Factor', description: 'Elite prestige magnet.', effect: '+20% 5-Star Interest', icon: '🐐' },
        description: 'Reserved for the elite. The Jumpman logo is a status symbol that attracts top-tier talent.',
        logoStyle: { fontFamily: 'Impact, sans-serif', letterSpacing: '2px' },
        logoSrc: JordanLogo
    },
    'Adidas': {
        color: '#3b82f6', // Blue
        accent: '#ffffff',
        perk: { name: '3SSB Circuit', description: 'Deep grassroots connections.', effect: '+1 Pipeline Tier Speed', icon: '⚡' },
        description: 'A global powerhouse with deep roots in grassroots basketball and international markets.',
        logoStyle: { fontFamily: 'Arial Black, sans-serif', letterSpacing: '-1px', textTransform: 'lowercase' },
        logoSrc: AdidasLogo
    },
    'Under Armour': {
        color: '#000000',
        accent: '#ffffff',
        perk: { name: 'The Grind', description: 'Focus on hard work.', effect: '+5% Player Dev Rate', icon: '🛡️' },
        description: 'Built for the underdog who outworks the competition. No frills, just performance.',
        logoStyle: { fontFamily: 'Impact, sans-serif', letterSpacing: '1px' },
        logoSrc: UnderArmourLogo
    },
    'Puma': {
        color: '#f97316', // Orange
        accent: '#111111',
        perk: { name: 'Disruptor', description: 'Flashy and aggressive.', effect: '+10% NIL Budget Pot', icon: '🐆' },
        description: 'The new cool. Puma targets the bold and the creative, bringing fashion to the court.',
        logoStyle: { fontFamily: 'Courier New, monospace', fontWeight: 900 },
        logoSrc: PumaLogo
    },
    'New Balance': {
        color: '#dc2626', // Red
        accent: '#ffffff',
        perk: { name: 'Intelligent Choice', description: 'Smart and steady.', effect: '+10% Academic Interest', icon: '👟' },
        description: 'No nonsense excellence. Appeals to players who let their game do the talking.',
        logoStyle: { fontFamily: 'Arial, sans-serif', fontWeight: 900, fontStyle: 'italic' },
        logoSrc: NewBalanceLogo
    },
    'Reebok': {
        color: '#6366f1', // Indigo
        accent: '#ffffff',
        perk: { name: 'Heritage', description: 'Retro cool factor.', effect: '+5 Fan Loyalty', icon: '🇬🇧' },
        description: 'A classic brand making a comeback. Leveraging nostalgia and street cred.',
        logoStyle: { fontFamily: 'Arial Black, sans-serif', letterSpacing: '1px' },
        logoSrc: ReebokLogo
    }
};

// --- NEOBRUTALIST STYLES ---
const styles = {
    modalOverlay: {
        position: 'fixed' as const,
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        backgroundColor: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)',
    },
    modalContent: {
        width: '95vw',
        maxWidth: '1400px',
        height: '90vh',
        background: '#f8fafc',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '12px 12px 0 #0f172a',
        border: '4px solid #0f172a',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    closeButton: {
        position: 'absolute' as const,
        top: '16px',
        right: '16px',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        border: '3px solid #0f172a',
        background: '#fde047',
        boxShadow: '4px 4px 0 #0f172a',
        cursor: 'pointer',
        color: '#0f172a',
        fontWeight: 900,
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        transition: 'transform 0.1s',
    },
    // Layout
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(350px, 1fr) 2fr',
        height: '100%',
        overflow: 'hidden',
    },
    leftPanel: {
        background: '#f1f5f9',
        borderRight: '3px solid #0f172a',
        display: 'flex',
        flexDirection: 'column' as const,
        overflowY: 'auto' as const,
        padding: '24px',
    },
    rightPanel: {
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column' as const,
        overflowY: 'auto' as const,
        position: 'relative' as const,
    },
    // Typography
    headingLg: {
        fontSize: '32px',
        fontWeight: 900,
        color: '#0f172a',
        textTransform: 'uppercase' as const,
        letterSpacing: '-0.03em',
        lineHeight: 0.9,
    },
    headingMd: {
        fontSize: '18px',
        fontWeight: 800,
        color: '#0f172a',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
    },
    label: {
        fontSize: '11px',
        fontWeight: 800,
        color: '#64748b',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom: '4px',
    },
    // Components
    cardSelectable: (active: boolean, brandColor: string) => ({
        background: active ? '#ffffff' : '#e2e8f0',
        borderRadius: '12px',
        border: active ? `3px solid ${brandColor}` : '3px solid transparent',
        padding: '16px',
        cursor: 'pointer',
        marginBottom: '12px',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: active ? 'translateX(8px)' : 'none',
        boxShadow: active ? `4px 4px 0 #0f172a` : 'none',
        opacity: active ? 1 : 0.8,
    }),
    pill: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 800,
        border: '2px solid #0f172a',
        boxShadow: '2px 2px 0 rgba(15,23,42,0.1)',
        textTransform: 'uppercase' as const,
    },
    barChartContainer: {
        height: '24px',
        width: '100%',
        background: '#e2e8f0',
        borderRadius: '6px',
        border: '2px solid #0f172a',
        overflow: 'hidden',
        display: 'flex',
    },
    barSegment: (color: string, percent: number) => ({
        height: '100%',
        width: `${percent}%`,
        background: color,
        borderRight: '1px solid rgba(0,0,0,0.1)',
    }),
};

const SponsorModal = ({ team, allTeams, sponsors, colors, onClose, onAcceptOffer }: SponsorModalProps) => {
    // Determine the initially selected sponsor: Pending Offer -> Current Sponsor -> Nike
    const initialSelection = useMemo(() => {
        if (team.sponsorOffers.length > 0) return team.sponsorOffers[0].sponsorName;
        return team.sponsor?.name || 'Nike';
    }, [team]);

    const [selectedBrandName, setSelectedBrandName] = useState<SponsorName>(initialSelection as SponsorName);

    // --- Derived Data ---
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

    // Data for the SELECTED brand
    const selectedBrandData = useMemo(() => {
        const sponsorData = sponsors[selectedBrandName];
        if (!sponsorData) return null;

        const config = SPONSOR_CONFIG[selectedBrandName];
        const tempSponsor = createSponsorFromName(selectedBrandName, sponsors);
        const revenueSnapshot = calculateSponsorRevenueSnapshot({ ...team, sponsor: tempSponsor });
        
        // Calculate "Synergy" (Fit Score)
        const teamPrestige = team.prestige;
        const tierTargets: Record<string, number> = { Elite: 88, High: 82, Mid: 72, Low: 60 };
        const targetPrestige = tierTargets[sponsorData.tier] || 60;
        const prestigeFit = clamp(100 - Math.abs(teamPrestige - targetPrestige) * 1.5, 20, 100);
        // Market fit (randomized variance for now, represents demographics)
        const marketFit = clamp(prestigeFit + (team.marketSize || 3) * 5, 0, 100);
        const synergyScore = Math.round((prestigeFit + marketFit) / 2);

        // Schools List
        const schools = allTeams.filter(t => t.sponsor?.name === selectedBrandName).map(t => t.name).sort();

        // Check if there is a pending offer for this brand
        const pendingOffer = team.sponsorOffers.find(o => o.sponsorName === selectedBrandName);

        // Current status
        const isCurrent = team.sponsor?.name === selectedBrandName;

        return {
            ...sponsorData,
            config,
            revenue: revenueSnapshot,
            synergy: synergyScore,
            schools,
            pendingOffer,
            isCurrent,
            metrics: sponsorMetrics.metrics.get(selectedBrandName) || { totalRevenue: 0 }
        };
    }, [selectedBrandName, team, sponsors, allTeams, sponsorMetrics]);

    if (!selectedBrandData) return null;

    const { config, revenue, pendingOffer, isCurrent } = selectedBrandData;

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button style={styles.closeButton} onClick={onClose}>×</button>
                
                <div style={styles.mainGrid}>
                    {/* --- LEFT PANEL: MARKET LANDSCAPE (SELECTOR) --- */}
                    <div style={styles.leftPanel}>
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={styles.headingLg}>Sponsorship<br/>Hub</h2>
                            <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                                Review the market, compare perks, and manage your program's brand identity.
                            </div>
                        </div>

                        {/* Current Sponsor Status Card */}
                        <div style={{ 
                            ...styles.sectionCard, 
                            borderLeft: `5px solid ${colors.primary}`, 
                            marginBottom: '32px',
                            background: '#ffffff',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '3px solid #cbd5e1',
                            boxShadow: '4px 4px 0 #cbd5e1'
                        }}>
                            <div style={styles.label}>Current Partner</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{team.sponsor?.name || 'None'}</div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: colors.primary }}>
                                    {team.name === 'Oregon' && team.sponsor?.name === 'Nike' 
                                        ? 'Lifetime Contract' 
                                        : `${team.sponsorContractYearsRemaining} Yrs Left`
                                    }
                                </div>
                            </div>
                        </div>

                        <div style={styles.label}>Market Landscape</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(Object.keys(sponsors) as SponsorName[]).sort((a,b) => (sponsors[b]?.marketShare||0) - (sponsors[a]?.marketShare||0)).map(name => {
                                const data = sponsors[name];
                                if(!data) return null;
                                const isActive = selectedBrandName === name;
                                const brandConf = SPONSOR_CONFIG[name];
                                const hasOffer = team.sponsorOffers.some(o => o.sponsorName === name);

                                return (
                                    <div 
                                        key={name}
                                        onClick={() => setSelectedBrandName(name)}
                                        style={styles.cardSelectable(isActive, brandConf.color)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {name}
                                                {hasOffer && (
                                                    <span style={{ fontSize: '10px', background: '#22c55e', color: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #14532d' }}>OFFER</span>
                                                )}
                                                {team.sponsor?.name === name && (
                                                    <span style={{ fontSize: '10px', background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #b45309' }}>CURRENT</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                                                {(data.marketShare * 100).toFixed(1)}% Share
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* --- RIGHT PANEL: BRAND DEEP DIVE --- */}
                    <div style={styles.rightPanel}>
                        {/* Dynamic Hero Header */}
                        <div style={{ 
                            background: config.color, 
                            color: config.accent,
                            padding: '40px',
                            minHeight: '220px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            position: 'relative',
                            borderBottom: '4px solid #0f172a'
                        }}>
                            <img 
                                src={config.logoSrc}
                                style={{ 
                                    position: 'absolute', 
                                    top: '20px', 
                                    right: '20px', 
                                    height: '240px',
                                    opacity: 0.1, 
                                    filter: 'brightness(0) invert(1)',
                                    pointerEvents: 'none',
                                    userSelect: 'none' 
                                }}
                                alt=""
                            />
                            
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
                                <div style={{ fontSize: '64px', lineHeight: 0.8, ...config.logoStyle }}>
                                    {selectedBrandName}
                                </div>
                                <div style={{ 
                                    padding: '6px 12px', 
                                    background: '#ffffff', 
                                    color: config.color, 
                                    fontWeight: 900, 
                                    borderRadius: '6px', 
                                    fontSize: '14px',
                                    border: '2px solid #000',
                                    boxShadow: '4px 4px 0 rgba(0,0,0,0.3)'
                                }}>
                                    {selectedBrandData.tier} Tier
                                </div>
                            </div>
                            
                            <div style={{ fontSize: '18px', fontStyle: 'italic', fontWeight: 600, opacity: 0.9, maxWidth: '600px', lineHeight: 1.4 }}>
                                "{SPONSOR_SLOGANS[selectedBrandName]}"
                            </div>
                        </div>

                        {/* Dashboard Content */}
                        <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '40px' }}>
                            
                            {/* Column 1: Financials & Synergy */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                
                                {/* Estimated Value Section */}
                                <div style={{ ...styles.sectionCard, padding: '24px', border: '3px solid #0f172a', boxShadow: '8px 8px 0 #0f172a' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                                        <div>
                                            <div style={styles.label}>Estimated Annual Value</div>
                                            <div style={{ fontSize: '42px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                                                {formatCurrency(revenue.total)}
                                                {pendingOffer && (
                                                    <span style={{ fontSize: '14px', color: '#22c55e', marginLeft: '10px', verticalAlign: 'middle' }}>
                                                        (Offer Pending)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={styles.label}>Brand Synergy</div>
                                            <div style={{ fontSize: '24px', fontWeight: 900, color: selectedBrandData.synergy > 75 ? '#16a34a' : '#f59e0b' }}>
                                                {selectedBrandData.synergy}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Synergy Meter */}
                                    <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', border: '2px solid #0f172a', overflow: 'hidden', marginBottom: '24px' }}>
                                        <div style={{ width: `${selectedBrandData.synergy}%`, height: '100%', background: config.color }}></div>
                                    </div>

                                    {/* Revenue Breakdown */}
                                    <div style={styles.label}>Revenue Structure</div>
                                    <div style={styles.barChartContainer}>
                                        <div style={styles.barSegment(config.color, 60)} title="Base Pay" />
                                        <div style={styles.barSegment(config.accent === '#ffffff' ? '#94a3b8' : config.accent, 25)} title="Royalties" />
                                        <div style={styles.barSegment('#22c55e', 15)} title="Bonuses" />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                                        <span>Base Pay ({formatCurrency(revenue.jersey)})</span>
                                        <span>Merch Royalties</span>
                                        <span>Performance Bonus</span>
                                    </div>
                                </div>

                                {/* Active Schools */}
                                <div>
                                    <div style={{ ...styles.headingMd, marginBottom: '16px' }}>Network ({selectedBrandData.schools.length})</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedBrandData.schools.map(school => (
                                            <span key={school} style={{ 
                                                ...styles.pill, 
                                                background: school === team.name ? '#fef3c7' : '#ffffff',
                                                borderColor: school === team.name ? '#f59e0b' : '#cbd5e1'
                                            }}>
                                                {school}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Perks & Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                {/* Brand Perk Card */}
                                <div style={{ 
                                    background: config.color, 
                                    border: `3px solid ${config.color}`, 
                                    borderRadius: '12px', 
                                    padding: '24px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Watermark Logo */}
                                    <img 
                                        src={config.logoSrc}
                                        style={{
                                            position: 'absolute',
                                            top: '-10%',
                                            right: '-10%',
                                            height: '140%',
                                            opacity: 0.1,
                                            filter: 'brightness(0) invert(1)',
                                            pointerEvents: 'none'
                                        }}
                                        alt=""
                                    />
                                    
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                                        {/* Main Icon Logo */}
                                        <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img 
                                                src={config.logoSrc} 
                                                style={{ width: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
                                                alt={config.perk.name}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ ...styles.label, color: config.accent, opacity: 0.8 }}>Brand Perk</div>
                                            <div style={{ fontSize: '20px', fontWeight: 900, color: config.accent }}>{config.perk.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '14px', color: config.accent, opacity: 0.9, fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
                                        "{config.perk.description}"
                                    </div>
                                    <div style={{ 
                                        background: '#22c55e', 
                                        color: '#fff', 
                                        display: 'inline-block', 
                                        padding: '6px 12px', 
                                        borderRadius: '6px', 
                                        fontWeight: 800, 
                                        fontSize: '13px',
                                        border: '2px solid #14532d',
                                        boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        {config.perk.effect}
                                    </div>
                                </div>

                                {/* PENDING OFFER ACTION */}
                                {pendingOffer ? (
                                    <div style={{ 
                                        background: '#fff', 
                                        border: '4px solid #22c55e', 
                                        borderRadius: '12px', 
                                        padding: '24px', 
                                        boxShadow: '8px 8px 0 #15803d',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            Contract Offer Available
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
                                            {formatCurrency(pendingOffer.annualPayout)}<span style={{fontSize:'16px', color:'#64748b'}}>/yr</span>
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', marginBottom: '20px' }}>
                                            {pendingOffer.years} Year Agreement
                                        </div>
                                        <button 
                                            onClick={() => onAcceptOffer(pendingOffer)}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                background: '#22c55e',
                                                border: '3px solid #0f172a',
                                                borderRadius: '8px',
                                                fontSize: '18px',
                                                fontWeight: 900,
                                                color: '#fff',
                                                textTransform: 'uppercase',
                                                cursor: 'pointer',
                                                boxShadow: '4px 4px 0 #0f172a'
                                            }}
                                        >
                                            Sign Deal
                                        </button>
                                    </div>
                                ) : isCurrent ? (
                                    <div style={{ 
                                        background: '#f1f5f9', 
                                        border: '2px dashed #94a3b8', 
                                        borderRadius: '12px', 
                                        padding: '24px', 
                                        textAlign: 'center',
                                        color: '#64748b',
                                        fontWeight: 700
                                    }}>
                                        {team.name === 'Oregon' && team.sponsor?.name === 'Nike'
                                            ? 'Lifetime Legacy Agreement'
                                            : `Active Contract (${team.sponsorContractYearsRemaining} Years Left)`
                                        }
                                    </div>
                                ) : (
                                    <div style={{ 
                                        background: '#fff', 
                                        border: '2px solid #e2e8f0', 
                                        borderRadius: '12px', 
                                        padding: '24px', 
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontWeight: 600,
                                        fontStyle: 'italic'
                                    }}>
                                        No active offer from {selectedBrandName}. 
                                        Increase your prestige to attract their attention.
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorModal;
