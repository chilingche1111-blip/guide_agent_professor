"""Explicit source boundaries; public summaries never mix with simulation policies."""
from src.config import settings
from src.ingestion.loader import load_documents, _frontmatter

SCOPES = {
    "simulation": {"label": "模拟校园 + 我的上传", "notice": "课程模拟规则；上传资料未经权威核验。"},
    "chd_public": {"label": "长安大学 · 官方资料", "notice": "长安大学官方网页释义摘要，整理于2026-10-01；不保证实时有效，请核对原文。课程项目非校方官方服务，业务查询与工单仍为教学模拟。"},
}


def validate_scope(scope):
    if not isinstance(scope, str) or scope not in SCOPES:
        raise ValueError("无效资料范围，请选择长安大学官方资料或模拟校园。")
    return scope


class PublicKnowledge:
    def __init__(self):
        directory = settings.project_root / "data/public_corpus/chd_2026_10/docs"
        self.documents = load_documents(directory)
        self.metadata = {}
        for path in directory.glob("*.md"):
            meta, _ = _frontmatter(path.read_text(encoding="utf-8"))
            self.metadata[meta["id"]] = {key: meta.get(key) for key in ("url", "school", "source_date", "retrieved_at", "content_type")}

    def enrich(self, record, scope):
        if scope == "chd_public":
            return {**record, **self.metadata.get(record.get("source_id", record.get("id")), {}), "knowledge_scope": scope, "source_type": "official_summary"}
        return {**record, "knowledge_scope": scope}


def conversation_scope(history):
    return next((m["data"].get("knowledge_scope", "simulation") for m in history if m["role"] == "assistant"), None)
