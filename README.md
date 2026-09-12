# FinTech Sprint '26 — FS-2601 Team Playbook

*Built entirely from the official problem statement dossier (v3.2). Universal event rules (Parts 1\u20133) are shared across all five statements. Everything from Part 4 onward is specific to FS-2601 \u2014 Partition-Tolerant Payment Authorization with Inline Fraud Screening.*

---

## PART 1 — WHAT THIS HACKATHON ACTUALLY IS

**Name:** FinTech Sprint '26
**Date:** 12 September 2026 — a single **12-hour sprint**, run in **3 rounds**.
**Domain:** Financial technology — payments, lending, wealth, insurance, AI security.
**Format:** One team, one problem statement, **software only**.
**Max score:** 500 points, split 100 / 150 / 250 across Round 1 / 2 / 3, **before penalties**.

**Core idea:** AI tools are 100% allowed and expected. The rules exist so that "code nobody on the team understands" scores zero — via the Random Author Challenge, mandatory determinism, and a sealed hidden dataset you never see during development.

**In simple words:** *This isn't "who can generate the most code with AI." It's "who can generate it, then own it, test it honestly, and make it survive being poked at live by strangers."*

---

## PART 1B — MANDATORY vs OPTIONAL vs NOT ALLOWED

### ✅ MANDATORY
| Item | What it is | Penalty if missed |
|---|---|---|
| `AI_LEDGER.md` at repo root | Per component: which AI model, what you asked, what you changed | −25 |
| Random Author Challenge readiness | Any teammate explains any 25 lines, live, in 90 seconds | −40 each (up to 2×) |
| No-Oracle Core | Graded authorization path must run with **no hosted LLM call** | Scored path fails |
| Determinism | Same input → same output, always | Metric = 0 if it varies |
| "Where This Breaks" slide | 3 specific conditions producing a wrong answer | −20 if missing/dishonest |
| Reproducible claims | Every slide number must be re-runnable from your repo | −60 |
| Three-Command Run | README section, clean clone → working demo, 3 commands, first try | −15 |
| Observability | `/healthz` + `/metrics` with 3+ **domain-specific** metrics; seed script under 60s | −15 |
| Commit shape | 15+ commits across 6+ distinct clock hours | −20 |
| No secrets | Nothing in repo, history, or logs — the jury greps | −50 |

### 🟡 RECOMMENDED
- A strong AI ledger earns bonus points beyond just avoiding the penalty.
- Honest, non-obvious "Where This Breaks" earns **up to +15**.
- Naming **two rejected alternatives** for your stack is worth **15 of the 100 Round 1 points**.

### ⚪ OPTIONAL
Language, framework, cloud provider — fully open.

### 🚫 NOT ALLOWED
- Any hosted LLM call inside the authorization path (FS-2601 has **no exception** to this — unlike FS-2605).
- Secrets anywhere in the repo, history, or logs.
- Non-deterministic output on repeated identical runs.
- A "Where This Breaks" slide that omits a real weakness or invents a fake one.

---

## PART 2 — TIMELINE

| Time | Event | What YOU must do | Priority |
|---|---|---|---|
| H+0 | Interface contract + sample data released | Match your API to the contract exactly. Don't over-fit to the tiny, "deliberately unrepresentative" sample. | 🔴 Critical |
| H+2:30 | **Round 1 submission** | Max-10-slide PDF: problem framing, architecture, integration design, constraint plan, stack justification. Repo created, `AI_LEDGER.md` started. **Your consistency model + conflict rule + fraud partition policy are LOCKED here.** | 🔴 Critical |
| H+7 | Sealed harness released (container) | Inspect the harness freely; the data inside stays hidden. | 🟡 Important |
| H+8 | Mid-event spec change | For FS-2601: adversary switches from burner accounts to **hijacked genuine accounts** (identity signals stop working), and a **5-second reversal requirement** is added — including for offline-authorized transactions. Scored on speed + files touched. | 🔴 Critical |
| H+8:30 | **Round 2 submission** | Auth core + fraud scorer both running end-to-end, contract-conforming, `bench/` harness with raw output, H+8 change absorbed, `/healthz` + `/metrics` + seed script live. | 🔴 Critical |
| H+9 | Diagnostic run | Headline number only, no breakdown. Sanity-check, don't over-tune. | 🟡 Important |
| H+11:30 | **Round 3 / Final** | Live URL, tagged repo, ≤3-min video, final deck with "Where This Breaks" + cost/footprint. **Crash or timeout = zero, no re-run.** | 🔴 ABSOLUTE CRITICAL |

**The single biggest warning:** *"The most common way to lose: spending hours 9 to 12 adding features instead of making the deployment survive contact with a jury."* Reserve your last 2–3 hours for hardening and rehearsal, not new capability.

---

## PART 3 — JUDGING CRITERIA, DECODED

### ROUND 1 — 100 pts
| Criterion | Pts | For FS-2601, this means |
|---|---|---|
| Problem framing | 15 | Name the merchant, the 2-hour evening peak, and the 20× fraud-leak weighting in the scoring formula — one clear number, sourced from the brief. |
| Architecture rigor | 25 | Diagram both nodes, name your consistency model explicitly (AP, eventually consistent), and show the failure path — not just the happy path. |
| **Integration design** | **25** | Show exactly how the ledger and fraud scorer compete for the same 300ms, and what you sacrifice under partition. **Statements are won or lost here.** |
| Constraint plan | 20 | State the 300ms/500-concurrent/512MB/1.2% budgets and your measurement tool for each — not just the targets. |
| Stack justification | 15 | Two real rejected alternatives (e.g., MongoDB, Kafka event-sourcing) with a real reason each lost. |

### ROUND 2 — 150 pts
| Criterion | Pts | For FS-2601 |
|---|---|---|
| Primary engine | 35 | Ledger + balance check + durable commit, running on your own generated transaction data. |
| Secondary engine | 35 | Fraud scorer running inline (not batch), on the same data, inside the shared budget. |
| Contract conformance | 20 | Automated script checking your API against the H+0 contract. |
| Your own harness | 30 | `bench/` — your own partition simulator + load test, with raw numbers, built *before* the sealed harness arrives. |
| H+8 change absorbed | 30 | Ideally a config change (new fraud feature weights, reversal window) — not a rewrite. |

### ROUND 3 — 250 pts
| Criterion | Pts | For FS-2601 |
|---|---|---|
| Sealed evaluation | 100 | Genuine payments completed per 1,000 attempts during partition, minus 20× leaked fraud value — gated on zero double-spends. |
| Jury defense | 50 | 5-min pitch + both Random Author Challenges. |
| Demo craft | 35 | Live URL; a non-engineer follows the partition/heal story. |
| Reliability | 25 | Survives clicks out of order + one live network cut. |
| Failure disclosure | 20 | Honest "Where This Breaks" — e.g., specific attack patterns your rules genuinely miss. |
| Cost & footprint | 20 | Cost per 1,000 authorizations + peak RAM, measured and shown. |

**Tie-break order:** sealed evaluation → H+8 blast radius → cost per 1,000 → Round 1 integration design. Your Round-1 integration slide, written before any code exists, can decide a tie.

### OPTIMIZATION STRATEGY FOR FS-2601 SPECIFICALLY
1. **Design the fraud partition policy as config, from hour 1.** The H+8 change (hijacked real accounts breaking identity signals) is foreseeable — build your fraud thresholds and feature weights as editable values, not hardcoded logic.
2. **Build the ledger and fraud scorer against the same seam first.** Don't build a "perfect" ledger in isolation and bolt fraud scoring on at hour 9 — that is explicitly the most common way teams fail this exact statement.
3. **Zero double-spend is non-negotiable — test it obsessively.** It's a hard gate, not a scored metric; a single failure zeroes your entire availability score regardless of how good everything else is.
4. **Treat your partition simulator as a first-class deliverable**, not a demo prop — it's your Round 2 "own harness" (30 pts) and your Round 3 reliability proof (25 pts) at the same time.
5. **Reserve the last 2 hours for rehearsing the live partition-cut-and-heal demo specifically** — it is the single riskiest live moment in your whole presentation.

---

## PART 4 — FS-2601, EXPLAINED SIMPLY

**Domains spanned:** Digital Payments + Fraud Detection.

**Simple explanation:** A customer taps to pay at a shop using UPI. In under 300 milliseconds, the system must (1) confirm the money is there, (2) confirm it isn't a scam, and (3) permanently record it. It must keep doing this correctly even when parts of the network can't talk to each other for up to 90 seconds — and fraud rings deliberately attack during exactly those moments, because detection is weakest when the transaction graph is split.

**Target users:** Small merchants processing 300–400 UPI payments/day, concentrated in a two-hour evening peak.

**The core conflict:** Fraud detection wants more history and deeper graph traversal; authorization allows ~300ms total. The most useful fraud signal (many unrelated devices paying one destination in a short window) is graph-structured — and during a partition, each side only sees half the graph.

**Expected build:** A conserving ledger (never negative, never duplicates value) · an inline fraud scorer with machine-readable reason codes · a published, fixed partition policy for the fraud scorer · cryptographically bound offline authorization tokens with a spend ceiling · deterministic reconciliation on heal, with a full conflict report · a plain-language merchant alert.

**Key numeric constraints:** 300ms p99 at 500 concurrent requests · **zero double-spends** (hard gate) · false-positive ceiling 1.2% · fraud model + feature store ≤ 512MB, CPU-only · three-way partition tolerance · ±40s clock skew · no hosted LLM in the authorization path.

**Technical difficulty: 🔴 VERY HIGH.** This is a genuine distributed-systems problem (CAP trade-offs, conflict resolution, idempotency, cryptographic tokens) combined with real-time graph-based fraud detection — hard even for professional engineers, which is exactly why the integration-design criterion is weighted so heavily.

**Existing solution landscape (general context, not from the dossier):** Real UPI risk engines exist at NPCI/bank level, and Byzantine fault-tolerant payment systems are a studied academic area — this is a competitive space, so judges may expect real engineering rigor rather than a toy simulation.

**MVP:** single-node ledger + rule-based (not ML) fraud score + a basic two-process partition simulator with a manual on/off switch.
**Advanced version:** graph-based mule-chain detection + cryptographically signed offline tokens + full automated chaos-testing harness.

**Risks:** distributed-systems bugs are notoriously hard to demo live and even harder to debug under time pressure; a single double-spend anywhere in the sealed run erases the entire availability score no matter how good the rest of the system is.

---

## PART 5 — RECOMMENDED INNOVATIONS (ranked)

1. **Cached-profile fallback fraud policy** — score against the last known-good graph snapshot during a partition, with mild threshold tightening. Solves the "stricter over-blocks / looser under-catches" trap directly.
2. **Deterministic reconciliation with a full conflict report** — every reversal comes with a reason code, the rule applied, and a timestamp trail. This is your reproducibility proof and your Round 3 sealed-eval requirement in one.
3. **Cryptographically bound offline tokens** — device + time-window + spend-ceiling bound, so a partitioned node can keep authorizing without trusting the customer's claimed balance blindly.
4. **Config-driven fraud thresholds and reversal window** — the exact lever the H+8 change will pull. Build it as data, not code, from hour 1.
5. **Live transaction-graph visualization** — turns an abstract "mule chain" or "QR substitution" block into something a non-technical judge can actually see and understand.
6. **Plain-language merchant alert** — small effort, direct points (part of the "Expected Solution" list), and makes the demo feel like a real product rather than an API response.

### RECOMMENDED CORE COMBINATION (one coherent live-demo story)
**Normal flow → live partition injected → payments keep flowing on both sides → live double-spend attempt across the split → live heal → reconciliation report appears, fraud reversed, reasons shown.**
This is one continuous, escalating narrative — not four disconnected feature demos — and it directly maps to the Reliability (25 pts) and Sealed Evaluation (100 pts) criteria.

---

## PART 6 — WOW FACTOR MOMENTS (live demo)

| # | Moment | What the judge sees | Why it lands | Powered by | Difficulty | Reliability risk |
|---|---|---|---|---|---|---|
| 1 | Cut the network live on stage | Two nodes visibly stop syncing | Makes "partition tolerance" tangible, not theoretical | Manual kill-switch between node processes | Low | Low |
| 2 | Payments keep succeeding on both sides during the cut | Dashboard shows approvals continuing on A and B independently | Proves availability wasn't sacrificed | Local ledgers + offline tokens | Medium | Medium |
| 3 | A double-spend attempt is made across both partitioned sides | Attempt visibly fails or is later caught and reversed | The single most important correctness guarantee, shown live | Ledger invariant + reconciliation | Medium-High | Medium |
| 4 | Network restored on stage | Sync resumes automatically | Sets up the reconciliation payoff | Heal detection logic | Low | Low |
| 5 | Reconciliation report appears with reasons | Plain-language list: "Reversed Tx#4821 — later timestamp, conflict with Tx#4819" | Turns an abstract "conflict rule" into a concrete, auditable outcome | Reconciliation service | Medium | Low-Medium |
| 6 | Merchant alert shown in plain language | "Payment blocked — this looked like a scam" instead of an error code | Product-feel, not infra-feel | Alert templating | Low | Low |
| 7 | `/metrics` dashboard live during the demo | Real latency/throughput/fraud-blocked numbers ticking | Proves "reproducible claims" instantly, no slideware | `/metrics` endpoint | Low | Low |

**Priority for demo:** #1 → #2 → #3 → #4 → #5 → #6, with #7 running continuously in the background throughout.

---

## PART 7 — FEATURE PRIORITIZATION

### MUST HAVE (without these, you cannot be graded at all)
- Conserving ledger: balance check, commit, never negative, never duplicates value
- Inline rule/graph-based fraud scorer running within the shared 300ms budget
- Two-node partition simulator with a manual (or scripted) cut/heal switch
- Cryptographically bound offline authorization tokens with a spend ceiling
- Deterministic reconciliation engine producing a full conflict report
- Published, fixed consistency model + conflict-resolution rule + fraud partition policy
- Plain-language merchant alert
- `/healthz` + `/metrics` with 3+ domain-specific metrics (e.g., authorizations/sec, current p99, fraud blocks/reversals)
- `AI_LEDGER.md`, README with "3-Command Run"
- H+8 change absorbed via config (fraud feature weights, reversal window), not a rewrite

### SHOULD HAVE (strong differentiators, after MUST HAVE works end-to-end)
- Live transaction-graph visualization for QR-substitution/mule-chain evidence
- Automated chaos-test script (random partitions, clock skew, simultaneous double-spend attempts)
- Load-test report at 500 concurrent, committed with raw output
- Clock-skew injection and correction demo

### NICE TO HAVE (only after Round 2 is solid and Round 3 is rehearsed)
- Animated partition/heal visualization
- Historical fraud-pattern dashboard
- Multi-language merchant alerts

### NOT NEEDED (sounds impressive, isn't worth the time)
- A real multi-region cloud deployment — simulate partitions logically on one machine or two local processes instead.
- Deep learning for fraud scoring — a well-designed rule/graph-feature system is deterministic, explainable, and fits the 512MB/CPU-only budget far more easily.
- A full merchant mobile app — a simple web page is enough; mobile isn't scored.
- Kafka/event-sourcing infrastructure — high setup risk for a 12-hour build; direct API + DB writes are easier to test, explain in the Random Author Challenge, and keep inside the latency budget.

---

## PART 8 — COMPLETE USER FLOW

**Flow A — Normal payment:**
```
Customer taps to pay → Balance check (local ledger)
   ↓
Fraud score lookup (rolling feature snapshot, not live graph walk)
   ↓
Ledger commit (durable, append-only write)
   ↓
Response: APPROVED / DECLINED, under 300ms
```

**Flow B — Partition + heal:**
```
Sync link between Node A and Node B is cut
   ↓
Each node keeps authorizing independently, using cached-profile fallback fraud policy
   ↓
Offline tokens (signed, capped, time-boxed) back any authorization made while isolated
   ↓
Sync link restored
   ↓
Reconciliation service diffs both transaction logs
   ↓
Conflict rule applied (earliest corrected timestamp wins) → losing transaction reversed
   ↓
Conflict report generated; merchant alert shown for any reversed/blocked payment
```

**Flow C — H+8 change absorption:**
```
New adversary pattern (hijacked real accounts) + 5-second reversal requirement announced
   ↓
Update fraud feature weights via config (not code) to reduce reliance on identity signals
   ↓
Add a "reverse within 5 seconds" endpoint that works even for offline-authorized transactions
   ↓
Re-run bench/ harness to confirm latency budget still holds
```

---

## PART 9 — TECH STACK

**Backend:** Python (FastAPI) — strong async support for 500 concurrent connections, fast to iterate on API contracts.
**Database:** PostgreSQL — transactions give the conserving-ledger invariant close to "for free," instead of hand-rolling atomicity.
**Partition simulation:** Two separate server processes on different ports, with a manual toggle that stops them calling each other's sync endpoint.
**Fraud scoring:** Hand-written rules + a rolling feature snapshot (recent transaction counts/destinations per device) — deterministic, explainable, no ML dependency.
**Frontend:** Simple React or plain HTML/JS for the merchant alert screen and an optional live dashboard.
**Load testing:** A Python `asyncio`/`aiohttp` script, or `k6`, for the 500-concurrent test.
**Hosting:** Render, Railway, or Fly.io — quick to get a live, externally reachable URL for Round 3.

**Two rejected alternatives (for the stack-justification slide):**
- **Node.js + MongoDB** — MongoDB's default consistency model makes a strict, always-conserving ledger harder to enforce without extra application-level locking; Node's single-threaded event loop adds risk to p99 once fraud scoring is CPU-bound under load.
- **Kafka-based event-sourcing architecture** — technically elegant, but every message passing through a broker before the ledger sees it makes the 300ms p99 harder to guarantee, and it's too much operational setup risk for a 12-hour build.

---

## PART 10 — ARCHITECTURE

Single API service per node × 2 nodes, each with its own local database, fraud scorer, and offline-token issuer — plus a shared reconciliation service that only runs on heal.

```
[Node A: API + Ledger + Fraud Scorer + Token Issuer]  <--sync-->  [Node B: same]
                         \                                  /
                          \                                /
                           [Reconciliation Service — runs on heal]
```

**Consistency model:** Available + Partition-Tolerant (AP), eventually consistent, with deterministic reconciliation restoring correctness after the fact rather than during the split — because a declined genuine payment is an explicit, scored loss.

**State ownership:** each node owns writes to its own local ledger only; no shared mutable state during a partition.

**Failure path:** node crash mid-write → durable log (WAL) replay on restart; partition → offline tokens + cached-profile fraud fallback; heal → reconciliation with full conflict report.

---

## PART 11 — DATABASE

**Tables:**
- `accounts` — account_id, balance, node_id
- `transactions` — transaction_id, from_account, to_account, amount, status, timestamp, node_id, fraud_score, fraud_reason
- `offline_tokens` — token_id, account_id, spend_ceiling, valid_from, valid_until, used_amount
- `reconciliation_log` — conflict_id, transaction_ids_involved, rule_applied, resolution, timestamp

Kept intentionally small — four tables is enough for both engines and the reconciliation report.

---

## PART 12 — AI REQUIREMENTS

**No hosted LLM anywhere in the authorization path — no exception for FS-2601.**
- **INPUT:** none during live authorization.
- **PROCESS:** fraud detection is hand-written rules + graph-derived features (e.g., distinct-device count paying one destination within a rolling window) — ordinary deterministic code.
- **OUTPUT:** N/A for the scored path.
- **FAILURE:** N/A for the scored path.

AI tools (Claude, Copilot, etc.) may only be used to help write code, tests, or copy faster — never to make a live authorization or fraud decision.

---

## PART 13 — DEMO FLOW (Round 3, ~5 minutes)

1. **Opening (30s):** the merchant, the 300ms window, why declines and leaked fraud both cost real money.
2. **Normal flow (45s):** payments flowing, dashboard live, a fraud block shown with its plain-language alert.
3. **Partition injected (60s):** cut the sync link on stage; show both nodes still authorizing independently.
4. **Attack under partition (45s):** attempt a double-spend across both sides; show it's caught.
5. **Heal + reconciliation (60s):** restore the link; show the automatic conflict report and reversed transaction with its reason.
6. **Numbers (30s):** `/metrics` — real p99 latency, cost per 1,000 authorizations, peak RAM.
7. **Closing — "Where This Breaks" (30s):** three specific, honest conditions where the system would give a wrong answer.

---

## PART 14 — RISKS & MITIGATIONS

| Risk | Mitigation |
|---|---|
| 300ms budget slips under 500 concurrent load | Load-test from hour 2, not hour 10; profile the fraud-lookup path first — it's the largest budget item. |
| A double-spend slips through during testing | Write the chaos test (duplicate-intent replay across partitions) before the demo, run it repeatedly, treat any failure as release-blocking. |
| Reconciliation logic becomes tangled | Fix the conflict rule in writing at Round 1 and never touch its core logic again except via the H+8 config change. |
| H+8 change requires an architectural rewrite | Keep fraud thresholds/weights and the reversal window in config from hour 1, specifically because this category of change is foreseeable from the Technical Constraints section. |
| Live partition demo fails to reconnect cleanly on stage | Rehearse the exact cut/heal sequence at least 5 times before Round 3; have a scripted fallback trigger, not a manual network cable pull. |

---

## PART 15 — QUICK REFERENCE SUMMARY

**MUST-HAVE FEATURES:** Conserving ledger, inline fraud scorer, partition simulator, offline tokens, deterministic reconciliation, merchant alert, `/healthz` + `/metrics`, `AI_LEDGER.md`, 3-Command Run README.

**NICE-TO-HAVE FEATURES:** Transaction-graph visualization, automated chaos harness, clock-skew demo.

**FEATURES WE WILL NOT BUILD:** Real multi-region cloud deployment, deep learning fraud model, native mobile merchant app, Kafka/event-sourcing infrastructure.

**TECH STACK:** Backend: FastAPI (Python). Database: PostgreSQL. Frontend: React or plain HTML/JS. Load testing: Python asyncio/aiohttp or k6. Hosting: Render/Railway/Fly.io.

**ARCHITECTURE:** Two independent nodes (ledger + fraud scorer + token issuer each), plus a reconciliation service that runs only on heal.

**DATABASE:** Tables: accounts, transactions, offline_tokens, reconciliation_log.

**AI:** No hosted LLM in the authorization path, under any circumstance. Rule/graph-based fraud scoring only.

**USER FLOW:** See Part 8 (normal payment, partition + heal, H+8 absorption).

**RISKS:** See Part 14 — top risks: latency slipping under load, a double-spend slipping through, reconciliation logic complexity, H+8 forcing a rewrite, live demo reconnect failure.

**DEMO FLOW:** See Part 13 — 5-minute script: opening → normal flow → live partition → live attack attempt → live heal + reconciliation → metrics → failure disclosure.

**JUDGE APPEAL:** Concrete, live-testable claims — especially the live partition-cut-and-heal sequence — over slideware; a coherent narrative a non-technical judge can follow start to finish.

---

## PART 16 — FINAL TEAM DECISION

1. **PROBLEM STATEMENT:** FS-2601 — Partition-Tolerant Payment Authorization with Inline Fraud Screening (confirmed).
2. **WHY:** Highest technical ceiling of the five statements, but every hard part (CAP trade-offs, conflict resolution, offline tokens, graph-based fraud features) has a well-documented engineering pattern — the risk is in execution discipline, not unsolved research.
3. **BEST CORE IDEA:** A payment system where availability during a network split is treated as a first-class requirement, with correctness restored honestly and automatically afterward — not assumed throughout.
4. **BEST 2–4 INNOVATIONS:** (1) cached-profile fallback fraud policy, (2) deterministic reconciliation with a full conflict report, (3) cryptographically bound offline tokens, (4) config-driven fraud thresholds ready for the H+8 change.
5. **MUST-HAVE MVP:** See Part 7.
6. **WHAT WE SHOULD NOT BUILD:** Real multi-region deployment, deep learning fraud model, native mobile app, Kafka/event-sourcing.
7. **BIGGEST TECHNICAL RISK:** A double-spend slipping through during the sealed chaos run — this is a hard gate, not a partial-credit metric, and zeroes the entire availability score.
8. **HOW TO MITIGATE IT:** Write the duplicate-intent chaos test in Round 2, not Round 3; run it after every change to the ledger or reconciliation logic; never treat it as "done" until it passes on a fresh clone.
9. **STRONGEST JUDGE-WOW MOMENT:** Cutting the network live, watching both nodes keep authorizing independently, then watching the automatic reconciliation report catch and reverse a live double-spend attempt the moment the network heals.
10. **STRONGEST IMPACT STATEMENT:** "We didn't just build a payment system that works when everything is connected — we built one that stays honest and available precisely when it's hardest to be both."

### TEAM TAKEAWAY (under 2 minutes, plain language)
We're building a payment authorization system for small merchants — the kind who process hundreds of UPI payments a day, mostly in a two-hour evening rush where every second and every wrongly declined sale matters. The twist is that the network connecting parts of the payment system sometimes splits for up to 90 seconds, and fraud rings deliberately attack during exactly those moments because fraud detection is weakest when it can't see the whole picture. Our system keeps approving genuine payments even during a split, using signed, spending-capped offline tokens — and the moment the network reconnects, it automatically finds any conflicts, reverses anything fraudulent that slipped through, and produces a clear report of exactly what happened and why. In the live demo, we'll cut the network on stage, keep taking payments on both sides, attempt a double-spend across the split, heal the network, and watch the system catch and reverse it automatically — live, no tricks. It's a project about staying available and honest at the same time, especially when that's hardest.

### TEAM DECISIONS REQUIRED (before any coding starts)
1. Confirm the tech stack (FastAPI + PostgreSQL recommended) so setup can start immediately.
2. Choose and **commit** to the exact consistency model + conflict-resolution rule + fraud partition policy — locked at Round 1, scored against for the rest of the day.
3. Decide how the two "nodes" will be simulated (two separate processes on different ports is recommended).
4. Assign roles: who owns the ledger, who owns the fraud scorer, who owns the reconciliation/chaos test, who owns the demo/deck.
5. Agree on the one sourced figure for the problem-framing slide (recommended: the dossier's own 300\u2013400 payments/day + 2-hour peak + 20\u00d7 fraud-leak weighting).
6. Agree on the two rejected architecture alternatives for the stack-justification slide.
7. Decide the demo script order and who presents which section; start rehearsing the live partition-cut-and-heal sequence well before Round 3.
8. Set up the shared repo, `AI_LEDGER.md`, and commit steadily across the day — not in one late burst.

**No code has been written or files modified as part of this document. This is for understanding, research, strategy, and idea selection only. Review as a team and confirm before development begins.**
