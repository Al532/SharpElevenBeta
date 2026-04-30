import { CHART_DISPLAY_CONFIG } from '../../config/trainer-config.js';

const {
  layout: CHART_LAYOUT_CONFIG,
  density: CHART_DENSITY_CONFIG,
  tokenMetrics: CHART_TOKEN_METRICS_CONFIG
} = CHART_DISPLAY_CONFIG;

export type ChartGridRow = {
  bars: any[],
  firstBar: any,
  previousBar: any,
  rowTimeSignature: string | null,
  startCellIndex: number,
  leadingEmptyCells: number,
  leadingEmptySlots: number,
  totalSlots: number,
  sourceCellsPerMeasure: number
};

export type ChartRenderedCell =
  | { kind: 'empty', slotSpan: number }
  | { kind: 'emptyMeasure', slotSpan: number }
  | { kind: 'bar', bar: any, isRowStart: boolean, sectionChanged: boolean };

export type ChartRenderedRow = ChartGridRow & {
  sectionChanged: boolean,
  rowColumnCount: number,
  cells: ChartRenderedCell[]
};

export type ChartGridLayoutModel = {
  rows: ChartRenderedRow[]
};

export type ChartBarBodyLayout = {
  className: string,
  style: string,
  parts: number,
  placements: Array<{ start: number, end: number }>
};

export function isRepeatTokenKind(kind) {
  return kind === 'repeat_previous_bar' || kind === 'repeat_previous_two_bars';
}

export function isSlashMarkerTokenKind(kind) {
  return kind === 'slash_marker';
}

export function isAlternateChordTokenKind(kind) {
  return kind === 'alternate_chord';
}

export function getMainDisplayTokens(bar) {
  return (Array.isArray(bar?.displayTokens) ? bar.displayTokens : [])
    .filter((token) => !isAlternateChordTokenKind(token?.kind));
}

function createFlattenedAlternateToken(sourceToken, alternateToken) {
  return {
    ...JSON.parse(JSON.stringify(alternateToken)),
    kind: 'alternate_chord',
    displayOnly: true,
    sourceCellIndex: Number.isInteger(sourceToken?.sourceCellIndex)
      ? Number(sourceToken.sourceCellIndex)
      : alternateToken.sourceCellIndex,
    sourceCellCount: Number.isInteger(sourceToken?.sourceCellCount)
      ? Number(sourceToken.sourceCellCount)
      : alternateToken.sourceCellCount
  };
}

export function getAlternateDisplayTokens(bar) {
  return (Array.isArray(bar?.displayTokens) ? bar.displayTokens : []).flatMap((token) => {
    const tokens = [];
    if (token?.alternate?.symbol) tokens.push(createFlattenedAlternateToken(token, token.alternate));
    if (isAlternateChordTokenKind(token?.kind)) tokens.push(JSON.parse(JSON.stringify(token)));
    return tokens;
  });
}

export function getTokenSourceCellIndex(token, fallback = 0) {
  return Number.isInteger(token?.sourceCellIndex) ? Number(token.sourceCellIndex) : fallback;
}

export function getTokenSourceCellCount(token, fallback = 1) {
  return Number.isInteger(token?.sourceCellCount) ? Number(token.sourceCellCount) : fallback;
}

export function createAlternateLaneGroups(alternateTokens, mainTokens, parts) {
  const normalizedParts = Math.max(1, Number(parts || 1));
  const sourceCellCount = Math.max(
    1,
    Number(alternateTokens.find(token => Number.isInteger(token?.sourceCellCount))?.sourceCellCount || normalizedParts)
  );
  const mainIndexes = getMainDisplayTokens({ displayTokens: mainTokens })
    .map((token) => getTokenSourceCellIndex(token, -1))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right);
  const remainingAlternates = [...alternateTokens]
    .sort((left, right) => getTokenSourceCellIndex(left) - getTokenSourceCellIndex(right));
  const groups = [];

  while (remainingAlternates.length > 0) {
    const first = remainingAlternates.shift();
    const startIndex = Math.max(0, Math.min(sourceCellCount - 1, getTokenSourceCellIndex(first)));
    const nextMainIndex = mainIndexes.find((index) => index > startIndex);
    const endIndex = Math.max(startIndex + 1, nextMainIndex ?? sourceCellCount);
    const tokens = [first];

    for (let index = 0; index < remainingAlternates.length;) {
      const alternateIndex = getTokenSourceCellIndex(remainingAlternates[index]);
      if (alternateIndex >= endIndex) {
        index += 1;
        continue;
      }
      tokens.push(remainingAlternates.splice(index, 1)[0]);
    }

    groups.push({
      startIndex,
      endIndex,
      sourceCellCount,
      leftPercent: (startIndex / sourceCellCount) * 100,
      rightPercent: 100 - ((endIndex / sourceCellCount) * 100),
      tokens
    });
  }

  return groups;
}

export function getTokenVisualMetrics(token) {
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

export function getSourceCellsPerMeasure(cellsPerRow, measureSlotsPerRow) {
  const normalizedCellsPerRow = Number(cellsPerRow || 0);
  const normalizedMeasureSlotsPerRow = Number(measureSlotsPerRow || 0);
  if (normalizedCellsPerRow > 0 && normalizedMeasureSlotsPerRow > 0) {
    return Math.max(1, normalizedCellsPerRow / normalizedMeasureSlotsPerRow);
  }
  return 4;
}

export function getFullMeasureSlotCountFromSourceCells(sourceCellCount, sourceCellsPerMeasure) {
  const normalizedSourceCellCount = Math.max(0, Number(sourceCellCount || 0));
  const normalizedSourceCellsPerMeasure = Math.max(1, Number(sourceCellsPerMeasure || 4));
  return Math.max(0, Math.floor(normalizedSourceCellCount / normalizedSourceCellsPerMeasure));
}

export function getBarRhythmicSlotCount(bar, fallback = 1) {
  const cellSlots = Array.isArray(bar?.playback?.cellSlots) ? bar.playback.cellSlots : [];
  if (cellSlots.length > 0) return Math.max(1, cellSlots.length);

  const displayTokens = Array.isArray(bar?.displayTokens) ? bar.displayTokens : [];
  const sourceCellCount = Number(displayTokens.find(token => Number.isInteger(token?.sourceCellCount))?.sourceCellCount || 0);
  return Math.max(1, Number.isFinite(sourceCellCount) && sourceCellCount > 0 ? sourceCellCount : fallback);
}

export function getLayoutRowMeasureSlotCount(
  rowBars,
  rowStartCellIndex,
  leadingEmptyCells,
  leadingEmptySlots,
  sourceCellsPerMeasure
) {
  let sourceCellCursor = Number(rowStartCellIndex || 0) + Math.max(0, Number(leadingEmptyCells || 0));
  let measureSlotCount = Math.max(0, Number(leadingEmptySlots || 0));

  for (const bar of rowBars || []) {
    if (Number.isInteger(bar?.layoutStartCellIndex)) {
      const barStartCellIndex = Number(bar.layoutStartCellIndex);
      const gap = barStartCellIndex - sourceCellCursor;
      measureSlotCount += getFullMeasureSlotCountFromSourceCells(gap, sourceCellsPerMeasure);
      sourceCellCursor = Math.max(sourceCellCursor, barStartCellIndex);
    }

    measureSlotCount += 1;
    sourceCellCursor += getBarRhythmicSlotCount(bar, sourceCellsPerMeasure);
  }

  return measureSlotCount;
}

export function buildRenderedRows(viewModel, barTimeSigDisplay, defaultSlotsPerRow): ChartGridRow[] {
  const bars = Array.isArray(viewModel?.bars) ? viewModel.bars : [];
  const layoutRows = Array.isArray(viewModel?.layout?.systems?.rows) ? viewModel.layout.systems.rows : [];
  const cellsPerRow = Number(viewModel?.layout?.systems?.cellsPerRow || 0);
  const inferredSlotsPerRow = Number.isFinite(cellsPerRow) && cellsPerRow > 0
    ? Math.max(1, Math.round(cellsPerRow / 4))
    : defaultSlotsPerRow;
  const sourceCellsPerMeasure = getSourceCellsPerMeasure(cellsPerRow, inferredSlotsPerRow);

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
      const startCellIndex = Number(row?.startCellIndex || row?.start_cell_index || 0);
      const leadingEmptyCells = Math.max(0, Number(row?.leadingEmptyCells || row?.leading_empty_cells || 0));
      const leadingEmptySlots = Math.max(
        0,
        Number(row?.leadingEmptyBars || row?.leading_empty_bars || getFullMeasureSlotCountFromSourceCells(
          leadingEmptyCells,
          sourceCellsPerMeasure
        ))
      );
      const minimumTotalSlots = Math.max(
        inferredSlotsPerRow,
        getLayoutRowMeasureSlotCount(
          resolvedBars,
          startCellIndex,
          leadingEmptyCells,
          leadingEmptySlots,
          sourceCellsPerMeasure
        )
      );

      return {
        bars: resolvedBars,
        firstBar,
        previousBar: rowStartIndex > 0 ? bars[rowStartIndex - 1] : null,
        rowTimeSignature: rowStartIndex >= 0 ? (barTimeSigDisplay[rowStartIndex] || null) : null,
        startCellIndex,
        leadingEmptyCells,
        leadingEmptySlots,
        totalSlots: Math.max(1, minimumTotalSlots),
        sourceCellsPerMeasure
      };
    }).filter((row) => row.firstBar);
  }

  const rows: ChartGridRow[] = [];
  for (let index = 0; index < bars.length; index += defaultSlotsPerRow) {
    const rowBars = bars.slice(index, index + defaultSlotsPerRow);
    const firstBar = rowBars[0] || null;
    if (!firstBar) continue;
    rows.push({
      bars: rowBars,
      firstBar,
      previousBar: index > 0 ? bars[index - 1] : null,
      rowTimeSignature: barTimeSigDisplay[index] || null,
      startCellIndex: index,
      leadingEmptyCells: 0,
      leadingEmptySlots: 0,
      totalSlots: defaultSlotsPerRow,
      sourceCellsPerMeasure: 4
    });
  }
  return rows;
}

export function getCellSlotPlacements(bar, tokenCount) {
  const tokens = getMainDisplayTokens(bar);
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

export function getBarBodyLayout(bar, _fallbackTimeSignature = ''): ChartBarBodyLayout {
  const tokens = getMainDisplayTokens(bar);
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

export function isGraphicSpacerBar(bar) {
  const hasDisplayTokens = getMainDisplayTokens(bar).length > 0 || getAlternateDisplayTokens(bar).length > 0;
  const hasPlaybackSlots = Array.isArray(bar?.playbackSlots) && bar.playbackSlots.length > 0;
  const hasPlaybackObjectSlots = Array.isArray(bar?.playback?.slots) && bar.playback.slots.length > 0;
  return !hasDisplayTokens
    && !hasPlaybackSlots
    && !hasPlaybackObjectSlots
    && getBarRhythmicSlotCount(bar, 0) > 0;
}

export function createChartGridLayoutModel(
  viewModel,
  barTimeSigDisplay,
  defaultSlotsPerRow: number = CHART_LAYOUT_CONFIG.barsPerRow
): ChartGridLayoutModel {
  const rows = buildRenderedRows(viewModel, barTimeSigDisplay, defaultSlotsPerRow).map((row) => {
    const sectionChanged = Boolean(row.firstBar.sectionLabel)
      && (!row.previousBar || row.previousBar.sectionId !== row.firstBar.sectionId);
    let previousBarInRow = row.previousBar || null;
    const cells: ChartRenderedCell[] = [];
    let rowVisualSlotCount = 0;
    let rowCellCursor = Number(row.startCellIndex || 0);

    if (row.leadingEmptySlots > 0) {
      cells.push({ kind: 'empty', slotSpan: row.leadingEmptySlots });
      rowVisualSlotCount += row.leadingEmptySlots;
    }

    rowCellCursor += Math.max(0, Number(row.leadingEmptyCells || 0));
    row.bars.forEach((bar, index) => {
      if (Number.isInteger(bar.layoutStartCellIndex)) {
        const gap = Number(bar.layoutStartCellIndex) - rowCellCursor;
        const gapSlots = getFullMeasureSlotCountFromSourceCells(gap, row.sourceCellsPerMeasure);
        if (gapSlots > 0) {
          cells.push({ kind: 'emptyMeasure', slotSpan: gapSlots });
          rowVisualSlotCount += gapSlots;
        }
        rowCellCursor = Math.max(rowCellCursor, Number(bar.layoutStartCellIndex));
      }
      const barSectionChanged = Boolean(bar.sectionLabel)
        && previousBarInRow
        && previousBarInRow.sectionId !== bar.sectionId;
      cells.push({
        kind: 'bar',
        bar,
        isRowStart: index === 0,
        sectionChanged: index > 0 && barSectionChanged
      });
      rowVisualSlotCount += 1;
      previousBarInRow = bar;
      rowCellCursor += getBarRhythmicSlotCount(bar, row.sourceCellsPerMeasure);
    });

    return {
      ...row,
      sectionChanged,
      rowColumnCount: Math.max(1, Number(row.totalSlots || 0), rowVisualSlotCount),
      cells
    };
  });

  return { rows };
}
