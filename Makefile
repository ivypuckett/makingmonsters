# Makefile — Making Monsters
#
# Replaces the previous Taskfiles. Frontend (npm) work runs in ./client.
# The full stack (frontend + PocketBase) runs via Docker — see `make deploy`
# and iac/Dockerfile.
#
# Run `make` (or `make help`) to list targets.

CLIENT_DIR := client

.DEFAULT_GOAL := help
.PHONY: help install dev watch build preview test deploy

help: ## List available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Install frontend dependencies
	cd $(CLIENT_DIR) && npm install

dev: install ## Start the standalone Vite dev server with HMR
	cd $(CLIENT_DIR) && npm run dev

watch: install ## Watch source files and rebuild to build/pb_public/
	cd $(CLIENT_DIR) && npm run watch

build: install ## Production build → build/pb_public/
	cd $(CLIENT_DIR) && npm run build

preview: build ## Preview the production build locally
	cd $(CLIENT_DIR) && npm run preview

test: install ## Run frontend unit tests (Vitest)
	cd $(CLIENT_DIR) && npm test

deploy: ## Deploy to fly.io (the Docker image builds the frontend + bundles PocketBase)
	flyctl deploy --config iac/fly.toml
