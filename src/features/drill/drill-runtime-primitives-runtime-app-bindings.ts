// @ts-check

/**
 * Groups the app-level bindings passed into the runtime-primitives assembly
 * before the shared runtime-primitives bindings normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, unknown>}
 */
export function createDrillRuntimePrimitivesRuntimeAppBindings(options = {}) {
  return { ...options };
}
