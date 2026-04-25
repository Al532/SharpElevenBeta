# Visual Theme

Sharp Eleven uses CSS custom properties as the source of truth for visual colors.

## Palettes

The available palette names are:

- `current`: the existing dark visual language, kept as the default.
- `light`: a light palette for redesign exploration.
- `contrast`: a higher-contrast palette for legibility checks.

Use the browser console to test palettes:

```js
SharpElevenTheme.listPalettes();
SharpElevenTheme.setPalette('light');
SharpElevenTheme.getPalette();
SharpElevenTheme.resetPalette();
```

The selected palette is stored in `localStorage` under `sharp-eleven-theme`.

## Token Rules

- Add new visual colors as semantic tokens before using them in component CSS.
- Keep `public/style.css` as the source for app-wide tokens; `style.css` is generated from it.
- Keep chart colors in `chart-dev/chart-dev.css`, split between `--chart-ui-*` and `--chart-sheet-*` tokens.
- Preserve temporary legacy aliases such as `--bg`, `--panel`, `--text`, and `--accent` until the redesign removes old selectors.

## Accepted Exceptions

- `currentColor`, `transparent`, layout-only shadows, and SVG mask fills may stay local.
- `public/chord-symbol.css` owns chord typography and symbol geometry; its `currentColor` usage is intentional.
- `src/features/chart/chart-sheet-renderer.ts` keeps diagnostic/debug overlay colors inline for now because they are not part of the product theme.
- Static utility pages that do not load the app bundle may define small local token sets, but should still respond to `html[data-theme]`.
