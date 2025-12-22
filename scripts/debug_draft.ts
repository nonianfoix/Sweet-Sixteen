import { generateHistoricalNBADrafts } from '../services/gameService';
import { BASE_CALENDAR_YEAR } from '../constants';

console.log('BASE_CALENDAR_YEAR:', BASE_CALENDAR_YEAR);

try {
    const drafts = generateHistoricalNBADrafts(31);
    console.log('Generated drafts for', drafts.length, 'seasons.');

    // Check for V.J. Edgecombe
    let found = false;
    drafts.forEach(draft => {
        const edgecombe = draft.picks.find(p => p.player.name.includes('Edgecombe'));
        if (edgecombe) {
            console.log('Found Edgecombe in Season:', draft.season);
            console.log('Pick details:', edgecombe);
            found = true;
        }
        
        // Check for Javon Small
        const small = draft.picks.find(p => p.player.name.includes('Javon Small'));
        if (small) {
            console.log('Found Javon Small in Season:', draft.season);
            console.log('Pick details:', small);
        }
    });

    if (!found) {
        console.log('V.J. Edgecombe NOT found in historical drafts.');
    }

    // Check Season 0 (2024)
    const season0 = drafts.find(d => d.season === 0);
    if (season0) {
        console.log('Season 0 (2024) first 5 picks:');
        console.log(season0.picks.slice(0, 5));
    } else {
        console.log('Season 0 NOT found.');
    }

    // Check Season -17 (2007)
    const seasonNeg17 = drafts.find(d => d.season === -17);
    if (seasonNeg17) {
        console.log('Season -17 (2007) first 5 picks:');
        console.log(seasonNeg17.picks.slice(0, 5));
    } else {
        console.log('Season -17 NOT found.');
    }

} catch (e) {
    console.error('Error:', e);
}
