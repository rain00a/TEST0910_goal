/**
 * yearView.js
 * 年次檢視（對應規格 2.6）：統計該年 1/1 至 12/31 的所有成就，並回傳該年總數。
 */

import { getAchievementsByDateRange } from '../db/achievementRepo.js';
import { getYearRange } from '../utils/dateUtils.js';

/**
 * @param {number} year
 * @returns {Promise<{ label: string, records: object[], totalCount: number }>}
 */
export async function loadYearView(year) {
  const { startDate, endDate } = getYearRange(year);
  const records = await getAchievementsByDateRange(startDate, endDate);
  return {
    label: `${year} 年`,
    records,
    totalCount: records.length,
  };
}
