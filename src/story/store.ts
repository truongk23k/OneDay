import { create } from 'zustand'
import { useGame } from '../store'
import { initialState, reducer, type Action, type StoryState } from './state'

type Store = {
  s: StoryState
  dispatch: (a: Action) => void
  tick: (realDt: number) => void
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31)

export const useStory = create<Store>()((set, get) => ({
  s: initialState(newSeed()),
  dispatch: (a) => set({ s: reducer(get().s, a) }),
  tick: (realDt) => {
    if (useGame.getState().paused) return
    set({ s: reducer(get().s, { type: 'tick', realDt }) })
  },
}))
