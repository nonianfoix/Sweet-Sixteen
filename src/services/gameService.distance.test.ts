// @ts-nocheck
import { describe, expect, test } from 'vitest';
import { estimateRecruitDistanceMilesToTeam } from './gameService';
import { SCHOOL_LOCATIONS } from '../constants/schoolCoordinates';

describe('estimateRecruitDistanceMilesToTeam', () => {
  test('uses stable in-state distances across teams', () => {
    const recruit = { id: 'recruit-test-1', homeState: 'Alabama', state: 'Alabama' } as any;

    const auburn = { name: 'Auburn', state: 'Alabama', location: SCHOOL_LOCATIONS['Auburn'] } as any;
    const alabama = { name: 'Alabama', state: 'Alabama', location: SCHOOL_LOCATIONS['Alabama'] } as any;

    const dAuburn1 = estimateRecruitDistanceMilesToTeam(recruit, auburn);
    const dAuburn2 = estimateRecruitDistanceMilesToTeam(recruit, auburn);
    const dAlabama = estimateRecruitDistanceMilesToTeam(recruit, alabama);

    expect(dAuburn1).toBe(dAuburn2);
    expect(dAuburn1).toBeGreaterThan(0);
    expect(dAlabama).toBeGreaterThan(0);

    // In-state distances should not routinely exceed realistic bounds for Alabama.
    expect(dAuburn1).toBeLessThanOrEqual(275);
    expect(dAlabama).toBeLessThanOrEqual(275);

    // Distances should reflect different school locations, not independent randomization.
    expect(Math.abs(dAuburn1 - dAlabama)).toBeLessThanOrEqual(260);
  });
});


