# 飲食店向けハラル対応セミナー 申込フォーム

BUSHIDO JAPAN主催「飲食店向けハラル対応セミナー」のGoogleフォームを作成・公開し、
QRコード(PNG)を生成するための一式です。

## ファイル

| ファイル | 内容 |
| --- | --- |
| `createHalalSeminarForm.gs` | Google Apps Script。フォーム作成・公開・回答先スプレッドシート接続・QRコード生成までを自動化 |
| `generate_qr.py` | 公開フォームのURLからQRコードPNGをローカルで生成するスクリプト |

## 手順

### 1. フォームの作成・公開（Google側で実行）

1. Googleドライブで **新規 → その他 → Google Apps Script** を開く
2. `createHalalSeminarForm.gs` の内容を貼り付ける
3. 関数 `createHalalSeminarForm` を選択して実行
4. 初回のみ権限を承認（Forms / Sheets / Drive / 外部通信 `UrlFetchApp`）
5. 実行ログに以下が出力されます
   - フォーム編集URL
   - 申込者用URL（公開URL）
   - 回答スプレッドシートURL
   - QRコード画像URL(PNG) ← Driveに自動保存されたPNGへのリンク

> スクリプトは公開URLのQRコードを `api.qrserver.com` で生成し、
> `ハラルセミナー申込フォーム_QR.png` としてマイドライブに保存します。

### 2. QRコードPNGをローカルで作る場合

公開URLが分かっていれば、外部サービスを使わずローカルでも生成できます。

```bash
pip install qrcode pillow
python3 generate_qr.py "https://docs.google.com/forms/d/e/XXXX/viewform" \
    -o halal_seminar_form_qr.png
```

## セミナー概要（フォーム記載内容）

- **オンラインセミナー**：7月16日（木）15:00〜16:00／オンライン／無料／講師：ハラルナビ ハヤトさん
- **オフライン実践セミナー（8月予定）**：8月18日（火）15:00〜17:00／名古屋駅付近予定／1名30,000円予定／スクール形式
