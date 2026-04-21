function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const ACCIDENTAL_SVGS = Object.freeze({
  flat: [
    '<svg viewBox="0 -13 339 922" focusable="false" aria-hidden="true">',
    '<path d="M18 -5C23 -11 27 -13 32 -13C36 -13 41 -10 41 -10C86 16 122 57 159 82C293 175 339 267 339 336C339 421 273 475 204 480C194 480 183 478 173 475C156 471 138 465 122 454C113 447 96 433 89 433C86 433 84 433 81 435C71 439 65 450 65 460C66 493 75 853 75 883C75 900 62 909 47 909C26 909 2 894 0 867C0 867 6 10 18 -5ZM71 129C71 129 66 219 66 279C66 303 68 321 69 327C75 345 114 378 135 390C149 397 162 400 174 400C219 400 236 351 236 313C236 232 167 151 102 111C96 108 92 106 87 106C74 106 71 121 71 129Z" fill="currentColor"/>',
    '</svg>'
  ].join(''),
  sharp: [
    '<svg viewBox="0 -102 324 907" focusable="false" aria-hidden="true">',
    '<path d="M308 503C317 507 324 518 324 526V618C324 624 320 628 315 628C312 628 311 628 308 627C308 627 282 617 276 615C267 615 257 622 257 632V791C257 799 250 805 239 805C226 805 218 799 218 791V622C217 609 213 592 202 584C186 575 142 557 120 552C108 552 104 567 104 578V734C104 741 95 748 86 748C73 748 65 741 65 734V558C65 540 57 527 49 523C42 519 16 509 16 509C7 506 0 496 0 488V396C0 387 4 384 12 384L14 385C19 385 40 395 45 398L47 399C57 399 65 386 65 376V247C65 233 59 221 51 217C43 215 16 203 16 203C7 201 0 190 0 182V90C0 82 4 78 10 78C12 78 14 80 16 80C16 80 34 87 46 91C47 93 48 93 49 93C59 93 65 78 65 72V-88C65 -96 73 -102 82 -102C95 -102 104 -96 104 -88V93C104 110 111 119 117 121L196 154C198 154 200 155 202 155C212 155 218 139 218 132V-31C218 -39 226 -45 235 -45C250 -45 257 -39 257 -31V154C257 164 263 180 272 184C281 188 308 198 308 198C317 202 324 212 324 220V312C324 319 320 323 315 323C312 323 311 323 308 321L274 308C267 308 257 316 257 332V453C257 462 264 487 274 490ZM218 292C211 266 150 240 120 240C112 240 105 242 104 246C101 251 100 280 100 311C100 351 101 397 104 407C107 429 166 457 199 457C208 457 216 454 218 449C221 442 224 410 224 375C224 340 221 303 218 292Z" fill="currentColor"/>',
    '</svg>'
  ].join(''),
  natural: [
    '<svg viewBox="0 -86 218 879" focusable="false" aria-hidden="true">',
    '<path d="M183 585C181 585 179 584 178 584C178 584 95 554 61 554C53 554 48 555 48 561V778C48 787 40 793 33 793H16C7 793 0 787 0 778V108C0 99 4 97 12 97L14 98C16 98 18 98 20 99C38 107 111 138 148 138C161 138 170 134 170 124V-70C170 -79 177 -86 186 -86H203C211 -86 218 -79 218 -70V583C218 589 213 593 208 593C207 593 204 593 203 592ZM48 401C48 419 127 453 159 453C166 453 170 451 170 446V312C170 289 96 259 64 259C55 259 48 262 48 267Z" fill="currentColor"/>',
    '</svg>'
  ].join('')
});

function createAccidentalSpan(kind) {
  if (kind === 'flat') {
    return `<span class="chord-symbol-accidental chord-symbol-accidental-flat" aria-hidden="true">${ACCIDENTAL_SVGS.flat}</span>`;
  }

  return `<span class="chord-symbol-accidental chord-symbol-accidental-sharp" aria-hidden="true">${ACCIDENTAL_SVGS.sharp}</span>`;
}

function formatAccidentals(value) {
  return Array.from(String(value || ''), (character) => {
    if (character === '\u266D' || character === 'b') {
      return createAccidentalSpan('flat');
    }
    if (character === '\u266F' || character === '#') {
      return createAccidentalSpan('sharp');
    }
    return escapeHtml(character);
  }).join('');
}

export function renderAccidentalTextHtml(value) {
  return formatAccidentals(value);
}

function splitRootName(rootName) {
  const value = String(rootName || '');
  const match = /^([A-G])([b#\u266D\u266F]?)$/.exec(value);
  if (!match) {
    return { letter: value, accidental: '' };
  }
  return {
    letter: match[1],
    accidental: match[2] || ''
  };
}

function getDisplayPartsForQuality(quality) {
  if (/^\d+$/.test(String(quality || ''))) {
    return { base: '', sup: String(quality) };
  }

  switch (quality) {
    case 'maj7':
      return { base: 'maj', sup: '7' };
    case 'lyd':
      return { base: 'maj', sup: '7(#11)' };
    case 'maj#11':
      return { base: 'maj', sup: '7(#11)' };
    case 'maj7#11':
      return { base: 'maj', sup: '7(#11)' };
    case 'triangle#11':
      return { base: 'maj', sup: '7(#11)' };
    case '\u25B3#11':
      return { base: 'maj', sup: '7(#11)' };
    case 'm7':
      return { base: 'm', sup: '7' };
    case 'm9':
      return { base: 'm', sup: '9' };
    case 'm6':
      return { base: 'm', sup: '6' };
    case 'mMaj7':
      return { base: 'mMaj', sup: '7' };
    case 'mMaj9':
      return { base: 'mMaj', sup: '9' };
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

function getSegmentCompressionClass(value, type) {
  const safeValue = String(value || '');

  if (type === 'base') {
    switch (safeValue) {
      case 'm':
        return ' chord-symbol-base-condensed-m';
      case 'maj':
        return ' chord-symbol-base-condensed-maj';
      case 'mMaj':
        return ' chord-symbol-base-condensed-mmaj';
      case 'dim':
        return ' chord-symbol-base-condensed-dim';
      case 'sus':
        return ' chord-symbol-base-condensed-sus';
      default:
        return '';
    }
  }

  if (type === 'sup') {
    if (safeValue.startsWith('11')) return ' chord-symbol-sup-condensed-11';
    if (safeValue.startsWith('13')) return ' chord-symbol-sup-condensed-13';
    if (safeValue.includes('alt')) return ' chord-symbol-sup-condensed-alt';
  }

  return '';
}

function getSupAnchorCompressionClass(base) {
  switch (String(base || '')) {
    case 'm':
      return ' chord-symbol-sup-anchor-condensed-m';
    case 'maj':
      return ' chord-symbol-sup-anchor-condensed-maj';
    case 'mMaj':
      return ' chord-symbol-sup-anchor-condensed-mmaj';
    case 'dim':
      return ' chord-symbol-sup-anchor-condensed-dim';
    case 'sus':
      return ' chord-symbol-sup-anchor-condensed-sus';
    default:
      return '';
  }
}

export function renderChordSymbolHtml(rootName, quality, bassName = null) {
  const { letter, accidental } = splitRootName(rootName);
  const safeRootLetter = escapeHtml(letter);
  const safeRootAccidental = formatAccidentals(accidental);
  const { base, sup } = getDisplayPartsForQuality(quality || '');
  const safeBase = formatAccidentals(base);
  const safeSup = formatAccidentals(sup);
  const safeBass = bassName ? formatAccidentals(bassName) : '';
  const supContextClass = safeBase ? ' chord-symbol-sup-after-base' : ' chord-symbol-sup-after-root';
  const symbolContextClass = safeBase ? ' chord-symbol-with-base' : ' chord-symbol-root-only';
  const baseCompressionClass = getSegmentCompressionClass(base, 'base');
  const supCompressionClass = getSegmentCompressionClass(sup, 'sup');
  const supAnchorCompressionClass = safeBase ? getSupAnchorCompressionClass(base) : '';

  return [
    `<span class="chord-symbol${symbolContextClass}">`,
    '<span class="chord-symbol-topline">',
    '<span class="chord-symbol-head">',
    '<span class="chord-symbol-main">',
    '<span class="chord-symbol-root">',
    `<span class="chord-symbol-root-letter">${safeRootLetter}</span>`,
    safeRootAccidental ? `<span class="chord-symbol-root-accidental">${safeRootAccidental}</span>` : '',
    '</span>',
    safeBase ? `<span class="chord-symbol-base${baseCompressionClass}">${safeBase}</span>` : '',
    '</span>',
    safeSup ? `<span class="chord-symbol-sup${supContextClass}${supCompressionClass}${supAnchorCompressionClass}">${safeSup}</span>` : '',
    '</span>',
    safeBass
      ? [
          '<span class="chord-symbol-slash-stack">',
          '<span class="chord-symbol-slash-diagonal" aria-hidden="true"></span>',
          `<span class="chord-symbol-bass">${safeBass}</span>`,
          '</span>'
        ].join('')
      : '',
    '</span>',
    '</span>'
  ].join('');
}
