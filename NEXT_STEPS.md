# Next steps (top 3 priorities)

This document captures the three most important follow-up tasks to move Radiofy toward the intended “Clubhouse meets turntable.fm” experience, while keeping playback tied to each user’s Spotify account.

## 1) Upgrade Next.js + tRPC and evaluate the App Router migration

**Why:** The project is on Next 12 + tRPC v9. Upgrading unblocks modern Next features, better data fetching primitives, and a smoother path to long-term maintenance.

**Key actions**
- Upgrade **Next.js** to the latest LTS (currently 14.x) and update React/TypeScript as needed.
- Upgrade **tRPC** to the latest major (v10), update router definitions and client setup.
- Decide whether to migrate to the **App Router** now or in a follow-up phase.
  - If migrating: move route handlers, layout, and pages into `app/`.
  - If deferring: keep `pages/` while modernizing the rest.

**Acceptance criteria**
- App boots on latest Next + tRPC with no runtime errors.
- Type-safe API calls still compile and run.
- Dev experience is stable (dev server, linting, and WS server run).

## 2) Implement real-time playback sync tied to station state

**Why:** Playback synchronization is core to the station experience and currently only partially implemented.

**Key actions**
- Define a **station playback state** contract (track ID, start time, isPlaying).
- Broadcast playback updates via tRPC subscriptions (or a dedicated WS channel).
- On the client, align local playback with the station state and handle drift.

**Acceptance criteria**
- Joining a station aligns playback to the current track/time.
- When the station owner starts/changes a track, all listeners update in sync.

## 3) Add queue + voting workflows with owner controls

**Why:** The “turntable” experience depends on collaborative queueing and voting.

**Key actions**
- Introduce **queue** and **vote** models (Prisma) and expose via tRPC.
- Build UI for adding tracks to a station queue and for voting.
- Add owner-only controls for skipping/reordering/approving tracks.

**Acceptance criteria**
- Users can add tracks to a station queue and vote on them.
- Owner can advance or reorder the queue and it updates for everyone.

---

If you want, the next follow-up could be a phased migration plan that breaks each item into week-by-week milestones.
