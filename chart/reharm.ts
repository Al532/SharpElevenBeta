import type { ChartChordSlot } from '../src/core/types/contracts';

import {
  applyContextualQualityRules,
  applyPriorityDominantResolutionRules
} from '../src/core/music/reharm.js';
import { normalizeSemitone, parseNoteSymbol, splitChordSymbol } from './chart-harmony.js';

export const CHORD_ENRICHMENT_MODES = Object.freeze({
  off: 'off',
  mainstreamJazz: 'mainstream-jazz'
});

export const CHART_CHORD_DISPLAY_LEVELS = Object.freeze({
  original: 'original',
  light: 'light',
  rich: 'rich'
});

export type ChordEnrichmentMode = typeof CHORD_ENRICHMENT_MODES[keyof typeof CHORD_ENRICHMENT_MODES];
export type ChartChordDisplayLevel = typeof CHART_CHORD_DISPLAY_LEVELS[keyof typeof CHART_CHORD_DISPLAY_LEVELS];

export function normalizeChordEnrichmentMode(mode: unknown): ChordEnrichmentMode {
  return Object.values(CHORD_ENRICHMENT_MODES).includes(mode as ChordEnrichmentMode)
    ? mode as ChordEnrichmentMode
    : CHORD_ENRICHMENT_MODES.mainstreamJazz;
}

export function normalizeChartChordDisplayLevel(level: unknown): ChartChordDisplayLevel {
  return Object.values(CHART_CHORD_DISPLAY_LEVELS).includes(level as ChartChordDisplayLevel)
    ? level as ChartChordDisplayLevel
    : CHART_CHORD_DISPLAY_LEVELS.original;
}

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
function reharmonizeChordSlotForMainstreamJazz(slot, nextSlot = null) {
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

  const reharmonized = cloneValue(slot);
  if (prioritizedQuality === quality && contextualQuality === quality) {
    return reharmonized;
  }

  reharmonized.quality = prioritizedQuality;
  reharmonized.symbol = buildChordSymbol(
    getSlotRootSymbol(slot),
    prioritizedQuality,
    getSlotBassSymbol(slot)
  ) || reharmonized.symbol;
  return reharmonized;
}

/**
 * @param {ChartChordSlot[][]} [collections]
 * @param {{ enrichmentMode?: unknown }} [options]
 * @returns {ChartChordSlot[][]}
 */
export function reharmonizeChordSlotCollections(collections = [], {
  enrichmentMode = CHORD_ENRICHMENT_MODES.mainstreamJazz
}: { enrichmentMode?: unknown } = {}) {
  const normalizedMode = normalizeChordEnrichmentMode(enrichmentMode);
  const clonedCollections = collections.map((slots) => (slots || []).map((slot) => cloneValue(slot)));

  if (normalizedMode === CHORD_ENRICHMENT_MODES.off) {
    return clonedCollections;
  }

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
    clonedCollections[ref.collectionIndex][ref.slotIndex] = reharmonizeChordSlotForMainstreamJazz(ref.slot, nextSlot);
  });

  return clonedCollections;
}
