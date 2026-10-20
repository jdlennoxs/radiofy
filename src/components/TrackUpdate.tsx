import type { Message } from "../constants/schema";
import { useRect } from "../hooks/useRect";

/**
 * A track in the timeline. Every track row is sticky, not just the current one:
 * as the timeline scrolls, each track pins to the top and the next one covers
 * it, so the newest tracks stack at the top. `useRect` detects when a row has
 * actually stuck (`top === 0`) and swaps in an opaque background so it hides the
 * messages scrolling beneath it.
 *
 * `isCurrent` only drives the "playing" highlight.
 */
export default function TrackUpdate({
  message,
  isCurrent,
  onPlay,
}: {
  message: Message;
  isCurrent: boolean;
  onPlay: (trackId: string) => void;
}) {
  const [bbox, ref] = useRect<HTMLDivElement>();
  const track = message.track;
  if (!track) return null;

  const stuck = bbox?.top === 0;
  const background = stuck
    ? "z-10 bg-zinc-950"
    : isCurrent
      ? "bg-amber-500/10"
      : "bg-zinc-900";
  const border = isCurrent ? "border-amber-600/60" : "border-zinc-800";

  return (
    <div
      ref={ref}
      className={`sticky top-0 flex items-center gap-3 rounded-lg border p-3 transition-[background] duration-150 ease-in-out ${border} ${background} ${
        stuck ? "my-0" : "my-3"
      }`}
    >
      {track.artwork ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artwork} alt="" className="h-12 w-12 rounded" />
      ) : (
        <span className="grid h-12 w-12 place-items-center rounded bg-zinc-800">
          ♪
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">
          {track.name}
        </p>
        <p className="truncate text-xs text-zinc-400">
          {track.artist} · added by {message.sender.name}
        </p>
      </div>
      {isCurrent ? (
        <span className="shrink-0 text-xs text-amber-400">playing</span>
      ) : (
        <button
          type="button"
          onClick={() => onPlay(track.id)}
          className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:border-amber-600"
        >
          Play
        </button>
      )}
    </div>
  );
}
