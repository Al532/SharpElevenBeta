import { enforceBetaAccess } from './src/features/app/app-beta-access.js';
import { initializeChartManagementPage } from './src/features/chart-management/chart-management-page.js';

await enforceBetaAccess();

initializeChartManagementPage('setlists');
