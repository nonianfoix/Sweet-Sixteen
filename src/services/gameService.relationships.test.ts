// @ts-nocheck
import { describe, expect, test } from 'vitest';
import { generateRecruitRelationships } from './gameService';

describe('generateRecruitRelationships (sibling)', () => {
  test('creates Sibling links only to current college roster players', () => {
    const recruit = {
      id: 'r-1',
      name: 'Jack Chapman',
      stars: 4,
      homeState: 'Washington',
      state: 'Washington',
      hometownState: 'Washington',
      relationships: [],
    } as any;

    const team = {
      name: 'Boise State',
      state: 'Idaho',
      roster: [
        {
          id: 'p-1',
          name: 'Matthew Chapman',
          homeState: 'Washington',
        },
      ],
    } as any;

    const updated = generateRecruitRelationships([recruit], [team], { forceRosterSiblingSeeds: true, rosterSiblingTargetOverride: 1 });
    const rels = updated[0].relationships || [];
    const sibling = rels.find((r: any) => r.type === 'Sibling');

    expect(sibling).toBeTruthy();
    expect(sibling.sportLevel).toBe('College');
    expect(sibling.personId).toBe('p-1');
    expect(sibling.displayName).toBe('Matthew Chapman');
    expect(sibling.teamName).toBe('Boise State');
  });
});

