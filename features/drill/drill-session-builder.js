// @ts-check

/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */

/**
 * @param {{
 *   patternName?: string,
 *   patternString?: string,
 *   tempo?: number,
 *   source?: string
 * }} [options]
 * @returns {PracticeSessionSpec}
 */
export function createPracticeSessionFromDrillPattern({
  patternName = 'Custom drill',
  patternString = '',
  tempo = 120,
  source = 'custom'
} = {}) {
  return {
    schemaVersion: '1.0.0',
    id: `drill-${String(patternName || 'custom').toLowerCase().replace(/[^\w]+/g, '-')}`,
    source,
    title: String(patternName || 'Custom drill'),
    tempo: Number.isFinite(Number(tempo)) ? Number(tempo) : 120,
    timeSignature: '4/4',
    playback: {
      bars: [],
      patternString: String(patternString || '').trim(),
      enginePatternString: String(patternString || '').trim()
    },
    display: {},
    selection: null,
    origin: {
      mode: 'drill-pattern'
    }
  };
}

/**
 * @param {{
 *   session?: PracticeSessionSpec | null,
 *   applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown
 * }} [options]
 * @returns {PlaybackOperationResult}
 */
export function applyPracticeSessionToDrillUi({
  session,
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings
} = {}) {
  if (!session || typeof applyEmbeddedPattern !== 'function') {
    return {
      ok: false,
      errorMessage: 'Missing drill session adapter.'
    };
  }

  const applyResult = applyEmbeddedPattern({
    patternName: session.title || 'Imported session',
    patternString: session?.playback?.enginePatternString || session?.playback?.patternString || '',
    patternMode: 'both',
    tempo: session.tempo || 120,
    repetitionsPerKey: 1,
    displayMode: 'show-both',
    showBeatIndicator: true,
    hideCurrentHarmony: false
  });

  if (applyResult?.ok && typeof applyEmbeddedPlaybackSettings === 'function') {
    applyEmbeddedPlaybackSettings({
      tempo: session.tempo || 120
    });
  }

  return applyResult;
}
