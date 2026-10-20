import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Observes an element's bounding rect, updating on scroll (capture, so it also
 * catches scrolls from inner scroll containers) and resize. Used by the
 * timeline's now-playing row to detect when it has stuck to the top.
 */
export const useRect = <T extends Element>(): [
  DOMRect | undefined,
  RefObject<T | null>
] => {
  const ref = useRef<T>(null);
  const [rect, setRect] = useState<DOMRect>();

  const set = () => setRect(ref.current?.getBoundingClientRect());

  const useEffectInEvent = (
    event: "resize" | "scroll",
    useCapture?: boolean
  ) => {
    useEffect(() => {
      set();
      window.addEventListener(event, set, useCapture);
      return () => window.removeEventListener(event, set, useCapture);
    }, []);
  };

  useEffectInEvent("resize");
  useEffectInEvent("scroll", true);

  return [rect, ref];
};
