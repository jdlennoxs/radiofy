import {
  useEffect,
  useRef,
  type TextareaHTMLAttributes,
} from "react";

/**
 * Textarea that grows with its content. Kept from the original chat: focuses on
 * mount and resets height on every value change so it shrinks as well as grows.
 */
const AutoTextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }, [props.value]);

  return (
    <textarea
      rows={1}
      {...props}
      ref={textareaRef}
      className="max-h-40 w-full resize-none rounded-lg bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 focus:ring-amber-500 disabled:opacity-50"
    />
  );
};

export default AutoTextArea;
