# LINEノート抽出 → 要約 → Notionまとめツール

LINEグループに溜まった「ノート」を抽出し、Claude（`claude-opus-4-8`）で要約して、
Notionのデータベースに自動で投稿するツールです。武士道・弓道・日本文化体験事業の
記録を活用しやすい形に整理することを目的としています。

---

## ⚠️ はじめに：LINEの仕様上の制約（重要）

**LINEには「グループのノートを一覧で取得する」公式APIが存在しません。**
LINE Messaging API（Bot用API）が扱えるのは「Botが参加した後に届く新規メッセージ」だけで、
ノートや過去のトーク履歴を読み出す手段は公開されていません。

そのため「全ログを取得する」唯一の現実的な入口は、**LINEアプリから手動で
テキストを書き出す**ことになります。ここだけは自動化できません。書き出した後の
「抽出 → 要約 → Notion投稿」は本ツールが全自動で行います。

### 入力テキストの用意のしかた

本ツールは2つの入力形式に対応しています。

**方式A: ノートを貼り付ける（推奨）**
LINEのノートを開き、本文をコピーしてテキストファイルに貼り付けます。
ノートとノートの間を `---` の行で区切ります（任意で `# 2026-05-25` の日付見出しを付けられます）。
→ `examples/notes-sample.txt` が見本です。

> なぜ推奨か：LINEの「トーク履歴を送信」で出力される.txtには、ノート本文が
> 完全には含まれない（「ノートに投稿しました」という通知だけになる）ことがあるためです。
> ノートを確実に残したい場合は、ノート本文を直接コピーするこの方式が最も確実です。

**方式B: トーク履歴txtから抽出**
LINEのトーク画面 → 右上メニュー → 設定 → トーク履歴を送信／保存 で出力した
`.txt` をそのまま渡します。発言者や語句でフィルタできます。

---

## セットアップ

```bash
cd tools/line-note-extractor
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### APIキーの準備

`.env.example` を参考に、2つのキーを環境変数に設定します。

| 変数 | 取得先 |
| --- | --- |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `NOTION_TOKEN` | https://www.notion.so/my-integrations でインテグレーションを作成 |

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export NOTION_TOKEN=ntn_...
```

### Notion側の準備

1. https://www.notion.so/my-integrations で「内部インテグレーション」を作成し、
   `NOTION_TOKEN` を取得。
2. ノートをまとめたい**親ページ**を開き、右上「…」→「接続」から、作成した
   インテグレーションを接続（共有）する。
3. その親ページのIDを控える。ページURL
   `https://www.notion.so/xxxx-32桁の英数字` の末尾32桁が `--notion-parent` に渡すIDです。

---

## 使い方

```bash
# 方式A: ノート貼り付けファイル → Notionに新規DBを作って投稿
python -m line_note_extractor.cli \
    --notes-file examples/notes-sample.txt \
    --notion-parent <親ページID>

# 方式B: トーク履歴から「弓道」を含むメッセージだけ
python -m line_note_extractor.cli \
    --talk-export talk.txt --keyword 弓道 \
    --notion-parent <親ページID>

# 既存のデータベースに追記する
python -m line_note_extractor.cli \
    --notes-file notes.txt --notion-database <データベースID>

# Notionに送らず、要約結果だけ確認（APIキー: ANTHROPICのみ必要）
python -m line_note_extractor.cli --notes-file examples/notes-sample.txt --dry-run
```

### 主なオプション

| オプション | 説明 |
| --- | --- |
| `--talk-export FILE` | LINEトーク履歴txtを入力にする |
| `--notes-file FILE` | ノート貼り付けテキストを入力にする（`---`区切り） |
| `--author 名前` | （トーク履歴）その発言者のみ抽出 |
| `--keyword 語` | （トーク履歴）その語を含む行のみ抽出 |
| `--notion-parent ID` | 新規データベースを作る親ページID |
| `--notion-database ID` | 既存データベースに追記 |
| `--database-title 名前` | 新規DBのタイトル（既定: LINEノートまとめ） |
| `--dry-run` | Notionに送らずJSONで確認 |
| `--limit N` | 先頭N件だけ処理（動作確認用） |

---

## Notionに作られるもの

各ノートが1ページになり、以下のプロパティと本文が設定されます。

- プロパティ：タイトル / タグ（複数選択）/ 投稿日 / 投稿者 / 情報元
- 本文：要約 / 重要な学び・論点（箇条書き）/ 今後のアクション（ToDo）/ 原文（折りたたみ）

---

## 構成

```
line_note_extractor/
  models.py      … データモデルと要約スキーマ（Pydantic）
  parse.py       … LINEエクスポート/貼り付けテキストの抽出
  summarize.py   … Claude(claude-opus-4-8)による構造化要約
  notion.py      … Notionへのデータベース＆ページ作成
  cli.py         … コマンドライン入口
```

## まず試すなら

APIキーを設定したら、Notionなしで要約だけ確認するのが安全です。

```bash
python -m line_note_extractor.cli --notes-file examples/notes-sample.txt --dry-run
```
