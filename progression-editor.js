import { getProgressionDisplayLabel } from './progression-library.js';

export function createProgressionEditor({ dom, state, constants, helpers }) {
  const {
    CUSTOM_PATTERN_OPTION_VALUE,
    PATTERN_MODE_BOTH,
    PATTERN_MODE_MAJOR,
    PATTERN_MODE_MINOR,
    ONE_CHORD_DEFAULT_QUALITIES,
    ONE_CHORD_DOMINANT_QUALITIES
  } = constants;
  const {
    analyzePattern,
    chordSymbol,
    getDisplayTranspositionSemitones,
    isOneChordModeActive,
    matchesOneChordQualitySet,
    normalizePatternMode,
    normalizePatternString,
    normalizePresetName,
    parseOneChordSpec,
    refreshDisplayedHarmony,
    updateKeyPickerLabels
  } = helpers;

  function getProgressionEntry(name = dom.patternSelect.value) {
    return Object.prototype.hasOwnProperty.call(state.progressions, name) ? state.progressions[name] : null;
  }

  function hasSelectedProgression() {
    return Boolean(getProgressionEntry());
  }

  function isEditingProgression() {
    return Boolean(state.editingProgressionName);
  }

  function clearProgressionEditingState() {
    state.editingProgressionName = '';
    state.editingProgressionSnapshot = null;
    state.progressionSelectionBeforeEditing = '';
    state.isCreatingProgression = false;
  }

  function closeProgressionManager() {
    state.isManagingProgressions = false;
  }

  function rememberStandaloneCustomDraft() {
    if (isEditingProgression()) return;
    state.lastStandaloneCustomName = normalizePresetName(dom.patternName?.value);
    state.lastStandaloneCustomPattern = normalizePatternString(dom.customPattern.value);
    state.lastStandaloneCustomMode = normalizePatternMode(dom.patternMode?.value);
  }

  function resetStandaloneCustomDraft() {
    state.lastStandaloneCustomName = '';
    state.lastStandaloneCustomPattern = '';
    state.lastStandaloneCustomMode = PATTERN_MODE_MAJOR;
  }

  function hasStandaloneCustomDraft() {
    return Boolean(
      state.lastStandaloneCustomName
      || state.lastStandaloneCustomPattern
      || normalizePatternMode(state.lastStandaloneCustomMode) !== PATTERN_MODE_MAJOR
    );
  }

  function setEditorPatternMode(mode, { syncMajorMinor = true } = {}) {
    const normalizedMode = normalizePatternMode(mode);
    if (dom.patternMode) {
      dom.patternMode.value = normalizedMode;
    }
    if (dom.patternModeBoth) {
      dom.patternModeBoth.checked = normalizedMode === PATTERN_MODE_BOTH;
    }
    if (syncMajorMinor && normalizedMode !== PATTERN_MODE_BOTH && dom.majorMinor) {
      dom.majorMinor.checked = normalizedMode === PATTERN_MODE_MINOR;
    }
    return normalizedMode;
  }

  function setPatternSelectValue(value, { suppressChange = false } = {}) {
    if (!dom.patternSelect) return;
    state.suppressPatternSelectChange = suppressChange;
    dom.patternSelect.value = value;
    if (suppressChange) {
      queueMicrotask(() => {
        state.suppressPatternSelectChange = false;
      });
    }
  }

  function isCustomPatternSelected() {
    return dom.patternSelect.value === CUSTOM_PATTERN_OPTION_VALUE;
  }

  function getSelectedProgressionPattern() {
    return getProgressionEntry()?.pattern || '';
  }

  function getSelectedProgressionMode() {
    return getProgressionEntry()?.mode || PATTERN_MODE_MAJOR;
  }

  function getSelectedProgressionName() {
    return getProgressionEntry()?.name || '';
  }

  function getCurrentPatternMode() {
    if (hasSelectedProgression()) return getSelectedProgressionMode();
    return normalizePatternMode(dom.patternMode?.value);
  }

  function getCurrentPatternName() {
    if (hasSelectedProgression()) return getSelectedProgressionName();
    return normalizePresetName(dom.patternName?.value);
  }

  function getPatternModeLabel(mode) {
    switch (normalizePatternMode(mode)) {
      case PATTERN_MODE_MAJOR:
        return 'major';
      case PATTERN_MODE_MINOR:
        return 'minor';
      default:
        return 'major/minor';
    }
  }

  function getCurrentPatternString() {
    if (hasSelectedProgression()) return getSelectedProgressionPattern();
    return normalizePatternString(dom.customPattern.value);
  }

  function getEffectivePreviewMinorMode(patternString = getCurrentPatternString()) {
    if (isOneChordModeActive(patternString)) return false;

    const patternMode = getCurrentPatternMode();
    if (patternMode === PATTERN_MODE_MAJOR) return false;
    if (patternMode === PATTERN_MODE_MINOR) return true;
    return dom.majorMinor.checked;
  }

  function getResolvedPatternPreviewText(patternString = getCurrentPatternString()) {
    const normalizedPattern = normalizePatternString(patternString);
    if (!normalizedPattern) return 'No progression selected.';

    const oneChordSpec = parseOneChordSpec(normalizedPattern);
    if (oneChordSpec.active) {
      if (matchesOneChordQualitySet(oneChordSpec.qualities, ONE_CHORD_DEFAULT_QUALITIES)) {
        return 'One-chord mode: all chords';
      }
      if (matchesOneChordQualitySet(oneChordSpec.qualities, ONE_CHORD_DOMINANT_QUALITIES)) {
        return 'One-chord mode: all dominant chords';
      }
      return 'One-chord mode: custom chord set';
    }

    const analysis = analyzePattern(normalizedPattern);
    if (analysis.errorMessage || !analysis.chords.length) {
      return normalizedPattern;
    }

    const rawKey = analysis.basePitchClass ?? 0;
    const previewKey = ((rawKey - getDisplayTranspositionSemitones()) % 12 + 12) % 12;
    const previewIsMinor = getEffectivePreviewMinorMode(normalizedPattern);
    let previousSymbol = '';
    return analysis.chords
      .map(chord => {
        const symbol = chordSymbol(previewKey, chord, previewIsMinor);
        const nextSymbol = symbol === previousSymbol ? '%' : symbol;
        previousSymbol = symbol;
        return nextSymbol;
      })
      .join('  |  ');
  }

  function getPatternPreviewText() {
    return getResolvedPatternPreviewText(getCurrentPatternString());
  }

  function syncPatternPreview() {
    if (!dom.patternPreview) return;
    dom.patternPreview.textContent = getPatternPreviewText();
  }

  function getProgressionLabel(name) {
    return getProgressionDisplayLabel(state.progressions, name);
  }

  function syncCustomPatternUI() {
    const customSelected = isCustomPatternSelected();
    dom.patternPicker?.classList.toggle('custom-active', customSelected);
    dom.patternPickerCustom?.classList.toggle('hidden', !customSelected);
    dom.customPatternPanel?.classList.toggle('hidden', !customSelected);
    dom.patternHelp?.classList.toggle('hidden', !customSelected);
    const previewTarget = customSelected
      ? dom.patternPreviewEditAnchor
      : dom.patternPreviewDefaultAnchor;
    if (previewTarget && dom.patternPreviewRow && dom.patternPreviewRow.parentElement !== previewTarget.parentElement) {
      previewTarget.insertAdjacentElement('afterend', dom.patternPreviewRow);
    }
    if (!customSelected) {
      dom.patternError.classList.add('hidden');
    }
    syncPatternPreview();
  }

  function syncPatternSelectionFromInput() {
    const pattern = normalizePatternString(dom.customPattern.value);
    const mode = getCurrentPatternMode();
    if (isEditingProgression() || state.isCreatingProgression) {
      setPatternSelectValue(CUSTOM_PATTERN_OPTION_VALUE, { suppressChange: true });
      syncCustomPatternUI();
      return;
    }
    const matchingProgression = Object.keys(state.progressions).find(name => {
      const entry = state.progressions[name];
      return entry.pattern === pattern && entry.mode === mode;
    }) || '';
    if (matchingProgression) {
      setPatternSelectValue(matchingProgression);
      dom.patternName.value = getProgressionEntry(matchingProgression)?.name || '';
    } else {
      setPatternSelectValue(CUSTOM_PATTERN_OPTION_VALUE);
    }
    syncCustomPatternUI();
  }

  function applyPatternModeAvailability() {
    if (isOneChordModeActive()) {
      const modeChanged = dom.majorMinor.checked !== false;
      const disabledChanged = dom.majorMinor.disabled !== true;
      dom.majorMinor.disabled = true;
      dom.majorMinor.checked = false;
      if (modeChanged || disabledChanged) {
        updateKeyPickerLabels();
        state.keyPool = [];
      }
      refreshDisplayedHarmony();
      return;
    }

    const patternMode = getCurrentPatternMode();
    const allowBothModes = patternMode === PATTERN_MODE_BOTH || isCustomPatternSelected();
    const shouldBeMinor = patternMode === PATTERN_MODE_MINOR;
    const modeChanged = dom.majorMinor.checked !== shouldBeMinor;
    const disabledChanged = dom.majorMinor.disabled !== !allowBothModes;

    dom.majorMinor.disabled = !allowBothModes;
    if (!allowBothModes) {
      dom.majorMinor.checked = shouldBeMinor;
    }

    if (!allowBothModes && (modeChanged || disabledChanged)) {
      updateKeyPickerLabels();
      state.keyPool = [];
    } else if (allowBothModes && disabledChanged) {
      updateKeyPickerLabels();
    }

    refreshDisplayedHarmony();
  }

  return {
    applyPatternModeAvailability,
    clearProgressionEditingState,
    closeProgressionManager,
    getCurrentPatternMode,
    getCurrentPatternName,
    getCurrentPatternString,
    getEffectivePreviewMinorMode,
    getPatternModeLabel,
    getPatternPreviewText,
    getProgressionEntry,
    getProgressionLabel,
    getResolvedPatternPreviewText,
    getSelectedProgressionMode,
    getSelectedProgressionName,
    getSelectedProgressionPattern,
    hasSelectedProgression,
    hasStandaloneCustomDraft,
    isCustomPatternSelected,
    isEditingProgression,
    rememberStandaloneCustomDraft,
    resetStandaloneCustomDraft,
    setEditorPatternMode,
    setPatternSelectValue,
    syncCustomPatternUI,
    syncPatternPreview,
    syncPatternSelectionFromInput
  };
}
