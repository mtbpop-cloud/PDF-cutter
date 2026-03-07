# PDF下部カッター | PDF Bottom Cropper

PDFの各ページ下部を自動削除するWebアプリケーション

<div align="center">

**[🚀 デモを見る](https://pdf-cutter.pages.dev)**

![PDF Bottom Cropper](https://img.shields.io/badge/PDF-Editor-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Made with](https://img.shields.io/badge/made%20with-Vanilla%20JS-yellow)
![Hosted on](https://img.shields.io/badge/hosted%20on-Cloudflare%20Pages-orange)

</div>

---

## ✨ 主な機能

| 機能 | 説明 |
|------|------|
| 📂 **ドラッグ&ドロップ** | ファイルをドロップするだけで簡単アップロード |
| 🔍 **リアルタイムプレビュー** | 処理前のPDFをページごとに確認 |
| 🎯 **ドラッグ調整** | オーバーレイ境界をドラッグしてカット幅を直感的に設定 |
| 📊 **カット率スライダー** | 1%〜50%で細かく調整可能 |
| ✂️ **ビジュアル表示** | 削除される領域を赤色で可視化 |
| 👁️ **処理後プレビュー** | ダウンロード前に結果を確認 |
| 🔒 **プライバシー保護** | 完全クライアントサイド処理 |

---

## 🚀 使い方

1. **PDFをアップロード**
   - ファイルをドロップまたは選択

2. **カット幅を調整**
   - スライダーを動かす、または
   - オーバーレイ境界をドラッグ

3. **プレビューで確認**
   - ページナビゲーションで全ページをチェック

4. **処理を実行**
   - 「処理を実行」ボタンをクリック

5. **ダウンロード**
   - 処理後プレビューを確認して「PDFをダウンロード」

---

## 🛠️ 技術スタック

- **PDF処理**: [pdf-lib](https://pdf-lib.js.org/) - PDF直接編集
- **PDFレンダリング**: [PDF.js](https://mozilla.github.io/pdf.js/) - プレビュー表示
- **スタイリング**: Vanilla CSS (グラスモーフィズム、グラデーション)
- **JavaScript**: ES6+ (完全クライアントサイド)

---

## 📦 ローカルでの実行

```bash
# リポジトリをクローン
git clone https://github.com/mtbpop-cloud/PDF-cutter.git

# ディレクトリに移動
cd PDF-cutter

# ローカルサーバーで実行（例：Python）
python -m http.server 8000

# ブラウザで開く
open http://localhost:8000
```

---

## 🌐 デプロイ

このプロジェクトはCloudflare Pagesでデプロイされています。

詳細な手順は [DEPLOYMENT.md](DEPLOYMENT.md) を参照してください。

---

## 📝 ライセンス

MIT License - 自由に使用・改変・配布できます

---

## 🙏 謝辞

- [pdf-lib](https://pdf-lib.js.org/) - Andrew Dillon氏
- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla

---

<div align="center">
Made with ❤️ by NY
</div>
