(function initializeSharpElevenTheme(globalScope) {
  var storageKey = 'sharp-eleven-theme';
  var defaultPalette = 'current';
  var paletteNames = ['current', 'light', 'contrast'];
  var root = document.documentElement;

  function isPaletteName(value) {
    return paletteNames.indexOf(value) !== -1;
  }

  function readStoredPalette() {
    try {
      var storedPalette = globalScope.localStorage.getItem(storageKey);
      return isPaletteName(storedPalette) ? storedPalette : defaultPalette;
    } catch (error) {
      return defaultPalette;
    }
  }

  function applyPalette(paletteName) {
    root.dataset.theme = paletteName;
    return paletteName;
  }

  globalScope.SharpElevenTheme = {
    listPalettes: function listPalettes() {
      return paletteNames.slice();
    },
    getPalette: function getPalette() {
      return isPaletteName(root.dataset.theme) ? root.dataset.theme : defaultPalette;
    },
    setPalette: function setPalette(paletteName) {
      if (!isPaletteName(paletteName)) {
        throw new Error('Unknown Sharp Eleven palette: ' + String(paletteName));
      }

      try {
        globalScope.localStorage.setItem(storageKey, paletteName);
      } catch (error) {
        // Persistence is optional for static utility pages.
      }

      return applyPalette(paletteName);
    },
    resetPalette: function resetPalette() {
      try {
        globalScope.localStorage.removeItem(storageKey);
      } catch (error) {
        // Palette switching still works for the current page.
      }

      return applyPalette(defaultPalette);
    }
  };

  applyPalette(readStoredPalette());
})(window);
