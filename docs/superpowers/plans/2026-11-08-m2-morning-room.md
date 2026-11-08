# M2: Morning in the Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Màn 1 (alarm) and Màn 2 (room) fully playable: in-game clock from 7:30, snooze, six room tasks with mini-games, chat with Em, outfit shown on Anh, leaving the room ends M2 with a summary card.

**Architecture:** Game rules live in pure modules under `src/story/` (clock, story reducer, chat engine, mini-game maths, interactables) with Vitest tests; one zustand store `useStory` wraps the reducer and is the only place UI reads/writes story state. React DOM overlays (`src/ui/`) render alarm, HUD, mini-games, wardrobe, phone, end card. The 3D scene only reads story state (outfit colours, prompt target). Randomness (weather, key spot, tube order) comes from a seeded RNG stored in state so tests are deterministic.

**Tech Stack:** as M1 (Vite 8, React 19, TS 7, R3F 9, drei 10, zustand 5, Vitest 5).

**Spec:** `docs/superpowers/specs/2026-11-08-oneday-design.md` §4.1–4.3, §4.7–4.8, §5, §6 (wardrobe table). M1 plan for existing modules: `docs/superpowers/plans/2026-11-08-m1-greybox-room.md`.

## Global Constraints

- All copy in `src/strings.ts`; Vietnamese; Em speaks as "em", calls Anh "anh"; chat contact name "Em ❤️".
- Clock starts 7:30 (450 game minutes). Deadlines 8:25 (Em) and 8:30 (Anh) — used from M3 on; M2 shows them on the HUD only.
- A full run targets 6–8 real minutes; the room part should take ~2–3 real minutes when played well.
- "?" opens help and pauses everything (clock, chat timers, mini-games).
- Every overlay works with touch (buttons ≥ 44 px) and keyboard (E/Space interact, Esc help, number keys optional).
- No new runtime dependencies.

## Review Focus

1. Clock keeps running while an overlay (wardrobe, phone, mini-game) is open — intended (pressure), but must stop while help is open → test `clock does not advance while paused`.
2. Em's messages pile up while the phone is closed → unread badge count must match, and late replies still work → test `unanswered message escalates once, not every frame`.
3. Player leaves without keys → door refuses with a clear line → test `cannot leave without keys`.
4. Same run replayed → new weather/key spot only with a new seed; "Chơi lại" resets everything → test `restart resets state with a new seed`.
5. Touch: interact button only shows when something is in reach; it must not steal joystick touches → manual check in emulation.

---

## File Structure

```
src/story/clock.ts        GAME_START=450, SPEED (game s per real s), advance, format "7:30"
src/story/rng.ts          mulberry32(seed) → () => number; pick(arr, rnd)
src/story/state.ts        StoryState type, initialState(seed), reducer(state, action)
src/story/chat.ts         chat script data types + engine (pending message, choose reply, escalation)
src/story/chatScript.ts   Em's conversation (data)
src/story/outfit.ts       WARDROBE items, outfitColors, outfitVerdict (disaster/ok)
src/story/minigames.ts    brushProgress, washResult
src/story/interact.ts     INTERACTABLES (id, x, z, prompt), nearestInteractable
src/story/store.ts        useStory (zustand) wrapping reducer + tick(dt)
src/ui/AlarmScreen.tsx    Màn 1 phone alarm
src/ui/Hud.tsx            clock, checklist, weather, phone button, interact prompt/button
src/ui/BrushGame.tsx      tube pick + scrubbing
src/ui/WashGame.tsx       hold-and-release
src/ui/Wardrobe.tsx       outfit picker
src/ui/Phone.tsx          chat with Em
src/ui/EndCard.tsx        M2 summary / oversleep card, "Chơi lại"
```

Modified: `src/App.tsx` (mount overlays by phase), `src/player/Player.tsx` (outfit colours, no movement while an overlay is open, report position for interaction), `src/ui/HelpPanel.tsx` (scene text by phase), `src/strings.ts`.

### Core types (`src/story/state.ts`)

```ts
type Phase = 'alarm' | 'room' | 'left' | 'overslept'
type Overlay = null | 'brush' | 'wash' | 'wardrobe' | 'phone' | 'door'
type Outfit = { top: string; bottom: string; shoes: string; raincoat: boolean }
type StoryState = {
  seed: number; phase: Phase; overlay: Overlay
  minutes: number            // game minutes since midnight, float
  snoozes: number
  weather: 'sun' | 'rain'
  hygiene: number            // 0..100, starts 20
  mood: number               // 0..100, starts 60
  tasks: { brushed: boolean; washed: boolean; dressed: boolean; texted: boolean; keys: boolean; helmets: 0 | 1 | 2 }
  outfit: Outfit             // starts in pyjamas (áo ngủ, quần đùi hoa, dép tổ ong)
  keySpot: string            // interactable id hiding the keys
  searched: string[]
  chat: ChatState
  line: string | null        // last funny line to toast
}
```

Actions: `wake`, `snooze`, `tick(realDt)`, `open(overlay)`, `close`, `brushDone(wrongTubeFirst)`, `washDone(ok)`, `dress(outfit)`, `chatReply(index)`, `search(id)`, `takeHelmets(n)`, `leave`, `restart(seed)`.

Numbers fixed by this plan:
- `SPEED = 8.5` game seconds per real second (60 game min ≈ 7 real min).
- Snooze: +5 min each; at `minutes >= 480` (8:00) after a snooze → phase `overslept`.
- Hygiene: brush +35 (−5 if wrong tube first), wash +20, dressed in a non-disaster outfit +15; cap 100.
- Wrong tube: +2 game minutes. Failed wash: +1 game minute.
- Search: +1 game minute per spot.
- Mood: per reply delta from the script; unanswered message: after 6 game minutes Em sends one escalation ("??") and mood −8, once per message.

---

### Task 1: Clock, RNG, story reducer, store

**Files:** create `src/story/clock.ts`, `rng.ts`, `state.ts`, `store.ts`; tests `src/story/clock.test.ts`, `state.test.ts`.

**Produces:** `format(minutes) → "7:30"`; `mulberry32(seed)`; `initialState(seed)`; `reducer(state, action)`; `useStory` with `dispatch(action)` and `tick(realDt)` (skipped when `useGame.getState().paused`).

- [ ] Tests: `format(450) === '7:30'`, `format(509.9) === '8:29'`; `tick 60 real s advances 8.5 game min`; `clock does not advance while paused`; `snooze adds 5 minutes`; `snoozing to 8:00 oversleeps`; `initialState is deterministic for a seed` (weather, keySpot); `restart resets state with a new seed`; `hygiene is capped at 100`.
- [ ] Implement; `App` runs `tick` from a `useFrame` hook inside the Canvas (`StoryTicker`).
- [ ] Commit `feat: story clock and state`.

### Task 2: Màn 1 alarm

**Files:** `src/ui/AlarmScreen.tsx`, test `src/ui/AlarmScreen.test.tsx`; strings.

- [ ] Tests: shows the clock and weather; "Báo lại 5 phút" dispatches snooze and shows one of the snooze lines; "Dậy" switches to phase `room`; oversleep shows the oversleep end card.
- [ ] Phone frame styled like a green iPhone 13 (no logo). While phase is `alarm` Anh does not move.
- [ ] Commit `feat: alarm screen with snooze and oversleep`.

### Task 3: Interaction + HUD

**Files:** `src/story/interact.ts` (+ test), `src/ui/Hud.tsx` (+ test), modify `Player.tsx` (writes `playerPos` to a module ref; no movement when `overlay !== null` or phase ≠ `room`).

**Interactables** (id → spot in front of the object, metres, reach 0.9):
`lavaboBrush`/`lavaboWash` share the lavabo spot (3.75, 0.7) — prompt offers both; `wardrobe` (0.95, 5.4); `bed` (2.95, 5.2); `fridge` (2.7, 1.95); `deskMine` (3.9, 2.8); `kitchen` (1.0, 0.7); `shelf` (5.2, 3.45); `door` (2.45, 0.4). Key spots: bed, wardrobe, fridge, deskMine, kitchen, shelf.

- [ ] Tests: `nearest within reach`; `nothing in reach → null`; HUD shows clock text and ticks; checklist marks done tasks; interact button only when a target exists; E key triggers the target action.
- [ ] Commit `feat: interaction prompts and HUD`.

### Task 4: Brush and wash mini-games

**Files:** `src/story/minigames.ts` (+ test), `src/ui/BrushGame.tsx`, `src/ui/WashGame.tsx` (+ tests).

- Brush: step 1 pick one of two tubes (order random per run); wrong one (sữa rửa mặt) shows a funny line and costs time, then pick again. Step 2 scrub: each direction change (A↔D or swipe ≥ 40 px) adds 5%; 100% → `brushDone`.
- Wash: hold button fills 0→100 over 1.6 real s; release in [60, 85] → success; otherwise fail line, retry.
- [ ] Tests: `alternating strokes fill the bar, same-direction strokes don't`; `wash release window`; component: wrong tube shows the line and costs 2 minutes.
- [ ] Commit `feat: brushing and face-washing mini-games`.

### Task 5: Wardrobe and outfit on Anh

**Files:** `src/story/outfit.ts` (+ test), `src/ui/Wardrobe.tsx` (+ test), modify `Player.tsx` (upper body = top colour, lower = bottom colour, small feet = shoes colour, translucent raincoat shell when worn).

- Items per spec §6 table. `outfitVerdict(outfit, weather)` → `{ disaster: boolean; wetRisk: boolean; emComment: string | null }`.
- [ ] Tests: pyjama top → disaster; rain without raincoat → wetRisk; normal outfit → no comment; dressing applies hygiene bonus once.
- [ ] Commit `feat: wardrobe and visible outfit`.

### Task 6: Phone chat with Em

**Files:** `src/story/chat.ts`, `src/story/chatScript.ts` (+ test), `src/ui/Phone.tsx` (+ test); HUD phone button with unread badge.

- Script: 4 beats — 7:33 "Dậy chưa anh? 😴", 7:40 outfit/plan, 7:46 "Mấy giờ anh qua?", 7:52 "Nhớ mang mũ cho em nha". Each with 2–3 replies (good/ok/bad with mood deltas) and Em's follow-up line. Finishing beat 3 sets `texted`.
- Escalation: unanswered for 6 game min → Em sends "??" once (mood −8).
- [ ] Tests: `message arrives at its time`; `unanswered message escalates once, not every frame`; `reply applies mood and advances`; `unread count`.
- [ ] Commit `feat: chat with Em`.

### Task 7: Keys, helmets, leaving, end card

**Files:** reducer actions `search`, `takeHelmets`, `leave`; `src/ui/EndCard.tsx` (+ test); door overlay with "Lấy mũ (2)", "Lấy 1 mũ", "Ra khỏi phòng".
- [ ] Tests: `search finds keys only at keySpot`; `cannot leave without keys`; `leaving sets phase left`; end card lists time, hygiene, mood, tasks, "Chơi lại" restarts.
- [ ] Commit `feat: keys, helmets and leaving the room`.

### Task 8: Help text per phase, polish, ship

- [ ] `HelpPanel` scene section per phase (alarm / room / left).
- [ ] Full suite + build; iPhone emulation run (alarm tap, walk to lavabo, interact button, phone); push.
