# M4 — Polish, smartphone, police chase, likeness

Executed inline (user asked: "tự duyệt lại và sửa", plus mid-turn requests). Spec: docs/superpowers/specs/2026-11-08-oneday-design.md.

User requests (2026-11-09):
1. Phone-first responsive pass; buttons and icons look bad → redesign.
2. Review game logic and gameplay; add good ideas and constraints.
3. Faces like the reference portraits (anh-tham-khao/nhanvat — never committed).
4. Police: running a red light → police chase.
5. Phone with many working apps; call Em from the phone at her door (no popup).

## Global constraints
- Photos in anh-tham-khao/ never committed or published. No brand logos/text (Honda, Air Blade, Apple).
- Draw calls in the street ≤ 60. Touch targets ≥ 48 px. iPhone 13 landscape 844×390 with 47 px side insets is the reference; also 667×375, 740×360, Safari landscape with bars (~844×340), PC 1366×768.
- All copy in src/strings.ts. Pure logic is TDD (RED→GREEN). Visuals verified with headless screenshots (scratchpad audit.mjs).

## Tasks
1. **Police logic** — src/ride/police.ts: newPolice, startChase (spawn ~40 m behind the bike on the road), stepPolice (follows routeTo without the alley; catch < 3 m → 'caught' or 'surrender' if the bike is stopped; lost when > 75 m for 3 s or after 35 s). Checkpoint (chốt CSGT) at a fixed spot: passing it without enough helmets → pulled over; wheelie near it → chase. Reducer action `busted` (minutes, fine, mood) and `escaped`. Ride store wiring, pull-over freeze, cooldown.
2. **Smartphone** — phone home screen with apps: Tin nhắn, Điện thoại (Em, Sếp), Bản đồ, Thời tiết, Ngân hàng, Đồ ăn (order breakfast for Em), Lướt video (time trap), Nhạc, Mail, Cài đặt (sound). Calling Em at the door starts her walk-out (replaces the Gọi Em button). Phone usable in the street only when stopped.
3. **Logic fixes / constraints** — perfect ending needs hygiene; toasts don't expire while paused; help shows ride controls in the street; chat promise time checked at pickup; not texting Em makes her slow to come out; boss call softens the late ending; fines shown on the end card.
4. **UI redesign** — design tokens, Be Vietnam Pro font, lucide icons, unified panels and buttons, fixed end-card overflow, compact HUD for short screens, nicer rotate prompt, PWA manifest for fullscreen on iPhone home screen.
5. **Likeness** — Anh: fuller face, lighter skin, thick straight brows, voluminous swept black hair, broad nose. Em: long wavy brown hair with curtain bangs, big lashed eyes, rosy cheeks, pink lips, pearl earrings.
6. **Verify & ship** — audit screenshots at all viewports, full suite, build, fresh review, commit, push, temporary deploy.
