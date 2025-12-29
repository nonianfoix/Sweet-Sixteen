import { CITY_LOCATIONS, STATE_WEIGHTS, STATE_CENTERS, CityLocation } from './geoData';

// Map full state names to 2-letter codes
const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC', 'washington d.c.': 'DC', 'washington dc': 'DC', 'd.c.': 'DC',
};

/**
 * Normalizes a state string to a 2-letter state code.
 * Handles full state names ("New York" -> "NY") and already-coded states ("NY" -> "NY").
 */
export const normalizeStateCode = (state: string): string => {
  if (!state) return '';
  const trimmed = state.trim();
  // If already a 2-letter code, just uppercase it
  if (trimmed.length === 2) return trimmed.toUpperCase();
  // Otherwise, look up in the map
  const lowered = trimmed.toLowerCase();
  return STATE_NAME_TO_CODE[lowered] || trimmed.toUpperCase();
};

/**
 * Calculates the Haversine distance between two points on Earth in miles.
 * Earth radius used: 3,958.8 miles.
 */
export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Weighted random selection of a recruit origin (City, State, Coords).
 */
export const getRandomRecruitOrigin = (): { city: string; state: string; lat: number; lon: number } => {
  const states = Object.keys(STATE_WEIGHTS);
  const totalWeight = states.reduce((sum, state) => sum + STATE_WEIGHTS[state], 0);
  
  let random = Math.random() * totalWeight;
  let selectedState = states[0];
  
  for (const state of states) {
    random -= STATE_WEIGHTS[state];
    if (random <= 0) {
      selectedState = state;
      break;
    }
  }

  const stateCities = CITY_LOCATIONS.filter(c => c.state === selectedState);
  
  // Fallback to NY if somehow no cities found (data safety)
  if (stateCities.length === 0) {
    return { city: 'New York City', state: 'NY', lat: 40.7128, lon: -74.006 };
  }

  const city = stateCities[Math.floor(Math.random() * stateCities.length)];
  
  return {
    city: city.city,
    state: city.state,
    lat: city.lat,
    lon: city.lon
  };
};

/**
 * Finds the nearest real city from the lookup table.
 * Used for healing legacy data or matching fictional towns to real coordinates.
 */
export const findNearestRealCity = (lat?: number, lon?: number, city?: string, state?: string): CityLocation => {
  // 1. If we have coordinates, find the city with the minimum distance
  if (typeof lat === 'number' && typeof lon === 'number') {
    let nearest = CITY_LOCATIONS[0];
    let minDist = Infinity;

    for (const loc of CITY_LOCATIONS) {
      const dist = calculateHaversineDistance(lat, lon, loc.lat, loc.lon);
      if (dist < minDist) {
        minDist = dist;
        nearest = loc;
      }
    }
    return nearest;
  }

  // 2. If no coords but we have state, try to find the city
  if (state) {
    // Normalize state to 2-letter code (handles "New York" -> "NY")
    const normalizedState = normalizeStateCode(state);
    
    const stateCities = CITY_LOCATIONS.filter(c => c.state === normalizedState);
    if (stateCities.length > 0) {
      if (city) {
        const normalizedCity = city.toLowerCase().trim();
        const exactMatch = stateCities.find(c => c.city.toLowerCase().trim() === normalizedCity);
        if (exactMatch) return exactMatch;

        // Try fuzzy match or partial?
        const partialMatch = stateCities.find(c => c.city.toLowerCase().includes(normalizedCity) || normalizedCity.includes(c.city.toLowerCase()));
        if (partialMatch) return partialMatch;
      }
      
      // Return the first city in that state as a reasonable proxy
      return stateCities[0];
    }
    
    // If state exists but no cities in our list, use state center proxy (New York if missing)
    const center = STATE_CENTERS[normalizedState] || STATE_CENTERS['NY'] || { lat: 40.7128, lon: -74.006 };
    return { city: `State Center`, state: normalizedState, lat: center.lat, lon: center.lon, tier: 'Fallback' };
  }

  // 3. Absolute fallback
  return { city: 'New York City', state: 'NY', lat: 40.7128, lon: -74.006, tier: 'Tier 1' };
};