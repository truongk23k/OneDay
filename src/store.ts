import { create } from 'zustand'

export type DebugStats = { fps: number; calls: number; triangles: number }

type GameState = {
  helpOpen: boolean
  mapOpen: boolean
  // Tạm dừng khi đang mở hướng dẫn hoặc bản đồ lớn.
  paused: boolean
  setHelpOpen: (open: boolean) => void
  setMapOpen: (open: boolean) => void
  debugStats: DebugStats
  setDebugStats: (s: DebugStats) => void
}

export const useGame = create<GameState>()((set, get) => ({
  helpOpen: false,
  mapOpen: false,
  paused: false,
  setHelpOpen: (open) => set({ helpOpen: open, paused: open || get().mapOpen }),
  setMapOpen: (open) => set({ mapOpen: open, paused: open || get().helpOpen }),
  debugStats: { fps: 0, calls: 0, triangles: 0 },
  setDebugStats: (debugStats) => set({ debugStats }),
}))
