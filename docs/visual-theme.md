# Visual Theme

Sharp Eleven uses `public/theme.css` as the source of truth for visual colors.

## Palettes

The available palette names are:

- `current`: the base visual language used by the app (default).

Use the browser console to test palettes:

```js
SharpElevenTheme.listPalettes();
SharpElevenTheme.setPalette('current');
SharpElevenTheme.getPalette();
SharpElevenTheme.resetPalette();
```

The selected palette is stored in `localStorage` under `sharp-eleven-theme`.

### Current base palette scope

The base palette is intentionally minimal: 7 source tokens in `theme.css`:

- Core UI: `--c-bg`, `--c-text`, `--c-accent`, `--c-secondary`
- Status UI: `--c-danger`
- Chart sheet: `--c-chart-paper`, `--c-chart-ink`

`--c-surface` is intentionally derived from the theme background and accent rather than maintained as an independent source. The remaining `--c-*` names are compatibility aliases derived from source colors. All other variables are aliases or derived via `color-mix`.

## Token Rules

- Add new visual colors as semantic tokens before using them in component CSS.
- Keep `public/theme.css` for source tokens and computed token values; `public/style.css` and component styles reuse `--ui-*` tokens only.
- Keep chart sheet colors in `chart/chart.css` under `--chart-sheet-*`; chart menus and overlays use shared `--ui-*` tokens.
- Avoid adding selector-migration aliases; source-level `--c-*` aliases may stay when they document derived theme semantics.

## Accepted Exceptions

- `currentColor`, `transparent`, layout-only shadows, and SVG mask fills may stay local.
- `public/chord-symbol.css` owns chord typography and symbol geometry; its `currentColor` usage is intentional.
- `src/features/chart/chart-sheet-renderer.ts` keeps diagnostic/debug overlay colors inline for now because they are not part of the product theme.
- Static utility pages that do not load the app bundle may define small local token sets, but should still respond to `html[data-theme]`.
