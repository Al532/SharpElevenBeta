import type {
  DrillPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionAdapter,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

type CreateDrillPlaybackSessionAdapterOptions = DrillPlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
};

/**
 * Creates the playback-session adapter used by Drill's in-page runtime.
 * This keeps Drill's runtime/audio-specific orchestration behind the same
 * session-adapter boundary used by the chart bridge.
 *
 * @param {CreateDrillPlaybackSessionAdapterOptions} [options]
 * @returns {PlaybackSessionAdapter}
 */
export function createDrillPlaybackSessionAdapter({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState,
  ensureWalkingBassGenerator,
  isPlaying,
  getAudioContext,
  noteFadeout,
  stopActiveChordVoices,
  rebuildPreparedCompingPlans,
  buildPreparedBassPlan,
  getCurrentKey,
  preloadNearTermSamples,
  validateCustomPattern,
  startPlayback,
  stopPlayback,
  togglePausePlayback
}: CreateDrillPlaybackSessionAdapterOptions = {}) {
  return {
    loadSession(sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) {
      return applyEmbeddedPattern({
        patternName: sessionSpec?.title || 'Imported session',
        patternString: sessionSpec?.playback?.enginePatternString || sessionSpec?.playback?.patternString || '',
        patternMode: 'both',
        tempo: sessionSpec?.tempo || playbackSettings?.tempo || null,
        transposition: playbackSettings?.transposition ?? null,
        compingStyle: playbackSettings?.compingStyle ?? null,
        drumsMode: playbackSettings?.drumsMode ?? null,
        customMediumSwingBass: playbackSettings?.customMediumSwingBass ?? null,
        repetitionsPerKey: playbackSettings?.repetitionsPerKey ?? 1,
        displayMode: playbackSettings?.displayMode ?? null,
        harmonyDisplayMode: playbackSettings?.harmonyDisplayMode ?? null,
        showBeatIndicator: playbackSettings?.showBeatIndicator ?? null,
        hideCurrentHarmony: playbackSettings?.hideCurrentHarmony ?? null,
        masterVolume: playbackSettings?.masterVolume ?? null,
        bassVolume: playbackSettings?.bassVolume ?? null,
        stringsVolume: playbackSettings?.stringsVolume ?? null,
        drumsVolume: playbackSettings?.drumsVolume ?? null
      });
    },
    async updatePlaybackSettings(playbackSettings: PlaybackSettings = {}, _sessionSpec: PracticeSessionSpec | null = null) {
      const result = applyEmbeddedPlaybackSettings(playbackSettings);
      if (playbackSettings.customMediumSwingBass === true) {
        try {
          await ensureWalkingBassGenerator?.();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Walking bass generator failed to load.';
          return {
            ok: false,
            errorMessage: message,
            state: getEmbeddedPlaybackState?.(),
            settings: result
          };
        }
      }

      const audioCtx = getAudioContext?.();
      if (isPlaying?.() && audioCtx) {
        if (playbackSettings.compingStyle !== null && playbackSettings.compingStyle !== undefined) {
          stopActiveChordVoices?.(audioCtx.currentTime, Number(noteFadeout || 0));
          rebuildPreparedCompingPlans?.(getCurrentKey?.());
        }
        if (playbackSettings.tempo !== null && playbackSettings.tempo !== undefined) {
          stopActiveChordVoices?.(audioCtx.currentTime, Number(noteFadeout || 0));
          rebuildPreparedCompingPlans?.(getCurrentKey?.());
          buildPreparedBassPlan?.();
        }
        if (playbackSettings.customMediumSwingBass !== null && playbackSettings.customMediumSwingBass !== undefined) {
          buildPreparedBassPlan?.();
        }
      }

      preloadNearTermSamples?.().catch(() => {});
      return {
        ok: true,
        state: getEmbeddedPlaybackState?.(),
        settings: result
      };
    },
    async start(_sessionSpec: PracticeSessionSpec | null = null, _playbackSettings: PlaybackSettings = {}) {
      const isValid = validateCustomPattern?.();
      if (!isValid) {
        return {
          ok: false,
          errorMessage: 'Invalid custom pattern',
          state: getEmbeddedPlaybackState?.()
        };
      }
      if (!isPlaying?.()) {
        await startPlayback?.();
      }
      return {
        ok: true,
        errorMessage: null,
        state: getEmbeddedPlaybackState?.()
      };
    },
    stop(_sessionSpec: PracticeSessionSpec | null = null, _playbackSettings: PlaybackSettings = {}) {
      if (isPlaying?.()) {
        stopPlayback?.();
      }
      return {
        ok: true,
        state: getEmbeddedPlaybackState?.()
      };
    },
    pauseToggle(_sessionSpec: PracticeSessionSpec | null = null, _playbackSettings: PlaybackSettings = {}) {
      togglePausePlayback?.();
      return {
        ok: true,
        state: getEmbeddedPlaybackState?.()
      };
    },
    getRuntimeState() {
      return getEmbeddedPlaybackState?.();
    },
    subscribe(listener) {
      listener(getEmbeddedPlaybackState?.() || {});
    }
  };
}
