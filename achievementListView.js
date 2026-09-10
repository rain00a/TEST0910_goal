/**
 * achievementListView.js
 * 三種檢視模式（週/月/年）共用的清單渲染邏輯：依 registeredDate 分組顯示，
 * 每筆卡片依所屬週次套用漸層色（對應規格第 5 節「漸層卡片設計」）。
 */

import { getWeekGradient } from './weekGradient.js';

/**
 * 將記錄依 registeredDate 分組，並依日期由舊到新排序。
 * @param {object[]} records
 * @returns {Map<string, object[]>}
 */
function groupByDate(records) {
  const groups = new Map();
  for (const record of records) {
    if (!groups.has(record.registeredDate)) {
      groups.set(record.registeredDate, []);
    }
    groups.get(record.registeredDate).push(record);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
}

/**
 * 將記錄陣列渲染到指定容器，依日期分組、每筆可點擊觸發 onItemClick。
 * @param {HTMLElement} container - 清單容器（會被清空重繪）
 * @param {HTMLElement} emptyStateEl - 無資料時顯示的提示元素
 * @param {object[]} records
 * @param {{ onItemClick: (record: object) => void }} handlers
 */
export function renderAchievementList(container, emptyStateEl, records, { onItemClick }) {
  container.innerHTML = '';

  if (records.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }
  emptyStateEl.hidden = true;

  const grouped = groupByDate(records);
  for (const [date, dayRecords] of grouped) {
    const dayGroup = document.createElement('div');
    dayGroup.className = 'day-group';

    const dayHeading = document.createElement('h3');
    dayHeading.className = 'day-heading';
    dayHeading.textContent = date;
    dayGroup.appendChild(dayHeading);

    const dayList = document.createElement('ul');
    dayList.className = 'day-list';
    for (const record of dayRecords) {
      dayList.appendChild(createAchievementItem(record, onItemClick));
    }
    dayGroup.appendChild(dayList);

    container.appendChild(dayGroup);
  }
}

/**
 * @param {object} record
 * @param {(record: object) => void} onItemClick
 * @returns {HTMLElement}
 */
function createAchievementItem(record, onItemClick) {
  const item = document.createElement('li');
  item.className = 'achievement-item';
  item.style.backgroundImage = getWeekGradient(record.weekIdentifier);
  item.textContent = record.content;
  item.tabIndex = 0;
  item.setAttribute('role', 'button');
  item.setAttribute('aria-label', `編輯成就：${record.content}`);

  const trigger = () => onItemClick(record);
  item.addEventListener('click', trigger);
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      trigger();
    }
  });

  return item;
}
