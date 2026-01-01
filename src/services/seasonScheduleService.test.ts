// @ts-nocheck
import { describe, expect, test } from 'vitest';
import type { Team } from '../types';
import { dayOfWeekISO } from './dateService';
import { buildSeasonAnchors, generateSeasonSchedule, validateSeasonSchedule } from './seasonScheduleService';

const makeTeam = (name: string, conference: string, prestige: number): Team =>
    ({
        name,
        conference,
        prestige,
        recruitingPrestige: prestige,
        roster: [],
        staff: { assistants: [], trainers: [], scouts: [] },
        record: { wins: 0, losses: 0 },
        isUserTeam: false,
        state: 'NA',
        playbookFamiliarity: 50,
    } as any);

describe('seasonScheduleService', () => {
    test('buildSeasonAnchors is deterministic and ordered', () => {
        const anchors = buildSeasonAnchors(2025);
        expect(anchors.seasonYear).toBe(2025);

        // Season start: first Monday on/after Nov 1
        expect(anchors.seasonStart >= '2025-11-01').toBe(true);
        expect(dayOfWeekISO(anchors.seasonStart)).toBe(1);

        // Regular season end: first Sunday on/after Mar 1 (following year)
        expect(anchors.regularSeasonEnd >= '2026-03-01').toBe(true);
        expect(dayOfWeekISO(anchors.regularSeasonEnd)).toBe(0);

        // NCAA anchors are in increasing order
        expect(anchors.ncaa.firstFourTue < anchors.ncaa.titleMon).toBe(true);
    });

    test('generateSeasonSchedule creates valid 31-game schedules keyed by ISO dates', () => {
        const teams: Team[] = [
            ...Array.from({ length: 20 }, (_, i) => makeTeam(`SEC-${i + 1}`, 'SEC', 90 - i)),
            ...Array.from({ length: 20 }, (_, i) => makeTeam(`BE-${i + 1}`, 'Big East', 80 - i)),
        ];

        const seasonYear = 2025;
        const anchors = buildSeasonAnchors(seasonYear);
        const settings = {
            regularSeasonGamesPerTeam: 31,
            conferenceGamesByConference: { SEC: 6, 'Big East': 6 },
        };

        const schedule = generateSeasonSchedule(seasonYear, teams, settings, anchors);
        const issues = validateSeasonSchedule(schedule, teams, settings);
        expect(issues).toEqual([]);

        for (const team of teams) {
            const teamSchedule = schedule.teamSchedulesById[team.name];
            expect(Object.keys(teamSchedule.gamesByDate).length).toBe(31);
        }
    });
});

