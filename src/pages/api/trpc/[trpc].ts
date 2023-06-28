import * as trpcNext from "@trpc/server/adapters/next";
// import { env } from "../../../env.mjs";
import { appRouter } from "../../../server/api/routers/_app";
import { createTRPCContext } from "../../../server/api/trpc";

// export API handler
// @see https://trpc.io/docs/server/adapters
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
          );
        }
      : undefined,
});
