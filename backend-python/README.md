# Python + LangGraph Agent 后端

系统提示词、角色和输出格式：

`app/prompts.py`

启动：

```bash
cd backend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
```

前端仍然调用 `http://127.0.0.1:4000/api/project-agent`。

## MCP 配置

编辑 `app/mcp_servers.json`，例如：

```json
{
  "my-tools": {
    "transport": "stdio",
    "command": "python",
    "args": ["/absolute/path/to/mcp_server.py"],
    "enabled": true
  }
}
```

也支持 MCP Adapter 的 SSE/Streamable HTTP 配置。工具会被 Agent 自动发现，并在模型请求工具时执行。

默认已预置四类 MCP：网络搜索、GitHub、文件系统、数据库。出于安全原因，网络搜索、GitHub 和数据库默认关闭；配置环境变量后将对应 `enabled` 改为 `true`：

```bash
export BRAVE_API_KEY="..."
export GITHUB_PERSONAL_ACCESS_TOKEN="..."
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

文件系统 MCP 默认只允许访问当前工作区；不要把权限目录改成整个用户目录。

内置 Skill 和外部 Skill 注册位置：`app/skills.py`；系统角色与行为规范位置：`app/prompts.py`。
