# BUSHIDO AI — ホームページ生成「最強プロンプト」

> 使い方：下の英語プロンプト全文をコピーして、AIサイトビルダー（v0 / Lovable / Bolt /
> Framer AI）またはコーディングエージェント（Claude / Cursor）に貼るだけ。
> 【  】の箇所だけ自分の情報に置き換える。

---

## マスタープロンプト（このコードブロックを丸ごとコピー）

```
You are a senior product designer + front-end engineer. Build a high-converting,
investor-grade marketing website (single-page, multi-section, fully responsive) for
a deep-tech startup. This site will be reviewed by international startup-competition
judges (SLINGSHOT 2026, Singapore) AND by real customers, so it must read as an
"AI platform company," NOT a tour-booking site (OTA).

## Company
- Brand: BUSHIDO AI
- Legal: BUSHIDO LLC (合同会社BUSHIDO), Nagoya, Japan. Singapore entity planned.
- Founder & CEO: Kensuke Ueoka — kyudo (Japanese archery) practitioner & calligrapher
  since childhood; founder of the Nagoya Inbound Summit.
- Contact: ken.pp.1205@gmail.com
- One-liner: "The Cultural Intelligence Platform for Authentic Japan."

## What it is (positioning — obey strictly)
BUSHIDO AI uses AI + a verified network of local masters to match global travelers,
schools, and premium clients with authentic Japanese cultural experiences (kyudo, tea
ceremony, calligraphy, Zen, shrine culture), and orchestrates masters, interpreters,
transport, and itinerary into ONE trusted layer. Tagline: "Not a tour agency. A
cultural experience OS." We distribute the non-digital value of Japanese culture to
the world via AI + a trust-based local network.

## Hard rules
1. English-first content, with a JP/EN language toggle (default English). Native-
   quality English (NO machine-translation tone).
2. The hero and the first scroll must make a judge understand in 5 seconds: this is an
   AI cultural-intelligence PLATFORM with a defensible trust network — not a tour shop.
3. Include a working "AI Journey Planner" waitlist/lead form (email capture) to signal
   a real product and build first-party data. Store submissions (or POST to a
   placeholder endpoint / form service) and show a success state.
4. Mobile-first, accessible (semantic HTML, alt text, good contrast), fast.
5. Three clear audience paths in the hero: Travelers/VIP, Partners (masters/hotels/
   gov/agencies), and Investors & Press.

## Tech
- Next.js (App Router) + TypeScript + Tailwind CSS. Component-based, clean code.
- Smooth, restrained animations (subtle fade/slide on scroll; no clutter).
- SEO: proper <title>/<meta description> using "AI cultural intelligence platform,
  authentic Japan"; Open Graph + Twitter card meta; favicon; sitemap-ready.
- Performance target: Lighthouse 90+; lazy-load images; use next/image.
- Use elegant placeholder imagery (Japanese tea room, kyudo, calligraphy, shrine,
  cherry blossoms) with clearly named slots so real photos can be dropped in.

## Brand / visual language (match our pitch deck)
- Style: elegant, refined, modern wa-modern (Japanese craft meets tech).
- Colors: background deep navy #0F1B2D (and darker ink #0A1320); cream/off-white
  #F4ECDD for text on dark; gold accent #C9A24B for highlights & CTAs.
- Type: serif display headings (refined, e.g. Cormorant/Playfair-style) + clean
  sans-serif body (e.g. Inter). Generous whitespace. One message per section.

## Sections (in this order)
1. NAV: logo "BUSHIDO AI", anchor links, JP/EN toggle, primary CTA "Plan my journey".
2. HERO (split layout: copy left, refined image/looping video right):
   - H1: "The Cultural Intelligence Platform for Authentic Japan"
   - Sub: "BUSHIDO AI uses AI and a verified network of local masters to match global
     travelers, schools, and premium clients with authentic Japanese cultural
     experiences — orchestrating masters, interpreters, travel, and itinerary into one
     trusted layer."
   - 3 CTAs: "Plan my journey with AI" / "Partner with us" / "For investors"
   - Trust line: "Powered by AI · Verified local masters · From Nagoya to all of Japan"
3. SOCIAL PROOF BAR: partner/affiliation logos row — Nagoya Inbound Summit, Nihon
   Ryoko (label "In discussion"), hotels, government, media. Use placeholder logos.
4. PROBLEM: headline "Authentic Japan is locked away." Body: "Japan welcomed a record
   42.7M visitors in 2025, yet most only see the surface. Kyudo, tea ceremony,
   calligraphy, Zen, and the wisdom of local masters stay fragmented and locked behind
   language, payment, and trust barriers." Show big stats: 42.7M visitors (2025),
   ¥9.5T spending (2025), 2030 govt target 60M / ¥15T. (Source: JNTO / Japan Tourism
   Agency.)
5. HOW IT WORKS (the deep-tech core — make it a clear 3-step diagram):
   Step 1 "Tell us your intent" (purpose, interest, budget, location, language,
   learning goal) → Step 2 "AI designs your journey" (matches verified masters +
   interpreter + transport + itinerary) → Step 3 "Experience trusted, authentic Japan"
   (quality-assured, end-to-end). Section tagline: "Not a tour agency. A cultural
   experience OS."
6. EXPERIENCES showcase: cards for Kyudo, Tea Ceremony, Calligraphy, Zen, Shrine
   Culture. Each card: image, short line, a "Verified Master" badge, region, languages.
   Framing: these are the inventory/quality proof the AI assembles — not a checkout.
7. WHY BUSHIDO (our moat): 3 pillars — "Authentic insider" (founder is a kyudo master
   & calligrapher), "Verified trust network" (built via JC, BNI, Nagoya Inbound
   Summit), "AI + human trust" (a moat a generic OTA or pure AI can't reproduce).
8. FOR WHOM: four blocks — Travelers/VIP, Schools, Corporates (bushido/culture
   training), Masters & Regional Partners — each with value prop + CTA.
9. TRACTION: Nagoya Inbound Summit (1st held Apr 2026), live experiences delivered
   (kyudo, tea, calligraphy), business talks with Nihon Ryoko, active hotel/government/
   travel-agency relationships. Show as a clean timeline or stat cards.
10. VISION & FOUNDER: founder photo slot + short story of Kensuke Ueoka (kyudo &
    calligraphy since childhood; mission to deliver Japan's spirit to the world).
    Vision statement: "We're building the infrastructure that delivers the spirit of
    Japanese culture to the world."
11. AI JOURNEY PLANNER (lead capture / product signal): short form — interests,
    travel dates, party size, email — CTA "Get my AI-personalized Japan itinerary —
    join the beta." Validate, show success state, store/POST submissions.
12. FOOTER: BUSHIDO LLC (合同会社BUSHIDO), Nagoya, Japan · Singapore entity (planned) ·
    email · social links · JP/EN toggle · copyright.

## Japanese (JP toggle) copy for the key sections
- HERO H1: 本物の日本を、AIで。— 文化体験インテリジェンス・プラットフォーム
- HERO Sub: BUSHIDO AIは、AIと“検証済みの達人ネットワーク”で、海外旅行者・教育機関・VIPを
  本物の日本文化体験につなぎ、達人・通訳・移動・行程を一つの信頼レイヤーに統合します。
- HOW IT WORKS tagline: 観光会社ではない。文化体験のOSだ。
- VISION: 日本の精神文化を世界に届けるインフラをつくる。

## Deliverable
A complete, runnable project. Provide the full file structure and all component code.
After building, list what to replace with real assets (logos, photos, domain, form
endpoint) using clearly marked TODO comments.
```

---

## 置き換える【  】箇所

- 連絡先メール（既に `ken.pp.1205@gmail.com` を記載済み）
- 独自ドメイン（例 `bushido-ai.com`）→ デプロイ時に設定
- 実ロゴ・実写真・フォーム送信先（フォーム後の TODO コメントに従う）

---

## ツール別の一言追記（任意）

- **v0 / Lovable / Bolt**：そのまま貼ればOK。生成後「make it more elegant / refine the
  hero」で微調整。
- **Framer AI**：「Build this as a Framer site」を先頭に追加。
- **Claude / Cursor（自前リポジトリ）**：先頭に「Create a new Next.js project and
  implement the following」を追加。

---

## 仕上げ後の必須チェック

英語ネイティブ品質 / トップ5秒でAIプラットフォームと伝わる / AIプランナー動作 /
実績ロゴ・数字 / 独自ドメイン・HTTPS・OGP・高速・GA4 / デッキとブランド統一。
