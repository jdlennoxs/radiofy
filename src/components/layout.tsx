import { useSession } from "next-auth/react";
import { useSpotifyWebPlaybackSdk } from "../hooks/useSpotifyWebPlaybackSdk";
import Header from "./Header";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useSpotifyWebPlaybackSdk({
    name: "Radio Station",
    accessToken: (session as { accessToken?: string } | null)?.accessToken,
  });

  return (
    <>
      <main>
        <Header />
        {children}
      </main>
    </>
  );
}
