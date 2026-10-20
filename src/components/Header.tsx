import Link from "next/link";
import { useState } from "react";
import { useGuest } from "../hooks/useGuest";

export default function Header() {
  const { guest, rename } = useGuest();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-5 backdrop-blur">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight hover:text-amber-400"
      >
        <span aria-hidden className="text-xl">
          🔥
        </span>
        Campfire
      </Link>

      {guest &&
        (editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              rename(value);
              setEditing(false);
            }}
            className="flex items-center gap-2"
          >
            <input
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={guest.name}
              maxLength={32}
              className="w-36 rounded bg-zinc-900 px-2 py-1 text-sm outline-none ring-1 ring-zinc-700 focus:ring-amber-500"
            />
            <button type="submit" className="text-xs text-amber-400">
              save
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setValue(guest.name);
              setEditing(true);
            }}
            title="Change display name"
            className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-800 text-xs uppercase">
              {guest.name.slice(0, 2)}
            </span>
            {guest.name}
          </button>
        ))}
    </header>
  );
}
