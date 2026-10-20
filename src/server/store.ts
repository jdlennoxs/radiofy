import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import type { Guest, Message, Playback, Track } from "../constants/schema";
import { SEED_TRACKS } from "./seed";

/**
 * In-memory station state. Deliberately not persisted — this is a demo, and
 * the whole point of the SSE/one-process change (ADR-002) is that a single
 * process can own realtime fan-out without a database.
 *
 * Multi-instance deployment would need shared state (Redis/Postgres). Out of
 * scope; see ADR-003.
 */

export type Station = {
  id: string;
  name: string;
  description: string;
  playlist: Track[];
  messages: Message[];
  playback: Playback;
  listeners: Set<string>;
};

export type StationSummary = {
  id: string;
  name: string;
  description: string;
  listenerCount: number;
  playlistSize: number;
  nowPlaying: Track | null;
  /** Artwork for the top playlist entry — used as the station card cover. */
  coverArtwork: string | null;
};

export type StationView = StationSummary & {
  playlist: Track[];
  messages: Message[];
  playback: Playback;
};

const MAX_MESSAGES = 200;
const SYSTEM_SENDER: Guest = { id: "system", name: "Campfire" };

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

const stations = new Map<string, Station>();

function createStation(
  id: string,
  name: string,
  description: string,
  playlist: Track[]
): Station {
  return {
    id,
    name,
    description,
    playlist,
    messages: [],
    playback: { trackId: null, startedAt: Date.now(), isPlaying: false },
    listeners: new Set<string>(),
  };
}

stations.set(
  "campfire",
  createStation(
    "campfire",
    "Campfire Radio",
    "A shared listening room — anyone can pick the next track.",
    SEED_TRACKS
  )
);

stations.set(
  "lofi",
  createStation(
    "lofi",
    "Lo-fi Lounge",
    "Slow tempos, long afternoons.",
    SEED_TRACKS.filter((t) => ["Forss", "bonobo", "Tycho"].includes(t.artist))
  )
);

export function findTrack(station: Station, trackId: string | null): Track | null {
  if (!trackId) return null;
  return station.playlist.find((t) => t.id === trackId) ?? null;
}

function summarise(station: Station): StationSummary {
  return {
    id: station.id,
    name: station.name,
    description: station.description,
    listenerCount: station.listeners.size,
    playlistSize: station.playlist.length,
    nowPlaying: findTrack(station, station.playback.trackId),
    coverArtwork: station.playlist[0]?.artwork ?? null,
  };
}

export function listStations(): StationSummary[] {
  return Array.from(stations.values()).map(summarise);
}

export function getStation(id: string): StationView | null {
  const station = stations.get(id);
  if (!station) return null;
  return {
    ...summarise(station),
    playlist: station.playlist,
    messages: station.messages,
    playback: station.playback,
  };
}

function emitMessage(stationId: string, message: Message) {
  emitter.emit("message", stationId, message);
}

function emitPlayback(stationId: string, playback: Playback) {
  emitter.emit("playback", stationId, playback);
}

function emitPresence(station: Station) {
  emitter.emit("presence", station.id, station.listeners.size);
}

export function addMessage(
  stationId: string,
  input: { type: Message["type"]; sender: Guest; body?: string; track?: Track }
): void {
  const station = stations.get(stationId);
  if (!station) return;

  const message: Message = {
    id: randomUUID(),
    stationId,
    type: input.type,
    created: new Date().toISOString(),
    sender: input.sender,
    ...(input.body !== undefined ? { chat: { body: input.body } } : {}),
    ...(input.track !== undefined ? { track: input.track } : {}),
  };

  station.messages.push(message);
  if (station.messages.length > MAX_MESSAGES) {
    station.messages.splice(0, station.messages.length - MAX_MESSAGES);
  }
  emitMessage(stationId, message);
}

export function play(stationId: string, trackId: string, sender: Guest): void {
  const station = stations.get(stationId);
  if (!station) return;
  const track = findTrack(station, trackId);
  if (!track) return;

  station.playback = { trackId, startedAt: Date.now(), isPlaying: true };
  emitPlayback(stationId, station.playback);
  addMessage(stationId, { type: "TRACK", sender, track });
}

export function setPlaying(stationId: string, isPlaying: boolean): void {
  const station = stations.get(stationId);
  if (!station) return;
  station.playback = { ...station.playback, isPlaying };
  emitPlayback(stationId, station.playback);
}

/**
 * Advance to the next track in the playlist. `expectedTrackId` guards against
 * multiple clients reporting FINISH for the same track — only the first wins.
 */
export function advance(stationId: string, expectedTrackId?: string): void {
  const station = stations.get(stationId);
  if (!station) return;

  const current = station.playback.trackId;
  if (expectedTrackId && current !== expectedTrackId) return;

  const index = station.playlist.findIndex((t) => t.id === current);
  const next = station.playlist[(index + 1) % station.playlist.length];
  if (!next) return;

  station.playback = {
    trackId: next.id,
    startedAt: Date.now(),
    isPlaying: true,
  };
  emitPlayback(stationId, station.playback);
  addMessage(stationId, { type: "TRACK", sender: SYSTEM_SENDER, track: next });
}

export function addListener(stationId: string, guestId: string): void {
  const station = stations.get(stationId);
  if (!station) return;
  station.listeners.add(guestId);
  emitPresence(station);
}

export function removeListener(stationId: string, guestId: string): void {
  const station = stations.get(stationId);
  if (!station) return;
  station.listeners.delete(guestId);
  emitPresence(station);
}

export function onMessage(
  cb: (stationId: string, message: Message) => void
): () => void {
  const handler = (stationId: string, message: Message) => cb(stationId, message);
  emitter.on("message", handler);
  return () => emitter.off("message", handler);
}

export function onPlayback(
  cb: (stationId: string, playback: Playback) => void
): () => void {
  const handler = (stationId: string, playback: Playback) => cb(stationId, playback);
  emitter.on("playback", handler);
  return () => emitter.off("playback", handler);
}

export function onPresence(
  cb: (stationId: string, count: number) => void
): () => void {
  const handler = (stationId: string, count: number) => cb(stationId, count);
  emitter.on("presence", handler);
  return () => emitter.off("presence", handler);
}
