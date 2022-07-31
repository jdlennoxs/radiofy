// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { stationRouter } from "./station";
import { authRouter } from "./auth";
import { spotifyRouter } from "./spotify";
import { dashboardRouter } from "./dashboard";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("auth.", authRouter)
  .merge("dashboard.", dashboardRouter)
  .merge("station.", stationRouter)
  .merge("spotify.", spotifyRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
