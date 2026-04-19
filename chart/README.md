# Chart Module

Private `Chart` subsystem for iReal-style leadsheets.

Goals for v1:

- keep a rich source document faithful to iReal structure
- separate source, view, and playback interpretation
- export an interpreted played form for the existing `Drill` engine
- stay out of the public app bundle

Useful commands:

- `npm run dev:chart`
- `npm run chart:fixtures`
- `npm run chart:medium-swing`
- `npm run test:chart`

Generated fixture outputs:

- `chart-dev/fixtures/chart-fixtures.json`: small curated dev set
- `chart-dev/fixtures/chart-medium-swing.json`: full `Medium Swing` conversion from the local iReal `Jazz 1460` database
