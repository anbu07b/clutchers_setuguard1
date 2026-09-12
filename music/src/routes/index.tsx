import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Gauge,
  Link2,
  Loader2,
  Radio,
  RefreshCw,
  RotateCcw,

  Scale,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Unlink,
  Wallet,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SetuGuard — Partition-Tolerant Payment Authorization" },
      {
        name: "description",
        content:
          "SetuGuard simulates partition-tolerant payment authorization with inline fraud screening, capped offline authorization and deterministic reconciliation.",
      },
      { property: "og:title", content: "SetuGuard — Partition-Tolerant Payment Authorization" },
      {
        property: "og:description",
        content:
          "A synthetic simulation: payments continue during a network partition, fraud stays bounded, reconciliation proves the final state.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Mode = "NORMAL" | "PARTITION" | "RECOVERY";
type Decision = "APPROVED" | "OFFLINE APPROVED" | "BLOCKED" | "RECONCILED";

type Txn = {
  id: string;
  amount: number;
  risk: "LOW" | "HIGH";
  decision: Decision;
  mode: Mode;
};

const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const CEILING = 2000;

const INITIAL_TXNS: Txn[] = [
  { id: "TXN-10482", amount: 500, risk: "LOW", decision: "APPROVED", mode: "NORMAL" },
];

function Dashboard() {
  const [partitioned, setPartitioned] = useState(false);
  const partitionRef = useRef(false);
  const [healed, setHealed] = useState(false);
  const [txns, setTxns] = useState<Txn[]>(INITIAL_TXNS);
  const [seq, setSeq] = useState(10483);
  const [offlineUsed, setOfflineUsed] = useState(0);
  const [reserved, setReserved] = useState(900);
  const [payState, setPayState] = useState<"READY" | "PROCESSING" | "APPROVED" | "OFFLINE" | "BLOCKED">(
    "READY",
  );
  const [fraud, setFraud] = useState(false);
  const [recon, setRecon] = useState<"IDLE" | "RUNNING" | "DONE">("IDLE");
  const [events, setEvents] = useState<string[]>(["Payment received"]);
  const [busy, setBusy] = useState(false);

  const mode: Mode = healed ? "RECOVERY" : partitioned ? "PARTITION" : "NORMAL";
  const balance = 10000;
  const available = balance - reserved;
  const offlineRemaining = CEILING - offlineUsed;

  const netLabel =
    recon === "RUNNING"
      ? "RECONCILING"
      : recon === "DONE"
        ? "RECONCILIATION COMPLETE"
        : partitioned
          ? "NETWORK PARTITIONED"
          : "NETWORK HEALTHY";
  const netTone: "ok" | "warn" | "danger" =
    recon === "RUNNING" ? "warn" : partitioned ? "danger" : "ok";

  const stages = [
    { label: "NETWORK HEALTHY", done: true },
    { label: "PARTITION", done: events.includes("Network partition detected") },
    { label: "PAYMENT CONTINUES", done: offlineUsed > 0 },
    { label: "FRAUD BLOCKED", done: events.includes("Fraud attack blocked") },
    { label: "NETWORK HEALS", done: events.includes("Network healed") },
    { label: "RECONCILIATION COMPLETE", done: recon === "DONE" },
  ];

  const logEvent = (e: string) => setEvents((prev) => (prev.includes(e) ? prev : [...prev, e]));

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const resetDemo = () => {
    if (busy) return;
    partitionRef.current = false;
    setPartitioned(false);
    setHealed(false);
    setTxns(INITIAL_TXNS);
    setSeq(10483);
    setOfflineUsed(0);
    setReserved(900);
    setPayState("READY");
    setFraud(false);
    setRecon("IDLE");
    setEvents(["Payment received"]);
  };


  const simulatePartition = () => {
    partitionRef.current = true;
    setPartitioned(true);
    setHealed(false);
    setRecon("IDLE");
    setPayState("READY");
    logEvent("Network partition detected");
    logEvent("Offline authorization issued");
  };

  const healNetwork = async () => {
    if (busy) return;
    setBusy(true);
    partitionRef.current = false;
    setPartitioned(false);
    setHealed(true);
    logEvent("Network healed");
    setRecon("RUNNING");
    await wait(1600);
    setRecon("DONE");
    logEvent("Reconciliation completed");
    setTxns((prev) => [
      ...prev,
      { id: `TXN-${seq}`, amount: 300, risk: "LOW", decision: "RECONCILED", mode: "RECOVERY" },
    ]);
    setSeq((s) => s + 1);
    setReserved(0);
    setBusy(false);
  };

  const runPayment = async () => {
    if (busy) return;
    const amount = 500;
    if (partitionRef.current && offlineRemaining < amount) return;
    setBusy(true);
    setFraud(false);
    setPayState("PROCESSING");
    await wait(900);
    const offline = partitionRef.current;
    setPayState(offline ? "OFFLINE" : "APPROVED");
    setTxns((prev) => [
      ...prev,
      {
        id: `TXN-${seq}`,
        amount,
        risk: "LOW",
        decision: offline ? "OFFLINE APPROVED" : "APPROVED",
        mode: offline ? "PARTITION" : "NORMAL",
      },
    ]);
    setSeq((s) => s + 1);
    if (offline) setOfflineUsed((u) => Math.min(CEILING, u + amount));
    setReserved((r) => r + amount);
    setBusy(false);
  };

  const launchAttack = async () => {
    if (busy) return;
    setBusy(true);
    setFraud(true);
    setPayState("PROCESSING");
    await wait(700);
    setPayState("BLOCKED");
    setTxns((prev) => [
      ...prev,
      { id: `TXN-${seq}`, amount: 1200, risk: "HIGH", decision: "BLOCKED", mode },
    ]);
    setSeq((s) => s + 1);
    logEvent("Fraud attack blocked");
    setBusy(false);
  };

  const generateReport = async () => {
    if (busy || recon === "DONE") return;
    if (!healed) {
      await healNetwork();
      return;
    }
    setBusy(true);
    setRecon("RUNNING");
    await wait(1400);
    setRecon("DONE");
    logEvent("Reconciliation completed");
    setBusy(false);
  };

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-6 lg:px-8 lg:py-8">
      {/* HEADER */}
      <header className="panel flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">SetuGuard</h1>
            <p className="text-sm text-muted-foreground">Partition-Tolerant Payment Authorization</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Pill tone={netTone}>
            <span
              className={`anim-dot inline-block size-2 rounded-full ${
                netTone === "danger" ? "bg-danger" : netTone === "warn" ? "bg-warn" : "bg-ok"
              }`}
            />
            {netLabel}
          </Pill>

          <Pill tone="muted">
            <Scale className="size-3.5" /> LEDGER: CONSISTENT
          </Pill>
          <Pill tone="muted">
            <Timer className="size-3.5" /> BUDGET: 300ms
          </Pill>
          <button
            onClick={simulatePartition}
            disabled={partitioned}
            className="rounded-xl bg-danger/15 px-4 py-2 font-mono text-xs font-semibold tracking-wider text-danger ring-1 ring-danger/40 transition hover:bg-danger/25 disabled:opacity-40"
          >
            SIMULATE NETWORK PARTITION
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="panel mt-5 grid gap-6 p-6 lg:grid-cols-[1.1fr_1fr] lg:p-8">
        <div>
          <span className="label-xs">System status</span>
          <h2
            className={`mt-2 text-3xl font-bold tracking-tight lg:text-4xl ${partitioned ? "text-danger" : "text-ok"}`}
          >
            {partitioned ? "NETWORK PARTITION ACTIVE" : healed ? "SYSTEM RECOVERED" : "SYSTEM OPERATIONAL"}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {partitioned
              ? "Reduced visibility — partition-aware policy enabled."
              : healed
                ? "Full network visibility restored — deterministic reconciliation applied."
                : "Full network visibility."}
          </p>
          <p className="mt-4 font-mono text-[0.68rem] tracking-wider text-muted-foreground">
            SIMULATION · SYNTHETIC DATA · NOT A REAL BANKING OR UPI SYSTEM
          </p>
        </div>

        <NodeLink partitioned={partitioned} />
      </section>

      {/* DEMO JOURNEY */}
      <section className="panel mt-5 p-5">
        <span className="label-xs">Demo journey</span>
        <ol className="mt-4 flex flex-wrap items-center gap-y-3">
          {stages.map((s, i) => (
            <li key={s.label} className="flex items-center">
              <span
                className={`rounded-full px-3 py-1.5 font-mono text-[0.7rem] font-bold tracking-wider ring-1 transition duration-300 ${
                  s.done
                    ? "bg-primary/15 text-primary ring-primary/50"
                    : "bg-surface-2/60 text-muted-foreground/60 ring-border"
                }`}
              >
                {s.label}
              </span>
              {i < stages.length - 1 && (
                <span
                  className={`mx-2 font-mono text-sm ${s.done ? "text-primary" : "text-muted-foreground/40"}`}
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>


      {/* CONTROL BAR */}
      <section className="panel mt-5 flex flex-wrap gap-3 p-4">
        <Ctrl onClick={simulatePartition} disabled={partitioned} icon={<Unlink className="size-4" />}>
          Simulate Network Partition
        </Ctrl>
        <Ctrl
          onClick={runPayment}
          disabled={busy || (partitioned && offlineRemaining < 500)}
          icon={<Zap className="size-4" />}
          tone="primary"
        >
          Run Genuine Payment
        </Ctrl>
        <Ctrl onClick={launchAttack} disabled={busy} icon={<ShieldAlert className="size-4" />} tone="danger">
          Launch QR Substitution Attack
        </Ctrl>
        <Ctrl onClick={healNetwork} disabled={busy || (!partitioned && healed)} icon={<Link2 className="size-4" />}>
          Heal Network
        </Ctrl>
        <Ctrl
          onClick={generateReport}
          disabled={busy || recon === "DONE"}
          icon={<RefreshCw className="size-4" />}
        >
          Generate Reconciliation Report
        </Ctrl>
        <Ctrl onClick={resetDemo} disabled={busy} icon={<RotateCcw className="size-4" />}>
          Reset Demo
        </Ctrl>
      </section>

      {/* FRAUD WOW MOMENT */}
      {fraud && (
        <section className="anim-rise mt-5 rounded-[var(--radius-xl)] border border-danger/60 bg-danger/10 p-6 lg:p-8">
          <p className="flex items-center gap-3 font-mono text-xl font-extrabold tracking-wider text-danger lg:text-2xl">
            <AlertTriangle className="size-7" /> FRAUD ATTACK DETECTED
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-warn/50 bg-warn/10 p-5">
              <span className="label-xs text-warn">Evidence</span>
              <p className="mt-2 text-lg font-bold leading-snug text-warn lg:text-2xl">
                14 unrelated devices → same destination → within 90 seconds
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <Metric label="Risk" value="HIGH" tone="danger" />
              <Metric label="Score" value="96 / 100" tone="danger" />
              <div className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-danger/60 bg-danger/15 p-3 font-mono text-base font-extrabold tracking-widest text-danger lg:col-span-1">
                <Ban className="size-5" /> BLOCKED
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RECONCILIATION PROOF */}
      {recon === "DONE" && (
        <section className="anim-rise mt-5 rounded-[var(--radius-xl)] border border-ok/50 bg-ok/10 p-6 lg:p-8">
          <p className="flex items-center gap-3 font-mono text-xl font-extrabold tracking-wider text-ok lg:text-2xl">
            <CheckCircle2 className="size-7" /> RECONCILIATION COMPLETE
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Ledger invariant" value="PASSED" tone="ok" />
            <Metric label="Double-spend violations" value="0" tone="ok" />
            <Metric label="Fraud reversals" value="1" tone="danger" />
            <Metric label="Conflicts resolved" value="3" tone="warn" />
          </div>
        </section>
      )}


      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        {/* PAYMENT AUTHORIZATION */}
        <Card title="Live Payment Authorization" icon={<Wallet className="size-4" />}>
          <dl className="grid grid-cols-2 gap-3">
            <Field label="Customer" value="Arjun Kumar" />
            <Field label="Merchant" value="Sri Lakshmi Stores" />
            <Field label="Amount" value="₹500" mono />
            <Field label="Device" value="DEVICE-A17" mono />
            <Field label="Transaction" value={`TXN-${seq}`} mono />
            <Field
              label="Risk"
              value={fraud ? "HIGH" : "LOW"}
              mono
              tone={fraud ? "danger" : "ok"}
            />
          </dl>

          <div
            className={`anim-rise mt-4 rounded-xl border p-4 ${
              payState === "BLOCKED"
                ? "border-danger/50 bg-danger/10"
                : payState === "APPROVED" || payState === "OFFLINE"
                  ? "border-ok/40 bg-ok/10"
                  : "border-border bg-surface-2"
            }`}
          >
            <span className="label-xs">Status</span>
            <p className="mt-1 flex items-center gap-2 font-mono text-lg font-semibold">
              {payState === "READY" && <>READY</>}
              {payState === "PROCESSING" && (
                <>
                  <Loader2 className="size-4 animate-spin text-primary" /> PROCESSING…
                </>
              )}
              {payState === "APPROVED" && (
                <span className="flex items-center gap-2 text-ok">
                  <CheckCircle2 className="size-5" /> APPROVED
                </span>
              )}
              {payState === "OFFLINE" && (
                <span className="flex items-center gap-2 text-ok">
                  <CheckCircle2 className="size-5" /> OFFLINE APPROVED
                </span>
              )}
              {payState === "BLOCKED" && (
                <span className="flex items-center gap-2 text-danger">
                  <Ban className="size-5" /> BLOCKED
                </span>
              )}
            </p>
            {payState === "OFFLINE" && (
              <p className="mt-1 text-xs text-ok/80">Approved under partition policy</p>
            )}
          </div>

          <button
            onClick={runPayment}
            disabled={busy || (partitioned && offlineRemaining < 500)}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-mono text-sm font-bold tracking-wider text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
          >
            PROCESS PAYMENT
          </button>
        </Card>

        {/* CONSERVING LEDGER */}
        <Card title="Conserving Ledger" icon={<Scale className="size-4" />}>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Balance" value={rupee(balance)} />
            <Metric label="Reserved" value={rupee(reserved)} tone="warn" />
            <Metric label="Available" value={rupee(available)} tone="ok" />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-ok/40 bg-ok/10 p-3 font-mono text-sm text-ok">
            <BadgeCheck className="size-4" /> LEDGER STATE: CONSISTENT
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {["No negative balance", "No double-spend", "Controlled authorization"].map((g) => (
              <li key={g} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-ok" /> {g}
              </li>
            ))}
          </ul>
        </Card>

        {/* FRAUD ENGINE */}
        <Card
          title="Inline Fraud Screening"
          icon={<ShieldAlert className="size-4" />}
          highlight={fraud}
        >
          <div className={fraud ? "anim-shake" : undefined}>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Fraud Risk" value={fraud ? "HIGH" : "LOW"} tone={fraud ? "danger" : "ok"} />
              <Metric label="Score" value={fraud ? "96 / 100" : "18 / 100"} tone={fraud ? "danger" : "ok"} />
              <Metric label="Processing" value={fraud ? "88ms" : "94ms"} />
            </div>
            <Bar value={fraud ? 96 : 18} tone={fraud ? "danger" : "ok"} />
            <div
              className={`mt-4 rounded-xl border p-3 font-mono text-sm ${
                fraud ? "border-danger/50 bg-danger/10 text-danger" : "border-ok/40 bg-ok/10 text-ok"
              }`}
            >
              DECISION: {fraud ? "BLOCKED" : "APPROVED"}
            </div>
            {fraud && (
              <div className="anim-rise mt-4 rounded-xl border border-warn/50 bg-warn/10 p-4">
                <span className="label-xs flex items-center gap-2 text-warn">
                  <AlertTriangle className="size-3.5" /> Evidence
                </span>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-warn">
                  14 unrelated devices → same destination → within 90 seconds
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* PARTITION-AWARE POLICY */}
        <Card title="Partition-Aware Policy" icon={<Radio className="size-4" />}>
          <div className="space-y-3">
            <Policy active={mode === "NORMAL"} title="FULL VISIBILITY" lines={["Normal fraud policy"]} />
            <Policy
              active={mode === "PARTITION"}
              title="REDUCED VISIBILITY"
              lines={["Partition-aware policy", "Controlled offline authorization", "Hard spending ceiling"]}
              tone="danger"
            />
            <Policy
              active={mode === "RECOVERY"}
              title="NETWORK HEALED"
              lines={["Deterministic reconciliation"]}
              tone="primary"
            />
          </div>
        </Card>

        {/* OFFLINE AUTHORIZATION */}
        <Card
          title="Offline Authorization"
          icon={<Activity className="size-4" />}
          highlight={partitioned}
          dim={!partitioned}
        >
          <div className="grid grid-cols-2 gap-3">
            {partitioned ? (
              <Metric label="Status" value="ACTIVE" tone="ok" />
            ) : (
              <Metric label="Status" value="STANDBY" />
            )}
            <Metric label="Token" value="DEVICE-BOUND" />
            <Metric label="Spend Ceiling" value={rupee(CEILING)} />
            <Metric label="Validity" value="15 MINUTES" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>USED {rupee(offlineUsed)}</span>
              <span>REMAINING {rupee(offlineRemaining)}</span>
            </div>
            <Bar value={(offlineUsed / CEILING) * 100} tone={offlineRemaining === 0 ? "danger" : "warn"} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Continuity without unlimited exposure — offline spend can never exceed the ceiling.
          </p>
        </Card>

        {/* LATENCY BUDGET */}
        <Card title="300ms Authorization Budget" icon={<Gauge className="size-4" />}>
          <div className="grid grid-cols-4 gap-3">
            <Metric label="Ledger" value="120ms" />
            <Metric label="Fraud" value="100ms" />
            <Metric label="Response" value="80ms" />
            <Metric label="Total" value="300ms" tone="ok" />
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border">
            <div style={{ width: "40%" }} className="bg-primary" />
            <div style={{ width: "33.3%" }} className="bg-accent" />
            <div style={{ width: "26.7%" }} className="bg-ok" />
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-sm text-ok">
            <CheckCircle2 className="size-4" /> WITHIN AUTHORIZATION BUDGET
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {/* TRANSACTION STREAM */}
        <Card title="Live Transaction Stream" icon={<Activity className="size-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="label-xs">
                  {["Transaction", "Amount", "Risk", "Decision", "Mode"].map((h) => (
                    <th key={h} className="pb-2 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {txns.map((t, i) => (
                  <tr key={`${t.id}-${i}`} className="anim-rise border-t border-border/60">
                    <td className="py-2.5">{t.id}</td>
                    <td className="py-2.5">{rupee(t.amount)}</td>
                    <td className={`py-2.5 ${t.risk === "HIGH" ? "text-danger" : "text-ok"}`}>{t.risk}</td>
                    <td
                      className={`py-2.5 ${
                        t.decision === "BLOCKED"
                          ? "text-danger"
                          : t.decision === "RECONCILED"
                            ? "text-primary"
                            : "text-ok"
                      }`}
                    >
                      {t.decision}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{t.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* RECONCILIATION */}
        <Card title="Deterministic Reconciliation" icon={<RefreshCw className="size-4" />} highlight={recon === "DONE"}>
          {recon === "IDLE" && (
            <p className="flex items-center gap-2 font-mono text-sm text-warn">
              <Timer className="size-4" /> WAITING FOR NETWORK RECOVERY
            </p>
          )}
          {recon === "RUNNING" && (
            <p className="flex items-center gap-2 font-mono text-sm text-primary">
              <Loader2 className="size-4 animate-spin" /> RECONNECTING NODES · RECONCILING…
            </p>
          )}
          {recon === "DONE" && (
            <div className="anim-rise">
              <p className="flex items-center gap-2 font-mono text-base font-bold text-ok">
                <CheckCircle2 className="size-5" /> RECONCILIATION COMPLETE
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label="Reviewed" value="147" />
                <Metric label="Conflicts" value="3" tone="warn" />
                <Metric label="Adjustments" value="2" tone="warn" />
                <Metric label="Fraud Reversals" value="1" tone="danger" />
                <Metric label="Double-Spend" value="0" tone="ok" />
                <Metric label="Invariant" value="PASSED" tone="ok" />
              </div>
            </div>
          )}

          <div className="mt-5">
            <span className="label-xs">Event timeline</span>
            <ol className="mt-3 space-y-2">
              {[
                "Payment received",
                "Network partition detected",
                "Offline authorization issued",
                "Fraud attack blocked",
                "Network healed",
                "Reconciliation completed",
              ].map((e) => {
                const done = events.includes(e);
                return (
                  <li key={e} className="flex items-center gap-3 text-sm">
                    <span
                      className={`size-2 shrink-0 rounded-full ${done ? "bg-primary" : "bg-muted"}`}
                    />
                    <span className={done ? "text-foreground" : "text-muted-foreground/60"}>{e}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Card>
      </div>

      {/* GUARANTEES */}
      <section className="mt-5 grid gap-5 md:grid-cols-3">
        {[
          { w: "CONTINUE", d: "Payments continue during controlled network disruption." },
          { w: "CONTROL", d: "Fraud exposure and offline spending remain bounded." },
          { w: "PROVE", d: "Reconciliation produces an auditable final state." },
        ].map((g) => (
          <div key={g.w} className="panel p-6">
            <h3 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-extrabold tracking-tight text-transparent lg:text-4xl">
              {g.w}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{g.d}</p>
          </div>
        ))}
      </section>

      <footer className="py-8 text-center font-mono text-[0.68rem] tracking-wider text-muted-foreground">
        SETUGUARD · FS-2601 · SIMULATED SYNTHETIC DATA · NOT A REAL BANKING OR UPI SYSTEM
      </footer>
    </main>
  );
}

/* ---------- primitives ---------- */

function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "ok" | "danger" | "muted";
}) {
  const tones = {
    ok: "text-ok ring-ok/40 bg-ok/10",
    danger: "text-danger ring-danger/40 bg-danger/10",
    muted: "text-muted-foreground ring-border bg-surface-2",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[0.7rem] font-semibold tracking-wider ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Ctrl({
  children,
  onClick,
  disabled,
  icon,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  tone?: "default" | "primary" | "danger";
}) {
  const tones = {
    default: "bg-surface-2 text-foreground ring-border hover:bg-muted",
    primary: "bg-primary/15 text-primary ring-primary/40 hover:bg-primary/25",
    danger: "bg-danger/15 text-danger ring-danger/40 hover:bg-danger/25",
  } as const;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {icon}
      {children}
    </button>
  );
}

function Card({
  title,
  icon,
  children,
  highlight,
  dim,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
  dim?: boolean;
}) {
  return (
    <section
      className={`panel p-5 transition duration-300 ${
        highlight ? "ring-1 ring-primary/50" : ""
      } ${dim ? "opacity-55" : ""}`}
    >
      <h3 className="flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.16em] text-primary uppercase">
        {icon}
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "ok" | "danger";
}) {
  const color = tone === "danger" ? "text-danger" : tone === "ok" ? "text-ok" : "text-foreground";
  return (
    <div>
      <dt className="label-xs">{label}</dt>
      <dd className={`mt-0.5 text-sm font-semibold ${mono ? "font-mono" : ""} ${color}`}>{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "danger";
}) {
  const color =
    tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface-2/70 p-3">
      <span className="label-xs">{label}</span>
      <p className={`mt-1 font-mono text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Bar({ value, tone = "ok" }: { value: number; tone?: "ok" | "warn" | "danger" }) {
  const bg = tone === "danger" ? "bg-danger" : tone === "warn" ? "bg-warn" : "bg-ok";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border">
      <div
        className={`h-full rounded-full transition-all duration-500 ${bg}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function Policy({
  active,
  title,
  lines,
  tone = "ok",
}: {
  active: boolean;
  title: string;
  lines: string[];
  tone?: "ok" | "danger" | "primary";
}) {
  const ring =
    tone === "danger" ? "ring-danger/50 bg-danger/10" : tone === "primary" ? "ring-primary/50 bg-primary/10" : "ring-ok/50 bg-ok/10";
  return (
    <div
      className={`rounded-xl p-3 ring-1 transition ${active ? ring : "bg-surface-2/50 ring-border opacity-50"}`}
    >
      <p className="font-mono text-sm font-bold tracking-wider">{title}</p>
      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        {lines.map((l) => (
          <li key={l}>→ {l}</li>
        ))}
      </ul>
    </div>
  );
}

function NodeLink({ partitioned }: { partitioned: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/60 p-6">
      <span className="label-xs">Bank node A ↔ Bank node B</span>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Node label="BANK A" ok={!partitioned} />
        <div className="relative flex-1">
          <svg viewBox="0 0 200 12" className="h-3 w-full">
            <line
              x1="0"
              y1="6"
              x2="200"
              y2="6"
              strokeWidth="3"
              strokeLinecap="round"
              className={partitioned ? "stroke-danger/40" : "stroke-ok"}
              strokeDasharray={partitioned ? "6 10" : "12 12"}
              style={partitioned ? undefined : { animation: "flow-dash 1s linear infinite" }}
            />
          </svg>
          {partitioned && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background px-2 font-mono text-lg font-bold text-danger">
              ✕
            </span>
          )}
        </div>
        <Node label="BANK B" ok={!partitioned} />
      </div>
      <p
        className={`mt-5 text-center font-mono text-sm font-bold tracking-[0.2em] ${partitioned ? "text-danger" : "text-ok"}`}
      >
        {partitioned ? "PARTITIONED" : "CONNECTED"}
      </p>
    </div>
  );
}

function Node({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`grid size-16 place-items-center rounded-2xl ring-1 transition ${
          ok ? "bg-ok/10 text-ok ring-ok/50" : "bg-danger/10 text-danger ring-danger/50"
        }`}
      >
        <Radio className="size-6" />
      </div>
      <p className="mt-2 font-mono text-[0.68rem] tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
