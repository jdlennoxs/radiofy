import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { trpc } from "../utils/trpc";

const Devices = () => {
  const utils = trpc.useContext();
  const [activeDevice, setActiveDevice] = useState({});
  const { data: devices } = trpc.useQuery(["spotify.getDevices"], {
    onSuccess(data) {
      setActiveDevice(data?.body.devices.find((d) => d.is_active));
    },
  });
  const { mutateAsync: setDevice } = trpc.useMutation(["spotify.setDevice"], {
    onSuccess: () => {
      setTimeout(() => {
        utils.invalidateQueries(["spotify.getDevices"]);
      }, 1200);
    },
  });

  return (
    <div className="top-16 w-36 md:w-48">
      <Listbox value={activeDevice} onChange={(device) => setDevice(device.id)}>
        <div className="relative mt-1">
          <Listbox.Button
            onClick={() => utils.invalidateQueries(["spotify.getDevices"])}
            className="relative w-full cursor-default rounded-lg py-2 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
          >
            <span className="block truncate text-zinc-100">
              {" "}
              {activeDevice?.name || "Select a device"}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            enter="transition-opacity ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm bottom-full">
              {devices?.body.devices.map((d) => (
                <Listbox.Option
                  key={d.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-amber-100 text-amber-900" : "text-zinc-900"
                    }`
                  }
                  value={d}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {d.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <MegaphoneIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default Devices;
