import { Fragment, useState } from "react";
import { trpc } from "../utils/trpc";
import { Listbox, Transition, Combobox } from "@headlessui/react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { MinusSmallIcon } from "@heroicons/react/24/solid";
import useQueueStore from "./QueueStore";

const Queue = () => {
  const queue = useQueueStore((state) => state.tracks);
  const setQueue = useQueueStore((state) => state.reorderQueue);
  const removeTrack = useQueueStore((state) => state.removeTrack);

  const handleDrop = (droppedItem) => {
    // Ignore drop outside droppable container
    if (!droppedItem.destination) return;
    var updatedList = [...queue];
    // Remove dragged item
    const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
    // Add dropped item
    updatedList.splice(droppedItem.destination.index, 0, reorderedItem);
    // Update State
    setQueue(updatedList);
  };

  const getQueueItems = () => {
    if (!queue.length) {
      return (
        <div className="p-4">
          <p className="text-gray-300">Queue is empty...</p>
        </div>
      );
    }
    return (
      <DragDropContext onDragEnd={handleDrop}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {queue.map((t, index) => (
                <Draggable
                  key={`q${t.id}`}
                  draggableId={`q${t.id}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      className={`${snapshot.isDragging
                          ? "bg-zinc-800 border border-zinc-300 rounded-lg"
                          : "bg-zinc-900"
                        }`}
                      ref={provided.innerRef}
                      {...provided.dragHandleProps}
                      {...provided.draggableProps}
                    >
                      <div className="flex items-center justify-between p-2">
                        <div className="flex space-x-4 items-center">
                          <img
                            className={"shadow-md rounded-lg h-12 w-12"}
                            src={t?.album.images?.[0]?.url}
                            alt=""
                          />
                          <div className="flex-row justify-start">
                            <h3 className="text-zinc-200 font-semibold">
                              {t?.name}
                            </h3>
                            <p className="text-zinc-400">
                              {t?.artists?.[0]?.name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeTrack(t.id)}
                          className="p-2 hover:bg-zinc-700 rounded-lg"
                        >
                          <MinusSmallIcon
                            className="h-5 w-5 text-zinc-100"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  return (
    <div className="mt-4 items-center ">
      <div className="overflow-scroll w-80">
        {/* <ul> */}
        {getQueueItems()}
        {/* <li>
            <button className="flex items-center space-x-4" onClick={() => {}}>
              <div className={"shadow-md rounded-lg h-12 w-12"}>
                <PlusCircleIcon className="h-10 w-10 text-amber-100 m-1" />
              </div>
              <div className="flex-row justify-start">
                <h3 className="text-zinc-200 font-semibold">Add a track</h3>
              </div>
            </button>
          </li>
        </ul> */}
      </div>
    </div>
  );
};

export default Queue;
