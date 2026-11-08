import { format } from '../story/clock'
import type { Tasks } from '../story/state'
import { newSeed, useStory } from '../story/store'
import { S } from '../strings'

const TASK_KEYS: (keyof Tasks)[] = ['brushed', 'washed', 'dressed', 'texted', 'keys', 'helmets']

// Thẻ kết thúc: ngủ quên, hoặc tổng kết buổi sáng khi đã ra khỏi phòng.
export function EndCard() {
  const s = useStory((st) => st.s)
  const dispatch = useStory((st) => st.dispatch)
  if (s.phase !== 'overslept' && s.phase !== 'left') return null
  const restart = () => dispatch({ type: 'restart', seed: newSeed() })
  return (
    <div className="overlay-backdrop">
      <div className="card end-card">
        {s.phase === 'overslept' ? (
          <>
            <h2>{S.end.oversleptTitle}</h2>
            <p>{S.end.oversleptBody}</p>
          </>
        ) : (
          <>
            <h2>
              {S.end.leftTitle} <span className="end-time">{format(s.minutes)}</span>
            </h2>
            <div className="stats">
              <div>
                {S.end.hygiene} <strong>{Math.round(s.hygiene)}</strong>
              </div>
              <div>
                {S.end.mood} <strong>{Math.round(s.mood)}</strong>
              </div>
            </div>
            <ul className="hud-tasks end-tasks">
              {TASK_KEYS.map((k) => {
                const done = k === 'helmets' ? s.tasks.helmets === 2 : s.tasks[k] === true
                return (
                  <li key={k} className={done ? 'done' : ''}>
                    <span className="tick">{done ? '✓' : '✗'}</span>
                    {S.tasks[k]}
                  </li>
                )
              })}
            </ul>
            <p>{S.end.leftNote}</p>
          </>
        )}
        <button className="btn btn-primary btn-block" onClick={restart}>
          {S.end.restart}
        </button>
      </div>
    </div>
  )
}
