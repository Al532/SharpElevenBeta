import type {
  AppMode,
  AppStateShape,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

const APP_STATE_STORAGE_KEY = 'jpt-app-state-v1';

function deepClone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

function readJsonStorage(key: string): AppStateShape | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as AppStateShape : null;
  } catch {
    return null;
  }
}

function writeJsonStorage(key: string, value: AppStateShape): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadAppState(): AppStateShape {
  return readJsonStorage(APP_STATE_STORAGE_KEY) || {};
}

export function saveAppState(nextState: AppStateShape): AppStateShape {
  const safeState = nextState && typeof nextState === 'object' ? nextState : {};
  writeJsonStorage(APP_STATE_STORAGE_KEY, safeState);
  return safeState;
}

export function updateAppState(
  updater: AppStateShape | ((previousState: AppStateShape) => AppStateShape)
): AppStateShape {
  const previousState = loadAppState();
  const nextState = typeof updater === 'function'
    ? updater(previousState)
    : { ...previousState, ...(updater || {}) };
  return saveAppState(nextState);
}

export function loadSharedPlaybackSettings({
  legacyChartStorageKey = ''
}: {
  legacyChartStorageKey?: string;
} = {}): PlaybackSettings | null {
  const appState = loadAppState();
  if (appState.sharedPlaybackSettings && typeof appState.sharedPlaybackSettings === 'object') {
    return deepClone(appState.sharedPlaybackSettings);
  }

  if (legacyChartStorageKey) {
    const legacySettings = readJsonStorage(legacyChartStorageKey);
    if (legacySettings && typeof legacySettings === 'object') {
      const legacyPlaybackSettings = legacySettings as PlaybackSettings;
      return {
        compingStyle: legacyPlaybackSettings.compingStyle,
        drumsMode: legacyPlaybackSettings.drumsMode,
        customMediumSwingBass: legacyPlaybackSettings.customMediumSwingBass
      };
    }
  }

  return null;
}

export function saveSharedPlaybackSettings(settings: PlaybackSettings = {}): void {
  updateAppState((previousState) => ({
    ...previousState,
    sharedPlaybackSettings: {
      ...(previousState.sharedPlaybackSettings || {}),
      ...(settings || {})
    }
  }));
}

export function loadChartUiSettings(): Record<string, unknown> | null {
  const appState = loadAppState();
  return appState.chartUiSettings && typeof appState.chartUiSettings === 'object'
    ? deepClone(appState.chartUiSettings)
    : null;
}

export function saveChartUiSettings(settings: Record<string, unknown> = {}): void {
  updateAppState((previousState) => ({
    ...previousState,
    chartUiSettings: {
      ...(previousState.chartUiSettings || {}),
      ...(settings || {})
    }
  }));
}

export function loadDrillUiSettings(): Record<string, unknown> | null {
  const appState = loadAppState();
  return appState.drillUiSettings && typeof appState.drillUiSettings === 'object'
    ? deepClone(appState.drillUiSettings)
    : null;
}

export function saveDrillUiSettings(settings: Record<string, unknown> = {}): void {
  updateAppState((previousState) => ({
    ...previousState,
    drillUiSettings: {
      ...(previousState.drillUiSettings || {}),
      ...(settings || {})
    }
  }));
}

export function loadCurrentAppMode(): AppMode {
  const appState = loadAppState();
  return appState.currentMode === 'chart' ? 'chart' : 'drill';
}

export function saveCurrentAppMode(mode: AppMode | string): AppMode {
  const nextMode = mode === 'chart' ? 'chart' : 'drill';
  updateAppState((previousState) => ({
    ...previousState,
    currentMode: nextMode
  }));
  return nextMode;
}

function readPendingPracticeSession(appState: AppStateShape): PracticeSessionSpec | null {
  const pendingPracticeSession = appState.pendingPracticeSession || appState.pendingDrillSession;
  return pendingPracticeSession ? deepClone(pendingPracticeSession) : null;
}

export function storePendingPracticeSession(session: PracticeSessionSpec): void {
  updateAppState((previousState) => ({
    ...previousState,
    pendingPracticeSession: deepClone(session) || null,
    pendingDrillSession: null
  }));
}

export function peekPendingPracticeSession(): PracticeSessionSpec | null {
  const appState = loadAppState();
  return readPendingPracticeSession(appState);
}

export function consumePendingPracticeSession(): PracticeSessionSpec | null {
  const appState = loadAppState();
  const pendingPracticeSession = readPendingPracticeSession(appState);
  if (!pendingPracticeSession) return null;

  updateAppState((previousState) => ({
    ...previousState,
    pendingPracticeSession: null,
    pendingDrillSession: null
  }));
  return pendingPracticeSession;
}
