import { create } from 'zustand'

// Âm thanh tổng hợp bằng Web Audio (không cần tải file): còi CSGT, nhạc nền lo-fi, tiếng chụp ảnh.
const KEY = 'oneday.sound'

function loadSound(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

type Settings = { sound: boolean; setSound: (on: boolean) => void }

export const useSettings = create<Settings>()((set) => ({
  sound: loadSound(),
  setSound: (sound) => {
    try {
      localStorage.setItem(KEY, sound ? 'on' : 'off')
    } catch {
      // Chế độ ẩn danh: chỉ nhớ trong lượt chơi này.
    }
    set({ sound })
    if (!sound) {
      siren(false)
      music.getState().stop()
    }
  },
}))

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  // iOS chỉ cho phát tiếng sau một lần chạm: thử mở lại mỗi lần cần.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Mở khoá âm thanh ở lần chạm/phím đầu tiên (Safari bắt buộc).
export function unlockAudio() {
  const once = () => {
    audio()
    window.removeEventListener('pointerdown', once)
    window.removeEventListener('keydown', once)
  }
  window.addEventListener('pointerdown', once)
  window.addEventListener('keydown', once)
}

let sirenNodes: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null

// Còi hú hai tông lên xuống.
export function siren(on: boolean) {
  if (!on || !useSettings.getState().sound) {
    if (sirenNodes) {
      const n = sirenNodes
      sirenNodes = null
      n.gain.gain.setTargetAtTime(0, n.gain.context.currentTime, 0.05)
      setTimeout(() => {
        n.osc.stop()
        n.lfo.stop()
      }, 300)
    }
    return
  }
  if (sirenNodes) return
  const a = audio()
  if (!a) return
  const osc = a.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 860
  const lfo = a.createOscillator()
  lfo.type = 'square'
  lfo.frequency.value = 1.6
  const depth = a.createGain()
  depth.gain.value = 190
  lfo.connect(depth).connect(osc.frequency)
  const filter = a.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2200
  const gain = a.createGain()
  gain.gain.value = 0
  gain.gain.setTargetAtTime(0.045, a.currentTime, 0.1)
  osc.connect(filter).connect(gain).connect(a.destination)
  osc.start()
  lfo.start()
  sirenNodes = { osc, lfo, gain }
}

export function shutter() {
  const a = useSettings.getState().sound ? audio() : null
  if (!a) return
  const len = Math.floor(a.sampleRate * 0.08)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2
  const src = a.createBufferSource()
  src.buffer = buf
  const gain = a.createGain()
  gain.gain.value = 0.25
  src.connect(gain).connect(a.destination)
  src.start()
}

// Nhạc nền: vòng hợp âm lo-fi chậm, mỗi bài một vòng hợp âm khác.
export const TRACKS = [
  { name: 'Sáng đầu tuần', chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] },
  { name: 'Chở em đi làm', chords: [[50, 53, 57], [55, 59, 62], [48, 52, 55], [45, 48, 52]] },
  { name: 'Kẹt xe 8 giờ', chords: [[52, 55, 59], [57, 60, 64], [50, 53, 57], [55, 59, 62]] },
] as const

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

type MusicState = { playing: boolean; track: number; play: (track?: number) => void; stop: () => void; next: () => void }

let timer: ReturnType<typeof setInterval> | null = null
let master: GainNode | null = null

function startLoop(track: number) {
  const a = audio()
  if (!a) return
  master = a.createGain()
  master.gain.value = 0.05
  master.connect(a.destination)
  const out = master
  let bar = 0
  const beat = 60 / 72
  const playBar = () => {
    const chord = TRACKS[track].chords[bar % 4]
    const t0 = a.currentTime + 0.05
    chord.forEach((n, i) => {
      // Rải hợp âm: mỗi nốt vang dần rồi tắt.
      for (let k = 0; k < 2; k++) {
        const o = a.createOscillator()
        o.type = 'triangle'
        o.frequency.value = hz(n + (k ? 12 : 0))
        const g = a.createGain()
        const t = t0 + i * 0.12 + k * beat * 2
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(k ? 0.35 : 0.6, t + 0.04)
        g.gain.exponentialRampToValueAtTime(0.001, t + beat * 2)
        o.connect(g).connect(out)
        o.start(t)
        o.stop(t + beat * 2 + 0.05)
      }
    })
    const bass = a.createOscillator()
    bass.type = 'sine'
    bass.frequency.value = hz(chord[0] - 12)
    const bg = a.createGain()
    bg.gain.setValueAtTime(0.8, t0)
    bg.gain.exponentialRampToValueAtTime(0.001, t0 + beat * 4)
    bass.connect(bg).connect(out)
    bass.start(t0)
    bass.stop(t0 + beat * 4)
    bar++
  }
  playBar()
  timer = setInterval(playBar, beat * 4 * 1000)
}

export const music = create<MusicState>()((set, get) => ({
  playing: false,
  track: 0,
  play: (track = get().track) => {
    get().stop()
    if (!useSettings.getState().sound) return
    startLoop(track)
    set({ playing: true, track })
  },
  stop: () => {
    if (timer) clearInterval(timer)
    timer = null
    master?.disconnect()
    master = null
    set({ playing: false })
  },
  next: () => {
    const track = (get().track + 1) % TRACKS.length
    if (get().playing) get().play(track)
    else set({ track })
  },
}))
