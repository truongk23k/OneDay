import { createKeyTracker } from './input'

describe('createKeyTracker', () => {
  test('W gives forward', () => {
    const k = createKeyTracker()
    k.down('KeyW')
    expect(k.vector()).toEqual({ x: 0, y: 1 })
  })

  test('arrow keys work like WASD', () => {
    const k = createKeyTracker()
    k.down('ArrowLeft')
    expect(k.vector()).toEqual({ x: -1, y: 0 })
  })

  test('W+D gives (1,1)', () => {
    const k = createKeyTracker()
    k.down('KeyW')
    k.down('KeyD')
    expect(k.vector()).toEqual({ x: 1, y: 1 })
  })

  test('opposite keys cancel', () => {
    const k = createKeyTracker()
    k.down('KeyA')
    k.down('KeyD')
    expect(k.vector()).toEqual({ x: 0, y: 0 })
  })

  test('releasing a key stops that direction', () => {
    const k = createKeyTracker()
    k.down('KeyS')
    k.up('KeyS')
    expect(k.vector()).toEqual({ x: 0, y: 0 })
  })

  test('clear() releases held keys', () => {
    const k = createKeyTracker()
    k.down('KeyW')
    k.down('KeyD')
    k.clear()
    expect(k.vector()).toEqual({ x: 0, y: 0 })
  })
})
