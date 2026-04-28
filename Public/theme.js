(function initializeSharpElevenTheme(globalScope) {
  var storageKey = 'sharp-eleven-theme';
  var defaultPalette = 'classic-paper';
  var knownPalettes = [defaultPalette, 'blue-note', 'dark-jazz'];
  var themeDataSelector = /:root\s*\[[^\]]*data-theme\s*=\s*["']([^"']+)["']\]/i;
  var root = document.documentElement;
  function listThemeNamesFromStylesheets() {
    var names = knownPalettes.slice();
    var encountered = {};
    var styleSheets = Array.prototype.slice.call(document.styleSheets || []);
    var visitedSheets = [];
    var paletteIndex;
    for (paletteIndex = 0; paletteIndex < names.length; paletteIndex += 1) {
      encountered[names[paletteIndex]] = true;
    }

    function inspectStyleSheet(styleSheet, depth) {
      var currentDepth = depth || 0;
      var styleRuleIndex;
      var nestedRuleIndex;
      var selectorIndex;
      var rule;
      var rules;
      var selectorText;
      var selectorSegments;
      var selectorSegment;
      var match;
      var name;
      var nestedStyleSheet;

      if (currentDepth > 12) return;
      if (Array.prototype.indexOf.call(visitedSheets, styleSheet) !== -1) return;
      visitedSheets.push(styleSheet);

      try {
        rules = styleSheet.cssRules;
      } catch (error) {
        // StyleSheet may be unavailable from strict mode or remote sources.
        return;
      }

      for (styleRuleIndex = 0; styleRuleIndex < rules.length; styleRuleIndex += 1) {
        rule = rules[styleRuleIndex];

        if (rule.type === CSSRule.IMPORT_RULE) {
          nestedStyleSheet = rule.styleSheet;
          if (nestedStyleSheet) {
            inspectStyleSheet(nestedStyleSheet, currentDepth + 1);
          }
          continue;
        }

        if (rule.type !== CSSRule.STYLE_RULE) continue;

        selectorText = rule.selectorText || '';
        selectorSegments = selectorText.split(',');
        for (selectorIndex = 0; selectorIndex < selectorSegments.length; selectorIndex += 1) {
          selectorSegment = selectorSegments[selectorIndex].trim();
          match = selectorSegment.match(themeDataSelector);
          if (!match) continue;

          name = (match[1] || '').trim();
          if (!name) continue;

          if (!encountered[name]) {
            encountered[name] = true;
            names.push(name);
          }
        }
      }
    }

    for (nestedRuleIndex = 0; nestedRuleIndex < styleSheets.length; nestedRuleIndex += 1) {
      inspectStyleSheet(styleSheets[nestedRuleIndex], 0);
    }

    return names.sort(function sortPaletteNames(left, right) {
      if (left === defaultPalette) return -1;
      if (right === defaultPalette) return 1;
      return left.localeCompare(right);
    });
  }

  function isPaletteName(value) {
    return currentThemeNames().indexOf(value) !== -1;
  }

  function currentThemeNames() {
    return listThemeNamesFromStylesheets();
  }

  function normalizePaletteName(value) {
    if (typeof value !== 'string') return null;
    return isPaletteName(value) ? value : null;
  }

  function readStoredPalette() {
    var themeNames = currentThemeNames();
    var fallback = themeNames[0] || defaultPalette;
    try {
      var storedPalette = globalScope.localStorage.getItem(storageKey);
      return normalizePaletteName(storedPalette) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function applyPalette(paletteName) {
    root.dataset.theme = paletteName;
    return paletteName;
  }

  globalScope.SharpElevenTheme = {
    listPalettes: function listPalettes() {
      return currentThemeNames().slice();
    },
    getPalette: function getPalette() {
      var themeNames = currentThemeNames();
      var fallback = themeNames[0] || defaultPalette;
      return normalizePaletteName(root.dataset.theme) || fallback;
    },
    setPalette: function setPalette(paletteName) {
      var normalizedPaletteName = normalizePaletteName(paletteName);
      if (!normalizedPaletteName) {
        throw new Error('Unknown Sharp Eleven palette: ' + String(paletteName));
      }

      try {
        globalScope.localStorage.setItem(storageKey, normalizedPaletteName);
      } catch (error) {
        // Persistence is optional for static utility pages.
      }

      return applyPalette(normalizedPaletteName);
    },
    resetPalette: function resetPalette() {
      try {
        globalScope.localStorage.removeItem(storageKey);
      } catch (error) {
        // Palette switching still works for the current page.
      }

      return applyPalette(currentThemeNames()[0] || defaultPalette);
    }
  };

  applyPalette(readStoredPalette());
})(window);
