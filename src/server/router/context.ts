// src/server/router/context.ts
import { initTRPC } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";

/**
 * No auth, no session, no database. Identity travels with each mutation as a
 * client-generated guest; station state lives in `../store`.
 */
export type Context = Record<string, never>;

export const createContext = async (
  _opts?: CreateNextContextOptions
): Promise<Context> => ({});

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;
