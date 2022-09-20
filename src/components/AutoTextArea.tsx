import React, {
  useState,
  useEffect,
  useRef,
  TextareaHTMLAttributes,
} from "react";

const AutoTextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // The value of the textarea
  const [value, setValue] = useState<String>();

  // This function is triggered when textarea changes
  const textAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    props?.onChange(event);
  };

  useEffect(() => {
    textareaRef.current.focus();
  }, []);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      className="resize-none shadow-inner h-fit py-2 px-4 w-full text-zinc-900 rounded-lg"
      ref={textareaRef}
      onChange={textAreaChange}
      onKeyDown={props.handleKeyDown}
    >
      {value}
    </textarea>
  );
};

export default AutoTextArea;
