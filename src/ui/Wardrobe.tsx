import { useEffect } from 'react'
import { HINTS, ICONS, itemLabel } from '../story/outfit'
import { useStory } from '../story/store'
import { useDraft } from '../story/wardrobeDraft'
import { S } from '../strings'

// Bảng chữ khi tủ đồ đang mở: gợi ý của Em ở trên, bộ đang chọn + nút "Mặc"/"Đóng" ở dưới.
// Quần áo thật được chọn bằng cách bấm vào chúng trong cảnh 3D (WardrobeScene).
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
  return (
    <>
      <div className="wardrobe-top">
        <div className="em-bubble">
          <span className="em-name">{S.wardrobe.hintFrom}</span> {S.wardrobe.hints[HINTS[hint].id]}
        </div>
        {weather === 'rain' && <p className="game-line">{S.wardrobe.rainHint}</p>}
        {junkLine && <p className="game-line">{junkLine}</p>}
      </div>
      <div className="wardrobe-bottom">
        <div className="picked">
          {ICONS[draft.top]} {itemLabel(draft.top)} · {ICONS[draft.bottom]} {itemLabel(draft.bottom)} · {ICONS[draft.shoes]}{' '}
          {itemLabel(draft.shoes)}
          {draft.raincoat && ` · ${ICONS.raincoat} ${S.wardrobe.raincoat}`}
        </div>
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
