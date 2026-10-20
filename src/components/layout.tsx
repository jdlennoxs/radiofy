import { useSession } from "next-auth/react";
import { useSpotifyWebPlaybackSdk } from "../hooks/useSpotifyWebPlaybackSdk";
import Header from "./Header";

export default function Layout({ children }) {
  const { data: session } = useSession();

  useSpotifyWebPlaybackSdk({
    name: "Radio Station",
    accessToken: session?.accessToken as string,
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
