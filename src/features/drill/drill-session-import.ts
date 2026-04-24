import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackSettings,
  PracticeSessionSpec
} from '../../core/types/contracts';

import { consumePendingPracticeSession } from '../../core/storage/app-state-storage.js';
import { applyPracticeSessionToDrillUi } from './drill-session-builder.js';

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

  applyPracticeSessionToDrillUi({
    session: pendingPracticeSession,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings
  });

  if (typeof afterApply === 'function') {
    afterApply(pendingPracticeSession);
  }

  return true;
}
