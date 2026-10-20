# Radiofy — Red-Team Codebase Appraisal

**Date:** 2026-10-20
**Commit:** `9217bc1` ("Just getting things working again") on `main`
**Scope:** `src/` (40 TS/TSX files, ~2,100 LOC), `prisma/`, build/runtime config, git history
**Method:** read every source file; ran `tsc --noEmit`, `next build`, `next dev`, live HTTP/tRPC/auth probes, Prisma + SQLite introspection, and module-level API introspection against the *installed* dependency versions. Claims are tagged:

- ✅ **verified by execution** — I ran it and saw the output
- 🔍 **verified by reading code/types** — direct code or type evidence, not executed
- ❓ **inferred** — reasoned from evidence, not independently confirmed

If a claim below is wrong, the tag tells you where to push back.

---

## 1. Verdict

**Radiofy has a good idea, a decent domain model, and an execution that cannot currently run.**

The app is **not** in a "polish and ship" state, and it is not in a "the code needs tidying" state either. It is in a state where **the source on disk and the dependencies on disk come from two different branches**, so nothing compiles, the API 500s, and the realtime layer cannot work. Underneath that, there are ~10 genuine logic bugs that would still be live after the build is fixed, and two architectural decisions (process topology, and a shared Spotify token singleton) that make the app unshippable to multiple users regardless of bug fixes.

The honest summary in one line: **the *concept* is at roughly 7/10, the *domain model* at 6/10, and the *runtime/infrastructure* at 2/10.**

Three things are true at once and it's worth separating them, because they get conflated:

| Layer | State |
| --- | --- |
| Product idea | Good. Collaborative station + chat + shared playback is coherent and fun. |
| Domain model | Reasonable shape, several real modelling gaps (no membership, no message discriminant, no indexes). |
| Runtime / infra | Broken. Two processes disagreeing about state, a global token, serverless-hostile sockets, deps from another branch. |

---

## 2. What it is

### Intent

A collaborative Spotify "radio station" app. Users sign in with Spotify, own or join a **Station**, and each Station has:

- a **shared playback context** (what's currently playing, when it started, whether it's playing)
- an **append-only timeline of Messages**, where each message is either a **chat message** or a **track event**
- live updates pushed to everyone watching that Station

### The actual runtime topology

This is where the design gets interesting and where it goes wrong.

```text
                 ┌─────────────────────────────────────────┐
                 │ Process A: `next dev` (port 3000)       │
                 │  - pages, React                          │
                 │  - /api/auth/[...nextauth]               │
                 │  - /api/trpc/[trpc]   (HTTP tRPC)        │
                 │  - its own module-scope EventEmitter     │
                 └───────────────┬─────────────────────────┘
                                 │
                 browser ────────┼──────────────► but the browser does NOT
                                 │                use the HTTP link; it uses
                                 │                wsLink for *everything*
                                 ▼
                 ┌─────────────────────────────────────────┐
                 │ Process B: `ts-node-dev` (port 3001)     │
                 │  - ws-server.ts, applyWSSHandler         │
                 │  - its own module-scope EventEmitter     │
                 │    (a DIFFERENT instance to Process A)   │
                 └─────────────────────────────────────────┘
                        both started by `run-p dev:*`
```

**Two processes, two independent `EventEmitter` instances, two module-level `spotifyApi` singletons.** The client is wired (`src/pages/_app.tsx:53-56`) to send *all* tRPC traffic — queries, mutations, and subscriptions — over the WebSocket, so in practice Process B handles the browser's requests. That is the only reason the app appears to have ever worked: mutations and subscriptions happened to land in the same process, so the emitter happened to be shared.

Break that coincidence (SSR, a non-browser client, a curl, or the server-side `httpBatchLink`) and the mutation emits into Process A's emitter while subscriptions listen on Process B's — silently, with no error. There is no shared bus, no pub/sub, no room registry. It is shared in-memory state pretending to be a message queue. ❓/🔍

### Data flow

1. Spotify OAuth via NextAuth, JWT session, access/refresh tokens stashed in the JWT.
2. Client asks for a station (`station.getStation` → 100 messages), renders chat + track events from one stream.
3. Client posts a chat message (`station.send-message`) or a track (`station.play`) → row written to `Message` → `eventEmitter.emit` → `station.onSendMessage` subscription filters by `stationId` → all watchers append to local state.
4. In-browser playback via the Spotify Web Playback SDK (`useSpotifyWebPlaybackSdk`); device/volume/playlist/library control via the Web API through tRPC.

### The domain model, annotated

```text
Station ──(admin)──► User
   │
   ├── PlaybackContext (1:1) ──► Track
   └── Message[]  (the whole timeline)
           ├── type: String  ← "CHAT" | "TRACK", unvalidated
           ├── chat:  Chat?  ┐
           ├── track: Track? ┘  XOR, not enforced
           └── sender: User
```

The genuinely nice part: **the chat log and the playback history are the same stream.** One `Message` table carries both chat and track events, so a Station's timeline *is* its history. For this product that's an elegant unification, not an accident — it's the best design decision in the repo.

---

## 3. The immediate blocker: the repo is two branches at once

Before any deeper criticism, this is why you "can't log in" and why nothing else works either.

### 3.1 `node_modules` was installed from `feature/upgrade-next`, source is `main`

`main`'s `package.json` vs what is actually on disk: ✅

| Package | Declared in `package.json` (main) | Installed in `node_modules` | Lockfile says |
| --- | --- | --- | --- |
| `next` | `12.2.0` | **`16.1.6`** | `12.2.0` |
| `react` / `react-dom` | `18.2.0` | **`19.2.4`** | `18.2.0` |
| `@trpc/server` | `^9.25.3` | **`10.45.4`** | — |
| `@trpc/react` | `^9.25.3` | **absent** (replaced by `@trpc/react-query`) | — |
| `typescript` | `4.7.4` | **`5.9.3`** | — |
| `react-query` | `^3.39.1` | **`@tanstack/react-query` 4.43.0** | — |

`node_modules/.pnpm` contains **only** `next@16.1.6`, `react@19.2.4`, `@trpc+server@10.45.4`. The committed `pnpm-lock.yaml` pins `next@12.2.0`. So the lockfile does not describe `node_modules` — someone ran an install while checked out on `feature/upgrade-next` (whose `package.json` is an exact match for what's installed: `next: ^16.1.6`, `react: 19.2.4`, `@trpc/*: ^10.45.2`, `@types/react: 19.2.11`) and then switched back to `main` without reinstalling. ✅

### 3.2 The consequence: tRPC v9 source cannot run on tRPC v10

The code uses the **v9 router API** (`createRouter()`, `trpc.router()`, `.merge()`, `new trpc.Subscription`, `createReactQueryHooks`, `withTRPC`). v10 replaced all of it with `initTRPC` / `publicProcedure` / `@trpc/react-query`. Machine-verified:

```text
src/utils/trpc.ts(3,39): error TS2307: Cannot find module '@trpc/react'
src/server/router/station.ts(85,23): error TS2339: Property 'Subscription' does not exist
  on type 'typeof import(".../@trpc+server@10.45.4/dist/index")'
src/pages/api/trpc/[trpc].ts(8,3): error TS2322: Type 'Router<...>' is not assignable to 'AnyRouter'
  Type '{ queries: ... }' is missing: _config, router, procedures, record
src/server/router/context.ts(4,48): error TS2307: Cannot find module
  '@trpc/server/dist/declarations/src/adapters/node-http'
```

That last-but-one error is the smoking gun: a **v9 `RouterDef` (`queries`/`mutations`/`subscriptions`) being handed to a v10 `AnyRouter`, which wants `_config`/`router`/`procedures`/`record`.**

At runtime this is not a compile-time nicety — it's a hard 500 on every API call: ✅

```text
⨯ TypeError: Cannot read properties of undefined (reading 'isDev')
    at ignore-listed frames { page: '/api/trpc/[trpc]' }
 GET /api/trpc/dashboard.getOwned 500 in 1124ms
```

`isDev` lives on v10's `RootConfig` at `router._def._config.isDev`; the v9 router has no `_def._config`, hence `undefined.isDev`. **Every tRPC route is dead.**

### 3.3 Totals

- `npx tsc --noEmit` → **38 errors** across 15 files. ✅
- `npx next build` → **fails**. ✅ (first blocker: `AutoTextArea.tsx:37`)
- `pnpm dev` → Next 16 boots and serves `/api/auth/*` fine, but the API layer 500s on every call. ✅

### 3.4 The auth file specifically

Separately from the above, `src/pages/api/auth/[...nextauth].ts` had **unresolved merge conflict markers** committed into the working tree — a parse error that made *every* `/api/auth/*` route 500. I resolved that during the earlier session (taking git's `:3` "Stashed changes" side, which is the type-correct one and the only side containing the `MOCK_LOGIN` credentials provider); it's staged and verified working. That fix is a *prerequisite* for discussing auth at all, not the whole story — §6.3 covers the auth design itself.

### 3.5 Why the repo is in this state

This is not bad luck, it's a process symptom, and it's the most diagnostically interesting thing in the repo: ✅

- **11 branches, 4 stashes, 12 commits.** Five branches are the *same* dependency upgrade attempted five times: `next-13`, `trpc-10`, `upgrade-trpc`, `feature/upgrade-next`, plus two `codex/*` branches branching off those. None are merged.
- Commits named *"Not quite working update"*, *"WIP for trpc v10"*, *"All switched over but no websockets connection"*, *"Just getting things working again"*.
- **Zero tests, zero CI** (no `.github`, no Dockerfile). With no safety net, every upgrade is a manual, all-or-nothing, unverifiable slog — which is exactly why five attempts stalled and a conflicted merge sat unresolved in the tree.

The repo's real problem is not any single bug. **It's that there is no way to know whether a change broke anything**, so changes accumulate in a half-finished state until the app stops running.

---

## 4. What's genuinely good

Red-teaming is worthless if it's only demolition. Things that are actually right:

1. **The unified timeline.** One `Message` stream for both chat and track events means a Station's history and its playback log are the same object. It halves the model, makes "what happened in this room" one query, and makes realtime one subscription instead of two. This is a real design insight. (§2)
2. **`LikeButton`'s optimistic update is textbook-correct.** ✅ It does the full React Query dance properly: `cancelQuery` → snapshot previous → `setQueryData` → `onError` rollback from context → `onSettled` invalidate. Most hobby code skips the cancel and the rollback; this doesn't. `src/components/LikeButton.tsx:18-50`
3. **Real migrations, checked in.** Eleven ordered `prisma/migrations/*/migration.sql` files, not `db push`. That's better discipline than most projects this size. The SQLite table-rebuild pattern is verbose but correct.
4. **`.env.local` is correctly gitignored, and no secret has ever been committed.** ✅ I checked `git log --all --diff-filter=A` — the only env file ever added is an (empty) `.env-example`. `NEXTAUTH_SECRET`, the Spotify client secret, etc. are all local-only. Good.
5. **`createContext` is the right seam.** Session, Prisma, Spotify client, and the event bus all enter through one function, used by both the HTTP and WS adapters. The *implementation* is broken (§5, §6) but the *architecture* is correct — this is where you'd fix auth for both transports in one place.
6. **Files are small and readable.** Largest server file is 176 lines; largest page is 44. No barrel-file spaghetti, no 800-line components, conventional Next routing. A newcomer can navigate this. That is worth real credit and it is *why* this appraisal could be done thoroughly in one pass.
7. **tRPC over typed RPC is the right call** for a solo/small project with one client. The end-to-end inference idea is right even though the version is wrong.
8. **`useRect` / `useDebounce`** are small, correct, dependency-free. Fine.
9. **The resolved auth file** does the right thing with Spotify's refresh response (`expires_in`, not `expires_at`) and models the JWT/session shape explicitly.

---

## 5. Findings, ranked

Legend: **C** = critical (blocks correctness or safety), **H** = high, **M** = medium, **L** = low / hygiene.

### C1. A module-level Spotify client shared by all users ✅🔍

```ts
// src/server/spotify/client.ts
export const spotifyApi = new SpotifyWebApi({ clientId, clientSecret });
```

```ts
// src/server/router/context.ts:27
spotify.setAccessToken(session.accessToken);   // mutates the ONE shared instance
```

Every request does `setAccessToken` on **one process-wide singleton**. The token is not per-request state, it's global mutable state. Two logged-in users: whoever's request lands last sets the token, and **then every subsequent request acts as that user** — reading their playlists, changing their volume, transferring playback to their devices, modifying their library.

This is not a race that requires concurrency to trigger; `createContext` runs per connection/per request, and the token simply overwrites. `ctx.spotify` looks per-request but isn't.

**Why it's critical:** it's silent, it's cross-user data access, and the app requests `user-modify-playback-state`, `user-library-modify`, `streaming`, and `playlist-read-private`. It is the single most dangerous thing in the repo.

**Fix:** the Spotify client must be constructed per request with that user's token: `const spotify = createSpotifyClient(session.accessToken)`. Keep client credentials in a shared config object; keep tokens out of module scope entirely. Prisma is already handled correctly this way (`ctx.prisma`) — Spotify just needs to follow it.

### C2. `ctx.session` is resolved with the *browser* helper — it can never authenticate ✅🔍

```ts
// src/server/router/context.ts:7-8
import { unstable_getServerSession as getServerSession } from "next-auth";
import { getSession } from "next-auth/react";          // ← unused import is the RIGHT one
...
const session = req && res && (await getSession({ req }));   // ← uses the client helper
```

`getServerSession` is imported and **never called** (verified: it appears exactly once in `src/`, on that import line). The code calls `getSession` from `next-auth/react`, which is the **browser-side** helper: it reads a module-scoped client cache (`__NEXTAUTH._session` / `_getSession`) built for the client runtime, and takes no server `req`. It cannot resolve a cookie-authenticated user from an incoming server request. △

Consequences cascade through everything downstream 🔍:

- `dashboard.getOwned` → `ctx.session.user.id` → **TypeError → 500**, on *every logged-out home page visit* (the home page calls it unconditionally, `src/pages/index.tsx:9`, before checking `session`).
- `auth.getSession` → always null; `auth.getSecretMessage` → always `UNAUTHORIZED`.
- `station.send-message` / `station.play` → `userId` undefined → the `if (userId)` guard fails → **silent no-op**, no error returned, message silently vanishes.
- `spotify.setAccessToken(session.accessToken)` → `session` undefined → **TypeError on every request**.
- In the WS adapter there's no `res` at all, so `req && res` short-circuits and the session is `undefined` by construction.

**Fix:** call `getServerSession(req, res, nextAuthOptions)` — the options are already imported as `authOptions` — and drop the client import.

### C3. The WebSocket server has no auth, and the WS context throws on every connection 🔍

Same line as C2: for WS, `opts` has `req` but **no `res`**, so `req && res` is `undefined`, `session` is `undefined`, and `spotify.setAccessToken(undefined)` throws inside `createContext` — which runs on **every WS connection**. Even with that fixed there would still be no session on a socket, so every mutation over WS silently no-ops.

Separately, `new ws.Server({ port: 3001 })` (`src/server/ws-server.ts:12`) binds **all interfaces** with no `verifyClient` and no origin check. Anyone on the same network — or any website the user visits, via Cross-Site WebSocket Hijacking — can open a socket to it.

**Fix:** authenticate at connect time (verify the NextAuth JWT from a connection param or cookie in `createContext`, reject otherwise), bind to `127.0.0.1` in dev, and add an origin allowlist.

### C4. The realtime layer is architecturally undeployable ❓🔍

- The client hardcodes `ws://127.0.0.1:3001` (`src/pages/_app.tsx:50`). `NEXT_PUBLIC_WS_URL` is **not defined anywhere** (verified: `.env.local` defines `WS_URL` and `APP_URL`, both of which are **never referenced in `src/`** — dead config, and the code reads a name nobody set). So in any deployment the browser dials the user's own machine.
- The WS server needs a long-lived process. It cannot run on Vercel/serverless, and there's no Dockerfile or process manager.
- `getBaseUrl()` handles `VERCEL_URL` for HTTP but nothing handles WS, so the two halves of the app are deployable under different rules.

**This is the finding that determines the whole deployment story:** the app as designed requires a persistent Node host. That's fine — it's a legitimate choice — but it has to be made *deliberately* and the config has to reflect it.

### C5. Mutations use an ambient global `prisma` that does not exist in production ✅🔍

`src/server/router/station.ts` never imports `prisma`. It relies on `declare global { var prisma }` from `src/server/db/client.ts:4-6` — which typechecks fine. But the runtime assignment is guarded:

```ts
if (process.env.NODE_ENV !== "production") { global.prisma = prisma; }   // db/client.ts:14
```

So in production the bare `prisma` binding is `undefined`, and:

```ts
const message = await prisma?.message.create({...});   // station.ts:46  → silently undefined
await prisma.playbackContext.update({...});            // station.ts:146 → TypeError, no ?.
```

Note the inconsistency: line 46 uses `prisma?.` (fails silently), line 146 uses `prisma.` (throws), while line 17 correctly uses `ctx.prisma`. Net effect in production: **`send-message` silently drops every message, and `play` throws a 500 after having written nothing.** In dev it works, which is why this has never been noticed.

**Fix:** use `ctx.prisma` everywhere. This also removes the accidental global dependency.

### C6. `station.play` requires a `PlaybackContext` row that nothing can create ✅🔍

`play` does `prisma.playbackContext.update({ where: { stationId } })` (line 146) — an `update`, not an `upsert`. `createStation` is **commented out** (`src/server/router/dashboard.ts:18-33`) and nothing anywhere creates a `PlaybackContext` (verified: the only reference in `src/` is that `update`). The single `Station` row and its `PlaybackContext` in the committed `db.sqlite` were created by hand. So on a fresh database there is **no way to create a station**, and `play` would throw `P2025 (record not found)` on any station that somehow existed.

**Fix:** restore a real `createStation` mutation (creating the `PlaybackContext` in the same transaction or via nested create), and make `play` an `upsert`.

### C7. History pagination returns the *oldest* 100 messages 🔍

```ts
messages: { ..., take: 100, orderBy: { created: "asc" } }   // station.ts:26-27
```

`take` applies after ordering, so this is `ORDER BY created ASC LIMIT 100` = **the first 100 messages ever**, not the latest. Once a station passes 100 messages, a page load shows the ancient history and none of the recent conversation; live subscription messages append at the bottom of the *stale* list. Classic chat-pagination bug.

**Fix:** `orderBy: { created: "desc" }, take: 100`, then reverse client-side (or move to cursor pagination).

### C8. No indexes on the hot path ✅

SQLite `sqlite_master` contains indexes only for `Account`, `Session`, `User`, `VerificationToken`, and `PlaybackContext(stationId)`. There is **nothing on `Message.stationId` or `Message.created`** — yet the primary read path is `WHERE stationId = ? ORDER BY created ASC LIMIT 100`. Every station load is a full table scan plus a sort. Also no index on `Message.userId`.

At 10 rows in the dev DB this is invisible; it's still the wrong schema. **Fix:** `@@index([stationId, created])` on `Message`, `@@index([userId])` on `Message`.

### C9. No `StationMember` — "collaborative" is unmodelled, so no authorization is expressible 🔍

`Station` has `admin: User` and nothing else. There is no membership relation anywhere in the schema. Therefore:

- `station.getStation` has **no auth check and no ownership/membership check** — any caller who knows a station id reads its full chat history.
- `send-message` and `play` gate only on "is someone logged in", not "is this person in this room".
- `onPlay` (`station.ts:161`) takes **no input at all**, so every connected client subscribes to every station's play events globally.

This is a modelling gap before it's a security gap: with no members table there is no way to *express* who may participate, so the check cannot be written. Note also that `authRouter`'s middleware only guards `auth.*` procedures — `station.*` and `spotify.*` have none.

**Fix:** add `StationMember { stationId, userId, role }` with a composite unique, and a shared `stationProcedure` that resolves membership and throws `UNAUTHORIZED`/`FORBIDDEN`.

### C10. The `Message` discriminant is not modelled, and the schema disagrees with the code ✅

- Writes use `type: "CHAT"` / `"TRACK"` (`station.ts:48`, `:107`).
- The UI branches on `message.type === "CHAT"` (`Chat.tsx:89`).
- But `MessageEnum = z.enum(["Track", "Text"])` (`constants/schema.ts:3`) uses **different casing and is never used anywhere** (verified: no references).
- `type` is a bare `String` in Prisma with no enum and no check constraint, so `trackId`/`chatId`/`type` can disagree freely — a "CHAT" row can have a `trackId` and no `chatId`, which will crash `MessageItem` (`message.chat.body`).
- The `Message` zod type doesn't even declare `type`, which is why the UI branch doesn't typecheck (TS2339 in `Chat.tsx:89`, `TrackUpdate.tsx:27`).

**Fix:** a Prisma `enum MessageType { CHAT TRACK }`, a discriminated union in zod (`z.discriminatedUnion("type", [...])`), and a Postgres `CHECK` for the XOR.

### C11. No `next-auth` module augmentation — 8 of the 38 errors ✅

There is no `next-auth.d.ts` (verified). So `session.user.id`, `session.accessToken`, `token.accessTokenExpires` are all untyped errors:

```text
src/server/router/dashboard.ts(8,34): error TS2339: Property 'id' does not exist on type
  '{ name?: string; email?: string; image?: string; }'
src/server/router/context.ts(27,34): error TS2339: Property 'accessToken' does not exist on type 'Session'
src/components/MessageItem.tsx(11,34): same
src/components/layout.tsx(10,32): same
```

Every place the app touches `session.accessToken` it is reaching through `any` or casting (`sessionWithTokens`). **Fix:** one `src/types/next-auth.d.ts` augmenting `Session`, `User`, and `JWT`. Cheapest high-value change in the repo after `strict`.

### H1. `strict: false` — the whole `any` epidemic has one cause ✅

```jsonc
// tsconfig.json
// "strict": true,      ← commented out
"strict": false,
```

That single flag is why you get `station: any`, `message: any`, `data: any`, `song: any`, `context: any`, `useQueueStore(...) => unknown`, and props that don't exist. Concrete type evidence:

```text
src/components/Chat.tsx(18,3): Property 'devices' does not exist on type '{ station: any; session: Session; }'
src/components/Chat.tsx(131,20): Type '{ devices: any; }' is not assignable to 'IntrinsicAttributes'
src/components/Playback.tsx(8,48): Property 'tracks' does not exist on type 'unknown'
src/components/Queue.tsx(11,13): Property 'tracks' does not exist on type 'unknown'
src/components/Playback.tsx(8,48): Property 'tracks' does not exist on type 'unknown'
```

Also `target: "es5"` (gratuitous downleveling) with `lib: esnext`.

Note how many of these are *real* bugs the compiler was already pointing at and the config told it to be quiet about: `Chat` destructures a `devices` prop that is never passed (`station/[stationId].tsx:36` passes only `station` and `session`), and `Devices` takes no props at all — so `<Devices devices={undefined} />` is passed a prop the component ignores while querying for itself. And `TrackUpdate.tsx:39` renders `<FireButton />` with no `song` prop, though `FireButton` requires one.

**Fix:** turn on `strict`, fix the ~38 errors (they're mostly mechanical), set `target: "es2020"`. This is the highest-ROI single change available and it would have caught C2, C5, the `devices` bug, and half of C10.

### H2. `MOCK_LOGIN` is a passwordless login that can ship to production 🔍

```ts
...(process.env.MOCK_LOGIN === "true" ? [CredentialsProvider({ ..., async authorize(credentials) {
  const user = { id: `mock-user-${username...}`, name: username, email: `${...}@example.com`, ... };
  await prisma.user.upsert({ ... });
  return user;   // ← no password, any username accepted
}}) ] : []),
```

Gating a passwordless auth provider on a **`.env` string** rather than `NODE_ENV` means a single misconfigured environment variable turns the app into "type any name, become that user". The upsert also writes `name`/`email`/`image` onto a deterministic row id.

For local development the *idea* is good — it's how you test a Spotify app without OAuth round-trips, and it's why the chat code can be developed at all. The *guard* is wrong.

**Fix:** `process.env.NODE_ENV !== "production" && process.env.MOCK_LOGIN === "true"` (and default it off), namespace ids clearly, and refuse mock emails that collide with real ones (`email` is `@unique`, so a collision is a `P2002` at sign-in).

### H3. The access token is placed on the session object 🔍

The `session` callback assigns `accessToken`/`refreshToken` onto the session, and NextAuth serialises the session callback's return value to the browser. This is the pattern every next-auth+Spotify tutorial uses — but it means a bearer token with `user-modify-playback-state`, `user-library-modify`, and `streaming` is readable by any XSS or extension.

Two nuances worth separating:

- For **mock** users this is currently moot: `jwt` reads `account.access_token`, and the credentials provider supplies no `account`, so `accessToken` is `undefined` and `accessTokenExpires` becomes **`NaN`** (an ISO `expires_at` times `1000` on `undefined`). `Date.now() < NaN` is always `false`, so **every subsequent request takes the refresh path**, calls `refreshAccessToken` with no refresh token, and sets `error: "RefreshAccessTokenError"` — forever. ✅ (observed: the mock session JSON contains no `accessToken` key at all, consistent with `undefined` being dropped by `JSON.stringify`)
- For **real Spotify** logins, `account.access_token` is present and *would* be serialised to the client.

The frontend never checks `session.error` (verified: no references), so the permanent-refresh-failure state is invisible — tokens expire and every Spotify call fails with no UI feedback.

**Fix:** keep tokens server-side. The Web Playback SDK genuinely needs a browser token, so expose a **narrow, short-lived** one from a dedicated endpoint (only the `streaming` scope) rather than the long-lived refresh-capable token. Then guard the `jwt` callback against a missing `account` and surface `session.error` in the UI.

### H4. `AutoTextArea` never clears, because `value` isn't bound 🔍

```tsx
<textarea ref={textareaRef} onChange={textAreaChange} onKeyDown={props.handleKeyDown}>
  {value}          {/* ← children, not a value prop; invalid for textarea in React */}
</textarea>
```

The component keeps its own `value` state and never renders it as the `value` prop. `Chat.onSubmit` does `setMessage("")` (`Chat.tsx:80`) — which the textarea ignores, so **the message box keeps the sent text after every send**. Also `props.handleKeyDown` doesn't exist on `TextareaHTMLAttributes` (a real TS error, `AutoTextArea.tsx:37`) — the intended `onKeyDown` handler in `Chat` is commented out anyway.

**Fix:** `value={props.value}` (a controlled textarea), or `defaultValue` + a `key` reset. One line, real UX bug.

### M1. Secrets/artifacts: the SQLite DB is committed ✅

`prisma/db.sqlite` is **git-tracked** (verified) and contains real `User` rows with **real email addresses** — including what looks like a personal Gmail account — plus a binary blob that will conflict on every merge and can never be a deployment target. It's dirty in the working tree right now from my auth testing.

**Fix:** `git rm --cached prisma/db.sqlite`, add `prisma/*.sqlite*` to `.gitignore`, and add a `prisma db seed` script for the demo data.

### M2. `Message.created` is app-managed, and `created` is a bad name 🔍

`created: new Date().toISOString()` is passed from the router (a string into a `DateTime`), with no `@default(now())` and no `updatedAt`. Let the database stamp it: `createdAt DateTime @default(now())`.

### M3. Missing cascade deletes 🔍

`onDelete: Cascade` exists only on `Account.user` and `Session.user`. It is absent on `Station.admin`, `Message.station`, `Message.sender`, `PlaybackContext.station`, and all `Track`/`Chat` relations. Deleting a user or station will fail on foreign keys or strand rows.

### M4. `playTrackSchema.track` is `z.any()` — no validation at the trust boundary 🔍

```ts
export const playTrackSchema = z.object({ stationId: z.string(), track: z.any() });
```

That unvalidated client object is immediately destructured: `input.track.album.images[0].url`, `input.track.artists.map(...)` (`station.ts:126-134`). A malformed payload is a **crash**, not a 400 — and this is the one place where "be lazy" is the wrong instinct: it's an untrusted input crossing into a DB write and a Spotify URI. `sendMessageSchema` is fine; `playTrackSchema` needs a real shape (and the client should send `trackId` + let the server fetch canonical metadata instead of trusting a whole nested Spotify object).

### M5. `onPlay` performs playback *per subscriber*, and emits a placeholder 🔍

```ts
.subscription("onPlay", {
  resolve({ ctx }) {
    return new trpc.Subscription((emit) => {
      function onPlay(data) {
        emit.data("goes to front end");                    // ← debug leftover
        ctx.spotify.play({ uris: [`spotify:track:${data}`] });   // ← side effect per subscriber
      }
      ...
```

Three problems in four lines: (a) a subscription is a *read* channel, but this one performs playback as a side effect, so **N subscribers = N play calls**; (b) the emit payload is the literal string `"goes to front end"`, which is what the client's `onNext(data) => console.log(data)` actually logs; (c) playback is issued on the shared singleton token (C1), so the track plays on whichever user's device is active. Playback should be a **mutation** that emits *after* the fact; subscriptions should only notify.

### M6. `Volume` changes the user's Spotify volume on page load 🔍

`useEffect(() => { !isLoading && setDeviceVolume(volume) }, [debouncedVolume, isLoading, setDeviceVolume, volume])` — the effect fires on mount once devices load, so **merely opening the app sets the user's device volume to 50**. Listing both `volume` and `debouncedVolume` as deps also defeats the debounce. Fix: only call on user interaction (`onChange` → debounced setter), and drop `volume` from the deps.

### M7. `Playback`'s play/pause has confused semantics and a hardcoded station id ✅

```tsx
if (isPlaying) { pause(); }
else { onPlay({ track: queue[0], stationId: "cla5kpjl00076equnhqh7gr4t" }); }   // Playback.tsx:25
setIsPlaying(!isPlaying);
```

- A **hardcoded station id from a developer's local database** is committed to source (`cla5kpjl...` — matches the one `Station` row in the committed `db.sqlite`). The play button is permanently wired to one station.
- `pause` is a local/global playback command; `play` is the **collaborative** mutation that writes a `Message` and mutates shared `PlaybackContext`. A local transport button silently posts into the shared timeline.
- Local `isPlaying` is flipped optimistically and **never reconciled** with `playbackState` (the `onSuccess` only sets it once), so the icon desyncs immediately.

### M8. `useQueueStore` crashes, and its dedupe never works 🔍

```ts
import create, { State } from "zustand";       // ← zustand v4 removed the default export
addTrack: (track) => set((s) => ({ tracks: Array.from(new Set(s.tracks).add(track)) })),
```

`zustand@4.5.7` exports `create` as a **named** export with **no default** (verified: `default` is `undefined`, `create` is a function) — so `create` is `undefined` and this module throws on import. And `new Set(state.tracks).add(track)` dedupes by **object identity**, so adding two search results for the same track keeps both. Also: the queue is per-tab in-memory state, but the thing it feeds ("this station's up-next") is conceptually shared — so the queue is the one piece of station state that *isn't* collaborative.

### M9. `PrismaClient` logs every query in production 🔍

`new PrismaClient({ log: ["query"] })` (`db/client.ts:11`) is unconditional — full query logging, including user emails and message bodies, in every environment.

### M10. Dead code, dead config, and unfinished leftovers 🔍

- `src/components/Playlist.tsx` — **not imported anywhere** (verified), and has a stray `{ /* ... */ }` JSX block *outside* the component.
- `src/components/Search.tsx` — input has no `onChange`; the query hook sends `query` (always `""`); the real logic is commented out.
- `src/hooks/usePlayerContext.ts` — computes `devices.body.devices.find(...)` and **discards the result**; returns `undefined`; unused.
- `src/components/FireButton.tsx` — pure local `useState`, no persistence, rendered with no props. The "fire" reaction is a no-op.
- `createStation` mutation — commented out (`dashboard.ts:18-33`).
- `MessageEnum` — defined, unused, and wrong (§C10).
- `.env-example` — tracked but **empty**.
- `APP_URL` / `WS_URL` in `.env.local` — never referenced; the code reads `NEXT_PUBLIC_WS_URL` / `PORT` instead. Config that lies.
- `getBaseUrl()` — `if (process.browser) return ""` is unreachable behind the preceding `typeof window` check, and `process.browser` is not a real Next flag.
- `next.config.js` — `images.domains` is deprecated in Next 16 (build warning) and `reactStrictMode` is commented out.

### M11. No error handling on fire-and-forget mutations 🔍

`sendMessageMutation(...)`, `onPlay(...)`, `pause()`, `setDeviceVolume(...)` are all called as `mutateAsync` and **never awaited or try/caught**, so every failure becomes an unhandled promise rejection with no user-visible error. Combined with C2 (where mutations silently no-op), the user experience is "I sent a message and nothing happened, and nothing told me why".

### M12. Subscription payload spreads an undefined initial state 🔍

`Chat.tsx:50` — `setMessages((messages) => [...messages, message])` with `messages` initialised as `useState<Message[]>()` (**undefined**). If a subscription message arrives before `station` loads, this spreads `undefined` and throws. Fix: `useState<Message[]>([])`.

Also `Chat.tsx:86-97` maps messages to a bare `<>` fragment with the `key` on the child, which is the classic React key warning; the discriminated-union rewrite (§C10) fixes both.

### L1. `tsconfig.server.json` compiles the entire frontend 🔍

`"include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx"]` with `"lib": ["DOM", "ES2019"]` — the WS-server project pulls in all React components. Sloppy, and it means the server build can be broken by a frontend file.

### L2. No observability, no rate limiting 🔍

`console.log` throughout (including `"access token valid"` on every request, `ws-server.ts:18-24`). No structured logging, no error tracking, no health endpoint, no request limits on `send-message`. The "radio" is an unauthenticated-rate-limit-free public write endpoint.

---

## 6. Your four questions

### 6.1 Would this be better with a better WebSocket handler?

**Yes — but the handler isn't the problem, the process topology is.** Swapping `ws` for `socket.io`/`uWebSockets`/Pusher would change nothing about the actual defects: two processes with two `EventEmitter`s, a shared Spotify token, no auth on the socket, no rooms.

Ranked options:

**Option A — collapse to one process (recommended).** Replace the `run-p dev:*` dual-process setup with a custom `server.ts` that creates one HTTP server, hands requests to Next, and attaches the WS server to the *same* `http.Server`:

```ts
const app = next({ dev }); await app.prepare();
const server = http.createServer((req, res) => handle(req, res));
const wss = new WebSocketServer({ server });              // same port, same origin
applyWSSHandler({ wss, router: appRouter, createContext });
```

This single change: eliminates the split-brain `EventEmitter` (now genuinely one instance), removes the second port and the hardcoded `ws://127.0.0.1:3001`, makes sockets same-origin (killing the CSWSH exposure), collapses two dev scripts into one, and makes the auth context identical for both transports. **Cost:** you must run a persistent host (Fly/Railway/Render/VPS) and lose Vercel's edge — which, for an app with long-lived sockets, in-browser playback, and shared playback state, is the correct trade anyway.

**Option B — stay serverless, drop hand-rolled realtime.** Delete tRPC subscriptions and the WS server; use a hosted channel service (Pusher/Ably/Supabase Realtime) or Postgres `LISTEN/NOTIFY` + SSE. Never hand-roll an in-memory bus in a serverless runtime — each invocation gets a fresh module scope and a fresh `EventEmitter`, so it can't work by construction.

**Option C — genuinely separate service, scaled.** Only if you need horizontal scale: keep a distinct realtime service and put **Redis pub/sub** (or Postgres `LISTEN/NOTIFY`) between instances. This is the point at which a separate service and a workspace layout start to pay for themselves (§6.4). Not yet.

Orthogonal fixes regardless of option, all currently missing:

- **`splitLink`** — queries and mutations over HTTP, only subscriptions over WS. Sending *everything* over WS (the current design) breaks SSR, loses HTTP batching/retries, and makes a dropped socket break ordinary reads.
- **Auth at connect time**, plus an origin allowlist and a `127.0.0.1` bind in dev.
- **Heartbeat** — `ws` does not ping. Every half-open TCP connection (laptop lid closed, wifi switch) leaks a subscription forever. Ping/pong every ~30s, `terminate()` the dead.
- **`maxPayload`** — the default is 100 MB. Any client can send one.
- **A room registry** — `Map<stationId, Set<connection>>` rather than broadcasting every message to every subscriber and filtering client-side.
- **Side effects out of subscriptions** — §M5.
- **Graceful shutdown** — `SIGINT` is unhandled (only `SIGTERM`), and `wss.close()` isn't awaited.

### 6.2 Is the DB implementation good?

**The tooling is good; the schema and the deployment target are not.**

Good: Prisma, real checked-in migrations, a schema that's already parameterised for Postgres (`// url = env("DATABASE_URL")` is sitting right there commented out).

Bad, in priority order:

1. **SQLite is committed to git and is the only target.** A binary DB file with real user emails in version control, single-writer, no concurrent writes, and impossible to deploy to a serverless/container platform with any durability. **Move to Postgres** (the schema already expects it); keep SQLite for local dev if you like, but make the provider env-driven.
2. **No indexes** on the single hot query path (§C8).
3. **Pagination is backwards** (§C7) — you're fetching the 100 *oldest* messages.
4. **The discriminant isn't modelled** (§C10) — `type` is free-text, the zod enum disagrees with the actual values, and invalid states (a `CHAT` row with a `trackId`) are representable. Prisma enums + a discriminated-union schema + a `CHECK` constraint.
5. **No membership table** (§C9) — the schema can't express the product's core concept.
6. **Missing cascades** (§M3), **app-managed timestamps** (§M2), **no seeding** (§M1).
7. Worth considering: with `Message` doubling as chat + track events, the two row shapes have disjoint columns and different access patterns. Keeping one timeline table is right (it's the app's best idea — §4.1), but be explicit about the XOR rather than leaving it to convention.

### 6.3 Is the auth a good solution?

**The strategy choice is defensible; the implementation has three real bugs and one dangerous default.**

Good: Spotify OAuth + Prisma adapter is correct for this product. A JWT strategy is a reasonable latency choice. `NEXTAUTH_SECRET` is set and the file is gitignored. The resolved file handles Spotify's refresh response correctly.

**Broken:**

1. **C2 — `ctx.session` can never authenticate the server.** Wrong import; `getServerSession` imported and unused. This is the highest-value auth fix and it's one line.
2. **H3 — tokens on the client session**, and for mock users `accessTokenExpires` is `NaN` so the refresh path runs forever and fails forever, invisibly (nothing reads `session.error`).
3. **H2 — `MOCK_LOGIN` gated on a string, not on `NODE_ENV`.** A passwordless "become anyone" provider one env var away from production.
4. **Scope over-requesting.** The request asks for `user-follow-read`, `user-top-read`, and `user-read-recently-played`, none of which are used anywhere in `spotify.ts` (verified). Every unused scope increases the chance of Spotify's extended-review requirement and shrinks the consent screen's credibility. Request only what's used; use `show_dialog`/incremental authorisation for the rest.
5. **JWT + adapter is half-and-half.** With `strategy: "jwt"` the Prisma `Session` table is dead weight — the DB currently has **0 session rows** while `Account` has 1. You keep the adapter's writes without getting its benefit. Decide: either **database sessions** (you get revocation, which matters a lot when the session carries `user-modify-playback-state` and `user-library-modify`) or **JWT** (then document why you keep the unused models). Given this app mutates a user's Spotify account, **revocability is worth the single indexed DB read** — I'd take database sessions.
6. **No `next-auth.d.ts`** (§C11) — 8 of the 38 type errors.
7. No `signIn`/`redirect` callback, no account allowlist, no `events` handlers. Fine for a toy; worth noting before real users.

Verdict: **auth is a reasonable choice carrying a broken implementation.** Not a reason to replace NextAuth.

### 6.4 Is the monorepo approach right?

**First, the premise: this isn't a monorepo.** It's a single Next app plus a second entrypoint sharing the same `src/`, wired together with `npm-run-all`. There is no workspace, no `packages/*`, no separate `package.json` per service. So "would a monorepo be better" is the wrong question — and a monorepo **would not fix anything here**, because the problems are (a) shared mutable state across a process boundary and (b) dependency drift. Monorepos address neither; they can make (b) *worse* without a lockfile discipline you don't currently have.

What's actually true:

- **The split isn't real, it's accidental.** Both "services" import the same `src/server/router/*`. The WS process imports the *entire* app router. They share a database, a schema, and a Spotify singleton. This is one service wearing two hats.
- **The one thing blocking a real extraction is coupling, not layout.** `src/server/router/context.ts` — the "server core" — imports `next-auth/react`, Next's adapter types, and a deep internal path (`@trpc/server/dist/declarations/src/adapters/node-http`, §3.2). You cannot lift `src/server` out into a package today without untangling that. Fixing the coupling is the prerequisite; the directory layout is cosmetic until then.
- **When a workspace *would* earn its keep:** if you deliberately choose Option C in §6.1 — a genuinely separate realtime/station engine with its own deploy, its own lifecycle, and Redis between them. Then `apps/web` + `apps/engine` + `packages/db` + `packages/shared` (types + zod schemas only) is justified, because the boundary is *real* and the shared package is *types*, not runtime singletons.

**Recommendation: do not restructure into a workspace.** At ~2,100 LOC, the ceremony would cost more than it saves. Instead: keep one package, keep one process (Option A), and make `src/server` framework-agnostic (no `next-auth/react`, no Next adapter imports, no deep internal paths) so it *can* be extracted later at near-zero cost. Structure follows a real boundary; it doesn't create one.

---

## 7. Recommended path

### Option 1 — "Make it run again" (~1–2 days, low risk)

Get back to a green build with the *existing* architecture. No rearchitecture.

1. `git stash`/branch current work; delete `node_modules`; **reinstall from the committed lockfile** (`pnpm install --frozen-lockfile`) so you're running `next@12.2.0` + tRPC v9, which is what the source actually targets. *or* deliberately switch to `feature/upgrade-next` and finish that migration — but not both at once.
2. Confirm `pnpm build` and `pnpm dev` are green; fix the 38 type errors surfaced by `strict: true`.
3. Add `src/types/next-auth.d.ts`.
4. Fix C2 (`getServerSession`), C5 (`ctx.prisma` everywhere), C7 (pagination direction), H4 (textarea `value`).
5. `git rm --cached prisma/db.sqlite`; add a seed script.
6. Delete the dead code in M10.

**Result:** a working single-user app on the old stack. Buys time; doesn't fix the architecture.

### Option 2 — "Make it shippable" (~2–4 weeks, medium risk) ← *my recommendation*

Option 1, plus:

1. **One process** (§6.1 Option A): custom `server.ts`, WS on the same HTTP server, delete the second dev script and `NEXT_PUBLIC_WS_URL`. This is the keystone change.
2. **Per-request Spotify client** (C1) — delete the module singleton.
3. **Auth on the WS connect** (C3), heartbeat, `maxPayload`, `splitLink`.
4. **Room model + `StationMember`** (C9) and one `stationProcedure` doing the membership check.
5. **Postgres** + indexes (C8) + a proper `MessageType` enum with a discriminated union (C10) + cascades (M3).
6. **`createStation`** restored as a transaction (C6).
7. Guard `MOCK_LOGIN` on `NODE_ENV` (H2); stop putting refresh tokens on the client session (H3).
8. **A handful of tests** on the paths that keep breaking: message write → subscription delivery, membership authorization, token refresh. Vitest + a real Postgres in a container. Not a coverage target — a regression fence so the next dependency upgrade is verifiable instead of a five-branch slog.
9. CI: `build` + `tsc --noEmit` + tests on push. This is what would have prevented the current state.

### Option 3 — "Rewrite" (4–8 weeks, high risk)

Only justified if the product direction changed. You'd write a single Next app with Postgres, one process, `initTRPC`/v11 routers, Drizzle-or-Prisma, and the same unified-timeline model. Note: **the domain model is the part worth keeping**, and it's ~150 lines of Prisma schema — so a full rewrite discards the good part along with the bad. I'd take Option 2.

---

## 8. Prioritised action list

**Do first (correctness, small diffs):**

1. Reinstall deps from the committed lockfile — or commit to `feature/upgrade-next` and finish it. **Pick one.** (§3)
2. `getServerSession(req, res, authOptions)` in `context.ts` (C2)
3. `ctx.prisma` everywhere in `station.ts` (C5)
4. Per-request Spotify client (C1)
5. `strict: true` + fix the 38 errors (H1) + `next-auth.d.ts` (C11)
6. `orderBy: desc` for message history (C7)
7. `AutoTextArea` controlled value (H4)
8. `zustand` named import (M8) — it's a crash on import
9. `git rm --cached prisma/db.sqlite` (M1)

**Then (architecture, the real fix):**
10. One process: WS on the same HTTP server (§6.1 A)
11. Auth + origin check + heartbeat on sockets (C3)
12. `StationMember` + a shared authorized procedure (C9)
13. Postgres + indexes + `MessageType` enum (C8, C10)
14. Per-request token via a narrow `/api/spotify/token` endpoint (H3)
15. `createStation` (C6)
16. `MOCK_LOGIN` behind `NODE_ENV` (H2)

**Then (so this never happens again):**
17. Vitest on message flow + authorization + refresh
18. CI running `tsc --noEmit` and the tests
19. Delete the dead code (M10) and the five stalled upgrade branches

---

## Appendix A — Type error inventory (38 errors, 15 files) ✅

```text
AutoTextArea.tsx:37   TS2339  handleKeyDown not on TextareaHTMLAttributes
Chat.tsx:18           TS2339  prop 'devices' does not exist (never passed)
Chat.tsx:89           TS2339  'type' not on Message zod type
Chat.tsx:109          TS2322  useRect ref Element vs HTMLDivElement
Chat.tsx:131          TS2322  <Devices devices> — Devices takes no props
Devices.tsx:28,37     TS2339  activeDevice typed {}
MessageItem.tsx:11    TS2339  session.user.id (no augmentation)
Playback.tsx:8        TS2339  zustand store typed unknown
Playlist.tsx:30       TS2339  selectedPlaylist.name
PlaylistBar.tsx:11    TS2339  selectedPlaylist.id
Queue.tsx:11-13       TS2339  zustand store typed unknown
Station.tsx:16,17     TS2322  "176px" not assignable to number
StationInfo.tsx:15,16 TS2339  zustand store typed unknown
TrackUpdate.tsx:16    TS2322  useRect ref type
TrackUpdate.tsx:27,32,34,38  TS2339  message.track not on Message zod type
TrackUpdate.tsx:39    TS2741  <FireButton> missing required 'song'
layout.tsx:10         TS2339  session.accessToken (no augmentation)
_app.tsx:15           TS2339  pageProps.session
_app.tsx:53,56        TS2344  AppRouter is a v9 Router, constraint wants v10
api/trpc/[trpc].ts:8  TS2322  v9 Router → v10 AnyRouter  ← the headline error
router/context.ts:4   TS2307  deep import into @trpc/server internals (moved in v10)
router/context.ts:27  TS2339  session.accessToken
router/dashboard.ts:8 TS2339  session.user.id
router/station.ts:44,103      session.user.id
router/station.ts:85,163      @trpc/server v10 has no `Subscription`
ws-server.ts:15       TS2322  v9 Router → v10 AnyRouter
utils/trpc.ts:3       TS2307  Cannot find module '@trpc/react'
```

Note how concentrated the *causes* are: **tRPC v9/v10 (5 errors), missing next-auth augmentation (8), `strict: false` masking real bugs (the rest)**. It is not 38 independent problems; it's three.

## Appendix B — Environment/config mismatches ✅

| Defined in `.env.local` | Referenced in `src/` | Status |
| --- | --- | --- |
| `APP_URL` | — | **dead** |
| `WS_URL` | — | **dead** (code reads `NEXT_PUBLIC_WS_URL`, which is defined nowhere → falls back to hardcoded `ws://127.0.0.1:3001`) |
| `MOCK_LOGIN` | ✅ | live |
| `NEXTAUTH_SECRET` | (NextAuth, implicit) | live |
| `NEXTAUTH_URL` | (NextAuth, implicit) | live |
| `SPOTIFY_CLIENT_ID` / `_SECRET` | ✅ | live |

`.env-example` is tracked but **empty**. There is no env validation, so a missing `SPOTIFY_CLIENT_ID` silently becomes `""` and fails at OAuth time instead of at boot.

## Appendix C — Repo hygiene snapshot ✅

- 12 commits, **11 branches, 4 stashes**; 5 branches are the same dependency upgrade, none merged.
- **0 test files, no CI, no Dockerfile.**
- `prisma/db.sqlite` tracked (contains real emails).
- `next-env.d.ts` and `tsconfig.json` dirty in the working tree (tool-driven drift).
- Committed artifact: hardcoded station id `cla5kpjl00076equnhqh7gr4t` in `Playback.tsx:25`.
- No secrets ever committed (verified across all history) — credit due.
