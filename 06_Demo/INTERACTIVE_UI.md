# 互动式服务探索

## 设计与素材

保留校伴鼠尾草绿视觉风格，用可操作的服务探索区替代首页纯装饰区域。使用 Impeccable 的 delight/animate 规范：场景选择是唯一重点动效，内容短暂揭示解释切换；不使用自动轮播、假进度、声音或持续循环动画。减少动画偏好下直接更新内容。

四个 Lucide 免费图标使用固定版本 0.468.0，本地托管，不新增运行时依赖。详见 `02_Python_Version/static/assets/README.md` 和随附许可证。未使用未确认授权的摄影、插画或动画。

## 演示路径

1. 首页选择图书馆、教务处、生活区或网络中心；也可用方向键及 Home/End 切换。
2. 选择具体问题，点击“带入对话”。
3. 在输入框确认或编辑内容，主动发送，继续使用既有 RAG/Agent 流程。
4. 输入框已有内容时保留草稿并追加所选问题，避免丢失编辑。

此处是教学场景导航，不是实际校园地图；不新增真实业务承诺。

## 验证

运行 `NODE_PATH=<Playwright 所在 node_modules> node tests/interaction_smoke.cjs`（工作目录为 `02_Python_Version`）。测试使用隔离 Chrome，不读取用户浏览器档案，不发送聊天或修改业务数据。7 项检查和四种视口结果写入 `04_Evaluation/interactive_ui_results.json`，截图位于 `06_Demo/screenshots/interactive/`。

Impeccable 静态检测器因本机缺少 HTML 解析模块使用了降级模式，其空结果不等于完整无障碍审计；额外进行了浏览器操作检查及桌面/手机/深色截图人工查看。
