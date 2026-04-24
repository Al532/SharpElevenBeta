import type { DirectPlaybackControllerOptions } from '../../core/types/contracts';

import { createChartDirectPlaybackWindowHost } from './chart-direct-playback-window-host.js';
import { createChartDirectPlaybackControllerOptions } from './chart-direct-playback-options.js';

export function createChartDirectPlaybackRuntimeHost({
  getCurrentWindow,
  getExistingFrame,
  setFrame,
  getTempo,
  getCurrentChartTitle,
  src,
  parent,
  timeoutMs,
  createFrame
}: {
  getCurrentWindow?: () => Window | null;
  getExistingFrame?: () => HTMLIFrameElement | null;
  setFrame?: (frame: HTMLIFrameElement) => void;
  getTempo?: () => number;
  getCurrentChartTitle?: () => string;
  src?: string;
  parent?: ParentNode | null;
  timeoutMs?: number;
  createFrame?: () => HTMLIFrameElement;
} = {}) {
  void getTempo;
  void getCurrentChartTitle;

  const windowHost = createChartDirectPlaybackWindowHost({
    getCurrentWindow,
    getExistingFrame,
    setFrame,
    src,
    parent,
    createFrame
  });

  const directPlaybackOptions = createChartDirectPlaybackControllerOptions({
    getTargetWindow: windowHost.getTargetWindow,
    getPreferredTargetWindow: windowHost.getCurrentTargetWindow,
    getFallbackTargetWindow: windowHost.getFallbackTargetWindow,
    getHostFrame: windowHost.ensureFrame,
    timeoutMs
  });

  return {
    ensureFrame: windowHost.ensureFrame,
    getCurrentTargetWindow: windowHost.getCurrentTargetWindow,
    getFallbackTargetWindow: windowHost.getFallbackTargetWindow,
    getTargetWindow: windowHost.getTargetWindow,
    getDirectPlaybackOptions(): DirectPlaybackControllerOptions {
      return directPlaybackOptions;
    }
  };
}
