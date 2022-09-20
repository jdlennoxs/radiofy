import { createRouter } from "./context";
import {
  Message,
  sendMessageSchema,
  stationSubscriptionSchema,
} from "../../constants/schema";
import { Events } from "../../constants/events";
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
        include: {
          messages: {
            include: {
              chat: true,
              track: true,
              sender: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
            take: 100,
            orderBy: { created: "asc" },
          },
        },
      });
    },
  })
  .mutation("send-message", {
    input: sendMessageSchema,
    async resolve({ ctx, input }) {
      const userId = ctx.session?.user?.id as string;
      if (userId) {
        const message = await prisma?.message.create({
          data: {
            type: "CHAT",
            created: new Date().toISOString(),
            station: {
              connect: {
                id: input.stationId,
              },
            },
            sender: {
              connect: {
                id: userId,
              },
            },
            chat: {
              create: {
                body: input.message,
              },
            },
          },
          include: {
            chat: { select: { body: true } },
            track: true,
            sender: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        });

        ctx.eventEmitter.emit(Events.SEND_MESSAGE, message);
      }
    },
  })
  .subscription("onSendMessage", {
    input: stationSubscriptionSchema,
    resolve({ ctx, input }) {
      return new trpc.Subscription<Message>((emit) => {
        function onMessage(data: Message) {
          console.log(data);
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
