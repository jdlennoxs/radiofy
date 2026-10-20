import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import useQueueStore from "./QueueStore";

const Playback = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const queue = useQueueStore((state) => state.tracks);
  const { data: playbackState } = trpc.spotify.getPlaybackState.useQuery();
  useEffect(() => {
    if (playbackState !== undefined) {
      setIsPlaying(playbackState?.body.is_playing ?? false);
    }
  }, [playbackState]);
  const { mutateAsync: pause } = trpc.spotify.stopPlayback.useMutation();
  const { mutateAsync: onPlay } = trpc.station.play.useMutation();

  const togglePlayback = () => {
    if (isPlaying) {
      pause();
    } else {
      onPlay({ track: queue[0], stationId: "cla5kpjl00076equnhqh7gr4t" });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <button
      className="flex items-center text-amber-100"
      onClick={togglePlayback}
    >
      {isPlaying ? (
        <PauseIcon className="h-8 w-8" />
      ) : (
        <PlayIcon className="h-8 w-8" />
      )}
    </button>
  );
};

export default Playback;
