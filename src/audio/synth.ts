import { audio, type Bus } from './engine'

// Viên gạch tổng hợp âm thanh: một nốt có bao âm (tone), một tiếng ồn có lọc (noise), một vòng lặp (loop).
type Filter = { type: BiquadFilterType; f: number; to?: number; q?: number }
export type ToneOpts = {
  f: number
  to?: number
  type?: OscillatorType
  dur: number
  gain?: number
  attack?: number
  at?: number
  bus?: Bus
  vibrato?: [rate: number, depth: number]
  filter?: Filter
}

const EPS = 0.0001

function envelope(g: GainNode, t: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(EPS, t)
  g.gain.exponentialRampToValueAtTime(Math.max(EPS, peak), t + attack)
  g.gain.exponentialRampToValueAtTime(EPS, t + Math.max(attack + 0.01, dur))
}

function makeFilter(ctx: AudioContext, f: Filter, t: number, dur: number) {
  const n = ctx.createBiquadFilter()
  n.type = f.type
  n.frequency.setValueAtTime(f.f, t)
  if (f.to) n.frequency.exponentialRampToValueAtTime(f.to, t + dur)
  if (f.q !== undefined) n.Q.value = f.q
  return n
}

export function tone(o: ToneOpts) {
  const m = audio()
  if (!m) return
  const { ctx } = m
  const t = ctx.currentTime + (o.at ?? 0)
  const osc = ctx.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.f, t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur)
  const g = ctx.createGain()
  envelope(g, t, o.gain ?? 0.2, o.attack ?? 0.005, o.dur)
  let node: AudioNode = osc
  if (o.filter) node = node.connect(makeFilter(ctx, o.filter, t, o.dur))
  node.connect(g).connect(m.bus[o.bus ?? 'sfx'])
  if (o.vibrato) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = o.vibrato[0]
    const depth = ctx.createGain()
    depth.gain.value = o.vibrato[1]
    lfo.connect(depth).connect(osc.frequency)
    lfo.start(t)
    lfo.stop(t + o.dur + 0.05)
  }
  osc.start(t)
  osc.stop(t + o.dur + 0.05)
}

export type NoiseOpts = { dur: number; gain?: number; attack?: number; at?: number; filter?: Filter; bus?: Bus }

export function noise(o: NoiseOpts) {
  const m = audio()
  if (!m) return
  const { ctx } = m
  const t = ctx.currentTime + (o.at ?? 0)
  const src = ctx.createBufferSource()
  src.buffer = m.noise
  src.loop = true
  const g = ctx.createGain()
  envelope(g, t, o.gain ?? 0.2, o.attack ?? 0.003, o.dur)
  let node: AudioNode = src
  if (o.filter) node = node.connect(makeFilter(ctx, o.filter, t, o.dur))
  node.connect(g).connect(m.bus[o.bus ?? 'sfx'])
  src.start(t, Math.random() * 1.5)
  src.stop(t + o.dur + 0.05)
}

// Nốt kiểu đàn gõ (marimba): sin trầm + bội âm cao tắt nhanh.
export function mallet(f: number, at = 0, gain = 0.18, bus: Bus = 'sfx') {
  tone({ f, dur: 0.55, gain, at, bus })
  tone({ f: f * 4, dur: 0.07, gain: gain * 0.25, at, bus })
}

export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

// Vòng lặp: dựng các nút khi bật, tắt dần khi tắt. build trả về nút ra (gain) và hàm dọn dẹp.
type Built = { out: GainNode; sources: AudioScheduledSourceNode[]; cleanup?: () => void; base?: number }
export function loop(build: (ctx: AudioContext, bus: Record<Bus, GainNode>, noiseBuf: AudioBuffer) => Built) {
  let live: Built | null = null
  return {
    get on() {
      return live !== null
    },
    set(on: boolean) {
      if (on === (live !== null)) return
      if (on) {
        const m = audio()
        if (!m) return
        live = build(m.ctx, m.bus, m.noise)
        for (const s of live.sources) s.start()
        return
      }
      const l = live!
      live = null
      l.cleanup?.()
      const m = audio()
      if (!m) return
      l.out.gain.setTargetAtTime(0, m.ctx.currentTime, 0.08)
      setTimeout(() => {
        for (const s of l.sources) s.stop()
        l.out.disconnect()
      }, 500)
    },
    get node() {
      return live
    },
    // Chỉnh độ to (0..1) so với mức gốc, ví dụ theo khoảng cách tới vòi nước.
    level(v: number) {
      const m = audio()
      if (!m || !live || live.base === undefined) return
      live.out.gain.setTargetAtTime(live.base * v, m.ctx.currentTime, 0.15)
    },
  }
}

// Nguồn tiếng ồn lặp có lọc, dùng cho nước chảy, mưa, tiếng phố.
export function noiseBed(ctx: AudioContext, buf: AudioBuffer, out: AudioNode, filters: Filter[]) {
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  let node: AudioNode = src
  for (const f of filters) node = node.connect(makeFilter(ctx, f, ctx.currentTime, 1))
  node.connect(out)
  return src
}
