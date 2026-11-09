import { initialState } from '../../story/state'
import { useStory } from '../../story/store'
import { usePc } from './pcStore'

const pc = () => usePc.getState()

beforeEach(() => {
  useStory.setState({ s: { ...initialState(1), phase: 'room' } })
  pc().reset()
})

test('the computer starts on the desktop with nothing open', () => {
  expect(pc().win).toBeNull()
  expect(pc().running).toEqual([])
})

test('Chrome opens on the search home page', () => {
  pc().launch('chrome')
  expect(pc().win).toBe('chrome')
  expect(pc().page).toEqual({ site: 'home', q: '' })
})

test('Face bút, Tin tức and Mail open as pages inside Chrome; back returns to the page before', () => {
  pc().launch('face')
  expect(pc().win).toBe('chrome')
  expect(pc().page.site).toBe('face')
  pc().launch('news')
  expect(pc().page.site).toBe('news')
  pc().back()
  expect(pc().page.site).toBe('face')
})

test('searching opens a results page that remembers the query', () => {
  pc().launch('chrome')
  pc().browse('search', 'thời tiết hôm nay')
  expect(pc().page).toEqual({ site: 'search', q: 'thời tiết hôm nay' })
})

test('Mes opens in its own window', () => {
  pc().launch('mes')
  expect(pc().win).toBe('mes')
  expect(pc().running).toEqual(['mes'])
})

test('minimising keeps the window running; its taskbar button brings it back, a second press hides it', () => {
  pc().launch('news')
  pc().minimize()
  expect(pc().win).toBeNull()
  expect(pc().running).toContain('chrome')
  pc().focus('chrome')
  expect(pc().win).toBe('chrome')
  expect(pc().page.site).toBe('news')
  pc().focus('chrome')
  expect(pc().win).toBeNull()
})

test('closing Chrome forgets its pages', () => {
  pc().launch('mail')
  pc().closeWin()
  expect(pc().running).toEqual([])
  pc().launch('chrome')
  expect(pc().page.site).toBe('home')
  expect(pc().history).toEqual([])
})

test('a new morning starts the computer fresh', () => {
  pc().launch('mes')
  useStory.getState().dispatch({ type: 'restart', seed: 7 })
  expect(pc().running).toEqual([])
})
