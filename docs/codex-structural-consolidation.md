# Codex Structural Consolidation

Read this file only when the user explicitly asks for consolidation, clarification, cleanup, or structural refactoring.

- Start by identifying the actual structural problem: an oversized entrypoint, pass-through micro-modules, unclear ownership, duplicated vocabulary, or misplaced domain responsibility.
- Extract from large files by responsibility, not by line count. Keep entrypoints focused on wiring config, DOM, state, and feature modules together.
- Consolidate thin files only when their boundary is mechanical, pass-through, or vocabulary-only.
- Preserve small files that encode a real runtime boundary, platform boundary, shared contract, or testable domain responsibility.
- Treat `*-assembly`, `*-bindings`, and `*-context` families as likely consolidation candidates when they do not carry independent responsibility.
- Clarify contracts, module boundaries, responsibilities, data flow, naming, and vocabulary as part of the refactor.
- Preserve behavior, avoid decorative refactors, keep useful separations, and adapt the scope to the area actually concerned.
- Reserve specific terms for the modules or concepts they truly belong to, and use broader vocabulary for shared or cross-module elements.
- Update imports, references, tests, and relevant documentation so the result is coherent end-to-end.
- Keep `docs/module-catalog.md` aligned when a refactor changes module ownership, moves files across module boundaries, or renames a responsibility.
- Verify structural refactors with `npm run typecheck`, plus `npm run test:chart` after chart or shared playback changes, or `npm run test:drill-wrappers` after drill, app wiring, or config changes.
- At the end, briefly summarize the main structural decisions, important renamings, and any remaining debatable points.
