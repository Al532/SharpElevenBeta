
import {
  distributeMeterItemsToBeatSlots,
  getMetricBeatStrengths,
  parseQuarterTimeSignature
} from '../../core/music/meter.js';

const DEFAULT_ONE_CHORD_TAG = 'one:';
const DEFAULT_ONE_CHORD_QUALITIES = Object.freeze([
  '6', 'maj7', 'lyd', 'm7', 'm9', 'm6', 'mb6', 'mMaj7', 'm7b5', 'dim7',
  '9', '13', '7b9', '7alt', '13b9', '13#11', '7#5', '13sus', '9sus', '7b9sus'
]);
const DEFAULT_ONE_CHORD_DOMINANT_QUALITIES = Object.freeze([
  '9', '13', '7b9', '7alt', '13b9', '13#11', '7#5', '13sus', '9sus', '7b9sus'
]);
const DEFAULT_ONE_CHORD_QUALITY_ALIASES = Object.freeze({
  '6': '6',
  maj7: 'maj7',
  'â–³7': 'maj7',
  'â–³9': 'maj7',
  lyd: 'lyd',
  m7: 'm7',
  m9: 'm9',
  m6: 'm6',
  mb6: 'mb6',
  mmaj7: 'mMaj7',
  mMaj7: 'mMaj7',
  'Ã¸7': 'm7b5',
  m7b5: 'm7b5',
  dim7: 'dim7',
  'Â°7': 'dim7',
  '9': '9',
  '7mixo': '13',
  '13mixo': '13',
  '7oct': '13b9',
  oct: '13b9',
  '13alt': '7alt',
  '13oct': '13b9',
  '7lyd': '13#11',
  '7#11': '13#11',
  '13lyd': '13#11',
  '13#5': '7#5',
  '7sus': '9sus',
  '13sus': '13sus',
  '9sus': '9sus',
  '13b9sus': '7b9sus'
});

type RomanToken = {
  roman: string;
  modifier: string;
};

type PracticePatternToken = {
  label: string;
  roman: string;
  modifier: string;
  semitones: number;
  bassSemitones: number;
  qualityMajor: string;
  qualityMinor: string;
  inputType: 'degree' | 'note' | 'one-chord' | 'no-chord';
  slashBassLabel: string | null;
  noChord?: boolean;
};

type OneChordSpec = {
  active: boolean;
  qualities: string[];
  invalidTokens: string[];
  errorMessage: string | null;
};

type PatternBase = {
  body: string;
  basePitchClass: number;
  hasOverride: boolean;
  overrideToken: string | null;
  error: string | null;
};

type PatternAnalysisResult = PatternBase & {
  usesBarLines: boolean;
  resolvedChordsPerBar: number | null;
  expandedMeasures: PracticePatternToken[][] | null;
  playbackMeasures: PracticePatternMeasure[] | null;
  tokens: string[];
  chords: PracticePatternToken[];
  invalidTokens: string[];
  errorMessage: string | null;
};

type PracticePatternMeasure = {
  timeSignature: string;
  beatsPerBar: number;
  beatStrengths: string[];
  chords: PracticePatternToken[];
};

type CreatePracticePatternAnalysisOptions = {
  romanToSemitones?: Record<string, number>;
  noteLetterToSemitone?: Record<string, number>;
  semitoneToRomanTokenMap?: Record<number, RomanToken>;
  degreeQualityMajor?: Record<string, string>;
  alteredSemitoneQualityMajor?: Record<number, string>;
  degreeQualityMinor?: Record<string, string>;
  alteredSemitoneQualityMinor?: Record<number, string>;
  dominantQualityAliases?: Record<string, string[]>;
  qualityCategoryAliases?: Record<string, string[]>;
  defaultChordsPerBar?: number;
  supportedChordsPerBar?: number[];
  oneChordTag?: string;
  oneChordDefaultQualities?: string[];
  oneChordDominantQualities?: string[];
  oneChordQualityAliases?: Record<string, string>;
};

/**
 * @param {{
 *   romanToSemitones?: Record<string, number>,
 *   noteLetterToSemitone?: Record<string, number>,
 *   semitoneToRomanTokenMap?: Record<number, { roman: string, modifier: string }>,
 *   degreeQualityMajor?: Record<string, string>,
 *   alteredSemitoneQualityMajor?: Record<number, string>,
 *   degreeQualityMinor?: Record<string, string>,
 *   alteredSemitoneQualityMinor?: Record<number, string>,
 *   dominantQualityAliases?: Record<string, string[]>,
 *   qualityCategoryAliases?: Record<string, string[]>,
 *   defaultChordsPerBar?: number,
 *   supportedChordsPerBar?: number[],
 *   oneChordTag?: string,
 *   oneChordDefaultQualities?: string[],
 *   oneChordDominantQualities?: string[],
 *   oneChordQualityAliases?: Record<string, string>
 * }} [options]
 */
export function createPracticePatternAnalysis({
  romanToSemitones = {},
  noteLetterToSemitone = {},
  semitoneToRomanTokenMap = {},
  degreeQualityMajor = {},
  alteredSemitoneQualityMajor = {},
  degreeQualityMinor = {},
  alteredSemitoneQualityMinor = {},
  dominantQualityAliases = {},
  qualityCategoryAliases = {},
  defaultChordsPerBar = 1,
  supportedChordsPerBar = [1, 2, 4],
  oneChordTag = DEFAULT_ONE_CHORD_TAG,
  oneChordDefaultQualities = [...DEFAULT_ONE_CHORD_QUALITIES],
  oneChordDominantQualities = [...DEFAULT_ONE_CHORD_DOMINANT_QUALITIES],
  oneChordQualityAliases = { ...DEFAULT_ONE_CHORD_QUALITY_ALIASES }
}: CreatePracticePatternAnalysisOptions = {}) {
  let cachedPatternAnalysisInput = null;
  let cachedPatternAnalysisResult = null;

  function normalizeMusicalText(value) {
    return String(value || '')
      .replace(/\u266d[\ufe0e\ufe0f]?/g, 'b')
      .replace(/\u266f[\ufe0e\ufe0f]?/g, '#')
      .replace(/\u2013|\u2014/g, '-');
  }

  function normalizePatternString(pattern) {
    const normalized = normalizeMusicalText(pattern).replace(/\r\n?/g, '\n');
    const lineBreakReplacement = normalized.includes('|') ? ' | ' : ' ';
    return normalized
      .replace(/\n+/g, lineBreakReplacement)
      .replace(/-/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function normalizeOneChordQualityToken(token) {
    const normalized = normalizeMusicalText(token).trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(dominantQualityAliases, normalized)) return normalized;
    for (const [canonicalQuality, aliases] of Object.entries(dominantQualityAliases)) {
      if ((aliases || []).includes(normalized)) return canonicalQuality;
    }
    if (Object.prototype.hasOwnProperty.call(qualityCategoryAliases, normalized)) return normalized;
    for (const [canonicalQuality, aliases] of Object.entries(qualityCategoryAliases)) {
      if ((aliases || []).includes(normalized)) return canonicalQuality;
    }
    return oneChordQualityAliases[normalized] || null;
  }

  function parseOneChordSpec(str: string): OneChordSpec {
    const normalized = String(str || '').trim();
    if (!normalized.toLowerCase().startsWith(oneChordTag)) {
      return {
        active: false,
        qualities: [],
        invalidTokens: [],
        errorMessage: null
      };
    }

    const body = normalized.slice(oneChordTag.length).trim();
    if (!body) {
      return {
        active: true,
        qualities: [...oneChordDefaultQualities],
        invalidTokens: [],
        errorMessage: null
      };
    }

    const rawTokens = body
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);

    const qualities = [];
    const invalidTokens = [];
    for (const token of rawTokens) {
      const normalizedToken = token.toLowerCase();
      if (['all', 'all chords'].includes(normalizedToken)) {
        qualities.push(...oneChordDefaultQualities);
        continue;
      }
      if (['dominant', 'dominants', 'all dominant', 'all dominants'].includes(normalizedToken)) {
        qualities.push(...oneChordDominantQualities);
        continue;
      }

      const canonicalQuality = normalizeOneChordQualityToken(token);
      if (canonicalQuality) {
        qualities.push(canonicalQuality);
      } else {
        invalidTokens.push(token);
      }
    }

    const uniqueQualities = [...new Set(qualities)];
    return {
      active: true,
      qualities: uniqueQualities.length > 0 ? uniqueQualities : [...oneChordDefaultQualities],
      invalidTokens,
      errorMessage: invalidTokens.length > 0
        ? `Unknown one-chord quality(ies): ${invalidTokens.join(', ')}`
        : null
    };
  }

  function isOneChordModeActive(pattern = '') {
    return parseOneChordSpec(pattern).active;
  }

  function createOneChordToken(quality: string): PracticePatternToken {
    return {
      label: quality,
      roman: 'I',
      modifier: '',
      semitones: 0,
      bassSemitones: 0,
      qualityMajor: quality,
      qualityMinor: quality,
      inputType: 'one-chord',
      slashBassLabel: null
    };
  }

  function createNoChordToken(): PracticePatternToken {
    return {
      label: 'NC',
      roman: 'I',
      modifier: '',
      semitones: 0,
      bassSemitones: 0,
      qualityMajor: '',
      qualityMinor: '',
      inputType: 'no-chord',
      slashBassLabel: null,
      noChord: true
    };
  }

  function noteNameToPitchClass(letter: string, accidental = ''): number | null {
    const base = noteLetterToSemitone[String(letter || '').toUpperCase()];
    if (base === undefined) return null;
    const normalizedAccidental = normalizeMusicalText(accidental);
    if (normalizedAccidental === 'b') return (base + 11) % 12;
    if (normalizedAccidental === '#') return (base + 1) % 12;
    return base;
  }

  function semitoneToRomanToken(semitones: number): RomanToken | null {
    return semitoneToRomanTokenMap[((semitones % 12) + 12) % 12] || null;
  }

  function normalizeParsedQuality(quality: string, roman: string): string {
    const normalizedQuality = String(quality).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(dominantQualityAliases, normalizedQuality)) return normalizedQuality;
    for (const [canonicalQuality, aliases] of Object.entries(dominantQualityAliases)) {
      if ((aliases || []).includes(normalizedQuality)) return canonicalQuality;
    }
    if (normalizedQuality === 'm') {
      if (roman === 'I') return 'm6';
      return 'm7';
    }
    if (Object.prototype.hasOwnProperty.call(qualityCategoryAliases, normalizedQuality)) return normalizedQuality;
    for (const [canonicalQuality, aliases] of Object.entries(qualityCategoryAliases)) {
      if ((aliases || []).includes(normalizedQuality)) return canonicalQuality;
    }
    return quality;
  }

  function isAcceptedCustomQuality(_quality: string): boolean {
    return true;
  }

  function buildParsedToken({
    label,
    roman,
    modifier,
    semitones,
    customQuality = null,
    inputType = 'degree'
  }: {
    label: string;
    roman: string;
    modifier: string;
    semitones: number;
    customQuality?: string | null;
    inputType?: PracticePatternToken['inputType'];
  }): PracticePatternToken | null {
    let qualityMajor;
    let qualityMinor;

    if (customQuality) {
      if (!isAcceptedCustomQuality(customQuality)) return null;
      qualityMajor = normalizeParsedQuality(customQuality, roman);
      qualityMinor = qualityMajor;
    } else if (modifier) {
      qualityMajor = alteredSemitoneQualityMajor[semitones] || 'â–³7';
      qualityMinor = alteredSemitoneQualityMinor[semitones] || 'm7';
      qualityMajor = normalizeParsedQuality(qualityMajor, roman);
      qualityMinor = normalizeParsedQuality(qualityMinor, roman);
    } else {
      qualityMajor = degreeQualityMajor[roman] || 'â–³7';
      qualityMinor = degreeQualityMinor[roman] || 'm7';
      qualityMajor = normalizeParsedQuality(qualityMajor, roman);
      qualityMinor = normalizeParsedQuality(qualityMinor, roman);
    }

    return {
      label,
      roman,
      modifier,
      semitones,
      bassSemitones: semitones,
      qualityMajor,
      qualityMinor,
      inputType,
      slashBassLabel: null
    };
  }

  function parseDegreeToken(token: string): PracticePatternToken | null {
    const normalizedToken = normalizeMusicalText(token).trim();
    const match = normalizedToken.match(/^([b#]?)(VII|VI|IV|V|III|II|I)(.+)?$/i);
    if (!match) return null;
    const modifier = match[1] || '';
    const roman = match[2].toUpperCase();
    const customQuality = match[3] || null;
    if (!(roman in romanToSemitones)) return null;
    let semitones = romanToSemitones[roman];
    if (modifier === 'b') semitones = (semitones - 1 + 12) % 12;
    else if (modifier === '#') semitones = (semitones + 1) % 12;

    return buildParsedToken({
      label: modifier + roman,
      roman,
      modifier,
      semitones,
      customQuality,
      inputType: 'degree'
    });
  }

  function parseNoteToken(token: string, basePitchClass = 0): PracticePatternToken | null {
    const normalizedToken = normalizeMusicalText(token).trim();
    const match = normalizedToken.match(/^([A-Ga-g])([b#]?)(.*)?$/);
    if (!match) return null;

    const letter = match[1].toUpperCase();
    const accidental = match[2] || '';
    const customQuality = match[3] || null;
    const absolutePitchClass = noteNameToPitchClass(letter, accidental);
    if (absolutePitchClass === null) return null;

    const semitones = (absolutePitchClass - basePitchClass + 12) % 12;
    const degreeToken = semitoneToRomanToken(semitones);
    if (!degreeToken) return null;

    return buildParsedToken({
      label: `${letter}${accidental}`,
      roman: degreeToken.roman,
      modifier: degreeToken.modifier,
      semitones,
      customQuality,
      inputType: 'note'
    });
  }

  function extractPatternBase(str: string): PatternBase {
    const normalized = normalizeMusicalText(str).trim();
    const equalsOverrideMatch = normalized.match(/^key\s*=\s*([A-Ga-g])([b#]?)\s*:\s*(.*)$/);
    const colonOverrideMatch = normalized.match(/^key\s*:\s*([A-Ga-g])([b#]?)(?:\s*\|\s*|\s+)(.*)$/);
    const overrideMatch = equalsOverrideMatch || colonOverrideMatch;
    if (!overrideMatch) {
      if ((/^key\s*=/.test(normalized) && !/:/.test(normalized)) || /^key\s*:\s*$/.test(normalized)) {
        return {
          body: normalized,
          basePitchClass: 0,
          hasOverride: true,
          overrideToken: normalized,
          error: 'Missing ":" after key override'
        };
      }
      if (/^key\s*=/.test(normalized) || /^key\s*:/.test(normalized)) {
        const rawOverride = normalized.match(/^key\s*(?:=\s*|:\s*)([^:\s]+)/);
        return {
          body: normalized,
          basePitchClass: 0,
          hasOverride: true,
          overrideToken: rawOverride ? rawOverride[1] : normalized,
          error: 'Invalid key override'
        };
      }
      return { body: normalized, basePitchClass: 0, hasOverride: false, overrideToken: null, error: null };
    }

    const letter = overrideMatch[1].toUpperCase();
    const accidental = overrideMatch[2] || '';
    const basePitchClass = noteNameToPitchClass(letter, accidental);

    return {
      body: overrideMatch[3].trim(),
      basePitchClass,
      hasOverride: true,
      overrideToken: `${letter}${accidental}`,
      error: basePitchClass === null ? `Invalid key override: ${letter}${accidental}` : null
    };
  }

  function parseSlashBassToken(token: string, basePitchClass = 0): PracticePatternToken | null {
    const normalized = normalizeMusicalText(token).trim();
    if (!/^([b#]?(?:VII|VI|IV|V|III|II|I)|[A-Ga-g][b#]?)$/i.test(normalized)) {
      return null;
    }
    return parseDegreeToken(normalized) || parseNoteToken(normalized, basePitchClass);
  }

  function parseToken(token: string, basePitchClass = 0): PracticePatternToken | null {
    const normalized = normalizeMusicalText(token).trim();
    if (!normalized) return null;
    if (/^N\.?C\.?$/i.test(normalized)) return createNoChordToken();

    const parts = normalized.split('/');
    if (parts.length === 1) {
      return parseDegreeToken(normalized) || parseNoteToken(normalized, basePitchClass);
    }
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }

    const parsedChord = parseDegreeToken(parts[0]) || parseNoteToken(parts[0], basePitchClass);
    const parsedBass = parseSlashBassToken(parts[1], basePitchClass);
    if (!parsedChord || !parsedBass) return null;

    return {
      ...parsedChord,
      bassSemitones: parsedBass.semitones,
      slashBassLabel: parsedBass.label
    };
  }

  function expandRepeatedMeasureStrings(body: string): string[] {
    const normalized = String(body || '')
      .replace(/\r?\n/g, ' ')
      .replace(/:\]/g, ' __REPEAT_END__ ')
      .replace(/:\|/g, ' __REPEAT_END__ ')
      .replace(/\]\s*\[\:/g, '] | [:')
      .replace(/\|\|/g, '| || |');

    const rawSegments = normalized
      .split('|')
      .map((segment) => segment.trim())
      .filter(Boolean);

    const measures = [];
    let repeatFrame = null;
    let skippingUntilSecondEnding = false;

    const processSegment = (segment) => {
      if (segment === '||') return;

      const startsFirstEnding = /\[1\b/.test(segment);
      const startsSecondEnding = /\[2\b/.test(segment);
      const startRepeat = segment.includes('[:') || /^\[(?![12]\b)/.test(segment);
      const explicitRepeatEnd = segment.includes('__REPEAT_END__');
      const closesBracket = /\]$/.test(segment);
      const cleaned = segment
        .replace(/\[:/g, '')
        .replace(/__REPEAT_END__/g, '')
        .replace(/\[1\b/g, '')
        .replace(/\[2\b/g, '')
        .replace(/^\[(?![12]\b)/g, '')
        .replace(/\]$/g, '')
        .trim();

      if (startRepeat && !repeatFrame) {
        repeatFrame = {
          startIndex: measures.length,
          firstEndingStartIndex: null,
          duplicated: false
        };
        skippingUntilSecondEnding = false;
      }

      if (startsFirstEnding && repeatFrame && !repeatFrame.duplicated) {
        repeatFrame.firstEndingStartIndex = measures.length;
        skippingUntilSecondEnding = false;
      }

      if (startsSecondEnding) {
        skippingUntilSecondEnding = false;
      }

      if (cleaned && !skippingUntilSecondEnding) {
        measures.push(cleaned);
      }

      if (explicitRepeatEnd && repeatFrame && !repeatFrame.duplicated) {
        const repeatBodyEnd = repeatFrame.firstEndingStartIndex ?? measures.length;
        measures.push(...measures.slice(repeatFrame.startIndex, repeatBodyEnd));
        if (repeatFrame.firstEndingStartIndex === null) {
          repeatFrame = null;
          skippingUntilSecondEnding = false;
        } else {
          repeatFrame.duplicated = true;
          skippingUntilSecondEnding = true;
        }
      }

      if (closesBracket && repeatFrame) {
        if (!repeatFrame.duplicated) {
          const repeatBodyEnd = repeatFrame.firstEndingStartIndex ?? measures.length;
          measures.push(...measures.slice(repeatFrame.startIndex, repeatBodyEnd));
        }
        repeatFrame = null;
        skippingUntilSecondEnding = false;
      }
    };

    rawSegments.forEach((segment) => {
      if (segment.includes('__REPEAT_END__') && /\[2\b/.test(segment)) {
        const secondEndingIndex = segment.indexOf('[2');
        const firstPart = segment.slice(0, secondEndingIndex).trim();
        const secondPart = segment.slice(secondEndingIndex).trim();
        if (firstPart) processSegment(firstPart);
        if (secondPart) processSegment(secondPart);
        return;
      }
      processSegment(segment);
    });

    if (repeatFrame && !repeatFrame.duplicated) {
      const repeatBodyEnd = repeatFrame.firstEndingStartIndex ?? measures.length;
      measures.push(...measures.slice(repeatFrame.startIndex, repeatBodyEnd));
    }

    return measures;
  }

  function tokenizePracticePatternSegment(segment: string): string[] {
    return String(segment || '')
      .split(/[\s-]+/)
      .filter(Boolean)
      .flatMap((token) => (/^[%/]+$/.test(token) ? token.split('') : [token]));
  }

  function extractLeadingTimeSignature(body: string) {
    const normalized = String(body || '').trim();
    const match = normalized.match(/^time\s*:\s*(\d+\/4)(?:\s*\|\s*|\s+)?(.*)$/i);
    if (!match) {
      return {
        timeSignature: '4/4',
        body: normalized
      };
    }

    return {
      timeSignature: parseQuarterTimeSignature(match[1]).timeSignature,
      body: String(match[2] || '').trim()
    };
  }

  function extractMeasureTimeSignature(segment: string, activeTimeSignature: string) {
    const normalized = String(segment || '').trim();
    const match = normalized.match(/^@(\d+\/4)\s*(.*)$/);
    if (!match) {
      return {
        timeSignature: activeTimeSignature,
        body: normalized
      };
    }

    return {
      timeSignature: parseQuarterTimeSignature(match[1], activeTimeSignature).timeSignature,
      body: String(match[2] || '').trim()
    };
  }

  function tokenizePracticePatternMeasureItems(segment: string): string[][] {
    const normalized = String(segment || '')
      .replace(/([()])/g, ' $1 ')
      .trim();
    const tokens = tokenizePracticePatternSegment(normalized);
    const items: string[][] = [];
    let currentGroup: string[] | null = null;

    for (const token of tokens) {
      if (token === '(') {
        if (currentGroup) items.push(currentGroup);
        currentGroup = [];
        continue;
      }
      if (token === ')') {
        if (currentGroup && currentGroup.length > 0) items.push(currentGroup);
        currentGroup = null;
        continue;
      }
      if (currentGroup) {
        currentGroup.push(token);
      } else {
        items.push([token]);
      }
    }

    if (currentGroup && currentGroup.length > 0) {
      items.push(currentGroup);
    }

    return items;
  }

  function containsRejectedQuality(_token: string): boolean {
    return false;
  }

  function analyzePattern(str: string): PatternAnalysisResult {
    const oneChordSpec = parseOneChordSpec(str);
    if (oneChordSpec.active) {
      return {
        body: String(str || '').trim(),
        basePitchClass: 0,
        hasOverride: false,
        overrideToken: null,
        error: null,
        usesBarLines: false,
        resolvedChordsPerBar: null,
        expandedMeasures: null,
        playbackMeasures: null,
        tokens: oneChordSpec.qualities,
        chords: oneChordSpec.qualities.length > 0 ? [createOneChordToken(oneChordSpec.qualities[0])] : [],
        invalidTokens: oneChordSpec.invalidTokens,
        errorMessage: oneChordSpec.errorMessage
      };
    }

    const base = extractPatternBase(str);
    if (base.error) {
      return {
        ...base,
        usesBarLines: false,
        resolvedChordsPerBar: null,
        expandedMeasures: null,
        playbackMeasures: null,
        tokens: [],
        chords: [],
        invalidTokens: [],
        errorMessage: base.error
      };
    }

    const timedBase = extractLeadingTimeSignature(base.body);
    const usesBarLines = timedBase.body.includes('|') || /^time\s*:/i.test(base.body);
    const tokens = timedBase.body ? tokenizePracticePatternSegment(timedBase.body.replace(/\|+/g, ' ')) : [];
    const chords: PracticePatternToken[] = [];
    const invalidTokens: string[] = [];

    if (usesBarLines) {
      const measures = expandRepeatedMeasureStrings(timedBase.body);
      const expandedMeasures: PracticePatternToken[][] = [];
      const playbackMeasures: PracticePatternMeasure[] = [];

      let previousChord: PracticePatternToken | null = null;
      let activeTimeSignature = timedBase.timeSignature;
      measures.forEach((measure, index) => {
        const timedMeasure = extractMeasureTimeSignature(measure, activeTimeSignature);
        activeTimeSignature = timedMeasure.timeSignature;
        const measureItems = tokenizePracticePatternMeasureItems(timedMeasure.body);
        const parsedItems: PracticePatternToken[][] = [];

        for (const itemTokens of measureItems) {
          const itemChords: PracticePatternToken[] = [];
          for (const token of itemTokens) {
            if (token === '%' || token === '/') {
              if (itemChords.length > 0) {
                const repeated = { ...itemChords[itemChords.length - 1] };
                itemChords.push(repeated);
                previousChord = repeated;
              } else if (previousChord) {
                const repeated = { ...previousChord };
                itemChords.push(repeated);
                previousChord = repeated;
              } else {
                invalidTokens.push(`${token} (measure ${index + 1})`);
              }
              continue;
            }

            const parsed = parseToken(token, base.basePitchClass);
            if (parsed) {
              itemChords.push(parsed);
              previousChord = parsed;
            } else if (containsRejectedQuality(token)) {
              invalidTokens.push(`${token} (use m, m7, or m9; richer harmony may be applied by context)`);
            } else {
              invalidTokens.push(`${token} (measure ${index + 1})`);
            }
          }
          if (itemChords.length > 0) parsedItems.push(itemChords);
        }

        if (parsedItems.length === 0) return;

        const meter = parseQuarterTimeSignature(activeTimeSignature);
        const isExplicitBeatGrid = parsedItems.length === meter.numerator
          && parsedItems.every((item) => item.length === 1);
        const distribution = isExplicitBeatGrid
          ? { beatSlots: parsedItems.map((item) => item[0]), errors: [] }
          : distributeMeterItemsToBeatSlots(parsedItems, meter.timeSignature);
        if (distribution.errors.length > 0) {
          distribution.errors.forEach((error) => invalidTokens.push(`${error} (measure ${index + 1})`));
        }

        const beatSlots = distribution.beatSlots.map((chord) => ({ ...chord }));
        if (beatSlots.length === 0) return;
        expandedMeasures.push(beatSlots.map((chord) => ({ ...chord })));
        playbackMeasures.push({
          timeSignature: meter.timeSignature,
          beatsPerBar: meter.numerator,
          beatStrengths: getMetricBeatStrengths(meter.numerator),
          chords: beatSlots.map((chord) => ({ ...chord }))
        });
        beatSlots.forEach((chord) => chords.push({ ...chord }));
      });

      return {
        ...base,
        usesBarLines,
        body: timedBase.body,
        resolvedChordsPerBar: playbackMeasures.length > 0
          ? (playbackMeasures.every((measure) => measure.beatsPerBar === playbackMeasures[0].beatsPerBar)
            ? playbackMeasures[0].beatsPerBar
            : null)
          : 4,
        expandedMeasures,
        playbackMeasures,
        tokens,
        chords,
        invalidTokens,
        errorMessage: invalidTokens.length > 0 ? `Unknown token(s): ${invalidTokens.join(', ')}` : null
      };
    }

    for (const token of tokens) {
      if (token === '%') {
        if (chords.length > 0) chords.push({ ...chords[chords.length - 1] });
        continue;
      }

      const parsed = parseToken(token, base.basePitchClass);
      if (parsed) {
        chords.push(parsed);
      } else if (containsRejectedQuality(token)) {
        invalidTokens.push(`${token} (use m, m7, or m9; richer harmony may be applied by context)`);
      } else {
        invalidTokens.push(token);
      }
    }

    return {
      ...base,
      usesBarLines,
      resolvedChordsPerBar: null,
      expandedMeasures: null,
      playbackMeasures: null,
      tokens,
      chords,
      invalidTokens,
      errorMessage: invalidTokens.length > 0 ? `Unknown token(s): ${invalidTokens.join(', ')}` : null
    };
  }

  function analyzePatternCached(str: string): PatternAnalysisResult {
    const normalized = String(str || '');
    if (cachedPatternAnalysisInput === normalized && cachedPatternAnalysisResult) {
      return cachedPatternAnalysisResult;
    }
    const analysis = analyzePattern(normalized);
    cachedPatternAnalysisInput = normalized;
    cachedPatternAnalysisResult = analysis;
    return analysis;
  }

  function parsePattern(str: string): PracticePatternToken[] {
    return analyzePattern(str).chords;
  }

  function normalizeChordsPerBar(value: unknown): number {
    const parsed = Number.parseInt(String(value ?? defaultChordsPerBar), 10);
    return supportedChordsPerBar.includes(parsed) ? parsed : defaultChordsPerBar;
  }

  function getPatternKeyOverridePitchClass(patternString = ''): number | null {
    const oneChordSpec = parseOneChordSpec(patternString);
    if (oneChordSpec.active) return null;

    const base = extractPatternBase(patternString);
    return base.hasOverride && Number.isFinite(base.basePitchClass)
      ? base.basePitchClass
      : null;
  }

  function getBeatsPerChord(chordsPerBar = defaultChordsPerBar): number {
    return 4 / normalizeChordsPerBar(chordsPerBar);
  }

  function padProgression(chords: PracticePatternToken[], chordsPerBar = defaultChordsPerBar): PracticePatternToken[] {
    if (chords.length === 0) return [];
    const result = chords.slice();
    const chordsPerMeasure = normalizeChordsPerBar(chordsPerBar);

    while (result.length % chordsPerMeasure !== 0) {
      result.push(result[result.length - 1]);
    }

    let measures = result.length / chordsPerMeasure;
    while (measures % 2 !== 0) {
      for (let i = 0; i < chordsPerMeasure; i++) {
        result.push(result[result.length - 1]);
      }
      measures = result.length / chordsPerMeasure;
    }
    return result;
  }

  return {
    ONE_CHORD_DEFAULT_QUALITIES: [...oneChordDefaultQualities],
    ONE_CHORD_DOMINANT_QUALITIES: [...oneChordDominantQualities],
    normalizePatternString,
    parseOneChordSpec,
    isOneChordModeActive,
    createOneChordToken,
    analyzePattern,
    analyzePatternCached,
    parsePattern,
    normalizeChordsPerBar,
    getPatternKeyOverridePitchClass,
    getBeatsPerChord,
    padProgression
  };
}


