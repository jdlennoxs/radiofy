import { z } from "zod";

import { router, protectedProcedure } from "../trpc";

export const spotifyRouter = router({
  getDevices: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.spotify.getMyDevices();
  }),
  getUserPlaylists: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.spotify.getUserPlaylists({ limit: 50 });
  }),
  getPlaylist: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.id) return await ctx.spotify.getPlaylist(input.id);
      return [];
    }),
  isSavedTrack: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.spotify.containsMySavedTracks([input.id]);
    }),
  getPlaybackState: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.spotify.getMyCurrentPlaybackState();
  }),
  search: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await ctx.spotify.searchTracks(input);
  }),
  startPlayback: protectedProcedure
    .input(z.string().array().optional())
    .mutation(async ({ ctx, input }) => {
      console.log(input);
      return await ctx.spotify.play({ uris: input });
    }),
  stopPlayback: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.spotify.pause();
  }),
  setDevice: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return await ctx.spotify.transferMyPlayback([input]);
    }),
  setVolume: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      return await ctx.spotify.setVolume(input);
    }),
  addToSavedTracks: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.spotify.addToMySavedTracks([input.id]);
    }),
  removeFromSavedTracks: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.spotify.removeFromMySavedTracks([input.id]);
    }),
});
