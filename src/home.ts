import { initializeSharpElevenTheme } from './features/app/app-theme.js';
import { initializeHomePage } from './features/home/home-page.js';

initializeSharpElevenTheme();

initializeHomePage({
  chartSearchInput: document.getElementById('home-chart-search-input') as HTMLInputElement | null,
  chartSearchResults: document.getElementById('home-chart-search-results'),
  chartSearchEmpty: document.getElementById('home-chart-search-empty'),
  importChartsButton: document.getElementById('home-import-charts-button') as HTMLButtonElement | null,
  importChartsPopup: document.getElementById('home-import-charts-popup'),
  importCloseButton: document.getElementById('home-import-close-button') as HTMLButtonElement | null,
  importIRealBackupButton: document.getElementById('import-ireal-backup-button') as HTMLButtonElement | null,
  openIRealForumButton: document.getElementById('open-ireal-forum-button') as HTMLButtonElement | null,
  irealBackupInput: document.getElementById('ireal-backup-input') as HTMLInputElement | null,
  irealImportActions: document.getElementById('ireal-import-actions'),
  irealLinkInput: document.getElementById('ireal-link-input') as HTMLInputElement | null,
  importIRealLinkButton: document.getElementById('import-ireal-link-button') as HTMLButtonElement | null,
  irealLinkImportSection: document.getElementById('ireal-link-import-section'),
  chartImportStatus: document.getElementById('home-chart-search-empty'),
  themeButton: document.getElementById('home-theme-button') as HTMLButtonElement | null,
  themeMenu: document.getElementById('home-theme-menu') as HTMLElement | null
}).catch((error) => {
  console.error('Failed to initialize home page.', error);
});
