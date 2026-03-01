# GOMI-WARS ファイル構成と役割

## ディレクトリ全体図

```
GOMI-WARS/
├── frontend/          # React フロントエンド（Vite + TypeScript）
├── functions/         # Firebase Cloud Functions（TypeScript）
├── firebase.json      # Firebase プロジェクト統合設定
├── .firebaserc        # Firebase プロジェクトID
├── firestore.rules    # Firestore セキュリティルール
├── firestore.indexes.json  # Firestore 複合インデックス定義
├── storage.rules      # Cloud Storage セキュリティルール
├── package.json       # ルートの便利コマンド集
├── .gitignore         # Git 管理除外ファイルの定義
└── README.md          # プロジェクト概要
```

---

## ルートファイル

| ファイル | 役割 |
|---|---|
| `firebase.json` | Firebase の全サービス（Hosting / Functions / Firestore / Storage / Emulators）の設定をまとめたメインの設定ファイル |
| `.firebaserc` | `firebase use` で切り替えるプロジェクトIDを管理。`your-firebase-project-id` を実際のIDに書き換える |
| `firestore.rules` | Firestore のアクセス権限ルール。「本人のみ書き込み可」「認証済みなら閲覧可」などを定義 |
| `firestore.indexes.json` | Firestore で複合クエリ（例：userId + createdAt）を使うときに必要なインデックスの定義 |
| `storage.rules` | Cloud Storage のアクセス権限ルール。画像のみ・10MB以下・本人のみアップロード可などを定義 |
| `package.json` | `npm run dev` / `npm run emulators` など、プロジェクト全体で使う便利コマンドを定義 |
| `.gitignore` | `.env.local`（APIキー等）や `node_modules/`・ビルド成果物を Git に含めないよう除外設定 |

---

## frontend/ （React アプリ本体）

```
frontend/
├── src/
│   ├── main.tsx          # エントリーポイント
│   ├── App.tsx           # ルートコンポーネント
│   ├── App.css           # App コンポーネントのスタイル
│   ├── index.css         # グローバルスタイル
│   ├── lib/
│   │   └── firebase.ts   # Firebase 初期化・各サービスのエクスポート
│   ├── types/
│   │   └── index.ts      # 型定義（Pickup / UserProfile / AssessmentResult など）
│   └── assets/
│       └── react.svg     # React ロゴ（デフォルト）
├── public/
│   └── vite.svg          # Vite ロゴ（デフォルト）
├── index.html            # SPA のエントリーHTML
├── vite.config.ts        # Vite のビルド設定
├── tsconfig.json         # TypeScript 設定（ルート）
├── tsconfig.app.json     # TypeScript 設定（アプリコード用）
├── tsconfig.node.json    # TypeScript 設定（vite.config.ts 等ビルド用スクリプト）
├── eslint.config.js      # ESLint のコード品質チェック設定
├── package.json          # フロントエンドの依存パッケージと npm スクリプト
└── .env.example          # 環境変数のテンプレート（実際の値は .env.local に記載）
```

### 重要ファイルの詳細

#### `src/lib/firebase.ts`
Firebase の初期化を行い、各サービスのインスタンスをエクスポートする。
アプリ全体でこのファイルから `auth` / `db` / `storage` / `functions` をインポートして使う。

```ts
import { db } from '@/lib/firebase'
```

#### `src/types/index.ts`
Firestore に保存するデータの TypeScript 型定義。
`Pickup`（ゴミ拾い記録）/ `UserProfile`（ユーザー情報）/ `AssessmentResult`（Gemini 査定結果）などを定義。

#### `.env.example` → `.env.local` にコピーして使う
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
（など）
```
`VITE_` プレフィックスが付いた変数だけがブラウザから参照できる。

---

## functions/ （Cloud Functions）

```
functions/
├── src/
│   └── index.ts      # Cloud Functions の実装本体
├── tsconfig.json     # TypeScript 設定（CommonJS ターゲット）
├── package.json      # Functions の依存パッケージ（firebase-admin など）
└── .secret.example   # シークレット（Gemini APIキー）のテンプレート
```

### 重要ファイルの詳細

#### `src/index.ts`
Cloud Functions の実装本体。現在定義している関数：

| 関数名 | 種類 | 役割 |
|---|---|---|
| `assessGarbage` | `onCall` (HTTPS) | ゴミ画像を受け取り、Gemini 2.0 Flash で査定してポイント・カテゴリ・コメントを返す |

APIキー（`GEMINI_API_KEY`）はフロントエンドに公開せず、Cloud Functions のシークレットで安全に管理する。

#### `.secret.example` → `.secret.local` にコピーして使う（エミュレータ用）
```
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## セキュリティの設計方針

```
ユーザー（ブラウザ）
    │
    ├─── Firestore/Storage ────── firestore.rules / storage.rules で認証チェック
    │
    └─── Cloud Functions ──────── 認証チェック後 → Gemini API を安全に呼び出す
                                  （APIキーはサーバー側にのみ存在）
```

- **Gemini API キー**は `functions/.secret.local`（ローカル）または Firebase Secrets（本番）で管理し、フロントエンドのコードには一切含めない
- **Firebase の設定値**（`VITE_FIREBASE_*`）はブラウザに公開されるが、Firestore / Storage のセキュリティルールで不正アクセスを防ぐ

---

## よく使うコマンド

```bash
# フロントエンド開発サーバー起動
npm run dev

# Firebase エミュレータ起動（Auth/Firestore/Storage/Functions/Hosting）
npm run emulators

# Cloud Functions だけデプロイ
npm run deploy:functions

# 全体デプロイ（フロントビルド + Hosting + Functions）
npm run deploy
```
