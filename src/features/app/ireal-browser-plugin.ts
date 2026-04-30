import { registerPlugin } from '@capacitor/core';

export type IrealBrowserPlugin = {
  open: (options: { url: string, title?: string }) => Promise<void>,
  openHtml: (options: { html: string, title?: string, baseUrl?: string }) => Promise<void>,
  consumePendingIRealLink: () => Promise<{ url?: string | null, referrerUrl?: string | null, importOrigin?: string | null }>
};

export const IrealBrowser = registerPlugin<IrealBrowserPlugin>('IrealBrowser');
