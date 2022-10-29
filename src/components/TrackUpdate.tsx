import { Message } from "../constants/schema";
import { useRect } from "../hooks/useRect";
import FireButton from "./FireButton";
import LikeButton from "./LikeButton";

const TrackUpdate = ({
  isCurrentlyPlaying,
  message,
}: {
  message: Message;
  isCurrentlyPlaying: boolean;
}) => {
  const [bbox, ref] = useRect();
  return (
    <section
      ref={ref}
      className={`items-end space-x-7 p-4 transition-[background] duration-150 ease-in-out ${
        bbox?.top === 0
          ? "bg-zinc-100 z-10"
          : "bg-white border border-zinc-200 rounded-lg m-4 "
      } ${isCurrentlyPlaying && "sticky top-0"}`}
    >
      <div className="flex justify-between">
        <div className="flex items-center space-x-4">
          <img
            className={`transition-image duration-150 ease-in-out shadow-md rounded-lg h-24 w-24`}
            src={message.track.albumImage}
            alt=""
          />
          <div>
            <h3 className="text-zinc-900 font-semibold">
              {message.track.name}
            </h3>
            <p className="text-zinc-700">{message.track.artists}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <LikeButton song={message.track} />
          <FireButton />
        </div>
      </div>
    </section>
  );
};

export default TrackUpdate;
