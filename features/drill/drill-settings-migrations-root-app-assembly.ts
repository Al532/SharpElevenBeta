// @ts-nocheck

/**
 * Creates the drill settings-migrations assembly from live root-app bindings.
 * This keeps one-time migration normalization/application logic out of
 * `app.js` while preserving the same persistence behavior.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, any>} [options.state]
 * @param {Record<string, any>} [options.helpers]
 */
export function createDrillSettingsMigrationsRootAppAssembly({
  constants = {},
  state = {},
  helpers = {}
} = {}) {
  const {
    appVersion = 'dev',
    oneTimeMigrations = {},
    customPatternOptionValue = '__custom__'
  } = constants;
  const {
    getAppliedOneTimeMigrations = () => ({}),
    setAppliedOneTimeMigrations = () => {},
    getDefaultProgressions = () => ({}),
    getProgressions = () => ({}),
    setProgressions = () => {},
    getDefaultProgressionsVersion = () => '1',
    getAppliedDefaultProgressionsFingerprint = () => '',
    setAppliedDefaultProgressionsFingerprint = () => {},
    setAcknowledgedDefaultProgressionsVersion = () => {},
    setShouldPromptForDefaultProgressionsUpdate = () => {},
    setSavedPatternSelection = () => {}
  } = state;
  const {
    normalizeProgressionsMap = (value) => value,
    getDefaultProgressionsFingerprint = () => ''
  } = helpers;

  function normalizeAppliedOneTimeMigrations(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => Boolean(key) && entry && typeof entry === 'object' && !Array.isArray(entry))
        .map(([key, entry]) => [key, {
          appliedAt: typeof entry.appliedAt === 'string' ? entry.appliedAt : '',
          appVersion: typeof entry.appVersion === 'string' ? entry.appVersion : '',
          defaultPresetsVersion: typeof entry.defaultPresetsVersion === 'string' ? entry.defaultPresetsVersion : ''
        }])
    );
  }

  function markOneTimeMigrationApplied(migrationId) {
    if (!migrationId) return;

    setAppliedOneTimeMigrations({
      ...getAppliedOneTimeMigrations(),
      [migrationId]: {
        appliedAt: new Date().toISOString(),
        appVersion,
        defaultPresetsVersion: getDefaultProgressionsVersion()
      }
    });
  }

  function hasAppliedOneTimeMigration(migrationId) {
    return Boolean(migrationId && getAppliedOneTimeMigrations()?.[migrationId]);
  }

  function applySilentDefaultPresetResetMigration() {
    const migrationId = oneTimeMigrations.silentDefaultPresetReset;
    const defaultProgressions = getDefaultProgressions();
    if (!migrationId || hasAppliedOneTimeMigration(migrationId) || Object.keys(defaultProgressions).length === 0) {
      return false;
    }

    const nextProgressions = normalizeProgressionsMap(defaultProgressions);
    setProgressions(nextProgressions);
    setAppliedDefaultProgressionsFingerprint(getDefaultProgressionsFingerprint());
    setAcknowledgedDefaultProgressionsVersion(getDefaultProgressionsVersion());
    setShouldPromptForDefaultProgressionsUpdate(false);
    setSavedPatternSelection(Object.keys(nextProgressions)[0] || customPatternOptionValue);
    markOneTimeMigrationApplied(migrationId);
    return true;
  }

  function shouldApplyMasterVolumeDefault50Migration() {
    const migrationId = oneTimeMigrations.masterVolumeDefault50;
    if (!migrationId || hasAppliedOneTimeMigration(migrationId)) {
      return false;
    }
    markOneTimeMigrationApplied(migrationId);
    return true;
  }

  return {
    normalizeAppliedOneTimeMigrations,
    markOneTimeMigrationApplied,
    hasAppliedOneTimeMigration,
    applySilentDefaultPresetResetMigration,
    shouldApplyMasterVolumeDefault50Migration
  };
}


