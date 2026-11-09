import { S } from '../strings'
import { EM_DEADLINE, GAME_START, STREET_SPEED, advance } from './clock'
import { chatReply, chatSeen, chatTick, newChat, type ChatState } from './chat'
import { HINTS, outfitVerdict } from './outfit'
import { mulberry32, pick } from './rng'

export type Phase = 'alarm' | 'room' | 'street' | 'overslept'
// Ngoài đường: đi đón Em (Màn 3) → chở Em đi làm (Màn 4) → nước rút một mình (Màn 5) → tới công ty.
export type Stage = 'toEm' | 'withEm' | 'sprint' | 'done'
const STAGE_ORDER: Stage[] = ['toEm', 'withEm', 'sprint', 'done']
export type Overlay = null | 'brush' | 'wash' | 'wardrobe' | 'phone' | 'door' | 'computer'
export type Weather = 'sun' | 'rain'
export type Outfit = { top: string; bottom: string; shoes: string; raincoat: boolean }

export const KEY_SPOTS = ['bed', 'wardrobe', 'fridge', 'deskMine', 'kitchen', 'shelf'] as const
export const PYJAMAS: Outfit = { top: 'pyjama', bottom: 'floral', shoes: 'honeycomb', raincoat: false }
// Ngủ tới 8:15 là không kịp gì nữa.
export const OVERSLEEP_AT = 495
// Tiền tính bằng nghìn đồng. Phạt CSGT (trò chơi, không phải biểu phí thật).
export const START_MONEY = 5000
export const FINES = { redLight: 4000, wheelie: 8000, helmet: 400 } as const
export const FOOD_PRICE = 35
const GRAB_HURT = 5
export type PoliceReason = keyof typeof FINES
// Trễ hơn giờ đã hứa quá mức này thì Em dỗi.
const PROMISE_GRACE = 2
// Tới gọi Em sau 8:30 thì Em dỗi.
const LATE_CALL = 510
const NO_TEXT_DELAY = 4

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
  stage: Stage
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
  // Thả Em ở chỗ làm sau 8:45.
  emDropLate: boolean
  // Ví (nghìn đồng), tổng tiền phạt, số lần bị CSGT tóm.
  money: number
  fines: number
  busts: number
  // Điện thoại: giờ đã hứa qua đón, đã gọi Sếp xin phép, đã đặt đồ ăn sáng cho Em, đã gọi Em buổi sáng.
  promise: number | null
  warnedBoss: boolean
  breakfast: boolean
  calledEm: boolean
  // Đã thử đặt GrapBike cho Em (Em từ chối), đã thả tim bài của Em trên Face bút.
  triedGrab: boolean
  // Số trận Liên Quậy đã chơi sáng nay.
  matches: number
  likedEm: boolean
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
  | { type: 'stage'; to: Stage }
  | { type: 'pickup' }
  | { type: 'dropoff' }
  | { type: 'arrive' }
  | { type: 'rideEvent'; kind: 'crash' | 'hardBrake' | 'pothole' | 'redLight' | 'wheelie' }
  | { type: 'chased'; reason: PoliceReason }
  | { type: 'busted'; reason: PoliceReason; fled: boolean }
  | { type: 'escaped' }
  | { type: 'emAnswers' }
  | { type: 'orderFood' }
  | { type: 'callBoss' }
  | { type: 'callEm' }
  | { type: 'scroll' }
  | { type: 'grabForEm' }
  | { type: 'likeEmPost' }
  | { type: 'matchEnd'; won: boolean }
  | { type: 'drink' }
  | { type: 'pullup' }
  | { type: 'pee' }
  | { type: 'poop' }
  | { type: 'cook' }
  | { type: 'bathe' }
  | { type: 'flex' }
  | { type: 'nap' }
  | { type: 'chatSeen' }
  | { type: 'clearLine' }
  | { type: 'restart'; seed: number }

export function initialState(seed: number): StoryState {
  const rnd = mulberry32(seed)
  return {
    seed,
    phase: 'alarm',
    stage: 'toEm',
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
    emDropLate: false,
    money: START_MONEY,
    fines: 0,
    busts: 0,
    promise: null,
    warnedBoss: false,
    breakfast: false,
    calledEm: false,
    triedGrab: false,
    matches: 0,
    likedEm: false,
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
      if (s.phase === 'street') return s.stage === 'done' ? s : { ...s, minutes: advance(s.minutes, a.realDt, STREET_SPEED) }
      if (s.phase !== 'room') return s
      const minutes = advance(s.minutes, a.realDt)
      const { chat, moodDelta } = chatTick(s.chat, minutes, hintText(s))
      return chat === s.chat ? { ...s, minutes } : { ...s, minutes, chat, mood: clamp100(s.mood + moodDelta) }
    }
    case 'chatReply': {
      const r = chatReply(s.chat, a.index)
      if (r.chat === s.chat) return s
      const texted = s.tasks.texted || r.beatId === 'when'
      const promise = r.beatId === 'when' ? (r.promise ?? null) : s.promise
      return { ...s, chat: r.chat, mood: clamp100(s.mood + r.moodDelta), tasks: { ...s.tasks, texted }, promise }
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
    case 'leave': {
      // Ra khỏi nhà cần: chìa khóa xe, đã đánh răng và rửa mặt.
      const t = s.tasks
      if (!t.keys) return { ...s, line: S.story.needKeys }
      if (!t.brushed || !t.washed) return { ...s, line: !t.brushed && !t.washed ? S.story.needFresh : !t.brushed ? S.story.needBrush : S.story.needWash }
      return { ...s, phase: 'street', stage: 'toEm', overlay: null, line: null }
    }
    case 'pickup': {
      if (s.phase !== 'street' || s.stage !== 'toEm') return s
      // Em lên xe: soi mũ bảo hiểm, bộ đồ, chuyện ướt mưa.
      let mood = s.mood
      let hygiene = s.hygiene
      let line: string = S.ride.pickupHappy
      const verdict = outfitVerdict(s.outfit, s.weather)
      if (verdict.disaster) {
        mood -= 5
        line = verdict.emComment ?? line
      }
      if (HINTS[s.hint].match(s.outfit)) {
        mood += 5
        if (!verdict.disaster) line = S.ride.hintMatch
      }
      if (verdict.wetRisk) {
        hygiene -= 15
        mood -= 3
        line = S.ride.wet
      }
      if (s.promise !== null && s.minutes > s.promise + PROMISE_GRACE) {
        mood -= 8
        line = S.ride.brokePromise
      }
      if (s.tasks.helmets < 2) {
        mood -= 15
        line = S.ride.noHelmet
      }
      return { ...s, stage: 'withEm', mood: clamp100(mood), hygiene: clamp100(hygiene), line }
    }
    case 'dropoff': {
      if (s.phase !== 'street' || s.stage !== 'withEm') return s
      const late = s.minutes > EM_DEADLINE
      // Đồ ăn sáng Anh đặt giao tới chỗ làm: Em vui hơn (trễ thì đỡ giận một chút).
      const food = s.breakfast ? 8 : 0
      const line = late ? S.ride.dropLate : s.breakfast ? S.ride.dropBreakfast : S.ride.dropOnTime
      return { ...s, stage: 'sprint', mood: clamp100(s.mood + (late ? -20 : 5) + food), emDropLate: late, line }
    }
    case 'arrive':
      if (s.phase !== 'street' || s.stage !== 'sprint') return s
      return { ...s, stage: 'done', line: S.ride.arrive }
    case 'rideEvent': {
      const withEm = s.stage === 'withEm'
      const cost = { crash: 10, hardBrake: 3, pothole: 5, redLight: 5, wheelie: 8 }[a.kind]
      const lines = {
        crash: withEm ? S.ride.crashWithEm : S.ride.crashAlone,
        hardBrake: S.ride.hardBrake,
        pothole: S.ride.pothole,
        redLight: S.ride.redLight,
        wheelie: withEm ? S.ride.wheelieWithEm : S.ride.wheelieAlone,
      }
      // Đi một mình: chỉ đâm xe và bốc đầu là có câu thoại, không ai giận.
      if (!withEm) return a.kind === 'crash' || a.kind === 'wheelie' ? { ...s, line: lines[a.kind] } : s
      return { ...s, mood: clamp100(s.mood - cost), line: lines[a.kind] }
    }
    case 'chased':
      return { ...s, mood: clamp100(s.mood - (s.stage === 'withEm' ? 4 : 0)), line: S.police.chase[a.reason] }
    case 'busted': {
      const fine = FINES[a.reason]
      const scare = s.stage === 'withEm' ? (a.fled ? 15 : 8) : 0
      return {
        ...s,
        minutes: s.minutes + (a.fled ? 8 : 4),
        money: s.money - fine,
        fines: s.fines + fine,
        busts: s.busts + 1,
        mood: clamp100(s.mood - scare),
        line: S.police.busted[a.reason],
      }
    }
    case 'escaped':
      return { ...s, mood: clamp100(s.mood - (s.stage === 'withEm' ? 6 : 0)), line: S.police.escaped }
    case 'emAnswers': {
      // Em nghe máy ở nhà: chưa được nhắn trước thì phải sửa soạn thêm mấy phút.
      if (!s.tasks.texted) return { ...s, minutes: s.minutes + NO_TEXT_DELAY, mood: clamp100(s.mood - 5), line: S.ride.callNoText }
      return { ...s, line: s.minutes > LATE_CALL ? S.ride.callLate : S.ride.callAnswer }
    }
    case 'orderFood':
      if (s.breakfast) return s
      return { ...s, breakfast: true, money: s.money - FOOD_PRICE, minutes: s.minutes + 1 }
    case 'callBoss':
      return { ...s, warnedBoss: true, minutes: s.minutes + 1 }
    case 'callEm':
      if (s.calledEm) return { ...s, minutes: s.minutes + 1 }
      return { ...s, calledEm: true, mood: clamp100(s.mood + 3), minutes: s.minutes + 1 }
    case 'scroll':
      return { ...s, minutes: s.minutes + 1 }
    case 'grabForEm':
      // Em không chịu đi Grap: Anh phải tự qua đón. Thử lần đầu thì Em dỗi nhẹ.
      if (s.triedGrab) return { ...s, line: S.phone.grab.bikeLine }
      return { ...s, triedGrab: true, mood: clamp100(s.mood - GRAB_HURT), line: S.phone.grab.bikeLine }
    case 'matchEnd':
      // Trận đầu tiên Em biết là Anh chơi game buổi sáng: dỗi nhẹ.
      return {
        ...s,
        matches: s.matches + 1,
        mood: clamp100(s.mood - (s.matches === 0 ? 4 : 0)),
        line: a.won ? S.phone.moba.lineWin : S.phone.moba.lineLose,
      }
    case 'likeEmPost':
      return s.likedEm ? s : { ...s, likedEm: true, mood: clamp100(s.mood + 2) }
    case 'stage': {
      // Chỉ được đi tiếp đúng một bước theo thứ tự.
      const next = STAGE_ORDER[STAGE_ORDER.indexOf(s.stage) + 1]
      return s.phase === 'street' && a.to === next ? { ...s, stage: a.to } : s
    }
    case 'pee':
      return { ...s, minutes: s.minutes + 1, line: S.story.pee }
    case 'poop': {
      const lines = S.story.poop
      return { ...s, minutes: s.minutes + 3, line: lines[Math.floor(s.minutes) % lines.length] }
    }
    case 'cook':
      return { ...s, minutes: s.minutes + 3, line: S.story.cook }
    case 'pullup':
      return { ...s, minutes: s.minutes + 1, line: S.story.pullup }
    case 'bathe':
      return { ...s, minutes: s.minutes + 3, hygiene: clamp100(s.hygiene + 10), line: S.story.bathe }
    case 'flex': {
      const lines = S.story.flex
      return { ...s, minutes: s.minutes + 0.5, line: lines[Math.floor(s.minutes * 2) % lines.length] }
    }
    case 'nap':
      return { ...s, minutes: s.minutes + 3, line: S.story.nap }
    case 'drink':
      return { ...s, minutes: s.minutes + 1, line: S.story.drink }
    case 'say':
      return { ...s, line: a.line }
    case 'clearLine':
      return { ...s, line: null }
    case 'restart':
      return initialState(a.seed)
  }
}
