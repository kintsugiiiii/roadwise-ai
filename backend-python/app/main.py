from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .agent import config_status, configure, invoke
from .mcp import list_mcp_servers
from .skills import list_skills
from .database import get_project_state as db_get_project_state, get_session as db_get_session, increment_usage, save_project_state, save_session

app = FastAPI(title="Roadwise LangGraph Agent")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def normalize_project_graph(result: dict[str, Any]) -> dict[str, Any]:
    """Keep generated projects compatible with every project detail view.

    Older/partial model responses sometimes omit tasks or descriptions. The
    frontend must still receive the same node shape used by the graph view.
    """
    graph = result.get("graph")
    if not isinstance(graph, list):
        result["graph"] = []
        return result
    normalized = []
    for index, item in enumerate(graph):
        if not isinstance(item, dict):
            continue
        node = dict(item)
        node.setdefault("id", f"node-{index + 1}")
        node.setdefault("name", node.get("label") or f"未命名节点{index + 1}")
        node.setdefault("description", "记录该节点的关键输入、执行过程、判断依据和阶段产出。")
        tasks = node.get("tasks")
        node["tasks"] = [str(task).strip() for task in tasks if str(task).strip()] if isinstance(tasks, list) else []
        node.setdefault("order", index + 1)
        normalized.append(node)
    result["graph"] = normalized
    return result


class AgentConfig(BaseModel):
    apiKey: str = Field(min_length=1)
    model: str = "deepseek-v4-flash"
    baseUrl: str = "https://api.deepseek.com/v1"

class AgentModel(BaseModel):
    model: str = Field(min_length=1)


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "roadwise-langgraph-agent"}


@app.get("/api/project-agent/config")
async def get_config():
    return config_status()

@app.get("/api/project-agent/usage")
async def get_usage():
    # DeepSeek 账单以 token 为准；在未返回账单明细时，提供字符到 token 的保守估算。
    stats = increment_usage(0, 0)
    input_tokens = round(stats.get("inputChars", 0) / 2)
    output_tokens = round(stats.get("outputChars", 0) / 2)
    return {**stats, "inputTokensEstimated": input_tokens, "outputTokensEstimated": output_tokens, "totalTokensEstimated": input_tokens + output_tokens}

@app.get("/api/project-agent/skills")
async def get_skills():
    return {"skills": list_skills(), "mcpServers": list_mcp_servers()}

@app.get("/api/project-agent/sessions/{session_id}")
async def get_session(session_id: str):
    return {"sessionId": session_id, "messages": db_get_session(session_id)}

@app.get("/api/project-agent/projects/{project_id}")
async def get_project_state(project_id: str):
    return db_get_project_state(project_id) or {"projectId": project_id, "attachments": [], "graph": [], "reviews": []}


@app.post("/api/project-agent/config")
async def save_config(config: AgentConfig):
    try:
        configure(config.apiKey, config.model, config.baseUrl)
        return config_status()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post("/api/project-agent/model")
async def save_model(config: AgentModel):
    try:
        from .agent import update_model
        update_model(config.model)
        return config_status()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/project-agent")
async def project_agent(request: dict[str, Any]):
    if request.get("action") not in {"chat", "generate", "update", "review"}:
        raise HTTPException(status_code=400, detail="不支持的 Agent action")
    try:
        session_id = request.get("sessionId", "default")
        messages = db_get_session(session_id)
        messages.append({"role": "user", "text": request.get("message", "")})
        result = await invoke(request)
        if request.get("action") == "generate":
            result = normalize_project_graph(result)
        project_id = request.get("projectId", "current-project")
        state = db_get_project_state(project_id) or {"projectId": project_id, "attachments": [], "graph": [], "reviews": [], "edits": []}
        if request.get("action") == "generate":
            state.update({key: result[key] for key in ("projectName", "summary", "graph") if key in result})
            state["attachments"] = result.get("attachments", request.get("attachments", []))
        elif request.get("action") == "update":
            state["edits"].append(result)
            if result.get("graph") is not None: state["graph"] = result["graph"]
        elif request.get("action") == "review":
            state["reviews"].append(result)
        save_project_state(project_id, state)
        messages.append({"role": "agent", "text": result.get("message", ""), "result": result})
        save_session(session_id, messages)
        increment_usage(len(str(request.get("message", ""))), len(str(result.get("message", ""))))
        result["sessionId"] = session_id
        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=503 if "尚未配置" in str(exc) else 502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent 调用失败：{exc}") from exc
