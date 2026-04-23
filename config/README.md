# Config Map

The main entry point for configurable trainer constants is
[trainer-config.js](/C:/Users/Alcibiade/Documents/GitHub/SharpElevenApp/config/trainer-config.js).

Quick guide:

- `TRAINER_APP_CONFIG`, `TRAINER_MODE_CONFIG`, `TRAINER_AUDIO_CONFIG`,
  `TRAINER_PRESET_CONFIG`
  Grouped surfaces intended for main consumers like `app.js`.
- `TRAINER_DEFAULTS`
  UI and session defaults: default progressions, repetitions, next preview,
  chords per bar.
- `TRAINER_RESOURCE_PATHS`
  Relative resource paths that `app.js` turns into runtime URLs.
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
- technical hoisting seams in `app.js`

Practical rule:

- if a value changes adjustable app behavior, start in
  `config/trainer-config.js`
- if a value describes internal music logic or runtime structure, it probably
  belongs elsewhere
