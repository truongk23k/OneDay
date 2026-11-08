import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { format } from '../story/clock'
import { actionsFor, nearestInteractable, player } from '../story/interact'
import type { Tasks } from '../story/state'
import { useStory } from '../story/store'
import { S } from '../strings'

export function Clock() {
  const minute = useStory((st) => Math.floor(st.s.minutes))
  const weather = useStory((st) => st.s.weather)
  return (
    <div className="hud-clock">
      <div className="hud-time">
        {format(minute)} <span className="hud-weather">{weather === 'rain' ? '🌧️' : '☀️'}</span>
      </div>
      <div className="hud-deadlines">{S.hud.deadlines}</div>
    </div>
  )
}

const TASK_KEYS: (keyof Tasks)[] = ['brushed', 'washed', 'dressed', 'texted', 'keys', 'helmets']

export function Checklist() {
  const tasks = useStory((st) => st.s.tasks)
  return (
    <ul className="hud-tasks">
      {TASK_KEYS.map((k) => {
        const done = k === 'helmets' ? tasks.helmets === 2 : tasks[k] === true
        return (
          <li key={k} className={done ? 'done' : ''}>
            <span className="tick">{done ? '✓' : '○'}</span>
            {S.tasks[k]}
          </li>
        )
      })}
    </ul>
  )
}

// Nút / gợi ý tương tác với đồ vật đang đứng gần. Phím E (hoặc Space) chạy lựa chọn đầu tiên.
export function InteractPrompt({ targetId, isTouch }: { targetId: string | null; isTouch: boolean }) {
  const tasks = useStory((st) => st.s.tasks)
  const searched = useStory((st) => st.s.searched)
  const dispatch = useStory((st) => st.dispatch)
  const options = targetId ? actionsFor(targetId, { tasks, searched }) : []

  useEffect(() => {
    if (!options.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' && e.code !== 'Space') return
      if (useGame.getState().paused || useStory.getState().s.overlay) return
      e.preventDefault()
      dispatch(options[0].action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, dispatch])

  if (!options.length) return null
  return (
    <div className={isTouch ? 'hud-actions touch' : 'hud-actions'}>
      {options.map((o, i) => (
        <button key={o.label} className="btn btn-action" onClick={() => dispatch(o.action)}>
          {!isTouch && i === 0 && <kbd>{S.hud.pressE}</kbd>}
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Hỏi vị trí Anh 10 lần mỗi giây để biết đang đứng gần đồ vật nào.
function useNearestTarget(active: boolean) {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => {
    if (!active) {
      setId(null)
      return
    }
    const timer = setInterval(() => setId(nearestInteractable(player)?.id ?? null), 100)
    return () => clearInterval(timer)
  }, [active])
  return id
}

function Toast() {
  const line = useStory((st) => st.s.line)
  const phase = useStory((st) => st.s.phase)
  const dispatch = useStory((st) => st.dispatch)
  useEffect(() => {
    if (!line || phase !== 'room') return
    const timer = setTimeout(() => dispatch({ type: 'clearLine' }), 2600)
    return () => clearTimeout(timer)
  }, [line, phase, dispatch])
  if (!line || phase !== 'room') return null
  return <div className="toast">{line}</div>
}

export function Hud({ isTouch }: { isTouch: boolean }) {
  const phase = useStory((st) => st.s.phase)
  const overlay = useStory((st) => st.s.overlay)
  const targetId = useNearestTarget(phase === 'room' && overlay === null)
  if (phase !== 'room') return null
  return (
    <>
      <Clock />
      <Checklist />
      <Toast />
      {overlay === null && <InteractPrompt targetId={targetId} isTouch={isTouch} />}
    </>
  )
}
