import { initializeSharpElevenTheme } from './features/app/app-theme.js';
import { initializeHomePage } from './features/home/home-page.js';

initializeSharpElevenTheme();

initializeHomePage({
  recentChartsList: document.getElementById('home-recent-charts'),
  recentChartsEmpty: document.getElementById('home-recent-charts-empty'),
  playlistsList: document.getElementById('home-playlists'),
  playlistsEmpty: document.getElementById('home-playlists-empty')
}).catch((error) => {
  console.error('Failed to initialize home page.', error);
});
