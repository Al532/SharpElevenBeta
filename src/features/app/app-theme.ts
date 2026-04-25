const THEME_STORAGE_KEY = 'sharp-eleven-theme';
const DEFAULT_PALETTE = 'current';
const PALETTE_NAMES = ['current'] as const;

type SharpElevenPaletteName = typeof PALETTE_NAMES[number];

export interface SharpElevenThemeApi {
  listPalettes: () => SharpElevenPaletteName[];
  getPalette: () => SharpElevenPaletteName;
  setPalette: (paletteName: SharpElevenPaletteName) => SharpElevenPaletteName;
  resetPalette: () => SharpElevenPaletteName;
}

declare global {
  interface Window {
    SharpElevenTheme?: SharpElevenThemeApi;
  }
}

function isPaletteName(value: unknown): value is SharpElevenPaletteName {
  return typeof value === 'string' && (PALETTE_NAMES as readonly string[]).includes(value);
}

function readStoredPalette(storage: Storage | undefined): SharpElevenPaletteName {
  if (!storage) return DEFAULT_PALETTE;

  try {
    const storedPalette = storage.getItem(THEME_STORAGE_KEY);
    return isPaletteName(storedPalette) ? storedPalette : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
}

function writeStoredPalette(storage: Storage | undefined, paletteName: SharpElevenPaletteName): void {
  if (!storage) return;

  try {
    storage.setItem(THEME_STORAGE_KEY, paletteName);
  } catch {
    // Persistence is a convenience for local palette testing.
  }
}

function clearStoredPalette(storage: Storage | undefined): void {
  if (!storage) return;

  try {
    storage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Palette switching still works for the current page when storage is blocked.
  }
}

function getThemeStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function applyPalette(paletteName: SharpElevenPaletteName): SharpElevenPaletteName {
  document.documentElement.dataset.theme = paletteName;
  return paletteName;
}

export function initializeSharpElevenTheme(): SharpElevenThemeApi {
  const storage = getThemeStorage();

  const api: SharpElevenThemeApi = {
    listPalettes: () => [...PALETTE_NAMES],
    getPalette: () => {
      const currentPalette = document.documentElement.dataset.theme;
      return isPaletteName(currentPalette) ? currentPalette : DEFAULT_PALETTE;
    },
    setPalette: (paletteName) => {
      if (!isPaletteName(paletteName)) {
        throw new Error(`Unknown Sharp Eleven palette: ${String(paletteName)}`);
      }

      writeStoredPalette(storage, paletteName);
      return applyPalette(paletteName);
    },
    resetPalette: () => {
      clearStoredPalette(storage);
      return applyPalette(DEFAULT_PALETTE);
    }
  };

  window.SharpElevenTheme = api;
  applyPalette(readStoredPalette(storage));
  return api;
}
