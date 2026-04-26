import { initializeSharpElevenTheme } from './features/app/app-theme.js';
import { isIRealDeepLink, storePendingIRealLink } from './features/app/app-pending-mobile-import.js';
import { initializeHomePage } from './features/home/home-page.js';

initializeSharpElevenTheme();

async function bindIncomingMobileIRealImports() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  let appPlugin = null;
  try {
    const capacitorAppModule = await import('@capacitor/app');
    appPlugin = capacitorAppModule?.App || null;
  } catch (_error) {
    appPlugin = window.Capacitor?.Plugins?.App || null;
  }
  if (!appPlugin?.addListener) return;

  const redirectToChartImport = (url: string) => {
    if (!isIRealDeepLink(url)) return false;
    const stored = storePendingIRealLink(url);
    if (!stored) return false;
    const targetUrl = new URL('./charts.html', window.location.href);
    window.location.assign(targetUrl.href);
    return true;
  };

  try {
    const launchUrl = await appPlugin.getLaunchUrl?.();
    redirectToChartImport(String(launchUrl?.url || ''));
  } catch (_error) {
    // Ignore launch URL failures and keep the listener active.
  }

  appPlugin.addListener('appUrlOpen', ({ url }: { url?: string }) => {
    redirectToChartImport(String(url || ''));
  });
}

initializeHomePage({
  chartSearchInput: document.getElementById('home-chart-search-input') as HTMLInputElement | null,
  chartSearchResults: document.getElementById('home-chart-search-results'),
  chartSearchEmpty: document.getElementById('home-chart-search-empty'),
  themeButton: document.getElementById('home-theme-button') as HTMLButtonElement | null,
  themeMenu: document.getElementById('home-theme-menu') as HTMLElement | null
}).catch((error) => {
  console.error('Failed to initialize home page.', error);
});

void bindIncomingMobileIRealImports();
