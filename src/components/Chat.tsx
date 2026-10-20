import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { Guest, Message } from "../constants/schema";
import AutoTextArea from "./AutoTextArea";
import MessageItem from "./MessageItem";
import TrackUpdate from "./TrackUpdate";

type Props = {
  messages: Message[];
  guest: Guest | null;
  currentTrackId: string | null;
  onSend: (body: string) => void;
  onPlayTrack: (trackId: string) => void;
  isPlaying: boolean;
  onToggle: () => void;
  onNext: () => void;
  volume: number;
  onVolume: (volume: number) => void;
};

export default function Chat({
  messages,
  guest,
  currentTrackId,
  onSend,
  onPlayTrack,
  isPlaying,
  onToggle,
  onNext,
  volume,
  onVolume,
}: Props) {
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Scroll to the newest message, as before.
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

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
    setValue(event.target.value);

  // Enter sends, Shift+Enter adds a newline (original chat behaviour).
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="border-b border-zinc-800 px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">
        Timeline
      </div>

      {/*
        Timeline scroll container. No horizontal or top padding: stuck track
        rows drop their own margin and go full-bleed, pinning flush to this
        container's top edge. Rows measure against it via the data attribute.
      */}
      <div
        data-timeline-scroll
        className="min-h-0 flex-1 overflow-y-auto pb-4"
      >
        {messages.length === 0 && (
          <p className="mx-4 mt-4 text-sm text-zinc-600">
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
        ref={formRef}
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-zinc-800 p-3"
      >
        <AutoTextArea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={500}
          disabled={!guest}
          placeholder={guest ? `Message as ${guest.name}` : "Loading…"}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400 disabled:opacity-40"
        >
          Send
        </button>
      </form>

      {/* Transport, pinned to the bottom of the timeline. */}
      <div className="flex items-center gap-3 border-t border-zinc-800 p-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={!currentTrackId}
          className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400 disabled:opacity-40"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!currentTrackId}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-amber-600 disabled:opacity-40"
        >
          Next
        </button>
        <input
          aria-label="Volume"
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(event) => onVolume(Number(event.target.value))}
          className="ml-auto w-28 accent-amber-400"
        />
      </div>
    </section>
  );
}
