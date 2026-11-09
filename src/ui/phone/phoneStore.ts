import { create } from 'zustand'
import { useRide } from '../../ride/store'
import { useStory } from '../../story/store'
import { S } from '../../strings'
import { AIM_PITCH, AIM_YAW, type Aim, type Lens } from './lens'

// Điện thoại của Anh: màn hình chính với các app, và cuộc gọi đang diễn ra.
export type AppId = 'home' | 'messages' | 'call' | 'maps' | 'face' | 'grap' | 'moba' | 'weather' | 'bank' | 'music' | 'mail' | 'notes' | 'camera' | 'settings'
export type Contact = 'em' | 'boss' | 'mom'
export type Call = { who: Contact; phase: 'ringing' | 'talking'; text: string | null }

// Chuông đổ bao lâu (giây) trước khi người kia nghe máy (riêng Em ở nhà thì theo nhịp của chuyến xe).
export const RING = 1.4
// Đang chạy nhanh hơn mức này thì không cầm điện thoại được.
export const PHONE_SPEED = 1.5

type Phone = {
  app: AppId
  call: Call | null
  // App Camera: camera trước/sau, hướng ngắm (kéo trên kính ngắm), ảnh vừa chụp, đang chờ chụp.
  lens: Lens
  aim: Aim
  photo: string | null
  shoot: boolean
  flip: () => void
  aimBy: (dx: number, dy: number) => void
  go: (app: AppId) => void
  dial: (who: Contact) => void
  hangUp: () => void
  reset: () => void
}

let ringTimer: ReturnType<typeof setTimeout> | null = null
const clearRing = () => {
  if (ringTimer) clearTimeout(ringTimer)
  ringTimer = null
}

// Em nói gì khi Anh gọi (trừ lúc đứng trước cửa nhà Em — lúc đó Em ra mở cửa).
function emAnswer(): string {
  const story = useStory.getState()
  const s = story.s
  if (s.phase === 'street') {
    if (s.stage === 'toEm') return useRide.getState().em === 'home' ? S.phone.em.notThere : S.phone.em.busy
    return s.stage === 'withEm' ? S.phone.em.aboard : S.phone.em.atWork
  }
  const first = !s.calledEm
  story.dispatch({ type: 'callEm' })
  return first ? S.phone.em.room : S.phone.em.roomAgain
}

function bossAnswer(): string {
  const story = useStory.getState()
  const first = !story.s.warnedBoss
  story.dispatch({ type: 'callBoss' })
  return first ? S.phone.boss.first : S.phone.boss.again
}

export const usePhone = create<Phone>()((set, get) => ({
  app: 'home',
  call: null,
  lens: 'back',
  aim: { yaw: 0, pitch: 0 },
  photo: null,
  shoot: false,
  flip: () => set({ lens: get().lens === 'back' ? 'front' : 'back', aim: { yaw: 0, pitch: 0 } }),
  aimBy: (dx, dy) => {
    const a = get().aim
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))
    set({ aim: { yaw: clamp(a.yaw + dx, AIM_YAW), pitch: clamp(a.pitch + dy, AIM_PITCH) } })
  },
  go: (app) => set({ app }),
  dial: (who) => {
    clearRing()
    const s = useStory.getState().s
    const ride = useRide.getState()
    // Đứng trước cửa nhà Em: gọi là Em ra (chuông đổ theo đồng hồ chuyến xe, Em nghe máy trong stepRide).
    if (who === 'em' && s.phase === 'street' && s.stage === 'toEm' && ride.atEmDoor && ride.em === 'home') {
      ride.callEm()
      set({ app: 'call', call: { who, phase: 'ringing', text: null } })
      return
    }
    set({ app: 'call', call: { who, phase: 'ringing', text: null } })
    ringTimer = setTimeout(() => {
      ringTimer = null
      if (get().call?.who !== who) return
      const text = who === 'em' ? emAnswer() : who === 'boss' ? bossAnswer() : S.phone.mom
      set({ call: { who, phase: 'talking', text } })
    }, RING * 1000)
  },
  hangUp: () => {
    clearRing()
    set({ call: null })
  },
  reset: () => {
    clearRing()
    set({ app: 'home', call: null, lens: 'back', aim: { yaw: 0, pitch: 0 }, shoot: false })
  },
}))

// Mở điện thoại (về màn hình chính hoặc thẳng vào một app). Ngoài đường phải dừng xe trước.
export function openPhone(app: AppId = 'home'): boolean {
  const story = useStory.getState()
  if (story.s.phase === 'street' && Math.abs(useRide.getState().bike.speed) > PHONE_SPEED) {
    story.dispatch({ type: 'say', line: S.phone.stopFirst })
    return false
  }
  usePhone.setState({ app })
  story.dispatch({ type: 'open', overlay: 'phone' })
  return true
}

// Đang mở app Camera thì camera nào (để Anh giơ máy lên và cảnh 3D vẽ vào kính ngắm).
export function activeLens(): Lens | null {
  const p = usePhone.getState()
  return useStory.getState().s.overlay === 'phone' && p.app === 'camera' ? p.lens : null
}

// Đang chơi Liên Quậy (điện thoại xoay ngang): phím và chạm dành cho trận đấu, Anh đứng yên.
export function playingGame(): boolean {
  return useStory.getState().s.overlay === 'phone' && usePhone.getState().app === 'moba'
}

// Cất điện thoại thì lần sau mở lại từ màn hình chính; chơi lại thì không còn cuộc gọi, ảnh cũ nào.
useStory.subscribe((st, prev) => {
  const closed = prev.s.overlay === 'phone' && st.s.overlay !== 'phone'
  if (closed || st.s.seed !== prev.s.seed) usePhone.getState().reset()
  if (st.s.seed !== prev.s.seed) usePhone.setState({ photo: null })
})
