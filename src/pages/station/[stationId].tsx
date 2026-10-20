import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Chat from "../../components/Chat";
import NowPlaying from "../../components/NowPlaying";
import type { Message, Playback, Track } from "../../constants/schema";
import { useGuest } from "../../hooks/useGuest";
import { useStationPlayer } from "../../hooks/useStationPlayer";
import { trpc } from "../../utils/trpc";

const IDLE_PLAYBACK: Playback = { trackId: null, startedAt: 0, isPlaying: false };

const StationPage: NextPage = () => {
  const router = useRouter();
  const stationId =
    typeof router.query.stationId === "string" ? router.query.stationId : "";
  const { guest } = useGuest();

  const { data: station } = trpc.station.get.useQuery(
    { stationId },
    { enabled: Boolean(stationId) }
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [playback, setPlayback] = useState<Playback>(IDLE_PLAYBACK);
  const [listenerCount, setListenerCount] = useState(0);
  const [volume, setVolume] = useState(70);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Seed local state from the station snapshot once per station.
  useEffect(() => {
    if (!station || hydratedFor === station.id) return;
    setMessages(station.messages);
    setPlayback(station.playback);
    setListenerCount(station.listenerCount);
    setHydratedFor(station.id);
  }, [station, hydratedFor]);

  trpc.station.onMessage.useSubscription(
    { stationId },
    {
      enabled: Boolean(stationId),
      onData: (message) =>
        setMessages((previous) =>
          previous.some((m) => m.id === message.id)
            ? previous
            : [...previous, message]
        ),
    }
  );

  trpc.station.onPlayback.useSubscription(
    { stationId },
    {
      enabled: Boolean(stationId),
      onData: (next) => setPlayback(next),
    }
  );

  trpc.station.onPresence.useSubscription(
    { stationId, guestId: guest?.id ?? "" },
    {
      enabled: Boolean(stationId && guest),
      onData: (count) => setListenerCount(count),
    }
  );

  const play = trpc.station.play.useMutation();
  const next = trpc.station.next.useMutation();
  const setPlaying = trpc.station.setPlaying.useMutation();
  const sendMessage = trpc.station.sendMessage.useMutation();
  const trackEnded = trpc.station.trackEnded.useMutation();

  const currentTrack: Track | null = useMemo(
    () => station?.playlist.find((track) => track.id === playback.trackId) ?? null,
    [station?.playlist, playback.trackId]
  );

  const { iframeRef } = useStationPlayer({
    track: currentTrack,
    playback,
    volume,
    onEnded: () => {
      if (playback.trackId) {
        trackEnded.mutate({ stationId, trackId: playback.trackId });
      }
    },
  });

  if (!stationId) return null;
  if (!station) {
    return <div className="p-10 text-zinc-500">Loading station…</div>;
  }

  const playTrack = (trackId: string) => {
    if (guest) play.mutate({ stationId, guest, trackId });
  };

  const toggle = () => {
    if (!guest) return;
    if (playback.isPlaying) {
      setPlaying.mutate({ stationId, isPlaying: false });
      return;
    }
    if (playback.trackId) {
      setPlaying.mutate({ stationId, isPlaying: true });
      return;
    }
    const first = station.playlist[0]?.id;
    if (first) play.mutate({ stationId, guest, trackId: first });
  };

  return (
    <div className="mx-auto grid h-[calc(100vh-4rem)] max-w-6xl gap-5 p-5 lg:grid-cols-[380px_1fr]">
      <div className="flex min-h-0 flex-col gap-5">
        <NowPlaying
          track={currentTrack}
          isPlaying={playback.isPlaying}
          listenerCount={listenerCount}
          volume={volume}
          iframeRef={iframeRef}
          onToggle={toggle}
          onNext={() => next.mutate({ stationId })}
          onVolume={setVolume}
        />
        <PlaylistPanel
          playlist={station.playlist}
          currentTrackId={playback.trackId}
          onPlay={playTrack}
        />
      </div>

      <Chat
        messages={messages}
        guest={guest}
        currentTrackId={playback.trackId}
        onSend={(body) =>
          guest && sendMessage.mutate({ stationId, guest, message: body })
        }
        onPlayTrack={playTrack}
      />
    </div>
  );
};

function PlaylistPanel({
  playlist,
  currentTrackId,
  onPlay,
}: {
  playlist: Track[];
  currentTrackId: string | null;
  onPlay: (trackId: string) => void;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="border-b border-zinc-800 px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">
        Playlist · {playlist.length} tracks
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {playlist.map((track) => {
          const isCurrent = track.id === currentTrackId;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => onPlay(track.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-zinc-800 ${
                  isCurrent ? "bg-amber-500/10" : ""
                }`}
              >
                {track.artwork ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.artwork}
                    alt=""
                    className="h-9 w-9 rounded"
                  />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded bg-zinc-800 text-xs">
                    ♪
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-zinc-100">
                    {track.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {track.artist}
                  </span>
                </span>
                {isCurrent && (
                  <span className="shrink-0 text-xs text-amber-400">♪</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default StationPage;
