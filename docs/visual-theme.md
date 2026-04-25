# Visual Theme

Sharp Eleven keeps `public/theme.css` for derived tokens and token wiring.
The base theme palettes (`--c-*` source values) live in `public/theme-palettes.css`.

## Palettes

The available palette names include:

- `iReal`: the base visual language used by the app (default).

Use the browser console to test palettes:

```js
SharpElevenTheme.listPalettes();
SharpElevenTheme.setPalette('iReal');
SharpElevenTheme.getPalette();
SharpElevenTheme.resetPalette();
```

The selected palette is stored in `localStorage` under `sharp-eleven-theme`.

### iReal Base Palette Scope

The base palette is intentionally minimal: 6 source tokens in `theme-palettes.css`:

- Core UI: `--c-bg`, `--c-text`, `--c-accent`, `--c-secondary`
- State: `--c-highlight` (highlighter yellow used for chart selection and playback highlights)
- Status UI: `--c-danger`

`--c-surface` is intentionally derived from the theme background and accent rather than maintained as an independent source. The remaining `--c-*` names are compatibility aliases derived from source colors. All other variables are aliases or derived via `color-mix`.

### Add a new palette (one file)

To add a new palette, edit only `public/theme-palettes.css` (and keep the root compatibility copy in sync if needed). Add one block:

```css
:root[data-theme="midnight"] {
  --c-bg: #0f172a;
  --c-text: #e5e7eb;
  --c-accent: #38bdf8;
  --c-secondary: #0ea5e9;
  --c-danger: #f87171;
  --c-highlight: #fde047;
}
```

You only need those 6 source tokens. Derived tokens are recalculated automatically. As soon as the block exists, it is discovered by:

```js
SharpElevenTheme.listPalettes();
```

## Token Rules

- Add new visual colors as semantic tokens before using them in component CSS.
- Keep `public/theme.css` for computed tokens and shared wiring; `public/theme-palettes.css` holds base `--c-*` source values.
- Keep chart sheet colors in `chart/chart.css` under `--chart-sheet-*`; chart menus and overlays use shared `--ui-*` tokens.
- Avoid adding selector-migration aliases; source-level `--c-*` aliases may stay when they document derived theme semantics.

## Accepted Exceptions

- `currentColor`, `transparent`, layout-only shadows, and SVG mask fills may stay local.
- `public/chord-symbol.css` owns chord typography and symbol geometry; its `currentColor` usage is intentional.
- `src/features/chart/chart-sheet-renderer.ts` keeps diagnostic/debug overlay colors inline for now because they are not part of the product theme.
- Static utility pages that do not load the app bundle may define small local token sets, but should still respond to `html[data-theme]`.
