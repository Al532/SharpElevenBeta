import { Capacitor, registerPlugin } from '@capacitor/core';

type IrealBrowserPlugin = {
  open: (options: { url: string, title?: string }) => Promise<void>
};

const IrealBrowser = registerPlugin<IrealBrowserPlugin>('IrealBrowser');

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

