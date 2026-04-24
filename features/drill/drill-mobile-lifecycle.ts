import type { DrillEventTargetLike, DrillVisibilityTargetLike } from './drill-ui-types.js';

type DrillMobileLifecycleOptions = {
  lifecycleTarget?: DrillEventTargetLike;
  visibilityTarget?: DrillVisibilityTargetLike;
  userGestureTarget?: DrillEventTargetLike;
  getIsPlaying?: () => boolean;
  getIsPaused?: () => boolean;
  getAudioContext?: () => BaseAudioContext | null;
  resumeAudioContext?: () => Promise<unknown> | unknown;
  togglePausePlayback?: () => Promise<unknown> | unknown;
  trackSessionDuration?: () => void;
};

/**
 * Creates the drill mobile lifecycle controller.
 * It keeps background/foreground playback behavior and user-gesture audio
 * unlock out of `app.js` while staying compatible with the current transport
 * contract.
 */
export function createDrillMobileLifecycle({
  lifecycleTarget = globalThis.window,
  visibilityTarget = globalThis.document,
  userGestureTarget = globalThis.window,
  getIsPlaying = () => false,
  getIsPaused = () => false,
  getAudioContext = () => null,
  resumeAudioContext = async () => getAudioContext?.(),
  togglePausePlayback = async () => {},
  trackSessionDuration = () => {}
}: DrillMobileLifecycleOptions = {}) {
  let audioResumeInFlight = false;

  async function tryResumeAudioContext() {
    const audioContext = getAudioContext?.();
    if (!audioContext || audioContext.state !== 'suspended' || audioResumeInFlight) {
      return audioContext;
    }
    audioResumeInFlight = true;
    try {
      await resumeAudioContext?.();
    } finally {
      audioResumeInFlight = false;
    }
    return getAudioContext?.() || audioContext;
  }

  function handleVisibilityChange() {
    if (visibilityTarget?.hidden) {
      return;
    }
    void tryResumeAudioContext();
  }

  function handlePageHide() {
    trackSessionDuration?.();
  }

  function handlePageShow() {
    void tryResumeAudioContext();
  }

  function handleUserGestureUnlock() {
    void tryResumeAudioContext();
  }

  function bindLifecycleEvents() {
    lifecycleTarget?.addEventListener?.('pagehide', handlePageHide);
    lifecycleTarget?.addEventListener?.('pageshow', handlePageShow);
    visibilityTarget?.addEventListener?.('visibilitychange', handleVisibilityChange);
  }

  function bindUserGestureUnlock() {
    userGestureTarget?.addEventListener?.('pointerdown', handleUserGestureUnlock);
    userGestureTarget?.addEventListener?.('touchstart', handleUserGestureUnlock);
    userGestureTarget?.addEventListener?.('keydown', handleUserGestureUnlock);
  }

  return {
    bindLifecycleEvents,
    bindUserGestureUnlock,
    handleVisibilityChange,
    handlePageHide,
    handlePageShow,
    handleUserGestureUnlock
  };
}
