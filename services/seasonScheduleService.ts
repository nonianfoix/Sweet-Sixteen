import type { GameResult, ISODate, ScheduledGameEvent, SeasonAnchors, Team, TeamSchedule } from '../types';
import { CONFERENCE_STRENGTH } from '../constants';
import { addDaysISO, dayOfWeekISO, diffInDaysISO, toISODate } from './dateService';

type ConferenceTier = 'Power' | 'Mid' | 'Low' | 'Independent';

export type ScheduleSettings = {
    regularSeasonGamesPerTeam?: number; // default 31
    conferenceGamesByConference?: Record<string, number>;
};

const DEFAULT_REGULAR_SEASON_GAMES = 31;
const DEFAULT_CONF_GAMES_BY_TIER: Record<ConferenceTier, number> = {
    Power: 20,
    Mid: 18,
    Low: 16,
    Independent: 0,
};

const shuffleInPlace = <T,>(arr: T[], rng: () => number) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
};

const makeMulberry32 = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const isoOnOrAfterWithDow = (startISO: ISODate, targetDow: number): ISODate => {
    let cursor = startISO;
    for (let i = 0; i < 8; i++) {
        if (dayOfWeekISO(cursor) === targetDow) return cursor;
        cursor = addDaysISO(cursor, 1);
    }
    return cursor;
};

export const buildSeasonAnchors = (seasonYear: number): SeasonAnchors => {
    const nov1 = toISODate(seasonYear, 11, 1);
    const seasonStart = isoOnOrAfterWithDow(nov1, 1); // Monday

    const mar1 = toISODate(seasonYear + 1, 3, 1);
    const regularSeasonEnd = isoOnOrAfterWithDow(mar1, 0); // Sunday

    const confTourneyStart = addDaysISO(regularSeasonEnd, 1); // Monday after
    const confTourneyEnd = addDaysISO(confTourneyStart, 5); // Saturday
    const selectionSunday = addDaysISO(confTourneyEnd, 1); // Sunday immediately after

    const firstFourTue = addDaysISO(selectionSunday, 2);
    const firstFourWed = addDaysISO(selectionSunday, 3);
    const r64Thu = addDaysISO(selectionSunday, 4);
    const r64Fri = addDaysISO(selectionSunday, 5);
    const r32Sat = addDaysISO(selectionSunday, 6);
    const r32Sun = addDaysISO(selectionSunday, 7);
    const s16Thu = addDaysISO(selectionSunday, 11);
    const s16Fri = addDaysISO(selectionSunday, 12);
    const e8Sat = addDaysISO(selectionSunday, 13);
    const e8Sun = addDaysISO(selectionSunday, 14);
    const finalFourSat = addDaysISO(selectionSunday, 20);
    const titleMon = addDaysISO(selectionSunday, 22);

    return {
        seasonYear,
        seasonStart,
        regularSeasonEnd,
        confTourneyStart,
        confTourneyEnd,
        selectionSunday,
        ncaa: {
            firstFourTue,
            firstFourWed,
            r64Thu,
            r64Fri,
            r32Sat,
            r32Sun,
            s16Thu,
            s16Fri,
            e8Sat,
            e8Sun,
            finalFourSat,
            titleMon,
        },
    };
};

const listDatesInRange = (startISO: ISODate, endISO: ISODate): ISODate[] => {
    const days = diffInDaysISO(endISO, startISO);
    const out: ISODate[] = [];
    for (let i = 0; i <= days; i++) out.push(addDaysISO(startISO, i));
    return out;
};

const pickSlotDates = (startISO: ISODate, endISO: ISODate, count: number, preferredDows: number[], overflowDows: number[], rng: () => number): ISODate[] => {
    const all = listDatesInRange(startISO, endISO);
    const preferred = all.filter(d => preferredDows.includes(dayOfWeekISO(d)));
    const withOverflow = preferred.length >= count ? preferred : all.filter(d => preferredDows.includes(dayOfWeekISO(d)) || overflowDows.includes(dayOfWeekISO(d)));
    const pool = withOverflow.length >= count ? withOverflow : all;

    if (count <= 1) return [pool[Math.floor(rng() * pool.length)]].filter(Boolean) as ISODate[];

    const picked = new Set<ISODate>();
    const maxIdx = pool.length - 1;
    for (let i = 0; i < count; i++) {
        const ideal = Math.round((i * maxIdx) / (count - 1));
        const jitter = Math.floor((rng() * 3) - 1); // -1..1
        let idx = Math.max(0, Math.min(maxIdx, ideal + jitter));
        let tries = 0;
        while (picked.has(pool[idx]) && tries < 10) {
            idx = Math.max(0, Math.min(maxIdx, idx + (tries % 2 === 0 ? 1 : -1)));
            tries++;
        }
        picked.add(pool[idx]);
    }
    return Array.from(picked).sort();
};

const getConferenceTier = (conference: string): ConferenceTier => {
    const tier = (CONFERENCE_STRENGTH[conference] as ConferenceTier | undefined) || 'Independent';
    if (tier === 'Power' || tier === 'Mid' || tier === 'Low') return tier;
    return 'Independent';
};

const roundRobinRounds = (teamIds: string[], rng: () => number): Array<Array<[string, string]>> => {
    const teams = [...teamIds];
    shuffleInPlace(teams, rng);

    const isOdd = teams.length % 2 === 1;
    if (isOdd) teams.push('__BYE__');

    const n = teams.length;
    const rounds: Array<Array<[string, string]>> = [];
    const fixed = teams[0];
    let rot = teams.slice(1);

    for (let r = 0; r < n - 1; r++) {
        const roundTeams = [fixed, ...rot];
        const pairs: Array<[string, string]> = [];
        for (let i = 0; i < n / 2; i++) {
            const a = roundTeams[i];
            const b = roundTeams[n - 1 - i];
            if (a === '__BYE__' || b === '__BYE__') continue;
            const swap = (r + i) % 2 === 1;
            pairs.push(swap ? [b, a] : [a, b]);
        }
        rounds.push(pairs);

        rot = [rot[rot.length - 1], ...rot.slice(0, -1)];
    }
    return rounds;
};

const buildConferenceMatchupsByDate = (
    seasonYear: number,
    conferenceId: string,
    teamIds: string[],
    confGameCountPerTeam: number,
    confDates: ISODate[],
    rng: () => number
): Array<{ date: ISODate; homeTeamId: string; awayTeamId: string }> => {
    if (confGameCountPerTeam <= 0 || teamIds.length < 2) return [];

    const single = roundRobinRounds(teamIds, rng);
    const double = [...single, ...single.map(round => round.map(([h, a]) => [a, h] as [string, string]))];
    const rounds = confGameCountPerTeam <= single.length ? single : double;

    const neededRounds = Math.min(confGameCountPerTeam, rounds.length);
    const dates = [...confDates].sort();

    if (dates.length < neededRounds) {
        throw new Error(`Not enough conference dates for ${conferenceId}: need ${neededRounds}, have ${dates.length}`);
    }

    const out: Array<{ date: ISODate; homeTeamId: string; awayTeamId: string }> = [];
    for (let i = 0; i < neededRounds; i++) {
        const date = dates[i];
        for (const [home, away] of rounds[i]) {
            out.push({ date, homeTeamId: home, awayTeamId: away });
        }
    }
    return out;
};

export type GeneratedSeasonSchedule = {
    seasonYear: number;
    anchors: SeasonAnchors;
    regularSeasonDates: ISODate[];
    scheduledGamesById: Record<string, ScheduledGameEvent>;
    scheduledEventIdsByDate: Record<ISODate, string[]>;
    teamSchedulesById: Record<string, TeamSchedule>;
    legacySchedule: GameResult[][];
};

export const generateSeasonSchedule = (
    seasonYear: number,
    teams: Team[],
    settings: ScheduleSettings,
    anchors: SeasonAnchors
): GeneratedSeasonSchedule => {
    const rng = makeMulberry32(seasonYear * 9301 + 49297);
    const regularSeasonGamesPerTeam = settings.regularSeasonGamesPerTeam ?? DEFAULT_REGULAR_SEASON_GAMES;

    const teamsById = new Map<string, Team>(teams.map(t => [t.name, t]));
    const teamIds = teams.map(t => t.name);

    const conferences = new Map<string, string[]>();
    for (const team of teams) {
        const conf = team.conference || 'Independent';
        const list = conferences.get(conf) || [];
        list.push(team.name);
        conferences.set(conf, list);
    }

    const confGamesByConference: Record<string, number> = {};
    for (const [conf] of conferences) {
        const tier = getConferenceTier(conf);
        confGamesByConference[conf] = DEFAULT_CONF_GAMES_BY_TIER[tier];
    }
    Object.assign(confGamesByConference, settings.conferenceGamesByConference || {});

    const maxConfGames = Math.max(0, ...Object.values(confGamesByConference));
    const earlySlots = Math.max(0, regularSeasonGamesPerTeam - maxConfGames);
    const lateSlots = regularSeasonGamesPerTeam - earlySlots;

    const dec31 = toISODate(seasonYear, 12, 31);
    const jan1 = toISODate(seasonYear + 1, 1, 1);

    const earlyDates = pickSlotDates(
        anchors.seasonStart,
        dec31,
        earlySlots,
        [1, 2, 3, 6], // Mon/Tue/Wed/Sat
        [5, 0], // Fri/Sun
        rng
    );

    const lateDates = pickSlotDates(
        jan1,
        anchors.regularSeasonEnd,
        lateSlots,
        [3, 6], // Wed/Sat
        [2, 4], // Tue/Thu
        rng
    );

    const regularSeasonDates = [...earlyDates, ...lateDates].sort();

    const scheduledGamesById: Record<string, ScheduledGameEvent> = {};
    const scheduledEventIdsByDate: Record<ISODate, string[]> = {};
    const teamSchedulesById: Record<string, TeamSchedule> = Object.fromEntries(
        teamIds.map(id => [id, { teamId: id, gamesByDate: {} }])
    );

    const addScheduledGame = (game: Omit<ScheduledGameEvent, 'id'>): string => {
        const id = crypto.randomUUID();
        const full: ScheduledGameEvent = { id, ...game };
        scheduledGamesById[id] = full;
        if (!scheduledEventIdsByDate[full.date]) scheduledEventIdsByDate[full.date] = [];
        scheduledEventIdsByDate[full.date].push(id);

        teamSchedulesById[full.homeTeamId].gamesByDate[full.date] = id;
        teamSchedulesById[full.awayTeamId].gamesByDate[full.date] = id;
        return id;
    };

    const pairCounts = new Map<string, number>();
    const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
    const getPairCount = (a: string, b: string) => pairCounts.get(pairKey(a, b)) || 0;
    const bumpPairCount = (a: string, b: string) => {
        const key = pairKey(a, b);
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    };

    // 1) Conference games
    const confDateChoices = new Map<string, ISODate[]>();
    const lateIdx = Array.from({ length: lateDates.length }, (_, i) => i);
    for (const [conf] of conferences) {
        const confTarget = Math.max(0, Math.min(regularSeasonGamesPerTeam, confGamesByConference[conf] ?? 0));
        const indices = [...lateIdx];
        shuffleInPlace(indices, rng);
        const chosen = indices.slice(0, confTarget).sort((a, b) => a - b).map(i => lateDates[i]);
        confDateChoices.set(conf, chosen);
    }

    const gamesAlreadyOnDate = new Map<ISODate, Set<string>>();
    const markBusy = (date: ISODate, teamId: string) => {
        const set = gamesAlreadyOnDate.get(date) || new Set<string>();
        set.add(teamId);
        gamesAlreadyOnDate.set(date, set);
    };
    const isBusy = (date: ISODate, teamId: string) => gamesAlreadyOnDate.get(date)?.has(teamId) ?? false;

    for (const [conf, confTeamIds] of conferences) {
        const confTarget = Math.max(0, Math.min(regularSeasonGamesPerTeam, confGamesByConference[conf] ?? 0));
        if (confTarget <= 0) continue;

        const confDates = confDateChoices.get(conf) || [];
        const matchups = buildConferenceMatchupsByDate(seasonYear, conf, confTeamIds, confTarget, confDates, rng);
        for (const m of matchups) {
            if (isBusy(m.date, m.homeTeamId) || isBusy(m.date, m.awayTeamId)) {
                throw new Error(`Conference scheduling collision: ${conf} ${m.homeTeamId} vs ${m.awayTeamId} on ${m.date}`);
            }
            addScheduledGame({
                seasonYear,
                date: m.date,
                type: 'REG',
                homeTeamId: m.homeTeamId,
                awayTeamId: m.awayTeamId,
                conferenceId: conf,
            });
            markBusy(m.date, m.homeTeamId);
            markBusy(m.date, m.awayTeamId);
            bumpPairCount(m.homeTeamId, m.awayTeamId);
        }
    }

    // 2) Non-conference fill (per date)
    const chooseHomeAway = (a: Team, b: Team): { home: string; away: string; neutralSite?: boolean } => {
        const diff = (a.prestige ?? 50) - (b.prestige ?? 50);
        const buy = Math.abs(diff) >= 18 && rng() < 0.55;
        if (buy) {
            const home = diff >= 0 ? a.name : b.name;
            const away = home === a.name ? b.name : a.name;
            return { home, away };
        }
        const neutral = rng() < 0.06;
        if (neutral) {
            const home = rng() < 0.5 ? a.name : b.name;
            const away = home === a.name ? b.name : a.name;
            return { home, away, neutralSite: true };
        }
        const home = rng() < 0.5 ? a.name : b.name;
        const away = home === a.name ? b.name : a.name;
        return { home, away };
    };

    for (const date of regularSeasonDates) {
        const openTeams = teamIds.filter(teamId => !isBusy(date, teamId));
        if (openTeams.length === 0) continue;
        if (openTeams.length % 2 === 1) {
            throw new Error(`Non-conference fill expects even open team count on ${date}, got ${openTeams.length}`);
        }

        const remaining = [...openTeams];
        shuffleInPlace(remaining, rng);

        while (remaining.length >= 2) {
            const teamId = remaining.shift()!;
            const team = teamsById.get(teamId);
            if (!team) continue;

            const pickBestOpponentIndex = (predicate: (oppId: string) => boolean) => {
                let bestIdx = -1;
                let bestScore = Number.POSITIVE_INFINITY;
                for (let i = 0; i < remaining.length; i++) {
                    const oppId = remaining[i];
                    if (!predicate(oppId)) continue;
                    const score = getPairCount(teamId, oppId);
                    if (score < bestScore) {
                        bestScore = score;
                        bestIdx = i;
                        if (bestScore === 0) break;
                    }
                }
                return bestIdx;
            };

            const teamConf = team.conference || 'Independent';
            let oppIdx = pickBestOpponentIndex(oppId => {
                const opp = teamsById.get(oppId);
                if (!opp) return false;
                return (opp.conference || 'Independent') !== teamConf && getPairCount(teamId, oppId) === 0;
            });
            if (oppIdx === -1) {
                oppIdx = pickBestOpponentIndex(oppId => {
                    const opp = teamsById.get(oppId);
                    if (!opp) return false;
                    return (opp.conference || 'Independent') !== teamConf && getPairCount(teamId, oppId) < 2;
                });
            }
            if (oppIdx === -1) {
                oppIdx = pickBestOpponentIndex(() => true);
            }

            if (oppIdx === -1) {
                throw new Error(`Failed to find opponent for ${teamId} on ${date}`);
            }

            const oppId = remaining.splice(oppIdx, 1)[0];
            const oppTeam = teamsById.get(oppId);
            if (!oppTeam) continue;

            const { home, away, neutralSite } = chooseHomeAway(team, oppTeam);
            addScheduledGame({
                seasonYear,
                date,
                type: 'REG',
                homeTeamId: home,
                awayTeamId: away,
                neutralSite,
            });
            markBusy(date, home);
            markBusy(date, away);
            bumpPairCount(teamId, oppId);
        }
    }

    // 3) Build legacy schedule (date-indexed list of results)
    const legacySchedule: GameResult[][] = regularSeasonDates.map(date => {
        const ids = scheduledEventIdsByDate[date] || [];
        return ids.map(id => {
            const ev = scheduledGamesById[id];
            return {
                homeTeam: ev.homeTeamId,
                awayTeam: ev.awayTeamId,
                homeScore: 0,
                awayScore: 0,
                played: false,
                date,
                gameEventId: id,
                isPlayoffGame: ev.type !== 'REG',
            } satisfies GameResult;
        });
    });

    return {
        seasonYear,
        anchors,
        regularSeasonDates,
        scheduledGamesById,
        scheduledEventIdsByDate,
        teamSchedulesById,
        legacySchedule,
    };
};

export type ScheduleValidationIssue = { code: string; message: string };

export const validateSeasonSchedule = (
    schedule: GeneratedSeasonSchedule,
    teams: Team[],
    settings: ScheduleSettings
): ScheduleValidationIssue[] => {
    const issues: ScheduleValidationIssue[] = [];
    const targetGames = settings.regularSeasonGamesPerTeam ?? DEFAULT_REGULAR_SEASON_GAMES;

    const confGamesByConference: Record<string, number> = {};
    const conferences = new Map<string, string[]>();
    for (const team of teams) {
        const conf = team.conference || 'Independent';
        conferences.set(conf, [...(conferences.get(conf) || []), team.name]);
    }
    for (const [conf] of conferences) {
        const tier = getConferenceTier(conf);
        confGamesByConference[conf] = DEFAULT_CONF_GAMES_BY_TIER[tier];
    }
    Object.assign(confGamesByConference, settings.conferenceGamesByConference || {});

    // Per-team counts + double-book checks
    for (const team of teams) {
        const sched = schedule.teamSchedulesById[team.name];
        if (!sched) {
            issues.push({ code: 'MISSING_TEAM_SCHEDULE', message: `Missing TeamSchedule for ${team.name}` });
            continue;
        }
        const dates = Object.keys(sched.gamesByDate);
        if (dates.length !== targetGames) {
            issues.push({ code: 'BAD_GAME_COUNT', message: `${team.name} has ${dates.length} games (target ${targetGames})` });
        }
        const uniqueDates = new Set(dates);
        if (uniqueDates.size !== dates.length) {
            issues.push({ code: 'DUPLICATE_DATE', message: `${team.name} has multiple games on the same date` });
        }

        const confTarget = Math.max(0, Math.min(targetGames, confGamesByConference[team.conference || 'Independent'] ?? 0));
        let confCount = 0;
        for (const id of Object.values(sched.gamesByDate)) {
            const ev = schedule.scheduledGamesById[id];
            if (ev?.conferenceId && ev.conferenceId === (team.conference || 'Independent')) confCount++;
        }
        if (confCount !== confTarget) {
            issues.push({ code: 'BAD_CONF_COUNT', message: `${team.name} has ${confCount} conference games (target ${confTarget})` });
        }
    }

    // Postseason anchors in order
    const a = schedule.anchors;
    const ordered: ISODate[] = [
        a.seasonStart,
        a.regularSeasonEnd,
        a.confTourneyStart,
        a.confTourneyEnd,
        a.selectionSunday,
        a.ncaa.firstFourTue,
        a.ncaa.firstFourWed,
        a.ncaa.r64Thu,
        a.ncaa.r64Fri,
        a.ncaa.r32Sat,
        a.ncaa.r32Sun,
        a.ncaa.s16Thu,
        a.ncaa.s16Fri,
        a.ncaa.e8Sat,
        a.ncaa.e8Sun,
        a.ncaa.finalFourSat,
        a.ncaa.titleMon,
    ];
    for (let i = 1; i < ordered.length; i++) {
        if (ordered[i] < ordered[i - 1]) {
            issues.push({ code: 'ANCHOR_ORDER', message: `Anchors out of order at ${ordered[i - 1]} -> ${ordered[i]}` });
            break;
        }
    }

    // Uniqueness: not all teams share identical opponent/date sets
    const signatureByTeam: string[] = teams.map(t => {
        const sched = schedule.teamSchedulesById[t.name];
        if (!sched) return '';
        const tuples = Object.entries(sched.gamesByDate)
            .map(([date, id]) => {
                const ev = schedule.scheduledGamesById[id];
                const opp = ev.homeTeamId === t.name ? ev.awayTeamId : ev.homeTeamId;
                return `${date}|${opp}`;
            })
            .sort();
        return tuples.join(',');
    });
    const uniqueSigs = new Set(signatureByTeam.filter(Boolean));
    if (uniqueSigs.size <= Math.max(1, Math.floor(teams.length * 0.05))) {
        issues.push({ code: 'SCHEDULES_TOO_SIMILAR', message: `Schedules appear too similar across teams (${uniqueSigs.size} unique signatures / ${teams.length})` });
    }

    return issues;
};
