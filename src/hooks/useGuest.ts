import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Guest } from "../constants/schema";

/**
 * Guest identity: no auth. A client-generated id + display name persisted in
 * localStorage. A module-level store keeps every component (Header, pages) on
 * the same value without a provider.
 */
const STORAGE_KEY = "campfire:guest";

let current: Guest | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return null;
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function persist(next: Guest) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — identity lives for the session only */
  }
  notify();
}

function ensure() {
  if (typeof window === "undefined" || current) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Guest;
      if (parsed?.id && parsed?.name) {
        current = parsed;
        notify();
        return;
      }
    }
  } catch {
    /* fall through to a fresh identity */
  }
  const id = randomId();
  persist({ id, name: `Guest ${id.slice(0, 4)}` });
}

export function useGuest() {
  const guest = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensure();
  }, []);

  const rename = useCallback((name: string) => {
    if (!current) return;
    const trimmed = name.trim().slice(0, 32);
    persist({ ...current, name: trimmed || current.name });
  }, []);

  return { guest, rename };
}
