import { create } from 'zustand'
import { S } from '../strings'
import { itemById, type PileCard } from './outfit'
import type { Outfit } from './state'

type Draft = {
  draft: Outfit
  junkLine: string | null
  reset: (o: Outfit) => void
  // Trả về 'junk' khi lỡ lôi ra đồ tào lao (để trừ thời gian bên câu chuyện).
  pick: (c: PileCard) => 'junk' | 'ok'
  isPicked: (c: PileCard) => boolean
}

// Bộ đồ đang chọn trong tủ: dùng chung giữa quần áo 3D (bấm để chọn) và bảng chữ phía trên.
export const useDraft = create<Draft>()((set, get) => ({
  draft: { top: 'pyjama', bottom: 'floral', shoes: 'honeycomb', raincoat: false },
  junkLine: null,
  reset: (o) => set({ draft: o, junkLine: null }),
  pick: (c) => {
    const { draft } = get()
    if (c.kind === 'junk') {
      set({ junkLine: S.wardrobe.junkLines[c.id as keyof typeof S.wardrobe.junkLines] })
      return 'junk'
    }
    if (c.kind === 'raincoat') set({ draft: { ...draft, raincoat: !draft.raincoat }, junkLine: null })
    else set({ draft: { ...draft, [itemById(c.id).slot]: c.id }, junkLine: null })
    return 'ok'
  },
  isPicked: (c) => {
    const { draft } = get()
    if (c.kind === 'raincoat') return draft.raincoat
    return c.kind === 'item' && draft[itemById(c.id).slot] === c.id
  },
}))
