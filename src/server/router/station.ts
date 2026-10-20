// src/server/router/station.ts
import { observable } from "@trpc/server/observable";
import { createRouter, publicProcedure } from "./context";
import {
  playTrackSchema,
  presenceSchema,
  sendMessageSchema,
  setPlayingSchema,
  stationIdSchema,
  trackEndedSchema,
  type Message,
  type Playback,
} from "../../constants/schema";
import * as store from "../store";

export const stationRouter = createRouter({
  list: publicProcedure.query(() => store.listStations()),

  get: publicProcedure
    .input(stationIdSchema)
    .query(({ input }) => store.getStation(input.stationId)),

  sendMessage: publicProcedure
    .input(sendMessageSchema)
    .mutation(({ input }) => {
      store.addMessage(input.stationId, {
        type: "CHAT",
        sender: input.guest,
        body: input.message,
      });
    }),

  play: publicProcedure.input(playTrackSchema).mutation(({ input }) => {
    store.play(input.stationId, input.trackId, input.guest);
  }),

  next: publicProcedure.input(stationIdSchema).mutation(({ input }) => {
    store.advance(input.stationId);
  }),

  setPlaying: publicProcedure
    .input(setPlayingSchema)
    .mutation(({ input }) => {
      store.setPlaying(input.stationId, input.isPlaying);
    }),

  trackEnded: publicProcedure
    .input(trackEndedSchema)
    .mutation(({ input }) => {
      store.advance(input.stationId, input.trackId);
    }),

  onMessage: publicProcedure
    .input(stationIdSchema)
    .subscription(({ input }) =>
      observable<Message>((emit) => {
        return store.onMessage((stationId, message) => {
          if (stationId === input.stationId) emit.next(message);
        });
      })
    ),

  onPlayback: publicProcedure
    .input(stationIdSchema)
    .subscription(({ input }) =>
      observable<Playback>((emit) => {
        return store.onPlayback((stationId, playback) => {
          if (stationId === input.stationId) emit.next(playback);
        });
      })
    ),

  onPresence: publicProcedure
    .input(presenceSchema)
    .subscription(({ input }) =>
      observable<number>((emit) => {
        store.addListener(input.stationId, input.guestId);
        emit.next(store.getStation(input.stationId)?.listenerCount ?? 0);

        const off = store.onPresence((stationId, count) => {
          if (stationId === input.stationId) emit.next(count);
        });

        return () => {
          off();
          store.removeListener(input.stationId, input.guestId);
        };
      })
    ),
});
