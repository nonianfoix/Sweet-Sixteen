import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../data/NBA Salaries.csv');
const outputPath = path.join(__dirname, '../data/nbaSalaries.ts');

const csvContent = fs.readFileSync(csvPath, 'utf8');
const sourceSha256 = crypto.createHash('sha256').update(csvContent).digest('hex');
const generatedAt = new Date().toISOString();

const lines = csvContent.split(/\r?\n/);

// Expected headers: Rk,Player,Tm,2025-26,2026-27,2027-28,2028-29,2029-30,2030-31,Guaranteed

const parseCsvLine = (line) => {
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (ch === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
            continue;
        }
        current += ch;
    }
    parts.push(current.trim());
    return parts.map(part => part.replace(/^"|"$/g, '').trim());
};

const normalizePlayerName = (name) => {
    let value = (name || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    if (value.includes(',')) {
        const [last, first] = value.split(',', 2).map(part => part.trim());
        if (first && last) value = `${first} ${last}`;
    }

    value = value
        .replace(/[.'"’-]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();

    value = value.replace(/\b(jr|sr|ii|iii|iv|v)\b$/i, '').trim();
    return value;
};

const playerNameKey = (name) => normalizePlayerName(name).replace(/[^a-z0-9]+/g, '');

const salaries = {};

const headerLine = lines.find(l => l && l.includes('Rk') && l.includes('Player') && l.includes('Tm'));
if (!headerLine) {
    throw new Error('Could not find NBA salary CSV header row (expected columns like Rk, Player, Tm, 2025-26...).');
}

const headers = parseCsvLine(headerLine);
const rkIdx = headers.findIndex(h => h.trim() === 'Rk');
const playerIdx = headers.findIndex(h => h.trim() === 'Player');
const salaryColumnIndices = headers
    .map((h, idx) => ({ h: (h || '').trim(), idx }))
    .filter(({ h }) => /^\d{4}-\d{2}$/.test(h))
    .map(({ idx }) => idx);

if (rkIdx < 0 || playerIdx < 0 || salaryColumnIndices.length === 0) {
    throw new Error(`NBA salary CSV header missing required columns (rkIdx=${rkIdx}, playerIdx=${playerIdx}, salaryCols=${salaryColumnIndices.length}).`);
}

const keyToDisplayName = new Map();

for (const rawLine of lines) {
    const line = (rawLine || '').trim();
    if (!line || line.startsWith(',,,Salary') || line.startsWith('Rk,Player')) continue;

    const parts = parseCsvLine(line);
    if (parts.length <= Math.max(playerIdx, ...salaryColumnIndices)) continue;

    const rk = parts[rkIdx];
    if (!rk || Number.isNaN(parseInt(rk, 10))) continue;

    const name = (parts[playerIdx] || '').trim();
    if (!name) continue;

    const yearlySalaries = [];
    for (const idx of salaryColumnIndices) {
        const rawValue = (parts[idx] || '').replace(/[$,",]/g, '').trim();
        const parsed = rawValue ? parseInt(rawValue, 10) : NaN;
        if (Number.isFinite(parsed) && parsed > 0) yearlySalaries.push(parsed);
    }

    if (yearlySalaries.length === 0) continue;

    const key = playerNameKey(name);
    const prior = keyToDisplayName.get(key);
    if (prior && prior !== name) {
        console.warn(`Name key collision: "${prior}" and "${name}" -> ${key}. Keeping first.`);
        continue;
    }
    keyToDisplayName.set(key, name);

    salaries[name] = {
        salary: yearlySalaries[0],
        yearsLeft: yearlySalaries.length,
        yearlySalaries,
    };
}

const tsContent = `import { NBAContractProfile } from '../types';

export const NBA_SALARIES_SCHEMA_VERSION = 1;
export const NBA_SALARIES_GENERATED_AT = ${JSON.stringify(generatedAt)};
export const NBA_SALARIES_SOURCE_SHA256 = ${JSON.stringify(sourceSha256)};

export const NBA_SALARIES: Record<string, NBAContractProfile> = ${JSON.stringify(salaries, null, 2)};
`;

fs.writeFileSync(outputPath, tsContent);
console.log(`Generated nbaSalaries.ts with ${Object.keys(salaries).length} player contracts.`);
