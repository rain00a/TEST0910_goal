# 成就記錄 App

每日個人成就登記的網頁 App。純前端、無後端伺服器，資料儲存在瀏覽器本地 IndexedDB。
完整產品規格見 `PRODUCT_SPEC_WEB_26-0903.md`。

## 本地開發

**重要：不能直接雙擊開啟 `index.html`。**

本專案用 ES Modules（`<script type="module">`）組織程式碼，瀏覽器基於安全性限制，
會擋掉透過 `file://` 協定載入的模組（CORS 限制，Chrome/Firefox/Safari 皆然），
直接開啟會在 console 看到類似 `Cross origin requests are only supported for HTTP.` 的錯誤。

請先啟動一個本地靜態伺服器，例如以下任一種方式：

```bash
# 方式一：不需安裝，用 Node.js 內建的 npx
npx serve .

# 方式二：用 Python（大多數作業系統已內建）
python3 -m http.server 8000
```

啟動後用瀏覽器開啟終端機顯示的網址（通常是 `http://localhost:8000` 或 `http://localhost:3000`）。

## 部署到 GitHub Pages

本專案是純靜態網頁，不需要任何建置（build）步驟，可以直接部署。

1. 在 GitHub 建立一個新的 repository（可以是 public 或 private，Pages 對兩者都支援，
   但 private repo 需要付費方案才能開啟 Pages）
2. 在專案根目錄（也就是這個 `index.html` 所在的目錄）執行：
   ```bash
   git init
   git add .
   git commit -m "Initial commit: 成就記錄 App"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<repo名稱>.git
   git push -u origin main
   ```
3. 到 GitHub repo 頁面 → **Settings** → 左側選單 **Pages**
4. 「Build and deployment」的 **Source** 選擇 **Deploy from a branch**
5. **Branch** 選擇 `main`，資料夾選擇 `/ (root)`，按 **Save**
6. 等待約 1 分鐘，重新整理該頁面，會出現「Your site is live at
   `https://<你的帳號>.github.io/<repo名稱>/`」的網址，點進去即可使用

之後每次 `git push` 到 `main` 分支，GitHub Pages 都會自動重新部署，不需要手動操作。

## 專案結構

```
index.html
.nojekyll          # 避免 GitHub Pages 用 Jekyll 處理這個純靜態專案
styles/
  theme.css        # 色彩、字體、元件視覺風格
  layout.css       # 版面定位、響應式斷點
src/
  main.js          # 主程式，串接所有模組
  db/
    db.js              # IndexedDB 初始化
    achievementRepo.js  # CRUD 封裝
  utils/
    isoWeek.js       # ISO 8601 週次計算
    dateUtils.js     # 月/年區間、週次/月份位移
  views/
    weekView.js
    monthView.js
    yearView.js
  ui/
    modal.js               # 新增/編輯彈窗
    exportModal.js          # 匯出選項彈窗
    searchModal.js          # 搜尋彈窗
    achievementListView.js   # 清單渲染（依日期分組、套用週次漸層）
    weekCapsuleTimeline.js    # 週次膠囊時間軸
    weekGradient.js           # 週次漸層色計算
    particleBurst.js          # 新增成就的粒子動畫
  export/
    xlsxExport.js    # xlsx 匯出（SheetJS 整合）
```

## 資料備份提醒

資料只存在單一瀏覽器的 IndexedDB 中，清除瀏覽器快取或更換瀏覽器/裝置會導致資料遺失。
建議養成定期使用「匯出 .xlsx」功能備份資料的習慣。
