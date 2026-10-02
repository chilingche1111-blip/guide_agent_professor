from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app import build_generator, create_app
from src.llm.client import DeterministicGroundedClient, OpenAICompatibleClient


class AppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app = create_app()
        app.config.update(TESTING=True)
        cls.client = app.test_client()

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["ok"])
        self.assertEqual(response.get_json()["model"], "deterministic-grounded-v1")

    def test_build_generator_supports_offline_and_api_modes(self):
        offline = SimpleNamespace(llm_mode="offline")
        with patch("app.settings", offline):
            self.assertIsInstance(build_generator(), DeterministicGroundedClient)
        api = SimpleNamespace(
            llm_mode="api",
            llm_base_url="https://example.invalid/v1",
            llm_api_key="test-key",
            llm_model="test-model",
            llm_timeout_seconds=10,
        )
        with patch("app.settings", api):
            self.assertIsInstance(build_generator(), OpenAICompatibleClient)

    def test_chat_rejects_empty_with_clarification(self):
        response = self.client.post("/api/chat", json={"question": "", "session_id": "test"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["route"], "request_clarification")

    def test_index_has_accessible_form(self):
        response = self.client.get("/")
        try:
            body = response.get_data(as_text=True)
            self.assertIn('for="assistant-question"', body)
            self.assertIn('aria-live="polite"', body)
            self.assertIn('/static/workbench.html', body)
            self.assertIn('id="places"', body)
        finally:
            response.close()

    def test_workbench_keeps_accessible_form(self):
        response = self.client.get("/static/workbench.html")
        try:
            body = response.get_data(as_text=True)
            self.assertIn('label for="message-input"', body)
            self.assertIn('aria-live="polite"', body)
        finally:
            response.close()


if __name__ == "__main__":
    unittest.main()
