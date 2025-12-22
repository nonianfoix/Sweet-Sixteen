import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../data/NBA Salaries.csv');
const outputPath = path.join(__dirname, '../data/nbaSalaries.ts');

try {
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split('\n');
    const salaries = {};

    for (const line of lines) {
        // Skip empty lines and the repeated header lines
        if (!line.trim() || line.startsWith(',,,Salary') || line.startsWith('Rk,Player')) {
            continue;
        }

        // Regex to match CSV fields, handling quotes
        const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        
        if (matches && matches.length >= 4) {
            const player = matches[1].replace(/^"|"$/g, '').trim(); // Remove quotes if present
            const salaryStr = matches[3].replace(/^"|"$/g, '').trim(); // 2025-26 column
            
            // Clean salary string: remove $ and ,
            const salary = parseInt(salaryStr.replace(/[$,]/g, ''), 10);
            
            if (player && !isNaN(salary)) {
                salaries[player] = salary;
            }
        }
    }

    const outputContent = `export const NBA_SALARIES: Record<string, number> = ${JSON.stringify(salaries, null, 4)};\n`;
    fs.writeFileSync(outputPath, outputContent);
    console.log(`Successfully wrote ${Object.keys(salaries).length} salaries to ${outputPath}`);

} catch (error) {
    console.error('Error processing NBA salaries:', error);
}
