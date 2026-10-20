import type { RefObject } from "react";
import type { Track } from "../constants/schema";

type Props = {
  track: Track | null;
  isPlaying: boolean;
  listenerCount: number;
  volume: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onToggle: () => void;
  onNext: () => void;
  onVolume: (volume: number) => void;
};

export default function NowPlaying({
  track,
  isPlaying,
  listenerCount,
  volume,
  iframeRef,
  onToggle,
  onNext,
  onVolume,
}: Props) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-500">
        <span>Now playing</span>
        <span>{listenerCount} listening</span>
      </div>

      <div className="flex items-center gap-4">
        {track?.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.artwork}
            alt=""
            className="h-20 w-20 rounded-lg shadow-lg"
          />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-lg bg-zinc-800 text-2xl">
            ♪
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">
            {track?.name ?? "Nothing playing"}
          </h2>
          <p className="truncate text-sm text-zinc-400">
            {track?.artist ?? "Pick a track to start the room"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={!track}
          className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400 disabled:opacity-40"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!track}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-amber-600 disabled:opacity-40"
        >
          Next
        </button>
        <input
          aria-label="Volume"
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(event) => onVolume(Number(event.target.value))}
          className="ml-auto w-28 accent-amber-400"
        />
      </div>

      {/*
        SoundCloud embed. Usually hidden so the room owns the transport UI, but
        currently visible to debug playback. `allow="autoplay"` lets a click on
        this page start the cross-origin player.
      */}
      <iframe
        ref={iframeRef}
        title="SoundCloud player"
        allow="autoplay"
        scrolling="no"
        className="mt-4 h-[166px] w-full rounded-lg border border-zinc-800"
      />
    </section>
  );
}
