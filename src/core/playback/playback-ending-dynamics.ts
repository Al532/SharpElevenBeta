import { DEFAULT_PLAYBACK_ENDING_CONFIG, PLAYBACK_ENDING_STYLES } from './playback-ending.js';

type PlaybackEndingDynamicCue = {
  style?: string | null;
  targetBeat?: number | null;
  targetChordIndex?: number | null;
};

type PlaybackEndingDynamicOptions = {
  endingCue?: PlaybackEndingDynamicCue | null;
  timeBeats?: number | null;
  beatsPerBar?: number | null;
  isFinalEnding?: boolean;
  targetMultiplier?: number | null;
  finalAccentMultiplier?: number | null;
  leadMeasures?: number | null;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getShortEndingDynamicMultiplier({
  endingCue = null,
  timeBeats = null,
  beatsPerBar = 4,
  isFinalEnding = false,
  targetMultiplier = DEFAULT_PLAYBACK_ENDING_CONFIG.shortAccentMultiplier,
  finalAccentMultiplier = DEFAULT_PLAYBACK_ENDING_CONFIG.shortFinalAccentMultiplier,
  leadMeasures = DEFAULT_PLAYBACK_ENDING_CONFIG.shortCrescendoLeadMeasures
}: PlaybackEndingDynamicOptions = {}): number {
  if (endingCue?.style !== PLAYBACK_ENDING_STYLES.short) return 1;

  const accent = Number.isFinite(Number(targetMultiplier)) && Number(targetMultiplier) > 0
    ? Number(targetMultiplier)
    : 1;
  const finalAccent = Number.isFinite(Number(finalAccentMultiplier)) && Number(finalAccentMultiplier) > 0
    ? Number(finalAccentMultiplier)
    : 1;
  if (isFinalEnding) return accent * finalAccent;

  const targetBeat = Number(endingCue.targetBeat ?? endingCue.targetChordIndex);
  const eventBeat = Number(timeBeats);
  if (!Number.isFinite(targetBeat) || !Number.isFinite(eventBeat)) return 1;

  const leadBeats = Math.max(1, Number(beatsPerBar || 4) * Math.max(0, Number(leadMeasures) || 0));
  const rampStartBeat = targetBeat - leadBeats;
  const progress = clamp01((eventBeat - rampStartBeat) / leadBeats);
  return 1 + ((accent - 1) * progress);
}
