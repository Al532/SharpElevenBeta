
import { bindDrillWelcomeControls } from './drill-welcome.js';
import { createDrillMobileLifecycle } from './drill-mobile-lifecycle.js';
import type {
  DrillEventTargetLike,
  DrillUiAnalyticsLink,
  DrillUiLifecycleControls,
  DrillUiPianoPresetControls,
  DrillUiSettingsControls,
  DrillUiWelcomeControls
} from './drill-ui-types.js';

type CreateDrillUiEventBindingsRootAppAssemblyOptions = {
  welcomeControls?: DrillUiWelcomeControls;
  analyticsLink?: DrillUiAnalyticsLink;
  settingsControls?: DrillUiSettingsControls;
  pianoPresetControls?: DrillUiPianoPresetControls;
  lifecycleControls?: DrillUiLifecycleControls;
  lifecycleTarget?: DrillEventTargetLike;
  trackSessionDuration?: () => void;
};

/**
 * Creates the drill UI event-binding assembly from live root-app bindings.
 * This keeps the late welcome/settings/piano-preset listener wiring out of
 * `app.js` while preserving the same UI event side effects.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.welcomeControls]
 * @param {Record<string, unknown>} [options.analyticsLink]
 * @param {Record<string, unknown>} [options.settingsControls]
 * @param {Record<string, unknown>} [options.pianoPresetControls]
 * @param {Record<string, unknown>} [options.lifecycleControls]
 * @param {EventTarget | { addEventListener?: Function }} [options.lifecycleTarget]
 * @param {Function} [options.trackSessionDuration]
 */
export function createDrillUiEventBindingsRootAppAssembly({
  welcomeControls = {},
  analyticsLink = {},
  settingsControls = {},
  pianoPresetControls = {},
  lifecycleControls = {},
  lifecycleTarget = globalThis.window,
  trackSessionDuration
}: CreateDrillUiEventBindingsRootAppAssemblyOptions = {}) {
  function bindAnalyticsLink() {
    analyticsLink.element?.addEventListener('click', () => {
      analyticsLink.trackEvent?.('demo_link_clicked', {
        location: 'header'
      });
    });
  }

  function bindWelcomeEvents() {
    bindDrillWelcomeControls(welcomeControls);
  }

  function bindSettingsEvents() {
    const {
      dom,
      saveSettings,
      stopPlaybackIfRunning,
      trackEvent,
      getTempoBucket,
      getRepetitionsPerKey,
      getSelectedChordsPerBar,
      isPlaying,
      getAudioContext,
      noteFadeout,
      stopActiveChordVoices,
      rebuildPreparedCompingPlans,
      getCurrentKey,
      preloadNearTermSamples,
      getCompingStyle,
      isWalkingBassEnabled,
      ensureWalkingBassGenerator,
      buildPreparedBassPlan,
      applyMixerSettings,
      isChordsEnabled,
      setAnalyticsDebugEnabled,
      resetPlaybackSettings
    } = settingsControls;

    dom?.tempoSlider?.addEventListener('change', saveSettings);
    dom?.repetitionsPerKey?.addEventListener('change', saveSettings);
    dom?.patternSelect?.addEventListener('change', saveSettings);
    dom?.patternName?.addEventListener('change', saveSettings);
    dom?.customPattern?.addEventListener('change', saveSettings);
    dom?.patternMode?.addEventListener('change', saveSettings);
    dom?.patternModeBoth?.addEventListener('change', saveSettings);
    dom?.chordsPerBar?.addEventListener('change', saveSettings);
    dom?.doubleTimeToggle?.addEventListener('change', () => {
      stopPlaybackIfRunning?.();
      if (dom?.chordsPerBar) {
        dom.chordsPerBar.value = dom.doubleTimeToggle.checked ? '2' : '1';
      }
      saveSettings?.();
    });
    dom?.majorMinor?.addEventListener('change', saveSettings);
    dom?.compingStyle?.addEventListener('change', saveSettings);
    dom?.tempoSlider?.addEventListener('change', () => {
      trackEvent?.('tempo_changed', {
        tempo: Number(dom.tempoSlider.value),
        tempo_bucket: getTempoBucket?.()
      });
    });
    dom?.repetitionsPerKey?.addEventListener('change', () => {
      trackEvent?.('repetitions_changed', {
        repetitions_per_key: getRepetitionsPerKey?.()
      });
    });
    dom?.chordsPerBar?.addEventListener('change', () => {
      const chordsPerBar = getSelectedChordsPerBar?.();
      trackEvent?.('harmonic_density_changed', {
        chords_per_bar: chordsPerBar,
        double_time: chordsPerBar > 1 ? 'on' : 'off'
      });
    });
    dom?.compingStyle?.addEventListener('change', () => {
      const audioContext = getAudioContext?.();
      if (isPlaying?.() && audioContext) {
        stopActiveChordVoices?.(audioContext.currentTime, noteFadeout);
        rebuildPreparedCompingPlans?.(getCurrentKey?.());
      }
      preloadNearTermSamples?.()?.catch?.(() => {});
      trackEvent?.('comping_style_changed', {
        comping_style: getCompingStyle?.()
      });
    });
    dom?.walkingBass?.addEventListener('change', async () => {
      if (isWalkingBassEnabled?.()) {
        try {
          await ensureWalkingBassGenerator?.();
        } catch {}
      }
      if (isPlaying?.()) {
        buildPreparedBassPlan?.();
      }
      preloadNearTermSamples?.()?.catch?.(() => {});
      saveSettings?.();
    });
    dom?.stringsVolume?.addEventListener('input', () => {
      applyMixerSettings?.();
      const audioContext = getAudioContext?.();
      if (!isChordsEnabled?.() && isPlaying?.() && audioContext) {
        stopActiveChordVoices?.(audioContext.currentTime, noteFadeout);
      }
    });
    dom?.drumsSelect?.addEventListener('change', saveSettings);
    dom?.drumsSelect?.addEventListener('change', () => {
      trackEvent?.('drums_mode_changed', {
        drums_mode: dom.drumsSelect.value
      });
    });
    dom?.debugToggle?.addEventListener('change', () => {
      setAnalyticsDebugEnabled?.(dom.debugToggle.checked);
    });
    dom?.resetSettings?.addEventListener('click', resetPlaybackSettings);
  }

  function bindPianoPresetEvents() {
    const {
      dom,
      refreshPianoSettingsJson,
      setPianoMidiStatus,
      applyPianoPresetFromJsonText,
      getPianoMidiSettings,
      refreshMidiInputs,
      normalizePianoFadeSettings,
      normalizePianoMidiSettings,
      defaultPianoFadeSettings,
      defaultPianoMidiSettings,
      setPianoFadeSettings,
      setPianoMidiSettings,
      stopAllMidiPianoVoices,
      syncPianoToolsUi,
      attachMidiInput,
      saveSettings,
      clipboard = globalThis.navigator?.clipboard,
      alert = globalThis.window?.alert
    } = pianoPresetControls;

    dom?.pianoSettingsCopy?.addEventListener('click', async () => {
      refreshPianoSettingsJson?.();
      const presetText = dom?.pianoSettingsJson?.value || '';
      try {
        if (clipboard?.writeText) {
          await clipboard.writeText(presetText);
          setPianoMidiStatus?.('Preset piano copie');
          return;
        }
      } catch {}
      if (dom?.pianoSettingsJson) {
        dom.pianoSettingsJson.focus();
        dom.pianoSettingsJson.select();
      }
      setPianoMidiStatus?.('Preset pret a copier');
    });

    dom?.pianoSettingsApply?.addEventListener('click', async () => {
      try {
        applyPianoPresetFromJsonText?.(dom?.pianoSettingsJson?.value || '{}');
        if (getPianoMidiSettings?.()?.enabled) {
          await refreshMidiInputs?.();
        }
        setPianoMidiStatus?.('Preset piano applique');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err || 'Unknown error');
        alert?.(`Preset piano invalide: ${message}`);
      }
    });

    dom?.pianoSettingsReset?.addEventListener('click', () => {
      setPianoFadeSettings?.(normalizePianoFadeSettings?.(defaultPianoFadeSettings));
      setPianoMidiSettings?.(normalizePianoMidiSettings?.(defaultPianoMidiSettings));
      stopAllMidiPianoVoices?.(true);
      syncPianoToolsUi?.();
      attachMidiInput?.();
      saveSettings?.();
      setPianoMidiStatus?.('Reglages piano reinitialises');
    });
  }

  function bindLifecycleEvents() {
    const mobileLifecycle = createDrillMobileLifecycle({
      lifecycleTarget,
      visibilityTarget: lifecycleControls.visibilityTarget,
      userGestureTarget: lifecycleControls.userGestureTarget,
      getIsPlaying: lifecycleControls.getIsPlaying,
      getIsPaused: lifecycleControls.getIsPaused,
      getAudioContext: lifecycleControls.getAudioContext,
      resumeAudioContext: lifecycleControls.resumeAudioContext,
      togglePausePlayback: lifecycleControls.togglePausePlayback,
      trackSessionDuration
    });
    mobileLifecycle.bindLifecycleEvents();
    mobileLifecycle.bindUserGestureUnlock();
  }

  function bindAll() {
    bindAnalyticsLink();
    bindWelcomeEvents();
    bindSettingsEvents();
    bindPianoPresetEvents();
    bindLifecycleEvents();
  }

  return {
    bindAnalyticsLink,
    bindWelcomeEvents,
    bindSettingsEvents,
    bindPianoPresetEvents,
    bindLifecycleEvents,
    bindAll
  };
}


