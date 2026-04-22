// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { consumePendingDrillSession } from '../../core/storage/app-state-storage.js';
import { applyPracticeSessionToDrillUi } from './drill-session-builder.js';

/**
 * @param {{
 *   applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   afterApply?: (session: PracticeSessionSpec) => void
 * }} [options]
 * @returns {boolean}
 */
export function consumePendingDrillSessionIntoUi({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  afterApply
} = {}) {
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
