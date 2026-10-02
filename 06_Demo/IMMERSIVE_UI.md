# 校伴沉浸式校园

> 版本说明：本文记录此前三维校园与导航阶段。当前“真实长安大学照片 + 分区实景/镜头 + 全屏目录”版本以 [OPEN_DAY_DESIGN.md](OPEN_DAY_DESIGN.md) 为准，最新截图在 `screenshots/open-day/`，下列历史测试计数不代表本轮验收。

## 参考与边界

- [Bruno Simon 的互动作品集](https://bruno-simon.com/)：参考三维空间探索、镜头与对象交互，以及直达内容的替代入口。
- [Lusion](https://lusion.co/)：参考全屏场景、空间与内容转场。未复制其代码、模型、图片或音频。
- [Three.js 官方文档](https://threejs.org/docs/)：用于本地 WebGL 渲染、摄像机、几何体、射线拾取与灯光。

场景通过代码原创生成建筑、道路、树木、庭院与人物；模型仅为课程示意，不复刻真实学校，不承诺真实位置或业务受理。

## 页面结构与互动

1. `/`：真实 Three.js 三维校园。拖动水平旋转；按钮旋转、缩放、复位；点击四类建筑或对应文字导航聚焦目的地。
2. 目的地资料面板：从 `/api/knowledge` 读取并按文档标题/主题匹配，展开显示原文。内容不是凭空编写的办理规则。
3. 下滚资料速查：全文筛选后最多预览 3 份资料，支持展开原文与针对文档咨询；“打开知识空间”进入完整资料管理，未删除其余课程资料。
4. 侧边校伴：按需展开，通过 `/api/chat` 提交问答，展示答案及引用。联网为用户选择；新会话同步到原工作台历史。没有伪装逐 token 流式输出。
5. `/#agent`：同页展开完整工作台，继续管理模型、知识与会话；`/static/workbench.html` 保留独立兼容入口。

## 科技风与同页转场优化（最新）

冷蓝背景、钴蓝主操作、深靛夜间表面和芯片图标统一“智慧校园助手”身份。依据 Impeccable 的动效、精简与配色规范，保留三维校园特色，将资料手册收为辅助区，主操作直达 Agent。工作台内不重复嵌入探索展示区，优先呈现会话、来源和工具。

`agent-portal.js` 在空闲或入口聚焦时提前挂载工作台，以 Shadow DOM 隔离样式，复用 `mountWorkbench()`；没有 iframe 或第二套问答后端，也未放宽 CSP。当前使用两个已有页面层的 Web Animations 转场：进入300ms、返回240ms，取消整页WebGL截图和缩放。工作台界面不等待设置/历史数据；同步期间禁用数据操作，但可以返回校园。快速反向切换从当前绘制状态续接，系统减少动画偏好下直接切换，手机不因导航自动弹键盘。校园 Canvas 不重建，工作台草稿不覆盖；侧边助手与主工作台同步已保存会话。资源加载失败会显示独立入口。

专项诊断见 `04_Evaluation/navigation_motion_results.json`：本机无头Chrome、1440×960、软件WebGL的一次对照中，正常接口的点击到界面可见从92ms降至37ms；人为增加800ms接口延迟时从1298ms降至46ms。此数值仅为界面开始显示，不是数据就绪时间、转场完成时间、INP或跨设备性能保证。另有5项检查覆盖快速往返、慢网返回、交互锁定、手机减少动画及无未捕获错误。

最新验证：13 项同页导航检查、19 项独立工作台回归、55 项 Python 单测通过。记录为 `04_Evaluation/agent_navigation_results.json` 和 `04_Evaluation/agent-navigation-regression/browser_results.json`；当前截图为 `06_Demo/screenshots/agent-navigation/`。下方 16 项沉浸测试与独立收尾结论是上一轮证据，不混算为本轮新增测试。

镜头移动是主要动态效果，昼夜切换同步场景灯光与页面色彩；小人物与庭院水圈提供轻量场景动态。支持暂停与系统减少动画偏好；标签和普通按钮提供不依赖鼠标拾取的操作路径。屏幕外及后台页面停止动画循环。场景加载失败仍可读手册、选择目的地、咨询助手。

## 本地依赖和许可证

| 依赖 | 固定版本 / 来源 | 许可与位置 |
|---|---|---|
| Three.js | 0.170.0，https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js | MIT，`static/vendor/three/LICENSE` |
| Urbanist 字体 | @fontsource/urbanist 5.1.0，https://cdn.jsdelivr.net/npm/@fontsource/urbanist@5.1.0/files/urbanist-latin-600-normal.woff2 | SIL OFL，`static/assets/fonts/LICENSE` |
| Lucide 场景图标 | lucide-static 0.468.0 | ISC，`static/assets/lucide/LICENSE` |

下载日期为 2026-10-01。发布项目时保留上述许可文件。在线案例仅作为交互参考，不是免费素材授权来源。

## 验证与运行

从 `02_Python_Version` 启动 `python app.py`，访问 `http://127.0.0.1:7860/`。通过 `NODE_PATH=<Playwright node_modules> node tests/immersive_smoke.cjs` 验证。结果写入 `04_Evaluation/immersive_ui_results.json`；真实截图写入 `06_Demo/screenshots/immersive/`。测试使用独立浏览器身份并清理该身份创建的测试对话，不读取用户浏览器配置。

静态设计检测在当前环境降级为正则模式，因此不把空结果表述为完整无障碍审计。功能测试与截图验证不代表各移动设备的帧率基准，不声称达到所有设备60 FPS。原始 V2 与上一版互动截图保留为历史材料。

## 收尾结果

Impeccable 独立收尾检查最初提出手机助手入口遮挡导航、夜景悬停文字对比度不足两项问题。手机入口已改为上方44像素图标按钮，并通过边界矩形不重叠断言及网络中心点击测试；夜景主按钮与地图标签增加专用悬停前景色。最终定向复核两项均为 Resolved，结论为在本次有限范围收尾检查内接受。

| 检查 | 当前结果 |
|---|---|
| 手机四个目的地不被助手遮挡 | 已修复并复核 |
| 夜景主按钮与地图标签悬停对比度 | 已修复并复核 |
| 沉浸页面浏览器检查 | 16项通过 |
| 原完整工作台浏览器回归 | 19项通过 |
| Python单元测试 | 55项通过 |

不将上述结论扩张为所有设备性能、全部无障碍规范或所有外部模型供应商均已验收。
