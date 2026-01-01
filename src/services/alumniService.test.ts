// @ts-nocheck
// services/alumniService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateBaselineAlumniRegistry } from './alumniService';
import { Team } from '../types';

// Mock randomBetween and pickRandom from gameService as they are dependencies
vi.mock('./gameService', () => ({
  randomBetween: vi.fn((min, max) => min), // Always return min for predictability
  pickRandom: vi.fn(arr => arr[0]), // Always pick the first element for predictability
  // Also need to mock clamp and calculateOverall if they are used internally by generateAlumni/updateAlumniRegistry
  clamp: vi.fn((value) => value),
  calculateOverall: vi.fn((stats) => 75), // Return a consistent overall
}));

const getExpectedProfession = (prestige: number): string => {
  if (prestige > 85) {
    return 'Law';
  }
  if (prestige > 70) {
    return 'Tech';
  }
  return 'Public Service';
};

// Mock PROFESSIONS from alumniService.ts so the mocked pickRandom always uses a predictable array.
vi.mock('./alumniService', async (importOriginal) => {
  const actual = await importOriginal();
  const mockProfessions = ['Law', 'Finance', 'Tech', 'Medicine', 'Entrepreneur', 'Public Service', 'Blue-Collar'];
  return {
    ...actual,
    PROFESSIONS: mockProfessions,
  };
});

describe('generateBaselineAlumniRegistry', () => {
  let mockTeam: Team;

  beforeEach(async () => {
    mockTeam = {
      name: 'Test Team',
      prestige: 70,
      conference: 'Test Conference',
      fanInterest: 70,
    } as Team; // Cast to Team to satisfy type requirements
    // Reset mocks before each test
    const gameServiceMock = await vi.importMock<typeof import('./gameService')>('./gameService');
    vi.mocked(gameServiceMock.randomBetween).mockClear();
    vi.mocked(gameServiceMock.pickRandom).mockClear();
  });

  it('should generate a registry with a reasonable number of alumni', () => {
    const historicalSeasons = 5;
    const registry = generateBaselineAlumniRegistry(mockTeam, historicalSeasons);

    // Expecting alumniCount to be Math.floor((team.prestige / 100) * 15 * historicalSeasons);
    // With prestige 70 and historicalSeasons 5: Math.floor((70/100) * 15 * 5) = Math.floor(0.7 * 75) = Math.floor(52.5) = 52
    const expectedAlumniCount = 52;
    const expectedProfession = getExpectedProfession(mockTeam.prestige);
    
    expect(registry.summaryStats.countsPerProfession).toMatchObject({});
    expect(registry.summaryStats.countsPerProfession[expectedProfession]).toBe(expectedAlumniCount);

    const totalAlumni = Object.values(registry.summaryStats.countsPerProfession).reduce((sum: number, count: any) => sum + count, 0);
    expect(totalAlumni).toBe(expectedAlumniCount);
  });

  it('should correctly update profession counts', () => {
    const historicalSeasons = 1;
    const registry = generateBaselineAlumniRegistry(mockTeam, historicalSeasons);

    // alumniCount = Math.floor((70/100) * 15 * 1) = 10
    const expectedProfession = getExpectedProfession(mockTeam.prestige);
    expect(registry.summaryStats.countsPerProfession[expectedProfession]).toBe(10);
  });

  it('should initialize empty registry if no alumni are generated (historicalSeasons = 0)', () => {
    const historicalSeasons = 0; // No seasons means no alumni
    const registry = generateBaselineAlumniRegistry(mockTeam, historicalSeasons);
    expect(registry.summaryStats.countsPerProfession).toEqual({});
    expect(registry.summaryStats.donationMomentum).toBe(0);
    expect(registry.summaryStats.notableAlumni).toEqual([]);
  });

  it('should initialize empty registry if no alumni are generated (alumniCount = 0)', () => {
    mockTeam.prestige = 1; // Make prestige very low so alumniCount is 0
    const historicalSeasons = 1; 
    const registry = generateBaselineAlumniRegistry(mockTeam, historicalSeasons);
    expect(registry.summaryStats.countsPerProfession).toEqual({});
    expect(registry.summaryStats.donationMomentum).toBe(0);
    expect(registry.summaryStats.notableAlumni).toEqual([]);
  });
});

