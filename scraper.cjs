
const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('coaches.html', 'utf-8');
const $ = cheerio.load(html);

const coaches = [];
const table = $('#coaches');
const rows = table.find('tbody > tr');

rows.each((i, row) => {
    const coach = {};
    const cells = $(row).find('th, td');
    
    coach.name = $(cells[0]).text().replace('*', '').trim();
    coach.school = $(cells[1]).text().trim();
    coach.conference = $(cells[2]).text().trim();
    coach.wins_seas = $(cells[4]).text().trim();
    coach.losses_seas = $(cells[5]).text().trim();
    coach.wl_pct_seas = $(cells[6]).text().trim();
    coach.ap_pre = $(cells[7]).text().trim();
    coach.ap_post = $(cells[8]).text().trim();
    coach.ncaa_seas = $(cells[9]).text().trim();
    coach.since = $(cells[11]).text().trim();
    coach.wins_cur = $(cells[12]).text().trim();
    coach.losses_cur = $(cells[13]).text().trim();
    coach.wl_pct_cur = $(cells[14]).text().trim();
    coach.ncaa_cur = $(cells[15]).text().trim();
    coach.sw16_cur = $(cells[16]).text().trim();
    coach.ff_cur = $(cells[17]).text().trim();
    coach.champ_cur = $(cells[18]).text().trim();
    coach.wins_car = $(cells[20]).text().trim();
    coach.losses_car = $(cells[21]).text().trim();
    coach.wl_pct_car = $(cells[22]).text().trim();
    coach.ncaa_car = $(cells[23]).text().trim();
    coach.sw16_car = $(cells[24]).text().trim();
    coach.ff_car = $(cells[25]).text().trim();
    coach.champ_car = $(cells[26]).text().trim();

    // Skip header rows that are repeated in the body
    if (coach.name === 'Coach') {
        return;
    }

    coaches.push(coach);
});

const fileContent = `
import { Coach } from '../types';

export const COACHES_DB: any[] = ${JSON.stringify(coaches, null, 2)};
`;

fs.writeFileSync('scrapedCoaches.ts', fileContent);

console.log('Scraped data written to scrapedCoaches.ts');
