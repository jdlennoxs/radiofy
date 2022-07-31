import { createRouter } from "./context";
import {
  Message,
  sendMessageSchema,
  stationSubscriptionSchema,
} from "../../constants/schema";
import { Events } from "../../constants/events";
import { randomUUID } from "crypto";
import * as trpc from "@trpc/server";
import { z } from "zod";

export const stationRouter = createRouter()
  .query("getStation", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input, ctx }) {
      return ctx.prisma.station.findUnique({
        where: {
          id: input.id,
        },
      });
    },
  })
  .mutation("send-message", {
    input: sendMessageSchema,
    resolve({ ctx, input }) {
      const message: Message = {
        id: randomUUID(),
        ...input,
        sentAt: new Date(),
        sender: {
          name: ctx.session?.user?.name || "anonymous",
        },
      };

      ctx.eventEmitter.emit(Events.SEND_MESSAGE, message);
    },
  })
  .subscription("onSendMessage", {
    input: stationSubscriptionSchema,
    resolve({ ctx, input }) {
      return new trpc.Subscription<Message>((emit) => {
        function onMessage(data: Message) {
          if (input.stationId === data.stationId) {
            emit.data(data);
          }
        }

        ctx.eventEmitter.on(Events.SEND_MESSAGE, onMessage);

        return () => {
          ctx.eventEmitter.off(Events.SEND_MESSAGE, onMessage);
        };
      });
    },
  });
