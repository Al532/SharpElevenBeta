import type { PlaybackSettings } from '../../core/types/contracts';

import {
  loadChartUiSettings,
  loadSharedPlaybackSettings,
  saveChartUiSettings,
  saveSharedPlaybackSettings
} from '../../core/storage/app-state-storage.js';

export function loadPersistedChartId({
  legacyStorageKey = ''
}: {
  legacyStorageKey?: string;
} = {}): string {
  const chartUiSettings = loadChartUiSettings();
  if (chartUiSettings?.lastChartId) {
    return String(chartUiSettings.lastChartId);
  }
  if (!legacyStorageKey) return '';
  try {
    return window.localStorage.getItem(legacyStorageKey) || '';
  } catch {
    return '';
  }
}

export function persistChartId(
  chartId: string,
  { legacyStorageKey = '' }: { legacyStorageKey?: string } = {}
): void {
  saveChartUiSettings({ lastChartId: chartId || '' });
  if (!legacyStorageKey) return;
  try {
    if (!chartId) return;
    window.localStorage.setItem(legacyStorageKey, chartId);
  } catch {
    // Ignore storage failures so chart-dev still works in restricted contexts.
  }
}

export function loadPersistedPlaybackSettings({
  legacyStorageKey = ''
}: {
  legacyStorageKey?: string;
} = {}): PlaybackSettings & Record<string, unknown> {
  const sharedPlaybackSettings = loadSharedPlaybackSettings({
    legacyChartStorageKey: legacyStorageKey
  });
  const chartUiSettings = loadChartUiSettings();

  return {
    ...(sharedPlaybackSettings || {}),
    ...((chartUiSettings?.chartPlaybackSettings && typeof chartUiSettings.chartPlaybackSettings === 'object')
      ? chartUiSettings.chartPlaybackSettings
      : {})
  };
}

export function persistPlaybackSettings({
  playbackSettings = {},
  harmonyDisplayMode = 'default',
  useMajorTriangleSymbol = true,
  useHalfDiminishedSymbol = true,
  useDiminishedSymbol = true,
  legacyStorageKey = ''
}: {
  playbackSettings?: PlaybackSettings;
  harmonyDisplayMode?: string;
  useMajorTriangleSymbol?: boolean;
  useHalfDiminishedSymbol?: boolean;
  useDiminishedSymbol?: boolean;
  legacyStorageKey?: string;
} = {}): void {
  const nextSettings = {
    compingStyle: playbackSettings.compingStyle || 'strings',
    drumsMode: playbackSettings.drumsMode || 'full_swing',
    customMediumSwingBass: playbackSettings.customMediumSwingBass !== false
  };

  saveSharedPlaybackSettings({
    ...nextSettings,
    masterVolume: Number(playbackSettings.masterVolume || 100),
    bassVolume: Number(playbackSettings.bassVolume || 100),
    stringsVolume: Number(playbackSettings.stringsVolume || 100),
    drumsVolume: Number(playbackSettings.drumsVolume || 100)
  });
  saveChartUiSettings({
    chartPlaybackSettings: {
      ...nextSettings,
      harmonyDisplayMode,
      useMajorTriangleSymbol,
      useHalfDiminishedSymbol,
      useDiminishedSymbol
    }
  });

  if (!legacyStorageKey) return;
  try {
    window.localStorage.setItem(legacyStorageKey, JSON.stringify({
      ...nextSettings,
      harmonyDisplayMode,
      useMajorTriangleSymbol,
      useHalfDiminishedSymbol,
      useDiminishedSymbol
    }));
  } catch {
    // Ignore storage failures so chart-dev still works in restricted contexts.
  }
}
