import React from 'react';
import { Team, TeamColors, GameAction, Staff, GameStatus } from '../types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

const Subheading = ({ color, children }: { color: string, children: React.ReactNode }) => (
    <h3 style={{ color, borderBottom: `2px solid ${color}`, paddingBottom: '5px', marginBottom: '10px' }}>
        {children}
    </h3>
);

const StaffView = ({ team, colors, dispatch, onOpenFreeAgency }: { team: Team, colors: TeamColors, dispatch: React.Dispatch<GameAction>, onOpenFreeAgency: () => void }) => {
    const renderStaffSection = (title: string, staffList: Staff[], roleKey: 'assistants' | 'trainers' | 'scouts') => (
        <div style={{ marginBottom: '20px' }}>
            <Subheading color={colors.primary}>{title}</Subheading>
            {staffList.length === 0 ? (
                <p style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>No {title.toLowerCase()} hired.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                    {staffList.map(staff => (
                        <div key={staff.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{staff.name}</span>
                                <span style={{ fontSize: '0.7rem', backgroundColor: '#eee', padding: '2px 5px', borderRadius: '3px' }}>Grade: {staff.grade}</span>
                            </div>
                            <p style={{ fontSize: '0.7rem', margin: '2px 0' }}>Salary: {formatCurrency(staff.salary)}</p>
                            <p style={{ fontSize: '0.7rem', margin: '2px 0' }}>Contract: {staff.yearsRemaining} yr(s)</p>
                            <p style={{ fontSize: '0.7rem', margin: '2px 0', fontWeight: 'bold', color: '#555' }}>{staff.specialty}</p>
                            <p style={{ fontSize: '0.65rem', fontStyle: 'italic', margin: '5px 0' }}>{staff.description}</p>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to fire ${staff.name}? You will have to pay the remaining contract value.`)) {
                                        dispatch({ type: 'FIRE_STAFF', payload: { staffId: staff.id, role: roleKey } });
                                    }
                                }}
                                style={{ ...styles.smallButton, backgroundColor: '#ffcccc', marginTop: '5px' }}
                            >
                                Fire
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ color: colors.primary, margin: 0 }}>Coaching Staff</h2>
                <div>
                    <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.SKILL_TREE })} style={{...styles.button, marginRight: '10px'}}>Coach Skill Tree</button>
                    <button onClick={onOpenFreeAgency} style={styles.button}>Hire Staff</button>
                </div>
            </div>
            {renderStaffSection('Assistant Coaches', team.staff.assistants, 'assistants')}
            {renderStaffSection('Trainers', team.staff.trainers, 'trainers')}
            {renderStaffSection('Scouts', team.staff.scouts, 'scouts')}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    button: {
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.8rem',
        padding: '10px',
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        backgroundColor: '#C0C0C0',
        color: '#000000',
        cursor: 'pointer',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
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
};

export default StaffView;
