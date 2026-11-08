import { S } from '../strings'
import { mulberry32 } from './rng'
import type { Outfit, Weather } from './state'

export type Slot = 'top' | 'bottom' | 'shoes'
export type Item = { id: string; slot: Slot; color: string; disaster?: boolean }

// Tủ đồ của Anh (spec §6). Tên hiển thị nằm trong S.wardrobe.items.
export const WARDROBE: Item[] = [
  { id: 'teeRed', slot: 'top', color: '#d23c3c' },
  { id: 'teeBlack', slot: 'top', color: '#26272b' },
  { id: 'teeWhite', slot: 'top', color: '#f1f1ee' },
  { id: 'polo', slot: 'top', color: '#24345a' },
  { id: 'pyjama', slot: 'top', color: '#9fb7e0', disaster: true },
  { id: 'khaki', slot: 'bottom', color: '#c9b48a' },
  { id: 'shortsBlack', slot: 'bottom', color: '#2c2c30' },
  { id: 'floral', slot: 'bottom', color: '#e0569a', disaster: true },
  { id: 'sneakers', slot: 'shoes', color: '#f4f4f4' },
  { id: 'slides', slot: 'shoes', color: '#3a3a3a' },
  { id: 'honeycomb', slot: 'shoes', color: '#e8e2c8', disaster: true },
]

export const ICONS: Record<string, string> = {
  teeRed: '👕',
  teeBlack: '👕',
  teeWhite: '👕',
  polo: '👔',
  pyjama: '👚',
  khaki: '🩳',
  shortsBlack: '🩳',
  floral: '🩳',
  sneakers: '👟',
  slides: '🩴',
  honeycomb: '🩴',
  raincoat: '🧥',
  socks: '🧦',
  teddy: '🧸',
  towel: '🧣',
  jacket: '🥼',
  tie: '👔',
}

// Gợi ý cách mặc Em nhắn mỗi sáng; mặc đúng ý thì tâm trạng Em tăng.
export type Hint = { id: keyof typeof S.wardrobe.hints; match: (o: Outfit) => boolean }
export const HINTS: Hint[] = [
  { id: 'white', match: (o) => o.top === 'teeWhite' },
  { id: 'black', match: (o) => o.top === 'teeBlack' },
  { id: 'polo', match: (o) => o.top === 'polo' },
  { id: 'khaki', match: (o) => o.bottom === 'khaki' },
  { id: 'noHoneycomb', match: (o) => o.shoes !== 'honeycomb' },
]

export const JUNK = ['socks', 'teddy', 'towel', 'jacket', 'tie'] as const
export type Junk = (typeof JUNK)[number]

export type PileCard = { kind: 'item' | 'junk' | 'raincoat'; id: string; rot: number }

// Tủ bừa bộn: đồ thật lẫn đồ tào lao, xáo trộn và nghiêng ngả theo seed.
export function wardrobePile(seed: number): PileCard[] {
  const rnd = mulberry32(seed ^ 0x5eed)
  const cards: PileCard[] = [
    ...WARDROBE.map((i) => ({ kind: 'item' as const, id: i.id, rot: 0 })),
    ...JUNK.map((id) => ({ kind: 'junk' as const, id, rot: 0 })),
    { kind: 'raincoat' as const, id: 'raincoat', rot: 0 },
  ]
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards.map((c) => ({ ...c, rot: Math.round((rnd() - 0.5) * 16) }))
}

export function itemById(id: string): Item {
  const item = WARDROBE.find((i) => i.id === id)
  if (!item) throw new Error(`unknown wardrobe item ${id}`)
  return item
}

export const itemLabel = (id: string) => S.wardrobe.items[id as keyof typeof S.wardrobe.items]

export function outfitVerdict(o: Outfit, weather: Weather) {
  const worn = [o.top, o.bottom, o.shoes].map(itemById)
  const firstDisaster = worn.find((i) => i.disaster)
  return {
    disaster: firstDisaster !== undefined,
    wetRisk: weather === 'rain' && !o.raincoat,
    emComment: firstDisaster ? S.wardrobe.emComments[firstDisaster.id as keyof typeof S.wardrobe.emComments] : null,
  }
}
