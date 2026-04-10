export function createProgressionManager({ dom, state, constants, helpers }) {
  const { CUSTOM_PATTERN_OPTION_VALUE } = constants;
  const {
    applyPatternModeAvailability,
    clearProgressionEditingState,
    getCurrentPatternMode,
    getCurrentPatternName,
    getDefaultProgressionsFingerprint,
    getProgressionEntry,
    getProgressionLabel,
    getSelectedProgressionMode,
    getSelectedProgressionName,
    getSelectedProgressionPattern,
    hasSelectedProgression,
    hasStandaloneCustomDraft,
    isEditingProgression,
    normalizePatternMode,
    normalizePatternString,
    normalizeProgressionEntry,
    normalizeProgressionsMap,
    resetStandaloneCustomDraft,
    saveSettings,
    setEditorPatternMode,
    setPatternSelectValue,
    syncCustomPatternUI,
    syncPatternSelectionFromInput,
    trackEvent,
    trackProgressionEvent,
    validateCustomPattern
  } = helpers;

  function getProgressionNames() {
    return Object.keys(state.progressions);
  }

  function scheduleProgressionMutation(work) {
    window.setTimeout(work, 0);
  }

  function rebuildProgressionsFromNames(names) {
    state.progressions = Object.fromEntries(
      names
        .filter(name => Object.prototype.hasOwnProperty.call(state.progressions, name))
        .map(name => [name, state.progressions[name]])
    );
  }

  function clearProgressionManagerDropMarkers() {
    dom.progressionManagerList?.querySelectorAll('.progression-manager-item').forEach(item => {
      item.classList.remove('drop-before', 'drop-after');
    });
  }

  function setProgressionFeedback(message, isError = false, action = null) {
    if (!dom.progressionFeedback) return;
    dom.progressionFeedback.textContent = '';
    const actions = Array.isArray(action)
      ? action.filter(entry => entry?.label && typeof entry.onClick === 'function')
      : (action?.label && typeof action.onClick === 'function' ? [action] : []);
    if (message) {
      const text = document.createElement('span');
      text.textContent = message;
      dom.progressionFeedback.appendChild(text);
    }
    for (const entry of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'progression-feedback-action';
      button.textContent = entry.label;
      button.addEventListener('click', entry.onClick, { once: true });
      dom.progressionFeedback.appendChild(button);
    }
    dom.progressionFeedback.classList.toggle('error-text', Boolean(isError && message));
  }

  function renderProgressionManagerList() {
    if (!dom.progressionManagerList) return;
    dom.progressionManagerList.innerHTML = '';

    const progressionNames = getProgressionNames();
    if (progressionNames.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hint';
      empty.textContent = 'No progressions saved.';
      dom.progressionManagerList.appendChild(empty);
      return;
    }

    for (const name of progressionNames) {
      const item = document.createElement('div');
      item.className = 'progression-manager-item';
      item.draggable = true;
      item.dataset.name = name;
      if (dom.patternSelect.value === name) {
        item.classList.add('is-selected');
      }

      item.addEventListener('dragstart', () => {
        state.draggedProgressionName = name;
        item.classList.add('is-dragging');
      });
      item.addEventListener('dragend', () => {
        state.draggedProgressionName = '';
        item.classList.remove('is-dragging');
        clearProgressionManagerDropMarkers();
      });
      item.addEventListener('dragover', event => {
        event.preventDefault();
        if (!state.draggedProgressionName || state.draggedProgressionName === name) return;
        clearProgressionManagerDropMarkers();
        const bounds = item.getBoundingClientRect();
        const insertAfter = event.clientY - bounds.top > bounds.height / 2;
        item.classList.add(insertAfter ? 'drop-after' : 'drop-before');
      });
      item.addEventListener('dragleave', () => {
        item.classList.remove('drop-before', 'drop-after');
      });
      item.addEventListener('drop', event => {
        event.preventDefault();
        if (!state.draggedProgressionName || state.draggedProgressionName === name) return;
        const names = getProgressionNames().filter(entry => entry !== state.draggedProgressionName);
        const targetIndex = names.indexOf(name);
        const bounds = item.getBoundingClientRect();
        const insertAfter = event.clientY - bounds.top > bounds.height / 2;
        names.splice(targetIndex + (insertAfter ? 1 : 0), 0, state.draggedProgressionName);
        rebuildProgressionsFromNames(names);
        renderProgressionOptions(dom.patternSelect.value);
        renderProgressionManagerList();
        saveSettings();
      });

      const handle = document.createElement('span');
      handle.className = 'progression-manager-handle';
      handle.textContent = '::';

      const label = document.createElement('div');
      label.className = 'progression-manager-item-name';
      label.textContent = getProgressionLabel(name);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'progression-manager-item-delete';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        const itemElement = deleteButton.closest('.progression-manager-item');
        deleteProgressionInline(name, itemElement);
      });

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'progression-manager-item-edit';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => {
        dom.patternSelect.value = name;
        syncCustomPatternUI();
        editSelectedProgression();
        dom.customPattern.focus();
      });

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'progression-manager-item-copy';
      copyButton.textContent = 'Copy';
      copyButton.addEventListener('click', () => {
        duplicateProgression(name);
      });

      const actions = document.createElement('div');
      actions.className = 'progression-manager-item-actions';
      actions.appendChild(editButton);
      actions.appendChild(copyButton);
      actions.appendChild(deleteButton);

      item.appendChild(handle);
      item.appendChild(label);
      item.appendChild(actions);
      dom.progressionManagerList.appendChild(item);
    }
  }

  function syncProgressionManagerPanel(skipListRender = false) {
    if (!dom.progressionManagerPanel) return;
    const shouldShow = state.isManagingProgressions;
    dom.progressionManagerPanel.classList.toggle('hidden', !shouldShow);
    if (shouldShow && !skipListRender && !state.suppressListRender) {
      renderProgressionManagerList();
    }
  }

  function renderProgressionOptions(selectedValue = dom.patternSelect.value) {
    if (!dom.patternSelect) return;

    dom.patternSelect.innerHTML = '';

    for (const name of Object.keys(state.progressions)) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = getProgressionLabel(name);
      opt.dataset.patternMode = state.progressions[name].mode;
      dom.patternSelect.appendChild(opt);
    }

    const customOption = document.createElement('option');
    customOption.value = CUSTOM_PATTERN_OPTION_VALUE;
    customOption.textContent = 'Custom progression...';
    dom.patternSelect.appendChild(customOption);

    if (Object.prototype.hasOwnProperty.call(state.progressions, selectedValue)) {
      dom.patternSelect.value = selectedValue;
    } else if (selectedValue === CUSTOM_PATTERN_OPTION_VALUE) {
      dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
    } else {
      dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
    }
    syncCustomPatternUI();
    syncProgressionManagerState();
  }

  function syncProgressionManagerState({ skipListRender = false } = {}) {
    const customSelected = dom.patternSelect.value === CUSTOM_PATTERN_OPTION_VALUE;
    if (dom.saveProgression) {
      dom.saveProgression.classList.toggle('hidden', !customSelected);
      dom.saveProgression.textContent = 'Save';
    }
    if (dom.cancelProgressionEdit) {
      dom.cancelProgressionEdit.classList.toggle('hidden', !(isEditingProgression() || state.isCreatingProgression));
    }
    if (dom.manageProgressions) {
      dom.manageProgressions.classList.toggle('hidden', customSelected || state.isManagingProgressions);
    }
    if (dom.restoreDefaultProgressions) {
      dom.restoreDefaultProgressions.classList.toggle('hidden', false);
    }
    if (dom.clearAllProgressions) {
      dom.clearAllProgressions.classList.toggle('hidden', false);
    }
    syncProgressionManagerPanel(skipListRender);
  }

  function deleteProgressionByName(name, {
    requireConfirmation = false,
    confirmationMessage = `Delete progression "${name}"?`,
    successMessage = `Progression deleted: ${name}`,
    offerUndo = false
  } = {}) {
    if (!Object.prototype.hasOwnProperty.call(state.progressions, name)) {
      setProgressionFeedback('Progression not found.', true);
      return false;
    }
    if (requireConfirmation && !window.confirm(confirmationMessage)) {
      return false;
    }

    if (state.editingProgressionName === name) {
      clearProgressionEditingState();
    }
    const progressionNamesBeforeDeletion = getProgressionNames();
    const deletedEntry = state.progressions[name];
    const deletedIndex = progressionNamesBeforeDeletion.indexOf(name);
    const wasSelected = dom.patternSelect.value === name;
    const fallbackSelection = wasSelected
      ? progressionNamesBeforeDeletion[deletedIndex + 1] || progressionNamesBeforeDeletion[deletedIndex - 1] || ''
      : dom.patternSelect.value;
    delete state.progressions[name];
    renderProgressionOptions(fallbackSelection);
    if (Object.prototype.hasOwnProperty.call(state.progressions, fallbackSelection)) {
      dom.patternSelect.value = fallbackSelection;
      dom.patternName.value = getSelectedProgressionName();
      dom.customPattern.value = getSelectedProgressionPattern();
      setEditorPatternMode(getSelectedProgressionMode());
      syncCustomPatternUI();
    } else {
      syncPatternSelectionFromInput();
    }
    syncProgressionManagerState();
    syncProgressionManagerPanel();
    validateCustomPattern();
    applyPatternModeAvailability();
    if (offerUndo) {
      state.pendingProgressionDeletion = {
        name,
        entry: deletedEntry,
        index: deletedIndex,
        wasSelected
      };
      setProgressionFeedback(successMessage, false, {
        label: 'Undo',
        onClick: undoProgressionDeletion
      });
    } else {
      state.pendingProgressionDeletion = null;
      setProgressionFeedback(successMessage);
    }
    saveSettings();
    return true;
  }

  function deleteProgressionInline(name, itemElement) {
    const entry = state.progressions[name];
    if (!entry) return;

    const progressionNamesBeforeDeletion = getProgressionNames();
    const deletedIndex = progressionNamesBeforeDeletion.indexOf(name);
    const wasSelected = dom.patternSelect.value === name;
    const fallbackSelection = wasSelected
      ? progressionNamesBeforeDeletion[deletedIndex + 1] || progressionNamesBeforeDeletion[deletedIndex - 1] || ''
      : dom.patternSelect.value;

    if (state.editingProgressionName === name) {
      clearProgressionEditingState();
    }
    const deletedEntry = { ...entry };
    delete state.progressions[name];
    state.suppressListRender = true;
    renderProgressionOptions(fallbackSelection);
    if (Object.prototype.hasOwnProperty.call(state.progressions, fallbackSelection)) {
      dom.patternSelect.value = fallbackSelection;
      dom.patternName.value = getSelectedProgressionName();
      dom.customPattern.value = getSelectedProgressionPattern();
      setEditorPatternMode(getSelectedProgressionMode());
      syncCustomPatternUI();
    } else {
      syncPatternSelectionFromInput();
    }
    validateCustomPattern();
    applyPatternModeAvailability();
    saveSettings();
    state.suppressListRender = false;

    dom.progressionManagerList?.querySelectorAll('.progression-manager-undo-placeholder').forEach(el => el.remove());

    const placeholder = document.createElement('div');
    placeholder.className = 'progression-manager-undo-placeholder';
    const message = document.createElement('span');
    message.className = 'progression-manager-undo-message';
    message.textContent = `Deleted progression: ${getProgressionLabel(name) || name}`;
    const undoButton = document.createElement('button');
    undoButton.type = 'button';
    undoButton.className = 'progression-manager-undo-button';
    undoButton.textContent = 'Undo';
    undoButton.addEventListener('click', () => {
      state.progressions[name] = normalizeProgressionEntry(name, deletedEntry);
      const names = getProgressionNames().filter(n => n !== name);
      names.splice(Math.max(0, Math.min(deletedIndex, names.length)), 0, name);
      rebuildProgressionsFromNames(names);
      renderProgressionOptions(wasSelected ? name : dom.patternSelect.value);
      if (wasSelected) {
        dom.patternSelect.value = name;
        dom.patternName.value = getSelectedProgressionName();
        dom.customPattern.value = getSelectedProgressionPattern();
        setEditorPatternMode(getSelectedProgressionMode());
        syncCustomPatternUI();
      }
      syncProgressionManagerState();
      renderProgressionManagerList();
      validateCustomPattern();
      applyPatternModeAvailability();
      saveSettings();
      setProgressionFeedback(`Restored progression: ${getProgressionLabel(name) || name}`);
    }, { once: true });
    placeholder.appendChild(message);
    placeholder.appendChild(undoButton);
    itemElement.replaceWith(placeholder);
  }

  function undoProgressionDeletion() {
    if (!state.pendingProgressionDeletion) return;

    const { name, entry, index, wasSelected } = state.pendingProgressionDeletion;
    state.pendingProgressionDeletion = null;
    state.progressions[name] = normalizeProgressionEntry(name, entry);

    const names = getProgressionNames().filter(progressionName => progressionName !== name);
    names.splice(Math.max(0, Math.min(index, names.length)), 0, name);
    rebuildProgressionsFromNames(names);

    renderProgressionOptions(wasSelected ? name : dom.patternSelect.value);
    if (wasSelected) {
      dom.patternSelect.value = name;
      dom.patternName.value = getSelectedProgressionName();
      dom.customPattern.value = getSelectedProgressionPattern();
      setEditorPatternMode(getSelectedProgressionMode());
      syncCustomPatternUI();
    } else {
      syncPatternSelectionFromInput();
    }
    syncProgressionManagerState();
    syncProgressionManagerPanel();
    validateCustomPattern();
    applyPatternModeAvailability();
    setProgressionFeedback(`Restored progression: ${name}`);
    saveSettings();
  }

  function saveCurrentProgression() {
    const name = getCurrentPatternName();
    const pattern = normalizePatternString(dom.customPattern.value);
    const mode = getCurrentPatternMode();
    const progressionNameToReplace = state.editingProgressionName;

    if (!pattern) {
      setProgressionFeedback('Enter a progression before saving.', true);
      return;
    }
    if (!validateCustomPattern()) {
      setProgressionFeedback('Fix the progression syntax before saving.', true);
      return;
    }

    if (progressionNameToReplace && progressionNameToReplace !== pattern) {
      delete state.progressions[progressionNameToReplace];
    }
    state.progressions[pattern] = helpers.createProgressionEntry(pattern, mode, name);
    renderProgressionOptions(pattern);
    dom.patternName.value = name;
    dom.customPattern.value = pattern;
    setEditorPatternMode(mode);
    resetStandaloneCustomDraft();
    clearProgressionEditingState();
    syncPatternSelectionFromInput();
    syncProgressionManagerState();
    applyPatternModeAvailability();
    setProgressionFeedback(
      progressionNameToReplace
        ? `Progression updated: ${getProgressionLabel(pattern)}`
        : `Progression saved: ${getProgressionLabel(pattern)}`
    );
    saveSettings();
    trackProgressionEvent(progressionNameToReplace ? 'preset_updated' : 'preset_saved');
  }

  function editSelectedProgression() {
    if (!hasSelectedProgression()) {
      setProgressionFeedback('Select a progression to edit it.', true);
      return;
    }

    const selectedName = dom.patternSelect.value;
    const selectedEntry = getProgressionEntry();
    if (!selectedEntry) {
      setProgressionFeedback('Select a progression to edit it.', true);
      return;
    }

    state.progressionSelectionBeforeEditing = selectedName;
    state.isCreatingProgression = false;
    state.editingProgressionName = selectedName;
    state.editingProgressionSnapshot = {
      name: selectedName,
      label: selectedEntry.name,
      pattern: selectedEntry.pattern,
      mode: selectedEntry.mode
    };
    dom.patternName.value = selectedEntry.name || '';
    dom.customPattern.value = selectedEntry.pattern;
    setEditorPatternMode(selectedEntry.mode);
    dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
    syncCustomPatternUI();
    syncProgressionManagerState();
    validateCustomPattern();
    applyPatternModeAvailability();
    setProgressionFeedback(`Editing progression: ${getProgressionLabel(selectedName)}`);
  }

  function cancelProgressionEdit() {
    if (!isEditingProgression() && !state.isCreatingProgression) {
      clearProgressionEditingState();
      syncProgressionManagerState();
      saveSettings();
      return;
    }

    if (!isEditingProgression() || !state.editingProgressionSnapshot) {
      const previousSelection = state.progressionSelectionBeforeEditing;
      clearProgressionEditingState();
      if (
        previousSelection
        && previousSelection !== CUSTOM_PATTERN_OPTION_VALUE
        && Object.prototype.hasOwnProperty.call(state.progressions, previousSelection)
      ) {
        dom.patternSelect.value = previousSelection;
        const previousEntry = getProgressionEntry(previousSelection);
        if (previousEntry) {
          dom.patternName.value = previousEntry.name || '';
          dom.customPattern.value = previousEntry.pattern;
          setEditorPatternMode(previousEntry.mode);
        }
      } else {
        dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
        dom.patternName.value = state.lastStandaloneCustomName || '';
        dom.customPattern.value = state.lastStandaloneCustomPattern || '';
        setEditorPatternMode(normalizePatternMode(state.lastStandaloneCustomMode));
      }
      syncCustomPatternUI();
      syncProgressionManagerState();
      validateCustomPattern();
      applyPatternModeAvailability();
      setProgressionFeedback('');
      saveSettings();
      return;
    }

    const { name, label, pattern, mode } = state.editingProgressionSnapshot;
    clearProgressionEditingState();
    dom.patternSelect.value = name;
    dom.patternName.value = label || '';
    dom.customPattern.value = pattern;
    setEditorPatternMode(mode);
    syncCustomPatternUI();
    syncProgressionManagerState();
    validateCustomPattern();
    applyPatternModeAvailability();
    setProgressionFeedback('');
    saveSettings();
  }

  function startNewProgression(previousSelection = hasSelectedProgression() ? dom.patternSelect.value : '') {
    clearProgressionEditingState();
    state.progressionSelectionBeforeEditing = previousSelection;
    state.isCreatingProgression = true;
    dom.patternSelect.value = CUSTOM_PATTERN_OPTION_VALUE;
    if (hasStandaloneCustomDraft()) {
      dom.patternName.value = state.lastStandaloneCustomName || '';
      dom.customPattern.value = state.lastStandaloneCustomPattern || '';
      setEditorPatternMode(normalizePatternMode(state.lastStandaloneCustomMode));
    } else {
      dom.patternName.value = '';
      dom.customPattern.value = '';
      setEditorPatternMode('major');
    }
    syncCustomPatternUI();
    syncProgressionManagerState();
    validateCustomPattern();
    applyPatternModeAvailability();
    setProgressionFeedback(hasStandaloneCustomDraft() ? 'Back to your draft progression.' : 'New progression.');
    dom.customPattern.focus();
  }

  function deleteSelectedProgression() {
    if (!hasSelectedProgression()) {
      setProgressionFeedback('Select a progression to delete it.', true);
      return;
    }
    deleteProgressionByName(dom.patternSelect.value, {
      offerUndo: true
    });
  }

  function duplicateProgression(name) {
    const entry = state.progressions[name];
    if (!entry) {
      setProgressionFeedback('Progression not found.', true);
      return;
    }
    const baseName = (entry.name || entry.pattern).replace(/\s*\(\d+\)$/, '');
    let copyIndex = 2;
    const existingNames = new Set(Object.values(state.progressions).map(e => e.name || e.pattern));
    while (existingNames.has(`${baseName} (${copyIndex})`)) {
      copyIndex++;
    }
    const newDisplayName = `${baseName} (${copyIndex})`;
    const newPattern = entry.pattern;
    const newEntry = helpers.createProgressionEntry(newPattern, entry.mode, newDisplayName);
    const newKey = `${newPattern}#${copyIndex}`;
    newEntry.pattern = newPattern;

    const names = getProgressionNames();
    const sourceIndex = names.indexOf(name);
    const before = names.slice(0, sourceIndex + 1);
    const after = names.slice(sourceIndex + 1);
    state.progressions[newKey] = newEntry;
    const reordered = [...before, newKey, ...after];
    state.progressions = Object.fromEntries(
      reordered
        .filter(n => Object.prototype.hasOwnProperty.call(state.progressions, n))
        .map(n => [n, state.progressions[n]])
    );
    renderProgressionOptions(dom.patternSelect.value);
    renderProgressionManagerList();
    saveSettings();
    setProgressionFeedback(`Progression copied: ${newDisplayName}`);
  }

  function restoreDefaultProgressions() {
    if (!window.confirm('Restore the default progressions? Existing progressions will be kept.')) {
      return;
    }
    scheduleProgressionMutation(() => {
      const wasManagingProgressions = state.isManagingProgressions;
      const currentSelection = dom.patternSelect.value;
      let restoredCount = 0;

      for (const [name, entry] of Object.entries(state.defaultProgressions)) {
        if (Object.prototype.hasOwnProperty.call(state.progressions, name)) continue;
        state.progressions[name] = normalizeProgressionEntry(name, entry);
        restoredCount++;
      }

      const nextSelection = Object.prototype.hasOwnProperty.call(state.progressions, currentSelection)
        ? currentSelection
        : Object.keys(state.defaultProgressions).find(name => Object.prototype.hasOwnProperty.call(state.progressions, name))
          || Object.keys(state.progressions)[0]
          || '';

      renderProgressionOptions(nextSelection);
      if (Object.prototype.hasOwnProperty.call(state.progressions, nextSelection)) {
        dom.patternSelect.value = nextSelection;
        dom.patternName.value = getSelectedProgressionName();
        dom.customPattern.value = getSelectedProgressionPattern();
        setEditorPatternMode(getSelectedProgressionMode());
        syncCustomPatternUI();
      } else {
        syncPatternSelectionFromInput();
      }
      state.isManagingProgressions = wasManagingProgressions;
      syncProgressionManagerState();
      syncProgressionManagerPanel();
      validateCustomPattern();
      applyPatternModeAvailability();

      if (restoredCount === 0) {
        setProgressionFeedback('Default progressions are already present.');
      } else {
        state.appliedDefaultProgressionsFingerprint = getDefaultProgressionsFingerprint();
        state.acknowledgedDefaultProgressionsVersion = state.defaultProgressionsVersion;
        state.shouldPromptForDefaultProgressionsUpdate = false;
        setProgressionFeedback(`Restored ${restoredCount} default progression${restoredCount > 1 ? 's' : ''}.`);
        saveSettings();
        trackEvent('default_presets_restored', {
          restored_count: restoredCount
        });
      }
    });
  }

  function clearAllProgressions() {
    if (!window.confirm('Clear all progressions? This cannot be undone.')) {
      return;
    }
    scheduleProgressionMutation(() => {
      const wasManagingProgressions = state.isManagingProgressions;
      state.progressions = {};
      clearProgressionEditingState();
      renderProgressionOptions('');
      syncPatternSelectionFromInput();
      state.isManagingProgressions = wasManagingProgressions;
      syncProgressionManagerState();
      validateCustomPattern();
      applyPatternModeAvailability();
      setProgressionFeedback('All progressions cleared.');
      saveSettings();
      trackEvent('all_presets_cleared');
    });
  }

  function toggleProgressionManager() {
    state.isManagingProgressions = !state.isManagingProgressions;
    syncProgressionManagerState();
    if (state.isManagingProgressions) {
      trackEvent('preset_manager_opened', {
        preset_count: getProgressionNames().length
      });
    }
  }

  function refreshProgressionUIAfterChange(preferredSelection = dom.patternSelect.value) {
    renderProgressionOptions(preferredSelection);
    if (Object.prototype.hasOwnProperty.call(state.progressions, preferredSelection)) {
      dom.patternSelect.value = preferredSelection;
      dom.patternName.value = getSelectedProgressionName();
      dom.customPattern.value = getSelectedProgressionPattern();
      setEditorPatternMode(getSelectedProgressionMode());
      syncCustomPatternUI();
    } else {
      syncPatternSelectionFromInput();
    }
    syncProgressionManagerState();
    syncProgressionManagerPanel();
    validateCustomPattern();
    applyPatternModeAvailability();
    state.lastPatternSelectValue = dom.patternSelect.value;
  }

  function setProgressionUpdateModalVisibility(isVisible) {
    dom.progressionUpdateModal?.classList.toggle('hidden', !isVisible);
    dom.progressionUpdateModal?.setAttribute('aria-hidden', String(!isVisible));
  }

  function markDefaultProgressionsPromptHandled() {
    const fingerprint = getDefaultProgressionsFingerprint();
    state.appliedDefaultProgressionsFingerprint = fingerprint;
    state.acknowledgedDefaultProgressionsVersion = state.defaultProgressionsVersion;
    state.shouldPromptForDefaultProgressionsUpdate = false;
    setProgressionUpdateModalVisibility(false);
    saveSettings();
  }

  function replaceProgressionsWithDefaultList() {
    const currentSelection = dom.patternSelect.value;
    state.progressions = normalizeProgressionsMap(state.defaultProgressions);
    const nextSelection = Object.prototype.hasOwnProperty.call(state.progressions, currentSelection)
      ? currentSelection
      : Object.keys(state.defaultProgressions)[0] || Object.keys(state.progressions)[0] || '';
    refreshProgressionUIAfterChange(nextSelection);
    markDefaultProgressionsPromptHandled();
    setProgressionFeedback('Default progressions replaced with the updated list.');
  }

  function mergeUpdatedDefaultProgressions() {
    const currentSelection = dom.patternSelect.value;
    let addedCount = 0;
    let updatedCount = 0;

    for (const [name, entry] of Object.entries(state.defaultProgressions)) {
      const normalizedEntry = normalizeProgressionEntry(name, entry);
      if (Object.prototype.hasOwnProperty.call(state.progressions, name)) {
        const previousEntry = state.progressions[name];
        const changed = previousEntry.name !== normalizedEntry.name || previousEntry.mode !== normalizedEntry.mode;
        state.progressions[name] = normalizedEntry;
        if (changed) updatedCount++;
        continue;
      }
      state.progressions[name] = normalizedEntry;
      addedCount++;
    }

    refreshProgressionUIAfterChange(currentSelection);
    markDefaultProgressionsPromptHandled();
    setProgressionFeedback(
      `Updated default progressions: ${addedCount} added, ${updatedCount} renamed/updated.`
    );
  }

  function promptForUpdatedDefaultProgressions() {
    if (dom.progressionUpdateMessage) {
      dom.progressionUpdateMessage.textContent = 'The default progression list was updated. Replace your full list, or only add the new entries?';
    }
    setProgressionUpdateModalVisibility(true);
  }

  return {
    cancelProgressionEdit,
    clearAllProgressions,
    clearProgressionManagerDropMarkers,
    deleteProgressionByName,
    deleteProgressionInline,
    deleteSelectedProgression,
    duplicateProgression,
    editSelectedProgression,
    getProgressionNames,
    markDefaultProgressionsPromptHandled,
    mergeUpdatedDefaultProgressions,
    promptForUpdatedDefaultProgressions,
    refreshProgressionUIAfterChange,
    renderProgressionManagerList,
    renderProgressionOptions,
    replaceProgressionsWithDefaultList,
    restoreDefaultProgressions,
    saveCurrentProgression,
    setProgressionFeedback,
    setProgressionUpdateModalVisibility,
    startNewProgression,
    syncProgressionManagerPanel,
    syncProgressionManagerState,
    toggleProgressionManager,
    undoProgressionDeletion
  };
}
