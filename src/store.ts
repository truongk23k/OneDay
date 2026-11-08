import { create } from 'zustand'

export type DebugStats = { fps: number; calls: number; triangles: number }

type GameState = {
  helpOpen: boolean
  paused: boolean
  setHelpOpen: (open: boolean) => void
  debugStats: DebugStats
  setDebugStats: (s: DebugStats) => void
}

export const useGame = create<GameState>()((set) => ({
  helpOpen: false,
  paused: false,
  setHelpOpen: (open) => set({ helpOpen: open, paused: open }),
  debugStats: { fps: 0, calls: 0, triangles: 0 },
  setDebugStats: (debugStats) => set({ debugStats }),
}))
