"""Claude (claude-opus-4-8) で各ノートを構造化要約する。"""

from __future__ import annotations

import anthropic

from .models import Note, NoteSummary, SummarizedNote

MODEL = "claude-opus-4-8"

_SYSTEM = """\
あなたは武士道・弓道・日本文化体験事業の記録アシスタントです。
LINEグループに投稿された「ノート」を読み、後から見返して活用できる形に整理します。
誇張や創作はせず、原文にある情報だけを使って日本語で要約してください。
タイトルは内容が一目で分かる簡潔なものにし、重要な学びや論点を箇条書きで抽出してください。\
"""


def summarize_note(client: anthropic.Anthropic, note: Note) -> NoteSummary:
    """1件のノートを構造化要約に変換する。"""
    meta = []
    if note.posted_on:
        meta.append(f"投稿日: {note.posted_on.isoformat()}")
    if note.author:
        meta.append(f"投稿者: {note.author}")
    header = "\n".join(meta)
    user_content = (
        (header + "\n\n" if header else "")
        + "以下のノートを要約してください。\n\n----\n"
        + note.body.strip()
        + "\n----"
    )

    response = client.messages.parse(
        model=MODEL,
        max_tokens=4000,
        thinking={"type": "adaptive"},
        system=_SYSTEM,
        messages=[{"role": "user", "content": user_content}],
        output_format=NoteSummary,
    )
    if response.parsed_output is None:
        # 安全側: 要約に失敗した場合は原文の冒頭をそのまま使う
        return NoteSummary(
            title=note.preview(30),
            summary=note.body.strip()[:400],
            key_points=[],
            tags=[],
            action_items=[],
        )
    return response.parsed_output


def summarize_all(
    client: anthropic.Anthropic, notes: list[Note]
) -> list[SummarizedNote]:
    results: list[SummarizedNote] = []
    for i, note in enumerate(notes, 1):
        print(f"  [{i}/{len(notes)}] 要約中: {note.preview()}")
        summary = summarize_note(client, note)
        results.append(SummarizedNote(note=note, summary=summary))
    return results
