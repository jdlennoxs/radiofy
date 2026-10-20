import { useEffect, useRef, useState } from "react";
import type { Message } from "../constants/schema";

/**
 * A track in the timeline. Every track row is sticky, not just the current one:
 * as the timeline scrolls, each track pins to the top and the next one covers
 * it, so the newest tracks stack at the top.
 *
 * Once a row has stuck it drops its top margin, so there is no gap above it.
 * "Stuck" is measured against the timeline's own scroll container (not the
 * window). The background is uniform; `isCurrent` only tints the border and
 * shows the "playing" label.
 */
export default function TrackUpdate({
  message,
  isCurrent,
  onPlay,
}: {
  message: Message;
  isCurrent: boolean;
  onPlay: (trackId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const container = element.closest<HTMLElement>("[data-timeline-scroll]");
    const update = () => {
      const elementTop = element.getBoundingClientRect().top;
      const containerTop = container?.getBoundingClientRect().top ?? 0;
      setStuck(elementTop <= containerTop + 1);
    };

    update();
    // Capture phase: scroll doesn't bubble, but a capturing listener on window
    // still sees scrolls from inner scroll containers.
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, []);

  const track = message.track;
  if (!track) return null;

  const border = isCurrent ? "border-forest-500" : "border-cream-300";

  return (
    <div
      ref={ref}
      className={`sticky top-0 flex items-center gap-3 rounded-lg border bg-white p-3 transition-[margin] duration-150 ease-in-out ${border} ${
        stuck ? "my-0" : "my-3"
      }`}
    >
      {track.artwork ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artwork} alt="" className="h-12 w-12 rounded" />
      ) : (
        <span className="grid h-12 w-12 place-items-center rounded bg-cream-200 text-forest-700">
          ♪
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-forest-900">
          {track.name}
        </p>
        <p className="truncate text-xs text-forest-600">
          {track.artist} · added by {message.sender.name}
        </p>
      </div>
      {isCurrent ? (
        <span className="shrink-0 text-xs text-forest-600">playing</span>
      ) : (
        <button
          type="button"
          onClick={() => onPlay(track.id)}
          className="shrink-0 rounded border border-cream-400 px-2 py-1 text-xs text-forest-700 transition hover:border-forest-500"
        >
          Play
        </button>
      )}
    </div>
  );
}
