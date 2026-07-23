# Devi Vacation × BUSHIDO JAPAN — Thailand Private Tour LP

日本人のための完全貸切タイ・プライベートツアーのランディングページ。

`index.html` 単体で完結しています（外部依存は Google Fonts のみ）。そのままサーバーに置く／Netlify 等にドラッグ&ドロップでデプロイできます。

---

## 1. LINEの相談リンクを設定する（最重要）

`index.html` 末尾の `<script>` 内、この1行だけ書き換えれば、ページ内すべての「LINEで相談」ボタンに反映されます。

```js
const LINE_URL="#contact"; // ← ここを自分のLINE URLに変更
```

例:
```js
const LINE_URL="https://lin.ee/xxxxxxx";          // LINE公式アカウントの短縮リンク
// または
const LINE_URL="https://line.me/R/ti/p/@your-id"; // @から始まるLINE ID
```

設定すると、ナビ・ヒーロー・フローティングボタン・最終CTAの全リンクが自動でそのURL（別タブ）を開きます。

---

## 2. 写真の入れ方（フリー素材 / 実写）

> ⚠️ 制作環境のネットワークポリシーで外部画像サイト（Unsplash 等）への接続がブロックされていたため、
> 画像は**アート・ディレクションされたグラデーション**で仕上げ、そこに**実写を差し込むスロット**を用意しています。
> 写真を入れなくても崩れず高級感を保ち、入れれば一段と映えます（背景CSSなので、URLが切れても壊れたアイコンは出ません）。

`index.html` と同じ階層に `images/` フォルダを作り、写真を置いてから、各スロットに1行足すだけです。

### スタッフ写真（岩田まゆき / 上岡賢輔）
HTML内の該当箇所（`<!-- 岩田まゆき｜real photo... -->` のコメントが目印）で:

```html
<!-- 変更前 -->
<div class="staff-card__photo">
<!-- 変更後 -->
<div class="staff-card__photo" style="--p-photo:url('images/iwata.jpg')">
```

同様に `.portrait`（ヒーロー直後の信頼バンド）にも `--p-photo` を指定できます。
写真を入れたら、中の `<span class="mono">ま</span>` / `賢` は消してかまいません（残しても写真の下に隠れます）。

### プラン背景写真（バンコク / チェンマイ 等）
各プランカードの `.plan__inner` に:

```html
<div class="plan__inner" style="--plan-photo:url('images/bangkok.jpg')">
```

### ヒーロー / ビジョン / 最終CTA の背景写真
それぞれ `--hero-photo` / `--vision-photo` / `--final-photo` を該当セクションの `style` に足すか、`:root` にまとめて指定:

```html
<header class="hero" id="top" style="--hero-photo:url('images/thailand-hero.jpg')">
```

### フリー素材のおすすめ検索キーワード（Unsplash / Pexels など）
- Hero: `Wat Arun Bangkok`, `Bangkok temple sunset`, `Grand Palace Thailand`
- バンコク: `Bangkok street food`, `Chao Phraya boat`, `Bangkok night market`
- チェンマイ: `Doi Suthep`, `Chiang Mai old city`, `Thailand elephant sanctuary`
- ビジネス: `Bangkok skyline business`, `Thailand market wholesale`

> 実在するお二人（岩田まゆきさん・上岡賢輔さん）には、他人のストック写真ではなく**ご本人の写真**を入れてください。
> 差し替えるまでは、頭文字モノグラム（「ま」「賢」）のデザイン枠が表示されます。

---

## 3. 差し替え時の注意
- 画像は横長は `1600px` 幅程度、ポートレート（人物）は `3:4` 比率が枠にフィットします。
- 容量は各 200〜400KB 目安（WebP 推奨）に圧縮するとページが軽く保てます。

---

## セクション構成
Hero → 信頼バンド（アテンダー紹介）→ About → こんな方におすすめ → オーダーメイド → 人気プラン → 選ばれる理由 → アテンドスタッフ → ご利用の流れ → FAQ → 私たちが目指す旅 → 運営体制 → 最終CTA → Footer ／ 追従LINEボタン
