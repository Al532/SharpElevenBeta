// @ts-nocheck

import { Capacitor, registerPlugin } from '@capacitor/core';

const PENDING_IREAL_LINK_STORAGE_KEY = 'jpt-pending-mobile-ireal-link';
const NATIVE_PENDING_IREAL_LINK_MARKER = 'irealb://native-pending-import';
const IrealBrowser = registerPlugin('IrealBrowser');

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
  const nativePendingValue = await consumeNativePendingIRealLink();
  if (nativePendingValue) {
    if (storage) {
      storage.removeItem(getPendingIRealLinkStorageKey(storage));
    }
    return nativePendingValue;
  }

  if (!storage) return '';
  const storageKey = getPendingIRealLinkStorageKey(storage);
  const value = storage.getItem(storageKey) || '';
  if (value) {
    storage.removeItem(storageKey);
  }
  if (isNativePendingIRealLinkMarker(value)) {
    return '';
  }
  return value;
}

/**
 * @returns {Promise<string>}
 */
async function consumeNativePendingIRealLink() {
  if (!Capacitor.isNativePlatform()) return '';
  try {
    const result = await IrealBrowser.consumePendingIRealLink();
    const url = String(result?.url || '').trim();
    return isIRealDeepLink(url) && !isNativePendingIRealLinkMarker(url) ? url : '';
  } catch (_error) {
    return '';
  }
}


