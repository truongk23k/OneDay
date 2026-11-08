import { useEffect, useRef, useState } from 'react'
import { WASH_ZONE, washLevel, washOk } from '../story/minigames'
import { useStory } from '../story/store'
import { S } from '../strings'

const isHoldKey = (e: KeyboardEvent) => e.code === 'Space' || e.code === 'KeyE'

// Giữ nút để vốc nước, thả đúng lúc thanh nằm trong vùng xanh.
export function WashGame() {
  const overlay = useStory((st) => st.s.overlay)
  const dispatch = useStory((st) => st.dispatch)
  const startedAt = useRef<number | null>(null)
  const [level, setLevel] = useState(0)
  const [failed, setFailed] = useState(false)

  // Cập nhật thanh nước khi đang giữ.
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (startedAt.current !== null) setLevel(washLevel(Date.now() - startedAt.current))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const press = () => {
    if (startedAt.current === null) startedAt.current = Date.now()
  }
  const release = () => {
    if (startedAt.current === null) return
    const l = washLevel(Date.now() - startedAt.current)
    startedAt.current = null
    setLevel(0)
    if (washOk(l)) {
      dispatch({ type: 'washDone' })
    } else {
      setFailed(true)
      dispatch({ type: 'washFail' })
    }
  }

  useEffect(() => {
    if (overlay !== 'wash') return
    const down = (e: KeyboardEvent) => {
      if (isHoldKey(e) && !e.repeat) press()
    }
    const up = (e: KeyboardEvent) => {
      if (isHoldKey(e)) release()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  })

  if (overlay !== 'wash') return null
  return (
    <div className="overlay-backdrop">
      <div className="card game">
        <button className="card-close" aria-label="Đóng" onClick={() => dispatch({ type: 'close' })}>
          ×
        </button>
        <h2>{S.wash.title}</h2>
        <p>{S.wash.hint}</p>
        {failed && <p className="game-line">{S.story.washFail}</p>}
        <div className="bar">
          <div className="bar-zone" style={{ left: `${WASH_ZONE[0]}%`, width: `${WASH_ZONE[1] - WASH_ZONE[0]}%` }} />
          <div className="bar-fill water" style={{ width: `${level}%` }} />
        </div>
        <button
          className="btn btn-primary btn-block hold"
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
        >
          💧 {S.wash.hold}
        </button>
      </div>
    </div>
  )
}
