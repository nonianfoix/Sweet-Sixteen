
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../data/allHistoricalDrafts.ts');
const ENRICHMENT_FILE = path.join(__dirname, '../data/draft_enrichment.json');
const CHAMPIONS_FILE = path.join(__dirname, '../data/nba champions.csv');
const DRAFTS_FILE = path.join(__dirname, '../data/realNbaDrafts.ts');
const PLAYERS_FILE = path.join(__dirname, '../data/realNbaPlayers.ts');

const BASE_CALENDAR_YEAR = 2024;

// Helper: Normalize Name
const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

// 1. Parse Champions CSV
function parseChampions() {
    const content = fs.readFileSync(CHAMPIONS_FILE, 'utf8');
    const lines = content.split('\n');
    const champions = {}; // Year -> Champion Name
    
    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length < 3) return;
        const year = parseInt(parts[0]);
        if (!isNaN(year)) {
            champions[year] = parts[2]; // Column 3 is Champion
        }
    });
    return champions;
}

// 2. Parse Real NBA Drafts (TS Regex)
function parseRealNbaDrafts() {
    const content = fs.readFileSync(DRAFTS_FILE, 'utf8');
    const drafts = {};
    
    // Find year blocks: 2025: [ ... ]
    const yearRegex = /(\d{4}):\s*\[([\s\S]*?)\]/g;
    let match;
    while ((match = yearRegex.exec(content)) !== null) {
        const year = parseInt(match[1]);
        const block = match[2];
        
        // Parse objects inside block
        const picks = [];
        const objRegex = /{\s*pick:\s*(\d+),[\s\S]*?team:\s*"([^"]+)",[\s\S]*?player:\s*"([^"]+)",[\s\S]*?college:\s*"([^"]*)",[\s\S]*?position:\s*"([^"]*)"/g;
        let objMatch;
        while ((objMatch = objRegex.exec(block)) !== null) {
            picks.push({
                pick: parseInt(objMatch[1]),
                team: objMatch[2],
                player: objMatch[3],
                college: objMatch[4],
                position: objMatch[5]
            });
        }
        drafts[year] = picks;
    }
    return drafts;
}

// 3. Parse Real NBA Players (TS Regex)
function parseRealNbaPlayers() {
    const content = fs.readFileSync(PLAYERS_FILE, 'utf8');
    const players = [];
    
    // Regex to find player objects
    const playerRegex = /{\s*"name":\s*"([^"]+)",[\s\S]*?"team":\s*"([^"]+)",[\s\S]*?"position":\s*"([^"]+)",[\s\S]*?"height":\s*"([^"]+)",[\s\S]*?"weight":\s*(\d+),[\s\S]*?"age":\s*(\d+),[\s\S]*?"preDraftTeam":\s*"([^"]+)",[\s\S]*?"draftStatus":\s*"([^"]+)"/g;
    
    let match;
    while ((match = playerRegex.exec(content)) !== null) {
        players.push({
            name: match[1],
            team: match[2],
            position: match[3],
            height: match[4],
            weight: parseInt(match[5]),
            age: parseInt(match[6]),
            preDraftTeam: match[7],
            draftStatus: match[8]
        });
    }
    return players;
}

// 4. Load Enrichment
function loadEnrichment() {
    if (fs.existsSync(ENRICHMENT_FILE)) {
        return JSON.parse(fs.readFileSync(ENRICHMENT_FILE, 'utf8'));
    }
    return {};
}

function main() {
    console.log('Parsing data...');
    const champions = parseChampions();
    const baseDrafts = parseRealNbaDrafts();
    const activePlayers = parseRealNbaPlayers();
    const enrichment = loadEnrichment();
    
    const finalDrafts = {};
    const years = Object.keys(baseDrafts).map(Number).sort((a, b) => b - a);
    
    // Group active players by draft year
    const playersByYear = {};
    activePlayers.forEach(p => {
        let year = 2020;
        const match = p.draftStatus.match(/(\d{4})/);
        if (match) year = parseInt(match[1]);
        
        if (!playersByYear[year]) playersByYear[year] = [];
        playersByYear[year].push(p);
    });

    years.forEach(year => {
        const season = year - BASE_CALENDAR_YEAR - 1;
        const picks = [];
        const basePicks = baseDrafts[year] || [];
        const yearPlayers = playersByYear[year] || [];
        const yearEnrichment = enrichment[year] || {};
        
        // Process Base Picks
        basePicks.forEach(bp => {
            const normName = normalizeName(bp.player);
            
            // Find matching active player
            const activeP = yearPlayers.find(p => normalizeName(p.name) === normName);
            
            // Find enrichment data
            const enrichP = yearEnrichment[normName];
            
            let playerObj = {
                name: bp.player,
                id: activeP ? `nba-active-${normName}` : `nba-hist-${year}-${bp.pick}`,
                position: bp.position || (activeP ? activeP.position : (enrichP ? enrichP.position : '')) || 'SG', // Default to SG if unknown
                height: activeP ? activeP.height : '', // Only have height for active players usually
                weight: activeP ? activeP.weight : undefined,
                overall: activeP ? 75 + Math.floor(Math.random() * 10) : 70 + Math.floor(Math.random() * 15) // Placeholder
            };
            
            // If we have enrichment position and current is empty, use it
            if (!playerObj.position && enrichP && enrichP.position) {
                playerObj.position = enrichP.position;
            }
            
            // Prioritize Active Player data for origin if available (User Request)
            const originTeam = (activeP && activeP.preDraftTeam) ? activeP.preDraftTeam : (bp.college || 'Unknown');

            picks.push({
                pick: bp.pick,
                round: bp.pick <= 30 ? 1 : 2,
                player: playerObj,
                season: season,
                originalTeam: originTeam,
                nbaTeam: bp.team,
                source: 'NCAA', // Simplified
                originDescription: originTeam
            });
        });
        
        // Inject missing active players (e.g. Undrafted or missing from base list)
        yearPlayers.forEach(p => {
            const normName = normalizeName(p.name);
            const exists = picks.find(pick => normalizeName(pick.player.name) === normName);
            
            if (!exists) {
                // Determine pick number
                let pickNum = 61 + picks.length; // Default to end
                let round = 2;
                
                const match = p.draftStatus.match(/Pick\s*(\d+)/i);
                if (match) {
                    const realPick = parseInt(match[1]);
                    // If the slot is taken by a "Generic" or mismatch, we might want to overwrite?
                    // For now, just append to avoid destroying base data structure unless we are sure.
                    // Actually, if it's a real pick number, we should try to place them correctly?
                    // But baseDrafts usually has the real order. 
                    // So if they are missing, it's likely they are undrafted or the base list is incomplete.
                    // We'll append.
                }

                picks.push({
                    pick: pickNum,
                    round: round,
                    player: {
                        name: p.name,
                        id: `nba-active-${normName}`,
                        position: p.position,
                        height: p.height,
                        weight: p.weight,
                        overall: 75 + Math.floor(Math.random() * 10)
                    },
                    season: season,
                    originalTeam: p.preDraftTeam,
                    nbaTeam: p.team, // Current team, not draft team... acceptable for now
                    source: 'NCAA',
                    originDescription: p.preDraftTeam
                });
            }
        });
        
        // Sort picks
        picks.sort((a, b) => a.pick - b.pick);
        
        finalDrafts[year] = {
            season,
            draftYear: year,
            nbaChampion: champions[year] || 'Unknown',
            picks
        };
    });
    
    // Generate TS File
    const tsContent = `import { NBADraftHistoryEntry } from '../types';

export const ALL_HISTORICAL_DRAFTS: Record<number, NBADraftHistoryEntry> = ${JSON.stringify(finalDrafts, null, 4)};
`;

    fs.writeFileSync(OUTPUT_FILE, tsContent);
    console.log(`Generated ${OUTPUT_FILE}`);
}

main();
