import { pickEnding } from '../ride/endings'
import { format } from '../story/clock'
import type { Tasks } from '../story/state'
import { newSeed, useStory } from '../story/store'
import { S } from '../strings'

const TASK_KEYS: (keyof Tasks)[] = ['brushed', 'washed', 'dressed', 'texted', 'keys', 'helmets']

// Thẻ kết thúc: ngủ quên, hoặc tới công ty (kết thúc theo pickEnding).
export function EndCard() {
  const s = useStory((st) => st.s)
  const dispatch = useStory((st) => st.dispatch)
  const arrived = s.phase === 'street' && s.stage === 'done'
  if (s.phase !== 'overslept' && !arrived) return null
  const ending = pickEnding(s)
  const copy = S.endings[ending.id]
  const restart = () => dispatch({ type: 'restart', seed: newSeed() })
  return (
    <div className="overlay-backdrop">
      <div className="card end-card">
        <h2>{copy.title}</h2>
        {arrived && (
          <p className="end-arrived">
            {S.endings.arrived} <span className="end-time">{format(s.minutes)}</span>
          </p>
        )}
        <p>{copy.body}</p>
        {ending.emText && (
          <div className="end-bubble">
            <span className="end-bubble-name">{S.chat.contact}</span>
            <span>{S.endings.emText}</span>
          </div>
        )}
        {ending.also.map((id) => (
          <p key={id} className="end-also">
            + {S.endings[id].title}
          </p>
        ))}
        {arrived && (
          <>
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
          </>
        )}
        <button className="btn btn-primary btn-block" onClick={restart}>
          {S.end.restart}
        </button>
      </div>
    </div>
  )
}
