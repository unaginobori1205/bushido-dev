# 恩送り AI実践セミナー  スライド資料

名古屋青年会議所 会員向けセミナー「恩送り」の PowerPoint（全24枚・16:9）を、
プログラムで自動生成する一式です。

## 成果物

| ファイル | 内容 |
| --- | --- |
| `恩送り_AI実践セミナー.pptx` | 本番用 PowerPoint（PowerPoint / Keynote / Googleスライドで開けます） |
| `恩送り_AI実践セミナー_preview.pdf` | 全24枚のプレビューPDF（中身確認用） |
| `contact_sheet.png` | 24枚を一覧したコンタクトシート |
| `preview/slide_NN.png` | 各スライドのPNG画像 |

## 構成ファイル

| ファイル | 役割 |
| --- | --- |
| `slides_data.py` | スライドの**中身（文言・色・フォームURL）**を一元管理 |
| `build_deck.py` | `slides_data.py` から **.pptx** を生成（python-pptx） |
| `preview.py` | `slides_data.py` から **PNG / PDF プレビュー**を生成（Pillow） |
| `assets/qr_*.png` | スライドに埋め込むQRコード画像 |

## デザイン

- 配色：深い藍（NAVY）× 金（GOLD）× 和紙色（PAPER）
- フォント：見出し/本文 = Noto Sans CJK JP、断言スライドの大見出し = Noto Serif CJK JP
- スライド種別：表紙 / 断言（濃紺） / 内容（明るい・箇条書き or 2カラム） / ワーク（QR付き） / プロンプト

## QRコード（Googleフォーム）について

スライド05・21のQRは、現状 **仮URL** を指しています（`slides_data.py` の `URL_KICKOFF` / `URL_SURVEY`）。
フォーム本体の質問内容は `../forms/恩送りセミナー_Googleフォーム雛形.md` にまとめてあります。

### 本番URLへの差し替え手順

1. [Googleフォーム](https://forms.google.com) で雛形どおりにフォームを2つ作成
2. 各フォームの「送信 → リンク → 短縮URL（forms.gle/xxxx）」を取得
3. `slides_data.py` を編集：
   ```python
   URL_KICKOFF = "https://forms.gle/（やりたいこと整理シートの実URL）"
   URL_SURVEY  = "https://forms.gle/（アンケートの実URL）"
   ```
4. 再ビルド：
   ```bash
   python3 build_deck.py     # pptx を再生成（QRが本番URLに更新）
   python3 preview.py        # プレビューも更新（任意）
   ```

## 再生成コマンド

```bash
pip install python-pptx qrcode pillow img2pdf
python3 build_deck.py     # 恩送り_AI実践セミナー.pptx
python3 preview.py        # PNG + preview.pdf + contact_sheet.png
```

## 文言の修正方法

スライドの文言・順番・色は `slides_data.py` の `SLIDES` リストを編集 →
`build_deck.py` を再実行するだけで反映されます（.pptxとプレビューの内容が常に一致します）。
