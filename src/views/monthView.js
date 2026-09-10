/**
 * monthView.js
 * 月次檢視（對應規格 2.6）：統計該月 1 日至月底的所有成就，並回傳該月總數。
 */

import { getAchievementsByDateRange } from '../db/achievementRepo.js';
import { getMonthRange } from '../utils/dateUtils.js';

/**
 * @param {number} year
 * @param {number} month - 1~12
 * @returns {Promise<{ label: string, records: object[], totalCount: number }>}
 */
export async function loadMonthView(year, month) {
  const { startDate, endDate } = getMonthRange(year, month);
  const records = await getAchievementsByDateRange(startDate, endDate);
  return {
    label: `${year} 年 ${month} 月`,
    records,
    totalCount: records.length,
  };
}
