/**
 * achievementRepo.js
 * 成就記錄的 CRUD 封裝，供上層 views/ui 呼叫，不直接操作 IndexedDB API。
 * 對應規格第 2.1、2.4、2.6、2.6.2 節。
 */

import { openDB, DB_CONFIG } from './db.js';
import { getISOWeek, formatDateISO } from '../utils/isoWeek.js';

const { STORE_NAME } = DB_CONFIG;

/**
 * 將一個 IDBRequest 包裝成 Promise。
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

/**
 * 產生一個簡易 UUID v4。優先使用瀏覽器原生 crypto.randomUUID，
 * 若環境不支援（極舊瀏覽器）則退回 fallback 實作。
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback：非密碼學安全，但足夠用於本地識別碼
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 新增一筆成就記錄（對應規格 2.1）。
 * @param {{ content: string, registeredDate?: string }} input
 *        registeredDate 未提供時預設為今天；格式須為 'YYYY-MM-DD'
 * @returns {Promise<object>} 新建立的完整記錄
 */
export async function addAchievement({ content, registeredDate }) {
  if (!content || !content.trim()) {
    throw new Error('achievementRepo: content 不可為空');
  }

  const date = registeredDate || formatDateISO(new Date());
  const { weekIdentifier } = getISOWeek(date);

  const record = {
    id: generateId(),
    registeredDate: date,
    weekIdentifier,
    content: content.trim(),
    createdAt: Date.now(),
  };

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add(record);
  await txDone(tx);

  return record;
}

/**
 * 更新一筆成就記錄（對應規格 2.6.2：可修改內容與登記日期）。
 * 若 registeredDate 有變動，會自動重新計算 weekIdentifier。
 * @param {string} id
 * @param {{ content?: string, registeredDate?: string }} patch
 * @returns {Promise<object>} 更新後的完整記錄
 */
export async function updateAchievement(id, patch) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const existing = await promisifyRequest(store.get(id));
  if (!existing) {
    throw new Error(`achievementRepo: 找不到 id="${id}" 的記錄`);
  }

  const updated = { ...existing };

  if (typeof patch.content === 'string') {
    if (!patch.content.trim()) {
      throw new Error('achievementRepo: content 不可為空');
    }
    updated.content = patch.content.trim();
  }

  if (typeof patch.registeredDate === 'string' && patch.registeredDate !== existing.registeredDate) {
    updated.registeredDate = patch.registeredDate;
    updated.weekIdentifier = getISOWeek(patch.registeredDate).weekIdentifier;
  }

  store.put(updated);
  await txDone(tx);

  return updated;
}

/**
 * 刪除一筆成就記錄。UI 層需自行處理「二次確認」（對應規格 2.4），本函式不做確認提示。
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteAchievement(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  await txDone(tx);
}

/**
 * 依 id 取得單筆記錄。
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
export async function getAchievementById(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  return promisifyRequest(tx.objectStore(STORE_NAME).get(id));
}

/**
 * 取得指定週次的所有記錄，並依 createdAt 由早到晚排序（對應規格 2.1「同週內排序」）。
 * @param {string} weekIdentifier - 如 '2026-W35'
 * @returns {Promise<object[]>}
 */
export async function getAchievementsByWeek(weekIdentifier) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.objectStore(STORE_NAME).index('weekIdentifier');
  const records = await promisifyRequest(index.getAll(weekIdentifier));
  return records.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * 取得指定日期區間（含頭尾）的所有記錄，依 registeredDate 排序。
 * 用途：月次檢視（該月 1 日～月底）、年次檢視（1/1～12/31）、匯出指定區間（對應規格 2.5、2.6）。
 * @param {string} startDate - 'YYYY-MM-DD'（含）
 * @param {string} endDate - 'YYYY-MM-DD'（含）
 * @returns {Promise<object[]>}
 */
export async function getAchievementsByDateRange(startDate, endDate) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.objectStore(STORE_NAME).index('registeredDate');
  const range = IDBKeyRange.bound(startDate, endDate);
  const records = await promisifyRequest(index.getAll(range));
  return records.sort((a, b) => (a.registeredDate < b.registeredDate ? -1 : 1));
}

/**
 * 取得全部記錄（用於全量匯出，對應規格 2.5）。
 * @returns {Promise<object[]>}
 */
export async function getAllAchievements() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  return promisifyRequest(tx.objectStore(STORE_NAME).getAll());
}

/**
 * 依關鍵字搜尋成就內容（對應規格 2.3）。
 * IndexedDB 沒有原生全文檢索，資料量級（個人日常記錄）不需要額外索引函式庫，
 * 直接取全部記錄後在記憶體中做 includes 比對即可。
 * @param {string} keyword
 * @returns {Promise<object[]>} 依 registeredDate 由新到舊排序
 */
export async function searchAchievements(keyword) {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const all = await getAllAchievements();
  const lowerKeyword = trimmed.toLowerCase();

  return all
    .filter((record) => record.content.toLowerCase().includes(lowerKeyword))
    .sort((a, b) => (a.registeredDate > b.registeredDate ? -1 : 1));
}

/**
 * 等待 transaction 完成（IDBTransaction 的 oncomplete/onerror 包裝成 Promise）。
 * @param {IDBTransaction} tx
 * @returns {Promise<void>}
 */
function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}
