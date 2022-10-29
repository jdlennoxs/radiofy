import { useCallback, useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { trpc } from "../utils/trpc";
import Devices from "./Devices";
import Playlist from "./Playlist";
import PlaylistBar from "./PlaylistBar";
import Queue from "./Queue";
import useQueueStore from "./QueueStore";
import Results from "./Results";

const StationInfo = () => {
  // const [queue, setQueue] = useState<any>([]);
  const [activeResults, setActiveResults] = useState<any>([]);
  const queue = useQueueStore((state) => state.tracks);
  const setQueue = useQueueStore((state) => state.addTrack);

  const { mutateAsync: sendMessageMutation } = trpc.useMutation(
    "station.send-message"
  );
  // , {
  // onNext: (message) => {
  //   setMessages((messages) => {
  //     return [...messages, message];
  //   });
  // },
  // });

  return (
    <div className="flex-col mx-auto w-full lg:w-1/2 flex bg-zinc-900">
      <Queue />
      <div className="sticky top-[100vh] flex h-1/2 ">
        <PlaylistBar setActiveResults={setActiveResults} />
        <Results
          tracks={activeResults}
          addToQueue={(track) => {
            setQueue(track);
          }}
        />
      </div>
    </div>
  );
};

export default StationInfo;
