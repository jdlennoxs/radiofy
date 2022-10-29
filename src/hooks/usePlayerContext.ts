import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";

export const usePlayerContext = () => {
  const { data: devices } = trpc.useQuery(["spotify.getDevices"]);
  const [activePlayer, setActivePlayer] = useState(null);

  useEffect(() => {
    if (devices) {
      devices.body.devices.find((d) => d.is_active);
    }
  }, [devices]);
};
