import {
  DEFAULT_PLAYBACK_ENDING_CONFIG,
  isLongPlaybackEndingStyle,
  isOffbeatPlaybackEndingStyle
} from '../../core/playback/playback-ending.js';
import { getSwingOffbeatPositionBeats } from '../../core/music/swing-utils.js';

export function createPlaybackScheduler({ dom, state, constants, helpers }) {
  const { SCHEDULE_AHEAD } = constants;
  let scheduledEndingStopTime = null;
  const {
    applyDisplaySideLayout,
    buildPreparedBassPlan,
    buildLegacyVoicingPlan,
    buildPreparedCompingPlans,
    buildLoopRepVoicings,
    buildVoicingPlanForSlots,
    canLoopTrimProgression,
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
    getPlaybackEndingCue,
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

  function normalizeEndingCue() {
    const cue = typeof getPlaybackEndingCue === 'function' ? getPlaybackEndingCue() : null;
    if (!cue || typeof cue !== 'object') return null;
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

  function getPreOnbeatEndingOffbeatBeat(cue) {
    if (!cue || cue.style !== 'onbeat_long') return null;
    const targetBeat = Number(cue.targetBeat);
    if (!Number.isFinite(targetBeat) || targetBeat <= 0) return null;
    const swingRatio = typeof getSwingRatio === 'function' ? getSwingRatio() : undefined;
    return Math.max(0, Math.floor(targetBeat) - 1 + getSwingOffbeatPositionBeats(swingRatio));
  }

  function isAtBeat(value, targetBeat) {
    return Number.isFinite(value)
      && Number.isFinite(targetBeat)
      && Math.abs(value - targetBeat) < 0.001;
  }

  function shouldSuppressPreOnbeatEndingBassEvent(event, cue) {
    const preEndingOffbeatBeat = getPreOnbeatEndingOffbeatBeat(cue);
    if (!Number.isFinite(preEndingOffbeatBeat)) return false;
    if (!isAtBeat(Number(event?.timeBeats), preEndingOffbeatBeat)) return false;
    return String(event?.source || '').includes('anticipation');
  }

  function withoutPreOnbeatEndingPianoEvent(plan, cue, style) {
    if (style !== 'piano' || !plan?.events?.length) return plan;
    const preEndingOffbeatBeat = getPreOnbeatEndingOffbeatBeat(cue);
    if (!Number.isFinite(preEndingOffbeatBeat)) return plan;
    const events = plan.events.filter((event) => !isAtBeat(Number(event?.timeBeats), preEndingOffbeatBeat));
    return events.length === plan.events.length ? plan : { ...plan, events };
  }

  function getShortEndingDurationSeconds(slotDuration, secondsPerBeat) {
    const fallback = Number.isFinite(secondsPerBeat) ? secondsPerBeat : 0.25;
    return Math.max(0.08, Math.min(fallback, Number(slotDuration || fallback)));
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
    const durationSeconds = isLong
      ? cue.holdSeconds
      : getShortEndingDurationSeconds(slotDuration, secondsPerBeat);

    if (typeof playRide === 'function') {
      playRide(endingTime, isOffbeatPlaybackEndingStyle(cue.style) ? 0.24 : 0.34, isOffbeatPlaybackEndingStyle(cue.style) ? 0.99 : 1.01);
    }

    const midi = helpers.getBassMidi(state.currentKey, chord.bassSemitones ?? chord.semitones);
    playNote(midi, endingTime, durationSeconds, 127);

    compingEngine.scheduleEnding?.({
      style: getCompingStyle(),
      progression: {
        chords: state.paddedChords,
        key: state.currentKey,
        isMinor,
      },
      chordIndex: cue.targetChordIndex,
      time: endingTime,
      durationSeconds,
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

    const stopTime = endingTime + durationSeconds;
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
      state.currentKeyRepetition = forcedKey === null && state.currentKey === previousKey
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
    const loopTrim = !oneChordSpec.active && reps > 1 && canLoopTrimProgression(state.currentRawChords, chordsPerBar);
    const isLastRep = state.currentKeyRepetition >= reps;
    state.paddedChords = padProgression(
      loopTrim && !isLastRep ? state.currentRawChords.slice(0, -1) : state.currentRawChords,
      chordsPerBar
    );

    const shouldRepeatCurrentKey = forcedKey === null && !oneChordSpec.active && state.currentKeyRepetition < reps;
    state.nextKeyValue = forcedKey ?? (shouldRepeatCurrentKey ? state.currentKey : nextKey(state.currentKey));
    if (oneChordSpec.active) {
      state.nextOneChordQualityValue = takeNextOneChordQuality(oneChordSpec.qualities, state.currentOneChordQualityValue);
      state.nextRawChords = [createOneChordToken(state.nextOneChordQualityValue)];
    } else {
      state.nextOneChordQualityValue = '';
      state.nextRawChords = state.currentRawChords;
    }
    const nextLoopTrim = !oneChordSpec.active && reps > 1 && canLoopTrimProgression(state.nextRawChords, chordsPerBar);
    const nextRepetition = shouldRepeatCurrentKey ? state.currentKeyRepetition + 1 : 1;
    const nextIsLastRep = nextRepetition >= reps;
    state.nextPaddedChords = padProgression(
      nextLoopTrim && !nextIsLastRep ? state.nextRawChords.slice(0, -1) : state.nextRawChords,
      chordsPerBar
    );

    const isMinor = oneChordSpec.active ? false : dom.majorMinor.checked;

    if (loopTrim) {
      if (state.currentKeyRepetition === 1 || !Array.isArray(state.loopVoicingTemplate) || state.loopVoicingTemplate.length === 0) {
        const rawSlots = state.currentRawChords.map(chord => createVoicingSlot(chord, state.currentKey, isMinor, 'current'));
        if (isVoiceLeadingV2Enabled()) {
          state.loopVoicingTemplate = buildVoicingPlanForSlots(rawSlots);
        } else {
          state.loopVoicingTemplate = buildLegacyVoicingPlan(state.currentRawChords, state.currentKey, isMinor);
        }
      }
      state.currentVoicingPlan = buildLoopRepVoicings(
        state.loopVoicingTemplate,
        state.paddedChords.length,
        state.currentKeyRepetition === 1
      );
      if (shouldRepeatCurrentKey) {
        state.nextVoicingPlan = buildLoopRepVoicings(state.loopVoicingTemplate, state.nextPaddedChords.length, false);
      } else {
        if (isVoiceLeadingV2Enabled()) {
          const fixedSlots = state.currentVoicingPlan.map(v => ({ candidateSet: [v], segment: 'current' }));
          const nextSlots = state.nextPaddedChords.map(chord => createVoicingSlot(chord, state.nextKeyValue, isMinor, 'next'));
          const transitionPlan = buildVoicingPlanForSlots([...fixedSlots, ...nextSlots]);
          state.nextVoicingPlan = transitionPlan.slice(fixedSlots.length);
        } else {
          state.nextVoicingPlan = buildLegacyVoicingPlan(state.nextPaddedChords, state.nextKeyValue, isMinor);
        }
        state.loopVoicingTemplate = null;
      }
    } else {
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
        const introFirstChord = state.paddedChords[0];
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
            ? chordSymbolHtml(introKey, introFirstChord, null, state.paddedChords[1] || null)
            : '';
          fitHarmonyDisplay();
          updateBeatDots(introB, true);
        });

        state.currentBeat++;
        if (state.currentBeat >= getMeasureBeatCount(0)) {
          state.currentBeat = 0;
          state.isIntro = false;
        }
        state.nextBeatTime += spb;
        continue;
      }

      const explicitMeasurePlan = hasExplicitMeasurePlan();
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

      if (
        endingCue
        && Number.isFinite(endingAttackBeat)
        && endingAttackBeat >= windowStartBeats
        && endingAttackBeat < windowEndBeats
      ) {
        const endingChord = state.paddedChords[endingCue.targetChordIndex] || chord;
        const endingTime = state.nextBeatTime + ((endingAttackBeat - windowStartBeats) * spb);
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

      scheduleDrumsForBeat(state.nextBeatTime, state.currentBeat, spb, measureInfo);

      if (customBassEnabled) {
        const bassEvents = state.currentBassPlan.filter((event) => (
          event.timeBeats >= windowStartBeats
          && event.timeBeats < windowEndBeats
          && !shouldSuppressPreOnbeatEndingBassEvent(event, endingCue)
        ));
        if (bassEvents.length) {
          bassEvents.forEach((bassEvent) => {
            const eventOffsetSeconds = (bassEvent.timeBeats - windowStartBeats) * spb;
            playNote(
              bassEvent.midi,
              state.nextBeatTime + eventOffsetSeconds,
              bassEvent.durationBeats * spb,
              bassEvent.velocity
            );
          });
        }
        if (isChordBeat) {
          state.lastPlayedChordIdx = state.currentChordIdx;
        }
      } else if (isChordBeat) {
        const prevChord = state.lastPlayedChordIdx >= 0 ? state.paddedChords[state.lastPlayedChordIdx] : null;
        const sameChord = prevChord && prevChord.semitones === chord.semitones
          && (prevChord.bassSemitones ?? prevChord.semitones) === (chord.bassSemitones ?? chord.semitones)
          && prevChord.qualityMajor === chord.qualityMajor
          && prevChord.qualityMinor === chord.qualityMinor;

        if (!sameChord) {
          let sustainSlots = 1;
          for (let i = state.currentChordIdx + 1; i < state.paddedChords.length; i++) {
            const nextChord = state.paddedChords[i];
            if (
              nextChord.semitones === chord.semitones
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
          playNote(midi, state.nextBeatTime, sustainDuration);
        }
        state.lastPlayedChordIdx = state.currentChordIdx;
      }

      if (isChordsEnabled()) {
        const isMinor = dom.majorMinor.checked;
        const compingStyle = getCompingStyle();
        compingEngine.scheduleWindow({
          style: compingStyle,
          progression: {
            chords: state.paddedChords,
            key: state.currentKey,
            isMinor,
          },
          plan: withoutPreOnbeatEndingPianoEvent(state.currentCompingPlan, endingCue, compingStyle),
          nextProgression: {
            chords: state.nextPaddedChords,
            key: state.nextKeyValue,
            isMinor,
          },
          nextPlan: state.nextCompingPlan,
          slotDuration: noteDuration,
          windowStartBeats,
          windowEndBeats,
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
        if (getFinitePlayback?.() === true) {
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
