import { useEffect, useRef, useState } from 'react'
import { DANCES, type Dance } from '../player/pose'
import { useWorld } from '../room/world'
import { useGame } from '../store'
import { useStory } from '../story/store'
import { S } from '../strings'
import { DanceGlyph, DanceMoveGlyph } from './GameIcons'

const DANCE_SECONDS = 4

const dance = (d: Dance) => useWorld.getState().play(d, DANCE_SECONDS)

// Nút 💃 chọn điệu nhảy; phím G nhảy luôn, bấm tiếp thì đổi điệu.
export function DanceButton() {
  const [open, setOpen] = useState(false)
  const next = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyG' || e.repeat) return
      if (useGame.getState().paused || useStory.getState().s.overlay) return
      dance(DANCES[next.current % DANCES.length])
      next.current++
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="dance">
      {open && (
        <div className="hud-panel dance-menu">
          {DANCES.map((d) => (
            <button
              key={d}
              className="btn btn-ghost"
              onClick={() => {
                dance(d)
                setOpen(false)
              }}
            >
              <DanceMoveGlyph move={d} />
              {S.dance.names[d]}
            </button>
          ))}
        </div>
      )}
      <button className="icon-btn dance-button" aria-label={S.dance.button} aria-expanded={open} onClick={() => setOpen(!open)}>
        <DanceGlyph />
      </button>
    </div>
  )
}
