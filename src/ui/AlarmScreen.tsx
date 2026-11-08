import { format } from '../story/clock'
import { useStory } from '../story/store'
import { S } from '../strings'

// Màn 1: điện thoại báo thức (dáng iPhone xanh lá, không logo).
export function AlarmScreen() {
  const phase = useStory((st) => st.s.phase)
  const minutes = useStory((st) => st.s.minutes)
  const weather = useStory((st) => st.s.weather)
  const line = useStory((st) => st.s.line)
  const dispatch = useStory((st) => st.dispatch)
  if (phase !== 'alarm') return null
  return (
    <div className="overlay-backdrop">
      <div className="phone">
        <div className="phone-screen alarm">
          <div className="alarm-label">{S.alarm.label}</div>
          <div className="alarm-time">{format(minutes)}</div>
          <div className="alarm-weather">{weather === 'rain' ? S.alarm.rain : S.alarm.sun}</div>
          {line && <div className="alarm-line">{line}</div>}
          <div className="alarm-buttons">
            <button className="btn btn-ghost" onClick={() => dispatch({ type: 'snooze' })}>
              {S.alarm.snooze}
            </button>
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'wake' })}>
              {S.alarm.wake}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
