(function applyStoredSharpElevenTheme(globalScope) {
  var storageKey = 'sharp-eleven-theme';
  var defaultPalette = 'classic-paper';
  var legacyPaletteNames = { current: defaultPalette, iReal: 'blue-note' };
  var availablePalettes = { 'classic-paper': true, 'blue-note': true };
  var storedPalette;
  var paletteName;

  try {
    storedPalette = globalScope.localStorage.getItem(storageKey);
  } catch (error) {
    storedPalette = null;
  }

  paletteName = legacyPaletteNames[storedPalette] || storedPalette || defaultPalette;
  if (!availablePalettes[paletteName]) {
    paletteName = defaultPalette;
  }

  document.documentElement.dataset.theme = paletteName;
})(window);
