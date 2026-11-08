import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { BRUSH_DONE, PLAQUE_COLS, PLAQUE_ROWS, brushAt, cleanFraction, newPlaque, type Plaque } from '../story/minigames'
import { useStory } from '../story/store'
import { S } from '../strings'

const CELL = 14
const W = PLAQUE_COLS * CELL
const H = PLAQUE_ROWS * CELL + 24

// Vẽ hai hàm răng trên nướu hồng, mảng bám vàng nâu nằm trên răng.
function draw(ctx: CanvasRenderingContext2D, p: Plaque) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#d9707e'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#7a2633'
  ctx.fillRect(0, (PLAQUE_ROWS / 2) * CELL + 2, W, 20)
  const teethPerRow = 12
  const tw = W / teethPerRow
  for (let row = 0; row < 2; row++) {
    const y0 = row === 0 ? 0 : (PLAQUE_ROWS / 2) * CELL + 22
    for (let i = 0; i < teethPerRow; i++) {
      ctx.fillStyle = '#fbf8f0'
      ctx.beginPath()
      // iOS 15 chưa có roundRect: vẽ răng vuông góc thay vì làm sập trang.
      if (typeof ctx.roundRect === 'function') ctx.roundRect(i * tw + 2, y0 + 2, tw - 4, (PLAQUE_ROWS / 2) * CELL - 4, 8)
      else ctx.rect(i * tw + 2, y0 + 2, tw - 4, (PLAQUE_ROWS / 2) * CELL - 4)
      ctx.fill()
    }
  }
  p.dirty.forEach((d, i) => {
    if (!d) return
    const col = i % PLAQUE_COLS
    const row = Math.floor(i / PLAQUE_COLS)
    const y = row * CELL + (row >= PLAQUE_ROWS / 2 ? 24 : 0)
    ctx.fillStyle = (col + row) % 3 === 0 ? '#b88a2e' : '#d7b552'
    ctx.beginPath()
    ctx.arc(col * CELL + CELL / 2, y + CELL / 2, CELL * 0.62, 0, Math.PI * 2)
    ctx.fill()
  })
}

// Bước 1: chọn tuýp (dễ nhầm sữa rửa mặt). Bước 2: chà sạch mảng bám trên răng.
export function BrushGame({ isTouch }: { isTouch: boolean }) {
  const overlay = useStory((st) => st.s.overlay)
  const pasteFirst = useStory((st) => st.s.pasteFirst)
  const seed = useStory((st) => st.s.seed)
  const dispatch = useStory((st) => st.dispatch)
  const [step, setStep] = useState<'pick' | 'scrub'>('pick')
  const [wrongPicked, setWrongPicked] = useState(false)
  const plaque = useRef<Plaque | null>(null)
  if (plaque.current === null) plaque.current = newPlaque(seed)
  const [progress, setProgress] = useState(0)
  const scrubbing = useRef(false)

  // Lượt chơi mới: quay lại bước chọn tuýp, mảng bám mới.
  useEffect(() => {
    setStep('pick')
    setWrongPicked(false)
    setProgress(0)
    plaque.current = newPlaque(seed)
  }, [seed])

  // Vẽ mỗi khi khung răng xuất hiện (kể cả khi đóng bảng rồi mở lại).
  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    const ctx = el?.getContext('2d')
    if (ctx && plaque.current) draw(ctx, plaque.current)
  }, [])

  if (overlay !== 'brush') return null

  // Tuýp 0 hay 1 là kem đánh răng tùy lượt chơi.
  const pasteIndex = pasteFirst ? 0 : 1
  const pick = (i: number) => {
    if (i === pasteIndex) {
      setStep('scrub')
      return
    }
    if (!wrongPicked) dispatch({ type: 'wrongTube' })
    setWrongPicked(true)
  }

  const scrubAt = (e: PointerEvent<HTMLCanvasElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    if (!rect.width) return
    const px = ((e.clientX - rect.left) / rect.width) * W
    let py = ((e.clientY - rect.top) / rect.height) * H
    // Bỏ khe giữa hai hàm khi đổi sang tọa độ ô.
    if (py > (PLAQUE_ROWS / 2) * CELL + 24) py -= 24
    else if (py > (PLAQUE_ROWS / 2) * CELL) py = (PLAQUE_ROWS / 2) * CELL - 1
    const next = brushAt(plaque.current!, px / CELL, py / CELL, 1.3)
    plaque.current = next
    const ctx = el.getContext('2d')
    if (ctx) draw(ctx, next)
    const f = cleanFraction(next)
    setProgress(f)
    if (f >= BRUSH_DONE) dispatch({ type: 'brushDone' })
  }

  return (
    <div className="overlay-backdrop">
      <div className="card game">
        <button className="card-close" aria-label="Đóng" onClick={() => dispatch({ type: 'close' })}>
          ×
        </button>
        <h2>{S.brush.title}</h2>
        {step === 'pick' ? (
          <>
            <p>{S.brush.pick}</p>
            {wrongPicked && <p className="game-line">{S.story.wrongTube}</p>}
            <div className="tubes">
              {S.brush.tubes.map((name, i) => (
                <button key={name} className="tube" onClick={() => pick(i)} disabled={wrongPicked && i !== pasteIndex}>
                  <span className="tube-icon">🧴</span>
                  {name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p>{isTouch ? S.brush.scrubTouch : S.brush.scrubMouse}</p>
            <canvas
              ref={canvasRef}
              className="teeth"
              width={W}
              height={H}
              role="img"
              aria-label="Hàm răng"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId)
                scrubbing.current = true
                scrubAt(e)
              }}
              onPointerMove={(e) => scrubbing.current && scrubAt(e)}
              onPointerUp={() => (scrubbing.current = false)}
              onPointerCancel={() => (scrubbing.current = false)}
            />
            <div className="bar">
              <div className="bar-fill" style={{ width: `${(progress / BRUSH_DONE) * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
