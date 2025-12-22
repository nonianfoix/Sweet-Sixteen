
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../data/NBA advanced stats.csv');
const OUTPUT_PATH = path.join(__dirname, '../data/realNbaRatings.ts');

const TOP_PLAYERS_OVERRIDES = {
    "Nikola Jokić": 98,
    "Luka Dončić": 97,
    "Giannis Antetokounmpo": 97,
    "Shai Gilgeous-Alexander": 97,
    "Joel Embiid": 96,
    "Jayson Tatum": 96,
    "Stephen Curry": 95,
    "LeBron James": 95,
    "Kevin Durant": 94,
    "Anthony Davis": 94,
    "Anthony Edwards": 93,
    "Devin Booker": 93,
    "Jalen Brunson": 93,
    "Donovan Mitchell": 92,
    "Jaylen Brown": 92,
    "Victor Wembanyama": 91,
    "Tyrese Haliburton": 91,
    "Jimmy Butler": 90,
    "Kyrie Irving": 90,
    "Bam Adebayo": 89,
    "Ja Morant": 93,
    "Zion Williamson": 88,
    "Kawhi Leonard": 92, 
    "Damian Lillard": 89
};

try {
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n');
    const ratingsMap = {};

    // Header index
    const headers = lines[0].split(',').map(h => h.trim());
    const playerIdx = headers.indexOf('Player');
    const perIdx = headers.indexOf('PER');

    if (playerIdx === -1 || perIdx === -1) {
        throw new Error('Could not find Player or PER columns in CSV');
    }

    lines.slice(1).forEach(line => {
        // Simple CSV parse handling comma in quotes if simple split fails? 
        // The data seems simple enough, but "Player" might have simple names. 
        // Row 1 example: 1,Nikola Jokić,30,DEN...
        const cols = line.split(',');
        if (cols.length < 5) return;

        const name = cols[1]; // Indices shift if rank is col 0
        const per = parseFloat(cols[8]); // Rk, Player, Age, Team, Pos, G, GS, MP, PER (idx 8)

        if (name && !isNaN(per)) {
            // Check override
            if (TOP_PLAYERS_OVERRIDES[name]) {
                ratingsMap[name] = TOP_PLAYERS_OVERRIDES[name];
            } else if (TOP_PLAYERS_OVERRIDES[name.normalize('NFD').replace(/[\u0300-\u036f]/g, "")]) {
                 ratingsMap[name] = TOP_PLAYERS_OVERRIDES[name.normalize('NFD').replace(/[\u0300-\u036f]/g, "")];
            } else {
                // Formula: 60 + PER
                // Cap at 90 for non-overrides to prevent weird outliers (like low minute wonders) from being gods
                // Floor at 68
                let calc = Math.round(58 + per);
                
                // Adjustments for very low minutes outliers? 
                // The CSV has 'MP' at col 7. 
                const mp = parseInt(cols[7]);
                if (mp < 100) {
                    calc = Math.min(calc, 75); // Penalty for small sample size
                }

                calc = Math.max(68, Math.min(calc, 89));
                ratingsMap[name] = calc;
            }
        }
    });

    const fileContent = `// Auto-generated ratings based on NBA 2K26 Top 100 & Advanced Stats PER
export const REAL_NBA_RATINGS: Record<string, number> = ${JSON.stringify(ratingsMap, null, 4)};
`;

    fs.writeFileSync(OUTPUT_PATH, fileContent);
    console.log(`Successfully generated ratings for ${Object.keys(ratingsMap).length} players.`);

} catch (err) {
    console.error('Error processing ratings:', err);
}
