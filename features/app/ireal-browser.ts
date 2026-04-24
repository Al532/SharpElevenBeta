// @ts-nocheck
import { Capacitor, registerPlugin } from '@capacitor/core';

const IrealBrowser = registerPlugin('IrealBrowser');

/**
 * @param {{ url: string, title?: string }} options
 * @returns {Promise<boolean>}
 */
export async function openIrealBrowser({ url, title = '' }) {
  if (!url) return false;
  if (!Capacitor.isNativePlatform()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return false;
  }
  await IrealBrowser.open({ url, title });
  return true;
}

