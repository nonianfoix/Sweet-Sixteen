import { AnnualCalendar, GameDate, ISODate, Month } from '../types';

export const MONTH_ORDER: Month[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Academic year order: OCT -> SEP
export const ACADEMIC_MONTH_ORDER: Month[] = ['OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP'];

export const DAYS_IN_MONTH: Record<Month, number> = {
    'OCT': 31, 'NOV': 30, 'DEC': 31,
    'JAN': 31, 'FEB': 28, 'MAR': 31,
    'APR': 30, 'MAY': 31, 'JUN': 30,
    'JUL': 31, 'AUG': 31, 'SEP': 30
};

export enum SeasonPhase {
    // ===== College Basketball Phases =====
    COLLEGE_PRESEASON = 'COLLEGE_PRESEASON',       // Oct 1 - Nov (exhibition games)
    COLLEGE_REGULAR_SEASON = 'COLLEGE_REGULAR_SEASON', // Nov - Mar 1
    CONFERENCE_TOURNAMENT = 'CONFERENCE_TOURNAMENT',   // ~Mar 10-15
    NCAA_TOURNAMENT = 'NCAA_TOURNAMENT',               // ~Mar 18 - Apr 7
    
    // ===== College Offseason Phases =====
    TRANSFER_PORTAL_SPRING = 'TRANSFER_PORTAL_SPRING', // Apr 15-30 (spring portal window)
    COLLEGE_OFFSEASON = 'COLLEGE_OFFSEASON',           // Generic offseason (Apr-May)
    COLLEGE_SUMMER = 'COLLEGE_SUMMER',                 // May-Aug (training, camps)
    
    // ===== NBA Phases =====
    NBA_PRESEASON = 'NBA_PRESEASON',                   // Oct 7-21
    NBA_REGULAR_SEASON = 'NBA_REGULAR_SEASON',         // Oct 22 - Apr 13
    NBA_PLAY_IN = 'NBA_PLAY_IN',                       // Apr 15-19
    NBA_PLAYOFFS = 'NBA_PLAYOFFS',                     // Apr 20 - Jun 20
    NBA_DRAFT_WEEK = 'NBA_DRAFT_WEEK',                 // Jun 20-30
    NBA_FREE_AGENCY = 'NBA_FREE_AGENCY',               // Jul 1 - Aug
    
    // ===== Special Events =====
    NBA_ALL_STAR = 'NBA_ALL_STAR',                     // Feb weekend (mid-season break)
    SUMMER_RECRUITING = 'SUMMER_RECRUITING',           // Jun 15 - Aug 15 (official visits)
    
    // ===== Legacy Aliases (for backward compatibility) =====
    PRESEASON = 'PRESEASON',                           // Maps to COLLEGE_PRESEASON
    REGULAR_SEASON = 'REGULAR_SEASON',                 // Maps to COLLEGE_REGULAR_SEASON
    OFFSEASON = 'OFFSEASON'                            // Maps to COLLEGE_OFFSEASON
}

// Legacy fallback; canonical season starts are computed via `buildSeasonAnchors`.
export const SEASON_START_DATE: ISODate = '2024-11-01';

const pad2 = (n: number) => String(n).padStart(2, '0');

// ISO date helpers (UTC-based to avoid DST issues; treated as local-date keys).
export const toISODate = (year: number, month1to12: number, day: number): ISODate =>
    `${year}-${pad2(month1to12)}-${pad2(day)}`;

export const isoToJsDateUTC = (iso: ISODate): Date => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
};

export const jsDateToISODateUTC = (date: Date): ISODate => {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    return toISODate(y, m, d);
};

export const addDaysISO = (iso: ISODate, days: number): ISODate => {
    const base = isoToJsDateUTC(iso);
    base.setUTCDate(base.getUTCDate() + days);
    return jsDateToISODateUTC(base);
};

export const compareISO = (a: ISODate, b: ISODate): number => (a < b ? -1 : a > b ? 1 : 0);
export const isSameISO = (a: ISODate, b: ISODate): boolean => a === b;
export const isAfterISO = (a: ISODate, b: ISODate): boolean => compareISO(a, b) > 0;
export const isBeforeISO = (a: ISODate, b: ISODate): boolean => compareISO(a, b) < 0;

export const diffInDaysISO = (toISO: ISODate, fromISO: ISODate): number => {
    const a = isoToJsDateUTC(toISO).getTime();
    const b = isoToJsDateUTC(fromISO).getTime();
    return Math.round((a - b) / 86400000);
};

export const dayOfWeekISO = (iso: ISODate): number => isoToJsDateUTC(iso).getUTCDay(); // 0=Sun

export const getWeekNumberFromSeasonStartISO = (dateISO: ISODate, seasonStartISO: ISODate): number => {
    const days = diffInDaysISO(dateISO, seasonStartISO);
    if (days < 0) return 0;
    return Math.floor(days / 7) + 1;
};

export const formatISODate = (iso: ISODate): string => {
    const d = isoToJsDateUTC(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

export const compareDates = (a: GameDate, b: GameDate): number => {
    if (a.year !== b.year) return a.year - b.year;
    
    const mIndexA = MONTH_ORDER.indexOf(a.month);
    const mIndexB = MONTH_ORDER.indexOf(b.month);
    if (mIndexA !== mIndexB) return mIndexA - mIndexB;
    
    return a.day - b.day;
};

export const isSameDate = (a: GameDate, b: GameDate): boolean => {
    return a.year === b.year && a.month === b.month && a.day === b.day;
};

export const isAfter = (a: GameDate, b: GameDate): boolean => compareDates(a, b) > 0;
export const isBefore = (a: GameDate, b: GameDate): boolean => compareDates(a, b) < 0;

export const addDays = (date: GameDate, days: number): GameDate => {
    let { day, month, year } = date;
    let daysToAdd = days;

    while (daysToAdd > 0) {
        const daysInCurrentMonth = DAYS_IN_MONTH[month];
        const remainingInMonth = daysInCurrentMonth - day;

        if (daysToAdd <= remainingInMonth) {
            day += daysToAdd;
            daysToAdd = 0;
        } else {
            daysToAdd -= (remainingInMonth + 1);
            day = 1;
            
            const currentMonthIndex = MONTH_ORDER.indexOf(month);
            if (currentMonthIndex === 11) { // DEC
                month = 'JAN';
                year++;
            } else {
                month = MONTH_ORDER[currentMonthIndex + 1];
            }
        }
    }
    return { day, month, year };
};

export const diffInDays = (to: GameDate, from: GameDate): number => {
    // Determine sign
    const comparison = compareDates(to, from);
    if (comparison === 0) return 0;
    if (comparison < 0) return -diffInDays(from, to);

    // Naive iterative approach is fast enough for game range (a few years max)
    // Optimization: Calculate year diff + rough month diff + day diff can be complex due to variable month lengths.
    // Iteration is robust O(N) where N is days, ~365 per year. Very fast.
    
    let days = 0;
    let current = { ...from };
    
    while (current.year < to.year || (current.year === to.year && MONTH_ORDER.indexOf(current.month) < MONTH_ORDER.indexOf(to.month))) {
        const daysInMonth = DAYS_IN_MONTH[current.month];
        days += (daysInMonth - current.day + 1);
        current.day = 1;
        
        const mIdx = MONTH_ORDER.indexOf(current.month);
        if (mIdx === 11) {
            current.month = 'JAN';
            current.year++;
        } else {
            current.month = MONTH_ORDER[mIdx + 1];
        }
    }
    
    // Now same month/year
    days += (to.day - current.day);
    return days;
};

export const formatDate = (date: GameDate): string => {
    return `${date.month} ${date.day}, ${date.year}`;
};

const MONTH_INDEX_BY_NAME: Record<Month, number> = MONTH_ORDER.reduce((acc, m, idx) => {
    acc[m] = idx;
    return acc;
}, {} as Record<Month, number>);

export const gameDateToJsDate = (date: GameDate): Date => {
    const monthIndex = MONTH_INDEX_BY_NAME[date.month];
    return new Date(date.year, monthIndex, date.day);
};

export const jsDateToGameDate = (date: Date): GameDate => {
    const month = MONTH_ORDER[date.getMonth()];
    return { year: date.getFullYear(), month, day: date.getDate() };
};

export const gameDateToISODateUTC = (date: GameDate): ISODate => {
    const js = gameDateToJsDate(date);
    return jsDateToISODateUTC(new Date(Date.UTC(js.getFullYear(), js.getMonth(), js.getDate())));
};

export const getSeasonPhase = (date: GameDate): SeasonPhase => {
    // Heuristic based on month
    const m = date.month;
    if (['OCT'].includes(m)) return SeasonPhase.PRESEASON;
    if (['NOV', 'DEC', 'JAN', 'FEB'].includes(m)) return SeasonPhase.REGULAR_SEASON;
    if (['MAR'].includes(m)) {
        if (date.day < 15) return SeasonPhase.CONFERENCE_TOURNAMENT;
        return SeasonPhase.NCAA_TOURNAMENT;
    }
    if (['APR'].includes(m)) {
        if (date.day < 10) return SeasonPhase.NCAA_TOURNAMENT;
        return SeasonPhase.OFFSEASON;
    }
    return SeasonPhase.OFFSEASON;
};

export const advanceDate = (date: GameDate): GameDate => {
    return addDays(date, 1);
};

export const getWeekNumber = (date: GameDate): number => {
    // Determine the start of the season for this date
    // If month is >= OCT (index 9), season started in this year.
    // If month is < OCT, season started in previous year.
    const monthIndex = MONTH_ORDER.indexOf(date.month);
    let seasonStartYear = date.year;
    if (monthIndex < 9) { // JAN-SEP
        seasonStartYear = date.year - 1;
    }
    
    const seasonStart: GameDate = { day: 1, month: 'NOV', year: seasonStartYear };
    const daysSinceStart = diffInDays(date, seasonStart);
    
    if (daysSinceStart < 0) return 0; // Preseason
    return Math.floor(daysSinceStart / 7) + 1;
};

/**
 * Get the season phase based on the full annual calendar with precise date ranges.
 * This is the new preferred method for phase detection when an AnnualCalendar is available.
 * 
 * @param dateISO Current date in ISO format
 * @param calendar The annual calendar to use for date comparisons
 * @returns The current SeasonPhase based on exact calendar dates
 */
export const getSeasonPhaseFromCalendar = (dateISO: ISODate, calendar: AnnualCalendar): SeasonPhase => {
    // NBA phases (October - August of next year)
    if (dateISO >= calendar.nbaPreseasonStart && dateISO < calendar.nbaSeasonStart) {
        return SeasonPhase.NBA_PRESEASON;
    }
    if (dateISO >= calendar.nbaSeasonStart && dateISO < calendar.nbaAllStarBreakStart) {
        return SeasonPhase.NBA_REGULAR_SEASON;
    }
    if (dateISO >= calendar.nbaAllStarBreakStart && dateISO <= calendar.nbaAllStarBreakEnd) {
        return SeasonPhase.NBA_ALL_STAR;
    }
    if (dateISO > calendar.nbaAllStarBreakEnd && dateISO <= calendar.nbaRegularSeasonEnd) {
        return SeasonPhase.NBA_REGULAR_SEASON;
    }
    if (dateISO >= calendar.nbaPlayInStart && dateISO <= calendar.nbaPlayInEnd) {
        return SeasonPhase.NBA_PLAY_IN;
    }
    if (dateISO >= calendar.nbaPlayoffsStart && dateISO <= calendar.nbaFinalsEnd) {
        return SeasonPhase.NBA_PLAYOFFS;
    }
    if (dateISO >= calendar.nbaDraftLottery && dateISO <= calendar.nbaDraft) {
        return SeasonPhase.NBA_DRAFT_WEEK;
    }
    if (dateISO >= calendar.nbaFreeAgencyStart && dateISO <= calendar.nbaSummerLeagueEnd) {
        return SeasonPhase.NBA_FREE_AGENCY;
    }
    
    // College phases
    if (dateISO < calendar.collegeSeasonStart) {
        return SeasonPhase.COLLEGE_PRESEASON;
    }
    if (dateISO >= calendar.collegeSeasonStart && dateISO <= calendar.collegeRegularSeasonEnd) {
        return SeasonPhase.COLLEGE_REGULAR_SEASON;
    }
    if (dateISO >= calendar.confTourneyStart && dateISO <= calendar.confTourneyEnd) {
        return SeasonPhase.CONFERENCE_TOURNAMENT;
    }
    if (dateISO > calendar.confTourneyEnd && dateISO <= calendar.ncaaTournamentEnd) {
        return SeasonPhase.NCAA_TOURNAMENT;
    }
    
    // Transfer portal spring window
    if (dateISO >= calendar.transferPortalWindow2Start && dateISO <= calendar.transferPortalWindow2End) {
        return SeasonPhase.TRANSFER_PORTAL_SPRING;
    }
    
    // Summer recruiting period
    if (dateISO >= calendar.summerRecruitingStart && dateISO <= calendar.summerRecruitingEnd) {
        return SeasonPhase.SUMMER_RECRUITING;
    }
    
    // College summer (between end of spring portal and start of next preseason)
    if (dateISO > calendar.transferPortalWindow2End && dateISO < calendar.nbaPreseasonStart) {
        return SeasonPhase.COLLEGE_SUMMER;
    }
    
    // Default to college offseason for any other dates (Apr 8 - Apr 15, etc.)
    return SeasonPhase.COLLEGE_OFFSEASON;
};

/**
 * Check if the transfer portal is currently open based on the calendar.
 */
export const isTransferPortalOpen = (dateISO: ISODate, calendar: AnnualCalendar): boolean => {
    return (
        (dateISO >= calendar.transferPortalWindow1Start && dateISO <= calendar.transferPortalWindow1End) ||
        (dateISO >= calendar.transferPortalWindow2Start && dateISO <= calendar.transferPortalWindow2End)
    );
};

