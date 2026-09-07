"""Scenario 1 endpoints -- NGSS-to-state-science-standards crosswalk (e.g. South Carolina).

  POST /scenario1/runs                  start a run
  GET  /scenario1/runs/{run_id}         current phase/step + pending interrupt (if paused)
  POST /scenario1/runs/{run_id}/resume  submit a human decision to resume a paused run
  GET  /scenario1/runs/{run_id}/result  final package once complete
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import store
from app.graph_scenario1 import get_compiled_graph
from app.state_scenario1 import PHASES, TOTAL_STEPS
from app.status import RunStatusResponse, build_status

router = APIRouter(prefix="/scenario1", tags=["scenario1"])


class DocumentIn(BaseModel):
    filename: str
    text: str


class RunCreateRequest(BaseModel):
    job_id: str
    existing_product_content: DocumentIn
    sc_standards_reference: DocumentIn
    sc_performance_targets: DocumentIn
    sc_vertical_articulation: DocumentIn


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
            "existing_product_content": request.existing_product_content.model_dump(),
            "sc_standards_reference": request.sc_standards_reference.model_dump(),
            "sc_performance_targets": request.sc_performance_targets.model_dump(),
            "sc_vertical_articulation": request.sc_vertical_articulation.model_dump(),
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
