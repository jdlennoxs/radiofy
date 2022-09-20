import { createRouter } from "./context";
import { z } from "zod";

export const spotifyRouter = createRouter()
  .query("getDevices", {
    async resolve({ ctx }) {
      return await ctx.spotify.getMyDevices();
    },
  })
  .query("getUserPlaylists", {
    async resolve({ ctx }) {
      return await ctx.spotify.getUserPlaylists();
    },
  })
  .query("getPlaylist", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      return await ctx.spotify.getPlaylist(input.id);
    },
  })
  .query("isSavedTrack", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      return await ctx.spotify.containsMySavedTracks([input.id]);
    },
  })
  .query("getPlaybackState", {
    async resolve({ ctx }) {
      return await ctx.spotify.getMyCurrentPlaybackState();
    },
  })
  .query("search", {
    input: z.string(),
    async resolve({ ctx, input }) {
      return await ctx.spotify.searchTracks(input);
    },
  })
  .mutation("startPlayback", {
    input: z.string().array().optional(),
    async resolve({ ctx, input }) {
      return await ctx.spotify.play({ uris: input });
    },
  })
  .mutation("stopPlayback", {
    async resolve({ ctx }) {
      return await ctx.spotify.pause();
    },
  })
  .mutation("setDevice", {
    input: z.string(),
    async resolve({ ctx, input }) {
      return await ctx.spotify.transferMyPlayback([input]);
    },
  })
  .mutation("setVolume", {
    input: z.number(),
    async resolve({ ctx, input }) {
      return await ctx.spotify.setVolume(input);
    },
  })
  .mutation("addToSavedTracks", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      console.log(input);
      return await ctx.spotify.addToMySavedTracks([input.id]);
    },
  })
  .mutation("removeFromSavedTracks", {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      return await ctx.spotify.removeFromMySavedTracks([input.id]);
    },
  });
