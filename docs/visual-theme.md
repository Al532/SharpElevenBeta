# Visual Theme

Sharp Eleven uses `public/theme.css` as the source of truth for visual colors.

## Palettes

The available palette names are:

- `current`: the base dark visual language used by the app (default).

Use the browser console to test palettes:

```js
SharpElevenTheme.listPalettes();
SharpElevenTheme.setPalette('current');
SharpElevenTheme.getPalette();
SharpElevenTheme.resetPalette();
```

The selected palette is stored in `localStorage` under `sharp-eleven-theme`.

### Current base palette scope

The base palette is intentionally minimal: 16 source tokens in `theme.css`:

- Core UI: `--c-bg`, `--c-surface`, `--c-text`, `--c-text-weak`, `--c-border`, `--c-accent`, `--c-accent-strong`, `--c-danger`, `--c-success`, `--c-shadow`, `--c-overlay`, `--c-focus`
- Chart sheet: `--c-chart-stage`, `--c-chart-paper`, `--c-chart-paper-line`, `--c-chart-paper-text`

All other variables are aliases or derived via `color-mix`.

## Token Rules

- Add new visual colors as semantic tokens before using them in component CSS.
- Keep `public/theme.css` for source tokens and computed token values; `public/style.css` and component styles reuse `--ui-*` tokens only.
- Keep chart sheet colors in `chart/chart.css` under `--chart-sheet-*`; chart menus and overlays use shared `--ui-*` tokens.
- No compatibility aliases are kept for selector migration.

## Accepted Exceptions

- `currentColor`, `transparent`, layout-only shadows, and SVG mask fills may stay local.
- `public/chord-symbol.css` owns chord typography and symbol geometry; its `currentColor` usage is intentional.
- `src/features/chart/chart-sheet-renderer.ts` keeps diagnostic/debug overlay colors inline for now because they are not part of the product theme.
- Static utility pages that do not load the app bundle may define small local token sets, but should still respond to `html[data-theme]`.
