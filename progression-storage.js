const STORAGE_KEY = 'jazzTrainerProgressionSettings';
const LEGACY_STORAGE_KEY = 'jazzTrainerSettings';

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export function saveStoredProgressionSettings(settings) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Ignore storage failures and keep the app usable.
  }
}

export function loadStoredProgressionSettings() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY) || storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!storage.getItem(STORAGE_KEY)) {
      saveStoredProgressionSettings(parsed);
    }
    return parsed;
  } catch (error) {
    return null;
  }
}
