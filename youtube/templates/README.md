# 新しい回の作り方

1. `episodes/ep01-nagoya-samurai-hometown/` をフォルダごと複製し、`ep02-<英語の短い名前>/` に名前を変更（`build/` と `assets/` の中身は不要）
2. `script.md` を新しい原稿に差し替え（Claude に「EP02 の原稿を作って」と依頼すれば、この形式で作成します）
3. `metadata.yaml` の次の項目を書き換え
   - `episode.id` / `slug` / `week_start`（公開する週の月曜日）/ `drive_filename_contains`
   - `keywords` / `glossary`（その回の固有名詞）
   - `graphics` / `photos` / `visuals`（どのセリフで何を見せるか）
   - `main`（タイトル・概要欄・タグ・サムネイル・チャプター）
   - `shorts`（7本の開始・終了フレーズ、タイトル、フック）

## 原稿を書くときのルール（ショートを自動で切り出すため）

- 各ショートは **20〜45秒（英語で約50〜100語）**、その部分だけ見ても話が完結するように書く
- `🎬 SHORT n START` 直後の文と、`END` 直前の文は、`metadata.yaml` の `start` / `end` にそのまま書き写す
- 図や写真を出したい場所は `[VISUAL]` と書き、そのセリフの冒頭を `visuals.at` に書く
