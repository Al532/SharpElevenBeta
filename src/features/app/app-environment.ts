declare const __APP_VERSION__: string | undefined;

interface ViteImportMeta {
  readonly env?: {
    BASE_URL?: string
  };
}

export function resolveAppVersion(version: unknown = __APP_VERSION__) {
  return typeof version === 'string' ? version : 'dev';
}

export function resolveAppBaseUrl(meta: ViteImportMeta = import.meta as ViteImportMeta) {
  return meta.env?.BASE_URL || './';
}

export function readEmbeddedDrillMode(search: string = window.location.search) {
  return new URLSearchParams(search).get('embedded') === '1';
}
