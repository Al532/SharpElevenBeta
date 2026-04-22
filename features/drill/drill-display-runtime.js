export function applyDrillBeatIndicatorVisibility({
  beatIndicator,
  showBeatIndicatorEnabled
} = {}) {
  beatIndicator?.classList.toggle('hidden', showBeatIndicatorEnabled === false);
}

export function createDrillHarmonyDisplayHelpers({
  keyNamesMajor = [],
  keyNamesMinor = [],
  letters = [],
  naturalSemitones = [],
  degreeIndices = {},
  escapeHtml = (value) => String(value),
  renderChordSymbolHtml = () => '',
  getDisplayTranspositionSemitones = () => 0,
  isOneChordModeActive = () => false,
  isMinorMode = () => false,
  getDisplayedQuality = () => '',
  normalizeDisplayedRootName = (value) => value,
  normalizeHarmonyDisplayMode = (value) => value,
  getUseMajorTriangleSymbol = () => true,
  getUseHalfDiminishedSymbol = () => true,
  getUseDiminishedSymbol = () => true
} = {}) {
  function transposeDisplayPitchClass(pitchClass) {
    return (pitchClass + Number(getDisplayTranspositionSemitones?.() || 0) + 12) % 12;
  }

  function keyName(key) {
    const displayKey = transposeDisplayPitchClass(key);
    if (isOneChordModeActive()) {
      return keyNamesMajor[displayKey];
    }
    const name = isMinorMode() ? keyNamesMinor[displayKey] : keyNamesMajor[displayKey];
    const suffix = isMinorMode() ? ' min' : ' maj';
    return name + suffix;
  }

  function keyNameHtml(key) {
    const value = keyName(key);
    const match = /^([A-G](?:[b#\u266D\u266F])?)(.*)$/.exec(value);
    if (!match) {
      return `<span class="display-key-note">${escapeHtml(value)}</span>`;
    }
    const noteMatch = /^([A-G])([b#\u266D\u266F]?)$/.exec(match[1] || '');
    const letter = noteMatch?.[1] || match[1] || '';
    const accidental = noteMatch?.[2] || '';
    const suffix = match[2] || '';
    const safeSuffix = suffix
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
    const accidentalKind = accidental === '#' || accidental === '\u266F' ? 'sharp' : 'flat';
    const accidentalGlyph = accidentalKind === 'sharp' ? '\u266f' : '\u266d';
    return [
      '<span class="display-key-note">',
      `<span class="display-key-letter">${escapeHtml(letter)}</span>`,
      accidental
        ? `<span class="display-key-accidental display-key-accidental-${accidentalKind}" aria-hidden="true">${accidentalGlyph}</span>`
        : '',
      '</span>',
      safeSuffix ? `<span class="display-key-suffix">${safeSuffix}</span>` : ''
    ].join('');
  }

  function renderPickerKeyHtml(value) {
    const match = /^([A-G])([b#\u266D\u266F]?)$/.exec(String(value || ''));
    if (!match) {
      return `<span class="picker-key-note">${escapeHtml(value)}</span>`;
    }
    const [, letter, accidental = ''] = match;
    return [
      '<span class="picker-key-note">',
      `<span class="picker-key-letter">${escapeHtml(letter)}</span>`,
      accidental
        ? `<span class="picker-key-accidental picker-key-accidental-${accidental === '#' || accidental === '\u266F' ? 'sharp' : 'flat'}" aria-hidden="true">${accidental === '#' || accidental === '\u266F' ? '\u266f' : '\u266d'}</span>`
        : '',
      '</span>'
    ].join('');
  }

  function degreeRootName(keyIndex, roman, semitoneOffset, isMinor) {
    const names = isMinor ? keyNamesMinor : keyNamesMajor;
    const keyLetter = names[keyIndex][0];
    const keyLetterIdx = letters.indexOf(keyLetter);
    const degIdx = degreeIndices[roman];
    const degLetterIdx = (keyLetterIdx + degIdx) % 7;
    const degLetter = letters[degLetterIdx];
    const expectedSemi = (keyIndex + semitoneOffset + 12) % 12;
    let accidental = (expectedSemi - naturalSemitones[degLetterIdx] + 12) % 12;
    if (accidental > 6) accidental -= 12;

    if (accidental === 0) return degLetter;
    if (accidental === 1) return degLetter + '\u266F';
    if (accidental === -1) return degLetter + '\u266D';
    return names[expectedSemi] || degLetter;
  }

  function getChordSymbolRenderOptions() {
    return {
      useMajorTriangleSymbol: getUseMajorTriangleSymbol() !== false,
      useHalfDiminishedSymbol: getUseHalfDiminishedSymbol() !== false,
      useDiminishedSymbol: getUseDiminishedSymbol() !== false
    };
  }

  function getDisplayedBassName(key, chord, isMinor) {
    if (!chord || (chord.bassSemitones ?? chord.semitones) === chord.semitones) return null;
    return normalizeDisplayedRootName(
      degreeRootName(transposeDisplayPitchClass(key), chord.roman, chord.bassSemitones, isMinor)
    );
  }

  function chordSymbol(key, chord, isMinorOverride = null, nextChord = null) {
    if (chord?.inputType === 'one-chord') {
      const rootName = normalizeDisplayedRootName(keyNamesMajor[transposeDisplayPitchClass(key)]);
      return rootName + getDisplayedQuality(chord, false, nextChord);
    }
    const isMinor = typeof isMinorOverride === 'boolean' ? isMinorOverride : isMinorMode();
    const rootName = normalizeDisplayedRootName(
      degreeRootName(transposeDisplayPitchClass(key), chord.roman, chord.semitones, isMinor)
    );
    const quality = getDisplayedQuality(chord, isMinor, nextChord);
    const bassName = getDisplayedBassName(key, chord, isMinor);
    return rootName + quality + (bassName ? `/${bassName}` : '');
  }

  function chordSymbolHtml(key, chord, isMinorOverride = null, nextChord = null) {
    if (chord?.inputType === 'one-chord') {
      const rootName = normalizeDisplayedRootName(keyNamesMajor[transposeDisplayPitchClass(key)]);
      return renderChordSymbolHtml(rootName, getDisplayedQuality(chord, false, nextChord), null, getChordSymbolRenderOptions());
    }
    const isMinor = typeof isMinorOverride === 'boolean' ? isMinorOverride : isMinorMode();
    const rootName = normalizeDisplayedRootName(
      degreeRootName(transposeDisplayPitchClass(key), chord.roman, chord.semitones, isMinor)
    );
    const quality = getDisplayedQuality(chord, isMinor, nextChord);
    const bassName = getDisplayedBassName(key, chord, isMinor);
    return renderChordSymbolHtml(rootName, quality, bassName, getChordSymbolRenderOptions());
  }

  return {
    keyName,
    keyNameHtml,
    renderPickerKeyHtml,
    degreeRootName,
    chordSymbol,
    chordSymbolHtml,
    getChordSymbolRenderOptions
  };
}

export function createDrillPreviewTimingHelpers({
  getChordsPerBar = () => 1,
  getSecondsPerBeat = () => 0.5,
  getNextPreviewLeadSeconds = () => 0,
  getCurrentChordIdx = () => 0,
  getCurrentBeat = () => 0,
  getChordCount = () => 0
} = {}) {
  function getRemainingBeatsUntilNextProgression(
    chordIndex = getCurrentChordIdx(),
    beatInMeasure = getCurrentBeat(),
    chordCount = getChordCount()
  ) {
    if (!Number.isFinite(chordCount) || chordCount <= 0) return 0;
    const chordsPerMeasure = getChordsPerBar();
    const totalMeasures = chordCount / chordsPerMeasure;
    const currentMeasure = Math.floor(chordIndex / chordsPerMeasure);
    const elapsedBeats = currentMeasure * 4 + beatInMeasure;
    return Math.max(0, totalMeasures * 4 - elapsedBeats);
  }

  function shouldShowNextPreview(
    currentKeyValue,
    upcomingKeyValue,
    remainingBeats = getRemainingBeatsUntilNextProgression()
  ) {
    if (upcomingKeyValue === null || upcomingKeyValue === currentKeyValue) return false;
    return remainingBeats * getSecondsPerBeat() <= getNextPreviewLeadSeconds();
  }

  return {
    getRemainingBeatsUntilNextProgression,
    shouldShowNextPreview
  };
}

export function createDrillHarmonyLayoutHelpers({
  requestAnimationFrameImpl = (callback) => callback(),
  getDisplayElement = () => null,
  getChordDisplayElement = () => null,
  getNextChordDisplayElement = () => null,
  getBaseChordDisplaySize = () => 5,
  isCurrentHarmonyHidden = () => false
} = {}) {
  function applyDisplaySideLayout() {
    const display = getDisplayElement();
    if (!display) return;
    display.classList.remove('alternate-display-sides', 'display-current-right');
  }

  function fitChordDisplay(element, baseRem) {
    if (!element) return;
    const symbol = element.querySelector('.chord-symbol');

    element.style.fontSize = `${baseRem}rem`;
    if (symbol) {
      symbol.style.transform = '';
      symbol.style.transformOrigin = 'center center';
    } else {
      element.style.transform = '';
      element.style.transformOrigin = 'center center';
    }
    if (!element.textContent?.trim()) return;

    const parentWidth = element.parentElement
      ? (isCurrentHarmonyHidden()
          ? element.parentElement.clientWidth - 10
          : element.parentElement.clientWidth / 2 - 10)
      : element.clientWidth;
    const textWidth = element.scrollWidth;

    if (textWidth > parentWidth && parentWidth > 0) {
      const scale = parentWidth / textWidth;
      if (symbol) {
        symbol.style.transform = `scale(${scale.toFixed(4)})`;
      } else {
        element.style.transform = `scale(${scale.toFixed(4)})`;
      }
    }
  }

  function refreshChordDisplayLayout(element, baseRem) {
    fitChordDisplay(element, baseRem);
  }

  function fitHarmonyDisplay() {
    requestAnimationFrameImpl(() => {
      const baseRem = getBaseChordDisplaySize();
      refreshChordDisplayLayout(getChordDisplayElement(), baseRem);
      refreshChordDisplayLayout(getNextChordDisplayElement(), baseRem);
    });
  }

  return {
    applyDisplaySideLayout,
    fitChordDisplay,
    refreshChordDisplayLayout,
    fitHarmonyDisplay
  };
}

export function applyDrillCurrentHarmonyVisibility({
  displayElement,
  currentHarmonyHidden
} = {}) {
  displayElement?.classList.toggle('display-hide-current', currentHarmonyHidden === true);
}

export function applyDrillDisplayMode({
  displayElement,
  mode,
  applyDisplaySideLayout,
  applyCurrentHarmonyVisibility,
  fitHarmonyDisplay
} = {}) {
  if (!displayElement) return;
  displayElement.classList.remove('display-show-both', 'display-chords-only', 'display-key-only');
  if (mode === 'chords-only') {
    displayElement.classList.add('display-chords-only');
  } else if (mode === 'key-only') {
    displayElement.classList.add('display-key-only');
  } else {
    displayElement.classList.add('display-show-both');
  }
  applyDisplaySideLayout?.();
  applyCurrentHarmonyVisibility?.();
  fitHarmonyDisplay?.();
}

export function updateDrillKeyPickerLabels({
  keyCheckboxes,
  updateKeyCheckboxVisualState,
  syncSelectedKeysSummary
} = {}) {
  const labels = keyCheckboxes?.querySelectorAll('.key-checkbox-label') || [];
  labels.forEach((label, index) => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    updateKeyCheckboxVisualState?.(label, checkbox, index);
  });
  syncSelectedKeysSummary?.();
}

export function refreshDrillDisplayedHarmony({
  isPlaying,
  isIntro,
  currentKey,
  nextKeyValue,
  currentChordIdx,
  paddedChords = [],
  nextRawChords = [],
  getRemainingBeatsUntilNextProgression,
  shouldShowNextPreview,
  keyNameHtml,
  chordSymbolHtml,
  showNextCol,
  hideNextCol,
  keyDisplay,
  chordDisplay,
  nextKeyDisplay,
  nextChordDisplay,
  applyDisplaySideLayout,
  applyCurrentHarmonyVisibility,
  fitHarmonyDisplay
} = {}) {
  if (!isPlaying) return;
  applyDisplaySideLayout?.();
  applyCurrentHarmonyVisibility?.();

  if (isIntro) {
    if (keyDisplay) keyDisplay.textContent = '';
    if (chordDisplay) chordDisplay.innerHTML = '';
    const firstChord = paddedChords[0];
    showNextCol?.();
    if (nextKeyDisplay) nextKeyDisplay.innerHTML = keyNameHtml?.(currentKey) || '';
    if (nextChordDisplay) {
      nextChordDisplay.innerHTML = firstChord
        ? (chordSymbolHtml?.(currentKey, firstChord, null, paddedChords[1] || null) || '')
        : '';
    }
    fitHarmonyDisplay?.();
    return;
  }

  const chord = paddedChords[currentChordIdx] || paddedChords[paddedChords.length - 1];
  if (!chord) return;
  const followingChord = paddedChords[currentChordIdx + 1] || null;

  if (keyDisplay) keyDisplay.innerHTML = keyNameHtml?.(currentKey) || '';
  if (chordDisplay) {
    chordDisplay.innerHTML = chordSymbolHtml?.(currentKey, chord, null, followingChord) || '';
  }
  const remainingBeats = getRemainingBeatsUntilNextProgression?.();

  if (shouldShowNextPreview?.(currentKey, nextKeyValue, remainingBeats)) {
    showNextCol?.();
    const nextFirstChord = nextRawChords[0] || null;
    if (nextKeyDisplay) nextKeyDisplay.innerHTML = keyNameHtml?.(nextKeyValue) || '';
    if (nextChordDisplay) {
      nextChordDisplay.innerHTML = nextFirstChord
        ? (chordSymbolHtml?.(nextKeyValue, nextFirstChord, null, nextRawChords[1] || null) || '')
        : '';
    }
  } else {
    hideNextCol?.();
  }
  fitHarmonyDisplay?.();
}
