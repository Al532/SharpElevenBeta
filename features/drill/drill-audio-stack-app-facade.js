// @ts-check

/**
 * Creates a thin app-facing facade around the composed drill audio stack so
 * callers can keep ergonomic methods and default timing behavior without
 * re-declaring lots of local wrapper functions in `app.js`.
 *
 * @param {object} [options]
 * @param {{
 *   audioRuntime?: Record<string, any>,
 *   samplePreload?: Record<string, any>,
 *   scheduledAudio?: Record<string, any>,
 *   audioPlayback?: Record<string, any>,
 *   samplePlayback?: Record<string, any>
 * }} [options.audioStack]
 * @param {() => number} [options.getCurrentTime]
 * @param {number} [options.defaultFadeDuration]
 */
export function createDrillAudioStackAppFacade({
  audioStack = {},
  getCurrentTime = () => 0,
  defaultFadeDuration = 0.25
} = {}) {
  const audioRuntime = audioStack.audioRuntime || {};
  const samplePreload = audioStack.samplePreload || {};
  const scheduledAudio = audioStack.scheduledAudio || {};
  const audioPlayback = audioStack.audioPlayback || {};
  const samplePlayback = audioStack.samplePlayback || {};

  return {
    applyMixerSettings: audioRuntime.applyMixerSettings,
    loadSample: audioRuntime.loadSample,
    loadPianoSample: audioRuntime.loadPianoSample,
    loadPianoSampleList: audioRuntime.loadPianoSampleList,
    loadFileSample: audioRuntime.loadFileSample,
    fetchArrayBufferFromUrl: audioRuntime.fetchArrayBufferFromUrl,
    loadBufferFromUrl: audioRuntime.loadBufferFromUrl,
    resumeAudioContext: audioPlayback.resumeAudioContext,
    suspendAudioContext: audioPlayback.suspendAudioContext,
    getAudioContextState: audioPlayback.getAudioContextState,
    preloadSamples: samplePreload.preloadSamples,
    preloadStartupSamples: samplePreload.preloadStartupSamples,
    preloadNearTermSamples: samplePreload.preloadNearTermSamples,
    ensureNearTermSamplePreload: samplePreload.ensureNearTermSamplePreload,
    ensurePageSampleWarmup: samplePreload.ensurePageSampleWarmup,
    ensureBackgroundSamplePreload: samplePreload.ensureBackgroundSamplePreload,
    getNearTermSamplePreloadPromise: samplePreload.getNearTermSamplePreloadPromise,
    setNearTermSamplePreloadPromise: samplePreload.setNearTermSamplePreloadPromise,
    getStartupSamplePreloadInProgress: samplePreload.getStartupSamplePreloadInProgress,
    setStartupSamplePreloadInProgress: samplePreload.setStartupSamplePreloadInProgress,
    getPendingDisplayTimeouts: scheduledAudio.getPendingDisplayTimeouts,
    initAudio: audioPlayback.initAudio,
    initMixerNodes: audioPlayback.initMixerNodes,
    getMixerDestination: audioPlayback.getMixerDestination,
    playClick: audioPlayback.playClick,
    playDrumSample: audioPlayback.playDrumSample,
    playHiHat: audioPlayback.playHiHat,
    getNextRideSampleName: audioPlayback.getNextRideSampleName,
    playRide: audioPlayback.playRide,
    scheduleDrumsForBeat: audioPlayback.scheduleDrumsForBeat,
    getNearestLoadedBassSampleMidi: samplePlayback.getNearestLoadedBassSampleMidi,
    getAdaptiveBassFadeDuration: samplePlayback.getAdaptiveBassFadeDuration,
    scheduleBassGainRelease: samplePlayback.scheduleBassGainRelease,
    playNote: samplePlayback.playNote,
    scheduleSampleSegment: samplePlayback.scheduleSampleSegment,
    playLoopedStringSample: samplePlayback.playLoopedStringSample,
    playSample: samplePlayback.playSample,
    trackScheduledSource(source, gainNodes = []) {
      return scheduledAudio.trackScheduledSource?.(source, gainNodes);
    },
    clearScheduledDisplays() {
      return scheduledAudio.clearScheduledDisplays?.();
    },
    stopScheduledAudio(stopTime = getCurrentTime()) {
      return scheduledAudio.stopScheduledAudio?.(stopTime);
    },
    stopActiveChordVoices(stopTime = getCurrentTime(), fadeDuration = defaultFadeDuration) {
      return scheduledAudio.stopActiveChordVoices?.(stopTime, fadeDuration);
    }
  };
}
