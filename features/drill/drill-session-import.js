// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { consumePendingPracticeSession } from '../../core/storage/app-state-storage.js';
import { applyPracticeSessionToDrillUi } from './drill-session-builder.js';

/**
 * @param {{
 *   applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   afterApply?: (session: PracticeSessionSpec) => void
 * }} [options]
 * @returns {boolean}
 */
export function consumePendingPracticeSessionIntoUi({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  afterApply
} = {}) {
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
