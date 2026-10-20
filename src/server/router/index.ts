// src/server/router/index.ts
import { createRouter } from "./context";
import { stationRouter } from "./station";

export const appRouter = createRouter({
  station: stationRouter,
});

export type AppRouter = typeof appRouter;
