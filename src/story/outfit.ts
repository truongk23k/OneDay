import { S } from '../strings'
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
