// Offline queue for storing actions when offline
const DB_NAME = 'typography-erp-offline';
const STORE_NAME = 'actions';

let db: IDBDatabase | null = null;

export const initOfflineQueue = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export interface QueuedAction {
  id?: number;
  method: string;
  url: string;
  data?: any;
  timestamp: number;
}

export const addToQueue = async (action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> => {
  if (!db) {
    await initOfflineQueue();
  }

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      ...action,
      timestamp: Date.now(),
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getQueue = async (): Promise<QueuedAction[]> => {
  if (!db) {
    await initOfflineQueue();
  }

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const removeFromQueue = async (id: number): Promise<void> => {
  if (!db) {
    await initOfflineQueue();
  }

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const processQueue = async (): Promise<void> => {
  if (!navigator.onLine) {
    return;
  }

  const queue = await getQueue();
  const axios = (await import('axios')).default;
  const token = localStorage.getItem('token');

  for (const action of queue) {
    try {
      await axios({
        method: action.method as any,
        url: `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}${action.url}`,
        data: action.data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (action.id) {
        await removeFromQueue(action.id);
      }
    } catch (error) {
      console.error('Failed to process queued action:', error);
      // Keep action in queue for retry
    }
  }
};

