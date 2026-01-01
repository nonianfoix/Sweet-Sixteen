import { TeamColors, CoachSkill, SponsorName } from './types';

export const BASE_CALENDAR_YEAR = 2024;
export const NBA_SALARY_CAP_2025 = 140588000;
export const NBA_LUXURY_TAX_THRESHOLD_2025 = 170814000;
export const NBA_MINIMUM_SALARY = 1100000;

export const CONFERENCE_NIL_CAPS: Record<string, number> = {
    'Power': 12000000,
    'Mid': 4000000,
    'Low': 1500000
};


export const SCHOOLS: string[] = [
    'Alabama', 'Arizona', 'Arizona State', 'Arkansas', 'Auburn', 'Baylor', 'Boston College', 'California', 'Clemson', 'Colorado', 'Duke', 'Florida', 'Florida State', 'Georgia', 'Georgia Tech', 'Illinois', 'Indiana', 'Iowa', 'Iowa State', 'Kansas', 'Kansas State', 'Kentucky', 'Louisville', 'LSU', 'Maryland', 'Miami', 'Michigan', 'Michigan State', 'Minnesota', 'Mississippi State', 'Missouri', 'NC State', 'Nebraska', 'North Carolina', 'Northwestern', 'Notre Dame', 'Ohio State', 'Oklahoma', 'Oklahoma State', 'Ole Miss', 'Oregon', 'Oregon State', 'Penn State', 'Pittsburgh', 'Purdue', 'Rutgers', 'SMU', 'South Carolina', 'Stanford', 'Syracuse', 'TCU', 'Tennessee', 'Texas', 'Texas A&M', 'Texas Tech', 'UCLA', 'UConn', 'USC', 'Utah', 'Vanderbilt', 'Virginia', 'Virginia Tech', 'Wake Forest', 'Washington', 'Washington State', 'West Virginia', 'Wisconsin',
    'Boise State', 'BYU', 'Cincinnati', 'Colorado State', 'Creighton', 'Dayton', 'Fresno State', 'Georgetown', 'Gonzaga', 'Houston', 'Marquette', 'Memphis', 'Nevada', 'New Mexico', 'Providence', 'Saint Mary\'s', 'San Diego State', 'Seton Hall', 'St. John\'s', 'Temple', 'UCF', 'UNLV', 'Utah State', 'VCU', 'Villanova', 'Wichita State', 'Xavier',
    'Alabama A&M', 'Alabama State', 'Alcorn State', 'Arkansas-Pine Bluff', 'Bethune-Cookman', 'Coppin State', 'Delaware State', 'Florida A&M', 'Grambling State', 'Hampton', 'Howard', 'Jackson State', 'Maryland Eastern Shore', 'Mississippi Valley State', 'Morgan State', 'Norfolk State', 'North Carolina A&T', 'North Carolina Central', 'Prairie View A&M', 'South Carolina State', 'Southern', 'Tennessee State', 'Texas Southern',
    'Albany', 'Appalachian State', 'Arkansas State', 'Ball State', 'Belmont', 'Boston University', 'Bowling Green', 'Bradley', 'Brown', 'Bucknell', 'Buffalo', 'Butler', 'Cal State Fullerton', 'Cal State Northridge', 'Campbell', 'Central Michigan', 'Charleston WV', 'Charlotte', 'Chattanooga', 'Cleveland State', 'Coastal Carolina', 'Colgate', 'Columbia', 'Cornell', 'Dartmouth', 'Davidson', 'Delaware', 'Denver', 'DePaul', 'Detroit Mercy', 'Drake', 'Drexel', 'East Carolina', 'Eastern Kentucky', 'Eastern Michigan', 'Elon', 'Evansville', 'Fairfield', 'Florida Atlantic', 'Fordham', 'Furman', 'George Mason', 'George Washington', 'Georgia Southern', 'Georgia State', 'Grand Canyon', 'Green Bay', 'Harvard', 'Hawaii', 'Hofstra', 'Holy Cross', 'Idaho', 'Idaho State', 'Illinois State', 'Indiana State', 'Iona', 'Jacksonville', 'James Madison', 'Kent State', 'La Salle', 'Lafayette', 'Lehigh', 'Liberty', 'Long Beach State', 'Loyola Chicago', 'Maine', 'Manhattan', 'Marist', 'Marshall', 'UMBC', 'Massachusetts', 'McNeese State', 'Mercer', 'Miami (OH)', 'Middle Tennessee', 'Milwaukee', 'Monmouth', 'Montana', 'Montana State', 'Morehead State', 'Murray State', 'Navy', 'New Hampshire', 'New Mexico State', 'Niagara', 'Nicholls State', 'North Dakota', 'North Dakota State', 'North Florida', 'North Texas', 'Northeastern', 'Northern Arizona', 'Northern Colorado', 'Northern Illinois', 'Northern Iowa', 'Northwestern State', 'Oakland', 'Ohio', 'Old Dominion', 'Omaha', 'Oral Roberts', 'Pacific', 'Penn', 'Pepperdine', 'Portland', 'Portland State', 'Princeton', 'Quinnipiac', 'Radford', 'Rhode Island', 'Rice', 'Richmond', 'Rider', 'Robert Morris', 'Sacramento State', 'Sacred Heart', 'Saint Joseph\'s', 'Saint Louis', 'Saint Peter\'s', 'Sam Houston State', 'Samford', 'San Diego', 'San Francisco', 'San Jose State', 'Santa Clara', 'Seattle', 'Siena', 'South Alabama', 'South Dakota', 'South Dakota State', 'South Florida', 'Southeast Missouri State', 'Southern Illinois', 'Southern Miss', 'Southern Utah', 'St. Bonaventure', 'Stephen F. Austin', 'Stetson', 'Stony Brook', 'Toledo', 'Towson', 'Troy', 'Tulane', 'Tulsa', 'UAB', 'UC Davis', 'UC Irvine', 'UC Riverside', 'UC Santa Barbara', 'UIC', 'UMass Lowell', 'UNC Asheville', 'UNC Greensboro', 'UNC Wilmington', 'USC Upstate', 'UT Arlington', 'UT Martin'
];

export const ALL_TIME_NBA_ALUMNI_COUNTS: Record<string, number> = {
    'Kentucky': 137, 'UCLA': 106, 'North Carolina': 103, 'Duke': 102, 'Kansas': 87,
    'Indiana': 71, 'Arizona': 68, 'Michigan': 67, 'Louisville': 64, 'Notre Dame': 63,
    'Villanova': 56, 'St. John\'s': 49, 'UConn': 49, 'Gonzaga': 56, 'Ohio State': 43,
    'Michigan State': 46, 'Memphis': 40, 'Syracuse': 39, 'Georgetown': 37, 'Arkansas': 36,
    'Illinois': 36, 'Texas': 35, 'Wake Forest': 35, 'Maryland': 34, 'Florida State': 34,
    'USC': 33, 'Georgia Tech': 33, 'Virginia': 32, 'LSU': 32, 'Purdue': 31,
    'Oklahoma': 30, 'Texas A&M': 29, 'Minnesota': 29, 'Washington': 28, 'Cincinnati': 28,
    'Marquette': 28, 'Oklahoma State': 27, 'Seton Hall': 27, 'UNLV': 26, 'Oregon': 26,
    'Wisconsin': 25, 'NC State': 25, 'Florida': 25, 'California': 25, 'Temple': 24,
    'Alabama': 24, 'Arizona State': 23, 'Massachusetts': 23, 'Rutgers': 22, 'Utah': 22,
    'Penn State': 21, 'Iowa State': 18, 'Iowa': 17, 'Houston': 16, 'Butler': 14,
    'San Diego State': 14, 'Baylor': 13, 'West Virginia': 12, 'Mississippi State': 12,
    'Ole Miss': 12, 'South Carolina': 11, 'Creighton': 11, 'Georgia': 11, 'Dayton': 11,
    'Nebraska': 10, 'Oregon State': 10, 'Providence': 10, 'Stanford': 9, 'Washington State': 9,
    'Xavier': 8, 'Texas Tech': 8, 'BYU': 8, 'Rhode Island': 8, 'UAB': 8,
    'Kansas State': 8, 'Florida Atlantic': 7, 'Clemson': 7, 'Saint Louis': 7, 'Auburn': 7,
    'Nevada': 7, 'Vanderbilt': 7, 'San Francisco': 7, 'Boise State': 7
};

export const SCHOOL_COLORS: { [key: string]: TeamColors } = {
  // Power 5
  'Alabama': { primary: '#9E1B32', secondary: '#828A8F', text: '#FFFFFF' },
  'Arizona': { primary: '#0C234B', secondary: '#AB0520', text: '#FFFFFF' },
  'Arizona State': { primary: '#8C1D40', secondary: '#FFC627', text: '#FFFFFF' },
  'Arkansas': { primary: '#9D2235', secondary: '#FFFFFF', text: '#000000' },
  'Auburn': { primary: '#0C2340', secondary: '#E87722', text: '#FFFFFF' },
  'Baylor': { primary: '#003015', secondary: '#FFB81C', text: '#FFFFFF' },
  'Boston College': { primary: '#8a100b', secondary: '#c5b68b', text: '#FFFFFF' },
  'California': { primary: '#003262', secondary: '#FDB515', text: '#FFFFFF' },
  'Clemson': { primary: '#F56600', secondary: '#522D80', text: '#FFFFFF' },
  'Colorado': { primary: '#CFB87C', secondary: '#000000', text: '#FFFFFF' },
  'Duke': { primary: '#003087', secondary: '#FFFFFF', text: '#000000' },
  'Florida': { primary: '#0021A5', secondary: '#FA4616', text: '#FFFFFF' },
  'Florida State': { primary: '#782F40', secondary: '#CEB888', text: '#FFFFFF' },
  'Georgia': { primary: '#BA0C2F', secondary: '#000000', text: '#FFFFFF' },
  'Georgia Tech': { primary: '#00223E', secondary: '#B3A369', text: '#FFFFFF' },
  'Illinois': { primary: '#13294B', secondary: '#E84A27', text: '#FFFFFF' },
  'Indiana': { primary: '#990000', secondary: '#EEEDEB', text: '#FFFFFF' },
  'Iowa': { primary: '#000000', secondary: '#FFCD00', text: '#FFFFFF' },
  'Iowa State': { primary: '#C8102E', secondary: '#F1BE48', text: '#FFFFFF' },
  'Kansas': { primary: '#0051BA', secondary: '#E8000D', text: '#FFFFFF' },
  'Kansas State': { primary: '#512888', secondary: '#FFFFFF', text: '#000000' },
  'Kentucky': { primary: '#0033A0', secondary: '#FFFFFF', text: '#000000' },
  'Louisville': { primary: '#AD0000', secondary: '#000000', text: '#FFFFFF' },
  'LSU': { primary: '#461D7C', secondary: '#FDD023', text: '#FFFFFF' },
  'Maryland': { primary: '#E03A3E', secondary: '#FFD520', text: '#000000' },
  'Miami': { primary: '#005030', secondary: '#F47321', text: '#FFFFFF' },
  'Michigan': { primary: '#00274C', secondary: '#FFCB05', text: '#FFFFFF' },
  'Michigan State': { primary: '#18453B', secondary: '#FFFFFF', text: '#000000' },
  'Minnesota': { primary: '#7A0019', secondary: '#FFCC33', text: '#FFFFFF' },
  'Mississippi State': { primary: '#660000', secondary: '#FFFFFF', text: '#000000' },
  'Missouri': { primary: '#000000', secondary: '#F1B82D', text: '#FFFFFF' },
  'NC State': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Nebraska': { primary: '#E41C38', secondary: '#FFFFFF', text: '#000000' },
  'North Carolina': { primary: '#7BAFD4', secondary: '#FFFFFF', text: '#000000' },
  'Northwestern': { primary: '#4E2A84', secondary: '#FFFFFF', text: '#000000' },
  'Notre Dame': { primary: '#0C2340', secondary: '#AE9142', text: '#FFFFFF' },
  'Ohio State': { primary: '#BB0000', secondary: '#666666', text: '#FFFFFF' },
  'Oklahoma': { primary: '#841617', secondary: '#FFFFFF', text: '#000000' },
  'Oklahoma State': { primary: '#FF7300', secondary: '#000000', text: '#FFFFFF' },
  'Ole Miss': { primary: '#00205B', secondary: '#CE1126', text: '#FFFFFF' },
  'Oregon': { primary: '#154733', secondary: '#FEE123', text: '#FFFFFF' },
  'Oregon State': { primary: '#DC4405', secondary: '#000000', text: '#FFFFFF' },
  'Penn State': { primary: '#041E42', secondary: '#FFFFFF', text: '#000000' },
  'Pittsburgh': { primary: '#003594', secondary: '#FFB81C', text: '#FFFFFF' },
  'Purdue': { primary: '#CEB888', secondary: '#000000', text: '#FFFFFF' },
  'Rutgers': { primary: '#CC0033', secondary: '#FFFFFF', text: '#000000' },
  'SMU': { primary: '#C8102E', secondary: '#0033A0', text: '#FFFFFF' },
  'South Carolina': { primary: '#73000A', secondary: '#000000', text: '#FFFFFF' },
  'Stanford': { primary: '#8C1515', secondary: '#FFFFFF', text: '#000000' },
  'Syracuse': { primary: '#D44500', secondary: '#002D56', text: '#FFFFFF' },
  'TCU': { primary: '#4D1979', secondary: '#FFFFFF', text: '#000000' },
  'Tennessee': { primary: '#FF8200', secondary: '#FFFFFF', text: '#000000' },
  'Texas': { primary: '#BF5700', secondary: '#FFFFFF', text: '#000000' },
  'Texas A&M': { primary: '#500000', secondary: '#FFFFFF', text: '#000000' },
  'Texas Tech': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'UCLA': { primary: '#2D68C4', secondary: '#F2A900', text: '#FFFFFF' },
  'UConn': { primary: '#000E2F', secondary: '#FFFFFF', text: '#E4002B' },
  'USC': { primary: '#990000', secondary: '#FFCC00', text: '#FFFFFF' },
  'Utah': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Vanderbilt': { primary: '#000000', secondary: '#A8996E', text: '#FFFFFF' },
  'Virginia': { primary: '#002855', secondary: '#F84C1E', text: '#FFFFFF' },
  'Virginia Tech': { primary: '#630021', secondary: '#CF4420', text: '#FFFFFF' },
  'Wake Forest': { primary: '#000000', secondary: '#9E7E38', text: '#FFFFFF' },
  'Washington': { primary: '#4B2E83', secondary: '#B7A57A', text: '#FFFFFF' },
  'Washington State': { primary: '#981e32', secondary: '#5e6a71', text: '#FFFFFF' },
  'West Virginia': { primary: '#002855', secondary: '#EAAA00', text: '#FFFFFF' },
  'Wisconsin': { primary: '#C5050C', secondary: '#FFFFFF', text: '#000000' },
  
  // Mid-Majors / Other notables
  'Boise State': { primary: '#0033A0', secondary: '#D64309', text: '#FFFFFF' },
  'BYU': { primary: '#002E5D', secondary: '#FFFFFF', text: '#000000' },
  'Cincinnati': { primary: '#E00122', secondary: '#000000', text: '#FFFFFF' },
  'Colorado State': { primary: '#1E4D2B', secondary: '#C8C372', text: '#FFFFFF' },
  'Creighton': { primary: '#005995', secondary: '#FFFFFF', text: '#000000' },
  'Dayton': { primary: '#CE1126', secondary: '#00205B', text: '#FFFFFF' },
  'Fresno State': { primary: '#DB002A', secondary: '#002E6C', text: '#FFFFFF' },
  'Georgetown': { primary: '#041E42', secondary: '#8D817B', text: '#FFFFFF' },
  'Gonzaga': { primary: '#041E42', secondary: '#C8102E', text: '#FFFFFF' },
  'Houston': { primary: '#C8102E', secondary: '#FFFFFF', text: '#000000' },
  'Marquette': { primary: '#003366', secondary: '#FFCC00', text: '#FFFFFF' },
  'Memphis': { primary: '#00245D', secondary: '#7F7F7F', text: '#FFFFFF' },
  'Nevada': { primary: '#003366', secondary: '#8D817B', text: '#FFFFFF' },
  'New Mexico': { primary: '#BA0C2F', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Providence': { primary: '#000000', secondary: '#FFFFFF', text: '#C8C6C6' },
  'Saint Mary\'s': { primary: '#002F5B', secondary: '#D41E44', text: '#FFFFFF' },
  'San Diego State': { primary: '#C8102E', secondary: '#000000', text: '#FFFFFF' },
  'Seton Hall': { primary: '#004488', secondary: '#FFFFFF', text: '#000000' },
  'St. John\'s': { primary: '#BA0C2F', secondary: '#041C2C', text: '#FFFFFF' },
  'Temple': { primary: '#9d2235', secondary: '#ffffff', text: '#000000' },
  'UCF': { primary: '#000000', secondary: '#BA9B37', text: '#FFFFFF' },
  'UNLV': { primary: '#C8102E', secondary: '#8D817B', text: '#FFFFFF' },
  'Utah State': { primary: '#002654', secondary: '#FFFFFF', text: '#000000' },
  'VCU': { primary: '#000000', secondary: '#FFB300', text: '#FFFFFF' },
  'Villanova': { primary: '#00205B', secondary: '#FFFFFF', text: '#6E7277' },
  'Wichita State': { primary: '#000000', secondary: '#FFCC00', text: '#FFFFFF' },
  'Xavier': { primary: '#003057', secondary: '#FFFFFF', text: '#9EA2A2' },

  // HBCUs
  'Alabama A&M': { primary: '#630021', secondary: '#FFFFFF', text: '#000000' },
  'Alabama State': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Alcorn State': { primary: '#4B0082', secondary: '#FFD700', text: '#FFFFFF' },
  'Arkansas-Pine Bluff': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Bethune-Cookman': { primary: '#630021', secondary: '#FFD700', text: '#FFFFFF' },
  'Coppin State': { primary: '#003366', secondary: '#FFD700', text: '#FFFFFF' },
  'Delaware State': { primary: '#CC0000', secondary: '#003366', text: '#FFFFFF' },
  'Florida A&M': { primary: '#006400', secondary: '#FF7300', text: '#FFFFFF' },
  'Grambling State': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Hampton': { primary: '#005BBB', secondary: '#FFFFFF', text: '#000000' },
  'Howard': { primary: '#003366', secondary: '#CC0000', text: '#FFFFFF' },
  'Jackson State': { primary: '#00205B', secondary: '#FFFFFF', text: '#CC0000' },
  'Maryland Eastern Shore': { primary: '#8C1D40', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Mississippi Valley State': { primary: '#006400', secondary: '#CC0000', text: '#FFFFFF' },
  'Morgan State': { primary: '#00205B', secondary: '#FF7300', text: '#FFFFFF' },
  'Norfolk State': { primary: '#00843D', secondary: '#FFB300', text: '#FFFFFF' },
  'North Carolina A&T': { primary: '#004C97', secondary: '#FFC72C', text: '#FFFFFF' },
  'North Carolina Central': { primary: '#8C1D40', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Prairie View A&M': { primary: '#4B0058', secondary: '#FDB913', text: '#FFFFFF' },
  'South Carolina State': { primary: '#8C1D40', secondary: '#00205B', text: '#FFFFFF' },
  'Southern': { primary: '#005BBB', secondary: '#FFD700', text: '#FFFFFF' },
  'Tennessee State': { primary: '#005BBB', secondary: '#FFFFFF', text: '#CC0000' },
  'Texas Southern': { primary: '#691B33', secondary: '#9B9B9B', text: '#FFFFFF' },

  // Remaining schools with default/plausible colors
  'Albany': { primary: '#4B0082', secondary: '#FFD700', text: '#FFFFFF' },
  'Appalachian State': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Arkansas State': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Ball State': { primary: '#CC0000', secondary: '#FFFFFF', text: '#000000' },
  'Belmont': { primary: '#00205B', secondary: '#CC0000', text: '#FFFFFF' },
  'Boston University': { primary: '#CC0000', secondary: '#FFFFFF', text: '#000000' },
  'Bowling Green': { primary: '#FF7300', secondary: '#4F2C1D', text: '#FFFFFF' },
  'Bradley': { primary: '#CC0000', secondary: '#FFFFFF', text: '#000000' },
  'Brown': { primary: '#4F2C1D', secondary: '#CC0000', text: '#FFFFFF' },
  'Bucknell': { primary: '#005BBB', secondary: '#FF7300', text: '#FFFFFF' },
  'Buffalo': { primary: '#005BBB', secondary: '#FFFFFF', text: '#000000' },
  'Butler': { primary: '#00205B', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Cal State Fullerton': { primary: '#00205B', secondary: '#FF7300', text: '#FFFFFF' },
  'Cal State Northridge': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Campbell': { primary: '#FF7300', secondary: '#000000', text: '#FFFFFF' },
  'Central Michigan': { primary: '#630021', secondary: '#FFD700', text: '#FFFFFF' },
  'Charleston WV': { primary: '#630021', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Charlotte': { primary: '#005030', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Chattanooga': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Cleveland State': { primary: '#006400', secondary: '#FFFFFF', text: '#000000' },
  'Coastal Carolina': { primary: '#006400', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Colgate': { primary: '#630021', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Columbia': { primary: '#005BBB', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Cornell': { primary: '#B31B1B', secondary: '#FFFFFF', text: '#000000' },
  'Dartmouth': { primary: '#006400', secondary: '#FFFFFF', text: '#000000' },
  'Davidson': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Delaware': { primary: '#005BBB', secondary: '#FFD700', text: '#FFFFFF' },
  'Denver': { primary: '#8C1D40', secondary: '#FFD700', text: '#FFFFFF' },
  'DePaul': { primary: '#005BBB', secondary: '#CC0000', text: '#FFFFFF' },
  'Detroit Mercy': { primary: '#CC0000', secondary: '#00205B', text: '#FFFFFF' },
  'Drake': { primary: '#005BBB', secondary: '#FFFFFF', text: '#000000' },
  'Drexel': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'East Carolina': { primary: '#4B0082', secondary: '#FFD700', text: '#FFFFFF' },
  'Eastern Kentucky': { primary: '#630021', secondary: '#FFFFFF', text: '#000000' },
  'Eastern Michigan': { primary: '#006400', secondary: '#FFFFFF', text: '#000000' },
  'Elon': { primary: '#630021', secondary: '#FFD700', text: '#FFFFFF' },
  'Evansville': { primary: '#4B0082', secondary: '#FF7300', text: '#FFFFFF' },
  'Fairfield': { primary: '#CC0000', secondary: '#FFFFFF', text: '#000000' },
  'Fordham': { primary: '#630021', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Furman': { primary: '#4B0082', secondary: '#FFFFFF', text: '#A7A8AA' },
  'George Mason': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF' },
  'George Washington': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Georgia Southern': { primary: '#00205B', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Georgia State': { primary: '#005BBB', secondary: '#CC0000', text: '#FFFFFF' },
  'Florida Atlantic': { primary: '#003366', secondary: '#FA0000', text: '#FFFFFF' },
  'Grand Canyon': { primary: '#4B0082', secondary: '#FFFFFF', text: '#000000' },
  'Green Bay': { primary: '#006400', secondary: '#FFFFFF', text: '#CC0000' },
  'Harvard': { primary: '#A51C30', secondary: '#FFFFFF', text: '#000000' },
  'Hawaii': { primary: '#006400', secondary: '#FFFFFF', text: '#000000' },
  'Hofstra': { primary: '#005BBB', secondary: '#FFD700', text: '#FFFFFF' },
  'Holy Cross': { primary: '#4B0082', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Idaho': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Idaho State': { primary: '#FF7300', secondary: '#000000', text: '#FFFFFF' },
  'Illinois State': { primary: '#CC0000', secondary: '#FFD700', text: '#FFFFFF' },
  'Indiana State': { primary: '#005BBB', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Iona': { primary: '#630021', secondary: '#FFD700', text: '#FFFFFF' },
  'Jacksonville': { primary: '#006400', secondary: '#FFFFFF', text: '#000000' },
  'James Madison': { primary: '#4B0082', secondary: '#FFD700', text: '#FFFFFF' },
  'Kent State': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'La Salle': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Lafayette': { primary: '#630021', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Lehigh': { primary: '#4F2C1D', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Liberty': { primary: '#00205B', secondary: '#CC0000', text: '#FFFFFF' },
  'Long Beach State': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Loyola Chicago': { primary: '#630021', secondary: '#FFD700', text: '#FFFFFF' },
  'Maine': { primary: '#005BBB', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Manhattan': { primary: '#006400', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Marist': { primary: '#CC0000', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Marshall': { primary: '#006400', secondary: '#FFFFFF', text: '#A7A8AA' },
  'UMBC': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Massachusetts': { primary: '#630021', secondary: '#FFFFFF', text: '#A7A8AA' },
  'McNeese State': { primary: '#005BBB', secondary: '#FFD700', text: '#FFFFFF' },
  'Mercer': { primary: '#FF7300', secondary: '#000000', text: '#FFFFFF' },
  'Miami (OH)': { primary: '#CC0000', secondary: '#FFFFFF', text: '#000000' },
  'Middle Tennessee': { primary: '#005BBB', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Milwaukee': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Monmouth': { primary: '#00205B', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Montana': { primary: '#630021', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Montana State': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Morehead State': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Murray State': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Navy': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'New Hampshire': { primary: '#00205B', secondary: '#FFFFFF', text: '#A7A8AA' },
  'New Mexico State': { primary: '#8C1D40', secondary: '#FFFFFF', text: '#000000' },
  'Niagara': { primary: '#4B0082', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Nicholls State': { primary: '#CC0000', secondary: '#A7A8AA', text: '#FFFFFF' },
  'North Dakota': { primary: '#006400', secondary: '#FFFFFF', text: '#A7A8AA' },
  'North Dakota State': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF' },
  'North Florida': { primary: '#00205B', secondary: '#A7A8AA', text: '#FFFFFF' },
  'North Texas': { primary: '#006400', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Northeastern': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Northern Arizona': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Northern Colorado': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Northern Illinois': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Northern Iowa': { primary: '#4B0082', secondary: '#FFD700', text: '#FFFFFF' },
  'Northwestern State': { primary: '#4B0082', secondary: '#FF7300', text: '#FFFFFF' },
  'Oakland': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Ohio': { primary: '#006400', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Old Dominion': { primary: '#00205B', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Omaha': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Oral Roberts': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Pacific': { primary: '#FF7300', secondary: '#000000', text: '#FFFFFF' },
  'Penn': { primary: '#00205B', secondary: '#CC0000', text: '#FFFFFF' },
  'Pepperdine': { primary: '#005BBB', secondary: '#FF7300', text: '#FFFFFF' },
  'Portland': { primary: '#4B0082', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Portland State': { primary: '#006400', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Princeton': { primary: '#FF7300', secondary: '#000000', text: '#FFFFFF' },
  'Quinnipiac': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Radford': { primary: '#CC0000', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Rhode Island': { primary: '#005BBB', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Rice': { primary: '#00205B', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Richmond': { primary: '#00205B', secondary: '#CC0000', text: '#FFFFFF' },
  'Rider': { primary: '#8C1D40', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Robert Morris': { primary: '#00205B', secondary: '#CC0000', text: '#FFFFFF' },
  'Sacramento State': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF' },
  'Sacred Heart': { primary: '#CC0000', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Saint Joseph\'s': { primary: '#8C1D40', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Saint Louis': { primary: '#005BBB', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Saint Peter\'s': { primary: '#00205B', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Sam Houston State': { primary: '#FF7300', secondary: '#00205B', text: '#FFFFFF' },
  'Samford': { primary: '#00205B', secondary: '#CC0000', text: '#FFFFFF' },
  'San Diego': { primary: '#00205B', secondary: '#A7A8AA', text: '#FFFFFF' },
  'San Francisco': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF' },
  'San Jose State': { primary: '#005BBB', secondary: '#FFD700', text: '#FFFFFF' },
  'Santa Clara': { primary: '#8C1D40', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Seattle': { primary: '#CC0000', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Siena': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF' },
  'South Alabama': { primary: '#00205B', secondary: '#CC0000', text: '#FFFFFF' },
  'South Dakota': { primary: '#CC0000', secondary: '#FFFFFF', text: '#A7A8AA' },
  'South Dakota State': { primary: '#005BBB', secondary: '#FFD700', text: '#FFFFFF' },
  'South Florida': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF' },
  'Southeast Missouri State': { primary: '#CC0000', secondary: '#000000', text: '#FFFFFF' },
  'Southern Illinois': { primary: '#630021', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Southern Miss': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Southern Utah': { primary: '#CC0000', secondary: '#A7A8AA', text: '#FFFFFF' },
  'St. Bonaventure': { primary: '#4F2C1D', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Stephen F. Austin': { primary: '#4B0082', secondary: '#FFFFFF', text: '#CC0000' },
  'Stetson': { primary: '#006400', secondary: '#FFFFFF', text: '#A7A8AA' },
  'Stony Brook': { primary: '#CC0000', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Toledo': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'Towson': { primary: '#000000', secondary: '#FFD700', text: '#FFFFFF' },
  'Troy': { primary: '#8C1D40', secondary: '#A7A8AA', text: '#FFFFFF' },
  'Tulane': { primary: '#006400', secondary: '#005BBB', text: '#FFFFFF' },
  'Tulsa': { primary: '#00205B', secondary: '#CC0000', text: '#FFFFFF' },
  'UAB': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF' },
  'UC Davis': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'UC Irvine': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'UC Riverside': { primary: '#005BBB', secondary: '#FFD700', text: '#FFFFFF' },
  'UC Santa Barbara': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'UIC': { primary: '#CC0000', secondary: '#00205B', text: '#FFFFFF' },
  'UMass Lowell': { primary: '#005BBB', secondary: '#CC0000', text: '#FFFFFF' },
  'UNC Asheville': { primary: '#005BBB', secondary: '#FFFFFF', text: '#A7A8AA' },
  'UNC Greensboro': { primary: '#00205B', secondary: '#FFD700', text: '#FFFFFF' },
  'UNC Wilmington': { primary: '#006400', secondary: '#FFD700', text: '#FFFFFF' },
  'USC Upstate': { primary: '#006400', secondary: '#000000', text: '#FFFFFF' },
  'UT Arlington': { primary: '#005BBB', secondary: '#FF7300', text: '#FFFFFF' },
  'UT Martin': { primary: '#00205B', secondary: '#FF7300', text: '#FFFFFF' },
};

export const SCHOOL_CONFERENCES: { [key: string]: string } = {
    // SEC
    'Alabama': 'SEC', 'Arkansas': 'SEC', 'Auburn': 'SEC', 'Florida': 'SEC', 'Georgia': 'SEC', 'Kentucky': 'SEC', 'LSU': 'SEC', 'Mississippi State': 'SEC', 'Missouri': 'SEC', 'Ole Miss': 'SEC', 'South Carolina': 'SEC', 'Tennessee': 'SEC', 'Texas A&M': 'SEC', 'Vanderbilt': 'SEC', 'Oklahoma': 'SEC', 'Texas': 'SEC',
    // Big Ten
    'Illinois': 'Big Ten', 'Indiana': 'Big Ten', 'Iowa': 'Big Ten', 'Maryland': 'Big Ten', 'Michigan': 'Big Ten', 'Michigan State': 'Big Ten', 'Minnesota': 'Big Ten', 'Nebraska': 'Big Ten', 'Northwestern': 'Big Ten', 'Ohio State': 'Big Ten', 'Penn State': 'Big Ten', 'Purdue': 'Big Ten', 'Rutgers': 'Big Ten', 'Wisconsin': 'Big Ten', 'UCLA': 'Big Ten', 'USC': 'Big Ten', 'Washington': 'Big Ten', 'Oregon': 'Big Ten',
    // Big 12
    'Arizona': 'Big 12', 'Arizona State': 'Big 12', 'Baylor': 'Big 12', 'BYU': 'Big 12', 'Cincinnati': 'Big 12', 'Colorado': 'Big 12', 'Houston': 'Big 12', 'Iowa State': 'Big 12', 'Kansas': 'Big 12', 'Kansas State': 'Big 12', 'Oklahoma State': 'Big 12', 'TCU': 'Big 12', 'Texas Tech': 'Big 12', 'UCF': 'Big 12', 'Utah': 'Big 12', 'West Virginia': 'Big 12',
    // ACC
    'Boston College': 'ACC', 'California': 'ACC', 'Clemson': 'ACC', 'Duke': 'ACC', 'Florida State': 'ACC', 'Georgia Tech': 'ACC', 'Louisville': 'ACC', 'Miami': 'ACC', 'NC State': 'ACC', 'North Carolina': 'ACC', 'Notre Dame': 'ACC', 'Pittsburgh': 'ACC', 'SMU': 'ACC', 'Stanford': 'ACC', 'Syracuse': 'ACC', 'Virginia': 'ACC', 'Virginia Tech': 'ACC', 'Wake Forest': 'ACC',
    // Big East
    'Butler': 'Big East', 'Creighton': 'Big East', 'DePaul': 'Big East', 'Georgetown': 'Big East', 'Marquette': 'Big East', 'Providence': 'Big East', 'Seton Hall': 'Big East', 'St. John\'s': 'Big East', 'UConn': 'Big East', 'Villanova': 'Big East', 'Xavier': 'Big East',
    // Pac-12
    'Oregon State': 'Pac-12', 'Washington State': 'Pac-12',
    // Mountain West
    'Boise State': 'Mountain West', 'Colorado State': 'Mountain West', 'Fresno State': 'Mountain West', 'Nevada': 'Mountain West', 'New Mexico': 'Mountain West', 'San Diego State': 'Mountain West', 'San Jose State': 'Mountain West', 'UNLV': 'Mountain West', 'Utah State': 'Mountain West', 'Wyoming': 'Mountain West',
    // WCC
    'Gonzaga': 'WCC', 'Saint Mary\'s': 'WCC', 'San Francisco': 'WCC', 'Santa Clara': 'WCC', 'Portland': 'WCC', 'Pepperdine': 'WCC', 'San Diego': 'WCC', 'Pacific': 'WCC', 'Loyola Marymount': 'WCC',
    // AAC
    'Charlotte': 'AAC', 'East Carolina': 'AAC', 'Memphis': 'AAC', 'North Texas': 'AAC', 'Rice': 'AAC', 'South Florida': 'AAC', 'Temple': 'AAC', 'Tulane': 'AAC', 'Tulsa': 'AAC', 'UAB': 'AAC', 'UTSA': 'AAC', 'Wichita State': 'AAC', 'Florida Atlantic': 'AAC',
    // Atlantic 10
    'Davidson': 'A-10', 'Dayton': 'A-10', 'Fordham': 'A-10', 'George Mason': 'A-10', 'George Washington': 'A-10', 'La Salle': 'A-10', 'Loyola Chicago': 'A-10', 'Massachusetts': 'A-10', 'Rhode Island': 'A-10', 'Richmond': 'A-10', 'Saint Joseph\'s': 'A-10', 'Saint Louis': 'A-10', 'St. Bonaventure': 'A-10', 'VCU': 'A-10',
    // Conference USA
    'Jacksonville State': 'C-USA', 'Liberty': 'C-USA', 'Louisiana Tech': 'C-USA', 'Middle Tennessee': 'C-USA', 'New Mexico State': 'C-USA', 'Sam Houston State': 'C-USA', 'UTEP': 'C-USA', 'Western Kentucky': 'C-USA',
    // MAC
    'Ball State': 'MAC', 'Bowling Green': 'MAC', 'Buffalo': 'MAC', 'Central Michigan': 'MAC', 'Eastern Michigan': 'MAC', 'Kent State': 'MAC', 'Miami (OH)': 'MAC', 'Northern Illinois': 'MAC', 'Ohio': 'MAC', 'Toledo': 'MAC', 'Western Michigan': 'MAC',
    // Sun Belt
    'Appalachian State': 'Sun Belt', 'Arkansas State': 'Sun Belt', 'Coastal Carolina': 'Sun Belt', 'Georgia Southern': 'Sun Belt', 'Georgia State': 'Sun Belt', 'James Madison': 'Sun Belt', 'Marshall': 'Sun Belt', 'Old Dominion': 'Sun Belt', 'South Alabama': 'Sun Belt', 'Southern Miss': 'Sun Belt', 'Troy': 'Sun Belt',
    // Missouri Valley
    'Belmont': 'MVC', 'Bradley': 'MVC', 'Drake': 'MVC', 'Evansville': 'MVC', 'Illinois State': 'MVC', 'Indiana State': 'MVC', 'Murray State': 'MVC', 'Northern Iowa': 'MVC', 'Southern Illinois': 'MVC', 'UIC': 'MVC',
    // SWAC
    'Alabama A&M': 'SWAC', 'Alabama State': 'SWAC', 'Alcorn State': 'SWAC', 'Arkansas-Pine Bluff': 'SWAC', 'Bethune-Cookman': 'SWAC', 'Florida A&M': 'SWAC', 'Grambling State': 'SWAC', 'Jackson State': 'SWAC', 'Mississippi Valley State': 'SWAC', 'Prairie View A&M': 'SWAC', 'Southern': 'SWAC', 'Texas Southern': 'SWAC',
    // WAC
    'Grand Canyon': 'WAC', 'Seattle': 'WAC', 'Stephen F. Austin': 'WAC', 'UT Arlington': 'WAC', 'Southern Utah': 'WAC',
    // Ivy League
    'Brown': 'Ivy', 'Columbia': 'Ivy', 'Cornell': 'Ivy', 'Dartmouth': 'Ivy', 'Harvard': 'Ivy', 'Penn': 'Ivy', 'Princeton': 'Ivy', 'Yale': 'Ivy',
    // America East
    'Albany': 'America East', 'Maine': 'America East', 'New Hampshire': 'America East', 'UMBC': 'America East', 'UMass Lowell': 'America East',
    // ASUN
    'Eastern Kentucky': 'ASUN', 'Jacksonville': 'ASUN', 'North Florida': 'ASUN', 'Stetson': 'ASUN',
    // Big Sky
    'Idaho': 'Big Sky', 'Idaho State': 'Big Sky', 'Montana': 'Big Sky', 'Montana State': 'Big Sky', 'Northern Arizona': 'Big Sky', 'Northern Colorado': 'Big Sky', 'Portland State': 'Big Sky', 'Sacramento State': 'Big Sky',
    // Big South
    'Radford': 'Big South', 'UNC Asheville': 'Big South', 'USC Upstate': 'Big South',
    // Big West
    'Cal State Fullerton': 'Big West', 'Cal State Northridge': 'Big West', 'Hawaii': 'Big West', 'Long Beach State': 'Big West', 'UC Davis': 'Big West', 'UC Irvine': 'Big West', 'UC Riverside': 'Big West', 'UC Santa Barbara': 'Big West',
    // CAA
    'Campbell': 'CAA', 'Charleston WV': 'CAA', 'Delaware': 'CAA', 'Drexel': 'CAA', 'Elon': 'CAA', 'Hampton': 'CAA', 'Hofstra': 'CAA', 'Monmouth': 'CAA', 'North Carolina A&T': 'CAA', 'Northeastern': 'CAA', 'Stony Brook': 'CAA', 'Towson': 'CAA', 'UNC Wilmington': 'CAA',
    // Horizon
    'Cleveland State': 'Horizon', 'Detroit Mercy': 'Horizon', 'Green Bay': 'Horizon', 'Milwaukee': 'Horizon', 'Oakland': 'Horizon', 'Robert Morris': 'Horizon',
    // MAAC
    'Fairfield': 'MAAC', 'Iona': 'MAAC', 'Manhattan': 'MAAC', 'Marist': 'MAAC', 'Niagara': 'MAAC', 'Quinnipiac': 'MAAC', 'Rider': 'MAAC', 'Saint Peter\'s': 'MAAC', 'Siena': 'MAAC',
    // MEAC
    'Coppin State': 'MEAC', 'Delaware State': 'MEAC', 'Howard': 'MEAC', 'Maryland Eastern Shore': 'MEAC', 'Morgan State': 'MEAC', 'Norfolk State': 'MEAC', 'North Carolina Central': 'MEAC', 'South Carolina State': 'MEAC',
    // NEC
    'Sacred Heart': 'NEC',
    // Ohio Valley
    'Morehead State': 'OVC', 'Southeast Missouri State': 'OVC', 'Tennessee State': 'OVC', 'UT Martin': 'OVC',
    // Patriot League
    'Boston University': 'Patriot', 'Bucknell': 'Patriot', 'Colgate': 'Patriot', 'Holy Cross': 'Patriot', 'Lafayette': 'Patriot', 'Lehigh': 'Patriot', 'Navy': 'Patriot',
    // Southern
    'Chattanooga': 'SoCon', 'Furman': 'SoCon', 'Mercer': 'SoCon', 'Samford': 'SoCon', 'UNC Greensboro': 'SoCon', 'Wofford': 'SoCon',
    // Southland
    'McNeese State': 'Southland', 'Nicholls State': 'Southland', 'Northwestern State': 'Southland', 'Southeastern Louisiana': 'Southland',
    // Summit League
      'Denver': 'Summit', 'North Dakota': 'Summit', 'North Dakota State': 'Summit', 'Omaha': 'Summit', 'Oral Roberts': 'Summit', 'South Dakota': 'Summit', 'South Dakota State': 'Summit',
};


export const CONFERENCE_STRENGTH: { [key: string]: 'Power' | 'Mid' | 'Low' } = {
    Power: 'Power',
    Mid: 'Mid',
    Low: 'Low',
    'SEC': 'Power', 'Big Ten': 'Power', 'Big 12': 'Power', 'ACC': 'Power', 'Big East': 'Power',
    'Mountain West': 'Mid', 'AAC': 'Mid', 'A-10': 'Mid', 'WCC': 'Mid', 'Missouri Valley': 'Mid',
    'C-USA': 'Low', 'MAC': 'Low', 'Sun Belt': 'Low', 'SWAC': 'Low', 'Ivy': 'Low', 'Independent': 'Low', 'WAC': 'Mid',
};

export const SCHOOL_PRESTIGE_RANGES: { [key: string]: { min: number, max: number } } = {
    'Kentucky': { min: 95, max: 99 }, 'Duke': { min: 95, max: 99 }, 'Kansas': { min: 95, max: 99 }, 'North Carolina': { min: 94, max: 98 }, 'UConn': { min: 93, max: 98 }, 'Villanova': { min: 90, max: 96 }, 'Gonzaga': { min: 90, max: 96 },
    'UCLA': { min: 88, max: 95 }, 'Arizona': { min: 88, max: 95 }, 'Houston': { min: 87, max: 94 }, 'Purdue': { min: 86, max: 93 }, 'Tennessee': { min: 86, max: 93 }, 'Auburn': { min: 85, max: 92 }, 'Baylor': { min: 85, max: 92 },
    'Michigan State': { min: 84, max: 91 }, 'Arkansas': { min: 83, max: 90 }, 'Illinois': { min: 82, max: 89 }, 'Alabama': { min: 82, max: 89 }, 'Marquette': { min: 81, max: 88 }, 'Creighton': { min: 80, max: 88 },
    'Texas': { min: 79, max: 87 }, 'Indiana': { min: 78, max: 86 }, 'Ohio State': { min: 77, max: 85 }, 'Wisconsin': { min: 76, max: 84 }, 'Florida': { min: 75, max: 83 }, 'San Diego State': { min: 75, max: 83 },
    "Florida Atlantic": { min: 75, max: 85 },
    "Grand Canyon": { min: 70, max: 80 },
    // Default for any school not listed
};

export const SCHOOL_ENDOWMENT_OVERRIDES: { [key: string]: number } = {
    'Harvard': 99, 'Yale': 97, 'Princeton': 98, 'Columbia': 90, 'Cornell': 90, 'Brown': 88, 'Dartmouth': 89, 'Penn': 91,
    'Stanford': 96, 'Notre Dame': 93, 'Vanderbilt': 93, 'Rice': 92, 'Northwestern': 92, 'Duke': 92, 'Georgetown': 88,
    'Villanova': 85, 'Boston College': 84, 'Wake Forest': 85, 'SMU': 85, 'Tulane': 84, 'TCU': 83, 'Baylor': 84,
    'USC': 86, 'UCLA': 86, 'Texas': 90, 'Texas A&M': 90, 'Houston': 83, 'Texas Tech': 78, 'Oklahoma': 81,
    'Oklahoma State': 79, 'Kansas': 82, 'Kansas State': 78, 'Missouri': 80, 'Arkansas': 82, 'Alabama': 83,
    'Auburn': 81, 'LSU': 82, 'Georgia': 82, 'Florida': 84, 'Tennessee': 82, 'Kentucky': 84,
    'Ohio State': 88, 'Michigan': 90, 'Michigan State': 84, 'Indiana': 82, 'Purdue': 82, 'Illinois': 82, 'Wisconsin': 85,
    'Minnesota': 84, 'Iowa': 82, 'Iowa State': 78, 'Nebraska': 78, 'Penn State': 85, 'Maryland': 84,
    'Virginia': 88, 'Virginia Tech': 80, 'North Carolina': 86, 'NC State': 80, 'Clemson': 83, 'Miami': 84,
    'Florida State': 82, 'Georgia Tech': 82, 'Syracuse': 80, 'Pittsburgh': 80, 'Boston University': 80,
    'Seton Hall': 78, 'Providence': 77, 'St. John\'s': 76, 'Marquette': 80, 'DePaul': 76, 'Creighton': 76,
    'Dayton': 75, 'Xavier': 78, 'Saint Louis': 76, 'Gonzaga': 80, 'BYU': 83, 'San Diego State': 76,
    'Colorado': 80, 'Colorado State': 73, 'Utah': 80, 'Arizona': 83, 'Arizona State': 80, 'Oregon': 82,
    'Oregon State': 78, 'Washington': 86, 'Washington State': 75, 'California': 85, 'UConn': 84, 'Rutgers': 78,
    'Temple': 74, 'Cincinnati': 74, 'Memphis': 75, 'UNLV': 74, 'Nevada': 72, 'New Mexico': 72,
};

export const SCHOOL_SPONSORS: { [key: string]: SponsorName } = {
    'Duke': 'Nike', 'Kentucky': 'Nike', 'North Carolina': 'Jordan', 'Oregon': 'Nike', 'Michigan': 'Jordan', 'Florida': 'Jordan', 'UCLA': 'Jordan', 'Oklahoma': 'Jordan', 'Ohio State': 'Nike', 'USC': 'Nike', 'Texas': 'Nike', 'Alabama': 'Nike', 'Clemson': 'Nike', 'LSU': 'Nike', 'Georgia': 'Nike',
    'Kansas': 'Adidas', 'Louisville': 'Adidas', 'Indiana': 'Adidas', 'Miami': 'Adidas', 'Washington': 'Adidas', 'NC State': 'Adidas', 'Texas A&M': 'Adidas',
    'Florida Atlantic': 'Adidas',
    'Auburn': 'Under Armour', 'Notre Dame': 'Under Armour', 'Wisconsin': 'Under Armour', 'Maryland': 'Under Armour', 'South Carolina': 'Under Armour', 'Texas Tech': 'Under Armour',
    // Corrections / Big East updates
    'Georgetown': 'Jordan',
    'Seton Hall': 'Under Armour',
    'Providence': 'Nike',
    'Villanova': 'Nike',
    'UConn': 'Nike',
    'Butler': 'Nike',
    'Creighton': 'Nike',
    'DePaul': 'Nike',
    'Marquette': 'Nike',
    "St. John's": 'Nike',
    'Xavier': 'Nike',
    // Default to Nike for unlisted
};

export const INITIAL_SPONSORS: { [key in SponsorName]: { marketShare: number } } = {
    'Nike': { marketShare: 0.40 },
    'Adidas': { marketShare: 0.22 },
    'Jordan': { marketShare: 0.15 },
    'Under Armour': { marketShare: 0.10 },
    'Reebok': { marketShare: 0.05 },
    'New Balance': { marketShare: 0.04 },
    'Puma': { marketShare: 0.04 },
};

export const SPONSOR_SLOGANS: { [key in SponsorName]: string } = {
    'Nike': 'Just Do It.',
    'Adidas': 'Impossible is Nothing.',
    'Jordan': 'Become Legendary.',
    'Under Armour': 'The Only Way Is Through.',
    'Reebok': 'Life is Not a Spectator Sport.',
    'New Balance': 'Fearlessly Independent.',
    'Puma': 'Forever Faster.',
};

export const ARENA_CAPACITIES: { [key: string]: number } = {
    'Syracuse': 35642, 'Kentucky': 20545, 'North Carolina': 21750, 'Louisville': 22090, 'Tennessee': 21678, 'Maryland': 17950, 'Arkansas': 19200, 'Kansas': 16300, 'Indiana': 17222,
    // Default
};

export const FIRST_NAMES = [
    "Adam", "Adrian", "Alan", "Alex", "Andre", "Andrew", "Anthony", "Antoine", "Antonio", "Austin", "Avery", 
    "Ben", "Blake", "Brandon", "Brian", "Caleb", "Cameron", "Carlos", "Carter", "Cedric", "Charles", "Chris", 
    "Christian", "Christopher", "Cody", "Corey", "Craig", "Damian", "Damon", "Daniel", "Dante", "Darius", 
    "Darnell", "Darrell", "David", "Demetrius", "Dennis", "Deon", "Derek", "DeShawn", "Desmond", "Devin", 
    "Devon", "Dominic", "Donovan", "Douglas", "Dylan", "Edward", "Elijah", "Eric", "Ethan", "Evan", 
    "Franklin", "Gary", "George", "Gerald", "Gregory", "Harold", "Henry", "Ian", "Isaac", "Isaiah", "Ivan", 
    "Jabari", "Jack", "Jacob", "Jaden", "Jalen", "Jamal", "Jamar", "James", "Jaquan", "Jared", "Jason", 
    "Javier", "Jaylen", "Jeff", "Jeremy", "Jerome", "Jerry", "Jesse", "Joel", "John", "Jonathan", "Jordan", 
    "Joseph", "Joshua", "Josiah", "Juan", "Julian", "Julius", "Justin", "Kamari", "Keith", "Kelvin", 
    "Kendrick", "Kenneth", "Kevin", "Khalil", "Kyle", "Lamar", "Lance", "Larry", "Lawrence", "Leon", "Leroy", 
    "Lewis", "Logan", "Louis", "Lucas", "Malik", "Marcus", "Mario", "Mark", "Marquis", "Martin", "Marvin", 
    "Mason", "Matthew", "Maurice", "Max", "Michael", "Miles", "Mitchell", "Nathan", "Nicholas", "Noah", 
    "Omar", "Oscar", "Owen", "Patrick", "Paul", "Peter", "Phillip", "Quentin", "Randy", "Rashad", "Raymond", 
    "Reggie", "Ricardo", "Richard", "Robert", "Ronald", "Roy", "Russell", "Ryan", "Sam", "Samuel", "Scott", 
    "Sean", "Sergio", "Shawn", "Stephen", "Steven", "Terrence", "Terrell", "Terry", "Theo", "Thomas", 
    "Timothy", "Todd", "Tony", "Travis", "Trevor", "Trey", "Tristan", "Tyler", "Tyrone", "Victor", "Vincent", 
    "Walter", "Wayne", "Wesley", "Will", "William", "Xavier", "Zachary"
];

export const FEMALE_FIRST_NAMES = [
    "Abigail", "Ada", "Adriana", "Alice", "Alicia", "Allison", "Amanda", "Amber", "Amy", "Andrea", "Angela", "Anita", "Ann", "Anna", "Anne", "Ashley", "Audrey",
    "Barbara", "Beatrice", "Bella", "Bernice", "Beth", "Betty", "Beverly", "Bianca", "Bonnie", "Brenda", "Brianna", "Brittany", "Brooke",
    "Caitlin", "Camila", "Candace", "Carla", "Carol", "Caroline", "Carolyn", "Casey", "Catherine", "Cathy", "Cecilia", "Celeste", "Charlotte", "Chelsea", "Cheryl", "Chloe", "Christina", "Christine", "Cindy", "Claire", "Clara", "Claudia", "Colleen", "Connie", "Courtney", "Crystal", "Cynthia",
    "Daisy", "Dana", "Danielle", "Darlene", "Dawn", "Deborah", "Debra", "Denise", "Diana", "Diane", "Donna", "Doris", "Dorothy",
    "Edith", "Eileen", "Elaine", "Eleanor", "Elena", "Elizabeth", "Ella", "Ellen", "Emily", "Emma", "Erica", "Erin", "Esther", "Eva", "Evelyn",
    "Faith", "Felicia", "Florence", "Frances",
    "Gabriella", "Gabrielle", "Gail", "Genevieve", "Georgia", "Gina", "Gloria", "Grace", "Gwen",
    "Hailey", "Hannah", "Hazel", "Heather", "Heidi", "Helen", "Holly", "Hope",
    "Irene", "Iris", "Isabel", "Isabella", "Ivy",
    "Jackie", "Jacqueline", "Jade", "Jamie", "Jane", "Janet", "Janice", "Jasmine", "Jean", "Jeanette", "Jeanne", "Jenna", "Jennifer", "Jenny", "Jessica", "Jill", "Joan", "Joanna", "Jocelyn", "Jodi", "Jody", "Johanna", "Josephine", "Joy", "Joyce", "Judith", "Judy", "Julia", "Julie", "June",
    "Karen", "Katherine", "Kathleen", "Kathryn", "Kathy", "Katie", "Kay", "Kayla", "Kelly", "Kelsey", "Kim", "Kimberly", "Kristen", "Kristin", "Kristina", "Krystal",
    "Lacey", "Lana", "Laura", "Lauren", "Laurie", "Leah", "Leslie", "Lillian", "Lily", "Linda", "Lindsay", "Lisa", "Lois", "Loretta", "Lori", "Lorraine", "Louise", "Lucille", "Lucy", "Lydia", "Lynn",
    "Mabel", "Mackenzie", "Madeline", "Madison", "Mae", "Maggie", "Mallory", "Mandy", "Margaret", "Maria", "Marian", "Marie", "Marilyn", "Marion", "Marissa", "Marjorie", "Martha", "Mary", "Matilda", "Maureen", "Maxine", "Megan", "Melanie", "Melinda", "Melissa", "Melody", "Meredith", "Mia", "Michelle", "Mildred", "Mindy", "Miranda", "Molly", "Monica", "Morgan", "Muriel",
    "Nancy", "Natalie", "Natasha", "Nicole", "Nina", "Noelle", "Nora", "Norma",
    "Olivia",
    "Paige", "Pamela", "Patricia", "Paula", "Pauline", "Peggy", "Penelope", "Penny", "Phyllis", "Priscilla",
    "Rachel", "Ramona", "Rebecca", "Regina", "Renee", "Rhonda", "Rita", "Roberta", "Robin", "Rosa", "Rose", "Rosemary", "Ruby", "Ruth",
    "Sabrina", "Sally", "Samantha", "Sandra", "Sara", "Sarah", "Savannah", "Selena", "Shannon", "Sharon", "Sheila", "Shelby", "Sherri", "Sherry", "Shirley", "Sierra", "Silvia", "Simone", "Sofia", "Sonia", "Sophia", "Sophie", "Stacey", "Stacy", "Stella", "Stephanie", "Sue", "Summer", "Susan", "Suzanne", "Sylvia",
    "Tabitha", "Tamara", "Tammy", "Tanya", "Tara", "Teresa", "Terri", "Theresa", "Tiffany", "Tina", "Tracy",
    "Valerie", "Vanessa", "Veronica", "Vicki", "Victoria", "Violet", "Virginia", "Vivian",
    "Wanda", "Wendy", "Whitney", "Willow",
    "Yvonne",
    "Zoe"
];

export const LAST_NAMES = [
    "Adams", "Alexander", "Allen", "Anderson", "Armstrong", "Arnold", "Austin", "Bailey", "Baker", "Banks", 
    "Barnes", "Bell", "Bennett", "Berry", "Bishop", "Black", "Boyd", "Bradley", "Brooks", "Brown", "Bryant", 
    "Burke", "Burns", "Burton", "Butler", "Byrd", "Calhoun", "Campbell", "Carpenter", "Carroll", "Carter", 
    "Chambers", "Chapman", "Charles", "Clark", "Cole", "Coleman", "Collins", "Cook", "Cooper", "Cox", "Craig", 
    "Crawford", "Cross", "Cunningham", "Daniels", "Davidson", "Davis", "Dawson", "Day", "Dean", "Dixon", 
    "Douglas", "Duncan", "Dunn", "Edwards", "Elliott", "Ellis", "Evans", "Farmer", "Fields", "Fisher", 
    "Fleming", "Fletcher", "Flowers", "Ford", "Foster", "Fowler", "Fox", "Franklin", "Frazier", "Freeman", 
    "Fuller", "Gardner", "Garrett", "George", "Gibson", "Gilbert", "Glover", "Gordon", "Graham", "Grant", 
    "Graves", "Gray", "Green", "Greene", "Griffin", "Hale", "Hall", "Hamilton", "Hardy", "Harper", "Harris", 
    "Harrison", "Hart", "Harvey", "Hawkins", "Hayes", "Henderson", "Henry", "Hicks", "Hill", "Holland", 
    "Holmes", "Hopkins", "Howard", "Howell", "Hubbard", "Hudson", "Hughes", "Hunt", "Hunter", "Ingram", 
    "Jackson", "Jacobs", "James", "Jefferson", "Jenkins", "Jennings", "Johnson", "Jones", "Jordan", "Kelly", 
    "Kennedy", "King", "Knight", "Lane", "Lawrence", "Lawson", "Lee", "Lewis", "Little", "Long", "Lucas", 
    "Lynch", "Lyons", "Mack", "Malone", "Marshall", "Martin", "Mason", "Matthews", "May", "McCoy", 
    "McDaniel", "McDonald", "McKinney", "Miles", "Miller", "Mills", "Mitchell", "Montgomery", "Moore", 
    "Morgan", "Morris", "Morrison", "Morton", "Moss", "Mullins", "Murphy", "Murray", "Myers", "Nash", "Neal", 
    "Nelson", "Newman", "Newton", "Nichols", "Norman", "Norris", "Norton", "Oliver", "Olson", "Owens", 
    "Page", "Palmer", "Parker", "Parks", "Patterson", "Payne", "Pearson", "Perkins", "Perry", "Peters", 
    "Peterson", "Phillips", "Pierce", "Porter", "Powell", "Powers", "Price", "Ramsey", "Ray", "Reed", "Reid", 
    "Reynolds", "Rhodes", "Rice", "Richards", "Richardson", "Riley", "Roberts", "Robertson", "Robinson", 
    "Rodgers", "Rogers", "Rose", "Ross", "Rowe", "Russell", "Sanders", "Saunders", "Scott", "Shaw", 
    "Shelton", "Sherman", "Simmons", "Simon", "Simpson", "Sims", "Singleton", "Smith", "Snyder", "Sparks", 
    "Spencer", "Stephens", "Stevens", "Stewart", "Stone", "Stokes", "Strickland", "Sullivan", "Summers", 
    "Sutton", "Taylor", "Terry", "Thomas", "Thompson", "Thornton", "Todd", "Townsend", "Tucker", "Turner", 
    "Tyler", "Vaughan", "Wade", "Wagner", "Walker", "Wallace", "Walters", "Walton", "Ward", "Warren", 
    "Washington", "Waters", "Watkins", "Watson", "Watts", "Weaver", "Webb", "Webster", "Welch", "Wells", 
    "West", "Wheeler", "White", "Wiggins", "Wilcox", "Wilkerson", "Wilkins", "Wilkinson", "Williams", 
    "Williamson", "Willis", "Wilson", "Winters", "Wise", "Wood", "Woods", "Wright", "Wyatt", "Yates", "Young"
];

export interface NBATeamInfo {
    name: string;
    conference: 'East' | 'West';
    division: 'Atlantic' | 'Central' | 'Southeast' | 'Northwest' | 'Pacific' | 'Southwest';
}

export const NBA_TEAMS: NBATeamInfo[] = [
    // Atlantic
    { name: 'Boston Celtics', conference: 'East', division: 'Atlantic' },
    { name: 'Brooklyn Nets', conference: 'East', division: 'Atlantic' },
    { name: 'New York Knicks', conference: 'East', division: 'Atlantic' },
    { name: 'Philadelphia 76ers', conference: 'East', division: 'Atlantic' },
    { name: 'Toronto Raptors', conference: 'East', division: 'Atlantic' },
    // Central
    { name: 'Chicago Bulls', conference: 'East', division: 'Central' },
    { name: 'Cleveland Cavaliers', conference: 'East', division: 'Central' },
    { name: 'Detroit Pistons', conference: 'East', division: 'Central' },
    { name: 'Indiana Pacers', conference: 'East', division: 'Central' },
    { name: 'Milwaukee Bucks', conference: 'East', division: 'Central' },
    // Southeast
    { name: 'Atlanta Hawks', conference: 'East', division: 'Southeast' },
    { name: 'Charlotte Hornets', conference: 'East', division: 'Southeast' },
    { name: 'Miami Heat', conference: 'East', division: 'Southeast' },
    { name: 'Orlando Magic', conference: 'East', division: 'Southeast' },
    { name: 'Washington Wizards', conference: 'East', division: 'Southeast' },
    // Northwest
    { name: 'Denver Nuggets', conference: 'West', division: 'Northwest' },
    { name: 'Minnesota Timberwolves', conference: 'West', division: 'Northwest' },
    { name: 'Oklahoma City Thunder', conference: 'West', division: 'Northwest' },
    { name: 'Portland Trail Blazers', conference: 'West', division: 'Northwest' },
    { name: 'Utah Jazz', conference: 'West', division: 'Northwest' },
    // Pacific
    { name: 'Golden State Warriors', conference: 'West', division: 'Pacific' },
    { name: 'LA Clippers', conference: 'West', division: 'Pacific' },
    { name: 'Los Angeles Lakers', conference: 'West', division: 'Pacific' },
    { name: 'Phoenix Suns', conference: 'West', division: 'Pacific' },
    { name: 'Sacramento Kings', conference: 'West', division: 'Pacific' },
    // Southwest
    { name: 'Dallas Mavericks', conference: 'West', division: 'Southwest' },
    { name: 'Houston Rockets', conference: 'West', division: 'Southwest' },
    { name: 'Memphis Grizzlies', conference: 'West', division: 'Southwest' },
    { name: 'New Orleans Pelicans', conference: 'West', division: 'Southwest' },
    { name: 'San Antonio Spurs', conference: 'West', division: 'Southwest' },
];

export interface InternationalProgram {
    club: string;
    country: string;
}
export const INTERNATIONAL_PROGRAMS: InternationalProgram[] = [
    { club: 'Real Madrid', country: 'Spain' },
    { club: 'FC Barcelona', country: 'Spain' },
    { club: 'Fenerbahce', country: 'Turkey' },
    { club: 'Olympiacos', country: 'Greece' },
    { club: 'Maccabi Tel Aviv', country: 'Israel' },
    { club: 'Zalgiris Kaunas', country: 'Lithuania' },
    { club: 'CSKA Moscow', country: 'Russia' },
    { club: 'Anadolu Efes', country: 'Turkey' },
    { club: 'Olimpia Milano', country: 'Italy' },
    { club: 'Bayern Munich', country: 'Germany' },
    { club: 'ASVEL', country: 'France' },
    { club: 'ALBA Berlin', country: 'Germany' },
    { club: 'Baskonia', country: 'Spain' },
    { club: 'Panathinaikos', country: 'Greece' },
    { club: 'Valencia Basket', country: 'Spain' },
    { club: 'Partizan Belgrade', country: 'Serbia' },
    { club: 'Crvena Zvezda', country: 'Serbia' },
    { club: 'Virtus Bologna', country: 'Italy' },
    { club: 'Monaco', country: 'France' },
    { club: 'Guangdong Southern Tigers', country: 'China' },
    { club: 'Shanghai Sharks', country: 'China' },
];

export const SPONSORS: Record<string, string[]> = {
    'Elite': ['Nike', 'Adidas', 'Under Armour', 'Jordan Brand'],
    'High': ['Gatorade', 'Powerade', 'State Farm', 'Capital One'],
    'Mid': ['Local Bank', 'Regional Hospital', 'Car Dealership', 'Grocery Chain'],
    'Low': ['Pizza Shop', 'Hardware Store', 'Law Firm', 'Insurance Agent'],
    'Syndicate': ['Alumni Ventures', 'Founders Fund', 'Legacy Partners', 'Greenwood Capital']
};

export const ALUMNI_SPONSORS = ['Alumni Ventures', 'Founders Fund', 'Legacy Partners', 'Greenwood Capital'];

export const ACTIVE_NBA_PLAYERS_DATA: Record<string, { activeCount: number; totalEarnings: number }> = {
    'Kentucky': { activeCount: 29, totalEarnings: 429983447 },
    'Duke': { activeCount: 24, totalEarnings: 341477752 },
    'UCLA': { activeCount: 14, totalEarnings: 178564286 },
    'North Carolina': { activeCount: 14, totalEarnings: 157983456 },
    'USC': { activeCount: 13, totalEarnings: 168909375 },
    'Florida State': { activeCount: 13, totalEarnings: 153353171 },
    'Michigan': { activeCount: 13, totalEarnings: 137297412 },
    'Texas': { activeCount: 11, totalEarnings: 164116793 },
    'Villanova': { activeCount: 11, totalEarnings: 158247596 },
    'LSU': { activeCount: 9, totalEarnings: 144354848 },
    'Kansas': { activeCount: 9, totalEarnings: 139219643 },
    'Arizona': { activeCount: 9, totalEarnings: 106122500 },
    'Gonzaga': { activeCount: 9, totalEarnings: 94407593 },
    'Arkansas': { activeCount: 8, totalEarnings: 90750000 },
    'Washington': { activeCount: 8, totalEarnings: 89122964 },
    'Tennessee': { activeCount: 8, totalEarnings: 49500000 },
    'Baylor': { activeCount: 7, totalEarnings: 57850000 },
    'Michigan State': { activeCount: 7, totalEarnings: 54657143 },
    'Virginia': { activeCount: 7, totalEarnings: 51100000 },
    'Ohio State': { activeCount: 6, totalEarnings: 58250000 },
    'Alabama': { activeCount: 6, totalEarnings: 51600000 },
    'Illinois': { activeCount: 6, totalEarnings: 36200000 },
    'Marquette': { activeCount: 6, totalEarnings: 34800000 },
    'Colorado': { activeCount: 5, totalEarnings: 74671428 },
    'Oregon': { activeCount: 5, totalEarnings: 48500000 },
    'Wake Forest': { activeCount: 5, totalEarnings: 46800000 },
    'Iowa State': { activeCount: 5, totalEarnings: 31500000 },
    'Indiana': { activeCount: 5, totalEarnings: 26900000 },
    'Texas A&M': { activeCount: 5, totalEarnings: 24500000 },
    'UConn': { activeCount: 5, totalEarnings: 18200000 },
    'Georgia Tech': { activeCount: 5, totalEarnings: 14200000 },
    'Stanford': { activeCount: 5, totalEarnings: 13500000 },
    'Missouri': { activeCount: 5, totalEarnings: 12500000 },
    'Creighton': { activeCount: 4, totalEarnings: 16800000 },
    'Houston': { activeCount: 4, totalEarnings: 14500000 },
    'Auburn': { activeCount: 4, totalEarnings: 12200000 },
    'Purdue': { activeCount: 4, totalEarnings: 10500000 },
    'Maryland': { activeCount: 4, totalEarnings: 9800000 },
    'Providence': { activeCount: 4, totalEarnings: 8500000 },
    'Syracuse': { activeCount: 4, totalEarnings: 7200000 },
    'Oklahoma': { activeCount: 4, totalEarnings: 6500000 },
    'Utah': { activeCount: 4, totalEarnings: 5800000 },
    'Xavier': { activeCount: 4, totalEarnings: 5200000 },
    'Georgetown': { activeCount: 3, totalEarnings: 24500000 },
    'Memphis': { activeCount: 3, totalEarnings: 18500000 },
    'Miami': { activeCount: 3, totalEarnings: 12500000 },
    'Florida': { activeCount: 3, totalEarnings: 11200000 },
    'Dayton': { activeCount: 3, totalEarnings: 10500000 },
    'Nevada': { activeCount: 3, totalEarnings: 9200000 },
    'San Diego State': { activeCount: 3, totalEarnings: 8500000 },
    'Saint Mary\'s': { activeCount: 3, totalEarnings: 7800000 },
    'VCU': { activeCount: 3, totalEarnings: 6500000 },
    'Cincinnati': { activeCount: 3, totalEarnings: 5200000 },
    'Pittsburgh': { activeCount: 3, totalEarnings: 4800000 },
    'West Virginia': { activeCount: 3, totalEarnings: 4200000 },
    'Wisconsin': { activeCount: 3, totalEarnings: 3800000 },
    'Seton Hall': { activeCount: 3, totalEarnings: 3500000 },
    'St. John\'s': { activeCount: 3, totalEarnings: 3200000 },
    'Temple': { activeCount: 3, totalEarnings: 2800000 },
    'UCF': { activeCount: 3, totalEarnings: 2500000 },
    'UNLV': { activeCount: 3, totalEarnings: 2200000 },
    'Utah State': { activeCount: 3, totalEarnings: 1800000 },
    'Wichita State': { activeCount: 3, totalEarnings: 1500000 },
};


export const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    'Washington D.C.'
];

export const SCHOOL_STATES: Record<string, string> = {
    'Alabama': 'Alabama', 'Arizona': 'Arizona', 'Arizona State': 'Arizona', 'Arkansas': 'Arkansas', 'Auburn': 'Alabama',
    'Baylor': 'Texas', 'Boston College': 'Massachusetts', 'California': 'California', 'Clemson': 'South Carolina', 'Colorado': 'Colorado',
    'Duke': 'North Carolina', 'Florida': 'Florida', 'Florida State': 'Florida', 'Georgia': 'Georgia', 'Georgia Tech': 'Georgia',
    'Illinois': 'Illinois', 'Indiana': 'Indiana', 'Iowa': 'Iowa', 'Iowa State': 'Iowa', 'Kansas': 'Kansas', 'Kansas State': 'Kansas',
    'Kentucky': 'Kentucky', 'Louisville': 'Kentucky', 'LSU': 'Louisiana', 'Maryland': 'Maryland', 'Miami': 'Florida',
    'Michigan': 'Michigan', 'Michigan State': 'Michigan', 'Minnesota': 'Minnesota', 'Mississippi State': 'Mississippi', 'Missouri': 'Missouri',
    'NC State': 'North Carolina', 'Nebraska': 'Nebraska', 'North Carolina': 'North Carolina', 'Northwestern': 'Illinois', 'Notre Dame': 'Indiana',
    'Ohio State': 'Ohio', 'Oklahoma': 'Oklahoma', 'Oklahoma State': 'Oklahoma', 'Ole Miss': 'Mississippi', 'Oregon': 'Oregon', 'Oregon State': 'Oregon',
    'Penn State': 'Pennsylvania', 'Pittsburgh': 'Pennsylvania', 'Purdue': 'Indiana', 'Rutgers': 'New Jersey', 'SMU': 'Texas',
    'South Carolina': 'South Carolina', 'Stanford': 'California', 'Syracuse': 'New York', 'TCU': 'Texas', 'Tennessee': 'Tennessee',
    'Texas': 'Texas', 'Texas A&M': 'Texas', 'Texas Tech': 'Texas', 'UCLA': 'California', 'UConn': 'Connecticut', 'USC': 'California',
    'Utah': 'Utah', 'Vanderbilt': 'Tennessee', 'Virginia': 'Virginia', 'Virginia Tech': 'Virginia', 'Wake Forest': 'North Carolina',
    'Washington': 'Washington', 'Washington State': 'Washington', 'West Virginia': 'West Virginia', 'Wisconsin': 'Wisconsin',
    'Gonzaga': 'Washington', 'Houston': 'Texas', 'Villanova': 'Pennsylvania', 'Marquette': 'Wisconsin', 'Creighton': 'Nebraska',
    'Xavier': 'Ohio', 'Providence': 'Rhode Island', 'Seton Hall': 'New Jersey', 'St. John\'s': 'New York', 'Georgetown': 'Washington D.C.',
    'Butler': 'Indiana', 'DePaul': 'Illinois', 'San Diego State': 'California', 'Memphis': 'Tennessee', 'Boise State': 'Idaho',
    'UNLV': 'Nevada', 'Dayton': 'Ohio', 'VCU': 'Virginia', 'Saint Mary\'s': 'California', 'Utah State': 'Utah', 'Nevada': 'Nevada',
    'New Mexico': 'New Mexico', 'Colorado State': 'Colorado', 'Wyoming': 'Wyoming', 'Air Force': 'Colorado', 'Fresno State': 'California',
    'San Jose State': 'California', 'Saint Louis': 'Missouri', 'Loyola Chicago': 'Illinois', 'Davidson': 'North Carolina', 'Richmond': 'Virginia',
    'George Mason': 'Virginia', 'George Washington': 'Washington D.C.', 'Massachusetts': 'Massachusetts', 'Rhode Island': 'Rhode Island',
    'St. Bonaventure': 'New York', 'Fordham': 'New York', 'La Salle': 'Pennsylvania', 'Saint Joseph\'s': 'Pennsylvania', 'Duquesne': 'Pennsylvania',
    'Wichita State': 'Kansas', 'Temple': 'Pennsylvania', 'Tulane': 'Louisiana', 'Tulsa': 'Oklahoma', 'South Florida': 'Florida',
    'UCF': 'Florida', 'Cincinnati': 'Ohio', 'East Carolina': 'North Carolina', 'Rice': 'Texas', 'North Texas': 'Texas', 'UAB': 'Alabama',
    'Charlotte': 'North Carolina', 'Florida Atlantic': 'Florida', 'UTSA': 'Texas',
    // Additional schools for location accuracy
    'Stony Brook': 'New York', 'Hofstra': 'New York', 'Iona': 'New York', 'Manhattan': 'New York', 'Marist': 'New York',
    'Siena': 'New York', 'Niagara': 'New York', 'LIU': 'New York', 'Albany': 'New York', 'Binghamton': 'New York',
    'Wagner': 'New York', 'Rider': 'New Jersey', 'Fairleigh Dickinson': 'New Jersey', 'Monmouth': 'New Jersey',
    'Saint Peter\'s': 'New Jersey', 'NJIT': 'New Jersey', 'Buffalo': 'New York', 'Quinnipiac': 'Connecticut',
    'Sacred Heart': 'Connecticut', 'Central Connecticut State': 'Connecticut', 'Fairfield': 'Connecticut',
    // WCC Schools
    'San Francisco': 'California', 'Santa Clara': 'California', 'San Diego': 'California', 'Pepperdine': 'California',
    'Portland': 'Oregon', 'Pacific': 'California', 'Loyola Marymount': 'California', 'Seattle': 'Washington',
    // Additional California Schools
    'Long Beach State': 'California', 'Cal State Fullerton': 'California', 'Cal State Northridge': 'California',
    'UC Davis': 'California', 'UC Irvine': 'California', 'UC Riverside': 'California', 'UC Santa Barbara': 'California',
    'Sacramento State': 'California',
    // Additional Schools
    'Hawaii': 'Hawaii', 'James Madison': 'Virginia', 'Old Dominion': 'Virginia', 'Marshall': 'West Virginia',
    'Belmont': 'Tennessee', 'Murray State': 'Kentucky', 'Morehead State': 'Kentucky', 'Eastern Kentucky': 'Kentucky',
    'Western Kentucky': 'Kentucky', 'Middle Tennessee': 'Tennessee', 'Chattanooga': 'Tennessee',
    'Furman': 'South Carolina', 'Samford': 'Alabama', 'Mercer': 'Georgia', 'Elon': 'North Carolina',
    'UNC Wilmington': 'North Carolina', 'UNC Greensboro': 'North Carolina', 'Appalachian State': 'North Carolina',
    'Coastal Carolina': 'South Carolina', 'Georgia Southern': 'Georgia', 'Georgia State': 'Georgia',
    'Troy': 'Alabama', 'South Alabama': 'Alabama', 'Arkansas State': 'Arkansas', 'Louisiana Tech': 'Louisiana',
    'Southern Miss': 'Mississippi', 'North Florida': 'Florida', 'Jacksonville': 'Florida', 'Stetson': 'Florida',
    'FGCU': 'Florida', 'Kennesaw State': 'Georgia', 'North Dakota': 'North Dakota', 'North Dakota State': 'North Dakota',
    'South Dakota': 'South Dakota', 'South Dakota State': 'South Dakota', 'Omaha': 'Nebraska', 'Oral Roberts': 'Oklahoma',
    'Northern Iowa': 'Iowa', 'Southern Illinois': 'Illinois', 'Illinois State': 'Illinois', 'Indiana State': 'Indiana',
    'Evansville': 'Indiana', 'Bradley': 'Illinois', 'Green Bay': 'Wisconsin', 'Milwaukee': 'Wisconsin',
    'Youngstown State': 'Ohio', 'Robert Morris': 'Pennsylvania', 'Drexel': 'Pennsylvania',
    'Delaware': 'Delaware', 'Towson': 'Maryland', 'UMBC': 'Maryland', 'Navy': 'Maryland',
    'Colgate': 'New York', 'Bucknell': 'Pennsylvania', 'Lehigh': 'Pennsylvania', 'Lafayette': 'Pennsylvania',
    'Holy Cross': 'Massachusetts', 'Northeastern': 'Massachusetts', 'Maine': 'Maine', 'New Hampshire': 'New Hampshire',
    'Vermont': 'Vermont', 'Hartford': 'Connecticut', 'UMass Lowell': 'Massachusetts',
    // HBCUs
    'Alabama A&M': 'Alabama', 'Alabama State': 'Alabama', 'Jackson State': 'Mississippi', 'Southern': 'Louisiana',
    'Grambling State': 'Louisiana', 'Prairie View A&M': 'Texas', 'Texas Southern': 'Texas', 'Alcorn State': 'Mississippi',
    'Mississippi Valley State': 'Mississippi', 'Arkansas-Pine Bluff': 'Arkansas', 'Florida A&M': 'Florida',
    'Bethune-Cookman': 'Florida', 'Howard': 'Washington D.C.', 'Morgan State': 'Maryland', 'Coppin State': 'Maryland',
    'Delaware State': 'Delaware', 'Maryland Eastern Shore': 'Maryland', 'Norfolk State': 'Virginia',
    'North Carolina A&T': 'North Carolina', 'North Carolina Central': 'North Carolina', 'South Carolina State': 'South Carolina',
    'Hampton': 'Virginia', 'Tennessee State': 'Tennessee',
    // MAC Conference
    'Ball State': 'Indiana', 'Ohio': 'Ohio', 'Bowling Green': 'Ohio', 'Kent State': 'Ohio',
    'Miami (OH)': 'Ohio', 'Toledo': 'Ohio', 'Akron': 'Ohio', 'Western Michigan': 'Michigan',
    'Eastern Michigan': 'Michigan', 'Central Michigan': 'Michigan', 'Northern Illinois': 'Illinois',
    // MVC
    'Drake': 'Iowa', 'Valparaiso': 'Indiana', 'Missouri State': 'Missouri',
    'UNI': 'Iowa',
    // Horizon League
    'Wright State': 'Ohio', 'Cleveland State': 'Ohio', 'Oakland': 'Michigan', 'Detroit Mercy': 'Michigan',
    'IUPUI': 'Indiana', 'PFW': 'Indiana',
    // Summit League
    'Denver': 'Colorado', 'St. Thomas': 'Minnesota',
    // A-10
    'Loyola Maryland': 'Maryland',
    // C-USA
    'FAU': 'Florida', 'FIU': 'Florida', 'UTEP': 'Texas', 'New Mexico State': 'New Mexico',
    'Liberty': 'Virginia', 'Jacksonville State': 'Alabama', 'Sam Houston': 'Texas',
    // Sun Belt
    'Texas State': 'Texas', 'Louisiana': 'Louisiana', 'Texas-Arlington': 'Texas',
    'Little Rock': 'Arkansas', 'ULM': 'Louisiana',
};

export const COACH_SKILL_TREE: CoachSkill[] = [
    {
        id: 'silver_tongue',
        name: 'Silver Tongue',
        description: '+5% Recruiting Interest per level.',
        cost: 1,
        level: 1,
        maxLevel: 3,
    },
    {
        id: 'clipboard_wizard',
        name: 'Clipboard Wizard',
        description: '+2 Offense/Defense in games per level.',
        cost: 1,
        level: 1,
        maxLevel: 3,
    },
    {
        id: 'developer',
        name: 'Developer',
        description: '+10% Training effectiveness per level.',
        cost: 2,
        level: 1,
        maxLevel: 3,
    },
    {
        id: 'portal_whisperer',
        name: 'Portal Whisperer',
        description: '+10% Transfer Portal interest per level.',
        cost: 2,
        level: 1,
        maxLevel: 2,
    },
    {
        id: 'legacy_builder',
        name: 'Legacy Builder',
        description: 'Reduces prestige decay by 20% per level.',
        cost: 3,
        level: 1,
        maxLevel: 2,
    }
];

export const RECRUITING_COSTS = {
    CONTACT: 500,
    SCOUT: 1500,
    VISIT_HOME: 3500,
    VISIT_CAMPUS: 5000,
    OFFER: 250,
    NEGATIVE: 2000,
};

export const FACILITY_UPGRADES = {
    Arena: [
        { level: 2, name: 'Arena Expansion', cost: 5000000, weeks: 12, description: 'Expand seating capacity by 2,000 seats.', benefit: 'Increases max attendance and potential revenue.' },
        { level: 3, name: 'Luxury Suites', cost: 12000000, weeks: 20, description: 'Add 20 luxury suites for high-end donors.', benefit: 'Boosts prestige and high-tier ticket revenue.' },
        { level: 4, name: 'Jumbotron & Sound', cost: 8000000, weeks: 10, description: 'State-of-the-art audiovisual experience.', benefit: 'Improves fan interest and home court advantage.' },
        { level: 5, name: 'New Downtown Arena', cost: 50000000, weeks: 52, description: 'A brand new, world-class facility.', benefit: 'Massive boost to all revenue and recruiting.' }
    ],
    Training: [
        { level: 2, name: 'Weight Room Upgrade', cost: 500000, weeks: 8, description: 'New racks and free weights.', benefit: 'Slightly improves player strength development.' },
        { level: 3, name: 'Performance Center', cost: 2000000, weeks: 16, description: 'Dedicated cardio and plyometric areas.', benefit: 'Improves player speed and stamina development.' },
        { level: 4, name: 'Recovery Lab', cost: 4000000, weeks: 12, description: 'Cryotherapy and hydrotherapy pools.', benefit: 'Reduces injury risk and fatigue.' },
        { level: 5, name: 'Elite Training Complex', cost: 15000000, weeks: 30, description: 'All-in-one athlete development hub.', benefit: 'Maximizes potential realization for all players.' }
    ],
    Medical: [
        { level: 2, name: 'Clinic Renovation', cost: 250000, weeks: 6, description: 'Modernize the team clinic.', benefit: 'Slightly faster injury recovery.' },
        { level: 3, name: 'Rehab Center', cost: 1000000, weeks: 12, description: 'Specialized equipment for rehabilitation.', benefit: 'Significantly reduces recovery time.' },
        { level: 4, name: 'Sports Science Wing', cost: 3000000, weeks: 16, description: 'Advanced biometrics and monitoring.', benefit: 'Prevents injuries before they happen.' },
        { level: 5, name: 'World-Class Hospital Partnership', cost: 10000000, weeks: 24, description: 'Direct access to top specialists.', benefit: 'Best possible care for all players.' }
    ],
    Scouting: [
        { level: 2, name: 'Scouting Office', cost: 100000, weeks: 4, description: 'Dedicated space for film study.', benefit: 'Unlocks basic recruit info faster.' },
        { level: 3, name: 'Regional Network', cost: 500000, weeks: 8, description: 'Hiring local bird-dogs in key states.', benefit: 'Improves pipeline state recruiting.' },
        { level: 4, name: 'Analytics Department', cost: 1500000, weeks: 12, description: 'Data-driven prospect analysis.', benefit: 'Reveals hidden gems and busts.' },
        { level: 5, name: 'Global Scouting Network', cost: 5000000, weeks: 20, description: 'Scouts on every continent.', benefit: 'Unlocks international prospects.' }
    ],
    Coaching: [
        { level: 2, name: 'Film Room', cost: 150000, weeks: 6, description: 'Better projector and seating.', benefit: 'Improves game preparation.' },
        { level: 3, name: 'Coaching Offices', cost: 750000, weeks: 10, description: 'Private offices for assistants.', benefit: 'Helps retain quality staff.' },
        { level: 4, name: 'War Room', cost: 2000000, weeks: 14, description: 'High-tech strategy center.', benefit: 'Boosts in-game coaching bonuses.' },
        { level: 5, name: 'Hall of Fame Lobby', cost: 6000000, weeks: 18, description: 'Showcase of team history.', benefit: 'Boosts prestige and recruiting.' }
    ],
    Academic: [
        { level: 2, name: 'Study Hall', cost: 250000, weeks: 6, description: 'Dedicated quiet space for athletes.', benefit: 'Slightly improves team GPA.' },
        { level: 3, name: 'Tutoring Center', cost: 1000000, weeks: 12, description: 'Private tutors for every subject.', benefit: 'Significantly improves team GPA and eligibility.' },
        { level: 4, name: 'Computer Lab', cost: 2500000, weeks: 10, description: 'State-of-the-art tech for students.', benefit: 'Boosts "Academic" recruit interest.' },
        { level: 5, name: 'Academic Excellence Center', cost: 8000000, weeks: 24, description: 'A monument to student-athlete success.', benefit: 'Massive boost to Academic prestige.' }
    ],
    Nutrition: [
        { level: 2, name: 'Team Cafeteria', cost: 300000, weeks: 8, description: 'Healthy meals on site.', benefit: 'Slightly improves stamina recovery.' },
        { level: 3, name: 'Dietitian Office', cost: 1200000, weeks: 12, description: 'Personalized meal plans.', benefit: 'Improves physical development speed.' },
        { level: 4, name: 'Fueling Station', cost: 3000000, weeks: 10, description: '24/7 access to supplements and snacks.', benefit: 'Reduces fatigue accumulation.' },
        { level: 5, name: 'Gourmet Dining Hall', cost: 10000000, weeks: 20, description: '5-star chefs preparing every meal.', benefit: 'Major boost to recruiting and morale.' }
    ],
    Housing: [
        { level: 2, name: 'Updated Dorms', cost: 1000000, weeks: 12, description: 'Modern furniture and amenities.', benefit: 'Slightly improves player morale.' },
        { level: 3, name: 'Athlete Village', cost: 5000000, weeks: 24, description: 'Exclusive housing for athletes.', benefit: 'Boosts team chemistry and morale.' },
        { level: 4, name: 'Luxury Apartments', cost: 12000000, weeks: 36, description: 'Private apartments near campus.', benefit: 'Boosts "Bag Chaser" recruit interest.' },
        { level: 5, name: 'The Lodge', cost: 25000000, weeks: 52, description: 'Resort-style living for the team.', benefit: 'Massive boost to all recruiting.' }
    ]
};

export const TRAVEL_FATIGUE_PENALTIES = {
    Bus: 0.05,        // 5% penalty
    Commercial: 0.03, // 3% penalty
    Charter: 0.01     // 1% penalty
};

export const HOME_COURT_BASE_BONUS = 5; // Base rating points added to home team

export const ACTIVE_NBA_ALUMNI_COUNTS: { [school: string]: number } = {
    "Kentucky": 29,
    "Duke": 24,
    "UCLA": 14,
    "North Carolina": 14,
    "USC": 13,
    "Florida State": 13,
    "Michigan": 13,
    "Texas": 11,
    "Villanova": 11,
    "LSU": 9,
    "Kansas": 9,
    "Arizona": 9,
    "Gonzaga": 9,
    "Arkansas": 8,
    "Washington": 8,
    "Tennessee": 8,
    "Baylor": 7,
    "Michigan State": 7,
    "Virginia": 7,
    "Ohio State": 6,
    "Alabama": 6,
    "Illinois": 6,
    "Marquette": 6,
    "Colorado": 5,
    "Oregon": 5,
    "Wake Forest": 5,
    "Iowa State": 5,
    "Indiana": 5,
    "Texas A&M": 5,
    "UConn": 5,
    "Georgia Tech": 5,
    "Stanford": 5,
    "Missouri": 5,
    "Creighton": 4,
    "Houston": 4,
    "Auburn": 4,
    "Purdue": 4,
    "Maryland": 4,
    "Providence": 4,
    "Syracuse": 4,
    "Oklahoma": 4,
    "Utah": 4,
    "Xavier": 4,
    "Georgetown": 3,
    "Memphis": 3,
    "Miami": 3,
    "Florida": 3,
    "Dayton": 3,
    "Nevada": 3,
    "San Diego State": 3,
    "Saint Mary's": 3,
    "VCU": 3,
    "Cincinnati": 3,
    "Pittsburgh": 3,
    "West Virginia": 3,
    "Wisconsin": 3,
    "Seton Hall": 3,
    "St. John's": 3,
    "Temple": 3,
    "UCF": 3,
    "UNLV": 3,
    "Utah State": 3,
    "Wichita State": 3
};

export const NBA_ACRONYM_TO_NAME: Record<string, string> = {
    "ATL": "Atlanta Hawks",
    "BOS": "Boston Celtics",
    "BRK": "Brooklyn Nets",
    "BKN": "Brooklyn Nets",
    "CHA": "Charlotte Hornets",
    "CHO": "Charlotte Hornets",
    "CHI": "Chicago Bulls",
    "CLE": "Cleveland Cavaliers",
    "DAL": "Dallas Mavericks",
    "DEN": "Denver Nuggets",
    "DET": "Detroit Pistons",
    "GSW": "Golden State Warriors",
    "HOU": "Houston Rockets",
    "IND": "Indiana Pacers",
    "LAC": "LA Clippers",
    "LAL": "Los Angeles Lakers",
    "MEM": "Memphis Grizzlies",
    "MIA": "Miami Heat",
    "MIL": "Milwaukee Bucks",
    "MIN": "Minnesota Timberwolves",
    "NOP": "New Orleans Pelicans",
    "NOH": "New Orleans Pelicans",
    "NOK": "New Orleans Pelicans",
    "NYK": "New York Knicks",
    "OKC": "Oklahoma City Thunder",
    "ORL": "Orlando Magic",
    "PHI": "Philadelphia 76ers",
    "PHX": "Phoenix Suns",
    "PHO": "Phoenix Suns",
    "POR": "Portland Trail Blazers",
    "SAC": "Sacramento Kings",
    "SAS": "San Antonio Spurs",
    "TOR": "Toronto Raptors",
    "UTA": "Utah Jazz",
    "WAS": "Washington Wizards",
    "WSB": "Washington Wizards",
};

export const NBA_NAME_TO_ACRONYM: Record<string, string> = Object.entries(NBA_ACRONYM_TO_NAME).reduce((acc, [abbr, name]) => {
    acc[name] = abbr;
    return acc;
}, {} as Record<string, string>);
