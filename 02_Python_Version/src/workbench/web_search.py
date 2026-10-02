"""Search snippets only: fixed remote endpoints, no arbitrary-page fetch."""
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib import request, parse, error

from src.llm.providers import ProviderError, post_json, NoRedirect


def safe_url(url):
    parts = parse.urlsplit(url)
    return url if parts.scheme in {"http", "https"} and parts.hostname and not parts.username else ""


class SearchHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self.field = None
        self.depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get("class", "")
        if tag == "a" and "result__a" in cls:
            link = a.get("href", "")
            query = parse.parse_qs(parse.urlsplit(link).query)
            link = query.get("uddg", [link])[0]
            self.items.append({"title": "", "text": "", "url": safe_url(link)})
            self.field, self.depth = "title", 1
        elif "result__snippet" in cls and self.items:
            self.field, self.depth = "text", 1
        elif self.field and tag not in {"br", "img", "input", "meta", "hr"}:
            self.depth += 1

    def handle_endtag(self, tag):
        if self.field:
            self.depth -= 1
            if self.depth <= 0:
                self.field = None

    def handle_data(self, data):
        if self.field and self.items:
            self.items[-1][self.field] += data


class SearchRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        url = parse.urlsplit(newurl)
        if url.scheme != "https" or url.hostname not in {"www.bing.com", "cn.bing.com", "html.duckduckgo.com", "duckduckgo.com"}:
            return None
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def search_web(query, api_key=""):
    if not isinstance(query, str) or not query.strip() or len(query) > 400:
        raise ValueError("联网搜索词需要 1–400 个字符。")
    # Avoid automatically transmitting demonstration student identifiers.
    query = re.sub(r"\b(?:S\d{4}|AP\d{7})\b", "", query, flags=re.I).strip()
    if not query:
        raise ValueError("请不要将学号或申请编号作为联网检索词。")
    if api_key:
        data = post_json("https://api.tavily.com/search", {"query": query, "max_results": 5, "include_raw_content": False}, {"Authorization": "Bearer " + api_key}, timeout=15)
        items = [{"title": r.get("title", ""), "text": r.get("content", ""), "url": safe_url(r.get("url", ""))} for r in data.get("results", [])]
        provider = "Tavily"
    else:
        req = request.Request("https://html.duckduckgo.com/html/?" + parse.urlencode({"q": query}), headers={"User-Agent": "Mozilla/5.0 (compatible; CampusCompanion/2.0)"})
        try:
            with request.build_opener(SearchRedirect).open(req, timeout=15) as res:
                html = res.read(1_000_000).decode("utf-8", errors="replace")
        except (error.URLError, TimeoutError, OSError):
            html = ""
        parser = SearchHTML()
        parser.feed(html)
        items, provider = parser.items, "DuckDuckGo"
        if not any(v["url"] for v in items):
            # Public RSS fallback for this personal, non-commercial course demo.
            # A commercial deployment must use a licensed search API (e.g. Tavily).
            req = request.Request("https://www.bing.com/search?" + parse.urlencode({"format": "rss", "q": query}), headers={"User-Agent": "Mozilla/5.0"})
            try:
                with request.build_opener(SearchRedirect).open(req, timeout=15) as res:
                    root = ET.fromstring(res.read(1_000_000))
                items = [{"title": v.findtext("title", ""), "text": v.findtext("description", ""), "url": safe_url(v.findtext("link", ""))} for v in root.findall("./channel/item")]
                provider = "Bing RSS · 个人非商业实验"
            except (error.URLError, TimeoutError, OSError, ET.ParseError):
                items = []
    fetched = datetime.now(timezone.utc).isoformat(timespec="seconds")
    results = [{"source_id": f"W{i + 1}", "title": r["title"].strip()[:240], "text": r["text"].strip()[:1800], "url": r["url"], "source_type": "web", "retrieved_at": fetched, "provider": provider} for i, r in enumerate([v for v in items if v["url"]][:5])]
    if not results:
        raise ProviderError("搜索未返回可用结果，可能被限流或需要验证码。可配置 Tavily 后重试；不能据此断言网上没有相关信息。")
    return results
