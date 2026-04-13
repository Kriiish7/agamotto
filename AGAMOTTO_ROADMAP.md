# Agamotto Project Roadmap

> Based on `AGAMOTTO.md`, adapted to the current repository state on 13 April 2026.

## 1. Project Snapshot

**Project name:** Agamotto  
**Full title:** Adaptive, Constraint-Aware Intelligent Scheduling System  
**Primary goal:** Build a native Rust desktop app that generates explainable, adaptive schedules for students and solo knowledge workers.  
**Current state:** GPUI starter app with a single `Hello, World!` screen.  
**Target end state:** A multi-screen desktop application with scheduling algorithms, local ML models, natural-language task entry, analytics, persistence, testing, and NEA-ready documentation.

## 2. Product Vision

Agamotto should feel like a trusted planning assistant rather than a black-box AI. The system should:

- accept tasks quickly, including natural-language input
- generate schedules that respect time windows, priorities, and deadlines
- support two distinct modes: Serenity and Crunch
- explain why tasks were selected, ordered, or excluded
- learn from user behaviour locally on-device
- surface risk, workload, and planning insights visually
- persist all data across sessions

## 3. Core Success Criteria

The roadmap should be considered successful only if the delivered application can do all of the following:

- create a valid schedule from structured tasks
- produce meaningfully different outputs in Serenity and Crunch modes
- parse common task phrases into structured task fields
- show scheduling metrics and plain-English explanations
- improve estimates and recommendations after repeated use
- save and reload tasks, schedules, and ML history without corruption
- remain responsive with realistic task volumes
- provide enough evidence, testing, and rationale to support the NEA write-up

## 4. Delivery Strategy

The repository is currently a single-crate GPUI app, while `AGAMOTTO.md` describes a multi-module system. The safest path is to evolve the current app in layers instead of trying to build everything at once:

1. establish a maintainable internal architecture inside the current crate
2. implement a deterministic scheduling engine first
3. add explainability and metrics before ML
4. add persistence so behaviour can be observed across sessions
5. add ML only after stable task and schedule data exists
6. add NLP after the underlying task model is reliable
7. polish the UI last, once the core logic is stable

## 5. Recommended Repository Structure

This structure keeps responsibilities clear while still fitting a single-crate project:

```text
src/
  main.rs
  app/
    mod.rs
    state.rs
    actions.rs
  domain/
    mod.rs
    task.rs
    schedule.rs
    metrics.rs
    explanation.rs
    settings.rs
  scheduling/
    mod.rs
    greedy.rs
    knapsack.rs
    edf.rs
    energy.rs
    breaks.rs
    planner.rs
  ml/
    mod.rs
    knn.rs
    duration.rs
    risk.rs
    features.rs
  nlp/
    mod.rs
    parser.rs
    tokens.rs
  storage/
    mod.rs
    sqlite.rs
    models.rs
    migrations.rs
  ui/
    mod.rs
    theme.rs
    components/
    screens/
tests/
  scheduling/
  ml/
  nlp/
  integration/
docs/
  architecture.md
  testing.md
  nea-evidence.md
```

## 6. Multi-Phase Delivery Plan

### Phase 1: Project Foundation

**Purpose:** Replace the GPUI starter template with a maintainable application skeleton.

**Deliverables:**

- split the current single-file app into `app`, `domain`, `ui`, `scheduling`, `storage`, `ml`, and `nlp` modules
- define a shared error strategy and lightweight logging approach
- create an app shell with window bootstrap, navigation state, and placeholder screens
- decide the baseline crates for time handling, persistence, serialization, and testing

**Exit criteria:**

- the project compiles after the restructuring
- the app opens into a shell rather than a single hello-world panel
- new features can be added without putting all logic in `main.rs`

### Phase 2: Domain Model

**Purpose:** Establish the data model that every later feature depends on.

**Deliverables:**

- `Task`, `TaskType`, `Priority`, `Deadline`, `Mode`, `ScheduleItem`, and `Schedule` domain types
- settings model for available time window, chronotype, and break preferences
- validation rules for impossible or incomplete task data

**Exit criteria:**

- all later modules can depend on stable shared types
- invalid task inputs are rejected in one central place

### Phase 3: Manual Task Capture

**Purpose:** Let users create and manage real planning data before automation begins.

**Deliverables:**

- task creation form
- editable task list with add, update, delete, and complete actions
- in-memory app state for the active task backlog
- basic filters for incomplete, completed, and deadline-tagged tasks

**Exit criteria:**

- a user can build a day’s workload entirely through the UI
- edits are reflected immediately and predictably

### Phase 4: Serenity Scheduling Engine

**Purpose:** Deliver the calm-day scheduling path first.

**Deliverables:**

- greedy selection by priority-density
- tie-breaking rules for predictable output
- schedule slot assignment within the chosen time window
- tests for empty input, full-fit input, and overloaded input

**Exit criteria:**

- Serenity Mode reliably produces a sensible schedule
- repeated runs with identical input produce identical results

### Phase 5: Crunch Scheduling Engine

**Purpose:** Add the high-pressure, deadline-driven scheduling path.

**Deliverables:**

- 0/1 knapsack selection for overloaded workloads
- EDF ordering for tasks with deadlines
- deadline-aware scoring rules
- tests comparing knapsack results to brute-force references on small inputs

**Exit criteria:**

- Crunch Mode produces meaningfully different results from Serenity on overloaded workloads
- the selector handles edge cases without panics

### Phase 6: Schedule Metrics and Explainability

**Purpose:** Make the scheduler understandable and defensible.

**Deliverables:**

- utilisation metric
- productivity metric
- overload or stress metric
- deadline risk summary
- explanation generation for selected, deferred, and excluded tasks
- a visible “Why?” panel in the UI

**Exit criteria:**

- every schedule decision can be explained in plain English
- metrics match hand-checked sample cases from the design document

### Phase 7: Energy Mapping and Break Logic

**Purpose:** Improve realism and comfort without adding ML yet.

**Deliverables:**

- chronotype-based energy preference model
- slot assignment that places demanding tasks in stronger energy windows
- optional break insertion
- break configuration controls

**Exit criteria:**

- schedule timing changes in a sensible way when energy preferences change
- breaks never silently invalidate the schedule window

### Phase 8: Local Persistence

**Purpose:** Make Agamotto usable across sessions and prepare the ground for learning.

**Deliverables:**

- SQLite schema for tasks, settings, schedules, completion history, and ML events
- migration support
- load-on-start and save-on-change behaviour
- persistence tests covering save and reload

**Exit criteria:**

- app restarts preserve all critical user data
- schema changes are manageable as development continues

### Phase 9: History and Review Tools

**Purpose:** Give users and the developer visibility into past schedules and outcomes.

**Deliverables:**

- history screen for previous schedules
- completed-task timeline or ledger
- basic comparison view for estimated versus actual duration
- data hooks required for evaluation and stakeholder review

**Exit criteria:**

- past schedules can be reviewed after restart
- actual outcomes can be compared with planned outcomes

### Phase 10: Machine Learning Foundation

**Purpose:** Build the data pipeline and model interfaces before enabling adaptive behaviour.

**Deliverables:**

- event capture for task completion, actual duration, and missed deadlines
- feature extraction pipeline
- neutral fallback behaviour for cold start
- ML service boundaries that keep model code separate from scheduling code

**Exit criteria:**

- enough structured historical data is available for model updates
- the scheduler can call ML services without being tightly coupled to them

### Phase 11: Adaptive Models

**Purpose:** Add the three interpretable models described in `AGAMOTTO.md`.

**Deliverables:**

- k-NN preference profile
- duration correction model
- logistic risk model
- ML insights panel exposing learned state and correction factors
- manual override controls for learned outputs

**Exit criteria:**

- cold start remains safe
- duration estimates improve after repeated use
- users can inspect and override learned behaviour at any time

### Phase 12: Natural Language Input

**Purpose:** Reduce the friction of entering tasks.

**Deliverables:**

- duration parsing
- urgency parsing
- date and time parsing
- ambiguity handling with editable drafts or confirmation prompts
- NLP entry bar integrated into the task workflow

**Exit criteria:**

- high-value common phrases parse into correct task drafts
- ambiguous phrases never create hidden or corrupted task data

### Phase 13: Full GPUI Product Interface

**Purpose:** Turn the feature set into a coherent native application.

**Deliverables:**

- Tasks screen
- Schedule screen with timeline
- Analytics screen
- History screen
- reusable components, theme tokens, and layout conventions

**Exit criteria:**

- the app feels like a single product rather than a set of demos
- major workflows are available without manual data editing or developer intervention

### Phase 14: Multi-Day Planner and Risk Alerts

**Purpose:** Expand Agamotto from day scheduler to forward planner.

**Deliverables:**

- planner horizon for multiple days
- future workload projection
- near-deadline risk alerts
- planner view that surfaces upcoming pressure clearly

**Exit criteria:**

- looming overload can be seen before the current day fails
- alerts are grounded in actual task data and not generic reminders

### Phase 15: Testing, Benchmarking, and Hardening

**Purpose:** Make the product reliable enough for regular use and formal assessment.

**Deliverables:**

- unit tests for scheduling, ML, NLP, and validation
- integration tests for complete workflows
- persistence round-trip tests
- parser accuracy benchmark
- performance benchmarks for realistic task volumes

**Exit criteria:**

- critical behaviour is automatically tested
- schedule generation is comfortably interactive
- larger workloads do not freeze the UI

### Phase 16: NEA Evidence, Evaluation, and Submission Readiness

**Purpose:** Turn the built software into a strong assessed project.

**Deliverables:**

- evidence mapping from implementation back to the NEA analysis and design
- objective-by-objective evaluation
- screenshots, worked examples, and benchmark evidence
- documented limitations and future enhancements
- stakeholder feedback notes

**Exit criteria:**

- each major claim in the write-up can be backed by code, tests, or captured output
- the final project clearly demonstrates justified technical ambition

## 7. Milestone Map

### Milestone A: Functional Skeleton

Includes Phases 1 through 3.

At this point the app should:

- have a real project structure
- support manual task capture
- be ready for scheduling work

### Milestone B: Core Scheduler

Includes Phases 4 through 7.

At this point the app should:

- generate schedules in Serenity and Crunch modes
- explain why tasks were chosen
- support energy-aware timing and breaks

### Milestone C: Persistent Product

Includes Phases 8 through 9.

At this point the app should:

- save and reload data
- preserve schedule history
- support review of planned versus actual work

### Milestone D: Adaptive Assistant

Includes Phases 10 through 12.

At this point the app should:

- learn from historical usage
- expose ML reasoning transparently
- accept tasks through natural language

### Milestone E: Assessment-Ready Release

Includes Phases 13 through 16.

At this point the app should:

- present a polished multi-screen product
- support multi-day planning
- have tests, benchmarks, and NEA evidence ready

## 8. Implementation Order by Dependency

Follow this order to avoid rework:

1. project foundation
2. domain model
3. manual task capture
4. Serenity scheduler
5. Crunch scheduler
6. metrics and explanations
7. energy mapping and breaks
8. SQLite persistence
9. history and review tools
10. ML data capture and features
11. adaptive models
12. NLP parsing
13. full product UI polish
14. multi-day planner
15. performance tuning and hardening
16. NEA evidence pack

## 9. Testing Roadmap

Testing should be built in as features arrive, not postponed to the end.

**Early test priorities:**

- task validation
- greedy scheduler correctness
- knapsack optimality on small reference inputs
- EDF ordering

**Mid-stage test priorities:**

- metrics correctness
- explanation coverage
- break insertion boundaries
- persistence round-trip integrity

**Late-stage test priorities:**

- ML cold start safety
- duration correction convergence
- risk model output sanity
- NLP phrase accuracy
- end-to-end workflow tests

## 10. Key Risks and Mitigations

### Risk: GPUI complexity slows delivery

**Mitigation:** keep business logic UI-agnostic and testable outside GPUI.

### Risk: ML is introduced before enough behavioural data exists

**Mitigation:** ship neutral defaults, make learning visible, and keep manual override available.

### Risk: Repository architecture grows messy as features are added

**Mitigation:** establish clear module boundaries in Phase 1 and do not let UI code absorb core logic.

### Risk: NLP becomes a time sink

**Mitigation:** support a constrained, high-value phrase set first and fall back to editable structured input.

### Risk: NEA scope becomes too broad

**Mitigation:** treat the deterministic scheduler, persistence, explainability, and one working ML loop as the non-negotiable core. Everything else is secondary.

## 11. Definition of Done

Agamotto is “done enough” for a strong first full release when the following are all true:

- a user can enter tasks manually or via NLP
- a daily schedule can be generated in Serenity or Crunch mode
- the app explains task ordering and exclusions
- schedules consider deadlines, available time, and energy preference
- completed work feeds back into future estimates and risk scoring
- data persists locally via SQLite
- the UI includes tasks, schedule, analytics, planner, and history screens
- automated tests cover core logic and critical workflows
- the implementation can be clearly defended against the objectives in `AGAMOTTO.md`

## 12. Immediate Next Actions

The next practical moves for this repository are:

1. complete Phase 1 by replacing `HelloWorld` with an app shell and placeholder screens
2. complete Phase 2 by introducing the shared task and schedule domain model
3. complete Phase 3 by adding manual task creation and task-list state
4. begin Phase 4 by implementing Serenity scheduling as a pure Rust module with tests
5. defer ML and NLP work until the deterministic scheduler and persistence are stable

## 13. Suggested Working Rhythm

Use short vertical slices rather than giant feature branches:

- one slice for task model plus manual input
- one slice for Serenity scheduling
- one slice for Crunch scheduling
- one slice for explanations and metrics
- one slice for persistence
- one slice for ML
- one slice for NLP
- one slice for planner and analytics polish

This keeps the project demonstrable at every stage and gives the NEA write-up clear checkpoints with evidence.
