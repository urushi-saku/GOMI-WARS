# GOMI-WARS ファイル構成と役割

## ディレクトリ全体図

```
GOMI-WARS/
├── backend/           # Express サーバー（Node.js、Render へデプロイ）
├── frontend/          # React フロントエンド（Vite + TypeScript、Vercel へデプロイ）
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
| `firebase.json` | Firebase サービス（Hosting / Firestore / Storage / Emulators）の設定をまとめたメインの設定ファイル |
| `.firebaserc` | `firebase use` で切り替えるプロジェクトIDを管理。`your-firebase-project-id` を実際のIDに書き換える |
| `firestore.rules` | Firestore のアクセス権限ルール。「本人のみ書き込み可」「認証済みなら閲覧可」などを定義 |
| `firestore.indexes.json` | Firestore で複合クエリ（例：userId + createdAt）を使うときに必要なインデックスの定義 |
| `storage.rules` | Cloud Storage のアクセス権限ルール。画像のみ・10MB以下・本人のみアップロード可などを定義 |
| `package.json` | ルート全体で使うコマンドを定義（エミュレータ起動など） |
| `.gitignore` | `.env.local`（APIキー等）や `node_modules/`・ビルド成果物を Git に含めないよう除外設定 |

---

## frontend/ （React アプリ本体）

```
frontend/
├── src/
│   ├── main.tsx          # エントリーポイント（React アプリ初期化）
│   ├── App.tsx           # ルートコンポーネント（React Router の Routes 定義）
│   ├── App.css           # App コンポーネントのスタイル
│   ├── index.css         # グローバルスタイル
│   ├── lib/
│   │   └── firebase.ts   # Firebase 初期化・各サービスのエクスポート・API_BASE_URL 定義
│   ├── types/
│   │   └── index.ts      # 型定義（UserProfile / Pickup / AssessmentResult など）
│   ├── page/
│   │   ├── Home.tsx      # ホーム画面（ゴミ査定画面）
│   │   ├── Login.tsx     # ログイン画面
│   │   └── Signup.tsx    # ユーザー登録画面
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

### ページ一覧

| ページ | パス | 機能 |
|---|---|---|
| `Home.tsx` | `/` | ゴミ査定・ポイント獲得 |
| `Login.tsx` | `/login` | Firebase Email/Password ログイン |
| `Signup.tsx` | `/signup` | Firebase Email/Password ユーザー登録 |

### 重要ファイルの詳細

#### `src/lib/firebase.ts`
Firebase の初期化を行い、各サービスのインスタンスをエクスポートする。
アプリ全体でこのファイルから `auth` / `db` / `storage` / `API_BASE_URL` をインポートして使う。

```ts
import { db, API_BASE_URL } from '@/lib/firebase'
```

#### `src/types/index.ts`
Firestore に保存するデータの TypeScript 型定義。
`UserProfile`（ユーザー情報） / `Pickup`（ゴミ拾い記録） / `AssessmentResult`（Gemini 査定結果）などを定義。

#### `.env.example` → `.env.local` にコピーして使う
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=http://localhost:3001        # バックエンド URL（ローカル）
```
`VITE_` プレフィックスが付いた変数だけがブラウザから参照できる。

---

## backend/ （Express サーバー）

```
backend/
├── src/
│   ├── index.ts                  # サーバー起動・全体設定（CORS・ミドルウェア設定）
│   ├── lib/
│   │   └── firebase-admin.ts     # Firebase Admin SDK の初期化
│   ├── middleware/
│   │   └── verifyToken.ts        # JWT トークン検証ミドルウェア
│   ├── types/
│   │   └── index.ts              # TypeScript 型定義（AssessmentResult）
│   ├── services/
│   │   └── geminiService.ts      # Gemini AI との通信ロジック（プロンプト含む）
│   ├── controllers/
│   │   ├── assessController.ts   # リクエスト処理・Firestore保存ロジック
│   │   └── authController.ts     # ユーザー認証関連ロジック
│   └── routes/
│       └── assess.ts             # ルーティング定義（URL → Controller の対応）
├── tsconfig.json                 # TypeScript 設定
├── package.json                  # 依存パッケージ管理（Express・Gemini API・Firebase Admin等）
└── .env.local                    # 環境変数（GEMINI_API_KEY など）
```

### ファイル構成の責務分離

| ファイル | 責務 |
|---|---|
| `index.ts` | サーバー起動、CORS 設定、Express ミドルウェア全体の設定 |
| `lib/firebase-admin.ts` | Firebase Admin SDK の初期化（重複初期化防止）、auth/db/storageBucket のエクスポート |
| `middleware/verifyToken.ts` | `Authorization: Bearer <idToken>` から UID を抽出・検証し、req.uid に付与 |
| `types/index.ts` | Gemini 査定結果の型定義（AssessmentResult） |
| `services/geminiService.ts` | Gemini API 呼び出し、システムプロンプト管理、画像解析ロジック |
| `controllers/assessController.ts` | リクエストボディの検証、Gemini 査定実行、Firestore への保存判定・実行 |
| `routes/assess.ts` | POST `/api/assess` のルーティング定義（認証・コントローラー接続） |

### 重要なエンドポイント

| メソッド | パス | 認証 | 役割 |
|---|---|---|---|
| `POST` | `/api/assess` | ✅ `verifyToken` | 画像を Gemini で査定、結果を返してゴミなら Firestore に保存 |
| `GET` | `/health` | 不要 | Render ヘルスチェック用 |

### リクエスト・レスポンス仕様

#### リクエスト（POST /api/assess）
```json
{
  "imageBase64": "...",
  "mimeType": "image/jpeg",
  "location": { "lat": 35.6895, "lng": 139.6917 }
}
```

#### レスポンス
```json
{
  "is_trash": true,
  "is_suspicious": false,
  "type": "プラスチック",
  "material": "ポリエチレン",
  "points": 45,
  "comment": "フッ、視界から排除しろ。"
}
```

### Firestore 保存の判定ロジック

✅ **保存される条件：** `is_trash: true` AND `is_suspicious: false`

❌ **保存されない場合：**
- `is_trash: false` → ゴミではない写真
- `is_suspicious: true` → 画面撮影・合成画像などの不正疑い

保存時のデータセット：
```
/pickups/{documentId}
├── userId              (UUID)
├── points              (0-100)
├── comment             (AI のセリフ)
├── location            (GeoPoint, 任意)
└── createdAt           (サーバータイムスタンプ)
```

### 環境変数（.env.local）

```
GEMINI_API_KEY=...                                          # Gemini API キー
GOOGLE_APPLICATION_CREDENTIALS_BASE64=...                  # Firebase Admin SDK（Render 本番用）
FRONTEND_URL=https://your-frontend.vercel.app             # CORS 許可リスト用
PORT=3001                                                   # サーバーポート
```

**ローカル開発時：** `GOOGLE_APPLICATION_CREDENTIALS` で JSON キーファイルを参照（自動設定）  
**Render 本番時：** Base64 エンコードされた JSON を環境変数に設定

---

## セキュリティの設計方針

```
ユーザー（ブラウザ）
    │
    ├─── Firestore/Storage ────── firestore.rules / storage.rules で認証チェック
    │                             （Firebase SDK で直接アクセス）
    │
    └─── Express サーバー（Render） ──────── verifyToken ミドルウェア
                                 ├─ Firebase IDトークン検証
                                 └─ Gemini API 呼び出し（APIキーはサーバー側のみ保持）
                                    ↓
                                 Firestore にゴミ情報を保存
```

**セキュリティ層：**

1. **ユーザー認証**
   - Firebase Auth で IDトークン を発行
   - Express の `verifyToken` ミドルウェアで全リクエストを検証

2. **API 呼び出しの認証**
   - `Authorization: Bearer <idToken>` ヘッダで識別
   - 認証に失敗すると 401 エラーで拒否

3. **Gemini API キーの保護**
   - `GEMINI_API_KEY` はサーバー環境変数にのみ存在
   - フロントエンドのコードには一切含めない
   - Render のシークレット管理で安全に保存

4. **Firestore/Storage のアクセス制御**
   - `firestore.rules`・`storage.rules` で同一ユーザーのみ書き込み可能に設定
   - 認証済みユーザーのみ閲覧可能に制限

---

## よく使うコマンド

```bash
# フロントエンド開発サーバー起動
cd frontend && npm run dev

# バックエンド開発サーバー起動
cd backend && npm run dev

# Firebase エミュレータ起動（Auth/Firestore/Storage/Hosting）
npm run emulators

# バックエンド本番環境へのデプロイ（Render）
cd backend && npm run deploy

# フロントエンド本番環境へのデプロイ（Vercel）
cd frontend && npm run deploy
```
