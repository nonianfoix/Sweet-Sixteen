import React, { useState, useMemo, useCallback } from 'react';
import type {
    GameState,
    GameAction,
    TeamColors,
    Recruit,
    RosterPositions,
    GameResult,
    Team,
    OfferPitchType,
} from '../types';
import { getSchoolLogoUrl } from '../services/utils';
import { getInterestTier, calculateAvailableScholarships, getPositionDepthSummary, formatPlayerHeight } from '../services/gameReducer';
import { formatPotentialValue, normalizeInterest } from '../services/gameUtils';
import { calculateRecruitInterestScore, calculateRecruitInterestBreakdown, getRecruitWhyBadges, estimateRecruitDistanceMilesToTeam, getRecruitRegionForState, buildRecruitOfferShortlist, getRecruitOfferShareTemperatureMultiplier, calculateTeamNeeds, getContactPoints } from '../services/gameService';
import RecruitOfferDetailsModal from '../components/RecruitOfferDetailsModal';
import OffersModal from '../components/modals/OffersModal';
import GeminiIcon from '../BRAND LOGOS/Gemini symbol for twins.svg';
import TreeIcon from '../BRAND LOGOS/Tree_icon.svg';
import * as constants from '../constants';

const { SCHOOLS, SCHOOL_COLORS, RECRUITING_COSTS, US_STATES } = constants;

// Shared styles object (simplified version - may need expansion)
const styles: { [key: string]: React.CSSProperties } = {
    button: {
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};

const StarRating = ({ stars }: { stars: number }) => {

    const normalized = Math.max(0, Math.min(5, Math.round(stars || 0)));

    const filledChar = String.fromCharCode(0x2605);

    const emptyChar = String.fromCharCode(0x2606);

    const filled = filledChar.repeat(normalized);

    const empty = emptyChar.repeat(5 - normalized);

    return (

        <span

            aria-label={`${normalized} star${normalized === 1 ? '' : 's'}`}

            style={{

                color: '#FFC72C',

                textShadow: '1px 1px #000, -1px -1px #000, 1px -1px #000, -1px 1px #000',

                fontSize: '1.2rem',

                letterSpacing: '1.5px',

            }}

        >

            {filled}

            {empty}

        </span>

    );

};

	const CommitmentStatus = ({ teamName, teamRank, isSigningPeriod, isSoftCommit }: { teamName: string, teamRank?: number, isSigningPeriod: boolean, isSoftCommit?: boolean }) => {
	    const teamColors = SCHOOL_COLORS[teamName] || { primary: '#C0C0C0', secondary: '#808080', text: '#000000' };

    const style: React.CSSProperties = {
        ...styles.button,
        backgroundColor: teamColors.primary,
        color: teamColors.text,
        padding: '5px',
        fontSize: '0.5rem',
        textAlign: 'center',
        cursor: 'default',
        width: '100%',
        minWidth: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        lineHeight: '1.2',
    };

	    const [label1, label2] = isSigningPeriod ? ['Signed', 'With'] : [isSoftCommit ? 'Soft' : 'Hard', 'Committed'];

    return (
        <div style={style}>
            <span>{label1}</span>
            <span>{label2}</span>
            <span style={{ fontWeight: 'bold' }}>{teamName}</span>
            {teamRank && (
                <span style={{ fontWeight: 'bold', fontSize: '0.6rem', marginLeft: '3px' }}>#{teamRank}</span>
            )}
        </div>
    );
};


const MotivationDisplay = ({ motivations }: { motivations?: any }) => {
    if (!motivations) return null;
    const keys = Object.keys(motivations) as (keyof typeof motivations)[];
    // Sort keys by value descending to show top drivers first
    const sortedKeys = keys.sort((a, b) => motivations[b] - motivations[a]).slice(0, 3);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.65rem' }}>
            {sortedKeys.map(k => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{k}</span>
                    <div style={{ width: '100%', backgroundColor: '#e0e0e0', height: '6px', borderRadius: '3px' }}>
                        <div style={{ 
                            width: `${motivations[k]}%`, 
                            backgroundColor: motivations[k] > 75 ? '#4CAF50' : motivations[k] > 50 ? '#FFC107' : '#D32F2F', 
                            height: '100%', 
                            borderRadius: '3px' 
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

	const RecruitingViewInner = ({ state, dispatch, colors, isSigningPeriod }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors, isSigningPeriod?: boolean }) => {
	    const [viewingOffersRecruitId, setViewingOffersRecruitId] = useState<string | null>(null);
	    const [viewingOffersStartOfferBuilder, setViewingOffersStartOfferBuilder] = useState(false);
	    const [negativeRecruitingFor, setNegativeRecruitingFor] = useState<Recruit | null>(null);
	    const [schedulingVisitFor, setSchedulingVisitFor] = useState<Recruit | null>(null);
	
	    const [hideVerballyCommitted, setHideVerballyCommitted] = useState(false);
	    const [hideSigned, setHideSigned] = useState(false);
	    const [showUserCommitsOnly, setShowUserCommitsOnly] = useState(false);
	    const [positionFilter, setPositionFilter] = useState<'all' | RosterPositions>('all');
	    const [starFilter, setStarFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
	    const [minInterest, setMinInterest] = useState(0);
	    const [targetsOnly, setTargetsOnly] = useState(false);
	    const [searchQuery, setSearchQuery] = useState('');
	    const [regionFilter, setRegionFilter] = useState<'all' | 'Northeast' | 'Midwest' | 'South' | 'West'>('all');
	    const [homeStateFilter, setHomeStateFilter] = useState<'all' | string>('all');
	    const [maxDistanceMiles, setMaxDistanceMiles] = useState(2500);
	    const [stageFilter, setStageFilter] = useState<'all' | string>('all');
	    const [needsFitOnly, setNeedsFitOnly] = useState(false);
	    const [archetypeFilter, setArchetypeFilter] = useState<'all' | string>('all');
    type SortableKey = keyof Pick<Recruit, 'overall' | 'potential' | 'interest' | 'stars'> | 'rank';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' }>({ key: 'rank', direction: 'ascending' });

    const userTeamName = state.userTeam?.name ?? null;
    const teamNeeds = useMemo(() => state.userTeam ? calculateTeamNeeds(state.userTeam) : '', [state.userTeam]);

    const powerRankings = useMemo(() => {
        const ranks = new Map<string, number>();
        [...state.allTeams]
            .sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10))
            .forEach((team, index) => {
                ranks.set(team.name, index + 1);
            });
        return ranks;
    }, [state.allTeams]);

    const recruitRanks = useMemo(() => {
        // Use the canonical board ranks computed in `services/gameService.ts` via `recomputeRecruitBoardRanks`.
        const ranks = new Map<string, number>();
        state.recruits.forEach(recruit => {
            if (typeof recruit.nationalRank === 'number') {
                ranks.set(recruit.id, recruit.nationalRank);
            }
        });
        return ranks;
    }, [state.recruits]);

    const availableArchetypes = useMemo(() => {
        const archs = new Set<string>();
        state.recruits.forEach(r => {
            if (r.archetype) archs.add(r.archetype);
        });
        return ['all', ...Array.from(archs).sort()];
    }, [state.recruits]);



    const sortedRecruits = useMemo(() => {
        let sortableRecruits = [...state.recruits];
        sortableRecruits.sort((a, b) => {
            if (sortConfig.key === 'rank') {
                const rankA = recruitRanks.get(a.id);
                const rankB = recruitRanks.get(b.id);
                const aIsRanked = rankA !== undefined;
                const bIsRanked = rankB !== undefined;
                if (sortConfig.direction === 'ascending') {
                    if (aIsRanked && !bIsRanked) return -1;
                    if (!aIsRanked && bIsRanked) return 1;
                    if (!aIsRanked && !bIsRanked) return b.overall - a.overall;
                    return rankA! - rankB!;
                } else {
                    if (aIsRanked && !bIsRanked) return -1;
                    if (!aIsRanked && bIsRanked) return 1;
                    if (!aIsRanked && !bIsRanked) return b.overall - a.overall;
                    return rankB! - rankA!;
                }
            } else {
                const key = sortConfig.key as Exclude<SortableKey, 'rank'>;
                if (a[key] < b[key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[key] > b[key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            }
        });
        return sortableRecruits;
    }, [state.recruits, sortConfig, recruitRanks]);

	    const filteredRecruits = useMemo(() => {
	        const query = searchQuery.trim().toLowerCase();
	        const needsText = state.userTeam ? calculateTeamNeeds(state.userTeam) : '';
	        const needsPositions = (needsText.match(/\b(PG|SG|SF|PF|C)\b/g) || []) as RosterPositions[];
	        return sortedRecruits.filter(r => {
	            const hasCommitment = !!r.verbalCommitment;
	            const isSigned = Boolean(isSigningPeriod && hasCommitment);
	            const isVerbalOnly = hasCommitment && !isSigned;
	            const committedToUser = userTeamName ? r.verbalCommitment === userTeamName : false;
	            if (hideSigned && isSigned) return false;
	            if (hideVerballyCommitted && isVerbalOnly) return false;
	            if (showUserCommitsOnly && !committedToUser) return false;
	            if (positionFilter !== 'all') {
	                const matchesPrimary = r.position === positionFilter;
	                const matchesSecondary = r.secondaryPosition === positionFilter;
	                if (!matchesPrimary && !matchesSecondary) return false;
	            }
	            if (archetypeFilter !== 'all' && r.archetype !== archetypeFilter) return false;
	            if (starFilter !== 'all' && r.stars !== starFilter) return false;
	            if (r.interest < minInterest) return false;
	            if (targetsOnly && !r.isTargeted) return false;
	            if (regionFilter !== 'all') {
	                const reg = getRecruitRegionForState(r.hometownState || r.homeState) || 'Unknown';
	                if (reg !== regionFilter) return false;
	            }
	            if (homeStateFilter !== 'all') {
	                if ((r.hometownState || r.homeState) !== homeStateFilter) return false;
	            }
	            if (maxDistanceMiles < 2500 && state.userTeam) {
	                const dist = estimateRecruitDistanceMilesToTeam(r, state.userTeam);
	                if (dist > maxDistanceMiles) return false;
	            }
	            if (stageFilter !== 'all') {
	                if ((r.recruitmentStage || (r.verbalCommitment ? 'HardCommit' : 'Open')) !== stageFilter) return false;
	            }
	            if (needsFitOnly && needsPositions.length) {
	                const fits = needsPositions.includes(r.position as RosterPositions) || (r.secondaryPosition ? needsPositions.includes(r.secondaryPosition as RosterPositions) : false);
	                if (!fits) return false;
	            }
	            if (query && !r.name.toLowerCase().includes(query)) return false;
	            return true;
	        });
	    }, [sortedRecruits, hideSigned, hideVerballyCommitted, showUserCommitsOnly, isSigningPeriod, positionFilter, archetypeFilter, starFilter, minInterest, targetsOnly, searchQuery, userTeamName, regionFilter, homeStateFilter, maxDistanceMiles, stageFilter, needsFitOnly, state.userTeam]);

    const requestSort = (key: SortableKey) => {
        let direction: 'ascending' | 'descending' = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };



    const renderSortArrow = (key: SortableKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '?' : '?';
    };

    if (!state.userTeam) return null;
    
    const totalScholarships = calculateAvailableScholarships(state.userTeam);
    const offersMade = state.recruits.filter(r => r.userHasOffered && r.verbalCommitment !== state.userTeam!.name).length;
    const committedRecruits = state.recruits.filter(r => r.verbalCommitment === state.userTeam!.name).length;
    const availableScholarships = totalScholarships - offersMade - committedRecruits;
    const targetedRecruits = state.recruits.filter(r => r.isTargeted).length;
    const contactPointsRemaining = Math.max(0, getContactPoints(state.userTeam) - state.contactsMadeThisWeek);
    const positionOptions: (RosterPositions | 'all')[] = ['all', 'PG', 'SG', 'SF', 'PF', 'C'];
    const starOptions: ('all' | 1 | 2 | 3 | 4 | 5)[] = ['all', 5, 4, 3, 2, 1];
	    const filtersActive =
	        hideVerballyCommitted ||
	        hideSigned ||
	        showUserCommitsOnly ||
	        positionFilter !== 'all' ||
            archetypeFilter !== 'all' ||

	        starFilter !== 'all' ||
	        minInterest > 0 ||
	        targetsOnly ||
	        regionFilter !== 'all' ||
	        homeStateFilter !== 'all' ||
	        maxDistanceMiles < 2500 ||
	        stageFilter !== 'all' ||
	        needsFitOnly ||
	        searchQuery.trim().length > 0;

	    const resetRecruitFilters = () => {
	        setHideVerballyCommitted(false);
	        setHideSigned(false);
	        setShowUserCommitsOnly(false);
	        setPositionFilter('all');
	        setStarFilter('all');
	        setMinInterest(0);
	        setTargetsOnly(false);
	        setSearchQuery('');
	        setRegionFilter('all');
	        setHomeStateFilter('all');
	        setMaxDistanceMiles(2500);
	        setStageFilter('all');
	        setArchetypeFilter('all');

	        setNeedsFitOnly(false);
	    };

	    const scholarshipTextStyle: React.CSSProperties = {
	        color: availableScholarships < 0 ? '#B22222' : 'inherit',
	        fontWeight: availableScholarships < 0 ? 'bold' : 'normal',
	        textAlign: 'right'
	    };
	
	    const teamsByName = useMemo(() => new Map(state.allTeams.map(t => [t.name, t])), [state.allTeams]);

    const metrics = useMemo(() => {
        const recruits = state.recruits;
        const userTeam = state.userTeam!;
        const gameInSeason = state.gameInSeason;
        
        const top100 = recruits.filter(r => typeof r.nationalRank === 'number' && r.nationalRank <= 100);
        const topPool = top100.length ? top100 : recruits.slice().sort((a, b) => (a.overall * 0.7 + a.potential * 0.3) - (b.overall * 0.7 + b.potential * 0.3)).slice(-100);

        const committed = (r: Recruit) => Boolean(r.verbalCommitment) || ['SoftCommit', 'HardCommit', 'Signed'].includes(r.recruitmentStage || '');
        const committedTop = topPool.filter(committed).length;

        const offersCount = (r: Recruit) => (r.cpuOffers?.length || 0) + (r.userHasOffered ? 1 : 0);
        const avgOffersTop = topPool.length ? topPool.reduce((s, r) => s + offersCount(r), 0) / topPool.length : 0;

        const shortlistSizes = topPool.map(r => {
            const offerNames = [...(r.cpuOffers || []), ...(r.userHasOffered ? [userTeam.name] : [])];
            const details = offerNames
                .map(name => {
                    const team = teamsByName.get(name);
                    if (!team) return null;
                    return { name, score: calculateRecruitInterestScore(r, team, { gameInSeason }), prestige: team.prestige ?? 50 };
                })
                .filter(Boolean) as { name: string; score: number; prestige: number }[];
            if (!details.length) return 0;
            const { shortlist } = buildRecruitOfferShortlist(details, { min: 3, max: 6, leaderWindow: 10, temperatureMultiplier: getRecruitOfferShareTemperatureMultiplier(r) });
            return shortlist.length;
        }).filter(n => n > 0);
        const avgShortlist = shortlistSizes.length ? shortlistSizes.reduce((a, b) => a + b, 0) / shortlistSizes.length : 0;

        const stageCounts = recruits.reduce((acc, r) => {
            const stage = r.recruitmentStage || (r.verbalCommitment ? 'HardCommit' : 'Open');
            acc[stage] = (acc[stage] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const reopenCount = recruits.filter(r => (r.lastRecruitingNews || '').toLowerCase().includes('reopened')).length;

        return {
            topPoolSize: topPool.length,
            committedTop,
            committedTopPct: topPool.length ? (committedTop / topPool.length) * 100 : 0,
            avgOffersTop,
            avgShortlist,
            stageCounts,
            reopenCount,
        };
    }, [state.recruits, teamsByName, state.userTeam?.name, state.gameInSeason]);
	    const topTwoByRecruitId = useMemo(() => {
	        const map = new Map<string, { leader?: string; second?: string }>();

	        state.recruits.forEach(r => {
	            // Prefer stored values from processRecruitingDay (ensures consistency with commitment logic)
	            if (r.currentLeader) {
	                map.set(r.id, { leader: r.currentLeader, second: r.currentSecond ?? undefined });
	                return;
	            }
	            
	            // Fallback: Calculate if not stored yet (early game state)
	            const offerNames = [...(r.cpuOffers || []), ...(r.userHasOffered ? [state.userTeam!.name] : [])];
	            if (offerNames.length === 0) return;
	            const details = offerNames
	                .map(teamName => {
	                    const team = teamsByName.get(teamName);
	                    if (!team) return null;
	                    return { name: teamName, score: calculateRecruitInterestScore(r, team, { gameInSeason: state.gameInSeason }), prestige: team.prestige ?? 50 };
	                })
	                .filter(Boolean) as { name: string; score: number; prestige: number }[];
	            if (!details.length) return;
	            details.sort((a, b) => b.score - a.score);
	            const { shortlist, shares } = buildRecruitOfferShortlist(details, { min: 3, max: 6, leaderWindow: 10, seedKey: `${r.id}:${state.gameInSeason}`, temperatureMultiplier: getRecruitOfferShareTemperatureMultiplier(r) });
	            const sortedByShare = [...shortlist].sort((a, b) => {
	                const shareA = shares.get(a.name) ?? 0;
	                const shareB = shares.get(b.name) ?? 0;
	                return shareB - shareA;
	            });
	            const leader = sortedByShare[0]?.name || details[0]?.name;
	            const second = sortedByShare[1]?.name || details[1]?.name;
	            map.set(r.id, { leader, second });
	        });
	        return map;
	    }, [state.recruits, state.userTeam, state.allTeams, state.gameInSeason, teamsByName]);

	    const viewingOffersFor = viewingOffersRecruitId
	        ? (state.recruits.find(r => r.id === viewingOffersRecruitId) || null)
	        : null;

    // Retro-Modern Style Definitions
    const retroContainerStyle: React.CSSProperties = {
        background: '#f8fafc',
        border: '2px solid #0f172a',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '4px 4px 0 #0f172a',
        marginBottom: '16px',
        color: '#0f172a'
    };

    const retroStatBlockStyle: React.CSSProperties = {
        background: '#ffffff',
        border: '2px solid #0f172a',
        borderRadius: '6px',
        padding: '10px 12px',
        flex: '1 1 200px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 2px 0 rgba(15,23,42,0.15)',
        color: '#0f172a'
    };
    
    const retroStatLabelStyle: React.CSSProperties = {
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        fontWeight: 800,
        color: '#64748b',
        marginBottom: '4px',
        letterSpacing: '0.05em'
    };
    
    const retroStatValueStyle: React.CSSProperties = {
        fontSize: '1.4rem',
        fontWeight: 900,
        color: '#0f172a',
        lineHeight: 1
    };

    const retroHeaderStyle: React.CSSProperties = {
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px', 
        background: colors.primary, 
        padding: '12px 16px', 
        borderRadius: '8px', 
        border: '2px solid #0f172a', 
        boxShadow: '4px 4px 0 #0f172a',
        color: colors.text
    };

    const retroButtonStyle: React.CSSProperties = {
        padding: '6px 12px',
        borderRadius: '6px',
        border: '2px solid #7f1d1d',
        background: '#ef4444',
        color: '#ffffff',
        fontSize: '0.7rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow: '2px 2px 0 #7f1d1d'
    };

	    return (
	        <div>
	            {viewingOffersFor && (
	                <OffersModal 
                    recruit={viewingOffersFor} 
                    userTeamName={state.userTeam.name}
                    allRecruits={state.recruits}
                    allTeams={state.allTeams}
                    gameInSeason={state.gameInSeason}
                    onOpenRecruitId={(recruitId) => {
                      setViewingOffersRecruitId(recruitId);
                      setViewingOffersStartOfferBuilder(false);
                    }}
                    contactPointsUsed={state.contactsMadeThisWeek}
                    contactPointsMax={getContactPoints(state.userTeam)}
                    scoutLevel={state.userTeam?.scoutingReports?.[viewingOffersFor.id] || 0}
                    actionsDisabled={!!viewingOffersFor.verbalCommitment && viewingOffersFor.verbalCommitment !== state.userTeam.name}
                    onContactRecruit={() => dispatch({ type: 'CONTACT_RECRUIT', payload: { recruitId: viewingOffersFor.id } })}
                    startOfferBuilder={viewingOffersStartOfferBuilder}
                    onOfferScholarship={(pitchType) => dispatch({ type: 'OFFER_SCHOLARSHIP', payload: { recruitId: viewingOffersFor.id, pitchType } })}
                    onPullOffer={() => dispatch({ type: 'PULL_SCHOLARSHIP', payload: { recruitId: viewingOffersFor.id } })}
                    onCoachVisit={() => dispatch({ type: 'COACH_VISIT', payload: { recruitId: viewingOffersFor.id } })}
                    onScheduleOfficialVisit={() => setSchedulingVisitFor(viewingOffersFor)}
                    onScout={() => dispatch({ type: 'SCOUT_RECRUIT', payload: { recruitId: viewingOffersFor.id, cost: 3 } })}
                    onNegativeRecruit={() => setNegativeRecruitingFor(viewingOffersFor)}
                    onClose={() => { setViewingOffersRecruitId(null); setViewingOffersStartOfferBuilder(false); }}
                    timeline={(state.timeline || []).filter(e => e.recruitId === viewingOffersFor.id)}
	                />
	            )}
	            {negativeRecruitingFor && (
	                <NegativeRecruitingModal 
                    recruit={negativeRecruitingFor} 
                    onClose={() => setNegativeRecruitingFor(null)} 
                    dispatch={dispatch}
                />
            )}
            {schedulingVisitFor && state.userTeam && (
                <ScheduleVisitModal
                    recruit={schedulingVisitFor}
                    currentWeek={state.week}
                    userTeamName={state.userTeam.name}
                    schedule={state.schedule}
                    onClose={() => setSchedulingVisitFor(null)}
                    dispatch={dispatch}
                />
            )}
            {/* --------------- RECRUITING DASHBOARD REDESIGN --------------- */}
            <div style={{
                background: '#ffffff',
                border: `3px solid ${colors.primary}`,
                borderRadius: '0',
                padding: '0',
                marginBottom: '12px',
                boxShadow: `4px 4px 0 ${colors.primary}`
            }}>
                {/* ROW 1: Command Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: colors.primary,
                    borderBottom: `3px solid ${colors.secondary}`
                }}>
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: colors.text, opacity: 0.8, fontWeight: 700 }}>Contacts</span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: colors.text }}>{state.contactsMadeThisWeek}<span style={{ fontSize: '0.8rem', opacity: 0.6 }}>/{getContactPoints(state.userTeam)}</span></span>
                        </div>
                        <div style={{ width: '2px', height: '28px', background: colors.text, opacity: 0.25 }}></div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: colors.text, opacity: 0.8, fontWeight: 700 }}>Schols</span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: availableScholarships < 0 ? '#ff6b6b' : colors.text }}>{availableScholarships}<span style={{ fontSize: '0.8rem', opacity: 0.6 }}>/{totalScholarships}</span></span>
                        </div>
                        {teamNeeds && (
                            <>
                                <div style={{ width: '2px', height: '28px', background: colors.text, opacity: 0.25 }}></div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: colors.text, opacity: 0.8, fontWeight: 700 }}>Needs</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text }}>{teamNeeds}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ROW 2: Stats + Stage Chips */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '10px 16px',
                    background: '#f8fafc',
                    borderBottom: `2px solid ${colors.primary}`,
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: colors.primary, padding: '6px 12px', borderRadius: '4px', border: `2px solid ${colors.secondary}` }}>
                        <span style={{ fontSize: '0.6rem', color: colors.text, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Top-{metrics.topPoolSize}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: colors.text }}>{metrics.committedTop} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({metrics.committedTopPct.toFixed(0)}%)</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: colors.primary, padding: '6px 12px', borderRadius: '4px', border: `2px solid ${colors.secondary}` }}>
                        <span style={{ fontSize: '0.6rem', color: colors.text, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Offers</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: colors.text }}>{metrics.avgOffersTop.toFixed(1)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: colors.primary, padding: '6px 12px', borderRadius: '4px', border: `2px solid ${colors.secondary}` }}>
                        <span style={{ fontSize: '0.6rem', color: colors.text, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Shortlist</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: colors.text }}>{metrics.avgShortlist.toFixed(1)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: colors.primary, padding: '6px 12px', borderRadius: '4px', border: `2px solid ${colors.secondary}` }}>
                        <span style={{ fontSize: '0.6rem', color: colors.text, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Reopens</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: colors.text }}>{metrics.reopenCount}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}></div>
                    {Object.entries(metrics.stageCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '12px', border: `1px solid ${colors.primary}` }}>
                            <span style={{ fontSize: '0.55rem', color: '#475569', fontWeight: 600 }}>{k}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f172a' }}>{v}</span>
                        </div>
                    ))}
                </div>

                {/* ROW 3: Filters */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '10px 16px',
                    background: '#f1f5f9',
                    alignItems: 'center'
                }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        style={{ flex: '1 1 100px', height: '28px', padding: '0 10px', fontSize: '0.7rem', border: `2px solid ${colors.primary}`, background: '#ffffff', color: '#0f172a', borderRadius: '4px', outline: 'none' }}
                    />
                    <select value={positionFilter} onChange={e => setPositionFilter(e.target.value as 'all' | RosterPositions)} style={{ flex: '0 1 70px', height: '28px', fontSize: '0.65rem', border: `2px solid ${colors.primary}`, background: '#ffffff', color: '#0f172a', borderRadius: '4px' }}>
                        {positionOptions.map(option => <option key={option} value={option}>{option === 'all' ? 'Pos' : option}</option>)}
                    </select>
                    <select value={starFilter} onChange={e => setStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as any)} style={{ flex: '0 1 70px', height: '28px', fontSize: '0.65rem', border: `2px solid ${colors.primary}`, background: '#ffffff', color: '#0f172a', borderRadius: '4px' }}>
                        {starOptions.map(option => <option key={option} value={option}>{option === 'all' ? '?' : `${option}?`}</option>)}
                    </select>
                    <select value={archetypeFilter} onChange={e => setArchetypeFilter(e.target.value)} style={{ flex: '0 1 100px', height: '28px', fontSize: '0.65rem', border: `2px solid ${colors.primary}`, background: '#ffffff', color: '#0f172a', borderRadius: '4px' }}>
                        {availableArchetypes.map(a => <option key={a} value={a}>{a === 'all' ? 'Archetypes' : a}</option>)}
                    </select>
                    <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ flex: '0 1 90px', height: '28px', fontSize: '0.65rem', border: `2px solid ${colors.primary}`, background: '#ffffff', color: '#0f172a', borderRadius: '4px' }}>
                        <option value="all">Stages</option>
                        <option value="Open">Open</option>
                        <option value="Narrowing">Narrowing</option>
                        <option value="SoftCommit">Soft</option>
                        <option value="HardCommit">Hard</option>
                        <option value="Signed">Signed</option>
                    </select>
                    <select value={regionFilter} onChange={e => setRegionFilter(e.target.value as any)} style={{ flex: '0 1 80px', height: '28px', fontSize: '0.65rem', border: `2px solid ${colors.primary}`, background: '#ffffff', color: '#0f172a', borderRadius: '4px' }}>
                        <option value="all">Regions</option>
                        <option value="Northeast">NE</option>
                        <option value="Midwest">MW</option>
                        <option value="South">S</option>
                        <option value="West">W</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', background: '#ffffff', border: `2px solid ${colors.primary}`, borderRadius: '4px', height: '28px', flex: '1 1 150px' }}>
                        <span style={{ fontSize: '0.55rem', color: '#475569' }}>Dist:</span>
                        <input type="range" min={0} max={2500} step={100} value={maxDistanceMiles} onChange={e => setMaxDistanceMiles(parseInt(e.target.value))} style={{ flex: 1, accentColor: colors.primary }} />
                        <span style={{ fontSize: '0.6rem', color: '#0f172a', minWidth: '35px' }}>{maxDistanceMiles < 2500 ? `${maxDistanceMiles}mi` : 'Any'}</span>
                    </div>
                    {/* Checkbox toggles */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: 'auto' }}>
                        {[
                            { key: 'committed', label: '?? Com', checked: hideVerballyCommitted, setter: setHideVerballyCommitted },
                            { key: 'signed', label: '?? Sig', checked: hideSigned, setter: setHideSigned },
                            { key: 'mycommits', label: '? Mine', checked: showUserCommitsOnly, setter: setShowUserCommitsOnly },
                            { key: 'targets', label: '??', checked: targetsOnly, setter: setTargetsOnly },
                            { key: 'needs', label: '?? Fit', checked: needsFitOnly, setter: setNeedsFitOnly },
                        ].map(toggle => (
                            <button
                                key={toggle.key}
                                onClick={() => toggle.setter(!toggle.checked)}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    border: `2px solid ${toggle.checked ? colors.primary : '#cbd5e1'}`,
                                    background: toggle.checked ? colors.primary : '#ffffff',
                                    color: toggle.checked ? colors.text : '#475569',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {toggle.label}
                            </button>
                        ))}
                        <button
                            style={{
                                padding: '4px 10px',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                border: '2px solid #7f1d1d',
                                background: filtersActive ? '#ef4444' : '#3f3f46',
                                color: '#ffffff',
                                borderRadius: '4px',
                                cursor: filtersActive ? 'pointer' : 'not-allowed',
                                opacity: filtersActive ? 1 : 0.5,
                                boxShadow: filtersActive ? '2px 2px 0 #7f1d1d' : 'none'
                            }}
                            onClick={resetRecruitFilters}
                            disabled={!filtersActive}
                        >
                            RESET
                        </button>
                    </div>
                </div>
            </div>
            <div style={styles.tableContainer}>
            <table style={{...styles.table, fontSize: '0.6rem'}}>
	                <thead style={styles.recruitingThead}>
	                    <tr>
	                        <th style={{...styles.th, width: '4%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('rank')}>Rank {renderSortArrow('rank')}</th>
	                        <th style={{...styles.th, width: '16%', backgroundColor: colors.primary, color: colors.text}}>Name</th>
	                        <th style={{...styles.th, width: '5%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('stars')}>Stars</th>
	                        <th style={{...styles.th, width: '5%', backgroundColor: colors.primary, color: colors.text}}>Pos</th>
	                        <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Archetype</th>
	                        <th style={{...styles.th, width: '4%', backgroundColor: colors.primary, color: colors.text}}>Ht</th>
	                        <th style={{...styles.th, width: '4%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('overall')}>OVR {renderSortArrow('overall')}</th>
	                        <th style={{...styles.th, width: '4%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('potential')}>Pot {renderSortArrow('potential')}</th>
	                        <th style={{...styles.th, width: '5%', backgroundColor: colors.primary, color: colors.text, cursor: 'pointer'}} onClick={() => requestSort('interest')}>Int {renderSortArrow('interest')}</th>
	                        <th style={{...styles.th, width: '8%', backgroundColor: colors.primary, color: colors.text}}>Stage</th>
	                        <th style={{...styles.th, width: '12%', backgroundColor: colors.primary, color: colors.text}}>Top 2</th>
	                        <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Status</th>
	                        <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Top Motivations</th>
	                        <th style={{...styles.th, width: '10%', backgroundColor: colors.primary, color: colors.text}}>Actions</th>
	                        <th style={{...styles.th, width: '5%', backgroundColor: colors.primary, color: colors.text}}>Target</th>
	                    </tr>
	                </thead>
                <tbody>
                    {filteredRecruits.map(r => {
                        const totalOffers = r.cpuOffers.length + (r.userHasOffered ? 1 : 0);
                        const userHasOffered = r.userHasOffered;
                        const rank = recruitRanks.get(r.id);
                        const hasUserDeclined = r.declinedOffers.includes(state.userTeam!.name);
                        const isCommittedToUser = r.verbalCommitment === state.userTeam!.name;
                        const isCommittedToOther = !!r.verbalCommitment && !isCommittedToUser;
                        const isCommittedAndLocked = !!isSigningPeriod && !!r.verbalCommitment;
                        const committedTeamRank = r.verbalCommitment ? powerRankings.get(r.verbalCommitment) : undefined;

                        const rowStyle: React.CSSProperties = {};
                        if (isCommittedToUser) {
                            rowStyle.backgroundColor = '#90EE90'; // Light Green for user commits
                        } else if (hasUserDeclined) {
                            rowStyle.backgroundColor = '#FFD2D2'; // Light Red for declines
                        } else if (isSigningPeriod && isCommittedToOther) {
                            rowStyle.backgroundColor = '#FFDAB9'; // Orange for signed with CPU
                        } else if (isCommittedToOther) {
                            rowStyle.backgroundColor = '#ADD8E6'; // Blue for verbal with CPU
                        } else if (userHasOffered) {
                            rowStyle.backgroundColor = '#FFFFAA'; // Yellow for offers
                        }

                        const displayInterest = normalizeInterest(r.interest);
                        const interestTier = getInterestTier(displayInterest);

                        return (
                            <tr key={r.id} style={rowStyle}>
                                <td style={styles.td}>{rank ? `#${rank}` : 'UR'}</td>
                                <td style={styles.td}>
                                    <button onClick={() => { setViewingOffersRecruitId(r.id); setViewingOffersStartOfferBuilder(false); }} style={{ ...styles.linkButton, fontWeight: 'bold' }}>
                                        {r.name}
                                    </button>
                                    {/* Package Deal Icon */}
                                    {r.packageDealPartner && (
                                        <span 
                                            title={`Package deal with teammate`} 
                                            style={{ marginLeft: '4px', cursor: 'help' }}
                                        >
                                            ??
                                        </span>
                                    )}
                                    {/* Hot/Cold Momentum Badges */}
                                    {r.teamMomentum?.[state.userTeam!.name] != null && r.teamMomentum[state.userTeam!.name] > 10 && (
                                        <span 
                                            title={`Hot! Momentum: +${r.teamMomentum[state.userTeam!.name]}`} 
                                            style={{ marginLeft: '4px', color: '#ef4444', fontWeight: 'bold' }}
                                        >
                                            ??
                                        </span>
                                    )}
                                    {r.teamMomentum?.[state.userTeam!.name] != null && r.teamMomentum[state.userTeam!.name] < -5 && (
                                        <span 
                                            title={`Cold! Momentum: ${r.teamMomentum[state.userTeam!.name]}`} 
                                            style={{ marginLeft: '4px', color: '#3b82f6' }}
                                        >
                                            ??
                                        </span>
                                    )}
                                    {(r.hometownCity || r.hometownState || r.highSchoolName) && (
                                        <div
                                            style={{ fontSize: '0.55rem', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            title={[r.hometownCity, r.hometownState].filter(Boolean).join(', ') + (r.highSchoolName ? ` - ${r.highSchoolName}` : '')}
                                        >
                                            {[r.hometownCity, r.hometownState].filter(Boolean).join(', ')}
                                            {r.highSchoolName ? ` - ${r.highSchoolName}` : ''}
                                        </div>
                                    )}
                                    {(state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 && r.isGem && <span title="Gem" style={{marginLeft: '5px'}}>??</span>}
                                    {(state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 && r.isBust && <span title="Bust" style={{marginLeft: '5px'}}>??</span>}
	        </td>
	                                <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <StarRating stars={r.stars}/>
                                            {r.relationships?.map(rel => {
                                                const label = `${rel.type}: ${rel.displayName}${rel.teamName ? ` (${rel.teamName})` : ''}`;
                                                if (rel.type === 'Twin') return <img key={rel.personId} src={GeminiIcon} title={label} style={{ cursor: 'help', width: '18px', height: '18px' }} />;
                                                if (rel.type === 'Sibling' || rel.type === 'Cousin') return <img key={rel.personId} src={TreeIcon} title={label} style={{ cursor: 'help', width: '18px', height: '18px' }} />;
                                                return null;
                                            })}
                                        </div>
                                    </td>
                                <td style={styles.td}>{r.position}{r.secondaryPosition ? `/${r.secondaryPosition}` : ''}</td>
                                <td style={{...styles.td, maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={r.archetype}>{r.archetype || 'N/A'}</td>
                                <td style={styles.td}>{formatPlayerHeight(r.height)}</td>
                                <td style={styles.td}>{r.overall}</td>
                                <td style={styles.td}>{formatPotentialValue(r.potential)}</td>
                                <td style={styles.td}>
                                    <div style={styles.interestCell}>
                                        <div style={styles.interestBarTrack}>
                                            <div style={{ ...styles.interestBarFill, width: `${displayInterest}%`, backgroundColor: interestTier.color }} />
                                        </div>
                                        <div style={styles.interestBadge}>
                                            <span>{displayInterest}%</span>
                                            <span>{interestTier.label}</span>
	                                        </div>
	                                    </div>
	                                </td>
	                                <td style={styles.td}>{r.recruitmentStage || (r.verbalCommitment ? 'HardCommit' : 'Open')}</td>
	                                <td style={styles.td}>
	                                        {(() => {
	                                            const top2 = topTwoByRecruitId.get(r.id);
	                                            if (!top2?.leader) return '�';
	                                            return (
	                                                <span title={top2.second ? `${top2.leader} / ${top2.second}` : top2.leader}>
	                                                    <strong>{top2.leader}</strong>
	                                                    {top2.second ? ` / ${top2.second}` : ''}
	                                                </span>
	                                            );
	                                        })()}
	                                    </td>
	                                <td style={{...styles.td, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }}>
	                                    {r.verbalCommitment ? (
	                                        <CommitmentStatus teamName={r.verbalCommitment} teamRank={committedTeamRank} isSigningPeriod={!!isSigningPeriod} isSoftCommit={!isSigningPeriod ? r.softCommitment : undefined} />
	                                    ) : hasUserDeclined ? (
	                                        <span style={{color: 'red'}}>Offer Declined</span>
	                                    ) : totalOffers > 0 ? (
	                                        <button onClick={() => { setViewingOffersRecruitId(r.id); setViewingOffersStartOfferBuilder(false); }} style={styles.linkButton}>{totalOffers} Offers</button>
                                    ) : 'Undecided'}
                                </td>
                                <td style={styles.td}>
                                    <MotivationDisplay motivations={r.motivations} />
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGrid}>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                                            <button
                                                style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '6px',
                                                  border: '2px solid #0f172a',
                                                  background: userHasOffered ? '#ffffff' : '#fde047',
                                                  color: '#0f172a',
                                                  boxShadow: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 1 > getContactPoints(state.userTeam)) ? 'none' : '2px 2px 0 #0f172a',
                                                  fontWeight: 900,
                                                  fontSize: '10px',
                                                  cursor: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 1 > getContactPoints(state.userTeam)) ? 'not-allowed' : 'pointer',
                                                  opacity: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 1 > getContactPoints(state.userTeam)) ? 0.55 : 1,
                                                  whiteSpace: 'nowrap',
                                                }}
                                                onClick={() => dispatch({ type: 'CONTACT_RECRUIT', payload: { recruitId: r.id } })}
                                                disabled={isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 1 > getContactPoints(state.userTeam)}
                                                title={userHasOffered ? 'Maintain (1)' : 'Contact (1)'}
                                            >
                                                {userHasOffered ? 'Maintain' : 'Contact'}
                                            </button>

                                            {userHasOffered ? (
                                                <button
                                                    style={{
                                                      padding: '4px 8px',
                                                      borderRadius: '6px',
                                                      border: '2px solid #0f172a',
                                                      background: '#fca5a5',
                                                      color: '#0f172a',
                                                      boxShadow: isCommittedAndLocked ? 'none' : '2px 2px 0 #0f172a',
                                                      fontWeight: 900,
                                                      fontSize: '10px',
                                                      cursor: isCommittedAndLocked ? 'not-allowed' : 'pointer',
                                                      opacity: isCommittedAndLocked ? 0.55 : 1,
                                                      whiteSpace: 'nowrap',
                                                    }}
                                                    onClick={() => dispatch({type: 'PULL_SCHOLARSHIP', payload: {recruitId: r.id}})}
                                                    disabled={isCommittedAndLocked}
                                                >
                                                    Pull
                                                </button>
                                            ) : (
                                                <button
                                                    style={{
                                                      padding: '4px 8px',
                                                      borderRadius: '6px',
                                                      border: '2px solid #0f172a',
                                                      background: '#fde047',
                                                      color: '#0f172a',
                                                      boxShadow: (isCommittedAndLocked || hasUserDeclined || isCommittedToOther || state.contactsMadeThisWeek + 9 > getContactPoints(state.userTeam)) ? 'none' : '2px 2px 0 #0f172a',
                                                      fontWeight: 900,
                                                      fontSize: '10px',
                                                      cursor: (isCommittedAndLocked || hasUserDeclined || isCommittedToOther || state.contactsMadeThisWeek + 9 > getContactPoints(state.userTeam)) ? 'not-allowed' : 'pointer',
                                                      opacity: (isCommittedAndLocked || hasUserDeclined || isCommittedToOther || state.contactsMadeThisWeek + 9 > getContactPoints(state.userTeam)) ? 0.55 : 1,
                                                      whiteSpace: 'nowrap',
                                                    }}
                                                    onClick={() => { setViewingOffersRecruitId(r.id); setViewingOffersStartOfferBuilder(true); }}
                                                    disabled={isCommittedAndLocked || hasUserDeclined || isCommittedToOther || state.contactsMadeThisWeek + 9 > getContactPoints(state.userTeam)}
                                                >
                                                    Offer
                                                </button>
                                            )}

                                            <button
                                                style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '6px',
                                                  border: '2px solid #0f172a',
                                                  background: '#ffffff',
                                                  color: '#0f172a',
                                                  boxShadow: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 5 > getContactPoints(state.userTeam)) ? 'none' : '2px 2px 0 #0f172a',
                                                  fontWeight: 900,
                                                  fontSize: '10px',
                                                  cursor: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 5 > getContactPoints(state.userTeam)) ? 'not-allowed' : 'pointer',
                                                  opacity: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 5 > getContactPoints(state.userTeam)) ? 0.55 : 1,
                                                  whiteSpace: 'nowrap',
                                                }}
                                                onClick={() => dispatch({ type: 'COACH_VISIT', payload: { recruitId: r.id } })}
                                                disabled={isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 5 > getContactPoints(state.userTeam)}
                                            >
                                                Visit
                                            </button>

                                            <button
                                                style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '6px',
                                                  border: '2px solid #0f172a',
                                                  background: '#ffffff',
                                                  color: '#0f172a',
                                                  boxShadow: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 8 > getContactPoints(state.userTeam)) ? 'none' : '2px 2px 0 #0f172a',
                                                  fontWeight: 900,
                                                  fontSize: '10px',
                                                  cursor: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 8 > getContactPoints(state.userTeam)) ? 'not-allowed' : 'pointer',
                                                  opacity: (isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 8 > getContactPoints(state.userTeam)) ? 0.55 : 1,
                                                  whiteSpace: 'nowrap',
                                                }}
                                                onClick={() => setSchedulingVisitFor(r)}
                                                disabled={isCommittedAndLocked || hasUserDeclined || state.contactsMadeThisWeek + 8 > getContactPoints(state.userTeam)}
                                            >
                                                Official
                                            </button>

                                            <button
                                                style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '6px',
                                                  border: '2px solid #0f172a',
                                                  background: '#ffffff',
                                                  color: '#0f172a',
                                                  boxShadow: (isCommittedAndLocked || (state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 || state.contactsMadeThisWeek + 3 > getContactPoints(state.userTeam)) ? 'none' : '2px 2px 0 #0f172a',
                                                  fontWeight: 900,
                                                  fontSize: '10px',
                                                  cursor: (isCommittedAndLocked || (state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 || state.contactsMadeThisWeek + 3 > getContactPoints(state.userTeam)) ? 'not-allowed' : 'pointer',
                                                  opacity: (isCommittedAndLocked || (state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 || state.contactsMadeThisWeek + 3 > getContactPoints(state.userTeam)) ? 0.55 : 1,
                                                  whiteSpace: 'nowrap',
                                                }}
                                                onClick={() => dispatch({ type: 'SCOUT_RECRUIT', payload: { recruitId: r.id, cost: 3 } })}
                                                disabled={isCommittedAndLocked || (state.userTeam?.scoutingReports?.[r.id] || 0) >= 3 || state.contactsMadeThisWeek + 3 > getContactPoints(state.userTeam)}
                                            >
                                                Scout
                                            </button>

                                            <button
                                                style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '6px',
                                                  border: '2px solid #0f172a',
                                                  background: '#ffffff',
                                                  color: '#0f172a',
                                                  boxShadow: (contactPointsRemaining <= 0) ? 'none' : '2px 2px 0 #0f172a',
                                                  fontWeight: 900,
                                                  fontSize: '10px',
                                                  cursor: (contactPointsRemaining <= 0) ? 'not-allowed' : 'pointer',
                                                  opacity: (contactPointsRemaining <= 0) ? 0.55 : 1,
                                                  whiteSpace: 'nowrap',
                                                }}
                                                onClick={() => setNegativeRecruitingFor(r)}
                                                disabled={contactPointsRemaining <= 0}
                                            >
                                                Neg
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <button
                                        style={{
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          border: '2px solid #0f172a',
                                          background: r.isTargeted ? '#86efac' : '#ffffff',
                                          color: '#0f172a',
                                          boxShadow: '2px 2px 0 #0f172a',
                                          fontWeight: 900,
                                          fontSize: '10px',
                                          cursor: 'pointer',
                                          whiteSpace: 'nowrap',
                                        }}
                                        onClick={() => dispatch({ type: 'TOGGLE_RECRUIT_TARGET', payload: { recruitId: r.id } })}
                                    >
                                        {r.isTargeted ? 'Targeted' : 'Target'}
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            </div>
        </div>
    );
}

const NegativeRecruitingModal = ({ recruit, onClose, dispatch }: { recruit: Recruit, onClose: () => void, dispatch: React.Dispatch<GameAction> }) => {
    const [targetSchool, setTargetSchool] = useState<string>('');
    const [method, setMethod] = useState<'Rumors' | 'Violations' | 'Academics'>('Rumors');

    const handleSubmit = () => {
        if (!targetSchool) {
            // Or show some error to the user
            return;
        }
        dispatch({
            type: 'NEGATIVE_RECRUIT',
            payload: {
                recruitId: recruit.id,
                targetSchool,
                method,
            },
        });
        onClose();
    };

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <h2>Negative Recruit: {recruit.name}</h2>
                <p>Choose a rival school to target and a method of negative recruiting. This will cost 1 contact point.</p>
                
                <div style={{ margin: '20px 0' }}>
                    <label>
                        Target School:
                        <select value={targetSchool} onChange={(e) => setTargetSchool(e.target.value)}>
                            <option value="">Select a school</option>
                            {recruit.cpuOffers.map(offer => (
                                <option key={offer} value={offer}>{offer}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div style={{ margin: '20px 0' }}>
                    <p>Method:</p>
                    <label>
                        <input type="radio" value="Rumors" checked={method === 'Rumors'} onChange={() => setMethod('Rumors')} />
                        Spread Rumors (Low risk, low reward)
                    </label>
                    <label>
                        <input type="radio" value="Violations" checked={method === 'Violations'} onChange={() => setMethod('Violations')} />
                        Report Violations (High risk, high reward)
                    </label>
                    <label>
                        <input type="radio" value="Academics" checked={method === 'Academics'} onChange={() => setMethod('Academics')} />
                        Question Academics (Medium risk, medium reward)
                    </label>
                </div>

                <button onClick={handleSubmit} disabled={!targetSchool}>Submit</button>
                <button onClick={onClose} style={{ marginLeft: '10px' }}>Cancel</button>
            </div>
        </div>
    );
};

const OfferScholarshipModal = ({ recruit, onClose, dispatch }: { recruit: Recruit; onClose: () => void; dispatch: React.Dispatch<GameAction> }) => {
    const [pitchType, setPitchType] = useState<OfferPitchType>('Standard');

    const options: { value: OfferPitchType; label: string; desc: string }[] = [
        { value: 'Standard', label: 'Standard', desc: 'Balanced pitch.' },
        { value: 'EarlyPush', label: 'Early Push', desc: 'Press urgency and momentum early.' },
        { value: 'NILHeavy', label: 'NIL Heavy', desc: 'Lead with NIL opportunities.' },
        { value: 'PlayingTimePromise', label: 'Playing Time Promise', desc: 'Emphasize role clarity and minutes.' },
        { value: 'LocalAngle', label: 'Local Angle', desc: 'Family/proximity/hometown focus.' },
        { value: 'AcademicPitch', label: 'Academic Pitch', desc: 'Sell academics and support systems.' },
    ];

    const handleSubmit = () => {
        dispatch({ type: 'OFFER_SCHOLARSHIP', payload: { recruitId: recruit.id, pitchType } });
        onClose();
    };

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <h2>Offer Scholarship: {recruit.name}</h2>
                <p style={{ fontSize: '0.75rem', color: '#555' }}>Choose a pitch type. This can change how the recruit evaluates your offer.</p>

                <div style={{ margin: '15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map(opt => (
                        <label key={opt.value} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <input
                                type="radio"
                                value={opt.value}
                                checked={pitchType === opt.value}
                                onChange={() => setPitchType(opt.value)}
                            />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{opt.label}</div>
                                <div style={{ fontSize: '0.7rem', color: '#666' }}>{opt.desc}</div>
                            </div>
                        </label>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button style={styles.smallButton} onClick={onClose}>Cancel</button>
                    <button style={{ ...styles.smallButton, backgroundColor: '#4CAF50', color: '#fff' }} onClick={handleSubmit}>Make Offer</button>
                </div>
            </div>
        </div>
    );
};



const ScheduleVisitModal = ({ recruit, currentWeek, userTeamName, schedule, onClose, dispatch }: {
    recruit: Recruit;
    currentWeek: number;
    userTeamName: string;
    schedule: GameResult[][];
    onClose: () => void;
    dispatch: React.Dispatch<GameAction>;
}) => {
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

    const availableWeeks = useMemo(() => {
        const weeks: { week: number; opponent: string; isRivalry: boolean }[] = [];
        for (let i = currentWeek; i < schedule.length; i++) {
            const weekSchedule = schedule[i];
            const homeGame = weekSchedule.find(game => game.homeTeam === userTeamName);
            if (homeGame) {
                const opponent = homeGame.awayTeam;
                // TODO: Implement rivalry logic based on team data or constants
                const isRivalry = false; 
                weeks.push({ week: i + 1, opponent, isRivalry });
            }
        }
        return weeks;
    }, [currentWeek, schedule, userTeamName]);

    const handleSchedule = () => {
        if (selectedWeek) {
            dispatch({ type: 'SCHEDULE_VISIT', payload: { recruitId: recruit.id, week: selectedWeek } });
            onClose();
        }
    };

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <h2>Schedule Official Visit for {recruit.name}</h2>
                <p>Select a week for {recruit.name}'s official visit. Visiting during a big home game can significantly boost interest!</p>

                <div style={{ margin: '20px 0' }}>
                    <label>
                        Visit Week:
                        <select value={selectedWeek || ''} onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}>
                            <option value="">Select a week</option>
                            {availableWeeks.map(weekInfo => (
                                <option key={weekInfo.week} value={weekInfo.week}>
                                    Week {weekInfo.week}: vs {weekInfo.opponent} {weekInfo.isRivalry && '(Rivalry)'}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <button onClick={handleSchedule} disabled={!selectedWeek}>Schedule Visit</button>
                <button onClick={onClose} style={{ marginLeft: '10px' }}>Cancel</button>
            </div>
        </div>
    );
};

const Recruiting = (props: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => <RecruitingViewInner {...props} isSigningPeriod={false} />;


export { StarRating, CommitmentStatus, MotivationDisplay };
export default RecruitingViewInner;
