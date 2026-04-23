// @ts-check

/**
 * Creates the drill startup-data assembly from live root-app bindings.
 * This keeps the welcome standards, pattern-help, and default-progressions
 * loading workflow out of `app.js` while preserving the same startup data
 * loading behavior.
 *
 * @param {object} [options]
 * @param {Record<string, Function>} [options.state]
 * @param {Record<string, any>} [options.welcomeStandards]
 * @param {Record<string, any>} [options.patternHelp]
 * @param {Record<string, any>} [options.defaultProgressions]
 */
export function createDrillStartupDataRootAppAssembly({
  state = {},
  welcomeStandards = {},
  patternHelp = {},
  defaultProgressions = {}
} = {}) {
  const {
    setWelcomeStandards = () => {},
    setDefaultProgressionsVersion = () => {},
    setDefaultProgressions = () => {},
    setProgressions = () => {}
  } = state;

  async function loadWelcomeStandards() {
    const {
      fetchImpl = globalThis.fetch,
      url = '',
      version = '',
      parseWelcomeStandardsText = () => ({}),
      renderWelcomeStandardOptions = () => {},
      welcomeStandardsFallback = {}
    } = welcomeStandards;

    try {
      const response = await fetchImpl(`${url}?v=${encodeURIComponent(version)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = parseWelcomeStandardsText(await response.text());
      if (Object.keys(parsed).length > 0) {
        setWelcomeStandards(parsed);
      }
    } catch {
      setWelcomeStandards({ ...welcomeStandardsFallback });
    }

    renderWelcomeStandardOptions();
  }

  async function loadPatternHelp() {
    const {
      loadDrillPatternHelp = async () => {},
      dom,
      url = '',
      version = ''
    } = patternHelp;

    await loadDrillPatternHelp({
      dom,
      url,
      version
    });
  }

  async function loadDefaultProgressions() {
    const {
      fetchImpl = globalThis.fetch,
      url = '',
      appVersion = '',
      parseDefaultProgressionsText = () => ({ version: '1', progressions: {} }),
      normalizeProgressionsMap = (value) => value
    } = defaultProgressions;

    try {
      const versionedUrl = `${url}?v=${encodeURIComponent(appVersion)}`;
      let response = await fetchImpl(versionedUrl);
      if (!response.ok) {
        response = await fetchImpl(url);
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const parsed = parseDefaultProgressionsText(await response.text());
      setDefaultProgressionsVersion(parsed.version || '1');
      setDefaultProgressions(parsed.progressions);
    } catch {
      setDefaultProgressionsVersion('1');
      setDefaultProgressions({});
    }

    setProgressions(normalizeProgressionsMap(defaultProgressions.getDefaultProgressions?.() || {}));
  }

  return {
    loadWelcomeStandards,
    loadPatternHelp,
    loadDefaultProgressions
  };
}
