# Campfire

A shared listening room. Open a station, and everyone in it hears the same
track at the same position while talking over it in a live timeline. No
account, no sign-in — pick a display name and join.

Originally built on Spotify (auth + Web Playback SDK). Spotify's February 2026
developer changes capped Development Mode apps at **five allowlisted users** and
closed Extended Quota Mode to individuals, so it could never be opened to a real
audience. The Spotify version is preserved at tag `archive/spotify-v1`.

Campfire now runs **guest-only**, with an **in-process station store** and
**SoundCloud** playback. The decision is written up in
[`research/ADR-003-PORTFOLIO-PIVOT.md`](research/ADR-003-PORTFOLIO-PIVOT.md).

## What's interesting here

- **Server-authoritative playback sync.** The server owns
  `{ trackId, startedAt, isPlaying }`. A late joiner seeks to
  `now − startedAt`; clients re-seek if they drift more than three seconds.
- **Realtime with no realtime service.** tRPC v11 subscriptions run over **SSE**
  through a normal HTTP handler — one process, no WebSocket server, no port 3001.
- **No database.** Station state is a `Map` in the process. The single-process
  SSE design is exactly what makes that viable.
- **No auth.** Guest identity is a client-generated id + name in `localStorage`.
- **Music without an API key.** SoundCloud's Widget API drives the public embed
  directly (play / pause / seek / volume + a `FINISH` event); track metadata
  comes from the public oEmbed endpoint.

## Stack

Next 16 (Pages Router) · React 19 · tRPC v11 · TanStack Query v5 · superjson ·
Tailwind · TypeScript (strict) · Vitest · GitHub Actions.

## Architecture

```text
browser ── httpBatchLink ──────────────┐
                                       ├─ /api/trpc/[trpc] ─ tRPC router ─ store (Map + EventEmitter)
browser ── httpSubscriptionLink (SSE) ─┘
                    ▲
        useStationPlayer ── SoundCloud Widget (hidden iframe)
```

- `src/server/store.ts` — in-memory stations: messages, playlist, playback, presence
- `src/server/router/station.ts` — list · get · sendMessage · play · next · setPlaying · trackEnded, plus message/playback/presence subscriptions
- `src/hooks/useStationPlayer.ts` — SoundCloud widget, late-join seek, drift correction, end-of-track advance
- `src/hooks/useGuest.ts` — localStorage identity
- `src/server/seed.ts` — the curated SoundCloud library (add tracks by permalink)
- `research/` — ADR-001 (Go port — rejected), ADR-002 (stay on TS + uplift), ADR-003 (this pivot), plus a red-team codebase appraisal

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

No environment variables or secrets are required. To see the sync for yourself,
open the same station in two browser windows and put a track on.

```bash
pnpm build && pnpm start     # production
pnpm tsc --noEmit            # typecheck
pnpm exec vitest run         # tests
```

## Limits (deliberate)

- **Single instance.** In-memory state means this runs in one process;
  multi-instance would need shared state (Redis/Postgres).
- **No history.** Messages reset when the server restarts.
- **SoundCloud is someone else's platform.** Listeners aren't gated, but
  free-tier users may hear SoundCloud ads, and an artist can disable embedding
  on a track.
- **Autoplay.** Browsers require a user gesture; the first click in a room
  starts playback.

## A short history

This repo also contains the engineering decisions behind it:

- `research/CODEBASE-APPRAISAL.md` — a red-team review of the original app
- `research/ADR-001-GO-PORT-PLAN.md` — a Go rewrite, evaluated and rejected on cost
- `research/ADR-002-STAY-ON-TRPC-SUPABASE.md` — staying on TypeScript and the staged Next/tRPC/React uplift
- `research/ADR-003-PORTFOLIO-PIVOT.md` — freezing Spotify and the guest-only rebuild
