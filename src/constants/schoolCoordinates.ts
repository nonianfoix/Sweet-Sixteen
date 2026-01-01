export const SCHOOL_LOCATIONS: Record<string, { lat: number; lon: number }> = {
    // Power 5 - ACC
    'Boston College': { lat: 42.3355, lon: -71.1685 },
    'California': { lat: 37.8719, lon: -122.2585 },
    'Clemson': { lat: 34.6751, lon: -82.8407 },
    'Duke': { lat: 36.0014, lon: -78.9382 },
    'Florida State': { lat: 30.4419, lon: -84.2985 },
    'Georgia Tech': { lat: 33.7756, lon: -84.3963 },
    'Louisville': { lat: 38.2173, lon: -85.7593 },
    'Miami': { lat: 25.7174, lon: -80.2778 },
    'NC State': { lat: 35.7847, lon: -78.6821 },
    'North Carolina': { lat: 35.9049, lon: -79.0469 },
    'Notre Dame': { lat: 41.7056, lon: -86.2353 },
    'Pittsburgh': { lat: 40.4442, lon: -79.9532 },
    'SMU': { lat: 32.8412, lon: -96.7845 },
    'Stanford': { lat: 37.4275, lon: -122.1697 },
    'Syracuse': { lat: 43.0392, lon: -76.1351 },
    'Virginia': { lat: 38.0336, lon: -78.5080 },
    'Virginia Tech': { lat: 37.2284, lon: -80.4234 },
    'Wake Forest': { lat: 36.1347, lon: -80.2762 },

    // Power 5 - Big 12
    'Arizona': { lat: 32.2281, lon: -110.9265 },
    'Arizona State': { lat: 33.4242, lon: -111.9281 },
    'Baylor': { lat: 31.5493, lon: -97.1141 },
    'BYU': { lat: 40.2518, lon: -111.6493 },
    'Cincinnati': { lat: 39.1329, lon: -84.5150 },
    'Colorado': { lat: 40.0076, lon: -105.2659 },
    'Houston': { lat: 29.7199, lon: -95.3422 },
    'Iowa State': { lat: 42.0266, lon: -93.6465 },
    'Kansas': { lat: 38.9543, lon: -95.2558 },
    'Kansas State': { lat: 39.1974, lon: -96.5847 },
    'Oklahoma State': { lat: 36.1215, lon: -97.0622 },
    'TCU': { lat: 32.7095, lon: -97.3627 },
    'Texas Tech': { lat: 33.5843, lon: -101.8783 },
    'UCF': { lat: 28.6024, lon: -81.2001 },
    'Utah': { lat: 40.7649, lon: -111.8421 },
    'West Virginia': { lat: 39.6504, lon: -79.9659 },

    // Power 5 - Big Ten
    'Illinois': { lat: 40.1020, lon: -88.2272 },
    'Indiana': { lat: 39.1766, lon: -86.5130 },
    'Iowa': { lat: 41.6627, lon: -91.5549 },
    'Maryland': { lat: 38.9869, lon: -76.9426 },
    'Michigan': { lat: 42.2780, lon: -83.7382 },
    'Michigan State': { lat: 42.7018, lon: -84.4822 },
    'Minnesota': { lat: 44.9740, lon: -93.2277 },
    'Nebraska': { lat: 40.8202, lon: -96.7005 },
    'Northwestern': { lat: 42.0560, lon: -87.6753 },
    'Ohio State': { lat: 40.0067, lon: -83.0305 },
    'Oregon': { lat: 44.0448, lon: -123.0726 },
    'Penn State': { lat: 40.7982, lon: -77.8599 },
    'Purdue': { lat: 40.4237, lon: -86.9212 },
    'Rutgers': { lat: 40.5008, lon: -74.4474 },
    'UCLA': { lat: 34.0689, lon: -118.4452 },
    'USC': { lat: 34.0224, lon: -118.2851 },
    'Washington': { lat: 47.6553, lon: -122.3035 },
    'Wisconsin': { lat: 43.0766, lon: -89.4125 },

    // Power 5 - SEC
    'Alabama': { lat: 33.2140, lon: -87.5391 },
    'Arkansas': { lat: 36.0687, lon: -94.1748 },
    'Auburn': { lat: 32.6010, lon: -85.4913 },
    'Florida': { lat: 29.6465, lon: -82.3533 },
    'Georgia': { lat: 33.9480, lon: -83.3773 },
    'Kentucky': { lat: 38.0307, lon: -84.5040 },
    'LSU': { lat: 30.4133, lon: -91.1800 },
    'Mississippi State': { lat: 33.4542, lon: -88.7893 },
    'Missouri': { lat: 38.9404, lon: -92.3277 },
    'Oklahoma': { lat: 35.2059, lon: -97.4457 },
    'Ole Miss': { lat: 34.3647, lon: -89.5392 },
    'South Carolina': { lat: 33.9997, lon: -81.0336 },
    'Tennessee': { lat: 35.9544, lon: -83.9295 },
    'Texas': { lat: 30.2849, lon: -97.7341 },
    'Texas A&M': { lat: 30.6187, lon: -96.3365 },
    'Vanderbilt': { lat: 36.1447, lon: -86.8027 },

    // Big East
    'Butler': { lat: 39.8410, lon: -86.1719 },
    'Creighton': { lat: 41.2647, lon: -95.9463 },
    'DePaul': { lat: 41.9236, lon: -87.6534 },
    'Georgetown': { lat: 38.9079, lon: -77.0728 },
    'Marquette': { lat: 43.0385, lon: -87.9287 },
    'Providence': { lat: 41.8447, lon: -71.4286 },
    'Seton Hall': { lat: 40.7431, lon: -74.2486 },
    'St. John\'s': { lat: 40.7208, lon: -73.7949 },
    'UConn': { lat: 41.8077, lon: -72.2540 },
    'Villanova': { lat: 40.0374, lon: -75.3431 },
    'Xavier': { lat: 39.1491, lon: -84.4754 },

    // Pac-12 (Remaining)
    'Oregon State': { lat: 44.5638, lon: -123.2794 },
    'Washington State': { lat: 46.7319, lon: -117.1542 },

    // Ivy League
    'Brown': { lat: 41.8268, lon: -71.4025 },
    'Columbia': { lat: 40.8075, lon: -73.9626 },
    'Cornell': { lat: 42.4534, lon: -76.4735 },
    'Dartmouth': { lat: 43.7022, lon: -72.2896 },
    'Harvard': { lat: 42.3770, lon: -71.1167 },
    'Penn': { lat: 39.9522, lon: -75.1932 },
    'Princeton': { lat: 40.3440, lon: -74.6514 },
    'Yale': { lat: 41.3163, lon: -72.9223 },

    // Notable Others / Mid-Majors
    'Gonzaga': { lat: 47.6669, lon: -117.4026 },
    'San Diego State': { lat: 32.7749, lon: -117.0728 },
    'Memphis': { lat: 35.1189, lon: -89.9392 },

    'Saint Mary\'s': { lat: 37.8420, lon: -122.1102 },
    'Boise State': { lat: 43.6027, lon: -116.2023 },
    'Colorado State': { lat: 40.5701, lon: -105.0870 },
    'UNLV': { lat: 36.1075, lon: -115.1430 },
    'Utah State': { lat: 41.7452, lon: -111.8097 },
    'Nevada': { lat: 39.5440, lon: -119.8164 },
    'New Mexico': { lat: 35.0844, lon: -106.6198 },

    'Wichita State': { lat: 37.7188, lon: -97.2952 },
    'Temple': { lat: 39.9812, lon: -75.1554 },
    'Tulane': { lat: 29.9355, lon: -90.1227 },
    'South Florida': { lat: 28.0587, lon: -82.4139 },
    'Florida Atlantic': { lat: 26.3752, lon: -80.1017 },

    'Grand Canyon': { lat: 33.5135, lon: -112.1287 },

    // A few more localized for density
    'Boston University': { lat: 42.3496, lon: -71.1069 },
    'Buffalo': { lat: 42.9996, lon: -78.7884 },
    'Charlotte': { lat: 35.3071, lon: -80.7352 },

    // NYC / Metro Area (Missing)
    'Stony Brook': { lat: 40.9126, lon: -73.1234 },
    'Hofstra': { lat: 40.7145, lon: -73.6004 },
    'Iona': { lat: 40.9234, lon: -73.7846 },
    'Manhattan': { lat: 40.8895, lon: -73.9015 },
    'Wagner': { lat: 40.6154, lon: -74.0940 },
    'LIU': { lat: 40.6913, lon: -73.9808 },
    'Monmouth': { lat: 40.2796, lon: -74.0051 },
    'Rider': { lat: 40.2815, lon: -74.7397 },
    'Marist': { lat: 41.7231, lon: -73.9344 },
    'Siena': { lat: 42.7184, lon: -73.7537 },
    
    // WCC Schools (Missing)
    'San Francisco': { lat: 37.7765, lon: -122.4506 }, // USF campus
    'Santa Clara': { lat: 37.3496, lon: -121.9390 },
    'San Diego': { lat: 32.7719, lon: -117.1871 },
    'Pepperdine': { lat: 34.0360, lon: -118.7110 },
    'Portland': { lat: 45.5715, lon: -122.7274 },
    'Pacific': { lat: 37.9816, lon: -121.3108 }, // Stockton, CA
    'Loyola Marymount': { lat: 33.9693, lon: -118.4184 },
    'Seattle': { lat: 47.6076, lon: -122.3174 },
    
    // California Schools (Missing)
    'Fresno State': { lat: 36.8121, lon: -119.7458 },
    'San Jose State': { lat: 37.3382, lon: -121.8863 },
    'Long Beach State': { lat: 33.7838, lon: -118.1141 },
    'Cal State Fullerton': { lat: 33.8829, lon: -117.8869 },
    'Cal State Northridge': { lat: 34.2411, lon: -118.5287 },
    'UC Davis': { lat: 38.5382, lon: -121.7617 },
    'UC Irvine': { lat: 33.6405, lon: -117.8443 },
    'UC Riverside': { lat: 33.9737, lon: -117.3281 },
    'UC Santa Barbara': { lat: 34.4140, lon: -119.8489 },
    'Sacramento State': { lat: 38.5616, lon: -121.4240 },
    
    // Texas Schools (Missing)
    'Rice': { lat: 29.7174, lon: -95.4018 },
    'North Texas': { lat: 33.2148, lon: -97.1331 },
    'UTSA': { lat: 29.5821, lon: -98.6197 },

    'UT Martin': { lat: 36.3423, lon: -88.8525 },
    'Sam Houston State': { lat: 30.7149, lon: -95.5469 },
    'Stephen F. Austin': { lat: 31.6178, lon: -94.6584 },
    
    // Other Missing Schools
    'Hawaii': { lat: 21.2969, lon: -157.8171 },
    'Alaska Anchorage': { lat: 61.1903, lon: -149.8206 },

    'Belmont': { lat: 36.1327, lon: -86.7935 },
    'Murray State': { lat: 36.6161, lon: -88.3141 },
    'Morehead State': { lat: 38.1878, lon: -83.4322 },
    'Eastern Kentucky': { lat: 37.7494, lon: -84.2943 },

    'Chattanooga': { lat: 35.0456, lon: -85.3097 },
    'Furman': { lat: 34.9254, lon: -82.4377 },
    'Samford': { lat: 33.4640, lon: -86.7924 },
    'Mercer': { lat: 32.8281, lon: -83.6522 },
    'Davidson': { lat: 35.5002, lon: -80.8428 },
    'Elon': { lat: 36.1026, lon: -79.5063 },
    'UNC Wilmington': { lat: 34.2252, lon: -77.8730 },
    'UNC Greensboro': { lat: 36.0687, lon: -79.8100 },

    'Tulsa': { lat: 36.1500, lon: -95.9444 },
    'UAB': { lat: 33.5024, lon: -86.8063 },

    'North Florida': { lat: 30.2699, lon: -81.5068 },
    'Jacksonville': { lat: 30.3507, lon: -81.6024 },
    'Stetson': { lat: 29.0348, lon: -81.3029 },
    'FGCU': { lat: 26.4651, lon: -81.7769 },
    'Kennesaw State': { lat: 34.0364, lon: -84.5825 },

    'Omaha': { lat: 41.2488, lon: -96.0102 },
    'Oral Roberts': { lat: 36.0597, lon: -95.9483 },
    'Northern Iowa': { lat: 42.5147, lon: -92.4646 },

    'Evansville': { lat: 37.9747, lon: -87.5578 },
    'Bradley': { lat: 40.6984, lon: -89.6146 },
    'UIC': { lat: 41.8706, lon: -87.6472 },
    'Green Bay': { lat: 44.5298, lon: -88.0103 },
    'Milwaukee': { lat: 43.0756, lon: -87.8813 },
    'Youngstown State': { lat: 41.1067, lon: -80.6529 },
    'Robert Morris': { lat: 40.5088, lon: -80.1659 },

    'Drexel': { lat: 39.9566, lon: -75.1899 },
    'Delaware': { lat: 39.6780, lon: -75.7506 },
    'Towson': { lat: 39.3945, lon: -76.6185 },
    'UMBC': { lat: 39.2556, lon: -76.7119 },
    'Navy': { lat: 38.9832, lon: -76.4884 },
    'Colgate': { lat: 42.8159, lon: -75.5367 },
    'Bucknell': { lat: 40.9547, lon: -76.8847 },
    'Lehigh': { lat: 40.6020, lon: -75.3792 },
    'Lafayette': { lat: 40.6970, lon: -75.2116 },
    'Holy Cross': { lat: 42.2369, lon: -71.8076 },
    'Northeastern': { lat: 42.3398, lon: -71.0892 },
    'Maine': { lat: 44.9021, lon: -68.6713 },
    'New Hampshire': { lat: 43.1339, lon: -70.9264 },
    'Vermont': { lat: 44.4780, lon: -73.1957 },
    'Albany': { lat: 42.6864, lon: -73.8229 },
    'Binghamton': { lat: 42.0898, lon: -75.9698 },
    'Hartford': { lat: 41.8069, lon: -72.2519 },
    'UMass Lowell': { lat: 42.6558, lon: -71.3267 },
    'Central Connecticut State': { lat: 41.6837, lon: -72.7795 },
    'Fairleigh Dickinson': { lat: 40.8550, lon: -74.0159 },
    'NJIT': { lat: 40.7423, lon: -74.1780 },

    // HBCUs
    'Alabama A&M': { lat: 34.7837, lon: -86.5686 },
    'Alabama State': { lat: 32.3638, lon: -86.2953 },
    'Jackson State': { lat: 32.2936, lon: -90.2108 },
    'Southern': { lat: 30.5235, lon: -91.1911 },
    'Grambling State': { lat: 32.5247, lon: -92.7133 },
    'Prairie View A&M': { lat: 30.0884, lon: -95.9891 },
    'Texas Southern': { lat: 29.7193, lon: -95.3593 },
    'Alcorn State': { lat: 31.8794, lon: -91.0528 },
    'Mississippi Valley State': { lat: 33.5053, lon: -90.3056 },
    'Arkansas-Pine Bluff': { lat: 34.2288, lon: -92.0001 },
    'Florida A&M': { lat: 30.4261, lon: -84.2918 },
    'Bethune-Cookman': { lat: 29.1963, lon: -81.0408 },
    'Howard': { lat: 38.9228, lon: -77.0171 },
    'Morgan State': { lat: 39.3453, lon: -76.5827 },
    'Coppin State': { lat: 39.3424, lon: -76.6566 },
    'Delaware State': { lat: 39.1853, lon: -75.5285 },
    'Maryland Eastern Shore': { lat: 38.7891, lon: -75.6016 },
    'Norfolk State': { lat: 36.8476, lon: -76.2705 },
    'North Carolina A&T': { lat: 36.0706, lon: -79.7738 },
    'North Carolina Central': { lat: 35.9748, lon: -78.8988 },
    'South Carolina State': { lat: 33.4958, lon: -80.8498 },
    'Hampton': { lat: 37.0204, lon: -76.3349 },
    'Tennessee State': { lat: 36.1677, lon: -86.8356 },
    
    // MAC Conference
    'Ball State': { lat: 40.2098, lon: -85.4063 }, // Muncie, IN
    'Ohio': { lat: 39.3231, lon: -82.1012 }, // Athens, OH
    'Bowling Green': { lat: 41.3808, lon: -83.6421 },
    'Kent State': { lat: 41.1492, lon: -81.3416 },
    'Miami (OH)': { lat: 39.5089, lon: -84.7345 }, // Oxford, OH
    'Toledo': { lat: 41.6587, lon: -83.6145 },
    'Akron': { lat: 41.0757, lon: -81.5126 },
    'Western Michigan': { lat: 42.2841, lon: -85.6173 }, // Kalamazoo
    'Eastern Michigan': { lat: 42.2498, lon: -83.6239 }, // Ypsilanti
    'Central Michigan': { lat: 43.5920, lon: -84.7732 }, // Mount Pleasant
    'Northern Illinois': { lat: 41.9352, lon: -88.7739 }, // DeKalb
    
    // MVC (Missouri Valley)
    'Drake': { lat: 41.6005, lon: -93.6527 },
    'Loyola Chicago': { lat: 41.9994, lon: -87.6566 },
    'Valparaiso': { lat: 41.4625, lon: -87.0621 },
    'Missouri State': { lat: 37.2090, lon: -93.2837 },
    'UNI': { lat: 42.5147, lon: -92.4646 }, // Cedar Falls
    'Southern Illinois': { lat: 37.7083, lon: -89.2193 },
    'Illinois State': { lat: 40.5115, lon: -88.9905 },
    'Indiana State': { lat: 39.4683, lon: -87.4123 },
    
    // Horizon League
    'Wright State': { lat: 39.7839, lon: -84.0614 },
    'Cleveland State': { lat: 41.5023, lon: -81.6749 },
    'Oakland': { lat: 42.6735, lon: -83.2181 }, // Rochester, MI
    'Detroit Mercy': { lat: 42.4188, lon: -83.1410 },
    'IUPUI': { lat: 39.7744, lon: -86.1753 },
    'PFW': { lat: 41.1183, lon: -85.1086 }, // Purdue Fort Wayne
    
    // Summit League
    'South Dakota': { lat: 42.8906, lon: -96.9304 },
    'South Dakota State': { lat: 44.3184, lon: -96.7891 },
    'North Dakota': { lat: 47.9188, lon: -97.0790 },
    'North Dakota State': { lat: 46.8970, lon: -96.8011 },
    'Denver': { lat: 39.6780, lon: -104.9619 },
    'St. Thomas': { lat: 44.9420, lon: -93.1921 },
    
    // A-10
    'Dayton': { lat: 39.7402, lon: -84.1783 },
    'VCU': { lat: 37.5485, lon: -77.4533 },
    'Richmond': { lat: 37.5733, lon: -77.5395 },
    'Saint Louis': { lat: 38.6378, lon: -90.2340 },
    'George Mason': { lat: 38.8316, lon: -77.3081 },
    'George Washington': { lat: 38.9007, lon: -77.0492 },
    'Fordham': { lat: 40.8622, lon: -73.8857 },
    'Duquesne': { lat: 40.4359, lon: -79.9952 },
    'La Salle': { lat: 40.0382, lon: -75.1561 },
    'Saint Joseph\'s': { lat: 40.0038, lon: -75.2350 },
    'Massachusetts': { lat: 42.3912, lon: -72.5267 },
    'Rhode Island': { lat: 41.4831, lon: -71.5285 },
    'Loyola Maryland': { lat: 39.3505, lon: -76.6240 },
    
    // C-USA
    'FAU': { lat: 26.3731, lon: -80.1010 },
    'FIU': { lat: 25.7559, lon: -80.3755 },
    'Western Kentucky': { lat: 36.9859, lon: -86.4541 },
    'Middle Tennessee': { lat: 35.8491, lon: -86.3688 },
    'UTEP': { lat: 31.7706, lon: -106.5044 },
    'Louisiana Tech': { lat: 32.5291, lon: -92.6434 },
    'New Mexico State': { lat: 32.2830, lon: -106.7510 },
    'Liberty': { lat: 37.3523, lon: -79.1796 },
    'Jacksonville State': { lat: 33.8199, lon: -85.7659 },
    'Sam Houston': { lat: 30.7149, lon: -95.5469 },
    
    // Sun Belt
    'Appalachian State': { lat: 36.2146, lon: -81.6848 },
    'Coastal Carolina': { lat: 33.7935, lon: -79.0188 },
    'Georgia State': { lat: 33.7531, lon: -84.3865 },
    'Georgia Southern': { lat: 32.4221, lon: -81.7840 },
    'Texas State': { lat: 29.8884, lon: -97.9384 },
    'Louisiana': { lat: 30.2099, lon: -92.0198 }, // UL Lafayette
    'South Alabama': { lat: 30.6965, lon: -88.1739 },
    'Arkansas State': { lat: 35.8421, lon: -90.6768 },
    'Texas-Arlington': { lat: 32.7299, lon: -97.1134 },
    'UT Arlington': { lat: 32.7299, lon: -97.1134 },
    'Little Rock': { lat: 34.7239, lon: -92.3504 },
    'ULM': { lat: 32.5260, lon: -92.0763 }, // Monroe
    'Troy': { lat: 31.8000, lon: -85.9631 },
    'Southern Miss': { lat: 31.3282, lon: -89.3306 },
    'Marshall': { lat: 38.4238, lon: -82.4280 },
    'James Madison': { lat: 38.4367, lon: -78.8747 },
    'Old Dominion': { lat: 36.8853, lon: -76.3059 },
};

export const BASKETBALL_HUBS: Record<string, { lat: number; lon: number; city: string; state: string }> = {
    'NYC': { lat: 40.7128, lon: -74.0060, city: 'New York', state: 'NY' },
    'LA': { lat: 34.0522, lon: -118.2437, city: 'Los Angeles', state: 'CA' },
    'CHI': { lat: 41.8781, lon: -87.6298, city: 'Chicago', state: 'IL' },
    'ATL': { lat: 33.7490, lon: -84.3880, city: 'Atlanta', state: 'GA' },
    'DMV': { lat: 38.9072, lon: -77.0369, city: 'Washington', state: 'DC' },
    'DFW': { lat: 32.7767, lon: -96.7970, city: 'Dallas', state: 'TX' },
    'HOU': { lat: 29.7604, lon: -95.3698, city: 'Houston', state: 'TX' },
    'PHI': { lat: 39.9526, lon: -75.1652, city: 'Philadelphia', state: 'PA' },
    'SEA': { lat: 47.6062, lon: -122.3321, city: 'Seattle', state: 'WA' },
    'MIA': { lat: 25.7617, lon: -80.1918, city: 'Miami', state: 'FL' },
};
