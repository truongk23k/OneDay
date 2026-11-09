import type { Pose } from '../player/pose'
import type { Tap } from '../room/world'
import { pickEnding } from '../ride/endings'
import type { StoryState } from '../story/state'
import { S } from '../strings'

// Âm thanh nào phát khi trạng thái game đổi (hàm thuần, dễ test); AudioDirector đem đi phát.
export type Cue =
  | 'message'
  | 'sent'
  | 'search'
  | 'keyFound'
  | 'taskDone'
  | 'wrong'
  | 'door'
  | 'switch'
  | 'fridge'
  | 'flush'
  | 'gulp'
  | 'pickup'
  | 'dropoff'
  | 'arrive'
  | 'endingGood'
  | 'endingBad'
  | 'whistle'
  | 'cash'
  | 'escaped'
  | 'phoneOpen'
  | 'phoneClose'
  | 'like'
  | 'order'
  | 'crash'
  | 'pothole'
  | 'brake'
  | 'honkedAt'
  | 'horn'
  | 'step'
  | 'click'
  | 'snooze'

export type WorldView = {
  bathDoorOpen: boolean
  lightsOn: boolean
  fridgeOpen: boolean
  stoveOn: boolean
  water: Record<Tap, boolean>
  pose: Pose | null
}

const DONE_TASKS = ['brushed', 'washed', 'dressed'] as const

export function storyCues(a: StoryState, b: StoryState): Cue[] {
  if (a === b) return []
  const out: Cue[] = []
  if (b.chat.unread > a.chat.unread) out.push('message')
  if (b.chat.log.length > a.chat.log.length && b.chat.log.slice(a.chat.log.length).some((l) => l.from === 'anh')) out.push('sent')
  if (b.searched.length > a.searched.length) out.push(b.tasks.keys && !a.tasks.keys ? 'keyFound' : 'search')
  if (DONE_TASKS.some((k) => b.tasks[k] && !a.tasks[k]) || b.tasks.helmets > a.tasks.helmets) out.push('taskDone')
  if (b.line !== a.line && (b.line === S.story.wrongTube || b.line === S.story.washFail)) out.push('wrong')
  if (b.snoozes > a.snoozes && b.phase === 'alarm') out.push('snooze')
  if (a.phase === 'room' && b.phase === 'street') out.push('door')
  if (a.stage === 'toEm' && b.stage === 'withEm') out.push('pickup')
  if (a.stage === 'withEm' && b.stage === 'sprint') out.push('dropoff')
  if (b.busts > a.busts) out.push('whistle', 'cash')
  if (b.line !== a.line && b.line === S.police.escaped) out.push('escaped')
  if (b.breakfast && !a.breakfast) out.push('order')
  if (b.likedEm && !a.likedEm) out.push('like')
  if (a.overlay !== 'phone' && b.overlay === 'phone') out.push('phoneOpen')
  if (a.overlay === 'phone' && b.overlay !== 'phone') out.push('phoneClose')
  const arrived = a.stage !== 'done' && b.stage === 'done' && b.phase === 'street'
  if (arrived) out.push('arrive')
  if (arrived || (a.phase !== 'overslept' && b.phase === 'overslept')) {
    const id = pickEnding(b).id
    out.push(id === 'perfect' || id === 'ok' ? 'endingGood' : 'endingBad')
  }
  return out
}

const POSE_CUES: Partial<Record<Pose, Cue>> = { pee: 'flush', poop: 'flush', drink: 'gulp' }

export function worldCues(a: WorldView, b: WorldView): Cue[] {
  const out: Cue[] = []
  if (a.bathDoorOpen !== b.bathDoorOpen) out.push('door')
  if (a.lightsOn !== b.lightsOn) out.push('switch')
  if (a.fridgeOpen !== b.fridgeOpen) out.push('fridge')
  if (b.pose !== a.pose && b.pose && POSE_CUES[b.pose]) out.push(POSE_CUES[b.pose]!)
  return out
}

export type Loops = {
  alarm: boolean
  ringtone: boolean
  music: 'room' | 'street' | null
  ambience: 'room' | 'street' | null
  rain: boolean
  engine: boolean
  tap: boolean
  shower: boolean
  stove: boolean
}

// Những tiếng kéo dài đang phải vang (nhạc nền, tiếng nền, máy xe, nước chảy…).
export function loopsFor(s: StoryState, w: WorldView, r: { police: boolean; ringing: boolean }): Loops {
  const inRoom = s.phase === 'room'
  const riding = s.phase === 'street' && s.stage !== 'done'
  return {
    alarm: s.phase === 'alarm',
    ringtone: r.ringing,
    music: inRoom ? 'room' : riding && !r.police ? 'street' : null,
    ambience: inRoom || s.phase === 'alarm' ? 'room' : s.phase === 'street' ? 'street' : null,
    rain: s.weather === 'rain' && s.phase !== 'overslept',
    engine: riding,
    tap: inRoom && (w.water.lavabo || w.water.sink),
    shower: inRoom && w.water.shower,
    stove: inRoom && w.stoveOn,
  }
}
