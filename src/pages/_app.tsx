// src/pages/_app.tsx
import type { AppType } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import SpotifyPlayer from "../components/layout";
import { trpc } from "../utils/trpc";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <SpotifyPlayer>
        <Component {...pageProps} />
      </SpotifyPlayer>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
