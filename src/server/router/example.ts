import { createRouter } from "./context";
import { z } from "zod";
import { spotifyClient } from "./spotify-client";

export const exampleRouter = createRouter()
  .query("hello", {
    input: z
      .object({
        text: z.string().nullish(),
      })
      .nullish(),
    resolve({ input }) {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    },
  })
  .query("getAll", {
    async resolve({ ctx }) {
      return await ctx.prisma.example.findMany();
    },
  })
  .query("getNowPlaying", {
    input: z.object({ accessToken: z.string() }),
    async resolve({ input }) {
      return await spotifyClient(input).get("/me/player/currentlyPlaying");
    },
  });
