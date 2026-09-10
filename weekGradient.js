/**
 * weekGradient.js
 * 依 weekIdentifier 決定卡片漸層色（對應規格第 5 節「色系依週次自動輪轉」）。
 * 用簡單雜湊而非遞增計數器，確保同一週不管何時渲染都拿到同一個漸層，
 * 且不需要額外儲存「這是第幾週」的狀態。
 */

const GRADIENT_PALETTE = [
  { name: '霓虹紫→深藍', css: 'linear-gradient(135deg, #7C3AED, #3A86FF)' },
  { name: '深藍→珊瑚粉', css: 'linear-gradient(135deg, #3A86FF, #F0568C)' },
  { name: '珊瑚粉→琥珀', css: 'linear-gradient(135deg, #F0568C, #F5A623)' },
  { name: '琥珀→翡翠', css: 'linear-gradient(135deg, #F5A623, #14B8A6)' },
  { name: '翡翠→霓虹紫', css: 'linear-gradient(135deg, #14B8A6, #7C3AED)' },
  { name: '深藍→翡翠', css: 'linear-gradient(135deg, #3A86FF, #14B8A6)' },
];

/**
 * 對字串做簡單雜湊（djb2 變體），僅用於決定色盤索引，非密碼學用途。
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * 取得指定週次對應的漸層 CSS 字串。
 * @param {string} weekIdentifier - 如 '2026-W36'
 * @returns {string} 可直接用於 background-image 的 CSS 漸層字串
 */
export function getWeekGradient(weekIdentifier) {
  const index = hashString(weekIdentifier) % GRADIENT_PALETTE.length;
  return GRADIENT_PALETTE[index].css;
}
