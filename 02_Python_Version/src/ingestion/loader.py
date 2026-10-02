"""TXT 与 Markdown 知识文档加载器。"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Document:
    document_id: str
    title: str
    topic: str
    text: str
    source_path: str
    source_note: str


def _frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) != 3:
        return {}, text
    _, raw_meta, body = parts
    metadata: dict[str, str] = {}
    for line in raw_meta.strip().splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            metadata[key.strip()] = value.strip().strip('"')
    return metadata, body.strip()


def load_documents(directory: Path) -> list[Document]:
    documents: list[Document] = []
    errors: list[str] = []
    for path in sorted(directory.iterdir() if directory.exists() else []):
        if path.suffix.lower() not in {".md", ".txt"}:
            continue
        try:
            raw = path.read_text(encoding="utf-8").strip()
        except (OSError, UnicodeDecodeError) as exc:
            errors.append(f"{path.name}: {exc}")
            continue
        if not raw:
            errors.append(f"{path.name}: 空文件")
            continue
        metadata, body = _frontmatter(raw)
        heading = next(
            (re.sub(r"^#+\s*", "", line).strip() for line in body.splitlines() if line.startswith("#")),
            path.stem,
        )
        documents.append(
            Document(
                document_id=metadata.get("id", path.stem.split("_")[0]).upper(),
                title=metadata.get("title", heading),
                topic=metadata.get("topic", "未分类"),
                text=body,
                source_path=path.name,
                source_note=metadata.get("source", "课程实验自构模拟资料"),
            )
        )
    if errors:
        (directory.parent / "logs").mkdir(parents=True, exist_ok=True)
        (directory.parent / "logs" / "loader_errors.log").write_text("\n".join(errors), encoding="utf-8")
    return documents


def document_statistics(documents: list[Document]) -> dict[str, object]:
    return {
        "document_count": len(documents),
        "topics": sorted({document.topic for document in documents}),
        "topic_count": len({document.topic for document in documents}),
        "total_characters": sum(len(document.text) for document in documents),
    }
