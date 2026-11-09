import { BEATS, chatReply, chatSeen, chatTick, newChat } from './chat'
import { initialState, reducer, type StoryState } from './state'

const HINT = 'Hôm nay mặc áo trắng đôi với em nha 🤍'

test('nothing arrives before the first message time', () => {
  const { chat } = chatTick(newChat(), 452.9, HINT)
  expect(chat.log).toHaveLength(0)
})

test('message arrives at its time and counts as unread', () => {
  const { chat } = chatTick(newChat(), BEATS[0].at, HINT)
  expect(chat.log).toEqual([{ from: 'em', text: 'Dậy chưa anh? 😴' }])
  expect(chat.pending).toBe(0)
  expect(chat.unread).toBe(1)
})

test('unanswered message escalates once, not every frame', () => {
  let chat = chatTick(newChat(), BEATS[0].at, HINT).chat
  let mood = 0
  for (let m = BEATS[0].at; m < BEATS[0].at + 12; m += 0.05) {
    const r = chatTick(chat, m, HINT)
    chat = r.chat
    mood += r.moodDelta
  }
  expect(chat.log.filter((l) => l.text === '??')).toHaveLength(1)
  expect(mood).toBe(-8)
})

test('the next message waits until the current one is answered', () => {
  const chat = chatTick(newChat(), BEATS[0].at, HINT).chat
  const later = chatTick(chat, BEATS[1].at + 1, HINT).chat
  expect(later.log.filter((l) => l.from === 'em' && l.text !== '??')).toHaveLength(1)
})

test('reply applies mood and advances, Em answers back', () => {
  const chat = chatTick(newChat(), BEATS[0].at, HINT).chat
  const r = chatReply(chat, 0)
  expect(r.moodDelta).toBe(BEATS[0].replies[0].mood)
  expect(r.chat.pending).toBeNull()
  expect(r.chat.log.slice(-2)).toEqual([
    { from: 'anh', text: BEATS[0].replies[0].text },
    { from: 'em', text: BEATS[0].replies[0].answer },
  ])
})

test('the dress-hint message uses today’s hint', () => {
  let chat = chatTick(newChat(), BEATS[0].at, HINT).chat
  chat = chatReply(chat, 0).chat
  chat = chatTick(chat, BEATS[1].at, HINT).chat
  expect(chat.log.at(-1)).toEqual({ from: 'em', text: HINT })
})

test('opening the phone clears the unread count', () => {
  const chat = chatTick(newChat(), BEATS[0].at, HINT).chat
  expect(chatSeen(chat).unread).toBe(0)
})

describe('in the story', () => {
  const room = (): StoryState => ({ ...initialState(1), phase: 'room' })

  test('the clock delivers Em’s messages', () => {
    const s = reducer({ ...room(), minutes: BEATS[0].at - 0.01 }, { type: 'tick', realDt: 1 })
    expect(s.chat.unread).toBe(1)
  })

  test('answering “when are you coming” completes the texting task', () => {
    let s: StoryState = room()
    for (let i = 0; i < 3; i++) {
      s = { ...s, minutes: BEATS[i].at }
      s = reducer(s, { type: 'tick', realDt: 0 })
      s = reducer(s, { type: 'chatReply', index: 0 })
    }
    expect(s.tasks.texted).toBe(true)
  })

  test('a good reply lifts Em’s mood', () => {
    let s: StoryState = { ...room(), minutes: BEATS[0].at }
    s = reducer(s, { type: 'tick', realDt: 0 })
    const before = s.mood
    s = reducer(s, { type: 'chatReply', index: 0 })
    expect(s.mood).toBe(before + BEATS[0].replies[0].mood)
  })
})

describe('the morning script fits picking Em up', () => {
  const ids = BEATS.map((b) => b.id)

  test('Em texts: wake, outfit, when, helmet, then nudges if Anh has not left yet', () => {
    expect(ids).toEqual(['wake', 'hint', 'when', 'helmet', 'ready', 'late'])
    expect(BEATS.map((b) => b.at)).toEqual([...BEATS.map((b) => b.at)].sort((a, b) => a - b))
  })

  test('asking Em to go alone does not cancel the pickup: she insists Anh comes', () => {
    const when = BEATS.find((b) => b.id === 'when')!
    const alone = when.replies[2]
    expect(alone.promise).toBeUndefined()
    expect(alone.answer).toMatch(/đón/)
  })

  test('the last nudge comes before Em has to be at work', () => {
    expect(BEATS.at(-1)!.at).toBeLessThan(525)
    expect(BEATS.find((b) => b.id === 'late')!.at).toBeGreaterThanOrEqual(500)
  })
})
