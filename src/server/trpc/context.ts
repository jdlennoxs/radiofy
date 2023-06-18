import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import { IncomingMessage } from "http";
import { type Session } from "next-auth";
import { getSession } from "next-auth/react";
import ws from "ws";
import EventEmitter from "events";

import { prisma } from "../db/client";
import { spotifyApi as spotify } from "../spotify/client";

const eventEmitter = new EventEmitter();

type CreateContextOptions = {
  session: Session | null;
};

/** Use this helper for:
 * - testing, so we dont have to mock Next.js' req/res
 * - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 **/
export const createContextInner = async (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (
  opts:
    | trpcNext.CreateNextContextOptions
    | NodeHTTPCreateContextFnOptions<IncomingMessage, ws>
) => {
  const session = await getSession(opts);

  spotify.setAccessToken(session.accessToken);

  console.log("createContext for", session?.user?.name ?? "unknown user");

  return {
    session,
    spotify,
    prisma,
    eventEmitter,
  };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
