import { useSession } from "next-auth/react";
import { useSpotifyWebPlaybackSdk } from "../hooks/useSpotifyWebPlaybackSdk";
import Header from "./Header";

export default function Layout({ children }) {
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
