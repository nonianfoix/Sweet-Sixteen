/**
 * Culturally-Aware Player Name Generation System
 * 
 * Basketball demographics: ~70% Black players in NCAA basketball
 * This system generates realistic name combinations that reflect actual demographics
 * while avoiding famous player names that would break immersion.
 */

// ============================================================================
// FIRST NAMES - Categorized by cultural affinity
// ============================================================================

/**
 * First names with Black cultural association
 * These should NOT be paired with stereotypically "white" surnames
 * (but most surnames are culturally neutral)
 */
export const BLACK_FIRST_NAMES = [
    // Classic/Traditional
    "Darius", "DeShawn", "Jamal", "Malik", "Tyrone", "Terrell", "Lamar", "Cedric",
    "Darnell", "Rashad", "Terrence", "Maurice", "Reginald", "Leroy", "Tyree",
    // Modern/Contemporary
    "DeAndre", "Jaylen", "Jalen", "Davon", "Javon", "Kyree", "Marquise", "Devonte",
    "Kentrell", "Keontae", "Tariq", "Amir", "Jabari", "Khalil", "Rasheed",
    "Trayvon", "DaQuan", "Jemarco", "Montez", "Quincy", "Kamari",
    // Tre/Trey variants
    "Tre", "Trey", "Tremaine", "Travon",
    // D-prefix names
    "Demetrius", "Deon", "Desmond", "Devin", "Devon", "Donovan", "Dante",
    // J-names
    "Jaquan", "Jaheim", "Javonte", "Jaylon", "Jelani", "Jermaine",
    // K-names
    "Kelvin", "Kendrick", "Keyshawn",
    // Other
    "Antoine", "LaRon", "Lamarcus", "Marquell",
    "Tavon", "Trevon", "Tyrell", "Courtney", "Corey",
];

/**
 * Cross-cultural first names that work with any last name
 * These are common in both Black and white communities
 */
export const CROSS_CULTURAL_FIRST_NAMES = [
    // Classic names that cross demographics
    "Marcus", "Michael", "James", "Chris", "Anthony", "David", "Robert", "Charles",
    "Richard", "William", "Thomas", "Daniel", "Paul", "Mark", "Steven", "Kevin",
    "Brian", "Eric", "Jason", "Justin", "Brandon", "Ryan", "Tyler", "Jordan",
    // Modern crossover names
    "Cameron", "Jayson", "Derrick", "Grant", "Collin", "Trent", "Zach", "Matt",
    "Austin", "Blake", "Cody", "Dylan", "Ethan", "Evan", "Logan", "Mason",
    "Noah", "Owen", "Caleb", "Isaac", "Elijah", "Isaiah", "Josiah",
    // Two-letter/nickname style
    "RJ", "AJ", "DJ", "CJ", "JJ", "TJ", "PJ",
    // Other modern names
    "Cade", "Jett", "Cole", "Chase", "Garrett", "Trevor", "Mitchell", "Hunter",
    "Spencer", "Tristan", "Nate", "Nick", "Luke", "Jake", "Drew", "Kyle",
    // Names that work both ways
    "Jerome", "Marvin", "Calvin", "Melvin", "Vernon", "Carlton", "Carlton",
    "Andre", "Adrian", "Victor", "Oscar", "Mario", "Sergio", "Javier", "Juan",
    "Carlos", "Ricardo", "Antonio", "Julian", "Julius", "Xavier",
];

// ============================================================================
// LAST NAMES - Universal pool (work with all first names)
// ============================================================================

export const LAST_NAMES = [
    // Very common surnames (top 100 in US, especially among Black Americans)
    "Williams", "Johnson", "Brown", "Jones", "Davis", "Miller", "Wilson", "Moore",
    "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson",
    "Robinson", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young", "King",
    "Wright", "Scott", "Green", "Baker", "Hill", "Nelson", "Mitchell", "Carter",
    // Common Black surnames
    "Washington", "Jefferson", "Franklin", "Freeman", "Coleman", "Brooks", "Barnes",
    "Howard", "Jenkins", "Perry", "Russell", "Griffin", "Diggs", "Hayes", "Price",
    "Foster", "Butler", "Simmons", "Payne", "Gordon", "Dixon", "Hunt", "Watts",
    "Henderson", "Rhodes", "Stevens", "Porter", "Bates", "Bridges", "Rivers",
    // Athletic-sounding surnames
    "Strong", "Powers", "Battle", "Champion", "Rush", "Speed", "Quick", "Best",
    // Modern basketball-adjacent (but not famous)
    "Ivey", "Ball", "Cunningham", "Barrett", "Tate", "Knox", "Prince", "Booker",
    "Smart", "Holiday", "Beverly", "Randle", "Reaves", "Gates", "Bond", "Gentry",
    "McCollum", "Horford", "Middleton", "Beal",
    // Additional common surnames
    "Adams", "Alexander", "Armstrong", "Arnold", "Austin", "Bailey", "Banks", "Bell",
    "Bennett", "Berry", "Bishop", "Black", "Boyd", "Bradley", "Bryant", "Burke",
    "Burns", "Burton", "Byrd", "Calhoun", "Campbell", "Carpenter", "Carroll",
    "Chambers", "Chapman", "Cole", "Collins", "Cook", "Cooper", "Cox", "Craig",
    "Crawford", "Cross", "Cunningham", "Daniels", "Davidson", "Dawson", "Day", "Dean",
    "Douglas", "Duncan", "Dunn", "Edwards", "Elliott", "Ellis", "Evans", "Farmer",
    "Fields", "Fisher", "Fleming", "Fletcher", "Flowers", "Ford", "Fowler", "Fox",
    "Frazier", "Fuller", "Gardner", "Garrett", "George", "Gibson", "Gilbert", "Glover",
    "Graham", "Grant", "Graves", "Gray", "Greene", "Hale", "Hamilton", "Hardy",
    "Harper", "Harrison", "Hart", "Harvey", "Hawkins", "Hicks", "Holland", "Holmes",
    "Hopkins", "Howell", "Hubbard", "Hudson", "Hughes", "Hunter", "Ingram",
    "Jacobs", "James", "Jennings", "Jordan", "Kelly", "Kennedy", "Knight", "Lane",
    "Lawrence", "Lawson", "Lee", "Little", "Long", "Lucas", "Lynch", "Lyons", "Mack",
    "Malone", "Marshall", "Mason", "Matthews", "May", "McCoy", "McDaniel", "McDonald",
    "McKinney", "Miles", "Mills", "Montgomery", "Morgan", "Morris", "Morrison",
    "Morton", "Moss", "Mullins", "Murphy", "Murray", "Myers", "Nash", "Neal",
    "Newman", "Newton", "Nichols", "Norman", "Norris", "Norton", "Oliver", "Olson",
    "Owens", "Page", "Palmer", "Parker", "Parks", "Patterson", "Pearson", "Perkins",
    "Peters", "Peterson", "Phillips", "Pierce", "Powell", "Ramsey", "Ray", "Reed",
    "Reid", "Reynolds", "Rice", "Richards", "Richardson", "Riley", "Roberts",
    "Robertson", "Rodgers", "Rogers", "Rose", "Ross", "Rowe", "Sanders", "Saunders",
    "Shaw", "Shelton", "Sherman", "Simon", "Simpson", "Sims", "Singleton", "Smith",
    "Snyder", "Sparks", "Spencer", "Stephens", "Stewart", "Stone", "Stokes",
    "Strickland", "Sullivan", "Summers", "Sutton", "Terry", "Thornton", "Todd",
    "Townsend", "Tucker", "Turner", "Tyler", "Vaughan", "Wade", "Wagner", "Wallace",
    "Walters", "Walton", "Ward", "Warren", "Waters", "Watkins", "Watson", "Weaver",
    "Webb", "Webster", "Welch", "Wells", "West", "Wheeler", "Wiggins", "Wilcox",
    "Wilkerson", "Wilkins", "Wilkinson", "Williamson", "Willis", "Winters", "Wise",
    "Wood", "Woods", "Wyatt", "Yates",
];

// ============================================================================
// NAME GENERATION FUNCTIONS
// ============================================================================

/**
 * Pick a random element from an array
 */
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generate a realistic basketball player name
 * Uses demographic weighting: 70% Black-cultural first names, 30% cross-cultural
 */
export const generatePlayerName = (): string => {
    const useBlackFirstName = Math.random() < 0.70;
    
    const firstName = useBlackFirstName 
        ? pickRandom(BLACK_FIRST_NAMES)
        : pickRandom(CROSS_CULTURAL_FIRST_NAMES);
    
    const lastName = pickRandom(LAST_NAMES);
    
    return `${firstName} ${lastName}`;
};

/**
 * Generate a first name only (for when you need them separately)
 */
export const generateFirstName = (): string => {
    const useBlackFirstName = Math.random() < 0.70;
    return useBlackFirstName 
        ? pickRandom(BLACK_FIRST_NAMES)
        : pickRandom(CROSS_CULTURAL_FIRST_NAMES);
};

/**
 * Generate a last name only
 */
export const generateLastName = (): string => {
    return pickRandom(LAST_NAMES);
};

/**
 * Get all first names combined (for compatibility with existing code)
 */
export const getAllFirstNames = (): string[] => {
    return [...BLACK_FIRST_NAMES, ...CROSS_CULTURAL_FIRST_NAMES];
};

/**
 * Get all last names (for compatibility with existing code)
 */
export const getAllLastNames = (): string[] => {
    return LAST_NAMES;
};
