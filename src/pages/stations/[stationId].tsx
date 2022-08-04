import type { NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import { Session } from "next-auth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Message } from "../../constants/schema";
import { trpc } from "../../utils/trpc";
import TrackUpdate from "../../components/TrackUpdate";

const MessageItem = ({
  message,
  session,
}: {
  message: Message;
  session: Session;
}) => {
  const styles = "mb-2 text-sm max-w-[80%] md:max-w-7/12 p-2 text-zinc-200";
  const liStyles =
    message.sender.name === session.user?.name
      ? styles.concat(" self-end")
      : styles.concat(" self-start");
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "string",
      message: "This is an actual message",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "Jack",
      },
    },
    {
      id: "string",
      message: "Not really it's just dummy text",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "Yeah, but it's the thought that counts",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message:
        "You would say that because that's just the sort of person you are and I don't really like it tbh",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "Jack",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
    {
      id: "string",
      message: "string",
      stationId: "string",
      sentAt: new Date(),
      sender: {
        name: "string",
      },
    },
  ]);

  useEffect(() => {
    console.log(document.documentElement.scrollHeight);
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "auto",
    });
  }, []);

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
    <div className="flex flex-col bg-zinc-800 min-h-screen">
      <div className="flex-grow over">
        <div>Welcome to {station?.name}</div>

        <TrackUpdate />
        <ul className="flex flex-col p-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} session={session} />
          ))}
        </ul>

        <TrackUpdate isCurrentlyPlaying={true} />
        <ul className="flex flex-col p-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} session={session} />
          ))}
        </ul>
      </div>
      <form
        className="flex sticky bottom-0 p-4 bg-neutral-800"
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
