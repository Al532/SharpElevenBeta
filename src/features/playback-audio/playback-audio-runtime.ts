
import type { PlaybackSamplePolicy } from './playback-audio-types.js';

type PlaybackSampleBufferStore = Record<string, Record<string | number, AudioBuffer | null | undefined>>;
type PlaybackSampleLoadPromiseStore = Record<string, Map<string | number, Promise<any>>>;
type PlaybackMixerSliderLike = { value: string | number };
type PlaybackMixerLabelLike = { value?: string; textContent?: string | null };
type PlaybackMixerDom = {
  masterVolume?: PlaybackMixerSliderLike | null;
  masterVolumeValue?: PlaybackMixerLabelLike | null;
  bassVolume?: PlaybackMixerSliderLike | null;
  bassVolumeValue?: PlaybackMixerLabelLike | null;
  stringsVolume?: PlaybackMixerSliderLike | null;
  stringsVolumeValue?: PlaybackMixerLabelLike | null;
  drumsVolume?: PlaybackMixerSliderLike | null;
  drumsVolumeValue?: PlaybackMixerLabelLike | null;
};

type PlaybackAudioRuntimeOptions = {
  sampleBuffers?: PlaybackSampleBufferStore;
  sampleLoadPromises?: PlaybackSampleLoadPromiseStore;
  sampleFileBuffers?: Map<string, ArrayBuffer>;
  sampleFileFetchPromises?: Map<string, Promise<ArrayBuffer>>;
  getProtectedSampleCategories?: () => Iterable<string>;
  getAudioContext?: () => AudioContext | null;
  appVersion?: string;
  fetchImpl?: typeof fetch;
  samplePolicy?: PlaybackSamplePolicy;
};

type DecodedSampleCacheEntry = {
  category: string;
  key: string | number;
  buffer: AudioBuffer;
  bytes: number;
  lastUsedAt: number;
};

function estimateAudioBufferBytes(buffer: AudioBuffer | null | undefined) {
  if (!buffer) return 0;
  return Math.max(0, buffer.length || 0) * Math.max(1, buffer.numberOfChannels || 1) * 4;
}

function isAudioSampleDebugEnabled() {
  try {
    return globalThis.localStorage?.getItem('sharpElevenAudioSampleDebug') === '1'
      || globalThis.localStorage?.getItem('sharpElevenAudioCacheDebug') === '1';
  } catch {
    return false;
  }
}

function logAudioSampleDebug(event: string, details: Record<string, unknown>, level: 'debug' | 'warn' = 'debug', force = false) {
  if (!force && !isAudioSampleDebugEnabled()) return;
  const logger = level === 'warn' ? console.warn : console.debug;
  logger(`[audio-sample] ${event}`, details);
}

/**
 * @param {{
 *   sampleBuffers?: Record<string, Record<string | number, AudioBuffer | null | undefined>>,
 *   sampleLoadPromises?: Record<string, Map<string | number, Promise<any>>>,
 *   sampleFileBuffers?: Map<string, ArrayBuffer>,
 *   sampleFileFetchPromises?: Map<string, Promise<ArrayBuffer>>,
 *   getAudioContext?: () => BaseAudioContext | null,
 *   appVersion?: string,
 *   fetchImpl?: typeof fetch
 * }} [options]
 */
export function createPlaybackAudioRuntime({
  sampleBuffers = /** @type {any} */ ({}),
  sampleLoadPromises = /** @type {any} */ ({}),
  sampleFileBuffers = new Map(),
  sampleFileFetchPromises = new Map(),
  getProtectedSampleCategories = () => [],
  getAudioContext,
  appVersion = 'dev',
  fetchImpl,
  samplePolicy
}: PlaybackAudioRuntimeOptions = {}) {
  const effectiveFetch = fetchImpl || fetch;
  const decodedCacheMaxBytes = samplePolicy?.decodedCacheMaxBytes ?? Infinity;
  const decodedSampleCacheEntries = new Map<string, DecodedSampleCacheEntry>();
  const sampleCategoryGenerations = new Map<string, number>();
  let decodedSampleCacheClock = 0;

  function getDecodedSampleCacheKey(category: string, key: string | number) {
    return `${category}:${String(key)}`;
  }

  function getSampleCategoryGeneration(category: string) {
    return sampleCategoryGenerations.get(category) || 0;
  }

  function collectDecodedSampleCacheStats() {
    const uniqueBuffers = new Set<AudioBuffer>();
    let decodedBytes = 0;
    for (const entry of decodedSampleCacheEntries.values()) {
      if (uniqueBuffers.has(entry.buffer)) continue;
      uniqueBuffers.add(entry.buffer);
      decodedBytes += entry.bytes;
    }
    return {
      target: samplePolicy?.target ?? 'web',
      decodedBufferCount: uniqueBuffers.size,
      decodedEntryCount: decodedSampleCacheEntries.size,
      decodedBytes,
      decodedMaxBytes: Number.isFinite(decodedCacheMaxBytes) ? decodedCacheMaxBytes : 0,
      sampleLoadPromiseCount: Object.values(sampleLoadPromises).reduce((total, promises) => total + (promises?.size || 0), 0),
      sampleFileFetchPromiseCount: sampleFileFetchPromises.size,
      compressedBufferCount: sampleFileBuffers.size
    };
  }

  function isSampleLoadPending(category: string, key: string | number) {
    return Boolean(sampleLoadPromises[category]?.has(key));
  }

  function isDecodedSampleEntryProtected(entry: DecodedSampleCacheEntry) {
    if (new Set(getProtectedSampleCategories()).has(entry.category)) {
      return true;
    }
    for (const candidate of decodedSampleCacheEntries.values()) {
      if (candidate.buffer === entry.buffer && isSampleLoadPending(candidate.category, candidate.key)) {
        return true;
      }
    }
    return false;
  }

  function touchDecodedSample(category: string, key: string | number) {
    const entry = decodedSampleCacheEntries.get(getDecodedSampleCacheKey(category, key));
    if (entry) {
      decodedSampleCacheClock += 1;
      entry.lastUsedAt = decodedSampleCacheClock;
    }
  }

  function deleteDecodedSampleEntry(entry: DecodedSampleCacheEntry) {
    const buffer = entry.buffer;
    if (entry.category === 'piano') {
      logAudioSampleDebug('pcm-evict', {
        category: entry.category,
        key: entry.key,
        bytes: entry.bytes,
        decodedBytes: collectDecodedSampleCacheStats().decodedBytes,
        decodedMaxBytes: Number.isFinite(decodedCacheMaxBytes) ? decodedCacheMaxBytes : null
      });
    }
    for (const [cacheKey, candidate] of [...decodedSampleCacheEntries.entries()]) {
      if (candidate.buffer === buffer) {
        decodedSampleCacheEntries.delete(cacheKey);
        if (sampleBuffers[candidate.category]?.[candidate.key] === buffer) {
          delete sampleBuffers[candidate.category][candidate.key];
        }
      }
    }
  }

  function purgeSampleCategory(category: string) {
    for (const entry of [...decodedSampleCacheEntries.values()]) {
      if (entry.category === category) {
        deleteDecodedSampleEntry(entry);
      }
    }
    if (sampleBuffers[category]) {
      for (const key of Object.keys(sampleBuffers[category])) {
        delete sampleBuffers[category][key];
      }
    }
    sampleCategoryGenerations.set(category, getSampleCategoryGeneration(category) + 1);
    sampleLoadPromises[category]?.clear();
    logAudioSampleDebug('category-purged', {
      category,
      stats: collectDecodedSampleCacheStats()
    });
  }

  function evictDecodedSamplesIfNeeded() {
    if (!Number.isFinite(decodedCacheMaxBytes) || decodedCacheMaxBytes <= 0) return;

    let stats = collectDecodedSampleCacheStats();
    while (stats.decodedBytes > decodedCacheMaxBytes) {
      const evictable = [...decodedSampleCacheEntries.values()]
        .filter((entry, index, entries) => (
          entries.findIndex((candidate) => candidate.buffer === entry.buffer) === index
          && !isDecodedSampleEntryProtected(entry)
        ))
        .sort((left, right) => left.lastUsedAt - right.lastUsedAt)[0];
      if (!evictable) break;
      deleteDecodedSampleEntry(evictable);
      stats = collectDecodedSampleCacheStats();
    }
  }

  function registerDecodedSample(category: string, key: string | number, buffer: AudioBuffer | null | undefined) {
    if (!buffer) return;
    decodedSampleCacheClock += 1;
    decodedSampleCacheEntries.set(getDecodedSampleCacheKey(category, key), {
      category,
      key,
      buffer,
      bytes: estimateAudioBufferBytes(buffer),
      lastUsedAt: decodedSampleCacheClock
    });
    evictDecodedSamplesIfNeeded();
  }

  function updateMixerValueLabel(
    slider?: { value: string | number } | null,
    output?: { value?: string; textContent?: string | null } | null
  ) {
    if (!slider || !output) return;
    output.value = `${slider.value}%`;
    output.textContent = `${slider.value}%`;
  }

  function applyMixerSettings({
    dom,
    mixerNodes,
    audioCtx,
    sliderValueToGain,
    mixerChannelCalibration
  }: {
    dom?: PlaybackMixerDom;
    mixerNodes?: Record<string, GainNode> | null;
    audioCtx?: AudioContext | null;
    sliderValueToGain: (slider?: any) => number;
    mixerChannelCalibration: Record<string, number>;
  }) {
    updateMixerValueLabel(dom?.masterVolume, dom?.masterVolumeValue);
    updateMixerValueLabel(dom?.bassVolume, dom?.bassVolumeValue);
    updateMixerValueLabel(dom?.stringsVolume, dom?.stringsVolumeValue);
    updateMixerValueLabel(dom?.drumsVolume, dom?.drumsVolumeValue);

    if (!mixerNodes || !audioCtx) return;

    const now = audioCtx.currentTime;
    mixerNodes.master.gain.setValueAtTime(sliderValueToGain(dom?.masterVolume) * mixerChannelCalibration.master, now);
    mixerNodes.bass.gain.setValueAtTime(sliderValueToGain(dom?.bassVolume) * mixerChannelCalibration.bass, now);
    mixerNodes.strings.gain.setValueAtTime(sliderValueToGain(dom?.stringsVolume) * mixerChannelCalibration.strings, now);
    mixerNodes.drums.gain.setValueAtTime(sliderValueToGain(dom?.drumsVolume) * mixerChannelCalibration.drums, now);
  }

  function loadTrackedSample(
    category: string,
    key: string | number,
    loader: () => Promise<any>
  ) {
    if (sampleBuffers[category]?.[key]) {
      touchDecodedSample(category, key);
      if (category === 'piano') {
        logAudioSampleDebug('cache-hit', { category, key });
      }
      return Promise.resolve(sampleBuffers[category][key]);
    }

    const pendingLoad = sampleLoadPromises[category]?.get(key);
    if (pendingLoad) {
      if (category === 'piano') {
        logAudioSampleDebug('load-dedupe-pending', { category, key });
      }
      return pendingLoad;
    }

    if (category === 'piano') {
      logAudioSampleDebug('load-start', { category, key });
    }
    const loadPromise = loader().finally(() => {
      sampleLoadPromises[category]?.delete(key);
    });
    sampleLoadPromises[category]?.set(key, loadPromise);
    return loadPromise;
  }

  function fetchArrayBufferFromUrl(baseUrl: string) {
    if (samplePolicy?.compressedCache !== 'none' && sampleFileBuffers.has(baseUrl)) {
      if (baseUrl.includes('/Piano/') || baseUrl.includes('/MP3/Piano/')) {
        logAudioSampleDebug('compressed-cache-hit', { baseUrl });
      }
      return Promise.resolve(sampleFileBuffers.get(baseUrl));
    }

    const pendingFetch = sampleFileFetchPromises.get(baseUrl);
    if (pendingFetch) {
      if (baseUrl.includes('/Piano/') || baseUrl.includes('/MP3/Piano/')) {
        logAudioSampleDebug('fetch-dedupe-pending', { baseUrl });
      }
      return pendingFetch;
    }

    const versionedUrl = `${baseUrl}?v=${encodeURIComponent(appVersion)}`;
    if (baseUrl.includes('/Piano/') || baseUrl.includes('/MP3/Piano/')) {
      logAudioSampleDebug('fetch-start', { baseUrl, versionedUrl });
    }
    const fetchPromise = effectiveFetch(versionedUrl)
      .then((response) => {
        if (response.ok) return response.arrayBuffer();
        if (baseUrl.includes('/Piano/') || baseUrl.includes('/MP3/Piano/')) {
          logAudioSampleDebug('fetch-versioned-miss', {
            baseUrl,
            versionedUrl,
            status: response.status
          }, 'warn');
        }
        return effectiveFetch(baseUrl).then((fallbackResponse) => {
          if (!fallbackResponse.ok) throw new Error(`HTTP ${fallbackResponse.status} for ${baseUrl}`);
          return fallbackResponse.arrayBuffer();
        });
      })
      .then((buffer) => {
        if (baseUrl.includes('/Piano/') || baseUrl.includes('/MP3/Piano/')) {
          logAudioSampleDebug('fetch-success', { baseUrl, byteLength: buffer.byteLength });
        }
        if (samplePolicy?.compressedCache !== 'none') {
          sampleFileBuffers.set(baseUrl, buffer);
        }
        return buffer;
      })
      .finally(() => {
        sampleFileFetchPromises.delete(baseUrl);
      });

    sampleFileFetchPromises.set(baseUrl, fetchPromise);
    return fetchPromise;
  }

  function loadBufferFromUrl(baseUrl: string) {
    const audioContext = getAudioContext?.();
    if (!audioContext) {
      return Promise.reject(new Error('Audio context unavailable.'));
    }
    return fetchArrayBufferFromUrl(baseUrl)
      .then((buffer) => audioContext.decodeAudioData(buffer.slice(0)));
  }

  function loadSample(category: string, folder: string, midi: number) {
    const baseUrl = category === 'bass'
      ? `assets/OGG/Bass/${midi}.ogg`
      : `assets/MP3/${folder}/${midi}.mp3`;
    const loadGeneration = getSampleCategoryGeneration(category);
    return loadTrackedSample(category, midi, () => loadBufferFromUrl(baseUrl)
      .then((decoded) => {
        if (loadGeneration !== getSampleCategoryGeneration(category)) return decoded;
        sampleBuffers[category][midi] = decoded;
        registerDecodedSample(category, midi, decoded);
        return decoded;
      })
      .catch(() => null));
  }

  function loadPianoSample(layer: string, midi: number) {
    const key = `${layer}:${midi}`;
    const layeredUrl = `assets/Piano/${layer}/${midi}.mp3`;
    const legacyUrl = `assets/MP3/Piano/${midi}.mp3`;
    const loadGeneration = getSampleCategoryGeneration('piano');
    return loadTrackedSample('piano', key, () => loadBufferFromUrl(layeredUrl)
      .catch((layeredError) => {
        logAudioSampleDebug('piano-layered-load-failed-fallback', {
          layer,
          midi,
          key,
          layeredUrl,
          legacyUrl,
          error: layeredError instanceof Error ? layeredError.message : String(layeredError)
        }, 'warn');
        return loadBufferFromUrl(legacyUrl);
      })
      .then((decoded) => {
        if (loadGeneration !== getSampleCategoryGeneration('piano')) return decoded;
        sampleBuffers.piano[key] = decoded;
        registerDecodedSample('piano', key, decoded);
        if (!sampleBuffers.piano[midi]) {
          sampleBuffers.piano[midi] = decoded;
          registerDecodedSample('piano', midi, decoded);
        }
        logAudioSampleDebug('piano-load-success', {
          layer,
          midi,
          key,
          duration: decoded.duration,
          bytes: estimateAudioBufferBytes(decoded),
          stats: collectDecodedSampleCacheStats()
        });
        return decoded;
      })
      .catch((error) => {
        logAudioSampleDebug('piano-load-failed', {
          layer,
          midi,
          key,
          layeredUrl,
          legacyUrl,
          error: error instanceof Error ? error.message : String(error)
        }, 'warn', true);
        return null;
      }));
  }

  async function loadPianoSampleList(midiValues: Iterable<number>) {
    const sortedMidis = [...midiValues].sort((a, b) => a - b);
    logAudioSampleDebug('piano-list-load-start', {
      midiValues: sortedMidis,
      layerCount: 3,
      totalRequests: sortedMidis.length * 3
    });
    const promises: Promise<any>[] = [];
    for (const midi of sortedMidis) {
      promises.push(loadPianoSample('p', midi));
      promises.push(loadPianoSample('mf', midi));
      promises.push(loadPianoSample('f', midi));
    }
    await Promise.all(promises);
  }

  function loadFileSample(category: string, key: string, baseUrl: string) {
    const loadGeneration = getSampleCategoryGeneration(category);
    return loadTrackedSample(category, key, () => loadBufferFromUrl(baseUrl)
      .then((decoded) => {
        if (loadGeneration !== getSampleCategoryGeneration(category)) return decoded;
        sampleBuffers[category][key] = decoded;
        registerDecodedSample(category, key, decoded);
        return decoded;
      })
      .catch(() => null));
  }

  return {
    updateMixerValueLabel,
    applyMixerSettings,
    loadTrackedSample,
    loadSample,
    loadPianoSample,
    loadPianoSampleList,
    loadFileSample,
    fetchArrayBufferFromUrl,
    loadBufferFromUrl,
    touchSampleBuffer: touchDecodedSample,
    purgeSampleCategory,
    getSampleCacheStats: collectDecodedSampleCacheStats
  };
}


