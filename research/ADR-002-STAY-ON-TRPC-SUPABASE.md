# ADR-002 — Stay on TypeScript: upgrade Next + tRPC to latest, move to Supabase

**Status:** Accepted
**Date:** 2026-10-20
**Supersedes:** `ADR-001-GO-PORT-PLAN.md` (Go port — rejected)
**Companion:** `CODEBASE-APPRAISAL.md` — the findings this decision must still fix

---

## Context

ADR-001 proposed porting the backend to Go, motivated by (1) learning Go, (2) WebSocket handling and single-box cost, (3) the repo already being broken.

Evaluating Supabase removed Go's *technical* justification on points 2 and 3:

1. **tRPC v11 subscriptions run over SSE** (`httpSubscriptionLink`) through a normal HTTP handler — no WebSocket server required. The separate `ws-server.ts` process, the second port, and the two-process split-brain disappear with a link swap.
2. **Supabase covers auth and realtime for either stack.** Spotify is a first-class Supabase Auth provider, so NextAuth's hand-rolled token/refresh logic goes away. Supabase Realtime can remove custom fan-out entirely.

That leaves Go's advantages as: free end-to-end types (which favours TypeScript) and binary/runtime/toolchain (worth ~€0 at this scale on a Hetzner CX22, and the churn was self-inflicted by five abandoned branches rather than by Node). Reason (3) justifies *a* recovery, not Go specifically. Only reason (1) survives — and it does not carry the cost.

**Decision: keep tRPC and Next, upgrade both to current, adopt Supabase.**

---

## Decision

| Concern | Decision |
| --- | --- |
| Frontend framework | Keep **Next.js**, upgraded to latest. Vite migration deferred, not adopted. |
| API layer | **tRPC v11** (via v10 — v9→v10 is the breaking step) |
| Client packages | `@trpc/react` → **`@trpc/react-query`** + **TanStack Query v5** |
| Realtime | **tRPC v11 SSE** (`httpSubscriptionLink`). Delete `src/server/ws-server.ts`, the `dev:ws` script, and port `:3001`. |
| Database | **Supabase Postgres**. SQLite dropped entirely, local dev included. |
| Local dev | **`supabase start`** — same Postgres, Auth and RLS as production |
| Auth | **Supabase Auth**, Spotify provider. NextAuth removed. |
| Authorization | **RLS policies** over `station_members` — with the identity-flow constraint below |
| React | 19 (already partially installed) |
| Domain model | Unchanged. The unified timeline is the asset. |

---

## Consequences

### What this does not fix

**The upgrade fixes the tRPC-version errors and nothing else.** The ~18 design findings are stack-independent and cost the same in any language. They must be fixed deliberately:

C1 shared Spotify singleton · C2 server-side session resolution · C5 ambient `prisma` · C6 missing `PlaybackContext` upsert · C7 backwards pagination · C8 missing indexes · C9 missing membership model · C10 unmodelled `Message` discriminant · M4 `z.any()` on `playTrackSchema` · frontend: H4, M6, M7, M8, M11, M12

### Migration shape

- **Every frontend tRPC call site changes.** v10 replaced the array syntax `trpc.useQuery(["station.getStation", input])` with proxy syntax `trpc.station.getStation.useQuery(input)`. ~10 components.
- **Every router file changes.** `createRouter()` + `.query("name", { resolve })` + `.merge()` → `initTRPC` + `publicProcedure.query()` + `router({...})`. `new trpc.Subscription` → async generator. ~5 files.
- **Next 12 → 16** on the Pages Router: `next/link` no longer takes an `<a>` child (2 sites), `next/image` prop changes (1 site), `images.domains` → `remotePatterns`.
- Do it in two steps — v9→v10, green build, then v10→v11.

### Constraints that are not optional

1. **Supabase does not refresh the Spotify provider token.** `provider_token` expires after ~60 minutes and is not renewed. The server-side refresh loop stays, must be **serialised** (Spotify rotates refresh tokens, so a lost race locks a user out), and must never be replaced by the browser's provider token.
2. **RLS is bypassed unless identity flows into the session.** A connection using `service_role` or `postgres` ignores every policy. Either set `SET LOCAL role='authenticated'; SET LOCAL request.jwt.claims='…'` per transaction, or decide explicitly that authorization lives in application code and RLS is local-dev tooling only. Assuming RLS protects the API without wiring this is the failure mode.
3. **SSE requires HTTP/2.** Browsers cap HTTP/1.1 at ~6 connections per origin and each SSE stream holds one. Caddy does HTTP/2 by default; do not put this behind HTTP/1.1.
4. **Local dev must be Postgres, not SQLite.** Postgres `ENUM` is what allows `message.type` (C10) to be a real type, and SQLite cannot do RLS at all. Dev/prod divergence here is not free — it fails exactly where the schema work is.

### Hygiene this decision depends on

The repo is in its current state because of five abandoned upgrade branches and no safety net — not because of the framework. This decision only works if that changes:

- `strict: true` (currently `false`, which is hiding real bugs)
- CI running `tsc --noEmit` and tests on push
- Delete the five stalled upgrade branches (`next-13`, `trpc-10`, `upgrade-trpc`, `feature/upgrade-next`, and the `codex/*` pair)
- A handful of regression tests on the paths that keep breaking

---

## Rejected alternatives

- **Go port** (`ADR-001`) — rejected on cost, not on merit. Learning Go remains a legitimate motivation; it just doesn't pay for a backend rewrite whose technical advantages Supabase and SSE already provide.
- **Firebase** — three independent disqualifiers: no Spotify auth provider (the OAuth flow would be hand-rolled anyway, in a second runtime); Firestore has no joins, so the unified timeline becomes denormalisation plus hand-maintained composite indexes; its realtime would replace the backend entirely.
- **Vite migration** — deferred. A separate, cheap decision later: the Next-specific surface is 6 import lines.
- **SQLite for local dev** — see constraint 4.
- **Hand-rolled WebSockets** — superseded by SSE.

---

## Definition of done

- [ ] `next build` and `tsc --noEmit` green with `strict: true`
- [ ] No `ws-server.ts`, no `dev:ws`, no port 3001 — one process
- [ ] Real Spotify login via Supabase; tampered JWT rejected on HTTP and on the SSE stream
- [ ] Two browsers in two rooms receive only their own station's events
- [ ] The RLS question is answered in writing (enforced, or explicitly dev-only)
- [ ] Critical findings in Consequences are closed
- [ ] Local dev and production run the same Postgres

---

## References

- [tRPC — HTTP Subscription Link (SSE, no WebSocket server)](https://trpc.io/docs/client/links/httpSubscriptionLink)
- [Supabase — Sign in with Spotify](https://supabase.com/docs/guides/auth/social-login/auth-spotify)
- [Supabase discussion — provider_token is not refreshed](https://github.com/orgs/supabase/discussions/33828)
