// services/questService.ts
import { Team, SponsorQuest, SponsorName, AlumniRegistry } from '../types';
import { randomBetween, pickRandom } from './utils';
import { SPONSORS, ALUMNI_SPONSORS } from '../constants';

const QUEST_TYPES = ['attendance', 'wins', 'media', 'nil', 'alumni', 'draft'] as const;

export const generateSponsorQuests = (team: Team, week: number): SponsorQuest[] => {
    if (!team.sponsor) return [];
    
    const quests: SponsorQuest[] = [];
    const count = Math.random() < 0.3 ? 2 : 1; 

    for (let i = 0; i < count; i++) {
        const type = pickRandom([...QUEST_TYPES]);
        let target = 0;
        let reward = 0;
        let title = '';
        let description = '';
        const duration = randomBetween(4, 10);

        switch (type) {
            case 'attendance':
                target = 3; 
                reward = 35000;
                title = 'Full House';
                description = `Achieve >90% capacity in ${target} games in the next ${duration} weeks.`;
                break;
            case 'wins':
                target = 4;
                reward = 50000;
                title = 'Winning Ways';
                description = `Win ${target} games in the next ${duration} weeks.`;
                break;
            case 'media':
                target = 1;
                reward = 20000;
                title = 'Headline Act';
                description = 'Get a player mentioned in the national news (stub).';
                break;
            case 'nil':
                target = 250000;
                reward = 40000;
                title = 'Investing in Talent';
                description = `Facilitate $${target.toLocaleString()} in NIL deals.`;
                break;
            case 'alumni':
                target = 1;
                reward = 30000;
                title = 'Alumni Engagement';
                description = 'Host an alumni gala event.';
                break;
            case 'draft':
                target = 1;
                reward = 100000;
                title = 'Pro Pipeline';
                description = 'Have a player selected in the First Round of the NBA Draft.';
                break;
        }

        quests.push({
            id: `quest-${week}-${i}-${Math.random().toString(36).substr(2,5)}`,
            sponsor: team.sponsor.name as SponsorName,
            title,
            description,
            type,
            target,
            progress: 0,
            rewardCash: reward,
            status: 'active',
            expiresWeek: week + duration,
        });
    }
    return quests;
};

export const buildSponsorQuestDeck = (week: number, alumniRegistry?: AlumniRegistry): SponsorQuest[] => {
    const deck: SponsorQuest[] = [];
    const deckSize = 4;

    // Check for Syndicate eligibility (High Finance/Tech alumni count)
    let syndicateChance = 0;
    if (alumniRegistry) {
        const financeCount = alumniRegistry.allAlumni.filter(a => a.archetype === 'Finance').length;
        const techCount = alumniRegistry.allAlumni.filter(a => a.archetype === 'Tech').length;
        syndicateChance = (financeCount + techCount) * 0.05;
    }
    
    for (let i = 0; i < deckSize; i++) {
        const isSyndicate = Math.random() < syndicateChance;
        const category = isSyndicate ? 'Syndicate' : pickRandom(['Mid', 'High', 'Low']);
        const sponsorName = pickRandom(SPONSORS[category] || SPONSORS['Mid']);
        
        // Generate a simple quest for the deck
        const reward = isSyndicate ? randomBetween(50000, 150000) : randomBetween(10000, 60000);
        const duration = 8;
        
        deck.push({
            id: `deck-${week}-${i}-${Math.random().toString(36).substr(2,5)}`,
            sponsor: sponsorName as SponsorName, // Cast as SponsorName
            title: isSyndicate ? 'Syndicate Investment' : 'Sponsorship Opportunity',
            description: isSyndicate ? 
                'Alumni-led group offers capital for program growth.' : 
                `Standard sponsorship deal from ${sponsorName}.`,
            type: 'wins', // Placeholder type
            target: isSyndicate ? 8 : 4,
            progress: 0,
            rewardCash: reward,
            status: 'available',
            expiresWeek: week + 4,
            isAlumniOwned: isSyndicate // Start using this property
        });
    }
    return deck;
};