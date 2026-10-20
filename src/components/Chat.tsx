import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Guest, Message } from "../constants/schema";
import MessageItem from "./MessageItem";
import TrackUpdate from "./TrackUpdate";

type Props = {
  messages: Message[];
  guest: Guest | null;
  currentTrackId: string | null;
  onSend: (body: string) => void;
  onPlayTrack: (trackId: string) => void;
};

export default function Chat({
  messages,
  guest,
  currentTrackId,
  onSend,
  onPlayTrack,
}: Props) {
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = value.trim();
    if (!body) return;
    onSend(body);
    setValue("");
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="border-b border-zinc-800 px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">
        Timeline
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-600">
            No messages yet — say hello, or put a track on.
          </p>
        )}
        {messages.map((message) =>
          message.type === "CHAT" ? (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.sender.id === guest?.id}
            />
          ) : (
            <TrackUpdate
              key={message.id}
              message={message}
              isCurrent={message.track?.id === currentTrackId}
              onPlay={onPlayTrack}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-zinc-800 p-3"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={500}
          disabled={!guest}
          placeholder={guest ? `Message as ${guest.name}` : "Loading…"}
          className="min-w-0 flex-1 rounded-lg bg-zinc-950 px-3 py-2 text-sm outline-none ring-1 ring-zinc-800 focus:ring-amber-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </section>
  );
}
