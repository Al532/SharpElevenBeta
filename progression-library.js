export function createProgressionEntry(pattern, modeNormalizer, patternNormalizer, mode = 'major', name = '', nameNormalizer = value => value) {
  return {
    pattern: patternNormalizer(pattern),
    mode: modeNormalizer(mode),
    name: nameNormalizer(name)
  };
}

export function normalizeProgressionEntry(name, entry, helpers) {
  const {
    createEntry,
    defaultMode = 'major'
  } = helpers;

  if (typeof entry === 'string') return createEntry(entry, defaultMode, '');
  if (entry && typeof entry === 'object') {
    return createEntry(entry.pattern ?? name, entry.mode, entry.name);
  }
  return createEntry(name, defaultMode, '');
}

export function normalizeProgressionsMap(source, fallbackProgressions, normalizeEntry) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return Object.fromEntries(
      Object.entries(fallbackProgressions).map(([name, entry]) => [name, normalizeEntry(name, entry)])
    );
  }

  const normalizedEntries = Object.entries(source)
    .map(([key, entry]) => [key, normalizeEntry(key, entry)])
    .filter(([, entry]) => entry.pattern);

  return Object.fromEntries(normalizedEntries);
}

export function isProgressionModeToken(value) {
  return ['major', 'minor', 'both', 'major/minor'].includes(String(value || '').trim().toLowerCase());
}

export function parseDefaultProgressionsText(source, helpers) {
  const {
    createEntry,
    isModeToken
  } = helpers;

  const lines = String(source || '')
    .split(/\r?\n/)
    .map(line => line.trim());

  let version = '1';
  const progressions = Object.fromEntries(
    lines
      .filter(line => {
        if (!line) return false;
        if (line.startsWith('# progressions-version:')) {
          version = line.slice('# progressions-version:'.length).trim() || '1';
          return false;
        }
        if (line.startsWith('# presets-version:')) {
          version = line.slice('# presets-version:'.length).trim() || '1';
          return false;
        }
        return !line.startsWith('#') && !line.startsWith('//');
      })
      .map(line => {
        const parts = line.split('|').map(part => part.trim());

        if (parts.length === 1) {
          return createEntry(parts[0], 'major', '');
        }

        if (isModeToken(parts[0])) {
          return createEntry(parts.slice(1).join(' | '), parts[0], '');
        }

        if (parts.length >= 3 && isModeToken(parts[1])) {
          return createEntry(parts.slice(2).join(' | '), parts[1], parts[0]);
        }

        return createEntry(parts.slice(1).join(' | '), 'major', parts[0]);
      })
      .filter(entry => entry.pattern)
      .map(entry => [entry.pattern, entry])
  );

  return { version, progressions };
}

export function getProgressionDisplayLabel(progressions, name) {
  const entry = Object.prototype.hasOwnProperty.call(progressions, name) ? progressions[name] : null;
  if (!entry) return name;
  return entry.name || entry.pattern || name;
}
