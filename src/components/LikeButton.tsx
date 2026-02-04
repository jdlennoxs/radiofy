import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartFilled } from "@heroicons/react/24/solid";
import { trpc } from "../utils/trpc";

type LikeButtonSong = {
  id: string;
};

const LikeButton = ({ song }: { song: LikeButtonSong }) => {
  const utils = trpc.useUtils();
  const { data: isSaved } = trpc.spotify.isSavedTrack.useQuery({
    id: song.id,
  });
  const { mutateAsync: addToSaved } =
    trpc.spotify.addToSavedTracks.useMutation({
      onMutate: async (variables) => {
        if (!variables || !variables.id) {
          return;
        }
        await utils.spotify.isSavedTrack.cancel({ id: variables.id });

        const previousState = utils.spotify.isSavedTrack.getData({
          id: variables.id,
        });

        utils.spotify.isSavedTrack.setData({ id: variables.id }, (current) =>
          current ? { ...current, body: [true] } : current
        );

        return { previousState, song: variables };
      },
      onError: (_err, variables, context) => {
        if (context?.previousState && variables && variables.id) {
          utils.spotify.isSavedTrack.setData(
            { id: variables.id },
            context.previousState
          );
        }
      },
      onSettled: (_data, _error, variables) => {
        if (variables && variables.id) {
          void utils.spotify.isSavedTrack.invalidate({ id: variables.id });
        }
      },
    });
  const { mutateAsync: removeFromSaved } =
    trpc.spotify.removeFromSavedTracks.useMutation({
      onMutate: async (variables) => {
        if (!variables || !variables.id) {
          return;
        }
        await utils.spotify.isSavedTrack.cancel({ id: variables.id });

        const previousState = utils.spotify.isSavedTrack.getData({
          id: variables.id,
        });

        utils.spotify.isSavedTrack.setData({ id: variables.id }, (current) =>
          current ? { ...current, body: [false] } : current
        );

        return { previousState, song: variables };
      },
      onError: (_err, variables, context) => {
        if (context?.previousState && variables && variables.id) {
          utils.spotify.isSavedTrack.setData(
            { id: variables.id },
            context.previousState
          );
        }
      },
      onSettled: (_data, _error, variables) => {
        if (variables && variables.id) {
          void utils.spotify.isSavedTrack.invalidate({ id: variables.id });
        }
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
