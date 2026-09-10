/**
 * weekCapsuleTimeline.js
 * 週次橫向膠囊時間軸（對應規格第 5 節「時間軸互動：主頁採用時間軸+週次膠囊橫向捲動設計，
 * 當週膠囊放大並發光」）。純週次檢視使用；月/年檢視維持簡單翻頁列。
 */

import { shiftWeekIdentifier } from '../utils/dateUtils.js';

const CAPSULES_BEFORE_AFTER = 4; // 目前週次前後各顯示幾顆膠囊

/**
 * 渲染以 centerWeekIdentifier 為中心的膠囊時間軸。
 * @param {HTMLElement} container
 * @param {string} centerWeekIdentifier
 * @param {(weekIdentifier: string) => void} onSelectWeek
 */
export function renderWeekCapsules(container, centerWeekIdentifier, onSelectWeek) {
  container.innerHTML = '';
  container.setAttribute('role', 'tablist');
  container.setAttribute('aria-label', '週次時間軸');

  for (let offset = -CAPSULES_BEFORE_AFTER; offset <= CAPSULES_BEFORE_AFTER; offset++) {
    const weekIdentifier =
      offset === 0 ? centerWeekIdentifier : shiftWeekIdentifier(centerWeekIdentifier, offset);
    const isCurrent = offset === 0;

    const capsule = document.createElement('button');
    capsule.type = 'button';
    capsule.className = `week-capsule${isCurrent ? ' week-capsule--current' : ''}`;
    capsule.textContent = weekIdentifier.replace(/^\d{4}-/, ''); // 只顯示 'W36'，年份留給標籤區
    capsule.setAttribute('role', 'tab');
    capsule.setAttribute('aria-selected', String(isCurrent));
    capsule.dataset.weekIdentifier = weekIdentifier;

    capsule.addEventListener('click', () => onSelectWeek(weekIdentifier));

    container.appendChild(capsule);
  }

  // 將當週膠囊捲動至可視範圍中央
  const currentEl = container.querySelector('.week-capsule--current');
  currentEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}
