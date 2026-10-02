"""按 Markdown 章节和句子边界分块。"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .loader import Document


@dataclass(frozen=True)
class Chunk:
    chunk_id: str
    document_id: str
    title: str
    topic: str
    section: str
    text: str
    source_path: str


def _sections(text: str) -> list[tuple[str, str]]:
    result: list[tuple[str, str]] = []
    heading = "概述"
    buffer: list[str] = []
    for raw_line in text.replace("\r\n", "\n").splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if not line:
            continue
        if line.startswith("#"):
            if buffer:
                result.append((heading, "\n".join(buffer)))
            heading = line.lstrip("# ").strip()
            buffer = []
        else:
            buffer.append(line)
    if buffer:
        result.append((heading, "\n".join(buffer)))
    return result


def _split(text: str, chunk_size: int, overlap: int) -> list[str]:
    if chunk_size <= 0 or overlap < 0 or overlap >= chunk_size:
        raise ValueError("chunk_size 必须大于 0，overlap 必须在 [0, chunk_size) 内。")
    if len(text) <= chunk_size:
        return [text]
    units = [u.strip() for u in re.split(r"(?<=[。！？；\n])", text) if u.strip()]
    output: list[str] = []
    current = ""
    for unit in units:
        if current and len(current) + len(unit) > chunk_size:
            output.append(current.strip())
            current = (current[-overlap:] if overlap else "") + unit
        else:
            current += unit
        # Long unpunctuated uploads must not create an unbounded context chunk.
        while len(current) > chunk_size:
            output.append(current[:chunk_size].strip())
            current = current[chunk_size - overlap:]
    if current.strip():
        output.append(current.strip())
    return output


def chunk_documents(documents: list[Document], chunk_size: int, overlap: int) -> list[Chunk]:
    chunks: list[Chunk] = []
    for document in documents:
        sequence = 1
        for section, body in _sections(document.text):
            for part in _split(body, chunk_size, overlap):
                chunks.append(
                    Chunk(
                        chunk_id=f"{document.document_id}-C{sequence:02d}",
                        document_id=document.document_id,
                        title=document.title,
                        topic=document.topic,
                        section=section,
                        text=part,
                        source_path=document.source_path,
                    )
                )
                sequence += 1
    return chunks


def chunk_statistics(chunks: list[Chunk]) -> dict[str, float | int]:
    lengths = [len(chunk.text) for chunk in chunks]
    return {
        "chunk_count": len(chunks),
        "average_length": round(sum(lengths) / max(1, len(lengths)), 2),
        "minimum_length": min(lengths, default=0),
        "maximum_length": max(lengths, default=0),
    }
