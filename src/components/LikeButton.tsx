import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartFilled } from "@heroicons/react/24/solid";
import { trpc } from "../utils/trpc";

const LikeButton = ({ song }) => {
  const utils = trpc.useContext();
  const { data: isSaved } = trpc.spotify.isSavedTrack.useQuery({
            id: song.id,
          });
  const { mutateAsync: addToSaved } = trpc.spotify.addToSavedTracks.useMutation(
    {
      onMutate: async (song) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await utils.spotify.isSavedTrack.cancel({ id: song.id });

        // Snapshot the previous value
        const previousState = utils.spotify.isSavedTrack.getData({ id: song.id });

        // Optimistically update to the new value
        utils.spotify.isSavedTrack.setData({ id: song.id }, {
          body: [true],
        });

        // Return a context with the previous and new todo
        return { previousState, song };
      },
      // If the mutation fails, use the context we returned above
      onError: (err, song, context) => {
        utils.spotify.isSavedTrack.setData(
          { id: context.song.id },
          context.previousState
        );
      },
      // Always refetch after error or success:
      onSettled: (song) => {
        utils.spotify.isSavedTrack.invalidate({ id: song.id });
      },
    }
  );
  const { mutateAsync: removeFromSaved } = trpc.spotify.removeFromSavedTracks.useMutation(
    {
      onMutate: async (song) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await utils.spotify.isSavedTrack.cancel({ id: song.id });

        // Snapshot the previous value
        const previousState = utils.spotify.isSavedTrack.getData({ id: song.id });

        // Optimistically update to the new value
        utils.spotify.isSavedTrack.setData({ id: song.id }, {
          body: [false],
        });

        // Return a context with the previous and new todo
        return { previousState, song };
      },
      // If the mutation fails, use the context we returned above
      onError: (err, song, context) => {
        utils.spotify.isSavedTrack.setData(
          { id: context.song.id },
          context.previousState
        );
      },
      // Always refetch after error or success:
      onSettled: (song) => {
        utils.spotify.isSavedTrack.invalidate({ id: song.id });
      },
    }
  );

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
