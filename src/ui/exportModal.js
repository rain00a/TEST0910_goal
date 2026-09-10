/**
 * exportModal.js
 * 匯出選項彈窗：全部 / 目前檢視區間 / 自訂區間 三選一（對應規格 2.5「一鍵匯出全部或指定區間」）。
 */

/**
 * 開啟匯出選項彈窗。
 * @param {{ currentRangeLabel: string }} options - currentRangeLabel 為目前檢視區間的顯示文字（如 '2026 年 9 月'）
 * @returns {Promise<{ mode: 'all'|'current'|'custom', startDate?: string, endDate?: string } | null>}
 *          使用者按「取消」時 resolve null
 */
export function openExportModal({ currentRangeLabel }) {
  return new Promise((resolve) => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
        <h2 id="export-modal-title">匯出成就記錄（.xlsx）</h2>

        <div class="export-options">
          <label class="export-option">
            <input type="radio" name="export-mode" value="all" checked />
            <span>全部資料</span>
          </label>
          <label class="export-option">
            <input type="radio" name="export-mode" value="current" />
            <span>目前檢視區間（${currentRangeLabel}）</span>
          </label>
          <label class="export-option">
            <input type="radio" name="export-mode" value="custom" />
            <span>自訂區間</span>
          </label>
        </div>

        <div id="custom-range-fields" class="custom-range-fields" hidden>
          <label class="modal-field">
            <span>起始日期</span>
            <input id="export-start-date" type="date" value="${todayStr}" />
          </label>
          <label class="modal-field">
            <span>結束日期</span>
            <input id="export-end-date" type="date" value="${todayStr}" />
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" id="export-cancel" class="btn-secondary">取消</button>
          <button type="button" id="export-confirm" class="btn-primary">匯出</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const customFieldsEl = overlay.querySelector('#custom-range-fields');
    const startDateEl = overlay.querySelector('#export-start-date');
    const endDateEl = overlay.querySelector('#export-end-date');

    overlay.querySelectorAll('input[name="export-mode"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        customFieldsEl.hidden = !overlay.querySelector('input[value="custom"]').checked;
      });
    });

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

    overlay.querySelector('#export-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    });

    overlay.querySelector('#export-confirm').addEventListener('click', () => {
      const mode = overlay.querySelector('input[name="export-mode"]:checked').value;

      if (mode === 'custom') {
        const startDate = startDateEl.value;
        const endDate = endDateEl.value;
        if (!startDate || !endDate) {
          startDateEl.classList.toggle('input-error', !startDate);
          endDateEl.classList.toggle('input-error', !endDate);
          return;
        }
        if (startDate > endDate) {
          endDateEl.classList.add('input-error');
          return;
        }
        cleanup();
        resolve({ mode, startDate, endDate });
        return;
      }

      cleanup();
      resolve({ mode });
    });
  });
}
