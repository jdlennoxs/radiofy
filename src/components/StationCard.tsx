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
      className="group flex flex-col gap-3 rounded-xl border border-cream-300 bg-white p-4 transition hover:border-forest-500 hover:bg-cream-50"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-forest-900 group-hover:text-forest-600">
          {station.name}
        </h2>
        <span className="flex shrink-0 items-center gap-1 text-xs text-forest-600">
          <span className="h-2 w-2 rounded-full bg-forest-500" />
          {station.listenerCount}
        </span>
      </div>
      <p className="text-sm text-forest-600">{station.description}</p>
      <div className="mt-auto flex items-center gap-3 text-xs text-forest-600">
        {now?.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={now.artwork} alt="" className="h-10 w-10 rounded" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded bg-cream-200 text-forest-700">
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
