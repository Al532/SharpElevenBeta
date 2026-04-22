export function applyDrillBeatIndicatorVisibility({
  beatIndicator,
  showBeatIndicatorEnabled
} = {}) {
  beatIndicator?.classList.toggle('hidden', showBeatIndicatorEnabled === false);
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
