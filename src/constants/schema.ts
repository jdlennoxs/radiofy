import z from "zod";

export const MessageEnum = z.enum(["Track", "Text"]);

export const sendMessageSchema = z.object({
  stationId: z.string(),
  message: z.string(),
});

const messageSchema = z.object({
  id: z.string(),
  chat: z.object({ body: z.string() }),
  stationId: z.string(),
  sentAt: z.date(),
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
