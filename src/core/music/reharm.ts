import voicingConfig from './voicing-config.js';

const {
  QUALITY_REASSIGNMENT_FAMILIES = {},
  QUALITY_REASSIGNMENT_RULES = {}
} = voicingConfig;

type HarmonyChord = {
  roman?: string,
  inputType?: string
};

type QualityRule = {
  from?: string,
  to?: string,
  roman?: string,
  romanIn?: string[],
  excludeRoman?: string[],
  inputType?: string
};

type DominantResolutionRule = QualityRule & {
  resolutionSemitones?: number[],
  nextQualityFamily?: string
};

type DominantResolutionContext = {
  chord?: HarmonyChord,
  quality: string,
  nextChord?: HarmonyChord,
  nextQuality?: string,
  resolutionSemitones?: number
};

const typedQualityReassignmentRules = QUALITY_REASSIGNMENT_RULES as {
  contextual?: QualityRule[],
  dominantResolution?: DominantResolutionRule[]
};

const typedQualityReassignmentFamilies = QUALITY_REASSIGNMENT_FAMILIES as Record<string, string[]>;

export const MAINSTREAM_JAZZ_REHARM_RULES = Object.freeze({
  families: typedQualityReassignmentFamilies,
  contextual: typedQualityReassignmentRules.contextual ?? [],
  dominantResolution: typedQualityReassignmentRules.dominantResolution ?? []
});

const CONTEXTUAL_QUALITY_RULES = MAINSTREAM_JAZZ_REHARM_RULES.contextual;
const PRIORITY_DOMINANT_RESOLUTION_RULES = MAINSTREAM_JAZZ_REHARM_RULES.dominantResolution;

export function matchesContextualQualityRule(
  chord: HarmonyChord | null | undefined,
  quality: string,
  rule: QualityRule | null | undefined
) {
  if (!rule || quality !== rule.from) return false;
  if (rule.roman && chord?.roman !== rule.roman) return false;
  if (Array.isArray(rule.romanIn) && !rule.romanIn.includes(chord?.roman)) return false;
  if (Array.isArray(rule.excludeRoman) && rule.excludeRoman.includes(chord?.roman)) return false;
  if (rule.inputType && chord?.inputType !== rule.inputType) return false;
  return true;
}

export function applyContextualQualityRules(chord: HarmonyChord | null | undefined, quality: string) {
  if (!chord) return quality;
  for (const rule of CONTEXTUAL_QUALITY_RULES) {
    if (matchesContextualQualityRule(chord, quality, rule)) {
      return rule.to || quality;
    }
  }
  return quality;
}

function qualityMatchesFamily(quality: string | undefined, family: string) {
  if (!family) return true;
  const familyQualities = MAINSTREAM_JAZZ_REHARM_RULES.families[family];
  if (!Array.isArray(familyQualities)) return false;
  return quality ? familyQualities.includes(quality) : false;
}

function matchesPriorityDominantResolutionRule({
  chord,
  quality,
  nextChord,
  nextQuality,
  resolutionSemitones
}: DominantResolutionContext, rule: DominantResolutionRule | null | undefined) {
  if (!rule || quality !== rule.from) return false;
  if (!nextChord) return false;
  if (rule.roman && chord?.roman !== rule.roman) return false;
  if (Array.isArray(rule.romanIn) && !rule.romanIn.includes(chord?.roman)) return false;
  if (Array.isArray(rule.excludeRoman) && rule.excludeRoman.includes(chord?.roman)) return false;
  if (Array.isArray(rule.resolutionSemitones) && !rule.resolutionSemitones.includes(resolutionSemitones)) return false;
  if (!qualityMatchesFamily(nextQuality, rule.nextQualityFamily || '')) return false;
  return true;
}

export function applyPriorityDominantResolutionRules(context: DominantResolutionContext) {
  for (const rule of PRIORITY_DOMINANT_RESOLUTION_RULES) {
    if (matchesPriorityDominantResolutionRule(context, rule)) {
      return rule.to || context.quality;
    }
  }
  return context.quality;
}

