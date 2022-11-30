import { createRouter } from "./context";
import {
  Message,
  playTrackSchema,
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
          playbackContext: true,
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
  })
  .mutation("play", {
    input: playTrackSchema,
    async resolve({ ctx, input }) {
      const userId = ctx.session?.user?.id as string;
      if (userId) {
        const track = await prisma?.message.create({
          data: {
            type: "TRACK",
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
            track: {
              connectOrCreate: {
                where: {
                  id: input.track.id,
                },
                create: {
                  id: input.track.id,
                  albumImage: input.track.album.images[0].url,
                  name: input.track.name,
                  artists: input.track.artists
                    .map((artist) => artist.name)
                    .join(", "),
                },
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
        await prisma.playbackContext.update({
          where: {
            stationId: input.stationId,
          },
          data: {
            trackId: track.trackId,
            startTime: Math.floor(Date.now() / 1000),
            isPlaying: true,
          },
        });
        ctx.eventEmitter.emit(Events.PLAY_TRACK, track.trackId);
        ctx.eventEmitter.emit(Events.SEND_MESSAGE, track);
      }
    },
  })
  .subscription("onPlay", {
    resolve({ ctx }) {
      return new trpc.Subscription<any>((emit) => {
        function onPlay(data: any) {
          emit.data("goes to front end");
          ctx.spotify.play({ uris: [`spotify:track:${data}`] });
        }

        ctx.eventEmitter.on(Events.PLAY_TRACK, onPlay);

        return () => {
          ctx.eventEmitter.off(Events.PLAY_TRACK, onPlay);
        };
      });
    },
  });
