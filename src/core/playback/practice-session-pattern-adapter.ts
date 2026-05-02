import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackSettings,
  PracticeSessionSpec
} from '../types/contracts';

export function createPracticeSessionFromPracticePattern({
  patternName = 'Custom practice pattern',
  patternString = '',
  tempo = 120,
  source = 'custom'
}: {
  patternName?: string;
  patternString?: string;
  tempo?: number;
  source?: string;
} = {}): PracticeSessionSpec {
  return {
    schemaVersion: '1.0.0',
    id: `practice-pattern-${String(patternName || 'custom').toLowerCase().replace(/[^\w]+/g, '-')}`,
    source,
    title: String(patternName || 'Custom practice pattern'),
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
      mode: 'practice-pattern'
    }
  };
}

export function applyPracticeSessionToEmbeddedPattern({
  session,
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings
}: {
  session?: PracticeSessionSpec | null;
  applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
} = {}): PlaybackOperationResult {
  if (!session || typeof applyEmbeddedPattern !== 'function') {
    return {
      ok: false,
      errorMessage: 'Missing practice session playback adapter.'
    };
  }

  const runtimeRepeatCount = Number(session?.playback?.runtimeRepeatCount);
  const playbackStartChordIndex = Number(session?.playback?.playbackStartChordIndex);

  const applyResult = applyEmbeddedPattern({
    patternName: session.title || 'Imported session',
    patternString: session?.playback?.enginePatternString || session?.playback?.patternString || '',
    endingCue: session?.playback?.endingCue || null,
    performanceMap: session?.playback?.performanceMap || null,
    playbackStartChordIndex: Number.isFinite(playbackStartChordIndex)
      ? Math.max(0, Math.round(playbackStartChordIndex))
      : null,
    patternMode: 'both',
    tempo: session.tempo || 120,
    repetitionsPerKey: Number.isFinite(runtimeRepeatCount)
      ? Math.max(1, Math.round(runtimeRepeatCount))
      : 1,
    finitePlayback: session.origin?.mode === 'chart-document'
      || session.origin?.mode === 'chart-selection'
      || session.origin?.mode === 'chart-play-from-bar',
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
