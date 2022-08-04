import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Header from "./Header";

export default function Layout({ children }) {
  const [player, setPlayer] = useState(undefined);
  const { data: session } = useSession();
  const refreshToken = session?.refreshToken;

  useEffect(() => {
    if (!player && session) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: "ListenAlong",
          getOAuthToken: (cb) => {
            cb(session.accessToken);
          },
          volume: 0.5,
        });

        setPlayer(player);

        player.addListener("ready", ({ device_id }) => {
          console.log("Ready with Device ID", device_id);
        });

        player.addListener("not_ready", ({ device_id }) => {
          console.log("Device ID has gone offline", device_id);
        });

        player.connect();

        return () => {
          player.disconnect();
        };
      };
    }
  }, [player]);
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
