# 🎯 HR 活動抽籤與團隊智慧分組助手

> **HR Lucky Draw & Smart Team Grouping Assistant**  
> 專為公司尾牙、Team Building、教育訓練與人資活動設計的一站式活動輔助工具。

---

## 🌟 核心特色

- 📋 **名單管理 (Roster Management)**
  - 支援 **CSV 檔案匯入 / 匯出** 與標準範本下載。
  - 支援**純文字批次貼上**（快速由 Excel / 記事本複製貼上）。
  - 即時統計總人數、性別比例、部門分佈。
  - 支援一鍵載入示範資料與名單清空。

- 🎁 **隨機抽籤 (Lucky Draw)**
  - 支援單抽與批次多連抽（自訂單次抽取數量）。
  - 彈性抽籤規則：支援**不重複抽籤（排除已中獎者）**與**允許重複抽籤**。
  - 支援獎品類別管理（大獎、二獎、加碼獎等）。
  - 內建華麗**彩帶特效 (Canvas Confetti)** 與**互動音效 (Web Audio API)**。
  - 完整中獎歷程記錄與 CSV 匯出功能。

- 👥 **智慧分組 (Smart Grouping)**
  - 兩種分組模式：**依指定組數分配** 或 **依每組人數分配**。
  - **進階平衡算法**：
    - 👫 性別平衡（盡可能平均分配男女比例）。
    - 🏢 部門混合（避免同部門過度集中同一組）。
  - 視覺化團隊卡片與一鍵匯出分組名單 (CSV)。

- 🔒 **本地端安全與隱私 (Privacy-First)**
  - 所有名單與抽獎資料完全在瀏覽器端（LocalStorage）運算與儲存。
  - 無需上傳個資至外部伺服器，安全無外洩風險。

---

## 🛠️ 技術棧 (Tech Stack)

| 類別 | 技術 / 工具 | 說明 |
| :--- | :--- | :--- |
| **核心框架** | [React 19](https://react.dev/) | 現代化 React UI 與 Hooks 架構 |
| **程式語言** | [TypeScript](https://www.typescriptlang.org/) | 強型別支援與靜態檢查 |
| **建置工具** | [Vite 6](https://vite.dev/) | 超高速模組熱替換 (HMR) 與打包 |
| **樣式設計** | [Tailwind CSS v4](https://tailwindcss.com/) | 新世代原子化 CSS 與現代漸層設計 |
| **圖示庫** | [Lucide React](https://lucide.dev/) | 簡潔現代的向量圖示 |
| **特效 / 音效** | Canvas Confetti & Web Audio API | 無依賴的輕量彩帶與音效合成 |
| **CI / CD** | GitHub Actions | 自動化建置與 GitHub Pages 一鍵部署 |

---

## 🚀 快速開始 (Quick Start)

### 1. 環境需求
請確認本機已安裝 **Node.js (建議 v20.x 或 LTS 版本)** 與 **npm**。

```bash
node -v # 建議 >= 18.0.0
npm -v
```

### 2. 安裝依賴套件
```bash
npm install
```

### 3. 本地開發伺服器
```bash
npm run dev
```
啟動後在瀏覽器開啟提示的網址（預設為 `http://localhost:5173` 或 `http://localhost:3000`）。

### 4. 專案建置 (Production Build)
```bash
# 執行 TypeScript 型別檢查並打包輸出至 dist/ 目錄
npm run build
```

### 5. 本地預覽建置成果
```bash
npm run preview
```

### 6. 型別檢查 (Type Check)
```bash
npm run lint
```

---

## 🚀 GitHub Actions 自動部署指南

專案已內建 `.github/workflows/deploy.yml`，每次推送程式碼至 `main` 分支時，將自動執行型別檢查、打包並部署至 **GitHub Pages**。

### 啟用 GitHub Pages 設定步驟：
1. 將專案 Push 至 GitHub 儲存庫。
2. 進入 GitHub 專案頁面，點擊上方 **Settings**。
3. 在左側選單選擇 **Pages**。
4. 在 **Build and deployment** > **Source** 下拉選單中，選擇 **GitHub Actions**。
5. 之後每次 `git push` 到 `main`（或在 Actions 頁面手動觸發 `workflow_dispatch`），GitHub Actions 即會自動完成部署並提供專屬上線網址！

---

## 📂 專案結構 (Project Structure)

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自動部署設定檔
├── src/
│   ├── components/             # 功能組件
│   │   ├── Header.tsx          # 頂部導覽列、音效切換與資料重置
│   │   ├── RosterManager.tsx   # 名單管理 (CSV 匯入/文字貼上/手動新增)
│   │   ├── LuckyDraw.tsx       # 隨機抽獎 (單抽/多抽/重複與不重複/音效與彩帶)
│   │   └── AutoGrouping.tsx    # 智慧分組 (組數/人數/性別平衡/部門混合)
│   ├── utils/                  # 工具函式
│   │   ├── csvParser.ts        # CSV 解析與匯出
│   │   ├── demoData.ts         # 示範資料
│   │   └── sound.ts            # Web Audio 抽獎音效合成器
│   ├── types.ts                # 全域 TypeScript 介面定義
│   ├── App.tsx                 # 根組件與狀態管理
│   ├── main.tsx                # 應用程式入口
│   └── index.css               # 全域樣式與 Tailwind CSS 載入
├── .env.example                # 環境變數範本
├── .gitignore                  # Git 忽略檔案清單
├── index.html                  # HTML 模板
├── package.json                # 專案相依性與指令設定
├── tsconfig.json               # TypeScript 編譯設定
└── vite.config.ts              # Vite 設定檔 (含相對路徑 base 配置)
```

---

## 📄 授權條款 (License)
本專案採用 [Apache-2.0](LICENSE) 開源授權。
