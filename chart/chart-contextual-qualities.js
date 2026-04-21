import {
  applyContextualQualityRules,
  applyPriorityDominantResolutionRules
} from '../harmony-context.js';
import { normalizeSemitone, parseNoteSymbol, splitChordSymbol } from './chart-harmony.js';

function cloneValue(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return JSON.parse(JSON.stringify(value));
}

function getSlotQuality(slot) {
  return String(slot?.quality || '').trim();
}

function getSlotRootSymbol(slot) {
  if (slot?.root) return String(slot.root).trim();
  const split = splitChordSymbol(slot?.symbol || '');
  return split?.root || '';
}

function getSlotBassSymbol(slot) {
  if (slot?.bass) return String(slot.bass).trim();
  const split = splitChordSymbol(slot?.symbol || '');
  return split?.bass || '';
}

function buildChordSymbol(root, quality, bass = '') {
  if (!root) return '';
  return `${root}${quality || ''}${bass ? `/${bass}` : ''}`;
}

function getSlotRootSemitone(slot) {
  const parsed = parseNoteSymbol(getSlotRootSymbol(slot));
  return parsed ? normalizeSemitone(parsed.semitone) : null;
}

function contextualizeChordSlot(slot, nextSlot = null) {
  if (!slot || slot.kind !== 'chord') return cloneValue(slot);

  const quality = getSlotQuality(slot);
  if (!quality) return cloneValue(slot);

  const contextualQuality = applyContextualQualityRules(slot, quality);
  const nextQuality = nextSlot ? applyContextualQualityRules(nextSlot, getSlotQuality(nextSlot)) : '';
  const rootSemitone = getSlotRootSemitone(slot);
  const nextRootSemitone = getSlotRootSemitone(nextSlot);
  const prioritizedQuality = applyPriorityDominantResolutionRules({
    chord: slot,
    quality: contextualQuality,
    nextChord: nextSlot,
    nextQuality,
    resolutionSemitones: rootSemitone !== null && nextRootSemitone !== null
      ? normalizeSemitone(nextRootSemitone - rootSemitone)
      : null
  });

  const contextualized = cloneValue(slot);
  if (prioritizedQuality === quality && contextualQuality === quality) {
    return contextualized;
  }

  contextualized.quality = prioritizedQuality;
  contextualized.symbol = buildChordSymbol(
    getSlotRootSymbol(slot),
    prioritizedQuality,
    getSlotBassSymbol(slot)
  ) || contextualized.symbol;
  return contextualized;
}

export function contextualizeChordSlotCollections(collections = []) {
  const clonedCollections = collections.map((slots) => (slots || []).map((slot) => cloneValue(slot)));
  const chordRefs = [];

  clonedCollections.forEach((slots, collectionIndex) => {
    slots.forEach((slot, slotIndex) => {
      if (slot?.kind === 'chord') {
        chordRefs.push({ collectionIndex, slotIndex, slot });
      }
    });
  });

  chordRefs.forEach((ref, index) => {
    const nextSlot = chordRefs[index + 1]?.slot || null;
    clonedCollections[ref.collectionIndex][ref.slotIndex] = contextualizeChordSlot(ref.slot, nextSlot);
  });

  return clonedCollections;
}
