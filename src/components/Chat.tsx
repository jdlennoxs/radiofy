import { Message } from "../constants/schema";
import { useEffect, useRef, useState } from "react";
import { trpc } from "../utils/trpc";
import TrackUpdate from "./TrackUpdate";
import MessageItem from "./MessageItem";
import { Session } from "next-auth";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import AutoTextArea from "./AutoTextArea";
import Devices from "./Devices";
import Volume from "./Volume";
import Playback from "./Playback";
import EventEmitter from "events";
import { useRect } from "../hooks/useRect";

const Chat = ({ station, session }: { station: any; session: Session }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>();
  const formRef = useRef(null);
  const bottomRef = useRef(null);

  // replace with serverSideProps
  useEffect(() => {
    if (station) {
      setMessages(station.messages);
    }
  }, [station]);

  const { mutateAsync: sendMessageMutation } = trpc.useMutation(
    "station.send-message"
  );

  trpc.useSubscription(["station.onSendMessage", { stationId: station?.id }], {
    onNext: (message) => {
      setMessages((messages) => {
        return [...messages, message];
      });
    },
  });
  trpc.useSubscription(["station.onPlay"], {
    onNext(data) {
      console.log(data);
    },
  });

  useEffect(() => {
    // 👇️ scroll to bottom every time messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [bbox, ref] = useRect();
  const [areaHeight, setAreaHeight] = useState(1);
  const handleTextUpdate = (event) => {
    setMessage(event.target.value);
    const height = event.target.scrollHeight;
    const rowHeight = 24;
    const trows = Math.min(Math.max(1, Math.ceil(height / rowHeight) - 1), 5);
    if (trows !== areaHeight) {
      setAreaHeight(trows);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendMessageMutation({ stationId: station.id, message });
    setMessage("");
    setAreaHeight(1);
  };

  // const handleKeyDown = (event) => {
  //   if (event.key === "Enter") {
  //     formRef.requestSubmit();
  //   }
  // };

  return (
    <div className="flex flex-col flex-grow">
      <div className="overflow-y-scroll">
        {messages && (
          <ul className={`flex flex-col`}>
            {messages.map((message) => (
              <>
                {message.type === "CHAT" ? (
                  <MessageItem
                    key={message.id}
                    message={message}
                    session={session}
                  />
                ) : (
                  <TrackUpdate
                    isCurrentlyPlaying
                    key={message.id}
                    message={message}
                  />
                )}
              </>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <div ref={ref} className="sticky top-[100vh] p-4 bg-zinc-900 w-full">
        <form ref={formRef} className="flex items-center" onSubmit={onSubmit}>
          <div className="flex-1">
            <AutoTextArea
              value={message}
              onChange={handleTextUpdate}
              placeholder="Message"
            />
          </div>
          <button
            className="flex-none text-amber-900 bg-amber-100 p-4 rounded-full ml-4"
            type="submit"
          >
            <span className="flex items-center text-amber-600">
              <PaperAirplaneIcon
                className="h-5 w-5 rotate-[-45deg]"
                aria-hidden="true"
              />
            </span>
          </button>
        </form>
        <div className="flex justify-between md:mr-14">
          <Devices />
          <Playback />
          <Volume />
        </div>
      </div>
    </div>
  );
};

export default Chat;
