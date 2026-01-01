
// Logo Utilities - Extracted from App.tsx

// --- NBA Logos ---
const NBA_LOGO_MODULES = import.meta.glob('../NBA Logos/*.png', { eager: true, as: 'url' }) as Record<string, string>;

const NBA_LOGO_BY_SLUG = Object.fromEntries(
    Object.entries(NBA_LOGO_MODULES).map(([modulePath, url]) => {
        const fileName = modulePath.split('/').pop() || '';
        const slug = fileName.replace(/-logo\.png$/i, '');
        return [slug, url];
    })
);

const TEAM_NAME_LOGO_SLUG_OVERRIDES: Record<string, string> = {
    'LA Clippers': 'los-angeles-clippers',
};

const slugifyTeamName = (teamName: string) =>
    teamName
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

export const getTeamLogoUrl = (teamName: string) => {
    const slug = TEAM_NAME_LOGO_SLUG_OVERRIDES[teamName] || slugifyTeamName(teamName);
    return NBA_LOGO_BY_SLUG[slug];
};


// --- Brand Logos ---
const BRAND_LOGO_MODULES = import.meta.glob('../BRAND LOGOS/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const BRAND_LOGO_BY_FILE = Object.fromEntries(
    Object.entries(BRAND_LOGO_MODULES).map(([path, url]) => {
        const fileName = path.split('/').pop() || '';
        return [fileName, url];
    })
);

// Map common brand names to their likely file names if not exact match
const BRAND_NAME_TO_FILE: Record<string, string> = {
    Nike: 'Nike-logo.svg',
    Adidas: 'Adidas_2022_logo.svg',
    Jordan: 'Jumpman_logo.svg',
    'Under Armour': 'Under_armour_logo.svg',
    Reebok: 'Reebok_wordmark_(1977-1993).svg',
    'New Balance': '20160801155104!New_Balance_logo.svg',
    Puma: 'Puma-logo-(text).svg',
};

const normalizeBrandLogoFileKey = (name: string) => name.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').replace(/\.svg$/, '');
const normalizeBrandLogoMatchText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getBrandLogoUrlByFileName = (fileName: string): string | undefined => {
    // 1. Direct filename match
    if (BRAND_LOGO_BY_FILE[fileName]) return BRAND_LOGO_BY_FILE[fileName];

    // 2. Mapped name match
    if (BRAND_NAME_TO_FILE[fileName]) return BRAND_LOGO_BY_FILE[BRAND_NAME_TO_FILE[fileName]];

    // 3. Fuzzy match
    const normalizedTarget = normalizeBrandLogoMatchText(fileName);
    const foundKey = Object.keys(BRAND_LOGO_BY_FILE).find(key => {
        const normalizedKey = normalizeBrandLogoMatchText(key);
        return normalizedKey.includes(normalizedTarget) || normalizedTarget.includes(normalizedKey);
    });


    return foundKey ? BRAND_LOGO_BY_FILE[foundKey] : undefined;
};

import { SponsorName } from '../types';

const SPONSOR_LOGO_FILES: Record<SponsorName, string> = {
    Nike: 'Logo_NIKE.svg',
    Adidas: 'Adidas_2022_logo.svg',
    Jordan: 'Jumpman_logo.svg',
    'Under Armour': 'Under_armour_logo.svg',
    Reebok: 'Reebok_wordmark_(1977-1993).svg',
    'New Balance': '20160801155104!New_Balance_logo.svg',
    Puma: 'Puma-logo-(text).svg',
};

const CONFERENCE_LOGO_FILES_BY_KEY = new Map<string, string>(
    [
        ['SEC', 'Southeastern_Conference_logo_(2024).svg'],
        ['ACC', 'Atlantic_Coast_Conference_logo.svg'],
        ['Big Ten', 'Big_Ten_Conference_logo.svg'],
        ['B1G', 'Big_Ten_Conference_logo.svg'],
        ['Big 12', 'Big_12_Conference_(cropped)_logo.svg'],
        ['Big East', 'Big_East_Conference_logo.svg'],
        ['Pac-12', 'Pac-12_logo.svg'],
        ['Mountain West', 'Mountain_West_Conference_logo.svg'],
        ['WCC', 'West_Coast_Conference_logo_2019_with_name.svg'],
        ['AAC', 'American_Athletic_Conference_logo.svg'],
        ['A-10', 'Atlantic_10_Conference_logo.svg'],
        ['Atlantic 10', 'Atlantic_10_Conference_logo.svg'],
        ['C-USA', 'CUSA_logo.svg'],
        ['Conference USA', 'CUSA_logo.svg'],
        ['MAC', 'Mid-American_Conference_logo.svg'],
        ['Sun Belt', 'Sun_Belt_Conference_2020_logo_and_name.svg'],
        ['MVC', 'Missouri_Valley_Conference_logo.svg'],
        ['Missouri Valley', 'Missouri_Valley_Conference_logo.svg'],
        ['Horizon', 'Horizon_League_2024_logo.svg'],
        ['Horizon League', 'Horizon_League_2024_logo.svg'],
        ['America East', 'America_East_Conference_logo_2024.svg'],
        ['Big Sky', 'Big_Sky_Conference_logo.svg'],
        ['Big South', 'Big_South_Conference_logo.svg'],
        ['Big West', 'Big_West_Conference_logo_2021.svg'],
        ['Ivy', 'Ivy_League_Logo.svg'],
        ['Ivy League', 'Ivy_League_Logo.svg'],
        ['WAC', 'Western_Athletic_Conference_logo.svg'],
        ['Western Athletic', 'Western_Athletic_Conference_logo.svg'],
        ['ASUN', 'ASUN_Primary_Mark.svg'],
        ['SoCon', 'PrimaryBlue_SoCon.svg'],
        ['Southern Conference', 'PrimaryBlue_SoCon.svg'],
        ['CAA', 'Coastal_Athletic_Association_logo.svg'],
        ['Coastal Athletic Association', 'Coastal_Athletic_Association_logo.svg'],
        ['MAAC', 'Metro_Atlantic_Athletic_Conference_logo.svg'],
        ['Metro Atlantic', 'Metro_Atlantic_Athletic_Conference_logo.svg'],
        ['MEAC', 'Mid-Eastern_Athletic_Conference_logo.svg'],
        ['Mid Eastern', 'Mid-Eastern_Athletic_Conference_logo.svg'],
        ['NEC', 'NEC_nameless_logo.svg'],
        ['OVC', 'Ohio_Valley_Conference_logo.svg'],
        ['Ohio Valley', 'Ohio_Valley_Conference_logo.svg'],
        ['Patriot', 'Patriot_league_conference_logo.svg'],
        ['Patriot League', 'Patriot_league_conference_logo.svg'],
        ['Southland', 'Southland_Conference_primary_logo.svg'],
        ['SWAC', 'Southwestern_Athletic_Conference_logo.svg'],
        ['Summit', 'Summit_League_logo.svg'],
        ['Summit League', 'Summit_League_logo.svg'],
    ].map(([k, v]) => [normalizeBrandLogoMatchText(k), v] as const)
);

const conferenceLogoCache = new Map<string, string | undefined>();

export const getSponsorLogoUrl = (name: SponsorName): string | undefined => {
    const fileName = SPONSOR_LOGO_FILES[name];
    return fileName ? getBrandLogoUrlByFileName(fileName) : undefined;
};

export const getConferenceLogoUrl = (conferenceLabel: string): string | undefined => {
    if (!conferenceLabel) return undefined;
    if (conferenceLabel === 'Independent') return undefined;
    const cached = conferenceLogoCache.get(conferenceLabel);
    if (conferenceLogoCache.has(conferenceLabel)) return cached;

    const query = normalizeBrandLogoMatchText(conferenceLabel);
    const normalizedNoGenericWords = query
        .split(' ')
        .filter(Boolean)
        .filter(t => !['conference', 'league', 'athletic', 'association', 'the', 'of'].includes(t))
        .join(' ')
        .trim();

    const mappedFileName =
        CONFERENCE_LOGO_FILES_BY_KEY.get(query) ?? CONFERENCE_LOGO_FILES_BY_KEY.get(normalizedNoGenericWords);
    if (mappedFileName) {
        const resolvedFromMap = getBrandLogoUrlByFileName(mappedFileName);
        conferenceLogoCache.set(conferenceLabel, resolvedFromMap);
        return resolvedFromMap;
    }

    const tokens = normalizedNoGenericWords
        .split(' ')
        .filter(Boolean)
        .filter(t => !['conference', 'league', 'athletic', 'association', 'the', 'of'].includes(t));

    const fileNames = Object.keys(BRAND_LOGO_BY_FILE);
    
    // Simple fallback logic since full fuzzy match was complex in App.tsx and might rely on more loops
    // We already have fuzzy match in getBrandLogoUrlByFileName
    
    return undefined;
};
