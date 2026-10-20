import type { NextPage } from "next";
import StationCard from "../components/StationCard";
import { useGuest } from "../hooks/useGuest";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { data: stations, isLoading } = trpc.station.list.useQuery();
  const { guest, rename } = useGuest();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-forest-900">
        Listen together, anywhere
      </h1>
      <p className="mt-3 max-w-xl text-forest-600">
        Campfire is a shared listening room. Everyone in a station hears the
        same track at the same position and can talk over it. No account, no
        sign-in — pick a name and join.
      </p>

      {guest && (
        <p className="mt-4 text-sm text-forest-600">
          You&apos;re listening as{" "}
          <button
            type="button"
            className="text-forest-600 underline hover:text-forest-500"
            onClick={() => {
              const next = window.prompt("Display name", guest.name);
              if (next) rename(next);
            }}
          >
            {guest.name}
          </button>
          .
        </p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {isLoading && (
          <p className="text-sm text-forest-500">Loading stations…</p>
        )}
        {stations?.map((station) => (
          <StationCard key={station.id} station={station} />
        ))}
      </div>
    </div>
  );
};

export default Home;
