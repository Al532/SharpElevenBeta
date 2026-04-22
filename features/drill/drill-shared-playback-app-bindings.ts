export function createDrillSharedPlaybackAppBindings({
  embedded = {},
  direct = {},
  publishDirectGlobals
}: {
  embedded?: Record<string, any>;
  direct?: Record<string, any>;
  publishDirectGlobals?: boolean;
} = {}) {
  return {
    embedded,
    direct,
    publishDirectGlobals
  };
}
