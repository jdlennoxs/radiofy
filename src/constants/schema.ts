import z from "zod";

export const sendMessageSchema = z.object({
  stationId: z.string(),
  message: z.string(),
});

const messageSchema = z.object({
  id: z.string(),
  message: z.string(),
  stationId: z.string(),
  sentAt: z.date(),
  sender: z.object({
    name: z.string(),
  }),
});

export type Message = z.TypeOf<typeof messageSchema>;

export const stationSubscriptionSchema = z.object({
  stationId: z.string(),
});
