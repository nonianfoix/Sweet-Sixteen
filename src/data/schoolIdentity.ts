// School Identity Constants for NIL Budget Calculation
// These multipliers reflect real-world NIL advantages based on school characteristics

import type { SponsorName } from '../types';

// ============================================
// RELIGIOUS SCHOOL NIL MULTIPLIERS
// ============================================
export const RELIGIOUS_NIL_MULTIPLIERS: Record<string, number> = {
  // Mormon (tithing culture = consistent giving)
  'BYU': 1.50,
  
  // Catholic (Notre Dame effect)
  'Notre Dame': 1.40,
  'Gonzaga': 1.30,
  'Villanova': 1.25,
  'Georgetown': 1.20,
  'Marquette': 1.15,
  'St. Johns': 1.10,
  'Creighton': 1.10,
  'Providence': 1.10,
  'Seton Hall': 1.08,
  'DePaul': 1.05,
  
  // Southern Baptist
  'Baylor': 1.15,
  'Wake Forest': 1.10,
  'TCU': 1.08,
  'SMU': 1.05,
};

// ============================================
// IVY LEAGUE NIL BONUSES (Finance/Tech/Consulting Alumni)
// ============================================
export const IVY_LEAGUE_NIL_BONUS: Record<string, number> = {
  'Harvard': 2.00,
  'Penn': 1.90,
  'Yale': 1.80,
  'Princeton': 1.75,
  'Columbia': 1.70,
  'Cornell': 1.50,
  'Brown': 1.40,
  'Dartmouth': 1.35,
};

// ============================================
// FLAGSHIP STATE NIL BONUSES (Massive Alumni Bases)
// ============================================
export const FLAGSHIP_STATE_NIL_BONUS: Record<string, number> = {
  'Texas': 1.60,
  'Michigan': 1.50,
  'Ohio State': 1.45,
  'Penn State': 1.35,
  'Florida': 1.30,
  'Georgia': 1.25,
  'Alabama': 1.25,
  'LSU': 1.20,
  'Auburn': 1.15,
  'Tennessee': 1.15,
  'South Carolina': 1.10,
  'Wisconsin': 1.10,
  'Iowa': 1.10,
  'Nebraska': 1.10,
};

// ============================================
// BLUE BLOOD BASKETBALL NIL BONUSES
// ============================================
export const BLUE_BLOOD_BASKETBALL_BONUS: Record<string, number> = {
  'Duke': 1.50,
  'Kentucky': 1.40,
  'Kansas': 1.35,
  'North Carolina': 1.35,
  'UCLA': 1.30,
  'Indiana': 1.20,
  'UConn': 1.15,
  'Louisville': 1.10,
  'Syracuse': 1.08,
  'Michigan State': 1.08,
  'Arizona': 1.05,
  'Villanova': 1.05,
};

// ============================================
// HBCU NIL BONUSES (Community Loyalty)
// ============================================
export const HBCU_NIL_BONUS: Record<string, number> = {
  'Howard': 1.15,
  'Hampton': 1.10,
  'North Carolina A&T': 1.08,
  'Florida A&M': 1.08,
  'Grambling State': 1.05,
  'Jackson State': 1.10, // Deion effect
  'Morgan State': 1.05,
  'Texas Southern': 1.05,
  'Prairie View A&M': 1.03,
};

// ============================================
// ELITE SPONSOR PARTNERSHIPS
// Schools with "forever" relationships with their sponsor
// ============================================
export const ELITE_SPONSOR_PARTNERSHIPS: Record<string, {
  sponsor: SponsorName;
  affinityScore: number;      // 0-100 (Duke/Nike = 95)
  nilPoolMultiplier: number;  // 1.0-2.0x sponsor NIL contribution
  switchingCost: number;      // How hard it is to change sponsors (0-1)
}> = {
  // NIKE ELITE
  'Duke': { sponsor: 'Nike', affinityScore: 95, nilPoolMultiplier: 1.8, switchingCost: 0.9 },
  'Oregon': { sponsor: 'Nike', affinityScore: 98, nilPoolMultiplier: 2.0, switchingCost: 0.95 },
  'Kentucky': { sponsor: 'Nike', affinityScore: 90, nilPoolMultiplier: 1.7, switchingCost: 0.85 },
  'Ohio State': { sponsor: 'Nike', affinityScore: 88, nilPoolMultiplier: 1.6, switchingCost: 0.80 },
  'Texas': { sponsor: 'Nike', affinityScore: 85, nilPoolMultiplier: 1.5, switchingCost: 0.75 },
  'Alabama': { sponsor: 'Nike', affinityScore: 85, nilPoolMultiplier: 1.5, switchingCost: 0.75 },
  'USC': { sponsor: 'Nike', affinityScore: 82, nilPoolMultiplier: 1.4, switchingCost: 0.70 },
  'Arizona': { sponsor: 'Nike', affinityScore: 80, nilPoolMultiplier: 1.3, switchingCost: 0.65 },
  'Syracuse': { sponsor: 'Nike', affinityScore: 78, nilPoolMultiplier: 1.2, switchingCost: 0.60 },
  
  // JORDAN ELITE (Nike subsidiary but separate brand identity)
  'North Carolina': { sponsor: 'Jordan', affinityScore: 99, nilPoolMultiplier: 2.0, switchingCost: 0.99 },
  'Michigan': { sponsor: 'Jordan', affinityScore: 90, nilPoolMultiplier: 1.8, switchingCost: 0.85 },
  'Florida': { sponsor: 'Jordan', affinityScore: 85, nilPoolMultiplier: 1.5, switchingCost: 0.75 },
  'UCLA': { sponsor: 'Jordan', affinityScore: 88, nilPoolMultiplier: 1.6, switchingCost: 0.80 },
  'Georgetown': { sponsor: 'Jordan', affinityScore: 92, nilPoolMultiplier: 1.7, switchingCost: 0.90 },
  
  // ADIDAS ELITE
  'Kansas': { sponsor: 'Adidas', affinityScore: 95, nilPoolMultiplier: 1.9, switchingCost: 0.90 },
  'Louisville': { sponsor: 'Adidas', affinityScore: 88, nilPoolMultiplier: 1.6, switchingCost: 0.80 },
  'Indiana': { sponsor: 'Adidas', affinityScore: 85, nilPoolMultiplier: 1.5, switchingCost: 0.75 },
  'Miami': { sponsor: 'Adidas', affinityScore: 80, nilPoolMultiplier: 1.4, switchingCost: 0.70 },
  'Nebraska': { sponsor: 'Adidas', affinityScore: 78, nilPoolMultiplier: 1.3, switchingCost: 0.65 },
  'Texas A&M': { sponsor: 'Adidas', affinityScore: 82, nilPoolMultiplier: 1.4, switchingCost: 0.70 },
  
  // UNDER ARMOUR ELITE
  'Notre Dame': { sponsor: 'Under Armour', affinityScore: 90, nilPoolMultiplier: 1.8, switchingCost: 0.85 },
  'Auburn': { sponsor: 'Under Armour', affinityScore: 85, nilPoolMultiplier: 1.5, switchingCost: 0.75 },
  'Maryland': { sponsor: 'Under Armour', affinityScore: 92, nilPoolMultiplier: 1.9, switchingCost: 0.90 },
  'Wisconsin': { sponsor: 'Under Armour', affinityScore: 82, nilPoolMultiplier: 1.4, switchingCost: 0.70 },
};

// ============================================
// SPONSOR PIPELINE STATES
// States where each sponsor has strong AAU/grassroots presence
// ============================================
export const SPONSOR_PIPELINE_STATES: Record<SponsorName, {
  strongholdStates: string[];     // Dominant presence
  competitiveStates: string[];    // Active presence
  nilBoostInState: number;        // 1.0-1.3x NIL offer boost for recruits from these states
}> = {
  'Nike': {
    strongholdStates: ['California', 'Texas', 'Florida', 'Georgia'],
    competitiveStates: ['Illinois', 'Ohio', 'New York', 'Virginia', 'North Carolina'],
    nilBoostInState: 1.25,
  },
  'Jordan': {
    strongholdStates: ['North Carolina', 'Maryland', 'Florida'],
    competitiveStates: ['Georgia', 'Virginia', 'New York', 'Michigan'],
    nilBoostInState: 1.20,
  },
  'Adidas': {
    strongholdStates: ['Indiana', 'Kansas', 'Kentucky', 'New York'],
    competitiveStates: ['California', 'Texas', 'Illinois', 'New Jersey'],
    nilBoostInState: 1.20,
  },
  'Under Armour': {
    strongholdStates: ['Maryland', 'Indiana', 'Alabama'],
    competitiveStates: ['Texas', 'Georgia', 'Pennsylvania', 'Wisconsin'],
    nilBoostInState: 1.15,
  },
  'Puma': {
    strongholdStates: ['New York'],
    competitiveStates: ['California', 'Florida'],
    nilBoostInState: 1.10,
  },
  'New Balance': {
    strongholdStates: ['Massachusetts'],
    competitiveStates: ['Connecticut', 'New York'],
    nilBoostInState: 1.10,
  },
  'Reebok': {
    strongholdStates: [],
    competitiveStates: ['Massachusetts', 'New York'],
    nilBoostInState: 1.05,
  },
};

// ============================================
// AAU PROGRAM NAMES BY SPONSOR
// For flavor text in recruit cards
// ============================================
export const AAU_PROGRAMS_BY_SPONSOR: Record<SponsorName, string[]> = {
  'Nike': ['City Reapers', 'Drive Nation', 'Team Takeover', 'MeanStreets', 'Oakland Soldiers', 'Compton Magic', 'Houston Hoops', 'Georgia Stars'],
  'Jordan': ['Team CP3', 'Team Penny', 'Carolina Wolves', 'Team Melo'],
  'Adidas': ['Mass Rivals', 'Indiana Elite', 'Dream Vision', 'MoKan Elite', 'Phenom University', 'Expressions Elite'],
  'Under Armour': ['DC Premier', 'Indy Hoosiers', 'Canada Elite', 'NY Lightning', 'Boo Williams'],
  'Puma': ['NY Renaissance', 'West Coast Elite'],
  'New Balance': ['Boston AAU Elite', 'New England Playaz'],
  'Reebok': ['Classic Elite', 'Legacy Basketball'],
};

// ============================================
// PROFESSION WEIGHTS FOR ALUMNI WEALTH CALCULATION
// $ contribution per alumnus in each profession
// ============================================
export const PROFESSION_WEALTH_WEIGHTS: Record<string, number> = {
  'Finance': 50000,
  'Tech': 45000,
  'Law': 40000,
  'Medicine': 35000,
  'Entrepreneur': 60000,
  'Business': 30000,
  'Coaching': 5000,
  'Media': 20000,
  'Education': 5000,
  'Public Service': 5000,
  'Arts': 10000,
};

// ============================================
// Helper: Get combined school identity multiplier
// ============================================
export const getSchoolIdentityMultiplier = (schoolName: string): number => {
  let multiplier = 1.0;
  
  if (RELIGIOUS_NIL_MULTIPLIERS[schoolName]) {
    multiplier *= RELIGIOUS_NIL_MULTIPLIERS[schoolName];
  }
  if (IVY_LEAGUE_NIL_BONUS[schoolName]) {
    multiplier *= IVY_LEAGUE_NIL_BONUS[schoolName];
  }
  if (FLAGSHIP_STATE_NIL_BONUS[schoolName]) {
    multiplier *= FLAGSHIP_STATE_NIL_BONUS[schoolName];
  }
  if (BLUE_BLOOD_BASKETBALL_BONUS[schoolName]) {
    multiplier *= BLUE_BLOOD_BASKETBALL_BONUS[schoolName];
  }
  if (HBCU_NIL_BONUS[schoolName]) {
    multiplier *= HBCU_NIL_BONUS[schoolName];
  }
  
  return multiplier;
};

// ============================================
// Helper: Get random AAU program name for sponsor
// ============================================
export const getRandomAauProgram = (sponsor: SponsorName): string => {
  const programs = AAU_PROGRAMS_BY_SPONSOR[sponsor] || ['Elite Basketball'];
  return programs[Math.floor(Math.random() * programs.length)];
};

// ============================================
// Helper: Check if recruit is from sponsor's pipeline state
// ============================================
export const isRecruitFromPipelineState = (
  recruitState: string | undefined,
  sponsor: SponsorName
): { isStronghold: boolean; isCompetitive: boolean } => {
  if (!recruitState) return { isStronghold: false, isCompetitive: false };
  
  const pipeline = SPONSOR_PIPELINE_STATES[sponsor];
  if (!pipeline) return { isStronghold: false, isCompetitive: false };
  
  return {
    isStronghold: pipeline.strongholdStates.includes(recruitState),
    isCompetitive: pipeline.competitiveStates.includes(recruitState),
  };
};
