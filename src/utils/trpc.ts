// src/utils/trpc.ts
import { createTRPCNext } from "@trpc/next";
import {
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  wsLink,
} from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../server/router";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.browser) return ""; // Browser should use current path
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

const getEndingLink = () => {
  const url = `${getBaseUrl()}/api/trpc`;

  if (typeof window === "undefined") {
    return httpBatchLink({
      url,
    });
  }

  const client = createWSClient({
    url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
  });

  return splitLink({
    condition(op) {
      return op.type === "subscription";
    },
    true: wsLink<AppRouter>({ client }),
    false: httpBatchLink({
      url,
    }),
  });
};

export const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      /**
       * @link https://trpc.io/docs/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === "development" &&
              typeof window !== "undefined") ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        getEndingLink(),
      ],
      /**
       * @link https://trpc.io/docs/data-transformers
       */
      transformer: superjson,
      /**
       * @link https://tanstack.com/query/latest/docs/react/reference/QueryClient
       */
      queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
      headers() {
        if (ctx?.req) {
          // on ssr, forward client's headers to the server
          return { ...ctx.req.headers, "x-ssr": "1" };
        }
        return {};
      },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
});

/**
 * Check out tRPC docs for Inference Helpers
 * https://trpc.io/docs/infer-types#inference-helpers
 */
