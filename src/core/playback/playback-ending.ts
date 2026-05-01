export const PLAYBACK_ENDING_STYLES = Object.freeze({
  onbeatLong: 'onbeat_long',
  offbeatLong: 'offbeat_long',
  short: 'short'
});

export const DEFAULT_PLAYBACK_ENDING_CONFIG = Object.freeze({
  onbeatLongMaxBpm: 85,
  shortMinBpm: 170,
  longHoldMs: 4000,
  shortTailStopDelaySeconds: 1,
  shortTailFadeTimeConstantSeconds: 0.24,
  shortAccentMultiplier: 2,
  shortFinalAccentMultiplier: 2,
  shortCrescendoLeadMeasures: 2
});

type PlaybackEndingStyleThresholds = {
  onbeatLongMaxBpm?: number | null;
  shortMinBpm?: number | null;
};

function normalizePlaybackEndingStyle(value: unknown): string | null {
  const style = String(value || '').trim();
  return (Object.values(PLAYBACK_ENDING_STYLES) as string[]).includes(style)
    ? style
    : null;
}

function normalizeThreshold(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolvePlaybackEndingStyle({
  tempo = 120,
  forceLong = false,
  style = null,
  thresholds = {}
}: {
  tempo?: number | string | null;
  forceLong?: boolean;
  style?: string | null;
  thresholds?: PlaybackEndingStyleThresholds | null;
} = {}): string {
  const configuredStyle = normalizePlaybackEndingStyle(style);
  if (configuredStyle && (!forceLong || configuredStyle !== PLAYBACK_ENDING_STYLES.short)) {
    return configuredStyle;
  }

  const bpm = normalizeThreshold(tempo, 120);
  const onbeatLongMaxBpm = normalizeThreshold(
    thresholds?.onbeatLongMaxBpm,
    DEFAULT_PLAYBACK_ENDING_CONFIG.onbeatLongMaxBpm
  );
  const shortMinBpm = normalizeThreshold(
    thresholds?.shortMinBpm,
    DEFAULT_PLAYBACK_ENDING_CONFIG.shortMinBpm
  );

  if (bpm <= onbeatLongMaxBpm) return PLAYBACK_ENDING_STYLES.onbeatLong;
  if (!forceLong && bpm >= shortMinBpm) return PLAYBACK_ENDING_STYLES.short;
  return PLAYBACK_ENDING_STYLES.offbeatLong;
}

export function isLongPlaybackEndingStyle(style: unknown): boolean {
  return style === PLAYBACK_ENDING_STYLES.onbeatLong
    || style === PLAYBACK_ENDING_STYLES.offbeatLong;
}

export function isOffbeatPlaybackEndingStyle(style: unknown): boolean {
  return style === PLAYBACK_ENDING_STYLES.offbeatLong
    || style === PLAYBACK_ENDING_STYLES.short;
}
