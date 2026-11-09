import { useEffect } from 'react'
import { useWorld } from '../room/world'
import { useRide } from '../ride/store'
import { useStory } from '../story/store'
import { usePhone } from '../ui/phone/phoneStore'
import { player as anh } from '../story/interact'
import { isRinging, loopsFor, nearness, SOURCES, storyCues, worldCues, type WorldView } from './cues'
import { useSettings } from './engine'
import { music } from './music'
import { alarm, playCue, rain, ringtone, roomAmbience, shower, siren, stove, streetAmbience, tap, engine } from './sounds'

const SCENE_TRACK = { room: 0, street: 1 } as const

const worldView = (w: ReturnType<typeof useWorld.getState>): WorldView => ({
  bathDoorOpen: w.bathDoorOpen,
  lightsOn: w.lightsOn,
  fridgeOpen: w.fridgeOpen,
  stoveOn: w.stoveOn,
  water: w.water,
  pose: w.transient?.pose ?? null,
})

let scene: 'room' | 'street' | null = null

// Bật/tắt mọi tiếng kéo dài theo trạng thái hiện tại; đổi cảnh thì đổi bài nhạc nền.
function syncLoops() {
  const s = useStory.getState().s
  const ride = useRide.getState()
  const call = usePhone.getState().call
  const ringing = isRinging(s, ride.em, call)
  const chasing = s.phase === 'street' && s.stage !== 'done' && ride.police.mode === 'chase'
  const l = loopsFor(s, worldView(useWorld.getState()), { police: chasing, ringing })
  alarm.set(l.alarm)
  ringtone.set(l.ringtone)
  const w = useWorld.getState()
  tap.set(l.tap)
  tap.level(Math.max(w.water.lavabo ? nearness(anh, SOURCES.lavabo) : 0, w.water.sink ? nearness(anh, SOURCES.sink) : 0))
  shower.set(l.shower)
  shower.level(nearness(anh, SOURCES.shower))
  stove.set(l.stove)
  stove.level(nearness(anh, SOURCES.stove))
  rain.set(l.rain)
  roomAmbience.set(l.ambience === 'room')
  streetAmbience.set(l.ambience === 'street')
  engine.set(l.engine)
  siren.set(chasing)
  const player = music.getState()
  if (!l.music || !useSettings.getState().music) {
    if (player.playing) player.stop()
    scene = l.music
    return
  }
  // Đổi cảnh (phòng → phố) thì đổi bài; cùng cảnh thì giữ bài đang chọn trong app Nhạc.
  if (scene !== l.music || !player.playing) player.play(scene !== l.music ? SCENE_TRACK[l.music] : player.track)
  scene = l.music
}

// Không vẽ gì: nghe các store và phát âm thanh tương ứng.
export function AudioDirector() {
  useEffect(() => {
    const offStory = useStory.subscribe((st, prev) => {
      for (const c of storyCues(prev.s, st.s)) playCue(c)
      syncLoops()
    })
    const offWorld = useWorld.subscribe((w, prev) => {
      for (const c of worldCues(worldView(prev), worldView(w))) playCue(c)
      syncLoops()
    })
    const offRide = useRide.subscribe((r, prev) => {
      if (r.police.mode !== prev.police.mode || r.em !== prev.em) syncLoops()
    })
    const offPhone = usePhone.subscribe((p, prev) => {
      if (p.call !== prev.call) syncLoops()
    })
    const offSettings = useSettings.subscribe(syncLoops)
    // Bấm nút nào cũng có tiếng "tách" nhẹ (trừ bàn đạp lái xe).
    const onPress = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target.closest('button') : null
      if (el && !el.classList.contains('pedal') && !(el as HTMLButtonElement).disabled) playCue('click')
    }
    window.addEventListener('pointerdown', onPress, true)
    syncLoops()
    return () => {
      offStory()
      offWorld()
      offRide()
      offPhone()
      offSettings()
      window.removeEventListener('pointerdown', onPress, true)
    }
  }, [])
  return null
}
