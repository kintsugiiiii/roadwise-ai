import json
import base64
import io
import zipfile
import xml.etree.ElementTree as ET
import os
from pathlib import Path
from typing import Any, TypedDict

import httpx
from langgraph.graph import END, START, StateGraph

from .prompts import OUTPUT_RULES, SYSTEM_PROMPT
from .mcp import load_mcp_tools
from .skills import skill_context


class AgentState(TypedDict, total=False):
    request: dict[str, Any]
    result: dict[str, Any]


runtime_config: dict[str, str] = {}
LOCAL_CONFIG_PATH = os.getenv("AGENT_CONFIG_FILE", str(Path(__file__).parent.parent / ".agent-config.json"))


def _load_local_config() -> None:
    try:
        with open(LOCAL_CONFIG_PATH, encoding="utf-8") as config_file:
            saved = json.load(config_file)
        if saved.get("api_key"):
            runtime_config.update({key: str(value) for key, value in saved.items() if value})
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        pass


_load_local_config()


def configure(api_key: str, model: str = "deepseek-v4-flash", base_url: str = "https://api.deepseek.com/v1"):
    if not api_key.strip():
        raise ValueError("API Key 不能为空")
    runtime_config.update({"api_key": api_key.strip(), "model": model.strip() or "deepseek-v4-flash", "base_url": base_url.rstrip("/")})
    try:
        with open(LOCAL_CONFIG_PATH, "w", encoding="utf-8") as config_file:
            json.dump(runtime_config, config_file, ensure_ascii=False)
    except OSError:
        pass

def update_model(model: str) -> None:
    if not model.strip():
        raise ValueError("模型不能为空")
    runtime_config["model"] = model.strip()
    try:
        with open(LOCAL_CONFIG_PATH, "w", encoding="utf-8") as config_file:
            json.dump(runtime_config, config_file, ensure_ascii=False)
    except OSError:
        pass


def config_status() -> dict[str, Any]:
    return {
        "configured": bool(runtime_config.get("api_key") or os.getenv("DEEPSEEK_API_KEY")),
        "model": runtime_config.get("model") or os.getenv("DEEPSEEK_MODEL") or "deepseek-v4-flash",
    }


def _settings() -> dict[str, str]:
    api_key = runtime_config.get("api_key") or os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key:
        raise RuntimeError("尚未配置 Agent API Key，请在左下角打开 Agent 配置。")
    return {
        "api_key": api_key,
        "model": runtime_config.get("model") or os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash"),
        "base_url": runtime_config.get("base_url") or os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
    }


def _input(request: dict[str, Any]) -> str:
    action = request["action"]
    attachments = request.get("attachments") or []
    extracted: list[str] = []
    for item in attachments:
        files = item.get("files") if isinstance(item, dict) else None
        for file_item in (files or [item]):
            if not isinstance(file_item, dict):
                continue
            name = file_item.get("name", "附件")
            content = file_item.get("content")
            data_url = file_item.get("dataUrl", "")
            if not content and data_url.startswith("data:application/pdf;base64,"):
                try:
                    from pypdf import PdfReader
                    raw = base64.b64decode(data_url.split(",", 1)[1])
                    content = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(raw)).pages)
                except Exception as exc:
                    content = f"[PDF 解析失败：{exc}]"
            if not content and data_url.startswith("data:") and name.lower().endswith(".docx"):
                try:
                    raw = base64.b64decode(data_url.split(",", 1)[1])
                    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                        xml = ET.fromstring(archive.read("word/document.xml"))
                    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                    blocks = []
                    for paragraph in xml.findall(".//w:p", ns):
                        text = "".join(node.text or "" for node in paragraph.findall(".//w:t", ns)).strip()
                        if text:
                            blocks.append(text)
                    for row in xml.findall(".//w:tr", ns):
                        cells = []
                        for cell in row.findall("./w:tc", ns):
                            cells.append("".join(node.text or "" for node in cell.findall(".//w:t", ns)).strip())
                        if any(cells):
                            blocks.append("\t".join(cells))
                    content = "\n".join(blocks)
                except Exception as exc:
                    content = f"[Word 解析失败：{exc}]"
            if not content and data_url.startswith("data:") and name.lower().endswith((".pptx", ".xlsx")):
                try:
                    raw = base64.b64decode(data_url.split(",", 1)[1])
                    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                        if name.lower().endswith(".pptx"):
                            parts = sorted(item for item in archive.namelist() if item.startswith("ppt/slides/slide") and item.endswith(".xml"))
                            ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
                            blocks = []
                            for index, part in enumerate(parts, 1):
                                xml = ET.fromstring(archive.read(part))
                                text = " ".join(node.text or "" for node in xml.findall(".//a:t", ns)).strip()
                                if text:
                                    blocks.append(f"第{index}页：{text}")
                            content = "\n".join(blocks)
                        else:
                            sheets = sorted(item for item in archive.namelist() if item.startswith("xl/worksheets/sheet") and item.endswith(".xml"))
                            ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                            shared = []
                            if "xl/sharedStrings.xml" in archive.namelist():
                                shared_xml = ET.fromstring(archive.read("xl/sharedStrings.xml"))
                                shared = ["".join(node.text or "" for node in item.findall(".//x:t", ns)) for item in shared_xml.findall("x:si", ns)]
                            blocks = []
                            for index, part in enumerate(sheets, 1):
                                xml = ET.fromstring(archive.read(part))
                                rows = []
                                for row in xml.findall(".//x:row", ns):
                                    values = []
                                    for cell in row.findall("x:c", ns):
                                        value = cell.findtext("x:v", default="", namespaces=ns)
                                        if cell.get("t") == "s" and value.isdigit() and int(value) < len(shared): value = shared[int(value)]
                                        values.append(value)
                                    if values: rows.append("\t".join(values))
                                if rows: blocks.append(f"工作表{index}：\n" + "\n".join(rows[:100]))
                            content = "\n".join(blocks)
                except Exception as exc:
                    content = f"[Office 文件解析失败：{exc}]"
            if content:
                extracted.append(f"【{name}】\n{content[:120000]}")
            elif data_url.startswith("data:image/"):
                extracted.append(f"【{name}】\n[图片将作为视觉输入发送给模型，请识别图片中的文字、表格、图表和关键信息。]")
    request_for_model = dict(request)
    request_for_model["attachments"] = extracted or [item.get("name", "附件") for item in attachments if isinstance(item, dict)]
    return "\n".join([
        f"当前操作类型：{action}",
        f"该操作的 JSON 输出格式：{OUTPUT_RULES[action]}",
        "用户请求数据：",
        json.dumps(request_for_model, ensure_ascii=False),
    ])


async def call_model(request: dict[str, Any]) -> dict[str, Any]:
    settings = _settings()
    skill_text = skill_context(request.get("skills"))
    mcp_tools = await load_mcp_tools()
    tool_schemas = []
    for tool in mcp_tools:
        parameters = tool.args_schema.model_json_schema() if hasattr(tool.args_schema, "model_json_schema") else {}
        if not isinstance(parameters, dict) or parameters.get("type") != "object":
            parameters = {"type": "object", "properties": {}, "additionalProperties": True}
        tool_schemas.append({"type": "function", "function": {"name": tool.name, "description": tool.description or "MCP 工具", "parameters": parameters}})
    user_content: Any = _input(request)
    image_inputs = []
    for item in request.get("attachments") or []:
        for file_item in (item.get("files") if isinstance(item, dict) else None) or [item]:
            if isinstance(file_item, dict) and str(file_item.get("dataUrl", "")).startswith("data:image/"):
                image_inputs.append({"type": "image_url", "image_url": {"url": file_item["dataUrl"]}})
    if image_inputs:
        user_content = [{"type": "text", "text": user_content}, *image_inputs]
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + skill_text},
        {"role": "user", "content": user_content},
    ]
    async with httpx.AsyncClient(timeout=90) as client:
        for _ in range(8):
            response = await client.post(
                f"{settings['base_url'].rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {settings['api_key']}", "Content-Type": "application/json"},
                json={"model": settings["model"], "temperature": 0.2, "messages": messages, **({"tools": tool_schemas, "tool_choice": "auto"} if tool_schemas else {})},
            )
            if response.is_error:
                raise RuntimeError(f"DeepSeek 返回 {response.status_code}: {response.text[:500]}")
            payload = response.json()
            assistant = payload.get("choices", [{}])[0].get("message", {})
            tool_calls = assistant.get("tool_calls") or []
            if not tool_calls:
                content = assistant.get("content", "").strip()
                break
            messages.append(assistant)
            tools_by_name = {tool.name: tool for tool in mcp_tools}
            for call in tool_calls:
                tool = tools_by_name.get(call.get("function", {}).get("name"))
                if not tool:
                    result = {"error": "未找到 MCP tool"}
                else:
                    try:
                        args = json.loads(call.get("function", {}).get("arguments", "{}"))
                        result = await tool.ainvoke(args)
                    except Exception as exc:
                        result = {"error": str(exc)}
                messages.append({"role": "tool", "tool_call_id": call.get("id", ""), "content": json.dumps(result, ensure_ascii=False, default=str)})
        else:
            raise RuntimeError("MCP 工具调用超过最大轮次，请检查工具配置。")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise RuntimeError("模型返回的结果不是合法 JSON，请重试。") from exc


async def _agent_node(state: AgentState) -> dict[str, Any]:
    return {"result": await call_model(state["request"])}


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("agent", _agent_node)
    graph.add_edge(START, "agent")
    graph.add_edge("agent", END)
    return graph.compile()


agent_graph = build_graph()


async def invoke(request: dict[str, Any]) -> dict[str, Any]:
    state = await agent_graph.ainvoke({"request": request})
    return state["result"]
