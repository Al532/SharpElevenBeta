import { createStringsComping } from './comping-strings.js';
import { createPianoComping } from './comping-piano.js';

export function createCompingEngine({ constants, helpers }) {
  const stringsComping = createStringsComping({ constants, helpers });
  const pianoComping = createPianoComping({ constants, helpers });

  function isPianoStyle(style) {
    return style === 'piano';
  }

  function getStyleModule(style) {
    return isPianoStyle(style) ? pianoComping : stringsComping;
  }

  function getLastEventTailBeats(plan, totalBeats) {
    const events = plan?.events || [];
    if (events.length === 0 || !Number.isFinite(totalBeats)) return null;
    const lastTimeBeats = events[events.length - 1]?.timeBeats;
    if (!Number.isFinite(lastTimeBeats)) return null;
    return Math.max(0, totalBeats - lastTimeBeats);
  }

  function buildPreparedPlans({
    style,
    previousKey,
    currentHasIncomingAnticipation = false,
    currentPreviousTailBeats = null,
    current,
    next,
  }) {
    if (style === 'off') {
      return {
        currentPlan: { style: 'off', events: [], anticipatesNextStart: false },
        nextPlan: { style: 'off', events: [], anticipatesNextStart: false },
      };
    }

    if (isPianoStyle(style)) {
      const currentPlan = pianoComping.buildPlan({
        chords: current.chords,
        key: current.key,
        isMinor: current.isMinor,
        beatsPerChord: current.beatsPerChord,
        nextFirstChord: next.chords[0] || null,
        nextKey: next.key,
        nextIsMinor: next.isMinor,
        nextStartsNewKey: next.key !== current.key,
        shouldReset: previousKey === null || previousKey !== current.key,
        hasIncomingAnticipation: currentHasIncomingAnticipation,
        previousTailBeats: currentPreviousTailBeats,
      });
      const previousTailBeats = getLastEventTailBeats(
        currentPlan,
        (current.chords?.length || 0) * (current.beatsPerChord || 0)
      );
      const nextPlan = pianoComping.buildPlan({
        chords: next.chords,
        key: next.key,
        isMinor: next.isMinor,
        beatsPerChord: next.beatsPerChord,
        nextFirstChord: null,
        nextKey: null,
        nextIsMinor: next.isMinor,
        shouldReset: next.key !== current.key && !currentPlan.anticipatesNextStart,
        hasIncomingAnticipation: currentPlan.anticipatesNextStart,
        previousTailBeats,
      });
      return { currentPlan, nextPlan };
    }

    return {
      currentPlan: stringsComping.buildPlan(current),
      nextPlan: stringsComping.buildPlan(next),
    };
  }

  function collectSampleNotes(style, voicing, sets) {
    if (style === 'off') return;
    getStyleModule(style).collectSampleNotes(voicing, sets);
  }

  function scheduleWindow({
    style,
    progression,
    plan,
    nextProgression,
    nextPlan,
    slotDuration,
    windowStartBeats,
    windowEndBeats,
    beatStartTime,
    secondsPerBeat,
  }) {
    if (!plan?.events?.length) return;

    const styleModule = getStyleModule(style);
    for (const event of plan.events) {
      if (event.timeBeats < windowStartBeats || event.timeBeats >= windowEndBeats) continue;
      const eventTime = beatStartTime + ((event.timeBeats - windowStartBeats) * secondsPerBeat);
      styleModule.playEvent({
        progression,
        event,
        plan,
        nextPlan,
        time: eventTime,
        slotDuration,
        secondsPerBeat,
        nextProgression,
      });
    }
  }

  function stopActiveComping(stopTime, fadeDuration) {
    stringsComping.stopAll(stopTime, fadeDuration);
    pianoComping.stopAll(stopTime, fadeDuration);
  }

  function clear() {
    stringsComping.clear();
    pianoComping.clear();
  }

  return {
    buildPreparedPlans,
    collectSampleNotes,
    scheduleWindow,
    stopActiveComping,
    clear,
  };
}
