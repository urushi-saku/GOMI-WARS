# 🌍 GOMI-WARS（ゴミ・ウォーズ）

**地球規模のリアル陣取りゲーム** 〜 ゴミを拾って、あなたのチームの領土を広げよう！

![License](https://img.shields.io/badge/license-MIT-blue)
![Node.js](https://img.shields.io/badge/Node.js-v20+-green)
![React](https://img.shields.io/badge/React-18+-blue)

---

## 📖 プロジェクト概要

**GOMI-WARS** は、現実世界でゴミを拾い、その写真をアップロードすることで、Google マップ上のエリアを自分のチームカラーで染めていく **現実連動型の巨大陣取り Web アプリ** です。

### 🎮 コンセプト

「**地球の清掃活動**」という究極のソーシャルグッドを、「**スプラトゥーンのような陣取りゲーム**」というエンタメに変換します。

- 🌐 **スケール**：対象エリアは地球全体。世界中のユーザーが参加できるグローバルプラットフォーム。
- 🎯 **行動変容**：「あの駅前、敵チームに占領されてるからゴミ拾いに行ってくるわ」という、現実世界の行動を変える面白さ。
- 🤖 **AI 判定**：アップロードされた写真を Gemini API で自動判定し、ゴミの種類とポイントを算出。

---

## 🛠️ 技術スタック

### フロントエンド
- **React 18** + **TypeScript**
- **Vite** - 高速ビルドツール
- **Google Maps API** - 地図表示と領土塗り分け
- **Firebase Authentication** - ユーザー認証
- **Tailwind CSS** - UI スタイリング

### バックエンド
- **Node.js** + **Express**
- **TypeScript** - 型安全性
- **Firebase Admin SDK** - リアルタイムデータ同期
- **Gemini API** - AI 画像認識（ゴミ種別・ポイント判定）

### インフラ・デプロイ
- **Firebase** - Firestore（DB）、Cloud Storage（画像保存）、Authentication
- **Render** - バックエンドサーバーのホスティング
- **Vercel** - フロントエンドのホスティング

---

## 🚀 クイックスタート

### 前提条件
- Node.js v20 以上
- Git
- npm または yarn

### インストール

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/urushi-saku/GOMI-WARS.git
   cd GOMI-WARS
   ```

2. **依存パッケージをインストール**
   ```bash
   # フロントエンド
   cd frontend
   npm install

   # バックエンド
   cd ../backend
   npm install
   ```

3. **環境変数を設定**
   ```bash
   cd ../frontend
   cp .env.example .env.local
   ```
   `.env.local` に Firebase と API の認証情報を記入してください。

4. **開発サーバーを起動**
   ```bash
   # ターミナル 1: フロントエンド（ポート 5173）
   cd frontend
   npm run dev

   # ターミナル 2: バックエンド（ポート 3001）
   cd backend
   npm run dev
   ```

詳細は [SETUP.md](./SETUP.md) を参照してください。

---

## ✨ 主な機能

| 機能 | 説明 |
|---|---|
| 🔐 **ユーザー認証** | Email/Password での登録・ログイン |
| 📸 **ゴミ写真査定** | 写真をアップロード → Gemini AI が自動判定 |
| 🗺️ **リアルタイム領土管理** | Google Maps 上でチームの領土を表示・更新 |
| 🏆 **ランキング** | チーム・ユーザーの獲得ポイントでランク表示 |
| 👤 **プロフィール管理** | ユーザー情報・獲得ポイント・拾ったゴミ一覧を表示 |
| 💬 **リアルタイム同期** | Firestore により複数ユーザー間でデータを動的に同期 |

---

## 📁 ファイル構成

詳細は [STRUCTURE.md](./STRUCTURE.md) を参照してください。

```
GOMI-WARS/
├── backend/           # Express バックエンドサーバー
├── frontend/          # React フロントエンドアプリ
├── firebase.json      # Firebase 設定ファイル
├── firestore.rules    # Firestore セキュリティルール
├── storage.rules      # Cloud Storage セキュリティルール
├── SETUP.md           # 開発環境セットアップ手順
└── STRUCTURE.md       # プロジェクト構成詳細
```

---

## 🤝 チーム情報 & 貢献方法

### チーム
このプロジェクトは複数の開発者によるチーム開発で進められています。

### 貢献方法

1. **自分専用ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **変更をコミット**
   ```bash
   git add .
   git commit -m "feat: 簡潔な説明"
   ```

3. **変更をプッシュ**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Pull Request を作成**
   - GitHub でPR を作成し、レビューを申し込んでください
   - レビューが承認されたら `main` ブランチにマージします

### コーディング規約
- TypeScript での型定義は必須
- ESLint と Prettier で自動フォーマット実施
- コミットメッセージは Conventional Commits に従う

---

## 📞 質問・トラブルシューティング

- **セットアップがうまくいかない** → [SETUP.md](./SETUP.md) の手順を再確認
- **ファイル構成がわからない** → [STRUCTURE.md](./STRUCTURE.md) で詳細説明
- **バグを見つけた** → Issue を報告 or チームメンバーに相談

---

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

---

**Happy Cleanup! 🌍🧹**
