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

## 2. 写真について

> ✅ **スタッフ2名（岩田さん・上岡さん）の実写は `index.html` に直接埋め込み済み**です（Base64）。
> 外部ファイルに依存しないので、`index.html` 単体で写真ごと表示されます。差し替えたい場合は下記のスロットに新しい写真を指定してください。
>
> ✅ **ヒーロー・人気スポット・プランの背景写真は Wikimedia Commons のフリー画像URLを設定済み**です。
> ブラウザで開くと写真が表示されます（背景CSSのURL参照方式。万一URLが切れてもグラデーションが出るだけで壊れません）。
>
> ⚠️ 制作環境からは画像ホストへ接続できないため、私の側でのプレビュー確認はできていません。**実機ブラウザで表示を必ずご確認ください。** 気に入らない写真は各スロットのURLを差し替えるだけで変更できます。

### 写真の出典（Wikimedia Commons／要ライセンス確認）
以下はフリー（多くは CC BY-SA / CC BY）ですが、商用利用時は**帰属表示**が必要な場合があります。フッターに「写真：Wikimedia Commons」のクレジットを入れています。厳密な運用や、帰属不要な素材（Unsplash / Pexels 等）に差し替える場合は各URLを置き換えてください。

| 箇所 | Commonsファイル |
|---|---|
| ヒーロー | Wat Arun from Chao Phraya River at sunset.jpg |
| No.1 3大寺院 | Bangkok Grand Palace Wat Phra Kaew triple.jpg |
| アユタヤ | Buddha Head in Tree Roots, Wat Mahathat, Ayutthaya.jpg |
| ワット・パクナム | Wat Pak Nam Phasi Charoen (I).jpg |
| プーケット | Surin Beach.JPG |
| ナイトマーケット | Train Night Market Ratchada (34079339800).jpg |
| プラン：バンコク半日 | Wat Arun from Chao Phraya River.jpg |
| プラン：バンコク1日 | Grand Palace Bangkok, Thailand.jpg |
| プラン：チェンマイ | Wat Phra That Doi Suthep - Chiang Mai.jpg |

各画像は `https://commons.wikimedia.org/wiki/Special:FilePath/<ファイル名>?width=...` 形式で参照しています（`?width=` の数値で表示解像度を調整可）。

背景に写真を足す場合は、`index.html` と同じ階層に `images/` フォルダを作り、写真を置いてから、各スロットに1行足すだけです。

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

### 観光スポットランキングの写真（人気の観光スポット）
各スポットカードに `--spot-photo` を指定します（現状はスポットごとの雰囲気に合わせたグラデーション表示）。

```html
<article class="spot spot-feature spot--temple ..." style="--spot-photo:url('images/spot-temples.jpg')">
<article class="spot spot--ayutthaya" style="--spot-photo:url('images/spot-ayutthaya.jpg')">
<article class="spot spot--paknam"    style="--spot-photo:url('images/spot-paknam.jpg')">
<article class="spot spot--phuket"    style="--spot-photo:url('images/spot-phuket.jpg')">
<article class="spot spot--night"     style="--spot-photo:url('images/spot-night.jpg')">
```

おすすめ検索ワード（フリー・商用可のUnsplash / Pexels 等）：
`Wat Arun sunset` / `Wat Pho reclining buddha` / `Ayutthaya buddha head tree` / `Wat Paknam ceiling` / `Phuket beach` / `Ratchada train night market`
> ⚠️ 制作環境のネットワーク制限で外部画像を取得できないため、写真は入れていません。上記スロットに1行足すだけで差し込めます。

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

### スタッフ写真を差し替える場合（すでに埋め込み済み）
`index.html` 内 `--photo-iwata`（岩田さん＝象の写真）／ `--photo-kamioka`（上岡さん＝袴の写真）の Base64 を、新しい写真の Base64 に置き換えます。表示位置は各スロットの `--p-pos:center 24%` の数値で微調整できます（小さい値ほど上寄り）。

---

## 3. 料金について（要確認）
人気プラン内の価格は「**1グループ最大4名までの完全貸切料金（グループ単価）**」として設定した**目安（たたき台）**です。

| プラン | 表示価格（1グループ 最大4名） |
|---|---|
| バンコク半日（4〜5h） | ¥29,800〜 |
| バンコク1日（8〜10h）★人気No.1 | ¥49,800〜 |
| チェンマイ満喫（終日） | ¥54,800〜 |
| ビジネス視察 | 応相談 |

> 参考（御社の支払い側／LP非表示）：Deviへ10%＋日本人ガイド日当¥10,000（経費別）。上記販売価格は原価に十分な利益を確保した設定です。

- 実際の原価・利益設計はお二人にしか分からないため、**必ず実額に合わせて調整してください。**
- 金額は `index.html` 内の `¥19,800` などを直接書き換えるだけです（`.plan__price` を検索）。
- 「料金に含まれるもの／別途実費」の記載も、プランの下の `price-note` セクションで編集できます。

---

## 4. 差し替え時の注意
- 画像は横長は `1600px` 幅程度、ポートレート（人物）は `3:4` 比率が枠にフィットします。
- 容量は各 200〜400KB 目安（WebP 推奨）に圧縮するとページが軽く保てます。

---

## 5. 日本語 / 英語 切り替え（英訳ボタン）
ナビ右上の **「日本語 / EN」ボタン**でページ全体を英語に切り替えられます。
- 選択はブラウザに記憶され（`localStorage`）、次回アクセス時も維持されます。
- 各テキストは要素の `data-en="..."` 属性に英訳が入っています。**英文を直したい場合はその `data-en` の値を書き換える**だけです（日本語側はそのまま表示テキストを編集）。
- 英語ページのブラウザタブ名は `<script>` 内 `TITLE.en` で変更できます。
- 価格（¥）は日英共通です。通貨表記を英語版だけ変えたい場合は各 `data-en` の金額部分を編集してください。

---

## セクション構成
Hero → 信頼バンド（アテンダー紹介）→ About → こんな方におすすめ → オーダーメイド → 人気プラン → 選ばれる理由 → アテンドスタッフ → ご利用の流れ → FAQ → 私たちが目指す旅 → 運営体制 → 最終CTA → Footer ／ 追従LINEボタン ／ 日本語・英語トグル
