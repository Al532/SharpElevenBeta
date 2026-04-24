
type ScheduledSourceGainNode = {
  gain: {
    value: number;
    cancelScheduledValues: (time: number) => void;
    setValueAtTime: (value: number, time: number) => void;
    linearRampToValueAtTime: (value: number, time: number) => void;
  };
};

type ScheduledAudioSource = {
  addEventListener: (
    type: 'ended',
    listener: () => void,
    options?: { once?: boolean }
  ) => void;
  stop: (when?: number) => void;
};

type ScheduledAudioEntry = {
  source: ScheduledAudioSource;
  gainNodes: ScheduledSourceGainNode[];
};

type DrillScheduledAudioRuntimeOptions = {
  getAudioContext?: () => BaseAudioContext | null;
  stopActiveComping?: (stopTime: number, fadeDuration: number) => void;
  defaultFadeDuration?: number;
  getDefaultFadeDuration?: () => number;
};

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
}: DrillScheduledAudioRuntimeOptions = {}) {
  const scheduledAudioSources = new Set<ScheduledAudioEntry>();
  const pendingDisplayTimeouts = new Set<ReturnType<typeof setTimeout>>();

  function trackScheduledSource(
    source: ScheduledAudioSource,
    gainNodes: ScheduledSourceGainNode[] = []
  ) {
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
        } catch {
          // Ignore nodes that have already been disconnected or stopped.
        }
      }

      try {
        entry.source.stop(stopTime + 0.02);
      } catch {
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


