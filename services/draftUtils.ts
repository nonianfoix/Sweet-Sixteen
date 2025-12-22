import { DraftPickRule, PickPreference } from '../data/nbaDraftPickSwaps';

export interface DraftSlotAssignment {
    pick: number;
    round: 1 | 2;
    slotTeam: string;
}

export interface PickOwnerRecord {
    owner: string;
    via?: string;
}

const getPreferenceCandidates = (preference: PickPreference | undefined, poolSize: number): number[] => {
    if (poolSize <= 0) return [];
    const resolvedPreference = preference || 'best';
    const candidates: number[] = [];
    const addCandidate = (index: number) => {
        if (index >= 0 && index < poolSize && !candidates.includes(index)) {
            candidates.push(index);
        }
    };

    switch (resolvedPreference) {
        case 'best':
            addCandidate(0);
            break;
        case 'second_best':
            addCandidate(1);
            break;
        case 'third_best':
            addCandidate(2);
            break;
        case 'fourth_best':
            addCandidate(3);
            break;
        case 'worst':
            addCandidate(poolSize - 1);
            break;
        case 'second_worst':
            addCandidate(poolSize - 2);
            break;
        case 'third_worst':
            addCandidate(poolSize - 3);
            break;
    }

    const fallbackOrder = resolvedPreference.includes('worst')
        ? Array.from({ length: poolSize }, (_, idx) => poolSize - 1 - idx)
        : Array.from({ length: poolSize }, (_, idx) => idx);
    fallbackOrder.forEach(addCandidate);

    return candidates;
};

const selectPickIndexForPreference = (
    preference: PickPreference | undefined,
    poolSize: number,
    usedIndices: Set<number>
): number | null => {
    const candidates = getPreferenceCandidates(preference, poolSize);
    for (const index of candidates) {
        if (!usedIndices.has(index)) {
            return index;
        }
    }
    return null;
};

export const computeDraftPickOwnership = (
    slotAssignments: DraftSlotAssignment[],
    rules: DraftPickRule[],
    year: number
): Map<number, PickOwnerRecord> => {
    const ownership = new Map<number, PickOwnerRecord>();
    slotAssignments.forEach(pick => {
        ownership.set(pick.pick, { owner: pick.slotTeam });
    });

    const seasonRules = rules.filter(rule => rule.year === year);
    seasonRules.forEach(rule => {
        const roundPicks = slotAssignments.filter(pick => pick.round === rule.round);
        if (!roundPicks.length) return;

        if (rule.type === 'assignment') {
            const targetPick = roundPicks.find(pick => pick.slotTeam === rule.from);
            if (targetPick) {
                ownership.set(targetPick.pick, { owner: rule.to, via: targetPick.slotTeam });
            }
            return;
        }

        const poolPicks = roundPicks.filter(pick => rule.pool.includes(pick.slotTeam));
        if (!poolPicks.length) return;

        const sortedPicks = [...poolPicks].sort((a, b) => a.pick - b.pick);
        const assignedIndices = new Set<number>();
        rule.recipients.forEach(recipient => {
            const index = selectPickIndexForPreference(recipient.preference, sortedPicks.length, assignedIndices);
            if (index === null) return;
            const pick = sortedPicks[index];
            ownership.set(pick.pick, { owner: recipient.team, via: pick.slotTeam });
            assignedIndices.add(index);
        });
    });

    return ownership;
};
