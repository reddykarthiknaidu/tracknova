# TrackNova

Real-time public transport tracking web app for Chennai, India — covering MTC buses, Metro, and Suburban Rail.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/tracknova run dev` — run the frontend (port 25494)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Clerk setup

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS v4, Wouter routing, react-leaflet maps
- API: Express 5 + Clerk Auth proxy middleware
- Auth: Clerk (Replit-managed), cookies on web
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Source of truth for all API contracts
- `lib/db/src/schema/routes.ts` — DB schema (routes, stops, vehicles, favorites)
- `backend/src/routes/transport.ts` — All transport API routes
- `backend/src/middlewares/clerkProxyMiddleware.ts` — Clerk auth proxy
- `frontend/src/` — React frontend (pages, components, map)
- `lib/api-client-react/src/generated/` — Auto-generated API hooks (do not edit)

## Architecture decisions

- Clerk Auth (Replit-managed) for registration/login — cookie-based on web, no manual token handling needed
- OpenAPI-first contract: all endpoints defined in `openapi.yaml`, hooks + Zod schemas auto-generated
- Transport data is static seed data (Chennai real routes/stops), vehicles simulated; future: integrate GTFS real-time feeds
- react-leaflet with OpenStreetMap tiles for interactive maps, centered on Chennai (13.0827, 80.2707)
- Favorites are user-scoped by Clerk userId, stored in DB

## Product

TrackNova lets Chennai commuters:
- View all MTC bus, Metro, and Suburban Rail routes with stops
- See live vehicle positions on an interactive map
- Check upcoming arrival times at any stop
- Save favorite routes and stops for quick access
- Register/login with email or Google OAuth via Clerk

## User preferences

_Populate as you build._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after changing schema files
- Clerk proxy middleware must be mounted BEFORE `express.json()` in `app.ts`
- Leaflet CSS must be imported — the design subagent added it to `index.css`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth troubleshooting
