import React, {
  useState,
  useEffect,
  useRef,
  TextareaHTMLAttributes,
} from "react";

const AutoTextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [props.value]);

  return (
    <textarea
      {...props}
      className="resize-none shadow-inner h-fit py-2 px-4 w-full text-zinc-900 rounded-lg"
      ref={textareaRef}
    />
  );
};

export default AutoTextArea;
