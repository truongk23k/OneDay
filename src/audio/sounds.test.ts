import { resetMixerForTest } from './engine'
import type { Cue } from './cues'
import { music, TRACKS } from './music'
import { alarm, engine, playCue, rain, ringtone, roomAmbience, shower, shutter, siren, stove, streetAmbience, tap } from './sounds'

// AudioContext giả: đủ các hàm game dùng, ghi lại số nốt đã phát.
class Param {
  value = 0
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
  linearRampToValueAtTime() {}
  setTargetAtTime() {}
}
let started = 0
class Node {
  gain = new Param()
  frequency = new Param()
  Q = new Param()
  detune = new Param()
  threshold = new Param()
  ratio = new Param()
  type = ''
  loop = false
  buffer: unknown = null
  context: unknown
  constructor(ctx: unknown) {
    this.context = ctx
  }
  connect<T>(n: T) {
    return n
  }
  disconnect() {}
  start() {
    started++
  }
  stop() {}
}
class FakeContext {
  state = 'running'
  currentTime = 0
  sampleRate = 8000
  destination = new Node(this)
  resume = () => Promise.resolve()
  createGain = () => new Node(this)
  createOscillator = () => new Node(this)
  createBiquadFilter = () => new Node(this)
  createBufferSource = () => new Node(this)
  createDynamicsCompressor = () => new Node(this)
  createBuffer = (_c: number, n: number) => ({ getChannelData: () => new Float32Array(n) })
}

beforeAll(() => {
  vi.stubGlobal('AudioContext', FakeContext)
  resetMixerForTest()
})
afterAll(() => {
  vi.unstubAllGlobals()
  resetMixerForTest()
})

const CUES: Cue[] = ['message', 'sent', 'search', 'keyFound', 'taskDone', 'wrong', 'door', 'switch', 'fridge', 'flush', 'gulp', 'pickup', 'dropoff', 'arrive', 'endingGood', 'endingBad', 'whistle', 'cash', 'escaped', 'phoneOpen', 'phoneClose', 'like', 'order', 'crash', 'pothole', 'brake', 'honkedAt', 'horn', 'step', 'click', 'snooze']

test('every sound effect builds and plays notes', () => {
  for (const c of CUES) {
    const before = started
    playCue(c)
    expect(started, c).toBeGreaterThan(before)
  }
  shutter()
})

test('every loop starts and stops cleanly', () => {
  vi.useFakeTimers()
  for (const l of [alarm, ringtone, tap, shower, stove, rain, roomAmbience, streetAmbience, siren]) {
    l.set(true)
    expect(l.on).toBe(true)
    vi.advanceTimersByTime(3000)
    l.set(false)
    expect(l.on).toBe(false)
  }
  engine.set(true)
  engine.update(10, 1, true)
  engine.set(false)
  vi.useRealTimers()
})

test('the music player plays every track and moves to the next', () => {
  vi.useFakeTimers()
  for (let i = 0; i < TRACKS.length; i++) {
    music.getState().play(i)
    expect(music.getState().playing).toBe(true)
    vi.advanceTimersByTime(500)
  }
  music.getState().next()
  expect(music.getState().track).toBe(0)
  music.getState().stop()
  expect(music.getState().playing).toBe(false)
  vi.useRealTimers()
})
