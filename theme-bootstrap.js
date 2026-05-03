(function applyStoredSharpElevenTheme(globalScope) {
  function isLocalLocation() {
    var hostname = globalScope.location ? globalScope.location.hostname : '';
    var port = globalScope.location ? globalScope.location.port : '';
    return (
      !hostname ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      !!port
    );
  }

  function normalizeBuildRedirectTarget() {
    var path = globalScope.location.pathname || '/';
    if (path.indexOf('/build/') !== -1) return null;

    var trailingSlashIndex = path.lastIndexOf('/') + 1;
    var directory = path.slice(0, trailingSlashIndex);
    var fileName = path.slice(trailingSlashIndex) || 'index.html';
    if (!/\.html?$/.test(fileName)) {
      fileName = 'index.html';
    }

    return directory + 'build/' + fileName + (globalScope.location.search || '') + (globalScope.location.hash || '');
  }

  function redirectToBuildOutput() {
    if (isLocalLocation() || !globalScope.location || !globalScope.document) return;

    var target = normalizeBuildRedirectTarget();
    if (!target) return;

    globalScope.location.replace(target);
  }

  redirectToBuildOutput();

  var storageKey = 'sharp-eleven-theme';
  var defaultPalette = 'classic-paper';
  var darkPalette = 'dark-jazz';
  var availablePalettes = { 'classic-paper': true, 'blue-note': true, 'dark-jazz': true };
  var storedPalette;
  var paletteName;

  function splitUrlSuffix(value) {
    var suffixIndex = value.search(/[?#]/);
    if (suffixIndex === -1) {
      return { path: value, suffix: '' };
    }
    return {
      path: value.slice(0, suffixIndex),
      suffix: value.slice(suffixIndex)
    };
  }

  function resolveDarkIconHref(lightHref) {
    var parts;
    if (!lightHref) return './logo/dark-mode.png';
    parts = splitUrlSuffix(lightHref);

    if (/\/assets\/favicon-[^/]+\.png$/i.test(parts.path)) {
      return './logo/dark-mode.png';
    }

    if (/favicon\.(png|svg|ico)$/i.test(parts.path)) {
      return parts.path.replace(/favicon\.(png|svg|ico)$/i, 'logo/dark-mode.png') + parts.suffix;
    }

    return './logo/dark-mode.png';
  }

  function updateFaviconLinks(selectedPaletteName) {
    var useDarkIcon = selectedPaletteName === darkPalette;
    var iconLinks = Array.prototype.slice.call(document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]'));
    var linkIndex;
    var link;
    var lightHref;
    var lightType;
    var darkHref;

    for (linkIndex = 0; linkIndex < iconLinks.length; linkIndex += 1) {
      link = iconLinks[linkIndex];
      lightHref = link.dataset.themeLightHref || link.getAttribute('href') || '';
      lightType = link.dataset.themeLightType || link.getAttribute('type') || '';
      darkHref = link.dataset.themeDarkHref || resolveDarkIconHref(lightHref);

      link.dataset.themeLightHref = lightHref;
      link.dataset.themeLightType = lightType;
      link.dataset.themeDarkHref = darkHref;
      link.setAttribute('href', useDarkIcon ? darkHref : lightHref);

      if (useDarkIcon) {
        link.setAttribute('type', 'image/png');
      } else if (lightType) {
        link.setAttribute('type', lightType);
      } else {
        link.removeAttribute('type');
      }
    }
  }

  function updateBrandLogos(selectedPaletteName) {
    var useDarkIcon = selectedPaletteName === darkPalette;
    var brandLogos = Array.prototype.slice.call(document.querySelectorAll('img.home-brand-logo'));
    var logoIndex;
    var image;
    var lightSrc;
    var darkSrc;

    for (logoIndex = 0; logoIndex < brandLogos.length; logoIndex += 1) {
      image = brandLogos[logoIndex];
      lightSrc = image.dataset.themeLightSrc || image.getAttribute('src') || './logo/classic-paper.png';
      darkSrc = image.dataset.themeDarkSrc || lightSrc.replace(/classic-paper\.png(?:[?#].*)?$/i, 'dark-mode.png');

      image.dataset.themeLightSrc = lightSrc;
      image.dataset.themeDarkSrc = darkSrc || './logo/dark-mode.png';
      image.src = useDarkIcon ? image.dataset.themeDarkSrc : lightSrc;
      image.alt = useDarkIcon ? 'Logo Dark Mode' : 'Logo Classic Paper';
    }
  }

  function updateThemeIcons(selectedPaletteName) {
    updateFaviconLinks(selectedPaletteName);
    updateBrandLogos(selectedPaletteName);
  }

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
  updateThemeIcons(paletteName);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function handleThemeIconDomReady() {
      updateThemeIcons(document.documentElement.dataset.theme || defaultPalette);
    }, { once: true });
  }

  if (globalScope.MutationObserver) {
    new MutationObserver(function handleThemeAttributeMutation() {
      updateThemeIcons(document.documentElement.dataset.theme || defaultPalette);
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
})(window);
