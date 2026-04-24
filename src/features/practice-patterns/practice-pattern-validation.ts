
type PatternErrorElement = {
  classList?: {
    add: (value: string) => void;
    remove: (value: string) => void;
  };
  textContent?: string | null;
};

type PatternAnalysisResult = {
  errorMessage?: string | null;
};

type ValidateDrillCustomPatternOptions = {
  isCustomPatternSelected?: () => boolean;
  getCustomPatternValue?: () => string;
  normalizePatternString?: (value: string) => string;
  analyzePattern?: (value: string) => PatternAnalysisResult;
  patternErrorElement?: PatternErrorElement;
};

/**
 * @param {object} [options]
 * @param {() => boolean} [options.isCustomPatternSelected]
 * @param {() => string} [options.getCustomPatternValue]
 * @param {(value: string) => string} [options.normalizePatternString]
 * @param {(value: string) => { errorMessage?: string | null }} [options.analyzePattern]
 * @param {{ classList?: { add: (value: string) => void, remove: (value: string) => void }, textContent?: string }} [options.patternErrorElement]
 * @returns {boolean}
 */
export function validatePracticeCustomPattern({
  isCustomPatternSelected = () => false,
  getCustomPatternValue = () => '',
  normalizePatternString = (value) => value,
  analyzePattern = () => ({}),
  patternErrorElement
}: ValidateDrillCustomPatternOptions = {}) {
  if (!isCustomPatternSelected()) {
    patternErrorElement?.classList?.add('hidden');
    return true;
  }

  const patternString = normalizePatternString(getCustomPatternValue());
  if (!patternString) {
    patternErrorElement?.classList?.add('hidden');
    return true;
  }

  const analysis = analyzePattern(patternString);
  if (analysis?.errorMessage) {
    if (patternErrorElement) {
      patternErrorElement.textContent = analysis.errorMessage;
      patternErrorElement.classList?.remove('hidden');
    }
    return false;
  }

  patternErrorElement?.classList?.add('hidden');
  return true;
}


