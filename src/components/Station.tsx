import Image from "next/image";
import Link from "next/link";
const Station = ({ station }) => {
  const track = station.playbackContext?.track;
  const albumImage = track?.albumImage || "https://placehold.co/176x176?text=No+Track"; // Fallback image
  const trackName = track?.name || "No track playing";
  const artistName = track?.artists || "Unknown Artist";

  return (
    <div className="flex flex-col gap-y-4">
      <h3>{station.name}</h3>
      <Link
        href={`/station/${station.id}`}
        className={`h-44 w-44 shadow-md rounded-lg overflow-hidden ${!station.isLive &&
          "after:content-['*'] after:bg-gray-100 after:inline"
          }`}
      >
        <Image
          className="-z-10"
          height={176}
          width={176}
          src={albumImage}
          alt={trackName}
        />
      </Link>

      <div>
        <p className="text-xs text-zinc-700 leading-3">
          {" "}
          {station.playbackContext?.isPlaying
            ? `Now playing...`
            : `Last played`}
        </p>
        <h3 className=" text-l text-zinc-900 font-semibold">
          {trackName}
        </h3>
        <p className="text-l text-zinc-700 font-semibold">
          {artistName}
        </p>
      </div>
    </div>
  );
};
export default Station;
