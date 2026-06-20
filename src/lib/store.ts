import { create } from 'zustand'

interface AppState {
  isMovieModeActive: boolean
  setMovieModeActive: (active: boolean) => void
  currentMood: string | null
  setCurrentMood: (mood: string) => void
}

export const useAppStore = create<AppState>()((set) => ({
  isMovieModeActive: false,
  setMovieModeActive: (active) => set({ isMovieModeActive: active }),
  currentMood: null,
  setCurrentMood: (mood) => set({ currentMood: mood }),
}))
