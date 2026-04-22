// @ts-check

/**
 * Groups the app-level bindings consumed by the runtime-primitives assembly
 * before the shared runtime-primitives bindings normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillRuntimePrimitivesRuntimeAppBindings(options = {}) {
  return { ...options };
}
