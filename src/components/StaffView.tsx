import React from 'react';
import { Team, TeamColors, GameAction, Staff, GameStatus } from '../types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

const Subheading = ({ color, children }: { color: string, children: React.ReactNode }) => (
    <h3 style={{
        color: '#0f172a',
        borderBottom: `2px solid #0f172a`,
        paddingBottom: '8px',
        marginBottom: '16px',
        fontSize: '1.1rem',
        marginTop: '24px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    }}>
        {children}
    </h3>
);

const StaffView = ({ team, colors, dispatch, onOpenFreeAgency, onOpenCoachProfile }: { team: Team, colors: TeamColors, dispatch: React.Dispatch<GameAction>, onOpenFreeAgency: () => void, onOpenCoachProfile: () => void }) => {
    const renderStaffSection = (title: string, staffList: Staff[], roleKey: 'assistants' | 'trainers' | 'scouts') => (
        <div style={{ marginBottom: '24px' }}>
            <Subheading color={colors.primary}>{title}</Subheading>
            {staffList.length === 0 ? (
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#64748b', padding: '12px' }}>No {title.toLowerCase()} hired.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {staffList.map(staff => (
                        <div key={staff.id} style={styles.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{staff.name}</span>
                                <span style={{
                                    ...styles.pill,
                                    backgroundColor: staff.grade === 'A' ? '#dcfce7' : staff.grade === 'B' ? '#dbeafe' : staff.grade === 'C' ? '#fef9c3' : '#fee2e2',
                                    color: staff.grade === 'A' ? '#166534' : staff.grade === 'B' ? '#1e40af' : staff.grade === 'C' ? '#854d0e' : '#991b1b',
                                    borderColor: '#0f172a'
                                }}>
                                    Grade: {staff.grade}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '12px', lineHeight: '1.5' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Salary:</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(staff.salary)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Contract:</span>
                                    <span style={{ fontWeight: 600 }}>{staff.yearsRemaining} yr(s)</span>
                                </div>
                                <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                                    {staff.specialty}
                                </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                                {staff.description}
                            </p>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to fire ${staff.name}? You will have to pay the remaining contract value.`)) {
                                        dispatch({ type: 'FIRE_STAFF', payload: { staffId: staff.id, role: roleKey } });
                                    }
                                }}
                                style={styles.fireButton}
                            >
                                Fire Coach
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{
                    color: '#0f172a',
                    margin: 0,
                    textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                    fontSize: '1.8rem',
                    fontWeight: 900
                }}>Coaching Staff</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onOpenCoachProfile} style={styles.actionButton}>
                        Coach Skill Tree
                    </button>
                    <button onClick={onOpenFreeAgency} style={styles.actionButton}>
                        Hire Staff
                    </button>
                </div>
            </div>
            {renderStaffSection('Assistant Coaches', team.staff.assistants, 'assistants')}
            {renderStaffSection('Trainers', team.staff.trainers, 'trainers')}
            {renderStaffSection('Scouts', team.staff.scouts, 'scouts')}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    card: {
        background: '#f8fafc',
        borderRadius: '6px',
        border: '2px solid #0f172a',
        boxShadow: '4px 4px 0 #0f172a',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
    },
    actionButton: {
        padding: '10px 16px',
        borderRadius: '6px',
        border: '2px solid #0f172a',
        background: '#fff',
        color: '#0f172a',
        boxShadow: '2px 2px 0 #0f172a',
        fontWeight: 800,
        fontSize: '0.9rem',
        cursor: 'pointer',
        textTransform: 'uppercase',
    },
    fireButton: {
        marginTop: 'auto',
        padding: '8px 12px',
        borderRadius: '4px',
        border: '2px solid #991b1b',
        background: '#fee2e2',
        color: '#991b1b',
        fontWeight: 700,
        fontSize: '0.8rem',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    pill: {
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
    }
};

export default StaffView;
