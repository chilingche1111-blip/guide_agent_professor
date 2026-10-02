# TASK-010：智慧校园科技风与同页 Agent

## 范围

按用户要求改善进入主要 Agent 功能时的割裂感，压缩“不必四处找”辅助资料区，并呈现智慧校园科技感。不改动后端业务规则，不实现外部低代码平台。

## 实现

- 冷蓝、钴蓝和深靛色统一校园页与工作台；芯片标识、清晰模型状态与功能入口突出智能助手。
- `mountWorkbench()`、`mountExplorer()` 复用既有功能；独立工作台以 ES module 引导。
- `agent-portal.js` 将工作台挂载在 Shadow DOM，预取资源、保留校园 Canvas 和草稿，支持前进后退、直达地址与已保存会话同步；不用 iframe、不放宽 CSP。
- 原生 View Transition 短转场，支持减少动画与无 API 回退；处理中止/超时，避免动画阻断实际切换。
- 资料速查最多预览3份匹配文档，完整12份知识仍可在知识空间访问。
- 报告保持原模板章节，新增当前桌面、手机、夜间等真实截图，旧证据标记历史。

## 验证

- 同页导航13项通过：`04_Evaluation/agent_navigation_results.json`。
- 独立工作台19项回归通过：`04_Evaluation/agent-navigation-regression/browser_results.json`。
- Python单测55项通过。未新增真实商业LLM或联网问答质量验证。
- 截图：`06_Demo/screenshots/agent-navigation/`。测试使用隔离浏览器身份，不接触用户现有会话。

设计取舍由AI按用户反馈执行，仍待使用者审阅体验；不将自动化检查表述为独立人工评审或全设备性能保证。
