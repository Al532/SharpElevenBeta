# iReal Pro Overlay Navigation Reference

Reference device capture size: `1220x2712`.

Captured from the iReal Pro chart screen. The chart overlay opens from the chart view by tapping the middle of the chart area. To dismiss an open overlay/submenu, tap back into the central chart area rather than using Android Back.

## Main Overlay

Reference files:

- `01_after_center_tap.png`
- `08_focus_current.png`

Visible controls:

- Top bar:
  - Back arrow, left side: returns to the previous/list screen in iReal Pro.
  - Help button: `?`
  - Settings/display button: `A`
  - Edit button: pencil
  - Share button: connected nodes
- Bottom player area:
  - Tempo button: e.g. `60 bpm`, later `110 bpm`
  - Repeats button: e.g. `3x`
  - Key/transposition button: e.g. `F`
  - Style button: e.g. `Jazz-Ballad Swing`, later `Jazz-Afro 12/8`
  - Practice button: graduation cap
  - Stop button: square
  - Play button: triangle
  - Mixer button: sliders
  - Chord diagrams button: grid

## Dismissal

Reference file:

- `14_after_chart_tap_close_key.png`

Tap the central chart area to close the currently open bottom sheet/menu. This preserves the chart context better than Android Back.

## Tempo Menu

Reference files:

- `09_tempo_menu.png`
- `09_tempo_menu.xml`

Open from the bottom-left tempo label, e.g. `60 bpm` / `110 bpm`.

Observed layout:

- Partial bottom sheet.
- Chart remains visible above the sheet.
- Sheet title: `Tempo`.
- Large numeric tempo value.
- Large circular `-` and `+` controls.
- Metronome/tap-tempo icon.
- Horizontal slider.
- The bottom player strip remains visible, with the tempo control highlighted as a pale blue pill.

## Key / Transposition Menu

Reference files:

- `13_key_menu.png`
- `13_key_menu.xml`

Open from the bottom-right key label, e.g. `F` or `D-` depending on the song.

Observed layout:

- Partial bottom sheet, taller than tempo.
- Chart remains visible above the sheet.
- Sheet title: `Transposition`.
- Instrument icon on the title row, right side.
- 3-column grid of keys:
  - `C`, `Db`, `D`
  - `Eb`, `E`, `F`
  - `Gb`, `G`, `Ab`
  - `A`, `Bb`, `B`
- Active key uses pale blue filled rounded rectangle.
- Inactive keys are outlined rounded rectangles.

## Mixer

Reference files:

- `15_mixer_menu.png`
- `15_mixer_menu.xml`
- `16_mixer_piano_dropdown.png`
- `16_mixer_piano_dropdown.xml`
- `17_mixer_scrolled_lower.png`
- `17_mixer_scrolled_lower.xml`

Open from the bottom-row sliders icon.

Observed layout:

- Large scrollable panel below the top bar.
- Unlike tempo/key, it covers almost all of the chart area.
- Title: `Mixage`.
- Instrument rows:
  - `Piano` dropdown + volume slider.
  - `Contrebasse` dropdown + volume slider.
  - `Batterie Réelle` dropdown + volume slider.
- `Réinitialiser les instruments` action.
- `Réverbération` slider.
- Lower scrolled area:
  - `Accords enrichis` toggle.
  - `Décompte` section.
  - `Volume du décompte` slider.
  - `Durée du décompte` segmented control: `0`, `1`, `2`, `Auto`.
  - `Clic 1` dropdown, e.g. `Sonnaille`.
  - `Clic 2` dropdown, e.g. `Bord`.

Mixer dropdown pattern:

- Open by tapping an instrument label with chevron, e.g. `Piano`.
- Floating list panel with subtle shadow.
- Active option has a blue checkmark.
- Examples in the piano list:
  - `Piano (Par défaut)`
  - `Rhodes 1`
  - `Rhodes 1 Tremolo`
  - `Rhodes 2`
  - `Rhodes 2 Tremolo`
  - `Vibraphone`
  - `Orgue Jazz`
  - `Orgue percutant`
  - `Orgue Leslie`
  - `Guitare électrique clair`
  - `Guitare électrique LP`
  - `Guitare électrique Chorus`

## Settings / Display Menu

Reference files:

- `02_settings.png`
- `02_settings.xml`
- `03_settings_font.png`

Open from the top `A` button.

Observed layout:

- Floating menu anchored under the top `A` button.
- Pale gray panel over the chart.
- Rows with large labels and chevrons:
  - `Police`
  - `Thème de l'appli`
  - `Thème du morceau`
  - `Instrument transposit..`
- Checkbox rows:
  - `Symbole mineur: m`
  - `Position de lecture`
  - `Surligner symboles...`

Font submenu:

- Modal-like rounded panel centered over dimmed chart.
- Title: `Police`.
- Close `X` at top left.
- Selected row uses pale blue highlight.
- Options include `Classique`, `Écriture à la main`, `System numérique`, `Guitare`, `Piano à une main`, `Piano à deux mains`, `Ukulélé`.

