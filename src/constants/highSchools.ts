export type RealHighSchool = {
  name: string;
  city: string;
  stateCode: string;
  lat: number;
  lon: number;
  type: 'Public' | 'Private' | 'Prep';
};

export const REAL_HIGH_SCHOOLS: RealHighSchool[] = [
  { name: 'Columbus', city: 'Miami', stateCode: 'FL', lat: 25.7402, lon: -80.3444, type: 'Private' },
  { name: 'Link Academy', city: 'Branson', stateCode: 'MO', lat: 36.6575, lon: -93.2101, type: 'Prep' },
  { name: 'Long Island Lutheran', city: 'Brookville', stateCode: 'NY', lat: 40.8201, lon: -73.5512, type: 'Private' },
  { name: 'Brewster Academy', city: 'Wolfeboro', stateCode: 'NH', lat: 43.5851, lon: -71.2114, type: 'Prep' },
  { name: 'Prolific Prep', city: 'Napa', stateCode: 'CA', lat: 38.3102, lon: -122.2858, type: 'Prep' },
  { name: 'CIA/Bella Vista', city: 'Scottsdale', stateCode: 'AZ', lat: 33.4942, lon: -112.0, type: 'Prep' },
  { name: 'Montverde Academy', city: 'Montverde', stateCode: 'FL', lat: 28.601, lon: -81.6811, type: 'Prep' },
  { name: 'IMG Academy', city: 'Bradenton', stateCode: 'FL', lat: 27.4439, lon: -82.6114, type: 'Prep' },
  { name: 'Wasatch Academy', city: 'Mt. Pleasant', stateCode: 'UT', lat: 39.5471, lon: -111.4551, type: 'Prep' },
  { name: 'Dynamic Prep', city: 'Irving', stateCode: 'TX', lat: 32.8998, lon: -97.0403, type: 'Prep' },
  { name: 'Gonzaga College HS', city: 'Washington', stateCode: 'DC', lat: 38.9015, lon: -77.0121, type: 'Private' },
  { name: 'Roosevelt', city: 'Eastvale', stateCode: 'CA', lat: 33.9535, lon: -117.5702, type: 'Public' },
  { name: 'Paul VI', city: 'Chantilly', stateCode: 'VA', lat: 38.9056, lon: -77.5372, type: 'Private' },
  { name: 'AZ Compass Prep', city: 'Chandler', stateCode: 'AZ', lat: 33.3447, lon: -111.8413, type: 'Prep' },
  { name: 'Wheeler', city: 'Marietta', stateCode: 'GA', lat: 33.9634, lon: -84.4842, type: 'Public' },
  { name: 'Sunrise Christian', city: 'Bel Aire', stateCode: 'KS', lat: 37.7711, lon: -97.275, type: 'Private' },
  { name: 'Hoover', city: 'Hoover', stateCode: 'AL', lat: 33.3411, lon: -86.84, type: 'Public' },
  { name: 'Harvard-Westlake', city: 'Studio City', stateCode: 'CA', lat: 34.1436, lon: -118.4111, type: 'Private' },
  { name: 'Calvary Christian', city: 'Ft. Lauderdale', stateCode: 'FL', lat: 26.2023, lon: -80.1813, type: 'Private' },
  { name: 'Duncanville', city: 'Duncanville', stateCode: 'TX', lat: 32.6558, lon: -96.9322, type: 'Public' },
  { name: 'SA Brennan', city: 'San Antonio', stateCode: 'TX', lat: 29.4641, lon: -98.7247, type: 'Public' },
  { name: 'Highland School', city: 'Warrenton', stateCode: 'VA', lat: 38.729, lon: -77.7963, type: 'Private' },
  { name: 'Allen', city: 'Allen', stateCode: 'TX', lat: 33.1112, lon: -96.6611, type: 'Public' },
  { name: 'Sierra Canyon', city: 'Chatsworth', stateCode: 'CA', lat: 34.2741, lon: -118.5912, type: 'Private' },
  { name: 'Fishers', city: 'Fishers', stateCode: 'IN', lat: 39.9822, lon: -85.9715, type: 'Public' },
];

