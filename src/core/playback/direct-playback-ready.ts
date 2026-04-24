import type { DirectPlaybackControllerOptions } from '../types/contracts';

import { DIRECT_PLAYBACK_READY_EVENT } from './embedded-playback-identifiers.js';

export function waitForDirectPlaybackOptions({
  getTargetWindow,
  getHostFrame,
  getDirectPlaybackOptions,
  readyEventName = DIRECT_PLAYBACK_READY_EVENT,
  timeoutMs = 10000
}: {
  getTargetWindow?: () => Window | null;
  getHostFrame?: () => HTMLIFrameElement | null;
  getDirectPlaybackOptions?: () => DirectPlaybackControllerOptions | null;
  readyEventName?: string;
  timeoutMs?: number;
} = {}): Promise<DirectPlaybackControllerOptions> {
  const scheduleTimeout = globalThis.setTimeout?.bind(globalThis);

  return new Promise((resolve, reject) => {
    const targetWindow = getTargetWindow?.() || null;
    const frame = getHostFrame?.() || null;

    const finish = () => {
      const directPlaybackOptions = getDirectPlaybackOptions?.() || null;
      if (directPlaybackOptions) {
        resolve(directPlaybackOptions);
        return true;
      }
      return false;
    };

    if (finish()) return;

    const onReady = () => {
      cleanup();
      if (finish()) return;
      reject(new Error('Direct playback host loaded without exposing direct controller options.'));
    };

    const onLoad = () => {
      scheduleTimeout?.(() => {
        const directPlaybackOptions = getDirectPlaybackOptions?.() || null;
        if (directPlaybackOptions) {
          cleanup();
          resolve(directPlaybackOptions);
        }
      }, 0);
    };

    const cleanup = () => {
      frame?.removeEventListener?.('load', onLoad);
      targetWindow?.removeEventListener?.(readyEventName, onReady);
    };

    frame?.addEventListener?.('load', onLoad, { once: true });
    targetWindow?.addEventListener?.(readyEventName, onReady, { once: true });

    if (!frame && !targetWindow) {
      reject(new Error('Missing direct playback host.'));
      return;
    }

    scheduleTimeout?.(() => {
      const directPlaybackOptions = getDirectPlaybackOptions?.() || null;
      if (directPlaybackOptions) {
        cleanup();
        resolve(directPlaybackOptions);
        return;
      }
      cleanup();
      reject(new Error('Timed out while waiting for the direct playback host.'));
    }, timeoutMs);
  });
}
