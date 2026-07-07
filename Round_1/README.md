# Cache Quest — Round 2: Cache Selection

A front-end-only prototype for the CSI technical event **Cache Quest**.
Participants simulate how CPU cache works by choosing only the 10 most
"important" data blocks out of 30 available, against a 120-second clock.

No backend, no auth — everything runs on local React state.

## Tech

- React 18 + Vite
- Plain CSS (no UI library) — dark, OS/memory-bus inspired theme
  (Charcoal Black background, Emerald Green highlights, White text, Amber accents)

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Gameplay

1. 30 selectable "memory blocks" (programming languages / tools) are shown in a grid.
2. Participants may select **up to 10**. Selected cards get a green border, glow, and checkmark.
3. Once 10 are selected, remaining cards lock and a **"Cache Full (10/10)"** banner appears.
4. A live **Selected: x / 10** counter is shown in the header at all times.
5. A 120-second countdown timer runs at the top; it turns red and pulses in the final 15 seconds.
6. When the timer hits zero, selections lock automatically and the **Result Screen** appears.
7. The result screen compares the participant's picks against the coordinator's predefined
   cache list (`Python, Java, Docker, Git, Linux, SQL, React, JavaScript, NodeJS, Rust`) and shows:
   - Your Selected Images
   - Predefined Cache List
   - Matched Images (green, ✔)
   - Missed Images (red, ✖)
   - Your Incorrect Selections (red, ✖)
   - Correct Matches count, Incorrect Selections count, and **Cache Score**
8. **Scoring:** every correct match (cache hit) is worth **+5 points**. Wrong picks
   (cache misses) score **0**, never negative — matching the "no negative points" rule.
9. The result screen stays visible for 10 seconds, then closes automatically.
10. The final selected blocks are stored in a `currentMemory` array (also attached to
    `window.currentMemory` for quick inspection), ready to be handed to Round 3 as the
    team's initial RAM.

## File structure

```
cache-quest/
├── index.html                  # Vite HTML entry, loads Google Fonts
├── package.json
├── vite.config.js
├── .gitignore
├── README.md
└── src/
    ├── main.jsx                 # React root
    ├── App.jsx                  # Game state machine (timer, selection, results)
    ├── index.css                 # Full dark OS-inspired theme
    ├── data/
    │   └── cards.js               # 30 cards + predefined cache list + config constants
    └── components/
        ├── Header.jsx             # Title, digital countdown timer, live selection pill
        ├── Card.jsx                # Single memory-block card
        ├── CardGrid.jsx            # 30-card responsive grid
        └── ResultScreen.jsx        # Post-round comparison & score screen
```

## Notes for Round 3 integration

`currentMemory` is set in `App.jsx` right when the result screen appears:

```js
const memory = selectedCards.map((c) => ({ id: c.id, name: c.name, tag: c.tag }))
setCurrentMemory(memory)
window.currentMemory = memory // simple hook for now, swap for real state/routing later
```

Replace the `window.currentMemory` hand-off with your actual routing/state
solution (e.g. React Router state, Context, or a shared store) once Round 3 is built.
