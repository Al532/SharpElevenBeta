function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatAccidentals(value) {
  return String(value)
    .replaceAll('b', '♭')
    .replaceAll('#', '♯');
}

function splitRootName(rootName) {
  const value = String(rootName || '');
  const match = /^([A-G])([♭♯]?)$/.exec(value);
  if (!match) {
    return { letter: value, accidental: '' };
  }
  return {
    letter: match[1],
    accidental: match[2] || ''
  };
}

function getDisplayPartsForQuality(quality) {
  switch (quality) {
    case '6':
      return { base: '', sup: '6' };
    case 'maj7':
      return { base: 'maj', sup: '7' };
    case 'lyd':
      return { base: 'maj', sup: '7(#11)' };
    case 'm7':
      return { base: 'm', sup: '7' };
    case 'm9':
      return { base: 'm', sup: '9' };
    case 'm6':
      return { base: 'm', sup: '6' };
    case 'm7b5':
      return { base: 'm', sup: '7(b5)' };
    case 'dim7':
      return { base: 'dim', sup: '7' };
    case '13':
      return { base: '', sup: '13' };
    case '7b9':
      return { base: '', sup: '7(b9)' };
    case '7b9b13':
      return { base: '', sup: '7(b9b13)' };
    case '7alt':
      return { base: '', sup: '7 alt' };
    case '13b9':
      return { base: '', sup: '13(b9)' };
    case '13#11':
      return { base: '', sup: '13(#11)' };
    case '7#5':
      return { base: '', sup: '7(#5)' };
    case '7#9':
      return { base: '', sup: '7(#9)' };
    case '7sus':
      return { base: 'sus', sup: '7' };
    case '7b9sus':
      return { base: 'sus', sup: '7(b9)' };
    default:
      return { base: quality || '', sup: '' };
  }
}

export function renderChordSymbolHtml(rootName, quality, bassName = null) {
  const { letter, accidental } = splitRootName(rootName);
  const safeRootLetter = escapeHtml(letter);
  const safeRootAccidental = escapeHtml(accidental);
  const { base, sup } = getDisplayPartsForQuality(quality || '');
  const safeBase = escapeHtml(formatAccidentals(base));
  const safeSup = escapeHtml(formatAccidentals(sup));
  const safeBass = bassName ? escapeHtml(formatAccidentals(bassName)) : '';

  return [
    '<span class="chord-symbol">',
    '<span class="chord-symbol-main">',
    '<span class="chord-symbol-root">',
    `<span class="chord-symbol-root-letter">${safeRootLetter}</span>`,
    safeRootAccidental ? `<span class="chord-symbol-root-accidental">${safeRootAccidental}</span>` : '',
    '</span>',
    safeBase ? `<span class="chord-symbol-base">${safeBase}</span>` : '',
    '</span>',
    safeSup ? `<span class="chord-symbol-sup">${safeSup}</span>` : '',
    safeBass ? `<span class="chord-symbol-slash">/${safeBass}</span>` : '',
    '</span>'
  ].join('');
}
