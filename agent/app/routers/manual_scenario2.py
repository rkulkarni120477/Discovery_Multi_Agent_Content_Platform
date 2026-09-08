from __future__ import annotations
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app import manual_store
from app.manual_graph import get_compiled_graph
from app.manual_status import ManualRunStatusResponse, build_status
from app.state import PHASES

router = APIRouter(prefix="/manual/scenario2", tags=["manual-scenario2"])
class DocumentIn(BaseModel):
    filename: str
    text: str
class RunCreateRequest(BaseModel):
    job_id: str
    lesson: DocumentIn
    literacy_strategy: DocumentIn
class ResumeRequest(BaseModel):
    value: Any = None
TOTAL_STEPS = 27

def status(run_id: str) -> ManualRunStatusResponse:
    return build_status(get_compiled_graph(), run_id, TOTAL_STEPS, PHASES)

@router.post("/runs")
def create_run(request: RunCreateRequest):
    initial = {"job_id": request.job_id, "status": "running", "documents": {"lesson": request.lesson.model_dump(), "literacy_strategy": request.literacy_strategy.model_dump()}}
    manual_store.start_run(get_compiled_graph(), request.job_id, initial)
    return {"run_id": request.job_id, "status": "running"}

@router.get("/runs/{run_id}", response_model=ManualRunStatusResponse)
def get_run(run_id: str): return status(run_id)

@router.post("/runs/{run_id}/approve", response_model=ManualRunStatusResponse)
def approve(run_id: str):
    current = status(run_id)
    if current.status not in {"paused", "error"} or current.interrupt_type != "manual_approval": raise HTTPException(status_code=409, detail="manual run is not waiting for step approval")
    manual_store.clear_error(run_id)
    manual_store.approve_step(get_compiled_graph(), run_id)
    return status(run_id)

@router.post("/runs/{run_id}/resume", response_model=ManualRunStatusResponse)
def resume(run_id: str, request: ResumeRequest):
    current = status(run_id)
    if current.status != "paused" or current.interrupt_type == "manual_approval": raise HTTPException(status_code=409, detail="manual run is not waiting for a review decision")
    manual_store.accept_checkpoint(get_compiled_graph(), run_id, request.value if request.value is not None else "__accept_ai_recommendation__")
    return status(run_id)

@router.get("/runs/{run_id}/result")
def result(run_id: str):
    current = status(run_id)
    if current.status != "complete": raise HTTPException(status_code=409, detail=f"run is '{current.status}', not complete")
    return manual_store.get_state(get_compiled_graph(), run_id).values.get("final_package", {})
