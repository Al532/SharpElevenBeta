const THEME_STORAGE_KEY = 'sharp-eleven-theme';
const DEFAULT_PALETTE = 'classic-paper';
const KNOWN_PALETTES = [DEFAULT_PALETTE, 'blue-note'];
const LEGACY_PALETTE_NAMES = new Map<string, string>([
  ['current', DEFAULT_PALETTE],
  ['iReal', 'blue-note']
]);
const THEME_DATA_SELECTOR_RE = /:root\s*\[[^\]]*data-theme\s*=\s*["']([^"']+)["']\]/i;
const EXPLORATION_DEPTH_LIMIT = 12;

type SharpElevenPaletteName = string;

function listThemeNamesFromStylesheets(): SharpElevenPaletteName[] {
  const names = new Set<string>(KNOWN_PALETTES);
  const styleSheets = Array.from(document.styleSheets ?? []);
  const visitedStyleSheets = new Set<CSSStyleSheet>();

  const inspectStyleRules = (styleSheet: CSSStyleSheet, depth = 0): void => {
    if (depth > EXPLORATION_DEPTH_LIMIT) return;
    if (visitedStyleSheets.has(styleSheet)) return;
    visitedStyleSheets.add(styleSheet);

    let rules: CSSRuleList;
    try {
      rules = styleSheet.cssRules;
    } catch {
      return;
    }

    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.IMPORT_RULE) {
        const importRule = rule as CSSImportRule;
        const importedStyleSheet = importRule.styleSheet;
        if (importedStyleSheet) {
          inspectStyleRules(importedStyleSheet, depth + 1);
        }
        continue;
      }

      if (rule.type !== CSSRule.STYLE_RULE) continue;
      const styleRule = rule as CSSStyleRule;
      const selectors = styleRule.selectorText.split(',');
      for (const selector of selectors) {
        const match = selector.trim().match(THEME_DATA_SELECTOR_RE);
        if (!match) continue;

        const name = (match[1] ?? '').trim();
        if (name) names.add(name);
      }
    }
  };

  for (const styleSheet of styleSheets) {
    inspectStyleRules(styleSheet);
  }

  return [...names].sort((a, b) => {
    if (a === DEFAULT_PALETTE) return -1;
    if (b === DEFAULT_PALETTE) return 1;
    return a.localeCompare(b);
  });
}

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
  if (typeof value !== 'string') return false;
  return listThemeNamesFromStylesheets().includes(value);
}

function normalizePaletteName(value: unknown): SharpElevenPaletteName | null {
  if (typeof value !== 'string') return null;
  const normalizedValue = LEGACY_PALETTE_NAMES.get(value) ?? value;
  return isPaletteName(normalizedValue) ? normalizedValue : null;
}

function readStoredPalette(storage: Storage | undefined): SharpElevenPaletteName {
  if (!storage) return DEFAULT_PALETTE;
  const availablePalettes = listThemeNamesFromStylesheets();

  try {
    const storedPalette = storage.getItem(THEME_STORAGE_KEY);
    return normalizePaletteName(storedPalette) ?? availablePalettes[0] ?? DEFAULT_PALETTE;
  } catch {
    return availablePalettes[0] ?? DEFAULT_PALETTE;
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
    listPalettes: () => listThemeNamesFromStylesheets(),
    getPalette: () => {
      const availablePalettes = listThemeNamesFromStylesheets();
      const fallbackPalette = availablePalettes[0] ?? DEFAULT_PALETTE;
      const currentPalette = document.documentElement.dataset.theme;
      return normalizePaletteName(currentPalette) ?? fallbackPalette;
    },
    setPalette: (paletteName) => {
      const normalizedPaletteName = normalizePaletteName(paletteName);
      if (!normalizedPaletteName) {
        throw new Error(`Unknown Sharp Eleven palette: ${String(paletteName)}`);
      }

      writeStoredPalette(storage, normalizedPaletteName);
      return applyPalette(normalizedPaletteName);
    },
    resetPalette: () => {
      clearStoredPalette(storage);
      const availablePalettes = listThemeNamesFromStylesheets();
      return applyPalette(availablePalettes[0] ?? DEFAULT_PALETTE);
    }
  };

  window.SharpElevenTheme = api;
  applyPalette(readStoredPalette(storage));
  return api;
}
