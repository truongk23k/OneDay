import { dynamicColliders, useWorld } from './world'

beforeEach(() => useWorld.setState({ bathDoorOpen: true, water: { lavabo: false, sink: false, shower: false }, lightsOn: true }))

test('the bathroom door starts open and does not block the doorway', () => {
  expect(useWorld.getState().bathDoorOpen).toBe(true)
  expect(dynamicColliders()).toEqual([])
})

test('a closed bathroom door blocks the doorway', () => {
  useWorld.getState().toggleDoor()
  const [door] = dynamicColliders()
  expect(door.minX).toBeLessThanOrEqual(2.96)
  expect(door.maxX).toBeGreaterThanOrEqual(3.04)
  expect(door.minZ).toBeCloseTo(0.325)
  expect(door.maxZ).toBeCloseTo(1.125)
})

test('taps and lights toggle independently', () => {
  useWorld.getState().toggleWater('lavabo')
  expect(useWorld.getState().water).toEqual({ lavabo: true, sink: false, shower: false })
  useWorld.getState().toggleLights()
  expect(useWorld.getState().lightsOn).toBe(false)
})

test('the door will not close on Anh standing in the doorway', () => {
  expect(useWorld.getState().toggleDoor({ x: 3.1, z: 0.72 })).toBe(false)
  expect(useWorld.getState().bathDoorOpen).toBe(true)
  expect(useWorld.getState().toggleDoor({ x: 2.6, z: 0.72 })).toBe(true)
  expect(useWorld.getState().bathDoorOpen).toBe(false)
})

test('reset puts the room back to morning: door open, taps off, lights on', () => {
  const w = useWorld.getState()
  w.toggleDoor({ x: 2.6, z: 0.72 })
  w.toggleWater('shower')
  w.toggleLights()
  useWorld.getState().reset()
  expect(useWorld.getState().bathDoorOpen).toBe(true)
  expect(useWorld.getState().water).toEqual({ lavabo: false, sink: false, shower: false })
  expect(useWorld.getState().lightsOn).toBe(true)
})

test('the fridge opens and closes', () => {
  useWorld.getState().toggleFridge()
  expect(useWorld.getState().fridgeOpen).toBe(true)
  useWorld.getState().toggleFridge()
  expect(useWorld.getState().fridgeOpen).toBe(false)
})

test('Anh can sit down at his desk and stand up again; reset stands him up', () => {
  useWorld.getState().setSitting(true)
  expect(useWorld.getState().sitting).toBe(true)
  useWorld.getState().reset()
  expect(useWorld.getState().sitting).toBe(false)
  expect(useWorld.getState().fridgeOpen).toBe(false)
})

describe('moving interrupts actions', () => {
  test('walking cancels a running action (pull-ups, lying in, dancing…)', () => {
    useWorld.getState().play('pullup', 5)
    expect(useWorld.getState().interruptIfMoving(true)).toBe(true)
    expect(useWorld.getState().transient).toBeNull()
  })

  test('walking stands Anh up from the computer', () => {
    useWorld.getState().setSitting(true)
    expect(useWorld.getState().interruptIfMoving(true)).toBe(true)
    expect(useWorld.getState().sitting).toBe(false)
  })

  test('standing still changes nothing', () => {
    useWorld.getState().play('danceSpin', 5)
    expect(useWorld.getState().interruptIfMoving(false)).toBe(false)
    expect(useWorld.getState().transient?.pose).toBe('danceSpin')
  })

  test('an action that already finished does not count as interrupted', () => {
    useWorld.setState({ transient: { pose: 'drink', until: 0 } })
    expect(useWorld.getState().interruptIfMoving(true)).toBe(false)
  })
})
