import { Message } from "../constants/schema";
import { Session } from "next-auth";

const MessageItem = ({
  message,
  session,
}: {
  message: Message;
  session: Session;
}) => {
  const isOwnMessage = message.sender.id === session.user?.id;
  const styles = "mb-2 max-w-[80%] md:max-w-7/12 p-2 mx-4 text-zinc-800";
  const liStyles = isOwnMessage
    ? styles.concat(" self-end")
    : styles.concat(" self-start");
  return (
    <li className={liStyles}>
      <div className="flex-row">
        {!isOwnMessage && (
          <span className="text-xs">{message.sender.name}</span>
        )}
        <p>{message.chat.body}</p>
      </div>
    </li>
  );
};
export default MessageItem;
