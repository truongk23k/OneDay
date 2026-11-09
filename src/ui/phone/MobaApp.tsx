import { ChevronsLeft, Coins, Sword, Zap } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { playCue } from '../../audio/sounds'
import { useGame } from '../../store'
import { MOBA, newMatch, stepMatch, type Match } from '../../story/moba'
import { useStory } from '../../story/store'
import { S } from '../../strings'

// Vẽ trận đấu lên canvas: làn đường, hai trụ, tướng xanh, lính đỏ, thanh máu, hiệu ứng chiêu.
function draw(ctx: CanvasRenderingContext2D, w: number, h: number, m: Match, flash: number) {
  const X = (x: number) => x * w
  const lane = h * 0.62
  ctx.clearRect(0, 0, w, h)
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#1d4f3a')
  sky.addColorStop(1, '#123326')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#8a6a3f'
  ctx.fillRect(0, lane - h * 0.09, w, h * 0.18)
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  for (let i = 0; i < 12; i++) ctx.fillRect(X(i / 12) + 4, lane - 1, w / 30, 2)

  const bar = (x: number, y: number, bw: number, v: number, color: string) => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(x - bw / 2, y, bw, 5)
    ctx.fillStyle = color
    ctx.fillRect(x - bw / 2 + 1, y + 1, (bw - 2) * Math.max(0, v), 3)
  }
  const tower = (x: number, color: string, hp: number) => {
    const tx = X(x)
    ctx.fillStyle = color
    ctx.fillRect(tx - h * 0.06, lane - h * 0.38, h * 0.12, h * 0.38)
    ctx.fillStyle = '#ffd23f'
    ctx.beginPath()
    ctx.arc(tx, lane - h * 0.42, h * 0.06, 0, Math.PI * 2)
    ctx.fill()
    bar(tx, lane - h * 0.56, h * 0.3, hp, color === '#3b7bff' ? '#4be36f' : '#ff4d4d')
  }
  tower(0.06, '#3b7bff', 1)
  tower(MOBA.towerX, '#e0412f', m.enemyTower / MOBA.towerHp)

  for (const n of m.minions) {
    ctx.fillStyle = '#ff6b5e'
    ctx.beginPath()
    ctx.arc(X(n.x), lane, h * 0.045, 0, Math.PI * 2)
    ctx.fill()
    bar(X(n.x), lane - h * 0.12, h * 0.12, n.hp / MOBA.minionHp, '#ff4d4d')
  }

  const hx = X(m.hero.x)
  if (flash > 0) {
    ctx.strokeStyle = `rgba(110, 200, 255, ${flash})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(hx, lane, X(MOBA.skillRange) * (1.2 - flash * 0.5), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#3b9bff'
  ctx.strokeStyle = '#ffd23f'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(hx, lane - h * 0.02, h * 0.07, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  bar(hx, lane - h * 0.16, h * 0.2, m.hero.hp / MOBA.heroHp, '#4be36f')
}

const IDLE = { attack: false, skill: false, back: false }

// App "Liên Quậy": một trận đánh đường giữa ngắn. Đồng hồ buổi sáng vẫn chạy trong lúc chơi.
export function MobaApp() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const match = useRef<Match>(newMatch())
  const input = useRef({ ...IDLE })
  const flash = useRef(0)
  const [hud, setHud] = useState({ gold: 0, skill: 0, result: null as Match['result'] })
  const dispatch = useStory((st) => st.dispatch)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let reported = false
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const el = canvas.current
      if (!useGame.getState().paused) {
        match.current = stepMatch(match.current, dt, input.current)
        input.current = { ...IDLE, back: input.current.back }
        flash.current = Math.max(0, flash.current - dt * 2.5)
      }
      const m = match.current
      if (m.result && !reported) {
        reported = true
        playCue(m.result === 'win' ? 'endingGood' : 'endingBad')
        dispatch({ type: 'matchEnd', won: m.result === 'win' })
      }
      if (!m.result) reported = false
      if (el) {
        const r = el.getBoundingClientRect()
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        if (el.width !== Math.round(r.width * dpr) || el.height !== Math.round(r.height * dpr)) {
          el.width = Math.round(r.width * dpr)
          el.height = Math.round(r.height * dpr)
        }
        const ctx = el.getContext('2d')
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          draw(ctx, r.width, r.height, m, flash.current)
        }
      }
      setHud((h) => (h.gold !== m.gold || h.result !== m.result || Math.ceil(h.skill) !== Math.ceil(m.skillReady) ? { gold: m.gold, skill: m.skillReady, result: m.result } : h))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [dispatch])

  const hold = (on: boolean) => (e: PointerEvent<HTMLButtonElement>) => {
    if (on) e.currentTarget.setPointerCapture?.(e.pointerId)
    input.current.back = on
  }
  return (
    <div className="app-body moba">
      <div className="moba-top">
        <span className="moba-gold">
          <Coins aria-hidden /> {hud.gold} {S.phone.moba.gold}
        </span>
        <span className="muted small">{S.phone.moba.hint}</span>
      </div>
      <div className="moba-field">
        <canvas ref={canvas} className="moba-canvas" aria-label={S.phone.moba.name} />
        {hud.result && (
          <div className={`moba-result ${hud.result}`}>
            <strong>{hud.result === 'win' ? S.phone.moba.win : S.phone.moba.lose}</strong>
            <button
              className="btn btn-primary"
              onClick={() => {
                match.current = newMatch()
                setHud({ gold: 0, skill: 0, result: null })
              }}
            >
              {S.phone.moba.again}
            </button>
          </div>
        )}
      </div>
      <div className="moba-controls">
        <button className="btn btn-ghost moba-back" aria-label={S.phone.moba.back} onPointerDown={hold(true)} onPointerUp={hold(false)} onPointerCancel={hold(false)} onLostPointerCapture={hold(false)}>
          <ChevronsLeft aria-hidden />
        </button>
        <button
          className="btn moba-skill"
          aria-label={S.phone.moba.skill}
          disabled={hud.skill > 0}
          onPointerDown={() => {
            if (match.current.skillReady > 0) return
            input.current.skill = true
            flash.current = 1
            playCue('crash')
          }}
        >
          <Zap aria-hidden />
          {hud.skill > 0 ? Math.ceil(hud.skill) : S.phone.moba.skill}
        </button>
        <button
          className="btn btn-primary moba-attack"
          aria-label={S.phone.moba.attack}
          onPointerDown={() => {
            input.current.attack = true
            playCue('click')
          }}
        >
          <Sword aria-hidden />
          {S.phone.moba.attack}
        </button>
      </div>
    </div>
  )
}
