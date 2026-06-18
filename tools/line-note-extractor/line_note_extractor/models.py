"""共通データモデル。"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


@dataclass
class Note:
    """抽出された1件のノート（要約前の素データ）。"""

    body: str
    posted_on: Optional[date] = None
    author: Optional[str] = None
    source: str = "line"

    def preview(self, n: int = 40) -> str:
        flat = " ".join(self.body.split())
        return flat[:n] + ("…" if len(flat) > n else "")


class NoteSummary(BaseModel):
    """Claudeが生成する構造化要約。Notionの1ページに対応する。"""

    title: str = Field(description="ノート内容を端的に表す日本語タイトル（30字以内）")
    summary: str = Field(description="ノートの要約（200〜400字程度の日本語）")
    key_points: list[str] = Field(
        default_factory=list, description="重要な論点・学びの箇条書き（3〜6項目）"
    )
    tags: list[str] = Field(
        default_factory=list, description="内容を表すタグ（日本語、3〜6個）"
    )
    action_items: list[str] = Field(
        default_factory=list, description="ノートから読み取れる今後のアクション（なければ空）"
    )


@dataclass
class SummarizedNote:
    """素ノートと要約結果のペア。"""

    note: Note
    summary: NoteSummary = field(repr=False)
