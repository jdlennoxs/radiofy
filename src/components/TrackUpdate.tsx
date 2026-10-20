import type { Message } from "../constants/schema";

export default function TrackUpdate({
  message,
  isCurrent,
  onPlay,
}: {
  message: Message;
  isCurrent: boolean;
  onPlay: (trackId: string) => void;
}) {
  const track = message.track;
  if (!track) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${
        isCurrent
          ? "border-amber-600/60 bg-amber-500/10"
          : "border-zinc-800 bg-zinc-900"
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
