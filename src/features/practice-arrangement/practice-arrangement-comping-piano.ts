import rawRhythmConfig from '../../core/music/piano-rhythm-config.js';
import rawVoicingConfig from '../../core/music/voicing-config.js';
import rawPianoVoicingConfig from '../../core/music/piano-voicing-config.js';
import { applyContextualQualityRules } from '../../core/music/harmony-context.js';
import {
  DEFAULT_SWING_RATIO,
  getSwingFirstSubdivisionDurationBeats,
  getSwingOffbeatPositionBeats,
} from '../../core/music/swing-utils.js';
import { getShortEndingDynamicMultiplier } from '../../core/playback/playback-ending-dynamics.js';
import { isOffbeatPlaybackEndingStyle } from '../../core/playback/playback-ending.js';
import { getMetricBeatStrengths } from '../../core/music/meter.js';
import {
  clamp,
  getInterpolatedWeightMap,
  shuffleArray,
  weightedPick,
  weightedPickExcludingJump,
} from './practice-arrangement-comping-utils.js';

const PIANO_SHAPE_INVERSION_START_INDEX = 2;
const INTERVAL_SEMITONES = {
  '1': 0,
  b2: 1,
  '2': 2,
  b3: 3,
  '3': 4,
  '4': 5,
  '#4': 6,
  b5: 6,
  '5': 7,
  '#5': 8,
  b6: 8,
  '6': 9,
  bb7: 9,
  b7: 10,
  '7': 11,
  b9: 1,
  '9': 2,
  '#9': 3,
  '11': 5,
  '#11': 6,
  b13: 8,
  '13': 9,
};
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
type DrillPianoSampleLayerThresholds = {
  p?: number;
  mf?: number;
  f?: number;
};

type DrillPianoSampleLayerSmoothing = {
  boundaryWindow?: number;
  pToMfLiftDb?: number;
  mfFromPLiftDb?: number;
  mfToFLiftDb?: number;
  fFromMfLiftDb?: number;
};

type DrillPianoRhythmConfig = {
  offBeatOneStepRunProbability?: number;
  onBeatOneStepRunProbability?: number;
  offBeatOneStepRunLengthWeights?: Record<string, number>;
  onBeatOneStepRunLengthWeights?: Record<string, number>;
  resetBeatStartProbability?: number;
  oneStepRunCooldownJumps?: number;
  onBeatJumpWeights?: Record<string, number>;
  offBeatJumpWeights?: Record<string, number>;
  onBeatJumpWeights250Bpm?: Record<string, number>;
  offBeatJumpWeights250Bpm?: Record<string, number>;
  oneStepRunPassingDiminishedProbability?: number;
  pianoSampleLayerThresholds?: DrillPianoSampleLayerThresholds;
  pianoSampleLayerSmoothing?: DrillPianoSampleLayerSmoothing;
  pianoSampleLayerGainDb?: {
    p?: number;
    mf?: number;
    f?: number;
  };
  offBeatShortNoteDurationMultiplier?: number;
  shortNoteDurationRandomness?: number;
  forcedLegatoOverlapMs?: number;
  isolatedTwoHandMinSwitchSeconds?: number;
  noteTimingHumanizeMs?: number;
  oddEvenBeatVolumeSpread?: number;
  offbeatVolumeSpread?: number;
  pianoGlobalDelayMs?: number;
  twoHandExtraTopBaseVolume?: number;
  twoHandGlobalVolumeBoost?: number;
};

type DrillPianoVoicingConfig = {
  defaultMode?: string;
  modes?: Record<string, {
    guideToneIndices?: number[];
    shapes?: Record<string, {
      A?: Array<string | number>;
      B?: Array<string | number>;
    }>;
  }>;
  ranges?: {
    noteRangeLow?: number;
    noteRangeHigh?: number;
    lowestNoteZoneLow?: number;
    lowestNoteZoneHigh?: number;
    lowestNoteZoneCenter?: number;
  };
};

type PracticeArrangementCompingVoicingConfig = {
  DOMINANT_DEFAULT_QUALITY_MAJOR?: Record<string, string>;
  DOMINANT_DEFAULT_QUALITY_MINOR?: Record<string, string>;
  QUALITY_CATEGORY_ALIASES?: Record<string, string[]>;
};

const rhythmConfig = rawRhythmConfig as DrillPianoRhythmConfig;
const voicingConfig = rawVoicingConfig as PracticeArrangementCompingVoicingConfig;
const pianoVoicingConfig = rawPianoVoicingConfig as DrillPianoVoicingConfig;

function chordsMatch(left, right) {
  return Boolean(left && right
    && left.semitones === right.semitones
    && (left.bassSemitones ?? left.semitones) === (right.bassSemitones ?? right.semitones)
    && left.qualityMajor === right.qualityMajor
    && left.qualityMinor === right.qualityMinor);
}

function pianoChoicesMatch(left, right) {
  if (!left?.notes?.length || !right?.notes?.length) return false;
  if (left.notes.length !== right.notes.length) return false;
  for (let index = 0; index < left.notes.length; index++) {
    if (left.notes[index] !== right.notes[index]) return false;
  }
  return true;
}

function formatPianoChoiceDebug(choice) {
  if (!choice?.notes?.length) return 'null';
  return `[${choice.notes.join(',')}]`;
}

function shouldStartOneStepRun(slotKind, nextJump, activeMode = 'piano', previousJump = null) {
  if (activeMode === 'twoHand') return false;
  if (nextJump !== 1) return false;
  if (slotKind === 'offbeat' && previousJump === 1) return false;
  const configuredProbability = slotKind === 'offbeat'
    ? rhythmConfig.offBeatOneStepRunProbability
    : rhythmConfig.onBeatOneStepRunProbability;
  const fallbackProbability = rhythmConfig.onBeatOneStepRunProbability;
  const probability = Number.isFinite(configuredProbability)
    ? Math.max(0, Math.min(1, configuredProbability))
    : (Number.isFinite(fallbackProbability)
        ? Math.max(0, Math.min(1, fallbackProbability))
        : 0);
  return Math.random() < probability;
}

function getOneStepRunRemainingJumps(slotKind) {
  const configuredLengthWeights = slotKind === 'offbeat'
    ? rhythmConfig.offBeatOneStepRunLengthWeights
    : rhythmConfig.onBeatOneStepRunLengthWeights;
  const legacyLengthWeights = rhythmConfig.onBeatOneStepRunLengthWeights || {};
  const rawLengthWeights = configuredLengthWeights || legacyLengthWeights;
  const matchingLengthWeights = Object.fromEntries(
    Object.entries(rawLengthWeights).filter(([length, weight]) => {
      const numericLength = Number(length);
      return Number.isFinite(numericLength) && Number.isFinite(Number(weight)) && Number(weight) > 0;
    })
  );
  const fallbackLengthWeights = Object.fromEntries(
    Object.entries(legacyLengthWeights).filter(([length, weight]) => {
      const numericLength = Number(length);
      if (!Number.isFinite(numericLength) || !Number.isFinite(Number(weight)) || Number(weight) <= 0) return false;
      const isEvenLength = numericLength % 2 === 0;
      return slotKind === 'beat' ? isEvenLength : !isEvenLength;
    })
  );
  const totalNotes = weightedPick(
    Object.keys(matchingLengthWeights).length > 0
      ? matchingLengthWeights
      : fallbackLengthWeights
  );
  if (!Number.isFinite(totalNotes)) return 0;
  return Math.max(0, totalNotes - 2);
}

function getSlotKind(slotIndex) {
  return slotIndex % 2 === 0 ? 'beat' : 'offbeat';
}

function getSlotTimeBeats(slotIndex, swingRatio = DEFAULT_SWING_RATIO) {
  const beatIndex = Math.floor(slotIndex / 2);
  return beatIndex + (slotIndex % 2 === 0 ? 0 : getSwingOffbeatPositionBeats(swingRatio));
}

function getVolumeBeatAnchor(slotIndex) {
  const beatIndex = Math.floor(slotIndex / 2);
  return slotIndex % 2 === 0 ? beatIndex : (beatIndex + 1);
}

function getTempoAdaptiveShortDurationMultiplier(secondsPerBeat) {
  if (!Number.isFinite(secondsPerBeat) || secondsPerBeat <= 0) return 1;
  const tempoBpm = 60 / secondsPerBeat;
  if (tempoBpm < 120) {
    const lowTempoProgress = Math.min(1, (120 - tempoBpm) / 80);
    return 1 + (lowTempoProgress * 0.32);
  }
  if (tempoBpm === 120) return 1;

  const highTempoProgress = Math.min(1, (tempoBpm - 120) / 100);
  return 1 - (highTempoProgress * 0.28);
}

function getBeatPositionInMeasure(beatIndex, beatsPerBar = 4) {
  const normalizedBeatsPerBar = Math.max(1, Number(beatsPerBar) || 4);
  return ((beatIndex % normalizedBeatsPerBar) + normalizedBeatsPerBar) % normalizedBeatsPerBar;
}

function isMetricStrongBeat(beat, beatsPerBar = 4) {
  const normalizedBeatsPerBar = Math.max(1, Number(beatsPerBar) || 4);
  const strengths = getMetricBeatStrengths(normalizedBeatsPerBar);
  return strengths[getBeatPositionInMeasure(beat, normalizedBeatsPerBar)] === 'strong';
}

function getNextOneOrThreeBeat(startBeat, beatsPerBar = 4) {
  const normalizedBeatsPerBar = Math.max(1, Number(beatsPerBar) || 4);
  for (let beat = Math.ceil(startBeat); beat <= Math.ceil(startBeat) + normalizedBeatsPerBar * 2; beat++) {
    if (isMetricStrongBeat(beat, normalizedBeatsPerBar) && beat >= startBeat) {
      return beat;
    }
  }
  return startBeat + normalizedBeatsPerBar;
}

function buildHarmonicBlocks(chords, beatsPerChord, beatsPerBar = 4) {
  const blocks = [];
  let currentBlock = null;

  for (let chordIdx = 0; chordIdx < chords.length; chordIdx++) {
    const chord = chords[chordIdx];
    if (!currentBlock || !chordsMatch(currentBlock.chord, chord)) {
      currentBlock = {
        blockIdx: blocks.length,
        chord,
        startChordIdx: chordIdx,
        endChordIdx: chordIdx,
      };
      blocks.push(currentBlock);
    } else {
      currentBlock.endChordIdx = chordIdx;
    }
  }

  return blocks.map((block, index) => {
    const startBeat = block.startChordIdx * beatsPerChord;
    const endBeat = (block.endChordIdx + 1) * beatsPerChord;
    const nextStrongBeat = getNextOneOrThreeBeat(startBeat + 1, beatsPerBar);
    const usefulEndBeat = Math.min(endBeat, nextStrongBeat, startBeat + beatsPerBar);
    return {
      ...block,
      startBeat,
      endBeat,
      usefulEndBeat,
      nextBlockIdx: index < blocks.length - 1 ? index + 1 : null,
    };
  });
}

function getBlockForTime(blocks, timeBeats) {
  return blocks.find(block => timeBeats >= block.startBeat && timeBeats < block.endBeat) || null;
}

function getLastPreBoundaryOffbeatSlotIndex(boundaryBeat) {
  const beatIndex = Math.floor(boundaryBeat) - 1;
  if (beatIndex < 0) return null;
  return beatIndex * 2 + 1;
}

function slotExistsWithinProgression(slotIndex, totalSlots) {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < totalSlots;
}

function getPreOnbeatEndingOffbeatSlotIndex(endingCue) {
  if (!endingCue || endingCue.style !== 'onbeat_long') return null;
  const targetBeat = Number(endingCue.targetBeat ?? endingCue.targetChordIndex);
  if (!Number.isFinite(targetBeat) || targetBeat <= 0) return null;
  const beatIndex = Math.floor(targetBeat) - 1;
  if (beatIndex < 0) return null;
  return beatIndex * 2 + 1;
}

function getOffbeatEndingSlotIndex(endingCue) {
  if (!endingCue || !isOffbeatPlaybackEndingStyle(endingCue.style)) return null;
  const targetBeat = Number(endingCue.targetBeat ?? endingCue.targetChordIndex);
  if (!Number.isFinite(targetBeat) || targetBeat <= 0) return null;
  const beatIndex = Math.floor(targetBeat) - 1;
  if (beatIndex < 0) return null;
  return beatIndex * 2 + 1;
}

function getInitialSlotIndex(shouldReset, hasIncomingAnticipation = false) {
  if (hasIncomingAnticipation) return 2;
  if (!shouldReset) return 0;
  const resetBeatStartProbability = Number.isFinite(rhythmConfig.resetBeatStartProbability)
    ? Math.max(0, Math.min(1, rhythmConfig.resetBeatStartProbability))
    : 0.5;
  return Math.random() < resetBeatStartProbability ? 0 : 1;
}

function getBoundaryBlockedSlotCount(totalSlots, previousTailBeats, hasIncomingAnticipation, swingRatio = DEFAULT_SWING_RATIO) {
  if (!Number.isInteger(totalSlots) || totalSlots <= 0) {
    return hasIncomingAnticipation ? 3 : 0;
  }

  if (hasIncomingAnticipation) return 3;
  if (!Number.isFinite(previousTailBeats)) return 0;

  for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
    const boundaryGapBeats = previousTailBeats + getSlotTimeBeats(slotIndex, swingRatio);
    if (boundaryGapBeats > getSwingFirstSubdivisionDurationBeats(swingRatio)) {
      return slotIndex;
    }
  }

  return totalSlots;
}

function getJumpWeights(slotKind, activeMode = 'piano', secondsPerBeat = null) {
  const baseWeights = slotKind === 'beat'
    ? rhythmConfig.onBeatJumpWeights
    : rhythmConfig.offBeatJumpWeights;
  const highTempoWeights = slotKind === 'beat'
    ? rhythmConfig.onBeatJumpWeights250Bpm
    : rhythmConfig.offBeatJumpWeights250Bpm;
  const tempoBpm = Number.isFinite(secondsPerBeat) && secondsPerBeat > 0
    ? (60 / secondsPerBeat)
    : null;
  const resolvedWeights = getInterpolatedWeightMap(baseWeights, highTempoWeights, tempoBpm);

  if (activeMode !== 'twoHand') return resolvedWeights;
  return Object.fromEntries(
    Object.entries(resolvedWeights || {}).filter(([jump]) => Number(jump) !== 1)
  );
}

function getRawJumpWeight(weightMap, jump) {
  if (!weightMap || typeof weightMap !== 'object') return null;
  const rawWeight = weightMap[String(jump)] ?? weightMap[jump];
  const weight = Number(rawWeight);
  return Number.isFinite(weight) ? weight : null;
}

function getTempoBpm(secondsPerBeat) {
  return Number.isFinite(secondsPerBeat) && secondsPerBeat > 0
    ? 60 / secondsPerBeat
    : null;
}

function getJumpWeightDebugContext(slotKind, jump, activeMode = 'piano', secondsPerBeat = null) {
  const baseWeights = slotKind === 'beat'
    ? rhythmConfig.onBeatJumpWeights
    : rhythmConfig.offBeatJumpWeights;
  const highTempoWeights = slotKind === 'beat'
    ? rhythmConfig.onBeatJumpWeights250Bpm
    : rhythmConfig.offBeatJumpWeights250Bpm;
  const resolvedWeights = getJumpWeights(slotKind, activeMode, secondsPerBeat);
  return {
    activeMode,
    slotKind,
    jump,
    tempoBpm: getTempoBpm(secondsPerBeat),
    baseWeight: getRawJumpWeight(baseWeights, jump),
    highTempo250BpmWeight: getRawJumpWeight(highTempoWeights, jump),
    resolvedWeight: getRawJumpWeight(resolvedWeights, jump),
  };
}

function isPositiveJumpWeight(weight) {
  return Number.isFinite(weight) && weight > 0;
}

function getSlotDebugLabel(slotIndex, swingRatio = DEFAULT_SWING_RATIO) {
  if (!Number.isFinite(slotIndex)) return 'unknown';
  const timeBeats = getSlotTimeBeats(slotIndex, swingRatio);
  return `${getSlotKind(slotIndex)} slot ${slotIndex} @ beat ${Number(timeBeats.toFixed(3))}`;
}

function getJumpDecision(debugInfo, fromSlot, toSlot) {
  return debugInfo?.jumpDecisions?.find(decision =>
    decision.fromSlot === fromSlot
    && decision.toSlot === toSlot
  ) || null;
}

function getSlotSource(debugInfo, slotIndex) {
  return debugInfo?.slotSources instanceof Map
    ? (debugInfo.slotSources.get(slotIndex) || null)
    : null;
}

function explainTwoSlotGapCause({
  debugInfo,
  fromSlot,
  toSlot,
  isReservedEndingGap = false,
}) {
  const directDecision = getJumpDecision(debugInfo, fromSlot, toSlot);
  if (directDecision) {
    return `direct ${directDecision.source}`;
  }

  const fromSource = getSlotSource(debugInfo, fromSlot);
  const toSource = getSlotSource(debugInfo, toSlot);
  if (toSource?.stage === 'block-representation') {
    return 'block representation inserted the destination slot after the weighted walk';
  }
  if (fromSource?.stage === 'block-representation') {
    return 'block representation inserted the source slot after the weighted walk';
  }
  if (isReservedEndingGap) {
    return 'gap into reserved ending; the ending is scheduled outside piano plan events';
  }
  if (debugInfo?.endingResolution?.removedSlots?.length) {
    return 'reserved-ending resolution removed later candidate slots, changing the final spacing';
  }
  return 'final spacing after plan normalization, not a direct weighted jump';
}

function collectZeroWeightTwoSlotJumpDiagnostics({
  events,
  reservedEndingSlotIndex,
  endingCue,
  activeMode,
  secondsPerBeat,
  swingRatio,
  debugInfo,
}) {
  if (!Array.isArray(events) || events.length === 0) return [];

  const diagnostics = [];
  const addDiagnostic = ({ leftEvent, rightEvent = null, rightSlot, isReservedEndingGap = false }) => {
    const gapSlots = rightSlot - leftEvent.slotIndex;
    if (gapSlots !== 2) return;

    const weightContext = getJumpWeightDebugContext(
      getSlotKind(leftEvent.slotIndex),
      gapSlots,
      activeMode,
      secondsPerBeat
    );
    if (isPositiveJumpWeight(weightContext.resolvedWeight)) return;

    diagnostics.push({
      kind: isReservedEndingGap ? 'event-to-reserved-ending' : 'event-to-event',
      cause: explainTwoSlotGapCause({
        debugInfo,
        fromSlot: leftEvent.slotIndex,
        toSlot: rightSlot,
        isReservedEndingGap,
      }),
      from: {
        slot: leftEvent.slotIndex,
        label: getSlotDebugLabel(leftEvent.slotIndex, swingRatio),
        chordIdx: leftEvent.chordIdx,
        source: getSlotSource(debugInfo, leftEvent.slotIndex),
      },
      to: rightEvent
        ? {
            slot: rightEvent.slotIndex,
            label: getSlotDebugLabel(rightEvent.slotIndex, swingRatio),
            chordIdx: rightEvent.chordIdx,
            source: getSlotSource(debugInfo, rightEvent.slotIndex),
          }
        : {
            slot: rightSlot,
            label: getSlotDebugLabel(rightSlot, swingRatio),
            endingStyle: endingCue?.style || null,
          },
      weightContext,
      directDecision: getJumpDecision(debugInfo, leftEvent.slotIndex, rightSlot),
      endingResolution: debugInfo?.endingResolution || null,
    });
  };

  for (let index = 0; index < events.length - 1; index++) {
    addDiagnostic({
      leftEvent: events[index],
      rightEvent: events[index + 1],
      rightSlot: events[index + 1].slotIndex,
    });
  }

  if (Number.isInteger(reservedEndingSlotIndex)) {
    const lastBeforeEnding = [...events]
      .reverse()
      .find(event => event.slotIndex < reservedEndingSlotIndex);
    if (lastBeforeEnding) {
      addDiagnostic({
        leftEvent: lastBeforeEnding,
        rightSlot: reservedEndingSlotIndex,
        isReservedEndingGap: true,
      });
    }
  }

  return diagnostics;
}

function logZeroWeightTwoSlotJumpDiagnostics(diagnostics, planContext) {
  if (!diagnostics.length || typeof console === 'undefined' || typeof console.info !== 'function') return;
  console.info('[piano-rhythm] jump/gap 2 with zero resolved weight', {
    ...planContext,
    note: 'A weight of 0 only excludes direct weighted picks. Final plan spacing can still become 2 after block coverage or ending reservation adjustments.',
    diagnostics,
  });
}

function getPositiveConfiguredJumpWeight(slotIndex, jump, activeMode = 'piano', secondsPerBeat = null) {
  if (!Number.isFinite(jump) || jump <= 0) return 0;
  const weights = getJumpWeights(getSlotKind(slotIndex), activeMode, secondsPerBeat) || {};
  const rawWeight = weights[String(jump)] ?? weights[jump];
  const weight = Number(rawWeight);
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

function getMaxConfiguredJump(slotKind, activeMode = 'piano', secondsPerBeat = null) {
  const weights = getJumpWeights(slotKind, activeMode, secondsPerBeat) || {};
  let maxJump = 0;
  for (const jump of Object.keys(weights)) {
    const numericJump = Number(jump);
    if (Number.isFinite(numericJump) && numericJump > maxJump) {
      maxJump = numericJump;
    }
  }
  return maxJump;
}

function getReverseEndingCandidateWeight(slotIndex, reservedEndingSlotIndex, activeMode = 'piano', secondsPerBeat = null) {
  if (!Number.isInteger(reservedEndingSlotIndex)) return 0;
  if (!Number.isInteger(slotIndex) || slotIndex >= reservedEndingSlotIndex) return 0;
  const jumpToEnding = reservedEndingSlotIndex - slotIndex;
  const maxConfiguredJump = getMaxConfiguredJump(getSlotKind(slotIndex), activeMode, secondsPerBeat);
  if (jumpToEnding > maxConfiguredJump) return null;
  return getPositiveConfiguredJumpWeight(slotIndex, jumpToEnding, activeMode, secondsPerBeat);
}

function resolveSlotsBeforeReservedEnding(chosenSlots, reservedEndingSlotIndex, activeMode = 'piano', secondsPerBeat = null, debugInfo = null) {
  if (!Number.isInteger(reservedEndingSlotIndex)) return false;
  const candidates = [...chosenSlots]
    .filter(slot => Number.isInteger(slot) && slot < reservedEndingSlotIndex)
    .map(slot => ({
      slot,
      weight: getReverseEndingCandidateWeight(slot, reservedEndingSlotIndex, activeMode, secondsPerBeat)
    }))
    .filter(entry => entry.weight !== null);
  if (candidates.length === 0) return false;

  let totalWeight = 0;
  for (const candidate of candidates) {
    const weight = Number(candidate.weight);
    if (Number.isFinite(weight) && weight > 0) {
      totalWeight += weight;
    }
  }

  if (totalWeight <= 0) {
    const removedSlots = [];
    for (const candidate of candidates) {
      chosenSlots.delete(candidate.slot);
      removedSlots.push(candidate.slot);
    }
    if (debugInfo) {
      debugInfo.endingResolution = {
        reason: 'all-candidate-weights-zero',
        reservedEndingSlotIndex,
        totalWeight,
        selectedSlot: null,
        removedSlots,
        candidates,
      };
    }
    return true;
  }

  let cursor = Math.random() * totalWeight;
  let selectedSlot = candidates[candidates.length - 1].slot;
  for (const candidate of candidates) {
    const weight = Number(candidate.weight);
    if (!Number.isFinite(weight) || weight <= 0) continue;
    cursor -= weight;
    if (cursor <= 0) {
      selectedSlot = candidate.slot;
      break;
    }
  }

  let changed = false;
  const removedSlots = [];
  for (const candidate of candidates) {
    if (candidate.slot > selectedSlot) {
      chosenSlots.delete(candidate.slot);
      removedSlots.push(candidate.slot);
      changed = true;
    }
  }
  if (debugInfo) {
    debugInfo.endingResolution = {
      reason: 'weighted-ending-candidate',
      reservedEndingSlotIndex,
      totalWeight,
      selectedSlot,
      removedSlots,
      candidates,
    };
  }
  return changed;
}

function buildPianoPlanEvent({
  slot,
  blocks,
  totalBeats,
  nextFirstChord,
  nextStartsNewKey,
  swingRatio = DEFAULT_SWING_RATIO,
}) {
  const timeBeats = getSlotTimeBeats(slot, swingRatio);
  const sourceBlock = getBlockForTime(blocks, timeBeats);
  if (!sourceBlock) return null;

  const anticipatesNextProgression = sourceBlock.nextBlockIdx === null
    && nextFirstChord
    && (nextStartsNewKey || !chordsMatch(sourceBlock.chord, nextFirstChord));
  const lastPreBoundaryOffbeat = sourceBlock.nextBlockIdx !== null
    ? getLastPreBoundaryOffbeatSlotIndex(blocks[sourceBlock.nextBlockIdx].startBeat)
    : (anticipatesNextProgression
        ? getLastPreBoundaryOffbeatSlotIndex(totalBeats)
        : null);
  const isAnticipation = lastPreBoundaryOffbeat !== null
    && slot === lastPreBoundaryOffbeat
    && getSlotKind(slot) === 'offbeat';
  const targetBlockIdx = isAnticipation && sourceBlock.nextBlockIdx !== null
    ? sourceBlock.nextBlockIdx
    : sourceBlock.blockIdx;
  const targetChordIdx = anticipatesNextProgression && isAnticipation
    ? 0
    : (blocks[targetBlockIdx]?.startChordIdx ?? sourceBlock.startChordIdx);

  return {
    chordIdx: targetChordIdx,
    sourceBlockIdx: sourceBlock.blockIdx,
    sourceChordIdx: sourceBlock.startChordIdx,
    targetChordIdx,
    targetVoicingChordIdx: targetChordIdx,
    targetBlockIdx,
    representedBlockIdx: targetBlockIdx,
    representationOverrideReason: null,
    timeBeats,
    slotIndex: slot,
    slotKind: getSlotKind(slot),
    isAnticipation,
    targetsNextProgression: anticipatesNextProgression && isAnticipation,
  };
}

function buildSortedPianoPlanEvents(chosenSlots, eventOptions) {
  return [...chosenSlots]
    .sort((left, right) => left - right)
    .map(slot => buildPianoPlanEvent({
      slot,
      ...eventOptions,
    }))
    .filter(Boolean)
    .sort((left, right) => left.timeBeats - right.timeBeats);
}

function annotatePianoEventSpacing(events, blocks) {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const previousEvent = i > 0 ? events[i - 1] : null;
    const nextEvent = events[i + 1] || null;
    const targetBlock = event.targetsNextProgression ? null : (blocks[event.targetBlockIdx] || null);
    const blockEndBeat = targetBlock ? targetBlock.usefulEndBeat : event.timeBeats;
    const nextEventBeat = nextEvent ? nextEvent.timeBeats : Infinity;
    const naturalEndBeat = Math.min(blockEndBeat, nextEventBeat);
    const durationBeats = Math.max(0, naturalEndBeat - event.timeBeats);
    const isCutByNextAttack = nextEvent !== null && nextEventBeat <= blockEndBeat;
    const nextGapSteps = nextEvent ? (nextEvent.slotIndex - event.slotIndex) : Infinity;
    const previousEventGapSteps = previousEvent ? (event.slotIndex - previousEvent.slotIndex) : Infinity;
    event.durationBeats = durationBeats;
    event.cutByNextAttack = isCutByNextAttack;
    event.previousGapSteps = previousEventGapSteps;
    event.nextGapSteps = nextGapSteps;
    event.nextGapBeats = nextEvent ? Math.max(0, nextEventBeat - event.timeBeats) : null;
    event.forceHoldToNextAttack = nextGapSteps === 1;
    event.isLong = !event.isAnticipation && durationBeats >= 1;
    event.isIsolated = !event.isAnticipation
      && previousEventGapSteps > 1
      && nextGapSteps > 1;
  }
}

function annotatePianoOneStepRuns(events) {
  let runStartIndex = 0;
  while (runStartIndex < events.length) {
    let runEndIndex = runStartIndex;
    while (
      runEndIndex + 1 < events.length
      && (events[runEndIndex + 1].slotIndex - events[runEndIndex].slotIndex) === 1
    ) {
      runEndIndex += 1;
    }

    const runLength = runEndIndex - runStartIndex + 1;
    if (runLength > 1) {
      for (let index = runStartIndex; index <= runEndIndex; index++) {
        events[index].oneStepRunLength = runLength;
        events[index].oneStepRunPosition = (index - runStartIndex) + 1;
      }
    }

    runStartIndex = runEndIndex + 1;
  }
}

function assignLooseBlockRepresentations(events, blocks, {
  preRepresentedBlockIndices = new Set(),
  debugInfo = null,
} = {}) {
  if (!Array.isArray(events) || !events.length || !Array.isArray(blocks) || !blocks.length) {
    return events;
  }

  const eligibleEvents = events.filter(event =>
    !event.targetsNextProgression
    && !event.isAnticipation
    && Number.isInteger(event.targetBlockIdx)
    && blocks[event.targetBlockIdx]
  );
  const representedCounts = new Map();
  for (const blockIdx of preRepresentedBlockIndices) {
    representedCounts.set(blockIdx, (representedCounts.get(blockIdx) || 0) + 1);
  }
  for (const event of eligibleEvents) {
    event.representedBlockIdx = event.targetBlockIdx;
    representedCounts.set(event.targetBlockIdx, (representedCounts.get(event.targetBlockIdx) || 0) + 1);
  }

  const overrides = [];
  for (const block of blocks) {
    if (representedCounts.has(block.blockIdx)) continue;

    let selectedEvent = null;
    let selectedDistance = Infinity;
    for (const event of eligibleEvents) {
      const currentBlockIdx = Number.isInteger(event.representedBlockIdx)
        ? event.representedBlockIdx
        : event.targetBlockIdx;
      if ((representedCounts.get(currentBlockIdx) || 0) <= 1) continue;

      const distance = Math.abs((Number(event.timeBeats) || 0) - block.startBeat);
      if (distance < selectedDistance) {
        selectedDistance = distance;
        selectedEvent = event;
      }
    }

    if (!selectedEvent) continue;

    const previousBlockIdx = Number.isInteger(selectedEvent.representedBlockIdx)
      ? selectedEvent.representedBlockIdx
      : selectedEvent.targetBlockIdx;
    representedCounts.set(previousBlockIdx, Math.max(0, (representedCounts.get(previousBlockIdx) || 0) - 1));
    selectedEvent.representedBlockIdx = block.blockIdx;
    selectedEvent.representationOverrideReason = 'missing-block-nearest-duplicate';
    representedCounts.set(block.blockIdx, 1);
    overrides.push({
      slotIndex: selectedEvent.slotIndex,
      timeBeats: selectedEvent.timeBeats,
      fromBlockIdx: previousBlockIdx,
      toBlockIdx: block.blockIdx,
      reason: selectedEvent.representationOverrideReason,
    });
  }

  if (debugInfo && overrides.length) {
    debugInfo.harmonyRepresentationOverrides = overrides;
  }

  return events;
}

function createPianoPlan({
  chords,
  key = null,
  isMinor = false,
  beatsPerChord,
  beatsPerBar = 4,
  secondsPerBeat = null,
  nextFirstChord = null,
  nextKey = null,
  nextIsMinor = false,
  nextStartsNewKey = false,
  shouldReset = false,
  hasIncomingAnticipation = false,
  previousTailBeats = null,
  activeMode = 'piano',
  buildVoicingChoicePlan = null,
  swingRatio = DEFAULT_SWING_RATIO,
  endingCue = null,
}) {
  if (!Array.isArray(chords) || chords.length === 0) {
    return {
      style: 'piano',
      events: [],
      anticipatesNextStart: false,
      voicingChoicesByChordIdx: {},
    };
  }

  const totalBeats = chords.length * beatsPerChord;
  const totalSlots = totalBeats * 2;
  const blocks = buildHarmonicBlocks(chords, beatsPerChord, beatsPerBar);
  const eventOptions = {
    blocks,
    totalBeats,
    nextFirstChord,
    nextStartsNewKey,
    swingRatio,
  };
  const chosenSlots = new Set();
  const blockedSlotIndex = getPreOnbeatEndingOffbeatSlotIndex(endingCue);
  const reservedEndingSlotIndex = getOffbeatEndingSlotIndex(endingCue);
  const isBlockedSlot = (candidateSlot) => (
    Number.isInteger(blockedSlotIndex)
    && candidateSlot === blockedSlotIndex
  );
  const isReservedEndingSlot = (candidateSlot) => (
    Number.isInteger(reservedEndingSlotIndex)
    && candidateSlot === reservedEndingSlotIndex
  );
  const minimumStartSlot = getBoundaryBlockedSlotCount(totalSlots, previousTailBeats, hasIncomingAnticipation, swingRatio);
  const debugInfo = {
    jumpDecisions: [],
    slotSources: new Map(),
    endingResolution: null,
    harmonyRepresentationOverrides: [],
  };
  let slotIndex = Math.max(
    minimumStartSlot,
    getInitialSlotIndex(shouldReset, hasIncomingAnticipation)
  );
  let incomingSlotSource: Record<string, unknown> = {
    stage: 'initial',
    minimumStartSlot,
    shouldReset,
    hasIncomingAnticipation,
  };
  let forcedOneStepJumpsRemaining = 0;
  let oneStepRunCooldownRemaining = 0;
  let oneStepRunCooldownPending = 0;
  let previousJump = null;

  while (slotExistsWithinProgression(slotIndex, totalSlots)) {
    if (!isBlockedSlot(slotIndex) && !isReservedEndingSlot(slotIndex)) {
      chosenSlots.add(slotIndex);
      if (!debugInfo.slotSources.has(slotIndex)) {
        debugInfo.slotSources.set(slotIndex, incomingSlotSource);
      }
    }
    if (forcedOneStepJumpsRemaining <= 0 && oneStepRunCooldownRemaining > 0) {
      oneStepRunCooldownRemaining -= 1;
    }
    const slotKind = getSlotKind(slotIndex);
    let nextJumpSource = forcedOneStepJumpsRemaining > 0
      ? 'forced-one-step-run'
      : 'weighted-pick';
    let nextJump = forcedOneStepJumpsRemaining > 0
      ? 1
      : weightedPick(getJumpWeights(slotKind, activeMode, secondsPerBeat));
    if (forcedOneStepJumpsRemaining <= 0 && previousJump === 1 && nextJump === 1) {
      nextJump = weightedPickExcludingJump(
        getJumpWeights(slotKind, activeMode, secondsPerBeat),
        1
      );
      nextJumpSource = 'weighted-pick-excluding-repeat-1';
    }
    const destinationSlot = slotIndex + nextJump;
    const jumpDecision = {
      fromSlot: slotIndex,
      toSlot: destinationSlot,
      jump: nextJump,
      source: nextJumpSource,
      slotKind,
      previousJump,
      weightContext: getJumpWeightDebugContext(slotKind, nextJump, activeMode, secondsPerBeat),
    };
    debugInfo.jumpDecisions.push(jumpDecision);
    incomingSlotSource = {
      stage: 'weighted-walk',
      fromSlot: slotIndex,
      jump: nextJump,
      source: nextJumpSource,
      slotKind,
      weightContext: jumpDecision.weightContext,
    };
    if (forcedOneStepJumpsRemaining > 0) {
      forcedOneStepJumpsRemaining -= 1;
      if (forcedOneStepJumpsRemaining <= 0 && oneStepRunCooldownPending > 0) {
        oneStepRunCooldownRemaining = oneStepRunCooldownPending;
        oneStepRunCooldownPending = 0;
      }
    } else if (oneStepRunCooldownRemaining <= 0 && shouldStartOneStepRun(slotKind, nextJump, activeMode, previousJump)) {
      forcedOneStepJumpsRemaining = getOneStepRunRemainingJumps(slotKind);
      const configuredCooldownJumps = Number.isFinite(rhythmConfig.oneStepRunCooldownJumps)
        ? Math.max(0, Math.round(rhythmConfig.oneStepRunCooldownJumps))
        : 0;
      if (forcedOneStepJumpsRemaining > 0) {
        oneStepRunCooldownPending = configuredCooldownJumps;
      } else {
        oneStepRunCooldownRemaining = configuredCooldownJumps;
      }
    }
    previousJump = nextJump;
    slotIndex = destinationSlot;
  }

  resolveSlotsBeforeReservedEnding(chosenSlots, reservedEndingSlotIndex, activeMode, secondsPerBeat, debugInfo);

  const finalEvents = buildSortedPianoPlanEvents(chosenSlots, eventOptions);
  annotatePianoEventSpacing(finalEvents, blocks);
  annotatePianoOneStepRuns(finalEvents);
  assignLooseBlockRepresentations(finalEvents, blocks, {
    preRepresentedBlockIndices: new Set(hasIncomingAnticipation ? [0] : []),
    debugInfo,
  });

  logZeroWeightTwoSlotJumpDiagnostics(
    collectZeroWeightTwoSlotJumpDiagnostics({
      events: finalEvents,
      reservedEndingSlotIndex,
      endingCue,
      activeMode,
      secondsPerBeat,
      swingRatio,
      debugInfo,
    }),
    {
      activeMode,
      beatsPerBar,
      beatsPerChord,
      chordsCount: chords.length,
      tempoBpm: getTempoBpm(secondsPerBeat),
      reservedEndingSlotIndex,
      endingStyle: endingCue?.style || null,
    }
  );

  const anticipatesNextStart = finalEvents.some(event =>
    event.isAnticipation
    && event.slotIndex === getLastPreBoundaryOffbeatSlotIndex(totalBeats)
    && nextFirstChord
  );

  const playbackEvents = finalEvents
    .map((event) => {
      const sourceBlock = blocks[event.sourceBlockIdx] || null;
      const representedBlockIdx = !event.targetsNextProgression
        && !event.isAnticipation
        && Number.isInteger(event.representedBlockIdx)
        ? event.representedBlockIdx
        : event.targetBlockIdx;
      const representedBlock = blocks[representedBlockIdx] || null;
      const hasRepresentationOverride = Boolean(
        representedBlock
        && representedBlock.blockIdx !== event.targetBlockIdx
        && !event.targetsNextProgression
        && !event.isAnticipation
      );
      const chordProgressInBlock = sourceBlock
        ? Math.max(0, Math.min(
            sourceBlock.endChordIdx - sourceBlock.startChordIdx,
            Math.floor((event.timeBeats - sourceBlock.startBeat) / beatsPerChord)
          ))
        : 0;
      const naturalRepeatedChordIdx = sourceBlock
        ? sourceBlock.startChordIdx + chordProgressInBlock
        : event.targetVoicingChordIdx;
      const repeatedChordIdx = hasRepresentationOverride
        ? representedBlock.startChordIdx
        : naturalRepeatedChordIdx;
      const planChord = event.targetsNextProgression
        ? (nextFirstChord || null)
        : (event.isAnticipation
            ? (chords[event.targetVoicingChordIdx] || null)
            : (chords[repeatedChordIdx] || chords[event.targetVoicingChordIdx] || null));

      return {
        ...event,
        representedBlockIdx,
        repeatedChordIdx,
        planChord,
        planKey: event.targetsNextProgression ? nextKey : key,
        planIsMinor: event.targetsNextProgression ? nextIsMinor : isMinor,
      };
    })
    .sort((left, right) => left.timeBeats - right.timeBeats);

  const voicingChoicesByEventIndex = typeof buildVoicingChoicePlan === 'function'
    ? buildVoicingChoicePlan({
        events: playbackEvents,
        nextFirstChord,
        nextKey,
        nextIsMinor,
      })
    : [];
  const playbackEventsWithChoices = playbackEvents.map((event, index) => ({
    ...event,
    playbackEventIndex: index,
    voicingChoice: voicingChoicesByEventIndex[index] || null,
  }));

  return {
    style: 'piano',
    events: playbackEventsWithChoices,
    anticipatesNextStart,
  };
}

type DrillPianoCompingOptions = {
  constants?: {
    CHORD_FADE_BEFORE?: number;
    PIANO_COMP_DURATION_RATIO?: number;
    PIANO_COMP_MIN_DURATION?: number;
    PIANO_COMP_MAX_DURATION?: number;
    PIANO_VOLUME_MULTIPLIER?: number;
  };
  helpers?: {
    getAudioContext?: () => BaseAudioContext | null;
    getPianoVoicingMode?: () => string;
    getSecondsPerBeat?: () => number | null;
    getSwingRatio?: () => number;
    getVoicingAtIndex?: (...args: unknown[]) => unknown;
    playSample?: (
      category: string,
      midi: number,
      time: number,
      duration: number,
      volume: number,
      options?: Record<string, unknown>
    ) => void;
  };
};

export function createPianoComping({ constants = {}, helpers = {} }: DrillPianoCompingOptions = {}) {
  const {
    CHORD_FADE_BEFORE,
    PIANO_COMP_DURATION_RATIO,
    PIANO_COMP_MIN_DURATION,
    PIANO_COMP_MAX_DURATION,
    PIANO_VOLUME_MULTIPLIER,
  } = constants;
  const {
    getAudioContext,
    getPianoVoicingMode,
    getSecondsPerBeat = () => null,
    getSwingRatio = () => DEFAULT_SWING_RATIO,
    getVoicingAtIndex,
    playSample
  } = helpers;
  const {
    DOMINANT_DEFAULT_QUALITY_MAJOR = {},
    DOMINANT_DEFAULT_QUALITY_MINOR = {},
    QUALITY_CATEGORY_ALIASES = {},
  } = voicingConfig as {
    DOMINANT_DEFAULT_QUALITY_MAJOR?: Record<string, string>;
    DOMINANT_DEFAULT_QUALITY_MINOR?: Record<string, string>;
    QUALITY_CATEGORY_ALIASES?: Record<string, string[]>;
  };
  const {
    defaultMode: defaultPianoMode = 'piano',
    modes: pianoModes = {},
    ranges: pianoRanges = {},
  } = pianoVoicingConfig;
  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  function getPianoSampleLayer(finalVolume) {
    const thresholds = rhythmConfig.pianoSampleLayerThresholds || {};
    if (finalVolume >= (thresholds.f ?? Number.POSITIVE_INFINITY)) return 'f';
    if (finalVolume >= (thresholds.mf ?? Number.POSITIVE_INFINITY)) return 'mf';
    return 'p';
  }

  function smoothstep01(value) {
    const clamped = Math.min(1, Math.max(0, value));
    return clamped * clamped * (3 - (2 * clamped));
  }

  function getPianoSampleLayerBoundaryLiftDb(finalVolume, layer) {
    const thresholds = rhythmConfig.pianoSampleLayerThresholds || {};
    const smoothing = rhythmConfig.pianoSampleLayerSmoothing || {};
    const boundaryWindow = Number.isFinite(smoothing.boundaryWindow)
      ? Math.min(0.2, Math.max(0.001, smoothing.boundaryWindow))
      : 0.045;

    if (layer === 'p' && Number.isFinite(thresholds.mf)) {
      const start = thresholds.mf - boundaryWindow;
      const liftDb = Number.isFinite(smoothing.pToMfLiftDb) ? smoothing.pToMfLiftDb : 2.25;
      return smoothstep01((finalVolume - start) / boundaryWindow) * Math.max(0, liftDb);
    }

    if (layer === 'mf') {
      let liftDb = 0;

      if (Number.isFinite(thresholds.mf)) {
        const fromPLift = Number.isFinite(smoothing.mfFromPLiftDb) ? smoothing.mfFromPLiftDb : 2.25;
        liftDb += (1 - smoothstep01((finalVolume - thresholds.mf) / boundaryWindow)) * Math.max(0, fromPLift);
      }

      if (Number.isFinite(thresholds.f)) {
        const start = thresholds.f - boundaryWindow;
        const toFLift = Number.isFinite(smoothing.mfToFLiftDb) ? smoothing.mfToFLiftDb : 1.5;
        liftDb += smoothstep01((finalVolume - start) / boundaryWindow) * Math.max(0, toFLift);
      }

      return liftDb;
    }

    if (layer === 'f' && Number.isFinite(thresholds.f)) {
      const fromMfLift = Number.isFinite(smoothing.fFromMfLiftDb) ? smoothing.fFromMfLiftDb : 1.5;
      return (1 - smoothstep01((finalVolume - thresholds.f) / boundaryWindow)) * Math.max(0, fromMfLift);
    }

    return 0;
  }

  function getPianoSampleLayerGain(finalVolume) {
    const layer = getPianoSampleLayer(finalVolume);
    const layerGainDb = rhythmConfig.pianoSampleLayerGainDb || {};
    const boundaryLiftDb = getPianoSampleLayerBoundaryLiftDb(finalVolume, layer);
    return {
      layer,
      adjustedVolume: finalVolume * dbToGain((layerGainDb[layer] ?? 0) + boundaryLiftDb),
    };
  }

  function getPianoVoiceBaseVolume(index, noteCount, modeName = 'piano') {
    const lastIndex = noteCount - 1;
    if (lastIndex <= 0) return 1;

    if (modeName === 'twoHand' && noteCount > 4) {
      const lowerVoiceCount = 4;
      const lowerLastIndex = lowerVoiceCount - 1;
      if (index < lowerVoiceCount) {
        const lowerPosition = index / lowerLastIndex;
        const lowerEdgeEmphasis = Math.abs((lowerPosition * 2) - 1);
        return 0.9 + (lowerEdgeEmphasis * 0.12) + (lowerPosition * 0.06);
      }

      const extraVoiceIndex = index - lowerVoiceCount;
      const configuredStart = Number.isFinite(rhythmConfig.twoHandExtraTopBaseVolume)
        ? rhythmConfig.twoHandExtraTopBaseVolume
        : 0.9;
      return Math.max(0.55, configuredStart);
    }

    const position = index / lastIndex;
    const edgeEmphasis = Math.abs((position * 2) - 1);
    return 0.9 + (edgeEmphasis * 0.12) + (position * 0.06);
  }

  function shouldThinInteriorOneStepRunVoicing(activeMode, secondsPerBeat) {
    return false;
  }

  function wouldThinOneStepRunEvent(entry, activeMode, secondsPerBeat) {
    const isInteriorOneStepRunEvent = Number.isInteger(entry?.oneStepRunLength)
      && entry.oneStepRunLength >= 3
      && Number.isInteger(entry?.oneStepRunPosition)
      && entry.oneStepRunPosition > 1
      && entry.oneStepRunPosition < entry.oneStepRunLength;
    return isInteriorOneStepRunEvent && shouldThinInteriorOneStepRunVoicing(activeMode, secondsPerBeat);
  }

  function buildPianoColorToneSet(colorTones) {
    const pitchClassCounts = new Map();
    const selected = [];
    let duplicatePitchClassUsed = false;

    for (const midi of colorTones) {
      const pitchClass = ((midi % 12) + 12) % 12;
      const count = pitchClassCounts.get(pitchClass) || 0;
      if (count === 0) {
        selected.push(midi);
        pitchClassCounts.set(pitchClass, 1);
        continue;
      }

      if (!duplicatePitchClassUsed) {
        const candidateSelection = [...selected, midi].sort((a, b) => a - b);
        const candidateSpan = candidateSelection.length > 1
          ? candidateSelection[candidateSelection.length - 1] - candidateSelection[0]
          : 0;
        if (candidateSpan <= 12) {
          selected.push(midi);
          pitchClassCounts.set(pitchClass, count + 1);
          duplicatePitchClassUsed = true;
        }
      }
    }

    return selected;
  }

  function classifyQuality(quality) {
    for (const [category, aliases] of Object.entries(QUALITY_CATEGORY_ALIASES)) {
      if (quality === category) return category;
      if ((aliases || []).includes(quality)) return category;
    }
    if (quality.startsWith('13')) return 'dom';
    if (quality.startsWith('9')) return 'dom';
    if (quality.startsWith('7')) return 'dom';
    return null;
  }

  function resolveDominantQuality(chord, quality, isMinor) {
    if (quality !== '7') return quality;
    const defaults = isMinor ? DOMINANT_DEFAULT_QUALITY_MINOR : DOMINANT_DEFAULT_QUALITY_MAJOR;
    if (chord?.modifier) return '13';
    return defaults[chord?.roman] || '13';
  }

  function getPlayedChordQuality(chord, isMinor) {
    const canonicalQuality = isMinor ? chord?.qualityMinor : chord?.qualityMajor;
    if (!canonicalQuality) return '';
    const contextualQuality = applyContextualQualityRules(chord, canonicalQuality);

    if (classifyQuality(contextualQuality) !== 'dom') {
      return contextualQuality;
    }
    return resolveDominantQuality(chord, contextualQuality, isMinor);
  }

  function resolveIntervalValue(interval) {
    if (typeof interval === 'number') return interval;
    if (typeof interval === 'string' && interval in INTERVAL_SEMITONES) {
      return INTERVAL_SEMITONES[interval];
    }
    throw new Error(`Unknown piano interval: ${interval}`);
  }

  function resolveAscendingIntervals(intervals) {
    const resolved = intervals.map(resolveIntervalValue);
    if (resolved.length <= 1) return resolved;

    const ascending = [resolved[0]];
    for (let index = 1; index < resolved.length; index++) {
      let value = resolved[index];
      while (value <= ascending[index - 1]) {
        value += 12;
      }
      ascending.push(value);
    }
    return ascending;
  }

  function midiToNoteName(midi) {
    if (!Number.isFinite(midi)) return '?';
    return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
  }

  function getChordRootPitchClass(chord, key) {
    if (!chord || !Number.isFinite(key)) return null;
    return ((key + chord.semitones) % 12 + 12) % 12;
  }

  function formatPianoHarmonyLabel(chord, key, isMinor) {
    const playedQuality = getPlayedChordQuality(chord, isMinor);
    const rootPitchClass = getChordRootPitchClass(chord, key);
    const rootName = Number.isFinite(rootPitchClass) ? NOTE_NAMES[rootPitchClass] : '?';
    return `${rootName}${playedQuality || ''}`;
  }

  function formatPianoChoiceNotes(choice) {
    if (!choice?.notes?.length) return '[]';
    return `[${choice.notes.map(midiToNoteName).join(', ')}]`;
  }

  function resolvePianoLoggedHarmony({ progression, event, playbackEventData }) {
    const fallbackProgression = playbackEventData?.targetProgression || progression || null;
    const fallbackChord = playbackEventData?.chord || null;

    if (event?.isAnticipation && progression?.chords?.length && Number.isInteger(event.sourceChordIdx)) {
      const sourceChord = progression.chords[event.sourceChordIdx] || null;
      if (sourceChord) {
        return {
          chord: sourceChord,
          key: progression.key,
          isMinor: progression.isMinor,
        };
      }
    }

    return {
      chord: fallbackChord,
      key: fallbackProgression?.key ?? null,
      isMinor: fallbackProgression?.isMinor ?? false,
    };
  }

  function deriveInversionShape(intervals) {
    if (!Array.isArray(intervals) || intervals.length <= PIANO_SHAPE_INVERSION_START_INDEX) {
      return [...(intervals || [])];
    }
    return [
      ...intervals.slice(PIANO_SHAPE_INVERSION_START_INDEX),
      ...intervals.slice(0, PIANO_SHAPE_INVERSION_START_INDEX).map(interval => interval + 12),
    ];
  }

  function applyOneHandDropToResolvedIntervals(intervals) {
    if (!Array.isArray(intervals) || intervals.length < 2) return [...(intervals || [])];

    // TODO: Revisit whether one-hand piano should always use this drop treatment.
    // Keeping it for now, but this may become optional or shape-dependent later.
    const dropped = [...intervals];
    const liftedSecond = dropped[1] + 12;
    dropped.splice(1, 1);
    dropped.push(liftedSecond);
    return dropped;
  }

  function expandTwoHandShape(intervals) {
    if (!Array.isArray(intervals) || intervals.length < 4) return [...(intervals || [])];
    return [
      intervals[0],
      intervals[2],
      intervals[3],
      intervals[1] + 12,
      intervals[3] + 12,
      intervals[1] + 24,
    ];
  }

  function deriveTwoHandNotesFromOneHandNotes(notes) {
    if (!Array.isArray(notes) || notes.length === 0) return [];
    const sortedNotes = [...notes].sort((left, right) => left - right);
    if (sortedNotes.length < 3) return sortedNotes;

    const doubledUpperVoices = sortedNotes
      .slice(-2)
      .map((midi) => midi + 12);

    return [...sortedNotes, ...doubledUpperVoices];
  }

  function deriveTwoHandChoiceFromOneHandChoice(choice) {
    if (!choice?.notes?.length) return null;
    const notes = deriveTwoHandNotesFromOneHandNotes(choice.notes);
    if (!notes.length) return null;
    return {
      ...choice,
      modeName: 'twoHand',
      notes,
      lowestMidi: notes[0],
      voiceScore: scorePianoShape(notes),
    };
  }

  function getPianoModeConfig() {
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    return pianoModes[activeMode] || pianoModes.piano || { guideToneIndices: [0, 2], shapes: {} };
  }

  function resolvePianoModeName(modeOverride = null) {
    const activeMode = modeOverride || getPianoVoicingMode?.() || defaultPianoMode;
    return pianoModes[activeMode] ? activeMode : 'piano';
  }

  function getShapeSpecForQuality(modeName, quality) {
    const baseShape = pianoModes.piano?.shapes?.[quality] || null;
    if (modeName !== 'twoHand') {
      return baseShape;
    }

    const twoHandOverride = pianoModes.twoHand?.shapes?.[quality] || null;
    if (!baseShape && !twoHandOverride) return null;
    return {
      A: twoHandOverride?.A || baseShape?.A || null,
      B: twoHandOverride?.B || baseShape?.B || null,
    };
  }

  function buildPianoShapeCandidatesForQualityRoot(rootPitchClass, quality, modeOverride = null) {
    if (!Number.isFinite(rootPitchClass) || !quality) return null;

    const activeMode = resolvePianoModeName(modeOverride);
    const shapeSpec = getShapeSpecForQuality(activeMode, quality);
    if (!shapeSpec?.A) return null;

    const normalizedRootPitchClass = ((rootPitchClass % 12) + 12) % 12;
    const baseIntervalsA = shapeSpec.A.map(resolveIntervalValue);
    const baseIntervalsB = (shapeSpec.B || deriveInversionShape(baseIntervalsA))
      .map(resolveIntervalValue);
    const intervalSets = activeMode === 'twoHand'
      ? [
          { name: 'A', intervals: expandTwoHandShape(baseIntervalsA) },
          { name: 'B', intervals: expandTwoHandShape(baseIntervalsB) },
        ]
      : [
          { name: 'A', intervals: baseIntervalsA },
          { name: 'B', intervals: baseIntervalsB },
        ];

    const candidates = [];
    for (const candidate of intervalSets) {
      const noteCandidates = buildShapeEntriesFromIntervals(
        normalizedRootPitchClass,
        candidate.intervals,
        activeMode
      );
      for (const noteCandidate of noteCandidates) {
        candidates.push({
          ...candidate,
          modeName: activeMode,
          notes: noteCandidate.notes,
          voiceScore: noteCandidate.voiceScore,
          lowestMidi: noteCandidate.lowestMidi,
        });
      }
    }

    const sortedCandidates = candidates.sort((left, right) => {
      if (left.voiceScore !== right.voiceScore) return left.voiceScore - right.voiceScore;
      return left.lowestMidi - right.lowestMidi;
    });
    const inZoneCandidates = sortedCandidates.filter((candidate) =>
      candidate.lowestMidi >= pianoRanges.lowestNoteZoneLow
      && candidate.lowestMidi <= pianoRanges.lowestNoteZoneHigh
    );
    return inZoneCandidates.length ? inZoneCandidates : sortedCandidates;
  }

  function buildPianoChordPitchClassPool(chord, key, isMinor) {
    if (!chord || !Number.isFinite(key)) return [];
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    const playedQuality = getPlayedChordQuality(chord, isMinor);
    const shapeSpec = getShapeSpecForQuality(activeMode, playedQuality);
    if (!shapeSpec?.A) return [];

    const pitchClasses = new Set<number>();
    const rootPitchClass = getChordRootPitchClass(chord, key);
    const shapeIntervals = [
      ...(shapeSpec.A || []),
      ...(shapeSpec.B || []),
    ];
    for (const interval of shapeIntervals) {
      const semitones = resolveIntervalValue(interval);
      pitchClasses.add((rootPitchClass + semitones) % 12);
    }
    return [...pitchClasses].sort((left, right) => left - right);
  }

  function findAdjacentPooledMidi(midi, pitchClasses, direction) {
    if (!Number.isFinite(midi) || !Array.isArray(pitchClasses) || pitchClasses.length === 0) return midi;
    if (direction === 0) return midi;

    const step = direction > 0 ? 1 : -1;
    let candidate = midi + step;
    const hardLimit = direction > 0 ? pianoRanges.noteRangeHigh + 24 : pianoRanges.noteRangeLow - 24;
    while ((direction > 0 && candidate <= hardLimit) || (direction < 0 && candidate >= hardLimit)) {
      const pitchClass = ((candidate % 12) + 12) % 12;
      if (pitchClasses.includes(pitchClass)) {
        return candidate;
      }
      candidate += step;
    }
    return midi;
  }

  function movePianoVoicingAlongPool(choice, pitchClasses, direction) {
    if (!choice?.notes?.length || !direction) return choice;
    const movedNotes = choice.notes.map((midi) => findAdjacentPooledMidi(midi, pitchClasses, direction));
    for (let index = 1; index < movedNotes.length; index++) {
      while (movedNotes[index] <= movedNotes[index - 1]) {
        movedNotes[index] += 12;
      }
    }
    return {
      ...choice,
      notes: movedNotes,
      lowestMidi: movedNotes[0],
      voiceScore: scorePianoShape(movedNotes, { enforceUpperLowestBound: false }),
      name: `${choice.name}${direction > 0 ? 'â†‘' : 'â†“'}`,
    };
  }

  function getRepeatedRunInternalBottomTravel(choices) {
    if (!Array.isArray(choices) || choices.length <= 1) return 0;
    let total = 0;
    for (let index = 1; index < choices.length; index++) {
      total += Math.abs((choices[index]?.lowestMidi ?? 0) - (choices[index - 1]?.lowestMidi ?? 0));
    }
    return total;
  }

  function isChoiceWithinLowestBound(choice) {
    return Number.isFinite(choice?.lowestMidi) && choice.lowestMidi >= pianoRanges.lowestNoteZoneLow;
  }

  function countRepeatedRunReversals(directions) {
    let reversals = 0;
    let previousNonZeroDirection = 0;
    for (const direction of directions || []) {
      if (!direction) continue;
      if (previousNonZeroDirection && direction !== previousNonZeroDirection) {
        reversals += 1;
      }
      previousNonZeroDirection = direction;
    }
    return reversals;
  }

  function isForcedAdjacentRunMove(previousEntry, currentEntry) {
    return Boolean(
      previousEntry
      && currentEntry
      && !previousEntry.isSentinel
      && !currentEntry.isSentinel
      && (currentEntry.slotIndex - previousEntry.slotIndex) === 1
    );
  }

  function doThinnedOuterVoicesNeedToMove(previousEntry, currentEntry, previousChoice, currentChoice, activeMode, secondsPerBeat) {
    if (!previousChoice?.notes?.length || !currentChoice?.notes?.length) return false;
    const eitherEventWouldThin = wouldThinOneStepRunEvent(previousEntry, activeMode, secondsPerBeat)
      || wouldThinOneStepRunEvent(currentEntry, activeMode, secondsPerBeat);
    if (!eitherEventWouldThin) return false;

    const previousTop = previousChoice.notes[previousChoice.notes.length - 1];
    const currentTop = currentChoice.notes[currentChoice.notes.length - 1];
    return previousChoice.lowestMidi === currentChoice.lowestMidi || previousTop === currentTop;
  }

  function buildRepeatedChordRunTrajectoryCandidates(runEntries, initialChoice, pitchClasses) {
    const runLength = Array.isArray(runEntries) ? runEntries.length : 0;
    if (!runLength || !initialChoice?.notes?.length) return [];

    const candidates = [];
    const seen = new Set();

    function visit(stepIndex, currentChoice, choices, directions, previousNonZeroDirection, reversalsUsed) {
      if (stepIndex >= runLength) {
        const signature = choices
          .map((choice) => (choice?.notes || []).join(','))
          .join('|');
        if (!seen.has(signature)) {
          seen.add(signature);
          candidates.push({
            choices,
            directions,
            reversalsUsed,
          });
        }
        return;
      }

      for (const direction of [-1, 0, 1]) {
        let nextReversalsUsed = reversalsUsed;
        if (direction !== 0 && previousNonZeroDirection !== 0 && direction !== previousNonZeroDirection) {
          nextReversalsUsed += 1;
        }
        if (nextReversalsUsed > 1) continue;

        const nextChoice = movePianoVoicingAlongPool(currentChoice, pitchClasses, direction);
        if (!isChoiceWithinLowestBound(nextChoice)) continue;
        const previousRunEntry = runEntries[stepIndex - 1] || null;
        const currentRunEntry = runEntries[stepIndex] || null;
        const isForcedAdjacentRepeatMove = isForcedAdjacentRunMove(previousRunEntry, currentRunEntry);
        if (isForcedAdjacentRepeatMove && pianoChoicesMatch(currentChoice, nextChoice)) continue;
        const nextPreviousNonZeroDirection = direction === 0 ? previousNonZeroDirection : direction;
        visit(
          stepIndex + 1,
          nextChoice,
          [...choices, nextChoice],
          [...directions, direction],
          nextPreviousNonZeroDirection,
          nextReversalsUsed
        );
      }
    }

    visit(1, initialChoice, [initialChoice], [], 0, 0);
    return candidates;
  }

  function scoreRepeatedChordRunTrajectory(candidate, nextChoice) {
    if (!candidate?.choices?.length) return Number.POSITIVE_INFINITY;

    const choices = candidate.choices;
    const directions = candidate.directions || [];
    let score = 0;

    if ((choices[0]?.lowestMidi ?? Number.POSITIVE_INFINITY) < pianoRanges.lowestNoteZoneLow) {
      return Number.POSITIVE_INFINITY;
    }

    for (let index = 1; index < choices.length; index++) {
      const previousChoice = choices[index - 1];
      const currentChoice = choices[index];
      if ((currentChoice?.lowestMidi ?? Number.POSITIVE_INFINITY) < pianoRanges.lowestNoteZoneLow) {
        return Number.POSITIVE_INFINITY;
      }
      const delta = (currentChoice?.lowestMidi ?? 0) - (previousChoice?.lowestMidi ?? 0);
      const distance = Math.abs(delta);

      if (distance === 0) {
        score += 1.6;
      } else if (distance > 2) {
        score += (distance - 2) * 5;
      }

      if (nextChoice) {
        score += Math.abs((nextChoice.lowestMidi ?? 0) - (currentChoice?.lowestMidi ?? 0)) * 0.35;
      }
    }

    const lastChoice = choices[choices.length - 1];
    if ((lastChoice?.lowestMidi ?? Number.POSITIVE_INFINITY) < pianoRanges.lowestNoteZoneLow) {
      return Number.POSITIVE_INFINITY;
    }
    if (nextChoice) {
      score += getPianoChoiceTransitionCost(lastChoice, nextChoice) * 10;
    }

    const internalTravel = getRepeatedRunInternalBottomTravel(choices);
    if (internalTravel === 0) {
      score += 4;
    } else {
      score -= Math.min(internalTravel, 8) * 0.4;
    }

    score += countRepeatedRunReversals(directions) * 0.6;
    return score;
  }

  function pickRepeatedChordRunTrajectory(candidates, nextChoice) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;

    let bestCandidate = candidates[0];
    let bestScore = scoreRepeatedChordRunTrajectory(bestCandidate, nextChoice);
    const scored = [{ candidate: bestCandidate, score: bestScore }];

    for (let index = 1; index < candidates.length; index++) {
      const score = scoreRepeatedChordRunTrajectory(candidates[index], nextChoice);
      scored.push({ candidate: candidates[index], score });
      if (score < bestScore) {
        bestCandidate = candidates[index];
        bestScore = score;
      }
    }

    const shortlist = scored.filter((entry) => entry.score <= bestScore + 1.5);
    if (shortlist.length <= 1) return bestCandidate;

    let totalWeight = 0;
    const weighted = shortlist.map((entry) => {
      const weight = 1 / (1 + Math.max(0, entry.score - bestScore));
      totalWeight += weight;
      return { ...entry, weight };
    });

    let cursor = Math.random() * totalWeight;
    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor <= 0) return entry.candidate;
    }
    return weighted[weighted.length - 1]?.candidate || bestCandidate;
  }

  function shortlistRepeatedChordRunTrajectories(candidates, nextChoice) {
    if (!Array.isArray(candidates) || candidates.length === 0) return [];

    let bestScore = Number.POSITIVE_INFINITY;
    const scored = candidates.map((candidate) => {
      const score = scoreRepeatedChordRunTrajectory(candidate, nextChoice);
      if (score < bestScore) bestScore = score;
      return { candidate, score };
    });

    return scored
      .filter((entry) => entry.score <= bestScore + 1.5)
      .sort((left, right) => left.score - right.score)
      .slice(0, 8)
      .map((entry) => entry.candidate);
  }

  function applyRepeatedChordMotion(sequence, chosen) {
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    if (activeMode !== 'piano' || !Array.isArray(sequence) || !Array.isArray(chosen)) {
      return chosen;
    }

    const adjusted = [...chosen];
    let index = 0;
    while (index < sequence.length) {
      const entry = sequence[index];
      if (!entry || entry.isSentinel) {
        index += 1;
        continue;
      }

      let runEnd = index;
      while (
        runEnd + 1 < sequence.length
        && !sequence[runEnd + 1]?.isSentinel
        && chordsMatch(sequence[runEnd].chord, sequence[runEnd + 1].chord)
      ) {
        runEnd += 1;
      }

      const runLength = runEnd - index + 1;
      if (runLength > 1 && adjusted[index]?.notes?.length) {
        const pitchClasses = buildPianoChordPitchClassPool(entry.chord, entry.key, entry.isMinor);
        const nextChoice = (runEnd + 1 < adjusted.length && !sequence[runEnd + 1]?.isSentinel)
          ? adjusted[runEnd + 1]
          : null;
        const runEntries = sequence.slice(index, runEnd + 1);
        const trajectories = buildRepeatedChordRunTrajectoryCandidates(runEntries, adjusted[index], pitchClasses);
        const bestVariant = pickRepeatedChordRunTrajectory(trajectories, nextChoice);
        if (!bestVariant?.choices?.length) {
          index = runEnd + 1;
          continue;
        }
        for (let offset = 0; offset < runLength; offset++) {
          adjusted[index + offset] = bestVariant.choices[offset];
        }
      }

      index = runEnd + 1;
    }

    return adjusted;
  }

  function buildRepeatedChordMotionCandidateSets(sequence, chosen) {
    if (!Array.isArray(sequence) || !Array.isArray(chosen)) {
      return [];
    }

    const candidateSets = chosen.map((choice) => (choice ? [choice] : [null]));
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    if (activeMode !== 'piano') {
      return candidateSets;
    }

    let index = 0;
    while (index < sequence.length) {
      const entry = sequence[index];
      if (!entry || entry.isSentinel || !chosen[index]?.notes?.length) {
        index += 1;
        continue;
      }

      let runEnd = index;
      while (
        runEnd + 1 < sequence.length
        && !sequence[runEnd + 1]?.isSentinel
        && chordsMatch(sequence[runEnd].chord, sequence[runEnd + 1].chord)
      ) {
        runEnd += 1;
      }

      const runLength = runEnd - index + 1;
      if (runLength > 1) {
        const pitchClasses = buildPianoChordPitchClassPool(entry.chord, entry.key, entry.isMinor);
        const nextChoice = (runEnd + 1 < chosen.length && !sequence[runEnd + 1]?.isSentinel)
          ? chosen[runEnd + 1]
          : null;
        const runEntries = sequence.slice(index, runEnd + 1);
        const trajectories = buildRepeatedChordRunTrajectoryCandidates(runEntries, chosen[index], pitchClasses);
        const shortlist = shortlistRepeatedChordRunTrajectories(trajectories, nextChoice);

        for (const trajectory of shortlist) {
          for (let offset = 0; offset < runLength; offset++) {
            const candidate = trajectory?.choices?.[offset] || null;
            if (!candidate?.notes?.length) continue;
            const targetSet = candidateSets[index + offset];
            if (!targetSet.some(existing => pianoChoicesMatch(existing, candidate))) {
              targetSet.push(candidate);
            }
          }
        }
      }

      index = runEnd + 1;
    }

    return candidateSets;
  }

  function getRootMidiCandidates(rootPitchClass) {
    const candidates = [];
    for (let midi = rootPitchClass; midi <= pianoRanges.noteRangeHigh; midi += 12) {
      if (midi >= pianoRanges.noteRangeLow - 24) {
        candidates.push(midi);
      }
    }
    return candidates;
  }

  function scorePianoShape(notes, { enforceUpperLowestBound = true } = {}) {
    if (!Array.isArray(notes) || notes.length === 0) return Number.POSITIVE_INFINITY;

    let score = 0;
    for (const midi of notes) {
      if (midi < pianoRanges.noteRangeLow) score += (pianoRanges.noteRangeLow - midi) * 20;
      if (midi > pianoRanges.noteRangeHigh) score += (midi - pianoRanges.noteRangeHigh) * 20;
    }
    const lowestMidi = notes[0];
    if (lowestMidi < pianoRanges.lowestNoteZoneLow) {
      score += (pianoRanges.lowestNoteZoneLow - lowestMidi) * 60;
    }
    if (enforceUpperLowestBound && lowestMidi > pianoRanges.lowestNoteZoneHigh) {
      score += (lowestMidi - pianoRanges.lowestNoteZoneHigh) * 60;
    }
    score += Math.abs(lowestMidi - pianoRanges.lowestNoteZoneCenter) * 2;
    score += (notes[notes.length - 1] - notes[0]) * 0.05;
    return score;
  }

  function buildShapeEntriesFromResolvedIntervals(rootPitchClass, resolvedIntervals) {
    if (!Number.isFinite(rootPitchClass) || !Array.isArray(resolvedIntervals) || resolvedIntervals.length === 0) {
      return [];
    }

    const normalizedRootPitchClass = ((rootPitchClass % 12) + 12) % 12;
    const rootCandidates = getRootMidiCandidates(normalizedRootPitchClass);
    const candidates = [];

    for (const rootMidi of rootCandidates) {
      const notes = resolvedIntervals.map(interval => rootMidi + interval);
      const score = scorePianoShape(notes);
      candidates.push({
        notes,
        voiceScore: score,
        lowestMidi: notes[0],
      });
    }

    return candidates.sort((left, right) => {
      if (left.voiceScore !== right.voiceScore) return left.voiceScore - right.voiceScore;
      return left.lowestMidi - right.lowestMidi;
    });
  }

  function buildShapeEntriesFromIntervals(rootPitchClass, intervals, modeOverride = null) {
    const baseResolvedIntervals = resolveAscendingIntervals(intervals);
    const activeMode = resolvePianoModeName(modeOverride);
    const resolvedIntervals = activeMode === 'piano'
      ? applyOneHandDropToResolvedIntervals(baseResolvedIntervals)
      : baseResolvedIntervals;
    const rootCandidates = getRootMidiCandidates(rootPitchClass);
    const candidates = [];

    for (const rootMidi of rootCandidates) {
      const notes = resolvedIntervals.map(interval => rootMidi + interval);
      const score = scorePianoShape(notes);
      candidates.push({
        notes,
        voiceScore: score,
        lowestMidi: notes[0],
      });
    }

    return candidates.sort((left, right) => {
      if (left.voiceScore !== right.voiceScore) return left.voiceScore - right.voiceScore;
      return left.lowestMidi - right.lowestMidi;
    });
  }

  function buildPianoShapeCandidates(chord, key, isMinor, modeOverride = null) {
    if (!chord || !Number.isFinite(key)) return null;

    const playedQuality = getPlayedChordQuality(chord, isMinor);
    const rootPitchClass = (key + chord.semitones) % 12;
    return buildPianoShapeCandidatesForQualityRoot(rootPitchClass, playedQuality, modeOverride);
  }

  function pickAnchoredPianoShapeCandidate(candidates, anchorChoice = null) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;
    if (!anchorChoice?.notes?.length || !Number.isFinite(anchorChoice.lowestMidi)) {
      return candidates[0] || null;
    }

    let bestCandidate = candidates[0];
    let bestDistance = Math.abs((bestCandidate.lowestMidi ?? 0) - anchorChoice.lowestMidi);
    let bestVoiceScore = bestCandidate.voiceScore ?? Number.POSITIVE_INFINITY;

    for (let index = 1; index < candidates.length; index++) {
      const candidate = candidates[index];
      const distance = Math.abs((candidate.lowestMidi ?? 0) - anchorChoice.lowestMidi);
      const voiceScore = candidate.voiceScore ?? Number.POSITIVE_INFINITY;
      if (distance < bestDistance || (distance === bestDistance && voiceScore < bestVoiceScore)) {
        bestCandidate = candidate;
        bestDistance = distance;
        bestVoiceScore = voiceScore;
      }
    }

    return bestCandidate;
  }

  function buildPianoShapeNotes(chord, key, isMinor, planChoice = null, modeOverride = null) {
    const resolvedMode = resolvePianoModeName(modeOverride);
    if (resolvedMode === 'twoHand') {
      if (planChoice?.notes?.length) {
        if (planChoice.modeName === 'twoHand') {
          return planChoice;
        }
        const derivedChoice = deriveTwoHandChoiceFromOneHandChoice(planChoice);
        if (derivedChoice) return derivedChoice;
      }

      const baseChoice = buildPianoShapeNotes(chord, key, isMinor, null, 'piano');
      const derivedChoice = deriveTwoHandChoiceFromOneHandChoice(baseChoice);
      if (derivedChoice) return derivedChoice;
    }

    if (planChoice?.notes?.length && (!modeOverride || planChoice.modeName === resolvedMode)) {
      return planChoice;
    }
    const candidates = buildPianoShapeCandidates(chord, key, isMinor, resolvedMode);
    return pickAnchoredPianoShapeCandidate(candidates, planChoice);
  }

  function getNextPianoEvent(event, plan) {
    const currentIndex = event?.playbackEventIndex;
    if (!Number.isInteger(currentIndex) || !Array.isArray(plan?.events)) return null;
    return plan.events[currentIndex + 1] || null;
  }

  function getPlaybackTextureCandidate(event, activeMode) {
    if (activeMode !== 'piano') return activeMode;
    return event?.isIsolated ? 'twoHand' : 'piano';
  }

  function getPlaybackTextureSegmentEndBeat(events, startIndex, endIndex) {
    const lastEvent = events[endIndex] || null;
    const nextEvent = events[endIndex + 1] || null;
    if (Number.isFinite(nextEvent?.timeBeats)) {
      return nextEvent.timeBeats;
    }
    if (Number.isFinite(lastEvent?.timeBeats) && Number.isFinite(lastEvent?.durationBeats)) {
      return lastEvent.timeBeats + lastEvent.durationBeats;
    }
    return Number.isFinite(lastEvent?.timeBeats) ? lastEvent.timeBeats : 0;
  }

  function getDeterministicShortDuration({
    baseShortDuration,
    event,
    plan,
    nextPlan,
    secondsPerBeat,
  }) {
    return getPianoShortDuration({
      baseShortDuration,
      event,
      plan,
      nextPlan,
      secondsPerBeat,
      includeRandomness: false,
    });
  }

  function estimatePianoEventReleaseDurationSeconds(event, plan, nextPlan, slotDuration, secondsPerBeat) {
    if (!event || !Number.isFinite(slotDuration) || !Number.isFinite(secondsPerBeat)) return 0;

    const baseShortDuration = Math.max(
      PIANO_COMP_MIN_DURATION,
      Math.min(PIANO_COMP_MAX_DURATION, slotDuration * PIANO_COMP_DURATION_RATIO)
    );
    const shortDuration = getDeterministicShortDuration({
      baseShortDuration: Math.max(
        PIANO_COMP_MIN_DURATION,
        baseShortDuration * getTempoAdaptiveShortDurationMultiplier(secondsPerBeat)
      ),
      event,
      plan,
      nextPlan,
      secondsPerBeat,
    });
    const longDuration = Number.isFinite(event.durationBeats) && Number.isFinite(secondsPerBeat)
      ? Math.max(shortDuration, event.durationBeats * secondsPerBeat)
      : shortDuration;
    const legatoInfo = (event.isLong || event.forceHoldToNextAttack)
      ? getLegatoDuration({
          shortDuration,
          longDuration,
          event,
          plan,
          nextPlan,
          secondsPerBeat,
        })
      : null;

    return Math.max(0, legatoInfo?.duration ?? shortDuration);
  }

  function getTextureSwitchGapSeconds(leftEvent, rightEvent, plan, nextPlan, slotDuration, secondsPerBeat) {
    if (!leftEvent || !rightEvent || !Number.isFinite(secondsPerBeat) || secondsPerBeat <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    const leftReleaseDurationSeconds = estimatePianoEventReleaseDurationSeconds(
      leftEvent,
      plan,
      nextPlan,
      slotDuration,
      secondsPerBeat
    );
    const onsetGapSeconds = Math.max(0, (rightEvent.timeBeats - leftEvent.timeBeats) * secondsPerBeat);
    return Math.max(0, onsetGapSeconds - leftReleaseDurationSeconds);
  }

  function resolvePlaybackTextureForEvent(event, plan, nextPlan, slotDuration, secondsPerBeat, activeMode) {
    if (activeMode !== 'piano') return activeMode;
    const eventIndex = event?.playbackEventIndex;
    const events = Array.isArray(plan?.events) ? plan.events : null;
    if (!Number.isInteger(eventIndex) || !events?.length) {
      return getPlaybackTextureCandidate(event, activeMode);
    }

    const candidateModes = events.map((planEvent) => getPlaybackTextureCandidate(planEvent, activeMode));
    const minimumSwitchSeconds = Number.isFinite(rhythmConfig.isolatedTwoHandMinSwitchSeconds)
      ? Math.max(0, rhythmConfig.isolatedTwoHandMinSwitchSeconds)
      : 1;
    if (!(minimumSwitchSeconds > 0) || !Number.isFinite(minimumSwitchSeconds)) {
      return candidateModes[eventIndex] || activeMode;
    }

    const resolvedModes = [...candidateModes];
    let segmentStart = 0;
    while (segmentStart < resolvedModes.length) {
      let segmentEnd = segmentStart;
      while (segmentEnd + 1 < resolvedModes.length && resolvedModes[segmentEnd + 1] === resolvedModes[segmentStart]) {
        segmentEnd += 1;
      }

      const previousEvent = segmentStart > 0 ? events[segmentStart - 1] || null : null;
      const nextEvent = segmentEnd + 1 < events.length ? events[segmentEnd + 1] || null : null;
      const entryGapSeconds = getTextureSwitchGapSeconds(
        previousEvent,
        events[segmentStart],
        plan,
        nextPlan,
        slotDuration,
        secondsPerBeat
      );
      const exitGapSeconds = getTextureSwitchGapSeconds(
        events[segmentEnd],
        nextEvent,
        plan,
        nextPlan,
        slotDuration,
        secondsPerBeat
      );

      if (entryGapSeconds < minimumSwitchSeconds || exitGapSeconds < minimumSwitchSeconds) {
        for (let index = segmentStart; index <= segmentEnd; index++) {
          resolvedModes[index] = 'piano';
        }
      }

      segmentStart = segmentEnd + 1;
    }

    return resolvedModes[eventIndex] || activeMode;
  }

  function getNextPianoEventGapBeats(event, plan, nextPlan) {
    const nextCurrentEvent = getNextPianoEvent(event, plan);
    if (nextCurrentEvent && Number.isFinite(nextCurrentEvent.timeBeats) && Number.isFinite(event.timeBeats)) {
      return Math.max(0, nextCurrentEvent.timeBeats - event.timeBeats);
    }

    if (Array.isArray(nextPlan?.events) && nextPlan.events.length > 0 && Number.isFinite(event?.durationBeats)) {
      return Math.max(0, event.durationBeats);
    }

    return Number.isFinite(event?.durationBeats) ? Math.max(0, event.durationBeats) : null;
  }

  function canLegatoOverlapToNextEvent(event, plan) {
    const nextEvent = getNextPianoEvent(event, plan);
    if (!nextEvent) return false;
    if (Boolean(nextEvent.targetsNextProgression) !== Boolean(event.targetsNextProgression)) return false;
    if (event.forceHoldToNextAttack && event.nextGapSteps === 1) return true;
    return nextEvent.targetBlockIdx === event.targetBlockIdx;
  }

  function getPianoShortDuration({
    baseShortDuration,
    event,
    plan,
    nextPlan,
    secondsPerBeat,
    includeRandomness = true,
  }) {
    const nextGapBeats = getNextPianoEventGapBeats(event, plan, nextPlan);
    const nextGapSeconds = Number.isFinite(nextGapBeats) && Number.isFinite(secondsPerBeat)
      ? nextGapBeats * secondsPerBeat
      : null;
    const durationRandomness = includeRandomness && Number.isFinite(rhythmConfig.shortNoteDurationRandomness)
      ? clamp(rhythmConfig.shortNoteDurationRandomness, 0, 0.45)
      : 0;
    const randomMultiplier = 1 + ((Math.random() * 2) - 1) * durationRandomness;

    let spacingMultiplier = 1;
    if (Number.isFinite(nextGapSeconds)) {
      const normalizedGap = clamp((nextGapSeconds - 0.12) / 0.42, 0, 1);
      spacingMultiplier = 0.72 + (normalizedGap * 0.4);
    }

    let shortDuration = baseShortDuration * spacingMultiplier * randomMultiplier;
    const offBeatShortNoteDurationMultiplier = Number.isFinite(rhythmConfig.offBeatShortNoteDurationMultiplier)
      ? clamp(rhythmConfig.offBeatShortNoteDurationMultiplier, 0.5, 1)
      : 1;
    if (event?.slotKind === 'offbeat') {
      shortDuration *= offBeatShortNoteDurationMultiplier;
    }
    shortDuration = Math.max(PIANO_COMP_MIN_DURATION, shortDuration);

    if (Number.isFinite(nextGapSeconds)) {
      const maxAllowedBeforeNextAttack = Math.max(
        PIANO_COMP_MIN_DURATION,
        nextGapSeconds * 0.9
      );
      shortDuration = Math.min(shortDuration, maxAllowedBeforeNextAttack);
    }

    return Math.max(PIANO_COMP_MIN_DURATION, shortDuration);
  }

  function getVariableShortDuration(durationOptions) {
    return getPianoShortDuration({
      ...durationOptions,
      includeRandomness: true,
    });
  }

  function getLegatoDuration({
    shortDuration,
    longDuration,
    event,
    plan,
    nextPlan,
    secondsPerBeat,
  }) {
    const nextGapBeats = getNextPianoEventGapBeats(event, plan, nextPlan);
    const nextGapSeconds = Number.isFinite(nextGapBeats) && Number.isFinite(secondsPerBeat)
      ? nextGapBeats * secondsPerBeat
      : null;
    const configuredOverlapMs = Number.isFinite(rhythmConfig.forcedLegatoOverlapMs)
      ? Math.max(0, rhythmConfig.forcedLegatoOverlapMs)
      : 35;
    const configuredOverlapSeconds = configuredOverlapMs / 1000;
    const minimumAudibleOverlapSeconds = Math.max(0, (Number(CHORD_FADE_BEFORE) || 0) + 0.02);
    const overlapSeconds = Math.max(configuredOverlapSeconds, minimumAudibleOverlapSeconds);
    const canOverlapNextEvent = canLegatoOverlapToNextEvent(event, plan);

    if (!Number.isFinite(nextGapSeconds)) {
      return {
        duration: Math.max(longDuration, shortDuration + overlapSeconds),
        nextGapBeats,
        overlapSeconds,
        configuredOverlapSeconds,
      };
    }

    return {
      duration: canOverlapNextEvent
        ? Math.max(longDuration, nextGapSeconds + overlapSeconds)
        : longDuration,
      nextGapBeats,
      overlapSeconds,
      configuredOverlapSeconds,
    };
  }

  function isPianoResetFriendlyQuality(quality) {
    return quality === 'maj7' || quality === '6';
  }

  function getPianoChoiceTransitionCost(previousChoice, nextChoice, previousEntry = null) {
    if (!previousChoice || !nextChoice) return 0;

    const delta = (nextChoice.lowestMidi ?? 0) - (previousChoice.lowestMidi ?? 0);
    const distance = Math.abs(delta);
    if (distance === 0) return 0;

    const previousQuality = previousEntry
      ? getPlayedChordQuality(previousEntry.chord, previousEntry.isMinor)
      : '';
    const resetFriendly = isPianoResetFriendlyQuality(previousQuality);

    if (delta < 0) {
      // Descending motion is the default gravitational pull of the line.
      return distance;
    }

    // Upward resets are possible, but should cost more unless the previous
    // harmony sounds like a cadence / cycle marker.
    const upwardWeight = resetFriendly ? 0.7 : 2.4;
    const resetBonus = resetFriendly ? Math.min(distance, 5) * 0.35 : 0;
    return Math.max(0, (distance * upwardWeight) - resetBonus);
  }

  function isPassingDiminishedEligiblePosition(position, runLength) {
    if (!Number.isInteger(position) || !Number.isInteger(runLength) || runLength < 2) return false;
    if (position >= runLength) return false;
    return (position % 2) !== (runLength % 2);
  }

  function shouldUsePassingDiminishedAtPosition() {
    const configuredProbability = Number.isFinite(rhythmConfig.oneStepRunPassingDiminishedProbability)
      ? rhythmConfig.oneStepRunPassingDiminishedProbability
      : 0;
    const probability = Math.max(0, Math.min(1, configuredProbability));
    return Math.random() < probability;
  }

  function entriesSharePlanHarmony(left, right) {
    return Boolean(left && right
      && !left.isSentinel
      && !right.isSentinel
      && Boolean(left.targetsNextProgression) === Boolean(right.targetsNextProgression)
      && left.key === right.key
      && left.isMinor === right.isMinor
      && chordsMatch(left.chord, right.chord));
  }

  function buildPassingDiminishedCandidates(entry) {
    const targetRootPitchClass = getChordRootPitchClass(entry?.chord, entry?.key);
    if (!Number.isFinite(targetRootPitchClass)) return null;

    const diminishedRootPitchClass = (targetRootPitchClass + 11) % 12;
    const bassPitchClasses = [0, 3, 6, 9].map(offset => (diminishedRootPitchClass + offset) % 12);
    const droppedIntervals = [0, 6, 9, 15];
    const candidates = [];

    for (const bassPitchClass of bassPitchClasses) {
      const noteCandidates = buildShapeEntriesFromResolvedIntervals(
        bassPitchClass,
        droppedIntervals
      );
      for (const noteCandidate of noteCandidates) {
        candidates.push({
          name: `dim:${NOTE_NAMES[bassPitchClass]}`,
          modeName: 'piano',
          notes: noteCandidate.notes,
          voiceScore: noteCandidate.voiceScore,
          lowestMidi: noteCandidate.lowestMidi,
          isPassingDiminished: true,
        });
      }
    }

    if (candidates.length === 0) return null;

    const uniqueCandidates = [];
    for (const candidate of candidates) {
      if (!uniqueCandidates.some(existing => pianoChoicesMatch(existing, candidate))) {
        uniqueCandidates.push(candidate);
      }
    }

    const inZoneCandidates = uniqueCandidates.filter((candidate) =>
      candidate.lowestMidi >= pianoRanges.lowestNoteZoneLow
      && candidate.lowestMidi <= pianoRanges.lowestNoteZoneHigh
    );
    return (inZoneCandidates.length ? inZoneCandidates : uniqueCandidates)
      .sort((left, right) => {
        if (left.voiceScore !== right.voiceScore) return left.voiceScore - right.voiceScore;
        return left.lowestMidi - right.lowestMidi;
      });
  }

  function comparePianoChoiceScores(left, right) {
    if (!left) return 1;
    if (!right) return -1;
    if (left.totalBottomMovement !== right.totalBottomMovement) {
      return left.totalBottomMovement - right.totalBottomMovement;
    }
    if (left.totalVoiceScore !== right.totalVoiceScore) {
      return left.totalVoiceScore - right.totalVoiceScore;
    }
    return (left.candidate?.lowestMidi ?? 0) - (right.candidate?.lowestMidi ?? 0);
  }

  function solvePianoChoiceSegment(
    sequence,
    candidatesByIndex,
    activeMode = 'piano',
    secondsPerBeat = null,
    {
      enforceRunMovement = true,
      enforceThinnedOuterMovement = true,
    } = {}
  ) {
    if (!Array.isArray(sequence) || !Array.isArray(candidatesByIndex) || candidatesByIndex.length === 0) {
      return [];
    }

    let previousScores = candidatesByIndex[0].map((candidate) => ({
      candidate,
      totalBottomMovement: 0,
      totalVoiceScore: candidate?.voiceScore ?? Number.POSITIVE_INFINITY,
      prevIndex: -1,
    }));
    const scoreRows = [previousScores];

    for (let rowIndex = 1; rowIndex < candidatesByIndex.length; rowIndex++) {
      const rowCandidates = candidatesByIndex[rowIndex];
      const debugReasons = {
        invalidPreviousScore: 0,
        sameVoicingRunMove: 0,
        thinnedOuterVoices: 0,
      };
      const nextScores = rowCandidates.map((candidate) => {
        let bestScore = null;
        for (let prevIndex = 0; prevIndex < previousScores.length; prevIndex++) {
          const prevScore = previousScores[prevIndex];
          if (!Number.isFinite(prevScore?.totalBottomMovement) || !Number.isFinite(prevScore?.totalVoiceScore)) {
            debugReasons.invalidPreviousScore += 1;
            continue;
          }
          const previousEntry = sequence[rowIndex - 1] || null;
          const currentEntry = sequence[rowIndex] || null;
          if (enforceRunMovement
            && isForcedAdjacentRunMove(previousEntry, currentEntry)
            && pianoChoicesMatch(prevScore.candidate, candidate)) {
            debugReasons.sameVoicingRunMove += 1;
            continue;
          }
          if (enforceRunMovement
            && enforceThinnedOuterMovement
            && isForcedAdjacentRunMove(previousEntry, currentEntry)
            && doThinnedOuterVoicesNeedToMove(
              previousEntry,
              currentEntry,
              prevScore.candidate,
              candidate,
              activeMode,
              secondsPerBeat
            )) {
            debugReasons.thinnedOuterVoices += 1;
            continue;
          }
          const candidateScore = {
            candidate,
            totalBottomMovement: prevScore.totalBottomMovement
              + getPianoChoiceTransitionCost(prevScore.candidate, candidate, previousEntry),
            totalVoiceScore: prevScore.totalVoiceScore
              + (candidate?.voiceScore ?? Number.POSITIVE_INFINITY),
            prevIndex,
          };
          if (!bestScore || comparePianoChoiceScores(candidateScore, bestScore) < 0) {
            bestScore = candidateScore;
          }
        }
        return bestScore;
      });

      scoreRows.push(nextScores);
      previousScores = nextScores;
    }

    let bestFinalIndex = -1;
    for (let i = 0; i < previousScores.length; i++) {
      const score = previousScores[i];
      if (!score) continue;
      if (bestFinalIndex === -1 || comparePianoChoiceScores(score, previousScores[bestFinalIndex]) < 0) {
        bestFinalIndex = i;
      }
    }
    if (bestFinalIndex === -1) {
      return new Array(sequence.length).fill(null);
    }

    const chosen = new Array(sequence.length);
    for (let rowIndex = scoreRows.length - 1, candidateIndex = bestFinalIndex; rowIndex >= 0; rowIndex--) {
      const score = scoreRows[rowIndex][candidateIndex];
      if (!score) {
        return new Array(sequence.length).fill(null);
      }
      chosen[rowIndex] = score.candidate;
      candidateIndex = score.prevIndex;
    }
    return chosen;
  }

  function resolvePianoChoicePath(
    sequence,
    candidatesByIndex,
    activeMode = 'piano',
    secondsPerBeat = null,
    {
      enforceRunMovement = true,
      enforceThinnedOuterMovement = true,
    } = {}
  ) {
    if (!Array.isArray(sequence) || !Array.isArray(candidatesByIndex) || candidatesByIndex.length === 0) {
      return [];
    }

    const chosen = new Array(sequence.length);
    let segmentStart = 0;
    while (segmentStart < sequence.length) {
      let segmentEnd = segmentStart;
      while (
        segmentEnd + 1 < sequence.length
        && isForcedAdjacentRunMove(sequence[segmentEnd], sequence[segmentEnd + 1])
      ) {
        segmentEnd += 1;
      }

      const segmentChoices = solvePianoChoiceSegment(
        sequence.slice(segmentStart, segmentEnd + 1),
        candidatesByIndex.slice(segmentStart, segmentEnd + 1),
        activeMode,
        secondsPerBeat,
        {
          enforceRunMovement,
          enforceThinnedOuterMovement,
        }
      );
      for (let index = segmentStart; index <= segmentEnd; index++) {
        chosen[index] = segmentChoices[index - segmentStart] || null;
      }
      segmentStart = segmentEnd + 1;
    }
    return chosen;
  }

  function buildIntegratedPassingDiminishedCandidates(sequence, candidateSets, activeMode, secondsPerBeat) {
    return sequence.map((entry, index) => {
      const normalCandidates = Array.isArray(candidateSets[index]) && candidateSets[index].length
        ? [...candidateSets[index]]
        : [null];
      const hasNormalChoice = normalCandidates.some(candidate => candidate?.notes?.length);
      const nextEntry = sequence[index + 1] || null;
      const isHarmonySegmentEnd = !entry
        || entry.isSentinel
        || nextEntry?.isSentinel
        || !entriesSharePlanHarmony(entry, nextEntry);
      const startsNewHarmony = Boolean(entry && index > 0 && !entriesSharePlanHarmony(sequence[index - 1], entry));
      const isFirstBeatOfMeasure = getSlotKind(entry?.slotIndex) === 'beat'
        && (Math.floor((entry?.slotIndex ?? -1) / 2) % 4) === 0;
      const isForbiddenThinnedPassingDiminished = startsNewHarmony
        && isFirstBeatOfMeasure
        && wouldThinOneStepRunEvent(entry, activeMode, secondsPerBeat);
      if (
        !entry
        || entry.isSentinel
        || !hasNormalChoice
        || isHarmonySegmentEnd
        || isForbiddenThinnedPassingDiminished
        || !isPassingDiminishedEligiblePosition(entry.oneStepRunPosition, entry.oneStepRunLength)
        || !shouldUsePassingDiminishedAtPosition()
      ) {
        return normalCandidates;
      }

      const diminishedCandidates = buildPassingDiminishedCandidates(entry) || [];
      if (!diminishedCandidates.length) {
        return normalCandidates;
      }

      // When the probability hits, we now treat the position as a true
      // passing-diminished slot: the solver must choose among diminished
      // voicings only, and surrounding normal voicings adapt around it.
      return diminishedCandidates;
    });
  }

  function mergePianoChoiceFallback(sequence, preferredChoices, fallbackChoices) {
    if (!Array.isArray(preferredChoices) || !Array.isArray(fallbackChoices)) {
      return Array.isArray(preferredChoices) ? preferredChoices : [];
    }

    const merged = [...preferredChoices];
    let index = 0;
    while (index < merged.length) {
      const entry = sequence[index] || null;
      if (!entry || entry.isSentinel) {
        if (!merged[index]?.notes?.length && fallbackChoices[index]?.notes?.length) {
          merged[index] = fallbackChoices[index];
        }
        index += 1;
        continue;
      }

      let segmentEnd = index;
      while (
        segmentEnd + 1 < merged.length
        && sequence[segmentEnd + 1]
        && !sequence[segmentEnd + 1].isSentinel
        && (sequence[segmentEnd + 1].slotIndex - sequence[segmentEnd].slotIndex) === 1
      ) {
        segmentEnd += 1;
      }

      const segmentHasMissingChoice = merged
        .slice(index, segmentEnd + 1)
        .some((choice) => !choice?.notes?.length);
      if (segmentHasMissingChoice) {
        for (let cursor = index; cursor <= segmentEnd; cursor++) {
          if (fallbackChoices[cursor]?.notes?.length) {
            merged[cursor] = fallbackChoices[cursor];
          }
        }
      }

      index = segmentEnd + 1;
    }

    return merged.map((choice, idx) => choice?.notes?.length ? choice : (fallbackChoices[idx] || null));
  }

  function buildPianoVoicingChoicePlan({
    events,
    nextFirstChord = null,
    nextKey = null,
    nextIsMinor = false,
    secondsPerBeat = null,
  }) {
    if (!Array.isArray(events) || !events.length) return [];

    const sequence = events.map((event, eventIndex) => ({
      chord: event.planChord,
      eventIndex,
      key: event.planKey,
      isMinor: event.planIsMinor,
      slotIndex: event.slotIndex,
      oneStepRunLength: event.oneStepRunLength,
      oneStepRunPosition: event.oneStepRunPosition,
      targetsNextProgression: event.targetsNextProgression,
      isSentinel: false,
    }));

    if (nextFirstChord && Number.isFinite(nextKey)) {
      sequence.push({
        chord: nextFirstChord,
        eventIndex: -1,
        key: nextKey,
        isMinor: nextIsMinor,
        oneStepRunLength: null,
        oneStepRunPosition: null,
        targetsNextProgression: true,
        slotIndex: Number.POSITIVE_INFINITY,
        isSentinel: true,
      });
    }

    const candidatesByIndex = sequence.map((entry) => {
      const candidates = buildPianoShapeCandidates(entry.chord, entry.key, entry.isMinor);
      return Array.isArray(candidates) && candidates.length ? candidates : [null];
    });
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    const chosen = resolvePianoChoicePath(sequence, candidatesByIndex, activeMode, secondsPerBeat, {
      enforceRunMovement: false,
      enforceThinnedOuterMovement: false,
    });
    const repeatedMotionChoices = applyRepeatedChordMotion(sequence, chosen);
    const repeatedMotionCandidateSets = buildRepeatedChordMotionCandidateSets(sequence, chosen);
    const constrainedNormalChoices = resolvePianoChoicePath(
      sequence,
      repeatedMotionCandidateSets,
      activeMode,
      secondsPerBeat
    );
    const integratedCandidatesByIndex = buildIntegratedPassingDiminishedCandidates(
      sequence,
      repeatedMotionCandidateSets,
      activeMode,
      secondsPerBeat
    );
    const adjustedChosen = resolvePianoChoicePath(
      sequence,
      integratedCandidatesByIndex,
      activeMode,
      secondsPerBeat
    );
    const mergedChosen = mergePianoChoiceFallback(
      sequence,
      adjustedChosen,
      constrainedNormalChoices.some(choice => choice?.notes?.length)
        ? constrainedNormalChoices
        : repeatedMotionChoices
    );
    return mergedChosen.slice(0, events.length);
  }

  function getPianoChordVoiceEntries(
    voicing,
    chord = null,
    key = null,
    isMinor = false,
    planChoice = null,
    modeOverride = null
  ) {
    const shapedNotes = buildPianoShapeNotes(chord, key, isMinor, planChoice, modeOverride);
    const resolvedMode = shapedNotes?.modeName || resolvePianoModeName(modeOverride);
    const pianoNotes = shapedNotes?.notes?.length
      ? [...shapedNotes.notes]
      : [...(voicing?.guideTones || []), ...buildPianoColorToneSet(voicing?.colorTones || [])]
        .sort((a, b) => a - b);
    if (pianoNotes.length === 0) return [];

    return pianoNotes.map((midi, index) => ({
      key: `piano:${index}:${midi}`,
      category: 'piano',
      midi,
      role: index === 0 ? 'lower-guide' : 'comp',
      volume: getPianoVoiceBaseVolume(index, pianoNotes.length, resolvedMode) * PIANO_VOLUME_MULTIPLIER,
    }));
  }

  function collectSampleNotes(voicing, sets) {
    if (!voicing) return;
    for (let midi = pianoRanges.noteRangeLow; midi <= pianoRanges.noteRangeHigh; midi++) {
      sets.pianoNotes.add(midi);
    }
    for (const entry of getPianoChordVoiceEntries(voicing)) {
      sets.pianoNotes.add(entry.midi);
    }
  }

  function buildPlan({
    chords,
    key = null,
    isMinor = false,
    beatsPerChord,
    beatsPerBar = 4,
    nextFirstChord,
    nextKey = null,
    nextIsMinor = false,
    nextStartsNewKey = false,
    shouldReset,
    hasIncomingAnticipation,
    previousTailBeats = null,
    endingCue = null,
  }) {
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    const swingRatio = getSwingRatio();
    const secondsPerBeat = getSecondsPerBeat();
    return createPianoPlan({
      chords,
      key,
      isMinor,
      beatsPerChord,
      beatsPerBar,
      secondsPerBeat,
      nextFirstChord,
      nextKey,
      nextIsMinor,
      nextStartsNewKey,
      shouldReset,
      hasIncomingAnticipation,
      previousTailBeats,
      activeMode,
      buildVoicingChoicePlan: buildPianoVoicingChoicePlan,
      swingRatio,
      endingCue,
    });
  }

  function resolvePianoPlaybackEventData({
    progression,
    nextProgression,
    event,
    plan,
    nextPlan,
    slotDuration,
    secondsPerBeat,
  }) {
    const targetProgression = event.targetsNextProgression ? nextProgression : progression;
    if (!targetProgression?.chords?.length) return null;

    const shouldUseRepeatedChordIdx = Number.isInteger(event.repeatedChordIdx) && !event.isAnticipation;
    const effectiveChordIdx = shouldUseRepeatedChordIdx
      ? event.repeatedChordIdx
      : event.targetVoicingChordIdx;
    const voicing = getVoicingAtIndex(
      targetProgression.chords,
      targetProgression.key,
      effectiveChordIdx,
      targetProgression.isMinor
    );
    if (!voicing) return null;

    const chord = event.planChord || targetProgression.chords[effectiveChordIdx] || null;
    const planChoice = event.voicingChoice || null;
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    const playbackMode = resolvePlaybackTextureForEvent(
      event,
      plan,
      nextPlan,
      slotDuration,
      secondsPerBeat,
      activeMode
    );
    const entries = getPianoChordVoiceEntries(
      voicing,
      chord,
      targetProgression.key,
      targetProgression.isMinor,
      planChoice,
      playbackMode
    );
    if (entries.length === 0) return null;

    return {
      activeMode,
      chord,
      entries,
      targetProgression,
      voicing,
    };
  }

  function buildPianoEventPlaybackState({
    event,
    entries,
    activeMode,
    slotDuration,
    secondsPerBeat,
    plan,
    nextPlan,
  }) {
    const baseShortDuration = Math.max(
      PIANO_COMP_MIN_DURATION,
      Math.min(PIANO_COMP_MAX_DURATION, slotDuration * PIANO_COMP_DURATION_RATIO)
    );
    const shortDuration = getVariableShortDuration({
      baseShortDuration: Math.max(
        PIANO_COMP_MIN_DURATION,
        baseShortDuration * getTempoAdaptiveShortDurationMultiplier(secondsPerBeat)
      ),
      event,
      plan,
      nextPlan,
      secondsPerBeat,
    });
    const longDuration = Number.isFinite(event.durationBeats) && Number.isFinite(secondsPerBeat)
      ? Math.max(shortDuration, event.durationBeats * secondsPerBeat)
      : shortDuration;
    const legatoInfo = (event.isLong || event.forceHoldToNextAttack)
      ? getLegatoDuration({
          shortDuration,
          longDuration,
          event,
          plan,
          nextPlan,
          secondsPerBeat,
        })
      : null;
    const duration = legatoInfo?.duration ?? shortDuration;
    const isLegatoEvent = Boolean(legatoInfo);
    const offbeatVolumeSpread = Number.isFinite(rhythmConfig.offbeatVolumeSpread)
      ? rhythmConfig.offbeatVolumeSpread
      : 0;
    const oddEvenBeatVolumeSpread = Number.isFinite(rhythmConfig.oddEvenBeatVolumeSpread)
      ? rhythmConfig.oddEvenBeatVolumeSpread
      : 0;
    const slotVolumeMultiplier = event.slotKind === 'offbeat'
      ? Math.max(0, 1 + offbeatVolumeSpread)
      : 1;
    const anchoredBeatIndex = getVolumeBeatAnchor(event.slotIndex);
    const isOddBeat = anchoredBeatIndex % 2 === 0;
    const beatParityMultiplier = isOddBeat
      ? (1 + (oddEvenBeatVolumeSpread / 2))
      : Math.max(0, 1 - (oddEvenBeatVolumeSpread / 2));
    const twoHandGlobalVolumeBoost = activeMode === 'twoHand' && Number.isFinite(rhythmConfig.twoHandGlobalVolumeBoost)
      ? Math.max(0, rhythmConfig.twoHandGlobalVolumeBoost)
      : 1;
    const eventVolumeMultiplier = slotVolumeMultiplier * beatParityMultiplier * twoHandGlobalVolumeBoost;
    const noteTimingHumanizeMs = Number.isFinite(rhythmConfig.noteTimingHumanizeMs)
      ? Math.max(0, rhythmConfig.noteTimingHumanizeMs)
      : 0;
    const noteTimingHumanizeSeconds = noteTimingHumanizeMs / 1000;
    let selectedEntries = entries.slice();

    return {
      duration,
      eventVolumeMultiplier,
      fullEntries: entries.slice(),
      isLegatoEvent,
      noteTimingHumanizeSeconds,
      selectedEntries,
    };
  }

  function playEvent({
    progression,
    event,
    plan,
    nextPlan,
    endingCue = null,
    endingAccentMultiplier,
    endingFinalAccentMultiplier,
    endingCrescendoLeadMeasures,
    time,
    slotDuration,
    secondsPerBeat,
    nextProgression
  }) {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    const playbackEventData = resolvePianoPlaybackEventData({
      progression,
      nextProgression,
      event,
      plan,
      nextPlan,
      slotDuration,
      secondsPerBeat,
    });
    if (!playbackEventData) return;

    const startTime = getPianoScheduledStartTime(audioCtx, time);
    const playbackState = buildPianoEventPlaybackState({
      event,
      entries: playbackEventData.entries,
      activeMode: playbackEventData.activeMode,
      slotDuration,
      secondsPerBeat,
      plan,
      nextPlan,
    });
    const orderedEntries = shuffleArray(playbackState.selectedEntries);
    const tentativeNoteStartTimes = [];

    for (let index = 0; index < orderedEntries.length; index++) {
      const noteOffset = playbackState.noteTimingHumanizeSeconds > 0
        ? ((Math.random() * 0.85) - 1) * playbackState.noteTimingHumanizeSeconds
        : 0;
      const noteStartTime = Math.max(audioCtx.currentTime, startTime + noteOffset);
      tentativeNoteStartTimes.push(noteStartTime);
    }

    for (let index = 0; index < orderedEntries.length; index++) {
      const voice = orderedEntries[index];
      const noteStartTime = tentativeNoteStartTimes[index] ?? startTime;
      const dynamicMultiplier = getShortEndingDynamicMultiplier({
        endingCue,
        timeBeats: event?.timeBeats,
        beatsPerBar: progression?.beatsPerBar,
        targetMultiplier: endingAccentMultiplier,
        finalAccentMultiplier: endingFinalAccentMultiplier,
        leadMeasures: endingCrescendoLeadMeasures
      });
      const finalVolume = voice.volume * playbackState.eventVolumeMultiplier * dynamicMultiplier;
      const pianoSample = getPianoSampleLayerGain(finalVolume);
      playSample(
        voice.category,
        voice.midi,
        noteStartTime,
        playbackState.duration,
        pianoSample.adjustedVolume,
        {
          layer: pianoSample.layer,
          legato: playbackState.isLegatoEvent,
        }
      );
    }
  }

  function getPianoScheduledStartTime(audioCtx, time) {
    const globalDelayMs = Number.isFinite(rhythmConfig.pianoGlobalDelayMs)
      ? rhythmConfig.pianoGlobalDelayMs
      : 0;
    return Math.max(time + (globalDelayMs / 1000), audioCtx.currentTime);
  }

  function getEndingShortDuration(slotDuration, secondsPerBeat, endingStyle = '') {
    const safeSlotDuration = Number.isFinite(slotDuration) && slotDuration > 0
      ? slotDuration
      : (Number.isFinite(secondsPerBeat) && secondsPerBeat > 0 ? secondsPerBeat : 0.25);
    const baseShortDuration = Math.max(
      PIANO_COMP_MIN_DURATION,
      Math.min(PIANO_COMP_MAX_DURATION, safeSlotDuration * PIANO_COMP_DURATION_RATIO)
    );
    const offBeatShortNoteDurationMultiplier = Number.isFinite(rhythmConfig.offBeatShortNoteDurationMultiplier)
      ? clamp(rhythmConfig.offBeatShortNoteDurationMultiplier, 0.5, 1)
      : 1;
    const offbeatMultiplier = endingStyle === 'short'
      ? offBeatShortNoteDurationMultiplier
      : 1;
    return Math.max(
      PIANO_COMP_MIN_DURATION,
      baseShortDuration * getTempoAdaptiveShortDurationMultiplier(secondsPerBeat) * offbeatMultiplier
    );
  }

  function playEnding({
    progression,
    chordIndex = 0,
    time,
    durationSeconds,
    endingStyle = '',
    endingAccentMultiplier,
    endingFinalAccentMultiplier,
    endingCrescendoLeadMeasures,
    slotDuration,
    secondsPerBeat
  }) {
    const audioCtx = getAudioContext();
    if (!audioCtx || typeof playSample !== 'function' || !progression?.chords?.length) return;

    const safeChordIndex = Math.max(
      0,
      Math.min(progression.chords.length - 1, Math.round(Number(chordIndex) || 0))
    );
    const chord = progression.chords[safeChordIndex] || null;
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    const voicing = typeof getVoicingAtIndex === 'function'
      ? getVoicingAtIndex(progression.chords, progression.key, safeChordIndex, progression.isMinor)
      : null;
    const entries = getPianoChordVoiceEntries(
      voicing,
      chord,
      progression.key,
      progression.isMinor,
      null,
      activeMode
    );
    if (entries.length === 0) return;

    const fallbackShortDuration = Math.max(
      Number.isFinite(PIANO_COMP_MIN_DURATION) ? PIANO_COMP_MIN_DURATION : 0.08,
      Math.min(
        Number.isFinite(PIANO_COMP_MAX_DURATION) ? PIANO_COMP_MAX_DURATION : 0.45,
        Number(slotDuration || secondsPerBeat || 0.25) * (Number.isFinite(PIANO_COMP_DURATION_RATIO) ? PIANO_COMP_DURATION_RATIO : 0.72)
      )
    );
    const duration = Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : getEndingShortDuration(slotDuration, secondsPerBeat, endingStyle);
    const startTime = getPianoScheduledStartTime(audioCtx, time);
    const endingVolumeMultiplier = activeMode === 'twoHand' ? 1.08 : 1.14;
    const dynamicMultiplier = getShortEndingDynamicMultiplier({
      endingCue: { style: endingStyle },
      isFinalEnding: endingStyle === 'short',
      targetMultiplier: endingAccentMultiplier,
      finalAccentMultiplier: endingFinalAccentMultiplier,
      leadMeasures: endingCrescendoLeadMeasures
    });

    for (const voice of entries) {
      const finalVolume = voice.volume * endingVolumeMultiplier * dynamicMultiplier;
      const pianoSample = getPianoSampleLayerGain(finalVolume);
      playSample(
        voice.category,
        voice.midi,
        startTime,
        duration,
        pianoSample.adjustedVolume,
        {
          layer: pianoSample.layer,
          legato: duration > fallbackShortDuration,
        }
      );
    }
  }

  function stopAll() {
    // Piano comping uses short one-shot samples only; nothing persistent to stop.
  }

  function clear() {
  }

  return {
    buildPlan,
    collectSampleNotes,
    playEvent,
    playEnding,
    stopAll,
    clear,
  };
}

