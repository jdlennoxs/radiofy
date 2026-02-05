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
import { useRect } from "../hooks/useRect";

const Chat = ({
  station,
  session,
}: {
  station: any;
  session: Session;
}) => {
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

  const { mutateAsync: sendMessageMutation } =
    trpc.station.sendMessage.useMutation();

  const stationId = station?.id ?? "";
  trpc.station.onSendMessage.useSubscription(
    { stationId },
    {
      enabled: Boolean(station?.id),
      onData: (message) => {
        setMessages((current = []) => {
          if (current.some((m) => m.id === message.id)) {
            return current;
          }
          return [...current, message];
        });
      },
    }
  );
  trpc.station.onPlay.useSubscription(undefined, {
    onData(data) {
      console.log(data);
    },
  });

  useEffect(() => {
    // 👇️ scroll to bottom every time messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [bbox, ref] = useRect<HTMLDivElement>();
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
    if (!message.trim()) return;

    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      stationId: station.id,
      chat: { body: message },
      created: new Date(),
      type: "CHAT",
      sender: {
        id: (session?.user as any)?.id || "temp-id",
        name: session?.user?.name || "Me",
      },
    };

    setMessages((current = []) => [...current, optimisticMessage]);

    sendMessageMutation({ stationId: station.id, message, id: tempId });
    setMessage("");
    setAreaHeight(1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="flex flex-col flex-grow bg-zinc-50">
      <div className="overflow-y-scroll">
        {messages && (
          <ul className={`flex flex-col`}>
            {messages.map((message, index) => {
              const previousMessage = messages[index - 1];
              const showName =
                !previousMessage || previousMessage.sender.id !== message.sender.id;
              return (
                <>
                  {message.type === "CHAT" ? (
                    <MessageItem
                      key={message.id}
                      message={message}
                      session={session}
                      showName={showName}
                    />
                  ) : (
                    <TrackUpdate
                      isCurrentlyPlaying
                      key={message.id}
                      message={message}
                    />
                  )}
                </>
              );
            })}
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
              onKeyDown={handleKeyDown}
              placeholder="Message"
            />
          </div>
          <button
            className={`flex-none p-4 rounded-full ml-4 transition-colors ${!message.trim()
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : "text-amber-600 bg-amber-100 hover:bg-amber-200"
              }`}
            type="submit"
            disabled={!message.trim()}
          >
            <span className="flex items-center">
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
