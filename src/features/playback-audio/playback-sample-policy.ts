import type { PlaybackSamplePolicy } from './playback-audio-types.js';

const MIB = 1024 * 1024;

export const ANDROID_PLAYBACK_SAMPLE_POLICY: PlaybackSamplePolicy = Object.freeze({
  target: 'android',
  compressedCache: 'none',
  backgroundPreload: 'off',
  nearTermMeasures: 2,
  decodedCacheMaxBytes: 128 * MIB,
  startupRideCount: 3
});

export const WEB_PLAYBACK_SAMPLE_POLICY: PlaybackSamplePolicy = Object.freeze({
  target: 'web',
  compressedCache: 'none',
  backgroundPreload: 'off',
  nearTermMeasures: 3,
  decodedCacheMaxBytes: 256 * MIB,
  startupRideCount: 3
});

type CapacitorLike = {
  isNativePlatform?: () => boolean;
};

export function resolvePlaybackSamplePolicy(capacitor?: CapacitorLike | null): PlaybackSamplePolicy {
  return capacitor?.isNativePlatform?.()
    ? ANDROID_PLAYBACK_SAMPLE_POLICY
    : WEB_PLAYBACK_SAMPLE_POLICY;
}
