export type PracticePlaybackResourceChord = {
  semitones: number;
  bassSemitones?: number;
  [key: string]: unknown;
};

export type DrillPlaybackVoicingPlan = unknown[] | null | undefined;
export type DrillPlaybackCompingPlan = unknown;
export type DrillPlaybackBassPlan = unknown[];

export type PracticePlaybackResourcesHarmonyBindings = {
  getPlayedChordQuality?: (
    chord: PracticePlaybackResourceChord,
    isMinor: boolean,
    nextChord?: PracticePlaybackResourceChord | null
  ) => string;
  getVoicingPlanForProgression?: (
    chords: PracticePlaybackResourceChord[],
    key: number,
    isMinor: boolean
  ) => DrillPlaybackVoicingPlan;
  getVoicing?: (
    key: number,
    chord: PracticePlaybackResourceChord,
    isMinor: boolean,
    nextChord?: PracticePlaybackResourceChord | null
  ) => unknown;
};

export type PracticePlaybackResourcesProgressionStateBindings = {
  getNextKeyValue?: () => number | null;
  getNextPaddedChords?: () => PracticePlaybackResourceChord[] | null;
  getNextVoicingPlan?: () => DrillPlaybackVoicingPlan;
  getNextCompingPlan?: () => DrillPlaybackCompingPlan;
  setCurrentCompingPlan?: (value: DrillPlaybackCompingPlan) => void;
  setNextCompingPlan?: (value: DrillPlaybackCompingPlan) => void;
  getPaddedChords?: () => PracticePlaybackResourceChord[];
  getCurrentKey?: () => number;
  getCurrentVoicingPlan?: () => unknown[];
  getCurrentBassPlan?: () => DrillPlaybackBassPlan;
  setCurrentBassPlan?: (value: DrillPlaybackBassPlan) => void;
  getNextPaddedChordsForBass?: () => PracticePlaybackResourceChord[];
  getNextKeyForBass?: () => number | null;
};

export type PracticePlaybackResourcesSettingsBindings = {
  getIsMinorMode?: () => boolean;
  getBeatsPerChord?: () => number;
  getCompingStyle?: () => string;
  getTempoBpm?: () => number;
  isWalkingBassEnabled?: () => boolean;
  getSwingRatio?: () => number;
};

export type PracticePlaybackPreparedPlans = {
  currentPlan: DrillPlaybackCompingPlan;
  nextPlan: DrillPlaybackCompingPlan;
};

export type PracticePlaybackResourcesCompingEngine = {
  buildPreparedPlans: (options: {
    style: string;
    previousKey: number;
    currentHasIncomingAnticipation: boolean;
    currentPreviousTailBeats: number | null;
    current: {
      chords: PracticePlaybackResourceChord[];
      key: number;
      isMinor: boolean;
      voicingPlan: unknown[];
      beatsPerChord: number;
    };
    next: {
      chords: PracticePlaybackResourceChord[] | null;
      key: number | null;
      isMinor: boolean;
      voicingPlan: DrillPlaybackVoicingPlan;
      beatsPerChord: number;
    };
  }) => PracticePlaybackPreparedPlans;
};

export type PracticePlaybackResourcesWalkingBassGenerator = {
  buildLine: (options: {
    chords: PracticePlaybackResourceChord[];
    key: number;
    beatsPerChord: number;
    tempoBpm: number;
    isMinor: boolean;
    initialPendingTargetMidi: number | null;
    nextChords: PracticePlaybackResourceChord[];
    nextKey: number;
    nextIsMinor: boolean;
    swingRatio: number;
  }) => DrillPlaybackBassPlan;
};

export type PracticePlaybackResourcesRuntimeBindings = {
  compingEngine?: PracticePlaybackResourcesCompingEngine;
  walkingBassGenerator?: PracticePlaybackResourcesWalkingBassGenerator | null;
};

export type PracticePlaybackResourcesAudioFacade = {
  preloadStartupSamples?: () => Promise<unknown>;
  preloadNearTermSamples?: () => Promise<unknown>;
  ensureNearTermSamplePreload?: () => Promise<unknown>;
  ensurePageSampleWarmup?: () => Promise<unknown>;
  ensureBackgroundSamplePreload?: () => Promise<unknown>;
};

export type PracticePlaybackResourcesAppContextShape = {
  harmony: PracticePlaybackResourcesHarmonyBindings;
  progressionState: PracticePlaybackResourcesProgressionStateBindings;
  playbackSettings: PracticePlaybackResourcesSettingsBindings;
  runtime: PracticePlaybackResourcesRuntimeBindings;
  audioFacade: PracticePlaybackResourcesAudioFacade;
};

export type PracticePlaybackResourcesPreparationFacade = {
  rebuildPreparedCompingPlans?: (
    previousKey?: number,
    currentHasIncomingAnticipation?: boolean,
    currentPreviousTailBeats?: number | null
  ) => void;
  ensureWalkingBassGenerator?: () => Promise<unknown>;
  buildPreparedBassPlan?: (initialPendingTargetMidi?: number | null) => DrillPlaybackBassPlan;
};
