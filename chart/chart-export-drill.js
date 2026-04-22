import {
  buildLegacyEnginePatternStringFromPracticeBars,
  buildLegacyPatternStringFromPracticeBars,
  createPracticePlaybackBarsFromChartEntries
} from '../core/models/practice-session.js';

export function createDrillExportFromPlaybackPlan(playbackPlan, chartDocument) {
  const practiceBars = createPracticePlaybackBarsFromChartEntries(playbackPlan?.entries || []);
  const bars = practiceBars.map((bar) => bar.symbols.join(' ')).filter(Boolean);
  const engineBars = practiceBars.map((bar) => bar.beatSlots.join(' ')).filter(Boolean);
  const patternString = buildLegacyPatternStringFromPracticeBars(practiceBars);
  const enginePatternString = buildLegacyEnginePatternStringFromPracticeBars(practiceBars);

  return {
    title: chartDocument?.metadata?.title || playbackPlan?.chartTitle || '',
    sourceKey: chartDocument?.metadata?.sourceKey || '',
    timeSignature: chartDocument?.metadata?.primaryTimeSignature || playbackPlan?.timeSignature || '',
    patternString,
    enginePatternString,
    bars,
    engineBars
  };
}
