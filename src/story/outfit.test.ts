import { PYJAMAS, initialState, reducer, type StoryState } from './state'
import { HINTS, WARDROBE, itemById, outfitVerdict, wardrobePile } from './outfit'

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

describe('Em dress hint and the messy wardrobe', () => {
  test('every run gets one of Em’s hints, the same for the same seed', () => {
    const a = initialState(11)
    expect(a.hint).toBeGreaterThanOrEqual(0)
    expect(a.hint).toBeLessThan(HINTS.length)
    expect(initialState(11).hint).toBe(a.hint)
  })

  test('hints check the outfit', () => {
    const white = HINTS.find((h) => h.id === 'white')!
    expect(white.match({ ...office, top: 'teeWhite' })).toBe(true)
    expect(white.match(office)).toBe(false)
    const noHoneycomb = HINTS.find((h) => h.id === 'noHoneycomb')!
    expect(noHoneycomb.match(office)).toBe(true)
    expect(noHoneycomb.match({ ...office, shoes: 'honeycomb' })).toBe(false)
  })

  test('dressing to Em’s hint lifts her mood by 10, once', () => {
    const hintIndex = HINTS.findIndex((h) => h.id === 'white')
    const s = { ...room(), hint: hintIndex }
    const a = reducer(s, { type: 'dress', outfit: { ...office, top: 'teeWhite' } })
    expect(a.mood).toBe(s.mood + 10)
    expect(reducer(a, { type: 'dress', outfit: { ...office, top: 'teeWhite' } }).mood).toBe(a.mood)
    expect(reducer(s, { type: 'dress', outfit: office }).mood).toBe(s.mood)
  })

  test('rummaging into junk costs half a minute and says something', () => {
    const a = reducer(room(), { type: 'junk', id: 'socks' })
    expect(a.minutes).toBe(450.5)
    expect(a.line).toBeTruthy()
  })

  test('the pile mixes every wardrobe item with junk, shuffled per seed', () => {
    const pile = wardrobePile(3)
    expect(pile.filter((c) => c.kind === 'item')).toHaveLength(WARDROBE.length)
    expect(pile.some((c) => c.kind === 'junk')).toBe(true)
    expect(pile.some((c) => c.kind === 'raincoat')).toBe(true)
    expect(wardrobePile(3).map((c) => c.id)).toEqual(pile.map((c) => c.id))
    expect(wardrobePile(4).map((c) => c.id)).not.toEqual(pile.map((c) => c.id))
  })
})
