import { create } from 'zustand'

// Bộ trộn âm thanh: một AudioContext, ba đường (hiệu ứng, nhạc, tiếng nền) và cài đặt bật/tắt (nhớ trong máy).
export type Bus = 'sfx' | 'music' | 'amb'
export type Volume = Record<Bus, number>
type Settings = {
  sound: boolean
  music: boolean
  // Âm lượng từng nhóm (0..1): nhạc nền, hiệu ứng, tiếng nền (mưa, phố, chim).
  volume: Volume
  setSound: (on: boolean) => void
  setMusic: (on: boolean) => void
  setVolume: (bus: Bus, v: number) => void
}

const DEFAULT_VOLUME: Volume = { sfx: 1, music: 0.6, amb: 0.6 }
function loadVolume(): Volume {
  try {
    return { ...DEFAULT_VOLUME, ...JSON.parse(localStorage.getItem('oneday.volume') ?? '{}') }
  } catch {
    return { ...DEFAULT_VOLUME }
  }
}

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

export const useSettings = create<Settings>()((set, get) => ({
  sound: load('oneday.sound'),
  music: load('oneday.music'),
  volume: loadVolume(),
  setVolume: (bus, v) => {
    const volume = { ...get().volume, [bus]: Math.max(0, Math.min(1, v)) }
    try {
      localStorage.setItem('oneday.volume', JSON.stringify(volume))
    } catch {
      // Chế độ ẩn danh: chỉ nhớ trong lượt chơi này.
    }
    set({ volume })
  },
  setSound: (sound) => {
    save('oneday.sound', sound)
    set({ sound })
  },
  setMusic: (music) => {
    save('oneday.music', music)
    set({ music })
  },
}))

// Mức gốc của từng nhóm (nhân với âm lượng người chơi chọn): hiệu ứng rõ nhất, nhạc và tiếng nền nhỏ hơn.
const LEVEL: Record<Bus, number> = { sfx: 1.1, music: 0.4, amb: 0.45 }

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
  const { sound, music, volume } = useSettings.getState()
  const t = m.ctx.currentTime
  // Thanh trượt nghe theo tai người (bình phương) cho dễ chỉnh nhỏ.
  const level = (b: Bus, on: boolean) => (on ? LEVEL[b] * volume[b] ** 2 : 0)
  m.bus.sfx.gain.setTargetAtTime(level('sfx', sound), t, 0.05)
  m.bus.amb.gain.setTargetAtTime(level('amb', sound), t, 0.05)
  m.bus.music.gain.setTargetAtTime(level('music', music), t, 0.05)
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
