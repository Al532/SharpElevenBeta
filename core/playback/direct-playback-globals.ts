import type { DirectPlaybackControllerOptions } from '../types/contracts';

import {
  DIRECT_PLAYBACK_OPTIONS_GLOBAL,
  DIRECT_PLAYBACK_READY_EVENT
} from './embedded-playback-identifiers.js';

export function publishDirectPlaybackGlobals({
  targetWindow = window,
  directPlaybackControllerOptions = null,
  readyEventName = DIRECT_PLAYBACK_READY_EVENT
}: {
  targetWindow?: Window | null;
  directPlaybackControllerOptions?: DirectPlaybackControllerOptions | null;
  readyEventName?: string;
} = {}): void {
  if (!targetWindow || !directPlaybackControllerOptions) return;
  targetWindow[DIRECT_PLAYBACK_OPTIONS_GLOBAL] = directPlaybackControllerOptions;
  targetWindow.dispatchEvent(new CustomEvent(readyEventName));
}

export function readDirectPlaybackGlobals(
  targetWindow: Window | null | undefined = window
): DirectPlaybackControllerOptions | null {
  return targetWindow?.[DIRECT_PLAYBACK_OPTIONS_GLOBAL] || null;
}
