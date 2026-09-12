# SetuGuard

**FS-2601 — Partition-Tolerant Payment Authorization with Inline Fraud Screening**
FinTech Sprint '26 · Payments & Risk · Team CLUTCHERS (Anbu, Sobika, Maanvitha, Ritheesh)

> Payments that keep flowing. Fraud that gets caught. Even when the network breaks.

---

## 1. What this is

SetuGuard is a two-node UPI-style payment authorizer. Each node independently:

1. Checks the payer's balance (**conserving ledger** — never negative, never duplicates value)
2. Scores the payment for fraud **inline**, inside the same latency budget as the balance check (not a batch/after-the-fact review)
3. Durably commits the transaction

It keeps authorizing correctly even when the two nodes lose the ability to talk to each other for up to 90 seconds (a **partition**), and automatically reconciles both sides — reversing anything fraudulent that slipped through — the moment they reconnect.

**The one thing this system is built around:** zero double-spends, guaranteed **by construction**, not just checked for afterward. See [Section 4](#4-the-core-design-decision-provable-zero-double-spend).

---

## 2. 3-Command Run

From a clean clone, this reaches a working, demo-ready system in three commands:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start both nodes + seed demo accounts (finishes in well under 60s)
bash scripts/run_both_nodes.sh

# 3. Run the chaos demo: normal traffic -> partition -> attempted double-spend -> heal -> reconciliation report
python bench/chaos_test.py
```

That's it. Node A is now live at `http://127.0.0.1:8001`, Node B at `http://127.0.0.1:8002`.

To stop both nodes:
```bash
bash scripts/stop_both_nodes.sh
```

---

## 3. Architecture

```
        Customer taps to pay
                 |
                 v
   +--------------------------+        sync / gossip        +--------------------------+
   |          NODE A          |  <----(cut during a  ---->  |          NODE B          |
   |  Ledger + Fraud Scorer   |        partition)            |  Ledger + Fraud Scorer   |
   |  Offline Token Issuer    |                               |  Offline Token Issuer    |
   |  Local Tx Log            |                               |  Local Tx Log            |
   +--------------------------+                               +--------------------------+
                 \                                                   /
                  \                                                 /
                   +----------------  Reconciliation  --------------+
                        (runs on heal — diffs both logs,
                         applies the published conflict rule,
                         reverses fraud, emits a report)
```

**State ownership:** each node owns writes to its own local ledger only. There is no shared mutable state during a partition — consistency is restored *after* the fact by reconciliation, never assumed *during* the split.

**Consistency model:** Available + Partition-Tolerant (AP), eventually consistent, deterministic reconciliation. Both nodes keep authorizing during a split because a declined genuine payment is an explicit, scored loss — availability wins, and correctness is guaranteed afterward instead of during.

---

## 4. The core design decision: provable zero double-spend

Rather than letting both nodes spend freely during a partition and hoping reconciliation catches every conflict afterward, SetuGuard **prevents** the conflict from being possible in the first place:

1. While healthy, both nodes gossip every committed transaction to each other, so both hold the same balance for every account.
2. **The instant a node detects it can no longer reach its peer**, it snapshots each account's current balance and splits it into an **escrow ceiling** — by default, half the balance becomes this node's local spending allowance for the duration of the split.
3. While partitioned, a node will only authorize a debit up to its remaining escrow — never against the full original balance.
4. Because both nodes independently apply the same split to the same last-known-good balance, **the sum of what both sides can possibly spend can never exceed the original balance.** Double-spend isn't detected after the fact — it's mathematically impossible during the split.
5. On heal, reconciliation merges both sides' actual usage, restores the true balance (`original − nodeA_used − nodeB_used`), and produces a full report. If usage ever *did* exceed the escrow bound (e.g. a bug, or a deliberately adversarial replay in the sealed test), reconciliation falls back to the **published conflict-resolution rule**: earliest corrected timestamp wins (±40s declared clock-skew tolerance), the losing transaction is reversed with a machine-readable reason code, and the event is logged.

This is the answer to the Round 1 "published conflict-resolution rule" and "consistency model" requirements — fixed here, unchanged for the rest of the event.

---

## 5. Published fraud partition policy

**Chosen policy: cached-profile fallback + mild tightening.**

- **Rejected — stricter only:** over-blocks genuine payments, risks the 1.2% false-positive ceiling.
- **Rejected — looser only:** exactly invites the QR-substitution attack this statement is built around, since the scorer would trust an incomplete graph view more, not less.
- **Chosen:** while partitioned, the fraud scorer falls back to the last known-good graph snapshot taken the instant isolation was detected, merged with whatever live local signal it still has — and the decline threshold is lowered (made stricter) by a configurable multiplier. This preserves fraud recall without the blind spot of "looser," and without the over-blocking of "stricter alone."

This policy is fixed as of this README and does not change for the rest of the event, as required.

---

## 6. API contract

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/authorize` | Authorize a payment (balance check + inline fraud check + commit) |
| `POST` | `/v1/transactions/{transaction_id}/reverse` | Reverse a transaction within the 5-second window (H+8 requirement) |
| `POST` | `/v1/accounts` | Create/seed a demo account |
| `GET` | `/v1/accounts/{account_id}` | Inspect an account's balance + escrow state |
| `POST` | `/v1/partition` | Toggle this node's isolation flag (demo/chaos-test use) |
| `GET` | `/v1/partition/status` | Current partition state for this node |
| `POST` | `/v1/reconcile` | Trigger reconciliation against the peer (auto-runs on heal in the chaos script) |
| `GET` | `/healthz` | Liveness check |
| `GET` | `/metrics` | Prometheus-format domain metrics |

Internal, node-to-node only:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/internal/gossip` | Peer notifies of a newly committed transaction (healthy mode only) |
| `GET` | `/internal/sync-log` | Peer fetches this node's transaction log since a given timestamp (used during reconciliation) |

### Example: authorize a payment

```bash
curl -X POST http://127.0.0.1:8001/v1/authorize \
  -H "Content-Type: application/json" \
  -d '{
        "transaction_id": "tx-0001",
        "account_id": "acct-1",
        "merchant_id": "merchant-9",
        "device_id": "device-abc",
        "amount": 150.0
      }'
```

Response:
```json
{
  "transaction_id": "tx-0001",
  "status": "APPROVED",
  "reason_code": "",
  "evidence": "device_count=1, velocity=1, score=0.05",
  "merchant_alert": "",
  "fraud_score": 0.05,
  "offline_token": null,
  "node_id": "A",
  "latency_ms": 4.2
}
```

Requests are **idempotent** on `transaction_id` — retrying the same ID returns the original result instead of double-processing it.

---

## 7. Numeric constraints and how each is measured

| Constraint | Target | Measurement |
|---|---|---|
| Latency, p99 | ≤ 300ms at 500 concurrent requests | `bench/load_test.py` — raw output printed and saveable to `bench/results/` |
| Double-spend | Zero, always | `bench/chaos_test.py` replays duplicate/conflicting intents across a live partition |
| False-positive ceiling | ≤ 1.2% on genuine traffic | Tune `FRAUD_DECLINE_THRESHOLD` in `.env` against your own labeled cohort |
| Fraud model + feature store | ≤ 512MB, CPU only | In-memory rolling windows only — no ML dependency; verify via `/metrics` `process_memory_bytes` |
| Clock skew tolerance | ±40 seconds | `CLOCK_SKEW_TOLERANCE_SECONDS` in `app/config.py`, applied during reconciliation |
| Fault tolerance | 3-way partition | Run a third node instance with its own `NODE_ID`/`PORT`/`DB_PATH`/`PEER_URL` set — architecture is not hardcoded to exactly two |

---

## 8. Configuration (H+8-ready)

Every fraud threshold and reversal rule lives in environment variables (`app/config.py`), not in code — see `.env.example`. This is deliberate: the statement's mid-event change (adversary shifts to hijacked genuine accounts; mandatory 5-second reversal, including for offline-authorized transactions) is designed to be absorbed as a **config change**, which scores higher than a code change or a rewrite.

```bash
cp .env.example .env
# edit thresholds, then restart the node process
```

---

## 9. Observability

- `GET /healthz` — returns `{"status": "ok", "node_id": "...", "partitioned": false}`
- `GET /metrics` — Prometheus text format, including the domain-specific metrics:
  - `setuguard_authorizations_total{status="approved|declined"}`
  - `setuguard_fraud_blocks_total{reason_code="..."}`
  - `setuguard_double_spends_detected_total` (must stay 0)
  - `setuguard_reconciliation_conflicts_total`
  - `setuguard_partition_state` (0 = healthy, 1 = isolated)

Seed script (`scripts/seed.py`) populates a working demo — accounts, one merchant, and a few warm-up transactions — in well under 60 seconds, as required.

---

## 10. Testing

```bash
pytest tests/                    # unit tests: ledger, fraud scorer, reconciliation logic
python bench/load_test.py        # own load-test harness, raw p50/p95/p99 output
python bench/chaos_test.py       # own partition simulator: cut, attack, heal, verify zero double-spend
```

Both `bench/` scripts are the team's **own harness**, built before the sealed harness is released, per Round 2 requirements.

---

## 11. AI usage

See `AI_LEDGER.md` at the repo root for the per-component log of what was AI-assisted and what was changed by hand. No hosted LLM is called anywhere in the authorization path — the fraud scorer is deterministic rule/graph logic only, as required.

---

## 12. Known limitations (interim — final "Where This Breaks" slide comes at Round 3)

- The escrow split defaults to a flat 50/50 division of the last-known balance; a smarter split (e.g. weighted by each node's typical share of that account's traffic) would reduce false declines during a partition without weakening the zero-double-spend guarantee.
- The feature store is per-process and resets on restart — a real deployment would persist recent graph state.
- Gossip is best-effort UDP-style fire-and-forget over HTTP; a dropped gossip message during otherwise-healthy operation is treated the same as a partition, which is conservative but can over-trigger escrow mode under flaky (not fully down) networking.

---

## 13. Repo layout

```
setuguard/
├── app/
│   ├── config.py          # every tunable threshold, env-driven
│   ├── database.py        # per-node SQLite session
│   ├── models.py          # Account, Transaction, OfflineToken, ReconciliationLog, PartitionState
│   ├── schemas.py         # API request/response contracts
│   ├── fraud.py           # inline rule + graph-based fraud scorer
│   ├── ledger.py          # balance check, escrow, commit, idempotency
│   ├── tokens.py          # offline token signing/verification
│   ├── partition.py       # isolation detection, gossip, escrow snapshot
│   ├── reconciliation.py  # heal-time diff, conflict rule, report
│   ├── metrics.py         # Prometheus counters/gauges
│   └── main.py            # FastAPI app + routes
├── bench/
│   ├── load_test.py       # 500-concurrent latency harness
│   └── chaos_test.py      # partition/heal/double-spend chaos harness
├── scripts/
│   ├── seed.py
│   ├── run_both_nodes.sh
│   └── stop_both_nodes.sh
├── tests/
├── requirements.txt
├── .env.example
├── AI_LEDGER.md
└── README.md
```
