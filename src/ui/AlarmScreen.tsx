import { AlarmClock, BellRing, CloudRain, Sun } from 'lucide-react'
import { format } from '../story/clock'
import { useWorld } from '../room/world'
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
          <div className="alarm-label">
            <BellRing className="alarm-bell" aria-hidden /> {S.alarm.label}
          </div>
          <div className="alarm-time">{format(minutes)}</div>
          <div className="alarm-weather">
            {weather === 'rain' ? <CloudRain aria-hidden /> : <Sun aria-hidden />}
            {weather === 'rain' ? S.alarm.rain : S.alarm.sun}
          </div>
          {line && <div className="alarm-line">{line}</div>}
          <div className="alarm-buttons">
            <button className="btn btn-ghost" onClick={() => dispatch({ type: 'snooze' })}>
              <AlarmClock aria-hidden /> {S.alarm.snooze}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                dispatch({ type: 'wake' })
                useWorld.getState().play('stretch', 2)
              }}
            >
              {S.alarm.wake}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
