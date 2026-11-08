import { PYJAMAS, initialState, reducer, type StoryState } from './state'
import { WARDROBE, itemById, outfitVerdict } from './outfit'

const room = (): StoryState => ({ ...initialState(1), phase: 'room' })
const office = { top: 'teeBlack', bottom: 'khaki', shoes: 'sneakers', raincoat: false }

test('the wardrobe has the spec items: 4 normal tops, 2 shorts, 2 shoes, plus the disasters', () => {
  const by = (slot: string, disaster: boolean) => WARDROBE.filter((i) => i.slot === slot && !!i.disaster === disaster)
  expect(by('top', false)).toHaveLength(4)
  expect(by('bottom', false)).toHaveLength(2)
  expect(by('shoes', false)).toHaveLength(2)
  expect(WARDROBE.filter((i) => i.disaster).map((i) => i.id)).toEqual(['pyjama', 'floral', 'honeycomb'])
})

test('Anh starts in pyjamas, which are all wardrobe items', () => {
  expect(itemById(PYJAMAS.top).slot).toBe('top')
  expect(itemById(PYJAMAS.bottom).slot).toBe('bottom')
  expect(itemById(PYJAMAS.shoes).slot).toBe('shoes')
})

test('pyjama top → disaster', () => {
  expect(outfitVerdict({ ...office, top: 'pyjama' }, 'sun').disaster).toBe(true)
})

test('rain without raincoat → wet risk', () => {
  expect(outfitVerdict(office, 'rain').wetRisk).toBe(true)
  expect(outfitVerdict({ ...office, raincoat: true }, 'rain').wetRisk).toBe(false)
  expect(outfitVerdict(office, 'sun').wetRisk).toBe(false)
})

test('a normal outfit gets no comment from Em', () => {
  expect(outfitVerdict(office, 'sun').emComment).toBeNull()
  expect(outfitVerdict({ ...office, shoes: 'honeycomb' }, 'sun').emComment).toBeTruthy()
})

test('dressing applies the hygiene bonus once, and not for a disaster outfit', () => {
  const a = reducer(room(), { type: 'dress', outfit: office })
  expect(a.tasks.dressed).toBe(true)
  expect(a.hygiene).toBe(35)
  expect(reducer(a, { type: 'dress', outfit: office }).hygiene).toBe(35)
  const b = reducer(room(), { type: 'dress', outfit: { ...office, bottom: 'floral' } })
  expect(b.tasks.dressed).toBe(true)
  expect(b.hygiene).toBe(20)
})
