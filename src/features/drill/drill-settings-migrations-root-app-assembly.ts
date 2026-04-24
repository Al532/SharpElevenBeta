
type AppliedMigrationEntry = {
  appliedAt: string;
  appVersion: string;
  defaultPresetsVersion: string;
};

type DrillSettingsMigrationConstants = {
  appVersion?: string;
  oneTimeMigrations?: Record<string, string>;
  customPatternOptionValue?: string;
};

type DrillSettingsMigrationState = {
  getAppliedOneTimeMigrations?: () => Record<string, AppliedMigrationEntry>;
  setAppliedOneTimeMigrations?: (value: Record<string, AppliedMigrationEntry>) => void;
  getDefaultProgressions?: () => Record<string, unknown>;
  getProgressions?: () => Record<string, unknown>;
  setProgressions?: (value: Record<string, unknown>) => void;
  getDefaultProgressionsVersion?: () => string;
  getAppliedDefaultProgressionsFingerprint?: () => string;
  setAppliedDefaultProgressionsFingerprint?: (value: string) => void;
  setAcknowledgedDefaultProgressionsVersion?: (value: string) => void;
  setShouldPromptForDefaultProgressionsUpdate?: (value: boolean) => void;
  setSavedPatternSelection?: (value: string) => void;
};

type DrillSettingsMigrationHelpers = {
  normalizeProgressionsMap?: (value: Record<string, unknown>) => Record<string, unknown>;
  getDefaultProgressionsFingerprint?: () => string;
};

type CreateDrillSettingsMigrationsRootAppAssemblyOptions = {
  constants?: DrillSettingsMigrationConstants;
  state?: DrillSettingsMigrationState;
  helpers?: DrillSettingsMigrationHelpers;
};

/**
 * Creates the drill settings-migrations assembly from live root-app bindings.
 * This keeps one-time migration normalization/application logic out of
 * `app.js` while preserving the same persistence behavior.
 *
 * @param {object} [options]
 * @param {object} [options.constants]
 * @param {object} [options.state]
 * @param {object} [options.helpers]
 */
export function createDrillSettingsMigrationsRootAppAssembly({
  constants = {},
  state = {},
  helpers = {}
}: CreateDrillSettingsMigrationsRootAppAssemblyOptions = {}) {
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

  function normalizeAppliedOneTimeMigrations(value: unknown): Record<string, AppliedMigrationEntry> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => Boolean(key) && entry && typeof entry === 'object' && !Array.isArray(entry))
        .map(([key, entry]) => [key, {
          appliedAt: typeof (entry as AppliedMigrationEntry).appliedAt === 'string' ? (entry as AppliedMigrationEntry).appliedAt : '',
          appVersion: typeof (entry as AppliedMigrationEntry).appVersion === 'string' ? (entry as AppliedMigrationEntry).appVersion : '',
          defaultPresetsVersion: typeof (entry as AppliedMigrationEntry).defaultPresetsVersion === 'string'
            ? (entry as AppliedMigrationEntry).defaultPresetsVersion
            : ''
        }])
    );
  }

  function markOneTimeMigrationApplied(migrationId: string) {
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

  function hasAppliedOneTimeMigration(migrationId: string): boolean {
    return Boolean(migrationId && getAppliedOneTimeMigrations()?.[migrationId]);
  }

  function applySilentDefaultPresetResetMigration(): boolean {
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

  function shouldApplyMasterVolumeDefault50Migration(): boolean {
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


