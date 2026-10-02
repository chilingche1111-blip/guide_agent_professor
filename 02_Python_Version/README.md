# 当前运行入口

此目录是长安知行 V2 的唯一当前运行源码。完整说明、API 配置、功能边界与验收链接见[项目 README](../README.md)。

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

打开 http://127.0.0.1:7860 进入沉浸式校园。点击顶部「智能工作台」进入原完整界面；默认无密钥离线演示，在工作台「模型与连接」配置自己的 API 后启用大模型。

```bash
python -m unittest discover -s tests -v
python -m src.evaluation.workbench_check
```

不要将 `.env`、`data/*.db` 或个人密钥提交到仓库。
