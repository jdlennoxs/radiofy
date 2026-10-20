# ADR-003 — Freeze Spotify, pivot to a guest-only SoundCloud demo

**Status:** Accepted
**Date:** 2026-10-20
**Supersedes:** the Spotify- and Supabase-dependent parts of `ADR-002-STAY-ON-TRPC-SUPABASE.md`
**Frozen artefact:** tag `archive/spotify-v1` (the full Spotify version, post-uplift)

---

## Context

ADR-002 chose to stay on TypeScript, adopt Supabase, and keep Spotify (including the Web Playback SDK). That decision assumed Spotify could still be the audio platform.

It cannot. On 2026-02-06 Spotify announced that, from 2026-03-09, **Development Mode** apps require a Premium owner, are limited to **one Client ID**, and are capped at **five authorised users**; Extended Quota Mode (the only way past that) requires a **registered organisation**, a **launched service**, **≥250k MAU**, and passing review. The Web Playback SDK policy also forbids commercial streaming integrations.

There is no code change that fixes this: a collaborative listening app built on Spotify auth cannot be opened to real users. The app was 5 testers or nothing.

Two further facts shape what replaces it:

1. **The one-process SSE change (ADR-002) removed the need for a database.** Realtime fan-out is an in-process `EventEmitter`, so station state can live in memory.
2. **SoundCloud's Widget API exposes full transport control without an API key.** `SC.Widget(iframe)` supports `play`, `pause`, `seekTo`, `setVolume`, `getPosition`, `getDuration`, and a `FINISH` event over `postMessage`. API keys now require Artist Pro, but they are only needed for *search* — not playback. (Bandcamp has no equivalent: its embed cannot be driven, so the sync core cannot be built on it.)

The project goal also changed: this is now a **portfolio piece**, not a product.

## Decision

Keep the uplift (Next 16, React 19, tRPC v11, TanStack Query v5, SSE, strict TS, CI) and strip the product scaffolding:

| Concern | Decision |
| --- | --- |
| Spotify | **Removed.** `archive/spotify-v1` preserves it. |
| Auth | **None.** Guest identity: client-generated `{id, name}` in `localStorage`. NextAuth removed. |
| Database | **None.** In-memory station store on the server. No history; state resets on restart. |
| Supabase | **Not adopted.** It solved auth + Postgres + RLS for a product that no longer exists. |
| Audio | **SoundCloud**, via the Widget API. Curated library; metadata from public oEmbed (no key). |
| Realtime | tRPC v11 SSE, unchanged. One process. |
| Sync | Server-authoritative: `{ trackId, startedAt, isPlaying }`; joining clients seek to `now − startedAt`. |

## Architecture

```text
server/store.ts     Map<stationId, Station>  +  module-level EventEmitter
                    (messages, playlist, playback, listeners)
server/router/      station: list, get, join, sendMessage, play, next, setVolume,
                    onMessage, onPlayback   (all publicProcedure, no session)
hooks/useGuest.ts   localStorage {id, name}
hooks/useStationPlayer.ts
                    hidden <iframe> + SC.Widget; load → seekTo(offset) → play();
                    FINISH → next; drift check via getPosition; setVolume
```

In-memory state is only coherent in a **single process** — which the SSE change guarantees on one box. Multi-instance deployment would need Redis or a DB; explicitly out of scope.

## Consequences

- **No history.** The unified timeline — ADR-002's "asset" — resets on restart. Acceptable for a demo; Prisma can be re-added if persistence is ever wanted.
- **Single instance only.**
- **SoundCloud's platform, not ours.** Users aren't gated, but embeds may carry ads, and a track can have embedding disabled.
- **Browser autoplay policy** requires a user gesture; joining a station is that gesture.
- The ADRs (`001 → 003`) and `CODEBASE-APPRAISAL.md` remain the durable artefacts regardless of what happens to the code.

## Rejected alternatives

- **Bandcamp** — no transport-control API; cannot seek or detect end-of-track, so server-authoritative sync is impossible. Best case is a passive "buy this" link.
- **Self-hosted CC0/CC-BY audio** — viable and licence-clean, but needs hosting and attribution, and gives a smaller, less convincing catalogue.
- **radio-browser.info / internet radio** — no gatekeeper and a great fit for the name, but per-track queue/transport semantics collapse to a single live stream.
- **Audius** — free API, real tracks; kept as a future `MusicSource` implementation.
- **Continuing with Spotify** — 5 users, or 250k MAU before you may ask for more.

## Definition of done

- [ ] No NextAuth, no Prisma, no Spotify, no Supabase dependency
- [ ] Guest name persists in `localStorage`; no login surface
- [ ] Two browsers in one station see the same timeline live
- [ ] A joining browser seeks into the currently-playing SoundCloud track at the right offset
- [ ] Track end advances the queue for everyone exactly once
- [ ] `tsc --noEmit`, `vitest run`, `next build` green; CI passes
