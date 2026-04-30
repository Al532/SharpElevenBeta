import { enforceBetaAccess } from './app-beta-access.js';

const BACKUP_VIEWER_DATABASE_NAME = 'sharp-eleven-backup-viewer';
const BACKUP_VIEWER_STORE_NAME = 'backups';

type BackupViewerPayload = {
  html?: string;
  title?: string;
  baseUrl?: string;
};

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

async function readBackupPayload(): Promise<BackupViewerPayload | null> {
  const key = new URLSearchParams(window.location.search).get('key') || '';
  if (!key) return null;
  const database = await openBackupViewerDatabase();
  try {
    const transaction = database.transaction(BACKUP_VIEWER_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(BACKUP_VIEWER_STORE_NAME);
    const payload = await waitForRequest(store.get(key)) as BackupViewerPayload | undefined;
    store.delete(key);
    await waitForTransaction(transaction);
    return payload || null;
  } finally {
    database.close();
  }
}

function showMissingBackupMessage(): void {
  const frame = document.getElementById('backup-frame');
  const message = document.getElementById('backup-message');
  if (frame) frame.hidden = true;
  if (message) message.hidden = false;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createBackupDocument(html: string, baseUrl = ''): string {
  const trimmedBaseUrl = String(baseUrl || '').trim();
  if (!trimmedBaseUrl) return html;
  const baseElement = `<base href="${escapeHtmlAttribute(trimmedBaseUrl)}">`;
  if (/<head(?:\s[^>]*)?>/i.test(html)) {
    return html.replace(/<head(?:\s[^>]*)?>/i, (match) => `${match}${baseElement}`);
  }
  return `${baseElement}${html}`;
}

async function initializeBackupViewer(): Promise<void> {
  let payload: BackupViewerPayload | null = null;
  try {
    payload = await readBackupPayload();
  } catch (_error) {
    payload = null;
  }

  const frame = document.getElementById('backup-frame') as HTMLIFrameElement | null;

  if (!payload?.html || !frame) {
    showMissingBackupMessage();
    return;
  }

  document.title = String(payload.title || 'Backup');
  frame.srcdoc = createBackupDocument(payload.html, payload.baseUrl);
}

await enforceBetaAccess({ installFeedback: false });

void initializeBackupViewer();
