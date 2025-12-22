import fs from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, '../data/realNbaDrafts.ts');
const startYear = 2003;
const endYear = 2025;

const drafts = {};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeDraft(year) {
    console.log(`Scraping ${year}...`);
    const url = `https://www.basketball-reference.com/draft/NBA_${year}.html`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch ${year}: ${response.status}`);
            return;
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const picks = [];

        // The table id is usually #stats
        const rows = $('#stats tbody tr');
        
        rows.each((i, elem) => {
            const row = $(elem);
            if (row.hasClass('thead')) return; // Skip header rows inside table

            const pick = parseInt(row.find('td[data-stat="pick_overall"] a').text()) || parseInt(row.find('td[data-stat="pick_overall"]').text());
            const team = row.find('td[data-stat="team_id"] a').text() || row.find('td[data-stat="team_id"]').text();
            const player = row.find('td[data-stat="player"] a').text() || row.find('td[data-stat="player"]').text();
            const college = row.find('td[data-stat="college_name"] a').text() || row.find('td[data-stat="college_name"]').text();
            const position = row.find('td[data-stat="pos"]').text();
            
            if (pick && player) {
                picks.push({
                    pick,
                    team,
                    player,
                    college: college || 'International/HS',
                    position
                });
            }
        });

        drafts[year] = picks;
        console.log(`  Found ${picks.length} picks for ${year}`);

    } catch (error) {
        console.error(`Error scraping ${year}:`, error);
    }
}

async function main() {
    for (let year = startYear; year <= endYear; year++) {
        await scrapeDraft(year);
        await sleep(2000); // 2 second delay to be polite
    }

    const tsContent = `
export interface RealDraftPick {
    pick: number;
    team: string;
    player: string;
    college: string;
    position: string;
}

export const REAL_NBA_DRAFTS: Record<number, RealDraftPick[]> = ${JSON.stringify(drafts, null, 4)};
`;

    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    fs.writeFileSync(outputPath, tsContent);
    console.log(`Successfully wrote real NBA drafts to ${outputPath}`);
}

main();
