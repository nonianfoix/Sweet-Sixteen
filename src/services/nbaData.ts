import type { NBAContractProfile } from '../types';
import { NBA_SALARIES } from '../data/nbaSalaries';
import { REAL_NBA_RATINGS } from '../data/realNbaRatings';
import { playerNameKey } from './utils';

const NBA_SALARY_PROFILES_BY_KEY: Record<string, NBAContractProfile> = {};
for (const [name, profile] of Object.entries(NBA_SALARIES)) {
    if (!profile) continue;
    NBA_SALARY_PROFILES_BY_KEY[playerNameKey(name)] = profile;
}

const REAL_NBA_RATINGS_BY_KEY: Record<string, number> = {};
for (const [name, rating] of Object.entries(REAL_NBA_RATINGS)) {
    if (typeof rating !== 'number' || !Number.isFinite(rating)) continue;
    REAL_NBA_RATINGS_BY_KEY[playerNameKey(name)] = rating;
}

export const getNBASalaryProfileForName = (name: string): NBAContractProfile | undefined => {
    const trimmed = (name || '').trim();
    return NBA_SALARIES[trimmed] || NBA_SALARY_PROFILES_BY_KEY[playerNameKey(trimmed)];
};

export const getRealNbaRatingForName = (name: string): number | undefined => {
    const trimmed = (name || '').trim();
    const direct = REAL_NBA_RATINGS[trimmed];
    if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
    return REAL_NBA_RATINGS_BY_KEY[playerNameKey(trimmed)];
};

