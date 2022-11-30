import create, { State } from "zustand";
import { devtools } from "zustand/middleware";

const useQueueStore = create(
  devtools((set) => ({
    tracks: [],
    addTrack: (track) =>
      set((state) => ({
        tracks: Array.from(new Set(state.tracks).add(track)),
      })),
    reorderQueue: (queue) => set((state) => ({ tracks: queue })),
    removeTrack: (id) =>
      set((state) => ({
        tracks: state.tracks.filter((track) => track.id !== id),
      })),
    clearTracks: () => set({ tracks: [] }),
  }))
);

export default useQueueStore;
