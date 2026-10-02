# V2 API 与设计说明

接口由 Flask 本机服务提供，不开放跨域 CORS。身份由 HttpOnly / SameSite=Strict 的浏览器 Cookie 确定；不是学校身份认证。写请求使用 JSON；文件上传另用 multipart + `X-Campus-Request: 1`。curl 测试需保存并重用 Cookie。

| 方法与路径 | 请求 | 返回/行为 |
|---|---|---|
| GET `/api/health` | 无 | 当前模式、模型、版本、知识文档数 |
| GET `/api/conversations` | 无 | 当前工作空间最近 100 段会话 |
| POST `/api/conversations` | `{}` | 新会话 `id` |
| GET `/api/conversations/<id>` | 无 | 用户/助手消息及结构化证据 |
| PATCH `/api/conversations/<id>` | `{"title":"新名称"}` | 重命名 |
| DELETE `/api/conversations/<id>` | `{}` | 删除会话与消息；正在执行时拒绝 |
| POST `/api/chat` | `question`, `session_id`, `web` | JSON；或通过 Accept 请求 SSE |
| POST `/api/cancel` | `session_id` | 设置取消标记，停止后续步骤 |
| GET `/api/settings` | 无 | 脱敏设置与供应商预设，不返回 Key |
| POST `/api/settings` | enabled/provider/protocol/base_url/model/api_key/search_key | 校验并保存；Key 留空仅在相同地址与协议时保留 |
| POST `/api/settings/test` | `{}` | 使用已保存连接发送一个小请求；不验证所有 Tool 能力 |
| GET `/api/knowledge?q=...` | 可选标题/正文关键词 | 内置与本人上传文档 |
| POST `/api/knowledge/upload` | multipart `file` | `.md` / `.txt` UTF-8，500 KB 以内 |
| DELETE `/api/knowledge/<id>` | `{}` | 仅可删除本人上传文档 |
| POST `/api/reset` | `session_id` | 兼容入口：删除该会话 |

`POST /api/chat` 不接受任意外来会话 ID；应先创建会话，或省略 ID 自动创建。问题最多 4,000 字符。失败响应为 `{"error":"可理解提示"}`；SSE 格式如下：

```text
data: {"event":"status","message":"正在检索校园知识库"}

data: {"event":"done","data":{"answer":"...","citations":[],"retrieval":[],"trace":[],"latency_ms":12,"session_id":"..."}}

```

异常为 `event:error`，取消时附 `cancelled:true`。这是执行状态流，不是 token 流。仅成功完成的用户/助手回合一起持久化，失败的临时消息保留在当前页面以便编辑重试。

## 协议适配

| 协议 | 地址后缀 | 工具回合格式 |
|---|---|---|
| openai | `/chat/completions` | assistant.tool_calls → role:tool |
| responses | `/responses` | function_call → function_call_output；保留 output items |
| anthropic | `/messages` | tool_use → user.tool_result |
| gemini | `/models/<model>:generateContent` | functionCall → functionResponse；保留 thoughtSignature 与 call ID |

不统一强加 temperature，以免不支持该参数的模型报错。API 请求不跟随重定向，避免把 Authorization 转发到陌生主机。默认远端必须 HTTPS，本地 Ollama 允许 HTTP。非 2xx 状态、超时、超大响应与无效 JSON 都转换为不含密钥的错误信息。

实现参考：[OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)、[Anthropic tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)、[Gemini generateContent](https://ai.google.dev/api/generate-content)、[Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search)。协议 Mock 证明请求与回合结构，不证明每个预设账号和模型均可用。

## Agent 约束

同一浏览器工作空间一次仅执行一个回合；最多 6 轮、12 次工具请求、轮间检查 90 秒预算，单次模型请求最长 30 秒。模型工具参数必须匹配 Schema；结果以 Observation 返回。当前输入未明确请求人工或明确否定转人工时，不执行工单工具。重复同名同参工具使用当次缓存。联网未启用时不向模型注册搜索工具。

内置知识与上传资料是数据，不是指令。只为实际检索结果生成引用卡片；未知编号标记为未核验。并未实现形式化幻觉判定或绝对提示注入防御。

## 数据生命周期

- 文档和历史按浏览器 owner 隔离；应用数据库保留服务端会话签名密钥，禁止公开。
- 历史完整存储；模型上下文最近 12 条，每条上限 10,000 字符。上传不进入旧评测集。
- 运行时模型密钥只在进程内；切换地址/协议且未填新 Key 时不沿用旧 Key。
- 删除资料不会重写既有回答的来源快照；删除会话会删除其消息。已有模拟工单不随会话删除而自动回滚。
- 默认数据无真实个人信息；日志会记录检索问题与模拟工具参数，不适用于存放真实敏感数据。
