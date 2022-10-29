import { Fragment, useState } from "react";
import { trpc } from "../utils/trpc";
import { Listbox, Transition, Combobox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

const PlaylistBar = ({ setActiveResults }) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState({});
  const { data: playlists } = trpc.useQuery(["spotify.getUserPlaylists"]);
  const { data: playlist } = trpc.useQuery(
    ["spotify.getPlaylist", { id: selectedPlaylist.id }],
    {
      onSuccess(data) {
        setActiveResults(data.body.tracks.items);
      },
    }
  );

  const { mutateAsync: startPlayback } = trpc.useMutation(
    "spotify.startPlayback"
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
