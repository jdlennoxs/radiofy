# ADR-001 — ~~Port the backend to Go~~ — **REJECTED**

> ⚠️ **Not adopted.** This decision was reversed on 2026-10-20 after evaluating Supabase + tRPC v11. See **`ADR-002-STAY-ON-TRPC-SUPABASE.md`**. Kept for its reasoning and for the carry-over findings list in §2, which remains valid.

**Status:** Rejected — superseded by ADR-002
**Date:** 2026-10-20
**Superseded by:** `research/ADR-002-STAY-ON-TRPC-SUPABASE.md`
**Decides (not adopted):** replace the Next.js + tRPC + separate-WS-process stack with a single Go binary serving a Vite SPA.

---

## 1. Decision

Rebuild Radiofy as **one Go binary** that serves the HTTP API, the WebSocket hub, and an embedded Vite-built SPA. Keep the React components, the Tailwind styling, and the domain model. Drop Next.js, tRPC, and the two-process dev setup.

**Production data + identity: Supabase** (Postgres + Auth, optionally Realtime). SQLite stays local-dev-only today; in the new stack local dev should be Postgres too, for parity. See §3.1.

### Reasons (as given, recorded here because the *why* is what stops this being re-litigated in three weeks)

1. **Learning opportunity** — deliberate, not incidental. A hobby project is the right place to pay tuition.
2. **WebSockets + running cost** — Go holds many idle sockets cheaply, and a static binary on a single small host is a materially better fit for a long-lived-connection app than a Node build tree. One box removes the split-brain class of bug entirely.
3. **The project is already in a state** — the rewrite cost is partly pre-paid. This is the load-bearing reason: doing this from a *working* app would be net-negative; doing it from a repo that doesn't build costs you very little extra.

### What makes this sound (beyond the three reasons)

- **The original architecture was right, and was betrayed by process topology.** An in-process event bus for room fan-out is the correct design for this app. It failed only because mutations ran in the Next process while subscriptions ran in the `ts-node-dev` process (appraisal §2, C4). **One binary makes the original design correct.** This is a port that vindicates the existing intent, not a redesign.
- **The port surface is bounded: ~18 live endpoints + 2 subscriptions.** 13 queries and 8 mutations exist; `getRecent`/`createStation` are commented out and `getSecretMessage` is T3 boilerplate. That is a countable job, not a leap of faith.
- **Go's deploy story is the actual prize.** `GOOS=linux GOARCH=arm64 go build` → one ~15 MB static binary → `scp` → systemd. No runtime, no `node_modules`, no build-on-box, no process manager, no lockfile that can disagree with itself.
- **The failure mode that put you here cannot recur.** `strict: false`, ambient `prisma`, `node_modules` from the wrong branch, `typescript` 4.7 declared but 5.9 installed — none of these are expressible in Go. Given you lost real time to exactly that class of problem, this is a genuine argument.

---

## 2. What this does NOT fix

Stated plainly so it doesn't get inherited silently. The rewrite fixes ~4 of the 23 appraisal findings. **The rest is carry-over debt and must be closed deliberately during the port, not after.**

### Must be re-solved in the new stack

| Finding | Carry-over action |
| --- | --- |
| **§4.7 end-to-end type safety** | **The single biggest risk.** tRPC gave this for free. Go gives it back only via codegen (§4). Skip this and you regress below the current app. |
| C1 shared Spotify client | Per-request client struct. Go makes this idiomatic, not automatic. |
| C3 no auth on sockets | Verify the **Supabase JWT** (JWKS) at connect; origin allowlist; `127.0.0.1` bind in dev. Much easier than hand-rolled session auth — see §3.1. |
| C6 missing `PlaybackContext` upsert | Use `INSERT … ON CONFLICT DO UPDATE` from day one. |
| C7 pagination returns the *oldest* 100 | `ORDER BY created DESC LIMIT 100`, reverse for display. |
| C8 no indexes | `(station_id, created_at)` and `(user_id)` in the initial migration. |
| C9 no membership table | **Model it in Phase 1.** If it isn't in the first schema it will never be added. |
| C10 unmodelled discriminant | SQL `ENUM` + `CHECK` for the XOR. Note: Go's sum types are *weaker* than a TS discriminated union here — use an enum column and validate explicitly. |
| H2 `MOCK_LOGIN` gate | Dev-only Supabase project, or an explicit `RADIOFY_DEV_MODE` build flag defaulting off. Never a passwordless provider in the prod binary. See §3.1. |
| H3 provider token reachable from the browser | Supabase puts `provider_token` in the browser session with a ~60-min life. Keep the **refresh** token server-side and never trust the browser's provider token for API calls. |
| M4 `z.any()` on `playTrackSchema` | Take a `trackId`; fetch canonical metadata server-side. Do not trust a nested client object. |
| M5 side effects inside subscriptions | The hub is a **read-only notification channel**. Playback is a command that emits *after* it succeeds. |
| M9 prod query logging | `pgx` tracer on in dev only. |
| L2 no rate limiting | Token bucket on the write endpoints and the WS message path. |

### Carried over untouched by construction — the frontend

"Keep the React frontend" keeps its bugs. These are in the components, not the API:

- `zustand` default import → `QueueStore` throws on import (M8)
- `AutoTextArea` never clears after send (H4)
- `Volume` fires a mutation on page load and changes the user's device volume (M6)
- Hardcoded station id `cla5kpjl00076equnhqh7gr4t` in `Playback.tsx:25` (M7)
- Play/pause semantics confused: local transport button writes to the shared timeline (M7)
- No error handling on fire-and-forget mutations (M11)
- `useState<Message[]>()` spreads `undefined` (M12)
- Dead/non-functional: `Search`, `Playlist`, `FireButton`, `usePlayerContext` (M10)

**Fix these during the frontend move (Phase 6), not after.** They're cheap while you're already editing every file.

---

## 3. Stack

| Concern | Choice | Why this and not the alternative |
| --- | --- | --- |
| HTTP router | **stdlib `net/http`** + Go 1.22 method patterns (`mux.HandleFunc("POST /api/stations/{id}/messages", …)`) | No framework. 18 endpoints do not justify chi/echo/gin. |
| WebSocket | **`github.com/coder/websocket`** | Maintained, context-aware, sane API. `gorilla/websocket` also fine; avoid `golang.org/x/net/websocket`. |
| Database | **Supabase Postgres** + **`pgx`** + **`sqlc`** + **`goose`** | `sqlc` generates typed Go from SQL — the Prisma replacement, arguably better (no runtime query engine). Supabase is plain Postgres, so nothing below is Supabase-specific. See §3.1. |
| Validation + codegen | **`huma`** (Go structs → OpenAPI) + **`openapi-typescript`** | **Revised from the earlier protobuf/Connect suggestion.** See §4. |
| Auth (identity) | **Supabase Auth** — Spotify is a first-class provider | **Removes the riskiest hand-rolled code from the original plan.** Supabase owns the OAuth flow; Go only verifies a JWT. See §3.1, §6.1. |
| Auth (Spotify API token) | **`golang.org/x/oauth2`** + server-side refresh | Supabase does **not** manage the Spotify token lifecycle — `provider_token` dies after ~60 min. This is the Go service's job, and it's the good kind of Go work. See §3.1. |
| Realtime | **Your own Go hub** (Supabase JWT verified at connect); Supabase Realtime as the fallback | Realtime is your stated learning goal and you control the semantics. See §3.2. |
| Frontend build | **Vite** + `@vitejs/plugin-react` | You are already a pure SPA (§5). Next is doing nothing for you. |
| Routing | **`react-router-dom`** | 2 routes. |
| Data fetching | **TanStack Query v5** | You already use React Query; the `LikeButton` optimistic patterns port almost verbatim. |
| Components | **Radix UI** | `@radix-ui/react-select` is **already a dependency and never imported** — so this is consolidation, not a new bet. |
| Styling | **Tailwind** (keep 3.x or move to 4) | Already there; works with Vite unchanged. |
| Drag & drop | **`@hello-pangea/dnd`** | `react-beautiful-dnd` is unmaintained and React-19-incompatible. `feature/upgrade-next` already swapped it — that discovery is worth keeping. |
| Serving SPA | **`//go:embed dist`** | One artifact. No nginx needed for statics. |
| TLS | **Caddy** | `caddy reverse-proxy --from radiofy.example --to 127.0.0.1:8080`. Automatic certs, 1 line. |
| Process | **systemd unit** | `Restart=always`. Done. |
| Host | Single **EC2 t4g** (ARM) | Honest cost caveat in §7. |

### 3.1 Supabase is the production data + identity layer

**Supabase, not Firebase** — and the reasons are independent, so it isn't a close call.

**Spotify is a first-class Supabase Auth provider** (it's in the `Provider` union, with its own setup guide). So Supabase owns the entire OAuth flow — `state` CSRF, PKCE, callback, session, cookie flags. That deletes the single riskiest item from the original version of this plan: you no longer hand-roll OAuth in Go.

**But Supabase does not manage the Spotify API token lifecycle.** `provider_token` lives in the session and expires after ~60 minutes, and Supabase will not refresh it for you (this is a long-standing, acknowledged gap). So the Go service still owns:

- storing the Spotify **refresh** token server-side
- refreshing against `accounts.spotify.com/api/token` on expiry
- attaching the access token to every Spotify Web API call
- minting the narrow, short-lived token the browser Web Playback SDK needs

That is exactly the shape of work that makes a good Go exercise — HTTP client, token rotation, middleware, per-request state — with none of the OAuth-flow security risk. This is the best possible split.

**Why Firebase is wrong here** — three independent reasons, any one of which is disqualifying:

1. **No Spotify provider.** Firebase Auth supports Google/Apple/Facebook/Twitter/GitHub/Microsoft/Yahoo plus generic OIDC/SAML. Spotify isn't among them; the official sample does the Spotify OAuth dance *itself* in a Cloud Function and mints a Firebase custom token. You'd write the OAuth flow anyway — the exact thing Supabase hands you — in a second runtime.
2. **Firestore fights this domain model.** The best thing in this codebase is the relational unified timeline. Firestore has no joins, so `Message → sender`, `Message → Track`, and `station_members` all collapse into denormalisation, and the `CHAT`/`TRACK` XOR plus composite ordering on `(station_id, created_at)` become hand-maintained composite indexes. You'd be designing *around* the store.
3. **Its realtime would delete the port's purpose.** Firestore listeners would replace the Go hub — removing the thing you're doing this for (reason #1 and #2).

### Correction to the dev setup: drop SQLite, run Postgres locally too

SQLite was a perfectly reasonable choice when the production target was undecided. With Postgres in production it stops being free, and it fails exactly where Phase 1 needs it:

| Feature needed | Postgres | SQLite |
| --- | --- | --- |
| `ENUM` type (C10) | ✅ | ❌ — and this is *why* the current schema uses a bare `String` for `type` |
| `CHECK` for the XOR | ✅ | partial, no `ALTER` |
| `INSERT … ON CONFLICT DO UPDATE` (C6) | ✅ | ✅ but different semantics |
| Partial / expression indexes | ✅ | limited |
| `TIMESTAMPTZ` semantics | ✅ | ❌ |
| RLS (for the Supabase path) | ✅ | ❌ |

Use **`supabase start`** — local Postgres + Auth + Realtime in Docker, same migrations, same RLS policies, no cost, and it makes the RLS story testable locally. If you'd rather not add the Supabase CLI, one `postgres:17` service in a `docker-compose.yml` gets you most of the parity.

### Go ↔ Supabase connection notes (these will bite)

- **IPv6.** New Supabase projects expose direct connections over **IPv6 only**. Your EC2 box either needs IPv6 enabled, or you use Supavisor.
- **Pooler vs prepared statements.** Through the **transaction pooler (6543)**, prepared statements break — with `pgx` you must set `statement_cache_mode=describe` or use the simple protocol. For a long-lived Go server, prefer the **session pooler (5432)** or direct-via-IPv6 over the transaction pooler.
- **RLS is silently bypassed if identity doesn't flow into the session.** Policies evaluate `auth.uid()` from JWT claims; a service connecting as `postgres` or `service_role` **bypasses every policy**. So RLS can *look* like security while enforcing nothing. To get real enforcement, connect as a non-bypass role and set the claims per transaction:

  ```sql
  SET LOCAL role = 'authenticated';
  SET LOCAL request.jwt.claims = '<the user''s JWT>';
  ```

  Or decide deliberately that authorization lives in your Go code and treat RLS as local-dev tooling only. **Pick one and write it down.** RLS that provides false confidence is worse than no RLS.
- **Use `pgx` directly**, not the PostgREST REST API, from Go — otherwise `sqlc` and your typed queries are wasted. PostgREST is for a browser SDK; your SPA talks to your Go API instead.

### 3.2 Realtime: your own hub, or Supabase's?

Two viable paths. The trade-off stated plainly:

**Path A — your own Go hub, Supabase JWT verified at connect.** Keeps your stated learning goal and keeps you in control of socket semantics (heartbeat, backpressure, drop-slow-client). Auth becomes *easy and safe*: verify a Supabase-issued JWT against the project's JWKS — roughly 20 lines, no OAuth flow at all. Fan-out is `map[stationID]map[*Client]struct{}`.

**Path B — Supabase Realtime.** Subscribe to `postgres_changes` on `messages`, filtered by `station_id`, gated by RLS:

```ts
supabase
  .channel(`station:${id}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages", filter: `station_id=eq.${id}` },
    handler,
  )
  .subscribe();
```

Postgres Changes now supports AND filters across multiple columns, extra operators, and column selection — so this is genuinely capable. It deletes the hub, socket auth, heartbeat, and backpressure concerns outright.

**Recommendation: Path A.** Learning is your reason #1, the hub *is* the interesting part of this app, and Path B would reduce the Go service to a Spotify proxy — which undercuts the whole point of the port. Record Path B as the escape hatch if the hub becomes a slog. **Don't build both.**

### Revised recommendation: `huma`, not protobuf

I suggested Connect/protobuf earlier. On reflection that's over-engineered for this scale: `.proto` files, `buf.yaml`, `buf.gen.yaml`, `protoc-gen-go`, `protoc-gen-connect-go`, `protoc-gen-es`, plus `connect-query` — that's six moving parts and a codegen pipeline to maintain, for **18 endpoints**.

`huma` is code-first (like tRPC): you define a Go struct, and you get request validation, response schema, OpenAPI docs, *and* the handler contract in one place. Then one command generates TS types:

```go
type SendMessageInput struct {
    Body struct {
        Text string `json:"text" maxLength:"2000"`
    }
}
// huma.POST/GET … → OpenAPI 3.1 at /openapi.json
```

```bash
npx openapi-typescript http://localhost:8080/openapi.json -o src/api/schema.d.ts
```

Same server-is-the-source-of-truth feel as tRPC, one codegen command, no schema IDL to maintain. If you later want true RPC semantics (streaming, binary payloads), Connect is there — but you won't need it.

---

## 4. Repo layout

```text
radiofy/
├── cmd/radiofy/main.go            # wiring: config, pgx pool, huma, hub, embed.FS
├── internal/
│   ├── auth/                      # oauth2 flow, session cookie, middleware
│   ├── hub/                       # rooms: map[stationID]map[*Client]struct{}
│   ├── api/                       # huma operations (one file per resource)
│   ├── spotify/                   # per-request client, token refresh
│   └── store/                     # sqlc-generated + thin wrappers
├── db/
│   ├── migrations/*.sql           # goose
│   └── queries/*.sql              # sqlc
├── web/                           # Vite SPA (the kept React code)
│   ├── src/
│   └── dist/                      # → //go:embed
├── sqlc.yaml
├── Caddyfile
└── deploy/radiofy.service
```

**Layering rule to protect yourself from inertia:** `internal/hub` may not import `internal/api`. The hub is transport-agnostic; the API translates. This keeps the fan-out testable without a socket.

---

## 5. Migration order

Ordered so you are never blocked and never lose the old version.

**Phase 0 — Freeze the reference.**
Tag the current state (`git tag pre-go-port`) and push. The old Next app stays runnable in `main`'s history. Do not delete anything until the Go version serves real traffic.

**Phase 1 — Schema first. The domain model is the asset.**
Port `prisma/schema.prisma` → `goose` migrations + `sqlc` queries. Fix in the port, don't defer:

- `MessageType` enum (`CHAT` | `TRACK`) + `CHECK` enforcing the XOR
- `station_members` join table (**C9 — the thing most likely to be permanently skipped**)
- indexes on `(station_id, created_at)` and `(user_id)`
- `created_at TIMESTAMPTZ DEFAULT now()`
- `ON DELETE CASCADE` on the FKs that lack it
- a seed script (replace the committed `db.sqlite`)
Write a couple of `sqlc`-driven tests here. This phase is mechanical and it's the foundation — don't rush it.

**Phase 2 — Auth. Do the risky thing when you have the most energy.**
OAuth2 → Spotify, session cookie, refresh rotation, auth middleware. See §6.1. Don't proceed until a real Spotify login round-trips and the cookie survives a restart.

**Phase 3 — Reads. Prove the codegen pipeline end-to-end.**
`getOwned`, `getStation` (with the pagination fix). Generate TS types, wire the existing React app to the Vite dev server, get the station list and chat history rendering. **This phase is where you find out whether the type-safety story works** — if it doesn't, you want to know here, not in Phase 6.

**Phase 4 — Writes + the hub. This is the point of the exercise.**
`send-message`, `play` (with the upsert), and the `hub` room fan-out. One `/ws` endpoint, authenticated at connect, with heartbeat + `maxPayload` + origin check. This is the phase that makes the original architecture correct.

**Phase 5 — Spotify proxy.**
The 10 `spotify.*` endpoints as a per-request client. Narrow token endpoint for the Web Playback SDK (appraisal H3). This kills C1.

**Phase 6 — Next → Vite. Mechanical, do it last.**

- `next/link` → `react-router-dom` `Link` (2 sites)
- `next/router` `useRouter().query` → `useParams` (2 sites)
- `next/head` → `document.title` or `react-helmet-async` (1 site)
- `next/image` → plain `<img>` (1 site)
- Headless UI `Listbox`/`Transition`/`Combobox` → Radix `Select` + Tailwind `data-state` animations (4 files: `Devices`, `Queue`, `Playlist`, `PlaylistBar`)
- `react-beautiful-dnd` → `@hello-pangea/dnd` (1 file)
- **Fix the carried-over frontend bugs while you're in each file (§2)**

That's the whole Next surface: **6 import lines.** It is not a scary phase.

**Phase 7 — Deploy.** Binary + Postgres + Caddy + systemd on one box.

---

## 6. The traps

### 6.1 Auth — rescoped now that Supabase owns the OAuth flow

**Supabase removed the hard part.** `state`/PKCE, the callback, session issuance, and cookie flags are Supabase's problem, not yours. What remains is much smaller, and each item is worth doing carefully:

- **Verify the JWT properly.** Fetch the project's JWKS, verify signature, `iss`, `aud`, and `exp`, and cache the keys. Use a maintained library (`github.com/golang-jwt/jwt/v5` with a JWKS keyfunc, or `github.com/MicahParks/keyfunc`). Do **not** decode-and-trust.
- **Verify it at WS connect**, not per message — then attach the resolved user to the connection.
- **Own the Spotify refresh loop.** Store the refresh token server-side (encrypted at rest is the right call), refresh before expiry, and **serialise concurrent refreshes** so two requests don't race the rotation and invalidate each other. This is the most likely source of a subtle production bug in the new service — Spotify rotates refresh tokens, so a lost race can lock a user out.
- **Never trust the browser's `provider_token`.** It's in the client session and expires in ~60 min; the SPA must go through your Go proxy (appraisal H3).
- **Same-origin CSRF.** Your SPA is same-origin, so requiring a custom header (e.g. `X-Requested-With`) on state-changing endpoints is the lazy-correct defence — browsers won't send it cross-origin without a preflight. Cheaper than a token endpoint and sufficient here.
- **Decide the RLS question in §3.1** and either implement the claims flow or document that authorization is in Go.
- One test that asserts a tampered/garbage JWT is rejected at both HTTP and WS.

This is still the one area where "lazy" is the wrong instinct — but it's now ~10% of the surface it would have been.

### 6.2 Don't build a framework

The real risk of a Go rewrite isn't the language, it's the temptation to build infrastructure. You have **18 endpoints**. Eighteen handlers. Do not build:

- a `Repository` interface per table (you have one database)
- a service layer that only forwards calls
- a DI container (`main.go` wiring is clearer)
- a custom router, a custom middleware chain, a custom error framework
- generics for a "generic CRUD handler"

`huma` + `sqlc` already removed the boilerplate you'd be tempted to abstract. If you find yourself writing an interface with one implementation, stop.

### 6.3 Hub correctness

- One goroutine owns the room map; communicate via channels, or guard with `sync.RWMutex`. Don't do both.
- `map[stationID]map[*Client]struct{}` — real rooms, not broadcast-and-filter (fixes appraisal C9/M5).
- Bounded per-client send buffer. **A slow client must not block the hub.** On overflow: drop the client, don't block the room.
- `SetReadLimit` (the `ws` default in Node was 100 MB — don't repeat that).
- Heartbeat: ping every ~30s, `CloseNow()` on a missed pong. Half-open TCP is the #1 socket leak.
- Subscription handlers emit; they never mutate.

### 6.4 The types pipeline

- Commit the generated `schema.d.ts` so a broken codegen step fails CI rather than silently drifting.
- Add one integration test that hits a real endpoint through the generated types.

---

## 7. Hosting — the honest cost picture

The "cheaper to run" argument is **valid but slightly oversold**, and worth being precise about before you commit to EC2 specifically.

**What's genuinely true:** a Go binary + Postgres on one box is far cheaper *to operate* than a Node app of the same shape — no runtime, no build step on the box, ~15 MB resident, holds thousands of idle sockets, and `systemctl restart` is the whole deploy.

**Where "EC2 is cheap" needs a caveat:** on-demand `t4g.nano` is ~$4/mo, but AWS adds EBS, a public IPv4 (~$3.60/mo now), and egress. Realistically ~$8–12/mo for a small app — versus Hetzner CX22 (~€4), Fly.io, or Railway, which are usually cheaper for this profile. Choose EC2 if you want to learn AWS or already have credits; choose Hetzner/Fly if the goal is purely minimal cost. Either way the Go binary deploys identically, which is the point.

**Sizing note (revised for Supabase):** the earlier tension — fitting Go *and* Postgres into 512 MB — disappears, because Postgres is managed. A `t4g.nano` or `t4g.micro` (1 GB) is plenty for a Go binary holding a few thousand idle sockets. You also never back up a database you own, and Supabase's free tier will likely cover this app outright — so the realistic marginal cost is **just the VM**, which is what makes the "cheaper to run" argument actually land. Budget ~$4–8/mo total (Hetzner CX22 or t4g.micro), not the $8–12 a self-hosted Postgres on EC2 implied.

**Scaling honesty:** one box means the in-process hub is *correct* and no Redis is needed. The moment you run a second instance you need Redis pub/sub (or PG `LISTEN/NOTIFY`) and sticky sessions. **Do not build that now.** Note it in the README as the scale-out step and move on.

---

## 8. Keep verbatim from the current repo

The port is worth doing partly because these survive intact:

1. **The domain model** — one `Message` stream carrying both chat and track events, so a station's timeline *is* its playback log. It's ~150 lines of Prisma and it becomes ~150 lines of SQL. This is the asset; don't redesign it.
2. **`LikeButton`'s optimistic update** (cancel → snapshot → set → rollback → invalidate). Ports to TanStack Query v5 almost line-for-line.
3. **The React components and Tailwind styling** — they're moving house, not being rewritten.
4. **The migrations discipline** — you already had real checked-in migrations. Keep `goose` files in `db/migrations/` and keep writing them by hand.
5. **The `createContext` seam idea** — one place where request-scoped dependencies (session, db handle, per-request Spotify client) are assembled. In Go that becomes a small `deps` struct on the handler set, injected once in `main.go`.

---

## 9. Definition of done for the port

- [ ] One `go build` produces a binary that serves API + WS + SPA
- [ ] `psql` schema has the enum, the XOR check, `station_members`, and the two indexes
- [ ] RLS is either genuinely enforced from Go (§3.1 identity flow) or explicitly documented as dev-only — not silently bypassed
- [ ] The Spotify refresh loop is server-side, serialised, and survives an expiry mid-session
- [ ] Local dev and production run the *same* Postgres, not SQLite
- [ ] A real Spotify login round-trips; tampered cookies are rejected
- [ ] Two browsers in two rooms: messages and track events land only in the right room
- [ ] No module-level mutable state anywhere (`go vet` + a read of `main.go`)
- [ ] `openapi.json` regenerates cleanly and the frontend type-checks against it
- [ ] Zero Next.js imports remain
- [ ] The carried-over frontend bugs in §2 are closed
- [ ] `pre-go-port` tag still builds, in case you need to look
