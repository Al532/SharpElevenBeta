type WelcomeControlBindings = {
  updateWelcomePanelVisibility?: () => void,
  updateWelcomeSummary?: () => void,
  trackEvent?: (name: string, props?: Record<string, unknown>) => void,
  syncWelcomeShowNextTimePreference?: () => void,
  saveSettings?: () => void,
  applyWelcomeRecommendation?: () => void,
  skipWelcomeOverlay?: () => void,
  setWelcomeOverlayVisible?: (isVisible: boolean) => void,
  welcomeStandardSelect?: HTMLSelectElement | null,
  welcomeShowNextTime?: HTMLInputElement | null,
  welcomeApply?: HTMLElement | null,
  welcomeSkip?: HTMLElement | null,
  reopenWelcome?: HTMLElement | null
};

export function bindDrillWelcomeControls({
  updateWelcomePanelVisibility,
  updateWelcomeSummary,
  trackEvent,
  syncWelcomeShowNextTimePreference,
  saveSettings,
  applyWelcomeRecommendation,
  skipWelcomeOverlay,
  setWelcomeOverlayVisible,
  welcomeStandardSelect,
  welcomeShowNextTime,
  welcomeApply,
  welcomeSkip,
  reopenWelcome
}: WelcomeControlBindings = {}) {
  document.querySelectorAll<HTMLInputElement>('input[name="welcome-goal"]').forEach((input) => {
    input.addEventListener('change', () => {
      updateWelcomePanelVisibility?.();
      updateWelcomeSummary?.();
      trackEvent?.('welcome_goal_changed', { welcome_goal: input.value });
    });
  });

  document.querySelectorAll<HTMLInputElement>('input[name="welcome-progression"]').forEach((input) => {
    input.addEventListener('change', () => {
      updateWelcomeSummary?.();
      trackEvent?.('welcome_progression_changed', { welcome_progression: input.value });
    });
  });

  document.querySelectorAll<HTMLInputElement>('input[name="welcome-one-chord"]').forEach((input) => {
    input.addEventListener('change', () => {
      updateWelcomeSummary?.();
      trackEvent?.('welcome_one_chord_changed', { welcome_one_chord: input.value });
    });
  });

  document.querySelectorAll<HTMLInputElement>('input[name="welcome-instrument"]').forEach((input) => {
    input.addEventListener('change', () => {
      updateWelcomeSummary?.();
      trackEvent?.('welcome_instrument_changed', { transposition: input.value });
    });
  });

  welcomeStandardSelect?.addEventListener('change', () => {
    updateWelcomeSummary?.();
    trackEvent?.('welcome_standard_changed', { welcome_standard: welcomeStandardSelect.value });
  });

  welcomeShowNextTime?.addEventListener('change', () => {
    syncWelcomeShowNextTimePreference?.();
    saveSettings?.();
  });

  welcomeApply?.addEventListener('click', () => {
    applyWelcomeRecommendation?.();
  });

  welcomeSkip?.addEventListener('click', () => {
    skipWelcomeOverlay?.();
  });

  reopenWelcome?.addEventListener('click', (event) => {
    event.preventDefault();
    updateWelcomePanelVisibility?.();
    updateWelcomeSummary?.();
    setWelcomeOverlayVisible?.(true);
    trackEvent?.('welcome_reopened', {
      location: 'header'
    });
  });
}

