import Link from "next/link";
import type { Track } from "../constants/schema";

type Station = {
  id: string;
  name: string;
  description: string;
  listenerCount: number;
  playlistSize: number;
  nowPlaying: Track | null;
};

export default function StationCard({ station }: { station: Station }) {
  const now = station.nowPlaying;
  return (
    <Link
      href={`/station/${station.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-amber-600/60 hover:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold group-hover:text-amber-400">
          {station.name}
        </h2>
        <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {station.listenerCount}
        </span>
      </div>
      <p className="text-sm text-zinc-400">{station.description}</p>
      <div className="mt-auto flex items-center gap-3 text-xs text-zinc-500">
        {now?.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={now.artwork} alt="" className="h-10 w-10 rounded" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded bg-zinc-800">
            ♪
          </span>
        )}
        <span className="truncate">
          {now ? `${now.name} — ${now.artist}` : `${station.playlistSize} tracks`}
        </span>
      </div>
    </Link>
  );
}
