import type { NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { trpc } from "../../utils/trpc";
import Chat from "../../components/Chat";
import StationInfo from "../../components/StationInfo";

const Station: NextPage = () => {
  const { data: session } = useSession();
  const { query } = useRouter();

  const stationId = query.stationId as string;
  const { data: station } = trpc.useQuery([
    "station.getStation",
    {
      id: stationId,
    },
  ]);

  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "auto",
    });
  }, []);

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn()}>Sign into Spotify</button>
      </div>
    );
  }

  return (
    <div className="flex sm:flex-row items-stretch h-screen overflow-hidden">
      <StationInfo />
      <Chat station={station} session={session} />
    </div>
  );
};

export default Station;
