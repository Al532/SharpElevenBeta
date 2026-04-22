// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').EmbeddedPlaybackApiClient} EmbeddedPlaybackApiClient */
/** @typedef {import('../types/contracts').PlaybackSessionAdapter} PlaybackSessionAdapter */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

/**
 * Creates a playback-session adapter backed by the legacy embedded playback API.
 * Keeping this boundary in `core/playback` makes it easier to replace the
 * iframe-specific API client later without rewriting chart-side transport code.
 *
 * @param {{
 *   apiClient: EmbeddedPlaybackApiClient,
 *   buildPatternPayload: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => EmbeddedPatternPayload
 * }} options
 * @returns {PlaybackSessionAdapter}
 */
export function createEmbeddedPlaybackSessionAdapter({
  apiClient,
  buildPatternPayload
}) {
  if (!apiClient || typeof apiClient !== 'object') {
    throw new Error('An embedded playback API client is required.');
  }
  if (typeof buildPatternPayload !== 'function') {
    throw new Error('A pattern payload builder is required.');
  }

  return {
    async loadSession(sessionSpec, playbackSettings) {
      const embeddedApi = await apiClient.ensureApi();
      return embeddedApi.applyEmbeddedPattern(buildPatternPayload(sessionSpec, playbackSettings || {}));
    },
    async updatePlaybackSettings(playbackSettings, sessionSpec) {
      const embeddedApi = await apiClient.ensureApi();
      const payload = buildPatternPayload(sessionSpec, playbackSettings || {});
      return embeddedApi.applyEmbeddedPlaybackSettings({
        ...playbackSettings,
        tempo: payload.tempo,
        transposition: payload.transposition,
        repetitionsPerKey: payload.repetitionsPerKey,
        displayMode: payload.displayMode,
        harmonyDisplayMode: payload.harmonyDisplayMode,
        showBeatIndicator: payload.showBeatIndicator,
        hideCurrentHarmony: payload.hideCurrentHarmony,
        compingStyle: payload.compingStyle,
        drumsMode: payload.drumsMode,
        customMediumSwingBass: payload.customMediumSwingBass,
        masterVolume: payload.masterVolume,
        bassVolume: payload.bassVolume,
        stringsVolume: payload.stringsVolume,
        drumsVolume: payload.drumsVolume
      });
    },
    async start() {
      const embeddedApi = await apiClient.ensureApi();
      return embeddedApi.startPlayback();
    },
    async stop() {
      const embeddedApi = apiClient.getApi();
      return embeddedApi ? embeddedApi.stopPlayback() : { ok: true, state: {} };
    },
    async pauseToggle() {
      const embeddedApi = await apiClient.ensureApi();
      return embeddedApi.togglePausePlayback();
    },
    getRuntimeState() {
      const embeddedApi = apiClient.getApi();
      return embeddedApi && typeof embeddedApi.getPlaybackState === 'function'
        ? embeddedApi.getPlaybackState()
        : null;
    }
  };
}
