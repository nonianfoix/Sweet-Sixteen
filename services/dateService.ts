import { GameDate, Month } from '../types';

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
    PRESEASON = 'PRESEASON',
    REGULAR_SEASON = 'REGULAR_SEASON',
    CONFERENCE_TOURNAMENT = 'CONFERENCE_TOURNAMENT',
    NCAA_TOURNAMENT = 'NCAA_TOURNAMENT',
    OFFSEASON = 'OFFSEASON'
}

export const SEASON_START_DATE: GameDate = { month: 'NOV', day: 1, year: 2024 };

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
