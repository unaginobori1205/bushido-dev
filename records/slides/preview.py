#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""slides_data.py から PNG プレビューと結合PDFを生成（Pillow）"""
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont
import slides_data as D

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "preview")
os.makedirs(OUT, exist_ok=True)

# 16:9 @ 150dpi 相当
W, H = 2000, 1125
SC = W / 13.333  # inch -> px

SANS_R = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
SANS_B = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
SERIF_B = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
_cache = {}

def font(path, pt):
    key = (path, pt)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(path, int(pt * SC / 72.0 * 0.96))
    return _cache[key]

def IN(v): return int(v * SC)

def draw_text(dr, x, y, s, fnt, color, ls=1.0, space_after=0):
    """複数行（リスト）対応。yを返す"""
    if isinstance(s, str): s = [s]
    asc, desc = fnt.getmetrics()
    lh = (asc + desc) * ls
    for line in s:
        dr.text((x, y), line, font=fnt, fill=color)
        y += lh + space_after
    return y

def measure(fnt, text):
    asc, desc = fnt.getmetrics()
    return asc + desc

def qr_img(data, fg=(0x14,0x21,0x3D)):
    qr = qrcode.QRCode(box_size=10, border=2,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(data); qr.make(fit=True)
    return qr.make_image(fill_color=fg, back_color="white").convert("RGB")

QR = {"kickoff": qr_img(D.URL_KICKOFF), "survey": qr_img(D.URL_SURVEY)}


def base(color): return Image.new("RGB", (W, H), color)

def vgrad(c1, c2):
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / H
        r = int(c1[0] + (c2[0]-c1[0])*t)
        g = int(c1[1] + (c2[1]-c1[1])*t)
        b = int(c1[2] + (c2[2]-c1[2])*t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return img

def rrect(dr, box, fill, outline=None, width=1, radius=0):
    if radius > 0:
        dr.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    else:
        dr.rectangle(box, fill=fill, outline=outline, width=width)

def page_no(dr, n):
    f = font(SANS_R, 10)
    dr.text((IN(12.4), IN(7.0)), "%02d / 24" % n, font=f, fill=D.MUTED)

def kicker(dr, num, label):
    f1, f2 = font(SANS_B, 14), font(SANS_R, 13)
    dr.text((IN(0.9), IN(0.62)), "%02d" % num, font=f1, fill=D.GOLD)
    w = dr.textlength("%02d" % num, font=f1)
    dr.text((IN(0.9)+w+12, IN(0.66)), label, font=f2, fill=D.MUTED)

def heading(dr, title, size=34):
    dr.text((IN(0.9), IN(1.05)), title, font=font(SANS_B, size), fill=D.INK)
    dr.rectangle([IN(0.93), IN(1.95), IN(0.93)+IN(1.1), IN(1.95)+IN(0.05)], fill=D.GOLD)


def render(d):
    k = d["kind"]
    if k in ("cover", "statement"):
        img = vgrad(D.NAVY2, D.NAVY)
    else:
        img = base(D.PAPER)
    dr = ImageDraw.Draw(img)

    if k == "cover":
        dr.rectangle([IN(0.9), IN(2.1), IN(0.9)+IN(0.06), IN(2.1)+IN(3.3)], fill=D.GOLD)
        dr.text((IN(1.2), IN(1.55)), d["org"], font=font(SANS_R, 16), fill=D.GOLD_LT)
        dr.text((IN(1.13), IN(2.2)), d["title"], font=font(SERIF_B, 88), fill=D.WHITE)
        dr.text((IN(1.2), IN(4.55)), d["lead"], font=font(SANS_B, 26), fill=D.GOLD)
        dr.text((IN(1.2), IN(5.5)), d["sub"], font=font(SANS_R, 18), fill=D.BODY_LT)
        dr.text((IN(1.2), IN(6.72)), d["presenter"], font=font(SANS_R, 13), fill=(0x9A,0xA4,0xBC))

    elif k == "statement":
        dr.rectangle([IN(0.95), IN(2.5), IN(0.95)+IN(0.9), IN(2.5)+IN(0.06)], fill=D.GOLD)
        dr.text((IN(0.95), IN(1.7)), d["kicker"], font=font(SANS_R, 16), fill=D.GOLD_LT)
        y = IN(2.9)
        fb = font(SERIF_B, 46)
        for ln in d["big"]:
            dr.text((IN(0.95), y), ln, font=fb, fill=D.WHITE)
            y += measure(fb, ln) * 1.15 + 4
        y = IN(2.9) + int((0.95*len(d["big"])+0.35)*SC)
        if d.get("sub"):
            fs = font(SANS_R, 18)
            for ln in d["sub"]:
                dr.text((IN(0.95), y), ln, font=fs, fill=D.BODY_LT)
                y += measure(fs, ln) * 1.3 + 4
        if d.get("footnote"):
            dr.text((IN(0.95), IN(6.65)), d["footnote"], font=font(SANS_B, 13.5), fill=D.GOLD)
        page_no(dr, d["num"])

    elif k == "content":
        kicker(dr, d["num"], d["label"]); heading(dr, d["title"])
        top = 2.35
        if d.get("body"):
            y = IN(top)
            for t, lv in d["body"]:
                if lv == 0:
                    y += int(0.12*SC)
                    f = font(SANS_B, 19)
                    dr.text((IN(0.95), y), t, font=f, fill=D.NAVY)
                    y += measure(f, t)*1.12 + 7
                else:
                    f = font(SANS_R, 17)
                    dr.text((IN(0.95), y), "▸", font=font(SANS_B, 16), fill=D.GOLD)
                    dr.text((IN(0.95)+int(0.35*SC), y), t, font=f, fill=D.INK)
                    y += measure(f, t)*1.12 + 7
        if d.get("two_col"):
            colw = 5.55; ctop = 2.3
            for ci, (head, items) in enumerate(d["two_col"]):
                x = 0.95 if ci == 0 else 6.85
                rrect(dr, [IN(x), IN(ctop), IN(x+colw), IN(ctop+3.9)], D.CARD,
                      outline=D.CARD_LN, width=2, radius=14)
                dr.text((IN(x+0.3), IN(ctop+0.22)), head, font=font(SANS_B, 18), fill=D.NAVY)
                dr.rectangle([IN(x+0.32), IN(ctop+0.72), IN(x+0.32)+IN(0.7), IN(ctop+0.72)+IN(0.04)], fill=D.GOLD)
                sz = 14.5 if len(items) <= 7 else 13
                gap = 5 if len(items) <= 7 else 2
                y = IN(ctop+0.92)
                f = font(SANS_R, sz)
                for it in items:
                    dr.text((IN(x+0.32), y), "・", font=font(SANS_B, sz-0.5), fill=D.GOLD)
                    dr.text((IN(x+0.32)+int(0.28*SC), y), it, font=f, fill=D.INK)
                    y += measure(f, it)*1.1 + gap*SC/72.0*1.3
        if d.get("note"):
            rrect(dr, [IN(0.95), IN(6.35), IN(0.95+11.45), IN(6.35+0.72)], D.NAVY, radius=6)
            f = font(SANS_B, 14.5)
            ty = IN(6.35) + (IN(0.72) - measure(f, "あ"))//2
            dr.text((IN(1.25), ty), d["note"], font=f, fill=D.WHITE)
        page_no(dr, d["num"])

    elif k == "work":
        kicker(dr, d["num"], d["label"]); heading(dr, d["title"], size=32)
        y = IN(2.45)
        f = font(SANS_R, 17.5)
        for ln in d["lines"]:
            dr.text((IN(0.95), y), ln, font=f, fill=D.INK)
            y += measure(f, ln)*1.35 + 10
        qx, qy, qs = 9.4, 2.5, 2.85
        rrect(dr, [IN(qx-0.28), IN(qy-0.28), IN(qx+qs+0.28), IN(qy+qs+0.87)], D.CARD,
              outline=D.GOLD, width=3, radius=14)
        q = QR[d["qr"]].resize((IN(qs), IN(qs)))
        img.paste(q, (IN(qx), IN(qy)))
        fc = font(SANS_B, 14)
        cap = d["qr_caption"]
        cw = dr.textlength(cap, font=fc)
        dr.text((IN(qx)+(IN(qs)-cw)//2, IN(qy+qs)+10), cap, font=fc, fill=D.NAVY)
        fc2 = font(SANS_R, 11.5)
        cw2 = dr.textlength("QRから回答", font=fc2)
        dr.text((IN(qx)+(IN(qs)-cw2)//2, IN(qy+qs)+10+int(0.3*SC)), "QRから回答", font=fc2, fill=D.MUTED)
        dr.text((IN(0.95), IN(6.55)), "※ QRは仮URL。実フォーム作成後に差し替えます。",
                font=font(SANS_R, 11.5), fill=D.MUTED)
        page_no(dr, d["num"])

    elif k == "prompt":
        kicker(dr, d["num"], d["label"])
        dr.text((IN(0.9), IN(0.98)), d["title"], font=font(SANS_B, 30), fill=D.INK)
        dr.rectangle([IN(0.93), IN(1.78), IN(0.93)+IN(1.1), IN(1.78)+IN(0.05)], fill=D.GOLD)
        rrect(dr, [IN(0.9), IN(2.05), IN(0.9+11.5), IN(2.05+4.85)], D.NAVY, radius=10)
        dr.text((IN(1.25), IN(2.3)), d["intro"], font=font(SANS_B, 15), fill=D.GOLD_LT)
        y = IN(2.95)
        f = font(SANS_R, 13.5)
        for b in d["blocks"]:
            dr.text((IN(1.25), y), b, font=f, fill=(0xE8,0xEC,0xF5))
            y += measure(f, "あ")*1.2 + 3
        page_no(dr, d["num"])

    return img


imgs = []
for d in D.SLIDES:
    im = render(d)
    p = os.path.join(OUT, "slide_%02d.png" % d["num"])
    im.save(p)
    imgs.append(im)

import img2pdf
pdf = os.path.join(HERE, "恩送り_AI実践セミナー_preview.pdf")
pngs = [os.path.join(OUT, "slide_%02d.png" % d["num"]) for d in D.SLIDES]
with open(pdf, "wb") as f:
    f.write(img2pdf.convert(pngs))

# コンタクトシート（6列x4行）
cols, rows = 4, 6
tw, th = W//5, H//5
sheet = Image.new("RGB", (cols*tw + (cols+1)*20, rows*th + (rows+1)*20), (0x20,0x20,0x28))
for i, im in enumerate(imgs):
    r, c = divmod(i, cols)
    th_im = im.resize((tw, th))
    sheet.paste(th_im, (20 + c*(tw+20), 20 + r*(th+20)))
sheet.save(os.path.join(HERE, "contact_sheet.png"))
print("preview pages:", len(imgs), "->", pdf)
