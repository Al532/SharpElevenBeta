import {
  DEFAULT_PLAYBACK_ENDING_CONFIG,
  isLongPlaybackEndingStyle,
  isOffbeatPlaybackEndingStyle
} from '../../core/playback/playback-ending.js';
import { getSwingOffbeatPositionBeats } from '../../core/music/swing-utils.js';

export function createPlaybackScheduler({ dom, state, constants, helpers }) {
  const { SCHEDULE_AHEAD } = constants;
  let scheduledEndingStopTime = null;
  const isNoChord = (chord) => Boolean(chord?.noChord || chord?.inputType === 'no-chord');
  const {
    applyDisplaySideLayout,
    buildPreparedBassPlan,
    buildLegacyVoicingPlan,
    buildPreparedCompingPlans,
    buildVoicingPlanForSlots,
    chordSymbol,
    chordSymbolHtml,
    compingEngine,
    createOneChordToken,
    createVoicingSlot,
    fitHarmonyDisplay,
    getCurrentPatternString,
    getPatternKeyOverridePitchClass,
    getCompingStyle,
    getBeatsPerChord,
    getChordsPerBar,
    getPlaybackMeasurePlan,
    getMeasureInfoForChordIndex,
    getRemainingBeatsUntilNextProgression,
    getRepetitionsPerKey,
    getFinitePlayback,
    isLastChorusForced,
    getPlaybackEndingCue,
    getPlaybackFeelMode,
    applyPendingPlaybackFeelToggleForCurrentPosition,
    applyPendingPlaybackFeelToggleForNextProgression,
    resolvePerformanceCueJump,
    resolvePerformanceCueStop,
    getSecondsPerBeat,
    getSwingRatio,
    hideNextCol,
    ensureNearTermSamplePreload,
    isWalkingBassEnabled,
    isChordsEnabled,
    isVoiceLeadingV2Enabled,
    keyName,
    keyNameHtml,
    nextKey,
    padProgression,
    parseOneChordSpec,
    parsePattern,
    playClick,
    playNote,
    playRide,
    renderAccidentalTextHtml,
    scheduleDrumsForBeat,
    shouldShowNextPreview,
    showNextCol,
    stopPlayback,
    takeNextOneChordQuality,
    trackProgressionOccurrence,
    updateBeatDots
  } = helpers;

  function shouldTreatCurrentPassAsFinal() {
    if (typeof isLastChorusForced === 'function' && isLastChorusForced()) return true;
    const repetitions = Math.max(1, Number(getRepetitionsPerKey()) || 1);
    return getFinitePlayback?.() === true && state.currentKeyRepetition >= repetitions;
  }

  function normalizeEndingCue() {
    const cue = typeof getPlaybackEndingCue === 'function' ? getPlaybackEndingCue() : null;
    if (!cue || typeof cue !== 'object') return null;
    if (!shouldTreatCurrentPassAsFinal()) return null;
    const targetBeat = Number(cue.targetBeat ?? cue.targetChordIndex);
    if (!Number.isFinite(targetBeat)) return null;
    const style = String(cue.style || '');
    if (!style) return null;
    return {
      ...cue,
      style,
      targetBeat: Math.max(0, targetBeat),
      targetChordIndex: Math.max(0, Math.round(Number(cue.targetChordIndex ?? targetBeat))),
      holdSeconds: isLongPlaybackEndingStyle(style)
        ? Math.max(0.1, Number(cue.holdMs || DEFAULT_PLAYBACK_ENDING_CONFIG.longHoldMs) / 1000)
        : null
    };
  }

  function getEndingAttackBeat(cue) {
    if (!cue) return null;
    if (!isOffbeatPlaybackEndingStyle(cue.style)) return cue.targetBeat;
    if (cue.targetBeat <= 0) return cue.targetBeat;
    const swingRatio = typeof getSwingRatio === 'function' ? getSwingRatio() : undefined;
    return Math.max(0, Math.floor(cue.targetBeat) - 1 + getSwingOffbeatPositionBeats(swingRatio));
  }

  function getEndingStopDelaySeconds(style) {
    return isLongPlaybackEndingStyle(style)
      ? DEFAULT_PLAYBACK_ENDING_CONFIG.shortTailStopDelaySeconds
        + DEFAULT_PLAYBACK_ENDING_CONFIG.longTailExtraStopDelaySeconds
      : DEFAULT_PLAYBACK_ENDING_CONFIG.shortTailStopDelaySeconds;
  }

  function getEndingTailFadeTimeConstantSeconds(style) {
    void style;
    return DEFAULT_PLAYBACK_ENDING_CONFIG.shortTailFadeTimeConstantSeconds;
  }

  function isAtOrBeforeBeat(value, beat) {
    return Number.isFinite(value)
      && Number.isFinite(beat)
      && value <= beat + 0.001;
  }

  function scheduleEndingCue({
    cue,
    endingTime,
    chord,
    slotDuration,
    secondsPerBeat,
    isMinor
  }) {
    if (!cue || !chord) return false;
    const isLong = isLongPlaybackEndingStyle(cue.style);
    const durationSeconds = isLong ? cue.holdSeconds : null;
    const tailFadeTimeConstant = getEndingTailFadeTimeConstantSeconds(cue.style);
    const tailFadeStart = endingTime + (durationSeconds || 0);

    if (typeof playRide === 'function') {
      playRide(
        endingTime,
        isOffbeatPlaybackEndingStyle(cue.style) ? 0.24 : 0.34,
        isOffbeatPlaybackEndingStyle(cue.style) ? 0.99 : 1.01,
        {
          endingStyle: cue.style,
          slotDuration,
          secondsPerBeat,
          endingAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortAccentMultiplier,
          endingFinalAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortFinalAccentMultiplier,
          endingCrescendoLeadMeasures: DEFAULT_PLAYBACK_ENDING_CONFIG.shortCrescendoLeadMeasures,
          tailFadeTimeConstant,
          tailFadeStart
        }
      );
    }

    const midi = helpers.getBassMidi(state.currentKey, chord.bassSemitones ?? chord.semitones);
    playNote(midi, endingTime, durationSeconds || slotDuration, 127, {
      endingStyle: cue.style,
      slotDuration,
      secondsPerBeat,
      endingAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortAccentMultiplier,
      endingFinalAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortFinalAccentMultiplier,
      endingCrescendoLeadMeasures: DEFAULT_PLAYBACK_ENDING_CONFIG.shortCrescendoLeadMeasures,
      tailFadeTimeConstant
    });

    compingEngine.scheduleEnding?.({
      style: getCompingStyle(),
      progression: {
        chords: state.paddedChords,
        key: state.currentKey,
        isMinor,
        beatsPerBar: getMeasureBeatCount(cue.targetChordIndex),
      },
      chordIndex: cue.targetChordIndex,
      time: endingTime,
      durationSeconds,
      endingStyle: cue.style,
      endingAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortAccentMultiplier,
      endingFinalAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortFinalAccentMultiplier,
      endingCrescendoLeadMeasures: DEFAULT_PLAYBACK_ENDING_CONFIG.shortCrescendoLeadMeasures,
      slotDuration,
      secondsPerBeat,
    });

    scheduleDisplay(endingTime, () => {
      state.displayedIsIntro = false;
      state.displayedCurrentBeat = 0;
      state.displayedCurrentChordIdx = cue.targetChordIndex;
      applyDisplaySideLayout();
      dom.keyDisplay.innerHTML = keyNameHtml(state.currentKey);
      dom.chordDisplay.innerHTML = chordSymbolHtml(state.currentKey, chord, null, null);
      dom.nextKeyDisplay.textContent = '';
      dom.nextChordDisplay.innerHTML = '';
      hideNextCol();
      fitHarmonyDisplay();
      updateBeatDots(0, false);
    });

    if (isLong) {
      scheduleDisplay(tailFadeStart, () => {
        compingEngine.stopActiveComping?.(tailFadeStart, tailFadeTimeConstant);
      });
    }

    const stopTime = endingTime + (durationSeconds || 0) + getEndingStopDelaySeconds(cue.style);
    scheduledEndingStopTime = stopTime;
    scheduleDisplay(stopTime, () => {
      scheduledEndingStopTime = null;
      stopPlayback?.();
    });
    state.nextBeatTime = stopTime;
    return true;
  }

  function getMeasureInfo(chordIndex = state.currentChordIdx) {
    return typeof getMeasureInfoForChordIndex === 'function'
      ? getMeasureInfoForChordIndex(chordIndex)
      : null;
  }

  function getMeasureBeatCount(chordIndex = state.currentChordIdx) {
    const measureInfo = getMeasureInfo(chordIndex);
    return Math.max(1, Number(measureInfo?.beatCount || 4));
  }

  function hasExplicitMeasurePlan() {
    const plan = typeof getPlaybackMeasurePlan === 'function' ? getPlaybackMeasurePlan() : null;
    return Array.isArray(plan) && plan.length > 0;
  }

  function prepareNextProgression() {
    scheduledEndingStopTime = null;
    applyPendingPlaybackFeelToggleForNextProgression?.();
    const carriedBassTargetMidi = state.pendingBassTargetMidi ?? null;
    const previousKey = state.currentKey;
    const currentPlanAnticipatesNextStart = Boolean(state.currentCompingPlan?.anticipatesNextStart);
    const previousTotalBeats = state.paddedChords.length * getBeatsPerChord();
    const currentPreviousTailBeats = state.currentCompingPlan?.events?.length
      ? Math.max(0, previousTotalBeats - state.currentCompingPlan.events[state.currentCompingPlan.events.length - 1].timeBeats)
      : null;
    const patternString = getCurrentPatternString();
    const oneChordSpec = parseOneChordSpec(patternString);
    const forcedKey = oneChordSpec.active ? null : getPatternKeyOverridePitchClass(patternString);

    if (state.nextKeyValue !== null) {
      state.currentKey = state.nextKeyValue;
      const shouldCountSameKeyRepetition = state.currentKey === previousKey
        && (forcedKey === null || getFinitePlayback?.() === true);
      state.currentKeyRepetition = shouldCountSameKeyRepetition
        ? state.currentKeyRepetition + 1
        : 1;
    } else {
      state.currentKey = forcedKey ?? nextKey();
      state.currentKeyRepetition = 1;
    }

    if (oneChordSpec.active) {
      state.currentOneChordQualityValue = state.nextOneChordQualityValue || takeNextOneChordQuality(oneChordSpec.qualities);
      state.currentRawChords = [createOneChordToken(state.currentOneChordQualityValue)];
    } else {
      state.currentOneChordQualityValue = '';
      state.currentRawChords = parsePattern(patternString);
      if (state.currentRawChords.length === 0) {
        state.currentRawChords = parsePattern('II-V-I');
      }
    }

    const chordsPerBar = getChordsPerBar();
    const reps = getRepetitionsPerKey();
    state.paddedChords = padProgression(state.currentRawChords, chordsPerBar);

    const shouldRepeatCurrentKey = forcedKey === null && !oneChordSpec.active && state.currentKeyRepetition < reps;
    state.nextKeyValue = forcedKey ?? (shouldRepeatCurrentKey ? state.currentKey : nextKey(state.currentKey));
    if (oneChordSpec.active) {
      state.nextOneChordQualityValue = takeNextOneChordQuality(oneChordSpec.qualities, state.currentOneChordQualityValue);
      state.nextRawChords = [createOneChordToken(state.nextOneChordQualityValue)];
    } else {
      state.nextOneChordQualityValue = '';
      state.nextRawChords = state.currentRawChords;
    }
    state.nextPaddedChords = padProgression(state.nextRawChords, chordsPerBar);

    const isMinor = oneChordSpec.active ? false : dom.majorMinor.checked;

    state.loopVoicingTemplate = null;
    if (isVoiceLeadingV2Enabled()) {
      const currentSlots = state.paddedChords.map(chord => createVoicingSlot(chord, state.currentKey, isMinor, 'current'));
      const nextSlots = state.nextPaddedChords.map(chord => createVoicingSlot(chord, state.nextKeyValue, isMinor, 'next'));
      const combinedPlan = buildVoicingPlanForSlots([...currentSlots, ...nextSlots]);
      state.currentVoicingPlan = combinedPlan.slice(0, currentSlots.length);
      state.nextVoicingPlan = combinedPlan.slice(currentSlots.length);
    } else {
      state.currentVoicingPlan = buildLegacyVoicingPlan(state.paddedChords, state.currentKey, isMinor);
      state.nextVoicingPlan = buildLegacyVoicingPlan(state.nextPaddedChords, state.nextKeyValue, isMinor);
    }

    state.currentChordIdx = 0;
    state.lastPlayedChordIdx = -1;
    state.currentBassPlan = buildPreparedBassPlan(carriedBassTargetMidi);
    const lastBassEvent = state.currentBassPlan.length ? state.currentBassPlan[state.currentBassPlan.length - 1] : null;
    state.pendingBassTargetMidi = lastBassEvent?.rank === 'approach' ? lastBassEvent.targetMidi : null;
    state.walkingBassLoggedMeasures = new Set();
    buildPreparedCompingPlans(
        state.currentKeyRepetition === 1 && state.nextKeyValue !== null && previousKey === state.currentKey
          ? null
          : previousKey,
        currentPlanAnticipatesNextStart,
        currentPreviousTailBeats
      );
  }

  function scheduleDisplay(audioTime, fn) {
    const delay = (audioTime - state.audioCtx.currentTime) * 1000;
    if (delay <= 0) {
      if (state.isPlaying && !state.isPaused) fn();
      return;
    }
    const timeoutId = setTimeout(() => {
      state.pendingDisplayTimeouts.delete(timeoutId);
      if (state.isPlaying && !state.isPaused) {
        fn();
      }
    }, delay);
    state.pendingDisplayTimeouts.add(timeoutId);
  }

  function scheduleBeat() {
    const spb = getSecondsPerBeat();
    const chordsPerBar = getChordsPerBar();
    const beatsPerChord = getBeatsPerChord(chordsPerBar);

    while (state.nextBeatTime < state.audioCtx.currentTime + SCHEDULE_AHEAD) {
      if (scheduledEndingStopTime !== null) {
        if (state.audioCtx.currentTime >= scheduledEndingStopTime) {
          scheduledEndingStopTime = null;
          stopPlayback?.();
        }
        return;
      }

      if (state.isIntro) {
        playClick(state.nextBeatTime, state.currentBeat === 0);

        const introB = state.currentBeat;
        const introKey = state.currentKey;
        const introNextKey = state.nextKeyValue;
        const introChordIndex = Math.max(0, Math.min(
          Math.max(0, state.paddedChords.length - 1),
          Math.round(Number(state.currentChordIdx) || 0)
        ));
        const introFirstChord = state.paddedChords[introChordIndex];
        const introFollowingChord = state.paddedChords[introChordIndex + 1] || null;
        scheduleDisplay(state.nextBeatTime, () => {
          state.displayedIsIntro = true;
          state.displayedCurrentBeat = introB;
          state.displayedCurrentChordIdx = -1;
          applyDisplaySideLayout();
          dom.keyDisplay.textContent = '';
          dom.chordDisplay.innerHTML = '';
          showNextCol();
          dom.nextKeyDisplay.innerHTML = keyNameHtml(introKey);
          dom.nextChordDisplay.innerHTML = introFirstChord
            ? chordSymbolHtml(introKey, introFirstChord, null, introFollowingChord)
            : '';
          fitHarmonyDisplay();
          updateBeatDots(introB, true);
        });

        state.currentBeat++;
        if (state.currentBeat >= getMeasureBeatCount(state.currentChordIdx)) {
          state.currentBeat = 0;
          state.isIntro = false;
        }
        state.nextBeatTime += spb;
        continue;
      }

      const explicitMeasurePlan = hasExplicitMeasurePlan();
      const performanceCueJumpIndex = typeof resolvePerformanceCueJump === 'function'
        ? resolvePerformanceCueJump(state.currentChordIdx)
        : null;
      if (Number.isFinite(performanceCueJumpIndex)) {
        state.currentChordIdx = Math.max(0, Math.round(Number(performanceCueJumpIndex)));
        state.currentBeat = 0;
        state.displayedCurrentChordIdx = state.currentChordIdx;
        state.displayedCurrentBeat = 0;
        state.lastPlayedChordIdx = state.currentChordIdx - 1;
      }
      if (typeof resolvePerformanceCueStop === 'function' && resolvePerformanceCueStop(state.currentChordIdx)) {
        scheduleDisplay(state.nextBeatTime, () => {
          stopPlayback?.();
        });
        return;
      }
      applyPendingPlaybackFeelToggleForCurrentPosition?.(state.currentChordIdx);
      const measureInfo = getMeasureInfo(state.currentChordIdx);
      const beatsPerMeasure = Math.max(1, Number(measureInfo?.beatCount || 4));
      const chord = state.paddedChords[state.currentChordIdx];
      const noteDuration = beatsPerChord * spb;
      const chordsPerMeasure = chordsPerBar;
      const windowStartBeats = explicitMeasurePlan && measureInfo
        ? measureInfo.startBeat + state.currentBeat
        : Math.floor(state.currentChordIdx / chordsPerMeasure) * 4 + state.currentBeat;
      const windowEndBeats = windowStartBeats + 1;
      const beatStep = beatsPerChord;
      const measureProgressBeats = (state.currentChordIdx % chordsPerMeasure) * beatStep;
      const isChordBeat = explicitMeasurePlan
        ? true
        : Math.abs(state.currentBeat - measureProgressBeats) < 0.001;
      const customBassEnabled = isWalkingBassEnabled();
      const measureStartChordIdx = Math.floor(state.currentChordIdx / chordsPerMeasure) * chordsPerMeasure;
      const measureStartBeats = explicitMeasurePlan && measureInfo
        ? measureInfo.startBeat
        : Math.floor(windowStartBeats / 4) * 4;
      const endingCue = normalizeEndingCue();
      const endingAttackBeat = getEndingAttackBeat(endingCue);
      const endingFallsInCurrentWindow = endingCue
        && Number.isFinite(endingAttackBeat)
        && endingAttackBeat >= windowStartBeats
        && endingAttackBeat < windowEndBeats;

      if (endingFallsInCurrentWindow && isAtOrBeforeBeat(endingAttackBeat, windowStartBeats)) {
        const endingChord = state.paddedChords[endingCue.targetChordIndex] || chord;
        const endingTime = state.nextBeatTime + ((endingAttackBeat - windowStartBeats) * spb);
        if (!isNoChord(endingChord)) {
          const scheduled = scheduleEndingCue({
            cue: endingCue,
            endingTime,
            chord: endingChord,
            slotDuration: noteDuration,
            secondsPerBeat: spb,
            isMinor: dom.majorMinor.checked
          });
          if (scheduled) return;
        }
      }

      const deferredEndingCue = endingFallsInCurrentWindow ? endingCue : null;
      const normalWindowEndBeats = deferredEndingCue
        ? Math.max(windowStartBeats, endingAttackBeat)
        : windowEndBeats;

      const playbackFeelMode = getPlaybackFeelMode?.();
      const drumOffbeatProbability = playbackFeelMode === 'two' ? 0.3 : 1;
      if (playbackFeelMode === 'two') {
        console.info('[playback-feel] scheduling two-feel drums', {
          beat: state.currentBeat,
          chordIndex: state.currentChordIdx,
          offbeatProbability: drumOffbeatProbability
        });
      }
      scheduleDrumsForBeat(state.nextBeatTime, state.currentBeat, spb, measureInfo, {
        endingCue,
        beatsPerBar: beatsPerMeasure,
        offbeatProbability: drumOffbeatProbability,
        endingAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortAccentMultiplier,
        endingFinalAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortFinalAccentMultiplier,
        endingCrescendoLeadMeasures: DEFAULT_PLAYBACK_ENDING_CONFIG.shortCrescendoLeadMeasures
      });

      if (customBassEnabled) {
        const bassEvents = state.currentBassPlan.filter((event) => (
          event.timeBeats >= windowStartBeats
          && event.timeBeats < normalWindowEndBeats
        ));
        if (bassEvents.length) {
          bassEvents.forEach((bassEvent) => {
            const eventOffsetSeconds = (bassEvent.timeBeats - windowStartBeats) * spb;
            playNote(
              bassEvent.midi,
              state.nextBeatTime + eventOffsetSeconds,
              bassEvent.durationBeats * spb,
              bassEvent.velocity,
              {
                endingCue,
                timeBeats: bassEvent.timeBeats,
                beatsPerBar: beatsPerMeasure,
                endingAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortAccentMultiplier,
                endingFinalAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortFinalAccentMultiplier,
                endingCrescendoLeadMeasures: DEFAULT_PLAYBACK_ENDING_CONFIG.shortCrescendoLeadMeasures
              }
            );
          });
        }
        if (isChordBeat) {
          state.lastPlayedChordIdx = state.currentChordIdx;
        }
      } else if (isChordBeat) {
        if (!isNoChord(chord)) {
          const prevChord = state.lastPlayedChordIdx >= 0 ? state.paddedChords[state.lastPlayedChordIdx] : null;
          const sameChord = prevChord && !isNoChord(prevChord) && prevChord.semitones === chord.semitones
            && (prevChord.bassSemitones ?? prevChord.semitones) === (chord.bassSemitones ?? chord.semitones)
            && prevChord.qualityMajor === chord.qualityMajor
            && prevChord.qualityMinor === chord.qualityMinor;

          if (!sameChord) {
            let sustainSlots = 1;
            for (let i = state.currentChordIdx + 1; i < state.paddedChords.length; i++) {
              const nextChord = state.paddedChords[i];
              if (
                !isNoChord(nextChord)
                && nextChord.semitones === chord.semitones
                && (nextChord.bassSemitones ?? nextChord.semitones) === (chord.bassSemitones ?? chord.semitones)
                && nextChord.qualityMajor === chord.qualityMajor
                && nextChord.qualityMinor === chord.qualityMinor
              ) {
                sustainSlots++;
              } else {
                break;
              }
            }
            const sustainDuration = sustainSlots * beatsPerChord * spb;

            const midi = helpers.getBassMidi(state.currentKey, chord.bassSemitones ?? chord.semitones);
            playNote(midi, state.nextBeatTime, sustainDuration, 127, {
              endingCue,
              timeBeats: windowStartBeats,
              beatsPerBar: beatsPerMeasure,
              endingAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortAccentMultiplier,
              endingFinalAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortFinalAccentMultiplier,
              endingCrescendoLeadMeasures: DEFAULT_PLAYBACK_ENDING_CONFIG.shortCrescendoLeadMeasures
            });
          }
        }
        state.lastPlayedChordIdx = state.currentChordIdx;
      }

      if (isChordsEnabled()) {
        const isMinor = dom.majorMinor.checked;
        compingEngine.scheduleWindow({
          style: getCompingStyle(),
          progression: {
            chords: state.paddedChords,
            key: state.currentKey,
            isMinor,
            beatsPerBar: beatsPerMeasure,
          },
          plan: state.currentCompingPlan,
          nextProgression: {
            chords: state.nextPaddedChords,
            key: state.nextKeyValue,
            isMinor,
            beatsPerBar: beatsPerMeasure,
          },
          nextPlan: state.nextCompingPlan,
          endingCue,
          endingAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortAccentMultiplier,
          endingFinalAccentMultiplier: DEFAULT_PLAYBACK_ENDING_CONFIG.shortFinalAccentMultiplier,
          endingCrescendoLeadMeasures: DEFAULT_PLAYBACK_ENDING_CONFIG.shortCrescendoLeadMeasures,
          slotDuration: noteDuration,
          windowStartBeats,
          windowEndBeats: normalWindowEndBeats,
          beatStartTime: state.nextBeatTime,
          secondsPerBeat: spb,
        });
      }

      const dispBeat = state.currentBeat;
      const dispChordIdx = state.currentChordIdx;
      const dispChord = chord;
      const dispKey = state.currentKey;
      const dispNextKey = state.nextKeyValue;
      const dispRemainingBeats = getRemainingBeatsUntilNextProgression(
        state.currentChordIdx,
        state.currentBeat,
        state.paddedChords.length
      );
      const dispNextFirstChord = state.nextRawChords[0] || null;
      const dispFollowingChord = state.paddedChords[state.currentChordIdx + 1] || null;
      const dispNextFollowingChord = state.nextRawChords[1] || null;
      scheduleDisplay(state.nextBeatTime, () => {
        state.displayedIsIntro = false;
        state.displayedCurrentBeat = dispBeat;
        state.displayedCurrentChordIdx = dispChordIdx;
        if (!shouldShowNextPreview(dispKey, dispNextKey, dispRemainingBeats)) {
          dom.nextKeyDisplay.textContent = '';
          dom.nextChordDisplay.innerHTML = '';
          hideNextCol();
        }
        applyDisplaySideLayout();
        dom.keyDisplay.innerHTML = keyNameHtml(dispKey);
        dom.chordDisplay.innerHTML = chordSymbolHtml(dispKey, dispChord, null, dispFollowingChord);
        if (shouldShowNextPreview(dispKey, dispNextKey, dispRemainingBeats)) {
          showNextCol();
          dom.nextKeyDisplay.innerHTML = keyNameHtml(dispNextKey);
          dom.nextChordDisplay.innerHTML = dispNextFirstChord
            ? chordSymbolHtml(dispNextKey, dispNextFirstChord, null, dispNextFollowingChord)
            : '';
        } else {
          dom.nextKeyDisplay.textContent = '';
          dom.nextChordDisplay.innerHTML = '';
          hideNextCol();
        }
        fitHarmonyDisplay();
        updateBeatDots(dispBeat, false);
      });

      if (deferredEndingCue) {
        const endingChord = state.paddedChords[deferredEndingCue.targetChordIndex] || chord;
        const endingTime = state.nextBeatTime + ((endingAttackBeat - windowStartBeats) * spb);
        const scheduled = scheduleEndingCue({
          cue: deferredEndingCue,
          endingTime,
          chord: endingChord,
          slotDuration: noteDuration,
          secondsPerBeat: spb,
          isMinor: dom.majorMinor.checked
        });
        if (scheduled) return;
      }

      state.currentBeat++;
      if (state.currentBeat >= beatsPerMeasure) {
        state.currentBeat = 0;
      }

      const nextMeasureProgressBeats = ((state.currentChordIdx + 1) % chordsPerMeasure) * beatStep;
      if (explicitMeasurePlan || state.currentBeat === 0 || Math.abs(state.currentBeat - nextMeasureProgressBeats) < 0.001) {
        state.currentChordIdx++;
      }

      if (state.currentChordIdx >= state.paddedChords.length) {
        trackProgressionOccurrence({
          key_repetition_index: state.currentKeyRepetition,
          played_chord_count: state.currentRawChords.length || state.paddedChords.length || 0
        });
        if (shouldTreatCurrentPassAsFinal()) {
          const stopTime = state.nextBeatTime + spb;
          scheduleDisplay(stopTime, () => {
            stopPlayback?.();
          });
          state.nextBeatTime = stopTime;
          return;
        }
        prepareNextProgression();
        ensureNearTermSamplePreload();
      }

      state.nextBeatTime += spb;
    }
  }

  return {
    prepareNextProgression,
    scheduleBeat,
    scheduleDisplay
  };
}
