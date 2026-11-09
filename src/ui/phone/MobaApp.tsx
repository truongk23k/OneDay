import { ChevronLeft, ChevronRight, Coins, Lock, Swords, Tornado, Wind, Zap } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { playCue } from '../../audio/sounds'
import { useGame } from '../../store'
import { format } from '../../story/clock'
import { MOBA, maxHp, newMatch, stepMatch, type Match, type MatchEvent, type MatchInput } from '../../story/moba'
import { useStory } from '../../story/store'
import { S } from '../../strings'
import { usePhone } from './phoneStore'

type Floater = { x: number; y: number; text: string; color: string; age: number }
type Fx = { kind: 'spin' | 'dash' | 'ult' | 'enemySkill'; x: number; age: number; from?: number }
type Banner = { text: string; color: string; age: number }

// ---------- Vẽ trận đấu (canvas) ----------
function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, m: Match, t: number, fx: Fx[], floaters: Floater[], shake: number) {
  const X = (x: number) => x * w
  // Làn đường nằm trên khu nút điều khiển (nửa dưới là cỏ, nút đặt lên đó).
  const ground = h * 0.56
  ctx.save()
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 10, (Math.random() - 0.5) * shake * 8)
  // Trời hoàng hôn, núi xa, cỏ, làn đường lát đá.
  const sky = ctx.createLinearGradient(0, 0, 0, ground)
  sky.addColorStop(0, '#2b1d5c')
  sky.addColorStop(0.6, '#a2477a')
  sky.addColorStop(1, '#f2a65a')
  ctx.fillStyle = sky
  ctx.fillRect(-20, -20, w + 40, ground + 20)
  ctx.fillStyle = '#3a2a5e'
  ctx.beginPath()
  ctx.moveTo(-20, ground)
  for (let i = 0; i <= 8; i++) ctx.lineTo((i / 8) * w, ground - h * (0.18 + 0.12 * Math.abs(Math.sin(i * 1.7))))
  ctx.lineTo(w + 20, ground)
  ctx.fill()
  ctx.fillStyle = '#2f6b3a'
  ctx.fillRect(-20, ground - h * 0.04, w + 40, h)
  ctx.fillStyle = '#8b7a5c'
  ctx.fillRect(-20, ground - h * 0.02, w + 40, h * 0.13)
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  for (let i = 0; i < 24; i++) ctx.fillRect((i / 24) * w + 3, ground + h * 0.04, w / 40, 2)

  const bar = (cx: number, y: number, bw: number, v: number, color: string) => {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(cx - bw / 2 - 1, y - 1, bw + 2, 6)
    ctx.fillStyle = color
    ctx.fillRect(cx - bw / 2, y, bw * Math.max(0, Math.min(1, v)), 4)
  }

  // Trụ: bệ đá, cột, pha lê phát sáng nhấp nháy.
  const tower = (x: number, hp: number, ally: boolean) => {
    const tx = X(x)
    const c = ally ? '#4aa8ff' : '#ff5b4d'
    if (hp <= 0) {
      ctx.fillStyle = '#4a4458'
      ctx.fillRect(tx - h * 0.07, ground - h * 0.08, h * 0.14, h * 0.08)
      return
    }
    ctx.fillStyle = '#5b556b'
    ctx.fillRect(tx - h * 0.08, ground - h * 0.08, h * 0.16, h * 0.08)
    ctx.fillStyle = '#7a7390'
    ctx.fillRect(tx - h * 0.04, ground - h * 0.24, h * 0.08, h * 0.18)
    const glow = 0.6 + 0.4 * Math.sin(t * 4 + (ally ? 0 : 1))
    ctx.fillStyle = c
    ctx.shadowColor = c
    ctx.shadowBlur = 14 * glow
    ctx.beginPath()
    ctx.moveTo(tx, ground - h * 0.36)
    ctx.lineTo(tx + h * 0.05, ground - h * 0.29)
    ctx.lineTo(tx, ground - h * 0.22)
    ctx.lineTo(tx - h * 0.05, ground - h * 0.29)
    ctx.fill()
    ctx.shadowBlur = 0
    bar(tx, ground - h * 0.42, h * 0.26, hp / MOBA.tower.hp, ally ? '#4be36f' : '#ff4d4d')
  }
  tower(MOBA.tower.allyX, m.towers.ally, true)
  tower(MOBA.tower.enemyX, m.towers.enemy, false)

  // Lính: thân tròn nhún theo bước, mũ, thanh máu nhỏ.
  for (const n of m.minions) {
    const cx = X(n.x)
    const bob = Math.abs(Math.sin(t * 9 + n.id)) * h * 0.015
    const r = h * 0.04
    const cy = ground + h * 0.02 - r - bob
    ctx.fillStyle = n.side === 'ally' ? '#4aa8ff' : '#ff6b5e'
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = n.side === 'ally' ? '#1f4fbf' : '#8c1f14'
    ctx.beginPath()
    ctx.arc(cx, cy - r * 0.3, r * 0.75, Math.PI, 0)
    ctx.fill()
    bar(cx, cy - r - h * 0.05, h * 0.09, n.hp / MOBA.minion.hp, n.side === 'ally' ? '#4be36f' : '#ff4d4d')
  }

  // Tướng: thân, áo choàng, kiếm vung khi đánh; tên + cấp; chết thì mờ đi chờ hồi sinh.
  const hero = (x: number, hp: number, max: number, mine: boolean, dead: number, label: string, swing: number, lift = 0) => {
    const cx = X(x)
    const r = h * 0.065
    const cy = ground + h * 0.01 - r
    const top = cy - r - h * (0.08 + lift)
    ctx.globalAlpha = dead > 0 ? 0.35 : 1
    ctx.fillStyle = mine ? '#1f6fe0' : '#7a2b9c'
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.9 * (mine ? 1 : -1), cy - r * 0.2)
    ctx.lineTo(cx - r * 1.8 * (mine ? 1 : -1), cy + r * 1.1)
    ctx.lineTo(cx - r * 0.2 * (mine ? 1 : -1), cy + r * 0.9)
    ctx.fill()
    ctx.fillStyle = mine ? '#4aa8ff' : '#c056e8'
    ctx.strokeStyle = mine ? '#ffd23f' : '#ff4d4d'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (!mine) {
      ctx.fillStyle = '#f2e6c9'
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(cx + s * r * 0.5, cy - r * 0.8)
        ctx.lineTo(cx + s * r * 0.9, cy - r * 1.6)
        ctx.lineTo(cx + s * r * 0.15, cy - r * 0.95)
        ctx.fill()
      }
    }
    const dir = mine ? 1 : -1
    const ang = -0.9 + swing * 2.2
    ctx.strokeStyle = '#e8eef7'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx + dir * r * 0.7, cy)
    ctx.lineTo(cx + dir * (r * 0.7 + Math.cos(ang) * r * 1.6), cy + Math.sin(ang) * r * 1.6)
    ctx.stroke()
    ctx.globalAlpha = 1
    bar(cx, top, h * 0.18, hp / max, mine ? '#4be36f' : '#ff4d4d')
    ctx.font = `800 ${Math.round(h * 0.055)}px 'Baloo 2', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'
    ctx.lineWidth = 3
    ctx.strokeText(label, cx, top - h * 0.02)
    ctx.fillText(label, cx, top - h * 0.02)
    if (dead > 0) {
      ctx.font = `800 ${Math.round(h * 0.09)}px 'Baloo 2', sans-serif`
      ctx.strokeText(String(Math.ceil(dead)), cx, cy + r * 0.3)
      ctx.fillText(String(Math.ceil(dead)), cx, cy + r * 0.3)
    }
  }
  const swing = Math.max(0, m.hero.cd0 / MOBA.hero.attackCd)
  const enemyX = m.enemy.dead > 0 ? MOBA.tower.enemyX - 0.04 : m.enemy.x
  // Hai tướng đứng sát nhau: đẩy tên + thanh máu của địch lên cao cho khỏi đè.
  const lift = Math.abs(enemyX - m.hero.x) < 0.07 ? 0.11 : 0
  hero(enemyX, m.enemy.hp, MOBA.hero.hp, false, m.enemy.dead, 'Địch', 1 - Math.max(0, m.enemy.cd0 / MOBA.enemy.attackCd), lift)
  hero(m.hero.x, m.hero.hp, maxHp(m.hero.level), true, m.hero.dead, `Anh · ${m.hero.level}`, 1 - swing)
  if (m.enemy.stun > 0) {
    ctx.fillStyle = '#ffd23f'
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + (i * Math.PI * 2) / 3
      ctx.beginPath()
      ctx.arc(X(m.enemy.x) + Math.cos(a) * h * 0.06, ground - h * 0.2 + Math.sin(a) * h * 0.02, h * 0.012, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Hiệu ứng chiêu.
  for (const f of fx) {
    const k = 1 - f.age
    if (f.kind === 'spin' || f.kind === 'enemySkill') {
      ctx.strokeStyle = f.kind === 'spin' ? `rgba(120, 210, 255, ${k})` : `rgba(200, 90, 255, ${k})`
      ctx.lineWidth = 4 * k + 1
      ctx.beginPath()
      ctx.arc(X(f.x), ground - h * 0.06, X(MOBA.skill1.range) * (0.4 + f.age), 0, Math.PI * 2)
      ctx.stroke()
    } else if (f.kind === 'dash') {
      const g = ctx.createLinearGradient(X(f.from ?? f.x), 0, X(f.x), 0)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(1, `rgba(170, 230, 255, ${k})`)
      ctx.fillStyle = g
      ctx.fillRect(X(f.from ?? f.x), ground - h * 0.13, X(f.x) - X(f.from ?? f.x), h * 0.06)
    } else if (f.kind === 'ult') {
      ctx.strokeStyle = `rgba(255, 240, 140, ${k})`
      ctx.lineWidth = 3
      for (let i = 0; i < 5; i++) {
        const bx = X(f.x + (i / 4) * MOBA.ult.range)
        ctx.beginPath()
        ctx.moveTo(bx, 0)
        for (let s = 1; s <= 5; s++) ctx.lineTo(bx + (Math.random() - 0.5) * h * 0.12, (s / 5) * (ground - h * 0.05))
        ctx.stroke()
      }
      ctx.fillStyle = `rgba(255, 245, 200, ${k * 0.35})`
      ctx.fillRect(0, 0, w, h)
    }
  }
  // Số sát thương bay lên.
  ctx.textAlign = 'center'
  for (const f of floaters) {
    ctx.globalAlpha = 1 - f.age
    ctx.font = `800 ${Math.round(h * 0.07)}px 'Baloo 2', sans-serif`
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'
    ctx.lineWidth = 3
    const y = f.y - f.age * h * 0.15
    ctx.strokeText(f.text, X(f.x), y)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, X(f.x), y)
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

// ---------- Nút điều khiển ----------
function HoldButton(props: { label: string; className: string; children: ReactNode; onHold: (on: boolean) => void }) {
  const set = (on: boolean) => (e: PointerEvent<HTMLButtonElement>) => {
    if (on) e.currentTarget.setPointerCapture?.(e.pointerId)
    props.onHold(on)
  }
  return (
    <button
      className={props.className}
      aria-label={props.label}
      onPointerDown={set(true)}
      onPointerUp={set(false)}
      onPointerCancel={set(false)}
      onLostPointerCapture={set(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {props.children}
    </button>
  )
}

function SkillButton(props: { label: string; className: string; cd: number; max: number; locked?: boolean; onTap: () => void; children: ReactNode }) {
  const ready = props.cd <= 0 && !props.locked
  return (
    <button
      className={`moba-skill ${props.className}${ready ? '' : ' cooling'}`}
      aria-label={props.label}
      onPointerDown={props.onTap}
      style={{ '--cd': `${props.locked ? 1 : Math.min(1, props.cd / props.max)}` } as React.CSSProperties}
    >
      {props.locked ? <Lock aria-hidden /> : props.children}
      {!props.locked && props.cd > 0 && <span className="moba-cd">{Math.ceil(props.cd)}</span>}
      {props.locked && <span className="moba-cd small">{S.phone.moba.level} {MOBA.ult.level}</span>}
    </button>
  )
}

const IDLE: MatchInput = { move: 0, attack: false, skill1: false, skill2: false, ult: false }

// App "Liên Quậy": điện thoại xoay ngang, đánh đường giữa. Đồng hồ buổi sáng vẫn chạy trong lúc chơi.
export function MobaApp() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const match = useRef<Match>(newMatch())
  const input = useRef({ left: false, right: false, attack: false, skill1: false, skill2: false, ult: false })
  const fx = useRef<Fx[]>([])
  const floaters = useRef<Floater[]>([])
  const shake = useRef(0)
  const lastHitSound = useRef(0)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [hud, setHud] = useState(() => snapshot(newMatch()))
  const minute = useStory((st) => Math.floor(st.s.minutes))
  const dispatch = useStory((st) => st.dispatch)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let reported = false
    const say = (text: string, color: string) => setBanner({ text, color, age: performance.now() })
    const onEvents = (events: MatchEvent[], now: number) => {
      for (const e of events) {
        if (e.kind === 'hit' && e.amount) {
          const h = canvas.current?.clientHeight ?? 160
          floaters.current.push({ x: e.x + (Math.random() - 0.5) * 0.04, y: h * (0.3 + Math.random() * 0.06), text: String(e.amount), color: e.side === 'ally' ? '#ff6b5e' : '#ffffff', age: 0 })
          if (now - lastHitSound.current > 90) {
            lastHitSound.current = now
            playCue('slash')
          }
        }
        if (e.kind === 'skill') {
          fx.current.push(e.amount === 1 ? { kind: 'spin', x: e.x, age: 0 } : { kind: 'dash', x: match.current.hero.x, from: e.x, age: 0 })
          playCue(e.amount === 1 ? 'spin' : 'dash')
        }
        if (e.kind === 'ult') {
          fx.current.push({ kind: 'ult', x: e.x, age: 0 })
          shake.current = 1
          playCue('thunder')
        }
        if (e.kind === 'enemySkill') {
          fx.current.push({ kind: 'enemySkill', x: e.x, age: 0 })
          playCue('enemySkill')
        }
        if (e.kind === 'heroKill') {
          say(S.phone.moba.slain, '#ffd23f')
          playCue('kill')
        }
        if (e.kind === 'death') {
          say(S.phone.moba.died, '#ff6b5e')
          playCue('death')
        }
        if (e.kind === 'levelUp') {
          say(`${S.phone.moba.levelUp} ${e.amount}!`, '#7be08a')
          playCue('levelUp')
        }
        if (e.kind === 'towerHit' && now - lastHitSound.current > 150) playCue('towerHit')
        if (e.kind === 'towerDown') say(e.side === 'enemy' ? S.phone.moba.towerDown : S.phone.moba.towerLost, e.side === 'enemy' ? '#ffd23f' : '#ff6b5e')
      }
    }
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const paused = useGame.getState().paused
      if (!paused) {
        const i = input.current
        const step = stepMatch(match.current, dt, { ...IDLE, move: (i.right ? 1 : 0) - (i.left ? 1 : 0), attack: i.attack, skill1: i.skill1, skill2: i.skill2, ult: i.ult })
        i.skill1 = i.skill2 = i.ult = false
        match.current = step.match
        onEvents(step.events, now)
        for (const f of fx.current) f.age += dt * 2
        for (const f of floaters.current) f.age += dt * 1.4
        fx.current = fx.current.filter((f) => f.age < 1)
        floaters.current = floaters.current.filter((f) => f.age < 1).slice(-30)
        shake.current = Math.max(0, shake.current - dt * 2.5)
      }
      const m = match.current
      if (m.result && !reported) {
        reported = true
        playCue(m.result === 'win' ? 'endingGood' : 'endingBad')
        dispatch({ type: 'matchEnd', won: m.result === 'win' })
      }
      if (!m.result) reported = false
      const el = canvas.current
      if (el) {
        const r = el.getBoundingClientRect()
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        if (el.width !== Math.round(r.width * dpr) || el.height !== Math.round(r.height * dpr)) {
          el.width = Math.round(r.width * dpr)
          el.height = Math.round(r.height * dpr)
        }
        const ctx = el.getContext('2d')
        if (ctx && r.width > 0) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          drawScene(ctx, r.width, r.height, m, now / 1000, fx.current, floaters.current, shake.current)
        }
      }
      setHud((h) => {
        const n = snapshot(m)
        return JSON.stringify(n) === JSON.stringify(h) ? h : n
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // Bàn phím (máy tính): A/D hoặc ← → đi, J đánh, K / L / U ba chiêu.
    const key = (on: boolean) => (e: KeyboardEvent) => {
      const i = input.current
      const map: Record<string, () => void> = {
        KeyA: () => (i.left = on),
        ArrowLeft: () => (i.left = on),
        KeyD: () => (i.right = on),
        ArrowRight: () => (i.right = on),
        KeyJ: () => (i.attack = on),
        KeyK: () => on && (i.skill1 = true),
        KeyL: () => on && (i.skill2 = true),
        KeyU: () => on && (i.ult = true),
      }
      if (!map[e.code] || e.repeat) return
      e.preventDefault()
      map[e.code]()
    }
    const down = key(true)
    const up = key(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [dispatch])

  const showBanner = banner && performance.now() - banner.age < 1600
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 1600)
    return () => clearTimeout(t)
  }, [banner])

  const i = input.current
  return (
    <div className="moba">
      <canvas ref={canvas} className="moba-canvas" aria-label={S.phone.moba.name} />
      <div className="moba-top">
        <button className="moba-exit" aria-label={S.phone.back} onClick={() => usePhone.getState().go('home')}>
          <ChevronLeft aria-hidden />
        </button>
        <span className="moba-kd">
          <Swords aria-hidden /> {hud.kills} / {hud.deaths}
        </span>
        <span className="moba-gold">
          <Coins aria-hidden /> {hud.gold}
        </span>
        <span className="moba-level">
          {S.phone.moba.level} {hud.level}
          <span className="moba-xp">
            <span style={{ width: `${hud.xp * 100}%` }} />
          </span>
        </span>
        <span className="moba-clock" title={S.phone.moba.hint}>
          {format(minute)}
        </span>
      </div>
      {showBanner && (
        <div className="moba-banner" style={{ color: banner.color }}>
          {banner.text}
        </div>
      )}
      <div className="moba-pad">
        <HoldButton label={S.phone.moba.left} className="moba-move" onHold={(on) => (i.left = on)}>
          <ChevronLeft aria-hidden />
        </HoldButton>
        <HoldButton label={S.phone.moba.right} className="moba-move" onHold={(on) => (i.right = on)}>
          <ChevronRight aria-hidden />
        </HoldButton>
      </div>
      <div className="moba-skills">
        <SkillButton label={S.phone.moba.skill1} className="s1" cd={hud.cd1} max={MOBA.skill1.cd} onTap={() => (i.skill1 = true)}>
          <Tornado aria-hidden />
        </SkillButton>
        <SkillButton label={S.phone.moba.skill2} className="s2" cd={hud.cd2} max={MOBA.skill2.cd} onTap={() => (i.skill2 = true)}>
          <Wind aria-hidden />
        </SkillButton>
        <SkillButton label={S.phone.moba.ult} className="s3" cd={hud.cdU} max={MOBA.ult.cd} locked={hud.level < MOBA.ult.level} onTap={() => (i.ult = true)}>
          <Zap aria-hidden />
        </SkillButton>
        <HoldButton label={S.phone.moba.attack} className="moba-attack" onHold={(on) => (i.attack = on)}>
          <Swords aria-hidden />
        </HoldButton>
      </div>
      {hud.result && (
        <div className={`moba-result ${hud.result}`}>
          <strong>{hud.result === 'win' ? S.phone.moba.win : S.phone.moba.lose}</strong>
          <span>
            <Swords aria-hidden /> {hud.kills} / {hud.deaths} · <Coins aria-hidden /> {hud.gold}
          </span>
          <button
            className="btn btn-primary"
            onClick={() => {
              match.current = newMatch()
              fx.current = []
              floaters.current = []
              setHud(snapshot(match.current))
            }}
          >
            {S.phone.moba.again}
          </button>
        </div>
      )}
    </div>
  )
}

// Những số HUD cần hiển thị (làm tròn để không vẽ lại React mỗi khung hình).
function snapshot(m: Match) {
  const lv = m.hero.level
  const lo = MOBA.levels[lv - 1]
  const hi = MOBA.levels[lv] ?? lo
  return {
    kills: m.kills,
    deaths: m.deaths,
    gold: m.hero.gold,
    level: lv,
    xp: hi > lo ? Math.round(((m.hero.xp - lo) / (hi - lo)) * 20) / 20 : 1,
    cd1: Math.ceil(m.hero.cd1 * 4) / 4,
    cd2: Math.ceil(m.hero.cd2 * 4) / 4,
    cdU: Math.ceil(m.hero.cdU * 4) / 4,
    result: m.result,
  }
}
