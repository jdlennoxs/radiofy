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
  // const song = {
  //   name: "Age of Adz",
  //   artists: [{ name: "Sufjan Stevens" }],
  //   id: "5EP2pGo97siLzMjlJnKmNK",
  //   album: {
  //     images: [
  //       {
  //         url: "data:image/jpeg;base64,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",
  //       },
  //       {
  //         url: "data:image/jpeg;base64,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",
  //       },
  //     ],
  //   },
  // };

  const [bbox, ref] = useRect();
  return (
    <section
      ref={ref}
      className={`items-end space-x-7 p-4 transition-[background] duration-150 ease-in-out ${
        bbox?.top === 0
          ? "bg-zinc-100"
          : "bg-white border border-zinc-200 rounded-lg m-4 "
      } ${isCurrentlyPlaying && "sticky top-0"}`}
    >
      {console.log(bbox)}
      <div className="flex items-center space-x-4">
        <img
          className={`transition-image duration-150 ease-in-out shadow-md rounded-lg ${
            bbox?.top === 0 ? "h-12 w-12" : "h-24 w-24"
          }`}
          src={message.track.albumImage}
          alt=""
        />
        <div>
          <h3 className="text-zinc-900 font-semibold">{message.track.name}</h3>
          <p className="text-zinc-700">{message.track.artists}</p>
        </div>
        <LikeButton song={message.track} />
        <FireButton />
      </div>
    </section>
  );
};

export default TrackUpdate;
