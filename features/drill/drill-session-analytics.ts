
type AnalyticsProps = Record<string, unknown>;

type OneChordSpec = {
  active?: boolean;
  qualities?: string[];
};

type PatternAnalysisResult = {
  chords?: unknown[];
  tokens?: unknown[];
  hasOverride?: boolean;
};

type DrillSessionAnalyticsDom = {
  tempoSlider?: HTMLInputElement | null;
  patternSelect?: HTMLSelectElement | null;
  drumsSelect?: HTMLSelectElement | null;
  displayMode?: HTMLSelectElement | null;
  harmonyDisplayMode?: HTMLSelectElement | null;
  transpositionSelect?: HTMLSelectElement | null;
};

type DrillSessionAnalyticsState = {
  getSessionStartedAt?: () => number;
  getSessionStartTracked?: () => boolean;
  setSessionStartTracked?: (value: boolean) => void;
  getSessionEngagedTracked?: () => boolean;
  setSessionEngagedTracked?: (value: boolean) => void;
  getSessionDurationTracked?: () => boolean;
  setSessionDurationTracked?: (value: boolean) => void;
  getSessionActionCount?: () => number;
  setSessionActionCount?: (value: number) => void;
};

type DrillSessionAnalyticsHelpers = {
  trackEvent?: (eventName: string, props?: AnalyticsProps) => void;
  getCurrentPatternString?: () => string;
  parseOneChordSpec?: (pattern: string) => OneChordSpec;
  getCurrentPatternMode?: () => string;
  getPatternModeLabel?: (mode: string) => string;
  hasSelectedProgression?: () => boolean;
  toAnalyticsToken?: (value: string) => string;
  analyzePattern?: (pattern: string) => PatternAnalysisResult;
  matchesOneChordQualitySet?: (qualities: string[], defaults: string[]) => boolean;
  getChordsPerBar?: () => number;
  getRepetitionsPerKey?: () => number;
  getCompingStyle?: () => string;
  normalizeDisplayMode?: (mode: string | undefined) => string;
  normalizeHarmonyDisplayMode?: (mode: string | undefined) => string;
  getEnabledKeyCount?: () => number;
};

type DrillSessionAnalyticsConstants = {
  oneChordDefaultQualities?: string[];
  oneChordDominantQualities?: string[];
};

type CreateDrillSessionAnalyticsOptions = {
  dom?: DrillSessionAnalyticsDom;
  state?: DrillSessionAnalyticsState;
  helpers?: DrillSessionAnalyticsHelpers;
  constants?: DrillSessionAnalyticsConstants;
  now?: () => number;
};

/**
 * Creates playback/session analytics helpers for the drill runtime without
 * leaving the bookkeeping inline in `app.js`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.state]
 * @param {() => number} [options.state.getSessionStartedAt]
 * @param {() => boolean} [options.state.getSessionStartTracked]
 * @param {(value: boolean) => void} [options.state.setSessionStartTracked]
 * @param {() => boolean} [options.state.getSessionEngagedTracked]
 * @param {(value: boolean) => void} [options.state.setSessionEngagedTracked]
 * @param {() => boolean} [options.state.getSessionDurationTracked]
 * @param {(value: boolean) => void} [options.state.setSessionDurationTracked]
 * @param {() => number} [options.state.getSessionActionCount]
 * @param {(value: number) => void} [options.state.setSessionActionCount]
 * @param {Record<string, any>} [options.helpers]
 * @param {(eventName: string, props?: Record<string, any>) => void} [options.helpers.trackEvent]
 * @param {() => string} [options.helpers.getCurrentPatternString]
 * @param {(pattern: string) => Record<string, any>} [options.helpers.parseOneChordSpec]
 * @param {() => string} [options.helpers.getCurrentPatternMode]
 * @param {(mode: string) => string} [options.helpers.getPatternModeLabel]
 * @param {() => boolean} [options.helpers.hasSelectedProgression]
 * @param {(value: string) => string} [options.helpers.toAnalyticsToken]
 * @param {(pattern: string) => Record<string, any>} [options.helpers.analyzePattern]
 * @param {(qualities: string[], defaults: string[]) => boolean} [options.helpers.matchesOneChordQualitySet]
 * @param {() => number} [options.helpers.getChordsPerBar]
 * @param {() => number} [options.helpers.getRepetitionsPerKey]
 * @param {() => string} [options.helpers.getCompingStyle]
 * @param {(mode: string) => string} [options.helpers.normalizeDisplayMode]
 * @param {(mode: string) => string} [options.helpers.normalizeHarmonyDisplayMode]
 * @param {() => number} [options.helpers.getEnabledKeyCount]
 * @param {Record<string, any>} [options.constants]
 * @param {string[]} [options.constants.oneChordDefaultQualities]
 * @param {string[]} [options.constants.oneChordDominantQualities]
 * @param {() => number} [options.now]
 */
export function createDrillSessionAnalytics({
  dom = {},
  state = {},
  helpers = {},
  constants = {},
  now = () => Date.now()
}: CreateDrillSessionAnalyticsOptions = {}) {
  function getTempoBucket() {
    const tempo = Number(dom.tempoSlider?.value || 0);
    if (tempo < 90) return 'slow';
    if (tempo <= 140) return 'medium';
    if (tempo <= 200) return 'fast';
    return 'very_fast';
  }

  function getSessionDurationBucket() {
    const elapsedSeconds = Math.max(0, Math.round((now() - (state.getSessionStartedAt?.() || 0)) / 1000));
    if (elapsedSeconds < 10) return 'lt_10s';
    if (elapsedSeconds < 30) return '10_30s';
    if (elapsedSeconds < 120) return '30_120s';
    return 'gt_120s';
  }

  function ensureSessionStarted(entrypoint = 'unknown') {
    if (state.getSessionStartTracked?.()) return;
    state.setSessionStartTracked?.(true);
    helpers.trackEvent?.('session_start', { entrypoint });
  }

  function registerSessionAction(actionName: string, extraProps: AnalyticsProps = {}) {
    ensureSessionStarted(actionName);
    const nextActionCount = (state.getSessionActionCount?.() || 0) + 1;
    state.setSessionActionCount?.(nextActionCount);
    if (state.getSessionEngagedTracked?.() || nextActionCount < 3) return;
    state.setSessionEngagedTracked?.(true);
    helpers.trackEvent?.('session_engaged', {
      action_count: nextActionCount,
      last_action: actionName,
      ...extraProps
    });
  }

  function trackSessionDuration() {
    if (state.getSessionDurationTracked?.() || !state.getSessionStartTracked?.()) return;
    state.setSessionDurationTracked?.(true);
    helpers.trackEvent?.('session_duration_bucket', {
      duration_bucket: getSessionDurationBucket(),
      action_count: state.getSessionActionCount?.() || 0
    });
  }

  function getProgressionAnalyticsProps(): AnalyticsProps {
    const patternString = helpers.getCurrentPatternString?.();
    const oneChordSpec = helpers.parseOneChordSpec?.(patternString) || {};
    const patternMode = helpers.getPatternModeLabel?.(helpers.getCurrentPatternMode?.());
    const source = helpers.hasSelectedProgression?.() ? 'preset' : 'custom';

    if (oneChordSpec.active) {
      let customId = 'custom_one_chord';
      if (helpers.matchesOneChordQualitySet?.(oneChordSpec.qualities, constants.oneChordDefaultQualities || [])) {
        customId = 'one_chord_all';
      } else if (helpers.matchesOneChordQualitySet?.(oneChordSpec.qualities, constants.oneChordDominantQualities || [])) {
        customId = 'one_chord_dominant';
      }
      return {
        progression_source: source,
        progression_mode: patternMode,
        progression_kind: 'one_chord',
        progression_id: helpers.hasSelectedProgression?.()
          ? `preset_${helpers.toAnalyticsToken?.(dom.patternSelect?.value)}`
          : customId,
        chord_count: 1,
        quality_count: oneChordSpec.qualities?.length || 0
      };
    }

    const analysis = helpers.analyzePattern?.(patternString) || {};
    const chordCount = analysis.chords?.length || (analysis.tokens?.length ?? 0);
    const progressionShape = chordCount > 0 ? `${chordCount}_chords` : 'empty';

    return {
      progression_source: source,
      progression_mode: patternMode,
      progression_kind: 'sequence',
      progression_id: helpers.hasSelectedProgression?.()
        ? `preset_${helpers.toAnalyticsToken?.(dom.patternSelect?.value)}`
        : `custom_${progressionShape}`,
      progression_shape: progressionShape,
      chord_count: chordCount,
      has_key_override: analysis.hasOverride ? 'yes' : 'no'
    };
  }

  function getPlaybackAnalyticsProps(): AnalyticsProps {
    const chordsPerBar = helpers.getChordsPerBar?.();
    return {
      tempo: Number(dom.tempoSlider?.value || 120),
      tempo_bucket: getTempoBucket(),
      repetitions_per_key: helpers.getRepetitionsPerKey?.(),
      comping_style: helpers.getCompingStyle?.(),
      drums_mode: dom.drumsSelect?.value || 'off',
      display_mode: helpers.normalizeDisplayMode?.(dom.displayMode?.value),
      alternate_display: helpers.normalizeHarmonyDisplayMode?.(dom.harmonyDisplayMode?.value),
      transposition: dom.transpositionSelect?.value || '0',
      enabled_keys: helpers.getEnabledKeyCount?.(),
      chords_per_bar: chordsPerBar,
      double_time: chordsPerBar > 1 ? 'on' : 'off'
    };
  }

  function trackProgressionEvent(name: string, extraProps: AnalyticsProps = {}) {
    helpers.trackEvent?.(name, {
      ...getProgressionAnalyticsProps(),
      ...extraProps
    });
  }

  function trackProgressionOccurrence(extraProps: AnalyticsProps = {}) {
    helpers.trackEvent?.('progression_occurrence_played', {
      ...getProgressionAnalyticsProps(),
      ...getPlaybackAnalyticsProps(),
      ...extraProps
    });
  }

  return {
    getTempoBucket,
    getSessionDurationBucket,
    ensureSessionStarted,
    registerSessionAction,
    trackSessionDuration,
    getProgressionAnalyticsProps,
    getPlaybackAnalyticsProps,
    trackProgressionEvent,
    trackProgressionOccurrence
  };
}


