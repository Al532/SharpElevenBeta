import { readDirectPlaybackGlobals } from '../../core/playback/direct-playback-globals.js';
import { createChartDirectPlaybackFrameHost } from './chart-direct-playback-frame.js';

export function createChartDirectPlaybackWindowHost({
  getCurrentWindow = () => (typeof window !== 'undefined' ? window : null),
  shouldUseCurrentWindow = (targetWindow: Window | null) => Boolean(readDirectPlaybackGlobals(targetWindow)),
  getExistingFrame,
  setFrame,
  src,
  id,
  className,
  title,
  parent,
  createFrame
}: {
  getCurrentWindow?: () => Window | null;
  shouldUseCurrentWindow?: (targetWindow: Window | null) => boolean;
  getExistingFrame?: () => HTMLIFrameElement | null;
  setFrame?: (frame: HTMLIFrameElement) => void;
  src?: string;
  id?: string;
  className?: string;
  title?: string;
  parent?: ParentNode | null;
  createFrame?: () => HTMLIFrameElement;
} = {}) {
  const frameHost = createChartDirectPlaybackFrameHost({
    getExistingFrame,
    setFrame,
    src,
    id,
    className,
    title,
    parent,
    createFrame
  });

  function getCurrentTargetWindow(): Window | null {
    const targetWindow = getCurrentWindow?.() || null;
    return shouldUseCurrentWindow(targetWindow) ? targetWindow : null;
  }

  return {
    getCurrentTargetWindow() {
      return getCurrentTargetWindow();
    },
    ensureFrame() {
      return getCurrentTargetWindow() ? null : frameHost.ensureFrame();
    },
    getFallbackTargetWindow() {
      return frameHost.getTargetWindow();
    },
    getTargetWindow() {
      return getCurrentTargetWindow() || frameHost.getTargetWindow();
    }
  };
}
