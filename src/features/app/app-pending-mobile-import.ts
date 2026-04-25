import { Capacitor, registerPlugin } from '@capacitor/core';

const PENDING_IREAL_LINK_STORAGE_KEY = 'jpt-pending-mobile-ireal-link';
const NATIVE_PENDING_IREAL_LINK_MARKER = 'irealb://native-pending-import';

type IrealBrowserPlugin = {
  consumePendingIRealLink: () => Promise<{ url?: string | null }>
};

type PendingIRealLinkResult = {
  url: string,
  hadPendingMarker: boolean,
  errorMessage: string
};

const IrealBrowser = registerPlugin<IrealBrowserPlugin>('IrealBrowser');

/**
 * @param {Storage | undefined | null} [storage]
 * @returns {string}
 */
function getPendingIRealLinkStorageKey(storage = globalThis.localStorage) {
  if (!storage) return PENDING_IREAL_LINK_STORAGE_KEY;
  return PENDING_IREAL_LINK_STORAGE_KEY;
}

/**
 * @param {string} rawUrl
 * @returns {boolean}
 */
export function isIRealDeepLink(rawUrl) {
  return String(rawUrl || '').trim().toLowerCase().startsWith('irealb://');
}

/**
 * @param {string} rawUrl
 * @returns {boolean}
 */
export function isNativePendingIRealLinkMarker(rawUrl) {
  return String(rawUrl || '').trim().toLowerCase() === NATIVE_PENDING_IREAL_LINK_MARKER;
}

/**
 * @param {string} rawUrl
 * @param {Storage | undefined | null} [storage]
 * @returns {boolean}
 */
export function storePendingIRealLink(rawUrl, storage = globalThis.localStorage) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || !isIRealDeepLink(trimmed) || !storage) return false;
  storage.setItem(getPendingIRealLinkStorageKey(storage), trimmed);
  return true;
}

/**
 * @param {Storage | undefined | null} [storage]
 * @returns {Promise<string>}
 */
export async function consumePendingIRealLink(storage = globalThis.localStorage) {
  const result = await consumePendingIRealLinkResult(storage);
  return result.url;
}

/**
 * @param {Storage | undefined | null} [storage]
 * @returns {Promise<PendingIRealLinkResult>}
 */
export async function consumePendingIRealLinkResult(storage = globalThis.localStorage): Promise<PendingIRealLinkResult> {
  const nativePendingValue = await consumeNativePendingIRealLink();
  if (nativePendingValue.url) {
    storage?.removeItem(getPendingIRealLinkStorageKey(storage));
    return {
      url: nativePendingValue.url,
      hadPendingMarker: true,
      errorMessage: ''
    };
  }

  if (!storage) {
    return {
      url: '',
      hadPendingMarker: false,
      errorMessage: ''
    };
  }
  const storageKey = getPendingIRealLinkStorageKey(storage);
  const value = storage.getItem(storageKey) || '';
  if (value) {
    storage.removeItem(storageKey);
  }
  if (isNativePendingIRealLinkMarker(value)) {
    return {
      url: '',
      hadPendingMarker: true,
      errorMessage: nativePendingValue.errorMessage || 'The native iReal link capture was empty.'
    };
  }
  return {
    url: value,
    hadPendingMarker: false,
    errorMessage: ''
  };
}

/**
 * @returns {Promise<{ url: string, errorMessage: string }>}
 */
async function consumeNativePendingIRealLink() {
  if (!Capacitor.isNativePlatform()) return { url: '', errorMessage: '' };
  try {
    const result = await IrealBrowser.consumePendingIRealLink();
    const url = String(result?.url || '').trim();
    return {
      url: isIRealDeepLink(url) && !isNativePendingIRealLinkMarker(url) ? url : '',
      errorMessage: ''
    };
  } catch (error) {
    return {
      url: '',
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
}


