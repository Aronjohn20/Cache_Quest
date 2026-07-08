import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ============================================================
   THEME
   ============================================================ */
const COLORS = {
  bg: '#121212',
  bgPanel: '#181818',
  bgRaised: '#1e1e1e',
  border: '#2a2a2a',
  primary: '#22C55E',
  primaryDim: 'rgba(34,197,94,0.15)',
  secondary: '#FFFFFF',
  accent: '#F59E0B',
  accentDim: 'rgba(245,158,11,0.15)',
  error: '#EF4444',
  textDim: '#8a8a8a',
};
const MONO = "'JetBrains Mono','Fira Code',ui-monospace,SFMono-Regular,Menlo,monospace";
const SANS = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

/* ============================================================
   DATA — 3 categories, 8 options each
   ============================================================ */
const CATEGORIES = [
  {
    id: 'prog-languages',
    title: 'Programming Languages',
    options: ['Python', 'Java', 'C++', 'Rust', 'Go', 'JavaScript', 'Kotlin', 'Swift'],
    counterSignal: 'The most trusted option is often overestimated by participants.',
  },
  {
    id: 'databases',
    title: 'Databases',
    options: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'SQLite', 'Cassandra', 'DynamoDB', 'Oracle'],
    counterSignal: 'Popular choices are not always the highest scoring.',
  },
  {
    id: 'cloud-platforms',
    title: 'Cloud Platforms',
    options: ['AWS', 'Azure', 'GCP', 'DigitalOcean', 'Heroku', 'Vercel', 'Oracle Cloud', 'IBM Cloud'],
    counterSignal: 'Reconsider your highest allocation before final submission.',
  },
];

const BLIND_SECONDS = 90;
const SIGNAL_SECONDS = 60;
const RESULT_SECONDS = 10;
const STEP = 5;
const TOTAL_POINTS = 100;

const PHASE = { BLIND: 'blind', SIGNAL: 'signal', RESULT: 'result', DONE: 'done' };

/* ============================================================
   UTIL — simulated room-average allocation generator
   ============================================================ */
function pseudoRandom(seed) {
  const x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
}

function generateRoomAverage(options, seed = 0) {
  const n = options.length;
  const weights = options.map((_, i) => 0.4 + pseudoRandom(seed + i) * 1.6);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let unitsLeft = TOTAL_POINTS / STEP;
  const allocation = {};
  options.forEach((name, i) => {
    if (i === n - 1) {
      allocation[name] = unitsLeft * STEP;
      return;
    }
    const share = Math.round((weights[i] / totalWeight) * (TOTAL_POINTS / STEP));
    const units = Math.max(0, Math.min(share, unitsLeft));
    allocation[name] = units * STEP;
    unitsLeft -= units;
  });
  return allocation;
}

function emptyAllocation(options) {
  return Object.fromEntries(options.map((o) => [o, 0]));
}

/* ============================================================
   HOOK — countdown timer
   ============================================================ */
function useCountdown(seconds, onExpire, resetKey) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsLeft(seconds);
    expiredRef.current = false;
  }, [resetKey, seconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current && onExpireRef.current();
      }
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  return secondsLeft;
}

/* ============================================================
   COMPONENT — circular countdown ring
   ============================================================ */
const R = 20;
const CIRC = 2 * Math.PI * R;

function CountdownRing({ secondsLeft, totalSeconds, label }) {
  const pct = totalSeconds > 0 ? Math.max(0, secondsLeft / totalSeconds) : 0;
  const offset = CIRC * (1 - pct);
  const color = pct > 0.5 ? COLORS.primary : pct > 0.2 ? COLORS.accent : COLORS.error;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO }}>
      <div style={{ position: 'relative', width: 46, height: 46 }}>
        <svg viewBox="0 0 46 46" width="46" height="46" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="23" cy="23" r={R} stroke={COLORS.border} fill="none" strokeWidth="4" />
          <circle
            cx="23"
            cy="23"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: COLORS.secondary }}>
            {secondsLeft}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — single option row (+ / -)
   ============================================================ */
function OptionRow({ name, points, remaining, disabled, onChange }) {
  const canAdd = !disabled && remaining >= STEP;
  const canSub = !disabled && points >= STEP;

  const btnStyle = (enabled) => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: '#232323',
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: enabled ? 1 : 0.3,
    cursor: enabled ? 'pointer' : 'not-allowed',
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: 16,
        padding: '14px 16px',
        border: `1px solid ${points > 0 ? 'rgba(34,197,94,0.35)' : COLORS.border}`,
        borderRadius: 10,
        background: COLORS.bgRaised,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.secondary }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO }}>
        <button
          style={btnStyle(canSub)}
          disabled={!canSub}
          onClick={() => onChange(points - STEP)}
          aria-label={`Decrease ${name}`}
        >
          −
        </button>
        <span style={{ minWidth: 46, textAlign: 'center', fontSize: 18, fontWeight: 700, color: COLORS.secondary }}>
          {points}
        </span>
        <button
          style={btnStyle(canAdd)}
          disabled={!canAdd}
          onClick={() => onChange(points + STEP)}
          aria-label={`Increase ${name}`}
        >
          +
        </button>
      </div>
      <div style={{ width: 90, height: 6, background: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${points}%`, background: COLORS.primary, borderRadius: 4, transition: 'width 0.2s ease' }} />
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — allocation board (remaining bar + option rows)
   ============================================================ */
function AllocationBoard({ options, allocation, disabled, onChange }) {
  const used = Object.values(allocation).reduce((a, b) => a + b, 0);
  const remaining = TOTAL_POINTS - used;
  const pctUsed = (used / TOTAL_POINTS) * 100;
  const remainColor = remaining < 0 ? COLORS.error : remaining <= 20 ? COLORS.accent : COLORS.primary;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          padding: '14px 18px',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          background: COLORS.bgRaised,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 12, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Remaining Points
        </span>
        <div style={{ flex: 1, height: 6, margin: '0 20px', background: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, pctUsed)}%`,
              background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: remainColor }}>
          {remaining}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {options.map((name) => (
          <OptionRow
            key={name}
            name={name}
            points={allocation[name] || 0}
            remaining={remaining}
            disabled={disabled}
            onChange={(next) => onChange(name, next)}
          />
        ))}
      </div>
    </>
  );
}

/* ============================================================
   COMPONENT — counter signal hint banner
   ============================================================ */
function CounterSignal({ message }) {
  return (
    <div
      style={{
        border: '1px solid rgba(245,158,11,0.4)',
        background: COLORS.accentDim,
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontFamily: MONO, color: COLORS.accent, fontWeight: 700, fontSize: 16 }}>!</span>
      <div>
        <strong
          style={{
            display: 'block',
            color: COLORS.accent,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Counter Signal
        </strong>
        <p style={{ margin: 0, color: COLORS.secondary, fontSize: 14, lineHeight: 1.5 }}>{message}</p>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT — result dashboard
   ============================================================ */
function ResultDashboard({ category, allocation, roomAverage, secondsLeft }) {
  const options = category.options;
  const totalScore = options.reduce((sum, name) => sum + Math.min(allocation[name] || 0, roomAverage[name] || 0), 0);

  const cardStyle = {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    background: COLORS.bgRaised,
    padding: '18px 20px',
  };
  const cardHeading = {
    margin: '0 0 14px',
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: COLORS.textDim,
  };
  const statRow = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px dashed ${COLORS.border}`,
    fontSize: 14,
    color: COLORS.secondary,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 28px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.02))',
          border: '1px solid rgba(34,197,94,0.35)',
        }}
      >
        <div>
          <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.textDim, marginBottom: 6 }}>
            Total Score
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, color: COLORS.primary, fontVariantNumeric: 'tabular-nums' }}>
            {totalScore} Points
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: COLORS.textDim, textAlign: 'right' }}>
          Next question in {secondsLeft}s
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={cardStyle}>
          <h4 style={cardHeading}>Your Final Allocation</h4>
          {options.map((name) => (
            <div style={statRow} key={name}>
              <span>{name}</span>
              <span style={{ fontFamily: MONO, fontWeight: 700 }}>{allocation[name] || 0}</span>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <h4 style={cardHeading}>Room Average Allocation</h4>
          {options.map((name) => (
            <div style={statRow} key={name}>
              <span>{name}</span>
              <span style={{ fontFamily: MONO, fontWeight: 700 }}>{roomAverage[name]}</span>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <h4 style={cardHeading}>Points Earned</h4>
          {options.map((name) => {
            const pts = Math.min(allocation[name] || 0, roomAverage[name] || 0);
            return (
              <div style={statRow} key={name}>
                <span>{name}</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: COLORS.primary }}>+{pts}</span>
              </div>
            );
          })}
        </div>

        <div style={cardStyle}>
          <h4 style={cardHeading}>Your Allocation vs Room Average</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {options.map((name) => {
              const you = allocation[name] || 0;
              const room = roomAverage[name] || 0;
              const max = Math.max(you, room, 1);
              const matched = you <= room;
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: COLORS.secondary }}>{name}</span>
                    <span style={{ fontFamily: MONO, color: COLORS.textDim }}>
                      You {you} · Room {room}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ height: 10, borderRadius: 4, background: COLORS.border, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(you / max) * 100}%`,
                          borderRadius: 4,
                          background: matched ? COLORS.primary : COLORS.accent,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <div style={{ height: 10, borderRadius: 4, background: COLORS.border, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(room / max) * 100}%`,
                          borderRadius: 4,
                          background: COLORS.textDim,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APP — Round 1 phase state machine
   ============================================================ */
export default function CacheQuestRound1() {
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [phase, setPhase] = useState(PHASE.BLIND);
  const [allocation, setAllocation] = useState(() => emptyAllocation(CATEGORIES[0].options));
  const [submittedBlind, setSubmittedBlind] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const category = CATEGORIES[categoryIndex];

  const roomAverage = useMemo(
    () => generateRoomAverage(category.options, categoryIndex + 1),
    [categoryIndex, category.options],
  );

  const used = Object.values(allocation).reduce((a, b) => a + b, 0);
  const remaining = TOTAL_POINTS - used;

  const handleChange = useCallback((name, value) => {
    setAllocation((prev) => {
      const currentUsed = Object.values(prev).reduce((a, b) => a + b, 0);
      const delta = value - (prev[name] || 0);
      if (currentUsed + delta > TOTAL_POINTS || value < 0) return prev;
      return { ...prev, [name]: value };
    });
  }, []);

  const goToSignal = useCallback(() => setPhase(PHASE.SIGNAL), []);
  const goToResult = useCallback(() => setPhase((p) => (p === PHASE.SIGNAL ? PHASE.RESULT : p)), []);

  const advanceCategory = useCallback(() => {
    setCategoryIndex((idx) => {
      const nextIdx = idx + 1;
      if (nextIdx >= CATEGORIES.length) {
        setPhase(PHASE.DONE);
        return idx;
      }
      setAllocation(emptyAllocation(CATEGORIES[nextIdx].options));
      setSubmittedBlind(false);
      setPhase(PHASE.BLIND);
      return nextIdx;
    });
  }, []);

  // commit score once per result phase
  const scoreCommitted = useRef(false);
  useEffect(() => {
    if (phase === PHASE.RESULT && !scoreCommitted.current) {
      scoreCommitted.current = true;
      const gained = category.options.reduce(
        (sum, name) => sum + Math.min(allocation[name] || 0, roomAverage[name] || 0),
        0,
      );
      setTotalScore((s) => s + gained);
    }
    if (phase !== PHASE.RESULT) scoreCommitted.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const blindSecondsLeft = useCountdown(BLIND_SECONDS, phase === PHASE.BLIND ? goToSignal : undefined, `${categoryIndex}-blind`);
  const signalSecondsLeft = useCountdown(SIGNAL_SECONDS, phase === PHASE.SIGNAL ? goToResult : undefined, `${categoryIndex}-signal`);
  const resultSecondsLeft = useCountdown(RESULT_SECONDS, phase === PHASE.RESULT ? advanceCategory : undefined, `${categoryIndex}-result`);

  const isBlind = phase === PHASE.BLIND;
  const isSignal = phase === PHASE.SIGNAL;
  const isResult = phase === PHASE.RESULT;
  const isDone = phase === PHASE.DONE;

  const canSubmitBlind = isBlind && blindSecondsLeft === 0 && remaining === 0 && !submittedBlind;

  const btnPrimary = (enabled) => ({
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '12px 26px',
    borderRadius: 8,
    border: '1px solid transparent',
    background: enabled ? COLORS.primary : '#2a2a2a',
    color: enabled ? '#0b1a0f' : COLORS.textDim,
    boxShadow: enabled ? '0 8px 24px -10px rgba(34,197,94,0.6)' : 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
  });

  const phaseBanner = (text, color, bg, borderColor) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 20,
        border: `1px solid ${borderColor}`,
        color,
        background: bg,
      }}
    >
      {text}
    </span>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 64px',
        background: `radial-gradient(circle at 20% 0%, #161f18 0%, ${COLORS.bg} 45%)`,
        fontFamily: SANS,
        color: COLORS.secondary,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          background: 'linear-gradient(180deg, #171717, #131313)',
          marginBottom: 28,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.textDim }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: COLORS.primary,
              display: 'inline-block',
              marginRight: 8,
              boxShadow: `0 0 8px ${COLORS.primary}`,
            }}
          />
          CSI TECHNICAL EVENT · <strong style={{ color: COLORS.primary }}>CACHE QUEST</strong>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 13, color: COLORS.textDim }}>
          Q{Math.min(categoryIndex + 1, CATEGORIES.length)} / {CATEGORIES.length} &nbsp;·&nbsp; Score: {totalScore}
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 920,
          background: COLORS.bgPanel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: '28px 32px',
          boxShadow: '0 20px 60px -30px rgba(0,0,0,0.6)',
        }}
      >
        {!isDone && (
          <>
            <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.accent, margin: '0 0 6px' }}>
              Round 1 — Value Exchange
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 24px', color: COLORS.secondary }}>{category.title}</h1>
              {isBlind && <CountdownRing secondsLeft={blindSecondsLeft} totalSeconds={BLIND_SECONDS} label="Blind Allocation" />}
              {isSignal && <CountdownRing secondsLeft={signalSecondsLeft} totalSeconds={SIGNAL_SECONDS} label="Counter Signal" />}
              {isResult && <CountdownRing secondsLeft={resultSecondsLeft} totalSeconds={RESULT_SECONDS} label="Next Question" />}
            </div>

            {isBlind && phaseBanner('Phase 1 · Blind Allocation', COLORS.secondary, 'rgba(255,255,255,0.04)', COLORS.border)}
            {isSignal && phaseBanner('Phase 2 · Counter Signal', COLORS.accent, COLORS.accentDim, 'rgba(245,158,11,0.4)')}
            {isResult && phaseBanner('Final · Locked', COLORS.error, 'rgba(239,68,68,0.15)', 'rgba(239,68,68,0.4)')}

            {isSignal && <CounterSignal message={category.counterSignal} />}

            {(isBlind || isSignal) && (
              <>
                <AllocationBoard options={category.options} allocation={allocation} disabled={false} onChange={handleChange} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28, gap: 12 }}>
                  {isBlind && (
                    <button
                      style={btnPrimary(canSubmitBlind)}
                      disabled={!canSubmitBlind}
                      onClick={() => {
                        setSubmittedBlind(true);
                        goToSignal();
                      }}
                    >
                      {blindSecondsLeft > 0 ? 'Locked until timer ends' : 'Submit Allocation'}
                    </button>
                  )}
                  {isSignal && (
                    <button style={btnPrimary(remaining === 0)} disabled={remaining !== 0} onClick={goToResult}>
                      Lock Final Allocation
                    </button>
                  )}
                </div>
              </>
            )}

            {isResult && (
              <ResultDashboard category={category} allocation={allocation} roomAverage={roomAverage} secondsLeft={resultSecondsLeft} />
            )}
          </>
        )}

        {isDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 28px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.02))',
                border: '1px solid rgba(34,197,94,0.35)',
              }}
            >
              <div>
                <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.textDim, marginBottom: 6 }}>
                  Round 1 Complete
                </div>
                <div style={{ fontSize: 44, fontWeight: 800, color: COLORS.primary }}>{totalScore} Points</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: COLORS.textDim }}>All {CATEGORIES.length} questions scored</div>
            </div>
            <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 11, color: COLORS.textDim }}>
              Round 1 — Value Exchange finished. Await Round 2 instructions from event control.
            </p>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 11, color: COLORS.textDim, marginTop: 24 }}>
        Cache Quest · Round 1 · Value Exchange · Prototype Build
      </p>
    </div>
  );
}
