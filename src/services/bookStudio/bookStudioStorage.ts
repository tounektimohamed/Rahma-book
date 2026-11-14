import type { StoryBookProject } from '../../utils/bookStudio';

const DB_NAME = 'mls_book_studio_v1';
const STORE_NAME = 'projects';

function openStudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('INDEXED_DB_UNAVAILABLE'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveStudioProject(
  projectKey: string,
  project: StoryBookProject
): Promise<void> {
  try {
    const db = await openStudioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(project, projectKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage quota or private-mode IndexedDB errors gracefully
  }
}

export async function loadStudioProject(
  projectKey: string
): Promise<StoryBookProject | null> {
  try {
    const db = await openStudioDb();
    return await new Promise<StoryBookProject | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(projectKey);
      req.onsuccess = () => resolve((req.result as StoryBookProject) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function listStudioProjectKeys(): Promise<string[]> {
  try {
    const db = await openStudioDb();
    return await new Promise<string[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAllKeys();
      req.onsuccess = () =>
        resolve((req.result || []).map((k) => String(k)));
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
