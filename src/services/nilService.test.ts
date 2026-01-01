// @ts-nocheck
// services/nilService.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTeamNilBudget, evaluateNilOffer, calculatePlayerNilValue, buildNilNegotiationCandidates, ensurePlayerNilProfile } from './nilService';
import { Team, Player, NilCollectiveProfile, SponsorTier, RosterPositions, NilPersonalityTrait, DraftProjection, NilNegotiationCandidate, ProgramWealth, Finances, Prices, Staff, Sponsor, HeadCoachProfile } from '../types';

// Mock data
const mockPlayerStats = {
    insideScoring: 80, outsideScoring: 75, playmaking: 70, perimeterDefense: 70,
    insideDefense: 65, rebounding: 60, stamina: 85
};

const mockPlayer: Player = {
    id: 'p1',
    name: 'Player One',
    position: 'PG',
    height: 75,
    year: 'Jr',
    overall: 78,
    potential: 85,
    stats: mockPlayerStats,
    starterPosition: 'PG',
    startOfSeasonOverall: 78,
    xFactor: 5,
    seasonStats: { gamesPlayed: 20, points: 300, rebounds: 80, assists: 120, minutes: 600 },
    isTargeted: false,
    naturalProgressAccumulator: 0,
    minutesLocked: false,
    nilPersonalityTraits: ['LegacyBuilder'],
    localHeroismFactor: 10,
    socialMediaHeat: 25,
    draftProjection: 'SecondRound',
};

const mockTeam: Team = {
    name: 'Team NIL',
    conference: 'Power',
    prestige: 80,
    recruitingPrestige: 80,
    roster: [mockPlayer],
    staff: {} as Staff,
    record: { wins: 20, losses: 5 },
    isUserTeam: true,
    sponsor: { name: 'Nike', tier: 'Elite', slogan: 'Just Do It' },
    sponsorRevenue: { jersey: 0, shoe: 0, merch: 0, total: 0 },
    sponsorContractYearsRemaining: 1,
    sponsorContractLength: 1,
    sponsorOffers: [],
    fanInterest: 85,
    fanSentiment: 90,
    prices: {} as Prices,
    finances: {} as Finances,
    wealth: { endowmentScore: 80, donationLevel: 70, boosterPool: 15, donorMomentum: 10 },
    headCoach: {} as HeadCoachProfile,
    playerFocusId: null,
    teamCaptainId: null,
    nilBudget: 0,
    nilBudgetUsed: 0,
    nilBoostFromSponsor: 0,
    alumniRegistry: { summaryStats: { countsPerProfession: { 'Finance': 5, 'Law': 3, 'Medicine': 2 } } } as any, // Mock only what's needed
    facilities: null,
    nilCollective: {} as NilCollectiveProfile,
    eventCalendar: [],
    sponsorQuests: [],
    initialProjectedRevenue: {} as Finances,
    budget: { cash: 0 }
};

describe('nilService', () => {
    describe('calculateTeamNilBudget', () => {
        it('should calculate NIL budget based on team prestige, sponsor tier, fan sentiment, and alumni contributions', () => {
            const context = {
                fanSentiment: 80,
                sponsorTier: 'Elite' as SponsorTier,
                tournamentBonus: 5, // Example: Sweet 16 appearance
            };
            const budget = calculateTeamNilBudget(mockTeam, context);

            // Expected calculation:
            // prestigePortion = 80 * 25000 = 2,000,000
            // sponsorPortion = 0.18 (Elite) * 400000 = 72,000
            // fanPortion = 80 * 8000 = 640,000
            // tournamentPortion = 5 * 60000 = 300,000
            // baseWealth = 70 * 4000 = 280,000
            // alumniBonus = 5*10000 (Finance) + 3*10000 (Law) + 2*10000 (Medicine) = 50000 + 30000 + 20000 = 100,000
            // Total = 2,000,000 + 72,000 + 640,000 + 300,000 + 280,000 + 100,000 = 3,392,000
            // Max with base of 150,000, so expect ~3,392,000

            expect(budget).toBeGreaterThanOrEqual(150000);
            expect(budget).toBe(3392000);
        });

        it('should return a minimum budget even for low prestige/sentiment teams', () => {
            const lowTeam = {
                ...mockTeam,
                prestige: 20,
                wealth: { ...mockTeam.wealth!, donationLevel: 10 },
                alumniRegistry: { summaryStats: { countsPerProfession: {} } } as any
            };
            const context = {
                fanSentiment: 20,
                sponsorTier: 'Low' as SponsorTier,
                tournamentBonus: 0,
            };
            const budget = calculateTeamNilBudget(lowTeam, context);
            expect(budget).toBe(150000); // Should clamp to minimum
        });
    });

    describe('evaluateNilOffer', () => {
        const createCandidate = (minAsk: number, prefersMultiYear: boolean = false, playerOverride?: Partial<Player>): NilNegotiationCandidate => ({
            playerId: 'p1',
            playerName: 'Player One',
            year: 'Jr',
            position: 'PG',
            secondaryPosition: undefined,
            overall: 78,
            potential: 85,
            draftProjection: 'SecondRound',
            expectedNilValue: minAsk * 1.2,
            minimumAsk: minAsk,
            prefersMultiYear: prefersMultiYear,
            sponsorSubsidy: 0,
            reason: 'test',
            status: 'pending',
        });

        it('should accept offer if amount + subsidy meets or exceeds adjusted minimum ask', () => {
            const candidate = createCandidate(100000); // minimumAsk 100,000
            const player = ensurePlayerNilProfile(mockPlayer); // LegacyBuilder: 0.92
            const result = evaluateNilOffer(candidate, 92000, 1, player); // 92000 >= 100000 * 0.92 (92000)
            expect(result.accepted).toBe(true);
            expect(result.message).toContain('committed to return');
        });

        it('should decline offer if amount + subsidy is below adjusted minimum ask', () => {
            const candidate = createCandidate(100000); // minimumAsk 100,000
            const player = ensurePlayerNilProfile(mockPlayer); // LegacyBuilder: 0.92
            const result = evaluateNilOffer(candidate, 91999, 1, player);
            expect(result.accepted).toBe(false);
            expect(result.message).toContain('declined. Needs roughly');
        });

        it('should factor in multi-year preference for lower threshold', () => {
            const candidate = createCandidate(100000, true); // minimumAsk 100,000, prefersMultiYear
            const player = ensurePlayerNilProfile(mockPlayer); // LegacyBuilder: 0.92
            // Original adjusted threshold: 100000 * 0.92 = 92000
            // With multi-year preference: 92000 * 0.92 = 84640
            const result = evaluateNilOffer(candidate, 84640, 2, player);
            expect(result.accepted).toBe(true);
        });

        it('should factor in OneAndDoneDNA for higher threshold on multi-year offers', () => {
            const oneAndDonePlayer = { ...mockPlayer, nilPersonalityTraits: ['OneAndDoneDNA'] };
            const candidate = createCandidate(100000, true, oneAndDonePlayer); // minimumAsk 100,000
            const player = ensurePlayerNilProfile(oneAndDonePlayer); // OneAndDoneDNA: 1.25
            // Original adjusted threshold: 100000 * 1.25 = 125000
            // With multi-year offer for O&D: 125000 * 1.2 = 150000
            const result = evaluateNilOffer(candidate, 149999, 2, player);
            expect(result.accepted).toBe(false);
            const result2 = evaluateNilOffer(candidate, 150000, 2, player);
            expect(result2.accepted).toBe(true);
        });

        it('should include sponsor subsidy in net offer calculation', () => {
            const candidateWithSubsidy = { ...createCandidate(100000), sponsorSubsidy: 10000 };
            const player = ensurePlayerNilProfile(mockPlayer); // LegacyBuilder: 0.92
            const result = evaluateNilOffer(candidateWithSubsidy, 82000, 1, player); // 82000 + 10000 = 92000 >= 100000 * 0.92
            expect(result.accepted).toBe(true);
        });
    });
});
