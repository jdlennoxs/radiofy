import { createRouter } from "./context";
import { z } from "zod";

export const spotifyRouter = createRouter()
  .query("getDevices", {
    async resolve({ ctx }) {
      return await ctx.spotify.getMyDevices();
    },
  })
  .query("getCurrentTrack", {
    async resolve({ ctx }) {
      // spotifyApi.setAccessToken(ctx.session.accessToken);
      return await ctx.spotify.getMyCurrentPlayingTrack();
    },
  });
