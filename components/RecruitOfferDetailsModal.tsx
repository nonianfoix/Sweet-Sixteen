import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { OfferPitchType, Recruit, RecruitNilPriority, Team, TeamColors, MotivationKey } from '../types';
import { SCHOOL_COLORS, CONFERENCE_NIL_CAPS, SCHOOL_CONFERENCES, CONFERENCE_STRENGTH } from '../constants';
import { OFFER_PITCH_OPTIONS, CATEGORY_THEMES, PITCH_IMPACTS } from '../constants/recruiting';
import { buildRecruitOfferShortlist, calculateRecruitInterestBreakdown, getRecruitOfferShareTemperatureMultiplier, calculateStrategicBestFit } from '../services/gameService';
import {
  formatPlayerHeight,
  formatRecruitPriority,
  getWhyBadgeTheme,
  getSchoolLogoUrl,
  rgbaFromHex,
  bestTextColor,
  teamColor,
  tierAccent,
  clamp
} from '../services/utils';

type Props = {
  recruit: Recruit;
  userTeamName: string;
  allTeams: Team[];
  allRecruits?: Recruit[];
  gameInSeason: number;
  onClose: () => void;
  onOpenRecruit?: (recruitId: string) => void;
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
  onNegativeRecruit?: () => void;
};

export default function RecruitOfferDetailsModal({
  recruit,
  userTeamName,
  allTeams,
  allRecruits,
  gameInSeason,
  onClose,
  onOpenRecruit,
  startOfferBuilder,
  contactPointsUsed = 0,
  contactPointsMax = 0,
  scoutLevel = 0,
  actionsDisabled = false,
  onContactRecruit,
  onOfferScholarship,
  onPullOffer,
  onCoachVisit,
  onScheduleOfficialVisit,
  onScout,
  onNegativeRecruit,
}: Props) {
  const teamsByName = useMemo(() => new Map(allTeams.map(t => [t.name, t])), [allTeams]);
  const userTeam = useMemo(() => teamsByName.get(userTeamName) || null, [teamsByName, userTeamName]);
  const userPrestige = (userTeam?.recruitingPrestige ?? userTeam?.prestige ?? 50) as number;
  const userConference = SCHOOL_CONFERENCES[userTeamName] || 'Independent';
  const conferenceStrength = CONFERENCE_STRENGTH[userConference] || 'Low';
  const nilCap = CONFERENCE_NIL_CAPS[conferenceStrength] || 1500000;

  const eliteFitFail =
    userPrestige >= 94 &&
    ((recruit.preferredProgramAttributes?.academics ?? 50) < 40 || recruit.personalityTrait === 'Family Feud');
  const [showLongshots, setShowLongshots] = useState(false);
  const temperature = 2.2; // fixed: max separation (Interest Spread 100%)
  const [sideTab, setSideTab] = useState<'profile' | 'timeline' | 'links' | 'package'>('profile');
  const [showOfferBuilder, setShowOfferBuilder] = useState(false);
  const [pitchType, setPitchType] = useState<OfferPitchType>('Standard');
  const [hoverPitchType, setHoverPitchType] = useState<OfferPitchType | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; tone: 'good' | 'bad' | 'neutral' } | null>(null);

  const lastInterestRef = useRef<number>(Math.round(recruit.interest));

  const recruitsById = useMemo(() => new Map((allRecruits || []).map(r => [r.id, r])), [allRecruits]);
  const packagePartners = useMemo(() => {
    const links = (recruit.relationships || []).filter(rel => rel.sportLevel === 'HS' && (rel.notes || '').toLowerCase().includes('package deal'));
    const partners = links
      .map(link => recruitsById.get(link.personId))
      .filter(Boolean) as Recruit[];
    return partners;
  }, [recruit.relationships, recruitsById]);

  const mutualPackageOfferSchools = useMemo(() => {
    if (!packagePartners.length) return [];
    const offerSet = new Set([...(recruit.cpuOffers || []), ...(recruit.userHasOffered ? [userTeamName] : [])]);
    const mutual = new Set<string>();
    packagePartners.forEach(p => {
      const pOffers = new Set([...(p.cpuOffers || []), ...(p.userHasOffered ? [userTeamName] : [])]);
      offerSet.forEach(s => {
        if (pOffers.has(s)) mutual.add(s);
      });
    });
    return [...mutual].sort((a, b) => a.localeCompare(b));
  }, [packagePartners, recruit.cpuOffers, recruit.userHasOffered, userTeamName]);

  const powerRankings = useMemo(() => {
    const ranks = new Map<string, number>();
    [...allTeams]
      .sort((a, b) => (b.record.wins * 2 + b.prestige / 10) - (a.record.wins * 2 + a.prestige / 10))
      .forEach((team, index) => {
        ranks.set(team.name, index + 1);
      });
    return ranks;
  }, [allTeams]);

  const offerNames = useMemo(() => {
    return [...(recruit.cpuOffers || []), ...(recruit.userHasOffered ? [userTeamName] : [])];
  }, [recruit.cpuOffers, recruit.userHasOffered, userTeamName]);

  const rawOffers = useMemo(() => {
    return offerNames.map(teamName => {
      const team = teamsByName.get(teamName);
      const breakdown = team ? calculateRecruitInterestBreakdown(recruit, team, { gameInSeason }) : null;
      return {
        name: teamName,
        score: breakdown ? breakdown.score : 0,
        prestige: team ? team.prestige : 0,
        rank: team ? powerRankings.get(team.name) : undefined,
        pitchType: breakdown?.pitchType ?? null,
        whyBadges: breakdown?.whyBadges ?? [],
        debug: breakdown,
      };
    });
  }, [offerNames, teamsByName, recruit, gameInSeason, powerRankings]);

  const sortedRawOffers = useMemo(() => [...rawOffers].sort((a, b) => b.score - a.score), [rawOffers]);

  const { shortlist, shares } = useMemo(() => {
    return buildRecruitOfferShortlist(
      sortedRawOffers.map(o => ({ name: o.name, score: o.score })),
      { min: 3, max: 6, leaderWindow: 10, seedKey: `${recruit.id}:${gameInSeason}`, temperature, temperatureMultiplier: getRecruitOfferShareTemperatureMultiplier(recruit) }
    );
  }, [sortedRawOffers, recruit.id, gameInSeason, temperature]);

  const shortlistNames = useMemo(() => new Set(shortlist.map(o => o.name)), [shortlist]);

  const shareLeaderName = useMemo(() => {
    let bestName: string | null = shortlist[0]?.name ?? null;
    let bestShare = -Infinity;
    shortlist.forEach(o => {
      const share = shares.get(o.name);
      if (share == null) return;
      if (share > bestShare) {
        bestShare = share;
        bestName = o.name;
      }
    });
    return bestName;
  }, [shortlist, shares]);

  type OfferView = (typeof rawOffers)[number] & { interestPct: number; interestLabel: string; tier: string };

  const shortlistOfferDetails: OfferView[] = useMemo(() => {
    const leaderShare = shareLeaderName ? shares.get(shareLeaderName) : undefined;
    return sortedRawOffers
      .filter(o => shortlistNames.has(o.name))
      .map(o => {
        const share = shares.get(o.name);
        const interestPct = share ?? 0;
        const interestLabel = share == null || share < 1 ? '<1%' : `${Math.round(share)}%`;
        const tier =
          o.name === shareLeaderName
            ? 'Leader'
            : (leaderShare != null && leaderShare > 0 ? (interestPct >= leaderShare * 0.65 ? 'In The Mix' : 'Chasing') : (interestPct >= 16 ? 'In The Mix' : 'Chasing'));
        return { ...o, interestPct, interestLabel, tier };
      });
  }, [sortedRawOffers, shortlistNames, shares, shareLeaderName]);

  const longshotOfferDetails: OfferView[] = useMemo(() => {
    return sortedRawOffers
      .filter(o => !shortlistNames.has(o.name))
      .map(o => ({ ...o, interestPct: 0, interestLabel: '<1%', tier: 'Longshot' }));
  }, [sortedRawOffers, shortlistNames]);

  const interestSorted = useMemo(() => [...shortlistOfferDetails].sort((a, b) => b.interestPct - a.interestPct), [shortlistOfferDetails]);
  const topLeader = interestSorted[0];
  const topRunnerUp = interestSorted[1];
  const leaderDelta = topLeader && topRunnerUp ? Math.max(0, topLeader.interestPct - topRunnerUp.interestPct) : null;

  const topRecruit = (recruit.nationalRank != null && recruit.nationalRank <= 50) || recruit.stars >= 4;
  const actionsLocked =
    actionsDisabled ||
    Boolean(recruit.isSigned || recruit.recruitmentStage === 'Signed') ||
    Boolean(recruit.declinedOffers?.includes(userTeamName));

  const sectionCard: React.CSSProperties = {
    background: '#f8fafc',
    borderRadius: '6px',
    border: '2px solid #0f172a',
    boxShadow: '4px 4px 0 #0f172a',
  };

  const infoPill: React.CSSProperties = {
    background: '#ffffff',
    border: '2px solid #0f172a',
    borderRadius: '6px',
    boxShadow: '2px 2px 0 #0f172a',
    padding: '4px 8px',
    fontSize: '12px',
    color: '#0f172a',
    fontWeight: 800,
  };

  const stagePill: React.CSSProperties = {
    ...infoPill,
    background: '#eff6ff',
    border: '2px solid #2563eb',
    color: '#1d4ed8',
  };

  const headerStatPillBase: React.CSSProperties = {
    ...infoPill,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px',
    whiteSpace: 'nowrap',
  };

  const headerStatLabel: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    opacity: 0.75,
  };

  const headerStatValue: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 900,
  };

  const tagChip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '12px',
    fontWeight: 800,
    background: '#ffffff',
    border: '2px solid #0f172a',
    boxShadow: '2px 2px 0 #0f172a',
    color: '#0f172a',
  };

  const tabButton = (active: boolean): React.CSSProperties => ({
    padding: '8px 10px',
    borderRadius: '6px',
    border: `2px solid ${active ? '#0f172a' : '#0f172a'}`,
    background: active ? '#fde047' : '#ffffff',
    color: '#0f172a',
    boxShadow: active ? '2px 2px 0 #0f172a' : '2px 2px 0 rgba(15,23,42,0.35)',
    fontWeight: 900,
    fontSize: '12px',
    cursor: 'pointer',
  });

  const contactPointsRemaining = Math.max(0, contactPointsMax - contactPointsUsed);

  const motivations: Record<MotivationKey, number> = {
    proximity: recruit.motivations?.proximity ?? 50,
    playingTime: recruit.motivations?.playingTime ?? 50,
    nil: recruit.motivations?.nil ?? 50,
    exposure: recruit.motivations?.exposure ?? 50,
    relationship: recruit.motivations?.relationship ?? 50,
    development: recruit.motivations?.development ?? 50,
    academics: recruit.motivations?.academics ?? 50,
  };

  const strategicFit = useMemo(() => {
    if (!userTeam) return { pitch: 'Standard' as OfferPitchType, score: 0, reason: '' };
    return calculateStrategicBestFit(recruit, userTeam);
  }, [recruit, userTeam]);

  const bestPitchType = strategicFit.pitch;

  const projectedMomentumPreview = (() => {
    const preview = hoverPitchType ?? pitchType;
    const impact = PITCH_IMPACTS[preview];
    if (!impact.keys.length) return 0;
    const avg = impact.keys.reduce((sum, k) => sum + motivations[k], 0) / impact.keys.length;
    return clamp(Math.round(1 + (avg / 100) * 5 + impact.coef / 8), 0, 10);
  })();

  const topFocus = (() => {
    const scores = [
      { key: 'playingTime', label: 'Playing Time', value: motivations.playingTime },
      { key: 'nil', label: 'NIL Money', value: motivations.nil },
      { key: 'exposure', label: 'Exposure', value: motivations.exposure },
      { key: 'proximity', label: 'Proximity', value: motivations.proximity },
      { key: 'development', label: 'Development', value: motivations.development },
      { key: 'academics', label: 'Academics', value: motivations.academics },
      { key: 'relationship', label: 'Relationships', value: motivations.relationship },
    ];
    scores.sort((a, b) => b.value - a.value);
    return { sorted: scores, top: scores[0] };
  })();

  useEffect(() => {
    const next = Math.round(recruit.interest);
    const prev = lastInterestRef.current;
    if (next !== prev) {
      const delta = next - prev;
      lastInterestRef.current = next;
      setActionFeedback({
        text: `Interest ${delta > 0 ? '+' : ''}${delta}`,
        tone: delta > 0 ? 'good' : 'bad',
      });
      const t = window.setTimeout(() => setActionFeedback(null), 2200);
      return () => window.clearTimeout(t);
    }
    lastInterestRef.current = next;
    return;
  }, [recruit.interest]);

  useEffect(() => {
    if (startOfferBuilder && !recruit.userHasOffered) {
      setShowOfferBuilder(true);
    }
  }, [recruit.id, recruit.userHasOffered, startOfferBuilder]);

  const actionButton = (disabled: boolean, tone: 'neutral' | 'primary' | 'danger' = 'neutral'): React.CSSProperties => ({
    padding: '8px 8px',
    borderRadius: '6px',
    border: '2px solid #0f172a',
    background: tone === 'primary' ? '#fde047' : tone === 'danger' ? '#fca5a5' : '#ffffff',
    color: '#0f172a',
    boxShadow: disabled ? '2px 2px 0 rgba(15,23,42,0.35)' : '2px 2px 0 #0f172a',
    fontWeight: 900,
    fontSize: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    whiteSpace: 'normal',
    textAlign: 'center',
    lineHeight: '1.2',
  });

  const motivationItems = [
    { key: 'playingTime', label: 'Playing Time', title: '' },
    { key: 'nil', label: 'NIL Money', title: 'NIL money potential (collective/market support)' },
    { key: 'exposure', label: 'Exposure', title: 'School prestige/brand visibility' },
    { key: 'proximity', label: 'Proximity', title: '' },
    { key: 'development', label: 'Development', title: '' },
    { key: 'academics', label: 'Academics', title: '' },
    { key: 'relationship', label: 'Relationships', title: '' },
  ] as const;

  const OfferCard = ({ offer }: { offer: OfferView }) => {
    const accent = tierAccent(offer.tier);
    const tc = (SCHOOL_COLORS as Record<string, TeamColors | undefined>)[offer.name];
    const teamPrimary = tc?.primary || accent.border;
    const logoUrl = getSchoolLogoUrl(offer.name);
    const fitBadgeText = bestTextColor(teamPrimary);
    const cardBg = rgbaFromHex(teamPrimary, 0.12);
    const cardBorder = rgbaFromHex(teamPrimary, 0.22);
    const pitchImpact = offer.pitchType ? PITCH_IMPACTS[offer.pitchType] : undefined;
    const pitchKey = pitchImpact?.keys?.[0];
    const pitchTheme = pitchKey ? CATEGORY_THEMES[pitchKey] : null;
    return (
      <div
        style={{
          ...sectionCard,
          background: cardBg,
          border: '2px solid #0f172a',
          borderLeft: `6px solid ${teamPrimary}`,
          boxShadow: `4px 4px 0 #0f172a, 0 0 0 2px ${cardBorder} inset`,
          padding: '14px 14px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '150px',
              height: '150px',
              objectFit: 'contain',
              opacity: 0.65,
              filter: 'saturate(1.15) contrast(1.05) drop-shadow(0 2px 3px rgba(0,0,0,0.22))',
              mixBlendMode: 'normal',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        ) : null}

        <div style={{ position: 'relative', zIndex: 2, padding: '14px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '6px', background: accent.pillBg, color: accent.pillText, fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {offer.tier}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '1px 1px 0 rgba(255,255,255,0.55)' }} title={offer.name}>
              {offer.name}{offer.rank ? <span style={{ color: '#334155', fontWeight: 900 }}> (#{offer.rank})</span> : null}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#334155', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Share</span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: teamPrimary }}>{offer.interestLabel}</span>
            </div>
            <div style={{ marginTop: '6px', display: 'inline-flex', background: teamPrimary, color: fitBadgeText, border: `1px solid ${teamPrimary}`, borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 900 }}>
              {Math.round(offer.score)} fit
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px', height: '10px', borderRadius: '999px', overflow: 'hidden', background: '#e5e7eb' }}>
          <div style={{ width: `${Math.max(0, offer.interestPct)}%`, height: '100%', background: teamPrimary }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginTop: '12px', fontSize: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prestige</div>
            <div style={{ fontWeight: 800, color: '#111827' }}>{offer.prestige}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pitch</div>
            {offer.pitchType ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 800, color: '#111827' }}>{offer.pitchType}</span>
                {pitchTheme ? (
                  <span style={{ alignSelf: 'flex-start', background: pitchTheme.chipBg, border: `1px solid ${pitchTheme.chipBorder}`, color: pitchTheme.chipText, borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 800 }}>
                    Affects {pitchTheme.label}
                  </span>
                ) : null}
              </div>
            ) : (
              <div style={{ fontWeight: 700, color: '#111827' }}>-</div>
            )}
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Why</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
              {(offer.whyBadges || []).slice(0, 4).map(b => (
                (() => {
                  const themed = getWhyBadgeTheme(b);
                  const theme = themed ? CATEGORY_THEMES[themed.key] : null;
                  return (
                    <span
                      key={b}
                      style={{
                        background: theme ? theme.chipBg : '#f9fafb',
                        border: `1px solid ${theme ? theme.chipBorder : '#e5e7eb'}`,
                        color: theme ? theme.chipText : '#374151',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      {b}
                    </span>
                  );
                })()
              ))}
            </div>
          </div>
        </div>

        {offer.debug?.estDistanceMiles != null ? (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '2px solid rgba(15,23,42,0.12)', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#0f172a', fontWeight: 900 }}>
            <span>Miles: {Math.round(offer.debug.estDistanceMiles)}</span>
          </div>
        ) : null}

        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        backgroundColor: 'rgba(15,23,42,0.85)',
        backdropFilter: 'none',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '98vw',
          maxWidth: '98vw',
          maxHeight: '99vh',
          height: '98vh',
          background: '#f8fafc',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '10px 10px 0 #0f172a',
          border: '4px solid #0f172a',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 18px', borderBottom: '4px solid #0f172a', background: '#e2e8f0', position: 'relative' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start', justifyContent: 'space-between', paddingRight: '48px' }}>
            <div style={{ minWidth: 0, flex: '1 1 560px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', textShadow: '2px 2px 0 rgba(255,255,255,0.55)', lineHeight: '100%' }}>
                      {recruit.name}
                    </div>
                     <span style={{ ...headerStatPillBase, background: '#dbeafe', border: '2px solid #1d4ed8', color: '#1d4ed8' }}>
                      <span style={headerStatLabel}>Archetype</span>
                      <span style={headerStatValue}>{recruit.archetype || '-'}</span>
                    </span>
                    {topRecruit ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 900, background: '#86efac', color: '#0f172a', border: '2px solid #0f172a', boxShadow: '2px 2px 0 #0f172a' }}>
                        Top Recruit
                      </span>
                    ) : null}
                    {recruit.draftProjection && recruit.draftProjection !== 'Undrafted' ? (
                       <span style={{ ...infoPill, background: '#fef08a', borderColor: '#eab308', color: '#854d0e', boxShadow: '2px 2px 0 #ca8a04' }}>
                          Draft: {recruit.draftProjection}
                       </span>
                    ) : null}
                     {recruit.nbaComparable ? (
                       <span style={{ ...infoPill, background: '#fce7f3', borderColor: '#db2777', color: '#9d174d' }}>
                          Comp: {recruit.nbaComparable.name}
                       </span>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: 700, flexWrap: 'wrap' }}>
                    <span>{recruit.position}{recruit.secondaryPosition ? `/${recruit.secondaryPosition}` : ''}</span>
                    <span>•</span>
                    <span>
                         {typeof recruit.height === 'number' ? formatPlayerHeight(recruit.height) : '-'} / {recruit.weight ? `${recruit.weight} lbs` : '-'}
                         {recruit.wingspan ? ` / WS ${recruit.wingspan}"` : ''}
                    </span>
                    <span>•</span>
                    <span>
                      {[recruit.hometownCity, recruit.hometownState].filter(Boolean).join(', ')}
                      {recruit.highSchoolName ? ` — ${recruit.highSchoolName}` : ''}
                    </span>
                  </div>
                </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {recruit.nationalRank != null ? <span style={infoPill}>Nat #{recruit.nationalRank}</span> : null}
                {recruit.positionalRank != null ? <span style={infoPill}>Pos #{recruit.positionalRank}</span> : null}
                {typeof recruit.overall === 'number' ? <span style={infoPill}>Ovr {recruit.overall}</span> : null}
                {typeof recruit.potential === 'number' ? <span style={infoPill}>Pot {recruit.potential}</span> : null}
                {recruit.recruitmentStage ? <span style={stagePill}>Stage {recruit.recruitmentStage}</span> : null}
                
                {contactPointsMax > 0 ? (
                  <span
                    style={{ ...infoPill, background: '#e0f2fe', border: '2px solid #0ea5e9', color: '#0c4a6e' }}
                    title={`Contact points remaining: ${contactPointsRemaining}/${contactPointsMax} (used: ${contactPointsUsed})`}
                  >
                    CP {contactPointsRemaining}/{contactPointsMax}
                  </span>
                ) : null}
                <span style={{ ...infoPill, background: '#111827', border: '2px solid #111827', color: '#ffffff' }}>Interest {Math.round(recruit.interest)}/100</span>
                {topLeader && topLeader.name === userTeamName && (
                   <span style={{ ...infoPill, background: '#dcfce7', borderColor: '#16a34a', color: '#166534' }}>
                     Lead +{leaderDelta?.toFixed(1) ?? '0'}%
                   </span>
                )}
                {recruit.verbalCommitment ? (
                  <span style={{ ...infoPill, background: recruit.isSigned ? '#bbf7d0' : '#fef9c3', border: `2px solid ${recruit.isSigned ? '#16a34a' : '#fde68a'}`, color: recruit.isSigned ? '#14532d' : '#854d0e' }}>
                    {recruit.isSigned ? 'SIGNED' : `Verbal: ${recruit.verbalLevel}`}: {recruit.verbalCommitment}
                  </span>
                ) : null}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', rowGap: '6px', marginTop: '8px' }}>
                <span
                  style={{
                    ...headerStatPillBase,
                    background: recruit.dealbreaker && recruit.dealbreaker !== 'None' ? '#fee2e2' : '#f3f4f6',
                    border: `2px solid ${recruit.dealbreaker && recruit.dealbreaker !== 'None' ? '#dc2626' : '#6b7280'}`,
                    color: recruit.dealbreaker && recruit.dealbreaker !== 'None' ? '#b91c1c' : '#374151',
                  }}
                >
                  <span style={headerStatLabel}>Dealbreaker</span>
                  <span style={headerStatValue}>{recruit.dealbreaker || 'None'}</span>
                </span>

                <span style={{ ...headerStatPillBase, background: '#ecfdf5', border: '2px solid #16a34a', color: '#166534' }}>
                  <span style={headerStatLabel}>Resilience</span>
                  <span style={headerStatValue}>{recruit.resilience}</span>
                </span>

                <span style={{ ...headerStatPillBase, background: '#fff7ed', border: '2px solid #f97316', color: '#9a3412' }}>
                  <span style={headerStatLabel}>Hype</span>
                  <span style={headerStatValue}>{recruit.hypeLevel ?? '-'}</span>
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '4px 8px', background: '#ffffff', border: '2px solid #cbd5e1', borderRadius: '6px', boxShadow: '2px 2px 0 #cbd5e1' }} title="Recruit Priorities">
                   <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priorities</div>
                   <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '18px' }}>
                      {topFocus.sorted.map(s => {
                         const theme = CATEGORY_THEMES[s.key as MotivationKey];
                         const isTop = s.value >= 70;
                         return (
                           <div key={s.key} title={`${s.label}: ${s.value}`} style={{ width: '6px', height: '100%', background: '#f1f5f9', borderRadius: '2px', position: 'relative' }}>
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${s.value}%`, background: isTop ? theme.barFill : '#cbd5e1', borderRadius: '1px' }} />
                           </div>
                         );
                      })}
                   </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end', maxWidth: '420px' }}>
              {(recruit.playStyleTags || []).slice(0, 10).map(t => (
                <span key={t} style={tagChip}>{t}</span>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              border: '2px solid #0f172a',
              background: '#fde047',
              boxShadow: '2px 2px 0 #0f172a',
              cursor: 'pointer',
              color: '#0f172a',
              fontWeight: 900,
              fontSize: '18px',
              lineHeight: '18px',
            }}
            aria-label="Close"
            title="Close"
          >
            X
          </button>
        </div>

        <div style={{ flex: '1 1 auto', overflow: 'hidden', background: '#f3f4f6', padding: '0' }}>
          <div style={{ display: 'flex', gap: '0', alignItems: 'stretch', height: '100%' }}>
            <div style={{ flex: '7 1 0', minWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', height: '100%', padding: '18px' }}>

              {/* THE BOOK: Scouting Report */}
              <div style={{ ...sectionCard, padding: '16px', background: '#ffffff', borderLeft: '6px solid #4f46e5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4f46e5' }}>
                          Scouting Report
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>THE BOOK</div>
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#334155', fontWeight: 500 }}>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{recruit.name}</span> is a{' '}
                    <span style={{ fontWeight: 700 }}>{recruit.overall >= 80 ? 'dominant' : recruit.overall >= 70 ? 'solid' : 'developing'}</span>{' '}
                    {recruit.archetype?.toLowerCase()} from <span style={{ fontWeight: 700 }}>{recruit.hometownCity}</span>. {' '}
                    He thrives as a <span style={{ fontWeight: 700, color: '#4f46e5' }}>{recruit.playStyleTags?.[0] ?? 'prospect'}</span>, {' '}
                    with <span style={{ fontWeight: 700 }}>{recruit.stats.insideScoring > 70 ? 'elite finishing' : recruit.stats.outsideScoring > 70 ? 'knockdown shooting' : recruit.stats.playmaking > 70 ? 'superior vision' : 'balanced skills'}</span>. {' '}
                    {recruit.familyInfluenceNote ? <span>{recruit.familyInfluenceNote} </span> : ''}
                    Prone to {recruit.dealbreaker !== 'None' ? 'considering ' + recruit.dealbreaker.toLowerCase() + ' heavily' : 'being flexible'}.
                  </div>
              </div>


              <div style={{ ...sectionCard, padding: '14px 14px' }}>
                {eliteFitFail ? (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '2px solid #b91c1c',
                      background: '#fee2e2',
                      boxShadow: '2px 2px 0 #0f172a',
                      color: '#7f1d1d',
                    }}
                  >
                    <div style={{ fontWeight: 900, marginBottom: '4px' }}>DUKE ALERT: ELITE FIT FAILED</div>
                    <div style={{ opacity: 0.95 }}>
                      Academics preference too low or character risk flagged. High-prestige programs won&apos;t sign this recruit.
                    </div>
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                  {/* RECRUITING BATTLE */}
                  <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                     <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '8px' }}>
                          Recruiting Battle
                      </div>
                      
                      {topLeader ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* LEADER */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '10px', border: `2px solid ${teamColor(topLeader.name, 0)}` }}>
                                     1
                                  </div>
                                  <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                                          <span>{topLeader.name}</span>
                                          <span>{Math.round(topLeader.interestPct)}%</span>
                                      </div>
                                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                                          <div style={{ width: `${topLeader.interestPct}%`, height: '100%', background: teamColor(topLeader.name, 0) }} />
                                      </div>
                                  </div>
                              </div>
                              {/* RUNNER UP */}
                              {topRunnerUp ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.85 }}>
                                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', border: `2px solid ${teamColor(topRunnerUp.name, 1)}` }}>
                                         2
                                      </div>
                                      <div style={{ flex: 1 }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                                              <span>{topRunnerUp.name}</span>
                                              <span>{Math.round(topRunnerUp.interestPct)}%</span>
                                          </div>
                                          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                                              <div style={{ width: `${topRunnerUp.interestPct}%`, height: '100%', background: teamColor(topRunnerUp.name, 1) }} />
                                          </div>
                                      </div>
                                  </div>
                              ) : null}
                          </div>
                      ) : (
                          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#94a3b8' }}>No offers yet</div>
                      )}


                  </div>

                  <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                     <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '8px' }}>
                          Lock Status
                      </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 900 }}>Lock Strength</span>
                      <span style={{ color: '#6b7280', fontWeight: 900 }}>{Math.round((recruit.lockStrength || 0) * 100)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${clamp(Math.round((recruit.lockStrength || 0) * 100), 0, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)' }} />
                    </div>
                  </div>

                </div>
              </div>

   

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Shortlist</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{shortlistOfferDetails.length} Schools</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                {interestSorted.length ? interestSorted.map(offer => (
                  <OfferCard key={offer.name} offer={offer} />
                )) : <div style={{ color: '#6b7280' }}>No offers yet.</div>}
              </div>

              {longshotOfferDetails.length > 0 ? (
                <button
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px dashed #6b7280', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                  onClick={() => setShowLongshots(v => !v)}
                >
                  {showLongshots ? 'Hide' : 'Show'} Longshots ({longshotOfferDetails.length})
                </button>
              ) : null}

              {showLongshots && longshotOfferDetails.length > 0 ? (
                <div style={{ ...sectionCard, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827' }}>Longshots</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Chance · Prestige</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '11px', color: '#6b7280', paddingBottom: '8px', borderBottom: '1px dashed rgba(15, 23, 42, 0.22)' }}>
                    <span>School</span>
                    <span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
                      <span>Chance</span>
                      <span style={{ width: '74px', textAlign: 'right' }}>Prestige</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[...longshotOfferDetails]
                      .sort((a, b) => (b.interestPct - a.interestPct) || ((a.rank ?? 9999) - (b.rank ?? 9999)))
                      .map(o => {
                        const team = teamsByName.get(o.name);
                        const prestige = team?.prestige;
                        const prestigePill = prestige != null ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '74px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              border: '2px solid #0f172a',
                              boxShadow: '1px 1px 0 #0f172a',
                              background: prestige >= 85 ? '#86efac' : prestige >= 70 ? '#fde047' : '#e2e8f0',
                              color: '#0f172a',
                              fontSize: '11px',
                              fontWeight: 900,
                            }}
                            title={team?.conference ? `${o.name} (${team.conference}) Prestige ${prestige}` : `${o.name} Prestige ${prestige}`}
                          >
                            P {prestige}
                          </span>
                        ) : (
                          <span style={{ width: '74px', textAlign: 'right', color: '#9ca3af' }}>—</span>
                        );

                        return (
                          <div
                            key={o.name}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '10px',
                              fontSize: '13px',
                              color: '#374151',
                              padding: '4px 0',
                              borderTop: '1px solid rgba(148, 163, 184, 0.25)',
                            }}
                          >
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={team?.conference ? `${o.name} (${team.conference})` : o.name}>
                              {o.name}{o.rank ? ` (#${o.rank})` : ''}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ color: '#6b7280', fontWeight: 700 }}>{o.interestLabel}</span>
                              {prestigePill}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>

            <div style={{ flex: '3 1 0', minWidth: '460px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '2px solid #e2e8f0', background: '#f8fafc', overflowY: 'auto', height: '100%', padding: '18px' }}>
              {(onContactRecruit || onOfferScholarship || onPullOffer || onCoachVisit || onScheduleOfficialVisit || onScout || onNegativeRecruit) ? (
                <div style={{ ...sectionCard, padding: '14px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>Recruiting Actions</div>
                      {actionFeedback ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 900,
                            border: '2px solid #0f172a',
                            boxShadow: '2px 2px 0 #0f172a',
                            background: actionFeedback.tone === 'good' ? '#86efac' : actionFeedback.tone === 'bad' ? '#fecaca' : '#e2e8f0',
                            color: '#0f172a',
                          }}
                        >
                          {actionFeedback.text}
                        </span>
                      ) : null}
                    </div>
                    {contactPointsMax > 0 ? (
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 900 }}>
                        CP {contactPointsRemaining}/{contactPointsMax}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '10px' }}>
                    <button
                      style={actionButton(actionsLocked || !onContactRecruit || contactPointsRemaining < 1, recruit.userHasOffered ? 'neutral' : 'primary')}
                      onClick={() => {
                        setActionFeedback({ text: recruit.userHasOffered ? 'Maintain contact' : 'Contact made', tone: 'neutral' });
                        window.setTimeout(() => setActionFeedback(null), 1400);
                        onContactRecruit?.();
                      }}
                      disabled={actionsLocked || !onContactRecruit || contactPointsRemaining < 1}
                      title={recruit.userHasOffered ? 'Cheaper, less effective maintain contact' : 'Contact recruit'}
                    >
                      {recruit.userHasOffered ? 'Maintain (1)' : 'Contact (1)'}
                    </button>

                    {recruit.userHasOffered ? (
                      <button
                        style={actionButton(actionsLocked || !onPullOffer, 'danger')}
                        onClick={() => {
                          setActionFeedback({ text: 'Offer pulled', tone: 'neutral' });
                          window.setTimeout(() => setActionFeedback(null), 1800);
                          onPullOffer?.();
                        }}
                        disabled={actionsLocked || !onPullOffer}
                      >
                        Pull Offer
                      </button>
                    ) : (
                      <button
                        style={actionButton(actionsLocked || !onOfferScholarship || contactPointsRemaining < 9, 'primary')}
                        onClick={() => setShowOfferBuilder(v => !v)}
                        disabled={actionsLocked || !onOfferScholarship || contactPointsRemaining < 9}
                      >
                        {showOfferBuilder ? 'Close Offer' : 'Offer (9)'}
                      </button>
                    )}

                    <button
                      style={actionButton(actionsLocked || !onCoachVisit || contactPointsRemaining < 5, 'neutral')}
                      onClick={() => {
                        setActionFeedback({ text: 'Coach visit scheduled', tone: 'neutral' });
                        window.setTimeout(() => setActionFeedback(null), 1800);
                        onCoachVisit?.();
                      }}
                      disabled={actionsLocked || !onCoachVisit || contactPointsRemaining < 5}
                    >
                      Coach Visit (5)
                    </button>

                    <button
                      style={actionButton(actionsLocked || !onScheduleOfficialVisit || contactPointsRemaining < 8, 'neutral')}
                      onClick={() => {
                        setActionFeedback({ text: 'Official visit scheduled', tone: 'neutral' });
                        window.setTimeout(() => setActionFeedback(null), 1800);
                        onScheduleOfficialVisit?.();
                      }}
                      disabled={actionsLocked || !onScheduleOfficialVisit || contactPointsRemaining < 8}
                    >
                      Official Visit (8)
                    </button>

                    <button
                      style={actionButton(actionsLocked || !onScout || scoutLevel >= 3 || contactPointsRemaining < 3, 'neutral')}
                      onClick={() => {
                        setActionFeedback({ text: 'Scouting...', tone: 'neutral' });
                        window.setTimeout(() => setActionFeedback(null), 1800);
                        onScout?.();
                      }}
                      disabled={actionsLocked || !onScout || scoutLevel >= 3 || contactPointsRemaining < 3}
                    >
                      Scout ({scoutLevel}/3) (3)
                    </button>

                    <button
                      style={actionButton(actionsLocked || !onNegativeRecruit || contactPointsRemaining < 1, 'neutral')}
                      onClick={() => {
                        setActionFeedback({ text: 'Negative recruiting...', tone: 'neutral' });
                        window.setTimeout(() => setActionFeedback(null), 1800);
                        onNegativeRecruit?.();
                      }}
                      disabled={actionsLocked || !onNegativeRecruit || contactPointsRemaining < 1}
                    >
                      Negative (1)
                    </button>
                  </div>

                  {!recruit.userHasOffered && showOfferBuilder ? (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid rgba(15,23,42,0.12)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827' }}>Offer Scholarship</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        Choose a pitch type. This can change how the recruit evaluates your offer.
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#374151', fontWeight: 900 }}>
                        Projected Momentum Gain: {projectedMomentumPreview > 0 ? `+${projectedMomentumPreview}` : '--'}
                      </div>

                      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {OFFER_PITCH_OPTIONS.map(opt => {
                          const impact = PITCH_IMPACTS[opt.value];
                          const impactedKeys = impact.keys;
                          const primaryKey = impactedKeys[0];
                          const primaryTheme = primaryKey ? CATEGORY_THEMES[primaryKey] : null;
                          const isBest = opt.value === bestPitchType && impact.keys.length > 0;
                          const fitScore = impact.keys.length
                            ? Math.round((impact.keys.reduce((sum, k) => sum + motivations[k], 0) / impact.keys.length) * impact.coef)
                            : 0;
                          return (
                          <label
                            key={opt.value}
                            onMouseEnter={() => setHoverPitchType(opt.value)}
                            onMouseLeave={() => setHoverPitchType(null)}
                            style={{
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                              padding: '10px 10px',
                              borderRadius: '10px',
                              border: pitchType === opt.value ? '2px solid #0f172a' : '2px solid rgba(15,23,42,0.25)',
                              background: pitchType === opt.value ? (primaryTheme ? primaryTheme.chipBg : '#e0f2fe') : '#f8fafc',
                              boxShadow: pitchType === opt.value ? '2px 2px 0 #0f172a' : undefined,
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              checked={pitchType === opt.value}
                              onChange={() => setPitchType(opt.value)}
                              style={{ marginTop: '3px' }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '13px' }}>{opt.label}</div>
                                {primaryTheme ? (
                                  <span style={{ background: primaryTheme.chipBg, border: `1px solid ${primaryTheme.chipBorder}`, color: primaryTheme.chipText, borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 900 }}>
                                    Affects {primaryTheme.label} ({primaryKey ? motivations[primaryKey] : 0})
                                  </span>
                                ) : (
                                  <span style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 900 }}>
                                    Balanced
                                  </span>
                                )}
                                {isBest ? (
                                  <span style={{ background: '#86efac', border: '1px solid #16a34a', color: '#14532d', borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 900 }}>
                                    Best fit
                                  </span>
                                ) : null}
                              </div>
                              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{opt.desc}</div>
                              {impact.keys.length ? (
                                <div style={{ marginTop: '6px', fontSize: '11px', color: '#475569', fontWeight: 800 }}>
                                  Leverage score: {(fitScore / 100).toFixed(2)}
                                </div>
                              ) : null}
                              {isBest && strategicFit.reason && (
                                <div style={{ marginTop: '6px', fontSize: '11px', color: '#1e40af', fontStyle: 'italic', background: '#eff6ff', padding: '6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                  {strategicFit.reason}
                                </div>
                              )}
                            </div>
                          </label>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button style={actionButton(false, 'neutral')} onClick={() => setShowOfferBuilder(false)}>
                          Cancel
                        </button>
                        <button
                          style={actionButton(actionsLocked || !onOfferScholarship || contactPointsRemaining < 9, 'primary')}
                          disabled={actionsLocked || !onOfferScholarship || contactPointsRemaining < 9}
                          onClick={() => {
                            onOfferScholarship?.(pitchType);
                            setShowOfferBuilder(false);
                            setActionFeedback({ text: 'Offer sent', tone: 'neutral' });
                            window.setTimeout(() => setActionFeedback(null), 1800);
                          }}
                        >
                          Make Offer
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div style={{ ...sectionCard, padding: '14px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Recruit Details</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={tabButton(sideTab === 'profile')} onClick={() => setSideTab('profile')}>Profile</button>
                    <button style={tabButton(sideTab === 'timeline')} onClick={() => setSideTab('timeline')}>Timeline</button>
                    <button style={tabButton(sideTab === 'links')} onClick={() => setSideTab('links')}>Links</button>
                    {mutualPackageOfferSchools.length ? (
                      <button style={tabButton(sideTab === 'package')} onClick={() => setSideTab('package')}>Package</button>
                    ) : null}
                  </div>
                </div>

                {sideTab === 'profile' && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ marginTop: '0px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827' }}>What Matters</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>weights</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                        {motivationItems.map(item => {
                          const value = recruit.motivations ? recruit.motivations[item.key] : 50;
                          return (
                            <div key={item.key}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 800 }} title={item.title}>{item.label}</span>
                                <span style={{ color: '#6b7280', fontWeight: 900 }}>{value}</span>
                              </div>
                              <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${clamp(value, 0, 100)}%`, height: '100%', background: CATEGORY_THEMES[item.key].barFill }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {sideTab === 'timeline' && (
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#374151' }}>
                    {(recruit.offerHistory?.length || 0) > 0 ? (
                      <>
                        <div style={{ fontWeight: 900, color: '#111827', marginBottom: '6px' }}>Offers</div>
                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                          {[...(recruit.offerHistory || [])].slice(-12).reverse().map((e, idx) => (
                            <li key={`${e.teamName}-${e.week}-${idx}`} style={{ opacity: e.revoked ? 0.7 : 1 }}>
                              {e.date ? `${e.date}: ` : `Week ${e.week}: `}{e.teamName} - {e.pitchType}{e.revoked ? ' (revoked)' : ''}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : offerNames.length ? (
                      <>
                        <div style={{ fontWeight: 900, color: '#111827', marginBottom: '6px' }}>Current Offers</div>
                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                          {sortedRawOffers.slice(0, 12).map((o, idx) => (
                            <li key={`${o.name}-${idx}`}>
                              {o.name}{o.pitchType ? ` - ${o.pitchType}` : ''}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : <div style={{ color: '#6b7280' }}>No offer history yet.</div>}

                    {(recruit.visitHistory?.length || 0) > 0 ? (
                      <>
                        <div style={{ fontWeight: 900, color: '#111827', margin: '12px 0 6px 0' }}>Visits</div>
                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                          {[...(recruit.visitHistory || [])].slice(-12).reverse().map((e, idx) => (
                            <li key={`${e.teamName}-${e.week}-${idx}`}>
                              Week {e.week}: {e.kind} - {e.teamName}{e.outcome ? ` (${e.outcome})` : ''}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                )}

                {sideTab === 'links' && (
                  <div style={{ marginTop: '12px' }}>
                    {recruit.relationships?.length ? (
                      <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', padding: '10px 12px', color: '#1f2937' }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827', marginBottom: '6px' }}>Connections</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#1f2937' }}>
                          {recruit.relationships.slice(0, 10).map((rel, idx) => (
                            <li key={`${rel.personId}-${idx}`}>
                              <strong>{rel.type}:</strong>{' '}
                              {rel.sportLevel === 'HS' && typeof onOpenRecruit === 'function' ? (
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onOpenRecruit(rel.personId);
                                  }}
                                  style={{ color: '#0f172a', textDecoration: 'none', cursor: 'pointer' }}
                                >
                                  {rel.displayName}
                                </a>
                              ) : (
                                <span>{rel.displayName}</span>
                              )}
                              {rel.teamName ? ` (${rel.teamName})` : ''}
                              {rel.notes ? ` - ${rel.notes}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div style={{ color: '#6b7280', fontSize: '13px' }}>No known relationships.</div>
                    )}
                  </div>
                )}

                {sideTab === 'package' && (
                  <div style={{ marginTop: '12px' }}>
                    {mutualPackageOfferSchools.length ? (
                      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '10px 12px', color: '#1f2937' }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827', marginBottom: '6px' }}>Mutual Package Offers</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Schools that offered both {recruit.name} and {packagePartners[0]?.name}{packagePartners.length > 1 ? ' (and others)' : ''}.
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#1f2937', columns: mutualPackageOfferSchools.length > 8 ? 2 : 1 }}>
                          {mutualPackageOfferSchools.map(name => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                        {packagePartners.length && typeof onOpenRecruit === 'function' ? (
                          <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                            Open partner:{' '}
                            {packagePartners.slice(0, 3).map((p, idx) => (
                              <span key={p.id}>
                                <a
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); onOpenRecruit(p.id); }}
                                  style={{ color: '#0f172a', textDecoration: 'none', cursor: 'pointer', fontWeight: 800 }}
                                >
                                  {p.name}
                                </a>
                                {idx < Math.min(3, packagePartners.length) - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div style={{ color: '#6b7280', fontSize: '13px' }}>No mutual package offers yet.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
