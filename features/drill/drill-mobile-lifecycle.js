// @ts-check

/**
 * Creates the drill mobile lifecycle controller.
 * It keeps background/foreground playback behavior and user-gesture audio
 * unlock out of `app.js` while staying compatible with the current transport
 * contract.
 *
 * @param {object} [options]
 * @param {EventTarget | { addEventListener?: Function }} [options.lifecycleTarget]
 * @param {EventTarget | { addEventListener?: Function, hidden?: boolean }} [options.visibilityTarget]
 * @param {EventTarget | { addEventListener?: Function }} [options.userGestureTarget]
 * @param {() => boolean} [options.getIsPlaying]
 * @param {() => boolean} [options.getIsPaused]
 * @param {() => BaseAudioContext | null} [options.getAudioContext]
 * @param {() => Promise<unknown> | unknown} [options.resumeAudioContext]
 * @param {() => Promise<unknown> | unknown} [options.togglePausePlayback]
 * @param {Function} [options.trackSessionDuration]
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
} = {}) {
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
