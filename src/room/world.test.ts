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
