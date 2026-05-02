import {
  DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE,
  STOP_SUGGESTION_MESSAGES
} from './practice-playback-placeholder-messages.js';

export function createPlaybackTransport({ dom, state, constants, helpers }) {
  const { NOTE_FADEOUT, SCHEDULE_INTERVAL } = constants;
  const {
    applyDisplaySideLayout,
    clearBeatDots,
    clearScheduledDisplays,
    ensureWalkingBassGenerator,
    ensureNearTermSamplePreload,
    ensureSessionStarted,
    fitHarmonyDisplay,
    getPlaybackStartChordIndex,
    getPlaybackAnalyticsProps,
    getProgressionAnalyticsProps,
    hideNextCol,
    initAudio,
    resumeAudioContext,
    suspendAudioContext,
    preloadStartupSamples,
    prepareNextProgression,
    registerSessionAction,
    scheduleBeat,
    setDisplayPlaceholderMessage,
    setDisplayPlaceholderVisible,
    stopActiveComping,
    stopScheduledAudio,
    trackEvent,
    trackProgressionEvent
  } = helpers;

  let transportGeneration = 0;

  function clearSchedulerTimer() {
    if (!state.schedulerTimer) return;
    clearInterval(state.schedulerTimer);
    state.schedulerTimer = null;
  }

  function getAudioTime() {
    return state.audioCtx?.currentTime ?? 0;
  }

  function isGenerationActive(generation) {
    return generation === transportGeneration && state.isPlaying && !state.isPaused;
  }

  function getPaddedChords() {
    return Array.isArray(state.paddedChords) ? state.paddedChords : [];
  }

  function resolvePlaybackStartChordIndex() {
    const paddedChords = getPaddedChords();
    return Math.max(
      0,
      Math.min(
        Math.max(0, paddedChords.length - 1),
        Math.round(Number(getPlaybackStartChordIndex?.() || 0))
      )
    );
  }

  function applyPlaybackStartChordIndex() {
    const startChordIndex = resolvePlaybackStartChordIndex();
    state.currentChordIdx = startChordIndex;
    state.lastPlayedChordIdx = startChordIndex - 1;
  }

  function fadeGainToSilence(gainNode, startTime, fadeDuration) {
    if (!gainNode?.gain) return;
    const fadeStart = Number.isFinite(startTime) ? startTime : 0;
    const fadeEnd = fadeStart + Math.max(0.02, Number(fadeDuration) || 0);

    try {
      if (typeof gainNode.gain.cancelAndHoldAtTime === 'function') {
        gainNode.gain.cancelAndHoldAtTime(fadeStart);
      } else {
        const currentValue = gainNode.gain.value;
        gainNode.gain.cancelScheduledValues(fadeStart);
        gainNode.gain.setValueAtTime(currentValue, fadeStart);
      }
      gainNode.gain.linearRampToValueAtTime(0, fadeEnd);
    } catch {
      // Ignore nodes that have already been stopped or disconnected.
    }
  }

  function schedulePlaybackLoop(generation) {
    clearSchedulerTimer();
    if (!isGenerationActive(generation)) return;

    state.schedulerTimer = setInterval(() => {
      if (!isGenerationActive(generation)) {
        clearSchedulerTimer();
        return;
      }
      scheduleBeat();
    }, SCHEDULE_INTERVAL);
  }

  async function start() {
    const generation = ++transportGeneration;
    ensureSessionStarted('play_start');

    state.isPlaying = true;
    state.isPaused = false;
    setDisplayPlaceholderVisible(false);
    setDisplayPlaceholderMessage(DEFAULT_DISPLAY_PLACEHOLDER_MESSAGE);
    dom.startStop.textContent = 'Stop';
    dom.startStop.classList.add('running');
    dom.pause.classList.remove('hidden', 'paused');
    dom.pause.textContent = 'Pause';

    let audioContext = null;
    if (typeof resumeAudioContext === 'function') {
      audioContext = await resumeAudioContext();
    } else {
      initAudio();
      audioContext = state.audioCtx;
    }
    if (!audioContext) {
      if (generation === transportGeneration) {
        state.isPlaying = false;
        state.isPaused = false;
        dom.startStop.textContent = 'Start';
        dom.startStop.classList.remove('running');
        dom.pause.classList.add('hidden');
        dom.pause.classList.remove('paused');
      }
      return;
    }
    if (generation !== transportGeneration) return;
    if (dom.walkingBass?.checked) {
      await ensureWalkingBassGenerator();
      if (generation !== transportGeneration) return;
    }

    state.isIntro = true;
    state.currentBeat = 0;
    state.currentChordIdx = 0;
    state.displayedIsIntro = true;
    state.displayedCurrentBeat = 0;
    state.displayedCurrentChordIdx = -1;
    state.currentDisplaySide = 'left';
    state.keyPool = [];
    state.nextKeyValue = null;
    state.currentKeyRepetition = 0;
    state.loopVoicingTemplate = null;
    state.nearTermSamplePreloadPromise = null;
    prepareNextProgression();
    applyPlaybackStartChordIndex();
    applyDisplaySideLayout();
    dom.keyDisplay.textContent = '';
    dom.chordDisplay.textContent = '';
    hideNextCol();
    state.startupSamplePreloadInProgress = true;
    try {
      await preloadStartupSamples();
    } finally {
      if (generation === transportGeneration) {
        state.startupSamplePreloadInProgress = false;
      }
    }
    if (!isGenerationActive(generation)) return;
    ensureNearTermSamplePreload();
    applyPlaybackStartChordIndex();
    if (!state.firstPlayStartTracked) {
      state.firstPlayStartTracked = true;
      const progressionProps = getProgressionAnalyticsProps();
      trackEvent('first_play_start', {
        progression_source: progressionProps.progression_source,
        progression_kind: progressionProps.progression_kind
      });
      registerSessionAction('first_play_start');
    }
    trackProgressionEvent('play_start', getPlaybackAnalyticsProps());

    state.nextBeatTime = audioContext.currentTime + 0.3;
    schedulePlaybackLoop(generation);
  }

  function stop() {
    transportGeneration += 1;
    const shouldShowStopSuggestion = state.firstPlayStartTracked;
    const audioTime = getAudioTime();

    trackProgressionEvent('play_stop', getPlaybackAnalyticsProps());
    state.isPlaying = false;
    state.isPaused = false;
    state.startupSamplePreloadInProgress = false;
    state.displayedIsIntro = false;
    state.displayedCurrentBeat = 0;
    state.displayedCurrentChordIdx = -1;
    setDisplayPlaceholderVisible(true);
    dom.startStop.textContent = 'Start';
    dom.startStop.classList.remove('running');
    dom.pause.classList.add('hidden');
    dom.pause.classList.remove('paused');
    clearSchedulerTimer();
    clearScheduledDisplays();
    stopScheduledAudio(audioTime);
    if (state.activeNoteGain) {
      fadeGainToSilence(state.activeNoteGain, audioTime, NOTE_FADEOUT);
      state.activeNoteGain = null;
    }
    stopActiveComping(audioTime, NOTE_FADEOUT);
    dom.keyDisplay.textContent = '';
    dom.chordDisplay.textContent = '';
    hideNextCol();
    fitHarmonyDisplay();
    clearBeatDots();

    if (shouldShowStopSuggestion) {
      const suggestionIndex = state.playStopSuggestionCount % STOP_SUGGESTION_MESSAGES.length;
      setDisplayPlaceholderMessage(STOP_SUGGESTION_MESSAGES[suggestionIndex]);
      state.playStopSuggestionCount += 1;
    }
  }

  function togglePause() {
    if (!state.isPlaying) return;
    if (state.isPaused) {
      const generation = transportGeneration;
      state.isPaused = false;
      dom.pause.textContent = 'Pause';
      dom.pause.classList.remove('paused');
      Promise.resolve(resumeAudioContext?.()).catch(() => {});
      trackProgressionEvent('play_resume', getPlaybackAnalyticsProps());
      state.nextBeatTime = state.audioCtx.currentTime + 0.05;
      schedulePlaybackLoop(generation);
      return;
    }

    transportGeneration += 1;
    const audioTime = getAudioTime();
    state.isPaused = true;
    dom.pause.textContent = 'Resume';
    dom.pause.classList.add('paused');
    clearSchedulerTimer();
    clearScheduledDisplays();
    stopScheduledAudio(audioTime);
    state.activeNoteGain = null;
    stopActiveComping(audioTime, NOTE_FADEOUT);
    Promise.resolve(suspendAudioContext?.()).catch(() => {});
    trackProgressionEvent('play_pause', getPlaybackAnalyticsProps());
  }

  return {
    start,
    stop,
    togglePause
  };
}
