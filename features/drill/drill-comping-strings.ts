export function createStringsComping({
  constants,
  helpers,
}) {
  const {
    CHORD_ANTICIPATION,
    CHORD_FADE_DUR,
    STRING_LEGATO_MAX_DISTANCE,
    STRING_LEGATO_GLIDE_TIME,
    STRING_LEGATO_PRE_DIP_TIME,
    STRING_LEGATO_PRE_DIP_RATIO,
    STRING_LEGATO_HOLD_TIME,
    STRING_LEGATO_FADE_TIME,
    AUTOMATION_CURVE_STEPS,
  } = constants;
  const {
    getAudioContext,
    getPreparedNextProgression,
    getVoicingAtIndex,
    playSample,
  } = helpers;

  const activeChordVoices = new Map();

  function getChordVoiceEntries(voicing) {
    if (!voicing) return [];

    const entries = [
      {
        key: `cello:${voicing.bassNote}`,
        category: 'cello',
        midi: voicing.bassNote,
        role: 'bass',
        volume: 10.0 * constants.CHORD_VOLUME_MULTIPLIER,
      },
    ];

    for (const midi of voicing.guideTones) {
      entries.push({
        key: `cello:${midi}`,
        category: 'cello',
        midi,
        role: 'guide',
        volume: 16.5 * constants.CHORD_VOLUME_MULTIPLIER,
      });
    }

    for (const midi of voicing.colorTones) {
      entries.push({
        key: `violin:${midi}`,
        category: 'violin',
        midi,
        role: 'color',
        volume: 6.5 * constants.CHORD_VOLUME_MULTIPLIER,
      });
    }

    return entries;
  }

  function buildPlan({ chords, beatsPerChord }) {
    if (!Array.isArray(chords) || chords.length === 0) {
      return { style: 'strings', events: [] };
    }

    const events = [];
    let previousChord = null;
    for (let chordIdx = 0; chordIdx < chords.length; chordIdx++) {
      const chord = chords[chordIdx];
      const sameAsPrevious = previousChord
        && previousChord.semitones === chord.semitones
        && (previousChord.bassSemitones ?? previousChord.semitones) === (chord.bassSemitones ?? chord.semitones)
        && previousChord.qualityMajor === chord.qualityMajor
        && previousChord.qualityMinor === chord.qualityMinor;
      if (!sameAsPrevious) {
        events.push({
          chordIdx,
          sourceChordIdx: chordIdx,
          targetChordIdx: chordIdx,
          targetVoicingChordIdx: chordIdx,
          timeBeats: chordIdx * beatsPerChord,
          isAnticipation: false,
        });
      }
      previousChord = chord;
    }

    return { style: 'strings', events };
  }

  function collectSampleNotes(voicing, sets) {
    if (!voicing) return;
    sets.celloNotes.add(voicing.bassNote);
    for (const midi of voicing.guideTones || []) sets.celloNotes.add(midi);
    for (const midi of voicing.colorTones || []) sets.violinNotes.add(midi);
  }

  function getVoiceSustainSlots(chords, key, chordIdx, voiceKey, isMinor, nextProgression = null) {
    let sustainSlots = 1;
    let reachesSequenceEnd = true;

    for (let i = chordIdx + 1; i < chords.length; i++) {
      const nextVoicing = getVoicingAtIndex(chords, key, i, isMinor);
      const nextVoiceKeys = new Set(getChordVoiceEntries(nextVoicing).map(voice => voice.key));
      if (!nextVoiceKeys.has(voiceKey)) {
        reachesSequenceEnd = false;
        break;
      }
      sustainSlots++;
    }

    if (!nextProgression || !reachesSequenceEnd) {
      return sustainSlots;
    }

    for (let i = 0; i < nextProgression.chords.length; i++) {
      const nextVoicing = getVoicingAtIndex(nextProgression.chords, nextProgression.key, i, isMinor);
      const nextVoiceKeys = new Set(getChordVoiceEntries(nextVoicing).map(voice => voice.key));
      if (!nextVoiceKeys.has(voiceKey)) break;
      sustainSlots++;
    }

    return sustainSlots;
  }

  function fadeOutChordVoice(voice, fadeStart, fadeEnd) {
    voice.gain.gain.cancelScheduledValues(fadeStart);
    voice.gain.gain.setValueAtTime(voice.volume, fadeStart);
    voice.gain.gain.linearRampToValueAtTime(0, fadeEnd);
    if (voice.stop) {
      voice.stop(fadeEnd);
    }
    voice.audibleUntil = Math.min(voice.audibleUntil, fadeEnd);
  }

  function pruneExpiredChordVoices(time) {
    for (const [voiceKey, voice] of activeChordVoices.entries()) {
      if (voice.audibleUntil <= time) {
        activeChordVoices.delete(voiceKey);
      }
    }
  }

  function scheduleEaseOutAutomation(param, startTime, endTime, startValue, endValue) {
    const duration = endTime - startTime;
    if (duration <= 0) {
      param.setValueAtTime(endValue, endTime);
      return;
    }

    const curve = new Float32Array(AUTOMATION_CURVE_STEPS);
    for (let i = 0; i < AUTOMATION_CURVE_STEPS; i++) {
      const t = i / (AUTOMATION_CURVE_STEPS - 1);
      const eased = 1 - Math.pow(1 - t, 2);
      curve[i] = startValue + (endValue - startValue) * eased;
    }

    param.setValueCurveAtTime(curve, startTime, duration);
  }

  function findLegatoTransitions(exitingVoices, targetVoices) {
    if (exitingVoices.length === 0 || targetVoices.length === 0) return new Map();

    const transitions = new Map();
    const remainingTargets = [...targetVoices];
    const sortedVoices = [...exitingVoices].sort((a, b) => b.midi - a.midi);

    for (const voice of sortedVoices) {
      let bestTargetIndex = -1;
      let bestDistance = Infinity;

      for (let i = 0; i < remainingTargets.length; i++) {
        const target = remainingTargets[i];
        const distance = Math.abs(target.midi - voice.midi);
        if (distance > STRING_LEGATO_MAX_DISTANCE) continue;
        if (distance < bestDistance || (distance === bestDistance && target.midi > remainingTargets[bestTargetIndex]?.midi)) {
          bestTargetIndex = i;
          bestDistance = distance;
        }
      }

      if (bestTargetIndex === -1) continue;
      transitions.set(voice, remainingTargets[bestTargetIndex]);
      remainingTargets.splice(bestTargetIndex, 1);
    }

    return transitions;
  }

  function applyLegatoFadeOut(voice, targetMidi, targetTime) {
    const audioCtx = getAudioContext();
    if (!audioCtx || !voice?.detuneParams?.length) return false;

    const startTime = Math.max(targetTime - STRING_LEGATO_GLIDE_TIME, audioCtx.currentTime);
    const dipStart = Math.max(startTime - STRING_LEGATO_PRE_DIP_TIME, audioCtx.currentTime);
    const glideEnd = startTime + STRING_LEGATO_GLIDE_TIME;
    const holdEnd = glideEnd + STRING_LEGATO_HOLD_TIME;
    const fadeEnd = holdEnd + STRING_LEGATO_FADE_TIME;
    const detuneAmount = (targetMidi - voice.midi) * 100;
    const dippedVolume = voice.volume * STRING_LEGATO_PRE_DIP_RATIO;

    for (const detune of voice.detuneParams) {
      detune.cancelScheduledValues(dipStart);
      detune.setValueAtTime(0, startTime);
      scheduleEaseOutAutomation(detune, startTime, glideEnd, 0, detuneAmount);
    }

    voice.gain.gain.cancelScheduledValues(dipStart);
    voice.gain.gain.setValueAtTime(voice.volume, dipStart);
    scheduleEaseOutAutomation(voice.gain.gain, dipStart, startTime, voice.volume, dippedVolume);
    voice.gain.gain.setValueAtTime(dippedVolume, glideEnd);
    voice.gain.gain.setValueAtTime(dippedVolume, holdEnd);
    scheduleEaseOutAutomation(voice.gain.gain, holdEnd, fadeEnd, dippedVolume, 0);

    if (voice.stop) {
      voice.stop(fadeEnd);
    }
    voice.audibleUntil = Math.min(voice.audibleUntil, fadeEnd);
    return true;
  }

  function playEvent({ progression, event, time, slotDuration, nextProgression }) {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const voicing = getVoicingAtIndex(progression.chords, progression.key, event.targetVoicingChordIdx, progression.isMinor);
    if (!voicing) return;

    const earlyTime = Math.max(time - CHORD_ANTICIPATION, audioCtx.currentTime);
    pruneExpiredChordVoices(earlyTime);
    const targetVoiceKeys = new Set();
    const targetVoices = getChordVoiceEntries(voicing);

    for (const voice of targetVoices) {
      targetVoiceKeys.add(voice.key);
      if (activeChordVoices.has(voice.key)) continue;

      const sustainSlots = getVoiceSustainSlots(
        progression.chords,
        progression.key,
        event.targetChordIdx,
        voice.key,
        progression.isMinor,
        nextProgression
      );
      const adjustedDuration = sustainSlots * slotDuration + CHORD_ANTICIPATION;
      const activeVoice = playSample(voice.category, voice.midi, earlyTime, adjustedDuration, voice.volume);
      if (activeVoice) {
        activeVoice.role = voice.role;
        activeVoice.endAnchor.onended = () => {
          const currentVoice = activeChordVoices.get(voice.key);
          if (currentVoice === activeVoice) {
            activeChordVoices.delete(voice.key);
          }
        };
        activeChordVoices.set(voice.key, activeVoice);
      }
    }

    const exitingVoices = [];
    for (const [voiceKey, voice] of activeChordVoices.entries()) {
      if (targetVoiceKeys.has(voiceKey)) continue;
      if (voice.role === 'guide') {
        exitingVoices.push(voice);
      }
    }

    const eligibleTargetVoices = targetVoices.filter(voice => voice.role === 'guide');
    const legatoTransitions = findLegatoTransitions(exitingVoices, eligibleTargetVoices);

    for (const [voiceKey, voice] of activeChordVoices.entries()) {
      if (targetVoiceKeys.has(voiceKey)) continue;
      const legatoTarget = constants.PORTAMENTO_ALWAYS_ON ? legatoTransitions.get(voice) : null;
      const usedLegato = legatoTarget && applyLegatoFadeOut(voice, legatoTarget.midi, time);
      if (!usedLegato) {
        const fadeStart = Math.max(time, audioCtx.currentTime);
        fadeOutChordVoice(voice, fadeStart, fadeStart + CHORD_FADE_DUR);
      }
      activeChordVoices.delete(voiceKey);
    }
  }

  function stopAll(stopTime = getAudioContext()?.currentTime ?? 0, fadeDuration = constants.NOTE_FADEOUT) {
    const fadeEnd = stopTime + fadeDuration;

    for (const voice of activeChordVoices.values()) {
      try {
        voice.gain.gain.cancelScheduledValues(stopTime);
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, stopTime);
        voice.gain.gain.linearRampToValueAtTime(0, fadeEnd);
      } catch (err) {
        // Ignore nodes that have already been disconnected or stopped.
      }

      if (voice.stop) {
        voice.stop(fadeEnd);
      }
      voice.audibleUntil = Math.min(voice.audibleUntil, fadeEnd);
    }

    activeChordVoices.clear();
  }

  function clear() {
    activeChordVoices.clear();
  }

  return {
    buildPlan,
    collectSampleNotes,
    playEvent,
    stopAll,
    clear,
  };
}
