// src/server/router/index.ts
import { createRouter } from "./context";

import { stationRouter } from "./station";
import { authRouter } from "./auth";
import { spotifyRouter } from "./spotify";
import { dashboardRouter } from "./dashboard";

export const appRouter = createRouter({
  auth: authRouter,
  dashboard: dashboardRouter,
  station: stationRouter,
  spotify: spotifyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
