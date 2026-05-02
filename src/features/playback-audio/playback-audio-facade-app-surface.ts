
import type { PlaybackAudioFacadeLike } from './playback-audio-types.js';

/**
 * Materializes the app-local audio facade aliases consumed throughout
 * `app.js` while keeping the underlying audio facade unchanged.
 *
 * @param {PlaybackAudioFacadeLike} [playbackAudioFacade]
 * @returns {Record<string, unknown>}
 */
export function createPlaybackAudioFacadeAppSurface(
  playbackAudioFacade: PlaybackAudioFacadeLike = {}
) {
  return {
    applyPlaybackAudioMixerSettings: playbackAudioFacade.applyMixerSettings,
    loadPlaybackAudioSample: playbackAudioFacade.loadSample,
    loadPlaybackPianoSample: playbackAudioFacade.loadPianoSample,
    loadPlaybackPianoSampleList: playbackAudioFacade.loadPianoSampleList,
    loadPlaybackFileSample: playbackAudioFacade.loadFileSample,
    fetchPlaybackSampleArrayBuffer: playbackAudioFacade.fetchArrayBufferFromUrl,
    loadPlaybackBufferFromUrl: playbackAudioFacade.loadBufferFromUrl,
    touchPlaybackSampleBuffer: playbackAudioFacade.touchSampleBuffer,
    purgePlaybackSampleCategory: playbackAudioFacade.purgeSampleCategory,
    getPlaybackSampleCacheStats: playbackAudioFacade.getSampleCacheStats,
    resumePlaybackAudioContext: playbackAudioFacade.resumeAudioContext,
    suspendPlaybackAudioContext: playbackAudioFacade.suspendAudioContext,
    getPlaybackAudioContextState: playbackAudioFacade.getAudioContextState,
    preloadAllPlaybackSamples: playbackAudioFacade.preloadSamples,
    preloadPlaybackStartupSamples: playbackAudioFacade.preloadStartupSamples,
    preloadPlaybackNearTermSamples: playbackAudioFacade.preloadNearTermSamples,
    preparePlaybackCompingStyleSamples: playbackAudioFacade.prepareCompingStyleSamples,
    ensurePlaybackNearTermSamplePreload: playbackAudioFacade.ensureNearTermSamplePreload,
    ensurePlaybackPageSampleWarmup: playbackAudioFacade.ensurePageSampleWarmup,
    ensurePlaybackBackgroundSamplePreload: playbackAudioFacade.ensureBackgroundSamplePreload,
    getPlaybackNearTermSamplePreloadPromise: playbackAudioFacade.getNearTermSamplePreloadPromise,
    setPlaybackNearTermSamplePreloadPromise: playbackAudioFacade.setNearTermSamplePreloadPromise,
    getPlaybackStartupSamplePreloadInProgress: playbackAudioFacade.getStartupSamplePreloadInProgress,
    setPlaybackStartupSamplePreloadInProgress: playbackAudioFacade.setStartupSamplePreloadInProgress,
    trackPlaybackScheduledSource: playbackAudioFacade.trackScheduledSource,
    clearPlaybackScheduledDisplays: playbackAudioFacade.clearScheduledDisplays,
    stopPlaybackScheduledAudio: playbackAudioFacade.stopScheduledAudio,
    stopPlaybackActiveChordVoices: playbackAudioFacade.stopActiveChordVoices,
    getPlaybackPendingDisplayTimeouts: playbackAudioFacade.getPendingDisplayTimeouts,
    initPlaybackAudioPlayback: playbackAudioFacade.initAudio,
    initPlaybackMixerNodes: playbackAudioFacade.initMixerNodes,
    getPlaybackMixerDestination: playbackAudioFacade.getMixerDestination,
    playPlaybackClick: playbackAudioFacade.playClick,
    playPlaybackDrumSample: playbackAudioFacade.playDrumSample,
    playPlaybackHiHat: playbackAudioFacade.playHiHat,
    getNextPlaybackRideSampleName: playbackAudioFacade.getNextRideSampleName,
    playPlaybackRide: playbackAudioFacade.playRide,
    schedulePlaybackDrumsForBeat: playbackAudioFacade.scheduleDrumsForBeat,
    getPlaybackNearestLoadedBassSampleMidi: playbackAudioFacade.getNearestLoadedBassSampleMidi,
    getPlaybackAdaptiveBassFadeDuration: playbackAudioFacade.getAdaptiveBassFadeDuration,
    schedulePlaybackBassGainRelease: playbackAudioFacade.scheduleBassGainRelease,
    playPlaybackNote: playbackAudioFacade.playNote,
    schedulePlaybackSampleSegment: playbackAudioFacade.scheduleSampleSegment,
    playPlaybackLoopedStringSample: playbackAudioFacade.playLoopedStringSample,
    playPlaybackSample: playbackAudioFacade.playSample
  };
}


