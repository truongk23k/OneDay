import type { Cue } from './cues'
import { audio } from './engine'
import { hz, loop, mallet, noise, noiseBed, tone } from './synth'

// Mọi tiếng của game, tổng hợp bằng Web Audio (không file, không bản quyền).
const arp = (notes: number[], step: number, gain = 0.16, type: OscillatorType = 'triangle') =>
  notes.forEach((n, i) => tone({ f: hz(n), dur: 0.35, gain, at: i * step, type }))

const PLAY: Record<Cue, () => void> = {
  click: () => {
    tone({ f: 1800, to: 1100, type: 'triangle', dur: 0.04, gain: 0.08 })
    noise({ dur: 0.015, gain: 0.04, filter: { type: 'highpass', f: 4000 } })
  },
  // Tin nhắn đến kiểu Mes: hai tiếng "bóp" bong bóng nảy lên (giống phong cách, không chép tiếng gốc).
  message: () => {
    tone({ f: 620, to: 1040, dur: 0.09, gain: 0.22, attack: 0.004 })
    tone({ f: 980, to: 1560, dur: 0.12, gain: 0.2, attack: 0.004, at: 0.1 })
    tone({ f: 3120, dur: 0.05, gain: 0.03, at: 0.1 })
  },
  // Gửi tin: tiếng "vút" nhẹ đi lên.
  sent: () => {
    noise({ dur: 0.16, gain: 0.08, attack: 0.03, filter: { type: 'bandpass', f: 700, to: 3200, q: 1.4 } })
    tone({ f: 480, to: 920, dur: 0.12, gain: 0.07 })
  },
  search: () => {
    for (let i = 0; i < 3; i++) noise({ dur: 0.07, gain: 0.12, at: i * 0.09, filter: { type: 'bandpass', f: 900 + i * 300, q: 1.2 } })
  },
  keyFound: () => {
    arp([72, 76, 79, 84], 0.08, 0.18)
    tone({ f: 2093, to: 4186, dur: 0.35, gain: 0.06, at: 0.32 })
    noise({ dur: 0.08, gain: 0.05, at: 0.05, filter: { type: 'highpass', f: 6000 } })
  },
  taskDone: () => {
    mallet(hz(79), 0, 0.16)
    mallet(hz(84), 0.1, 0.18)
  },
  wrong: () => tone({ f: 330, to: 196, type: 'square', dur: 0.32, gain: 0.08, filter: { type: 'lowpass', f: 1200 } }),
  snooze: () => tone({ f: 660, to: 440, dur: 0.18, gain: 0.1 }),
  door: () => {
    tone({ f: 190, to: 130, type: 'sawtooth', dur: 0.4, gain: 0.05, filter: { type: 'bandpass', f: 500, q: 6 }, vibrato: [18, 12] })
    noise({ dur: 0.18, gain: 0.3, at: 0.32, filter: { type: 'lowpass', f: 220 } })
    tone({ f: 90, to: 50, dur: 0.18, gain: 0.25, at: 0.32 })
  },
  switch: () => {
    tone({ f: 2600, dur: 0.02, gain: 0.1, type: 'square', filter: { type: 'highpass', f: 1500 } })
    noise({ dur: 0.02, gain: 0.08, filter: { type: 'highpass', f: 3000 } })
  },
  fridge: () => {
    noise({ dur: 0.14, gain: 0.25, filter: { type: 'lowpass', f: 300 } })
    tone({ f: 120, dur: 0.6, gain: 0.03, at: 0.1, type: 'sawtooth', filter: { type: 'lowpass', f: 200 } })
  },
  flush: () => {
    // Đi vệ sinh xong mới xả nước.
    noise({ dur: 2.2, gain: 0.22, attack: 0.35, at: 1.6, filter: { type: 'lowpass', f: 1400, to: 300 } })
    noise({ dur: 1.4, gain: 0.08, attack: 0.2, at: 1.7, filter: { type: 'bandpass', f: 2400, q: 0.8 } })
  },
  gulp: () => {
    for (let i = 0; i < 3; i++) tone({ f: 320, to: 160, dur: 0.09, gain: 0.14, at: 0.25 + i * 0.32 })
  },
  pickup: () => arp([67, 71, 74, 79], 0.09, 0.15, 'sine'),
  dropoff: () => {
    arp([74, 79, 83], 0.09, 0.15, 'sine')
    mallet(hz(86), 0.3, 0.16)
  },
  arrive: () => {
    ;[60, 64, 67].forEach((n) => tone({ f: hz(n), dur: 0.25, gain: 0.07, type: 'square', filter: { type: 'lowpass', f: 2200 } }))
    ;[65, 69, 72].forEach((n) => tone({ f: hz(n), dur: 0.25, gain: 0.07, type: 'square', at: 0.22, filter: { type: 'lowpass', f: 2200 } }))
    ;[67, 71, 74, 79].forEach((n) => tone({ f: hz(n), dur: 0.9, gain: 0.07, type: 'square', at: 0.44, filter: { type: 'lowpass', f: 2400 } }))
  },
  endingGood: () => {
    arp([72, 76, 79, 84, 88], 0.11, 0.14, 'triangle')
    ;[60, 64, 67, 72].forEach((n) => tone({ f: hz(n), dur: 1.6, gain: 0.06, at: 0.6, attack: 0.05 }))
  },
  endingBad: () => {
    ;[67, 66, 65].forEach((n, i) => tone({ f: hz(n), dur: 0.45, gain: 0.08, at: i * 0.45, type: 'sawtooth', filter: { type: 'lowpass', f: 900 } }))
    tone({ f: hz(64), dur: 1.3, gain: 0.08, at: 1.35, type: 'sawtooth', vibrato: [6, 8], filter: { type: 'lowpass', f: 800 } })
  },
  whistle: () => {
    tone({ f: 2700, dur: 0.22, gain: 0.12, vibrato: [32, 120] })
    tone({ f: 2700, dur: 0.55, gain: 0.12, at: 0.3, vibrato: [32, 120] })
  },
  cash: () => {
    noise({ dur: 0.05, gain: 0.15, at: 0.9, filter: { type: 'highpass', f: 2500 } })
    tone({ f: 1568, dur: 0.5, gain: 0.12, at: 0.95 })
    tone({ f: 2093, dur: 0.6, gain: 0.12, at: 1.0 })
  },
  escaped: () => {
    noise({ dur: 0.6, gain: 0.15, attack: 0.15, filter: { type: 'bandpass', f: 400, to: 2400, q: 1 } })
    arp([67, 72], 0.12, 0.12, 'sine')
  },
  phoneOpen: () => tone({ f: 600, to: 950, dur: 0.1, gain: 0.08 }),
  phoneClose: () => tone({ f: 900, to: 560, dur: 0.1, gain: 0.07 }),
  like: () => tone({ f: 520, to: 980, dur: 0.08, gain: 0.12 }),
  order: () => {
    mallet(hz(76), 0, 0.14)
    mallet(hz(83), 0.09, 0.14)
    mallet(hz(88), 0.18, 0.14)
  },
  crash: () => {
    noise({ dur: 0.45, gain: 0.5, filter: { type: 'lowpass', f: 1600, to: 300 } })
    tone({ f: 85, to: 38, dur: 0.35, gain: 0.45 })
    tone({ f: 620, dur: 0.12, gain: 0.08, type: 'square', at: 0.04, filter: { type: 'bandpass', f: 900, q: 8 } })
  },
  pothole: () => {
    tone({ f: 95, to: 42, dur: 0.18, gain: 0.4 })
    noise({ dur: 0.1, gain: 0.25, filter: { type: 'lowpass', f: 350 } })
  },
  brake: () => {
    tone({ f: 2300, dur: 0.5, gain: 0.05, vibrato: [9, 45] })
    noise({ dur: 0.35, gain: 0.06, filter: { type: 'highpass', f: 3500 } })
  },
  honkedAt: () => {
    // Xe khác bấm còi inh ỏi khi Anh vượt đèn đỏ.
    for (const at of [0.05, 0.3]) {
      tone({ f: 415, dur: 0.2, gain: 0.07, at, type: 'square', filter: { type: 'lowpass', f: 1600 } })
      tone({ f: 523, dur: 0.2, gain: 0.07, at, type: 'square', filter: { type: 'lowpass', f: 1600 } })
    }
  },
  horn: () => {
    tone({ f: 440, dur: 0.34, gain: 0.08, type: 'square', attack: 0.01, filter: { type: 'lowpass', f: 1800 } })
    tone({ f: 554, dur: 0.34, gain: 0.08, type: 'square', attack: 0.01, filter: { type: 'lowpass', f: 1800 } })
  },
  // ---------- Liên Quậy ----------
  slash: () => {
    noise({ dur: 0.09, gain: 0.14, filter: { type: 'bandpass', f: 2400, to: 900, q: 1.5 } })
    tone({ f: 900, to: 400, dur: 0.06, gain: 0.05, type: 'triangle' })
  },
  spin: () => {
    noise({ dur: 0.35, gain: 0.2, attack: 0.05, filter: { type: 'bandpass', f: 500, to: 2600, q: 2 } })
    tone({ f: 300, to: 700, dur: 0.3, gain: 0.08, type: 'sawtooth', filter: { type: 'lowpass', f: 1500 } })
  },
  dash: () => {
    noise({ dur: 0.22, gain: 0.2, attack: 0.02, filter: { type: 'highpass', f: 1200, to: 4000 } })
    tone({ f: 500, to: 1400, dur: 0.15, gain: 0.07 })
  },
  thunder: () => {
    noise({ dur: 0.08, gain: 0.45, filter: { type: 'highpass', f: 2000 } })
    noise({ dur: 1.4, gain: 0.4, attack: 0.04, at: 0.05, filter: { type: 'lowpass', f: 900, to: 120 } })
    tone({ f: 70, to: 32, dur: 0.9, gain: 0.35, at: 0.05 })
  },
  enemySkill: () => {
    tone({ f: 220, to: 110, dur: 0.35, gain: 0.1, type: 'sawtooth', filter: { type: 'lowpass', f: 900 } })
    noise({ dur: 0.25, gain: 0.1, filter: { type: 'bandpass', f: 700, q: 2 } })
  },
  kill: () => {
    arp([72, 79, 84, 91], 0.07, 0.14, 'square')
    noise({ dur: 0.3, gain: 0.08, at: 0.2, filter: { type: 'highpass', f: 5000 } })
  },
  death: () => {
    ;[64, 60, 55].forEach((n, i) => tone({ f: hz(n), dur: 0.35, gain: 0.1, at: i * 0.18, type: 'triangle' }))
  },
  levelUp: () => {
    arp([67, 71, 74, 79, 83], 0.06, 0.13, 'sine')
    tone({ f: hz(86), dur: 0.5, gain: 0.08, at: 0.3 })
  },
  towerHit: () => {
    tone({ f: 140, to: 70, dur: 0.15, gain: 0.25 })
    noise({ dur: 0.08, gain: 0.12, filter: { type: 'lowpass', f: 600 } })
  },
  step: () => {
    noise({ dur: 0.06, gain: 0.09, filter: { type: 'lowpass', f: 500 + Math.random() * 250 } })
    tone({ f: 70 + Math.random() * 20, dur: 0.05, gain: 0.06 })
  },
}

export function playCue(c: Cue) {
  PLAY[c]()
}

export function shutter() {
  noise({ dur: 0.05, gain: 0.25, filter: { type: 'highpass', f: 1800 } })
  noise({ dur: 0.06, gain: 0.2, at: 0.08, filter: { type: 'bandpass', f: 1200, q: 1 } })
}

// ---------- Tiếng kéo dài ----------

// Đặt lịch lặp lại một đoạn (báo thức, nhạc chuông, chim hót…) cho tới khi tắt.
function pattern(every: () => number, play: () => void) {
  return loop((ctx, bus) => {
    const out = ctx.createGain()
    out.connect(bus.sfx)
    let timer: ReturnType<typeof setTimeout> | null = null
    const tick = () => {
      play()
      timer = setTimeout(tick, every() * 1000)
    }
    tick()
    return { out, sources: [], cleanup: () => timer && clearTimeout(timer) }
  })
}

// Báo thức kiểu đồng hồ điện tử: bíp-bíp-bíp-bíp, nghỉ, lặp lại.
export const alarm = pattern(
  () => 1.1,
  () => {
    for (let i = 0; i < 4; i++) tone({ f: 2050, dur: 0.075, gain: 0.09, attack: 0.002, at: i * 0.14, type: 'square', filter: { type: 'lowpass', f: 4200 } })
  },
)

export const ringtone = pattern(
  () => 2.2,
  () => {
    ;[76, 80, 83, 88].forEach((n, i) => mallet(hz(n), i * 0.12, 0.12))
    ;[76, 80, 83, 88].forEach((n, i) => mallet(hz(n), 0.6 + i * 0.12, 0.12))
  },
)

function bed(gain: number, filters: Parameters<typeof noiseBed>[3], extra?: (ctx: AudioContext, out: GainNode) => () => void) {
  return loop((ctx, bus, buf) => {
    const out = ctx.createGain()
    out.gain.value = 0
    out.gain.setTargetAtTime(gain, ctx.currentTime, 0.2)
    out.connect(bus.amb)
    const src = noiseBed(ctx, buf, out, filters)
    return { out, sources: [src], cleanup: extra?.(ctx, out) }
  })
}

// Lặp ngẫu nhiên một việc nhỏ (chim hót, còi xa, giọt mưa…), trả về hàm dừng.
function sprinkle(min: number, max: number, play: () => void) {
  return () => {
    let timer: ReturnType<typeof setTimeout>
    const next = () => {
      timer = setTimeout(
        () => {
          play()
          next()
        },
        (min + Math.random() * (max - min)) * 1000,
      )
    }
    next()
    return () => clearTimeout(timer)
  }
}

const chirp = () => {
  const n = 2 + Math.floor(Math.random() * 3)
  const base = 2600 + Math.random() * 1400
  for (let i = 0; i < n; i++) tone({ f: base, to: base * 1.35, dur: 0.07, gain: 0.03, at: i * 0.11, bus: 'amb' })
}

const farHonk = () => {
  const f = 360 + Math.random() * 160
  tone({ f, dur: 0.25, gain: 0.025, type: 'square', bus: 'amb', filter: { type: 'lowpass', f: 1000 } })
}

export const tap = bed(0.11, [{ type: 'bandpass', f: 2200, q: 0.6 }])
export const shower = bed(0.16, [{ type: 'highpass', f: 900 }, { type: 'lowpass', f: 7000 }])
export const stove = bed(0.05, [{ type: 'highpass', f: 2600 }], () =>
  sprinkle(0.06, 0.25, () => noise({ dur: 0.012, gain: 0.05, filter: { type: 'highpass', f: 3000 }, bus: 'amb' }))(),
)
export const rain = bed(0.14, [{ type: 'highpass', f: 500 }, { type: 'lowpass', f: 5200 }], () =>
  sprinkle(0.05, 0.2, () => noise({ dur: 0.01, gain: 0.03, filter: { type: 'highpass', f: 2500 }, bus: 'amb' }))(),
)
export const roomAmbience = bed(0.06, [{ type: 'lowpass', f: 320 }], () => sprinkle(2, 6, chirp)())
export const streetAmbience = bed(0.12, [{ type: 'lowpass', f: 650 }], () => sprinkle(5, 12, farHonk)())

// Còi hú CSGT hai tông lên xuống.
export const siren = loop((ctx, bus) => {
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 860
  const lfo = ctx.createOscillator()
  lfo.type = 'square'
  lfo.frequency.value = 1.6
  const depth = ctx.createGain()
  depth.gain.value = 190
  lfo.connect(depth).connect(osc.frequency)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2200
  const out = ctx.createGain()
  out.gain.value = 0
  out.gain.setTargetAtTime(0.07, ctx.currentTime, 0.1)
  osc.connect(filter).connect(out).connect(bus.sfx)
  return { out, sources: [osc, lfo] }
})

// Máy xe tay ga: tiếng ù trầm, ga càng mạnh / chạy càng nhanh càng cao và to.
let engineFilter: BiquadFilterNode | null = null
const engineLoop = loop((ctx, bus) => {
  const out = ctx.createGain()
  out.gain.value = 0
  out.connect(bus.sfx)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 400
  filter.Q.value = 2
  filter.connect(out)
  engineFilter = filter
  const a = ctx.createOscillator()
  a.type = 'sawtooth'
  a.frequency.value = 40
  const b = ctx.createOscillator()
  b.type = 'square'
  b.frequency.value = 20
  const bg = ctx.createGain()
  bg.gain.value = 0.5
  a.connect(filter)
  b.connect(bg).connect(filter)
  return { out, sources: [a, b] }
})

export const engine = {
  set: (on: boolean) => engineLoop.set(on),
  update(speed: number, throttle: number, lifted: boolean) {
    const m = audio()
    const live = engineLoop.node
    if (!m || !live) return
    const [a, b] = live.sources as OscillatorNode[]
    const rev = Math.abs(speed) / 13 + throttle * 0.25 + (lifted ? 0.25 : 0)
    const f = 34 + rev * 70
    const t = m.ctx.currentTime
    a.frequency.setTargetAtTime(f, t, 0.08)
    b.frequency.setTargetAtTime(f / 2, t, 0.08)
    live.out.gain.setTargetAtTime(0.05 + Math.min(1, rev) * 0.07, t, 0.1)
    engineFilter?.frequency.setTargetAtTime(300 + rev * 900, t, 0.1)
  },
}
