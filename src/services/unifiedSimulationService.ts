/**
 * Unified Simulation Service - Master simulation loop using the AnnualCalendar
 * 
 * This service coordinates all daily events based on the calendar dates,
 * including college games, NBA games, recruiting, transfer portal, and draft events.
 */

import {
    AnnualCalendar,
    GameState,
    ISODate,
    NBAScheduledGame,
    NBASeasonSchedule,
} from '../types';
import {
    getSeasonPhaseFromCalendar,
    isTransferPortalOpen,
    SeasonPhase,
    addDaysISO,
    isSameISO,
} from './dateService';
import {
    isEarlySigningPeriod,
    isNLISigningPeriod,
    isSummerRecruitingOpen,
    isDraftDay,
    isDraftLotteryDay,
    canDeclareForDraft,
    isAnyPortalOpen,
    getActivePortalWindow,
} from './calendarService';
import {
    getNBAGamesForDate,
} from './nbaScheduleService';

// ===== TYPES =====

export interface DailySimulationResult {
    /** Updated state fields */
    updates: Partial<GameState>;
    /** Messages to display to the user */
    messages: string[];
    /** Events that occurred today */
    events: SimulationEvent[];
    /** Whether the user has a game to play today */
    userGameToday: boolean;
    /** Current phase after simulation */
    currentPhase: SeasonPhase;
}

export interface SimulationEvent {
    type: SimulationEventType;
    description: string;
    importance: 'low' | 'medium' | 'high';
    date: ISODate;
}

export type SimulationEventType =
    | 'college_game'
    | 'nba_game'
    | 'recruiting'
    | 'transfer_portal'
    | 'signing_day'
    | 'draft_lottery'
    | 'nba_draft'
    | 'free_agency'
    | 'phase_change'
    | 'calendar_milestone';

// ===== HELPER FUNCTIONS =====

/**
 * Get the calendar for the current game state.
 * Falls back to building a new calendar if not present.
 */
const getCalendar = (state: GameState): AnnualCalendar | null => {
    if (state.calendar) {
        return state.calendar;
    }
    // No calendar in state - caller should initialize it
    return null;
};

/**
 * Check for calendar milestones on a given date.
 */
const getCalendarMilestones = (date: ISODate, calendar: AnnualCalendar): string[] => {
    const milestones: string[] = [];
    
    if (date === calendar.collegeSeasonStart) {
        milestones.push('College basketball season begins!');
    }
    if (date === calendar.confTourneyStart) {
        milestones.push('Conference tournaments begin');
    }
    if (date === calendar.selectionSunday) {
        milestones.push('Selection Sunday - NCAA Tournament bracket revealed');
    }
    if (date === calendar.ncaaTournamentStart) {
        milestones.push('NCAA Tournament First Four begins');
    }
    if (date === calendar.ncaaTournamentEnd) {
        milestones.push('NCAA Tournament Championship game');
    }
    if (date === calendar.nbaSeasonStart) {
        milestones.push('NBA regular season begins');
    }
    if (date === calendar.nbaAllStarBreakStart) {
        milestones.push('NBA All-Star Weekend begins');
    }
    if (date === calendar.nbaPlayoffsStart) {
        milestones.push('NBA Playoffs begin');
    }
    if (date === calendar.nbaFinalsStart) {
        milestones.push('NBA Finals begin');
    }
    if (date === calendar.nbaDraftLottery) {
        milestones.push('NBA Draft Lottery');
    }
    if (date === calendar.nbaDraft) {
        milestones.push('NBA Draft');
    }
    if (date === calendar.nbaFreeAgencyStart) {
        milestones.push('NBA Free Agency opens');
    }
    if (date === calendar.transferPortalWindow1Start) {
        milestones.push('Winter transfer portal window opens');
    }
    if (date === calendar.transferPortalWindow2Start) {
        milestones.push('Spring transfer portal window opens');
    }
    if (date === calendar.earlySigningPeriodStart) {
        milestones.push('Early signing period begins');
    }
    if (date === calendar.nliSigningDayStart) {
        milestones.push('National Letter of Intent signing period begins');
    }
    if (date === calendar.summerRecruitingStart) {
        milestones.push('Summer recruiting period opens - official visits available');
    }
    if (date === calendar.proDeclarationDeadline) {
        milestones.push('Pro declaration deadline');
    }
    if (date === calendar.proWithdrawalDeadline) {
        milestones.push('Draft withdrawal deadline - final day to return to college');
    }
    
    return milestones;
};

// ===== MAIN SIMULATION FUNCTION =====

/**
 * Master daily simulation function that coordinates all calendar-based events.
 * 
 * This is the unified entry point for simulating a single day in the game.
 * It checks the calendar to determine what events should occur and processes them.
 */
export const simulateDayWithCalendar = (
    state: GameState,
    options: {
        autoSimUserGames?: boolean;
        skipNBAGames?: boolean;
    } = {}
): DailySimulationResult => {
    const calendar = getCalendar(state);
    const currentDate = state.currentDate;
    
    // If no calendar, return minimal result
    if (!calendar) {
        return {
            updates: { currentDate: addDaysISO(currentDate, 1) },
            messages: ['Calendar not initialized'],
            events: [],
            userGameToday: false,
            currentPhase: SeasonPhase.OFFSEASON,
        };
    }
    
    const currentPhase = getSeasonPhaseFromCalendar(currentDate, calendar);
    const updates: Partial<GameState> = {};
    const messages: string[] = [];
    const events: SimulationEvent[] = [];
    let userGameToday = false;
    
    // 1. Check for calendar milestones
    const milestones = getCalendarMilestones(currentDate, calendar);
    milestones.forEach(milestone => {
        messages.push(milestone);
        events.push({
            type: 'calendar_milestone',
            description: milestone,
            importance: 'high',
            date: currentDate,
        });
    });
    
    // 2. Process college games if in college season
    if (
        currentPhase === SeasonPhase.COLLEGE_REGULAR_SEASON ||
        currentPhase === SeasonPhase.CONFERENCE_TOURNAMENT ||
        currentPhase === SeasonPhase.NCAA_TOURNAMENT
    ) {
        // Check for user's college game today
        const userTeamName = state.userTeam?.name;
        const eventsToday = state.eventQueue?.filter(e => isSameISO(e.date, currentDate)) || [];
        const userGame = userTeamName 
            ? eventsToday.find(e => 
                e.type === 'GAME' && 
                (e.payload?.homeTeam === userTeamName || e.payload?.awayTeam === userTeamName)
              )
            : null;
        
        if (userGame && !options.autoSimUserGames) {
            userGameToday = true;
            const opponent = userGame.payload.homeTeam === userTeamName 
                ? userGame.payload.awayTeam 
                : userGame.payload.homeTeam;
            messages.push(`Game day against ${opponent}!`);
        }
    }
    
    // 3. Process NBA games in background
    if (!options.skipNBAGames && state.nbaSeasonSchedule) {
        const nbaGamesToday = getNBAGamesForDate(state.nbaSeasonSchedule, currentDate);
        if (nbaGamesToday.length > 0) {
            events.push({
                type: 'nba_game',
                description: `${nbaGamesToday.length} NBA games today`,
                importance: 'low',
                date: currentDate,
            });
            // Note: Actual NBA game simulation would be done here
            // For now, we just record the event
        }
    }
    
    // 4. Check transfer portal status
    if (isAnyPortalOpen(currentDate, calendar)) {
        const window = getActivePortalWindow(currentDate, calendar);
        if (window === 'winter' && currentDate === calendar.transferPortalWindow1Start) {
            events.push({
                type: 'transfer_portal',
                description: 'Winter transfer portal window is now open (20 days)',
                importance: 'high',
                date: currentDate,
            });
        } else if (window === 'spring' && currentDate === calendar.transferPortalWindow2Start) {
            events.push({
                type: 'transfer_portal',
                description: 'Spring transfer portal window is now open (15 days)',
                importance: 'high',
                date: currentDate,
            });
        }
    }
    
    // 5. Check recruiting periods
    if (isEarlySigningPeriod(currentDate, calendar)) {
        if (currentDate === calendar.earlySigningPeriodStart) {
            events.push({
                type: 'signing_day',
                description: 'Early signing period begins',
                importance: 'high',
                date: currentDate,
            });
        }
    }
    
    if (isNLISigningPeriod(currentDate, calendar)) {
        if (currentDate === calendar.nliSigningDayStart) {
            events.push({
                type: 'signing_day',
                description: 'National Letter of Intent signing period begins',
                importance: 'high',
                date: currentDate,
            });
        }
    }
    
    if (isSummerRecruitingOpen(currentDate, calendar)) {
        if (currentDate === calendar.summerRecruitingStart) {
            events.push({
                type: 'recruiting',
                description: 'Summer recruiting period opens - official visits available',
                importance: 'medium',
                date: currentDate,
            });
        }
    }
    
    // 6. Check draft-related dates
    if (isDraftLotteryDay(currentDate, calendar)) {
        events.push({
            type: 'draft_lottery',
            description: 'NBA Draft Lottery',
            importance: 'high',
            date: currentDate,
        });
    }
    
    if (isDraftDay(currentDate, calendar)) {
        events.push({
            type: 'nba_draft',
            description: 'NBA Draft',
            importance: 'high',
            date: currentDate,
        });
    }
    
    if (currentDate === calendar.proDeclarationDeadline) {
        events.push({
            type: 'calendar_milestone',
            description: 'Pro declaration deadline - last day to enter NBA Draft',
            importance: 'high',
            date: currentDate,
        });
    }
    
    if (currentDate === calendar.proWithdrawalDeadline) {
        events.push({
            type: 'calendar_milestone',
            description: 'Draft withdrawal deadline - final day to return to college',
            importance: 'high',
            date: currentDate,
        });
    }
    
    // 7. Check free agency
    if (currentDate === calendar.nbaFreeAgencyStart) {
        events.push({
            type: 'free_agency',
            description: 'NBA Free Agency opens',
            importance: 'high',
            date: currentDate,
        });
    }
    
    // 8. Advance date if no user game
    if (!userGameToday) {
        updates.currentDate = addDaysISO(currentDate, 1);
    }
    
    return {
        updates,
        messages,
        events,
        userGameToday,
        currentPhase,
    };
};

/**
 * Simulate multiple days until a significant event occurs.
 * Useful for "auto-sim to next event" functionality.
 */
export const simulateUntilEvent = (
    state: GameState,
    maxDays: number = 30,
    stopConditions: {
        stopOnUserGame?: boolean;
        stopOnPhaseChange?: boolean;
        stopOnHighImportanceEvent?: boolean;
    } = { stopOnUserGame: true, stopOnPhaseChange: true, stopOnHighImportanceEvent: true }
): {
    finalState: Partial<GameState>;
    daysSimulated: number;
    allMessages: string[];
    stopReason: string;
} => {
    let currentState = { ...state };
    let daysSimulated = 0;
    const allMessages: string[] = [];
    let stopReason = 'max_days_reached';
    let previousPhase: SeasonPhase | null = null;
    
    while (daysSimulated < maxDays) {
        const result = simulateDayWithCalendar(currentState as GameState, {
            autoSimUserGames: false,
        });
        
        // Apply updates
        currentState = { ...currentState, ...result.updates };
        allMessages.push(...result.messages);
        daysSimulated++;
        
        // Check stop conditions
        if (stopConditions.stopOnUserGame && result.userGameToday) {
            stopReason = 'user_game';
            break;
        }
        
        if (stopConditions.stopOnPhaseChange && previousPhase !== null && previousPhase !== result.currentPhase) {
            stopReason = `phase_change_to_${result.currentPhase}`;
            break;
        }
        previousPhase = result.currentPhase;
        
        if (stopConditions.stopOnHighImportanceEvent) {
            const highImportanceEvent = result.events.find(e => e.importance === 'high');
            if (highImportanceEvent) {
                stopReason = `event_${highImportanceEvent.type}`;
                break;
            }
        }
    }
    
    return {
        finalState: currentState,
        daysSimulated,
        allMessages,
        stopReason,
    };
};

/**
 * Get a summary of upcoming events in the next N days.
 */
export const getUpcomingEvents = (
    currentDate: ISODate,
    calendar: AnnualCalendar,
    daysAhead: number = 14
): SimulationEvent[] => {
    const events: SimulationEvent[] = [];
    let checkDate = currentDate;
    
    for (let i = 0; i < daysAhead; i++) {
        const milestones = getCalendarMilestones(checkDate, calendar);
        milestones.forEach(milestone => {
            events.push({
                type: 'calendar_milestone',
                description: milestone,
                importance: 'high',
                date: checkDate,
            });
        });
        checkDate = addDaysISO(checkDate, 1);
    }
    
    return events;
};

/**
 * Get the current season summary based on calendar position.
 */
export const getSeasonSummary = (
    currentDate: ISODate,
    calendar: AnnualCalendar
): {
    phase: SeasonPhase;
    phaseDescription: string;
    daysIntoPhase: number;
    nextMilestone: string | null;
    daysUntilNextMilestone: number | null;
} => {
    const phase = getSeasonPhaseFromCalendar(currentDate, calendar);
    
    const phaseDescriptions: Record<SeasonPhase, string> = {
        [SeasonPhase.COLLEGE_PRESEASON]: 'College Basketball Preseason',
        [SeasonPhase.COLLEGE_REGULAR_SEASON]: 'College Basketball Regular Season',
        [SeasonPhase.CONFERENCE_TOURNAMENT]: 'Conference Tournaments',
        [SeasonPhase.NCAA_TOURNAMENT]: 'NCAA Tournament',
        [SeasonPhase.TRANSFER_PORTAL_SPRING]: 'Spring Transfer Portal Window',
        [SeasonPhase.COLLEGE_OFFSEASON]: 'College Offseason',
        [SeasonPhase.COLLEGE_SUMMER]: 'College Summer',
        [SeasonPhase.NBA_PRESEASON]: 'NBA Preseason',
        [SeasonPhase.NBA_REGULAR_SEASON]: 'NBA Regular Season',
        [SeasonPhase.NBA_PLAY_IN]: 'NBA Play-In Tournament',
        [SeasonPhase.NBA_PLAYOFFS]: 'NBA Playoffs',
        [SeasonPhase.NBA_DRAFT_WEEK]: 'NBA Draft Week',
        [SeasonPhase.NBA_FREE_AGENCY]: 'NBA Free Agency',
        [SeasonPhase.NBA_ALL_STAR]: 'NBA All-Star Weekend',
        [SeasonPhase.SUMMER_RECRUITING]: 'Summer Recruiting Period',
        [SeasonPhase.PRESEASON]: 'Preseason',
        [SeasonPhase.REGULAR_SEASON]: 'Regular Season',
        [SeasonPhase.OFFSEASON]: 'Offseason',
    };
    
    // Find next milestone
    const upcomingEvents = getUpcomingEvents(currentDate, calendar, 60);
    const nextEvent = upcomingEvents.find(e => e.date > currentDate);
    
    return {
        phase,
        phaseDescription: phaseDescriptions[phase] || 'Unknown Phase',
        daysIntoPhase: 0, // Would need phase start date calculation
        nextMilestone: nextEvent?.description || null,
        daysUntilNextMilestone: nextEvent ? 
            Math.ceil((new Date(nextEvent.date).getTime() - new Date(currentDate).getTime()) / 86400000) : 
            null,
    };
};
