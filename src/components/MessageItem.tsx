import type { Message } from "../constants/schema";

export default function MessageItem({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isOwn ? "bg-amber-500/90 text-zinc-900" : "bg-zinc-800 text-zinc-100"
        }`}
      >
        {!isOwn && (
          <div className="mb-0.5 text-xs font-semibold text-amber-400">
            {message.sender.name}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.chat?.body}</p>
      </div>
    </div>
  );
}
