import { lensPose } from './lens'

const anh = { x: 2, z: 3, facing: 0, head: 1.1 }
const aim = { yaw: 0, pitch: 0 }

test('the back camera sits at Anh’s eyes and looks the way he faces', () => {
  const p = lensPose('back', anh, aim)
  // facing 0 = nhìn về -z.
  expect(p.pos[1]).toBeCloseTo(1.1, 1)
  expect(p.look[2]).toBeLessThan(p.pos[2] - 5)
  expect(Math.abs(p.look[0] - p.pos[0])).toBeLessThan(0.01)
})

test('dragging aims the back camera sideways and up', () => {
  const p = lensPose('back', anh, { yaw: 0.5, pitch: 0.3 })
  expect(p.look[0]).not.toBeCloseTo(p.pos[0], 1)
  expect(p.look[1]).toBeGreaterThan(p.pos[1])
})

test('the front camera is held out in front of Anh, looking back at his face', () => {
  const p = lensPose('front', anh, aim)
  expect(p.pos[2]).toBeLessThan(anh.z - 0.5)
  expect(p.look[2]).toBeCloseTo(anh.z, 1)
  expect(p.look[1]).toBeCloseTo(anh.head, 0)
})

test('a selfie on the bike steps back to fit Em too', () => {
  const solo = lensPose('front', anh, aim)
  const pair = lensPose('front', { ...anh, pair: true }, aim)
  expect(Math.hypot(pair.pos[0] - anh.x, pair.pos[2] - anh.z)).toBeGreaterThan(Math.hypot(solo.pos[0] - anh.x, solo.pos[2] - anh.z))
})
