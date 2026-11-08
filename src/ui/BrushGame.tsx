import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { newScrub, scrub, type Scrub } from '../story/minigames'
import { useStory } from '../story/store'
import { S } from '../strings'

const SWIPE_PX = 40

// Bước 1: chọn tuýp (dễ nhầm sữa rửa mặt). Bước 2: chà qua lại cho đầy thanh.
export function BrushGame({ isTouch }: { isTouch: boolean }) {
  const overlay = useStory((st) => st.s.overlay)
  const pasteFirst = useStory((st) => st.s.pasteFirst)
  const dispatch = useStory((st) => st.dispatch)
  const [step, setStep] = useState<'pick' | 'scrub'>('pick')
  const [wrongPicked, setWrongPicked] = useState(false)
  const scrubRef = useRef<Scrub>(newScrub())
  const [progress, setProgress] = useState(0)
  const swipe = useRef<{ x: number } | null>(null)

  const stroke = (dir: -1 | 1) => {
    scrubRef.current = scrub(scrubRef.current, dir)
    setProgress(scrubRef.current.progress)
    if (scrubRef.current.progress >= 1) dispatch({ type: 'brushDone' })
  }

  useEffect(() => {
    if (overlay !== 'brush' || step !== 'scrub') return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') stroke(-1)
      if (e.code === 'KeyD' || e.code === 'ArrowRight') stroke(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

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

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    swipe.current = { x: e.clientX }
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!swipe.current) return
    const dx = e.clientX - swipe.current.x
    if (Math.abs(dx) >= SWIPE_PX) {
      stroke(dx > 0 ? 1 : -1)
      swipe.current = { x: e.clientX }
    }
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
            <p>{isTouch ? S.brush.scrubTouch : S.brush.scrubKeys}</p>
            <div
              className="scrub-area"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={() => (swipe.current = null)}
            >
              🪥 ↔️
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
