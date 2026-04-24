// @ts-nocheck

/**
 * @param {object} [options]
 * @param {() => BaseAudioContext | null} [options.getAudioContext]
 * @param {(stopTime: number, fadeDuration: number) => void} [options.stopActiveComping]
 * @param {number} [options.defaultFadeDuration]
 * @param {() => number} [options.getDefaultFadeDuration]
 */
export function createDrillScheduledAudioRuntime({
  getAudioContext = () => null,
  stopActiveComping = () => {},
  defaultFadeDuration = 0.25,
  getDefaultFadeDuration = () => defaultFadeDuration
} = {}) {
  const scheduledAudioSources = new Set();
  const pendingDisplayTimeouts = new Set();

  function trackScheduledSource(source, gainNodes = []) {
    const entry = { source, gainNodes };
    scheduledAudioSources.add(entry);
    source.addEventListener('ended', () => {
      scheduledAudioSources.delete(entry);
    }, { once: true });
    return entry;
  }

  function clearScheduledDisplays() {
    for (const timeoutId of pendingDisplayTimeouts) {
      clearTimeout(timeoutId);
    }
    pendingDisplayTimeouts.clear();
  }

  function stopScheduledAudio(stopTime = getAudioContext()?.currentTime ?? 0) {
    for (const entry of scheduledAudioSources) {
      for (const gainNode of entry.gainNodes) {
        try {
          const currentValue = gainNode.gain.value;
          gainNode.gain.cancelScheduledValues(stopTime);
          gainNode.gain.setValueAtTime(currentValue, stopTime);
          gainNode.gain.linearRampToValueAtTime(0, stopTime + 0.02);
        } catch (err) {
          // Ignore nodes that have already been disconnected or stopped.
        }
      }

      try {
        entry.source.stop(stopTime + 0.02);
      } catch (err) {
        // Source may already be stopped; ignore duplicate stop scheduling.
      }
    }

    scheduledAudioSources.clear();
  }

  function stopActiveChordVoices(stopTime = getAudioContext()?.currentTime ?? 0, fadeDuration = getDefaultFadeDuration()) {
    stopActiveComping(stopTime, fadeDuration);
  }

  return {
    trackScheduledSource,
    clearScheduledDisplays,
    stopScheduledAudio,
    stopActiveChordVoices,
    getPendingDisplayTimeouts: () => pendingDisplayTimeouts,
    getScheduledAudioSources: () => scheduledAudioSources
  };
}


