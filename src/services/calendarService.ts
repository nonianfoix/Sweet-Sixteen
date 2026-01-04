import { AnnualCalendar, GameEvent, ISODate } from '../types';
import { addDaysISO, dayOfWeekISO, isoToJsDateUTC, toISODate } from './dateService';

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Helper to get the first Monday of November for a given year
export const getSeasonStartDate = (seasonYear: number): Date => {
    // Season 2024-2025 starts in Nov 2024
    const d = new Date(seasonYear, 10, 1); // Nov 1st
    // Find first Monday
    while (d.getDay() !== 1) {
        d.setDate(d.getDate() + 1);
    }
    return d;
};

// Calculate the date for a specific game week
// Week 1 = Start Date
// Games are typically played twice a week, but for this simulation, we treat "Week X" as a block.
// Let's assume Week 1 is early Nov, Week 30 is April.
export const getGameDate = (seasonYear: number, week: number): Date => {
    const startDate = getSeasonStartDate(seasonYear);
    // Add (week - 1) * 3.5 days? Or just 1 week per "Game"?
    // The game uses "Game 1", "Game 2"... up to 30.
    // Real NCAA teams play ~31 regular season games.
    // So "Game 1" is roughly Nov 4. "Game 30" is roughly March 8.
    // That's about 125 days for 30 games -> ~4 days per game.
    
    const daysToAdd = (week - 1) * 4; 
    const gameDate = new Date(startDate);
    gameDate.setDate(startDate.getDate() + daysToAdd);
    return gameDate;
};

export const formatGameDate = (date: Date): string => {
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
};

export const getGameDateString = (seasonYear: number, week: number): string => {
    return formatGameDate(getGameDate(seasonYear, week));
};

const getGameISODateFromEventQueue = (eventQueue: GameEvent[] | undefined, week: number): ISODate | null => {
    if (!eventQueue?.length) return null;
    for (const event of eventQueue) {
        if (event.type !== 'GAME') continue;
        const eventWeek = Number(event.payload?.week);
        if (!Number.isFinite(eventWeek) || eventWeek !== week) continue;
        return event.date;
    }
    return null;
};

export const formatShortISODate = (iso: ISODate): string => {
    const d = isoToJsDateUTC(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

export const getGameDateStringFromEventQueue = (
    eventQueue: GameEvent[] | undefined,
    seasonYear: number,
    week: number
): string => {
    const iso = getGameISODateFromEventQueue(eventQueue, week);
    if (iso) return formatShortISODate(iso);
    return getGameDateString(seasonYear, week);
};

/**
 * Helper to find first occurrence of a day of week on or after a given date
 * @param startISO Starting date
 * @param targetDow Target day of week (0=Sun, 1=Mon, ... 6=Sat)
 */
const isoOnOrAfterWithDow = (startISO: ISODate, targetDow: number): ISODate => {
    let cursor = startISO;
    for (let i = 0; i < 8; i++) {
        if (dayOfWeekISO(cursor) === targetDow) return cursor;
        cursor = addDaysISO(cursor, 1);
    }
    return cursor;
};

/**
 * Find the Wednesday before Thanksgiving (4th Thursday of November)
 */
const getWednesdayBeforeThanksgiving = (year: number): ISODate => {
    // Find the 4th Thursday in November
    let thurCount = 0;
    for (let day = 1; day <= 30; day++) {
        const iso = toISODate(year, 11, day);
        if (dayOfWeekISO(iso) === 4) { // Thursday
            thurCount++;
            if (thurCount === 4) {
                // Wednesday before is day - 1
                return toISODate(year, 11, day - 1);
            }
        }
    }
    // Fallback: ~Nov 20
    return toISODate(year, 11, 20);
};

/**
 * Build a full 365-day annual calendar for the given season year.
 * seasonYear is the year the college season starts (e.g., 2024 for 2024-25 season).
 */
export const buildAnnualCalendar = (seasonYear: number): AnnualCalendar => {
    // === College Basketball Dates ===
    const nov1 = toISODate(seasonYear, 11, 1);
    const collegeSeasonStart = isoOnOrAfterWithDow(nov1, 1); // Monday
    
    const mar1 = toISODate(seasonYear + 1, 3, 1);
    const collegeRegularSeasonEnd = isoOnOrAfterWithDow(mar1, 0); // Sunday
    
    const confTourneyStart = addDaysISO(collegeRegularSeasonEnd, 1); // Monday after
    const confTourneyEnd = addDaysISO(confTourneyStart, 5); // Saturday
    const selectionSunday = addDaysISO(confTourneyEnd, 1); // Sunday
    
    const ncaaTournamentStart = addDaysISO(selectionSunday, 2); // First Four Tue
    const ncaaTournamentEnd = addDaysISO(selectionSunday, 22); // Title Monday
    
    // === Transfer Portal Windows (NCAA 2024 rules) ===
    const transferPortalWindow1Start = toISODate(seasonYear, 12, 9);
    const transferPortalWindow1End = toISODate(seasonYear, 12, 28); // 20 days
    const transferPortalWindow2Start = toISODate(seasonYear + 1, 4, 16);
    const transferPortalWindow2End = toISODate(seasonYear + 1, 4, 30); // 15 days
    
    // === Recruiting Periods ===
    const earlySigningPeriodStart = getWednesdayBeforeThanksgiving(seasonYear);
    const earlySigningPeriodEnd = addDaysISO(earlySigningPeriodStart, 6); // 1 week
    const nliSigningDayStart = toISODate(seasonYear + 1, 4, 15);
    const nliSigningDayEnd = toISODate(seasonYear + 1, 5, 15);
    const summerRecruitingStart = toISODate(seasonYear + 1, 6, 15);
    const summerRecruitingEnd = toISODate(seasonYear + 1, 8, 15);
    
    // === NBA Calendar (same year as college season ends) ===
    const nbaYear = seasonYear; // NBA season 2024-25 starts in Oct 2024
    const nbaPreseasonStart = toISODate(nbaYear, 10, 7);
    const nbaSeasonStart = toISODate(nbaYear, 10, 22);
    const nbaAllStarBreakStart = toISODate(nbaYear + 1, 2, 14);
    const nbaAllStarBreakEnd = toISODate(nbaYear + 1, 2, 20);
    const nbaRegularSeasonEnd = toISODate(nbaYear + 1, 4, 13);
    const nbaPlayInStart = toISODate(nbaYear + 1, 4, 15);
    const nbaPlayInEnd = toISODate(nbaYear + 1, 4, 19);
    const nbaPlayoffsStart = toISODate(nbaYear + 1, 4, 20);
    const nbaFinalsStart = toISODate(nbaYear + 1, 6, 5);
    const nbaFinalsEnd = toISODate(nbaYear + 1, 6, 20);
    const nbaDraftLottery = toISODate(nbaYear + 1, 5, 14);
    const nbaDraft = toISODate(nbaYear + 1, 6, 26);
    const nbaFreeAgencyStart = toISODate(nbaYear + 1, 7, 1);
    const nbaSummerLeagueStart = toISODate(nbaYear + 1, 7, 5);
    const nbaSummerLeagueEnd = toISODate(nbaYear + 1, 7, 20);
    
    // === College Offseason Milestones ===
    const proDeclarationDeadline = toISODate(seasonYear + 1, 3, 24);
    const proWithdrawalDeadline = toISODate(seasonYear + 1, 5, 29);
    const graduationPeriod = toISODate(seasonYear + 1, 5, 15);
    
    return {
        year: seasonYear,
        collegeSeasonStart,
        collegeRegularSeasonEnd,
        confTourneyStart,
        confTourneyEnd,
        selectionSunday,
        ncaaTournamentStart,
        ncaaTournamentEnd,
        transferPortalWindow1Start,
        transferPortalWindow1End,
        transferPortalWindow2Start,
        transferPortalWindow2End,
        earlySigningPeriodStart,
        earlySigningPeriodEnd,
        nliSigningDayStart,
        nliSigningDayEnd,
        summerRecruitingStart,
        summerRecruitingEnd,
        nbaPreseasonStart,
        nbaSeasonStart,
        nbaAllStarBreakStart,
        nbaAllStarBreakEnd,
        nbaRegularSeasonEnd,
        nbaPlayInStart,
        nbaPlayInEnd,
        nbaPlayoffsStart,
        nbaFinalsStart,
        nbaFinalsEnd,
        nbaDraftLottery,
        nbaDraft,
        nbaFreeAgencyStart,
        nbaSummerLeagueStart,
        nbaSummerLeagueEnd,
        proDeclarationDeadline,
        proWithdrawalDeadline,
        graduationPeriod,
    };
};

// ===== DRAFT TIMING HELPERS =====

/**
 * Check if a player can declare for the NBA draft (before declaration deadline).
 */
export const canDeclareForDraft = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return currentDate <= calendar.proDeclarationDeadline;
};

/**
 * Check if a player can still withdraw from the draft and return to college.
 */
export const canWithdrawFromDraft = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return (
        currentDate >= calendar.proDeclarationDeadline &&
        currentDate <= calendar.proWithdrawalDeadline
    );
};

/**
 * Check if draft day has arrived.
 */
export const isDraftDay = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return currentDate === calendar.nbaDraft;
};

/**
 * Check if it's draft lottery day.
 */
export const isDraftLotteryDay = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return currentDate === calendar.nbaDraftLottery;
};

/**
 * Get number of days until the draft.
 */
export const getDaysUntilDraft = (currentDate: ISODate, calendar: AnnualCalendar): number => {
    const draftDate = isoToJsDateUTC(calendar.nbaDraft);
    const current = isoToJsDateUTC(currentDate);
    const diffMs = draftDate.getTime() - current.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Check if we're in the draft combine/workout period (between lottery and draft).
 */
export const isInDraftCombinePeriod = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return currentDate >= calendar.nbaDraftLottery && currentDate < calendar.nbaDraft;
};

/**
 * Check if free agency has opened.
 */
export const isFreeAgencyOpen = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return currentDate >= calendar.nbaFreeAgencyStart;
};

/**
 * Check if it's summer league period.
 */
export const isSummerLeaguePeriod = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return (
        currentDate >= calendar.nbaSummerLeagueStart &&
        currentDate <= calendar.nbaSummerLeagueEnd
    );
};

// ===== SUMMER RECRUITING HELPERS =====

/**
 * Check if we're in the summer recruiting period (official visits open).
 */
export const isSummerRecruitingOpen = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return (
        currentDate >= calendar.summerRecruitingStart &&
        currentDate <= calendar.summerRecruitingEnd
    );
};

/**
 * Check if we're in the early signing period.
 */
export const isEarlySigningPeriod = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return (
        currentDate >= calendar.earlySigningPeriodStart &&
        currentDate <= calendar.earlySigningPeriodEnd
    );
};

/**
 * Check if we're in the NLI signing period (spring).
 */
export const isNLISigningPeriod = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return (
        currentDate >= calendar.nliSigningDayStart &&
        currentDate <= calendar.nliSigningDayEnd
    );
};

/**
 * Check if any signing period is active.
 */
export const isSigningPeriodActive = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return isEarlySigningPeriod(currentDate, calendar) || isNLISigningPeriod(currentDate, calendar);
};

// ===== TRANSFER PORTAL HELPERS =====

/**
 * Check if the winter transfer portal window is open (Dec 9-28).
 */
export const isWinterPortalOpen = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return (
        currentDate >= calendar.transferPortalWindow1Start &&
        currentDate <= calendar.transferPortalWindow1End
    );
};

/**
 * Check if the spring transfer portal window is open (Apr 16-30).
 */
export const isSpringPortalOpen = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return (
        currentDate >= calendar.transferPortalWindow2Start &&
        currentDate <= calendar.transferPortalWindow2End
    );
};

/**
 * Check if either transfer portal window is open.
 */
export const isAnyPortalOpen = (currentDate: ISODate, calendar: AnnualCalendar): boolean => {
    return isWinterPortalOpen(currentDate, calendar) || isSpringPortalOpen(currentDate, calendar);
};

/**
 * Get which portal window is currently active.
 */
export const getActivePortalWindow = (
    currentDate: ISODate,
    calendar: AnnualCalendar
): 'winter' | 'spring' | null => {
    if (isWinterPortalOpen(currentDate, calendar)) return 'winter';
    if (isSpringPortalOpen(currentDate, calendar)) return 'spring';
    return null;
};

/**
 * Get days remaining in the current portal window.
 */
export const getDaysRemainingInPortal = (currentDate: ISODate, calendar: AnnualCalendar): number => {
    const current = isoToJsDateUTC(currentDate);
    
    if (isWinterPortalOpen(currentDate, calendar)) {
        const end = isoToJsDateUTC(calendar.transferPortalWindow1End);
        return Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    if (isSpringPortalOpen(currentDate, calendar)) {
        const end = isoToJsDateUTC(calendar.transferPortalWindow2End);
        return Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
};



