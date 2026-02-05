import { create } from "zustand";
import { devtools } from "zustand/middleware";

type QueueTrack = {
  id: string;
  name?: string;
  album?: {
    images?: { url: string }[];
  };
  artists?: { name: string }[];
  [key: string]: unknown;
};

type QueueState = {
  tracks: QueueTrack[];
  addTrack: (track: QueueTrack) => void;
  reorderQueue: (queue: QueueTrack[]) => void;
  removeTrack: (id: string) => void;
  clearTracks: () => void;
};

const useQueueStore = create<QueueState>()(
  devtools((set) => ({
    tracks: [],
    addTrack: (track) =>
      set((state) => ({
        tracks: Array.from(new Set(state.tracks).add(track)),
      })),
    reorderQueue: (queue) => set(() => ({ tracks: queue })),
    removeTrack: (id) =>
      set((state) => ({
        tracks: state.tracks.filter((track) => track.id !== id),
      })),
    clearTracks: () => set({ tracks: [] }),
  }))
);

export default useQueueStore;
