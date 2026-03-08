# ロゴカッター | Logo Cutter

PDF・画像ファイルの上部/下部を自動で一括カットするWebアプリケーション

<div align="center">

**[🚀 デモを見る](https://pdf-cutter.pages.dev)**

![Logo Cutter](https://img.shields.io/badge/Logo-Cutter-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Made with](https://img.shields.io/badge/made%20with-Vanilla%20JS-yellow)
![Hosted on](https://img.shields.io/badge/hosted%20on-Cloudflare%20Pages-orange)

</div>

---

## ✨ 主な機能

| 機能 | 説明 |
|------|------|
| 📂 **ドラッグ&ドロップ** | ファイルをドロップするだけで簡単アップロード |
| 🖼️ **画像対応** | PNG・JPEG・WebP・GIF・BMP をサポート |
| 📄 **PDF対応** | PDFの各ページをカット処理 |
| 🔄 **一括処理** | 複数画像をまとめてカット |
| ↕️ **上下カット** | 上部・下部の切り替えに対応 |
| 📊 **カット率スライダー** | 1%〜50%で細かく調整可能 |
| 🎯 **ドラッグ調整** | オーバーレイ境界をドラッグして直感的に設定 |
| 📁 **出力変換** | 同フォーマット・PDF・PNG の出力に対応 |
| 📦 **ZIP出力** | 複数ファイルはZIPで一括ダウンロード |
| 🔒 **プライバシー保護** | 完全クライアントサイド処理 |

---

## 🚀 使い方

1. **ファイルをアップロード** - PDF or 画像をドロップまたは選択
2. **カット方向を選択** - 上部 or 下部（デフォルト: 下部）
3. **カット幅を調整** - スライダーまたはドラッグで設定
4. **出力フォーマットを選択** - 元のフォーマット / PDF / PNG
5. **処理を実行 → ダウンロード**

---

## 🛠️ 技術スタック

- **PDF処理**: [pdf-lib](https://pdf-lib.js.org/) - PDF編集・画像→PDF変換
- **PDFレンダリング**: [PDF.js](https://mozilla.github.io/pdf.js/) - プレビュー・PDF→PNG変換
- **画像処理**: Canvas API（ネイティブ）
- **ZIP生成**: [JSZip](https://stuk.github.io/jszip/) - 複数ファイルZIP化
- **スタイリング**: Vanilla CSS (グラスモーフィズム、グラデーション)

---

## 📝 ライセンス

MIT License

---

<div align="center">
Made with ❤️ by NY
</div>
