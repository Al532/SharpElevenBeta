
export type PracticePlaybackRuntimeHostAssembly = {
  prepareNextProgressionPlayback: (...args: any[]) => any;
  scheduleBeatPlayback: (...args: any[]) => any;
  scheduleDisplayPlayback: (...args: any[]) => any;
  start: (...args: any[]) => any;
  stop: (...args: any[]) => any;
  togglePause: (...args: any[]) => any;
};

export type PracticePlaybackRuntimeHostAssemblyFactory = (
  options: Record<string, unknown>
) => PracticePlaybackRuntimeHostAssembly;

type CreatePracticePlaybackRuntimeHostOptions = {
  dom?: Record<string, unknown>;
  state?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  preload?: Record<string, unknown>;
  helpers?: Record<string, unknown>;
  constants?: {
    scheduleAhead?: number;
    noteFadeout?: number;
    scheduleInterval?: number;
    [key: string]: unknown;
  };
  createRuntimeAppAssembly?: PracticePlaybackRuntimeHostAssemblyFactory;
};

function requireRuntimeAppAssembly(
  createRuntimeAppAssembly?: PracticePlaybackRuntimeHostAssemblyFactory
) {
  if (!createRuntimeAppAssembly) {
    throw new Error('Practice playback runtime host adapter missing: createRuntimeAppAssembly.');
  }
  return createRuntimeAppAssembly;
}

/**
 * Creates the shared playback runtime host wiring from grouped app concerns.
 * This keeps the largest remaining playback-engine assembly out of `app.js`
 * and makes the future direct runtime bootstrap easier to reuse elsewhere.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.dom]
 * @param {Record<string, unknown>} [options.state]
 * @param {Record<string, unknown>} [options.audio]
 * @param {Record<string, unknown>} [options.preload]
 * @param {Record<string, unknown>} [options.helpers]
 * @param {Record<string, unknown>} [options.constants]
 */
export function createPracticePlaybackRuntimeHost({
  dom,
  state = {},
  audio = {},
  preload = {},
  helpers = {},
  constants = {},
  createRuntimeAppAssembly
}: CreatePracticePlaybackRuntimeHostOptions = {}): PracticePlaybackRuntimeHostAssembly {
  return requireRuntimeAppAssembly(createRuntimeAppAssembly)({
    dom,
    schedulerBindings: {
      getAudioContext: audio.getAudioContext,
      setAudioContext: audio.setAudioContext,
      getCurrentBassPlan: state.getCurrentBassPlan,
      setCurrentBassPlan: state.setCurrentBassPlan,
      getCurrentBeat: state.getCurrentBeat,
      setCurrentBeat: state.setCurrentBeat,
      getCurrentChordIdx: state.getCurrentChordIdx,
      setCurrentChordIdx: state.setCurrentChordIdx,
      getDisplayedCurrentBeat: state.getDisplayedCurrentBeat,
      setDisplayedCurrentBeat: state.setDisplayedCurrentBeat,
      getDisplayedCurrentChordIdx: state.getDisplayedCurrentChordIdx,
      setDisplayedCurrentChordIdx: state.setDisplayedCurrentChordIdx,
      getDisplayedIsIntro: state.getDisplayedIsIntro,
      setDisplayedIsIntro: state.setDisplayedIsIntro,
      getCurrentCompingPlan: state.getCurrentCompingPlan,
      setCurrentCompingPlan: state.setCurrentCompingPlan,
      getCurrentKey: state.getCurrentKey,
      setCurrentKey: state.setCurrentKey,
      getCurrentKeyRepetition: state.getCurrentKeyRepetition,
      setCurrentKeyRepetition: state.setCurrentKeyRepetition,
      getCurrentOneChordQualityValue: state.getCurrentOneChordQualityValue,
      setCurrentOneChordQualityValue: state.setCurrentOneChordQualityValue,
      getCurrentRawChords: state.getCurrentRawChords,
      setCurrentRawChords: state.setCurrentRawChords,
      getCurrentVoicingPlan: state.getCurrentVoicingPlan,
      setCurrentVoicingPlan: state.setCurrentVoicingPlan,
      getIsIntro: state.getIsIntro,
      setIsIntro: state.setIsIntro,
      getIsPaused: state.getIsPaused,
      getIsPlaying: state.getIsPlaying,
      getLastPlayedChordIdx: state.getLastPlayedChordIdx,
      setLastPlayedChordIdx: state.setLastPlayedChordIdx,
      getLoopVoicingTemplate: state.getLoopVoicingTemplate,
      setLoopVoicingTemplate: state.setLoopVoicingTemplate,
      getNextBeatTime: state.getNextBeatTime,
      setNextBeatTime: state.setNextBeatTime,
      getNextCompingPlan: state.getNextCompingPlan,
      setNextCompingPlan: state.setNextCompingPlan,
      getNextKeyValue: state.getNextKeyValue,
      setNextKeyValue: state.setNextKeyValue,
      getNextOneChordQualityValue: state.getNextOneChordQualityValue,
      setNextOneChordQualityValue: state.setNextOneChordQualityValue,
      getNextPaddedChords: state.getNextPaddedChords,
      setNextPaddedChords: state.setNextPaddedChords,
      getNextRawChords: state.getNextRawChords,
      setNextRawChords: state.setNextRawChords,
      getNextVoicingPlan: state.getNextVoicingPlan,
      setNextVoicingPlan: state.setNextVoicingPlan,
      getPaddedChords: state.getPaddedChords,
      setPaddedChords: state.setPaddedChords,
      getPendingDisplayTimeouts: preload.getPendingDisplayTimeouts
    },
    transportBindings: {
      getActiveNoteGain: audio.getActiveNoteGain,
      setActiveNoteGain: audio.setActiveNoteGain,
      getAudioContext: audio.getAudioContext,
      setAudioContext: audio.setAudioContext,
      getCurrentBeat: state.getCurrentBeat,
      setCurrentBeat: state.setCurrentBeat,
      getCurrentChordIdx: state.getCurrentChordIdx,
      setCurrentChordIdx: state.setCurrentChordIdx,
      getDisplayedCurrentBeat: state.getDisplayedCurrentBeat,
      setDisplayedCurrentBeat: state.setDisplayedCurrentBeat,
      getDisplayedCurrentChordIdx: state.getDisplayedCurrentChordIdx,
      setDisplayedCurrentChordIdx: state.setDisplayedCurrentChordIdx,
      getDisplayedIsIntro: state.getDisplayedIsIntro,
      setDisplayedIsIntro: state.setDisplayedIsIntro,
      getCurrentKeyRepetition: state.getCurrentKeyRepetition,
      setCurrentKeyRepetition: state.setCurrentKeyRepetition,
      getFirstPlayStartTracked: state.getFirstPlayStartTracked,
      setFirstPlayStartTracked: state.setFirstPlayStartTracked,
      getPlayStopSuggestionCount: state.getPlayStopSuggestionCount,
      setPlayStopSuggestionCount: state.setPlayStopSuggestionCount,
      getIsIntro: state.getIsIntro,
      setIsIntro: state.setIsIntro,
      getIsPaused: state.getIsPaused,
      setIsPaused: state.setIsPaused,
      getIsPlaying: state.getIsPlaying,
      setIsPlaying: state.setIsPlaying,
      getKeyPool: state.getKeyPool,
      setKeyPool: state.setKeyPool,
      getLoopVoicingTemplate: state.getLoopVoicingTemplate,
      setLoopVoicingTemplate: state.setLoopVoicingTemplate,
      getNearTermSamplePreloadPromise: preload.getNearTermSamplePreloadPromise,
      setNearTermSamplePreloadPromise: preload.setNearTermSamplePreloadPromise,
      getNextBeatTime: state.getNextBeatTime,
      setNextBeatTime: state.setNextBeatTime,
      getNextKeyValue: state.getNextKeyValue,
      setNextKeyValue: state.setNextKeyValue,
      getPaddedChords: state.getPaddedChords,
      setPaddedChords: state.setPaddedChords,
      getSchedulerTimer: state.getSchedulerTimer,
      setSchedulerTimer: state.setSchedulerTimer,
      getStartupSamplePreloadInProgress: preload.getStartupSamplePreloadInProgress,
      setStartupSamplePreloadInProgress: preload.setStartupSamplePreloadInProgress
    },
    scheduleAhead: constants.scheduleAhead,
    noteFadeout: constants.noteFadeout,
    scheduleInterval: constants.scheduleInterval,
    schedulerHelperBindings: {
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
      getPlaybackMeasurePlan: helpers.getPlaybackMeasurePlan,
      getMeasureInfoForChordIndex: helpers.getMeasureInfoForChordIndex,
      getCompingStyle: helpers.getCompingStyle,
      getCurrentPatternString: helpers.getCurrentPatternString,
      getPatternKeyOverridePitchClass: helpers.getPatternKeyOverridePitchClass,
      isWalkingBassDebugEnabled: helpers.isWalkingBassDebugEnabled,
      getRemainingBeatsUntilNextProgression: helpers.getRemainingBeatsUntilNextProgression,
      getRepetitionsPerKey: helpers.getRepetitionsPerKey,
      getFinitePlayback: helpers.getFinitePlayback,
      isLastChorusForced: helpers.isLastChorusForced,
      getPlaybackEndingCue: helpers.getPlaybackEndingCue,
      resolvePerformanceCueJump: helpers.resolvePerformanceCueJump,
      resolvePerformanceCueStop: helpers.resolvePerformanceCueStop,
      getSecondsPerBeat: helpers.getSecondsPerBeat,
      getSwingRatio: helpers.getSwingRatio,
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
      playRide: helpers.playRide,
      keyNameHtml: helpers.keyNameHtml,
      renderAccidentalTextHtml: helpers.renderAccidentalTextHtml,
      scheduleDrumsForBeat: helpers.scheduleDrumsForBeat,
      shouldShowNextPreview: helpers.shouldShowNextPreview,
      showNextCol: helpers.showNextCol,
      takeNextOneChordQuality: helpers.takeNextOneChordQuality,
      trackProgressionOccurrence: helpers.trackProgressionOccurrence,
      stopPlayback: helpers.stopPlayback,
      updateBeatDots: helpers.updateBeatDots
    },
    transportHelperBindings: {
      applyDisplaySideLayout: helpers.applyDisplaySideLayout,
      clearBeatDots: helpers.clearBeatDots,
      clearScheduledDisplays: helpers.clearScheduledDisplays,
      ensureWalkingBassGenerator: helpers.ensureWalkingBassGenerator,
      ensureNearTermSamplePreload: helpers.ensureNearTermSamplePreload,
      ensureSessionStarted: helpers.ensureSessionStarted,
      fitHarmonyDisplay: helpers.fitHarmonyDisplay,
      getPlaybackStartChordIndex: helpers.getPlaybackStartChordIndex,
      getPlaybackAnalyticsProps: helpers.getPlaybackAnalyticsProps,
      getProgressionAnalyticsProps: helpers.getProgressionAnalyticsProps,
      hideNextCol: helpers.hideNextCol,
      initAudio: helpers.initAudio,
      resumeAudioContext: helpers.resumeAudioContext,
      suspendAudioContext: helpers.suspendAudioContext,
      preloadStartupSamples: helpers.preloadStartupSamples,
      registerSessionAction: helpers.registerSessionAction,
      setDisplayPlaceholderMessage: helpers.setDisplayPlaceholderMessage,
      setDisplayPlaceholderVisible: helpers.setDisplayPlaceholderVisible,
      stopActiveComping: helpers.stopActiveComping,
      stopScheduledAudio: helpers.stopScheduledAudio,
      trackEvent: helpers.trackEvent,
      trackProgressionEvent: helpers.trackProgressionEvent
    }
  });
}


