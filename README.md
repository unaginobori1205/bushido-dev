# BUSHIDO AI — Marketing Website

> **The Cultural Intelligence Platform for Authentic Japan.**
> Not a tour agency. A cultural experience OS.

An investor-grade, single-page, fully responsive marketing site for **BUSHIDO AI**
(BUSHIDO LLC / 合同会社BUSHIDO, Nagoya, Japan). Built to read as an **AI cultural-
intelligence platform** — for SLINGSHOT 2026 judges and real customers alike.

- **English-first** content with a **JP/EN toggle** (default English).
- **AI Journey Planner** lead-capture form with validation, success state, and
  first-party data capture.
- Mobile-first, accessible (semantic HTML, alt text, focus states, reduced-motion
  support), fast.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS**
- `next/font` (Cormorant Garamond display + Inter body)
- `next/image` for lazy-loaded, optimized imagery
- Dynamic Open Graph / Twitter card via `next/og`
- Restrained scroll animations via `IntersectionObserver`

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint
```

## Project structure

```
.
├── app/
│   ├── layout.tsx              # fonts, SEO metadata, OG/Twitter, <LanguageProvider>
│   ├── page.tsx                # composes all sections in order
│   ├── globals.css             # Tailwind layers + brand component classes
│   ├── icon.svg                # favicon
│   ├── opengraph-image.tsx     # dynamic 1200×630 social card
│   ├── twitter-image.tsx       # reuses the OG composition
│   ├── sitemap.ts              # sitemap.xml
│   ├── robots.ts               # robots.txt
│   └── api/waitlist/route.ts   # lead-capture endpoint
├── components/
│   ├── LanguageProvider.tsx    # EN/JP context + localStorage persistence
│   ├── Reveal.tsx              # scroll-reveal wrapper (respects reduced-motion)
│   ├── PlaceholderImage.tsx    # named image slots → /public/images
│   ├── Nav.tsx                 # 1. fixed nav, lang toggle, mobile menu
│   ├── Hero.tsx                # 2. hero (3 CTAs, trust line)
│   ├── SocialProof.tsx         # 3. partner / affiliation bar
│   ├── Problem.tsx             # 4. problem + JNTO stats
│   ├── HowItWorks.tsx          # 5. 3-step diagram
│   ├── Experiences.tsx         # 6. experience cards (Verified Master badge)
│   ├── WhyBushido.tsx          # 7. moat — 3 pillars
│   ├── ForWhom.tsx             # 8. four audience blocks
│   ├── Traction.tsx            # 9. timeline
│   ├── VisionFounder.tsx       # 10. vision + founder
│   ├── JourneyPlanner.tsx      # 11. AI Journey Planner lead form
│   └── Footer.tsx              # 12. footer
├── lib/content.ts              # ALL bilingual copy (EN source of truth + JP)
├── scripts/gen-placeholders.mjs# regenerates /public/images/*.svg
└── public/images/*.svg         # placeholder imagery (clearly labelled)
```

## Brand tokens (`tailwind.config.ts`)

| Token            | Value     | Use                         |
| ---------------- | --------- | --------------------------- |
| `navy`           | `#0F1B2D` | primary background          |
| `navy.deep`      | `#0A1320` | darker ink panels           |
| `cream`          | `#F4ECDD` | text on dark                |
| `gold`           | `#C9A24B` | accents & CTAs              |
| `font-serif`     | Cormorant | display headings            |
| `font-sans`      | Inter     | body                        |

## ✅ Replace before launch (search the codebase for `TODO`)

1. **Photography / video** — drop real photos into `public/images/` using these
   exact filenames (slots already wired in `components/PlaceholderImage.tsx`):
   | File | Used for | Status |
   | --- | --- | --- |
   | `hero.jpg` | Hero — kyudo dojo group lesson | wired ✅ |
   | `kyudo.jpg` | Kyudo card — one-on-one instruction | wired ✅ |
   | `zen.jpg` | Zen card — seated meditation | wired ✅ |
   | `shrine.jpg` | Shrine card — wedding kimono | wired ✅ |
   | `samurai.jpg` | Corporates block — armor at Nagoya Castle | wired ✅ |
   | `tea.svg` · `calligraphy.svg` · `founder.svg` | Tea / Calligraphy / Founder | placeholder — awaiting real photos |

   Until a real `*.jpg` is present those slots 404 on the live site; regenerate
   `preview.html` with `npm run preview`, which falls back to the matching
   `*.svg` placeholder. Once all real photos are in, remove `dangerouslyAllowSVG`
   from `next.config.mjs`. The hero can become a looping `<video>` (see TODO in
   `components/Hero.tsx`).
2. **Partner logos** — `components/SocialProof.tsx` renders text labels. Swap in
   real monochrome logos (Nagoya Inbound Summit, Nihon Ryoko, hotels, government,
   media).
3. **Domain** — replace `https://bushido.ai` in `app/layout.tsx`, `app/sitemap.ts`,
   and `app/robots.ts`.
4. **Form endpoint** — `app/api/waitlist/route.ts` appends to a local
   `data/waitlist.json` in dev. For production, either set the
   `WAITLIST_FORWARD_URL` env var to forward submissions to a form service, or
   replace the storage block with your DB / CRM / Resend / Supabase integration.
   (Serverless filesystems are ephemeral — use a managed destination in prod.)
5. **Social links** — `components/Footer.tsx` (`SOCIAL`) and the Twitter handle in
   `app/layout.tsx`.
6. **Copy** — all wording lives in `lib/content.ts` (`en` / `ja`). Edit there only.

## Deploy to Netlify

Two options:

**A. Instant static drop (no build, no account login needed)**
1. Grab `static-export/index.html` (a fully self-contained single file — CSS,
   JS, and all images inlined).
2. Go to <https://app.netlify.com/drop> and drag the file in.
3. It's live in seconds. The JP/EN toggle, AI-team accordion, and the form's
   success state all work. Note: the form is demo-only here (no server storage).
   Regenerate this file anytime with `npm run preview && cp preview.html
   static-export/index.html`.

**B. Full Next.js site via Git (recommended for production)**
1. Push this repo to GitHub (already done on the working branch).
2. On Netlify: **Add new site → Import an existing project** → pick the repo.
3. `netlify.toml` is already configured (`@netlify/plugin-nextjs`), so SSR, the
   `/api/waitlist` lead-capture route, `next/image` optimization, and the
   sitemap/robots/OG routes all work. No manual build settings needed.
4. Set any env vars (e.g. `WAITLIST_FORWARD_URL`) under Site settings → Env.

## Accessibility & performance notes

- Semantic landmarks (`header`/`main`/`footer`/`nav`/`section`), labelled form
  fields, `aria-live` success/error states, skip link, visible focus rings.
- `prefers-reduced-motion` disables reveal animations and smooth scroll.
- `<html lang>` updates with the language toggle.
- Images lazy-load via `next/image` (hero uses `priority`).
- Self-hosted fonts via `next/font` with `display: swap`.
