import { ChevronLeft, ChevronRight, Coins, Lock, Swords, Tornado, Wind, Zap } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { playCue } from '../../audio/sounds'
import { useGame } from '../../store'
import { format } from '../../story/clock'
import { MOBA, maxHp, newMatch, stepMatch, type Match, type MatchEvent, type MatchInput } from '../../story/moba'
import { drawScene, type Floater, type Fx } from './mobaArt'
import { useStory } from '../../story/store'
import { S } from '../../strings'
import { usePhone } from './phoneStore'

type Banner = { text: string; color: string; age: number }

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
  // Ai vừa trúng đòn (nháy trắng) và ai đang bước đi (để chân bước).
  const flash = useRef(new Map<number, number>())
  const lastX = useRef({ hero: 0, enemy: 0 })
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
        const ch = canvas.current?.clientHeight ?? 160
        if (e.kind === 'hit' && e.id !== undefined) flash.current.set(e.id, now)
        if (e.kind === 'hit' && e.amount) {
          floaters.current.push({ x: e.x + (Math.random() - 0.5) * 0.04, y: ch * (0.3 + Math.random() * 0.06), text: String(e.amount), color: e.side === 'ally' ? '#ff6b5e' : '#ffffff', age: 0, big: e.amount >= 50 })
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
        if (e.kind === 'gold' && e.amount) floaters.current.push({ x: e.x, y: ch * 0.24, text: `+${e.amount}`, color: '#ffd23f', age: 0 })
        if (e.kind === 'towerShot') fx.current.push({ kind: 'shot', x: e.x, from: e.side === 'ally' ? MOBA.tower.allyX : MOBA.tower.enemyX, side: e.side, age: 0 })
        if (e.kind === 'levelUp') {
          fx.current.push({ kind: 'levelUp', x: e.x, age: 0 })
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
          const look = {
            flash: flash.current,
            now,
            heroMoving: Math.abs(m.hero.x - lastX.current.hero) > 1e-5,
            enemyMoving: Math.abs(m.enemy.x - lastX.current.enemy) > 1e-5,
          }
          lastX.current = { hero: m.hero.x, enemy: m.enemy.x }
          drawScene(ctx, r.width, r.height, m, now / 1000, fx.current, floaters.current, shake.current, look)
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
          <span className="moba-badge">{hud.level}</span>
          <span className="moba-bars">
            <span className="moba-hp">
              <span style={{ width: `${hud.hp * 100}%` }} />
            </span>
            <span className="moba-xp">
              <span style={{ width: `${hud.xp * 100}%` }} />
            </span>
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
    hp: Math.round((m.hero.hp / maxHp(lv)) * 40) / 40,
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
