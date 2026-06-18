"""LINEノート抽出→要約→Notion投稿のCLI。

使い方の例:
  # ノート貼り付けファイルからNotionへ
  python -m line_note_extractor.cli --notes-file notes.txt --notion-parent <PAGE_ID>

  # LINEトーク履歴txtから、特定の語を含むメッセージだけ
  python -m line_note_extractor.cli --talk-export talk.txt --keyword 弓道 \
      --notion-parent <PAGE_ID>

  # Notionには送らず、要約結果をJSONで確認だけする
  python -m line_note_extractor.cli --notes-file notes.txt --dry-run
"""

from __future__ import annotations

import argparse
import dataclasses
import json
import os
import sys

import anthropic

from . import parse as parse_mod
from .summarize import summarize_all


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="line-note-extractor",
        description="LINEグループのノートを抽出・要約してNotionにまとめる",
    )
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--talk-export", metavar="FILE", help="LINEトーク履歴の.txt")
    src.add_argument(
        "--notes-file", metavar="FILE", help="ノート本文の貼り付けテキスト（--区切り）"
    )

    p.add_argument("--author", help="（トーク履歴）この発言者のみ抽出")
    p.add_argument("--keyword", help="（トーク履歴）この語を含む行のみ抽出")

    p.add_argument("--notion-parent", help="出力先Notion親ページのID")
    p.add_argument("--notion-database", help="既存データベースに追記する場合のID")
    p.add_argument(
        "--database-title", default="LINEノートまとめ", help="新規DBのタイトル"
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Notionへ送らず要約結果をJSON出力する",
    )
    p.add_argument(
        "--limit", type=int, default=0, help="先頭N件だけ処理（0で全件）"
    )
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)

    # 1. 抽出
    if args.talk_export:
        notes = parse_mod.parse_talk_export(
            _read(args.talk_export), author=args.author, keyword=args.keyword
        )
    else:
        notes = parse_mod.parse_notes_file(_read(args.notes_file))
    notes = parse_mod.dedupe(notes)
    if args.limit:
        notes = notes[: args.limit]

    if not notes:
        print("抽出できるノートがありませんでした。入力形式を確認してください。")
        return 1
    print(f"{len(notes)} 件のノートを抽出しました。")

    # 2. 要約
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("環境変数 ANTHROPIC_API_KEY が未設定です。", file=sys.stderr)
        return 2
    client = anthropic.Anthropic(api_key=api_key)
    summarized = summarize_all(client, notes)

    # 3a. ドライラン: JSON出力して終了
    if args.dry_run:
        payload = [
            {
                "note": {
                    "posted_on": s.note.posted_on.isoformat()
                    if s.note.posted_on
                    else None,
                    "author": s.note.author,
                },
                "summary": dataclasses.asdict(s.summary)
                if dataclasses.is_dataclass(s.summary)
                else s.summary.model_dump(),
            }
            for s in summarized
        ]
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    # 3b. Notionへ書き出し
    token = os.environ.get("NOTION_TOKEN")
    if not token:
        print("環境変数 NOTION_TOKEN が未設定です。", file=sys.stderr)
        return 2
    if not args.notion_database and not args.notion_parent:
        print(
            "--notion-parent（新規DB作成）か --notion-database（追記）のいずれかが必要です。",
            file=sys.stderr,
        )
        return 2

    from . import notion as notion_mod

    database_id, page_ids = notion_mod.export_to_notion(
        token=token,
        parent_page_id=args.notion_parent,
        items=summarized,
        database_title=args.database_title,
        database_id=args.notion_database,
    )
    print(f"完了: データベース {database_id} に {len(page_ids)} 件を投稿しました。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
