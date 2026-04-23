// @ts-check

/**
 * Materializes the app-local audio facade aliases consumed throughout
 * `app.js` while keeping the underlying audio facade unchanged.
 *
 * @param {Record<string, any>} [drillAudioFacade]
 * @returns {Record<string, any>}
 */
export function createDrillAudioFacadeAppSurface(drillAudioFacade = {}) {
  return {
    applyDrillAudioMixerSettings: drillAudioFacade.applyMixerSettings,
    loadDrillAudioSample: drillAudioFacade.loadSample,
    loadDrillPianoSample: drillAudioFacade.loadPianoSample,
    loadDrillPianoSampleList: drillAudioFacade.loadPianoSampleList,
    loadDrillFileSample: drillAudioFacade.loadFileSample,
    fetchDrillSampleArrayBuffer: drillAudioFacade.fetchArrayBufferFromUrl,
    loadDrillBufferFromUrl: drillAudioFacade.loadBufferFromUrl,
    resumeDrillAudioContext: drillAudioFacade.resumeAudioContext,
    suspendDrillAudioContext: drillAudioFacade.suspendAudioContext,
    getDrillAudioContextState: drillAudioFacade.getAudioContextState,
    preloadAllDrillSamples: drillAudioFacade.preloadSamples,
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
    stopDrillScheduledAudio: drillAudioFacade.stopScheduledAudio,
    stopDrillActiveChordVoices: drillAudioFacade.stopActiveChordVoices,
    getDrillPendingDisplayTimeouts: drillAudioFacade.getPendingDisplayTimeouts,
    initDrillAudioPlayback: drillAudioFacade.initAudio,
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
    scheduleDrillSampleSegment: drillAudioFacade.scheduleSampleSegment,
    playDrillLoopedStringSample: drillAudioFacade.playLoopedStringSample,
    playDrillSample: drillAudioFacade.playSample
  };
}
