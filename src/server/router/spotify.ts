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
  .query("getCurrentTrack", {
    async resolve({ ctx }) {
      // spotifyApi.setAccessToken(ctx.session.accessToken);
      return await ctx.spotify.getMyCurrentPlayingTrack();
    },
  })
  .mutation("startPlayback", {
    input: z.string().array(),
    async resolve({ ctx, input }) {
      return await ctx.spotify.play({ uris: input });
    },
  });
