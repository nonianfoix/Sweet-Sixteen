const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../data/nba drafts 2025-1969.csv');
const tsPath = path.join(__dirname, '../data/realNbaDrafts.ts');

// 1. Read existing TS file to preserve positions using Regex/String splitting
let tsContent = "";
try {
    tsContent = fs.readFileSync(tsPath, 'utf-8');
} catch (e) {
    console.log("Could not read existing file, starting fresh.");
}

const positionMap = new Map();

if (tsContent) {
    // Split by 'player: "'
    const chunks = tsContent.split('player: "');
    // Skip first chunk (header/imports)
    for (let i = 1; i < chunks.length; i++) {
        const chunk = chunks[i];
        // Extract player name (up to next quote)
        const nameEnd = chunk.indexOf('"');
        if (nameEnd === -1) continue;
        const player = chunk.substring(0, nameEnd);

        // Extract position
        // Look for 'position: "'
        const posStartMarker = 'position: "';
        const posStart = chunk.indexOf(posStartMarker);
        if (posStart !== -1) {
            const posContentStart = posStart + posStartMarker.length;
            const posEnd = chunk.indexOf('"', posContentStart);
            if (posEnd !== -1) {
                const position = chunk.substring(posContentStart, posEnd);
                if (position) {
                    positionMap.set(player, position);
                }
            }
        }
    }
}

console.log(`Mapped ${positionMap.size} player positions from existing file.`);

// 2. Read and parse CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split(/\r?\n/);

const drafts = {};
let currentYear = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(','); 
    
    // Check for year row: 4 digits in first column
    if (parts[0].match(/^\d{4}$/) && (parts[1] === 'draft' || parts[1] === '' || !parts[1])) {
        currentYear = parseInt(parts[0]);
        drafts[currentYear] = [];
        continue;
    }

    // Check for header row or empty/junk rows
    if (parts[0] === 'Rk' || !currentYear) {
        continue;
    }

    // Parse data row
    const pick = parseInt(parts[1]);
    if (isNaN(pick)) continue;

    const team = parts[2];
    const player = parts[3];
    const college = parts[4];

    if (!player) continue;

    const cleanPlayer = player.trim();
    
    // Look up position
    const position = positionMap.get(cleanPlayer) || "";

    drafts[currentYear].push({
        pick: pick,
        team: team,
        player: cleanPlayer,
        college: college,
        position: position
    });
}

// 3. Generate new TS content
let newTsContent = `
export interface RealDraftPick {
    pick: number;
    team: string;
    player: string;
    college: string;
    position: string;
}

export const REAL_NBA_DRAFTS: Record<number, RealDraftPick[]> = {
`;

// Sort years descending
const years = Object.keys(drafts).map(Number).sort((a, b) => b - a);

for (const year of years) {
    newTsContent += `    ${year}: [\n`;
    for (const pick of drafts[year]) {
        // Escape quotes in strings
        const safePlayer = pick.player.replace(/"/g, '\\"');
        const safeCollege = pick.college ? pick.college.replace(/"/g, '\\"') : "";
        
        newTsContent += `        {\n`;
        newTsContent += `            pick: ${pick.pick},\n`;
        newTsContent += `            team: "${pick.team}",\n`;
        newTsContent += `            player: "${safePlayer}",\n`;
        newTsContent += `            college: "${safeCollege}",\n`;
        newTsContent += `            position: "${pick.position}"\n`;
        newTsContent += `        },\n`;
    }
    newTsContent += `    ],\n`;
}

newTsContent += `};\n`;

// 4. Write to file
fs.writeFileSync(tsPath, newTsContent);
console.log(`Updated ${tsPath} with data for years ${years[years.length-1]} to ${years[0]}.`);
