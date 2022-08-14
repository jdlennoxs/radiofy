import { useState } from "react";
import { trpc } from "../utils/trpc";

const StationInfo = () => {
  const [playlistId, setPlaylistId] = useState("");
  const { data: devices } = trpc.useQuery(["spotify.getDevices"]);
  const { data: playlists } = trpc.useQuery(["spotify.getUserPlaylists"]);
  const { data: playlist } = trpc.useQuery([
    "spotify.getPlaylist",
    { id: playlistId },
  ]);
  const { mutateAsync: startPlayback } = trpc.useMutation(
    "spotify.startPlayback"
  );
  console.log(playlistId);
  console.log(playlist);

  return (
    <div className="text-white">
      {devices?.body.devices.map((d) => (
        <h3>{d.name}</h3>
      ))}
      <ul>
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
      </ul>
      <ul>
        {playlist?.body.tracks.items.map((t) => (
          <li>
            <button onClick={() => startPlayback([t.track?.uri])}>
              <>
                <h3>{t.track?.name}</h3>
                <h4>{t.track?.artists.flatMap((a) => a.name).join(", ")}</h4>
              </>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StationInfo;
