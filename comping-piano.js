import rhythmConfig from './piano-rhythm-config.js';
import voicingConfig from './voicing-config.js';
import pianoVoicingConfig from './piano-voicing-config.js';
import {
  DEFAULT_SWING_RATIO,
  getSwingFirstSubdivisionDurationBeats,
  getSwingOffbeatPositionBeats,
} from './swing-utils.js';

const PIANO_RUN_DEBUG_LOGS = true;
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

function weightedPick(weightMap) {
  const entries = Object.entries(weightMap)
    .map(([jump, weight]) => ({ jump: Number(jump), weight: Number(weight) }))
    .filter(entry => Number.isFinite(entry.jump) && Number.isFinite(entry.weight) && entry.weight > 0);
  if (entries.length === 0) return 3;

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.jump;
  }
  return entries[entries.length - 1].jump;
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

function shuffleArray(values) {
  const clone = [...values];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function interpolateLinear(startValue, endValue, progress) {
  return startValue + ((endValue - startValue) * progress);
}

function getTempoInterpolationProgress(tempoBpm, startBpm = 150, endBpm = 250) {
  if (!Number.isFinite(tempoBpm)) return 0;
  if (tempoBpm <= startBpm) return 0;
  if (tempoBpm >= endBpm) return 1;
  return (tempoBpm - startBpm) / (endBpm - startBpm);
}

function getInterpolatedWeightMap(baseWeights, highTempoWeights, tempoBpm) {
  const progress = getTempoInterpolationProgress(tempoBpm);
  if (progress <= 0 || !highTempoWeights || typeof highTempoWeights !== 'object') {
    return baseWeights;
  }

  const merged = {};
  for (const [jump, baseWeight] of Object.entries(baseWeights || {})) {
    const numericBaseWeight = Number(baseWeight);
    if (!Number.isFinite(numericBaseWeight)) continue;

    if (Object.prototype.hasOwnProperty.call(highTempoWeights, jump)) {
      const numericHighWeight = Number(highTempoWeights[jump]);
      merged[jump] = Number.isFinite(numericHighWeight)
        ? interpolateLinear(numericBaseWeight, numericHighWeight, progress)
        : numericBaseWeight;
      continue;
    }

    merged[jump] = numericBaseWeight;
  }

  return merged;
}

function getBeatPositionInMeasure(beatIndex) {
  return beatIndex % 4;
}

function getNextOneOrThreeBeat(startBeat) {
  for (let beat = Math.ceil(startBeat); beat <= Math.ceil(startBeat) + 8; beat++) {
    const pos = getBeatPositionInMeasure(beat);
    if ((pos === 0 || pos === 2) && beat >= startBeat) {
      return beat;
    }
  }
  return startBeat + 4;
}

function buildHarmonicBlocks(chords, beatsPerChord) {
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
    const nextStrongBeat = getNextOneOrThreeBeat(startBeat + 1);
    const usefulEndBeat = Math.min(endBeat, nextStrongBeat, startBeat + 4);
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

function isSlotPlayable(slotIndex, chosenSlots) {
  return !chosenSlots.has(slotIndex - 1)
    && !chosenSlots.has(slotIndex)
    && !chosenSlots.has(slotIndex + 1);
}

function findCandidateSlotIndices(startSlot, endBeat, totalSlots, swingRatio = DEFAULT_SWING_RATIO) {
  const candidates = [];
  for (let slotIndex = Math.max(0, startSlot); slotIndex < totalSlots; slotIndex++) {
    if (getSlotTimeBeats(slotIndex, swingRatio) >= endBeat) break;
    candidates.push(slotIndex);
  }
  return candidates;
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

function createPianoPlan({
  chords,
  key = null,
  isMinor = false,
  beatsPerChord,
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
  const blocks = buildHarmonicBlocks(chords, beatsPerChord);
  const eventOptions = {
    blocks,
    totalBeats,
    nextFirstChord,
    nextStartsNewKey,
    swingRatio,
  };
  const chosenSlots = new Set();
  const representedBlocks = new Set(hasIncomingAnticipation ? [0] : []);
  const minimumStartSlot = getBoundaryBlockedSlotCount(totalSlots, previousTailBeats, hasIncomingAnticipation, swingRatio);
  let slotIndex = Math.max(
    minimumStartSlot,
    getInitialSlotIndex(shouldReset, hasIncomingAnticipation)
  );
  let forcedOneStepJumpsRemaining = 0;
  let oneStepRunCooldownRemaining = 0;
  let oneStepRunCooldownPending = 0;
  let previousJump = null;

  while (slotExistsWithinProgression(slotIndex, totalSlots)) {
    chosenSlots.add(slotIndex);
    if (forcedOneStepJumpsRemaining <= 0 && oneStepRunCooldownRemaining > 0) {
      oneStepRunCooldownRemaining -= 1;
    }
    const slotKind = getSlotKind(slotIndex);
    let nextJump = forcedOneStepJumpsRemaining > 0
      ? 1
      : weightedPick(getJumpWeights(slotKind, activeMode, secondsPerBeat));
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
    slotIndex += nextJump;
  }

  const ensureBlockRepresentation = (block) => {
    if (representedBlocks.has(block.blockIdx)) return;

    const blockStartSlot = block.startBeat * 2;
    const blockCandidateStartSlot = block.blockIdx === 0
      ? Math.max(minimumStartSlot, blockStartSlot)
      : blockStartSlot;
    const allBlockCandidateSlots = findCandidateSlotIndices(blockCandidateStartSlot, block.usefulEndBeat, totalSlots, swingRatio)
      .filter(candidateSlot => {
        const timeBeats = getSlotTimeBeats(candidateSlot, swingRatio);
        const candidateBlock = getBlockForTime(blocks, timeBeats);
        return Boolean(candidateBlock && candidateBlock.blockIdx === block.blockIdx);
      });
    const candidateSlots = allBlockCandidateSlots
      .filter(candidateSlot => {
        return isSlotPlayable(candidateSlot, chosenSlots);
      });

    if (candidateSlots.length === 0 && allBlockCandidateSlots.length === 0) return;

    const preferredSlot = candidateSlots.find(candidateSlot => candidateSlot >= (block.startBeat * 2))
      ?? candidateSlots[candidateSlots.length - 1]
      ?? allBlockCandidateSlots.find(candidateSlot => candidateSlot >= (block.startBeat * 2))
      ?? allBlockCandidateSlots[allBlockCandidateSlots.length - 1];

    if (block.blockIdx === 0 && !isSlotPlayable(preferredSlot, chosenSlots)) {
      chosenSlots.delete(preferredSlot - 1);
      chosenSlots.delete(preferredSlot);
      chosenSlots.delete(preferredSlot + 1);
    }

    chosenSlots.add(preferredSlot);
    representedBlocks.add(block.blockIdx);
  };

  const events = buildSortedPianoPlanEvents(chosenSlots, eventOptions);

  for (const event of events) {
    if (event.targetsNextProgression) {
      representedBlocks.add(0);
      continue;
    }
    const targetBlock = blocks[event.targetBlockIdx];
    if (targetBlock && event.timeBeats < targetBlock.usefulEndBeat) {
      representedBlocks.add(targetBlock.blockIdx);
    }
  }

  for (const block of blocks) {
    ensureBlockRepresentation(block);
  }

  const finalEvents = buildSortedPianoPlanEvents(chosenSlots, eventOptions);
  annotatePianoEventSpacing(finalEvents, blocks);
  annotatePianoOneStepRuns(finalEvents);

  const anticipatesNextStart = finalEvents.some(event =>
    event.isAnticipation
    && event.slotIndex === getLastPreBoundaryOffbeatSlotIndex(totalBeats)
    && nextFirstChord
  );

  const playbackEvents = finalEvents
    .map((event) => {
      const sourceBlock = blocks[event.sourceBlockIdx] || null;
      const chordProgressInBlock = sourceBlock
        ? Math.max(0, Math.min(
            sourceBlock.endChordIdx - sourceBlock.startChordIdx,
            Math.floor((event.timeBeats - sourceBlock.startBeat) / beatsPerChord)
          ))
        : 0;
      const repeatedChordIdx = sourceBlock
        ? sourceBlock.startChordIdx + chordProgressInBlock
        : event.targetVoicingChordIdx;
      const planChord = event.targetsNextProgression
        ? (nextFirstChord || null)
        : (event.isAnticipation
            ? (chords[event.targetVoicingChordIdx] || null)
            : (chords[repeatedChordIdx] || chords[event.targetVoicingChordIdx] || null));

      return {
        ...event,
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

export function createPianoComping({ constants, helpers }) {
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
    CONTEXTUAL_QUALITY_RULES = [],
    DOMINANT_DEFAULT_QUALITY_MAJOR = {},
    DOMINANT_DEFAULT_QUALITY_MINOR = {},
    QUALITY_CATEGORY_ALIASES = {},
  } = voicingConfig;
  const {
    defaultMode: defaultPianoMode = 'piano',
    modes: pianoModes = {},
    ranges: pianoRanges = {},
  } = pianoVoicingConfig;
  let lastLoggedPianoHarmonyKey = null;

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

  function matchesContextualQualityRule(chord, quality, rule) {
    if (!rule || quality !== rule.from) return false;
    if (rule.roman && chord?.roman !== rule.roman) return false;
    if (Array.isArray(rule.romanIn) && !rule.romanIn.includes(chord?.roman)) return false;
    if (Array.isArray(rule.excludeRoman) && rule.excludeRoman.includes(chord?.roman)) return false;
    if (rule.inputType && chord?.inputType !== rule.inputType) return false;
    return true;
  }

  function getPlayedChordQuality(chord, isMinor) {
    const canonicalQuality = isMinor ? chord?.qualityMinor : chord?.qualityMajor;
    if (!canonicalQuality) return '';

    let contextualQuality = canonicalQuality;
    for (const rule of CONTEXTUAL_QUALITY_RULES) {
      if (matchesContextualQualityRule(chord, contextualQuality, rule)) {
        contextualQuality = rule.to || contextualQuality;
        break;
      }
    }

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

    const pitchClasses = new Set();
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
      name: `${choice.name}${direction > 0 ? '↑' : '↓'}`,
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
      if (PIANO_RUN_DEBUG_LOGS && nextScores.every(score => !score)) {
        const previousEntry = sequence[rowIndex - 1] || null;
        const currentEntry = sequence[rowIndex] || null;
        console.log(`[piano run debug] solver-dead-row ${JSON.stringify({
          rowIndex,
          previousSlot: previousEntry?.slotIndex ?? null,
          currentSlot: currentEntry?.slotIndex ?? null,
          previousRun: Number.isInteger(previousEntry?.oneStepRunPosition) && Number.isInteger(previousEntry?.oneStepRunLength)
            ? `${previousEntry.oneStepRunPosition}/${previousEntry.oneStepRunLength}`
            : '-',
          currentRun: Number.isInteger(currentEntry?.oneStepRunPosition) && Number.isInteger(currentEntry?.oneStepRunLength)
            ? `${currentEntry.oneStepRunPosition}/${currentEntry.oneStepRunLength}`
            : '-',
          previousCandidates: (candidatesByIndex[rowIndex - 1] || []).map(formatPianoChoiceDebug),
          currentCandidates: rowCandidates.map(formatPianoChoiceDebug),
          reasons: debugReasons,
        })}`);
      }
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

  function logPianoRunDiagnostics(label, sequence, choicesOrCandidateSets) {
    if (!PIANO_RUN_DEBUG_LOGS || !Array.isArray(sequence) || !Array.isArray(choicesOrCandidateSets)) return;

    let index = 0;
    while (index < sequence.length) {
      const entry = sequence[index];
      if (!entry || entry.isSentinel || !Number.isInteger(entry.oneStepRunLength) || entry.oneStepRunLength < 2) {
        index += 1;
        continue;
      }

      let runEnd = index;
      while (
        runEnd + 1 < sequence.length
        && sequence[runEnd + 1]
        && !sequence[runEnd + 1].isSentinel
        && (sequence[runEnd + 1].slotIndex - sequence[runEnd].slotIndex) === 1
      ) {
        runEnd += 1;
      }

      const runEntries = sequence.slice(index, runEnd + 1);
      const runSummary = runEntries.map((runEntry, offset) => {
        const payload = choicesOrCandidateSets[index + offset];
        if (Array.isArray(payload)) {
          return {
            slot: runEntry.slotIndex,
            run: `${runEntry.oneStepRunPosition}/${runEntry.oneStepRunLength}`,
            candidateCount: payload.filter(choice => choice?.notes?.length).length,
            candidates: payload
              .filter(choice => choice?.notes?.length)
              .slice(0, 6)
              .map(formatPianoChoiceDebug),
          };
        }
        return {
          slot: runEntry.slotIndex,
          run: `${runEntry.oneStepRunPosition}/${runEntry.oneStepRunLength}`,
          choice: formatPianoChoiceDebug(payload),
        };
      });

      console.log(`[piano run debug] ${label} ${JSON.stringify(runSummary)}`);
      index = runEnd + 1;
    }
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
        isSentinel: true,
      });
    }

    const candidatesByIndex = sequence.map((entry) => {
      const candidates = buildPianoShapeCandidates(entry.chord, entry.key, entry.isMinor);
      return Array.isArray(candidates) && candidates.length ? candidates : [null];
    });
    if (PIANO_RUN_DEBUG_LOGS) {
      const missingBaseCandidates = sequence
        .map((entry, index) => ({
          entry,
          index,
          candidates: candidatesByIndex[index],
        }))
        .filter(({ candidates }) => !candidates.some(candidate => candidate?.notes?.length))
        .map(({ entry, index }) => ({
          index,
          slot: entry?.slotIndex ?? null,
          run: Number.isInteger(entry?.oneStepRunPosition) && Number.isInteger(entry?.oneStepRunLength)
            ? `${entry.oneStepRunPosition}/${entry.oneStepRunLength}`
            : '-',
          chord: entry?.chord ? formatPianoHarmonyLabel(entry.chord, entry.key, entry.isMinor) : null,
          isSentinel: Boolean(entry?.isSentinel),
          targetsNextProgression: Boolean(entry?.targetsNextProgression),
        }));
      if (missingBaseCandidates.length > 0) {
        console.log(`[piano run debug] missing-base-candidates ${JSON.stringify(missingBaseCandidates)}`);
      }
    }
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    const chosen = resolvePianoChoicePath(sequence, candidatesByIndex, activeMode, secondsPerBeat, {
      enforceRunMovement: false,
      enforceThinnedOuterMovement: false,
    });
    const repeatedMotionChoices = applyRepeatedChordMotion(sequence, chosen);
    const repeatedMotionCandidateSets = buildRepeatedChordMotionCandidateSets(sequence, chosen);
    logPianoRunDiagnostics('normal-candidates', sequence, repeatedMotionCandidateSets);
    const constrainedNormalChoices = resolvePianoChoicePath(
      sequence,
      repeatedMotionCandidateSets,
      activeMode,
      secondsPerBeat
    );
    logPianoRunDiagnostics('normal-solution', sequence, constrainedNormalChoices);
    const integratedCandidatesByIndex = buildIntegratedPassingDiminishedCandidates(
      sequence,
      repeatedMotionCandidateSets,
      activeMode,
      secondsPerBeat
    );
    logPianoRunDiagnostics('integrated-candidates', sequence, integratedCandidatesByIndex);
    const adjustedChosen = resolvePianoChoicePath(
      sequence,
      integratedCandidatesByIndex,
      activeMode,
      secondsPerBeat
    );
    logPianoRunDiagnostics('integrated-solution', sequence, adjustedChosen);
    const mergedChosen = mergePianoChoiceFallback(
      sequence,
      adjustedChosen,
      constrainedNormalChoices.some(choice => choice?.notes?.length)
        ? constrainedNormalChoices
        : repeatedMotionChoices
    );
    logPianoRunDiagnostics('final-merged', sequence, mergedChosen);
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
    nextFirstChord,
    nextKey = null,
    nextIsMinor = false,
    nextStartsNewKey = false,
    shouldReset,
    hasIncomingAnticipation,
    previousTailBeats = null,
  }) {
    const activeMode = getPianoVoicingMode?.() || defaultPianoMode;
    const swingRatio = getSwingRatio();
    const secondsPerBeat = getSecondsPerBeat();
    return createPianoPlan({
      chords,
      key,
      isMinor,
      beatsPerChord,
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
    const eventVolumeMultiplier = slotVolumeMultiplier * beatParityMultiplier;
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

  function playEvent({ progression, event, plan, nextPlan, time, slotDuration, secondsPerBeat, nextProgression }) {
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

    const globalDelayMs = Number.isFinite(rhythmConfig.pianoGlobalDelayMs)
      ? rhythmConfig.pianoGlobalDelayMs
      : 0;
    const startTime = Math.max(time + (globalDelayMs / 1000), audioCtx.currentTime);
    const playbackState = buildPianoEventPlaybackState({
      event,
      entries: playbackEventData.entries,
      activeMode: playbackEventData.activeMode,
      slotDuration,
      secondsPerBeat,
      plan,
      nextPlan,
    });
    const loggedHarmony = resolvePianoLoggedHarmony({
      progression,
      event,
      playbackEventData,
    });
    const harmonyLabel = formatPianoHarmonyLabel(
      loggedHarmony.chord,
      loggedHarmony.key,
      loggedHarmony.isMinor
    );
    const harmonyKey = [
      harmonyLabel,
      loggedHarmony.key ?? '?',
      loggedHarmony.isMinor ? 'minor' : 'major',
    ].join('|');
    if (lastLoggedPianoHarmonyKey !== harmonyKey) {
      console.log('________');
      console.log(`harmony: ${harmonyLabel}`);
      lastLoggedPianoHarmonyKey = harmonyKey;
    }
    const runPositionLabel = Number.isInteger(event.oneStepRunPosition) && Number.isInteger(event.oneStepRunLength)
      ? `${event.oneStepRunPosition}/${event.oneStepRunLength}`
      : '-';
    const measurePositionLabel = Number.isFinite(event.timeBeats)
      ? `${Math.floor(event.timeBeats) % 4}${(event.timeBeats % 1) === 0 ? '' : '.5'}`
      : '?';
    const playedVoicingLabel = formatPianoChoiceNotes({ notes: playbackState.selectedEntries.map((voice) => voice.midi) });
    const fullVoicingLabel = formatPianoChoiceNotes({ notes: playbackState.fullEntries.map((voice) => voice.midi) });
    const fullVoicingSuffix = playedVoicingLabel === fullVoicingLabel
      ? ''
      : ` full:${fullVoicingLabel}`;
    console.log(`${playedVoicingLabel} run:${runPositionLabel} measure:${measurePositionLabel}${fullVoicingSuffix}`);
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
      const finalVolume = voice.volume * playbackState.eventVolumeMultiplier;
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

  function stopAll() {
    // Piano comping uses short one-shot samples only; nothing persistent to stop.
    lastLoggedPianoHarmonyKey = null;
  }

  function clear() {
    lastLoggedPianoHarmonyKey = null;
  }

  return {
    buildPlan,
    collectSampleNotes,
    playEvent,
    stopAll,
    clear,
  };
}
