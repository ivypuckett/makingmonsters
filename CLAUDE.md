# CLAUDE.md — Making Monsters

This file provides guidance for AI assistants working in this repository.

## Project Overview

**Making Monsters** is an experimental web application. The project is intentionally minimal: a Svelte frontend served by a stock PocketBase backend, deployed to fly.io.

**Status:** Experiment

## Repository Structure

```
makingmonsters/
├── build/                   # All build output + local runtime (git-ignored); mirrors the Docker /app layout
│   ├── pb_public/           # Compiled Svelte frontend (served by PocketBase as ./pb_public)
│   ├── pb_data/             # PocketBase runtime data when run locally (created on first run)
│   └── pocketbase           # Downloaded stock PocketBase binary (see scripts/get-pocketbase.sh)
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
├── scripts/
│   └── get-pocketbase.sh    # Download the pinned PocketBase release binary into build/
├── iac/                     # Infrastructure as code
│   ├── Dockerfile           # Multi-stage build: builds Svelte frontend + bundles stock PocketBase
│   └── fly.toml             # fly.io app configuration (app name, region, volume mount)
├── .claude/
│   └── settings.json        # Claude Code hooks and permissions
├── Makefile                 # Command runner — frontend, serve, deploy (see Commands section)
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

There is no custom Go code. The backend is the official PocketBase release, which serves the built frontend from `pb_public/` and exposes its REST/realtime API and admin UI out of the box. If custom routes or hooks are needed later, reintroduce a small Go module that extends PocketBase and build it in place of the downloaded binary.

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

Use [Make](https://www.gnu.org/software/make/) from the repo root, or npm scripts from `client/`.

The root `Makefile` is the single command runner: frontend targets run `npm` in `client/`, and `serve`/`deploy` wire in PocketBase and fly.io. Prerequisite targets (e.g. `install` before `build`) run automatically — you only need to invoke the top-level target.

**Frontend**

| Make target | npm equivalent (in `client/`) | Description |
|---|---|---|
| `make install` | `npm install` | Install frontend dependencies |
| `make dev` | `npm run dev` | Start standalone Vite dev server with HMR |
| `make watch` | `npm run watch` (`vite build --watch`) | Watch source files and rebuild to `build/pb_public/` |
| `make build` | `npm run build` | Production build → `build/pb_public/` |
| `make preview` | `npm run preview` | Preview production build |
| `make test` | `npm test` | Run frontend unit tests (Vitest) |

**Root**

| Make target | Description |
|---|---|
| `make pocketbase` | Download the pinned PocketBase binary into `build/` if absent (no-op if present) |
| `make serve` | Build the frontend, download PocketBase if needed, and run it locally on `:8090` (serves `build/pb_public`) |
| `make test` | Run frontend unit tests |
| `make deploy` | Deploy to fly.io — `flyctl deploy --config iac/fly.toml` (the Docker image builds the frontend and bundles PocketBase) |

Run `make` (or `make help`) with no target to list all available targets.

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
1. `make dev` — installs dependencies automatically, then starts the Vite dev server with HMR
2. Make changes — Svelte component state is preserved across HMR updates unless the `<script>` block changes
3. `make test` — run unit tests

Since the backend is stock PocketBase, there is no backend code to iterate on; run PocketBase separately if you need its API during frontend work.

### Integrated (frontend served by PocketBase)
- `make serve` — builds the frontend to `build/pb_public/`, downloads the pinned PocketBase binary into `build/` if absent, then runs it from `build/` so it serves `./pb_public` and stores `./pb_data` beside the binary (mirroring the Docker `/app` layout). Visit `http://localhost:8090`; admin UI at `http://localhost:8090/_/`

### Backend notes
- The backend is the official PocketBase release binary (pinned to the version in `scripts/get-pocketbase.sh` and `iac/Dockerfile`). It serves `pb_public/` and stores data in `pb_data/`, both resolved next to the binary.
- Locally, both live under `build/` (git-ignored). In the Docker image they live under `/app`, with `pb_data` on the fly.io volume.

## Testing

Frontend unit tests run with **Vitest** (jsdom environment + `@testing-library/svelte`).

```bash
make test          # or: cd client && npm test
cd client && npm run test:watch   # watch mode
```

- Test files live next to the code they cover as `src/**/*.test.js`.
- `vite.config.js` selects Svelte's `browser` export condition under `mode === 'test'` so components mount correctly in jsdom; `vitest-setup.js` registers jest-dom matchers.
- A **SessionStart hook** in `.claude/settings.json` installs frontend dependencies when a Claude Code session starts.

### Environment notes for AI agents
- Downloading the PocketBase release from GitHub may be blocked by network egress policy in some sandboxes. Package registries (npm) are generally reachable, so frontend install/build/test work; the PocketBase binary download and the Docker build succeed wherever GitHub releases are reachable (e.g. the fly.io remote builder).

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
