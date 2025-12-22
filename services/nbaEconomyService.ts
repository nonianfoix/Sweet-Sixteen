import { Player, Team, ContractGoal } from '../types';
import { NBA_SALARY_CAP_2025, NBA_LUXURY_TAX_THRESHOLD_2025, NBA_MINIMUM_SALARY } from '../types';
import { NBA_SALARIES_CSV } from '../data/nbaRawData';

// CSV Parsing Logic
const parseSalaryCSV = (): Record<string, { salary: number, years: number }> => {
    const lines = NBA_SALARIES_CSV.split('\n');
    const contractMap: Record<string, { salary: number, years: number }> = {};
    
    // Skip header rows. The CSV has multiple header rows "Salary" and "Rk,Player..."
    // We will scan for lines that start with a rank number.
    
    lines.forEach(line => {
        // Simple CSV split by comma, but handling quotes is tricky.
        // The data has "$59,606,817".
        // Regex to split by comma ONLY if not inside quotes:
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        
        if (!parts || parts.length < 9) return;
        
        // Check if first part is a rank number
        if (isNaN(parseInt(parts[0], 10))) return;

        const name = parts[1]; // Name is index 1
        // Salaries start at index 3 (2025-26) to 8 (2030-31)
        
        let years = 0;
        let currentSalary = 0;
        
        // Check columns for years
        for (let i = 3; i <= 8; i++) {
            if (parts[i]) {
                const val = parts[i].replace(/[",\$]/g, '');
                if (val && !isNaN(parseInt(val, 10))) {
                    if (i === 3) currentSalary = parseInt(val, 10);
                    years++;
                }
            }
        }

        if (currentSalary > 0) {
            contractMap[name] = { salary: currentSalary, years: Math.max(1, years) };
        }
    });
    
    return contractMap;
};

const REAL_CONTRACTS = parseSalaryCSV();

export const getRealContract = (playerName: string): { salary: number, years: number } | null => {
    // Normalization helper
    const normalize = (n: string) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").toLowerCase().trim();
    
    if (REAL_CONTRACTS[playerName]) return REAL_CONTRACTS[playerName];
    
    const normalizedName = normalize(playerName);
    const found = Object.keys(REAL_CONTRACTS).find(k => normalize(k) === normalizedName);
    
    return found ? REAL_CONTRACTS[found] : null;
};

export interface MarketContext {
    leagueAverageSalary: number;
    capSpaceByTeam: Record<string, number>;
    positionScarcityByPosition: Record<string, number>;
    freeAgentSupply: number;
    phase: number;
}

export interface CapState {
    totalSalary: number;
    capSpace: number;
    overCap: boolean;
    overTax: boolean;
    underFloor: boolean;
    exceptionsAvailable: {
        mle: boolean;
        bae: boolean;
        minimum: boolean;
    };
    rosterChargeApplied: boolean;
    rosterChargeAmount: number;
}

export const calculatePlayerMarketValue = (player: Player, context: MarketContext): number => {
    let baseValue = NBA_MINIMUM_SALARY;
    const overall = player.overall;
    const potential = player.potential;
    const age = player.age || 22;

    // Base Tier
    if (overall >= 95) baseValue = 55000000; // Supermax tier
    else if (overall >= 90) baseValue = 40000000; // Max tier
    else if (overall >= 85) baseValue = 28000000; // High starter
    else if (overall >= 80) baseValue = 18000000; // Solid starter
    else if (overall >= 75) baseValue = 10000000; // Rotation
    else if (overall >= 72) baseValue = 5000000; // Key bench
    else if (overall >= 68) baseValue = 2500000; // Deep bench
    else baseValue = NBA_MINIMUM_SALARY;

    // Age Factor (Prime is 24-30)
    let ageMultiplier = 1.0;
    if (age < 24) ageMultiplier = 1.1 + (potential - overall) * 0.02; // Upside payment
    else if (age > 32) ageMultiplier = Math.max(0.4, 1.0 - (age - 32) * 0.15); // Decline discount

    // Scarcity & Supply
    const scarcityMultiplier = 1.0 + (context.positionScarcityByPosition[player.position] || 0) * 0.1;
    const supplyDiscount = Math.max(0.8, 1.0 - (context.freeAgentSupply / 100)); // Slight discount if market flooded

    // Phase Discount
    const phaseDiscount = context.phase > 1 ? Math.pow(0.85, context.phase - 1) : 1.0;

    let marketValue = baseValue * ageMultiplier * scarcityMultiplier * supplyDiscount * phaseDiscount;

    // Clamp
    marketValue = Math.max(NBA_MINIMUM_SALARY, Math.min(marketValue, 65000000));

    return Math.round(marketValue);
};

export const calculateTeamCapState = (team: Team): CapState => {
    const roster = team.roster;
    // Calculate guaranteed salary (exclude two-way for cap purposes usually, or small hit)
    // Simplified: Two-Way count as 0 against cap here, or very small fixed amount
    const guaranteedSalary = roster.reduce((sum, p) => {
        if (p.contract?.type === 'Two-Way') return sum; // Or small amount
        return sum + (p.contract?.salary || 0);
    }, 0);

    // Roster Charges: If < 12 players, add virtual minimums
    const standardPlayers = roster.filter(p => p.contract?.type !== 'Two-Way').length;
    let rosterChargeAmount = 0;
    if (standardPlayers < 12) {
        rosterChargeAmount = (12 - standardPlayers) * NBA_MINIMUM_SALARY;
    }

    const totalSalary = guaranteedSalary + rosterChargeAmount;
    const capSpace = NBA_SALARY_CAP_2025 - totalSalary;
    const salaryFloor = NBA_SALARY_CAP_2025 * 0.9;

    return {
        totalSalary,
        capSpace,
        overCap: totalSalary > NBA_SALARY_CAP_2025,
        overTax: totalSalary > NBA_LUXURY_TAX_THRESHOLD_2025,
        underFloor: totalSalary < salaryFloor,
        exceptionsAvailable: {
            mle: totalSalary > NBA_SALARY_CAP_2025 && totalSalary < (NBA_LUXURY_TAX_THRESHOLD_2025 + 7000000), // Simplified apron logic
            bae: totalSalary < NBA_LUXURY_TAX_THRESHOLD_2025,
            minimum: true
        },
        rosterChargeApplied: rosterChargeAmount > 0,
        rosterChargeAmount
    };
};

export const canPlayerAcceptMinimum = (player: Player, context: MarketContext): boolean => {
    // Stars shouldn't take min unless old or no market
    if (player.overall > 80 && (player.age || 22) < 34) return false;
    // If phase 3 (desperation), maybe
    if (context.phase >= 3) return true;
    return true;
};
