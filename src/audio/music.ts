import { create } from 'zustand'
import { audio } from './engine'
import { hz, noise, tone } from './synth'

// Nhạc nền tự sáng tác bằng máy: hợp âm, bass, nốt rải và trống, chạy theo nhịp 16 ô mỗi ô nhịp.
type Track = {
  name: string
  bpm: number
  // Bốn hợp âm (số MIDI), mỗi ô nhịp một hợp âm.
  chords: number[][]
  kick: string
  snare: string
  hat: string
  // Bass: ô nào có 'x' thì đánh nốt gốc.
  bass: string
  // Nốt rải: ô nào là số thì đánh nốt thứ mấy của hợp âm (cao hơn một quãng tám).
  arp: string
  swing?: number
}

export const TRACKS: Track[] = [
  {
    name: 'Sáng đầu tuần',
    bpm: 78,
    chords: [
      [60, 64, 67, 71],
      [57, 60, 64, 67],
      [53, 57, 60, 64],
      [55, 59, 62, 65],
    ],
    kick: 'x.........x.....',
    snare: '....x.......x...',
    hat: 'x.x.x.x.x.x.x.x.',
    bass: 'x.......x.x.....',
    arp: '0...2...1...3.2.',
    swing: 0.12,
  },
  {
    name: 'Chở em đi làm',
    bpm: 112,
    chords: [
      [62, 65, 69, 72],
      [58, 62, 65, 69],
      [53, 57, 60, 65],
      [60, 64, 67, 72],
    ],
    kick: 'x...x...x...x.x.',
    snare: '....x.......x...',
    hat: 'xxxxxxxxxxxxxxxx',
    bass: 'x.x.x.x.x.x.x.xx',
    arp: '0.2.1.3.0.2.1.3.',
  },
  {
    name: 'Kẹt xe 8 giờ',
    bpm: 96,
    chords: [
      [64, 67, 71, 74],
      [60, 64, 67, 71],
      [55, 59, 62, 67],
      [62, 66, 69, 72],
    ],
    kick: 'x.....x...x.....',
    snare: '....x.......x..x',
    hat: '..x...x...x...x.',
    bass: 'x..x..x...x..x..',
    arp: '0..1..2...3..2..',
    swing: 0.06,
  },
]

const LOOKAHEAD = 0.15

function kick(at: number) {
  tone({ f: 130, to: 42, dur: 0.22, gain: 0.55, at, bus: 'music' })
}
function snare(at: number) {
  noise({ dur: 0.14, gain: 0.22, at, bus: 'music', filter: { type: 'bandpass', f: 1900, q: 0.8 } })
  tone({ f: 210, to: 150, dur: 0.08, gain: 0.12, at, bus: 'music' })
}
function hat(at: number, accent: boolean) {
  noise({ dur: 0.035, gain: accent ? 0.09 : 0.05, at, bus: 'music', filter: { type: 'highpass', f: 7000 } })
}

let timer: ReturnType<typeof setInterval> | null = null

// Trả về false nếu chưa phát được (âm thanh chưa được mở): người gọi thử lại sau.
function start(track: Track): boolean {
  const m = audio()
  if (!m) return false
  const stepDur = 60 / track.bpm / 4
  let step = 0
  let nextAt = m.ctx.currentTime + 0.05
  const schedule = () => {
    const now = m.ctx.currentTime
    while (nextAt < now + LOOKAHEAD) {
      const i = step % 16
      const chord = track.chords[Math.floor(step / 16) % track.chords.length]
      const swing = i % 2 === 1 ? (track.swing ?? 0) * stepDur : 0
      const at = nextAt - now + swing
      if (i === 0) {
        // Hợp âm nền êm cả ô nhịp.
        chord.forEach((n) => tone({ f: hz(n), dur: stepDur * 16, gain: 0.05, attack: 0.08, at, bus: 'music', type: 'triangle', filter: { type: 'lowpass', f: 1400 } }))
      }
      if (track.kick[i] === 'x') kick(at)
      if (track.snare[i] === 'x') snare(at)
      if (track.hat[i] === 'x') hat(at, i % 4 === 0)
      if (track.bass[i] === 'x') tone({ f: hz(chord[0] - 24), dur: stepDur * 1.8, gain: 0.32, at, bus: 'music', type: 'sine' })
      const a = track.arp[i]
      if (a !== '.') {
        const n = chord[Number(a) % chord.length] + 12
        tone({ f: hz(n), dur: stepDur * 2.5, gain: 0.09, at, bus: 'music', type: 'triangle' })
        tone({ f: hz(n) * 2, dur: stepDur, gain: 0.02, at, bus: 'music' })
      }
      step++
      nextAt += stepDur
    }
  }
  schedule()
  timer = setInterval(schedule, 40)
  return true
}

type Player = { playing: boolean; track: number; play: (track?: number) => void; stop: () => void; next: () => void }

export const music = create<Player>()((set, get) => ({
  playing: false,
  track: 0,
  play: (track = get().track) => {
    if (timer) clearInterval(timer)
    timer = null
    set({ playing: start(TRACKS[track]), track })
  },
  stop: () => {
    if (timer) clearInterval(timer)
    timer = null
    set({ playing: false })
  },
  next: () => {
    const track = (get().track + 1) % TRACKS.length
    if (get().playing) get().play(track)
    else set({ track })
  },
}))
