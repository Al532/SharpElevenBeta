import type {
  ChartCellSlot,
  ChartChordSlot,
  ChartDocument,
  ChartPlaybackDiagnostic,
  ChartPlaybackEntry,
  ChartPlaybackNavigation,
  RichChartBar
} from '../src/core/types/contracts';

import { createChartPlaybackPlan } from './chart-types.js';
import {
  CHORD_ENRICHMENT_MODES,
  reharmonizeChordSlotCollections
} from './reharm.js';

const MAX_PLAYBACK_STEPS = 1024;

type CreateChartPlaybackPlanFromDocumentOptions = {
  stopAtFine?: boolean,
  chordEnrichmentMode?: string,
  repeatCount?: number
};

/**
 * @param {RichChartBar[]} bars
 * @returns {Map<number, number>}
 */
function buildRepeatMap(bars) {
  const stack = [];
  const repeatMap = new Map();

  for (const [index, bar] of bars.entries()) {
    if (bar.flags.includes('repeat_start_barline')) stack.push(index);
    if (bar.flags.includes('repeat_end_barline')) {
      const startIndex = stack.pop();
      if (Number.isInteger(startIndex)) repeatMap.set(startIndex, index);
    }
  }

  const sectionStack = [];
  for (const [index, bar] of bars.entries()) {
    if (bar.flags.includes('section_start_barline')) sectionStack.push(index);
    if (bar.flags.includes('section_end_barline')) {
      const startIndex = sectionStack.pop();
      if (!Number.isInteger(startIndex) || repeatMap.has(startIndex)) continue;
      const hasEndings = bars.slice(startIndex, index + 1).some(
        (currentBar) => Array.isArray(currentBar?.endings) && currentBar.endings.some(Number.isInteger)
      );
      if (hasEndings) repeatMap.set(startIndex, index);
    }
  }

  return repeatMap;
}

/**
 * @param {RichChartBar[]} bars
 * @returns {Map<number, Set<number>>}
 */
function buildEndingMap(bars) {
  const endingMap = new Map();
  const repeatMap = buildRepeatMap(bars);

  for (const [startIndex, endIndex] of repeatMap.entries()) {
    let activeEndings = null;

    for (let index = startIndex; index <= endIndex; index += 1) {
      const bar = bars[index];
      const explicitEndings = Array.isArray(bar?.endings)
        ? bar.endings.filter(Number.isInteger)
        : [];

      if (explicitEndings.length > 0) {
        activeEndings = new Set(explicitEndings);
        endingMap.set(index, new Set(activeEndings));
        continue;
      }

      if (activeEndings && activeEndings.size > 0) {
        endingMap.set(index, new Set(activeEndings));
      }
    }
  }

  for (const [index, bar] of bars.entries()) {
    if (!Array.isArray(bar.endings) || bar.endings.length === 0) continue;
    if (endingMap.has(index)) continue;
    const explicitEndings = bar.endings.filter(Number.isInteger);
    if (explicitEndings.length === 0) continue;
    endingMap.set(index, new Set(explicitEndings));
  }

  return endingMap;
}

/**
 * @param {RichChartBar[]} bars
 * @returns {ChartPlaybackNavigation}
 */
function collectNavigationTargets(bars) {
  let segnoIndex = null;
  let codaIndex = null;
  let codaJumpIndex = null;
  const codaIndices = [];

  for (const [index, bar] of bars.entries()) {
    if (bar.flags.includes('segno') && segnoIndex === null) segnoIndex = index;
    if (bar.flags.includes('coda')) codaIndices.push(index);
  }

  if (codaIndices.length > 1) {
    codaJumpIndex = codaIndices[0];
    codaIndex = codaIndices[1];
  } else if (codaIndices.length === 1) {
    codaIndex = codaIndices[0];
  }

  return { segnoIndex, codaIndex, codaJumpIndex };
}

/**
 * @param {RichChartBar} bar
 * @param {number} visitIndex
 * @returns {ChartPlaybackEntry}
 */
function createEntry(bar, visitIndex) {
  return {
    sequenceIndex: visitIndex + 1,
    barId: bar.id,
    barIndex: bar.index,
    sectionId: bar.sectionId,
    sectionLabel: bar.sectionLabel,
    timeSignature: bar.timeSignature,
    displayTokens: JSON.parse(JSON.stringify(bar.notation.tokens)),
    playbackSlots: JSON.parse(JSON.stringify(bar.playback.slots)),
    playbackCellSlots: JSON.parse(JSON.stringify(bar.playback.cellSlots || [])),
    notationKind: bar.notation.kind,
    endings: [...bar.endings],
    flags: [...bar.flags],
    directives: JSON.parse(JSON.stringify(bar.directives)),
    comments: [...bar.comments],
    textAnnotations: JSON.parse(JSON.stringify(bar.textAnnotations || [])),
    sourceEvent: bar.sourceEvent,
    repeatedFromBar: bar.repeatedFromBar,
    specialEvents: JSON.parse(JSON.stringify(bar.specialEvents || [])),
    annotationMisc: [...(bar.annotationMisc || [])],
    spacerCount: Number(bar.spacerCount || 0),
    chordSizes: [...(bar.chordSizes || [])],
    overlaySlots: JSON.parse(JSON.stringify(bar.playback.overlaySlots || []))
  };
}

/**
 * @param {ChartCellSlot[]} [playbackCellSlots]
 * @param {ChartChordSlot[]} [contextualizedPlaybackSlots]
 * @returns {ChartCellSlot[]}
 */
function applyContextualizedPlaybackSlotsToCellSlots(playbackCellSlots = [], contextualizedPlaybackSlots = []) {
  if (!Array.isArray(playbackCellSlots) || playbackCellSlots.length === 0) {
    return JSON.parse(JSON.stringify(playbackCellSlots || []));
  }

  const remappedCellSlots = JSON.parse(JSON.stringify(playbackCellSlots));
  let contextualizedIndex = 0;

  for (const cellSlot of remappedCellSlots) {
    if (!cellSlot?.chord || !isPlayableChordSlot(cellSlot.chord)) continue;
    const contextualizedSlot = contextualizedPlaybackSlots[contextualizedIndex] || null;
    contextualizedIndex += 1;
    if (!contextualizedSlot) continue;
    cellSlot.chord.symbol = contextualizedSlot.symbol || cellSlot.chord.symbol;
    cellSlot.chord.modifier = contextualizedSlot.quality || cellSlot.chord.modifier;
    if (Object.prototype.hasOwnProperty.call(contextualizedSlot, 'bass')) {
      cellSlot.chord.bass = contextualizedSlot.bass;
    }
    if (Object.prototype.hasOwnProperty.call(contextualizedSlot, 'displayPrefix')) {
      cellSlot.chord.display_prefix = contextualizedSlot.displayPrefix || '';
    }
  }

  return remappedCellSlots;
}

/**
 * @param {ChartChordSlot | null | undefined} slot
 * @returns {boolean}
 */
function isPlayableChordSlot(slot) {
  const root = String(slot?.root || '').trim();
  const symbol = String(slot?.symbol || '').trim();
  if (!root && !symbol) return false;
  return !['p', 'n', 'r', 'x', 'W'].includes(root || symbol);
}

/**
 * @param {RichChartBar} bar
 * @param {string} type
 * @returns {Record<string, unknown> | null}
 */
function findDirective(bar, type) {
  return (bar.directives || []).find((directive) => directive?.type === type) || null;
}

/**
 * @param {Map<number, Set<number>>} endingMap
 * @param {number} startIndex
 * @param {number} endIndex
 * @returns {number}
 */
function findHighestEndingWithinRange(endingMap, startIndex, endIndex) {
  let highest = 1;
  for (let index = startIndex; index <= endIndex; index += 1) {
    const endings = endingMap.get(index);
    if (!endings) continue;
    for (const ending of endings) {
      if (Number.isInteger(ending)) highest = Math.max(highest, ending);
    }
  }
  return highest;
}

function normalizeRepeatCount(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(32, Math.round(parsed)));
}

function getRepeatHintWithinRange(bars, startIndex, endIndex) {
  let highestHint = 0;
  for (let index = startIndex; index <= endIndex; index += 1) {
    for (const directive of bars[index]?.directives || []) {
      if (directive?.type !== 'repeat_hint') continue;
      highestHint = Math.max(highestHint, normalizeRepeatCount(directive.times, 0));
    }
  }
  return highestHint || null;
}

function hasAlCodaDirective(bars) {
  return bars.some((bar) => (bar.directives || []).some(
    (directive) => directive?.type === 'dc_al_coda' || directive?.type === 'ds_al_coda'
  ));
}

function findCodaOutroStartIndex(bars, navigationTargets) {
  if (navigationTargets.codaIndex === null) return null;
  return navigationTargets.codaIndex;
}

/**
 * @param {ChartDocument | null | undefined} chartDocument
 * @param {CreateChartPlaybackPlanFromDocumentOptions} [options]
 * @returns {import('../src/core/types/contracts').ChartPlaybackPlan}
 */
export function createChartPlaybackPlanFromDocument(chartDocument, options: CreateChartPlaybackPlanFromDocumentOptions = {}) {
  const bars = chartDocument?.bars || [];
  const repeatMap = buildRepeatMap(bars);
  const endingMap = buildEndingMap(bars);
  const navigationTargets = collectNavigationTargets(bars);
  const requestedRepeatCount = normalizeRepeatCount(options.repeatCount, 1);
  const codaIsPartOfForm = hasAlCodaDirective(bars);
  const codaOutroStartIndex = codaIsPartOfForm ? null : findCodaOutroStartIndex(bars, navigationTargets);
  /** @type {ChartPlaybackDiagnostic[]} */
  const diagnostics = [];
  const unsupportedDirectiveTypes = new Set([
    'dc_on_cue',
    'open_vamp',
    'open_instruction',
    'vamp_instruction',
    'fade_out'
  ]);
  const reportedUnsupportedDirectives = new Set();
  /** @type {ChartPlaybackEntry[]} */
  const entries = [];
  let visitCounter = 0;

  function reportUnsupportedDirectives(bar) {
    for (const directive of bar.directives || []) {
      const directiveType = typeof directive?.type === 'string' ? directive.type : '';
      if (!directiveType || !unsupportedDirectiveTypes.has(directiveType)) continue;
      const diagnosticKey = `${directiveType}:${bar.id}`;
      if (reportedUnsupportedDirectives.has(diagnosticKey)) continue;
      reportedUnsupportedDirectives.add(diagnosticKey);
      diagnostics.push({
        level: 'warning',
        code: `unsupported_${directiveType}`,
        message: `Bar ${bar.index} includes ${directiveType}, which is preserved but not yet interpreted by playback.`
      });
    }
  }

  function pushMissingTargetDiagnostic(code, message) {
    if (reportedUnsupportedDirectives.has(code)) return;
    reportedUnsupportedDirectives.add(code);
    diagnostics.push({
      level: 'warning',
      code,
      message
    });
  }

  function runFormPass({ includeCodaOutro = false } = {}) {
    let repeatContext = null;
    let jumpState = null;
    let index = 0;
    const formEndIndex = includeCodaOutro || codaOutroStartIndex === null ? bars.length : codaOutroStartIndex;

    while (index < bars.length && index < formEndIndex && visitCounter < MAX_PLAYBACK_STEPS) {
      const bar = bars[index];
      const activeEndingPass = repeatContext?.pass || jumpState?.forcedEnding || 1;
      const explicitEndings = endingMap.get(index);

      if (explicitEndings && explicitEndings.size > 0 && !explicitEndings.has(activeEndingPass)) {
        index += 1;
        continue;
      }

      entries.push(createEntry(bar, visitCounter));
      visitCounter += 1;
      reportUnsupportedDirectives(bar);

      if (jumpState?.stopAtFine && bar.flags.includes('fine')) break;

      if (jumpState?.jumpToCoda && navigationTargets.codaJumpIndex === index) {
        if (navigationTargets.codaIndex === null) {
          pushMissingTargetDiagnostic('missing_coda_target', `No coda target found for ${jumpState.type}.`);
        } else {
          index = navigationTargets.codaIndex;
          jumpState = null;
          continue;
        }
      }

      const dcAlEnding = findDirective(bar, 'dc_al_ending');
      const dcAlFine = findDirective(bar, 'dc_al_fine');
      const dcAlCoda = findDirective(bar, 'dc_al_coda');
      const dsAlFine = findDirective(bar, 'ds_al_fine');
      const dsAlCoda = findDirective(bar, 'ds_al_coda');
      const dsAlEnding = findDirective(bar, 'ds_al_ending');

      if (dcAlEnding || dcAlFine || dcAlCoda || dsAlFine || dsAlCoda || dsAlEnding) {
        if ((dsAlFine || dsAlCoda || dsAlEnding) && navigationTargets.segnoIndex === null) {
          pushMissingTargetDiagnostic('missing_segno_target', `No segno target found for bar ${bar.index}.`);
        }
        if ((dcAlFine || dsAlFine || dcAlEnding || dsAlEnding) && !bars.some((candidate) => candidate.flags.includes('fine'))) {
          pushMissingTargetDiagnostic('missing_fine_target', `${bar.index} uses an al Fine/ending instruction, but no Fine target was found.`);
        }
        if ((dcAlCoda || dsAlCoda) && navigationTargets.codaIndex === null) {
          pushMissingTargetDiagnostic('missing_coda_target', `${bar.index} uses al Coda, but no coda target was found.`);
        }

        if (dcAlEnding) {
          jumpState = { type: 'dc_al_ending', forcedEnding: Number(dcAlEnding.ending || 2), stopAtFine: true };
          index = 0;
          repeatContext = null;
          continue;
        }
        if (dcAlFine) {
          jumpState = { type: 'dc_al_fine', stopAtFine: true };
          index = 0;
          repeatContext = null;
          continue;
        }
        if (dcAlCoda) {
          jumpState = { type: 'dc_al_coda', jumpToCoda: true };
          index = 0;
          repeatContext = null;
          continue;
        }
        if (dsAlEnding) {
          jumpState = { type: 'ds_al_ending', forcedEnding: Number(dsAlEnding.ending || 2), stopAtFine: true };
          index = navigationTargets.segnoIndex ?? 0;
          repeatContext = null;
          continue;
        }
        if (dsAlFine) {
          jumpState = { type: 'ds_al_fine', stopAtFine: true };
          index = navigationTargets.segnoIndex ?? 0;
          repeatContext = null;
          continue;
        }
        if (dsAlCoda) {
          jumpState = { type: 'ds_al_coda', jumpToCoda: true };
          index = navigationTargets.segnoIndex ?? 0;
          repeatContext = null;
          continue;
        }
      }

      if (
        (bar.flags.includes('repeat_start_barline') || bar.flags.includes('section_start_barline'))
        && repeatMap.has(index)
        && (!repeatContext || repeatContext.startIndex !== index)
      ) {
        const endIndex = repeatMap.get(index);
        repeatContext = {
          startIndex: index,
          endIndex,
          pass: jumpState?.forcedEnding || 1,
          maxPass: jumpState?.forcedEnding
            || getRepeatHintWithinRange(bars, index, endIndex)
            || Math.max(2, findHighestEndingWithinRange(endingMap, index, endIndex))
        };
      }

      if ((bar.flags.includes('repeat_end_barline') || bar.flags.includes('section_end_barline')) && repeatContext && repeatContext.endIndex === index) {
        if (repeatContext.pass < repeatContext.maxPass) {
          repeatContext.pass += 1;
          index = repeatContext.startIndex;
          continue;
        }
        repeatContext = null;
      }

      if (options.stopAtFine && bar.flags.includes('fine')) break;
      index += 1;
    }
  }

  for (let pass = 1; pass <= requestedRepeatCount && visitCounter < MAX_PLAYBACK_STEPS; pass += 1) {
    runFormPass({
      includeCodaOutro: codaIsPartOfForm || pass === requestedRepeatCount
    });
  }

  if (visitCounter >= MAX_PLAYBACK_STEPS) {
    diagnostics.push({
      level: 'error',
      code: 'playback_plan_limit_reached',
      message: 'Playback plan generation stopped after reaching the maximum step count.'
    });
  }

  const contextualizedPlaybackSlotsByEntry = reharmonizeChordSlotCollections(
    entries.map((entry) => entry?.playbackSlots || []),
    {
      enrichmentMode: options.chordEnrichmentMode || CHORD_ENRICHMENT_MODES.mainstreamJazz
    }
  );
  entries.forEach((entry, entryIndex) => {
    entry.playbackSlots = contextualizedPlaybackSlotsByEntry[entryIndex] || [];
    entry.playbackCellSlots = applyContextualizedPlaybackSlotsToCellSlots(
      entry.playbackCellSlots,
      entry.playbackSlots
    );
    if (entry.notationKind === 'written') {
      entry.displayTokens = JSON.parse(JSON.stringify(entry.playbackSlots));
    }
  });

  return createChartPlaybackPlan({
    document: chartDocument,
    entries,
    diagnostics,
    navigation: {
      segnoIndex: navigationTargets.segnoIndex,
      codaIndex: navigationTargets.codaIndex
    }
  });
}
