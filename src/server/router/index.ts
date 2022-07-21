// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { stationRouter } from "./station";
import { authRouter } from "./auth";
import { spotifyRouter } from "./spotify";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("auth.", authRouter)
  .merge("station.", stationRouter);
// .merge("spotify.", spotifyRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
