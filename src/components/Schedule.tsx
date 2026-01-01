
import React, { useState, useMemo } from 'react';
import { GameState, GameAction, TeamColors } from '../types';
import Subheading from './Subheading';
import TeamBox from './TeamBox';
import { SCHOOL_CONFERENCES } from '../constants';

const styles = {
    select: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '0.7rem',
    },
    smallButton: {
        padding: '4px 8px',
        border: '1px solid #000',
        borderRadius: '4px',
        backgroundColor: '#e0e0e0',
        cursor: 'pointer',
        fontSize: '0.6rem',
        fontFamily: "'Press Start 2P', cursive",
    },
};

interface ScheduleProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const Schedule = ({ state, dispatch, colors }: ScheduleProps) => {

    const [selectedTeam, setSelectedTeam] = useState(state.userTeam?.name || '');

    const powerRankings = useMemo(() => 
        [...state.allTeams]
        .map(t => ({...t, power: t.record.wins * 2 + t.prestige / 10}))
        .sort((a,b) => b.power - a.power), 
    [state.allTeams]);

    const scheduleTeamOptions = useMemo(() => [...state.allTeams].sort((a, b) => a.name.localeCompare(b.name)), [state.allTeams]);

    const getRank = (teamName: string) => powerRankings.findIndex(t => t.name === teamName) + 1;

    const handleTeamChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTeam(event.target.value);
    };

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="team-schedule-select" style={{ marginRight: '10px' }}>Select Team:</label>
                <select id="team-schedule-select" value={selectedTeam} onChange={handleTeamChange} style={styles.select}>
                    {scheduleTeamOptions.map(team => (
                        <option key={team.name} value={team.name}>{team.name}</option>
                    ))}
                </select>
            </div>

            {state.schedule.map((gameDay, i) => {
                const gamesForSelectedTeam = gameDay.filter(g => g.homeTeam === selectedTeam || g.awayTeam === selectedTeam);

                if (gamesForSelectedTeam.length === 0) return null;

                return (
                    <div key={i} style={{marginBottom: '15px'}}>
                        <Subheading color={colors.primary}>Game {i + 1}</Subheading>
                        <ul style={{fontSize: '0.7rem', listStyle: 'none', padding: 0}}>
                            {gamesForSelectedTeam.map((g, j) => (
                                <li key={j} style={{marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <TeamBox 
                                        name={g.awayTeam} 
                                        seed={getRank(g.awayTeam)} 
                                        score={g.awayScore} 
                                        played={g.played} 
                                        conference={SCHOOL_CONFERENCES[g.awayTeam]}
                                        isUserTeam={g.awayTeam === selectedTeam} 
                                        userTeamColors={colors}
                                        isWinner={g.played && g.awayScore > g.homeScore}
                                    />
                                    <span style={{fontSize: '0.6rem'}}>@</span>
                                    <TeamBox 
                                        name={g.homeTeam} 
                                        seed={getRank(g.homeTeam)} 
                                        score={g.homeScore} 
                                        played={g.played} 
                                        conference={SCHOOL_CONFERENCES[g.homeTeam]}
                                        isUserTeam={g.homeTeam === selectedTeam} 
                                        userTeamColors={colors}
                                        isWinner={g.played && g.homeScore > g.awayScore}
                                    />
                                    {g.played && (
                                        <button 
                                            onClick={() => {
                                                const gameLog = state.gameLogs.find(log => log.gameId === `S${state.season}G${i + 1}-${g.homeTeam}v${g.awayTeam}` || log.gameId === `S${state.season}G${i + 1}-${g.awayTeam}v${g.homeTeam}`);
                                                if (gameLog) {
                                                    dispatch({ type: 'VIEW_GAME_LOG', payload: { gameLog } });
                                                }
                                            }}
                                            style={{ ...styles.smallButton, marginLeft: '10px' }}
                                        >
                                            View Box Score
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
};

export default Schedule;
