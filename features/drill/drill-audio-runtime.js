// @ts-check

/**
 * @param {{
 *   sampleBuffers?: Record<string, Record<string, any>>,
 *   sampleLoadPromises?: Record<string, Map<string | number, Promise<any>>>,
 *   sampleFileBuffers?: Map<string, ArrayBuffer>,
 *   sampleFileFetchPromises?: Map<string, Promise<ArrayBuffer>>,
 *   getAudioContext?: () => BaseAudioContext | null,
 *   appVersion?: string,
 *   fetchImpl?: typeof fetch
 * }} [options]
 */
export function createDrillAudioRuntime({
  sampleBuffers = /** @type {any} */ ({}),
  sampleLoadPromises = /** @type {any} */ ({}),
  sampleFileBuffers = new Map(),
  sampleFileFetchPromises = new Map(),
  getAudioContext,
  appVersion = 'dev',
  fetchImpl
} = {}) {
  const effectiveFetch = fetchImpl || fetch;

  function updateMixerValueLabel(slider, output) {
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

  function loadTrackedSample(category, key, loader) {
    if (sampleBuffers[category]?.[key]) {
      return Promise.resolve(sampleBuffers[category][key]);
    }

    const pendingLoad = sampleLoadPromises[category]?.get(key);
    if (pendingLoad) return pendingLoad;

    const loadPromise = loader().finally(() => {
      sampleLoadPromises[category]?.delete(key);
    });
    sampleLoadPromises[category]?.set(key, loadPromise);
    return loadPromise;
  }

  function fetchArrayBufferFromUrl(baseUrl) {
    if (sampleFileBuffers.has(baseUrl)) {
      return Promise.resolve(sampleFileBuffers.get(baseUrl));
    }

    const pendingFetch = sampleFileFetchPromises.get(baseUrl);
    if (pendingFetch) return pendingFetch;

    const versionedUrl = `${baseUrl}?v=${encodeURIComponent(appVersion)}`;
    const fetchPromise = effectiveFetch(versionedUrl)
      .then((response) => {
        if (response.ok) return response.arrayBuffer();
        return effectiveFetch(baseUrl).then((fallbackResponse) => {
          if (!fallbackResponse.ok) throw new Error(`HTTP ${fallbackResponse.status} for ${baseUrl}`);
          return fallbackResponse.arrayBuffer();
        });
      })
      .then((buffer) => {
        sampleFileBuffers.set(baseUrl, buffer);
        return buffer;
      })
      .finally(() => {
        sampleFileFetchPromises.delete(baseUrl);
      });

    sampleFileFetchPromises.set(baseUrl, fetchPromise);
    return fetchPromise;
  }

  function loadBufferFromUrl(baseUrl) {
    const audioContext = getAudioContext?.();
    if (!audioContext) {
      return Promise.reject(new Error('Audio context unavailable.'));
    }
    return fetchArrayBufferFromUrl(baseUrl)
      .then((buffer) => audioContext.decodeAudioData(buffer.slice(0)));
  }

  function loadSample(category, folder, midi) {
    const baseUrl = `assets/MP3/${folder}/${midi}.mp3`;
    return loadTrackedSample(category, midi, () => loadBufferFromUrl(baseUrl)
      .then((decoded) => {
        sampleBuffers[category][midi] = decoded;
        return decoded;
      })
      .catch(() => null));
  }

  function loadPianoSample(layer, midi) {
    const key = `${layer}:${midi}`;
    const layeredUrl = `assets/Piano/${layer}/${midi}.mp3`;
    const legacyUrl = `assets/MP3/Piano/${midi}.mp3`;
    return loadTrackedSample('piano', key, () => loadBufferFromUrl(layeredUrl)
      .catch(() => loadBufferFromUrl(legacyUrl))
      .then((decoded) => {
        sampleBuffers.piano[key] = decoded;
        if (!sampleBuffers.piano[midi]) {
          sampleBuffers.piano[midi] = decoded;
        }
        return decoded;
      })
      .catch(() => null));
  }

  async function loadPianoSampleList(midiValues) {
    const sortedMidis = [...midiValues].sort((a, b) => a - b);
    const promises = [];
    for (const midi of sortedMidis) {
      promises.push(loadPianoSample('p', midi));
      promises.push(loadPianoSample('mf', midi));
      promises.push(loadPianoSample('f', midi));
    }
    await Promise.all(promises);
  }

  function loadFileSample(category, key, baseUrl) {
    return loadTrackedSample(category, key, () => loadBufferFromUrl(baseUrl)
      .then((decoded) => {
        sampleBuffers[category][key] = decoded;
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
    loadBufferFromUrl
  };
}
