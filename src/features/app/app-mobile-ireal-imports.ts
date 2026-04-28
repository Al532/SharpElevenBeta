import { isIRealDeepLink, storePendingIRealLink } from './app-pending-mobile-import.js';

export async function bindIncomingMobileIRealImports({
  targetPath = './index.html?import=charts',
  setImportStatus = () => {}
}: {
  targetPath?: string;
  setImportStatus?: (message: string, isError?: boolean) => void;
} = {}) {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  let appPlugin = null;
  try {
    const capacitorAppModule = await import('@capacitor/app');
    appPlugin = capacitorAppModule?.App || null;
  } catch (_error) {
    appPlugin = window.Capacitor?.Plugins?.App || null;
  }
  if (!appPlugin?.addListener) return;

  const redirectToChartImport = (url) => {
    if (!isIRealDeepLink(url)) return false;
    const stored = storePendingIRealLink(url);
    if (!stored) return false;
    setImportStatus('iReal link detected. Opening chart import...');
    const targetUrl = new URL(targetPath, window.location.href);
    window.location.assign(targetUrl.href);
    return true;
  };

  try {
    const launchUrl = await appPlugin.getLaunchUrl?.();
    redirectToChartImport(launchUrl?.url || '');
  } catch (_error) {
    // Ignore launch URL failures and keep the listener active.
  }

  appPlugin.addListener('appUrlOpen', ({ url }) => {
    redirectToChartImport(url);
  });
}
