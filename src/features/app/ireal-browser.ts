import { Capacitor, registerPlugin } from '@capacitor/core';

type IrealBrowserPlugin = {
  open: (options: { url: string, title?: string }) => Promise<void>,
  openHtml: (options: { html: string, title?: string, baseUrl?: string }) => Promise<void>
};

const IrealBrowser = registerPlugin<IrealBrowserPlugin>('IrealBrowser');
const BACKUP_VIEWER_DATABASE_NAME = 'sharp-eleven-backup-viewer';
const BACKUP_VIEWER_STORE_NAME = 'backups';

type BackupViewerPayload = {
  html: string;
  title: string;
  baseUrl: string;
  createdAt: number;
};

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

/**
 * @param {{ html: string, title?: string, baseUrl?: string }} options
 * @returns {Promise<boolean>}
 */
export async function openIrealHtml({ html, title = '', baseUrl = 'https://localhost/shared-import/' }) {
  if (!html) return false;
  if (!Capacitor.isNativePlatform()) {
    return openIrealHtmlInViewer({ html, title, baseUrl, useHouseBrowser: false });
  }
  try {
    await IrealBrowser.openHtml({ html, title, baseUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || '');
    if (/not implemented/i.test(message)) {
      return openIrealHtmlInViewer({ html, title, baseUrl, useHouseBrowser: true });
    }
    throw error;
  }
  return true;
}

function createBackupViewerKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openBackupViewerDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKUP_VIEWER_DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(BACKUP_VIEWER_STORE_NAME)) {
        database.createObjectStore(BACKUP_VIEWER_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open backup viewer storage.'));
  });
}

function waitForRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Backup viewer storage request failed.'));
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Backup viewer storage transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('Backup viewer storage transaction was aborted.'));
  });
}

async function saveBackupViewerPayload(key: string, payload: BackupViewerPayload): Promise<void> {
  const database = await openBackupViewerDatabase();
  try {
    const transaction = database.transaction(BACKUP_VIEWER_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(BACKUP_VIEWER_STORE_NAME);
    await Promise.all([
      waitForRequest(store.put(payload, key)),
      waitForTransaction(transaction)
    ]);
  } finally {
    database.close();
  }
}

async function cleanupStaleBackupViewerEntries(): Promise<void> {
  const cutoff = Date.now() - 60 * 60 * 1000;
  const database = await openBackupViewerDatabase();
  try {
    const transaction = database.transaction(BACKUP_VIEWER_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(BACKUP_VIEWER_STORE_NAME);
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const payload = cursor.value as Partial<BackupViewerPayload> | null;
      if (Number(payload?.createdAt || 0) < cutoff) {
        cursor.delete();
      }
      cursor.continue();
    };
    request.onerror = () => transaction.abort();
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

async function prepareBackupViewerPayload(payload: BackupViewerPayload): Promise<string> {
  try {
    await cleanupStaleBackupViewerEntries();
  } catch (_error) {
    // Cleanup is opportunistic; opening the selected backup is the important path.
  }
  const key = createBackupViewerKey();
  await saveBackupViewerPayload(key, payload);
  return key;
}

async function openIrealHtmlInViewer({
  html,
  title,
  baseUrl,
  useHouseBrowser
}: {
  html: string,
  title: string,
  baseUrl: string,
  useHouseBrowser: boolean
}) {
  const key = await prepareBackupViewerPayload({
    html,
    title,
    baseUrl,
    createdAt: Date.now()
  });

  const viewerUrl = new URL('./backup-viewer.html', window.location.href);
  viewerUrl.searchParams.set('key', key);
  if (useHouseBrowser) {
    await openIrealBrowser({ url: viewerUrl.href, title });
    return true;
  }
  window.open(viewerUrl.href, '_blank', 'noopener,noreferrer');
  return false;
}

