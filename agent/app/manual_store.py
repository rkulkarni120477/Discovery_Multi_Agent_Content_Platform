"""Execution support for the separate manual workflow graph instances."""

from __future__ import annotations

import os
import sqlite3
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor
from functools import wraps
from typing import Any

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command, interrupt

_executor = ThreadPoolExecutor(max_workers=4)
_lock = threading.Lock()
_errors: dict[str, str] = {}
_in_flight: set[str] = set()

APPROVE_STEP = "__approve_manual_step__"


def config(run_id: str) -> dict[str, dict[str, str]]:
    return {"configurable": {"thread_id": run_id}}


def _invoke(graph: Any, run_id: str, payload: Any) -> None:
    try:
        graph.invoke(payload, config=config(run_id))
        with _lock:
            _errors.pop(run_id, None)
    except Exception:  # noqa: BLE001
        with _lock:
            _errors[run_id] = traceback.format_exc()
    finally:
        with _lock:
            _in_flight.discard(run_id)


def start_run(graph: Any, run_id: str, initial_state: dict[str, Any]) -> None:
    with _lock:
        _in_flight.add(run_id)
    _executor.submit(_invoke, graph, run_id, initial_state)


def approve_step(graph: Any, run_id: str) -> None:
    with _lock:
        _in_flight.add(run_id)
    _executor.submit(_invoke, graph, run_id, Command(resume=APPROVE_STEP))


def accept_checkpoint(graph: Any, run_id: str, value: Any) -> None:
    with _lock:
        _in_flight.add(run_id)
    _executor.submit(_invoke, graph, run_id, Command(resume=value))


def get_state(graph: Any, run_id: str):
    return graph.get_state(config(run_id))


def get_last_error(run_id: str) -> str | None:
    with _lock:
        return _errors.get(run_id)


def is_in_flight(run_id: str) -> bool:
    with _lock:
        return run_id in _in_flight


def manual_step(step: int, name: str, fn: Any) -> Any:
    @wraps(fn)
    def wrapped(state: dict[str, Any]) -> Any:
        decision = interrupt({
            "type": "manual_approval",
            "step": step,
            "name": name,
            "message": "Review this step and approve it to execute the step.",
        })
        if decision != APPROVE_STEP:
            return state
        return fn(state)

    return wrapped


def create_checkpointer(filename: str) -> SqliteSaver:
    path = os.environ.get("DISCOVERY_MANUAL_CHECKPOINT_DB", f"./data/{filename}")
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    return SqliteSaver(sqlite3.connect(path, check_same_thread=False))
