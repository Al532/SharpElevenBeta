import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSessionAdapter,
  PlaybackSettings,
  PracticePlaybackControllerOptions,
  PracticeSessionSpec
} from '../types/contracts';

type CreatePracticePlaybackSessionAdapterOptions = PracticePlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
};

/**
 * Creates the playback-session adapter used by the in-page practice runtime.
 * This keeps runtime/audio orchestration behind the shared session-adapter
 * boundary used by chart playback and the practice trainer.
 *
 * @param {CreatePracticePlaybackSessionAdapterOptions} [options]
 * @returns {PlaybackSessionAdapter}
 */
export function createPracticePlaybackSessionAdapter({
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
  queuePerformanceCue,
  startPlayback,
  stopPlayback,
  togglePausePlayback
}: CreatePracticePlaybackSessionAdapterOptions = {}) {
  return {
    loadSession(sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) {
      return applyEmbeddedPattern({
        patternName: sessionSpec?.title || 'Imported session',
        patternString: sessionSpec?.playback?.enginePatternString || sessionSpec?.playback?.patternString || '',
        endingCue: sessionSpec?.playback?.endingCue || null,
        performanceMap: sessionSpec?.playback?.performanceMap || null,
        patternMode: 'both',
        tempo: sessionSpec?.tempo || playbackSettings?.tempo || null,
        transposition: playbackSettings?.transposition ?? null,
        compingStyle: playbackSettings?.compingStyle ?? null,
        drumsMode: playbackSettings?.drumsMode ?? null,
        customMediumSwingBass: playbackSettings?.customMediumSwingBass ?? null,
        repetitionsPerKey: playbackSettings?.repetitionsPerKey ?? 1,
        finitePlayback: playbackSettings?.finitePlayback
          ?? (sessionSpec?.origin?.mode === 'chart-document' || sessionSpec?.origin?.mode === 'chart-selection'),
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
    queuePerformanceCue(cue, sessionSpec, playbackSettings) {
      const cueSessionSpec = cue?.playbackSession && typeof cue.playbackSession === 'object'
        ? cue.playbackSession
        : sessionSpec;
      if (typeof queuePerformanceCue === 'function') {
        return queuePerformanceCue(cue, cueSessionSpec || null, playbackSettings || {});
      }
      return {
        ok: true,
        state: getEmbeddedPlaybackState?.(),
        cue
      };
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
