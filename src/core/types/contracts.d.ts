export type PracticeSessionSchemaVersion = '1.0.0';
export type ChartSchemaVersion = '1.0.0';

export interface ChartMetadata {
  id: string;
  title: string;
  composer?: string;
  style?: string;
  styleReference?: string;
  sourceKey?: string;
  displayKey?: string;
  primaryTimeSignature?: string;
  tempo?: number;
  barCount?: number;
  contentHash?: string;
  contentHashVersion?: string;
  titleKey?: string;
  composerKey?: string;
  [key: string]: unknown;
}

export interface ChartSourceRef {
  type: 'ireal-chart' | 'ireal-bundle' | 'ireal-backup' | 'pasted-link' | 'ireal-link' | 'ireal-source' | 'unknown' | string;
  name: string;
  origin?: 'ireal-forum' | 'ireal-backup' | 'pasted-link' | 'ireal-bundled-default' | 'unknown' | string;
  sourceFile?: string;
  referrerUrl?: string;
  sourceSongCount?: number;
  rawPlaylistName?: string;
  songIndex?: number;
  importedTitle?: string;
  importedComposer?: string;
  importedAt?: string;
  [key: string]: unknown;
}

export interface ChartSection {
  id: string;
  label?: string;
  occurrence?: number;
  barIds: string[];
  [key: string]: unknown;
}

export interface ChartBar {
  id: string;
  index: number;
  sectionId?: string;
  sectionLabel?: string;
  timeSignature?: string | null;
  [key: string]: unknown;
}

export interface ChartChordSlot {
  kind: 'chord' | string;
  symbol: string;
  root?: string;
  quality?: string;
  bass?: string | null;
  displayPrefix?: string;
  alternate?: ChartChordSlot | null;
  [key: string]: unknown;
}

export interface ChartCellSlot {
  bars?: string;
  annots?: string[];
  comments?: string[];
  spacer?: number;
  chord?: {
    symbol?: string;
    modifier?: string;
    bass?: string | null;
    display_prefix?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface ChartBarNotation {
  kind: string;
  tokens: ChartChordSlot[];
}

export interface ChartBarPlayback {
  slots: ChartChordSlot[];
  overlaySlots?: ChartChordSlot[];
  cellSlots?: ChartCellSlot[];
}

export interface RichChartBar extends ChartBar {
  notation?: ChartBarNotation;
  playback?: ChartBarPlayback;
  endings?: Array<number | string>;
  flags?: string[];
  directives?: Array<Record<string, unknown>>;
  comments?: string[];
  sourceEvent?: string | null;
  repeatedFromBar?: number | null;
  specialEvents?: Array<Record<string, unknown>>;
  annotationMisc?: string[];
  spacerCount?: number;
  chordSizes?: number[];
}

export interface ChartDocument {
  schemaVersion: ChartSchemaVersion;
  metadata: ChartMetadata;
  source: Record<string, unknown> & { sourceRefs?: ChartSourceRef[] };
  sections: ChartSection[];
  bars: RichChartBar[];
  layout: Record<string, unknown> | null;
}

export interface ChartSetlistItem {
  chartId: string;
  keyOverride?: string;
  tempoOverride?: number;
  playbackStyleOverride?: string;
  note?: string;
  [key: string]: unknown;
}

export interface ChartSetlist {
  id: string;
  name: string;
  items: ChartSetlistItem[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface ChartViewModel {
  metadata: ChartMetadata;
  layout: Record<string, unknown> | null;
  sections: ChartSection[];
  bars: Array<RichChartBar & { displayTokens?: ChartChordSlot[], displayPlaybackSlots?: ChartChordSlot[], isSelected?: boolean }>;
  pages?: Array<{ index: number; barIds: string[] }>;
}

export interface ChartPlaybackPlan {
  schemaVersion: ChartSchemaVersion;
  chartTitle: string;
  chartId: string;
  timeSignature: string;
  navigation: ChartPlaybackNavigation;
  diagnostics: ChartPlaybackDiagnostic[];
  entries: ChartPlaybackEntry[];
}

export interface PlaybackEndingCue {
  kind: 'final_chord' | 'fermata' | string;
  style: 'onbeat_long' | 'offbeat_long' | 'short' | string;
  source: 'natural_end' | 'fine' | 'fermata' | string;
  holdMs?: number;
  barId?: string;
  barIndex?: number;
  beatIndex?: number;
  targetBeat?: number;
  targetChordIndex?: number;
  targetSymbol?: string;
  [key: string]: unknown;
}

export interface ChartPlaybackEntry {
  sequenceIndex: number;
  barId: string;
  barIndex: number;
  sectionId: string;
  sectionLabel: string;
  timeSignature: string | null;
  displayTokens: ChartChordSlot[];
  playbackSlots: ChartChordSlot[];
  playbackCellSlots: ChartCellSlot[];
  notationKind: string;
  endings: Array<number | string>;
  flags: string[];
  directives: Array<Record<string, unknown>>;
  comments: string[];
  sourceEvent?: string | null;
  repeatedFromBar?: number | null;
  specialEvents?: Array<Record<string, unknown>>;
  annotationMisc?: string[];
  spacerCount?: number;
  chordSizes?: number[];
  overlaySlots?: ChartChordSlot[];
  endingCue?: PlaybackEndingCue | null;
}

export interface ChartPlaybackDiagnostic {
  level: 'warning' | 'error' | string;
  code: string;
  message: string;
  [key: string]: unknown;
}

export interface ChartPlaybackNavigation {
  segnoIndex: number | null;
  codaIndex: number | null;
  [key: string]: unknown;
}

export interface PracticePlaybackBar {
  id: string;
  index: number;
  timeSignature: string;
  sectionId: string;
  sectionLabel: string;
  symbols: string[];
  beatSlots: string[];
  metadata: Record<string, unknown>;
}

export interface PracticeSessionSelection {
  startBarId: string | null;
  endBarId: string | null;
  barIds: string[];
  startBarIndex: number | null;
  endBarIndex: number | null;
}

export interface PracticeSessionOrigin {
  mode: string;
  chartId?: string;
  sourceKey?: string;
  [key: string]: unknown;
}

export interface PracticeSessionDisplay {
  sourceKey?: string;
  displayKey?: string;
  composer?: string;
  style?: string;
  [key: string]: unknown;
}

export interface PracticeSessionPlayback {
  bars: PracticePlaybackBar[];
  patternString: string;
  enginePatternString: string;
  endingCue?: PlaybackEndingCue | null;
}

export interface PracticeSessionSpec {
  schemaVersion: PracticeSessionSchemaVersion;
  id: string;
  source: string;
  title: string;
  tempo: number;
  timeSignature: string;
  playback: PracticeSessionPlayback;
  display: PracticeSessionDisplay;
  selection: PracticeSessionSelection | null;
  origin: PracticeSessionOrigin | null;
}

export type CompingStyle = string;
export type DrumsMode = string;
export type DisplayMode = string;
export type HarmonyDisplayMode = string;

export interface PlaybackSettings {
  tempo?: number | null;
  transposition?: number | string | null;
  compingStyle?: CompingStyle | null;
  drumsMode?: DrumsMode | null;
  customMediumSwingBass?: boolean | null;
  repetitionsPerKey?: number | null;
  finitePlayback?: boolean | null;
  chartRepeatCount?: number | null;
  chartRepeatInfinite?: boolean | null;
  displayMode?: DisplayMode | null;
  harmonyDisplayMode?: HarmonyDisplayMode | null;
  showBeatIndicator?: boolean | null;
  hideCurrentHarmony?: boolean | null;
  masterVolume?: number | null;
  bassVolume?: number | null;
  stringsVolume?: number | null;
  drumsVolume?: number | null;
  [key: string]: unknown;
}

export interface PlaybackRuntimeState {
  isPlaying: boolean;
  isPaused: boolean;
  isIntro: boolean;
  currentBeat: number;
  currentChordIdx: number;
  paddedChordCount: number;
  sessionId: string;
  errorMessage: string | null;
}

export interface PlaybackOperationResult {
  ok: boolean;
  errorMessage?: string | null;
  state?: Partial<PlaybackRuntimeState> | null;
  session?: PracticeSessionSpec | null;
  settings?: PlaybackSettings | unknown;
}

export interface PlaybackSessionSnapshot {
  session: PracticeSessionSpec | null;
  settings: PlaybackSettings;
  runtime: PlaybackRuntimeState;
}

export type PlaybackStateListener = (snapshot: PlaybackSessionSnapshot) => void;

export interface PlaybackSessionAdapter {
  loadSession?(sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings): Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  updatePlaybackSettings?(playbackSettings: PlaybackSettings, sessionSpec: PracticeSessionSpec | null): Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  start?(sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings): Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  stop?(sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings): Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  pauseToggle?(sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings): Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  getRuntimeState?(): Partial<PlaybackRuntimeState> | null | undefined;
  subscribe?(listener: (nextRuntimeState: Partial<PlaybackRuntimeState>) => void): void;
}

export interface PlaybackSessionController {
  loadSession(sessionSpec: PracticeSessionSpec): Promise<PlaybackOperationResult>;
  updatePlaybackSettings(nextSettings?: PlaybackSettings): Promise<PlaybackOperationResult>;
  start(): Promise<PlaybackOperationResult>;
  stop(): Promise<PlaybackOperationResult>;
  pauseToggle(): Promise<PlaybackOperationResult>;
  refreshRuntimeState(): PlaybackRuntimeState;
  getState(): PlaybackSessionSnapshot;
  subscribe(listener: PlaybackStateListener): () => void;
}

export type AppMode = 'drill' | 'chart';

export interface AppStateShape {
  sharedPlaybackSettings?: PlaybackSettings;
  chartUiSettings?: Record<string, unknown>;
  drillUiSettings?: Record<string, unknown>;
  currentMode?: AppMode;
  pendingPracticeSession?: PracticeSessionSpec | null;
  pendingDrillSession?: PracticeSessionSpec | null;
  [key: string]: unknown;
}

export interface ChartSelection {
  startBarId?: string | null;
  endBarId?: string | null;
  barIds: string[];
}

export interface ChartSelectionController {
  setOrderedBarIds(nextOrderedBarIds?: string[]): void;
  clear(): ChartSelection;
  selectBar(barId: string, options?: { extend?: boolean }): ChartSelection;
  getSelection(): ChartSelection;
}

export interface ChartFixtureLibrary {
  source?: string;
  documents?: ChartDocument[];
}

export interface ChartScreenState {
  fixtureLibrary: ChartFixtureLibrary | null;
  filteredDocuments: ChartDocument[];
  currentChartDocument: ChartDocument | null;
  currentViewModel: ChartViewModel | null;
  currentPlaybackPlan: ChartPlaybackPlan | null;
  currentPracticeSession: PracticeSessionSpec | null;
  currentSelectionPracticeSession: PracticeSessionSpec | null;
  currentLibrarySourceLabel: string;
  activeBarId: string | null;
  activePlaybackEntryIndex: number;
  chartPlaybackController: ChartPlaybackController | null;
  chartSheetRenderer: ChartSheetRenderer | null;
  selectionController: ChartSelectionController;
  playbackPollTimer: number | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentSearch: string;
}

export interface EmbeddedPatternPayload {
  patternName: string;
  patternString: string;
  endingCue?: PlaybackEndingCue | null;
  patternMode: 'both' | 'major' | 'minor' | string;
  tempo: number | null;
  transposition?: number | string | null;
  repetitionsPerKey: number;
  finitePlayback?: boolean | null;
  displayMode?: DisplayMode | null;
  harmonyDisplayMode?: HarmonyDisplayMode | null;
  showBeatIndicator?: boolean | null;
  hideCurrentHarmony?: boolean | null;
  compingStyle?: CompingStyle | null;
  drumsMode?: DrumsMode | null;
  customMediumSwingBass?: boolean | null;
  masterVolume?: number | null;
  bassVolume?: number | null;
  stringsVolume?: number | null;
  drumsVolume?: number | null;
}

export interface EmbeddedPlaybackApi {
  version?: number;
  applyEmbeddedPattern(payload: EmbeddedPatternPayload): Promise<PlaybackOperationResult> | PlaybackOperationResult;
  applyEmbeddedPlaybackSettings(settings: PlaybackSettings): Promise<PlaybackOperationResult> | PlaybackOperationResult;
  startPlayback(): Promise<PlaybackOperationResult> | PlaybackOperationResult;
  stopPlayback(): Promise<PlaybackOperationResult> | PlaybackOperationResult;
  togglePausePlayback(): Promise<PlaybackOperationResult> | PlaybackOperationResult;
  getPlaybackState(): Partial<PlaybackRuntimeState> | null;
}

export interface EmbeddedPlaybackApiClient {
  getApi(): EmbeddedPlaybackApi | null;
  ensureApi(): Promise<EmbeddedPlaybackApi>;
}

export interface PlaybackRuntime {
  ensureReady(): Promise<unknown>;
  ensurePlaybackController(): PlaybackSessionController;
  getRuntimeState(): Partial<PlaybackRuntimeState> | null;
}

export interface PlaybackRuntimeProvider {
  getRuntime(): PlaybackRuntime;
}

export interface PlaybackRuntimeBindings {
  playbackRuntime: PlaybackRuntime;
  playbackController: PlaybackSessionController;
}

export interface PlaybackAssembly extends PlaybackRuntimeBindings {}

export interface PlaybackAssemblyProvider {
  getAssembly(): PlaybackAssembly;
}

export interface PlaybackBridge extends PlaybackRuntimeBindings {
  playbackRuntime: PlaybackRuntime;
}

export interface PlaybackBridgeProvider {
  getBridge(): PlaybackBridge;
}

export interface RuntimePlaybackBridgeProvider extends PlaybackBridgeProvider {}

export interface PracticePlaybackBridgeProvider extends RuntimePlaybackBridgeProvider {}
export interface DirectPlaybackBridgeProvider extends PracticePlaybackBridgeProvider {}

export interface EmbeddedPlaybackBridge extends PlaybackRuntimeBindings {
  apiClient: EmbeddedPlaybackApiClient;
  playbackRuntime: EmbeddedPlaybackRuntime;
}

export interface EmbeddedPlaybackBridgeProvider extends PlaybackBridgeProvider {
  getBridge(): EmbeddedPlaybackBridge;
}

export interface EmbeddedPlaybackRuntimeProvider extends PlaybackRuntimeProvider {
  getRuntime(): EmbeddedPlaybackRuntime;
}

export interface PracticePlaybackRuntimeProvider extends PlaybackRuntimeProvider {}
export interface DirectPlaybackRuntimeProvider extends PracticePlaybackRuntimeProvider {}

export interface PracticePlaybackControllerOptions {
  ensureWalkingBassGenerator?: () => Promise<unknown>;
  isPlaying?: () => boolean;
  getAudioContext?: () => BaseAudioContext | null;
  noteFadeout?: number;
  stopActiveChordVoices?: (audioTime: number, fadeout: number) => void;
  rebuildPreparedCompingPlans?: (currentKey: number) => void;
  buildPreparedBassPlan?: () => void;
  getCurrentKey?: () => number;
  preloadNearTermSamples?: () => Promise<unknown>;
  validateCustomPattern?: () => boolean;
  startPlayback?: () => Promise<void>;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
}

export interface DirectPlaybackControllerOptions extends PracticePlaybackControllerOptions {
  loadDirectSession?: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  updateDirectPlaybackSettings?: (playbackSettings: PlaybackSettings, sessionSpec: PracticeSessionSpec | null) => Promise<PlaybackOperationResult | undefined> | PlaybackOperationResult | undefined;
  getDirectPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
}

export interface EmbeddedPlaybackBridgeOptions {
  getTargetWindow?: () => Window | null;
  getHostFrame?: () => HTMLIFrameElement | null;
  readyEventName?: string;
  timeoutMs?: number;
  buildPatternPayload: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => EmbeddedPatternPayload;
}

export type ChartPlaybackBridgeMode = 'embedded' | 'direct';

export interface ChartPlaybackBridgeOptions {
  mode?: ChartPlaybackBridgeMode;
  bridgeFrame?: HTMLIFrameElement | null;
  getTempo?: () => number;
  getCurrentChartTitle?: () => string;
  directPlaybackOptions?: DirectPlaybackControllerOptions;
}

export interface ChartDirectPlaybackRuntimeHost {
  ensureFrame(): HTMLIFrameElement | null;
  getCurrentTargetWindow(): Window | null;
  getFallbackTargetWindow(): Window | null;
  getTargetWindow(): Window | null;
  getDirectPlaybackOptions(): DirectPlaybackControllerOptions;
}

export interface PracticePlaybackAssembly extends PlaybackRuntimeBindings {
  playbackRuntime: PlaybackRuntime;
}

export interface PracticePlaybackAssemblyProvider extends PlaybackAssemblyProvider {
  getAssembly(): PracticePlaybackAssembly;
}

export interface EmbeddedPlaybackAssembly extends PlaybackRuntimeBindings {
  embeddedApi: EmbeddedPlaybackApi;
}

export interface EmbeddedPlaybackAssemblyProvider extends PlaybackAssemblyProvider {
  getAssembly(): EmbeddedPlaybackAssembly;
}

export interface PublishedEmbeddedPlaybackAssemblyProvider extends PlaybackAssemblyProvider {
  getAssembly(): EmbeddedPlaybackAssembly;
}

export interface EmbeddedPlaybackGlobals {
  embeddedApi: EmbeddedPlaybackApi | null;
  playbackRuntime: PlaybackRuntime | null;
  playbackController: PlaybackSessionController | null;
}

export interface EmbeddedPlaybackRuntime extends PlaybackRuntime {
  ensureReady(): Promise<EmbeddedPlaybackApi>;
}

export interface EmbeddedPlaybackRuntimeState extends PlaybackRuntimeState {
  isEmbeddedMode?: boolean;
  currentPatternString?: string;
  currentPatternMode?: string;
  patternError?: string | null;
  tempo?: number;
  swingRatio?: number;
}

export interface EmbeddedPlaybackStateOptions {
  isEmbeddedMode?: boolean;
  getIsPlaying?: () => boolean;
  getIsPaused?: () => boolean;
  getIsIntro?: () => boolean;
  getCurrentBeat?: () => number;
  getCurrentChordIdx?: () => number;
  getPaddedChordCount?: () => number;
  getCurrentPatternString?: () => string;
  getCurrentPatternMode?: () => string;
  getPatternErrorText?: () => string;
  hasPatternError?: () => boolean;
  getTempo?: () => number;
  getSwingRatio?: () => number;
}

export interface EmbeddedPatternAdapterOptions {
  stopIfPlaying?: () => void;
  clearProgressionEditingState?: () => void;
  closeProgressionManager?: () => void;
  setCustomPatternSelection?: () => void;
  setPatternName?: (name: string) => void;
  setCustomPatternValue?: (pattern: string) => void;
  setEditorPatternMode?: (mode: string) => void;
  syncPatternSelectionFromInput?: () => void;
  setLastPatternSelectValue?: () => void;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  setPlaybackEndingCue?: (endingCue: PlaybackEndingCue | null) => void;
  syncCustomPatternUI?: () => void;
  normalizeChordsPerBarForCurrentPattern?: () => void;
  applyPatternModeAvailability?: () => void;
  syncPatternPreview?: () => void;
  applyDisplayMode?: () => void;
  applyBeatIndicatorVisibility?: () => void;
  applyCurrentHarmonyVisibility?: () => void;
  updateKeyPickerLabels?: () => void;
  refreshDisplayedHarmony?: () => void;
  fitHarmonyDisplay?: () => void;
  validateCustomPattern?: () => boolean;
  getPatternErrorText?: () => string;
  getCurrentPatternString?: () => string;
  normalizePatternString?: (pattern: string) => string;
  normalizePresetName?: (name: string) => string;
  normalizePatternMode?: (mode: string) => string;
}

export interface EmbeddedPlaybackSettingsAdapterOptions {
  setTempo?: (tempo: number | string) => void;
  setTransposition?: (transposition: number | string) => void;
  setCompingStyle?: (style: string) => void;
  setDrumsMode?: (mode: string) => void;
  setWalkingBassEnabled?: (enabled: boolean) => void;
  setRepetitionsPerKey?: (count: number) => void;
  setFinitePlayback?: (enabled: boolean) => void;
  setDisplayMode?: (mode: string) => void;
  setHarmonyDisplayMode?: (mode: string) => void;
  setShowBeatIndicator?: (visible: boolean) => void;
  setHideCurrentHarmony?: (hidden: boolean) => void;
  setMasterVolume?: (value: string | number) => void;
  setBassVolume?: (value: string | number) => void;
  setStringsVolume?: (value: string | number) => void;
  setDrumsVolume?: (value: string | number) => void;
  applyMixerSettings?: () => void;
  getPlaybackSettingsSnapshot?: () => PlaybackSettings;
  normalizeEmbeddedVolume?: (value: unknown) => string | null;
}

export interface EmbeddedPracticeRuntimeOptions {
  patternAdapterOptions?: EmbeddedPatternAdapterOptions;
  playbackSettingsAdapterOptions?: EmbeddedPlaybackSettingsAdapterOptions;
  playbackStateOptions?: EmbeddedPlaybackStateOptions;
  playbackControllerOptions?: PracticePlaybackControllerOptions;
}

export interface EmbeddedRuntimeBindings extends PlaybackRuntimeBindings {
  playbackRuntime: PlaybackRuntime;
  playbackController: PlaybackSessionController;
  applyEmbeddedPattern: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings: (settings: PlaybackSettings) => PlaybackSettings | unknown;
  getEmbeddedPlaybackState: () => EmbeddedPlaybackRuntimeState;
}

export interface TransportPlaybackStatus {
  isPlaying: boolean;
  isPaused: boolean;
}

export interface ChartPlaybackControllerOptions {
  bridgeFrame?: HTMLIFrameElement | null;
  playbackBridgeProvider?: PlaybackBridgeProvider | null;
  getSelectedPracticeSession?: () => PracticeSessionSpec | null;
  getPlaybackSettings?: () => PlaybackSettings;
  getTempo?: () => number;
  getCurrentChartTitle?: () => string;
  getCurrentBarCount?: () => number;
  setActivePlaybackPosition?: (barId: string | null, entryIndex: number) => void;
  resetActivePlaybackPosition?: () => void;
  renderTransport?: () => void;
  updateActiveHighlights?: () => void;
  onTransportStatus?: (status: string) => void;
  onPersistPlaybackSettings?: () => void;
}

export interface ChartPlaybackController {
  ensureReady(): Promise<unknown>;
  ensurePlaybackController(): PlaybackSessionController;
  syncPlaybackState(): TransportPlaybackStatus;
  stopPlayback(options?: { resetPosition?: boolean }): Promise<TransportPlaybackStatus>;
  startPlayback(): Promise<{ ok: boolean } | TransportPlaybackStatus>;
  syncPlaybackSettings(): Promise<PlaybackOperationResult>;
  pauseToggle(): Promise<TransportPlaybackStatus>;
  navigateToPracticeWithSelection(): boolean;
  getTotalBars(): number;
}

export interface ChartSheetRenderer {
  renderSheet(viewModel: ChartViewModel): void;
  updateSheetGridGap(): void;
  applyOpticalPlacements(): void;
  renderDiagnostics(playbackPlan: ChartPlaybackPlan | null): void;
  getLayoutDebugSnapshot?(): unknown;
  getLayoutDebugBypasses?(): Record<string, boolean>;
  setLayoutDebugBypasses?(nextBypasses: Record<string, boolean>): Record<string, boolean>;
  clearLayoutDebugBypasses?(): Record<string, boolean>;
}

export interface PracticeSessionExport {
  title: string;
  sourceKey: string;
  timeSignature: string;
  patternString: string;
  enginePatternString: string;
  bars: string[];
  engineBars: string[];
}

export interface DrillExport extends PracticeSessionExport {}

declare global {
  interface Window {
    __JPT_PLAYBACK_API__?: EmbeddedPlaybackApi;
    __JPT_PLAYBACK_RUNTIME__?: PlaybackRuntime;
    __JPT_PLAYBACK_SESSION_CONTROLLER__?: PlaybackSessionController;
    __JPT_DIRECT_PLAYBACK_CONTROLLER_OPTIONS__?: DirectPlaybackControllerOptions;
  }
}
