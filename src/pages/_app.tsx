// src/pages/_app.tsx
import { SessionProvider } from "next-auth/react";
import type { AppType } from "next/dist/shared/lib/utils";
import SpotifyPlayer from "../components/layout";
import "../styles/globals.css";
import { api } from "../utils/api";

const MyApp: AppType = ({
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
export default api.withTRPC(MyApp);
