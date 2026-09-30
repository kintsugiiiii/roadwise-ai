"""Small file-backed SQLite store for the local Roadwise prototype."""

import json
import os
import sqlite3
from pathlib import Path
from typing import Any


DATA_DIR = Path(os.getenv("ROADWISE_DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "roadwise.db"


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with _connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                messages_json TEXT NOT NULL DEFAULT '[]',
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS project_states (
                project_id TEXT PRIMARY KEY,
                state_json TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS usage_stats (
                name TEXT PRIMARY KEY,
                value INTEGER NOT NULL DEFAULT 0
            );
            """
        )


def get_session(session_id: str) -> list[dict[str, Any]]:
    with _connect() as connection:
        row = connection.execute("SELECT messages_json FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
    return json.loads(row["messages_json"]) if row else []


def save_session(session_id: str, messages: list[dict[str, Any]]) -> None:
    with _connect() as connection:
        connection.execute(
            "INSERT INTO sessions(session_id, messages_json) VALUES (?, ?) "
            "ON CONFLICT(session_id) DO UPDATE SET messages_json=excluded.messages_json, updated_at=CURRENT_TIMESTAMP",
            (session_id, json.dumps(messages, ensure_ascii=False)),
        )


def get_project_state(project_id: str) -> dict[str, Any] | None:
    with _connect() as connection:
        row = connection.execute("SELECT state_json FROM project_states WHERE project_id = ?", (project_id,)).fetchone()
    return json.loads(row["state_json"]) if row else None


def save_project_state(project_id: str, state: dict[str, Any]) -> None:
    with _connect() as connection:
        connection.execute(
            "INSERT INTO project_states(project_id, state_json) VALUES (?, ?) "
            "ON CONFLICT(project_id) DO UPDATE SET state_json=excluded.state_json, updated_at=CURRENT_TIMESTAMP",
            (project_id, json.dumps(state, ensure_ascii=False)),
        )


def increment_usage(input_chars: int, output_chars: int) -> dict[str, int]:
    with _connect() as connection:
        for name, amount in (("requests", 1), ("inputChars", input_chars), ("outputChars", output_chars)):
            connection.execute(
                "INSERT INTO usage_stats(name, value) VALUES (?, ?) "
                "ON CONFLICT(name) DO UPDATE SET value=value + excluded.value",
                (name, amount),
            )
        rows = connection.execute("SELECT name, value FROM usage_stats").fetchall()
    return {row["name"]: row["value"] for row in rows}


init_db()
