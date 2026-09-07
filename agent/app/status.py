"""Shared run-status response model + builder, used by both the Scenario 2 and Scenario 3 routers
so the "what's the current phase/step, and is there a pending interrupt" logic exists exactly once.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException
from pydantic import BaseModel

from app import store


class RunStatusResponse(BaseModel):
    run_id: str
    status: str
    phase: Optional[str] = None
    step: Optional[int] = None
    total_steps: int
    phases: list[str]
    interrupt_type: Optional[str] = None
    interrupt_payload: Optional[dict[str, Any]] = None
    error: Optional[str] = None


def build_status(graph: Any, run_id: str, total_steps: int, phases: list[str]) -> RunStatusResponse:
    snapshot = store.get_state(graph, run_id)
    if snapshot is None or not snapshot.values:
        raise HTTPException(status_code=404, detail="run not found")

    values = snapshot.values
    error = store.get_last_error(run_id)

    interrupt_type = None
    interrupt_payload = None
    for task in snapshot.tasks:
        if task.interrupts:
            payload = task.interrupts[0].value
            interrupt_type = payload.get("type") if isinstance(payload, dict) else None
            interrupt_payload = payload if isinstance(payload, dict) else {"value": payload}
            break

    if error:
        status = "error"
    elif values.get("status") == "complete":
        status = "complete"
    elif interrupt_type:
        status = "paused"
    else:
        status = "running"

    return RunStatusResponse(
        run_id=run_id,
        status=status,
        phase=values.get("phase"),
        step=values.get("step"),
        total_steps=total_steps,
        phases=phases,
        interrupt_type=interrupt_type,
        interrupt_payload=interrupt_payload,
        error=error,
    )
