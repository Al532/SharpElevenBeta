const LAYERS = ['p', 'mf', 'f'];
const MIDI_LOW = 45;
const MIDI_HIGH = 89;
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const noteSelect = document.getElementById('note-select');
const durationInput = document.getElementById('duration-input');
const layerControls = document.getElementById('layer-controls');
const metricsBody = document.getElementById('metrics-body');
const statusEl = document.getElementById('status');
const playAllBtn = document.getElementById('play-all-btn');
const playStackedBtn = document.getElementById('play-stacked-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');
const copySettingsBtn = document.getElementById('copy-settings-btn');

const offsetsDb = Object.fromEntries(LAYERS.map(layer => [layer, 0]));
const layerNodes = new Map();
const bufferCache = new Map();
const metricsCache = new Map();
const activeSources = new Set();

let audioContext = null;

function midiToLabel(midi) {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${midi} · ${name}${octave}`;
}

function formatDb(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setStatus(message) {
  statusEl.textContent = message;
}

function getAssetUrl(layer, midi) {
  return `./assets/Piano/${layer}/${midi}.mp3`;
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    return audioContext.resume().then(() => audioContext);
  }
  return Promise.resolve(audioContext);
}

async function loadBuffer(layer, midi) {
  const key = `${layer}:${midi}`;
  if (bufferCache.has(key)) return bufferCache.get(key);

  const promise = (async () => {
    const ctx = await ensureAudioContext();
    const response = await fetch(getAssetUrl(layer, midi));
    if (!response.ok) {
      throw new Error(`Impossible de charger ${getAssetUrl(layer, midi)}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return ctx.decodeAudioData(arrayBuffer.slice(0));
  })();

  bufferCache.set(key, promise);
  return promise;
}

function getChannelDataMix(buffer) {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const mixed = new Float32Array(length);
  for (let channel = 0; channel < channels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index++) {
      mixed[index] += data[index] / channels;
    }
  }
  return mixed;
}

async function getMetrics(layer, midi) {
  const key = `${layer}:${midi}`;
  if (metricsCache.has(key)) return metricsCache.get(key);

  const buffer = await loadBuffer(layer, midi);
  const mixed = getChannelDataMix(buffer);
  let peak = 0;
  let sumSquares = 0;
  for (let index = 0; index < mixed.length; index++) {
    const value = mixed[index];
    const abs = Math.abs(value);
    if (abs > peak) peak = abs;
    sumSquares += value * value;
  }

  const rms = mixed.length > 0 ? Math.sqrt(sumSquares / mixed.length) : 0;
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  const metrics = {
    duration: buffer.duration,
    peakDb,
    rmsDb,
  };
  metricsCache.set(key, metrics);
  return metrics;
}

function renderLayerControls() {
  layerControls.innerHTML = '';
  LAYERS.forEach((layer) => {
    const card = document.createElement('div');
    card.className = 'layer-card';

    const header = document.createElement('div');
    header.className = 'layer-header';

    const title = document.createElement('strong');
    title.textContent = layer;

    const readout = document.createElement('div');
    readout.className = 'db-readout';
    readout.textContent = formatDb(offsetsDb[layer]);

    header.append(title, readout);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-18';
    slider.max = '18';
    slider.step = '0.1';
    slider.value = String(offsetsDb[layer]);
    slider.addEventListener('input', () => {
      offsetsDb[layer] = Number(slider.value);
      readout.textContent = formatDb(offsetsDb[layer]);
      void renderMetrics();
    });

    const row = document.createElement('div');
    row.className = 'button-row';

    const playBtn = document.createElement('button');
    playBtn.textContent = `Jouer ${layer}`;
    playBtn.addEventListener('click', () => playLayer(layer));

    const zeroBtn = document.createElement('button');
    zeroBtn.className = 'ghost';
    zeroBtn.textContent = '0 dB';
    zeroBtn.addEventListener('click', () => {
      offsetsDb[layer] = 0;
      slider.value = '0';
      readout.textContent = formatDb(0);
      void renderMetrics();
    });

    row.append(playBtn, zeroBtn);
    card.append(header, slider, row);
    layerControls.append(card);
    layerNodes.set(layer, { slider, readout });
  });
}

function stopAllPlayback() {
  for (const source of activeSources) {
    try {
      source.stop();
    } catch (_) {
      // Ignore already stopped sources.
    }
  }
  activeSources.clear();
}

function createGainFromDb(db) {
  return Math.pow(10, db / 20);
}

async function playBuffer(buffer, gainValue, startTime, durationSeconds) {
  const ctx = await ensureAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gainValue, startTime);
  source.connect(gainNode).connect(ctx.destination);
  source.start(startTime);

  if (durationSeconds > 0 && durationSeconds < buffer.duration) {
    const fadeStart = Math.max(startTime, startTime + durationSeconds - 0.03);
    gainNode.gain.setValueAtTime(gainValue, fadeStart);
    gainNode.gain.linearRampToValueAtTime(0, startTime + durationSeconds);
    source.stop(startTime + durationSeconds);
  }

  activeSources.add(source);
  source.addEventListener('ended', () => activeSources.delete(source), { once: true });
}

async function playLayer(layer) {
  stopAllPlayback();
  const midi = Number(noteSelect.value);
  const durationSeconds = clamp(Number(durationInput.value) || 1.2, 0.05, 8);

  try {
    const buffer = await loadBuffer(layer, midi);
    await playBuffer(buffer, createGainFromDb(offsetsDb[layer]), (await ensureAudioContext()).currentTime + 0.01, durationSeconds);
    setStatus(`Lecture ${layer} · ${midiToLabel(midi)} · offset ${formatDb(offsetsDb[layer])}`);
  } catch (error) {
    setStatus(`Erreur: ${error.message}`);
  }
}

async function playAllLayersSequentially() {
  stopAllPlayback();
  const midi = Number(noteSelect.value);
  const durationSeconds = clamp(Number(durationInput.value) || 1.2, 0.05, 8);

  try {
    const ctx = await ensureAudioContext();
    const startBase = ctx.currentTime + 0.02;
    for (let index = 0; index < LAYERS.length; index++) {
      const layer = LAYERS[index];
      const buffer = await loadBuffer(layer, midi);
      const startTime = startBase + (index * (durationSeconds + 0.12));
      await playBuffer(buffer, createGainFromDb(offsetsDb[layer]), startTime, durationSeconds);
    }
    setStatus(`Lecture séquentielle p → mf → f · ${midiToLabel(midi)}`);
  } catch (error) {
    setStatus(`Erreur: ${error.message}`);
  }
}

async function playAllLayersStacked() {
  stopAllPlayback();
  const midi = Number(noteSelect.value);
  const durationSeconds = clamp(Number(durationInput.value) || 1.2, 0.05, 8);

  try {
    const ctx = await ensureAudioContext();
    const startTime = ctx.currentTime + 0.02;
    for (const layer of LAYERS) {
      const buffer = await loadBuffer(layer, midi);
      await playBuffer(buffer, createGainFromDb(offsetsDb[layer]), startTime, durationSeconds);
    }
    setStatus(`Lecture simultanée · ${midiToLabel(midi)}`);
  } catch (error) {
    setStatus(`Erreur: ${error.message}`);
  }
}

async function renderMetrics() {
  const midi = Number(noteSelect.value);
  metricsBody.innerHTML = '';

  for (const layer of LAYERS) {
    const row = document.createElement('tr');
    const path = `assets/Piano/${layer}/${midi}.mp3`;

    try {
      const metrics = await getMetrics(layer, midi);
      row.innerHTML = `
        <td>${layer}</td>
        <td class="mono">${path}</td>
        <td class="num">${metrics.duration.toFixed(2)} s</td>
        <td class="num">${metrics.peakDb.toFixed(1)}</td>
        <td class="num">${metrics.rmsDb.toFixed(1)}</td>
        <td class="num">${formatDb(offsetsDb[layer])}</td>
      `;
    } catch (error) {
      row.innerHTML = `
        <td>${layer}</td>
        <td class="mono">${path}</td>
        <td colspan="4">Chargement impossible</td>
      `;
    }

    metricsBody.append(row);
  }
}

function populateNotes() {
  for (let midi = MIDI_LOW; midi <= MIDI_HIGH; midi++) {
    const option = document.createElement('option');
    option.value = String(midi);
    option.textContent = midiToLabel(midi);
    if (midi === 60) option.selected = true;
    noteSelect.append(option);
  }
}

function copySettings() {
  const payload = JSON.stringify(offsetsDb, null, 2);
  navigator.clipboard.writeText(payload)
    .then(() => setStatus(`Offsets copiés dans le presse-papiers:\n${payload}`))
    .catch(() => setStatus(`Impossible de copier automatiquement.\n${payload}`));
}

function resetOffsets() {
  for (const layer of LAYERS) {
    offsetsDb[layer] = 0;
    const nodes = layerNodes.get(layer);
    if (nodes) {
      nodes.slider.value = '0';
      nodes.readout.textContent = formatDb(0);
    }
  }
  void renderMetrics();
  setStatus('Offsets réinitialisés à 0 dB.');
}

populateNotes();
renderLayerControls();
void renderMetrics();

noteSelect.addEventListener('change', () => {
  void renderMetrics();
  setStatus(`Note sélectionnée: ${midiToLabel(Number(noteSelect.value))}`);
});

playAllBtn.addEventListener('click', playAllLayersSequentially);
playStackedBtn.addEventListener('click', playAllLayersStacked);
stopBtn.addEventListener('click', () => {
  stopAllPlayback();
  setStatus('Lecture arrêtée.');
});
resetBtn.addEventListener('click', resetOffsets);
copySettingsBtn.addEventListener('click', copySettings);
