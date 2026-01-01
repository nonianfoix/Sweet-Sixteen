
import React, { useMemo } from 'react';
import { GameState, GameAction, TeamColors, GameStatus } from '../types';
import { CalendarWidget } from './CalendarWidget';
import { getConferenceLogoUrl, getSponsorLogoUrl, getBrandLogoUrlByFileName } from '../services/logoUtils';
import { getSchoolLogoUrl } from '../services/utils';
import { SEASON_START_DATE } from '../services/dateService';

interface HeaderProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
    onHeaderClick: () => void;
    onSponsorClick: () => void;
    onCoachClick: () => void;
    onConferenceClick: () => void;
}

const styles = {
    header: {
        padding: '10px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky' as 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerRight: {
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '15px',
        fontSize: '0.8rem',
        textAlign: 'right' as 'right',
    },
    seasonInfo: {
        textAlign: 'right' as 'right',
        fontSize: '0.8rem',
    },
    conferenceLogoContainer: {
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 8px',
        minWidth: '110px',
    } as React.CSSProperties,
    conferenceLogoButton: {
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100px',
        width: '110px',
    } as React.CSSProperties,
    conferenceLogoImage: {
        maxHeight: '96px',
        maxWidth: '96px',
        height: 'auto',
        width: 'auto',
        objectFit: 'contain' as 'contain',
        mixBlendMode: 'normal' as 'normal',
        filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.35))',
    } as React.CSSProperties,
    logoBetween: {
        width: '180px',
        height: '90px',
        flex: '0 0 180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoButton: {
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
    },
    logoImage: {
        maxHeight: '80px',
        maxWidth: '80px',
        objectFit: 'contain' as 'contain',
    },
    sponsorLogoButton: {
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80px',
        height: '80px',
    },
    sponsorLogoImage: {
        maxHeight: '80px',
        maxWidth: '80px',
        objectFit: 'contain' as 'contain',
        filter: 'brightness(0) invert(1)',
        opacity: 0.95,
    },
    ncaaButton: {
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80px',
        height: '80px',
    },
    ncaaLogoImage: {
        maxHeight: '80px',
        maxWidth: '80px',
        height: 'auto',
        width: 'auto',
        objectFit: 'contain' as 'contain',
        opacity: 1,
    },
};

const Header = ({
    state,
    dispatch,
    colors,
    onHeaderClick,
    onSponsorClick,
    onCoachClick,
    onConferenceClick,
}: HeaderProps) => {
    if (!state.userTeam) return null;

    const powerRankings = useMemo(() =>
        [...state.allTeams]
        .map(t => ({ ...t, power: t.record.wins * 2 + t.prestige / 10 }))
        .sort((a, b) => b.power - a.power),
        [state.allTeams]
    );

    const getRankOrSeedInfo = () => {
        if (state.gameInSeason > 31 && state.tournament && state.userTeam) {
            const allMatchups = [
                ...state.tournament.firstFour,
                ...Object.values(state.tournament.regions).flatMap(r => r.flat())
            ];
            const userMatchup = allMatchups.find(m => m.homeTeam === state.userTeam!.name || m.awayTeam === state.userTeam!.name);
            if (userMatchup) {
                const seed = userMatchup.homeTeam === state.userTeam.name ? userMatchup.homeSeed : userMatchup.awaySeed;
                return `(#${seed} ${state.userTeam.conference})`;
            }
             return `(${state.userTeam.conference})`;
        }
        const rank = powerRankings.findIndex(t => t.name === state.userTeam!.name) + 1;
        return rank ? `(#${rank})` : '';
    };

    const handleLogoClick = () => {
        if (!state.userTeam) return;
        dispatch({ type: 'CHANGE_VIEW', payload: GameStatus.NIL_NEGOTIATION });
    };

    const conferenceLabel = state.userTeam?.conference || 'Independent';
    const conferenceLogoUrl = getConferenceLogoUrl(conferenceLabel);
    const ncaaLogoUrl = getBrandLogoUrlByFileName('NCAA_logo.svg');
    const sponsorLogoUrl = state.userTeam?.sponsor ? getSponsorLogoUrl(state.userTeam.sponsor.name) : undefined;
    const schoolLogoUrl = getSchoolLogoUrl(state.userTeam.name);

    return (
        <header style={{ ...styles.header, backgroundColor: colors.primary, color: colors.text, borderBottom: `4px solid ${colors.secondary}` }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{fontSize: '0.8rem', cursor: 'pointer'}} onClick={onHeaderClick} role="button" aria-label="Open settings">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>
                        {state.userTeam.name} {getRankOrSeedInfo()}
                    </h2>
                    <p>Record: {state.userTeam.record.wins}-{state.userTeam.record.losses} | Prestige: {state.userTeam.prestige}</p>
                </div>
            </div>
            {conferenceLogoUrl ? (
                <button
                    type="button"
                    style={styles.conferenceLogoButton}
                    title={`Open ${conferenceLabel} hub`}
                    aria-label={`Open ${conferenceLabel} hub`}
                    onClick={onConferenceClick}
                >
                    <div style={styles.conferenceLogoContainer}>
                        <img
                            src={conferenceLogoUrl}
                            alt={conferenceLabel}
                            style={styles.conferenceLogoImage}
                        />
                    </div>
                </button>
            ) : null}
            <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                {state.coach?.contract && (
                    <button
                        type="button"
                        onClick={onCoachClick}
                        style={styles.ncaaButton}
                        title="Coach"
                        aria-label="Coach"
                    >
                        {ncaaLogoUrl ? (
                            <img
                                src={ncaaLogoUrl}
                                alt="NCAA"
                                style={styles.ncaaLogoImage}
                            />
                        ) : (
                            <span>Coach</span>
                        )}
                    </button>
                )}
            </div>
            <div style={styles.logoBetween}>
                <button
                    type="button"
                    style={styles.logoButton}
                    onClick={handleLogoClick}
                    title="Open NIL Retention Hub"
                >
                    {schoolLogoUrl ? (
                        <img
                            src={schoolLogoUrl}
                            alt={`${state.userTeam.name} logo`}
                            style={styles.logoImage}
                        />
                    ) : (
                        <span>{state.userTeam.name}</span>
                    )}
                </button>
            </div>
            {state.userTeam.sponsor && sponsorLogoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '15px' }}>
                    <button
                        type="button"
                        onClick={onSponsorClick}
                        style={styles.sponsorLogoButton}
                        title={`${state.userTeam.sponsor.name} (${state.userTeam.sponsorContractYearsRemaining} YRS LEFT)`}
                        aria-label="Open sponsor management"
                    >
                        <img
                            src={sponsorLogoUrl}
                            alt={state.userTeam.sponsor.name}
                            style={styles.sponsorLogoImage}
                        />
                    </button>
                </div>
            ) : null}
            <div style={styles.headerRight}>
                <div style={styles.seasonInfo}>
                    <CalendarWidget date={state.currentDate || SEASON_START_DATE} season={state.season} />
                </div>
            </div>
        </header>
    );
};

export default Header;
