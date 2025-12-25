// types.ts

import type { DraftPickRule } from './data/nbaDraftPickSwaps';
import type { CapState } from './services/nbaEconomyService';
import type { DevelopmentArchetype } from './services/progressionService';
export type { DraftPickRule };
export interface TeamColors {
  primary: string;
  secondary: string;
  text: string;
}

export type SponsorName =
  | 'Nike'
  | 'Adidas'
  | 'Jordan'
  | 'Under Armour'
  | 'Reebok'
  | 'New Balance'
  | 'Puma';

export type Month = 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC';

export interface GameDate {
    day: number;
    month: Month;
    year: number;
}

// Canonical local calendar date key used for all scheduled games/events.
// Format: "YYYY-MM-DD" (ISO local date, no time component).
export type ISODate = string;

export type GameAdjustment = 'neutral' | 'tempo_push' | 'tempo_slow' | 'focus_inside' | 'focus_outside' | 'aggressive_defense' | 'conservative_defense';

export enum GameStatus {
  IDLE = 'IDLE',
  TEAM_SELECTION = 'TEAM_SELECTION',
  DASHBOARD = 'DASHBOARD',
  STANDINGS = 'STANDINGS',
  ROSTER = 'ROSTER',
  SCHEDULE = 'SCHEDULE',
  RECRUITING = 'RECRUITING',
  GAME_LOG = 'GAME_LOG',
  TOURNAMENT = 'TOURNAMENT',
  OFFSEASON = 'OFFSEASON',
  TRAINING = 'TRAINING',
  IN_SEASON_TRAINING = 'IN_SEASON_TRAINING',
  HISTORY = 'HISTORY',
  SIGNING_PERIOD = 'SIGNING_PERIOD',
  ROSTER_FILLING = 'ROSTER_FILLING',
  CONTRACT_NEGOTIATION = 'CONTRACT_NEGOTIATION',
  STAFF_RECRUITMENT = 'STAFF_RECRUITMENT',
  TRANSFER_PORTAL = 'TRANSFER_PORTAL',
  ROSTER_RETENTION = 'ROSTER_RETENTION',
  NIL_NEGOTIATION = 'NIL_NEGOTIATION',
  NBA_DASHBOARD = 'NBA_DASHBOARD',
  NBA_STANDINGS = 'NBA_STANDINGS',
  NBA_DRAFT_LOTTERY = 'NBA_DRAFT_LOTTERY',
  NBA_DRAFT = 'NBA_DRAFT',
  NBA_CONTRACT_NEGOTIATION = 'NBA_CONTRACT_NEGOTIATION',
  NBA_TEAM_DETAIL = 'NBA_TEAM_DETAIL',
  JOB_MARKET = 'JOB_MARKET',
  SEASON_RECAP = 'SEASON_RECAP',
  FINANCES = 'FINANCES',
  STAFF = 'STAFF',
  COACH_PERFORMANCE_REVIEW = 'COACH_PERFORMANCE_REVIEW',
  GAME_OVER = 'GAME_OVER',
  SKILL_TREE = 'SKILL_TREE',
  EVALUATE_OFFSEASON = 'EVALUATE_OFFSEASON',
}

export type SponsorTier = 'Elite' | 'High' | 'Mid' | 'Low';



export interface SponsorData {
  marketShare: number;
  tier: SponsorTier;
  sponsoredTeamCount: number;
}

export interface SponsorRevenue {
  jersey: number;
  shoe: number;
  merch: number;
  total: number;
}

export interface PlayerStats {
    gamesPlayed: number;
    points: number;
    rebounds: number;
    assists: number;
    minutes: number;
}

export type DraftProjection = 'Lottery' | 'FirstRound' | 'SecondRound' | 'Undrafted';
export type NilPersonalityTrait =
    | 'LegacyBuilder'
    | 'BrandExpansionist'
    | 'HomegrownFavorite'
    | 'DegreeSeeker'
    | 'OneAndDoneDNA'
    | 'LateBloomer';

export type PlayerRole = 'Star Scorer' | 'Defensive Stopper' | 'Glue Guy' | 'Locker Room Leader' | 'Bench Warmer' | 'Volume Scorer' | 'Prospect' | 'Role Player';

export type StreakType = 'Hot' | 'Cold' | 'Neutral';

export interface PlayerStreak {
    type: StreakType;
    duration: number; // Games remaining
    impact: Partial<Record<keyof Player['stats'], number>>; // Stat modifiers
}

export type ProspectPersonality = 'Loyal' | 'NBA Bound' | 'Academically Focused' | 'Local Hero' | 'Spotlight Seeker';
export type RecruitNilPriority = 'LongTermStability' | 'DraftStock' | 'AcademicSupport' | 'BrandExposure';

export interface ProgramPreference {
    academics: number; // 0-100
    marketExposure: number; // 0-100
    communityEngagement: number; // 0-100
}

export type InjuryType = 'Sprained Ankle' | 'Torn ACL' | 'Concussion';
export type InjurySeverity = 'Minor' | 'Moderate' | 'Severe';

export interface PlayerInjury {
    type: InjuryType;
    severity: InjurySeverity;
    weeksRemaining: number;
    reinjuryRisk?: number;
    isSeasonEnding: boolean;
}

export interface CardioData {
    stamina: number;
    fatigue: number;
    recoveryRate: number;
}

export type TeamWealth = ProgramWealth;

export type TrainingFocus = 'Balanced' | 'Inside Scoring' | 'Outside Scoring' | 'Playmaking' | 'Defense' | 'Rebounding' | 'Athleticism';
export type TrainingIntensity = 'Light' | 'Medium' | 'Intense';

export interface Player {
  id: string;
  name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  secondaryPosition?: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  additionalPositions?: ('PG' | 'SG' | 'SF' | 'PF' | 'C')[];
  height: number; // Height in inches
  year: 'Fr' | 'So' | 'Jr' | 'Sr' | 'Intl' | 'Pro';
  overall: number;
  potential: number;
  homeState?: string;
  originDescription?: string;
  atRiskOfTransfer?: boolean;
  retentionTalkUsed?: boolean;
  // Optional rotation target minutes per game for roster management (0-40)
  rotationMinutes?: number;
  nbaComparable?: {
      name: string;
      salary: number;
      similarityScore: number;
  };
  transferMotivation?: string; // e.g. "Playing Time", "Winning", "NIL", "Home"
  minutesLocked?: boolean;
  stats: {
    insideScoring: number;
    outsideScoring: number;
    playmaking: number;
    perimeterDefense: number;

    insideDefense: number;
    rebounding: number;
    stamina: number;
  };
  starterPosition: RosterPositions | null;
  startOfSeasonOverall: number;
  xFactor: number;
  seasonStats: PlayerStats;
  isTargeted: boolean;
  naturalProgressAccumulator?: number;
  originCountry?: string;
  internationalClub?: string;
  nilValue?: number;
  nilContractAmount?: number;
  nilContractYearsRemaining?: number;
  nilPersonalityTraits?: NilPersonalityTrait[];
  localHeroismFactor?: number;
  socialMediaHeat?: number;
  draftProjection?: DraftProjection;
  // NBA Specifics
  age?: number;
  experience?: number; // Years in pro league
  contract?: PlayerContract;
  nbaStats?: PlayerStats;
  draftYear?: number;
  draftPick?: { round: number, pick: number };
  role?: PlayerRole;
  streak?: PlayerStreak;
  morale?: number; // 0-100
  injury?: PlayerInjury;
  trainingFocus?: TrainingFocus;
  trainingIntensity?: TrainingIntensity;
}

export interface Transfer extends Player {
    interest: number;
    userHasOffered: boolean;
    cpuOffers: string[];
    isTargeted: boolean;
    originTeamName: string;
}

export interface TransferPortalState {
    players: Transfer[];
    userOffers: string[];
    day: number;
}

export type RecruitArchetype = 'Mercenary' | 'HometownHero' | 'ProcessTrustor' | 'FameSeeker';
export type Dealbreaker = 'NIL' | 'PlayingTime' | 'Proximity' | 'Academics' | 'None';
export type VisitStatus = 'None' | 'Scheduled' | 'Completed' | 'Cancelled';

export interface Pipeline {
    state: string;
    tier: 'Gold' | 'Silver' | 'Bronze' | 'Platinum'; // Added Platinum
}

export interface RecruitMotivation {
    proximity: number;
    playingTime: number;
    nil: number;
    exposure: number;
    relationship: number;
    development: number;
    academics: number;
}

export interface Recruit extends Omit<Player, 'year' | 'starterPosition' | 'seasonStats' | 'isTargeted'> {
  verbalCommitment: string | null;
  userHasOffered: boolean;
  cpuOffers: string[];
  interest: number;
  stars: number;
  declinedOffers: string[];
  isTargeted: boolean;
  personalityTrait: ProspectPersonality;
  preferredProgramAttributes: ProgramPreference;
  nilPriority: RecruitNilPriority;
  archetype: RecruitArchetype;
  dealbreaker: Dealbreaker;
  visitStatus: VisitStatus;
  visitWeek?: number;
  homeState: string;
  state: string;
  isGem?: boolean;
  isBust?: boolean;

  // New Fields for Enhanced Recruiting
  motivations: RecruitMotivation;
  softCommitment: boolean;
  resilience: number; // 0-100, difficulty to flip
}

export type RotationPreference = 'balanced' | 'starterHeavy' | 'sevenSecond' | 'threeAndD' | 'defensive';

export type GameAction =
  | { type: 'SELECT_TEAM'; payload: string }
  | { type: 'CHANGE_VIEW'; payload: GameStatus }
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'UPDATE_ZONE_PRICING'; payload: { [key in SeatSegmentKey]: number } }
  | { type: 'RUN_ATTENDANCE_SIM'; payload?: { [key in SeatSegmentKey]?: number } }
  | { type: 'SIMULATE_WEEK' }
  | { type: 'SIMULATE_DAY' }
  | { type: 'SIMULATE_SEASON' }
  | { type: 'SIMULATE_TRANSFER_PORTAL_DAY' }
  | { type: 'ADVANCE_TOURNAMENT_ROUND' }
  | { type: 'CONTACT_RECRUIT'; payload: { recruitId: string } }
  | { type: 'OFFER_SCHOLARSHIP'; payload: { recruitId: string } }
  | { type: 'PULL_SCHOLARSHIP'; payload: { recruitId: string } }
  | { type: 'CUT_PLAYER'; payload: { playerId: string } }
  | { type: 'BULK_CUT_PLAYERS'; payload: { playerIds: string[] } }
  | { type: 'SET_PLAYER_MINUTES'; payload: { playerId: string; minutes: number } }
  | { type: 'AUTO_DISTRIBUTE_MINUTES' }
  | { type: 'AUTO_DISTRIBUTE_REMAINING_MINUTES' }
  | { type: 'RESET_MINUTES' }
  | { type: 'TOGGLE_PLAYER_MINUTES_LOCK'; payload: { playerId: string } }
  | { type: 'HIRE_STAFF'; payload: { assistants: Staff[]; trainers: Staff[]; scouts: Staff[] } }
  | { type: 'PROCEED_TO_ROSTER_FILLING' }
  | { type: 'SIMULATE_SIGNING_DAY' }
  | { type: 'FILL_ROSTER' }
  | { type: 'SET_STARTERS'; payload: { [key in RosterPositions]: string } }
  | { type: 'ACCEPT_SPONSOR_OFFER'; payload: SponsorOffer }
  | { type: 'FINALIZE_TRAINING'; payload: TrainingFocuses }
  | { type: 'UPDATE_PRICES'; payload: Prices }
  | { type: 'SET_TOAST'; payload: string | null }
  | { type: 'SET_NBA_HISTORY_TAB'; payload: 'drafts' | 'standings' | 'rosters' | 'stats' | 'transactions' | 'freeAgency' }
  | { type: 'SET_HISTORY_TAB'; payload: 'myCareer' | 'teamRecords' | 'nationalRankings' | 'nba' | 'coachDirectory' }
  | { type: 'PROCEED_TO_ROSTER_MANAGEMENT' }
  | { type: 'COACH_VISIT'; payload: { recruitId: string } }
  | { type: 'SIGN_CONTRACT'; payload: { expectations: BoardExpectations, salary: number, duration: number } }
  | { type: 'EVALUATE_OFFSEASON' }
  | { type: 'PROCEED_TO_JOB_MARKET' }
  | { type: 'SELECT_JOB_OFFER'; payload: JobOffer }
  | { type: 'SELECT_NBA_JOB_OFFER'; payload: string }
  | { type: 'SELECT_NBA_CONTRACT_GOAL'; payload: { goal: ContractGoal, salary: number } }
  | { type: 'SIMULATE_NBA_SEASON' }
  | { type: 'START_NEW_GAME' }
  | { type: 'TRAIN_PLAYER_STAT'; payload: { playerId: string; stat: keyof Player['stats'] } }
  | { type: 'FIRE_STAFF'; payload: { staffId: string; role: 'assistants' | 'trainers' | 'scouts' } }
  | { type: 'HIRE_FREE_AGENT_STAFF'; payload: { staff: Staff; role: 'assistants' | 'trainers' | 'scouts' } }
  | { type: 'TOGGLE_RECRUIT_TARGET'; payload: { recruitId: string } }
  | { type: 'SIMULATE_TOURNAMENT' }
  | { type: 'VIEW_GAME_LOG'; payload: { gameLog: GameBoxScore } }
  | { type: 'UPDATE_MOCK_DRAFT_PROJECTIONS'; payload: { picks: Record<number, string>; diffs: Record<string, number> } }
  | { type: 'SET_MOCK_DRAFT_BOARD'; payload: { board: DraftProspect[] } }
  | { type: 'RENEW_STAFF_CONTRACT'; payload: { staffId: string; role: 'assistants' | 'trainers' | 'scouts'; newSalary: number; years: number } }
  | { type: 'DECLINE_STAFF_RENEWAL'; payload: { staffId: string; role: 'assistants' | 'trainers' | 'scouts' } }
  | { type: 'TOGGLE_PLAYER_TARGET'; payload: { playerId: string } }
  | { type: 'MAKE_NIL_OFFER'; payload: { playerId: string; amount: number; years: number } }
  | { type: 'FINALIZE_NIL_NEGOTIATIONS' }
  | { type: 'FINALIZE_ROSTER_RETENTION' }
  | { type: 'MEET_WITH_PLAYER', payload: { playerId: string } }
  | { type: 'FINALIZE_TRANSFER_PORTAL' }
  | { type: 'REJECT_JOB_OFFERS' }
  | { type: 'RESOLVE_POACHING_OFFER'; payload: { decision: 'reject' | 'next_season' | 'immediate'; offer: PoachingOffer } }
  | { type: 'PURCHASE_SKILL'; payload: { skillId: string } }
  | { type: 'SEED_NIL_CANDIDATES'; payload: { candidates: NilNegotiationCandidate[] } }
  | { type: 'MANAGE_NIL_COLLECTIVE'; payload: { sponsorMatch: number; alumniContribution: number } }
  | { type: 'ACCEPT_SPONSOR_QUEST'; payload: SponsorQuest }
  | { type: 'SCHEDULE_EVENT'; payload: { playbookId: string; week: number; opponent: string } }
  | { type: 'RESCHEDULE_EVENT'; payload: { eventId: string; week: number } }
  | { type: 'CANCEL_EVENT'; payload: { eventId: string } }
  | { type: 'NEGOTIATE_BROADCAST'; payload: { deal: BroadcastDeal } }
  | { type: 'DECLINE_BROADCAST_OFFER'; payload: { offerId: string } }
  | { type: 'MAKE_FINANCIAL_INVESTMENT'; payload: { investmentType: 'recruitingCampaign' | 'trainingFacilities' | 'marketingPush' } }
  | { type: 'SIMULATE_TOURNAMENT_ROUND' }
  | { type: 'SET_PLAYER_FOCUS'; payload: { playerId: string | null } }
  | { type: 'SET_TEAM_CAPTAIN'; payload: { playerId: string | null } }
  | { type: 'SET_ROTATION_PREFERENCE'; payload: RotationPreference }
  | { type: 'RENAME_USER_COACH'; payload: { name: string } }
  | { type: 'SET_AUTO_TRAINING_ENABLED'; payload: boolean }
  | { type: 'SET_CONCESSION_TIER'; payload: ConcessionTier }
  | { type: 'SET_SIGNATURE_ITEM'; payload: string }
  | { type: 'SET_ALCOHOL_POLICY'; payload: boolean }
  | { type: 'SET_CONCESSION_PRICING'; payload: Partial<ConcessionPricingSettings> }
  | { type: 'SET_INVENTORY_STRATEGY'; payload: 'Conservative' | 'Aggressive' }
  | { type: 'SET_MERCH_PRICING'; payload: Partial<MerchPricingSettings> }
  | { type: 'VIEW_NBA_TEAM'; payload: Team | NBATeamSimulation }
  | { type: 'CLOSE_NBA_TEAM_VIEW' }
  | { type: 'SET_GLOBAL_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'UPDATE_CONCESSION_ITEM_PRICE'; payload: { itemId: string; price: number } }
  | { type: 'UPDATE_CONCESSION_ITEM_TIER'; payload: { itemId: string; tier: 'Budget' | 'Standard' | 'Gourmet' } }
  | { type: 'UPDATE_MERCH_ITEM_PRICE'; payload: { itemId: string; price: number } }
  | { type: 'UPDATE_TICKET_ZONE_PRICE'; payload: { zoneId: string; price: number } }
  | { type: 'SET_MERCH_STRATEGY'; payload: { strategy: 'Conservative' | 'Aggressive' | 'JustInTime' | 'Bulk' } }
  | { type: 'SCHEDULE_PROMO'; payload: { week: number; event: ScheduledEvent } }
  | { type: 'SET_NIL_SPLIT'; payload: number }
  | { type: 'TOGGLE_DYNAMIC_PRICING'; payload: { zoneId: string; rule: keyof TicketZone['dynamicPricing'] } }
  | { type: 'SET_TRAVEL_SETTINGS'; payload: { method: TravelMethod; accommodation: AccommodationTier } }
  | { type: 'SCHEDULE_EVENT'; payload: { week: number; playbookId: string; opponent: string } }
  | { type: 'CANCEL_EVENT'; payload: { eventId: string } }
  | { type: 'TAKE_LOAN'; payload: { amount: number; termMonths: number; interestRate: number } }
  | { type: 'PAY_LOAN'; payload: { loanId: string; amount: number } }
  | { type: 'START_MARKETING_CAMPAIGN'; payload: { type: MarketingCampaignType; cost: number; durationWeeks: number } }
  | { type: 'SET_PARKING_ENHANCEMENTS'; payload: Partial<ParkingPricingSettings> }
  | { type: 'SET_PARKING_PRICES'; payload: { general: number; vip: number } }
  | { type: 'SET_TAILGATE_CULTURE'; payload: number }
  | { type: 'TOGGLE_DYNAMIC_PRICING'; payload: { zoneId: SeatSegmentKey; rule: keyof DynamicPricingRules } }
  | { type: 'SET_MERCH_STRATEGY'; payload: { strategy: 'Conservative' | 'Aggressive' | 'JustInTime' | 'Bulk' } }
  | { type: 'ADVANCE_TO_OFF_SEASON' }
  | { type: 'ALUMNI_ACTION'; payload: { actionType: 'HOST_GALA' | 'ASK_DONATION' | 'INVITE_PRACTICE'; alumniId?: string } }
  | { type: 'RESOLVE_DILEMMA'; payload: { optionIndex: number } }
  | { type: 'ACCEPT_LICENSING_DEAL'; payload: LicensingContract }
  | { type: 'SCHEDULE_VISIT'; payload: { recruitId: string; week: number } }
  | { type: 'NEGATIVE_RECRUIT'; payload: { recruitId: string; targetSchool: string; method: 'Rumors' | 'Violations' | 'Academics' } }
  | { type: 'SCOUT_RECRUIT'; payload: { recruitId: string; cost: number } }
  | { type: 'OFFER_TRANSFER_PLAYER'; payload: { playerId: string } }
  | { type: 'UPDATE_PLAYER_TRAINING'; payload: { playerId: string; focus?: TrainingFocus; intensity?: TrainingIntensity } }
  | { type: 'TOGGLE_TRANSFER_TARGET'; payload: { playerId: string } }
  | { type: 'TRAIN_PLAYER_STAT'; payload: { playerId: string; stat: keyof Player['stats'] } }
  | { type: 'UPGRADE_FACILITY'; payload: { facilityType: 'arena' | 'training' | 'medical' | 'scouting' | 'coaching' | 'academic' | 'nutrition' | 'housing'; upgradeType: string; cost: number } }
  | { type: 'START_CAPITAL_PROJECT'; payload: { project: any } }
  | { type: 'CONTRIBUTE_TO_PROJECT'; payload: { projectId: string; amount: number } }
  | { type: 'RENOVATE_FACILITY'; payload: { facilityKey: string; cost: number } }
  | { type: 'UPDATE_BUDGET_ALLOCATION'; payload: { category: 'marketing' | 'recruiting' | 'facilities' | 'staffDevelopment'; amount: number } }
  | { type: 'REQUEST_FUNDS'; payload: { type: FundRequest['type']; amount: number; reason: string } }
  | { type: 'ADVANCE_TO_DRAFT' };

export type DraftProspectSource = 'NCAA' | 'International';
export type DraftProspectCategory = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'international';

export interface DraftPick {
    pick: number;
    round: 1 | 2;
    player: Player | { name: string; id: string; position: string; height: number; overall: number; [key: string]: any };
    season: number;
    originalTeam: string;
    nbaTeam: string;
    slotTeam?: string;
    source: DraftProspectSource;
    originDescription: string;
}

export interface DraftPickAsset {
    id: string;
    year: number;
    round: 1 | 2;
    owner: string;
    note?: string;
    description: string;
    ruleId: string;
    sourceTeams: string[];
}

export interface InternationalProspect {
    id: string;
    player: Player;
    country: string;
    club: string;
    scoutingReport: string;
}

export interface DraftProspect {
    player: Player;
    originalTeam: string;
    source: DraftProspectSource;
    originDescription: string;
    category: DraftProspectCategory;
    score: number;
}

export interface NBATeamSimulation {
    name: string;
    conference: 'East' | 'West';
    rating: number;
    wins: number;
    losses: number;
    playoffFinish: number;
}

export interface NBASimulationResult {
    season: number;
    teams: NBATeamSimulation[];
    draftOrder: string[];
    champion: string;
}

export interface NBADraftHistoryEntry {
    season: number;
    picks: DraftPick[];
    nbaChampion: string;
    draftOrder: string[];
}

export type StaffRole = 'Assistant Coach' | 'Trainer' | 'Scout' | 'Offensive Coordinator' | 'Defensive Coordinator' | 'Recruiting Coordinator';
export type StaffGrade = 'A' | 'B' | 'C' | 'D';

export type StaffSpecialty = 
    | 'Offense: Motion' | 'Offense: Run & Gun' | 'Offense: Princeton' 
    | 'Defense: Pack Line' | 'Defense: Full Court Press' | 'Defense: 2-3 Zone' 
    | 'Scouting: High School' | 'Scouting: International' | 'Scouting: Transfer Portal'
    | 'Training: Strength' | 'Training: Conditioning' | 'Training: Recovery'
    | 'Recruiting: Pipelines' | 'Recruiting: Closers' | 'Recruiting: Talent ID';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  grade: StaffGrade;
  salary: number;
  description: string;
  contractLength: number;
  yearsRemaining: number;
  specialty: StaffSpecialty;
  chemistry?: number; // 0-100
  philosophy?: string;
}

export interface SponsorIncentive {
    id: string;
    description: string;
    reward: number;
    conditionType: 'wins' | 'tournament' | 'ranking' | 'rival';
    conditionTarget: number | string;
    status: 'pending' | 'completed' | 'failed';
}

export interface Sponsor {
    name: SponsorName;
    tier: SponsorTier;
    slogan?: string;
    color?: string;
    logoStyle?: 'Modern' | 'Classic' | 'Tech' | 'Bold';
    trust?: number; // 0-100
    incentives?: SponsorIncentive[];
    type: 'Apparel' | 'NamingRights' | 'OfficialPartner';
    isAlumniOwned?: boolean;
    syndicateBonus?: number; // Extra revenue multiplier if alumni sentiment is high
}


export interface SponsorOffer {
    sponsorName: Sponsor['name'];
    tier: SponsorTier;
    years: number;
    annualPayout: number;
    signingBonus: number;
    type: 'Apparel' | 'NamingRights' | 'OfficialPartner';
}

export interface Prices {
    ticketPrice: number;
    jerseyPrice: number;
    merchandisePrice: number; // General merch
    concessionFoodPrice: number;
    concessionDrinkPrice: number;
    parkingPrice: number;
}

export interface DynamicPricingRules {
    rivalryPremium: boolean;
    rankedPremium: boolean;
    cupcakeDiscount: boolean;
}

export interface Finances {
    // Revenue
    baseRevenue: number;
    gateRevenue: number;
    merchandiseRevenue: number;
    concessionsRevenue: number;
    parkingRevenue: number; // Keeping for legacy/completeness, though might be folded into "Game Day"
    donationRevenue: number;
    endowmentSupport: number;
    tournamentShare: number;
    sponsorPayout: number;
    broadcastRevenue: number; // New
    licensingRevenue: number; // New
    totalRevenue: number;

    // Expenses
    operationalExpenses: number;
    firedStaffSalaries: number;
    facilitiesExpenses: number; // Maintenance
    travelExpenses: number; // Detailed travel
    recruitingExpenses: number; // Detailed recruiting
    marketingExpenses: number; // Promo nights
    administrativeExpenses: number;
    staffPayrollExpenses: number;
    loanPayments: number;
    nilExpenses: number; // New: Portion of merch/collective
    ledger: FinancialTransaction[];

    // Summary
    netIncome: number;
    cashOnHand: number;
}

export type ConcessionType = 'Staple' | 'Premium';
export interface ConcessionItem {
    id: string;
    name: string;
    type: ConcessionType;
    costPerUnit: number;
    price: number;
    demandMultiplier: number; // 0.5 to 1.5
    supplierTier: 'Budget' | 'Standard' | 'Gourmet';
}

export type MerchStrategy = 'JustInTime' | 'Bulk';
export interface MerchItem {
    id: string;
    name: string;
    type: MerchTier;
    costPerUnit: number;
    price: number;
    inventory: number;
    demandMultiplier: number;
    inventoryStrategy: MerchStrategy;
    associatedPlayerId?: string; // For jerseys
    nilCutPercentage?: number; // 0-100
}

export interface TicketZone {
    id: 'UpperDeck' | 'LowerBowl' | 'Club' | 'Courtside';
    name: string;
    capacity: number;
    price: number;
    attendance: number; // Last game
    dynamicPricing: {
        rivalryPremium: boolean; // +25%
        rankedPremium: boolean; // +15%
        cupcakeDiscount: boolean; // -20%
    };
}

export type TravelMethod = 'Bus' | 'Commercial' | 'Charter';
export type AccommodationTier = 'Budget' | 'Standard' | 'Luxury';

export interface TravelSettings {
    defaultMethod: TravelMethod;
    defaultAccommodation: AccommodationTier;
    // Overrides could be added later
}

export interface PromoEvent {
    id: string;
    name: string;
    cost: number;
    fanEffect: number; // Multiplier for attendance/atmosphere
    hypeEffect: number; // Momentum boost
    description: string;
}

export type ConcessionTier = 'Basic' | 'Standard' | 'Premium';
// Replaced by new ConcessionItem definition above


export interface DynamicPricingSettings {
    weekendMultiplier: number;
    weekdayMultiplier: number;
}

export interface ConcessionPricingSettings {
    priceBands: {
        base: number;
        premium: number;
    };
    bundleDiscount: number;
    dynamicPricing: DynamicPricingSettings;
}

export type MerchTier = 'Apparel' | 'Authentic';
// Replaced by new MerchItem definition above


export interface MerchPricingSettings {
    apparelMultiplier: number;
    authenticMultiplier: number;
    flashSaleActive: boolean;
    flashSaleDepth: number;
    playerSegmentBoost: number;
}

export interface ParkingConfig {
    generalPrice: number;
    vipPrice: number;
    tailgateFunding?: number; // Deprecated
    tailgateCulture: number;
    revenueSettings?: ParkingPricingSettings;
}

export interface ParkingPricingSettings {
    surgeMultiplier: number;
    earlyAccessPremium: number;
    amenityAddonPrice: number;
}

export interface BudgetAllocations {
    marketing: number; // Weekly spend
    recruiting: number; // Weekly spend
    facilities: number; // Weekly spend (Maintenance)
    staffDevelopment: number; // Weekly spend
}

export interface FundRequest {
    id: string;
    type: 'CharterFlights' | 'StaffBonus' | 'FacilityRush' | 'MarketingBlitz';
    amount: number;
    status: 'Pending' | 'Approved' | 'Denied';
    weekRequested: number;
    reason?: string;
}

export interface WarChest {
    discretionaryBudget: number;
    requests: FundRequest[];
}

export type BoardProfile = 'Balanced' | 'WinNow' | 'BusinessFirst' | 'Builder';

export type BoardMetricKey = 'wins' | 'postseason' | 'pipeline' | 'brand' | 'finances';

export interface BoardMetricResult {
    key: BoardMetricKey;
    label: string;
    weight: number; // 0-1
    score: number; // 0-100
    actual?: number;
    expected?: number;
    displayActual?: string;
    displayExpected?: string;
}

export interface JobSecurityMetrics {
    compositeScore: number; // 0-100
    goalsMet: number; // count of components that cleared the bar
    components: BoardMetricResult[];
    // Legacy fields (kept for save compatibility / older UI paths)
    winScore?: number;
    tourneyScore?: number;
    netIncomeScore?: number;
}

export interface BoardExpectations {
    targetWins: number;
    targetTourneyRound: string; // e.g., "Round of 32", "Sweet 16"
    targetNetIncome: number;
    targetRevenue: number; // New field
    targetJerseySales: number; // units/season (sum)
    targetDraftPicks: number; // expected drafted players/season
    targetAttendanceFillRate: number; // 0-1
    boardProfile: BoardProfile;
    weights: Record<BoardMetricKey, number>; // 0-1 weights (sum ~ 1)
    discretionaryFunds: number; // New field
    maxBudget: number;
    patience: number; // 0-100, starts high, decays with failure
    pressure: number; // 0-100, inverse of patience + recent failures
    jobSecurityStatus: 'Safe' | 'Warm' | 'Hot' | 'Fired';
    metrics?: JobSecurityMetrics; // Detailed breakdown
}

export interface PoachingOffer {
    id: string;
    teamName: string;
    prestige: number;
    salary: number;
    length: number;
    expiresWeek: number;
    type: 'Immediate' | 'NextSeason';
    buyout?: number;
}

export interface FinancialWeekRecord {
    week: number;
    revenue: number;
    expenses: number;
    profit: number;
    cash: number;
}

export interface ProgramWealth {
    endowmentScore: number; // 0-100 scale indicating long-term program resources
    donationLevel: number; // 0-100 current-season donor energy
    boosterPool: number; // abstract points coaches can convert into bonuses
    donorMomentum: number; // difference from last season for UI feedback
    boosterSentiment?: number; // 0-100 booster confidence in program direction
    boosterLiquidity?: number; // cash available for NIL/facilities/emergencies
    alumniNetwork?: {
        strength: number; // 0-100
        lastDonation: number;
        lastDonationSeason: number;
        lastDonationBreakdown?: { nil: number; facilities: number; endowment: number };
        lastPitchResult?: string;
    };
    boosterReasons?: string[]; // 1-3 short explainers for UI
}

export type NilNegotiationStatus = 'pending' | 'accepted' | 'declined';
export interface NilNegotiationCandidate {
    playerId: string;
    playerName: string;
    year: Player['year'];
    position: Player['position'];
    overall: number;
    draftProjection: DraftProjection;
    expectedNilValue: number;
    minimumAsk: number;
    prefersMultiYear: boolean;
    sponsorSubsidy: number;
    reason?: string;
    status: NilNegotiationStatus;
    acceptedAmount?: number;
    acceptedYears?: number;
}

export type CoachStyle = 'Offense' | 'Defense' | 'Player Development' | 'Recruiting' | 'Tempo' | 'Balanced';

export interface CoachDraftPick {
    season: number;
    player: string;
    team: string;
    nbaTeam: string;
    round: number;
    pick: number;
}

export interface CoachCareerStop {
    teamName: string;
    startSeason: number;
    endSeason?: number;
}

export interface HeadCoachProfile {
    name: string;
    age: number;
    almaMater: string;
    style: CoachStyle;
    reputation: number; // 0-100
    seasons: number;
    careerWins: number;
    careerLosses: number;
    seasonWins: number;
    seasonLosses: number;
    startSeason: number;
    draftedPlayers?: CoachDraftPick[];
    retired?: boolean;
    retiredSeason?: number;
    retiredReason?: string;
    lastTeam?: string;
    careerStops: CoachCareerStop[];
    history?: CoachSeasonRecord[];
    ncaaAppearances?: number;
    sweetSixteens?: number;
    finalFours?: number;
    championships?: number;
    contract?: { salary: number; yearsRemaining: number };
}

export interface ContractGoal {
    type: 'wins' | 'tournament' | 'netIncome';
    target: number;
    duration: number;
    description: string;
}

export interface CoachSeasonRecord {
    season: number;
    teamName: string;
    wins: number;
    losses: number;
    salary: number;
    achievements: string[];
    totalRevenue: number;
    projectedRevenue: number;
    operationalExpenses: number;
}

export interface CoachSkill {
    id: string;
    name: string;
    description: string;
    cost: number;
    level: number;
    maxLevel: number;
}

export interface Coach {
    name: string;
    age: number;
    almaMater: string;
    style: CoachStyle;
    startSeason: number;
    reputation: number; // 0-100
    careerEarnings: number;
    history: CoachSeasonRecord[];
    contract: CoachContract | null;
    failedContracts: number;
    playerAlumni: {
        [playerId: string]: {
            name: string;
            lastTeam: string;
            lastSeason: number;
        };
    };
    currentLeague?: 'NCAA' | 'NBA';
    currentNBATeam?: string | null;
    draftedPlayers?: CoachDraftPick[];
    xp: number;
    level: number;
    skillPoints: number;
    skills: Record<string, number>; // Map of unlocked skill IDs to their level
    careerStops: CoachCareerStop[];
}

export interface CoachContract {
    teamName: string;
    yearsRemaining: number;
    initialPrestige: number;
    expectations: BoardExpectations; // Replaces 'goal'
    progress: {
        wins: number;
        tournamentAppearances: number;
        netIncome: number;
    };
    yearPerformance: ('Met' | 'Missed')[];
    salary: number;
    goal?: ContractGoal;
}


export type AlumniArchetype = 'Tech' | 'Finance' | 'Local' | 'Political' | 'Health' | 'Arts' | 'Titan';

export interface AlumniProfile {
    id: string;
    name: string;
    graduationSeason: number;
    profession: string;
    prestigeAtGrad: number;
    achievements: string[];
    proStatus: 'drafted' | 'overseas' | 'pro_success' | 'retired_pro' | 'none';
    donationTier: 'none' | 'low' | 'medium' | 'high';
    sentiment: number;
    archetype: AlumniArchetype;
    nbaTeam?: string;
    careerEarnings?: number;
    position?: string;
}

export interface AlumniInfluence {
    recruitingBonus: { [state: string]: number }; // e.g., "TX": 0.20
    mediaProtection: number; // 0-100
    facilitySpeed: number; // 0-100 (percentage faster)
    scoutingEfficiency: number; // 0-100
    endowmentYield: number; // 0-100 (percentage bonus)
    academicPrestigeBonus: number; // 0-100
    jobSecurityBonus: number; // 0-100
    medicalEfficiency: number; // 0-100 (Health impact)
    fanAppeal: number; // 0-100 (Arts impact)
    titanBonus: number; // 0-100 (Ultra-wealth impact)
}

export interface EquityPool {
    id: string; // 'momentum', 'endowment', 'moonshot'
    name: string;
    balance: number;
    target: number;
    status: 'active' | 'completed' | 'locked';
    payoutType: 'cash' | 'facility' | 'interest';
}

export interface DonorDilemma {
    id: string;
    title: string;
    description: string;
    archetype: AlumniArchetype;
    options: {
        label: string;
        effectDescription: string;
        consequences: {
            budget?: number;
            chemistry?: number;
            integrity?: number;
            alumniSentiment?: number;
            staffMorale?: number;
            staffLoyalty?: number;
            facilitySpeed?: number;
            travelFatigue?: number;
            scoutingEfficiency?: number;
            winProbability?: number;
            prestige?: number;
            donorMomentum?: number;
        };
    }[];
}

export interface AlumniRegistry {
    summaryStats: {
        countsPerProfession: { [profession: string]: number };
        donationMomentum: number;
        notableAlumni: string[];
    };
    allAlumni: AlumniProfile[];
    equityPools: EquityPool[];
    activeInfluence: AlumniInfluence;
    activeDilemma?: DonorDilemma;
}

export type InstitutionalProfile = {
  unitid: string | null;
  prestigeAcademicFinal: number | null;
  prestigeAcademicBase: number | null;
  alumniHalo: number | null;
  nilPotentialScore: number | null;
  marketSizeScore: number | null;
  affluenceScore: number | null;
  archetypeWeights: Record<string, number> | null;
  undergradEnrollment: number | null;
  pctPell: number | null;
  pctFederalLoan: number | null;
  retentionFt4: number | null;
  completionRate150pct4yr: number | null;
  medianEarnings10yr: number | null;
  gradDebtMedian: number | null;
  cityPopulation: number | null;
  cityMedianHouseholdIncome: number | null;
  countyPopulation: number | null;
  countyMedianHouseholdIncome: number | null;
  marketBasis: string | null;
};

export interface Team {
  name: string;
  conference: string;
  prestige: number;
  recruitingPrestige: number;
  roster: Player[];
  staff: {
    assistants: Staff[];
    trainers: Staff[];
    scouts: Staff[];
  };
  record: {
    wins: number;
    losses: number;
  };
  playoffFinish?: number;
  isUserTeam?: boolean;
  sponsor: Sponsor;
  sponsorRevenue: SponsorRevenue;
  sponsorContractYearsRemaining: number;
  sponsorContractLength: number;
  sponsorOffers: SponsorOffer[];
  fanInterest: number;
  prices: Prices;
  finances: Finances;
  wealth: ProgramWealth;
  headCoach: HeadCoachProfile;
  pipelineStates: string[];
  pipelines?: Pipeline[];
  facilities?: {
    arena: ArenaFacility;
    medical?: MedicalFacility;
    training?: TrainingFacility;
    scouting?: ScoutingFacility;
    coaching?: CoachingFacility;
    academic?: AcademicFacility;
    nutrition?: NutritionFacility;
    housing?: HousingFacility;
  };
  initialProjectedRevenue?: Finances;
  playerFocusId?: string | null;
  teamCaptainId?: string | null;
  nilBudget?: number;
  nilBudgetUsed?: number;
  nilBoostFromSponsor?: number;
  nilCollective?: NilCollectiveProfile;
  sponsorQuests?: SponsorQuest[];
  eventCalendar?: ScheduledEvent[];
  pendingBroadcastOffers?: BroadcastOffer[];
  broadcastDeal?: BroadcastDeal | null;
  licensingDeals?: LicensingContract[];
  pendingLicensingOffers?: LicensingContract[];
  budget?: {
    cash: number;
    allocations: BudgetAllocations;
  };
  loans?: Loan[];
  activeCampaigns?: MarketingCampaign[];
  concessions: {
    tier: ConcessionTier;
    signatureItem?: string;
    alcoholPolicy: boolean;
    items: ConcessionItem[];
    pricing?: ConcessionPricingSettings;
  };
  merchandising: {
    inventoryStrategy: 'Conservative' | 'Aggressive' | 'JustInTime' | 'Bulk';
    jerseySales: Record<string, number>; // playerId to sales
    items: MerchItem[];
    pricing?: MerchPricingSettings;
    nilSplit?: number; // 0-100% of jersey revenue goes to players
  };
  parking: ParkingConfig;
  boardExpectations?: BoardExpectations;
  warChest?: WarChest;
  financialHistory?: FinancialWeekRecord[];
  fanMorale?: number;
  alumniRegistry?: AlumniRegistry;
  chemistry?: number; // 0-100
  scoutingReports?: { [recruitId: string]: number }; // level 0-3
  institutionalProfile?: InstitutionalProfile;
  
  // Economy Overhaul Fields
  ticketZones?: TicketZone[];
  travelSettings?: TravelSettings;
  activePromos?: PromoEvent[]; // For the upcoming game

  // NBA Specifics
  league?: League;
  division?: string;
  salaryCapSpace?: number;
  luxuryTaxBill?: number;
  state: string;
  playbookFamiliarity: number;
  nbaAffiliate?: string | null;
  activeCapitalProjects?: CapitalProject[];
  nbaCapState?: CapState;
  lastCutWeek?: number;
}

export interface CapitalProject {
    id: string;
    name: string;
    type: 'Arena' | 'Training' | 'Medical' | 'Scouting' | 'Coaching' | 'Academic' | 'Nutrition' | 'Housing';
    description: string;
    totalCost: number;
    fundsAllocated: number;
    status: 'Planning' | 'Construction' | 'Completed';
    weeksRemaining: number;
    benefitDescription: string;
    newLevel: number;
}

export interface JobOffer {
    id?: string;
    teamName: string;
    prestige: number;
    salary: number;
    length: number;
    conference?: string;
    expectations?: BoardExpectations;
    yearPerformance?: ('Met' | 'Missed')[];
}

export interface GameResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  played: boolean;
  isPlayoffGame?: boolean;
  day?: number;
  date?: ISODate;
  gameEventId?: string;
}

export interface PlayerGameStatsData {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    minutes: number;
}

export interface GamePlayerStats {
    playerId: string;
    name: string;
    pos: string;
    stats: PlayerGameStatsData;
}



export type PlayByPlayEvent = {
    type: 'score' | 'rebound' | 'assist' | 'turnover' | 'steal' | 'block' | 'foul' | 'foulFT' | 'substitution' | 'timeout' | 'game_end';
    text: string;
    player?: string;
    team?: string;
    timeRemaining?: number;
};

export interface GameBoxScore {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    homeTeamStats: GamePlayerStats[];
    awayTeamStats: GamePlayerStats[];
    playByPlay: PlayByPlayEvent[];
}


export interface TournamentMatchup extends GameResult {
    id: string;
    homeSeed: number;
    awaySeed: number;
    round: number;
    region: TournamentRegionName;
}

export type TournamentRegionName = 'West' | 'East' | 'South' | 'Midwest';

export interface Tournament {
    firstFour: TournamentMatchup[];
    regions: Record<TournamentRegionName, TournamentMatchup[][]>; // Each region has its own rounds [R64, R32, S16, E8]
    finalFour: TournamentMatchup[];
    championship: TournamentMatchup | null;
    champion: string | null;
}

export interface GameAttendanceRecord {
    gameId?: string;
    opponent: string;
    attendance: number;
    capacity?: number;
    revenue: number;
    simulated?: boolean;
    week?: number;
    segmentData?: {
        key: SeatSegmentKey;
        revenue: number;
        attendance: number;
        price: number;
    }[];
}

export type SeatSegmentKey = 'lowerBowl' | 'upperBowl' | 'studentSection' | 'suites';

export interface SeatSegment {
    capacity: number;
    priceModifier: number;
    dynamicPricing?: {
        rivalryPremium: boolean;
        rankedPremium: boolean;
        cupcakeDiscount: boolean;
    };
}

export type SeatMix = Record<SeatSegmentKey, SeatSegment>;

export type FacilityUpgradeType = 'capacity' | 'luxury' | 'quality' | 'equipment' | 'network' | 'technology' | 'tutor' | 'dining' | 'housing';

export interface BaseFacility {
    level: number; // 1-5
    quality: number; // 0-100
    constructionWeeksRemaining?: number;
    pendingLevel?: number;
    maintenanceCost: number;
}

export interface ArenaFacility extends BaseFacility {
    name: string;
    capacity: number;
    luxurySuites: number;
    seatMix: SeatMix;
    attendanceLog: GameAttendanceRecord[];
}

export interface AcademicFacility extends BaseFacility {
    tutorQuality: number; // 1-10
}

export interface NutritionFacility extends BaseFacility {
    diningQuality: number; // 1-10
}

export interface HousingFacility extends BaseFacility {
    luxuryLevel: number; // 1-10
}

export interface MedicalFacility extends BaseFacility {}

export interface TrainingFacility extends BaseFacility {
    equipmentLevel: number; // 1-10
}

export interface ScoutingFacility extends BaseFacility {
    networkReach: number; // 0-100
}

export interface CoachingFacility extends BaseFacility {
    technologyLevel: number; // 1-10
}

export interface Loan {
    id: string;
    principal: number;
    interestRate: number; // Annual rate (e.g., 0.05 for 5%)
    termMonths: number;
    monthsRemaining: number;
    monthlyPayment: number;
    originalAmount: number;
}

export type MarketingCampaignType = 'Student Rush' | 'Local Business Partnership' | 'Social Media Blitz' | 'Community Day' | 'National TV Spot' | 'Influencer Campaign';

export interface MarketingCampaign {
    id: string;
    type: MarketingCampaignType;
    cost: number;
    durationWeeks: number;
    weeksRemaining: number;
    startWeek: number;
    active: boolean;
    impactMultiplier: number; // Multiplier for attendance/revenue
    targetDemographic?: string;
}

export type FanArchetype = 'diehard' | 'casual' | 'value' | 'status' | 'booster';

export interface AttendanceForecastSegment {
    key: SeatSegmentKey;
    filled: number;
    capacity: number;
    price?: number;
    fairPrice?: number;
    fillRate?: number;
    rollingAverageFillRate?: number;
    demandScore?: number;
    confidenceScore?: number;
    mix?: Partial<Record<FanArchetype, number>>;
}

export interface AttendanceForecast {
    attendance: number;
    capacity: number;
    revenue: number;
    segments: AttendanceForecastSegment[];
    tags: string[];
    rollingAverage?: number;
    signals: string[];
}

export type NilCollectiveTier = 'local' | 'regional' | 'national' | 'elite';

export interface NilCollectiveProfile {
    id: string;
    tier: NilCollectiveTier;
    reputation: number;
    baseBudget: number;
    sponsorMatch: number;
    alumniContribution: number;
    updatedWeek: number;
}

export type SponsorQuestStatus = 'available' | 'active' | 'completed';

export interface SponsorQuest {
    id: string;
    sponsor: SponsorName;
    title: string;
    description: string;
    type: 'attendance' | 'wins' | 'media' | 'nil' | 'alumni';
    target: number;
    progress: number;
    rewardCash: number;
    status: SponsorQuestStatus;
    expiresWeek: number;
    isAlumniOwned?: boolean;
}

export interface EventPlaybookEntry {
    id: string;
    label: string;
    cost: number;
    effect: 'attendance' | 'sentiment' | 'nil' | 'recruiting';
    modifier: number;
    description?: string;
    requirements?: {
        prestige?: number;
        professionCount?: number;
    };
    professionBoost?: string;
    suiteImpact?: number;
}

export type ScheduledEventStatus = 'pending' | 'resolved' | 'cancelled';

export interface ScheduledEvent {
    id: string;
    playbookId: string;
    week: number;
    opponent: string;
    status: ScheduledEventStatus;
}





export interface EconomyTelemetry {
    attendanceDeltas: number[];
    nilSpendEfficiency: number[];
    completedQuests: string[];
    eventFeed: EconomyEventFeedItem[];
}

export interface ParkingPricingSettings {
    surgeMultiplier: number;
    earlyAccessPremium: number;
    amenityAddonPrice: number;
}

export interface BroadcastDeal {
    id: string;
    partner: string;
    annualValue: number;
    exposureBonus: number;
    startSeason: number;
    endSeason: number;
}

export interface LicensingContract {
    id: string;
    partner: string; // e.g., "EA Sports", "Nike", "Topps"
    category: 'Video Game' | 'Apparel' | 'Collectibles';
    upfrontPayment: number;
    royaltyRate: number; // 0.0 to 1.0
    duration: number; // years
}

export interface BroadcastOffer extends BroadcastDeal {
    expiresWeek?: number;
}

export interface EconomyEventFeedItem {
    id: string;
    type: 'attendance' | 'nil' | 'event' | 'broadcast' | 'quest' | 'revenue';
    message: string;
    timestamp: number;
    value?: number;
}

export interface FinancialTransaction {
    id: string;
    date: string; // e.g., "Week 5, Season 2024"
    week: number;
    season: number;
    description: string;
    category: 'Revenue' | 'Expense' | 'Debt' | 'Capital' | 'Income' | 'Game Day Revenue' | 'Staff Expenses' | 'NIL' | 'Legal' | string;
    amount: number;
    runningBalance: number;
}

export interface UserSeasonRecord {
    season: number;
    teamName: string;
    wins: number;
    losses: number;
    rank: number;
    prestige: number;
    totalRevenue: number;
    operationalExpenses: number;
    projectedRevenue: number;
    gameAttendance: GameAttendanceRecord[];
    tournamentResult: string;
    postseasonResult?: string;
    regularSeasonWins?: number;
    regularSeasonLosses?: number;
    postseasonWins?: number;
    postseasonLosses?: number;
}

export interface TeamHistory {
    season: number;
    prestige: number;
    rank: number;
    totalRevenue: number;
    projectedRevenue: number;
    wins?: number;
    losses?: number;
    regularSeasonWins?: number;
    regularSeasonLosses?: number;
    postseasonWins?: number;
    postseasonLosses?: number;
    postseasonResult?: string;
}

export interface ChampionRecord {
    season: number;
    teamName: string;
    wins: number;
    losses: number;
    runnerUpTeamName?: string;
}

export interface NBATransaction {
    id: string;
    week: number;
    season: number;
    type: 'Trade' | 'Signing' | 'Cut' | 'Draft' | 'Re-Signing' | 'Extension';
    description: string;
    teamName: string;
    relatedTeamName?: string;
    playerIds: string[];
}

export type NBAFreeAgentReason = 'Cut' | 'Expired' | 'Undrafted';

export interface NBAFreeAgent {
    player: Player;
    reason: NBAFreeAgentReason;
    previousTeam?: string;
    seasonAdded: number;
    weekAdded?: number;
}

export enum EventType {
    GAME = 'GAME',
    PRACTICE = 'PRACTICE',
    RECRUITING = 'RECRUITING',
    TRAINING = 'TRAINING',
    SEASON_TRANSITION = 'SEASON_TRANSITION',
    SIGNING_DAY = 'SIGNING_DAY',
    TOURNAMENT_ROUND = 'TOURNAMENT_ROUND',
    NBA_GAME = 'NBA_GAME',
    NBA_DRAFT = 'NBA_DRAFT',
    OFFSEASON_TASK = 'OFFSEASON_TASK'
}

export interface GameEvent {
    id: string;
    type: EventType;
    date: ISODate;
    label: string;
    payload?: any;
    processed: boolean;
}

export type ScheduledGameType = 'REG' | 'CONF_TOURNEY' | 'NCAA';

export interface ScheduledGameEvent {
    id: string;
    seasonYear: number; // start year, e.g. 2025 for 2025–26
    date: ISODate; // canonical
    type: ScheduledGameType;
    homeTeamId: string;
    awayTeamId: string;
    neutralSite?: boolean;
    conferenceId?: string;
    round?: string;
    locked?: boolean;
}

export interface TeamSchedule {
    teamId: string;
    gamesByDate: Record<ISODate, string>; // date -> ScheduledGameEvent.id
}

export interface SeasonAnchors {
    seasonYear: number;
    seasonStart: ISODate;
    regularSeasonEnd: ISODate;
    confTourneyStart: ISODate;
    confTourneyEnd: ISODate;
    selectionSunday: ISODate;
    ncaa: {
        firstFourTue: ISODate;
        firstFourWed: ISODate;
        r64Thu: ISODate;
        r64Fri: ISODate;
        r32Sat: ISODate;
        r32Sun: ISODate;
        s16Thu: ISODate;
        s16Fri: ISODate;
        e8Sat: ISODate;
        e8Sun: ISODate;
        finalFourSat: ISODate;
        titleMon: ISODate;
    };
}

export interface GameState {
    version: number;
    eventQueue: GameEvent[];
    status: GameStatus;
    previousStatus?: GameStatus | null;
    userTeam: Team | null;
  allTeams: Team[];
  recruits: Recruit[];
  season: number;
  seasonYear: number;
  seasonAnchors: SeasonAnchors;
  currentDate: ISODate;
  gameInSeason: number;
  week: number;
  schedule: GameResult[][];
  scheduledGamesById: Record<string, ScheduledGameEvent>;
  teamSchedulesById: Record<string, TeamSchedule>;
  scheduledEventIdsByDate: Record<ISODate, string[]>;
  contactsMadeThisWeek: number;
  trainingPointsUsedThisWeek: number;
  lastSimResults: GameResult[];
  lastSimWeekKey: string | null;
  seasonEndSummary: string[];
  signingDaySummary: string[];
  draftResults: DraftPick[];
  signingPeriodDay: number;
  transferPortalDay?: number; // Deprecated in favor of transferPortal object
  portalPlayers?: Transfer[]; // Deprecated in favor of transferPortal object
  transferPortal?: TransferPortalState;
  internationalProspects: InternationalProspect[];
  currentNBASimulation: NBASimulationResult | null;
  rosterRolledOver: boolean;
  offSeasonAdvanced: boolean;
  mockDraftProjections: Record<number, string>; // Pick Number -> Team Name
  mockDraftProjectionDiffs: { [playerId: string]: number };
  mockDraftBoard: DraftProspect[];
  customDraftPickRules: DraftPickRule[];
  nbaDraftPickAssets: DraftPickAsset[];
  trainingFocuses: {
      pg: keyof Player['stats'] | null;
      sg_sf: keyof Player['stats'] | null;
      pf_c: keyof Player['stats'] | null;
  };
  trainingSummary: string[];
  rotationPreference: RotationPreference;
  autoTrainingEnabled: boolean;
  autoTrainingLog: string[];
  tournament: Tournament | null;
  history: {
      userTeamRecords: UserSeasonRecord[];
      champions: ChampionRecord[];
      teamHistory: { [teamName: string]: TeamHistory[] };
      nbaDrafts: NBADraftHistoryEntry[];
  };
  retiredCoaches: HeadCoachProfile[];
  gameLogs: GameBoxScore[];
  selectedGameLog: GameBoxScore | null;
  postSeasonResolved: boolean;
  sponsors: { [key: string]: SponsorData };
  currentUserTeamAttendance: GameAttendanceRecord[];
  sponsorQuestDeck: SponsorQuest[];
  eventPlaybookCatalog: EventPlaybookEntry[];
  economyTelemetry: EconomyTelemetry;
  toastMessage: string | null;
  seasonRecapData: {
      record: string;
      tournamentResult: string;
      signings: Recruit[];
      drafted: DraftPick[];
      prestigeChange: number;
      totalRevenue: number;
      projectedRevenue: number;
      coachReputation: number;
      coachReputationChange: number;
      cpi?: {
          compositeScore: number; // 0-100
          status: BoardExpectations['jobSecurityStatus'];
          boardProfile: BoardProfile;
          components: BoardMetricResult[];
      };
  } | null;
  coach: Coach | null;
  jobOffers: JobOffer[] | null;
  pendingJobOffer: JobOffer | null;
  activePoachingOffer?: PoachingOffer | null;
  poachingOffers: PoachingOffer[]; // New field
  nbaJobOffers?: string[] | null;
  nbaCoachTeam?: string | null;
  nbaHistoryTab?: 'drafts' | 'standings' | 'rosters' | 'stats' | 'transactions' | 'freeAgency';
  historyTab?: 'myCareer' | 'teamRecords' | 'nationalRankings' | 'nba' | 'coachDirectory';
  nbaCoachContract?: CoachContract | null;
  nbaSeason?: number;
  nbaRecord?: { wins: number; losses: number };
      nbaSchedule?: GameResult[][];
      nbaFreeAgents?: NBAFreeAgent[]; 
      nbaTransactions?: NBATransaction[];
      updatedNBATeams?: Team[];
      releasedPlayers?: Player[];
      simulation?: NBASimulationResult;
      undraftedFreeAgents?: Player[];
      pool?: Transfer[];
      transactions?: NBATransaction[];
      gameOverReason: string | null;  contractReviewData: {
      goalMet: boolean;
      wins: number;
      tournamentAppearances: number;
      revenue: number;
      adDecision: 'renew' | 'fire';
  } | null;
  freeAgentStaff: {
    assistants: Staff[];
    trainers: Staff[];
    scouts: Staff[];
  } | null;
  pendingStaffRenewals: PendingStaffRenewal[];
  nilNegotiationCandidates: NilNegotiationCandidate[];
  nilNegotiationHistory: string[];
  nilPhaseComplete?: boolean;
  transferPortalComplete?: boolean;
  // NBA Mode
  nbaTeams: Team[];

    previousTeamName?: string;
    nbaPlayoffs?: NBAPlayoffs | null;
    selectedNBATeam?: Team | NBATeamSimulation | null;
  }

export type RosterPositions = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type TrainingFocuses = {
    pg: keyof Player['stats'];
    sg_sf: keyof Player['stats'];
    pf_c: keyof Player['stats'];
};


export type League = 'NCAA' | 'NBA';

export interface PlayerContract {
    salary: number;
    yearsLeft: number;
    type: 'Guaranteed' | 'Two-Way' | 'Exhibit-10' | 'Rookie Scale';
    signingYear?: number;
    yearlySalaries?: number[];
}

export const NBA_SALARY_CAP_2025 = 154647000;
export const NBA_LUXURY_TAX_THRESHOLD_2025 = 187895000;
export const NBA_MINIMUM_SALARY = 1270000;

export interface NBAPlayoffMatchup extends GameResult {
    homeSeed: number;
    awaySeed: number;
    seriesScore: { home: number; away: number };
}

export interface NBAPlayoffs {
    firstRound: NBAPlayoffMatchup[];
    conferenceSemis: NBAPlayoffMatchup[];
    conferenceFinals: NBAPlayoffMatchup[];
    finals: NBAPlayoffMatchup | null;
    champion: string | null;
}

export interface PendingStaffRenewal {
    staffId: string;
    role: 'assistants' | 'trainers' | 'scouts';
    name: string;
    grade: StaffGrade;
    currentSalary: number;
    yearsOffered: number;
}

export interface NBATeamSimulation {
    name: string;
    conference: 'East' | 'West';
    rating: number;
    wins: number;
    losses: number;
    playoffFinish: number; // 0=Champ, 1=Finals, 2=ConfFinals, 3=Semis, 4=FirstRound, 5=Missed
}

export interface NBASimulationResult {
    season: number;
    teams: NBATeamSimulation[];
    draftOrder: string[];
    champion: string;
}

export interface NBAContractProfile {
    salary: number;
    yearsLeft: number;
    yearlySalaries: number[];
}
