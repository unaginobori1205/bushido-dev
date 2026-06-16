/**
 * Generates a single, self-contained preview.html that can be opened directly
 * in any browser (no Node / npm server needed) to confirm the design AND the
 * working JP/EN language toggle.
 *
 * It reuses lib/content.ts as the single source of truth (transpiled on the
 * fly) and inlines the placeholder SVGs as data URIs, so the output is one
 * portable file.
 *
 * Run:  node scripts/gen-preview.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// --- 1. Load the bilingual content dictionary (single source of truth) -------
const tsSource = readFileSync(resolve(root, "lib/content.ts"), "utf8");
const js = ts.transpileModule(tsSource, {
  compilerOptions: { module: "ESNext", target: "ES2020" },
}).outputText;
const dataUrl =
  "data:text/javascript;base64," + Buffer.from(js).toString("base64");
const { content } = await import(dataUrl);

// --- 2. Inline imagery as data URIs (prefer real photos over placeholders) ---
const imgDir = resolve(root, "public/images");
const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};
// Real photos win over the .svg placeholder for the same slot name.
const PRIORITY = { ".jpg": 3, ".jpeg": 3, ".png": 3, ".webp": 3, ".svg": 1 };
const images = {};
const chosenExt = {};
for (const file of readdirSync(imgDir)) {
  const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
  if (!MIME[ext]) continue;
  const slot = basename(file, ext);
  if (chosenExt[slot] && PRIORITY[chosenExt[slot]] >= PRIORITY[ext]) continue;
  if (ext === ".svg") {
    images[slot] =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(readFileSync(resolve(imgDir, file), "utf8"));
  } else {
    images[slot] =
      `data:${MIME[ext]};base64,` +
      readFileSync(resolve(imgDir, file)).toString("base64");
  }
  chosenExt[slot] = ext;
}

// --- 3. Emit the self-contained HTML -----------------------------------------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BUSHIDO AI — The Cultural Intelligence Platform for Authentic Japan</title>
<meta name="description" content="AI cultural intelligence platform for authentic Japan. Verified masters, orchestrated end-to-end. A cultural experience OS." />
<link rel="icon" href="${images.kyudo ?? ""}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
<style>__TAILWIND_CSS__</style>
</head>
<body>
<header class="fixed inset-x-0 top-0 z-50 border-b border-cream/10 bg-navy-deep/85 backdrop-blur-md">
  <nav class="container-content flex h-16 items-center justify-between">
    <a href="#top" class="flex items-center gap-2.5">
      <span class="relative flex h-7 w-7 items-center justify-center"><span class="absolute inset-0 rounded-full border-2 border-gold"></span><span class="h-2 w-2 rounded-full bg-gold"></span></span>
      <span class="font-serif text-xl font-semibold tracking-wide">BUSHIDO <span class="text-gold">AI</span></span>
    </a>
    <ul id="nav-links" class="hidden items-center gap-7 lg:flex"></ul>
    <div class="flex items-center gap-3">
      <button id="lang-toggle" class="rounded-full border border-cream/25 px-3 py-1.5 text-xs font-semibold tracking-wider text-cream transition-colors hover:border-gold hover:text-gold"></button>
      <a href="#planner" id="nav-cta" class="btn-primary"></a>
    </div>
  </nav>
</header>
<main id="app"></main>
<footer id="footer" class="border-t border-cream/10 bg-navy-deep py-14"></footer>

<script>
const CONTENT = ${JSON.stringify(content)};
const IMAGES = ${JSON.stringify(images)};
let lang = "en";

const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function render() {
  const t = CONTENT[lang];
  document.documentElement.lang = lang;
  document.title = t.hero.h1 + " — BUSHIDO AI";

  // Nav
  document.getElementById("nav-links").innerHTML = t.nav.links
    .map((l) => \`<li><a href="\${l.href}" class="text-sm text-cream/80 transition-colors hover:text-gold">\${esc(l.label)}</a></li>\`)
    .join("");
  document.getElementById("nav-cta").textContent = t.nav.cta;
  document.getElementById("lang-toggle").textContent = t.nav.langLabel;

  document.getElementById("app").innerHTML = [
    heroSection(t), socialSection(t), problemSection(t), howSection(t),
    experiencesSection(t), whySection(t), forWhomSection(t), tractionSection(t),
    visionSection(t), plannerSection(t),
  ].join("");

  document.getElementById("footer").innerHTML = footerSection(t);
  bindForm();
}

function heroSection(t){const h=t.hero;return \`
<section id="top" class="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
  <div class="container-content grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
    <div class="max-w-xl">
      <p class="eyebrow"><span class="h-px w-6 bg-gold"></span>\${esc(h.eyebrow)}</p>
      <h1 class="mt-5 text-4xl font-semibold leading-[1.08] text-cream sm:text-5xl lg:text-6xl">\${esc(h.h1)}</h1>
      <p class="mt-6 text-lg leading-relaxed text-cream/75">\${esc(h.sub)}</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href="\${h.ctas.primary.href}" class="btn-primary">\${esc(h.ctas.primary.label)}</a>
        <a href="\${h.ctas.secondary.href}" class="btn-ghost">\${esc(h.ctas.secondary.label)}</a>
        <a href="\${h.ctas.tertiary.href}" class="btn-ghost">\${esc(h.ctas.tertiary.label)}</a>
      </div>
      <p class="mt-8 flex items-center gap-2 text-sm text-cream/55"><span class="inline-block h-1.5 w-1.5 rounded-full bg-gold"></span>\${esc(h.trust)}</p>
    </div>
    <div class="relative mx-auto max-w-lg lg:max-w-none">
      <div class="overflow-hidden rounded-3xl border border-cream/10 shadow-2xl"><img src="\${IMAGES.hero}" alt="Kyudo — the way of the bow" class="h-full w-full object-cover" /></div>
      <div class="absolute bottom-4 left-4 rounded-full border border-gold/30 bg-navy-deep/80 px-4 py-2 text-xs text-cream/85 backdrop-blur">\${esc(h.imageCaption)}</div>
    </div>
  </div>
</section>\`;}

function socialSection(t){const s=t.socialProof;return \`
<section class="border-y border-cream/10 bg-navy-deep/40 py-8"><div class="container-content">
  <p class="text-center text-xs uppercase tracking-[0.22em] text-cream/45">\${esc(s.label)}</p>
  <ul class="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">\${s.partners.map((p)=>\`<li class="flex items-center gap-2 text-cream/55"><span class="h-2 w-2 rotate-45 border border-gold/50"></span><span class="font-serif text-lg">\${esc(p.name)}</span>\${p.tag?\`<span class="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">\${esc(p.tag)}</span>\`:""}</li>\`).join("")}</ul>
</div></section>\`;}

function problemSection(t){const p=t.problem;return \`
<section id="problem" class="py-20 sm:py-28"><div class="container-content">
  <div class="mx-auto max-w-3xl text-center">
    <p class="eyebrow justify-center">\${esc(p.eyebrow)}</p>
    <h2 class="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">\${esc(p.h2)}</h2>
    <p class="mt-6 text-lg leading-relaxed text-cream/70">\${esc(p.body)}</p>
  </div>
  <div class="mt-14 grid gap-5 sm:grid-cols-3">\${p.stats.map((st)=>\`<article class="card card-hover h-full p-7 text-center"><div class="font-serif text-4xl font-semibold text-gold sm:text-5xl">\${esc(st.value)}</div><div class="mt-3 text-base font-medium text-cream">\${esc(st.label)}</div>\${st.note?\`<div class="mt-1 text-sm text-cream/50">\${esc(st.note)}</div>\`:""}</article>\`).join("")}</div>
  <p class="mt-6 text-center text-xs text-cream/40">\${esc(p.source)}</p>
</div></section>\`;}

function howSection(t){const h=t.how;return \`
<section id="how" class="border-y border-cream/10 bg-navy-deep/40 py-20 sm:py-28"><div class="container-content">
  <div class="mx-auto max-w-3xl text-center"><p class="eyebrow justify-center">\${esc(h.eyebrow)}</p><h2 class="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">\${esc(h.h2)}</h2></div>
  <ol class="relative mt-16 grid gap-8 md:grid-cols-3">\${h.steps.map((s)=>\`<li><div class="flex flex-col items-center text-center md:items-start md:text-left"><div class="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-navy"><span class="font-serif text-2xl font-semibold text-gold">\${esc(s.index)}</span></div><h3 class="mt-5 text-xl font-semibold text-cream">\${esc(s.title)}</h3><p class="mt-3 text-base leading-relaxed text-cream/70">\${esc(s.body)}</p></div></li>\`).join("")}</ol>
  <p class="mt-16 text-center font-serif text-2xl italic text-gold sm:text-3xl">“\${esc(h.tagline)}”</p>
</div></section>\`;}

function experiencesSection(t){const e=t.experiences;return \`
<section id="experiences" class="py-20 sm:py-28"><div class="container-content">
  <div class="mx-auto max-w-3xl text-center"><p class="eyebrow justify-center">\${esc(e.eyebrow)}</p><h2 class="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">\${esc(e.h2)}</h2><p class="mt-6 text-lg leading-relaxed text-cream/70">\${esc(e.intro)}</p></div>
  <ul class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">\${e.cards.map((c)=>\`<li><article class="card card-hover group h-full overflow-hidden"><div class="relative aspect-[4/3] overflow-hidden"><img src="\${IMAGES[c.key]}" alt="\${esc(c.name)} — \${esc(c.line)}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-navy-deep to-transparent"></div><span class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-navy-deep/80 px-3 py-1 text-[11px] font-medium text-gold backdrop-blur">★ \${esc(e.verified)}</span></div><div class="p-6"><h3 class="font-serif text-2xl font-semibold text-cream">\${esc(c.name)}</h3><p class="mt-2 text-sm leading-relaxed text-cream/70">\${esc(c.line)}</p><dl class="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-cream/10 pt-4 text-xs"><div><dt class="uppercase tracking-wider text-cream/40">\${esc(e.regionLabel)}</dt><dd class="mt-0.5 text-cream/85">\${esc(c.region)}</dd></div><div><dt class="uppercase tracking-wider text-cream/40">\${esc(e.langLabel)}</dt><dd class="mt-0.5 text-cream/85">\${esc(c.languages)}</dd></div></dl></div></article></li>\`).join("")}</ul>
</div></section>\`;}

function whySection(t){const w=t.why;return \`
<section id="why" class="border-y border-cream/10 bg-navy-deep/40 py-20 sm:py-28"><div class="container-content">
  <div class="mx-auto max-w-3xl text-center"><p class="eyebrow justify-center">\${esc(w.eyebrow)}</p><h2 class="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">\${esc(w.h2)}</h2><p class="mt-6 text-lg leading-relaxed text-cream/70">\${esc(w.intro)}</p></div>
  <div class="mt-14 grid gap-6 md:grid-cols-3">\${w.pillars.map((p)=>\`<article class="card card-hover h-full p-7"><div class="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 text-gold">◆</div><h3 class="mt-5 text-xl font-semibold text-cream">\${esc(p.title)}</h3><p class="mt-3 text-base leading-relaxed text-cream/70">\${esc(p.body)}</p></article>\`).join("")}</div>
</div></section>\`;}

function forWhomSection(t){const f=t.forWhom;return \`
<section id="for-whom" class="py-20 sm:py-28"><div class="container-content">
  <div class="mx-auto max-w-3xl text-center"><p class="eyebrow justify-center">\${esc(f.eyebrow)}</p><h2 class="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">\${esc(f.h2)}</h2></div>
  <div class="mt-14 grid items-start gap-6 sm:grid-cols-2">\${f.blocks.map((b)=>\`<article class="card card-hover flex h-full flex-col overflow-hidden">\${b.slot&&IMAGES[b.slot]?\`<div class="relative aspect-[16/9] overflow-hidden"><img src="\${IMAGES[b.slot]}" alt="\${esc(b.title)}" class="h-full w-full object-cover" /><div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy-deep/80 to-transparent"></div></div>\`:""}<div class="flex flex-1 flex-col p-7"><h3 class="font-serif text-2xl font-semibold text-cream">\${esc(b.title)}</h3><p class="mt-3 flex-1 text-base leading-relaxed text-cream/70">\${esc(b.value)}</p><a href="#planner" class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-soft">\${esc(b.cta)} →</a></div></article>\`).join("")}</div>
</div></section>\`;}

function tractionSection(t){const tr=t.traction;return \`
<section id="traction" class="border-y border-cream/10 bg-navy-deep/40 py-20 sm:py-28"><div class="container-content">
  <div class="mx-auto max-w-3xl text-center"><p class="eyebrow justify-center">\${esc(tr.eyebrow)}</p><h2 class="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">\${esc(tr.h2)}</h2><p class="mt-6 text-lg leading-relaxed text-cream/70">\${esc(tr.intro)}</p></div>
  <ol class="relative mx-auto mt-14 max-w-3xl border-l border-gold/30 pl-8">\${tr.items.map((i)=>\`<li class="relative mb-8 last:mb-0"><span class="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full border-2 border-gold bg-navy"></span><span class="text-xs font-semibold uppercase tracking-wider text-gold">\${esc(i.date)}</span><h3 class="mt-1 text-xl font-semibold text-cream">\${esc(i.title)}</h3><p class="mt-2 text-base leading-relaxed text-cream/70">\${esc(i.body)}</p></li>\`).join("")}</ol>
</div></section>\`;}

function visionSection(t){const v=t.vision;return \`
<section id="vision" class="py-20 sm:py-28"><div class="container-content">
  <div class="mx-auto max-w-4xl text-center"><p class="eyebrow justify-center">\${esc(v.eyebrow)}</p><blockquote class="mt-6 font-serif text-3xl font-medium leading-snug text-cream sm:text-4xl lg:text-5xl">“\${esc(v.statement)}”</blockquote></div>
  <div class="mt-16 grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14">
    <div class="mx-auto max-w-sm"><div class="overflow-hidden rounded-3xl border border-cream/10 shadow-2xl"><img src="\${IMAGES.founder}" alt="Portrait of \${esc(v.founderName)}" class="h-full w-full object-cover" /></div><p class="mt-3 text-center text-xs text-cream/50">\${esc(v.photoCaption)}</p></div>
    <div><h2 class="text-3xl font-semibold text-cream sm:text-4xl">\${esc(v.h2)}</h2><p class="mt-2 text-sm font-medium uppercase tracking-wider text-gold">\${esc(v.founderName)} · \${esc(v.founderRole)}</p><div class="mt-6 space-y-4">\${v.founderStory.map((p)=>\`<p class="text-base leading-relaxed text-cream/75">\${esc(p)}</p>\`).join("")}</div></div>
  </div>
</div></section>\`;}

function plannerSection(t){const p=t.planner;return \`
<section id="planner" class="border-y border-cream/10 bg-navy-deep/60 py-20 sm:py-28"><div class="container-content"><div class="mx-auto max-w-2xl">
  <div class="text-center"><p class="eyebrow justify-center">\${esc(p.eyebrow)}</p><h2 class="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">\${esc(p.h2)}</h2><p class="mt-5 text-lg leading-relaxed text-cream/70">\${esc(p.sub)}</p></div>
  <div id="planner-card" class="card mt-10 p-6 sm:p-8">
    <form id="planner-form" class="space-y-6" novalidate>
      <fieldset><legend class="text-sm font-medium text-cream">\${esc(p.fields.interests)}</legend><div class="mt-3 flex flex-wrap gap-2">\${p.fields.interestsOptions.map((o)=>\`<button type="button" class="chip rounded-full border border-cream/20 px-4 py-2 text-sm text-cream/75 transition-all hover:border-cream/40" data-val="\${esc(o)}">\${esc(o)}</button>\`).join("")}</div></fieldset>
      <div class="grid gap-6 sm:grid-cols-2">
        <div><label class="text-sm font-medium text-cream" for="f-dates">\${esc(p.fields.dates)}</label><input id="f-dates" type="text" class="mt-2 w-full rounded-lg border border-cream/20 bg-navy/60 px-4 py-2.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none" placeholder="\${lang==="ja"?"例:2026年秋":"e.g. Autumn 2026"}" /></div>
        <div><label class="text-sm font-medium text-cream" for="f-party">\${esc(p.fields.party)}</label><select id="f-party" class="mt-2 w-full rounded-lg border border-cream/20 bg-navy/60 px-4 py-2.5 text-cream focus:border-gold focus:outline-none"><option value="">—</option>\${p.fields.partyOptions.map((o)=>\`<option class="bg-navy-deep">\${esc(o)}</option>\`).join("")}</select></div>
      </div>
      <div><label class="text-sm font-medium text-cream" for="f-aud">\${esc(p.fields.audience)}</label><select id="f-aud" class="mt-2 w-full rounded-lg border border-cream/20 bg-navy/60 px-4 py-2.5 text-cream focus:border-gold focus:outline-none"><option value="">—</option>\${p.fields.audienceOptions.map((o)=>\`<option class="bg-navy-deep">\${esc(o)}</option>\`).join("")}</select></div>
      <div><label class="text-sm font-medium text-cream" for="f-email">\${esc(p.fields.email)}</label><input id="f-email" type="email" required class="mt-2 w-full rounded-lg border border-cream/20 bg-navy/60 px-4 py-2.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none" placeholder="\${esc(p.fields.emailPlaceholder)}" /><p id="f-email-err" class="mt-1.5 hidden text-sm text-red-300">\${lang==="ja"?"有効なメールアドレスを入力してください。":"Please enter a valid email address."}</p></div>
      <button type="submit" class="btn-primary w-full text-base">\${esc(p.submit)}</button>
      <p class="text-center text-xs text-cream/45">\${esc(p.privacy)}</p>
    </form>
  </div>
</div></div></section>\`;}

function footerSection(t){const f=t.footer;return \`
<div class="container-content"><div class="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
  <div><div class="flex items-center gap-2.5"><span class="relative flex h-7 w-7 items-center justify-center"><span class="absolute inset-0 rounded-full border-2 border-gold"></span><span class="h-2 w-2 rounded-full bg-gold"></span></span><span class="font-serif text-xl font-semibold text-cream">BUSHIDO <span class="text-gold">AI</span></span></div>
    <p class="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">\${esc(f.legal)}<br>\${esc(f.location)}<br>\${esc(f.singapore)}</p>
    <a href="mailto:\${f.email}" class="mt-4 inline-block text-sm text-gold hover:text-gold-soft">\${esc(f.email)}</a></div>
  <nav><h2 class="text-xs font-semibold uppercase tracking-wider text-cream/45">\${esc(f.nav)}</h2><ul class="mt-4 space-y-2.5">\${t.nav.links.map((l)=>\`<li><a href="\${l.href}" class="text-sm text-cream/70 hover:text-gold">\${esc(l.label)}</a></li>\`).join("")}</ul></nav>
  <div><h2 class="text-xs font-semibold uppercase tracking-wider text-cream/45">\${esc(f.social)}</h2><ul class="mt-4 space-y-2.5"><li><a href="#" class="text-sm text-cream/70 hover:text-gold">LinkedIn</a></li><li><a href="#" class="text-sm text-cream/70 hover:text-gold">Instagram</a></li><li><a href="#" class="text-sm text-cream/70 hover:text-gold">X / Twitter</a></li></ul></div>
</div><div class="mt-12 h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
<p class="mt-6 text-center text-xs text-cream/40">© \${new Date().getFullYear()} BUSHIDO LLC（合同会社BUSHIDO）. \${esc(f.rights)}</p></div>\`;}

function bindForm(){
  document.querySelectorAll(".chip").forEach((b)=>b.addEventListener("click",()=>{
    const on=b.getAttribute("data-on")==="1";
    b.setAttribute("data-on",on?"0":"1");
    b.className="chip rounded-full border px-4 py-2 text-sm transition-all "+(on?"border-cream/20 text-cream/75 hover:border-cream/40":"border-gold bg-gold/15 text-gold");
  }));
  const form=document.getElementById("planner-form");
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const email=document.getElementById("f-email").value.trim();
    const ok=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
    const err=document.getElementById("f-email-err");
    if(!ok){err.classList.remove("hidden");return;}
    err.classList.add("hidden");
    const p=CONTENT[lang].planner;
    // NOTE: standalone preview has no backend — the live Next.js app POSTs to /api/waitlist.
    document.getElementById("planner-card").innerHTML='<div class="flex flex-col items-center py-8 text-center"><span class="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-gold text-2xl">✓</span><h3 class="mt-5 font-serif text-2xl font-semibold text-cream">'+esc(p.success.title)+'</h3><p class="mt-2 max-w-md text-cream/70">'+esc(p.success.body)+'</p></div>';
  });
}

document.getElementById("lang-toggle").addEventListener("click",()=>{lang=lang==="en"?"ja":"en";render();});
render();
</script>
</body>
</html>`;

// --- 4. Compile Tailwind to inline CSS so the file is fully offline ----------
const tmpHtml = resolve(root, ".preview.tmp.html");
const tmpCfg = resolve(root, ".preview.tw.config.js");
const tmpIn = resolve(root, ".preview.in.css");
const tmpOut = resolve(root, ".preview.out.css");

writeFileSync(tmpHtml, html); // scanned for utility classes
writeFileSync(
  tmpCfg,
  `module.exports = {
  content: ["${tmpHtml}"],
  theme: { extend: {
    colors: {
      navy: { DEFAULT: "#0F1B2D", deep: "#0A1320" },
      cream: "#F4ECDD",
      gold: { DEFAULT: "#C9A24B", soft: "#D8B86A", deep: "#A6822F" },
    },
    fontFamily: {
      serif: ['"Cormorant Garamond"', "Georgia", "serif"],
      sans: ['"Inter"', "system-ui", "sans-serif"],
    },
    maxWidth: { content: "1200px" },
  } },
};`
);
writeFileSync(
  tmpIn,
  `@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  html { scroll-behavior: smooth; scroll-padding-top: 5rem; }
  body { @apply bg-navy text-cream font-sans antialiased; }
  h1,h2,h3 { @apply font-serif; }
}
@layer components {
  .container-content { @apply mx-auto w-full max-w-content px-6 sm:px-8; }
  .eyebrow { @apply inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-gold; }
  .btn-primary { @apply inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy-deep transition-all duration-300 hover:bg-gold-soft; }
  .btn-ghost { @apply inline-flex items-center justify-center rounded-full border border-cream/30 px-6 py-3 text-sm font-semibold text-cream transition-all duration-300 hover:border-gold hover:text-gold; }
  .card { @apply rounded-2xl border border-cream/10 bg-white/[0.03] transition-all duration-300; }
  .card-hover { @apply hover:-translate-y-1 hover:border-gold/40 hover:bg-white/[0.05]; }
}`
);

execSync(
  `npx tailwindcss -c "${tmpCfg}" -i "${tmpIn}" -o "${tmpOut}" --minify`,
  { cwd: root, stdio: "inherit" }
);
const css = readFileSync(tmpOut, "utf8");
const finalHtml = html.replace("__TAILWIND_CSS__", css);
writeFileSync(resolve(root, "preview.html"), finalHtml);

// Clean up temp build files.
for (const f of [tmpHtml, tmpCfg, tmpIn, tmpOut]) {
  try {
    execSync(`rm -f "${f}"`);
  } catch {}
}
console.log("Wrote preview.html (" + (finalHtml.length / 1024).toFixed(0) + " KB, self-contained)");
