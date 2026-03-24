#!/usr/bin/env bash
# run-integration-tests.sh — Build, start the server, run Cucumber tests, then stop the server.
#
# Usage:
#   ./tests/run-integration-tests.sh          # full pipeline (build → start → test → stop)
#   ./tests/run-integration-tests.sh --skip-build   # skip Go build (use existing binary)
#
# Exit code: 0 if all tests pass, 1 otherwise.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
TESTS_DIR="$REPO_ROOT/tests"
BUILD_DIR="$REPO_ROOT/build"
BINARY="$BUILD_DIR/pocketbase"
PORT=8090
PID_FILE="$BUILD_DIR/.pocketbase.pid"
SKIP_BUILD=false

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
  esac
done

cleanup() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping PocketBase (pid $pid)..."
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT

# ---- 1. Install test dependencies ----
echo "==> Installing test dependencies..."
cd "$TESTS_DIR"
PUPPETEER_SKIP_DOWNLOAD=true npm install --silent 2>&1

# ---- 2. Build the server ----
if [ "$SKIP_BUILD" = false ]; then
  echo "==> Building PocketBase server..."
  mkdir -p "$BUILD_DIR"
  cd "$SERVER_DIR"
  go build -mod=vendor -o "$BINARY" .
fi

if [ ! -x "$BINARY" ]; then
  echo "ERROR: PocketBase binary not found at $BINARY"
  echo "  Run 'cd server && go build -mod=vendor -o ../build/pocketbase .' manually."
  exit 1
fi

# ---- 3. Start the server ----
# Check if something is already listening on the port
if curl -sf "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
  echo "==> Server already running on :$PORT — skipping start"
  EXTERNAL_SERVER=true
else
  echo "==> Starting PocketBase on :$PORT..."
  mkdir -p "$BUILD_DIR/public"  # ensure publicDir exists
  "$BINARY" serve --http="0.0.0.0:$PORT" --publicDir="$BUILD_DIR/public" &
  echo $! > "$PID_FILE"

  # Wait for the server to be ready (up to 15 seconds)
  echo -n "    Waiting for server"
  for i in $(seq 1 30); do
    if curl -sf "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
      echo " ready!"
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo " TIMEOUT"
      echo "ERROR: Server did not become ready within 15 seconds."
      exit 1
    fi
    echo -n "."
    sleep 0.5
  done
  EXTERNAL_SERVER=false
fi

# ---- 4. Run tests ----
echo "==> Running Cucumber integration tests..."
cd "$TESTS_DIR"
TEST_EXIT=0
npx cucumber-js --config cucumber.json || TEST_EXIT=$?

# ---- 5. Report results ----
if [ "$TEST_EXIT" -eq 0 ]; then
  echo "==> All tests passed!"
else
  echo "==> Tests failed (exit code $TEST_EXIT)"
fi

exit "$TEST_EXIT"
