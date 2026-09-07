"""Scenario 2 endpoints -- literacy-strategy integration.

  POST /scenario2/runs                  start a run
  GET  /scenario2/runs/{run_id}         current phase/step + pending interrupt (if paused)
  POST /scenario2/runs/{run_id}/resume  submit a human decision to resume a paused run
  GET  /scenario2/runs/{run_id}/result  final package once complete
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import store
from app.graph import get_compiled_graph
from app.state import PHASES
from app.status import RunStatusResponse, build_status

TOTAL_STEPS = 27

router = APIRouter(prefix="/scenario2", tags=["scenario2"])


class DocumentIn(BaseModel):
    filename: str
    text: str


class RunCreateRequest(BaseModel):
    job_id: str
    lesson_1: DocumentIn
    lesson_2: DocumentIn
    lesson_3: DocumentIn
    literacy_strategy: DocumentIn


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
            "lesson_1": request.lesson_1.model_dump(),
            "lesson_2": request.lesson_2.model_dump(),
            "lesson_3": request.lesson_3.model_dump(),
            "literacy_strategy": request.literacy_strategy.model_dump(),
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


@router.get("/runs/{run_id}/result")
def get_result(run_id: str) -> dict:
    status = _status(run_id)
    if status.status != "complete":
        raise HTTPException(status_code=409, detail=f"run is '{status.status}', not complete")
    snapshot = store.get_state(get_compiled_graph(), run_id)
    return snapshot.values.get("final_package", {})
