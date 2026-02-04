import { Fragment, useState } from "react";
import { trpc } from "../utils/trpc";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";

type PlaylistOption = {
  id: string;
  name: string;
};

const Playlist = ({ setActiveResults }) => {
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<PlaylistOption | null>(null);
  const { data: playlists } = trpc.spotify.getUserPlaylists.useQuery();
  const { data: playlist } = trpc.spotify.getPlaylist.useQuery(
    { id: selectedPlaylist?.id ?? "" },
    {
      enabled: Boolean(selectedPlaylist?.id),
      onSuccess(data) {
        setActiveResults(data.body.tracks.items);
      },
    }
  );

  return (
    <div className=" flex-row">
      <div className="top-16 w-72">
        <Listbox value={selectedPlaylist} onChange={setSelectedPlaylist}>
          <div className="relative mt-1">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
              <span className="block truncate text-zinc-900">
                {" "}
                {selectedPlaylist?.name || "Select a playlist"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              enter="transition-opacity ease-in-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-in-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {playlists?.body.items.map((p) => (
                  <Listbox.Option
                    key={p.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-amber-100 text-amber-900" : "text-zinc-900"
                      }`
                    }
                    value={p}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {p.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>
      <div className="h-96 overflow-scroll">
        <ul>
          {playlist?.body.tracks.items.map((t, index) => (
            <li
              key={
                t.track?.id ?? t.track?.uri ?? `${t.added_at ?? "track"}-${index}`
              }
            >
              <button onClick={() => {}}>
                <div className="flex items-center space-x-4">
                  <img
                    className={"shadow-md rounded-lg h-12 w-12"}
                    src={t?.track?.album.images?.[0]?.url}
                    alt=""
                  />
                  <div className="flex-row justify-start">
                    <h3 className="text-zinc-200 font-semibold">
                      {t?.track?.name}
                    </h3>
                    <p className="text-zinc-400">
                      {t.track?.artists?.[0]?.name}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Playlist;

{
  /* <ul>
{playlists?.body.items.map((p) => (
  <li>
    <button
      onClick={() => {
        setPlaylistId(p.id);
      }}
    >
      {p.name}
    </button>
  </li>
))}
</ul> */
}
