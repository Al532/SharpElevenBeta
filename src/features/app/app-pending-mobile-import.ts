import { Capacitor } from '@capacitor/core';
import { IrealBrowser } from './ireal-browser-plugin.js';

const PENDING_IREAL_LINK_STORAGE_KEY = 'jpt-pending-mobile-ireal-link';
const NATIVE_PENDING_IREAL_LINK_MARKER = 'irealb://native-pending-import';

type PendingIRealLinkResult = {
  url: string,
  referrerUrl: string,
  importOrigin: string,
  hadPendingMarker: boolean,
  errorMessage: string
};

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
  return /^irealb(?:ook)?:\/\//i.test(String(rawUrl || '').trim());
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
      referrerUrl: nativePendingValue.referrerUrl,
      importOrigin: nativePendingValue.importOrigin,
      hadPendingMarker: true,
      errorMessage: ''
    };
  }

  if (!storage) {
    return {
      url: '',
      referrerUrl: '',
      importOrigin: '',
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
      referrerUrl: '',
      importOrigin: '',
      hadPendingMarker: true,
      errorMessage: nativePendingValue.errorMessage || 'The native iReal link capture was empty.'
    };
  }
  return {
    url: value,
    referrerUrl: '',
    importOrigin: '',
    hadPendingMarker: false,
    errorMessage: ''
  };
}

/**
 * @returns {Promise<{ url: string, referrerUrl: string, importOrigin: string, errorMessage: string }>}
 */
async function consumeNativePendingIRealLink() {
  if (!Capacitor.isNativePlatform()) return { url: '', referrerUrl: '', importOrigin: '', errorMessage: '' };
  try {
    const result = await IrealBrowser.consumePendingIRealLink();
    const url = String(result?.url || '').trim();
    const referrerUrl = String(result?.referrerUrl || '').trim();
    const importOrigin = String(result?.importOrigin || '').trim();
    return {
      url: isIRealDeepLink(url) && !isNativePendingIRealLinkMarker(url) ? url : '',
      referrerUrl,
      importOrigin,
      errorMessage: ''
    };
  } catch (error) {
    return {
      url: '',
      referrerUrl: '',
      importOrigin: '',
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
}


