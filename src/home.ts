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
  recentChartsList: document.getElementById('home-recent-charts'),
  recentChartsEmpty: document.getElementById('home-recent-charts-empty'),
  playlistsList: document.getElementById('home-playlists'),
  playlistsEmpty: document.getElementById('home-playlists-empty'),
  themeSelect: document.getElementById('home-theme-select') as HTMLSelectElement | null
}).catch((error) => {
  console.error('Failed to initialize home page.', error);
});

void bindIncomingMobileIRealImports();
