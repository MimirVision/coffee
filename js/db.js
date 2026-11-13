// Tynn IndexedDB-wrapper. Bilder lagres som Blobs direkte i postene.
const DB_NAME = 'kaffelogg';
const VERSION = 1;
let dbPromise;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('beans')) db.createObjectStore('beans', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('brews')) {
        const s = db.createObjectStore('brews', { keyPath: 'id' });
        s.createIndex('beanId', 'beanId');
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => resolve(out instanceof IDBRequest ? out.result : out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const db = {
  all: (store) => run(store, 'readonly', (s) => s.getAll()),
  get: (store, id) => run(store, 'readonly', (s) => s.get(id)),
  put: (store, obj) => run(store, 'readwrite', (s) => s.put(obj)),
  putMany: (store, list) => run(store, 'readwrite', (s) => { list.forEach((o) => s.put(o)); }),
  del: (store, id) => run(store, 'readwrite', (s) => s.delete(id)),
  delMany: (store, ids) => run(store, 'readwrite', (s) => { ids.forEach((id) => s.delete(id)); }),
  clear: (store) => run(store, 'readwrite', (s) => s.clear()),
  getMeta: (key) => run('meta', 'readonly', (s) => s.get(key)),
  setMeta: (key, val) => run('meta', 'readwrite', (s) => s.put(val, key)),
};
