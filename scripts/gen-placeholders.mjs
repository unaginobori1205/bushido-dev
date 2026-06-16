/**
 * Generates elegant, on-brand SVG placeholder imagery into /public/images.
 *
 * These are intentionally abstract "wa-modern" compositions (ink wash + gold)
 * so the live site looks intentional before real photography arrives.
 *
 * TODO(assets): Replace each generated .svg with real licensed photography
 * (same filename, switch extension to .jpg/.webp) and update the `src` in
 * components/PlaceholderImage.tsx + remove dangerouslyAllowSVG in next.config.
 *
 * Run:  node scripts/gen-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/images");
mkdirSync(outDir, { recursive: true });

const NAVY = "#0F1B2D";
const INK = "#0A1320";
const CREAM = "#F4ECDD";
const GOLD = "#C9A24B";

/** A subtle paper-grain + vignette shared by every placeholder. */
function defs(id) {
  return `
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${INK}"/>
      <stop offset="0.55" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${INK}"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="0.7" cy="0.3" r="0.9">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain-${id}">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.04"/></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
  </defs>`;
}

/** Motif drawers — minimal line-art evoking each cultural craft. */
const motifs = {
  kyudo: () => `
    <circle cx="640" cy="450" r="150" fill="none" stroke="${GOLD}" stroke-width="2.5" opacity="0.85"/>
    <circle cx="640" cy="450" r="92" fill="none" stroke="${CREAM}" stroke-width="1.5" opacity="0.5"/>
    <circle cx="640" cy="450" r="34" fill="${GOLD}" opacity="0.9"/>
    <path d="M170 90 Q120 450 170 810" fill="none" stroke="${CREAM}" stroke-width="3" opacity="0.8"/>
    <line x1="170" y1="90" x2="170" y2="810" stroke="${GOLD}" stroke-width="1.4" opacity="0.7"/>
    <line x1="170" y1="450" x2="600" y2="450" stroke="${GOLD}" stroke-width="1.4" opacity="0.6"/>`,
  tea: () => `
    <path d="M430 470 h420 a60 60 0 0 1 -60 150 h-300 a60 60 0 0 1 -60 -150 z" fill="none" stroke="${CREAM}" stroke-width="2.5" opacity="0.8"/>
    <path d="M850 500 q70 30 0 90" fill="none" stroke="${GOLD}" stroke-width="2.5" opacity="0.85"/>
    <path d="M520 410 q-10 -50 30 -80 M620 410 q-10 -55 30 -85 M720 410 q-10 -50 30 -80" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.6"/>`,
  calligraphy: () => `
    <path d="M360 230 C520 360 540 520 720 640" fill="none" stroke="${CREAM}" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
    <path d="M500 300 C620 380 600 520 540 660" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linecap="round" opacity="0.7"/>
    <circle cx="760" cy="690" r="14" fill="${CREAM}" opacity="0.7"/>`,
  zen: () => `
    <circle cx="640" cy="450" r="200" fill="none" stroke="${CREAM}" stroke-width="6" stroke-linecap="round" stroke-dasharray="1180 80" opacity="0.85" transform="rotate(20 640 450)"/>
    <circle cx="640" cy="450" r="200" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.4" transform="rotate(20 640 450)"/>`,
  shrine: () => `
    <line x1="380" y1="300" x2="900" y2="300" stroke="${CREAM}" stroke-width="10" opacity="0.85"/>
    <line x1="400" y1="360" x2="880" y2="360" stroke="${GOLD}" stroke-width="6" opacity="0.7"/>
    <line x1="470" y1="300" x2="470" y2="720" stroke="${CREAM}" stroke-width="10" opacity="0.85"/>
    <line x1="810" y1="300" x2="810" y2="720" stroke="${CREAM}" stroke-width="10" opacity="0.85"/>
    <path d="M360 290 q280 -70 560 0" fill="none" stroke="${GOLD}" stroke-width="8" opacity="0.8"/>`,
  founder: () => `
    <circle cx="640" cy="380" r="130" fill="none" stroke="${CREAM}" stroke-width="2.5" opacity="0.7"/>
    <path d="M430 760 q210 -240 420 0" fill="none" stroke="${CREAM}" stroke-width="2.5" opacity="0.7"/>
    <circle cx="640" cy="380" r="200" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.4"/>`,
  sakura: () => `
    ${Array.from({ length: 7 })
      .map((_, i) => {
        const x = 200 + i * 130 + (i % 2) * 40;
        const y = 200 + (i % 3) * 180;
        return `<g transform="translate(${x} ${y})" opacity="0.7">
        ${Array.from({ length: 5 })
          .map(
            (_, p) =>
              `<ellipse cx="0" cy="-26" rx="13" ry="24" fill="${GOLD}" opacity="0.5" transform="rotate(${p * 72})"/>`
          )
          .join("")}
        <circle r="6" fill="${CREAM}"/></g>`;
      })
      .join("")}`,
};

function makeSvg(id, label, w, h) {
  const motif = motifs[id] ? motifs[id]() : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1280 900" role="img" aria-label="${label}">
  ${defs(id)}
  <rect width="1280" height="900" fill="url(#bg-${id})"/>
  <rect width="1280" height="900" fill="url(#glow-${id})"/>
  ${motif}
  <rect width="1280" height="900" fill="transparent" filter="url(#grain-${id})"/>
  <rect x="1" y="1" width="1278" height="898" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.25"/>
  <text x="60" y="840" font-family="Georgia, serif" font-size="34" fill="${CREAM}" opacity="0.55">${label}</text>
  <text x="60" y="876" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="3" fill="${GOLD}" opacity="0.7">BUSHIDO AI · PLACEHOLDER</text>
</svg>`;
}

const slots = [
  ["hero", "Kyudo — the way of the bow"],
  ["kyudo", "Kyudo"],
  ["tea", "Tea Ceremony"],
  ["calligraphy", "Calligraphy"],
  ["zen", "Zen"],
  ["shrine", "Shrine Culture"],
  ["founder", "Kensuke Ueoka, Founder & CEO"],
  ["sakura", "Cherry blossoms"],
];

for (const [id, label] of slots) {
  writeFileSync(resolve(outDir, `${id}.svg`), makeSvg(id, label, 1280, 900));
}

console.log(`Wrote ${slots.length} placeholder SVGs to public/images/`);
