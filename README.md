# Making Monsters

Project Status: Experiment

## Stack

1. [Taskfile](https://taskfile.dev/): Document all CLI commands here.
2. [Svelte](https://svelte.dev/): Front End Framework
3. [Vite](https://vite.dev/): Better WebPack
4. [Deno](https://github.com/denoland/deno): NPM replacement
5. [Go](https://go.dev/): Backend language (may not be needed if we don't need to provide PB as a framework)
6. [PocketBase](https://pocketbase.io/): Backend-as-a-Service
7. [DaisyUI](https://daisyui.com/): Easy way to get professional layouts quickly.
8. [Polar](https://polar.sh/): Billing
9. [Docker](https://www.docker.com/): Necessary for wrapping static sites into the backend deployment.
10. [fly.io](https://fly.io/): Hosting
11. [OpenTofu](https://opentofu.org/): Manage infrastructure alongside fly.toml files.
12. [Grafana](https://grafana.com/): Extended metrics and logs. May not be needed at the start.
13. [k6](https://k6.io/): Load testing tool
14. [Cucumber-JS](https://www.npmjs.com/package/@cucumber/cucumber): Gherkin language support for JS
15. [Puppeteer](https://pptr.dev/): Browser automation

## Project Structure

```
/client/*: all frontend code
/server/*: all backend code
/iac/*: all OpenTofu, fly.toml, Dockerfiles, etc.
/features/*: all .feature files
/tests/*: all feature file definitions
/Taskfile.yml: cli command documentation
/CLAUDE.md: agent instructions file
/LICENSE: an MIT license to Ivy Puckett
/README.md: human-facing documentation of what this project is, how to develop against it, etc.
```
