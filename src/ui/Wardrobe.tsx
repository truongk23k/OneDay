import { useEffect, useMemo, useState } from 'react'
import { HINTS, ICONS, itemById, itemLabel, wardrobePile, type PileCard } from '../story/outfit'
import type { Outfit } from '../story/state'
import { useStory } from '../story/store'
import { S } from '../strings'

const cardName = (c: PileCard) =>
  c.kind === 'item'
    ? itemLabel(c.id)
    : c.kind === 'raincoat'
      ? S.wardrobe.raincoat
      : S.wardrobe.junk[c.id as keyof typeof S.wardrobe.junk]

// Tủ đồ bừa bộn: lục tìm áo, quần, giày dép (lẫn cả đồ tào lao) theo gợi ý của Em, rồi bấm "Mặc".
export function Wardrobe() {
  const overlay = useStory((st) => st.s.overlay)
  const current = useStory((st) => st.s.outfit)
  const weather = useStory((st) => st.s.weather)
  const hint = useStory((st) => st.s.hint)
  const seed = useStory((st) => st.s.seed)
  const dispatch = useStory((st) => st.dispatch)
  const [draft, setDraft] = useState<Outfit>(current)
  const [junkLine, setJunkLine] = useState<string | null>(null)
  const pile = useMemo(() => wardrobePile(seed), [seed])

  // Mỗi lần mở tủ thì bắt đầu từ bộ đang mặc.
  useEffect(() => {
    if (overlay === 'wardrobe') {
      setDraft(current)
      setJunkLine(null)
    }
  }, [overlay, current])

  if (overlay !== 'wardrobe') return null

  const tapCard = (c: PileCard) => {
    if (c.kind === 'raincoat') return setDraft({ ...draft, raincoat: !draft.raincoat })
    if (c.kind === 'junk') {
      dispatch({ type: 'junk', id: c.id })
      return setJunkLine(S.wardrobe.junkLines[c.id as keyof typeof S.wardrobe.junkLines])
    }
    setJunkLine(null)
    setDraft({ ...draft, [itemById(c.id).slot]: c.id })
  }
  const isPicked = (c: PileCard) =>
    c.kind === 'raincoat' ? draft.raincoat : c.kind === 'item' && draft[itemById(c.id).slot] === c.id

  return (
    <div className="overlay-backdrop">
      <div className="card game wardrobe">
        <button className="card-close" aria-label="Đóng" onClick={() => dispatch({ type: 'close' })}>
          ×
        </button>
        <h2>{S.wardrobe.title}</h2>
        <div className="em-bubble">
          <span className="em-name">{S.wardrobe.hintFrom}</span> {S.wardrobe.hints[HINTS[hint].id]}
        </div>
        {weather === 'rain' && <p className="game-line">{S.wardrobe.rainHint}</p>}
        {junkLine && <p className="game-line">{junkLine}</p>}
        <div className="picked">
          {S.wardrobe.picked}: {ICONS[draft.top]} {itemLabel(draft.top)} · {ICONS[draft.bottom]} {itemLabel(draft.bottom)} ·{' '}
          {ICONS[draft.shoes]} {itemLabel(draft.shoes)}
          {draft.raincoat && ` · ${ICONS.raincoat} ${S.wardrobe.raincoat}`}
        </div>
        <div className="pile">
          {pile.map((c) => (
            <button
              key={c.id}
              className={isPicked(c) ? `pile-card selected ${c.kind}` : `pile-card ${c.kind}`}
              style={{ transform: `rotate(${c.rot}deg)` }}
              aria-label={cardName(c)}
              aria-pressed={isPicked(c)}
              onClick={() => tapCard(c)}
            >
              <span className="pile-icon">{ICONS[c.id]}</span>
              {c.kind === 'item' && <span className="swatch" style={{ background: itemById(c.id).color }} />}
              <span className="pile-name">{cardName(c)}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={() => dispatch({ type: 'dress', outfit: draft })}>
          {S.wardrobe.wear}
        </button>
      </div>
    </div>
  )
}
