
import { SCHOOL_COLORS } from '../constants';
import type { TeamColors, RecruitNilPriority, MotivationKey } from '../types';

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

export const haversineMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 3958.8; // Radius of Earth in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// --- UI / Formatting Utils ---

export const formatPlayerHeight = (inches: number): string => {
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
};

export const formatRecruitPriority = (priority?: RecruitNilPriority): string => {
  if (!priority) return '-';
  if (priority === 'LongTermStability') return 'Long-Term Stability';
  if (priority === 'DraftStock') return 'Draft Stock';
  if (priority === 'AcademicSupport') return 'Academic Support';
  if (priority === 'BrandExposure') return 'Brand Exposure';
  return priority;
};

export const getWhyBadgeTheme = (badge: string): { key: MotivationKey } | null => {
  const b = (badge || '').toLowerCase();
  if (b.startsWith('playing time')) return { key: 'playingTime' };
  if (b.startsWith('nil')) return { key: 'nil' };
  if (b.startsWith('exposure')) return { key: 'exposure' };
  if (b.startsWith('proximity')) return { key: 'proximity' };
  if (b.startsWith('academics')) return { key: 'academics' };
  if (b.startsWith('relationship')) return { key: 'relationship' };
  return null;
};

const SCHOOL_LOGO_MODULES = import.meta.glob('../school logos/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const SCHOOL_LOGO_BY_SLUG = Object.fromEntries(
  Object.entries(SCHOOL_LOGO_MODULES).map(([modulePath, url]) => {
    const fileName = modulePath.split('/').pop() || '';
    const slug = fileName.replace(/\.svg$/i, '');
    return [slug, url];
  })
) as Record<string, string>;

const normalizeSchoolTokens = (name: string): string[] => {
  const raw = (name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const tokens = raw.length ? raw.split(/\s+/) : [];
  const normalized = tokens.map(t => {
    if (t === 'university') return 'u';
    if (t === 'state') return 'st';
    if (t === 'saint') return 'st';
    return t;
  });

  const merged: string[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const token = normalized[i]!;
    if (token.length === 1) {
      let combined = token;
      while (i + 1 < normalized.length && normalized[i + 1]!.length === 1) {
        combined += normalized[i + 1]!;
        i++;
      }
      merged.push(combined);
    } else {
      merged.push(token);
    }
  }
  return merged.filter(Boolean);
};

const schoolNameToBestSlug = (schoolName: string): string => {
  const tokens = normalizeSchoolTokens(schoolName);
  return tokens.join('-');
};

export const getSchoolLogoUrl = (schoolName: string): string | undefined => {
  if (!schoolName) return undefined;

  const specialCases: Record<string, string> = {
    'USC': 'southern-california',
    Miami: 'miami-fl',
    'Miami (OH)': 'miami-oh',
    Albany: 'albany-ny',
  };

  const direct = specialCases[schoolName];
  if (direct && SCHOOL_LOGO_BY_SLUG[direct]) return SCHOOL_LOGO_BY_SLUG[direct];

  const slug = schoolNameToBestSlug(schoolName);
  if (SCHOOL_LOGO_BY_SLUG[slug]) return SCHOOL_LOGO_BY_SLUG[slug];

  const prefixMatches = Object.keys(SCHOOL_LOGO_BY_SLUG)
    .filter(s => s === slug || s.startsWith(`${slug}-`))
    .sort((a, b) => a.length - b.length);
  if (prefixMatches.length) return SCHOOL_LOGO_BY_SLUG[prefixMatches[0]!]!;

  return undefined;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    if ([r, g, b].some(n => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    if ([r, g, b].some(n => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
};

export const relativeLuminance = (rgb: { r: number; g: number; b: number }): number => {
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const rgbaFromHex = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamped})`;
};

export const bestTextColor = (bgHex: string): string => {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return '#111827';
  return relativeLuminance(rgb) < 0.35 ? '#ffffff' : '#111827';
};

export const teamColor = (teamName: string, index: number): string => {
  const palette = ['#2563eb', '#16a34a', '#7c3aed', '#f59e0b', '#dc2626', '#0ea5e9', '#0891b2', '#db2777'];
  const tc = (SCHOOL_COLORS as Record<string, TeamColors | undefined>)[teamName];
  const preferred = tc?.primary && tc.primary.toUpperCase() !== '#FFFFFF' ? tc.primary : tc?.secondary;
  return preferred || palette[index % palette.length]!;
};

export const tierAccent = (tier: string) => {
  if (tier === 'Leader') return { border: '#22c55e', pillBg: '#dcfce7', pillText: '#166534', pct: '#16a34a' };
  if (tier === 'In The Mix') return { border: '#3b82f6', pillBg: '#dbeafe', pillText: '#1d4ed8', pct: '#2563eb' };
  if (tier === 'Chasing') return { border: '#fb923c', pillBg: '#ffedd5', pillText: '#9a3412', pct: '#374151' };
  return { border: '#9ca3af', pillBg: '#f3f4f6', pillText: '#374151', pct: '#374151' };
};

export const STATE_CENTROIDS: Record<string, { lat: number; lon: number }> = {
    'AK': { lat: 58.3020694, lon: -134.4104388 },
    'AL': { lat: 32.3777298, lon: -86.3005639 },
    'AR': { lat: 34.7467450, lon: -92.2892284 },
    'AZ': { lat: 33.4482497, lon: -112.0970650 },
    'CA': { lat: 38.5765854, lon: -121.4935591 },
    'CO': { lat: 39.7392198, lon: -104.9849779 },
    'CT': { lat: 41.7642752, lon: -72.6823164 },
    'DE': { lat: 39.1572815, lon: -75.5195811 },
    'DC': { lat: 38.8951000, lon: -77.0364000 },
    'FL': { lat: 30.4381047, lon: -84.2821265 },
    'GA': { lat: 33.7490287, lon: -84.3879614 },
    'HI': { lat: 21.3073439, lon: -157.8573111 },
    'IA': { lat: 41.5911079, lon: -93.6038358 },
    'ID': { lat: 43.6177948, lon: -116.1998483 },
    'IL': { lat: 39.7983912, lon: -89.6547203 },
    'IN': { lat: 39.7683841, lon: -86.1627697 },
    'KS': { lat: 39.0482389, lon: -95.6780057 },
    'KY': { lat: 38.1866989, lon: -84.8753598 },
    'LA': { lat: 30.4570240, lon: -91.1873935 },
    'MA': { lat: 42.3587532, lon: -71.0640129 },
    'MD': { lat: 38.9788927, lon: -76.4910370 },
    'ME': { lat: 44.3072130, lon: -69.7816228 },
    'MI': { lat: 42.7336193, lon: -84.5555605 },
    'MN': { lat: 44.9551063, lon: -93.1021034 },
    'MO': { lat: 38.5791852, lon: -92.1728432 },
    'MS': { lat: 32.3037630, lon: -90.1820382 },
    'MT': { lat: 46.5857742, lon: -112.0183427 },
    'NC': { lat: 35.7803724, lon: -78.6391225 },
    'ND': { lat: 46.8207637, lon: -100.7827194 },
    'NE': { lat: 40.8080641, lon: -96.6997467 },
    'NH': { lat: 43.2069054, lon: -71.5382718 },
    'NJ': { lat: 40.2203572, lon: -74.7699552 },
    'NM': { lat: 35.6823747, lon: -105.9396043 },
    'NV': { lat: 39.1640815, lon: -119.7663053 },
    'NY': { lat: 42.6525086, lon: -73.7575015 },
    'OH': { lat: 39.9614610, lon: -82.9987984 },
    'OK': { lat: 35.4922882, lon: -97.5033801 },
    'OR': { lat: 44.9387430, lon: -123.0301147 },
    'PA': { lat: 40.2644747, lon: -76.8837835 },
    'RI': { lat: 41.8308218, lon: -71.4148550 },
    'SC': { lat: 34.0004393, lon: -81.0331509 },
    'SD': { lat: 44.3671094, lon: -100.3462286 },
    'TN': { lat: 36.1658985, lon: -86.7841708 },
    'TX': { lat: 30.2746658, lon: -97.7403271 },
    'UT': { lat: 40.7773586, lon: -111.8881320 },
    'VA': { lat: 37.5387651, lon: -77.4335963 },
    'VT': { lat: 44.2624522, lon: -72.5804725 },
    'WA': { lat: 47.0357595, lon: -122.9049162 },
    'WI': { lat: 43.0746533, lon: -89.3841797 },
    'WV': { lat: 38.3364019, lon: -81.6120072 },
    'WY': { lat: 41.1403010, lon: -104.8203092 },
};
