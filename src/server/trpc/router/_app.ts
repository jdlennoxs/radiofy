import { router } from "../trpc";
import { authRouter } from "./auth";

import { stationRouter } from "./station";
import { spotifyRouter } from "./spotify";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  station: stationRouter,
  spotify: spotifyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
