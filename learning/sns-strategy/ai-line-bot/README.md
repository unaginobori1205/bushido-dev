# 愛（あい）― LINEで動くAIの相棒　実装キット

LINEで「愛、◯◯して」と頼むと、愛（Claude）が働いて返してくれる仕組みの**スターターキット（n8nノーコード）**です。
まず **Phase 1（会話できる愛）** を動かし、そこから朝の予定・メール下書き・資料作成・Notion/Obsidian連携を一つずつ足していきます。

- `愛_persona.md` … 愛の人格（システムプロンプト）
- `n8n-workflow.json` … 取り込み用ワークフロー（Phase 1：リアクティブ）
- `愛_二人三脚ロードマップ.md` … 全体像（Phase 1〜5）と希望→実現マップ

---

## Phase 1 を動かす（だいたい30〜60分）

### 1. LINE公式アカウント＋Messaging API
1. [LINE Developers](https://developers.line.biz/) にログイン → プロバイダー作成 → **Messaging APIチャネル**を作成
2. 「**チャネルアクセストークン（長期）**」を発行して控える ＝ `LINE_CHANNEL_ACCESS_TOKEN`
3. チャネルの「応答設定」で **あいさつ／自動応答メッセージをオフ**、**Webhookをオン**

### 2. Anthropic APIキー
1. [console.anthropic.com](https://console.anthropic.com/) → API Keys → 作成して控える ＝ `ANTHROPIC_API_KEY`

### 3. n8n に取り込む
1. n8nの環境変数に `ANTHROPIC_API_KEY` と `LINE_CHANNEL_ACCESS_TOKEN` を設定
   （n8n Cloud等で環境変数が使えない場合は、各ノードのヘッダーに直接トークンを入れるか、Credentialsを使う）
2. `n8n-workflow.json` を **Workflows → Import from File** で取り込む
3. 「愛（Claude）」ノードの `system` を `愛_persona.md` の本文に差し替え（より丁寧にしたい場合）
4. ワークフローを **Active** にして、「LINE受信」ノードの **Production Webhook URL** をコピー

### 4. LINEにWebhook URLを登録
1. LINE Developers のチャネル → Messaging API → **Webhook URL** に、コピーしたn8nのURLを貼る
2. 「検証」→ 成功 → Webhookを**有効化**

### 5. テスト
1. LINE公式アカウントを**友だち追加**
2. 「愛、明日のSNS投稿を1本つくって」と送る
3. 愛から返信が来たら成功 🎉

---

## うまくいかない時
- **返信が来ない**：Webhook URLが Production（Testではない）か／ワークフローがActiveか／トークンが正しいか。
- **エラーになる**：LINEは確認用の空イベントを送ることがある。`events[0]` が無い時用に、先頭に IF（`{{$json.body.events[0].message.type}}` が `text`）を足すと安定。
- **モデル名**：`claude-sonnet-4-6` が使えない場合は、利用可能なモデルIDに変更（最新は Anthropic ドキュメント）。
- ※ LINE / Anthropic のAPI仕様・料金は変わります。最新を確認してください（ファクトチェック対象）。

---

## 次のフェーズ
`愛_二人三脚ロードマップ.md` を参照。
- Phase 2：毎朝、Googleカレンダーの予定をLINEへ（プロアクティブ）
- Phase 3：メール下書き（Gmail）→「下書きできました」通知
- Phase 4：資料作成 → Drive/Docs/Canva →「資料できたよ」通知
- Phase 5：Notion・Obsidian と並走（ObsidianはVaultをGit/同期化）

> 安全の約束：出力は下書き、送信・公開・確定は必ず人。個人情報・機密は流さない。トークンは環境変数で。
