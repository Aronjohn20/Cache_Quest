import React, { useEffect, useMemo, useRef, useState } from 'react'

/* ============================================================
   CACHE QUEST — ROUND 2 : CACHE SELECTION
   One self-contained React component (data + UI + styles).
   Drop this file into any React app: <CacheQuestRound2 />
   ============================================================ */

/* ---------------------------------------------------------------
   DATA
--------------------------------------------------------------- */
const CARDS = [
  { id: 'python', name: 'Python', tag: 'Py' },
  { id: 'java', name: 'Java', tag: 'Jv' },
  { id: 'c', name: 'C', tag: 'C' },
  { id: 'cpp', name: 'C++', tag: 'C++' },
  { id: 'rust', name: 'Rust', tag: 'Rs' },
  { id: 'go', name: 'Go', tag: 'Go' },
  { id: 'kotlin', name: 'Kotlin', tag: 'Kt' },
  { id: 'swift', name: 'Swift', tag: 'Sw' },
  { id: 'dart', name: 'Dart', tag: 'Dt' },
  { id: 'ruby', name: 'Ruby', tag: 'Rb' },
  { id: 'php', name: 'PHP', tag: 'Php' },
  { id: 'perl', name: 'Perl', tag: 'Pl' },
  { id: 'scala', name: 'Scala', tag: 'Sc' },
  { id: 'haskell', name: 'Haskell', tag: 'Hs' },
  { id: 'lua', name: 'Lua', tag: 'Lu' },
  { id: 'matlab', name: 'MATLAB', tag: 'Ml' },
  { id: 'r', name: 'R', tag: 'R' },
  { id: 'sql', name: 'SQL', tag: 'SQL' },
  { id: 'html', name: 'HTML', tag: '<>' },
  { id: 'css', name: 'CSS', tag: '#' },
  { id: 'javascript', name: 'JavaScript', tag: 'Js' },
  { id: 'typescript', name: 'TypeScript', tag: 'Ts' },
  { id: 'bash', name: 'Bash', tag: '$_' },
  { id: 'assembly', name: 'Assembly', tag: 'Asm' },
  { id: 'docker', name: 'Docker', tag: 'Dk' },
  { id: 'kubernetes', name: 'Kubernetes', tag: 'K8s' },
  { id: 'git', name: 'Git', tag: 'Gt' },
  { id: 'linux', name: 'Linux', tag: 'Lx' },
  { id: 'react', name: 'React', tag: '⚛' },
  { id: 'nodejs', name: 'NodeJS', tag: 'Nd' },
]

// The coordinator's predefined "true" cache. Score = correct matches x 5.
// Wrong picks (cache misses) score 0 — never negative.
const PREDEFINED_CACHE = [
  'Python',
  'Java',
  'Docker',
  'Git',
  'Linux',
  'SQL',
  'React',
  'JavaScript',
  'NodeJS',
  'Rust',
]

const MAX_SELECTION = 10
const ROUND_DURATION_SECONDS = 120
const RESULT_DISPLAY_SECONDS = 10
const POINTS_PER_HIT = 5

/* ---------------------------------------------------------------
   STYLES (injected once, scoped by the .cq-* prefix)
--------------------------------------------------------------- */
const STYLES = `
.cq-root {
  --bg-void: #0b0d10;
  --bg-base: #101317;
  --bg-panel: #171b20;
  --bg-panel-raised: #1e232a;
  --bg-chip: #14181d;
  --line: #2a3038;
  --line-soft: #1f242b;
  --white: #f4f6f8;
  --muted: #8a93a1;
  --muted-2: #6b7480;
  --emerald: #17c37b;
  --emerald-dim: #0e7a4d;
  --emerald-glow: rgba(23, 195, 123, 0.45);
  --emerald-wash: rgba(23, 195, 123, 0.1);
  --amber: #f5a623;
  --amber-glow: rgba(245, 166, 35, 0.4);
  --amber-wash: rgba(245, 166, 35, 0.1);
  --red: #e8544a;
  --red-glow: rgba(232, 84, 74, 0.35);
  --red-wash: rgba(232, 84, 74, 0.1);
  --font-mono: 'JetBrains Mono', 'Consolas', monospace;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  min-height: 100%;
  background:
    radial-gradient(1100px 600px at 15% -10%, rgba(23, 195, 123, 0.07), transparent 60%),
    radial-gradient(900px 500px at 100% 0%, rgba(245, 166, 35, 0.05), transparent 55%),
    var(--bg-void);
  color: var(--white);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
.cq-root * { box-sizing: border-box; }
.cq-root button { font-family: inherit; }

.cq-app {
  min-height: 100%;
  padding: 20px 20px 40px;
  background-image:
    linear-gradient(var(--line-soft) 1px, transparent 1px),
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px);
  background-size: 42px 42px;
  background-position: -1px -1px;
}
.cq-shell { max-width: 1180px; margin: 0 auto; }

.cq-topbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; flex-wrap: wrap;
  background: linear-gradient(180deg, var(--bg-panel-raised), var(--bg-panel));
  border: 1px solid var(--line); border-radius: var(--radius-lg);
  padding: 18px 24px; margin-bottom: 22px;
  box-shadow: 0 12px 30px -18px rgba(0, 0, 0, 0.8);
}
.cq-topbar-left { display: flex; flex-direction: column; gap: 4px; min-width: 220px; }
.cq-eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--emerald); display: flex; align-items: center; gap: 8px;
}
.cq-eyebrow .cq-dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--emerald);
  box-shadow: 0 0 8px var(--emerald-glow); animation: cq-pulse-dot 1.6s ease-in-out infinite;
}
@keyframes cq-pulse-dot { 0%,100% { opacity: 1; transform: scale(1);} 50% { opacity: .4; transform: scale(.8);} }
.cq-title { font-family: var(--font-mono); font-weight: 700; font-size: clamp(20px, 2.6vw, 28px); margin: 0; letter-spacing: -0.01em; }
.cq-subtitle { font-size: 13px; color: var(--muted); margin: 0; }

.cq-timer-block { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.cq-timer-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
.cq-timer-display {
  font-family: var(--font-mono); font-weight: 800; font-size: clamp(28px, 4vw, 40px);
  padding: 6px 22px; border-radius: var(--radius-md); background: var(--bg-void);
  border: 1px solid var(--line); color: var(--amber); text-shadow: 0 0 14px var(--amber-glow);
  letter-spacing: 0.06em; font-variant-numeric: tabular-nums; min-width: 140px; text-align: center;
}
.cq-timer-display.is-critical { color: var(--red); text-shadow: 0 0 16px var(--red-glow); animation: cq-timer-flash .9s ease-in-out infinite; }
@keyframes cq-timer-flash { 0%,100% { opacity: 1; } 50% { opacity: .55; } }

.cq-selection-block { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; min-width: 200px; }
.cq-selection-pill {
  font-family: var(--font-mono); font-size: 14px; font-weight: 600; padding: 8px 16px;
  border-radius: 999px; border: 1px solid var(--emerald-dim); background: var(--emerald-wash);
  color: var(--emerald); display: flex; align-items: center; gap: 10px;
}
.cq-selection-pill.is-full { border-color: var(--amber); background: var(--amber-wash); color: var(--amber); }
.cq-selection-track { width: 180px; height: 6px; border-radius: 999px; background: var(--bg-void); border: 1px solid var(--line); overflow: hidden; }
.cq-selection-track-fill { height: 100%; background: linear-gradient(90deg, var(--emerald-dim), var(--emerald)); border-radius: 999px; transition: width .25s ease; }
.cq-full-banner { font-family: var(--font-mono); font-size: 12px; color: var(--amber); text-align: right; }

.cq-bank-heading { display: flex; align-items: baseline; justify-content: space-between; margin: 4px 4px 12px; flex-wrap: wrap; gap: 8px; }
.cq-bank-heading h2 { font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin: 0; font-weight: 600; }
.cq-bank-heading span { font-family: var(--font-mono); font-size: 12px; color: var(--muted-2); }

.cq-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
@media (max-width: 980px) { .cq-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 680px) { .cq-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; } }
@media (max-width: 440px) { .cq-grid { grid-template-columns: repeat(2, 1fr); } }

.cq-card {
  position: relative; background: linear-gradient(180deg, var(--bg-panel-raised), var(--bg-chip));
  border: 1px solid var(--line); border-radius: var(--radius-md); padding: 18px 10px 14px;
  display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer;
  transition: transform .15s ease, border-color .2s ease, box-shadow .2s ease, opacity .2s ease;
  -webkit-tap-highlight-color: transparent; width: 100%;
}
.cq-card::before, .cq-card::after {
  content: ''; position: absolute; left: 10px; right: 10px; height: 5px;
  background-image: repeating-linear-gradient(90deg, var(--line) 0 3px, transparent 3px 8px);
  opacity: .8;
}
.cq-card::before { top: -5px; }
.cq-card::after { bottom: -5px; }
.cq-card:hover:not(.is-disabled):not(.is-selected) { transform: translateY(-3px); border-color: var(--muted-2); }
.cq-card:focus-visible { outline: 2px solid var(--emerald); outline-offset: 2px; }
.cq-card.is-selected {
  border-color: var(--emerald); box-shadow: 0 0 0 1px var(--emerald-dim), 0 0 22px var(--emerald-glow);
  background: linear-gradient(180deg, rgba(23,195,123,.14), var(--bg-chip)); animation: cq-card-latch .3s ease;
}
@keyframes cq-card-latch { 0% { transform: scale(.94); } 60% { transform: scale(1.03); } 100% { transform: scale(1); } }
.cq-card.is-disabled { opacity: .35; cursor: not-allowed; filter: grayscale(.4); }
.cq-card.is-locked { cursor: default; }

.cq-chip-icon {
  width: 46px; height: 34px; border-radius: 5px; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-weight: 700; font-size: 12px; color: var(--white);
  background: linear-gradient(160deg, #232a32, #171b20); border: 1px solid var(--line); letter-spacing: -0.02em;
}
.cq-card.is-selected .cq-chip-icon { border-color: var(--emerald-dim); color: var(--emerald); }
.cq-card-label { font-size: 12.5px; font-weight: 600; text-align: center; color: var(--white); line-height: 1.25; }
.cq-check-badge {
  position: absolute; top: 6px; right: 6px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--emerald); color: var(--bg-void); font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px var(--emerald-glow);
}
.cq-card.result-correct { border-color: var(--emerald); box-shadow: 0 0 0 1px var(--emerald-dim), 0 0 20px var(--emerald-glow); }
.cq-card.result-missed { border-color: var(--red); box-shadow: 0 0 0 1px var(--red-glow); background: linear-gradient(180deg, rgba(232,84,74,.1), var(--bg-chip)); }
.cq-card.result-wrong { border-color: var(--red); opacity: .7; }

.cq-result-overlay {
  position: fixed; inset: 0; background: rgba(6,8,10,.86); backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px;
  overflow-y: auto; z-index: 50; animation: cq-fade-in .3s ease;
}
@keyframes cq-fade-in { from { opacity: 0; } to { opacity: 1; } }
.cq-result-panel {
  width: 100%; max-width: 880px; background: linear-gradient(180deg, var(--bg-panel-raised), var(--bg-panel));
  border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 28px 28px 24px;
  box-shadow: 0 30px 80px -30px rgba(0,0,0,.9); animation: cq-rise-in .35s ease;
}
@keyframes cq-rise-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.cq-result-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
.cq-result-title { font-family: var(--font-mono); font-size: 22px; font-weight: 700; margin: 0; }
.cq-result-countdown { font-family: var(--font-mono); font-size: 12px; color: var(--muted); border: 1px solid var(--line); padding: 6px 12px; border-radius: 999px; }

.cq-score-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
.cq-score-card { background: var(--bg-void); border: 1px solid var(--line); border-radius: var(--radius-md); padding: 14px 16px; text-align: center; }
.cq-score-card .num { font-family: var(--font-mono); font-size: 26px; font-weight: 800; }
.cq-score-card .lbl { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
.cq-score-card.correct .num { color: var(--emerald); }
.cq-score-card.missed .num { color: var(--red); }
.cq-score-card.points .num { color: var(--amber); }

.cq-result-section { margin-bottom: 20px; }
.cq-result-section h3 { font-family: var(--font-mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
.cq-tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
.cq-tag { font-family: var(--font-mono); font-size: 12.5px; font-weight: 600; padding: 6px 12px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); }
.cq-tag.match { color: var(--emerald); border-color: var(--emerald-dim); background: var(--emerald-wash); }
.cq-tag.missed, .cq-tag.wrong { color: var(--red); border-color: var(--red-glow); background: var(--red-wash); }
.cq-empty-note { font-size: 12.5px; color: var(--muted-2); font-style: italic; }
.cq-memory-note {
  margin-top: 6px; padding: 14px 16px; border-radius: var(--radius-md); border: 1px dashed var(--line);
  background: var(--bg-void); font-family: var(--font-mono); font-size: 12px; color: var(--muted); line-height: 1.6;
}
.cq-memory-note code { color: var(--amber); }
`

/* ---------------------------------------------------------------
   HELPERS
--------------------------------------------------------------- */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/* ---------------------------------------------------------------
   SUBCOMPONENTS
--------------------------------------------------------------- */
function Header({ secondsLeft, selectedCount }) {
  const isFull = selectedCount >= MAX_SELECTION
  const isCritical = secondsLeft <= 15

  return (
    <header className="cq-topbar">
      <div className="cq-topbar-left">
        <span className="cq-eyebrow"><span className="cq-dot" /> CSI · CACHE QUEST</span>
        <h1 className="cq-title">Round 2 — Cache Selection</h1>
        <p className="cq-subtitle">Choose wisely. Only the hottest data survives in cache.</p>
      </div>

      <div className="cq-timer-block">
        <span className="cq-timer-label">Time Remaining</span>
        <div className={`cq-timer-display${isCritical ? ' is-critical' : ''}`}>
          {formatTime(secondsLeft)}
        </div>
      </div>

      <div className="cq-selection-block">
        <div className={`cq-selection-pill${isFull ? ' is-full' : ''}`}>
          Selected: {selectedCount} / {MAX_SELECTION}
        </div>
        <div className="cq-selection-track">
          <div className="cq-selection-track-fill" style={{ width: `${(selectedCount / MAX_SELECTION) * 100}%` }} />
        </div>
        {isFull && <span className="cq-full-banner">Cache Full ({selectedCount}/{MAX_SELECTION})</span>}
      </div>
    </header>
  )
}

function Card({ card, isSelected, isDisabled, isLocked, resultVariant, onToggle }) {
  const classes = [
    'cq-card',
    isSelected ? 'is-selected' : '',
    isDisabled ? 'is-disabled' : '',
    isLocked ? 'is-locked' : '',
    resultVariant ? `result-${resultVariant}` : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={classes}
      onClick={() => !isDisabled && !isLocked && onToggle(card)}
      disabled={isDisabled || isLocked}
      aria-pressed={isSelected}
      aria-label={`${card.name}${isSelected ? ', selected' : ''}`}
    >
      {isSelected && <span className="cq-check-badge">✓</span>}
      <span className="cq-chip-icon">{card.tag}</span>
      <span className="cq-card-label">{card.name}</span>
    </button>
  )
}

function CardGrid({ cards, selectedIds, isLocked, onToggle, resultVariantFor }) {
  const selectionFull = selectedIds.length >= MAX_SELECTION
  return (
    <div className="cq-grid">
      {cards.map((card) => {
        const isSelected = selectedIds.includes(card.id)
        const isDisabled = !isSelected && selectionFull
        const variant = resultVariantFor ? resultVariantFor(card) : null
        return (
          <Card
            key={card.id}
            card={card}
            isSelected={isSelected}
            isDisabled={isDisabled}
            isLocked={isLocked}
            resultVariant={variant}
            onToggle={onToggle}
          />
        )
      })}
    </div>
  )
}

function ResultScreen({ selectedCards, predefinedList, matched, missed, wrongSelections, secondsLeft }) {
  const score = matched.length * POINTS_PER_HIT

  return (
    <div className="cq-result-overlay" role="dialog" aria-modal="true" aria-label="Round 2 results">
      <div className="cq-result-panel">
        <div className="cq-result-header">
          <h2 className="cq-result-title">Cache Evaluation Complete</h2>
          <span className="cq-result-countdown">Closing in {secondsLeft}s</span>
        </div>

        <div className="cq-score-strip">
          <div className="cq-score-card correct">
            <div className="num">{matched.length} / {predefinedList.length}</div>
            <div className="lbl">Correct Matches</div>
          </div>
          <div className="cq-score-card missed">
            <div className="num">{wrongSelections.length}</div>
            <div className="lbl">Incorrect Selections</div>
          </div>
          <div className="cq-score-card points">
            <div className="num">{score}</div>
            <div className="lbl">Cache Score</div>
          </div>
        </div>

        <div className="cq-result-section">
          <h3>Your Selected Images ({selectedCards.length}/10)</h3>
          <div className="cq-tag-list">
            {selectedCards.length === 0 && <span className="cq-empty-note">No cards were selected.</span>}
            {selectedCards.map((c) => (
              <span key={c.id} className={`cq-tag ${matched.some((m) => m.id === c.id) ? 'match' : 'wrong'}`}>
                {matched.some((m) => m.id === c.id) ? '✔' : '✖'} {c.name}
              </span>
            ))}
          </div>
        </div>

        <div className="cq-result-section">
          <h3>Predefined Cache List</h3>
          <div className="cq-tag-list">
            {predefinedList.map((name) => {
              const isMatch = matched.some((m) => m.name === name)
              return (
                <span key={name} className={`cq-tag ${isMatch ? 'match' : 'missed'}`}>
                  {isMatch ? '✔' : '✖'} {name}
                </span>
              )
            })}
          </div>
        </div>

        <div className="cq-result-section">
          <h3>Matched Images — ✔ Correct</h3>
          <div className="cq-tag-list">
            {matched.length === 0 && <span className="cq-empty-note">No matches.</span>}
            {matched.map((c) => (<span key={c.id} className="cq-tag match">✔ {c.name}</span>))}
          </div>
        </div>

        <div className="cq-result-section">
          <h3>Missed Images — ✖ In cache, not selected</h3>
          <div className="cq-tag-list">
            {missed.length === 0 && <span className="cq-empty-note">None — full house.</span>}
            {missed.map((name) => (<span key={name} className="cq-tag missed">✖ {name}</span>))}
          </div>
        </div>

        <div className="cq-result-section">
          <h3>Your Incorrect Selections — ✖ Not in cache</h3>
          <div className="cq-tag-list">
            {wrongSelections.length === 0 && <span className="cq-empty-note">None — clean selection.</span>}
            {wrongSelections.map((c) => (<span key={c.id} className="cq-tag wrong">✖ {c.name}</span>))}
          </div>
        </div>

        <div className="cq-memory-note">
          Final 10 selections stored in <code>currentMemory</code> — this array will be
          passed to Round 3 as your team's initial RAM.
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------------- */
export default function CacheQuestRound2() {
  const [phase, setPhase] = useState('playing') // 'playing' -> 'results' -> 'complete'
  const [selectedIds, setSelectedIds] = useState([])
  const [secondsLeft, setSecondsLeft] = useState(ROUND_DURATION_SECONDS)
  const [resultSecondsLeft, setResultSecondsLeft] = useState(RESULT_DISPLAY_SECONDS)
  const [currentMemory, setCurrentMemory] = useState(null)
  const lockedRef = useRef(false)

  // main 120s round timer
  useEffect(() => {
    if (phase !== 'playing') return undefined
    if (secondsLeft <= 0) {
      if (!lockedRef.current) {
        lockedRef.current = true
        setPhase('results')
        setResultSecondsLeft(RESULT_DISPLAY_SECONDS)
      }
      return undefined
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, secondsLeft])

  // 10s result-screen timer
  useEffect(() => {
    if (phase !== 'results') return undefined
    if (resultSecondsLeft <= 0) {
      setPhase('complete')
      return undefined
    }
    const id = setTimeout(() => setResultSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, resultSecondsLeft])

  function toggleCard(card) {
    if (phase !== 'playing') return
    setSelectedIds((prev) => {
      if (prev.includes(card.id)) return prev.filter((id) => id !== card.id)
      if (prev.length >= MAX_SELECTION) return prev
      return [...prev, card.id]
    })
  }

  const selectedCards = useMemo(() => CARDS.filter((c) => selectedIds.includes(c.id)), [selectedIds])

  const { matched, missed, wrongSelections } = useMemo(() => {
    const matchedCards = selectedCards.filter((c) => PREDEFINED_CACHE.includes(c.name))
    const matchedNames = matchedCards.map((c) => c.name)
    const missedNames = PREDEFINED_CACHE.filter((name) => !matchedNames.includes(name))
    const wrong = selectedCards.filter((c) => !PREDEFINED_CACHE.includes(c.name))
    return { matched: matchedCards, missed: missedNames, wrongSelections: wrong }
  }, [selectedCards])

  // Store currentMemory the moment results appear — handed to Round 3 as initial RAM.
  useEffect(() => {
    if (phase === 'results' && currentMemory === null) {
      const memory = selectedCards.map((c) => ({ id: c.id, name: c.name, tag: c.tag }))
      setCurrentMemory(memory)
      if (typeof window !== 'undefined') window.currentMemory = memory
      console.log('currentMemory stored for Round 3:', memory)
    }
  }, [phase])

  const resultVariantFor = (card) => {
    if (phase === 'playing') return null
    const isSelected = selectedIds.includes(card.id)
    const inCache = PREDEFINED_CACHE.includes(card.name)
    if (isSelected && inCache) return 'correct'
    if (isSelected && !inCache) return 'wrong'
    if (!isSelected && inCache) return 'missed'
    return null
  }

  const score = matched.length * POINTS_PER_HIT

  return (
    <div className="cq-root">
      <style>{STYLES}</style>
      <div className="cq-app">
        <div className="cq-shell">
          <Header secondsLeft={secondsLeft} selectedCount={selectedIds.length} />

          {phase === 'playing' && selectedIds.length >= MAX_SELECTION && (
            <p className="cq-full-banner" style={{ textAlign: 'center', margin: '0 0 14px' }}>
              Cache Full (10/10) — remaining blocks are locked
            </p>
          )}

          <div className="cq-bank-heading">
            <h2>Memory Bank · 30 available blocks</h2>
            <span>Select up to {MAX_SELECTION} to load into cache</span>
          </div>

          <CardGrid
            cards={CARDS}
            selectedIds={selectedIds}
            isLocked={phase !== 'playing'}
            onToggle={toggleCard}
            resultVariantFor={phase !== 'playing' ? resultVariantFor : null}
          />

          {phase === 'complete' && (
            <div className="cq-result-section" style={{ marginTop: 24 }}>
              <div className="cq-memory-note">
                Round 2 complete. Final Cache Score: <code>{score}</code> pts ·{' '}
                <code>currentMemory</code> holds {currentMemory ? currentMemory.length : 0} block(s),
                ready to hand off to Round 3.
              </div>
            </div>
          )}
        </div>

        {phase === 'results' && (
          <ResultScreen
            selectedCards={selectedCards}
            predefinedList={PREDEFINED_CACHE}
            matched={matched}
            missed={missed}
            wrongSelections={wrongSelections}
            secondsLeft={resultSecondsLeft}
          />
        )}
      </div>
    </div>
  )
}
