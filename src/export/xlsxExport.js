/**
 * xlsxExport.js
 * xlsx 匯出功能（對應規格 2.5、第 4 節技術決策：SheetJS）。
 * 依賴全域 window.XLSX，需在 index.html 以 <script> 標籤載入 SheetJS CDN 版本
 * （ESM 環境下用 import 载入 SheetJS 在部分 CDN 版本上有相容性問題，
 *  故採用官方建議的傳統 <script> 全域載入方式，穩定性較高）。
 */

/**
 * 將成就記錄陣列匯出為 .xlsx 檔案並觸發瀏覽器下載。
 * 匯出欄位對應規格 2.5：登記日期、年度週次、成就內容、建立時間戳。
 * @param {object[]} records
 * @param {string} filename - 含副檔名，如 '成就記錄_全部_20260907.xlsx'
 */
export function exportAchievementsToXlsx(records, filename) {
  if (typeof window.XLSX === 'undefined') {
    throw new Error('xlsxExport: 找不到 XLSX（SheetJS），請確認 index.html 已載入 CDN script');
  }

  const rows = records
    .slice()
    .sort((a, b) => {
      if (a.registeredDate !== b.registeredDate) {
        return a.registeredDate < b.registeredDate ? -1 : 1;
      }
      return a.createdAt - b.createdAt;
    })
    .map((r) => ({
      登記日期: r.registeredDate,
      年度週次: r.weekIdentifier,
      成就內容: r.content,
      建立時間戳: formatTimestamp(r.createdAt),
    }));

  const worksheet = window.XLSX.utils.json_to_sheet(rows);
  // 依內容概略設定欄寬，避免中文內容被截斷顯示
  worksheet['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 50 }, { wch: 20 }];

  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, '成就記錄');
  window.XLSX.writeFile(workbook, filename);
}

/**
 * 將 timestamp 格式化為可讀的 'YYYY-MM-DD HH:mm:ss'（本地時間）。
 * @param {number} timestamp
 * @returns {string}
 */
function formatTimestamp(timestamp) {
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 產生匯出檔名。
 * @param {string} rangeDescription - 如 '全部'、'2026-08-31~2026-09-06'
 * @returns {string}
 */
export function buildExportFilename(rangeDescription) {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const exportedAt = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;
  return `成就記錄_${rangeDescription}_${exportedAt}.xlsx`;
}
