/**
 * searchModal.js
 * 關鍵字搜尋彈窗（對應規格 2.3）：即時搜尋成就內容，選擇結果可跳轉至對應週次。
 */

import { searchAchievements } from '../db/achievementRepo.js';

/**
 * 開啟搜尋彈窗。
 * @returns {Promise<object|null>} 使用者點選某筆結果時 resolve 該筆記錄；
 *          按「關閉」、Esc、或點擊遮罩時 resolve null
 */
export function openSearchModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box search-modal-box" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">
        <h2 id="search-modal-title">搜尋成就</h2>
        <input id="search-input" type="search" placeholder="輸入關鍵字…" autocomplete="off" />
        <ul id="search-results" class="search-results"></ul>
        <p id="search-empty" class="empty-state" hidden>找不到符合的記錄</p>
        <div class="modal-actions">
          <button type="button" id="search-close" class="btn-secondary">關閉</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const inputEl = overlay.querySelector('#search-input');
    const resultsEl = overlay.querySelector('#search-results');
    const emptyEl = overlay.querySelector('#search-empty');

    function cleanup() {
      overlay.remove();
      document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    }
    document.addEventListener('keydown', onKeydown);

    overlay.querySelector('#search-close').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    });

    function selectRecord(record) {
      cleanup();
      resolve(record);
    }

    function renderResults(matches) {
      resultsEl.innerHTML = '';

      for (const record of matches) {
        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.tabIndex = 0;
        li.setAttribute('role', 'button');

        const dateSpan = document.createElement('span');
        dateSpan.className = 'search-result-date';
        dateSpan.textContent = `${record.registeredDate}（${record.weekIdentifier}）`;

        const contentSpan = document.createElement('span');
        contentSpan.className = 'search-result-content';
        contentSpan.textContent = record.content; // textContent 自動跳脫，避免內容中的特殊字元被當成 HTML

        li.append(dateSpan, contentSpan);
        li.addEventListener('click', () => selectRecord(record));
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectRecord(record);
          }
        });

        resultsEl.appendChild(li);
      }
    }

    async function runSearch() {
      const keyword = inputEl.value;

      if (!keyword.trim()) {
        resultsEl.innerHTML = '';
        emptyEl.hidden = true;
        return;
      }

      const matches = await searchAchievements(keyword);

      if (matches.length === 0) {
        resultsEl.innerHTML = '';
        emptyEl.hidden = false;
        return;
      }

      emptyEl.hidden = true;
      renderResults(matches);
    }

    inputEl.addEventListener('input', () => {
      runSearch().catch((err) => console.error('searchModal: 搜尋失敗', err));
    });

    inputEl.focus();
  });
}
