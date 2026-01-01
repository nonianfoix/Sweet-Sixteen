import React, { useState, useMemo } from 'react';
import type { GameAction, Staff, StaffRole } from '../../types';
import { generateStaffCandidates, formatCurrency } from '../../services/gameService';

const StaffRecruitmentModal = ({ dispatch }: { dispatch: React.Dispatch<GameAction> }) => {
    const [candidates, setCandidates] = useState(generateStaffCandidates());
    const [selectedAssistants, setSelectedAssistants] = useState<Staff[]>([]);
    const [selectedTrainers, setSelectedTrainers] = useState<Staff[]>([]);
    const [selectedScouts, setSelectedScouts] = useState<Staff[]>([]);

    const totalSelected = selectedAssistants.length + selectedTrainers.length + selectedScouts.length;

    const handleHire = () => {
        dispatch({ type: 'HIRE_STAFF', payload: { assistants: selectedAssistants, trainers: selectedTrainers, scouts: selectedScouts } });
    };

    const handleRefreshCandidates = () => {
        const newCandidates = generateStaffCandidates();
        // Keep selected candidates in the list
        newCandidates.assistants = [...selectedAssistants, ...newCandidates.assistants.filter(c => !selectedAssistants.find(s => s.id === c.id))];
        newCandidates.trainers = [...selectedTrainers, ...newCandidates.trainers.filter(c => !selectedTrainers.find(s => s.id === c.id))];
        newCandidates.scouts = [...selectedScouts, ...newCandidates.scouts.filter(c => !selectedScouts.find(s => s.id === c.id))];
        setCandidates(newCandidates);
    };

    const handleRandomStaff = () => {
        const randomAssistants = candidates.assistants.slice(0, 3);
        const randomTrainers = candidates.trainers.slice(0, 3);
        const randomScouts = candidates.scouts.slice(0, 3);
        
        dispatch({ type: 'HIRE_STAFF', payload: { assistants: randomAssistants, trainers: randomTrainers, scouts: randomScouts } });
    };

    const handleSelect = (staff: Staff, role: StaffRole) => {
        const isCurrentlySelected = (
            (role === 'Assistant Coach' && selectedAssistants.some(s => s.id === staff.id)) ||
            (role === 'Trainer' && selectedTrainers.some(s => s.id === staff.id)) ||
            (role === 'Scout' && selectedScouts.some(s => s.id === staff.id))
        );

        if (isCurrentlySelected) {
            if (role === 'Assistant Coach') setSelectedAssistants(prev => prev.filter(s => s.id !== staff.id));
            if (role === 'Trainer') setSelectedTrainers(prev => prev.filter(s => s.id !== staff.id));
            if (role === 'Scout') setSelectedScouts(prev => prev.filter(s => s.id !== staff.id));
        } else {
            if (role === 'Assistant Coach' && selectedAssistants.length < 3) setSelectedAssistants(prev => [...prev, staff]);
            if (role === 'Trainer' && selectedTrainers.length < 3) setSelectedTrainers(prev => [...prev, staff]);
            if (role === 'Scout' && selectedScouts.length < 3) setSelectedScouts(prev => [...prev, staff]);
        }
    };

    const selectedStaffAll = useMemo(
        () => [...selectedAssistants, ...selectedTrainers, ...selectedScouts],
        [selectedAssistants, selectedTrainers, selectedScouts],
    );
    const selectedSalaryTotal = useMemo(
        () => selectedStaffAll.reduce((sum, staff) => sum + (staff.salary || 0), 0),
        [selectedStaffAll],
    );

    const clearSelections = () => {
        setSelectedAssistants([]);
        setSelectedTrainers([]);
        setSelectedScouts([]);
    };

    const staffModal = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: 'min(3vh, 18px) 10px',
            boxSizing: 'border-box' as const,
        },
        window: {
            width: 'min(1200px, 98vw)',
            maxHeight: 'min(95vh, 1000px)',
            display: 'flex',
            flexDirection: 'column' as const,
            background: 'linear-gradient(180deg, #f7f8fa 0%, #eef2f7 100%)',
            border: '4px solid #0b0f18',
            boxShadow: '0 16px 0 rgba(0,0,0,0.35)',
            borderRadius: 6,
            overflow: 'hidden',
        },
        header: {
            background: '#0b0f18',
            color: '#fff',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            borderBottom: '4px solid #2b3242',
        },
        headerTitle: {
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '1rem',
            letterSpacing: '0.5px',
            lineHeight: 1.2,
            margin: 0,
            textShadow: '2px 2px 0 rgba(0,0,0,0.6)',
        },
        headerMeta: {
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap' as const,
            justifyContent: 'flex-end',
            alignItems: 'center',
        },
        pill: (bg: string) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: bg,
            border: '2px solid #0b0f18',
            borderRadius: 999,
            color: '#0b0f18',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.55rem',
            whiteSpace: 'nowrap' as const,
        }),
        body: {
            padding: 12,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 10,
            minHeight: 0,
            flex: 1,
        },
        help: {
            fontSize: '0.7rem',
            color: '#1f2a3a',
            margin: 0,
            lineHeight: 1.35,
            textAlign: 'center' as const,
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            flex: 1,
            minHeight: 0,
        },
        panel: {
            border: '3px solid #0b0f18',
            borderRadius: 6,
            background: '#ffffff',
            overflow: 'hidden',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column' as const,
        },
        panelHeader: (accent: string) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 10px',
            background: accent,
            color: '#0b0f18',
            borderBottom: '3px solid #0b0f18',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '0.7rem',
        }),
        panelHeaderCount: {
            background: '#ffffff',
            border: '2px solid #0b0f18',
            borderRadius: 999,
            padding: '4px 8px',
            fontSize: '0.55rem',
        },
        panelList: {
            padding: 6,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 4,
            minHeight: 0,
            overflowY: 'auto' as const,
        },
        card: (isSelected: boolean) => ({
            background: isSelected ? '#fff3b0' : '#f6f7fb',
            border: isSelected ? '3px solid #1b57ff' : '2px solid #0b0f18',
            borderRadius: 4,
            padding: 6,
            cursor: 'pointer',
            boxShadow: isSelected ? '0 0 0 2px #0b0f18 inset' : '0 2px 0 rgba(0,0,0,0.2)',
            transition: 'transform 0.06s ease',
        }),
        cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
        cardName: { fontFamily: "'Press Start 2P', cursive", fontSize: '0.55rem', margin: 0, color: '#0b0f18' },
        grade: (g: string) => {
             const colors: Record<string, { bg: string; border: string }> = {
                'A': { bg: '#86efac', border: '#16a34a' },
                'B': { bg: '#93c5fd', border: '#2563eb' },
                'C': { bg: '#fde047', border: '#ca8a04' },
                'D': { bg: '#fdba74', border: '#ea580c' },
                'F': { bg: '#fca5a5', border: '#dc2626' },
            };
            const c = colors[g] || { bg: '#e5e7eb', border: '#6b7280' };
            return {
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '0.45rem',
                padding: '2px 6px',
                background: c.bg,
                border: `2px solid ${c.border}`,
                borderRadius: 4,
                whiteSpace: 'nowrap' as const,
            };
        },
        cardDesc: { fontSize: '0.6rem', margin: '4px 0 0 0', color: '#223049', lineHeight: 1.2 },
        cardSalary: { fontFamily: "'Press Start 2P', cursive", fontSize: '0.45rem', margin: '4px 0 0 0', textAlign: 'right' as const },
        footer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            padding: 12,
            borderTop: '4px solid #2b3242',
            background: '#0b0f18',
            flexWrap: 'wrap' as const,
        },
        button: (variant: 'neutral' | 'primary' | 'danger', disabled?: boolean) => {
            const colors =
                variant === 'primary'
                    ? { bg: '#21c55d', fg: '#0b0f18' }
                    : variant === 'danger'
                        ? { bg: '#ff4d4d', fg: '#0b0f18' }
                        : { bg: '#d7dde8', fg: '#0b0f18' };
            return {
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '0.65rem',
                padding: '10px 12px',
                borderRadius: 6,
                border: '3px solid #0b0f18',
                background: disabled ? '#9aa4b2' : colors.bg,
                color: colors.fg,
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 0 rgba(0,0,0,0.45)',
                minWidth: 170,
                textAlign: 'center' as const,
            };
        },
        footerLeft: { display: 'flex', gap: 10, flexWrap: 'wrap' as const },
        footerRight: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginLeft: 'auto' },
    };

    const renderCandidateGroup = (title: string, staffList: Staff[], selected: Staff[], role: StaffRole, accent: string) => (
        <div style={staffModal.panel}>
            <div style={staffModal.panelHeader(accent)}>
                <span>{title}</span>
                <span style={staffModal.panelHeaderCount}>{selected.length}/3</span>
            </div>
            <div style={staffModal.panelList}>
                {staffList.map(staff => {
                    const isSelected = selected.some(s => s.id === staff.id);
                    return (
                        <div
                            key={staff.id}
                            style={staffModal.card(isSelected)}
                            onClick={() => handleSelect(staff, role)}
                            onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
                            onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0px)')}
                        >
                            <div style={staffModal.cardTop}>
                                <h4 style={staffModal.cardName}>{staff.name}</h4>
                                <span style={staffModal.grade(staff.grade)}>Grade: {staff.grade}</span>
                            </div>
                            <p style={staffModal.cardDesc}>{staff.description}</p>
                            <p style={staffModal.cardSalary}>Salary: {formatCurrency(staff.salary)}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={staffModal.overlay}>
            <div style={staffModal.window}>
                <div style={staffModal.header}>
                    <h2 style={staffModal.headerTitle}>Assemble Your Staff</h2>
                    <div style={staffModal.headerMeta}>
                        <span style={staffModal.pill('#ffe08a')}>Selected: {totalSelected}/9</span>
                        <span style={staffModal.pill('#a7f3d0')}>Payroll: {formatCurrency(selectedSalaryTotal)}</span>
                        <button
                            style={staffModal.button('danger', totalSelected === 0)}
                            onClick={clearSelections}
                            disabled={totalSelected === 0}
                            title="Clear all selections"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                <div style={staffModal.body}>
                    <p style={staffModal.help}>
                        Pick up to <strong>3</strong> per role. Click a card to select/deselect.
                    </p>

                    <div style={staffModal.grid}>
                        {renderCandidateGroup('Assistant', candidates.assistants, selectedAssistants, 'Assistant Coach', '#8bd3ff')}
                        {renderCandidateGroup('Trainer', candidates.trainers, selectedTrainers, 'Trainer', '#a7f3d0')}
                        {renderCandidateGroup('Scout', candidates.scouts, selectedScouts, 'Scout', '#d8b4fe')}
                    </div>
                </div>

                <div style={staffModal.footer}>
                    <div style={staffModal.footerLeft}>
                        <button style={staffModal.button('neutral')} onClick={handleRefreshCandidates} title="Reroll candidates">
                            Refresh Candidates
                        </button>
                        <button style={staffModal.button('neutral')} onClick={handleRandomStaff} title="Auto-pick up to 3 per role">
                            Random Staff
                        </button>
                    </div>
                    <div style={staffModal.footerRight}>
                        <button
                            style={staffModal.button('primary', totalSelected === 0)}
                            onClick={handleHire}
                            disabled={totalSelected === 0}
                            title={totalSelected === 0 ? 'Select at least one staff member' : 'Hire selected staff'}
                        >
                            Finalize Staff
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffRecruitmentModal;
