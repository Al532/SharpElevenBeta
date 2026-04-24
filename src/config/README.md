# Config Map

The main entry point for configurable trainer constants is
[trainer-config.ts](/C:/Users/Alcibiade/Documents/GitHub/SharpElevenApp/src/config/trainer-config.ts).

Quick guide:

- `TRAINER_APP_CONFIG`, `TRAINER_MODE_CONFIG`, `TRAINER_AUDIO_CONFIG`,
  `TRAINER_PRESET_CONFIG`
  Grouped surfaces intended for main consumers like `src/app.ts`.
- `TRAINER_DEFAULTS`
  UI and session defaults: default progressions, repetitions, next preview,
  chords per bar.
- `CHART_DISPLAY_CONFIG`
  Chart sheet display tuning.
  The most directly useful sections are:
  `sheetHeader`, `rowSpacing`, `barGeometry`, `chordSizing`,
  `displacement`, `barResizing`, and `compression`.
  Start with `sheetHeader.portraitTopPaddingPx`,
  `sheetHeader.landscapeTopPaddingPx`, `rowSpacing.minPx`,
  `barGeometry.barLine.heightPx`,
  `chordSizing.baseRem`, `displacement.singleChordLeftBias`,
  `displacement.maxOffsetPx`, `barResizing.minDeltaRatio`,
  `barResizing.maxDeltaRatio`, `compression.triggerFillRatio`,
  `compression.rowPropagationRatio`, and `compression.pagePropagationRatio`.
- `TRAINER_RESOURCE_PATHS`
  Relative resource paths that `src/app.ts` turns into runtime URLs.
- `PATTERN_MODES`, `DISPLAY_MODES`, `HARMONY_DISPLAY_MODES`,
  `COMPING_STYLES`, `DRUM_MODES`
  Mode tokens and select values.
- `WELCOME_CONFIG`, `WELCOME_PROGRESSIONS`, `WELCOME_ONE_CHORDS`,
  `WELCOME_STANDARDS_FALLBACK`
  Onboarding settings, welcome presets, and standards fallback data.
- `PIANO_SETTINGS_CONFIG`, `PIANO_SAMPLE_RANGE`, `PIANO_COMPING_CONFIG`
  Piano and MIDI defaults, sample range, and piano comping behavior.
- `INSTRUMENT_RANGES`, `AUDIO_TIMING`, `AUDIO_LEVELS`,
  `AUDIO_SCHEDULING`, `AUDIO_MIXER_CONFIG`
  Instrument ranges, audio timings, levels, scheduler settings, and mixer
  calibration.
- `SAMPLE_LIBRARY_CONFIG`
  Drum and ride sample paths.
- `VOICING_RANDOMIZATION_CONFIG`
  Voicing randomization margins.
- `ONE_TIME_MIGRATIONS`
  One-shot migration ids.

Intentionally kept out of this file:

- pure music theory constants (`roman`, intervals, enharmonic tables)
- DOM references
- live runtime state
- technical hoisting seams in `src/app.ts`

Practical rule:

- if a value changes adjustable app behavior, start in
  `src/config/trainer-config.ts`
- if a value describes internal music logic or runtime structure, it probably
  belongs elsewhere
