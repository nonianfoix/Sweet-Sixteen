
import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = './data/nba drafts 2025-1969.csv';
const OUTPUT_PATH = './data/realNbaDrafts.ts';

interface RealDraftPick {
    pick: number;
    team: string;
    player: string;
    college: string;
    position: string;
}

const processCSV = () => {
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = fileContent.split('\n');

    const drafts: Record<number, RealDraftPick[]> = {};
    let currentYear: number | null = null;
    let headers: string[] = [];

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Handle commas inside quotes? The CSV might have "Name, Jr."
        // Simple split might break. But looking at the file, names seem clean.
        // Let's assume simple split for now, or use a regex if needed.
        // The file viewer showed "Cooper Flagg", "Dylan Harper", etc. No quotes seen.
        const cols = trimmedLine.split(',').map(c => c.trim());

        // Detect Year
        // Format: "2025,draft,..." or "2024,..."
        if (cols[0].match(/^\d{4}$/) && (cols[1] === 'draft' || cols[1] === '')) {
            currentYear = parseInt(cols[0]);
            drafts[currentYear] = [];
            console.log(`Processing Draft Year: ${currentYear}`);
            return;
        }

        // Detect Headers
        // Format: "Rk,Pk,Tm,Player,..."
        if (cols[0] === 'Rk' && cols[1] === 'Pk') {
            headers = cols;
            return;
        }

        // Skip "Round" lines or other metadata
        if (cols[0] === '' || cols[0].startsWith('Round') || cols[0] === 'Rk') {
            return;
        }

        // Process Data Row
        if (currentYear && cols.length > 5) {
            const pk = parseInt(cols[1]);
            const tm = cols[2];
            const player = cols[3];
            const college = cols[4];
            
            // Stats for position heuristic
            // Rk,Pk,Tm,Player,College,Yrs,G,MP,PTS,TRB,AST
            // 0  1  2  3      4       5   6 7  8   9   10
            const trb = parseFloat(cols[9]) || 0;
            const ast = parseFloat(cols[10]) || 0;

            if (!isNaN(pk) && player) {
                let position = 'SF'; // Default
                if (ast > trb) {
                    position = 'PG'; // Guard lean
                } else if (trb > ast * 2) {
                    position = 'C'; // Big lean
                } else {
                    position = 'SF'; // Wing lean
                }

                drafts[currentYear].push({
                    pick: pk,
                    team: tm,
                    player: player,
                    college: college || 'International/HS',
                    position: position
                });
            }
        }
    });

    // Generate TypeScript Output
    let output = `
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
    const years = Object.keys(drafts).map(y => parseInt(y)).sort((a, b) => b - a);

    years.forEach(year => {
        output += `    ${year}: [\n`;
        drafts[year].forEach(pick => {
            output += `        {
            pick: ${pick.pick},
            team: "${pick.team}",
            player: "${pick.player.replace(/"/g, '\\"')}",
            college: "${pick.college.replace(/"/g, '\\"')}",
            position: "${pick.position}"
        },\n`;
        });
        output += `    ],\n`;
    });

    output += `};\n`;

    fs.writeFileSync(OUTPUT_PATH, output);
    console.log(`Successfully wrote to ${OUTPUT_PATH}`);
};

processCSV();
