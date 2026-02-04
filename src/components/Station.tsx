import Image from "next/image";
import Link from "next/link";
const Station = ({ station }) => {
  return (
    <div className="flex flex-col gap-y-4">
      <h3>{station.name}</h3>
      <Link href={`/station/${station.id}`}>
        <a
          className={`h-44 w-44 shadow-md rounded-lg overflow-hidden ${
            !station.isLive &&
            "after:content-['*'] after:bg-gray-100 after:inline"
          }`}
        >
          <Image
            className="-z-10"
            height={176}
            width={176}
            src={station.playbackContext?.track.albumImage}
            alt=""
          />
        </a>
      </Link>

      <div>
        <p className="text-xs text-zinc-700 leading-3">
          {" "}
          {station.playbackContext?.isPlaying
            ? `Now playing...`
            : `Last played`}
        </p>
        <h3 className=" text-l text-zinc-900 font-semibold">
          {station.playbackContext?.track.name}
        </h3>
        <p className="text-l text-zinc-700 font-semibold">
          {station.playbackContext?.track.artists}
        </p>
      </div>
    </div>
  );
};
export default Station;
