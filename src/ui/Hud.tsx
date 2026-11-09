import { Check, ChevronDown, ChevronUp, CloudRain, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWorld } from '../room/world'
import { useGame } from '../store'
import { format } from '../story/clock'
import { actionsFor, nearestInteractable, player, type Option } from '../story/interact'
import type { Tasks } from '../story/state'
import { useStory } from '../story/store'
import { S } from '../strings'
import { DanceButton } from './DanceButton'
import { QuestGlyph } from './GameIcons'
import { PhoneButton } from './Phone'

export function Clock() {
  const minute = useStory((st) => Math.floor(st.s.minutes))
  const weather = useStory((st) => st.s.weather)
  return (
    <div className="hud-panel hud-clock">
      <div className="hud-time">
        <span>{format(minute)}</span>
        {weather === 'rain' ? <CloudRain className="hud-weather rain" aria-hidden /> : <Sun className="hud-weather sun" aria-hidden />}
      </div>
      <div className="hud-deadlines">{S.hud.deadlines}</div>
    </div>
  )
}

// Ba việc bắt buộc mới ra được cửa; ba việc nên làm thêm.
export const REQUIRED: (keyof Tasks)[] = ['brushed', 'washed', 'keys']
const OPTIONAL: (keyof Tasks)[] = ['dressed', 'texted', 'helmets']
const TASK_COUNT = REQUIRED.length + OPTIONAL.length

// Bảng nhiệm vụ buổi sáng kiểu game: thanh tiến độ, nhóm bắt buộc / nên làm; chạm tiêu đề để thu gọn.
export function Checklist() {
  const tasks = useStory((st) => st.s.tasks)
  const [open, setOpen] = useState(true)
  const done = (k: keyof Tasks) => (k === 'helmets' ? tasks.helmets === 2 : tasks[k] === true)
  const count = [...REQUIRED, ...OPTIONAL].filter(done).length
  const ready = REQUIRED.every(done)
  const row = (k: keyof Tasks, required: boolean) => (
    <li key={k} className={done(k) ? 'done' : required ? 'req' : ''}>
      <span className="quest-dot" aria-hidden>
        {done(k) ? <Check /> : required ? '!' : null}
      </span>
      <span className="quest-text">{S.tasks[k]}</span>
    </li>
  )
  return (
    <div className="hud-panel quest">
      <button className="quest-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <QuestGlyph />
        <span className="quest-title">{S.hud.todo}</span>
        <span className="quest-count">
          {count}/{TASK_COUNT}
        </span>
        {open ? <ChevronUp className="quest-chev" aria-hidden /> : <ChevronDown className="quest-chev" aria-hidden />}
      </button>
      <div className="quest-bar" role="progressbar" aria-label={S.hud.todo} aria-valuemin={0} aria-valuemax={TASK_COUNT} aria-valuenow={count}>
        <span style={{ width: `${(count / TASK_COUNT) * 100}%` }} />
      </div>
      {open && (
        <>
          <div className={ready ? 'quest-group ok' : 'quest-group'}>{ready ? S.hud.ready : S.hud.required}</div>
          <ul>{REQUIRED.map((k) => row(k, true))}</ul>
          <div className="quest-group soft">{S.hud.optional}</div>
          <ul>{OPTIONAL.map((k) => row(k, false))}</ul>
        </>
      )}
    </div>
  )
}

const KEY_JUMP = 1.6

// Nút / gợi ý tương tác với đồ vật đang đứng gần. Phím E (hoặc Space) chạy lựa chọn đầu tiên.
export function InteractPrompt({ targetId, isTouch }: { targetId: string | null; isTouch: boolean }) {
  const tasks = useStory((st) => st.s.tasks)
  const searched = useStory((st) => st.s.searched)
  const dispatch = useStory((st) => st.dispatch)
  const bathDoorOpen = useWorld((w) => w.bathDoorOpen)
  const water = useWorld((w) => w.water)
  const lightsOn = useWorld((w) => w.lightsOn)
  const fridgeOpen = useWorld((w) => w.fridgeOpen)
  const sitting = useWorld((w) => w.sitting)
  const stoveOn = useWorld((w) => w.stoveOn)
  const options = targetId ? actionsFor(targetId, { tasks, searched }, { bathDoorOpen, water, lightsOn, fridgeOpen, sitting, stoveOn }) : []

  const run = (o: Option) => {
    const a = o.action
    const w = useWorld.getState()
    if (a.type !== 'world') {
      // Động tác đi kèm một số việc.
      if (a.type === 'drink') w.play('drink', 1.6)
      if (a.type === 'toilet') w.play('squat', 2.2)
      if (a.type === 'pee') w.play('pee', 3)
      if (a.type === 'poop') w.play('poop', 4.5)
      if (a.type === 'cook') {
        if (!w.stoveOn) w.toggleStove()
        w.play('cook', 4.5)
      }
      if (a.type === 'pullup') w.play('pullup', 3.5)
      if (a.type === 'flex') w.play('flex', 2.5)
      if (a.type === 'nap') w.play('lie', 3.5)
      if (a.type === 'bathe') {
        if (!w.water.shower) w.toggleWater('shower')
        w.play('bathe', 3.5)
      }
      const hadKeys = useStory.getState().s.tasks.keys
      dispatch(a)
      // Thấy chìa khóa: giơ lên tay và nhảy cẫng một cái.
      if (a.type === 'search' && !hadKeys && useStory.getState().s.tasks.keys) w.play('keyJump', KEY_JUMP)
      return
    }
    if (a.do === 'door') {
      if (!w.toggleDoor(player)) dispatch({ type: 'say', line: S.story.doorBlocked })
    }
    else if (a.do === 'lights') w.toggleLights()
    else if (a.do === 'fridge') w.toggleFridge()
    else if (a.do === 'stove') w.toggleStove()
    else if (a.do === 'sit') w.setSitting(true)
    else if (a.do === 'stand') w.setSitting(false)
    else w.toggleWater(a.do)
  }

  useEffect(() => {
    if (!options.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' && e.code !== 'Space') return
      // Giữ phím không được lặp lại hành động (đi vệ sinh, ra khỏi phòng…).
      if (e.repeat) return
      if (useGame.getState().paused || useStory.getState().s.overlay) return
      e.preventDefault()
      run(options[0])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!options.length) return null
  return (
    <div className={isTouch ? 'hud-actions touch' : 'hud-actions'}>
      {options.map((o, i) => (
        <button key={o.label} className="btn btn-action" onClick={() => run(o)}>
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
  const paused = useGame((g) => g.paused)
  const dispatch = useStory((st) => st.dispatch)
  // Tạm dừng (mở hướng dẫn) thì câu thoại đứng lại, không tự tắt.
  useEffect(() => {
    if (!line || phase !== 'room' || paused) return
    const timer = setTimeout(() => dispatch({ type: 'clearLine' }), 2800)
    return () => clearTimeout(timer)
  }, [line, phase, paused, dispatch])
  if (!line || phase !== 'room') return null
  return <div className="toast">{line}</div>
}

export function Hud({ isTouch }: { isTouch: boolean }) {
  const phase = useStory((st) => st.s.phase)
  const overlay = useStory((st) => st.s.overlay)
  const targetId = useNearestTarget(phase === 'room' && overlay === null)
  if (phase !== 'room') return null
  const wardrobe = overlay === 'wardrobe'
  return (
    <>
      {!wardrobe && (
        <div className="hud-stack hud-tl">
          <Checklist />
        </div>
      )}
      <div className="hud-stack hud-tc">
        {!wardrobe && <Clock />}
        <Toast />
      </div>
      {!wardrobe && (
        <div className="hud-tr">
          {overlay === null && <DanceButton />}
          <PhoneButton />
        </div>
      )}
      {overlay === null && <InteractPrompt targetId={targetId} isTouch={isTouch} />}
    </>
  )
}
