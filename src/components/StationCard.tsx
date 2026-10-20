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
 * a white info panel with name / summary, and a campfire bubble carrying the
 * listener count, straddling the seam towards the right.
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
        <span className="absolute bottom-0 right-5 flex translate-y-1/2 items-center gap-1.5 rounded-full bg-black px-3 py-2 text-sm font-semibold text-cream-50 shadow-lg ring-2 ring-white">
          <span aria-hidden>🔥 × {station.listenerCount}</span>
          <span className="sr-only">{station.listenerCount} listening</span>
        </span>
      </div>

      <div className="flex flex-col gap-1 bg-white p-4">
        <h2 className="truncate text-base font-semibold text-forest-900 group-hover:text-forest-600">
          {station.name}
        </h2>
        <p className="line-clamp-2 text-sm text-forest-600">
          {station.description}
        </p>
      </div>
    </Link>
  );
}
