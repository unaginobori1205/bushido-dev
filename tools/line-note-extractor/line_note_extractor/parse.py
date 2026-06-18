"""LINEエクスポート / 貼り付けテキストからノートを抽出する。

LINEには「グループのノートを一覧取得する」公式APIが存在しないため、入口は
ユーザーがLINEアプリから書き出した（またはコピーした）テキストになる。
本モジュールは2つの入力形式を扱う:

1. talk_export  : LINEの「トーク履歴を送信／保存」で出力される .txt
2. notes_file   : ノート本文を貼り付けたテキスト（`---` 区切り、または日付見出し区切り）

トーク履歴txtでは「ノート」本文が完全には含まれない場合があるため、
ノートをまとめて残したい場合は notes_file 形式を推奨する（README参照）。
"""

from __future__ import annotations

import re
from datetime import date
from typing import Iterable, Optional

from .models import Note

# 例: 2026/05/25(月)
_DATE_HEADER = re.compile(r"^(\d{4})/(\d{1,2})/(\d{1,2})\([月火水木金土日]\)\s*$")
# 例: 10:30<TAB>上岡賢輔<TAB>本文   /  10:30<TAB>上岡賢輔<TAB>本文（時刻のみの行頭）
_MESSAGE_LINE = re.compile(r"^(\d{1,2}:\d{2})\t([^\t]*)\t(.*)$")
# notes_file の日付見出し（任意）: # 2026-05-25  または  ## 2026/05/25
_NOTES_DATE_HEADER = re.compile(r"^#+\s*(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s*$")

# トーク履歴に現れるノート関連のシステム文言。これらの行は通知であって本文ではない。
_NOTE_SYSTEM_HINTS = ("ノートに投稿しました", "がノートを作成", "ノートを更新しました")


def _to_date(y: str, m: str, d: str) -> date:
    return date(int(y), int(m), int(d))


def parse_talk_export(
    text: str,
    *,
    author: Optional[str] = None,
    keyword: Optional[str] = None,
    notes_only: bool = False,
) -> list[Note]:
    """LINEトーク履歴txtをメッセージ単位で抽出する。

    Args:
        text: トーク履歴txtの全文。
        author: 指定するとその発言者のメッセージのみ抽出。
        keyword: 指定するとその語を含むメッセージのみ抽出。
        notes_only: True ならノート関連のシステム行の直近メッセージのみ拾う簡易フィルタ。
    """
    notes: list[Note] = []
    current_date: Optional[date] = None
    cur: Optional[Note] = None

    def flush() -> None:
        nonlocal cur
        if cur and cur.body.strip():
            notes.append(cur)
        cur = None

    for raw in text.splitlines():
        line = raw.rstrip("\n")

        dh = _DATE_HEADER.match(line)
        if dh:
            flush()
            current_date = _to_date(*dh.groups())
            continue

        mm = _MESSAGE_LINE.match(line)
        if mm:
            flush()
            _time, name, body = mm.groups()
            cur = Note(body=body, posted_on=current_date, author=name.strip() or None)
        elif cur is not None:
            # 直前メッセージの折り返し（複数行本文）
            cur.body += "\n" + line

    flush()

    if notes_only:
        notes = [
            n
            for n in notes
            if any(h in n.body for h in _NOTE_SYSTEM_HINTS) is False  # 通知行そのものは除外
        ]
    if author:
        notes = [n for n in notes if n.author == author]
    if keyword:
        notes = [n for n in notes if keyword in n.body]
    # ノート通知のシステム行は本文として不要なので常に除外
    notes = [n for n in notes if not any(h in n.body for h in _NOTE_SYSTEM_HINTS)]
    return notes


def parse_notes_file(text: str) -> list[Note]:
    """貼り付けノートテキストを1件ずつに分割する。

    区切りルール:
      - `---`（前後空白可）のみの行で分割
      - 見出し `# 2026-05-25` があればその日付を以降のノートに付与
    区切りが一切ない場合は、空行2つ以上の連続で分割する。
    """
    if re.search(r"^\s*---\s*$", text, flags=re.MULTILINE):
        blocks = re.split(r"^\s*---\s*$", text, flags=re.MULTILINE)
    else:
        blocks = re.split(r"\n\s*\n\s*\n+", text)

    notes: list[Note] = []
    carried_date: Optional[date] = None
    for block in blocks:
        lines = block.strip().splitlines()
        if not lines:
            continue
        body_lines: list[str] = []
        block_date = carried_date
        for ln in lines:
            dh = _NOTES_DATE_HEADER.match(ln.strip())
            if dh:
                block_date = _to_date(*dh.groups())
                carried_date = block_date
                continue
            body_lines.append(ln)
        body = "\n".join(body_lines).strip()
        if body:
            notes.append(Note(body=body, posted_on=block_date))
    return notes


def dedupe(notes: Iterable[Note]) -> list[Note]:
    """本文先頭の正規化で重複ノートを除去する。"""
    seen: set[str] = set()
    out: list[Note] = []
    for n in notes:
        key = " ".join(n.body.split())[:120]
        if key in seen:
            continue
        seen.add(key)
        out.append(n)
    return out
