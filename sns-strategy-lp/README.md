# JCI名古屋SNS戦略部会 公式サイト

Netlify公開URL: https://jci-nagoya-sns-strategy.netlify.app/

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | ページ本体（単一HTML・CSS/JS インライン） |
| `build.py` | `index.html` → `dist/index.html` を生成（画像をbase64埋め込み＋OGPを絶対URL化） |
| `img/` | 画像一式（リポジトリ未管理。Google Driveの `JCI名古屋SNS戦略部会_HP/img/` を参照） |
| `dist/` | ビルド成果物（デプロイ対象） |

## ビルド

```bash
cd sns-strategy-lp
python build.py
```

出力された `dist/` をそのままNetlifyにアップロードすれば公開完了です。

## 注意

- `img/` はサイズが大きいためリポジトリに含めていません。ビルド時はDriveから `img/` を同階層に配置してください。
- `index.html` を直接編集し、`dist/` は編集しないでください（ビルドで上書きされます）。
