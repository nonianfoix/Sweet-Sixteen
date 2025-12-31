
import React, { useReducer, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { EconomyHub } from './EconomyHub';
import { RosterRetentionView } from './RosterRetentionView';
import { TransferPortalView } from './TransferPortalView';
import { NbaDraftLotteryView } from './NbaDraftLotteryView';

import { CoachSkillTree } from './CoachSkillTree';
import StaffView from './components/StaffView';
import SponsorModal from './components/SponsorModal';
import ContractOfferModal from './components/ContractOfferModal';

import type {
  GameState,
  GameDate,
  GameAction,
  RotationPreference,
  Team,
  Player,
  Recruit,
  GameResult,
  RosterPositions,
  TournamentMatchup,
  UserSeasonRecord,
  ChampionRecord,
  TrainingFocuses,
  Sponsor,
  Tournament,
  TournamentRegionName,
  GameBoxScore,
  DraftPick,
  SponsorRevenue,
  TeamHistory,
  SponsorOffer,
  SponsorData,
  Prices,
  Finances,
  GameAttendanceRecord,
  SeatMix,
  SeatSegmentKey,
  ScheduledEvent,
  EconomyEventFeedItem,
  SponsorQuest,
  SponsorQuestStatus,
  ContractGoal,
  TimelineEvent,
  Coach,
  CoachContract,
  CoachSeasonRecord,
  Staff,
  PendingStaffRenewal,
  TeamColors,
  InternationalProspect,
  DraftProspect,
  DraftProspectSource,
  NBASimulationResult,
  NBADraftHistoryEntry,
  TrainingFocus,
  TrainingIntensity,
  Transfer,
  Pipeline,
  HeadCoachProfile,
  JobOffer,

  StaffRole,
  NilNegotiationCandidate,
  PlayByPlayEvent,
  NBATeamSimulation,
  NBAFreeAgent,
  NBATransaction,
  NBAPlayoffs,
  GameAdjustment,
  Loan,
	  MarketingCampaign,
	  NilNegotiationStatus,
	  OfferPitchType,
	  SponsorTier,
	  PlayerDevelopmentDNA,
	  PlayerPlayStyleIdentity,
	  RecruitDecisionStyle,
  RecruitCommitmentStyle
	} from './types';
import { GameStatus, ScheduledEventStatus, EventType, GameEvent } from './types';
import SeasonRecapModalV3 from './components/SeasonRecapModalV3';
import JobMarketModal from './components/JobMarketModal';
import * as constants from './constants';
import type { SponsorName } from './types';
// FIX: Added missing function imports from gameService. This resolves multiple "has no exported member" errors.
 import { initializeGameWorld, simulateGame, processInSeasonDevelopment, processRecruitingWeek, runSimulationForDate, runDailySimulation, advanceToNewSeason, rollOverTeamsForNextSeason, createTournament, generateSchedule, createRecruit, processTraining, autoSetStarters, generateSigningAndProgressionSummaries, processDraft, fillRosterWithWalkOns, calculateRecruitInterestScore, calculateRecruitInterestBreakdown, getRecruitWhyBadges, estimateRecruitDistanceMilesToTeam, getRecruitRegionForState, buildRecruitOfferShortlist, getRecruitOfferShareTemperatureMultiplier, calculateSponsorRevenueSnapshot, createSponsorFromName, recalculateSponsorLandscape,  calculateTeamRevenue, calculateCurrentSeasonEarnedRevenue, runInitialRecruitingOffers, calculateTeamNeeds, processEndOfSeasonPrestigeUpdates, randomBetween, generateContractOptions, generateJobOffers, updateCoachReputation, calculateCoachSalary, generateStaffCandidates, calculateOverall, generateFreeAgentStaff, getTrainingPoints, getContactPoints, calculateFanWillingness, seedProgramWealth, getWealthRecruitingBonus, getWealthTrainingBonus, generateInternationalProspects, simulateNBASeason, buildDraftProspectBoard, calculateNBACoachSalary, generateNBAJobOffers, createHeadCoachProfile, ensureArenaFacility, createNilCollectiveProfile, buildEventPlaybookCatalog, buildSponsorQuestDeck, calculateAttendance, clampZonePriceModifier, processTransferPortalOpen, processTransferPortalDay, clamp, processWeeklyFinances, processFacilityConstruction, degradeFacilities, generateSponsorOffers, hireStaff, updateSponsorContracts, updateConcessionPricing, updateMerchPricing, updateTicketPricing, setMerchInventoryStrategy, toggleDynamicPricing, setTravelSettings, scheduleEvent, cancelEvent, calculateBoardPressure, updateStaffPayroll, startCapitalProject, contributeToProject, initializeEconomy, requestFunds, generateBoardExpectations, toContractBoardExpectations, generatePoachingOffers, finalizeNBASeason, formatCurrency, updateTeamWithUserCoach, generateInitialNBAFreeAgents, processNBAWeeklyMoves, applyNBAFreeAgentRetirementRules, buildInitialDraftPickAssets, calculateRetentionProbability, seasonToCalendarYear, generateNBASchedule, buildSeasonAnchors, generateSeasonSchedule, validateSeasonSchedule, generateRecruitRelationships, recomputeRecruitBoardRanks, applyPackageDealOfferMirroring, ensureFullTeamData, calculateCoachPerformanceIndex } from './services/gameService';
import { computeDraftPickOwnership, DraftSlotAssignment } from './services/draftUtils';
import { ensurePlayerNilProfile, buildNilNegotiationCandidates, evaluateNilOffer, calculateTeamNilBudget } from './services/nilService';
import { generateAlumni, updateAlumniRegistry } from './services/alumniService';
import { collectExpiredStaffRenewals } from './services/staffService';
import { NBA_SALARIES } from './data/nbaSalaries';
import { NBA_DRAFT_PICK_RULES } from './data/nbaDraftPickSwaps';
import { getGameDateString, getGameDateStringFromEventQueue } from './services/calendarService';
import { getSchoolLogoUrl, bestTextColor } from './services/utils';
import { SEASON_START_DATE, isSameISO, addDaysISO, jsDateToISODateUTC, formatISODate, gameDateToISODateUTC } from './services/dateService';

const { SCHOOLS, SCHOOL_PRESTIGE_RANGES, SCHOOL_ENDOWMENT_OVERRIDES, SCHOOL_SPONSORS, INITIAL_SPONSORS, SPONSOR_SLOGANS, ARENA_CAPACITIES, FIRST_NAMES, FEMALE_FIRST_NAMES, LAST_NAMES, NBA_TEAMS, INTERNATIONAL_PROGRAMS, SPONSORS, ACTIVE_NBA_PLAYERS_DATA, US_STATES, SCHOOL_STATES, COACH_SKILL_TREE, RECRUITING_COSTS, SCHOOL_COLORS, SCHOOL_CONFERENCES, ALL_TIME_NBA_ALUMNI_COUNTS, NBA_ACRONYM_TO_NAME, BASE_CALENDAR_YEAR } = constants;

import { gameReducer, initialState, CURRENT_SAVE_VERSION, ROTATION_PREFERENCE_OPTIONS, TRAINING_STAT_LABELS, PRICE_PRESETS, INTEREST_TIERS, getInterestTier, FINANCIAL_INVESTMENTS, staffRoleLabels, formatPlayerHeight, calculateAvailableScholarships, getPositionDepthSummary, normalizeStaffContract, normalizeTeamStaffContracts, normalizePlayerSeasonStats, normalizeTeamData, ageStaffContractsForTeam, getTeamLogoUrl, getTeamAbbreviation } from './services/gameReducer';
import History from './views/HistoryView';
import RecruitingViewInner, { StarRating, CommitmentStatus, MotivationDisplay } from './views/RecruitingView';
import SigningPeriodView from './views/SigningPeriodView';
import RosterFillingView from './views/RosterFillingView';
import Standings from './views/StandingsView';
import InSeasonTrainingView from './views/InSeasonTrainingView';
import ConferenceHubModal from './components/modals/ConferenceHubModal';
import Dashboard from './views/DashboardView';
import RosterView from './views/RosterView';
import TournamentView from './views/TournamentView';
import NilNegotiationView from './views/NilNegotiationView';
import StaffRecruitmentModal from './components/modals/StaffRecruitmentModal';
import SettingsModal from './components/modals/SettingsModal';
import Subheading from './components/Subheading';
import Header from './components/Header';
import NavAndActions from './components/NavAndActions';
import Toast from './components/Toast';
import { styles } from './styles';
import TeamSelection from './components/TeamSelection';
import Schedule from './components/Schedule';
import GameLogView from './views/GameLogView';
import { getConferenceLogoUrl } from './services/logoUtils';
import { formatPotentialValue } from './services/gameUtils';

// --- Components ---

const Recruiting = (props: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => <RecruitingViewInner {...props} isSigningPeriod={false} />;

const Training = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    const [focuses, setFocuses] = useState<{[key: string]: keyof Player['stats'] | ''}>({ pg: '', sg_sf: '', pf_c: '' });

    const handleSelect = (group: string, value: keyof Player['stats']) => {
        setFocuses(prev => ({...prev, [group]: value}));
    };

    const isReady = focuses.pg && focuses.sg_sf && focuses.pf_c;

    const statOptions: (keyof Player['stats'])[] = ['insideScoring', 'outsideScoring', 'playmaking', 'perimeterDefense', 'insideDefense', 'rebounding', 'stamina'];

    const renderFocusSelector = (group: 'pg' | 'sg_sf' | 'pf_c', title: string) => (
        <div style={{marginBottom: '15px'}}>
            <h5 style={{color: colors.primary, marginBottom: '5px'}}>{title}</h5>
            <select value={focuses[group]} onChange={(e) => handleSelect(group, e.target.value as keyof Player['stats'])} style={styles.select}>
                 <option value="" disabled>Select focus...</option>
                 {statOptions.map(opt => (
                     <option key={opt} value={opt}>{opt.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</option>
                 ))}
            </select>
        </div>
    );

    const handleRandomizeFocus = () => {
        setFocuses({
            pg: statOptions[Math.floor(Math.random() * statOptions.length)],
            sg_sf: statOptions[Math.floor(Math.random() * statOptions.length)],
            pf_c: statOptions[Math.floor(Math.random() * statOptions.length)],
        });
    };
    return (
        <div>
            <Subheading color={colors.primary}>Off-Season Training</Subheading>
            <p style={{fontSize: '0.7rem', marginBottom: '20px'}}>Select a training focus for each position group to improve their skills before the next season.</p>
            {renderFocusSelector('pg', 'Point Guards (PG)')}
            {renderFocusSelector('sg_sf', 'Wings (SG/SF)')}
            {renderFocusSelector('pf_c', 'Bigs (PF/C)')}
            
            <button 
                style={{...styles.button, marginTop: '20px'}} 
                onClick={() => dispatch({type: 'FINALIZE_TRAINING', payload: focuses as TrainingFocuses})}
                disabled={!isReady}
            >
                Finalize Training & Start New Season
            </button>
            <button
                style={{...styles.button, marginTop: '20px', marginLeft: '10px'}}
                onClick={handleRandomizeFocus}
            >
                Randomize Focus
            </button>

            <div style={{marginTop: '20px'}}>
                <h5 style={{color: colors.primary}}>Individual Training Overrides</h5>
                <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Player</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Focus</th>
                            <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Intensity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.userTeam?.roster.map(p => (
                            <tr key={p.id}>
                                <td style={styles.td}>{p.name} ({p.position})</td>
                                <td style={styles.td}>
                                    <select 
                                        value={p.trainingFocus || 'Balanced'} 
                                        onChange={(e) => dispatch({type: 'UPDATE_PLAYER_TRAINING', payload: {playerId: p.id, focus: e.target.value as TrainingFocus}})}
                                        style={styles.select}
                                    >
                                        <option value="Balanced">Balanced</option>
                                        <option value="Inside Scoring">Inside Scoring</option>
                                        <option value="Outside Scoring">Outside Scoring</option>
                                        <option value="Playmaking">Playmaking</option>
                                        <option value="Defense">Defense</option>
                                        <option value="Rebounding">Rebounding</option>
                                        <option value="Athleticism">Athleticism</option>
                                    </select>
                                </td>
                                <td style={styles.td}>
                                    <select 
                                        value={p.trainingIntensity || 'Medium'} 
                                        onChange={(e) => dispatch({type: 'UPDATE_PLAYER_TRAINING', payload: {playerId: p.id, intensity: e.target.value as TrainingIntensity}})}
                                        style={styles.select}
                                    >
                                        <option value="Light">Light</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Intense">Intense</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
};




const SeasonAttendanceDetailModal = ({ seasonRecord, teamName, colors, onClose }: { seasonRecord: UserSeasonRecord, teamName: string, colors: TeamColors, onClose: () => void }) => {
    if (!seasonRecord) return null;

    const capacity = ARENA_CAPACITIES[teamName] || 5000;
    
    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h3 style={{ ...styles.title, fontSize: '1.3rem', color: colors.primary, marginBottom: '15px' }}>
                    Game Attendance for {2024 + seasonRecord.season}
                </h3>
                 <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div style={styles.tableContainer}>
                    <table style={{...styles.table, fontSize: '0.6rem'}}>
                        <thead>
                            <tr>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Opponent</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Attendance</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Capacity %</th>
                                <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seasonRecord.gameAttendance.map((game, index) => (
                                <tr key={index}>
                                    <td style={styles.td}>vs {game.opponent}</td>
                                    <td style={styles.td}>{game.attendance.toLocaleString()} / {capacity.toLocaleString()}</td>
                                    <td style={styles.td}>{((game.attendance / capacity) * 100).toFixed(1)}%</td>
                                    <td style={styles.td}>{formatCurrency(game.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const describeEndowmentTier = (score: number): string => {
    if (score >= 90) return 'Generational Wealth';
    if (score >= 80) return 'Blue-Chip Funded';
    if (score >= 65) return 'Well Financed';
    if (score >= 50) return 'Stable Backing';
    return 'Resourceful';
};

const describeDonationLevel = (level: number): string => {
    if (level >= 90) return 'Record-Breaking Drive';
    if (level >= 70) return 'Energized Alumni';
    if (level >= 50) return 'Steady Support';
    if (level >= 30) return 'Guarded Donors';
    return 'Fatigued Boosters';
};

const describeMomentum = (momentum: number): string => {
    if (momentum >= 8) return 'Surging';
    if (momentum >= 3) return 'Building Steam';
    if (momentum > -3) return 'Holding';
    if (momentum > -8) return 'Cooling';
    return 'Pullback';
};



type SponsorModalProps = {
    team: Team;
    allTeams: Team[];
    sponsors: { [key in SponsorName]?: SponsorData };
    colors: TeamColors;
    onClose: () => void;
    onAcceptOffer: (offer: SponsorOffer) => void;
};



const SeasonRecapModal = ({ recapData, onClose }: { recapData: GameState['seasonRecapData'], onClose: () => void }) => {
    if (!recapData) return null;
    
    const { record, tournamentResult, prestigeChange, coachReputation, coachReputationChange, signings, drafted, totalRevenue, projectedRevenue, cpi } = recapData;
    const reputationValue = coachReputation ?? 0;
    const reputationChangeValue = coachReputationChange ?? 0;

    const prestigeDelta = typeof prestigeChange === 'object'
        ? (prestigeChange.delta ?? (prestigeChange.current - prestigeChange.previous))
        : prestigeChange ?? 0;
    const prestigeStyle = prestigeDelta === 0 ? {} : { color: prestigeDelta > 0 ? 'green' : 'red', fontWeight: 'bold' };
    const prestigeText = prestigeDelta > 0 ? `+${prestigeDelta}` : `${prestigeDelta}`;
    const reputationStyle = reputationChangeValue === 0 ? {} : { color: reputationChangeValue > 0 ? 'green' : 'red', fontWeight: 'bold' };
    const reputationText = reputationChangeValue >= 0 ? `+${reputationChangeValue}` : `${reputationChangeValue}`;

    
    const renderList = (title: string, items: { name: string, details: React.ReactNode }[]) => (
        <div style={{ marginBottom: '15px' }}>
            <h4 style={{...styles.modalSubheading, color: '#000' }}>{title}</h4>
            {items.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.6rem' }}>
                    {items.map((item, index) => <li key={index}><strong>{item.name}</strong> - {item.details}</li>)}
                </ul>
            ) : <p style={{ fontSize: '0.6rem' }}>None</p>}
        </div>
    );

    const cpiStatusColor = (status: string | undefined) => {
        if (status === 'Safe') return 'green';
        if (status === 'Warm') return 'orange';
        if (status === 'Hot') return 'red';
        if (status === 'Fired') return '#B22222';
        return '#000';
    };

    const bestDriver = cpi?.components?.length
        ? [...cpi.components].sort((a, b) => (b.score - a.score))[0]
        : null;
    const worstDriver = cpi?.components?.length
        ? [...cpi.components].sort((a, b) => (a.score - b.score))[0]
        : null;
    
    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, maxWidth: '800px'}}>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>Season Recap</h2>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '15px', fontSize: '0.8rem' }}>
                    <p><strong>Record:</strong> {record}</p>
                    <p><strong>Result:</strong> {tournamentResult}</p>
                    <p><strong>Prestige:</strong> <span style={prestigeStyle}>{prestigeText}</span></p>
                    <p><strong>Coach Rep:</strong> {reputationValue} (<span style={reputationStyle}>{reputationText}</span>)</p>
                </div>
                {cpi && (
                    <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #000', backgroundColor: '#E0E0E0' }}>
                        <h4 style={{...styles.modalSubheading, color: '#000' }}>Coach Performance Index (CPI)</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px', fontSize: '0.75rem' }}>
                            <p><strong>CPI:</strong> {Math.round(cpi.compositeScore)}/100</p>
                            <p><strong>Status:</strong> <span style={{ color: cpiStatusColor(cpi.status), fontWeight: 'bold' }}>{cpi.status}</span></p>
                            <p><strong>Profile:</strong> {cpi.boardProfile}</p>
                        </div>
                        {(bestDriver || worstDriver) && (
                            <div style={{ textAlign: 'center', fontSize: '0.65rem', marginBottom: '8px', color: '#333' }}>
                                {bestDriver && <span><strong>Best:</strong> {bestDriver.label} ({Math.round(bestDriver.score)})</span>}
                                {bestDriver && worstDriver && <span> � </span>}
                                {worstDriver && <span><strong>Worst:</strong> {worstDriver.label} ({Math.round(worstDriver.score)})</span>}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px', fontSize: '0.6rem' }}>
                            {cpi.components.map(component => (
                                <div key={component.key} style={{ padding: '6px', border: '1px solid #808080', backgroundColor: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <strong style={{ fontSize: '0.6rem' }}>{component.label}</strong>
                                        <span style={{ color: '#555' }}>{Math.round(component.weight * 100)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#333' }}>{component.displayActual ?? (typeof component.actual === 'number' ? `${Math.round(component.actual)}` : 'N/A')}</span>
                                        <span style={{ color: '#666' }}>{component.displayExpected ?? (typeof component.expected === 'number' ? `${Math.round(component.expected)}` : '')}</span>
                                    </div>
                                    <div style={{ marginTop: '4px', color: component.score >= 60 ? 'green' : component.score >= 45 ? '#444' : 'red', fontWeight: 'bold' }}>
                                        Score: {Math.round(component.score)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {projectedRevenue > 0 && (
                    <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem' }}>
                        <p><strong>Revenue:</strong> {formatCurrency(totalRevenue)} vs. Projected {formatCurrency(projectedRevenue)}</p>
                    </div>
                )}
                {renderList('NBA Draft Picks', drafted.map(d => ({ name: d.player.name, details: `Pick #${d.pick} - ${NBA_ACRONYM_TO_NAME[d.nbaTeam] || d.nbaTeam}` })))}
                {renderList('New Signings', signings.map(s => {
                    const stars = Math.max(0, Math.min(5, Math.round((s as any).stars ?? 0)));
                    return {
                        name: s.name,
                        details: (
                            <span>
                                <span style={{ color: '#d4af37' }}>{'?'.repeat(stars)}</span>
                                <span style={{ color: '#999' }}>{'?'.repeat(5 - stars)}</span>
                                {' '}{s.position} ({s.overall} OVR)
                            </span>
                        )
                    };
                }))}
                <button onClick={onClose} style={{...styles.button, marginTop: '20px', width: '100%'}}>Continue</button>
            </div>
        </div>
    );
};


const migrateSaveState = (loadedState: any): GameState => {
    let state = { ...loadedState };
    const version = state.version || 1;

    if (version < 3) {
      state.allTeams.forEach((t: Team) => {
        t.fanInterest = t.prestige;
        t.prices = { ticketPrice: 15, jerseyPrice: 75, merchandisePrice: 25, concessionFoodPrice: 10, concessionDrinkPrice: 5, parkingPrice: 10 };
        t.finances = { baseRevenue: 0, gateRevenue: 0, merchandiseRevenue: 0, concessionsRevenue: 0, parkingRevenue: 0, donationRevenue: 0, endowmentSupport: 0, tournamentShare: 0, sponsorPayout: 0, totalRevenue: 0, operationalExpenses: 0, firedStaffSalaries: 0, facilitiesExpenses: 0, travelExpenses: 0, recruitingExpenses: 0, marketingExpenses: 0, administrativeExpenses: 0, staffPayrollExpenses: 0, loanPayments: 0, broadcastRevenue: 0, licensingRevenue: 0, nilExpenses: 0, netIncome: 0, cashOnHand: 0, ledger: [] };
      });
      if(state.userTeam) {
        state.userTeam.fanInterest = state.userTeam.prestige;
        state.userTeam.prices = { ticketPrice: 15, jerseyPrice: 75, merchandisePrice: 25, concessionFoodPrice: 10, concessionDrinkPrice: 5, parkingPrice: 10 };
        state.userTeam.finances = { baseRevenue: 0, gateRevenue: 0, merchandiseRevenue: 0, concessionsRevenue: 0, parkingRevenue: 0, donationRevenue: 0, endowmentSupport: 0, tournamentShare: 0, sponsorPayout: 0, totalRevenue: 0, operationalExpenses: 0, firedStaffSalaries: 0, facilitiesExpenses: 0, travelExpenses: 0, recruitingExpenses: 0, marketingExpenses: 0, administrativeExpenses: 0, staffPayrollExpenses: 0, broadcastRevenue: 0, licensingRevenue: 0, nilExpenses: 0, netIncome: 0, cashOnHand: 0, ledger: [] };
      }
      if(state.history?.userTeamRecords) {
        state.history.userTeamRecords.forEach((r: UserSeasonRecord) => {
            if(!r.totalRevenue) r.totalRevenue = 0;
            if(!r.gameAttendance) r.gameAttendance = [];
        });
      }
       if(state.history?.teamHistory) {
         Object.values(state.history.teamHistory).forEach((teamHistArr: any) => {
            teamHistArr.forEach((h: TeamHistory) => {
                 if(!h.totalRevenue) h.totalRevenue = 0;
            });
         });
      }
    }

    if (state.rotationPreference == null) {
        state.rotationPreference = 'balanced';
    }

    const ensureTeamFinancials = (team: Team) => {
        if (!team.finances) {
            team.finances = {
                baseRevenue: 0,
                gateRevenue: 0,
                merchandiseRevenue: 0,
                concessionsRevenue: 0,
                parkingRevenue: 0,
                donationRevenue: 0,
                broadcastRevenue: 0,
                licensingRevenue: 0,
                nilExpenses: 0,
                netIncome: 0,
                cashOnHand: 0,
                endowmentSupport: 0,
                tournamentShare: 0,
                ledger: [],

                sponsorPayout: 0,
                totalRevenue: 0,
                operationalExpenses: 0,
                firedStaffSalaries: 0,
                facilitiesExpenses: 0,
                travelExpenses: 0,
                recruitingExpenses: 0,
                marketingExpenses: 0,
                administrativeExpenses: 0,
                staffPayrollExpenses: 0,
                loanPayments: 0,
            };
        } else {
            team.finances.baseRevenue = team.finances.baseRevenue || 0;
            team.finances.gateRevenue = team.finances.gateRevenue || 0;
            team.finances.merchandiseRevenue = team.finances.merchandiseRevenue || 0;
            team.finances.concessionsRevenue = team.finances.concessionsRevenue || 0;
            team.finances.parkingRevenue = team.finances.parkingRevenue || 0;
            team.finances.donationRevenue = team.finances.donationRevenue || 0;
            team.finances.endowmentSupport = team.finances.endowmentSupport || 0;
            team.finances.tournamentShare = team.finances.tournamentShare || 0;
            team.finances.sponsorPayout = team.finances.sponsorPayout || 0;
            team.finances.totalRevenue = team.finances.totalRevenue || 0;
            team.finances.operationalExpenses = team.finances.operationalExpenses || 0;
            team.finances.firedStaffSalaries = team.finances.firedStaffSalaries || 0;
            team.finances.facilitiesExpenses = team.finances.facilitiesExpenses || 0;
            team.finances.travelExpenses = team.finances.travelExpenses || 0;
            team.finances.recruitingExpenses = team.finances.recruitingExpenses || 0;
            team.finances.marketingExpenses = team.finances.marketingExpenses || 0;
            team.finances.administrativeExpenses = team.finances.administrativeExpenses || 0;
            team.finances.staffPayrollExpenses = team.finances.staffPayrollExpenses || 0;
        }
        if (!team.wealth || typeof team.wealth === 'string') {
            const fanInterest = typeof team.fanInterest === 'number' ? team.fanInterest : (team.prestige || 50);
            const prestige = typeof team.prestige === 'number' ? team.prestige : 50;
            team.wealth = seedProgramWealth(team.name, prestige, team.conference || 'Independent', fanInterest);
        }
    };

    if (state.allTeams) {
        state.allTeams.forEach((t: Team) => ensureTeamFinancials(t));
    }
    if (state.userTeam) {
        ensureTeamFinancials(state.userTeam);
    }

    // If an older save seeded full-season projections into `finances`, clear them at season start so the ledger/YTD start at 0.
    const shouldResetSeasonFinances = (team: Team) => {
        const ledgerEmpty = !team.finances?.ledger || team.finances.ledger.length === 0;
        const looksSeeded = (team.finances?.totalRevenue || 0) > 0 || (team.finances?.operationalExpenses || 0) > 0;
        const atSeasonStart = (state.gameInSeason || 1) === 1;
        if (!ledgerEmpty || !looksSeeded || !atSeasonStart) return;
        const firedStaffSalaries = team.finances?.firedStaffSalaries || 0;
        team.finances = {
            ...team.finances,
            baseRevenue: 0,
            gateRevenue: 0,
            merchandiseRevenue: 0,
            concessionsRevenue: 0,
            parkingRevenue: 0,
            donationRevenue: 0,
            endowmentSupport: 0,
            tournamentShare: 0,
            sponsorPayout: 0,
            broadcastRevenue: 0,
            licensingRevenue: 0,
            totalRevenue: 0,
            operationalExpenses: 0,
            facilitiesExpenses: 0,
            travelExpenses: 0,
            recruitingExpenses: 0,
            marketingExpenses: 0,
            administrativeExpenses: 0,
            staffPayrollExpenses: 0,
            loanPayments: 0,
            nilExpenses: 0,
            firedStaffSalaries,
            netIncome: 0,
            cashOnHand: team.budget?.cash || 0,
            ledger: [],
        };
    };
    if (state.allTeams) state.allTeams.forEach((t: Team) => shouldResetSeasonFinances(t));
    if (state.userTeam) shouldResetSeasonFinances(state.userTeam);
    
    const loadedHistory = state.history || {};
    const migratedState: GameState = {
        ...initialState,
        ...state,
        history: {
            userTeamRecords: loadedHistory.userTeamRecords || [],
            champions: loadedHistory.champions || [],
            teamHistory: loadedHistory.teamHistory || {},
            nbaDrafts: loadedHistory.nbaDrafts || [],
        },
        version: CURRENT_SAVE_VERSION,
        currentUserTeamAttendance: state.currentUserTeamAttendance || [],
        internationalProspects: state.internationalProspects || [],
        currentNBASimulation: state.currentNBASimulation || null,
        lastSimWeekKey: state.lastSimWeekKey ?? null,
    };

    migratedState.allTeams = migratedState.allTeams.map(normalizeTeamData);
    if (migratedState.userTeam) {
        migratedState.userTeam = normalizeTeamData(migratedState.userTeam);
    }
    migratedState.freeAgentStaff = migratedState.freeAgentStaff
        ? {
            assistants: migratedState.freeAgentStaff.assistants.map(normalizeStaffContract),
            trainers: migratedState.freeAgentStaff.trainers.map(normalizeStaffContract),
            scouts: migratedState.freeAgentStaff.scouts.map(normalizeStaffContract),
        }
        : generateFreeAgentStaff();
    migratedState.mockDraftProjections = migratedState.mockDraftProjections || {};
    migratedState.mockDraftProjectionDiffs = migratedState.mockDraftProjectionDiffs || {};
    migratedState.mockDraftBoard = migratedState.mockDraftBoard || [];
    migratedState.customDraftPickRules = migratedState.customDraftPickRules || [];
    migratedState.pendingStaffRenewals = (state.pendingStaffRenewals && state.pendingStaffRenewals.length > 0)
        ? state.pendingStaffRenewals
        : collectExpiredStaffRenewals(migratedState.userTeam);
    if (migratedState.coach) {
        migratedState.coach.playerAlumni = migratedState.coach.playerAlumni || {};
    }
    migratedState.nilNegotiationCandidates = state.nilNegotiationCandidates || [];
    migratedState.nilNegotiationHistory = state.nilNegotiationHistory || [];
    migratedState.nilPhaseComplete = state.nilPhaseComplete ?? false;

    // Fix: Enforce minimum Net Income goals (7M+) for all teams
    const enforceMinNetIncome = (team: Team) => {
        if (team.boardExpectations) {
            const prestige = team.prestige;
            let target = 7000000;
            if (prestige >= 90) target = 45000000;
            else if (prestige >= 80) target = 30000000;
            else if (prestige >= 70) target = 20000000;
            else if (prestige >= 60) target = 15000000;
            else if (prestige >= 50) target = 10000000;

            if (team.boardExpectations.targetNetIncome < target) {
                team.boardExpectations.targetNetIncome = target;
            }
        }
    };

    if (migratedState.allTeams) {
        migratedState.allTeams.forEach(enforceMinNetIncome);
    }
    if (migratedState.userTeam) {
        enforceMinNetIncome(migratedState.userTeam);
    }

    return migratedState;
};

const CoachModal = ({ state, dispatch, onClose }: { state: GameState, dispatch: React.Dispatch<GameAction>, onClose: () => void }) => {
    if (!state.coach?.contract || !state.userTeam) return null;
    const { expectations, yearsRemaining } = state.coach.contract;
    const { coach } = state;
    const [pendingName, setPendingName] = useState(coach.name);
    const [activeTab, setActiveTab] = useState<'status' | 'skills'>('status');

    const earnedRevenue = calculateCurrentSeasonEarnedRevenue(state.userTeam, state.gameInSeason, state.currentUserTeamAttendance, state.tournament);
    const currentSeasonNetIncome = earnedRevenue.totalRevenue - earnedRevenue.operationalExpenses;

    
    const isTournamentTime = state.gameInSeason > 31 && state.tournament;
    const tournamentStatus = () => {
        if (!isTournamentTime) return "Not Started";
        const allMatchups = [...state.tournament!.firstFour, ...Object.values(state.tournament!.regions).flatMap(r => r.flat())];
        const inTournament = allMatchups.some(m => m.homeTeam === state.userTeam?.name || m.awayTeam === state.userTeam?.name);
        return inTournament ? "Qualified" : "Did Not Qualify";
    }

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{
                ...styles.modalContent, 
                maxWidth: activeTab === 'skills' ? '900px' : '600px', // Wider for skill tree
                border: '2px solid #0f172a',
                borderRadius: '8px',
                padding: '24px',
                background: '#f8fafc',
                boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
                transition: 'max-width 0.2s ease-in-out'
            }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{...styles.modalCloseButton, background: '#0f172a', color: '#fff'}}>X</button>
                <h3 style={{
                    ...styles.title, 
                    fontSize: '1.8rem', 
                    textShadow: 'none', 
                    color: '#0f172a',
                    borderBottom: '2px solid #0f172a',
                    paddingBottom: '16px',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    marginTop: 0
                }}>Coach Profile</h3>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setActiveTab('status')} 
                        style={{ ...styles.tabButton(activeTab === 'status') }}
                    >
                        Status
                    </button>
                    <button 
                        onClick={() => setActiveTab('skills')} 
                        style={{ ...styles.tabButton(activeTab === 'skills') }}
                    >
                        Skill Tree
                    </button>
                </div>

                {activeTab === 'status' ? (
                <div>
                    <div style={{fontSize: '0.9rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0'}}>
                        <span><strong>Reputation:</strong> {coach.reputation}</span>
                        <span><strong>Career Earnings:</strong> {formatCurrency(coach.careerEarnings)}</span>
                    </div>

                    <Subheading color={'#0f172a'}>Current Contract ({yearsRemaining} Yrs Left)</Subheading>
                    <div style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
                        <strong>Salary:</strong> {formatCurrency(state.coach.contract.salary)} / year
                    </div>
                    
                    <Subheading color={'#0f172a'}>Board Expectations</Subheading>
                    <div style={{fontSize: '0.85rem', marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#fff', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0'}}>
                        <div>
                            <strong>Profile:</strong> {expectations.boardProfile}
                        </div>
                        <div>
                            <strong>Pressure:</strong> {Math.round(expectations.pressure)}%
                        </div>
                        <div>
                            <strong>Wins:</strong> {expectations.evaluationMode === 'contract' ? `${coach.contract.progress.wins} / ${expectations.targetWins}` : expectations.targetWins}
                        </div>
                        <div>
                            <strong>Postseason:</strong> {expectations.targetPostseasonCount
                                ? `${expectations.targetTourneyRound.replace('Round of ', 'R')} x${expectations.targetPostseasonCount}`
                                : expectations.targetTourneyRound}
                        </div>
                        <div>
                            <strong>Net Income:</strong> {formatCurrency(expectations.targetNetIncome)}
                        </div>
                        <div>
                            <strong>Draft Picks:</strong> {expectations.targetDraftPicks} / yr
                        </div>
                        <div>
                            <strong>Attendance:</strong> {Math.round(expectations.targetAttendanceFillRate * 100)}% fill
                        </div>
                        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '4px' }}>
                            <strong>Evaluation Weights:</strong><br/>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                W {Math.round(expectations.weights.wins * 100)} / P {Math.round(expectations.weights.postseason * 100)} / Pipe {Math.round(expectations.weights.pipeline * 100)} / Brand {Math.round(expectations.weights.brand * 100)} / $ {Math.round(expectations.weights.finances * 100)}
                            </span>
                        </div>
                    </div>
                    <p style={{fontSize: '0.75rem', marginTop: '12px', fontStyle: 'italic', color: '#64748b'}}>
                        Job security is computed as a composite score (0�100) based on performance vs these expectations.
                    </p>
                    
                    <div style={{ marginTop: '24px' }}>
                        <Subheading color={'#0f172a'}>Personalize</Subheading>
                        <div style={{ ...styles.renameRow, gap: '8px' }}>
                            <input
                                value={pendingName}
                                onChange={e => setPendingName(e.target.value)}
                                style={{ ...styles.renameInput, border: '2px solid #cbd5e1', borderRadius: '4px', padding: '8px' }}
                                placeholder="Enter new coach name"
                            />
                            <button style={{ 
                                ...styles.button, 
                                flex: '0 0 auto', 
                                background: '#3b82f6', 
                                color: '#fff', 
                                border: '2px solid #1d4ed8', // Darker blue border
                                borderRadius: '4px',
                                boxShadow: '2px 2px 0 #1e3a8a', // Deep blue shadow
                                fontFamily: 'inherit',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                padding: '8px 16px'
                            }} onClick={() => dispatch({ type: 'RENAME_USER_COACH', payload: { name: pendingName } })}>
                                Rename
                            </button>
                        </div>
                    </div>
                </div>
                ) : (
                    <CoachSkillTree state={state} dispatch={dispatch} colors={state.userTeam.colors} isEmbedded={true} />
                )}
            </div>
        </div>
    );
};







const NBAContractNegotiationModal = ({ teamName, coach, dispatch }: { teamName: string, coach: Coach, dispatch: React.Dispatch<GameAction> }) => {
    const { length, options, salary } = useMemo(() => {
        const length = randomBetween(3, 5);
        const salary = calculateNBACoachSalary(teamName, coach);
        // Build simple wins-based goals for NBA
        const goals: ContractGoal[] = [];
        const perSeasonTargets = [38, 44, 50].map(t => ({ t, desc: `Win ${t} games per season on average.` }));
        perSeasonTargets.forEach(({ t, desc }) => {
            goals.push({ type: 'wins', target: t * length, duration: length, description: `${desc} (${t * length} total over ${length} years).` });
        });
        return { length, options: goals, salary };
    }, [teamName, coach]);
    const totalValue = length * salary;
    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>
                    NBA Head Coach Offer
                </h2>
                <p style={{textAlign: 'center', marginBottom: '10px', fontSize: '0.8rem'}}>General Manager of {teamName}</p>
                <p style={{textAlign: 'center', marginBottom: '5px', fontSize: '0.8rem'}}>Offering a {length}-year deal at {formatCurrency(salary)} per year.</p>
                <p style={{textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>Total Value: {formatCurrency(totalValue)}</p>
                <p style={{textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem'}}>Choose one of the following goals:</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {options.map((goal, i) => (
                        <button key={i} style={{...styles.button, padding: '15px'}} onClick={() => dispatch({type: 'SELECT_NBA_CONTRACT_GOAL', payload: { goal, salary }})}>
                           {goal.description}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GameOverModal = ({ reason, dispatch }: { reason: string, dispatch: React.Dispatch<GameAction> }) => (
    <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
            <h2 style={{ ...styles.title, fontSize: '2rem', textShadow: '3px 3px #808080', color: '#B22222' }}>
                Career Over
            </h2>
            <p style={{textAlign: 'center', marginBottom: '20px', fontSize: '0.8rem'}}>
                {reason}
            </p>
            <button style={{...styles.button, width: '100%'}} onClick={() => dispatch({type: 'START_NEW_GAME'})}>
                Start New Career
            </button>
        </div>
    </div>
);

const NBADashboard = ({ state, dispatch }: { state: GameState, dispatch: React.Dispatch<GameAction> }) => {
    const team = state.nbaCoachTeam || 'NBA Team';
    const record = state.nbaRecord || { wins: 0, losses: 0 };
    return (
        <div>
            <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>
                NBA Coaching: {team}
            </h2>
            <p style={{ fontSize: '0.8rem', marginBottom: '10px' }}>Season: {state.nbaSeason}</p>
            <p style={{ fontSize: '0.8rem', marginBottom: '20px' }}>Record: {record.wins}-{record.losses}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button style={styles.button} onClick={() => dispatch({ type: 'SIMULATE_NBA_SEASON' })}>
                    Simulate NBA Season
                </button>
                <button style={styles.button} onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.DASHBOARD })}>
                    Return to College
                </button>
            </div>
        </div>
    );
};

const CoachPerformanceReviewModal = ({ state, dispatch, colors }: { state: GameState, dispatch: React.Dispatch<GameAction>, colors: TeamColors }) => {
    if (!state.contractReviewData || !state.coach?.contract) return null;

    const { goalMet, wins, tournamentAppearances, revenue, adDecision } = state.contractReviewData;
    const { expectations, teamName } = state.coach.contract;

    const adMessage = adDecision === 'renew' 
        ? `We are pleased with your performance. We'd like to offer you an extension, and you are also free to explore other opportunities.`
        : `Performance did not meet board standards. We have decided to part ways. We wish you the best in your future endeavors.`;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>Coach Performance Review</h2>
                <p style={{textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem'}}>A message from the {teamName} Athletic Department</p>
                
                <Subheading color={'#333'}>Board CPI Review</Subheading>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '10px' }}>
                    <div>
                        <strong>Composite:</strong> {expectations.metrics ? Math.round(expectations.metrics.compositeScore) : 'N/A'}/100
                    </div>
                    <div>
                        <strong>Profile:</strong> {expectations.boardProfile}
                    </div>
                </div>

                {expectations.metrics?.components?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', fontSize: '0.65rem', marginBottom: '10px' }}>
                        {expectations.metrics.components.map(component => {
                            const isFinances = component.key === 'finances';
                            const actualText = component.displayActual ?? (typeof component.actual === 'number' ? (isFinances ? formatCurrency(component.actual) : `${Math.round(component.actual)}`) : 'N/A');
                            const expectedText = component.displayExpected ?? (typeof component.expected === 'number' ? (isFinances ? formatCurrency(component.expected) : `${Math.round(component.expected)}`) : 'N/A');
                            return (
                                <div key={component.key} style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f7f7f7' }}>
                                    <strong>{component.label}</strong><br/>
                                    {actualText} / {expectedText}<br/>
                                    <span style={{ color: '#666' }}>
                                        Score {Math.round(component.score)} � Weight {Math.round(component.weight * 100)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.7rem', marginBottom: '10px' }}>
                        <div style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <strong>Wins</strong><br/>
                            {wins} / {expectations.targetWins}
                        </div>
                        <div style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <strong>Postseason</strong><br/>
                            {tournamentAppearances} / {expectations.targetTourneyRound}
                        </div>
                        <div style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <strong>Net Income</strong><br/>
                            {formatCurrency(revenue)} / {formatCurrency(expectations.targetNetIncome)}
                        </div>
                    </div>
                )}
                <p style={{fontSize: '0.8rem', fontWeight: 'bold', color: goalMet ? 'green' : 'red', marginTop: '5px'}}>Result: {goalMet ? 'SATISFACTORY' : 'UNSATISFACTORY'}</p>

                <Subheading color={'#333'}>Athletic Director's Decision</Subheading>
                <p style={{fontSize: '0.7rem', fontStyle: 'italic', margin: '10px 0'}}>"{adMessage}"</p>

                <button style={{...styles.button, width: '100%', marginTop: '20px'}} onClick={() => dispatch({ type: 'PROCEED_TO_JOB_MARKET' })}>
                    Proceed to Job Market
                </button>
            </div>
        </div>
    );
};




const StaffFreeAgencyModal = ({ freeAgents, userTeam, dispatch, onClose }: { freeAgents: GameState['freeAgentStaff'], userTeam: Team, dispatch: React.Dispatch<GameAction>, onClose: () => void }) => {
    if (!freeAgents) return null;

    const handleHire = (staff: Staff, role: 'assistants' | 'trainers' | 'scouts') => {
        dispatch({ type: 'HIRE_FREE_AGENT_STAFF', payload: { staff, role } });
        onClose();
    };

    const renderFreeAgentGroup = (title: string, staffList: Staff[], role: 'assistants' | 'trainers' | 'scouts') => {
        const canHire = userTeam.staff[role].length < 3;
        return (
            <div style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#333', borderBottom: '2px solid #333', paddingBottom: '5px', marginBottom: '10px' }}>{title}</h3>
                {staffList.map(staff => (
                    <div key={staff.id} style={styles.staffCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '0.7rem' }}>{staff.name}</h4>
                            <span style={styles.staffGrade}>Grade: {staff.grade}</span>
                        </div>
                        <p style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#555', margin: '2px 0' }}>{staff.specialty}</p>
                        <p style={{ fontSize: '0.6rem', fontStyle: 'italic', margin: '5px 0' }}>{staff.description}</p>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
                            <p style={{fontSize: '0.6rem', textAlign: 'right'}}>Salary: {formatCurrency(staff.salary)}</p>
                            {canHire && <button onClick={() => handleHire(staff, role)} style={styles.smallButton}>Hire</button>}
                        </div>
                    </div>
                ))}
                 {!staffList.length && <p style={{fontSize: '0.7rem'}}>No free agents available.</p>}
            </div>
        );
    }

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>
                    Staff Free Agents
                </h2>
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                    {renderFreeAgentGroup('Assistant Coaches', freeAgents.assistants, 'assistants')}
                    {renderFreeAgentGroup('Trainers', freeAgents.trainers, 'trainers')}
                    {renderFreeAgentGroup('Scouts', freeAgents.scouts, 'scouts')}
                </div>
            </div>
        </div>
    );
};

const StaffRenewalModal = ({ renewal, colors, onRenew, onDecline }: { renewal: PendingStaffRenewal, colors: TeamColors, onRenew: (newSalary: number, years: number) => void, onDecline: () => void }) => {
    const raiseMultiplier = 1.12;
    const suggestedSalary = Math.max(50000, Math.round((renewal.currentSalary * raiseMultiplier) / 5000) * 5000);
    const roleLabel = staffRoleLabels[renewal.role];
    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ ...styles.title, fontSize: '1.2rem', color: colors.primary, textShadow: 'none', marginBottom: '10px' }}>Staff Contract Decision</h3>
                <p style={{ fontSize: '0.8rem', marginBottom: '10px' }}>
                    {renewal.name} ({roleLabel}) has reached the end of their {renewal.grade}-grade contract.
                </p>
                <div style={{ fontSize: '0.75rem', marginBottom: '15px', lineHeight: 1.5 }}>
                    <p><strong>Current Salary:</strong> {formatCurrency(renewal.currentSalary)}</p>
                    <p><strong>New Ask (+12% loyalty bump):</strong> {formatCurrency(suggestedSalary)} for {renewal.yearsOffered} yrs</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button style={{ ...styles.button }} onClick={() => onRenew(suggestedSalary, renewal.yearsOffered)}>
                        Re-sign {renewal.name}
                    </button>
                    <button style={{ ...styles.button, backgroundColor: '#B22222', borderColor: '#B22222' }} onClick={onDecline}>
                        Let {renewal.name} Walk
                    </button>
                </div>
            </div>
        </div>
    );
};


const NBATeamDetailView = ({ team, dispatch, state, colors }: { team: Team | NBATeamSimulation, dispatch: React.Dispatch<GameAction>, state: GameState, colors: TeamColors }) => {
    const [subTab, setSubTab] = useState<'roster' | 'financials'>('roster');
    
    // Helper to get consistent Team object structure (simulation vs live)
    const teamData = {
        name: team.name,
        record: { wins: (team as any).record?.wins ?? (team as any).wins ?? 0, losses: (team as any).record?.losses ?? (team as any).losses ?? 0 },
        capSpace: (team as any).salaryCapSpace ?? 0,
        taxBill: (team as any).luxuryTaxBill ?? 0,
        roster: (team as any).roster as Player[] | undefined,
    };

    // Identified alumni
    const alumniIds = new Set<string>();
    state.history.nbaDrafts.forEach(d => {
        d.picks.forEach(p => {
             if (p.originalTeam === state.userTeam?.name) {
                 alumniIds.add(p.player.id || p.player.name); // Fallback to name if ID missing in old saves
             }
        });
    });

    return (
        <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <button 
                    style={{ ...styles.button, fontSize: '0.6rem', padding: '5px 10px', marginRight: '10px' }}
                    onClick={() => dispatch({ type: 'CLOSE_NBA_TEAM_VIEW' })}
                >
                    &lt; Back
                </button>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', marginBottom: 0, color: 'black', textAlign: 'left' }}>
                    {NBA_ACRONYM_TO_NAME[teamData.name] || teamData.name}
                </h2>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.8rem', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
                <span>Record: <strong>{teamData.record.wins}-{teamData.record.losses}</strong></span>
                <span style={{ color: teamData.capSpace < 0 ? '#d32f2f' : '#388e3c' }}>
                    Cap Room: <strong>{formatCurrency(teamData.capSpace)}</strong>
                </span>
                <span style={{ color: teamData.taxBill > 0 ? '#d32f2f' : '#333' }}>
                    Tax Bill: <strong>{formatCurrency(teamData.taxBill)}</strong>
                </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <button onClick={() => setSubTab('roster')} style={{ ...styles.smallButton, fontSize: '0.7rem', padding: '8px 16px', backgroundColor: subTab === 'roster' ? '#333' : '#fff', color: subTab === 'roster' ? '#fff' : '#000' }}>Roster</button>
                <button onClick={() => setSubTab('financials')} style={{ ...styles.smallButton, fontSize: '0.7rem', padding: '8px 16px', backgroundColor: subTab === 'financials' ? '#333' : '#fff', color: subTab === 'financials' ? '#fff' : '#000' }}>Cap Sheet</button>
            </div>

            {subTab === 'roster' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    {teamData.roster ? (
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                              <thead>
                                  <tr>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Pos</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Player</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Origin</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Age</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Ovr</th>
                                      <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Pot</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>MPG</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>PPG</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>RPG</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>APG</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Salary</th>
                                    <th style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>Years</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamData.roster.sort((a,b) => (b.contract?.salary || 0) - (a.contract?.salary || 0)).map(p => {
                                    const isAlumni = alumniIds.has(p.id) || alumniIds.has(p.name);
                                    const gp = p.nbaStats?.gamesPlayed || 0;
                                    const mpg = gp > 0 ? (p.nbaStats!.minutes / gp).toFixed(1) : '-';
                                    const ppg = gp > 0 ? (p.nbaStats!.points / gp).toFixed(1) : '-';
                                    const rpg = gp > 0 ? (p.nbaStats!.rebounds / gp).toFixed(1) : '-';
                                    const apg = gp > 0 ? (p.nbaStats!.assists / gp).toFixed(1) : '-';

                                    return (
                                        <tr key={p.id} style={{ backgroundColor: isAlumni ? '#e3f2fd' : 'transparent' }}>
                                            <td style={styles.td}>{p.position}</td>
                                             <td style={styles.td}>
                                                 {p.name} {isAlumni && <span style={{fontSize: '0.6rem', color: '#1976d2', fontWeight: 'bold'}}>(Alum)</span>}
                                             </td>
                                             <td style={styles.td}>{p.originDescription || 'Unknown'}</td>
                                             <td style={styles.td}>{p.age ?? 22}</td>
                                             <td style={styles.td}>{p.overall ?? '-'}</td>
                                            <td style={styles.td}>{formatPotentialValue(p.potential)}</td>
                                            <td style={styles.td}>{mpg}</td>
                                            <td style={styles.td}>{ppg}</td>
                                            <td style={styles.td}>{rpg}</td>
                                            <td style={styles.td}>{apg}</td>
                                            <td style={styles.td}>{formatCurrency(p.contract?.salary || 0)}</td>
                                            <td style={styles.td}>{p.contract?.yearsLeft || 1}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p>Roster data not available (Simulation Mode).</p>
                    )}
                </div>
            )}
            
            {subTab === 'financials' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', border: '1px solid #ddd' }}>
                        <div style={{ padding: '15px', backgroundColor: '#f9f9f9', marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                        <h4 style={{marginTop: 0, marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px'}}>Financial Overview</h4>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div>
                                <p style={{margin: '4px 0'}}><strong>Total Payroll:</strong> {formatCurrency(teamData.roster ? teamData.roster.reduce((sum, p) => sum + (p.contract?.salary || 0), 0) : 0)}</p>
                                <p style={{margin: '4px 0'}}><strong>Luxury Tax Estimate:</strong> {formatCurrency(teamData.taxBill)}</p>
                            </div>
                            <div style={{textAlign: 'right', fontSize: '0.7rem', color: '#666', maxWidth: '300px', fontStyle: 'italic'}}>
                                Note: Future salary cap and luxury tax thresholds are projected with an estimated ~5% annual increase.
                            </div>
                        </div>
                        </div>

                    {teamData.roster ? (
                        <div style={styles.tableContainer}>
                        <table style={{ ...styles.table, fontSize: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...styles.th, textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1, boxShadow: '2px 0 5px rgba(0,0,0,0.1)' }}>Player</th>
                                    <th style={styles.th}>Age</th>
                                    {[0, 1, 2, 3, 4].map(i => {
                                        const y = BASE_CALENDAR_YEAR + state.season + i;
                                        return <th key={i} style={{...styles.th, backgroundColor: colors.primary, color: colors.text}}>{y}-{String(y + 1).slice(-2)}</th>
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {teamData.roster
                                    .sort((a, b) => (b.contract?.salary || 0) - (a.contract?.salary || 0))
                                    .map(p => {
                                        const annualSalary = p.contract?.salary || 0;
                                        const yearsDesc = p.contract?.yearsLeft || 0;
                                        return (
                                            <tr key={p.id}>
                                                <td style={{...styles.td, textAlign: 'left', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1, boxShadow: '2px 0 5px rgba(0,0,0,0.05)'}}>{p.name}</td>
                                                <td style={styles.td}>{p.age ? p.age + 0 : '-'}</td>
                                                {[0, 1, 2, 3, 4].map(i => {
                                                    const isUnderContract = i < yearsDesc;
                                                    return (
                                                        <td key={i} style={{...styles.td, color: isUnderContract ? '#000' : '#ccc', backgroundColor: isUnderContract ? '#e8f5e9' : 'transparent'}}>
                                                            {isUnderContract ? formatCurrency(annualSalary) : ''}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                })}
                                {/* Totals Row */}
                                <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                    <td style={{...styles.td, textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#f0f0f0', zIndex: 1}}>TOTALS</td>
                                    <td style={styles.td}></td>
                                    {[0, 1, 2, 3, 4].map(i => {
                                        const yearTotal = teamData.roster?.reduce((sum, p) => {
                                            const yearsDesc = p.contract?.yearsLeft || 0;
                                            return sum + (i < yearsDesc ? (p.contract?.salary || 0) : 0);
                                        }, 0) || 0;
                                        return (
                                            <td key={i} style={styles.td}>{formatCurrency(yearTotal)}</td>
                                        );
                                    })}
                                </tr>
                                {/* Cap Space Row */}
                                    <tr style={{ borderTop: '1px solid #ccc', backgroundColor: '#fff' }}>
                                    <td style={{...styles.td, textAlign: 'left', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1}}>Cap Space</td>
                                    <td style={styles.td}></td>
                                    {[0, 1, 2, 3, 4].map(i => {
                                        // Project cap Increase 5% per year
                                        const baseCap = constants.NBA_SALARY_CAP_2025 || 140000000;
                                        const projectedCap = baseCap * Math.pow(1.05, state.season + i);
                                        
                                        const yearTotal = teamData.roster?.reduce((sum, p) => {
                                            const yearsDesc = p.contract?.yearsLeft || 0;
                                            return sum + (i < yearsDesc ? (p.contract?.salary || 0) : 0);
                                        }, 0) || 0;
                                        const space = projectedCap - yearTotal;
                                        return (
                                            <td key={i} style={{...styles.td, color: space >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                                                {formatCurrency(space)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                        </div>
                    ) : <p>Roster data not available.</p>}
                </div>
            )}
        </div>
    );
};


// Removed conflicting styles import

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [isConferenceHubOpen, setIsConferenceHubOpen] = useState(false);
  const [followCalendarDuringSim, setFollowCalendarDuringSim] = useState(false);
  useEffect(() => {
      if (
          state.status === GameStatus.DASHBOARD &&
          state.userTeam &&
          Array.isArray(state.userTeam.sponsorOffers) &&
          state.userTeam.sponsorOffers.length > 0 &&
          !isSponsorModalOpen
      ) {
          setIsSponsorModalOpen(true);
      }
  }, [state.status, state.userTeam?.sponsorOffers?.length]);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [isStaffFreeAgencyModalOpen, setIsStaffFreeAgencyModalOpen] = useState(false);
  const [detailedSeasonRecord, setDetailedSeasonRecord] = useState<UserSeasonRecord | null>(null);
  const activeStaffRenewal = state.pendingStaffRenewals[0] || null;

  const handleRenewStaffMember = (newSalary: number, years: number) => {
    if (!activeStaffRenewal) return;
    dispatch({ type: 'RENEW_STAFF_CONTRACT', payload: { staffId: activeStaffRenewal.staffId, role: activeStaffRenewal.role, newSalary, years } });
  };

  const handleDeclineStaffRenewal = () => {
    if (!activeStaffRenewal) return;
    dispatch({ type: 'DECLINE_STAFF_RENEWAL', payload: { staffId: activeStaffRenewal.staffId, role: activeStaffRenewal.role } });
  };

  const saveGame = (slot: number) => {
    try {
        if (!state.userTeam) {
            dispatch({ type: 'SET_TOAST', payload: "Cannot save before selecting a team." });
            return;
        }
        const stateToSave = { ...state, version: CURRENT_SAVE_VERSION };
        const saveState = JSON.stringify(stateToSave);
        localStorage.setItem(`sweetSixteenSave_v${CURRENT_SAVE_VERSION}_${slot}`, saveState);
        
        const meta = {
            teamName: state.userTeam.name,
            season: state.season,
            game: state.gameInSeason <= 31 ? state.gameInSeason : "Post",
            timestamp: new Date().toISOString().slice(0, 10)
        };
        localStorage.setItem(`sweetSixteenMeta_v${CURRENT_SAVE_VERSION}_${slot}`, JSON.stringify(meta));
        
        dispatch({ type: 'SET_TOAST', payload: `Game saved to slot ${slot}.` });
        setIsSettingsOpen(false);
    } catch (error) {
        console.error("Failed to save game:", error);
        dispatch({ type: 'SET_TOAST', payload: "Error saving game." });
    }
  };

  const loadGame = (slot: number) => {
    try {
        let savedStateJSON = localStorage.getItem(`sweetSixteenSave_v${CURRENT_SAVE_VERSION}_${slot}`);
        if (!savedStateJSON) {
             const legacySave = localStorage.getItem(`sweetSixteenSave_${slot}`);
             if(legacySave){
                dispatch({ type: 'SET_TOAST', payload: `Loading legacy save...` });
                savedStateJSON = legacySave;
             }
        }
        
        if (savedStateJSON) {
            const loadedState = JSON.parse(savedStateJSON);
            const migratedState = migrateSaveState(loadedState);
            dispatch({ type: 'LOAD_STATE', payload: migratedState });
            dispatch({ type: 'SET_TOAST', payload: `Game loaded from slot ${slot}.` });
            setIsSettingsOpen(false);
        } else {
            dispatch({ type: 'SET_TOAST', payload: `No save data in slot ${slot}.` });
        }
    } catch (error) {
        console.error("Failed to load game:", error);
        dispatch({ type: 'SET_TOAST', payload: "Error loading game data." });
    }
  };

  const deleteSave = (slot: number) => {
    if (window.confirm(`Are you sure you want to delete the save in slot ${slot}?`)) {
        localStorage.removeItem(`sweetSixteenSave_v${CURRENT_SAVE_VERSION}_${slot}`);
        localStorage.removeItem(`sweetSixteenMeta_v${CURRENT_SAVE_VERSION}_${slot}`);
        localStorage.removeItem(`sweetSixteenSave_${slot}`);
        localStorage.removeItem(`sweetSixteenMeta_${slot}`);
        dispatch({ type: 'SET_TOAST', payload: `Save slot ${slot} deleted.` });
        setIsSettingsOpen(false); 
    }
  };

  const exportCurrentSave = () => {
    try {
        if (!state.userTeam) {
            dispatch({ type: 'SET_TOAST', payload: 'Select a team before exporting a save.' });
            return;
        }
        const payload = { ...state, version: CURRENT_SAVE_VERSION };
        const serialized = JSON.stringify(payload);
        const blob = new Blob([serialized], { type: 'application/json' });
        const safeTeamName = state.userTeam.name.replace(/[^a-z0-9]/gi, '_');
        const fileName = `sweet-sixteen-${safeTeamName}-season-${state.season}.json`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        dispatch({ type: 'SET_TOAST', payload: 'Save downloaded.' });
    } catch (error) {
        console.error('Failed to export save:', error);
        dispatch({ type: 'SET_TOAST', payload: 'Error exporting save.' });
    }
  };

  const importSaveFromFile = async (file: File) => {
    try {
        const contents = await file.text();
        const parsed = JSON.parse(contents);
        const migratedState = migrateSaveState(parsed);
        dispatch({ type: 'LOAD_STATE', payload: migratedState });
        dispatch({ type: 'SET_TOAST', payload: `Loaded save from ${file.name}.` });
        setIsSettingsOpen(false);
    } catch (error) {
        console.error('Failed to import save:', error);
        dispatch({ type: 'SET_TOAST', payload: 'Error loading save file.' });
    }
  };
  
  const powerRankings = useMemo(() => {
      const ranks = new Map<string, number>();
      if (state.allTeams.length === 0) return ranks;
      [...state.allTeams]
          .sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10))
          .forEach((t, i) => ranks.set(t.name, i + 1));
      return ranks;
  }, [state.allTeams]);

  const userTeamRecordsWithCurrent = useMemo(() => {
      const records = [...(state.history?.userTeamRecords || [])];
      const isCurrentSeasonRecorded = records.some(r => r.season === state.season && r.teamName === state.userTeam?.name);

      if (state.userTeam && !isCurrentSeasonRecorded) {
          const earnedRevenue = calculateCurrentSeasonEarnedRevenue(state.userTeam, state.gameInSeason, state.currentUserTeamAttendance, state.tournament);
          records.push({
              season: state.season,
              teamName: state.userTeam.name,
              wins: state.userTeam.record.wins,
              losses: state.userTeam.record.losses,
              rank: powerRankings.get(state.userTeam.name) || 0,
              prestige: state.userTeam.prestige,
              totalRevenue: earnedRevenue.totalRevenue, // Use earned revenue for in-progress season
              operationalExpenses: earnedRevenue.operationalExpenses,
              projectedRevenue: state.userTeam.initialProjectedRevenue?.totalRevenue || 0,
              gameAttendance: state.currentUserTeamAttendance,
              tournamentResult: 'In Progress',
          });
      }
      return records;
  }, [state.history?.userTeamRecords, state.userTeam, state.season, state.tournament, state.currentUserTeamAttendance, powerRankings, state.gameInSeason]);


  const teamColors = (state.userTeam && SCHOOL_COLORS[state.userTeam.name]) 
    ? SCHOOL_COLORS[state.userTeam.name] 
    : {primary: '#333', secondary: '#666', text: '#fff'};

  const conferenceLabelForHub = state.userTeam?.conference || 'Independent';
  const conferenceLogoUrlForHub = getConferenceLogoUrl(conferenceLabelForHub);

  const renderContent = () => {
    switch (state.status) {
    case GameStatus.DASHBOARD:
      return <Dashboard state={state} colors={teamColors} dispatch={dispatch} followCalendarDuringSim={followCalendarDuringSim} />;
    case GameStatus.NBA_DASHBOARD:
      return <NBADashboard state={state} dispatch={dispatch} />;
    case GameStatus.ROSTER:
      return <RosterView state={state} dispatch={dispatch} colors={teamColors} />;
    case GameStatus.SCHEDULE:
      return <Schedule state={state} dispatch={dispatch} colors={teamColors} />;
    case GameStatus.GAME_LOG:
        return <GameLogView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.RECRUITING: return <Recruiting state={state} dispatch={dispatch} colors={teamColors}/>;
      case GameStatus.STANDINGS: return <Standings state={state} colors={teamColors} dispatch={dispatch}/>;
      case GameStatus.TOURNAMENT: return <TournamentView state={state} dispatch={dispatch} colors={teamColors}/>;
      case GameStatus.SIGNING_PERIOD: return <SigningPeriodView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.ROSTER_FILLING: return <RosterFillingView state={state} dispatch={dispatch} colors={teamColors}/>;
      case GameStatus.TRAINING: return <Training state={state} dispatch={dispatch} colors={teamColors}/>;
      case GameStatus.IN_SEASON_TRAINING: return <InSeasonTrainingView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.HISTORY: return <History state={state} colors={teamColors} onSeasonClick={setDetailedSeasonRecord} dispatch={dispatch} onSelectNbaTeam={(team) => dispatch({ type: 'VIEW_NBA_TEAM', payload: team })} />;
      case GameStatus.NBA_TEAM_DETAIL: return state.selectedNBATeam ? <NBATeamDetailView team={state.selectedNBATeam} dispatch={dispatch} state={state} colors={teamColors} /> : null;
      case GameStatus.NBA_DRAFT_LOTTERY: return <NbaDraftLotteryView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.NIL_NEGOTIATION: return <NilNegotiationView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.SEASON_RECAP: 
          return <SeasonRecapModalV3 
              recapData={state.seasonRecapData} 
              onClose={() => dispatch({type: 'EVALUATE_OFFSEASON'})}
              teamName={state.userTeam?.name || 'Unknown Team'}
              coachName={state.coach?.name || 'Coach'}
              colors={teamColors}
          />;
      case GameStatus.FINANCES:
        return state.userTeam ? <EconomyHub state={state} userTeam={state.userTeam} dispatch={dispatch} colors={teamColors} /> : null;
      case GameStatus.ROSTER_RETENTION: return <RosterRetentionView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.TRANSFER_PORTAL: return <TransferPortalView state={state} dispatch={dispatch} colors={teamColors} />;
      case GameStatus.STAFF:
        return <StaffView team={state.userTeam!} colors={teamColors} dispatch={dispatch} onOpenFreeAgency={() => setIsStaffFreeAgencyModalOpen(true)} onOpenCoachProfile={() => setIsCoachModalOpen(true)} />;
      case GameStatus.SKILL_TREE:
        return <CoachSkillTree state={state} dispatch={dispatch} colors={teamColors} />;
      default: return <div>Coming Soon</div>;
    }
  };
  
  if (state.status === GameStatus.TEAM_SELECTION) {
      return <TeamSelection dispatch={dispatch} />
  }
   if (state.status === GameStatus.STAFF_RECRUITMENT) {
      return <StaffRecruitmentModal dispatch={dispatch} />;
  }
   if(state.status === GameStatus.COACH_PERFORMANCE_REVIEW) {
      return <CoachPerformanceReviewModal state={state} dispatch={dispatch} colors={teamColors} />
  }
  if(state.status === GameStatus.JOB_MARKET && (state.jobOffers || state.nbaJobOffers)) {
      return <JobMarketModal offers={state.jobOffers || []} nbaOffers={state.nbaJobOffers || []} dispatch={dispatch} powerRanks={powerRankings} onStay={() => dispatch({ type: 'REJECT_JOB_OFFERS' })} />
  }
  if(state.status === GameStatus.NBA_CONTRACT_NEGOTIATION && state.coach && state.nbaCoachTeam) {
      return <NBAContractNegotiationModal teamName={state.nbaCoachTeam} coach={state.coach} dispatch={dispatch} />
  }

  if(state.status === GameStatus.GAME_OVER && state.gameOverReason) {
      return <GameOverModal reason={state.gameOverReason} dispatch={dispatch} />;
  }
  if(state.status === GameStatus.CONTRACT_NEGOTIATION && state.userTeam) {
      const programExpectations = state.userTeam.boardExpectations || generateBoardExpectations(state.userTeam);
      const duration = state.pendingJobOffer?.length ?? 4;
      const contractExpectations = toContractBoardExpectations(programExpectations, duration);
      return <ContractOfferModal 
          isOpen={true}
          teamName={state.userTeam.name}
          prestige={state.userTeam.prestige}
          expectations={contractExpectations}
          offerSalary={state.pendingJobOffer?.salary}
          offerDuration={duration}
          onSign={(salary, duration) => dispatch({ type: 'SIGN_CONTRACT', payload: { expectations: toContractBoardExpectations(programExpectations, duration), salary, duration } })}
      />
  }
  if (state.status === GameStatus.SKILL_TREE) {
      return (
          <CoachSkillTree state={state} dispatch={dispatch} colors={teamColors} />
      );
  }

  return (
    <div style={styles.app}>
      {isConferenceHubOpen && state.userTeam && conferenceLabelForHub !== 'Independent' && (
        <ConferenceHubModal
          state={state}
          conferenceLabel={conferenceLabelForHub}
          conferenceLogoUrl={conferenceLogoUrlForHub}
          onClose={() => setIsConferenceHubOpen(false)}
          onOpenStandings={() => {
            setIsConferenceHubOpen(false);
            dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.STANDINGS });
          }}
        />
      )}
      {state.toastMessage && (
          <Toast message={state.toastMessage} onDismiss={() => dispatch({ type: 'SET_TOAST', payload: null })} />
      )}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={saveGame}
        onLoad={loadGame}
        onDelete={deleteSave}
        onExport={exportCurrentSave}
        onImport={importSaveFromFile}
      />
       {isCoachModalOpen && state.userTeam && (
            <CoachModal state={state} dispatch={dispatch} onClose={() => setIsCoachModalOpen(false)} />
        )}
      {detailedSeasonRecord && (
        <SeasonAttendanceDetailModal 
            seasonRecord={detailedSeasonRecord}
            teamName={detailedSeasonRecord.teamName}
            colors={SCHOOL_COLORS[detailedSeasonRecord.teamName] || teamColors}
            onClose={() => setDetailedSeasonRecord(null)}
        />
      )}
      {isSponsorModalOpen && state.userTeam && (
        <SponsorModal
            team={state.userTeam}
            allTeams={state.allTeams}
            sponsors={state.sponsors}
            colors={teamColors}
            onClose={() => setIsSponsorModalOpen(false)}
            onAcceptOffer={(offer) => {
                dispatch({ type: 'ACCEPT_SPONSOR_OFFER', payload: offer });
                setIsSponsorModalOpen(false);
            }}
        />
      )}
      {/* PoachingOfferModal removed - offers now handled in FinancialsTab */}
      {isStaffFreeAgencyModalOpen && state.freeAgentStaff && state.userTeam && (
        <StaffFreeAgencyModal
            freeAgents={state.freeAgentStaff}
            userTeam={state.userTeam}
            dispatch={dispatch}
            onClose={() => setIsStaffFreeAgencyModalOpen(false)}
        />
      )}

      {activeStaffRenewal && state.userTeam && (
        <StaffRenewalModal
            renewal={activeStaffRenewal}
            colors={teamColors}
            onRenew={handleRenewStaffMember}
            onDecline={handleDeclineStaffRenewal}
        />
      )}
      
    <Header
        state={state}
        dispatch={dispatch}
        colors={teamColors}
        onHeaderClick={() => setIsSettingsOpen(true)}
        onSponsorClick={() => state.userTeam && setIsSponsorModalOpen(true)}
        onCoachClick={() => setIsCoachModalOpen(true)}
        onConferenceClick={() => setIsConferenceHubOpen(true)}
    />
    <main style={styles.mainContentArea}>
        <NavAndActions
            state={state}
            dispatch={dispatch}
            colors={teamColors}
            onSimulationStateChange={setFollowCalendarDuringSim}
        />
        <div style={{...styles.content, border: `4px solid ${teamColors.primary}`}}>
            {renderContent()}
        </div>
    </main>
    </div>
  );
};

