// @ts-nocheck

/**
 * Creates the drill piano MIDI runtime assembly from live root-app bindings.
 * This keeps the MIDI access/input attachment workflow out of `app.js` while
 * preserving the same runtime side effects and UI synchronization behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, Function>} [options.runtimeState]
 * @param {Record<string, Function>} [options.runtimeHelpers]
 */
export function createDrillPianoMidiRuntimeRootAppAssembly({
  dom = {},
  runtimeState = {},
  runtimeHelpers = {}
} = {}) {
  const {
    getMidiAccess = () => null,
    setMidiAccess = () => {},
    getMidiAccessPromise = () => null,
    setMidiAccessPromise = () => {},
    getCurrentMidiInput = () => null,
    setCurrentMidiInput = () => {},
    getPianoMidiSettings = () => ({})
  } = runtimeState;
  const {
    normalizePianoMidiSettings = (value) => value,
    setPianoMidiSettings = () => {},
    refreshPianoSettingsJson = () => {},
    setPianoMidiStatus = () => {},
    handleMidiMessage = () => {},
    ensureMidiPianoRangePreload = () => {},
    getAudioContext = () => null,
    requestMIDIAccess = () => Promise.resolve(null),
    createOptionElement = () => (globalThis.document ? globalThis.document.createElement('option') : null)
  } = runtimeHelpers;

  function getAvailableMidiInputs() {
    const midiAccess = getMidiAccess();
    if (!midiAccess?.inputs) return [];
    return [...midiAccess.inputs.values()];
  }

  function populateMidiInputs() {
    if (!dom?.pianoMidiInput) return;
    const inputs = getAvailableMidiInputs();
    const currentValue = getPianoMidiSettings()?.inputId || '';
    dom.pianoMidiInput.innerHTML = '';

    const emptyOption = createOptionElement();
    if (emptyOption) {
      emptyOption.value = '';
      emptyOption.textContent = inputs.length ? 'Choisir une entree' : 'Aucune entree detectee';
      dom.pianoMidiInput.append(emptyOption);
    }

    for (const input of inputs) {
      const option = createOptionElement();
      if (!option) continue;
      option.value = input.id;
      option.textContent = input.name || `MIDI ${input.id}`;
      dom.pianoMidiInput.append(option);
    }

    const nextValue = inputs.some((input) => input.id === currentValue)
      ? currentValue
      : (inputs[0]?.id || '');
    dom.pianoMidiInput.value = nextValue;
    setPianoMidiSettings(normalizePianoMidiSettings({
      ...(getPianoMidiSettings() || {}),
      inputId: nextValue
    }));
    refreshPianoSettingsJson();
  }

  function detachMidiInput() {
    const currentMidiInput = getCurrentMidiInput();
    if (!currentMidiInput) return;
    currentMidiInput.onmidimessage = null;
    setCurrentMidiInput(null);
  }

  function attachMidiInput() {
    detachMidiInput();
    if (!getPianoMidiSettings()?.enabled) {
      setPianoMidiStatus('MIDI inactif');
      return;
    }

    const input = getAvailableMidiInputs().find(
      (candidate) => candidate.id === getPianoMidiSettings()?.inputId
    ) || null;
    if (!input) {
      setPianoMidiStatus('Aucune entree MIDI active');
      return;
    }

    setCurrentMidiInput(input);
    input.onmidimessage = handleMidiMessage;
    setPianoMidiStatus(`Entree: ${input.name || 'MIDI'}`);
  }

  async function ensureMidiAccess() {
    if (typeof requestMIDIAccess !== 'function') {
      setPianoMidiStatus('Web MIDI non supporte par ce navigateur');
      return null;
    }

    const existingAccess = getMidiAccess();
    if (existingAccess) return existingAccess;

    let midiAccessPromise = getMidiAccessPromise();
    if (!midiAccessPromise) {
      midiAccessPromise = requestMIDIAccess()
        .then((access) => {
          setMidiAccess(access);
          access.onstatechange = () => {
            populateMidiInputs();
            attachMidiInput();
            refreshPianoSettingsJson();
          };
          return access;
        })
        .catch((err) => {
          setMidiAccessPromise(null);
          setPianoMidiStatus('Acces MIDI refuse');
          throw err;
        });
      setMidiAccessPromise(midiAccessPromise);
    }
    return midiAccessPromise;
  }

  async function refreshMidiInputs() {
    try {
      await ensureMidiAccess();
      populateMidiInputs();
      attachMidiInput();
      if (getPianoMidiSettings()?.enabled && getAudioContext()) {
        ensureMidiPianoRangePreload();
      }
    } catch {}
  }

  return {
    attachMidiInput,
    refreshMidiInputs
  };
}


