import { generatePreseasonHistory } from '../services/gameService';
import { Team } from '../types';

// Mock minimal Team object
const mockTeams: Team[] = [
    { name: 'Duke', prestige: 90, record: { wins: 0, losses: 0 } } as Team,
    { name: 'Baylor', prestige: 85, record: { wins: 0, losses: 0 } } as Team,
];

console.log('Running generatePreseasonHistory...');
try {
    const result = generatePreseasonHistory(mockTeams);
    const drafts = result.history.nbaDrafts;

    console.log('Total drafts generated:', drafts.length);

    // Check Season -22 (2003)
    const seasonNeg22 = drafts.find(d => d.season === -22);
    if (seasonNeg22) {
        console.log('Season -22 (2003) picks:');
        seasonNeg22.picks.slice(0, 10).forEach(p => {
            console.log(`Pick ${p.pick}: ${p.player.name} (${p.originalTeam})`);
        });
    } else {
        console.log('Season -22 NOT found.');
    }

    // Check Season 0 (2025)
    const season0 = drafts.find(d => d.season === 0);
    if (season0) {
        console.log('Season 0 (2025) picks:');
        season0.picks.slice(0, 10).forEach(p => {
            console.log(`Pick ${p.pick}: ${p.player.name} (${p.originalTeam})`);
        });
    } else {
        console.log('Season 0 NOT found.');
    }

    // Check for duplicate Edgecombe
    let edgecombeCount = 0;
    drafts.forEach(d => {
        d.picks.forEach(p => {
            if (p.player.name.includes('Edgecombe')) {
                console.log(`Found Edgecombe in Season ${d.season} (Pick ${p.pick})`);
                edgecombeCount++;
            }
        });
    });
    console.log('Total Edgecombe appearances:', edgecombeCount);

} catch (e) {
    console.error('Error:', e);
}
