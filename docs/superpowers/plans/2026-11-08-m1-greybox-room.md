# M1: Greybox Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First playable web build of One Day: a 3D greybox of the author's room with the real layout, walkable in third person with keyboard/mouse and touch, a "?" help panel that pauses, a `?debug` performance overlay, auto-deployed to GitHub Pages.

**Architecture:** Vite + React app. The 3D scene is a React Three Fiber `<Canvas>`; all HUD/menus are React DOM layered on top. Game rules that can be tested without WebGL (layout, collision, movement maths, input routing, quality tier, debug flag) live in plain TypeScript modules with Vitest tests; components stay thin. A zustand store holds cross-cutting state (paused, help open, debug stats). No physics engine in M1: the room is flat, so player collision is circle-vs-box on the floor plane (Rapier arrives with driving in M3).

**Tech Stack:** Node 24, Vite 8, React 19, TypeScript 7, three 0.187, @react-three/fiber 9, @react-three/drei 10, zustand 5, Vitest 5 + jsdom + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-08-oneday-design.md` (milestone 1 in §9).

## Global Constraints

- All in-game text is Vietnamese and lives in `src/strings.ts` (spec §3: "chữ trong game để riêng một chỗ").
- Never commit anything from `../anh-tham-khao/` (spec §3).
- Must run in Chrome, Safari, Edge on Android and iPhone; test device is iPhone 13 Safari (spec §3).
- Phone play is landscape; portrait shows a rotate prompt (spec §5).
- Third-person camera behind Anh; desktop: WASD/arrows + mouse rotates camera; phone: left virtual joystick + swipe to rotate camera (spec §5).
- "?" is always on screen; opening it pauses the game; content switches by device (spec §4.8).
- `?debug` in the URL shows an FPS overlay (spec §8).
- Missing WebGL2 shows a friendly message instead of a white screen (spec §8).
- Render resolution cap: low 1x, medium 1.5x (spec §8); high 2x.
- Deploy: GitHub Pages via GitHub Actions on every push to `main` (spec §7). Vite `base` is `/OneDay/`.

## Review Focus

1. iOS Safari touch drags scroll, zoom or rubber-band the page instead of moving the player → page must stay fixed (Task 4: CSS + viewport meta, checked on device).
2. Joystick and camera swipe used with two thumbs at once → each finger keeps its own role; lifting one must not reset the other (Task 4 test `two pointers keep separate roles`).
3. A key is held when the window loses focus or "?" opens → player must not keep walking afterwards (Task 3 test `clear() releases held keys`, Task 5 test `opening help pauses`).
4. Tab hidden then shown produces a huge frame delta → player must not tunnel through walls (Task 3 test `clampDelta caps at 0.05`).
5. Camera behind the player in a 4.2 m room ends up outside a wall → camera must pull in toward the player instead of showing the outside (Task 3 test `camera distance stops before wall`).

---

## File Structure

```
index.html                     viewport meta, root div
vite.config.ts                 base '/OneDay/', react plugin, vitest jsdom
tsconfig.json
.github/workflows/deploy.yml   test + build + deploy to Pages
src/main.tsx                   mount <App/>
src/App.tsx                    WebGL2 gate, <Canvas>, overlay UI
src/index.css                  full-screen fixed layout, touch-action none
src/strings.ts                 all Vietnamese copy
src/store.ts                   zustand: helpOpen, paused, debugStats
src/device.ts                  isTouchDevice, pickQuality, DPR_CAP, hasWebGL2
src/debug.ts                   isDebug, FpsMeter
src/room/layout.ts             room size, walls, furniture boxes, spawn (data only)
src/room/Room.tsx              renders greybox + labels from layout
src/player/collision.ts        resolveCircleBoxes, rayBoxDistance, cameraDistance
src/player/movement.ts         moveVector, clampDelta
src/player/input.ts            shared input state, key tracker, touch router, joystickVector
src/player/Player.tsx          capsule + per-frame movement + camera rig
src/ui/HelpPanel.tsx           "?" button + panel
src/ui/TouchControls.tsx       joystick + look area (pointer events)
src/ui/DebugOverlay.tsx        DOM overlay + in-canvas probe
src/ui/RotatePrompt.tsx        portrait-on-phone prompt
```

Shared types (defined in `src/room/layout.ts`, used everywhere):

```ts
export type Box = { id: string; minX: number; maxX: number; minZ: number; maxZ: number; height: number };
export type Vec2 = { x: number; z: number };
```

Coordinates: metres, room interior x ∈ [0, 4.2] (west→east), z ∈ [0, 5.0] (north→south, north wall has the main door), y up. Yaw 0 = facing north (−z); forward = (−sin yaw, −cos yaw), right = (cos yaw, −sin yaw).

---

### Task 1: Project skeleton and Pages deploy

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `.gitignore`, `.github/workflows/deploy.yml`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/strings.ts`, `src/store.ts`
- Test: `src/store.test.ts`

**Interfaces:**
- Produces: `useGame` zustand store with `helpOpen: boolean`, `paused: boolean` (derived: `paused === helpOpen` in M1), `setHelpOpen(open: boolean): void`, `debugStats: { fps: number; calls: number; triangles: number }`, `setDebugStats(s): void`. `S` object in `strings.ts` holding all copy.

- [ ] **Step 1:** `npm init -y`; install deps listed in Tech Stack (plus `@types/react`, `@types/react-dom`, `@types/three`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`). Scripts: `dev`, `build` = `tsc --noEmit && vite build`, `test` = `vitest run`, `preview`.
- [ ] **Step 2: Write the failing test** `src/store.test.ts`: `setHelpOpen(true)` → `helpOpen === true && paused === true`; `setHelpOpen(false)` → both false.
- [ ] **Step 3:** Run `npm test` → FAIL (module missing).
- [ ] **Step 4:** Implement `src/store.ts`, `src/strings.ts` (copy below), `App.tsx` with a `<Canvas>` showing a grey floor and title text `S.title`.
- [ ] **Step 5:** `npm test` → PASS; `npm run build` → `dist/` created, no type errors.
- [ ] **Step 6:** Workflow `deploy.yml`: on push to `main` and manual dispatch; jobs: checkout, setup-node 24 with npm cache, `npm ci`, `npm test`, `npm run build`, configure-pages, upload-pages-artifact (`dist`), deploy-pages; permissions `pages: write`, `id-token: write`, `contents: read`.
- [ ] **Step 7:** Commit `chore: scaffold Vite R3F app with Pages deploy`.

Copy fixed by this plan (`src/strings.ts`):
- `title`: "One Day · bản thử 0.1"
- `help.title`: "Hướng dẫn"; `help.resume`: "Chơi tiếp"
- `help.desktop`: ["Đi lại: W A S D hoặc phím mũi tên", "Xoay camera: giữ chuột trái và kéo", "Mở/đóng hướng dẫn: phím Esc hoặc nút ?"]
- `help.touch`: ["Đi lại: kéo joystick bên trái", "Xoay camera: vuốt ở nửa bên phải màn hình", "Mở hướng dẫn: nút ?"]
- `help.sceneTitle`: "Màn này"; `help.scene`: "Bản thử phòng trọ: đi một vòng xem đồ đạc đã đúng chỗ chưa. Nhiệm vụ sẽ có ở bản sau."
- `rotate`: "Xoay ngang điện thoại để chơi nhé"
- `noWebGL`: "Trình duyệt này chưa hỗ trợ đồ họa 3D (WebGL2). Bạn thử mở bằng Chrome hoặc Safari bản mới nhé."
- furniture labels: see Task 2 table.

### Task 2: Room layout and greybox

**Files:**
- Create: `src/room/layout.ts`, `src/room/Room.tsx`
- Test: `src/room/layout.test.ts`

**Interfaces:**
- Produces: `ROOM = { width: 4.2, depth: 5.0, height: 3.0 }`, `WALLS: Box[]` (collide + render), `FURNITURE: (Box & { label: string })[]`, `SPAWN: { x: 3.0, z: 2.6, yaw: 0 }`, `COLLIDERS: Box[]` = walls + furniture. `<Room/>` renders every box as a grey mesh (walls lighter, furniture darker, door brown) plus floor, ceiling, and a drei `<Html>` label above each furniture item.

Layout (from `anh-tham-khao/nhatro/soDo.png` and photos; wall thickness 0.1, outside the interior):

| id | label (`strings.ts`) | minX | maxX | minZ | maxZ | height |
|---|---|---|---|---|---|---|
| wallN | | −0.1 | 4.3 | −0.1 | 0 | 3.0 |
| wallS | | −0.1 | 4.3 | 5.0 | 5.1 | 3.0 |
| wallW | | −0.1 | 0 | −0.1 | 5.1 | 3.0 |
| wallE | | 4.2 | 4.3 | −0.1 | 5.1 | 3.0 |
| bathWallW1 | | 2.65 | 2.75 | 0 | 0.6 | 3.0 |
| bathWallW2 | | 2.65 | 2.75 | 1.35 | 1.55 | 3.0 |
| bathWallS | | 2.75 | 4.2 | 1.45 | 1.55 | 3.0 |
| door | Cửa | 1.5 | 2.4 | 0 | 0.05 | 2.2 |
| kitchenN | Bếp | 0 | 1.4 | 0 | 0.6 | 0.85 |
| kitchenW | | 0 | 0.6 | 0.6 | 1.6 | 0.85 |
| lavabo | Lavabo | 2.75 | 3.25 | 0 | 0.4 | 0.85 |
| toilet | Bồn cầu | 3.65 | 4.15 | 0.05 | 0.75 | 0.75 |
| fridge | Tủ lạnh | 2.75 | 3.3 | 1.55 | 2.1 | 1.3 |
| deskMine | Bàn của Anh | 3.35 | 4.2 | 1.55 | 2.15 | 0.75 |
| shelf | Kệ | 3.9 | 4.2 | 2.15 | 2.5 | 1.2 |
| mirror | Gương | 3.95 | 4.2 | 2.55 | 2.75 | 1.6 |
| bed | Giường | 2.4 | 4.2 | 3.0 | 5.0 | 0.45 |
| wardrobe | Tủ quần áo | 0 | 0.6 | 3.6 | 5.0 | 2.0 |
| fridge2 | Tủ lạnh 2 | 0 | 0.6 | 3.0 | 3.55 | 1.2 |
| deskFriend | Bàn bạn cùng phòng | 0 | 0.7 | 1.75 | 2.95 | 0.75 |

Decor without collision (render only): window on west wall (z 1.9–2.9, y 1.0–2.2), air-con above it, two helmets on the door.

- [ ] **Step 1: Write the failing tests** `layout.test.ts`:
  - `every furniture box lies inside the room interior`
  - `no two furniture boxes overlap` (touching edges allowed; only positive-area overlap fails)
  - `spawn is at least 0.25 m from every collider`
  - `reachable with radius 0.25`: grid flood fill at 0.05 m from `SPAWN` over cells whose centre is ≥ 0.25 from all `COLLIDERS`; these points are reachable: lavabo front (3.0, 0.7), wardrobe front (0.95, 4.3), bed side (2.1, 4.0), fridge front (2.45, 1.8), deskMine front (3.6, 2.5), mirror front (3.65, 2.65), main door front (1.95, 0.4), kitchen front (1.0, 1.0).
- [ ] **Step 2:** Run `npm test` → FAIL.
- [ ] **Step 3:** Implement `layout.ts` with the table values and `Room.tsx`; mount `<Room/>` in `App` with a temporary fixed camera looking down at the room.
- [ ] **Step 4:** `npm test` → PASS; `npm run build` passes.
- [ ] **Step 5:** Commit `feat: greybox room with real layout`.

### Task 3: Walking in third person (keyboard + mouse)

**Files:**
- Create: `src/player/collision.ts`, `src/player/movement.ts`, `src/player/input.ts`, `src/player/Player.tsx`
- Test: `src/player/collision.test.ts`, `src/player/movement.test.ts`, `src/player/input.test.ts`

**Interfaces:**
- Consumes: `Box`, `Vec2`, `COLLIDERS`, `SPAWN` (Task 2); `useGame().paused` (Task 1).
- Produces:
  - `resolveCircleBoxes(p: Vec2, r: number, boxes: Box[]): Vec2` — push the circle out of every box it overlaps (3 iterations).
  - `rayBoxDistance(o: [number,number,number], d: [number,number,number], b: Box): number | null` — slab test, box spans y ∈ [0, height]; null if no hit ahead.
  - `cameraDistance(o, d, maxDist: number, boxes: Box[]): number` — nearest hit minus 0.2, clamped to [0.4, maxDist].
  - `moveVector(input: { x: number; y: number }, yaw: number): Vec2` — camera-relative world direction, length ≤ 1.
  - `clampDelta(dt: number): number` — min(dt, 0.05).
  - `input` singleton: `{ move: {x,y}, look: {dx, dy} }`; `createKeyTracker(): { down(code: string): void; up(code: string): void; clear(): void; vector(): {x,y} }` (KeyW/ArrowUp → y+1, KeyS/ArrowDown → y−1, KeyD/ArrowRight → x+1, KeyA/ArrowLeft → x−1).
  - `<Player/>`: capsule (radius 0.25, height 1.6) with a nose cone showing facing; walk speed 2.2 m/s; turns to face movement direction; camera orbit distance 2.2, pitch clamped to [0.15, 1.1] rad, look-at point 1.4 m above the floor; mouse drag on the canvas changes yaw/pitch (0.005 rad per px); does nothing while `paused`.
- [ ] **Step 1: Write the failing tests:**
  - collision: `circle outside box is unchanged`; `circle overlapping box east face is pushed to x = maxX + r`; `circle in a corner between two boxes ends outside both`.
  - `camera distance stops before wall`: origin (2, 1.4, 2.5), dir (0, 0, 1) normalised, maxDist 3.2, boxes `[wallS]` → 2.3 (wall at z = 5.0, minus 0.2); with no boxes → 3.2; a wall at 0.3 m → 0.4.
  - movement: `moveVector({x:0,y:1},0) ≈ {x:0,z:-1}`; `moveVector({x:1,y:0},0) ≈ {x:1,z:0}`; `moveVector({x:0,y:1},π/2) ≈ {x:-1,z:0}`; `diagonal has length 1`; `clampDelta caps at 0.05` (clampDelta(2) = 0.05, clampDelta(0.016) = 0.016).
  - input: `W gives forward`; `W+D gives (1,1)`; `opposite keys cancel`; `clear() releases held keys`.
- [ ] **Step 2:** Run tests → FAIL.
- [ ] **Step 3:** Implement the three modules and `Player.tsx` (keyboard listeners on window, `blur` and `visibilitychange` call `clear()`); replace the temporary camera in `App`.
- [ ] **Step 4:** Tests PASS; `npm run build` passes; in `npm run dev`, walk from spawn into the bathroom to the lavabo and to the wardrobe without passing through anything.
- [ ] **Step 5:** Commit `feat: third-person walking with collision`.

### Task 4: Touch controls and phone layout

**Files:**
- Create: `src/ui/TouchControls.tsx`, `src/ui/RotatePrompt.tsx`
- Modify: `src/player/input.ts` (add router + joystick maths), `index.html`, `src/index.css`, `src/App.tsx`
- Test: `src/player/input.test.ts` (extend)

**Interfaces:**
- Consumes: `input` singleton (Task 3).
- Produces:
  - `joystickVector(dx: number, dy: number, radius: number): {x: number; y: number}` — screen offset from joystick centre → input vector, length clamped to 1, screen-down = backward (y negative); dead zone 0.12.
  - `createTouchRouter(): { start(id: number, x: number, screenWidth: number): 'move' | 'look'; role(id: number): 'move' | 'look' | undefined; end(id: number): void }` — left half → `move` (only one move finger at a time; a second left-half finger becomes `look`), right half → `look`.
  - `<TouchControls/>` renders only on touch devices: joystick base appears where the left thumb lands (radius 60 px); look drags add to `input.look` (0.008 rad per px).
- [ ] **Step 1: Write the failing tests:** `joystickVector(0,-60,60) → {x:0,y:1}`; `joystickVector(120,0,60) → {x:1,y:0}` (clamped); `inside dead zone → {0,0}`; `two pointers keep separate roles` (start 1 at x=100, start 2 at x=900 on width 1000 → move, look; end(1) → role(2) still `look`); `second left finger becomes look`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. `index.html` viewport `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`; `index.css`: `html, body, #root` fixed full-screen, `overflow: hidden`, `touch-action: none`, `overscroll-behavior: none`, `user-select: none`, `-webkit-touch-callout: none`. `RotatePrompt` shows `S.rotate` via CSS `@media (orientation: portrait) and (pointer: coarse)`.
- [ ] **Step 4:** Tests PASS; build passes; Chrome DevTools device mode (iPhone 13, landscape): joystick walks, right-side drag turns camera, page never scrolls; portrait shows the prompt.
- [ ] **Step 5:** Commit `feat: touch joystick, camera swipe, rotate prompt`.

### Task 5: "?" help panel with pause

**Files:**
- Create: `src/ui/HelpPanel.tsx`, `src/device.ts` (only `isTouchDevice` here)
- Test: `src/ui/HelpPanel.test.tsx`

**Interfaces:**
- Consumes: `useGame` (Task 1), `S.help` (Task 1).
- Produces: `isTouchDevice(): boolean` (`matchMedia('(pointer: coarse)').matches`); `<HelpPanel isTouch: boolean/>` renders the round "?" button (top-right, `aria-label="Hướng dẫn"`) and, when open, a `role="dialog"` panel with the device's control list, the scene section, and a `S.help.resume` button. `Escape` toggles it.
- [ ] **Step 1: Write the failing tests:** `opening help pauses` (click "?" → dialog visible, `useGame.getState().paused === true`); `desktop shows keyboard controls` (isTouch false → text "W A S D"); `touch shows joystick controls` (isTouch true → text "joystick"); `Chơi tiếp closes and unpauses`; `Escape toggles`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement and mount in `App`.
- [ ] **Step 4:** Tests PASS; build passes.
- [ ] **Step 5:** Commit `feat: help panel that pauses the game`.

### Task 6: Debug overlay, quality tier, WebGL2 gate

**Files:**
- Create: `src/debug.ts`, `src/ui/DebugOverlay.tsx`
- Modify: `src/device.ts`, `src/App.tsx`
- Test: `src/debug.test.ts`, `src/device.test.ts`

**Interfaces:**
- Produces:
  - `isDebug(search: string): boolean` — true when the query has a `debug` key.
  - `class FpsMeter { tick(nowMs: number): number }` — frames counted over the last 1000 ms.
  - `pickQuality(i: { isTouch: boolean; memoryGB?: number; cores?: number }): 'low' | 'medium' | 'high'` — touch with memoryGB ≤ 3 or cores ≤ 4 → low; other touch → medium; desktop with cores ≤ 4 → medium; else high. Missing values count as unknown (not low).
  - `DPR_CAP = { low: 1, medium: 1.5, high: 2 }`.
  - `hasWebGL2(make?: () => HTMLCanvasElement): boolean`.
  - `<DebugProbe/>` inside the Canvas writes `{ fps, calls, triangles }` to the store 4×/s; `<DebugOverlay quality/>` shows fps, draw calls, triangles, DPR and tier, only when `isDebug`.
- [ ] **Step 1: Write the failing tests:** `isDebug('?debug')`, `isDebug('?a=1&debug=1')` true, `isDebug('')`, `isDebug('?debugger=1')` false; FpsMeter: 60 ticks 16.7 ms apart → 60 (±1); pickQuality cases for each rule including `{isTouch:true}` → medium; `hasWebGL2` true when the fake canvas returns a context, false when it returns null.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; `App` renders `S.noWebGL` instead of the Canvas when `hasWebGL2()` is false; Canvas `dpr={[1, DPR_CAP[quality]]}`.
- [ ] **Step 4:** Tests PASS; build passes; `npm run dev` with `?debug` shows the overlay.
- [ ] **Step 5:** Commit `feat: debug overlay, quality tier, WebGL2 gate`.

### Task 7: Ship

- [ ] **Step 1:** `npm test` and `npm run build` pass; `dist` size printed (expect well under the 8 MB first-load budget).
- [ ] **Step 2:** Push `main`; the author sets Settings → Pages → Source: **GitHub Actions** once; the workflow run is green.
- [ ] **Step 3:** Open `https://truongk23k.github.io/OneDay/` (and `?debug`) on desktop; author opens it on iPhone 13 and reports how walking and the camera feel.
