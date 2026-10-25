import Link from "next/link";
import { useState } from "react";
import { useGuest } from "../hooks/useGuest";

export default function Header() {
  const { guest, rename } = useGuest();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-cream-300/80 bg-cream-100/70 px-5 backdrop-blur">
      <Link
        href="/"
        className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-forest-800 hover:text-forest-600"
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
              className="w-36 rounded bg-white px-2 py-1 text-sm text-forest-900 outline-none ring-1 ring-cream-300 focus:ring-forest-500"
            />
            <button type="submit" className="text-xs text-forest-600">
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
            className="flex items-center gap-2 text-sm text-forest-700 hover:text-forest-900"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-cream-300 text-xs uppercase text-forest-800">
              {guest.name.slice(0, 2)}
            </span>
            {guest.name}
          </button>
        ))}
    </header>
  );
}
