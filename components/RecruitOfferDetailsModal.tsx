import React, { useMemo, useState } from 'react';
import type { Recruit, Team, TeamColors } from '../types';
import { SCHOOL_COLORS } from '../constants';
import { buildRecruitOfferShortlist, calculateRecruitInterestBreakdown, clamp } from '../services/gameService';

type Props = {
  recruit: Recruit;
  userTeamName: string;
  allTeams: Team[];
  gameInSeason: number;
  onClose: () => void;
  onOpenRecruit?: (recruitId: string) => void;
  contactPointsUsed?: number;
  contactPointsMax?: number;
  scoutLevel?: number;
  actionsDisabled?: boolean;
  onContactRecruit?: () => void;
  onOfferScholarship?: () => void;
  onPullOffer?: () => void;
  onCoachVisit?: () => void;
  onScheduleOfficialVisit?: () => void;
  onScout?: () => void;
  onNegativeRecruit?: () => void;
};

const formatPlayerHeight = (inches: number): string => {
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
};

const SCHOOL_LOGO_MODULES = import.meta.glob('../school logos/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const SCHOOL_LOGO_BY_SLUG = Object.fromEntries(
  Object.entries(SCHOOL_LOGO_MODULES).map(([modulePath, url]) => {
    const fileName = modulePath.split('/').pop() || '';
    const slug = fileName.replace(/\.svg$/i, '');
    return [slug, url];
  })
) as Record<string, string>;

const normalizeSchoolTokens = (name: string): string[] => {
  const raw = (name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const tokens = raw.length ? raw.split(/\s+/) : [];
  const normalized = tokens.map(t => {
    if (t === 'university') return 'u';
    if (t === 'state') return 'st';
    if (t === 'saint') return 'st';
    return t;
  });

  const merged: string[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const token = normalized[i]!;
    if (token.length === 1) {
      let combined = token;
      while (i + 1 < normalized.length && normalized[i + 1]!.length === 1) {
        combined += normalized[i + 1]!;
        i++;
      }
      merged.push(combined);
    } else {
      merged.push(token);
    }
  }
  return merged.filter(Boolean);
};

const schoolNameToBestSlug = (schoolName: string): string => {
  const tokens = normalizeSchoolTokens(schoolName);
  return tokens.join('-');
};

const getSchoolLogoUrl = (schoolName: string): string | undefined => {
  if (!schoolName) return undefined;

  const specialCases: Record<string, string> = {
    Miami: 'miami-fl',
    'Miami (OH)': 'miami-oh',
    Albany: 'albany-ny',
  };

  const direct = specialCases[schoolName];
  if (direct && SCHOOL_LOGO_BY_SLUG[direct]) return SCHOOL_LOGO_BY_SLUG[direct];

  const slug = schoolNameToBestSlug(schoolName);
  if (SCHOOL_LOGO_BY_SLUG[slug]) return SCHOOL_LOGO_BY_SLUG[slug];

  const prefixMatches = Object.keys(SCHOOL_LOGO_BY_SLUG)
    .filter(s => s === slug || s.startsWith(`${slug}-`))
    .sort((a, b) => a.length - b.length);
  if (prefixMatches.length) return SCHOOL_LOGO_BY_SLUG[prefixMatches[0]!]!;

  return undefined;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    if ([r, g, b].some(n => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    if ([r, g, b].some(n => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
};

const relativeLuminance = (rgb: { r: number; g: number; b: number }): number => {
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const rgbaFromHex = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamped = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamped})`;
};

const bestTextColor = (bgHex: string): string => {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return '#111827';
  return relativeLuminance(rgb) < 0.35 ? '#ffffff' : '#111827';
};

const teamColor = (teamName: string, index: number): string => {
  const palette = ['#2563eb', '#16a34a', '#7c3aed', '#f59e0b', '#dc2626', '#0ea5e9', '#0891b2', '#db2777'];
  const tc = (SCHOOL_COLORS as Record<string, TeamColors | undefined>)[teamName];
  const preferred = tc?.primary && tc.primary.toUpperCase() !== '#FFFFFF' ? tc.primary : tc?.secondary;
  return preferred || palette[index % palette.length]!;
};

const tierAccent = (tier: string) => {
  if (tier === 'Leader') return { border: '#22c55e', pillBg: '#dcfce7', pillText: '#166534', pct: '#16a34a' };
  if (tier === 'In The Mix') return { border: '#3b82f6', pillBg: '#dbeafe', pillText: '#1d4ed8', pct: '#2563eb' };
  if (tier === 'Chasing') return { border: '#fb923c', pillBg: '#ffedd5', pillText: '#9a3412', pct: '#374151' };
  return { border: '#9ca3af', pillBg: '#f3f4f6', pillText: '#374151', pct: '#374151' };
};

export default function RecruitOfferDetailsModal({
  recruit,
  userTeamName,
  allTeams,
  gameInSeason,
  onClose,
  onOpenRecruit,
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
  const [showLongshots, setShowLongshots] = useState(false);
  const temperature = 2.2; // fixed: max separation (Interest Spread 100%)
  const [sideTab, setSideTab] = useState<'profile' | 'timeline' | 'links'>('profile');

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
      { min: 3, max: 6, leaderWindow: 10, seedKey: `${recruit.id}:${gameInSeason}`, temperature }
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
  const actionsLocked = actionsDisabled || (!!recruit.verbalCommitment && recruit.verbalCommitment !== userTeamName) || recruit.declinedOffers?.includes(userTeamName);

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
    border: '1px solid #dbeafe',
    color: '#1d4ed8',
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
    whiteSpace: 'nowrap',
  });

  const motivationItems = [
    { key: 'playingTime', label: 'Playing Time' },
    { key: 'nil', label: 'NIL' },
    { key: 'exposure', label: 'Exposure' },
    { key: 'proximity', label: 'Proximity' },
    { key: 'development', label: 'Development' },
    { key: 'academics', label: 'Academics' },
    { key: 'relationship', label: 'Relationships' },
  ] as const;

  const OfferCard = ({ offer }: { offer: OfferView }) => {
    const accent = tierAccent(offer.tier);
    const tc = (SCHOOL_COLORS as Record<string, TeamColors | undefined>)[offer.name];
    const teamPrimary = tc?.primary || accent.border;
    const logoUrl = getSchoolLogoUrl(offer.name);
    const fitBadgeText = bestTextColor(teamPrimary);
    const cardBg = rgbaFromHex(teamPrimary, 0.12);
    const cardBorder = rgbaFromHex(teamPrimary, 0.22);
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
            <div style={{ fontWeight: 700, color: '#111827' }}>{offer.pitchType || '—'}</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Why</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
              {(offer.whyBadges || []).slice(0, 4).map(b => (
                <span key={b} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', color: '#374151', fontWeight: 700 }}>
                  {b}
                </span>
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
        padding: '16px',
        backgroundColor: 'rgba(15,23,42,0.80)',
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)',
        backdropFilter: 'none',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1560px',
          maxHeight: '95vh',
          background: '#f8fafc',
          backgroundImage:
            'linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px)',
          backgroundSize: '10px 10px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', textShadow: '2px 2px 0 rgba(255,255,255,0.55)' }}>
                  Offers for {recruit.name}
                </div>
                {topRecruit ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 900, background: '#86efac', color: '#0f172a', border: '2px solid #0f172a', boxShadow: '2px 2px 0 #0f172a' }}>
                    Top Recruit
                  </span>
                ) : null}
              </div>

              {(recruit.hometownCity || recruit.hometownState || recruit.highSchoolName) ? (
                <div style={{ marginTop: '6px', color: '#6b7280', fontSize: '13px' }}>
                  {[recruit.hometownCity, recruit.hometownState].filter(Boolean).join(', ')}
                  {recruit.highSchoolName ? ` - ${recruit.highSchoolName}` : ''}
                </div>
              ) : null}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {recruit.nationalRank != null ? <span style={infoPill}>Nat #{recruit.nationalRank}</span> : null}
                {recruit.positionalRank != null ? <span style={infoPill}>Pos #{recruit.positionalRank}</span> : null}
                {typeof recruit.overall === 'number' ? <span style={infoPill}>Ovr {recruit.overall}</span> : null}
                {typeof recruit.potential === 'number' ? <span style={infoPill}>Pot {recruit.potential}</span> : null}
                {recruit.recruitmentStage ? <span style={stagePill}>Stage {recruit.recruitmentStage}</span> : null}
                {typeof recruit.height === 'number' ? <span style={infoPill}>Ht {formatPlayerHeight(recruit.height)}</span> : null}
                {recruit.weight ? <span style={infoPill}>Wt {recruit.weight} lbs</span> : null}
                {recruit.wingspan ? <span style={infoPill}>WS {recruit.wingspan}&quot;</span> : null}
                <span style={{ ...infoPill, background: '#111827', borderColor: '#111827', color: '#ffffff' }}>Interest {recruit.interest}/100</span>
                {recruit.verbalCommitment ? (
                  <span style={{ ...infoPill, background: '#fef9c3', borderColor: '#fde68a', color: '#854d0e' }}>Verbal: {recruit.verbalCommitment}</span>
                ) : null}
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

        <div style={{ flex: '1 1 auto', overflowY: 'auto', background: '#f3f4f6', padding: '18px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 680px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recruit.lastRecruitingNews ? (
                <div style={{ ...sectionCard, padding: '12px 14px' }}>
                  <div style={{ fontSize: '13px', color: '#111827' }}>{recruit.lastRecruitingNews}</div>
                </div>
              ) : null}

              <div style={{ ...sectionCard, padding: '14px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: 900, color: '#111827' }}>Leader:</span>{' '}
                    <span style={{ color: '#374151' }}>{topLeader ? `${topLeader.name} (${topLeader.interestLabel})` : '—'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 900, color: '#111827' }}>Runner-up:</span>{' '}
                    <span style={{ color: '#374151' }}>{topRunnerUp ? `${topRunnerUp.name} (${topRunnerUp.interestLabel})` : '—'}</span>
                    {leaderDelta != null ? <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>+{leaderDelta.toFixed(1)}%</span> : null}
                  </div>
                </div>
                <div style={{ marginTop: '10px', height: '16px', width: '100%', display: 'flex', borderRadius: '999px', overflow: 'hidden', background: '#e5e7eb' }}>
                  {interestSorted.map((o, idx) => (
                    <div
                      key={o.name}
                      style={{ width: `${Math.max(0, o.interestPct)}%`, background: teamColor(o.name, idx), minWidth: o.interestPct > 0 ? '2px' : undefined }}
                      title={`${o.name} ${o.interestLabel}`}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                  {interestSorted.slice(0, 6).map((o, idx) => (
                    <div key={o.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '999px', background: teamColor(o.name, idx) }} />
                      <span style={{ color: '#374151', fontWeight: 700 }}>{o.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Shortlist</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{shortlistOfferDetails.length} Schools</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '12px' }}>
                {shortlistOfferDetails.length ? shortlistOfferDetails.map(offer => (
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
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Longshots</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {longshotOfferDetails.map(o => (
                      <div key={o.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px', color: '#374151' }}>
                        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.name}>
                          {o.name}{o.rank ? ` (#${o.rank})` : ''}
                        </span>
                        <span style={{ color: '#6b7280' }}>{o.interestLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div style={{ flex: '1 1 460px', minWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '12px', alignSelf: 'flex-start' }}>
              {(onContactRecruit || onOfferScholarship || onPullOffer || onCoachVisit || onScheduleOfficialVisit || onScout || onNegativeRecruit) ? (
                <div style={{ ...sectionCard, padding: '14px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>Recruiting Actions</div>
                    {contactPointsMax > 0 ? (
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 900 }}>
                        CP {contactPointsRemaining}/{contactPointsMax}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '10px' }}>
                    <button
                      style={actionButton(actionsLocked || !onContactRecruit || contactPointsRemaining < 1, recruit.userHasOffered ? 'neutral' : 'primary')}
                      onClick={onContactRecruit}
                      disabled={actionsLocked || !onContactRecruit || contactPointsRemaining < 1}
                      title={recruit.userHasOffered ? 'Cheaper, less effective maintain contact' : 'Contact recruit'}
                    >
                      {recruit.userHasOffered ? 'Maintain (1)' : 'Contact (1)'}
                    </button>

                    {recruit.userHasOffered ? (
                      <button
                        style={actionButton(actionsLocked || !onPullOffer, 'danger')}
                        onClick={onPullOffer}
                        disabled={actionsLocked || !onPullOffer}
                      >
                        Pull Offer
                      </button>
                    ) : (
                      <button
                        style={actionButton(actionsLocked || !onOfferScholarship || contactPointsRemaining < 9, 'primary')}
                        onClick={onOfferScholarship}
                        disabled={actionsLocked || !onOfferScholarship || contactPointsRemaining < 9}
                      >
                        Offer (9)
                      </button>
                    )}

                    <button
                      style={actionButton(actionsLocked || !onCoachVisit || contactPointsRemaining < 5, 'neutral')}
                      onClick={onCoachVisit}
                      disabled={actionsLocked || !onCoachVisit || contactPointsRemaining < 5}
                    >
                      Coach Visit (5)
                    </button>

                    <button
                      style={actionButton(actionsLocked || !onScheduleOfficialVisit || contactPointsRemaining < 8, 'neutral')}
                      onClick={onScheduleOfficialVisit}
                      disabled={actionsLocked || !onScheduleOfficialVisit || contactPointsRemaining < 8}
                    >
                      Official Visit (8)
                    </button>

                    <button
                      style={actionButton(actionsLocked || !onScout || scoutLevel >= 3 || contactPointsRemaining < 3, 'neutral')}
                      onClick={onScout}
                      disabled={actionsLocked || !onScout || scoutLevel >= 3 || contactPointsRemaining < 3}
                    >
                      Scout ({scoutLevel}/3) (3)
                    </button>

                    <button
                      style={actionButton(actionsLocked || !onNegativeRecruit || contactPointsRemaining < 1, 'neutral')}
                      onClick={onNegativeRecruit}
                      disabled={actionsLocked || !onNegativeRecruit || contactPointsRemaining < 1}
                    >
                      Negative (1)
                    </button>
                  </div>
                </div>
              ) : null}

              <div style={{ ...sectionCard, padding: '14px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>Recruit Details</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={tabButton(sideTab === 'profile')} onClick={() => setSideTab('profile')}>Profile</button>
                    <button style={tabButton(sideTab === 'timeline')} onClick={() => setSideTab('timeline')}>Timeline</button>
                    <button style={tabButton(sideTab === 'links')} onClick={() => setSideTab('links')}>Links</button>
                  </div>
                </div>

                {sideTab === 'profile' && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                      <div style={{ background: '#111827', color: '#fff', borderRadius: '12px', padding: '10px 10px' }}>
                        <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stars / Pos</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, marginTop: '4px' }}>{'\u2605'.repeat(Math.max(0, Math.min(5, recruit.stars)))} / {recruit.position}{recruit.secondaryPosition ? `/${recruit.secondaryPosition}` : ''}</div>
                      </div>
                      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px 10px' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Archetype</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827', marginTop: '4px' }}>{recruit.archetype || '—'}</div>
                      </div>
                      <div style={{ background: recruit.dealbreaker && recruit.dealbreaker !== 'None' ? '#fef2f2' : '#ffffff', border: `1px solid ${recruit.dealbreaker && recruit.dealbreaker !== 'None' ? '#fecaca' : '#e5e7eb'}`, borderRadius: '12px', padding: '10px 10px' }}>
                        <div style={{ fontSize: '10px', color: recruit.dealbreaker && recruit.dealbreaker !== 'None' ? '#b91c1c' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dealbreaker</div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: recruit.dealbreaker && recruit.dealbreaker !== 'None' ? '#b91c1c' : '#111827', marginTop: '4px' }}>{recruit.dealbreaker || '—'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginTop: '10px' }}>
                      <div style={{ ...infoPill, borderRadius: '12px', padding: '10px 10px' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resilience</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '4px' }}>{recruit.resilience}</div>
                      </div>
                      <div style={{ ...infoPill, borderRadius: '12px', padding: '10px 10px' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coachability</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '4px' }}>{recruit.coachability ?? '—'}</div>
                      </div>
                      <div style={{ ...infoPill, borderRadius: '12px', padding: '10px 10px' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hype</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827', marginTop: '4px' }}>{recruit.hypeLevel ?? '—'}</div>
                      </div>
                      <div style={{ ...infoPill, borderRadius: '12px', padding: '10px 10px' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>NIL</div>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#111827', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{recruit.nilPriority || '—'}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
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
                                <span style={{ fontWeight: 800 }}>{item.label}</span>
                                <span style={{ color: '#6b7280', fontWeight: 900 }}>{value}</span>
                              </div>
                              <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${clamp(value, 0, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)' }} />
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
                              Week {e.week}: {e.teamName} - {e.pitchType}{e.revoked ? ' (revoked)' : ''}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
