# CLAUDE.md — Making Monsters

This file provides guidance for AI assistants working in this repository.

## Project Overview

**Making Monsters** is an experimental web application. The project is intentionally minimal: a Svelte frontend served by a stock PocketBase backend, deployed to fly.io.

**Status:** Experiment

## Repository Structure

```
makingmonsters/
├── build/                   # Frontend build output (git-ignored)
│   └── pb_public/           # Compiled Svelte frontend (served by PocketBase as ./pb_public in the image)
├── client/                  # Svelte frontend application
│   ├── src/
│   │   ├── main.js          # App entry point
│   │   ├── App.svelte       # Root component
│   │   ├── app.css          # Global styles (Tailwind + DaisyUI)
│   │   ├── lib/             # Reusable Svelte components (+ *.test.js unit tests)
│   │   └── assets/          # Images and SVGs
│   ├── public/              # Static public assets (favicon, icons)
│   ├── index.html           # HTML entry point
│   ├── package.json         # Frontend npm scripts (dev, build, watch, preview, test)
│   ├── vite.config.js       # Vite + Vitest config
│   ├── vitest-setup.js      # Test setup (jest-dom matchers)
│   └── svelte.config.js
├── pb_migrations/           # PocketBase JS schema migrations (auto-applied on serve)
├── pb_hooks/                # PocketBase JS hooks (event-sourcing projection reducer)
│   ├── character_projection.pb.js
│   └── lib/projection.js    # fold logic, required by the hook
├── iac/                     # Infrastructure as code
│   ├── Dockerfile           # Multi-stage build: builds Svelte frontend + bundles stock PocketBase (+ pb_migrations, pb_hooks)
│   └── fly.toml             # fly.io app configuration (app name, region, volume mount)
├── .claude/
│   └── settings.json        # Claude Code hooks and permissions
├── package.json             # Root npm scripts — delegate to client/ + deploy (see Commands section)
├── README.md
├── LICENSE                  # MIT
└── CLAUDE.md                # This file
```

### Planned (not yet implemented)
- **Grafana** — Metrics and logging
- **k6** — Load testing
- Browser-based E2E tests

## Tech Stack

### Frontend (implemented)
| Tool | Version | Purpose |
|------|---------|---------|
| Svelte | 5.x | Component framework |
| Vite | 8.x | Build tool + dev server |
| Tailwind CSS | 4.x | Utility-first CSS |
| DaisyUI | 5.x | Pre-built UI components |
| Vitest | 3.x | Unit test runner |

### Backend (implemented)
| Tool | Version | Purpose |
|------|---------|---------|
| PocketBase | 0.23.0 | Backend-as-a-service (auth, DB, file storage, REST API) — used as the **stock release binary**, no custom code |

There is no custom Go code. The backend is the official PocketBase release, which serves the built frontend from `pb_public/` and exposes its REST/realtime API and admin UI out of the box. Server-side logic is added with the stock binary's **JSVM** support — schema lives in `pb_migrations/` and hooks live in `pb_hooks/` (no recompile). If heavier custom routes are needed later, reintroduce a small Go module that extends PocketBase and build it in place of the downloaded binary.

### Character event sourcing (implemented)

A character is an event-sourced aggregate. `pb_migrations/` defines the collections and `pb_hooks/` folds events into read models:

- **`characters`** — aggregate root (`owner`, `head_seq`).
- **`events`** — append-only source of truth (`character`, `seq`, `type`, `payload`). API update/delete rules are `null` (immutable history); `(character, seq)` is unique.
- **`attributes` / `conditions` / `actions`** — server-managed projections rebuildable from `events`; clients read them but only the hook writes them.

Event `type`s: `attr_upsert|attr_delete|attr_set`, `cond_upsert|cond_delete|cond_toggle`, `action_upsert|action_delete|action_trigger`. On each appended event the `character_projection` hook validates the per-character sequence (`head_seq + 1`), rejects cyclic attribute dependencies, applies the projection, and bumps `head_seq` — all in the event's transaction, so a failure rolls the event back.

### Infrastructure (implemented)
| Tool | Purpose |
|------|---------|
| Docker | Multi-stage build — builds the Svelte frontend and bundles the stock PocketBase binary |
| fly.io | App hosting + persistent volume for PocketBase data (configured entirely in `fly.toml`) |

### Testing (implemented)
| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 3.x | Frontend unit tests (jsdom + @testing-library/svelte) |

### Planned
- **Deno** — NPM replacement (future)
- **Grafana** — Metrics and logging
- **k6** — Load testing

## Commands

Run npm scripts from the repo root (they delegate into `client/`), or run them directly from `client/`.

The root `package.json` has no dependencies of its own — its scripts just invoke `npm --prefix client …`, plus a `deploy` script for fly.io. Install once with `cd client && npm install` (the SessionStart hook does this automatically for Claude Code sessions).

**Frontend** (run from the repo root; each delegates to the matching script in `client/`)

| Root command | Runs in `client/` | Description |
|---|---|---|
| `npm run dev` | `npm run dev` | Start standalone Vite dev server with HMR |
| `npm run watch` | `npm run watch` (`vite build --watch`) | Watch source files and rebuild to `build/pb_public/` |
| `npm run build` | `npm run build` | Production build → `build/pb_public/` |
| `npm run preview` | `npm run preview` | Preview production build |
| `npm test` | `npm test` | Run frontend unit tests (Vitest) |

**Deploy**

| Root command | Description |
|---|---|
| `npm run deploy` | Deploy to fly.io — `flyctl deploy --config iac/fly.toml` (the Docker image builds the frontend and bundles PocketBase) |

To run the full stack (frontend + PocketBase) locally, build the Docker image from `iac/Dockerfile` and run it.

Run `npm run` with no script name to list all available scripts.

## Code Conventions

### File naming
- Svelte components: `PascalCase.svelte` (e.g., `Counter.svelte`)
- JavaScript files: `camelCase.js` (e.g., `main.js`); unit tests: `*.test.js`
- CSS files: `kebab-case.css` (e.g., `app.css`)

### Svelte
- Use **Svelte 5 runes** for reactivity (`$state`, `$derived`, `$effect`)
- Do not use Svelte 4 `$:` reactive declarations or `writable`/`readable` stores
- Keep components in `src/lib/` for reusability; page-level components go in `src/`

### Styling
- Use **Tailwind utility classes** for layout and spacing
- Use **DaisyUI component classes** for pre-styled UI elements (buttons, cards, etc.)
- Global styles (e.g., `@import "tailwindcss"`, plugin declarations) go in `src/app.css`
- Avoid writing custom CSS unless Tailwind/DaisyUI cannot cover the case

### JavaScript
- ES modules throughout (`"type": "module"` in package.json)
- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports
- `checkJs` is enabled — keep code type-safe without requiring `.ts` extensions

## Development Workflow

### Frontend iteration (most common)
1. `npm run dev` (from the root or `client/`) — starts the Vite dev server with HMR
2. Make changes — Svelte component state is preserved across HMR updates unless the `<script>` block changes
3. `npm test` — run unit tests

Since the backend is stock PocketBase, there is no backend code to iterate on; run PocketBase separately if you need its API during frontend work.

### Integrated (frontend served by PocketBase)
- The full stack runs via the Docker image (`iac/Dockerfile`), which builds the frontend and fetches the pinned PocketBase binary. Build and run it locally to serve the app on `:8090` (admin UI at `/_/`), or `npm run deploy` to ship it to fly.io. There is no standalone local PocketBase download.

### Backend notes
- The backend is the official PocketBase release binary (pinned via `PB_VERSION` in `iac/Dockerfile`). It serves `pb_public/` and stores data in `pb_data/`, both resolved next to the binary.
- In the Docker image they live under `/app`, with `pb_data` on the fly.io volume.

## Testing

Frontend unit tests run with **Vitest** (jsdom environment + `@testing-library/svelte`).

```bash
npm test           # from the root or client/
cd client && npm run test:watch   # watch mode
```

- Test files live next to the code they cover as `src/**/*.test.js`.
- `vite.config.js` selects Svelte's `browser` export condition under `mode === 'test'` so components mount correctly in jsdom; `vitest-setup.js` registers jest-dom matchers.
- A **SessionStart hook** in `.claude/settings.json` installs frontend dependencies when a Claude Code session starts.

### Environment notes for AI agents
- Package registries (npm) are generally reachable, so frontend install/build/test work in most sandboxes. The Docker build fetches the PocketBase release from GitHub, which may be blocked by network egress policy in some sandboxes; it succeeds wherever GitHub releases are reachable (e.g. the fly.io remote builder).

### Planned
- Browser-based E2E tests
- **k6** load tests

## Git

- Default branch: `main`
- Commit signing is enabled (SSH key)
- The `.gitignore` excludes `node_modules/`, `build/`, and `.env` files
- Branch naming for AI assistants: `claude/<description>-<session-id>`

## Environment Variables

No `.env` file exists yet. Deployment uses `flyctl`, which reads app configuration from `iac/fly.toml`:

| Variable | Where used | Description |
|---|---|---|
| `FLY_API_TOKEN` | `flyctl` | fly.io personal access token (for non-interactive deploys) |

App name and primary region are set in `iac/fly.toml`, not via environment variables. Create a `.env` file (excluded from git) for any secrets and source it before deploying.

## Notes for AI Assistants

- The project is intentionally minimal — avoid adding complexity beyond what is requested
- When adding components, follow the Svelte 5 runes pattern shown in `src/lib/Counter.svelte`
- There is no linter or formatter configured yet; maintain consistency with existing code style
- No CI/CD pipeline exists; changes are manually built and deployed
- The `client/` directory is a self-contained Vite app; all frontend work happens there
- If a file exceeds 400 lines, flag this to the user and suggest splitting it into smaller modules
- Keep this CLAUDE.md up to date as the project evolves — update it when new tools, directories, conventions, or workflows are introduced
