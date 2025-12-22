// scripts/verifyAttendanceModel.js
const main = async () => {
    const { calculateAttendance } = await import('../services/gameService.js');

    const homeTeam = {
        name: 'Test University',
        prestige: 80,
        record: { wins: 5, losses: 0 },
        fanInterest: 85,
        fanSentiment: 90,
        conference: 'Test Conference',
        prices: { ticketPrice: 50 },
        facilities: {
            arena: {
                name: 'Test Arena',
                capacity: 15000,
                quality: 85,
                luxurySuites: 100,
                seatMix: {
                    lowerBowl: { capacity: 6000, priceModifier: 1.2 },
                    upperBowl: { capacity: 7000, priceModifier: 0.8 },
                    studentSection: { capacity: 2000, priceModifier: 0.5 },
                    suites: { capacity: 100, priceModifier: 5 },
                },
                attendanceLog: [],
            },
        },
        wealth: {
            endowmentScore: 80,
            donationLevel: 80,
            boosterPool: 10,
            donorMomentum: 5,
        },
        nilCollective: {
            tier: 'national',
        },
    };

    const awayTeam = {
        name: 'Rival State',
        prestige: 75,
        record: { wins: 4, losses: 1 },
        conference: 'Test Conference',
    };

    const week = 10;

    const forecast = calculateAttendance(homeTeam, awayTeam, week);

    console.log(JSON.stringify(forecast, null, 2));
};

main();
