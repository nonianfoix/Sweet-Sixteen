export type HometownAnchor = {
  city: string;
  stateCode: string;
  stateName: string;
  lat: number;
  lon: number;
};

const stableHash32 = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const stableFloatBetween = (key: string, min: number, max: number): number => {
  const u = stableHash32(key) / 0xffffffff;
  return min + (max - min) * u;
};

const STATE_NAME_BY_CODE: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'Washington D.C.',
};

const STATE_CAPITAL_COORDS: Record<string, { lat: number; lon: number }> = {
  AK: { lat: 58.3020694, lon: -134.4104388 },
  AL: { lat: 32.3777298, lon: -86.3005639 },
  AR: { lat: 34.746745, lon: -92.2892284 },
  AZ: { lat: 33.4482497, lon: -112.097065 },
  CA: { lat: 38.5765854, lon: -121.4935591 },
  CO: { lat: 39.7392198, lon: -104.9849779 },
  CT: { lat: 41.7642752, lon: -72.6823164 },
  DE: { lat: 39.1572815, lon: -75.5195811 },
  DC: { lat: 38.8951, lon: -77.0364 },
  FL: { lat: 30.4381047, lon: -84.2821265 },
  GA: { lat: 33.7490287, lon: -84.3879614 },
  HI: { lat: 21.3073439, lon: -157.8573111 },
  IA: { lat: 41.5911079, lon: -93.6038358 },
  ID: { lat: 43.6177948, lon: -116.1998483 },
  IL: { lat: 39.7983912, lon: -89.6547203 },
  IN: { lat: 39.7683841, lon: -86.1627697 },
  KS: { lat: 39.0482389, lon: -95.6780057 },
  KY: { lat: 38.1866989, lon: -84.8753598 },
  LA: { lat: 30.457024, lon: -91.1873935 },
  MA: { lat: 42.3587532, lon: -71.0640129 },
  MD: { lat: 38.9788927, lon: -76.491037 },
  ME: { lat: 44.307213, lon: -69.7816228 },
  MI: { lat: 42.7336193, lon: -84.5555605 },
  MN: { lat: 44.9551063, lon: -93.1021034 },
  MO: { lat: 38.5791852, lon: -92.1728432 },
  MS: { lat: 32.303763, lon: -90.1820382 },
  MT: { lat: 46.5857742, lon: -112.0183427 },
  NC: { lat: 35.7803724, lon: -78.6391225 },
  ND: { lat: 46.8207637, lon: -100.7827194 },
  NE: { lat: 40.8080641, lon: -96.6997467 },
  NH: { lat: 43.2069054, lon: -71.5382718 },
  NJ: { lat: 40.2203572, lon: -74.7699552 },
  NM: { lat: 35.6823747, lon: -105.9396043 },
  NV: { lat: 39.1640815, lon: -119.7663053 },
  NY: { lat: 42.6525086, lon: -73.7575015 },
  OH: { lat: 39.961461, lon: -82.9987984 },
  OK: { lat: 35.4922882, lon: -97.5033801 },
  OR: { lat: 44.938743, lon: -123.0301147 },
  PA: { lat: 40.2644747, lon: -76.8837835 },
  RI: { lat: 41.8308218, lon: -71.414855 },
  SC: { lat: 34.0004393, lon: -81.0331509 },
  SD: { lat: 44.3671094, lon: -100.3462286 },
  TN: { lat: 36.1658985, lon: -86.7841708 },
  TX: { lat: 30.2746658, lon: -97.7403271 },
  UT: { lat: 40.7773586, lon: -111.888132 },
  VA: { lat: 37.5387651, lon: -77.4335963 },
  VT: { lat: 44.2624522, lon: -72.5804725 },
  WA: { lat: 47.0357595, lon: -122.9049162 },
  WI: { lat: 43.0746533, lon: -89.3841797 },
  WV: { lat: 38.3364019, lon: -81.6120072 },
  WY: { lat: 41.140301, lon: -104.8203092 },
};

const STATE_PSEUDO_RADIUS_MILES: Record<string, number> = {
  AK: 420,
  CA: 260,
  TX: 280,
  MT: 220,
  NM: 200,
  NV: 200,
  AZ: 190,
  CO: 190,
  OR: 170,
  WA: 170,
  ID: 170,
  WY: 170,
  UT: 170,
  FL: 170,
  GA: 150,
  AL: 130,
  LA: 150,
  MS: 140,
  TN: 150,
  NC: 160,
  SC: 140,
  VA: 150,
  WV: 140,
  KY: 150,
  PA: 150,
  NY: 160,
  MI: 160,
  MN: 160,
  WI: 150,
  IL: 150,
  IN: 140,
  OH: 150,
  IA: 140,
  MO: 150,
  OK: 160,
  AR: 150,
  KS: 160,
  NE: 160,
  SD: 170,
  ND: 170,
  ME: 150,
  VT: 90,
  NH: 90,
  MA: 90,
  RI: 60,
  CT: 70,
  NJ: 80,
  DE: 70,
  MD: 80,
  DC: 10,
  HI: 60,
};

const CITY_NAME_POOL = [
  // Common / small-town
  'Ashland', 'Auburn', 'Aurora', 'Bayside', 'Beaumont', 'Bedford', 'Belmont', 'Benton', 'Berkley', 'Blackwater',
  'Bloomfield', 'Blue Ridge', 'Briarwood', 'Brookhaven', 'Brookside', 'Brookstone', 'Burlington', 'Cambridge', 'Canton', 'Carrollton',
  'Cedar Grove', 'Cedar Hill', 'Centerville', 'Chester', 'Clayton', 'Clearwater', 'Clinton', 'Coldwater', 'Concord', 'Crestwood',
  'Dayton', 'Dover', 'Edgewood', 'Elk Grove', 'Fairview', 'Farmington', 'Forest Hill', 'Franklin', 'Georgetown', 'Glenwood',
  'Grandview', 'Greenville', 'Hamilton', 'Hampton', 'Hillsboro', 'Highland', 'Hudson', 'Jackson', 'Kingston', 'Lakeview',
  'Lancaster', 'Lebanon', 'Lexington', 'Linden', 'Madison', 'Marion', 'Mansfield', 'Maplewood', 'Milton', 'Monroe',
  'Montgomery', 'Newport', 'Norwood', 'Oak Ridge', 'Oxford', 'Pinehurst', 'Plainview', 'Portland', 'Riverside', 'Rocky Mount',
  'Salem', 'Shelby', 'Somerset', 'Springfield', 'Smyrna', 'Stonebridge', 'Trenton', 'Union Grove', 'Wellington', 'Westfield',
  'Wilmington', 'Winchester', 'York', 'Cleveland', 'Bridgeport', 'Carson', 'Fairfax', 'Fremont', 'Garland', 'Irving',
  'Kensington', 'Laurel', 'Monterey', 'Newark', 'Norfolk', 'Pasadena', 'Richmond', 'Rochester', 'Santa Rosa', 'Savannah',
  'Shoreline', 'Sterling', 'Torrance', 'Valley View', 'Walnut Grove', 'Woodland',
  // Larger / recognizable
  'Birmingham', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Montgomery', 'Anchorage', 'Juneau', 'Phoenix', 'Tucson', 'Mesa',
  'Little Rock', 'Fayetteville', 'Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Sacramento', 'Fresno', 'Denver', 'Boulder',
  'Hartford', 'New Haven', 'Wilmington', 'Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee', 'Atlanta', 'Savannah',
  'Honolulu', 'Boise', 'Chicago', 'Springfield', 'Indianapolis', 'Des Moines', 'Wichita', 'Louisville', 'Lexington', 'New Orleans',
  'Baton Rouge', 'Portland', 'Bangor', 'Baltimore', 'Boston', 'Detroit', 'Grand Rapids', 'Minneapolis', 'St. Paul',
  'St. Louis', 'Kansas City', 'Jackson', 'Billings', 'Raleigh', 'Charlotte', 'Fargo', 'Omaha', 'Las Vegas', 'Reno',
  'Manchester', 'Newark', 'Albuquerque', 'Santa Fe', 'New York', 'Buffalo', 'Albany', 'Cleveland', 'Columbus', 'Cincinnati',
  'Oklahoma City', 'Tulsa', 'Eugene', 'Philadelphia', 'Pittsburgh', 'Providence', 'Charleston', 'Columbia', 'Sioux Falls',
  'Nashville', 'Memphis', 'Austin', 'Dallas', 'Houston', 'San Antonio', 'Salt Lake City', 'Richmond', 'Norfolk',
  'Seattle', 'Spokane', 'Milwaukee', 'Madison', 'Charleston', 'Cheyenne',
];

const uniqueCityNameForState = (stateCode: string, index: number): string => {
  const base = CITY_NAME_POOL[stableHash32(`${stateCode}:city:${index}`) % CITY_NAME_POOL.length] || 'Fairview';
  // Reduce same-state collisions by prefixing a short directional sometimes.
  const roll = stableHash32(`${stateCode}:dir:${index}`) % 9;
  if (roll === 0) return `North ${base}`;
  if (roll === 1) return `South ${base}`;
  if (roll === 2) return `East ${base}`;
  if (roll === 3) return `West ${base}`;
  return base;
};

const generateAnchorForState = (stateCode: string, index: number): HometownAnchor | null => {
  const capital = STATE_CAPITAL_COORDS[stateCode];
  const stateName = STATE_NAME_BY_CODE[stateCode];
  if (!capital || !stateName) return null;

  const maxRadiusMiles = STATE_PSEUDO_RADIUS_MILES[stateCode] ?? 155;
  const theta = stableFloatBetween(`${stateCode}:theta:${index}`, 0, Math.PI * 2);
  const r = Math.sqrt(stableFloatBetween(`${stateCode}:r:${index}`, 0, 1)) * maxRadiusMiles;

  const milesPerDegreeLat = 69;
  const latRad = (capital.lat * Math.PI) / 180;
  const milesPerDegreeLon = milesPerDegreeLat * Math.max(0.2, Math.cos(latRad));

  const dLat = (r * Math.cos(theta)) / milesPerDegreeLat;
  const dLon = (r * Math.sin(theta)) / milesPerDegreeLon;
  const city = uniqueCityNameForState(stateCode, index);

  return { city, stateCode, stateName, lat: capital.lat + dLat, lon: capital.lon + dLon };
};

const ALL_STATE_CODES = Object.keys(STATE_NAME_BY_CODE);

export const HOMETOWN_ANCHORS: HometownAnchor[] = (() => {
  const anchors: HometownAnchor[] = [];
  for (const stateCode of ALL_STATE_CODES) {
    const count = stateCode === 'DC' ? 6 : 22;
    for (let i = 0; i < count; i++) {
      const a = generateAnchorForState(stateCode, i);
      if (a) anchors.push(a);
    }
  }
  return anchors;
})();

export const HOMETOWN_ANCHORS_BY_STATE_CODE: Record<string, HometownAnchor[]> = (() => {
  const map: Record<string, HometownAnchor[]> = {};
  for (const a of HOMETOWN_ANCHORS) {
    const bucket = map[a.stateCode] || [];
    bucket.push(a);
    map[a.stateCode] = bucket;
  }
  return map;
})();

export const getHometownAnchorsForState = (stateCode: string): HometownAnchor[] => {
  return HOMETOWN_ANCHORS_BY_STATE_CODE[stateCode] || [];
};

export const pickHometownAnchor = (stateCode: string, seedKey: string): HometownAnchor | null => {
  const anchors = getHometownAnchorsForState(stateCode);
  if (!anchors.length) return null;
  const idx = stableHash32(seedKey) % anchors.length;
  return anchors[idx] || null;
};

