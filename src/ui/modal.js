/**
 * modal.js
 * 新增／編輯成就的彈窗元件（對應規格 2.1、2.6.2）。
 * 採 Promise-based API，呼叫端不需理解 DOM 細節。
 */

/**
 * 開啟新增／編輯彈窗。
 * @param {object} [options]
 * @param {{ id: string, content: string, registeredDate: string }} [options.record]
 *        傳入時為「編輯模式」並帶入既有內容；不傳則為「新增模式」
 * @param {() => Promise<void>|void} [options.onDelete]
 *        傳入時，編輯模式會顯示刪除按鈕；點擊後先跳二次確認，確認後才呼叫
 * @returns {Promise<{ content: string, registeredDate: string } | null>}
 *          使用者按「儲存」時，resolve 表單資料；按「取消」或關閉時，resolve null
 */
export function openAchievementModal({ record, onDelete } = {}) {
  return new Promise((resolve) => {
    const isEdit = Boolean(record);
    const today = new Date();
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">${isEdit ? '編輯成就' : '新增成就'}</h2>
        <label class="modal-field">
          <span>今天做了什麼</span>
          <textarea id="modal-content" rows="3" maxlength="500"></textarea>
        </label>
        <label class="modal-field">
          <span>登記日期</span>
          <input id="modal-date" type="date" />
        </label>
        <div class="modal-actions">
          ${isEdit && onDelete ? '<button type="button" id="modal-delete" class="btn-danger">刪除</button>' : ''}
          <button type="button" id="modal-cancel" class="btn-secondary">取消</button>
          <button type="button" id="modal-save" class="btn-primary">儲存</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const contentEl = overlay.querySelector('#modal-content');
    const dateEl = overlay.querySelector('#modal-date');
    contentEl.value = record?.content ?? '';
    dateEl.value = record?.registeredDate ?? defaultDate;

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

    overlay.querySelector('#modal-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    overlay.addEventListener('click', (e) => {
      // 點擊遮罩本身（非內容框）視同取消
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    });

    overlay.querySelector('#modal-save').addEventListener('click', () => {
      const content = contentEl.value.trim();
      const registeredDate = dateEl.value;

      if (!content) {
        contentEl.focus();
        contentEl.classList.add('input-error');
        return;
      }
      if (!registeredDate) {
        dateEl.focus();
        dateEl.classList.add('input-error');
        return;
      }

      cleanup();
      resolve({ content, registeredDate });
    });

    const deleteBtn = overlay.querySelector('#modal-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        // 刪除需二次確認（對應規格 2.4），此處用原生 confirm 先求功能正確，
        // Phase 5 視覺優化階段可換成風格統一的自訂確認彈窗
        const confirmed = window.confirm('確定要刪除這筆成就記錄嗎？此操作無法復原。');
        if (!confirmed) return;

        cleanup();
        await onDelete();
        resolve(null);
      });
    }

    contentEl.focus();
  });
}
