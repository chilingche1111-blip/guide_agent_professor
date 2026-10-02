"""V2 acceptance evidence. Never overwrites the frozen V1 experiment files."""
import argparse
import io
import json
import platform
import time
import unittest
from datetime import datetime, timezone
from pathlib import Path

from src.evaluation.runner import build_system, load_dataset, run_cases, retrieval_evaluation, answer_metrics, agent_metrics, FINAL
from src.workbench.web_search import search_web
from src.llm.providers import ProviderError


class RecordingResult(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.passed_names = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.passed_names.append(test.id())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live-web", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    output = root.parent / "04_Evaluation" / "v2"
    output.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    suite = unittest.defaultTestLoader.discover(str(root / "tests"))
    log = io.StringIO()
    started = time.perf_counter()
    result = unittest.TextTestRunner(stream=log, verbosity=2, resultclass=RecordingResult).run(suite)
    summary = {"executed_at": timestamp, "python": platform.python_version(), "tests_run": result.testsRun,
               "passed": len(result.passed_names), "failed": len(result.failures), "errors": len(result.errors),
               "elapsed_seconds": round(time.perf_counter() - started, 3), "passed_tests": result.passed_names,
               "scope": "Original baseline plus V2 backend and mocked provider protocols. No live LLM.",
               "failures": [{"test": str(t), "traceback": trace} for t, trace in result.failures + result.errors]}
    (output / "unit_tests.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    agent, retriever, stats = build_system(FINAL)
    cases = load_dataset()
    rows = run_cases(agent, cases, "v2_regression")
    regression = {"executed_at": timestamp, "scope": "V1 frozen 20-question set on current deterministic core; not model-quality evaluation", "statistics": stats,
                  "retrieval": retrieval_evaluation(retriever, cases), "answer": answer_metrics(rows), "agent": agent_metrics(rows), "rows": rows}
    (output / "baseline_regression.json").write_text(json.dumps(regression, ensure_ascii=False, indent=2), encoding="utf-8")
    live_ok = True
    if args.live_web:
        query = "Python official documentation"
        started = time.perf_counter()
        try:
            sources = search_web(query)
            live = {"ok": True, "sources": sources, "note": "Public search snippets only, no external LLM used. Search relevance is not comprehensively evaluated."}
        except (ProviderError, ValueError) as exc:
            live_ok = False
            live = {"ok": False, "error": str(exc)}
        live.update({"executed_at": timestamp, "query": query, "elapsed_seconds": round(time.perf_counter() - started, 3)})
        (output / "live_web_smoke.json").write_text(json.dumps(live, ensure_ascii=False, indent=2), encoding="utf-8")
    print(log.getvalue())
    print(json.dumps({"tests": result.testsRun, "passed": len(result.passed_names), "output": str(output), "live_web_requested": args.live_web, "live_web_ok": live_ok if args.live_web else None}, ensure_ascii=False))
    raise SystemExit(0 if result.wasSuccessful() and live_ok else 1)


if __name__ == "__main__":
    main()
