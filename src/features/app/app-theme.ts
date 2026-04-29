const THEME_STORAGE_KEY = 'sharp-eleven-theme';
const DEFAULT_PALETTE = 'classic-paper';
const DARK_PALETTE = 'dark-jazz';
const KNOWN_PALETTES = [DEFAULT_PALETTE, 'blue-note', 'dark-jazz'];
const THEME_DATA_SELECTOR_RE = /:root\s*\[[^\]]*data-theme\s*=\s*["']([^"']+)["']\]/i;
const EXPLORATION_DEPTH_LIMIT = 12;
const DEFAULT_LIGHT_LOGO_SRC = './logo/classic-paper.png';
const DEFAULT_DARK_LOGO_SRC = './logo/dark-mode.png';

type SharpElevenPaletteName = string;

function splitUrlSuffix(value: string): { path: string; suffix: string } {
  const suffixIndex = value.search(/[?#]/);
  if (suffixIndex === -1) return { path: value, suffix: '' };
  return {
    path: value.slice(0, suffixIndex),
    suffix: value.slice(suffixIndex)
  };
}

function resolveDarkIconHref(lightHref: string | null): string {
  if (!lightHref) return DEFAULT_DARK_LOGO_SRC;
  const { path, suffix } = splitUrlSuffix(lightHref);

  if (/\/assets\/favicon-[^/]+\.png$/i.test(path)) {
    return './logo/dark-mode.png';
  }

  if (/favicon\.(png|svg|ico)$/i.test(path)) {
    return `${path.replace(/favicon\.(png|svg|ico)$/i, 'logo/dark-mode.png')}${suffix}`;
  }

  return DEFAULT_DARK_LOGO_SRC;
}

function isDarkPalette(paletteName: SharpElevenPaletteName): boolean {
  return paletteName === DARK_PALETTE;
}

function updateFaviconLinks(paletteName: SharpElevenPaletteName): void {
  const useDarkIcon = isDarkPalette(paletteName);
  const iconLinks = document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="shortcut icon"]');

  for (const link of Array.from(iconLinks)) {
    const lightHref = link.dataset.themeLightHref ?? link.getAttribute('href') ?? '';
    const lightType = link.dataset.themeLightType ?? link.getAttribute('type') ?? '';
    const darkHref = link.dataset.themeDarkHref ?? resolveDarkIconHref(lightHref);

    link.dataset.themeLightHref = lightHref;
    link.dataset.themeLightType = lightType;
    link.dataset.themeDarkHref = darkHref;
    link.setAttribute('href', useDarkIcon ? darkHref : lightHref);

    if (useDarkIcon) {
      link.setAttribute('type', 'image/png');
    } else if (lightType) {
      link.setAttribute('type', lightType);
    } else {
      link.removeAttribute('type');
    }
  }
}

function updateBrandLogos(paletteName: SharpElevenPaletteName): void {
  const useDarkIcon = isDarkPalette(paletteName);
  const brandLogos = document.querySelectorAll<HTMLImageElement>('img.home-brand-logo');

  for (const image of Array.from(brandLogos)) {
    const lightSrc = image.dataset.themeLightSrc ?? image.getAttribute('src') ?? DEFAULT_LIGHT_LOGO_SRC;
    const darkSrc = image.dataset.themeDarkSrc ?? lightSrc.replace(/classic-paper\.png(?:[?#].*)?$/i, 'dark-mode.png');

    image.dataset.themeLightSrc = lightSrc;
    image.dataset.themeDarkSrc = darkSrc || DEFAULT_DARK_LOGO_SRC;
    image.src = useDarkIcon ? image.dataset.themeDarkSrc : lightSrc;
    image.alt = useDarkIcon ? 'Logo Dark Mode' : 'Logo Classic Paper';
  }
}

function updateThemeIcons(paletteName: SharpElevenPaletteName): void {
  updateFaviconLinks(paletteName);
  updateBrandLogos(paletteName);
}

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
  return isPaletteName(value) ? value : null;
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
  updateThemeIcons(paletteName);
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
