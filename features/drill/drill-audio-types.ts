export type DrillMixerNodes = {
  master: GainNode;
  bass: GainNode;
  strings: GainNode;
  drums: GainNode;
};

export type DrillSampleBuffers = Record<string, Record<string | number, AudioBuffer | null | undefined>>;
export type DrillSampleLoadPromises = Record<string, Map<string | number, Promise<any>>>;

export type DrillAudioRuntimeLike = {
  applyMixerSettings?: (options: {
    dom?: Record<string, unknown>;
    mixerNodes?: Record<string, GainNode> | null;
    audioCtx?: AudioContext | null;
    sliderValueToGain: (slider?: unknown) => number;
    mixerChannelCalibration: Record<string, number>;
  }) => void;
  loadSample?: (category: string, folder: string, midi: number) => Promise<any>;
  loadPianoSample?: (layer: string, midi: number) => Promise<any>;
  loadPianoSampleList?: (midiValues: Iterable<number>) => Promise<any>;
  loadFileSample?: (category: string, key: string, baseUrl: string) => Promise<any>;
  fetchArrayBufferFromUrl?: (baseUrl: string) => Promise<ArrayBuffer | undefined>;
  loadBufferFromUrl?: (baseUrl: string) => Promise<AudioBuffer>;
};

export type DrillSamplePreloadLike = {
  preloadSamples?: () => Promise<any>;
  preloadStartupSamples?: () => Promise<any>;
  preloadNearTermSamples?: () => Promise<any>;
  ensureNearTermSamplePreload?: () => Promise<any> | null;
  ensurePageSampleWarmup?: () => Promise<any> | null;
  ensureBackgroundSamplePreload?: () => Promise<any> | null;
  getNearTermSamplePreloadPromise?: () => Promise<any> | null;
  setNearTermSamplePreloadPromise?: (value: Promise<any> | null) => void;
  getStartupSamplePreloadInProgress?: () => boolean;
  setStartupSamplePreloadInProgress?: (value: unknown) => void;
};

export type DrillScheduledAudioLike = {
  trackScheduledSource?: (source: AudioScheduledSourceNode, gainNodes?: GainNode[]) => unknown;
  clearScheduledDisplays?: () => void;
  stopScheduledAudio?: (stopTime?: number) => void;
  stopActiveChordVoices?: (stopTime?: number, fadeDuration?: number) => void;
  getPendingDisplayTimeouts?: () => Set<ReturnType<typeof setTimeout>>;
};

export type DrillAudioPlaybackLike = {
  initAudio?: () => void;
  resumeAudioContext?: () => Promise<AudioContext | null | undefined>;
  suspendAudioContext?: () => Promise<AudioContext | null | undefined>;
  getAudioContextState?: () => string;
  initMixerNodes?: () => void;
  getMixerDestination?: (channel: string) => AudioNode | null;
  playClick?: (time: number, accent: boolean) => void;
  playDrumSample?: (name: string, time: number, gainValue?: number, playbackRate?: number) => void;
  playHiHat?: (time: number, accent?: boolean) => void;
  getNextRideSampleName?: () => string;
  playRide?: (time: number, gainValue?: number, playbackRate?: number) => void;
  scheduleDrumsForBeat?: (time: number, beatIndex: number, spb: number) => void;
};

export type DrillSamplePlaybackLike = {
  getNearestLoadedBassSampleMidi?: (targetMidi: number) => number | null;
  getAdaptiveBassFadeDuration?: (maxDuration?: number) => number;
  scheduleBassGainRelease?: (gainNode: GainNode | null, fadeStart: number, fadeEnd: number) => void;
  playNote?: (midi: number, time: number, maxDuration: number, velocity?: number) => void;
  scheduleSampleSegment?: (
    buffer: AudioBuffer,
    destination: AudioNode,
    startTime: number,
    offset: number,
    duration: number,
    fadeInDuration?: number,
    fadeOutDuration?: number
  ) => AudioBufferSourceNode | null;
  playLoopedStringSample?: (buffer: AudioBuffer, time: number, fadeEnd: number, volume: number) => unknown;
  playSample?: (
    category: string,
    midi: number,
    time: number,
    maxDuration: number,
    volume: number,
    options?: { layer?: string; legato?: boolean }
  ) => unknown;
};

export type DrillAudioStackLike = {
  audioRuntime?: DrillAudioRuntimeLike;
  samplePreload?: DrillSamplePreloadLike;
  scheduledAudio?: DrillScheduledAudioLike;
  audioPlayback?: DrillAudioPlaybackLike;
  samplePlayback?: DrillSamplePlaybackLike;
};

export type DrillAudioFacadeLike = DrillAudioRuntimeLike
  & DrillSamplePreloadLike
  & DrillScheduledAudioLike
  & DrillAudioPlaybackLike
  & DrillSamplePlaybackLike;

export type DrillAudioStateContext = {
  getAudioContext?: () => AudioContext | null;
  setAudioContext?: (value: AudioContext | null) => void;
  getMixerNodes?: () => DrillMixerNodes | null;
  setMixerNodes?: (value: DrillMixerNodes | null) => void;
  sampleBuffers?: DrillSampleBuffers;
};

export type DrillAudioHelpersContext = {
  createAudioContext?: () => AudioContext;
  applyMixerSettings?: () => void;
  trackScheduledSource?: (source: AudioScheduledSourceNode, gainNodes?: GainNode[]) => unknown;
};

export type DrillPlaybackSettingsContext = {
  getDrumsMode?: () => string;
  getSwingRatio?: () => number;
};

export type DrillAudioConstantsContext = {
  metronomeGainMultiplier?: number;
  drumsGainMultiplier?: number;
  drumModeOff?: string;
  drumModeMetronome24?: string;
  drumModeHihats24?: string;
  drumModeFullSwing?: string;
  drumRideSampleUrls?: string[];
  appVersion?: string;
};

export type DrillAudioCacheContext = {
  sampleBuffers?: DrillSampleBuffers;
  sampleLoadPromises?: DrillSampleLoadPromises;
  sampleFileBuffers?: Map<string, ArrayBuffer>;
  sampleFileFetchPromises?: Map<string, Promise<ArrayBuffer>>;
};
