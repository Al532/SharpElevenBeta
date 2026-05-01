import { createStringsComping } from './practice-arrangement-comping-strings.js';
import { createPianoComping } from './practice-arrangement-comping-piano.js';

type PracticeArrangementCompingPlan = {
  style?: string;
  events?: Array<{ timeBeats?: number } & Record<string, unknown>>;
  anticipatesNextStart?: boolean;
};

type PracticeArrangementCompingProgressionState = {
  chords: any[];
  key?: number | null;
  isMinor?: boolean;
  beatsPerChord: number;
  beatsPerBar?: number;
  voicingPlan?: any[] | null;
};

type PracticeArrangementCompingPreparedPlansOptions = {
  style: string;
  previousKey?: number | null;
  currentHasIncomingAnticipation?: boolean;
  currentPreviousTailBeats?: number | null;
  endingCue?: Record<string, unknown> | null;
  current: PracticeArrangementCompingProgressionState;
  next: PracticeArrangementCompingProgressionState;
};

type PracticeArrangementCompingScheduleWindowOptions = {
  style: string;
  progression: PracticeArrangementCompingProgressionState;
  plan: PracticeArrangementCompingPlan | null | undefined;
  nextProgression?: PracticeArrangementCompingProgressionState;
  nextPlan?: PracticeArrangementCompingPlan | null;
  endingCue?: Record<string, unknown> | null;
  endingAccentMultiplier?: number;
  endingFinalAccentMultiplier?: number;
  endingCrescendoLeadMeasures?: number;
  slotDuration: number;
  windowStartBeats: number;
  windowEndBeats: number;
  beatStartTime: number;
  secondsPerBeat: number;
};

type PracticeArrangementCompingScheduleEndingOptions = {
  style: string;
  progression: PracticeArrangementCompingProgressionState;
  chordIndex: number;
  time: number;
  durationSeconds?: number | null;
  endingStyle?: string;
  endingAccentMultiplier?: number;
  endingFinalAccentMultiplier?: number;
  endingCrescendoLeadMeasures?: number;
  slotDuration: number;
  secondsPerBeat: number;
};

type PracticeArrangementCompingEngineOptions = {
  constants?: Record<string, unknown>;
  helpers?: Record<string, unknown>;
};

type PracticeArrangementCompingStyleModule = {
  buildPlan: (options: unknown) => PracticeArrangementCompingPlan;
  collectSampleNotes: (voicing: unknown, sets: { celloNotes?: Set<number>; violinNotes?: Set<number>; pianoNotes?: Set<number> }) => void;
  playEvent: (options: {
    progression: PracticeArrangementCompingProgressionState;
    event: { timeBeats?: number } & Record<string, unknown>;
    plan: PracticeArrangementCompingPlan;
    nextPlan?: PracticeArrangementCompingPlan | null;
    endingCue?: Record<string, unknown> | null;
    endingAccentMultiplier?: number;
    endingFinalAccentMultiplier?: number;
    endingCrescendoLeadMeasures?: number;
    time: number;
    slotDuration: number;
    secondsPerBeat: number;
    nextProgression?: PracticeArrangementCompingProgressionState;
  }) => void;
  playEnding?: (options: Omit<PracticeArrangementCompingScheduleEndingOptions, 'style'>) => void;
  stopAll?: (stopTime: number, fadeDuration: number) => void;
  clear: () => void;
};

export function createCompingEngine({ constants, helpers }: PracticeArrangementCompingEngineOptions = {}) {
  const stringsComping = createStringsComping({ constants, helpers }) as unknown as PracticeArrangementCompingStyleModule;
  const pianoComping = createPianoComping({ constants, helpers }) as unknown as PracticeArrangementCompingStyleModule;

  function isPianoStyle(style: string) {
    return style === 'piano';
  }

  function getStyleModule(style: string): PracticeArrangementCompingStyleModule {
    return isPianoStyle(style) ? pianoComping : stringsComping;
  }

  function getLastEventTailBeats(plan: PracticeArrangementCompingPlan | null, totalBeats: number) {
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
    endingCue = null,
    current,
    next,
  }: PracticeArrangementCompingPreparedPlansOptions) {
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
        beatsPerBar: current.beatsPerBar,
        nextFirstChord: next.chords[0] || null,
        nextKey: next.key,
        nextIsMinor: next.isMinor,
        nextStartsNewKey: next.key !== current.key,
        shouldReset: previousKey === null || previousKey !== current.key,
        hasIncomingAnticipation: currentHasIncomingAnticipation,
        previousTailBeats: currentPreviousTailBeats,
        endingCue,
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
        beatsPerBar: next.beatsPerBar,
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
    endingCue,
    endingAccentMultiplier,
    endingFinalAccentMultiplier,
    endingCrescendoLeadMeasures,
    slotDuration,
    windowStartBeats,
    windowEndBeats,
    beatStartTime,
    secondsPerBeat,
  }: PracticeArrangementCompingScheduleWindowOptions) {
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
        endingCue,
        endingAccentMultiplier,
        endingFinalAccentMultiplier,
        endingCrescendoLeadMeasures,
        time: eventTime,
        slotDuration,
        secondsPerBeat,
        nextProgression,
      });
    }
  }

  function scheduleEnding({
    style,
    progression,
    chordIndex,
    time,
    durationSeconds,
    endingStyle,
    endingAccentMultiplier,
    endingFinalAccentMultiplier,
    endingCrescendoLeadMeasures,
    slotDuration,
    secondsPerBeat,
  }: PracticeArrangementCompingScheduleEndingOptions) {
    if (style === 'off') return;
    getStyleModule(style).playEnding?.({
      progression,
      chordIndex,
      time,
      durationSeconds,
      endingStyle,
      endingAccentMultiplier,
      endingFinalAccentMultiplier,
      endingCrescendoLeadMeasures,
      slotDuration,
      secondsPerBeat,
    });
  }

  function stopActiveComping(stopTime: number, fadeDuration: number) {
    stringsComping.stopAll?.(stopTime, fadeDuration);
    pianoComping.stopAll?.(stopTime, fadeDuration);
  }

  function clear() {
    stringsComping.clear();
    pianoComping.clear();
  }

  return {
    buildPreparedPlans,
    collectSampleNotes,
    scheduleWindow,
    scheduleEnding,
    stopActiveComping,
    clear,
  };
}

