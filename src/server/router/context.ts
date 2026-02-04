// src/server/router/context.ts
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import EventEmitter from "events";
import { IncomingMessage } from "http";
import { getSession } from "next-auth/react";
import { WebSocket } from "ws";
import superjson from "superjson";

import { authOptions as nextAuthOptions } from "../../pages/api/auth/[...nextauth]";
import { prisma } from "../db/client";
import { spotifyApi as spotify } from "../spotify/client";

const eventEmitter = new EventEmitter();

export const createContext = async (
  opts?:
    | CreateNextContextOptions
    | CreateWSSContextFnOptions
) => {
  const req = opts?.req;
  const res = opts?.res;

  const session = req && res ? await getSession({ req }) : null;

  const accessToken = (session as { accessToken?: string } | null)
    ?.accessToken;
  if (accessToken) {
    spotify.setAccessToken(accessToken);
  }

  return {
    req,
    res,
    session,
    spotify,
    prisma,
    eventEmitter,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});
