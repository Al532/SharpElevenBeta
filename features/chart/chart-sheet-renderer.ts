import { CHART_DISPLAY_CONFIG } from '../../config/trainer-config.js';

const {
  layout: CHART_LAYOUT_CONFIG,
  compression: CHART_COMPRESSION_CONFIG,
  alignment: CHART_ALIGNMENT_CONFIG,
  tokenMetrics: CHART_TOKEN_METRICS_CONFIG,
  subdividedTokenScale: CHART_SUBDIVIDED_TOKEN_SCALE_CONFIG
} = CHART_DISPLAY_CONFIG;

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
  isRowStart?: boolean
};

/**
 * @param {{ bars?: any[], layout?: any }} viewModel
 * @param {(string | null)[]} barTimeSigDisplay
 * @param {number} defaultSlotsPerRow
 * @returns {Array<{ bars: any[], firstBar: any, previousBar: any, rowTimeSignature: string | null, leadingEmptyBars: number, totalSlots: number }>}
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
        leadingEmptyBars: Math.max(0, Number(row?.leadingEmptyBars || 0)),
        totalSlots: Math.max(
          inferredSlotsPerRow,
          Math.max(0, Number(row?.leadingEmptyBars || 0)) + resolvedBars.length
        )
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
      leadingEmptyBars: 0,
      totalSlots: defaultSlotsPerRow
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
 * @param {any} token
 * @param {{ start?: number, end?: number }} placement
 * @param {string} harmonyDisplayMode
 * @param {(token: any, harmonyDisplayMode: string) => string} renderChordMarkup
 * @returns {string}
 */
function renderToken(token, placement, harmonyDisplayMode, renderChordMarkup) {
  const tokenClass = isRepeatTokenKind(token?.kind) ? 'repeat' : 'chord';
  const slotStart = Math.max(1, Number(placement?.start || 1));
  const slotEnd = Math.max(slotStart + 1, Number(placement?.end || (slotStart + 1)));
  const slotStyle = `grid-column: ${slotStart} / ${slotEnd};`;
  const tokenMarkup = tokenClass === 'chord'
    ? renderChordMarkup(token, harmonyDisplayMode)
    : renderRepeatTokenMarkup(token);
  const alternateMarkup = token?.alternate?.symbol
    ? `<span class="chart-token-alternate">${renderChordMarkup(token.alternate, harmonyDisplayMode)}</span>`
    : '';
  const slotClass = tokenClass === 'repeat' ? 'chart-token-slot repeat-slot' : 'chart-token-slot';

  return `
    <span class="${slotClass}" style="${slotStyle}">
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
      ${endings.map((ending) => `<span class="chart-ending chart-ending-${ending}">${ending}.</span>`).join('')}
    </div>
  `;
}

/**
 * @param {{ flags: string[] }} bar
 * @returns {string}
 */
function renderBarCornerMarkers(bar) {
  const markers = [];
  if (bar.flags.includes('coda')) {
    markers.push('<span class="chart-bar-corner-marker chart-bar-coda-marker" aria-label="Coda">&#119052;</span>');
  }
  if (bar.flags.includes('segno')) {
    markers.push('<span class="chart-bar-corner-marker chart-bar-segno-marker" aria-label="Segno">&#119074;</span>');
  }
  if (bar.flags.includes('fermata')) {
    markers.push('<span class="chart-bar-corner-marker chart-bar-fermata-marker" aria-label="Fermata">&#119133;</span>');
  }
  if (markers.length === 0) return '';
  return `<div class="chart-bar-corner-markers">${markers.join('')}</div>`;
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
 * @returns {string[]}
 */
function getBarFootPills(bar) {
  const pills = [];
  if (bar.flags.includes('fine')) pills.push('Fine');
  if (bar.flags.includes('dc')) pills.push('D.C.');
  if (bar.flags.includes('ds')) pills.push('D.S.');
  if (bar.flags.includes('coda')) pills.push('Coda');
  if (bar.flags.includes('segno')) pills.push('Segno');
  if (bar.flags.includes('fermata')) pills.push('Fermata');
  if (bar.flags.includes('end')) pills.push('End');
  if (bar.flags.includes('final_bar')) pills.push('Final bar');
  if (bar.directives?.length) pills.push(...bar.directives.map(formatDirectiveLabel).filter(Boolean));
  if (bar.comments?.length) pills.push(...bar.comments);
  return pills;
}

/**
 * @param {any} bar
 * @param {number} tokenCount
 * @returns {{ logicalSlots: number, placements: Array<{ start: number, end: number }> } | null}
 */
function getCellSlotPlacements(bar, tokenCount) {
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
  const hasVeryLongSymbol = maxTokenWeight >= CHART_COMPRESSION_CONFIG.denseChordThreshold;
  const hasExtremelyLongSymbol = maxTokenWeight >= CHART_COMPRESSION_CONFIG.veryDenseChordThreshold;

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
    || (tokenCount >= logicalSlots && weight >= CHART_COMPRESSION_CONFIG.aggressiveDensityThreshold)
    || (!useHalfLayout && hasExtremelyLongSymbol && weight >= CHART_COMPRESSION_CONFIG.aggressiveExtremeDensityThreshold);

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

/** @returns {string} */
function renderEmptyBarCell() {
  return '<article class="chart-bar-cell is-empty" aria-hidden="true"></article>';
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
 * @returns {{ left: number, right: number } | null}
 */
function getVisualSymbolRect(mainTokenEl) {
  const selectors = [
    '.chord-symbol-main',
    '.chord-symbol-sup',
    '.chord-symbol-slash-stack'
  ];
  let left = Infinity;
  let right = -Infinity;
  for (const selector of selectors) {
    const element = mainTokenEl.querySelector(selector);
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0) continue;
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
  }
  return Number.isFinite(left) ? { left, right } : null;
}

/**
 * @param {Element} slotEl
 * @returns {{ slotEl: Element, tokenEl: Element | null, slotRect: DOMRect, symbolRect: { left: number, right: number } | null, mainRect: DOMRect | null, anchorX: number, beatTargetX: number }}
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
    : (tokenRect && tokenRect.width > 0 ? { left: tokenRect.left, right: tokenRect.right } : null);
  const mainRect = mainEl ? mainEl.getBoundingClientRect() : null;

  const anchorX = mainRect
    ? mainRect.left + (mainRect.width / 2)
    : slotRect.left + (slotRect.width / 2);
  const beatTargetX = slotRect.left + (slotRect.width / 2);

  return { slotEl, tokenEl, slotRect, symbolRect, mainRect, anchorX, beatTargetX };
}

/**
 * @param {HTMLElement} barBodyEl
 * @returns {number}
 */
function getBarBodyCollisionScale(barBodyEl) {
  const slots: HTMLElement[] = Array.from(barBodyEl.querySelectorAll('.chart-token-slot')) as HTMLElement[];
  if (slots.length === 0) return 1;

  const barRect = barBodyEl.getBoundingClientRect();
  const availableWidth = Math.max(1, barRect.width - CHART_ALIGNMENT_CONFIG.barBodyHorizontalInsetPx);
  const geometries = slots.map((slot) => measureTokenGeometry(slot));
  const symbolLefts = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.left : geometry.slotRect.left));
  const symbolRights = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.right : geometry.slotRect.right));

  const occupiedLeft = Math.min(...symbolLefts);
  const occupiedRight = Math.max(...symbolRights);
  const occupiedWidth = Math.max(0, occupiedRight - occupiedLeft);
  const spanScale = occupiedWidth > availableWidth * CHART_COMPRESSION_CONFIG.collisionTargetFillRatio
    ? (availableWidth * CHART_COMPRESSION_CONFIG.collisionTargetFillRatio) / occupiedWidth
    : 1;

  let maxOverlap = 0;
  for (let index = 0; index < symbolLefts.length - 1; index += 1) {
    maxOverlap = Math.max(maxOverlap, symbolRights[index] - symbolLefts[index + 1]);
  }

  const overlapScale = maxOverlap > 0
      ? Math.max(
        CHART_COMPRESSION_CONFIG.minCollisionScale,
        1 - (((maxOverlap + CHART_ALIGNMENT_CONFIG.collisionOverlapPaddingPx) / availableWidth)
          * CHART_COMPRESSION_CONFIG.overlapPenaltyMultiplier)
      )
    : 1;

  return Math.max(
    CHART_COMPRESSION_CONFIG.minCollisionScale,
    Math.min(1, spanScale, overlapScale)
  );
}

/**
 * @param {number[]} rawLefts
 * @param {number[]} rawRights
 * @param {number[]} offsets
 * @param {number[]} symLefts
 * @param {number[]} symRights
 * @param {DOMRect} barRect
 * @returns {void}
 */
function resolveCollisions(rawLefts, rawRights, offsets, symLefts, symRights, barRect) {
  const minGap = CHART_ALIGNMENT_CONFIG.collisionMinGapPx;
  const count = rawLefts.length;

  for (let index = count - 2; index >= 0; index -= 1) {
    const overlap = symRights[index] - symLefts[index + 1] + minGap;
    if (overlap <= 0) continue;
    const rightBound = index + 2 < count ? symLefts[index + 2] - minGap : barRect.right;
    const push = Math.min(overlap, Math.max(0, rightBound - symRights[index + 1]));
    offsets[index + 1] += push;
    symLefts[index + 1] += push;
    symRights[index + 1] += push;
  }

  for (let index = 0; index < count - 1; index += 1) {
    const overlap = symRights[index] - symLefts[index + 1] + minGap;
    if (overlap <= 0) continue;
    const leftBound = index > 0 ? symRights[index - 1] + minGap : barRect.left;
    const pull = Math.min(overlap, Math.max(0, symLefts[index] - leftBound));
    offsets[index] -= pull;
    symLefts[index] -= pull;
    symRights[index] -= pull;
  }

  if (count === 2) {
    const rawWidth0 = rawRights[0] - rawLefts[0];
    const rawWidth1 = rawRights[1] - rawLefts[1];
    const slotWidth = Math.max(0, barRect.right - barRect.left) / 2;
    const slot0Center = barRect.left + (slotWidth / 2);
    const slot1Center = barRect.left + (slotWidth * 1.5);

    const center0 = Math.min(
      barRect.left + slotWidth - (rawWidth0 / 2),
      Math.max(barRect.left + (rawWidth0 / 2), slot0Center)
    );
    const center1 = Math.min(
      barRect.right - (rawWidth1 / 2),
      Math.max(barRect.left + slotWidth, slot1Center)
    );

    offsets[0] = center0 - ((rawLefts[0] + rawRights[0]) / 2);
    offsets[1] = center1 - ((rawLefts[1] + rawRights[1]) / 2);
    return;
  }

  const projectedRight = rawRights[count - 1] + offsets[count - 1];
  if (projectedRight > barRect.right - CHART_ALIGNMENT_CONFIG.symbolBoundaryInsetPx) {
    offsets[count - 1] -= projectedRight - (barRect.right - CHART_ALIGNMENT_CONFIG.symbolBoundaryInsetPx);
  }
}

/**
 * @param {HTMLElement} barBodyEl
 * @returns {void}
 */
function applySingleChordAnchor(barBodyEl) {
  const slots: HTMLElement[] = Array.from(barBodyEl.querySelectorAll('.chart-token-slot')) as HTMLElement[];
  if (slots.length !== 1) return;
  const tokenEl: HTMLElement | null = slots[0].querySelector('.chart-token') as HTMLElement | null;
  if (!tokenEl) return;
  tokenEl.style.removeProperty('--chart-token-offset-x');
  const barRect = barBodyEl.getBoundingClientRect();
  const geometry = measureTokenGeometry(slots[0]);
  const rawLeft = geometry.symbolRect ? geometry.symbolRect.left : geometry.slotRect.left;
  const rawRight = geometry.symbolRect ? geometry.symbolRect.right : geometry.slotRect.right;
  const rawWidth = Math.max(0, rawRight - rawLeft);
  const fontSizePx = parseFloat(getComputedStyle(tokenEl).fontSize);
  if (!fontSizePx || rawWidth <= 0) return;

  const leftBound = barRect.left + CHART_ALIGNMENT_CONFIG.symbolBoundaryInsetPx;
  const rightBound = barRect.right - CHART_ALIGNMENT_CONFIG.symbolBoundaryInsetPx;
  const availableWidth = Math.max(0, rightBound - leftBound);
  const anchoredLeft = barRect.left + (barRect.width * CHART_ALIGNMENT_CONFIG.singleChordLeftBias);
  const centeredLeft = leftBound + Math.max(0, (availableWidth - rawWidth) / 2);

  let offsetPx = anchoredLeft - rawLeft;
  let scaledLeft = rawLeft + offsetPx;
  let scaledRight = rawRight + offsetPx;

  const leftSpace = Math.max(0, scaledLeft - leftBound);
  const rightSpace = Math.max(0, rightBound - scaledRight);
  if (rightSpace < leftSpace) {
    const shiftTowardCenter = Math.min(leftSpace - rightSpace, scaledLeft - centeredLeft);
    if (shiftTowardCenter > 0) {
      offsetPx -= shiftTowardCenter;
      scaledLeft -= shiftTowardCenter;
      scaledRight -= shiftTowardCenter;
    }
  }

  if (scaledLeft < leftBound) {
    offsetPx += leftBound - scaledLeft;
    scaledRight = rawRight + offsetPx;
  }

  if (scaledRight > rightBound) {
    offsetPx -= scaledRight - rightBound;
  }

  tokenEl.style.setProperty('--chart-token-offset-x', `${(offsetPx / fontSizePx).toFixed(3)}em`);
}

/**
 * @param {CreateChartSheetRendererOptions} [options]
 * @returns {{
 *   renderSheet: (viewModel: any) => void,
 *   updateSheetGridGap: () => void,
 *   applyOpticalPlacements: () => void,
 *   renderDiagnostics: (playbackPlan: any) => void
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
    if (isBarActive?.(bar)) classes.push('is-active');
    if (isBarSelected?.(bar)) classes.push('is-selected');
    if (bar.flags.includes('repeat_end_barline')) classes.push('is-repeat-end');
    if (bar.flags.includes('final_bar') || bar.flags.includes('end')) classes.push('is-final');
    if (options.isRowStart) classes.push('is-row-start');

    const footPills = getBarFootPills(bar);
    const bodyLayout = getBarBodyLayout(bar, getFallbackTimeSignature?.() || '');
    const harmonyDisplayMode = getHarmonyDisplayMode?.() || 'default';

    return `
      <article class="${classes.join(' ')}" data-bar-id="${bar.id}" tabindex="0" aria-pressed="${classes.includes('is-selected') ? 'true' : 'false'}">
        ${renderEndingMarkup(bar.endings)}
        ${renderBarCornerMarkers(bar)}
        <div class="chart-bar-head">
          <span class="chart-bar-index">${bar.index}</span>
        </div>
        <div class="${bodyLayout.className}" style="${bodyLayout.style}">
          ${bar.displayTokens.map((token, index) => renderToken(token, bodyLayout.placements[index], harmonyDisplayMode, renderChordMarkup)).join('')}
        </div>
        <div class="chart-bar-foot">
          ${footPills.map((pill) => `<span class="chart-foot-pill">${pill}</span>`).join('')}
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
      const sectionChanged = !row.previousBar || row.previousBar.sectionId !== row.firstBar.sectionId;
      const cells = [
        ...Array.from({ length: row.leadingEmptyBars }, () => renderEmptyBarCell()),
        ...row.bars.map((bar, index) => renderBarCell(bar, { isRowStart: index === 0 }))
      ];

      return `
        <div class="chart-row${sectionChanged ? ' has-section-marker' : ''}" style="--chart-row-columns: ${row.totalSlots};">
          ${row.rowTimeSignature ? renderBarTimeSignature(row.rowTimeSignature) : ''}
          <div class="chart-section-marker">
            ${sectionChanged ? `<span class="chart-section-badge">${row.firstBar.sectionLabel}</span>` : '<span class="chart-section-spacer"></span>'}
          </div>
          ${cells.join('')}
        </div>
      `;
    });

    const rowCount = rows.length;
    sheetGrid.dataset.rowCount = String(rowCount);
    if (rowCount > 0 && rowCount <= CHART_LAYOUT_CONFIG.fillHeightMaxRowCount) {
      sheetGrid.dataset.fillHeight = 'true';
    } else {
      delete sheetGrid.dataset.fillHeight;
    }
    sheetGrid.innerHTML = rows.join('');
  }

  function updateSheetGridGap() {
    if (!sheetGrid) return;
    const rowElements = sheetGrid.querySelectorAll<HTMLElement>('.chart-row');
    const rowCount = rowElements.length;
    const shouldStretchRows = rowCount > 0 && rowCount <= CHART_LAYOUT_CONFIG.fillHeightMaxRowCount;
    sheetGrid.dataset.rowCount = String(rowCount);
    if (shouldStretchRows) {
      sheetGrid.dataset.fillHeight = 'true';
    } else {
      delete sheetGrid.dataset.fillHeight;
    }
    if (rowCount < 2) {
      sheetGrid.style.rowGap = shouldStretchRows
        ? `${CHART_LAYOUT_CONFIG.stretchSingleRowGapPx}px`
        : `${CHART_LAYOUT_CONFIG.rowGapMinPx}px`;
      return;
    }

    sheetGrid.style.rowGap = `${CHART_LAYOUT_CONFIG.rowGapMinPx}px`;
    const workspace = sheetGrid.closest('.chart-workspace');
    const gridTop = sheetGrid.getBoundingClientRect().top;
    const bottomBound = workspace ? workspace.getBoundingClientRect().bottom : window.innerHeight;
    const availableForGrid = bottomBound - gridTop;
    let totalRowHeight = 0;
    rowElements.forEach((element) => {
      totalRowHeight += (/** @type {HTMLElement} */ (element)).offsetHeight;
    });
    const availableForGaps = availableForGrid - totalRowHeight;
    const idealGap = Math.floor(availableForGaps / (rowCount - 1));
    const maxGap = shouldStretchRows
      ? CHART_LAYOUT_CONFIG.stretchRowGapMaxPx
      : CHART_LAYOUT_CONFIG.rowGapMaxPx;
    const clampedGap = Math.max(CHART_LAYOUT_CONFIG.rowGapMinPx, Math.min(maxGap, idealGap));
    sheetGrid.style.rowGap = `${clampedGap}px`;
  }

  function applyOpticalPlacements() {
    const textScaleCompensation = Math.max(
      CHART_DISPLAY_CONFIG.textScaleCompensation.minCompensation,
      Math.min(CHART_DISPLAY_CONFIG.textScaleCompensation.maxCompensation, Number(getTextScaleCompensation?.() || 1))
    );
    Array.from(document.querySelectorAll<HTMLElement>('.chart-row')).forEach((rowEl) => {
      rowEl.style.removeProperty('grid-template-columns');
    });
    Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-body')).forEach((barBodyEl) => {
      barBodyEl.style.removeProperty('font-size');
      barBodyEl.querySelectorAll<HTMLElement>('.chart-token').forEach((tokenEl) => {
        tokenEl.style.removeProperty('--chart-token-offset-x');
        tokenEl.style.removeProperty('--chart-token-scale');
      });
    });
    void document.documentElement.offsetHeight;

    let globalMaxFitRatio = 0;
    const rowData = Array.from(document.querySelectorAll<HTMLElement>('.chart-row')).map((rowEl) => {
      const barBodies = Array.from(rowEl.querySelectorAll<HTMLElement>('.chart-bar-body'));
      let rowMaxFitRatio = 0;
      barBodies.forEach((barBodyEl) => {
        const slots = Array.from(barBodyEl.querySelectorAll('.chart-token-slot'));
        if (slots.length === 0) return;
        const barRect = barBodyEl.getBoundingClientRect();
        const availableWidth = Math.max(1, barRect.width - CHART_ALIGNMENT_CONFIG.barBodyHorizontalInsetPx);
        let totalSymbolWidth = 0;
        slots.forEach((slot) => {
          const geometry = measureTokenGeometry(slot);
          const symbolWidth = geometry.symbolRect
            ? Math.max(0, geometry.symbolRect.right - geometry.symbolRect.left)
            : Math.max(0, geometry.slotRect.width);
          totalSymbolWidth += symbolWidth;
        });
        const fitRatio = totalSymbolWidth / availableWidth;
        if (fitRatio > rowMaxFitRatio) rowMaxFitRatio = fitRatio;
      });
      if (rowMaxFitRatio > globalMaxFitRatio) globalMaxFitRatio = rowMaxFitRatio;
      return { barBodies, rowMaxFitRatio };
    });

    const globalScale = globalMaxFitRatio > CHART_COMPRESSION_CONFIG.targetFillRatio
      ? Math.max(
          CHART_COMPRESSION_CONFIG.minGlobalScale,
          (CHART_COMPRESSION_CONFIG.targetFillRatio / globalMaxFitRatio) * CHART_COMPRESSION_CONFIG.easingFactor
        )
      : 1;

    rowData.forEach(({ barBodies, rowMaxFitRatio }) => {
      const effectiveFitRatio = rowMaxFitRatio * globalScale;
      const rowExtraScale = effectiveFitRatio > CHART_COMPRESSION_CONFIG.rowTargetFillRatio
        ? Math.max(
            CHART_COMPRESSION_CONFIG.minRowScale / globalScale,
            (CHART_COMPRESSION_CONFIG.rowTargetFillRatio / effectiveFitRatio) * CHART_COMPRESSION_CONFIG.easingFactor
          )
        : 1;
      const finalScale = globalScale * rowExtraScale;
      if (finalScale >= 0.999) return;
      barBodies.forEach((barBodyEl) => {
        const htmlBarBodyEl = /** @type {HTMLElement} */ (barBodyEl);
        const currentFontPx = parseFloat(getComputedStyle(htmlBarBodyEl).fontSize);
        if (!currentFontPx) return;
        htmlBarBodyEl.style.fontSize = `${(currentFontPx * finalScale * textScaleCompensation).toFixed(2)}px`;
      });
    });

    Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-body')).forEach((barBodyEl) => {
      applySingleChordAnchor(barBodyEl);
    });

    Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-body.chart-bar-body-subdivided, .chart-bar-body.chart-bar-body-halves')).forEach((barBodyEl) => {
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
        tokenEl.style.removeProperty('--chart-token-scale');
      });

      const barRect = barBodyEl.getBoundingClientRect();
      const geometries = slots.map((slot) => measureTokenGeometry(slot));
      const rawLefts = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.left : geometry.slotRect.left));
      const rawRights = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.right : geometry.slotRect.right));
      const offsets = geometries.map((geometry) => geometry.beatTargetX - geometry.anchorX);

      for (let index = 0; index < geometries.length; index += 1) {
        const { slotRect } = geometries[index];
        if (offsets[index] > 0) {
          offsets[index] = Math.min(offsets[index], Math.max(0, slotRect.right - rawRights[index]));
        } else if (offsets[index] < 0) {
          offsets[index] = Math.max(offsets[index], -Math.max(0, rawLefts[index] - slotRect.left));
        }
      }

      const symLefts = rawLefts.map((left, index) => left + offsets[index]);
      const symRights = rawRights.map((right, index) => right + offsets[index]);

      resolveCollisions(rawLefts, rawRights, offsets, symLefts, symRights, barRect);

      geometries.forEach((geometry, index) => {
        if (!geometry.tokenEl) return;
        const tokenElement = /** @type {HTMLElement} */ (geometry.tokenEl);
        const fontSizePx = parseFloat(getComputedStyle(tokenElement).fontSize);
        if (!fontSizePx) return;
        tokenElement.style.setProperty('--chart-token-offset-x', `${(offsets[index] / fontSizePx).toFixed(3)}em`);
      });
    });

    Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-body')).forEach((barBodyEl) => {
      const collisionScale = getBarBodyCollisionScale(barBodyEl);
      if (collisionScale >= 0.995) return;
      const currentFontPx = parseFloat(getComputedStyle(barBodyEl).fontSize);
      if (!currentFontPx) return;
      barBodyEl.style.fontSize = `${(currentFontPx * collisionScale * textScaleCompensation).toFixed(2)}px`;
    });

    Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-body')).forEach((barBodyEl) => {
      applySingleChordAnchor(barBodyEl);
    });

    Array.from(document.querySelectorAll<HTMLElement>('.chart-bar-body.chart-bar-body-subdivided, .chart-bar-body.chart-bar-body-halves')).forEach((barBodyEl) => {
      const slots: HTMLElement[] = Array.from(barBodyEl.querySelectorAll('.chart-token-slot')) as HTMLElement[];
      if (slots.length < 2) return;

      slots.forEach((slotEl) => {
        const tokenEl = slotEl.querySelector('.chart-token') as HTMLElement | null;
        if (!tokenEl) return;
        tokenEl.style.removeProperty('--chart-token-offset-x');
      });

      const barRect = barBodyEl.getBoundingClientRect();
      const geometries = slots.map((slot) => measureTokenGeometry(slot));
      const rawLefts = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.left : geometry.slotRect.left));
      const rawRights = geometries.map((geometry) => (geometry.symbolRect ? geometry.symbolRect.right : geometry.slotRect.right));
      const offsets = geometries.map((geometry) => geometry.beatTargetX - geometry.anchorX);

      for (let index = 0; index < geometries.length; index += 1) {
        const { slotRect } = geometries[index];
        if (offsets[index] > 0) {
          offsets[index] = Math.min(offsets[index], Math.max(0, slotRect.right - rawRights[index]));
        } else if (offsets[index] < 0) {
          offsets[index] = Math.max(offsets[index], -Math.max(0, rawLefts[index] - slotRect.left));
        }
      }

      const symLefts = rawLefts.map((left, index) => left + offsets[index]);
      const symRights = rawRights.map((right, index) => right + offsets[index]);
      resolveCollisions(rawLefts, rawRights, offsets, symLefts, symRights, barRect);

      geometries.forEach((geometry, index) => {
        if (!geometry.tokenEl) return;
        const tokenElement = /** @type {HTMLElement} */ (geometry.tokenEl);
        const fontSizePx = parseFloat(getComputedStyle(tokenElement).fontSize);
        if (!fontSizePx) return;
        tokenElement.style.setProperty('--chart-token-offset-x', `${(offsets[index] / fontSizePx).toFixed(3)}em`);
      });
    });
  }

  function renderDiagnostics(playbackPlan) {
    if (!diagnosticsList) return;
    const diagnostics = [...(playbackPlan?.diagnostics || [])];
    diagnosticsList.innerHTML = diagnostics.length
      ? diagnostics.map((diagnostic) => `<li>${diagnostic.level}: ${diagnostic.message}</li>`).join('')
      : '<li>No diagnostics.</li>';
  }

  return {
    renderSheet,
    updateSheetGridGap,
    applyOpticalPlacements,
    renderDiagnostics
  };
}
