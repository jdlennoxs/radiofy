// src/pages/_app.tsx
import { type Session } from "next-auth";
import { getSession, SessionProvider, signIn } from "next-auth/react";
import { type AppType } from "next/app";
import { useEffect } from "react";
import SpotifyPlayer from "../components/layout";
import "../styles/globals.css";
import { trpc } from "../utils/trpc";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn(); // Force sign in to hopefully resolve error
    }
  }, [session]);

  return (
    <SessionProvider session={session}>
      <SpotifyPlayer>
        <Component {...pageProps} />
      </SpotifyPlayer>
    </SessionProvider>
  );
};

MyApp.getInitialProps = async ({ ctx }) => {
  return {
    session: await getSession(ctx),
  };
};

export default trpc.withTRPC(MyApp);
