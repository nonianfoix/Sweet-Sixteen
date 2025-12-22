import React from 'react';
import { PoachingOffer } from '../types';

interface PoachingOfferModalProps {
    isOpen: boolean;
    offer: PoachingOffer | null;
    onReject: () => void;
    onAcceptNext: () => void;
    onAcceptImmediate: () => void;
}

const PoachingOfferModal: React.FC<PoachingOfferModalProps> = ({ isOpen, offer, onReject, onAcceptNext, onAcceptImmediate }) => {
    if (!isOpen || !offer) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100, // Higher than other modals
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: '#fff',
                padding: '2rem',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                border: '2px solid #d93025',
                animation: 'pulse 2s infinite'
            }}>
                <style>
                    {`
                        @keyframes pulse {
                            0% { box-shadow: 0 0 0 0 rgba(217, 48, 37, 0.4); }
                            70% { box-shadow: 0 0 0 10px rgba(217, 48, 37, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(217, 48, 37, 0); }
                        }
                    `}
                </style>
                <h2 style={{ 
                    marginTop: 0, 
                    marginBottom: '1rem', 
                    textAlign: 'center',
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '1rem',
                    color: '#d93025'
                }}>
                    🚨 POACHING ALERT 🚨
                </h2>
                
                <p style={{ textAlign: 'center', color: '#333', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                    <strong>{offer.teamName}</strong> has approached you with a lucrative offer!
                </p>

                <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #dee2e6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#666' }}>Salary:</span>
                        <span style={{ fontWeight: 'bold', color: '#28a745' }}>${offer.salary.toLocaleString()} / yr</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#666' }}>Length:</span>
                        <span style={{ fontWeight: 'bold' }}>{offer.length} Years</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#666' }}>Prestige:</span>
                        <span style={{ fontWeight: 'bold', color: '#007bff' }}>{offer.prestige}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                        <span style={{ color: '#d93025', fontWeight: 'bold' }}>Expires:</span>
                        <span style={{ fontWeight: 'bold' }}>Week {offer.expiresWeek}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button 
                        onClick={onAcceptNext}
                        style={{
                            padding: '1rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Accept for Next Season
                        <div style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.8 }}>Finish current season, then move.</div>
                    </button>

                    {offer.type === 'Immediate' && (
                        <button 
                            onClick={onAcceptImmediate}
                            style={{
                                padding: '1rem',
                                backgroundColor: '#d93025',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Leave Immediately
                            <div style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.8 }}>Abandon team now. Major reputation hit.</div>
                        </button>
                    )}

                    <button 
                        onClick={onReject}
                        style={{
                            padding: '0.8rem',
                            backgroundColor: 'transparent',
                            color: '#6c757d',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Reject Offer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PoachingOfferModal;
