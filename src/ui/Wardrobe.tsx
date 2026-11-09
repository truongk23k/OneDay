import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { HINTS, ICONS, itemById, itemLabel, type Slot } from '../story/outfit'
import { useStory } from '../story/store'
import { useDraft } from '../story/wardrobeDraft'
import { S } from '../strings'

const SLOTS: Slot[] = ['top', 'bottom', 'shoes']

// Thử đồ trước tủ: Anh đứng trước tủ mở, bấm ‹ › để thay từng món và thấy ngay trên người Anh.
export function Wardrobe() {
  const overlay = useStory((st) => st.s.overlay)
  const current = useStory((st) => st.s.outfit)
  const weather = useStory((st) => st.s.weather)
  const hint = useStory((st) => st.s.hint)
  const dispatch = useStory((st) => st.dispatch)
  const draft = useDraft((d) => d.draft)
  const junkLine = useDraft((d) => d.junkLine)

  // Mỗi lần mở tủ thì bắt đầu từ bộ đang mặc.
  useEffect(() => {
    if (overlay === 'wardrobe') useDraft.getState().reset(current)
  }, [overlay, current])

  if (overlay !== 'wardrobe') return null
  const { cycle, toggleRaincoat } = useDraft.getState()
  return (
    <>
      <div className="dress-hint">
        <div className="em-bubble">
          <span className="em-name">{S.wardrobe.hintFrom}</span> {S.wardrobe.hints[HINTS[hint].id]}
        </div>
        {weather === 'rain' && <p className="game-line">{S.wardrobe.rainHint}</p>}
        {junkLine && <p className="game-line">{junkLine}</p>}
      </div>
      <div className="dress-panel">
        {SLOTS.map((slot) => {
          const id = draft[slot]
          const name = S.wardrobe.slots[slot]
          return (
            <div key={slot} className="dress-row">
              <button className="dress-arrow" aria-label={`${name} ${S.wardrobe.prev}`} onClick={() => cycle(slot, -1)}>
                <ChevronLeft aria-hidden />
              </button>
              <div className="dress-item">
                <div className="dress-slot">{name}</div>
                <div className="dress-name">
                  <span className="swatch" style={{ background: itemById(id).color }} /> {ICONS[id]} <span>{itemLabel(id)}</span>
                </div>
              </div>
              <button className="dress-arrow" aria-label={`${name} ${S.wardrobe.next}`} onClick={() => cycle(slot, 1)}>
                <ChevronRight aria-hidden />
              </button>
            </div>
          )
        })}
        <button className={draft.raincoat ? 'dress-toggle on' : 'dress-toggle'} aria-pressed={draft.raincoat} onClick={toggleRaincoat}>
          {ICONS.raincoat} {S.wardrobe.raincoat}
        </button>
        <div className="wardrobe-buttons">
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'close' })}>
            {S.hud.close}
          </button>
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'dress', outfit: draft })}>
            {S.wardrobe.wear}
          </button>
        </div>
        <div className="wardrobe-tip">{S.wardrobe.tip}</div>
      </div>
    </>
  )
}
