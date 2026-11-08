import { S } from '../strings'
import { GAME_START, advance } from './clock'
import { chatReply, chatSeen, chatTick, newChat, type ChatState } from './chat'
import { HINTS, outfitVerdict } from './outfit'
import { mulberry32, pick } from './rng'

export type Phase = 'alarm' | 'room' | 'left' | 'overslept'
export type Overlay = null | 'brush' | 'wash' | 'wardrobe' | 'phone' | 'door'
export type Weather = 'sun' | 'rain'
export type Outfit = { top: string; bottom: string; shoes: string; raincoat: boolean }

export const KEY_SPOTS = ['bed', 'wardrobe', 'fridge', 'deskMine', 'kitchen', 'shelf'] as const
export const PYJAMAS: Outfit = { top: 'pyjama', bottom: 'floral', shoes: 'honeycomb', raincoat: false }
export const OVERSLEEP_AT = 480

export type Tasks = {
  brushed: boolean
  washed: boolean
  dressed: boolean
  texted: boolean
  keys: boolean
  helmets: 0 | 1 | 2
}

export type StoryState = {
  seed: number
  phase: Phase
  overlay: Overlay
  minutes: number
  snoozes: number
  weather: Weather
  hygiene: number
  mood: number
  tasks: Tasks
  outfit: Outfit
  keySpot: string
  pasteFirst: boolean
  hint: number
  searched: string[]
  chat: ChatState
  line: string | null
}

export type Action =
  | { type: 'wake' }
  | { type: 'snooze' }
  | { type: 'tick'; realDt: number }
  | { type: 'open'; overlay: Exclude<Overlay, null> }
  | { type: 'close' }
  | { type: 'wrongTube' }
  | { type: 'brushDone' }
  | { type: 'washFail' }
  | { type: 'washDone' }
  | { type: 'search'; id: string }
  | { type: 'dress'; outfit: Outfit }
  | { type: 'toilet' }
  | { type: 'junk'; id: string }
  | { type: 'chatReply'; index: number }
  | { type: 'takeHelmets'; n: 1 | 2 }
  | { type: 'leave' }
  | { type: 'say'; line: string }
  | { type: 'chatSeen' }
  | { type: 'clearLine' }
  | { type: 'restart'; seed: number }

export function initialState(seed: number): StoryState {
  const rnd = mulberry32(seed)
  return {
    seed,
    phase: 'alarm',
    overlay: null,
    minutes: GAME_START,
    snoozes: 0,
    weather: rnd() < 0.4 ? 'rain' : 'sun',
    hygiene: 20,
    mood: 60,
    tasks: { brushed: false, washed: false, dressed: false, texted: false, keys: false, helmets: 0 },
    outfit: PYJAMAS,
    keySpot: pick(KEY_SPOTS, rnd),
    pasteFirst: rnd() < 0.5,
    hint: Math.floor(rnd() * HINTS.length),
    searched: [],
    chat: newChat(),
    line: null,
  }
}

const hintText = (s: StoryState) => S.wardrobe.hints[HINTS[s.hint].id]

const clamp100 = (v: number) => Math.max(0, Math.min(100, v))

export function reducer(s: StoryState, a: Action): StoryState {
  switch (a.type) {
    case 'wake':
      return s.phase === 'alarm' ? { ...s, phase: 'room', line: null } : s
    case 'snooze': {
      if (s.phase !== 'alarm') return s
      const minutes = s.minutes + 5
      const line = S.story.snooze[s.snoozes % S.story.snooze.length]
      return { ...s, minutes, snoozes: s.snoozes + 1, line, phase: minutes >= OVERSLEEP_AT ? 'overslept' : 'alarm' }
    }
    case 'tick': {
      if (s.phase !== 'room') return s
      const minutes = advance(s.minutes, a.realDt)
      const { chat, moodDelta } = chatTick(s.chat, minutes, hintText(s))
      return chat === s.chat ? { ...s, minutes } : { ...s, minutes, chat, mood: clamp100(s.mood + moodDelta) }
    }
    case 'chatReply': {
      const r = chatReply(s.chat, a.index)
      if (r.chat === s.chat) return s
      const texted = s.tasks.texted || r.beatId === 'when'
      return { ...s, chat: r.chat, mood: clamp100(s.mood + r.moodDelta), tasks: { ...s.tasks, texted } }
    }
    case 'chatSeen':
      return { ...s, chat: chatSeen(s.chat) }
    case 'open':
      return { ...s, overlay: a.overlay }
    case 'close':
      return { ...s, overlay: null }
    case 'wrongTube':
      return { ...s, minutes: s.minutes + 2, hygiene: clamp100(s.hygiene - 5), line: S.story.wrongTube }
    case 'brushDone':
      return { ...s, hygiene: clamp100(s.hygiene + 35), tasks: { ...s.tasks, brushed: true }, overlay: null }
    case 'washFail':
      return { ...s, minutes: s.minutes + 1, line: S.story.washFail }
    case 'washDone':
      return { ...s, hygiene: clamp100(s.hygiene + 20), tasks: { ...s.tasks, washed: true }, overlay: null }
    case 'search': {
      if (s.tasks.keys || s.searched.includes(a.id)) return s
      const searched = [...s.searched, a.id]
      const minutes = s.minutes + 1
      if (a.id === s.keySpot) return { ...s, minutes, searched, tasks: { ...s.tasks, keys: true }, line: S.story.keysFound }
      const lines = S.story.keysNotHere
      return { ...s, minutes, searched, line: lines[(searched.length - 1) % lines.length] }
    }
    case 'dress': {
      // Lần đầu mặc đồ tử tế thì thơm tho hơn; mặc đồ "thảm họa" thì không.
      const first = !s.tasks.dressed
      const bonus = first && !outfitVerdict(a.outfit, s.weather).disaster ? 15 : 0
      // Mặc đúng ý Em ngay lần đầu thì Em vui hơn.
      const moodUp = first && HINTS[s.hint].match(a.outfit) ? 10 : 0
      return {
        ...s,
        outfit: a.outfit,
        tasks: { ...s.tasks, dressed: true },
        hygiene: clamp100(s.hygiene + bonus),
        mood: clamp100(s.mood + moodUp),
        overlay: null,
      }
    }
    case 'toilet': {
      const lines = S.story.toilet
      return { ...s, minutes: s.minutes + 2, line: lines[Math.floor(s.minutes) % lines.length] }
    }
    case 'junk': {
      const line = S.wardrobe.junkLines[a.id as keyof typeof S.wardrobe.junkLines] ?? null
      return { ...s, minutes: s.minutes + 0.5, line }
    }
    case 'takeHelmets':
      return { ...s, tasks: { ...s.tasks, helmets: a.n }, line: a.n === 2 ? S.story.helmets : S.story.helmetOne }
    case 'leave':
      if (!s.tasks.keys) return { ...s, line: S.story.needKeys }
      return { ...s, phase: 'left', overlay: null, line: null }
    case 'say':
      return { ...s, line: a.line }
    case 'clearLine':
      return { ...s, line: null }
    case 'restart':
      return initialState(a.seed)
  }
}
