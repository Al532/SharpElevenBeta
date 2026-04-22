import type {
  ChartCellSlot,
  ChartChordSlot,
  ChartDocument,
  ChartPlaybackDiagnostic,
  ChartPlaybackEntry,
  ChartPlaybackNavigation,
  RichChartBar
} from '../core/types/contracts';

import { createChartPlaybackPlan } from './chart-types.js';
import { contextualizeChordSlotCollections } from './chart-contextual-qualities.js';

const MAX_PLAYBACK_STEPS = 1024;

type CreateChartPlaybackPlanFromDocumentOptions = {
  stopAtFine?: boolean
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

  for (const [index, bar] of bars.entries()) {
    if (bar.flags.includes('segno') && segnoIndex === null) segnoIndex = index;
    if (bar.flags.includes('coda') && codaIndex === null) codaIndex = index;
  }

  return { segnoIndex, codaIndex };
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
    if (!cellSlot?.chord) continue;
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

/**
 * @param {ChartDocument | null | undefined} chartDocument
 * @param {CreateChartPlaybackPlanFromDocumentOptions} [options]
 * @returns {import('../core/types/contracts').ChartPlaybackPlan}
 */
export function createChartPlaybackPlanFromDocument(chartDocument, options: CreateChartPlaybackPlanFromDocumentOptions = {}) {
  const bars = chartDocument?.bars || [];
  const repeatMap = buildRepeatMap(bars);
  const endingMap = buildEndingMap(bars);
  const navigationTargets = collectNavigationTargets(bars);
  /** @type {ChartPlaybackDiagnostic[]} */
  const diagnostics = [];
  const unsupportedDirectiveTypes = new Set([
    'repeat_hint',
    'dc_on_cue',
    'open_vamp',
    'open_instruction',
    'vamp_instruction',
    'fade_out'
  ]);
  const reportedUnsupportedDirectives = new Set();
  /** @type {ChartPlaybackEntry[]} */
  const entries = [];
  let repeatContext = null;
  let pendingJump = null;
  let visitCounter = 0;
  let index = 0;

  while (index < bars.length && visitCounter < MAX_PLAYBACK_STEPS) {
    const bar = bars[index];
    const activeEndingPass = repeatContext?.pass || 1;
    const explicitEndings = endingMap.get(index);

    if (explicitEndings && explicitEndings.size > 0 && !explicitEndings.has(activeEndingPass)) {
      index += 1;
      continue;
    }

    entries.push(createEntry(bar, visitCounter));
    visitCounter += 1;

    const dcAlEnding = findDirective(bar, 'dc_al_ending');
    const dcAlFine = findDirective(bar, 'dc_al_fine');
    const dcAlCoda = findDirective(bar, 'dc_al_coda');
    const dsAlFine = findDirective(bar, 'ds_al_fine');
    const dsAlCoda = findDirective(bar, 'ds_al_coda');
    const dsAlEnding = findDirective(bar, 'ds_al_ending');

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

    if (dcAlEnding) {
      pendingJump = { type: 'dc_al_ending', targetIndex: 0, ending: Number(dcAlEnding.ending || 2) };
    } else if (dcAlFine) {
      pendingJump = { type: 'dc_al_fine', targetIndex: 0, stopAtFine: true };
    } else if (dcAlCoda) {
      pendingJump = { type: 'dc_al_coda', targetIndex: 0, jumpToCoda: true };
    } else if (dsAlFine) {
      pendingJump = { type: 'ds_al_fine', targetIndex: navigationTargets.segnoIndex ?? 0, stopAtFine: true };
    } else if (dsAlCoda) {
      pendingJump = { type: 'ds_al_coda', targetIndex: navigationTargets.segnoIndex ?? 0, jumpToCoda: true };
    } else if (dsAlEnding) {
      pendingJump = { type: 'ds_al_ending', targetIndex: navigationTargets.segnoIndex ?? 0, ending: Number(dsAlEnding.ending || 2) };
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
        pass: 1,
        maxPass: Math.max(2, findHighestEndingWithinRange(endingMap, index, endIndex))
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

    if (pendingJump) {
      if (pendingJump.ending) {
        index = pendingJump.targetIndex;
        repeatContext = {
          startIndex: pendingJump.targetIndex,
          endIndex: repeatMap.get(pendingJump.targetIndex) ?? pendingJump.targetIndex,
          pass: pendingJump.ending,
          maxPass: pendingJump.ending
        };
        pendingJump = null;
        continue;
      }

      if (pendingJump.jumpToCoda) {
        if (navigationTargets.codaIndex === null) {
          diagnostics.push({
            level: 'warning',
            code: 'missing_coda_target',
            message: `No coda target found for ${pendingJump.type}.`
          });
        } else {
          index = navigationTargets.codaIndex;
          pendingJump = null;
          continue;
        }
      }

      if (pendingJump.stopAtFine && bar.flags.includes('fine')) break;

      index = pendingJump.targetIndex;
      pendingJump = null;
      continue;
    }

    if (options.stopAtFine && bar.flags.includes('fine')) break;
    index += 1;
  }

  if (visitCounter >= MAX_PLAYBACK_STEPS) {
    diagnostics.push({
      level: 'error',
      code: 'playback_plan_limit_reached',
      message: 'Playback plan generation stopped after reaching the maximum step count.'
    });
  }

  const contextualizedPlaybackSlotsByEntry = contextualizeChordSlotCollections(
    entries.map((entry) => entry?.playbackSlots || [])
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
    navigation: navigationTargets
  });
}
