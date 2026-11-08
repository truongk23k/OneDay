import { useEffect, useRef, useState } from 'react'
import { WASH_ROUNDS, washLevel, washOk } from '../story/minigames'
import { useStory } from '../story/store'
import { S } from '../strings'

const isHoldKey = (e: KeyboardEvent) => e.code === 'Space' || e.code === 'KeyE'

// Giữ nút để vốc nước, thả đúng lúc thanh nằm trong vùng xanh. 3 lượt, lượt sau nhanh hơn, vùng hẹp hơn.
export function WashGame() {
  const overlay = useStory((st) => st.s.overlay)
  const dispatch = useStory((st) => st.dispatch)
  const startedAt = useRef<number | null>(null)
  const [round, setRound] = useState(0)
  const [level, setLevel] = useState(0)
  const [failed, setFailed] = useState(false)
  const roundRef = useRef(0)
  roundRef.current = round

  useEffect(() => {
    if (overlay === 'wash') {
      setRound(0)
      setFailed(false)
    }
  }, [overlay])

  // Cập nhật thanh nước khi đang giữ.
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (startedAt.current !== null) setLevel(washLevel(Date.now() - startedAt.current, roundRef.current))
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
    const r = roundRef.current
    const l = washLevel(Date.now() - startedAt.current, r)
    startedAt.current = null
    setLevel(0)
    if (!washOk(l, r)) {
      setFailed(true)
      dispatch({ type: 'washFail' })
      return
    }
    setFailed(false)
    if (r === WASH_ROUNDS.length - 1) dispatch({ type: 'washDone' })
    else setRound(r + 1)
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
  const [lo, hi] = WASH_ROUNDS[round].zone
  return (
    <div className="overlay-backdrop">
      <div className="card game">
        <button className="card-close" aria-label="Đóng" onClick={() => dispatch({ type: 'close' })}>
          ×
        </button>
        <h2>{S.wash.title}</h2>
        <p>
          <strong>{`${S.wash.round} ${round + 1}/${WASH_ROUNDS.length}`}</strong>
        </p>
        <p>{S.wash.hint}</p>
        {failed && <p className="game-line">{S.story.washFail}</p>}
        <div className="bar">
          <div className="bar-zone" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
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
