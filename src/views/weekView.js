/**
 * weekView.js
 * 週次檢視（對應規格 2.2、2.6）：載入指定 weekIdentifier 的資料。
 * 純資料層，不碰 DOM——渲染交由 main.js 統一處理，三種檢視共用同一套渲染邏輯。
 */

import { getAchievementsByWeek } from '../db/achievementRepo.js';

/**
 * @param {string} weekIdentifier - 如 '2026-W36'
 * @returns {Promise<{ label: string, records: object[], totalCount: number|null }>}
 *          週次檢視不顯示總數統計（該功能屬於月/年檢視，見規格 2.6），totalCount 固定為 null
 */
export async function loadWeekView(weekIdentifier) {
  const records = await getAchievementsByWeek(weekIdentifier);
  return {
    label: weekIdentifier,
    records,
    totalCount: null,
  };
}
