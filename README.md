# Making Monsters

Project Status: Experiment

## Stack

### In use
1. [Make](https://www.gnu.org/software/make/): Document all CLI commands here (`make` to list targets).
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
/scripts/*: helper scripts (e.g. download the PocketBase binary)
/iac/*: fly.toml + Dockerfile
/Makefile: cli command documentation
/CLAUDE.md: agent instructions file
/LICENSE: an MIT license to Ivy Puckett
/README.md: human-facing documentation of what this project is, how to develop against it, etc.
```
