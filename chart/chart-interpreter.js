import { createChartPlaybackPlan } from './chart-types.js';

const MAX_PLAYBACK_STEPS = 1024;

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

  return repeatMap;
}

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

function collectNavigationTargets(bars) {
  let segnoIndex = null;
  let codaIndex = null;

  for (const [index, bar] of bars.entries()) {
    if (bar.flags.includes('segno') && segnoIndex === null) segnoIndex = index;
    if (bar.flags.includes('coda') && codaIndex === null) codaIndex = index;
  }

  return { segnoIndex, codaIndex };
}

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
    notationKind: bar.notation.kind,
    endings: [...bar.endings],
    flags: [...bar.flags],
    directives: JSON.parse(JSON.stringify(bar.directives)),
    comments: [...bar.comments]
  };
}

function findDirective(bar, type) {
  return (bar.directives || []).find(directive => directive?.type === type) || null;
}

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

export function createChartPlaybackPlanFromDocument(chartDocument, options = {}) {
  const bars = chartDocument?.bars || [];
  const repeatMap = buildRepeatMap(bars);
  const endingMap = buildEndingMap(bars);
  const navigationTargets = collectNavigationTargets(bars);
  const diagnostics = [];
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
      bar.flags.includes('repeat_start_barline')
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

    if (bar.flags.includes('repeat_end_barline') && repeatContext && repeatContext.endIndex === index) {
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

  return createChartPlaybackPlan({
    document: chartDocument,
    entries,
    diagnostics,
    navigation: navigationTargets
  });
}
