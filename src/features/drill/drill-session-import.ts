import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackSettings,
  PracticeSessionSpec
} from '../../core/types/contracts';

import { consumePendingPracticeSession } from '../../core/storage/app-state-storage.js';
import { applyPracticeSessionToEmbeddedPattern } from '../../core/playback/practice-session-pattern-adapter.js';

export function consumePendingPracticeSessionIntoUi({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  afterApply
}: {
  applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  afterApply?: (session: PracticeSessionSpec) => void;
} = {}): boolean {
  const pendingPracticeSession = consumePendingPracticeSession();
  if (!pendingPracticeSession) return false;

  applyPracticeSessionToEmbeddedPattern({
    session: pendingPracticeSession,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings
  });

  if (typeof afterApply === 'function') {
    afterApply(pendingPracticeSession);
  }

  return true;
}
