import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";

const Playback = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const { data: playbackState, isLoading } = trpc.useQuery(
    ["spotify.getPlaybackState"],
    {
      onSuccess(data) {
        setIsPlaying(data?.body.is_playing);
      },
    }
  );
  const { mutateAsync: play } = trpc.useMutation(["spotify.startPlayback"]);
  const { mutateAsync: pause } = trpc.useMutation(["spotify.stopPlayback"]);

  const togglePlayback = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
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
