# GitHubとCloudflare Pagesへのデプロイ手順

## 1️⃣ GitHubリポジトリの作成

### 手順A: ブラウザから作成
1. https://github.com/new にアクセス
2. リポジトリ名: `PDF-cutter`
3. 説明: `PDF下部カッター - PDFの各ページ下部を自動削除するWebアプリ`
4. 「Public」を選択
5. **「Initialize this repository with」のチェックは全て外す**（重要！）
6. 「Create repository」をクリック

### 手順B: リポジトリURLを確認
作成したリポジトリのURLをコピー（例: `https://github.com/yourusername/PDF-cutter.git`）

---

## 2️⃣ コードをGitHubにプッシュ

ターミナルで以下のコマンドを実行：

```bash
# PDF-cutterディレクトリで実行
cd /path/to/PDF-cutter

# リモートリポジトリを追加（URLは実際のものに置き換え）
git remote add origin https://github.com/yourusername/PDF-cutter.git

# コードをプッシュ
git push -u origin main
```

---

## 3️⃣ Cloudflare Pagesでデプロイ

### 方法A: wrangler CLI（推奨）

```bash
# wranglerでログイン
npx wrangler login

# Cloudflare Pagesにデプロイ
npx wrangler pages deploy . --project-name=pdf-cutter
```

### 方法B: Cloudflare Dashboard

1. https://dash.cloudflare.com にアクセスしてログイン
2. 「Workers & Pages」→「Create」→「Pages」を選択
3. GitHubアカウントを連携
4. `PDF-cutter` リポジトリを選択
5. 設定:
   - ビルドコマンド: （空欄）
   - ビルド出力ディレクトリ: `/`
6. 「Save and Deploy」をクリック

✅ 完了！数分でデプロイされます

---

## 📝 次のステップ

デプロイが完了したら：
1. Cloudflare Pagesから提供されるURLにアクセス
2. アプリが正常に動作することを確認
3. README.mdのデモURLを更新（オプション）

---

## 🔧 トラブルシューティング

### エラー: "Repository already exists"
→ 別のリポジトリ名を使用するか、既存のリポジトリを削除

### エラー: "Permission denied"
→ SSHキーを設定するか、HTTPSでアクセストークンを使用

### Cloudflare Pagesでビルドエラー
→ このプロジェクトは静的HTMLなので通常エラーは発生しません
