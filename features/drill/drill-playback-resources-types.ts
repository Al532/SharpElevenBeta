export type DrillPlaybackResourceChord = {
  semitones: number;
  bassSemitones?: number;
  [key: string]: unknown;
};

export type DrillPlaybackVoicingPlan = unknown[] | null | undefined;
export type DrillPlaybackCompingPlan = unknown;
export type DrillPlaybackBassPlan = unknown[];

export type DrillPlaybackResourcesHarmonyBindings = {
  getPlayedChordQuality?: (
    chord: DrillPlaybackResourceChord,
    isMinor: boolean,
    nextChord?: DrillPlaybackResourceChord | null
  ) => string;
  getVoicingPlanForProgression?: (
    chords: DrillPlaybackResourceChord[],
    key: number,
    isMinor: boolean
  ) => DrillPlaybackVoicingPlan;
  getVoicing?: (
    key: number,
    chord: DrillPlaybackResourceChord,
    isMinor: boolean,
    nextChord?: DrillPlaybackResourceChord | null
  ) => unknown;
};

export type DrillPlaybackResourcesProgressionStateBindings = {
  getNextKeyValue?: () => number | null;
  getNextPaddedChords?: () => DrillPlaybackResourceChord[] | null;
  getNextVoicingPlan?: () => DrillPlaybackVoicingPlan;
  getNextCompingPlan?: () => DrillPlaybackCompingPlan;
  setCurrentCompingPlan?: (value: DrillPlaybackCompingPlan) => void;
  setNextCompingPlan?: (value: DrillPlaybackCompingPlan) => void;
  getPaddedChords?: () => DrillPlaybackResourceChord[];
  getCurrentKey?: () => number;
  getCurrentVoicingPlan?: () => unknown[];
  getCurrentBassPlan?: () => DrillPlaybackBassPlan;
  setCurrentBassPlan?: (value: DrillPlaybackBassPlan) => void;
  getNextPaddedChordsForBass?: () => DrillPlaybackResourceChord[];
  getNextKeyForBass?: () => number | null;
};

export type DrillPlaybackResourcesSettingsBindings = {
  getIsMinorMode?: () => boolean;
  getBeatsPerChord?: () => number;
  getCompingStyle?: () => string;
  getTempoBpm?: () => number;
  isWalkingBassEnabled?: () => boolean;
  getSwingRatio?: () => number;
};

export type DrillPlaybackPreparedPlans = {
  currentPlan: DrillPlaybackCompingPlan;
  nextPlan: DrillPlaybackCompingPlan;
};

export type DrillPlaybackResourcesCompingEngine = {
  buildPreparedPlans: (options: {
    style: string;
    previousKey: number;
    currentHasIncomingAnticipation: boolean;
    currentPreviousTailBeats: number | null;
    current: {
      chords: DrillPlaybackResourceChord[];
      key: number;
      isMinor: boolean;
      voicingPlan: unknown[];
      beatsPerChord: number;
    };
    next: {
      chords: DrillPlaybackResourceChord[] | null;
      key: number | null;
      isMinor: boolean;
      voicingPlan: DrillPlaybackVoicingPlan;
      beatsPerChord: number;
    };
  }) => DrillPlaybackPreparedPlans;
};

export type DrillPlaybackResourcesWalkingBassGenerator = {
  buildLine: (options: {
    chords: DrillPlaybackResourceChord[];
    key: number;
    beatsPerChord: number;
    tempoBpm: number;
    isMinor: boolean;
    initialPendingTargetMidi: number | null;
    nextChords: DrillPlaybackResourceChord[];
    nextKey: number;
    nextIsMinor: boolean;
    swingRatio: number;
  }) => DrillPlaybackBassPlan;
};

export type DrillPlaybackResourcesRuntimeBindings = {
  compingEngine?: DrillPlaybackResourcesCompingEngine;
  walkingBassGenerator?: DrillPlaybackResourcesWalkingBassGenerator | null;
};

export type DrillPlaybackResourcesAudioFacade = {
  preloadStartupSamples?: () => Promise<unknown>;
  preloadNearTermSamples?: () => Promise<unknown>;
  ensureNearTermSamplePreload?: () => Promise<unknown>;
  ensurePageSampleWarmup?: () => Promise<unknown>;
  ensureBackgroundSamplePreload?: () => Promise<unknown>;
};

export type DrillPlaybackResourcesAppContextShape = {
  harmony: DrillPlaybackResourcesHarmonyBindings;
  progressionState: DrillPlaybackResourcesProgressionStateBindings;
  playbackSettings: DrillPlaybackResourcesSettingsBindings;
  runtime: DrillPlaybackResourcesRuntimeBindings;
  audioFacade: DrillPlaybackResourcesAudioFacade;
};

export type DrillPlaybackResourcesPreparationFacade = {
  rebuildPreparedCompingPlans?: (
    previousKey?: number,
    currentHasIncomingAnticipation?: boolean,
    currentPreviousTailBeats?: number | null
  ) => void;
  ensureWalkingBassGenerator?: () => Promise<unknown>;
  buildPreparedBassPlan?: (initialPendingTargetMidi?: number | null) => DrillPlaybackBassPlan;
};
