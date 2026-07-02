# Making Monsters

Project Status: Experiment

## Stack

### In use
1. [npm scripts](https://docs.npmjs.com/cli/using-npm/scripts): CLI commands live in `package.json` (`npm run` to list them).
2. [Svelte](https://svelte.dev/): Front End Framework
3. [Vite](https://vite.dev/): Build tool + dev server
4. [DaisyUI](https://daisyui.com/): Easy way to get professional layouts quickly.
5. [Vitest](https://vitest.dev/): Frontend unit tests
6. [PocketBase](https://pocketbase.io/): Backend-as-a-Service (used as the stock release binary — no custom code)
7. [Docker](https://www.docker.com/): Wraps the static site + PocketBase into the deployment image.
8. [fly.io](https://fly.io/): Hosting

### Future / under consideration
- [Deno](https://github.com/denoland/deno): NPM replacement
- [Polar](https://polar.sh/): Billing
- [Grafana](https://grafana.com/): Extended metrics and logs
- [k6](https://k6.io/): Load testing tool

## Project Structure

```
/client/*: all frontend code (Svelte app + Vitest unit tests)
/iac/*: fly.toml + Dockerfile (builds the frontend + bundles PocketBase)
/package.json: root npm scripts (delegate to client/ + deploy)
/CLAUDE.md: agent instructions file
/LICENSE: an MIT license to Ivy Puckett
/README.md: human-facing documentation of what this project is, how to develop against it, etc.
```
