// @ts-check

/**
 * Creates the drill welcome-standards assembly from live root-app bindings.
 * This keeps parsing and option rendering for imported welcome standards out
 * of `app.js` while preserving the same onboarding-standard behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, Function>} [options.helpers]
 */
export function createDrillWelcomeStandardsRootAppAssembly({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
} = {}) {
  const {
    getWelcomeStandards = () => ({})
  } = state;
  const {
    noteLetterToSemitone = {},
    patternModeMinor = 'minor',
    compingStylePiano = 'piano'
  } = constants;
  const {
    normalizePatternMode = (value) => value
  } = helpers;

  function slugifyWelcomeStandardName(name) {
    return String(name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'standard';
  }

  function parsePitchClassFromKeyName(name) {
    const normalized = String(name || '').trim();
    const match = normalized.match(/^([A-Ga-g])([b#]?)/);
    if (!match) return null;
    const letter = match[1].toUpperCase();
    const accidental = match[2] || '';
    let pitchClass = noteLetterToSemitone[letter];
    if (!Number.isFinite(pitchClass)) return null;
    if (accidental === 'b') pitchClass = (pitchClass + 11) % 12;
    if (accidental === '#') pitchClass = (pitchClass + 1) % 12;
    return pitchClass;
  }

  function buildSingleEnabledKeySelectionFromPattern(pattern) {
    const match = String(pattern || '').match(/\bkey:\s*([A-G](?:b|#)?)/i);
    const pitchClass = parsePitchClassFromKeyName(match?.[1] || '');
    if (!Number.isFinite(pitchClass)) {
      return [true, false, false, false, false, false, false, false, false, false, false, false];
    }
    return Array.from({ length: 12 }, (_, index) => index === pitchClass);
  }

  function parseWelcomeStandardsText(text) {
    const entries = {};
    const lines = String(text || '').split(/\r?\n/);
    let pendingTempo = 120;
    let pendingName = null;
    let pendingMode = null;
    let pendingPatternParts = [];

    function flushPending() {
      if (!pendingName) return;
      const pattern = pendingPatternParts.join(' | ');
      const normalizedMode = normalizePatternMode(pendingMode);
      const keyMatch = pattern.match(/\bkey:\s*([A-G](?:b|#)?)/i);
      const keyName = keyMatch?.[1] || 'C';
      const isMinor = normalizedMode === patternModeMinor;
      const keyPitchClass = parsePitchClassFromKeyName(keyName);
      const fallbackPitchClass = Number.isFinite(keyPitchClass) ? keyPitchClass : 0;
      entries[slugifyWelcomeStandardName(pendingName)] = {
        summary: `Suggested: ${pendingName}, single key, ${pendingTempo >= 140 ? 'up-tempo' : 'comfortable'} groove.`,
        patternName: pendingName,
        pattern,
        patternMode: normalizedMode,
        majorMinor: isMinor,
        repetitionsPerKey: 1,
        tempo: pendingTempo,
        chordsPerBar: 4,
        compingStyle: compingStylePiano,
        enabledKeys: buildSingleEnabledKeySelectionFromPattern(pattern),
        sourcePitchClass: fallbackPitchClass
      };
      pendingName = null;
      pendingMode = null;
      pendingPatternParts = [];
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const tempoMatch = trimmed.match(/\bTempo:\s*(\d+)/i);
        if (tempoMatch) pendingTempo = Number.parseInt(tempoMatch[1], 10) || 120;
        continue;
      }
      if (!trimmed) {
        flushPending();
        continue;
      }

      const entryMatch = trimmed.match(/^([^|]+)\|([^|]+)\|(.*)$/);
      if (!entryMatch) continue;

      const col1 = entryMatch[1].trim();
      const col2 = entryMatch[2].trim();
      const col3 = entryMatch[3].trim();
      const isHeader = /^(major|minor)$/i.test(col2) && /^key:/i.test(col3);

      if (isHeader) {
        flushPending();
        pendingName = col1;
        pendingMode = col2;
        pendingPatternParts = [col3];
        continue;
      }

      if (pendingName) {
        pendingPatternParts.push(trimmed);
        continue;
      }

      const patternName = col1;
      const rawMode = col2;
      const pattern = col3;
      const normalizedMode = normalizePatternMode(rawMode);
      const keyMatch = pattern.match(/\bkey:\s*([A-G](?:b|#)?)/i);
      const keyName = keyMatch?.[1] || 'C';
      const isMinor = normalizedMode === patternModeMinor;
      const keyPitchClass = parsePitchClassFromKeyName(keyName);
      const fallbackPitchClass = Number.isFinite(keyPitchClass) ? keyPitchClass : 0;

      entries[slugifyWelcomeStandardName(patternName)] = {
        summary: `Suggested: ${patternName}, single key, ${pendingTempo >= 140 ? 'up-tempo' : 'comfortable'} groove.`,
        patternName,
        pattern,
        patternMode: normalizedMode,
        majorMinor: isMinor,
        repetitionsPerKey: 1,
        tempo: pendingTempo,
        chordsPerBar: 4,
        compingStyle: compingStylePiano,
        enabledKeys: buildSingleEnabledKeySelectionFromPattern(pattern),
        sourcePitchClass: fallbackPitchClass
      };
    }

    flushPending();
    return entries;
  }

  function renderWelcomeStandardOptions() {
    if (!dom.welcomeStandardSelect) return;
    const previousValue = dom.welcomeStandardSelect.value;
    const entries = Object.entries(getWelcomeStandards());
    dom.welcomeStandardSelect.innerHTML = '';

    entries.forEach(([key, entry], index) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = entry.patternName || key;
      if ((previousValue && previousValue === key) || (!previousValue && index === 0)) {
        option.selected = true;
      }
      dom.welcomeStandardSelect.append(option);
    });
  }

  return {
    parseWelcomeStandardsText,
    renderWelcomeStandardOptions
  };
}
