export const calculateTransferPlayerInterest = (player: Transfer, team: Team): number => {
    let interest = player.interest || 50;
    
    // Prestige factor
    if (team.prestige > 75) interest += 10;
    if (team.prestige < 40) interest -= 10;

    // Location factor
    if (player.homeState === team.state) interest += 15;

    // Playing time factor (simplified)
    const playersAtPos = team.roster.filter(p => p.position === player.position).length;
    if (playersAtPos < 2) interest += 20; // Needs the position
    if (playersAtPos > 3) interest -= 15; // Crowded

    return Math.min(100, Math.max(0, interest));
};