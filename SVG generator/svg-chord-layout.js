const GLYPH_ALIASES = {
  '♭': ['\uE260', 'b'],
  '♮': ['\uE261'],
  '♯': ['\uE262', '#'],
  '°': ['\uE870'],
  'ø': ['\uE871'],
  '△': ['\uE873', 'Δ', '∆'],
  'Δ': ['\uE873', '△', '∆'],
  '∆': ['\uE873', 'Δ', '△'],
  '\uE873': ['△', 'Δ', '∆'],
  '\uE870': ['°'],
  '\uE871': ['ø']
};

const DEFAULT_TUNING = Object.freeze({
  canvasMinWidth: 80,
  canvasHeight: 96,
  paddingLeft: 6,
  paddingRight: 14,
  tracking: 0.03,
  digitTracking: -0.64,
  fixedAccidentalGapBefore: -1,
  fixedSuffixGapAfterRoot: -3.5,
  fixedSuffixGapAfterAccidental: -1.5,
  fixedSuffixYOffset: 0,
  rootSize: 52,
  rootBaseline: 60,
  rootScaleX: 1.04,
  accidentalSize: 35,
  accidentalBaseline: 50,
  symbolSize: 38,
  symbolBaseline: 48,
  symbolDimSize: 40,
  symbolDimBaseline: 48,
  symbolHalfDimSize: 34,
  symbolHalfDimBaseline: 45,
  lowercaseSize: 32,
  lowercaseBaseline: 61,
  qualityGapBefore: -2,
  qualitySusScaleX: 0.82,
  qualityDimScaleX: 0.82,
  qualityMajScaleX: 0.82,
  maj7GapBefore: -2.5,
  maj7TextSize: 31,
  maj7TextBaseline: 60,
  maj7TextScaleX: 0.8,
  maj7DigitSize: 28,
  maj7DigitBaseline: 43,
  maj7DigitScaleX: 0.8,
  maj7DigitGap: -7,
  supSize: 27,
  supBaseline: 34,
  supScaleX: 0.9,
  susUnderSize: 32,
  susUnderBaseline: 60,
  susUnderScaleX: 0.81,
  susUnderOffsetX: 8,
  susUnderGapAfter: 2,
  susUnderDigitSize: 21,
  susUnderDigitBaseline: 60,
  susUnderDigitGap: 3,
  altAfterSupSize: 24,
  altAfterSupBaseline: 32,
  altAfterSupScaleX: 0.84,
  altAfterSupGap: -5,
  mMajParenSize: 25,
  mMajParenBaseline: 38,
  mMajParenScaleX: 0.74,
  minorMajorTriangleOffsetX: 8,
  supAnchorDefault: -7,
  supAnchorSymbol: -11,
  supAnchorM: -12,
  supAnchorMaj: -12,
  supAnchorMMaj: -18,
  supAnchorDim: -8,
  supAnchorSus: -17,
  supYOffsetDefault: 0,
  supYOffsetSymbol: 0,
  supYOffsetM: 7,
  supYOffsetMaj: 0,
  supYOffsetMMaj: 0,
  supYOffsetDim: 3,
  supYOffsetSus: 7,
  figure69Size: 22,
  figure69TopBaseline: 30,
  figure69BottomBaseline: 46,
  figure69BottomOffsetX: 10,
  figure69SlashX1: 11,
  figure69SlashY1: 37,
  figure69SlashX2: 20,
  figure69SlashY2: 26,
  figure69SlashStroke: 1.8,
  figure69Advance: 26,
  bassSize: 30,
  bassBaseline: 82,
  slashGapBefore: -44,
  slashX1Offset: 10,
  slashY1: 71,
  slashX2Offset: 26,
  slashY2: 48,
  slashAdvance: 26,
  slashStroke: 2.4,
  stackPrefixSize: 27,
  stackPrefixBaseline: 34,
  stackPrefixScaleX: 0.9,
  stackPrefixGap: -7,
  stack1PrefixGap: -8,
  stack1Size: 27,
  stack1Baseline: 34,
  stack1ItemScaleX: 0.86,
  stackAccidentalDigitTracking: -0.32,
  stackSharpDigitTracking: -0.26,
  stackFlatDigitTracking: -0.26,
  stack1ParenSize: 18,
  stack1ParenBaseline: 31,
  stack1ParenScaleX: 0.61,
  stack1OpenParenGapBefore: 0.5,
  stack1OpenParenGapAfter: 0,
  stack1CloseParenGapBefore: -2,
  stack1CloseParenGapAfter: -1,
  stack1RowsOffsetX: 1,
  stack1GapAfter: -7,
  stackParenSize: 38,
  stackParenBaseline: 40,
  stackParenScaleX: 0.65,
  stack2ParenSize: 33,
  stack2ParenBaseline: 38,
  stack2ParenScaleX: 0.4,
  stack2OpenParenGapBefore: -1,
  stack2OpenParenGapAfter: -0.5,
  stack2CloseParenGapBefore: -4.5,
  stack2CloseParenGapAfter: 0,
  stack2RowsOffsetX: 1,
  stack2GapAfter: -3.5,
  stack3ParenSize: 43,
  stack3ParenBaseline: 40,
  stack3ParenScaleX: 0.68,
  stack3OpenParenGapBefore: 0,
  stack3OpenParenGapAfter: 0,
  stack3CloseParenGapBefore: 0,
  stack3CloseParenGapAfter: 0,
  stack3RowsOffsetX: 1,
  stack3GapAfter: -3.5,
  stackRowsOffsetX: 1,
  stackAlign: 0.5,
  stackItemScaleX: 0.92,
  stackGapAfter: -3.5,
  stack2CenterY: 36,
  stack2Gap: 18,
  stack2Size: 24,
  stack3CenterY: 34,
  stack3Gap: 14,
  stack3Size: 22,
  collisionBodySupMargin: 0,
  collisionStackMargin: 0,
  collisionBassMargin: 0,
  collisionBodySlashMargin: 0,
  collisionSlashBassMargin: 0,
  collisionTriangleInnerTrim: 0.42,
  collisionLineParts: 4,
  autoResolveSuperscript: 1,
  autoResolveBass: 1,
  autoResolveMaxShift: 80
});

const DEFAULT_COLLISION_RULES = Object.freeze([
  {
    id: 'body-superscript',
    label: 'Corps / exposant',
    a: ['root', 'accidental', 'symbol', 'quality'],
    b: ['superscript'],
    marginKey: 'collisionBodySupMargin'
  },
  {
    id: 'stack-internal',
    label: 'Exposant empilé',
    a: ['stack-prefix', 'stack-paren', 'stack-row'],
    b: ['stack-prefix', 'stack-paren', 'stack-row'],
    marginKey: 'collisionStackMargin'
  },
  {
    id: 'superscript-bass',
    label: 'Exposant / basse',
    a: ['superscript'],
    b: ['slash', 'bass'],
    marginKey: 'collisionBassMargin'
  },
  {
    id: 'body-slash',
    label: 'Corps / slash',
    a: ['root', 'accidental', 'symbol', 'quality'],
    b: ['slash'],
    marginKey: 'collisionBodySlashMargin'
  },
  {
    id: 'slash-bass',
    label: 'Slash / basse',
    a: ['slash'],
    b: ['bass'],
    marginKey: 'collisionSlashBassMargin'
  }
]);

export function renderSvgChord(chord, options = {}) {
  const layout = layoutSvgChord(chord, options);
  return `
    <svg class="svg-chord" style="--svg-chord-width: ${layout.width}; --svg-chord-height: ${round(layout.height)};" viewBox="0 0 ${layout.width} ${round(layout.height)}" role="img" aria-label="${escapeAttr(chord)}">
      ${layout.elements.join('')}
    </svg>
  `;
}

export function renderSvgChordSuffix(suffix, options = {}) {
  const layout = layoutSvgChordSuffix(suffix, options);
  return `
    <svg class="svg-chord svg-suffix-block" style="--svg-chord-width: ${layout.viewBox.width}; --svg-chord-height: ${round(layout.height)};" viewBox="${layout.viewBox.x} 0 ${layout.viewBox.width} ${round(layout.height)}" role="img" aria-label="${escapeAttr(suffix)}">
      ${layout.elements.join('')}
    </svg>
  `;
}

export function renderSvgChordFixedBlocks(chord, options = {}) {
  const layout = layoutSvgChordFixedBlocks(chord, options);
  return `
    <svg class="svg-chord svg-fixed-chord" style="--svg-chord-width: ${layout.width}; --svg-chord-height: ${round(layout.height)};" viewBox="0 0 ${layout.width} ${round(layout.height)}" role="img" aria-label="${escapeAttr(chord)}">
      ${layout.elements.join('')}
    </svg>
  `;
}

export function layoutSvgChord(chord, options = {}) {
  const parts = parseChord(chord);
  const drawing = createSvgDrawing(options);
  const tuning = drawing.tuning;

  beginBlock(drawing, 'root', 'Fondamentale', 'root');
  drawText(drawing, parts.rootLetter, 'root', tuning.rootSize, tuning.rootBaseline, { scaleX: tuning.rootScaleX });
  endBlock(drawing);

  if (parts.rootAccidental) {
    beginBlock(drawing, 'root-accidental', 'Altération fondamentale', 'accidental');
    drawText(drawing, parts.rootAccidental, 'accidental', tuning.accidentalSize, tuning.accidentalBaseline);
    endBlock(drawing);
  }
  drawInlineQualityParts(drawing, parts);
  drawAttachedSuperscript(drawing, parts);

  if (parts.bass) {
    const preferredX = drawing.x;
    const shift = tuning.autoResolveBass
      ? getAutoResolveShift(drawing, (scratch) => {
        scratch.x = preferredX;
        drawBassSlashBlock(scratch, parts.bass);
      })
      : 0;
    drawing.x = preferredX + shift;
    drawBassSlashBlock(drawing, parts.bass);
  }

  const width = Math.max(tuning.canvasMinWidth, Math.ceil(drawing.x + tuning.paddingRight));
  const violations = markBlockCollisions(drawing.blocks, getCollisionRules(drawing));
  return {
    chord,
    parts,
    width,
    height: tuning.canvasHeight,
    elements: [
      ...drawing.elements,
      ...getDebugBoxElements(drawing, width)
    ],
    blocks: drawing.blocks,
    violations
  };
}

export function layoutSvgChordFixedBlocks(chord, options = {}) {
  const fixedParts = parseFixedBlockChord(chord);
  const suffixBlock = getFixedSuffixBlock(fixedParts.suffix, options.suffixBlocks || []);
  if (!fixedParts.rootLetter || !suffixBlock) return layoutSvgChord(chord, options);

  const drawing = createSvgDrawing(options);
  const tuning = drawing.tuning;

  beginBlock(drawing, 'root', 'Fondamentale', 'root');
  drawText(drawing, fixedParts.rootLetter, 'root', tuning.rootSize, tuning.rootBaseline, { scaleX: tuning.rootScaleX });
  endBlock(drawing);

  if (fixedParts.rootAccidental) {
    drawing.x += tuning.fixedAccidentalGapBefore;
    beginBlock(drawing, 'root-accidental', 'Alteration fondamentale', 'accidental');
    drawText(drawing, fixedParts.rootAccidental, 'accidental', tuning.accidentalSize, tuning.accidentalBaseline);
    endBlock(drawing);
  }

  const suffixX = drawing.x + (
    fixedParts.rootAccidental ? tuning.fixedSuffixGapAfterAccidental : tuning.fixedSuffixGapAfterRoot
  );
  drawFlattenedSuffixBlock(drawing, suffixBlock, suffixX, tuning.fixedSuffixYOffset);

  if (fixedParts.bass) {
    drawing.x += tuning.fixedSuffixGapAfterAccidental;
    drawBassSlashBlock(drawing, fixedParts.bass);
  }

  const visualBox = getBlocksVisualBox(drawing.blocks);
  const width = Math.max(
    tuning.canvasMinWidth,
    Math.ceil(Math.max(drawing.x, visualBox ? visualBox.x + visualBox.width : 0) + tuning.paddingRight)
  );
  return {
    chord,
    parts: fixedParts,
    suffixBlock,
    mode: 'fixed-blocks',
    width,
    height: tuning.canvasHeight,
    elements: [
      ...drawing.elements,
      ...getDebugBoxElements(drawing, width)
    ],
    blocks: drawing.blocks,
    violations: []
  };
}

export function parseChord(rawChord) {
  const chord = normalizeAccidentals(String(rawChord || '').trim());
  const slashBassMatch = chord.match(/\/([A-G](?:♭|♯|b|#)?$)/);
  const bass = slashBassMatch ? normalizeAccidentals(slashBassMatch[1]) : '';
  const withoutBass = slashBassMatch ? chord.slice(0, slashBassMatch.index) : chord;
  const rootMatch = withoutBass.match(/^([A-G])([♭♯b#]?)(.*)$/);
  if (!rootMatch) {
    return { rootLetter: chord, rootAccidental: '', quality: '', sup: '', supStack: null, symbol: '', bass: '', underQuality: '' };
  }

  const rootLetter = rootMatch[1];
  const rootAccidental = normalizeAccidentals(rootMatch[2] || '');
  const qualityRaw = normalizeAccidentals(rootMatch[3] || '');
  const qualityParts = splitQuality(qualityRaw);
  return { rootLetter, rootAccidental, bass, ...qualityParts };
}

export function layoutSvgChordSuffix(suffix, options = {}) {
  const parts = splitQuality(normalizeAccidentals(String(suffix || '').trim()));
  const drawing = createSvgDrawing(options);
  const tuning = drawing.tuning;
  const originX = Number(options.originX ?? tuning.paddingLeft);
  drawing.x = originX;

  drawInlineQualityParts(drawing, parts, { atOrigin: true });
  drawAttachedSuperscript(drawing, parts);

  const width = Math.max(1, Math.ceil(drawing.x + tuning.paddingRight));
  const violations = markBlockCollisions(drawing.blocks, getCollisionRules(drawing));
  const visualBox = getBlocksVisualBox(drawing.blocks) || { x: 0, y: 0, width, height: tuning.canvasHeight };
  const viewPadding = 4;
  const viewBoxX = Math.floor(Math.min(0, visualBox.x - viewPadding));
  const viewBoxRight = Math.ceil(Math.max(width, visualBox.x + visualBox.width + viewPadding));

  return {
    suffix,
    parts,
    originX,
    advance: round(drawing.x - originX),
    visualBox,
    viewBox: {
      x: viewBoxX,
      y: 0,
      width: Math.max(1, viewBoxRight - viewBoxX),
      height: tuning.canvasHeight
    },
    width,
    height: tuning.canvasHeight,
    elements: [
      ...drawing.elements,
      ...getDebugBoxElements(drawing, Math.max(width, viewBoxRight))
    ],
    blocks: drawing.blocks,
    violations
  };
}

function parseFixedBlockChord(rawChord) {
  const chord = String(rawChord || '').trim();
  const slashBassMatch = chord.match(/\/([A-G](?:[\u266D\u266F]|b|#)?$)/);
  const bass = slashBassMatch ? normalizeFixedPitch(slashBassMatch[1]) : '';
  const withoutBass = slashBassMatch ? chord.slice(0, slashBassMatch.index) : chord;
  const rootMatch = withoutBass.match(/^([A-G])([\u266D\u266F]|b|#)?(.*)$/);
  if (!rootMatch) return { raw: chord, rootLetter: '', rootAccidental: '', suffix: '', bass };
  return {
    raw: chord,
    rootLetter: rootMatch[1],
    rootAccidental: normalizeFixedAccidental(rootMatch[2] || ''),
    suffix: normalizeFixedSuffix(rootMatch[3] || ''),
    bass
  };
}

function getFixedSuffixBlock(suffix, suffixBlocks) {
  const targetKey = normalizeSuffixBlockKey(suffix);
  if (!targetKey) return null;
  return suffixBlocks.find((block) => (
    getSuffixBlockAliases(block).some((alias) => normalizeSuffixBlockKey(alias) === targetKey)
  )) || null;
}

function getSuffixBlockAliases(block) {
  return [
    block.suffix,
    block.label,
    block.irealQuality
  ].filter(Boolean);
}

function normalizeSuffixBlockKey(value) {
  return normalizeFixedSuffix(String(value || '').trim())
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()]/g, '')
    .replace(/^o/, 'dim')
    .replace(/^ø/, 'm7♭5');
}

function normalizeFixedPitch(value) {
  return String(value || '').replace(/^([A-G])([\u266D\u266F]|b|#)?$/, (_, letter, accidental = '') => (
    `${letter}${normalizeFixedAccidental(accidental)}`
  ));
}

function normalizeFixedAccidental(value) {
  if (value === 'b') return '\u266D';
  if (value === '#') return '\u266F';
  return value || '';
}

function normalizeFixedSuffix(value) {
  return String(value || '')
    .replace(/b(?=\d)/g, '\u266D')
    .replace(/#(?=\d)/g, '\u266F');
}

export function roleForCharacter(char, fallbackRole) {
  if (/[♭♯♮]/.test(char)) return 'accidental';
  if (/[\uE870-\uE87C\uF4D7-\uF4E2]/.test(char)) return 'symbol';
  if (/[ø°△Δ∆]/.test(char)) return 'symbol';
  if (/[0-9]/.test(char)) return 'digit';
  return fallbackRole;
}

function splitQuality(quality) {
  if (!quality) return withSupStack({ quality: '', sup: '', symbol: '' });

  const compact = quality.replace(/\s+/g, '');
  if (/^(m7♭5|ø7?)$/.test(compact)) return withSupStack({ quality: '', sup: '', symbol: 'ø' });
  if (/^(dim7|°7)$/.test(compact)) return withSupStack({ quality: '', sup: '7', symbol: '°' });
  if (/^(dim|°)$/.test(compact)) return withSupStack({ quality: '', sup: '', symbol: '°' });
  if (compact === 'maj7') return withSupStack({ quality: 'maj7', sup: '', symbol: '' });
  if (/^(Δ|△|∆)$/.test(compact)) return withSupStack({ quality: '', sup: '', symbol: '△' });
  if (/^(maj|Δ|△|∆)(.+)$/.test(compact)) return withSupStack({ quality: '', sup: compact.replace(/^(maj|Δ|△|∆)/, ''), symbol: '△' });
  if (/^mMaj(\d.*)$/.test(compact)) {
    const extension = compact.match(/^mMaj(\d.*)$/)[1];
    return withSupStack({ quality: 'm', sup: getMinorMajorSup(extension), minorMajorTriangle: true, symbol: '' });
  }
  if (/^m\(maj(\d.*)\)$/.test(compact)) return withSupStack({ quality: 'm', sup: '', mMajParen: `maj${compact.match(/^m\(maj(\d.*)\)$/)[1]}`, symbol: '' });
  if (/^mM(\d.*)$/.test(compact)) {
    const extension = compact.match(/^mM(\d.*)$/)[1];
    return withSupStack({ quality: 'm', sup: getMinorMajorSup(extension), minorMajorTriangle: true, symbol: '' });
  }
  if (/^m(\d.*)$/.test(compact)) return withSupStack({ quality: 'm', sup: compact.slice(1), symbol: '' });
  if (/^7alt$/.test(compact)) return withSupStack({ quality: '', sup: '7', altAfterSup: 'alt', symbol: '' });
  if (/^7sus(\d*)(\(.*\))?$/.test(compact)) {
    const match = compact.match(/^7sus(\d*)(\(.*\))?$/);
    return withSupStack({ quality: '', sup: `7${match[2] || ''}`, underQuality: `sus${match[1]}`, symbol: '' });
  }
  if (/^(\d+)sus(\d*)?(\(.*\))?$/.test(compact)) {
    const match = compact.match(/^(\d+)sus(\d*)?(\(.*\))?$/);
    return withSupStack({ quality: '', sup: `${match[1]}${match[3] || ''}`, underQuality: `sus${match[2] || ''}`, symbol: '' });
  }
  if (/^(\d+[♭♯]\d+)sus$/.test(compact)) {
    const match = compact.match(/^(\d+)([♭♯]\d+)sus$/);
    return withSupStack({ quality: '', sup: `${match[1]}(${match[2]})`, underQuality: 'sus', symbol: '' });
  }
  if (/^(\d+)([♭♯]\d+)$/.test(compact)) {
    const match = compact.match(/^(\d+)([♭♯]\d+)$/);
    return withSupStack({ quality: '', sup: `${match[1]}(${match[2]})`, symbol: '' });
  }
  if (/^sus(\d*)$/.test(compact)) return withSupStack({ quality: 'sus', sup: compact.slice(3), symbol: '' });
  if (/^dimMaj7$/.test(compact)) return withSupStack({ quality: '', sup: '△', minorMajorTriangle: true, symbol: '°' });
  if (/^(alt|add|sus|dim|maj|mMaj|m)(.*)$/.test(compact)) {
    const match = compact.match(/^(alt|add|sus|dim|maj|mMaj|m)(.*)$/);
    return withSupStack({ quality: match[1], sup: match[2] || '', symbol: '' });
  }
  if (compact === '69' || compact === '6/9') return withSupStack({ quality: '', sup: '', symbol: '', figure: 'sixNine' });
  if (/^\d/.test(compact)) return withSupStack({ quality: '', sup: compact, symbol: '' });

  const split = compact.match(/^([a-zA-Z]+)(.*)$/);
  return withSupStack(split
    ? { quality: split[1], sup: split[2] || '', symbol: '' }
    : { quality: '', sup: compact, symbol: '' });
}

function withSupStack(parts) {
  return {
    ...parts,
    supStack: parseParentheticalExtensionStack(parts.sup)
  };
}

function getMinorMajorSup(extension) {
  const normalized = String(extension || '');
  return normalized === '7' ? '△' : `△${normalized.replace(/^7/, '')}`;
}

function parseParentheticalExtensionStack(value) {
  const text = String(value || '');
  const match = /^(.*)\(([^()]+)\)$/.exec(text);
  if (!match) return null;

  const items = splitStackedExtensions(match[2]);
  if (items.length < 1) return null;
  if (items.length > 3) return { prefix: match[1], items: [items.join('')] };
  return { prefix: match[1], items };
}

function splitStackedExtensions(value) {
  const items = [];
  const pattern = /([b#♭♯♮]?\d+)/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(value))) {
    if (match.index !== cursor) return [];
    items.push(match[1]);
    cursor = pattern.lastIndex;
  }

  return cursor === value.length ? items : [];
}

function drawInlineQualityParts(drawing, parts, options = {}) {
  const tuning = drawing.tuning;
  if (parts.symbol) {
    const symbolMetrics = getSymbolMetrics(parts.symbol, tuning);
    beginBlock(drawing, 'quality-symbol', 'Symbole de qualite', 'symbol');
    drawText(drawing, parts.symbol, 'symbol', symbolMetrics.size, symbolMetrics.baseline);
    endBlock(drawing);
  }
  if (parts.quality) {
    if (!options.atOrigin) drawing.x += parts.quality === 'maj7' ? tuning.maj7GapBefore : tuning.qualityGapBefore;
    beginBlock(drawing, 'quality', 'Lettres minuscules', 'quality');
    if (parts.quality === 'maj7') {
      drawInlineMajorSeventh(drawing);
    } else {
      drawText(drawing, parts.quality, 'quality', tuning.lowercaseSize, tuning.lowercaseBaseline, {
        scaleX: getInlineQualityScaleX(parts.quality, tuning)
      });
    }
    endBlock(drawing);
  }
}

function drawInlineMajorSeventh(drawing) {
  const tuning = drawing.tuning;
  drawText(drawing, 'maj', 'quality', tuning.maj7TextSize, tuning.maj7TextBaseline, {
    scaleX: tuning.maj7TextScaleX
  });
  drawing.x += tuning.maj7DigitGap;
  drawText(drawing, '7', 'digit', tuning.maj7DigitSize, tuning.maj7DigitBaseline, {
    scaleX: tuning.maj7DigitScaleX
  });
}

function drawAttachedSuperscript(drawing, parts) {
  const tuning = drawing.tuning;
  const hasSuperscript = parts.supStack || parts.sup || parts.figure || parts.mMajParen;
  if (!hasSuperscript) return;

  const supYOffset = getSupYOffset(parts, tuning);
  const preferredX = drawing.x + getSupAnchorOffset(parts, tuning);
  const shift = tuning.autoResolveSuperscript
    ? getAutoResolveShift(drawing, (scratch) => {
      scratch.x = preferredX;
      drawSuperscriptBlock(scratch, parts, supYOffset);
    })
    : 0;
  drawing.x = preferredX + shift;
  drawSuperscriptBlock(drawing, parts, supYOffset);
}

function drawSuperscriptBlock(drawing, parts, yOffset = 0) {
  const tuning = drawing.tuning;
  const startX = drawing.x;
  beginBlock(drawing, 'superscript', 'Exposant', 'superscript');
  if (parts.supStack) {
    drawSuperscriptStack(drawing, parts.supStack, yOffset);
  } else if (parts.figure === 'sixNine') {
    drawFigureSixNine(drawing, yOffset);
  } else if (parts.sup) {
    if (parts.minorMajorTriangle) drawing.x += tuning.minorMajorTriangleOffsetX;
    beginBlock(drawing, 'sup-text', 'Texte exposant', 'superscript-text');
    drawText(drawing, parts.sup, 'quality', tuning.supSize, tuning.supBaseline + yOffset, { scaleX: tuning.supScaleX });
    endBlock(drawing);
  } else if (parts.mMajParen) {
    beginBlock(drawing, 'm-maj-paren', 'Parenthèse maj mineure', 'm-maj-paren');
    drawText(drawing, `(${parts.mMajParen})`, 'quality', tuning.mMajParenSize, tuning.mMajParenBaseline + yOffset, {
      scaleX: tuning.mMajParenScaleX
    });
    endBlock(drawing);
  }
  if (parts.underQuality) {
    const supEndX = drawing.x;
    drawing.x = startX + tuning.susUnderOffsetX;
    beginBlock(drawing, 'sus-under', 'Sus sous exposant', 'sus-under');
    drawSusUnderText(drawing, parts.underQuality, yOffset);
    endBlock(drawing);
    drawing.x = Math.max(supEndX, drawing.x + tuning.susUnderGapAfter);
  }
  if (parts.altAfterSup) {
    drawing.x += tuning.altAfterSupGap;
    beginBlock(drawing, 'alt-after-sup', 'Alt après 7', 'alt-after-sup');
    drawText(drawing, parts.altAfterSup, 'quality', tuning.altAfterSupSize, tuning.altAfterSupBaseline + yOffset, {
      scaleX: tuning.altAfterSupScaleX * getInlineQualityScaleX(parts.altAfterSup, tuning)
    });
    endBlock(drawing);
  }
  endBlock(drawing);
}

function drawSusUnderText(drawing, value, yOffset = 0) {
  const tuning = drawing.tuning;
  const match = String(value || '').match(/^(sus)(\d*)$/);
  if (!match) {
    drawText(drawing, value, 'quality', tuning.susUnderSize, tuning.susUnderBaseline + yOffset, {
      scaleX: tuning.susUnderScaleX * getInlineQualityScaleX(value, tuning)
    });
    return;
  }

  drawText(drawing, match[1], 'quality', tuning.susUnderSize, tuning.susUnderBaseline + yOffset, {
    scaleX: tuning.susUnderScaleX * tuning.qualitySusScaleX
  });
  if (match[2]) {
    drawing.x += tuning.susUnderDigitGap;
    drawText(drawing, match[2], 'quality', tuning.susUnderDigitSize, tuning.susUnderDigitBaseline + yOffset, {
      forceRole: true,
      scaleX: tuning.susUnderScaleX
    });
  }
}

function getSymbolMetrics(symbol, tuning) {
  if (/[\u00B0\uE870]/.test(symbol)) {
    return { size: tuning.symbolDimSize, baseline: tuning.symbolDimBaseline };
  }
  if (/[\u00F8\uE871]/.test(symbol)) {
    return { size: tuning.symbolHalfDimSize, baseline: tuning.symbolHalfDimBaseline };
  }
  return { size: tuning.symbolSize, baseline: tuning.symbolBaseline };
}

function getInlineQualityScaleX(value, tuning) {
  const text = String(value || '').toLowerCase();
  if (text.startsWith('sus')) return tuning.qualitySusScaleX;
  if (text.startsWith('dim')) return tuning.qualityDimScaleX;
  if (text.startsWith('maj')) return tuning.qualityMajScaleX;
  return 1;
}

function drawBassSlashBlock(drawing, bass) {
  const tuning = drawing.tuning;
  const slashX = drawing.x + tuning.slashGapBefore;
  beginBlock(drawing, 'slash', 'Slash de basse', 'slash', slashX);
  drawLine(
    drawing,
    slashX + tuning.slashX1Offset,
    tuning.slashY1,
    slashX + tuning.slashX2Offset,
    tuning.slashY2,
    tuning.slashStroke
  );
  const preferredBassX = slashX + tuning.slashAdvance;
  drawing.x = preferredBassX;
  endBlock(drawing);

  const bassShift = tuning.autoResolveBass
    ? getAutoResolveShift(drawing, (scratch) => {
      scratch.x = preferredBassX;
      drawBassTextBlock(scratch, bass);
    })
    : 0;
  drawing.x = preferredBassX + bassShift;
  drawBassTextBlock(drawing, bass);
}

function drawBassTextBlock(drawing, bass) {
  beginBlock(drawing, 'bass', 'Basse', 'bass');
  drawText(drawing, bass, 'root', drawing.tuning.bassSize, drawing.tuning.bassBaseline);
  endBlock(drawing);
}

function drawFlattenedSuffixBlock(drawing, suffixBlock, x, yOffset = 0) {
  const metrics = suffixBlock.metrics || {};
  const originX = Number(metrics.originX || 0);
  const dx = x - originX;
  const dy = Number(yOffset || 0);
  drawing.elements.push(`<g data-suffix-block="${escapeAttr(suffixBlock.id)}" transform="translate(${round(dx)} ${round(dy)})">${suffixBlock.svgFragment}</g>`);

  const collisionSourceBox = suffixBlock.collisionBoxes?.full || suffixBlock.collisionBox;
  const collisionBox = collisionSourceBox
    ? translateBox(collisionSourceBox, dx, dy)
    : null;
  const advance = Number(metrics.advance || 0);
  drawing.blocks.push({
    uid: `suffix-block-${drawing.blockIndex += 1}`,
    id: `suffix-${suffixBlock.id}`,
    label: `Suffixe ${suffixBlock.label}`,
    type: 'suffix',
    parentUid: null,
    depth: 0,
    startX: x,
    endX: x + advance,
    collisionBox,
    collisionParts: collisionBox ? [collisionBox] : [],
    advanceBox: {
      x,
      y: 0,
      width: advance,
      height: drawing.tuning.canvasHeight
    },
    collides: false,
    violations: []
  });
  drawing.x = Math.max(drawing.x, x + advance);
}

function drawSuperscriptStack(drawing, stack, yOffset = 0) {
  const tuning = drawing.tuning;
  const count = stack.items.length;
  if (stack.prefix) {
    beginBlock(drawing, 'stack-prefix', 'Préfixe empilé', 'stack-prefix');
    drawText(drawing, stack.prefix, 'quality', tuning.stackPrefixSize, tuning.stackPrefixBaseline + yOffset, { scaleX: tuning.stackPrefixScaleX });
    endBlock(drawing);
    drawing.x += count === 1 ? tuning.stack1PrefixGap : tuning.stackPrefixGap;
  }

  drawing.x += getStackOpenParenGapBefore(count, tuning);
  const parenMetrics = getStackParenMetrics(count, tuning);
  beginBlock(drawing, 'stack-paren-open', 'Parenthèse ouvrante', 'stack-paren');
  drawText(drawing, '(', 'quality', parenMetrics.size, parenMetrics.baseline + yOffset, { scaleX: parenMetrics.scaleX });
  endBlock(drawing);
  const rowsX = drawing.x + getStackRowsOffsetX(count, tuning);
  const rowBaselines = getStackBaselines(count, tuning).map((baseline) => baseline + yOffset);
  const rowSize = getStackRowSize(count, tuning);
  const itemScaleX = getStackItemScaleX(count, tuning);
  const rowTextOptions = getStackRowTextOptions(count, itemScaleX, tuning);
  const rowWidths = stack.items.map((item) => (
    measureText(drawing, item, 'quality', rowSize, rowTextOptions)
  ));
  const maxWidth = Math.max(...rowWidths, 0);
  const align = Math.min(1, Math.max(0, Number(tuning.stackAlign || 0)));

  stack.items.forEach((item, index) => {
    const offset = Math.max(0, maxWidth - rowWidths[index]) * align;
    const previousX = drawing.x;
    drawing.x = rowsX + offset;
    beginBlock(drawing, `stack-row-${index + 1}`, `Étage ${index + 1}`, 'stack-row');
    drawText(drawing, item, 'quality', rowSize, rowBaselines[index], rowTextOptions);
    endBlock(drawing);
    drawing.x = previousX;
  });

  drawing.x = rowsX + maxWidth + getStackGapAfter(count, tuning) + getStackCloseParenGapBefore(count, tuning);
  beginBlock(drawing, 'stack-paren-close', 'Parenthèse fermante', 'stack-paren');
  drawText(drawing, ')', 'quality', parenMetrics.size, parenMetrics.baseline + yOffset, { scaleX: parenMetrics.scaleX });
  endBlock(drawing);
  drawing.x += getStackCloseParenGapAfter(count, tuning);
}

function drawFigureSixNine(drawing, yOffset = 0) {
  const tuning = drawing.tuning;
  const startX = drawing.x;
  const previousX = drawing.x;
  drawing.x = startX;
  beginBlock(drawing, 'figure69-top', '6 du 6/9', 'figure69');
  drawText(drawing, '6', 'digit', tuning.figure69Size, tuning.figure69TopBaseline + yOffset, { scaleX: tuning.supScaleX });
  endBlock(drawing);
  drawing.x = startX + tuning.figure69BottomOffsetX;
  beginBlock(drawing, 'figure69-bottom', '9 du 6/9', 'figure69');
  drawText(drawing, '9', 'digit', tuning.figure69Size, tuning.figure69BottomBaseline + yOffset, { scaleX: tuning.supScaleX });
  endBlock(drawing);
  drawing.x = previousX;
  beginBlock(drawing, 'figure69-slash', 'Slash du 6/9', 'figure69-slash');
  drawLine(
    drawing,
    startX + tuning.figure69SlashX1,
    tuning.figure69SlashY1 + yOffset,
    startX + tuning.figure69SlashX2,
    tuning.figure69SlashY2 + yOffset,
    tuning.figure69SlashStroke
  );
  endBlock(drawing);
  drawing.x = startX + tuning.figure69Advance;
}

function getStackBaselines(count, tuning) {
  if (count === 1) return [tuning.stack1Baseline];
  const center = count === 3 ? tuning.stack3CenterY : tuning.stack2CenterY;
  const gap = count === 3 ? tuning.stack3Gap : tuning.stack2Gap;
  return Array.from({ length: count }, (_, index) => center + ((index - ((count - 1) / 2)) * gap));
}

function getStackRowSize(count, tuning) {
  if (count === 1) return tuning.stack1Size;
  return count === 3 ? tuning.stack3Size : tuning.stack2Size;
}

function getStackItemScaleX(count, tuning) {
  if (count === 1) return tuning.stack1ItemScaleX;
  return tuning.stackItemScaleX;
}

function getStackRowTextOptions(count, scaleX, tuning) {
  return {
    scaleX,
    accidentalDigitTracking: tuning.stackAccidentalDigitTracking,
    sharpDigitTracking: tuning.stackSharpDigitTracking,
    flatDigitTracking: tuning.stackFlatDigitTracking
  };
}

function getStackRowsOffsetX(count, tuning) {
  return getStackCountValue(count, tuning, 'RowsOffsetX', tuning.stackRowsOffsetX)
    + getStackOpenParenGapAfter(count, tuning);
}

function getStackGapAfter(count, tuning) {
  return getStackCountValue(count, tuning, 'GapAfter', tuning.stackGapAfter);
}

function getStackOpenParenGapBefore(count, tuning) {
  return getStackCountValue(count, tuning, 'OpenParenGapBefore', 0);
}

function getStackOpenParenGapAfter(count, tuning) {
  return getStackCountValue(count, tuning, 'OpenParenGapAfter', 0);
}

function getStackCloseParenGapBefore(count, tuning) {
  return getStackCountValue(count, tuning, 'CloseParenGapBefore', 0);
}

function getStackCloseParenGapAfter(count, tuning) {
  return getStackCountValue(count, tuning, 'CloseParenGapAfter', 0);
}

function getStackCountValue(count, tuning, suffix, fallback) {
  return Number(tuning[`stack${count}${suffix}`] ?? fallback);
}

function getStackParenMetrics(count, tuning) {
  if (count === 1) {
    return {
      size: tuning.stack1ParenSize,
      baseline: tuning.stack1ParenBaseline,
      scaleX: tuning.stack1ParenScaleX
    };
  }
  if (count === 3) {
    return {
      size: tuning.stack3ParenSize,
      baseline: tuning.stack3ParenBaseline,
      scaleX: tuning.stack3ParenScaleX
    };
  }
  return {
    size: tuning.stack2ParenSize ?? tuning.stackParenSize,
    baseline: tuning.stack2ParenBaseline ?? tuning.stackParenBaseline,
    scaleX: tuning.stack2ParenScaleX ?? tuning.stackParenScaleX
  };
}

function getSupAnchorOffset(parts, tuning) {
  switch (getSupContext(parts)) {
    case 'm':
      return tuning.supAnchorM;
    case 'maj':
      return tuning.supAnchorMaj;
    case 'mMaj':
      return tuning.supAnchorMMaj;
    case 'dim':
      return tuning.supAnchorDim;
    case 'sus':
      return tuning.supAnchorSus;
    case 'symbol':
      return tuning.supAnchorSymbol;
    default:
      return tuning.supAnchorDefault;
  }
}

function getSupYOffset(parts, tuning) {
  switch (getSupContext(parts)) {
    case 'm':
      return tuning.supYOffsetM;
    case 'maj':
      return tuning.supYOffsetMaj;
    case 'mMaj':
      return tuning.supYOffsetMMaj;
    case 'dim':
      return tuning.supYOffsetDim;
    case 'sus':
      return tuning.supYOffsetSus;
    case 'symbol':
      return tuning.supYOffsetSymbol;
    default:
      return tuning.supYOffsetDefault;
  }
}

function getSupContext(parts) {
  const quality = String(parts.quality || '');
  if (quality) return quality;
  const symbol = String(parts.symbol || '');
  if (/[\u00B0\u00F8\uE870\uE871]/.test(symbol)) return 'dim';
  if (symbol) return 'symbol';
  return 'default';
}

function createSvgDrawing(options) {
  const tuning = { ...DEFAULT_TUNING, ...(options.tuning || {}) };
  return {
    x: tuning.paddingLeft,
    elements: [],
    blocks: [],
    blockStack: [],
    blockIndex: 0,
    roleFontIds: options.roleFontIds || {},
    getAtlas: typeof options.getAtlas === 'function' ? options.getAtlas : () => null,
    strokeWidth: Math.max(0, Number(options.strokeWidth || 0)),
    debug: options.debug || {},
    collisionRules: Array.isArray(options.collisionRules) ? options.collisionRules : DEFAULT_COLLISION_RULES,
    tuning
  };
}

function beginBlock(drawing, id, label, type, startX = drawing.x) {
  const parent = drawing.blockStack[drawing.blockStack.length - 1] || null;
  const block = {
    uid: `${id}-${drawing.blockIndex += 1}`,
    id,
    label,
    type,
    parentUid: parent?.uid || null,
    depth: drawing.blockStack.length,
    startX,
    endX: startX,
    collisionBox: null,
    collisionParts: [],
    advanceBox: null,
    collides: false,
    violations: []
  };
  drawing.blockStack.push(block);
}

function endBlock(drawing) {
  const block = drawing.blockStack.pop();
  if (!block) return;
  block.endX = drawing.x;
  block.advanceBox = {
    x: Math.min(block.startX, block.endX),
    y: 0,
    width: Math.abs(block.endX - block.startX),
    height: drawing.tuning.canvasHeight
  };
  drawing.blocks.push(block);
}

function noteCollisionBox(drawing, box) {
  noteCollisionParts(drawing, box ? [box] : []);
}

function noteCollisionParts(drawing, boxes) {
  if (!drawing.blockStack.length || !boxes?.length) return;
  const normalizedBoxes = boxes.map(normalizeBox).filter((box) => box.width > 0 && box.height > 0);
  if (!normalizedBoxes.length) return;
  drawing.blockStack.forEach((block) => {
    normalizedBoxes.forEach((box) => {
      block.collisionParts.push(box);
      block.collisionBox = unionBoxes(block.collisionBox, box);
    });
  });
}

function drawTextAt(drawing, text, role, size, baseline, x, options = {}) {
  const previousX = drawing.x;
  drawing.x = x;
  const width = drawText(drawing, text, role, size, baseline, options);
  drawing.x = previousX;
  return width;
}

function measureText(drawing, text, role, size, options = {}) {
  const scaleX = options.scaleX || 1;
  const characters = Array.from(text);
  let width = 0;

  characters.forEach((char, index) => {
    const charRole = options.forceRole ? role : roleForCharacter(char, role);
    const fontId = drawing.roleFontIds[charRole];
    const atlas = drawing.getAtlas(fontId);
    const glyph = getGlyph(atlas, char);
    width += glyph?.advance && atlas?.unitsPerEm
      ? glyph.advance * (size / atlas.unitsPerEm) * scaleX
      : size * 0.55;

    const nextChar = characters[index + 1];
    const nextRole = nextChar ? (options.forceRole ? role : roleForCharacter(nextChar, role)) : '';
    if (charRole === 'accidental' && nextRole === 'digit') {
      width += size * getAccidentalDigitTracking(char, options);
    }
    if (charRole === 'digit' && nextChar && nextRole === 'digit') {
      width += size * drawing.tuning.digitTracking;
    }
  });

  return width + (size * drawing.tuning.tracking);
}

function drawText(drawing, text, role, size, baseline, options = {}) {
  const startX = drawing.x;
  const scaleX = options.scaleX || 1;
  const characters = Array.from(text);

  characters.forEach((char, index) => {
    const charRole = options.forceRole ? role : roleForCharacter(char, role);
    const fontId = drawing.roleFontIds[charRole];
    const atlas = drawing.getAtlas(fontId);
    if (!atlas) {
      drawMissingGlyph(drawing, char, size, baseline);
      return;
    }

    const glyph = getGlyph(atlas, char);
    if (!glyph?.path) {
      drawMissingGlyph(drawing, char, size, baseline);
      return;
    }

    const scale = size / atlas.unitsPerEm;
    const stroke = drawing.strokeWidth > 0
      ? ` stroke="currentColor" stroke-width="${round(drawing.strokeWidth)}" stroke-linejoin="round" vector-effect="non-scaling-stroke" paint-order="stroke fill"`
      : '';
    const transform = [
      `translate(${round(drawing.x)} ${round(baseline)})`,
      `scale(${round(scale * scaleX)} ${round(-scale)})`
    ].join(' ');
    drawing.elements.push(`<path d="${escapeAttr(glyph.path)}" transform="${transform}" fill="currentColor"${stroke}/>`);
    noteCollisionParts(drawing, getGlyphCollisionParts(char, glyph, drawing.x, baseline, scale, scaleX, drawing.tuning));
    drawing.x += glyph.advance * scale * scaleX;
    const nextChar = characters[index + 1];
    const nextRole = nextChar ? (options.forceRole ? role : roleForCharacter(nextChar, role)) : '';
    if (charRole === 'accidental' && nextRole === 'digit') {
      drawing.x += size * getAccidentalDigitTracking(char, options);
    }
    if (charRole === 'digit' && nextChar && nextRole === 'digit') {
      drawing.x += size * drawing.tuning.digitTracking;
    }
  });

  drawing.x += size * drawing.tuning.tracking;
  return drawing.x - startX;
}

function getAccidentalDigitTracking(char, options = {}) {
  if (char === '♯' || char === '#') {
    return Number(options.sharpDigitTracking ?? options.accidentalDigitTracking ?? 0);
  }
  if (char === '♭' || char === 'b') {
    return Number(options.flatDigitTracking ?? options.accidentalDigitTracking ?? 0);
  }
  return Number(options.accidentalDigitTracking || 0);
}

function getGlyph(atlas, char) {
  const glyphs = atlas?.glyphs || {};
  const aliases = GLYPH_ALIASES[char] || [];
  if (char === '°' || char === 'ø') {
    const preferred = aliases.map((alias) => glyphs[alias]).find(Boolean);
    if (preferred) return preferred;
  }
  if (isTriangleGlyph(char, null)) {
    const preferred = [...aliases.map((alias) => glyphs[alias]), glyphs[char]].find(Boolean);
    if (preferred) return preferred;
  }
  if (glyphs[char]) return glyphs[char];
  return aliases.map((alias) => glyphs[alias]).find(Boolean) || null;
}

function getGlyphSvgBox(glyph, x, baseline, scale, scaleX) {
  if (!Array.isArray(glyph?.bbox)) return null;
  const [xMin, yMin, xMax, yMax] = glyph.bbox;
  const left = x + (xMin * scale * scaleX);
  const right = x + (xMax * scale * scaleX);
  const top = baseline - (yMax * scale);
  const bottom = baseline - (yMin * scale);
  return {
    x: Math.min(left, right),
    y: Math.min(top, bottom),
    width: Math.abs(right - left),
    height: Math.abs(bottom - top)
  };
}

function getGlyphCollisionParts(char, glyph, x, baseline, scale, scaleX, tuning) {
  const box = getGlyphSvgBox(glyph, x, baseline, scale, scaleX);
  if (!box) return [];
  if (isTriangleGlyph(char, glyph)) return splitTriangleCollisionBox(box, tuning.collisionTriangleInnerTrim);
  return [box];
}

function isTriangleGlyph(char, glyph) {
  return char === '\u25B3'
    || char === '\u0394'
    || char === '\u2206'
    || char === '\uE873'
    || char === '\uF4DA'
    || glyph?.glyphName === 'uni25B3'
    || glyph?.glyphName === 'uni0394'
    || glyph?.glyphName === 'uni2206'
    || glyph?.glyphName === 'uniE873'
    || glyph?.glyphName === 'uniF4DA'
    || glyph?.glyphName === 'increment'
    || glyph?.unicode === 'U+25B3'
    || glyph?.unicode === 'U+0394'
    || glyph?.unicode === 'U+2206'
    || glyph?.unicode === 'U+E873'
    || glyph?.unicode === 'U+F4DA';
}

function splitTriangleCollisionBox(box, trimRatio) {
  const trim = Math.min(0.75, Math.max(0, Number(trimRatio ?? 0.42)));
  const topHeight = box.height * 0.28;
  const middleHeight = box.height * 0.34;
  const bottomHeight = box.height - topHeight - middleHeight;
  return [
    insetBox({
      x: box.x,
      y: box.y,
      width: box.width,
      height: topHeight
    }, box.width * trim),
    insetBox({
      x: box.x,
      y: box.y + topHeight,
      width: box.width,
      height: middleHeight
    }, box.width * trim * 0.45),
    {
      x: box.x,
      y: box.y + topHeight + middleHeight,
      width: box.width,
      height: bottomHeight
    }
  ].filter((part) => part.width > 0 && part.height > 0);
}

function insetBox(box, xInset) {
  const inset = Math.min(box.width / 2, Math.max(0, Number(xInset || 0)));
  return {
    x: box.x + inset,
    y: box.y,
    width: Math.max(0, box.width - (inset * 2)),
    height: box.height
  };
}

function drawMissingGlyph(drawing, char, size, baseline) {
  drawing.elements.push(`<text x="${round(drawing.x)}" y="${baseline}" class="missing-glyph" font-size="${size}">${escapeHtml(char)}</text>`);
  noteCollisionBox(drawing, {
    x: drawing.x,
    y: baseline - size,
    width: size * 0.55,
    height: size
  });
  drawing.x += size * 0.55;
}

function drawLine(drawing, x1, y1, x2, y2, strokeWidth) {
  drawing.elements.push(`<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="currentColor" stroke-width="${round(strokeWidth)}" stroke-linecap="round"/>`);
  noteCollisionParts(drawing, getLineCollisionParts(x1, y1, x2, y2, strokeWidth, drawing.tuning));
}

function getLineCollisionParts(x1, y1, x2, y2, strokeWidth, tuning) {
  const count = Math.max(1, Math.round(Number(tuning.collisionLineParts || 1)));
  const pad = Math.max(1, Number(strokeWidth || 0) * 1.4);
  const boxes = [];
  for (let index = 0; index < count; index += 1) {
    const t1 = index / count;
    const t2 = (index + 1) / count;
    const sx = lerp(x1, x2, t1);
    const sy = lerp(y1, y2, t1);
    const ex = lerp(x1, x2, t2);
    const ey = lerp(y1, y2, t2);
    boxes.push({
      x: Math.min(sx, ex) - pad,
      y: Math.min(sy, ey) - pad,
      width: Math.abs(ex - sx) + (pad * 2),
      height: Math.abs(ey - sy) + (pad * 2)
    });
  }
  return boxes;
}

function lerp(a, b, t) {
  return a + ((b - a) * t);
}

function getCollisionRules(drawing) {
  return drawing.collisionRules.map((rule) => ({
    ...rule,
    margin: Number(rule.margin ?? drawing.tuning[rule.marginKey] ?? 0)
  }));
}

function getAutoResolveShift(drawing, renderMovingBlock) {
  const scratch = createScratchDrawing(drawing);
  renderMovingBlock(scratch);
  if (!scratch.blocks.length || !drawing.blocks.length) return 0;

  const requestedShift = getRequiredRightShift(scratch.blocks, drawing.blocks, getCollisionRules(drawing));
  const maxShift = Math.max(0, Number(drawing.tuning.autoResolveMaxShift || 0));
  return Math.min(maxShift, Math.max(0, requestedShift));
}

function createScratchDrawing(drawing) {
  return {
    x: drawing.x,
    elements: [],
    blocks: [],
    blockStack: [],
    blockIndex: drawing.blockIndex,
    roleFontIds: drawing.roleFontIds,
    getAtlas: drawing.getAtlas,
    strokeWidth: drawing.strokeWidth,
    debug: {},
    collisionRules: drawing.collisionRules,
    tuning: drawing.tuning
  };
}

function getRequiredRightShift(movingBlocks, fixedBlocks, rules) {
  let shift = 0;
  rules.forEach((rule) => {
    movingBlocks.forEach((moving) => {
      fixedBlocks.forEach((fixed) => {
        if (!ruleMatchesPair(rule, moving, fixed)) return;
        shift = Math.max(shift, getRequiredRightShiftForBlocks(moving, fixed, rule.margin));
      });
    });
  });
  return shift;
}

function markBlockCollisions(blocks, rules) {
  const violations = [];
  rules.forEach((rule) => {
    for (let i = 0; i < blocks.length; i += 1) {
      for (let j = i + 1; j < blocks.length; j += 1) {
        const a = blocks[i];
        const b = blocks[j];
        if (!ruleMatchesPair(rule, a, b)) continue;
        if (areRelatedBlocks(a, b, blocks)) continue;
        if (!blockPartsOverlap(a, b, rule.margin)) continue;

        const violation = {
          ruleId: rule.id,
          label: rule.label,
          margin: rule.margin,
          a: a.uid,
          b: b.uid
        };
        violations.push(violation);
        markViolation(a, violation);
        markViolation(b, violation);
      }
    }
  });
  return violations;
}

function blockPartsOverlap(a, b, margin) {
  const aParts = getBlockCollisionParts(a);
  const bParts = getBlockCollisionParts(b);
  return aParts.some((aPart) => (
    bParts.some((bPart) => boxesOverlap(expandBox(aPart, margin), expandBox(bPart, margin)))
  ));
}

function getRequiredRightShiftForBlocks(moving, fixed, margin) {
  let shift = 0;
  getBlockCollisionParts(moving).forEach((movingPart) => {
    getBlockCollisionParts(fixed).forEach((fixedPart) => {
      shift = Math.max(shift, getRequiredRightShiftForBoxes(movingPart, fixedPart, margin));
    });
  });
  return shift;
}

function getRequiredRightShiftForBoxes(movingBox, fixedBox, margin) {
  const moving = expandBox(movingBox, margin);
  const fixed = expandBox(fixedBox, margin);
  if (!isUsableBox(moving) || !isUsableBox(fixed)) return 0;
  if (!boxesOverlap(moving, fixed)) return 0;
  return Math.max(0, (fixed.x + fixed.width) - moving.x);
}

function getBlockCollisionParts(block) {
  return (block.collisionParts.length ? block.collisionParts : [block.collisionBox]).filter(Boolean);
}

function markViolation(block, violation) {
  block.collides = true;
  block.violations.push(violation);
}

function ruleMatchesPair(rule, a, b) {
  return (matchesBlockSelector(rule.a, a) && matchesBlockSelector(rule.b, b))
    || (matchesBlockSelector(rule.a, b) && matchesBlockSelector(rule.b, a));
}

function matchesBlockSelector(selectors, block) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  return list.some((selector) => selector === block.type || selector === block.id || selector === block.uid);
}

function areRelatedBlocks(a, b, blocks) {
  return isAncestorBlock(a, b, blocks) || isAncestorBlock(b, a, blocks);
}

function isAncestorBlock(candidate, block, blocks) {
  let parentUid = block.parentUid;
  while (parentUid) {
    if (parentUid === candidate.uid) return true;
    const parent = blocks.find((item) => item.uid === parentUid);
    parentUid = parent?.parentUid || null;
  }
  return false;
}

function getDebugBoxElements(drawing, width) {
  const debug = drawing.debug || {};
  if (!debug.boxes) return [];

  const elements = [];
  drawing.blocks.forEach((block) => {
    if (debug.advances && block.advanceBox) {
      elements.push(drawDebugRect(block.advanceBox, `svg-debug-advance svg-debug-${block.type}`, `${block.label} advance`));
    }
    const boxes = debug.parts && block.collisionParts.length ? block.collisionParts : [block.collisionBox];
    boxes.filter(Boolean).forEach((box) => {
      elements.push(drawDebugRect(
        box,
        `svg-debug-collision svg-debug-${block.type}${block.collides ? ' svg-debug-collides' : ''}`,
        getBlockDebugLabel(block)
      ));
    });
  });

  if (debug.global) {
    const globalBox = drawing.blocks.reduce((box, block) => unionBoxes(box, block.collisionBox), null);
    if (globalBox) elements.push(drawDebugRect(globalBox, 'svg-debug-global', 'Accord collision globale'));
    elements.push(drawDebugRect({ x: 0, y: 0, width, height: drawing.tuning.canvasHeight }, 'svg-debug-canvas', 'Canvas'));
  }

  return elements;
}

function drawDebugRect(box, className, label) {
  return `<rect class="${escapeAttr(className)}" x="${round(box.x)}" y="${round(box.y)}" width="${round(box.width)}" height="${round(box.height)}" fill="none" vector-effect="non-scaling-stroke"><title>${escapeHtml(label)}</title></rect>`;
}

function getBlockDebugLabel(block) {
  if (!block.violations.length) return `${block.label} collision`;
  const rules = [...new Set(block.violations.map((violation) => violation.label))].join(', ');
  return `${block.label} collision: ${rules}`;
}

function boxesOverlap(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function isUsableBox(box) {
  return box && box.width > 0 && box.height > 0;
}

function expandBox(box, margin) {
  if (!box) return null;
  const amount = Number(margin || 0);
  return {
    x: box.x - amount,
    y: box.y - amount,
    width: box.width + (amount * 2),
    height: box.height + (amount * 2)
  };
}

function translateBox(box, dx, dy) {
  if (!box) return null;
  return {
    x: Number(box.x || 0) + Number(dx || 0),
    y: Number(box.y || 0) + Number(dy || 0),
    width: Number(box.width || 0),
    height: Number(box.height || 0)
  };
}

function getBlocksVisualBox(blocks) {
  return blocks.reduce((box, block) => (
    unionBoxes(box, block.collisionBox || block.advanceBox)
  ), null);
}

function unionBoxes(a, b) {
  if (!a) return b ? { ...b } : null;
  if (!b) return { ...a };
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function normalizeBox(box) {
  const x1 = Number(box.x || 0);
  const y1 = Number(box.y || 0);
  const x2 = x1 + Number(box.width || 0);
  const y2 = y1 + Number(box.height || 0);
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  };
}

function normalizeAccidentals(value) {
  return String(value || '').replaceAll('b', '♭').replaceAll('#', '♯');
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('\n', ' ');
}
