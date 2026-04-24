
type DrillPlaybackHelperBindings = Record<string, unknown>;

export function createDrillPlaybackSchedulerHelpers(helpers: DrillPlaybackHelperBindings = {}) {
  return {
    applyDisplaySideLayout: helpers.applyDisplaySideLayout,
    buildPreparedBassPlan: helpers.buildPreparedBassPlan,
    buildLegacyVoicingPlan: helpers.buildLegacyVoicingPlan,
    buildLoopRepVoicings: helpers.buildLoopRepVoicings,
    buildPreparedCompingPlans: helpers.buildPreparedCompingPlans,
    buildVoicingPlanForSlots: helpers.buildVoicingPlanForSlots,
    bassMidiToNoteName: helpers.bassMidiToNoteName,
    canLoopTrimProgression: helpers.canLoopTrimProgression,
    chordSymbolHtml: helpers.chordSymbolHtml,
    chordSymbol: helpers.chordSymbol,
    compingEngine: helpers.compingEngine,
    createOneChordToken: helpers.createOneChordToken,
    createVoicingSlot: helpers.createVoicingSlot,
    fitHarmonyDisplay: helpers.fitHarmonyDisplay,
    getBassMidi: helpers.getBassMidi,
    getBeatsPerChord: helpers.getBeatsPerChord,
    getChordsPerBar: helpers.getChordsPerBar,
    getCompingStyle: helpers.getCompingStyle,
    getCurrentPatternString: helpers.getCurrentPatternString,
    getPatternKeyOverridePitchClass: helpers.getPatternKeyOverridePitchClass,
    isWalkingBassDebugEnabled: helpers.isWalkingBassDebugEnabled,
    getRemainingBeatsUntilNextProgression: helpers.getRemainingBeatsUntilNextProgression,
    getRepetitionsPerKey: helpers.getRepetitionsPerKey,
    getSecondsPerBeat: helpers.getSecondsPerBeat,
    hideNextCol: helpers.hideNextCol,
    ensureNearTermSamplePreload: helpers.ensureNearTermSamplePreload,
    isWalkingBassEnabled: helpers.isWalkingBassEnabled,
    isChordsEnabled: helpers.isChordsEnabled,
    isVoiceLeadingV2Enabled: helpers.isVoiceLeadingV2Enabled,
    keyName: helpers.keyName,
    nextKey: helpers.nextKey,
    padProgression: helpers.padProgression,
    parseOneChordSpec: helpers.parseOneChordSpec,
    parsePattern: helpers.parsePattern,
    playClick: helpers.playClick,
    playNote: helpers.playNote,
    keyNameHtml: helpers.keyNameHtml,
    renderAccidentalTextHtml: helpers.renderAccidentalTextHtml,
    scheduleDrumsForBeat: helpers.scheduleDrumsForBeat,
    shouldShowNextPreview: helpers.shouldShowNextPreview,
    showNextCol: helpers.showNextCol,
    takeNextOneChordQuality: helpers.takeNextOneChordQuality,
    trackProgressionOccurrence: helpers.trackProgressionOccurrence,
    updateBeatDots: helpers.updateBeatDots
  };
}

export function createDrillPlaybackTransportHelpers(helpers: DrillPlaybackHelperBindings = {}) {
  return {
    applyDisplaySideLayout: helpers.applyDisplaySideLayout,
    clearBeatDots: helpers.clearBeatDots,
    clearScheduledDisplays: helpers.clearScheduledDisplays,
    ensureWalkingBassGenerator: helpers.ensureWalkingBassGenerator,
    ensureNearTermSamplePreload: helpers.ensureNearTermSamplePreload,
    ensureSessionStarted: helpers.ensureSessionStarted,
    fitHarmonyDisplay: helpers.fitHarmonyDisplay,
    getPlaybackAnalyticsProps: helpers.getPlaybackAnalyticsProps,
    getProgressionAnalyticsProps: helpers.getProgressionAnalyticsProps,
    hideNextCol: helpers.hideNextCol,
    initAudio: helpers.initAudio,
    preloadStartupSamples: helpers.preloadStartupSamples,
    registerSessionAction: helpers.registerSessionAction,
    setDisplayPlaceholderMessage: helpers.setDisplayPlaceholderMessage,
    setDisplayPlaceholderVisible: helpers.setDisplayPlaceholderVisible,
    stopActiveComping: helpers.stopActiveComping,
    stopScheduledAudio: helpers.stopScheduledAudio,
    trackEvent: helpers.trackEvent,
    trackProgressionEvent: helpers.trackProgressionEvent
  };
}


