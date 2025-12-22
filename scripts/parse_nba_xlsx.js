import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../NBA players active.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const processedData = data.map(row => {
        let height = row['HT'];
        if (typeof height === 'number') {
            const dateInfo = XLSX.SSF.parse_date_code(height);
            // Excel treats 6-8 as June 8th. Month is 6, Day is 8.
            height = `${dateInfo.m}-${dateInfo.d}`;
        }
        
        return [
            row['Player'],
            row['Current Team'],
            row['Pos'],
            height,
            row['WT'],
            row['Age'],
            row['Pre-Draft Team'],
            row['Draft Status'],
            row['Nationality'] ? row['Nationality'].replace(/\n/g, '/') : '', // Handle newlines in nationality
            row['YOS']
        ].join('|');
    });

    const header = 'Player|Team|Pos|HT|WT|Age|Pre-Draft Team|Draft Status|Nationality|YOS';
    const fileContent = [header, ...processedData].join('\n');

    const outputPath = path.resolve(__dirname, '../nba_roster.txt');
    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully wrote ${processedData.length} players to ${outputPath}`);
} catch (error) {
    console.error('Error reading Excel file:', error);
}

