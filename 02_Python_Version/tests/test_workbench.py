import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app import create_app
from src.ingestion.chunker import _split
from src.ingestion.loader import _frontmatter
from src.llm.providers import ModelClient, ProviderError, validate_config
from src.workbench.web_search import SearchHTML, search_web


def config(protocol="openai", **kwargs):
    return {"provider": "custom", "protocol": protocol, "base_url": "https://example.invalid/v1", "model": "test-model", "api_key": "mock-key-not-a-secret", "enabled": True, **kwargs}


class ProtocolTests(unittest.TestCase):
    def test_openai_tool_roundtrip(self):
        client = ModelClient(config())
        state = client.start("system", [{"role": "user", "content": "question"}])
        raw = {"role": "assistant", "content": None, "tool_calls": [{"id": "a", "type": "function", "function": {"name": "search", "arguments": '{"query":"hi"}'}}]}
        with patch("src.llm.providers.post_json", return_value={"choices": [{"message": raw}]}) as http:
            turn = client.complete(state, [])
        self.assertEqual(turn.calls[0]["arguments"], {"query": "hi"})
        client.observe(state, turn, [{"ok": True}])
        self.assertEqual(state["messages"][-1]["tool_call_id"], "a")
        self.assertTrue(http.call_args.args[0].endswith("/chat/completions"))

    def test_responses_preserves_output_items(self):
        client = ModelClient(config("responses"))
        state = client.start("system", [{"role": "user", "content": "q"}])
        raw = [{"type": "reasoning", "id": "r", "summary": []}, {"type": "function_call", "call_id": "a", "name": "search", "arguments": "{}"}]
        with patch("src.llm.providers.post_json", return_value={"output": raw}):
            turn = client.complete(state, [])
        client.observe(state, turn, [{"ok": True}])
        self.assertEqual(state["messages"][1:3], raw)
        self.assertEqual(state["messages"][-1]["type"], "function_call_output")

    def test_anthropic_tool_roundtrip(self):
        client = ModelClient(config("anthropic"))
        state = client.start("system", [{"role": "user", "content": "q"}])
        raw = [{"type": "tool_use", "id": "a", "name": "search", "input": {"query": "q"}}]
        with patch("src.llm.providers.post_json", return_value={"content": raw}) as http:
            turn = client.complete(state, [])
        client.observe(state, turn, [{"ok": True}])
        self.assertEqual(state["messages"][-1]["content"][0]["tool_use_id"], "a")
        self.assertIn("x-api-key", http.call_args.args[2])

    def test_gemini_preserves_signatures_and_call_ids(self):
        client = ModelClient(config("gemini"))
        state = client.start("system", [{"role": "user", "content": "q"}])
        raw = {"role": "model", "parts": [{"thoughtSignature": "opaque", "functionCall": {"id": "a", "name": "search", "args": {"query": "q"}}}]}
        with patch("src.llm.providers.post_json", return_value={"candidates": [{"content": raw}]}):
            turn = client.complete(state, [])
        client.observe(state, turn, [{"ok": True}])
        self.assertEqual(state["messages"][-2], raw)
        self.assertEqual(state["messages"][-1]["parts"][0]["functionResponse"]["id"], "a")

    def test_config_rejects_insecure_remote_and_embedded_credentials(self):
        for url in ("http://example.com", "https://a:secret@example.com", "https://example.com?key=secret", "file:///tmp/key"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                validate_config(config(base_url=url))
        self.assertEqual(validate_config(config(base_url="http://127.0.0.1:11434/v1"))["protocol"], "openai")

    def test_malformed_arguments_are_not_executed(self):
        self.assertIsNone(ModelClient.arguments("not-json"))

    def test_search_parser_decodes_redirect_and_keeps_snippet(self):
        parser = SearchHTML()
        parser.feed('<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.org">A <b>title</b></a><a class="result__snippet">A <b>useful</b> snippet</a>')
        self.assertEqual(parser.items[0], {"title": "A title", "text": "A useful snippet", "url": "https://example.org"})

    def test_tavily_sources_have_access_date_and_no_javascript(self):
        with patch("src.workbench.web_search.post_json", return_value={"results": [{"title": "one", "url": "https://example.org", "content": "test"}, {"url": "javascript:alert(1)"}]}):
            results = search_web("public query", "test-key")
        self.assertEqual(len(results), 1)
        self.assertIn("retrieved_at", results[0])

    def test_long_chunks_and_unclosed_frontmatter(self):
        self.assertLessEqual(max(map(len, _split("字" * 5000, 260, 40))), 260)
        self.assertEqual(_frontmatter("---\nunclosed")[1], "---\nunclosed")


class WorkbenchTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.app = create_app({"TESTING": True, "WORKBENCH_DB": root / "workbench.db", "TOOLS_DB": root / "tools.db"})
        self.client = self.app.test_client()
        self.other = self.app.test_client()
        self.workbench = self.app.extensions["workbench"]
        self.identity = self.client.post("/api/conversations", json={}).json["id"]

    def tearDown(self):
        self.tmp.cleanup()

    def chat(self, question, **extra):
        return self.client.post("/api/chat", json={"question": question, "session_id": self.identity, **extra})

    def test_history_persists_and_is_owner_scoped(self):
        self.assertEqual(self.chat("图书馆几点开放？").status_code, 200)
        messages = self.client.get("/api/conversations/" + self.identity).json["messages"]
        self.assertEqual(len(messages), 2)
        self.assertEqual(self.other.get("/api/conversations/" + self.identity).status_code, 404)
        self.assertEqual(self.other.delete("/api/conversations/" + self.identity, json={}).status_code, 404)
        self.assertEqual(self.other.get("/api/conversations").json["items"], [])

    def test_history_rename_delete(self):
        url = "/api/conversations/" + self.identity
        self.assertEqual(self.client.patch(url, json={"title": "图书馆"}).status_code, 200)
        self.assertEqual(self.client.get("/api/conversations").json["items"][0]["title"], "图书馆")
        self.assertEqual(self.client.delete(url, json={}).status_code, 200)
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_status_slot_filling_across_turns(self):
        self.chat("查询申请进度")
        self.chat("S1001")
        response = self.chat("AP2026001").json
        self.assertEqual(response["tool_name"], "query_application_status")
        self.assertTrue(response["tool_result"]["ok"])

    def test_keys_redacted_not_persisted_and_cleared_on_host_change(self):
        c = config()
        self.client.post("/api/settings", json=c)
        public = self.client.get("/api/settings").json
        self.assertTrue(public["has_api_key"])
        self.assertNotIn(c["api_key"], json.dumps(public))
        self.assertNotIn(c["api_key"].encode(), self.workbench.store.path.read_bytes())
        public = self.client.post("/api/settings", json={**c, "api_key": "", "base_url": "https://other.invalid/v1"}).json
        self.assertFalse(public["has_api_key"])

    def test_uploaded_knowledge_is_private_searchable_and_deletable(self):
        response = self.client.post("/api/knowledge/upload", data={"file": (io.BytesIO("# 星光活动\n星光读书会每周六下午三点在青松楼举行。".encode()), "reading.md")}, headers={"X-Campus-Request": "1"})
        self.assertEqual(response.status_code, 200)
        identity = response.json["id"]
        self.assertTrue(any(v["id"] == identity for v in self.client.get("/api/knowledge").json["items"]))
        self.assertFalse(any(v["id"] == identity for v in self.other.get("/api/knowledge").json["items"]))
        self.assertIn("青松楼", self.chat("星光读书会在哪里举行？").json["answer"])
        self.assertEqual(self.other.delete("/api/knowledge/" + identity, json={}).status_code, 404)
        self.assertEqual(self.client.delete("/api/knowledge/" + identity, json={}).status_code, 200)

    def test_upload_invalid_extension_encoding_and_empty(self):
        for name, body in [("x.html", b"test"), ("x.md", b"\xff"), ("x.txt", b" "), ("x.txt", b"a"*500001)]:
            with self.subTest(name=name, size=len(body)):
                r = self.client.post("/api/knowledge/upload", data={"file": (io.BytesIO(body), name)}, headers={"X-Campus-Request": "1"})
                self.assertEqual(r.status_code, 400)

    def test_csrf_and_dns_rebinding_protection(self):
        self.assertEqual(self.client.post("/api/settings", json=config(), headers={"Origin": "https://evil.invalid"}).status_code, 403)
        self.assertEqual(self.client.get("/api/settings", headers={"Host": "evil.invalid"}).status_code, 403)
        self.assertEqual(self.client.post("/api/chat", data="question=hello").status_code, 415)

    def test_sse_returns_status_and_final(self):
        response = self.client.post("/api/chat", json={"question": "图书馆几点开放？", "session_id": self.identity}, headers={"Accept": "text/event-stream"})
        events = [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]
        self.assertEqual(events[0]["event"], "status")
        self.assertEqual(events[-1]["event"], "done")

    def test_model_react_tool_observation_answer(self):
        self.client.post("/api/settings", json=config())
        tool = {"choices": [{"message": {"role": "assistant", "content": None, "tool_calls": [{"id": "c1", "type": "function", "function": {"name": "search_knowledge", "arguments": '{"query":"图书馆开放时间"}'}}]}}]}
        answer = {"choices": [{"message": {"role": "assistant", "content": "请参考开放时间 [D01]。"}}]}
        with patch("src.llm.providers.post_json", side_effect=[tool, answer]) as http:
            response = self.chat("图书馆几点开门？")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(http.call_count, 2)
        self.assertEqual(response.json["trace"][0]["tool"], "search_knowledge")
        self.assertTrue(response.json["retrieval"])

    def test_model_cannot_create_unrequested_handoff(self):
        with self.client.session_transaction() as s:
            owner = s["owner"]
        result = self.workbench.execute("handoff_to_human", {"reason": "模型建议"}, self.workbench.tools.schemas, None, False, {}, "你好", [])
        self.assertFalse(result["ok"])

    def test_negated_handoff_does_not_create_ticket(self):
        response = self.chat("暂时不需要转人工客服").json
        self.assertEqual(response["route"], "request_clarification")
        self.assertNotIn("HF-", response["answer"])
        result = self.workbench.execute("handoff_to_human", {"reason": "模型建议"}, self.workbench.tools.schemas, None, False, {}, "不要转人工", [])
        self.assertFalse(result["ok"])

    def test_model_loop_is_bounded(self):
        self.client.post("/api/settings", json=config())
        raw = {"choices": [{"message": {"role": "assistant", "content": None, "tool_calls": [{"id": "c", "type": "function", "function": {"name": "search_knowledge", "arguments": '{"query":"图书馆"}'}}]}}]}
        with patch("src.llm.providers.post_json", return_value=raw) as http:
            result = self.chat("图书馆")
        self.assertEqual(http.call_count, 6)
        self.assertIn("6 轮", result.json["error"])

    def test_cancel_stops_before_api_call_and_releases_lock(self):
        with self.client.session_transaction() as s:
            owner = s["owner"]
        self.workbench.set_config(owner, config())
        stream = self.workbench.run(owner, self.identity, "问题")
        self.assertEqual(next(stream)["event"], "status")
        self.assertTrue(self.workbench.cancel(owner, self.identity))
        with patch("src.llm.providers.post_json") as http:
            rest = list(stream)
        http.assert_not_called()
        self.assertTrue(rest[-1]["cancelled"])
        self.assertEqual(self.workbench.active, {})

    def test_web_failure_is_explicit_not_invented_answer(self):
        with patch("src.workbench.service.search_web", side_effect=ProviderError("搜索暂时不可用")):
            response = self.chat("最新消息", web=True)
        self.assertEqual(response.status_code, 400)
        self.assertIn("不可用", response.json["error"])

    def test_json_shape_and_oversize_question_rejected(self):
        self.assertEqual(self.client.post("/api/chat", json=[]).status_code, 400)
        self.assertEqual(self.chat("a" * 4001).status_code, 400)


if __name__ == "__main__":
    unittest.main()
