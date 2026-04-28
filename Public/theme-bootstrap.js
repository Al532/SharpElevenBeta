(function applyStoredSharpElevenTheme(globalScope) {
  var storageKey = 'sharp-eleven-theme';
  var defaultPalette = 'classic-paper';
  var availablePalettes = { 'classic-paper': true, 'blue-note': true, 'dark-jazz': true };
  var storedPalette;
  var paletteName;

  try {
    storedPalette = globalScope.localStorage.getItem(storageKey);
  } catch (error) {
    storedPalette = null;
  }

  paletteName = storedPalette || defaultPalette;
  if (!availablePalettes[paletteName]) {
    paletteName = defaultPalette;
  }

  document.documentElement.dataset.theme = paletteName;
})(window);
