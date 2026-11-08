import { useEffect, useState } from 'react'
import { WARDROBE, itemLabel, type Slot } from '../story/outfit'
import type { Outfit } from '../story/state'
import { useStory } from '../story/store'
import { S } from '../strings'

const SLOTS: Slot[] = ['top', 'bottom', 'shoes']

// Tủ đồ: chọn áo, quần, giày dép (+ áo mưa) rồi bấm "Mặc".
export function Wardrobe() {
  const overlay = useStory((st) => st.s.overlay)
  const current = useStory((st) => st.s.outfit)
  const weather = useStory((st) => st.s.weather)
  const dispatch = useStory((st) => st.dispatch)
  const [draft, setDraft] = useState<Outfit>(current)

  // Mỗi lần mở tủ thì bắt đầu từ bộ đang mặc.
  useEffect(() => {
    if (overlay === 'wardrobe') setDraft(current)
  }, [overlay, current])

  if (overlay !== 'wardrobe') return null
  return (
    <div className="overlay-backdrop">
      <div className="card game wardrobe">
        <button className="card-close" aria-label="Đóng" onClick={() => dispatch({ type: 'close' })}>
          ×
        </button>
        <h2>{S.wardrobe.title}</h2>
        {weather === 'rain' && <p className="game-line">{S.wardrobe.rainHint}</p>}
        {SLOTS.map((slot) => (
          <div key={slot} className="wardrobe-row">
            <div className="wardrobe-slot">{S.wardrobe.slots[slot]}</div>
            <div className="chips">
              {WARDROBE.filter((i) => i.slot === slot).map((i) => (
                <button
                  key={i.id}
                  className={draft[slot] === i.id ? 'chip selected' : 'chip'}
                  aria-pressed={draft[slot] === i.id}
                  onClick={() => setDraft({ ...draft, [slot]: i.id })}
                >
                  <span className="swatch" style={{ background: i.color }} />
                  {itemLabel(i.id)}
                </button>
              ))}
            </div>
          </div>
        ))}
        <label className="raincoat">
          <input
            type="checkbox"
            checked={draft.raincoat}
            onChange={(e) => setDraft({ ...draft, raincoat: e.target.checked })}
          />
          🧥 {S.wardrobe.raincoat}
        </label>
        <button className="btn btn-primary btn-block" onClick={() => dispatch({ type: 'dress', outfit: draft })}>
          {S.wardrobe.wear}
        </button>
      </div>
    </div>
  )
}
