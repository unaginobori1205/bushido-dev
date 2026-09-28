#!/usr/bin/env python3
"""BUSHIDO JAPAN YouTube production pipeline.

One weekly recording  ->  1 main video + 7 Shorts, with burned-in English/Japanese
subtitles, inserted graphics/photos, and scheduled daily uploads to YouTube.

    python bushido.py all ep01            # every step below, in order
    python bushido.py fetch ep01          # download the recording from Google Drive
    python bushido.py transcribe ep01     # English transcript with word timestamps
    python bushido.py translate ep01      # Japanese subtitles (Claude API)
    python bushido.py graphics ep01       # text cards, diagrams, photos, thumbnail
    python bushido.py render ep01         # main.mp4 + short-1..7.mp4
    python bushido.py upload ep01         # scheduled uploads (1 per day)

Every step reads and writes files under youtube/episodes/<episode>/build/, so any
step can be re-run on its own after fixing something by hand (e.g. editing cues.json).
"""
from __future__ import annotations

import argparse
import datetime as dt
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
EPISODES = ROOT.parent / "episodes"
FONTS_DIR = ROOT / "fonts"
JST = dt.timezone(dt.timedelta(hours=9))

MAIN_W, MAIN_H = 1920, 1080
SHORT_W, SHORT_H = 1080, 1920

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]

FONT_URLS = {
    "Montserrat-ExtraBold.ttf": "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-ExtraBold.ttf",
    "Anton-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf",
    "NotoSansCJKjp-Bold.otf": "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf",
    "NotoSerifCJKjp-Bold.otf": "https://github.com/notofonts/noto-cjk/raw/main/Serif/OTF/Japanese/NotoSerifCJKjp-Bold.otf",
}


# --------------------------------------------------------------------------- utils


def log(msg: str) -> None:
    print(f"[bushido] {msg}", flush=True)


def load_config() -> dict:
    path = ROOT / "config.yaml"
    if not path.exists():
        path = ROOT / "config.example.yaml"
    return yaml.safe_load(path.read_text(encoding="utf-8"))


class Episode:
    def __init__(self, key: str):
        matches = sorted(p for p in EPISODES.iterdir() if p.is_dir() and p.name.startswith(key))
        if not matches:
            sys.exit(f"episode '{key}' not found under {EPISODES}")
        self.dir = matches[0]
        self.meta = yaml.safe_load((self.dir / "metadata.yaml").read_text(encoding="utf-8"))
        self.id = self.meta["episode"]["id"]
        self.assets = self.dir / "assets"
        self.build = self.dir / "build"
        self.assets.mkdir(exist_ok=True)
        self.build.mkdir(exist_ok=True)

    def path(self, name: str) -> Path:
        return self.build / name

    def read_json(self, name: str):
        p = self.path(name)
        if not p.exists():
            sys.exit(f"{p} not found - run the previous step first")
        return json.loads(p.read_text(encoding="utf-8"))

    def write_json(self, name: str, data) -> None:
        self.path(name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def raw_video(self) -> Path:
        for p in sorted(self.build.glob("raw.*")):
            return p
        sys.exit("raw video not found - run `fetch` or `fetch --input <file>` first")


def ffmpeg_exe() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found. Install ffmpeg (brew install ffmpeg) or `pip install imageio-ffmpeg`.")


def run(cmd: list[str]) -> None:
    log(" ".join(str(c) for c in cmd[:6]) + (" ..." if len(cmd) > 6 else ""))
    subprocess.run([str(c) for c in cmd], check=True)


def font_file(name: str, fallback_family: str) -> str:
    """Path of a bundled font, falling back to a system font via fontconfig."""
    p = FONTS_DIR / name
    if p.exists():
        return str(p)
    try:
        out = subprocess.run(["fc-match", "-f", "%{file}", fallback_family], capture_output=True, text=True)
        if out.stdout:
            return out.stdout
    except FileNotFoundError:
        pass
    sys.exit(f"font {name} not found - run `python bushido.py setup` first")


# ------------------------------------------------------------------ phrase matching


def norm_words(text: str) -> list[str]:
    text = text.lower().replace("’", "'")
    return re.findall(r"[a-z0-9']+", text)


def find_phrase(words: list[dict], phrase: str, after: float = 0.0, last: bool = False) -> tuple[float, float] | None:
    """Locate a script phrase in the transcript (fuzzy, tolerant of ad-libs/ASR errors).

    Returns (start, end) seconds of the matched span, or None."""
    target = norm_words(phrase)
    if not target:
        return None
    tokens = [(norm_words(w["word"]) or [""])[0] for w in words]
    best, best_i = 0.0, -1
    n = len(target)
    for i in range(len(tokens)):
        if words[i]["start"] < after:
            continue
        window = tokens[i : i + n]
        if not window or window[0] == "":
            continue
        score = difflib.SequenceMatcher(None, target, window).ratio()
        if score > best + 1e-9:
            best, best_i = score, i
    if best < 0.6:
        return None
    j = min(best_i + n, len(words)) - 1
    return words[best_i]["start"], words[j]["end"]


# ------------------------------------------------------------------------- setup


def cmd_setup(args, cfg) -> None:
    FONTS_DIR.mkdir(exist_ok=True)
    for name, url in FONT_URLS.items():
        dest = FONTS_DIR / name
        if dest.exists():
            continue
        log(f"downloading font {name}")
        urllib.request.urlretrieve(url, dest)
    log(f"fonts ready in {FONTS_DIR}")


# ---------------------------------------------------------------------- google api


def google_creds(cfg):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    token = ROOT / cfg["google"]["token_file"]
    creds = Credentials.from_authorized_user_file(str(token), GOOGLE_SCOPES) if token.exists() else None
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(str(ROOT / cfg["google"]["client_secret_file"]), GOOGLE_SCOPES)
        creds = flow.run_local_server(port=0)
    token.write_text(creds.to_json())
    return creds


def cmd_fetch(args, cfg) -> None:
    ep = Episode(args.episode)
    if args.input:
        src = Path(args.input)
        dest = ep.path("raw" + src.suffix.lower())
        shutil.copy(src, dest)
        log(f"copied {src} -> {dest}")
        return

    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload

    drive = build("drive", "v3", credentials=google_creds(cfg))
    folder = cfg["google"]["drive_folder_id"]
    needle = ep.meta["episode"]["drive_filename_contains"].replace("'", "\\'")
    q = f"'{folder}' in parents and name contains '{needle}' and mimeType contains 'video/' and trashed = false"
    files = drive.files().list(q=q, orderBy="modifiedTime desc", fields="files(id,name,size)").execute()["files"]
    if not files:
        sys.exit(f"no video containing '{needle}' found in the Drive folder")
    f = files[0]
    dest = ep.path("raw" + Path(f["name"]).suffix.lower())
    log(f"downloading {f['name']} ({int(f.get('size', 0)) / 1e9:.2f} GB)")
    with open(dest, "wb") as fh:
        dl = MediaIoBaseDownload(fh, drive.files().get_media(fileId=f["id"]), chunksize=64 * 1024 * 1024)
        done = False
        while not done:
            status, done = dl.next_chunk()
            if status:
                log(f"  {int(status.progress() * 100)}%")
    log(f"saved {dest}")


# ------------------------------------------------------------------- transcribe


def build_cues(words: list[dict], max_chars: int = 42, max_dur: float = 5.5) -> list[dict]:
    """Group words into subtitle lines, breaking at punctuation, pauses or length."""
    cues, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        text = "".join(x["word"] for x in cur).strip()
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 99
        ends_sentence = w["word"].strip()[-1:] in ".?!"
        soft_break = w["word"].strip()[-1:] in ",;:" and len(text) > max_chars * 0.5
        too_long = nxt is not None and len(text + nxt["word"]) > max_chars
        if ends_sentence or soft_break or gap > 0.6 or too_long or (w["end"] - cur[0]["start"]) > max_dur or nxt is None:
            cues.append({"start": round(cur[0]["start"], 3), "end": round(w["end"], 3), "en": text})
            cur = []
    for i in range(len(cues) - 1):  # keep lines on screen through short pauses
        if cues[i + 1]["start"] - cues[i]["end"] < 0.4:
            cues[i]["end"] = cues[i + 1]["start"]
    return cues


def cmd_transcribe(args, cfg) -> None:
    from faster_whisper import WhisperModel

    ep = Episode(args.episode)
    wcfg = cfg["whisper"]
    model = WhisperModel(wcfg["model"], device=wcfg.get("device", "auto"), compute_type=wcfg.get("compute_type", "default"))
    prompt = "BUSHIDO JAPAN. " + ", ".join(list(ep.meta.get("glossary", {}))[:40]) + "."
    segments, info = model.transcribe(
        str(ep.raw_video()), language="en", word_timestamps=True, vad_filter=True, initial_prompt=prompt
    )
    words = []
    for seg in segments:
        for w in seg.words or []:
            words.append({"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word})
        log(f"  {seg.end:7.1f}s / {info.duration:.0f}s")
    ep.write_json("words.json", words)
    ep.write_json("cues.json", build_cues(words))
    log(f"{len(words)} words -> build/words.json, build/cues.json (edit cues.json by hand if needed)")


# -------------------------------------------------------------------- translate


def cmd_translate(args, cfg) -> None:
    import anthropic

    ep = Episode(args.episode)
    cues = ep.read_json("cues.json")
    glossary = "\n".join(f"- {k} → {v}" for k, v in ep.meta.get("glossary", {}).items())
    client = anthropic.Anthropic()
    system = (
        "You translate English YouTube subtitles into natural, warm, respectful Japanese subtitles "
        "for a channel about Nagoya, Bushido, Japanese spirituality and Kyudo. "
        "Keep each line short and easy to read (ideally 22 Japanese characters or fewer; never more than 32). "
        "Keep the flow across neighboring lines natural. Always use these glossary terms:\n" + glossary +
        "\nReturn ONLY a JSON array of objects {\"i\": <index>, \"ja\": <translation>} with one object per input line."
    )
    batch = cfg["claude"].get("batch_size", 40)
    todo = [i for i, c in enumerate(cues) if args.force or not c.get("ja")]
    for b in range(0, len(todo), batch):
        idx = todo[b : b + batch]
        # neighbours give the model context for fragmentary lines
        lines = [{"i": i, "en": cues[i]["en"]} for i in idx]
        msg = client.messages.create(
            model=cfg["claude"]["model"],
            max_tokens=8000,
            system=system,
            messages=[{"role": "user", "content": json.dumps(lines, ensure_ascii=False)}],
        )
        text = "".join(block.text for block in msg.content if block.type == "text")
        text = text[text.find("[") : text.rfind("]") + 1]
        for item in json.loads(text):
            cues[int(item["i"])]["ja"] = item["ja"].strip()
        ep.write_json("cues.json", cues)
        log(f"  translated {min(b + batch, len(todo))}/{len(todo)}")
    missing = sum(1 for c in cues if not c.get("ja"))
    log("translation complete" + (f" ({missing} lines missing - re-run translate)" if missing else ""))


# --------------------------------------------------------------------- graphics

INK = (17, 17, 20)
PAPER = (246, 241, 231)
VERMILION = (200, 16, 46)
GOLD = (212, 175, 55)
WHITE = (255, 255, 255)


def fonts():
    from PIL import ImageFont

    files = {
        "en": font_file("Montserrat-ExtraBold.ttf", "DejaVu Sans:bold"),
        "display": font_file("Anton-Regular.ttf", "DejaVu Sans:bold"),
        "ja": font_file("NotoSansCJKjp-Bold.otf", "sans-serif:lang=ja:bold"),
        "serif": font_file("NotoSerifCJKjp-Bold.otf", "serif:lang=ja:bold"),
    }
    return lambda kind, size: ImageFont.truetype(files[kind], size)


def base_canvas(w=MAIN_W, h=MAIN_H):
    """Deep ink background with a soft vignette and a vermilion accent bar."""
    from PIL import Image, ImageDraw, ImageFilter

    img = Image.new("RGB", (w, h), INK)
    glow = Image.new("L", (w, h), 0)
    ImageDraw.Draw(glow).ellipse((-w * 0.2, -h * 0.4, w * 0.9, h * 1.1), fill=60)
    glow = glow.filter(ImageFilter.GaussianBlur(200))
    img = Image.composite(Image.new("RGB", (w, h), (52, 40, 30)), img, glow)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 18, h), fill=VERMILION)
    return img, d


def text_center(d, xy, text, font, fill, anchor="mm"):
    d.text(xy, text, font=font, fill=fill, anchor=anchor)


def draw_heading(d, F, title, y=150):
    text_center(d, (MAIN_W // 2, y), title, F("en", 72), WHITE)
    d.rectangle((MAIN_W // 2 - 80, y + 62, MAIN_W // 2 + 80, y + 70), fill=GOLD)


def card_title(g, F):
    img, d = base_canvas()
    text_center(d, (MAIN_W // 2, 330), g.get("kicker", ""), F("en", 44), GOLD)
    text_center(d, (MAIN_W // 2, 520), g["title"].upper(), F("display", 230), WHITE)
    text_center(d, (MAIN_W // 2, 740), g.get("subtitle", ""), F("en", 64), WHITE)
    d.rectangle((MAIN_W // 2 - 120, 820, MAIN_W // 2 + 120, 830), fill=VERMILION)
    return img


def card_columns(g, F):
    img, d = base_canvas()
    draw_heading(d, F, g["title"])
    cols = g["columns"]
    cw = 540
    gap = (MAIN_W - cw * len(cols)) // (len(cols) + 1)
    for i, c in enumerate(cols):
        x0 = gap + i * (cw + gap)
        d.rounded_rectangle((x0, 320, x0 + cw, 900), radius=24, fill=(32, 30, 34), outline=GOLD, width=3)
        d.rectangle((x0, 320, x0 + cw, 340), fill=VERMILION)
        text_center(d, (x0 + cw // 2, 470), c["head"], F("en", 46), WHITE)
        text_center(d, (x0 + cw // 2, 540), c.get("sub", ""), F("en", 34), GOLD)
        for k, line in enumerate(c.get("body", "").split("\n")):
            text_center(d, (x0 + cw // 2, 660 + k * 70), line, F("en", 30), PAPER)
    return img


def card_list(g, F, w=MAIN_W, h=MAIN_H):
    img, d = base_canvas(w, h)
    draw_heading(d, F, g["title"]) if w == MAIN_W else None
    items = g["items"]
    top = 330
    step = min(130, (h - top - 120) // max(len(items), 1))
    for i, it in enumerate(items):
        y = top + i * step
        d.ellipse((260, y - 26, 312, y + 26), fill=VERMILION)
        text_center(d, (286, y), str(i + 1), F("en", 32), WHITE)
        head, _, rest = it.partition(":")
        if rest:
            d.text((350, y), head + ":", font=F("en", 48), fill=GOLD, anchor="lm")
            hw = d.textlength(head + ":", font=F("en", 48))
            d.text((350 + hw + 20, y), rest.strip(), font=F("en", 48), fill=WHITE, anchor="lm")
        else:
            d.text((350, y), it, font=F("en", 48), fill=WHITE, anchor="lm")
    return img


def card_grid(g, F):
    img, d = base_canvas()
    draw_heading(d, F, g["title"], y=120)
    items = g["items"]
    per_row = 4
    cw, ch = 380, 290  # keeps the bottom ~200px free for burned-in subtitles
    for i, (kanji, roman, meaning) in enumerate(items):
        row, col = divmod(i, per_row)
        n_in_row = min(per_row, len(items) - row * per_row)
        x0 = (MAIN_W - n_in_row * cw - (n_in_row - 1) * 40) // 2 + col * (cw + 40)
        y0 = 240 + row * (ch + 30)
        d.rounded_rectangle((x0, y0, x0 + cw, y0 + ch), radius=20, fill=PAPER)
        size = 130 if len(kanji) == 1 else 100
        text_center(d, (x0 + cw // 2, y0 + 105), kanji, F("serif", size), INK)
        text_center(d, (x0 + cw // 2, y0 + 205), roman, F("en", 42), VERMILION)
        text_center(d, (x0 + cw // 2, y0 + 255), meaning, F("en", 30), INK)
    return img


def card_quote(g, F):
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (MAIN_W, MAIN_H), PAPER)
    d = ImageDraw.Draw(img)
    d.ellipse((MAIN_W // 2 - 360, 80, MAIN_W // 2 + 360, 800), outline=VERMILION, width=14)  # ensō-like circle
    size = {1: 360, 2: 260, 3: 190}.get(len(g["jp"]), 560 // len(g["jp"]))
    text_center(d, (MAIN_W // 2, 440), g["jp"], F("serif", size), INK)
    text_center(d, (MAIN_W // 2, 890), g["en"], F("en", 56), INK)
    return img


def card_route(g, F):
    img, d = base_canvas()
    draw_heading(d, F, g["title"])
    stops = g["stops"]
    xs = [360 + i * (MAIN_W - 720) // (len(stops) - 1) for i in range(len(stops))]
    y = 600
    d.line((xs[0], y, xs[-1], y), fill=PAPER, width=10)
    for i, (x, name) in enumerate(zip(xs, stops)):
        hl = i == g.get("highlight")
        r = 60 if hl else 36
        d.ellipse((x - r, y - r, x + r, y + r), fill=VERMILION if hl else PAPER, outline=GOLD if hl else PAPER, width=6)
        text_center(d, (x, y + 130), name, F("en", 72 if hl else 56), GOLD if hl else WHITE)
    for i, leg in enumerate(g.get("legs", [])):
        text_center(d, ((xs[i] + xs[i + 1]) // 2, y - 90), leg, F("en", 38), PAPER)
    return img


def photo_or_placeholder(ep, p, F):
    from PIL import Image, ImageDraw

    f = ep.assets / p["file"]
    if f.exists():
        return Image.open(f).convert("RGB")
    img, d = base_canvas()
    text_center(d, (MAIN_W // 2, MAIN_H // 2), p.get("caption", p["id"]), F("en", 90), WHITE)
    text_center(d, (MAIN_W // 2, MAIN_H // 2 + 110), "(photo placeholder)", F("en", 36), GOLD)
    return img


def cover(img, w, h):
    from PIL import ImageOps

    return ImageOps.fit(img, (w, h), method=3)


def side_card(img, caption, F, width=760):
    """Photo/diagram as a framed 'wipe' for the right side of the frame (popular explainer layout)."""
    from PIL import Image, ImageDraw

    h = int(width * 9 / 16)
    inner = cover(img, width, h)
    pad, cap_h = 10, 64 if caption else 0
    card = Image.new("RGBA", (width + pad * 2 + 16, h + pad * 2 + cap_h + 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((12, 12, card.width - 1, card.height - 1), radius=18, fill=(0, 0, 0, 110))  # shadow
    d.rounded_rectangle((0, 0, card.width - 16, card.height - 16), radius=18, fill=WHITE)
    card.paste(inner, (pad, pad))
    if caption:
        d.rectangle((pad, pad + h, pad + width, pad + h + cap_h), fill=INK)
        d.rectangle((pad, pad + h, pad + 12, pad + h + cap_h), fill=VERMILION)
        d.text((pad + 30, pad + h + cap_h // 2), caption, font=F("en", 32), fill=WHITE, anchor="lm")
    return card


def fetch_commons_photo(query: str, dest: Path, user_agent: str) -> dict | None:
    """Download a freely licensed photo from Wikimedia Commons. Returns credit info."""
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrsearch": query,
        "gsrnamespace": 6, "gsrlimit": 8, "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime", "iiurlwidth": 1920,
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": user_agent})
    pages = json.load(urllib.request.urlopen(req, timeout=30)).get("query", {}).get("pages", {})
    ok = ("cc by", "cc-by", "cc0", "public domain", "pd")
    for page in sorted(pages.values(), key=lambda p: p.get("index", 99)):
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        if info.get("mime") not in ("image/jpeg", "image/png") or not lic.lower().startswith(ok):
            continue
        img_req = urllib.request.Request(info.get("thumburl") or info["url"], headers={"User-Agent": user_agent})
        dest.write_bytes(urllib.request.urlopen(img_req, timeout=60).read())
        artist = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip()
        return {"file": dest.name, "title": page["title"], "author": artist, "license": lic,
                "source": info.get("descriptionurl", "")}
    return None


def make_thumbnail(ep, cfg, F) -> None:
    """Big-text thumbnail over a frame of the recording (popular travel/explainer style)."""
    from PIL import Image, ImageDraw

    t = ep.meta["main"].get("thumbnail")
    if not t:
        return
    words_path = ep.path("words.json")
    frame = ep.path("thumb_frame.jpg")
    at = 5.0
    if words_path.exists() and t.get("frame_at"):
        hit = find_phrase(json.loads(words_path.read_text()), t["frame_at"])
        at = hit[0] if hit else at
    try:
        run([ffmpeg_exe(), "-y", "-loglevel", "error", "-ss", f"{at:.2f}", "-i", ep.raw_video(), "-frames:v", "1", frame])
        bg = cover(Image.open(frame).convert("RGB"), 1280, 720)
    except SystemExit:
        bg, _ = base_canvas(1280, 720)
    shade = Image.new("L", (1280, 720))
    ImageDraw.Draw(shade).polygon([(0, 0), (820, 0), (560, 720), (0, 720)], fill=205)
    bg = Image.composite(Image.new("RGB", bg.size, INK), bg, shade)
    d = ImageDraw.Draw(bg)
    y = 90
    for line in t["text"].split("\n"):
        d.text((60, y), line, font=F("display", 120), fill=WHITE, stroke_width=4, stroke_fill=INK)
        y += 135
    if t.get("accent"):
        box = d.textbbox((60, y + 20), t["accent"], font=F("display", 110))
        d.rectangle((box[0] - 20, box[1] - 14, box[2] + 20, box[3] + 14), fill=VERMILION)
        d.text((60, y + 20), t["accent"], font=F("display", 110), fill=WHITE)
    d.text((1240, 680), "BUSHIDO JAPAN", font=F("en", 30), fill=GOLD, anchor="rs")
    bg.save(ep.path("thumbnail.jpg"), quality=92)
    log("thumbnail -> build/thumbnail.jpg")


def cmd_graphics(args, cfg) -> None:
    ep = Episode(args.episode)
    F = fonts()
    makers = {"title": card_title, "columns": card_columns, "list": card_list, "grid": card_grid,
              "quote": card_quote, "route": card_route}
    sources = {}
    for g in ep.meta.get("graphics", []):
        img = makers[g["type"]](g, F)
        img.save(ep.assets / f"{g['id']}.png")
        sources[g["id"]] = (img, None)
        log(f"graphic {g['id']}.png")

    credits_path = ep.assets / "credits.json"
    credits = json.loads(credits_path.read_text()) if credits_path.exists() else {}
    for p in ep.meta.get("photos", []):
        f = ep.assets / p["file"]
        if not f.exists() and p.get("search") and not args.offline:
            try:
                c = fetch_commons_photo(p["search"], f, cfg["wikimedia_user_agent"])
                if c:
                    credits[p["id"]] = c
                    log(f"photo {p['file']} <- {c['title']} ({c['license']})")
            except Exception as e:  # network errors must never stop the weekly run
                log(f"photo {p['id']}: download failed ({e}) - using placeholder")
        sources[p["id"]] = (photo_or_placeholder(ep, p, F), p.get("caption"))
    credits_path.write_text(json.dumps(credits, ensure_ascii=False, indent=2))

    # Pre-compose every visual cue into the exact overlay PNG the renderer needs.
    for v in ep.meta.get("visuals", []):
        img, caption = sources[v["asset"]]
        if v.get("layout", "full") == "full":
            cover(img, MAIN_W, MAIN_H).save(ep.path(f"ov_{v['asset']}_full.png"))
        else:
            side_card(img, caption, F).save(ep.path(f"ov_{v['asset']}_side.png"))
        side_card(img, caption, F, width=960).save(ep.path(f"ov_{v['asset']}_short.png"))
    make_thumbnail(ep, cfg, F)


# -------------------------------------------------------------------- subtitles


def ass_time(t: float) -> str:
    t = max(t, 0)
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def srt_time(t: float) -> str:
    ms = int(round(max(t, 0) * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def ass_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("{", "(").replace("}", ")").replace("\n", "\\N")


def highlight(text: str, keywords: list[str], color: str) -> str:
    """Colour keywords inside an (escaped) subtitle line."""
    for k in sorted(keywords, key=len, reverse=True):
        text = re.sub(rf"(?<![\w{{]){re.escape(k)}(?!\w)", lambda m: f"{{\\c{color}}}{m.group(0)}{{\\r}}", text,
                      flags=re.I)
    return text


def ass_header(w: int, h: int, styles: list[str]) -> str:
    fmt = ("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, "
           "Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
           "Alignment, MarginL, MarginR, MarginV, Encoding")
    return (f"[Script Info]\nScriptType: v4.00+\nPlayResX: {w}\nPlayResY: {h}\nWrapStyle: 0\n"
            f"ScaledBorderAndShadow: yes\n\n[V4+ Styles]\n{fmt}\n" + "\n".join(styles) +
            "\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")


def style(name, font, size, primary, outline="&H00000000", back="&H00000000", bold=-1, border=1, out_w=4,
          shadow=0, align=2, margin_v=60, margin_lr=80):
    return (f"Style: {name},{font},{size},{primary},&H000000FF,{outline},{back},{bold},0,0,0,100,100,0,0,"
            f"{border},{out_w},{shadow},{align},{margin_lr},{margin_lr},{margin_v},1")


def write_srt(cues, key, path, offset=0.0, t0=None, t1=None):
    out, n = [], 0
    for c in cues:
        if t0 is not None and (c["end"] <= t0 or c["start"] >= t1):
            continue
        if not c.get(key):
            continue
        n += 1
        s = max(c["start"], t0 or 0) - offset
        e = min(c["end"], t1 or c["end"]) - offset
        out.append(f"{n}\n{srt_time(s)} --> {srt_time(e)}\n{c[key]}\n")
    path.write_text("\n".join(out), encoding="utf-8")


def main_ass(ep, cfg, cues) -> Path:
    s = cfg["subtitle_style"]
    hl = s["highlight_color"]
    styles = [
        style("EN", s["en_font"], 58, "&H00FFFFFF", out_w=4, margin_v=50),
        style("JA", s["ja_font"], 46, s["ja_color"], out_w=4, margin_v=125),
    ]
    lines = []
    for c in cues:
        a, b = ass_time(c["start"]), ass_time(c["end"])
        lines.append(f"Dialogue: 0,{a},{b},EN,,0,0,0,,{highlight(ass_escape(c['en']), ep.meta.get('keywords', []), hl)}")
        if c.get("ja"):
            lines.append(f"Dialogue: 0,{a},{b},JA,,0,0,0,,{ass_escape(c['ja'])}")
    p = ep.path("main.ass")
    p.write_text(ass_header(MAIN_W, MAIN_H, styles) + "\n".join(lines) + "\n", encoding="utf-8")
    return p


def short_chunks(words, t0, t1, max_words=3, max_chars=16):
    """Shorts-style captions: 1-3 words at a time, big and centred."""
    chunks, cur = [], []
    ws = [w for w in words if w["start"] >= t0 - 0.05 and w["end"] <= t1 + 0.05]
    for i, w in enumerate(ws):
        cur.append(w)
        text = "".join(x["word"] for x in cur).strip()
        nxt = ws[i + 1] if i + 1 < len(ws) else None
        if (nxt is None or len(cur) >= max_words or len(text) >= max_chars or w["word"].strip()[-1:] in ".,?!;:"
                or nxt["start"] - w["end"] > 0.35):
            end = nxt["start"] if nxt and nxt["start"] - w["end"] < 0.35 else w["end"] + 0.15
            chunks.append({"start": cur[0]["start"], "end": end, "text": text})
            cur = []
    return chunks


def short_ass(ep, cfg, cues, words, short, t0, t1) -> Path:
    s = cfg["subtitle_style"]
    styles = [
        # hook banner at the top: white on vermilion box, the look used by most popular Shorts
        style("Hook", s["short_font"], 86, "&H00FFFFFF", outline="&H002E10C8", back="&H002E10C8", border=3,
              out_w=18, align=8, margin_v=210, margin_lr=70),
        style("Cap", s["short_font"], 104, "&H00FFFFFF", out_w=7, shadow=2, back="&H80000000", align=2,
              margin_v=640, margin_lr=60),
        style("JA", s["ja_font"], 54, s["ja_color"], out_w=5, align=2, margin_v=500, margin_lr=70),
        style("Brand", s["en_font"], 34, "&H0037AFD4", out_w=2, align=2, margin_v=150),
    ]
    dur = t1 - t0
    ev = [
        f"Dialogue: 1,{ass_time(0)},{ass_time(dur)},Hook,,0,0,0,,{ass_escape(short['hook'].upper())}",
        f"Dialogue: 0,{ass_time(0)},{ass_time(dur)},Brand,,0,0,0,,BUSHIDO JAPAN",
    ]
    for ch in short_chunks(words, t0, t1):
        text = highlight(ass_escape(ch["text"].upper()), ep.meta.get("keywords", []), s["highlight_color"])
        pop = "{\\fscx112\\fscy112\\t(0,90,\\fscx100\\fscy100)}"
        ev.append(f"Dialogue: 2,{ass_time(ch['start'] - t0)},{ass_time(ch['end'] - t0)},Cap,,0,0,0,,{pop}{text}")
    for c in cues:
        if c.get("ja") and c["end"] > t0 and c["start"] < t1:
            ev.append(f"Dialogue: 2,{ass_time(max(c['start'], t0) - t0)},{ass_time(min(c['end'], t1) - t0)},JA,,0,0,0,,"
                      f"{ass_escape(c['ja'])}")
    p = ep.path(f"short-{short['n']}.ass")
    p.write_text(ass_header(SHORT_W, SHORT_H, styles) + "\n".join(ev) + "\n", encoding="utf-8")
    return p


# ----------------------------------------------------------------------- render


def locate_visuals(ep, words) -> list[dict]:
    placed = []
    for v in ep.meta.get("visuals", []):
        hit = find_phrase(words, v["at"])
        if not hit:
            log(f"  visual '{v['asset']}': phrase not found ({v['at']!r}) - skipped")
            continue
        placed.append({**v, "t": hit[0]})
    return placed


def locate_shorts(ep, words) -> list[dict]:
    out = []
    for sh in ep.meta["shorts"]:
        a = find_phrase(words, sh["start"])
        b = find_phrase(words, sh["end"], after=a[0] if a else 0)
        if not a or not b:
            log(f"  short {sh['n']}: start/end phrase not found - skipped (fix metadata.yaml or add `t0`/`t1`)")
            continue
        t0 = sh.get("t0", max(a[0] - 0.25, 0))
        t1 = sh.get("t1", b[1] + 0.6)
        if t1 - t0 > 179:
            log(f"  short {sh['n']}: {t1 - t0:.0f}s is longer than 3 min - trimmed")
            t1 = t0 + 179
        out.append({**sh, "t0": t0, "t1": t1})
    return out


def overlay_chain(inputs_start: int, cues: list[dict], base: str, place) -> tuple[list[str], list[str], str]:
    """Build -loop image inputs + an overlay filter chain with 0.3s fades."""
    args, filters, cur = [], [], base
    for k, v in enumerate(cues):
        idx = inputs_start + k
        args += ["-loop", "1", "-framerate", "30", "-t", f"{v['show']:.2f}", "-i", v["png"]]
        fo = max(v["show"] - 0.3, 0)
        filters.append(f"[{idx}:v]format=rgba,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st={fo:.2f}:d=0.3:alpha=1,"
                       f"setpts=PTS-STARTPTS+{v['t']:.3f}/TB[ov{k}]")
        x, y = place(v)
        filters.append(f"[{cur}][ov{k}]overlay=x={x}:y={y}:eof_action=pass[v{k}]")
        cur = f"v{k}"
    return args, filters, cur


def ass_filter(path: Path) -> str:
    fontsdir = f":fontsdir='{FONTS_DIR.as_posix()}'" if FONTS_DIR.exists() else ""
    return f"ass='{path.as_posix()}'{fontsdir}"


def encode_args(cfg) -> list[str]:
    e = cfg["encode"]
    return ["-c:v", "libx264", "-preset", e["preset"], "-crf", str(e["crf"]), "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"]


def cmd_render(args, cfg) -> None:
    ep = Episode(args.episode)
    words = ep.read_json("words.json")
    cues = ep.read_json("cues.json")
    raw = ep.raw_video()
    ff = ffmpeg_exe()
    visuals = locate_visuals(ep, words)
    write_srt(cues, "en", ep.path("main.en.srt"))
    write_srt(cues, "ja", ep.path("main.ja.srt"))

    if args.only in (None, "main"):
        vis = [{**v, "png": ep.path(f"ov_{v['asset']}_{'full' if v.get('layout', 'full') == 'full' else 'side'}.png")}
               for v in visuals]
        place = lambda v: ("0", "0") if v.get("layout", "full") == "full" else ("W-w-50", "60")
        in_args, filters, cur = overlay_chain(1, vis, "base", place)
        graph = ";".join([f"[0:v]scale={MAIN_W}:{MAIN_H}:force_original_aspect_ratio=increase,"
                          f"crop={MAIN_W}:{MAIN_H},setsar=1,fps=30[base]"] + filters +
                         [f"[{cur}]{ass_filter(main_ass(ep, cfg, cues))}[out]"])
        run([ff, "-y", "-loglevel", "warning", "-stats", "-i", raw, *in_args, "-filter_complex", graph,
             "-map", "[out]", "-map", "0:a?", *encode_args(cfg), ep.path("main.mp4")])

    for sh in locate_shorts(ep, words):
        if args.only not in (None, "shorts", f"short-{sh['n']}"):
            continue
        t0, t1 = sh["t0"], sh["t1"]
        vis = [{**v, "t": v["t"] - t0, "show": min(v["show"], t1 - v["t"]),
                "png": ep.path(f"ov_{v['asset']}_short.png")} for v in visuals if t0 <= v["t"] < t1 - 1]
        in_args, filters, cur = overlay_chain(1, vis, "base", lambda v: ("(W-w)/2", "430"))
        graph = ";".join([f"[0:v]scale=-2:{SHORT_H},crop={SHORT_W}:{SHORT_H},setsar=1,fps=30[base]"] + filters +
                         [f"[{cur}]{ass_filter(short_ass(ep, cfg, cues, words, sh, t0, t1))}[out]"])
        write_srt(cues, "en", ep.path(f"short-{sh['n']}.en.srt"), offset=t0, t0=t0, t1=t1)
        write_srt(cues, "ja", ep.path(f"short-{sh['n']}.ja.srt"), offset=t0, t0=t0, t1=t1)
        run([ff, "-y", "-loglevel", "warning", "-stats", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", raw,
             *in_args, "-filter_complex", graph, "-map", "[out]", "-map", "0:a?", *encode_args(cfg),
             ep.path(f"short-{sh['n']}.mp4")])
        log(f"short-{sh['n']}.mp4  ({t1 - t0:.0f}s)")
    ep.write_json("timeline.json", {"visuals": visuals, "shorts": locate_shorts(ep, words)})


# ----------------------------------------------------------------------- upload


def chapters_text(ep, words) -> str:
    rows = []
    for ch in ep.meta["main"].get("chapters", []):
        hit = find_phrase(words, ch["at"])
        if hit:
            m, s = divmod(int(hit[0]), 60)
            rows.append(f"{m:02d}:{s:02d} {ch['label']}")
    return "\n".join(rows)


def credits_text(ep) -> str:
    p = ep.assets / "credits.json"
    credits = json.loads(p.read_text()) if p.exists() else {}
    if not credits:
        return ""
    rows = [f"- {c['title'].removeprefix('File:')} by {c['author'] or 'unknown'} ({c['license']}) {c['source']}"
            for c in credits.values()]
    return "\n\nPhoto credits (Wikimedia Commons):\n" + "\n".join(rows)


def publish_times(ep, cfg) -> dict:
    start = dt.date.fromisoformat(str(ep.meta["episode"]["week_start"]))
    sch = cfg["schedule"]

    def at(day: int, hhmm: str) -> str:
        h, m = map(int, hhmm.split(":"))
        t = dt.datetime.combine(start + dt.timedelta(days=day), dt.time(h, m), JST)
        return t.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")

    times = {"main": at(sch["main_day_offset"], sch["main_time_jst"])}
    for sh in ep.meta["shorts"]:
        times[f"short-{sh['n']}"] = at(sh["n"] - 1, sch["shorts_time_jst"])
    return times


def cmd_upload(args, cfg) -> None:
    ep = Episode(args.episode)
    if not args.dry_run:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
    words = ep.read_json("words.json")
    record = json.loads(ep.path("uploads.json").read_text()) if ep.path("uploads.json").exists() else {}
    times = publish_times(ep, cfg)
    yt = None if args.dry_run else build("youtube", "v3", credentials=google_creds(cfg))
    expected = cfg["youtube"].get("channel_id")
    if yt and expected:
        # guard against logging in with a different Google account / channel
        mine = [c["id"] for c in yt.channels().list(part="id", mine=True).execute().get("items", [])]
        if expected not in mine:
            sys.exit(f"logged-in account owns {mine or 'no channel'}, not {expected}. "
                     f"Delete {cfg['google']['token_file']} and log in with the BUSHIDO JAPAN channel account.")
    privacy_now = dt.datetime.now(dt.timezone.utc)
    # The default YouTube API quota (10,000 units/day) fits about 5 uploads, so cap each run;
    # re-running the next day continues where it stopped (finished uploads are kept in uploads.json).
    budget = {"left": args.limit or cfg["youtube"].get("uploads_per_run", 5)}

    def upload(key: str, video: Path, title: str, desc: str, tags: list[str], srts: dict[str, Path], thumb=None):
        if key in record:
            log(f"{key}: already uploaded -> https://youtu.be/{record[key]}")
            return record[key]
        if budget["left"] <= 0:
            log(f"{key}: upload limit for this run reached - run `upload` again tomorrow")
            return None
        publish_at = times[key]
        future = dt.datetime.fromisoformat(publish_at.replace("Z", "+00:00")) > privacy_now
        body = {
            "snippet": {"title": title[:100], "description": desc[:5000], "tags": tags,
                        "categoryId": cfg["youtube"]["category_id"], "defaultLanguage": "en",
                        "defaultAudioLanguage": "en"},
            "status": {"privacyStatus": "private" if future else cfg["youtube"]["privacy_if_past"],
                       "selfDeclaredMadeForKids": False, "containsSyntheticMedia": False},
        }
        if future:
            body["status"]["publishAt"] = publish_at
        log(f"{key}: '{title}'  publish {publish_at if future else 'now'}")
        if args.dry_run:
            budget["left"] -= 1
            return f"DRYRUN-{key}"
        req = yt.videos().insert(part="snippet,status", body=body,
                                 media_body=MediaFileUpload(str(video), chunksize=64 * 1024 * 1024, resumable=True))
        resp = None
        while resp is None:
            status, resp = req.next_chunk()
            if status:
                log(f"  {int(status.progress() * 100)}%")
        vid = resp["id"]
        for lang, srt in srts.items():
            if srt.exists() and srt.stat().st_size:
                yt.captions().insert(part="snippet", body={"snippet": {"videoId": vid, "language": lang,
                                     "name": {"en": "English", "ja": "日本語"}[lang]}},
                                     media_body=MediaFileUpload(str(srt), mimetype="application/octet-stream")).execute()
        if thumb and thumb.exists():
            try:
                yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(thumb))).execute()
            except Exception as e:  # custom thumbnails need a phone-verified channel
                log(f"  thumbnail skipped: {e}")
        record[key] = vid
        budget["left"] -= 1
        ep.write_json("uploads.json", record)
        log(f"  -> https://youtu.be/{vid}")
        return vid

    m = ep.meta["main"]
    subscribe = f"https://www.youtube.com/channel/{cfg['youtube'].get('channel_id', '')}?sub_confirmation=1"
    desc = (m["description"].replace("{chapters}", chapters_text(ep, words)).replace("{subscribe_url}", subscribe)
            + credits_text(ep))
    main_id = upload("main", ep.path("main.mp4"), m["title"], desc, m["tags"],
                     {"en": ep.path("main.en.srt"), "ja": ep.path("main.ja.srt")}, ep.path("thumbnail.jpg"))
    if not main_id:
        return
    main_url = f"https://youtu.be/{main_id}"
    for sh in ep.meta["shorts"]:
        video = ep.path(f"short-{sh['n']}.mp4")
        if not video.exists():
            log(f"short-{sh['n']}: no video rendered - skipped")
            continue
        title = sh["title"] if "#shorts" in sh["title"].lower() else f"{sh['title']} #Shorts"
        common = ep.meta["shorts_common"]
        # Shorts already carry burned-in EN/JA captions; caption tracks are optional (400 quota units each)
        srts = ({"en": ep.path(f"short-{sh['n']}.en.srt"), "ja": ep.path(f"short-{sh['n']}.ja.srt")}
                if cfg["youtube"].get("caption_tracks_for_shorts") else {})
        upload(f"short-{sh['n']}", video, title, common["description"].replace("{main_url}", main_url).replace("{subscribe_url}", subscribe), common["tags"],
               srts)
    left = [k for k in times if k not in record]
    if args.dry_run:
        return
    log("all uploads scheduled." if not left else f"still to upload: {', '.join(left)}")
    log("Check YouTube Studio > Content to review before they go public.")


# -------------------------------------------------------------------------- cli


def cmd_all(args, cfg) -> None:
    for step in (cmd_fetch, cmd_transcribe, cmd_translate, cmd_graphics, cmd_render, cmd_upload):
        step(args, cfg)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("setup", help="download subtitle/graphic fonts")
    for name in ("fetch", "transcribe", "translate", "graphics", "render", "upload", "all"):
        p = sub.add_parser(name)
        p.add_argument("episode", help="episode id prefix, e.g. ep01")
        p.add_argument("--input", help="(fetch/all) use a local video instead of Google Drive")
        p.add_argument("--force", action="store_true", help="(translate) re-translate every line")
        p.add_argument("--offline", action="store_true", help="(graphics) do not download photos")
        p.add_argument("--only", help="(render) main | shorts | short-N")
        p.add_argument("--dry-run", action="store_true", help="(upload) print the schedule without uploading")
        p.add_argument("--limit", type=int, help="(upload) max new uploads in this run")
    args = ap.parse_args()
    cfg = load_config()
    handlers = {"setup": cmd_setup, "fetch": cmd_fetch, "transcribe": cmd_transcribe, "translate": cmd_translate,
                "graphics": cmd_graphics, "render": cmd_render, "upload": cmd_upload, "all": cmd_all}
    for k in ("input", "force", "offline", "only", "dry_run", "limit"):
        if not hasattr(args, k):
            setattr(args, k, None)
    handlers[args.cmd](args, cfg)


if __name__ == "__main__":
    main()
