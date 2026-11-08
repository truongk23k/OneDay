import { S } from '../strings'

export type Line = { from: 'em' | 'anh'; text: string }
export type Reply = { text: string; mood: number; answer: string }
export type Beat = { id: string; at: number; msg: string | null; replies: readonly Reply[] }

// Kịch bản nhắn tin buổi sáng với Em ❤️ (phút trong game). msg null = dùng gợi ý cách mặc của hôm nay.
const C = S.chat
export const BEATS: Beat[] = [
  { id: 'wake', at: 453, msg: C.wake.msg, replies: C.wake.replies },
  { id: 'hint', at: 458, msg: null, replies: C.hint.replies },
  { id: 'when', at: 464, msg: C.when.msg, replies: C.when.replies },
  { id: 'helmet', at: 470, msg: C.helmet.msg, replies: C.helmet.replies },
]

export const ESCALATE_AFTER = 6
export const ESCALATE_MOOD = -8

export type ChatState = {
  log: Line[]
  next: number
  pending: number | null
  waitingSince: number
  escalated: boolean
  unread: number
}

export const newChat = (): ChatState => ({ log: [], next: 0, pending: null, waitingSince: 0, escalated: false, unread: 0 })

// Gọi theo nhịp đồng hồ: Em gửi tin đúng giờ, để lâu không trả lời thì nhắn "??" một lần.
export function chatTick(c: ChatState, minutes: number, hintText: string): { chat: ChatState; moodDelta: number } {
  if (c.pending === null && c.next < BEATS.length && minutes >= BEATS[c.next].at) {
    const beat = BEATS[c.next]
    return {
      chat: {
        ...c,
        log: [...c.log, { from: 'em', text: beat.msg ?? hintText }],
        pending: c.next,
        next: c.next + 1,
        waitingSince: minutes,
        escalated: false,
        unread: c.unread + 1,
      },
      moodDelta: 0,
    }
  }
  if (c.pending !== null && !c.escalated && minutes - c.waitingSince >= ESCALATE_AFTER) {
    return {
      chat: { ...c, log: [...c.log, { from: 'em', text: '??' }], escalated: true, unread: c.unread + 1 },
      moodDelta: ESCALATE_MOOD,
    }
  }
  return { chat: c, moodDelta: 0 }
}

export function chatReply(c: ChatState, index: number): { chat: ChatState; moodDelta: number; beatId: string | null } {
  if (c.pending === null) return { chat: c, moodDelta: 0, beatId: null }
  const beat = BEATS[c.pending]
  const r = beat.replies[index]
  if (!r) return { chat: c, moodDelta: 0, beatId: null }
  return {
    chat: {
      ...c,
      log: [...c.log, { from: 'anh', text: r.text }, { from: 'em', text: r.answer }],
      pending: null,
    },
    moodDelta: r.mood,
    beatId: beat.id,
  }
}

export const chatSeen = (c: ChatState): ChatState => (c.unread ? { ...c, unread: 0 } : c)
