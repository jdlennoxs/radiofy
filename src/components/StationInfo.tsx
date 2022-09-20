import { useCallback, useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { trpc } from "../utils/trpc";
import Devices from "./Devices";
import Playlist from "./Playlist";
import Queue from "./Queue";

const StationInfo = () => {
  const [queue, setQueue] = useState<any>([]);

  return (
    <div className="flex-col mx-auto w-full lg:w-1/2 flex bg-zinc-900">
      <Queue queue={queue} setQueue={setQueue} />
      <Playlist
        addToQueue={(track) => {
          const currentQueue = new Set(queue);
          setQueue(Array.from(currentQueue.add(track)));
        }}
      />
    </div>
  );
};

export default StationInfo;
