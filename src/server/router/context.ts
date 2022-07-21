// src/server/router/context.ts
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { NodeHTTPCreateContextFnOptions } from "@trpc/server/dist/declarations/src/adapters/node-http";
import EventEmitter from "events";
import { IncomingMessage } from "http";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { getSession } from "next-auth/react";
import { WebSocket } from "ws";

import { authOptions as nextAuthOptions } from "../../pages/api/auth/[...nextauth]";
import { prisma } from "../db/client";

const eventEmitter = new EventEmitter();

export const createContext = async (
  opts?:
    | trpcNext.CreateNextContextOptions
    | NodeHTTPCreateContextFnOptions<IncomingMessage, WebSocket>
) => {
  const req = opts?.req;
  const res = opts?.res;

  const session = req && res && (await getSession({ req }));

  return {
    req,
    res,
    session,
    prisma,
    eventEmitter,
  };
};

type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => trpc.router<Context>();
