import { useEffect, useRef, useState } from "react";
import type { Playback, Track } from "../constants/schema";

/**
 * Drives a hidden SoundCloud embed with the Widget API.
 *
 * Playback is server-authoritative: `playback.startedAt` is the shared clock,
 * so a joining client seeks to `now - startedAt`. A periodic drift check
 * re-seeks if the widget has fallen behind. No SoundCloud API key is needed —
 * the widget controls the public embed directly (ADR-003).
 */

type SCWidget = {
  bind: (event: string, cb: () => void) => void;
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  setVolume: (volume: number) => void;
  getPosition: (cb: (ms: number) => void) => void;
  load: (
    url: string,
    options?: { auto_play?: boolean; callback?: () => void }
  ) => void;
};

type SCLoader = {
  Widget: ((element: HTMLIFrameElement) => SCWidget) & {
    Events: {
      READY: string;
      PLAY: string;
      PAUSE: string;
      FINISH: string;
      ERROR: string;
    };
  };
};

declare global {
  interface Window {
    SC?: SCLoader;
  }
}

const DRIFT_INTERVAL_MS = 10_000;
const DRIFT_THRESHOLD_MS = 3_000;

export function useStationPlayer(options: {
  track: Track | null;
  playback: Playback;
  volume: number;
  onEnded: () => void;
}) {
  const { track, playback, volume, onEnded } = options;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SCWidget | null>(null);
  const [ready, setReady] = useState(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Load the Widget API once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.SC) {
      setReady(true);
      return;
    }

    const SCRIPT_ID = "soundcloud-widget-api";
    const handleLoad = () => setReady(true);
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://w.soundcloud.com/player/api.js";
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", handleLoad);

    return () => script?.removeEventListener("load", handleLoad);
  }, []);

  // Bind the widget to the iframe.
  useEffect(() => {
    const element = iframeRef.current;
    if (!ready || !window.SC || !element) return;

    // SC.Widget() parses the iframe's `src` to derive the player origin and
    // throws if the attribute is missing (`getAttribute("src")` -> null).
    // Give it a player URL before constructing the widget; `load()` replaces
    // it with the actual track.
    if (!element.getAttribute("src")) {
      element.setAttribute("src", "https://w.soundcloud.com/player/?url=");
    }

    const widget = window.SC.Widget(element);
    widgetRef.current = widget;
    widget.bind(window.SC.Widget.Events.FINISH, () => onEndedRef.current());
    return () => {
      widgetRef.current = null;
    };
  }, [ready]);

  // Load a new track and seek to the shared position.
  useEffect(() => {
    const widget = widgetRef.current;
    if (!ready || !widget || !track) return;

    const offset = playback.isPlaying
      ? Math.max(0, Date.now() - playback.startedAt)
      : 0;

    widget.load(track.sourceId, {
      auto_play: false,
      callback: () => {
        widget.seekTo(offset);
        if (playback.isPlaying) widget.play();
      },
    });
    // Reload only when the track or its start time changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, track?.id, playback.startedAt]);

  // Follow the authoritative play/pause state.
  useEffect(() => {
    const widget = widgetRef.current;
    if (!ready || !widget) return;
    if (playback.isPlaying) widget.play();
    else widget.pause();
  }, [ready, playback.isPlaying]);

  useEffect(() => {
    widgetRef.current?.setVolume(volume);
  }, [ready, volume]);

  // Correct drift: the server clock is the source of truth.
  useEffect(() => {
    if (!ready || !playback.isPlaying || !track) return;
    const interval = setInterval(() => {
      widgetRef.current?.getPosition((position) => {
        const expected = Date.now() - playback.startedAt;
        if (Math.abs(position - expected) > DRIFT_THRESHOLD_MS) {
          widgetRef.current?.seekTo(expected);
        }
      });
    }, DRIFT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [ready, playback.isPlaying, playback.startedAt, track]);

  return { iframeRef, ready };
}
