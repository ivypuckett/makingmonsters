#!/usr/bin/env bash
# get-pocketbase.sh — Download the pinned PocketBase release binary into build/.
#
# The backend is the stock PocketBase release (no custom Go code). This script
# fetches the binary for the host OS/arch so it can serve the built frontend
# from build/pb_public. It is a no-op if the binary is already present.
#
# Override the version with PB_VERSION=x.y.z ./scripts/get-pocketbase.sh

set -euo pipefail

PB_VERSION="${PB_VERSION:-0.23.0}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/build"
BINARY="$BUILD_DIR/pocketbase"

if [ -x "$BINARY" ]; then
  echo "PocketBase already present at $BINARY (delete it to re-download)."
  exit 0
fi

# Map host OS/arch to PocketBase release asset names.
case "$(uname -s)" in
  Linux)  OS=linux ;;
  Darwin) OS=darwin ;;
  *) echo "ERROR: unsupported OS '$(uname -s)'. Download PocketBase manually from https://pocketbase.io/docs/" >&2; exit 1 ;;
esac

case "$(uname -m)" in
  x86_64|amd64) ARCH=amd64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) echo "ERROR: unsupported arch '$(uname -m)'." >&2; exit 1 ;;
esac

ASSET="pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"
URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${ASSET}"

echo "==> Downloading $ASSET ..."
mkdir -p "$BUILD_DIR"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if ! curl -fsSL "$URL" -o "$TMP/$ASSET"; then
  echo "ERROR: failed to download $URL" >&2
  echo "       If this is a sandboxed CI/agent environment, outbound access to" >&2
  echo "       github.com may be blocked by egress policy (often a 403). The" >&2
  echo "       download succeeds wherever GitHub releases are reachable, such as" >&2
  echo "       the fly.io remote builder. To supply the binary manually, place a" >&2
  echo "       'pocketbase' executable at $BINARY." >&2
  exit 1
fi
unzip -q -o "$TMP/$ASSET" -d "$TMP"
mv "$TMP/pocketbase" "$BINARY"
chmod +x "$BINARY"

echo "==> PocketBase v${PB_VERSION} installed at $BINARY"
