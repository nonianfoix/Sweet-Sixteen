
import type { MotivationKey, OfferPitchType } from '../types';

export const OFFER_PITCH_OPTIONS: { value: OfferPitchType; label: string; desc: string }[] = [
  { value: 'Standard', label: 'Standard', desc: 'Balanced pitch.' },
  { value: 'EarlyPush', label: 'Early Push', desc: 'Press urgency and momentum early.' },
  { value: 'NILHeavy', label: 'NIL Heavy', desc: 'Lead with NIL opportunities.' },
  { value: 'PlayingTimePromise', label: 'Playing Time Promise', desc: 'Emphasize role clarity and minutes.' },
  { value: 'LocalAngle', label: 'Local Angle', desc: 'Family/proximity/hometown focus.' },
  { value: 'AcademicPitch', label: 'Academic Pitch', desc: 'Sell academics and support systems.' },
];

export const CATEGORY_THEMES: Record<MotivationKey, { label: string; chipBg: string; chipBorder: string; chipText: string; barFill: string }> = {
  playingTime: { label: 'Playing Time', chipBg: '#dbeafe', chipBorder: '#2563eb', chipText: '#1e3a8a', barFill: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)' },
  nil: { label: 'NIL Money', chipBg: '#dcfce7', chipBorder: '#16a34a', chipText: '#14532d', barFill: 'linear-gradient(90deg, #86efac 0%, #16a34a 100%)' },
  exposure: { label: 'Exposure', chipBg: '#ffedd5', chipBorder: '#f59e0b', chipText: '#92400e', barFill: 'linear-gradient(90deg, #fdba74 0%, #f59e0b 100%)' },
  proximity: { label: 'Proximity', chipBg: '#ede9fe', chipBorder: '#7c3aed', chipText: '#4c1d95', barFill: 'linear-gradient(90deg, #c4b5fd 0%, #7c3aed 100%)' },
  development: { label: 'Development', chipBg: '#cffafe', chipBorder: '#06b6d4', chipText: '#164e63', barFill: 'linear-gradient(90deg, #67e8f9 0%, #06b6d4 100%)' },
  academics: { label: 'Academics', chipBg: '#e0f2fe', chipBorder: '#0ea5e9', chipText: '#0c4a6e', barFill: 'linear-gradient(90deg, #7dd3fc 0%, #0ea5e9 100%)' },
  relationship: { label: 'Relationships', chipBg: '#ffe4e6', chipBorder: '#e11d48', chipText: '#881337', barFill: 'linear-gradient(90deg, #fda4af 0%, #e11d48 100%)' },
};

export const PITCH_IMPACTS: Record<OfferPitchType, { keys: MotivationKey[]; coef: number }> = {
  Standard: { keys: [], coef: 0 },
  EarlyPush: { keys: ['exposure'], coef: 2 },
  NILHeavy: { keys: ['nil'], coef: 8 },
  PlayingTimePromise: { keys: ['playingTime'], coef: 7 },
  LocalAngle: { keys: ['proximity'], coef: 7 },
  AcademicPitch: { keys: ['academics'], coef: 7 },
};
