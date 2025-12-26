import React from 'react';
import { BoardExpectations, CoachContract } from '../types';

interface ContractOfferModalProps {
    isOpen: boolean;
    onSign: (salary: number, duration: number) => void;
    expectations: BoardExpectations;
    teamName: string;
    prestige: number;
    offerSalary?: number;
    offerDuration?: number;
}

const formatRoundShort = (label: string | undefined): string => {
    const normalized = (label || '').toLowerCase();
    if (normalized.includes('national') || normalized.includes('champ')) return 'Natl Champ';
    if (normalized.includes('final four') || normalized.includes('final')) return 'Final Four';
    if (normalized.includes('elite 8') || normalized.includes('elite eight')) return 'E8';
    if (normalized.includes('sweet 16') || normalized.includes('sweet sixteen')) return 'S16';
    if (normalized.includes('round of 32') || normalized.includes('r32')) return 'R32';
    if (normalized.includes('round of 64') || normalized.includes('r64')) return 'R64';
    return 'N/A';
};

const ContractOfferModal: React.FC<ContractOfferModalProps> = ({ isOpen, onSign, expectations, teamName, prestige, offerSalary, offerDuration }) => {
    if (!isOpen) return null;

    // Calculate a proposed salary based on prestige (simplified) or use offered values
    const proposedSalary = offerSalary ?? (150000 + (prestige * 10000));
    const duration = offerDuration ?? 4;

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
            alignItems: 'flex-start',
            zIndex: 1000,
            backdropFilter: 'blur(5px)',
            overflowY: 'auto',
            padding: 'min(2.5vh, 16px) 10px',
            boxSizing: 'border-box',
        }}>
            <div style={{
                backgroundColor: '#fff',
                padding: 'clamp(10px, 1.6vw, 22px)',
                borderRadius: '12px',
                maxWidth: '900px',
                width: 'min(900px, 96vw)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                border: '1px solid #e0e0e0',
                maxHeight: 'calc(100vh - 32px)',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                boxSizing: 'border-box',
            }}>
                <h2 style={{ 
                    marginTop: 0, 
                    marginBottom: '1rem', 
                    textAlign: 'center',
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '1.2rem',
                    color: '#333'
                }}>
                    Contract Offer: {teamName}
                </h2>

                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <h3 style={{ marginTop: 0, color: '#495057', fontSize: '1rem', borderBottom: '2px solid #e9ecef', paddingBottom: '0.5rem' }}>
                        Board Evaluation Model (Coach Performance Index)
                    </h3>
                    <p style={{ fontSize: '0.8rem', lineHeight: 1.35, color: '#6c757d', marginBottom: '0.5rem' }}>
                        Your job security is calculated algorithmically across multiple categories (on-court, postseason, pipeline, brand, and finances) and compared to program expectations.
                    </p>
                    <p style={{ fontSize: '0.7rem', lineHeight: 1.35, color: '#6c757d', marginBottom: '0.5rem' }}>
                        Wins expectations reflect the full contract total (postseason wins count toward this), while projected value remains based on regular-season performance.
                    </p>
                    <p style={{ fontSize: '0.75rem', lineHeight: 1.35, color: '#495057', marginBottom: '0.75rem' }}>
                        <strong>Board Profile:</strong> {expectations.boardProfile} • <strong>Composite:</strong> 0–100 (higher is better)
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
                        <div style={{ padding: '0.45rem', border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.25rem' }}>
                                WINS ({Math.round((expectations.weights?.wins || 0) * 100)}%)
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>{expectations.targetWins}</div>
                            <div style={{ fontSize: '0.6rem', color: '#6c757d', marginTop: '0.25rem' }}>Expected wins (contract total)</div>
                        </div>
                        <div style={{ padding: '0.45rem', border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.25rem' }}>
                                POSTSEASON ({Math.round((expectations.weights?.postseason || 0) * 100)}%)
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#007bff' }}>
                                {expectations.targetPostseasonCount
                                    ? `${formatRoundShort(expectations.targetTourneyRound)} x${expectations.targetPostseasonCount}`
                                    : formatRoundShort(expectations.targetTourneyRound)}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#6c757d', marginTop: '0.25rem' }}>Expected finish</div>
                        </div>
                        <div style={{ padding: '0.45rem', border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.25rem' }}>
                                PIPELINE ({Math.round((expectations.weights?.pipeline || 0) * 100)}%)
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6f42c1' }}>{expectations.targetDraftPicks}</div>
                            <div style={{ fontSize: '0.6rem', color: '#6c757d', marginTop: '0.25rem' }}>Draft picks / year</div>
                        </div>
                        <div style={{ padding: '0.45rem', border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.25rem' }}>
                                BRAND ({Math.round((expectations.weights?.brand || 0) * 100)}%)
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fd7e14' }}>
                                {Math.round((expectations.targetAttendanceFillRate || 0) * 100)}%
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#6c757d', marginTop: '0.25rem' }}>Avg fill target</div>
                        </div>
                        <div style={{ padding: '0.45rem', border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.25rem' }}>
                                FINANCES ({Math.round((expectations.weights?.finances || 0) * 100)}%)
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffc107' }}>
                                {expectations.targetNetIncome !== undefined ? `$${(expectations.targetNetIncome / 1000000).toFixed(1)}M` : 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#6c757d', marginTop: '0.25rem' }}>Net income target (contract total)</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#495057' }}>Proposed Salary</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>${proposedSalary.toLocaleString()} / yr</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#495057' }}>Contract Length</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{duration} Years</div>
                    </div>
                </div>

                <button 
                    onClick={() => onSign(proposedSalary, duration)}
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '1.05rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                >
                    Sign Contract
                </button>
            </div>
        </div>
    );
};

export default ContractOfferModal;
