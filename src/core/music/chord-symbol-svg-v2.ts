import frozenSuffixRuntime from './chord-symbol-v2-runtime.json';

type FrozenSuffixBlock = {
  id: string,
  label: string,
  suffix: string,
  metrics: {
    originX: number,
    advance: number,
    width: number,
    height: number
  },
  svgFragment: string
};

type RootGlyph = {
  advance: number,
  path: string
};

type AccidentalGlyph = RootGlyph;

type ChordSymbolSvgV2Options = {
  useChordSymbolV2?: boolean
};

const DEFAULT_TUNING = Object.freeze({
  canvasMinWidth: 80,
  canvasHeight: 96,
  paddingLeft: 6,
  paddingRight: 14,
  rootSize: 52,
  rootBaseline: 60,
  rootScaleX: 1.04,
  accidentalSize: 35,
  accidentalBaseline: 50,
  fixedAccidentalGapBefore: -1,
  fixedSuffixGapAfterRoot: -3.5,
  fixedSuffixGapAfterAccidental: -1.5,
  fixedSuffixYOffset: 0
});

const EM_SCALE_REFERENCE = 58;

const ROOT_GLYPHS: Record<string, RootGlyph> = Object.freeze({
  A: {
    advance: 672,
    path: 'M534 0 467 188H203L137 0H0L262 717H409L671 0ZM374 476Q370 488 362.0 514.5Q354 541 346.5 569.5Q339 598 335 614Q330 593 323.5 566.5Q317 540 310.5 516.5Q304 493 299 476L237 298H435Z'
  },
  B: {
    advance: 659,
    path: 'M311 714Q452 714 520.0 672.0Q588 630 588 537Q588 493 571.5 460.5Q555 428 526.5 407.5Q498 387 461 379V374Q500 367 533.5 349.0Q567 331 587.5 296.5Q608 262 608 205Q608 140 577.0 94.0Q546 48 488.0 24.0Q430 0 351 0H89V714ZM322 421Q398 421 426.5 447.0Q455 473 455 520Q455 567 420.5 589.0Q386 611 312 611H219V421ZM219 321V104H334Q412 104 442.5 135.0Q473 166 473 216Q473 246 459.5 270.0Q446 294 414.0 307.5Q382 321 328 321Z'
  },
  C: {
    advance: 638,
    path: 'M400 615Q352 615 313.0 597.5Q274 580 247.0 546.0Q220 512 205.5 464.0Q191 416 191 356Q191 276 214.5 218.0Q238 160 285.5 129.5Q333 99 404 99Q451 99 493.5 109.0Q536 119 578 133V23Q536 6 490.5 -2.0Q445 -10 387 -10Q276 -10 202.5 35.5Q129 81 93.0 163.5Q57 246 57 357Q57 438 79.5 505.0Q102 572 146.0 621.5Q190 671 254.0 697.5Q318 724 401 724Q455 724 508.5 712.5Q562 701 607 679L563 574Q527 591 487.0 603.0Q447 615 400 615Z'
  },
  D: {
    advance: 732,
    path: 'M674 367Q674 246 629.0 164.0Q584 82 500.5 41.0Q417 0 301 0H89V714H320Q430 714 509.5 674.0Q589 634 631.5 557.5Q674 481 674 367ZM539 363Q539 446 513.0 500.0Q487 554 436.5 580.5Q386 607 312 607H219V108H295Q418 108 478.5 171.5Q539 235 539 363Z'
  },
  E: {
    advance: 558,
    path: 'M499 0H93V714H499V607H221V425H481V318H221V108H499Z'
  },
  F: {
    advance: 538,
    path: 'M219 0H93V714H498V607H219V397H479V290H219Z'
  },
  G: {
    advance: 726,
    path: 'M378 392H648V29Q591 10 531.0 0.0Q471 -10 395 -10Q287 -10 212.0 33.0Q137 76 98.0 158.0Q59 240 59 358Q59 470 103.0 552.0Q147 634 229.5 679.0Q312 724 431 724Q489 724 543.5 712.5Q598 701 643 681L599 576Q565 593 520.5 604.5Q476 616 428 616Q355 616 302.0 584.0Q249 552 220.5 493.5Q192 435 192 356Q192 280 214.0 221.5Q236 163 284.0 130.5Q332 98 409 98Q447 98 473.5 101.5Q500 105 522 111V283H378Z'
  }
});

const ACCIDENTAL_GLYPHS: Record<string, AccidentalGlyph> = Object.freeze({
  flat: {
    advance: 339,
    path: 'M18 -5C23 -11 27 -13 32 -13C36 -13 41 -10 41 -10C86 16 122 57 159 82C293 175 339 267 339 336C339 421 273 475 204 480C194 480 183 478 173 475C156 471 138 465 122 454C113 447 96 433 89 433C86 433 84 433 81 435C71 439 65 450 65 460C66 493 75 853 75 883C75 900 62 909 47 909C26 909 2 894 0 867C0 867 6 10 18 -5ZM69 327C75 345 114 378 135 390C149 397 162 400 174 400C219 400 236 351 236 313C236 232 167 151 102 111C96 108 92 106 87 106C74 106 71 121 71 129C71 129 66 219 66 279C66 303 68 321 69 327Z'
  },
  sharp: {
    advance: 324,
    path: 'M10 384C17 384 38 395 44 398C46 398 47 399 48 399C57 399 65 386 65 376V247C65 233 59 221 51 217C43 215 16 203 16 203C7 201 0 190 0 182V90C0 82 4 78 10 78C12 78 14 80 16 80C16 80 34 87 46 91C47 93 48 93 49 93C59 93 65 78 65 72V-88C65 -96 73 -102 82 -102C95 -102 104 -96 104 -88V93C104 110 111 119 117 121L196 154C198 154 200 155 202 155C212 155 218 139 218 132V-31C218 -39 226 -45 235 -45C250 -45 257 -39 257 -31V154C257 164 263 180 272 184C281 188 308 198 308 198C317 202 324 212 324 220V312C324 319 320 323 315 323C312 323 311 323 308 321L274 308C267 308 257 316 257 332V453C257 462 264 487 274 490L308 503C317 507 324 518 324 526V618C324 624 320 628 315 628C312 628 311 628 308 627C308 627 282 617 276 615C267 615 257 622 257 632V791C257 799 250 805 239 805C226 805 218 799 218 791V622C217 609 213 592 202 584C186 575 142 557 120 552C108 552 104 567 104 578V734C104 741 95 748 86 748C73 748 65 741 65 734V558C65 540 57 527 49 523C42 519 16 509 16 509C7 506 0 496 0 488V396C0 388 4 384 10 384ZM100 311C100 351 101 397 104 407C107 429 166 457 199 457C208 457 216 454 218 449C221 442 224 410 224 375C224 340 221 303 218 292C211 266 150 240 120 240C112 240 105 242 104 246C101 251 100 280 100 311Z'
  }
});

const SUFFIX_BLOCK_ALIASES: Record<string, string> = Object.freeze({
  '7': 'dominant-7',
  '11': 'dominant-11',
  '13': 'dominant-13',
  m: 'minor',
  min: 'minor',
  '-': 'minor',
  m7: 'minor-7',
  min7: 'minor-7',
  '-7': 'minor-7',
  maj7: 'major-7',
  major7: 'major-7',
  ma7: 'major-7',
  m7b5: 'minor-7-flat-5',
  'm7(b5)': 'minor-7-flat-5',
  'ø': 'minor-7-flat-5',
  'ø7': 'minor-7-flat-5',
  sus: 'sus',
  sus4: 'sus',
  '7sus': 'dominant-7-sus',
  '7sus4': 'dominant-7-sus',
  dim: 'dim',
  '°': 'dim',
  o: 'dim',
  dim7: 'dim-7',
  '°7': 'dim-7',
  o7: 'dim-7',
  m6: 'minor-6',
  m9: 'minor-9',
  '7b9': 'dominant-7-flat-9',
  '7(b9)': 'dominant-7-flat-9',
  '7alt': 'dominant-7-alt',
  alt: 'dominant-7-alt',
  '7 b9 b13': 'dominant-7-flat-9-flat-13-stack',
  '7(b9b13)': 'dominant-7-flat-9-flat-13-stack',
  '7(b9 b13)': 'dominant-7-flat-9-flat-13-stack'
});

const SUFFIX_BLOCKS_BY_ID = new Map<string, FrozenSuffixBlock>(
  (frozenSuffixRuntime.blocks as FrozenSuffixBlock[]).map((block) => [block.id, block])
);

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function round(value: number, precision = 3) {
  return Number(value.toFixed(precision));
}

function splitRootName(rootName: string | null | undefined) {
  const value = String(rootName || '');
  const match = /^([A-G])([b#\u266D\u266F]?)$/.exec(value);
  if (!match) return null;
  return {
    letter: match[1],
    accidental: match[2] || ''
  };
}

function normalizeQualityForFrozenSuffix(quality: string | null | undefined) {
  return String(quality || '')
    .trim()
    .replaceAll('\u266D', 'b')
    .replaceAll('\u266F', '#')
    .replace(/\s+/g, ' ');
}

function getFrozenSuffixBlock(quality: string | null | undefined) {
  const normalized = normalizeQualityForFrozenSuffix(quality);
  if (!normalized) return null;
  const blockId = SUFFIX_BLOCK_ALIASES[normalized] || '';
  return blockId ? SUFFIX_BLOCKS_BY_ID.get(blockId) || null : null;
}

function getAccidentalGlyph(accidental: string) {
  if (accidental === 'b' || accidental === '\u266D') return ACCIDENTAL_GLYPHS.flat;
  if (accidental === '#' || accidental === '\u266F') return ACCIDENTAL_GLYPHS.sharp;
  return null;
}

function createPathElement(path: string, transform: string, className: string) {
  return `<path class="${className}" d="${path}" transform="${transform}" fill="currentColor"/>`;
}

export function renderChordSymbolSvgV2Html(
  rootName: string | null | undefined,
  quality: string | null | undefined,
  bassName: string | null = null,
  options: ChordSymbolSvgV2Options = {}
) {
  if (options.useChordSymbolV2 === false) return null;
  if (bassName) return null;

  const root = splitRootName(rootName);
  if (!root) return null;

  const rootGlyph = ROOT_GLYPHS[root.letter];
  if (!rootGlyph) return null;

  const suffixBlock = getFrozenSuffixBlock(quality);
  if (String(quality || '').trim() && !suffixBlock) return null;

  const accidentalGlyph = getAccidentalGlyph(root.accidental);
  const rootScaleX = DEFAULT_TUNING.rootSize * DEFAULT_TUNING.rootScaleX / 1000;
  const rootScaleY = DEFAULT_TUNING.rootSize / 1000;
  const accidentalScale = DEFAULT_TUNING.accidentalSize / 1000;
  const rootX = DEFAULT_TUNING.paddingLeft;
  let cursor = rootX + (rootGlyph.advance * rootScaleX);
  const parts = [
    createPathElement(
      rootGlyph.path,
      `translate(${round(rootX)} ${round(DEFAULT_TUNING.rootBaseline)}) scale(${round(rootScaleX, 5)} ${round(-rootScaleY, 5)})`,
      'chord-symbol-v2-root'
    )
  ];

  if (accidentalGlyph) {
    cursor += DEFAULT_TUNING.fixedAccidentalGapBefore;
    parts.push(createPathElement(
      accidentalGlyph.path,
      `translate(${round(cursor)} ${round(DEFAULT_TUNING.accidentalBaseline)}) scale(${round(accidentalScale, 5)} ${round(-accidentalScale, 5)})`,
      'chord-symbol-v2-accidental'
    ));
    cursor += accidentalGlyph.advance * accidentalScale;
    cursor += DEFAULT_TUNING.fixedSuffixGapAfterAccidental;
  } else {
    cursor += DEFAULT_TUNING.fixedSuffixGapAfterRoot;
  }

  let width = cursor;
  if (suffixBlock) {
    const suffixTranslateX = cursor - suffixBlock.metrics.originX;
    parts.push(`<g class="chord-symbol-v2-suffix" transform="translate(${round(suffixTranslateX)} ${round(DEFAULT_TUNING.fixedSuffixYOffset)})">${suffixBlock.svgFragment}</g>`);
    width = Math.max(width, suffixTranslateX + suffixBlock.metrics.width);
  }

  width = Math.max(DEFAULT_TUNING.canvasMinWidth, Math.ceil(width + DEFAULT_TUNING.paddingRight));
  const height = DEFAULT_TUNING.canvasHeight;
  const ariaLabel = `${rootName || ''}${quality || ''}`;

  return [
    `<span class="chord-symbol-v2" data-chord-symbol-renderer="v2" aria-label="${escapeHtml(ariaLabel)}">`,
    `<svg class="chord-symbol-v2-svg" viewBox="0 0 ${width} ${height}" style="width:${round(width / EM_SCALE_REFERENCE)}em;height:${round(height / EM_SCALE_REFERENCE)}em" focusable="false" aria-hidden="true">`,
    parts.join(''),
    '</svg>',
    '</span>'
  ].join('');
}
