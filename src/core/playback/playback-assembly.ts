import type {
  PlaybackRuntime,
  PlaybackRuntimeBindings
} from '../types/contracts';

import { createPlaybackRuntimeBindings } from './playback-runtime-bindings.js';

export function createPlaybackAssembly<
  TRuntime extends PlaybackRuntime,
  TExtensions extends Record<string, unknown>
>({
  playbackRuntime,
  createExtensions
}: {
  playbackRuntime: TRuntime;
  createExtensions?: (bindings: PlaybackRuntimeBindings & { playbackRuntime: TRuntime }) => TExtensions;
}): PlaybackRuntimeBindings & { playbackRuntime: TRuntime } & TExtensions {
  const bindings = createPlaybackRuntimeBindings({ playbackRuntime }) as PlaybackRuntimeBindings & {
    playbackRuntime: TRuntime;
  };
  const extensions = createExtensions?.(bindings) || ({} as TExtensions);
  return {
    ...bindings,
    ...extensions
  };
}
