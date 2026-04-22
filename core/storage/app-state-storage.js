const APP_STATE_STORAGE_KEY = 'jpt-app-state-v1';

function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function readJsonStorage(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeJsonStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadAppState() {
  return readJsonStorage(APP_STATE_STORAGE_KEY) || {};
}

export function saveAppState(nextState) {
  const safeState = nextState && typeof nextState === 'object' ? nextState : {};
  writeJsonStorage(APP_STATE_STORAGE_KEY, safeState);
  return safeState;
}

export function updateAppState(updater) {
  const previousState = loadAppState();
  const nextState = typeof updater === 'function'
    ? updater(previousState)
    : { ...previousState, ...(updater || {}) };
  return saveAppState(nextState);
}

export function loadSharedPlaybackSettings({ legacyChartStorageKey = '' } = {}) {
  const appState = loadAppState();
  if (appState.sharedPlaybackSettings && typeof appState.sharedPlaybackSettings === 'object') {
    return deepClone(appState.sharedPlaybackSettings);
  }

  if (legacyChartStorageKey) {
    const legacySettings = readJsonStorage(legacyChartStorageKey);
    if (legacySettings && typeof legacySettings === 'object') {
      return {
        compingStyle: legacySettings.compingStyle,
        drumsMode: legacySettings.drumsMode,
        customMediumSwingBass: legacySettings.customMediumSwingBass
      };
    }
  }

  return null;
}

export function saveSharedPlaybackSettings(settings = {}) {
  updateAppState((previousState) => ({
    ...previousState,
    sharedPlaybackSettings: {
      ...(previousState.sharedPlaybackSettings || {}),
      ...(settings || {})
    }
  }));
}

export function loadChartUiSettings() {
  const appState = loadAppState();
  return appState.chartUiSettings && typeof appState.chartUiSettings === 'object'
    ? deepClone(appState.chartUiSettings)
    : null;
}

export function saveChartUiSettings(settings = {}) {
  updateAppState((previousState) => ({
    ...previousState,
    chartUiSettings: {
      ...(previousState.chartUiSettings || {}),
      ...(settings || {})
    }
  }));
}

export function loadDrillUiSettings() {
  const appState = loadAppState();
  return appState.drillUiSettings && typeof appState.drillUiSettings === 'object'
    ? deepClone(appState.drillUiSettings)
    : null;
}

export function saveDrillUiSettings(settings = {}) {
  updateAppState((previousState) => ({
    ...previousState,
    drillUiSettings: {
      ...(previousState.drillUiSettings || {}),
      ...(settings || {})
    }
  }));
}

export function loadCurrentAppMode() {
  const appState = loadAppState();
  return appState.currentMode === 'chart' ? 'chart' : 'drill';
}

export function saveCurrentAppMode(mode) {
  const nextMode = mode === 'chart' ? 'chart' : 'drill';
  updateAppState((previousState) => ({
    ...previousState,
    currentMode: nextMode
  }));
  return nextMode;
}

export function storePendingDrillSession(session) {
  updateAppState((previousState) => ({
    ...previousState,
    pendingDrillSession: deepClone(session) || null
  }));
}

export function peekPendingDrillSession() {
  const appState = loadAppState();
  return appState.pendingDrillSession ? deepClone(appState.pendingDrillSession) : null;
}

export function consumePendingDrillSession() {
  const appState = loadAppState();
  const pendingDrillSession = appState.pendingDrillSession ? deepClone(appState.pendingDrillSession) : null;
  if (!pendingDrillSession) return null;

  updateAppState((previousState) => ({
    ...previousState,
    pendingDrillSession: null
  }));
  return pendingDrillSession;
}
