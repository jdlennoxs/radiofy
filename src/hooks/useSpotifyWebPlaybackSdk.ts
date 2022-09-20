import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Spotify: typeof Spotify;
  }
}

interface Options {
  name: string;
  volume?: number;
  accessToken?: string;
}

export const useSpotifyWebPlaybackSdk = ({
  name,
  volume = 0.5,
  accessToken,
}: Options) => {
  const [isReady, setIsReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const playerRef = useRef<Spotify.Player | null>(null);

  useEffect(() => {
    if (accessToken) {
      if (window.Spotify) {
        playerRef.current = new Spotify.Player({
          name,
          getOAuthToken: (cb) => {
            cb(accessToken);
          },
          volume,
        });

        setIsReady(true);
      }

      (window as any).onSpotifyWebPlaybackSDKReady = () => {
        playerRef.current = new Spotify.Player({
          name,
          getOAuthToken: (cb) => {
            cb(accessToken);
          },
          volume,
        });
        setIsReady(true);
      };

      if (!window.Spotify) {
        const scriptTag = document.createElement("script");
        scriptTag.src = "https://sdk.scdn.co/spotify-player.js";

        document.head!.appendChild(scriptTag);
      }
    }
  }, [accessToken]);

  const handleReady = useCallback(({ device_id }: { device_id: string }) => {
    setDeviceId(device_id);

    console.log("Ready with Device ID", device_id);
  }, []);

  useEffect(() => {
    if (isReady) {
      playerRef.current?.connect();
    }
  }, [isReady]);

  useEffect(() => {
    const player = playerRef.current!;
    if (isReady) {
      player.addListener("ready", handleReady);

      return () => {
        player.removeListener("ready", handleReady);
      };
    }
    return;
  }, [isReady]);

  return {
    player: playerRef.current,
    deviceId,
    isReady,
  };
};
