
type DrillNextPreviewDom = {
  nextPreviewUnitToggle?: HTMLInputElement | null;
  nextPreviewValue?: HTMLInputElement | null;
  nextPreviewHint?: HTMLElement | null;
  tempoSlider?: HTMLInputElement | null;
};

type DrillNextPreviewState = {
  getNextPreviewLeadUnit?: () => string;
  setNextPreviewLeadUnit?: (unit: string) => void;
  getNextPreviewLeadValue?: () => number;
  setNextPreviewLeadValue?: (value: number) => void;
};

type DrillNextPreviewConstants = {
  NEXT_PREVIEW_UNIT_BARS?: string;
  NEXT_PREVIEW_UNIT_SECONDS?: string;
  DEFAULT_NEXT_PREVIEW_LEAD_BARS?: number;
};

type DrillNextPreviewHelpers = {
  getSecondsPerBeat?: () => number;
  refreshDisplayedHarmony?: () => void;
  formatNumber?: (value: unknown, maximumFractionDigits?: number) => string;
};

type CreateDrillNextPreviewRootAppFacadeOptions = {
  dom?: DrillNextPreviewDom;
  state?: DrillNextPreviewState;
  constants?: DrillNextPreviewConstants;
  helpers?: DrillNextPreviewHelpers;
};

/**
 * Creates the drill next-preview facade from live root-app bindings.
 * This keeps the next-preview unit conversion and UI sync logic out of
 * `app.js` while preserving the same controls/runtime behavior.
 *
 * @param {object} [options]
 * @param {DrillNextPreviewDom} [options.dom]
 * @param {DrillNextPreviewState} [options.state]
 * @param {DrillNextPreviewConstants} [options.constants]
 * @param {DrillNextPreviewHelpers} [options.helpers]
 */
export function createDrillNextPreviewRootAppFacade({
  dom = {},
  state = {},
  constants = {},
  helpers = {}
}: CreateDrillNextPreviewRootAppFacadeOptions = {}) {
  const {
    getNextPreviewLeadUnit = () => 'bars',
    setNextPreviewLeadUnit = () => {},
    getNextPreviewLeadValue = () => 0,
    setNextPreviewLeadValue = () => {}
  } = state;
  const {
    NEXT_PREVIEW_UNIT_BARS = 'bars',
    NEXT_PREVIEW_UNIT_SECONDS = 'seconds',
    DEFAULT_NEXT_PREVIEW_LEAD_BARS = 2
  } = constants;
  const {
    getSecondsPerBeat = () => 0.5,
    refreshDisplayedHarmony = () => {},
    formatNumber = (value, maximumFractionDigits = 2) => new Intl.NumberFormat('en-US', {
      maximumFractionDigits,
      minimumFractionDigits: 0
    }).format(Math.round(Number(value || 0) * 100) / 100)
  } = helpers;

  function normalizeNextPreviewUnit(unit) {
    return unit === NEXT_PREVIEW_UNIT_SECONDS ? NEXT_PREVIEW_UNIT_SECONDS : NEXT_PREVIEW_UNIT_BARS;
  }

  function normalizeNextPreviewLeadValue(value) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return DEFAULT_NEXT_PREVIEW_LEAD_BARS;
    return Math.min(32, Math.max(0, Math.round(parsed * 100) / 100));
  }

  function formatPreviewNumber(value, maximumFractionDigits = 2) {
    return formatNumber(value, maximumFractionDigits);
  }

  function barsToSeconds(bars) {
    return normalizeNextPreviewLeadValue(bars) * 4 * getSecondsPerBeat();
  }

  function secondsToBars(seconds) {
    const parsed = Number.parseFloat(seconds);
    if (!Number.isFinite(parsed)) {
      return getNextPreviewLeadUnit() === NEXT_PREVIEW_UNIT_BARS
        ? getNextPreviewLeadValue()
        : DEFAULT_NEXT_PREVIEW_LEAD_BARS;
    }
    return normalizeNextPreviewLeadValue(parsed / (4 * getSecondsPerBeat()));
  }

  function getNextPreviewInputUnit() {
    return getNextPreviewLeadUnit();
  }

  function setNextPreviewInputUnit(unit) {
    const normalizedUnit = normalizeNextPreviewUnit(unit);
    setNextPreviewLeadUnit(normalizedUnit);
    if (!dom.nextPreviewUnitToggle) return;
    dom.nextPreviewUnitToggle.checked = normalizedUnit === NEXT_PREVIEW_UNIT_SECONDS;
  }

  function getNextPreviewLeadSeconds() {
    return getNextPreviewLeadUnit() === NEXT_PREVIEW_UNIT_SECONDS
      ? getNextPreviewLeadValue()
      : barsToSeconds(getNextPreviewLeadValue());
  }

  function getNextPreviewLeadBars() {
    return getNextPreviewLeadUnit() === NEXT_PREVIEW_UNIT_BARS
      ? getNextPreviewLeadValue()
      : secondsToBars(getNextPreviewLeadValue());
  }

  function formatBarsLabel(value) {
    return `${formatPreviewNumber(value)} ${value === 1 ? 'bar' : 'bars'}`;
  }

  function syncNextPreviewControlDisplay() {
    const unit = getNextPreviewInputUnit();
    if (dom.nextPreviewValue) {
      dom.nextPreviewValue.value = formatPreviewNumber(
        getNextPreviewLeadValue(),
        unit === NEXT_PREVIEW_UNIT_SECONDS ? 1 : 2
      );
      dom.nextPreviewValue.step = unit === NEXT_PREVIEW_UNIT_SECONDS ? '0.1' : '0.25';
    }
    if (dom.nextPreviewHint) {
      const tempo = Number(dom.tempoSlider?.value || 120);
      dom.nextPreviewHint.textContent = unit === NEXT_PREVIEW_UNIT_SECONDS
        ? `${formatBarsLabel(getNextPreviewLeadBars())} at ${tempo} BPM`
        : `${formatPreviewNumber(getNextPreviewLeadSeconds(), 1)} seconds at ${tempo} BPM`;
    }
  }

  function commitNextPreviewValueFromInput() {
    const rawValue = Number.parseFloat(dom.nextPreviewValue?.value ?? '');
    if (!Number.isFinite(rawValue)) {
      syncNextPreviewControlDisplay();
      return;
    }
    setNextPreviewLeadValue(normalizeNextPreviewLeadValue(rawValue));
    syncNextPreviewControlDisplay();
    refreshDisplayedHarmony();
  }

  function convertNextPreviewValueToUnit(nextUnit) {
    const normalizedNextUnit = normalizeNextPreviewUnit(nextUnit);
    if (normalizedNextUnit === getNextPreviewLeadUnit()) return;

    const valueInSeconds = getNextPreviewLeadSeconds();
    setNextPreviewLeadUnit(normalizedNextUnit);
    setNextPreviewLeadValue(
      normalizedNextUnit === NEXT_PREVIEW_UNIT_SECONDS
        ? normalizeNextPreviewLeadValue(valueInSeconds)
        : secondsToBars(valueInSeconds)
    );
  }

  return {
    normalizeNextPreviewUnit,
    normalizeNextPreviewLeadValue,
    formatPreviewNumber,
    barsToSeconds,
    secondsToBars,
    getNextPreviewInputUnit,
    setNextPreviewInputUnit,
    getNextPreviewLeadSeconds,
    getNextPreviewLeadBars,
    formatBarsLabel,
    syncNextPreviewControlDisplay,
    commitNextPreviewValueFromInput,
    convertNextPreviewValueToUnit
  };
}


