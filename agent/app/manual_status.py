from __future__ import annotations

from typing import Any
from fastapi import HTTPException
from pydantic import BaseModel
from app import manual_store

class ManualRunStatusResponse(BaseModel):
    run_id: str
    status: str
    phase: str | None = None
    step: int | None = None
    total_steps: int
    phases: list[str]
    interrupt_type: str | None = None
    interrupt_payload: dict[str, Any] | None = None
    error: str | None = None


def build_status(graph: Any, run_id: str, total_steps: int, phases: list[str]) -> ManualRunStatusResponse:
    snapshot = manual_store.get_state(graph, run_id)
    if snapshot is None or not snapshot.values:
        raise HTTPException(status_code=404, detail="manual run not found")

    interrupt_type = None
    interrupt_payload = None
    for task in snapshot.tasks:
        if task.interrupts:
            payload = task.interrupts[0].value
            interrupt_type = payload.get("type") if isinstance(payload, dict) else None
            interrupt_payload = payload if isinstance(payload, dict) else {"value": payload}
            break

    values = snapshot.values
    error = manual_store.get_last_error(run_id)
    step = interrupt_payload.get("step") if interrupt_payload else values.get("step")
    status = "error" if error else "complete" if values.get("status") == "complete" else "paused" if interrupt_type else "running"
    return ManualRunStatusResponse(
        run_id=run_id,
        status=status,
        phase=values.get("phase"),
        step=step,
        total_steps=total_steps,
        phases=phases,
        interrupt_type=interrupt_type,
        interrupt_payload=interrupt_payload,
        error=error,
    )
