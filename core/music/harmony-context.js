import voicingConfig from './voicing-config.js';

const {
  QUALITY_REASSIGNMENT_FAMILIES = {},
  QUALITY_REASSIGNMENT_RULES = {}
} = voicingConfig;

const {
  contextual: CONTEXTUAL_QUALITY_RULES = [],
  dominantResolution: PRIORITY_DOMINANT_RESOLUTION_RULES = []
} = QUALITY_REASSIGNMENT_RULES;

export function matchesContextualQualityRule(chord, quality, rule) {
  if (!rule || quality !== rule.from) return false;
  if (rule.roman && chord?.roman !== rule.roman) return false;
  if (Array.isArray(rule.romanIn) && !rule.romanIn.includes(chord?.roman)) return false;
  if (Array.isArray(rule.excludeRoman) && rule.excludeRoman.includes(chord?.roman)) return false;
  if (rule.inputType && chord?.inputType !== rule.inputType) return false;
  return true;
}

export function applyContextualQualityRules(chord, quality) {
  if (!chord) return quality;
  for (const rule of CONTEXTUAL_QUALITY_RULES) {
    if (matchesContextualQualityRule(chord, quality, rule)) {
      return rule.to || quality;
    }
  }
  return quality;
}

function qualityMatchesFamily(quality, family) {
  if (!family) return true;
  const familyQualities = QUALITY_REASSIGNMENT_FAMILIES[family];
  if (!Array.isArray(familyQualities)) return false;
  return familyQualities.includes(quality);
}

function matchesPriorityDominantResolutionRule({
  chord,
  quality,
  nextChord,
  nextQuality,
  resolutionSemitones
}, rule) {
  if (!rule || quality !== rule.from) return false;
  if (!nextChord) return false;
  if (rule.roman && chord?.roman !== rule.roman) return false;
  if (Array.isArray(rule.romanIn) && !rule.romanIn.includes(chord?.roman)) return false;
  if (Array.isArray(rule.excludeRoman) && rule.excludeRoman.includes(chord?.roman)) return false;
  if (Array.isArray(rule.resolutionSemitones) && !rule.resolutionSemitones.includes(resolutionSemitones)) return false;
  if (!qualityMatchesFamily(nextQuality, rule.nextQualityFamily || '')) return false;
  return true;
}

export function applyPriorityDominantResolutionRules(context) {
  for (const rule of PRIORITY_DOMINANT_RESOLUTION_RULES) {
    if (matchesPriorityDominantResolutionRule(context, rule)) {
      return rule.to || context.quality;
    }
  }
  return context.quality;
}
