import { Message } from "../constants/schema";
import { Session } from "next-auth";

const MessageItem = ({
  message,
  session,
  showName,
}: {
  message: Message;
  session: Session;
  showName: boolean;
}) => {
  const isOwnMessage =
    message.sender.id === (session.user as { id?: string } | null)?.id;
  const styles = " max-w-[70%] md:max-w-7/12 p-2 mx-4 text-zinc-800";
  const liStyles = isOwnMessage
    ? styles.concat(" self-end")
    : styles.concat(" self-start");
  const pStyles = isOwnMessage
    ? "border border-amber-200 bg-amber-100 rounded-lg p-2"
    : "border border-zinc-200 bg-white rounded-lg p-2";
  return (
    <li className={liStyles}>
      <div className="flex-row">
        {!isOwnMessage && showName && (
          <span className="text-xs ">{message.sender.name}</span>
        )}
        <p className={pStyles}>{message.chat.body}</p>
      </div>
    </li>
  );
};
export default MessageItem;
