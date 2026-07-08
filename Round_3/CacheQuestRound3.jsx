import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ────────────────────────────────────────────────────────────────
   CACHE QUEST · ROUND 3 — MEMORY MANAGER
   Single-file version: data, hook, all components, and styles
   are combined here so the whole prototype lives in one .jsx file.
   ──────────────────────────────────────────────────────────────── */

/* ── Game data ─────────────────────────────────────────────────── */

const INITIAL_MEMORY = [
  "Python",
  "Java",
  "Linux",
  "Git",
  "Docker",
  "React",
  "AWS",
  "Google",
  "MySQL",
  "VS Code",
];

const TOTAL_SLOTS = 10;

const INCOMING_ITEMS = [
  { name: "TensorFlow", hint: "Frequently Accessed" },
  { name: "Azure", hint: "High Chance of Future Request" },
  { name: "Perl", hint: "Access Pattern Unknown" },
  { name: "Kubernetes", hint: "Frequently Accessed" },
  { name: "MongoDB", hint: "Access Pattern Unknown" },
  { name: "Flutter", hint: "High Chance of Future Request" },
  { name: "Redis", hint: "Frequently Accessed" },
];

const REQUEST_SEQUENCE = ["Python", "TensorFlow", "Docker", "Azure", "Git", "Redis", "Java"];

const PHASE1_DURATION_MS = 10_000;
const INCOMING_ITEM_DURATION_MS = 10_000;
const RESULT_DURATION_MS = 10_000;
const EVALUATING_DURATION_MS = 1_800;

const HINT_STYLE = {
  "Frequently Accessed": "hot",
  "High Chance of Future Request": "warm",
  "Access Pattern Unknown": "unknown",
};

/* ── useCountdown hook ─────────────────────────────────────────── */

function useCountdown(durationMs, onComplete, resetKey = [], paused = false) {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemainingMs(durationMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetKey);

  useEffect(() => {
    if (paused) return undefined;
    if (remainingMs <= 0) return undefined;

    const tickMs = 50;
    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - tickMs;
        return next < 0 ? 0 : next;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [paused, remainingMs > 0, ...resetKey]);

  useEffect(() => {
    if (remainingMs === 0) {
      onCompleteRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs]);

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const progress = Math.max(0, Math.min(1, remainingMs / durationMs));

  return { remainingMs, secondsLeft, progress };
}

/* ── Components ────────────────────────────────────────────────── */

function MemoryCard({ index, value, selectable = false, onSelect, flashState = null, justUpdated = false }) {
  const classes = [
    "mem-card",
    selectable ? "mem-card--selectable" : "",
    justUpdated ? "mem-card--updated" : "",
    flashState === "hit" ? "mem-card--hit" : "",
    flashState === "fault" ? "mem-card--fault" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      onClick={selectable ? () => onSelect(index) : undefined}
      disabled={!selectable}
      aria-label={`Memory slot ${index + 1}: ${value}`}
    >
      <span className="mem-card__slot">SLOT {String(index + 1).padStart(2, "0")}</span>
      <span className="mem-card__value">{value}</span>
      {selectable && <span className="mem-card__cta">Click to evict →</span>}
    </button>
  );
}

function MemoryGrid({ memory, selectionMode = false, onSelectSlot, justUpdatedIndex = null, resultFlags = null }) {
  return (
    <div className="mem-grid" role="list">
      {memory.map((item, i) => (
        <MemoryCard
          key={`${i}-${item}`}
          index={i}
          value={item}
          selectable={selectionMode}
          onSelect={onSelectSlot}
          justUpdated={justUpdatedIndex === i}
          flashState={resultFlags ? resultFlags[i] : null}
        />
      ))}
    </div>
  );
}

function MemoryUsageBar({ used, total }) {
  const pct = Math.round((used / total) * 100);
  return (
    <div className="usage-bar" aria-label={`Memory usage ${used} of ${total} slots used`}>
      <div className="usage-bar__label">
        <span>MEMORY USAGE</span>
        <span className="usage-bar__value">
          {used} / {total} SLOTS USED
        </span>
      </div>
      <div className="usage-bar__track">
        <div className="usage-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const PHASE_LABEL = {
  phase1: "PHASE 1 · CURRENT MEMORY SNAPSHOT",
  phase2: "PHASE 2 · INCOMING REQUEST STREAM",
  evaluating: "PHASE 3 · EVALUATING MEMORY",
  phase3: "PHASE 3 · FINAL EVALUATION",
};

function PhaseHeader({ phase }) {
  return (
    <header className="phase-header">
      <div className="phase-header__brand">
        <span className="phase-header__dot" />
        CACHE QUEST
      </div>
      <h1 className="phase-header__title">Round 3 – Memory Manager</h1>
      <div className="phase-header__phase">{PHASE_LABEL[phase] ?? ""}</div>
    </header>
  );
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CountdownRing({ secondsLeft, progress, danger = false }) {
  const offset = CIRCUMFERENCE * (1 - progress);
  return (
    <div className={`countdown-ring ${danger ? "countdown-ring--danger" : ""}`}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle className="countdown-ring__track" cx="44" cy="44" r={RADIUS} />
        <circle
          className="countdown-ring__progress"
          cx="44"
          cy="44"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="countdown-ring__number">{secondsLeft}</span>
    </div>
  );
}

function IncomingItemPanel({ item, index, total, secondsLeft, progress, awaitingSelection, onIgnore, onAccept }) {
  const hintClass = HINT_STYLE[item.hint] ?? "unknown";

  return (
    <div className="incoming" key={item.name}>
      <div className="incoming__meter">
        Request {index + 1} / {total}
      </div>

      <div className="incoming__card incoming__card--enter">
        <div className={`incoming__hint incoming__hint--${hintClass}`}>{item.hint}</div>
        <div className="incoming__name">{item.name}</div>

        <div className="incoming__footer">
          <CountdownRing secondsLeft={secondsLeft} progress={progress} danger={secondsLeft <= 3} />

          {!awaitingSelection ? (
            <div className="incoming__actions">
              <button className="btn btn--ignore" onClick={onIgnore}>
                IGNORE
              </button>
              <button className="btn btn--accept" onClick={onAccept}>
                ACCEPT
              </button>
            </div>
          ) : (
            <div className="incoming__prompt">Select one memory item to replace ↓</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultTable({ rows }) {
  return (
    <table className="result-table">
      <thead>
        <tr>
          <th>Requested Item</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.item}>
            <td>{row.item}</td>
            <td className={row.hit ? "result-table__hit" : "result-table__fault"}>
              {row.hit ? "✅ Cache Hit" : "❌ Page Fault"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ScorePanel({ hits, faults, score }) {
  return (
    <div className="score-panel">
      <div className="score-panel__item score-panel__item--hit">
        <span className="score-panel__label">Cache Hits</span>
        <span className="score-panel__value">{hits}</span>
      </div>
      <div className="score-panel__item score-panel__item--fault">
        <span className="score-panel__label">Page Faults</span>
        <span className="score-panel__value">{faults}</span>
      </div>
      <div className="score-panel__item score-panel__item--score">
        <span className="score-panel__label">Final Score</span>
        <span className="score-panel__value">{score}</span>
      </div>
    </div>
  );
}

/* ── Inline theme (Charcoal / Emerald / Amber / Red) ─────────────── */

const STYLES = `
:root {
  --bg: #121212; --bg-raised: #1a1a1a; --bg-card: #1e1e1e; --border: #2c2c2c;
  --emerald: #22c55e; --emerald-dim: rgba(34,197,94,0.15);
  --amber: #f59e0b; --amber-dim: rgba(245,158,11,0.15);
  --red: #ef4444; --red-dim: rgba(239,68,68,0.15);
  --white: #ffffff; --muted: #9ca3af;
  --mono: "JetBrains Mono", ui-monospace, monospace;
  --sans: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0; background: var(--bg);
  background-image: radial-gradient(circle at 20% 0%, rgba(34,197,94,0.06), transparent 45%),
    radial-gradient(circle at 80% 100%, rgba(245,158,11,0.05), transparent 45%);
  color: var(--white); font-family: var(--sans); -webkit-font-smoothing: antialiased;
}
button { font-family: inherit; }
.app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 28px 20px 60px; }
.app__main { width: 100%; max-width: 1080px; margin-top: 20px; }
.phase-header { width: 100%; max-width: 1080px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.phase-header__brand { font-family: var(--mono); font-size: 12px; letter-spacing: 0.35em; color: var(--muted); display: flex; align-items: center; gap: 8px; }
.phase-header__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--emerald); box-shadow: 0 0 10px var(--emerald); animation: pulse 1.8s ease-in-out infinite; }
.phase-header__title { font-size: clamp(24px, 4vw, 34px); font-weight: 700; margin: 4px 0 2px; letter-spacing: -0.01em; }
.phase-header__phase { font-family: var(--mono); font-size: 12px; letter-spacing: 0.2em; color: var(--amber); }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.usage-bar { width: 100%; max-width: 1080px; margin-top: 22px; background: var(--bg-raised); border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; }
.usage-bar__label { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 11px; letter-spacing: 0.15em; color: var(--muted); margin-bottom: 8px; }
.usage-bar__value { color: var(--emerald); }
.usage-bar__track { height: 8px; border-radius: 999px; background: #0e0e0e; overflow: hidden; border: 1px solid var(--border); }
.usage-bar__fill { height: 100%; background: linear-gradient(90deg, var(--emerald), #4ade80); border-radius: 999px; transition: width 0.5s ease; }
.panel { background: var(--bg-raised); border: 1px solid var(--border); border-radius: 16px; padding: 26px; animation: fadeIn 0.4s ease; }
.panel--split { display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; align-items: start; }
.panel--center { display: flex; align-items: center; justify-content: center; min-height: 320px; }
.panel__caption { font-family: var(--mono); font-size: 12px; color: var(--muted); margin: 0 0 16px; letter-spacing: 0.02em; }
.panel__caption--spaced { margin-top: 28px; }
.panel__caption strong { color: var(--amber); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.mem-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
@media (max-width: 720px) { .mem-grid { grid-template-columns: repeat(2, 1fr); } }
.mem-card { position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 10px; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; color: var(--white); cursor: default; text-align: left; transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
.mem-card__slot { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; color: var(--muted); }
.mem-card__value { font-weight: 600; font-size: 14.5px; }
.mem-card__cta { font-family: var(--mono); font-size: 10px; color: var(--amber); opacity: 0; transition: opacity 0.2s ease; }
.mem-card--selectable { cursor: pointer; border-color: var(--amber); box-shadow: 0 0 0 1px var(--amber-dim); }
.mem-card--selectable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(245,158,11,0.2); }
.mem-card--selectable:hover .mem-card__cta { opacity: 1; }
.mem-card--updated { animation: swapIn 0.6s ease; border-color: var(--emerald); }
@keyframes swapIn { 0% { transform: scale(0.85) rotateX(40deg); opacity: 0; box-shadow: 0 0 0 2px var(--emerald); } 60% { transform: scale(1.04); opacity: 1; } 100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; } }
.mem-card--hit { border-color: var(--emerald); background: linear-gradient(180deg, var(--emerald-dim), var(--bg-card)); }
.mem-card--fault { opacity: 0.7; }
.incoming { display: flex; flex-direction: column; gap: 10px; }
.incoming__meter { font-family: var(--mono); font-size: 11px; letter-spacing: 0.15em; color: var(--muted); text-align: right; }
.incoming__card { background: var(--bg-card); border: 1px solid var(--amber); border-radius: 14px; padding: 22px; box-shadow: 0 0 0 1px var(--amber-dim), 0 12px 30px rgba(0,0,0,0.35); }
.incoming__card--enter { animation: slideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.incoming__hint { display: inline-block; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px; }
.incoming__hint--hot { color: var(--red); background: var(--red-dim); border: 1px solid rgba(239,68,68,0.4); }
.incoming__hint--warm { color: var(--amber); background: var(--amber-dim); border: 1px solid rgba(245,158,11,0.4); }
.incoming__hint--unknown { color: var(--muted); background: rgba(156,163,175,0.12); border: 1px solid rgba(156,163,175,0.3); }
.incoming__name { font-size: 30px; font-weight: 700; margin-bottom: 20px; }
.incoming__footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.incoming__actions { display: flex; gap: 10px; }
.incoming__prompt { font-family: var(--mono); font-size: 13px; color: var(--amber); }
.btn { font-family: var(--mono); font-size: 13px; letter-spacing: 0.05em; padding: 10px 18px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
.btn:hover { transform: translateY(-2px); }
.btn--ignore { background: transparent; border-color: var(--border); color: var(--muted); }
.btn--ignore:hover { border-color: var(--red); color: var(--red); }
.btn--accept { background: var(--emerald); color: #08210f; font-weight: 700; }
.btn--accept:hover { box-shadow: 0 8px 20px rgba(34,197,94,0.35); }
.countdown-ring { position: relative; width: 88px; height: 88px; flex-shrink: 0; }
.countdown-ring__track { fill: none; stroke: var(--border); stroke-width: 5; }
.countdown-ring__progress { fill: none; stroke: var(--emerald); stroke-width: 5; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 50% 50%; transition: stroke-dashoffset 0.05s linear, stroke 0.2s ease; }
.countdown-ring--danger .countdown-ring__progress { stroke: var(--red); }
.countdown-ring__number { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-weight: 700; font-size: 20px; }
.evaluating { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.evaluating__spinner { width: 46px; height: 46px; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--emerald); animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.evaluating h2 { font-family: var(--mono); letter-spacing: 0.1em; color: var(--white); }
.result-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 15px; }
.result-table th, .result-table td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--border); }
.result-table th { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; color: var(--muted); }
.result-table__hit { color: var(--emerald); font-weight: 600; }
.result-table__fault { color: var(--red); font-weight: 600; }
.score-panel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
.score-panel__item { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.score-panel__label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; color: var(--muted); }
.score-panel__value { font-size: 26px; font-weight: 700; }
.score-panel__item--hit .score-panel__value { color: var(--emerald); }
.score-panel__item--fault .score-panel__value { color: var(--red); }
.score-panel__item--score .score-panel__value { color: var(--amber); }
.done { display: flex; flex-direction: column; align-items: center; gap: 18px; width: 100%; text-align: center; }
.done h2 { font-size: 26px; }
@media (max-width: 720px) { .panel--split { grid-template-columns: 1fr; } .score-panel { grid-template-columns: 1fr; } }
`;

/* ── Main App (game engine) ───────────────────────────────────────
   Phases: "phase1" -> "phase2" -> "evaluating" -> "phase3" -> "done" */

export default function App() {
  const [phase, setPhase] = useState("phase1");
  const [memory, setMemory] = useState(INITIAL_MEMORY);

  const [incomingIndex, setIncomingIndex] = useState(0);
  const [awaitingSelection, setAwaitingSelection] = useState(false);
  const [justUpdatedIndex, setJustUpdatedIndex] = useState(null);

  const currentIncoming = INCOMING_ITEMS[incomingIndex];

  // Phase 1: hold the initial snapshot on screen for 10s
  const phase1Countdown = useCountdown(
    PHASE1_DURATION_MS,
    useCallback(() => setPhase("phase2"), []),
    ["phase1"],
    phase !== "phase1"
  );

  // Phase 2: advance through the incoming request stream
  const goToNextIncoming = useCallback(() => {
    setAwaitingSelection(false);
    setIncomingIndex((prev) => {
      const next = prev + 1;
      if (next >= INCOMING_ITEMS.length) {
        setPhase("evaluating");
        return prev;
      }
      return next;
    });
  }, []);

  const phase2Countdown = useCountdown(
    INCOMING_ITEM_DURATION_MS,
    goToNextIncoming, // timed out with no action -> treat like Ignore
    [incomingIndex],
    phase !== "phase2" || awaitingSelection
  );

  const handleIgnore = useCallback(() => {
    if (phase !== "phase2" || awaitingSelection) return;
    goToNextIncoming();
  }, [phase, awaitingSelection, goToNextIncoming]);

  const handleAccept = useCallback(() => {
    if (phase !== "phase2" || awaitingSelection) return;
    setAwaitingSelection(true);
  }, [phase, awaitingSelection]);

  const handleSelectSlot = useCallback(
    (slotIndex) => {
      if (!awaitingSelection) return;
      setMemory((prev) => {
        const next = [...prev];
        next[slotIndex] = currentIncoming.name;
        return next;
      });
      setJustUpdatedIndex(slotIndex);
      window.setTimeout(() => setJustUpdatedIndex(null), 700);
      goToNextIncoming();
    },
    [awaitingSelection, currentIncoming, goToNextIncoming]
  );

  // Evaluating transition (brief, non-interactive)
  useCountdown(
    EVALUATING_DURATION_MS,
    useCallback(() => setPhase("phase3"), []),
    ["evaluating"],
    phase !== "evaluating"
  );

  // Phase 3: compare request sequence against final memory
  const evaluation = useMemo(() => {
    const rows = REQUEST_SEQUENCE.map((item) => ({
      item,
      hit: memory.includes(item),
    }));
    const hits = rows.filter((r) => r.hit).length;
    const faults = rows.length - hits;
    const score = Math.round((hits / rows.length) * 100);
    return { rows, hits, faults, score };
  }, [memory]);

  const resultFlags = useMemo(() => {
    if (phase !== "phase3" && phase !== "done") return null;
    return memory.map((item) => (REQUEST_SEQUENCE.includes(item) ? "hit" : null));
  }, [phase, memory]);

  const phase3Countdown = useCountdown(
    RESULT_DURATION_MS,
    useCallback(() => setPhase("done"), []),
    ["phase3"],
    phase !== "phase3"
  );

  return (
    <div className="app">
      <style>{STYLES}</style>
      <PhaseHeader phase={phase} />
      <MemoryUsageBar used={memory.filter(Boolean).length} total={TOTAL_SLOTS} />

      <main className="app__main">
        {phase === "phase1" && (
          <section className="panel">
            <p className="panel__caption">
              Memory carried over from Round 2. Snapshot closes in{" "}
              <strong>{phase1Countdown.secondsLeft}s</strong>.
            </p>
            <MemoryGrid memory={memory} />
          </section>
        )}

        {phase === "phase2" && currentIncoming && (
          <section className="panel panel--split">
            <div className="panel__memory">
              <p className="panel__caption">Current memory</p>
              <MemoryGrid
                memory={memory}
                selectionMode={awaitingSelection}
                onSelectSlot={handleSelectSlot}
                justUpdatedIndex={justUpdatedIndex}
              />
            </div>
            <IncomingItemPanel
              item={currentIncoming}
              index={incomingIndex}
              total={INCOMING_ITEMS.length}
              secondsLeft={phase2Countdown.secondsLeft}
              progress={phase2Countdown.progress}
              awaitingSelection={awaitingSelection}
              onIgnore={handleIgnore}
              onAccept={handleAccept}
            />
          </section>
        )}

        {phase === "evaluating" && (
          <section className="panel panel--center">
            <div className="evaluating">
              <span className="evaluating__spinner" />
              <h2>Evaluating Memory…</h2>
            </div>
          </section>
        )}

        {phase === "phase3" && (
          <section className="panel">
            <p className="panel__caption">
              Predefined request sequence — result closes in{" "}
              <strong>{phase3Countdown.secondsLeft}s</strong>
            </p>
            <ResultTable rows={evaluation.rows} />
            <ScorePanel hits={evaluation.hits} faults={evaluation.faults} score={evaluation.score} />

            <p className="panel__caption panel__caption--spaced">Final memory state</p>
            <MemoryGrid memory={memory} resultFlags={resultFlags} />
          </section>
        )}

        {phase === "done" && (
          <section className="panel panel--center">
            <div className="done">
              <h2>Round 3 Complete</h2>
              <ScorePanel hits={evaluation.hits} faults={evaluation.faults} score={evaluation.score} />
              <p className="panel__caption">Awaiting next round…</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
