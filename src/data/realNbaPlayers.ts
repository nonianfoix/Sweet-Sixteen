
export interface RealNbaPlayer {
    name: string;
    team: string;
    position: string;
    height: string;
    weight: number;
    age: number;
    preDraftTeam: string;
    draftStatus: string;
    nationality: string;
    yos: number;
}

export const REAL_NBA_PLAYERS: Record<string, RealNbaPlayer[]> = {
    "Memphis": [
        {
            "name": "Precious Achiuwa",
            "team": "Sacramento Kings",
            "position": "SF",
            "height": "6-8",
            "weight": 243,
            "age": 26,
            "preDraftTeam": "Memphis",
            "draftStatus": "2020 Rnd 1 Pick 20",
            "nationality": "Nigeria",
            "yos": 5
        },
        {
            "name": "Moussa Cisse",
            "team": "Dallas Mavericks",
            "position": "F",
            "height": "6-11",
            "weight": 220,
            "age": 23,
            "preDraftTeam": "Memphis",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "Guinea",
            "yos": 0
        },
        {
            "name": "Jalen Duren",
            "team": "Detroit Pistons",
            "position": "PF",
            "height": "6-10",
            "weight": 250,
            "age": 22,
            "preDraftTeam": "Memphis",
            "draftStatus": "2022 Rnd 1 Pick 13",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "David Jones-Garcia",
            "team": "San Antonio Spurs",
            "position": "SF",
            "height": "6-4",
            "weight": 210,
            "age": 24,
            "preDraftTeam": "Memphis",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "Dominican Republic",
            "yos": 1
        },
        {
            "name": "Josh Minott",
            "team": "Boston Celtics",
            "position": "F",
            "height": "6-8",
            "weight": 205,
            "age": 23,
            "preDraftTeam": "Memphis",
            "draftStatus": "2022 Rnd 2 Pick 15",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Nae'qwan Tomlin",
            "team": "Cleveland Cavaliers",
            "position": "F",
            "height": "6-8",
            "weight": 210,
            "age": 24,
            "preDraftTeam": "Memphis",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Pittsburgh": [
        {
            "name": "Steven Adams",
            "team": "Houston Rockets",
            "position": "C",
            "height": "6-11",
            "weight": 265,
            "age": 32,
            "preDraftTeam": "Pittsburgh",
            "draftStatus": "2013 Rnd 1 Pick 12",
            "nationality": "New Zealand",
            "yos": 12
        },
        {
            "name": "Bub Carrington",
            "team": "Washington Wizards",
            "position": "G",
            "height": "6-4",
            "weight": 190,
            "age": 20,
            "preDraftTeam": "Pittsburgh",
            "draftStatus": "2024 Rnd 1 Pick 14",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Justin Champagnie",
            "team": "Washington Wizards",
            "position": "F",
            "height": "6-6",
            "weight": 206,
            "age": 24,
            "preDraftTeam": "Pittsburgh",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 4
        }
    ],
    "Kentucky": [
        {
            "name": "Bam Adebayo",
            "team": "Miami Heat",
            "position": "C",
            "height": "6-9",
            "weight": 255,
            "age": 28,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2017 Rnd 1 Pick 14",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Devin Booker",
            "team": "Phoenix Suns",
            "position": "SG",
            "height": "6-5",
            "weight": 206,
            "age": 29,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2015 Rnd 1 Pick 13",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Koby Brea",
            "team": "Phoenix Suns",
            "position": "GF",
            "height": "6-5",
            "weight": 215,
            "age": 23,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2025 Rnd 2 Pick 11",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Anthony Davis",
            "team": "Dallas Mavericks",
            "position": "PF",
            "height": "6-10",
            "weight": 253,
            "age": 32,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2012 Rnd 1 Pick 1",
            "nationality": "United States",
            "yos": 13
        },
        {
            "name": "Rob Dillingham",
            "team": "Minnesota Timberwolves",
            "position": "G",
            "height": "6-2",
            "weight": 175,
            "age": 20,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2024 Rnd 1 Pick 8",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Justin Edwards",
            "team": "Philadelphia Sixers",
            "position": "SF",
            "height": "6-7",
            "weight": 203,
            "age": 21,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "De'Aaron Fox",
            "team": "San Antonio Spurs",
            "position": "PG",
            "height": "6-3",
            "weight": 185,
            "age": 27,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2017 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Shai Gilgeous-Alexander",
            "team": "Oklahoma City Thunder",
            "position": "PG",
            "height": "6-6",
            "weight": 195,
            "age": 27,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2018 Rnd 1 Pick 11",
            "nationality": "Canada",
            "yos": 7
        },
        {
            "name": "Tyler Herro",
            "team": "Miami Heat",
            "position": "SG",
            "height": "6-5",
            "weight": 195,
            "age": 25,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2019 Rnd 1 Pick 13",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Isaiah Jackson",
            "team": "Indiana Pacers",
            "position": "PF",
            "height": "6-8",
            "weight": 205,
            "age": 23,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2021 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Keldon Johnson",
            "team": "San Antonio Spurs",
            "position": "SF",
            "height": "6-6",
            "weight": 220,
            "age": 26,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2019 Rnd 1 Pick 29",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Chris Livingston",
            "team": "Cleveland Cavaliers",
            "position": "F",
            "height": "6-6",
            "weight": 220,
            "age": 22,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2023 Rnd 2 Pick 28",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Tyrese Maxey",
            "team": "Philadelphia Sixers",
            "position": "PG",
            "height": "6-2",
            "weight": 200,
            "age": 25,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2020 Rnd 1 Pick 21",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Malik Monk",
            "team": "Sacramento Kings",
            "position": "SG",
            "height": "6-3",
            "weight": 200,
            "age": 27,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2017 Rnd 1 Pick 11",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Jamal Murray",
            "team": "Denver Nuggets",
            "position": "SG",
            "height": "6-4",
            "weight": 215,
            "age": 28,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2016 Rnd 1 Pick 7",
            "nationality": "Canada",
            "yos": 9
        },
        {
            "name": "Immanuel Quickley",
            "team": "Toronto Raptors",
            "position": "PG",
            "height": "6-2",
            "weight": 190,
            "age": 26,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2020 Rnd 1 Pick 25",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Julius Randle",
            "team": "Minnesota Timberwolves",
            "position": "PF",
            "height": "6-9",
            "weight": 250,
            "age": 31,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2014 Rnd 1 Pick 7",
            "nationality": "United States",
            "yos": 11
        },
        {
            "name": "Antonio Reeves",
            "team": "Charlotte Hornets",
            "position": "GF",
            "height": "6-5",
            "weight": 205,
            "age": 25,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2024 Rnd 2 Pick 17",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Nick Richards",
            "team": "Phoenix Suns",
            "position": "C",
            "height": "6-11",
            "weight": 245,
            "age": 28,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2020 Rnd 2 Pick 12",
            "nationality": "Jamaica",
            "yos": 5
        },
        {
            "name": "Shaedon Sharpe",
            "team": "Portland Trail Blazers",
            "position": "F",
            "height": "6-5",
            "weight": 210,
            "age": 22,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2022 Rnd 1 Pick 7",
            "nationality": "Canada",
            "yos": 3
        },
        {
            "name": "Reed Sheppard",
            "team": "Houston Rockets",
            "position": "G",
            "height": "6-2",
            "weight": 185,
            "age": 21,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2024 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Jacob Toppin",
            "team": "Atlanta Hawks",
            "position": "SF",
            "height": "6-9",
            "weight": 200,
            "age": 25,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Karl-Anthony Towns",
            "team": "New York Knicks",
            "position": "C",
            "height": "7-0",
            "weight": 248,
            "age": 30,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2015 Rnd 1 Pick 1",
            "nationality": "United States/Dominican Republic",
            "yos": 10
        },
        {
            "name": "Oscar Tshiebwe",
            "team": "Utah Jazz",
            "position": "F",
            "height": "6-8",
            "weight": 255,
            "age": 26,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "Democratic Republic of the Congo",
            "yos": 2
        },
        {
            "name": "Jarred Vanderbilt",
            "team": "Los Angeles Lakers",
            "position": "PF",
            "height": "6-8",
            "weight": 214,
            "age": 26,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2018 Rnd 2 Pick 11",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Cason Wallace",
            "team": "Oklahoma City Thunder",
            "position": "G",
            "height": "6-3",
            "weight": 195,
            "age": 22,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2023 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "P.J. Washington",
            "team": "Dallas Mavericks",
            "position": "PF",
            "height": "6-7",
            "weight": 230,
            "age": 27,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2019 Rnd 1 Pick 12",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Amari Williams",
            "team": "Boston Celtics",
            "position": "PF",
            "height": "6-11",
            "weight": 250,
            "age": 24,
            "preDraftTeam": "Kentucky",
            "draftStatus": "2025 Rnd 2 Pick 16",
            "nationality": "England",
            "yos": 0
        }
    ],
    "Kansas": [
        {
            "name": "Ochai Agbaji",
            "team": "Toronto Raptors",
            "position": "SF",
            "height": "6-5",
            "weight": 215,
            "age": 25,
            "preDraftTeam": "Kansas",
            "draftStatus": "2022 Rnd 1 Pick 14",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Christian Braun",
            "team": "Denver Nuggets",
            "position": "SF",
            "height": "6-6",
            "weight": 220,
            "age": 24,
            "preDraftTeam": "Kansas",
            "draftStatus": "2022 Rnd 1 Pick 21",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Gradey Dick",
            "team": "Toronto Raptors",
            "position": "GF",
            "height": "6-7",
            "weight": 200,
            "age": 22,
            "preDraftTeam": "Kansas",
            "draftStatus": "2023 Rnd 1 Pick 13",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Hunter Dickinson",
            "team": "New Orleans Pelicans",
            "position": "C",
            "height": "7-1",
            "weight": 255,
            "age": 25,
            "preDraftTeam": "Kansas",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Joel Embiid",
            "team": "Philadelphia Sixers",
            "position": "C",
            "height": "7-0",
            "weight": 280,
            "age": 31,
            "preDraftTeam": "Kansas",
            "draftStatus": "2014 Rnd 1 Pick 3",
            "nationality": "Cameroon/United States",
            "yos": 11
        },
        {
            "name": "Johnny Furphy",
            "team": "Indiana Pacers",
            "position": "F",
            "height": "6-8",
            "weight": 200,
            "age": 20,
            "preDraftTeam": "Kansas",
            "draftStatus": "2024 Rnd 2 Pick 5",
            "nationality": "Australia",
            "yos": 1
        },
        {
            "name": "Kevin McCullar, Jr.",
            "team": "New York Knicks",
            "position": "PG",
            "height": "6-6",
            "weight": 210,
            "age": 25,
            "preDraftTeam": "Kansas",
            "draftStatus": "2024 Rnd 2 Pick 26",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Svi Mykhailiuk",
            "team": "Utah Jazz",
            "position": "SF",
            "height": "6-7",
            "weight": 205,
            "age": 28,
            "preDraftTeam": "Kansas",
            "draftStatus": "2018 Rnd 2 Pick 17",
            "nationality": "Ukraine",
            "yos": 7
        },
        {
            "name": "Kelly Oubre, Jr.",
            "team": "Philadelphia Sixers",
            "position": "SF",
            "height": "6-8",
            "weight": 203,
            "age": 29,
            "preDraftTeam": "Kansas",
            "draftStatus": "2015 Rnd 1 Pick 15",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Andrew Wiggins",
            "team": "Miami Heat",
            "position": "F",
            "height": "6-6",
            "weight": 197,
            "age": 30,
            "preDraftTeam": "Kansas",
            "draftStatus": "2014 Rnd 1 Pick 1",
            "nationality": "Canada",
            "yos": 11
        },
        {
            "name": "Jalen Wilson",
            "team": "Brooklyn Nets",
            "position": "F",
            "height": "6-6",
            "weight": 220,
            "age": 25,
            "preDraftTeam": "Kansas",
            "draftStatus": "2023 Rnd 2 Pick 21",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Loyola (MD)": [
        {
            "name": "Santi Aldama",
            "team": "Memphis Grizzlies",
            "position": "C",
            "height": "7-0",
            "weight": 215,
            "age": 24,
            "preDraftTeam": "Loyola (MD)",
            "draftStatus": "2021 Rnd 1 Pick 30",
            "nationality": "Spain",
            "yos": 4
        }
    ],
    "Creighton": [
        {
            "name": "Trey Alexander",
            "team": "New Orleans Pelicans",
            "position": "SG",
            "height": "6-5",
            "weight": 185,
            "age": 23,
            "preDraftTeam": "Creighton",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Ryan Kalkbrenner",
            "team": "Charlotte Hornets",
            "position": "C",
            "height": "7-1",
            "weight": 256,
            "age": 23,
            "preDraftTeam": "Creighton",
            "draftStatus": "2025 Rnd 2 Pick 4",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Doug McDermott",
            "team": "Sacramento Kings",
            "position": "F",
            "height": "6-7",
            "weight": 225,
            "age": 33,
            "preDraftTeam": "Creighton",
            "draftStatus": "2014 Rnd 1 Pick 11",
            "nationality": "United States",
            "yos": 11
        },
        {
            "name": "Baylor Scheierman",
            "team": "Boston Celtics",
            "position": "PG",
            "height": "6-6",
            "weight": 205,
            "age": 25,
            "preDraftTeam": "Creighton",
            "draftStatus": "2024 Rnd 1 Pick 30",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Virginia Tech": [
        {
            "name": "Nickeil Alexander-Walker",
            "team": "Atlanta Hawks",
            "position": "SG",
            "height": "6-5",
            "weight": 205,
            "age": 27,
            "preDraftTeam": "Virginia Tech",
            "draftStatus": "2019 Rnd 1 Pick 17",
            "nationality": "Canada",
            "yos": 6
        }
    ],
    "Duke": [
        {
            "name": "Grayson Allen",
            "team": "Phoenix Suns",
            "position": "SG",
            "height": "6-3",
            "weight": 198,
            "age": 30,
            "preDraftTeam": "Duke",
            "draftStatus": "2018 Rnd 1 Pick 21",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Marvin Bagley III",
            "team": "Washington Wizards",
            "position": "PF",
            "height": "6-10",
            "weight": 235,
            "age": 26,
            "preDraftTeam": "Duke",
            "draftStatus": "2018 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Paolo Banchero",
            "team": "Orlando Magic",
            "position": "C",
            "height": "6-10",
            "weight": 250,
            "age": 23,
            "preDraftTeam": "Duke",
            "draftStatus": "2022 Rnd 1 Pick 1",
            "nationality": "United States/Italy",
            "yos": 3
        },
        {
            "name": "R.J. Barrett",
            "team": "Toronto Raptors",
            "position": "SG",
            "height": "6-6",
            "weight": 214,
            "age": 25,
            "preDraftTeam": "Duke",
            "draftStatus": "2019 Rnd 1 Pick 3",
            "nationality": "Canada",
            "yos": 6
        },
        {
            "name": "Wendell Carter, Jr.",
            "team": "Orlando Magic",
            "position": "PF",
            "height": "6-10",
            "weight": 270,
            "age": 26,
            "preDraftTeam": "Duke",
            "draftStatus": "2018 Rnd 1 Pick 7",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Seth Curry",
            "team": "Golden State Warriors",
            "position": "G",
            "height": "6-1",
            "weight": 185,
            "age": 35,
            "preDraftTeam": "Duke",
            "draftStatus": "2013 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 12
        },
        {
            "name": "Kyle Filipowski",
            "team": "Utah Jazz",
            "position": "C",
            "height": "6-11",
            "weight": 250,
            "age": 22,
            "preDraftTeam": "Duke",
            "draftStatus": "2024 Rnd 2 Pick 2",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Cooper Flagg",
            "team": "Dallas Mavericks",
            "position": "F",
            "height": "6-9",
            "weight": 205,
            "age": 18,
            "preDraftTeam": "Duke",
            "draftStatus": "2025 Rnd 1 Pick 1",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Brandon Ingram",
            "team": "Toronto Raptors",
            "position": "SF",
            "height": "6-8",
            "weight": 190,
            "age": 28,
            "preDraftTeam": "Duke",
            "draftStatus": "2016 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 9
        },
        {
            "name": "Kyrie Irving",
            "team": "Dallas Mavericks",
            "position": "G",
            "height": "6-2",
            "weight": 195,
            "age": 33,
            "preDraftTeam": "Duke",
            "draftStatus": "2011 Rnd 1 Pick 1",
            "nationality": "United States/Australia",
            "yos": 14
        },
        {
            "name": "Sion James",
            "team": "Charlotte Hornets",
            "position": "PG",
            "height": "6-5",
            "weight": 220,
            "age": 22,
            "preDraftTeam": "Duke",
            "draftStatus": "2025 Rnd 2 Pick 3",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Jalen Johnson",
            "team": "Atlanta Hawks",
            "position": "PF",
            "height": "6-8",
            "weight": 219,
            "age": 23,
            "preDraftTeam": "Duke",
            "draftStatus": "2021 Rnd 1 Pick 20",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Tre Jones",
            "team": "Chicago Bulls",
            "position": "PG",
            "height": "6-1",
            "weight": 185,
            "age": 25,
            "preDraftTeam": "Duke",
            "draftStatus": "2020 Rnd 2 Pick 11",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Tyus Jones",
            "team": "Orlando Magic",
            "position": "PG",
            "height": "6-0",
            "weight": 196,
            "age": 29,
            "preDraftTeam": "Duke",
            "draftStatus": "2015 Rnd 1 Pick 24",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Luke Kennard",
            "team": "Atlanta Hawks",
            "position": "SG",
            "height": "6-5",
            "weight": 206,
            "age": 29,
            "preDraftTeam": "Duke",
            "draftStatus": "2017 Rnd 1 Pick 12",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Kon Knueppel",
            "team": "Charlotte Hornets",
            "position": "F",
            "height": "6-6",
            "weight": 215,
            "age": 20,
            "preDraftTeam": "Duke",
            "draftStatus": "2025 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Dereck Lively II",
            "team": "Dallas Mavericks",
            "position": "C",
            "height": "7-1",
            "weight": 230,
            "age": 21,
            "preDraftTeam": "Duke",
            "draftStatus": "2023 Rnd 1 Pick 12",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Khaman Maluach",
            "team": "Phoenix Suns",
            "position": "C",
            "height": "7-1",
            "weight": 250,
            "age": 19,
            "preDraftTeam": "Duke",
            "draftStatus": "2025 Rnd 1 Pick 10",
            "nationality": "South Sudan",
            "yos": 0
        },
        {
            "name": "Jared McCain",
            "team": "Philadelphia Sixers",
            "position": "G",
            "height": "6-3",
            "weight": 195,
            "age": 21,
            "preDraftTeam": "Duke",
            "draftStatus": "2024 Rnd 1 Pick 16",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Wendell Moore, Jr.",
            "team": "Detroit Pistons",
            "position": "SF",
            "height": "6-5",
            "weight": 215,
            "age": 24,
            "preDraftTeam": "Duke",
            "draftStatus": "2022 Rnd 1 Pick 26",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Mason Plumlee",
            "team": "Charlotte Hornets",
            "position": "PF",
            "height": "7-0",
            "weight": 254,
            "age": 35,
            "preDraftTeam": "Duke",
            "draftStatus": "2013 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 12
        },
        {
            "name": "Tyrese Proctor",
            "team": "Cleveland Cavaliers",
            "position": "PG",
            "height": "6-4",
            "weight": 185,
            "age": 21,
            "preDraftTeam": "Duke",
            "draftStatus": "2025 Rnd 2 Pick 19",
            "nationality": "Australia",
            "yos": 0
        },
        {
            "name": "Jayson Tatum",
            "team": "Boston Celtics",
            "position": "SF",
            "height": "6-8",
            "weight": 210,
            "age": 27,
            "preDraftTeam": "Duke",
            "draftStatus": "2017 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Gary Trent, Jr.",
            "team": "Milwaukee Bucks",
            "position": "SG",
            "height": "6-5",
            "weight": 204,
            "age": 26,
            "preDraftTeam": "Duke",
            "draftStatus": "2018 Rnd 2 Pick 7",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Mark Williams",
            "team": "Phoenix Suns",
            "position": "C",
            "height": "7-1",
            "weight": 240,
            "age": 23,
            "preDraftTeam": "Duke",
            "draftStatus": "2022 Rnd 1 Pick 15",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Zion Williamson",
            "team": "New Orleans Pelicans",
            "position": "PF",
            "height": "6-6",
            "weight": 284,
            "age": 25,
            "preDraftTeam": "Duke",
            "draftStatus": "2019 Rnd 1 Pick 1",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "Texas": [
        {
            "name": "Jarrett Allen",
            "team": "Cleveland Cavaliers",
            "position": "C",
            "height": "6-9",
            "weight": 243,
            "age": 27,
            "preDraftTeam": "Texas",
            "draftStatus": "2017 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Kevin Durant",
            "team": "Houston Rockets",
            "position": "SF",
            "height": "6-11",
            "weight": 240,
            "age": 37,
            "preDraftTeam": "Texas",
            "draftStatus": "2007 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 18
        },
        {
            "name": "Jaxson Hayes",
            "team": "Los Angeles Lakers",
            "position": "PF",
            "height": "7-0",
            "weight": 220,
            "age": 25,
            "preDraftTeam": "Texas",
            "draftStatus": "2019 Rnd 1 Pick 8",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Tre Johnson",
            "team": "Washington Wizards",
            "position": "SG",
            "height": "6-5",
            "weight": 190,
            "age": 19,
            "preDraftTeam": "Texas",
            "draftStatus": "2025 Rnd 1 Pick 6",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Jericho Sims",
            "team": "Milwaukee Bucks",
            "position": "C",
            "height": "6-10",
            "weight": 250,
            "age": 27,
            "preDraftTeam": "Texas",
            "draftStatus": "2021 Rnd 2 Pick 28",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Myles Turner",
            "team": "Milwaukee Bucks",
            "position": "FC",
            "height": "6-11",
            "weight": 250,
            "age": 29,
            "preDraftTeam": "Texas",
            "draftStatus": "2015 Rnd 1 Pick 11",
            "nationality": "United States",
            "yos": 10
        }
    ],
    "Georgia Tech": [
        {
            "name": "Jose Alvarado",
            "team": "New Orleans Pelicans",
            "position": "G",
            "height": "6-0",
            "weight": 179,
            "age": 27,
            "preDraftTeam": "Georgia Tech",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States/Puerto Rico",
            "yos": 4
        },
        {
            "name": "Josh Okogie",
            "team": "Houston Rockets",
            "position": "SG",
            "height": "6-4",
            "weight": 213,
            "age": 27,
            "preDraftTeam": "Georgia Tech",
            "draftStatus": "2018 Rnd 1 Pick 20",
            "nationality": "Nigeria/United States",
            "yos": 7
        }
    ],
    "UCLA": [
        {
            "name": "Kyle Anderson",
            "team": "Utah Jazz",
            "position": "PF",
            "height": "6-8",
            "weight": 230,
            "age": 32,
            "preDraftTeam": "UCLA",
            "draftStatus": "2014 Rnd 1 Pick 30",
            "nationality": "United States/China",
            "yos": 11
        },
        {
            "name": "Lonzo Ball",
            "team": "Cleveland Cavaliers",
            "position": "PG",
            "height": "6-5",
            "weight": 190,
            "age": 28,
            "preDraftTeam": "UCLA",
            "draftStatus": "2017 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Adem Bona",
            "team": "Philadelphia Sixers",
            "position": "C",
            "height": "6-10",
            "weight": 235,
            "age": 22,
            "preDraftTeam": "UCLA",
            "draftStatus": "2024 Rnd 2 Pick 11",
            "nationality": "Nigeria/Turkey",
            "yos": 1
        },
        {
            "name": "Jaylen Clark",
            "team": "Minnesota Timberwolves",
            "position": "G",
            "height": "6-5",
            "weight": 205,
            "age": 24,
            "preDraftTeam": "UCLA",
            "draftStatus": "2023 Rnd 2 Pick 23",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Aaron Holiday",
            "team": "Houston Rockets",
            "position": "PG",
            "height": "6-0",
            "weight": 185,
            "age": 29,
            "preDraftTeam": "UCLA",
            "draftStatus": "2018 Rnd 1 Pick 23",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Jrue Holiday",
            "team": "Portland Trail Blazers",
            "position": "G",
            "height": "6-4",
            "weight": 220,
            "age": 35,
            "preDraftTeam": "UCLA",
            "draftStatus": "2009 Rnd 1 Pick 17",
            "nationality": "United States",
            "yos": 16
        },
        {
            "name": "Jaime Jaquez, Jr.",
            "team": "Miami Heat",
            "position": "GF",
            "height": "6-6",
            "weight": 225,
            "age": 24,
            "preDraftTeam": "UCLA",
            "draftStatus": "2023 Rnd 1 Pick 18",
            "nationality": "United States/Mexico",
            "yos": 2
        },
        {
            "name": "Johnny Juzang",
            "team": "Minnesota Timberwolves",
            "position": "SG",
            "height": "6-7",
            "weight": 226,
            "age": 24,
            "preDraftTeam": "UCLA",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Zach LaVine",
            "team": "Sacramento Kings",
            "position": "SG",
            "height": "6-5",
            "weight": 200,
            "age": 30,
            "preDraftTeam": "UCLA",
            "draftStatus": "2014 Rnd 1 Pick 13",
            "nationality": "United States",
            "yos": 11
        },
        {
            "name": "Kevon Looney",
            "team": "New Orleans Pelicans",
            "position": "PF",
            "height": "6-9",
            "weight": 222,
            "age": 29,
            "preDraftTeam": "UCLA",
            "draftStatus": "2015 Rnd 1 Pick 30",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Kevin Love",
            "team": "Utah Jazz",
            "position": "FC",
            "height": "6-10",
            "weight": 251,
            "age": 37,
            "preDraftTeam": "UCLA",
            "draftStatus": "2008 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 17
        },
        {
            "name": "Norman Powell",
            "team": "Miami Heat",
            "position": "SG",
            "height": "6-3",
            "weight": 215,
            "age": 32,
            "preDraftTeam": "UCLA",
            "draftStatus": "2015 Rnd 2 Pick 16",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Peyton Watson",
            "team": "Denver Nuggets",
            "position": "GF",
            "height": "6-8",
            "weight": 200,
            "age": 23,
            "preDraftTeam": "UCLA",
            "draftStatus": "2022 Rnd 1 Pick 30",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Russell Westbrook",
            "team": "Sacramento Kings",
            "position": "G",
            "height": "6-4",
            "weight": 200,
            "age": 37,
            "preDraftTeam": "UCLA",
            "draftStatus": "2008 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 17
        }
    ],
    "UCAM Murcia CB (Spain)": [
        {
            "name": "Alex Antetokounmpo",
            "team": "Milwaukee Bucks",
            "position": "SF",
            "height": "6-8",
            "weight": 214,
            "age": 24,
            "preDraftTeam": "UCAM Murcia CB (Spain)",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "Greece/Nigeria",
            "yos": 0
        }
    ],
    "Filathlitikos Div II Greece (Greece)": [
        {
            "name": "Giannis Antetokounmpo",
            "team": "Milwaukee Bucks",
            "position": "F",
            "height": "6-11",
            "weight": 243,
            "age": 30,
            "preDraftTeam": "Filathlitikos Div II Greece (Greece)",
            "draftStatus": "2013 Rnd 1 Pick 15",
            "nationality": "Greece/Nigeria",
            "yos": 12
        }
    ],
    "Delaware 87ers": [
        {
            "name": "Thanasis Antetokounmpo",
            "team": "Milwaukee Bucks",
            "position": "SF",
            "height": "6-7",
            "weight": 219,
            "age": 33,
            "preDraftTeam": "Delaware 87ers",
            "draftStatus": "2014 Rnd 2 Pick 21",
            "nationality": "Greece/Nigeria",
            "yos": 6
        }
    ],
    "North Carolina": [
        {
            "name": "Cole Anthony",
            "team": "Milwaukee Bucks",
            "position": "PG",
            "height": "6-2",
            "weight": 185,
            "age": 25,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2020 Rnd 1 Pick 15",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Harrison Barnes",
            "team": "San Antonio Spurs",
            "position": "SF",
            "height": "6-7",
            "weight": 225,
            "age": 33,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2012 Rnd 1 Pick 7",
            "nationality": "United States",
            "yos": 13
        },
        {
            "name": "Tony Bradley",
            "team": "Indiana Pacers",
            "position": "C",
            "height": "6-10",
            "weight": 248,
            "age": 27,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2017 Rnd 1 Pick 28",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Harrison Ingram",
            "team": "San Antonio Spurs",
            "position": "F",
            "height": "6-5",
            "weight": 230,
            "age": 23,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2024 Rnd 2 Pick 18",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Cameron Johnson",
            "team": "Denver Nuggets",
            "position": "G",
            "height": "6-8",
            "weight": 210,
            "age": 29,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2019 Rnd 1 Pick 11",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Pete Nance",
            "team": "Milwaukee Bucks",
            "position": "PF",
            "height": "6-9",
            "weight": 225,
            "age": 25,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Drake Powell",
            "team": "Brooklyn Nets",
            "position": "F",
            "height": "6-5",
            "weight": 195,
            "age": 20,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2025 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Day'Ron Sharpe",
            "team": "Brooklyn Nets",
            "position": "PF",
            "height": "6-10",
            "weight": 265,
            "age": 24,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2021 Rnd 1 Pick 29",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Coby White",
            "team": "Chicago Bulls",
            "position": "PG",
            "height": "6-4",
            "weight": 195,
            "age": 25,
            "preDraftTeam": "North Carolina",
            "draftStatus": "2019 Rnd 1 Pick 7",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "Indiana": [
        {
            "name": "OG Anunoby",
            "team": "New York Knicks",
            "position": "SF",
            "height": "6-7",
            "weight": 240,
            "age": 28,
            "preDraftTeam": "Indiana",
            "draftStatus": "2017 Rnd 1 Pick 23",
            "nationality": "England/United States",
            "yos": 8
        },
        {
            "name": "Thomas Bryant",
            "team": "Cleveland Cavaliers",
            "position": "C",
            "height": "6-9",
            "weight": 248,
            "age": 28,
            "preDraftTeam": "Indiana",
            "draftStatus": "2017 Rnd 2 Pick 12",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Eric Gordon",
            "team": "Philadelphia Sixers",
            "position": "G",
            "height": "6-3",
            "weight": 215,
            "age": 36,
            "preDraftTeam": "Indiana",
            "draftStatus": "2008 Rnd 1 Pick 7",
            "nationality": "United States/Bahamas",
            "yos": 17
        },
        {
            "name": "Trayce Jackson-Davis",
            "team": "Golden State Warriors",
            "position": "F",
            "height": "6-9",
            "weight": 245,
            "age": 25,
            "preDraftTeam": "Indiana",
            "draftStatus": "2023 Rnd 2 Pick 27",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Kel'el Ware",
            "team": "Miami Heat",
            "position": "PF",
            "height": "7-0",
            "weight": 230,
            "age": 21,
            "preDraftTeam": "Indiana",
            "draftStatus": "2024 Rnd 1 Pick 15",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Maccabi Tel Aviv U18 (Israel)": [
        {
            "name": "Deni Avdija",
            "team": "Portland Trail Blazers",
            "position": "SG",
            "height": "6-8",
            "weight": 228,
            "age": 24,
            "preDraftTeam": "Maccabi Tel Aviv U18 (Israel)",
            "draftStatus": "2020 Rnd 1 Pick 9",
            "nationality": "Israel",
            "yos": 5
        }
    ],
    "Arizona": [
        {
            "name": "Deandre Ayton",
            "team": "Los Angeles Lakers",
            "position": "C",
            "height": "7-0",
            "weight": 252,
            "age": 27,
            "preDraftTeam": "Arizona",
            "draftStatus": "2018 Rnd 1 Pick 1",
            "nationality": "Bahamas",
            "yos": 7
        },
        {
            "name": "Carter Bryant",
            "team": "San Antonio Spurs",
            "position": "F",
            "height": "6-6",
            "weight": 220,
            "age": 20,
            "preDraftTeam": "Arizona",
            "draftStatus": "2025 Rnd 1 Pick 14",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Aaron Gordon",
            "team": "Denver Nuggets",
            "position": "F",
            "height": "6-8",
            "weight": 235,
            "age": 30,
            "preDraftTeam": "Arizona",
            "draftStatus": "2014 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 11
        },
        {
            "name": "Josh Green",
            "team": "Charlotte Hornets",
            "position": "SG",
            "height": "6-6",
            "weight": 200,
            "age": 25,
            "preDraftTeam": "Arizona",
            "draftStatus": "2020 Rnd 1 Pick 18",
            "nationality": "United States/Australia",
            "yos": 5
        },
        {
            "name": "Keshad Johnson",
            "team": "Miami Heat",
            "position": "SF",
            "height": "6-6",
            "weight": 225,
            "age": 24,
            "preDraftTeam": "Arizona",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Pelle Larsson",
            "team": "Miami Heat",
            "position": "SG",
            "height": "6-5",
            "weight": 215,
            "age": 24,
            "preDraftTeam": "Arizona",
            "draftStatus": "2024 Rnd 2 Pick 14",
            "nationality": "Sweden",
            "yos": 1
        },
        {
            "name": "Caleb Love",
            "team": "Portland Trail Blazers",
            "position": "GF",
            "height": "6-3",
            "weight": 212,
            "age": 24,
            "preDraftTeam": "Arizona",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Lauri Markkanen",
            "team": "Utah Jazz",
            "position": "SF",
            "height": "7-1",
            "weight": 240,
            "age": 28,
            "preDraftTeam": "Arizona",
            "draftStatus": "2017 Rnd 1 Pick 7",
            "nationality": "Finland",
            "yos": 8
        },
        {
            "name": "Bennedict Mathurin",
            "team": "Indiana Pacers",
            "position": "GF",
            "height": "6-5",
            "weight": 210,
            "age": 23,
            "preDraftTeam": "Arizona",
            "draftStatus": "2022 Rnd 1 Pick 6",
            "nationality": "Canada/Haiti",
            "yos": 3
        },
        {
            "name": "T.J. McConnell",
            "team": "Indiana Pacers",
            "position": "G",
            "height": "6-1",
            "weight": 190,
            "age": 33,
            "preDraftTeam": "Arizona",
            "draftStatus": "2015 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Zeke Nnaji",
            "team": "Denver Nuggets",
            "position": "PF",
            "height": "6-10",
            "weight": 240,
            "age": 24,
            "preDraftTeam": "Arizona",
            "draftStatus": "2020 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Dalen Terry",
            "team": "Chicago Bulls",
            "position": "PG",
            "height": "6-6",
            "weight": 195,
            "age": 23,
            "preDraftTeam": "Arizona",
            "draftStatus": "2022 Rnd 1 Pick 18",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Brandon Williams",
            "team": "Dallas Mavericks",
            "position": "PG",
            "height": "6-1",
            "weight": 190,
            "age": 26,
            "preDraftTeam": "Arizona",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Rutgers": [
        {
            "name": "Ace Bailey",
            "team": "Utah Jazz",
            "position": "SF",
            "height": "6-9",
            "weight": 200,
            "age": 19,
            "preDraftTeam": "Rutgers",
            "draftStatus": "2025 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Dylan Harper",
            "team": "San Antonio Spurs",
            "position": "GF",
            "height": "6-5",
            "weight": 215,
            "age": 19,
            "preDraftTeam": "Rutgers",
            "draftStatus": "2025 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Ron Harper",
            "team": "Boston Celtics",
            "position": "G",
            "height": "6-5",
            "weight": 233,
            "age": 25,
            "preDraftTeam": "Rutgers",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Illawarra (Australia)": [
        {
            "name": "LaMelo Ball",
            "team": "Charlotte Hornets",
            "position": "G",
            "height": "6-7",
            "weight": 180,
            "age": 24,
            "preDraftTeam": "Illawarra (Australia)",
            "draftStatus": "2020 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "A.J. Johnson",
            "team": "Washington Wizards",
            "position": "G",
            "height": "6-5",
            "weight": 160,
            "age": 21,
            "preDraftTeam": "Illawarra (Australia)",
            "draftStatus": "2024 Rnd 1 Pick 23",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Lachlan Olbrich",
            "team": "Chicago Bulls",
            "position": "C",
            "height": "6-8",
            "weight": 236,
            "age": 22,
            "preDraftTeam": "Illawarra (Australia)",
            "draftStatus": "2025 Rnd 2 Pick 25",
            "nationality": "Australia",
            "yos": 0
        }
    ],
    "TCU": [
        {
            "name": "Desmond Bane",
            "team": "Orlando Magic",
            "position": "SG",
            "height": "6-6",
            "weight": 215,
            "age": 27,
            "preDraftTeam": "TCU",
            "draftStatus": "2020 Rnd 1 Pick 30",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Emanuel Miller",
            "team": "Chicago Bulls",
            "position": "SF",
            "height": "6-5",
            "weight": 215,
            "age": 25,
            "preDraftTeam": "TCU",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "Canada",
            "yos": 1
        },
        {
            "name": "Kenrich Williams",
            "team": "Oklahoma City Thunder",
            "position": "SF",
            "height": "6-7",
            "weight": 210,
            "age": 31,
            "preDraftTeam": "TCU",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 7
        }
    ],
    "Overtime Elite (Georgia)": [
        {
            "name": "Dominick Barlow",
            "team": "Philadelphia Sixers",
            "position": "F",
            "height": "6-9",
            "weight": 215,
            "age": 22,
            "preDraftTeam": "Overtime Elite (Georgia)",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Amen Thompson",
            "team": "Houston Rockets",
            "position": "G",
            "height": "6-7",
            "weight": 200,
            "age": 22,
            "preDraftTeam": "Overtime Elite (Georgia)",
            "draftStatus": "2023 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Ausar Thompson",
            "team": "Detroit Pistons",
            "position": "G",
            "height": "6-7",
            "weight": 205,
            "age": 22,
            "preDraftTeam": "Overtime Elite (Georgia)",
            "draftStatus": "2023 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Florida State": [
        {
            "name": "Scottie Barnes",
            "team": "Toronto Raptors",
            "position": "SF",
            "height": "6-8",
            "weight": 237,
            "age": 24,
            "preDraftTeam": "Florida State",
            "draftStatus": "2021 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Jonathan Isaac",
            "team": "Orlando Magic",
            "position": "SF",
            "height": "6-10",
            "weight": 230,
            "age": 28,
            "preDraftTeam": "Florida State",
            "draftStatus": "2017 Rnd 1 Pick 6",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Terance Mann",
            "team": "Brooklyn Nets",
            "position": "SG",
            "height": "6-6",
            "weight": 215,
            "age": 29,
            "preDraftTeam": "Florida State",
            "draftStatus": "2019 Rnd 2 Pick 18",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Devin Vassell",
            "team": "San Antonio Spurs",
            "position": "SG",
            "height": "6-5",
            "weight": 200,
            "age": 25,
            "preDraftTeam": "Florida State",
            "draftStatus": "2020 Rnd 1 Pick 11",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Jamir Watkins",
            "team": "Washington Wizards",
            "position": "F",
            "height": "6-6",
            "weight": 210,
            "age": 24,
            "preDraftTeam": "Florida State",
            "draftStatus": "2025 Rnd 2 Pick 13",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Patrick Williams",
            "team": "Chicago Bulls",
            "position": "G",
            "height": "6-6",
            "weight": 215,
            "age": 24,
            "preDraftTeam": "Florida State",
            "draftStatus": "2020 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 5
        }
    ],
    "Northwestern": [
        {
            "name": "Brooks Barnhizer",
            "team": "Oklahoma City Thunder",
            "position": "SF",
            "height": "6-5",
            "weight": 230,
            "age": 24,
            "preDraftTeam": "Northwestern",
            "draftStatus": "2025 Rnd 2 Pick 14",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Pat Spencer",
            "team": "Golden State Warriors",
            "position": "G",
            "height": "6-2",
            "weight": 205,
            "age": 29,
            "preDraftTeam": "Northwestern",
            "draftStatus": "2020 NBA Draft, Undrafted",
            "nationality": "United States/Cape Verde",
            "yos": 2
        }
    ],
    "Missouri": [
        {
            "name": "Tamar Bates",
            "team": "Denver Nuggets",
            "position": "G",
            "height": "6-4",
            "weight": 195,
            "age": 23,
            "preDraftTeam": "Missouri",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Kobe Brown",
            "team": "Los Angeles Clippers",
            "position": "GF",
            "height": "6-7",
            "weight": 250,
            "age": 25,
            "preDraftTeam": "Missouri",
            "draftStatus": "2023 Rnd 1 Pick 30",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Jordan Clarkson",
            "team": "New York Knicks",
            "position": "G",
            "height": "6-5",
            "weight": 194,
            "age": 33,
            "preDraftTeam": "Missouri",
            "draftStatus": "2014 Rnd 2 Pick 16",
            "nationality": "United States/Philippines",
            "yos": 11
        },
        {
            "name": "Michael Porter, Jr.",
            "team": "Brooklyn Nets",
            "position": "PF",
            "height": "6-10",
            "weight": 218,
            "age": 27,
            "preDraftTeam": "Missouri",
            "draftStatus": "2018 Rnd 1 Pick 14",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Dru Smith",
            "team": "Miami Heat",
            "position": "SG",
            "height": "6-2",
            "weight": 203,
            "age": 27,
            "preDraftTeam": "Missouri",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Ohio State": [
        {
            "name": "Jamison Battle",
            "team": "Toronto Raptors",
            "position": "SF",
            "height": "6-7",
            "weight": 220,
            "age": 24,
            "preDraftTeam": "Ohio State",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Malaki Branham",
            "team": "Washington Wizards",
            "position": "GF",
            "height": "6-4",
            "weight": 180,
            "age": 22,
            "preDraftTeam": "Ohio State",
            "draftStatus": "2022 Rnd 1 Pick 20",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Mike Conley",
            "team": "Minnesota Timberwolves",
            "position": "PG",
            "height": "6-1",
            "weight": 175,
            "age": 38,
            "preDraftTeam": "Ohio State",
            "draftStatus": "2007 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 18
        },
        {
            "name": "E.J. Liddell",
            "team": "Brooklyn Nets",
            "position": "PF",
            "height": "6-6",
            "weight": 240,
            "age": 24,
            "preDraftTeam": "Ohio State",
            "draftStatus": "2022 Rnd 2 Pick 11",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "D'Angelo Russell",
            "team": "Dallas Mavericks",
            "position": "SG",
            "height": "6-3",
            "weight": 193,
            "age": 29,
            "preDraftTeam": "Ohio State",
            "draftStatus": "2015 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Brice Sensabaugh",
            "team": "Utah Jazz",
            "position": "F",
            "height": "6-6",
            "weight": 235,
            "age": 22,
            "preDraftTeam": "Ohio State",
            "draftStatus": "2023 Rnd 1 Pick 28",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Jae'sean Tate",
            "team": "Houston Rockets",
            "position": "F",
            "height": "6-4",
            "weight": 230,
            "age": 30,
            "preDraftTeam": "Ohio State",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 5
        }
    ],
    "Le Mans Sarthe Basket (France)": [
        {
            "name": "Nicolas Batum",
            "team": "Los Angeles Clippers",
            "position": "F",
            "height": "6-7",
            "weight": 230,
            "age": 36,
            "preDraftTeam": "Le Mans Sarthe Basket (France)",
            "draftStatus": "2008 Rnd 1 Pick 25",
            "nationality": "France",
            "yos": 17
        },
        {
            "name": "Noah Penda",
            "team": "Orlando Magic",
            "position": "F",
            "height": "6-7",
            "weight": 215,
            "age": 20,
            "preDraftTeam": "Le Mans Sarthe Basket (France)",
            "draftStatus": "2025 Rnd 2 Pick 2",
            "nationality": "France",
            "yos": 0
        }
    ],
    "Florida": [
        {
            "name": "Bradley Beal",
            "team": "Los Angeles Clippers",
            "position": "SG",
            "height": "6-4",
            "weight": 207,
            "age": 32,
            "preDraftTeam": "Florida",
            "draftStatus": "2012 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 13
        },
        {
            "name": "Colin Castleton",
            "team": "Orlando Magic",
            "position": "PF",
            "height": "6-10",
            "weight": 250,
            "age": 25,
            "preDraftTeam": "Florida",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Walter Clayton, Jr.",
            "team": "Utah Jazz",
            "position": "G",
            "height": "6-4",
            "weight": 195,
            "age": 22,
            "preDraftTeam": "Florida",
            "draftStatus": "2025 Rnd 1 Pick 18",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Dorian Finney-Smith",
            "team": "Houston Rockets",
            "position": "SF",
            "height": "6-7",
            "weight": 220,
            "age": 32,
            "preDraftTeam": "Florida",
            "draftStatus": "2016 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 9
        },
        {
            "name": "Al Horford",
            "team": "Golden State Warriors",
            "position": "FC",
            "height": "6-8",
            "weight": 240,
            "age": 39,
            "preDraftTeam": "Florida",
            "draftStatus": "2007 Rnd 1 Pick 3",
            "nationality": "Dominican Republic/United States",
            "yos": 18
        },
        {
            "name": "Tre Mann",
            "team": "Charlotte Hornets",
            "position": "PG",
            "height": "6-4",
            "weight": 178,
            "age": 24,
            "preDraftTeam": "Florida",
            "draftStatus": "2021 Rnd 1 Pick 18",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Alijah Martin",
            "team": "Toronto Raptors",
            "position": "PG",
            "height": "6-2",
            "weight": 210,
            "age": 24,
            "preDraftTeam": "Florida",
            "draftStatus": "2025 Rnd 2 Pick 9",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Will Richard",
            "team": "Golden State Warriors",
            "position": "F",
            "height": "6-3",
            "weight": 206,
            "age": 22,
            "preDraftTeam": "Florida",
            "draftStatus": "2025 Rnd 2 Pick 26",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Cedevita (Croatia)": [
        {
            "name": "Joan Beringer",
            "team": "Minnesota Timberwolves",
            "position": "C",
            "height": "6-11",
            "weight": 230,
            "age": 19,
            "preDraftTeam": "Cedevita (Croatia)",
            "draftStatus": "2025 Rnd 1 Pick 17",
            "nationality": "France",
            "yos": 0
        },
        {
            "name": "Jusuf Nurkic",
            "team": "Utah Jazz",
            "position": "FC",
            "height": "6-11",
            "weight": 290,
            "age": 31,
            "preDraftTeam": "Cedevita (Croatia)",
            "draftStatus": "2014 Rnd 1 Pick 16",
            "nationality": "Bosnia and Herzegovina",
            "yos": 11
        }
    ],
    "Villanova": [
        {
            "name": "Saddiq Bey",
            "team": "New Orleans Pelicans",
            "position": "F",
            "height": "6-8",
            "weight": 215,
            "age": 26,
            "preDraftTeam": "Villanova",
            "draftStatus": "2020 Rnd 1 Pick 19",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Mikal Bridges",
            "team": "New York Knicks",
            "position": "SG",
            "height": "6-6",
            "weight": 209,
            "age": 29,
            "preDraftTeam": "Villanova",
            "draftStatus": "2018 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Jalen Brunson",
            "team": "New York Knicks",
            "position": "PG",
            "height": "6-2",
            "weight": 190,
            "age": 29,
            "preDraftTeam": "Villanova",
            "draftStatus": "2018 Rnd 2 Pick 3",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Donte DiVincenzo",
            "team": "Minnesota Timberwolves",
            "position": "SG",
            "height": "6-4",
            "weight": 203,
            "age": 28,
            "preDraftTeam": "Villanova",
            "draftStatus": "2018 Rnd 1 Pick 17",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Collin Gillespie",
            "team": "Phoenix Suns",
            "position": "PG",
            "height": "6-1",
            "weight": 195,
            "age": 26,
            "preDraftTeam": "Villanova",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Josh Hart",
            "team": "New York Knicks",
            "position": "SG",
            "height": "6-5",
            "weight": 215,
            "age": 30,
            "preDraftTeam": "Villanova",
            "draftStatus": "2017 Rnd 1 Pick 30",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Kyle Lowry",
            "team": "Philadelphia Sixers",
            "position": "PG",
            "height": "6-0",
            "weight": 196,
            "age": 39,
            "preDraftTeam": "Villanova",
            "draftStatus": "2006 Rnd 1 Pick 24",
            "nationality": "United States",
            "yos": 19
        },
        {
            "name": "Jeremiah Robinson-Earl",
            "team": "Indiana Pacers",
            "position": "PF",
            "height": "6-9",
            "weight": 240,
            "age": 25,
            "preDraftTeam": "Villanova",
            "draftStatus": "2021 Rnd 2 Pick 2",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Cam Whitmore",
            "team": "Washington Wizards",
            "position": "F",
            "height": "6-6",
            "weight": 230,
            "age": 21,
            "preDraftTeam": "Villanova",
            "draftStatus": "2023 Rnd 1 Pick 20",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "KK Mega Bemax (Serbia)": [
        {
            "name": "Goga Bitadze",
            "team": "Orlando Magic",
            "position": "C",
            "height": "6-11",
            "weight": 250,
            "age": 26,
            "preDraftTeam": "KK Mega Bemax (Serbia)",
            "draftStatus": "2019 Rnd 1 Pick 18",
            "nationality": "Georgia",
            "yos": 6
        },
        {
            "name": "Nikola Djurisic",
            "team": "Atlanta Hawks",
            "position": "F",
            "height": "6-8",
            "weight": 214,
            "age": 21,
            "preDraftTeam": "KK Mega Bemax (Serbia)",
            "draftStatus": "2024 Rnd 2 Pick 13",
            "nationality": "Belgium/Serbia",
            "yos": 0
        },
        {
            "name": "Nikola Jokic",
            "team": "Denver Nuggets",
            "position": "C",
            "height": "6-11",
            "weight": 284,
            "age": 30,
            "preDraftTeam": "KK Mega Bemax (Serbia)",
            "draftStatus": "2014 Rnd 2 Pick 11",
            "nationality": "Serbia",
            "yos": 10
        },
        {
            "name": "Nikola Jovic",
            "team": "Miami Heat",
            "position": "F",
            "height": "6-10",
            "weight": 205,
            "age": 22,
            "preDraftTeam": "KK Mega Bemax (Serbia)",
            "draftStatus": "2022 Rnd 1 Pick 27",
            "nationality": "Serbia",
            "yos": 3
        },
        {
            "name": "Karlo Matkovic",
            "team": "New Orleans Pelicans",
            "position": "PF",
            "height": "6-10",
            "weight": 231,
            "age": 24,
            "preDraftTeam": "KK Mega Bemax (Serbia)",
            "draftStatus": "2022 Rnd 2 Pick 22",
            "nationality": "Bosnia and Herzegovina/Croatia",
            "yos": 1
        },
        {
            "name": "Ivica Zubac",
            "team": "Los Angeles Clippers",
            "position": "C",
            "height": "7-0",
            "weight": 240,
            "age": 28,
            "preDraftTeam": "KK Mega Bemax (Serbia)",
            "draftStatus": "2016 Rnd 2 Pick 2",
            "nationality": "Bosnia and Herzegovina/Croatia",
            "yos": 9
        }
    ],
    "Baloncesto Fuenlabrada (Spain)": [
        {
            "name": "Bismack Biyombo",
            "team": "San Antonio Spurs",
            "position": "PF",
            "height": "6-8",
            "weight": 255,
            "age": 33,
            "preDraftTeam": "Baloncesto Fuenlabrada (Spain)",
            "draftStatus": "2011 Rnd 1 Pick 7",
            "nationality": "Democratic Republic of the Congo",
            "yos": 14
        }
    ],
    "Arkansas": [
        {
            "name": "Anthony Black",
            "team": "Orlando Magic",
            "position": "G",
            "height": "6-7",
            "weight": 200,
            "age": 21,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2023 Rnd 1 Pick 6",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Daniel Gafford",
            "team": "Dallas Mavericks",
            "position": "C",
            "height": "6-10",
            "weight": 265,
            "age": 27,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2019 Rnd 2 Pick 8",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Isaiah Joe",
            "team": "Oklahoma City Thunder",
            "position": "SG",
            "height": "6-4",
            "weight": 165,
            "age": 26,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2020 Rnd 2 Pick 19",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Moses Moody",
            "team": "Golden State Warriors",
            "position": "SG",
            "height": "6-5",
            "weight": 211,
            "age": 23,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2021 Rnd 1 Pick 14",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Bobby Portis",
            "team": "Milwaukee Bucks",
            "position": "PF",
            "height": "6-9",
            "weight": 250,
            "age": 30,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2015 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Nick Smith, Jr.",
            "team": "Los Angeles Lakers",
            "position": "G",
            "height": "6-2",
            "weight": 185,
            "age": 21,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2023 Rnd 1 Pick 27",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Adou Thiero",
            "team": "Los Angeles Lakers",
            "position": "G",
            "height": "6-7",
            "weight": 220,
            "age": 21,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2025 Rnd 2 Pick 6",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Jordan Walsh",
            "team": "Boston Celtics",
            "position": "F",
            "height": "6-6",
            "weight": 205,
            "age": 21,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2023 Rnd 2 Pick 8",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Jaylin Williams",
            "team": "Oklahoma City Thunder",
            "position": "C",
            "height": "6-9",
            "weight": 240,
            "age": 23,
            "preDraftTeam": "Arkansas",
            "draftStatus": "2022 Rnd 2 Pick 4",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "KK Partizan (Serbia)": [
        {
            "name": "Bogdan Bogdanovic",
            "team": "Los Angeles Clippers",
            "position": "SG",
            "height": "6-5",
            "weight": 225,
            "age": 33,
            "preDraftTeam": "KK Partizan (Serbia)",
            "draftStatus": "2014 Rnd 1 Pick 27",
            "nationality": "Serbia",
            "yos": 8
        },
        {
            "name": "Tristan Vukcevic",
            "team": "Washington Wizards",
            "position": "F",
            "height": "7-0",
            "weight": 220,
            "age": 22,
            "preDraftTeam": "KK Partizan (Serbia)",
            "draftStatus": "2023 Rnd 2 Pick 12",
            "nationality": "Italy/Serbia",
            "yos": 2
        }
    ],
    "Oregon": [
        {
            "name": "Chris Boucher",
            "team": "Boston Celtics",
            "position": "PF",
            "height": "6-8",
            "weight": 200,
            "age": 32,
            "preDraftTeam": "Oregon",
            "draftStatus": "2017 NBA Draft, Undrafted",
            "nationality": "Saint Lucia/Canada",
            "yos": 8
        },
        {
            "name": "Dillon Brooks",
            "team": "Phoenix Suns",
            "position": "F",
            "height": "6-7",
            "weight": 225,
            "age": 29,
            "preDraftTeam": "Oregon",
            "draftStatus": "2017 Rnd 2 Pick 15",
            "nationality": "Canada",
            "yos": 8
        },
        {
            "name": "N'Faly Dante",
            "team": "Atlanta Hawks",
            "position": "PF",
            "height": "6-11",
            "weight": 230,
            "age": 24,
            "preDraftTeam": "Oregon",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "Mali",
            "yos": 1
        },
        {
            "name": "Payton Pritchard",
            "team": "Boston Celtics",
            "position": "PG",
            "height": "6-1",
            "weight": 195,
            "age": 27,
            "preDraftTeam": "Oregon",
            "draftStatus": "2020 Rnd 1 Pick 26",
            "nationality": "United States",
            "yos": 5
        }
    ],
    "San Francisco": [
        {
            "name": "Jamaree Bouyea",
            "team": "Phoenix Suns",
            "position": "G",
            "height": "6-2",
            "weight": 180,
            "age": 26,
            "preDraftTeam": "San Francisco",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Jonathan Mogbo",
            "team": "Toronto Raptors",
            "position": "F",
            "height": "6-9",
            "weight": 225,
            "age": 24,
            "preDraftTeam": "San Francisco",
            "draftStatus": "2024 Rnd 2 Pick 1",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Michigan State": [
        {
            "name": "Miles Bridges",
            "team": "Charlotte Hornets",
            "position": "SF",
            "height": "6-7",
            "weight": 225,
            "age": 27,
            "preDraftTeam": "Michigan State",
            "draftStatus": "2018 Rnd 1 Pick 12",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Max Christie",
            "team": "Dallas Mavericks",
            "position": "F",
            "height": "6-5",
            "weight": 190,
            "age": 22,
            "preDraftTeam": "Michigan State",
            "draftStatus": "2022 Rnd 2 Pick 5",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Draymond Green",
            "team": "Golden State Warriors",
            "position": "F",
            "height": "6-6",
            "weight": 230,
            "age": 35,
            "preDraftTeam": "Michigan State",
            "draftStatus": "2012 Rnd 2 Pick 5",
            "nationality": "United States",
            "yos": 13
        },
        {
            "name": "Gary Harris",
            "team": "Milwaukee Bucks",
            "position": "SG",
            "height": "6-4",
            "weight": 210,
            "age": 31,
            "preDraftTeam": "Michigan State",
            "draftStatus": "2014 Rnd 1 Pick 19",
            "nationality": "United States",
            "yos": 11
        },
        {
            "name": "Jaren Jackson, Jr.",
            "team": "Memphis Grizzlies",
            "position": "PF",
            "height": "6-10",
            "weight": 242,
            "age": 26,
            "preDraftTeam": "Michigan State",
            "draftStatus": "2018 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Jase Richardson",
            "team": "Orlando Magic",
            "position": "G",
            "height": "6-1",
            "weight": 180,
            "age": 20,
            "preDraftTeam": "Michigan State",
            "draftStatus": "2025 Rnd 1 Pick 25",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Xavier Tillman, Sr.",
            "team": "Boston Celtics",
            "position": "PF",
            "height": "6-8",
            "weight": 245,
            "age": 26,
            "preDraftTeam": "Michigan State",
            "draftStatus": "2020 Rnd 2 Pick 5",
            "nationality": "United States",
            "yos": 5
        }
    ],
    "Auburn": [
        {
            "name": "Johni Broome",
            "team": "Philadelphia Sixers",
            "position": "C",
            "height": "6-10",
            "weight": 235,
            "age": 23,
            "preDraftTeam": "Auburn",
            "draftStatus": "2025 Rnd 2 Pick 5",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Dylan Cardwell",
            "team": "Sacramento Kings",
            "position": "PF",
            "height": "6-10",
            "weight": 255,
            "age": 25,
            "preDraftTeam": "Auburn",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Sharife Cooper",
            "team": "Washington Wizards",
            "position": "PG",
            "height": "6-0",
            "weight": 176,
            "age": 24,
            "preDraftTeam": "Auburn",
            "draftStatus": "2021 Rnd 2 Pick 18",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Miles Kelly",
            "team": "Dallas Mavericks",
            "position": "F",
            "height": "6-4",
            "weight": 190,
            "age": 23,
            "preDraftTeam": "Auburn",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Walker Kessler",
            "team": "Utah Jazz",
            "position": "C",
            "height": "7-2",
            "weight": 245,
            "age": 24,
            "preDraftTeam": "Auburn",
            "draftStatus": "2022 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Isaac Okoro",
            "team": "Chicago Bulls",
            "position": "SG",
            "height": "6-4",
            "weight": 225,
            "age": 24,
            "preDraftTeam": "Auburn",
            "draftStatus": "2020 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Jabari Smith, Jr.",
            "team": "Houston Rockets",
            "position": "F",
            "height": "6-11",
            "weight": 220,
            "age": 22,
            "preDraftTeam": "Auburn",
            "draftStatus": "2022 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "California": [
        {
            "name": "Jaylen Brown",
            "team": "Boston Celtics",
            "position": "SF",
            "height": "6-6",
            "weight": 223,
            "age": 29,
            "preDraftTeam": "California",
            "draftStatus": "2016 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 9
        },
        {
            "name": "Jaylon Tyson",
            "team": "Cleveland Cavaliers",
            "position": "F",
            "height": "6-6",
            "weight": 215,
            "age": 23,
            "preDraftTeam": "California",
            "draftStatus": "2024 Rnd 1 Pick 20",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Miami (FL)": [
        {
            "name": "Bruce Brown, Jr.",
            "team": "Denver Nuggets",
            "position": "SG",
            "height": "6-4",
            "weight": 202,
            "age": 29,
            "preDraftTeam": "Miami (FL)",
            "draftStatus": "2018 Rnd 2 Pick 12",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Kyshawn George",
            "team": "Washington Wizards",
            "position": "F",
            "height": "6-8",
            "weight": 200,
            "age": 21,
            "preDraftTeam": "Miami (FL)",
            "draftStatus": "2024 Rnd 1 Pick 24",
            "nationality": "Switzerland/Canada",
            "yos": 1
        },
        {
            "name": "Jordan Miller",
            "team": "Los Angeles Clippers",
            "position": "G",
            "height": "6-5",
            "weight": 194,
            "age": 25,
            "preDraftTeam": "Miami (FL)",
            "draftStatus": "2023 Rnd 2 Pick 18",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Michigan": [
        {
            "name": "Kobe Bufkin",
            "team": "Memphis Grizzlies",
            "position": "G",
            "height": "6-4",
            "weight": 195,
            "age": 22,
            "preDraftTeam": "Michigan",
            "draftStatus": "2023 Rnd 1 Pick 15",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Moussa Diabate",
            "team": "Charlotte Hornets",
            "position": "PF",
            "height": "6-10",
            "weight": 210,
            "age": 23,
            "preDraftTeam": "Michigan",
            "draftStatus": "2022 Rnd 2 Pick 13",
            "nationality": "France",
            "yos": 3
        },
        {
            "name": "Vladislav Goldin",
            "team": "Miami Heat",
            "position": "C",
            "height": "7-0",
            "weight": 250,
            "age": 25,
            "preDraftTeam": "Michigan",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "Russia",
            "yos": 0
        },
        {
            "name": "Tim Hardaway Jr.",
            "team": "Denver Nuggets",
            "position": "SG",
            "height": "6-5",
            "weight": 205,
            "age": 33,
            "preDraftTeam": "Michigan",
            "draftStatus": "2013 Rnd 1 Pick 24",
            "nationality": "United States",
            "yos": 12
        },
        {
            "name": "Caleb Houstan",
            "team": "Atlanta Hawks",
            "position": "SF",
            "height": "6-8",
            "weight": 205,
            "age": 22,
            "preDraftTeam": "Michigan",
            "draftStatus": "2022 Rnd 2 Pick 2",
            "nationality": "Canada",
            "yos": 3
        },
        {
            "name": "Jett Howard",
            "team": "Orlando Magic",
            "position": "GF",
            "height": "6-8",
            "weight": 215,
            "age": 22,
            "preDraftTeam": "Michigan",
            "draftStatus": "2023 Rnd 1 Pick 11",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Caris LeVert",
            "team": "Detroit Pistons",
            "position": "G",
            "height": "6-7",
            "weight": 205,
            "age": 31,
            "preDraftTeam": "Michigan",
            "draftStatus": "2016 Rnd 1 Pick 20",
            "nationality": "United States",
            "yos": 9
        },
        {
            "name": "Isaiah Livers",
            "team": "Phoenix Suns",
            "position": "PF",
            "height": "6-6",
            "weight": 232,
            "age": 27,
            "preDraftTeam": "Michigan",
            "draftStatus": "2021 Rnd 2 Pick 12",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Jordan Poole",
            "team": "New Orleans Pelicans",
            "position": "SG",
            "height": "6-4",
            "weight": 194,
            "age": 26,
            "preDraftTeam": "Michigan",
            "draftStatus": "2019 Rnd 1 Pick 28",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Duncan Robinson",
            "team": "Detroit Pistons",
            "position": "F",
            "height": "6-7",
            "weight": 215,
            "age": 31,
            "preDraftTeam": "Michigan",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Franz Wagner",
            "team": "Orlando Magic",
            "position": "SF",
            "height": "6-10",
            "weight": 220,
            "age": 24,
            "preDraftTeam": "Michigan",
            "draftStatus": "2021 Rnd 1 Pick 8",
            "nationality": "Germany",
            "yos": 4
        },
        {
            "name": "Moe Wagner",
            "team": "Orlando Magic",
            "position": "PF",
            "height": "6-11",
            "weight": 245,
            "age": 28,
            "preDraftTeam": "Michigan",
            "draftStatus": "2018 Rnd 1 Pick 25",
            "nationality": "Germany",
            "yos": 7
        },
        {
            "name": "Danny Wolf",
            "team": "Brooklyn Nets",
            "position": "C",
            "height": "6-11",
            "weight": 250,
            "age": 21,
            "preDraftTeam": "Michigan",
            "draftStatus": "2025 Rnd 1 Pick 27",
            "nationality": "United States/Israel",
            "yos": 0
        }
    ],
    "Marquette": [
        {
            "name": "Jimmy Butler III",
            "team": "Golden State Warriors",
            "position": "GF",
            "height": "6-6",
            "weight": 230,
            "age": 36,
            "preDraftTeam": "Marquette",
            "draftStatus": "2011 Rnd 1 Pick 30",
            "nationality": "United States",
            "yos": 14
        },
        {
            "name": "Oso Ighodaro",
            "team": "Phoenix Suns",
            "position": "F",
            "height": "6-11",
            "weight": 235,
            "age": 23,
            "preDraftTeam": "Marquette",
            "draftStatus": "2024 Rnd 2 Pick 10",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Kam Jones",
            "team": "Indiana Pacers",
            "position": "F",
            "height": "6-4",
            "weight": 200,
            "age": 23,
            "preDraftTeam": "Marquette",
            "draftStatus": "2025 Rnd 2 Pick 8",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Tyler Kolek",
            "team": "New York Knicks",
            "position": "G",
            "height": "6-2",
            "weight": 195,
            "age": 24,
            "preDraftTeam": "Marquette",
            "draftStatus": "2024 Rnd 2 Pick 4",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Olivier-Maxence Prosper",
            "team": "Memphis Grizzlies",
            "position": "F",
            "height": "6-7",
            "weight": 230,
            "age": 23,
            "preDraftTeam": "Marquette",
            "draftStatus": "2023 Rnd 1 Pick 24",
            "nationality": "Canada",
            "yos": 2
        }
    ],
    "NBA G League Ignite": [
        {
            "name": "Matas Buzelis",
            "team": "Chicago Bulls",
            "position": "F",
            "height": "6-8",
            "weight": 209,
            "age": 21,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2024 Rnd 1 Pick 11",
            "nationality": "United States/Lithuania",
            "yos": 1
        },
        {
            "name": "Sidy Cissoko",
            "team": "Portland Trail Blazers",
            "position": "GF",
            "height": "6-6",
            "weight": 220,
            "age": 21,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2023 Rnd 2 Pick 14",
            "nationality": "France",
            "yos": 2
        },
        {
            "name": "Dyson Daniels",
            "team": "Atlanta Hawks",
            "position": "GF",
            "height": "6-7",
            "weight": 199,
            "age": 22,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2022 Rnd 1 Pick 8",
            "nationality": "Australia",
            "yos": 3
        },
        {
            "name": "Jalen Green",
            "team": "Phoenix Suns",
            "position": "SG",
            "height": "6-4",
            "weight": 186,
            "age": 23,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2021 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Jaden Hardy",
            "team": "Dallas Mavericks",
            "position": "SG",
            "height": "6-3",
            "weight": 198,
            "age": 23,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2022 Rnd 2 Pick 7",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Scoot Henderson",
            "team": "Portland Trail Blazers",
            "position": "G",
            "height": "6-3",
            "weight": 207,
            "age": 21,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2023 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Ron Holland",
            "team": "Detroit Pistons",
            "position": "F",
            "height": "6-8",
            "weight": 206,
            "age": 20,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2024 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Jonathan Kuminga",
            "team": "Golden State Warriors",
            "position": "F",
            "height": "6-7",
            "weight": 225,
            "age": 23,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2021 Rnd 1 Pick 7",
            "nationality": "Democratic Republic of the Congo",
            "yos": 4
        },
        {
            "name": "Leonard Miller",
            "team": "Minnesota Timberwolves",
            "position": "F",
            "height": "6-10",
            "weight": 220,
            "age": 22,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2023 Rnd 2 Pick 3",
            "nationality": "Canada",
            "yos": 2
        },
        {
            "name": "Tyler Smith",
            "team": "Houston Rockets",
            "position": "F",
            "height": "6-9",
            "weight": 224,
            "age": 21,
            "preDraftTeam": "NBA G League Ignite",
            "draftStatus": "2024 Rnd 2 Pick 3",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Oakland": [
        {
            "name": "Jamal Cain",
            "team": "Orlando Magic",
            "position": "F",
            "height": "6-7",
            "weight": 191,
            "age": 26,
            "preDraftTeam": "Oakland",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Georgia": [
        {
            "name": "Kentavious Caldwell-Pope",
            "team": "Memphis Grizzlies",
            "position": "SG",
            "height": "6-5",
            "weight": 204,
            "age": 32,
            "preDraftTeam": "Georgia",
            "draftStatus": "2013 Rnd 1 Pick 8",
            "nationality": "United States",
            "yos": 12
        },
        {
            "name": "Nicolas Claxton",
            "team": "Brooklyn Nets",
            "position": "C",
            "height": "6-11",
            "weight": 215,
            "age": 26,
            "preDraftTeam": "Georgia",
            "draftStatus": "2019 Rnd 2 Pick 1",
            "nationality": "United States/U.S. Virgin Islands",
            "yos": 6
        },
        {
            "name": "Anthony Edwards",
            "team": "Minnesota Timberwolves",
            "position": "SF",
            "height": "6-4",
            "weight": 225,
            "age": 24,
            "preDraftTeam": "Georgia",
            "draftStatus": "2020 Rnd 1 Pick 1",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Asa Newell",
            "team": "Atlanta Hawks",
            "position": "PF",
            "height": "6-10",
            "weight": 220,
            "age": 20,
            "preDraftTeam": "Georgia",
            "draftStatus": "2025 Rnd 1 Pick 23",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Dayton": [
        {
            "name": "Toumani Camara",
            "team": "Portland Trail Blazers",
            "position": "SF",
            "height": "6-7",
            "weight": 230,
            "age": 25,
            "preDraftTeam": "Dayton",
            "draftStatus": "2023 Rnd 2 Pick 22",
            "nationality": "Belgium",
            "yos": 2
        },
        {
            "name": "DaRon Holmes II",
            "team": "Denver Nuggets",
            "position": "PF",
            "height": "6-9",
            "weight": 225,
            "age": 23,
            "preDraftTeam": "Dayton",
            "draftStatus": "2024 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Obi Toppin",
            "team": "Indiana Pacers",
            "position": "F",
            "height": "6-9",
            "weight": 220,
            "age": 27,
            "preDraftTeam": "Dayton",
            "draftStatus": "2020 Rnd 1 Pick 8",
            "nationality": "United States",
            "yos": 5
        }
    ],
    "Chalon-Sur-Saone (France)": [
        {
            "name": "Clint Capela",
            "team": "Houston Rockets",
            "position": "PF",
            "height": "6-10",
            "weight": 256,
            "age": 31,
            "preDraftTeam": "Chalon-Sur-Saone (France)",
            "draftStatus": "2014 Rnd 1 Pick 25",
            "nationality": "Switzerland",
            "yos": 11
        }
    ],
    "Utah": [
        {
            "name": "Branden Carlson",
            "team": "Oklahoma City Thunder",
            "position": "PF",
            "height": "7-0",
            "weight": 220,
            "age": 26,
            "preDraftTeam": "Utah",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Kyle Kuzma",
            "team": "Milwaukee Bucks",
            "position": "F",
            "height": "6-8",
            "weight": 221,
            "age": 30,
            "preDraftTeam": "Utah",
            "draftStatus": "2017 Rnd 1 Pick 27",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Jakob Poeltl",
            "team": "Toronto Raptors",
            "position": "C",
            "height": "7-0",
            "weight": 253,
            "age": 30,
            "preDraftTeam": "Utah",
            "draftStatus": "2016 Rnd 1 Pick 9",
            "nationality": "Austria",
            "yos": 9
        }
    ],
    "Providence": [
        {
            "name": "Devin Carter",
            "team": "Sacramento Kings",
            "position": "G",
            "height": "6-2",
            "weight": 195,
            "age": 23,
            "preDraftTeam": "Providence",
            "draftStatus": "2024 Rnd 1 Pick 13",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Kris Dunn",
            "team": "Los Angeles Clippers",
            "position": "SG",
            "height": "6-3",
            "weight": 205,
            "age": 31,
            "preDraftTeam": "Providence",
            "draftStatus": "2016 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 9
        }
    ],
    "West Virginia": [
        {
            "name": "Jevon Carter",
            "team": "Chicago Bulls",
            "position": "PG",
            "height": "6-0",
            "weight": 200,
            "age": 30,
            "preDraftTeam": "West Virginia",
            "draftStatus": "2018 Rnd 2 Pick 2",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Miles McBride",
            "team": "New York Knicks",
            "position": "G",
            "height": "6-2",
            "weight": 195,
            "age": 25,
            "preDraftTeam": "West Virginia",
            "draftStatus": "2021 Rnd 2 Pick 6",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Javon Small",
            "team": "Memphis Grizzlies",
            "position": "G",
            "height": "6-1",
            "weight": 190,
            "age": 24,
            "preDraftTeam": "West Virginia",
            "draftStatus": "2025 Rnd 2 Pick 18",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Texas A&M": [
        {
            "name": "Alex Caruso",
            "team": "Oklahoma City Thunder",
            "position": "G",
            "height": "6-5",
            "weight": 186,
            "age": 31,
            "preDraftTeam": "Texas A&M",
            "draftStatus": "2016 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Quenton Jackson",
            "team": "Indiana Pacers",
            "position": "GF",
            "height": "6-4",
            "weight": 173,
            "age": 27,
            "preDraftTeam": "Texas A&M",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "DeAndre Jordan",
            "team": "New Orleans Pelicans",
            "position": "C",
            "height": "6-11",
            "weight": 265,
            "age": 37,
            "preDraftTeam": "Texas A&M",
            "draftStatus": "2008 Rnd 2 Pick 5",
            "nationality": "United States",
            "yos": 17
        },
        {
            "name": "Khris Middleton",
            "team": "Washington Wizards",
            "position": "SF",
            "height": "6-7",
            "weight": 222,
            "age": 34,
            "preDraftTeam": "Texas A&M",
            "draftStatus": "2012 Rnd 2 Pick 9",
            "nationality": "United States",
            "yos": 13
        },
        {
            "name": "Robert Williams",
            "team": "Portland Trail Blazers",
            "position": "PF",
            "height": "6-9",
            "weight": 249,
            "age": 28,
            "preDraftTeam": "Texas A&M",
            "draftStatus": "2018 Rnd 1 Pick 27",
            "nationality": "United States",
            "yos": 7
        }
    ],
    "UConn": [
        {
            "name": "Stephon Castle",
            "team": "San Antonio Spurs",
            "position": "G",
            "height": "6-6",
            "weight": 215,
            "age": 21,
            "preDraftTeam": "UConn",
            "draftStatus": "2024 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Donovan Clingan",
            "team": "Portland Trail Blazers",
            "position": "C",
            "height": "7-2",
            "weight": 280,
            "age": 21,
            "preDraftTeam": "UConn",
            "draftStatus": "2024 Rnd 1 Pick 7",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Andre Drummond",
            "team": "Philadelphia Sixers",
            "position": "C",
            "height": "6-11",
            "weight": 279,
            "age": 32,
            "preDraftTeam": "UConn",
            "draftStatus": "2012 Rnd 1 Pick 9",
            "nationality": "United States",
            "yos": 13
        },
        {
            "name": "Jordan Hawkins",
            "team": "New Orleans Pelicans",
            "position": "G",
            "height": "6-5",
            "weight": 190,
            "age": 23,
            "preDraftTeam": "UConn",
            "draftStatus": "2023 Rnd 1 Pick 14",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Andre Jackson, Jr.",
            "team": "Milwaukee Bucks",
            "position": "G",
            "height": "6-6",
            "weight": 209,
            "age": 24,
            "preDraftTeam": "UConn",
            "draftStatus": "2023 Rnd 2 Pick 6",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Tyrese Martin",
            "team": "Brooklyn Nets",
            "position": "GF",
            "height": "6-6",
            "weight": 215,
            "age": 26,
            "preDraftTeam": "UConn",
            "draftStatus": "2022 Rnd 2 Pick 21",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Liam McNeeley",
            "team": "Charlotte Hornets",
            "position": "F",
            "height": "6-7",
            "weight": 210,
            "age": 20,
            "preDraftTeam": "UConn",
            "draftStatus": "2025 Rnd 1 Pick 29",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Cam Spencer",
            "team": "Memphis Grizzlies",
            "position": "SG",
            "height": "6-3",
            "weight": 205,
            "age": 25,
            "preDraftTeam": "UConn",
            "draftStatus": "2024 Rnd 2 Pick 23",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "St. John's": [
        {
            "name": "Julian Champagnie",
            "team": "San Antonio Spurs",
            "position": "F",
            "height": "6-7",
            "weight": 217,
            "age": 24,
            "preDraftTeam": "St. John's",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Daniss Jenkins",
            "team": "Detroit Pistons",
            "position": "G",
            "height": "6-4",
            "weight": 165,
            "age": 24,
            "preDraftTeam": "St. John's",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Minnesota": [
        {
            "name": "Cameron Christie",
            "team": "Los Angeles Clippers",
            "position": "SG",
            "height": "6-5",
            "weight": 190,
            "age": 20,
            "preDraftTeam": "Minnesota",
            "draftStatus": "2024 Rnd 2 Pick 16",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Amir Coffey",
            "team": "Milwaukee Bucks",
            "position": "SF",
            "height": "6-7",
            "weight": 210,
            "age": 28,
            "preDraftTeam": "Minnesota",
            "draftStatus": "2019 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "Gonzaga": [
        {
            "name": "Brandon Clarke",
            "team": "Memphis Grizzlies",
            "position": "PF",
            "height": "6-8",
            "weight": 215,
            "age": 29,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2019 Rnd 1 Pick 21",
            "nationality": "Canada",
            "yos": 6
        },
        {
            "name": "Zach Collins",
            "team": "Chicago Bulls",
            "position": "C",
            "height": "6-9",
            "weight": 250,
            "age": 28,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2017 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Rui Hachimura",
            "team": "Los Angeles Lakers",
            "position": "F",
            "height": "6-8",
            "weight": 230,
            "age": 27,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2019 Rnd 1 Pick 9",
            "nationality": "Japan",
            "yos": 6
        },
        {
            "name": "Chet Holmgren",
            "team": "Oklahoma City Thunder",
            "position": "C",
            "height": "7-1",
            "weight": 208,
            "age": 23,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2022 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Corey Kispert",
            "team": "Washington Wizards",
            "position": "SF",
            "height": "6-6",
            "weight": 224,
            "age": 26,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2021 Rnd 1 Pick 15",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Andrew Nembhard",
            "team": "Indiana Pacers",
            "position": "PG",
            "height": "6-4",
            "weight": 191,
            "age": 25,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2022 Rnd 2 Pick 1",
            "nationality": "Canada",
            "yos": 3
        },
        {
            "name": "Ryan Nembhard",
            "team": "Dallas Mavericks",
            "position": "PG",
            "height": "5-11",
            "weight": 180,
            "age": 23,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "Canada",
            "yos": 0
        },
        {
            "name": "Kelly Olynyk",
            "team": "San Antonio Spurs",
            "position": "C",
            "height": "7-0",
            "weight": 240,
            "age": 34,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2013 Rnd 1 Pick 13",
            "nationality": "Canada",
            "yos": 12
        },
        {
            "name": "Domantas Sabonis",
            "team": "Sacramento Kings",
            "position": "PF",
            "height": "6-10",
            "weight": 240,
            "age": 29,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2016 Rnd 1 Pick 11",
            "nationality": "United States/Lithuania",
            "yos": 9
        },
        {
            "name": "Julian Strawther",
            "team": "Denver Nuggets",
            "position": "GF",
            "height": "6-6",
            "weight": 205,
            "age": 23,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2023 Rnd 1 Pick 29",
            "nationality": "United States/Puerto Rico",
            "yos": 2
        },
        {
            "name": "Jalen Suggs",
            "team": "Orlando Magic",
            "position": "SG",
            "height": "6-5",
            "weight": 205,
            "age": 24,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2021 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Drew Timme",
            "team": "Los Angeles Lakers",
            "position": "F",
            "height": "6-9",
            "weight": 235,
            "age": 25,
            "preDraftTeam": "Gonzaga",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Colorado State": [
        {
            "name": "Nique Clifford",
            "team": "Sacramento Kings",
            "position": "F",
            "height": "6-5",
            "weight": 175,
            "age": 23,
            "preDraftTeam": "Colorado State",
            "draftStatus": "2025 Rnd 1 Pick 24",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Isaiah Stevens",
            "team": "Sacramento Kings",
            "position": "PG",
            "height": "5-11",
            "weight": 185,
            "age": 25,
            "preDraftTeam": "Colorado State",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Alabama": [
        {
            "name": "Noah Clowney",
            "team": "Brooklyn Nets",
            "position": "F",
            "height": "6-10",
            "weight": 210,
            "age": 21,
            "preDraftTeam": "Alabama",
            "draftStatus": "2023 Rnd 1 Pick 21",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "J.D. Davison",
            "team": "Houston Rockets",
            "position": "F",
            "height": "6-1",
            "weight": 195,
            "age": 23,
            "preDraftTeam": "Alabama",
            "draftStatus": "2022 Rnd 2 Pick 23",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Keon Ellis",
            "team": "Sacramento Kings",
            "position": "F",
            "height": "6-4",
            "weight": 175,
            "age": 25,
            "preDraftTeam": "Alabama",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Herb Jones",
            "team": "New Orleans Pelicans",
            "position": "SF",
            "height": "6-7",
            "weight": 206,
            "age": 27,
            "preDraftTeam": "Alabama",
            "draftStatus": "2021 Rnd 2 Pick 5",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Brandon Miller",
            "team": "Charlotte Hornets",
            "position": "F",
            "height": "6-7",
            "weight": 200,
            "age": 23,
            "preDraftTeam": "Alabama",
            "draftStatus": "2023 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Mark Sears",
            "team": "Milwaukee Bucks",
            "position": "G",
            "height": "6-0",
            "weight": 185,
            "age": 24,
            "preDraftTeam": "Alabama",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Collin Sexton",
            "team": "Charlotte Hornets",
            "position": "PG",
            "height": "6-3",
            "weight": 190,
            "age": 26,
            "preDraftTeam": "Alabama",
            "draftStatus": "2018 Rnd 1 Pick 8",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Chris Youngblood",
            "team": "Oklahoma City Thunder",
            "position": "SG",
            "height": "6-4",
            "weight": 221,
            "age": 23,
            "preDraftTeam": "Alabama",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "USC": [
        {
            "name": "Isaiah Collier",
            "team": "Utah Jazz",
            "position": "G",
            "height": "6-4",
            "weight": 210,
            "age": 21,
            "preDraftTeam": "USC",
            "draftStatus": "2024 Rnd 1 Pick 29",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "DeMar DeRozan",
            "team": "Sacramento Kings",
            "position": "GF",
            "height": "6-6",
            "weight": 220,
            "age": 36,
            "preDraftTeam": "USC",
            "draftStatus": "2009 Rnd 1 Pick 9",
            "nationality": "United States",
            "yos": 16
        },
        {
            "name": "Bronny James",
            "team": "Los Angeles Lakers",
            "position": "G",
            "height": "6-2",
            "weight": 210,
            "age": 21,
            "preDraftTeam": "USC",
            "draftStatus": "2024 Rnd 2 Pick 25",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Jordan McLaughlin",
            "team": "San Antonio Spurs",
            "position": "G",
            "height": "5-11",
            "weight": 185,
            "age": 29,
            "preDraftTeam": "USC",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "De'Anthony Melton",
            "team": "Golden State Warriors",
            "position": "SG",
            "height": "6-2",
            "weight": 200,
            "age": 27,
            "preDraftTeam": "USC",
            "draftStatus": "2018 Rnd 2 Pick 16",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Evan Mobley",
            "team": "Cleveland Cavaliers",
            "position": "PF",
            "height": "6-11",
            "weight": 215,
            "age": 24,
            "preDraftTeam": "USC",
            "draftStatus": "2021 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Onyeka Okongwu",
            "team": "Atlanta Hawks",
            "position": "PF",
            "height": "6-10",
            "weight": 240,
            "age": 24,
            "preDraftTeam": "USC",
            "draftStatus": "2020 Rnd 1 Pick 6",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Drew Peterson",
            "team": "Charlotte Hornets",
            "position": "F",
            "height": "6-8",
            "weight": 205,
            "age": 26,
            "preDraftTeam": "USC",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Kevin Porter, Jr.",
            "team": "Milwaukee Bucks",
            "position": "SF",
            "height": "6-5",
            "weight": 203,
            "age": 25,
            "preDraftTeam": "USC",
            "draftStatus": "2019 Rnd 1 Pick 30",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Nikola Vucevic",
            "team": "Chicago Bulls",
            "position": "PF",
            "height": "6-9",
            "weight": 260,
            "age": 35,
            "preDraftTeam": "USC",
            "draftStatus": "2011 Rnd 1 Pick 16",
            "nationality": "Switzerland/Montenegro",
            "yos": 14
        }
    ],
    "Wake Forest": [
        {
            "name": "John Collins",
            "team": "Los Angeles Clippers",
            "position": "PF",
            "height": "6-9",
            "weight": 226,
            "age": 28,
            "preDraftTeam": "Wake Forest",
            "draftStatus": "2017 Rnd 1 Pick 19",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Jake LaRavia",
            "team": "Los Angeles Lakers",
            "position": "F",
            "height": "6-7",
            "weight": 235,
            "age": 24,
            "preDraftTeam": "Wake Forest",
            "draftStatus": "2022 Rnd 1 Pick 19",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Chris Paul",
            "team": "Los Angeles Clippers",
            "position": "PG",
            "height": "6-0",
            "weight": 175,
            "age": 40,
            "preDraftTeam": "Wake Forest",
            "draftStatus": "2005 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 20
        },
        {
            "name": "Hunter Sallis",
            "team": "Philadelphia Sixers",
            "position": "SG",
            "height": "6-4",
            "weight": 185,
            "age": 23,
            "preDraftTeam": "Wake Forest",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Notre Dame": [
        {
            "name": "Pat Connaughton",
            "team": "Charlotte Hornets",
            "position": "SF",
            "height": "6-5",
            "weight": 209,
            "age": 32,
            "preDraftTeam": "Notre Dame",
            "draftStatus": "2015 Rnd 2 Pick 11",
            "nationality": "United States",
            "yos": 10
        },
        {
            "name": "Blake Wesley",
            "team": "Portland Trail Blazers",
            "position": "SG",
            "height": "6-4",
            "weight": 190,
            "age": 22,
            "preDraftTeam": "Notre Dame",
            "draftStatus": "2022 Rnd 1 Pick 25",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Winston-Salem State": [
        {
            "name": "Javonte Cooke",
            "team": "Portland Trail Blazers",
            "position": "G",
            "height": "6-6",
            "weight": 185,
            "age": 26,
            "preDraftTeam": "Winston-Salem State",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Boulogne-Levallois (France)": [
        {
            "name": "Bilal Coulibaly",
            "team": "Washington Wizards",
            "position": "GF",
            "height": "6-7",
            "weight": 195,
            "age": 21,
            "preDraftTeam": "Boulogne-Levallois (France)",
            "draftStatus": "2023 Rnd 1 Pick 7",
            "nationality": "France",
            "yos": 2
        },
        {
            "name": "Victor Wembanyama",
            "team": "San Antonio Spurs",
            "position": "F",
            "height": "7-4",
            "weight": 235,
            "age": 21,
            "preDraftTeam": "Boulogne-Levallois (France)",
            "draftStatus": "2023 Rnd 1 Pick 1",
            "nationality": "France",
            "yos": 2
        }
    ],
    "Washington State": [
        {
            "name": "Cedric Coward",
            "team": "Memphis Grizzlies",
            "position": "F",
            "height": "6-5",
            "weight": 206,
            "age": 22,
            "preDraftTeam": "Washington State",
            "draftStatus": "2025 Rnd 1 Pick 11",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Mouhamed Gueye",
            "team": "Atlanta Hawks",
            "position": "F",
            "height": "6-11",
            "weight": 210,
            "age": 23,
            "preDraftTeam": "Washington State",
            "draftStatus": "2023 Rnd 2 Pick 9",
            "nationality": "Senegal",
            "yos": 2
        },
        {
            "name": "Isaac Jones",
            "team": "Detroit Pistons",
            "position": "C",
            "height": "6-8",
            "weight": 245,
            "age": 25,
            "preDraftTeam": "Washington State",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Klay Thompson",
            "team": "Dallas Mavericks",
            "position": "G",
            "height": "6-5",
            "weight": 220,
            "age": 35,
            "preDraftTeam": "Washington State",
            "draftStatus": "2011 Rnd 1 Pick 11",
            "nationality": "United States",
            "yos": 14
        },
        {
            "name": "Jaylen Wells",
            "team": "Memphis Grizzlies",
            "position": "F",
            "height": "6-7",
            "weight": 206,
            "age": 22,
            "preDraftTeam": "Washington State",
            "draftStatus": "2024 Rnd 2 Pick 9",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Louisiana Tech": [
        {
            "name": "Isaiah Crawford",
            "team": "Houston Rockets",
            "position": "GF",
            "height": "6-6",
            "weight": 220,
            "age": 24,
            "preDraftTeam": "Louisiana Tech",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Houston": [
        {
            "name": "L.J. Cryer",
            "team": "Golden State Warriors",
            "position": "PG",
            "height": "6-0",
            "weight": 200,
            "age": 24,
            "preDraftTeam": "Houston",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Quentin Grimes",
            "team": "Philadelphia Sixers",
            "position": "SG",
            "height": "6-4",
            "weight": 210,
            "age": 25,
            "preDraftTeam": "Houston",
            "draftStatus": "2021 Rnd 1 Pick 25",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Marcus Sasser",
            "team": "Detroit Pistons",
            "position": "G",
            "height": "6-1",
            "weight": 195,
            "age": 25,
            "preDraftTeam": "Houston",
            "draftStatus": "2023 Rnd 1 Pick 25",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Jamal Shead",
            "team": "Toronto Raptors",
            "position": "G",
            "height": "6-1",
            "weight": 200,
            "age": 23,
            "preDraftTeam": "Houston",
            "draftStatus": "2024 Rnd 2 Pick 15",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Jarace Walker",
            "team": "Indiana Pacers",
            "position": "G",
            "height": "6-7",
            "weight": 235,
            "age": 22,
            "preDraftTeam": "Houston",
            "draftStatus": "2023 Rnd 1 Pick 8",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Oklahoma State": [
        {
            "name": "Cade Cunningham",
            "team": "Detroit Pistons",
            "position": "SF",
            "height": "6-6",
            "weight": 220,
            "age": 24,
            "preDraftTeam": "Oklahoma State",
            "draftStatus": "2021 Rnd 1 Pick 1",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Marcus Smart",
            "team": "Los Angeles Lakers",
            "position": "PG",
            "height": "6-3",
            "weight": 220,
            "age": 31,
            "preDraftTeam": "Oklahoma State",
            "draftStatus": "2014 Rnd 1 Pick 6",
            "nationality": "United States",
            "yos": 11
        },
        {
            "name": "Lindy Waters III",
            "team": "San Antonio Spurs",
            "position": "SG",
            "height": "6-5",
            "weight": 210,
            "age": 28,
            "preDraftTeam": "Oklahoma State",
            "draftStatus": "2020 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 4
        }
    ],
    "Davidson": [
        {
            "name": "Stephen Curry",
            "team": "Golden State Warriors",
            "position": "G",
            "height": "6-2",
            "weight": 185,
            "age": 37,
            "preDraftTeam": "Davidson",
            "draftStatus": "2009 Rnd 1 Pick 7",
            "nationality": "United States",
            "yos": 16
        }
    ],
    "Colorado": [
        {
            "name": "Tristan Da Silva",
            "team": "Orlando Magic",
            "position": "F",
            "height": "6-8",
            "weight": 217,
            "age": 24,
            "preDraftTeam": "Colorado",
            "draftStatus": "2024 Rnd 1 Pick 18",
            "nationality": "Germany/Brazil",
            "yos": 1
        },
        {
            "name": "K.J. Simpson",
            "team": "Charlotte Hornets",
            "position": "G",
            "height": "6-2",
            "weight": 189,
            "age": 23,
            "preDraftTeam": "Colorado",
            "draftStatus": "2024 Rnd 2 Pick 12",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Jabari Walker",
            "team": "Philadelphia Sixers",
            "position": "F",
            "height": "6-7",
            "weight": 237,
            "age": 23,
            "preDraftTeam": "Colorado",
            "draftStatus": "2022 Rnd 2 Pick 27",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Derrick White",
            "team": "Boston Celtics",
            "position": "G",
            "height": "6-4",
            "weight": 190,
            "age": 31,
            "preDraftTeam": "Colorado",
            "draftStatus": "2017 Rnd 1 Pick 29",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Cody Williams",
            "team": "Utah Jazz",
            "position": "F",
            "height": "6-8",
            "weight": 190,
            "age": 21,
            "preDraftTeam": "Colorado",
            "draftStatus": "2024 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Ratiopharm Ulm (Germany)": [
        {
            "name": "Pacome Dadiet",
            "team": "New York Knicks",
            "position": "SF",
            "height": "6-9",
            "weight": 210,
            "age": 20,
            "preDraftTeam": "Ratiopharm Ulm (Germany)",
            "draftStatus": "2024 Rnd 1 Pick 25",
            "nationality": "France",
            "yos": 1
        },
        {
            "name": "Noa Essengue",
            "team": "Chicago Bulls",
            "position": "F",
            "height": "6-8",
            "weight": 200,
            "age": 18,
            "preDraftTeam": "Ratiopharm Ulm (Germany)",
            "draftStatus": "2025 Rnd 1 Pick 12",
            "nationality": "France",
            "yos": 0
        },
        {
            "name": "Ben Saraf",
            "team": "Brooklyn Nets",
            "position": "G",
            "height": "6-6",
            "weight": 200,
            "age": 19,
            "preDraftTeam": "Ratiopharm Ulm (Germany)",
            "draftStatus": "2025 Rnd 1 Pick 26",
            "nationality": "South Africa/Israel",
            "yos": 0
        }
    ],
    "Brigham Young": [
        {
            "name": "Egor Demin",
            "team": "Brooklyn Nets",
            "position": "PG",
            "height": "6-8",
            "weight": 200,
            "age": 19,
            "preDraftTeam": "Brigham Young",
            "draftStatus": "2025 Rnd 1 Pick 8",
            "nationality": "Russia",
            "yos": 0
        }
    ],
    "Cholet Basket (France)": [
        {
            "name": "Mohamed Diawara",
            "team": "New York Knicks",
            "position": "PF",
            "height": "6-9",
            "weight": 225,
            "age": 20,
            "preDraftTeam": "Cholet Basket (France)",
            "draftStatus": "2025 Rnd 2 Pick 21",
            "nationality": "France",
            "yos": 0
        },
        {
            "name": "Rudy Gobert",
            "team": "Minnesota Timberwolves",
            "position": "C",
            "height": "7-1",
            "weight": 258,
            "age": 33,
            "preDraftTeam": "Cholet Basket (France)",
            "draftStatus": "2013 Rnd 1 Pick 27",
            "nationality": "France",
            "yos": 12
        },
        {
            "name": "Tidjane Salaun",
            "team": "Charlotte Hornets",
            "position": "F",
            "height": "6-10",
            "weight": 207,
            "age": 20,
            "preDraftTeam": "Cholet Basket (France)",
            "draftStatus": "2024 Rnd 1 Pick 6",
            "nationality": "France",
            "yos": 1
        }
    ],
    "New Zealand (New Zealand)": [
        {
            "name": "Ousmane Dieng",
            "team": "Oklahoma City Thunder",
            "position": "SG",
            "height": "6-9",
            "weight": 185,
            "age": 22,
            "preDraftTeam": "New Zealand (New Zealand)",
            "draftStatus": "2022 Rnd 1 Pick 11",
            "nationality": "France",
            "yos": 3
        },
        {
            "name": "Rayan Rupert",
            "team": "Portland Trail Blazers",
            "position": "G",
            "height": "6-7",
            "weight": 205,
            "age": 21,
            "preDraftTeam": "New Zealand (New Zealand)",
            "draftStatus": "2023 Rnd 2 Pick 13",
            "nationality": "France",
            "yos": 2
        }
    ],
    "Real Madrid (Spain)": [
        {
            "name": "Luka Doncic",
            "team": "Los Angeles Lakers",
            "position": "SF",
            "height": "6-8",
            "weight": 230,
            "age": 26,
            "preDraftTeam": "Real Madrid (Spain)",
            "draftStatus": "2018 Rnd 1 Pick 3",
            "nationality": "Slovenia",
            "yos": 7
        },
        {
            "name": "Hugo Gonzalez",
            "team": "Boston Celtics",
            "position": "F",
            "height": "6-6",
            "weight": 200,
            "age": 19,
            "preDraftTeam": "Real Madrid (Spain)",
            "draftStatus": "2025 Rnd 1 Pick 28",
            "nationality": "Spain",
            "yos": 0
        },
        {
            "name": "Eli N'Diaye",
            "team": "Atlanta Hawks",
            "position": "C",
            "height": "6-8",
            "weight": 209,
            "age": 22,
            "preDraftTeam": "Real Madrid (Spain)",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "Senegal",
            "yos": 0
        }
    ],
    "Arizona State": [
        {
            "name": "Luguentz Dort",
            "team": "Oklahoma City Thunder",
            "position": "PG",
            "height": "6-4",
            "weight": 220,
            "age": 26,
            "preDraftTeam": "Arizona State",
            "draftStatus": "2019 NBA Draft, Undrafted",
            "nationality": "Canada",
            "yos": 6
        },
        {
            "name": "James Harden",
            "team": "Los Angeles Clippers",
            "position": "SG",
            "height": "6-5",
            "weight": 220,
            "age": 36,
            "preDraftTeam": "Arizona State",
            "draftStatus": "2009 Rnd 1 Pick 3",
            "nationality": "United States",
            "yos": 16
        }
    ],
    "Illinois": [
        {
            "name": "Ayo Dosunmu",
            "team": "Chicago Bulls",
            "position": "PG",
            "height": "6-4",
            "weight": 200,
            "age": 25,
            "preDraftTeam": "Illinois",
            "draftStatus": "2021 Rnd 2 Pick 8",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Kasparas Jakucionis",
            "team": "Miami Heat",
            "position": "G",
            "height": "6-5",
            "weight": 200,
            "age": 19,
            "preDraftTeam": "Illinois",
            "draftStatus": "2025 Rnd 1 Pick 20",
            "nationality": "Lithuania",
            "yos": 0
        },
        {
            "name": "Will Riley",
            "team": "Washington Wizards",
            "position": "F",
            "height": "6-9",
            "weight": 180,
            "age": 19,
            "preDraftTeam": "Illinois",
            "draftStatus": "2025 Rnd 1 Pick 21",
            "nationality": "Canada",
            "yos": 0
        },
        {
            "name": "Terrence Shannon, Jr.",
            "team": "Minnesota Timberwolves",
            "position": "F",
            "height": "6-6",
            "weight": 215,
            "age": 25,
            "preDraftTeam": "Illinois",
            "draftStatus": "2024 Rnd 1 Pick 27",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Virginia": [
        {
            "name": "Ryan Dunn",
            "team": "Phoenix Suns",
            "position": "G",
            "height": "6-7",
            "weight": 216,
            "age": 22,
            "preDraftTeam": "Virginia",
            "draftStatus": "2024 Rnd 1 Pick 28",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Anthony Gill",
            "team": "Washington Wizards",
            "position": "PF",
            "height": "6-7",
            "weight": 230,
            "age": 33,
            "preDraftTeam": "Virginia",
            "draftStatus": "2016 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Sam Hauser",
            "team": "Boston Celtics",
            "position": "SF",
            "height": "6-7",
            "weight": 217,
            "age": 27,
            "preDraftTeam": "Virginia",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "James Huff",
            "team": "Indiana Pacers",
            "position": "C",
            "height": "7-1",
            "weight": 240,
            "age": 28,
            "preDraftTeam": "Virginia",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "De'Andre Hunter",
            "team": "Cleveland Cavaliers",
            "position": "PF",
            "height": "6-7",
            "weight": 221,
            "age": 28,
            "preDraftTeam": "Virginia",
            "draftStatus": "2019 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Ty Jerome",
            "team": "Memphis Grizzlies",
            "position": "PG",
            "height": "6-5",
            "weight": 195,
            "age": 28,
            "preDraftTeam": "Virginia",
            "draftStatus": "2019 Rnd 1 Pick 24",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Trey Murphy III",
            "team": "New Orleans Pelicans",
            "position": "G",
            "height": "6-8",
            "weight": 206,
            "age": 25,
            "preDraftTeam": "Virginia",
            "draftStatus": "2021 Rnd 1 Pick 17",
            "nationality": "United States",
            "yos": 4
        }
    ],
    "LSU": [
        {
            "name": "Tari Eason",
            "team": "Houston Rockets",
            "position": "F",
            "height": "6-8",
            "weight": 215,
            "age": 24,
            "preDraftTeam": "LSU",
            "draftStatus": "2022 Rnd 1 Pick 17",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Duop Reath",
            "team": "Portland Trail Blazers",
            "position": "C",
            "height": "6-9",
            "weight": 245,
            "age": 29,
            "preDraftTeam": "LSU",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "Australia",
            "yos": 2
        },
        {
            "name": "Naz Reid",
            "team": "Minnesota Timberwolves",
            "position": "C",
            "height": "6-9",
            "weight": 264,
            "age": 26,
            "preDraftTeam": "LSU",
            "draftStatus": "2019 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Garrett Temple",
            "team": "Toronto Raptors",
            "position": "G",
            "height": "6-5",
            "weight": 195,
            "age": 39,
            "preDraftTeam": "LSU",
            "draftStatus": "2009 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 15
        },
        {
            "name": "Cam Thomas",
            "team": "Brooklyn Nets",
            "position": "PG",
            "height": "6-3",
            "weight": 210,
            "age": 24,
            "preDraftTeam": "LSU",
            "draftStatus": "2021 Rnd 1 Pick 27",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Trendon Watford",
            "team": "Philadelphia Sixers",
            "position": "SF",
            "height": "6-8",
            "weight": 237,
            "age": 25,
            "preDraftTeam": "LSU",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 4
        }
    ],
    "Purdue": [
        {
            "name": "Zach Edey",
            "team": "Memphis Grizzlies",
            "position": "C",
            "height": "7-3",
            "weight": 305,
            "age": 23,
            "preDraftTeam": "Purdue",
            "draftStatus": "2024 Rnd 1 Pick 9",
            "nationality": "Canada",
            "yos": 1
        },
        {
            "name": "Jaden Ivey",
            "team": "Detroit Pistons",
            "position": "G",
            "height": "6-3",
            "weight": 195,
            "age": 23,
            "preDraftTeam": "Purdue",
            "draftStatus": "2022 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Baylor": [
        {
            "name": "V.J. Edgecombe",
            "team": "Philadelphia Sixers",
            "position": "F",
            "height": "6-4",
            "weight": 180,
            "age": 20,
            "preDraftTeam": "Baylor",
            "draftStatus": "2025 Rnd 1 Pick 3",
            "nationality": "United States/Bahamas",
            "yos": 0
        },
        {
            "name": "Keyonte George",
            "team": "Utah Jazz",
            "position": "G",
            "height": "6-4",
            "weight": 185,
            "age": 22,
            "preDraftTeam": "Baylor",
            "draftStatus": "2023 Rnd 1 Pick 16",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Yves Missi",
            "team": "New Orleans Pelicans",
            "position": "C",
            "height": "6-11",
            "weight": 235,
            "age": 21,
            "preDraftTeam": "Baylor",
            "draftStatus": "2024 Rnd 1 Pick 21",
            "nationality": "Cameroon",
            "yos": 1
        },
        {
            "name": "Davion Mitchell",
            "team": "Miami Heat",
            "position": "PG",
            "height": "6-0",
            "weight": 202,
            "age": 27,
            "preDraftTeam": "Baylor",
            "draftStatus": "2021 Rnd 1 Pick 9",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Royce O'Neale",
            "team": "Phoenix Suns",
            "position": "SF",
            "height": "6-6",
            "weight": 226,
            "age": 32,
            "preDraftTeam": "Baylor",
            "draftStatus": "2015 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Taurean Prince",
            "team": "Milwaukee Bucks",
            "position": "F",
            "height": "6-6",
            "weight": 218,
            "age": 31,
            "preDraftTeam": "Baylor",
            "draftStatus": "2016 Rnd 1 Pick 12",
            "nationality": "United States",
            "yos": 9
        },
        {
            "name": "Jeremy Sochan",
            "team": "San Antonio Spurs",
            "position": "SG",
            "height": "6-8",
            "weight": 230,
            "age": 22,
            "preDraftTeam": "Baylor",
            "draftStatus": "2022 Rnd 1 Pick 9",
            "nationality": "United States/Poland",
            "yos": 3
        },
        {
            "name": "Ja'Kobe Walter",
            "team": "Toronto Raptors",
            "position": "F",
            "height": "6-4",
            "weight": 180,
            "age": 21,
            "preDraftTeam": "Baylor",
            "draftStatus": "2024 Rnd 1 Pick 19",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Wichita State": [
        {
            "name": "Tyson Etienne",
            "team": "Brooklyn Nets",
            "position": "G",
            "height": "6-0",
            "weight": 200,
            "age": 26,
            "preDraftTeam": "Wichita State",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Craig Porter, Jr.",
            "team": "Cleveland Cavaliers",
            "position": "G",
            "height": "6-1",
            "weight": 180,
            "age": 25,
            "preDraftTeam": "Wichita State",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Landry Shamet",
            "team": "New York Knicks",
            "position": "PG",
            "height": "6-5",
            "weight": 190,
            "age": 28,
            "preDraftTeam": "Wichita State",
            "draftStatus": "2018 Rnd 1 Pick 26",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Fred VanVleet",
            "team": "Houston Rockets",
            "position": "G",
            "height": "6-0",
            "weight": 197,
            "age": 31,
            "preDraftTeam": "Wichita State",
            "draftStatus": "2016 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 9
        }
    ],
    "Oregon State": [
        {
            "name": "Drew Eubanks",
            "team": "Sacramento Kings",
            "position": "C",
            "height": "6-10",
            "weight": 245,
            "age": 28,
            "preDraftTeam": "Oregon State",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Gary Payton II",
            "team": "Golden State Warriors",
            "position": "G",
            "height": "6-2",
            "weight": 195,
            "age": 33,
            "preDraftTeam": "Oregon State",
            "draftStatus": "2016 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 9
        },
        {
            "name": "Ethan Thompson",
            "team": "Indiana Pacers",
            "position": "SG",
            "height": "6-4",
            "weight": 195,
            "age": 26,
            "preDraftTeam": "Oregon State",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States/Puerto Rico",
            "yos": 1
        }
    ],
    "Princeton": [
        {
            "name": "Tosan Evbuomwan",
            "team": "New York Knicks",
            "position": "SF",
            "height": "6-8",
            "weight": 217,
            "age": 24,
            "preDraftTeam": "Princeton",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "England",
            "yos": 2
        }
    ],
    "Australian Institute of Sport (Australian Capital Territory)": [
        {
            "name": "Dante Exum",
            "team": "Dallas Mavericks",
            "position": "PG",
            "height": "6-5",
            "weight": 214,
            "age": 30,
            "preDraftTeam": "Australian Institute of Sport (Australian Capital Territory)",
            "draftStatus": "2014 Rnd 1 Pick 5",
            "nationality": "Australia",
            "yos": 9
        }
    ],
    "Oklahoma": [
        {
            "name": "Jeremiah Fears",
            "team": "New Orleans Pelicans",
            "position": "G",
            "height": "6-3",
            "weight": 190,
            "age": 19,
            "preDraftTeam": "Oklahoma",
            "draftStatus": "2025 Rnd 1 Pick 7",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Buddy Hield",
            "team": "Golden State Warriors",
            "position": "G",
            "height": "6-4",
            "weight": 220,
            "age": 32,
            "preDraftTeam": "Oklahoma",
            "draftStatus": "2016 Rnd 1 Pick 6",
            "nationality": "Bahamas",
            "yos": 9
        },
        {
            "name": "Austin Reaves",
            "team": "Los Angeles Lakers",
            "position": "PG",
            "height": "6-5",
            "weight": 197,
            "age": 27,
            "preDraftTeam": "Oklahoma",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Trae Young",
            "team": "Atlanta Hawks",
            "position": "PG",
            "height": "6-2",
            "weight": 164,
            "age": 27,
            "preDraftTeam": "Oklahoma",
            "draftStatus": "2018 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 7
        }
    ],
    "Saint Joseph's": [
        {
            "name": "Rasheer Fleming",
            "team": "Phoenix Suns",
            "position": "F",
            "height": "6-9",
            "weight": 240,
            "age": 21,
            "preDraftTeam": "Saint Joseph's",
            "draftStatus": "2025 Rnd 2 Pick 1",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Adelaide (Australia)": [
        {
            "name": "Trentyn Flowers",
            "team": "Chicago Bulls",
            "position": "F",
            "height": "6-9",
            "weight": 185,
            "age": 21,
            "preDraftTeam": "Adelaide (Australia)",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Josh Giddey",
            "team": "Chicago Bulls",
            "position": "G",
            "height": "6-7",
            "weight": 216,
            "age": 23,
            "preDraftTeam": "Adelaide (Australia)",
            "draftStatus": "2021 Rnd 1 Pick 6",
            "nationality": "Australia",
            "yos": 4
        }
    ],
    "AX Armani Exchange Milan (Italy)": [
        {
            "name": "Simone Fontecchio",
            "team": "Miami Heat",
            "position": "SF",
            "height": "6-7",
            "weight": 209,
            "age": 29,
            "preDraftTeam": "AX Armani Exchange Milan (Italy)",
            "draftStatus": "2017 NBA Draft, Undrafted",
            "nationality": "Italy",
            "yos": 3
        }
    ],
    "Akron": [
        {
            "name": "Enrique Freeman",
            "team": "Minnesota Timberwolves",
            "position": "F",
            "height": "6-9",
            "weight": 220,
            "age": 25,
            "preDraftTeam": "Akron",
            "draftStatus": "2024 Rnd 2 Pick 20",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Little Rock": [
        {
            "name": "Myron Gardner",
            "team": "Miami Heat",
            "position": "G",
            "height": "6-5",
            "weight": 220,
            "age": 24,
            "preDraftTeam": "Little Rock",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Vanderbilt": [
        {
            "name": "Darius Garland",
            "team": "Cleveland Cavaliers",
            "position": "G",
            "height": "6-1",
            "weight": 192,
            "age": 25,
            "preDraftTeam": "Vanderbilt",
            "draftStatus": "2019 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Luke Kornet",
            "team": "San Antonio Spurs",
            "position": "F",
            "height": "7-1",
            "weight": 250,
            "age": 30,
            "preDraftTeam": "Vanderbilt",
            "draftStatus": "2017 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Chris Manon",
            "team": "Los Angeles Lakers",
            "position": "G",
            "height": "6-4",
            "weight": 209,
            "age": 24,
            "preDraftTeam": "Vanderbilt",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Aaron Nesmith",
            "team": "Indiana Pacers",
            "position": "F",
            "height": "6-5",
            "weight": 215,
            "age": 26,
            "preDraftTeam": "Vanderbilt",
            "draftStatus": "2020 Rnd 1 Pick 14",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Scotty Pippen, Jr.",
            "team": "Memphis Grizzlies",
            "position": "G",
            "height": "6-2",
            "weight": 170,
            "age": 25,
            "preDraftTeam": "Vanderbilt",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Iowa": [
        {
            "name": "Luka Garza",
            "team": "Boston Celtics",
            "position": "C",
            "height": "6-10",
            "weight": 243,
            "age": 26,
            "preDraftTeam": "Iowa",
            "draftStatus": "2021 Rnd 2 Pick 22",
            "nationality": "United States/Bosnia and Herzegovina",
            "yos": 4
        },
        {
            "name": "Keegan Murray",
            "team": "Sacramento Kings",
            "position": "F",
            "height": "6-8",
            "weight": 225,
            "age": 25,
            "preDraftTeam": "Iowa",
            "draftStatus": "2022 Rnd 1 Pick 4",
            "nationality": "United States",
            "yos": 3
        },
        {
            "name": "Kris Murray",
            "team": "Portland Trail Blazers",
            "position": "F",
            "height": "6-8",
            "weight": 218,
            "age": 25,
            "preDraftTeam": "Iowa",
            "draftStatus": "2023 Rnd 1 Pick 23",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Fresno State": [
        {
            "name": "Paul George",
            "team": "Philadelphia Sixers",
            "position": "GF",
            "height": "6-8",
            "weight": 220,
            "age": 35,
            "preDraftTeam": "Fresno State",
            "draftStatus": "2010 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 15
        },
        {
            "name": "Orlando Robinson",
            "team": "Orlando Magic",
            "position": "PF",
            "height": "6-10",
            "weight": 235,
            "age": 25,
            "preDraftTeam": "Fresno State",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Saint Louis": [
        {
            "name": "Jordan Goodwin",
            "team": "Phoenix Suns",
            "position": "SG",
            "height": "6-3",
            "weight": 215,
            "age": 27,
            "preDraftTeam": "Saint Louis",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 4
        }
    ],
    "Syracuse": [
        {
            "name": "Jerami Grant",
            "team": "Portland Trail Blazers",
            "position": "F",
            "height": "6-7",
            "weight": 213,
            "age": 31,
            "preDraftTeam": "Syracuse",
            "draftStatus": "2014 Rnd 2 Pick 9",
            "nationality": "United States",
            "yos": 11
        }
    ],
    "Northern Iowa": [
        {
            "name": "A.J. Green",
            "team": "Milwaukee Bucks",
            "position": "PG",
            "height": "6-4",
            "weight": 190,
            "age": 26,
            "preDraftTeam": "Northern Iowa",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Radford": [
        {
            "name": "Javonte Green",
            "team": "Detroit Pistons",
            "position": "G",
            "height": "6-5",
            "weight": 205,
            "age": 32,
            "preDraftTeam": "Radford",
            "draftStatus": "2015 NBA Draft, Undrafted",
            "nationality": "United States/Montenegro",
            "yos": 6
        }
    ],
    "Georgetown": [
        {
            "name": "Jeff Green",
            "team": "Houston Rockets",
            "position": "F",
            "height": "6-8",
            "weight": 235,
            "age": 39,
            "preDraftTeam": "Georgetown",
            "draftStatus": "2007 Rnd 1 Pick 5",
            "nationality": "United States",
            "yos": 17
        },
        {
            "name": "Micah Peavy",
            "team": "New Orleans Pelicans",
            "position": "SF",
            "height": "6-7",
            "weight": 215,
            "age": 24,
            "preDraftTeam": "Georgetown",
            "draftStatus": "2025 Rnd 2 Pick 10",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Thomas Sorber",
            "team": "Oklahoma City Thunder",
            "position": "FC",
            "height": "6-9",
            "weight": 250,
            "age": 19,
            "preDraftTeam": "Georgetown",
            "draftStatus": "2025 Rnd 1 Pick 15",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Iowa State": [
        {
            "name": "Tyrese Haliburton",
            "team": "Indiana Pacers",
            "position": "PG",
            "height": "6-5",
            "weight": 185,
            "age": 25,
            "preDraftTeam": "Iowa State",
            "draftStatus": "2020 Rnd 1 Pick 12",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Curtis Jones",
            "team": "Denver Nuggets",
            "position": "G",
            "height": "6-3",
            "weight": 195,
            "age": 24,
            "preDraftTeam": "Iowa State",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Georges Niang",
            "team": "Utah Jazz",
            "position": "F",
            "height": "6-6",
            "weight": 230,
            "age": 32,
            "preDraftTeam": "Iowa State",
            "draftStatus": "2016 Rnd 2 Pick 20",
            "nationality": "United States",
            "yos": 9
        }
    ],
    "Qingdao (China)": [
        {
            "name": "Yang Hansen",
            "team": "Portland Trail Blazers",
            "position": "C",
            "height": "7-1",
            "weight": 270,
            "age": 20,
            "preDraftTeam": "Qingdao (China)",
            "draftStatus": "2025 Rnd 1 Pick 16",
            "nationality": "China",
            "yos": 0
        }
    ],
    "UNLV": [
        {
            "name": "E.J. Harkless",
            "team": "Utah Jazz",
            "position": "PG",
            "height": "6-3",
            "weight": 195,
            "age": 25,
            "preDraftTeam": "UNLV",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Derrick Jones",
            "team": "Los Angeles Clippers",
            "position": "SF",
            "height": "6-6",
            "weight": 210,
            "age": 28,
            "preDraftTeam": "UNLV",
            "draftStatus": "2016 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 9
        }
    ],
    "Tennessee": [
        {
            "name": "Tobias Harris",
            "team": "Detroit Pistons",
            "position": "F",
            "height": "6-8",
            "weight": 226,
            "age": 33,
            "preDraftTeam": "Tennessee",
            "draftStatus": "2011 Rnd 1 Pick 19",
            "nationality": "United States",
            "yos": 14
        },
        {
            "name": "Dalton Knecht",
            "team": "Los Angeles Lakers",
            "position": "F",
            "height": "6-6",
            "weight": 215,
            "age": 24,
            "preDraftTeam": "Tennessee",
            "draftStatus": "2024 Rnd 1 Pick 17",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Chaz Lanier",
            "team": "Detroit Pistons",
            "position": "G",
            "height": "6-3",
            "weight": 206,
            "age": 23,
            "preDraftTeam": "Tennessee",
            "draftStatus": "2025 Rnd 2 Pick 7",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Jahmai Mashack",
            "team": "Memphis Grizzlies",
            "position": "F",
            "height": "6-4",
            "weight": 203,
            "age": 24,
            "preDraftTeam": "Tennessee",
            "draftStatus": "2025 Rnd 2 Pick 29",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Julian Phillips",
            "team": "Chicago Bulls",
            "position": "F",
            "height": "6-6",
            "weight": 198,
            "age": 22,
            "preDraftTeam": "Tennessee",
            "draftStatus": "2023 Rnd 2 Pick 5",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Grant Williams",
            "team": "Charlotte Hornets",
            "position": "SF",
            "height": "6-7",
            "weight": 236,
            "age": 27,
            "preDraftTeam": "Tennessee",
            "draftStatus": "2019 Rnd 1 Pick 22",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "Zalgiris (Lithuania)": [
        {
            "name": "Isaiah Hartenstein",
            "team": "Oklahoma City Thunder",
            "position": "PF",
            "height": "7-0",
            "weight": 250,
            "age": 27,
            "preDraftTeam": "Zalgiris (Lithuania)",
            "draftStatus": "2017 Rnd 2 Pick 13",
            "nationality": "United States/Germany",
            "yos": 7
        }
    ],
    "Wisconsin": [
        {
            "name": "Nigel Hayes-Davis",
            "team": "Phoenix Suns",
            "position": "F",
            "height": "6-7",
            "weight": 254,
            "age": 30,
            "preDraftTeam": "Wisconsin",
            "draftStatus": "2017 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "John Tonje",
            "team": "Utah Jazz",
            "position": "GF",
            "height": "6-4",
            "weight": 218,
            "age": 25,
            "preDraftTeam": "Wisconsin",
            "draftStatus": "2025 Rnd 2 Pick 23",
            "nationality": "United States/Cameroon",
            "yos": 0
        }
    ],
    "UCF": [
        {
            "name": "Taylor Hendricks",
            "team": "Utah Jazz",
            "position": "F",
            "height": "6-9",
            "weight": 215,
            "age": 22,
            "preDraftTeam": "UCF",
            "draftStatus": "2023 Rnd 1 Pick 9",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Louisville": [
        {
            "name": "Chucky Hepburn",
            "team": "Toronto Raptors",
            "position": "G",
            "height": "6-0",
            "weight": 190,
            "age": 23,
            "preDraftTeam": "Louisville",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Donovan Mitchell",
            "team": "Cleveland Cavaliers",
            "position": "SG",
            "height": "6-2",
            "weight": 215,
            "age": 29,
            "preDraftTeam": "Louisville",
            "draftStatus": "2017 Rnd 1 Pick 13",
            "nationality": "United States",
            "yos": 8
        },
        {
            "name": "Terry Rozier",
            "team": "Miami Heat",
            "position": "G",
            "height": "6-1",
            "weight": 190,
            "age": 31,
            "preDraftTeam": "Louisville",
            "draftStatus": "2015 Rnd 1 Pick 16",
            "nationality": "United States",
            "yos": 10
        }
    ],
    "Wheeling": [
        {
            "name": "Haywood Highsmith",
            "team": "Brooklyn Nets",
            "position": "F",
            "height": "6-5",
            "weight": 220,
            "age": 28,
            "preDraftTeam": "Wheeling",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 5
        }
    ],
    "Maryland": [
        {
            "name": "Kevin Huerter",
            "team": "Chicago Bulls",
            "position": "SF",
            "height": "6-6",
            "weight": 198,
            "age": 27,
            "preDraftTeam": "Maryland",
            "draftStatus": "2018 Rnd 1 Pick 19",
            "nationality": "United States",
            "yos": 7
        },
        {
            "name": "Derik Queen",
            "team": "New Orleans Pelicans",
            "position": "C",
            "height": "6-9",
            "weight": 250,
            "age": 20,
            "preDraftTeam": "Maryland",
            "draftStatus": "2025 Rnd 1 Pick 13",
            "nationality": "United States",
            "yos": 0
        },
        {
            "name": "Jalen Smith",
            "team": "Chicago Bulls",
            "position": "C",
            "height": "6-8",
            "weight": 215,
            "age": 25,
            "preDraftTeam": "Maryland",
            "draftStatus": "2020 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Aaron Wiggins",
            "team": "Oklahoma City Thunder",
            "position": "F",
            "height": "6-5",
            "weight": 190,
            "age": 26,
            "preDraftTeam": "Maryland",
            "draftStatus": "2021 Rnd 2 Pick 25",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Jahmir Young",
            "team": "Miami Heat",
            "position": "PG",
            "height": "6-0",
            "weight": 185,
            "age": 25,
            "preDraftTeam": "Maryland",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "MHP Riesen (Germany)": [
        {
            "name": "Ariel Hukporti",
            "team": "New York Knicks",
            "position": "C",
            "height": "7-0",
            "weight": 246,
            "age": 23,
            "preDraftTeam": "MHP Riesen (Germany)",
            "draftStatus": "2024 Rnd 2 Pick 28",
            "nationality": "Germany/Togo",
            "yos": 1
        }
    ],
    "VCU": [
        {
            "name": "Bones Hyland",
            "team": "Minnesota Timberwolves",
            "position": "G",
            "height": "6-2",
            "weight": 169,
            "age": 25,
            "preDraftTeam": "VCU",
            "draftStatus": "2021 Rnd 1 Pick 26",
            "nationality": "United States",
            "yos": 4
        },
        {
            "name": "Max Shulga",
            "team": "Boston Celtics",
            "position": "G",
            "height": "6-4",
            "weight": 210,
            "age": 24,
            "preDraftTeam": "VCU",
            "draftStatus": "2025 Rnd 2 Pick 27",
            "nationality": "Ukraine",
            "yos": 0
        },
        {
            "name": "Vincent Williams, Jr.",
            "team": "Memphis Grizzlies",
            "position": "SF",
            "height": "6-4",
            "weight": 205,
            "age": 25,
            "preDraftTeam": "VCU",
            "draftStatus": "2022 Rnd 2 Pick 17",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Melbourne South (Australia)": [
        {
            "name": "Joe Ingles",
            "team": "Minnesota Timberwolves",
            "position": "F",
            "height": "6-8",
            "weight": 220,
            "age": 38,
            "preDraftTeam": "Melbourne South (Australia)",
            "draftStatus": "2009 NBA Draft, Undrafted",
            "nationality": "Australia",
            "yos": 11
        }
    ],
    "South Carolina": [
        {
            "name": "G.G. Jackson",
            "team": "Memphis Grizzlies",
            "position": "PF",
            "height": "6-9",
            "weight": 210,
            "age": 20,
            "preDraftTeam": "South Carolina",
            "draftStatus": "2023 Rnd 2 Pick 15",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "A.J. Lawson",
            "team": "Toronto Raptors",
            "position": "F",
            "height": "6-6",
            "weight": 179,
            "age": 25,
            "preDraftTeam": "South Carolina",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "Canada",
            "yos": 3
        },
        {
            "name": "Collin Murray-Boyles",
            "team": "Toronto Raptors",
            "position": "F",
            "height": "6-7",
            "weight": 245,
            "age": 20,
            "preDraftTeam": "South Carolina",
            "draftStatus": "2025 Rnd 1 Pick 9",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "St. Vincent St. Mary High School (Ohio)": [
        {
            "name": "LeBron James",
            "team": "Los Angeles Lakers",
            "position": "F",
            "height": "6-9",
            "weight": 250,
            "age": 40,
            "preDraftTeam": "St. Vincent St. Mary High School (Ohio)",
            "draftStatus": "2003 Rnd 1 Pick 1",
            "nationality": "United States",
            "yos": 22
        }
    ],
    "UAB": [
        {
            "name": "Trey Jemison",
            "team": "New York Knicks",
            "position": "PF",
            "height": "6-10",
            "weight": 270,
            "age": 26,
            "preDraftTeam": "UAB",
            "draftStatus": "2023 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Stanford": [
        {
            "name": "Spencer Jones",
            "team": "Denver Nuggets",
            "position": "SF",
            "height": "6-7",
            "weight": 225,
            "age": 25,
            "preDraftTeam": "Stanford",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        },
        {
            "name": "Brook Lopez",
            "team": "Los Angeles Clippers",
            "position": "C",
            "height": "7-1",
            "weight": 282,
            "age": 37,
            "preDraftTeam": "Stanford",
            "draftStatus": "2008 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 17
        },
        {
            "name": "Dwight Powell",
            "team": "Dallas Mavericks",
            "position": "PF",
            "height": "6-10",
            "weight": 240,
            "age": 34,
            "preDraftTeam": "Stanford",
            "draftStatus": "2014 Rnd 2 Pick 15",
            "nationality": "Canada",
            "yos": 11
        },
        {
            "name": "Maxime Raynaud",
            "team": "Sacramento Kings",
            "position": "C",
            "height": "7-1",
            "weight": 250,
            "age": 22,
            "preDraftTeam": "Stanford",
            "draftStatus": "2025 Rnd 2 Pick 12",
            "nationality": "France",
            "yos": 0
        },
        {
            "name": "Ziaire Williams",
            "team": "Brooklyn Nets",
            "position": "F",
            "height": "6-9",
            "weight": 185,
            "age": 24,
            "preDraftTeam": "Stanford",
            "draftStatus": "2021 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 4
        }
    ],
    "s.Oliver Baskets (Germany)": [
        {
            "name": "Maxi Kleber",
            "team": "Los Angeles Lakers",
            "position": "PF",
            "height": "6-10",
            "weight": 240,
            "age": 33,
            "preDraftTeam": "s.Oliver Baskets (Germany)",
            "draftStatus": "2014 NBA Draft, Undrafted",
            "nationality": "Germany",
            "yos": 8
        }
    ],
    "Cairns (Australia)": [
        {
            "name": "Bobi Klintman",
            "team": "Detroit Pistons",
            "position": "F",
            "height": "6-9",
            "weight": 225,
            "age": 22,
            "preDraftTeam": "Cairns (Australia)",
            "draftStatus": "2024 Rnd 2 Pick 7",
            "nationality": "Sweden",
            "yos": 1
        }
    ],
    "Fort Wayne": [
        {
            "name": "John Konchar",
            "team": "Memphis Grizzlies",
            "position": "G",
            "height": "6-5",
            "weight": 210,
            "age": 29,
            "preDraftTeam": "Fort Wayne",
            "draftStatus": "2019 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "Zaragoza U18 (Spain)": [
        {
            "name": "Vit Krejci",
            "team": "Atlanta Hawks",
            "position": "PG",
            "height": "6-8",
            "weight": 195,
            "age": 25,
            "preDraftTeam": "Zaragoza U18 (Spain)",
            "draftStatus": "2020 Rnd 2 Pick 7",
            "nationality": "Czech Republic",
            "yos": 4
        }
    ],
    "Saint Mary's": [
        {
            "name": "Jock Landale",
            "team": "Memphis Grizzlies",
            "position": "C",
            "height": "6-11",
            "weight": 255,
            "age": 30,
            "preDraftTeam": "Saint Mary's",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "Australia",
            "yos": 4
        }
    ],
    "San Diego State": [
        {
            "name": "Kawhi Leonard",
            "team": "Los Angeles Clippers",
            "position": "F",
            "height": "6-6",
            "weight": 225,
            "age": 34,
            "preDraftTeam": "San Diego State",
            "draftStatus": "2011 Rnd 1 Pick 15",
            "nationality": "United States",
            "yos": 14
        }
    ],
    "Weber State": [
        {
            "name": "Damian Lillard",
            "team": "Portland Trail Blazers",
            "position": "G",
            "height": "6-2",
            "weight": 200,
            "age": 35,
            "preDraftTeam": "Weber State",
            "draftStatus": "2012 Rnd 1 Pick 6",
            "nationality": "United States",
            "yos": 13
        }
    ],
    "Seton Hall": [
        {
            "name": "Sandro Mamukelashvili",
            "team": "Toronto Raptors",
            "position": "F",
            "height": "6-9",
            "weight": 240,
            "age": 26,
            "preDraftTeam": "Seton Hall",
            "draftStatus": "2021 Rnd 2 Pick 24",
            "nationality": "Georgia",
            "yos": 4
        }
    ],
    "Xavier": [
        {
            "name": "Naji Marshall",
            "team": "Dallas Mavericks",
            "position": "SF",
            "height": "6-6",
            "weight": 220,
            "age": 27,
            "preDraftTeam": "Xavier",
            "draftStatus": "2020 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 5
        }
    ],
    "Nevada": [
        {
            "name": "Caleb Martin",
            "team": "Dallas Mavericks",
            "position": "F",
            "height": "6-5",
            "weight": 205,
            "age": 30,
            "preDraftTeam": "Nevada",
            "draftStatus": "2019 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 6
        },
        {
            "name": "Kobe Sanders",
            "team": "Los Angeles Clippers",
            "position": "F",
            "height": "6-8",
            "weight": 207,
            "age": 25,
            "preDraftTeam": "Nevada",
            "draftStatus": "2025 Rnd 2 Pick 20",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Lipscomb": [
        {
            "name": "Garrison Mathews",
            "team": "Indiana Pacers",
            "position": "SG",
            "height": "6-5",
            "weight": 215,
            "age": 29,
            "preDraftTeam": "Lipscomb",
            "draftStatus": "2019 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "Lehigh": [
        {
            "name": "C.J. McCollum",
            "team": "Washington Wizards",
            "position": "G",
            "height": "6-3",
            "weight": 190,
            "age": 34,
            "preDraftTeam": "Lehigh",
            "draftStatus": "2013 Rnd 1 Pick 10",
            "nationality": "United States",
            "yos": 12
        }
    ],
    "Washington": [
        {
            "name": "Jaden McDaniels",
            "team": "Minnesota Timberwolves",
            "position": "F",
            "height": "6-9",
            "weight": 185,
            "age": 25,
            "preDraftTeam": "Washington",
            "draftStatus": "2020 Rnd 1 Pick 28",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Dejounte Murray",
            "team": "New Orleans Pelicans",
            "position": "SG",
            "height": "6-4",
            "weight": 180,
            "age": 29,
            "preDraftTeam": "Washington",
            "draftStatus": "2016 Rnd 1 Pick 29",
            "nationality": "United States",
            "yos": 9
        },
        {
            "name": "Isaiah Stewart II",
            "team": "Detroit Pistons",
            "position": "C",
            "height": "6-8",
            "weight": 250,
            "age": 24,
            "preDraftTeam": "Washington",
            "draftStatus": "2020 Rnd 1 Pick 16",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Matisse Thybulle",
            "team": "Portland Trail Blazers",
            "position": "SF",
            "height": "6-5",
            "weight": 202,
            "age": 28,
            "preDraftTeam": "Washington",
            "draftStatus": "2019 Rnd 1 Pick 20",
            "nationality": "United States/Australia",
            "yos": 6
        }
    ],
    "Nebraska": [
        {
            "name": "Bryce McGowens",
            "team": "New Orleans Pelicans",
            "position": "GF",
            "height": "6-6",
            "weight": 190,
            "age": 23,
            "preDraftTeam": "Nebraska",
            "draftStatus": "2022 Rnd 2 Pick 10",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Utah State": [
        {
            "name": "Sam Merrill",
            "team": "Cleveland Cavaliers",
            "position": "G",
            "height": "6-4",
            "weight": 205,
            "age": 29,
            "preDraftTeam": "Utah State",
            "draftStatus": "2020 Rnd 2 Pick 30",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Neemias Queta",
            "team": "Boston Celtics",
            "position": "C",
            "height": "7-0",
            "weight": 248,
            "age": 26,
            "preDraftTeam": "Utah State",
            "draftStatus": "2021 Rnd 2 Pick 9",
            "nationality": "Portugal",
            "yos": 4
        }
    ],
    "Morehead State": [
        {
            "name": "Riley Minix",
            "team": "San Antonio Spurs",
            "position": "SF",
            "height": "6-7",
            "weight": 230,
            "age": 25,
            "preDraftTeam": "Morehead State",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "UC Santa Barbara": [
        {
            "name": "Ajay Mitchell",
            "team": "Oklahoma City Thunder",
            "position": "PG",
            "height": "6-4",
            "weight": 190,
            "age": 23,
            "preDraftTeam": "UC Santa Barbara",
            "draftStatus": "2024 Rnd 2 Pick 8",
            "nationality": "Belgium",
            "yos": 1
        },
        {
            "name": "Gabe Vincent",
            "team": "Los Angeles Lakers",
            "position": "G",
            "height": "6-2",
            "weight": 200,
            "age": 29,
            "preDraftTeam": "UC Santa Barbara",
            "draftStatus": "2018 NBA Draft, Undrafted",
            "nationality": "United States/Nigeria",
            "yos": 6
        }
    ],
    "Murray State": [
        {
            "name": "Ja Morant",
            "team": "Memphis Grizzlies",
            "position": "G",
            "height": "6-2",
            "weight": 174,
            "age": 26,
            "preDraftTeam": "Murray State",
            "draftStatus": "2019 Rnd 1 Pick 2",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "Wyoming": [
        {
            "name": "Larry Nance, Jr.",
            "team": "Cleveland Cavaliers",
            "position": "SF",
            "height": "6-6",
            "weight": 245,
            "age": 32,
            "preDraftTeam": "Wyoming",
            "draftStatus": "2015 Rnd 1 Pick 27",
            "nationality": "United States",
            "yos": 10
        }
    ],
    "Penn State": [
        {
            "name": "Yanic Konan Niederhauser",
            "team": "Los Angeles Clippers",
            "position": "F",
            "height": "6-11",
            "weight": 242,
            "age": 22,
            "preDraftTeam": "Penn State",
            "draftStatus": "2025 Rnd 1 Pick 30",
            "nationality": "Switzerland",
            "yos": 0
        },
        {
            "name": "Jalen Pickett",
            "team": "Denver Nuggets",
            "position": "F",
            "height": "6-2",
            "weight": 202,
            "age": 26,
            "preDraftTeam": "Penn State",
            "draftStatus": "2023 Rnd 2 Pick 2",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Liberty": [
        {
            "name": "Taelon Peter",
            "team": "Indiana Pacers",
            "position": "G",
            "height": "6-3",
            "weight": 185,
            "age": 25,
            "preDraftTeam": "Liberty",
            "draftStatus": "2025 Rnd 2 Pick 24",
            "nationality": "United States",
            "yos": 0
        }
    ],
    "Bowling Green": [
        {
            "name": "Daeqwon Plowden",
            "team": "Sacramento Kings",
            "position": "GF",
            "height": "6-4",
            "weight": 216,
            "age": 27,
            "preDraftTeam": "Bowling Green",
            "draftStatus": "2022 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Santa Clara": [
        {
            "name": "Brandin Podziemski",
            "team": "Golden State Warriors",
            "position": "G",
            "height": "6-4",
            "weight": 205,
            "age": 22,
            "preDraftTeam": "Santa Clara",
            "draftStatus": "2023 Rnd 1 Pick 19",
            "nationality": "United States",
            "yos": 2
        },
        {
            "name": "Jalen Williams",
            "team": "Oklahoma City Thunder",
            "position": "G",
            "height": "6-5",
            "weight": 211,
            "age": 24,
            "preDraftTeam": "Santa Clara",
            "draftStatus": "2022 Rnd 1 Pick 12",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Real Betis Baloncesto (Spain)": [
        {
            "name": "Kristaps Porzingis",
            "team": "Atlanta Hawks",
            "position": "FC",
            "height": "7-2",
            "weight": 240,
            "age": 30,
            "preDraftTeam": "Real Betis Baloncesto (Spain)",
            "draftStatus": "2015 Rnd 1 Pick 4",
            "nationality": "Latvia",
            "yos": 10
        }
    ],
    "Boston College": [
        {
            "name": "Quinten Post",
            "team": "Golden State Warriors",
            "position": "C",
            "height": "7-0",
            "weight": 238,
            "age": 25,
            "preDraftTeam": "Boston College",
            "draftStatus": "2024 Rnd 2 Pick 22",
            "nationality": "Netherlands",
            "yos": 1
        }
    ],
    "DePaul": [
        {
            "name": "Paul Reed, Jr.",
            "team": "Detroit Pistons",
            "position": "F",
            "height": "6-9",
            "weight": 210,
            "age": 26,
            "preDraftTeam": "DePaul",
            "draftStatus": "2020 Rnd 2 Pick 28",
            "nationality": "United States",
            "yos": 5
        },
        {
            "name": "Max Strus",
            "team": "Cleveland Cavaliers",
            "position": "G",
            "height": "6-5",
            "weight": 215,
            "age": 29,
            "preDraftTeam": "DePaul",
            "draftStatus": "2019 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "JL Bourg-en-Bresse (France)": [
        {
            "name": "Zaccharie Risacher",
            "team": "Atlanta Hawks",
            "position": "F",
            "height": "6-8",
            "weight": 200,
            "age": 20,
            "preDraftTeam": "JL Bourg-en-Bresse (France)",
            "draftStatus": "2024 Rnd 1 Pick 1",
            "nationality": "Spain/France",
            "yos": 1
        }
    ],
    "": [
        {
            "name": "Mitchell Robinson",
            "team": "New York Knicks",
            "position": "C",
            "height": "7-0",
            "weight": 240,
            "age": 27,
            "preDraftTeam": "",
            "draftStatus": "2018 Rnd 2 Pick 6",
            "nationality": "United States",
            "yos": 7
        }
    ],
    "Toledo": [
        {
            "name": "Ryan Rollins",
            "team": "Milwaukee Bucks",
            "position": "G",
            "height": "6-3",
            "weight": 180,
            "age": 23,
            "preDraftTeam": "Toledo",
            "draftStatus": "2022 Rnd 2 Pick 14",
            "nationality": "United States",
            "yos": 3
        }
    ],
    "Minas (Brazil)": [
        {
            "name": "Gui Santos",
            "team": "Golden State Warriors",
            "position": "GF",
            "height": "6-7",
            "weight": 185,
            "age": 23,
            "preDraftTeam": "Minas (Brazil)",
            "draftStatus": "2022 Rnd 2 Pick 25",
            "nationality": "Brazil/Portugal",
            "yos": 2
        }
    ],
    "KK Cibona (Croatia)": [
        {
            "name": "Dario Saric",
            "team": "Sacramento Kings",
            "position": "SF",
            "height": "6-10",
            "weight": 225,
            "age": 31,
            "preDraftTeam": "KK Cibona (Croatia)",
            "draftStatus": "2014 Rnd 1 Pick 12",
            "nationality": "Croatia",
            "yos": 9
        }
    ],
    "Perth (Australia)": [
        {
            "name": "Alex Sarr",
            "team": "Washington Wizards",
            "position": "FC",
            "height": "7-0",
            "weight": 205,
            "age": 20,
            "preDraftTeam": "Perth (Australia)",
            "draftStatus": "2024 Rnd 1 Pick 2",
            "nationality": "France",
            "yos": 1
        },
        {
            "name": "Luke Travers",
            "team": "Cleveland Cavaliers",
            "position": "F",
            "height": "6-6",
            "weight": 207,
            "age": 24,
            "preDraftTeam": "Perth (Australia)",
            "draftStatus": "2022 Rnd 2 Pick 26",
            "nationality": "Australia",
            "yos": 1
        }
    ],
    "Basketball Lowen Braunschweig (Germany)": [
        {
            "name": "Dennis Schroder",
            "team": "Sacramento Kings",
            "position": "PG",
            "height": "6-1",
            "weight": 175,
            "age": 32,
            "preDraftTeam": "Basketball Lowen Braunschweig (Germany)",
            "draftStatus": "2013 Rnd 1 Pick 17",
            "nationality": "Germany",
            "yos": 12
        }
    ],
    "Besiktas Icrypex (Turkey)": [
        {
            "name": "Alperen Sengun",
            "team": "Houston Rockets",
            "position": "C",
            "height": "6-11",
            "weight": 243,
            "age": 23,
            "preDraftTeam": "Besiktas Icrypex (Turkey)",
            "draftStatus": "2021 Rnd 1 Pick 16",
            "nationality": "Turkey",
            "yos": 4
        }
    ],
    "Belmont": [
        {
            "name": "Ben Sheppard",
            "team": "Indiana Pacers",
            "position": "G",
            "height": "6-6",
            "weight": 190,
            "age": 24,
            "preDraftTeam": "Belmont",
            "draftStatus": "2023 Rnd 1 Pick 26",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "New Mexico State": [
        {
            "name": "Pascal Siakam",
            "team": "Indiana Pacers",
            "position": "F",
            "height": "6-8",
            "weight": 245,
            "age": 31,
            "preDraftTeam": "New Mexico State",
            "draftStatus": "2016 Rnd 1 Pick 27",
            "nationality": "Cameroon",
            "yos": 9
        }
    ],
    "IMG Academy (Florida)": [
        {
            "name": "Anfernee Simons",
            "team": "Boston Celtics",
            "position": "SG",
            "height": "6-3",
            "weight": 200,
            "age": 26,
            "preDraftTeam": "IMG Academy (Florida)",
            "draftStatus": "2018 Rnd 1 Pick 24",
            "nationality": "United States",
            "yos": 7
        }
    ],
    "Mississippi State": [
        {
            "name": "Tolu Smith",
            "team": "Detroit Pistons",
            "position": "F",
            "height": "6-11",
            "weight": 250,
            "age": 25,
            "preDraftTeam": "Mississippi State",
            "draftStatus": "2024 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 1
        }
    ],
    "Butler": [
        {
            "name": "Jahmyl Telfort",
            "team": "Los Angeles Clippers",
            "position": "SF",
            "height": "6-7",
            "weight": 225,
            "age": 24,
            "preDraftTeam": "Butler",
            "draftStatus": "2025 NBA Draft, Undrafted",
            "nationality": "Canada",
            "yos": 0
        }
    ],
    "Sydney (Australia)": [
        {
            "name": "Alex Toohey",
            "team": "Golden State Warriors",
            "position": "F",
            "height": "6-8",
            "weight": 223,
            "age": 22,
            "preDraftTeam": "Sydney (Australia)",
            "draftStatus": "2025 Rnd 2 Pick 22",
            "nationality": "Australia",
            "yos": 0
        }
    ],
    "KK Crvena Zvezda (Serbia)": [
        {
            "name": "Nikola Topic",
            "team": "Oklahoma City Thunder",
            "position": "PG",
            "height": "6-6",
            "weight": 200,
            "age": 20,
            "preDraftTeam": "KK Crvena Zvezda (Serbia)",
            "draftStatus": "2024 Rnd 1 Pick 12",
            "nationality": "Serbia",
            "yos": 1
        }
    ],
    "Centre Federal Du Basket-Ball (France)": [
        {
            "name": "Nolan Traore",
            "team": "Brooklyn Nets",
            "position": "F",
            "height": "6-3",
            "weight": 185,
            "age": 19,
            "preDraftTeam": "Centre Federal Du Basket-Ball (France)",
            "draftStatus": "2025 Rnd 1 Pick 19",
            "nationality": "France",
            "yos": 0
        }
    ],
    "Clemson": [
        {
            "name": "Hunter Tyson",
            "team": "Denver Nuggets",
            "position": "SF",
            "height": "6-8",
            "weight": 215,
            "age": 25,
            "preDraftTeam": "Clemson",
            "draftStatus": "2023 Rnd 2 Pick 7",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Lietuvos Rytas (Lithuania)": [
        {
            "name": "Jonas Valanciunas",
            "team": "Denver Nuggets",
            "position": "C",
            "height": "6-11",
            "weight": 265,
            "age": 33,
            "preDraftTeam": "Lietuvos Rytas (Lithuania)",
            "draftStatus": "2011 Rnd 1 Pick 5",
            "nationality": "Lithuania",
            "yos": 13
        }
    ],
    "Kansas State": [
        {
            "name": "Dean Wade",
            "team": "Cleveland Cavaliers",
            "position": "PF",
            "height": "6-9",
            "weight": 228,
            "age": 29,
            "preDraftTeam": "Kansas State",
            "draftStatus": "2019 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 6
        }
    ],
    "Texas-San Antonio": [
        {
            "name": "Keaton Wallace",
            "team": "Atlanta Hawks",
            "position": "G",
            "height": "6-3",
            "weight": 185,
            "age": 26,
            "preDraftTeam": "Texas-San Antonio",
            "draftStatus": "2021 NBA Draft, Undrafted",
            "nationality": "United States",
            "yos": 2
        }
    ],
    "Rouen Metropole Basket (France)": [
        {
            "name": "Guerschon Yabusele",
            "team": "New York Knicks",
            "position": "PF",
            "height": "6-7",
            "weight": 265,
            "age": 29,
            "preDraftTeam": "Rouen Metropole Basket (France)",
            "draftStatus": "2016 Rnd 1 Pick 16",
            "nationality": "France",
            "yos": 3
        }
    ],
    "Brisbane (Australia)": [
        {
            "name": "Rocco Zikarsky",
            "team": "Minnesota Timberwolves",
            "position": "C",
            "height": "7-3",
            "weight": 227,
            "age": 20,
            "preDraftTeam": "Brisbane (Australia)",
            "draftStatus": "2025 Rnd 2 Pick 15",
            "nationality": "Australia",
            "yos": 0
        }
    ]
};
