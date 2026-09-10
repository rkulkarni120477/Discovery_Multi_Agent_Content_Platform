# Discovery Education — Scenario Agents

A three-service application automating all three scenarios from Discovery Education's solution
workbook, sharing one web client, one Express API, and one agent codebase (each scenario is its own
LangGraph graph):

- **Scenario 1 — NGSS-to-State Standards Crosswalk**: given the product's existing K-5 content
  with implemented NGSS alignment and a target state's science standards, performance targets, and
  vertical articulation documents, scans the content to inventory its NGSS alignment, crosswalks
  it against the state's standards, identifies deltas, maps performance targets, validates
  grade-level depth across all three dimensions of three-dimensional learning (SEP/DCI/CCC),
  defines evidence criteria, classifies every requirement as Strong/Partial/Gap, identifies
  specific gaps, recommends remediation, and runs a final QA pass for
  accuracy/consistency/traceability/completeness through a fully automated workflow.
- **Scenario 2 — Literacy Strategy Integration**: given three candidate "Explore" science lessons
  and a literacy-strategy reference document, screens the strongest lesson/strategy combination,
  deeply analyzes the selected lesson, plans and drafts a revision, runs five parallel QA passes,
  and produces a final revised lesson with full rationale through a fully automated workflow.
- **Scenario 3 — State Standards Alignment**: given a unit's scope-and-sequence document, an
  authoritative state-standards reference, and its lesson + educator-support files, crosswalks the
  unit's existing (C3 framework) standards against the target state's standards, maps lesson
  content to each standard, analyzes gaps and surplus content, plans and drafts revisions, and
  produces a final alignment package through a fully automated workflow.

## Architecture

```
web/    Next.js 14 (App Router) + React + TypeScript — a scenario picker, per-scenario upload
        pages, a unified phase-timeline job dashboard (with delete), review screens for each
        scenario's human checkpoints, and a final package view + .docx download.
api/    Node.js + Express + TypeScript — REST API. Parses uploaded .docx/.pdf/.txt files, tracks
        jobs (tagged by scenario), proxies to the agent service, exports final packages as .docx.
agent/  Python + LangGraph + FastAPI — three independent LangGraph StateGraphs (one per scenario,
        own nodes, own SQLite checkpointer file), each with interrupt()-based human checkpoints,
        wrapped by three FastAPI routers with an identical shape.
```

Request flow: **browser → Next.js (client-side fetch) → Express API → FastAPI agent service →
LangGraph graph (OpenAI via `langchain-openai`)**. The Express API is the only service the browser
talks to; it never talks to OpenAI directly.

**Job routing convention**: creating a run is scenario-specific (`POST /api/scenario1/jobs` for
Scenario 1, `POST /api/jobs` for Scenario 2, `POST /api/scenario3/jobs` for Scenario 3), but every
other operation — list, status, resume, result, `.docx` export, delete — is unified under
`/api/jobs/*`, because every job id is a globally-unique UUID and the Express API stores which
scenario created it. The same unification exists one layer down: the agent exposes
`/scenario1/runs/*`, `/scenario2/runs/*`, and `/scenario3/runs/*` with an identical shape, backed by
a shared `store.py` that's generic over "which compiled graph" so the run/resume/status/error
machinery isn't duplicated per scenario.

## Scenario 1 phases → graph nodes

| Phase | Steps | Graph nodes | Human checkpoint |
|---|---|---|---|
| Standards Crosswalk | 1–3 | `inventory_ngss_alignment → crosswalk_ngss_to_sc → identify_sc_deltas` | — |
| Performance Target Mapping & Validation | 4–5 | `map_performance_targets → validate_grade_level_depth` | — |
| Content Alignment Review | 6–8 | `define_alignment_criteria → review_discovery_evidence → classify_strong_partial_gap` | — |
| Gap Analysis & Remediation | 9–10 | `identify_specific_gaps → recommend_remediation` | — |
| QA & Finalization | 11 | `qa_and_finalize → produce_final_package` | — |

See `agent/app/graph_scenario1.py` for the exact wiring and `agent/app/nodes/scenario1/*.py` for
each step's prompt. `validate_grade_level_depth` produces one row per (standard, dimension) pair —
up to three rows per SC standard, one each for SEP (Science and Engineering Practices), DCI
(Disciplinary Core Ideas), and CCC (Crosscutting Concepts), the three dimensions of
three-dimensional NGSS-style science learning. The final package still carries a fixed,
non-LLM-generated note flagging South Carolina's Grade 4 assessment requirements as out of scope
(from the original source email) for visibility, even though it isn't one of the 11 canonical
steps. Scenario 1 is fully automated: the AI makes the grade-level-depth and gap/remediation
decisions directly, with no human-in-the-loop pauses.

## Scenario 2 phases → graph nodes

| Phase (spreadsheet) | Steps | Graph nodes | Human checkpoint |
|---|---|---|---|
| Gather & Organize | 1–3 | `intake → catalog_metadata → extract_strategies` | — |
| Understand & Screen | 4–7 | `summarize_lessons → analyze_strategies → screen_combinations` | — |
| Deep Instructional Analysis | 8–11 | `deep_review → map_literacy_demands → find_integration_points` | — |
| Revision Planning | 12–14 | `plan_revision` | — |
| Content Development | 15–18 | `draft_student_content → draft_teacher_content → update_connected_components → write_rationale` | — |
| Quality Assurance | 19–23 | `qa_literacy_fidelity` + `qa_science_accuracy` + `qa_instructional_integrity` + `qa_coherence_pacing` + `qa_consistency` (parallel) `→ aggregate_qa` | — |
| Finalization | 24–27 | `incorporate_feedback → re_review → finalize → produce_final_package` | — |

See `agent/app/graph.py` for the exact wiring and `agent/app/nodes/*.py` for each step's prompt.

## Scenario 3 phases → graph nodes

| Phase (spreadsheet) | Steps | Graph nodes | Human checkpoint |
|---|---|---|---|
| Gather & Organize | 1–4 | `identify_grade_level → acquire_standards → extract_c3_alignment → build_crosswalk` | **`review_crosswalk`** |
| Read & Map | 5–6 | `summarize_lessons → map_to_standards` | **`review_alignment_map`** |
| Gap Analysis | 7–8 | `compile_gap_list → identify_surplus` | — |
| Revision Planning | 9–10 | `plan_and_place_revisions` | **`review_revision_plan`** |
| Content Drafting | 11–13 | `draft_content → write_rationale → update_scope_sequence` | — |
| Quality Assurance | 14–16 | `coherence_review → final_coverage_verification → editorial_review → produce_final_package` | — |

See `agent/app/graph_scenario3.py` for the exact wiring and `agent/app/nodes/scenario3/*.py` for
each step's prompt.

**Scope decision, flagged rather than silently made**: both Scenario 1's step 2 ("acquire the
state's standards") and Scenario 3's step 2 describe an external web-lookup against the state
education department's site. This agent has no web-browsing tool wired in, so instead of letting
the model hallucinate official standards from training data, both scenarios require the caller to
upload an authoritative standards-reference document — the same "supplied reference resource"
pattern Scenario 2 already uses for its literacy-strategy document. The relevant node still does
exactly what that step asks of the AI (parse and structure the source into a clean, ID'd reference);
it just doesn't go find that source itself.

## Running it locally

Three terminals, three services:

### 1. Agent service (Python)

```bash
cd agent
python -m venv .venv
./.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # then set OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 2. API service (Node.js)

```bash
cd api
npm install
cp .env.example .env            # defaults point at localhost:8000 / localhost:3000
npm run dev                     # http://localhost:4000
```

### 3. Web client (Next.js)

```bash
cd web
npm install
cp .env.example .env.local      # defaults to http://localhost:4000
npm run dev                     # http://localhost:3000
```

Open `http://localhost:3000`, pick a scenario from the dropdown, and upload its source documents:
- **Scenario 1**: existing product content (the agent scans its implemented NGSS citations), state
  standards reference (2 single-file uploads). The API automatically uses the supplied South
  Carolina performance-target and vertical-articulation PDFs in `Documents/Scenario 1/`.
  Completed runs also provide a dedicated recommendations and remediations page, in addition to
  including the same analysis in the final package.
- **Scenario 2**: 3 lesson files + 1 literacy-strategy resource (`.docx`, `.pdf`, `.txt`, or `.md`).
- **Scenario 3**: 1 scope-and-sequence document, 1 state-standards reference document, and 1+
  lesson/educator-support files (same formats).

The `/jobs` dashboard lists every run across all three scenarios, with a delete action per row
(`DELETE /api/jobs/:id` — removes the job from the dashboard only; the underlying agent checkpoint
data is untouched) and a link back to the scenario picker.

### API documentation

- Agent (FastAPI, auto-generated): `http://localhost:8000/docs`
- API (Express, via `swagger-jsdoc`): `http://localhost:4000/docs`

## Verification performed during this build

- **All three agent smoke tests pass against a real OpenAI key**, driving each compiled graph
  through every step and every checkpoint, using the synthetic fixtures in
  `agent/tests/fixtures_scenario1/`, `agent/tests/fixtures/` (Scenario 2), and
  `agent/tests/fixtures_scenario3/`:
  ```bash
  cd agent && OPENAI_API_KEY=sk-... ./.venv/Scripts/python.exe -m pytest tests/ -v
  # tests/test_smoke.py::test_full_run_reaches_final_package PASSED
  # tests/test_smoke_scenario1.py::test_full_run_reaches_final_package PASSED
  # tests/test_smoke_scenario3.py::test_full_run_reaches_final_package PASSED
  ```
  (`conftest.py` also loads `agent/.env` automatically, so the key doesn't have to be repeated on
  the command line once it's in that file.)
- **A full live run of Scenario 1 and of Scenario 3 were each driven end-to-end through the real
  HTTP stack** — web-facing API → agent → LangGraph → OpenAI — via `curl` against the running
  services: job creation, every checkpoint resumed, completion, result fetch, and `.docx` download
  all confirmed working, with genuinely coherent model output (correct crosswalk classifications,
  sound grade-level-depth judgments, full standards coverage where expected).
- **Scenario 1 was later restructured** from its original 8-step form to an 11-step form (adding an
  explicit evidence-criteria-definition step, a Strong/Partial/Gap classification step, split
  gap-identification/remediation steps, a dedicated QA & Finalize pass, and SEP/DCI/CCC-dimensioned
  grade-level-depth rows) to match a refined process description. That restructure was re-verified
  the same way: the smoke test and a full live HTTP run both passed again, including confirming the
  new three-rows-per-standard (SEP/DCI/CCC) shape came back correctly reasoned from the model.
- **A real bug was found and fixed during that verification**: this LangGraph version
  (`langgraph==1.2.11`) throws `UnboundLocalError: resume_is_map` if a checkpoint is resumed with a
  literal `Command(resume=None)` — `None` is LangGraph's own internal sentinel for "not resuming at
  all," which collided with this codebase's convention of "pass null to accept the AI's
  recommendation." Fixed by introducing an explicit `NO_OVERRIDE` sentinel string in
  `agent/app/store.py`: all three routers translate an incoming `null`/omitted `value` to that
  sentinel before it ever reaches LangGraph, and every checkpoint node (all 8, across all three
  scenarios) checks for that sentinel explicitly rather than doing a truthiness check. The
  HTTP-level contract ("omit or pass null to accept the recommendation") is unchanged — the fix is
  entirely internal to the agent service.
- **A real backward-compatibility issue was found and fixed**: `api/data/jobs.json` already
  contained real, in-progress Scenario 2 jobs from actual use of the app before the multi-scenario
  change (including one paused at a live checkpoint, awaiting review) — none of them had the new
  `scenario` field. `api/src/db.ts` now migrates any job record missing that field to `"scenario2"`
  on first read (the only scenario that could have created it), persisting the migration back to
  disk, so no in-progress work was lost.
- The Next.js app was typechecked (`tsc --noEmit`) and production-built (`next build`); all 7 routes
  (`/`, `/jobs`, `/jobs/[id]`, `/scenario1`, `/scenario2`, `/scenario3`, plus the Next.js 404 page)
  compiled and render without server errors. **Not verified**: interactive behavior in an actual
  browser (no browser-automation tool was available in this environment) — please click through all
  three golden paths yourself.
- The Express API was typechecked and exercised directly with `curl` (job creation for all three
  scenarios, status polling, resume, result, `.docx` download, delete).

## Known follow-ups (explicitly out of scope for this build)

- **No authentication.** Matches the pattern of the other in-house Atlas accelerators referenced in
  the source spreadsheet, none of which mention auth — but add one before any non-local deployment.
- **No production deployment config** (Docker/K8s/etc.) — dev-mode instructions only.
- **Local-disk persistence only**: the API's job store is a flat JSON file
  (`api/data/jobs.json`) and each scenario's checkpointer is a local SQLite file
  (`agent/data/checkpoints_scenario1.db`, `checkpoints.db`, `checkpoints_scenario3.db`) — fine for a
  single-instance deployment, not for horizontal scaling.
- **Test coverage** is one end-to-end smoke test per scenario, not a full suite.
- **Scenario 1's and Scenario 3's "acquire standards" steps require an uploaded reference document**
  rather than live-sourcing the state's official standards (see the flagged scope decision above) —
  wiring in a real web-search/fetch tool would let those nodes work the way the spreadsheet
  originally describes.
- **Deleting a job** only removes it from the Express API's dashboard store — it does not delete
  the corresponding thread from the agent's SQLite checkpointer, so the underlying run data persists
  there, just unreachable through the app.
- `better-sqlite3` was deliberately avoided for the API's job store (it requires a native C++ build
  toolchain that isn't guaranteed to be present on every dev machine — it wasn't in this one); the
  flat-file store can be swapped for a real database later without touching any route logic beyond
  `api/src/db.ts`.

## A note on this repository's git setup

`git status` at the start of this build showed the repository root is actually the Windows user
profile folder (`C:\Users\RahulSudhakar`), not this project directory — on branch `dev`, no commits
yet, remote `AcademianSolutions/Content-AI-Studio-`. That means the untracked-file list includes
unrelated home-directory content. No git commands were run as part of this build; you may want to
re-scope the repository to this project folder (or a dedicated one) before committing anything.
