export interface CityLocation {
  city: string;
  state: string;
  lat: number;
  lon: number;
  tier: string;
}

// Weights based on "Players" count from "Basketball Player Origins_Share - Top 10 States.csv"
// If not in Top 10, default to a lower baseline.
export const STATE_WEIGHTS: Record<string, number> = {
  "CA": 427,
  "NY": 419,
  "IL": 293,
  "PA": 240,
  "OH": 200,
  "MI": 162,
  "IN": 158,
  "NJ": 146,
  "TX": 140, // Estimated top-tier
  "GA": 130, // Estimated top-tier
  "FL": 280, // Powerhouse state (Montverde, IMG, etc)
  "NC": 110, // Estimated top-tier
  "MD": 100, // Estimated top-tier
  "DC": 90,  // High per-capita
  "LA": 85,  // High per-capita
  "MS": 80,  // High per-capita
  "KY": 75,  // High per-capita
  "AL": 70,  // High per-capita
  "AR": 65,  // High per-capita
  "TN": 60,
  "VA": 55,
  "WA": 50,
  "MO": 45,
  "WI": 40,
  "MN": 35,
  "AZ": 30,
  "CT": 30,
  "OK": 25,
  "NV": 25,
  "UT": 25,
  "CO": 25,
  "OR": 25,
  "SC": 25,
  "IA": 20,
  "KS": 20,
  "NE": 20,
  "WV": 15,
  "NM": 15,
  "ID": 10,
  "HI": 10,
  "AK": 10,
  "ME": 10,
  "NH": 10,
  "VT": 10,
  "RI": 10,
  "DE": 10,
  "MT": 5,
  "WY": 5,
  "ND": 5,
  "SD": 5,
};

export const CITY_LOCATIONS: CityLocation[] = [
  { state: "CA", tier: "Tier 1", city: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  { state: "CA", tier: "Tier 1", city: "Oakland", lat: 37.8044, lon: -122.2711 },
  { state: "CA", tier: "Tier 1", city: "San Diego", lat: 32.7157, lon: -117.1611 },
  { state: "CA", tier: "Tier 1", city: "Sacramento", lat: 38.5816, lon: -121.4944 },
  { state: "CA", tier: "Tier 1", city: "Compton", lat: 33.8958, lon: -118.2201 },
  { state: "NY", tier: "Tier 1", city: "New York City", lat: 40.7128, lon: -74.006 },
  { state: "NY", tier: "Tier 1", city: "Brooklyn", lat: 40.6782, lon: -73.9442 },
  { state: "NY", tier: "Tier 1", city: "Buffalo", lat: 42.8864, lon: -78.8784 },
  { state: "NY", tier: "Tier 1", city: "Rochester", lat: 43.1566, lon: -77.6088 },
  { state: "NY", tier: "Tier 1", city: "Mount Vernon", lat: 40.9126, lon: -73.8371 },
  { state: "DC", tier: "Tier 1", city: "Washington", lat: 38.9072, lon: -77.0369 },
  { state: "MD", tier: "Tier 1", city: "Baltimore", lat: 39.2904, lon: -76.6122 },
  { state: "MD", tier: "Tier 1", city: "Hyattsville", lat: 38.9559, lon: -76.9519 },
  { state: "IL", tier: "Tier 1", city: "Chicago", lat: 41.8781, lon: -87.6298 },
  { state: "IL", tier: "Tier 1", city: "Peoria", lat: 40.6936, lon: -89.589 },
  { state: "OH", tier: "Tier 1", city: "Cleveland", lat: 41.4993, lon: -81.6944 },
  { state: "OH", tier: "Tier 1", city: "Cincinnati", lat: 39.1031, lon: -84.512 },
  { state: "OH", tier: "Tier 1", city: "Akron", lat: 41.0814, lon: -81.519 },
  { state: "TX", tier: "Tier 1", city: "Houston", lat: 29.7604, lon: -95.3698 },
  { state: "TX", tier: "Tier 1", city: "Dallas", lat: 32.7767, lon: -96.797 },
  { state: "IN", tier: "Tier 1", city: "Indianapolis", lat: 39.7684, lon: -86.1581 },
  { state: "IN", tier: "Tier 1", city: "Gary", lat: 41.5934, lon: -87.3464 },
  { state: "NJ", tier: "Tier 1", city: "Newark", lat: 40.7357, lon: -74.1724 },
  { state: "NJ", tier: "Tier 1", city: "Camden", lat: 39.9259, lon: -75.1196 },
  { state: "GA", tier: "Tier 1", city: "Atlanta", lat: 33.749, lon: -84.388 },
  { state: "FL", tier: "Tier 1", city: "Miami", lat: 25.7617, lon: -80.1918 },
  { state: "FL", tier: "Tier 1", city: "Orlando", lat: 28.5383, lon: -81.3792 },
  { state: "NC", tier: "Tier 1", city: "Charlotte", lat: 35.2271, lon: -80.8431 },
  { state: "NC", tier: "Tier 1", city: "Durham", lat: 35.994, lon: -78.8986 },
  { state: "PA", tier: "Tier 1", city: "Philadelphia", lat: 39.9526, lon: -75.1652 },
  { state: "PA", tier: "Tier 1", city: "Pittsburgh", lat: 40.4406, lon: -79.9959 },
  { state: "MI", tier: "Tier 1", city: "Detroit", lat: 42.3314, lon: -83.0458 },
  { state: "MI", tier: "Tier 1", city: "Flint", lat: 43.0125, lon: -83.6875 },
  { state: "VA", tier: "Tier 2", city: "Norfolk", lat: 36.8508, lon: -76.2859 },
  { state: "VA", tier: "Tier 2", city: "Richmond", lat: 37.5407, lon: -77.436 },
  { state: "WA", tier: "Tier 2", city: "Seattle", lat: 47.6062, lon: -122.3321 },
  { state: "AZ", tier: "Tier 2", city: "Phoenix", lat: 33.4484, lon: -112.074 },
  { state: "CT", tier: "Tier 2", city: "New Haven", lat: 41.3083, lon: -72.9279 },
  { state: "CT", tier: "Tier 2", city: "Hartford", lat: 41.7637, lon: -72.6851 },
  { state: "KY", tier: "Tier 2", city: "Louisville", lat: 38.2527, lon: -85.7585 },
  { state: "MO", tier: "Tier 2", city: "St. Louis", lat: 38.627, lon: -90.1994 },
  { state: "TN", tier: "Tier 2", city: "Memphis", lat: 35.1495, lon: -90.049 },
  { state: "LA", tier: "Tier 2", city: "New Orleans", lat: 29.9511, lon: -90.0715 },
  { state: "OR", tier: "Tier 2", city: "Portland", lat: 45.5152, lon: -122.6784 },
  { state: "WI", tier: "Tier 2", city: "Milwaukee", lat: 43.0389, lon: -87.9065 },
  { state: "MN", tier: "Tier 2", city: "Minneapolis", lat: 44.9778, lon: -93.265 },
  { state: "AL", tier: "Tier 2", city: "Birmingham", lat: 33.5186, lon: -86.8104 },
  { state: "OK", tier: "Tier 2", city: "Oklahoma City", lat: 35.4676, lon: -97.5164 },
  { state: "NV", tier: "Tier 2", city: "Las Vegas", lat: 36.1716, lon: -115.1391 },
  { state: "UT", tier: "Tier 2", city: "Salt Lake City", lat: 40.7608, lon: -111.891 },
  { state: "CO", tier: "Tier 2", city: "Denver", lat: 39.7392, lon: -104.9903 },
  { state: "HI", tier: "Tier 3", city: "Honolulu", lat: 21.3069, lon: -157.8583 },
  { state: "HI", tier: "Tier 3", city: "Hilo", lat: 19.7241, lon: -155.0868 },
  { state: "HI", tier: "Tier 3", city: "Kailua", lat: 21.4022, lon: -157.7394 },
  { state: "AK", tier: "Tier 3", city: "Anchorage", lat: 61.2181, lon: -149.9003 },
  { state: "MT", tier: "Tier 3", city: "Billings", lat: 45.7833, lon: -108.5007 },
  { state: "WY", tier: "Tier 3", city: "Cheyenne", lat: 41.14, lon: -104.8202 },
  { state: "ME", tier: "Tier 3", city: "Portland", lat: 43.6591, lon: -70.2568 },
  { state: "VT", tier: "Tier 3", city: "Burlington", lat: 44.4759, lon: -73.2121 },
  { state: "ND", tier: "Tier 3", city: "Fargo", lat: 46.8772, lon: -96.7898 },
  { state: "SD", tier: "Tier 3", city: "Sioux Falls", lat: 43.546, lon: -96.7313 },
  { state: "WV", tier: "Tier 3", city: "Charleston", lat: 38.3498, lon: -81.6326 },
  { state: "NH", tier: "Tier 3", city: "Manchester", lat: 42.9956, lon: -71.4548 },
  { state: "DE", tier: "Tier 3", city: "Wilmington", lat: 39.7447, lon: -75.5484 },
  { state: "RI", tier: "Tier 3", city: "Providence", lat: 41.824, lon: -71.4128 },
  { state: "ID", tier: "Tier 3", city: "Boise", lat: 43.615, lon: -116.2023 },
  { state: "NE", tier: "Tier 3", city: "Omaha", lat: 41.2565, lon: -95.9345 },
  { state: "IA", tier: "Tier 3", city: "Des Moines", lat: 41.5868, lon: -93.625 },
  { state: "KS", tier: "Tier 3", city: "Wichita", lat: 37.6889, lon: -97.3361 },
  { state: "NM", tier: "Tier 3", city: "Albuquerque", lat: 35.0844, lon: -106.6504 },
  // Missing Upstate NY Cities
  { state: "NY", tier: "Tier 2", city: "Buffalo", lat: 42.8864, lon: -78.8784 },
  { state: "NY", tier: "Tier 2", city: "Rochester", lat: 43.1566, lon: -77.6088 },
  { state: "NY", tier: "Tier 3", city: "Syracuse", lat: 43.0481, lon: -76.1474 },
  { state: "NY", tier: "Tier 3", city: "Albany", lat: 42.6526, lon: -73.7562 }
];

// Calculated State Centers (Average lat/lon of cities listed above)
export const STATE_CENTERS: Record<string, { lat: number; lon: number }> = CITY_LOCATIONS.reduce((acc, curr) => {
  if (!acc[curr.state]) {
    acc[curr.state] = { lat: 0, lon: 0, count: 0 };
  }
  acc[curr.state].lat += curr.lat;
  acc[curr.state].lon += curr.lon;
  acc[curr.state].count += 1;
  return acc;
}, {} as Record<string, { lat: number; lon: number; count: number }>) as any;

Object.keys(STATE_CENTERS).forEach(state => {
  const data = (STATE_CENTERS as any)[state];
  STATE_CENTERS[state] = {
    lat: data.lat / data.count,
    lon: data.lon / data.count
  };
});