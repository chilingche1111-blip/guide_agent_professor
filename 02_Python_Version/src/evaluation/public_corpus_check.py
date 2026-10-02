"""Independent public-source retrieval baseline. Does not alter frozen V1 data."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from src.ingestion.loader import load_documents, document_statistics, _frontmatter
from src.ingestion.chunker import chunk_documents
from src.retrieval.embedder import HashingEmbedder
from src.retrieval.retriever import HybridRetriever


def main():
    root = Path(__file__).resolve().parents[2]
    corpus = root / "data/public_corpus/sjtu_2026_10"
    documents = load_documents(corpus / "docs")
    assert len(documents) >= 10
    assert len({d.topic for d in documents}) >= 2
    manifest = []
    for path in sorted((corpus / "docs").glob("*.md")):
        meta, body = _frontmatter(path.read_text(encoding="utf-8"))
        assert all(meta.get(key) for key in ("id", "school", "url", "source_date", "retrieved_at", "content_type"))
        assert urlparse(meta["url"]).hostname.endswith(".sjtu.edu.cn")
        manifest.append({**meta, "file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    assert len({m["url"] for m in manifest}) == len(documents)
    questions_path = corpus / "questions.json"
    questions = json.loads(questions_path.read_text(encoding="utf-8"))
    chunks = chunk_documents(documents, 280, 40)
    retriever = HybridRetriever(chunks, HashingEmbedder(512))
    rows = []
    for q in questions:
        results = retriever.search(q["question"], 5)
        sources = [r.chunk.document_id for r in results]
        rows.append({**q, "hits": {str(k): q["expected_source"] in sources[:k] for k in (1, 3, 5)}, "retrieval": [r.to_dict() for r in results]})
    metrics = {}
    for group in ("all", "direct", "paraphrase"):
        subset = [r for r in rows if group == "all" or r["kind"] == group]
        metrics[group] = {f"recall@{k}": round(sum(r["hits"][str(k)] for r in subset) / len(subset), 4) for k in (1, 3, 5)}
    output = root.parent / "04_Evaluation/public_corpus_v1"
    output.mkdir(parents=True, exist_ok=True)
    report = {
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "scope": "10 official-page paraphrased summaries; 20 self-authored retrieval probes, not independent human labels or live LLM/semantic-embedding evaluation. No V1 replacement.",
        "statistics": document_statistics(documents), "chunk_count": len(chunks),
        "config": {"embedder": "HashingEmbedder", "dimensions": 512, "chunk_size": 280, "overlap": 40, "semantic_weight": .62},
        "dataset_sha256": hashlib.sha256(questions_path.read_bytes()).hexdigest(),
        "sources": manifest, "metrics": metrics, "rows": rows,
        "top1_failures": [r["id"] for r in rows if not r["hits"]["1"]],
        "semantic_comparison": "not_run",
    }
    # New dataset evidence is versioned separately from all frozen course results.
    destination = output / "hashing_baseline.json"
    if destination.exists():
        destination = output / ("hashing_" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f") + ".json")
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(destination), "documents": len(documents), "chunks": len(chunks), "metrics": metrics, "top1_failures": report["top1_failures"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
