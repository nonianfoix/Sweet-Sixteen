import { Team, Staff, StaffRole, StaffSpecialty, PendingStaffRenewal } from '../types';

export const calculateStaffChemistry = (headCoachPhilosophy: string | undefined, staff: Staff[]): number => {
    if (!headCoachPhilosophy || staff.length === 0) return 50;

    let totalChemistry = 0;
    let count = 0;

    staff.forEach(member => {
        if (member.philosophy) {
            // Simple string match for now, could be more complex later
            if (member.philosophy === headCoachPhilosophy) {
                totalChemistry += 100;
            } else {
                totalChemistry += 50; // Neutral
            }
            count++;
        }
    });

    return count > 0 ? totalChemistry / count : 50;
};

export interface StaffModifiers {
    offense: number;
    defense: number;
    recruiting: number;
    development: number;
}

export const calculateStaffEffectiveness = (team: Team): StaffModifiers => {
    const modifiers: StaffModifiers = {
        offense: 1.0,
        defense: 1.0,
        recruiting: 1.0,
        development: 1.0
    };

    const { assistants, trainers, scouts } = team.staff;
    const allStaff = [...assistants, ...trainers, ...scouts];

    // Base effectiveness from Head Coach (could be added here, but usually handled separately)

    // Coordinator Effects
    const oc = assistants.find(s => s.role === 'Offensive Coordinator');
    if (oc) {
        modifiers.offense += 0.1; // Base boost
        if (oc.specialty.startsWith('Offense')) {
            modifiers.offense += 0.05; // Specialty match
        }
        if (oc.grade === 'A') modifiers.offense += 0.05;
        else if (oc.grade === 'B') modifiers.offense += 0.03;
    }

    const dc = assistants.find(s => s.role === 'Defensive Coordinator');
    if (dc) {
        modifiers.defense += 0.1;
        if (dc.specialty.startsWith('Defense')) {
            modifiers.defense += 0.05;
        }
        if (dc.grade === 'A') modifiers.defense += 0.05;
        else if (dc.grade === 'B') modifiers.defense += 0.03;
    }

    const rc = assistants.find(s => s.role === 'Recruiting Coordinator');
    if (rc) {
        modifiers.recruiting += 0.1;
        if (rc.specialty.startsWith('Recruiting')) {
            modifiers.recruiting += 0.05;
        }
        if (rc.grade === 'A') modifiers.recruiting += 0.05;
        else if (rc.grade === 'B') modifiers.recruiting += 0.03;
    }

    // General Staff Effects
    trainers.forEach(t => {
        if (t.specialty.startsWith('Training')) {
            modifiers.development += 0.02;
        }
        if (t.grade === 'A') modifiers.development += 0.02;
    });

    scouts.forEach(s => {
        if (s.specialty.startsWith('Scouting')) {
            modifiers.recruiting += 0.02;
        }
        if (s.grade === 'A') modifiers.recruiting += 0.02;
    });

    // Chemistry Bonus
    const chemistry = calculateStaffChemistry(team.headCoach.style, allStaff); // Using style as proxy for philosophy
    const chemistryBonus = (chemistry - 50) / 500; // -0.1 to +0.1
    
    modifiers.offense += chemistryBonus;
    modifiers.defense += chemistryBonus;
    modifiers.recruiting += chemistryBonus;
    modifiers.development += chemistryBonus;

    return modifiers;
};

export const collectExpiredStaffRenewals = (team: Team): PendingStaffRenewal[] => {
    const expired: PendingStaffRenewal[] = [];
    const roles: ('assistants' | 'trainers' | 'scouts')[] = ['assistants', 'trainers', 'scouts'];
    
    roles.forEach(role => {
        team.staff[role].forEach(staffMember => {
            if (staffMember.yearsRemaining <= 0) {
                expired.push({
                    staffId: staffMember.id,
                    role: role,
                    name: staffMember.name,
                    grade: staffMember.grade,
                    currentSalary: staffMember.salary,
                    yearsOffered: Math.max(2, staffMember.contractLength || staffMember.yearsRemaining || 2)
                });
            }
        });
    });
    return expired;
};
