// @ts-check

/** @typedef {import('../types/contracts').AppMode} AppMode */
/** @typedef {import('../types/contracts').AppStateShape} AppStateShape */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

const APP_STATE_STORAGE_KEY = 'jpt-app-state-v1';

function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/**
 * @param {string} key
 * @returns {AppStateShape | null}
 */
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

/**
 * @param {string} key
 * @param {AppStateShape} value
 * @returns {boolean}
 */
function writeJsonStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** @returns {AppStateShape} */
export function loadAppState() {
  return readJsonStorage(APP_STATE_STORAGE_KEY) || {};
}

/**
 * @param {AppStateShape} nextState
 * @returns {AppStateShape}
 */
export function saveAppState(nextState) {
  const safeState = nextState && typeof nextState === 'object' ? nextState : {};
  writeJsonStorage(APP_STATE_STORAGE_KEY, safeState);
  return safeState;
}

/**
 * @param {AppStateShape | ((previousState: AppStateShape) => AppStateShape)} updater
 * @returns {AppStateShape}
 */
export function updateAppState(updater) {
  const previousState = loadAppState();
  const nextState = typeof updater === 'function'
    ? updater(previousState)
    : { ...previousState, ...(updater || {}) };
  return saveAppState(nextState);
}

/**
 * @param {{ legacyChartStorageKey?: string }} [options]
 * @returns {PlaybackSettings | null}
 */
export function loadSharedPlaybackSettings({ legacyChartStorageKey = '' } = {}) {
  const appState = loadAppState();
  if (appState.sharedPlaybackSettings && typeof appState.sharedPlaybackSettings === 'object') {
    return deepClone(appState.sharedPlaybackSettings);
  }

  if (legacyChartStorageKey) {
    const legacySettings = readJsonStorage(legacyChartStorageKey);
    if (legacySettings && typeof legacySettings === 'object') {
      const legacyPlaybackSettings = /** @type {PlaybackSettings} */ (legacySettings);
      return {
        compingStyle: legacyPlaybackSettings.compingStyle,
        drumsMode: legacyPlaybackSettings.drumsMode,
        customMediumSwingBass: legacyPlaybackSettings.customMediumSwingBass
      };
    }
  }

  return null;
}

/**
 * @param {PlaybackSettings} [settings]
 * @returns {void}
 */
export function saveSharedPlaybackSettings(settings = {}) {
  updateAppState((previousState) => ({
    ...previousState,
    sharedPlaybackSettings: {
      ...(previousState.sharedPlaybackSettings || {}),
      ...(settings || {})
    }
  }));
}

/** @returns {Record<string, unknown> | null} */
export function loadChartUiSettings() {
  const appState = loadAppState();
  return appState.chartUiSettings && typeof appState.chartUiSettings === 'object'
    ? deepClone(appState.chartUiSettings)
    : null;
}

/**
 * @param {Record<string, unknown>} [settings]
 * @returns {void}
 */
export function saveChartUiSettings(settings = {}) {
  updateAppState((previousState) => ({
    ...previousState,
    chartUiSettings: {
      ...(previousState.chartUiSettings || {}),
      ...(settings || {})
    }
  }));
}

/** @returns {Record<string, unknown> | null} */
export function loadDrillUiSettings() {
  const appState = loadAppState();
  return appState.drillUiSettings && typeof appState.drillUiSettings === 'object'
    ? deepClone(appState.drillUiSettings)
    : null;
}

/**
 * @param {Record<string, unknown>} [settings]
 * @returns {void}
 */
export function saveDrillUiSettings(settings = {}) {
  updateAppState((previousState) => ({
    ...previousState,
    drillUiSettings: {
      ...(previousState.drillUiSettings || {}),
      ...(settings || {})
    }
  }));
}

/** @returns {AppMode} */
export function loadCurrentAppMode() {
  const appState = loadAppState();
  return appState.currentMode === 'chart' ? 'chart' : 'drill';
}

/**
 * @param {AppMode | string} mode
 * @returns {AppMode}
 */
export function saveCurrentAppMode(mode) {
  const nextMode = mode === 'chart' ? 'chart' : 'drill';
  updateAppState((previousState) => ({
    ...previousState,
    currentMode: nextMode
  }));
  return nextMode;
}

/**
 * @param {PracticeSessionSpec} session
 * @returns {void}
 */
export function storePendingDrillSession(session) {
  updateAppState((previousState) => ({
    ...previousState,
    pendingDrillSession: deepClone(session) || null
  }));
}

/** @returns {PracticeSessionSpec | null} */
export function peekPendingDrillSession() {
  const appState = loadAppState();
  return appState.pendingDrillSession ? deepClone(appState.pendingDrillSession) : null;
}

/** @returns {PracticeSessionSpec | null} */
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
