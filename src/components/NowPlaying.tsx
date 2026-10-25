import type { RefObject } from "react";
import type { Track } from "../constants/schema";

/**
 * Display panel for the room's current track. Transport lives at the bottom of
 * the timeline (see Chat); this only shows what is playing.
 */
type Props = {
  track: Track | null;
  listenerCount: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
};

export default function NowPlaying({ track, listenerCount, iframeRef }: Props) {
  return (
    <section className="rounded-xl border border-cream-300 bg-white p-5">
      <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-wider text-forest-600">
        <span>Now playing</span>
        <span>{listenerCount} listening</span>
      </div>

      <div className="flex items-center gap-4">
        {track?.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.artwork}
            alt=""
            className="h-20 w-20 rounded-lg shadow-md"
          />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-lg bg-cream-200 text-2xl text-forest-700">
            ♪
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-semibold text-forest-900">
            {track?.name ?? "Nothing playing"}
          </h2>
          <p className="truncate text-sm text-forest-600">
            {track?.artist ?? "Pick a track to start the room"}
          </p>
        </div>
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
        className="mt-4 h-[166px] w-full rounded-lg border border-cream-300"
      />
    </section>
  );
}
