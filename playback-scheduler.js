export function createPlaybackScheduler({ dom, state, constants, helpers }) {
  const { SCHEDULE_AHEAD } = constants;
  const {
    applyDisplaySideLayout,
    buildLegacyVoicingPlan,
    buildLoopRepVoicings,
    buildVoicingPlanForSlots,
    canLoopTrimProgression,
    chordSymbol,
    createOneChordToken,
    createVoicingSlot,
    fitHarmonyDisplay,
    getCurrentPatternString,
    getIntroDisplaySide,
    getRemainingBeatsUntilNextProgression,
    getRepetitionsPerKey,
    getSecondsPerBeat,
    hideNextCol,
    isChordsEnabled,
    isVoiceLeadingV2Enabled,
    keyName,
    nextKey,
    padProgression,
    parseOneChordSpec,
    parsePattern,
    playChord,
    playClick,
    playNote,
    scheduleDrumsForBeat,
    shouldAlternateDisplaySides,
    shouldShowNextPreview,
    showNextCol,
    takeNextOneChordQuality,
    toggleCurrentDisplaySide,
    updateBeatDots
  } = helpers;

  function prepareNextProgression() {
    const previousKey = state.currentKey;
    if (state.nextKeyValue !== null && shouldAlternateDisplaySides()) {
      toggleCurrentDisplaySide();
    }

    if (state.nextKeyValue !== null) {
      state.currentKey = state.nextKeyValue;
      state.currentKeyRepetition = state.currentKey === previousKey ? state.currentKeyRepetition + 1 : 1;
    } else {
      state.currentKey = nextKey();
      state.currentKeyRepetition = 1;
    }

    const oneChordSpec = parseOneChordSpec(getCurrentPatternString());
    if (oneChordSpec.active) {
      state.currentOneChordQualityValue = state.nextOneChordQualityValue || takeNextOneChordQuality(oneChordSpec.qualities);
      state.currentRawChords = [createOneChordToken(state.currentOneChordQualityValue)];
    } else {
      state.currentOneChordQualityValue = '';
      state.currentRawChords = parsePattern(getCurrentPatternString());
      if (state.currentRawChords.length === 0) {
        state.currentRawChords = parsePattern('II-V-I');
      }
    }

    const doubleTime = dom.doubleTime.checked;
    const reps = getRepetitionsPerKey();
    const loopTrim = !oneChordSpec.active && reps > 1 && canLoopTrimProgression(state.currentRawChords, doubleTime);
    const isLastRep = state.currentKeyRepetition >= reps;
    state.paddedChords = padProgression(
      loopTrim && !isLastRep ? state.currentRawChords.slice(0, -1) : state.currentRawChords,
      doubleTime
    );

    const shouldRepeatCurrentKey = oneChordSpec.active ? false : state.currentKeyRepetition < reps;
    state.nextKeyValue = shouldRepeatCurrentKey ? state.currentKey : nextKey(state.currentKey);
    if (oneChordSpec.active) {
      state.nextOneChordQualityValue = takeNextOneChordQuality(oneChordSpec.qualities, state.currentOneChordQualityValue);
      state.nextRawChords = [createOneChordToken(state.nextOneChordQualityValue)];
    } else {
      state.nextOneChordQualityValue = '';
      state.nextRawChords = state.currentRawChords;
    }
    const nextLoopTrim = !oneChordSpec.active && reps > 1 && canLoopTrimProgression(state.nextRawChords, doubleTime);
    const nextRepetition = shouldRepeatCurrentKey ? state.currentKeyRepetition + 1 : 1;
    const nextIsLastRep = nextRepetition >= reps;
    state.nextPaddedChords = padProgression(
      nextLoopTrim && !nextIsLastRep ? state.nextRawChords.slice(0, -1) : state.nextRawChords,
      doubleTime
    );

    const isMinor = oneChordSpec.active ? false : dom.majorMinor.checked;

    if (loopTrim) {
      if (state.currentKeyRepetition === 1) {
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
    const doubleTime = dom.doubleTime.checked;
    const beatsPerChord = doubleTime ? 2 : 4;

    while (state.nextBeatTime < state.audioCtx.currentTime + SCHEDULE_AHEAD) {
      if (state.isIntro) {
        playClick(state.nextBeatTime, state.currentBeat === 0);

        const introB = state.currentBeat;
        const introKey = state.currentKey;
        const introNextKey = state.nextKeyValue;
        const introFirstChord = state.paddedChords[0];
        const introDisplaySide = getIntroDisplaySide();
        scheduleDisplay(state.nextBeatTime, () => {
          applyDisplaySideLayout(introDisplaySide);
          dom.keyDisplay.textContent = '';
          dom.chordDisplay.textContent = '';
          showNextCol();
          dom.nextKeyDisplay.textContent = keyName(introKey);
          dom.nextChordDisplay.textContent = introFirstChord ? chordSymbol(introKey, introFirstChord) : '';
          fitHarmonyDisplay();
          updateBeatDots(introB, true);
        });

        state.currentBeat++;
        if (state.currentBeat >= 4) {
          state.currentBeat = 0;
          state.isIntro = false;
        }
        state.nextBeatTime += spb;
        continue;
      }

      scheduleDrumsForBeat(state.nextBeatTime, state.currentBeat, spb);

      const chord = state.paddedChords[state.currentChordIdx];
      const noteDuration = beatsPerChord * spb;
      const isChordBeat = doubleTime
        ? (state.currentBeat === 0 || state.currentBeat === 2)
        : (state.currentBeat === 0);

      if (isChordBeat) {
        const prevChord = state.lastPlayedChordIdx >= 0 ? state.paddedChords[state.lastPlayedChordIdx] : null;
        const sameChord = prevChord && prevChord.semitones === chord.semitones
          && prevChord.qualityMajor === chord.qualityMajor
          && prevChord.qualityMinor === chord.qualityMinor;

        if (!sameChord) {
          let sustainSlots = 1;
          for (let i = state.currentChordIdx + 1; i < state.paddedChords.length; i++) {
            const nextChord = state.paddedChords[i];
            if (
              nextChord.semitones === chord.semitones
              && nextChord.qualityMajor === chord.qualityMajor
              && nextChord.qualityMinor === chord.qualityMinor
            ) {
              sustainSlots++;
            } else {
              break;
            }
          }
          const sustainDuration = sustainSlots * beatsPerChord * spb;

          const midi = helpers.getBassMidi(state.currentKey, chord.semitones);
          playNote(midi, state.nextBeatTime, sustainDuration);

          if (isChordsEnabled()) {
            const isMinor = dom.majorMinor.checked;
            playChord(state.paddedChords, state.currentKey, state.currentChordIdx, isMinor, state.nextBeatTime, noteDuration);
          }
        }
        state.lastPlayedChordIdx = state.currentChordIdx;
      }

      const dispBeat = state.currentBeat;
      const dispChord = chord;
      const dispKey = state.currentKey;
      const dispNextKey = state.nextKeyValue;
      const dispRemainingBeats = getRemainingBeatsUntilNextProgression(
        state.currentChordIdx,
        state.currentBeat,
        state.paddedChords.length
      );
      const dispNextFirstChord = state.nextRawChords[0] || null;
      const dispCurrentSide = state.currentDisplaySide;
      scheduleDisplay(state.nextBeatTime, () => {
        if (!shouldShowNextPreview(dispKey, dispNextKey, dispRemainingBeats)) {
          dom.nextKeyDisplay.textContent = '';
          dom.nextChordDisplay.textContent = '';
          hideNextCol();
        }
        applyDisplaySideLayout(dispCurrentSide);
        dom.keyDisplay.textContent = keyName(dispKey);
        dom.chordDisplay.textContent = chordSymbol(dispKey, dispChord);
        if (shouldShowNextPreview(dispKey, dispNextKey, dispRemainingBeats)) {
          showNextCol();
          dom.nextKeyDisplay.textContent = keyName(dispNextKey);
          dom.nextChordDisplay.textContent = dispNextFirstChord ? chordSymbol(dispNextKey, dispNextFirstChord) : '';
        } else {
          dom.nextKeyDisplay.textContent = '';
          dom.nextChordDisplay.textContent = '';
          hideNextCol();
        }
        fitHarmonyDisplay();
        updateBeatDots(dispBeat, false);
      });

      state.currentBeat++;
      if (state.currentBeat >= 4) {
        state.currentBeat = 0;
      }

      if (doubleTime) {
        if (state.currentBeat === 0 || state.currentBeat === 2) {
          state.currentChordIdx++;
        }
      } else if (state.currentBeat === 0) {
        state.currentChordIdx++;
      }

      if (state.currentChordIdx >= state.paddedChords.length) {
        prepareNextProgression();
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
