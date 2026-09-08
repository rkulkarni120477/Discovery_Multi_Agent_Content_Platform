"""Scenario 3 endpoints -- Oregon (or any state) C3-to-state-standards alignment.

  POST /scenario3/runs                  start a run
  GET  /scenario3/runs/{run_id}         current phase/step + pending interrupt (if paused)
  POST /scenario3/runs/{run_id}/resume  submit a human decision to resume a paused run
  GET  /scenario3/runs/{run_id}/result  final package once complete
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import store
from app.graph_scenario3 import get_compiled_graph
from app.state_scenario3 import PHASES, TOTAL_STEPS
from app.status import RunStatusResponse, build_status

router = APIRouter(prefix="/scenario3", tags=["scenario3"])


class DocumentIn(BaseModel):
    filename: str
    text: str


class RunCreateRequest(BaseModel):
    job_id: str
    scope_sequence: DocumentIn
    standards_reference: DocumentIn
    lesson_files: list[DocumentIn]


class RunCreateResponse(BaseModel):
    run_id: str
    status: str


class ResumeRequest(BaseModel):
    value: Any = None


def _status(run_id: str) -> RunStatusResponse:
    return build_status(get_compiled_graph(), run_id, TOTAL_STEPS, PHASES)


@router.post("/runs", response_model=RunCreateResponse)
def create_run(request: RunCreateRequest) -> RunCreateResponse:
    initial_state = {
        "job_id": request.job_id,
        "status": "running",
        "documents": {
            "scope_sequence": request.scope_sequence.model_dump(),
            "standards_reference": request.standards_reference.model_dump(),
            "lesson_files": [f.model_dump() for f in request.lesson_files],
        },
    }
    store.start_run(get_compiled_graph(), request.job_id, initial_state)
    return RunCreateResponse(run_id=request.job_id, status="running")


@router.get("/runs/{run_id}", response_model=RunStatusResponse)
def get_run(run_id: str) -> RunStatusResponse:
    return _status(run_id)


@router.post("/runs/{run_id}/resume", response_model=RunStatusResponse)
def resume_run(run_id: str, request: ResumeRequest) -> RunStatusResponse:
    current = _status(run_id)
    if current.status != "paused":
        raise HTTPException(status_code=409, detail=f"run is '{current.status}', not paused")
    resume_value = request.value if request.value is not None else store.NO_OVERRIDE
    store.resume_run(get_compiled_graph(), run_id, resume_value)
    return _status(run_id)


@router.post("/runs/{run_id}/pause", response_model=RunStatusResponse)
def pause_workflow(run_id: str) -> RunStatusResponse:
    current = _status(run_id)
    if current.status in {"complete", "error"}:
        raise HTTPException(status_code=409, detail=f"run is '{current.status}'")
    store.pause_run(run_id)
    return _status(run_id)


@router.post("/runs/{run_id}/resume-workflow", response_model=RunStatusResponse)
def resume_workflow(run_id: str) -> RunStatusResponse:
    store.resume_workflow(run_id)
    return _status(run_id)


@router.post("/runs/{run_id}/next", response_model=RunStatusResponse)
def next_step(run_id: str) -> RunStatusResponse:
    current = _status(run_id)
    if current.status != "paused" or current.interrupt_type != "manual_step":
        raise HTTPException(status_code=409, detail="run is not waiting for a manual step")
    store.resume_run(get_compiled_graph(), run_id, store.MANUAL_ADVANCE)
    return _status(run_id)


@router.get("/runs/{run_id}/result")
def get_result(run_id: str) -> dict:
    status = _status(run_id)
    if status.status != "complete":
        raise HTTPException(status_code=409, detail=f"run is '{status.status}', not complete")
    snapshot = store.get_state(get_compiled_graph(), run_id)
    return snapshot.values.get("final_package", {})
