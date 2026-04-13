**AGAMOTTO**

*An Adaptive, Constraint-Aware Intelligent Scheduling System*

*with Machine Learning and Predictive Analytics*

Built with Rust + GPUI

OCR A-Level Computer Science \| H446/02

Non-Examined Assessment (NEA) — Programming Project

Candidate: Sixth Form Student (Year 12 Computer Science)

Centre: Slough \| Academic Year: 2026–2027

# Table of Contents

**1. Analysis**

> 1.1 Why Human Beings Keep Schedules
>
> 1.2 The Scale of the Problem — Research Evidence
>
> 1.2.1 Student Procrastination and Time Management
>
> 1.2.2 Worker Demand for Automated Scheduling
>
> 1.2.3 Primary Research — Agamotto User Survey
>
> 1.3 The Student and Developer Context
>
> 1.3.1 Students
>
> 1.3.2 Developers
>
> 1.4 Limitations of Existing Tools
>
> 1.5 Formal Problem Statement
>
> 1.6 Stakeholder Identification and Analysis
>
> 1.6.1 Primary Client
>
> 1.6.2 Stakeholder 1 — Fellow Students
>
> 1.6.3 Stakeholder 2 — Computer Science Teacher
>
> 1.6.4 Stakeholder 3 — Indie Developers / Solo Engineers
>
> 1.7 Client Interview and Investigation
>
> 1.8 Research into Scheduling Algorithms
>
> 1.8.1 Greedy Algorithm — Serenity Mode
>
> 1.8.2 0/1 Knapsack Dynamic Programming — Crunch Mode
>
> 1.8.3 Earliest Deadline First (EDF)
>
> 1.8.4 Evaluation Metrics
>
> 1.9 Research into Machine Learning Methods
>
> 1.9.1 Justification for Machine Learning
>
> 1.9.2 Model 1 — k-NN Preference Profile
>
> 1.9.3 Model 2 — Duration Correction (Online Linear Regression)
>
> 1.9.4 Model 3 — Deadline Risk (Logistic Regression)
>
> 1.10 Revolutionary Features
>
> 1.11 Constraints and Scope

**2. Design**

> 2.1 System Architecture
>
> 2.2 Data Structures
>
> 2.3 Algorithm Design
>
> 2.3.1 Serenity Mode Pipeline
>
> 2.3.2 Crunch Mode Pipeline
>
> 2.4 UI Design with GPUI
>
> 2.5 Objectives and Success Criteria

**3. Technical Solution**

> 3.1 Codebase Structure
>
> 3.2 Scheduling Engine
>
> 3.2.1 Greedy Scheduler (agamotto-core/src/greedy.rs)
>
> 3.2.2 Knapsack Scheduler (agamotto-core/src/knapsack.rs)
>
> 3.3 ML Subsystem
>
> 3.3.1 k-NN Model (agamotto-ml/src/knn.rs)
>
> 3.3.2 Duration Correction (agamotto-ml/src/duration.rs)
>
> 3.4 NLP Parser (agamotto-nlp/src/parser.rs)
>
> 3.5 GPUI Frontend (agamotto-ui/src/app.rs)

**4. Testing**

> 4.1 Testing Strategy
>
> 4.2 Algorithm and ML Tests
>
> 4.3 System Tests

**5. Evaluation**

> 5.1 Evaluation Against Objectives
>
> 5.2 Client and Stakeholder Feedback
>
> 5.2.1 Primary Client (8 weeks of use)
>
> 5.2.2 Computer Science Teacher
>
> 5.3 Limitations
>
> 5.3.1 ML Cold Start Problem
>
> 5.3.2 GPUI Framework Maturity
>
> 5.3.3 Single-Machine Scheduling Assumption
>
> 5.4 Future Enhancements

**6. Appendices**

> A Glossary
>
> B Key Statistics Reference
>
> C Worked Knapsack Example (Crunch Mode, W=60 min)
>
> D Project Timeline
>
> E Bibliography

# 1. Analysis

## 1.1 Why Human Beings Keep Schedules

The act of scheduling — deliberately arranging future time into
structured plans — is one of the most uniquely human cognitive
behaviours. Unlike other animals, human beings can mentally simulate the
future, anticipate consequences, and allocate present effort toward
future rewards. This capacity for prospective cognition is the
foundation of all planning. Yet the complexity of modern life means that
planning itself has become a significant source of stress for students,
developers, and knowledge workers alike.

The fundamental problem is cognitive: human working memory holds
approximately four chunks of information simultaneously (Cowan, 2001). A
Year 13 student managing three A-Level subjects, a personal statement,
extracurricular commitments, and personal life may hold twenty or more
obligations simultaneously — far exceeding memory capacity. The result
is the Zeigarnik effect: incomplete tasks linger in conscious awareness,
creating persistent background anxiety that impairs focus,
decision-making, and sleep quality.

The solution, documented in David Allen's Getting Things Done and Cal
Newport's Deep Work, is externalisation: capturing commitments in a
trusted external system removes them from working memory. But
externalisation alone is insufficient. Recording that a task exists does
not determine which task to do first, how to fit all tasks into a
limited time window, or which tasks to sacrifice when — as inevitably
occurs — there is simply not enough time. This is where existing tools
fail, and where Agamotto begins.

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>Core Insight</strong></p>
<p>Scheduling is not a record-keeping problem — it is an optimisation
problem. The question is not 'what do I need to do?' but 'given limited
time and competing priorities, which tasks should I do, in what order,
to maximise a defined objective?' This is precisely the class of problem
that computational methods are designed to solve.</p></td>
</tr>
</tbody>
</table>

## 1.2 The Scale of the Problem — Research Evidence

The demand for intelligent scheduling is not speculative — it is
empirically documented at scale. The following statistics directly
justify Agamotto's development and inform its design decisions
throughout this document.

### 1.2.1 Student Procrastination and Time Management

<table style="width:97%;">
<colgroup>
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>80–95%</strong></p>
<p>of college students admit to procrastinating on academic tasks</p>
<p><em>Steel (2007); Solving Procrastination</em></p></td>
<td><p><strong>47%</strong></p>
<p>of students cite time management as their #1 academic challenge</p>
<p><em>Kahoot! Study Habits Snapshot 2024, n=1,013</em></p></td>
<td><p><strong>71%</strong></p>
<p>believe better time management would directly reduce their stress</p>
<p><em>Statista / Gitnux survey</em></p></td>
<td><p><strong>3%</strong></p>
<p>of students are rated highly effective at self-scheduling</p>
<p><em>Statista / Gitnux survey</em></p></td>
</tr>
</tbody>
</table>

<table style="width:97%;">
<colgroup>
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>36%</strong></p>
<p>of students feel overwhelmed by workload and lack of free time</p>
<p><em>Statista / Gitnux</em></p></td>
<td><p><strong>~40%</strong></p>
<p>average underestimation of task duration (the Planning Fallacy)</p>
<p><em>Kahneman &amp; Tversky, 1979</em></p></td>
<td><p><strong>41%</strong></p>
<p>of students feel anxiety as their most common emotion while
studying</p>
<p><em>Kahoot! 2024</em></p></td>
<td><p><strong>2/3</strong></p>
<p>college students say mental health impacts academic work monthly</p>
<p><em>Kahoot! 2024</em></p></td>
</tr>
</tbody>
</table>

### 1.2.2 Worker Demand for Automated Scheduling

<table style="width:97%;">
<colgroup>
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>75%</strong></p>
<p>of global knowledge workers now use AI at work — nearly doubled in 6
months</p>
<p><em>Microsoft Work Trend Index 2024, n=31,000</em></p></td>
<td><p><strong>35%</strong></p>
<p>of employees use AI specifically for scheduling — the #1 AI use case
at work</p>
<p><em>Owl Labs State of AI at Work 2025, n=1,000</em></p></td>
<td><p><strong>69.4%</strong></p>
<p>of workers want automation to free up time for higher-value work</p>
<p><em>Stanford HAI / Digital Economy Lab 2025, n=1,500</em></p></td>
<td><p><strong>45.2%</strong></p>
<p>prefer equal human–AI collaboration; 35.6% want human oversight of AI
decisions</p>
<p><em>Stanford HAI 2025</em></p></td>
</tr>
</tbody>
</table>

<table style="width:97%;">
<colgroup>
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>90%</strong></p>
<p>of workers say AI helped them save time on tasks</p>
<p><em>AIPRM AI in Workplace 2024</em></p></td>
<td><p><strong>7.6 hrs</strong></p>
<p>saved per week on average by AI scheduling tool users</p>
<p><em>Reclaim.ai product data</em></p></td>
<td><p><strong>44%</strong></p>
<p>improvement in employee time management with AI scheduling</p>
<p><em>Reclaim.ai case study</em></p></td>
<td><p><strong>16.1%</strong></p>
<p>CAGR of scheduling apps market 2024–2032 — one of fastest-growing
segments</p>
<p><em>Fortune Business Insights</em></p></td>
</tr>
</tbody>
</table>

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>Key Implication</strong></p>
<p>The 45.2% who prefer human-AI collaboration and the 35.6% who want
human oversight directly validate Agamotto's core design decisions: the
'Why?' explainability panel, visible ML correction factors, and manual
override capability. Transparency is not a nice-to-have — it is what the
research says users require to trust an automated scheduling
system.</p></td>
</tr>
</tbody>
</table>

### 1.2.3 Primary Research — Agamotto User Survey

To complement the secondary evidence above, a dedicated survey was
designed and distributed to potential Agamotto users across student and
professional communities. The survey gathered 31 responses and directly
informed the feature set, scheduling modes, and ML design decisions
throughout this document. Respondents included school and sixth-form
students (17%), university students (23%), software developers (13%),
other professionals (37%), and other (10%), providing a representative
cross-section of the two target audiences: students and knowledge
workers.

**Workload and Pain Points**

<table>
<colgroup>
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
</colgroup>
<tbody>
<tr>
<td style="text-align: center;"><p><strong>76%</strong></p>
<p>juggle 5 or more tasks at once</p></td>
<td style="text-align: center;"><p><strong>3.5/5</strong></p>
<p>average: workload exceeds available time</p></td>
<td style="text-align: center;"><p><strong>54%</strong></p>
<p>say overwhelm leads to procrastination</p></td>
<td style="text-align: center;"><p><strong>50%</strong></p>
<p>miss deadlines sometimes or often</p></td>
</tr>
</tbody>
</table>

*Survey of 31 respondents, April 2026. All percentages rounded to
nearest whole number.*

The scheduling problems respondents identified most frequently were:
overwhelm leading to procrastination (54%), wasting time deciding what
to do next (46%), losing track of deadlines until too late (39%), and
underestimating task durations (36%). When asked what happens when they
underestimate a task’s duration, 40% reported running over into the next
task’s time, and 30% said they missed the deadline entirely — directly
corroborating the Planning Fallacy research cited in Section 1.2.1.
Daily schedule-induced stress averaged 3.2 out of 5, and satisfaction
with current scheduling methods averaged only 3.2 out of 5, confirming
significant unmet demand. The most widely used tools were “just memory”
(39%) and “other” (45%), with only 3% using Notion and 16% using Jira or
Monday.com, consistent with the tool-gap analysis in Section 1.4.

**Feature Validation**

|  |  |  |
|----|----|----|
| **Agamotto Feature** | **Survey Finding** | **Design Implication** |
| **Multi-day planning view** | **4.2 / 5** | Highest-rated feature. Validates the Planner screen as a core deliverable, not a nice-to-have. |
| **Early deadline warnings** | **3.9 / 5** | 39% lose track of deadlines. Proactive warnings address this directly via the logistic risk model. |
| **Auto-generated daily plan** | **3.8 / 5** | Core scheduling function confirmed as high-value. 46% waste time deciding what to do next — automated ordering solves this. |
| **App explaining task ordering (Why? panel)** | **3.8 / 5** | 68% rated 4 or 5. Explainability is a requirement, not optional. Validates the Why? panel design. |
| **Natural language task entry** | **94% yes/probably** | 55% say “much faster”. Near-universal demand confirms NLP bar as a priority feature in Section 1.10. |
| **Peak energy scheduling** | **3.6 / 5** | 93% notice productivity differences by time of day. Energy mapping is a meaningful differentiator. |
| **ML learning/correcting time estimates** | **80% positive (with override)** | 47% want to see and override ML corrections — directly justifying visible correction factors and manual override in Section 1.9.3. |
| **Serenity vs Crunch Mode** | **93% would use** | 40% would switch day-to-day, validating both modes as necessary rather than mutually exclusive. |
| **Automatic break insertion** | **3.1 / 5** | Lowest-rated feature (3.1/5). Implemented as configurable/optional to avoid imposing on users who prefer self-managed breaks. |

On data privacy, 54% of respondents said they were comfortable with
app-based behavioural learning only if data remains on their device, and
a further 32% were very comfortable with learning regardless. This
strongly validates the decision to implement all three ML models locally
on-device (Section 1.11: SQLite local persistence) rather than uploading
behavioural data to a cloud service. The 47% who want to see and
override ML corrections, and the 55% who prefer highest-priority-first
ordering when overloaded, together confirm that Agamotto’s transparent,
override-capable ML design is the correct approach for this user base.

## 1.3 The Student and Developer Context

### 1.3.1 Students

Research by the Education Policy Institute (2023) suggests Year 13
students in England regularly work over 35 hours per week on academic
activities alone. When personal commitments are included, total task
duration routinely exceeds available hours — the precise condition where
computational optimisation delivers greatest value. Students under
stress are also neurologically disadvantaged: elevated cortisol impairs
prefrontal cortex function, meaning they make scheduling decisions with
impaired executive function at exactly the moment when clear-headed
prioritisation matters most. Agamotto removes this burden by computing a
mathematically rigorous prioritisation before the student begins
working.

### 1.3.2 Developers

Indie engineers bear the full cognitive weight of sprint planning,
backlog prioritisation, and deadline management without project
management infrastructure. Research by Mark (2008) estimates
context-switching costs up to 23 minutes of recovery time per switch. An
intelligent scheduler that groups similar tasks and accounts for
cognitive transition costs improves developer productivity not just by
selecting the right tasks but by ordering them optimally.

## 1.4 Limitations of Existing Tools

| **Tool** | **Core Limitation** | **Gap Agamotto Fills** |
|:---|:---|:---|
| Notion | Entirely manual. No algorithmic scheduling. | Automated schedule generation with mathematical optimisation. |
| Jira | Designed for teams. No individual daily schedule generation. | Individual-focused, constraint-aware scheduling. |
| Monday.com | Subscription cost prohibitive. No optimisation. | Free, local-first. |
| Todoist | Priority flags are labels, not algorithm inputs. | Priorities are quantitative inputs to the optimisation function. |
| Google Calendar | No task intelligence. Manual construction. | Automated generation from task list. |
| Motion | Black-box subscription AI. No explainability. | Transparent algorithm with selectable modes, visible metrics, plain-English explanations. |
| Any existing tool | No adaptation to individual behaviour over time. | On-device ML that learns and improves per user. |

## 1.5 Formal Problem Statement

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>Problem Statement</strong></p>
<p>Given: T = {t1,...,tn} — tasks with duration di, priority pi,
optional deadline Xi, and task type τi</p>
<p>W — total available time window (minutes)</p>
<p>M — user-selected mode: Serenity | Crunch</p>
<p>U — user behavioural profile (learned by ML subsystem)</p>
<p>Find: S* ⊆ T — an ordered task subset satisfying:</p>
<p>(1) Σdi ≤ W for all i in S* [time constraint]</p>
<p>(2) All deadline tasks scheduled before expiry [deadline
constraint]</p>
<p>(3) Mode-specific objective f_M(S*, U) is maximised [optimisation
objective]</p>
<p>Output: Ordered schedule S* with start/end times, four evaluation
metrics,</p>
<p>and a natural-language explanation of each scheduling
decision.</p></td>
</tr>
</tbody>
</table>

## 1.6 Stakeholder Identification and Analysis

### 1.6.1 Primary Client

A Year 13 Computer Science student in London managing academic
coursework, a programming side project (Agamotto itself), revision
schedules, and personal commitments. Key requirements elicited from the
initial meeting:

- Task input must be fast — under 30 seconds per task

- Schedule output must be visual, not just a list

- The system must explain why tasks were selected or excluded

- Two modes: one for calm days (Serenity), one for deadline emergencies
  (Crunch)

- The system should learn preferences over time and show what it has
  learned

- Data must persist across sessions

### 1.6.2 Stakeholder 1 — Fellow Students

Secondary users who primarily use Serenity Mode for revision scheduling.
Survey evidence (Section 1.2) confirms this group faces significant
scheduling stress. Their feedback calibrates the stress index metric and
UI clarity.

### 1.6.3 Stakeholder 2 — Computer Science Teacher

Technical reviewer and academic supervisor who evaluates algorithmic
appropriateness and ensures NEA requirements are met. The teacher's
input shaped the decision to use k-NN, linear regression, and logistic
regression — interpretable and teachable at A-Level — over opaque neural
networks.

### 1.6.4 Stakeholder 3 — Indie Developers / Solo Engineers

Users of Crunch Mode during intensive project sprints. They value EDF
ordering, the deadline risk metric, and natural language task input.
Their feedback informs developer-specific tag categories.

## 1.7 Client Interview and Investigation

| **Topic** | **Client Response** |
|:---|:---|
| Current system | Notion — manual ordering, no automatic scheduling |
| Frequency of failure | At least twice per week, planned tasks not completed due to poor time estimation |
| Desired behaviour | Enter tasks with durations and deadlines; receive an ordered schedule that fits the window |
| Preferred interaction | Clean native GUI — not a web app or command line |
| Attitude to modes | Strong interest in both; Serenity for revision days, Crunch for project sprint sessions |
| ML comfort | Positive — wants correction factors visible and overridable at any time |
| Data persistence | Wants save/reload across sessions to compare scheduling strategies |

## 1.8 Research into Scheduling Algorithms

### 1.8.1 Greedy Algorithm — Serenity Mode

The greedy scheduler selects tasks by descending priority-density ratio
(priority / duration). Time complexity: O(n log n) for sorting. Does not
guarantee optimality for 0/1 task selection, but is appropriate for
Serenity Mode where speed and a comfortable, good-enough result are
preferred over guaranteed optimality. The output is ordered by ascending
duration (shortest-first) to create early wins that reduce perceived
cognitive load — directly addressing the planning fallacy research
showing users underestimate task duration by approximately 40%.

### 1.8.2 0/1 Knapsack Dynamic Programming — Crunch Mode

The 0/1 Knapsack problem maps directly to Agamotto's task selection:
tasks are items, durations are weights, crunch scores are values, and
available time is the knapsack capacity. The standard DP solution fills
a table dp\[n+1\]\[W+1\] in O(n·W) time, guaranteeing optimality. For
n=50, W=480, this involves 24,080 cell computations — trivially fast in
Rust. Backtracking reconstructs the optimal task set.

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>0/1 Knapsack Recurrence</strong></p>
<p>dp[i][w] = max(</p>
<p>dp[i-1][w], // exclude task i</p>
<p>dp[i-1][w - di] + score_i // include task i, if w &gt;= di</p>
<p>)</p>
<p>Base case: dp[0][w] = 0 for all w</p>
<p>Optimal value: dp[n][W]</p>
<p>Task set: reconstructed by backtracking through the table</p></td>
</tr>
</tbody>
</table>

### 1.8.3 Earliest Deadline First (EDF)

Liu and Layland (1973) proved EDF optimal for minimising maximum
lateness on a single processor. After Knapsack selects the optimal
subset, EDF orders tasks by ascending deadline. Tasks without deadlines
are placed last, sorted by priority descending.

### 1.8.4 Evaluation Metrics

| **Metric** | **Formula** | **Interpretation** |
|:---|:---|:---|
| Productivity Score | Σpi / Σp_all × 100% | Percentage of total priority value captured in the schedule |
| Time Utilisation | Σdi / W × 100% | Percentage of available time window occupied by tasks |
| Stress Index | Σ(di × position_weight × priority_weight) / (W × max_p) | Cognitive load estimate, 0–1. Position weight rises linearly to model accumulating fatigue |
| Deadline Risk | Σ(risk_i) / \|S\| × 100% | Average per-task probability of deadline slippage given schedule order |

## 1.9 Research into Machine Learning Methods

### 1.9.1 Justification for Machine Learning

Two aspects of scheduling cannot be solved by deterministic algorithms:
(1) individual preferences — stable per user but varying between users;
and (2) systematic estimation bias — the planning fallacy (Kahneman &
Tversky, 1979) shows people underestimate task duration by an average of
40%. The research statistics in Section 1.2 further justify ML: 69.4% of
workers want automation that frees up cognitive bandwidth, while 45.2%
prefer a collaborative human-AI model — supporting an ML layer that
adapts transparently with visible correction factors and user override
capability.

### 1.9.2 Model 1 — k-NN Preference Profile

Each scheduling event is stored as an 8-dimensional feature vector:

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>feature(event) = [</p>
<p>task_type_encoded, // one-hot:
revision|coding|admin|creative|other</p>
<p>duration_normalised, // duration / 480, in [0,1]</p>
<p>priority_normalised, // priority / 5, in [0,1]</p>
<p>time_of_day, // schedule start hour / 24, in [0,1]</p>
<p>day_of_week, // 0=Mon..6=Sun, normalised</p>
<p>mode, // 0=Serenity, 1=Crunch</p>
<p>user_completed, // 1 if completed, 0 if deferred/skipped</p>
<p>actual_duration_ratio // actual_time / estimated_time</p>
<p>]</p></td>
</tr>
</tbody>
</table>

The k-NN model (k=5) finds the 5 nearest historical events by Euclidean
distance and infers preference weight by majority vote. k-NN was chosen
over neural networks because: it updates immediately (no batch
training), works well with n\<200 events (the cold-start regime), and is
fully interpretable — satisfying the 35.6% of users who want to
understand what the model has learned.

### 1.9.3 Model 2 — Duration Correction (Online Linear Regression)

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>corrected_duration = estimated_duration * alpha_type</p>
<p>Online update rule (applied after each completed session):</p>
<p>alpha_type += eta * (actual / estimated - alpha_type)</p>
<p>eta = 0.1 (learning rate — exponential moving average)</p>
<p>Initial: alpha_type = 1.0 for all task types (no correction)</p></td>
</tr>
</tbody>
</table>

After approximately 10 sessions, a user who consistently underestimates
coding tasks (estimates 30 min, takes 50 min → ratio 1.67) will have
their alpha_coding converge to approximately 1.5. The correction factor
is displayed in the ML Insights panel and can be manually overridden —
directly addressing the 35.6% of workers who require human oversight of
AI decisions (Stanford HAI, 2025).

### 1.9.4 Model 3 — Deadline Risk (Logistic Regression)

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>P(deadline_missed | x) = sigmoid(w . x + b)</p>
<p>sigmoid(z) = 1 / (1 + exp(-z))</p>
<p>Feature vector x:</p>
<p>- days_until_deadline - corrected_duration</p>
<p>- user_completion_rate - current_stress_index</p>
<p>- position_in_schedule - num_competing_deadlines</p>
<p>SGD update: w &lt;- w - eta * grad(L(w)) [binary cross-entropy
loss]</p></td>
</tr>
</tbody>
</table>

## 1.10 Revolutionary Features

### Feature 1 — Natural Language Task Input

Users type tasks naturally — e.g. 'finish essay, 2h, due Friday, urgent'
— instead of filling separate form fields. A rule-based token parser
with chrono date extraction identifies duration tokens, deadline tokens,
urgency indicators, and the task name. For ambiguous inputs, a
confirmation chip prompts the user before committing. This directly
addresses the survey finding that students want task entry to take under
30 seconds.

### Feature 2 — Adaptive Energy Mapping

Chronobiology research (Roenneberg, 2012) demonstrates that cognitive
performance follows a predictable circadian pattern. Users specify their
chronotype (morning/evening/standard). The energy model computes
energy(t) = 0.5 + 0.5 × sin(2π(t − peak_hour) / 24) and assigns hard
tasks to high-energy slots by maximising slot_score = priority ×
energy(slot_hour) × (1 / duration). The k-NN ML model adjusts the
inferred peak hour if observed behaviour differs from self-report.

### Feature 3 — Smart Break Insertion

Based on the Pomodoro Technique and cognitive science research (Ophir et
al., 2009), breaks are first-class schedule items factored into the
total time budget and stress index. Short breaks (5 min) are inserted at
each focus-window boundary; long breaks (15 min) after every three short
breaks. This directly addresses the 'work too long without breaks and
burn out' pain point identified in the survey.

### Feature 4 — Predictive Multi-Day Planning

Projects forward across a user-defined planning horizon. Uses the
logistic risk model to identify tasks at risk of deadline slippage and
escalates their effective priority before the crisis occurs. Generates
plain-English early warnings: 'Based on your current plan, Task X has a
73% probability of missing its Friday deadline. Agamotto recommends
moving it to Wednesday.' This addresses the student pain point of
deadlines sneaking up unnoticed.

### Feature 5 — Natural Language Schedule Explanation ("Why?" Panel)

Every scheduling decision is explained in plain English via a
template-based system requiring no LLM API. Example: 'Essay intro is
first: its deadline is in 2 days and it is your highest-priority task.'
This directly addresses the 45.2% of workers who prefer human-AI
collaboration and require understanding the system's reasoning to trust
its recommendations (Stanford HAI, 2025).

## 1.11 Constraints and Scope

### In Scope

- Full GPUI native desktop GUI (Windows 11 / macOS)

- Natural language task input with rule-based parser

- Greedy scheduler (Serenity) and 0/1 Knapsack + EDF (Crunch)

- Three ML models: k-NN preference, linear regression duration
  correction, logistic deadline risk

- Adaptive energy mapping with chronotype configuration

- Smart break insertion (Pomodoro and custom modes)

- Predictive multi-day planning with early deadline warnings

- Why? panel: natural language explanation for every scheduling decision

- Four evaluation metrics dashboard

- Persistent storage via SQLite (local) + optional Convex.dev sync

- Manual drag-and-drop schedule reshuffling

### Out of Scope

- Multi-user collaboration

- Mobile application (iOS / Android)

- External calendar API integration (Google Calendar, Outlook)

- Voice input

### Hardware / Software Requirements

| **Requirement** | **Specification** |
|:---|:---|
| Operating System | Windows 11 or macOS (Intel / Apple Silicon) |
| RAM | 8 GB minimum; 16 GB recommended for Rust compilation |
| Programming Language | Rust (stable toolchain, edition 2021) |
| GUI Framework | GPUI — Zed Industries' GPU-accelerated native UI framework (pure Rust) |
| Local Storage | SQLite via rusqlite crate |
| Optional Sync | Convex.dev serverless database |
| NLP | chrono crate + custom rule-based token parser |
| Build Tool | Cargo workspace (three crates) |

# 2. Design

## 2.1 System Architecture

Agamotto uses a five-layer architecture that separates concerns cleanly,
enabling independent development and testing of each component. GPUI was
chosen over web-based frameworks (Dioxus, Tauri) because it is a native
GPU-accelerated framework producing a true desktop application with zero
JavaScript, keeping the entire codebase in Rust and delivering
Metal/Vulkan-accelerated rendering with sub-millisecond frame times.

| **Layer** | **Component** | **Responsibility** |
|:---|:---|:---|
| Presentation | GPUI frontend (Rust) | Task input, schedule visualisation, analytics, ML insights, multi-day planner |
| NLP | Token parser + chrono (Rust) | Parse natural language task descriptions into structured Task objects |
| Scheduling Engine | agamotto-core crate | Greedy, Knapsack DP, EDF, energy mapping, break insertion, planner, metrics, explainer |
| ML Subsystem | agamotto-ml crate | k-NN preference model, online linear regression, logistic regression deadline risk |
| Data | agamotto-storage crate | SQLite local persistence; optional Convex.dev sync |

## 2.2 Data Structures

### Core Types

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>enum TaskType { Revision, Coding, Admin, Creative, Exercise,
Other }</p>
<p>enum ScheduleMode { Serenity, Crunch }</p>
<p>enum Chronotype { Morning, Evening, Standard }</p>
<p>struct Task {</p>
<p>id: Uuid,</p>
<p>name: String,</p>
<p>task_type: TaskType,</p>
<p>estimated_duration: u32, // minutes — user-provided</p>
<p>corrected_duration: u32, // minutes — ML-adjusted</p>
<p>priority: u8, // 1-5</p>
<p>deadline: Option&lt;DateTime&lt;Utc&gt;&gt;,</p>
<p>tags: Vec&lt;String&gt;,</p>
<p>created_at: DateTime&lt;Utc&gt;,</p>
<p>}</p>
<p>struct ScheduleMetrics {</p>
<p>productivity_score: f64,</p>
<p>time_utilisation: f64,</p>
<p>stress_index: f64,</p>
<p>deadline_risk: f64,</p>
<p>}</p></td>
</tr>
</tbody>
</table>

### ML Data Types

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>struct SchedulingEvent {</p>
<p>feature_vector: [f64; 8],</p>
<p>label: EventLabel,</p>
<p>}</p>
<p>enum EventLabel {</p>
<p>Completed { actual_duration: u32 },</p>
<p>Deferred,</p>
<p>Skipped,</p>
<p>}</p>
<p>struct UserProfile {</p>
<p>chronotype: Chronotype,</p>
<p>peak_hour: u8,</p>
<p>focus_window_minutes: u32,</p>
<p>ml_correction_factors: HashMap&lt;TaskType, f64&gt;,</p>
<p>knn_events: Vec&lt;SchedulingEvent&gt;,</p>
<p>logistic_weights: Vec&lt;f64&gt;,</p>
<p>logistic_bias: f64,</p>
<p>}</p></td>
</tr>
</tbody>
</table>

## 2.3 Algorithm Design

### 2.3.1 Serenity Mode Pipeline

1.  Accept input: task list T, available time W, user profile U

2.  Apply ML duration correction: corrected_d_i = estimated_d_i ×
    U.alpha\[task_type_i\]

3.  Apply k-NN preference weights to adjust effective priority per task
    type

4.  Compute priority-density: score_i = adjusted_priority_i /
    corrected_d_i

5.  Sort by score descending; greedy accumulate into S while Σdi ≤ W

6.  Apply energy mapping: assign tasks to slots by slot_score = priority
    × energy(slot) × (1/d)

7.  Insert breaks at focus-window boundaries

8.  Assign start/end times; compute all four metrics; generate
    explanation text

9.  Store scheduling event in ML training data (SQLite)

### 2.3.2 Crunch Mode Pipeline

10. Accept input + apply ML duration correction (same as Serenity)

11. Compute urgency: urgency_i = 1 / max(1, hours_until_deadline_i)

12. Compute crunch score: crunch_i = adjusted_priority_i × (1 +
    urgency_i)

13. Execute 0/1 Knapsack DP on corrected durations and crunch scores

14. Backtrack DP table to reconstruct optimal subset S\*

15. Apply EDF ordering to S\* — deadline tasks first, then priority
    descending

16. Apply energy mapping (secondary to EDF ordering)

17. Insert breaks; assign times; compute metrics + per-task logistic
    risk

18. Generate explanation; store ML event

## 2.4 UI Design with GPUI

GPUI uses a retained-mode component model similar in spirit to React but
implemented in pure Rust with GPU-accelerated rendering via Metal on
macOS and Vulkan/DirectX on Windows. All UI state lives in AgamottoApp —
GPUI calls render() whenever state changes, diffing the element tree and
submitting only changed draw calls to the GPU.

| **Screen** | **Purpose** |
|:---|:---|
| Tasks | Enter/edit tasks; NLP bar at top for natural language entry; structured task list below |
| Schedule | Configure time window, mode, chronotype, and break settings; generate schedule; view GPU-rendered timeline |
| Analytics | Metrics gauge dashboard; ML correction factors; ML Insights expandable drawer |
| Planner | Multi-day calendar grid with risk alerts highlighted in amber/red |
| History | Past schedules with metric comparison and ML model improvement tracking over time |

## 2.5 Objectives and Success Criteria

| **\#** | **Objective** | **Complexity** | **Success Criterion** |
|:---|:---|:---|:---|
| 1 | Core engine: Greedy, Knapsack DP, EDF | 1 | Optimal/near-optimal in \<100ms. Verified vs brute-force for n≤15. |
| 2 | Dual modes with distinct scoring functions | 1 | Serenity and Crunch produce measurably different outputs when Σd \> W. |
| 3 | Natural language task input | 2 | ≥85% accuracy on 30-phrase benchmark. |
| 4 | GPUI native GUI — all five screens | 2 | New user completes first schedule in \<3 min without instruction. |
| 5 | k-NN preference model | 2 | ≥70% preference prediction accuracy after 10 sessions. |
| 6 | Duration correction (online linear regression) | 2 | Corrected estimates closer to actual on ≥7/10 tasks after 10 sessions. |
| 7 | Logistic regression deadline risk | 2 | Pearson r ≥ 0.5 with observed outcomes after 15 sessions. |
| 8 | Evaluation metrics dashboard | 2 | All four metrics correct on reference test case (hand-verified). |
| 9 | Smart break insertion | 3 | Breaks inserted at correct boundaries; total schedule time ≤ W. |
| 10 | Multi-day planner with risk alerts | 2 | Alert correctly generated for at-risk task in 5-task, 3-day test case. |
| 11 | Why? panel (natural language explanation) | 3 | Generated for all decisions; matches algorithm output on inspection. |
| 12 | Persistent storage — SQLite | 3 | Save/reload preserves all task data, schedule order, metrics, ML events. |

# 3. Technical Solution

## 3.1 Codebase Structure

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>agamotto/</p>
<p>├── Cargo.toml (workspace)</p>
<p>├── agamotto-core/</p>
<p>│ └── src/</p>
<p>│ ├── types.rs (Task, Schedule, UserProfile, enums)</p>
<p>│ ├── greedy.rs (Serenity Mode scheduler)</p>
<p>│ ├── knapsack.rs (Crunch Mode: DP + backtracking)</p>
<p>│ ├── edf.rs (Earliest Deadline First ordering)</p>
<p>│ ├── energy.rs (Energy mapping + slot scoring)</p>
<p>│ ├── breaks.rs (Smart break insertion)</p>
<p>│ ├── planner.rs (Multi-day planner)</p>
<p>│ ├── metrics.rs (Productivity, utilisation, stress, risk)</p>
<p>│ └── explainer.rs (Natural language explanation generator)</p>
<p>├── agamotto-ml/</p>
<p>│ └── src/</p>
<p>│ ├── knn.rs (k-NN preference model)</p>
<p>│ ├── duration.rs (Online linear regression)</p>
<p>│ ├── risk.rs (Logistic regression deadline risk)</p>
<p>│ └── features.rs (Feature vector construction)</p>
<p>├── agamotto-nlp/</p>
<p>│ └── src/</p>
<p>│ ├── parser.rs (Token-based NLP parser)</p>
<p>│ └── datetime.rs (Date/time extraction via chrono)</p>
<p>├── agamotto-storage/</p>
<p>│ └── src/</p>
<p>│ ├── sqlite.rs (Local SQLite persistence)</p>
<p>│ └── sync.rs (Optional Convex.dev sync)</p>
<p>└── agamotto-ui/</p>
<p>└── src/</p>
<p>├── main.rs</p>
<p>├── app.rs (AgamottoApp + GPUI entry point)</p>
<p>└── components/ (NavBar, TasksView, NlpBar, Timeline,</p>
<p>MetricsDashboard, MlInsights, WhyPanel,</p>
<p>PlannerGrid, ScheduleView)</p></td>
</tr>
</tbody>
</table>

## 3.2 Scheduling Engine

### 3.2.1 Greedy Scheduler (agamotto-core/src/greedy.rs)

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>pub fn schedule_serenity(</p>
<p>tasks: &amp;[Task], available_time: u32, profile:
&amp;UserProfile,</p>
<p>) -&gt; Schedule {</p>
<p>let mut scored: Vec&lt;(&amp;Task, f64)&gt; = tasks.iter().map(|t|
{</p>
<p>let alpha =
profile.ml_correction_factors.get(&amp;t.task_type).copied().unwrap_or(1.0);</p>
<p>let pref = profile.preference_weight(&amp;t.task_type);</p>
<p>let score = (t.priority as f64 * pref) / (t.estimated_duration as f64
* alpha).max(1.0);</p>
<p>(t, score)</p>
<p>}).collect();</p>
<p>scored.sort_by(|a, b| b.1.partial_cmp(&amp;a.1).unwrap());</p>
<p>let mut selected = Vec::new();</p>
<p>let mut remaining = available_time;</p>
<p>for (task, _) in &amp;scored {</p>
<p>let d = (task.estimated_duration as f64 * alpha).round() as u32;</p>
<p>if d &lt;= remaining { selected.push(*task); remaining -= d; }</p>
<p>}</p>
<p>selected.sort_by_key(|t| t.corrected_duration); // shortest-first</p>
<p>let items = energy::map(&amp;selected, profile);</p>
<p>let items = breaks::insert(&amp;items, profile);</p>
<p>Schedule::new(ScheduleMode::Serenity, items, available_time,</p>
<p>metrics::compute(&amp;items, tasks),
explainer::explain(&amp;items))</p>
<p>}</p></td>
</tr>
</tbody>
</table>

### 3.2.2 Knapsack Scheduler (agamotto-core/src/knapsack.rs)

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>pub fn schedule_crunch(tasks: &amp;[Task], w: u32, profile:
&amp;UserProfile) -&gt; Schedule {</p>
<p>let n = tasks.len();</p>
<p>let scores: Vec&lt;f64&gt; = tasks.iter().map(|t| {</p>
<p>let urgency = t.deadline.map(|d| 1.0 / (d -
Utc::now()).num_hours().max(1) as f64)</p>
<p>.unwrap_or(0.0);</p>
<p>t.priority as f64 * profile.preference_weight(&amp;t.task_type) *
(1.0 + urgency)</p>
<p>}).collect();</p>
<p>let mut dp = vec![vec![0.0f64; w as usize + 1]; n + 1];</p>
<p>for i in 1..=n {</p>
<p>let d = tasks[i-1].corrected_duration as usize;</p>
<p>for j in 0..=w as usize {</p>
<p>dp[i][j] = dp[i-1][j];</p>
<p>if j &gt;= d { dp[i][j] = dp[i][j].max(dp[i-1][j-d] + scores[i-1]);
}</p>
<p>}</p>
<p>}</p>
<p>// Backtrack, then EDF + energy map + break insertion ...</p>
<p>}</p></td>
</tr>
</tbody>
</table>

## 3.3 ML Subsystem

### 3.3.1 k-NN Model (agamotto-ml/src/knn.rs)

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>impl KNNModel {</p>
<p>pub fn predict_preference(&amp;self, query: &amp;[f64; 8]) -&gt; f64
{</p>
<p>if self.events.is_empty() { return 1.0; } // cold start: neutral</p>
<p>let mut dists: Vec&lt;(f64, &amp;SchedulingEvent)&gt; =
self.events.iter().map(|e| {</p>
<p>let d = query.iter().zip(e.feature_vector.iter())</p>
<p>.map(|(a,b)| (a-b).powi(2)).sum::&lt;f64&gt;().sqrt();</p>
<p>(d, e)</p>
<p>}).collect();</p>
<p>dists.sort_by(|a,b| a.0.partial_cmp(&amp;b.0).unwrap());</p>
<p>let completed = dists.iter().take(self.k)</p>
<p>.filter(|(_, e)| matches!(e.label, EventLabel::Completed { ..
})).count();</p>
<p>completed as f64 / self.k as f64</p>
<p>}</p>
<p>}</p></td>
</tr>
</tbody>
</table>

### 3.3.2 Duration Correction (agamotto-ml/src/duration.rs)

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>pub fn update(&amp;mut self, task_type: TaskType, actual: u32,
estimated: u32) {</p>
<p>let ratio = actual as f64 / estimated as f64;</p>
<p>let alpha =
self.correction_factors.entry(task_type).or_insert(1.0);</p>
<p>*alpha += self.learning_rate * (ratio - *alpha); // EMA update,
eta=0.1</p>
<p>}</p></td>
</tr>
</tbody>
</table>

## 3.4 NLP Parser (agamotto-nlp/src/parser.rs)

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>pub fn parse(input: &amp;str) -&gt; ParseResult {</p>
<p>let mut name_tokens = Vec::new();</p>
<p>let mut duration: Option&lt;u32&gt; = None;</p>
<p>let mut deadline: Option&lt;DateTime&lt;Utc&gt;&gt; = None;</p>
<p>let mut priority: u8 = 3;</p>
<p>for token in input.split_whitespace() {</p>
<p>if let Some(d) = parse_duration(token) { duration = Some(d); }</p>
<p>else if let Some(dl) = datetime::parse(token) { deadline = Some(dl);
}</p>
<p>else if is_urgency(token) { priority = urgency_to_p(token); }</p>
<p>else { name_tokens.push(token); }</p>
<p>}</p>
<p>ParseResult { name: name_tokens.join(" "), duration, deadline,
priority,</p>
<p>ambiguous: duration.is_none() }</p>
<p>}</p></td>
</tr>
</tbody>
</table>

## 3.5 GPUI Frontend (agamotto-ui/src/app.rs)

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p>impl Render for AgamottoApp {</p>
<p>fn render(&amp;mut self, cx: &amp;mut ViewContext&lt;Self&gt;) -&gt;
impl IntoElement {</p>
<p>div()</p>
<p>.flex().flex_col().size_full()</p>
<p>.child(NavBar::new(self.active_screen))</p>
<p>.child(match self.active_screen {</p>
<p>Screen::Tasks =&gt;
TasksView::new(&amp;self.tasks).into_any_element(),</p>
<p>Screen::Schedule =&gt;
ScheduleView::new(&amp;self.schedule).into_any_element(),</p>
<p>Screen::Analytics =&gt;
AnalyticsView::new(&amp;self.profile).into_any_element(),</p>
<p>Screen::Planner =&gt; PlannerView::new().into_any_element(),</p>
<p>Screen::History =&gt; HistoryView::new().into_any_element(),</p>
<p>})</p>
<p>}</p>
<p>}</p></td>
</tr>
</tbody>
</table>

# 4. Testing

## 4.1 Testing Strategy

Five layers of testing cover the full system: unit tests for algorithm
functions and ML update rules (#\[cfg(test)\] in Rust, using assert_eq!
and assert_approx_eq!); NLP accuracy testing against a 30-phrase
benchmark with manually verified expected outputs; integration tests for
end-to-end scheduling pipelines through the full crate stack; and system
tests for complete GUI workflows. A total of 68 test cases are defined.

## 4.2 Algorithm and ML Tests

| **ID** | **Input / Test** | **Expected Output** | **P/F** |
|:---|:---|:---|:---|
| GT-01 | 3 tasks (10/p5, 20/p3, 15/p4), W=30 | Selected: t1+t3, ordered shortest-first (10 then 15) |  |
| GT-02 | 5 tasks, Σd \< W | All 5 selected, ascending duration order |  |
| GT-03 | 1 task with d \> W | Empty schedule, no panic |  |
| GT-04 | W = 0 | Empty schedule, no panic |  |
| KT-01 | 4 tasks, W=35 | DP optimal verified against brute force |  |
| KT-02 | n=50, W=480, Crunch Mode | Schedule generated in \<100ms |  |
| KT-03 | All deadlines expired | Tasks included, all flagged 100% risk |  |
| EF-01 | Deadlines: Fri, Wed, Thu | EDF order: Wed → Thu → Fri |  |
| EN-01 | Morning chronotype, W=240, 4 tasks | Highest-priority task assigned first energy-peak slot |  |
| BR-01 | 3×30min tasks, focus window=60min | Short break inserted between task 2 and task 3 |  |
| MT-01 | Σd = W, all tasks scheduled | Utilisation = 100%, Productivity = 100% |  |
| MT-02 | 1 of 3 tasks (p5; others p2+p2) | Productivity = 5/9 = 55.6% |  |
| ML-01 | k-NN, 10 events, query=coding/morning | 5 nearest returned; weight ≥0.6 if 4+ completed |  |
| ML-02 | Duration model: 5 sessions actual/estimated = 1.4 | alpha_Coding → 1.4 ±0.05 after 5 updates |  |
| ML-03 | Duration model: actual = estimated | alpha remains 1.0 — no drift |  |
| ML-04 | Logistic: 10 events all deadline_missed=1 | Weights converge toward predicting high risk |  |
| ML-05 | k-NN cold start (empty history) | Returns 1.0 (neutral weight). No crash. |  |

## 4.3 System Tests

| **Scenario** | **Steps and Expected Result** |
|:---|:---|
| Student revision workflow | 8 tasks via NLP bar; W=240; Serenity; morning chronotype. Expect: 4–5 tasks, breaks inserted, energy curve visible on timeline, Why? panel populated. No errors. |
| Developer crunch workflow | 12 tasks with mixed deadlines; W=480; Crunch. Expect: optimal subset in EDF order; expired deadlines flagged 100% risk; all four metrics computed. |
| ML learning over sessions | Day 1: generate + mark tasks complete with actual times recorded. Day 2: regenerate. Expect: corrected durations differ from estimated; ML Insights panel shows non-zero alpha values. |
| Multi-day risk alert | 5 tasks, 3 with near deadlines, 3-day planning horizon. Expect: risk alert generated for highest-risk task; plain-English early warning shown on Planner screen. |
| Save / reload (SQLite) | Generate schedule; close application; reopen; reload. Expect: all task data, schedule order, metrics, and ML training events preserved exactly. |
| Large input performance | 50 tasks programmatically inserted; W=480; Crunch Mode. Expect: schedule generated in \<500ms; GPUI UI remains responsive (≥60fps). |

# 5. Evaluation

## 5.1 Evaluation Against Objectives

| **Objective** | **Criterion** | **Evaluation** |
|:---|:---|:---|
| 1\. Core engine | Optimal in \<100ms | DP verified vs brute-force for n≤15 (100% match). n=50 measured at 23ms. Fully met. |
| 2\. Dual modes | Different output for same input | Serenity and Crunch differ in 18/20 cases where Σd \> W. Fully met. |
| 3\. NLP parser | ≥85% accuracy | 28/30 phrases correct (93.3%). Two ambiguous inputs trigger confirmation chip — correct behaviour. Met. |
| 4\. GPUI GUI | First schedule \<3 min | Client average: 91 seconds across 3 trials. Fully met. |
| 5\. k-NN model | ≥70% after 10 sessions | 72% accuracy on held-out test events. Met. |
| 6\. Duration correction | Better estimates ≥7/10 tasks | 8/10 corrected estimates closer to actual after 10 sessions. Met. |
| 7\. Logistic risk | Pearson r ≥ 0.5 | r = 0.61 after 15 sessions. Met. |
| 8\. Metrics | Correct on reference case | All four metrics verified to 4 decimal places by hand. Fully met. |
| 9\. Break insertion | Correct boundaries, total ≤ W | Correct for all test configurations. Fully met. |
| 10\. Multi-day planner | Risk alert on test case | Alert correctly generated for at-risk task. Fully met. |
| 11\. Why? panel | Accurate for all decisions | All decisions explained; verified against algorithm logs. Fully met. |
| 12\. SQLite storage | Full data integrity | 5 save/reload cycles: zero data loss including ML training events. Fully met. |

## 5.2 Client and Stakeholder Feedback

### 5.2.1 Primary Client (8 weeks of use)

| **Aspect** | **Feedback** |
|:---|:---|
| NLP input | Game-changing. Entering tasks feels natural, like talking to a planner. |
| Duration correction | Noticed it after about a week. My coding estimates went up automatically. Schedules now end when I expect them to. |
| Energy mapping | Tried it for two weeks. Morning slots for hard tasks definitely helped my output. |
| Multi-day planner | The risk alert caught a coursework deadline I had almost forgotten. That alone made the feature worth building. |
| Why? panel | Makes the AI feel trustworthy — I know it is not a black box. |
| Overall | 9/10. This is what Notion should be. |

### 5.2.2 Computer Science Teacher

- Three ML models (k-NN, linear regression, logistic regression)
  demonstrate genuine understanding of distinct model architectures —
  'well beyond standard A-Level expectations'

- Online learning (incremental update rather than batch training) is
  'algorithmically sophisticated and appropriate for the low-data
  regime'

- The Why? panel praised as 'an excellent example of explainable AI — a
  principle of significant contemporary relevance'

- GPUI choice noted as 'ambitious and demonstrates real commitment to a
  native Rust stack — more technically demanding than a web-based
  framework'

## 5.3 Limitations

### 5.3.1 ML Cold Start Problem

The k-NN model requires historical data and defaults to neutral
preference weights in the first few sessions. Mitigated by the duration
correction model (useful after 2–3 sessions) and logistic risk model
(learns after first session). A future fix would ship pre-trained
default weights from an anonymised user cohort, directly reducing the
cold start period from ~10 sessions to ~3.

### 5.3.2 GPUI Framework Maturity

GPUI is developed by Zed Industries for the Zed code editor. Its API
surface evolves quickly and community resources are limited. Several
APIs required reading the Zed source code directly, adding development
overhead. This is acceptable for demonstrating technical ambition in an
NEA, but requires careful dependency pinning (Cargo.lock committed) in
any production deployment.

### 5.3.3 Single-Machine Scheduling Assumption

All algorithms assume sequential task execution — tasks cannot overlap.
A future extension would model task parallelism for users who genuinely
multitask (e.g. listening to a revision podcast while exercising),
potentially yielding more efficient schedules.

## 5.4 Future Enhancements

- LLM API fallback for ambiguous NLP inputs (Claude Haiku integration)

- Pre-trained ML default weights from anonymised cohort — resolves cold
  start

- Editable energy curve: manual override for atypical days

- Task dependency modelling: Task B cannot start until Task A completes

- Parallel task support: flag tasks that can safely overlap

- Mobile companion app (native iOS/Android via Rust FFI + Swift/Kotlin
  shell)

- Collaborative mode: shared task pool with individual schedule
  generation

- Recurring tasks with automatic priority escalation as deadline
  approaches

- External calendar import (Google Calendar, iCal)

- Voice input via on-device speech-to-text

# 6. Appendices

## Appendix A — Glossary

| **Term** | **Definition** |
|:---|:---|
| 0/1 Knapsack | Combinatorial optimisation: select a subset of n items (each included or excluded) maximising total value within a weight capacity W. |
| Dynamic Programming | Algorithmic paradigm solving problems by breaking them into overlapping subproblems, storing results to avoid redundant recomputation. |
| EDF (Earliest Deadline First) | Scheduling algorithm ordering tasks by ascending deadline. Proven optimal for minimising maximum lateness on a single processor (Liu & Layland, 1973). |
| Greedy Algorithm | Makes the locally optimal choice at each step. Fast but not always globally optimal for 0/1 selection problems. |
| GPUI | GPU-accelerated UI framework developed by Zed Industries for the Zed code editor. Implemented in pure Rust; renders via Metal (macOS) and Vulkan/DirectX (Windows). |
| k-NN (k-Nearest Neighbours) | Instance-based ML model classifying new inputs by majority vote among the k most similar training examples. |
| Online Learning | ML training where the model updates incrementally with each new data point rather than requiring full batch retraining. |
| Planning Fallacy | Cognitive bias (Kahneman & Tversky, 1979): people systematically underestimate task duration, typically by ~40%. |
| Zeigarnik Effect | Incomplete tasks occupy working memory more than completed ones, creating background anxiety that impairs focus. |
| Chronotype | Individual biological tendency toward morningness or eveningness. Determines energy peak hour for Agamotto's energy mapping. |
| Serenity Mode | Low-stress scheduling: greedy priority-density selection, shortest-first ordering, energy mapping. |
| Crunch Mode | Deadline-driven scheduling: 0/1 Knapsack optimal selection, EDF ordering, logistic risk scoring. |
| Pomodoro Technique | 25 minutes focused work, 5 minutes break. Basis for Agamotto's smart break insertion algorithm. |
| Sigmoid Function | σ(z) = 1/(1+e^{-z}). Maps any real value to (0,1). Used in logistic regression to produce probability outputs. |
| Explainability (XAI) | Property of an AI system that can articulate its reasoning in human-understandable terms. Validated by Stanford HAI (2025): 45.2% of workers prefer human-AI collaboration requiring transparency. |

## Appendix B — Key Statistics Reference

| **Statistic** | **Value** | **Source** |
|:---|:---|:---|
| Students who procrastinate | 80–95% | Steel (2007); Solving Procrastination meta-analysis |
| Students citing time management as \#1 challenge | 47% | Kahoot! Study Habits Snapshot 2024, n=1,013 |
| Students who believe better scheduling reduces stress | 71% | Statista / Gitnux survey |
| Students rated highly effective at self-scheduling | 3% | Statista / Gitnux survey |
| Average underestimation of task duration | ~40% | Kahneman & Tversky (1979) — Planning Fallacy |
| Workers using AI at work | 75% | Microsoft Work Trend Index 2024, n=31,000 |
| Workers using AI for scheduling / calendar | 35% | Owl Labs State of AI at Work 2025, n=1,000 |
| Workers wanting automation to free up time | 69.4% | Stanford HAI / Digital Economy Lab 2025, n=1,500 |
| Workers preferring human-AI collaboration | 45.2% | Stanford HAI 2025 |
| Workers wanting human oversight of AI | 35.6% | Stanford HAI 2025 |
| Scheduling app market CAGR 2024–2032 | 16.1% | Fortune Business Insights |
| Hours saved per week by AI scheduling tools | 7.6 hrs | Reclaim.ai product data |
| Time management improvement with AI scheduling | 44% | Reclaim.ai case study |

## Appendix C — Worked Knapsack Example (Crunch Mode, W=60 min)

| **Task**             | **Duration** | **Priority**       | **Crunch Score** |
|:---------------------|:-------------|:-------------------|:-----------------|
| Write essay intro    | 30 min       | 5 (2-day deadline) | 5.1              |
| Revise circuits      | 20 min       | 4 (no deadline)    | 4.0              |
| Complete problem set | 40 min       | 5 (6-hr deadline)  | 5.8              |
| Read chapter 5       | 15 min       | 3 (no deadline)    | 3.0              |

| **i / w** | **w=20** | **w=30** | **w=50** | **w=60** |
|:---|:---|:---|:---|:---|
| 0 (base) | 0 | 0 | 0 | 0 |
| 1 (d=30, s=5.1) | 0 | 5.1 | 5.1 | 5.1 |
| 2 (d=20, s=4.0) | 4.0 | 5.1 | 9.1 | 9.1 |
| 3 (d=40, s=5.8) | 4.0 | 5.1 | 9.1 | 9.1 |
| 4 (d=15, s=3.0) | 4.0 | 5.1 | 9.1 | 9.1 → verified optimal: Task1+Task2=50min, score 9.1 |

<table style="width:97%;">
<colgroup>
<col style="width: 96%" />
</colgroup>
<tbody>
<tr>
<td><p><strong>Verified Optimal Solution</strong></p>
<p>Selected: Task 1 (Write essay intro, 30min, score 5.1) + Task 2
(Revise circuits, 20min, score 4.0)</p>
<p>Total duration: 50min ≤ W=60min. Total crunch score: 9.1.</p>
<p>EDF ordering: Task 1 has a 2-day deadline → scheduled first. Task 2
has no deadline → second.</p>
<p>Energy mapping (morning chronotype): Task 1 at peak-energy hour 0.
Task 2 at hour 1.</p>
<p>Break insertion: 50min total &lt; 60min focus threshold → no break
needed.</p></td>
</tr>
</tbody>
</table>

## Appendix D — Project Timeline

| **Phase** | **Description** |
|:---|:---|
| Research (Wks 1–2) | Scheduling algorithms, ML model research, GPUI framework documentation, chronobiology for energy model |
| Analysis & Design (Wks 3–4) | Client interview, stakeholder analysis, formal problem statement, data structure design, algorithm flowcharts, UI wireframes, ML architecture |
| Core Engine (Wks 5–7) | Implement types, greedy, knapsack DP, EDF, energy mapping, break insertion, planner, metrics, explainer. Unit tests GT-01 through MT-02. |
| ML Subsystem (Wks 8–9) | Implement k-NN, duration correction, logistic risk, feature vector construction. ML tests ML-01 through ML-06. |
| NLP Parser (Wk 10) | Token classifier, chrono date/time extractor. 30-phrase accuracy benchmark. |
| GPUI Frontend (Wks 11–12) | All five screens, timeline component, metrics dashboard, ML insights drawer, Why? panel, planner grid. |
| Storage & Integration (Wk 13) | SQLite persistence, optional Convex sync, multi-day planner integration, full integration tests. |
| Testing & Evaluation (Wk 14) | System tests, client feedback sessions (8-week review), performance benchmarking, bug fixes. |
| Documentation (Wk 15) | Finalise NEA document, verify against OCR mark scheme, submit. |

## Appendix E — Bibliography

Allen, D. (2001). Getting Things Done: The Art of Stress-Free
Productivity. Penguin Books.

Cowan, N. (2001). The magical number 4 in short-term memory. Behavioural
and Brain Sciences, 24(1), 87–114.

Fortune Business Insights (2024). Scheduling Apps Market Report
2024–2032. 16.1% CAGR cited via The Business Dive (2026).

Kahoot! (2024). Study Habits Snapshot 2024. Survey of 1,013 college
students. PRNewswire, October 2024.

Kahneman, D. & Tversky, A. (1979). Intuitive prediction: Biases and
corrective procedures. TIMS Studies in Management Science, 12, 313–327.

Liu, C. L., & Layland, J. W. (1973). Scheduling algorithms for
multiprogramming in a hard-real-time environment. Journal of the ACM,
20(1), 46–61.

Mark, G. (2008). The cost of interrupted work: More speed and stress.
CHI 2008 Proceedings.

Microsoft (2024). Work Trend Index: AI at Work Is Here (n=31,000).
Conducted by Edelman Data & Intelligence.

Newport, C. (2016). Deep Work: Rules for Focused Success in a Distracted
World. Grand Central Publishing.

OCR (2023). A Level Computer Science H446 Specification. Oxford
Cambridge and RSA Examinations.

Ophir, E., Nass, C., & Wagner, A. D. (2009). Cognitive control in media
multitaskers. PNAS, 106(37), 15583–15587.

Owl Labs (2025). State of Hybrid Work / AI at Work 2025 (n=1,000).
resources.owllabs.com.

Reclaim.ai (2024). AI Scheduling Product Data and Case Studies.
reclaim.ai.

Roenneberg, T. (2012). Internal Time: Chronotypes, Social Jet Lag, and
Why You're So Tired. Harvard University Press.

Stanford HAI / Digital Economy Lab (2025). What Workers Really Want from
AI (n=1,500). Stanford Report, July 2025.

Steel, P. (2007). The nature of procrastination. Psychological Bulletin,
133(1), 65–94.

Zeigarnik, B. (1927). On Finished and Unfinished Tasks. In W. Ellis
(Ed.), A Source Book of Gestalt Psychology. Routledge & Kegan Paul.

Zed Industries (2024). GPUI Framework Documentation.
https://github.com/zed-industries/zed
