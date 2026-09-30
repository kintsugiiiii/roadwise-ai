"""MCP 注册与发现层。

MCP 服务通过环境变量 MCP_SERVERS_FILE 指向 JSON 配置，不把密钥写进前端。
"""
import json
import os
import re
from pathlib import Path
from typing import Any


def _config_path() -> Path:
    return Path(os.getenv("MCP_SERVERS_FILE", Path(__file__).with_name("mcp_servers.json")))


def load_server_config() -> dict[str, Any]:
    path = _config_path()
    if not path.exists():
        return {}
    raw = path.read_text(encoding="utf-8")
    return json.loads(re.sub(r"\$\{([A-Z0-9_]+)\}", lambda match: os.getenv(match.group(1), ""), raw))


def list_mcp_servers() -> list[dict[str, Any]]:
    config = load_server_config()
    return [{"name": name, "transport": value.get("transport", "stdio"), "enabled": value.get("enabled", True)} for name, value in config.items()]


async def load_mcp_tools() -> list[Any]:
    """按配置加载 MCP tools；未安装适配器或没有服务时安全返回空列表。"""
    config = load_server_config()
    if not config:
        return []
    try:
        from langchain_mcp_adapters.client import MultiServerMCPClient
        enabled_servers = {
            name: {key: item for key, item in value.items() if key != "enabled"}
            for name, value in config.items()
            if value.get("enabled", True)
        }
        client = MultiServerMCPClient(enabled_servers)
        return await client.get_tools()
    except ImportError:
        return []
