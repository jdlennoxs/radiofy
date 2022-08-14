import { Message } from "../constants/schema";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import TrackUpdate from "./TrackUpdate";
import MessageItem from "./MessageItem";
import { Session } from "next-auth";

const Chat = ({ station, session }: { station: any; session: Session }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

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

  return (
    <div className="flex-grow overflow-y-auto">
      <TrackUpdate />
      <ul className="flex flex-col p-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} session={session} />
        ))}
      </ul>
      <form
        className="flex items-center sticky bottom-0 p-4 bg-zinc-800"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessageMutation({ stationId: station.id, message });
          setMessage("");
        }}
      >
        <textarea
          className="resize-none shadow-inner py-2 px-4 w-full text-zinc-900 rounded-lg"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message"
        />
        <button
          className="flex-1 text-white bg-emerald-700 p-2 rounded-full ml-4"
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
