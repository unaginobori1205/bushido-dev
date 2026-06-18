# 水素吸引サービス 導入プラン LP（カーサカラー オーナー向け）

静的な1枚もの（`index.html` のみ。ビルド不要）。

## Netlify への公開方法（3通り）

### 方法A：ドラッグ&ドロップ（最速・アカウント不要に近い）
1. https://app.netlify.com/drop を開く
2. `lp` フォルダ（または `index.html`）をそのままドロップ
3. 即時に公開URLが発行されます

### 方法B：GitHub連携で自動デプロイ（おすすめ・更新が自動）
1. Netlify管理画面 → Add new site → Import from Git → GitHub
2. リポジトリ `unaginobori1205/bushido-dev` を選択
3. ブランチ `claude/hydrogen-bar-laundromat-28kx27`、Publish directory = `lp`（リポジトリ直下の `netlify.toml` で設定済み）
4. Deploy。以後はpushで自動更新

### 方法C：Netlify CLI（トークンがあれば自動化可能）
```bash
npm i -g netlify-cli
netlify login            # またはトークン: export NETLIFY_AUTH_TOKEN=xxxx
netlify deploy --dir=lp --prod
```
