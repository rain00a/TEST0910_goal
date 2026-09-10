/**
 * dateUtils.js
 * 月/年區間計算，以及週次／月份的前後位移邏輯。
 * 對應規格 2.6（月次/年次檢視）與畫面切換的上一頁/下一頁導覽需求。
 */

import { getISOWeek, getDateRangeOfISOWeek, formatDateISO } from './isoWeek.js';

/**
 * 取得指定年月（1 日至月底）的日期區間字串。
 * @param {number} year
 * @param {number} month - 1~12
 * @returns {{ startDate: string, endDate: string }}
 */
export function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // 傳入 0 號 = 上個月最後一天，即本月最後一天
  return { startDate: formatDateISO(start), endDate: formatDateISO(end) };
}

/**
 * 取得指定年份（1/1 至 12/31）的日期區間字串。
 * @param {number} year
 * @returns {{ startDate: string, endDate: string }}
 */
export function getYearRange(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  return { startDate: formatDateISO(start), endDate: formatDateISO(end) };
}

/**
 * 將年月往前/往後位移，正確處理跨年進位（如 2026-01 往前一個月 -> 2025-12）。
 * @param {number} year
 * @param {number} month - 1~12
 * @param {number} delta - 正數往後，負數往前
 * @returns {{ year: number, month: number }}
 */
export function shiftMonth(year, month, delta) {
  const zeroBasedTotal = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(zeroBasedTotal / 12);
  const newMonth = ((zeroBasedTotal % 12) + 12) % 12; // 避免負數取餘數的邊界問題
  return { year: newYear, month: newMonth + 1 };
}

/**
 * 將 weekIdentifier 往前/往後位移指定週數。
 * 實作方式：取得該週週一，位移 delta*7 天，再重新計算 ISO 週次
 * （不能直接對 'YYYY-Www' 字串的週數加減，會漏掉每年 52/53 週不固定的邊界）。
 * @param {string} weekIdentifier - 如 '2026-W36'
 * @param {number} delta - 正數往後，負數往前
 * @returns {string} 新的 weekIdentifier
 */
export function shiftWeekIdentifier(weekIdentifier, delta) {
  const { start } = getDateRangeOfISOWeek(weekIdentifier);
  const shifted = new Date(start);
  shifted.setDate(shifted.getDate() + delta * 7);
  return getISOWeek(shifted).weekIdentifier;
}
