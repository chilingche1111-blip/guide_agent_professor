"""Persistent, browser-owner-scoped histories and uploaded knowledge."""
import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Store:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS conversations (
                  id TEXT PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL, updated TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS messages (
                  seq INTEGER PRIMARY KEY, conversation TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                  role TEXT NOT NULL, content TEXT NOT NULL, data TEXT NOT NULL, created TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS uploads (
                  id TEXT PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS settings (owner TEXT PRIMARY KEY, data TEXT NOT NULL);
                CREATE INDEX IF NOT EXISTS history_owner ON conversations(owner, updated);
                CREATE INDEX IF NOT EXISTS message_conversation ON messages(conversation, seq);
            """)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def conversations(self, owner):
        with self.connect() as db:
            return [dict(r) for r in db.execute("SELECT id,title,updated FROM conversations WHERE owner=? ORDER BY updated DESC LIMIT 100", (owner,))]

    def create(self, owner, title="新的对话"):
        identity = uuid.uuid4().hex
        with self.connect() as db:
            db.execute("INSERT INTO conversations VALUES (?,?,?,?)", (identity, owner, title[:60], now()))
        return identity

    def owned(self, db, owner, identity):
        if not db.execute("SELECT 1 FROM conversations WHERE id=? AND owner=?", (identity, owner)).fetchone():
            raise LookupError("会话不存在。")

    def messages(self, owner, identity):
        with self.connect() as db:
            self.owned(db, owner, identity)
            return [{**dict(r), "data": json.loads(r["data"])} for r in db.execute("SELECT role,content,data,created FROM messages WHERE conversation=? ORDER BY seq", (identity,))]

    def save_turn(self, owner, identity, question, response):
        with self.connect() as db:
            self.owned(db, owner, identity)
            if not db.execute("SELECT 1 FROM messages WHERE conversation=?", (identity,)).fetchone():
                db.execute("UPDATE conversations SET title=? WHERE id=?", (question[:40], identity))
            for role, content, data in [("user", question, {}), ("assistant", response["answer"], response)]:
                db.execute("INSERT INTO messages(conversation,role,content,data,created) VALUES (?,?,?,?,?)", (identity, role, content, json.dumps(data, ensure_ascii=False), now()))
            db.execute("UPDATE conversations SET updated=? WHERE id=?", (now(), identity))

    def change(self, owner, identity, title=None):
        with self.connect() as db:
            self.owned(db, owner, identity)
            if title is None:
                db.execute("DELETE FROM conversations WHERE id=?", (identity,))
            else:
                db.execute("UPDATE conversations SET title=? WHERE id=?", (title[:60], identity))

    def uploads(self, owner):
        with self.connect() as db:
            return [dict(r) for r in db.execute("SELECT id,title,body,created FROM uploads WHERE owner=? ORDER BY created DESC", (owner,))]

    def upload(self, owner, title, body):
        with self.connect() as db:
            if db.execute("SELECT count(*) FROM uploads WHERE owner=?", (owner,)).fetchone()[0] >= 30:
                raise ValueError("最多保留 30 份上传资料，请先删除不再使用的文档。")
            identity = "U" + uuid.uuid4().hex[:10].upper()
            db.execute("INSERT INTO uploads VALUES (?,?,?,?,?)", (identity, owner, title[:120], body, now()))
        return identity

    def delete_upload(self, owner, identity):
        with self.connect() as db:
            if not db.execute("DELETE FROM uploads WHERE owner=? AND id=?", (owner, identity)).rowcount:
                raise LookupError("上传文档不存在；内置课程资料不支持删除。")

    def config(self, owner, value=None):
        with self.connect() as db:
            if value is not None:
                safe = {k: v for k, v in value.items() if k not in {"api_key", "search_key"}}
                db.execute("INSERT OR REPLACE INTO settings VALUES (?,?)", (owner, json.dumps(safe)))
            row = db.execute("SELECT data FROM settings WHERE owner=?", (owner,)).fetchone()
            return json.loads(row[0]) if row else None
