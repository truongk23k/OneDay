import { useSettings } from './engine'

afterEach(() => {
  useSettings.getState().setVolume('music', 0.6)
  useSettings.getState().setVolume('sfx', 1)
  useSettings.getState().setVolume('amb', 0.6)
})

test('volumes for music, effects and ambience start at sensible levels', () => {
  const v = useSettings.getState().volume
  expect(v.sfx).toBeGreaterThan(v.music)
  expect(v.sfx).toBeGreaterThan(v.amb)
})

test('changing a volume is kept, clamped to 0..1, and remembered on the device', () => {
  useSettings.getState().setVolume('music', 0.25)
  expect(useSettings.getState().volume.music).toBe(0.25)
  expect(localStorage.getItem('oneday.volume')).toContain('0.25')
  useSettings.getState().setVolume('amb', 3)
  expect(useSettings.getState().volume.amb).toBe(1)
  useSettings.getState().setVolume('amb', -1)
  expect(useSettings.getState().volume.amb).toBe(0)
})
