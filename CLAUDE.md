# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not a software project**. It is a knowledge repository for BUSHIDO JAPAN — a
Nagoya-based inbound tourism / Japanese-culture experience business (弓道・武士道体験, travel
service arrangement, DMC). It stores business concepts, visit records, and interview
transcripts as Markdown.

There is no build, no test suite, no lint, no dependencies, and no package manifest.
Work here means writing and editing Markdown. Do not scaffold tooling unless asked.

## Dual-format record convention

Every record exists in **two formats of the same content**, written and committed together:

| Path | Format | Purpose |
|---|---|---|
| `records/<YYYY-MM-DD>-<romaji-slug>.md` | Notion-flavored: `## 基本情報` table, no frontmatter, `## タグ` line of `#hashtags` at the end | Pasted into / mirrored from Notion |
| `records/obsidian/<日本語タイトル>.md` | Obsidian: YAML frontmatter, `[[wikilinks]]`, `tags:` list | Obsidian vault |

Match the existing files exactly when adding a record — see
`records/2026-05-25-nagano-issui-workshop-visit.md` and
`records/obsidian/永野一翠工房 訪問記録.md` as the reference pair.

Obsidian frontmatter keys in use: `title`, `date`, `created`, `type`, `source`,
`location`, `status`, `related`, `tags`. Obsidian filenames are Japanese; the
`records/` filenames are date-prefixed romaji slugs.

## Notion is upstream

Business strategy lives in Notion, not here. The relevant tree is
`KENSUKE COMMAND CENTER / 05_BUSHIDO JAPAN・インバウンド`, which holds the source pages
(事業方針, 成長戦略, 旅行業ライセンス戦略, VJTM 商談管理 など).

When asked to record or brush up a concept:
1. Fetch the source Notion page with the Notion MCP tools before writing.
2. Write the note into `records/obsidian/`.
3. Mirror it back to Notion as a **child page** of the source — do not overwrite the
   original page's content.

## Language

Note content is Japanese. Commit messages, PR titles, and PR bodies in this repo have
been written in English (with Japanese proper nouns kept as-is); PR bodies summarizing
Japanese notes have used Japanese. Follow whichever the surrounding history uses.

## Branch layout (important)

There is **no `main` branch**. The repository's default branch is itself a
`claude/*` branch (currently `claude/nagano-issui-workshop-visit-Qnyg9`), and each new
piece of work branches from it. When opening a PR, resolve the default branch first
(`git remote show origin | grep 'HEAD branch'`) — using `main` as the base will fail
validation.

## Content standards for business notes

Concept and strategy notes in this repo are expected to be decision-grade, not summaries.
The established pattern (see the 構想ブラッシュアップ note) is to state assumptions
explicitly, check the arithmetic of any plan being discussed, name what is missing from
the source material, and flag where a claim needs professional verification (e.g. travel
business licensing under 旅行業法 must be confirmed with a 行政書士/運輸局 rather than
asserted).
