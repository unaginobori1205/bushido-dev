# BUSHIDO JAPAN YouTube チャンネル 制作システム

海外の旅行代理店・ツアープランナーに向けて、**名古屋の魅力・武士道精神・日本の精神性・弓道の座学**を英語で届けるための仕組みです。

**週1回15分の収録 → 本編1本 ＋ ショート7本 → 毎日自動で公開**

```
 ┌────────────┐   ┌──────────────┐   ┌─────────────────────────────────────┐   ┌──────────────┐
 │ ① 英語原稿  │ → │ ② カメラ収録  │ → │ ③ パイプライン（1コマンド）              │ → │ ④ 毎日公開    │
 │  (毎週)     │   │  15分・1テイク │   │ 文字起こし→日本語訳→図・写真→字幕焼込み │   │ 月: 本編+Short│
 │ script.md   │   │ → マイドライブ │   │ →本編1本+Short7本→YouTube予約投稿       │   │ 火〜日: Short │
 └────────────┘   └──────────────┘   └─────────────────────────────────────┘   └──────────────┘
```

| フォルダ | 内容 |
| --- | --- |
| [`content-calendar.md`](content-calendar.md) | 12週分のテーマ計画（名古屋・武士道・精神性・弓道を順番に） |
| [`style-guide.md`](style-guide.md) | 字幕の字体・色・レイアウト、タイトル／サムネイルの作り方（人気チャンネルの型を分析） |
| [`episodes/ep01-…/script.md`](episodes/ep01-nagoya-samurai-hometown/script.md) | **第1回の英語原稿**（日本語訳・読み方の記号・ショート区間つき） |
| [`episodes/ep01-…/metadata.yaml`](episodes/ep01-nagoya-samurai-hometown/metadata.yaml) | 第1回の制作データ（図・写真の差し込み位置、ショート7本、タイトル、概要欄、公開日） |
| [`templates/`](templates/) | 翌週以降に複製して使うひな形 |
| [`pipeline/`](pipeline/) | 自動編集・自動投稿プログラム |

---

## 毎週の流れ（所要時間：ご本人の作業は約30〜40分）

| いつ | 誰が | やること |
| --- | --- | --- |
| 木〜金 | Claude | 翌週の英語原稿 `script.md` と `metadata.yaml` を作成（このリポジトリに追加） |
| 週末 | あなた | 原稿を一度声に出して読み、カメラに向かって約15分収録 |
| 週末 | あなた | 動画を Google ドライブの指定フォルダへ（ファイル名に `ep02` などを含める） |
| 日曜夜 | PC | `python bushido.py all ep02` を実行 → 自動で編集・予約投稿（翌日もう一度 `upload` を実行） |
| 月〜日 | YouTube | 月曜21:00 本編、月〜日 22:00 ショート（日本時間）が自動で公開 |

> 💡 収録は **横向き（16:9）・顔が画面の中央** で撮ってください。ショートは中央を縦に切り抜くため、中央にいれば縦動画でもきれいに収まります。

---

## 初回だけ必要な準備

### 1. パソコンの準備
```bash
cd youtube/pipeline
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp config.example.yaml config.yaml     # 設定ファイルを作成
python bushido.py setup                # 字幕・図で使うフォントをダウンロード
```
ffmpeg が無い場合も `imageio-ffmpeg` で自動的に動きます（Mac なら `brew install ffmpeg` がより高速）。

### 2. Google（ドライブ＋YouTube）の接続
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「API とサービス」で **YouTube Data API v3** と **Google Drive API** を有効化
3. 「OAuth 同意画面」を作成し、ご自身の Google アカウントをテストユーザーに追加
4. 「認証情報」→「OAuth クライアント ID」→ 種類 **デスクトップアプリ** で作成し、JSON を `pipeline/client_secret.json` として保存
5. `config.yaml` の `drive_folder_id` に収録用フォルダの ID を記入
6. 初回実行時にブラウザが開くので、**チャンネルを所有するアカウント**でログイン

### 3. 日本語字幕の翻訳（Claude API）
[Claude Console](https://console.anthropic.com/) で API キーを発行し、環境変数に設定します。
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### ⚠️ 必ず知っておいていただきたい YouTube の制約
| 制約 | 内容と対策 |
| --- | --- |
| **API の監査** | Google の審査（YouTube API Services の監査）を通っていないプロジェクトからアップした動画は**「非公開」に固定**されます。個人利用でも [監査申請フォーム](https://support.google.com/youtube/contact/yt_api_form) の提出が必要です（数日〜数週間）。審査が通るまでは YouTube Studio で予約公開を手動設定してください（アップロード・字幕・編集は自動のままです）。 |
| **1日の上限** | API の初期上限は 1日 10,000 ユニットで、アップロードは1日約5本まで。`upload` は5本で止まり、**翌日もう一度実行すると続きから**アップします。ショート5〜7は金〜日の公開なので間に合います。上限引き上げも監査申請で依頼できます。 |
| **カスタムサムネイル** | チャンネルの電話番号認証が必要です（YouTube Studio → 設定 → チャンネル → 機能の利用資格）。 |
| **写真の権利** | 自動取得は Wikimedia Commons の自由ライセンス画像のみで、クレジットは概要欄に自動記載されます。ご自身で撮影した写真を `assets/` に同名で置けば、そちらが優先されます（**ご自身の写真が一番のおすすめ**です）。 |

---

## パイプラインのコマンド

```bash
python bushido.py all ep02                  # すべて実行（下記を順番に）
python bushido.py fetch ep02                # ドライブから収録動画をダウンロード
python bushido.py fetch ep02 --input 動画.mp4 # 手元のファイルを使う場合
python bushido.py transcribe ep02           # 英語の文字起こし（単語ごとの時刻つき）
python bushido.py translate ep02            # 日本語字幕を作成
python bushido.py graphics ep02             # 図・カード・写真・サムネイルを作成
python bushido.py render ep02               # 本編 main.mp4 ＋ short-1〜7.mp4 を書き出し
python bushido.py upload ep02 --dry-run     # 公開スケジュールの確認だけ
python bushido.py upload ep02               # YouTube へ予約投稿（翌日もう一度実行）
```

- 途中のファイルはすべて `episodes/<回>/build/` に保存されます。**字幕を直したいときは `build/cues.json` を編集して `render` だけ再実行**すれば反映されます。
- ショートの区間や画像の位置は、`metadata.yaml` に書いた **台本のセリフ（フレーズ）を文字起こしから自動で探して**決まります。多少言い間違えても見つかりますが、見つからない場合はログに表示され、そのショートだけスキップされます（`t0` / `t1` に秒数を直接書いて指定することもできます）。

## 動作確認済みの内容（テスト環境）

台本から作った模擬の文字起こしと試験用映像で、次を確認済みです。
- 図・カード9種＋写真のワイプ＋サムネイルが生成されること
- 18か所の画像差し込み位置と7本のショート区間（19〜42秒）が台本のセリフから自動で見つかること
- 本編（1920×1080）とショート（1080×1920）に英日字幕が焼き込まれること
- 章立て（チャプター）と、月曜〜日曜の予約時刻が正しく計算されること

実際の収録での Whisper 文字起こし・Claude 翻訳・Google/YouTube への接続は、API キーと認証情報が必要なため、初回の本番実行で確認してください。
