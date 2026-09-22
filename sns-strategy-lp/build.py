# -*- coding: utf-8 -*-
"""
index.html → dist/index.html を生成するビルドスクリプト。

やること：
  1) img/*.jpg の参照を base64 データURIに埋め込む（1ファイルで完結させるため）
  2) OGP画像をNetlifyの絶対URLに差し替え、og:url を追加する

使い斸（このフォルダで）：
    python build.py

出力される dist/ は、そのままアップすれば完結する状態です：
    dist/index.html … ページ本体（画像を内包）
    dist/ogp.jpg    … SNSシェア用サムネイル（HTMLに埋め込めないため別ファイル）
"""
import base64
import mimetypes
import shutil
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "index.html"
OUT = ROOT / "dist" / "index.html"
SITE = "https://jci-nagoya-sns-strategy.netlify.app/"

OG_FROM = '<meta property="og:image" content="img/ogp.jpg">'
OG_TO = (
    '<meta property="og:url" content="%s">\n'
    '<meta property="og:image" content="%sogp.jpg">' % (SITE, SITE)
)


def main():
    html = SRC.read_text(encoding="utf-8")

    # 1) OGP を絶対URLへ
    if OG_FROM not in html:
        sys.exit("NG: og:image のタグが見つかりません（index.html を確認してください）")
    html = html.replace(OG_FROM, OG_TO, 1)

    # 2) src="img/xxx.jpg" を base64 に差し替える
    #    HTMLコメント内（書き方の例）は対象外にするため、コメントで分割して処理する
    embedded = []
    missing = []

    def inline(m):
        rel = m.group(1)
        f = ROOT / rel
        if not f.exists():
            missing.append(rel)
            return m.group(0)
        mime = mimetypes.guess_type(f.name)[0] or "image/jpeg"
        b64 = base64.b64encode(f.read_bytes()).decode("ascii")
        embedded.append(rel)
        return 'src="data:%s;base64,%s"' % (mime, b64)

    parts = re.split(r"(<!--.*?-->)", html, flags=re.S)
    html = "".join(
        part if part.startswith("<!--") else re.sub(r'src="(img/[^"]+)"', inline, part)
        for part in parts
    )

    if missing:
        sys.exit("NG: 画像が見つかりません → %s\n     img/ に置いたか、ファイル名が合っているか確認してください。"
                 % ", ".join(sorted(set(missing))))

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")

    # 3) OGP画像はHTMLに埋め込めない（SNSが外部URLとして取りに来る）ので
    #    dist/ogp.jpg としてコピーしておく。dist フォルダごとアップすれば完結する。
    ogp_src = ROOT / "img" / "ogp.jpg"
    if not ogp_src.exists():
        sys.exit("NG: img/ogp.jpg が見つかりません")
    shutil.copyfile(ogp_src, OUT.parent / "ogp.jpg")

    print("OK  dist/ を出力しました")
    print("    index.html … %.1f MB（画像%d点を埋め込み）"
          % (OUT.stat().st_size / 1024 / 1024, len(embedded)))
    print("    ogp.jpg    … %.0f KB（SNSシェア用サムネイル）"
          % ((OUT.parent / "ogp.jpg").stat().st_size / 1024))


if __name__ == "__main__":
    main()
