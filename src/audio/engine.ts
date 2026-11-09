import { create } from 'zustand'

// Bộ trộn âm thanh: một AudioContext, ba đường (hiệu ứng, nhạc, tiếng nền) và cài đặt bật/tắt (nhớ trong máy).
type Settings = { sound: boolean; music: boolean; setSound: (on: boolean) => void; setMusic: (on: boolean) => void }

const load = (key: string) => {
  try {
    return localStorage.getItem(key) !== 'off'
  } catch {
    return true
  }
}
const save = (key: string, on: boolean) => {
  try {
    localStorage.setItem(key, on ? 'on' : 'off')
  } catch {
    // Chế độ ẩn danh: chỉ nhớ trong lượt chơi này.
  }
}

export const useSettings = create<Settings>()((set) => ({
  sound: load('oneday.sound'),
  music: load('oneday.music'),
  setSound: (sound) => {
    save('oneday.sound', sound)
    set({ sound })
  },
  setMusic: (music) => {
    save('oneday.music', music)
    set({ music })
  },
}))

export type Bus = 'sfx' | 'music' | 'amb'
const LEVEL: Record<Bus, number> = { sfx: 0.9, music: 0.32, amb: 0.5 }

type Mixer = { ctx: AudioContext; master: GainNode; bus: Record<Bus, GainNode>; noise: AudioBuffer }
let mixer: Mixer | null = null

function build(ctx: AudioContext): Mixer {
  const master = ctx.createGain()
  master.gain.value = 0.85
  // Nén nhẹ cho khỏi rè khi nhiều tiếng cùng lúc.
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  master.connect(comp).connect(ctx.destination)
  const bus = {} as Record<Bus, GainNode>
  for (const b of Object.keys(LEVEL) as Bus[]) {
    bus[b] = ctx.createGain()
    bus[b].connect(master)
  }
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const m = { ctx, master, bus, noise }
  applyLevels(m)
  return m
}

function applyLevels(m: Mixer) {
  const { sound, music } = useSettings.getState()
  const t = m.ctx.currentTime
  m.bus.sfx.gain.setTargetAtTime(sound ? LEVEL.sfx : 0, t, 0.05)
  m.bus.amb.gain.setTargetAtTime(sound ? LEVEL.amb : 0, t, 0.05)
  m.bus.music.gain.setTargetAtTime(music ? LEVEL.music : 0, t, 0.05)
}

useSettings.subscribe(() => {
  if (mixer) applyLevels(mixer)
})

// Tạo bộ trộn (lần đầu) và thử mở lại nếu trình duyệt đang tạm dừng âm thanh.
function ensure(): Mixer | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!mixer) mixer = build(new Ctx())
  // Chưa được phép phát: thử mở lại, nhưng không quá mỗi giây một lần.
  const now = Date.now()
  if (mixer.ctx.state !== 'running' && now - lastResume > 1000) {
    lastResume = now
    void mixer.ctx.resume().catch(() => {})
  }
  return mixer
}
let lastResume = 0

// Bộ trộn để phát tiếng. Chưa được phép phát (chưa chạm lần nào) hay không có Web Audio (máy cũ, test)
// thì trả về null: tiếng đó bỏ qua, không dồn lại rồi phát cùng lúc khi được mở.
export function audio(): Mixer | null {
  const m = ensure()
  return m && m.ctx.state === 'running' ? m : null
}

// Mở khoá âm thanh ở lần chạm / bấm phím đầu tiên (Safari bắt buộc).
export function unlockAudio() {
  const once = () => {
    lastResume = 0
    const m = ensure()
    // Phát một mẫu im lặng để iOS mở hẳn đường âm thanh.
    if (m) {
      const src = m.ctx.createBufferSource()
      src.buffer = m.ctx.createBuffer(1, 1, m.ctx.sampleRate)
      src.connect(m.master)
      src.start()
    }
    window.removeEventListener('pointerdown', once)
    window.removeEventListener('keydown', once)
  }
  window.addEventListener('pointerdown', once)
  window.addEventListener('keydown', once)
}

// Dùng cho test: thay AudioContext giả.
export function resetMixerForTest() {
  mixer = null
}
