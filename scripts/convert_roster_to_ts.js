import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rosterPath = path.resolve(__dirname, '../nba_roster.txt');
const outputPath = path.resolve(__dirname, '../data/realNbaPlayers.ts');

const fileContent = fs.readFileSync(rosterPath, 'utf-8');
const lines = fileContent.split('\n').filter(line => line.trim() !== '');

const playersBySchool = {};

// Skip header
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('|');
    if (parts.length < 7) continue;

    const player = {
        name: parts[0],
        team: parts[1],
        position: parts[2],
        height: parts[3],
        weight: parseInt(parts[4]) || 0,
        age: parseInt(parts[5]) || 0,
        preDraftTeam: parts[6],
        draftStatus: parts[7],
        nationality: parts[8],
        yos: parseInt(parts[9]) || 0
    };

    const school = player.preDraftTeam;
    if (!playersBySchool[school]) {
        playersBySchool[school] = [];
    }
    playersBySchool[school].push(player);
}

const tsContent = `
export interface RealNbaPlayer {
    name: string;
    team: string;
    position: string;
    height: string;
    weight: number;
    age: number;
    preDraftTeam: string;
    draftStatus: string;
    nationality: string;
    yos: number;
}

export const REAL_NBA_PLAYERS: Record<string, RealNbaPlayer[]> = ${JSON.stringify(playersBySchool, null, 4)};
`;

if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

fs.writeFileSync(outputPath, tsContent);
console.log(`Successfully wrote real NBA players to ${outputPath}`);
