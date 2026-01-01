
import React from 'react';
import { JobOffer, GameAction } from '../types';
import { SCHOOL_COLORS } from '../constants';
import { formatCurrency } from '../services/gameService';
import { getSchoolLogoUrl, bestTextColor, rgbaFromHex } from '../services/utils';

interface JobMarketModalProps {
    offers: JobOffer[];
    nbaOffers: string[];
    dispatch: React.Dispatch<GameAction>;
    powerRanks: Map<string, number>;
    onStay: () => void;
}

const JobMarketModal: React.FC<JobMarketModalProps> = ({ offers, nbaOffers, dispatch, powerRanks, onStay }) => {

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

    const actionButton: React.CSSProperties = {
        padding: '10px 18px',
        borderRadius: '6px',
        border: '2px solid #0f172a',
        background: '#fde047',
        color: '#0f172a',
        boxShadow: '3px 3px 0 #0f172a',
        fontWeight: 900,
        fontSize: '12px',
        cursor: 'pointer',
        textTransform: 'uppercase',
    };

    const stayButton: React.CSSProperties = {
        padding: '12px 24px',
        borderRadius: '6px',
        border: '2px solid #0f172a',
        background: '#ffffff',
        color: '#0f172a',
        boxShadow: '4px 4px 0 #0f172a',
        fontWeight: 900,
        fontSize: '14px',
        cursor: 'pointer',
    };

    const sectionTitle: React.CSSProperties = {
        fontSize: '11px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#64748b',
        marginBottom: '12px',
    };

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
        >
            <div
                style={{
                    width: '95vw',
                    maxWidth: '900px',
                    maxHeight: '95vh',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '10px 10px 0 #0f172a',
                    border: '4px solid #0f172a',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* HEADER */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '4px solid #0f172a',
                    background: '#e2e8f0',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>The Job Market</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                        Your performance has attracted attention. Review these offers or choose to stay with your current program.
                    </div>
                </div>

                {/* CONTENT */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {offers.length > 0 && (
                        <div>
                            <div style={sectionTitle}>NCAA Offers</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {offers.sort((a, b) => a.teamName.localeCompare(b.teamName)).map(offer => {
                                    const teamColors = SCHOOL_COLORS[offer.teamName] || { primary: '#0f172a', secondary: '#94a3b8' };
                                    const logoUrl = getSchoolLogoUrl(offer.teamName);
                                    const teamPrimary = teamColors.primary || '#0f172a';
                                    const cardBg = rgbaFromHex(teamPrimary, 0.08);
                                    return (
                                        <div
                                            key={offer.teamName}
                                            style={{
                                                ...sectionCard,
                                                background: cardBg,
                                                borderLeft: `6px solid ${teamPrimary}`,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '16px',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {logoUrl && (
                                                <img
                                                    src={logoUrl}
                                                    alt=""
                                                    style={{
                                                        position: 'absolute',
                                                        left: '50%',
                                                        top: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        width: '100px',
                                                        height: '100px',
                                                        objectFit: 'contain',
                                                        opacity: 0.15,
                                                        pointerEvents: 'none',
                                                    }}
                                                />
                                            )}
                                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '18px', fontWeight: 900, color: teamPrimary }}>{offer.teamName}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Athletic Director of {offer.teamName}</div>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                    <span style={infoPill}>Prestige: {offer.prestige}</span>
                                                    <span style={infoPill}>Rank: #{powerRanks.get(offer.teamName) || 'NR'}</span>
                                                    <span style={{ ...infoPill, background: '#dbeafe', borderColor: '#3b82f6', color: '#1d4ed8' }}>
                                                        {offer.length} YR • {formatCurrency(offer.salary)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                style={actionButton}
                                                onClick={() => dispatch({ type: 'SELECT_JOB_OFFER', payload: offer })}
                                            >
                                                Accept Offer
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {nbaOffers.length > 0 && (
                        <div>
                            <div style={sectionTitle}>NBA Offers</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {nbaOffers.map(name => (
                                    <div
                                        key={name}
                                        style={{
                                            ...sectionCard,
                                            background: rgbaFromHex('#1d428a', 0.08),
                                            borderLeft: '6px solid #1d428a',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '16px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1d428a' }}>{name}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>General Manager of {name}</div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                                <span style={infoPill}>League: NBA</span>
                                                <span style={{ ...infoPill, background: '#fef9c3', borderColor: '#eab308', color: '#854d0e' }}>Pro Contract</span>
                                            </div>
                                        </div>
                                        <button
                                            style={{ ...actionButton, background: '#86efac', borderColor: '#0f172a' }}
                                            onClick={() => dispatch({ type: 'SELECT_NBA_JOB_OFFER', payload: name })}
                                        >
                                            Go Pro
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {offers.length === 0 && nbaOffers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontStyle: 'italic' }}>
                            No offers available at this time.
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div style={{ padding: '16px 24px', borderTop: '4px solid #0f172a', background: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
                    <button style={stayButton} onClick={onStay}>
                        Reject All & Stay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobMarketModal;
