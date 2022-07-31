import type { NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import { useState } from "react";
import { Message } from "../../constants/schema";
import { trpc } from "../../utils/trpc";

const MessageItem = ({
  message,
  session,
}: {
  message: Message;
  session: Session;
}) => {
  const styles =
    "mb-4 text-md max-w-7/12 p-4 textgray-700 border border-gray-700 rounded-lg";
  const liStyles =
    message.sender.name === session.user?.name
      ? styles.concat(" self-end")
      : styles;
  return <li className={liStyles}>{message.message}</li>;
};

const Station: NextPage = () => {
  const { data: session } = useSession();
  const { query } = useRouter();

  const stationId = query.stationId as string;
  console.log(stationId);
  const { data: station } = trpc.useQuery([
    "station.getStation",
    {
      id: stationId,
    },
  ]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const { mutateAsync: sendMessageMutation } = trpc.useMutation(
    "station.send-message"
  );

  trpc.useSubscription(["station.onSendMessage", { stationId }], {
    onNext: (message) => {
      setMessages((messages) => {
        return [...messages, message];
      });
    },
  });

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn()}>Sign into Spotify</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1">
        {console.log(station)}
        <div>Welcome to {station?.name}</div>
        <ul className="flex flex-col p-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} session={session} />
          ))}
        </ul>
      </div>
      <form
        className="flex "
        onSubmit={(e) => {
          e.preventDefault();
          sendMessageMutation({ stationId, message });
          setMessage("");
        }}
      >
        <textarea
          className="shadow-inner black py-2 px-4 w-full text-gray-700 bg-gray-50 rounded-full border border-gray-700"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message"
        />
        <button
          className="flex-1 text-white bg-gray-700 p-2 rounded-lg ml-4"
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Station;
