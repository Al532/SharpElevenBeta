import { createPlaybackSessionController } from '../../core/playback/playback-session-controller.js';

export function createDrillPlaybackController({
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
} = {}) {
  return createPlaybackSessionController({
    adapter: {
      loadSession(sessionSpec, playbackSettings) {
        return applyEmbeddedPattern({
          patternName: sessionSpec?.title || 'Imported session',
          patternString: sessionSpec?.playback?.enginePatternString || sessionSpec?.playback?.patternString || '',
          patternMode: 'both',
          tempo: sessionSpec?.tempo || playbackSettings?.tempo || null,
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
      async updatePlaybackSettings(playbackSettings = {}) {
        const result = applyEmbeddedPlaybackSettings(playbackSettings);
        if (playbackSettings.customMediumSwingBass === true) {
          try {
            await ensureWalkingBassGenerator();
          } catch (error) {
            return {
              ok: false,
              errorMessage: error?.message || 'Walking bass generator failed to load.',
              state: getEmbeddedPlaybackState(),
              settings: result
            };
          }
        }
        const audioCtx = getAudioContext();
        if (isPlaying() && audioCtx) {
          if (playbackSettings.compingStyle !== null && playbackSettings.compingStyle !== undefined) {
            stopActiveChordVoices(audioCtx.currentTime, noteFadeout);
            rebuildPreparedCompingPlans(getCurrentKey());
          }
          if (playbackSettings.tempo !== null && playbackSettings.tempo !== undefined) {
            stopActiveChordVoices(audioCtx.currentTime, noteFadeout);
            rebuildPreparedCompingPlans(getCurrentKey());
            buildPreparedBassPlan();
          }
          if (playbackSettings.customMediumSwingBass !== null && playbackSettings.customMediumSwingBass !== undefined) {
            buildPreparedBassPlan();
          }
        }
        preloadNearTermSamples().catch(() => {});
        return {
          ok: true,
          state: getEmbeddedPlaybackState(),
          settings: result
        };
      },
      async start() {
        const isValid = validateCustomPattern();
        if (!isValid) {
          return {
            ok: false,
            errorMessage: String('Invalid custom pattern'),
            state: getEmbeddedPlaybackState()
          };
        }
        if (!isPlaying()) {
          await startPlayback();
        }
        return {
          ok: true,
          errorMessage: null,
          state: getEmbeddedPlaybackState()
        };
      },
      stop() {
        if (isPlaying()) {
          stopPlayback();
        }
        return {
          ok: true,
          state: getEmbeddedPlaybackState()
        };
      },
      pauseToggle() {
        togglePausePlayback();
        return {
          ok: true,
          state: getEmbeddedPlaybackState()
        };
      },
      getRuntimeState() {
        return getEmbeddedPlaybackState();
      }
    }
  });
}
