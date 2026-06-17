# 015 Claude Codeを24時間動かす ―“眠らない社員”でSNSを自動で回す

> JCI NAGOYA SNS戦略部会（上級）／ 講師：上岡 賢輔 ／ 014「AI社員」の実装編
> 動画（Seedance）だけでなく **画像投稿・X(文字)投稿** にも応用できる構成。
>
> ⚙️ **2026年6月時点**。Routines / Claude Code on the web 等は研究プレビューで仕様・料金が変わる可能性あり。
> 最新は code.claude.com/docs。Seedance・X API 等の料金/規約はファクトチェック対象。
>
> ※ Google Drive「SNS戦略部会共有資料」フォルダの `015_Claude Codeを24時間動かす.html` のミラー（版管理用）。
> 技術仕様は claude-code-guide で裏取り済み。

---

## 序章 なぜ24時間か
SNSは継続が9割（001）。AIを“眠らない社員”として24時間動かし、寝ている間に企画・台本・画像・投稿文が進む状態をつくる＝014「AI社員に任せ、人間が責任を取る」の実装。
**大原則**：動かすのは作業だけ。決める・責任・最終チェックと投稿は人間。

## 1. 3つの動かし方
| 方式 | 内容 | PC閉じてOK | 手軽さ | 向く人 |
| --- | --- | --- | --- | --- |
| **A. クラウド定期実行（Routines）** | Anthropicのクラウドで定時自動実行 | ◎ | ◎ | まず全員 |
| B. 自分のマシン（ヘッドレス＋cron） | 常時稼働PCで `claude -p` を定期実行 | × | △ | 常時稼働機がある人 |
| C. GitHub Actions（cron） | GitHubの定期ワークフロー | ◎ | △ | GitHub利用者 |

結論＝まず A。`/loop` はセッションを開いたまま＝PC起動が必要なので無人24hには A か C。

## 2. 動かす前に決めること
- 任せるSNS作業の棚卸し（◎自分／△AI＋人／✕完全自動）。最初は✕から1つ。
- プラン・コスト感：クラウド実行は Pro/Max/Team/Enterprise 向け研究プレビュー、1日の実行上限あり。
- 安全設計を先に：権限 `dontAsk`＋許可のみ／`--max-turns`／投稿直前は人チェック。

## 3. クラウドで24時間（Routines）＝核
- **Claude Code on the web**：`claude.ai/code`、GitHubリポジトリを箱に、ブラウザ閉じても継続、スマホ監視。
- **Routine作成**：CLIで `/schedule` または `claude.ai/code/routines`。
- トリガー3種：スケジュール（毎時/毎日/cron、最短1時間）／API（Webhook）／GitHub。
- 例：毎日12:00に翌日のSNS企画＋各フォーマット素材を `content.md`/シートに追記。
- 外部連携（MCP/コネクタ）：`claude.ai/customize/connectors` でOAuth接続、または `.mcp.json` をリポジトリにコミット。ネットワークは既定Trusted。

## 4. 動画・画像・X(文字)の自動化 ★広げた部分
共通の上流：Claudeが企画→台本/キャプションを生成し、**シート1行＝1投稿**（フォーマット・テーマ・フック・本文・タグ・投稿先）。

| フォーマット | 生成 | 仕上げ | 投稿先 | 自動度 |
| --- | --- | --- | --- | --- |
| ① 動画 | 台本→Seedance/Runway | CapCut字幕・BGM | TikTok/IG/YT Shorts | 半自動 |
| ② 画像 | ChatGPT画像/Canva AI/Gemini画像でサムネ・カルーセル | テキスト載せ・トンマナ | IG/X | 半自動〜自動 |
| ③ X(文字) | 投稿文・スレッドをClaude生成 | 事実・数字を人確認 | X/Threads | 自動（API・予約ツール） |

- ① 動画：15秒台本→動画生成→**字幕・投稿は人**。
- ② 画像：画像プロンプト＋キャプション生成→画像AI→IG/X。ブランド設定を毎回渡す。
- ③ X：単発/スレッド/リプライ生成→**予約ツール（Buffer/Typefully/X Pro）**が安全、慣れたらX API/n8n自動投稿。最初は「下書きまで自動・公開は人」。
- **1企画→3フォーマット同時生成**でワンソース・マルチユース。
- ※ X APIの枠・料金、各SNSの自動投稿規約は導入前に要確認。

## 5. 安全に回す（無人運転）
- 権限 `.claude/settings.json`：allow（必要なものだけ）/deny（rm・git push・.env等、denyが最優先）/`defaultMode: dontAsk`。`bypassPermissions`は本番禁止。
- 暴走・課金防止：`--max-turns 5`、`/usage`、Routine 1日上限、重い下調べは安価モデルへ。
- 通知 hooks：`Stop`/`PostToolUse` で curl→LINE/Slack/メール。
- 量をこなす：サブエージェント（`.claude/agents/`）で担当分け・並列・コスト最適化。

## 6. 監視と通知
進捗・失敗をプッシュ通知（hooks）、スマホで監視、最終チェックと投稿だけ人間。

## 7. やってはいけない
無監視で課金暴走／権限広すぎ・bypass常用／機密・個人情報を渡す／誇大・無検証の自動投稿／SNS・X API規約違反。

## 8. はじめの一歩
手動→半自動→全自動。今日：webで手動1回生成 → 〜30日：Routine毎日12:00＋LINE通知 → 〜60日：3フォーマット同時生成 → 〜90日：投稿手前まで自動（公開は人）。

## 付録
- 用語集（Routines/ヘッドレス/cron/MCP/hooks/サブエージェント/dontAsk）
- 自分のマシン最小手順：`claude -p "..." --allowedTools "Read,Edit,Bash" --max-turns 5` ＋ crontab `0 12 * * *`
- GitHub Actions：`anthropics/claude-code-action@v1` を `schedule: cron` で
- 「無人で動かす前」チェックリスト

---

## 学習ロードマップ（000）への追記用メモ

学習ロードマップ表へ以下を追加（014の後）：

| 段階 | 番号 | マニュアル | ひとことで |
| --- | --- | --- | --- |
| 上級 | 015 | Claude Codeを24時間動かす | “眠らない社員”でSNS（動画・画像・X）を自動で回す |

更新履歴：`2026-06-17　015（Claude Codeを24時間動かす）を追加。`

HTML行（生成元に挿入）：
```html
<tr><td><strong>上級</strong></td><td>015</td><td>Claude Codeを24時間動かす</td><td>“眠らない社員”でSNS（動画・画像・X）を自動で回す</td><td>SNS制作を自動で回したい時に</td></tr>
```
