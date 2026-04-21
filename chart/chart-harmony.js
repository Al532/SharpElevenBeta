const SHARP_NOTES = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
const FLAT_NOTES = Object.freeze(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']);
const NOTE_TO_SEMITONE = Object.freeze({
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11
});

function mod(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function preferFlatSpelling(symbol = '') {
  return symbol.includes('b') && !symbol.includes('#');
}

export function normalizeSemitone(value) {
  return mod(value, 12);
}

export function parseNoteSymbol(symbol) {
  const normalized = String(symbol || '').trim();
  if (!normalized) return null;
  const semitone = NOTE_TO_SEMITONE[normalized];
  if (!Number.isInteger(semitone)) return null;
  return {
    symbol: normalized,
    semitone
  };
}

export function semitoneToNoteName(semitone, { preferFlats = false } = {}) {
  const noteNames = preferFlats ? FLAT_NOTES : SHARP_NOTES;
  return noteNames[normalizeSemitone(semitone)] || 'C';
}

export function transposeNoteSymbol(symbol, semitoneOffset, { preferFlats = preferFlatSpelling(symbol) } = {}) {
  const parsed = parseNoteSymbol(symbol);
  if (!parsed) return String(symbol || '');
  return semitoneToNoteName(parsed.semitone + semitoneOffset, { preferFlats });
}

export function splitChordSymbol(symbol) {
  const raw = String(symbol || '').trim();
  if (!raw || raw === '%' || raw === 'N.C.' || raw === 'NC') return null;

  const match = raw.match(/^([A-G](?:b|#)?)(.*?)(?:\/([A-G](?:b|#)?))?$/);
  if (!match) return null;

  const [, root, descriptor = '', bass = ''] = match;
  return {
    root,
    descriptor,
    bass: bass || ''
  };
}

export function transposeChordSymbol(symbol, semitoneOffset, options = {}) {
  const raw = String(symbol || '').trim();
  if (!raw || raw === '%' || raw === 'N.C.' || raw === 'NC') return raw;

  const split = splitChordSymbol(raw);
  if (!split) return raw;

  const { root, descriptor = '', bass = '' } = split;
  const transposedRoot = transposeNoteSymbol(root, semitoneOffset, options);
  const transposedBass = bass ? transposeNoteSymbol(bass, semitoneOffset, options) : '';
  return `${transposedRoot}${descriptor}${transposedBass ? `/${transposedBass}` : ''}`;
}

export function transposeKeySymbol(symbol, semitoneOffset) {
  const raw = String(symbol || '').trim();
  if (!raw) return raw;

  const match = raw.match(/^([A-G](?:b|#)?)([-m]?)$/);
  if (!match) return raw;

  const [, tonic, suffix] = match;
  const transposed = transposeNoteSymbol(tonic, semitoneOffset, {
    preferFlats: preferFlatSpelling(tonic) || suffix === '-'
  });
  return `${transposed}${suffix}`;
}
