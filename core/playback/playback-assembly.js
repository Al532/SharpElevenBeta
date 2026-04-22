// @ts-check

/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackRuntimeBindings} PlaybackRuntimeBindings */

import { createPlaybackRuntimeBindings } from './playback-runtime-bindings.js';

/**
 * Creates a generic playback assembly around a runtime and optional extensions.
 * This is the shared assembly seam used by drill-specific and embedded-specific
 * factories so they can all materialize runtime/controller pairs consistently.
 *
 * @template {PlaybackRuntime} TRuntime
 * @template {Record<string, unknown>} TExtensions
 * @param {{
 *   playbackRuntime: TRuntime,
 *   createExtensions?: (bindings: PlaybackRuntimeBindings & { playbackRuntime: TRuntime }) => TExtensions
 * }} options
 * @returns {PlaybackRuntimeBindings & { playbackRuntime: TRuntime } & TExtensions}
 */
export function createPlaybackAssembly({
  playbackRuntime,
  createExtensions
}) {
  const bindings =
    /** @type {PlaybackRuntimeBindings & { playbackRuntime: TRuntime }} */ (
      createPlaybackRuntimeBindings({ playbackRuntime })
    );
  const extensions = createExtensions?.(bindings) || /** @type {TExtensions} */ ({});
  return {
    ...bindings,
    ...extensions
  };
}
