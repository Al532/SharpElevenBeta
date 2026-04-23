// @ts-check

const PENDING_IREAL_LINK_STORAGE_KEY = 'jpt-pending-mobile-ireal-link';

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
 * @returns {string}
 */
export function consumePendingIRealLink(storage = globalThis.localStorage) {
  if (!storage) return '';
  const storageKey = getPendingIRealLinkStorageKey(storage);
  const value = storage.getItem(storageKey) || '';
  if (value) {
    storage.removeItem(storageKey);
  }
  return value;
}
