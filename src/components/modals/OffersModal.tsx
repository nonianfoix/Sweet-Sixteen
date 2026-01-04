import React from 'react';
import type {
    Team,
    Recruit,
    TeamColors,
    OfferPitchType,
    TimelineEvent
} from '../../types';
import RecruitOfferDetailsModal from '../RecruitOfferDetailsModal';

const OffersModal = (props: { 
    recruit: Recruit; 
    userTeamName: string; 
    allTeams: Team[]; 
    allRecruits?: Recruit[]; 
    gameInSeason: number; 
    onOpenRecruitId?: (recruitId: string) => void; 
    startOfferBuilder?: boolean; 
    contactPointsUsed?: number; 
    contactPointsMax?: number; 
    scoutLevel?: number; 
    actionsDisabled?: boolean; 
    onContactRecruit?: () => void; 
    onOfferScholarship?: (pitchType: OfferPitchType) => void; 
    onPullOffer?: () => void; 
    onCoachVisit?: () => void; 
    onScheduleOfficialVisit?: () => void; 
    onScout?: () => void; 
    onNegativeRecruit?: (targetSchool: string, method: 'Rumors' | 'Violations' | 'Academics') => void; 
    onClose: () => void; 
    timeline?: TimelineEvent[]; 
    upcomingHomeGames?: { week: number; opponent: string; isRivalry: boolean }[];
}) => {
    const { onOpenRecruitId, ...rest } = props;
    return (
        <RecruitOfferDetailsModal {...rest} onOpenRecruit={onOpenRecruitId} />
    );
};

export default OffersModal;
