# Radiofy

Radiofy is a Next.js (T3-stack) application for creating shared listening “stations” powered by Spotify. Users sign in with Spotify, browse their stations, and join a station to chat and control playback. The app uses tRPC for type-safe APIs, Prisma for data storage, and a WebSocket server for real-time station updates and playback events.

## What’s inside

- **Next.js + React** for the UI and routing.
- **tRPC** for end-to-end types between client and server.
- **NextAuth (Spotify provider)** for authentication and Spotify token management.
- **Prisma + SQLite** for the database layer.
- **WebSocket server** for live subscriptions (chat + playback events).
- **Tailwind CSS** for styling.

## Key directories

- `src/pages`: Next.js pages (home, station view) and API routes.
- `src/components`: Reusable UI components for chat, playback, playlists, etc.
- `src/server`: tRPC routers, Prisma client, Spotify API client, and WS server.
- `src/hooks`: Custom hooks (Spotify Web Playback SDK).
- `prisma`: Database schema and Prisma artifacts.
- `src/constants`: Shared schemas and event names.

## Development

### Prerequisites

- Node.js (version compatible with Next.js 12)
- pnpm (recommended by the repo’s lockfile)

### Install dependencies

```bash
pnpm install
```

### Environment variables

Set the following environment variables (usually via `.env`):

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Run the app

Run both the Next.js app and WebSocket server:

```bash
pnpm dev
```

That command runs:

- `pnpm dev:next` (Next.js)
- `pnpm dev:ws` (tRPC WebSocket server)

### Build and start

```bash
pnpm build
pnpm start
```

## Helpful pointers

- **tRPC routers**: `src/server/router`
- **Spotify integration**: `src/server/router/spotify.ts` and `src/hooks/useSpotifyWebPlaybackSdk.ts`
- **Auth config**: `src/pages/api/auth/[...nextauth].ts`
- **DB models**: `prisma/schema.prisma`

## Current state (as inferred)

The project has a solid scaffold for stations, chat, and Spotify playback, but some of the intended user flow is only partially implemented.

**What’s working today**
- Spotify authentication with NextAuth is in place.
- Stations can be loaded from the database.
- Chat messages are persisted and broadcast via tRPC subscriptions.
- A WebSocket server exists to back tRPC subscriptions.
- A Spotify Web Playback SDK hook initializes a player device.

**What appears incomplete or missing**
- Station “join” flow is minimal (no explicit membership model or join logic).
- Playback synchronization across listeners is not fully implemented (playback context exists, but client sync logic is minimal).
- Queueing and voting workflows are not present.
- Ownership/admin flows (e.g., queue management) are not implemented in the UI.

## Intended experience (goal state)

The desired flow sounds like:

1. **Listeners join a station** and automatically sync playback to the station’s current track/time.
2. **Station owners queue tracks** and everyone advances to the next track together.
3. **Live chat + voting** on tracks in real time.

## Next steps to reach the goal

Suggested areas to build out next:

- **Station membership & join flow**: add a join endpoint + UI and optionally store memberships in the DB.
- **Playback sync**: broadcast track start + timestamp from the server and align clients.
- **Queue + voting**: define queue/vote models and expose them via tRPC, then wire UI.
- **Owner controls**: surface admin actions for station owners (start/stop/skip, reorder queue, etc.).

## Next steps for newcomers

- Trace a station flow: UI (`src/pages/station/[stationId].tsx`) → tRPC (`src/server/router/station.ts`) → database (`prisma/schema.prisma`).
- Explore how the Web Playback SDK and Spotify API are used together.
- Add tests or improve validation on inputs where needed.
