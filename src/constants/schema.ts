import z from "zod";

export const MessageEnum = z.enum(["Track", "Text"]);

export const sendMessageSchema = z.object({
  stationId: z.string(),
  message: z.string(),
});

export const playTrackSchema = z.object({
  stationId: z.string(),
  track: z.any(),
});

const messageSchema = z.object({
  id: z.string(),
  chat: z.object({ body: z.string() }).optional(),
  created: z.date(),
  stationId: z.string(),
  type: z.enum(["CHAT", "TRACK"]),
  track: z
    .object({
      id: z.string(),
      albumImage: z.string(),
      name: z.string(),
      artists: z.string(),
    })
    .optional(),
  sender: z.object({
    name: z.string(),
    id: z.string(),
  }),
});

export type Message = z.TypeOf<typeof messageSchema>;

const trackSchema = z.object({
  id: z.string(),
  albumImageUrl: z.string(),
  name: z.string(),
  artists: z.string().array(),
});

export type Track = z.TypeOf<typeof trackSchema>;

export const stationSubscriptionSchema = z.object({
  stationId: z.string(),
});
