function normalizeSlotSymbol(slot) {
  return String(slot?.symbol || '').trim();
}

export function createDrillExportFromPlaybackPlan(playbackPlan, chartDocument) {
  const bars = [];

  for (const entry of playbackPlan?.entries || []) {
    const symbols = (entry.playbackSlots || [])
      .map(normalizeSlotSymbol)
      .filter(Boolean);
    if (symbols.length === 0) continue;
    bars.push(symbols.join(' '));
  }

  const patternString = bars.join(' | ');

  return {
    title: chartDocument?.metadata?.title || playbackPlan?.chartTitle || '',
    sourceKey: chartDocument?.metadata?.sourceKey || '',
    timeSignature: chartDocument?.metadata?.primaryTimeSignature || playbackPlan?.timeSignature || '',
    patternString,
    enginePatternString: patternString ? `key: C | ${patternString} |` : '',
    bars
  };
}
