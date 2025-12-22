// services/utils.ts

const SUFFIX_TOKENS = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

export const normalizePlayerName = (name: string): string => {
    let value = (name || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .trim();

    if (value.includes(',')) {
        const [last, first] = value.split(',', 2).map(part => part.trim());
        if (first && last) value = `${first} ${last}`;
    }

    value = value
        .replace(/[.'"’-]/g, '') // Remove punctuation/apostrophes/hyphens
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .trim();

    const parts = value.split(' ').filter(Boolean);
    while (parts.length > 1) {
        const last = parts[parts.length - 1].replace(/\.$/, '');
        if (!SUFFIX_TOKENS.has(last)) break;
        parts.pop();
    }

    return parts.join(' ');
};

export const playerNameKey = (name: string): string =>
    normalizePlayerName(name).replace(/[^a-z0-9]+/g, '');

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const clampTo40 = (value: number): number => clamp(value, 0, 40);

export const randomBetween = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export const pickRandom = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

export const shuffleArray = <T>(array: T[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};
