"""Four native tool-calling protocols, without a vendor SDK or key persistence."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from urllib import request, error, parse


PRESETS = [
    {"id": "openai", "label": "OpenAI", "protocol": "responses", "base_url": "https://api.openai.com/v1", "model": "gpt-4.1-mini"},
    {"id": "deepseek", "label": "DeepSeek", "protocol": "openai", "base_url": "https://api.deepseek.com", "model": "deepseek-chat"},
    {"id": "qwen", "label": "通义千问", "protocol": "openai", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1", "model": "qwen-plus"},
    {"id": "glm", "label": "智谱 GLM", "protocol": "openai", "base_url": "https://open.bigmodel.cn/api/paas/v4", "model": "glm-4-plus"},
    {"id": "moonshot", "label": "Moonshot / Kimi", "protocol": "openai", "base_url": "https://api.moonshot.cn/v1", "model": "moonshot-v1-8k"},
    {"id": "siliconflow", "label": "硅基流动", "protocol": "openai", "base_url": "https://api.siliconflow.cn/v1", "model": "Qwen/Qwen2.5-72B-Instruct"},
    {"id": "openrouter", "label": "OpenRouter", "protocol": "openai", "base_url": "https://openrouter.ai/api/v1", "model": "openai/gpt-4.1-mini"},
    {"id": "anthropic", "label": "Anthropic Claude", "protocol": "anthropic", "base_url": "https://api.anthropic.com/v1", "model": "claude-sonnet-4-5"},
    {"id": "gemini", "label": "Google Gemini", "protocol": "gemini", "base_url": "https://generativelanguage.googleapis.com/v1beta", "model": "gemini-2.5-flash"},
    {"id": "ollama", "label": "Ollama · 本地", "protocol": "openai", "base_url": "http://127.0.0.1:11434/v1", "model": "qwen2.5:7b"},
    {"id": "custom", "label": "自定义兼容接口", "protocol": "openai", "base_url": "", "model": ""},
]


class ProviderError(RuntimeError):
    pass


def validate_config(data: dict) -> dict:
    protocol = data.get("protocol", "openai")
    if protocol not in {"openai", "responses", "anthropic", "gemini"}:
        raise ValueError("请选择受支持的 API 协议。")
    base = str(data.get("base_url", "")).strip().rstrip("/")
    url = parse.urlsplit(base)
    local = url.hostname in {"localhost", "127.0.0.1", "::1"}
    if not url.hostname or url.username or url.password or url.query or url.fragment or (url.scheme != "https" and not (local and url.scheme == "http")):
        raise ValueError("接口地址需要 HTTPS；本地 Ollama 可使用 HTTP。不要在地址中填写密钥。")
    model = str(data.get("model", "")).strip()
    if not model or len(model) > 160 or not re.fullmatch(r"[\w./:@+-]+", model):
        raise ValueError("请输入有效的模型 ID，而不是模型展示名称。")
    key = str(data.get("api_key", "")).strip()
    if len(key) > 4096 or "\n" in key or "\r" in key:
        raise ValueError("API Key 格式无效。")
    return {"provider": str(data.get("provider", "custom"))[:30], "protocol": protocol,
            "base_url": base, "model": model, "api_key": key, "enabled": bool(data.get("enabled", True))}


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Never forward a credential to another host.


def post_json(url: str, payload: dict, headers: dict, timeout: int = 30) -> dict:
    req = request.Request(url, data=json.dumps(payload).encode(),
                          headers={"Content-Type": "application/json", **headers}, method="POST")
    try:
        with request.build_opener(NoRedirect).open(req, timeout=timeout) as response:
            body = response.read(4_000_001)
            if len(body) > 4_000_000:
                raise ProviderError("服务端响应超过安全大小限制。")
            result = json.loads(body)
            if not isinstance(result, dict):
                raise ProviderError("服务端返回了无效 JSON。")
            return result
    except error.HTTPError as exc:
        hints = {401: "密钥无效或已过期", 403: "访问被拒绝", 404: "模型或接口路径不存在",
                 429: "额度不足或请求过于频繁", 400: "模型不支持当前参数或工具调用"}
        raise ProviderError(f"API HTTP {exc.code}：{hints.get(exc.code, '服务暂不可用')}。请检查模型设置。") from None
    except (error.URLError, TimeoutError, OSError):
        raise ProviderError("无法连接 API 或请求超时，请检查网络与接口地址。") from None
    except (ValueError, UnicodeError):
        raise ProviderError("服务端未返回有效 JSON，请检查 API 协议。") from None


@dataclass
class Turn:
    text: str
    calls: list[dict]
    raw: object


class ModelClient:
    def __init__(self, config: dict):
        self.config = validate_config(config)
        self.protocol = self.config["protocol"]

    def start(self, system: str, messages: list[dict]) -> dict:
        return {"system": system, "messages": [dict(m) for m in messages]}

    def complete(self, state: dict, tools: list[dict]) -> Turn:
        c = self.config
        headers = {"Authorization": f"Bearer {c['api_key']}"} if c["api_key"] else {}
        messages = state["messages"]
        if self.protocol == "openai":
            payload = {"model": c["model"], "messages": [{"role": "system", "content": state["system"]}, *messages]}
            if tools:
                payload["tools"] = [{"type": "function", "function": t} for t in tools]
            data = post_json(c["base_url"] + "/chat/completions", payload, headers)
            try:
                raw = data["choices"][0]["message"]
                calls = [{"id": v["id"], "name": v["function"]["name"], "arguments": self.arguments(v["function"]["arguments"])} for v in raw.get("tool_calls", [])]
                return Turn(raw.get("content") or "", calls, raw)
            except (KeyError, IndexError, TypeError):
                raise ProviderError("Chat Completions 响应格式不匹配。") from None
        if self.protocol == "responses":
            payload = {"model": c["model"], "instructions": state["system"], "input": messages, "store": False}
            if tools:
                payload["tools"] = [{"type": "function", **t, "strict": False} for t in tools]
            data = post_json(c["base_url"] + "/responses", payload, headers)
            raw = data.get("output", [])
            calls = [{"id": v["call_id"], "name": v["name"], "arguments": self.arguments(v.get("arguments", "{}"))} for v in raw if v.get("type") == "function_call"]
            text = "\n".join(p.get("text", "") for v in raw if v.get("type") == "message" for p in v.get("content", []) if p.get("type") == "output_text")
            return Turn(text, calls, raw)
        if self.protocol == "anthropic":
            headers = {"x-api-key": c["api_key"], "anthropic-version": "2023-06-01"}
            payload = {"model": c["model"], "system": state["system"], "messages": messages, "max_tokens": 4096}
            if tools:
                payload["tools"] = [{"name": t["name"], "description": t["description"], "input_schema": t["parameters"]} for t in tools]
            data = post_json(c["base_url"] + "/messages", payload, headers)
            raw = data.get("content", [])
            return Turn("\n".join(v["text"] for v in raw if v.get("type") == "text"),
                        [{"id": v["id"], "name": v["name"], "arguments": v["input"]} for v in raw if v.get("type") == "tool_use"], raw)
        contents = []
        for m in messages:
            contents.append(m if "parts" in m else {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]})
        payload = {"systemInstruction": {"parts": [{"text": state["system"]}]}, "contents": contents}
        if tools:
            # Gemini's schema subset does not accept additionalProperties.
            payload["tools"] = [{"functionDeclarations": [{"name": t["name"], "description": t["description"], "parameters": {k: v for k, v in t["parameters"].items() if k != "additionalProperties"}} for t in tools]}]
        data = post_json(c["base_url"] + "/models/" + parse.quote(c["model"], safe="") + ":generateContent", payload, {"x-goog-api-key": c["api_key"]})
        try:
            raw = data["candidates"][0]["content"]
            calls = [{"id": p["functionCall"].get("id", f"call_{i}"), "name": p["functionCall"]["name"], "arguments": p["functionCall"].get("args", {})} for i, p in enumerate(raw["parts"]) if "functionCall" in p]
            return Turn("\n".join(p["text"] for p in raw["parts"] if "text" in p and not p.get("thought")), calls, raw)
        except (KeyError, IndexError, TypeError):
            raise ProviderError("Gemini 未返回可用内容，可能触发安全过滤或协议不匹配。") from None

    @staticmethod
    def arguments(value):
        try:
            return json.loads(value) if isinstance(value, str) else value
        except ValueError:
            return None

    def observe(self, state: dict, turn: Turn, results: list[dict]) -> None:
        m = state["messages"]
        if self.protocol == "responses":
            m.extend(turn.raw)
            m.extend({"type": "function_call_output", "call_id": c["id"], "output": json.dumps(r, ensure_ascii=False)} for c, r in zip(turn.calls, results))
        elif self.protocol == "anthropic":
            m.append({"role": "assistant", "content": turn.raw})
            m.append({"role": "user", "content": [{"type": "tool_result", "tool_use_id": c["id"], "content": json.dumps(r, ensure_ascii=False)} for c, r in zip(turn.calls, results)]})
        elif self.protocol == "gemini":
            m.append(turn.raw)  # Preserve thoughtSignature and functionCall IDs unchanged.
            parts = []
            originals = [p["functionCall"] for p in turn.raw["parts"] if "functionCall" in p]
            for original, call, result in zip(originals, turn.calls, results):
                response = {"name": call["name"], "response": result}
                if "id" in original:
                    response["id"] = original["id"]
                parts.append({"functionResponse": response})
            m.append({"role": "user", "parts": parts})
        else:
            m.append(turn.raw)
            m.extend({"role": "tool", "tool_call_id": c["id"], "content": json.dumps(r, ensure_ascii=False)} for c, r in zip(turn.calls, results))
