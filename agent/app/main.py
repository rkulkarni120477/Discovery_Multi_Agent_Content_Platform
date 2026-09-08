"""FastAPI wrapper around the Scenario 1, Scenario 2, and Scenario 3 LangGraph agents.

See app/routers/scenario1.py, scenario2.py, and scenario3.py for each scenario's endpoints -- all
three follow the same shape (POST .../runs, GET/POST .../runs/{run_id}[/resume|/result]) over their
own compiled graph and checkpointer.
"""

from __future__ import annotations

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import manual_scenario1, manual_scenario2, manual_scenario3, scenario1, scenario2, scenario3

load_dotenv()

app = FastAPI(title="Discovery Education Scenario Agents")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenario1.router)
app.include_router(scenario2.router)
app.include_router(scenario3.router)
app.include_router(manual_scenario1.router)
app.include_router(manual_scenario2.router)
app.include_router(manual_scenario3.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
