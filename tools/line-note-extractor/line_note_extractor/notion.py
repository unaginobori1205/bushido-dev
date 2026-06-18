"""要約結果をNotionのデータベース＆ページとして書き出す。

Notion公式SDK (notion-client) を使用する。事前に:
  1. https://www.notion.so/my-integrations でインテグレーションを作成しトークンを取得
  2. 出力先の親ページをそのインテグレーションに「接続（共有）」する
"""

from __future__ import annotations

from typing import Optional

from notion_client import Client

from .models import SummarizedNote

_MAX_TEXT = 2000  # Notion rich_text 1ブロックの上限


def _rt(text: str) -> list[dict]:
    """長文を2000字制限に収めた rich_text 配列にする。"""
    text = text or ""
    chunks = [text[i : i + _MAX_TEXT] for i in range(0, len(text), _MAX_TEXT)] or [""]
    return [{"type": "text", "text": {"content": c}} for c in chunks]


def create_database(client: Client, parent_page_id: str, title: str) -> str:
    """親ページ配下にノート用データベースを作成し、database_id を返す。"""
    db = client.databases.create(
        parent={"type": "page_id", "page_id": parent_page_id},
        title=[{"type": "text", "text": {"content": title}}],
        properties={
            "タイトル": {"title": {}},
            "タグ": {"multi_select": {}},
            "投稿日": {"date": {}},
            "投稿者": {"rich_text": {}},
            "情報元": {
                "select": {
                    "options": [
                        {"name": "LINEノート", "color": "green"},
                        {"name": "LINEトーク", "color": "blue"},
                    ]
                }
            },
        },
    )
    return db["id"]


def _page_children(item: SummarizedNote) -> list[dict]:
    s = item.summary
    blocks: list[dict] = [
        {
            "object": "block",
            "type": "heading_2",
            "heading_2": {"rich_text": _rt("要約")},
        },
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {"rich_text": _rt(s.summary)},
        },
    ]
    if s.key_points:
        blocks.append(
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": _rt("重要な学び・論点")},
            }
        )
        blocks += [
            {
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {"rich_text": _rt(p)},
            }
            for p in s.key_points
        ]
    if s.action_items:
        blocks.append(
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": _rt("今後のアクション")},
            }
        )
        blocks += [
            {
                "object": "block",
                "type": "to_do",
                "to_do": {"rich_text": _rt(a), "checked": False},
            }
            for a in s.action_items
        ]
    # 原文を折りたたみで保存（出典確認用）
    blocks.append(
        {
            "object": "block",
            "type": "toggle",
            "toggle": {
                "rich_text": _rt("原文（LINEノート）"),
                "children": [
                    {
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {"rich_text": _rt(item.note.body.strip())},
                    }
                ],
            },
        }
    )
    return blocks


def add_note_page(client: Client, database_id: str, item: SummarizedNote) -> str:
    s = item.summary
    props: dict = {
        "タイトル": {"title": [{"type": "text", "text": {"content": s.title[:200]}}]},
        "タグ": {"multi_select": [{"name": t[:100]} for t in s.tags]},
        "情報元": {"select": {"name": "LINEノート"}},
    }
    if item.note.posted_on:
        props["投稿日"] = {"date": {"start": item.note.posted_on.isoformat()}}
    if item.note.author:
        props["投稿者"] = {"rich_text": _rt(item.note.author)}

    page = client.pages.create(
        parent={"type": "database_id", "database_id": database_id},
        properties=props,
        children=_page_children(item),
    )
    return page["id"]


def export_to_notion(
    token: str,
    parent_page_id: str,
    items: list[SummarizedNote],
    *,
    database_title: str = "LINEノートまとめ",
    database_id: Optional[str] = None,
) -> tuple[str, list[str]]:
    """要約済みノートをNotionへ書き出す。

    database_id が未指定なら新規データベースを作成する。
    戻り値は (database_id, 作成したページIDのリスト)。
    """
    client = Client(auth=token)
    if database_id is None:
        database_id = create_database(client, parent_page_id, database_title)
        print(f"  データベース作成: {database_id}")

    page_ids: list[str] = []
    for i, item in enumerate(items, 1):
        print(f"  [{i}/{len(items)}] Notionへ投稿: {item.summary.title}")
        page_ids.append(add_note_page(client, database_id, item))
    return database_id, page_ids
