import * as fs from 'fs';
import * as path from 'path';

// Helper to normalize names (replicated from gameService to be standalone)
const normalizePlayerName = (name: string): string => {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").toLowerCase().trim();
};

const ingestNbaSalaries = () => {
    // Assuming running from project root
    const csvPath = path.resolve(process.cwd(), 'data/NBA Salaries.csv');
    const outputPath = path.resolve(process.cwd(), 'data/nbaSalaries.ts');

    try {
        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = fileContent.split('\n');
        
        const salaries: Record<string, number> = {};
        
        // Simple CSV parser that handles quoted fields
        const parseLine = (text: string) => {
            const result = [];
            let cur = '';
            let inQuote = false;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    result.push(cur.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
                    cur = '';
                } else {
                    cur += char;
                }
            }
            result.push(cur.trim().replace(/^"|"$/g, ''));
            return result;
        };
        
        // Skip initial empty lines/headers if needed, but we'll filter by row content
        lines.forEach(line => {
            const cols = parseLine(line);
            
            // Check if it's a data row
            // Format: Rk,Player,Tm,2025-26,...
            // We want rows where Rk is a number
            if (!cols[0] || isNaN(parseInt(cols[0]))) { 
                return;
            }

            const name = cols[1];
            // 2025-26 Salary is in column 3 (index 3) because of Rk, Player, Tm
            // But verify column indices:
            // 0: Rk, 1: Player, 2: Tm, 3: 2025-26
            const rawSalary = cols[3]; 
            
            if (name && rawSalary) {
                 const salary = parseInt(rawSalary.replace(/[^0-9]/g, ''));
                 if (!isNaN(salary)) {
                     // We use the raw name as key for now to match current usage in realNbaRatings etc using exact names
                     // OR should we normalize keys? The game seems to use "Nikola Jokić" as key in ratings.
                     // The requirement is to be compatible.
                     // The CSV has "Nikola Jokić".
                     // So we keep the name as is.
                     salaries[name] = salary;
                 }
            }
        });

        const outputContent = `export const NBA_SALARIES: Record<string, number> = ${JSON.stringify(salaries, null, 4)};\n`;
        
        fs.writeFileSync(outputPath, outputContent);
        console.log(`Successfully generated nbaSalaries.ts with ${Object.keys(salaries).length} player entries.`);

    } catch (err) {
        console.error('Error ingesting NBA salaries:', err);
    }
};

ingestNbaSalaries();
