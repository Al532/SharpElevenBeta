import rhythmConfig from './piano-rhythm-config.js';

const SWING_OFFBEAT_RATIO = 2 / 3;

function chordsMatch(left, right) {
  return Boolean(left && right
    && left.semitones === right.semitones
    && left.qualityMajor === right.qualityMajor
    && left.qualityMinor === right.qualityMinor);
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

function getSlotKind(slotIndex) {
  return slotIndex % 2 === 0 ? 'beat' : 'offbeat';
}

function getSlotTimeBeats(slotIndex) {
  const beatIndex = Math.floor(slotIndex / 2);
  return beatIndex + (slotIndex % 2 === 0 ? 0 : SWING_OFFBEAT_RATIO);
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

function getBoundaryBlockedSlotCount(totalSlots, previousTailBeats, hasIncomingAnticipation) {
  if (!Number.isInteger(totalSlots) || totalSlots <= 0) {
    return hasIncomingAnticipation ? 3 : 0;
  }

  if (hasIncomingAnticipation) return 3;
  if (!Number.isFinite(previousTailBeats)) return 0;

  for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
    const boundaryGapBeats = previousTailBeats + getSlotTimeBeats(slotIndex);
    if (boundaryGapBeats > SWING_OFFBEAT_RATIO) {
      return slotIndex;
    }
  }

  return totalSlots;
}

function getJumpWeights(slotKind) {
  return slotKind === 'beat'
    ? rhythmConfig.onBeatJumpWeights
    : rhythmConfig.offBeatJumpWeights;
}

function isSlotPlayable(slotIndex, chosenSlots) {
  return !chosenSlots.has(slotIndex - 1)
    && !chosenSlots.has(slotIndex)
    && !chosenSlots.has(slotIndex + 1);
}

function findCandidateSlotIndices(startSlot, endBeat, totalSlots) {
  const candidates = [];
  for (let slotIndex = Math.max(0, startSlot); slotIndex < totalSlots; slotIndex++) {
    if (getSlotTimeBeats(slotIndex) >= endBeat) break;
    candidates.push(slotIndex);
  }
  return candidates;
}

function createPianoPlan({
  chords,
  beatsPerChord,
  nextFirstChord = null,
  nextStartsNewKey = false,
  shouldReset = false,
  hasIncomingAnticipation = false,
  previousTailBeats = null,
}) {
  if (!Array.isArray(chords) || chords.length === 0) {
    return {
      style: 'piano',
      events: [],
      anticipatesNextStart: false,
    };
  }

  const totalBeats = chords.length * beatsPerChord;
  const totalSlots = totalBeats * 2;
  const blocks = buildHarmonicBlocks(chords, beatsPerChord);
  const shouldLogFirstBlockDebug = previousTailBeats !== null || hasIncomingAnticipation || nextStartsNewKey;
  const chosenSlots = new Set();
  const representedBlocks = new Set(hasIncomingAnticipation ? [0] : []);
  const minimumStartSlot = getBoundaryBlockedSlotCount(totalSlots, previousTailBeats, hasIncomingAnticipation);
  let slotIndex = Math.max(
    minimumStartSlot,
    getInitialSlotIndex(shouldReset, hasIncomingAnticipation)
  );

  while (slotExistsWithinProgression(slotIndex, totalSlots)) {
    chosenSlots.add(slotIndex);
    const nextJump = weightedPick(getJumpWeights(getSlotKind(slotIndex)));
    slotIndex += nextJump;
  }

  const ensureBlockRepresentation = (block) => {
    if (representedBlocks.has(block.blockIdx)) return;

    const blockStartSlot = block.startBeat * 2;
    const blockCandidateStartSlot = block.blockIdx === 0
      ? Math.max(minimumStartSlot, blockStartSlot)
      : blockStartSlot;
    const allBlockCandidateSlots = findCandidateSlotIndices(blockCandidateStartSlot, block.usefulEndBeat, totalSlots)
      .filter(candidateSlot => {
        const timeBeats = getSlotTimeBeats(candidateSlot);
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
      if (shouldLogFirstBlockDebug) {
        console.warn('[piano first block debug] forcing first block slot', {
          preferredSlot,
          blockStartBeat: block.startBeat,
          blockUsefulEndBeat: block.usefulEndBeat,
          minimumStartSlot,
          chosenSlotsBefore: [...chosenSlots].sort((a, b) => a - b),
        });
      }
      chosenSlots.delete(preferredSlot - 1);
      chosenSlots.delete(preferredSlot);
      chosenSlots.delete(preferredSlot + 1);
    }

    chosenSlots.add(preferredSlot);
    representedBlocks.add(block.blockIdx);
  };

  const events = [...chosenSlots]
    .sort((left, right) => left - right)
    .map(slot => {
      const timeBeats = getSlotTimeBeats(slot);
      const sourceBlock = getBlockForTime(blocks, timeBeats);
      return {
        slotIndex: slot,
        slotKind: getSlotKind(slot),
        timeBeats,
        sourceBlockIdx: sourceBlock?.blockIdx ?? null,
      };
    })
    .filter(event => event.sourceBlockIdx !== null)
    .map(event => {
      const sourceBlock = blocks[event.sourceBlockIdx];
      const anticipatesNextProgression = sourceBlock.nextBlockIdx === null
        && nextFirstChord
        && (nextStartsNewKey || !chordsMatch(sourceBlock.chord, nextFirstChord));
      const lastPreBoundaryOffbeat = sourceBlock.nextBlockIdx !== null
        ? getLastPreBoundaryOffbeatSlotIndex(blocks[sourceBlock.nextBlockIdx].startBeat)
        : (anticipatesNextProgression
            ? getLastPreBoundaryOffbeatSlotIndex(totalBeats)
            : null);
      const isAnticipation = lastPreBoundaryOffbeat !== null
        && event.slotIndex === lastPreBoundaryOffbeat
        && getSlotKind(event.slotIndex) === 'offbeat';
      const targetBlockIdx = isAnticipation && sourceBlock.nextBlockIdx !== null
        ? sourceBlock.nextBlockIdx
        : sourceBlock.blockIdx;
      return {
        chordIdx: anticipatesNextProgression && isAnticipation
          ? 0
          : (blocks[targetBlockIdx]?.startChordIdx ?? sourceBlock.startChordIdx),
        sourceChordIdx: sourceBlock.startChordIdx,
        targetChordIdx: anticipatesNextProgression && isAnticipation
          ? 0
          : (blocks[targetBlockIdx]?.startChordIdx ?? sourceBlock.startChordIdx),
        targetVoicingChordIdx: anticipatesNextProgression && isAnticipation
          ? 0
          : (blocks[targetBlockIdx]?.startChordIdx ?? sourceBlock.startChordIdx),
        timeBeats: event.timeBeats,
        slotIndex: event.slotIndex,
        slotKind: event.slotKind,
        isAnticipation,
        targetBlockIdx,
        targetsNextProgression: anticipatesNextProgression && isAnticipation,
      };
    });

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

  const finalEvents = [...chosenSlots]
    .sort((left, right) => left - right)
    .map(slot => {
      const timeBeats = getSlotTimeBeats(slot);
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
      return {
        chordIdx: anticipatesNextProgression && isAnticipation
          ? 0
          : (blocks[targetBlockIdx]?.startChordIdx ?? sourceBlock.startChordIdx),
        sourceChordIdx: sourceBlock.startChordIdx,
        targetChordIdx: anticipatesNextProgression && isAnticipation
          ? 0
          : (blocks[targetBlockIdx]?.startChordIdx ?? sourceBlock.startChordIdx),
        targetVoicingChordIdx: anticipatesNextProgression && isAnticipation
          ? 0
          : (blocks[targetBlockIdx]?.startChordIdx ?? sourceBlock.startChordIdx),
        targetBlockIdx,
        timeBeats,
        slotIndex: slot,
        slotKind: getSlotKind(slot),
        isAnticipation,
        targetsNextProgression: anticipatesNextProgression && isAnticipation,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.timeBeats - right.timeBeats);

  for (let i = 0; i < finalEvents.length; i++) {
    const event = finalEvents[i];
    const previousEvent = i > 0 ? finalEvents[i - 1] : null;
    const nextEvent = finalEvents[i + 1] || null;
    const targetBlock = event.targetsNextProgression ? null : (blocks[event.targetBlockIdx] || null);
    const blockEndBeat = targetBlock ? targetBlock.usefulEndBeat : event.timeBeats;
    const nextEventBeat = nextEvent ? nextEvent.timeBeats : Infinity;
    const naturalEndBeat = Math.min(blockEndBeat, nextEventBeat);
    const durationBeats = Math.max(0, naturalEndBeat - event.timeBeats);
    const isCutByNextAttack = nextEvent !== null && nextEventBeat <= blockEndBeat;
    const previousLongWasInterrupted = Boolean(previousEvent?.isLong && previousEvent.cutByNextAttack);
    const previousEventGapSteps = previousEvent ? (event.slotIndex - previousEvent.slotIndex) : Infinity;
    const brokenLongOnBeatProbability = Number.isFinite(rhythmConfig.brokenLongOnBeatProbability)
      ? Math.max(0, Math.min(1, rhythmConfig.brokenLongOnBeatProbability))
      : 0.75;
    event.durationBeats = durationBeats;
    event.cutByNextAttack = isCutByNextAttack;
    event.isLong = !event.isAnticipation && durationBeats >= 1 && !previousLongWasInterrupted;
    event.isBrokenLong = event.isLong
      && event.slotKind === 'beat'
      && previousEventGapSteps >= 3
      && event.slotIndex > 0
      && Math.random() < brokenLongOnBeatProbability;
  }

  const anticipatesNextStart = finalEvents.some(event =>
    event.isAnticipation
    && event.slotIndex === getLastPreBoundaryOffbeatSlotIndex(totalBeats)
    && nextFirstChord
  );

  const playbackEvents = finalEvents
    .flatMap(event => {
      if (!event.isBrokenLong) return [event];

      const brokenBassSlotIndex = event.slotIndex - 1;
      const brokenBassTimeBeats = getSlotTimeBeats(brokenBassSlotIndex);
      const brokenLeadInBeats = Math.max(0, event.timeBeats - brokenBassTimeBeats);

      return [
        {
          ...event,
          slotIndex: brokenBassSlotIndex,
          slotKind: getSlotKind(brokenBassSlotIndex),
          timeBeats: brokenBassTimeBeats,
          durationBeats: event.durationBeats + brokenLeadInBeats,
          playBassOnly: true,
          playUpperOnly: false,
          isBrokenLongBassLead: true,
          isBrokenLongUpperEntry: false,
        },
        {
          ...event,
          playBassOnly: false,
          playUpperOnly: true,
          isBrokenLongBassLead: false,
          isBrokenLongUpperEntry: true,
        },
      ];
    })
    .sort((left, right) => left.timeBeats - right.timeBeats);

  if (shouldLogFirstBlockDebug && blocks.length > 0) {
    const firstBlock = blocks[0];
    const firstBlockFinalEvents = finalEvents.filter(event =>
      event.timeBeats >= firstBlock.startBeat && event.timeBeats < firstBlock.usefulEndBeat
    );
    const firstBlockPlaybackEvents = playbackEvents.filter(event =>
      event.timeBeats >= firstBlock.startBeat && event.timeBeats < firstBlock.usefulEndBeat
    );

    if (firstBlockFinalEvents.length === 0 || firstBlockPlaybackEvents.length === 0) {
      console.warn('[piano first block debug] first block missing representation', {
        chordsLength: chords.length,
        beatsPerChord,
        nextStartsNewKey,
        hasIncomingAnticipation,
        previousTailBeats,
        minimumStartSlot,
        firstBlock: {
          startBeat: firstBlock.startBeat,
          endBeat: firstBlock.endBeat,
          usefulEndBeat: firstBlock.usefulEndBeat,
          startChordIdx: firstBlock.startChordIdx,
          endChordIdx: firstBlock.endChordIdx,
        },
        chosenSlots: [...chosenSlots].sort((a, b) => a - b),
        finalEvents: finalEvents.map(event => ({
          timeBeats: event.timeBeats,
          slotIndex: event.slotIndex,
          slotKind: event.slotKind,
          targetChordIdx: event.targetChordIdx,
          isAnticipation: Boolean(event.isAnticipation),
          playBassOnly: Boolean(event.playBassOnly),
          playUpperOnly: Boolean(event.playUpperOnly),
        })),
        playbackEvents: playbackEvents.map(event => ({
          timeBeats: event.timeBeats,
          slotIndex: event.slotIndex,
          slotKind: event.slotKind,
          targetChordIdx: event.targetChordIdx,
          isAnticipation: Boolean(event.isAnticipation),
          playBassOnly: Boolean(event.playBassOnly),
          playUpperOnly: Boolean(event.playUpperOnly),
        })),
      });
    }
  }

  return {
    style: 'piano',
    events: playbackEvents,
    anticipatesNextStart,
  };
}

export function createPianoComping({ constants, helpers }) {
  const {
    PIANO_COMP_DURATION_RATIO,
    PIANO_COMP_MIN_DURATION,
    PIANO_COMP_MAX_DURATION,
    PIANO_VOLUME_MULTIPLIER,
  } = constants;
  const { getAudioContext, getVoicingAtIndex, playSample } = helpers;

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

  function getPianoChordVoiceEntries(voicing) {
    if (!voicing) return [];

    const colorTones = buildPianoColorToneSet(voicing.colorTones || []);
    const pianoNotes = [...(voicing.guideTones || []), ...colorTones]
      .sort((a, b) => a - b);
    const topIndex = pianoNotes.length - 1;

    return pianoNotes.map((midi, index) => ({
      key: `piano:${index}:${midi}`,
      category: 'piano',
      midi,
      role: index === 0 ? 'lower-guide' : 'comp',
      volume: (index === topIndex ? 1.08 : 0.92) * PIANO_VOLUME_MULTIPLIER,
    }));
  }

  function collectSampleNotes(voicing, sets) {
    if (!voicing) return;
    for (const entry of getPianoChordVoiceEntries(voicing)) {
      sets.pianoNotes.add(entry.midi);
    }
  }

  function buildPlan({
    chords,
    beatsPerChord,
    nextFirstChord,
    nextStartsNewKey = false,
    shouldReset,
    hasIncomingAnticipation,
    previousTailBeats = null,
  }) {
    return createPianoPlan({
      chords,
      beatsPerChord,
      nextFirstChord,
      nextStartsNewKey,
      shouldReset,
      hasIncomingAnticipation,
      previousTailBeats,
    });
  }

  function playEvent({ progression, event, time, slotDuration, secondsPerBeat, nextProgression }) {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    const targetProgression = event.targetsNextProgression ? nextProgression : progression;
    if (!targetProgression?.chords?.length) return;
    const voicing = getVoicingAtIndex(
      targetProgression.chords,
      targetProgression.key,
      event.targetVoicingChordIdx,
      targetProgression.isMinor
    );
    if (!voicing) return;

    const entries = getPianoChordVoiceEntries(voicing);
    if (entries.length === 0) return;

    const startTime = Math.max(time, audioCtx.currentTime);
    const baseShortDuration = Math.max(
      PIANO_COMP_MIN_DURATION,
      Math.min(PIANO_COMP_MAX_DURATION, slotDuration * PIANO_COMP_DURATION_RATIO)
    );
    const shortDuration = Math.max(
      PIANO_COMP_MIN_DURATION,
      baseShortDuration * getTempoAdaptiveShortDurationMultiplier(secondsPerBeat)
    );
    const longDuration = Number.isFinite(event.durationBeats) && Number.isFinite(secondsPerBeat)
      ? Math.max(shortDuration, event.durationBeats * secondsPerBeat)
      : shortDuration;
    const duration = (event.isLong || event.playBassOnly) ? longDuration : shortDuration;
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

    const selectedEntries = event.playBassOnly
      ? entries.slice(0, 1)
      : (event.playUpperOnly ? entries.slice(1) : entries);

    const orderedEntries = event.playBassOnly ? selectedEntries : shuffleArray(selectedEntries);
    const tentativeNoteStartTimes = [];

    for (let index = 0; index < orderedEntries.length; index++) {
      const noteOffset = noteTimingHumanizeSeconds > 0
        ? ((Math.random() * 0.85) - 1) * noteTimingHumanizeSeconds
        : 0;
      const noteStartTime = Math.max(audioCtx.currentTime, startTime + noteOffset);
      tentativeNoteStartTimes.push(noteStartTime);
    }

    for (let index = 0; index < orderedEntries.length; index++) {
      const voice = orderedEntries[index];
      const noteStartTime = tentativeNoteStartTimes[index] ?? startTime;
      playSample(voice.category, voice.midi, noteStartTime, duration, voice.volume * eventVolumeMultiplier);
    }
  }

  function stopAll() {
    // Piano comping uses short one-shot samples only; nothing persistent to stop.
  }

  function clear() {
    // No persistent piano state.
  }

  return {
    buildPlan,
    collectSampleNotes,
    playEvent,
    stopAll,
    clear,
  };
}
