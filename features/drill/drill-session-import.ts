import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackSettings,
  PracticeSessionSpec
} from '../../core/types/contracts';

import { consumePendingDrillSession } from '../../core/storage/app-state-storage.js';
import { applyPracticeSessionToDrillUi } from './drill-session-builder.js';

export function consumePendingDrillSessionIntoUi({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  afterApply
}: {
  applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  afterApply?: (session: PracticeSessionSpec) => void;
} = {}): boolean {
  const pendingDrillSession = consumePendingDrillSession();
  if (!pendingDrillSession) return false;

  applyPracticeSessionToDrillUi({
    session: pendingDrillSession,
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings
  });

  if (typeof afterApply === 'function') {
    afterApply(pendingDrillSession);
  }

  return true;
}
