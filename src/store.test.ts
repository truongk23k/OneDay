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
