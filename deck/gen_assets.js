const sharp = require("sharp");
const fs = require("fs");
const OUT = __dirname + "/assets";

const INK = "#0A0A0A", INK_SOFT = "#141414", GOLD = "#C9A86A", GOLD_D = "#8B7340";

const svg = (s) => Buffer.from(s);

// ---- 1. Slide background: deep ink with a soft gold dawn-glow low-left ----
const bg = (w, h, glowX, glowY, strength) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="g" cx="${glowX}" cy="${glowY}" r="0.85">
      <stop offset="0%"   stop-color="${GOLD}" stop-opacity="${strength}"/>
      <stop offset="45%"  stop-color="${GOLD_D}" stop-opacity="${strength * 0.35}"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="50%"  stop-color="#000000" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#v)"/>
</svg>`;

// ---- 2. Enso (円相) ring, transparent ----
const enso = (size, stroke, op) => {
  const c = size / 2, r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="${GOLD}" stop-opacity="${op}"/>
      <stop offset="55%" stop-color="${GOLD}" stop-opacity="${op * 0.45}"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="${op}"/>
    </linearGradient>
  </defs>
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="url(#s)" stroke-width="${stroke}"
     stroke-linecap="round" stroke-dasharray="${circ * 0.93} ${circ}"
     transform="rotate(-125 ${c} ${c})"/>
</svg>`;
};

// ---- 3. Photo placeholder: ink panel, gold hairline frame, enso watermark ----
const photo = (w, h, label) => {
  const s = Math.min(w, h) * 0.34, cx = w / 2, cy = h / 2 - h * 0.03;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="p" cx="0.5" cy="0.35" r="0.85">
      <stop offset="0%"   stop-color="#1C1A17"/>
      <stop offset="100%" stop-color="${INK}"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#p)"/>
  <rect x="${w * 0.018}" y="${w * 0.018}" width="${w - w * 0.036}" height="${h - w * 0.036}"
        fill="none" stroke="${GOLD}" stroke-opacity="0.30" stroke-width="${w * 0.004}"/>
  <circle cx="${cx}" cy="${cy}" r="${s / 2}" fill="none"
          stroke="${GOLD}" stroke-opacity="0.28" stroke-width="${w * 0.007}"
          stroke-linecap="round" stroke-dasharray="${2 * Math.PI * (s / 2) * 0.9} 9999"
          transform="rotate(-125 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy + h * 0.16}" font-family="IPAGothic, sans-serif"
        font-size="${w * 0.035}" fill="${GOLD}" fill-opacity="0.55"
        text-anchor="middle" letter-spacing="${w * 0.012}">${label}</text>
</svg>`;
};

const jobs = [
  ["bg-title.png",  bg(2000, 1125, 0.22, 0.88, 0.30)],
  ["bg-slide.png",  bg(2000, 1125, 0.92, 0.06, 0.14)],
  ["bg-quote.png",  bg(2000, 1125, 0.50, 0.55, 0.22)],
  ["enso-lg.png",   enso(1400, 14, 0.16)],
  ["enso-sm.png",   enso(700, 10, 0.40)],
  ["ph-portrait.png", photo(900, 1150, "PHOTO")],
  ["ph-wide.png",     photo(1500, 950, "PHOTO")],
  ["ph-square.png",   photo(1000, 1000, "PHOTO")],
  ["ph-tall.png",     photo(950, 1135, "PHOTO")],
];

(async () => {
  for (const [name, src] of jobs) {
    await sharp(svg(src)).png().toFile(`${OUT}/${name}`);
    console.log("wrote", name);
  }
})();
