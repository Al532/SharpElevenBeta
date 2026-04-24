
import type { PlaybackAudioFacadeLike } from './playback-audio-types.js';

/**
 * Materializes the app-local audio facade aliases consumed throughout
 * `app.js` while keeping the underlying audio facade unchanged.
 *
 * @param {PlaybackAudioFacadeLike} [drillAudioFacade]
 * @returns {Record<string, unknown>}
 */
export function createPlaybackAudioFacadeAppSurface(
  drillAudioFacade: PlaybackAudioFacadeLike = {}
) {
  return {
    applyPlaybackAudioMixerSettings: drillAudioFacade.applyMixerSettings,
    loadPlaybackAudioSample: drillAudioFacade.loadSample,
    loadDrillPianoSample: drillAudioFacade.loadPianoSample,
    loadDrillPianoSampleList: drillAudioFacade.loadPianoSampleList,
    loadDrillFileSample: drillAudioFacade.loadFileSample,
    fetchPlaybackSampleArrayBuffer: drillAudioFacade.fetchArrayBufferFromUrl,
    loadDrillBufferFromUrl: drillAudioFacade.loadBufferFromUrl,
    resumePlaybackAudioContext: drillAudioFacade.resumeAudioContext,
    suspendPlaybackAudioContext: drillAudioFacade.suspendAudioContext,
    getPlaybackAudioContextState: drillAudioFacade.getAudioContextState,
    preloadAllPlaybackSamples: drillAudioFacade.preloadSamples,
    preloadDrillStartupSamples: drillAudioFacade.preloadStartupSamples,
    preloadDrillNearTermSamples: drillAudioFacade.preloadNearTermSamples,
    ensureDrillNearTermSamplePreload: drillAudioFacade.ensureNearTermSamplePreload,
    ensureDrillPageSampleWarmup: drillAudioFacade.ensurePageSampleWarmup,
    ensureDrillBackgroundSamplePreload: drillAudioFacade.ensureBackgroundSamplePreload,
    getDrillNearTermSamplePreloadPromise: drillAudioFacade.getNearTermSamplePreloadPromise,
    setDrillNearTermSamplePreloadPromise: drillAudioFacade.setNearTermSamplePreloadPromise,
    getDrillStartupSamplePreloadInProgress: drillAudioFacade.getStartupSamplePreloadInProgress,
    setDrillStartupSamplePreloadInProgress: drillAudioFacade.setStartupSamplePreloadInProgress,
    trackDrillScheduledSource: drillAudioFacade.trackScheduledSource,
    clearDrillScheduledDisplays: drillAudioFacade.clearScheduledDisplays,
    stopPlaybackScheduledAudio: drillAudioFacade.stopScheduledAudio,
    stopDrillActiveChordVoices: drillAudioFacade.stopActiveChordVoices,
    getDrillPendingDisplayTimeouts: drillAudioFacade.getPendingDisplayTimeouts,
    initPlaybackAudioPlayback: drillAudioFacade.initAudio,
    initDrillMixerNodes: drillAudioFacade.initMixerNodes,
    getDrillMixerDestination: drillAudioFacade.getMixerDestination,
    playDrillClick: drillAudioFacade.playClick,
    playDrillDrumSample: drillAudioFacade.playDrumSample,
    playDrillHiHat: drillAudioFacade.playHiHat,
    getNextDrillRideSampleName: drillAudioFacade.getNextRideSampleName,
    playDrillRide: drillAudioFacade.playRide,
    scheduleDrillDrumsForBeat: drillAudioFacade.scheduleDrumsForBeat,
    getDrillNearestLoadedBassSampleMidi: drillAudioFacade.getNearestLoadedBassSampleMidi,
    getDrillAdaptiveBassFadeDuration: drillAudioFacade.getAdaptiveBassFadeDuration,
    scheduleDrillBassGainRelease: drillAudioFacade.scheduleBassGainRelease,
    playDrillNote: drillAudioFacade.playNote,
    schedulePlaybackSampleSegment: drillAudioFacade.scheduleSampleSegment,
    playDrillLoopedStringSample: drillAudioFacade.playLoopedStringSample,
    playPlaybackSample: drillAudioFacade.playSample
  };
}


