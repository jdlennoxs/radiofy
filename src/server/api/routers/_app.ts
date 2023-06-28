import { z } from "zod";
import { procedure, router } from "../trpc";
import { dashboardRouter } from "./dashboard";
import { stationRouter } from "./station";

export const appRouter = router({
  dashboard: dashboardRouter,
  station: stationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
