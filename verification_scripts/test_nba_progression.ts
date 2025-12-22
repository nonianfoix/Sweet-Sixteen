
import { processNBAOffseasonDevelopment, createPlayer, calculateOverall } from '../services/gameService';
import { Player } from '../types';

// Mock Player
const createMockPlayer = (age: number, overall: number, potential: number): Player => {
    const p = createPlayer('Fr', 'SG');
    p.age = age;
    p.overall = overall;
    p.potential = potential;
    p.stats = {
        insideScoring: overall,
        outsideScoring: overall,
        playmaking: overall,
        perimeterDefense: overall,
        insideDefense: overall,
        rebounding: overall,
        stamina: 80
    };
    return p;
};

const runTest = () => {
    console.log("=== Testing NBA Progression Logic ===");

    // Test 1: Young Growth (Age 20, OVR 70, POT 85)
    console.log("\nTest 1: Young Player (20yo, 70/85)");
    let youngPlayer = createMockPlayer(20, 70, 85);
    let originalOvr = youngPlayer.overall;
    youngPlayer = processNBAOffseasonDevelopment(youngPlayer);
    console.log(`Result: ${originalOvr} -> ${youngPlayer.overall} (Pot: ${youngPlayer.potential})`);
    
    // Test 2: Peak Player (Age 29, OVR 85, POT 85)
    console.log("\nTest 2: Peak Player (29yo, 85/85)");
    let peakPlayer = createMockPlayer(29, 85, 85);
    originalOvr = peakPlayer.overall;
    peakPlayer = processNBAOffseasonDevelopment(peakPlayer);
    console.log(`Result: ${originalOvr} -> ${peakPlayer.overall} (Pot: ${peakPlayer.potential})`);

    // Test 3: Aging Player (Age 34, OVR 80, POT 80)
    console.log("\nTest 3: Aging Player (34yo, 80/80)");
    let oldPlayer = createMockPlayer(34, 80, 80);
    originalOvr = oldPlayer.overall;
    oldPlayer = processNBAOffseasonDevelopment(oldPlayer);
    console.log(`Result: ${originalOvr} -> ${oldPlayer.overall} (Pot: ${oldPlayer.potential})`);

    // Test 4: Regression Curve (Simulate 5 years for a 32yo)
    console.log("\nTest 4: Regression Curve (32yo -> 37yo)");
    let regressingPlayer = createMockPlayer(32, 85, 85);
    for(let i=0; i<5; i++) {
        const prev = regressingPlayer.overall;
        regressingPlayer.age += 1;
        regressingPlayer = processNBAOffseasonDevelopment(regressingPlayer);
        console.log(`Year ${i+1} (Age ${regressingPlayer.age}): ${prev} -> ${regressingPlayer.overall}`);
    }
};

// Execute
// Note: Since we can't easily import from gameService directly in this standalone script without ts-node and full environment, 
// this script is meant to be run if we had a test runner. 
// For this environment, I might need to paste the function into the script or use the existing test setup.
// I will just paste the logic into the console log for 'manual' verification if I were running it, 
// OR I can use the existing 'verification_scripts' pattern if one exists.
// Checking file listing...
