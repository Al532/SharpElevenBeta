import type { ChartChordSlot } from '../core/types/contracts';

import {
  applyContextualQualityRules,
  applyPriorityDominantResolutionRules
} from '../harmony-context.js';
import { normalizeSemitone, parseNoteSymbol, splitChordSymbol } from './chart-harmony.js';

/**
 * @param {any} value
 * @returns {any}
 */
function cloneValue(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return JSON.parse(JSON.stringify(value));
}

/**
 * @param {ChartChordSlot | null | undefined} slot
 * @returns {string}
 */
function getSlotQuality(slot) {
  return String(slot?.quality || '').trim();
}

/**
 * @param {ChartChordSlot | null | undefined} slot
 * @returns {string}
 */
function getSlotRootSymbol(slot) {
  if (slot?.root) return String(slot.root).trim();
  const split = splitChordSymbol(slot?.symbol || '');
  return split?.root || '';
}

/**
 * @param {ChartChordSlot | null | undefined} slot
 * @returns {string}
 */
function getSlotBassSymbol(slot) {
  if (slot?.bass) return String(slot.bass).trim();
  const split = splitChordSymbol(slot?.symbol || '');
  return split?.bass || '';
}

/**
 * @param {string} root
 * @param {string} quality
 * @param {string} [bass]
 * @returns {string}
 */
function buildChordSymbol(root, quality, bass = '') {
  if (!root) return '';
  return `${root}${quality || ''}${bass ? `/${bass}` : ''}`;
}

/**
 * @param {ChartChordSlot | null | undefined} slot
 * @returns {number | null}
 */
function getSlotRootSemitone(slot) {
  const parsed = parseNoteSymbol(getSlotRootSymbol(slot));
  return parsed ? normalizeSemitone(parsed.semitone) : null;
}

/**
 * @param {ChartChordSlot | null | undefined} slot
 * @param {ChartChordSlot | null} [nextSlot]
 * @returns {ChartChordSlot | null | undefined}
 */
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

/**
 * @param {ChartChordSlot[][]} [collections]
 * @returns {ChartChordSlot[][]}
 */
export function contextualizeChordSlotCollections(collections = []) {
  const clonedCollections = collections.map((slots) => (slots || []).map((slot) => cloneValue(slot)));
  const chordRefs: Array<{ collectionIndex: number, slotIndex: number, slot: ChartChordSlot }> = [];

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
