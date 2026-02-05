import { createRouter, publicProcedure } from "./context";
import { z } from "zod";

export const spotifyRouter = createRouter({
  getDevices: publicProcedure.query(async ({ ctx }) => {
    return ctx.spotify.getMyDevices();
  }),
  getUserPlaylists: publicProcedure.query(async ({ ctx }) => {
    return ctx.spotify.getUserPlaylists({ limit: 50 });
  }),
  getPlaylist: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.spotify.getPlaylist(input.id);
    }),
  isSavedTrack: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.spotify.containsMySavedTracks([input.id]);
    }),
  getPlaybackState: publicProcedure.query(async ({ ctx }) => {
    return ctx.spotify.getMyCurrentPlaybackState();
  }),
  search: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.spotify.searchTracks(input);
  }),
  startPlayback: publicProcedure
    .input(z.string().array().optional())
    .mutation(async ({ ctx, input }) => {
      return ctx.spotify.play({ uris: input });
    }),
  stopPlayback: publicProcedure.mutation(async ({ ctx }) => {
    return ctx.spotify.pause();
  }),
  setDevice: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.spotify.transferMyPlayback([input]);
  }),
  setVolume: publicProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    return ctx.spotify.setVolume(input);
  }),
  addToSavedTracks: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.spotify.addToMySavedTracks([input.id]);
    }),
  removeFromSavedTracks: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.spotify.removeFromMySavedTracks([input.id]);
    }),
});
