import { newSeed, useStory } from '../story/store'
import { S } from '../strings'

// Thẻ kết thúc. M2: chỉ có "Ngủ quên"; các kết thúc khác thêm ở bước sau.
export function EndCard() {
  const phase = useStory((st) => st.s.phase)
  const dispatch = useStory((st) => st.dispatch)
  if (phase !== 'overslept') return null
  return (
    <div className="overlay-backdrop">
      <div className="card">
        <h2>{S.end.oversleptTitle}</h2>
        <p>{S.end.oversleptBody}</p>
        <button className="btn btn-primary btn-block" onClick={() => dispatch({ type: 'restart', seed: newSeed() })}>
          {S.end.restart}
        </button>
      </div>
    </div>
  )
}
