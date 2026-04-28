import { CHART_DISPLAY_CONFIG } from '../../config/trainer-config.js';

const CHART_TEXT_SCALE_COMPENSATION_CSS_VAR = CHART_DISPLAY_CONFIG.textScaleCompensation.cssVarName;

function readSafeAreaInsets() {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.inset = '0';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.paddingTop = 'env(safe-area-inset-top)';
  probe.style.paddingRight = 'env(safe-area-inset-right)';
  probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
  probe.style.paddingLeft = 'env(safe-area-inset-left)';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe);
  const insets = {
    top: parseFloat(computed.paddingTop) || 0,
    right: parseFloat(computed.paddingRight) || 0,
    bottom: parseFloat(computed.paddingBottom) || 0,
    left: parseFloat(computed.paddingLeft) || 0
  };
  probe.remove();
  return insets;
}

export function syncChartCutoutPadding() {
  const extraPadding = CHART_DISPLAY_CONFIG.sheetHeader.cutoutSidePaddingPx;
  const insets = readSafeAreaInsets();
  const maxInset = Math.max(insets.top, insets.right, insets.bottom, insets.left);
  const rootStyle = document.documentElement.style;
  const isCutoutSide = (side: keyof typeof insets) => maxInset > 0 && insets[side] === maxInset;
  (['top', 'right', 'bottom', 'left'] as const).forEach((side) => {
    rootStyle.setProperty(
      `--chart-runtime-cutout-padding-${side}`,
      side !== 'top' && isCutoutSide(side) ? `${extraPadding}px` : '0px'
    );
  });
}

export function applyChartDisplayCssVariables() {
  const rootStyle = document.documentElement.style;
  const { rowSpacing, sheetHeader, barGeometry, chordSizing, displacement } = CHART_DISPLAY_CONFIG;

  const setCssVar = (name: string, value: string | number) => {
    rootStyle.setProperty(name, String(value));
  };

  setCssVar('--chart-config-row-gap-min', `${rowSpacing.minPx}px`);
  setCssVar('--chart-config-sheet-bottom-margin', `${CHART_DISPLAY_CONFIG.layout.sheetBottomMarginPx}px`);
  setCssVar('--chart-config-sheet-header-padding-top-portrait', `${sheetHeader.portraitTopPaddingPx}px`);
  setCssVar('--chart-config-sheet-header-padding-top-landscape', `${sheetHeader.landscapeTopPaddingPx}px`);
  setCssVar('--chart-config-cutout-side-padding', `${sheetHeader.cutoutSidePaddingPx}px`);
  setCssVar('--chart-config-sheet-title-offset-x', `${sheetHeader.titleOffsetXPx}px`);

  setCssVar('--chart-config-bar-cell-min-height', `${barGeometry.cellMinHeightPx}px`);
  setCssVar('--chart-config-bar-cell-vertical-size', `${barGeometry.cellVerticalSizePx}px`);
  setCssVar('--chart-config-bar-cell-bottom-margin', `${barGeometry.cellBottomMarginPx}px`);
  setCssVar('--chart-config-bar-content-inset-x', `${displacement.contentHorizontalInsetPx}px`);
  setCssVar('--chart-config-bar-line-height', `${barGeometry.barLine.heightPx}px`);
  setCssVar('--chart-config-bar-body-size', `${chordSizing.baseRem}rem`);
  syncChartCutoutPadding();
}

export function measureChartTextScaleCompensation() {
  const probe = document.createElement('div');
  probe.textContent = CHART_DISPLAY_CONFIG.textScaleCompensation.probeText;
  probe.style.position = 'fixed';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.fontSize = `${CHART_DISPLAY_CONFIG.textScaleCompensation.referenceFontSizePx}px`;
  probe.style.lineHeight = '1';
  probe.style.whiteSpace = 'nowrap';
  document.body.appendChild(probe);
  const computedFontPx = parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();

  const compensation = !computedFontPx || !Number.isFinite(computedFontPx)
    ? 1
    : Math.max(
      CHART_DISPLAY_CONFIG.textScaleCompensation.minCompensation,
      Math.min(
        CHART_DISPLAY_CONFIG.textScaleCompensation.maxCompensation,
        CHART_DISPLAY_CONFIG.textScaleCompensation.referenceFontSizePx / computedFontPx
      )
    );

  document.documentElement.style.setProperty(
    CHART_TEXT_SCALE_COMPENSATION_CSS_VAR,
    compensation.toFixed(4)
  );
  return compensation;
}
