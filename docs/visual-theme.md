# Visual Theme

Sharp Eleven keeps `public/theme.css` for derived tokens and token wiring.
The base theme palettes (`--c-*` source values) live in `public/theme-palettes.css`.

## Visual Language

Sharp Eleven is a music-library and practice tool, not a marketing site. The interface should feel calm, fast, and useful on a phone in a rehearsal context.

The current home screen is the reference direction:

- Search is the primary entry point. It should feel central and deliberate, not like an accessory control.
- Use clear UI lettering for the product name in app chrome. Expressive brush wordmarks are better suited to splash, store, or promotional surfaces.
- Prefer spacious, flat layouts with minimal chrome. Use typography, spacing, alignment, subtle surface contrast, and interaction states before adding visible borders or frames.
- Rounded controls are allowed when they carry a functional role. The current pattern is soft rounded search fields and standalone rounded action tiles, not boxed page sections.
- Avoid putting sections inside decorative containers. In particular, do not wrap the home action tiles in a parent card.
- Use subtle shadows sparingly to lift tappable controls from the paper background. Shadows should not create hard dividers or card-heavy structure.
- Lists should be light and scannable. Titles can be strong, but avoid oversized text that causes avoidable truncation.
- Primary iconography should be simple line-art SVG, using `currentColor` and the theme accent where possible.
- Keep the home page non-elastic and viewport-fitted unless a future home design intentionally introduces scroll.

When extending this language to other screens, start with the closest existing pattern:

- Home, library, and setlists share list/action/search vocabulary.
- Chart and drill screens are working tools. Preserve density, legibility, and touch ergonomics before applying softer styling.
- Prefer local, scoped CSS improvements over introducing a large design-system layer prematurely.

## Palettes

The available palette names include:

- `classic-paper`: the default visual language used by the app.
- `blue-note`: the cool blue alternate palette.
- `dark-jazz`: the dark companion palette for the current soft tile/search language.

Use the browser console to test palettes:

```js
SharpElevenTheme.listPalettes();
SharpElevenTheme.setPalette('blue-note');
SharpElevenTheme.getPalette();
SharpElevenTheme.resetPalette();
```

The selected palette is stored in `localStorage` under `sharp-eleven-theme`.

### Base Palette Scope

The base palette is intentionally minimal: 6 source tokens in `theme-palettes.css`:

- Core UI: `--c-bg`, `--c-text`, `--c-accent`, `--c-secondary`
- State: `--c-highlight` (highlighter yellow used for chart selection and playback highlights)
- Status UI: `--c-danger`

`--c-surface` is intentionally derived from the theme background and text rather than maintained as an independent source. The remaining `--c-*` names are derived aliases. `--tone-*` helpers handle light/dark mixing, and all app, home, drill, and chart UI colors should flow through the derived `--ui-*` layer in `public/theme.css`; avoid adding palette-specific component selectors such as `:root[data-theme="..."] .some-component`.

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
- Prefer adapting shared tokens with `light-dark()` and `color-mix()` in `public/theme.css` over hard-coded dark/light overrides in component CSS.

## Accepted Exceptions

- `currentColor`, `transparent`, layout-only shadows, and SVG mask fills may stay local.
- `public/chord-symbol.css` owns chord typography and symbol geometry; its `currentColor` usage is intentional.
- `src/features/chart/chart-sheet-renderer.ts` keeps diagnostic/debug overlay colors inline for now because they are not part of the product theme.
- Static utility pages that do not load the app bundle may define small local token sets, but should still respond to `html[data-theme]`.
