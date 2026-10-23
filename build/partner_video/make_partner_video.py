"""パートナー候補者向け 90秒紹介動画を組み立てる。

台本: docs/2027-ise-camp/13-パートナー向け紹介動画台本.md

使い方:
    python make_partner_video.py --photos ./photos --font-dir ./fonts --out ./out

- photos/ に「S2-3_飯盒.jpg」のように、ショット番号で始まる名前の写真を置く。
  写真のないショットは「写真スロット」の仮画面で描画する（尺と文字の確認用）。
- 必要なもの: ffmpeg、Pillow（libraqm 付き）、numpy、pyopenjtalk
- フォントは しっぽり明朝（OFL）を想定。--font-dir に ShipporiMincho-*.ttf を置く。
"""
import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 30
TOTAL = 90.0
XFADE = 0.6

NAVY, DEEP, RED, WHITE = (27, 58, 92), (18, 40, 61), (193, 53, 43), (255, 255, 255)

# ── ショット（写真スロット）。秒数は画面に出ている長さ ─────────────────
SHOTS = [
    ("S1-1", 5.5, "伊勢の朝（宇治橋・参道）"),
    ("S1-2", 5.5, "全員の集合写真"),
    ("S2-1", 3.3, "正座"),
    ("S2-2", 3.3, "清掃奉仕"),
    ("S2-3", 3.3, "飯盒炊さん"),
    ("S2-4", 3.1, "川遊び"),
    ("S3-1", 5.0, "子どもたちの笑顔"),
    ("S3-2", 5.0, "班での活動"),
    ("S3-3", 5.0, "子ども同士の交流"),
    ("S4-1", 4.4, "説明している子ども"),
    ("S4-2", 4.3, "聞いている子ども"),
    ("S4-3", 4.3, "班での話し合い"),
    ("S5-1", 4.4, "キャンプファイヤー"),
    ("S5-2", 4.3, "スタッフ・大人の見守り"),
    ("S5-3", 4.3, "全体の様子"),
    ("S6-1", 5.0, "貸切バス"),
    ("S6-2", 5.0, "合気道"),
    ("S6-3", 5.0, "合気道（指導の場面）"),
    ("S7-1", 10.0, "エンドカード背景"),
]

# ── ナレーション。text は表示用、tts は読み上げ用（読みを補正） ──────────
NARRATION = [
    (1.5, "二〇二六年、夏。伊勢。子どもたちが、この場所で、三日間を過ごしました。",
     "にせんにじゅうろくねん、夏。伊勢。子どもたちが、この場所で、三日間を過ごしました。"),
    (11.5, "朝は、正座から始まります。神宮の前の道を掃き、火をおこして、米を炊く。川に入れば、もう言葉はいりません。",
     None),
    (24.0, "来年、私たちはこの場所で、国際キャンプを開きます。名古屋の子どもたちと、外国にルーツを持つ子どもたちが、一対一でバディを組み、三日間を共に過ごします。",
     None),
    (39.0, "日本の子は、案内する側に立ちます。言葉の通じない相手に説明しようとしたとき、知っているつもりだったことに、はじめて気づきます。",
     None),
    (52.0, "運営は、非営利の実行委員会です。ご協賛は、参加費の減免と、通訳の配置に充て、収支は、すべて公開します。",
     None),
    (65.0, "最初のパートナーは、株式会社鯱バス。貸切バスと、英語での合気道指導を担ってくださいます。毎年続く事業にするために、次の仲間を探しています。",
     "最初のパートナーは、株式会社しゃちバス。貸切バスと、英語での合気道指導を担ってくださいます。毎年続く事業にするために、次の仲間を探しています。"),
    (81.0, "伊勢青少年国際キャンプ、二〇二七。一緒に、つくりませんか。",
     "伊勢青少年国際キャンプ、にせんにじゅうなな。一緒に、つくりませんか。"),
]

# ── 縦組みテロップ（開始, 終了, 行, 大きさ） ─────────────────────────
TELOPS = [
    (1.0, 5.0, ["伊勢"], 190),
    (5.6, 10.6, ["二〇二六年、夏"], 84),
    (12.0, 22.8, ["正座する。", "掃く。炊く。"], 84),
    (24.6, 31.2, ["来年、", "国際キャンプへ"], 92),
    (31.6, 38.0, ["一対一の", "バディ"], 92),
    (39.6, 50.6, ["案内する側に", "立つ"], 104),
    (52.4, 63.6, ["非営利。", "収支は、公開。"], 92),
    (65.4, 71.8, ["最初の", "パートナー"], 92),
    (72.2, 79.4, ["次の仲間を、", "探しています"], 92),
]

# ── 下部の横組み補足（開始, 終了, 文） ────────────────────────────
CAPTIONS = [
    (24.6, 38.0, "2027年7月26日（月）〜28日（水）2泊3日　名古屋の小中学生と、外国にルーツを持つ小中学生 40名"),
    (52.4, 63.6, "ご協賛の使い道：参加費の減免枠・通訳の配置　／　剰余金は次年度へ繰り越し、収支報告は公開"),
    (65.4, 79.4, "株式会社鯱バス：名古屋⇄伊勢の貸切バス（往復）のご提供／合気道研修の指導（英語）"),
]

END_START = 80.0
END_LINES = [
    ("2027年7月26日（月）〜28日（水）　2泊3日", 40, WHITE),
    ("会場　公益財団法人修養団 伊勢青少年研修センター", 30, WHITE),
    ("主催　伊勢青少年国際キャンプ実行委員会", 30, WHITE),
    ("　　　（BUSHIDO JAPAN／株式会社鯱バス）", 30, WHITE),
    ("", 18, WHITE),
    ("協賛メニュー", 30, (232, 200, 120)),
    ("特別協賛 30万円〜／協賛A 10万円／協賛B 5万円／協賛C 3万円／現物協賛", 28, WHITE),
    ("", 18, WHITE),
    ("事務局　090-5101-5064（実行委員長　上岡賢輔）", 30, WHITE),
]


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


class Fonts:
    def __init__(self, font_dir):
        d = Path(font_dir)
        self.bold = str(d / "ShipporiMincho-Bold.ttf")
        self.medium = str(d / "ShipporiMincho-Medium.ttf")

    def get(self, size, bold=True):
        return ImageFont.truetype(self.bold if bold else self.medium, size)


def with_shadow(layer, radius=10, opacity=0.65):
    """白文字レイヤーに、ぼかした黒い影を敷く。"""
    alpha = layer.split()[3]
    shadow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(radius)).point(lambda a: int(a * opacity)))
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    out.alpha_composite(shadow, (3, 4))
    out.alpha_composite(layer)
    return out


def vertical_telop(lines, size, fonts, right=150, top=130):
    """縦組み。1行目を右端に置き、左へ行を送る。"""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font = fonts.get(size)
    pitch = int(size * 1.45)
    for i, line in enumerate(lines):
        x = W - right - size - i * pitch
        y = top + i * int(size * 0.9)          # 2行目を少し下げて段をつける
        draw.text((x, y), line, font=font, fill=WHITE, direction="ttb", features=["vert"])
    return with_shadow(layer, radius=max(6, size // 10))


def caption(text, fonts, size=30):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font = fonts.get(size, bold=False)
    w = draw.textlength(text, font=font)
    band = Image.new("RGBA", (W, 96), (0, 0, 0, 110))
    layer.alpha_composite(band, (0, H - 96))
    draw.text(((W - w) / 2, H - 96 + (96 - size) / 2 - 4), text, font=font, fill=WHITE)
    return layer


def gradient(top, bottom):
    t = np.linspace(0, 1, H)[:, None, None]
    arr = (np.array(top) * (1 - t) + np.array(bottom) * t).repeat(W, axis=1)
    return Image.fromarray(arr.astype(np.uint8), "RGB")


def placeholder(shot_id, label, fonts):
    img = gradient((44, 70, 98), DEEP)
    draw = ImageDraw.Draw(img)
    for k in range(0, W - 200, 36):              # 破線の枠
        draw.line([(100 + k, 100), (min(100 + k + 18, W - 100), 100)], fill=(120, 140, 165), width=2)
        draw.line([(100 + k, H - 100), (min(100 + k + 18, W - 100), H - 100)], fill=(120, 140, 165), width=2)
    for k in range(0, H - 200, 36):
        draw.line([(100, 100 + k), (100, min(100 + k + 18, H - 100))], fill=(120, 140, 165), width=2)
        draw.line([(W - 100, 100 + k), (W - 100, min(100 + k + 18, H - 100))], fill=(120, 140, 165), width=2)
    f1, f2 = fonts.get(44), fonts.get(30, bold=False)
    t1, t2 = f"［写真］{shot_id}　{label}", "今年の写真に差し替え予定"
    draw.text(((W - draw.textlength(t1, font=f1)) / 2 - 120, H / 2 - 50), t1, font=f1, fill=(200, 210, 222))
    draw.text(((W - draw.textlength(t2, font=f2)) / 2 - 120, H / 2 + 20), t2, font=f2, fill=(140, 158, 180))
    return img


def find_photo(photo_dir, shot_id):
    if not photo_dir or not Path(photo_dir).is_dir():
        return None
    for p in sorted(Path(photo_dir).iterdir()):
        if p.stem.startswith(shot_id) and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".heic", ".webp"):
            return p
    return None


def end_card(bg_path, fonts):
    if bg_path:
        bg = Image.open(bg_path).convert("RGB")
        bg = cover(bg).filter(ImageFilter.GaussianBlur(14))
        bg = Image.blend(bg, Image.new("RGB", (W, H), DEEP), 0.62)
    else:
        bg = gradient(NAVY, DEEP)
    img = bg.convert("RGBA")
    img.alpha_composite(vertical_telop(["伊勢青少年国際キャンプ", "二〇二七"], 72, fonts, right=140, top=100))
    draw = ImageDraw.Draw(img)
    y = 250
    for text, size, color in END_LINES:
        if text:
            draw.text((190, y), text, font=fonts.get(size, bold=size >= 40), fill=color)
        y += int(size * 1.75)
    draw.rectangle([150, 250, 156, y - 20], fill=RED)
    return img.convert("RGB")


def cover(img):
    s = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    l, t = (img.width - W) // 2, (img.height - H) // 2
    return img.crop((l, t, l + W, t + H))


def render_shot(still, seconds, idx, out):
    """静止画にゆっくりしたズーム（ケン・バーンズ）をかける。"""
    n = int(round(seconds * FPS))
    zin = idx % 2 == 0
    z = f"1+0.07*on/{n}" if zin else f"1.07-0.07*on/{n}"
    vf = (f"scale=3840:2160,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
          f":d=1:s={W}x{H}:fps={FPS},format=yuv420p")
    run(["ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-t", f"{seconds:.3f}", "-i", str(still),
         "-vf", vf, "-frames:v", str(n), "-c:v", "libx264", "-preset", "medium", "-crf", "16", str(out)])


def synth_narration(work):
    import pyopenjtalk
    paths = []
    for i, (start, text, tts) in enumerate(NARRATION):
        x, sr = pyopenjtalk.tts(tts or text, speed=1.0)
        p = work / f"n{i + 1}.wav"
        with wave.open(str(p), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes(np.clip(x, -32768, 32767).astype(np.int16).tobytes())
        paths.append((start, p, len(x) / sr))
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--photos", default="photos")
    ap.add_argument("--font-dir", default="fonts")
    ap.add_argument("--out", default="out")
    args = ap.parse_args()

    out = Path(args.out)
    work = out / "work"
    work.mkdir(parents=True, exist_ok=True)
    fonts = Fonts(args.font_dir)
    assert abs(sum(s for _, s, _ in SHOTS) - TOTAL) < 0.01, "ショットの合計が90秒になっていない"

    # 1) ショット
    report, clips = {}, []
    for i, (sid, sec, label) in enumerate(SHOTS):
        photo = find_photo(args.photos, sid)
        report[sid] = photo.name if photo else None
        still = work / f"{sid}.png"
        if sid == "S7-1":
            end_card(photo, fonts).save(still)
        elif photo:
            cover(Image.open(photo).convert("RGB")).save(still)
        else:
            placeholder(sid, label, fonts).save(still)
        length = sec + (XFADE if i < len(SHOTS) - 1 else 0)
        clip = work / f"{sid}.mp4"
        render_shot(still, length, i, clip)
        clips.append((clip, sec))

    # 2) クロスフェードでつなぐ
    inputs, chain, offset, prev = [], [], 0.0, "0:v"
    for clip, _ in clips:
        inputs += ["-i", str(clip)]
    for k in range(1, len(clips)):
        offset += clips[k - 1][1]
        label = f"v{k}"
        chain.append(f"[{prev}][{k}:v]xfade=transition=fade:duration={XFADE}:offset={offset - 0:.3f}[{label}]")
        prev = label
    base = work / "base.mp4"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(chain), "-map", f"[{prev}]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", str(base)])

    # 3) テロップを重ねる
    overlays = [(s, e, vertical_telop(lines, size, fonts)) for s, e, lines, size in TELOPS]
    overlays += [(s, e, caption(t, fonts)) for s, e, t in CAPTIONS]
    inputs, chain, prev = ["-i", str(base)], [], "0:v"
    for k, (s, e, img) in enumerate(overlays, start=1):
        p = work / f"ov{k:02d}.png"
        img.save(p)
        inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{TOTAL}", "-i", str(p)]
        chain.append(f"[{k}:v]format=rgba,fade=in:st={s}:d=0.5:alpha=1,fade=out:st={e - 0.5}:d=0.5:alpha=1[o{k}]")
        chain.append(f"[{prev}][o{k}]overlay=0:0:enable='between(t,{s},{e})'[w{k}]")
        prev = f"w{k}"
    chain.append(f"[{prev}]fade=in:st=0:d=0.8,fade=out:st={TOTAL - 1.2}:d=1.2[vout]")

    # 4) ナレーション
    narr = synth_narration(work)
    a0 = len(overlays) + 1
    for start, p, _ in narr:
        inputs += ["-i", str(p)]
    for j, (start, _, _) in enumerate(narr):
        ms = int(start * 1000)
        chain.append(f"[{a0 + j}:a]aresample=48000,adelay={ms}|{ms}[a{j}]")
    chain.append("".join(f"[a{j}]" for j in range(len(narr)))
                 + f"amix=inputs={len(narr)}:normalize=0,apad,atrim=0:{TOTAL},loudnorm=I=-16:TP=-1.5:LRA=11[aout]")

    final = out / "partner_video_90s.mp4"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(chain), "-map", "[vout]", "-map", "[aout]",
         "-t", f"{TOTAL}", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(final)])

    narr_report = [{"start": s, "end": round(s + d, 2)} for s, _, d in narr]
    (out / "report.json").write_text(json.dumps({"photos": report, "narration": narr_report},
                                                ensure_ascii=False, indent=2))
    print(final)


if __name__ == "__main__":
    main()
