# 上海交通大学公开资料示例集

采集日期：2026-10-01。10个独立官方网页，覆盖校园卡、网络服务、教务、图书馆4类主题。选择该校只是为了形成有统一学校范围的公开资料实验集，不表示使用者就读该校。

`docs/` 保存中文释义摘要，不是原网页全文或原始快照；摘要由AI根据当次可访问页面整理，尚待提交者逐条复核。每份文件保留学校、官方URL、页面标注日期（未提供时为unknown）、采集日期及摘要属性。版权属于原发布者，使用时应回到官方页面核实最新规则，不承诺后续有效性。

本目录独立于原 `docs/` 的12份模拟资料，未自动混入在线助手，也不覆盖旧20题冻结集。尤其不可用本校真实图书馆时间回答模拟校园题目。下一阶段需要在界面明确选择资料范围后，再接入在线检索。

运行独立检查：在 `02_Python_Version/` 执行 `python -m src.evaluation.public_corpus_check`。结果保存到独立 `04_Evaluation/public_corpus_v1/`，检查文档规模、来源元数据、文件哈希及固定20道检索题。当前仅用Hashing基线；不冒称已完成语义模型对比或真实LLM生成。

## 来源索引

| ID | 官方来源 | 主题 |
|---|---|---|
| SJ01 | [校园卡补办](https://net.sjtu.edu.cn/info/1194/2738.htm) | 校园卡 |
| SJ02 | [校园卡挂失解挂](https://net.sjtu.edu.cn/info/1194/2739.htm) | 校园卡 |
| SJ03 | [校园卡消费限额更改](https://net.sjtu.edu.cn/info/1194/2733.htm) | 校园卡 |
| SJ04 | [校园卡余额及消费明细查询](https://net.sjtu.edu.cn/info/1194/2734.htm) | 校园卡 |
| SJ05 | [校园卡充值](https://net.sjtu.edu.cn/info/1194/3226.htm) | 校园卡 |
| SJ06 | [忘记校园卡密码怎么办](https://net.sjtu.edu.cn/info/1193/6778.htm) | 校园卡 |
| SJ07 | [旧校园卡激活](https://net.sjtu.edu.cn/info/1193/6028.htm) | 校园卡 |
| SJ08 | [交大VPN](https://net.sjtu.edu.cn/wlfw/VPN.htm) | 网络服务 |
| SJ09 | [本科生缓考管理办法（2024年4月修订版）](https://jwc.sjtu.edu.cn/info/3801/126251.htm) | 教务 |
| SJ10 | [图书馆新生指南](https://www.lib.sjtu.edu.cn/fresh/xinsheng.html) | 图书馆 |
