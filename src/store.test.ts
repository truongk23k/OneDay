import { useGame } from './store'

describe('useGame', () => {
  afterEach(() => useGame.getState().setHelpOpen(false))

  test('opening help pauses the game', () => {
    useGame.getState().setHelpOpen(true)
    expect(useGame.getState().helpOpen).toBe(true)
    expect(useGame.getState().paused).toBe(true)
  })

  test('closing help resumes the game', () => {
    useGame.getState().setHelpOpen(true)
    useGame.getState().setHelpOpen(false)
    expect(useGame.getState().helpOpen).toBe(false)
    expect(useGame.getState().paused).toBe(false)
  })
})

describe('the map', () => {
  afterEach(() => {
    useGame.getState().setMapOpen(false)
    useGame.getState().setHelpOpen(false)
  })

  test('opening the map pauses; closing it resumes', () => {
    useGame.getState().setMapOpen(true)
    expect(useGame.getState().paused).toBe(true)
    useGame.getState().setMapOpen(false)
    expect(useGame.getState().paused).toBe(false)
  })

  test('closing help while the map is open stays paused', () => {
    useGame.getState().setMapOpen(true)
    useGame.getState().setHelpOpen(true)
    useGame.getState().setHelpOpen(false)
    expect(useGame.getState().paused).toBe(true)
  })
})
