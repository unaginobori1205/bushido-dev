#!/usr/bin/env python3
"""公開済みGoogleフォームのURLからQRコードPNGを生成する。

使い方:
    pip install qrcode pillow
    python3 generate_qr.py "https://docs.google.com/forms/d/e/.../viewform" \
        -o halal_seminar_form_qr.png

引数を省略すると標準入力からURLを読み取ります。
"""
import argparse
import sys

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def main() -> int:
    parser = argparse.ArgumentParser(description="フォームURLからQRコードPNGを生成")
    parser.add_argument("url", nargs="?", help="公開フォームのURL")
    parser.add_argument(
        "-o", "--output", default="halal_seminar_form_qr.png", help="出力PNGパス"
    )
    parser.add_argument("--box-size", type=int, default=12, help="モジュールあたりのpx")
    parser.add_argument("--border", type=int, default=4, help="余白(モジュール数)")
    args = parser.parse_args()

    url = args.url or sys.stdin.readline().strip()
    if not url:
        parser.error("URLが指定されていません")

    qr = qrcode.QRCode(
        error_correction=ERROR_CORRECT_M,
        box_size=args.box_size,
        border=args.border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(args.output)
    print(f"QRコードを書き出しました: {args.output}  (data: {url})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
