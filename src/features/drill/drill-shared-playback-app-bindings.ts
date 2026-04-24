import type { DrillSharedPlaybackAppBindings } from './drill-shared-playback-types.js';

export function createDrillSharedPlaybackAppBindings({
  embedded = {},
  direct = {},
  publishDirectGlobals
}: {
  embedded?: DrillSharedPlaybackAppBindings['embedded'];
  direct?: DrillSharedPlaybackAppBindings['direct'];
  publishDirectGlobals?: boolean;
} = {}): DrillSharedPlaybackAppBindings {
  return {
    embedded,
    direct,
    publishDirectGlobals
  };
}
