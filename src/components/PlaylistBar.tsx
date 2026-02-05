import { useState } from "react";
import { trpc } from "../utils/trpc";
import { CheckIcon } from "@heroicons/react/24/solid";

type PlaylistOption = {
  id: string;
  name: string;
};

const PlaylistBar = ({ setActiveResults }) => {
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<PlaylistOption | null>(null);
  const { data: playlists } = trpc.spotify.getUserPlaylists.useQuery();
  trpc.spotify.getPlaylist.useQuery(
    { id: selectedPlaylist?.id ?? "" },
    {
      enabled: Boolean(selectedPlaylist?.id),
      onSuccess(data) {
        setActiveResults(data.body.tracks.items);
      },
    }
  );

  return (
    <ul className="flex flex-col overflow-scroll w-60 lg:w-72">
      {playlists?.body.items.map((p) => (
        <a
          key={p.id}
          className={`relative cursor-default select-none py-2 pl-10 pr-4 text-zinc-300`}
          onClick={() => setSelectedPlaylist(p)}
        >
          <span
            className={`block truncate ${
              p === selectedPlaylist ? "font-medium" : "font-normal"
            }`}
          >
            {p.name}
          </span>
          {p === selectedPlaylist ? (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          ) : null}
        </a>
      ))}
    </ul>
  );
};

export default PlaylistBar;
