/**
 * db.js
 * IndexedDB 初始化與版本管理。
 * 對應規格第 3 節資料結構、第 8 節建議專案結構。
 */

const DB_NAME = 'achievement-log-db';
const DB_VERSION = 1;
const STORE_NAME = 'achievements';

/** @type {Promise<IDBDatabase>|null} 快取連線，避免重複開啟 */
let dbPromise = null;

/**
 * 開啟（或初始化）資料庫連線。重複呼叫會回傳同一個 Promise，避免重複開啟連線。
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('此瀏覽器不支援 IndexedDB，無法使用本 App'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // 週次檢視查詢用
        store.createIndex('weekIdentifier', 'weekIdentifier', { unique: false });
        // 月/年統計與排序用（range query 需要）
        store.createIndex('registeredDate', 'registeredDate', { unique: false });
      }
      // 未來若需升級 schema，於此依 event.oldVersion 分支處理遷移邏輯，
      // 並記得同步調高上方的 DB_VERSION。
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      // 使用者在其他分頁把 DB 版本升級時，這裡會收到通知，
      // 主動關閉舊連線，避免佔用升級鎖（block 住其他分頁的 upgrade）。
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('IndexedDB 開啟失敗'));
    };

    request.onblocked = () => {
      // 通常發生在有其他分頁開著舊版本連線時；本 App 目前只有單一 store 版本，
      // 保留這個 handler 是為了未來升級 schema 時能提早發現問題。
      console.warn('db.js: IndexedDB 開啟被其他分頁阻擋（onblocked）');
    };
  });

  return dbPromise;
}

/**
 * 取得一個 transaction 中的 object store，供 repo 層操作使用。
 * @param {'readonly'|'readwrite'} mode
 * @returns {Promise<IDBObjectStore>}
 */
export async function getStore(mode = 'readonly') {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, mode);
  return tx.objectStore(STORE_NAME);
}

export const DB_CONFIG = { DB_NAME, DB_VERSION, STORE_NAME };
