"""API for ordered, manually-approved combinations of source scenario steps."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app import manual_store
from app.custom_graph import compile_graph, resolve_step
from app.manual_status import ManualRunStatusResponse, build_status

router = APIRouter(prefix="/custom", tags=["custom"])
_graphs: dict[str, Any] = {}


class SelectedStep(BaseModel):
    scenario: str
    node: str

    @field_validator("scenario")
    @classmethod
    def normalize_scenario(cls, value: str) -> str:
        normalized = {"1": "scenario1", "2": "scenario2", "3": "scenario3"}.get(value, value)
        if normalized not in {"scenario1", "scenario2", "scenario3"}:
            raise ValueError("scenario must be scenario1, scenario2, or scenario3")
        return normalized


class RunCreateRequest(BaseModel):
    job_id: str
    selected_steps: list[SelectedStep] = Field(min_length=1)
    source_states: dict[str, dict[str, Any]] = Field(default_factory=dict)


class ResumeRequest(BaseModel):
    value: Any = None


def _graph(run_id: str) -> Any:
    graph = _graphs.get(run_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="custom run not found")
    return graph


def status(run_id: str) -> ManualRunStatusResponse:
    graph = _graph(run_id)
    return build_status(graph, run_id, len(manual_store.get_state(graph, run_id).values["selected_steps"]), ["Custom scenario"])


@router.post("/runs")
def create_run(request: RunCreateRequest):
    selections = [step.model_dump() for step in request.selected_steps]
    try:
        for selection in selections:
            resolve_step(selection["scenario"], selection["node"])
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    graph = compile_graph(selections)
    _graphs[request.job_id] = graph
    initial: dict[str, Any] = {"job_id": request.job_id, "status": "running", "phase": "Custom scenario", "selected_steps": selections}
    for scenario in ("scenario1", "scenario2", "scenario3"):
        if scenario in request.source_states:
            initial[scenario] = request.source_states[scenario]
    manual_store.start_run(graph, request.job_id, initial)
    return {"run_id": request.job_id, "status": "running"}


@router.get("/runs/{run_id}", response_model=ManualRunStatusResponse)
def get_run(run_id: str):
    return status(run_id)


@router.post("/runs/{run_id}/approve", response_model=ManualRunStatusResponse)
def approve(run_id: str):
    graph = _graph(run_id)
    current = status(run_id)
    if current.status not in {"paused", "error"} or current.interrupt_type != "manual_approval":
        raise HTTPException(status_code=409, detail="custom run is not waiting for step approval")
    manual_store.clear_error(run_id)
    manual_store.approve_step(graph, run_id)
    return status(run_id)


@router.post("/runs/{run_id}/resume", response_model=ManualRunStatusResponse)
def resume(run_id: str, request: ResumeRequest):
    graph = _graph(run_id)
    current = status(run_id)
    if current.status != "paused" or current.interrupt_type == "manual_approval":
        raise HTTPException(status_code=409, detail="custom run is not waiting for a source review decision")
    manual_store.accept_checkpoint(graph, run_id, request.value if request.value is not None else "__accept_ai_recommendation__")
    return status(run_id)


@router.get("/runs/{run_id}/result")
def result(run_id: str):
    graph = _graph(run_id)
    current = status(run_id)
    if current.status != "complete":
        raise HTTPException(status_code=409, detail=f"run is '{current.status}', not complete")
    return manual_store.get_state(graph, run_id).values.get("final_package", {})