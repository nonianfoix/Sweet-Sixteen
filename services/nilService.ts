import { DraftProjection, NilNegotiationCandidate, NilPersonalityTrait, Player, Team, SponsorTier, NilCollectiveProfile, SponsorQuest, SponsorQuestStatus } from '../types';
import { NBA_SALARIES } from '../data/nbaSalaries';
import { CONFERENCE_NIL_CAPS, SCHOOL_CONFERENCES, CONFERENCE_STRENGTH } from '../constants';

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const normalizeAcademicYearLabel = (year?: string | null) => (year || '').toLowerCase().replace(/\./g, '').trim();
const isSeniorAcademicYearValue = (year?: string | null) => {
    const normalized = normalizeAcademicYearLabel(year);
    if (!normalized) return false;
    return normalized.startsWith('sr') || normalized.includes('senior') || normalized.startsWith('gr') || normalized.includes('grad');
};
const isJuniorAcademicYearValue = (year?: string | null) => {
    const normalized = normalizeAcademicYearLabel(year);
    if (!normalized) return false;
    return normalized.startsWith('jr') || normalized.includes('junior');
};

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

// Calculate average NBA salary for baseline
// Calculate average NBA salary for baseline
const NBA_SALARY_VALUES = Object.values(NBA_SALARIES).map(s => s.salary);
const AVERAGE_NBA_SALARY = NBA_SALARY_VALUES.length ? NBA_SALARY_VALUES.reduce((a, b) => a + b, 0) / NBA_SALARY_VALUES.length : 10000000;
const MAX_NBA_SALARY = NBA_SALARY_VALUES.length ? Math.max(...NBA_SALARY_VALUES) : 60000000;


const PERSONALITY_POOL: NilPersonalityTrait[] = [
    'LegacyBuilder',
    'BrandExpansionist',
    'HomegrownFavorite',
    'DegreeSeeker',
    'OneAndDoneDNA',
    'LateBloomer',
];

const TRAIT_STAY_MODIFIERS: Record<NilPersonalityTrait, number> = {
    LegacyBuilder: 0.92,
    BrandExpansionist: 1.05,
    HomegrownFavorite: 0.9,
    DegreeSeeker: 0.95,
    OneAndDoneDNA: 1.25,
    LateBloomer: 0.98,
};

const TRAIT_MULTIYEAR_FAVOR: NilPersonalityTrait[] = ['LegacyBuilder', 'DegreeSeeker', 'LateBloomer'];

const SPONSOR_PREFERRED_POSITIONS: Record<string, ('PG' | 'SG' | 'SF' | 'PF' | 'C')[]> = {
    Nike: ['PG', 'SG', 'SF'],
    Jordan: ['PG', 'SG'],
    Adidas: ['PF', 'C'],
};

const SPONSOR_TIER_BONUS: Record<SponsorTier, number> = {
    Elite: 0.18,
    High: 0.1,
    Mid: 0.05,
    Low: 0.0,
};

const DRAFT_PROJECTION_TAX: Record<DraftProjection, number> = {
    Lottery: 1.4,
    FirstRound: 1.2,
    SecondRound: 1.05,
    Undrafted: 0.85,
};

const pickRandomTrait = (): NilPersonalityTrait => {
    return PERSONALITY_POOL[Math.floor(Math.random() * PERSONALITY_POOL.length)];
};

const baseDraftProjection = (player: Player): DraftProjection => {
    const anchor = (player.overall + player.potential) / 2;
    if (anchor >= 90) return 'Lottery';
    if (anchor >= 84) return 'FirstRound';
    if (anchor >= 78) return 'SecondRound';
    return 'Undrafted';
};

const getPerGameProduction = (player: Player) => {
    const games = Math.max(1, player.seasonStats?.gamesPlayed || 1);
    return {
        ppg: (player.seasonStats?.points || 0) / games,
        rpg: (player.seasonStats?.rebounds || 0) / games,
        apg: (player.seasonStats?.assists || 0) / games,
    };
};

export const ensurePlayerNilProfile = (player: Player): Player => {
    if (player.nilPersonalityTraits && player.localHeroismFactor !== undefined) {
        return {
            ...player,
            nilValue: player.nilValue ?? 0,
            nilContractAmount: player.nilContractAmount ?? 0,
            nilContractYearsRemaining: player.nilContractYearsRemaining ?? 0,
            socialMediaHeat: player.socialMediaHeat ?? Math.round(Math.random() * 20 + 10),
            draftProjection: player.draftProjection ?? baseDraftProjection(player),
        };
    }
    const traits = player.nilPersonalityTraits ?? [pickRandomTrait(), pickRandomTrait()].filter(
        (value, index, arr) => arr.indexOf(value) === index
    );
    const heroism = player.localHeroismFactor ?? Math.round(Math.random() * 20);
    return {
        ...player,
        nilValue: player.nilValue ?? 0,
        nilContractAmount: player.nilContractAmount ?? 0,
        nilContractYearsRemaining: player.nilContractYearsRemaining ?? 0,
        nilPersonalityTraits: traits,
        localHeroismFactor: heroism,
        socialMediaHeat: player.socialMediaHeat ?? Math.round(Math.random() * 20 + 10),
        draftProjection: player.draftProjection ?? baseDraftProjection(player),
    };
};

export const calculatePlayerNilValue = (
    player: Player,
    team: Team,
    context: { fanSentiment: number; sponsorTier: SponsorTier; unfinishedBusinessBonus?: number }
): number => {
    const ensured = ensurePlayerNilProfile(player);
    const { ppg, rpg, apg } = getPerGameProduction(ensured);
    const performanceValue =
        ensured.overall * 1200 +
        ensured.potential * 600 +
        (ppg * 250) +
        (rpg * 110) +
        (apg * 150);

    const marketability =
        team.prestige * 350 +
        (team.record?.wins || 0) * 120 +
        (context.fanSentiment || 50) * 60 +
        (ensured.socialMediaHeat || 10) * 80;

    const heroBonus = (ensured.localHeroismFactor || 0) * 120;
    const sponsorBonus =
        SPONSOR_TIER_BONUS[context.sponsorTier] *
        (performanceValue * 0.08 + (SPONSOR_PREFERRED_POSITIONS[team.sponsor?.name || '']?.includes(ensured.position) ? 2000 : 500));
    const unfinishedBusiness = (context.unfinishedBusinessBonus || 0) * 120;
    
    // Scale based on NBA market context
    const marketScale = AVERAGE_NBA_SALARY / 10000000; // Normalize around $10M average
    let rawValue = (performanceValue + marketability + heroBonus + sponsorBonus + unfinishedBusiness) * marketScale;

    // Incorporate NBA Comparable if available
    if (player.nbaComparable && player.nbaComparable.salary && !Number.isNaN(player.nbaComparable.salary)) {
        // A player's NIL value is heavily influenced by their perceived NBA outcome.
        // We take a small percentage (e.g. 1-2%) of their comparable's salary as a baseline for "hype".
        const proHype = (player.nbaComparable.salary * 0.015) * (player.nbaComparable.similarityScore || 0.8);
        
        // Blend it: 70% intrinsic college value, 30% pro hype (or more if they are really good)
        const hypeWeight = player.potential > 85 ? 0.4 : 0.2;
        rawValue = rawValue * (1 - hypeWeight) + proHype * hypeWeight;
    }
    
    // Increase cap to reflect competitive NBA salaries (approx 10-15% of max NBA salary for top college stars)
    const nilCap = Math.round(MAX_NBA_SALARY * 0.08); // ~4.8M
    return Math.round(clampNumber(rawValue, 25000, nilCap));
};

export const getConferenceNilCap = (teamName: string): number => {
    const conf = SCHOOL_CONFERENCES[teamName] || 'Independent';
    const strength = CONFERENCE_STRENGTH[conf] || 'Low';
    // Default to 'Low' cap if not found
    return CONFERENCE_NIL_CAPS[strength] || 1500000;
};

export const calculateTeamNilBudget = (
    team: Team,
    context: { fanSentiment: number; sponsorTier: SponsorTier; tournamentBonus: number }
): number => {
    const prestigePortion = (team.prestige || 50) * 25000;
    const sponsorPortion = SPONSOR_TIER_BONUS[context.sponsorTier || 'Low'] * 400000;
    const fanPortion = (context.fanSentiment || 50) * 8000;
    const tournamentPortion = (context.tournamentBonus || 0) * 60000;
    const baseWealth = (team.wealth?.donationLevel || 50) * 4000;

    const counts = team.alumniRegistry?.summaryStats?.countsPerProfession || {};
    const alumniBonus = (counts['Finance'] || 0) * 10000 +
                        (counts['Law'] || 0) * 10000 +
                        (counts['Medicine'] || 0) * 10000;

    const total = prestigePortion + sponsorPortion + fanPortion + tournamentPortion + baseWealth + alumniBonus;
    const sentimentPenalty = Math.max(0, 60 - (context.fanSentiment || 50)) * 20000;
    let adjustedTotal = Math.max(0, total - Math.min(total, sentimentPenalty));

    // Apply Soft Cap Logic
    const softCap = getConferenceNilCap(team.name);
    if (adjustedTotal > softCap) {
        // Luxury Tax / Diminishing Returns: 50% efficiency for every dollar over cap
        const excess = adjustedTotal - softCap;
        adjustedTotal = softCap + (excess * 0.5);
    }

    return Math.max(150000, Math.round(adjustedTotal));
};

const determineSponsorSubsidy = (player: Player, team: Team): number => {
    if (!team.sponsor) return 0;
    const preferredPositions = SPONSOR_PREFERRED_POSITIONS[team.sponsor.name] || [];
    if (!preferredPositions.includes(player.position)) return 0;
    const tierBoost = SPONSOR_TIER_BONUS[team.sponsor.tier];
    if (tierBoost <= 0) return 0;
    return Math.round((player.nilValue || 0) * (0.1 + tierBoost / 2));
};

export const buildNilNegotiationCandidates = (
    team: Team,
    context: { fanSentiment: number; unfinishedBusinessBonus?: number }
): NilNegotiationCandidate[] => {
    const sponsorTier = team.sponsor?.tier || 'Low';
    // Ensure comparables are up to date (and fix any corrupt ones)
    updatePlayerNbaComparables(team.roster);
    
    return team.roster
        .filter(player => !isSeniorAcademicYearValue(player.year))
        .map(player => {
            const profiled = ensurePlayerNilProfile(player);
            const value = calculatePlayerNilValue(profiled, team, {
                fanSentiment: context.fanSentiment,
                sponsorTier,
                unfinishedBusinessBonus: context.unfinishedBusinessBonus,
            });
            const subsidy = determineSponsorSubsidy({ ...profiled, nilValue: value }, team);
            const traitWeight = (profiled.nilPersonalityTraits || []).reduce(
                (sum, trait) => sum * TRAIT_STAY_MODIFIERS[trait],
                1
            );
            const draftTax = DRAFT_PROJECTION_TAX[profiled.draftProjection || 'Undrafted'];
            const minimumAsk = Math.round(value * traitWeight * draftTax);
            const isJunior = isJuniorAcademicYearValue(profiled.year);
            const prefersMultiYear = !isJunior && (profiled.nilPersonalityTraits || []).some(trait =>
                TRAIT_MULTIYEAR_FAVOR.includes(trait)
            );
            const reason =
                draftTax > 1.2
                    ? 'Projected early pick demands major NIL bump.'
                    : prefersMultiYear
                        ? 'Values stability and long-term plan.'
                        : 'Evaluating market options.';
            return {
                playerId: profiled.id,
                playerName: profiled.name,
                year: profiled.year,
                position: profiled.position,
                secondaryPosition: profiled.secondaryPosition,
                overall: profiled.overall,
                potential: profiled.potential,
                draftProjection: profiled.draftProjection || 'Undrafted',
                expectedNilValue: value,
                minimumAsk,
                prefersMultiYear,
                sponsorSubsidy: subsidy,
                reason,
                status: 'pending',
            } as NilNegotiationCandidate;
        })
        .filter(candidate => candidate.expectedNilValue >= 80000 || candidate.year !== 'Fr');
};

export const evaluateNilOffer = (
    candidate: NilNegotiationCandidate,
    amount: number,
    years: number,
    player: Player
): { accepted: boolean; message: string } => {
    const profiled = ensurePlayerNilProfile(player);
    const personalityModifier = (profiled.nilPersonalityTraits || []).reduce(
        (sum, trait) => sum * TRAIT_STAY_MODIFIERS[trait],
        1
    );
    let threshold = candidate.minimumAsk * personalityModifier;
    const hasOneAndDoneTrait = (profiled.nilPersonalityTraits || []).includes('OneAndDoneDNA');
    if (years > 1 && candidate.prefersMultiYear && !hasOneAndDoneTrait) {
        threshold *= 0.92;
    }
    if (years > 1 && hasOneAndDoneTrait) {
        threshold *= 1.2;
    }
    const netOffer = amount + candidate.sponsorSubsidy;
    if (netOffer >= threshold) {
        return { accepted: true, message: `${candidate.playerName} committed to return on a NIL package worth ${netOffer.toLocaleString()}.` };
    }
    const gap = threshold - netOffer;
    return {
        accepted: false,
        message: `${candidate.playerName} declined. Needs roughly ${Math.round(gap).toLocaleString()} more to stay.`,
    };
};

export const generateNilCollective = (team: Team): NilCollectiveProfile => {
    const prestigeFactor = team.prestige / 100;
    const baseBudget = Math.round(50000 + (prestigeFactor * 450000));
    const tier = prestigeFactor > 0.85 ? 'elite' : prestigeFactor > 0.6 ? 'national' : prestigeFactor > 0.3 ? 'regional' : 'local';
    
    return {
        id: `collective-${team.name}-${Date.now()}`,
        tier,
        reputation: Math.round(50 + (prestigeFactor * 40)),
        baseBudget,
        sponsorMatch: 0,
        alumniContribution: 0,
        updatedWeek: 0,
    };
};

export const generateSponsorQuests = (team: Team, week: number): SponsorQuest[] => {
    if (!team.sponsor) return [];
    
    const quests: SponsorQuest[] = [];
    const count = Math.floor(Math.random() * 2) + 1; // 1 or 2 quests

    for (let i = 0; i < count; i++) {
        const type = ['attendance', 'wins', 'media', 'nil'][Math.floor(Math.random() * 4)] as any;
        let target = 0;
        let reward = 0;
        let title = '';
        let description = '';

        switch (type) {
            case 'attendance':
                target = 2; // 2 games with high attendance
                reward = 25000;
                title = 'Pack the House';
                description = 'Achieve >95% capacity in 2 upcoming home games.';
                break;
            case 'wins':
                target = 3;
                reward = 40000;
                title = 'Winning Streak';
                description = 'Win 3 games in the next 5 weeks.';
                break;
            case 'media':
                target = 1;
                reward = 15000;
                title = 'Media Darling';
                description = 'Secure a national broadcast slot.';
                break;
            case 'nil':
                target = team.nilBudget ? Math.round(team.nilBudget * 0.8) : 500000;
                reward = 30000;
                title = 'NIL Activation';
                description = `Spend ${target.toLocaleString()} in NIL deals to show commitment.`;
                break;
        }

        quests.push({
            id: `quest-${week}-${i}`,
            sponsor: team.sponsor.name,
            title,
            description,
            type,
            target,
            progress: 0,
            rewardCash: reward,
            status: 'active',
            expiresWeek: week + 6,
        });
    }
    return quests;
};

export const updateNILCollective = (team: Team, week: number): NilCollectiveProfile => {
    const collective = team.nilCollective || generateNilCollective(team);
    const donorMomentum = team.wealth?.donorMomentum ?? 0;
    const upcomingEvents = team.eventCalendar?.filter(e => e.status === 'pending' && e.week > week).length ?? 0;

    const alumniContributionBonus = (donorMomentum * 1000) + (upcomingEvents * 25000);
    const sponsorMatchBonus = (donorMomentum * 500);

    let entrepreneurBonus = 0;
    const entrepreneurCount = team.alumniRegistry?.summaryStats.countsPerProfession['Entrepreneur'] || 0;
    if (entrepreneurCount > 0 && Math.random() < 0.1) { // 10% chance of a bonus each week
        entrepreneurBonus = entrepreneurCount * randomBetween(10000, 50000);
    }

    return {
        ...collective,
        alumniContribution: collective.alumniContribution + alumniContributionBonus + entrepreneurBonus,
        sponsorMatch: collective.sponsorMatch + sponsorMatchBonus,
        updatedWeek: week,
    };
};

import { REAL_NBA_PLAYERS } from '../data/realNbaPlayers';
import { getNBASalaryProfileForName } from './nbaData';

export const updatePlayerNbaComparables = (players: Player[]) => {
    // Flatten real players for easy search
    const allNbaPlayers = Object.values(REAL_NBA_PLAYERS).flat();

    players.forEach(p => {
        // Skip if already set and valid
        if (p.nbaComparable && p.nbaComparable.salary && !Number.isNaN(p.nbaComparable.salary)) return;

        // Find best match based on:
        // 1. Position map (Guard -> PG/SG, Wing -> SG/SF, Big -> PF/C)
        // 2. Height (within 2 inches)
        // 3. Archetype (Offense/Defense balance)
        
        // Simple heuristic score
        let bestMatch: any = null;
        let bestScore = Infinity;

        const pOff = (p.stats.insideScoring + p.stats.outsideScoring + p.stats.playmaking) / 3;
        const pDef = (p.stats.perimeterDefense + p.stats.insideDefense + p.stats.rebounding) / 3;

        allNbaPlayers.forEach(nbaP => {
            // Position Check
            let posMatch = false;
            if (p.position === 'PG' && ['PG', 'SG'].includes(nbaP.position)) posMatch = true;
            else if (p.position === 'SG' && ['PG', 'SG', 'SF'].includes(nbaP.position)) posMatch = true;
            else if (p.position === 'SF' && ['SG', 'SF', 'PF'].includes(nbaP.position)) posMatch = true;
            else if (p.position === 'PF' && ['SF', 'PF', 'C'].includes(nbaP.position)) posMatch = true;
            else if (p.position === 'C' && ['PF', 'C'].includes(nbaP.position)) posMatch = true;

            if (!posMatch) return;

            // Height Parser (e.g. "6-3")
            let nbaHeight = 78;
            if (typeof nbaP.height === 'string' && nbaP.height.includes('-')) {
                const [f, i] = nbaP.height.split('-').map(Number);
                nbaHeight = f * 12 + i;
            } else if (typeof nbaP.height === 'number') {
                nbaHeight = nbaP.height;
            }

            // Height Check (loose, +/- 3 inches)
            if (Math.abs(p.height - nbaHeight) > 3) return;

            // Salary Check - Need valid salary to be a "comparable" target
            const profile = getNBASalaryProfileForName(nbaP.name);
            if (!profile || !profile.salary || profile.salary < 2000000) return; // Ignore very low salary/two-way players for comps
            const salary = profile.salary;

            // Similarity Score (Lower is better)
            // Use simple age-relative or just raw rating?
            // REAL_NBA_PLAYERS doesn't have ratings attached directly, we need to infer or ignore.
            // But we want "Style" match.
            // Since we lack detailed stats for NBA players in this list (we only have name, pos, height, team),
            // we will pick randomly among valid candidates or use name hash to be deterministic?
            // User wants "Salary-Informed".
            // Let's rely on Salary as a proxy for "Quality" and try to match Potential to Salary Tier.
            
            // Map Player Potential (60-99) to Salary Tier
            // 90+ -> >30M
            // 80-90 -> 10M-30M
            // <80 -> <10M
            
            let qualityScore = 0;
            if (p.potential >= 90) {
                qualityScore = Math.abs(salary - 40000000);
            } else if (p.potential >= 80) {
                 qualityScore = Math.abs(salary - 15000000);
            } else {
                 qualityScore = Math.abs(salary - 5000000);
            }

            // Random factor to vary it up
            const score = qualityScore + (Math.random() * 5000000);

            if (score < bestScore) {
                bestScore = score;
                bestMatch = { ...nbaP, salary };
            }
        });

        if (bestMatch) {
            p.nbaComparable = {
                name: bestMatch.name,
                salary: bestMatch.salary || 2000000,
                similarityScore: 0.85 // Mock score for now
            };
        }
    });
};
