import { DPR_CAP, hasWebGL2, pickQuality } from './device'

describe('pickQuality', () => {
  test('touch with 3 GB RAM is low', () => {
    expect(pickQuality({ isTouch: true, memoryGB: 3, cores: 8 })).toBe('low')
  })

  test('touch with 4 cores is low', () => {
    expect(pickQuality({ isTouch: true, memoryGB: 8, cores: 4 })).toBe('low')
  })

  test('other touch devices are medium', () => {
    expect(pickQuality({ isTouch: true, memoryGB: 8, cores: 8 })).toBe('medium')
  })

  test('touch with unknown memory and cores is medium (iPhone Safari reports neither)', () => {
    expect(pickQuality({ isTouch: true })).toBe('medium')
  })

  test('desktop with 4 cores is medium', () => {
    expect(pickQuality({ isTouch: false, cores: 4 })).toBe('medium')
  })

  test('other desktops are high', () => {
    expect(pickQuality({ isTouch: false, cores: 12 })).toBe('high')
    expect(pickQuality({ isTouch: false })).toBe('high')
  })
})

test('DPR caps follow the spec', () => {
  expect(DPR_CAP).toEqual({ low: 1, medium: 1.5, high: 2 })
})

describe('hasWebGL2', () => {
  const fakeCanvas = (ctx: unknown) => () => ({ getContext: () => ctx }) as unknown as HTMLCanvasElement

  test('true when the canvas gives a webgl2 context', () => {
    expect(hasWebGL2(fakeCanvas({}))).toBe(true)
  })

  test('false when the canvas returns null', () => {
    expect(hasWebGL2(fakeCanvas(null))).toBe(false)
  })

  test('false when getContext throws', () => {
    const throwing = () =>
      ({
        getContext: () => {
          throw new Error('blocked')
        },
      }) as unknown as HTMLCanvasElement
    expect(hasWebGL2(throwing)).toBe(false)
  })
})
