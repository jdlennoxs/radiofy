import type { Message } from "../constants/schema";

export default function MessageItem({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <div className={`my-2 flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isOwn ? "bg-forest-600 text-cream-50" : "bg-cream-200 text-forest-900"
        }`}
      >
        {!isOwn && (
          <div className="mb-0.5 text-xs font-semibold text-forest-700">
            {message.sender.name}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.chat?.body}</p>
      </div>
    </div>
  );
}
