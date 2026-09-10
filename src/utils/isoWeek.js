/**
 * isoWeek.js
 * ISO 8601 年度週次計算工具。
 *
 * ISO 8601 規則重點：
 * - 一週從星期一開始，星期日結束
 * - 每年的第 1 週，是「包含該年第一個星期四」的那一週
 * - 換句話說：12/29~12/31 有可能屬於隔年的第 1 週；1/1~1/3 有可能屬於前一年的最後一週
 *   （這就是本模組刻意寫測試涵蓋跨年邊界的原因）
 */

/**
 * 將輸入正規化為當地時間 00:00:00 的 Date 物件（去除時分秒誤差）。
 * @param {Date|string} input - Date 物件，或 'YYYY-MM-DD' 格式字串
 * @returns {Date}
 */
function toLocalMidnight(input) {
  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }
  // 'YYYY-MM-DD' 字串：手動解析，避免 new Date('YYYY-MM-DD') 被當成 UTC 解讀
  // 而在部分時區（如 UTC+8）造成日期少一天的常見錯誤
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
  if (!match) {
    throw new Error(`isoWeek: 無法解析日期字串 "${input}"，預期格式為 YYYY-MM-DD`);
  }
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/**
 * 計算指定日期所屬的 ISO 8601 年度週次。
 * @param {Date|string} input - Date 物件，或 'YYYY-MM-DD' 格式字串
 * @returns {{ isoYear: number, isoWeek: number, weekIdentifier: string }}
 *          isoYear 為 ISO 週所屬年份（可能與日曆年不同，見跨年邊界說明）
 *          weekIdentifier 格式如 '2026-W35'（週數固定補零至 2 位）
 */
export function getISOWeek(input) {
  const date = toLocalMidnight(input);

  // 轉換為「以星期一為一週第一天」的星期數：1(一)~7(日)
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

  // 移動到當週的星期四：ISO 週的年份，就是該週星期四所在的年份
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + (4 - dayOfWeek));
  const isoYear = thursday.getFullYear();

  // 該 ISO 年的第 1 週星期四
  const jan4 = new Date(isoYear, 0, 4);
  const jan4DayOfWeek = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const firstThursday = new Date(jan4);
  firstThursday.setDate(jan4.getDate() + (4 - jan4DayOfWeek));

  // 週數 = 兩個星期四之間相差幾週 + 1
  const diffDays = Math.round((thursday - firstThursday) / 86400000);
  const isoWeek = Math.floor(diffDays / 7) + 1;

  const weekIdentifier = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;

  return { isoYear, isoWeek, weekIdentifier };
}

/**
 * 反算：給定 weekIdentifier（如 '2026-W35'），回傳該週的起訖日期（週一～週日）。
 * 用途：月/年檢視需要判斷某週是否落在指定月份/年份區間時，或 UI 需要顯示週期範圍時使用。
 * @param {string} weekIdentifier - 格式如 '2026-W35'
 * @returns {{ start: Date, end: Date }} start 為週一 00:00，end 為週日 00:00
 */
export function getDateRangeOfISOWeek(weekIdentifier) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekIdentifier);
  if (!match) {
    throw new Error(`isoWeek: 無法解析 weekIdentifier "${weekIdentifier}"，預期格式為 YYYY-Www`);
  }
  const isoYear = Number(match[1]);
  const isoWeek = Number(match[2]);

  const jan4 = new Date(isoYear, 0, 4);
  const jan4DayOfWeek = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - (jan4DayOfWeek - 1));

  const start = new Date(firstMonday);
  start.setDate(firstMonday.getDate() + (isoWeek - 1) * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}

/**
 * 將 Date 物件格式化為 'YYYY-MM-DD'（本地時間，不受時區位移影響）。
 * @param {Date} date
 * @returns {string}
 */
export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
