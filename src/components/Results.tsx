import { PlusSmallIcon } from "@heroicons/react/24/outline";

const Results = ({ tracks, addToQueue }) => {
  return (
    <div className=" flex flex-row overflow-y-scroll">
      <ul>
        {tracks.map((t, index) => (
          <li key={`r${t.track.id}`}>
            <div className="flex items-center justify-between p-2">
              <div className="flex space-x-4 items-center">
                <img
                  className={"shadow-md rounded-lg h-12 w-12"}
                  src={t.track?.album.images?.[0]?.url}
                  alt=""
                />
                <div className="flex-row justify-start">
                  <h3 className="text-zinc-200 font-semibold">
                    {t.track?.name}
                  </h3>
                  <p className="text-zinc-400">{t.track?.artists?.[0]?.name}</p>
                </div>
              </div>
              <button
                className="p-2 hover:bg-zinc-700 rounded-lg"
                onClick={() => addToQueue(t.track)}
              >
                <PlusSmallIcon
                  className="h-5 w-5 text-zinc-100"
                  aria-hidden="true"
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Results;
