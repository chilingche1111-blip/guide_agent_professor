"""Flask 演示应用。"""

from __future__ import annotations

import json
import os
import secrets
from pathlib import Path
from urllib.parse import urlsplit

from flask import Flask, Response, jsonify, request, send_from_directory, session, stream_with_context

from src.agent.agent import CampusServiceAgent
from src.config import settings
from src.ingestion.chunker import chunk_documents
from src.ingestion.loader import load_documents
from src.llm.client import DeterministicGroundedClient, GroundedGenerator, OpenAICompatibleClient
from src.memory.conversation import ConversationMemory
from src.rag.pipeline import RAGPipeline
from src.retrieval.embedder import HashingEmbedder
from src.retrieval.retriever import HybridRetriever
from src.tools.registry import build_default_registry
from src.workbench.service import Workbench
from src.workbench.knowledge import SCOPES, validate_scope, conversation_scope
from src.llm.providers import ModelClient, ProviderError


def build_generator() -> GroundedGenerator:
    if settings.llm_mode == "offline":
        return DeterministicGroundedClient()
    if settings.llm_mode == "api":
        return OpenAICompatibleClient(
            settings.llm_base_url,
            settings.llm_api_key,
            settings.llm_model,
            settings.llm_timeout_seconds,
        )
    raise ValueError("LLM_MODE 仅支持 offline 或 api。")


def build_agent() -> CampusServiceAgent:
    documents = load_documents(settings.docs_dir)
    chunks = chunk_documents(documents, settings.chunk_size, settings.chunk_overlap)
    embedder = HashingEmbedder(settings.embedding_dimension)
    retriever = HybridRetriever(chunks, embedder)
    rag = RAGPipeline(
        retriever,
        build_generator(),
        top_k=settings.top_k,
        threshold=settings.similarity_threshold,
    )
    tools = build_default_registry(settings.database_path)
    memory = ConversationMemory(settings.memory_turns)
    return CampusServiceAgent(rag, tools, memory, settings.max_agent_steps)


def create_app(test_config=None) -> Flask:
    app = Flask(__name__, static_folder="static")
    app.config.update(MAX_CONTENT_LENGTH=1024 * 1024, SESSION_COOKIE_HTTPONLY=True,
                      SESSION_COOKIE_SAMESITE="Strict", WORKBENCH_DB=settings.project_root / "data" / "workbench.db")
    if test_config:
        app.config.update(test_config)
    workbench = Workbench(app.config["WORKBENCH_DB"], app.config.get("TOOLS_DB"))
    server_config = workbench.store.config("__server__")
    if not server_config:
        server_config = {"session_secret": secrets.token_hex(32)}
        workbench.store.config("__server__", server_config)
    app.secret_key = os.getenv("CAMPUS_SESSION_SECRET") or server_config["session_secret"]
    app.extensions["workbench"] = workbench

    @app.before_request
    def protect_local_app():
        if request.host.split(":")[0] not in {"127.0.0.1", "localhost"}:
            return jsonify(error="本应用仅允许本机访问。"), 403
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            origin = request.headers.get("Origin")
            if request.headers.get("Sec-Fetch-Site") == "cross-site" or (origin and urlsplit(origin).netloc != request.host):
                return jsonify(error="拒绝跨站请求。"), 403
            if request.path != "/api/knowledge/upload" and not request.is_json:
                return jsonify(error="请使用 JSON 请求。"), 415
        if "owner" not in session:
            session["owner"] = secrets.token_hex(24)
            session.permanent = True

    @app.after_request
    def security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.errorhandler(ValueError)
    @app.errorhandler(ProviderError)
    def invalid(error):
        return jsonify(error=str(error)), 400

    @app.errorhandler(LookupError)
    def missing(error):
        return jsonify(error=str(error)), 404

    @app.errorhandler(413)
    def too_large(error):
        return jsonify(error="上传大小不能超过 1 MB。"), 413

    def payload():
        value = request.get_json(silent=True)
        if not isinstance(value, dict):
            raise ValueError("请求必须是 JSON 对象。")
        return value

    @app.get("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.get("/api/health")
    def health():
        c = workbench.config(session["owner"])
        return jsonify({"ok": True, "mode": "api" if c["enabled"] else "offline", "model": c["model"] if c["enabled"] else "deterministic-grounded-v1", "version": "2.0", "documents": len(workbench.documents(session["owner"]))})

    @app.post("/api/chat")
    def chat():
        data = payload()
        question = data.get("question", "")
        if not isinstance(question, str) or len(question) > 4000:
            raise ValueError("问题需要是最多 4000 字符的文本。")
        if not question.strip():
            return jsonify(answer="请输入需要咨询的问题。", route="request_clarification")
        owner = session["owner"]
        identity = data.get("session_id") or workbench.store.create(owner)
        if not isinstance(identity, str) or len(identity) > 80:
            raise ValueError("会话 ID 格式无效。")
        history = workbench.store.messages(owner, identity)
        scope = validate_scope(data.get("knowledge_scope", "simulation"))
        if conversation_scope(history) not in (None, scope):
            raise ValueError("切换资料范围需要开启新对话，已有会话仍保留在历史记录中。")
        events = workbench.run(owner, identity, question.strip(), data.get("web") is True, scope)
        if "text/event-stream" in request.headers.get("Accept", ""):
            @stream_with_context
            def stream():
                try:
                    for event in events:
                        yield "data: " + json.dumps(event, ensure_ascii=False) + "\n\n"
                except Exception:
                    app.logger.exception("Agent request failed")
                    yield 'data: {"event":"error","message":"处理失败，请重试；详细信息已记录在服务端。"}\n\n'
                finally:
                    events.close()
            return Response(stream(), mimetype="text/event-stream", headers={"X-Accel-Buffering": "no"})
        for event in events:
            if event["event"] == "done":
                return jsonify(event["data"])
            if event["event"] == "error":
                return jsonify(error=event["message"]), 400
        return jsonify(error="未收到结果。"), 500

    @app.post("/api/reset")
    def reset():
        data = payload()
        identity = data.get("session_id")
        if identity:
            workbench.store.change(session["owner"], identity)
        return jsonify(ok=True)

    @app.get("/api/conversations")
    def conversations():
        return jsonify(items=workbench.store.conversations(session["owner"]))

    @app.post("/api/conversations")
    def new_conversation():
        payload()
        return jsonify(id=workbench.store.create(session["owner"]))

    @app.route("/api/conversations/<identity>", methods=["GET", "PATCH", "DELETE"])
    def conversation(identity):
        owner = session["owner"]
        if request.method == "GET":
            return jsonify(messages=workbench.store.messages(owner, identity))
        data = payload()
        if (owner, identity) in workbench.active:
            raise ValueError("请先停止当前回答，再修改会话。")
        title = data.get("title") if request.method == "PATCH" else None
        if request.method == "PATCH" and (not isinstance(title, str) or not title.strip()):
            raise ValueError("标题不能为空。")
        workbench.store.change(owner, identity, title)
        return jsonify(ok=True)

    @app.post("/api/cancel")
    def cancel():
        return jsonify(ok=workbench.cancel(session["owner"], payload().get("session_id")))

    @app.route("/api/settings", methods=["GET", "POST"])
    def model_settings():
        if request.method == "POST":
            return jsonify(workbench.set_config(session["owner"], payload()))
        return jsonify(workbench.public_config(session["owner"]))

    @app.post("/api/settings/test")
    def test_connection():
        payload()
        c = workbench.config(session["owner"])
        client = ModelClient(c)
        turn = client.complete(client.start("Reply briefly.", [{"role": "user", "content": "Reply OK."}]), [])
        if not turn.text:
            raise ProviderError("接口已响应，但没有可用文本。")
        return jsonify(ok=True, message="连接成功；实际工具调用能力需通过对话检验。", model=c["model"])

    @app.get("/api/knowledge")
    def knowledge():
        owner = session["owner"]
        scope = validate_scope(request.args.get("scope", "simulation"))
        query = request.args.get("q", "").strip()[:200]
        items = [workbench.public_knowledge.enrich({"id": d.document_id, "title": d.title, "topic": d.topic, "text": d.text, "note": d.source_note, "uploaded": d.document_id.startswith("U"), "characters": len(d.text)}, scope) for d in workbench.documents(owner, scope) if not query or query.lower() in (d.title + d.text + d.topic).lower()]
        return jsonify(items=items, scope=scope, scopes=SCOPES)

    @app.post("/api/knowledge/upload")
    def upload():
        if request.headers.get("X-Campus-Request") != "1":
            return jsonify(error="缺少同源上传标记。"), 403
        file = request.files.get("file")
        if not file or Path(file.filename or "").suffix.lower() not in {".txt", ".md"}:
            raise ValueError("仅支持 UTF-8 编码的 .txt 或 .md 文档。")
        try:
            body = file.read(500_001).decode("utf-8-sig")
        except UnicodeError:
            raise ValueError("文件不是 UTF-8 文本，请转换编码后上传。") from None
        if not body.strip() or len(body.encode("utf-8")) > 500_000 or "\x00" in body:
            raise ValueError("文档应为非空纯文本，大小不超过 500 KB。")
        identity = workbench.store.upload(session["owner"], Path(file.filename).name, body)
        return jsonify(ok=True, id=identity)

    @app.delete("/api/knowledge/<identity>")
    def delete_document(identity):
        payload()
        workbench.store.delete_upload(session["owner"], identity)
        return jsonify(ok=True)

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=7860, debug=False)
