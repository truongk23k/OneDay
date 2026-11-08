import { PYJAMAS } from './state'
import { useDraft } from './wardrobeDraft'

beforeEach(() => useDraft.getState().reset(PYJAMAS))

test('reset starts from what Anh is wearing', () => {
  expect(useDraft.getState().draft).toEqual(PYJAMAS)
  expect(useDraft.getState().junkLine).toBeNull()
})

test('picking a garment puts it in its slot', () => {
  useDraft.getState().pick({ kind: 'item', id: 'teeWhite', rot: 0 })
  useDraft.getState().pick({ kind: 'item', id: 'khaki', rot: 0 })
  expect(useDraft.getState().draft).toEqual({ ...PYJAMAS, top: 'teeWhite', bottom: 'khaki' })
})

test('picking the raincoat toggles it', () => {
  useDraft.getState().pick({ kind: 'raincoat', id: 'raincoat', rot: 0 })
  expect(useDraft.getState().draft.raincoat).toBe(true)
  useDraft.getState().pick({ kind: 'raincoat', id: 'raincoat', rot: 0 })
  expect(useDraft.getState().draft.raincoat).toBe(false)
})

test('picking junk reports it and shows its line, without changing clothes', () => {
  const r = useDraft.getState().pick({ kind: 'junk', id: 'socks', rot: 0 })
  expect(r).toBe('junk')
  expect(useDraft.getState().junkLine).toMatch(/tất/i)
  expect(useDraft.getState().draft).toEqual(PYJAMAS)
})

test('isPicked tells which pieces are selected', () => {
  useDraft.getState().pick({ kind: 'item', id: 'polo', rot: 0 })
  const { isPicked } = useDraft.getState()
  expect(isPicked({ kind: 'item', id: 'polo', rot: 0 })).toBe(true)
  expect(isPicked({ kind: 'item', id: 'teeRed', rot: 0 })).toBe(false)
})
