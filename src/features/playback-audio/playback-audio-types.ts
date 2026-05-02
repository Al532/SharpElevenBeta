export type PlaybackMixerNodes = {
  master: GainNode;
  bass: GainNode;
  strings: GainNode;
  drums: GainNode;
};

export type PlaybackSampleBuffers = Record<string, Record<string | number, AudioBuffer | null | undefined>>;
export type PlaybackSampleLoadPromises = Record<string, Map<string | number, Promise<any>>>;

export type PlaybackSamplePolicy = {
  target: 'android' | 'web';
  compressedCache: 'none';
  backgroundPreload: 'off';
  nearTermMeasures: number;
  decodedCacheMaxBytes: number;
  startupRideCount: number;
};

export type PlaybackAudioRuntimeLike = {
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
  touchSampleBuffer?: (category: string, key: string | number) => void;
  purgeSampleCategory?: (category: string) => void;
  getSampleCacheStats?: () => Record<string, number | string>;
};

export type PlaybackSamplePreloadLike = {
  preloadSamples?: () => Promise<any>;
  preloadStartupSamples?: () => Promise<any>;
  preloadNearTermSamples?: () => Promise<any>;
  prepareCompingStyleSamples?: () => Promise<any>;
  ensureNearTermSamplePreload?: () => Promise<any> | null;
  ensurePageSampleWarmup?: () => Promise<any> | null;
  ensureBackgroundSamplePreload?: () => Promise<any> | null;
  getNearTermSamplePreloadPromise?: () => Promise<any> | null;
  setNearTermSamplePreloadPromise?: (value: Promise<any> | null) => void;
  getStartupSamplePreloadInProgress?: () => boolean;
  setStartupSamplePreloadInProgress?: (value: unknown) => void;
};

export type PlaybackScheduledAudioLike = {
  trackScheduledSource?: (source: AudioScheduledSourceNode, gainNodes?: GainNode[]) => unknown;
  clearScheduledDisplays?: () => void;
  stopScheduledAudio?: (stopTime?: number) => void;
  stopActiveChordVoices?: (stopTime?: number, fadeDuration?: number) => void;
  getPendingDisplayTimeouts?: () => Set<ReturnType<typeof setTimeout>>;
};

export type PlaybackAudioPlaybackLike = {
  initAudio?: () => void;
  resumeAudioContext?: () => Promise<AudioContext | null | undefined>;
  suspendAudioContext?: () => Promise<AudioContext | null | undefined>;
  getAudioContextState?: () => string;
  initMixerNodes?: () => void;
  getMixerDestination?: (channel: string) => AudioNode | null;
  playClick?: (time: number, accent: boolean) => void;
  playDrumSample?: (name: string, time: number, gainValue?: number, playbackRate?: number, options?: { endingCue?: Record<string, unknown> | null; endingStyle?: string; timeBeats?: number | null; beatsPerBar?: number; endingAccentMultiplier?: number; endingFinalAccentMultiplier?: number; endingCrescendoLeadMeasures?: number; slotDuration?: number; secondsPerBeat?: number; tailFadeTimeConstant?: number; tailFadeStart?: number }) => void;
  playHiHat?: (time: number, accent?: boolean) => void;
  getNextRideSampleName?: () => string;
  playRide?: (time: number, gainValue?: number, playbackRate?: number, options?: { endingCue?: Record<string, unknown> | null; endingStyle?: string; timeBeats?: number | null; beatsPerBar?: number; endingAccentMultiplier?: number; endingFinalAccentMultiplier?: number; endingCrescendoLeadMeasures?: number; slotDuration?: number; secondsPerBeat?: number; tailFadeTimeConstant?: number; tailFadeStart?: number }) => void;
  scheduleDrumsForBeat?: (
    time: number,
    beatIndex: number,
    spb: number,
    measureInfo?: { beatCount?: number; startBeat?: number } | null,
    options?: { endingCue?: Record<string, unknown> | null; beatsPerBar?: number; endingAccentMultiplier?: number; endingFinalAccentMultiplier?: number; endingCrescendoLeadMeasures?: number }
  ) => void;
};

export type PlaybackSamplePlaybackLike = {
  getNearestLoadedBassSampleMidi?: (targetMidi: number) => number | null;
  getAdaptiveBassFadeDuration?: (maxDuration?: number) => number;
  scheduleBassGainRelease?: (gainNode: GainNode | null, fadeStart: number, fadeEnd: number) => void;
  playNote?: (midi: number, time: number, maxDuration: number, velocity?: number, options?: { endingCue?: Record<string, unknown> | null; endingStyle?: string; timeBeats?: number; beatsPerBar?: number; endingAccentMultiplier?: number; endingFinalAccentMultiplier?: number; endingCrescendoLeadMeasures?: number; slotDuration?: number; secondsPerBeat?: number; tailFadeTimeConstant?: number }) => void;
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

export type PlaybackAudioStackLike = {
  audioRuntime?: PlaybackAudioRuntimeLike;
  samplePreload?: PlaybackSamplePreloadLike;
  scheduledAudio?: PlaybackScheduledAudioLike;
  audioPlayback?: PlaybackAudioPlaybackLike;
  samplePlayback?: PlaybackSamplePlaybackLike;
};

export type PlaybackAudioFacadeLike = PlaybackAudioRuntimeLike
  & PlaybackSamplePreloadLike
  & PlaybackScheduledAudioLike
  & PlaybackAudioPlaybackLike
  & PlaybackSamplePlaybackLike;

export type PlaybackAudioStateContext = {
  getAudioContext?: () => AudioContext | null;
  setAudioContext?: (value: AudioContext | null) => void;
  getMixerNodes?: () => PlaybackMixerNodes | null;
  setMixerNodes?: (value: PlaybackMixerNodes | null) => void;
  sampleBuffers?: PlaybackSampleBuffers;
};

export type PlaybackAudioHelpersContext = {
  createAudioContext?: () => AudioContext;
  applyMixerSettings?: () => void;
  trackScheduledSource?: (source: AudioScheduledSourceNode, gainNodes?: GainNode[]) => unknown;
  touchSampleBuffer?: (category: string, key: string | number) => void;
};

export type PracticePlaybackSettingsContext = {
  getDrumsMode?: () => string;
  getDrumSwingRatio?: () => number;
  getSwingRatio?: () => number;
};

export type PlaybackAudioConstantsContext = {
  metronomeGainMultiplier?: number;
  drumsGainMultiplier?: number;
  drumModeOff?: string;
  drumModeMetronome24?: string;
  drumModeHihats24?: string;
  drumModeFullSwing?: string;
  drumRideSampleUrls?: string[];
  appVersion?: string;
};

export type PlaybackAudioCacheContext = {
  sampleBuffers?: PlaybackSampleBuffers;
  sampleLoadPromises?: PlaybackSampleLoadPromises;
  sampleFileBuffers?: Map<string, ArrayBuffer>;
  sampleFileFetchPromises?: Map<string, Promise<ArrayBuffer>>;
  getProtectedSampleCategories?: () => Iterable<string>;
};
