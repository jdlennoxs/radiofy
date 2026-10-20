import Link from "next/link";

type Station = {
  id: string;
  name: string;
  description: string;
  listenerCount: number;
  playlistSize: number;
  coverArtwork: string | null;
};

/**
 * Card for the station list: full-bleed album art for the top playlist entry,
 * a white info panel with name / summary / listeners, and a campfire bubble
 * sitting on the seam between the two, towards the right.
 */
export default function StationCard({ station }: { station: Station }) {
  return (
    <Link
      href={`/station/${station.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-sm transition hover:border-forest-500 hover:shadow-lg"
    >
      <div className="relative">
        <div className="aspect-square w-full overflow-hidden bg-cream-200">
          {station.coverArtwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={station.coverArtwork}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-4xl text-forest-700">
              ♪
            </span>
          )}
        </div>

        {/* Straddles the image / summary boundary, close to the right edge. */}
        <span
          aria-hidden
          className="absolute bottom-0 right-5 grid h-12 w-12 translate-y-1/2 place-items-center rounded-full bg-black text-xl shadow-lg ring-2 ring-white"
        >
          🔥
        </span>
      </div>

      <div className="flex flex-col gap-1 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-base font-semibold text-forest-900 group-hover:text-forest-600">
            {station.name}
          </h2>
          <span className="flex shrink-0 items-center gap-1 text-xs text-forest-600">
            <span className="h-2 w-2 rounded-full bg-forest-500" />
            {station.listenerCount}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-forest-600">
          {station.description}
        </p>
      </div>
    </Link>
  );
}
