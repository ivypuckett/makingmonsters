# CLAUDE.md — Making Monsters

This file provides guidance for AI assistants working in this repository.

## Project Overview

**Making Monsters** is an experimental web application. The project is in early stages with a working frontend and planned backend/infrastructure components.

**Status:** Experiment

## Repository Structure

```
makingmonsters/
├── client/                  # Svelte frontend application
│   ├── src/
│   │   ├── main.js          # App entry point
│   │   ├── App.svelte       # Root component
│   │   ├── app.css          # Global styles (Tailwind + DaisyUI)
│   │   ├── lib/             # Reusable Svelte components
│   │   └── assets/          # Images and SVGs
│   ├── public/              # Static public assets (favicon, icons)
│   ├── index.html           # HTML entry point
│   ├── package.json
│   ├── vite.config.js
│   └── svelte.config.js
├── Taskfile.yml             # Task runner (see Commands section)
├── README.md
├── LICENSE                  # MIT
└── CLAUDE.md                # This file
```

### Planned (not yet implemented)
- `server/` — PocketBase/Go backend
- `iac/` — OpenTofu infrastructure as code
- `features/` — Cucumber Gherkin feature files
- `tests/` — Puppeteer E2E and k6 load tests

## Tech Stack

### Frontend (implemented)
| Tool | Version | Purpose |
|------|---------|---------|
| Svelte | 5.x | Component framework |
| Vite | 8.x | Build tool + dev server |
| Tailwind CSS | 4.x | Utility-first CSS |
| DaisyUI | 5.x | Pre-built UI components |

### Planned
- **PocketBase** — Backend-as-a-service
- **Go** — Backend language
- **Deno** — NPM replacement (future)
- **Docker** — Containerization
- **fly.io** — Hosting
- **OpenTofu** — Infrastructure as code
- **Grafana** — Metrics and logging
- **Cucumber-JS + Puppeteer** — BDD and E2E testing
- **k6** — Load testing

## Commands

Use [Taskfile](https://taskfile.dev/) from the repo root, or npm scripts from `client/`.

| Task command | npm equivalent | Description |
|---|---|---|
| `task client:install` | `npm install` | Install frontend dependencies |
| `task client:dev` | `npm run dev` | Start dev server with HMR |
| `task client:build` | `npm run build` | Production build → `client/dist/` |
| `task client:preview` | `npm run preview` | Preview production build |

Run `task` with no arguments to list all available tasks.

## Code Conventions

### File naming
- Svelte components: `PascalCase.svelte` (e.g., `Counter.svelte`)
- JavaScript files: `camelCase.js` (e.g., `main.js`)
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

1. Install dependencies: `task client:install`
2. Start dev server: `task client:dev` (hot module replacement enabled)
3. Make changes — Svelte component state is preserved across HMR updates unless the component's `<script>` block changes
4. Build for production: `task client:build`

## Testing

No test suite exists yet. When added, the plan is:
- **Cucumber-JS** for Gherkin BDD specs in `features/`
- **Puppeteer** for browser-based E2E tests in `tests/`
- **k6** for load testing

## Git

- Default branch: `main`
- Commit signing is enabled (SSH key)
- The `.gitignore` excludes `node_modules/`, `dist/`, and `.env` files
- Branch naming for AI assistants: `claude/<description>-<session-id>`

## Environment Variables

No `.env` file exists yet. When the backend is added, document required variables here with a `.env.example` file.

## Notes for AI Assistants

- The project is intentionally minimal — avoid adding complexity beyond what is requested
- When adding components, follow the Svelte 5 runes pattern shown in `src/lib/Counter.svelte`
- There is no linter or formatter configured yet; maintain consistency with existing code style
- No CI/CD pipeline exists; changes are manually built and deployed
- The `client/` directory is a self-contained Vite app; all frontend work happens there
