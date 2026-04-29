import { CHART_DISPLAY_CONFIG } from '../../config/trainer-config.js';

const {
  layout: CHART_LAYOUT_CONFIG,
  rowSpacing: CHART_ROW_SPACING_CONFIG,
  rowAnnotations: CHART_ROW_ANNOTATIONS_CONFIG,
  displacement: CHART_DISPLACEMENT_CONFIG,
  barResizing: CHART_BAR_RESIZING_CONFIG,
  compression: CHART_COMPRESSION_CONFIG,
  density: CHART_DENSITY_CONFIG,
  tokenMetrics: CHART_TOKEN_METRICS_CONFIG,
  subdividedTokenScale: CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG,
  debug: CHART_DEBUG_CONFIG
} = CHART_DISPLAY_CONFIG;

const OPTICAL_PIPELINE_MAX_PASSES = 3;
const OPTICAL_PIPELINE_RESIZE_EPSILON = 0.005;
const LAYOUT_PIPELINE_STEP_NAMES = Object.freeze([
  'barLinePlacement',
  'displacement',
  'rowResizing',
  'compression',
  'postCompressionDisplacement',
  'rowGap',
  'firstRowHeaderShift',
  'endingMargins',
  'annotationPlacement',
  'sectionEndingCollision',
  'collisionOverlay'
]);

type LayoutPipelineStepName = typeof LAYOUT_PIPELINE_STEP_NAMES[number];

type CreateChartSheetRendererOptions = {
  sheetGrid?: HTMLElement | null,
  diagnosticsList?: HTMLElement | null,
  getDisplayedBarGroupSize?: () => number,
  getHarmonyDisplayMode?: () => string,
  getTextScaleCompensation?: () => number,
  getFallbackTimeSignature?: () => string,
  renderChordMarkup?: (token: any, harmonyDisplayMode: string) => string,
  isBarActive?: (bar: any) => boolean,
  isBarSelected?: (bar: any) => boolean
};

type RenderBarCellOptions = {
  isRowStart?: boolean,
  slotSpan?: number,
  sectionChanged?: boolean
};

type CollisionDebugBox = {
  kind: string,
  rect: {
    left: number,
    top: number,
    right: number,
    bottom: number,
    width?: number,
    height?: number
  },
  label?: string
};

type ChartLayoutDebugRect = {
  left: number,
  top: number,
  right: number,
  bottom: number,
  width: number,
  height: number
};

type ChartLayoutDebugToken = {
  slotIndex: number,
  symbol: string,
  offsetEm: number,
  offsetPx: number,
  tokenScaleX: number,
  rootScaleX: number,
  slotRect: ChartLayoutDebugRect,
  symbolRect: ChartLayoutDebugRect | null,
  anchorX: number,
  beatTargetX: number,
  anchorDeltaPx: number,
  overlapWithNextPx: number
};

type ChartLayoutDebugBar = {
  barId: string,
  barIndex: number | null,
  rowIndex: number,
  columnIndex: number,
  parts: number,
  localScale: number,
  rowScale: number,
  pageScale: number,
  rowScaleLimit: number,
  pageScaleLimit: number,
  finalScale: number,
  fontSizePx: number,
  measureRect: ChartLayoutDebugRect,
  bodyRect: ChartLayoutDebugRect,
  tokens: ChartLayoutDebugToken[]
};

type ChartLayoutDebugSnapshot = {
  generatedAt: string,
  viewport: { width: number, height: number },
  activeBypasses: Record<string, boolean>,
  pipelineStepsRun: string[],
  config: {
    displacement: typeof CHART_DISPLACEMENT_CONFIG,
    barResizing: typeof CHART_BAR_RESIZING_CONFIG,
    compression: typeof CHART_COMPRESSION_CONFIG
  },
  bars: ChartLayoutDebugBar[]
};

const layoutDebugRuntimeBypasses: Record<string, boolean> = {};
let lastLayoutPipelineStepsRun: string[] = [];

function getDefaultLayoutPipelineBypasses() {
  return { ...(CHART_DEBUG_CONFIG?.layoutPipelineBypasses || {}) };
}

export function getChartLayoutDebugBypasses() {
  return {
    ...getDefaultLayoutPipelineBypasses(),
    ...layoutDebugRuntimeBypasses
  };
}

/**
 * @param {Record<string, boolean>} nextBypasses
 * @returns {Record<string, boolean>}
 */
export function setChartLayoutDebugBypasses(nextBypasses = {}) {
  Object.entries(nextBypasses).forEach(([name, value]) => {
    if (!LAYOUT_PIPELINE_STEP_NAMES.includes(name as LayoutPipelineStepName)) return;
    layoutDebugRuntimeBypasses[name] = Boolean(value);
  });
  return getChartLayoutDebugBypasses();
}

export function clearChartLayoutDebugBypasses() {
  Object.keys(layoutDebugRuntimeBypasses).forEach((name) => {
    delete layoutDebugRuntimeBypasses[name];
  });
  return getChartLayoutDebugBypasses();
}

/**
 * @param {string} stepName
 * @returns {boolean}
 */
function isLayoutPipelineStepBypassed(stepName) {
  return Boolean(getChartLayoutDebugBypasses()[stepName]);
}

/**
 * @param {string} stepName
 * @param {() => void | number} callback
 * @returns {void | number}
 */
function runLayoutPipelineStep(stepName, callback) {
  if (isLayoutPipelineStepBypassed(stepName)) return undefined;
  lastLayoutPipelineStepsRun.push(stepName);
  return callback();
}

/**
 * @param {{ bars?: any[], layout?: any }} viewModel
 * @param {(string | null)[]} barTimeSigDisplay
 * @param {number} defaultSlotsPerRow
 * @returns {Array<{ bars: any[], firstBar: any, previousBar: any, rowTimeSignature: string | null, leadingEmptySlots: number, totalSlots: number, usesRhythmicGrid: boolean }>}
 */
function buildRenderedRows(viewModel, barTimeSigDisplay, defaultSlotsPerRow) {
  const bars = Array.isArray(viewModel?.bars) ? viewModel.bars : [];
  const layoutRows = Array.isArray(viewModel?.layout?.systems?.rows) ? viewModel.layout.systems.rows : [];
  const cellsPerRow = Number(viewModel?.layout?.systems?.cellsPerRow || 0);
  const inferredSlotsPerRow = Number.isFinite(cellsPerRow) && cellsPerRow > 0
    ? Math.max(1, Math.round(cellsPerRow / 4))
    : defaultSlotsPerRow;

  if (layoutRows.length > 0) {
    const barsById = new Map(bars.map((bar) => [bar.id, bar]));
    const barsByIndex = new Map(bars.map((bar) => [bar.index, bar]));

    return layoutRows.map((row) => {
      const rowBars = (Array.isArray(row?.barIds) ? row.barIds.map((barId) => barsById.get(barId)) : [])
        .filter(Boolean);
      const fallbackBars = rowBars.length === 0 && Array.isArray(row?.barIndices)
        ? row.barIndices.map((barIndex) => barsByIndex.get(Number(barIndex))).filter(Boolean)
        : [];
      const resolvedBars = rowBars.length > 0 ? rowBars : fallbackBars;
      const firstBar = resolvedBars[0] || null;
      const rowStartIndex = firstBar ? bars.findIndex((bar) => bar.id === firstBar.id) : -1;

      return {
        bars: resolvedBars,
        firstBar,
        previousBar: rowStartIndex > 0 ? bars[rowStartIndex - 1] : null,
        rowTimeSignature: rowStartIndex >= 0 ? (barTimeSigDisplay[rowStartIndex] || null) : null,
        leadingEmptySlots: Math.max(0, Number(row?.leadingEmptyCells || row?.leadingEmptyBars || 0)),
        totalSlots: Math.max(1, Number(row?.totalCells || row?.cellsPerRow || cellsPerRow || inferredSlotsPerRow)),
        usesRhythmicGrid: true
      };
    }).filter((row) => row.firstBar);
  }

  const rows = [];
  for (let index = 0; index < bars.length; index += defaultSlotsPerRow) {
    const rowBars = bars.slice(index, index + defaultSlotsPerRow);
    const firstBar = rowBars[0] || null;
    if (!firstBar) continue;
    rows.push({
      bars: rowBars,
      firstBar,
      previousBar: index > 0 ? bars[index - 1] : null,
      rowTimeSignature: barTimeSigDisplay[index] || null,
      leadingEmptySlots: 0,
      totalSlots: defaultSlotsPerRow,
      usesRhythmicGrid: false
    });
  }
  return rows;
}

/**
 * @param {any} token
 * @returns {{ visualWeight: number, estimatedWidth: number, symbolLength: number }}
 */
function getTokenVisualMetrics(token) {
  if (!token || typeof token !== 'object') {
    return {
      visualWeight: 0,
      estimatedWidth: 0,
      symbolLength: 0
    };
  }

  const symbol = String(token.symbol || '').replace(/\s+/g, '');
  const prefixWeight = token.displayPrefix ? CHART_TOKEN_METRICS_CONFIG.displayPrefixWeight : 0;
  const accidentalCount = (symbol.match(/[b#]/g) || []).length;
  const slashCount = (symbol.match(/\//g) || []).length;
  const parentheticalCount = (symbol.match(/[()]/g) || []).length;
  const extensionCount = (symbol.match(/\d+/g) || []).length;
  const longQualityCount = (symbol.match(/maj|sus|dim|alt|aug|add/gi) || []).length;

  const visualWeight = symbol.length
    + prefixWeight
    + (accidentalCount * CHART_TOKEN_METRICS_CONFIG.accidentalWeight)
    + (slashCount * CHART_TOKEN_METRICS_CONFIG.slashWeight)
    + (parentheticalCount * CHART_TOKEN_METRICS_CONFIG.parentheticalWeight)
    + (extensionCount * CHART_TOKEN_METRICS_CONFIG.extensionWeight)
    + (longQualityCount * CHART_TOKEN_METRICS_CONFIG.longQualityWeight);

  return {
    visualWeight,
    estimatedWidth: 0.46 + (visualWeight * 0.18),
    symbolLength: symbol.length
  };
}

/**
 * @param {{ symbolLength: number, visualWeight: number } | null | undefined} tokenMetrics
 * @returns {number}
 */
function getTokenScaleForSubdividedLayout(tokenMetrics) {
  if (!tokenMetrics || tokenMetrics.symbolLength <= CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG.shortSymbolMaxLength) return 1;
  if (tokenMetrics.visualWeight >= CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG.heavyWeightThreshold) return CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG.heavyScale;
  if (tokenMetrics.visualWeight >= CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG.mediumWeightThreshold) return CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG.mediumScale;
  if (tokenMetrics.visualWeight >= CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG.lightWeightThreshold) return CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG.lightScale;
  return CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG.defaultLongScale;
}

/**
 * @param {string} kind
 * @returns {boolean}
 */
function isRepeatTokenKind(kind) {
  return kind === 'repeat_previous_bar' || kind === 'repeat_previous_two_bars';
}

/**
 * @param {string} kind
 * @returns {boolean}
 */
function isSlashMarkerTokenKind(kind) {
  return kind === 'slash_marker';
}

/**
 * @param {string} kind
 * @returns {boolean}
 */
function isAlternateChordTokenKind(kind) {
  return kind === 'alternate_chord';
}

/**
 * @param {any} token
 * @returns {string}
 */
function renderRepeatTokenMarkup(token) {
  const isTwoBarRepeat = token?.kind === 'repeat_previous_two_bars';
  const label = isTwoBarRepeat ? 'Repeat previous two bars' : 'Repeat previous bar';
  const entity = isTwoBarRepeat ? '&#x1D10F;' : '&#x1D10E;';

  return `
    <span class="chart-repeat-sign" aria-label="${label}">
      ${entity}
    </span>
  `;
}

/**
 * @returns {string}
 */
function renderSlashMarkerMarkup() {
  return `
    <svg class="chart-slash-marker" viewBox="0 0 24 32" aria-label="Slash" role="img">
      <path d="M16.7 3.2C17.7 3.7 18.1 4.9 17.6 5.9L8.8 28.8C8.4 29.8 7.2 30.3 6.2 29.8C5.2 29.4 4.8 28.2 5.3 27.2L14.1 4.3C14.5 3.3 15.7 2.8 16.7 3.2Z" />
    </svg>
  `;
}

/**
 * @param {any} token
 * @param {{ start?: number, end?: number }} placement
 * @param {string} harmonyDisplayMode
 * @param {(token: any, harmonyDisplayMode: string) => string} renderChordMarkup
 * @returns {string}
 */
function renderToken(token, placement, harmonyDisplayMode, renderChordMarkup) {
  const tokenClass = isRepeatTokenKind(token?.kind)
    ? 'repeat'
    : isSlashMarkerTokenKind(token?.kind)
      ? 'slash-marker'
      : isAlternateChordTokenKind(token?.kind)
        ? 'alternate-chord'
        : 'chord';
  const slotStart = Math.max(1, Number(placement?.start || 1));
  const slotEnd = Math.max(slotStart + 1, Number(placement?.end || (slotStart + 1)));
  const slotStyle = tokenClass === 'repeat'
    ? 'grid-column: 1 / -1;'
    : `grid-column: ${slotStart} / ${slotEnd};`;
  const tokenMarkup = tokenClass === 'repeat'
    ? renderRepeatTokenMarkup(token)
    : tokenClass === 'slash-marker'
      ? renderSlashMarkerMarkup()
      : renderChordMarkup(token, harmonyDisplayMode);
  const alternateMarkup = token?.alternate?.symbol
    ? `<span class="chart-token-alternate">${renderChordMarkup(token.alternate, harmonyDisplayMode)}</span>`
    : '';
  const slotClass = tokenClass === 'repeat' ? 'chart-token-slot repeat-slot' : 'chart-token-slot';
  const sourceCellIndex = Number.isInteger(token?.sourceCellIndex) ? ` data-source-cell-index="${Number(token.sourceCellIndex)}"` : '';
  const sourceCellCount = Number.isInteger(token?.sourceCellCount) ? ` data-source-cell-count="${Number(token.sourceCellCount)}"` : '';

  return `
    <span class="${slotClass}" style="${slotStyle}"${sourceCellIndex}${sourceCellCount}>
      <span class="chart-token ${tokenClass}">${alternateMarkup}${tokenMarkup}</span>
    </span>
  `;
}

/**
 * @param {Array<number | string>} [endings]
 * @returns {string}
 */
function renderEndingMarkup(endings = []) {
  if (!Array.isArray(endings) || endings.length === 0) return '';
  return `
    <div class="chart-ending-stack">
      ${endings.map((ending) => `<span class="chart-ending chart-ending-${ending}"><span class="chart-ending-label">${ending}.</span></span>`).join('')}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTextAnnotations(textAnnotations = []) {
  if (!Array.isArray(textAnnotations) || textAnnotations.length === 0) return '';
  return textAnnotations.map((annotation) => {
    const sourceCellCount = Math.max(1, Number(annotation?.sourceCellCount || 4));
    const sourceCellIndex = Math.max(0, Math.min(sourceCellCount - 1, Number(annotation?.sourceCellIndex || 0)));
    const leftPercent = (sourceCellIndex / sourceCellCount) * 100;
    const vertical = annotation?.vertical === 'above' ? 'above' : 'below';
    const yOffset = Number.isFinite(Number(annotation?.yOffset)) ? ` data-y-offset="${Number(annotation.yOffset)}"` : '';
    const offsetCode = annotation?.offsetCode ? ` data-offset-code="${escapeHtml(annotation.offsetCode)}"` : '';

    return `<span class="chart-bar-text-annotation is-${vertical}" style="--chart-text-annotation-left: ${leftPercent.toFixed(3)}%;"${yOffset}${offsetCode}>${escapeHtml(annotation.text)}</span>`;
  }).join('');
}

function renderCodaMarker() {
  return `
    <svg class="chart-bar-corner-marker-svg chart-bar-coda-svg" viewBox="-3 0 767 844" aria-label="Coda" role="img">
      <path transform="translate(0 718) scale(1 -1)" d="M-3 301c0 10 3 19 14 19h106c9 151 120 271 249 282v103c0 10 9 13 20 13c10 0 19 -3 19 -13v-103c129 -11 241 -132 249 -282h96c11 0 14 -9 14 -19c0 -11 -3 -19 -14 -19h-96c-8 -150 -120 -272 -249 -282v-112c0 -11 -9 -14 -19 -14c-11 0 -20 3 -20 14v112c-129 10 -240 132 -249 282h-106c-11 0 -14 8 -14 19zM522 320c0 130 -5 227 -117 237v-237h117zM405 282v-244c100 12 115 121 117 244h-117zM253 320h113v237c-113 -10 -113 -107 -113 -237zM366 282h-113c1 -124 10 -232 113 -244v244z" />
    </svg>
  `;
}

function renderSegnoMarker() {
  return `
    <svg class="chart-bar-corner-marker-svg chart-bar-segno-svg" viewBox="0 0 448 836" aria-label="Segno" role="img">
      <path transform="translate(0 607) scale(1 -1)" d="M16 382c-9 20 -13 40 -13 59c0 79 63 148 119 148c61 0 114 -21 114 -88c0 -35 -22 -54 -55 -54c-41 0 -53 47 -59 69l-1 6c-3 8 -8 10 -13 10h-5c-33 -6 -43 -28 -43 -50c0 -16 6 -33 11 -42c21 -36 142 -82 149 -85c3 -1 6 -2 8 -2c3 0 5 2 7 6c5 7 132 237 132 237c4 7 12 11 20 11c3 0 7 -1 11 -2c7 -4 12 -12 12 -20c0 -4 -1 -7 -4 -11c0 0 -124 -224 -128 -230c0 -2 -1 -3 -1 -5c0 -4 4 -7 13 -13c10 -4 136 -76 148 -164c1 -8 2 -16 2 -23c0 -75 -64 -145 -140 -145c-54 0 -90 46 -96 80c-1 4 -1 8 -1 11c0 32 27 45 57 52c3 1 6 1 10 1c22 0 42 -22 42 -52v-9c0 -25 14 -36 29 -36c1 0 4 1 5 1c26 4 45 24 45 56c0 76 -160 123 -172 125c-3 0 -9 -5 -9 -4c-3 -5 -127 -229 -127 -229c-4 -7 -12 -12 -20 -12c-4 0 -7 1 -11 4c-7 4 -11 12 -11 20c0 3 1 7 2 10c0 0 115 207 121 218c3 6 5 10 5 13s-2 5 -5 7c-6 2 -122 73 -148 132zM378 327c-25 0 -46 21 -46 46s21 45 46 45s45 -20 45 -45s-20 -46 -45 -46zM66 166c-24 0 -45 20 -45 45s21 46 45 46c26 0 46 -21 46 -46s-20 -45 -46 -45z" />
    </svg>
  `;
}

function renderFermataMarker() {
  return `
    <svg class="chart-bar-fermata-svg" viewBox="0 0 486 265" aria-label="Fermata" role="img">
      <path transform="translate(0 663) scale(1 -1)" d="M242 577c-165 0 -201 -123 -211 -155c-1 -4 -1 -7 -2 -8c-5 -11 -9 -16 -16 -16s-11 2 -11 10c0 2 0 6 1 9c49 245 215 246 240 246c23 0 191 -1 240 -246c1 -3 1 -6 1 -8c0 -8 -4 -11 -11 -11c-8 0 -11 5 -17 16c-1 1 -1 4 -2 6c-8 30 -42 157 -212 157zM286 442c0 -24 -20 -44 -44 -44c-23 0 -43 20 -43 44c0 23 20 43 43 43c24 0 44 -20 44 -43z" />
    </svg>
  `;
}

function renderRepeatDotsMarker() {
  return `
    <svg class="chart-repeat-dots-svg" viewBox="0 0 2 8" focusable="false" aria-hidden="true">
      <circle cx="1" cy="1" r="1" />
      <circle cx="1" cy="7" r="1" />
    </svg>
  `;
}

function getBarAnnotationCellIndex(bar, annotation) {
  const cellSlots = Array.isArray(bar?.playback?.cellSlots) ? bar.playback.cellSlots : [];
  return cellSlots.findIndex((cellSlot) => Array.isArray(cellSlot?.annots) && cellSlot.annots.includes(annotation));
}

function getBarAnnotationPosition(bar, annotation) {
  const cellSlots = Array.isArray(bar?.playback?.cellSlots) ? bar.playback.cellSlots : [];
  const markerIndex = getBarAnnotationCellIndex(bar, annotation);
  if (markerIndex < 0) return 'start';
  const markerCell = cellSlots[markerIndex] || {};
  const markerBars = String(markerCell.bars || '');
  if (/[\)\]\}Z]/.test(markerBars)) return 'end';
  return markerIndex >= Math.max(1, cellSlots.length - 1) ? 'end' : 'start';
}

function renderFermataForBar(bar) {
  if (!bar.flags.includes('fermata')) return '';
  const cellSlots = Array.isArray(bar?.playback?.cellSlots) ? bar.playback.cellSlots : [];
  const cellCount = Math.max(1, cellSlots.length || 4);
  const cellIndex = getBarAnnotationCellIndex(bar, 'f');
  const markerIndex = cellIndex >= 0 ? cellIndex : 0;
  const leftPercent = ((markerIndex + 0.5) / cellCount) * 100;

  return `
    <span class="chart-bar-fermata-marker" data-fermata-cell-index="${markerIndex}" style="--chart-fermata-left: ${leftPercent.toFixed(3)}%;">
      ${renderFermataMarker()}
    </span>
  `;
}

/**
 * @param {{ flags: string[] }} bar
 * @returns {string}
 */
function renderBarCornerMarkers(bar) {
  const markers = [];
  if (bar.flags.includes('coda')) {
    const position = getBarAnnotationPosition(bar, 'Q');
    markers.push(`<span class="chart-bar-corner-marker chart-bar-coda-marker is-${position}" aria-label="Coda">${renderCodaMarker()}</span>`);
  }
  if (bar.flags.includes('segno')) {
    markers.push(`<span class="chart-bar-corner-marker chart-bar-segno-marker" aria-label="Segno">${renderSegnoMarker()}</span>`);
  }
  if (markers.length === 0) return '';
  return markers.join('');
}

/**
 * @param {number | string} value
 * @returns {string}
 */
function formatOrdinal(value) {
  const number = Number(value || 0);
  if (number === 1) return '1st';
  if (number === 2) return '2nd';
  if (number === 3) return '3rd';
  return `${number}th`;
}

/**
 * @param {any} directive
 * @returns {string}
 */
function formatDirectiveLabel(directive) {
  if (!directive?.type) return '';

  switch (directive.type) {
    case 'dc_al_fine':
      return 'D.C. al Fine';
    case 'dc_al_coda':
      return 'D.C. al Coda';
    case 'dc_al_ending':
      return `D.C. al ${formatOrdinal(directive.ending || 2)} ending`;
    case 'ds_al_fine':
      return 'D.S. al Fine';
    case 'ds_al_coda':
      return 'D.S. al Coda';
    case 'ds_al_ending':
      return `D.S. al ${formatOrdinal(directive.ending || 2)} ending`;
    case 'dc_on_cue':
      return 'D.C. on cue';
    case 'open_vamp':
      return 'Open vamp';
    case 'open_instruction':
      return directive.text || 'Open';
    case 'vamp_instruction':
      return directive.text || 'Vamp';
    case 'fade_out':
      return directive.text || 'Fade out';
    case 'repeat_hint':
      return `Repeat x${directive.times || 2}`;
    case 'fine':
      return directive.qualifier ? `Fine (${directive.qualifier})` : 'Fine';
    default:
      return directive.type;
  }
}

/**
 * @param {{ flags: string[], directives?: any[], comments?: string[] }} bar
 * @returns {Array<{ text: string, kind: 'text' }>}
 */
function getBarFootPills(bar) {
  const pills = [];
  const directives = Array.isArray(bar.directives) ? bar.directives : [];
  const directiveTypes = directives.map((directive) => directive?.type).filter(Boolean);
  const hasDirectiveType = (...types) => directiveTypes.some((type) => types.includes(type));
  const hasFineDirective = hasDirectiveType('fine', 'dc_al_fine', 'ds_al_fine');
  const hasDcDirective = hasDirectiveType('dc_al_fine', 'dc_al_coda', 'dc_al_ending', 'dc_on_cue');
  const hasDsDirective = hasDirectiveType('ds_al_fine', 'ds_al_coda', 'ds_al_ending');

  if (bar.flags.includes('fine') && !hasFineDirective) pills.push({ text: 'Fine', kind: 'text' });
  if (bar.flags.includes('dc') && !hasDcDirective) pills.push({ text: 'D.C.', kind: 'text' });
  if (bar.flags.includes('ds') && !hasDsDirective) pills.push({ text: 'D.S.', kind: 'text' });
  if (bar.flags.includes('fermata')) pills.push({ text: 'Fermata', kind: 'text' });
  if (directives.length) {
    pills.push(...directives
      .map((directive) => ({ text: formatDirectiveLabel(directive), kind: 'text' }))
      .filter((pill) => Boolean(pill.text)));
  }
  if (bar.comments?.length && !bar.textAnnotations?.length) {
    pills.push(...bar.comments.map((text) => ({ text, kind: 'text' })));
  }
  return pills;
}

/**
 * @param {any} bar
 * @param {number} tokenCount
 * @returns {{ logicalSlots: number, placements: Array<{ start: number, end: number }> } | null}
 */
function getCellSlotPlacements(bar, tokenCount) {
  const tokens = Array.isArray(bar?.displayTokens) ? bar.displayTokens : [];
  const sourceCellCount = Number(tokens.find(token => Number.isInteger(token?.sourceCellCount))?.sourceCellCount || 0);
  const sourceCellPlacements = tokens.map((token) => Number.isInteger(token?.sourceCellIndex)
    ? Number(token.sourceCellIndex)
    : null);

  if (
    sourceCellCount > 0
    && sourceCellPlacements.length === tokenCount
    && tokens.every((token, index) => {
      const slotIndex = sourceCellPlacements[index];
      return isRepeatTokenKind(token?.kind)
        || (Number.isInteger(slotIndex) && Number(slotIndex) >= 0 && Number(slotIndex) < sourceCellCount);
    })
  ) {
    return {
      logicalSlots: sourceCellCount,
      placements: sourceCellPlacements.map((slotIndex, index) => isRepeatTokenKind(tokens[index]?.kind)
        ? { start: 1, end: sourceCellCount + 1 }
        : {
            start: Number(slotIndex) + 1,
            end: Number(slotIndex) + 2
          })
    };
  }

  const cellSlots = Array.isArray(bar?.playback?.cellSlots) ? bar.playback.cellSlots : [];
  if (cellSlots.length === 0) return null;

  const chordSlotIndexes = cellSlots
    .map((cellSlot, index) => (cellSlot?.chord ? index : -1))
    .filter((index) => index >= 0);

  if (chordSlotIndexes.length === 0) return null;
  if (chordSlotIndexes.length !== tokenCount) return null;

  const candidateLogicalSlots = [2, 4, cellSlots.length]
    .filter((candidate, index, list) => Number.isInteger(candidate)
      && candidate > 0
      && cellSlots.length % candidate === 0
      && list.indexOf(candidate) === index)
    .sort((left, right) => left - right);

  const logicalSlots = candidateLogicalSlots.find((candidate) =>
    chordSlotIndexes.every((slotIndex) => Number.isInteger((slotIndex * candidate) / cellSlots.length))
  ) || cellSlots.length;

  return {
    logicalSlots,
    placements: chordSlotIndexes.map((slotIndex) => {
      const startIndex = ((slotIndex * logicalSlots) / cellSlots.length) + 1;
      return {
        start: startIndex,
        end: Math.min(logicalSlots + 1, startIndex + 1)
      };
    })
  };
}

/**
 * @param {any} bar
 * @param {string} [fallbackTimeSignature]
 * @returns {{ className: string, style: string, parts: number, placements: Array<{ start: number, end: number }> }}
 */
function getBarBodyLayout(bar, fallbackTimeSignature = '') {
  const tokens = Array.isArray(bar?.displayTokens) ? bar.displayTokens : [];
  const tokenCount = tokens.length;
  const cellSlotLayout = getCellSlotPlacements(bar, tokenCount);
  const useHalfLayout = tokenCount <= 2 && (!cellSlotLayout || cellSlotLayout.logicalSlots <= 2);
  let logicalSlots = cellSlotLayout?.logicalSlots || 2;
  if (!cellSlotLayout) {
    if (tokenCount > 2) logicalSlots = 4;
    if (tokenCount > 4) logicalSlots = 8;
  }
  const parts = useHalfLayout ? 2 : logicalSlots;

  const tokenMetrics = tokens.map(getTokenVisualMetrics);
  const weight = tokenMetrics.reduce((total, tokenMetric) => total + tokenMetric.visualWeight, 0);
  const maxTokenWeight = tokenMetrics.reduce((max, tokenMetric) => Math.max(max, tokenMetric.visualWeight), 0);
  const hasVeryLongSymbol = maxTokenWeight >= CHART_DENSITY_CONFIG.denseChordThreshold;
  const hasExtremelyLongSymbol = maxTokenWeight >= CHART_DENSITY_CONFIG.veryDenseChordThreshold;

  const classes = ['chart-bar-body'];
  if (useHalfLayout) {
    classes.push('chart-bar-body-halves');
  } else {
    classes.push('chart-bar-body-subdivided');
  }

  const shouldReduceForDensity =
    tokenCount > 2
    || (!useHalfLayout && hasVeryLongSymbol);
  const shouldReduceAggressively =
    tokenCount > logicalSlots
    || (tokenCount >= logicalSlots && weight >= CHART_DENSITY_CONFIG.aggressiveDensityThreshold)
    || (!useHalfLayout && hasExtremelyLongSymbol && weight >= CHART_DENSITY_CONFIG.aggressiveExtremeDensityThreshold);

  if (shouldReduceForDensity) {
    classes.push('is-dense');
  }
  if (shouldReduceAggressively) {
    classes.push('is-very-dense');
  }
  const style = `--chart-bar-parts: ${parts}; --chart-bar-guide-count: ${useHalfLayout ? 1 : Math.max(0, parts - 1)};`;
  const placements = useHalfLayout
    ? tokens.map((_, index) => ({
        start: index + 1,
        end: index + 2
      }))
    : (cellSlotLayout?.placements || tokens.map((_, index) => {
        const start = Math.round((index * logicalSlots) / Math.max(tokenCount, 1)) + 1;
        return {
          start,
          end: Math.min(parts + 1, start + 1)
        };
      }));

  return {
    className: classes.join(' '),
    style,
    parts,
    placements
  };
}

function getBarRhythmicSlotCount(bar, fallback = 1) {
  const cellSlots = Array.isArray(bar?.playback?.cellSlots) ? bar.playback.cellSlots : [];
  if (cellSlots.length > 0) return Math.max(1, cellSlots.length);

  const displayTokens = Array.isArray(bar?.displayTokens) ? bar.displayTokens : [];
  const sourceCellCount = Number(displayTokens.find(token => Number.isInteger(token?.sourceCellCount))?.sourceCellCount || 0);
  return Math.max(1, Number.isFinite(sourceCellCount) && sourceCellCount > 0 ? sourceCellCount : fallback);
}

function isGraphicSpacerBar(bar) {
  const hasDisplayTokens = Array.isArray(bar?.displayTokens) && bar.displayTokens.length > 0;
  const hasPlaybackSlots = Array.isArray(bar?.playbackSlots) && bar.playbackSlots.length > 0;
  const hasPlaybackObjectSlots = Array.isArray(bar?.playback?.slots) && bar.playback.slots.length > 0;
  return !hasDisplayTokens
    && !hasPlaybackSlots
    && !hasPlaybackObjectSlots
    && getBarRhythmicSlotCount(bar, 0) > 0;
}

/**
 * @param {number} [slotSpan]
 * @returns {string}
 */
function renderEmptyBarCell(slotSpan = 1) {
  return `<article class="chart-bar-cell is-empty" style="grid-column: span ${Math.max(1, Number(slotSpan || 1))};" aria-hidden="true"><span class="chart-bar-cell-highlight"></span></article>`;
}

/**
 * @param {string} timeSig
 * @returns {string}
 */
function renderBarTimeSignature(timeSig) {
  const value = String(timeSig || '').trim();
  if (!/^\d+\s*\/\s*\d+$/.test(value)) return '';
  return `<div class="chart-row-time-sig" aria-label="${value}">${value.replace(/\s+/g, '')}</div>`;
}

/**
 * @param {Element} mainTokenEl
 * @returns {{ left: number, top: number, right: number, bottom: number, width: number, height: number } | null}
 */
function getVisualSymbolRect(mainTokenEl) {
  const selectors = [
    '.chord-symbol-main',
    '.chord-symbol-main *',
    '.chord-symbol-sup',
    '.chord-symbol-sup *',
    '.chord-symbol-slash-stack',
    '.chord-symbol-slash-stack *'
  ];
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const selector of selectors) {
    const elements = Array.from(mainTokenEl.querySelectorAll(selector)) as Element[];
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }
  }
  const padding = Math.max(0, Number(CHART_DISPLACEMENT_CONFIG.symbolVisualPaddingPx || 0));
  left -= padding;
  top -= padding;
  right += padding;
  bottom += padding;

  return Number.isFinite(left) && Number.isFinite(top)
    ? {
        left,
        top,
        right,
        bottom,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top)
      }
    : null;
}

/**
 * @param {Element} slotEl
 * @returns {{ slotEl: Element, tokenEl: Element | null, slotRect: DOMRect, tokenRect: DOMRect | null, symbolRect: { left: number, top: number, right: number, bottom: number, width?: number, height?: number } | null, mainRect: DOMRect | null, anchorX: number, beatTargetX: number }}
 */
function measureTokenGeometry(slotEl) {
  const tokenEl = /** @type {HTMLElement | null} */ (slotEl.querySelector('.chart-token'));
  const mainChordEl = tokenEl
    ? (Array.from(tokenEl.children) as HTMLElement[]).find((element) =>
        !element.classList.contains('chart-token-alternate')
      ) || null
    : null;
  const mainEl = mainChordEl
    ? /** @type {HTMLElement | null} */ (mainChordEl.querySelector('.chord-symbol-main'))
    : null;

  const slotRect = slotEl.getBoundingClientRect();
  const tokenRect = tokenEl ? tokenEl.getBoundingClientRect() : null;
  const symbolRect = mainChordEl
    ? getVisualSymbolRect(mainChordEl)
    : (tokenRect && tokenRect.width > 0 ? {
        left: tokenRect.left,
        top: tokenRect.top,
        right: tokenRect.right,
        bottom: tokenRect.bottom,
        width: tokenRect.width,
        height: tokenRect.height
      } : null);
  const mainRect = mainEl ? mainEl.getBoundingClientRect() : null;

  const anchorX = mainRect
    ? mainRect.left + (mainRect.width / 2)
    : slotRect.left + (slotRect.width / 2);
  const beatTargetX = slotRect.left + (slotRect.width / 2);

  return { slotEl, tokenEl, slotRect, tokenRect, symbolRect, mainRect, anchorX, beatTargetX };
}

/**
 * @param {ReturnType<typeof measureTokenGeometry>} geometry
 * @param {number} scale
 * @returns {{ left: number, right: number, anchorX: number }}
 */
function getScaledCollisionGeometry(geometry, scale) {
  const symbolRect = geometry.symbolRect || geometry.slotRect;
  const originX = geometry.tokenRect
    ? geometry.tokenRect.left
    : symbolRect.left;
  const left = originX + ((symbolRect.left - originX) * scale);
  const right = originX + ((symbolRect.right - originX) * scale);
  const anchorX = originX + ((geometry.anchorX - originX) * scale);

  return { left, right, anchorX };
}

/**
 * @param {ReturnType<typeof measureTokenGeometry>[]} geometries
 * @param {DOMRect} barRect
 * @param {number} maxOffsetPx
 * @param {number} scale
 * @param {number} minGap
 * @returns {number}
 */
function getSolvedMaxOverlapAtScale(geometries, barRect, maxOffsetPx, scale, minGap) {
  if (geometries.length < 2) return 0;

  const scaledGeometries = geometries.map((geometry) => getScaledCollisionGeometry(geometry, scale));
  const rawLefts = scaledGeometries.map((geometry) => geometry.left);
  const rawRights = scaledGeometries.map((geometry) => geometry.right);
  const targetOffsets = scaledGeometries.map((geometry, index) =>
    geometries[index].beatTargetX - geometry.anchorX
  );
  const hardMinOffsets = rawLefts.map(() => -maxOffsetPx);
  const hardMaxOffsets = rawRights.map(() => maxOffsetPx);
  const boundaryMinOffsets = rawLefts.map((left) => barRect.left - left);
  const boundaryMaxOffsets = rawRights.map((right) => barRect.right - right);
  const solvedOffsets = solveGlobalTokenOffsets(
    rawLefts,
    rawRights,
    targetOffsets,
    hardMinOffsets,
    hardMaxOffsets,
    boundaryMinOffsets,
    boundaryMaxOffsets,
    minGap
  );

  let maxOverlap = 0;
  for (let index = 0; index < rawLefts.length - 1; index += 1) {
    const right = rawRights[index] + solvedOffsets[index];
    const nextLeft = rawLefts[index + 1] + solvedOffsets[index + 1];
    maxOverlap = Math.max(maxOverlap, right - nextLeft + minGap);
  }

  return Math.max(0, maxOverlap);
}

/**
 * @param {HTMLElement} barBodyEl
 * @param {number} minScale
 * @returns {number}
 */
function getBarBodyCollisionScale(barBodyEl, minScale: number = CHART_COMPRESSION_CONFIG.minScale) {
  const slots: HTMLElement[] = Array.from(barBodyEl.querySelectorAll('.chart-token-slot')) as HTMLElement[];
  if (slots.length === 0) return 1;

  const barRect = barBodyEl.getBoundingClientRect();
  const availableWidth = Math.max(1, barRect.width - CHART_DISPLACEMENT_CONFIG.barBodyHorizontalInsetPx);
  const geometries = slots.map((slot) => measureTokenGeometry(slot));
  const symbolLefts = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.left : geometry.slotRect.left));
  const symbolRights = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.right : geometry.slotRect.right));

  const occupiedLeft = Math.min(...symbolLefts);
  const occupiedRight = Math.max(...symbolRights);
  const occupiedWidth = Math.max(0, occupiedRight - occupiedLeft);
  const spanScale = occupiedWidth > availableWidth * CHART_COMPRESSION_CONFIG.triggerFillRatio
    ? (availableWidth * CHART_COMPRESSION_CONFIG.triggerFillRatio) / occupiedWidth
    : 1;

  const maxOffsetPx = getMaxOffsetPx(barBodyEl);
  const overlapTolerancePx = 0.25;
  const compressionMinGap = CHART_DISPLACEMENT_CONFIG.antiCollisionGapPx
    + Math.max(0, CHART_COMPRESSION_CONFIG.antiCollisionPaddingPx || 0);
  const upperScale = clampNumber(Math.min(1, spanScale), minScale, 1);
  if (getSolvedMaxOverlapAtScale(geometries, barRect, maxOffsetPx, upperScale, compressionMinGap) <= overlapTolerancePx) {
    return upperScale;
  }

  if (getSolvedMaxOverlapAtScale(geometries, barRect, maxOffsetPx, minScale, compressionMinGap) > overlapTolerancePx) {
    return minScale;
  }

  let low = minScale;
  let high = upperScale;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const middle = (low + high) / 2;
    if (getSolvedMaxOverlapAtScale(geometries, barRect, maxOffsetPx, middle, compressionMinGap) <= overlapTolerancePx) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return clampNumber(low, minScale, 1);
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function parseFiniteNumber(value) {
  const number = Number.parseFloat(String(value || '0'));
  return Number.isFinite(number) ? number : 0;
}

/**
 * @param {{ width?: number, height?: number }} rect
 * @returns {boolean}
 */
function hasVisibleRect(rect) {
  return Number(rect.width) > 0 && Number(rect.height) > 0;
}

/**
 * @param {Element} element
 * @param {string} pseudoElement
 * @param {string} propertyName
 * @returns {number}
 */
function getPseudoPx(element, pseudoElement, propertyName) {
  return parseFiniteNumber(getComputedStyle(element, pseudoElement).getPropertyValue(propertyName));
}

/**
 * @param {HTMLElement} sheetGrid
 * @returns {number}
 */
function getSheetGridVisualBottomBound(sheetGrid) {
  const gridRect = sheetGrid.getBoundingClientRect();
  const gridStyle = getComputedStyle(sheetGrid);
  const gridContentBottom = gridRect.bottom - parseFiniteNumber(gridStyle.paddingBottom);
  const workspace = sheetGrid.closest('.chart-workspace');
  if (!workspace) return gridContentBottom;

  const workspaceRect = workspace.getBoundingClientRect();
  const workspaceStyle = getComputedStyle(workspace);
  const workspaceContentBottom = workspaceRect.bottom - parseFiniteNumber(workspaceStyle.paddingBottom);
  return Math.min(gridContentBottom, workspaceContentBottom);
}

/**
 * @param {Element} referenceEl
 * @returns {number}
 */
function getMaxOffsetPx(referenceEl) {
  const fontSizePx = parseFloat(getComputedStyle(referenceEl).fontSize);
  const maxOffsetEm = Math.max(0, Number(CHART_DISPLACEMENT_CONFIG.maxOffsetEm || 0));
  return (Number.isFinite(fontSizePx) && fontSizePx > 0 ? fontSizePx : 16) * maxOffsetEm;
}

/**
 * @param {HTMLElement} barBodyEl
 * @returns {{ left: number, right: number }}
 */
function getBarBodyMeasureBounds(barBodyEl) {
  const cellEl = barBodyEl.closest('.chart-bar-cell') as HTMLElement | null;
  const fallbackRect = barBodyEl.getBoundingClientRect();
  if (!cellEl) return { left: fallbackRect.left, right: fallbackRect.right };

  const cellRect = cellEl.getBoundingClientRect();
  const rightLineWidth = getPseudoPx(cellEl, '::before', 'width');
  const leftLineWidth = (cellEl.classList.contains('is-row-start') || cellEl.classList.contains('is-repeat-start'))
    ? getPseudoPx(cellEl, '::after', 'width')
    : 0;
  const repeatDotsWidth = cellEl.classList.contains('is-repeat-end') ? 4 : 0;
  const finalBarWidth = cellEl.classList.contains('is-final')
    ? getPseudoPx(cellEl, '::after', 'width')
    : 0;
  const boundaryInset = Math.max(0, Number(CHART_DISPLACEMENT_CONFIG.symbolBoundaryInsetPx || 0));

  return {
    left: cellRect.left + leftLineWidth + boundaryInset,
    right: cellRect.right - Math.max(rightLineWidth, repeatDotsWidth, finalBarWidth) - boundaryInset
  };
}

/**
 * @param {HTMLElement} barBodyEl
 * @returns {{ left: number, top: number, right: number, bottom: number, width: number, height: number }}
 */
function getBarBodyMeasureRect(barBodyEl) {
  const bounds = getBarBodyMeasureBounds(barBodyEl);
  const bodyRect = barBodyEl.getBoundingClientRect();
  return {
    left: bounds.left,
    top: bodyRect.top,
    right: bounds.right,
    bottom: bodyRect.bottom,
    width: Math.max(0, bounds.right - bounds.left),
    height: bodyRect.height
  };
}

/**
 * @param {{ left: number, top: number, right: number, bottom: number, width?: number, height?: number }} rect
 * @returns {ChartLayoutDebugRect}
 */
function toDebugRect(rect) {
  const left = Number(rect.left || 0);
  const top = Number(rect.top || 0);
  const right = Number(rect.right || 0);
  const bottom = Number(rect.bottom || 0);
  return {
    left,
    top,
    right,
    bottom,
    width: Number(rect.width ?? Math.max(0, right - left)),
    height: Number(rect.height ?? Math.max(0, bottom - top))
  };
}

/**
 * @param {Element | null} element
 * @param {string} propertyName
 * @param {number} fallback
 * @returns {number}
 */
function readCssNumber(element, propertyName, fallback = 0) {
  if (!element) return fallback;
  const rawValue = getComputedStyle(element).getPropertyValue(propertyName).trim();
  if (!rawValue) return fallback;
  const value = parseFiniteNumber(rawValue);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * @param {number} rawLeft
 * @param {number} rawRight
 * @param {number} offset
 * @param {number} leftBound
 * @param {number} rightBound
 * @param {number} maxOffsetPx
 * @returns {number}
 */
function clampTokenOffset(rawLeft, rawRight, offset, leftBound, rightBound, maxOffsetPx) {
  const minOffset = Math.max(-maxOffsetPx, leftBound - rawLeft);
  const maxOffset = Math.min(maxOffsetPx, rightBound - rawRight);
  return clampNumber(offset, minOffset, maxOffset);
}

/**
 * @param {number[]} values
 * @returns {number}
 */
function getMean(values) {
  return values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;
}

/**
 * @param {number[]} rawLefts
 * @param {number[]} rawRights
 * @param {number[]} targetOffsets
 * @param {number[]} boundaryMinOffsets
 * @param {number[]} boundaryMaxOffsets
 * @param {number} minGap
 * @returns {(candidateOffsets: number[]) => number}
 */
function scoreGlobalTokenOffsets(rawLefts, rawRights, targetOffsets, boundaryMinOffsets, boundaryMaxOffsets, minGap) {
  const offsetMean = getMean(targetOffsets);
  const span = Math.max(1, Math.max(...rawRights) - Math.min(...rawLefts));
  const collisionWeight = 18;
  const targetWeight = 0.65;
  const balanceWeight = 0.08;
  const boundaryWeight = 5;

  return (candidateOffsets) => {
    let score = 0;
    for (let index = 0; index < candidateOffsets.length; index += 1) {
      const offset = candidateOffsets[index];
      const targetDelta = offset - targetOffsets[index];
      const balanceDelta = offset - offsetMean;
      score += targetDelta * targetDelta * targetWeight;
      score += balanceDelta * balanceDelta * balanceWeight;

      if (offset < boundaryMinOffsets[index]) {
        const overflow = boundaryMinOffsets[index] - offset;
        score += overflow * overflow * boundaryWeight;
      } else if (offset > boundaryMaxOffsets[index]) {
        const overflow = offset - boundaryMaxOffsets[index];
        score += overflow * overflow * boundaryWeight;
      }
    }

    for (let index = 0; index < candidateOffsets.length - 1; index += 1) {
      const right = rawRights[index] + candidateOffsets[index];
      const nextLeft = rawLefts[index + 1] + candidateOffsets[index + 1];
      const overlap = Math.max(0, right - nextLeft + minGap);
      score += overlap * overlap * collisionWeight;
    }

    for (let leftIndex = 0; leftIndex < candidateOffsets.length - 2; leftIndex += 1) {
      for (let rightIndex = leftIndex + 2; rightIndex < candidateOffsets.length; rightIndex += 1) {
        const right = rawRights[leftIndex] + candidateOffsets[leftIndex];
        const nextLeft = rawLefts[rightIndex] + candidateOffsets[rightIndex];
        const overlap = Math.max(0, right - nextLeft + minGap);
        score += overlap * overlap * collisionWeight * 0.35;
      }
    }

    const occupiedLeft = Math.min(...rawLefts.map((left, index) => left + candidateOffsets[index]));
    const occupiedRight = Math.max(...rawRights.map((right, index) => right + candidateOffsets[index]));
    const occupiedWidth = Math.max(0, occupiedRight - occupiedLeft);
    if (occupiedWidth > span) {
      const overflow = occupiedWidth - span;
      score += overflow * overflow * 0.02;
    }

    return score;
  };
}

/**
 * @param {number[]} rawLefts
 * @param {number[]} rawRights
 * @param {number[]} targetOffsets
 * @param {number[]} hardMinOffsets
 * @param {number[]} hardMaxOffsets
 * @param {number[]} boundaryMinOffsets
 * @param {number[]} boundaryMaxOffsets
 * @param {number} minGap
 * @returns {number[]}
 */
function solveGlobalTokenOffsets(
  rawLefts,
  rawRights,
  targetOffsets,
  hardMinOffsets,
  hardMaxOffsets,
  boundaryMinOffsets,
  boundaryMaxOffsets,
  minGap
) {
  const count = targetOffsets.length;
  if (count === 0) return [];

  const scoreOffsets = scoreGlobalTokenOffsets(rawLefts, rawRights, targetOffsets, boundaryMinOffsets, boundaryMaxOffsets, minGap);
  const offsets = targetOffsets.map((offset, index) => clampNumber(offset, hardMinOffsets[index], hardMaxOffsets[index]));
  const maxRange = Math.max(
    1,
    ...offsets.map((offset, index) => Math.max(Math.abs(offset - hardMinOffsets[index]), Math.abs(hardMaxOffsets[index] - offset)))
  );
  let currentScore = scoreOffsets(offsets);
  let step = Math.max(0.5, Math.min(maxRange, (Math.max(...rawRights) - Math.min(...rawLefts)) / Math.max(2, count)));

  const readCandidateTargets = (index) => {
    const candidates = [
      offsets[index],
      targetOffsets[index],
      boundaryMinOffsets[index],
      boundaryMaxOffsets[index],
      hardMinOffsets[index],
      hardMaxOffsets[index]
    ];
    if (index > 0) {
      candidates.push(rawRights[index - 1] + offsets[index - 1] + minGap - rawLefts[index]);
    }
    if (index < count - 1) {
      candidates.push(rawLefts[index + 1] + offsets[index + 1] - minGap - rawRights[index]);
    }
    return candidates.map((candidate) => clampNumber(candidate, hardMinOffsets[index], hardMaxOffsets[index]));
  };

  while (step >= 0.25) {
    let improved = false;
    for (let pass = 0; pass < count * 2; pass += 1) {
      for (let index = 0; index < count; index += 1) {
        let bestOffset = offsets[index];
        let bestScore = currentScore;
        const candidates = [
          ...readCandidateTargets(index),
          offsets[index] - step,
          offsets[index] + step,
          offsets[index] - (step / 2),
          offsets[index] + (step / 2)
        ];

        candidates.forEach((candidate) => {
          const nextOffset = clampNumber(candidate, hardMinOffsets[index], hardMaxOffsets[index]);
          if (Math.abs(nextOffset - offsets[index]) < 0.01) return;
          const nextOffsets = [...offsets];
          nextOffsets[index] = nextOffset;
          const nextScore = scoreOffsets(nextOffsets);
          if (nextScore + 0.001 < bestScore) {
            bestOffset = nextOffset;
            bestScore = nextScore;
          }
        });

        if (bestScore + 0.001 < currentScore) {
          offsets[index] = bestOffset;
          currentScore = bestScore;
          improved = true;
        }
      }
    }

    if (!improved) step /= 2;
  }

  return offsets;
}

/**
 * @param {number[]} rawLefts
 * @param {number[]} rawRights
 * @param {number[]} offsets
 * @param {number[]} symLefts
 * @param {number[]} symRights
 * @param {DOMRect} barRect
 * @param {number} maxOffsetPx
 * @returns {void}
 */
function resolveCollisions(rawLefts, rawRights, offsets, symLefts, symRights, barRect, maxOffsetPx) {
  const minGap = CHART_DISPLACEMENT_CONFIG.antiCollisionGapPx;
  const count = rawLefts.length;
  const leftBound = barRect.left;
  const rightBound = barRect.right;

  const hardMinOffsets = rawLefts.map(() => -maxOffsetPx);
  const hardMaxOffsets = rawRights.map(() => maxOffsetPx);
  const boundaryMinOffsets = rawLefts.map((left) => leftBound - left);
  const boundaryMaxOffsets = rawRights.map((right) => rightBound - right);
  const targetOffsets = offsets.map((offset, index) => clampNumber(offset, hardMinOffsets[index], hardMaxOffsets[index]));
  const solvedOffsets = solveGlobalTokenOffsets(
    rawLefts,
    rawRights,
    targetOffsets,
    hardMinOffsets,
    hardMaxOffsets,
    boundaryMinOffsets,
    boundaryMaxOffsets,
    minGap
  );

  for (let index = 0; index < count; index += 1) {
    offsets[index] = solvedOffsets[index];
    symLefts[index] = rawLefts[index] + offsets[index];
    symRights[index] = rawRights[index] + offsets[index];
  }
}

/**
 * @param {HTMLElement} tokenEl
 * @param {number} offsetPx
 * @returns {void}
 */
function setTokenOffset(tokenEl, offsetPx) {
  const fontSizePx = parseFloat(getComputedStyle(tokenEl).fontSize);
  if (!fontSizePx) return;
  tokenEl.style.setProperty('--chart-token-offset-x', `${(offsetPx / fontSizePx).toFixed(3)}em`);
}

/**
 * @param {HTMLElement} barBodyEl
 * @returns {void}
 */
function applySingleChordAnchor(barBodyEl) {
  const slots: HTMLElement[] = Array.from(barBodyEl.querySelectorAll('.chart-token-slot')) as HTMLElement[];
  if (slots.length !== 1) return;
  const sourceCellIndex = Number(slots[0].dataset.sourceCellIndex);
  const isFirstBeatSingleChord = Number.isInteger(sourceCellIndex) && sourceCellIndex === 0;
  const tokenEl: HTMLElement | null = slots[0].querySelector('.chart-token') as HTMLElement | null;
  if (!tokenEl) return;
  tokenEl.style.removeProperty('--chart-token-offset-x');
  const barRect = barBodyEl.getBoundingClientRect();
  const measureBounds = getBarBodyMeasureBounds(barBodyEl);
  const geometry = measureTokenGeometry(slots[0]);
  const rawLeft = geometry.symbolRect ? geometry.symbolRect.left : geometry.slotRect.left;
  const rawRight = geometry.symbolRect ? geometry.symbolRect.right : geometry.slotRect.right;
  const rawWidth = Math.max(0, rawRight - rawLeft);
  const fontSizePx = parseFloat(getComputedStyle(tokenEl).fontSize);
  if (!fontSizePx || rawWidth <= 0) return;

  const leftBound = measureBounds.left;
  const rightBound = measureBounds.right;
  const availableWidth = Math.max(0, rightBound - leftBound);
  // Temporary visual rule: first-beat single-chord bars need a stronger left anchor.
  // We should revisit this with the broader beat-placement model instead of keeping it as a one-off.
  const configuredBias = Number(CHART_DISPLACEMENT_CONFIG.singleChordLeftBias || 0);
  const rawBias = isFirstBeatSingleChord ? Math.min(configuredBias, 0.08) : configuredBias;
  const bias = Math.max(0, Math.min(1, rawBias));
  const anchoredLeft = leftBound + (availableWidth * bias);
  const maxOffsetPx = getMaxOffsetPx(tokenEl);

  let offsetPx = anchoredLeft - rawLeft;
  let scaledLeft = rawLeft + offsetPx;
  let scaledRight = rawRight + offsetPx;

  if (scaledLeft < leftBound) {
    offsetPx += leftBound - scaledLeft;
    scaledRight = rawRight + offsetPx;
  }

  if (scaledRight > rightBound) {
    offsetPx -= scaledRight - rightBound;
  }

  offsetPx = clampTokenOffset(
    rawLeft,
    rawRight,
    offsetPx,
    leftBound,
    rightBound,
    maxOffsetPx
  );
  setTokenOffset(tokenEl, offsetPx);
}

/**
 * @param {HTMLElement} rowEl
 * @returns {{ top: number, bottom: number }}
 */
function getRowChordVisualBounds(rowEl) {
  const visualElements: HTMLElement[] = Array.from(rowEl.querySelectorAll(
    '.chart-bar-body .chart-token, .chart-foot-pill, .chart-bar-corner-marker, .chart-repeat-dots, .chart-bar-text-annotation, .chart-inline-section-marker'
  )) as HTMLElement[];
  const elementRects = visualElements
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  const barLineRects = getRowBarCells(rowEl).flatMap((barCellEl) => {
    const cellRect = barCellEl.getBoundingClientRect();
    const computed = getComputedStyle(barCellEl);
    const lineTop = parseFiniteNumber(computed.getPropertyValue('--chart-bar-line-top'));
    const lineHeight = parseFiniteNumber(computed.getPropertyValue('--chart-bar-line-height'));
    const rects = [];
    if (cellRect.width > 0 && lineHeight > 0) {
      rects.push({
        top: cellRect.top + lineTop,
        bottom: cellRect.top + lineTop + lineHeight
      });
    }
    return rects;
  });

  const visualRects = [...elementRects, ...barLineRects];

  if (visualRects.length === 0) {
    const rowRect = rowEl.getBoundingClientRect();
    return { top: rowRect.top, bottom: rowRect.bottom };
  }

  return visualRects.reduce((bounds, rect) => ({
    top: Math.min(bounds.top, rect.top),
    bottom: Math.max(bounds.bottom, rect.bottom)
  }), {
    top: visualRects[0].top,
    bottom: visualRects[0].bottom
  });
}

/**
 * @param {HTMLElement} rowEl
 * @returns {HTMLElement[]}
 */
function getRowEndingElements(rowEl) {
  return Array.from(rowEl.querySelectorAll('.chart-ending-stack')) as HTMLElement[];
}

/**
 * @param {HTMLElement[]} rowElements
 * @returns {void}
 */
function applyEndingCollisionMargins(rowElements) {
  for (let index = 1; index < rowElements.length; index += 1) {
    const endings = getRowEndingElements(rowElements[index]);
    if (endings.length === 0) continue;

    const endingRects = endings
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    if (endingRects.length === 0) continue;

    const previousBounds = getRowChordVisualBounds(rowElements[index - 1]);
    const minEndingTop = Math.min(...endingRects.map((rect) => rect.top));
    const requiredEndingTop = previousBounds.bottom + CHART_ROW_ANNOTATIONS_CONFIG.chordGapPx;
    const overflow = requiredEndingTop - minEndingTop;
    if (overflow <= 0) continue;

    const previousMargin = parseFloat(getComputedStyle(rowElements[index]).marginTop) || 0;
    rowElements[index].style.marginTop = `${Math.ceil(previousMargin + overflow)}px`;
  }
}

function getRectOverlapWidth(left, right) {
  return Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
}

function getRectOverlapHeight(left, right) {
  return Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
}

function getSectionEndingCollisionScore(sectionRect, endingRects, dx, dy) {
  const shifted = getShiftedRect(sectionRect, dx, dy);
  const collisionScore = endingRects.reduce((score, endingRect) => {
    const overlapWidth = getRectOverlapWidth(shifted, endingRect);
    const overlapHeight = getRectOverlapHeight(shifted, endingRect);
    return score + (overlapWidth * overlapHeight * 30);
  }, 0);
  const movementScore = (Math.abs(dx) * 0.35) + (Math.abs(dy) * 0.18);
  return collisionScore + movementScore;
}

function findBestSectionMarkerShift(sectionMarker, endingRects) {
  sectionMarker.style.removeProperty('--chart-section-marker-shift-x');
  sectionMarker.style.removeProperty('--chart-section-marker-shift-y');

  const sectionBadge = sectionMarker.querySelector('.chart-section-badge') as HTMLElement | null;
  if (!sectionBadge || endingRects.length === 0) return { dx: 0, dy: 0 };

  const sectionRect = sectionBadge.getBoundingClientRect();
  if (sectionRect.width <= 0 || sectionRect.height <= 0) return { dx: 0, dy: 0 };

  const horizontalOffsets = [0, -8, -16, -24, -32, 8, 16];
  const verticalOffsets = [0, -8, -16, -24, -32, 8, 16];
  let best = { dx: 0, dy: 0, score: Number.POSITIVE_INFINITY };

  for (const dx of horizontalOffsets) {
    for (const dy of verticalOffsets) {
      const score = getSectionEndingCollisionScore(sectionRect, endingRects, dx, dy);
      if (score < best.score) best = { dx, dy, score };
    }
  }

  return best;
}

function applySectionEndingCollisionPlacements(rowElements) {
  rowElements.forEach((rowEl) => {
    const sectionMarker = rowEl.querySelector('.chart-section-marker') as HTMLElement | null;
    if (!sectionMarker) return;
    sectionMarker.style.removeProperty('--chart-section-marker-shift-x');
    sectionMarker.style.removeProperty('--chart-section-marker-shift-y');
  });

  rowElements.forEach((rowEl) => {
    const sectionMarker = rowEl.querySelector('.chart-section-marker') as HTMLElement | null;
    if (!sectionMarker) return;

    const endingRects = getRowEndingElements(rowEl)
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    if (endingRects.length === 0) return;

    const { dx, dy } = findBestSectionMarkerShift(sectionMarker, endingRects);
    sectionMarker.style.setProperty('--chart-section-marker-shift-x', `${dx.toFixed(2)}px`);
    sectionMarker.style.setProperty('--chart-section-marker-shift-y', `${dy.toFixed(2)}px`);
  });
}

/**
 * @param {HTMLElement} rowEl
 * @returns {HTMLElement[]}
 */
function getRowAnnotationElements(rowEl) {
  return Array.from(rowEl.querySelectorAll('.chart-section-badge, .chart-row-time-sig')) as HTMLElement[];
}

/**
 * @param {HTMLElement} annotationEl
 * @returns {HTMLElement}
 */
function getRowAnnotationPlacementElement(annotationEl) {
  return annotationEl.classList.contains('chart-section-badge') && annotationEl.parentElement
    ? annotationEl.parentElement
    : annotationEl;
}

/**
 * @param {HTMLElement[]} rowElements
 * @param {{ top: number, bottom: number }[]} rowChordBounds
 * @returns {void}
 */
function applyRowAnnotationPlacements(rowElements, rowChordBounds) {
  rowElements.forEach((rowEl) => {
    getRowAnnotationElements(rowEl).forEach((element) => {
      getRowAnnotationPlacementElement(element).style.removeProperty('--chart-row-annotation-y');
      element.style.removeProperty('--chart-row-annotation-x');
    });
  });

  rowElements.forEach((rowEl, index) => {
    const annotations = getRowAnnotationElements(rowEl);
    if (annotations.length === 0) return;

    const rowRect = rowEl.getBoundingClientRect();
    const currentChordTop = rowChordBounds[index].top;
    const previousChordBottom = index > 0 ? rowChordBounds[index - 1].bottom : -Infinity;
    let localExtraTop = 0;

    annotations.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const targetBottom = currentChordTop - CHART_ROW_ANNOTATIONS_CONFIG.chordGapPx;
      const nextTop = targetBottom - rect.height;
      const collisionOverflow = Number.isFinite(previousChordBottom)
        ? previousChordBottom + CHART_ROW_ANNOTATIONS_CONFIG.chordGapPx - nextTop
        : 0;
      localExtraTop = Math.max(localExtraTop, collisionOverflow);
      getRowAnnotationPlacementElement(element).style.setProperty('--chart-row-annotation-y', `${(nextTop - rowRect.top).toFixed(2)}px`);
    });

    if (localExtraTop > 0 && index > 0) {
      const previousMargin = parseFloat(getComputedStyle(rowEl).marginTop) || 0;
      rowEl.style.marginTop = `${Math.ceil(previousMargin + localExtraTop)}px`;
      const updatedRowRect = rowEl.getBoundingClientRect();
      const updatedChordBounds = getRowChordVisualBounds(rowEl);
      rowChordBounds[index] = updatedChordBounds;
      annotations.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const targetBottom = updatedChordBounds.top - CHART_ROW_ANNOTATIONS_CONFIG.chordGapPx;
        const nextTop = targetBottom - rect.height;
        getRowAnnotationPlacementElement(element).style.setProperty('--chart-row-annotation-y', `${(nextTop - updatedRowRect.top).toFixed(2)}px`);
      });
    }

    const sectionBadge = /** @type {HTMLElement | null} */ (rowEl.querySelector('.chart-section-badge'));
    const timeSig = /** @type {HTMLElement | null} */ (rowEl.querySelector('.chart-row-time-sig'));
    if (!sectionBadge || !timeSig) return;

    const badgeRect = sectionBadge.getBoundingClientRect();
    const timeSigRect = timeSig.getBoundingClientRect();
    const overlap = badgeRect.right + CHART_ROW_ANNOTATIONS_CONFIG.horizontalGapPx - timeSigRect.left;
    if (overlap > 0) {
      const previousOffset = parseFloat(getComputedStyle(timeSig).getPropertyValue('--chart-row-annotation-x')) || 0;
      timeSig.style.setProperty('--chart-row-annotation-x', `${Math.ceil(previousOffset + overlap)}px`);
    }
  });
}

/**
 * @param {HTMLElement} firstRow
 * @param {{ top: number }} firstChordBounds
 * @returns {number}
 */
function getFirstRowHeaderCollisionShift(firstRow, firstChordBounds) {
  const header = /** @type {HTMLElement | null} */ (document.querySelector('.chart-sheet-header'));
  if (!header) return 0;

  const annotationReserve = getRowAnnotationElements(firstRow).reduce((reserve, element) => {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return reserve;
    return Math.max(reserve, rect.height + CHART_ROW_ANNOTATIONS_CONFIG.chordGapPx);
  }, 0);
  if (annotationReserve <= 0) return 0;

  const requiredChordTop = header.getBoundingClientRect().bottom
    + CHART_ROW_ANNOTATIONS_CONFIG.headerGapPx
    + annotationReserve;
  return Math.max(0, requiredChordTop - firstChordBounds.top);
}

/**
 * @param {HTMLElement} barBodyEl
 * @returns {void}
 */
function applyBarBodyDisplacement(barBodyEl) {
  const slots: HTMLElement[] = Array.from(barBodyEl.querySelectorAll('.chart-token-slot')) as HTMLElement[];

  if (slots.length === 1) {
    applySingleChordAnchor(barBodyEl);
    return;
  }
  if (slots.length < 2) return;

  slots.forEach((slotEl) => {
    const tokenEl = slotEl.querySelector('.chart-token') as HTMLElement | null;
    if (!tokenEl) return;
    tokenEl.style.removeProperty('--chart-token-offset-x');
  });

  const measureBounds = getBarBodyMeasureBounds(barBodyEl);
  const maxOffsetPx = getMaxOffsetPx(barBodyEl);
  const geometries = slots.map((slot) => measureTokenGeometry(slot));
  const rawLefts = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.left : geometry.slotRect.left));
  const rawRights = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.right : geometry.slotRect.right));
  const offsets = geometries.map((geometry, index) => clampTokenOffset(
    rawLefts[index],
    rawRights[index],
    geometry.beatTargetX - geometry.anchorX,
    measureBounds.left,
    measureBounds.right,
    maxOffsetPx
  ));
  const symLefts = rawLefts.map((left, index) => left + offsets[index]);
  const symRights = rawRights.map((right, index) => right + offsets[index]);

  resolveCollisions(
    rawLefts,
    rawRights,
    offsets,
    symLefts,
    symRights,
    measureBounds,
    maxOffsetPx
  );

  geometries.forEach((geometry, index) => {
    if (!geometry.tokenEl) return;
    setTokenOffset(/** @type {HTMLElement} */ (geometry.tokenEl), offsets[index]);
  });
}

/**
 * @returns {void}
 */
function applyBarBodyDisplacements() {
  Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-body')).forEach((barBodyEl) => {
    applyBarBodyDisplacement(barBodyEl);
  });
}

/**
 * @returns {void}
 */
function applyFermataPlacements() {
  Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-cell')).forEach((barCellEl) => {
    const fermataEl = barCellEl.querySelector<HTMLElement>('.chart-bar-fermata-marker');
    if (!fermataEl) return;

    const markerCellIndex = Number(fermataEl.dataset.fermataCellIndex);
    if (!Number.isInteger(markerCellIndex)) return;

    const barRect = barCellEl.getBoundingClientRect();
    const matchingSlot = Array.from(barCellEl.querySelectorAll<HTMLElement>('.chart-token-slot'))
      .find((slotEl) => Number(slotEl.dataset.sourceCellIndex) === markerCellIndex);
    if (!matchingSlot) return;

    const mainEl = matchingSlot.querySelector<HTMLElement>('.chord-symbol-main');
    const anchorEl = mainEl || matchingSlot.querySelector<HTMLElement>('.chart-token');
    if (!anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    if (anchorRect.width <= 0) return;

    fermataEl.style.setProperty('--chart-fermata-left', `${(anchorRect.left + (anchorRect.width / 2) - barRect.left).toFixed(2)}px`);
  });
}

function getShiftedRect(rect, dx, dy) {
  return {
    left: rect.left + dx,
    right: rect.right + dx,
    top: rect.top + dy,
    bottom: rect.bottom + dy,
    width: rect.width,
    height: rect.height
  };
}

function getRectOverlapArea(left, right) {
  const overlapWidth = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const overlapHeight = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
  return overlapWidth * overlapHeight;
}

function getRectOverflowPenalty(rect, bounds) {
  const overflow =
    Math.max(0, bounds.left - rect.left)
    + Math.max(0, rect.right - bounds.right)
    + Math.max(0, bounds.top - rect.top)
    + Math.max(0, rect.bottom - bounds.bottom);
  return overflow * overflow * 4;
}

function getBarLineRect(barCellEl) {
  const cellRect = barCellEl.getBoundingClientRect();
  const computed = getComputedStyle(barCellEl);
  const lineTop = parseFiniteNumber(computed.getPropertyValue('--chart-bar-line-top'));
  const lineHeight = parseFiniteNumber(computed.getPropertyValue('--chart-bar-line-height'));
  if (cellRect.width <= 0 || lineHeight <= 0) return null;
  return {
    left: cellRect.left,
    right: cellRect.right,
    top: cellRect.top + lineTop,
    bottom: cellRect.top + lineTop + lineHeight
  };
}

function getCodaObstacleRects(barCellEl, codaEl) {
  const selector = [
    '.chart-bar-body .chart-token',
    '.chart-ending-stack',
    '.chart-bar-text-annotation',
    '.chart-bar-fermata-marker',
    '.chart-repeat-dots',
    '.chart-bar-segno-marker'
  ].join(', ');
  const obstacleRects = (Array.from(barCellEl.querySelectorAll(selector)) as HTMLElement[])
    .filter((element) => element !== codaEl && !codaEl.contains(element))
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => ({
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom
    }));
  const lineRect = getBarLineRect(barCellEl);
  if (lineRect) obstacleRects.push(lineRect);
  return obstacleRects;
}

function scoreCodaPlacement(rect, obstacles, bounds, dx, dy) {
  const collisionPenalty = obstacles.reduce((score, obstacle) =>
    score + (getRectOverlapArea(rect, obstacle) * 24), 0);
  const movementPenalty = (Math.abs(dx) * 0.16) + (Math.abs(dy) * 0.1);
  return collisionPenalty + getRectOverflowPenalty(rect, bounds) + movementPenalty;
}

function findBestCodaShift(codaEl, barCellEl) {
  codaEl.style.removeProperty('--chart-corner-marker-shift-x');
  codaEl.style.removeProperty('--chart-corner-marker-shift-y');

  const baseRect = codaEl.getBoundingClientRect();
  if (baseRect.width <= 0 || baseRect.height <= 0) return { dx: 0, dy: 0 };

  const barRect = barCellEl.getBoundingClientRect();
  const bounds = {
    left: barRect.left - 18,
    right: barRect.right + 18,
    top: barRect.top - 36,
    bottom: barRect.bottom + 18
  };
  const obstacles = getCodaObstacleRects(barCellEl, codaEl);
  const horizontalOffsets = codaEl.classList.contains('is-end')
    ? [-24, -16, -8, 0, 8]
    : [-8, 0, 8, 16, 24];
  const verticalOffsets = [-30, -22, -14, -8, 0, 8, 14];
  let best = { dx: 0, dy: 0, score: Number.POSITIVE_INFINITY };

  for (const dx of horizontalOffsets) {
    for (const dy of verticalOffsets) {
      const candidateRect = getShiftedRect(baseRect, dx, dy);
      const score = scoreCodaPlacement(candidateRect, obstacles, bounds, dx, dy);
      if (score < best.score) best = { dx, dy, score };
    }
  }

  return best;
}

function applyCodaPlacements() {
  Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-coda-marker')).forEach((codaEl) => {
    const barCellEl = codaEl.closest('.chart-bar-cell') as HTMLElement | null;
    if (!barCellEl) return;
    const { dx, dy } = findBestCodaShift(codaEl, barCellEl);
    codaEl.style.setProperty('--chart-corner-marker-shift-x', `${dx.toFixed(2)}px`);
    codaEl.style.setProperty('--chart-corner-marker-shift-y', `${dy.toFixed(2)}px`);
  });
}

/**
 * @param {HTMLElement} rowEl
 * @returns {HTMLElement[]}
 */
function getRowBarCells(rowEl) {
  return (Array.from(rowEl.children) as HTMLElement[]).filter((element) =>
    element.classList.contains('chart-bar-cell')
  );
}

/**
 * @param {number} scale
 * @returns {number}
 */
function getWidthFactorFromCompressionScale(scale) {
  return scale > 0 && scale < 1 ? 1 / scale : 1;
}

/**
 * @param {HTMLElement} rowEl
 * @returns {void}
 */
function resetRowTokenOffsets(rowEl) {
  (Array.from(rowEl.querySelectorAll('.chart-token')) as HTMLElement[]).forEach((tokenEl) => {
    tokenEl.style.removeProperty('--chart-token-offset-x');
  });
}

/**
 * @param {HTMLElement} rowEl
 * @returns {number[]}
 */
function getNeutralRowResizeFactors(rowEl) {
  rowEl.style.removeProperty('grid-template-columns');
  resetRowTokenOffsets(rowEl);
  void rowEl.offsetWidth;

  return getRowBarCells(rowEl).map((cellEl) => {
    const barBodyEl = cellEl.querySelector<HTMLElement>('.chart-bar-body');
    if (!barBodyEl) return 1;

    return getWidthFactorFromCompressionScale(getBarBodyCollisionScale(barBodyEl, 0.01));
  });
}

/**
 * @param {number[]} factors
 * @param {number} minSpreadFactor
 * @param {number} maxSpreadFactor
 * @returns {number[]}
 */
function getRowResizeWeightsFromFactors(factors, minSpreadFactor, maxSpreadFactor) {
  if (factors.length === 0) return [];

  const normalizedFactors = factors.map((factor) => Math.max(1, factor));
  const averageFactor = normalizedFactors.reduce((sum, factor) => sum + factor, 0) / normalizedFactors.length || 1;
  const relativeWeights = normalizedFactors.map((factor) => factor / averageFactor);
  const spreadFactor = Math.max(...relativeWeights);
  if (spreadFactor < minSpreadFactor) return normalizedFactors.map(() => 1);

  const spreadDelta = spreadFactor - 1;
  const maxSpreadDelta = maxSpreadFactor - 1;
  const scale = spreadDelta > maxSpreadDelta && spreadDelta > 0
    ? maxSpreadDelta / spreadDelta
    : 1;

  return relativeWeights.map((weight) => 1 + ((weight - 1) * scale));
}

/**
 * @param {HTMLElement} barBodyEl
 * @param {number} finalScale
 * @param {number} textScaleCompensation
 * @returns {void}
 */
function applyBarBodyCompressionScale(barBodyEl, finalScale, textScaleCompensation) {
  const mode = String(CHART_COMPRESSION_CONFIG.mode || 'fontSize');
  const currentFontPx = parseFloat(getComputedStyle(barBodyEl).fontSize);

  if (mode === 'fontSize') {
    const combinedScale = finalScale * textScaleCompensation;
    if (combinedScale >= 0.999 || !currentFontPx) return;
    barBodyEl.style.fontSize = `${(currentFontPx * combinedScale).toFixed(2)}px`;
    return;
  }

  if (textScaleCompensation < 0.999 && currentFontPx) {
    barBodyEl.style.fontSize = `${(currentFontPx * textScaleCompensation).toFixed(2)}px`;
  }

  if (finalScale >= 0.999) return;

  if (mode === 'rootHorizontal') {
    (Array.from(barBodyEl.querySelectorAll('.chart-token.chord')) as HTMLElement[]).forEach((tokenEl) => {
      tokenEl.style.setProperty('--chart-chord-root-scale-x', finalScale.toFixed(3));
    });
    return;
  }

  if (mode === 'chordHorizontal') {
    (Array.from(barBodyEl.querySelectorAll('.chart-token.chord')) as HTMLElement[]).forEach((tokenEl) => {
      tokenEl.style.setProperty('--chart-token-scale-x', finalScale.toFixed(3));
    });
  }
}

/**
 * @returns {number}
 */
function applyRowBarResizing() {
  const minSpreadFactor = Math.max(1, CHART_BAR_RESIZING_CONFIG.minDeltaRatio);
  const maxSpreadFactor = Math.max(1, CHART_BAR_RESIZING_CONFIG.maxDeltaRatio);
  if (maxSpreadFactor <= minSpreadFactor) {
    let maxWeightChange = 0;
    Array.from(document.querySelectorAll<HTMLElement>('.chart-row')).forEach((rowEl) => {
      if (!rowEl.style.gridTemplateColumns) return;
      maxWeightChange = Math.max(maxWeightChange, 1);
      rowEl.style.removeProperty('grid-template-columns');
    });
    return maxWeightChange;
  }

  let maxWeightChange = 0;
  Array.from(document.querySelectorAll<HTMLElement>('.chart-row')).forEach((rowEl) => {
    if (rowEl.classList.contains('uses-rhythmic-grid')) {
      if (rowEl.style.gridTemplateColumns) {
        rowEl.style.removeProperty('grid-template-columns');
        maxWeightChange = Math.max(maxWeightChange, 1);
      }
      return;
    }

    const previousWeights = rowEl.style.gridTemplateColumns.match(/([0-9.]+)fr/g)
      ?.map((part) => Number.parseFloat(part)) || [];
    const factors = getNeutralRowResizeFactors(rowEl);
    const weights = getRowResizeWeightsFromFactors(factors, minSpreadFactor, maxSpreadFactor);

    if (weights.length > 0 && weights.some((weight) => weight > 1)) {
      weights.forEach((weight, index) => {
        maxWeightChange = Math.max(maxWeightChange, Math.abs(weight - (previousWeights[index] || 1)));
      });
      rowEl.style.gridTemplateColumns = weights
        .map((weight) => `minmax(0, ${weight.toFixed(3)}fr)`)
        .join(' ');
    } else if (previousWeights.length > 0) {
      maxWeightChange = Math.max(maxWeightChange, 1);
      rowEl.style.removeProperty('grid-template-columns');
    }
  });

  return maxWeightChange;
}

/**
 * @param {number} textScaleCompensation
 * @returns {void}
 */
function applyBarBodyCompression(textScaleCompensation) {
  const rowCompressionData = Array.from(document.querySelectorAll<HTMLElement>('.chart-row')).map((rowEl) => {
    const barCompressionData = Array.from(rowEl.querySelectorAll<HTMLElement>('.chart-bar-body')).map((barBodyEl) => ({
      barBodyEl,
      localScale: getBarBodyCollisionScale(barBodyEl)
    }));
    const rowScale = barCompressionData.reduce(
      (scale, barData) => Math.min(scale, barData.localScale),
      1
    );
    return { barCompressionData, rowScale };
  });
  const pageScale = rowCompressionData.reduce(
    (scale, rowData) => Math.min(scale, rowData.rowScale),
    1
  );
  const pageScaleLimit = Math.min(
    1,
    pageScale + Math.max(0, CHART_COMPRESSION_CONFIG.pageMaxScaleGap)
  );

  rowCompressionData.forEach(({ barCompressionData, rowScale }) => {
    const rowScaleLimit = Math.min(
      1,
      rowScale + Math.max(0, CHART_COMPRESSION_CONFIG.rowMaxScaleGap)
    );
    barCompressionData.forEach(({ barBodyEl, localScale }) => {
      const finalScale = Math.min(localScale, rowScaleLimit, pageScaleLimit);
      barBodyEl.dataset.chartLocalScale = localScale.toFixed(4);
      barBodyEl.dataset.chartRowScale = rowScale.toFixed(4);
      barBodyEl.dataset.chartPageScale = pageScale.toFixed(4);
      barBodyEl.dataset.chartRowScaleLimit = rowScaleLimit.toFixed(4);
      barBodyEl.dataset.chartPageScaleLimit = pageScaleLimit.toFixed(4);
      barBodyEl.dataset.chartFinalScale = finalScale.toFixed(4);
      applyBarBodyCompressionScale(barBodyEl, finalScale, textScaleCompensation);
    });
  });
}

/**
 * @returns {void}
 */
function resetOpticalPlacementStyles() {
  Array.from(document.querySelectorAll<HTMLElement>('.chart-row')).forEach((rowEl) => {
    rowEl.style.removeProperty('grid-template-columns');
  });
  Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-cell')).forEach((barCellEl) => {
    barCellEl.style.removeProperty('--chart-bar-line-top');
  });
  Array.from(document.querySelectorAll<HTMLElement>('.chart-section-marker')).forEach((markerEl) => {
    markerEl.style.removeProperty('--chart-section-marker-shift-x');
    markerEl.style.removeProperty('--chart-section-marker-shift-y');
  });
  Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-body')).forEach((barBodyEl) => {
    barBodyEl.style.removeProperty('font-size');
    delete barBodyEl.dataset.chartLocalScale;
    delete barBodyEl.dataset.chartRowScale;
    delete barBodyEl.dataset.chartPageScale;
    delete barBodyEl.dataset.chartRowScaleLimit;
    delete barBodyEl.dataset.chartPageScaleLimit;
    delete barBodyEl.dataset.chartFinalScale;
    barBodyEl.querySelectorAll<HTMLElement>('.chart-token').forEach((tokenEl) => {
      tokenEl.style.removeProperty('--chart-token-offset-x');
      tokenEl.style.removeProperty('--chart-token-scale-x');
      tokenEl.style.removeProperty('--chart-token-scale-y');
      tokenEl.style.removeProperty('--chart-chord-root-scale-x');
    });
  });
  Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-fermata-marker')).forEach((fermataEl) => {
    fermataEl.style.removeProperty('--chart-fermata-left');
  });
  Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-corner-marker')).forEach((markerEl) => {
    markerEl.style.removeProperty('--chart-corner-marker-shift-x');
    markerEl.style.removeProperty('--chart-corner-marker-shift-y');
  });
}

/** @returns {boolean} */
function isCollisionDebugEnabled() {
  return Boolean(CHART_DEBUG_CONFIG?.showChordCollisionBoxes);
}

/**
 * @param {HTMLElement} sheetGrid
 * @returns {HTMLElement}
 */
function ensureCollisionDebugOverlay(sheetGrid) {
  const ownerDocument = sheetGrid.ownerDocument || document;
  const existing = ownerDocument.querySelector('[data-chart-collision-debug-overlay]') as HTMLElement | null;
  if (existing) return existing;

  const overlay = ownerDocument.createElement('div');
  overlay.dataset.chartCollisionDebugOverlay = 'true';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
    overflow: 'hidden'
  });
  ownerDocument.body.appendChild(overlay);
  return overlay;
}

/** @returns {void} */
function removeCollisionDebugOverlay() {
  document.querySelector('[data-chart-collision-debug-overlay]')?.remove();
}

/**
 * @param {HTMLElement} sheetGrid
 * @returns {CollisionDebugBox[]}
 */
function collectCollisionDebugBoxes(sheetGrid) {
  const boxes: CollisionDebugBox[] = [];

  (Array.from(sheetGrid.querySelectorAll('.chart-bar-body')) as HTMLElement[]).forEach((barBodyEl) => {
    (Array.from(barBodyEl.querySelectorAll('.chart-token-slot')) as HTMLElement[]).forEach((slotEl) => {
      const geometry = measureTokenGeometry(slotEl);
      if (geometry.symbolRect) {
        const symbolRect = {
          left: geometry.symbolRect.left,
          top: geometry.symbolRect.top,
          right: geometry.symbolRect.right,
          bottom: geometry.symbolRect.bottom,
          width: Math.max(0, geometry.symbolRect.right - geometry.symbolRect.left),
          height: Math.max(0, geometry.symbolRect.bottom - geometry.symbolRect.top)
        };
        if (hasVisibleRect(symbolRect)) {
          boxes.push({ kind: 'symbol', rect: symbolRect, label: 'chord' });
        }
      }
    });
  });

  return boxes;
}

/**
 * @param {HTMLElement} sheetGrid
 * @returns {void}
 */
function renderCollisionDebugOverlay(sheetGrid) {
  if (!isCollisionDebugEnabled()) {
    removeCollisionDebugOverlay();
    return;
  }

  const overlay = ensureCollisionDebugOverlay(sheetGrid);
  const palette: Record<string, { border: string, background: string }> = {
    measure: { border: '#1d4ed8', background: 'rgba(29, 78, 216, 0.06)' },
    symbol: { border: '#dc2626', background: 'rgba(220, 38, 38, 0.10)' },
    slot: { border: '#16a34a', background: 'rgba(22, 163, 74, 0.06)' },
    row: { border: '#9333ea', background: 'rgba(147, 51, 234, 0.05)' },
    annotation: { border: '#d97706', background: 'rgba(217, 119, 6, 0.08)' },
    ending: { border: '#0f766e', background: 'rgba(15, 118, 110, 0.08)' }
  };

  overlay.innerHTML = collectCollisionDebugBoxes(sheetGrid).map(({ kind, rect, label }) => {
    const color = palette[kind] || { border: '#111827', background: 'rgba(17, 24, 39, 0.08)' };
    const left = Math.round(rect.left * 100) / 100;
    const top = Math.round(rect.top * 100) / 100;
    const width = Math.round(Math.max(0, rect.right - rect.left) * 100) / 100;
    const height = Math.round(Math.max(0, rect.bottom - rect.top) * 100) / 100;
    return `
      <div
        title="${label || kind}"
        style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;border:1px solid ${color.border};background:${color.background};box-sizing:border-box;"
      >
        <span style="position:absolute;left:0;top:0;transform:translateY(-100%);font:10px/1.2 system-ui,sans-serif;color:${color.border};background:rgba(255,255,255,0.88);padding:1px 3px;white-space:nowrap;">${label || kind}</span>
      </div>
    `;
  }).join('');
}

/**
 * @param {HTMLElement} barCellEl
 * @returns {DOMRect | null}
 */
function getFullSizeRootRect(barCellEl) {
  const rootElements = Array.from(barCellEl.querySelectorAll('.chart-token .chord-symbol-root-letter')) as HTMLElement[];
  return rootElements
    .map((element) => element.getBoundingClientRect())
    .find((rect) => rect.width > 0 && rect.height > 0) || null;
}

/**
 * @returns {void}
 */
function syncBarLinePlacements() {
  const barLineHeight = CHART_DISPLAY_CONFIG.barGeometry.barLine.heightPx;
  Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-cell')).forEach((barCellEl) => {
    const rootRect = getFullSizeRootRect(barCellEl);
    if (!rootRect) return;

    const cellRect = barCellEl.getBoundingClientRect();
    const rootCenterY = rootRect.top + (rootRect.height / 2);
    const lineTop = Math.max(0, rootCenterY - cellRect.top - (barLineHeight / 2));
    barCellEl.style.setProperty('--chart-bar-line-top', `${lineTop.toFixed(2)}px`);
  });
}

/**
 * @param {HTMLElement} sheetGrid
 * @returns {ChartLayoutDebugSnapshot}
 */
function collectLayoutDebugSnapshot(sheetGrid) {
  const bars: ChartLayoutDebugBar[] = [];
  const rowElements = Array.from(sheetGrid.querySelectorAll('.chart-row')) as HTMLElement[];

  rowElements.forEach((rowEl, rowIndex) => {
    const barCells = getRowBarCells(rowEl).filter((cellEl) => !cellEl.classList.contains('is-empty'));
    barCells.forEach((barCellEl, columnIndex) => {
      const barBodyEl = barCellEl.querySelector('.chart-bar-body') as HTMLElement | null;
      if (!barBodyEl) return;

      const measureRect = toDebugRect(getBarBodyMeasureRect(barBodyEl));
      const bodyRect = toDebugRect(barBodyEl.getBoundingClientRect());
      const fontSizePx = parseFloat(getComputedStyle(barBodyEl).fontSize) || 16;
      const tokenSlots = Array.from(barBodyEl.querySelectorAll('.chart-token-slot')) as HTMLElement[];
      const tokenGeometries = tokenSlots.map((slotEl) => measureTokenGeometry(slotEl));
      const tokenSymbolRects = tokenGeometries.map((geometry) => geometry.symbolRect);
      const tokens = tokenGeometries.map((geometry, slotIndex) => {
        const tokenEl = geometry.tokenEl as HTMLElement | null;
        const offsetEm = readCssNumber(tokenEl, '--chart-token-offset-x', 0);
        const tokenScaleX = readCssNumber(tokenEl, '--chart-token-scale-x', 1);
        const rootScaleX = readCssNumber(tokenEl, '--chart-chord-root-scale-x', 1);
        const symbolRect = geometry.symbolRect ? toDebugRect(geometry.symbolRect) : null;
        const nextSymbolRect = tokenSymbolRects[slotIndex + 1] || null;
        const overlapWithNextPx = symbolRect && nextSymbolRect
          ? Math.max(0, symbolRect.right - nextSymbolRect.left + CHART_DISPLACEMENT_CONFIG.antiCollisionGapPx)
          : 0;

        return {
          slotIndex,
          symbol: (tokenEl?.textContent || '').replace(/\s+/g, ' ').trim(),
          offsetEm,
          offsetPx: offsetEm * fontSizePx,
          tokenScaleX,
          rootScaleX,
          slotRect: toDebugRect(geometry.slotRect),
          symbolRect,
          anchorX: geometry.anchorX,
          beatTargetX: geometry.beatTargetX,
          anchorDeltaPx: geometry.anchorX - geometry.beatTargetX,
          overlapWithNextPx
        };
      });

      bars.push({
        barId: barCellEl.dataset.barId || '',
        barIndex: Number.isFinite(Number(barCellEl.dataset.barIndex)) ? Number(barCellEl.dataset.barIndex) : null,
        rowIndex: rowIndex + 1,
        columnIndex: columnIndex + 1,
        parts: Math.max(1, readCssNumber(barBodyEl, '--chart-bar-parts', 1)),
        localScale: Number(barBodyEl.dataset.chartLocalScale || 1),
        rowScale: Number(barBodyEl.dataset.chartRowScale || 1),
        pageScale: Number(barBodyEl.dataset.chartPageScale || 1),
        rowScaleLimit: Number(barBodyEl.dataset.chartRowScaleLimit || 1),
        pageScaleLimit: Number(barBodyEl.dataset.chartPageScaleLimit || 1),
        finalScale: Number(barBodyEl.dataset.chartFinalScale || 1),
        fontSizePx,
        measureRect,
        bodyRect,
        tokens
      });
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    activeBypasses: getChartLayoutDebugBypasses(),
    pipelineStepsRun: [...lastLayoutPipelineStepsRun],
    config: {
      displacement: CHART_DISPLACEMENT_CONFIG,
      barResizing: CHART_BAR_RESIZING_CONFIG,
      compression: CHART_COMPRESSION_CONFIG
    },
    bars
  };
}

/**
 * @param {CreateChartSheetRendererOptions} [options]
 * @returns {{
 *   renderSheet: (viewModel: any) => void,
 *   updateSheetGridGap: () => void,
 *   applyOpticalPlacements: () => void,
 *   renderDiagnostics: (playbackPlan: any) => void,
 *   getLayoutDebugSnapshot: () => ChartLayoutDebugSnapshot | null,
 *   getLayoutDebugBypasses: () => Record<string, boolean>,
 *   setLayoutDebugBypasses: (nextBypasses: Record<string, boolean>) => Record<string, boolean>,
 *   clearLayoutDebugBypasses: () => Record<string, boolean>
 * }}
 */
export function createChartSheetRenderer({
  sheetGrid,
  diagnosticsList,
  getDisplayedBarGroupSize,
  getHarmonyDisplayMode,
  getTextScaleCompensation,
  getFallbackTimeSignature,
  renderChordMarkup,
  isBarActive,
  isBarSelected
}: CreateChartSheetRendererOptions = {}) {
function renderBarCell(bar, options: RenderBarCellOptions = {}) {
    const classes = ['chart-bar-cell'];
    const isGraphicSpacer = isGraphicSpacerBar(bar);
    if (isBarActive?.(bar)) classes.push('is-active');
    if (isBarSelected?.(bar)) classes.push('is-selected');
    if (isGraphicSpacer) classes.push('is-graphic-spacer');
    if (bar.flags.includes('section_start_barline')) classes.push('is-section-start');
    if (bar.flags.includes('section_end_barline')) classes.push('is-section-end');
    if (bar.flags.includes('repeat_start_barline')) classes.push('is-repeat-start');
    if (bar.flags.includes('repeat_end_barline')) classes.push('is-repeat-end');
    if (bar.flags.includes('final_bar') || bar.flags.includes('end')) classes.push('is-final');
    if (options.isRowStart && !isGraphicSpacer) classes.push('is-row-start');
    if (bar.endings?.length && bar.displayTokens?.some((token) => token?.kind === 'alternate_chord' || token?.alternate?.symbol)) {
      classes.push('has-ending-alternate-collision');
    }

    const footPills = getBarFootPills(bar);
    const bodyLayout = getBarBodyLayout(bar, getFallbackTimeSignature?.() || '');
    const harmonyDisplayMode = getHarmonyDisplayMode?.() || 'default';
    const slotSpan = Math.max(1, Number(options.slotSpan || 1));
    const sectionMarker = options.sectionChanged && bar.sectionLabel
      ? `<span class="chart-inline-section-marker"><span class="chart-section-badge">${bar.sectionLabel}</span></span>`
      : '';

    return `
      <article class="${classes.join(' ')}" style="grid-column: span ${slotSpan};" data-bar-id="${bar.id}" data-bar-index="${bar.index}" tabindex="0" aria-pressed="${classes.includes('is-selected') ? 'true' : 'false'}">
        <span class="chart-bar-cell-highlight" aria-hidden="true"></span>
        ${sectionMarker}
        ${bar.flags.includes('repeat_start_barline') ? `<span class="chart-repeat-dots chart-repeat-dots-start" aria-hidden="true">${renderRepeatDotsMarker()}</span>` : ''}
        ${bar.flags.includes('repeat_end_barline') ? `<span class="chart-repeat-dots chart-repeat-dots-end" aria-hidden="true">${renderRepeatDotsMarker()}</span>` : ''}
        ${renderEndingMarkup(bar.endings)}
        ${renderBarCornerMarkers(bar)}
        ${renderFermataForBar(bar)}
        ${renderTextAnnotations(bar.textAnnotations)}
        <div class="chart-bar-head">
          <span class="chart-bar-index">${bar.index}</span>
        </div>
        <div class="${bodyLayout.className}" style="${bodyLayout.style}">
          ${bar.displayTokens.map((token, index) => renderToken(token, bodyLayout.placements[index], harmonyDisplayMode, renderChordMarkup)).join('')}
        </div>
        <div class="chart-bar-foot">
          ${footPills.map((pill) => `<span class="chart-foot-pill chart-foot-${pill.kind}">${escapeHtml(pill.text)}</span>`).join('')}
        </div>
      </article>
    `;
  }

  function renderSheet(viewModel) {
    if (!sheetGrid) return;
    const bars = viewModel?.bars || [];
    const primaryTimeSig = viewModel?.metadata?.primaryTimeSignature || '';

    let lastEffectiveTimeSig = null;
    const barTimeSigDisplay = bars.map((bar) => {
      const effectiveTimeSig = bar.timeSignature || primaryTimeSig;
      const show = !!effectiveTimeSig && effectiveTimeSig !== lastEffectiveTimeSig;
      if (effectiveTimeSig) lastEffectiveTimeSig = effectiveTimeSig;
      return show ? effectiveTimeSig : null;
    });

    const rows = buildRenderedRows(
      viewModel,
      barTimeSigDisplay,
      getDisplayedBarGroupSize?.() || CHART_LAYOUT_CONFIG.barsPerRow
    ).map((row) => {
      const sectionChanged = Boolean(row.firstBar.sectionLabel)
        && (!row.previousBar || row.previousBar.sectionId !== row.firstBar.sectionId);
      let previousBarInRow = row.previousBar || null;
      const cells = [
        ...(row.leadingEmptySlots > 0 ? [renderEmptyBarCell(row.leadingEmptySlots)] : []),
        ...row.bars.map((bar, index) => {
          const barSectionChanged = Boolean(bar.sectionLabel)
            && previousBarInRow
            && previousBarInRow.sectionId !== bar.sectionId;
          const markup = renderBarCell(bar, {
            isRowStart: index === 0,
            slotSpan: row.usesRhythmicGrid ? getBarRhythmicSlotCount(bar, 1) : 1,
            sectionChanged: index > 0 && barSectionChanged
          });
          previousBarInRow = bar;
          return markup;
        })
      ];

      return `
        <div class="chart-row${sectionChanged ? ' has-section-marker' : ''}${row.usesRhythmicGrid ? ' uses-rhythmic-grid' : ''}" style="--chart-row-columns: ${row.totalSlots};">
          ${row.rowTimeSignature ? renderBarTimeSignature(row.rowTimeSignature) : ''}
          <div class="chart-section-marker">
            ${sectionChanged ? `<span class="chart-section-badge">${row.firstBar.sectionLabel}</span>` : '<span class="chart-section-spacer"></span>'}
          </div>
          ${cells.join('')}
        </div>
      `;
    });

    sheetGrid.innerHTML = rows.join('');
  }

  function updateSheetGridGap() {
    if (!sheetGrid) return;
    const rowElements = sheetGrid.querySelectorAll<HTMLElement>('.chart-row');
    const rowCount = rowElements.length;
    rowElements.forEach((element) => {
      element.style.marginTop = '';
    });
    if (isLayoutPipelineStepBypassed('rowGap')) {
      sheetGrid.style.rowGap = '0px';
      runLayoutPipelineStep('collisionOverlay', () => renderCollisionDebugOverlay(sheetGrid));
      return;
    }
    if (rowCount < 2) {
      sheetGrid.style.rowGap = '0px';
      return;
    }

    lastLayoutPipelineStepsRun.push('rowGap');
    sheetGrid.style.rowGap = '0px';
    void sheetGrid.offsetHeight;
    const bottomBound = getSheetGridVisualBottomBound(sheetGrid);

    const firstRow = rowElements[0];
    if (firstRow && !isLayoutPipelineStepBypassed('firstRowHeaderShift')) {
      lastLayoutPipelineStepsRun.push('firstRowHeaderShift');
      const firstRowShift = getFirstRowHeaderCollisionShift(firstRow, getRowChordVisualBounds(firstRow));
      if (firstRowShift > 0) {
        firstRow.style.marginTop = `${Math.ceil(firstRowShift)}px`;
        void sheetGrid.offsetHeight;
      }
    }

    const initialVisualBounds = Array.from(rowElements).map((element) => getRowChordVisualBounds(element));
    const firstVisualTop = initialVisualBounds[0].top;
    const availableForGrid = bottomBound - firstVisualTop;
    const totalVisualHeight = initialVisualBounds.reduce((sum, bounds) => sum + Math.max(0, bounds.bottom - bounds.top), 0);
    const availableForGaps = availableForGrid - totalVisualHeight;
    const idealGap = Math.floor(availableForGaps / (rowCount - 1));
    const clampedGap = Math.max(
      CHART_ROW_SPACING_CONFIG.minPx,
      Math.min(CHART_ROW_SPACING_CONFIG.maxPx, idealGap)
    );

    for (let index = 1; index < rowElements.length; index += 1) {
      const previousBounds = getRowChordVisualBounds(rowElements[index - 1]);
      const currentBounds = getRowChordVisualBounds(rowElements[index]);
      const currentVisualGap = currentBounds.top - previousBounds.bottom;
      const marginAdjustment = clampedGap - currentVisualGap;
      if (Math.abs(marginAdjustment) >= 0.5) {
        const roundedMargin = marginAdjustment > 0 ? Math.ceil(marginAdjustment) : Math.floor(marginAdjustment);
        rowElements[index].style.marginTop = `${roundedMargin}px`;
      }
    }

    const rowElementList = Array.from(rowElements);
    runLayoutPipelineStep('endingMargins', () => applyEndingCollisionMargins(rowElementList));
    const rowChordBounds = rowElementList.map((element) => getRowChordVisualBounds(element));
    runLayoutPipelineStep('annotationPlacement', () => applyRowAnnotationPlacements(rowElementList, rowChordBounds));
    runLayoutPipelineStep('sectionEndingCollision', () => applySectionEndingCollisionPlacements(rowElementList));
    runLayoutPipelineStep('collisionOverlay', () => renderCollisionDebugOverlay(sheetGrid));
  }

  function applyOpticalPlacements() {
    lastLayoutPipelineStepsRun = [];
    const textScaleCompensation = Math.max(
      CHART_DISPLAY_CONFIG.textScaleCompensation.minCompensation,
      Math.min(CHART_DISPLAY_CONFIG.textScaleCompensation.maxCompensation, Number(getTextScaleCompensation?.() || 1))
    );

    resetOpticalPlacementStyles();
    void document.documentElement.offsetHeight;
    runLayoutPipelineStep('barLinePlacement', syncBarLinePlacements);

    for (let pass = 0; pass < OPTICAL_PIPELINE_MAX_PASSES; pass += 1) {
      runLayoutPipelineStep('displacement', applyBarBodyDisplacements);
      const resizeChange = runLayoutPipelineStep('rowResizing', applyRowBarResizing);
      if (resizeChange === undefined) break;
      if (resizeChange <= OPTICAL_PIPELINE_RESIZE_EPSILON) break;
      void document.documentElement.offsetHeight;
    }

    runLayoutPipelineStep('displacement', applyBarBodyDisplacements);
    runLayoutPipelineStep('compression', () => applyBarBodyCompression(textScaleCompensation));
    void document.documentElement.offsetHeight;
    runLayoutPipelineStep('postCompressionDisplacement', applyBarBodyDisplacements);
    applyFermataPlacements();
    applyCodaPlacements();
    if (sheetGrid) runLayoutPipelineStep('collisionOverlay', () => renderCollisionDebugOverlay(sheetGrid));
  }

  function renderDiagnostics(playbackPlan) {
    if (!diagnosticsList) return;
    const diagnostics = [...(playbackPlan?.diagnostics || [])];
    diagnosticsList.innerHTML = diagnostics.length
      ? diagnostics.map((diagnostic) => `<li>${diagnostic.level}: ${diagnostic.message}</li>`).join('')
      : '<li>No diagnostics.</li>';
  }

  function getLayoutDebugSnapshot() {
    return sheetGrid ? collectLayoutDebugSnapshot(sheetGrid) : null;
  }

  return {
    renderSheet,
    updateSheetGridGap,
    applyOpticalPlacements,
    renderDiagnostics,
    getLayoutDebugSnapshot,
    getLayoutDebugBypasses: getChartLayoutDebugBypasses,
    setLayoutDebugBypasses: setChartLayoutDebugBypasses,
    clearLayoutDebugBypasses: clearChartLayoutDebugBypasses
  };
}
