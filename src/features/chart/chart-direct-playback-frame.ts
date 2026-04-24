export function createChartDirectPlaybackFrameHost({
  getExistingFrame,
  setFrame,
  src = '../index.html?embedded=1',
  id = 'drill-bridge-frame',
  className = 'chart-drill-bridge',
  title = 'Hidden playback bridge',
  parent = typeof document !== 'undefined' ? document.body : null,
  createFrame = () => document.createElement('iframe') as HTMLIFrameElement
}: {
  getExistingFrame?: () => HTMLIFrameElement | null;
  setFrame?: (frame: HTMLIFrameElement) => void;
  src?: string;
  id?: string;
  className?: string;
  title?: string;
  parent?: ParentNode | null;
  createFrame?: () => HTMLIFrameElement;
} = {}) {
  function isIframeElement(value: unknown): value is HTMLIFrameElement {
    return Boolean(
      value
      && typeof value === 'object'
      && 'contentWindow' in (value as object)
    );
  }

  function ensureFrame(): HTMLIFrameElement {
    const existingFrame = getExistingFrame?.() || null;
    if (isIframeElement(existingFrame)) {
      return existingFrame;
    }

    const frame = createFrame();
    frame.id = id;
    frame.className = className;
    frame.src = src;
    frame.title = title;
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    parent?.appendChild(frame);
    setFrame?.(frame);
    return frame;
  }

  return {
    ensureFrame,
    getTargetWindow() {
      return ensureFrame().contentWindow || null;
    }
  };
}
