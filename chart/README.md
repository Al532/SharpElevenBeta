# Chart Module

Private `Chart` subsystem for iReal-style leadsheets.

Goals for v1:

- keep a rich source document faithful to iReal structure
- separate source, view, and playback interpretation
- export an interpreted played form for the existing `Drill` engine
- stay out of the public app bundle
- keep the chart/session domain browser-agnostic and JSON-safe

Useful commands:

- `npm run dev:chart`
- `npm run test:chart`

Entrypoints:

- `chart/index.js`: browser-safe API for `chart-dev`
- `chart/node-index.mjs`: Node-only API including raw iReal source import helpers

Stable internal contracts exposed from `chart/index.js`:

- `CHART_DOCUMENT_CONTRACT`
- `CHART_PLAYBACK_PLAN_CONTRACT`
- `PRACTICE_SESSION_CONTRACT`

Preferred pure transformations:

- `createChartPlaybackPlanFromDocument(chartDocument)`
- `createPracticeSessionFromChartDocument(chartDocument, options)`
- `createPracticeSessionFromChartDocumentWithPlaybackPlan(chartDocument, playbackPlan, options)`
- `createSelectedChartDocument(chartDocument, selectedBarIds)`
- `createPracticeSessionFromSelectedChartDocument(selectedChartDocument, options)`

Default iReal style tempos to document when the source playlist does not expose an explicit BPM:

- `Pop-Rock`: 115
- `Jazz-Latin`: 180
- `Jazz-Medium Swing`: 120
- `Jazz-Afro 12/8`: 110
- `Jazz-Up Tempo Swing`: 240
- `Jazz-Ballad Swing`: 60
- `Jazz-Bossa Nova`: 140
- `Jazz-Even 8ths`: 140
- `Pop-Soul`: 95
- `Jazz-Medium Up Swing`: 160
- `Pop-Funk`: 140
- `Latin-Brazil: Samba`: 220
- `Pop-Country`: 180
- `Latin-Cuba: Bolero`: 90
- `Pop-Disco`: 120
- `Pop-Slow Rock`: 70
