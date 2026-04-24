import { createStringsComping } from './drill-comping-strings.js';
import { createPianoComping } from './drill-comping-piano.js';

type DrillCompingPlan = {
  style?: string;
  events?: Array<{ timeBeats?: number } & Record<string, unknown>>;
  anticipatesNextStart?: boolean;
};

type DrillCompingProgressionState = {
  chords: any[];
  key?: number | null;
  isMinor?: boolean;
  beatsPerChord: number;
  voicingPlan?: any[] | null;
};

type DrillCompingPreparedPlansOptions = {
  style: string;
  previousKey?: number | null;
  currentHasIncomingAnticipation?: boolean;
  currentPreviousTailBeats?: number | null;
  current: DrillCompingProgressionState;
  next: DrillCompingProgressionState;
};

type DrillCompingScheduleWindowOptions = {
  style: string;
  progression: DrillCompingProgressionState;
  plan: DrillCompingPlan | null | undefined;
  nextProgression?: DrillCompingProgressionState;
  nextPlan?: DrillCompingPlan | null;
  slotDuration: number;
  windowStartBeats: number;
  windowEndBeats: number;
  beatStartTime: number;
  secondsPerBeat: number;
};

type DrillCompingEngineOptions = {
  constants?: Record<string, any>;
  helpers?: Record<string, any>;
};

export function createCompingEngine({ constants, helpers }: DrillCompingEngineOptions = {}) {
  const stringsComping = createStringsComping({ constants, helpers });
  const pianoComping = createPianoComping({ constants, helpers });

  function isPianoStyle(style: string) {
    return style === 'piano';
  }

  function getStyleModule(style: string): any {
    return isPianoStyle(style) ? pianoComping : stringsComping;
  }

  function getLastEventTailBeats(plan: DrillCompingPlan | null, totalBeats: number) {
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
  }: DrillCompingPreparedPlansOptions) {
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

  function collectSampleNotes(
    style: string,
    voicing: any,
    sets: { celloNotes?: Set<number>; violinNotes?: Set<number>; pianoNotes?: Set<number> }
  ) {
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
  }: DrillCompingScheduleWindowOptions) {
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

  function stopActiveComping(stopTime: number, fadeDuration: number) {
    stringsComping.stopAll?.(stopTime, fadeDuration);
    (pianoComping as any).stopAll?.(stopTime, fadeDuration);
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

