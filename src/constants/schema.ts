import { z } from "zod";

export const trackSchema = z.object({
  id: z.string(),
  source: z.literal("soundcloud"),
  /** SoundCloud permalink, e.g. https://soundcloud.com/artist/track */
  sourceId: z.string(),
  name: z.string(),
  artist: z.string(),
  artwork: z.string().optional(),
});

export type Track = z.infer<typeof trackSchema>;

export const playbackSchema = z.object({
  trackId: z.string().nullable(),
  /** epoch ms when the current track started (for late-joiner seeking) */
  startedAt: z.number(),
  isPlaying: z.boolean(),
});

export type Playback = z.infer<typeof playbackSchema>;

export const guestSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(32),
});

export type Guest = z.infer<typeof guestSchema>;

export const messageSchema = z.object({
  id: z.string(),
  stationId: z.string(),
  type: z.enum(["CHAT", "TRACK"]),
  created: z.string(),
  sender: guestSchema,
  chat: z.object({ body: z.string() }).optional(),
  track: trackSchema.optional(),
});

export type Message = z.infer<typeof messageSchema>;

export const stationIdSchema = z.object({ stationId: z.string() });

export const sendMessageSchema = z.object({
  stationId: z.string(),
  guest: guestSchema,
  message: z.string().min(1).max(500),
});

export const playTrackSchema = z.object({
  stationId: z.string(),
  guest: guestSchema,
  trackId: z.string(),
});

export const trackEndedSchema = z.object({
  stationId: z.string(),
  trackId: z.string(),
});

export const setPlayingSchema = z.object({
  stationId: z.string(),
  isPlaying: z.boolean(),
});

export const presenceSchema = z.object({
  stationId: z.string(),
  guestId: z.string(),
});
