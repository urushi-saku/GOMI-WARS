# 🚀 開発に参加するための準備手順

> このファイルを **上から順番に** 読んで作業してね！

---

## ⚠️ 事前に必要なもの（インストール）

まだ入ってない場合は先に入れてください。

| ツール | 確認コマンド | ダウンロード先 |
|---|---|---|
| Node.js（v20以上） | `node -v` | https://nodejs.org/ja |
| Git | `git --version` | https://git-scm.com |
| VSCode（推奨） | — | https://code.visualstudio.com |

> ターミナル（Macはターミナル.app、WindowsはPowerShell）を開いて確認コマンドを打ってみてください。  
> バージョンが表示されればOKです。

---

## STEP 1：リポジトリをダウンロードする

```bash
git clone https://github.com/urushi-saku/GOMI-WARS.git
```

> ターミナルで上のコマンドを打つと `GOMI-WARS` フォルダが作られます。

---

## STEP 2：必要なパッケージをインストールする

**フロントエンド（画面側）**
```bash
cd GOMI-WARS/frontend
npm install
```

**Cloud Functions（サーバー側）**
```bash
cd ../functions
npm install
```

> `npm install` は「このプロジェクトに必要なライブラリを自動でダウンロード」するコマンドです。  
> 少し時間がかかりますが、エラーが出なければOKです。

---

## STEP 3：環境変数ファイルを作る

Firebase に繋ぐための「鍵」をファイルに書きます。  
**このファイルは絶対に Git にコミットしないでください。**

```bash
cd GOMI-WARS/frontend
cp .env.example .env.local
```

作成した `.env.local` をテキストエディタで開いて、  
担当者から共有された値を貼り付けてください。

```
VITE_FIREBASE_API_KEY=（ここに値を貼る）
VITE_FIREBASE_AUTH_DOMAIN=（ここに値を貼る）
VITE_FIREBASE_PROJECT_ID=（ここに値を貼る）
VITE_FIREBASE_STORAGE_BUCKET=（ここに値を貼る）
VITE_FIREBASE_MESSAGING_SENDER_ID=（ここに値を貼る）
VITE_FIREBASE_APP_ID=（ここに値を貼る）
```

> 担当者は値をDiscordで共有してください。

---

## STEP 4：アプリを起動してみる

```bash
cd GOMI-WARS/frontend
npm run dev
```

ターミナルに以下のような表示が出たら成功です👇

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

ブラウザで `http://localhost:5173` を開いてページが表示されればOK！

> 止めるときはターミナルで `Ctrl + C` を押してください。

---

## STEP 5：作業前にブランチを作る

**必ず自分専用のブランチを作ってから作業してください。**  
`main` ブランチに直接コミットするのはNGです。

```bash
# ブランチを作って移動（feature/〇〇 の部分は自分の作業内容にする）
git checkout -b feature/自分の作業名

# 例
git checkout -b feature/login-page
git checkout -b feature/ranking-page
```

---

## STEP 6：作業 → コミット → プッシュ

```bash
# 変更したファイルをステージング
git add .

# コミット（何をしたか日本語でOK）
git commit -m "ログインページを追加した"

# GitHubにプッシュ
git push origin feature/自分のブランチ名
```

その後、GitHubでPull Request（PR）を作成してリーダーにレビューをお願いしてください。

---

## ❓ よくあるトラブル

### `npm install` でエラーが出る
→ Node.js のバージョンが古い可能性があります。`node -v` で確認して v20 以上か確認してください。

### `npm run dev` でFirebaseのエラーが出る
→ `.env.local` の値が間違っているか空のままです。STEP 3 をやり直してください。

### ブランチ名を間違えた
```bash
# ブランチ名を変更
git branch -m 古いブランチ名 新しいブランチ名
```

---

## 📋 チェックリスト

準備できたら ✅ を確認してください。

- [ ] Node.js v20以上がインストールされている
- [ ] `git clone` でリポジトリをダウンロードした
- [ ] `frontend/` と `functions/` で `npm install` した
- [ ] `.env.local` を作って値を入力した
- [ ] `npm run dev` でブラウザにページが表示された
- [ ] 自分のブランチを作った
