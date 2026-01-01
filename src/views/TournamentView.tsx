import React, { useState, useEffect, useMemo } from 'react';
import type {
    GameState,
    GameAction,
    TeamColors,
    Team,
    TournamentMatchup,
    TournamentRegionName,
} from '../types';
import * as constants from '../constants';
import Subheading from '../components/Subheading';
import TeamBox from '../components/TeamBox';

const { SCHOOL_COLORS } = constants;

const styles = {
    button: {
        padding: '8px 16px',
        border: '2px solid #000',
        borderRadius: '6px',
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
        fontSize: '0.7rem',
        fontFamily: "'Press Start 2P', 'Courier New', system-ui, sans-serif",
    },
};



type MatchupProps = {
    matchup: TournamentMatchup;
    teamsByName: Map<string, Team>;
    userTeamName: string;
    userTeamColors: TeamColors;
};

// Matchup component for displaying a single tournament matchup
const Matchup: React.FC<MatchupProps> = ({ matchup, teamsByName, userTeamName, userTeamColors }) => (
    <div style={{ marginBottom: '15px', width: '280px' }}>
        <TeamBox 
            name={matchup.homeTeam} 
            seed={matchup.homeSeed} 
            score={matchup.homeScore} 
            played={matchup.played} 
            conference={teamsByName.get(matchup.homeTeam)?.conference} 
            isUserTeam={matchup.homeTeam === userTeamName} 
            userTeamColors={userTeamColors} 
            isWinner={matchup.played && matchup.homeScore > matchup.awayScore} 
        />
        <p style={{ textAlign: 'center', margin: '2px 0', fontSize: '0.6rem' }}>vs</p>
        <TeamBox 
            name={matchup.awayTeam} 
            seed={matchup.awaySeed} 
            score={matchup.awayScore} 
            played={matchup.played} 
            conference={teamsByName.get(matchup.awayTeam)?.conference} 
            isUserTeam={matchup.awayTeam === userTeamName} 
            userTeamColors={userTeamColors} 
            isWinner={matchup.played && matchup.awayScore > matchup.homeScore} 
        />
    </div>
);

type RegionBracketProps = {
    name: string;
    rounds: TournamentMatchup[][];
    teamsByName: Map<string, Team>;
    align?: 'left' | 'right';
    userTeamName: string;
    userTeamColors: TeamColors;
};

// RegionBracket component for displaying a tournament region
const RegionBracket: React.FC<RegionBracketProps> = ({ 
    name, 
    rounds, 
    teamsByName, 
    align = 'left', 
    userTeamName, 
    userTeamColors 
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h4 style={{ 
            writingMode: 'vertical-rl', 
            textOrientation: 'mixed', 
            transform: align === 'left' ? 'rotate(180deg)' : 'none', 
            marginBottom: '10px' 
        }}>
            {name}
        </h4>
        <div style={{ display: 'flex', gap: '20px', flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
            {rounds.map((round, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                    {round.map((matchup, j) => (
                        <Matchup 
                            key={`${i}-${j}`} 
                            matchup={matchup} 
                            teamsByName={teamsByName} 
                            userTeamName={userTeamName} 
                            userTeamColors={userTeamColors}
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

// Main TournamentView component
const TournamentView = ({ 
    state, 
    dispatch, 
    colors 
}: { 
    state: GameState; 
    dispatch: React.Dispatch<GameAction>; 
    colors: TeamColors;
}) => {
    const [viewMode, setViewMode] = useState<'round' | 'full'>('round');
    const [selectedRound, setSelectedRound] = useState(0);

    const teamsByName: Map<string, Team> = useMemo(
        () => new Map(state.allTeams.map(t => [t.name, t])), 
        [state.allTeams]
    );

    const { tournament, userTeam } = state;
    const userTeamName = userTeam?.name || '';

    const roundNames = ['First Four', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'];
    const maxRounds = roundNames.length;

    useEffect(() => {
        if (!tournament) return;

        const findFirstUnplayedRoundIndex = () => {
            if (!tournament.firstFour.every(m => m.played)) return 0;
            const firstUnplayedRegional = Object.values(tournament.regions)
                .flatMap(r => r.flat())
                .find(m => !m.played);
            if (firstUnplayedRegional) {
                for (const region of Object.values(tournament.regions)) {
                    for (let i = 0; i < region.length; i++) {
                        if (region[i].some(m => !m.played)) {
                            return i + 1; // +1 to account for first four
                        }
                    }
                }
            }
            if (tournament.finalFour.length === 0 || tournament.finalFour.some(m => !m.played)) return 5;
            if (!tournament.championship || !tournament.championship.played) return 6;
            return 6; // Default to showing champion
        };
        setSelectedRound(findFirstUnplayedRoundIndex());
    }, [tournament]);

    if (!tournament) return <div>The regular season is not over yet.</div>;
    
    const renderRoundView = () => {
        let matchups: TournamentMatchup[] = [];
        let title = roundNames[selectedRound];

        if (selectedRound === 0) {
            matchups = tournament.firstFour;
        } else if (selectedRound >= 1 && selectedRound <= 4) {
            const regionRoundIndex = selectedRound - 1;
            matchups = Object.values(tournament.regions).flatMap(r => r[regionRoundIndex] || []);
        } else if (selectedRound === 5) {
            matchups = tournament.finalFour;
        } else if (selectedRound === 6 && tournament.championship) {
            matchups = [tournament.championship];
        }

        const userMatchup = matchups.find(m => m.homeTeam === userTeamName || m.awayTeam === userTeamName);
        const otherMatchups = matchups.filter(m => m !== userMatchup);

        return (
            <div>
                <h3 style={{ textAlign: 'center', color: colors.primary, marginBottom: '10px', fontSize: '1.5rem' }}>
                    {title}
                </h3>

                {userMatchup && (
                    <>
                        <Subheading color={colors.primary}>Your Matchup</Subheading>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <Matchup 
                                matchup={userMatchup} 
                                teamsByName={teamsByName} 
                                userTeamName={userTeamName} 
                                userTeamColors={colors}
                            />
                        </div>
                        <Subheading color={colors.primary}>Other Games</Subheading>
                    </>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                    {otherMatchups.length > 0 
                        ? otherMatchups.map((matchup, j) => (
                            <Matchup 
                                key={j} 
                                matchup={matchup} 
                                teamsByName={teamsByName} 
                                userTeamName={userTeamName} 
                                userTeamColors={colors}
                            />
                        ))
                        : !userMatchup && <p>Matchups for this round have not been set yet.</p>
                    }
                </div>
            </div>
        );
    };
    
    const renderFullBracket = () => {
        const { regions, finalFour, championship, firstFour } = tournament;
        const leftRegions = ['West', 'East'] as TournamentRegionName[];
        const rightRegions = ['South', 'Midwest'] as TournamentRegionName[];
        return (
            <>
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ textAlign: 'center', color: colors.primary, marginBottom: '10px' }}>First Four</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        {firstFour.map((matchup, j) => (
                            <Matchup 
                                key={j} 
                                matchup={matchup} 
                                teamsByName={teamsByName} 
                                userTeamName={userTeamName} 
                                userTeamColors={colors}
                            />
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'auto', padding: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
                        {leftRegions.map(name => (
                            <RegionBracket 
                                key={name} 
                                name={name} 
                                rounds={regions[name]} 
                                align="left" 
                                teamsByName={teamsByName} 
                                userTeamName={userTeamName} 
                                userTeamColors={colors}
                            />
                        ))}
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '0 20px', 
                        flexShrink: 0 
                    }}>
                        <h4 style={{ color: colors.primary, fontSize: '1.2rem' }}>Final Four</h4>
                        {finalFour.map((matchup, j) => (
                            <Matchup 
                                key={j} 
                                matchup={matchup} 
                                teamsByName={teamsByName} 
                                userTeamName={userTeamName} 
                                userTeamColors={colors}
                            />
                        ))}
                        {championship && (
                            <>
                                <h4 style={{ color: colors.primary, marginTop: '20px', fontSize: '1.2rem' }}>
                                    Championship
                                </h4>
                                <Matchup 
                                    matchup={championship} 
                                    teamsByName={teamsByName} 
                                    userTeamName={userTeamName} 
                                    userTeamColors={colors}
                                />
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
                        {rightRegions.map(name => (
                            <RegionBracket 
                                key={name} 
                                name={name} 
                                rounds={regions[name]} 
                                align="right" 
                                teamsByName={teamsByName} 
                                userTeamName={userTeamName} 
                                userTeamColors={colors}
                            />
                        ))}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div>
            <Subheading color={colors.primary}>National Tournament</Subheading>
            {tournament.champion && (
                <h4 style={{ textAlign: 'center', margin: '20px 0', color: colors.primary }}>
                    Champion: {tournament.champion === state.userTeam?.name 
                        ? <strong>{tournament.champion}</strong> 
                        : tournament.champion}
                </h4>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px 0' }}>
                <button style={{ ...styles.button }} onClick={() => setViewMode('round')}>Round View</button>
                <button style={{ ...styles.button }} onClick={() => setViewMode('full')}>Full Bracket</button>
            </div>
            {viewMode === 'round' && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px 0' }}>
                    <button 
                        style={{ ...styles.button }} 
                        onClick={() => setSelectedRound(r => Math.max(0, r - 1))} 
                        disabled={selectedRound === 0}
                    >
                        Prev Round
                    </button>
                    <button 
                        style={{ ...styles.button }} 
                        onClick={() => setSelectedRound(r => Math.min(maxRounds - 1, r + 1))} 
                        disabled={selectedRound === maxRounds - 1 || tournament.champion !== null}
                    >
                        Next Round
                    </button>
                </div>
            )}

            {viewMode === 'round' ? renderRoundView() : renderFullBracket()}
        </div>
    );
};

export default TournamentView;
