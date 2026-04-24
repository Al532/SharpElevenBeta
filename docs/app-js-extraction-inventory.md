# App Entrypoint Refactor Inventory

`src/app.ts` is now the main browser entrypoint. This document tracks the
remaining extraction opportunities for that file.

## Safe Mechanical Candidates

- DOM reference grouping and narrow DOM adapters.
- Static welcome/onboarding wiring that only passes config into facades.
- Simple UI state adapters such as placeholder visibility, beat dots, and
  display toggles.
- Runtime assembly option objects when they only forward existing functions.
- App-shell identity and mobile navigation glue.

## Needs Focused Review

- Progression and pattern normalization handoff.
- Piano/MIDI settings normalization and persistence.
- Welcome recommendation wiring, because it crosses config, settings, and UI.
- Playback resource setup, because it bridges state, audio, and transport.
- Settings snapshot construction, because persistence and UI defaults are
  tightly coupled.

## Keep In Place Until Covered By Tests

- Low-level transport and scheduling callbacks.
- Direct audio execution and sample preload paths.
- Live MIDI attachment and message handling.
- One-time persisted-state migrations.
- Analytics calls that sit on session-control paths.

## Current Rule

Extract behavior from `src/app.ts` by responsibility, not by line count. The
entrypoint should remain an orchestrator that wires config, DOM, state, and
feature modules together; domain logic should live in `features/*` or `core/*`.
