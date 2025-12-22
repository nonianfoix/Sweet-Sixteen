import { GameResult } from '../types';

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
