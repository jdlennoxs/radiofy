import { SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { trpc } from "../utils/trpc";

const Volume = () => {
  const { isLoading } = trpc.spotify.getDevices.useQuery(undefined, {
    onSuccess(data) {
      const deviceVolume = data?.body.devices.find(
        (d) => d.is_active
      )?.volume_percent;
      if (deviceVolume && deviceVolume !== volume) setVolume(deviceVolume);
    },
  });
  const [volume, setVolume] = useState(50);
  const debouncedVolume = useDebounce(volume, 50);
  const { mutateAsync: setDeviceVolume } =
    trpc.spotify.setVolume.useMutation();

  useEffect(
    () => {
      !isLoading && setDeviceVolume(volume);
    },
    [debouncedVolume, isLoading, setDeviceVolume, volume] // Only call effect if debounced search term changes
  );

  return (
    <div className="flex items-center space-x-3 pl-3 md:p-3">
      <SpeakerWaveIcon className="h-5 w-5 text-zinc-200" />
      <input
        className="w-20 md:w-24 accent-amber-200"
        type="range"
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        min={0}
        max={100}
      />
    </div>
  );
};

export default Volume;
