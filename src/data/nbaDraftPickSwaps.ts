export type PickPreference =
    | 'best'
    | 'second_best'
    | 'third_best'
    | 'fourth_best'
    | 'worst'
    | 'second_worst'
    | 'third_worst';

export type DraftPickRule =
    | {
          year: number;
          round: 1 | 2;
          type: 'assignment';
          from: string;
          to: string;
          note?: string;
      }
    | {
          year: number;
          round: 1 | 2;
          type: 'multi';
          pool: string[];
          recipients: { team: string; preference: PickPreference; note?: string }[];
          note?: string;
      };

/**
 * Pick swap dataset derived from the RealGM Future Draft Pick tracker.
 * Only high-impact first-round obligations are listed here for now, but the
 * structure makes it easy to add more entries over time.
 *
 * Source snapshots (Dec 2025):
 * https://basketball.realgm.com/nba/draft/future_drafts/detailed
 * https://basketball.realgm.com/nba/draft/future_drafts
 */
export const NBA_DRAFT_PICK_RULES: DraftPickRule[] = [
    {
        year: 2026,
        round: 1,
        type: 'multi',
        pool: ['Milwaukee Bucks', 'New Orleans Pelicans'],
        recipients: [
            { team: 'Atlanta Hawks', preference: 'best', note: 'Hawks control the better of the Pelicans/Bucks picks (RealGM).' },
            { team: 'Milwaukee Bucks', preference: 'worst', note: 'Remaining pick reverts to Milwaukee; New Orleans conveys both away.' },
        ],
        note: 'Atlanta receives the more favorable of the Pelicans and Bucks 2026 1sts.',
    },
    {
        year: 2026,
        round: 1,
        type: 'multi',
        pool: ['Atlanta Hawks', 'San Antonio Spurs'],
        recipients: [
            { team: 'San Antonio Spurs', preference: 'best', note: 'Spurs can swap for Atlanta\'s 2026 first (Dejounte trade).' },
            { team: 'Atlanta Hawks', preference: 'worst' },
        ],
        note: 'San Antonio holds 2026 swap rights with Atlanta per RealGM.',
    },
    {
        year: 2026,
        round: 1,
        type: 'multi',
        pool: ['Oklahoma City Thunder', 'Houston Rockets', 'LA Clippers'],
        recipients: [
            { team: 'Oklahoma City Thunder', preference: 'best', note: 'Thunder get the best of OKC/HOU (if conveys)/LAC.' },
            { team: 'Oklahoma City Thunder', preference: 'second_best', note: 'Thunder also take the second-best pick.' },
            { team: 'Washington Wizards', preference: 'worst', note: 'Wizards receive the remaining pick via the Harden/Beal swap tree.' },
        ],
        note: 'RealGM: in 2026, OKC keeps the two best of OKC/HOU/LAC, Washington gets the worst.',
    },
    {
        year: 2026,
        round: 1,
        type: 'assignment',
        from: 'Philadelphia 76ers',
        to: 'Oklahoma City Thunder',
        note: '2026 1st owed to OKC (top-4 protected).',
    },
    {
        year: 2026,
        round: 1,
        type: 'assignment',
        from: 'Utah Jazz',
        to: 'Oklahoma City Thunder',
        note: 'Jazz owe a 2026 1st to OKC (top-8 protected).',
    },
    {
        year: 2026,
        round: 1,
        type: 'assignment',
        from: 'Washington Wizards',
        to: 'New York Knicks',
        note: 'Wizards owe their 2026 1st to New York (top-8 protected per RealGM).',
    },
    {
        year: 2026,
        round: 1,
        type: 'assignment',
        from: 'Portland Trail Blazers',
        to: 'Chicago Bulls',
        note: 'Portland conveys its 2026 1st to Chicago if it lands 15-30 (RealGM future picks).',
    },
    {
        year: 2027,
        round: 1,
        type: 'assignment',
        from: 'Atlanta Hawks',
        to: 'San Antonio Spurs',
        note: 'Dejounte Murray trade debt (2027 unprotected pick).',
    },
    {
        year: 2027,
        round: 1,
        type: 'multi',
        pool: ['Brooklyn Nets', 'Houston Rockets'],
        recipients: [
            { team: 'Houston Rockets', preference: 'best', note: 'Final Harden swap year' },
            { team: 'Brooklyn Nets', preference: 'worst' },
        ],
        note: "Houston retains swap control of Brooklyn's 2027 first.",
    },
    {
        year: 2027,
        round: 1,
        type: 'multi',
        pool: ['Milwaukee Bucks', 'New Orleans Pelicans'],
        recipients: [
            { team: 'New Orleans Pelicans', preference: 'best', note: 'Pelicans keep the better of the two per RealGM.' },
            { team: 'Atlanta Hawks', preference: 'worst', note: 'Atlanta gets the remaining pick (top-4 protected).' },
        ],
        note: '2027 continuation of the Pelicans/Bucks obligations to Atlanta.',
    },
    {
        year: 2027,
        round: 1,
        type: 'assignment',
        from: 'Los Angeles Lakers',
        to: 'Utah Jazz',
        note: 'Jazz receive LAL 2027 first-rounder (top-4 protected).',
    },
    {
        year: 2028,
        round: 1,
        type: 'assignment',
        from: 'LA Clippers',
        to: 'Philadelphia 76ers',
        note: 'Clippers owe 2028 first to Philadelphia from the James Harden deal.',
    },
    {
        year: 2028,
        round: 1,
        type: 'multi',
        pool: ['Boston Celtics', 'San Antonio Spurs'],
        recipients: [
            { team: 'San Antonio Spurs', preference: 'best', note: 'Derrick White swap rights' },
            { team: 'Boston Celtics', preference: 'worst' },
        ],
        note: 'San Antonio can swap its 2028 first with Boston (top-1 protection).',
    },
    {
        year: 2029,
        round: 1,
        type: 'assignment',
        from: 'Los Angeles Lakers',
        to: 'Dallas Mavericks',
        note: 'Dallas acquires the Lakers 2029 first (Kyrie Irving compensation).',
    },
    {
        year: 2029,
        round: 1,
        type: 'multi',
        pool: ['Houston Rockets', 'Dallas Mavericks', 'Phoenix Suns'],
        recipients: [
            { team: 'Houston Rockets', preference: 'best', note: 'Brooklyn/Houston controls the two best slots' },
            { team: 'Houston Rockets', preference: 'second_best' },
            { team: 'Brooklyn Nets', preference: 'worst', note: 'Brooklyn keeps the remaining pick' },
        ],
        note: 'Houston receives the two best of the Houston/Dallas/Phoenix trio; Brooklyn takes the leftover selection.',
    },
];
