/**
 * main.js
 * 目前範圍：Phase 1-5（資料層、CRUD、週/月/年檢視、xlsx 匯出、搜尋、視覺風格）。
 * 對應規格第 5 節：週次膠囊時間軸、漸層卡片（於 achievementListView.js 套用）、新增動畫。
 */

import { getISOWeek } from './utils/isoWeek.js';
import { shiftWeekIdentifier, shiftMonth } from './utils/dateUtils.js';
import {
  addAchievement,
  updateAchievement,
  deleteAchievement,
  getAllAchievements,
  getAchievementsByDateRange,
} from './db/achievementRepo.js';
import { openAchievementModal } from './ui/modal.js';
import { openExportModal } from './ui/exportModal.js';
import { openSearchModal } from './ui/searchModal.js';
import { renderAchievementList } from './ui/achievementListView.js';
import { renderWeekCapsules } from './ui/weekCapsuleTimeline.js';
import { fireParticleBurst } from './ui/particleBurst.js';
import { loadWeekView } from './views/weekView.js';
import { loadMonthView } from './views/monthView.js';
import { loadYearView } from './views/yearView.js';
import { exportAchievementsToXlsx, buildExportFilename } from './export/xlsxExport.js';

const listEl = document.getElementById('achievement-list');
const emptyStateEl = document.getElementById('empty-state');
const viewLabelEl = document.getElementById('view-label');
const countLabelEl = document.getElementById('count-label');
const addBtn = document.getElementById('add-achievement-btn');
const exportBtn = document.getElementById('export-btn');
const searchBtn = document.getElementById('search-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const viewTabButtons = document.querySelectorAll('[data-view-tab]');
const capsuleTimelineEl = document.getElementById('week-capsule-timeline');

const now = new Date();

/** 檢視狀態：每種模式各自記住自己上次瀏覽到的位置，切換分頁不互相影響 */
const state = {
  view: 'week', // 'week' | 'month' | 'year'
  weekIdentifier: getISOWeek(now).weekIdentifier,
  year: now.getFullYear(),
  month: now.getMonth() + 1,
};

/**
 * 依目前 state.view 載入對應資料。
 * @returns {Promise<{ label: string, records: object[], totalCount: number|null }>}
 */
async function loadCurrentView() {
  if (state.view === 'week') return loadWeekView(state.weekIdentifier);
  if (state.view === 'month') return loadMonthView(state.year, state.month);
  return loadYearView(state.year);
}

/**
 * 重新載入並重繪當前檢視。
 */
async function render() {
  const { label, records, totalCount } = await loadCurrentView();

  viewLabelEl.textContent = label;

  if (totalCount === null) {
    countLabelEl.hidden = true;
  } else {
    countLabelEl.hidden = false;
    countLabelEl.textContent = `共 ${totalCount} 筆成就`;
  }

  renderAchievementList(listEl, emptyStateEl, records, { onItemClick: handleEdit });

  if (state.view === 'week') {
    capsuleTimelineEl.hidden = false;
    renderWeekCapsules(capsuleTimelineEl, state.weekIdentifier, (weekIdentifier) => {
      state.weekIdentifier = weekIdentifier;
      render();
    });
  } else {
    capsuleTimelineEl.hidden = true;
  }

  viewTabButtons.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.viewTab === state.view));
  });
}

async function handleAdd() {
  const result = await openAchievementModal();
  if (!result) return;

  await addAchievement(result);
  fireParticleBurst(addBtn);
  await render();
}

async function handleEdit(record) {
  const result = await openAchievementModal({
    record,
    onDelete: async () => {
      await deleteAchievement(record.id);
      await render();
    },
  });
  if (!result) return;

  await updateAchievement(record.id, result);
  await render();
}

async function handleExport() {
  const current = await loadCurrentView();

  const result = await openExportModal({ currentRangeLabel: current.label });
  if (!result) return;

  let records;
  let rangeDescription;

  if (result.mode === 'all') {
    records = await getAllAchievements();
    rangeDescription = '全部';
  } else if (result.mode === 'current') {
    records = current.records;
    rangeDescription = current.label.replace(/\s+/g, '');
  } else {
    records = await getAchievementsByDateRange(result.startDate, result.endDate);
    rangeDescription = `${result.startDate}~${result.endDate}`;
  }

  if (records.length === 0) {
    window.alert('這個範圍內沒有可匯出的資料');
    return;
  }

  exportAchievementsToXlsx(records, buildExportFilename(rangeDescription));
}

/**
 * 開啟搜尋彈窗，選中結果後跳轉至該筆記錄所屬的週次檢視（對應規格 2.3「搜尋結果可選擇跳轉至對應週次」）。
 */
async function handleSearch() {
  const record = await openSearchModal();
  if (!record) return;

  state.view = 'week';
  state.weekIdentifier = record.weekIdentifier;
  await render();
}

function handlePrev() {
  if (state.view === 'week') {
    state.weekIdentifier = shiftWeekIdentifier(state.weekIdentifier, -1);
  } else if (state.view === 'month') {
    Object.assign(state, shiftMonth(state.year, state.month, -1));
  } else {
    state.year -= 1;
  }
  render();
}

function handleNext() {
  if (state.view === 'week') {
    state.weekIdentifier = shiftWeekIdentifier(state.weekIdentifier, 1);
  } else if (state.view === 'month') {
    Object.assign(state, shiftMonth(state.year, state.month, 1));
  } else {
    state.year += 1;
  }
  render();
}

function handleViewTabClick(e) {
  const nextView = e.currentTarget.dataset.viewTab;
  if (nextView === state.view) return;
  state.view = nextView;
  render();
}

addBtn.addEventListener('click', handleAdd);
exportBtn.addEventListener('click', handleExport);
searchBtn.addEventListener('click', handleSearch);
prevBtn.addEventListener('click', handlePrev);
nextBtn.addEventListener('click', handleNext);
viewTabButtons.forEach((btn) => btn.addEventListener('click', handleViewTabClick));

render().catch((err) => {
  console.error('main.js: 初始載入失敗', err);
  listEl.innerHTML = `<p class="error-message">載入失敗：${err.message}</p>`;
});
