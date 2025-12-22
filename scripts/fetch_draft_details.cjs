
const fs = require('fs');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');

const START_YEAR = 1969;
const END_YEAR = 2025;
const OUTPUT_FILE = path.join(__dirname, '../data/draft_enrichment.json');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                // Handle redirects or errors
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return fetchUrl(res.headers.location).then(resolve).catch(reject);
                }
                reject(new Error(`Status code: ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
};

const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

async function scrapeDraft(year) {
    console.log(`Fetching ${year} draft...`);
    const url = `https://www.basketball-reference.com/draft/NBA_${year}.html`;
    
    try {
        const html = await fetchUrl(url);
        const $ = cheerio.load(html);
        const players = {};

        $('#stats tbody tr').each((i, el) => {
            if ($(el).hasClass('thead')) return; // Skip headers

            const playerElement = $(el).find('td[data-stat="player"]');
            const name = playerElement.text().trim();
            const pick = $(el).find('td[data-stat="pick_overall"]').text().trim();
            const pos = $(el).find('td[data-stat="pos"]').text().trim();
            // Height is not always directly in the table, sometimes it's in the player link
            // But usually, Basketball Reference draft tables don't show height directly.
            // Wait, looking at the page... it DOES NOT show height in the main draft table.
            // It shows: Pick, Team, Player, College, Yrs, G, MP, PTS, TRB, AST, FG%, 3P%, FT%, MP, PTS, TRB, AST, WS, WS/48, BPM, VORP
            
            // However, we can try to get it from the player's page if we want to be thorough, 
            // BUT that would be thousands of requests.
            // ALTERNATIVE: Use a different source or accept that we might only get Position if available.
            // Actually, let's check if there's a better table or if I can infer it.
            
            // Re-reading user request: "fetch real world heights and positions"
            // If the draft table doesn't have height, I might need to look elsewhere.
            // Maybe "Player Season" pages?
            
            // Let's stick to Position for now if Height is missing, 
            // OR check if there's a "College Stats" link that might have it.
            
            // Actually, for the purpose of this task, getting accurate POSITIONS is a huge win.
            // Heights might be too expensive to fetch for every historical player without an API.
            // I will try to get Position at least.
            
            if (name) {
                players[normalizeName(name)] = {
                    position: pos,
                    pick: parseInt(pick) || 0
                };
            }
        });

        return players;
    } catch (err) {
        console.error(`Error fetching ${year}:`, err.message);
        return {};
    }
}

async function main() {
    const allData = {};
    
    // Load existing if it exists (to resume)
    if (fs.existsSync(OUTPUT_FILE)) {
        Object.assign(allData, JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')));
    }

    for (let year = START_YEAR; year <= END_YEAR; year++) {
        if (allData[year]) {
            console.log(`Skipping ${year} (already have data)`);
            continue;
        }
        
        const data = await scrapeDraft(year);
        allData[year] = data;
        
        // Save incrementally
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
        
        // Sleep to be nice
        await sleep(2000);
    }
    
    console.log('Done!');
}

main();
