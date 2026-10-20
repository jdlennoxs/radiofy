import { useEffect, useRef, useState } from "react";
import type { Message } from "../constants/schema";

/**
 * A track in the timeline. Every track row is sticky, not just the current one:
 * as the timeline scrolls, each track pins to the top and the next one covers
 * it, so the newest tracks stack at the top. Once a row has stuck it goes fully
 * opaque and drops its top margin, so stacked rows abut cleanly and hide the
 * messages scrolling beneath them.
 *
 * "Stuck" is measured against the timeline's own scroll container (not the
 * window): the row's top edge reaching the container's top edge.
 *
 * `isCurrent` only drives the "playing" highlight.
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

  const border = isCurrent ? "border-amber-600/60" : "border-zinc-800";

  // Stuck: a full-bleed band pinned to the top — margin, corners and the
  // side/top border all drop away, background goes opaque. Animating those
  // properties is what makes the pin feel slick.
  const state = stuck
    ? `z-10 mx-0 my-0 rounded-none border-x-0 border-t-0 bg-zinc-950 ${border}`
    : `mx-4 my-3 rounded-lg ${isCurrent ? "bg-amber-950" : "bg-zinc-900"} ${border}`;

  return (
    <div
      ref={ref}
      className={`sticky top-0 flex items-center gap-3 border p-3 transition-[background-color,border-color,border-radius,margin] duration-200 ease-in-out ${state}`}
    >
      {track.artwork ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artwork} alt="" className="h-12 w-12 rounded" />
      ) : (
        <span className="grid h-12 w-12 place-items-center rounded bg-zinc-800">
          ♪
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">
          {track.name}
        </p>
        <p className="truncate text-xs text-zinc-400">
          {track.artist} · added by {message.sender.name}
        </p>
      </div>
      {isCurrent ? (
        <span className="shrink-0 text-xs text-amber-400">playing</span>
      ) : (
        <button
          type="button"
          onClick={() => onPlay(track.id)}
          className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:border-amber-600"
        >
          Play
        </button>
      )}
    </div>
  );
}
