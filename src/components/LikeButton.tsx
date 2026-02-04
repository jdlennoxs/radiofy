import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartFilled } from "@heroicons/react/24/solid";
import { trpc } from "../utils/trpc";

const LikeButton = ({ song }) => {
  const utils = trpc.useUtils();
  const { data: isSaved } = trpc.spotify.isSavedTrack.useQuery({
    id: song.id,
  });
  const { mutateAsync: addToSaved } =
    trpc.spotify.addToSavedTracks.useMutation({
      onMutate: async (song) => {
        await utils.spotify.isSavedTrack.cancel({ id: song.id });

        const previousState = utils.spotify.isSavedTrack.getData({
          id: song.id,
        });

        utils.spotify.isSavedTrack.setData({ id: song.id }, { body: [true] });

        return { previousState, song };
      },
      onError: (err, song, context) => {
        if (context?.previousState) {
          utils.spotify.isSavedTrack.setData(
            { id: context.song.id },
            context.previousState
          );
        }
      },
      onSettled: (song) => {
        void utils.spotify.isSavedTrack.invalidate({ id: song.id });
      },
    });
  const { mutateAsync: removeFromSaved } =
    trpc.spotify.removeFromSavedTracks.useMutation({
      onMutate: async (song) => {
        await utils.spotify.isSavedTrack.cancel({ id: song.id });

        const previousState = utils.spotify.isSavedTrack.getData({
          id: song.id,
        });

        utils.spotify.isSavedTrack.setData({ id: song.id }, { body: [false] });

        return { previousState, song };
      },
      onError: (err, song, context) => {
        if (context?.previousState) {
          utils.spotify.isSavedTrack.setData(
            { id: context.song.id },
            context.previousState
          );
        }
      },
      onSettled: (song) => {
        void utils.spotify.isSavedTrack.invalidate({ id: song.id });
      },
    });

  const toggleSaved = () => {
    if (isSaved?.body[0]) {
      removeFromSaved(song);
    } else {
      addToSaved(song);
    }
  };

  return (
    <button
      className="flex text-lime-900 p-4 rounded-full ml-4"
      onClick={toggleSaved}
    >
      {isSaved?.body[0] ? (
        <span className="flex items-center text-green-600">
          <HeartFilled className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : (
        <span className="flex items-center text-green-600">
          <HeartOutline className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
    </button>
  );
};

export default LikeButton;
