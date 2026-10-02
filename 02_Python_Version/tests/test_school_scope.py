"""School facts, source provenance, and historical simulation isolation."""
import io
import tempfile
import unittest
from pathlib import Path
from urllib.parse import urlparse

from app import create_app


class SchoolScopeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.app = create_app({"TESTING": True, "WORKBENCH_DB": root / "workbench.db", "TOOLS_DB": root / "tools.db"})
        self.client = self.app.test_client()

    def tearDown(self):
        self.tmp.cleanup()

    def test_official_documents_are_chd_with_source_metadata(self):
        data = self.client.get("/api/knowledge?scope=chd_public").json
        self.assertEqual(len(data["items"]), 6)
        for doc in data["items"]:
            self.assertEqual(doc["school"], "长安大学")
            self.assertTrue(urlparse(doc["url"]).hostname.endswith(".chd.edu.cn"))
            self.assertTrue(doc["id"].startswith("DCHD"))
            self.assertEqual(doc["source_type"], "official_summary")
            self.assertTrue(doc["retrieved_at"] and doc["source_date"])

    def test_simulation_and_uploads_never_enter_official_scope(self):
        response = self.client.post("/api/knowledge/upload", data={"file": (io.BytesIO("# 自定义\n非学校官方政策".encode()), "test.md")}, headers={"X-Campus-Request": "1"})
        self.assertEqual(response.status_code, 200)
        public = self.client.get("/api/knowledge?scope=chd_public").json["items"]
        simulation = self.client.get("/api/knowledge").json["items"]
        self.assertEqual(len(simulation), 13)
        self.assertFalse(set(d["id"] for d in public) & set(d["id"] for d in simulation))

    def test_official_answer_carries_url_and_school(self):
        result = self.client.post("/api/chat", json={"question": "长安大学VPN系统如何访问校内资源？", "knowledge_scope": "chd_public"}).json
        self.assertEqual(result["knowledge_scope"], "chd_public")
        self.assertTrue(result["citations"])
        self.assertIn("长安大学", result["answer"])
        for source in result["citations"]:
            self.assertEqual(source["school"], "长安大学")
            self.assertIn("chd.edu.cn", source["url"])

    def test_scope_switch_rejected_before_sse_and_history_unchanged(self):
        first = self.client.post("/api/chat", json={"question": "校园卡丢了怎么办？", "knowledge_scope": "chd_public"}).json
        identity = first["session_id"]
        response = self.client.post("/api/chat", json={"question": "继续", "session_id": identity, "knowledge_scope": "simulation"}, headers={"Accept": "text/event-stream"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(self.client.get("/api/conversations/" + identity).json["messages"]), 2)

    def test_old_conversation_remains_simulation(self):
        first = self.client.post("/api/chat", json={"question": "图书馆几点开门？"}).json
        response = self.client.post("/api/chat", json={"question": "继续", "session_id": first["session_id"], "knowledge_scope": "chd_public"})
        self.assertEqual(response.status_code, 400)

    def test_invalid_scope_rejected(self):
        for scope in ("sjtu_public", "unknown", [], None):
            self.assertEqual(self.client.post("/api/chat", json={"question": "你好", "knowledge_scope": scope}).status_code, 400)


if __name__ == "__main__":
    unittest.main()
