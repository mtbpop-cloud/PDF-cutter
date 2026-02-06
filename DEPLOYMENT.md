# GitHubとVercelへのデプロイ手順

## 1️⃣ GitHubリポジトリの作成

### 手順A: ブラウザから作成
1. https://github.com/new にアクセス
2. リポジトリ名: `orbital-zodiac`
3. 説明: `PDF下部カッター - PDFの各ページ下部を自動削除するWebアプリ`
4. 「Public」を選択
5. **「Initialize this repository with」のチェックは全て外す**（重要！）
6. 「Create repository」をクリック

### 手順B: リポジトリURLを確認
作成したリポジトリのURLをコピー（例: `https://github.com/yourusername/orbital-zodiac.git`）

---

## 2️⃣ コードをGitHubにプッシュ

ターミナルで以下のコマンドを実行：

```bash
# orbital-zodiacディレクトリで実行
cd /Users/ny/.gemini/antigravity/playground/orbital-zodiac

# リモートリポジトリを追加（URLは実際のものに置き換え）
git remote add origin https://github.com/yourusername/orbital-zodiac.git

# コードをプッシュ
git push -u origin main
```

もしくは、mainではなくmasterブランチの場合：
```bash
git branch -M main
git push -u origin main
```

---

## 3️⃣ Vercelでデプロイ

### 方法A: Vercel Dashboard（推奨）

1. https://vercel.com にアクセスしてログイン
2. 「Add New...」→「Project」をクリック
3. GitHubアカウントを連携（初回のみ）
4. `orbital-zodiac` リポジトリを選択
5. 「Import」をクリック
6. 設定はデフォルトのままで「Deploy」をクリック

✅ 完了！数分でデプロイされます

### 方法B: Vercel CLI

```bash
# Vercel CLIをインストール（未インストールの場合）
npm install -g vercel

# プロジェクトディレクトリでデプロイ
cd /Users/ny/.gemini/antigravity/playground/orbital-zodiac
vercel

# プロンプトに従って設定
# - Set up and deploy? [Y/n] → Y
# - Which scope? → 自分のアカウントを選択
# - Link to existing project? [y/N] → N
# - What's your project's name? → orbital-zodiac
# - In which directory is your code located? → ./

# 本番環境にデプロイ
vercel --prod
```

---

## 📝 次のステップ

デプロイが完了したら：
1. Vercelから提供されるURLにアクセス
2. アプリが正常に動作することを確認
3. README.mdのデモURLを更新（オプション）

---

## 🔧 トラブルシューティング

### エラー: "Repository already exists"
→ 別のリポジトリ名を使用するか、既存のリポジトリを削除

### エラー: "Permission denied"
→ SSHキーを設定するか、HTTPSでアクセストークンを使用

### Vercelでビルドエラー
→ このプロジェクトは静的HTMLなので通常エラーは発生しません
