export function createPlaybackScheduler({ dom, state, constants, helpers }) {
  const { SCHEDULE_AHEAD } = constants;
  const {
    applyDisplaySideLayout,
    bassMidiToNoteName,
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
    getRemainingBeatsUntilNextProgression,
    getRepetitionsPerKey,
    getSecondsPerBeat,
    hideNextCol,
    isCustomMediumSwingBassEnabled,
    isWalkingBassDebugEnabled,
    isChordsEnabled,
    isVoiceLeadingV2Enabled,
    keyName,
    nextKey,
    padProgression,
    parseOneChordSpec,
    parsePattern,
    playClick,
    playNote,
    scheduleDrumsForBeat,
    shouldShowNextPreview,
    showNextCol,
    takeNextOneChordQuality,
    trackProgressionOccurrence,
    updateBeatDots
  } = helpers;

  function formatBassBeatValue(value) {
    const rounded = Math.round(value * 1000) / 1000;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }

  function logWalkingBassMeasure(measureStartBeats, measureChordIndex) {
    if (!isWalkingBassDebugEnabled()) return;
    if (!state.walkingBassLoggedMeasures) {
      state.walkingBassLoggedMeasures = new Set();
    }
    if (state.walkingBassLoggedMeasures.has(measureStartBeats)) return;
    state.walkingBassLoggedMeasures.add(measureStartBeats);

    const measureEvents = state.currentBassPlan
      .filter((event) => event.timeBeats >= measureStartBeats && event.timeBeats < measureStartBeats + 4);
    const chord = state.paddedChords[measureChordIndex] || null;
    const chordLabel = chord ? chordSymbol(state.currentKey, chord) : '?';
    const lines = [`[walking-bass] measure ${measureStartBeats / 4 + 1} | beats ${measureStartBeats}-${measureStartBeats + 3} | ${chordLabel}`];

    measureEvents.forEach((event) => {
      const role = event.rank === 'approach'
        ? `approach -> ${bassMidiToNoteName(event.targetMidi)} (${event.targetMidi})`
        : `${event.rank}/${event.source}`;
      lines.push(`beat ${formatBassBeatValue(event.timeBeats)}: ${bassMidiToNoteName(event.midi)} (${event.midi}), vel=${event.velocity}, ${role}`);
    });

    const wholeBeatStarts = new Set(
      measureEvents
        .filter((event) => Math.abs(event.timeBeats - Math.round(event.timeBeats)) < 0.001)
        .map((event) => Math.round(event.timeBeats))
    );
    for (let beat = measureStartBeats; beat < measureStartBeats + 4; beat += 1) {
      if (!wholeBeatStarts.has(beat)) {
        lines.push(`beat ${beat}: (hole)`);
      }
    }

    if (lines.length === 1) {
      lines.push('(no events)');
    }
    console.log(lines.join('\n'));
  }

  function prepareNextProgression() {
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
      if (state.isIntro) {
        playClick(state.nextBeatTime, state.currentBeat === 0);

        const introB = state.currentBeat;
        const introKey = state.currentKey;
        const introNextKey = state.nextKeyValue;
        const introFirstChord = state.paddedChords[0];
        scheduleDisplay(state.nextBeatTime, () => {
          applyDisplaySideLayout();
          dom.keyDisplay.textContent = '';
          dom.chordDisplay.innerHTML = '';
          showNextCol();
          dom.nextKeyDisplay.textContent = keyName(introKey);
          dom.nextChordDisplay.innerHTML = introFirstChord ? chordSymbolHtml(introKey, introFirstChord) : '';
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
      const chordsPerMeasure = chordsPerBar;
      const windowStartBeats = Math.floor(state.currentChordIdx / chordsPerMeasure) * 4 + state.currentBeat;
      const windowEndBeats = windowStartBeats + 1;
      const beatStep = beatsPerChord;
      const measureProgressBeats = (state.currentChordIdx % chordsPerMeasure) * beatStep;
      const isChordBeat = Math.abs(state.currentBeat - measureProgressBeats) < 0.001;
      const customBassEnabled = isCustomMediumSwingBassEnabled();
      const measureStartChordIdx = Math.floor(state.currentChordIdx / chordsPerMeasure) * chordsPerMeasure;
      const measureStartBeats = Math.floor(windowStartBeats / 4) * 4;

      if (customBassEnabled && isWalkingBassDebugEnabled() && state.currentBeat === 0) {
        scheduleDisplay(state.nextBeatTime, () => logWalkingBassMeasure(measureStartBeats, measureStartChordIdx));
      }

      if (customBassEnabled) {
        const bassEvents = state.currentBassPlan.filter((event) => event.timeBeats >= windowStartBeats && event.timeBeats < windowEndBeats);
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
        } else if (isWalkingBassDebugEnabled()) {
          console.warn(
            `[walking-bass] no event for beat ${windowStartBeats} (chordIndex=${state.currentChordIdx}, currentBeat=${state.currentBeat}, totalEvents=${state.currentBassPlan.length})`
          );
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
        compingEngine.scheduleWindow({
          style: getCompingStyle(),
          progression: {
            chords: state.paddedChords,
            key: state.currentKey,
            isMinor,
          },
          plan: state.currentCompingPlan,
          nextProgression: {
            chords: state.nextPaddedChords,
            key: state.nextKeyValue,
            isMinor,
          },
          slotDuration: noteDuration,
          windowStartBeats,
          windowEndBeats,
          beatStartTime: state.nextBeatTime,
          secondsPerBeat: spb,
        });
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
      scheduleDisplay(state.nextBeatTime, () => {
        if (!shouldShowNextPreview(dispKey, dispNextKey, dispRemainingBeats)) {
          dom.nextKeyDisplay.textContent = '';
          dom.nextChordDisplay.innerHTML = '';
          hideNextCol();
        }
        applyDisplaySideLayout();
        dom.keyDisplay.textContent = keyName(dispKey);
        dom.chordDisplay.innerHTML = chordSymbolHtml(dispKey, dispChord);
        if (shouldShowNextPreview(dispKey, dispNextKey, dispRemainingBeats)) {
          showNextCol();
          dom.nextKeyDisplay.textContent = keyName(dispNextKey);
          dom.nextChordDisplay.innerHTML = dispNextFirstChord ? chordSymbolHtml(dispNextKey, dispNextFirstChord) : '';
        } else {
          dom.nextKeyDisplay.textContent = '';
          dom.nextChordDisplay.innerHTML = '';
          hideNextCol();
        }
        fitHarmonyDisplay();
        updateBeatDots(dispBeat, false);
      });

      state.currentBeat++;
      if (state.currentBeat >= 4) {
        state.currentBeat = 0;
      }

      const nextMeasureProgressBeats = ((state.currentChordIdx + 1) % chordsPerMeasure) * beatStep;
      if (state.currentBeat === 0 || Math.abs(state.currentBeat - nextMeasureProgressBeats) < 0.001) {
        state.currentChordIdx++;
      }

      if (state.currentChordIdx >= state.paddedChords.length) {
        trackProgressionOccurrence({
          key_repetition_index: state.currentKeyRepetition,
          played_chord_count: state.currentRawChords.length || state.paddedChords.length || 0
        });
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
